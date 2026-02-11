# Zovo Cookie Manager -- QA Testing & Security Audit Plan

**Author:** QA Engineering (Agent 3)
**Date:** 2026-02-11
**Extension Version:** 1.0.0
**Risk Level:** HIGH -- Extension handles authentication cookies, session tokens, and personally sensitive browsing data. A single XSS vector, data loss bug, or paywall bypass can destroy user trust and Chrome Web Store rating.

---

## 1. Security Scan Checklist

Every item must pass before any build is submitted to the Chrome Web Store. A single failure blocks release.

### 1.1 Code Injection Vectors

- [ ] **SEC-01:** No `eval()` calls anywhere in the codebase. Search all `.ts`, `.tsx`, `.js` files. Include dependencies in `node_modules/@zovo/` scope.
- [ ] **SEC-02:** No `new Function()` constructor usage. This is functionally equivalent to eval and violates MV3 CSP.
- [ ] **SEC-03:** No `innerHTML` assignments with user-supplied data. Every dynamic text insertion must use `textContent`, Preact JSX interpolation (`{variable}`), or explicit sanitization. Grep the entire `src/` tree for `innerHTML`, `outerHTML`, `insertAdjacentHTML`, and `document.write`.
- [ ] **SEC-04:** No `dangerouslySetInnerHTML` in any Preact/JSX component. If found, require a written justification and manual audit of the value source.
- [ ] **SEC-05:** Cookie values are escaped before rendering. Verify that cookie name, value, domain, and path fields displayed in `CookieList.tsx`, `CookieDetail.tsx`, and the DevTools panel never pass raw strings to DOM manipulation methods.
- [ ] **SEC-06:** Cookie values with HTML entities (`<`, `>`, `&`, `"`, `'`) render as literal text, not as markup. Test with cookie value `<script>alert(1)</script>` and `<img src=x onerror=alert(1)>`.

### 1.2 Data Handling

- [ ] **SEC-07:** No cookie values, session tokens, or full URLs appear in `console.log`, `console.warn`, or `console.error` in production builds. Verify the build pipeline strips or no-ops console calls, or that all log statements use hashed/redacted values.
- [ ] **SEC-08:** Analytics events never transmit raw cookie values. Verify `analytics.ts` hashes cookie names with SHA-256 before inclusion. Verify cookie values are never included in any event property.
- [ ] **SEC-09:** Only the registrable domain (eTLD+1) is recorded in analytics, never full URLs with paths or query parameters.
- [ ] **SEC-10:** The `chrome.cookies.set()` wrapper in `cookie-utils.ts` validates all input fields before calling the API: domain format (no protocol prefix, valid TLD), path starts with `/`, expiry is a valid Unix timestamp or null, sameSite is one of `unspecified`, `lax`, `strict`, `no_restriction`.
- [ ] **SEC-11:** Import parsers (`import-parsers.ts`) validate JSON schema before applying any cookies. Malformed JSON, missing required fields, or unexpected types must produce a user-visible error and abort import without partial application.

### 1.3 Extension Security

- [ ] **SEC-12:** `manifest.json` includes a strict Content Security Policy. At minimum: `"content_security_policy": { "extension_pages": "script-src 'self'; object-src 'none'" }`. No `unsafe-eval`, no `unsafe-inline`, no remote script sources.
- [ ] **SEC-13:** `chrome.runtime.onMessageExternal` listener in `service-worker.ts` validates `sender.id` against the hardcoded allowlist of Zovo extension IDs in `constants.ts`. Messages from unknown extension IDs are silently dropped.
- [ ] **SEC-14:** No external scripts loaded via `<script src="https://...">`. All code is bundled locally. Verify no CDN references in any HTML file (`popup/index.html`, `options/index.html`, `devtools/panel.html`, `sidepanel/index.html`).
- [ ] **SEC-15:** The `@zovo/auth` module does not store plaintext passwords. OAuth tokens and JWTs are stored in `chrome.storage.sync` only. Verify no credentials in `chrome.storage.local` or in-memory globals that persist beyond a single function scope.
- [ ] **SEC-16:** Encrypted Cookie Vault (Pro) uses Web Crypto API `SubtleCrypto.encrypt()` with AES-256-GCM and PBKDF2 key derivation (minimum 100,000 iterations). Passphrase is never stored -- only the derived key is held in memory during the active session.
- [ ] **SEC-17:** License token (`zovo_token`) is a JWT validated against a known public key or HMAC secret. Verify the extension does not blindly trust the `tier` claim without server-side validation (the 24-hour background check via `/auth/verify`).
- [ ] **SEC-18:** `license_cache` in `chrome.storage.local` includes an HMAC `signature` field to prevent local tampering. Verify the extension rejects cache entries with invalid signatures.

### 1.4 Permission Audit

- [ ] **SEC-19:** The `manifest.json` `permissions` array contains only: `cookies`, `activeTab`, `storage`, `tabs`, `alarms`, `clipboardWrite`. No `<all_urls>` host permission. No `webRequest`, `webRequestBlocking`, or `browsingData` unless documented and justified.
- [ ] **SEC-20:** Optional permissions (`notifications`, `identity`, `offscreen`, `sidePanel`) are requested at runtime only when the user activates the corresponding feature. Verify with a fresh install that these are not granted by default.

---

## 2. Functional Testing Matrix

### 2.1 Cookies Tab

| ID | Feature | Test Case | Steps | Expected | Priority |
|----|---------|-----------|-------|----------|----------|
| CT-01 | View cookies | Domain with 0 cookies | Open popup on a fresh domain with no cookies set | Empty state: "No cookies found for this domain" message with illustration. Cookie count badge shows "0". | P0 |
| CT-02 | View cookies | Domain with 1 cookie | Navigate to a site that sets exactly 1 cookie, open popup | Single cookie row displayed. Badge shows "1". | P0 |
| CT-03 | View cookies | Domain with 100+ cookies | Open popup on a cookie-heavy site (e.g., a major ad-tech property) | All cookies render without UI freeze. List is scrollable. Performance: render complete within 500ms. | P0 |
| CT-04 | View cookies | Domain with 1000+ cookies | Synthetic test: inject 1000 cookies for a test domain via chrome.cookies API, then open popup | Virtualized list renders without crash. Memory usage stays under 80MB. Scrolling is smooth (60fps). | P1 |
| CT-05 | View cookies | Cookie field display | Expand any cookie row | All fields visible: name, value (full, not truncated), domain, path, expires (formatted date or "Session"), httpOnly, secure, sameSite. Security flags render as colored pills. | P0 |
| CT-06 | Edit cookie | Change cookie value | Expand row, modify value field, click Save | `chrome.cookies.set()` called with new value. Cookie list refreshes. Verify via chrome.cookies.get() that value persisted. | P0 |
| CT-07 | Edit cookie | Change cookie name | Expand row, change name from "session" to "session_v2", Save | Old cookie removed, new cookie created with updated name (cookie rename = delete old + create new). | P0 |
| CT-08 | Edit cookie | Change domain | Expand row, change domain from `.example.com` to `.sub.example.com`, Save | Verify new cookie exists on subdomain. Original cookie removed from original domain. | P1 |
| CT-09 | Edit cookie | Change path | Modify path from `/` to `/api`, Save | Cookie now scoped to `/api` path only. Verify with `chrome.cookies.getAll({ path: "/api" })`. | P1 |
| CT-10 | Edit cookie | Change expiration | Set expiry to a date 1 year in the future, Save | Cookie persists with new expiration. Displayed expiry date matches input. | P0 |
| CT-11 | Edit cookie | Convert persistent to session | Clear the expiry field or select "Session", Save | Cookie becomes a session cookie (no `expirationDate`). Display shows "Session" instead of date. | P1 |
| CT-12 | Edit cookie | Toggle httpOnly flag | Uncheck httpOnly, Save | `chrome.cookies.set()` called with `httpOnly: false`. Verify the "HttpOnly" pill disappears from collapsed row. | P1 |
| CT-13 | Edit cookie | Toggle secure flag | Uncheck Secure on an HTTPS page, Save | Cookie updated. "Secure" pill removed. Verify cookie is now accessible on HTTP. | P1 |
| CT-14 | Edit cookie | Change sameSite | Switch from "Lax" to "Strict", Save | SameSite pill updates to show "Strict". Verify `chrome.cookies.get()` returns `sameSite: "strict"`. | P1 |
| CT-15 | Edit cookie | Invalid domain format | Enter `http://example.com` (with protocol) in domain field, Save | Validation error displayed. Save is blocked. Error message: "Domain should not include protocol." | P0 |
| CT-16 | Edit cookie | Invalid expiry | Enter a past date in expiry field, Save | Warning displayed: "This date is in the past. Cookie will be immediately expired." Allow save but warn. | P1 |
| CT-17 | Create cookie | Create with defaults | Click "+ Add", fill only name and value, Save | Cookie created on current domain with defaults: path `/`, secure `true` (if HTTPS), sameSite `Lax`. Appears in cookie list. | P0 |
| CT-18 | Create cookie | Create with all fields | Fill every field (name, value, domain, path, expiry, httpOnly, secure, sameSite), Save | Cookie created with all specified fields. Each field verified via `chrome.cookies.get()`. | P0 |
| CT-19 | Create cookie | Duplicate cookie name | Create a cookie with a name that already exists on the same domain+path | Existing cookie is overwritten (this is correct browser behavior). No error. Verify only one cookie with that name exists. | P1 |
| CT-20 | Delete cookie | Delete single | Click the X button on a cookie row, confirm | Cookie removed. Row disappears from list. Badge count decrements by 1. `chrome.cookies.get()` returns null. | P0 |
| CT-21 | Delete cookie | Delete All | Click "Delete All" in action bar, confirm in dialog | All cookies for current domain removed. List shows empty state. Badge shows "0". | P0 |
| CT-22 | Delete cookie | Cancel delete | Click X on a cookie row, click "Cancel" in confirmation | Cookie remains. No change to list or badge. | P0 |
| CT-23 | Search | Empty query | Clear search field | All cookies displayed. No filtering applied. | P0 |
| CT-24 | Search | Partial name match | Type "sess" in search | Only cookies whose name, value, or domain contains "sess" are shown. Filter count displayed: "3 of 47 cookies (filtered)". | P0 |
| CT-25 | Search | No results | Type "xyznonexistent" | Empty filtered state: "No cookies match your search" message. | P0 |
| CT-26 | Search | Special characters | Type `=` or `;` in search | Search treats input as literal text. No errors. Matches cookies containing those characters. | P1 |
| CT-27 | Search | Unicode input | Type emoji or CJK characters in search field | Search functions without crash. Returns results or "no match" appropriately. | P2 |
| CT-28 | Filter | Session only | Toggle "Session" chip | Only session cookies (no expiry) displayed. Persistent cookies hidden. | P0 |
| CT-29 | Filter | Persistent only | Toggle "Persistent" chip | Only cookies with an expiration date displayed. | P0 |
| CT-30 | Filter | Secure only | Toggle "Secure" chip | Only cookies with `secure: true` displayed. | P1 |
| CT-31 | Filter | Third-party only | Toggle "Third-party" chip | Only cookies whose domain differs from the active tab's domain are shown. | P1 |
| CT-32 | Filter | Combined filters | Activate "Session" + "Secure" simultaneously | Only cookies that are both session AND secure. If no match, empty filtered state. | P1 |
| CT-33 | Export | JSON with 0 cookies | Click Export when domain has 0 cookies | Export button disabled or produces empty JSON array `[]`. No file download with null data. | P1 |
| CT-34 | Export | JSON with 1 cookie | Export a domain with 1 cookie | Valid JSON file downloaded. Contains one cookie object with all fields. File includes "Exported with Zovo Cookie Manager" comment. | P0 |
| CT-35 | Export | JSON with 25 cookies | Export a domain with exactly 25 cookies | All 25 cookies exported. File is valid JSON. No paywall triggered. | P0 |
| CT-36 | Export | JSON with 26 cookies (paywall) | Export a domain with 26+ cookies | Soft inline banner appears (T3): "Upgrade to export all cookies." Only first 25 exported for free tier. Banner is dismissible. | P0 |
| CT-37 | Export | Non-JSON format (paywall) | Click Netscape, CSV, or Header format in export dropdown | Lock icon visible. Clicking shows soft inline banner (T13). File is NOT downloaded. | P0 |
| CT-38 | Import | Valid JSON | Select a valid exported JSON file | Preview screen shows cookies to import. Click "Apply" to import. All cookies created. Count matches file. | P0 |
| CT-39 | Import | Invalid JSON | Select a file with malformed JSON (missing brackets, trailing comma) | Error message: "Invalid JSON file. Please check the file format." No cookies modified. | P0 |
| CT-40 | Import | Duplicate cookies | Import file with cookies that already exist on the domain | Conflict resolution: default behavior is overwrite. Verify existing cookies updated with imported values. | P1 |
| CT-41 | Import | Oversized file (>25 cookies) | Import a JSON file with 30 cookies on free tier | Import processes first 25 cookies. Banner: "Free tier limited to 25 cookies per import." Remaining 5 skipped. | P1 |
| CT-42 | Import | Empty file | Select a JSON file containing `[]` | Message: "No cookies found in this file." No import occurs. | P2 |
| CT-43 | Import | Non-JSON file | Select a `.csv` or `.txt` file when only JSON is allowed (free tier) | Error: "Only JSON import is available on the free tier." File rejected. | P1 |
| CT-44 | Protection | Toggle on | Click Protect toggle on a cookie | Lock icon appears on cookie row. Cookie marked read-only in storage metadata. Editing fields become disabled. | P0 |
| CT-45 | Protection | Toggle off | Unprotect a previously protected cookie | Lock icon removed. Fields become editable again. | P0 |
| CT-46 | Protection | Delete protected cookie | Click X on a protected cookie | Confirmation dialog with extra warning: "This cookie is protected. Are you sure you want to delete it?" Requires explicit confirm. | P1 |
| CT-47 | Protection | Hit 5-cookie limit | Protect 5 cookies, attempt to protect a 6th | Paywall soft banner (T15): "Free tier allows 5 protected cookies." 6th cookie not protected. | P0 |
| CT-48 | Protection | External modification | Protect a cookie, then modify it via browser DevTools or another extension | Extension detects the change via `chrome.cookies.onChanged` and re-sets the cookie to its protected value (Pro: automatic restore; Free: notification only). | P2 |

### 2.2 Profiles Tab

| ID | Feature | Test Case | Steps | Expected | Priority |
|----|---------|-----------|-------|----------|----------|
| PR-01 | Save profile | First profile | Click "Save Current as Profile", enter name "Admin Login", save | Profile card appears with name, domain, cookie count, timestamp. Usage counter: "1/2 profiles used". | P0 |
| PR-02 | Save profile | Second profile | Save a second profile named "Guest User" | Two profile cards displayed. Counter: "2/2 profiles used" (danger red). | P0 |
| PR-03 | Save profile | Third profile (paywall) | Attempt to save a 3rd profile | Hard block modal (T1): "Pro found 2 profiles worth keeping." CTA: "Unlock Unlimited Profiles." Save is blocked. | P0 |
| PR-04 | Load profile | Overwrite confirmation | Click "Load" on a profile for the current domain | Confirmation dialog: "Loading this profile will replace all current cookies for [domain]. Continue?" On confirm: all current cookies replaced with profile cookies. | P0 |
| PR-05 | Load profile | Different domain | Load a profile saved for `staging.example.com` while on `example.com` | Warning: "This profile was saved for staging.example.com. Load anyway?" On confirm: cookies set for the profile's original domain, NOT the current domain. | P1 |
| PR-06 | Load profile | Empty profile | Load a profile that was saved when the domain had 0 cookies | All cookies for current domain are deleted. Domain now has 0 cookies. Confirm dialog warns: "This profile contains 0 cookies. Loading will clear all current cookies." | P1 |
| PR-07 | Load profile | Profile with 500 cookies | Load a profile containing 500 cookies | All 500 cookies set via batch `chrome.cookies.set()`. Progress indicator shown during load. Total time under 10 seconds. | P2 |
| PR-08 | Delete profile | Delete existing | Click Delete on a profile, confirm | Profile card removed. Counter decrements. Profile data removed from `chrome.storage.local`. | P0 |
| PR-09 | Edit profile | Rename | Click Edit on a profile, change name, save | Card updates with new name. Storage updated. | P1 |
| PR-10 | Empty state | No profiles saved | Open Profiles tab with no saved profiles | Empty state illustration: "Save your cookies as profiles to switch between accounts, environments, or test states with one click." CTA: "Save Current Cookies". | P0 |

### 2.3 Rules Tab

| ID | Feature | Test Case | Steps | Expected | Priority |
|----|---------|-----------|-------|----------|----------|
| RU-01 | Create rule | First rule | Click "+ Add Rule", configure pattern `*.tracking.com`, trigger "On tab close", save | Rule card appears with pattern, trigger, enabled toggle. Counter: "1/1 rule created". | P0 |
| RU-02 | Create rule | Second rule (paywall) | Attempt to add a 2nd rule | Hard block modal (T2): "Your first rule is already cleaning." CTA: "Automate Everything." | P0 |
| RU-03 | Rule execution | Tab close trigger | Create rule for `*.example.com` on tab close. Open `example.com`, close the tab. | Background service worker matches the closed tab's URL against the rule pattern. Cookies matching `*.example.com` are deleted. Verify via `chrome.cookies.getAll()`. | P0 |
| RU-04 | Rule execution | Timer trigger (Pro) | Create a timer-based rule with 5-minute interval | `chrome.alarms` alarm registered. After 5 minutes, cookies matching the pattern are deleted. Verify alarm fires and cookies removed. | P1 |
| RU-05 | Rule exceptions | Exception list | Create rule for `*.example.com` with exception "session_id" | All cookies except `session_id` are deleted when rule fires. Verify `session_id` cookie persists. | P1 |
| RU-06 | Rule toggle | Disable rule | Toggle the rule OFF via the switch | Rule stops executing. Tab close no longer triggers deletion. Alarm is cleared (for timer rules). | P0 |
| RU-07 | Rule toggle | Re-enable rule | Toggle rule back ON | Rule resumes execution. Alarm re-registered (for timer rules). | P1 |
| RU-08 | Rule deletion | Delete rule | Delete the rule, confirm | Rule card removed. Counter resets to "0/1 rule created". Associated alarm cleared. | P1 |
| RU-09 | Rule patterns | Glob wildcard | Create rule with pattern `*.ads.*` | Matches domains like `cdn.ads.doubleclick.net`. Verify by opening a matching domain, closing the tab, and checking cookies are deleted. | P1 |
| RU-10 | Empty state | No rules | Open Rules tab with no rules | Description text: "Automatically clean cookies based on your rules." CTA: "+ Add Rule". | P0 |

### 2.4 Health Tab

| ID | Feature | Test Case | Steps | Expected | Priority |
|----|---------|-----------|-------|----------|----------|
| HE-01 | Health score | All secure cookies | Open Health tab on a site with all httpOnly, secure, sameSite=Strict cookies, no third-party, short expiry | Score: A+ (95-100). Badge color: green. | P1 |
| HE-02 | Health score | Mixed security | Site with some insecure, some httpOnly, mixed sameSite | Score: B/B+ range (60-79). Badge color: amber. | P1 |
| HE-03 | Health score | Poor security | Site with no httpOnly, no secure, long expiry, many third-party cookies | Score: D/F range (0-39). Badge color: red. Extension icon badge shows risk count. | P1 |
| HE-04 | Health score | 0 cookies | Open Health tab on a domain with no cookies | Score: N/A or "No cookies to analyze." No grade displayed. | P1 |
| HE-05 | Health details | Blurred panel (free) | Click on the risk breakdown cards | Details are blurred with `filter: blur(4px)`. "Unlock Details" overlay visible. Clicking triggers soft inline banner (T5). | P0 |
| HE-06 | GDPR scan | First free scan | Click "Run GDPR Scan" for the first time | Scan executes. Top 3 cookies classified (Necessary, Functional, Analytics, Marketing). Remaining results blurred. Text: "0/1 GDPR scans used" updates to "1/1 GDPR scans used". | P0 |
| HE-07 | GDPR scan | Second scan (paywall) | Click "Run GDPR Scan" a second time (any domain) | Hard block modal (T6): "Your first scan found [X] issues." CTA: "Unlock Unlimited Scans." Scan does NOT execute. | P0 |
| HE-08 | GDPR scan | Offline | Attempt GDPR scan without network | Error message: "Unable to run compliance scan. Please check your internet connection." No scan count consumed. | P1 |
| HE-09 | Score badge | Icon badge update | Navigate between sites with different health scores | Extension icon badge updates to reflect current site's score. Badge text and color change dynamically. | P1 |

### 2.5 Paywall System

| ID | Feature | Test Case | Steps | Expected | Priority |
|----|---------|-----------|-------|----------|----------|
| PW-01 | T1 trigger | 3rd profile save | Save 2 profiles, attempt 3rd | Hard block modal with blurred background. Copy: "Pro found 2 profiles worth keeping." | P0 |
| PW-02 | T2 trigger | 2nd rule create | Create 1 rule, attempt 2nd | Hard block modal. Copy: "Your first rule is already cleaning." Dynamic "[X] cookies removed" count. | P0 |
| PW-03 | T3 trigger | Export >25 cookies | Export domain with 26+ cookies | Soft inline banner. Export limited to 25 cookies. | P0 |
| PW-04 | T5 trigger | Health details click | Click blurred health breakdown | Soft inline banner below blurred panel. | P0 |
| PW-05 | T6 trigger | 2nd GDPR scan | Run scan twice | Hard block modal on second attempt. | P0 |
| PW-06 | T7 trigger | Regex search | Type `/session.*/` or toggle regex icon | Soft inline banner. Regex not executed for free tier. | P1 |
| PW-07 | T13 trigger | Non-JSON export | Select Netscape, CSV, or Header String | Soft inline banner. Locked format not downloaded. | P1 |
| PW-08 | T15 trigger | 6th whitelist entry | Add 5 entries, attempt 6th | Soft inline banner. 6th entry not saved. | P1 |
| PW-09 | Modal dismiss | Escape key | Press Escape on a hard block modal | Modal closes. Dismissal logged. 48-hour cooldown begins for that trigger. | P0 |
| PW-10 | Modal dismiss | "Maybe later" click | Click "Maybe later" text | Same as Escape. Modal closes. | P0 |
| PW-11 | Dismiss cooldown | Re-trigger within 48 hours | Dismiss T1 modal, save 2 profiles, attempt 3rd profile again within 48 hours | No modal appears. Profile still not saved (limit enforced) but no paywall interruption. Soft messaging instead. | P0 |
| PW-12 | Dismiss 3x switch | Dismiss hard block 3 times | Dismiss T1 modal on 3 separate occasions (each after 48-hour cooldown) | 4th trigger switches permanently to soft inline banner instead of hard modal. | P1 |
| PW-13 | Session limit | Multiple hard blocks | Trigger T1 (dismissed), then trigger T2 in same session | Second hard block should NOT appear (max 1 hard block per session). T2 queued for next session. | P1 |
| PW-14 | Banner limit | 4 soft banners | Trigger T3, T5, T7, T13 in single session | Only first 3 banners shown (max 3 soft banners per session). 4th trigger silently skipped. | P1 |
| PW-15 | CTA click | Upgrade button on modal | Click "Unlock Unlimited Profiles" CTA | New tab opens with correct URL: `https://zovo.app/signup?ref=cookie-manager&trigger=T1&plan=starter` (or `/upgrade` if account exists). Event logged. | P0 |
| PW-16 | Post-upgrade unlock | Complete purchase | Simulate upgrade by writing `zovo_auth.tier: "pro"` to chrome.storage.sync | Confetti animation plays (1.9s total). Lock icons fade out. Blur panels clear. Badge transitions from "FREE" to "PRO". Welcome toast appears. All limits removed. | P0 |
| PW-17 | Downgrade | Subscription lapses | Set `zovo_auth.tier` back to `"free"` | 7-day read-only grace period for Pro features. After 7 days: excess profiles/rules locked but not deleted. Counter shows "8 profiles (2 accessible)". | P1 |
| PW-18 | T17 trigger | 7-day engagement nudge | Open extension on 5 separate days within 7 days (no prior paywall shown) | Feature discovery pulsing blue dot appears on Pro badge. Subtle, non-blocking. | P2 |

### 2.6 Context Menu

| ID | Feature | Test Case | Steps | Expected | Priority |
|----|---------|-----------|-------|----------|----------|
| CM-01 | View cookies | Right-click menu | Right-click any page, select "Zovo Cookie Manager" > "View cookies for this site" | Popup opens to Cookies tab scoped to current domain. | P1 |
| CM-02 | Quick delete | Delete all cookies | Right-click > "Quick delete all cookies" | Chrome notification: "Delete all cookies for example.com?" On confirm: all cookies deleted. Undo available for 5 seconds. | P1 |
| CM-03 | Save as profile | Under limit | Right-click > "Save as profile" | Notification prompt for profile name. Profile saved. | P1 |
| CM-04 | Save as profile | Over limit | Right-click > "Save as profile" when 2 profiles exist | Notification: "Upgrade to save more profiles." Profile NOT saved. | P1 |
| CM-05 | Copy as cURL | Generate command | Right-click > "Copy cookies as cURL" | cURL command with `-b "name=value; ..."` syntax copied to clipboard. Notification: "cURL command copied." | P1 |

### 2.7 Settings / Options Page

| ID | Feature | Test Case | Steps | Expected | Priority |
|----|---------|-----------|-------|----------|----------|
| ST-01 | Theme | Switch to dark mode | Open settings, select "Dark", return to popup | Popup renders in dark mode. Colors match dark palette spec. Persisted in `chrome.storage.sync`. | P0 |
| ST-02 | Theme | System detection | Set OS to dark mode, theme set to "System" | Extension follows OS theme. Switching OS theme toggles extension theme in real time. | P1 |
| ST-03 | Theme | Persistence | Set dark mode, close and reopen popup | Dark mode persists across sessions. | P0 |
| ST-04 | Default tab | Change default | Set default tab to "Profiles" | Next popup open shows Profiles tab first instead of Cookies. | P2 |
| ST-05 | Delete confirm | Disable confirmation | Uncheck "Confirm before delete" | Deleting cookies no longer shows confirmation dialog. Deletion is immediate. | P2 |

---

## 3. Edge Case Testing Matrix

### 3.1 Browser and Platform Variations

| ID | Environment | Test Focus | Expected | Priority |
|----|-------------|-----------|----------|----------|
| BV-01 | Chrome Stable (latest) | Full feature suite | All features work. This is the primary target. | P0 |
| BV-02 | Chrome Beta | Forward compatibility | Core features work. Note any deprecation warnings in console. | P1 |
| BV-03 | Chrome Canary | Early warning | Document any breaking changes. Not a release blocker. | P2 |
| BV-04 | Microsoft Edge (Chromium) | Cross-browser | Core CRUD, profiles, rules, health tab functional. Edge-specific storage behavior verified. | P1 |
| BV-05 | Brave Browser | Privacy features | Verify Brave Shields do not interfere with `chrome.cookies` API. Test with shields up and down. | P1 |
| BV-06 | Opera | Sidebar integration | Core features work. Side panel may differ from Chrome. | P2 |
| BV-07 | Vivaldi | Tab stacking | Core features work. Verify tab close events fire correctly with stacked tabs. | P2 |
| BV-08 | macOS | Platform | UI renders correctly. System theme detection works with macOS appearance settings. | P0 |
| BV-09 | Windows 10/11 | Platform | UI renders correctly. Font rendering differences from macOS. Scrollbar styling. | P1 |
| BV-10 | Linux (Ubuntu) | Platform | Core features work. System theme detection may not work on all desktop environments. | P2 |

### 3.2 Cookie Edge Cases

| ID | Scenario | Test Steps | Expected | Priority |
|----|----------|-----------|----------|----------|
| CE-01 | Empty cookie value | Create/view cookie with value `""` | Displays as empty. Editable. No crash. Value field shows empty input, not "undefined" or "null". | P1 |
| CE-02 | Cookie value >4KB | Create cookie with 5000-character value | Browser may reject (4096 byte limit per cookie). Extension should display the error from `chrome.cookies.set()`, not crash. | P1 |
| CE-03 | Special chars in name | Cookie named `my=cookie` or `my;cookie` or `my cookie` | Names with `=`, `;`, space are technically invalid per RFC 6265 but some browsers accept them. Extension should display without crash and escape properly. | P1 |
| CE-04 | Unicode cookie name | Cookie with name `cookie_` or CJK characters | Renders correctly with proper encoding. Search matches Unicode characters. | P2 |
| CE-05 | Very long expiration | Cookie expires in year 2099 | Expiry field displays `2099-12-31` or similar. Date picker handles far-future dates. No overflow. | P2 |
| CE-06 | Already expired cookie | Cookie with expiration date in the past | Cookie should not exist in `chrome.cookies.getAll()` (browser auto-removes expired cookies). If somehow present, display with "Expired" badge in red. | P2 |
| CE-07 | HttpOnly cookie | View an HttpOnly cookie | Visible in list (chrome.cookies API can read HttpOnly cookies). Editable via the API. Verify "HttpOnly" pill renders. | P0 |
| CE-08 | Secure cookie on HTTP | Navigate to HTTP page, view secure cookies | Secure cookies for the domain are still visible via `chrome.cookies.getAll()`. Cannot create new secure cookies for HTTP domain -- validation error. | P1 |
| CE-09 | SameSite=None without Secure | Cookie with sameSite=None but secure=false | Modern browsers reject this combination. Extension should warn: "SameSite=None requires Secure flag." If editing, enforce Secure=true when SameSite=None. | P1 |
| CE-10 | Partitioned cookies (CHIPS) | View/edit a partitioned cookie | If `chrome.cookies` API supports partitioned cookies (Chrome 114+), display the partition key. If not, document the limitation. | P2 |
| CE-11 | Third-party cookies in iframes | Open a page with third-party iframes | Third-party cookies visible when "Third-party" filter is active. Domain grouping correctly separates first-party and third-party. | P1 |
| CE-12 | Cookie set by service worker | Cookie set via `Set-Cookie` header from a service worker response | Visible in cookie list. No difference from server-set cookies in display. | P2 |
| CE-13 | Duplicate cookie names | Two cookies named `id` on different paths (`/` and `/api`) | Both displayed as separate rows. Path column distinguishes them. Editing one does not affect the other. | P1 |
| CE-14 | Cookie with newline in value | Cookie value containing `\n` or `\r\n` | Value displayed correctly in monospace field. No layout break. Newlines rendered as visible characters or escaped. | P2 |

### 3.3 User Behavior Edge Cases

| ID | Scenario | Test Steps | Expected | Priority |
|----|----------|-----------|----------|----------|
| UB-01 | Double-click Save | Rapidly click Save button twice when editing a cookie | Only one `chrome.cookies.set()` call fires. Button disables or debounces after first click. No duplicate cookies created. | P0 |
| UB-02 | Spam delete button | Rapidly click delete on multiple cookies | Each delete processes sequentially. No race conditions. Final state has all targeted cookies removed. | P1 |
| UB-03 | Paste 10KB value | Paste an extremely long string (>10KB) into cookie value field | Input field accepts the value. Performance does not degrade. Attempting to save may fail (browser 4KB limit) with a clear error. Input field does not freeze the popup. | P1 |
| UB-04 | XSS in cookie value | Set cookie value to `<script>alert(1)</script>` | Value renders as literal text. No script execution. No DOM injection. | P0 |
| UB-05 | SQL injection in cookie name | Set cookie name to `'; DROP TABLE cookies; --` | Name renders as literal text. No backend database impact (extension uses chrome.storage, not SQL). | P1 |
| UB-06 | Navigate away and return | Open popup, navigate to different tab (popup closes), return to original tab, reopen popup | Popup reloads with fresh cookie data for the new active tab. No stale data from previous session. | P0 |
| UB-07 | chrome:// page | Open popup on `chrome://settings` or `chrome://extensions` | Graceful handling: "Cookie management is not available for browser internal pages." No crash. No error in console. | P0 |
| UB-08 | file:// page | Open popup on a local `file:///path/to/file.html` | Either shows cookies for the file:// origin (if any) or displays: "Cookie management is not available for file:// pages." | P1 |
| UB-09 | about:blank | Open popup on `about:blank` | Displays: "No domain detected." or equivalent. No crash. | P1 |
| UB-10 | Multiple browser windows | Open popup in window A and window B simultaneously | Each popup shows cookies for its own active tab. Edits in one popup reflected when the other popup reopens. No data corruption. | P1 |
| UB-11 | Incognito mode | Open popup in an incognito window | Uses the incognito cookie store (separate from regular). Cookies displayed are incognito-only. Profiles saved in incognito are accessible only in incognito (or warn about cross-store implications). | P1 |
| UB-12 | Guest mode | Open extension in Chrome guest profile | Extension functions with empty state (no synced data). Free tier enforced. No cross-profile data leakage. | P2 |
| UB-13 | Rapid tab switching | Open popup, rapidly switch between 10 tabs | Popup refreshes cookie data for each new active tab. No race condition where stale data from tab A displays when tab B is active. Verify debouncing. | P1 |
| UB-14 | Extension popup during page load | Open popup while a page is still loading and setting cookies | Cookie list may be incomplete initially. Should auto-refresh when page finishes loading (or provide a manual refresh button). | P2 |

### 3.4 System and Infrastructure Edge Cases

| ID | Scenario | Test Steps | Expected | Priority |
|----|----------|-----------|----------|----------|
| SY-01 | Offline: auth check fails | Disconnect network, open extension with Pro tier cached | Pro features remain available for 72 hours (grace period). Banner: "Your subscription could not be verified. Features will remain available for 72 hours." | P0 |
| SY-02 | Offline: grace period expires | Stay offline for >72 hours, reopen extension | Reverts to free tier. Non-blocking banner: "Your Zovo subscription could not be verified. Please check your connection." Pro data preserved but locked. | P0 |
| SY-03 | Slow network: API timeout | Simulate 10-second latency on `/auth/verify` | Request times out gracefully. Grace period applies. No UI freeze. Retry queued via exponential backoff. | P1 |
| SY-04 | chrome.storage.local full | Fill `chrome.storage.local` to near 10MB limit, then save a profile | Graceful error: "Storage is full. Please delete some profiles or data to continue." No silent data loss. No crash. | P1 |
| SY-05 | chrome.storage.sync full | Fill `chrome.storage.sync` to near 100KB limit | Settings/auth writes fail gracefully. Error message. Extension falls back to local storage for settings. | P2 |
| SY-06 | Extension update during popup | Simulate extension update while popup is open | Popup may close/reload. On reopen, data integrity verified. No storage corruption. Migration logic runs if schema changed. | P1 |
| SY-07 | Service worker termination | Allow service worker to idle for >30 seconds, then trigger a tab-close rule | Service worker wakes up via the `chrome.tabs.onRemoved` event. Rule executes correctly despite worker restart. Global state reconstructed from `chrome.storage`. | P0 |
| SY-08 | Multiple Chrome profiles | Install extension in 2 separate Chrome profiles | Each profile has independent storage, independent free tier limits, independent auth state. No cross-profile data leakage. | P1 |
| SY-09 | Corrupted storage: JSON parse error | Manually corrupt `chrome.storage.local` data (invalid JSON in profiles key) | Extension detects parse error, logs it, and either resets the corrupted key to defaults or shows: "Some data could not be loaded. Resetting to defaults." No crash. | P0 |
| SY-10 | Alarm persistence | Restart Chrome, verify alarms | `chrome.runtime.onStartup` re-registers any missing alarms. License check, analytics flush, and rule timer alarms all active after restart. | P1 |
| SY-11 | Rate limiting: API 429 | Trigger many API calls to hit rate limit | Extension receives 429 response. Implements exponential backoff (1s, 2s, 4s, 8s, max 60s). Respects `Retry-After` header. No error shown to user (transparent retry). | P1 |
| SY-12 | Server error: 500 | Zovo API returns 500 | Extension retries 3 times with backoff. After 3 failures, queues operation in `sync_queue`. User sees: "Unable to sync. Changes saved locally." | P1 |

### 3.5 Data Integrity Edge Cases

| ID | Scenario | Test Steps | Expected | Priority |
|----|----------|-----------|----------|----------|
| DI-01 | Fresh install | Install extension for first time | All tabs show appropriate empty states. No errors in console. Default settings applied. Onboarding triggers. | P0 |
| DI-02 | Profile for deleted domain | Save profile for `test.example.com`, then visit site months later when domain no longer sets cookies | Profile still loadable. Cookies from profile are set on the domain even if domain currently has 0 cookies. | P1 |
| DI-03 | Import with duplicates | Import file containing two cookies with identical name+domain+path | Only one cookie persists (last write wins per browser behavior). No error. No duplicate rows in display. | P2 |
| DI-04 | Export filename | Export cookies from domain `sub.example.com` | Filename: `cookies-sub.example.com-2026-02-11.json`. No special characters that break filesystem (no `:`, `?`, `*`, `<`, `>`, `|`, `"`). | P1 |
| DI-05 | Large profile load | Load a profile with 500 cookies on a slow machine | Progress indicator visible. Operation does not freeze UI. If any individual cookie set fails, report the failure count: "Loaded 498/500 cookies (2 failed)." | P2 |
| DI-06 | Concurrent writes | Two popup instances (different windows) both save a profile simultaneously | No data corruption. Last write wins or merge conflict detected. Both profiles ultimately saved. | P2 |
| DI-07 | Storage migration | Update extension from v1.0 to v1.1 with storage schema change | Migration runs in `chrome.runtime.onInstalled` (reason: "update"). Old data transformed to new schema. No data loss. Rollback plan documented. | P1 |

---

## 4. Bug Report Template

All bugs found during development, QA, or post-launch must use this template. File in GitHub Issues with the label `bug`.

```markdown
## Bug Report

**ID:** BUG-[auto-increment]
**Severity:** Critical / High / Medium / Low
**Priority:** P0 / P1 / P2 / P3
**Component:** Cookies Tab | Profiles Tab | Rules Tab | Health Tab | Paywall | Settings | Service Worker | Storage | Auth | Export/Import | Context Menu | DevTools
**Reporter:** [name]
**Date:** [YYYY-MM-DD]
**Version:** [extension version]
**Browser:** [Chrome 122 / Edge 122 / Brave 1.63 / etc.]
**OS:** [macOS 15.3 / Windows 11 / Ubuntu 24.04]

### Summary
[One sentence describing the bug]

### Steps to Reproduce
1. [Step 1]
2. [Step 2]
3. [Step 3]

### Expected Behavior
[What should happen]

### Actual Behavior
[What actually happens]

### Screenshots / Video
[Attach screenshots or screen recording]

### Console Errors
[Paste any console errors from the extension popup or service worker]

### Frequency
Always / Intermittent (X out of Y attempts) / Once

### Workaround
[If known, how users can work around this bug]

### Regression
[Was this working before? If so, which version/commit broke it?]

### Impact
- Users affected: [All free / All Pro / Specific scenario]
- Data loss: Yes / No
- Workaround available: Yes / No
```

**Severity Definitions:**

| Severity | Definition | Response Time | Example |
|----------|-----------|---------------|---------|
| Critical | Data loss, security vulnerability, extension crash, complete feature failure | Fix within 4 hours, hotfix release within 24 hours | Cookies deleted without confirmation, XSS in cookie value display, popup white screen |
| High | Feature partially broken, paywall bypass, incorrect data display | Fix within 24 hours, release within 48 hours | Wrong cookie count, profile fails to load, export produces malformed JSON |
| Medium | UI glitch, minor functionality issue, edge case failure | Fix within 1 week | Tooltip misaligned, filter chip doesn't deselect, dark mode color wrong on one element |
| Low | Cosmetic issue, documentation error, enhancement request | Schedule for next release | Typo in paywall copy, animation timing slightly off, icon alignment 1px off |

---

## 5. Test Suites

### 5.1 Smoke Test (5 Minutes)

Run after every build. If any check fails, the build is broken. Do not proceed to further testing.

| # | Check | Pass/Fail |
|---|-------|-----------|
| 1 | Popup opens without crash on any website. Header shows domain and cookie count. | |
| 2 | Cookie list displays all cookies for the current domain. At least one cookie visible on a typical site. | |
| 3 | Expand a cookie row: all fields render (name, value, domain, path, expiry, flags). No "undefined" or blank fields for populated cookies. | |
| 4 | Edit a cookie value and Save. Reopen popup. Changed value persists. | |
| 5 | Create a new cookie via "+ Add". Cookie appears in list and in browser DevTools Application > Cookies. | |
| 6 | Delete a cookie. Cookie disappears from list and from DevTools. | |
| 7 | Search filters cookie list in real time. Clearing search restores full list. | |
| 8 | Export JSON downloads a file. File is valid JSON and contains cookie objects. | |
| 9 | Switch to Profiles tab: empty state renders or saved profiles display. Switch to Rules tab: same. Switch to Health tab: score renders or empty state. | |
| 10 | Toggle dark mode in settings. Popup re-renders in dark theme without visual artifacts. Toggle back to light. | |

### 5.2 Full Regression (30 Minutes)

Run before every release candidate. Ordered by priority.

**Phase 1: Core CRUD (8 minutes)**
1. Run all CT-01 through CT-22 (view, edit, create, delete)
2. Verify cookie count badge on extension icon updates after each operation

**Phase 2: Search, Filter, Export, Import (7 minutes)**
3. Run CT-23 through CT-27 (search)
4. Run CT-28 through CT-32 (filter)
5. Run CT-33 through CT-37 (export, including paywall trigger)
6. Run CT-38 through CT-43 (import, including error cases)

**Phase 3: Profiles and Rules (5 minutes)**
7. Run PR-01 through PR-04 (save, load with confirmation)
8. Run PR-08, PR-10 (delete, empty state)
9. Run RU-01, RU-03, RU-06 (create, execute, toggle)

**Phase 4: Paywall Verification (5 minutes)**
10. Run PW-01 through PW-05 (top 5 triggers fire correctly)
11. Run PW-09, PW-10 (dismiss behavior)
12. Run PW-15 (CTA opens correct URL)

**Phase 5: Health Tab (3 minutes)**
13. Run HE-01 or HE-02 (score calculation)
14. Run HE-05, HE-06 (blur treatment, GDPR scan)

**Phase 6: Edge Cases (2 minutes)**
15. Run UB-04 (XSS in cookie value -- security critical)
16. Run UB-07 (chrome:// page handling)
17. Run SY-09 (corrupted storage recovery)

### 5.3 Release Candidate Checklist

Final gate before Chrome Web Store submission. Every item must pass.

**Build and Packaging:**
- [ ] Production build completes without errors or warnings
- [ ] Bundle size within Chrome Web Store limits (no single file >10MB)
- [ ] `manifest.json` version number incremented
- [ ] No `console.log` statements in production bundle (verify with grep)
- [ ] No source maps included in production `.zip`
- [ ] All permissions in manifest match the documented and justified list (SEC-19)
- [ ] CSP configured correctly in manifest (SEC-12)

**Functional:**
- [ ] Smoke test passes (all 10 checks)
- [ ] Full regression passes (all phases)
- [ ] Free tier: all limits enforced correctly (2 profiles, 1 rule, 25 export cookies, 5 protected, 1 GDPR scan, 5 whitelist/blacklist)
- [ ] Pro tier: all limits removed when valid license present
- [ ] Paywall triggers T1, T2, T3, T5, T6 fire at correct moments
- [ ] Upgrade flow: CTA button opens correct URL with correct query parameters
- [ ] Post-upgrade: license sync updates UI within 5 seconds
- [ ] Downgrade: 7-day grace period, then graceful lock (no data loss)
- [ ] Dark mode and light mode fully functional with no contrast issues

**Security:**
- [ ] SEC-01 through SEC-20 all passing
- [ ] XSS test with `<script>alert(1)</script>` in cookie name and value -- no execution
- [ ] Import with malformed JSON produces error, not crash
- [ ] No cookie values in analytics events (audit `analytics_queue` in storage)

**Performance:**
- [ ] Popup opens in <200ms (p95) on a domain with 50 cookies
- [ ] Memory usage under 50MB after 30-minute session with continuous use
- [ ] Virtualized list handles 500+ cookies without jank
- [ ] Service worker does not crash over a 24-hour period with active rules and alarms

**Compatibility:**
- [ ] Chrome Stable (latest): full suite passes
- [ ] Microsoft Edge (latest): core features pass
- [ ] Brave (latest): core features pass (shields up and down)
- [ ] Incognito mode: separate cookie store, no data leakage

**Data Integrity:**
- [ ] Fresh install: clean state, no errors, onboarding triggers
- [ ] Extension update from previous version: storage migration succeeds, no data loss
- [ ] Offline for 72 hours: grace period works, then graceful downgrade
- [ ] Corrupted storage: recovery without crash

**Chrome Web Store Compliance:**
- [ ] Extension description under 132 characters for short description
- [ ] 5 screenshots at 1280x800 prepared
- [ ] Privacy policy URL accessible and accurate
- [ ] Single-purpose justification documented (cookie management)
- [ ] All requested permissions justified in CWS submission notes
- [ ] No remote code execution (no eval, no external scripts, no WASM from external sources)

---

## Appendix A: Test Data Generation

For consistent testing, use the following synthetic cookie sets.

**Minimal set (1 cookie):**
```json
[{"name": "session_id", "value": "abc123", "domain": ".testdomain.com", "path": "/", "secure": true, "httpOnly": true, "sameSite": "lax", "expirationDate": 1773532800}]
```

**Standard set (10 cookies):** Mix of session and persistent, first-party and third-party, various sameSite values, varying expiry lengths.

**Stress set (1000 cookies):** Programmatically generated with incrementing names (`cookie_001` through `cookie_1000`), randomized domains, paths, and flags. Use a test page that sets these via JavaScript.

**Adversarial set (XSS/injection):**
```json
[
  {"name": "<script>alert(1)</script>", "value": "test", "domain": ".test.com", "path": "/"},
  {"name": "normal", "value": "<img src=x onerror=alert(1)>", "domain": ".test.com", "path": "/"},
  {"name": "'; DROP TABLE cookies; --", "value": "inject", "domain": ".test.com", "path": "/"},
  {"name": "unicode_test", "value": "\u0000\u001f\uffff", "domain": ".test.com", "path": "/"}
]
```

## Appendix B: Performance Benchmarks

| Metric | Target | Method | Blocker? |
|--------|--------|--------|----------|
| Popup open time | <200ms (p95) | `performance.now()` from script start to first contentful paint | Yes |
| Cookie list render (50 cookies) | <100ms | Measure from data fetch to DOM render complete | Yes |
| Cookie list render (500 cookies) | <300ms | Same, with virtualized list | Yes |
| Cookie list render (1000 cookies) | <500ms | Same, with virtualized list | No (warning) |
| Profile save | <200ms | Time from button click to storage write confirmation | Yes |
| Profile load (20 cookies) | <500ms | Time from Load click to all cookies set | Yes |
| Profile load (500 cookies) | <5s | Same, with progress indicator | No |
| Export JSON (25 cookies) | <100ms | Click to file download initiation | Yes |
| Memory (idle) | <20MB | Chrome Task Manager after popup open, no interaction | Yes |
| Memory (active, 30 min session) | <50MB | Chrome Task Manager after 30 minutes of active use | Yes |
| Service worker wake time | <100ms | Time from event to first line of handler execution | No (warning) |

---

*End of QA Testing & Security Audit Plan. This document covers 127 discrete test cases across 7 feature areas, 20 security checks, 14 cookie edge cases, 14 user behavior edge cases, 12 system edge cases, and 7 data integrity edge cases. Every scenario documented here is a potential 1-star review prevented.*
