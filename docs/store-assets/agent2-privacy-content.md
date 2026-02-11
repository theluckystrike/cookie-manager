# Zovo Cookie Manager: Privacy Section Content for Chrome Web Store

**Agent 2 -- Privacy Content Specialist**
**Date:** 2026-02-11
**Status:** Submission-Ready
**Scope:** All five CWS privacy deliverables

---

## 1. privacy-single-purpose.txt

```
Zovo Cookie Manager serves a single purpose: manage browser cookies through an intuitive interface — viewing, editing, creating, deleting, exporting, and organizing cookies with profiles and automated cleanup rules.

Specifically, this extension:
• Reads, creates, edits, and deletes browser cookies via the Chrome cookies API
• Provides cookie profiles for saving and restoring named sets of cookies
• Provides auto-delete rules that remove cookies on tab close, on a timer, or on browser start
• Offers cookie health scoring and GDPR tracker analysis using locally bundled databases
• Exports and imports cookies in JSON format for developer workflows
• Generates cURL commands from cookie data for debugging

This extension does NOT:
• Collect, transmit, or sell any cookie data or browsing information
• Track your browsing history or monitor your activity
• Inject scripts into web pages during normal operation
• Load or execute any remotely hosted code

All cookie processing happens locally in your browser. Cookie data never leaves your device. The only network requests the extension makes are for optional Pro tier functionality: license verification via LemonSqueezy and Google OAuth authentication when you choose to sign in. No cookie data, browsing history, or page content is ever included in those requests.

The extension requires the following permissions to function:
• cookies: Read, create, edit, and delete browser cookies (core functionality)
• storage: Save your preferences, cookie profiles, auto-delete rules, and settings locally
• tabs: Read the active tab URL to display cookies for the current domain
• alarms: Schedule auto-delete rules and periodic background tasks
• clipboardWrite: Copy cookie values, cURL commands, and exported data to your clipboard
• activeTab: Access the current tab only when you click the extension icon

Optional permissions (requested at runtime only when you activate the feature):
• identity: Google OAuth sign-in for Zovo membership (Pro tier)
• notifications: Cookie change alerts (Pro tier monitoring)
• offscreen: Clipboard fallback for service worker contexts
• sidePanel: Side panel UI mode (Pro tier)

These permissions are the minimum necessary for the extension's stated purpose. No host permissions are requested. The extension never accesses websites in the background.
```

---

## 2. privacy-permissions.txt

```
═══════════════════════════════════════════════════════
PERMISSION: cookies
═══════════════════════════════════════════════════════

Justification:
The cookies permission is the core of this extension. Zovo Cookie Manager is a cookie management tool — without this permission, the extension has zero functionality. This permission enables reading, creating, editing, and deleting browser cookies through the chrome.cookies API. It also enables listening for real-time cookie changes via the cookies.onChanged event, which powers the cookie monitoring and change notification features for Pro users.

Specifically, Zovo Cookie Manager uses this permission to:
1. Read all cookies for a specific domain when the user opens the popup (chrome.cookies.getAll)
2. Create new cookies or edit existing ones when the user submits the cookie editor form (chrome.cookies.set)
3. Delete individual cookies or bulk-delete cookies matching auto-delete rules (chrome.cookies.remove)
4. Monitor cookie changes in real time for debugging and privacy analysis (chrome.cookies.onChanged)
5. Enumerate cookie stores to correctly scope operations in incognito mode (chrome.cookies.getAllCookieStores)

What we DO with this permission:
• Read cookies scoped to the domain the user is actively viewing
• Write/delete cookies only in response to explicit user actions (edit, create, delete, load profile, execute rule)
• Display cookie attributes (name, value, domain, path, expiry, flags) in the extension UI
• Save cookies to named profiles in local storage for later restoration
• Scan cookies against a locally bundled tracker database for GDPR health scoring

What we DO NOT do:
• Silently enumerate all cookies across all domains in the background
• Transmit cookie names, values, or any cookie data to any external server
• Share cookie data with any third party, advertiser, or analytics service
• Use cookie data for tracking, profiling, or fingerprinting users
• Access cookies without user-initiated action (all reads are triggered by popup open or explicit user command)

User control:
• Users choose which domains to view cookies for
• Auto-delete rules are user-created and user-controlled; rules can be paused or deleted at any time
• Profile save/restore operations require explicit user confirmation
• All cookie data stays on the user's device and can be cleared through Chrome settings or by uninstalling the extension


═══════════════════════════════════════════════════════
PERMISSION: storage
═══════════════════════════════════════════════════════

Justification:
The storage permission is required to persist user preferences, cookie profiles, auto-delete rules, and operational data across browser sessions. Without this permission, the extension would lose all configuration every time the browser closes. Both chrome.storage.local (device-specific, 10 MB limit) and chrome.storage.sync (cross-device via Chrome account, 100 KB limit) are used.

Specifically, Zovo Cookie Manager uses this permission to:
1. Save user preferences: theme (dark/light/system), default view, display density, keyboard shortcuts
2. Store cookie profiles: named sets of cookies the user saves for quick restoration (e.g., "Staging Login", "Test Account A")
3. Store auto-delete rules: user-defined rules specifying which cookies to delete and when
4. Cache license validation status for the 72-hour offline grace period
5. Queue analytics events for batched transmission (anonymized, no cookie data)
6. Track usage counters for free-tier limit enforcement (profile count, rule count, export count)

What we DO with this permission:
• Store all user-created data (profiles, rules, settings) in chrome.storage.local on the user's device
• Sync lightweight settings (theme, domain lists) via chrome.storage.sync for cross-device consistency
• Encrypt sensitive fields (auth tokens, encrypted vault data) before storing

What we DO NOT do:
• Store data on any external server controlled by Zovo (all data is in Chrome's sandboxed extension storage)
• Store browsing history, page content, or any data unrelated to cookie management
• Access or read storage from other extensions

User control:
• Users can export their profiles and rules as JSON at any time
• Users can delete all stored data from the extension's Settings page ("Delete All Data")
• All stored data is automatically deleted when the extension is uninstalled
• Users can view what is stored via Chrome DevTools (Application > Extension Storage)


═══════════════════════════════════════════════════════
PERMISSION: tabs
═══════════════════════════════════════════════════════

Justification:
The tabs permission is required for three essential functions: determining the active tab's URL for domain-scoped cookie display, detecting tab close events to trigger auto-delete rules, and identifying incognito tabs to scope cookie store access correctly. This is the minimum permission needed for these workflows — there is no narrower alternative in the Chrome Extensions API.

Specifically, Zovo Cookie Manager uses this permission to:
1. Read the URL of the currently active tab to filter and display only cookies relevant to that site (chrome.tabs.query)
2. Detect when a tab is closed so that tab-close-triggered auto-delete rules can execute (chrome.tabs.onRemoved)
3. Cache the URL of updated tabs so the URL is available when the onRemoved event fires (chrome.tabs.onUpdated)
4. Identify whether a tab is in incognito mode to access the correct cookie store (chrome.tabs.get)
5. Update the extension badge with cookie count when the user switches tabs (chrome.tabs.onActivated)

What we DO with this permission:
• Extract only the registrable domain (e.g., "example.com") from tab URLs for cookie filtering
• Match closed tab URLs against user-created auto-delete rule patterns

What we DO NOT do:
• Store full tab URLs — only the domain is extracted, and the full URL is immediately discarded from memory
• Transmit tab URLs, page titles, or browsing activity to any external server
• Track or log which websites the user visits
• Monitor tabs in the background for any purpose other than auto-delete rule execution

User control:
• Auto-delete rules are entirely user-created; users choose which domains have rules and can disable rules at any time
• Users can remove all auto-delete rules, which eliminates the need for tab monitoring beyond basic domain display
• The extension never records a history of visited sites


═══════════════════════════════════════════════════════
PERMISSION: alarms
═══════════════════════════════════════════════════════

Justification:
The alarms permission is required to schedule periodic background tasks in a Manifest V3 service worker environment. MV3 service workers cannot reliably use setInterval or setTimeout for recurring tasks because Chrome terminates service workers after approximately 30 seconds of inactivity. The chrome.alarms API is the officially recommended replacement for scheduling recurring work.

Specifically, Zovo Cookie Manager uses this permission to:
1. Execute timer-triggered auto-delete rules at user-specified intervals (minimum 5 minutes)
2. Perform periodic license validation checks (every 24 hours) to maintain the offline grace period
3. Batch-flush queued analytics events (every 5 minutes) to minimize network requests
4. Reset monthly usage counters on the first of each month

What we DO with this permission:
• Schedule alarms with descriptive names (e.g., "rule-timer-abc123", "license-check", "usage-reset-monthly")
• Wake the service worker at scheduled intervals to perform the above tasks
• Enforce a minimum 5-minute interval for all user-created rule timers

What we DO NOT do:
• Use alarms to track user behavior or monitor browsing activity
• Schedule alarms at aggressive intervals that degrade browser performance
• Execute any code unrelated to the extension's stated cookie management purpose

User control:
• Timer-based auto-delete rules are user-created and user-configured; users set the interval and can pause or delete rules
• Users can disable all auto-delete rules from the Rules tab, which stops all rule-related alarms
• License and analytics alarms are internal maintenance tasks and do not affect user experience


═══════════════════════════════════════════════════════
PERMISSION: clipboardWrite
═══════════════════════════════════════════════════════

Justification:
The clipboardWrite permission enables the "Copy to Clipboard" functionality that is central to developer workflows with cookies. Developers frequently need to copy cookie values for debugging, paste cURL commands into terminals, and transfer exported cookie data between tools. This permission allows the extension to write to the clipboard but never read from it.

Specifically, Zovo Cookie Manager uses this permission to:
1. Copy individual cookie values when the user clicks the copy button next to a cookie
2. Copy generated cURL commands that include cookie headers for reproducing HTTP requests
3. Copy exported cookie data (JSON) to the clipboard for pasting into other tools
4. Copy cookie names, domains, or other attributes when the user clicks copy in the detail view

What we DO with this permission:
• Write user-selected cookie data to the clipboard only when the user explicitly clicks a copy button or uses a keyboard shortcut
• Attempt to clear sensitive clipboard content after 60 seconds (best-effort)

What we DO NOT do:
• Read from the clipboard — this is a write-only permission
• Automatically copy data without user interaction
• Send clipboard contents to any external server

User control:
• Every clipboard write is triggered by an explicit user action (click or keyboard shortcut)
• Users can clear their clipboard manually at any time through their operating system


═══════════════════════════════════════════════════════
PERMISSION: activeTab
═══════════════════════════════════════════════════════

Justification:
The activeTab permission grants the extension temporary access to the currently active tab, but only when the user explicitly clicks the extension icon. This is used to determine the current page URL for domain-scoped cookie display. We use activeTab instead of broad host permissions (<all_urls>) specifically to minimize the extension's access footprint and avoid triggering the "This extension can read and change all your data on all websites" Chrome warning.

Specifically, Zovo Cookie Manager uses this permission to:
1. Identify the domain of the page the user is currently viewing when they open the extension popup
2. Provide domain context for the cookie list, search, and filter operations

What we DO with this permission:
• Read the active tab's URL to extract the domain for cookie filtering
• Display the current domain in the extension popup header

What we DO NOT do:
• Read page content, inject scripts, or modify the web page in any way
• Access tabs other than the one the user explicitly activates the extension on
• Retain tab access after the user closes the popup

User control:
• Access is granted only when the user clicks the extension icon — it is never automatic
• The permission is temporary and expires when the popup closes


═══════════════════════════════════════════════════════
PERMISSION: identity (OPTIONAL — Runtime-Requested)
═══════════════════════════════════════════════════════

Justification:
The identity permission is optional and is only requested at runtime when the user clicks "Sign in to Zovo" to access premium features. It enables Google OAuth authentication via chrome.identity.launchWebAuthFlow. This permission is never requested during installation and is not needed for any free-tier functionality.

Specifically, Zovo Cookie Manager uses this permission to:
1. Initiate the Google OAuth sign-in flow when the user chooses to create or log into their Zovo account
2. Obtain a redirect URL for the OAuth callback via chrome.identity.getRedirectURL

What we DO with this permission:
• Launch a secure Google OAuth flow using PKCE (Proof Key for Code Exchange) for security
• Request only the minimal OAuth scopes: openid, email, and profile
• Exchange the Google authorization code for a Zovo-specific JWT and immediately discard the raw Google token

What we DO NOT do:
• Request this permission at install time or without user initiation
• Access the user's Google account data beyond basic profile information (name and email)
• Store the raw Google OAuth token — it is exchanged and discarded
• Use Google identity data for tracking or advertising

User control:
• The user must explicitly click "Sign in to Zovo" to trigger the permission request
• Users can sign out at any time from Settings, which clears all authentication data
• Users can revoke the extension's access to their Google account through Google's security settings
• The extension functions fully in free tier without ever requesting this permission
```

---

## 3. privacy-remote-code.txt

```
This extension does not use remote code.

All JavaScript code is bundled within the extension package at build time using Vite and reviewed during Chrome Web Store submission. The extension enforces a strict Content Security Policy:

    script-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'

This CSP ensures that only scripts bundled with the extension can execute. The extension does not:
• Load external JavaScript files from CDNs or remote servers
• Use eval(), new Function(), or any form of dynamic code execution
• Use setTimeout() or setInterval() with string arguments
• Fetch code from external servers for execution
• Execute any remotely hosted JavaScript
• Use innerHTML or document.write with dynamic content
• Load external stylesheets, fonts, or resources at runtime

All dependencies (Preact, utility libraries) are bundled at build time. No runtime code fetching occurs.

NETWORK REQUESTS:
The extension does make limited network requests for optional Pro tier functionality only:
• LemonSqueezy (https://api.lemonsqueezy.com): License key validation when the user has a paid subscription. Sends only a license key; no cookie data, browsing data, or personal information is included.
• Google OAuth (via chrome.identity): Authentication when the user explicitly signs in. Only standard OAuth tokens are exchanged; no extension data is transmitted.
• Zovo API (https://api.zovo.app): License verification, profile sync (Pro, encrypted client-side), and anonymized analytics. No raw cookie data is ever sent.

These network requests transmit operational data only (license keys, auth tokens, anonymized events). No user cookie data, browsing history, or page content is ever included in any network request.

The complete source code is open source and available for audit:
GitHub: https://github.com/theluckystrike/cookie-manager
```

---

## 4. privacy-data-usage.txt

```
DATA USAGE DECLARATION

Chrome Web Store requires disclosure of data types the extension collects and how they are used. The chrome.cookies API accesses browser cookies, but this is the extension's core management function performed entirely locally — it does not constitute "collection" under CWS data disclosure definitions because the data is never transmitted to a server owned by the developer or any third party.

Data types collected or used:

[ ] Personally identifiable information — NOT COLLECTED
    The extension does not collect names, addresses, phone numbers, or similar PII.
    Note: If the user opts into Zovo membership (Pro tier), their email address is
    processed by Google OAuth and Supabase Auth for authentication purposes only.
    This is initiated by explicit user action and is not passive collection.

[ ] Health information — NOT COLLECTED

[ ] Financial and payment information — NOT COLLECTED
    Payment processing for Pro tier is handled entirely by LemonSqueezy
    (Merchant of Record). The extension never sees, processes, or stores
    credit card numbers or payment details.

[ ] Authentication information — NOT COLLECTED
    OAuth tokens are generated during optional sign-in and stored locally
    in encrypted form within chrome.storage. They are not collected or
    transmitted to the developer beyond the standard OAuth token exchange
    with the authentication provider.

[ ] Personal communications — NOT COLLECTED

[ ] Location — NOT COLLECTED

[ ] Web history — NOT COLLECTED
    The extension reads the active tab URL to display domain-relevant cookies.
    URLs are never stored, logged, or transmitted. Only the domain name is
    extracted and it is held in memory only for the duration of the popup session.

[ ] User activity — NOT COLLECTED
    The extension sends anonymized feature usage events (e.g., "profile_saved",
    "export_json") to a first-party analytics endpoint for product improvement.
    These events contain no PII, no cookie data, no browsing data, and no
    information that could identify a specific user. Cookie names are SHA-256
    hashed if included in any event. EU users are opted out by default.
    Under CWS definitions, this anonymized telemetry does not constitute
    "user activity" collection because it cannot be linked to an individual.

[ ] Website content — NOT COLLECTED
    The extension accesses cookies via the chrome.cookies API, which is a
    browser API and not website content in the CWS definition. No page HTML,
    DOM content, text, images, or other website content is read, stored,
    or transmitted. Cookies are processed entirely locally and never leave
    the user's device.

SUMMARY: No data types are collected as defined by Chrome Web Store data
disclosure requirements. All cookie data is processed locally. The only
network requests are for optional Pro tier license verification and
authentication, which transmit only license keys and OAuth tokens — never
cookie data or browsing information.

CERTIFICATIONS:

[x] I certify that this extension does not sell user data to third parties,
    outside of the approved use cases.

[x] I certify that this extension does not use or transfer user data for
    purposes that are unrelated to the item's core functionality.

[x] I certify that this extension does not use or transfer user data to
    determine creditworthiness or for lending purposes.
```

---

## 5. privacy-policy-page.md

```markdown
# Privacy Policy — Zovo Cookie Manager

*Last updated: February 2026*
*Effective date: February 2026*

---

## Overview

Zovo Cookie Manager is a Chrome extension developed by Zovo that provides a comprehensive interface for viewing, editing, creating, deleting, exporting, and managing browser cookies. It includes cookie profiles, automated cleanup rules, cookie health scoring, and GDPR tracker analysis.

We are committed to protecting your privacy and being fully transparent about our data practices. This privacy policy explains what data the extension accesses, what is stored, and what (if anything) is transmitted.

**TL;DR: Your cookie data never leaves your device. All cookie processing is local. The only network requests are for optional Pro tier license verification and sign-in — and those requests never contain your cookie data.**

---

## 1. Data Collection

Zovo Cookie Manager does **not** passively collect personal data.

We do not collect:
- Your name, email, or contact information (unless you voluntarily sign in to a Zovo account)
- Your browsing history, visited URLs, or page content
- Cookie names, cookie values, or cookie metadata
- Analytics, telemetry, or usage statistics that could identify you
- Device fingerprints, IP addresses, or hardware identifiers
- Financial information or payment details

### Optional Account Creation

If you choose to upgrade to a paid tier and sign in via Google OAuth:
- Your **email address** and **display name** are received from Google and used solely for Zovo account authentication and subscription management.
- This data is processed by Supabase Auth (our authentication provider) and stored in their SOC 2-compliant infrastructure.
- You initiate this process by clicking "Sign in to Zovo." It never happens automatically.

---

## 2. Local Storage

The extension stores the following data **locally on your device** using Chrome's sandboxed extension storage (`chrome.storage.local` and `chrome.storage.sync`):

| Data | Purpose | Storage Location |
|------|---------|------------------|
| Cookie profiles | Named sets of cookies you save for quick restoration (e.g., "Staging Login") | chrome.storage.local |
| Auto-delete rules | Your rules for automatic cookie cleanup (domain patterns, triggers, exceptions) | chrome.storage.local |
| UI preferences | Theme (dark/light/system), display density, default view, sort preferences | chrome.storage.sync |
| Domain whitelist/blacklist | Domains you protect from or target for deletion | chrome.storage.sync |
| Usage counters | Free-tier limit tracking (profile count, rule count, export count) | chrome.storage.local |
| License cache | Subscription tier and validation timestamp for 72-hour offline grace period | chrome.storage.local |
| Onboarding state | Whether you have completed the first-run experience | chrome.storage.local |
| Cookie cache | Temporary performance cache of recently viewed cookies; invalidated on change | chrome.storage.local |
| Analytics queue | Anonymized feature usage events awaiting batch transmission | chrome.storage.local |
| Auth tokens (if signed in) | Encrypted Zovo JWT and refresh token for Pro tier authentication | chrome.storage.sync |

This locally stored data:
- **Never leaves your device** (except chrome.storage.sync data, which Chrome syncs to your Google account if you have Chrome Sync enabled — this is a Chrome platform feature, not controlled by the extension)
- **Is not transmitted to Zovo servers** (except encrypted profile data during Pro tier cloud sync, which is user-initiated and end-to-end encrypted)
- **Can be cleared** through the extension's Settings page ("Delete All Data") or through Chrome's extension settings
- **Is automatically deleted** by Chrome when you uninstall the extension

---

## 3. Data Transmission

### 3.1 Cookie Data — Never Transmitted

Cookie data (names, values, domains, paths, expiry dates, flags) is **never** transmitted to any external server under any circumstances. All cookie operations — reading, writing, deleting, health scoring, GDPR scanning, profile management — occur entirely within your browser using the Chrome cookies API and locally bundled databases.

### 3.2 Pro Tier Network Requests

If you upgrade to a paid tier, the extension makes the following network requests. **None of these requests contain cookie data.**

| Request | Destination | Data Sent | Frequency |
|---------|-------------|-----------|-----------|
| License validation | LemonSqueezy API (`api.lemonsqueezy.com`) | License key only | Every 24 hours |
| Authentication | Google OAuth (via `chrome.identity`) | Standard OAuth tokens | On sign-in only |
| Token verification | Zovo API (`api.zovo.app/auth/verify`) | Zovo JWT (Bearer token) | Every 24 hours |
| Profile sync (Pro) | Zovo API (`api.zovo.app/sync`) | End-to-end encrypted profile data | User-initiated only |
| Anonymized analytics | Zovo API (`analytics.zovo.app`) | Feature usage events (no PII, no cookie data) | Batched every 5 minutes |

### 3.3 Analytics

The extension collects anonymized feature usage events for product improvement. These events:
- Contain only event names (e.g., "profile_saved", "export_json") and counts
- **Never** contain cookie names, values, domains, or any cookie data
- **Never** contain URLs, page titles, or browsing history
- **Cannot** be linked to an individual user (no user ID, no device ID, no IP logging)
- Use SHA-256 hashing for any cookie-adjacent data (e.g., domain-level aggregates use hashed eTLD+1)
- Are sent to a first-party Zovo endpoint only — no third-party analytics services are used
- Are **disabled by default** for users in EU/EEA timezones
- Can be disabled entirely in the extension's Settings page

### 3.4 Free Tier

In free tier with no Zovo account, the extension makes **no network requests** beyond optional anonymized analytics (which can be disabled). It functions entirely offline.

---

## 4. Third-Party Services

The extension integrates with the following third-party services for Pro tier functionality only:

### LemonSqueezy (Payment Processing)
- **Purpose:** Process subscription payments for Pro tier
- **Data shared:** The extension itself shares nothing with LemonSqueezy. When you click "Upgrade," a LemonSqueezy checkout page opens in your browser. You interact with LemonSqueezy directly. Zovo receives a license key after successful payment.
- **Privacy policy:** https://www.lemonsqueezy.com/privacy
- LemonSqueezy is the Merchant of Record. Zovo never sees, processes, or stores your payment card information.

### Google (Authentication)
- **Purpose:** OAuth sign-in for Zovo membership
- **Data shared:** Standard OAuth flow — Google provides your email and profile name to the extension upon your authorization. The extension exchanges the Google token for a Zovo JWT and discards the Google token.
- **Scopes requested:** `openid`, `email`, `profile` (minimal)
- **Privacy policy:** https://policies.google.com/privacy

### Supabase (Authentication Backend)
- **Purpose:** Manages Zovo user accounts and JWT issuance
- **Data stored:** Email address, display name, subscription tier, account creation date
- **Data NOT stored:** Cookie data, browsing data, extension usage details
- **Compliance:** SOC 2 Type II compliant, hosted on AWS (US region)
- **Privacy policy:** https://supabase.com/privacy

**No other third-party services** receive any data from this extension. No third-party analytics scripts (Google Analytics, Mixpanel, Segment, etc.) are loaded or executed by the extension.

---

## 5. Permissions

The extension requests the following Chrome permissions:

| Permission | Type | Why It Is Needed |
|------------|------|------------------|
| `cookies` | Required | Core functionality: read, create, edit, and delete browser cookies. Listen for cookie changes. |
| `activeTab` | Required | Determine the URL of the active tab to display domain-relevant cookies. Activates only on user click. |
| `storage` | Required | Save preferences, cookie profiles, auto-delete rules, and cached data locally on your device. |
| `tabs` | Required | Read active tab URL for domain filtering, detect tab close for auto-delete rules, identify incognito context. |
| `alarms` | Required | Schedule auto-delete rule timers and periodic maintenance tasks. Required because MV3 service workers cannot use setInterval. |
| `clipboardWrite` | Required | Copy cookie values, cURL commands, and exported data to your clipboard. Write-only; never reads clipboard. |
| `notifications` | Optional | Cookie change alerts when you enable monitoring (Pro). Requested at runtime only. |
| `identity` | Optional | Google OAuth sign-in for Zovo membership. Requested at runtime only when you click "Sign in." |
| `offscreen` | Optional | Clipboard fallback for service worker contexts. Requested at runtime only. |
| `sidePanel` | Optional | Side panel UI mode (Pro). Requested at runtime only. |

**No host permissions** are requested. The extension does not have the ability to "read and change all your data on all websites."

---

## 6. Data Security

- **Content Security Policy:** `script-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'` — only bundled scripts execute; no inline scripts, no eval, no external code.
- **Encryption at rest:** Auth tokens are AES-256-GCM encrypted in extension storage. Pro tier cookie vault uses AES-256-GCM with PBKDF2 key derivation (600,000 iterations).
- **Encryption in transit:** All API communication uses HTTPS (TLS 1.3).
- **Anti-tampering:** License cache is HMAC-signed to prevent local modification.
- **Input sanitization:** All cookie data is treated as untrusted input. HTML entities are escaped before rendering. The extension never uses innerHTML with dynamic content.
- **OAuth security:** PKCE (Proof Key for Code Exchange) is used for all OAuth flows. Minimal scopes are requested. Tokens are short-lived (15-minute JWT, 30-day refresh).

---

## 7. Data Retention

| Data | Retention |
|------|-----------|
| Local extension data (profiles, rules, settings) | Until you delete it or uninstall the extension |
| Zovo account data (email, name, tier) | Until you delete your account |
| Anonymized analytics events | 90 days, then permanently deleted |
| Auth tokens (JWT) | 15-minute expiry (auto-refreshed) |
| Refresh tokens | 30-day expiry |
| License cache | 72 hours (re-validated from server) |

---

## 8. Your Rights

### Access and Portability
- View all locally stored data via Chrome DevTools (Application > Extension Storage)
- Export your cookie profiles and rules as JSON at any time from the extension
- Request a copy of any server-side account data by contacting support@zovo.one

### Deletion
- Delete all local extension data from Settings > "Delete All Data"
- Delete your Zovo account and all associated server-side data from Settings > Account > "Delete Account," or by emailing support@zovo.one
- Uninstalling the extension automatically deletes all local data

### Opt-Out
- Disable anonymized analytics in Settings at any time
- EU/EEA users have analytics disabled by default
- Decline to sign in — all free-tier features work without any account or network access

### Rectification
- Update your email and display name in Settings > Account at any time

We honor all rights under the General Data Protection Regulation (GDPR), California Consumer Privacy Act (CCPA), and equivalent privacy regulations.

---

## 9. Children's Privacy

Zovo Cookie Manager is not directed at children under the age of 13. We do not knowingly collect any personal information from children. If you believe a child has provided personal information through our extension, please contact us at support@zovo.one and we will promptly delete it.

---

## 10. Open Source

Zovo Cookie Manager is open source. You can inspect, audit, and verify every claim in this privacy policy by reviewing the source code:

**GitHub:** https://github.com/theluckystrike/cookie-manager

We welcome security audits and responsible disclosure of any privacy or security concerns.

---

## 11. Changes to This Policy

If we make material changes to this privacy policy, we will:
- Update the "Last updated" date at the top of this page
- Display a notification within the extension
- Notify registered users via email at least 30 days before the changes take effect

Continued use of the extension after changes take effect constitutes acceptance of the updated policy.

---

## 12. Contact

Questions, concerns, or requests regarding this privacy policy:

- **Email:** support@zovo.one
- **Website:** https://zovo.one
- **GitHub Issues:** https://github.com/theluckystrike/cookie-manager/issues

For privacy-specific inquiries, you may also reach us at: privacy@zovo.app

---

*Zovo Cookie Manager is part of the Zovo extension family — premium tools for developers and power users.*
*https://zovo.one*
```

---

## Submission Notes

### Chrome Web Store Privacy Practices Tab — Quick Reference

When filling out the CWS Developer Dashboard privacy section:

1. **Single purpose description:** Copy from Section 1 above (privacy-single-purpose.txt)
2. **Permission justifications:** Copy each permission block from Section 2 above (privacy-permissions.txt)
3. **Remote code:** Select "No, I am not using remote code" and paste the explanation from Section 3
4. **Data usage disclosures:** Check NONE for all data types. Check all three certifications. Use Section 4 text if a free-form explanation field is available.
5. **Privacy policy URL:** Host the Section 5 content at `https://zovo.one/privacy/cookie-manager` and enter that URL in the dashboard.

### Key Points for Reviewer

- Zero host permissions — the extension uses `activeTab` instead of `<all_urls>`
- All cookie processing is local — no cookie data ever leaves the browser
- Optional permissions (`identity`, `notifications`, `offscreen`, `sidePanel`) are requested at runtime only
- Pro tier network requests (LemonSqueezy, Google OAuth, Zovo API) never include cookie data
- Strict CSP with no `unsafe-eval` or `unsafe-inline`
- Open source for full auditability
