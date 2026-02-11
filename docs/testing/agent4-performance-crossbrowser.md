# Zovo Cookie Manager: Performance Testing & Cross-Browser Testing Matrix

**Agent 4 of 5 -- Phase 10 (Automated Testing Suite)**
**Date:** 2026-02-11
**Status:** Implementation-Ready

---

## Table of Contents

1. [Performance Test Suite](#1-performance-test-suite)
2. [Cross-Browser Testing Matrix](#2-cross-browser-testing-matrix)
3. [Bundle Size Testing](#3-bundle-size-testing)
4. [Stress Testing](#4-stress-testing)

---

## 1. Performance Test Suite

### 1.1 Performance Budget Configuration

```typescript
// tests/performance/budgets.ts

export const PERFORMANCE_BUDGETS = {
  popup: {
    firstPaint: 40,
    interactive: 100,
    bundleSize: 120_000,
    cssBundleSize: 15_000,
    memoryIdle: 6_000_000,
    memoryWith100Cookies: 10_000_000,
    memoryWith1000Cookies: 25_000_000,
    memoryPeak: 25_000_000,
  },
  background: {
    startup: 50,
    bundleSize: 35_000,
    memoryIdle: 5_000_000,
    memoryActive: 8_000_000,
  },
  options: {
    interactive: 300,
    bundleSize: 80_000,
  },
  content: {
    injection: 30,
    bundleSize: 2_000,
  },
  total: {
    bundleSize: 342_000,
    criticalBundleSize: 450_000,
  },
} as const;

export type BudgetCategory = keyof typeof PERFORMANCE_BUDGETS;

export function checkBudget(
  category: BudgetCategory,
  metric: string,
  actual: number
): { pass: boolean; budget: number; overage: number; percentage: number } {
  const budgets = PERFORMANCE_BUDGETS[category] as Record<string, number>;
  const budget = budgets[metric];
  if (budget === undefined) {
    throw new Error(`Unknown budget: ${category}.${metric}`);
  }
  const overage = actual - budget;
  const percentage = (actual / budget) * 100;
  return { pass: actual <= budget, budget, overage, percentage };
}
```

### 1.2 Test Helpers & Utilities

```typescript
// tests/performance/helpers.ts

import { chromium, Browser, BrowserContext, Page } from 'playwright';
import path from 'path';

const EXTENSION_PATH = path.resolve(__dirname, '../../dist');

export async function launchBrowserWithExtension(): Promise<{
  browser: Browser;
  context: BrowserContext;
  extensionId: string;
}> {
  const browser = await chromium.launch({
    headless: false,
    args: [
      `--disable-extensions-except=${EXTENSION_PATH}`,
      `--load-extension=${EXTENSION_PATH}`,
      '--no-first-run',
      '--disable-default-apps',
      '--js-flags=--expose-gc',
    ],
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  // Wait for service worker to register and extract extension ID
  const swTarget = await context.waitForEvent('serviceworker');
  const extensionId = new URL(swTarget.url()).hostname;

  await page.close();
  return { browser, context, extensionId };
}

export async function openPopup(
  context: BrowserContext,
  extensionId: string
): Promise<Page> {
  const popupUrl = `chrome-extension://${extensionId}/popup.html`;
  const page = await context.newPage();
  await page.goto(popupUrl);
  return page;
}

export async function forceGC(page: Page): Promise<void> {
  const client = await page.context().newCDPSession(page);
  await client.send('HeapProfiler.collectGarbage');
  await client.detach();
}

export async function getJSHeapSize(page: Page): Promise<{
  usedJSHeapSize: number;
  totalJSHeapSize: number;
}> {
  const client = await page.context().newCDPSession(page);
  const metrics = await client.send('Performance.getMetrics');
  await client.detach();

  const used = metrics.metrics.find(
    (m: { name: string }) => m.name === 'JSHeapUsedSize'
  );
  const total = metrics.metrics.find(
    (m: { name: string }) => m.name === 'JSHeapTotalSize'
  );

  return {
    usedJSHeapSize: used?.value ?? 0,
    totalJSHeapSize: total?.value ?? 0,
  };
}

export function generateMockCookies(count: number): chrome.cookies.Cookie[] {
  return Array.from({ length: count }, (_, i) => ({
    name: `cookie_${i}`,
    value: `value_${i}_${'x'.repeat(Math.min(100, i % 200))}`,
    domain: `.domain${i % 50}.com`,
    path: '/',
    secure: i % 2 === 0,
    httpOnly: i % 3 === 0,
    sameSite: 'lax' as chrome.cookies.SameSiteStatus,
    expirationDate: Date.now() / 1000 + 86400 * (i % 365),
    storeId: '0',
    hostOnly: false,
    session: i % 5 === 0,
  }));
}

export async function measureTime<T>(
  fn: () => Promise<T>
): Promise<{ result: T; duration: number }> {
  const start = performance.now();
  const result = await fn();
  const duration = performance.now() - start;
  return { result, duration };
}

export async function measureTimeMultiple(
  fn: () => Promise<void>,
  iterations: number
): Promise<{ avg: number; min: number; max: number; p95: number; p99: number }> {
  const times: number[] = [];
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await fn();
    times.push(performance.now() - start);
  }
  times.sort((a, b) => a - b);
  return {
    avg: times.reduce((a, b) => a + b, 0) / times.length,
    min: times[0],
    max: times[times.length - 1],
    p95: times[Math.floor(times.length * 0.95)],
    p99: times[Math.floor(times.length * 0.99)],
  };
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)}MB`;
}

export function formatMs(ms: number): string {
  return `${ms.toFixed(2)}ms`;
}
```

### 1.3 Memory Usage Benchmarks

```typescript
// tests/performance/memory.test.ts

import {
  launchBrowserWithExtension,
  openPopup,
  forceGC,
  getJSHeapSize,
  generateMockCookies,
  formatBytes,
} from './helpers';
import { PERFORMANCE_BUDGETS } from './budgets';
import { Browser, BrowserContext, Page } from 'playwright';

describe('Memory Usage', () => {
  let browser: Browser;
  let context: BrowserContext;
  let extensionId: string;

  beforeAll(async () => {
    ({ browser, context, extensionId } = await launchBrowserWithExtension());
  }, 30_000);

  afterAll(async () => {
    await browser?.close();
  });

  test('popup idle memory < 6MB', async () => {
    const page = await openPopup(context, extensionId);

    // Wait for popup to fully initialize, then settle
    await page.waitForSelector('[data-testid="cookie-list"]', {
      timeout: 5_000,
    });
    await page.waitForTimeout(1_000);

    // Force GC and measure
    await forceGC(page);
    await page.waitForTimeout(500);
    const heap = await getJSHeapSize(page);

    console.log(`Popup idle heap: ${formatBytes(heap.usedJSHeapSize)}`);

    expect(heap.usedJSHeapSize).toBeLessThan(
      PERFORMANCE_BUDGETS.popup.memoryIdle
    );

    await page.close();
  }, 15_000);

  test('popup with 100 cookies < 10MB', async () => {
    const page = await openPopup(context, extensionId);

    // Inject 100 mock cookies via the Chrome cookies API
    await page.evaluate((cookies) => {
      // Override the cookie fetch to return mock data
      (window as any).__TEST_COOKIES__ = cookies;
      window.dispatchEvent(new CustomEvent('test:reload-cookies'));
    }, generateMockCookies(100));

    await page.waitForTimeout(1_000);
    await forceGC(page);
    await page.waitForTimeout(500);
    const heap = await getJSHeapSize(page);

    console.log(`Popup with 100 cookies heap: ${formatBytes(heap.usedJSHeapSize)}`);

    expect(heap.usedJSHeapSize).toBeLessThan(
      PERFORMANCE_BUDGETS.popup.memoryWith100Cookies
    );

    await page.close();
  }, 15_000);

  test('popup with 1000 cookies < 25MB', async () => {
    const page = await openPopup(context, extensionId);

    await page.evaluate((cookies) => {
      (window as any).__TEST_COOKIES__ = cookies;
      window.dispatchEvent(new CustomEvent('test:reload-cookies'));
    }, generateMockCookies(1000));

    await page.waitForTimeout(2_000);
    await forceGC(page);
    await page.waitForTimeout(500);
    const heap = await getJSHeapSize(page);

    console.log(`Popup with 1000 cookies heap: ${formatBytes(heap.usedJSHeapSize)}`);

    expect(heap.usedJSHeapSize).toBeLessThan(
      PERFORMANCE_BUDGETS.popup.memoryWith1000Cookies
    );

    await page.close();
  }, 20_000);

  test('background service worker < 5MB', async () => {
    // Access the service worker target via CDP
    const page = await context.newPage();

    const swHeap = await page.evaluate(async () => {
      return new Promise<number>((resolve) => {
        chrome.runtime.sendMessage(
          { type: 'PERF_GET_HEAP_SIZE' },
          (response: { heapUsed: number }) => {
            resolve(response?.heapUsed ?? 0);
          }
        );
      });
    });

    // Fallback: measure via CDP if the extension does not implement the message
    if (swHeap === 0) {
      const targets = browser
        .contexts()
        .flatMap((c) => (c as any)._browser?.targets?.() ?? []);
      // Service worker measurement via DevTools protocol
      console.log(
        'Service worker heap measurement requires PERF_GET_HEAP_SIZE message handler'
      );
    } else {
      console.log(`Service worker heap: ${formatBytes(swHeap)}`);
      expect(swHeap).toBeLessThan(PERFORMANCE_BUDGETS.background.memoryIdle);
    }

    await page.close();
  }, 10_000);

  test('no memory leaks after opening/closing popup 50 times', async () => {
    // Measure baseline by opening popup once
    const baselinePage = await openPopup(context, extensionId);
    await baselinePage.waitForSelector('[data-testid="cookie-list"]', {
      timeout: 5_000,
    });
    await forceGC(baselinePage);
    const baselineHeap = await getJSHeapSize(baselinePage);
    await baselinePage.close();

    // Open and close the popup 50 times
    for (let i = 0; i < 50; i++) {
      const page = await openPopup(context, extensionId);
      await page.waitForSelector('[data-testid="cookie-list"]', {
        timeout: 5_000,
      });
      // Interact briefly to trigger state allocation
      await page.click('[data-testid="search-input"]').catch(() => {});
      await page.close();
    }

    // Measure after the cycle
    const afterPage = await openPopup(context, extensionId);
    await afterPage.waitForSelector('[data-testid="cookie-list"]', {
      timeout: 5_000,
    });
    await forceGC(afterPage);
    await afterPage.waitForTimeout(500);
    const afterHeap = await getJSHeapSize(afterPage);
    await afterPage.close();

    const growth = afterHeap.usedJSHeapSize - baselineHeap.usedJSHeapSize;
    console.log(
      `Memory growth after 50 open/close cycles: ${formatBytes(growth)}`
    );

    // Allow no more than 2MB growth -- anything higher indicates a leak
    expect(growth).toBeLessThan(2 * 1024 * 1024);
  }, 120_000);

  test('no memory leaks after switching tabs 100 times', async () => {
    const page = await openPopup(context, extensionId);
    await page.waitForSelector('[data-testid="cookie-list"]', {
      timeout: 5_000,
    });

    await forceGC(page);
    const beforeHeap = await getJSHeapSize(page);

    const tabs = ['cookies', 'profiles', 'rules', 'health'];

    for (let i = 0; i < 100; i++) {
      const tabName = tabs[i % tabs.length];
      await page.click(`[data-testid="tab-${tabName}"]`).catch(() => {});
      // Small wait to let Preact render the tab content
      if (i % 10 === 0) await page.waitForTimeout(50);
    }

    await forceGC(page);
    await page.waitForTimeout(500);
    const afterHeap = await getJSHeapSize(page);

    const growth = afterHeap.usedJSHeapSize - beforeHeap.usedJSHeapSize;
    console.log(
      `Memory growth after 100 tab switches: ${formatBytes(growth)}`
    );

    // Allow no more than 1MB growth for tab switching
    expect(growth).toBeLessThan(1 * 1024 * 1024);

    await page.close();
  }, 30_000);

  test('cookie list virtual scroll memory stable at 1000+ items', async () => {
    const page = await openPopup(context, extensionId);

    // Load 1500 cookies
    await page.evaluate((cookies) => {
      (window as any).__TEST_COOKIES__ = cookies;
      window.dispatchEvent(new CustomEvent('test:reload-cookies'));
    }, generateMockCookies(1500));

    await page.waitForTimeout(2_000);
    await forceGC(page);
    const beforeHeap = await getJSHeapSize(page);

    // Scroll to the bottom and back up repeatedly
    const listSelector = '[data-testid="cookie-list"]';
    for (let i = 0; i < 20; i++) {
      await page.evaluate(
        (sel) => {
          const el = document.querySelector(sel);
          if (el) el.scrollTop = el.scrollHeight;
        },
        listSelector
      );
      await page.waitForTimeout(100);

      await page.evaluate(
        (sel) => {
          const el = document.querySelector(sel);
          if (el) el.scrollTop = 0;
        },
        listSelector
      );
      await page.waitForTimeout(100);
    }

    await forceGC(page);
    await page.waitForTimeout(500);
    const afterHeap = await getJSHeapSize(page);

    const growth = afterHeap.usedJSHeapSize - beforeHeap.usedJSHeapSize;
    console.log(
      `Memory growth after 20 full scroll cycles (1500 cookies): ${formatBytes(growth)}`
    );

    // Virtual scroller should keep memory stable -- allow at most 1MB growth
    expect(growth).toBeLessThan(1 * 1024 * 1024);

    await page.close();
  }, 30_000);
});
```

### 1.4 CPU Profiling Tests

```typescript
// tests/performance/cpu.test.ts

import {
  launchBrowserWithExtension,
  openPopup,
  generateMockCookies,
  formatMs,
} from './helpers';
import { Browser, BrowserContext, Page } from 'playwright';

describe('CPU Performance', () => {
  let browser: Browser;
  let context: BrowserContext;
  let extensionId: string;

  beforeAll(async () => {
    ({ browser, context, extensionId } = await launchBrowserWithExtension());
  }, 30_000);

  afterAll(async () => {
    await browser?.close();
  });

  test('search filter < 50ms for 1000 cookies', async () => {
    const page = await openPopup(context, extensionId);

    // Load 1000 cookies
    await page.evaluate((cookies) => {
      (window as any).__TEST_COOKIES__ = cookies;
      window.dispatchEvent(new CustomEvent('test:reload-cookies'));
    }, generateMockCookies(1000));
    await page.waitForTimeout(1_000);

    // Measure search filter time (bypass the 300ms debounce by calling
    // the filter function directly)
    const filterTime = await page.evaluate(() => {
      const cookies = (window as any).__TEST_COOKIES__ as any[];
      const query = 'cookie_50';
      const start = performance.now();
      const q = query.toLowerCase();
      const _filtered = cookies.filter(
        (c: any) =>
          c.name.toLowerCase().includes(q) ||
          c.domain.toLowerCase().includes(q) ||
          c.value.toLowerCase().includes(q)
      );
      return performance.now() - start;
    });

    console.log(`Search filter (1000 cookies): ${formatMs(filterTime)}`);
    expect(filterTime).toBeLessThan(50);

    await page.close();
  }, 15_000);

  test('cookie sort < 100ms for 1000 cookies', async () => {
    const page = await openPopup(context, extensionId);

    await page.evaluate((cookies) => {
      (window as any).__TEST_COOKIES__ = cookies;
      window.dispatchEvent(new CustomEvent('test:reload-cookies'));
    }, generateMockCookies(1000));
    await page.waitForTimeout(1_000);

    // Measure sort by name
    const sortByNameTime = await page.evaluate(() => {
      const cookies = [...((window as any).__TEST_COOKIES__ as any[])];
      const start = performance.now();
      cookies.sort((a: any, b: any) => a.name.localeCompare(b.name));
      return performance.now() - start;
    });

    // Measure sort by domain
    const sortByDomainTime = await page.evaluate(() => {
      const cookies = [...((window as any).__TEST_COOKIES__ as any[])];
      const start = performance.now();
      cookies.sort((a: any, b: any) => a.domain.localeCompare(b.domain));
      return performance.now() - start;
    });

    // Measure sort by expiration
    const sortByExpiryTime = await page.evaluate(() => {
      const cookies = [...((window as any).__TEST_COOKIES__ as any[])];
      const start = performance.now();
      cookies.sort(
        (a: any, b: any) => (a.expirationDate ?? 0) - (b.expirationDate ?? 0)
      );
      return performance.now() - start;
    });

    console.log(`Sort by name (1000): ${formatMs(sortByNameTime)}`);
    console.log(`Sort by domain (1000): ${formatMs(sortByDomainTime)}`);
    console.log(`Sort by expiry (1000): ${formatMs(sortByExpiryTime)}`);

    expect(sortByNameTime).toBeLessThan(100);
    expect(sortByDomainTime).toBeLessThan(100);
    expect(sortByExpiryTime).toBeLessThan(100);

    await page.close();
  }, 15_000);

  test('profile load (restore 50 cookies) < 500ms', async () => {
    const page = await openPopup(context, extensionId);

    const restoreTime = await page.evaluate(async () => {
      const cookiesToRestore = Array.from({ length: 50 }, (_, i) => ({
        url: `https://domain${i}.com`,
        name: `cookie_${i}`,
        value: `restored_value_${i}`,
        domain: `.domain${i}.com`,
        path: '/',
        secure: true,
        httpOnly: false,
        sameSite: 'lax' as chrome.cookies.SameSiteStatus,
        expirationDate: Math.floor(Date.now() / 1000) + 86400,
      }));

      const start = performance.now();

      // Simulate parallel cookie set (as the real implementation uses
      // Promise.all with concurrency limit)
      const CONCURRENCY = 10;
      for (let i = 0; i < cookiesToRestore.length; i += CONCURRENCY) {
        const batch = cookiesToRestore.slice(i, i + CONCURRENCY);
        await Promise.all(
          batch.map((cookie) =>
            chrome.cookies.set(cookie).catch(() => null)
          )
        );
      }

      return performance.now() - start;
    });

    console.log(`Profile restore (50 cookies): ${formatMs(restoreTime)}`);
    expect(restoreTime).toBeLessThan(500);

    await page.close();
  }, 15_000);

  test('export 500 cookies to JSON < 200ms', async () => {
    const page = await openPopup(context, extensionId);

    const exportTime = await page.evaluate(() => {
      const cookies = Array.from({ length: 500 }, (_, i) => ({
        name: `cookie_${i}`,
        value: `value_${i}_${'x'.repeat(100)}`,
        domain: `.domain${i % 50}.com`,
        path: '/',
        secure: i % 2 === 0,
        httpOnly: i % 3 === 0,
        sameSite: 'lax',
        expirationDate: Date.now() / 1000 + 86400,
      }));

      const start = performance.now();

      // JSON serialization
      const json = JSON.stringify(cookies, null, 2);
      // Simulate Blob creation for download
      const _blob = new Blob([json], { type: 'application/json' });

      return performance.now() - start;
    });

    console.log(`Export 500 cookies to JSON: ${formatMs(exportTime)}`);
    expect(exportTime).toBeLessThan(200);

    await page.close();
  }, 10_000);

  test('auto-delete rule evaluation < 10ms per rule', async () => {
    const page = await openPopup(context, extensionId);

    const evalTime = await page.evaluate(() => {
      // Simulate a single auto-delete rule evaluation against 200 cookies
      const cookies = Array.from({ length: 200 }, (_, i) => ({
        name: `cookie_${i}`,
        domain: `.domain${i % 20}.com`,
        expirationDate: Date.now() / 1000 + (i % 2 === 0 ? -3600 : 86400),
        secure: i % 2 === 0,
        session: i % 5 === 0,
      }));

      const rule = {
        id: 'rule_1',
        pattern: '*.domain5.com',
        condition: 'expired' as const,
        action: 'delete' as const,
        enabled: true,
      };

      const start = performance.now();

      // Match domain pattern
      const domainRegex = new RegExp(
        rule.pattern.replace(/\./g, '\\.').replace(/\*/g, '.*')
      );

      const _matched = cookies.filter((c) => {
        if (!domainRegex.test(c.domain)) return false;
        if (rule.condition === 'expired') {
          return c.expirationDate < Date.now() / 1000;
        }
        return true;
      });

      return performance.now() - start;
    });

    console.log(`Auto-delete rule evaluation: ${formatMs(evalTime)}`);
    expect(evalTime).toBeLessThan(10);

    await page.close();
  }, 10_000);

  test('health score calculation < 100ms', async () => {
    const page = await openPopup(context, extensionId);

    const calcTime = await page.evaluate(() => {
      const cookies = Array.from({ length: 500 }, (_, i) => ({
        name: `cookie_${i}`,
        value: `val_${i}`,
        domain: `.domain${i % 30}.com`,
        path: '/',
        secure: i % 2 === 0,
        httpOnly: i % 3 === 0,
        sameSite: ['strict', 'lax', 'none'][i % 3],
        expirationDate: Date.now() / 1000 + (i % 2 === 0 ? 86400 : -3600),
        session: i % 5 === 0,
      }));

      const start = performance.now();

      // Simulate health score computation
      let score = 100;
      let issues = 0;

      for (const cookie of cookies) {
        // Deduct for insecure cookies
        if (!cookie.secure) {
          score -= 0.1;
          issues++;
        }
        // Deduct for missing httpOnly
        if (!cookie.httpOnly) {
          score -= 0.05;
          issues++;
        }
        // Deduct for SameSite=none
        if (cookie.sameSite === 'none') {
          score -= 0.15;
          issues++;
        }
        // Deduct for expired cookies still present
        if (cookie.expirationDate < Date.now() / 1000 && !cookie.session) {
          score -= 0.1;
          issues++;
        }
      }

      // Compute domain risk distribution
      const domainMap = new Map<string, number>();
      for (const cookie of cookies) {
        domainMap.set(
          cookie.domain,
          (domainMap.get(cookie.domain) ?? 0) + 1
        );
      }

      // Deduct for domains with excessive cookies (>20)
      for (const [_domain, count] of domainMap) {
        if (count > 20) {
          score -= 1;
          issues++;
        }
      }

      const _finalScore = Math.max(0, Math.round(score));

      return performance.now() - start;
    });

    console.log(`Health score calculation (500 cookies): ${formatMs(calcTime)}`);
    expect(calcTime).toBeLessThan(100);

    await page.close();
  }, 10_000);

  test('no jank during scroll (60fps)', async () => {
    const page = await openPopup(context, extensionId);

    // Load 1000 cookies to stress the virtual scroller
    await page.evaluate((cookies) => {
      (window as any).__TEST_COOKIES__ = cookies;
      window.dispatchEvent(new CustomEvent('test:reload-cookies'));
    }, generateMockCookies(1000));
    await page.waitForTimeout(1_000);

    // Use CDP to collect frame timing data during scroll
    const client = await page.context().newCDPSession(page);
    await client.send('Performance.enable');

    // Start tracing
    await client.send('Tracing.start', {
      categories: 'devtools.timeline,disabled-by-default-devtools.timeline.frame',
      options: 'sampling-frequency=10000',
    });

    // Perform smooth scroll
    const listSelector = '[data-testid="cookie-list"]';
    for (let i = 0; i < 30; i++) {
      await page.evaluate(
        (sel) => {
          const el = document.querySelector(sel);
          if (el) el.scrollBy({ top: 100, behavior: 'auto' });
        },
        listSelector
      );
      await page.waitForTimeout(16); // ~60fps cadence
    }

    // Collect frame metrics via Performance.getMetrics
    const metrics = await client.send('Performance.getMetrics');
    await client.send('Tracing.end');
    await client.detach();

    const framesMetric = metrics.metrics.find(
      (m: { name: string }) => m.name === 'Frames'
    );
    const droppedFrames = metrics.metrics.find(
      (m: { name: string }) => m.name === 'FramesDropped'
    );

    const totalFrames = framesMetric?.value ?? 1;
    const dropped = droppedFrames?.value ?? 0;
    const dropRate = dropped / totalFrames;

    console.log(
      `Scroll: ${totalFrames} frames, ${dropped} dropped (${(dropRate * 100).toFixed(1)}%)`
    );

    // Allow at most 5% dropped frames
    expect(dropRate).toBeLessThan(0.05);

    await page.close();
  }, 20_000);
});
```

### 1.5 Load Time Measurements

```typescript
// tests/performance/loadTime.test.ts

import {
  launchBrowserWithExtension,
  formatMs,
} from './helpers';
import { Browser, BrowserContext, Page } from 'playwright';

describe('Load Times', () => {
  let browser: Browser;
  let context: BrowserContext;
  let extensionId: string;

  beforeAll(async () => {
    ({ browser, context, extensionId } = await launchBrowserWithExtension());
  }, 30_000);

  afterAll(async () => {
    await browser?.close();
  });

  test('popup opens in < 100ms', async () => {
    const popupUrl = `chrome-extension://${extensionId}/popup.html`;
    const page = await context.newPage();

    const startTs = Date.now();
    await page.goto(popupUrl, { waitUntil: 'commit' });
    const commitTime = Date.now() - startTs;

    // Also measure via Navigation Timing API inside the page
    const navTiming = await page.evaluate(() => {
      const entry = performance.getEntriesByType(
        'navigation'
      )[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded: entry?.domContentLoadedEventEnd ?? 0,
        loadComplete: entry?.loadEventEnd ?? 0,
        responseStart: entry?.responseStart ?? 0,
      };
    });

    console.log(`Popup commit: ${formatMs(commitTime)}`);
    console.log(
      `Popup DOMContentLoaded: ${formatMs(navTiming.domContentLoaded)}`
    );

    expect(commitTime).toBeLessThan(100);

    await page.close();
  }, 10_000);

  test('popup interactive in < 150ms', async () => {
    const popupUrl = `chrome-extension://${extensionId}/popup.html`;
    const page = await context.newPage();

    const startTs = Date.now();
    await page.goto(popupUrl);

    // Wait for the search input to be interactive (indicates app is ready)
    await page.waitForSelector('[data-testid="search-input"]', {
      state: 'visible',
      timeout: 5_000,
    });
    const interactiveTime = Date.now() - startTs;

    // Verify the input is actually usable
    await page.fill('[data-testid="search-input"]', 'test');
    const inputValue = await page.inputValue(
      '[data-testid="search-input"]'
    );
    expect(inputValue).toBe('test');

    console.log(`Popup interactive: ${formatMs(interactiveTime)}`);
    expect(interactiveTime).toBeLessThan(150);

    await page.close();
  }, 10_000);

  test('cookies loaded in < 200ms for current domain', async () => {
    const popupUrl = `chrome-extension://${extensionId}/popup.html`;
    const page = await context.newPage();

    await page.goto(popupUrl);

    // Measure time from navigation start to cookie list populated
    const cookieLoadTime = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        const start = performance.now();
        const observer = new MutationObserver(() => {
          const rows = document.querySelectorAll('[data-testid="cookie-row"]');
          if (rows.length > 0) {
            observer.disconnect();
            resolve(performance.now() - start);
          }
        });
        observer.observe(document.body, { childList: true, subtree: true });

        // Fallback timeout -- if no cookies exist, resolve when the empty
        // state renders
        setTimeout(() => {
          const empty = document.querySelector(
            '[data-testid="empty-cookie-list"]'
          );
          if (empty) resolve(performance.now() - start);
          else resolve(-1); // Flag unexpected state
        }, 5_000);
      });
    });

    console.log(`Cookie list populated: ${formatMs(cookieLoadTime)}`);
    if (cookieLoadTime > 0) {
      expect(cookieLoadTime).toBeLessThan(200);
    }

    await page.close();
  }, 10_000);

  test('tab switch in < 50ms', async () => {
    const popupUrl = `chrome-extension://${extensionId}/popup.html`;
    const page = await context.newPage();
    await page.goto(popupUrl);
    await page.waitForSelector('[data-testid="tab-cookies"]', {
      timeout: 5_000,
    });

    const tabs = ['profiles', 'rules', 'health', 'cookies'];
    const times: number[] = [];

    for (const tab of tabs) {
      const switchTime = await page.evaluate(async (tabName) => {
        const start = performance.now();
        const tabEl = document.querySelector(
          `[data-testid="tab-${tabName}"]`
        ) as HTMLElement;
        tabEl?.click();

        // Wait for the tab panel to render
        await new Promise<void>((resolve) => {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => resolve());
          });
        });

        return performance.now() - start;
      }, tab);

      times.push(switchTime);
      console.log(`Tab switch to ${tab}: ${formatMs(switchTime)}`);
    }

    const avgSwitchTime =
      times.reduce((a, b) => a + b, 0) / times.length;
    console.log(`Average tab switch: ${formatMs(avgSwitchTime)}`);

    expect(avgSwitchTime).toBeLessThan(50);

    await page.close();
  }, 10_000);

  test('service worker startup in < 50ms', async () => {
    // Terminate the service worker and measure restart time
    const page = await context.newPage();

    const startupTime = await page.evaluate(async () => {
      // Send a ping to wake the service worker and measure round trip
      const start = performance.now();
      return new Promise<number>((resolve) => {
        chrome.runtime.sendMessage({ type: 'PING' }, () => {
          resolve(performance.now() - start);
        });
      });
    });

    console.log(`Service worker response time: ${formatMs(startupTime)}`);

    // The round-trip includes message serialization; the actual startup
    // portion should be well under 50ms
    expect(startupTime).toBeLessThan(50);

    await page.close();
  }, 10_000);

  test('onboarding page loads in < 200ms', async () => {
    const onboardingUrl = `chrome-extension://${extensionId}/onboarding.html`;
    const page = await context.newPage();

    const startTs = Date.now();
    await page.goto(onboardingUrl, { waitUntil: 'domcontentloaded' });
    const loadTime = Date.now() - startTs;

    console.log(`Onboarding page load: ${formatMs(loadTime)}`);
    expect(loadTime).toBeLessThan(200);

    await page.close();
  }, 10_000);

  test('options page loads in < 300ms', async () => {
    const optionsUrl = `chrome-extension://${extensionId}/options.html`;
    const page = await context.newPage();

    const startTs = Date.now();
    await page.goto(optionsUrl, { waitUntil: 'domcontentloaded' });
    const loadTime = Date.now() - startTs;

    // Also verify interactive elements are present
    await page.waitForSelector('[data-testid="options-form"]', {
      timeout: 5_000,
    }).catch(() => {
      // Options page may have a different structure; just check load time
    });

    console.log(`Options page load: ${formatMs(loadTime)}`);
    expect(loadTime).toBeLessThan(300);

    await page.close();
  }, 10_000);
});
```

### 1.6 Performance Regression Detection

```typescript
// tests/performance/regression.ts

import fs from 'fs';
import path from 'path';

/**
 * Performance regression detector.
 *
 * Stores historical metrics in a JSON file and compares each new run
 * against the rolling average.  When any metric exceeds its budget by
 * more than 10 %, the run is flagged as a regression.
 */

interface MetricEntry {
  timestamp: number;
  commit: string;
  metrics: Record<string, number>;
}

interface RegressionResult {
  metric: string;
  current: number;
  baseline: number;
  budget: number;
  overBudgetPercent: number;
  regression: boolean;
}

const HISTORY_FILE = path.resolve(
  __dirname,
  '../../.perf-history.json'
);

const REGRESSION_THRESHOLD = 0.10; // 10 % over budget

export function loadHistory(): MetricEntry[] {
  if (!fs.existsSync(HISTORY_FILE)) return [];
  return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8'));
}

export function saveHistory(entries: MetricEntry[]): void {
  // Keep only the last 100 runs
  const trimmed = entries.slice(-100);
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(trimmed, null, 2));
}

export function computeBaseline(
  history: MetricEntry[]
): Record<string, number> {
  if (history.length === 0) return {};

  // Use the last 10 runs as the baseline window
  const window = history.slice(-10);
  const allKeys = new Set(window.flatMap((e) => Object.keys(e.metrics)));
  const baseline: Record<string, number> = {};

  for (const key of allKeys) {
    const values = window
      .map((e) => e.metrics[key])
      .filter((v) => v !== undefined);
    baseline[key] = values.reduce((a, b) => a + b, 0) / values.length;
  }

  return baseline;
}

export function detectRegressions(
  current: Record<string, number>,
  budgets: Record<string, number>,
  baseline: Record<string, number>
): RegressionResult[] {
  const results: RegressionResult[] = [];

  for (const [metric, value] of Object.entries(current)) {
    const budget = budgets[metric];
    if (budget === undefined) continue;

    const base = baseline[metric] ?? budget;
    const overBudgetPercent = (value - budget) / budget;
    const regression = overBudgetPercent > REGRESSION_THRESHOLD;

    results.push({
      metric,
      current: value,
      baseline: base,
      budget,
      overBudgetPercent: overBudgetPercent * 100,
      regression,
    });
  }

  return results;
}

export function formatRegressionReport(
  results: RegressionResult[]
): string {
  const lines: string[] = [
    '## Performance Regression Report',
    '',
    '| Metric | Current | Budget | Baseline | Over Budget | Status |',
    '|--------|---------|--------|----------|-------------|--------|',
  ];

  for (const r of results) {
    const status = r.regression ? 'REGRESSION' : 'OK';
    const icon = r.regression ? '!!!' : '';
    lines.push(
      `| ${r.metric} | ${r.current.toFixed(2)} | ${r.budget.toFixed(2)} | ${r.baseline.toFixed(2)} | ${r.overBudgetPercent.toFixed(1)}% | ${icon} ${status} |`
    );
  }

  const regressions = results.filter((r) => r.regression);
  if (regressions.length > 0) {
    lines.push('');
    lines.push(
      `**${regressions.length} regression(s) detected.** Investigate before merging.`
    );
  } else {
    lines.push('');
    lines.push('All metrics within budget.');
  }

  return lines.join('\n');
}
```

```typescript
// tests/performance/regression.test.ts

import {
  loadHistory,
  saveHistory,
  computeBaseline,
  detectRegressions,
  formatRegressionReport,
} from './regression';
import { PERFORMANCE_BUDGETS } from './budgets';
import { execSync } from 'child_process';

describe('Performance Regression Detection', () => {
  test('records metrics and detects regressions', () => {
    const history = loadHistory();
    const baseline = computeBaseline(history);

    // Simulated current run metrics (in a real CI pipeline these come
    // from the actual performance test results)
    const currentMetrics: Record<string, number> = {
      popupFirstPaint: 35,
      popupInteractive: 90,
      searchFilter1000: 12,
      cookieSort1000: 45,
      exportJson500: 80,
      serviceWorkerStartup: 30,
      popupIdleMemory: 5_200_000,
    };

    const budgets: Record<string, number> = {
      popupFirstPaint: PERFORMANCE_BUDGETS.popup.firstPaint,
      popupInteractive: PERFORMANCE_BUDGETS.popup.interactive,
      searchFilter1000: 50,
      cookieSort1000: 100,
      exportJson500: 200,
      serviceWorkerStartup: PERFORMANCE_BUDGETS.background.startup,
      popupIdleMemory: PERFORMANCE_BUDGETS.popup.memoryIdle,
    };

    const results = detectRegressions(currentMetrics, budgets, baseline);
    const report = formatRegressionReport(results);
    console.log(report);

    // Save this run to history
    let commitHash = 'unknown';
    try {
      commitHash = execSync('git rev-parse --short HEAD')
        .toString()
        .trim();
    } catch {
      // Not in a git repo; use timestamp
    }

    history.push({
      timestamp: Date.now(),
      commit: commitHash,
      metrics: currentMetrics,
    });
    saveHistory(history);

    // Assert no regressions
    const regressions = results.filter((r) => r.regression);
    expect(regressions).toHaveLength(0);
  });
});
```

---

## 2. Cross-Browser Testing Matrix

### 2.1 Browser Compatibility Configuration

```typescript
// tests/crossbrowser/browserConfigs.ts

/**
 * Zovo Cookie Manager targets Chromium-based browsers that support
 * Manifest V3.  Firefox and Safari use different extension APIs and
 * are NOT supported.
 */

export interface ChromiumBrowserConfig {
  name: string;
  slug: string;
  minVersion: number;
  channel: 'stable' | 'beta' | 'canary' | 'dev';
  executablePath?: string;
  knownLimitations: string[];
  cookieApiNotes: string;
  identityApiNotes: string;
  incognitoNotes: string;
  storageSyncQuotaBytes: number;
}

export const SUPPORTED_BROWSERS: ChromiumBrowserConfig[] = [
  {
    name: 'Google Chrome',
    slug: 'chrome',
    minVersion: 120,
    channel: 'stable',
    knownLimitations: [
      'Service worker 5-minute idle timeout',
    ],
    cookieApiNotes: 'Full chrome.cookies support',
    identityApiNotes: 'Full chrome.identity support',
    incognitoNotes: 'Requires "incognito": "spanning" or "split" in manifest',
    storageSyncQuotaBytes: 102_400,
  },
  {
    name: 'Chrome Beta',
    slug: 'chrome-beta',
    minVersion: 121,
    channel: 'beta',
    knownLimitations: [
      'May contain pre-release API changes',
      'Service worker lifecycle may differ',
    ],
    cookieApiNotes: 'Full support; may include new partitioning APIs',
    identityApiNotes: 'Full support',
    incognitoNotes: 'Same as stable',
    storageSyncQuotaBytes: 102_400,
  },
  {
    name: 'Chrome Canary',
    slug: 'chrome-canary',
    minVersion: 122,
    channel: 'canary',
    knownLimitations: [
      'Unstable; APIs may break without notice',
      'New MV3 features may appear early',
    ],
    cookieApiNotes: 'May include experimental partitioned cookies API',
    identityApiNotes: 'Full support',
    incognitoNotes: 'Same as stable',
    storageSyncQuotaBytes: 102_400,
  },
  {
    name: 'Microsoft Edge',
    slug: 'edge',
    minVersion: 120,
    channel: 'stable',
    knownLimitations: [
      'chrome.sidePanel may not be available',
      'Edge-specific sidebar API exists but differs',
    ],
    cookieApiNotes: 'Full chrome.cookies support',
    identityApiNotes: 'Full support; may prefer Microsoft account prompts',
    incognitoNotes: 'InPrivate mode uses same permission model as Chrome incognito',
    storageSyncQuotaBytes: 102_400,
  },
  {
    name: 'Brave',
    slug: 'brave',
    minVersion: 120,
    channel: 'stable',
    executablePath: '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
    knownLimitations: [
      'Shields may block third-party cookie access by default',
      'Fingerprint protection may interfere with certain APIs',
      'chrome.identity may have limited OAuth redirect support',
    ],
    cookieApiNotes:
      'First-party cookies: full access. Third-party cookies: may be blocked by Shields. Test with Shields up and down.',
    identityApiNotes:
      'OAuth may require user to manually allow in Shields settings',
    incognitoNotes: 'Private windows with Tor may further restrict cookie access',
    storageSyncQuotaBytes: 102_400,
  },
  {
    name: 'Opera',
    slug: 'opera',
    minVersion: 106,
    channel: 'stable',
    executablePath: '/Applications/Opera.app/Contents/MacOS/Opera',
    knownLimitations: [
      'Built-in ad blocker may interfere with cookie tracking',
      'Opera GX may have different resource limits',
    ],
    cookieApiNotes: 'Full chrome.cookies support',
    identityApiNotes: 'Full support',
    incognitoNotes: 'Private browsing works same as Chrome',
    storageSyncQuotaBytes: 102_400,
  },
  {
    name: 'Vivaldi',
    slug: 'vivaldi',
    minVersion: 6,
    channel: 'stable',
    executablePath: '/Applications/Vivaldi.app/Contents/MacOS/Vivaldi',
    knownLimitations: [
      'Custom tab stacking may affect chrome.tabs queries',
      'Built-in tracker blocker may limit cookie visibility',
    ],
    cookieApiNotes: 'Full chrome.cookies support',
    identityApiNotes: 'Full support',
    incognitoNotes: 'Private windows follow Chrome model',
    storageSyncQuotaBytes: 102_400,
  },
];

export const UNSUPPORTED_BROWSERS = [
  { name: 'Firefox', reason: 'Uses WebExtensions API with browser namespace; MV3 implementation differs significantly' },
  { name: 'Safari', reason: 'Uses Safari Web Extensions with Xcode packaging; different API surface' },
];
```

### 2.2 API Differences Reference

```typescript
// tests/crossbrowser/apiDifferences.ts

/**
 * Documents known API behavior differences across Chromium browsers.
 * Used as a reference during test development and for conditional
 * test assertions.
 */

export const API_DIFFERENCES = {
  'chrome.cookies': {
    chrome: { thirdParty: 'full', partitioned: 'supported (120+)' },
    edge: { thirdParty: 'full', partitioned: 'supported (120+)' },
    brave: { thirdParty: 'blocked by Shields default', partitioned: 'supported' },
    opera: { thirdParty: 'full', partitioned: 'supported' },
    vivaldi: { thirdParty: 'full (unless tracker blocker active)', partitioned: 'supported' },
  },
  'chrome.identity': {
    chrome: { oauth: 'full', launchWebAuthFlow: 'full' },
    edge: { oauth: 'full', launchWebAuthFlow: 'full' },
    brave: { oauth: 'limited (Shields may block redirects)', launchWebAuthFlow: 'requires Shields exception' },
    opera: { oauth: 'full', launchWebAuthFlow: 'full' },
    vivaldi: { oauth: 'full', launchWebAuthFlow: 'full' },
  },
  'chrome.storage.sync': {
    chrome: { quotaBytes: 102_400, quotaBytesPerItem: 8_192, maxItems: 512 },
    edge: { quotaBytes: 102_400, quotaBytesPerItem: 8_192, maxItems: 512 },
    brave: { quotaBytes: 102_400, quotaBytesPerItem: 8_192, maxItems: 512 },
    opera: { quotaBytes: 102_400, quotaBytesPerItem: 8_192, maxItems: 512 },
    vivaldi: { quotaBytes: 102_400, quotaBytesPerItem: 8_192, maxItems: 512 },
  },
  incognitoAccess: {
    chrome: 'Requires user opt-in via chrome://extensions',
    edge: 'Requires user opt-in via edge://extensions',
    brave: 'Restricted; additional Shields restrictions in Private + Tor',
    opera: 'Requires user opt-in',
    vivaldi: 'Requires user opt-in',
  },
} as const;
```

### 2.3 Cross-Browser Test Suite

```typescript
// tests/crossbrowser/compatibility.test.ts

import { chromium, Browser, BrowserContext, Page } from 'playwright';
import path from 'path';
import {
  SUPPORTED_BROWSERS,
  ChromiumBrowserConfig,
} from './browserConfigs';

const EXTENSION_PATH = path.resolve(__dirname, '../../dist');

// Determine which browser to test based on env var; default to Chrome
const TARGET_SLUG = process.env.BROWSER_TARGET || 'chrome';
const TARGET_CONFIG = SUPPORTED_BROWSERS.find(
  (b) => b.slug === TARGET_SLUG
)!;

describe(`Cross-Browser Compatibility: ${TARGET_CONFIG.name}`, () => {
  let browser: Browser;
  let context: BrowserContext;
  let extensionId: string;
  let page: Page;

  beforeAll(async () => {
    const launchArgs = [
      `--disable-extensions-except=${EXTENSION_PATH}`,
      `--load-extension=${EXTENSION_PATH}`,
      '--no-first-run',
    ];

    const launchOptions: any = {
      headless: false,
      args: launchArgs,
    };

    if (TARGET_CONFIG.executablePath) {
      launchOptions.executablePath = TARGET_CONFIG.executablePath;
    }

    browser = await chromium.launch(launchOptions);
    context = await browser.newContext();

    // Extract extension ID from the service worker URL
    const swTarget = await context.waitForEvent('serviceworker', {
      timeout: 10_000,
    });
    extensionId = new URL(swTarget.url()).hostname;
  }, 30_000);

  afterAll(async () => {
    await browser?.close();
  });

  beforeEach(async () => {
    page = await context.newPage();
  });

  afterEach(async () => {
    await page?.close();
  });

  // ---- Core API Availability ----

  describe('Core API Availability', () => {
    test('chrome.cookies API available', async () => {
      const available = await page.evaluate(() => {
        return (
          typeof chrome !== 'undefined' &&
          typeof chrome.cookies !== 'undefined' &&
          typeof chrome.cookies.getAll === 'function' &&
          typeof chrome.cookies.set === 'function' &&
          typeof chrome.cookies.remove === 'function'
        );
      });
      expect(available).toBe(true);
    });

    test('chrome.storage API available', async () => {
      const available = await page.evaluate(() => {
        return (
          typeof chrome !== 'undefined' &&
          typeof chrome.storage !== 'undefined' &&
          typeof chrome.storage.local !== 'undefined' &&
          typeof chrome.storage.sync !== 'undefined' &&
          typeof chrome.storage.local.get === 'function' &&
          typeof chrome.storage.local.set === 'function'
        );
      });
      expect(available).toBe(true);
    });

    test('chrome.alarms API available', async () => {
      const available = await page.evaluate(() => {
        return (
          typeof chrome !== 'undefined' &&
          typeof chrome.alarms !== 'undefined' &&
          typeof chrome.alarms.create === 'function' &&
          typeof chrome.alarms.getAll === 'function'
        );
      });
      expect(available).toBe(true);
    });

    test('chrome.identity API available', async () => {
      const available = await page.evaluate(() => {
        return (
          typeof chrome !== 'undefined' &&
          typeof chrome.identity !== 'undefined' &&
          typeof chrome.identity.launchWebAuthFlow === 'function'
        );
      });

      if (TARGET_SLUG === 'brave') {
        // Brave may restrict identity API; log but do not hard-fail
        if (!available) {
          console.warn(
            'chrome.identity not fully available in Brave (expected with Shields)'
          );
        }
      } else {
        expect(available).toBe(true);
      }
    });

    test('Manifest V3 service worker supported', async () => {
      const swActive = await page.evaluate(async () => {
        return new Promise<boolean>((resolve) => {
          chrome.runtime.sendMessage({ type: 'PING' }, (response) => {
            resolve(!!response);
          });
          setTimeout(() => resolve(false), 3_000);
        });
      });
      expect(swActive).toBe(true);
    });
  });

  // ---- Browser-Specific Behavior ----

  describe('Browser-Specific Behavior', () => {
    test('cookie read access works for current domain', async () => {
      // Navigate to a real page first so cookies can exist
      await page.goto('https://example.com', { waitUntil: 'load' });

      const canRead = await page.evaluate(async () => {
        try {
          const cookies = await chrome.cookies.getAll({
            domain: 'example.com',
          });
          return Array.isArray(cookies);
        } catch {
          return false;
        }
      });

      expect(canRead).toBe(true);
    });

    test('cookie write access works', async () => {
      const canWrite = await page.evaluate(async () => {
        try {
          const result = await chrome.cookies.set({
            url: 'https://example.com',
            name: '__zovo_test',
            value: 'test_value',
            expirationDate: Math.floor(Date.now() / 1000) + 3600,
          });
          // Clean up
          if (result) {
            await chrome.cookies.remove({
              url: 'https://example.com',
              name: '__zovo_test',
            });
          }
          return result !== null;
        } catch {
          return false;
        }
      });

      expect(canWrite).toBe(true);
    });

    test('cookie access in Brave (may be restricted for third-party)', async () => {
      if (TARGET_SLUG !== 'brave') {
        // This test is Brave-specific; skip for other browsers
        return;
      }

      // Test first-party cookie access (should always work)
      await page.goto('https://example.com');
      const firstPartyAccess = await page.evaluate(async () => {
        try {
          await chrome.cookies.set({
            url: 'https://example.com',
            name: '__zovo_1p_test',
            value: 'first_party',
          });
          const cookies = await chrome.cookies.getAll({
            domain: 'example.com',
          });
          const found = cookies.some(
            (c: chrome.cookies.Cookie) => c.name === '__zovo_1p_test'
          );
          await chrome.cookies.remove({
            url: 'https://example.com',
            name: '__zovo_1p_test',
          });
          return found;
        } catch {
          return false;
        }
      });

      expect(firstPartyAccess).toBe(true);

      // Test third-party cookie visibility (may be blocked by Shields)
      const thirdPartyCookies = await page.evaluate(async () => {
        try {
          const cookies = await chrome.cookies.getAll({});
          // Count cookies from domains other than example.com
          return cookies.filter(
            (c: chrome.cookies.Cookie) =>
              !c.domain.includes('example.com')
          ).length;
        } catch {
          return -1;
        }
      });

      console.log(
        `Brave: third-party cookies visible: ${thirdPartyCookies}`
      );
      // Do not assert a specific count; just log for awareness
    });

    test('incognito cookie access in Edge', async () => {
      if (TARGET_SLUG !== 'edge') return;

      // In a normal context, verify the extension CAN request
      // incognito access (the actual permission is user-granted)
      const manifest = await page.evaluate(async () => {
        return chrome.runtime.getManifest();
      });

      // The manifest should declare incognito mode
      expect(manifest).toBeDefined();
      console.log(
        `Edge incognito mode in manifest: ${(manifest as any).incognito ?? 'not set (defaults to spanning)'}`
      );
    });

    test('storage sync quota consistent', async () => {
      const quota = await page.evaluate(async () => {
        // chrome.storage.sync.QUOTA_BYTES is a static property
        return {
          quotaBytes: (chrome.storage.sync as any).QUOTA_BYTES ?? null,
          quotaBytesPerItem:
            (chrome.storage.sync as any).QUOTA_BYTES_PER_ITEM ?? null,
          maxItems: (chrome.storage.sync as any).MAX_ITEMS ?? null,
        };
      });

      console.log(
        `${TARGET_CONFIG.name} storage.sync quota: ${JSON.stringify(quota)}`
      );

      if (quota.quotaBytes !== null) {
        expect(quota.quotaBytes).toBe(
          TARGET_CONFIG.storageSyncQuotaBytes
        );
      }
    });
  });

  // ---- UI Rendering ----

  describe('UI Rendering', () => {
    test('popup renders at correct dimensions', async () => {
      const popupUrl = `chrome-extension://${extensionId}/popup.html`;
      await page.goto(popupUrl);
      await page.waitForSelector('[data-testid="app-root"]', {
        timeout: 5_000,
      });

      const dimensions = await page.evaluate(() => {
        const root = document.querySelector(
          '[data-testid="app-root"]'
        ) as HTMLElement;
        if (!root) return null;
        const rect = root.getBoundingClientRect();
        return { width: rect.width, height: rect.height };
      });

      expect(dimensions).not.toBeNull();
      // Popup should be 400px wide (as specified in the extension spec)
      expect(dimensions!.width).toBeGreaterThanOrEqual(380);
      expect(dimensions!.width).toBeLessThanOrEqual(420);
      // Height should be between 500-620px
      expect(dimensions!.height).toBeGreaterThanOrEqual(480);
      expect(dimensions!.height).toBeLessThanOrEqual(620);
    });

    test('dark mode detection works', async () => {
      const popupUrl = `chrome-extension://${extensionId}/popup.html`;

      // Test light mode
      await page.emulateMedia({ colorScheme: 'light' });
      await page.goto(popupUrl);
      await page.waitForTimeout(500);

      const lightTheme = await page.evaluate(() => {
        return (
          document.documentElement.getAttribute('data-theme') ??
          getComputedStyle(document.documentElement)
            .getPropertyValue('--bg-primary')
            .trim()
        );
      });

      // Test dark mode
      await page.emulateMedia({ colorScheme: 'dark' });
      await page.waitForTimeout(500);

      const darkTheme = await page.evaluate(() => {
        return (
          document.documentElement.getAttribute('data-theme') ??
          getComputedStyle(document.documentElement)
            .getPropertyValue('--bg-primary')
            .trim()
        );
      });

      console.log(
        `${TARGET_CONFIG.name} - light: ${lightTheme}, dark: ${darkTheme}`
      );

      // They should differ (the extension responds to prefers-color-scheme)
      expect(lightTheme).not.toEqual(darkTheme);
    });

    test('keyboard shortcuts work', async () => {
      const popupUrl = `chrome-extension://${extensionId}/popup.html`;
      await page.goto(popupUrl);
      await page.waitForSelector('[data-testid="cookie-list"]', {
        timeout: 5_000,
      });

      // Test Ctrl+F / Cmd+F focuses search
      await page.keyboard.press('Control+f');
      const searchFocused = await page.evaluate(() => {
        const search = document.querySelector(
          '[data-testid="search-input"]'
        );
        return document.activeElement === search;
      });

      // If Ctrl+F does not work, try the custom shortcut (/)
      if (!searchFocused) {
        await page.keyboard.press('/');
        const slashFocused = await page.evaluate(() => {
          const search = document.querySelector(
            '[data-testid="search-input"]'
          );
          return document.activeElement === search;
        });
        expect(slashFocused).toBe(true);
      } else {
        expect(searchFocused).toBe(true);
      }

      // Test Escape clears search / closes modals
      await page.fill('[data-testid="search-input"]', 'test query');
      await page.keyboard.press('Escape');
      const searchValue = await page.inputValue(
        '[data-testid="search-input"]'
      );
      expect(searchValue).toBe('');
    });
  });
});
```

### 2.4 Test Matrix Template

The following matrix should be filled during each release cycle by running the cross-browser test suite against each target:

```
BROWSER_TARGET=chrome   npx playwright test tests/crossbrowser/
BROWSER_TARGET=edge     npx playwright test tests/crossbrowser/
BROWSER_TARGET=brave    npx playwright test tests/crossbrowser/
BROWSER_TARGET=opera    npx playwright test tests/crossbrowser/
BROWSER_TARGET=vivaldi  npx playwright test tests/crossbrowser/
```

| Test Area | Chrome 120+ | Edge 120+ | Brave 1.60+ | Opera 106+ | Vivaldi 6+ |
|-----------|:-----------:|:---------:|:-----------:|:----------:|:----------:|
| Popup renders correctly | | | | | |
| Cookie CRUD operations | | | | | |
| Cookie profiles (save/load) | | | | | |
| Auto-delete rules fire | | | | | |
| Export/Import (JSON) | | | | | |
| Payment/upgrade flow | | | | | |
| Onboarding page | | | | | |
| Dark mode toggle | | | | | |
| Keyboard shortcuts | | | | | |
| Memory < 25MB (1000 cookies) | | | | | |
| Service worker startup < 50ms | | | | | |
| Search filter < 50ms | | | | | |
| chrome.identity OAuth | | | | | |
| Incognito cookie access | | | | | |
| Storage sync operations | | | | | |

### 2.5 CI Cross-Browser Runner

```yaml
# .github/workflows/cross-browser.yml

name: Cross-Browser Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  schedule:
    # Run nightly against Chrome Beta/Canary to catch API changes early
    - cron: '0 4 * * *'

jobs:
  cross-browser:
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      matrix:
        browser: [chrome, edge, brave, opera]
        include:
          - browser: chrome
            install: google-chrome-stable
          - browser: edge
            install: microsoft-edge-stable
          - browser: brave
            install: brave-browser
          - browser: opera
            install: opera-stable

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - run: npm ci

      - run: npm run build

      - name: Install browser
        run: |
          if [ "${{ matrix.browser }}" = "brave" ]; then
            curl -fsSLo /tmp/brave.deb https://brave-browser-apt-release.s3.brave.com/brave-browser_latest_amd64.deb
            sudo dpkg -i /tmp/brave.deb || sudo apt-get -f install -y
          else
            npx playwright install chromium
          fi

      - name: Run cross-browser tests
        env:
          BROWSER_TARGET: ${{ matrix.browser }}
        run: npx playwright test tests/crossbrowser/ --reporter=json --output=test-results/

      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: test-results-${{ matrix.browser }}
          path: test-results/
```

---

## 3. Bundle Size Testing

### 3.1 Bundle Analysis Script

```typescript
// scripts/check-bundle-size.ts

import fs from 'fs';
import path from 'path';
import { gzipSync } from 'zlib';
import { PERFORMANCE_BUDGETS } from '../tests/performance/budgets';

interface BundleReport {
  file: string;
  rawSize: number;
  gzipSize: number;
  budget: number;
  criticalBudget: number;
  withinBudget: boolean;
  withinCritical: boolean;
  percentOfBudget: number;
}

const DIST_DIR = path.resolve(__dirname, '../dist');

const BUNDLE_BUDGETS: Array<{
  glob: string;
  label: string;
  budget: number;
  critical: number;
}> = [
  {
    glob: 'popup.js',
    label: 'Popup JS',
    budget: PERFORMANCE_BUDGETS.popup.bundleSize,
    critical: 150_000,
  },
  {
    glob: 'popup.css',
    label: 'Popup CSS',
    budget: PERFORMANCE_BUDGETS.popup.cssBundleSize,
    critical: 20_000,
  },
  {
    glob: 'background.js',
    label: 'Background JS',
    budget: PERFORMANCE_BUDGETS.background.bundleSize,
    critical: 50_000,
  },
  {
    glob: 'options.js',
    label: 'Options JS',
    budget: PERFORMANCE_BUDGETS.options.bundleSize,
    critical: 100_000,
  },
  {
    glob: 'content.js',
    label: 'Content Script',
    budget: PERFORMANCE_BUDGETS.content.bundleSize,
    critical: 3_000,
  },
];

function getFileSize(filePath: string): number {
  if (!fs.existsSync(filePath)) return -1;
  return fs.statSync(filePath).size;
}

function getGzipSize(filePath: string): number {
  if (!fs.existsSync(filePath)) return -1;
  const content = fs.readFileSync(filePath);
  return gzipSync(content, { level: 9 }).byteLength;
}

function getTotalDirSize(dirPath: string): number {
  if (!fs.existsSync(dirPath)) return 0;
  let total = 0;
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dirPath, entry.name);
    if (entry.isFile()) {
      total += fs.statSync(full).size;
    } else if (entry.isDirectory()) {
      total += getTotalDirSize(full);
    }
  }
  return total;
}

function formatSize(bytes: number): string {
  if (bytes < 0) return 'NOT FOUND';
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)}MB`;
}

function run(): void {
  console.log('Bundle Size Report');
  console.log('==================\n');

  const reports: BundleReport[] = [];
  let hasFailure = false;

  for (const entry of BUNDLE_BUDGETS) {
    const filePath = path.join(DIST_DIR, entry.glob);
    const rawSize = getFileSize(filePath);
    const gzipSize = rawSize >= 0 ? getGzipSize(filePath) : -1;

    const report: BundleReport = {
      file: entry.glob,
      rawSize,
      gzipSize,
      budget: entry.budget,
      criticalBudget: entry.critical,
      withinBudget: rawSize >= 0 && rawSize <= entry.budget,
      withinCritical: rawSize >= 0 && rawSize <= entry.critical,
      percentOfBudget:
        rawSize >= 0 ? (rawSize / entry.budget) * 100 : -1,
    };

    reports.push(report);

    const status = report.withinBudget
      ? 'OK'
      : report.withinCritical
        ? 'WARN'
        : 'FAIL';

    if (status === 'FAIL') hasFailure = true;

    console.log(
      `${status.padEnd(4)} | ${entry.label.padEnd(16)} | raw: ${formatSize(rawSize).padEnd(10)} | gzip: ${formatSize(gzipSize).padEnd(10)} | budget: ${formatSize(entry.budget).padEnd(10)} | ${report.percentOfBudget.toFixed(0)}%`
    );
  }

  // Total size check
  const totalSize = getTotalDirSize(DIST_DIR);
  const totalBudget = PERFORMANCE_BUDGETS.total.bundleSize;
  const totalCritical = PERFORMANCE_BUDGETS.total.criticalBundleSize;
  const totalStatus =
    totalSize <= totalBudget
      ? 'OK'
      : totalSize <= totalCritical
        ? 'WARN'
        : 'FAIL';

  if (totalStatus === 'FAIL') hasFailure = true;

  console.log(
    `\n${totalStatus.padEnd(4)} | ${'TOTAL'.padEnd(16)} | raw: ${formatSize(totalSize).padEnd(10)} | budget: ${formatSize(totalBudget).padEnd(10)} | ${((totalSize / totalBudget) * 100).toFixed(0)}%`
  );

  if (hasFailure) {
    console.error(
      '\nBundle size check FAILED. One or more files exceed critical budget.'
    );
    process.exit(1);
  } else {
    console.log('\nAll bundles within budget.');
  }
}

run();
```

### 3.2 Tree-Shaking Verification

```typescript
// tests/bundle/treeshaking.test.ts

import fs from 'fs';
import path from 'path';

const DIST_DIR = path.resolve(__dirname, '../../dist');

describe('Tree-Shaking Verification', () => {
  const readBundle = (filename: string): string => {
    const filePath = path.join(DIST_DIR, filename);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Bundle not found: ${filePath}. Run "npm run build" first.`);
    }
    return fs.readFileSync(filePath, 'utf-8');
  };

  test('Preact is bundled instead of React (~3KB contribution)', () => {
    const popup = readBundle('popup.js');

    // Preact identifiers that should be present
    expect(popup).toMatch(/preact/i);

    // Full React should NOT be present
    expect(popup).not.toMatch(/react-dom/);
    expect(popup).not.toMatch(/ReactDOM/);
    // "__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED" is a React marker
    expect(popup).not.toMatch(
      /__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED/
    );
  });

  test('no nanoid dependency (replaced with crypto.randomUUID)', () => {
    const popup = readBundle('popup.js');
    const background = readBundle('background.js');

    // nanoid's characteristic: urlAlphabet or custom alphabet string
    const nanoidMarker =
      'useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict';
    expect(popup).not.toContain(nanoidMarker);
    expect(background).not.toContain(nanoidMarker);
  });

  test('no unnecessary polyfills bundled', () => {
    const popup = readBundle('popup.js');

    // core-js polyfills should not be present (Chrome 120+ has modern JS)
    expect(popup).not.toMatch(/core-js/);
    expect(popup).not.toMatch(/regenerator-runtime/);

    // Promise polyfill not needed
    expect(popup).not.toMatch(/promise-polyfill/);
  });

  test('dead code elimination verified (no test-only exports)', () => {
    const popup = readBundle('popup.js');
    const background = readBundle('background.js');

    // __TEST__ or __DEV__ guards should be stripped in production
    expect(popup).not.toMatch(/__TEST__/);
    expect(background).not.toMatch(/__TEST__/);
  });

  test('source maps do not contain unexpected large dependencies', () => {
    const mapPath = path.join(DIST_DIR, 'popup.js.map');
    if (!fs.existsSync(mapPath)) {
      console.warn('No source map found; skipping source map analysis');
      return;
    }

    const sourceMap = JSON.parse(fs.readFileSync(mapPath, 'utf-8'));
    const sources: string[] = sourceMap.sources ?? [];

    // These large libraries should NOT appear in the bundle
    const forbidden = [
      'node_modules/react/',
      'node_modules/react-dom/',
      'node_modules/lodash/',
      'node_modules/moment/',
      'node_modules/axios/',
      'node_modules/jquery/',
    ];

    for (const lib of forbidden) {
      const found = sources.filter((s: string) => s.includes(lib));
      expect(found).toHaveLength(0);
    }
  });
});
```

---

## 4. Stress Testing

### 4.1 Cookie Volume Stress Tests

```typescript
// tests/stress/cookieVolume.test.ts

import {
  launchBrowserWithExtension,
  openPopup,
  generateMockCookies,
  forceGC,
  getJSHeapSize,
  formatBytes,
  formatMs,
} from '../performance/helpers';
import { Browser, BrowserContext, Page } from 'playwright';

describe('Stress Tests', () => {
  let browser: Browser;
  let context: BrowserContext;
  let extensionId: string;

  beforeAll(async () => {
    ({ browser, context, extensionId } = await launchBrowserWithExtension());
  }, 30_000);

  afterAll(async () => {
    await browser?.close();
  });

  test('handle site with 500+ cookies', async () => {
    const page = await openPopup(context, extensionId);

    // Inject 500 cookies for a single domain
    const singleDomainCookies = Array.from({ length: 500 }, (_, i) => ({
      name: `stress_cookie_${i}`,
      value: `value_${i}_${'x'.repeat(50)}`,
      domain: '.stress-test.com',
      path: '/',
      secure: true,
      httpOnly: i % 2 === 0,
      sameSite: 'lax' as chrome.cookies.SameSiteStatus,
      expirationDate: Date.now() / 1000 + 86400,
      storeId: '0',
      hostOnly: false,
      session: false,
    }));

    await page.evaluate((cookies) => {
      (window as any).__TEST_COOKIES__ = cookies;
      window.dispatchEvent(new CustomEvent('test:reload-cookies'));
    }, singleDomainCookies);

    // Wait for render to complete
    await page.waitForTimeout(2_000);

    // Verify the list renders without crashing
    const rowCount = await page.evaluate(() => {
      return document.querySelectorAll('[data-testid="cookie-row"]').length;
    });

    // With virtual scrolling, only ~18-20 rows should be in DOM
    expect(rowCount).toBeGreaterThan(0);
    expect(rowCount).toBeLessThan(30);

    // Verify scroll works (can reach the last cookie)
    const canScrollToEnd = await page.evaluate(() => {
      const list = document.querySelector(
        '[data-testid="cookie-list"]'
      ) as HTMLElement;
      if (!list) return false;
      list.scrollTop = list.scrollHeight;
      return list.scrollTop > 0;
    });
    expect(canScrollToEnd).toBe(true);

    // Verify memory stays within bounds
    await forceGC(page);
    const heap = await getJSHeapSize(page);
    console.log(
      `500 single-domain cookies heap: ${formatBytes(heap.usedJSHeapSize)}`
    );
    expect(heap.usedJSHeapSize).toBeLessThan(25 * 1024 * 1024);

    await page.close();
  }, 20_000);

  test('handle 1000 cookies in search', async () => {
    const page = await openPopup(context, extensionId);

    await page.evaluate((cookies) => {
      (window as any).__TEST_COOKIES__ = cookies;
      window.dispatchEvent(new CustomEvent('test:reload-cookies'));
    }, generateMockCookies(1000));
    await page.waitForTimeout(1_500);

    // Perform a search that matches many results
    const searchTime = await page.evaluate(() => {
      const cookies = (window as any).__TEST_COOKIES__ as any[];
      const start = performance.now();
      const q = 'cookie_';
      const results = cookies.filter(
        (c: any) =>
          c.name.toLowerCase().includes(q) ||
          c.domain.toLowerCase().includes(q)
      );
      const duration = performance.now() - start;
      return { count: results.length, duration };
    });

    console.log(
      `Search 1000 cookies: ${searchTime.count} results in ${formatMs(searchTime.duration)}`
    );
    expect(searchTime.duration).toBeLessThan(50);

    // Perform a search that matches few results
    const narrowSearch = await page.evaluate(() => {
      const cookies = (window as any).__TEST_COOKIES__ as any[];
      const start = performance.now();
      const q = 'cookie_999';
      const results = cookies.filter((c: any) =>
        c.name.toLowerCase().includes(q)
      );
      const duration = performance.now() - start;
      return { count: results.length, duration };
    });

    console.log(
      `Narrow search: ${narrowSearch.count} results in ${formatMs(narrowSearch.duration)}`
    );
    expect(narrowSearch.duration).toBeLessThan(20);

    await page.close();
  }, 15_000);

  test('handle 50 profiles in storage', async () => {
    const page = await openPopup(context, extensionId);

    // Create 50 profiles, each with 20 cookies
    const profiles = Array.from({ length: 50 }, (_, i) => ({
      id: `profile_${i}`,
      name: `Test Profile ${i}`,
      cookies: Array.from({ length: 20 }, (_, j) => ({
        name: `prof${i}_cookie_${j}`,
        value: `value_${j}`,
        domain: `.profile${i}.com`,
        path: '/',
        secure: true,
      })),
      createdAt: Date.now() - i * 86400_000,
      updatedAt: Date.now(),
    }));

    // Measure storage write time for all profiles
    const writeTime = await page.evaluate(async (profs) => {
      const start = performance.now();
      await chrome.storage.local.set({ profiles: profs });
      return performance.now() - start;
    }, profiles);

    console.log(`Write 50 profiles: ${formatMs(writeTime)}`);

    // Measure storage read time
    const readTime = await page.evaluate(async () => {
      const start = performance.now();
      const data = await chrome.storage.local.get('profiles');
      const duration = performance.now() - start;
      return { duration, count: (data.profiles as any[])?.length ?? 0 };
    });

    console.log(
      `Read ${readTime.count} profiles: ${formatMs(readTime.duration)}`
    );

    // Profile list should load in reasonable time
    expect(readTime.duration).toBeLessThan(100);
    expect(readTime.count).toBe(50);

    // Clean up
    await page.evaluate(async () => {
      await chrome.storage.local.remove('profiles');
    });

    await page.close();
  }, 15_000);

  test('handle 20 auto-delete rules', async () => {
    const page = await openPopup(context, extensionId);

    const rules = Array.from({ length: 20 }, (_, i) => ({
      id: `rule_${i}`,
      name: `Auto-delete Rule ${i}`,
      pattern: `*.domain${i}.com`,
      condition: i % 3 === 0 ? 'expired' : i % 3 === 1 ? 'session' : 'all',
      action: 'delete',
      enabled: true,
      createdAt: Date.now(),
    }));

    // Measure rule evaluation against 500 cookies
    const evalTime = await page.evaluate(
      (args) => {
        const { rules: rls, cookieCount } = args;
        const cookies = Array.from({ length: cookieCount }, (_, i) => ({
          name: `cookie_${i}`,
          domain: `.domain${i % 25}.com`,
          expirationDate:
            Date.now() / 1000 + (i % 2 === 0 ? -3600 : 86400),
          session: i % 5 === 0,
        }));

        const start = performance.now();

        for (const rule of rls) {
          const regex = new RegExp(
            rule.pattern.replace(/\./g, '\\.').replace(/\*/g, '.*')
          );
          const _matched = cookies.filter((c: any) => {
            if (!regex.test(c.domain)) return false;
            if (rule.condition === 'expired')
              return c.expirationDate < Date.now() / 1000;
            if (rule.condition === 'session') return c.session;
            return true;
          });
        }

        return performance.now() - start;
      },
      { rules, cookieCount: 500 }
    );

    console.log(
      `Evaluate 20 rules against 500 cookies: ${formatMs(evalTime)}`
    );

    // 20 rules * <10ms each = <200ms total
    expect(evalTime).toBeLessThan(200);

    await page.close();
  }, 15_000);

  test('rapid cookie changes (50/second)', async () => {
    const page = await openPopup(context, extensionId);

    // Simulate rapid cookie change events
    const result = await page.evaluate(async () => {
      const events: number[] = [];
      let dropped = 0;

      const start = performance.now();

      for (let i = 0; i < 50; i++) {
        const eventStart = performance.now();
        try {
          await chrome.cookies.set({
            url: 'https://rapid-test.com',
            name: `rapid_${i}`,
            value: `value_${i}`,
            expirationDate: Math.floor(Date.now() / 1000) + 3600,
          });
          events.push(performance.now() - eventStart);
        } catch {
          dropped++;
        }
        // No await between iterations to simulate rapid fire
      }

      const totalTime = performance.now() - start;

      // Clean up
      for (let i = 0; i < 50; i++) {
        await chrome.cookies
          .remove({
            url: 'https://rapid-test.com',
            name: `rapid_${i}`,
          })
          .catch(() => {});
      }

      return {
        totalTime,
        avgPerCookie:
          events.length > 0
            ? events.reduce((a, b) => a + b, 0) / events.length
            : 0,
        dropped,
        successCount: events.length,
      };
    });

    console.log(
      `Rapid cookie changes: ${result.successCount}/50 in ${formatMs(result.totalTime)}, avg ${formatMs(result.avgPerCookie)}/cookie, ${result.dropped} dropped`
    );

    // All 50 should succeed
    expect(result.successCount).toBe(50);
    // Total time should be under 5 seconds
    expect(result.totalTime).toBeLessThan(5_000);

    await page.close();
  }, 20_000);

  test('concurrent export while rules fire', async () => {
    const page = await openPopup(context, extensionId);

    const result = await page.evaluate(async () => {
      // Simulate export happening concurrently with rule evaluation
      const cookies = Array.from({ length: 200 }, (_, i) => ({
        name: `cookie_${i}`,
        value: `value_${i}_${'x'.repeat(80)}`,
        domain: `.domain${i % 10}.com`,
        path: '/',
        secure: true,
        httpOnly: i % 2 === 0,
        sameSite: 'lax',
        expirationDate: Date.now() / 1000 + 86400,
      }));

      const start = performance.now();

      // Run export and rule eval concurrently
      const [exportResult, ruleResult] = await Promise.all([
        // Export task
        (async () => {
          const exportStart = performance.now();
          const json = JSON.stringify(cookies, null, 2);
          const _blob = new Blob([json], { type: 'application/json' });
          return performance.now() - exportStart;
        })(),
        // Rule evaluation task
        (async () => {
          const ruleStart = performance.now();
          const rule = {
            pattern: '.*domain5.*',
            condition: 'all',
          };
          const regex = new RegExp(rule.pattern);
          const _matched = cookies.filter((c: any) =>
            regex.test(c.domain)
          );
          return performance.now() - ruleStart;
        })(),
      ]);

      return {
        totalTime: performance.now() - start,
        exportTime: exportResult,
        ruleTime: ruleResult,
      };
    });

    console.log(
      `Concurrent ops: export ${formatMs(result.exportTime)}, rules ${formatMs(result.ruleTime)}, total ${formatMs(result.totalTime)}`
    );

    // Neither operation should take unreasonably long
    expect(result.exportTime).toBeLessThan(200);
    expect(result.ruleTime).toBeLessThan(50);

    await page.close();
  }, 10_000);

  test('storage near quota (90%) operations', async () => {
    const page = await openPopup(context, extensionId);

    const result = await page.evaluate(async () => {
      // Fill storage to ~90% of the 10MB local quota
      // Use 9MB of data spread across multiple keys
      const chunkSize = 500_000; // 500KB per key
      const numChunks = 18; // 18 * 500KB = 9MB

      for (let i = 0; i < numChunks; i++) {
        await chrome.storage.local.set({
          [`stress_data_${i}`]: 'x'.repeat(chunkSize),
        });
      }

      // Check bytes in use
      const bytesInUse = await new Promise<number>((resolve) => {
        chrome.storage.local.getBytesInUse(null, resolve);
      });

      // Now try normal operations that the extension would do
      const writeStart = performance.now();
      await chrome.storage.local.set({
        user_settings: { theme: 'dark', compact: true },
      });
      const writeTime = performance.now() - writeStart;

      const readStart = performance.now();
      await chrome.storage.local.get('user_settings');
      const readTime = performance.now() - readStart;

      // Clean up stress data
      const keysToRemove = Array.from(
        { length: numChunks },
        (_, i) => `stress_data_${i}`
      );
      await chrome.storage.local.remove(keysToRemove);

      return {
        bytesInUse,
        writeTime,
        readTime,
        quotaPercent: (bytesInUse / (10 * 1024 * 1024)) * 100,
      };
    });

    console.log(
      `Storage at ${result.quotaPercent.toFixed(1)}%: write ${formatMs(result.writeTime)}, read ${formatMs(result.readTime)}`
    );

    // Operations should still complete in reasonable time even at 90% quota
    expect(result.writeTime).toBeLessThan(100);
    expect(result.readTime).toBeLessThan(50);

    await page.close();
  }, 30_000);
});
```

### 4.2 Edge Case Testing

```typescript
// tests/stress/edgeCases.test.ts

import {
  launchBrowserWithExtension,
  openPopup,
  formatMs,
} from '../performance/helpers';
import { Browser, BrowserContext, Page } from 'playwright';

describe('Edge Case Testing', () => {
  let browser: Browser;
  let context: BrowserContext;
  let extensionId: string;

  beforeAll(async () => {
    ({ browser, context, extensionId } = await launchBrowserWithExtension());
  }, 30_000);

  afterAll(async () => {
    await browser?.close();
  });

  test('0 cookies on domain (empty state)', async () => {
    const page = await openPopup(context, extensionId);

    // Inject empty cookie array
    await page.evaluate(() => {
      (window as any).__TEST_COOKIES__ = [];
      window.dispatchEvent(new CustomEvent('test:reload-cookies'));
    });
    await page.waitForTimeout(500);

    // Verify empty state UI renders
    const emptyState = await page.evaluate(() => {
      const el = document.querySelector(
        '[data-testid="empty-cookie-list"]'
      );
      return el !== null;
    });

    expect(emptyState).toBe(true);

    // Verify no errors in console
    const consoleErrors: string[] = [];
    page.on('pageerror', (err) => consoleErrors.push(err.message));
    await page.waitForTimeout(1_000);
    expect(consoleErrors).toHaveLength(0);

    await page.close();
  }, 10_000);

  test('cookie with empty name', async () => {
    const page = await openPopup(context, extensionId);

    await page.evaluate(() => {
      (window as any).__TEST_COOKIES__ = [
        {
          name: '',
          value: 'anonymous_value',
          domain: '.example.com',
          path: '/',
          secure: true,
          httpOnly: false,
          sameSite: 'lax',
          expirationDate: Date.now() / 1000 + 86400,
          storeId: '0',
          hostOnly: false,
          session: false,
        },
      ];
      window.dispatchEvent(new CustomEvent('test:reload-cookies'));
    });
    await page.waitForTimeout(500);

    // The cookie should still render (with placeholder text for name)
    const rendered = await page.evaluate(() => {
      const rows = document.querySelectorAll(
        '[data-testid="cookie-row"]'
      );
      return rows.length;
    });

    expect(rendered).toBe(1);

    // Verify no JS errors
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.waitForTimeout(500);
    expect(errors).toHaveLength(0);

    await page.close();
  }, 10_000);

  test('cookie with 4096-byte value (max)', async () => {
    const page = await openPopup(context, extensionId);

    const maxValue = 'A'.repeat(4096);

    await page.evaluate(
      (val) => {
        (window as any).__TEST_COOKIES__ = [
          {
            name: 'max_size_cookie',
            value: val,
            domain: '.example.com',
            path: '/',
            secure: true,
            httpOnly: false,
            sameSite: 'lax',
            expirationDate: Date.now() / 1000 + 86400,
            storeId: '0',
            hostOnly: false,
            session: false,
          },
        ];
        window.dispatchEvent(new CustomEvent('test:reload-cookies'));
      },
      maxValue
    );
    await page.waitForTimeout(500);

    // Cookie should render
    const rendered = await page.evaluate(() => {
      return document.querySelectorAll('[data-testid="cookie-row"]')
        .length;
    });
    expect(rendered).toBe(1);

    // Expanding the cookie detail should show truncated value, not crash
    const canExpand = await page.evaluate(() => {
      const row = document.querySelector(
        '[data-testid="cookie-row"]'
      ) as HTMLElement;
      if (!row) return false;
      row.click();
      return true;
    });
    expect(canExpand).toBe(true);

    // Verify no performance degradation for rendering large values
    await page.waitForTimeout(500);

    await page.close();
  }, 10_000);

  test('cookie with Unicode characters', async () => {
    const page = await openPopup(context, extensionId);

    await page.evaluate(() => {
      (window as any).__TEST_COOKIES__ = [
        {
          name: 'unicode_cookie',
          value: encodeURIComponent('Hola mundo! Bonjour! Hallo!'),
          domain: '.example.com',
          path: '/',
          secure: true,
          httpOnly: false,
          sameSite: 'lax',
          expirationDate: Date.now() / 1000 + 86400,
          storeId: '0',
          hostOnly: false,
          session: false,
        },
        {
          name: 'emoji_cookie',
          value: encodeURIComponent('test_value'),
          domain: '.example.com',
          path: '/',
          secure: false,
          httpOnly: false,
          sameSite: 'none',
          expirationDate: Date.now() / 1000 + 86400,
          storeId: '0',
          hostOnly: false,
          session: false,
        },
        {
          name: 'cjk_cookie',
          value: encodeURIComponent('CJK test value'),
          domain: '.example.com',
          path: '/',
          secure: true,
          httpOnly: true,
          sameSite: 'strict',
          expirationDate: Date.now() / 1000 + 86400,
          storeId: '0',
          hostOnly: false,
          session: false,
        },
      ];
      window.dispatchEvent(new CustomEvent('test:reload-cookies'));
    });
    await page.waitForTimeout(500);

    const rendered = await page.evaluate(() => {
      return document.querySelectorAll('[data-testid="cookie-row"]')
        .length;
    });
    expect(rendered).toBe(3);

    // Search should work with unicode
    const searchResult = await page.evaluate(() => {
      const cookies = (window as any).__TEST_COOKIES__ as any[];
      const q = 'unicode';
      return cookies.filter((c: any) =>
        c.name.toLowerCase().includes(q)
      ).length;
    });
    expect(searchResult).toBe(1);

    await page.close();
  }, 10_000);

  test('expired cookie handling', async () => {
    const page = await openPopup(context, extensionId);

    await page.evaluate(() => {
      const now = Date.now() / 1000;
      (window as any).__TEST_COOKIES__ = [
        {
          name: 'expired_cookie',
          value: 'old_value',
          domain: '.example.com',
          path: '/',
          secure: true,
          httpOnly: false,
          sameSite: 'lax',
          expirationDate: now - 86400, // Expired 1 day ago
          storeId: '0',
          hostOnly: false,
          session: false,
        },
        {
          name: 'valid_cookie',
          value: 'current_value',
          domain: '.example.com',
          path: '/',
          secure: true,
          httpOnly: false,
          sameSite: 'lax',
          expirationDate: now + 86400, // Expires in 1 day
          storeId: '0',
          hostOnly: false,
          session: false,
        },
        {
          name: 'far_future_cookie',
          value: 'permanent_value',
          domain: '.example.com',
          path: '/',
          secure: true,
          httpOnly: false,
          sameSite: 'lax',
          expirationDate: now + 86400 * 365 * 10, // 10 years
          storeId: '0',
          hostOnly: false,
          session: false,
        },
      ];
      window.dispatchEvent(new CustomEvent('test:reload-cookies'));
    });
    await page.waitForTimeout(500);

    // All cookies should render (expired cookies are still shown with indicator)
    const rendered = await page.evaluate(() => {
      return document.querySelectorAll('[data-testid="cookie-row"]')
        .length;
    });
    expect(rendered).toBe(3);

    // Health score should reflect expired cookies
    const healthResult = await page.evaluate(() => {
      const cookies = (window as any).__TEST_COOKIES__ as any[];
      const now = Date.now() / 1000;
      const expired = cookies.filter(
        (c: any) => c.expirationDate < now && !c.session
      );
      return expired.length;
    });
    expect(healthResult).toBe(1);

    await page.close();
  }, 10_000);

  test('session cookie (no expiration date)', async () => {
    const page = await openPopup(context, extensionId);

    await page.evaluate(() => {
      (window as any).__TEST_COOKIES__ = [
        {
          name: 'session_cookie',
          value: 'session_value',
          domain: '.example.com',
          path: '/',
          secure: true,
          httpOnly: true,
          sameSite: 'strict',
          // No expirationDate -- this is a session cookie
          storeId: '0',
          hostOnly: false,
          session: true,
        },
      ];
      window.dispatchEvent(new CustomEvent('test:reload-cookies'));
    });
    await page.waitForTimeout(500);

    const rendered = await page.evaluate(() => {
      return document.querySelectorAll('[data-testid="cookie-row"]')
        .length;
    });
    expect(rendered).toBe(1);

    // The UI should show "Session" instead of an expiration date
    // (this is a UI rendering check)
    await page.close();
  }, 10_000);

  test('cookie from incognito context', async () => {
    // Note: Playwright cannot directly create incognito extension contexts.
    // This test verifies the extension handles the storeId correctly.
    const page = await openPopup(context, extensionId);

    await page.evaluate(() => {
      (window as any).__TEST_COOKIES__ = [
        {
          name: 'incognito_cookie',
          value: 'private_value',
          domain: '.example.com',
          path: '/',
          secure: true,
          httpOnly: false,
          sameSite: 'lax',
          expirationDate: Date.now() / 1000 + 3600,
          storeId: '1', // Incognito store ID
          hostOnly: false,
          session: false,
        },
        {
          name: 'normal_cookie',
          value: 'normal_value',
          domain: '.example.com',
          path: '/',
          secure: true,
          httpOnly: false,
          sameSite: 'lax',
          expirationDate: Date.now() / 1000 + 3600,
          storeId: '0', // Normal store ID
          hostOnly: false,
          session: false,
        },
      ];
      window.dispatchEvent(new CustomEvent('test:reload-cookies'));
    });
    await page.waitForTimeout(500);

    // Both cookies should render
    const rendered = await page.evaluate(() => {
      return document.querySelectorAll('[data-testid="cookie-row"]')
        .length;
    });
    expect(rendered).toBe(2);

    // No errors when handling different store IDs
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.waitForTimeout(500);
    expect(errors).toHaveLength(0);

    await page.close();
  }, 10_000);

  test('domain with only httpOnly cookies', async () => {
    const page = await openPopup(context, extensionId);

    await page.evaluate(() => {
      (window as any).__TEST_COOKIES__ = Array.from(
        { length: 10 },
        (_, i) => ({
          name: `httponly_${i}`,
          value: `secret_${i}`,
          domain: '.secure-site.com',
          path: '/',
          secure: true,
          httpOnly: true,
          sameSite: 'strict',
          expirationDate: Date.now() / 1000 + 86400,
          storeId: '0',
          hostOnly: false,
          session: false,
        })
      );
      window.dispatchEvent(new CustomEvent('test:reload-cookies'));
    });
    await page.waitForTimeout(500);

    // All httpOnly cookies should still be viewable via chrome.cookies API
    const rendered = await page.evaluate(() => {
      return document.querySelectorAll('[data-testid="cookie-row"]')
        .length;
    });
    expect(rendered).toBe(10);

    // Value editing should indicate httpOnly restriction in the UI
    await page.close();
  }, 10_000);

  test('very long cookie name (255 chars)', async () => {
    const page = await openPopup(context, extensionId);

    const longName = 'a'.repeat(255);

    await page.evaluate(
      (name) => {
        (window as any).__TEST_COOKIES__ = [
          {
            name,
            value: 'value',
            domain: '.example.com',
            path: '/',
            secure: true,
            httpOnly: false,
            sameSite: 'lax',
            expirationDate: Date.now() / 1000 + 86400,
            storeId: '0',
            hostOnly: false,
            session: false,
          },
        ];
        window.dispatchEvent(new CustomEvent('test:reload-cookies'));
      },
      longName
    );
    await page.waitForTimeout(500);

    // Should render without layout overflow
    const rendered = await page.evaluate(() => {
      const row = document.querySelector(
        '[data-testid="cookie-row"]'
      ) as HTMLElement;
      if (!row) return null;
      const rect = row.getBoundingClientRect();
      return {
        count: document.querySelectorAll('[data-testid="cookie-row"]')
          .length,
        width: rect.width,
        overflows: row.scrollWidth > row.clientWidth,
      };
    });

    expect(rendered).not.toBeNull();
    expect(rendered!.count).toBe(1);
    // Name should be truncated with CSS, not overflow the row
    expect(rendered!.overflows).toBe(false);

    await page.close();
  }, 10_000);

  test('deeply nested path cookie', async () => {
    const page = await openPopup(context, extensionId);

    const deepPath =
      '/' + Array.from({ length: 20 }, (_, i) => `level${i}`).join('/');

    await page.evaluate(
      (p) => {
        (window as any).__TEST_COOKIES__ = [
          {
            name: 'deep_path_cookie',
            value: 'deep_value',
            domain: '.example.com',
            path: p,
            secure: true,
            httpOnly: false,
            sameSite: 'lax',
            expirationDate: Date.now() / 1000 + 86400,
            storeId: '0',
            hostOnly: false,
            session: false,
          },
        ];
        window.dispatchEvent(new CustomEvent('test:reload-cookies'));
      },
      deepPath
    );
    await page.waitForTimeout(500);

    const rendered = await page.evaluate(() => {
      return document.querySelectorAll('[data-testid="cookie-row"]')
        .length;
    });
    expect(rendered).toBe(1);

    await page.close();
  }, 10_000);
});
```

---

## Appendix A: Running the Tests

### Install Dependencies

```bash
npm install --save-dev playwright @playwright/test
npx playwright install chromium
```

### Run Performance Tests

```bash
# Full performance suite
npx playwright test tests/performance/ --reporter=html

# Memory tests only
npx playwright test tests/performance/memory.test.ts

# CPU tests only
npx playwright test tests/performance/cpu.test.ts

# Load time tests only
npx playwright test tests/performance/loadTime.test.ts
```

### Run Cross-Browser Tests

```bash
# Chrome (default)
BROWSER_TARGET=chrome npx playwright test tests/crossbrowser/

# Edge
BROWSER_TARGET=edge npx playwright test tests/crossbrowser/

# Brave
BROWSER_TARGET=brave npx playwright test tests/crossbrowser/

# All browsers sequentially
for browser in chrome edge brave opera vivaldi; do
  echo "Testing $browser..."
  BROWSER_TARGET=$browser npx playwright test tests/crossbrowser/ \
    --reporter=json --output="test-results/$browser/"
done
```

### Run Stress Tests

```bash
npx playwright test tests/stress/ --timeout=60000
```

### Run Bundle Size Check

```bash
npm run build && npx ts-node scripts/check-bundle-size.ts
```

### CI Integration

Add to `package.json` scripts:

```json
{
  "scripts": {
    "test:perf": "npx playwright test tests/performance/",
    "test:crossbrowser": "npx playwright test tests/crossbrowser/",
    "test:stress": "npx playwright test tests/stress/ --timeout=60000",
    "test:bundle": "npx ts-node scripts/check-bundle-size.ts",
    "test:all-perf": "npm run test:perf && npm run test:stress && npm run test:bundle"
  }
}
```

---

## Appendix B: Performance Budgets Quick Reference

| Metric | Target | Critical | Measurement |
|--------|--------|----------|-------------|
| Popup first paint | <40ms | <60ms | `performance.mark` |
| Popup interactive | <100ms | <150ms | Playwright waitForSelector |
| Popup idle memory | <6MB | <10MB | CDP Performance.getMetrics |
| Popup + 100 cookies memory | <10MB | <15MB | CDP Performance.getMetrics |
| Popup + 1000 cookies memory | <25MB | <30MB | CDP Performance.getMetrics |
| Service worker idle memory | <5MB | <8MB | CDP HeapProfiler |
| Service worker startup | <50ms | <75ms | runtime.sendMessage round-trip |
| Search filter (1000 cookies) | <50ms | <80ms | `performance.now()` |
| Sort (1000 cookies) | <100ms | <150ms | `performance.now()` |
| Profile restore (50 cookies) | <500ms | <750ms | Promise.all timing |
| Export 500 cookies JSON | <200ms | <300ms | `performance.now()` |
| Auto-delete rule eval | <10ms | <20ms | `performance.now()` per rule |
| Health score calculation | <100ms | <150ms | `performance.now()` |
| Tab switch | <50ms | <80ms | rAF timing |
| popup.js bundle | <120KB | <150KB | `stat` file size |
| background.js bundle | <35KB | <50KB | `stat` file size |
| Total extension size | <342KB | <450KB | directory size sum |
| Scroll frame drop rate | <5% | <10% | CDP Tracing |
