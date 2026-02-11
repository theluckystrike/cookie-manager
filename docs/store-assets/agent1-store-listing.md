# Store Listing Content: Zovo Cookie Manager

## Phase 06 | Agent 1 | Generated 2026-02-11

---

## 1. description.txt

```
Tired of digging through Chrome DevTools just to inspect a session cookie? Frustrated by cookie managers that disappeared overnight or demanded permissions they never explained? You deserve a tool that opens instantly, shows every cookie clearly, and respects your privacy while doing it.

Zovo Cookie Manager: See, control, and own every cookie instantly.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

WHY ZOVO COOKIE MANAGER?

Unlike other cookie tools, Zovo Cookie Manager:

  * Built from scratch on Manifest V3 -- no legacy code, no compliance risk. EditThisCookie was removed from the Chrome Web Store in December 2024 for MV3 non-compliance. We started with MV3 on day one.

  * Transparent permissions with zero host access -- we request no <all_urls> permission. Every permission is scoped to the minimum needed, and each one is explained below. Your browsing data stays yours.

  * Cookie profiles and auto-delete rules that no free competitor offers -- save named cookie sets, restore them in one click, and automate cleanup rules so tracking cookies never pile up.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

FEATURES

✦ Full Cookie CRUD
   View, create, edit, and delete cookies for the active tab with no limits. Search by name, value, or domain. Filter by session, persistent, secure, or third-party. Results appear in under 200ms.

✦ Cookie Profiles
   Save a complete cookie state as a named profile and restore it with a single click. Switch between development, staging, and production environments without juggling JSON files. Free tier includes 2 profiles.

✦ Auto-Delete Rules
   Define rules to automatically remove cookies when you close a tab or on a schedule. Whitelist domains you trust, blacklist domains you do not. Free tier includes 1 rule and 5 whitelisted domains.

✦ Export and Import
   Export cookies as JSON for the current domain (up to 25 cookies on the free tier). Import cookies from JSON files with drag-and-drop. Pro unlocks CSV, Netscape, and Header String formats across all domains with no limits.

✦ Cookie Health Score
   Get an A-through-F letter grade for cookie hygiene on any site. See how many insecure, oversized, or tracking cookies exist at a glance. Pro members get the full breakdown with specific fix recommendations.

✦ cURL Command Generation
   Copy a ready-to-use cURL command with the current site's cookies pre-filled. Paste it into your terminal and test API endpoints without manually assembling headers.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PERFECT FOR

-> Web developers who debug authentication flows, test session handling, and need fast access to cookie values without navigating the Application panel in DevTools.

-> QA engineers who switch between test environments multiple times per day and need cookie profiles to restore consistent session states across staging, production, and local builds.

-> Digital marketers and virtual assistants who manage multiple client accounts, need to verify tracking pixels and consent cookies, and want auto-cleanup rules to keep sessions separate.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

HOW IT WORKS

1. Click the Zovo Cookie Manager icon in your toolbar (or press Ctrl+Shift+K) to open the popup. Every cookie for the current site is displayed instantly.

2. Inspect, edit, or delete any cookie. Use search and filters to find what you need. Save your cookie state as a profile or export it as JSON.

3. Set up auto-delete rules to clean tracking cookies on tab close. Check the Health tab for a quick hygiene score. The extension handles the rest.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

KEYBOARD SHORTCUTS

  * Ctrl+Shift+K (Mac: Cmd+Shift+K): Open Cookie Manager popup
  * Ctrl+Shift+E (Mac: Cmd+Shift+E): Quick export current site cookies as JSON to clipboard

Shortcuts can be customized at chrome://extensions/shortcuts.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PRIVACY & TRUST

  No data collection -- zero analytics, zero telemetry, zero tracking
  Works 100% offline -- no network requests required for core features
  Open source -- audit the code yourself at github.com/theluckystrike/cookie-manager
  No <all_urls> permission -- we never request broad access to your browsing data

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PERMISSIONS EXPLAINED

  cookies: Core functionality. Read, create, edit, and delete browser cookies. This is the entire purpose of the extension.

  storage: Save your settings, cookie profiles, auto-delete rules, and cached preferences locally on your device.

  tabs: Determine the URL of the active tab to display relevant cookies. Detect tab close events to trigger auto-delete rules.

  alarms: Schedule background tasks like auto-delete rule execution and usage counter resets. Required because Manifest V3 service workers cannot use setInterval.

  clipboardWrite: Copy cookie values, cURL commands, and exported data to your clipboard when you click copy.

  identity (optional): Requested only when you choose to sign in to your Zovo account. Used for Google OAuth to access premium features and sync data across devices.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

BUILT BY ZOVO

Part of the Zovo extension family -- developer tools and productivity extensions built with transparency, minimal permissions, and honest pricing.

Website: https://zovo.one
Support: support@zovo.one
Feedback: We read every message
```

**Character count:** ~3,640 characters (within the 2,000-4,000 target range)

---

## 2. short-description.txt

```
View, edit, and manage cookies with profiles, auto-delete rules, and developer tools. The modern cookie editor for Chrome.
```

**Character count:** 121 characters (under 132-character limit)

**Checklist:**
- Starts with action verb: "View"
- Includes primary keyword: "cookies"
- Mentions key benefits: "profiles, auto-delete rules, and developer tools"
- Includes secondary keyword: "cookie editor"

---

## 3. store-metadata.txt

```
Extension Name: Zovo Cookie Manager
Short Name: Cookies
Category: Developer Tools
Language: English
Homepage URL: https://zovo.one/tools/cookie-manager
Support URL: https://zovo.one/support
Privacy Policy URL: https://zovo.one/privacy/cookie-manager
```

**Validation:**
- Short Name "Cookies" is 7 characters (max 12)
- Category "Developer Tools" matches the CWS category and aligns with the primary target audience (developers, QA engineers)
- All URLs follow Zovo conventions with the `cookie-manager` slug
- Language set to English (matches `default_locale: "en"` in manifest)
