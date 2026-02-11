# Zovo Cookie Manager: Performance Audit & Optimization Plan

**Agent:** Performance Engineering
**Date:** 2026-02-11
**Status:** Implementation-Ready

---

## 1. Performance Audit Plan

### 1.1 Load Time Analysis

**Popup open time: target <100ms to interactive.**

The popup critical path is: Chrome resolves `popup.html` -> parse HTML -> load inline critical CSS -> execute `popup.js` -> Preact mounts root component -> first paint of Cookies tab. Every stage has a time budget:

| Stage | Budget | Strategy |
|-------|--------|----------|
| HTML parse | <5ms | Single `<div id="app">` with inline critical CSS in a `<style>` block. No external CSS file on the critical path. |
| Script load | <15ms | Single bundled `popup.js` at <150KB. Loaded with `defer`. No dynamic imports on the critical path. |
| Preact mount | <10ms | Mount only the header, tab bar, and Cookies tab shell. Render a skeleton placeholder for the cookie list. |
| Cookie API call | <30ms | Fire `chrome.cookies.getAll({ url })` immediately on mount. This call is local (no network) and typically returns in 5-20ms for domains with <200 cookies. |
| First meaningful paint | <40ms | Render cookie list rows from API response. Virtual scroller initializes with visible viewport only. |
| Total to interactive | <100ms | User can click, search, and scroll within 100ms of popup open. |

Non-visible tabs (Profiles, Rules, Health) are not rendered until the user switches to them. Their component code is in the main bundle but their data fetches and DOM trees are deferred. This saves 20-40ms of unnecessary `chrome.storage.local.get` calls and DOM construction on popup open.

**Background service worker initialization.**

The service worker must wake from idle in under 50ms. Top-level code is restricted to event listener registration only. No synchronous storage reads, no object construction, no class instantiation at the top level. All initialization logic runs inside the listener callbacks:

```typescript
// Good: register listeners at top level, defer work
chrome.runtime.onInstalled.addListener(handleInstalled);
chrome.alarms.onAlarm.addListener(handleAlarm);
chrome.cookies.onChanged.addListener(handleCookieChange);

// Bad: synchronous init at top level
// const config = await chrome.storage.local.get("config"); // BLOCKS WAKE
```

**Content script injection: target <50ms.**

The only content script (`cookie-banner-detect.ts`) runs a lightweight DOM query for known consent banner selectors. It must not import any libraries. Budget: <2KB minified. Execution: a single `document.querySelector` call against a static selector list of ~30 patterns. No MutationObserver, no DOM modification. Result is sent back via `chrome.runtime.sendMessage` and the script terminates.

### 1.2 Memory Analysis

**Baseline memory footprint estimate.**

| Component | Idle Estimate | Active Estimate | Notes |
|-----------|---------------|-----------------|-------|
| Service worker | 2-4 MB | 5-8 MB | Idle: listeners registered, no data in memory. Active: processing alarm, holding cookie arrays during rule execution. |
| Popup (Cookies tab, empty) | 4-6 MB | -- | Preact VDOM, CSS, base DOM. |
| Popup (Cookies tab, 100 cookies) | 8-12 MB | -- | Each rendered cookie row: ~500 bytes DOM + ~200 bytes VDOM node. Virtual scroller limits rendered rows. |
| Popup (Cookies tab, 500 cookies) | 12-20 MB | -- | Virtual scroller renders only ~15 visible rows + 5 buffer = 20 rows in DOM. The 500-cookie data array costs ~400KB in memory. |
| Popup (Cookies tab, 1000 cookies) | 15-25 MB | -- | Data array ~800KB. Still only 20 rows in DOM. |

**Memory cleanup on popup close.**

When the popup closes, Chrome destroys the entire popup execution context, releasing all DOM, VDOM, and JS heap memory. No explicit cleanup is required. However, closures that capture large objects inside `chrome.storage.onChanged` listeners in the service worker must be avoided to prevent the service worker from retaining popup-related data.

**Memory leak prevention for Preact components.**

1. All `useEffect` hooks must return cleanup functions that remove event listeners, clear timeouts, and cancel pending `chrome.storage` reads.
2. The `chrome.cookies.onChanged` listener in the popup (used for live refresh) must be added in `useEffect` and removed in the cleanup return.
3. Virtual scroller component must not store references to off-screen DOM nodes. Recycled row elements are reused, not accumulated.
4. Search results must replace (not append to) the previous result set in state.

### 1.3 Bundle Size Analysis

**Target size budget per component:**

| Output File | Target | Critical Limit | Contents |
|-------------|--------|----------------|----------|
| `popup.js` | <120KB | <150KB | Preact (3KB gzip), all popup components, virtual scroller, search logic, export serializers |
| `popup.css` | <15KB | <20KB | All popup styles including themes. Inlined critical CSS extracted at build time. |
| `background.js` | <35KB | <50KB | Service worker: alarm handlers, rules engine, cookie monitor, sync manager, license checker |
| `options.js` | <80KB | <100KB | Options page components. Shares Preact from a common chunk if code-split, otherwise standalone. |
| `content.js` | <2KB | <3KB | Banner detection script. No dependencies. |
| `shared/` (common chunk) | <30KB | <50KB | @zovo/auth (~5KB), storage wrappers, cookie-utils, tier-guard, analytics |
| Assets (icons, images) | <60KB | <100KB | SVG icons inline where possible. PNG only for Chrome Web Store listing assets. |
| **Total** | **<342KB** | **<450KB** | Well under the 500KB target from spec. |

**Tree-shaking strategy.**

Vite with Rollup handles tree-shaking natively. Enforce the following to maximize it:
- All shared modules use named exports only. No default exports, no barrel files re-exporting everything.
- `@zovo/auth` must be published with `"sideEffects": false` in its `package.json`.
- Preact imports use `preact/hooks` and `preact/compat` selectively, never the full `preact` barrel.
- `nanoid` is replaced with `crypto.randomUUID()` at build time via a Vite define replacement, eliminating the 1KB dependency entirely since Chrome 92+ supports it.

**Image optimization.**

- All UI icons are inline SVG components rendered by Preact. Zero network requests for icons.
- Extension manifest icons (16/32/48/128px) are optimized PNG files run through `pngquant` at build time.
- Paywall preview images (used in options page) are WebP with lazy loading via `loading="lazy"`.

---

## 2. Optimization Specifications

### 2.1 Code Optimizations

**Lazy loading strategy.**

| Load Timing | Features |
|-------------|----------|
| Immediate (popup open) | Header, tab bar, Cookies tab shell, search bar, cookie list virtual scroller |
| On first data return (~20ms) | Cookie list rows populated, domain indicator, cookie count badge |
| On tab switch (user action) | Profiles tab components + `chrome.storage.local.get("profiles")` |
| On tab switch (user action) | Rules tab components + `chrome.storage.local.get("rules")` |
| On tab switch (user action) | Health tab components + `chrome.storage.local.get("health_cache")` |
| On demand (user action) | Export panel, Import panel, cookie detail/edit form, PaywallPrompt |

All tab content components live in the main `popup.js` bundle (they are small enough that code-splitting would add more overhead from dynamic import waterfall than it saves in bytes). The "lazy" aspect is that their data fetches and Preact render calls are deferred until the tab activates.

**Debounce and throttle specifications.**

| Interaction | Technique | Interval | Rationale |
|-------------|-----------|----------|-----------|
| Search input | Debounce | 300ms | User types "session" -- only filter after 300ms of no keystrokes. Prevents re-filtering on every character. |
| Cookie list scroll | Throttle (rAF) | 16ms | Virtual scroller recalculates visible rows at 60fps. Uses `requestAnimationFrame` as the throttle mechanism. |
| Storage writes (settings) | Debounce | 1000ms | User toggles multiple settings in sequence. Batch into a single `chrome.storage.sync.set` call. |
| Storage writes (analytics queue) | Batch + flush | 5min or 50 events | Append events to in-memory array. Flush to `chrome.storage.local` on popup close, on 50-event threshold, or on 5-minute alarm. |
| Window resize (options page) | Throttle | 100ms | Recalculate layout on resize without excessive reflows. |
| Cookie API re-fetch | Debounce | 500ms | When `chrome.cookies.onChanged` fires rapidly (bulk delete), debounce the cache invalidation + re-fetch to avoid hammering the API. |

**Cookie API call batching.**

```typescript
// Cache layer: memory -> storage -> API
const cookieCache = new Map<string, { cookies: ChromeCookie[]; ts: number }>();
const CACHE_TTL = 5000; // 5 seconds

async function getCookiesForDomain(domain: string): Promise<ChromeCookie[]> {
  const cached = cookieCache.get(domain);
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.cookies;

  const cookies = await chrome.cookies.getAll({ domain });
  cookieCache.set(domain, { cookies, ts: Date.now() });
  return cookies;
}
```

When the popup opens, a single `chrome.cookies.getAll({ url: activeTabUrl })` is fired. Subsequent calls within 5 seconds return the cached result. The cache is invalidated when `chrome.cookies.onChanged` fires for the relevant domain.

### 2.2 Storage Optimizations

**Read/write batching.**

All writes to `chrome.storage.local` go through a batching layer that collects changes for 1 second before committing:

```typescript
let pendingWrites: Record<string, unknown> = {};
let writeTimer: ReturnType<typeof setTimeout> | null = null;

function queueWrite(key: string, value: unknown): void {
  pendingWrites[key] = value;
  if (!writeTimer) {
    writeTimer = setTimeout(flushWrites, 1000);
  }
}

async function flushWrites(): Promise<void> {
  const batch = pendingWrites;
  pendingWrites = {};
  writeTimer = null;
  await chrome.storage.local.set(batch);
}
```

This prevents rapid successive writes (e.g., toggling multiple rules) from generating 10 separate IPC calls to Chrome's storage backend.

**Cache hierarchy.**

```
Request --> Memory Map (0ms) --> chrome.storage.local (3-8ms) --> chrome.cookies API (5-20ms)
                |                        |                              |
           Invalidate on            Invalidate on                 Source of truth
         onChanged events         24h expiry (health)
```

**Storage quota monitoring.**

On every batched write flush, check `chrome.storage.local.getBytesInUse()`. If usage exceeds 8MB (80% of 10MB limit), trigger cleanup: purge `health_cache` entries older than 24 hours, trim `analytics_queue` to most recent 20 events, and remove the oldest snapshots beyond the tier limit.

### 2.3 Rendering Optimizations

**Virtual scrolling specification.**

The cookie list uses a fixed-height virtual scroller. Each cookie row is exactly 48px tall (compact mode: 36px). Given the popup content area of approximately 360px, the viewport displays ~7.5 rows (compact: ~10 rows).

| Parameter | Value |
|-----------|-------|
| Row height | 48px (compact: 36px) |
| Visible rows | 8 (compact: 10) |
| Buffer rows (above + below) | 5 + 5 |
| Total rendered DOM rows | 18 (compact: 20) |
| Scroll container | `overflow-y: auto` with `will-change: transform` |
| Spacer elements | Top and bottom `<div>` with calculated `height` to maintain scrollbar accuracy |

This means rendering 1000 cookies costs the same DOM as rendering 18 rows. The data array of 1000 `ChromeCookie` objects (~800KB) stays in a Preact `useRef` (not state, to avoid re-render on scroll), and the visible slice is derived in the scroll handler via index arithmetic.

**CSS containment.**

```css
.cookie-row {
  contain: content;    /* Isolate layout/paint per row */
  height: 48px;        /* Fixed height for virtual scroll calculation */
  will-change: transform; /* Promote to compositor layer */
}

.cookie-list-container {
  contain: strict;     /* Full containment on the scroll container */
  overflow-y: auto;
}
```

**Animation budget.**

- Maximum 2 concurrent CSS transitions at any time.
- Allowed properties: `transform`, `opacity` only. These run on the compositor thread and do not trigger layout or paint.
- Tab switch: `opacity` fade, 150ms `ease-out`.
- Cookie row expand: `transform: scaleY()`, 200ms `ease-out`.
- Paywall slide-up: `transform: translateY()`, 250ms `cubic-bezier(0.4, 0, 0.2, 1)`.
- No `box-shadow`, `border-radius`, `width`, or `height` transitions. These trigger paint or layout.

**Layout thrashing prevention.**

All DOM reads (e.g., `getBoundingClientRect`, `offsetHeight`) are batched before DOM writes. The virtual scroller uses a single `requestAnimationFrame` callback that first reads `scrollTop`, then writes the row translations. Never interleave reads and writes in a loop.

### 2.4 Background Service Worker Optimizations

**Event-driven architecture.**

Zero polling. Every scheduled task uses `chrome.alarms`. The service worker is idle (and Chrome can terminate it) between events. When an alarm fires, the handler executes its task, writes results to `chrome.storage.local`, and returns. No `setInterval`, no `setTimeout` for recurring work.

**Listener management.**

The `chrome.cookies.onChanged` listener is always registered (required for cache invalidation). However, the notification and logging logic inside the handler checks a `monitoring_enabled` flag from storage. If monitoring is off, the handler returns immediately after cache invalidation -- a <0.1ms code path.

**Alarm consolidation.**

`usage-reset-monthly` and `license-check` both run on 24-hour intervals. They could share a single alarm (`daily-maintenance`) that runs both checks sequentially, reducing alarm overhead from 5 to 4 registered alarms.

**Service worker wake-up handling.**

On `chrome.runtime.onStartup`, verify all expected alarms exist via `chrome.alarms.getAll()`. Re-create any missing alarms. This handles the edge case where Chrome clears alarms during an update or crash. The check is a single async call costing <5ms.

---

## 3. Performance Benchmarks Table

| Metric | Budget | Measurement Method | Optimization Strategy |
|--------|--------|-------------------|----------------------|
| Popup first paint | <50ms | `performance.mark("popup-init")` at script start, `performance.mark("first-paint")` after Preact mount, `performance.measure` between them | Inline critical CSS, render only Cookies tab shell |
| Popup interactive | <100ms | `performance.mark("interactive")` after cookie list populates and search bar binds input handler | Defer Profiles/Rules/Health tab data and rendering |
| Cookie list render (100 items) | <16ms | `performance.now()` before and after virtual scroller renders visible slice | Virtual scrolling: 18 DOM rows regardless of data size |
| Cookie list render (1000 items) | <16ms | Same as above; identical DOM cost | Virtual scrolling + data in `useRef`, not state |
| Search latency | <50ms | `performance.mark` on input handler, mark on render complete | In-memory `Array.filter` on cached cookie array, debounced 300ms |
| Export 25 cookies | <100ms | Start mark on button click, end mark on download trigger | Synchronous `JSON.stringify` on pre-cached data |
| Export 1000 cookies | <500ms | Same measurement | Chunked serialization if >500 cookies to avoid blocking UI |
| Profile save | <200ms | Click to confirmation toast | Optimistic UI: show success immediately, write async |
| Profile load (restore 20 cookies) | <1s | Click to all `chrome.cookies.set` resolved | Parallel `Promise.all` on cookie set calls, max 10 concurrent |
| Memory (popup open, idle) | <10MB | `performance.memory` (Chrome DevTools) | Minimal DOM, no pre-loaded tab data |
| Memory (popup, 500 cookies) | <25MB | DevTools Memory snapshot | Virtual scroller, data array only, no DOM refs for off-screen rows |
| Bundle size (popup.js) | <120KB | `vite build` output, `gzip -9` measurement | Tree-shake Preact, eliminate nanoid, minify with terser |
| Bundle size (total) | <342KB | Sum of all output files | Per-component budgets enforced in CI |
| Service worker wake | <50ms | `performance.now()` at first line of `onStartup` handler to end of alarm verification | Zero top-level init, listeners only |
| `chrome.cookies.getAll` | <20ms | `performance.now()` wrapper | Single call, cache result for 5s |
| `chrome.storage.local.get` | <8ms | `performance.now()` wrapper | Read batching, memory cache for hot paths |
| Content script injection | <30ms | `performance.now()` at script start to `sendMessage` | <2KB script, single DOM query, no dependencies |

---

## 4. Browser Impact Assessment

### 4.1 Page Load Times

**Target: <5ms overhead with extension enabled vs. disabled.**

The extension does not inject content scripts on every page. The `cookie-banner-detect.ts` content script runs only on explicit user action (triggering a GDPR scan from the popup), not on every navigation. Therefore, the extension adds zero overhead to page load times during normal browsing.

The only background cost is the service worker's event listeners. `chrome.cookies.onChanged` fires when any cookie is set or removed, but the handler performs a Map lookup and early return in <0.1ms. `chrome.tabs.onUpdated` caches the tab URL in a Map -- also <0.1ms.

**Measured expectation: <1ms overhead per page load.** This is within measurement noise.

### 4.2 Browser Startup Time

**Target: no measurable impact.**

On browser startup, `chrome.runtime.onStartup` fires. The handler calls `chrome.alarms.getAll()` (async, non-blocking) and verifies alarm registrations. Total execution: <10ms, entirely non-blocking. No synchronous storage reads, no network calls. The service worker goes idle within 50ms of startup.

### 4.3 Tab Switching Speed

**Target: no impact.**

The extension does not inject content scripts into tabs, does not modify page DOM, and does not intercept navigation events. `chrome.tabs.onUpdated` and `chrome.tabs.onRemoved` listeners perform sub-millisecond Map operations. Tab switching speed is unaffected.

### 4.4 Overall Browser Memory with 10+ Tabs

**Target: <5MB overhead from extension.**

With the popup closed (normal browsing state), only the service worker contributes to memory. An idle service worker with registered listeners and an empty event queue uses 2-4MB. Chrome may terminate the service worker after 30 seconds of inactivity, reducing the footprint to near zero until the next event.

With the popup open, memory rises to 10-25MB depending on cookie count, but this is temporary and fully reclaimed on popup close.

**Net steady-state overhead while browsing: 2-4MB (service worker active) or ~0MB (service worker terminated by Chrome).**

---

## 5. Optimization Implementation Guide

### P0 -- Must Ship (blocking launch)

**5.1 Virtual Scrolling for Cookie List**

What: Render only visible rows plus a 5-row buffer above and below the viewport. Use a fixed row height of 48px and calculate visible indices from `scrollTop`.

```typescript
function VirtualCookieList({ cookies }: { cookies: ChromeCookie[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const ROW_HEIGHT = 48;
  const BUFFER = 5;
  const VIEWPORT_HEIGHT = 360;

  const totalHeight = cookies.length * ROW_HEIGHT;
  const startIdx = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - BUFFER);
  const endIdx = Math.min(
    cookies.length,
    Math.ceil((scrollTop + VIEWPORT_HEIGHT) / ROW_HEIGHT) + BUFFER
  );
  const visibleCookies = cookies.slice(startIdx, endIdx);

  const onScroll = () => {
    if (containerRef.current) setScrollTop(containerRef.current.scrollTop);
  };

  return (
    <div ref={containerRef} onScroll={onScroll}
         style={{ height: VIEWPORT_HEIGHT, overflowY: 'auto', contain: 'strict' }}>
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visibleCookies.map((cookie, i) => (
          <CookieRow key={cookie.name + cookie.domain}
                     cookie={cookie}
                     style={{ position: 'absolute',
                              top: (startIdx + i) * ROW_HEIGHT,
                              height: ROW_HEIGHT }} />
        ))}
      </div>
    </div>
  );
}
```

Expected improvement: Renders 1000 cookies in the same time as 18. Reduces DOM node count from ~5000 to ~90 for large lists. Saves 10-40MB of memory on heavy domains.

**5.2 Inline Critical CSS**

What: Extract the CSS required for first paint (header, tab bar, cookie list skeleton) and inline it into `popup.html` inside a `<style>` tag. The full stylesheet loads asynchronously via `<link rel="preload" as="style">`.

```html
<head>
  <style>
    /* Critical: header, tab-bar, cookie-list-container, skeleton rows */
    :root { --bg-primary: #fff; --text-primary: #1a1d23; }
    body { margin: 0; font-family: Inter, system-ui, sans-serif; }
    .header { height: 56px; display: flex; align-items: center; padding: 0 16px; }
    .tab-bar { height: 40px; display: flex; border-bottom: 1px solid #e0e2e6; }
    .cookie-list { flex: 1; overflow-y: auto; contain: strict; }
  </style>
  <link rel="preload" href="popup.css" as="style" onload="this.rel='stylesheet'">
</head>
```

Expected improvement: Eliminates the render-blocking CSS fetch. First paint arrives 10-20ms sooner.

**5.3 Deferred Tab Rendering**

What: Only the Cookies tab renders on popup open. Other tabs render on first activation and stay mounted afterward (no re-mount cost on tab switch back).

```typescript
function App() {
  const [activeTab, setActiveTab] = useState('cookies');
  const [mountedTabs, setMountedTabs] = useState(new Set(['cookies']));

  const switchTab = (tab: string) => {
    setMountedTabs(prev => new Set(prev).add(tab));
    setActiveTab(tab);
  };

  return (
    <>
      <TabBar active={activeTab} onSwitch={switchTab} />
      <div style={{ display: activeTab === 'cookies' ? 'block' : 'none' }}>
        <CookiesTab />
      </div>
      {mountedTabs.has('profiles') && (
        <div style={{ display: activeTab === 'profiles' ? 'block' : 'none' }}>
          <ProfilesTab />
        </div>
      )}
      {/* Same pattern for Rules, Health */}
    </>
  );
}
```

Expected improvement: Saves 20-40ms on popup open by avoiding 3 unnecessary `chrome.storage.local.get` calls and their associated component renders.

### P1 -- Should Ship (significant improvement)

**5.4 Storage Write Batching**

What: Collect all `chrome.storage.local.set` calls within a 1-second window and commit them as a single batch. Implementation shown in Section 2.2.

Expected improvement: Reduces IPC calls to Chrome storage backend by 60-80% during active use (e.g., editing multiple cookies, toggling rules). Each avoided IPC saves 3-8ms of async overhead.

**5.5 Cookie API Result Caching**

What: In-memory `Map` cache with 5-second TTL, invalidated on `chrome.cookies.onChanged`. Implementation shown in Section 2.1.

Expected improvement: Eliminates redundant `chrome.cookies.getAll` calls when switching between tabs and back to Cookies. Saves 5-20ms per avoided API call.

**5.6 Search Debounce with Immediate Filter**

What: Debounce search input at 300ms, but apply the filter on the already-cached in-memory cookie array (no API call). Use `Array.filter` with a case-insensitive substring match on `name`, `value`, and `domain` fields.

```typescript
function useSearch(cookies: ChromeCookie[]) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const filtered = useMemo(() => {
    if (!debouncedQuery) return cookies;
    const q = debouncedQuery.toLowerCase();
    return cookies.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.domain.toLowerCase().includes(q) ||
      c.value.toLowerCase().includes(q)
    );
  }, [cookies, debouncedQuery]);

  return { query, setQuery, filtered };
}
```

Expected improvement: Search over 1000 cookies completes in <5ms (pure in-memory string matching). The 300ms debounce prevents unnecessary re-filters while typing.

**5.7 Optimistic UI for Profile Save**

What: On profile save, immediately show the success toast and update the local profile list. Write to `chrome.storage.local` asynchronously. If the write fails (extremely rare), show an error toast and revert.

Expected improvement: Perceived save time drops from 200ms (waiting for storage confirmation) to <16ms (next frame).

### P2 -- Nice to Have (polish)

**5.8 Bundle Size CI Gate**

What: Add a build step that checks output file sizes against the budget table. Fail CI if any file exceeds its critical limit.

```bash
# In CI pipeline
POPUP_SIZE=$(stat -f%z dist/popup.js 2>/dev/null || stat -c%s dist/popup.js)
if [ "$POPUP_SIZE" -gt 153600 ]; then  # 150KB
  echo "FAIL: popup.js exceeds 150KB budget ($POPUP_SIZE bytes)"
  exit 1
fi
```

Expected improvement: Prevents accidental dependency bloat from reaching production.

**5.9 Alarm Consolidation**

What: Merge `license-check` and `usage-reset-monthly` into a single `daily-maintenance` alarm. The handler runs both checks sequentially.

Expected improvement: Reduces registered alarms from 5 to 4. Marginal reduction in Chrome's alarm management overhead.

**5.10 `requestIdleCallback` for Analytics**

What: Queue analytics event writes to `chrome.storage.local` inside `requestIdleCallback` so they never compete with user-facing interactions.

```typescript
function trackEvent(event: AnalyticsEvent): void {
  analyticsBuffer.push(event);
  if (typeof requestIdleCallback !== 'undefined') {
    requestIdleCallback(() => flushAnalyticsToStorage());
  } else {
    setTimeout(() => flushAnalyticsToStorage(), 1000);
  }
}
```

Expected improvement: Analytics writes become invisible to the user. Zero impact on interaction latency even during heavy event tracking.

---

## Summary of Priority Actions

| Priority | Item | Expected Impact |
|----------|------|-----------------|
| P0 | Virtual scrolling | 10-40MB memory savings, constant-time render for any list size |
| P0 | Inline critical CSS | 10-20ms faster first paint |
| P0 | Deferred tab rendering | 20-40ms faster popup open |
| P1 | Storage write batching | 60-80% fewer IPC calls during active editing |
| P1 | Cookie API caching | 5-20ms saved per redundant fetch |
| P1 | Search debounce | <5ms search latency over 1000 cookies |
| P1 | Optimistic UI | Perceived save time: 200ms to <16ms |
| P2 | Bundle size CI gate | Prevents regression |
| P2 | Alarm consolidation | Marginal overhead reduction |
| P2 | `requestIdleCallback` analytics | Zero-impact event tracking |

All P0 items must be implemented before launch. P1 items should ship in v1.0. P2 items can follow in a patch release. With these optimizations in place, the extension will consistently hit the <100ms popup open target, stay under 25MB of memory with 500 cookies, and ship at under 350KB total bundle size -- a lightweight, fast tool that users never feel in their browser.
