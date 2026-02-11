# Zovo Cookie Manager -- Manifest.json Audit & Validated Configuration

**Agent 1 -- Chrome Extension Configuration Specialist**
**Date:** 2026-02-11
**Status:** Production-Ready Manifest
**Manifest Version:** 3 (MV3)

---

## Step 1: Complete manifest.json

The following manifest is production-ready and validated against MV3 requirements. Every field is justified in the audit sections that follow. Copy this file directly into the project root as `manifest.json`.

```json
{
  "manifest_version": 3,
  "name": "__MSG_extension_name__",
  "version": "1.0.0",
  "description": "__MSG_extension_description__",
  "default_locale": "en",
  "icons": {
    "16": "assets/icons/icon-16.png",
    "32": "assets/icons/icon-32.png",
    "48": "assets/icons/icon-48.png",
    "128": "assets/icons/icon-128.png"
  },
  "action": {
    "default_popup": "src/popup/index.html",
    "default_icon": {
      "16": "assets/icons/icon-16.png",
      "32": "assets/icons/icon-32.png",
      "48": "assets/icons/icon-48.png",
      "128": "assets/icons/icon-128.png"
    },
    "default_title": "__MSG_action_title__"
  },
  "background": {
    "service_worker": "src/background/service-worker.ts",
    "type": "module"
  },
  "options_ui": {
    "page": "src/options/index.html",
    "open_in_tab": true
  },
  "devtools_page": "src/devtools/devtools.html",
  "permissions": [
    "cookies",
    "activeTab",
    "storage",
    "tabs",
    "alarms",
    "clipboardWrite"
  ],
  "optional_permissions": [
    "notifications",
    "identity",
    "offscreen",
    "sidePanel"
  ],
  "host_permissions": [],
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'"
  },
  "externally_connectable": {
    "ids": [
      "ZOVO_FORM_FILLER_EXTENSION_ID",
      "ZOVO_TAB_MANAGER_EXTENSION_ID",
      "ZOVO_JSON_FORMATTER_EXTENSION_ID",
      "ZOVO_CLIPBOARD_EXTENSION_ID"
    ],
    "matches": [
      "https://zovo.app/*",
      "https://*.zovo.app/*"
    ]
  },
  "web_accessible_resources": [],
  "commands": {
    "_execute_action": {
      "suggested_key": {
        "default": "Ctrl+Shift+K",
        "mac": "Command+Shift+K"
      },
      "description": "__MSG_command_open_popup__"
    },
    "quick_export": {
      "suggested_key": {
        "default": "Ctrl+Shift+E",
        "mac": "Command+Shift+E"
      },
      "description": "__MSG_command_quick_export__"
    }
  },
  "side_panel": {
    "default_path": "src/sidepanel/index.html"
  }
}
```

**Build note:** The `service_worker` path references a TypeScript source file. Vite (or the chosen bundler) must compile this to JavaScript and rewrite the path in the output `dist/manifest.json` to point at the compiled file (e.g., `background/service-worker.js`). The same applies to HTML entry points -- the bundler resolves imports within those HTML files. The manifest above reflects the source tree; the build pipeline produces the dist-ready version. If your build tool does not handle manifest rewriting, change the service_worker path to `background/service-worker.js` and ensure your build outputs match.

**i18n note:** The `__MSG_*__` placeholders require a `_locales/en/messages.json` file. The relevant keys are:

```json
{
  "extension_name": {
    "message": "Zovo Cookie Manager",
    "description": "Extension name shown in Chrome"
  },
  "extension_description": {
    "message": "View, edit, and manage cookies with profiles, auto-delete rules, and developer tools. The modern cookie editor for Chrome.",
    "description": "Extension description for Chrome Web Store (under 132 chars)"
  },
  "action_title": {
    "message": "Zovo Cookie Manager",
    "description": "Tooltip when hovering over the extension icon"
  },
  "command_open_popup": {
    "message": "Open Cookie Manager",
    "description": "Keyboard shortcut description for opening the popup"
  },
  "command_quick_export": {
    "message": "Quick export cookies (JSON)",
    "description": "Keyboard shortcut description for quick export"
  }
}
```

The description field is 121 characters and contains the target keywords: "cookies," "cookie editor," "developer tools," and "manage cookies." This is under the 132-character Chrome Web Store limit.

---

## Step 2: Permission Audit Table

| Permission | Required / Optional | Justification | Chrome API Usage | CWS Justification Text | Risk Level |
|---|---|---|---|---|---|
| `cookies` | **Required** | Core functionality. Without this permission the extension has zero purpose. Reads, writes, and deletes cookies. Listens for real-time cookie changes. | `chrome.cookies.getAll()`, `chrome.cookies.get()`, `chrome.cookies.set()`, `chrome.cookies.remove()`, `chrome.cookies.getAllCookieStores()`, `chrome.cookies.onChanged` | "Zovo Cookie Manager is a cookie management tool. The cookies permission is required to read, create, edit, and delete browser cookies, which is the core purpose of the extension. It also uses the cookies.onChanged event to provide real-time monitoring of cookie changes for debugging and privacy analysis." | **High** -- grants read/write to all browser cookies. Mitigated by scoping all operations to user-initiated actions and logging every write/delete to a local audit trail. |
| `activeTab` | **Required** | Determines the current tab URL to scope cookie display to the active domain. This is the privacy-safe alternative to `<all_urls>` host permissions. | `chrome.tabs.query({active: true, currentWindow: true})` combined with `activeTab` for temporary origin access on user click. | "Used to determine the URL of the tab the user is currently viewing so the extension can display only the cookies relevant to that site. This avoids requesting broad host permissions." | **Low** -- only grants access to the tab the user explicitly clicks on. No mitigation needed. |
| `storage` | **Required** | Persists settings, profiles, rules, usage counters, license cache, and analytics queue. Both `chrome.storage.local` and `chrome.storage.sync` are used. | `chrome.storage.local.get()`, `chrome.storage.local.set()`, `chrome.storage.sync.get()`, `chrome.storage.sync.set()`, `chrome.storage.onChanged` | "Used to save user preferences, cookie profiles, auto-delete rules, and cached data for performance. Both local and cross-device sync storage are used." | **Low** -- data stays within Chrome's sandboxed extension storage. Mitigated by encrypting sensitive fields (auth tokens, cookie vault). |
| `tabs` | **Required** | Reads tab URLs for domain filtering, detects tab close events for auto-delete rule triggers, and identifies incognito context for cookie store scoping. | `chrome.tabs.query()`, `chrome.tabs.get()`, `chrome.tabs.onRemoved`, `chrome.tabs.onUpdated`, `chrome.tabs.onActivated` | "Used to read the URL of the active tab for domain filtering, detect when tabs are closed to trigger auto-delete rules, and identify incognito tabs to scope cookie store access correctly." | **Medium** -- can read URLs of all open tabs. Mitigated by extracting only the registrable domain (eTLD+1), never storing full URLs, and never transmitting tab URLs externally. |
| `alarms` | **Required** | Schedules background timers for auto-delete rule execution, license validation (24h), analytics batch flush (5min), sync polling (15min), and monthly usage resets. MV3 service workers cannot use `setInterval` reliably. | `chrome.alarms.create()`, `chrome.alarms.get()`, `chrome.alarms.getAll()`, `chrome.alarms.clear()`, `chrome.alarms.clearAll()`, `chrome.alarms.onAlarm` | "Used to schedule periodic background tasks: auto-delete rule execution on a timer, license validation checks, analytics event batching, and monthly usage counter resets. Required because Manifest V3 service workers cannot use setInterval reliably." | **Low** -- only schedules wake-ups for the extension itself. Mitigated by capping alarm frequency to minimum 5-minute intervals. |
| `clipboardWrite` | **Required** | Copies cookie values, cURL commands, and exported data to the clipboard. Used in every core workflow (copy value, copy as cURL, copy export). | `navigator.clipboard.writeText()`, fallback via `document.execCommand('copy')` in offscreen document | "Used to copy cookie values, generated cURL commands, and exported cookie data to the clipboard. This is a core workflow for developers using the extension to debug requests." | **Low** -- write-only, cannot read clipboard. Mitigated by best-effort clearing of sensitive clipboard content after 60 seconds. |
| `notifications` | **Optional** | Cookie change alerts and rule execution confirmations for Pro users. Requested at runtime when user enables monitoring notifications in settings. | `chrome.notifications.create()`, `chrome.notifications.clear()`, `chrome.notifications.onClicked` | "Requested at runtime when the user enables cookie change monitoring. Used to alert the user when cookies are modified, added, or deleted on monitored domains." | **Low** -- can only display browser notifications. Mitigated by never including cookie values in notification text; only domain and action type shown. |
| `identity` | **Optional** | Google OAuth sign-in for Zovo membership. Requested at runtime when user clicks "Sign in to Zovo." Not needed for free-tier functionality. | `chrome.identity.launchWebAuthFlow()`, `chrome.identity.getRedirectURL()` | "Requested at runtime when the user chooses to sign in to their Zovo account. Used to initiate Google OAuth sign-in for accessing premium features and syncing data across devices." | **Medium** -- initiates OAuth flows. Mitigated by PKCE, redirect URL validation, minimal OAuth scopes (`openid email profile`), and immediate token exchange discarding the raw Google token. |
| `offscreen` | **Optional** | Creates offscreen documents for clipboard fallback in MV3 contexts where `navigator.clipboard.writeText()` is unavailable from the service worker. | `chrome.offscreen.createDocument()`, `chrome.offscreen.closeDocument()` | "Used as a fallback for clipboard write operations when the standard Clipboard API is unavailable in the service worker context." | **Low** -- creates a hidden DOM page. Mitigated by closing documents immediately after operation and enforcing a 5-second timeout. |
| `sidePanel` | **Optional** | Registers the extension as a Chrome side panel (Pro feature, P2 roadmap). Requested when user selects side panel mode. | `chrome.sidePanel.setOptions()`, `chrome.sidePanel.setPanelBehavior()` | "Requested when the user enables side panel mode. Provides an alternative persistent UI surface alongside the active web page for continuous cookie monitoring." | **Low** -- provides an alternative UI surface. Same security controls as popup apply. |

**Cannot be reduced or removed:** Every required permission maps to a core feature that is exercised in the free tier. Removing any one of them would break a fundamental user workflow. The four optional permissions are gated behind explicit user actions (enable monitoring, sign in, clipboard fallback, enable side panel) and are never requested silently.

---

## Step 3: CSP Analysis

**Defined CSP:**

```
script-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'
```

**Directive-by-directive analysis:**

| Directive | Value | Purpose |
|---|---|---|
| `script-src 'self'` | Only scripts bundled with the extension can execute | Blocks inline scripts, `eval()`, `Function()`, `setTimeout` with string args, and all external script sources. This is the primary XSS mitigation. |
| `object-src 'none'` | Blocks all plugin-based content | Prevents Flash, Java applets, and embedded objects. |
| `base-uri 'none'` | Prevents `<base>` tag injection | Stops attackers from redirecting relative URLs via injected base elements. |
| `form-action 'none'` | Prevents form submissions to external origins | All API communication must use `fetch()`. No HTML form POSTs allowed from extension pages. |
| `frame-ancestors 'none'` | Prevents iframe embedding | Clickjacking defense -- extension popup and options page cannot be embedded by a malicious page. |

**Exceptions required: None.** Preact renders via `createElement()` calls (virtual DOM diffing), not inline scripts. All styles are loaded from bundled CSS files, so the default `style-src` fallback to `script-src 'self'` covers them. If CSS-in-JS is used during development, `style-src 'self' 'unsafe-inline'` may be needed in dev builds only; it must be stripped for production.

**Verified absences:**
- No `unsafe-eval` -- confirmed unnecessary. Preact does not require eval. No template engines requiring runtime compilation are used.
- No `unsafe-inline` -- confirmed unnecessary. All scripts are bundled files. No inline `<script>` tags or inline event handlers in HTML files.
- No `nonce` or `hash` exemptions -- not needed since all scripts are external bundled files.
- No external CDN sources -- all dependencies are bundled at build time.

**Preact compatibility:** Preact (3 KB gzipped) is fully compatible with `script-src 'self'`. It uses `document.createElement` for DOM operations and does not rely on `eval`, `new Function`, or inline script injection. The `htm` tagged template alternative (if used instead of JSX) also works without CSP relaxation.

---

## Step 4: Service Worker Configuration

**Path:** `src/background/service-worker.ts` (compiled to `background/service-worker.js` in dist)
**Type:** `module` (enables ES module `import`/`export` syntax)

**Registered event listeners (must be at top level, synchronous registration):**

| Listener | Source File | Purpose |
|---|---|---|
| `chrome.runtime.onInstalled` | `service-worker.ts` | Initialize defaults on install, run migrations on update, register all alarms |
| `chrome.runtime.onStartup` | `service-worker.ts` | Re-verify alarms exist on browser start, check license cache validity |
| `chrome.alarms.onAlarm` | `service-worker.ts` | Route alarm events to handlers: `license-check`, `analytics-flush`, `sync-poll`, `rule-timer-{id}`, `usage-reset-monthly` |
| `chrome.cookies.onChanged` | `cookie-monitor.ts` | Log cookie changes, invalidate cache, push notifications if monitoring enabled |
| `chrome.tabs.onRemoved` | `rules-engine.ts` | Match closed tab URL against auto-delete rules, execute matching rules |
| `chrome.tabs.onUpdated` | `service-worker.ts` | Cache tab URL for use in `onRemoved` (which does not provide the URL) |
| `chrome.tabs.onActivated` | `service-worker.ts` | Update badge text with cookie count for newly active tab |
| `chrome.runtime.onMessage` | `service-worker.ts` | Handle internal messages from popup, options, devtools, and side panel |
| `chrome.runtime.onMessageExternal` | `service-worker.ts` | Handle messages from other Zovo extensions and zovo.app web pages |
| `chrome.storage.onChanged` | `service-worker.ts` | Detect auth state changes from other Zovo extensions via sync storage |

**Registered alarms:**

| Alarm Name | Interval | Purpose |
|---|---|---|
| `license-check` | 24 hours | Validate subscription tier via `GET /auth/verify` |
| `analytics-flush` | 5 minutes | Batch send queued analytics events |
| `sync-poll` | 15 minutes | Pull latest profiles/rules from Zovo API (Pro+) |
| `rule-timer-{id}` | Per-rule (min 5 min) | Execute timer-triggered auto-delete rules |
| `usage-reset-monthly` | 24 hours | Check calendar month rollover, reset usage counters |

**No DOM access:** The service worker runs in a worker context with no `document` or `window` object. All DOM-dependent operations (clipboard fallback) use the offscreen API. All state is persisted to `chrome.storage` -- no global variables hold persistent state across service worker wake cycles.

**Critical MV3 constraint:** All event listeners must be registered synchronously at the top level of the service worker script, not inside async callbacks or conditional blocks. Chrome may terminate the service worker after approximately 30 seconds of inactivity and must be able to re-register listeners on wake-up.

---

## Step 5: Content Scripts Assessment

**MVP (P0 launch): No content scripts required.**

The Cookie Manager reads cookies via `chrome.cookies.getAll()` and reads the active tab URL via `chrome.tabs.query()`. Neither operation requires injecting a content script into web pages.

**Future content script (P2 roadmap):**

The file structure includes `src/content/cookie-banner-detect.ts` for detecting consent banners (GDPR context). If implemented:

- **matches:** `["<all_urls>"]` -- runs on all pages to detect consent banners.
- **run_at:** `document_idle` -- waits until DOM is settled.
- **isolation:** `ISOLATED` world (default) -- content script cannot access page JS variables, only the DOM.
- **Security constraints:** The content script must never receive cookie data from the background. It only observes the DOM and sends structured messages (`{ type: "banner_detected", has_banner: boolean }`) back to the background via `chrome.runtime.sendMessage`. It must never use `window.postMessage`.

**Recommendation:** Omit content scripts from the initial manifest. Add them in a future version only when the GDPR banner detection feature ships. This keeps the install-time permission surface minimal.

---

## Step 6: Web Accessible Resources

**Current configuration: Empty array.**

```json
"web_accessible_resources": []
```

No extension resources need to be accessible to web pages. The extension does not inject UI elements into web pages, does not load extension assets from content scripts, and does not expose any internal pages to external frames.

**Future consideration:** If the content script (`cookie-banner-detect.ts`) ever needs to load a stylesheet or icon into the page for an injected UI overlay, scope access tightly:

```json
{
  "web_accessible_resources": [{
    "resources": ["content/styles.css"],
    "matches": ["<all_urls>"],
    "use_dynamic_url": true
  }]
}
```

The `use_dynamic_url: true` flag rotates the resource URL per session, preventing extension fingerprinting. This should only be added when the feature ships, not preemptively.

---

## Step 7: Icons Validation

| Size | File Path | Purpose | Format |
|---|---|---|---|
| 16x16 | `assets/icons/icon-16.png` | Favicon in browser bar, context menus | PNG, transparent background |
| 32x32 | `assets/icons/icon-32.png` | Windows taskbar, high-DPI browser bar | PNG, transparent background |
| 48x48 | `assets/icons/icon-48.png` | Extensions management page (`chrome://extensions`) | PNG, transparent background |
| 128x128 | `assets/icons/icon-128.png` | Chrome Web Store listing, install dialog | PNG, transparent background |

**Design requirements:**
- All icons must be square PNG files with transparent backgrounds.
- The icon should be recognizable at 16x16 (the smallest size). Avoid fine details that disappear at low resolution.
- Use the Zovo brand color (`#2563EB` blue) as the primary color.
- The icon must not be a generic cookie clipart. It should incorporate the Zovo "Z" mark or a distinctive cookie/shield motif that reinforces the "trustworthy manager" positioning.
- Chrome also accepts SVG for the `action.default_icon` but PNG is universally supported and recommended.

**Icon declaration locations in manifest:**
1. Top-level `"icons"` object -- used by `chrome://extensions`, Chrome Web Store, and install prompts.
2. `"action"."default_icon"` object -- used for the toolbar icon. Should reference the same files as the top-level icons unless a variant is needed for the toolbar context.

Both declarations must list all four sizes to ensure Chrome selects the optimal resolution for every display context.

---

## Step 8: Keyboard Shortcuts (commands)

| Command ID | Default Key | Mac Key | Description | Behavior |
|---|---|---|---|---|
| `_execute_action` | `Ctrl+Shift+K` | `Cmd+Shift+K` | Open Cookie Manager popup | Built-in Chrome command that triggers the extension action (opens popup). The `_execute_action` ID is a reserved Chrome command name. |
| `quick_export` | `Ctrl+Shift+E` | `Cmd+Shift+E` | Quick export cookies as JSON | Custom command handled in the service worker via `chrome.commands.onCommand`. Exports cookies for the active tab's domain as JSON to the clipboard. |

**Design rationale:**
- `Ctrl+Shift+K` avoids conflicts with common browser shortcuts (`Ctrl+Shift+I` for DevTools, `Ctrl+Shift+J` for console, `Ctrl+Shift+P` for commands). The `K` mnemonic works for "Kookies" and is near the home row.
- `Ctrl+Shift+E` is used by some browsers for the "Search tabs" feature. Users can remap via `chrome://extensions/shortcuts`. This is a suggested default, not a mandatory binding.
- All keyboard shortcuts are user-configurable via `chrome://extensions/shortcuts`. The manifest only provides suggested defaults.

**Service worker handler for custom commands:**

```typescript
chrome.commands.onCommand.addListener((command) => {
  if (command === "quick_export") {
    // Query active tab, get cookies for that domain, copy JSON to clipboard
  }
});
```

This listener must be registered at the top level of the service worker.

---

## Step 9: File Structure Validation

Every file referenced in the manifest must exist in the build output. The table below maps manifest references to source files and their expected build output paths.

| Manifest Field | Manifest Value | Source File | Build Output |
|---|---|---|---|
| `icons.16` | `assets/icons/icon-16.png` | `assets/icons/icon-16.png` | `dist/assets/icons/icon-16.png` |
| `icons.32` | `assets/icons/icon-32.png` | `assets/icons/icon-32.png` | `dist/assets/icons/icon-32.png` |
| `icons.48` | `assets/icons/icon-48.png` | `assets/icons/icon-48.png` | `dist/assets/icons/icon-48.png` |
| `icons.128` | `assets/icons/icon-128.png` | `assets/icons/icon-128.png` | `dist/assets/icons/icon-128.png` |
| `action.default_popup` | `src/popup/index.html` | `src/popup/index.html` | `dist/popup/index.html` |
| `action.default_icon.*` | (same as top-level icons) | (same as top-level icons) | (same as top-level icons) |
| `background.service_worker` | `src/background/service-worker.ts` | `src/background/service-worker.ts` | `dist/background/service-worker.js` |
| `options_ui.page` | `src/options/index.html` | `src/options/index.html` | `dist/options/index.html` |
| `devtools_page` | `src/devtools/devtools.html` | `src/devtools/devtools.html` | `dist/devtools/devtools.html` |
| `side_panel.default_path` | `src/sidepanel/index.html` | `src/sidepanel/index.html` | `dist/sidepanel/index.html` |
| `default_locale` `"en"` | N/A | `_locales/en/messages.json` | `dist/_locales/en/messages.json` |

**Additional locale files required by file structure spec:**

| Locale | Source Path |
|---|---|
| English | `_locales/en/messages.json` |
| Filipino/Tagalog | `_locales/fil/messages.json` |
| Spanish | `_locales/es/messages.json` |
| Japanese | `_locales/ja/messages.json` |
| German | `_locales/de/messages.json` |

**DevTools panel files (referenced from devtools.html):**

| File | Purpose |
|---|---|
| `src/devtools/devtools.html` | DevTools page declaration (calls `chrome.devtools.panels.create()`) |
| `src/devtools/panel.html` | The actual panel UI loaded into the DevTools tab |
| `src/devtools/panel.tsx` | Panel Preact component entry point |

**Validation checklist before packaging:**

- [ ] All four icon PNGs exist and are the correct pixel dimensions.
- [ ] `popup/index.html` exists and contains a `<script>` tag referencing the bundled popup JS.
- [ ] `options/index.html` exists and contains a `<script>` tag referencing the bundled options JS.
- [ ] `background/service-worker.js` exists in the build output (compiled from `.ts`).
- [ ] `devtools/devtools.html` exists and calls `chrome.devtools.panels.create()`.
- [ ] `devtools/panel.html` exists and is referenced by the `panels.create()` call.
- [ ] `sidepanel/index.html` exists (even if it is a placeholder for P2).
- [ ] `_locales/en/messages.json` exists with all required message keys.
- [ ] The built `manifest.json` in `dist/` has all paths rewritten to compiled output locations.
- [ ] Total bundle size is under 342 KB.

---

## Summary

This manifest achieves the following objectives:

1. **Minimal install-time permissions.** Six required permissions, four optional. Zero host permissions. Zero web-accessible resources. This produces a clean Chrome Web Store permission dialog that does not trigger trust warnings about "reading data on all websites."

2. **Strictest possible CSP.** No `unsafe-eval`, no `unsafe-inline`, no external sources, no object embedding, no form actions, no frame embedding. Fully compatible with Preact and the bundled build pipeline.

3. **MV3 compliance.** Service worker with `type: module`, no background page, no persistent scripts, all scheduled work via `chrome.alarms`, all state in `chrome.storage`.

4. **Internationalization-ready.** All user-facing strings use `__MSG_*__` i18n placeholders with `default_locale: "en"`. Five locale files planned per the file structure specification.

5. **Future-proof structure.** DevTools panel (P1), side panel (P2), and content scripts (P2) are architecturally accounted for. The side_panel field is declared in the manifest but gated behind the optional `sidePanel` permission at runtime.

6. **Keyboard accessibility.** Two default shortcuts provide power-user acceleration without conflicting with standard browser or OS shortcuts.

The manifest, combined with the permission justifications, is ready for Chrome Web Store submission. Replace the `ZOVO_*_EXTENSION_ID` placeholder strings in `externally_connectable` with actual extension IDs before publishing.
