# Zovo Cookie Manager -- Runtime Test Procedures

**Author:** Runtime Testing Specialist (Agent 3)
**Date:** 2026-02-11
**Extension Version:** 1.0.0
**Scope:** Step-by-step runtime verification of every user flow, error scenario, and edge case.

---

## Step 1: Popup Testing Procedures

### Test Suite P1: Basic Functionality

| Test ID | Test | Steps | Expected | Pass/Fail |
|---------|------|-------|----------|-----------|
| P1.1 | Popup opens without console errors | 1. Navigate to `example.com`. 2. Right-click the Zovo Cookie Manager icon in the toolbar. 3. Click "Inspect popup" to open DevTools for the popup. 4. Check the Console tab for errors and warnings. | Zero errors and zero warnings in Console. The popup HTML renders within the 400x520 popup frame. | |
| P1.2 | Cookie list loads for current tab | 1. Navigate to `github.com` (known to set multiple cookies). 2. Click the extension icon to open the popup. 3. Observe the Cookies tab content area. | All cookies for `github.com` are listed. Each row shows name, truncated value, domain. Header displays domain name and cookie count badge (e.g., "github.com -- 12 cookies"). | |
| P1.3 | Popup header renders correctly | 1. Open popup on any site. 2. Inspect the 56px header bar. | Header shows the Zovo logo/icon, "Zovo Cookie Manager" text, tier badge ("FREE" or "PRO"), and gear icon for settings. Domain name and cookie count appear below the title. | |
| P1.4 | Tab bar navigation | 1. Open popup. 2. Click each tab in order: Cookies, Profiles, Rules, Health. 3. Click Cookies again to return. | Each tab activates with a visual highlight. Content area swaps to the correct panel. No flash of blank content between tab transitions. Active tab has the brand-primary underline or fill. | |
| P1.5 | Search input renders and focuses | 1. Open popup on a site with cookies. 2. Click the search bar. 3. Type "sess". 4. Clear the input. | Search bar is visible at the top of the Cookies tab with placeholder text "Search cookies...". Typing "sess" filters the list to only cookies whose name, value, or domain contains "sess". Clearing restores all cookies. Filter count shown (e.g., "3 of 47 cookies"). | |
| P1.6 | Filter chips toggle | 1. Open popup on a site with mixed cookies. 2. Click "Session" chip. 3. Click "Persistent" chip. 4. Click "Secure" chip. 5. Click "3P" (Third-party) chip. 6. Click an active chip again to deselect. | Each chip visually activates with a filled state. The cookie list filters to match. Multiple chips combine with AND logic. Deselecting a chip restores the unfiltered view for that attribute. | |
| P1.7 | Cookie row expand/collapse | 1. Open popup. 2. Click any cookie row to expand it. 3. Click the same row header to collapse it. | Expanding reveals the full detail form: name, value (full, not truncated), domain, path, expires (formatted date or "Session"), httpOnly toggle, secure toggle, sameSite dropdown. Security flags render as colored pills. Collapsing hides the detail form and restores the compact row. | |
| P1.8 | Inline cookie value editing | 1. Expand a cookie row. 2. Click into the value field. 3. Change the value to `test_modified_value`. 4. Click the Save button. 5. Close and reopen the popup. | The value field is editable as a text input. On save, a brief success indicator appears (checkmark or toast). The cookie list refreshes. Reopening the popup shows the persisted new value. Verified by running `chrome.cookies.get()` in the background console. | |
| P1.9 | Cookie name editing (delete + recreate) | 1. Expand a cookie. 2. Change the name from `session_id` to `session_id_v2`. 3. Click Save. | The old cookie (`session_id`) is deleted via `chrome.cookies.remove()` and a new cookie (`session_id_v2`) is created with `chrome.cookies.set()` preserving all other fields. Only one cookie with the new name exists. | |
| P1.10 | Create new cookie | 1. Click the "+ Add" button in the action bar. 2. Fill in Name: `test_cookie`, Value: `hello123`. 3. Leave other fields as defaults. 4. Click Save. | A new form appears with empty fields. Defaults populate: domain = current tab domain, path = `/`, secure = `true` (if HTTPS), sameSite = `Lax`. After save, the new cookie appears in the list. Badge count increments by 1. | |
| P1.11 | Delete single cookie | 1. Hover over a cookie row. 2. Click the X (delete) button. 3. In the confirmation dialog, click "Delete". | Confirmation dialog appears with the cookie name. On confirm, the cookie row disappears, badge count decrements, and `chrome.cookies.get()` returns null for that cookie. | |
| P1.12 | Delete All cookies | 1. Click "Delete All" in the action bar. 2. Confirm in the dialog. | Dialog warns: "Delete all cookies for [domain]?" with the count. On confirm, all cookies for the current domain are removed. List shows empty state: "No cookies found for this domain." Badge shows "0". | |
| P1.13 | Cancel delete | 1. Click X on any cookie row. 2. Click "Cancel" in the confirmation dialog. | Dialog closes. Cookie remains in the list unchanged. Badge count unchanged. | |
| P1.14 | Export JSON (under limit) | 1. Open popup on a site with fewer than 25 cookies. 2. Click "Export" in the action bar. 3. Select "JSON" format. | A `.json` file downloads with filename format `cookies-[domain]-[YYYY-MM-DD].json`. File contents are a valid JSON array of cookie objects. Each object includes name, value, domain, path, secure, httpOnly, sameSite, expirationDate. | |
| P1.15 | Import valid JSON | 1. Click "Import" in the action bar. 2. Select a previously exported valid JSON file. 3. Review the preview screen showing cookies to import. 4. Click "Apply". | Preview lists each cookie with name, domain, and a checkbox. On Apply, all listed cookies are created via `chrome.cookies.set()`. Cookie list refreshes. Count matches the imported file. | |
| P1.16 | Import invalid JSON | 1. Click "Import". 2. Select a `.json` file with malformed content (missing brackets, trailing comma). | Error message: "Invalid JSON file. Please check the file format." No cookies are modified. Import dialog remains open for retry. | |
| P1.17 | Cookie protection toggle on | 1. Locate a cookie row. 2. Click the Protect (lock) toggle. | A lock icon appears on the cookie row. The cookie's edit fields become disabled/read-only. The protection state persists in storage metadata. | |
| P1.18 | Cookie protection toggle off | 1. Click the lock icon on a protected cookie to unprotect it. | Lock icon removed. Edit fields become editable again. | |
| P1.19 | Scroll behavior with many cookies | 1. Navigate to a site with 50+ cookies (or inject via the API). 2. Open popup. 3. Scroll through the list. | The cookie list scrolls smoothly within the content area. The header, tab bar, action bar, and footer remain fixed. No visual jank or layout shift during scroll. | |
| P1.20 | Dark mode rendering | 1. Open the settings page (gear icon). 2. Switch theme to "Dark". 3. Return to the popup. | All backgrounds swap to dark palette (`#1A1D23` primary). Text color inverts to light (`#E8EAED`). Borders use `#3C4049`. Brand accent shifts to `#60A5FA`. No elements remain in light-mode colors. No contrast issues with any text. | |
| P1.21 | System theme detection | 1. Set the OS to dark mode. 2. Set extension theme to "System". 3. Open popup. 4. Switch OS to light mode. | Extension follows the OS theme in real time via `prefers-color-scheme` media query. Popup re-renders to match the OS change without a manual toggle. | |
| P1.22 | Keyboard-only navigation | 1. Open popup. 2. Press Tab repeatedly to cycle through all interactive elements. 3. Press Enter on a cookie row to expand. 4. Press Escape to close expanded detail. | Every interactive element (search, filter chips, cookie rows, buttons, toggles) is reachable via Tab key. Focus rings are visible on each element. Enter activates the focused element. Escape closes modals and expanded views. | |

---

## Step 2: Background Script Testing Procedures

### Test Suite B1: Service Worker

| Test ID | Test | Steps | Expected | Pass/Fail |
|---------|------|-------|----------|-----------|
| B1.1 | Service worker starts on install | 1. Load the extension unpacked via `chrome://extensions` (Developer mode). 2. Open `chrome://serviceworker-internals/`. 3. Locate the entry for the Zovo Cookie Manager service worker. | The service worker shows status "ACTIVATED" and "RUNNING". The `chrome.runtime.onInstalled` listener fires with `reason: "install"`. Default settings are written to `chrome.storage.sync`. Alarms for `license-check`, `analytics-flush`, and `usage-reset-monthly` are registered (verify via `chrome.alarms.getAll()` in the service worker console). | |
| B1.2 | Service worker handles wake-from-idle | 1. Open `chrome://serviceworker-internals/`. 2. Wait for the service worker to terminate (status changes to "STOPPED" after ~30 seconds of inactivity). 3. Click the extension icon to open the popup. | The service worker wakes up. The popup loads and communicates with the service worker via `chrome.runtime.sendMessage`. No errors in the service worker console. Global state is reconstructed from `chrome.storage`, not from in-memory variables. | |
| B1.3 | Alarms fire at correct intervals | 1. Open the service worker DevTools console (via `chrome://extensions` > "Inspect views: service worker"). 2. Run `chrome.alarms.getAll()` and log the results. 3. Set a breakpoint in the `chrome.alarms.onAlarm` listener. 4. For testing, create a short-interval alarm: `chrome.alarms.create('test-alarm', { delayInMinutes: 0.1 })`. | `chrome.alarms.getAll()` returns entries for: `license-check` (periodInMinutes: 1440), `analytics-flush` (periodInMinutes: 5), `usage-reset-monthly` (periodInMinutes: 1440). The test alarm fires within ~6 seconds and hits the breakpoint. Each alarm triggers its designated handler function. | |
| B1.4 | Auto-delete rule executes on tab close | 1. Create an auto-delete rule via the popup UI for pattern `*.example.com` with trigger "On tab close". 2. Open `https://example.com` in a new tab. 3. Verify cookies exist for `example.com`. 4. Close the `example.com` tab. 5. Check cookies via `chrome.cookies.getAll({ domain: ".example.com" })` in the service worker console. | The `chrome.tabs.onRemoved` listener fires. The service worker matches the closed tab's cached URL against the rule pattern. Cookies matching `*.example.com` are deleted. The `chrome.cookies.getAll()` call returns an empty array (or only exception cookies if configured). Rule's `last_executed_at` timestamp updates in storage. | |
| B1.5 | Auto-delete rule executes on timer | 1. Create a timer-based auto-delete rule (Pro tier) with a 1-minute interval for pattern `*.test.com`. 2. Set cookies for `test.com` manually via `chrome.cookies.set()`. 3. Wait for the alarm to fire (monitor via the service worker console). | A `chrome.alarms` alarm named `rule-timer-{id}` is registered with `periodInMinutes: 1`. When the alarm fires, the rules engine queries `chrome.cookies.getAll()` for the matching pattern, deletes matches, and logs the execution. Verify cookies are removed after the alarm fires. | |
| B1.6 | License check alarm fires every 24h | 1. Inspect the service worker console. 2. Run `chrome.alarms.get('license-check')` to verify registration. 3. Simulate by calling the license check handler directly or creating a short-interval test alarm. | The `license-check` alarm exists with `periodInMinutes: 1440`. When triggered, it calls `GET /auth/verify`. On success, `license_cache.validated_at` updates. On 401, token refresh is attempted. On network error, no action (grace period covers it). | |
| B1.7 | Analytics batch sends every 5 min | 1. Perform several actions in the popup (open tabs, edit cookies, search). 2. Check `chrome.storage.local` for `analytics_queue`. 3. Wait for the `analytics-flush` alarm to fire (5 minutes). | Events accumulate in `analytics_queue` in local storage. When the alarm fires, events are batch-sent via `POST /analytics/events`. On success, `analytics_queue` is cleared. Events include: `event` name, `properties` object, `timestamp`, and `session_id`. No cookie values appear in any event property. | |
| B1.8 | Message passing from popup works | 1. Open the popup. 2. Set a breakpoint in the service worker's `chrome.runtime.onMessage` listener. 3. Perform an action in the popup that triggers a message (e.g., loading a profile). | The popup sends a message via `chrome.runtime.sendMessage()`. The service worker receives it, processes the request, and sends a response via `sendResponse()`. The popup receives the response and updates the UI. No "Unchecked runtime.lastError" warnings in either console. | |
| B1.9 | `chrome.cookies.onChanged` fires and logs (Pro) | 1. Enable Pro tier via storage (`zovo_auth.tier: "pro"`). 2. Set a breakpoint in the `chrome.cookies.onChanged` listener in the service worker. 3. Open DevTools on any page and manually set a cookie via Application > Cookies. | The `onChanged` listener fires with `changeInfo` containing `removed` (boolean), `cookie` (the affected cookie object), and `cause` (e.g., "explicit", "expired", "overwrite"). The event is logged to change history in local storage. The `cookies_cache` for the affected domain is invalidated. | |
| B1.10 | Service worker does not crash with DOM access | 1. Inspect the service worker source code for any `document`, `window`, or DOM API references. 2. Run the service worker and check the console for errors. | No references to `document`, `window`, `localStorage`, `sessionStorage`, or any DOM APIs exist in the service worker code. The service worker runs without "document is not defined" or similar errors. All storage operations use `chrome.storage`. | |

---

## Step 3: Storage Testing Procedures

### Test Suite S1: Data Persistence

| Test ID | Test | Steps | Expected | Pass/Fail |
|---------|------|-------|----------|-----------|
| S1.1 | Settings persist across popup close/open | 1. Open the popup and switch the theme to "Dark". 2. Close the popup (click elsewhere). 3. Reopen the popup. | The popup opens in dark mode. The theme setting was written to `chrome.storage.sync.settings.theme` and is read on popup initialization. | |
| S1.2 | Settings persist across browser restart | 1. Set theme to "Dark" and default tab to "Profiles". 2. Quit Chrome entirely. 3. Relaunch Chrome and open the extension popup. | Dark mode is active. The Profiles tab is shown first. Settings were persisted in `chrome.storage.sync` which survives browser restarts. | |
| S1.3 | Profiles save and load correctly | 1. Navigate to `example.com` and create a test cookie. 2. Open popup, go to Profiles tab, click "Save Current as Profile", name it "Test Profile". 3. Delete all cookies for the domain. 4. Click "Load" on the saved profile. | Profile saves with the domain, cookie array, and timestamp. Loading restores all cookies. Confirmation dialog appears before overwrite. After load, the cookie list matches the original saved state. Profile card shows name, domain, cookie count, and timestamp. | |
| S1.4 | Rules save and persist | 1. Create an auto-delete rule with pattern `*.tracking.com`, trigger "On tab close". 2. Close the popup. 3. Reopen the popup, go to Rules tab. | The rule card displays with the configured pattern, trigger type, and an enabled toggle. The rule data persists in `chrome.storage.local.rules`. The associated alarm (for timer rules) is re-registered on service worker startup. | |
| S1.5 | Auth token persists across devices (simulate) | 1. Write a mock `zovo_auth` object to `chrome.storage.sync` via DevTools: `chrome.storage.sync.set({ zovo_auth: { tier: "pro", token: "mock-jwt", user_id: "test-123", email: "test@example.com", authenticated_at: new Date().toISOString() } })`. 2. Open the popup. | The popup reads `zovo_auth` from sync storage and displays the Pro badge. All Pro limits are removed. This simulates how the token would sync across devices via Chrome Sync. | |
| S1.6 | Corrupted storage recovery | 1. Open DevTools for the service worker. 2. Corrupt the profiles key: `chrome.storage.local.set({ profiles: "not-an-array-this-is-corrupted" })`. 3. Open the popup and navigate to the Profiles tab. | The extension detects that `profiles` is not a valid array. It either resets the key to an empty array `[]` with a user-visible message ("Some data could not be loaded. Resetting to defaults.") or logs the error and gracefully displays the empty state. No crash. No unhandled exception in the console. | |
| S1.7 | Storage quota warning at 80% | 1. Fill `chrome.storage.local` with large data blobs until usage approaches 8 MB (80% of 10 MB limit). 2. Attempt to save a new profile. | The extension checks `chrome.storage.local.getBytesInUse()` before writing. When usage exceeds 80%, a warning banner appears: "Storage is running low. Consider deleting old profiles or data." The save still proceeds if space remains. At 100%, the save fails gracefully with an error message. | |
| S1.8 | Stale cache cleanup works | 1. Open the popup on `example.com` to populate `cookies_cache` for that domain. 2. Wait for the cache to exceed its TTL (or manually set `fetched_at` to a timestamp older than the TTL). 3. Reopen the popup on `example.com`. | The extension detects the stale cache entry and re-fetches cookies from `chrome.cookies.getAll()`. The cache entry's `fetched_at` timestamp updates. Stale data is never displayed to the user. | |

---

## Step 4: Edge Case Testing Procedures

### Test Suite E1: Cookie Edge Cases

| Test ID | Test | Steps | Expected | Pass/Fail |
|---------|------|-------|----------|-----------|
| E1.1 | Domain with 0 cookies | 1. Navigate to a fresh domain that sets no cookies (e.g., a local dev server or `about:blank` then navigate to a bare domain). 2. Open the popup. | Empty state renders: "No cookies found for this domain" message with an illustration. Cookie count badge shows "0". Action bar buttons (Export, Delete All) are disabled or hidden. "+ Add" remains active. | |
| E1.2 | Domain with 1000+ cookies (performance) | 1. Open the service worker console. 2. Programmatically inject 1000 cookies: `for (let i = 0; i < 1000; i++) { chrome.cookies.set({ url: 'https://testsite.com', name: 'cookie_' + i.toString().padStart(4, '0'), value: 'val' + i }); }`. 3. Navigate to `testsite.com` and open the popup. | The cookie list renders using virtualized scrolling (only visible rows are in the DOM). No UI freeze. Scrolling remains smooth at 60fps. Memory usage stays under 80 MB (check via Chrome Task Manager). Render completes within 500ms. | |
| E1.3 | Cookie with empty value | 1. Set a cookie with an empty value: `chrome.cookies.set({ url: 'https://example.com', name: 'empty_val', value: '' })`. 2. Open popup and find the cookie. | The cookie row displays with the name `empty_val`. The value field shows an empty input, not the text "undefined" or "null". The cookie is editable. | |
| E1.4 | Cookie with >4KB value | 1. Attempt to create a cookie via the popup with a 5000-character value (paste a long string). 2. Click Save. | The input field accepts the long string without freezing the popup. On save, `chrome.cookies.set()` returns an error (browser 4KB limit per cookie). The extension displays a clear error: "Cookie value exceeds the 4KB browser limit." The cookie is not saved. | |
| E1.5 | Cookie with special characters | 1. Create a cookie with name `my=cookie` via `chrome.cookies.set()`. 2. Create another with name `semi;colon`. 3. Create another with value containing unicode characters. 4. Open the popup. | All cookies display without crash. Special characters render as literal text. The search function matches cookies containing `=` and `;` when those characters are typed in the search bar. No encoding errors. | |
| E1.6 | HttpOnly cookie | 1. Navigate to a site that sets HttpOnly cookies (most login pages do). 2. Open the popup and find an HttpOnly cookie. 3. Expand the cookie detail. | The cookie is visible in the list (the `chrome.cookies` API can read HttpOnly cookies). The "HttpOnly" pill renders in its designated color. The cookie is editable via the extension since the API has elevated access. | |
| E1.7 | Secure cookie on HTTP page | 1. Navigate to `http://example.com` (no HTTPS). 2. Open the popup. | Secure cookies for `example.com` are still listed (the `chrome.cookies.getAll()` API returns them regardless of the page protocol). If the user tries to create a new cookie with `secure: true` on this HTTP page, a validation warning appears: "Secure cookies require HTTPS." | |
| E1.8 | Partitioned cookies (CHIPS) | 1. Navigate to a site that uses partitioned cookies (Chrome 114+). 2. Open the popup. | If the `chrome.cookies` API supports partitioned cookies, the partition key is displayed in the cookie detail. If not supported, the limitation is documented and the cookie is displayed without the partition key field. No crash in either case. | |
| E1.9 | Expired cookie behavior | 1. Create a cookie via the popup with an expiration date in the past. | The extension warns: "This date is in the past. Cookie will be immediately expired." If saved, the browser immediately removes it. The cookie should not appear in subsequent `chrome.cookies.getAll()` calls and does not appear in the list on next refresh. | |

### Test Suite E2: Browser Edge Cases

| Test ID | Test | Steps | Expected | Pass/Fail |
|---------|------|-------|----------|-----------|
| E2.1 | `chrome://` page | 1. Navigate to `chrome://settings`. 2. Click the extension icon. | The popup displays a graceful message: "Cookie management is not available for browser internal pages." No crash. No error in the popup console. The Cookies tab is empty or disabled. Other tabs (Profiles, Rules, Health) may still be accessible. | |
| E2.2 | `file://` page | 1. Open a local HTML file via `file:///path/to/file.html`. 2. Click the extension icon. | The popup displays: "Cookie management is not available for file:// pages." or shows any cookies that exist for the `file://` origin. No crash. | |
| E2.3 | `about:blank` | 1. Open a new tab (which may show `about:blank` or `chrome://newtab`). 2. Click the extension icon. | The popup displays: "No domain detected." or equivalent. No crash. No unhandled exceptions. | |
| E2.4 | Incognito mode | 1. Open an incognito window. 2. Ensure the extension is allowed in incognito (via `chrome://extensions` > Details > "Allow in Incognito"). 3. Navigate to a site and open the popup. | The popup uses the incognito cookie store (separate from regular). Only incognito-session cookies are displayed. Profiles and rules from the regular session are accessible. No data leaks from the regular cookie store into incognito. | |
| E2.5 | Multiple browser windows | 1. Open `example.com` in Window A and `github.com` in Window B. 2. Open the popup in Window A, then open the popup in Window B. 3. Edit a cookie in Window A. 4. Close and reopen the popup in Window B. | Each popup shows cookies for its own active tab. Edits in Window A do not appear in Window B's popup until it is closed and reopened (popups are independent instances). No data corruption from concurrent access. | |
| E2.6 | Extension update while popup open | 1. Open the popup. 2. Simulate an extension update by reloading the extension via `chrome://extensions` > "Reload". | The popup closes or becomes unresponsive. On reopening, data integrity is verified: profiles, rules, and settings remain intact. If a storage schema migration is needed, `chrome.runtime.onInstalled` with `reason: "update"` runs the migration before the popup accesses data. | |
| E2.7 | Offline mode (72-hour grace) | 1. Set `zovo_auth.tier` to `"pro"` in sync storage. 2. Disconnect from the network (disable Wi-Fi/Ethernet). 3. Open the popup and use Pro features. 4. Check the banner area for offline messaging. | Pro features remain available. A non-blocking banner appears: "Your subscription could not be verified. Features will remain available for 72 hours." The `license_cache.expires_at` timestamp is checked. After 72 hours offline, the extension reverts to free tier with a banner: "Please reconnect to verify your subscription." | |

### Test Suite E3: User Behavior Edge Cases

| Test ID | Test | Steps | Expected | Pass/Fail |
|---------|------|-------|----------|-----------|
| E3.1 | Rapid double-click on Save | 1. Expand a cookie detail. 2. Modify the value. 3. Double-click the Save button as fast as possible. | Only one `chrome.cookies.set()` call executes. The Save button disables immediately after the first click (debounce or disable pattern). No duplicate cookies. No error from a redundant API call. | |
| E3.2 | Paste 10KB string into cookie value | 1. Copy a 10KB string to the clipboard. 2. Expand a cookie detail. 3. Paste into the value field. | The input field accepts the string without freezing the popup. Performance remains responsive. If the user clicks Save, an error displays: "Cookie value exceeds the 4KB browser limit." The paste itself does not crash the extension. | |
| E3.3 | XSS attempt in cookie name | 1. Set a cookie name to `<script>alert(1)</script>` via `chrome.cookies.set({ url: 'https://example.com', name: '<script>alert(1)</script>', value: 'xss' })`. 2. Open the popup. | The cookie name renders as literal text: `<script>alert(1)</script>`. No script executes. No DOM injection. The name is escaped via Preact JSX interpolation (`{variable}`) or `textContent`. Repeat with `<img src=x onerror=alert(1)>` as the cookie value -- same result: literal text, no execution. | |
| E3.4 | Navigate away while popup is open | 1. Open the popup on `example.com`. 2. While the popup is open, navigate the active tab to `github.com`. | The popup either closes automatically (default Chrome behavior when navigating) or, if it remains open, refreshes to show cookies for `github.com`. No stale data from `example.com` is displayed for `github.com`. | |
| E3.5 | Keyboard-only navigation (full flow) | 1. Open the popup via keyboard (Alt+Shift+C or configured shortcut). 2. Tab to the search bar, type a query. 3. Tab to filter chips, press Enter to toggle one. 4. Tab to a cookie row, press Enter to expand. 5. Tab to the value field, modify it, Tab to Save, press Enter. 6. Tab to the delete button, press Enter, Tab to Confirm, press Enter. | Every element in the flow is reachable via Tab. Enter activates buttons and toggles. The focus order follows the visual layout (top to bottom, left to right). Focus rings are visible on every interactive element. The entire CRUD workflow is completable without a mouse. | |

---

## Step 5: Paywall Testing Procedures

### Test Suite PW1: Trigger Verification

| Test ID | Test | Steps | Expected | Pass/Fail |
|---------|------|-------|----------|-----------|
| PW1.1 | 3rd profile save triggers hard block | 1. Go to Profiles tab. 2. Save Profile #1 ("Admin Login"). Confirm counter shows "1/2 profiles used". 3. Save Profile #2 ("Guest User"). Confirm counter shows "2/2 profiles used" in danger red. 4. Attempt to save Profile #3. | Hard block modal appears with blurred background. Headline: "Pro found 2 profiles worth keeping." CTA: "Unlock Unlimited Profiles." Footer: "Includes 18+ Zovo tools. From $3/mo." The 3rd profile is NOT saved. The modal is dismissible via "Maybe later" or Escape key. | |
| PW1.2 | 2nd rule create triggers hard block | 1. Go to Rules tab. 2. Create Rule #1 with pattern `*.tracking.com`. Confirm counter shows "1/1 rule created". 3. Click "+ Add Rule" to create a 2nd. | Hard block modal appears. Headline: "Your first rule is already cleaning." Dynamic text shows "[X] cookies removed" count from the first rule's lifetime. CTA: "Automate Everything." Rule #2 is NOT created. | |
| PW1.3 | Export >25 cookies triggers soft banner | 1. Navigate to a site with 26+ cookies (or inject them). 2. Click "Export" > "JSON". | A soft inline banner appears below the export button: "Upgrade to export all cookies." Only the first 25 cookies are exported. The banner is dismissible. The downloaded file contains exactly 25 cookie objects. | |
| PW1.4 | Health score detail click triggers blur | 1. Go to the Health tab. 2. View the health score badge (visible for free tier). 3. Click on the risk breakdown panel. | The detail cards are blurred with `filter: blur(4px)`. An "Unlock Details" overlay appears on top of the blur. Clicking the overlay triggers a soft inline banner with upgrade CTA. The score letter grade (A-F) remains visible but the detailed breakdown is unreadable. | |
| PW1.5 | Regex search triggers inline hint | 1. In the Cookies tab search bar, type `/session.*/` (a regex pattern). 2. Alternatively, click the regex toggle icon (`.*`). | A soft inline banner appears below the search bar: "Regex search is a Pro feature." The regex is NOT executed. The search field reverts to literal text matching. Free-tier users see only basic substring matching. | |
| PW1.6 | Modal dismiss respects 48hr cooldown | 1. Trigger PW1.1 (3rd profile save). 2. Dismiss the modal via "Maybe later". 3. Record the time. 4. Immediately attempt to save a 3rd profile again. | The modal does NOT appear again within 48 hours of dismissal. The profile is still blocked (limit enforced), but no paywall interruption. After 48 hours, the modal reappears on the next attempt. Verify via `chrome.storage.local.onboarding.paywall_dismissals.T1`. | |
| PW1.7 | 3 dismissals converts to subtle badge | 1. Trigger and dismiss the T1 modal 3 times (waiting 48 hours between each, or manipulating the dismissal timestamps in storage for testing). 2. Trigger T1 a 4th time. | On the 4th trigger, no hard block modal appears. Instead, a soft inline banner appears (permanent switch for this trigger). The hard modal is permanently replaced. Verify the dismissal count in storage equals 3+. | |
| PW1.8 | CTA click opens correct URL | 1. Trigger any paywall modal. 2. Click the primary CTA button (e.g., "Unlock Unlimited Profiles"). | A new browser tab opens with URL: `https://zovo.app/signup?ref=cookie-manager&trigger=T1&plan=starter` (or `/upgrade` if an account exists). Query parameters include: `ref` (source extension), `trigger` (which paywall), `plan` (minimum tier required). The `paywall_clicked` analytics event fires. | |
| PW1.9 | Post-upgrade unlocks all Pro features | 1. Simulate upgrade: write `zovo_auth.tier: "pro"` to `chrome.storage.sync`. 2. Reopen the popup. | A confetti animation plays (1.9 seconds total). Lock icons fade out across all tabs. Blur treatment on Health details clears. Badge transitions from "FREE" to "PRO" (purple with gold accent). A welcome toast appears. All limits removed: unlimited profiles, unlimited rules, all export formats unlocked, regex search active, full health details visible. | |

---

## Step 6: Performance Testing Procedures

| Test | Method | Steps | Target | Critical Threshold |
|------|--------|-------|--------|--------------------|
| Popup open time | `performance.now()` | 1. Add `const t0 = performance.now()` at the first line of `popup/index.tsx`. 2. Add `console.log('Popup init:', performance.now() - t0)` after the first contentful paint (after the root component mounts). 3. Open popup on a domain with 50 cookies. 4. Record the time. Repeat 10 times. Take p95. | <100ms | <200ms |
| Cookie list render (100 cookies) | `requestAnimationFrame` timing | 1. Inject 100 cookies for a test domain. 2. Add timing around the cookie list render function: `const t0 = performance.now(); renderList(); requestAnimationFrame(() => console.log('Render:', performance.now() - t0))`. 3. Record timing. | <16ms (one frame) | <32ms (two frames) |
| Cookie list render (1000 cookies) | `requestAnimationFrame` timing | 1. Inject 1000 cookies. 2. Same measurement as above. 3. Verify virtualized scrolling is active (DOM should contain only ~20 visible rows, not 1000). | <32ms | <50ms |
| Search response latency | Input event to results update | 1. Open popup with 100+ cookies. 2. Add timing: measure from the `input` event handler start to the completion of the filtered list re-render. 3. Type a 4-character query. | <50ms | <100ms |
| Export 25 cookies | Click to file download | 1. Navigate to a site with 25 cookies. 2. Add timing around the export function: start on button click, end when `URL.createObjectURL()` or download initiation fires. | <100ms | <200ms |
| Memory (popup open, idle) | Chrome Task Manager | 1. Open popup on a typical site. 2. Open Chrome Task Manager (Shift+Esc). 3. Locate "Extension: Zovo Cookie Manager" row. 4. Record memory footprint after 10 seconds of idle. | <15MB | <30MB |
| Memory (500 cookies, active use) | Chrome Task Manager | 1. Inject 500 cookies. 2. Open popup. 3. Scroll through the list, search, expand several cookies. 4. Record peak memory in Task Manager after 2 minutes of active use. | <25MB | <50MB |
| Service worker wake time | `performance.now()` in event handler | 1. Let the service worker terminate (wait 30+ seconds idle). 2. Trigger a `chrome.tabs.onRemoved` event (close a tab). 3. Measure time from event dispatch to the first line of the handler execution. | <50ms | <100ms |

---

## Step 7: Error Documentation Template

For every error found during the execution of suites P1, B1, S1, E1-E3, PW1, and the performance benchmarks, file one entry using the following template.

```
ERROR-001
Severity: Critical | High | Medium | Low
Category: Functional | Performance | Security | UX
Test ID: [P1.x / B1.x / S1.x / E1.x / PW1.x / PERF-x]

Steps to Reproduce:
  1. [Exact step with specific inputs]
  2. [Exact step]
  3. [Exact step]

Expected:
  [What the spec says should happen, referencing the test table above]

Actual:
  [What actually happened, described precisely]

Console Output:
  [Paste the full error message, if any]

Stack Trace:
  [Paste the stack trace from DevTools, if available]

Environment:
  - Chrome: [version, e.g., 122.0.6261.112]
  - OS: [e.g., macOS 15.3, Windows 11 24H2, Ubuntu 24.04]
  - Extension version: [e.g., 1.0.0]
  - Tier: [Free / Starter / Pro]
  - Incognito: [Yes / No]

Screenshots / Video:
  [Attach or link to visual evidence]

Frequency:
  Always | Intermittent (X out of Y attempts) | Once

Suggested Fix:
  [If identifiable, describe the likely code change]

Code Location:
  src/[file path]:[line number]
```

**Severity Reference:**

| Severity | Definition | Response SLA | Examples |
|----------|-----------|--------------|---------|
| Critical | Data loss, security vulnerability, popup crash, complete feature failure | Fix within 4 hours, hotfix release within 24 hours | XSS executes in cookie display, cookies deleted without confirmation, popup white-screens on open |
| High | Feature partially broken, paywall bypass, incorrect data shown | Fix within 24 hours, release within 48 hours | Wrong cookie count in badge, profile fails to load, exported JSON malformed |
| Medium | UI glitch, minor functional issue, edge case failure | Fix within 1 week | Tooltip misaligned, filter chip stuck in active state, dark mode contrast issue on one element |
| Low | Cosmetic issue, non-blocking UX improvement | Schedule for next release | Typo in paywall copy, animation timing slightly off, icon alignment 1px off |

---

## Appendix A: Test Environment Setup

**Prerequisites for running all suites:**

1. Chrome Stable (latest), with Developer Mode enabled at `chrome://extensions`.
2. The extension loaded unpacked from the `dist/` directory.
3. A test domain with controllable cookies (e.g., a local Express server that sets 0, 1, 25, 26, 100, and 1000 cookies on demand).
4. Network throttling capability (Chrome DevTools > Network > Offline) for offline tests.
5. Access to `chrome://serviceworker-internals/` for service worker inspection.
6. Chrome Task Manager (Shift+Esc) for memory measurements.

**Quick cookie injection script (run in the service worker console):**

```javascript
// Inject N cookies for a test domain
async function injectCookies(domain, count) {
  for (let i = 0; i < count; i++) {
    await chrome.cookies.set({
      url: `https://${domain}`,
      name: `cookie_${i.toString().padStart(4, '0')}`,
      value: `value_${i}`,
      path: '/',
      secure: true,
      sameSite: 'lax'
    });
  }
  console.log(`Injected ${count} cookies for ${domain}`);
}

// Usage: injectCookies('testsite.com', 1000);
```

**Quick cleanup script:**

```javascript
async function clearCookies(domain) {
  const cookies = await chrome.cookies.getAll({ domain });
  for (const cookie of cookies) {
    await chrome.cookies.remove({
      url: `https://${domain}${cookie.path}`,
      name: cookie.name
    });
  }
  console.log(`Cleared ${cookies.length} cookies for ${domain}`);
}
```

## Appendix B: Adversarial Test Data

Use these cookie objects to verify XSS, injection, and encoding resilience across all suites:

```json
[
  { "name": "<script>alert(1)</script>", "value": "test", "domain": ".test.com", "path": "/" },
  { "name": "normal", "value": "<img src=x onerror=alert(1)>", "domain": ".test.com", "path": "/" },
  { "name": "'; DROP TABLE cookies; --", "value": "inject", "domain": ".test.com", "path": "/" },
  { "name": "unicode_test", "value": "\u0000\u001f\uffff", "domain": ".test.com", "path": "/" },
  { "name": "equals=in=name", "value": "semi;in;value", "domain": ".test.com", "path": "/" },
  { "name": "newline_val", "value": "line1\nline2\r\nline3", "domain": ".test.com", "path": "/" }
]
```

---

*This document defines 63 discrete runtime test procedures across 7 suites: 22 popup tests, 10 service worker tests, 8 storage tests, 16 edge case tests, 9 paywall tests, and 8 performance benchmarks, plus the error documentation template and test data appendices. Every procedure is step-by-step reproducible with a single Chrome instance and DevTools.*
