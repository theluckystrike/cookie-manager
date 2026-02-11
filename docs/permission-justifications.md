# Permission Justifications

> Chrome Web Store review reference for Cookie Manager.
> Each permission lists its code usage, necessity, scope limits, and store justification text.

---

## `cookies`

**What it's used for:**
Core extension functionality. The `chrome.cookies` API is used to read, create, update, and delete browser cookies for the active site and across all domains.

- `chrome.cookies.getAll({ domain })` -- retrieve cookies for a domain (`service-worker.js` CookieOps.getAll, `src/utils/cookies.js` CookieManager.getAll/getAllGlobal)
- `chrome.cookies.set()` -- create or update a cookie (`service-worker.js` CookieOps.set)
- `chrome.cookies.remove()` -- delete a cookie (`service-worker.js` CookieOps.remove, CookieOps.clearDomain)
- `chrome.cookies.onChanged` -- listener for real-time cookie change logging (`service-worker.js` line 465)

**Why it's required:** This is a cookie management tool. Without the `cookies` permission there is no way to read or modify cookies programmatically; `document.cookie` cannot access HttpOnly cookies and only works in content scripts, not in the popup or service worker.

**What we DON'T do:** We never transmit cookie data to any external server. All data stays local. We do not inject cookies into pages or use cookies for tracking users.

**Store justification:**
> Cookie Manager requires the "cookies" permission to provide its core functionality: viewing, editing, creating, exporting, and deleting browser cookies. Without this permission the extension cannot function. No cookie data is ever transmitted externally.

---

## `activeTab`

**What it's used for:**
Determines the current tab's URL so the popup can display cookies scoped to the active site.

- `chrome.tabs.query({ active: true, currentWindow: true })` -- called in `popup.js` init() (line 237) to get the current tab URL and extract the hostname for domain-filtered cookie display.

**Why it's required:** The popup must know which site the user is on to show relevant cookies. `activeTab` is the minimum-privilege way to access the current tab's URL only when the user explicitly opens the popup.

**What we DON'T do:** We do not inject scripts, read page content, or access tabs beyond the single active tab. We never access tab content or URLs in the background without user action.

**Store justification:**
> The "activeTab" permission is used solely to read the current tab's URL when the user opens the popup, so we can display cookies for the active website. No page content is accessed.

---

## `storage`

**What it's used for:**
Persists user preferences and operational data locally via `chrome.storage.local` and `chrome.storage.session`.

- **User settings:** readOnlyMode, protectedDomains, theme, sort preferences (`service-worker.js` getSettings, `src/utils/storage.js`, `storage-schema.js`)
- **Monitoring data:** errorLogs, analytics events, debugMode, startupHistory, popupLoadTimes (`service-worker.js` storeErrorLog, recordStartupTimestamp, trackEvent)
- **Schema management:** _schemaVersion and migrations (`storage-schema.js`)
- **Session state:** SW lifecycle metadata via `chrome.storage.session` (`sw-lifecycle.js`)

**Why it's required:** Extension settings and diagnostic data must survive browser restarts. `localStorage` is unavailable in MV3 service workers. `chrome.storage.local` is the only persistent storage API available.

**What we DON'T do:** We never use `chrome.storage.sync` to push data to Google's servers. All storage is local-only. We do not store cookie values in storage -- cookies are always read live from the cookies API.

**Store justification:**
> The "storage" permission stores user preferences (read-only mode, protected domains, theme) and local diagnostic logs. All data is local-only; nothing is synced or transmitted externally.

---

## `contextMenus`

**What it's used for:**
Adds two right-click context menu items for quick access:

- "Clear cookies for this site" -- clears all cookies for the current page's domain (`service-worker.js` setupContextMenu, line 396; onClicked handler, line 425)
- "Open Cookie Manager" -- opens the extension popup (`service-worker.js` line 455)

**Why it's required:** `chrome.contextMenus.create()` requires this permission. There is no alternative API for right-click menu integration.

**What we DON'T do:** We do not add context menu items to links, images, or selections. Menus appear only on page context. We do not collect any data about which pages the menu is shown on.

**Could this be optional?** Yes. This is a convenience feature, not core functionality. It could be moved to `optional_permissions` and enabled via a settings toggle. **Recommendation: move to `optional_permissions` in a future release.**

**Store justification:**
> The "contextMenus" permission provides a right-click option to quickly clear cookies for the current site and to open the extension, giving users faster access to core functionality.

---

## `notifications`

**What it's used for:**
Displays a system notification after cookies are cleared via the context menu, confirming the action and showing the count of removed cookies.

- `chrome.notifications.create()` -- called in `service-worker.js` context menu handler (lines 435, 446) for both the success case and the read-only mode warning.

**Why it's required:** When clearing cookies from the context menu, the popup is not open, so there is no UI to show feedback. System notifications are the only way to confirm the action completed.

**What we DON'T do:** We never show promotional, recurring, or unsolicited notifications. Notifications fire only as a direct, immediate response to a user-initiated context menu action.

**Could this be optional?** Yes. This permission is only needed when `contextMenus` is active. If context menus are made optional, notifications should follow. **Recommendation: move to `optional_permissions` alongside `contextMenus`.**

**Store justification:**
> The "notifications" permission displays a brief confirmation after the user clears cookies via the right-click menu. Notifications are never unsolicited and only appear as direct feedback to user actions.

---

## `alarms`

**What it's used for:**
Schedules periodic background maintenance tasks that run even when the popup is closed.

- `chrome.alarms.create('sw-maintenance', { periodInMinutes: 15 })` -- built-in maintenance alarm in `sw-lifecycle.js` (line 83) that trims errorLogs and analytics arrays to prevent unbounded storage growth.
- `SwLifecycle.registerAlarm('maintenance', 30, ...)` -- additional maintenance alarm registered in `service-worker.js` (line 111) for the same trimming purpose.
- `chrome.alarms.onAlarm.addListener()` -- central dispatcher in `sw-lifecycle.js` (line 80).

**Why it's required:** MV3 service workers are terminated after ~30 seconds of inactivity. `setInterval` does not survive termination. `chrome.alarms` is the only reliable way to schedule periodic tasks in MV3.

**What we DON'T do:** We do not use alarms to wake the service worker for tracking, network requests, or any form of data exfiltration. Alarms exclusively perform local storage housekeeping.

**Could this be optional?** No. Without periodic maintenance, error logs and analytics arrays would grow unbounded, eventually hitting the 5 MB storage quota and breaking the extension.

**Store justification:**
> The "alarms" permission runs periodic local storage maintenance (trimming diagnostic logs) required by the MV3 service worker architecture. No network requests or external communication occurs.

---

## `host_permissions: <all_urls>`

**What it's used for:**
Grants the `chrome.cookies` API access to cookies on all domains, which is required for a general-purpose cookie manager.

- Every call to `chrome.cookies.getAll()`, `.set()`, `.remove()`, and `.get()` requires host permission for the cookie's domain.
- Without `<all_urls>`, the extension could only manage cookies for a hardcoded list of domains, which would defeat the core purpose.

**Why it's required:** The Chrome cookies API enforces host permissions per-domain. A cookie manager must be able to operate on any website the user visits. There is no narrower permission that achieves this.

**What we DON'T do:** We do not inject content scripts, modify page content, intercept network requests, or read page DOM on any site. The host permission is used exclusively for the cookies API. We make zero network requests to any URL.

**Store justification:**
> Cookie Manager requires host access to all URLs because the chrome.cookies API enforces per-domain host permissions. As a general-purpose cookie manager, the extension must read and modify cookies on any domain the user visits. No content scripts are injected, no page content is read, and no network requests are made. The permission is used solely for cookie API access.

---

## Optional Permissions Audit

| Permission | Currently | Recommendation | Rationale |
|---|---|---|---|
| `cookies` | Required | Keep required | Core functionality; extension is useless without it |
| `activeTab` | Required | Keep required | Needed on every popup open; prompting would add friction |
| `storage` | Required | Keep required | Settings and diagnostics must always persist |
| `contextMenus` | Required | **Move to optional** | Convenience feature; can be enabled in settings |
| `notifications` | Required | **Move to optional** | Only used by context menu; should follow contextMenus |
| `alarms` | Required | Keep required | MV3 maintenance is essential for stability |
| `<all_urls>` | Required | Keep required | Cookies API requires per-domain host permission |

Moving `contextMenus` and `notifications` to `optional_permissions` would reduce the install-time permission prompt and signal minimal data access to reviewers. Users who want the right-click feature can enable it in settings.
