# Zovo Cookie Manager -- Final QA Report, Regression Checklist & CWS Readiness

**Agent:** QA Lead (Agent 5 -- Final Validation)
**Date:** 2026-02-11
**Extension Version:** 1.0.0
**Status:** PRE-SUBMISSION VALIDATION
**Scope:** Clean build checklist, full regression suite, cross-platform matrix, performance validation, security review, CWS readiness, debug reference

---

## Step 1: Clean Build Checklist

Every item must be verified before the production `.zip` is packaged. A single unchecked item blocks submission.

| # | Check | Status | Verified By | Notes |
|---|-------|--------|-------------|-------|
| CB-01 | All `console.log` replaced with production logger or stripped by build | | | grep `src/` for `console.log`; allow only in `logger.ts` |
| CB-02 | All `console.warn` / `console.error` routed through production logger | | | Logger must redact cookie values and auth tokens |
| CB-03 | All `debugger` statements removed | | | `grep -r "debugger" src/` returns zero results |
| CB-04 | All `TODO` / `FIXME` / `HACK` comments converted to GitHub issues | | | Record issue numbers here: ________________ |
| CB-05 | All commented-out code blocks removed | | | Multi-line comments containing code are dead weight |
| CB-06 | Test files excluded from production build | | | Verify `dist/` contains zero `*.test.*` or `*.spec.*` files |
| CB-07 | Source maps NOT included in `.zip` package | | | Keep `.map` files in a separate archive for error tracking |
| CB-08 | `DEBUG` / `DEV` flags set to `false` in build config | | | Check Vite `define` replacements |
| CB-09 | Version number in `manifest.json` is `1.0.0` | | | Must match CHANGELOG and package.json |
| CB-10 | `CHANGELOG.md` updated with v1.0.0 release notes | | | |
| CB-11 | Production build completes with zero errors and zero warnings | | | `npm run build` exit code 0, clean stdout |
| CB-12 | Bundle size verified: total < 342KB | | | Measured: ____KB. Breakdown: popup ____KB, background ____KB, options ____KB, shared ____KB, assets ____KB |
| CB-13 | No dev dependencies in production bundle | | | Run `npx webpack-bundle-analyzer` or check Vite output for `devDependencies` leaks |
| CB-14 | `node_modules` not included in package | | | `.zip` contains only `dist/` contents and `manifest.json` |
| CB-15 | All file paths in `manifest.json` resolve to existing files in `dist/` | | | Verify every `js`, `css`, `html`, and icon path |
| CB-16 | `package-lock.json` committed with pinned versions | | | `npm ci` reproduces the exact build |
| CB-17 | `npm audit` reports zero critical or high vulnerabilities | | | Run `npm audit --production` |
| CB-18 | No `http://` URLs in source code (must be `https://`) | | | `grep -r "http://" src/` returns zero results (exclude comments/docs) |

---

## Step 2: Full Regression Test Report

```
=========================================================
  ZOVO COOKIE MANAGER -- REGRESSION TEST REPORT v1.0.0
=========================================================

Date:            [YYYY-MM-DD]
Tester:          [NAME]
Chrome Version:  [e.g., 133.0.6943.XX]
OS:              [e.g., macOS 15.3 / Windows 11 24H2 / Ubuntu 24.04]
Build Hash:      [git short SHA]
Bundle Size:     [XXX KB]

---------------------------------------------------------
  SUMMARY
---------------------------------------------------------
  Total Tests:    65
  Passed:         [X]
  Failed:         [X]
  Blocked:        [X]
  Not Tested:     [X]
  Pass Rate:      [X%]
---------------------------------------------------------
```

### Critical Path Tests (15 tests -- ALL must pass to proceed)

| # | Test | Steps | Expected | Result | Notes |
|---|------|-------|----------|--------|-------|
| 1 | Popup opens without console errors | Click extension icon on any standard website | Popup renders, header shows domain + cookie count, zero console errors | | |
| 2 | Cookie list loads for current domain | Open popup on a site with known cookies | All cookies for the domain displayed; count matches DevTools Application tab | | |
| 3 | Cookie edit saves correctly | Expand a cookie, change value, click Save | Value persists; verified via `chrome.cookies.get()` | | |
| 4 | Cookie delete works | Click delete on a cookie, confirm | Cookie removed from list and from browser; badge decrements | | |
| 5 | Cookie create works | Click "+ Add", fill name + value, Save | New cookie appears in list and in DevTools | | |
| 6 | Search filters cookies | Type partial cookie name in search | List filters in real time; filter count displays "X of Y" | | |
| 7 | Export downloads valid JSON | Click Export on a domain with 10 cookies | `.json` file downloads; valid JSON with 10 cookie objects | | |
| 8 | Import loads cookies | Import a previously exported JSON file | Preview screen shows cookies; Apply creates them; count matches | | |
| 9 | Profile save (1st) | Save current cookies as "Test Profile 1" | Profile card appears; counter shows "1/2 profiles used" | | |
| 10 | Profile save (2nd) | Save another profile | Counter shows "2/2 profiles used" (danger red) | | |
| 11 | Profile load restores cookies | Load saved profile on same domain | Confirmation dialog appears; cookies replaced with profile contents | | |
| 12 | Auto-delete rule creates and executes | Create rule for a test domain on tab close; open + close the tab | Cookies for the matched domain are deleted by background worker | | |
| 13 | Health score displays | Open Health tab on a site with mixed cookie security | Score renders (A-F grade); badge color matches grade | | |
| 14 | Dark mode toggles correctly | Settings > Dark mode > return to popup | Popup renders in dark palette; no contrast issues; persists across reopen | | |
| 15 | Paywall triggers at correct limits | Attempt 3rd profile save | Hard block modal appears with gift-framed copy; save is blocked | | |

### Feature Area Tests (35 tests)

| # | Area | Test | Steps | Expected | Result | Notes |
|---|------|------|-------|----------|--------|-------|
| 16 | Edit | Change cookie name | Rename "session" to "session_v2", Save | Old cookie removed, new created with updated name | | |
| 17 | Edit | Toggle httpOnly flag | Uncheck httpOnly, Save | "HttpOnly" pill disappears; API confirms `httpOnly: false` | | |
| 18 | Edit | Invalid domain format | Enter `http://example.com`, Save | Validation error blocks save: "Domain should not include protocol" | | |
| 19 | Create | Duplicate cookie name | Create cookie with existing name on same domain+path | Existing cookie overwritten; single entry in list | | |
| 20 | Delete | Delete All | Click "Delete All", confirm | All cookies removed; empty state displays; badge shows "0" | | |
| 21 | Delete | Cancel delete | Click X, then Cancel in dialog | Cookie remains unchanged | | |
| 22 | Search | No results | Type "xyznonexistent" | "No cookies match your search" message | | |
| 23 | Search | Special characters | Type `=` or `;` | Treated as literal text; matches cookies containing those chars | | |
| 24 | Filter | Session only | Toggle "Session" chip | Only session cookies displayed | | |
| 25 | Filter | Combined filters | Activate "Session" + "Secure" | Only cookies matching both criteria shown | | |
| 26 | Export | 26+ cookies (paywall) | Export domain with 26 cookies on free tier | Soft banner appears; only first 25 exported | | |
| 27 | Export | Non-JSON format (paywall) | Click Netscape/CSV/Header String | Lock icon visible; soft banner; file NOT downloaded | | |
| 28 | Import | Invalid JSON | Select malformed JSON file | Error message; no cookies modified | | |
| 29 | Import | Oversized (>25 cookies, free) | Import file with 30 cookies | First 25 imported; banner explains limit | | |
| 30 | Protection | Toggle on/off | Protect a cookie, then unprotect | Lock icon appears/disappears; edit fields disable/enable | | |
| 31 | Protection | 6th cookie limit | Protect 5 cookies, attempt 6th | Soft paywall banner; 6th not protected | | |
| 32 | Profiles | Delete profile | Delete a saved profile | Card removed; counter decrements; storage cleared | | |
| 33 | Profiles | 3rd profile (paywall) | Attempt to save 3rd profile | Hard block modal with "Pro found 2 profiles worth keeping" | | |
| 34 | Profiles | Empty state | Open Profiles tab with no profiles | Illustration + CTA "Save Current Cookies" | | |
| 35 | Rules | 2nd rule (paywall) | Attempt to create 2nd rule | Hard block modal with "Your first rule is already cleaning" | | |
| 36 | Rules | Disable/enable toggle | Toggle rule off, verify no execution; toggle on, verify execution | Rule toggle state persists; alarm cleared/re-registered | | |
| 37 | Health | Blurred panel (free) | Click health risk breakdown | Details blurred with `blur(4px)`; "Unlock Details" overlay triggers soft banner | | |
| 38 | Health | GDPR scan (1st free) | Click "Run GDPR Scan" | Scan runs; top 3 cookies classified; remaining blurred; counter updates | | |
| 39 | Health | GDPR scan (2nd, paywall) | Click scan again | Hard block modal; scan does NOT execute | | |
| 40 | Paywall | Dismiss via Escape | Press Escape on hard block modal | Modal closes; 48-hour cooldown begins | | |
| 41 | Paywall | CTA opens correct URL | Click upgrade button on modal | New tab: `https://zovo.app/signup?ref=cookie-manager&trigger=TX&plan=starter` | | |
| 42 | Paywall | Max 1 hard block / session | Dismiss T1, then trigger T2 | Second hard block deferred to next session | | |
| 43 | Paywall | Post-upgrade unlock | Simulate Pro tier in storage | Confetti animation; lock icons fade; blur clears; badge shows "PRO" | | |
| 44 | Context | Right-click "View cookies" | Right-click > Zovo > "View cookies for this site" | Popup opens scoped to current domain | | |
| 45 | Settings | Theme persistence | Set dark, close popup, reopen | Dark mode persists | | |
| 46 | Settings | System theme detection | Set OS to dark, theme = "System" | Extension follows OS; real-time toggle | | |
| 47 | Auth | Sign in flow | Click "Sign in to Zovo", complete OAuth | Account card appears; tier badge updates | | |
| 48 | Auth | Sign out cleanup | Click "Sign out" | Auth tokens cleared; tier reverts to free; confirmation shown | | |
| 49 | Offline | Grace period (Pro) | Disconnect network with Pro cached | Pro features available; banner: "...72 hours" | | |
| 50 | Install | Fresh install | Install from `.zip` | Clean state; empty states on all tabs; onboarding triggers; zero console errors | | |

### Edge Case Tests (15 tests)

| # | Category | Test | Expected | Result | Notes |
|---|----------|------|----------|--------|-------|
| 51 | XSS | Cookie value `<script>alert(1)</script>` | Rendered as literal text; no execution | | |
| 52 | XSS | Cookie name `<img onerror=alert(1) src=x>` | Rendered as literal text | | |
| 53 | Input | Double-click Save | Only one API call fires; button debounced | | |
| 54 | Input | Paste 10KB value in cookie field | Field accepts input; save fails with clear error (4KB limit) | | |
| 55 | Navigation | chrome:// page | "Cookie management not available for browser internal pages" | | |
| 56 | Navigation | about:blank | "No domain detected" -- no crash | | |
| 57 | Storage | Corrupted JSON in storage | Extension detects, logs, resets to defaults; no crash | | |
| 58 | Storage | chrome.storage.local near 10MB | Graceful error: "Storage is full" | | |
| 59 | Service Worker | Worker idle >30s, then tab-close rule | Worker wakes; rule executes correctly | | |
| 60 | Service Worker | Chrome restart, verify alarms | `onStartup` re-registers missing alarms | | |
| 61 | Concurrency | Multiple windows, both edit | Last write wins; no data corruption | | |
| 62 | Cookies | Empty cookie value `""` | Displays as empty; no "undefined" or "null" | | |
| 63 | Cookies | SameSite=None without Secure | Warning displayed; enforce Secure=true | | |
| 64 | Incognito | Popup in incognito | Separate cookie store; no cross-store data leakage | | |
| 65 | API | Server 500 on /auth/verify | Retry with backoff; grace period applies; no UI freeze | | |

---

## Step 3: Cross-Platform Testing Matrix

Mark each cell: PASS / FAIL / PARTIAL / N/T (not tested). Record browser version in header.

| Test Area | Chrome Stable v___ | Chrome Beta v___ | Edge v___ | Brave v___ | Opera v___ | macOS ___ | Windows ___ | Linux ___ |
|-----------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Popup renders correctly | | | | | | | | |
| Cookie CRUD (view/edit/create/delete) | | | | | | | | |
| Search and filter | | | | | | | | |
| Export JSON | | | | | | | | |
| Import JSON | | | | | | | | |
| Cookie profiles (save/load) | | | | | | | | |
| Auto-delete rules | | | | | | | | |
| Health score + GDPR scan | | | | | | | | |
| Dark mode + system detection | | | | | | | | |
| Paywall triggers (T1, T2, T3) | | | | | | | | |
| Auth flow (sign in/out) | | | | | | | | |
| Context menu | | | | | | | | |
| Incognito mode | | | | | | | | |
| Performance (popup <100ms) | | | | | | | | |
| Service worker persistence | | | | | | | | |

**Release blockers:** Chrome Stable must be all PASS. Edge and Brave must be PASS on Cookie CRUD, Export/Import, and Paywall. Other browsers are advisory.

---

## Step 4: Performance Validation Report

| # | Metric | Target | Measured | Delta | Status |
|---|--------|--------|----------|-------|--------|
| P-01 | Popup first paint | < 50ms | ____ms | | |
| P-02 | Popup interactive | < 100ms | ____ms | | |
| P-03 | Cookie list render (100 items) | < 16ms | ____ms | | |
| P-04 | Cookie list render (500 items) | < 16ms | ____ms | | |
| P-05 | Cookie list render (1000 items) | < 32ms | ____ms | | |
| P-06 | Search latency (1000 cookies) | < 50ms | ____ms | | |
| P-07 | Export 25 cookies (JSON) | < 100ms | ____ms | | |
| P-08 | Export 1000 cookies (JSON) | < 500ms | ____ms | | |
| P-09 | Profile save | < 200ms | ____ms | | |
| P-10 | Profile load (20 cookies) | < 1s | ____ms | | |
| P-11 | Memory idle (popup open, no interaction) | < 10MB | ____MB | | |
| P-12 | Memory active (500 cookies loaded) | < 25MB | ____MB | | |
| P-13 | Memory sustained (30-min session) | < 50MB | ____MB | | |
| P-14 | Bundle size total | < 342KB | ____KB | | |
| P-15 | Bundle: popup.js | < 120KB | ____KB | | |
| P-16 | Bundle: background.js | < 35KB | ____KB | | |
| P-17 | Bundle: options.js | < 80KB | ____KB | | |
| P-18 | Bundle: content.js | < 2KB | ____KB | | |
| P-19 | Service worker wake time | < 50ms | ____ms | | |
| P-20 | `chrome.cookies.getAll` latency | < 20ms | ____ms | | |

**Measurement method:** `performance.now()` instrumentation in debug build. Memory via Chrome Task Manager. Bundle sizes via `stat` on `dist/` output files after `gzip -9`.

**Pass criteria:** All P-01 through P-14 must meet target. P-15 through P-20 are advisory. Any single failure in P-01 through P-14 blocks release.

---

## Step 5: Security Review Checklist

| # | Check | Status | Evidence | Verified By |
|---|-------|--------|----------|-------------|
| S-01 | No `eval()` usage anywhere in codebase | | `grep -r "eval(" src/` result: ____________ | |
| S-02 | No `new Function()` constructor | | `grep -r "new Function" src/` result: ____________ | |
| S-03 | No `innerHTML` with user data | | `grep -r "innerHTML" src/` result: ____________ | |
| S-04 | No `dangerouslySetInnerHTML` in Preact components | | `grep -r "dangerouslySetInnerHTML" src/` result: ____________ | |
| S-05 | No external scripts loaded | | Verified: all HTML files reference only bundled `.js` files | |
| S-06 | CSP properly configured in manifest.json | | Snippet: `script-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'` | |
| S-07 | All user inputs sanitized per spec | | Reviewed sanitization in: `cookie-utils.ts`, `import-parsers.ts`, `search.ts` | |
| S-08 | Message origins validated (onMessageExternal) | | `sender.id` checked against `ZOVO_EXTENSION_IDS` allowlist | |
| S-09 | Auth tokens encrypted at rest | | AES-256-GCM encryption on `zovo_auth.token` in storage | |
| S-10 | HMAC on license cache | | `license_cache.signature` validated via timing-safe comparison | |
| S-11 | No PII in analytics events | | Reviewed `analytics.ts`: cookie names SHA-256 hashed, domain eTLD+1 only | |
| S-12 | Cookie data stays local (never transmitted) | | Network tab verification: zero requests containing cookie values | |
| S-13 | XSS tests pass (all 6 pen test payloads) | | Tested: `<script>`, `<img onerror>`, `javascript:`, `<svg onload>`, template injection, import injection | |
| S-14 | Import validates data schema | | Malformed JSON, oversized file, nested JSON bomb, public suffix domain all rejected | |
| S-15 | CSP bypass tests pass | | `eval()`, `new Function()`, `setTimeout(string)` all blocked in popup context | |
| S-16 | Storage tampering detected | | Modified `license_cache.tier` in DevTools; HMAC mismatch forced re-validation | |
| S-17 | Message spoofing rejected | | Sent message from unknown extension ID; response: `{ error: "unauthorized" }` | |
| S-18 | OAuth uses PKCE | | Authorization URL contains `code_challenge` and `code_challenge_method=S256` | |
| S-19 | No `http://` API URLs in source | | `grep -r "http://" src/` returns zero non-comment results | |
| S-20 | Incognito: no data written to storage | | Opened popup in incognito; verified zero writes to `chrome.storage.local` for session data | |

**Pass criteria:** All 20 checks must pass. A single S-01 through S-06 failure is a critical blocker. S-07 through S-20 failures are high-severity blockers.

---

## Step 6: Chrome Web Store Readiness Checklist

### Manifest Verification

| # | Requirement | Status | Value / Evidence |
|---|-------------|--------|------------------|
| M-01 | `manifest_version: 3` | | |
| M-02 | `name` under 45 characters | | Name: "Zovo Cookie Manager" (20 chars) |
| M-03 | `version` valid semver | | Version: `1.0.0` |
| M-04 | `description` under 132 characters, keyword-rich | | Description: ________________________________ (___chars) |
| M-05 | Icon 16x16 present and correct dimensions | | Path: `icons/icon16.png` |
| M-06 | Icon 32x32 present and correct dimensions | | Path: `icons/icon32.png` |
| M-07 | Icon 48x48 present and correct dimensions | | Path: `icons/icon48.png` |
| M-08 | Icon 128x128 present and correct dimensions | | Path: `icons/icon128.png` |
| M-09 | All file paths in manifest resolve to files in dist | | Verified: popup, background, options, content script, icons |
| M-10 | Permissions minimal and justified | | `cookies`, `activeTab`, `storage`, `tabs`, `alarms`, `clipboardWrite` |
| M-11 | Optional permissions requested at runtime only | | `notifications`, `identity`, `offscreen`, `sidePanel` |
| M-12 | No `<all_urls>` or broad host permissions | | |
| M-13 | CSP configured (see S-06) | | |
| M-14 | `web_accessible_resources` empty or tightly scoped | | |
| M-15 | `externally_connectable` restricted to Zovo IDs + `zovo.app` | | |

### Listing Assets

| # | Asset | Spec | Status | File |
|---|-------|------|--------|------|
| L-01 | Store description (detailed) | Keyword-optimized, accurate feature list | | |
| L-02 | Short description | Under 132 characters | | |
| L-03 | Screenshot 1 | 1280x800 -- Cookie list view (light mode) | | |
| L-04 | Screenshot 2 | 1280x800 -- Cookie edit / detail view | | |
| L-05 | Screenshot 3 | 1280x800 -- Profiles tab | | |
| L-06 | Screenshot 4 | 1280x800 -- Health score / GDPR scan | | |
| L-07 | Screenshot 5 | 1280x800 -- Dark mode | | |
| L-08 | Small promotional tile | 440x280 | | |
| L-09 | Large promotional tile | 920x680 (optional, recommended) | | |
| L-10 | Category | Developer Tools | | |
| L-11 | Language | English | | |

### Privacy and Compliance

| # | Requirement | Status | Evidence |
|---|-------------|--------|----------|
| PC-01 | Privacy policy URL live and accessible | | `https://zovo.app/privacy` -- HTTP 200 |
| PC-02 | Single purpose justification written | | "...comprehensive interface for viewing, editing, creating, deleting, and managing browser cookies..." |
| PC-03 | `cookies` permission justification written | | See Section 6.1 of agent4-security.md |
| PC-04 | `activeTab` permission justification written | | |
| PC-05 | `storage` permission justification written | | |
| PC-06 | `tabs` permission justification written | | |
| PC-07 | `alarms` permission justification written | | |
| PC-08 | `clipboardWrite` permission justification written | | |
| PC-09 | `notifications` (optional) justification written | | |
| PC-10 | `identity` (optional) justification written | | |
| PC-11 | Data disclosure: "Does not sell user data" certified | | |
| PC-12 | Data disclosure: limited data collection described | | Email (opt-in), anonymized usage events only |
| PC-13 | No remote code execution | | No eval, no external scripts, no WASM from external sources |
| PC-14 | No deceptive behavior | | Extension does exactly what description states |
| PC-15 | No hidden functionality | | All features visible in UI; no silent data collection |
| PC-16 | No unauthorized data access | | `activeTab` scoping; no `<all_urls>` |
| PC-17 | Clear uninstall behavior | | Chrome clears all storage; `setUninstallURL` contains no user data |

---

## Step 7: Final QA Report Template

```
=========================================================
  ZOVO COOKIE MANAGER -- QA SIGN-OFF REPORT v1.0.0
=========================================================

  STATUS:  [ ] READY FOR SUBMISSION
           [ ] NEEDS WORK -- SEE BLOCKERS BELOW

=========================================================

ISSUE SUMMARY
---------------------------------------------------------
  Critical Issues:   [0]
  High Issues:       [0]
  Medium Issues:     [0]
  Low Issues:        [0]
  Known Limitations: [see below]

TEST RESULTS
---------------------------------------------------------
  Area              | Tests | Passed | Failed | Status
  ------------------|-------|--------|--------|--------
  Clean Build       |   18  |        |        |
  Critical Path     |   15  |        |        |
  Feature Areas     |   35  |        |        |
  Edge Cases        |   15  |        |        |
  Performance       |   20  |        |        |
  Security          |   20  |        |        |
  CWS Readiness     |   32  |        |        |
  Cross-Platform    |   15  |        |        |
  ------------------|-------|--------|--------|--------
  TOTAL             |  170  |        |        |

OPEN BLOCKERS (must resolve before submission)
---------------------------------------------------------
  #   Severity   Description               Owner    ETA
  --  ---------  ------------------------  -------  ----
  [none / list blockers here]

CHANGES MADE SINCE LAST REPORT
---------------------------------------------------------
  [List all fixes applied since previous QA cycle]
  - [Fix description] -- [commit SHA]
  - [Fix description] -- [commit SHA]

KNOWN LIMITATIONS (will not block release)
---------------------------------------------------------
  1. Partitioned cookies (CHIPS) display depends on Chrome
     114+ API support; partition key not shown on older
     versions.
  2. System theme detection may not work on all Linux
     desktop environments (Wayland/X11 variation).
  3. Profile load of 500+ cookies takes 5-10 seconds
     with visible progress indicator; not instant.
  4. Clipboard clear-after-60s is best-effort; Chrome does
     not guarantee programmatic clipboard clearing.
  5. [Add any additional known limitations here]

RECOMMENDATION
---------------------------------------------------------
  [ ] Ready to publish to Chrome Web Store.
  [ ] Needs additional work on: ________________________

SIGN-OFF
---------------------------------------------------------
  QA Lead:     ________________________  Date: __________
  Dev Lead:    ________________________  Date: __________
  Product:     ________________________  Date: __________
  Security:    ________________________  Date: __________
```

---

## Step 8: Debug Checklist for Future Releases

Common Chrome extension issues with Zovo Cookie Manager-specific context. Reference this table when triaging bugs in v1.0.x and beyond.

| # | Issue | Symptom | Root Cause | Fix | Prevention |
|---|-------|---------|-----------|-----|------------|
| D-01 | Popup white screen | Popup opens to blank white page; no UI renders | Uncaught exception in top-level `popup.js` before Preact mounts. Often caused by a missing import, undefined variable, or build misconfiguration. | Check service worker console and popup console for the thrown error. Fix the import or build config. Ensure error boundary wraps the root `<App />` component. | Add a Preact `ErrorBoundary` component at the root that renders a fallback "Something went wrong -- please reload" message. Add a smoke test to CI that opens the popup and checks for the root DOM node. |
| D-02 | Service worker crash loop | Background tasks stop firing (rules, alarms, license checks). `chrome://extensions` shows "Service worker (inactive)" with errors. | Unhandled promise rejection or thrown error in a top-level listener registration. MV3 service workers terminate on uncaught exceptions. | Wrap every top-level listener callback in `try/catch`. Check `chrome://extensions` > "Errors" panel for the stack trace. Fix the root error. | Every listener callback must have a top-level `try/catch` that logs to `chrome.storage.local` (not just console, since the console is gone when the worker restarts). Add a health-check alarm that writes a timestamp to storage every 5 minutes; if the timestamp is stale, the worker is crashing. |
| D-03 | Cookies not displaying | Popup opens but cookie list is empty on a site that has cookies | The `chrome.cookies.getAll({ url })` call is using the wrong URL format. Common issue: passing `chrome://newtab` or a URL without a proper scheme. Also possible: `activeTab` permission not granted because user opened popup via keyboard shortcut instead of clicking the icon. | Log the URL being passed to `getAll`. Verify it starts with `http://` or `https://`. Handle `chrome://`, `file://`, and `about:blank` with a user-facing message. | Validate the active tab URL before querying the cookies API. Maintain an explicit allowlist of schemes: `http`, `https`. Show "Not available for this page" for everything else. |
| D-04 | Cookie edit silently fails | User changes a cookie value and clicks Save, but the old value remains on re-open | `chrome.cookies.set()` returns the cookie only on success; on failure it returns `undefined` and sets `chrome.runtime.lastError`. The error is not being checked. | Always check `chrome.runtime.lastError` after `chrome.cookies.set()`. Display the error message to the user (e.g., "Failed to set cookie: [reason]"). | Wrap the cookies API in a utility function that always checks `lastError` and either resolves or rejects a Promise. Surface errors in a toast notification. |
| D-05 | Duplicate cookies after edit | Editing a cookie name creates a new cookie but the old one still exists | Cookie "rename" requires deleting the old cookie and creating a new one. If the delete call fails or is skipped, both exist. | Ensure the edit handler calls `chrome.cookies.remove()` for the old name/domain/path before calling `chrome.cookies.set()` for the new one. Handle failures on both calls. | Treat name edits as a delete-then-create atomic operation. Roll back (re-create the old cookie) if the new cookie creation fails. |
| D-06 | Export produces empty file | User clicks Export but the downloaded file contains `[]` or `null` | The cookie cache is stale or empty. The export function reads from the in-memory cache, which may not be populated if the user switched tabs before exporting. | Force a fresh `chrome.cookies.getAll()` call in the export handler instead of relying on the cache. | Never export from cache. Always fetch fresh data. Disable the Export button until data is loaded (loading state). |
| D-07 | Import overwrites wrong domain | User imports cookies and they appear on the wrong domain | The imported JSON contains domain values that differ from the current tab. The import handler is setting cookies on the imported domain, not the active domain. | This is correct behavior if the import preserves original domains. Add a confirmation step: "These cookies will be set on [domain-list]. Continue?" | Show a domain summary in the import preview. Let the user choose: "Set on original domains" vs. "Set on current domain." |
| D-08 | Paywall not triggering | User exceeds free tier limits but no paywall modal appears | The `PaywallController` dismiss cooldown (48 hours) is still active from a previous dismissal, or the session hard-block limit (1 per session) was already consumed. | Check `chrome.storage.local` for `paywall_state` to see cooldown timestamps and session counters. Verify the 48-hour cooldown logic and session counter reset. | Add a debug panel (only in dev builds) that shows paywall state: last dismiss time, session count, cooldown remaining. |
| D-09 | Paywall shows on Pro users | Pro user sees a paywall modal or soft banner | The `license_cache` has expired or been corrupted, and the `/auth/verify` call has not yet completed. The tier guard checks the cache first and falls back to "free" if invalid. | Force an immediate `/auth/verify` call on popup open if the cache age exceeds 12 hours. Show a "Verifying subscription..." loading state instead of defaulting to free. | Cache the tier with a 24-hour TTL but add a "verifying" intermediate state for the first 2 seconds of popup open while the background check runs. Never show a paywall during the "verifying" state. |
| D-10 | Dark mode flickers on open | Popup briefly shows light mode, then switches to dark | The theme preference is loaded asynchronously from `chrome.storage.sync`. The default CSS is light, and the dark class is applied after the async read completes. | Inline the theme detection in `popup.html` as a synchronous `<script>` that reads `chrome.storage.sync` and applies the theme class before the body renders. Or use CSS `prefers-color-scheme` as the initial default. | Store the theme in `chrome.storage.local` (faster than sync) and read it synchronously before first paint. Set a `data-theme` attribute on `<html>` in a blocking inline script. Note: the inline script must comply with CSP -- use a hash-based exception if needed, or move theme detection to the first line of `popup.js` before Preact mount. |
| D-11 | Memory leak on long sessions | Chrome Task Manager shows extension memory climbing over time without dropping | `useEffect` cleanup functions are missing. Event listeners (`chrome.cookies.onChanged`, `chrome.storage.onChanged`) are added but never removed when the popup component unmounts. | Audit every `useEffect` in popup components. Every `addEventListener` or `chrome.*.addListener` must have a corresponding removal in the cleanup return. | ESLint rule `react-hooks/exhaustive-deps` (compatible with Preact) catches missing cleanup. Code review checklist: "Does every listener have a removal?" |
| D-12 | Alarms not firing after Chrome update | Auto-delete rules and license checks stop running after a Chrome update | Chrome may clear alarms during major version updates. The `onStartup` listener re-registers alarms, but `onStartup` does not fire on updates -- only `onInstalled` with `reason: "update"` fires. Wait, actually `onStartup` fires on browser launch, not extension update. | Add alarm verification in both `chrome.runtime.onStartup` and `chrome.runtime.onInstalled` (for reason `"chrome_update"`). Call `chrome.alarms.getAll()` and re-create any missing alarms. | Register alarm checks in both `onStartup` and `onInstalled`. Add a self-healing check: if the health-check alarm has not fired in 10 minutes, the popup should trigger alarm re-registration on next open. |
| D-13 | Storage quota exceeded | "QUOTA_BYTES quota exceeded" error when saving profiles or snapshots | `chrome.storage.local` has a 10MB limit. Users with many profiles containing large cookie sets can fill it. | Implement storage quota monitoring (check `getBytesInUse()` before writes). Show a user-facing warning at 80% capacity. Offer cleanup suggestions: delete old profiles, clear health cache. | Track storage usage on every batched write. Show a storage usage bar in Settings. Auto-purge `health_cache` and `analytics_queue` when usage exceeds 8MB. |
| D-14 | Auth token refresh fails silently | User is suddenly downgraded to free tier despite an active subscription | The refresh token has expired (30-day lifetime) or been revoked server-side. The background `/auth/verify` call returns 401 but the error handling defaults to free tier without notifying the user. | On 401 from `/auth/verify`, show a non-blocking banner: "Your session has expired. Please sign in again to restore Pro features." Provide a "Sign In" button in the banner. | Proactively refresh the JWT when it is within 1 hour of expiry rather than waiting for it to expire. Log refresh failures to local storage for debugging. |
| D-15 | Extension conflict with other cookie managers | Cookie operations fail or produce unexpected results when another cookie extension is installed | Both extensions call `chrome.cookies.set()` and `chrome.cookies.remove()` simultaneously. The `onChanged` listener fires for the other extension's modifications, causing cache thrashing and UI flicker. | Add a guard: when `onChanged` fires, check if the change was initiated by this extension (compare against a pending-operations queue). Ignore changes from external sources for cache invalidation (or debounce heavily). | Document in the FAQ that running multiple cookie manager extensions simultaneously may cause conflicts. Consider a "pause monitoring" button that disables `onChanged` handling temporarily. |
| D-16 | Brave Shields block cookie API | Cookie list shows empty on Brave even though cookies exist | Brave's Shields feature may interfere with the `chrome.cookies` API in certain configurations (aggressive fingerprinting protection). | Test with Shields down. If the issue is Shields, detect Brave via user-agent string and show a message: "Brave Shields may interfere with cookie access. Try lowering Shields for this site." | Add Brave-specific detection in the empty state handler. Link to a help article explaining the interaction. |
| D-17 | Virtual scroller misaligned | Cookie rows overlap, show gaps, or scroll position jumps | The virtual scroller row height assumption (48px) does not match the actual rendered row height. This happens when font size changes (accessibility settings) or when a row expands for editing. | Measure actual row heights dynamically if rows can change size. Or ensure all rows are exactly 48px with `overflow: hidden` and expand only via a separate detail panel below the list. | Use `contain: content` on cookie rows. Keep all rows at fixed height. Handle the expanded/edit state as a separate overlay or inline panel that does not affect other row positions. |
| D-18 | Import fails on large files | Import hangs or crashes when loading a file with 5,000+ cookies | `JSON.parse` on a 5MB string blocks the main thread. The subsequent batch of 5,000 `chrome.cookies.set()` calls overwhelms the API. | Parse the JSON in a Web Worker or use streaming JSON parsing. Batch `chrome.cookies.set()` calls in groups of 50 with 100ms delays between batches. Show a progress bar. | Enforce the 10,000-cookie limit on import. Chunk the set operations. Show progress. Allow cancellation. |
| D-19 | Profile loaded on wrong cookie store | User loads a profile in incognito but cookies appear in the regular store (or vice versa) | The `chrome.cookies.set()` call does not specify the `storeId` parameter. Chrome defaults to the default store. | Always pass `storeId` when setting cookies. Detect the current context (`chrome.tabs.get` returns `incognito: true`) and use the correct store ID (`"0"` for default, `"1"` for incognito). | Include `storeId` in the profile metadata when saving. Warn users if loading a profile saved in a different store context. |
| D-20 | Build size regression | CI passes but the production bundle exceeds 342KB | A new dependency was added (or a dependency updated) that increased bundle size beyond the budget. | Check `dist/` file sizes. Run `npx vite-bundle-visualizer` to identify the new bloat. Remove or replace the dependency. | Add a CI gate (Step 5.8 from performance spec) that fails the build if any file or total exceeds its budget. Block merges that increase bundle size without explicit approval. |
| D-21 | Context menu missing | Right-click does not show "Zovo Cookie Manager" submenu | `chrome.contextMenus.create()` was not called in `chrome.runtime.onInstalled`. Or it threw an error that was swallowed. | Check `chrome.runtime.lastError` after `contextMenus.create`. Verify `onInstalled` handler runs on fresh install. Check `chrome://extensions` error log. | Wrap context menu creation in try/catch. Add a verification step in the smoke test. |
| D-22 | Race condition on popup open | Cookie list sometimes shows data from the previously active tab | The popup reads `chrome.tabs.query({ active: true, currentWindow: true })` but by the time the result arrives, the user has switched tabs. The cookie fetch uses the stale tab URL. | Re-query the active tab after the cookie data returns. If the tab has changed, discard the stale data and re-fetch. Or use `chrome.tabs.onActivated` to cancel pending fetches. | Assign a request ID to each fetch. On completion, verify the request ID matches the latest tab activation. Discard stale responses. |
| D-23 | Extension breaks after Chrome flag change | Features stop working after user enables/disables a Chrome flag (e.g., "Partitioned cookies", "Privacy Sandbox") | The `chrome.cookies` API behavior changes based on certain flags. Partitioned cookies may not appear in `getAll` results with default parameters. | Document known Chrome flag interactions. Test with common flags toggled. Add graceful degradation: if `getAll` returns fewer cookies than expected, suggest checking Chrome flags. | Include a "Troubleshooting" section in the help page that lists known Chrome flag interactions. Test against Chrome Beta and Canary regularly to catch upcoming changes. |
| D-24 | Analytics queue bloat | `chrome.storage.local` fills up because analytics events are not being flushed | The analytics flush alarm is not firing (see D-12), or the flush API call is failing silently, causing events to accumulate in the queue. | Check `analytics_queue` length in storage. If > 1000 events, trim to most recent 50 and force a flush. Fix the underlying alarm or API issue. | Cap the analytics queue at 200 events. On overflow, drop the oldest events. Flush on popup close as a secondary trigger (in addition to the alarm). |
| D-25 | CSP violation in production | Console shows "Refused to execute inline script" or similar CSP errors | An inline `<script>` tag, inline event handler (`onclick="..."`), or `style` attribute with `url()` violates the extension's CSP. Often introduced by a third-party library or a developer shortcut. | Find the violating code via the CSP error message (it includes the directive and the blocked source). Replace inline scripts with event listeners. Replace inline styles with class toggles. | Run the production build in Chrome with the console open and navigate every screen. Any CSP violation is a release blocker. Add a CI step that scans HTML files for inline scripts and event handlers. |

---

*End of Final QA Report. This document provides 170 discrete verification points across 8 sections: 18 clean build checks, 65 regression tests, 15 cross-platform matrix rows, 20 performance benchmarks, 20 security validations, 32 CWS readiness items, a sign-off template, and a 25-entry debug reference. Every template is fill-in-ready -- developers verify and record; they do not create structure.*
