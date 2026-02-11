# Zovo Cookie Manager: Security Hardening & Privacy Verification

**Agent 4 -- Security Specialist**
**Date:** 2026-02-11
**Status:** Pre-Development Security Specification
**Scope:** Permission audit, hardening specs, privacy verification, threat model, test cases, compliance

---

## 1. Permission Audit

### 1.1 Permission Justification Matrix

| Permission | Justification | Risk Level | Mitigation | Can Be Optional? |
|------------|---------------|------------|------------|------------------|
| `cookies` | Core functionality. Read, write, delete cookies via `chrome.cookies` API. Listen to `onChanged` for real-time monitoring. Without this the extension has zero purpose. | **High** -- grants read/write to all browser cookies regardless of domain | Scope all operations to user-initiated actions. Never enumerate all cookies silently; always filter by active tab domain unless the user explicitly requests cross-domain views (Pro bulk operations). Log every write/delete operation to local audit trail. | No -- required at install |
| `activeTab` | Access the current tab URL to scope cookie display to the active domain. This is the privacy-safe alternative to `<all_urls>`. | **Low** -- only grants access to the tab the user explicitly clicks on | No additional mitigation needed. This is the correct minimum-privilege pattern. Ensure no code path upgrades this to persistent host access. | No -- required at install |
| `storage` | Persist settings, profiles, rules, usage counters, license cache, and analytics queue via `chrome.storage.local` and `chrome.storage.sync`. | **Low** -- data stays within Chrome's sandboxed extension storage | Encrypt sensitive fields (auth tokens, cookie vault). Enforce size budgets to prevent storage exhaustion. Validate all data read from storage before use (treat as untrusted). | No -- required at install |
| `tabs` | Read tab URLs for domain filtering, detect `onRemoved` for auto-delete triggers, identify incognito context for cookie store scoping. | **Medium** -- can read URLs of all open tabs | Never store full tab URLs. Extract only the registrable domain (eTLD+1). Never transmit tab URLs externally. Drop URL data from memory immediately after domain extraction. | No -- required for auto-delete rules |
| `alarms` | Schedule background timers: auto-delete rule execution, license validation (24h), analytics batch flush (5min), sync polling (15min), monthly usage reset. MV3 service workers cannot reliably use `setInterval`. | **Low** -- only schedules wake-ups for the extension itself | Cap alarm frequency: minimum 5-minute interval for any user-created rule. Validate alarm names on fire to prevent injection of unexpected alarm handlers. | No -- required at install |
| `notifications` | Cookie change alerts and rule execution confirmations for Pro users. | **Low** -- can only display browser notifications | Never include cookie values in notification text. Show only domain and action type (e.g., "3 cookies deleted for example.com"). | Yes -- request at runtime when user enables monitoring |
| `clipboardWrite` | Copy cookie values, cURL commands, and exported data to clipboard. Used in every core workflow. | **Low** -- write-only; cannot read clipboard | Clear sensitive clipboard content after 60 seconds via a timed callback (best-effort; Chrome does not guarantee this). Warn user when copying sensitive values. | No -- required for core export/copy workflows |
| `identity` | Google OAuth sign-in for Zovo membership via `chrome.identity.launchWebAuthFlow`. | **Medium** -- initiates OAuth flows that exchange tokens | Use PKCE for all OAuth flows. Validate redirect URLs. Never store the raw Google OAuth token; exchange it immediately for a Zovo JWT and discard. Request only the `email` and `profile` OAuth scopes. | Yes -- request at runtime when user clicks "Sign in to Zovo" |
| `offscreen` | Create offscreen documents for clipboard operations in MV3 contexts where `document.execCommand('copy')` is unavailable from the service worker. | **Low** -- creates a hidden DOM page | Close offscreen documents immediately after clipboard operation completes. Set a 5-second timeout to force-close if the operation hangs. | Yes -- request only when clipboard fallback is needed |
| `sidePanel` | Register extension as a Chrome side panel for Pro users. | **Low** -- provides an alternative UI surface | Same security controls as popup apply to side panel content. Validate all message passing between side panel and service worker. | Yes -- request when user selects side panel mode |

### 1.2 Manifest Security Analysis

**Host Permissions:**
The extension requests zero host permissions at install time. The `activeTab` permission grants temporary access only to the tab the user explicitly clicks on. This is critical for trust. Never add `<all_urls>`, `*://*/*`, or any broad host pattern to the manifest.

**Content Security Policy:**

```json
{
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'"
  }
}
```

Breakdown:
- `script-src 'self'` -- Only scripts bundled with the extension can execute. Blocks all inline scripts, `eval()`, `Function()`, `setTimeout` with string arguments, and any external script sources. This is the single most important XSS mitigation.
- `object-src 'none'` -- Blocks Flash, Java applets, and all plugin-based content.
- `base-uri 'none'` -- Prevents `<base>` tag injection that could redirect relative URLs.
- `form-action 'none'` -- Prevents form submissions to external origins from extension pages. All API calls must use `fetch()`.
- `frame-ancestors 'none'` -- Prevents the extension popup or options page from being embedded in an iframe (clickjacking defense).

No exceptions are needed. Preact renders via `createElement` calls, not inline scripts. All styles are loaded from bundled CSS files, so `style-src 'self'` is implicitly covered by the default fallback. If CSS-in-JS is used during development, add `style-src 'self' 'unsafe-inline'` only in development builds; strip it for production.

**web_accessible_resources:**
Set to an empty array or omit entirely. No extension resources should be accessible to web pages. The extension does not inject content scripts that require loading extension assets into web page contexts. The only content script (`cookie-banner-detect.ts`) observes the DOM and reports back via `chrome.runtime.sendMessage`; it does not load images, scripts, or stylesheets from the extension bundle.

```json
{
  "web_accessible_resources": []
}
```

If the content script ever needs to load a resource (such as a stylesheet for an injected UI element), scope the access tightly:

```json
{
  "web_accessible_resources": [{
    "resources": ["content/styles.css"],
    "matches": ["<all_urls>"],
    "use_dynamic_url": true
  }]
}
```

The `use_dynamic_url: true` flag rotates the resource URL per session, preventing fingerprinting.

**externally_connectable:**

```json
{
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
  }
}
```

Only listed Zovo extension IDs can send messages via `chrome.runtime.sendMessage` to this extension. Only `zovo.app` origins can communicate via the web messaging API (needed for the post-checkout license update flow). Never add wildcard patterns or third-party domains.

---

## 2. Security Hardening Specifications

### 2.1 Input Sanitization Rules

Every user input point is a potential injection vector. Cookie values are particularly dangerous because they are controlled by third-party websites and displayed in the extension UI.

| Input Point | Data Type | Sanitization | Validation | Max Length |
|------------|-----------|--------------|------------|-----------|
| Cookie name (edit/create) | String | Strip null bytes, escape HTML entities before rendering (`&`, `<`, `>`, `"`, `'`). Never use `innerHTML`. | Must be a valid cookie name per RFC 6265: no CTLs, no separators except allowed chars. Reject names containing `;`, `=`, whitespace, or non-ASCII outside quoted strings. | 256 chars |
| Cookie value (edit/create) | String | Escape HTML entities before rendering. Use `textContent` assignment, never `innerHTML`. Treat as opaque bytes. | Must be a valid cookie value per RFC 6265. Allow all printable ASCII except `;`, `"` (unless quoted), and `\`. Warn on binary content. | 4096 chars |
| Cookie domain (edit/create) | String | Lowercase, trim whitespace, strip leading dots for validation. | Must be a valid hostname. Reject domains containing path separators (`/`), port numbers, protocols, or query strings. Validate against the public suffix list to prevent setting cookies on TLDs. | 253 chars |
| Cookie path | String | Trim whitespace. | Must start with `/`. Reject paths containing `..`, null bytes, or query strings. | 1024 chars |
| Profile name | String | Escape HTML entities. Strip control characters. | Alphanumeric, spaces, hyphens, underscores only. Reject `<`, `>`, `"`, `'`, `&`, `/`, `\`. | 64 chars |
| Rule domain pattern | String | Escape HTML entities for display. | Must be a valid glob pattern: allow `*`, `?`, `[`, `]`, `.`, `-`, alphanumeric. Reject patterns that would match everything (standalone `*` without a dot). | 253 chars |
| Search input | String | Escape before rendering results. If regex mode (Pro), wrap in try/catch to prevent ReDoS. | Plain text: no validation needed. Regex mode: test compile with a 100ms timeout before executing against cookie list. Reject patterns longer than 200 chars in regex mode. | 200 chars |
| Import file content | JSON/Text | Parse with `JSON.parse()` inside try/catch. Validate every field of every cookie object against the schema. | Enforce max file size: 5MB. Enforce max cookie count: 10,000. Validate each cookie object has required fields (`name`, `value`, `domain`). Reject files with unexpected top-level keys. | 5MB file size |
| Auth token from OAuth | String (JWT) | Never render in the UI. Store encrypted. | Validate JWT structure (three dot-separated base64 segments). Verify signature against Zovo public key. Check `exp` claim. Reject tokens with `alg: none`. | 4096 chars |
| Message passing payloads | JSON object | Validate `sender.id` against allowlist before processing. Schema-validate every message payload. | Every message must have an `action` string field. Reject messages with unknown actions. Type-check all payload fields. Never pass message data directly to `chrome.cookies.set()` without field-by-field validation. | 1MB (Chrome limit) |

**Rendering rule:** All cookie data displayed in the UI must be rendered using Preact's default JSX escaping (which uses `textContent` under the hood) or explicit `textContent` assignment. The codebase must never use `innerHTML`, `outerHTML`, `document.write`, or `insertAdjacentHTML` with any data that originates from cookies, user input, or external sources. This rule must be enforced by an ESLint rule (`no-inner-html` or equivalent custom rule) in CI.

**ReDoS protection for regex search:** When the user enables regex mode (Pro), the search pattern is compiled inside a Web Worker or with a 100ms synchronous timeout. If compilation or first execution exceeds the timeout, the search aborts and displays "Pattern too complex." This prevents a malicious or accidental regex like `(a+)+$` from freezing the popup.

### 2.2 Storage Security

**Data classification:**

| Data | Storage Location | Encryption | Sensitivity |
|------|-----------------|------------|-------------|
| User settings (theme, defaults) | `chrome.storage.sync` | None (low sensitivity) | Low |
| Domain whitelist/blacklist | `chrome.storage.sync` | None | Low |
| Zovo auth tokens (JWT, refresh) | `chrome.storage.sync` | AES-256-GCM encrypted at rest | **Critical** |
| Cookie profiles | `chrome.storage.local` | Plain text (Free/Starter) or AES-256-GCM (Pro vault) | **High** -- profiles contain actual cookie values |
| Auto-delete rules | `chrome.storage.local` | None (rules contain patterns, not cookie data) | Low |
| Cookie cache | `chrome.storage.local` | None (ephemeral, invalidated on change) | Medium |
| License cache | `chrome.storage.local` | HMAC-signed to prevent tampering | Medium |
| Analytics queue | `chrome.storage.local` | None (contains no PII or cookie values) | Low |
| Cookie snapshots | `chrome.storage.local` | AES-256-GCM (Pro only feature) | **High** |

**AES-256-GCM encryption specification for the cookie vault:**

```
Key Derivation:
  Algorithm: PBKDF2
  Hash: SHA-256
  Salt: 16 bytes from crypto.getRandomValues()
  Iterations: 600,000 (OWASP 2023 recommendation for PBKDF2-SHA256)
  Derived key length: 256 bits

Encryption:
  Algorithm: AES-256-GCM
  IV: 12 bytes from crypto.getRandomValues() (unique per encryption)
  Additional Authenticated Data (AAD): profile ID + version number
  Tag length: 128 bits

Storage format:
  {
    v: 1,                    // Schema version for future migration
    salt: base64(salt),      // 16 bytes
    iv: base64(iv),          // 12 bytes
    ct: base64(ciphertext),  // Encrypted cookie data
    tag: base64(tag)         // 128-bit GCM auth tag
  }

Key lifecycle:
  - User enters passphrase when accessing vault
  - Key is derived via PBKDF2 and held in a closure (not global)
  - Key is zeroed from memory on popup close / side panel blur
  - Passphrase is NEVER stored, logged, or transmitted
  - Salt is unique per profile and stored alongside ciphertext
  - IV is unique per encryption operation; never reuse
```

**Auth token encryption:** The `zovo_auth` object in `chrome.storage.sync` must encrypt the `token` and `refresh_token` fields using a device-derived key. Since the extension cannot rely on a user passphrase for auth tokens (they must be available without user interaction for background license checks), derive a key from a combination of: (1) a random 32-byte secret generated on first install and stored in `chrome.storage.local` (device-specific, does not sync), and (2) the extension ID. This is not perfect (an attacker with access to `chrome.storage.local` can also read the key), but it prevents casual inspection via Chrome DevTools storage viewer and raises the bar for automated credential harvesting.

**Sensitive data cleanup on sign-out:**
1. Clear `zovo_auth` from `chrome.storage.sync`
2. Clear `license_cache` from `chrome.storage.local`
3. Clear `sync_queue` from `chrome.storage.local`
4. Clear any in-memory derived encryption keys
5. Flush and clear `analytics_queue`
6. Revoke the refresh token via `POST /auth/revoke` to the Zovo API
7. Do NOT clear profiles, rules, or settings (user data persists for re-login)

**Sensitive data cleanup on uninstall:**
Chrome automatically deletes all `chrome.storage.local` and `chrome.storage.sync` data when an extension is uninstalled. No custom cleanup code is needed. Set `chrome.runtime.setUninstallURL()` to a survey page that does NOT include any user data in the URL parameters. The URL must contain only the extension version and a random session ID for deduplication.

**Anti-tampering for license cache:**

```
HMAC computation:
  Key: 32-byte secret from chrome.storage.local (same device key as above)
  Message: JSON.stringify({ tier, validated_at, expires_at })
  Algorithm: HMAC-SHA256

On every license cache read:
  1. Recompute HMAC over the tier/validated_at/expires_at fields
  2. Compare against stored signature using timing-safe comparison
  3. If mismatch: treat as invalid, force re-validation from server
  4. If server unreachable: downgrade to free tier
```

This prevents a user from modifying `license_cache.tier` to `"pro"` in Chrome DevTools. While a sophisticated attacker could also modify the HMAC key, this raises the effort significantly and can be paired with server-side enforcement (the server validates the tier on every sync and API call).

### 2.3 Communication Security

**Message passing validation:**

Every handler for `chrome.runtime.onMessage` and `chrome.runtime.onMessageExternal` must follow this pattern:

```typescript
// In background/service-worker.ts
const ZOVO_EXTENSION_IDS: ReadonlySet<string> = new Set([
  "FORM_FILLER_ID",
  "TAB_MANAGER_ID",
  "JSON_FORMATTER_ID",
  "CLIPBOARD_ID",
]);

const VALID_ACTIONS = new Set([
  "get_cookies",
  "set_cookie",
  "delete_cookie",
  "load_profile",
  "save_profile",
  "get_tier",
  "snapshot_for_session",
  "auth_update",
]);

chrome.runtime.onMessageExternal.addListener(
  (message, sender, sendResponse) => {
    // 1. Validate sender
    if (!sender.id || !ZOVO_EXTENSION_IDS.has(sender.id)) {
      console.warn("Rejected message from unknown extension:", sender.id);
      sendResponse({ error: "unauthorized" });
      return;
    }

    // 2. Validate message schema
    if (!message || typeof message.action !== "string") {
      sendResponse({ error: "invalid_message" });
      return;
    }

    if (!VALID_ACTIONS.has(message.action)) {
      sendResponse({ error: "unknown_action" });
      return;
    }

    // 3. Process after validation -- each action has its own
    //    field-by-field payload validation
    handleValidatedMessage(message, sender, sendResponse);
    return true; // async response
  }
);
```

For messages originating from web pages (the `zovo.app` checkout flow):

```typescript
chrome.runtime.onMessageExternal.addListener(
  (message, sender, sendResponse) => {
    // Web page messages have sender.url instead of sender.id
    if (sender.url) {
      const url = new URL(sender.url);
      if (url.origin !== "https://zovo.app") {
        sendResponse({ error: "unauthorized_origin" });
        return;
      }
      // Only accept license update messages from web pages
      if (message.action !== "ZOVO_LICENSE_UPDATE") {
        sendResponse({ error: "disallowed_action" });
        return;
      }
      // Validate the token server-side before trusting it
      validateTokenWithServer(message.token).then((result) => {
        if (result.valid) {
          updateLicense(result.tier, message.token);
          sendResponse({ success: true });
        } else {
          sendResponse({ error: "invalid_token" });
        }
      });
      return true;
    }
    // ... extension-to-extension handling
  }
);
```

**API communication security:**
- All API calls must use HTTPS. Enforce this in code: reject any URL that does not start with `https://api.zovo.app/` or `https://analytics.zovo.app/`.
- Use `fetch()` with explicit headers. Set `Content-Type: application/json` and `Accept: application/json`. Never construct URLs with user-provided strings using concatenation; use the `URL` constructor.
- Certificate pinning is not available in Chrome extension `fetch()` calls. Rely on Chrome's built-in certificate validation. Monitor for certificate transparency logs on `zovo.app` domains.
- Set reasonable timeouts: 10 seconds for API calls, 30 seconds for sync operations.
- Implement retry with exponential backoff (1s, 2s, 4s, 8s, max 60s) and jitter for server errors.

**OAuth flow security:**
- Use PKCE (Proof Key for Code Exchange) with `chrome.identity.launchWebAuthFlow`. Generate a cryptographic `code_verifier` (43-128 chars from unreserved URI characters) and derive `code_challenge` via SHA-256.
- Generate a random `state` parameter (32 bytes, base64url-encoded) for every OAuth request. Verify it matches on the callback to prevent CSRF.
- Validate the redirect URL in the callback matches the expected `chrome-extension://EXTENSION_ID/` prefix.
- Exchange the authorization code for tokens via a backend call (not directly from the extension to Google) so the client secret stays server-side.
- Request minimal OAuth scopes: `openid email profile` only.

**Content script isolation:**
- The `cookie-banner-detect.ts` content script must NEVER receive cookie data from the background service worker. Its only job is to detect consent banners in the page DOM and report their presence.
- The content script must NEVER use `window.postMessage` to communicate with the page. Use only `chrome.runtime.sendMessage` to communicate with the background script.
- The content script must not inject any UI elements that display cookie data. If future features require UI injection, use a Shadow DOM to isolate styles and prevent the page from reading injected content.

---

## 3. Privacy Verification

### 3.1 Data Flow Map

```
USER'S BROWSER (all cookie data stays here)
  |
  |-- Extension Popup / Side Panel / DevTools Panel
  |     |-- Reads cookies via chrome.cookies.getAll() [LOCAL]
  |     |-- Writes cookies via chrome.cookies.set() [LOCAL]
  |     |-- Stores profiles, rules, snapshots in chrome.storage.local [LOCAL]
  |     |-- Renders cookie data in Preact components [LOCAL]
  |     |-- Encrypts vault data via Web Crypto API [LOCAL]
  |     |-- Runs GDPR scan against bundled tracker lists [LOCAL]
  |
  |-- chrome.storage.sync [ENCRYPTED BY CHROME, SYNCED VIA GOOGLE ACCOUNT]
  |     |-- Settings (theme, defaults) -- no sensitive data
  |     |-- Zovo auth state (JWT, encrypted) -- for cross-device login
  |     |-- Domain lists (whitelist/blacklist) -- domain names only
  |
  |-- Background Service Worker
        |-- Alarms trigger local operations only
        |-- chrome.cookies.onChanged fires locally
        |
        |----> Supabase Auth (https://auth.zovo.app)
        |        SENDS: Google OAuth id_token (exchanged for Zovo JWT)
        |        SENDS: Refresh token (for silent re-auth)
        |        NEVER SENDS: Cookie data, browsing history, page content
        |
        |----> Zovo API (https://api.zovo.app)
        |        SENDS: Bearer JWT (for auth)
        |        SENDS: License verification request (no payload)
        |        SENDS: Encrypted profile data (Pro sync only, user-initiated)
        |        SENDS: Anonymized analytics events (hashed names, domain-level only)
        |        NEVER SENDS: Raw cookie names, raw cookie values, full URLs
        |
        |----> LemonSqueezy (https://zovo.app/upgrade)
        |        SENDS: Nothing directly. Extension opens a web page.
        |        User completes checkout on LemonSqueezy's domain.
        |
        |----> Disconnect.me tracker lists
               FETCHES: Updated tracker database (weekly, public list)
               SENDS: Nothing
```

**Data that NEVER leaves the browser:**
- Cookie names (raw, unhashed)
- Cookie values
- Cookie domains (except as eTLD+1 in anonymized analytics)
- Full URLs, paths, or query strings
- Browsing history or page content
- User profile data beyond email and display name
- IP addresses (not collected by extension; API server may log IPs per standard server practice, addressed in privacy policy)
- Any data from incognito tabs (the extension should detect incognito context via `chrome.tabs` and refuse to sync or transmit any data from incognito sessions)

### 3.2 Privacy Promise Checklist

- [x] **No cookie data sent to any external server.** All cookie read/write operations use the local `chrome.cookies` API. Profile sync (Pro) encrypts profile data client-side before transmission. The server sees ciphertext only.
- [x] **No browsing data collected.** The `tabs` permission is used to extract the domain from the active tab. Full URLs are never stored or transmitted. Tab URL data is held in memory only for the duration needed to match auto-delete rules, then discarded.
- [x] **No third-party analytics scripts.** All analytics go to `analytics.zovo.app`, a first-party Zovo endpoint. No Google Analytics, no Mixpanel, no Segment, no third-party pixels or tracking scripts are loaded by the extension.
- [x] **No fingerprinting.** The extension does not collect browser fingerprint data (canvas, WebGL, font enumeration, screen resolution, installed plugins). The only device-identifying data is the randomly generated `session_id` per popup open.
- [x] **All cookie processing happens locally.** GDPR scanning uses bundled Disconnect.me and EasyList databases. Cookie health scoring is computed client-side. Cookie diffing is computed client-side. No cookie data is sent to a server for processing.
- [x] **GDPR scan uses local tracker lists, not an external API.** The tracker database ships with the extension and is updated via a static JSON file fetch (no query parameters, no cookie data in the request). Note: the spec mentions a `/gdpr/scan` API endpoint. This endpoint must be removed or redesigned to accept only a domain name and return generic guidance, never receiving actual cookie data. If server-side analysis is desired, send only hashed cookie names and the domain.
- [x] **Analytics: only hashed cookie names, domain-level only, EU opt-out by default.** Cookie names are SHA-256 hashed before inclusion in any analytics event. Only the registrable domain (eTLD+1) is recorded. Users in EU/EEA timezones have analytics disabled by default.
- [x] **User can delete all data from settings.** The Account settings page must include a "Delete All Data" button that clears all `chrome.storage.local` and `chrome.storage.sync` data, resets the extension to a fresh-install state, and calls the Zovo API to delete the user's server-side data.
- [x] **Uninstall cleanup via `chrome.runtime.setUninstallURL`.** The uninstall URL points to a survey page. The URL contains only `?v=VERSION&sid=RANDOM_ID`. No user data, no tier information, no usage statistics are encoded in the URL.

**Critical GDPR scan architecture note:** The spec (Section 5.3) defines a `POST /gdpr/scan` endpoint that accepts `{ domain: string, cookies: CookieSummary[] }`. If `CookieSummary` contains cookie names, this violates the privacy promise. This endpoint must be redesigned. Recommended approach: perform all cookie classification locally against the bundled tracker list. The server endpoint, if needed at all, should accept only a domain name and return supplementary classification data (e.g., known trackers for that domain from a server-side database). Cookie names must never be sent to the server, even hashed, unless the user explicitly opts in.

---

## 4. Attack Surface Analysis

### 4.1 Threat Model

| # | Threat | Attack Vector | Impact | Likelihood | Severity | Mitigation |
|---|--------|--------------|--------|------------|----------|------------|
| 1 | **Malicious webpage injection via content script** | A webpage sends crafted `postMessage` data hoping the content script relays it to the background worker, triggering cookie operations. | Could manipulate cookies if the content script blindly forwards messages. | Medium | **Critical** | Content script (`cookie-banner-detect.ts`) must NEVER relay arbitrary page messages to the background. It should only send structured, hardcoded message types (e.g., `{ type: "banner_detected", has_banner: boolean }`). The background must reject any message from a content script that contains cookie operation requests. |
| 2 | **XSS via cookie name/value containing HTML/JS** | Attacker sets a cookie with a name like `<img onerror=alert(1) src=x>` or a value containing `<script>` tags. Extension renders cookie data unsafely. | Full extension compromise -- attacker gains access to all cookies, auth tokens, and extension APIs in the extension's privileged context. | High (cookie values are attacker-controlled) | **Critical** | Never use `innerHTML` or `dangerouslySetInnerHTML`. Preact's JSX escapes by default. Add an ESLint rule to ban `innerHTML`. Additionally, the strict CSP (`script-src 'self'`) blocks inline script execution even if HTML injection occurs. Defense in depth: sanitize + CSP + rendering framework escaping. |
| 3 | **Supply chain attack on dependencies** | A compromised Preact, nanoid, or `@zovo/auth` package introduces malicious code that exfiltrates cookie data. | Complete data breach -- all cookies for all domains accessible to the extension could be stolen. | Low (but catastrophic if it occurs) | **Critical** | Pin exact dependency versions in `package-lock.json`. Run `npm audit` in CI. Use Dependabot or Socket.dev for dependency monitoring. Vendor `@zovo/auth` as a git submodule or monorepo package rather than a public NPM registry dependency. Review every dependency update manually. Prefer `crypto.randomUUID()` over nanoid to eliminate that dependency. Keep total dependency count below 10 (including transitive). |
| 4 | **Storage tampering to bypass paywall** | User opens Chrome DevTools, navigates to the extension's storage, and changes `zovo_auth.tier` from `"free"` to `"pro"` or modifies `license_cache.tier`. | User gains Pro features without paying. Revenue loss. | High (DevTools access is trivial) | **Medium** | HMAC-sign the `license_cache` as specified in Section 2.2. Validate tier server-side on every sync and API call. Re-validate the license on every popup open (call `/auth/verify` and compare). If the local tier does not match the server-reported tier, force downgrade. Accept that a determined user with DevTools access can bypass client-side checks; the mitigation goal is to make it non-trivial and detectable. |
| 5 | **Message spoofing from other extensions** | A malicious extension sends `chrome.runtime.sendMessage` to the Cookie Manager's extension ID, requesting cookie operations or profile data. | Data exfiltration (profiles, cookie data) or unauthorized cookie modification. | Medium | **High** | Validate `sender.id` against the hardcoded `ZOVO_EXTENSION_IDS` allowlist for every `onMessageExternal` handler. Reject all messages from unknown sender IDs. Log rejected messages for monitoring. For internal `onMessage` (same extension), still validate message schema but sender validation is implicit. |
| 6 | **Clickjacking on extension popup** | Attacker embeds the extension popup in an invisible iframe on a malicious page and tricks the user into clicking buttons. | User unknowingly deletes cookies, loads profiles, or authorizes actions. | Low (Chrome popup is not easily embedded) | **Low** | CSP `frame-ancestors 'none'` prevents embedding. The Chrome extension popup is already isolated from web content. The options page (opened in a tab) is also protected by CSP. |
| 7 | **OAuth token theft via extension compromise** | If the extension is compromised (via dependency attack or code injection), the attacker can read `zovo_auth` tokens from `chrome.storage.sync`. | Account takeover -- attacker can impersonate the user on the Zovo platform. | Low (requires prior compromise) | **Critical** | Encrypt tokens at rest (Section 2.2). Use short-lived JWTs (15-minute expiry) with refresh tokens. Implement token rotation on refresh (each refresh token is single-use). If compromise is detected (e.g., token used from multiple IPs), revoke all tokens server-side. |
| 8 | **MITM attack on Zovo API calls** | Attacker on the same network intercepts HTTPS traffic to `api.zovo.app` (e.g., via a compromised corporate proxy or rogue Wi-Fi). | Token interception, analytics data interception, profile data interception during sync. | Low (requires HTTPS downgrade or compromised CA) | **High** | HTTPS-only enforcement in code. Chrome's built-in certificate validation protects against most MITM. Use HSTS on `api.zovo.app` with `includeSubDomains` and `preload`. Monitor Certificate Transparency logs. Consider public key pinning via a custom `fetch` wrapper that verifies the server's TLS certificate fingerprint (advanced, optional). |
| 9 | **Cached credentials persist after sign-out** | User signs out but auth tokens, refresh tokens, or license cache remain in storage. Another user of the same device can access Pro features or the previous user's account. | Unauthorized access to the previous user's Zovo account and Pro features. | Medium (shared devices are common among VA users) | **High** | Implement the full cleanup procedure from Section 2.2. On sign-out: clear `zovo_auth`, `license_cache`, `sync_queue`, analytics queue. Revoke the refresh token server-side. Zero in-memory keys. Display a confirmation: "Signed out. All account data cleared from this device." |
| 10 | **Profile import with malicious cookie data** | User imports a JSON file containing cookies with XSS payloads in names/values, oversized values designed to exhaust storage, or deeply nested structures to trigger stack overflow. | XSS if rendered unsafely. Storage exhaustion. Extension crash. | Medium | **High** | Validate every field of every imported cookie against the schema (Section 2.1). Enforce max file size (5MB), max cookie count (10,000), max name length (256), max value length (4096). Reject files with unexpected keys. Parse JSON in a try/catch. Limit nesting depth to 3 levels. Show a preview of imported data before applying. |

### 4.2 Additional Threats

**Browser extension update hijacking:** If an attacker gains access to the Chrome Web Store developer account, they can push a malicious update. Mitigation: enable 2FA on the Chrome Developer Dashboard. Use a dedicated Google account for publishing. Review every update submission before publishing. Chrome's auto-update mechanism means users receive the malicious update automatically; the only defense is prevention.

**Cross-extension data leakage via `chrome.storage.sync`:** Because all Zovo extensions share the `zovo_auth` key in `chrome.storage.sync`, compromising any single Zovo extension compromises the auth state for all of them. Mitigation: each extension should validate the JWT independently (check signature, expiry, and audience claim). The JWT `aud` claim should include the specific extension or `zovo-all`. If one extension is compromised, the server can revoke tokens specifically scoped to that extension.

**Timing attacks on HMAC comparison:** When verifying the `license_cache` HMAC, use a constant-time comparison function to prevent timing-based attacks:

```typescript
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}
```

---

## 5. Security Test Cases

### 5.1 Penetration Testing Checklist

**XSS Injection Tests:**
- [ ] Inject `<script>alert(1)</script>` as a cookie name via `chrome.cookies.set()` from DevTools, then open the extension popup. Verify: no script executes; the string renders as literal text.
- [ ] Inject `<img onerror=alert(1) src=x>` as a cookie value. Verify: no image element created; string rendered as text.
- [ ] Inject `javascript:alert(1)` as a cookie domain. Verify: validation rejects it.
- [ ] Inject `<svg onload=alert(1)>` in a profile name via storage tampering. Verify: rendered as text.
- [ ] Inject `{{constructor.constructor('alert(1)')()}}` in search input (template injection test). Verify: no code execution.
- [ ] Create an import JSON file where cookie names contain HTML tags. Import and verify: all tags rendered as text, no DOM manipulation.

**CSP Bypass Tests:**
- [ ] Attempt `eval("alert(1)")` from the extension's DevTools console when the popup is open. Verify: blocked by CSP.
- [ ] Attempt `new Function("alert(1)")()` from the popup context. Verify: blocked by CSP.
- [ ] Attempt `setTimeout("alert(1)", 0)` (string argument form). Verify: blocked by CSP.
- [ ] Verify no `'unsafe-eval'` or `'unsafe-inline'` in the production CSP.
- [ ] Check that no `<script>` tags with `nonce` or `hash` attributes are present in extension HTML files that could be abused.

**Storage Tampering Tests:**
- [ ] Open Chrome DevTools, navigate to Application > Extension Storage. Change `license_cache.tier` to `"pro"`. Reopen the popup. Verify: the extension detects the HMAC mismatch and reverts to free tier.
- [ ] Change `zovo_auth.tier` to `"pro"` in sync storage. Verify: on next `/auth/verify` call, the server-reported tier overrides the local value.
- [ ] Delete the `license_cache.signature` field. Verify: treated as tampering; forces re-validation.
- [ ] Set `usage.profiles_count` to `0` when user has 5 profiles. Verify: on next profile operation, the extension recomputes the actual count from the `profiles` array, not the counter.

**Message Passing Tests:**
- [ ] From a test extension with an unknown ID, send `chrome.runtime.sendMessage("COOKIE_MANAGER_ID", { action: "get_cookies" })`. Verify: response is `{ error: "unauthorized" }`.
- [ ] From a web page on a non-Zovo domain, attempt to send a message to the extension via `chrome.runtime.sendMessage`. Verify: the message is rejected (not in `externally_connectable`).
- [ ] Send a message with `action: "load_profile"` but with a spoofed `profile_id` pointing to a nonexistent profile. Verify: graceful error, no crash.
- [ ] Send a message with no `action` field. Verify: rejected with `{ error: "invalid_message" }`.
- [ ] Send a message with `action: "__proto__"` or `action: "constructor"`. Verify: rejected (not in `VALID_ACTIONS` set).

**OAuth Security Tests:**
- [ ] Verify the OAuth flow uses PKCE (inspect the authorization URL for `code_challenge` and `code_challenge_method=S256`).
- [ ] Verify the `state` parameter is present in the authorization URL and validated on callback.
- [ ] Attempt to replay an old authorization code. Verify: server rejects it.
- [ ] Modify the redirect URL in the OAuth callback. Verify: the extension rejects mismatched redirect origins.

**API Security Tests:**
- [ ] Verify all `fetch()` calls use HTTPS. Search codebase for `http://` in any API URL construction. Must find zero instances.
- [ ] Send an expired JWT to `/auth/verify`. Verify: server returns 401; extension attempts refresh.
- [ ] Send a JWT with `alg: none`. Verify: server rejects it.
- [ ] Send an API request with a `Content-Type: text/html` header. Verify: server rejects it (defense against content-type confusion).

**Import/Export Security Tests:**
- [ ] Import a 100MB JSON file. Verify: rejected before parsing with "File too large" error.
- [ ] Import a JSON bomb: `{"a":{"a":{"a":{"a":...}}}}` nested 1,000 levels deep. Verify: parser rejects after depth limit (3 levels) or the try/catch prevents a crash.
- [ ] Import a file with 100,000 cookie objects. Verify: rejected with "Too many cookies" error.
- [ ] Import a valid JSON file but with an extra field `"malicious": "<script>..."` at the top level. Verify: the extra field is ignored and not stored.
- [ ] Import a file where a cookie `domain` is set to a public suffix (e.g., `.com`). Verify: rejected during validation.
- [ ] Export cookies, modify the exported file to include XSS payloads, then re-import. Verify: payloads are sanitized.

**Incognito Security Tests:**
- [ ] Open the extension in an incognito tab. Verify: no data from incognito sessions is written to `chrome.storage.local` or sync storage.
- [ ] Verify: no analytics events are fired from incognito sessions.
- [ ] Verify: profile sync does not trigger from incognito mode.

---

## 6. Compliance Documentation

### 6.1 Chrome Web Store Permission Justifications

These justifications are written for submission in the Chrome Web Store Developer Dashboard "Permission Justification" field.

**`cookies`:** "Zovo Cookie Manager is a cookie management tool. The `cookies` permission is required to read, create, edit, and delete browser cookies, which is the core purpose of the extension. It also uses the `cookies.onChanged` event to provide real-time monitoring of cookie changes for debugging and privacy analysis."

**`activeTab`:** "Used to determine the URL of the tab the user is currently viewing so the extension can display only the cookies relevant to that site. This avoids requesting broad host permissions."

**`storage`:** "Used to save user preferences (theme, display settings), cookie profiles (named sets of cookies the user saves for quick restoration), auto-delete rules, and cached data for performance. Both `chrome.storage.local` (device-specific) and `chrome.storage.sync` (cross-device) are used."

**`tabs`:** "Used to read the URL of the active tab for domain filtering, detect when tabs are closed to trigger auto-delete rules, and identify incognito tabs to scope cookie store access correctly."

**`alarms`:** "Used to schedule periodic background tasks: auto-delete rule execution on a timer, license validation checks, analytics event batching, and monthly usage counter resets. Required because Manifest V3 service workers cannot use `setInterval` reliably."

**`notifications` (optional):** "Requested at runtime when the user enables cookie change monitoring. Used to alert the user when cookies are modified, added, or deleted on monitored domains."

**`clipboardWrite`:** "Used to copy cookie values, generated cURL commands, and exported cookie data to the clipboard. This is a core workflow for developers using the extension to debug requests."

**`identity` (optional):** "Requested at runtime when the user chooses to sign in to their Zovo account. Used to initiate Google OAuth sign-in for accessing premium features and syncing data across devices."

### 6.2 Single Purpose Statement

"Zovo Cookie Manager provides a comprehensive interface for viewing, editing, creating, deleting, and managing browser cookies with additional tools for privacy analysis, session management, and developer workflows."

### 6.3 Privacy Practices Disclosure

For the Chrome Web Store "Privacy Practices" tab:

**Data Use Certifications:**
- Does NOT sell user data to third parties.
- Does NOT use or transfer user data for purposes unrelated to the extension's core functionality.
- Does NOT use or transfer user data for creditworthiness determination or lending.

**Data Collected:**

| Data Type | Collected? | Purpose | Transmitted? |
|-----------|-----------|---------|-------------|
| Personally identifiable information | Email address only, when user signs in to Zovo | Account authentication | Sent to Supabase Auth only |
| Health information | No | N/A | N/A |
| Financial information | No | N/A | N/A |
| Authentication information | OAuth tokens | Zovo membership access | Exchanged with Supabase Auth, stored locally encrypted |
| Personal communications | No | N/A | N/A |
| Location | No | N/A | N/A |
| Web history | No | N/A | N/A |
| User activity | Anonymized feature usage events | Product improvement | Sent to first-party analytics endpoint |
| Website content | No | N/A | N/A |

### 6.4 Privacy Policy Outline

The full privacy policy must be hosted at `https://zovo.app/privacy` and cover:

**1. Data Controller:** Zovo (company entity, address, contact email: privacy@zovo.app).

**2. Data Collected:**
- Email address (only when user creates a Zovo account)
- Anonymous usage analytics (feature usage counts, hashed cookie names, domain-level information, session duration)
- No cookie values, no browsing history, no page content, no financial information

**3. Data Usage:**
- Email: account authentication, subscription management, optional product updates (opt-in)
- Analytics: product improvement, conversion optimization, bug detection
- Analytics are never sold, shared with third parties, or used for advertising

**4. Data Storage and Retention:**
- Local data: stored in Chrome's sandboxed extension storage on the user's device
- Account data: stored in Supabase (hosted on AWS, SOC 2 compliant) in the US region
- Analytics data: retained for 90 days, then permanently deleted
- Auth tokens: JWTs expire after 15 minutes; refresh tokens expire after 30 days

**5. Third-Party Services:**
- Supabase (authentication, database): processes email and account data
- LemonSqueezy (payment processing): processes payment information directly; Zovo never sees or stores credit card details
- No other third-party services receive user data

**6. Data Security:**
- All data in transit encrypted via TLS 1.3
- Sensitive data at rest encrypted with AES-256-GCM
- Auth tokens encrypted in extension storage
- HMAC signatures prevent storage tampering

**7. User Rights (GDPR/CCPA):**
- Right to access: users can request an export of all data associated with their account
- Right to deletion: users can delete their account and all associated data from the Settings page or by contacting privacy@zovo.app
- Right to portability: profile and rule data can be exported as JSON at any time
- Right to opt out: analytics can be disabled in Settings; EU users are opted out by default
- Right to rectification: users can update their email and display name in Settings

**8. Cookie Policy:** The extension manages browser cookies on behalf of the user. It does not set tracking cookies or use cookies for advertising. The `zovo.app` website uses minimal first-party cookies for session management.

**9. Children's Privacy:** The extension is not directed at children under 13. No data is knowingly collected from children.

**10. Changes to This Policy:** Users will be notified of material changes via an in-extension banner and email (for registered users) at least 30 days before the change takes effect.

**11. Contact:** privacy@zovo.app

---

## Summary

This security specification addresses the extension's attack surface across six dimensions: permissions, hardening, privacy, threats, testing, and compliance. The key design principles are:

1. **Minimal permissions.** No host permissions. Runtime-only requests for `notifications`, `identity`, `offscreen`, and `sidePanel`. Zero `web_accessible_resources`.

2. **Defense in depth for XSS.** Strict CSP (`script-src 'self'`) plus framework-level escaping (Preact JSX) plus a codebase ban on `innerHTML` enforced by linting. Cookie data is always treated as attacker-controlled input.

3. **Encryption at rest for sensitive data.** AES-256-GCM with PBKDF2 key derivation for the cookie vault. Encrypted auth tokens in sync storage. HMAC-signed license cache.

4. **Server-side enforcement for monetization.** Client-side tier checks are supplemented by server validation on every API call. Storage tampering is detectable via HMAC and server comparison.

5. **Privacy by architecture.** Cookie data never leaves the browser. Analytics are anonymized and opt-out by default for EU users. GDPR scanning is local. No third-party scripts.

6. **Validated trust boundary.** Every message passing channel validates sender identity and message schema. Cross-extension communication is restricted to a hardcoded allowlist of Zovo extension IDs. Web page messaging is restricted to `https://zovo.app` only.

These specifications must be implemented before the extension is submitted to the Chrome Web Store. Security is the primary differentiator against the EditThisCookie copycat extensions that users already distrust. Every architectural decision must reinforce the message: "Your cookies are safe with Zovo."
