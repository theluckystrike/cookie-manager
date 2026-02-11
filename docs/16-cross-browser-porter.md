# MD 16 — Cross-Browser Porter
## Cookie Manager — Phase 16 Complete

**Date:** February 2026 | **Status:** Complete
**Extension:** Cookie Manager v1.0.0

---

## Overview

Phase 16 makes Cookie Manager portable across Chrome, Firefox, Edge, and Safari. It introduces a browser detection and capability layer, a unified API abstraction that normalizes differences between browser extension namespaces, alternate manifests for Firefox, a zero-dependency Node.js build script that produces per-browser ZIPs, and a GitHub Actions CI/CD pipeline that builds all targets on every push.

## Files Created

| File | Lines | Purpose |
|------|-------|---------|
| `src/shared/browser-compat.js` | ~245 | Browser detection, feature probing, capability/limitation reporting |
| `src/shared/cross-browser-api.js` | ~220 | Unified API abstraction layer with promise wrapping and fallbacks |
| `manifests/base.json` | ~30 | Shared base manifest properties (name, version, permissions, icons) |
| `manifests/firefox.json` | ~20 | Firefox-specific manifest overrides (gecko ID, background scripts) |
| `scripts/build.js` | ~120 | Multi-browser build script (Node built-ins only, no dependencies) |
| `.github/workflows/build.yml` | ~80 | GitHub Actions workflow for CI builds, artifacts, and tagged releases |

## Browser Compatibility Matrix

| API Used by Cookie Manager | Chrome | Firefox | Edge | Safari |
|----------------------------|--------|---------|------|--------|
| `cookies.getAll/set/remove` | Full | Full | Full | Full |
| `storage.local` | Full | Full | Full | Full |
| `storage.session` | Full | 115+ | 102+ | Fallback to local |
| `contextMenus` | Full | Via `menus` alias | Full | Limited |
| `notifications.create` | Full | Full | Full | Requires macOS permission |
| `alarms` | Full | Full | Full | Full |
| `action.setBadgeText` | MV3 | MV3 | MV3 | MV3 |
| `browserAction.setBadgeText` | MV2 | MV2 | MV2 | N/A |
| `tabs.query/sendMessage` | Full | Full | Full | Full |
| `runtime.sendMessage` | Full | Full | Full | Full |
| Service Worker background | MV3 | MV3 (120+) | MV3 | Not supported |

## BrowserCompat Module

`src/shared/browser-compat.js` provides zero-dependency browser detection that works in both service worker and popup contexts.

**Detection strategy:** User-agent parsing in specificity order (Brave > Vivaldi > Opera > Edge > Firefox > Safari > Chrome) with a `navigator.brave` async API check for Brave. Results are cached after first call.

| Method | Returns | Description |
|--------|---------|-------------|
| `getBrowser()` | string | `'chrome'`, `'firefox'`, `'edge'`, `'brave'`, `'opera'`, `'vivaldi'`, `'safari'`, `'unknown'` |
| `getManifestVersion()` | number | `2` or `3` (reads from `runtime.getManifest()`) |
| `getNamespace()` | object | Returns `browser` (Firefox) or `chrome` global |
| `hasAPI(path)` | boolean | Dot-path probe, e.g. `hasAPI('cookies.getAll')` |
| `getCapabilities()` | object | Map of all APIs to `true`/`false` availability |
| `getLimitations()` | string[] | Known limitations for the detected browser |
| `isChromium()` | boolean | `true` for Chrome, Edge, Brave, Opera, Vivaldi |
| `getInfo()` | object | Full report: browser, version, manifest, namespace, capabilities, limitations |

## CrossBrowserAPI Module

`src/shared/cross-browser-api.js` exposes a single `CrossBrowserAPI` object with sub-namespaces that mirror the Chrome API surface. All methods return Promises regardless of browser.

**Key adaptations:**

- **Namespace resolution** -- Uses `browser.*` (Firefox) when available, falls back to `chrome.*`.
- **Promise wrapping** -- Chromium callback-based APIs are wrapped in Promises so callers can use `await`.
- **Safari `storage.session` fallback** -- When `storage.session` is unavailable, reads/writes are transparently redirected to `storage.local` with a `__session_` key prefix.
- **Firefox MV2 `browserAction` fallback** -- If `action` is undefined but `browserAction` exists, badge calls route through `browserAction.setBadgeText` and `setBadgeBackgroundColor`.
- **Firefox `contextMenus` alias** -- Routes through `browser.menus` when `contextMenus` is absent.

**Sub-namespaces:** `cookies`, `storage`, `notifications`, `contextMenus`, `alarms`, `action`, `runtime`, `tabs`.

## Build System

`scripts/build.js` is a zero-dependency Node.js script that uses only `fs`, `path`, and `child_process`.

```bash
# Build for a single browser
node scripts/build.js chrome
node scripts/build.js firefox
node scripts/build.js edge

# Build all targets
node scripts/build.js all
```

**Build steps per target:**

1. Clean `dist/{browser}/` output directory.
2. Copy all source files (`src/`, `_locales/`, icons).
3. Merge `manifests/base.json` with `manifests/{browser}.json` (if it exists) to produce the final `manifest.json`. Chrome and Edge use the base manifest as-is.
4. Package the output directory into `dist/{browser}.zip`.

## CI/CD Pipeline

`.github/workflows/build.yml` runs on every push and pull request to `main`.

| Step | Action |
|------|--------|
| Checkout | `actions/checkout@v4` |
| Setup Node | `actions/setup-node@v4` (Node 20) |
| Build all browsers | `node scripts/build.js all` |
| Upload artifacts | `actions/upload-artifact@v4` -- one artifact per browser ZIP |
| Release (tags only) | On `v*` tags, creates a GitHub Release and attaches all ZIPs |

## Firefox Porting Notes

- **Manifest:** `manifests/firefox.json` adds `browser_specific_settings.gecko.id` (required for AMO) and overrides the `background` key to use `scripts` instead of `service_worker` on MV2 builds.
- **Namespace:** Firefox uses the `browser.*` global which returns Promises natively. `CrossBrowserAPI` handles this transparently.
- **`contextMenus`:** Firefox exposes this as `browser.menus`; the abstraction layer routes accordingly.
- **`storage.session`:** Available only in Firefox 115+. The build targets Firefox 109+ (first MV3 support), so the fallback path may activate on older versions.

## Safari Porting Notes

- **Xcode required:** Safari Web Extensions must be wrapped in a native macOS/iOS app using Xcode's "Convert Web Extension" tool.
- **App Store submission:** Requires an Apple Developer account ($99/year), App Review, and a signed `.app` bundle.
- **`storage.session`:** Not supported; `CrossBrowserAPI` falls back to `storage.local` with prefixed keys.
- **Service Workers:** Not supported for extensions; Safari uses non-persistent background pages.
- **Notifications:** Require explicit macOS notification permission from the user.
- **`contextMenus`:** Limited support; some menu contexts (e.g., `browser_action`) are unavailable.

## Store Submission Guide

| Store | URL | Package | Review Time | Notes |
|-------|-----|---------|-------------|-------|
| Chrome Web Store | [developer.chrome.com](https://developer.chrome.com/docs/webstore) | `dist/chrome.zip` | 1--3 days | $5 one-time fee |
| Firefox AMO | [addons.mozilla.org](https://addons.mozilla.org/developers/) | `dist/firefox.zip` | 1--5 days | Free; source upload may be requested |
| Edge Add-ons | [partner.microsoft.com](https://partner.microsoft.com/dashboard/microsoftedge/) | `dist/edge.zip` | 1--7 days | Free; Microsoft account required |
| Apple App Store | [developer.apple.com](https://developer.apple.com/) | Xcode `.app` | 1--7 days | $99/year; macOS + iOS builds separate |

## Testing Checklist

- [ ] Popup opens and renders correctly (all browsers)
- [ ] `cookies.getAll` returns cookies for the active tab domain
- [ ] `cookies.set` creates/updates a cookie with correct attributes
- [ ] `cookies.remove` deletes the target cookie
- [ ] `storage.local` persists data across extension restart
- [ ] `storage.session` stores ephemeral data (or falls back on Safari)
- [ ] Context menu items appear on right-click
- [ ] Notifications display on cookie operations
- [ ] Alarms fire for scheduled cookie cleanup
- [ ] Badge text updates with cookie count
- [ ] All 6 locales render correctly (en, es, de, fr, ja, pt_BR)
- [ ] Build script produces valid ZIP for each target
- [ ] Each ZIP installs and loads without errors in its target browser

## Integration Notes

All Phase 16 modules are **additive** -- no existing files are modified. Integration points:

- **`browser-compat.js`** can be loaded via `<script>` in `popup/index.html` or `importScripts()` in the service worker. It exposes `BrowserCompat` on the global scope.
- **`cross-browser-api.js`** depends on `browser-compat.js` and must load after it. Existing code can migrate from `chrome.cookies.getAll(...)` to `CrossBrowserAPI.cookies.getAll(...)` incrementally -- both work simultaneously.
- **Build script** operates on the existing source tree and outputs to `dist/`. It does not alter `src/` or the root `manifest.json`.
- **CI/CD** triggers automatically with no configuration changes to the repository beyond the workflow file.

Migration is optional and non-breaking: the extension continues to work as a Chrome-only extension without importing either module.

---

*Phase 16 -- Cross-Browser Porter -- Complete*
*Part of Cookie Manager by Zovo (https://zovo.one)*
