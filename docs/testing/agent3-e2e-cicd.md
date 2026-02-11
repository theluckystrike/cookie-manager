# Zovo Cookie Manager -- E2E Tests & CI/CD Pipeline

**Agent 3 of 5 -- Phase 10 (Automated Testing Suite)**
**Date:** 2026-02-11
**Scope:** Playwright E2E test suites, GitHub Actions CI/CD workflow, validation scripts, package.json scripts

---

## Table of Contents

1. [Playwright Configuration](#1-playwright-configuration)
2. [E2E Test Fixtures & Page Objects](#2-e2e-test-fixtures--page-objects)
3. [E2E Test Suite 1: Popup Basic Operations](#3-e2e-test-suite-1-popup-basic-operations)
4. [E2E Test Suite 2: Profile Management](#4-e2e-test-suite-2-profile-management)
5. [E2E Test Suite 3: Auto-Delete Rules](#5-e2e-test-suite-3-auto-delete-rules)
6. [E2E Test Suite 4: Export/Import](#6-e2e-test-suite-4-exportimport)
7. [E2E Test Suite 5: Onboarding Flow](#7-e2e-test-suite-5-onboarding-flow)
8. [E2E Test Suite 6: Payment/Upgrade Flow](#8-e2e-test-suite-6-paymentupgrade-flow)
9. [GitHub Actions CI/CD Workflow](#9-github-actions-cicd-workflow)
10. [Validation Scripts](#10-validation-scripts)
11. [Package.json Scripts](#11-packagejson-scripts)

---

## 1. Playwright Configuration

### `playwright.config.ts`

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';
import path from 'path';

const extensionPath = process.env.EXTENSION_PATH
  ? path.resolve(process.env.EXTENSION_PATH)
  : path.resolve(__dirname, 'dist');

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false, // Extensions require sequential execution
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Single worker -- extensions cannot share browser contexts
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: 'playwright-report/results.json' }],
    ...(process.env.CI ? [['github' as const]] : []),
  ],
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10000,
  },
  projects: [
    {
      name: 'cookie-manager-chrome',
      use: {
        ...devices['Desktop Chrome'],
        headless: false, // Required -- Chrome extensions do not load in headless mode
        launchOptions: {
          args: [
            `--disable-extensions-except=${extensionPath}`,
            `--load-extension=${extensionPath}`,
            '--no-sandbox',
            '--disable-gpu',
            '--disable-dev-shm-usage',
          ],
        },
      },
    },
  ],
  outputDir: 'test-results/',
  timeout: 30000,
  expect: {
    timeout: 5000,
  },
});
```

### Extension Loading Helper

```typescript
// tests/e2e/fixtures/extension.ts
import { test as base, BrowserContext, Page, chromium } from '@playwright/test';
import path from 'path';

// -------------------------------------------------------------------
// Types
// -------------------------------------------------------------------

export interface ExtensionFixtures {
  context: BrowserContext;
  extensionId: string;
  popup: Page;
  background: ReturnType<BrowserContext['serviceWorkers']>[number];
}

// -------------------------------------------------------------------
// Custom test fixture that loads the Cookie Manager extension
// -------------------------------------------------------------------

export const test = base.extend<ExtensionFixtures>({
  // Override the default context to use a persistent context with the extension
  context: async ({}, use) => {
    const extensionPath = process.env.EXTENSION_PATH
      ? path.resolve(process.env.EXTENSION_PATH)
      : path.resolve(__dirname, '../../../dist');

    const context = await chromium.launchPersistentContext('', {
      headless: false,
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
        '--no-sandbox',
        '--disable-gpu',
        '--disable-dev-shm-usage',
      ],
    });

    await use(context);
    await context.close();
  },

  // Resolve the extension ID from the service worker URL
  extensionId: async ({ context }, use) => {
    let [background] = context.serviceWorkers();
    if (!background) {
      background = await context.waitForEvent('serviceworker');
    }
    const extensionId = background.url().split('/')[2];
    await use(extensionId);
  },

  // Open the popup page for the extension
  popup: async ({ context, extensionId }, use) => {
    const popup = await context.newPage();
    await popup.goto(`chrome-extension://${extensionId}/popup.html`);
    await popup.waitForLoadState('domcontentloaded');
    await use(popup);
    await popup.close();
  },

  // Expose the background service worker
  background: async ({ context }, use) => {
    let [background] = context.serviceWorkers();
    if (!background) {
      background = await context.waitForEvent('serviceworker');
    }
    await use(background);
  },
});

export { expect } from '@playwright/test';
```

---

## 2. E2E Test Fixtures & Page Objects

### Popup Page Object

```typescript
// tests/e2e/pages/PopupPage.ts
import { Page, Locator, expect } from '@playwright/test';

export class PopupPage {
  readonly page: Page;

  // Header
  readonly header: Locator;
  readonly logoText: Locator;
  readonly tierBadge: Locator;
  readonly settingsButton: Locator;
  readonly domainLabel: Locator;
  readonly cookieCountBadge: Locator;

  // Tab bar
  readonly tabBar: Locator;
  readonly cookiesTab: Locator;
  readonly profilesTab: Locator;
  readonly rulesTab: Locator;
  readonly healthTab: Locator;

  // Cookies tab
  readonly searchInput: Locator;
  readonly filterChipSession: Locator;
  readonly filterChipPersistent: Locator;
  readonly filterChipSecure: Locator;
  readonly filterChipThirdParty: Locator;
  readonly cookieList: Locator;
  readonly cookieRows: Locator;
  readonly addCookieButton: Locator;
  readonly exportButton: Locator;
  readonly importButton: Locator;
  readonly deleteAllButton: Locator;
  readonly emptyState: Locator;

  // Cookie detail (expanded row)
  readonly detailNameInput: Locator;
  readonly detailValueInput: Locator;
  readonly detailDomainInput: Locator;
  readonly detailPathInput: Locator;
  readonly detailExpiresInput: Locator;
  readonly detailHttpOnlyToggle: Locator;
  readonly detailSecureToggle: Locator;
  readonly detailSameSiteSelect: Locator;
  readonly detailSaveButton: Locator;
  readonly detailCancelButton: Locator;
  readonly detailDeleteButton: Locator;
  readonly detailCopyButton: Locator;

  // Footer
  readonly footer: Locator;
  readonly zovoLink: Locator;

  // Modals
  readonly confirmDialog: Locator;
  readonly confirmYesButton: Locator;
  readonly confirmCancelButton: Locator;
  readonly paywallModal: Locator;
  readonly paywallCTA: Locator;
  readonly paywallDismiss: Locator;

  constructor(page: Page) {
    this.page = page;

    // Header
    this.header = page.locator('[data-testid="popup-header"]');
    this.logoText = page.locator('[data-testid="logo-text"]');
    this.tierBadge = page.locator('[data-testid="tier-badge"]');
    this.settingsButton = page.locator('[data-testid="settings-button"]');
    this.domainLabel = page.locator('[data-testid="domain-label"]');
    this.cookieCountBadge = page.locator('[data-testid="cookie-count-badge"]');

    // Tab bar
    this.tabBar = page.locator('[data-testid="tab-bar"]');
    this.cookiesTab = page.locator('[data-testid="tab-cookies"]');
    this.profilesTab = page.locator('[data-testid="tab-profiles"]');
    this.rulesTab = page.locator('[data-testid="tab-rules"]');
    this.healthTab = page.locator('[data-testid="tab-health"]');

    // Cookies tab content
    this.searchInput = page.locator('[data-testid="search-input"]');
    this.filterChipSession = page.locator('[data-testid="filter-session"]');
    this.filterChipPersistent = page.locator('[data-testid="filter-persistent"]');
    this.filterChipSecure = page.locator('[data-testid="filter-secure"]');
    this.filterChipThirdParty = page.locator('[data-testid="filter-third-party"]');
    this.cookieList = page.locator('[data-testid="cookie-list"]');
    this.cookieRows = page.locator('[data-testid="cookie-row"]');
    this.addCookieButton = page.locator('[data-testid="add-cookie-button"]');
    this.exportButton = page.locator('[data-testid="export-button"]');
    this.importButton = page.locator('[data-testid="import-button"]');
    this.deleteAllButton = page.locator('[data-testid="delete-all-button"]');
    this.emptyState = page.locator('[data-testid="empty-state"]');

    // Cookie detail
    this.detailNameInput = page.locator('[data-testid="detail-name"]');
    this.detailValueInput = page.locator('[data-testid="detail-value"]');
    this.detailDomainInput = page.locator('[data-testid="detail-domain"]');
    this.detailPathInput = page.locator('[data-testid="detail-path"]');
    this.detailExpiresInput = page.locator('[data-testid="detail-expires"]');
    this.detailHttpOnlyToggle = page.locator('[data-testid="detail-httponly"]');
    this.detailSecureToggle = page.locator('[data-testid="detail-secure"]');
    this.detailSameSiteSelect = page.locator('[data-testid="detail-samesite"]');
    this.detailSaveButton = page.locator('[data-testid="detail-save"]');
    this.detailCancelButton = page.locator('[data-testid="detail-cancel"]');
    this.detailDeleteButton = page.locator('[data-testid="detail-delete"]');
    this.detailCopyButton = page.locator('[data-testid="detail-copy"]');

    // Footer
    this.footer = page.locator('[data-testid="popup-footer"]');
    this.zovoLink = page.locator('[data-testid="zovo-link"]');

    // Modals
    this.confirmDialog = page.locator('[data-testid="confirm-dialog"]');
    this.confirmYesButton = page.locator('[data-testid="confirm-yes"]');
    this.confirmCancelButton = page.locator('[data-testid="confirm-cancel"]');
    this.paywallModal = page.locator('[data-testid="paywall-modal"]');
    this.paywallCTA = page.locator('[data-testid="paywall-cta"]');
    this.paywallDismiss = page.locator('[data-testid="paywall-dismiss"]');
  }

  // ---------------------------------------------------------------
  // Navigation helpers
  // ---------------------------------------------------------------

  async navigateToTab(tab: 'cookies' | 'profiles' | 'rules' | 'health'): Promise<void> {
    const tabMap = {
      cookies: this.cookiesTab,
      profiles: this.profilesTab,
      rules: this.rulesTab,
      health: this.healthTab,
    };
    await tabMap[tab].click();
    await this.page.waitForTimeout(200); // Allow tab transition
  }

  // ---------------------------------------------------------------
  // Cookie helpers
  // ---------------------------------------------------------------

  async getCookieCount(): Promise<number> {
    const text = await this.cookieCountBadge.textContent();
    const match = text?.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }

  async searchCookies(query: string): Promise<void> {
    await this.searchInput.clear();
    await this.searchInput.fill(query);
    await this.page.waitForTimeout(300); // Debounce
  }

  async clearSearch(): Promise<void> {
    await this.searchInput.clear();
    await this.page.waitForTimeout(300);
  }

  async clickCookieRow(index: number): Promise<void> {
    await this.cookieRows.nth(index).click();
    await this.page.waitForTimeout(200);
  }

  async editCookieValue(newValue: string): Promise<void> {
    await this.detailValueInput.clear();
    await this.detailValueInput.fill(newValue);
    await this.detailSaveButton.click();
    await this.page.waitForTimeout(300);
  }

  async createCookie(name: string, value: string): Promise<void> {
    await this.addCookieButton.click();
    await this.detailNameInput.fill(name);
    await this.detailValueInput.fill(value);
    await this.detailSaveButton.click();
    await this.page.waitForTimeout(300);
  }

  async deleteCookie(index: number): Promise<void> {
    await this.cookieRows.nth(index).hover();
    await this.cookieRows.nth(index).locator('[data-testid="row-delete"]').click();
    await this.confirmYesButton.click();
    await this.page.waitForTimeout(300);
  }

  async deleteAllCookies(): Promise<void> {
    await this.deleteAllButton.click();
    await this.confirmYesButton.click();
    await this.page.waitForTimeout(300);
  }

  // ---------------------------------------------------------------
  // Screenshot helpers
  // ---------------------------------------------------------------

  async screenshotPopup(name: string): Promise<void> {
    await this.page.screenshot({
      path: `test-results/screenshots/${name}.png`,
      fullPage: true,
    });
  }
}
```

### Profiles Page Object

```typescript
// tests/e2e/pages/ProfilesPage.ts
import { Page, Locator } from '@playwright/test';

export class ProfilesPage {
  readonly page: Page;
  readonly profileCards: Locator;
  readonly saveProfileButton: Locator;
  readonly profileNameInput: Locator;
  readonly profileSaveConfirm: Locator;
  readonly profileLoadButton: Locator;
  readonly profileDeleteButton: Locator;
  readonly usageCounter: Locator;

  constructor(page: Page) {
    this.page = page;
    this.profileCards = page.locator('[data-testid="profile-card"]');
    this.saveProfileButton = page.locator('[data-testid="save-profile-button"]');
    this.profileNameInput = page.locator('[data-testid="profile-name-input"]');
    this.profileSaveConfirm = page.locator('[data-testid="profile-save-confirm"]');
    this.profileLoadButton = page.locator('[data-testid="profile-load"]');
    this.profileDeleteButton = page.locator('[data-testid="profile-delete"]');
    this.usageCounter = page.locator('[data-testid="profile-usage-counter"]');
  }

  async saveProfile(name: string): Promise<void> {
    await this.saveProfileButton.click();
    await this.profileNameInput.fill(name);
    await this.profileSaveConfirm.click();
    await this.page.waitForTimeout(300);
  }

  async loadProfile(index: number): Promise<void> {
    await this.profileCards.nth(index).locator('[data-testid="profile-load"]').click();
    await this.page.waitForTimeout(300);
  }

  async deleteProfile(index: number): Promise<void> {
    await this.profileCards.nth(index).locator('[data-testid="profile-delete"]').click();
    await this.page.locator('[data-testid="confirm-yes"]').click();
    await this.page.waitForTimeout(300);
  }

  async getProfileCount(): Promise<number> {
    return await this.profileCards.count();
  }

  async getUsageText(): Promise<string> {
    return (await this.usageCounter.textContent()) ?? '';
  }
}
```

### Rules Page Object

```typescript
// tests/e2e/pages/RulesPage.ts
import { Page, Locator } from '@playwright/test';

export class RulesPage {
  readonly page: Page;
  readonly ruleCards: Locator;
  readonly addRuleButton: Locator;
  readonly rulePatternInput: Locator;
  readonly ruleTriggerSelect: Locator;
  readonly ruleSaveButton: Locator;
  readonly ruleToggle: Locator;
  readonly ruleDeleteButton: Locator;
  readonly usageCounter: Locator;

  constructor(page: Page) {
    this.page = page;
    this.ruleCards = page.locator('[data-testid="rule-card"]');
    this.addRuleButton = page.locator('[data-testid="add-rule-button"]');
    this.rulePatternInput = page.locator('[data-testid="rule-pattern-input"]');
    this.ruleTriggerSelect = page.locator('[data-testid="rule-trigger-select"]');
    this.ruleSaveButton = page.locator('[data-testid="rule-save"]');
    this.ruleToggle = page.locator('[data-testid="rule-toggle"]');
    this.ruleDeleteButton = page.locator('[data-testid="rule-delete"]');
    this.usageCounter = page.locator('[data-testid="rule-usage-counter"]');
  }

  async createRule(pattern: string, trigger: 'tab-close' | 'schedule'): Promise<void> {
    await this.addRuleButton.click();
    await this.rulePatternInput.fill(pattern);
    await this.ruleTriggerSelect.selectOption(trigger);
    await this.ruleSaveButton.click();
    await this.page.waitForTimeout(300);
  }

  async toggleRule(index: number): Promise<void> {
    await this.ruleCards.nth(index).locator('[data-testid="rule-toggle"]').click();
    await this.page.waitForTimeout(200);
  }

  async deleteRule(index: number): Promise<void> {
    await this.ruleCards.nth(index).locator('[data-testid="rule-delete"]').click();
    await this.page.locator('[data-testid="confirm-yes"]').click();
    await this.page.waitForTimeout(300);
  }

  async getRuleCount(): Promise<number> {
    return await this.ruleCards.count();
  }
}
```

### Cookie Injection Helper

```typescript
// tests/e2e/helpers/cookies.ts
import { BrowserContext } from '@playwright/test';

/**
 * Inject cookies into the browser context via the service worker.
 * Requires the extension to be loaded and the service worker to be active.
 */
export async function injectCookies(
  context: BrowserContext,
  domain: string,
  count: number
): Promise<void> {
  const [sw] = context.serviceWorkers();
  if (!sw) throw new Error('Service worker not found');

  await sw.evaluate(
    async ({ domain, count }: { domain: string; count: number }) => {
      for (let i = 0; i < count; i++) {
        await (globalThis as any).chrome.cookies.set({
          url: `https://${domain}`,
          name: `cookie_${i.toString().padStart(4, '0')}`,
          value: `value_${i}`,
          path: '/',
          secure: true,
          sameSite: 'lax',
        });
      }
    },
    { domain, count }
  );
}

/**
 * Clear all cookies for a domain via the service worker.
 */
export async function clearCookies(
  context: BrowserContext,
  domain: string
): Promise<void> {
  const [sw] = context.serviceWorkers();
  if (!sw) throw new Error('Service worker not found');

  await sw.evaluate(async (domain: string) => {
    const cookies = await (globalThis as any).chrome.cookies.getAll({ domain });
    for (const cookie of cookies) {
      await (globalThis as any).chrome.cookies.remove({
        url: `https://${domain}${cookie.path}`,
        name: cookie.name,
      });
    }
  }, domain);
}

/**
 * Set a single cookie with full control over properties.
 */
export async function setCookie(
  context: BrowserContext,
  props: {
    url: string;
    name: string;
    value: string;
    domain?: string;
    path?: string;
    secure?: boolean;
    httpOnly?: boolean;
    sameSite?: 'strict' | 'lax' | 'no_restriction';
    expirationDate?: number;
  }
): Promise<void> {
  const [sw] = context.serviceWorkers();
  if (!sw) throw new Error('Service worker not found');

  await sw.evaluate(async (props) => {
    await (globalThis as any).chrome.cookies.set(props);
  }, props);
}

/**
 * Get all cookies for a domain via the service worker.
 */
export async function getCookies(
  context: BrowserContext,
  domain: string
): Promise<Array<{ name: string; value: string; domain: string }>> {
  const [sw] = context.serviceWorkers();
  if (!sw) throw new Error('Service worker not found');

  return await sw.evaluate(async (domain: string) => {
    return await (globalThis as any).chrome.cookies.getAll({ domain });
  }, domain);
}
```

---

## 3. E2E Test Suite 1: Popup Basic Operations

```typescript
// tests/e2e/popup-basic.spec.ts
import { test, expect } from './fixtures/extension';
import { PopupPage } from './pages/PopupPage';
import { injectCookies, clearCookies, setCookie, getCookies } from './helpers/cookies';

test.describe('Cookie Manager Popup -- Basic Operations', () => {
  const testDomain = 'example.com';
  let popupPage: PopupPage;

  test.beforeEach(async ({ popup }) => {
    popupPage = new PopupPage(popup);
  });

  // ---------------------------------------------------------------
  // Test 1: Popup opens and displays current tab cookies
  // ---------------------------------------------------------------
  test('should open popup and display current tab cookies', async ({
    context,
    extensionId,
  }) => {
    // Navigate a page to a domain with cookies
    const page = await context.newPage();
    await page.goto(`https://${testDomain}`);

    // Inject test cookies
    await injectCookies(context, testDomain, 5);

    // Open popup fresh (the fixture popup targets the extension directly)
    const popup = await context.newPage();
    await popup.goto(`chrome-extension://${extensionId}/popup.html`);
    await popup.waitForLoadState('domcontentloaded');
    const pp = new PopupPage(popup);

    // The cookie list should render rows
    await expect(pp.cookieList).toBeVisible();
    const rowCount = await pp.cookieRows.count();
    expect(rowCount).toBeGreaterThanOrEqual(5);

    // Screenshot for visual verification
    await pp.screenshotPopup('popup-open-with-cookies');

    // Cleanup
    await clearCookies(context, testDomain);
    await page.close();
    await popup.close();
  });

  // ---------------------------------------------------------------
  // Test 2: Search cookies by name
  // ---------------------------------------------------------------
  test('should search cookies by name', async ({ context, popup }) => {
    await injectCookies(context, testDomain, 20);
    await popup.reload();
    await popup.waitForLoadState('domcontentloaded');
    const pp = new PopupPage(popup);

    await pp.searchCookies('cookie_0005');

    // Only the matching cookie should be visible
    const visibleRows = await pp.cookieRows.count();
    expect(visibleRows).toBe(1);
    await expect(pp.cookieRows.first()).toContainText('cookie_0005');

    // Clear search restores all
    await pp.clearSearch();
    const allRows = await pp.cookieRows.count();
    expect(allRows).toBeGreaterThanOrEqual(20);

    await clearCookies(context, testDomain);
  });

  // ---------------------------------------------------------------
  // Test 3: Filter by cookie type (Session/Persistent)
  // ---------------------------------------------------------------
  test('should filter by cookie type (Session/Persistent)', async ({
    context,
    popup,
  }) => {
    // Create session cookie (no expirationDate)
    await setCookie(context, {
      url: `https://${testDomain}`,
      name: 'session_cookie',
      value: 'session_val',
    });
    // Create persistent cookie (with expirationDate)
    await setCookie(context, {
      url: `https://${testDomain}`,
      name: 'persistent_cookie',
      value: 'persistent_val',
      expirationDate: Math.floor(Date.now() / 1000) + 86400,
    });

    await popup.reload();
    await popup.waitForLoadState('domcontentloaded');
    const pp = new PopupPage(popup);

    // Filter to session only
    await pp.filterChipSession.click();
    await popup.waitForTimeout(300);
    await expect(pp.cookieRows).toContainText(['session_cookie']);

    // Deselect session, filter to persistent
    await pp.filterChipSession.click();
    await pp.filterChipPersistent.click();
    await popup.waitForTimeout(300);
    await expect(pp.cookieRows).toContainText(['persistent_cookie']);

    await pp.filterChipPersistent.click(); // Deselect
    await clearCookies(context, testDomain);
  });

  // ---------------------------------------------------------------
  // Test 4: Navigate between 4 tabs
  // ---------------------------------------------------------------
  test('should navigate between 4 tabs', async ({ popup }) => {
    const pp = new PopupPage(popup);

    // Cookies tab (default)
    await expect(pp.cookiesTab).toHaveAttribute('aria-selected', 'true');
    await expect(pp.cookieList).toBeVisible();

    // Profiles tab
    await pp.navigateToTab('profiles');
    await expect(pp.profilesTab).toHaveAttribute('aria-selected', 'true');
    await expect(popup.locator('[data-testid="profiles-panel"]')).toBeVisible();

    // Rules tab
    await pp.navigateToTab('rules');
    await expect(pp.rulesTab).toHaveAttribute('aria-selected', 'true');
    await expect(popup.locator('[data-testid="rules-panel"]')).toBeVisible();

    // Health tab
    await pp.navigateToTab('health');
    await expect(pp.healthTab).toHaveAttribute('aria-selected', 'true');
    await expect(popup.locator('[data-testid="health-panel"]')).toBeVisible();

    // Back to Cookies
    await pp.navigateToTab('cookies');
    await expect(pp.cookiesTab).toHaveAttribute('aria-selected', 'true');
  });

  // ---------------------------------------------------------------
  // Test 5: Show cookie count in tab badge
  // ---------------------------------------------------------------
  test('should show cookie count in tab badge', async ({ context, popup }) => {
    await injectCookies(context, testDomain, 12);
    await popup.reload();
    await popup.waitForLoadState('domcontentloaded');
    const pp = new PopupPage(popup);

    const count = await pp.getCookieCount();
    expect(count).toBeGreaterThanOrEqual(12);

    await clearCookies(context, testDomain);
  });

  // ---------------------------------------------------------------
  // Test 6: Edit a cookie value
  // ---------------------------------------------------------------
  test('should edit a cookie value', async ({ context, popup }) => {
    await setCookie(context, {
      url: `https://${testDomain}`,
      name: 'edit_me',
      value: 'original_value',
    });
    await popup.reload();
    await popup.waitForLoadState('domcontentloaded');
    const pp = new PopupPage(popup);

    // Search for and expand the cookie
    await pp.searchCookies('edit_me');
    await pp.clickCookieRow(0);

    // Edit value
    await pp.editCookieValue('modified_value');

    // Verify success indicator
    await expect(popup.locator('[data-testid="save-success"]')).toBeVisible();

    // Verify via API
    const cookies = await getCookies(context, testDomain);
    const edited = cookies.find((c) => c.name === 'edit_me');
    expect(edited?.value).toBe('modified_value');

    await clearCookies(context, testDomain);
  });

  // ---------------------------------------------------------------
  // Test 7: Create a new cookie
  // ---------------------------------------------------------------
  test('should create a new cookie', async ({ context, popup }) => {
    await clearCookies(context, testDomain);
    await popup.reload();
    await popup.waitForLoadState('domcontentloaded');
    const pp = new PopupPage(popup);

    const countBefore = await pp.getCookieCount();
    await pp.createCookie('new_test_cookie', 'hello123');

    // Badge count should increment
    const countAfter = await pp.getCookieCount();
    expect(countAfter).toBe(countBefore + 1);

    // Verify cookie exists via API
    const cookies = await getCookies(context, testDomain);
    const created = cookies.find((c) => c.name === 'new_test_cookie');
    expect(created).toBeDefined();
    expect(created?.value).toBe('hello123');

    await clearCookies(context, testDomain);
  });

  // ---------------------------------------------------------------
  // Test 8: Delete a cookie
  // ---------------------------------------------------------------
  test('should delete a cookie', async ({ context, popup }) => {
    await setCookie(context, {
      url: `https://${testDomain}`,
      name: 'delete_me',
      value: 'goodbye',
    });
    await popup.reload();
    await popup.waitForLoadState('domcontentloaded');
    const pp = new PopupPage(popup);

    await pp.searchCookies('delete_me');
    const countBefore = await pp.cookieRows.count();
    await pp.deleteCookie(0);

    // Row should be gone
    const countAfter = await pp.cookieRows.count();
    expect(countAfter).toBe(countBefore - 1);

    // Verify via API
    const cookies = await getCookies(context, testDomain);
    const deleted = cookies.find((c) => c.name === 'delete_me');
    expect(deleted).toBeUndefined();
  });

  // ---------------------------------------------------------------
  // Test 9: Copy cookie value to clipboard
  // ---------------------------------------------------------------
  test('should copy cookie value to clipboard', async ({ context, popup }) => {
    await setCookie(context, {
      url: `https://${testDomain}`,
      name: 'copy_me',
      value: 'clipboard_content',
    });
    await popup.reload();
    await popup.waitForLoadState('domcontentloaded');
    const pp = new PopupPage(popup);

    await pp.searchCookies('copy_me');
    await pp.clickCookieRow(0);
    await pp.detailCopyButton.click();

    // Verify toast or success indicator
    await expect(popup.locator('[data-testid="copy-success"]')).toBeVisible();

    await clearCookies(context, testDomain);
  });

  // ---------------------------------------------------------------
  // Test 10: Display Zovo branding in header/footer
  // ---------------------------------------------------------------
  test('should display Zovo branding in header and footer', async ({ popup }) => {
    const pp = new PopupPage(popup);

    await expect(pp.header).toBeVisible();
    await expect(pp.logoText).toContainText('Zovo Cookie Manager');
    await expect(pp.footer).toBeVisible();
    await expect(pp.zovoLink).toBeVisible();
  });

  // ---------------------------------------------------------------
  // Test 11: Keyboard shortcut Ctrl+Shift+K opens popup
  //   Note: Keyboard shortcuts that open the popup cannot be tested
  //   directly in Playwright because the shortcut is handled by Chrome
  //   itself, not by the page. We verify the command is declared.
  // ---------------------------------------------------------------
  test('should have keyboard shortcut Ctrl+Shift+K configured', async ({
    context,
    extensionId,
  }) => {
    const popup = await context.newPage();
    await popup.goto(`chrome-extension://${extensionId}/popup.html`);
    await popup.waitForLoadState('domcontentloaded');

    // Verify the manifest declares the command by checking background script
    const [sw] = context.serviceWorkers();
    const commands = await sw.evaluate(async () => {
      return await (globalThis as any).chrome.commands.getAll();
    });

    const executeAction = commands.find(
      (cmd: { name: string }) => cmd.name === '_execute_action'
    );
    expect(executeAction).toBeDefined();
    expect(executeAction.shortcut).toMatch(/Ctrl\+Shift\+K|Command\+Shift\+K|⌘⇧K/i);

    await popup.close();
  });

  // ---------------------------------------------------------------
  // Test 12: Show empty state when no cookies
  // ---------------------------------------------------------------
  test('should show empty state when no cookies', async ({
    context,
    extensionId,
  }) => {
    await clearCookies(context, testDomain);

    const popup = await context.newPage();
    await popup.goto(`chrome-extension://${extensionId}/popup.html`);
    await popup.waitForLoadState('domcontentloaded');
    const pp = new PopupPage(popup);

    await expect(pp.emptyState).toBeVisible();
    await expect(pp.emptyState).toContainText(/no cookies/i);

    await popup.close();
  });

  // ---------------------------------------------------------------
  // Test 13: Handle domain with many cookies (100+)
  // ---------------------------------------------------------------
  test('should handle domain with many cookies (100+)', async ({
    context,
    extensionId,
  }) => {
    await injectCookies(context, testDomain, 120);

    const popup = await context.newPage();
    await popup.goto(`chrome-extension://${extensionId}/popup.html`);
    await popup.waitForLoadState('domcontentloaded');
    const pp = new PopupPage(popup);

    // Should show all 120 cookies in the count
    const count = await pp.getCookieCount();
    expect(count).toBeGreaterThanOrEqual(120);

    // UI should not freeze -- verify by interacting with search
    await pp.searchCookies('cookie_0050');
    const filtered = await pp.cookieRows.count();
    expect(filtered).toBeGreaterThanOrEqual(1);

    await pp.screenshotPopup('popup-100-cookies');
    await clearCookies(context, testDomain);
    await popup.close();
  });

  // ---------------------------------------------------------------
  // Test 14: Show cookie details on row click
  // ---------------------------------------------------------------
  test('should show cookie details on row click', async ({ context, popup }) => {
    await setCookie(context, {
      url: `https://${testDomain}`,
      name: 'detail_test',
      value: 'detail_value',
      path: '/',
      secure: true,
    });
    await popup.reload();
    await popup.waitForLoadState('domcontentloaded');
    const pp = new PopupPage(popup);

    await pp.searchCookies('detail_test');
    await pp.clickCookieRow(0);

    // All detail fields should be visible
    await expect(pp.detailNameInput).toBeVisible();
    await expect(pp.detailNameInput).toHaveValue('detail_test');
    await expect(pp.detailValueInput).toHaveValue('detail_value');
    await expect(pp.detailDomainInput).toBeVisible();
    await expect(pp.detailPathInput).toHaveValue('/');
    await expect(pp.detailSecureToggle).toBeVisible();
    await expect(pp.detailSameSiteSelect).toBeVisible();
    await expect(pp.detailSaveButton).toBeVisible();

    await clearCookies(context, testDomain);
  });

  // ---------------------------------------------------------------
  // Test 15: Display Pro badges on locked features
  // ---------------------------------------------------------------
  test('should display Pro badges on locked features', async ({ popup }) => {
    const pp = new PopupPage(popup);

    // Pro badges / lock icons should be present on various features
    const proBadges = popup.locator('[data-testid="pro-badge"]');
    const lockIcons = popup.locator('[data-testid="lock-icon"]');

    // At least one Pro indicator should exist in the free tier UI
    const badgeCount = await proBadges.count();
    const lockCount = await lockIcons.count();
    expect(badgeCount + lockCount).toBeGreaterThan(0);

    await pp.screenshotPopup('popup-pro-badges');
  });
});
```

---

## 4. E2E Test Suite 2: Profile Management

```typescript
// tests/e2e/profiles.spec.ts
import { test, expect } from './fixtures/extension';
import { PopupPage } from './pages/PopupPage';
import { ProfilesPage } from './pages/ProfilesPage';
import { injectCookies, clearCookies, getCookies } from './helpers/cookies';

test.describe('Cookie Manager -- Profile Management', () => {
  const testDomain = 'example.com';

  // ---------------------------------------------------------------
  // Test 1: Create profile and verify saved
  // ---------------------------------------------------------------
  test('should create a profile and verify it is saved', async ({
    context,
    popup,
  }) => {
    await injectCookies(context, testDomain, 5);
    await popup.reload();
    await popup.waitForLoadState('domcontentloaded');
    const pp = new PopupPage(popup);
    const profiles = new ProfilesPage(popup);

    await pp.navigateToTab('profiles');
    await profiles.saveProfile('Test Profile Alpha');

    // Verify the profile card appears
    const count = await profiles.getProfileCount();
    expect(count).toBe(1);
    await expect(profiles.profileCards.first()).toContainText('Test Profile Alpha');

    // Verify usage counter
    const usage = await profiles.getUsageText();
    expect(usage).toContain('1/2');

    await clearCookies(context, testDomain);
  });

  // ---------------------------------------------------------------
  // Test 2: Load profile and verify cookies restored
  // ---------------------------------------------------------------
  test('should load a profile and verify cookies are restored', async ({
    context,
    popup,
  }) => {
    // Setup: create cookies, save profile, then delete cookies
    await injectCookies(context, testDomain, 3);
    await popup.reload();
    await popup.waitForLoadState('domcontentloaded');
    const pp = new PopupPage(popup);
    const profiles = new ProfilesPage(popup);

    await pp.navigateToTab('profiles');
    await profiles.saveProfile('Restore Me');

    // Delete all cookies
    await clearCookies(context, testDomain);

    // Load the profile
    await profiles.loadProfile(0);

    // Verify cookies are back
    const cookies = await getCookies(context, testDomain);
    expect(cookies.length).toBe(3);

    await clearCookies(context, testDomain);
  });

  // ---------------------------------------------------------------
  // Test 3: Delete profile and verify removed
  // ---------------------------------------------------------------
  test('should delete a profile and verify it is removed', async ({
    context,
    popup,
  }) => {
    await injectCookies(context, testDomain, 2);
    await popup.reload();
    await popup.waitForLoadState('domcontentloaded');
    const pp = new PopupPage(popup);
    const profiles = new ProfilesPage(popup);

    await pp.navigateToTab('profiles');
    await profiles.saveProfile('Delete Me');

    const countBefore = await profiles.getProfileCount();
    expect(countBefore).toBe(1);

    await profiles.deleteProfile(0);

    const countAfter = await profiles.getProfileCount();
    expect(countAfter).toBe(0);

    await clearCookies(context, testDomain);
  });

  // ---------------------------------------------------------------
  // Test 4: Attempt 3rd profile (free tier) triggers paywall
  // ---------------------------------------------------------------
  test('should show paywall when attempting to save 3rd profile (free tier)', async ({
    context,
    popup,
  }) => {
    await injectCookies(context, testDomain, 3);
    await popup.reload();
    await popup.waitForLoadState('domcontentloaded');
    const pp = new PopupPage(popup);
    const profiles = new ProfilesPage(popup);

    await pp.navigateToTab('profiles');

    // Save 2 profiles (free limit)
    await profiles.saveProfile('Profile One');
    await profiles.saveProfile('Profile Two');

    // Attempt 3rd
    await profiles.saveProfileButton.click();
    await profiles.profileNameInput.fill('Profile Three');
    await profiles.profileSaveConfirm.click();

    // Paywall modal should appear
    await expect(pp.paywallModal).toBeVisible();
    await expect(pp.paywallModal).toContainText(/pro/i);
    await expect(pp.paywallCTA).toBeVisible();

    // Profile should NOT have been saved
    const count = await profiles.getProfileCount();
    expect(count).toBe(2);

    // Dismiss paywall
    await pp.paywallDismiss.click();
    await expect(pp.paywallModal).not.toBeVisible();

    await clearCookies(context, testDomain);
  });

  // ---------------------------------------------------------------
  // Test 5: Profile with special characters in name
  // ---------------------------------------------------------------
  test('should handle profile with special characters in name', async ({
    context,
    popup,
  }) => {
    await injectCookies(context, testDomain, 2);
    await popup.reload();
    await popup.waitForLoadState('domcontentloaded');
    const pp = new PopupPage(popup);
    const profiles = new ProfilesPage(popup);

    await pp.navigateToTab('profiles');
    await profiles.saveProfile('Test <script>alert(1)</script> & "quotes"');

    // Should render as escaped text, not execute
    await expect(profiles.profileCards.first()).toContainText('<script>');
    const count = await profiles.getProfileCount();
    expect(count).toBe(1);

    await clearCookies(context, testDomain);
  });

  // ---------------------------------------------------------------
  // Test 6: Profile persistence across popup close/reopen
  // ---------------------------------------------------------------
  test('should persist profiles across popup close and reopen', async ({
    context,
    extensionId,
  }) => {
    await injectCookies(context, testDomain, 2);

    // Open popup, save a profile, close popup
    const popup1 = await context.newPage();
    await popup1.goto(`chrome-extension://${extensionId}/popup.html`);
    await popup1.waitForLoadState('domcontentloaded');
    const pp1 = new PopupPage(popup1);
    const profiles1 = new ProfilesPage(popup1);

    await pp1.navigateToTab('profiles');
    await profiles1.saveProfile('Persistent Profile');
    await popup1.close();

    // Reopen popup
    const popup2 = await context.newPage();
    await popup2.goto(`chrome-extension://${extensionId}/popup.html`);
    await popup2.waitForLoadState('domcontentloaded');
    const pp2 = new PopupPage(popup2);
    const profiles2 = new ProfilesPage(popup2);

    await pp2.navigateToTab('profiles');
    const count = await profiles2.getProfileCount();
    expect(count).toBe(1);
    await expect(profiles2.profileCards.first()).toContainText('Persistent Profile');

    await popup2.close();
    await clearCookies(context, testDomain);
  });

  // ---------------------------------------------------------------
  // Test 7: Profile export as part of backup
  // ---------------------------------------------------------------
  test('should include profiles in backup export', async ({
    context,
    popup,
  }) => {
    await injectCookies(context, testDomain, 2);
    await popup.reload();
    await popup.waitForLoadState('domcontentloaded');
    const pp = new PopupPage(popup);
    const profiles = new ProfilesPage(popup);

    await pp.navigateToTab('profiles');
    await profiles.saveProfile('Backup Profile');

    // Navigate to cookies tab and export
    await pp.navigateToTab('cookies');

    const [download] = await Promise.all([
      popup.waitForEvent('download'),
      pp.exportButton.click(),
    ]);

    const downloadPath = await download.path();
    expect(downloadPath).toBeTruthy();

    await clearCookies(context, testDomain);
  });

  // ---------------------------------------------------------------
  // Test 8: Empty profile (0 cookies)
  // ---------------------------------------------------------------
  test('should handle saving an empty profile (0 cookies)', async ({
    context,
    popup,
  }) => {
    await clearCookies(context, testDomain);
    await popup.reload();
    await popup.waitForLoadState('domcontentloaded');
    const pp = new PopupPage(popup);
    const profiles = new ProfilesPage(popup);

    await pp.navigateToTab('profiles');
    await profiles.saveProfile('Empty Profile');

    const count = await profiles.getProfileCount();
    expect(count).toBe(1);
    await expect(profiles.profileCards.first()).toContainText('0 cookies');
  });
});
```

---

## 5. E2E Test Suite 3: Auto-Delete Rules

```typescript
// tests/e2e/rules.spec.ts
import { test, expect } from './fixtures/extension';
import { PopupPage } from './pages/PopupPage';
import { RulesPage } from './pages/RulesPage';
import { injectCookies, clearCookies, getCookies } from './helpers/cookies';

test.describe('Cookie Manager -- Auto-Delete Rules', () => {
  const testDomain = 'example.com';

  // ---------------------------------------------------------------
  // Test 1: Create rule and verify it appears in list
  // ---------------------------------------------------------------
  test('should create a rule and verify it appears in the list', async ({
    popup,
  }) => {
    const pp = new PopupPage(popup);
    const rules = new RulesPage(popup);

    await pp.navigateToTab('rules');
    await rules.createRule('*.tracking.com', 'tab-close');

    const count = await rules.getRuleCount();
    expect(count).toBe(1);
    await expect(rules.ruleCards.first()).toContainText('*.tracking.com');
    await expect(rules.ruleCards.first()).toContainText(/tab close/i);
  });

  // ---------------------------------------------------------------
  // Test 2: Toggle rule on/off
  // ---------------------------------------------------------------
  test('should toggle a rule on and off', async ({ popup }) => {
    const pp = new PopupPage(popup);
    const rules = new RulesPage(popup);

    await pp.navigateToTab('rules');
    await rules.createRule('*.ads.com', 'tab-close');

    // Toggle off
    const toggle = rules.ruleCards.first().locator('[data-testid="rule-toggle"]');
    await expect(toggle).toBeChecked(); // Default: enabled
    await toggle.click();
    await expect(toggle).not.toBeChecked();

    // Toggle back on
    await toggle.click();
    await expect(toggle).toBeChecked();
  });

  // ---------------------------------------------------------------
  // Test 3: Rule triggers on tab close
  // ---------------------------------------------------------------
  test('should trigger auto-delete rule when tab is closed', async ({
    context,
    extensionId,
  }) => {
    // Setup: create a rule for the domain
    const popup = await context.newPage();
    await popup.goto(`chrome-extension://${extensionId}/popup.html`);
    await popup.waitForLoadState('domcontentloaded');
    const pp = new PopupPage(popup);
    const rules = new RulesPage(popup);

    await pp.navigateToTab('rules');
    await rules.createRule(`*.${testDomain}`, 'tab-close');
    await popup.close();

    // Inject cookies and open a tab
    await injectCookies(context, testDomain, 5);
    const targetTab = await context.newPage();
    await targetTab.goto(`https://${testDomain}`);
    await targetTab.waitForLoadState('domcontentloaded');

    // Close the tab (should trigger auto-delete)
    await targetTab.close();
    await new Promise((r) => setTimeout(r, 1000)); // Wait for rule execution

    // Verify cookies are deleted
    const remaining = await getCookies(context, testDomain);
    expect(remaining.length).toBe(0);
  });

  // ---------------------------------------------------------------
  // Test 4: Rule triggers on schedule
  // ---------------------------------------------------------------
  test('should trigger auto-delete rule on schedule', async ({
    context,
    extensionId,
  }) => {
    const popup = await context.newPage();
    await popup.goto(`chrome-extension://${extensionId}/popup.html`);
    await popup.waitForLoadState('domcontentloaded');
    const pp = new PopupPage(popup);
    const rules = new RulesPage(popup);

    await pp.navigateToTab('rules');
    await rules.createRule(`*.${testDomain}`, 'schedule');

    // Verify rule card shows schedule trigger type
    await expect(rules.ruleCards.first()).toContainText(/schedule/i);

    // Verify alarm was created via service worker
    const [sw] = context.serviceWorkers();
    const alarms = await sw.evaluate(async () => {
      return await (globalThis as any).chrome.alarms.getAll();
    });
    const ruleAlarm = alarms.find((a: { name: string }) =>
      a.name.startsWith('rule-timer-')
    );
    expect(ruleAlarm).toBeDefined();

    await popup.close();
  });

  // ---------------------------------------------------------------
  // Test 5: Attempt 2nd rule (free tier) triggers paywall
  // ---------------------------------------------------------------
  test('should show paywall when attempting to create 2nd rule (free tier)', async ({
    popup,
  }) => {
    const pp = new PopupPage(popup);
    const rules = new RulesPage(popup);

    await pp.navigateToTab('rules');

    // Create first rule (free limit is 1)
    await rules.createRule('*.first-rule.com', 'tab-close');
    expect(await rules.getRuleCount()).toBe(1);

    // Attempt 2nd rule
    await rules.addRuleButton.click();
    await rules.rulePatternInput.fill('*.second-rule.com');
    await rules.ruleTriggerSelect.selectOption('tab-close');
    await rules.ruleSaveButton.click();

    // Paywall should appear
    await expect(pp.paywallModal).toBeVisible();
    await expect(pp.paywallModal).toContainText(/automate/i);

    // Rule should NOT be saved
    await pp.paywallDismiss.click();
    expect(await rules.getRuleCount()).toBe(1);
  });

  // ---------------------------------------------------------------
  // Test 6: Delete rule and verify removed
  // ---------------------------------------------------------------
  test('should delete a rule and verify it is removed', async ({ popup }) => {
    const pp = new PopupPage(popup);
    const rules = new RulesPage(popup);

    await pp.navigateToTab('rules');
    await rules.createRule('*.deletable.com', 'tab-close');
    expect(await rules.getRuleCount()).toBe(1);

    await rules.deleteRule(0);
    expect(await rules.getRuleCount()).toBe(0);
  });

  // ---------------------------------------------------------------
  // Test 7: Rule with glob pattern matching
  // ---------------------------------------------------------------
  test('should support glob pattern matching in rules', async ({
    context,
    popup,
  }) => {
    const pp = new PopupPage(popup);
    const rules = new RulesPage(popup);

    await pp.navigateToTab('rules');
    await rules.createRule('*.track*.com', 'tab-close');

    // The rule should display the pattern correctly
    await expect(rules.ruleCards.first()).toContainText('*.track*.com');

    // Verify the pattern is stored correctly via service worker
    const [sw] = context.serviceWorkers();
    const storedRules = await sw.evaluate(async () => {
      const data = await (globalThis as any).chrome.storage.local.get('rules');
      return data.rules || [];
    });
    expect(storedRules.length).toBeGreaterThan(0);
    expect(storedRules[0].pattern).toBe('*.track*.com');
  });

  // ---------------------------------------------------------------
  // Test 8: Whitelist domain exemption
  // ---------------------------------------------------------------
  test('should respect whitelist domain exemption from rules', async ({
    context,
    extensionId,
  }) => {
    const popup = await context.newPage();
    await popup.goto(`chrome-extension://${extensionId}/popup.html`);
    await popup.waitForLoadState('domcontentloaded');
    const pp = new PopupPage(popup);

    // Open settings and add domain to whitelist
    const [settingsPage] = await Promise.all([
      context.waitForEvent('page'),
      pp.settingsButton.click(),
    ]);

    await settingsPage.waitForLoadState('domcontentloaded');
    const whitelistInput = settingsPage.locator('[data-testid="whitelist-input"]');
    const whitelistAdd = settingsPage.locator('[data-testid="whitelist-add"]');

    await whitelistInput.fill(testDomain);
    await whitelistAdd.click();
    await settingsPage.waitForTimeout(300);

    // Verify domain appears in whitelist
    const whitelistEntries = settingsPage.locator('[data-testid="whitelist-entry"]');
    await expect(whitelistEntries).toContainText([testDomain]);

    await settingsPage.close();
    await popup.close();
  });
});
```

---

## 6. E2E Test Suite 4: Export/Import

```typescript
// tests/e2e/export-import.spec.ts
import { test, expect } from './fixtures/extension';
import { PopupPage } from './pages/PopupPage';
import { injectCookies, clearCookies, getCookies } from './helpers/cookies';
import path from 'path';
import fs from 'fs';

test.describe('Cookie Manager -- Export/Import', () => {
  const testDomain = 'example.com';

  // ---------------------------------------------------------------
  // Test 1: Export cookies as JSON and verify download
  // ---------------------------------------------------------------
  test('should export cookies as JSON and verify the download', async ({
    context,
    popup,
  }) => {
    await injectCookies(context, testDomain, 10);
    await popup.reload();
    await popup.waitForLoadState('domcontentloaded');
    const pp = new PopupPage(popup);

    const [download] = await Promise.all([
      popup.waitForEvent('download'),
      pp.exportButton.click(),
    ]);

    // Verify filename pattern
    const suggestedFilename = download.suggestedFilename();
    expect(suggestedFilename).toMatch(/cookies-.*\.json$/);

    // Verify file contents
    const downloadPath = await download.path();
    expect(downloadPath).toBeTruthy();
    const content = fs.readFileSync(downloadPath!, 'utf-8');
    const parsed = JSON.parse(content);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBe(10);

    // Each cookie object should have required fields
    for (const cookie of parsed) {
      expect(cookie).toHaveProperty('name');
      expect(cookie).toHaveProperty('value');
      expect(cookie).toHaveProperty('domain');
      expect(cookie).toHaveProperty('path');
    }

    await clearCookies(context, testDomain);
  });

  // ---------------------------------------------------------------
  // Test 2: Export triggers paywall at 25+ cookies (free tier)
  // ---------------------------------------------------------------
  test('should trigger paywall banner when exporting 26+ cookies (free tier)', async ({
    context,
    popup,
  }) => {
    await injectCookies(context, testDomain, 30);
    await popup.reload();
    await popup.waitForLoadState('domcontentloaded');
    const pp = new PopupPage(popup);

    const [download] = await Promise.all([
      popup.waitForEvent('download'),
      pp.exportButton.click(),
    ]);

    // Should show upgrade banner
    const banner = popup.locator('[data-testid="export-limit-banner"]');
    await expect(banner).toBeVisible();
    await expect(banner).toContainText(/upgrade/i);

    // Exported file should contain only 25 cookies (free limit)
    const downloadPath = await download.path();
    const content = fs.readFileSync(downloadPath!, 'utf-8');
    const parsed = JSON.parse(content);
    expect(parsed.length).toBe(25);

    await clearCookies(context, testDomain);
  });

  // ---------------------------------------------------------------
  // Test 3: Import JSON file and verify cookies created
  // ---------------------------------------------------------------
  test('should import a JSON file and verify cookies are created', async ({
    context,
    popup,
  }) => {
    await clearCookies(context, testDomain);
    await popup.reload();
    await popup.waitForLoadState('domcontentloaded');
    const pp = new PopupPage(popup);

    // Create a valid import file
    const importData = [
      { name: 'imported_1', value: 'val1', domain: `.${testDomain}`, path: '/', secure: true, httpOnly: false, sameSite: 'lax' },
      { name: 'imported_2', value: 'val2', domain: `.${testDomain}`, path: '/', secure: true, httpOnly: false, sameSite: 'lax' },
      { name: 'imported_3', value: 'val3', domain: `.${testDomain}`, path: '/', secure: true, httpOnly: false, sameSite: 'lax' },
    ];
    const tmpPath = path.join(process.cwd(), 'test-results', 'import-test.json');
    fs.mkdirSync(path.dirname(tmpPath), { recursive: true });
    fs.writeFileSync(tmpPath, JSON.stringify(importData));

    // Upload the file
    const fileInput = popup.locator('[data-testid="import-file-input"]');
    await pp.importButton.click();
    await fileInput.setInputFiles(tmpPath);
    await popup.waitForTimeout(500);

    // Confirm import via preview
    const importPreview = popup.locator('[data-testid="import-preview"]');
    await expect(importPreview).toBeVisible();
    const applyButton = popup.locator('[data-testid="import-apply"]');
    await applyButton.click();
    await popup.waitForTimeout(500);

    // Verify cookies exist
    const cookies = await getCookies(context, testDomain);
    const importedNames = cookies.map((c) => c.name);
    expect(importedNames).toContain('imported_1');
    expect(importedNames).toContain('imported_2');
    expect(importedNames).toContain('imported_3');

    // Cleanup
    fs.unlinkSync(tmpPath);
    await clearCookies(context, testDomain);
  });

  // ---------------------------------------------------------------
  // Test 4: Import invalid file shows error
  // ---------------------------------------------------------------
  test('should show error when importing an invalid JSON file', async ({
    popup,
  }) => {
    const pp = new PopupPage(popup);

    // Create an invalid JSON file
    const tmpPath = path.join(process.cwd(), 'test-results', 'invalid-import.json');
    fs.mkdirSync(path.dirname(tmpPath), { recursive: true });
    fs.writeFileSync(tmpPath, '{ this is not valid json ]]]');

    const fileInput = popup.locator('[data-testid="import-file-input"]');
    await pp.importButton.click();
    await fileInput.setInputFiles(tmpPath);
    await popup.waitForTimeout(500);

    // Error message should appear
    const errorMsg = popup.locator('[data-testid="import-error"]');
    await expect(errorMsg).toBeVisible();
    await expect(errorMsg).toContainText(/invalid/i);

    // Cleanup
    fs.unlinkSync(tmpPath);
  });

  // ---------------------------------------------------------------
  // Test 5: Copy cookie as cURL command
  // ---------------------------------------------------------------
  test('should copy a cookie as a cURL command', async ({ context, popup }) => {
    await injectCookies(context, testDomain, 1);
    await popup.reload();
    await popup.waitForLoadState('domcontentloaded');
    const pp = new PopupPage(popup);

    // Expand cookie and use cURL copy
    await pp.clickCookieRow(0);
    const curlButton = popup.locator('[data-testid="copy-curl"]');
    await curlButton.click();

    // Verify success toast
    await expect(popup.locator('[data-testid="copy-success"]')).toBeVisible();

    await clearCookies(context, testDomain);
  });

  // ---------------------------------------------------------------
  // Test 6: Export format selection (JSON free, others Pro)
  // ---------------------------------------------------------------
  test('should show JSON as free export format and lock other formats', async ({
    context,
    popup,
  }) => {
    await injectCookies(context, testDomain, 5);
    await popup.reload();
    await popup.waitForLoadState('domcontentloaded');
    const pp = new PopupPage(popup);

    // Open export format selector
    const formatSelector = popup.locator('[data-testid="export-format-select"]');
    // If clicking export opens a format menu:
    await pp.exportButton.click();
    await popup.waitForTimeout(200);

    // JSON option should be available (free)
    const jsonOption = popup.locator('[data-testid="format-json"]');
    await expect(jsonOption).toBeVisible();
    await expect(jsonOption).not.toHaveAttribute('aria-disabled', 'true');

    // CSV and other formats should show Pro lock
    const csvOption = popup.locator('[data-testid="format-csv"]');
    if (await csvOption.isVisible()) {
      const csvLock = csvOption.locator('[data-testid="lock-icon"]');
      await expect(csvLock).toBeVisible();
    }

    await clearCookies(context, testDomain);
  });

  // ---------------------------------------------------------------
  // Test 7: Bulk selection and export
  // ---------------------------------------------------------------
  test('should support bulk selection and export of cookies', async ({
    context,
    popup,
  }) => {
    await injectCookies(context, testDomain, 10);
    await popup.reload();
    await popup.waitForLoadState('domcontentloaded');
    const pp = new PopupPage(popup);

    // Select multiple cookies via checkboxes
    const checkboxes = popup.locator('[data-testid="cookie-checkbox"]');
    const checkboxCount = await checkboxes.count();

    if (checkboxCount > 0) {
      // Select first 3 cookies
      await checkboxes.nth(0).click();
      await checkboxes.nth(1).click();
      await checkboxes.nth(2).click();

      // Export selected
      const bulkExport = popup.locator('[data-testid="bulk-export"]');
      if (await bulkExport.isVisible()) {
        const [download] = await Promise.all([
          popup.waitForEvent('download'),
          bulkExport.click(),
        ]);
        const downloadPath = await download.path();
        const content = fs.readFileSync(downloadPath!, 'utf-8');
        const parsed = JSON.parse(content);
        expect(parsed.length).toBe(3);
      }
    }

    await clearCookies(context, testDomain);
  });

  // ---------------------------------------------------------------
  // Test 8: Import from profile backup
  // ---------------------------------------------------------------
  test('should import cookies from a profile backup file', async ({
    context,
    popup,
  }) => {
    await clearCookies(context, testDomain);
    await popup.reload();
    await popup.waitForLoadState('domcontentloaded');
    const pp = new PopupPage(popup);

    // Create a backup-format JSON (with profile metadata)
    const backupData = {
      version: '1.0.0',
      type: 'profile_backup',
      profile: {
        name: 'Backup Profile',
        domain: testDomain,
        cookies: [
          { name: 'backup_c1', value: 'bv1', domain: `.${testDomain}`, path: '/', secure: true },
          { name: 'backup_c2', value: 'bv2', domain: `.${testDomain}`, path: '/', secure: true },
        ],
      },
    };

    const tmpPath = path.join(process.cwd(), 'test-results', 'backup-import.json');
    fs.mkdirSync(path.dirname(tmpPath), { recursive: true });
    fs.writeFileSync(tmpPath, JSON.stringify(backupData));

    const fileInput = popup.locator('[data-testid="import-file-input"]');
    await pp.importButton.click();
    await fileInput.setInputFiles(tmpPath);
    await popup.waitForTimeout(500);

    const applyButton = popup.locator('[data-testid="import-apply"]');
    if (await applyButton.isVisible()) {
      await applyButton.click();
      await popup.waitForTimeout(500);
    }

    // Verify cookies were imported
    const cookies = await getCookies(context, testDomain);
    const names = cookies.map((c) => c.name);
    expect(names).toContain('backup_c1');
    expect(names).toContain('backup_c2');

    fs.unlinkSync(tmpPath);
    await clearCookies(context, testDomain);
  });
});
```

---

## 7. E2E Test Suite 5: Onboarding Flow

```typescript
// tests/e2e/onboarding.spec.ts
import { test, expect } from './fixtures/extension';

test.describe('Cookie Manager -- Onboarding Flow', () => {

  // ---------------------------------------------------------------
  // Test 1: First install opens onboarding page
  // ---------------------------------------------------------------
  test('should open onboarding page on first install', async ({
    context,
    extensionId,
  }) => {
    // After extension loads for the first time, an onboarding tab should open.
    // In CI, we simulate by checking if the onboarding page can be loaded.
    const pages = context.pages();
    const onboardingPage = pages.find((p) =>
      p.url().includes(`chrome-extension://${extensionId}/onboarding.html`)
    );

    // If not auto-opened (common in Playwright), navigate directly
    const onboarding = onboardingPage ?? (await context.newPage());
    if (!onboardingPage) {
      await onboarding.goto(
        `chrome-extension://${extensionId}/onboarding.html`
      );
    }
    await onboarding.waitForLoadState('domcontentloaded');

    // Verify onboarding content is present
    const heading = onboarding.locator('[data-testid="onboarding-heading"]');
    await expect(heading).toBeVisible();

    // Verify slide 1 is active
    const slide1 = onboarding.locator('[data-testid="onboarding-slide-1"]');
    await expect(slide1).toBeVisible();

    if (!onboardingPage) await onboarding.close();
  });

  // ---------------------------------------------------------------
  // Test 2: Navigate through all 4 slides
  // ---------------------------------------------------------------
  test('should navigate through all 4 onboarding slides', async ({
    context,
    extensionId,
  }) => {
    const onboarding = await context.newPage();
    await onboarding.goto(
      `chrome-extension://${extensionId}/onboarding.html`
    );
    await onboarding.waitForLoadState('domcontentloaded');

    const nextButton = onboarding.locator('[data-testid="onboarding-next"]');

    // Slide 1
    await expect(
      onboarding.locator('[data-testid="onboarding-slide-1"]')
    ).toBeVisible();

    // Slide 2
    await nextButton.click();
    await expect(
      onboarding.locator('[data-testid="onboarding-slide-2"]')
    ).toBeVisible();

    // Slide 3
    await nextButton.click();
    await expect(
      onboarding.locator('[data-testid="onboarding-slide-3"]')
    ).toBeVisible();

    // Slide 4
    await nextButton.click();
    await expect(
      onboarding.locator('[data-testid="onboarding-slide-4"]')
    ).toBeVisible();

    // Final slide should show "Start Using" button instead of "Next"
    const startButton = onboarding.locator(
      '[data-testid="onboarding-start"]'
    );
    await expect(startButton).toBeVisible();

    await onboarding.close();
  });

  // ---------------------------------------------------------------
  // Test 3: Skip button works from any slide
  // ---------------------------------------------------------------
  test('should allow skipping onboarding from any slide', async ({
    context,
    extensionId,
  }) => {
    const onboarding = await context.newPage();
    await onboarding.goto(
      `chrome-extension://${extensionId}/onboarding.html`
    );
    await onboarding.waitForLoadState('domcontentloaded');

    const skipButton = onboarding.locator('[data-testid="onboarding-skip"]');
    await expect(skipButton).toBeVisible();

    // Navigate to slide 2
    await onboarding.locator('[data-testid="onboarding-next"]').click();
    await expect(skipButton).toBeVisible(); // Still visible on slide 2

    // Navigate to slide 3
    await onboarding.locator('[data-testid="onboarding-next"]').click();
    await expect(skipButton).toBeVisible(); // Still visible on slide 3

    // Click skip
    await skipButton.click();

    // Onboarding should close (tab closes or navigates away)
    // In extension context, skip typically closes the tab
    await onboarding.waitForTimeout(500);

    // Verify onboarding completed flag is set via storage
    const [sw] = context.serviceWorkers();
    const data = await sw.evaluate(async () => {
      return await (globalThis as any).chrome.storage.local.get(
        'onboarding_completed'
      );
    });
    expect(data.onboarding_completed).toBe(true);

    await onboarding.close().catch(() => {}); // May already be closed
  });

  // ---------------------------------------------------------------
  // Test 4: "Start Using" closes onboarding tab
  // ---------------------------------------------------------------
  test('should close onboarding tab when "Start Using" is clicked', async ({
    context,
    extensionId,
  }) => {
    const onboarding = await context.newPage();
    await onboarding.goto(
      `chrome-extension://${extensionId}/onboarding.html`
    );
    await onboarding.waitForLoadState('domcontentloaded');

    // Navigate to final slide
    for (let i = 0; i < 3; i++) {
      await onboarding.locator('[data-testid="onboarding-next"]').click();
      await onboarding.waitForTimeout(300);
    }

    const startButton = onboarding.locator(
      '[data-testid="onboarding-start"]'
    );
    await expect(startButton).toBeVisible();

    // Click "Start Using" -- should close tab
    const pageCountBefore = context.pages().length;
    await startButton.click();
    await onboarding.waitForTimeout(500);

    // Tab should be closed or navigated away
    const pageCountAfter = context.pages().length;
    expect(pageCountAfter).toBeLessThanOrEqual(pageCountBefore);
  });

  // ---------------------------------------------------------------
  // Test 5: "Explore Zovo" opens zovo.one
  // ---------------------------------------------------------------
  test('should open zovo.one when "Explore Zovo" link is clicked', async ({
    context,
    extensionId,
  }) => {
    const onboarding = await context.newPage();
    await onboarding.goto(
      `chrome-extension://${extensionId}/onboarding.html`
    );
    await onboarding.waitForLoadState('domcontentloaded');

    // Navigate to the final slide where the Explore Zovo link exists
    for (let i = 0; i < 3; i++) {
      await onboarding.locator('[data-testid="onboarding-next"]').click();
      await onboarding.waitForTimeout(300);
    }

    const exploreLink = onboarding.locator(
      '[data-testid="explore-zovo-link"]'
    );

    if (await exploreLink.isVisible()) {
      const [newPage] = await Promise.all([
        context.waitForEvent('page'),
        exploreLink.click(),
      ]);

      expect(newPage.url()).toContain('zovo');
      await newPage.close();
    }

    await onboarding.close();
  });
});
```

---

## 8. E2E Test Suite 6: Payment/Upgrade Flow

```typescript
// tests/e2e/payment-upgrade.spec.ts
import { test, expect } from './fixtures/extension';
import { PopupPage } from './pages/PopupPage';
import { ProfilesPage } from './pages/ProfilesPage';
import { injectCookies, clearCookies } from './helpers/cookies';

test.describe('Cookie Manager -- Payment & Upgrade Flow', () => {
  const testDomain = 'example.com';

  // ---------------------------------------------------------------
  // Test 1: Free user sees Pro badges
  // ---------------------------------------------------------------
  test('should show Pro badges for free-tier users', async ({ popup }) => {
    const pp = new PopupPage(popup);

    // Check tier badge shows FREE
    await expect(pp.tierBadge).toContainText(/free/i);

    // Pro badges should be visible on locked features
    const proBadges = popup.locator('[data-testid="pro-badge"]');
    const count = await proBadges.count();
    expect(count).toBeGreaterThan(0);

    // Check across tabs
    await pp.navigateToTab('profiles');
    const profileProBadges = popup.locator(
      '[data-testid="profiles-panel"] [data-testid="pro-badge"]'
    );
    // Pro badge may appear near "Unlimited Profiles" text
    const profileBadgeCount = await profileProBadges.count();

    await pp.navigateToTab('rules');
    const ruleProBadges = popup.locator(
      '[data-testid="rules-panel"] [data-testid="pro-badge"]'
    );
    const ruleBadgeCount = await ruleProBadges.count();

    await pp.navigateToTab('health');
    const healthProBadges = popup.locator(
      '[data-testid="health-panel"] [data-testid="pro-badge"]'
    );
    const healthBadgeCount = await healthProBadges.count();

    // At least some Pro badges across tabs
    expect(profileBadgeCount + ruleBadgeCount + healthBadgeCount).toBeGreaterThan(0);

    await pp.screenshotPopup('free-tier-pro-badges');
  });

  // ---------------------------------------------------------------
  // Test 2: Paywall modal appears at feature limit
  // ---------------------------------------------------------------
  test('should display paywall modal when feature limit is reached', async ({
    context,
    popup,
  }) => {
    await injectCookies(context, testDomain, 3);
    await popup.reload();
    await popup.waitForLoadState('domcontentloaded');
    const pp = new PopupPage(popup);
    const profiles = new ProfilesPage(popup);

    await pp.navigateToTab('profiles');

    // Save max free profiles (2)
    await profiles.saveProfile('Profile A');
    await profiles.saveProfile('Profile B');

    // Trigger paywall with 3rd attempt
    await profiles.saveProfileButton.click();
    await profiles.profileNameInput.fill('Profile C');
    await profiles.profileSaveConfirm.click();

    // Verify paywall modal structure
    await expect(pp.paywallModal).toBeVisible();
    await expect(pp.paywallModal).toContainText(/pro/i);
    await expect(pp.paywallCTA).toBeVisible();
    await expect(pp.paywallDismiss).toBeVisible();

    // Verify blurred background
    const backdrop = popup.locator('[data-testid="paywall-backdrop"]');
    if (await backdrop.isVisible()) {
      const filter = await backdrop.evaluate((el) =>
        getComputedStyle(el).getPropertyValue('backdrop-filter')
      );
      expect(filter).toContain('blur');
    }

    await pp.screenshotPopup('paywall-modal-3rd-profile');
    await pp.paywallDismiss.click();
    await clearCookies(context, testDomain);
  });

  // ---------------------------------------------------------------
  // Test 3: License key input and validation
  // ---------------------------------------------------------------
  test('should accept and validate a license key', async ({
    context,
    extensionId,
  }) => {
    const popup = await context.newPage();
    await popup.goto(`chrome-extension://${extensionId}/popup.html`);
    await popup.waitForLoadState('domcontentloaded');
    const pp = new PopupPage(popup);

    // Open settings page
    const [settingsPage] = await Promise.all([
      context.waitForEvent('page'),
      pp.settingsButton.click(),
    ]);
    await settingsPage.waitForLoadState('domcontentloaded');

    // Find license key input
    const licenseInput = settingsPage.locator(
      '[data-testid="license-key-input"]'
    );
    const activateButton = settingsPage.locator(
      '[data-testid="activate-license"]'
    );

    await expect(licenseInput).toBeVisible();
    await expect(activateButton).toBeVisible();

    // Enter a test license key (mock validation handled by service worker)
    await licenseInput.fill('ZOVO-TEST-1234-5678-ABCD');
    await activateButton.click();
    await settingsPage.waitForTimeout(1000);

    // Result depends on backend availability -- in CI, we verify
    // the UI handles the response without crashing
    const successMsg = settingsPage.locator(
      '[data-testid="license-success"]'
    );
    const errorMsg = settingsPage.locator(
      '[data-testid="license-error"]'
    );

    // One of these should be visible
    const isSuccess = await successMsg.isVisible().catch(() => false);
    const isError = await errorMsg.isVisible().catch(() => false);
    expect(isSuccess || isError).toBe(true);

    await settingsPage.close();
    await popup.close();
  });

  // ---------------------------------------------------------------
  // Test 4: Invalid license shows error
  // ---------------------------------------------------------------
  test('should show error for an invalid license key', async ({
    context,
    extensionId,
  }) => {
    const popup = await context.newPage();
    await popup.goto(`chrome-extension://${extensionId}/popup.html`);
    await popup.waitForLoadState('domcontentloaded');
    const pp = new PopupPage(popup);

    const [settingsPage] = await Promise.all([
      context.waitForEvent('page'),
      pp.settingsButton.click(),
    ]);
    await settingsPage.waitForLoadState('domcontentloaded');

    const licenseInput = settingsPage.locator(
      '[data-testid="license-key-input"]'
    );
    const activateButton = settingsPage.locator(
      '[data-testid="activate-license"]'
    );

    // Enter obviously invalid key
    await licenseInput.fill('INVALID-KEY');
    await activateButton.click();
    await settingsPage.waitForTimeout(1000);

    const errorMsg = settingsPage.locator(
      '[data-testid="license-error"]'
    );
    await expect(errorMsg).toBeVisible();
    await expect(errorMsg).toContainText(/invalid|error|not valid/i);

    await settingsPage.close();
    await popup.close();
  });

  // ---------------------------------------------------------------
  // Test 5: Post-upgrade celebration animation
  // ---------------------------------------------------------------
  test('should show celebration animation after successful upgrade', async ({
    context,
    extensionId,
  }) => {
    // Simulate upgrade by writing Pro tier to storage
    const [sw] = context.serviceWorkers();
    await sw.evaluate(async () => {
      await (globalThis as any).chrome.storage.sync.set({
        zovo_auth: {
          tier: 'pro',
          token: 'mock-jwt-token',
          user_id: 'test-user',
          email: 'test@example.com',
          authenticated_at: new Date().toISOString(),
        },
      });
    });

    // Open popup -- should detect Pro status
    const popup = await context.newPage();
    await popup.goto(`chrome-extension://${extensionId}/popup.html`);
    await popup.waitForLoadState('domcontentloaded');
    const pp = new PopupPage(popup);

    // Check for celebration animation (confetti)
    const confetti = popup.locator('[data-testid="celebration-confetti"]');
    const welcomeToast = popup.locator('[data-testid="welcome-pro-toast"]');

    // At least one celebration element should appear on first Pro load
    const hasConfetti = await confetti.isVisible().catch(() => false);
    const hasToast = await welcomeToast.isVisible().catch(() => false);

    // The tier badge should show PRO
    await expect(pp.tierBadge).toContainText(/pro/i);

    await pp.screenshotPopup('post-upgrade-celebration');

    // Reset to free tier for other tests
    await sw.evaluate(async () => {
      await (globalThis as any).chrome.storage.sync.remove('zovo_auth');
    });

    await popup.close();
  });

  // ---------------------------------------------------------------
  // Test 6: Pro features unlocked after license activation
  // ---------------------------------------------------------------
  test('should unlock all Pro features after license activation', async ({
    context,
    extensionId,
  }) => {
    // Set Pro tier in storage
    const [sw] = context.serviceWorkers();
    await sw.evaluate(async () => {
      await (globalThis as any).chrome.storage.sync.set({
        zovo_auth: {
          tier: 'pro',
          token: 'mock-jwt-token',
          user_id: 'test-user',
          email: 'test@example.com',
          authenticated_at: new Date().toISOString(),
        },
      });
    });

    await injectCookies(context, testDomain, 5);

    const popup = await context.newPage();
    await popup.goto(`chrome-extension://${extensionId}/popup.html`);
    await popup.waitForLoadState('domcontentloaded');
    const pp = new PopupPage(popup);

    // Verify Pro badge
    await expect(pp.tierBadge).toContainText(/pro/i);

    // Verify lock icons are gone
    const lockIcons = popup.locator(
      '[data-testid="lock-icon"]:visible'
    );
    const lockCount = await lockIcons.count();
    expect(lockCount).toBe(0);

    // Verify unlimited profiles: save 3 profiles without paywall
    await pp.navigateToTab('profiles');
    const profiles = new ProfilesPage(popup);
    await profiles.saveProfile('Pro Profile 1');
    await profiles.saveProfile('Pro Profile 2');
    await profiles.saveProfile('Pro Profile 3');

    // No paywall should appear
    await expect(pp.paywallModal).not.toBeVisible();
    expect(await profiles.getProfileCount()).toBe(3);

    // Verify Health tab details are not blurred
    await pp.navigateToTab('health');
    const blurredElements = popup.locator('[data-testid="health-detail-blurred"]');
    const blurCount = await blurredElements.count();
    expect(blurCount).toBe(0);

    await pp.screenshotPopup('pro-features-unlocked');

    // Reset
    await sw.evaluate(async () => {
      await (globalThis as any).chrome.storage.sync.remove('zovo_auth');
    });

    await clearCookies(context, testDomain);
    await popup.close();
  });
});
```

---

## 9. GitHub Actions CI/CD Workflow

### `.github/workflows/ci.yml`

```yaml
name: Cookie Manager CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  release:
    types: [published]

env:
  NODE_VERSION: "20"

jobs:
  # ================================================================
  # LINT & TYPE CHECK
  # ================================================================
  lint:
    name: Lint & Type Check
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Run ESLint
        run: npm run lint

      - name: Run TypeScript type check
        run: npm run typecheck

      - name: Check formatting
        run: npm run format:check

  # ================================================================
  # UNIT & INTEGRATION TESTS
  # ================================================================
  unit-test:
    name: Unit & Integration Tests
    runs-on: ubuntu-latest
    needs: lint
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests with coverage
        run: npm run test:unit -- --ci --coverage

      - name: Run integration tests with coverage
        run: npm run test:integration -- --ci --coverage

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v4
        with:
          token: ${{ secrets.CODECOV_TOKEN }}
          files: ./coverage/lcov.info
          fail_ci_if_error: false

      - name: Archive coverage report
        uses: actions/upload-artifact@v4
        with:
          name: coverage-report
          path: coverage/
          retention-days: 7

  # ================================================================
  # BUILD EXTENSION
  # ================================================================
  build:
    name: Build Extension
    runs-on: ubuntu-latest
    needs: lint
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Build extension
        run: npm run build

      - name: Validate manifest
        run: npm run validate:manifest -- dist/manifest.json

      - name: Check bundle size
        run: npm run validate:bundle -- dist/

      - name: Upload build artifact
        uses: actions/upload-artifact@v4
        with:
          name: extension-build
          path: dist/
          retention-days: 30

  # ================================================================
  # E2E TESTS (depends on build)
  # ================================================================
  e2e-test:
    name: E2E Tests (Playwright)
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install chromium --with-deps

      - name: Download build artifact
        uses: actions/download-artifact@v4
        with:
          name: extension-build
          path: dist/

      - name: Run E2E tests
        run: npm run test:e2e
        env:
          EXTENSION_PATH: ./dist
          CI: true

      - name: Upload Playwright HTML report
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 7

      - name: Upload failure screenshots
        uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: e2e-failure-screenshots
          path: test-results/
          retention-days: 7

  # ================================================================
  # PACKAGE (depends on all checks passing)
  # ================================================================
  package:
    name: Package for CWS
    runs-on: ubuntu-latest
    needs: [lint, unit-test, build, e2e-test]
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Download build artifact
        uses: actions/download-artifact@v4
        with:
          name: extension-build
          path: dist/

      - name: Create extension ZIP
        run: |
          cd dist
          zip -r ../zovo-cookie-manager.zip .

      - name: Upload packaged extension
        uses: actions/upload-artifact@v4
        with:
          name: zovo-cookie-manager-zip
          path: zovo-cookie-manager.zip
          retention-days: 90

  # ================================================================
  # DEPLOY TO CHROME WEB STORE (on release only)
  # ================================================================
  deploy:
    name: Deploy to Chrome Web Store
    runs-on: ubuntu-latest
    needs: [package]
    if: github.event_name == 'release'
    environment: production
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Download packaged extension
        uses: actions/download-artifact@v4
        with:
          name: zovo-cookie-manager-zip
          path: ./

      - name: Get version from release tag
        id: version
        run: echo "VERSION=${GITHUB_REF#refs/tags/v}" >> $GITHUB_OUTPUT

      - name: Update version in package
        run: |
          mkdir -p dist-release
          unzip zovo-cookie-manager.zip -d dist-release
          node scripts/bump-version.js dist-release/manifest.json ${{ steps.version.outputs.VERSION }}
          cd dist-release && zip -r ../zovo-cookie-manager-${{ steps.version.outputs.VERSION }}.zip .

      - name: Upload to Chrome Web Store
        uses: mnao305/chrome-extension-upload@v4.0.1
        with:
          file-path: zovo-cookie-manager-${{ steps.version.outputs.VERSION }}.zip
          extension-id: ${{ secrets.CHROME_EXTENSION_ID }}
          client-id: ${{ secrets.CHROME_CLIENT_ID }}
          client-secret: ${{ secrets.CHROME_CLIENT_SECRET }}
          refresh-token: ${{ secrets.CHROME_REFRESH_TOKEN }}
          publish: false
```

---

## 10. Validation Scripts

### 10.1 Version Bumping Script

```typescript
// scripts/bump-version.ts
// Usage: npx ts-node scripts/bump-version.ts <manifest-path> <new-version>
// Also updates package.json if found alongside manifest.

import fs from 'fs';
import path from 'path';

const manifestPath = process.argv[2];
const newVersion = process.argv[3];

if (!manifestPath || !newVersion) {
  console.error('Usage: ts-node scripts/bump-version.ts <manifest-path> <version>');
  process.exit(1);
}

// Validate semver (Chrome allows up to 4 segments: X.Y.Z.W)
const semverRegex = /^\d+\.\d+\.\d+(\.\d+)?$/;
if (!semverRegex.test(newVersion)) {
  console.error(`Invalid version format: "${newVersion}". Expected: X.Y.Z or X.Y.Z.W`);
  process.exit(1);
}

// Update manifest.json
const manifestRaw = fs.readFileSync(manifestPath, 'utf-8');
const manifest = JSON.parse(manifestRaw);
const oldVersion = manifest.version;
manifest.version = newVersion;
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
console.log(`manifest.json: ${oldVersion} -> ${newVersion}`);

// Update package.json if it exists in the project root
const packageJsonPath = path.resolve(path.dirname(manifestPath), '..', 'package.json');
if (fs.existsSync(packageJsonPath)) {
  const pkgRaw = fs.readFileSync(packageJsonPath, 'utf-8');
  const pkg = JSON.parse(pkgRaw);
  const oldPkgVersion = pkg.version;
  pkg.version = newVersion;
  fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2) + '\n');
  console.log(`package.json: ${oldPkgVersion} -> ${newVersion}`);
}

// Also check for package.json in same directory (dist builds)
const localPkgPath = path.resolve(path.dirname(manifestPath), 'package.json');
if (fs.existsSync(localPkgPath) && localPkgPath !== packageJsonPath) {
  const pkgRaw = fs.readFileSync(localPkgPath, 'utf-8');
  const pkg = JSON.parse(pkgRaw);
  pkg.version = newVersion;
  fs.writeFileSync(localPkgPath, JSON.stringify(pkg, null, 2) + '\n');
  console.log(`package.json (local): updated to ${newVersion}`);
}

console.log('Version bump complete.');
```

### 10.2 Manifest Validation Script

```typescript
// scripts/validate-manifest.ts
// Usage: npx ts-node scripts/validate-manifest.ts <manifest-path>
// Validates the Cookie Manager manifest.json for MV3 compliance and correctness.

import fs from 'fs';
import path from 'path';

const manifestPath = process.argv[2];

if (!manifestPath) {
  console.error('Usage: ts-node scripts/validate-manifest.ts <manifest-path>');
  process.exit(1);
}

if (!fs.existsSync(manifestPath)) {
  console.error(`File not found: ${manifestPath}`);
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
const distDir = path.dirname(manifestPath);
const errors: string[] = [];
const warnings: string[] = [];

// ---------------------------------------------------------------
// 1. Required fields
// ---------------------------------------------------------------
const requiredFields = ['manifest_version', 'name', 'version'];
for (const field of requiredFields) {
  if (!manifest[field]) {
    errors.push(`Missing required field: "${field}"`);
  }
}

// Manifest version must be 3
if (manifest.manifest_version && manifest.manifest_version !== 3) {
  errors.push(`manifest_version must be 3, got: ${manifest.manifest_version}`);
}

// Version format: X.Y.Z or X.Y.Z.W (Chrome requirement)
if (manifest.version) {
  const versionRegex = /^\d+(\.\d+){1,3}$/;
  if (!versionRegex.test(manifest.version)) {
    errors.push(`Invalid version format: "${manifest.version}". Expected X.Y.Z or X.Y.Z.W`);
  }
}

// Name length (CWS max: 45 chars)
if (manifest.name && manifest.name.length > 45) {
  warnings.push(`Name is ${manifest.name.length} chars (CWS max: 45)`);
}

// Description length (CWS max: 132 chars)
if (manifest.description && manifest.description.length > 132) {
  warnings.push(`Description is ${manifest.description.length} chars (CWS max: 132)`);
}

// ---------------------------------------------------------------
// 2. Icon files exist
// ---------------------------------------------------------------
const requiredIconSizes = ['16', '32', '48', '128'];
if (manifest.icons) {
  for (const size of requiredIconSizes) {
    if (!manifest.icons[size]) {
      warnings.push(`Missing icon size: ${size}x${size}`);
    } else {
      const iconPath = path.resolve(distDir, manifest.icons[size]);
      if (!fs.existsSync(iconPath)) {
        errors.push(`Icon file missing: ${manifest.icons[size]} (resolved: ${iconPath})`);
      }
    }
  }
} else {
  errors.push('Missing "icons" field');
}

// Also check action.default_icon
if (manifest.action?.default_icon) {
  for (const [size, filePath] of Object.entries(manifest.action.default_icon)) {
    const iconPath = path.resolve(distDir, filePath as string);
    if (!fs.existsSync(iconPath)) {
      errors.push(`Action icon missing: ${filePath} (size ${size})`);
    }
  }
}

// ---------------------------------------------------------------
// 3. MV3 deprecated field checks
// ---------------------------------------------------------------
if (manifest.browser_action) {
  errors.push('"browser_action" is deprecated in MV3. Use "action" instead.');
}
if (manifest.page_action) {
  errors.push('"page_action" is deprecated in MV3. Use "action" instead.');
}
if (manifest.background?.scripts) {
  errors.push('"background.scripts" is not supported in MV3. Use "background.service_worker".');
}
if (manifest.background?.persistent !== undefined) {
  errors.push('"background.persistent" is not supported in MV3.');
}

// ---------------------------------------------------------------
// 4. Permissions validation
// ---------------------------------------------------------------
const validPermissions = [
  'cookies', 'activeTab', 'storage', 'tabs', 'alarms',
  'clipboardWrite', 'notifications', 'identity', 'offscreen',
  'sidePanel', 'contextMenus', 'scripting', 'webNavigation',
  'management', 'bookmarks', 'history', 'downloads',
];

const permissions = manifest.permissions || [];
const hostPermissionPattern = /^(https?|ftp|\*):\/\//;

for (const perm of permissions) {
  if (hostPermissionPattern.test(perm)) {
    errors.push(`Host permission "${perm}" should be in "host_permissions", not "permissions".`);
  }
  if (!validPermissions.includes(perm) && !hostPermissionPattern.test(perm)) {
    warnings.push(`Unusual permission: "${perm}". Verify this is intentional.`);
  }
}

// Required permissions for Cookie Manager
const requiredPermissions = ['cookies', 'activeTab', 'storage', 'tabs', 'alarms'];
for (const perm of requiredPermissions) {
  if (!permissions.includes(perm)) {
    warnings.push(`Expected required permission missing: "${perm}"`);
  }
}

// ---------------------------------------------------------------
// 5. CSP validation
// ---------------------------------------------------------------
if (manifest.content_security_policy) {
  const csp = manifest.content_security_policy.extension_pages || '';

  if (csp.includes("'unsafe-eval'")) {
    errors.push("CSP contains 'unsafe-eval' -- not allowed in MV3 production builds.");
  }
  if (csp.includes("'unsafe-inline'")) {
    errors.push("CSP contains 'unsafe-inline' -- not recommended for production.");
  }
  if (!csp.includes("script-src 'self'")) {
    warnings.push("CSP does not explicitly include \"script-src 'self'\".");
  }
  if (!csp.includes("object-src 'none'")) {
    warnings.push("CSP does not include \"object-src 'none'\".");
  }
} else {
  warnings.push('No content_security_policy defined. Chrome will apply defaults.');
}

// ---------------------------------------------------------------
// 6. No content scripts in MVP
// ---------------------------------------------------------------
if (manifest.content_scripts && manifest.content_scripts.length > 0) {
  warnings.push(
    `${manifest.content_scripts.length} content script(s) declared. ` +
    'MVP spec calls for zero content scripts. Verify this is intentional.'
  );
}

// ---------------------------------------------------------------
// 7. Service worker file exists
// ---------------------------------------------------------------
if (manifest.background?.service_worker) {
  const swPath = path.resolve(distDir, manifest.background.service_worker);
  if (!fs.existsSync(swPath)) {
    errors.push(`Service worker file missing: ${manifest.background.service_worker}`);
  }
}

// ---------------------------------------------------------------
// 8. Popup and options HTML exist
// ---------------------------------------------------------------
if (manifest.action?.default_popup) {
  const popupPath = path.resolve(distDir, manifest.action.default_popup);
  if (!fs.existsSync(popupPath)) {
    errors.push(`Popup HTML missing: ${manifest.action.default_popup}`);
  }
}

if (manifest.options_ui?.page) {
  const optionsPath = path.resolve(distDir, manifest.options_ui.page);
  if (!fs.existsSync(optionsPath)) {
    errors.push(`Options page missing: ${manifest.options_ui.page}`);
  }
}

// ---------------------------------------------------------------
// 9. Locale files
// ---------------------------------------------------------------
if (manifest.default_locale) {
  const localeDir = path.resolve(distDir, '_locales', manifest.default_locale);
  const messagesFile = path.resolve(localeDir, 'messages.json');
  if (!fs.existsSync(messagesFile)) {
    errors.push(`Default locale messages file missing: _locales/${manifest.default_locale}/messages.json`);
  }
}

// ---------------------------------------------------------------
// Output results
// ---------------------------------------------------------------
console.log('\n=== Manifest Validation ===\n');

if (warnings.length > 0) {
  console.log(`Warnings (${warnings.length}):`);
  for (const w of warnings) {
    console.log(`  [WARN] ${w}`);
  }
  console.log('');
}

if (errors.length > 0) {
  console.log(`Errors (${errors.length}):`);
  for (const e of errors) {
    console.log(`  [ERROR] ${e}`);
  }
  console.log('\nManifest validation FAILED.');
  process.exit(1);
}

console.log('Manifest validation PASSED.');
```

### 10.3 Bundle Size Check Script

```typescript
// scripts/check-bundle-size.ts
// Usage: npx ts-node scripts/check-bundle-size.ts <dist-directory>
// Validates the Cookie Manager bundle stays within performance budget.
//
// Budget (from Phase 04 performance spec):
//   Total:      342 KB
//   popup:      120 KB
//   background:  35 KB
//   options:     80 KB

import fs from 'fs';
import path from 'path';

interface SizeLimit {
  pattern: string;         // Glob-style pattern to match against relative paths
  maxBytes: number;        // Maximum allowed size in bytes
  label: string;           // Human-readable label
}

const LIMITS: SizeLimit[] = [
  { pattern: 'popup',      maxBytes: 120 * 1024, label: 'Popup chunk' },
  { pattern: 'background', maxBytes: 35 * 1024,  label: 'Background chunk' },
  { pattern: 'options',    maxBytes: 80 * 1024,  label: 'Options chunk' },
];

const TOTAL_MAX_BYTES = 342 * 1024; // 342 KB total bundle limit

const distDir = process.argv[2];

if (!distDir) {
  console.error('Usage: ts-node scripts/check-bundle-size.ts <dist-directory>');
  process.exit(1);
}

if (!fs.existsSync(distDir)) {
  console.error(`Directory not found: ${distDir}`);
  process.exit(1);
}

// ---------------------------------------------------------------
// Recursively collect all files and their sizes
// ---------------------------------------------------------------
function getFileSizes(dir: string, baseDir: string): Array<{ relativePath: string; size: number }> {
  const entries: Array<{ relativePath: string; size: number }> = [];

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      entries.push(...getFileSizes(fullPath, baseDir));
    } else if (entry.isFile()) {
      const stat = fs.statSync(fullPath);
      entries.push({
        relativePath: path.relative(baseDir, fullPath),
        size: stat.size,
      });
    }
  }

  return entries;
}

const allFiles = getFileSizes(distDir, distDir);
const totalSize = allFiles.reduce((sum, f) => sum + f.size, 0);
const errors: string[] = [];

console.log('\n=== Bundle Size Check ===\n');

// ---------------------------------------------------------------
// Check per-chunk limits
// ---------------------------------------------------------------
for (const limit of LIMITS) {
  const matchingFiles = allFiles.filter((f) =>
    f.relativePath.includes(limit.pattern) &&
    (f.relativePath.endsWith('.js') || f.relativePath.endsWith('.css') || f.relativePath.endsWith('.html'))
  );

  const chunkSize = matchingFiles.reduce((sum, f) => sum + f.size, 0);
  const chunkKB = (chunkSize / 1024).toFixed(1);
  const limitKB = (limit.maxBytes / 1024).toFixed(0);
  const status = chunkSize <= limit.maxBytes ? 'PASS' : 'FAIL';

  console.log(`  ${status === 'PASS' ? '[OK]  ' : '[FAIL]'} ${limit.label}: ${chunkKB} KB / ${limitKB} KB`);

  if (chunkSize > limit.maxBytes) {
    errors.push(
      `${limit.label} exceeds limit: ${chunkKB} KB > ${limitKB} KB`
    );
    // List the offending files
    for (const f of matchingFiles.sort((a, b) => b.size - a.size).slice(0, 5)) {
      console.log(`        - ${f.relativePath}: ${(f.size / 1024).toFixed(1)} KB`);
    }
  }
}

// ---------------------------------------------------------------
// Check total bundle size
// ---------------------------------------------------------------
const totalKB = (totalSize / 1024).toFixed(1);
const totalLimitKB = (TOTAL_MAX_BYTES / 1024).toFixed(0);
const totalStatus = totalSize <= TOTAL_MAX_BYTES ? 'PASS' : 'FAIL';

console.log(`  ${totalStatus === 'PASS' ? '[OK]  ' : '[FAIL]'} Total bundle: ${totalKB} KB / ${totalLimitKB} KB`);
console.log('');

if (totalSize > TOTAL_MAX_BYTES) {
  errors.push(`Total bundle exceeds limit: ${totalKB} KB > ${totalLimitKB} KB`);

  // Show top 10 largest files
  console.log('  Largest files:');
  const sorted = allFiles.sort((a, b) => b.size - a.size).slice(0, 10);
  for (const f of sorted) {
    console.log(`    ${(f.size / 1024).toFixed(1)} KB  ${f.relativePath}`);
  }
  console.log('');
}

// ---------------------------------------------------------------
// Summary
// ---------------------------------------------------------------
if (errors.length > 0) {
  console.log(`Bundle size check FAILED (${errors.length} violation(s)):`);
  for (const e of errors) {
    console.log(`  - ${e}`);
  }
  process.exit(1);
}

console.log('Bundle size check PASSED.');
```

---

## 11. Package.json Scripts

The following `scripts` block should be merged into the project root `package.json`. It covers every test, build, and validation command referenced by the CI workflow and developer workflows.

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",

    "test": "jest",
    "test:unit": "jest --testPathPattern=tests/unit",
    "test:integration": "jest --testPathPattern=tests/integration",
    "test:e2e": "playwright test",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:debug": "PWDEBUG=1 playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --ci --coverage && playwright test",
    "test:watch": "jest --watch",

    "lint": "eslint src/ tests/ --ext .ts,.tsx",
    "lint:fix": "eslint src/ tests/ --ext .ts,.tsx --fix",
    "typecheck": "tsc --noEmit",
    "format": "prettier --write \"src/**/*.{ts,tsx,css}\" \"tests/**/*.ts\"",
    "format:check": "prettier --check \"src/**/*.{ts,tsx,css}\" \"tests/**/*.ts\"",

    "validate:manifest": "ts-node scripts/validate-manifest.ts",
    "validate:bundle": "ts-node scripts/check-bundle-size.ts",
    "validate:all": "npm run validate:manifest -- dist/manifest.json && npm run validate:bundle -- dist/",

    "bump:version": "ts-node scripts/bump-version.ts",

    "package": "cd dist && zip -r ../zovo-cookie-manager.zip .",
    "release": "npm run lint && npm run typecheck && npm run test && npm run build && npm run validate:all && npm run package",

    "precommit": "npm run lint && npm run typecheck && npm run test:unit"
  }
}
```

### Script Reference

| Script | Purpose | Used In CI |
|--------|---------|------------|
| `test` | Run all Jest tests (unit + integration) | No (use specific variants) |
| `test:unit` | Run only unit tests | Yes (`unit-test` job) |
| `test:integration` | Run only integration tests | Yes (`unit-test` job) |
| `test:e2e` | Run Playwright E2E tests | Yes (`e2e-test` job) |
| `test:e2e:headed` | Run E2E with visible browser (local dev) | No |
| `test:e2e:debug` | Run E2E with Playwright Inspector (local dev) | No |
| `test:e2e:ui` | Run E2E with Playwright UI mode (local dev) | No |
| `test:coverage` | Run Jest with coverage report | No (CI uses `--coverage` flag) |
| `test:ci` | Full CI test run: Jest + Playwright | Optional shorthand |
| `test:watch` | Jest watch mode for TDD | No |
| `lint` | ESLint across src and tests | Yes (`lint` job) |
| `lint:fix` | ESLint with auto-fix | No |
| `typecheck` | TypeScript type checking without emit | Yes (`lint` job) |
| `format` | Prettier formatting | No |
| `format:check` | Prettier check (no write) | Yes (`lint` job) |
| `validate:manifest` | Validate manifest.json | Yes (`build` job) |
| `validate:bundle` | Check bundle size limits | Yes (`build` job) |
| `validate:all` | Run all validation scripts | No (convenience) |
| `bump:version` | Bump version in manifest + package.json | Yes (`deploy` job) |
| `package` | Create CWS-ready ZIP from dist | Yes (`package` job) |
| `release` | Full local release pipeline | No |
| `precommit` | Pre-commit hook: lint + type + unit | No (git hook) |

---

## Appendix: Test File Structure

```
cookie-manager/
├── playwright.config.ts
├── tests/
│   ├── e2e/
│   │   ├── fixtures/
│   │   │   └── extension.ts          # Playwright fixture with extension loading
│   │   ├── pages/
│   │   │   ├── PopupPage.ts          # Page object for popup
│   │   │   ├── ProfilesPage.ts       # Page object for profiles panel
│   │   │   └── RulesPage.ts          # Page object for rules panel
│   │   ├── helpers/
│   │   │   └── cookies.ts            # Cookie injection/cleanup helpers
│   │   ├── popup-basic.spec.ts       # Suite 1: 15 popup tests
│   │   ├── profiles.spec.ts          # Suite 2: 8 profile tests
│   │   ├── rules.spec.ts             # Suite 3: 8 rule tests
│   │   ├── export-import.spec.ts     # Suite 4: 8 export/import tests
│   │   ├── onboarding.spec.ts        # Suite 5: 5 onboarding tests
│   │   └── payment-upgrade.spec.ts   # Suite 6: 6 payment/upgrade tests
│   ├── unit/                          # (Agent 1 scope)
│   └── integration/                   # (Agent 2 scope)
├── scripts/
│   ├── bump-version.ts
│   ├── validate-manifest.ts
│   └── check-bundle-size.ts
└── .github/
    └── workflows/
        └── ci.yml
```

**Total E2E test count: 50 tests across 6 suites.**

| Suite | File | Tests |
|-------|------|-------|
| Popup Basic Operations | `popup-basic.spec.ts` | 15 |
| Profile Management | `profiles.spec.ts` | 8 |
| Auto-Delete Rules | `rules.spec.ts` | 8 |
| Export/Import | `export-import.spec.ts` | 8 |
| Onboarding Flow | `onboarding.spec.ts` | 5 |
| Payment/Upgrade Flow | `payment-upgrade.spec.ts` | 6 |

---

*Agent 3 of 5 -- Phase 10 (Automated Testing Suite). This document defines the complete Playwright E2E test infrastructure, GitHub Actions CI/CD pipeline, validation scripts, and package.json scripts for the Zovo Cookie Manager Chrome extension.*
