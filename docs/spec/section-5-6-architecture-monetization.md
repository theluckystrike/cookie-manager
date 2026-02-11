# Zovo Cookie Manager: Technical Architecture & Monetization Integration

**Sections 5-6 of Extension Specification**
**Date:** February 2026
**Status:** Development-Ready

---

## Section 5: Technical Architecture

### 5.1 Chrome Permissions

Every permission is justified below. This is the minimum set required for full functionality. Optional permissions are requested at runtime only when the user activates the corresponding feature.

| Permission | Type | Reason |
|------------|------|--------|
| `cookies` | Required | Core functionality. Read, write, and delete cookies via `chrome.cookies` API. Listen to `chrome.cookies.onChanged` for real-time monitoring (Pro). |
| `activeTab` | Required | Access the current tab's URL to scope cookie display to the active domain. Avoids the broader `<all_urls>` host permission. |
| `storage` | Required | Persist settings, profiles, rules, usage counters, and cached data via `chrome.storage.local` and `chrome.storage.sync`. |
| `tabs` | Required | Read tab URLs for domain filtering, detect tab close events for auto-delete rule triggers, and identify incognito context for cookie store scoping. |
| `alarms` | Required | Schedule background timers for auto-delete rule execution, periodic license validation (every 24 hours), and analytics batch sends. MV3 service workers cannot use `setInterval` reliably. |
| `notifications` | Optional | Cookie change alerts and rule execution confirmations (Pro). Requested at runtime when the user enables monitoring notifications in settings. |
| `clipboardWrite` | Required | Copy cookie values, cURL commands, and exported data to the clipboard. Used in every core workflow. |
| `identity` | Optional | Google OAuth sign-in for Zovo membership. Requested at runtime when the user clicks "Sign in to Zovo." Not needed for free-tier functionality. |
| `offscreen` | Optional | Create offscreen documents for clipboard operations in MV3 contexts where `document.execCommand('copy')` is unavailable from the service worker. |
| `sidePanel` | Optional | Register the extension as a Chrome side panel (Pro feature). Requested when user selects side panel mode. |
| `devtools` | N/A (declared in manifest) | DevTools panel integration. No explicit permission needed; declared via `devtools_page` in manifest.json. |

**Host permissions:** None requested at install time. The `activeTab` permission grants temporary access to the current tab's origin when the user clicks the extension icon, avoiding the "This extension can read and change all your data on all websites" warning that erodes trust.

---

### 5.2 Storage Schema

#### 5.2.1 `chrome.storage.local` -- Device-Specific Data (10 MB limit)

```typescript
interface LocalStorage {
  // Cached cookie data for performance (avoids re-querying chrome.cookies API)
  // Invalidated on chrome.cookies.onChanged events
  // Estimated size: 50-500 KB depending on cookie count
  cookies_cache: {
    [domain: string]: {
      cookies: ChromeCookie[];
      fetched_at: string; // ISO 8601
    };
  };

  // Saved cookie profiles
  // Free: max 2 profiles. Starter: 10. Pro/Team: unlimited.
  // Estimated size: 1-5 KB per profile (average 20 cookies per profile)
  profiles: CookieProfile[];

  // Auto-delete rules
  // Free: max 1 rule. Starter: 5. Pro/Team: unlimited.
  // Estimated size: 200-500 bytes per rule
  rules: AutoDeleteRule[];

  // Cookie snapshots (Pro only)
  // Estimated size: 2-10 KB per snapshot
  snapshots: CookieSnapshot[];

  // Last health scan results cached locally
  // Estimated size: 5-20 KB
  health_cache: {
    [domain: string]: {
      score: string;        // "A+" through "F"
      issues: HealthIssue[];
      scanned_at: string;   // ISO 8601
    };
  };

  // Usage tracking for free-tier limit enforcement
  usage: {
    profiles_count: number;       // Current saved profiles (default: 0)
    rules_count: number;          // Current active rules (default: 0)
    exports_this_month: number;   // Reset on 1st of each month (default: 0)
    exports_month_reset: string;  // ISO date of last reset
    gdpr_scans_used: number;      // Free: 1 scan. Reset monthly. (default: 0)
    bulk_ops_today: number;       // Free: 0 bulk ops. (default: 0)
    bulk_ops_date_reset: string;  // ISO date of last reset
  };

  // Queued analytics events for batch transmission
  // Flushed every 5 minutes or when queue exceeds 50 events
  // Estimated size: 100-200 bytes per event
  analytics_queue: AnalyticsEvent[];

  // Offline sync queue -- changes made while offline
  // Replayed on reconnect
  sync_queue: SyncOperation[];

  // License validation cache for 72-hour offline grace period
  license_cache: {
    tier: "free" | "starter" | "pro" | "team";
    validated_at: string; // ISO 8601
    expires_at: string;   // validated_at + 72 hours
    signature: string;    // HMAC to prevent tampering
  } | null;

  // First-run and onboarding state
  onboarding: {
    completed: boolean;       // default: false
    installed_at: string;     // ISO 8601
    first_profile_saved: boolean;
    first_rule_created: boolean;
    first_export: boolean;
    paywall_dismissals: {
      [trigger_id: string]: string; // ISO date of last dismissal
    };
  };
}

interface CookieProfile {
  id: string;              // UUID v4
  name: string;            // User-defined, max 64 chars
  domain: string;          // Primary domain, e.g., "example.com"
  cookies: ChromeCookie[]; // Array of cookie objects
  url_pattern?: string;    // Auto-load pattern, e.g., "*.staging.example.com" (Pro)
  created_at: string;      // ISO 8601
  updated_at: string;      // ISO 8601
  synced_at?: string;      // Last cloud sync timestamp (Pro)
}

interface AutoDeleteRule {
  id: string;              // UUID v4
  name: string;            // User-defined, max 64 chars
  pattern: string;         // Domain glob, e.g., "*.example.com"
  trigger: "tab_close" | "timer" | "browser_start" | "manual";
  interval_minutes?: number; // For timer trigger (default: 60, min: 5)
  exceptions: string[];    // Cookie names to exclude from deletion
  delete_first_party: boolean;  // default: true
  delete_third_party: boolean;  // default: true
  enabled: boolean;        // default: true
  created_at: string;      // ISO 8601
  last_executed_at?: string;
}

interface CookieSnapshot {
  id: string;              // UUID v4
  name: string;            // Auto-generated or user-defined
  domain: string;          // Scope of snapshot
  cookies: ChromeCookie[];
  created_at: string;      // ISO 8601
}

interface AnalyticsEvent {
  event: string;           // e.g., "profile_saved", "export_json", "paywall_shown"
  properties: Record<string, string | number | boolean>;
  timestamp: string;       // ISO 8601
  session_id: string;      // Random ID per extension open
}

interface SyncOperation {
  type: "upsert_profile" | "delete_profile" | "upsert_rule" | "delete_rule";
  payload: unknown;
  timestamp: string;
  retry_count: number;     // Max 3 retries before discard
}
```

#### 5.2.2 `chrome.storage.sync` -- Cross-Device Data (100 KB total, 8 KB per item)

```typescript
interface SyncStorage {
  // User preferences -- syncs across all devices
  // Estimated size: 200-500 bytes
  settings: {
    theme: "system" | "light" | "dark";           // default: "system"
    default_tab: "cookies" | "profiles" | "rules"; // default: "cookies"
    popup_height: number;           // default: 520, range: 400-800
    popup_width: number;            // default: 380, range: 320-600
    default_export_format: "json" | "netscape" | "csv" | "header"; // default: "json"
    show_cookie_count_badge: boolean; // default: true
    confirm_delete: boolean;        // default: true
    auto_refresh_on_change: boolean; // default: true
    compact_mode: boolean;          // default: false
  };

  // Zovo authentication state -- shared across ALL Zovo extensions
  // Written by whichever extension handles login; read by all.
  // Estimated size: 500-1000 bytes
  zovo_auth: {
    tier: "free" | "starter" | "pro" | "team";  // default: "free"
    token: string;          // JWT from Zovo backend (max 2KB)
    refresh_token: string;  // For silent token refresh
    expires: string;        // ISO 8601, token expiry
    user_id: string;        // UUID from Supabase Auth
    email: string;          // User email
    display_name?: string;  // Optional display name
    team_id?: string;       // For team tier, the team identifier
    authenticated_at: string; // ISO 8601
  } | null;

  // Whitelist/blacklist domain lists (small enough for sync)
  // Estimated size: 1-5 KB
  domain_lists: {
    whitelist: string[];    // Max 100 entries in sync; overflow to local
    blacklist: string[];    // Max 100 entries in sync; overflow to local
  };
}
```

**Size budget:** The `zovo_auth` object is the largest sync item at approximately 1 KB. Settings add approximately 500 bytes. Domain lists add 1-5 KB. Total sync usage stays well under the 100 KB ceiling even with generous domain lists.

---

### 5.3 API Requirements

All API calls target `https://api.zovo.app/v1/`. The extension never communicates directly with LemonSqueezy; all payment verification flows through the Zovo backend.

| Endpoint | Method | Purpose | Auth | Rate Limit |
|----------|--------|---------|------|------------|
| `/auth/google` | POST | Exchange Google OAuth credential for Zovo JWT. Body: `{ id_token: string }`. Returns: `{ token, refresh_token, user, tier }`. | None (public) | 10 req/min per IP |
| `/auth/refresh` | POST | Refresh an expired JWT. Body: `{ refresh_token: string }`. Returns: `{ token, expires }`. | Refresh token | 5 req/min per user |
| `/auth/verify` | GET | Validate current license tier. Returns: `{ tier, expires, features }`. Called on extension open + every 24 hours via alarm. | Bearer JWT | 60 req/hour per user |
| `/sync/profiles` | GET | Download all cloud-synced profiles for the authenticated user. Returns: `{ profiles: CookieProfile[], last_modified: string }`. | Bearer JWT | 30 req/hour |
| `/sync/profiles` | PUT | Upload local profiles to cloud. Body: `{ profiles: CookieProfile[], client_timestamp: string }`. Returns: `{ merged: CookieProfile[], conflicts: [] }`. | Bearer JWT | 30 req/hour |
| `/sync/rules` | GET | Download cloud-synced rules. | Bearer JWT | 30 req/hour |
| `/sync/rules` | PUT | Upload local rules to cloud. | Bearer JWT | 30 req/hour |
| `/analytics/events` | POST | Batch send analytics events. Body: `{ events: AnalyticsEvent[] }`. Max 100 events per request. | Bearer JWT or anonymous ID | 12 req/hour |
| `/gdpr/scan` | POST | Submit domain cookies for server-side GDPR analysis against tracking databases. Body: `{ domain: string, cookies: CookieSummary[] }`. Returns: `{ categories, issues, score }`. | Bearer JWT | 10 req/hour |

**Error handling strategy:**

| HTTP Status | Behavior |
|-------------|----------|
| 401 Unauthorized | Attempt token refresh via `/auth/refresh`. If refresh fails, clear `zovo_auth` from sync storage and prompt re-login. |
| 403 Forbidden | Tier insufficient. Cache the denial. Show upgrade prompt. |
| 429 Too Many Requests | Exponential backoff: 1s, 2s, 4s, 8s, max 60s. Respect `Retry-After` header if present. |
| 500+ Server Error | Retry up to 3 times with exponential backoff. After 3 failures, queue the operation in `sync_queue` for later retry. |
| Network Error | Queue operation in `sync_queue`. Set `offline` flag. Retry on `navigator.onLine` change event. |

---

### 5.4 Sync Architecture

**What syncs and where:**

| Data | Storage Layer | Sync Mechanism | Tier Required |
|------|---------------|----------------|---------------|
| Settings (theme, defaults) | `chrome.storage.sync` | Automatic via Chrome sync | Free |
| Auth state | `chrome.storage.sync` | Automatic via Chrome sync | Free |
| Whitelist/blacklist | `chrome.storage.sync` | Automatic via Chrome sync | Free |
| Profiles (< 5 KB total) | `chrome.storage.sync` | Automatic via Chrome sync | Starter+ |
| Profiles (> 5 KB total) | Zovo API | `PUT /sync/profiles` | Pro+ |
| Rules | Zovo API | `PUT /sync/rules` | Pro+ |
| Snapshots | Local only | No sync (too large) | Pro+ |

**Sync frequency:**
- **Settings:** Immediate on change via `chrome.storage.onChanged` listener. Chrome handles cross-device propagation.
- **Profiles/Rules (API):** On every local mutation + background poll every 15 minutes via `chrome.alarms`.
- **License verification:** Every 24 hours via alarm, plus on every extension popup open.

**Conflict resolution:** Last-write-wins with ISO 8601 timestamps. Each profile and rule carries an `updated_at` field. When the server receives a PUT, it compares `client_timestamp` against `last_modified`. If the server copy is newer, the response includes a `conflicts` array and the client prompts the user to choose. For settings, Chrome's built-in sync handles conflicts automatically (last write wins).

**Offline behavior:**
1. All mutations are applied locally immediately.
2. If the API is unreachable, the mutation is appended to `sync_queue` in local storage.
3. A `navigator.onLine` event listener and a 5-minute alarm trigger queue replay.
4. Queue operations include a `retry_count` (max 3). After 3 failures, the operation is discarded and the user is notified.
5. License validation uses the 72-hour grace period: if `license_cache.validated_at` is within 72 hours, Pro features remain unlocked even without network access.

---

### 5.5 Background Service Worker

The service worker (`background/service-worker.ts`) is the only persistent execution context in Manifest V3. It handles all event-driven logic.

**Registered alarms:**

| Alarm Name | Interval | Purpose |
|------------|----------|---------|
| `license-check` | 24 hours | Call `GET /auth/verify` to validate subscription tier. Update `zovo_auth` in sync storage and `license_cache` in local storage. |
| `analytics-flush` | 5 minutes | If `analytics_queue` has events, batch send via `POST /analytics/events`. Clear queue on success. |
| `sync-poll` | 15 minutes | For Pro+ users: pull latest profiles and rules from the Zovo API. Merge with local state. |
| `rule-timer-{id}` | Per-rule interval | One alarm per timer-triggered auto-delete rule. On fire: query `chrome.cookies.getAll` for matching pattern, delete matches, log execution. |
| `usage-reset-monthly` | 24 hours | Check if the calendar month has changed. If so, reset `exports_this_month` and `gdpr_scans_used` counters. |

**Event listeners:**

```typescript
// Cookie change monitoring (Pro) -- core of real-time monitoring feature
chrome.cookies.onChanged.addListener((changeInfo) => {
  // Log to change_history in local storage
  // If monitoring is enabled for this domain, push notification
  // Invalidate cookies_cache for the affected domain
});

// Tab close -- trigger auto-delete rules with "tab_close" trigger
chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  // Look up the URL associated with tabId from cached tab state
  // Match against rules with trigger === "tab_close"
  // Execute matching rules (delete cookies matching pattern)
});

// Track tab URLs for auto-delete rule matching
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Cache tab URL for use in onRemoved (which does not provide URL)
});

// Extension install/update lifecycle
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    // Initialize default settings in chrome.storage.sync
    // Set onboarding.completed = false
    // Register all alarms
  }
  if (details.reason === "update") {
    // Run migration logic if storage schema changed
    // Re-register alarms (they persist across updates but re-register for safety)
  }
});

// Service worker wake-up -- re-register alarms if they were lost
chrome.runtime.onStartup.addListener(() => {
  // Verify alarms exist, re-create any missing ones
  // Check license_cache validity
});

// Cross-extension messaging (Zovo ecosystem)
chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
  // Accept auth state updates from other Zovo extensions
  // Accept profile load requests from Zovo Form Filler
  // Validate sender.id against known Zovo extension IDs
});
```

**Service worker lifecycle considerations:** MV3 service workers are terminated after approximately 30 seconds of inactivity. All state must be persisted to `chrome.storage`. The worker relies entirely on `chrome.alarms` for scheduled work and event listeners for reactive work. No global variables are used for persistent state.

---

### 5.6 Third-Party Dependencies

| Dependency | Size | Purpose | Justification |
|------------|------|---------|---------------|
| **Preact** | 3 KB gzipped | Popup and options page UI rendering | Provides component model and reactive state without React's 40 KB overhead. Alternatively, use vanilla JS with a 1 KB reactive library like Sinuous. Final decision deferred to build phase benchmarking. |
| **@zovo/auth** | ~5 KB | Shared authentication module across all Zovo extensions | Published as internal NPM package. Handles OAuth flow, token storage, token refresh, tier checking, and cross-extension auth broadcasting. |
| **uuid** (nanoid) | 1 KB | Generate unique IDs for profiles, rules, snapshots | `crypto.randomUUID()` is available in MV3 service workers; use that instead if targeting Chrome 92+. Nanoid as fallback for older contexts. |
| **None (crypto)** | 0 KB | AES-256 encryption for encrypted exports | Use the Web Crypto API (`SubtleCrypto`) built into Chrome. No library needed. |

**External services:**

| Service | Purpose | Free Tier Limits |
|---------|---------|------------------|
| **Supabase Auth** | User authentication, Google OAuth provider | 50,000 MAU, unlimited API requests |
| **Supabase Database** | Store user records, subscription status, synced profiles/rules | 500 MB database, 1 GB transfer |
| **Supabase Edge Functions** | Serverless API endpoints (`/auth/*`, `/sync/*`, `/analytics/*`) | 500K invocations/month |
| **LemonSqueezy** | Payment processing, subscription management, license keys | No free tier limit (pay per transaction: 5% + $0.50) |
| **Disconnect.me tracking lists** | Open-source tracker database for GDPR cookie categorization | Free, MIT-licensed, updated weekly |
| **EasyList cookie lists** | Supplementary cookie classification data | Free, GPL-licensed |

---

### 5.7 Manifest V3 File Structure

```
cookie-manager/
├── manifest.json              # MV3 manifest with permissions, service worker, popup
├── package.json               # Build dependencies, scripts
├── tsconfig.json              # TypeScript configuration
├── vite.config.ts             # Build tool (Vite for fast HMR in dev, optimized prod builds)
├── src/
│   ├── popup/                 # Extension popup UI (default interaction surface)
│   │   ├── index.html
│   │   ├── index.tsx          # Entry point
│   │   ├── App.tsx            # Root component
│   │   ├── components/
│   │   │   ├── CookieList.tsx       # Main cookie table with inline editing
│   │   │   ├── CookieDetail.tsx     # Expanded cookie view/edit form
│   │   │   ├── ProfileManager.tsx   # Save/load/switch profiles
│   │   │   ├── RuleEditor.tsx       # Auto-delete rule configuration
│   │   │   ├── ExportPanel.tsx      # Export format selection and execution
│   │   │   ├── ImportPanel.tsx      # Import file handling
│   │   │   ├── SearchBar.tsx        # Search/filter with regex toggle
│   │   │   ├── DomainTree.tsx       # Hierarchical domain navigation
│   │   │   ├── HealthScore.tsx      # Cookie health badge
│   │   │   ├── PaywallPrompt.tsx    # Contextual upgrade prompts
│   │   │   └── ZovoAuth.tsx         # Sign-in/account UI
│   │   └── styles/
│   │       ├── popup.css            # Scoped popup styles
│   │       └── themes.css           # Light/dark/system theme variables
│   ├── options/               # Full-page settings (opens in new tab)
│   │   ├── index.html
│   │   ├── index.tsx
│   │   └── components/
│   │       ├── GeneralSettings.tsx
│   │       ├── AccountSettings.tsx
│   │       ├── RuleManager.tsx      # Full rule management UI
│   │       ├── ProfileLibrary.tsx   # All profiles with sync status
│   │       ├── MoreFromZovo.tsx     # Cross-extension promotion
│   │       └── About.tsx
│   ├── background/            # MV3 service worker
│   │   ├── service-worker.ts        # Entry point, alarm + event registration
│   │   ├── rules-engine.ts          # Auto-delete rule execution logic
│   │   ├── cookie-monitor.ts        # chrome.cookies.onChanged handler
│   │   ├── sync-manager.ts          # API sync orchestration, conflict resolution
│   │   └── license-checker.ts       # Periodic license validation
│   ├── devtools/              # Chrome DevTools panel (Phase 3)
│   │   ├── devtools.html            # DevTools page declaration
│   │   ├── panel.html               # Panel UI
│   │   └── panel.tsx
│   ├── sidepanel/             # Chrome side panel (Pro, Phase 3)
│   │   ├── index.html
│   │   └── index.tsx
│   ├── content/               # Content scripts (minimal footprint)
│   │   └── cookie-banner-detect.ts  # Detect consent banners for GDPR context
│   ├── shared/                # Shared modules used across all contexts
│   │   ├── storage.ts               # Typed wrappers for chrome.storage get/set
│   │   ├── auth.ts                  # @zovo/auth integration (imports the NPM module)
│   │   ├── analytics.ts             # Event tracking, queue management
│   │   ├── constants.ts             # Tier limits, feature flags, known extension IDs
│   │   ├── cookie-utils.ts          # Cookie parsing, formatting, comparison
│   │   ├── export-formats.ts        # JSON, Netscape, CSV, Header serializers
│   │   ├── import-parsers.ts        # JSON, Netscape, CSV deserializers
│   │   ├── crypto.ts                # AES encrypt/decrypt wrappers (Web Crypto API)
│   │   ├── tier-guard.ts            # Check if current tier allows a feature
│   │   └── i18n.ts                  # Internationalization helper
│   └── types/                 # TypeScript type definitions
│       ├── chrome.d.ts              # Chrome API type augmentations
│       ├── storage.d.ts             # LocalStorage, SyncStorage interfaces
│       ├── cookie.d.ts              # CookieProfile, AutoDeleteRule, etc.
│       └── api.d.ts                 # API request/response types
├── assets/
│   ├── icons/                 # Extension icons (16, 32, 48, 128 px)
│   ├── images/                # Paywall previews, onboarding illustrations
│   └── sounds/                # Optional notification sounds
├── _locales/                  # Chrome i18n message files
│   ├── en/messages.json
│   ├── fil/messages.json      # Filipino/Tagalog
│   ├── es/messages.json
│   ├── ja/messages.json
│   └── de/messages.json
├── dist/                      # Built output (gitignored, produced by Vite)
└── tests/
    ├── unit/                  # Storage, cookie-utils, export-formats tests
    └── integration/           # Service worker alarm tests, sync flow tests
```

---

## Section 6: Monetization Integration

### 6.1 Pricing Tiers

| Tier | Monthly | Annual | Annual Savings | Per-Month (Annual) | Key Cookie Manager Features |
|------|---------|--------|----------------|--------------------|----------------------------|
| **Free** | $0 | $0 | -- | -- | Full CRUD, search, JSON export (current site), 2 profiles, 1 auto-delete rule, 1 GDPR scan, cURL gen (current site), cookie count badge, dark/light mode |
| **Starter** | $4 | $36 | $12 (25%) | $3 | 10 profiles, 5 rules, all export formats (current site), 5 snapshots, regex search, unlimited whitelist/blacklist |
| **Pro** | $7 | $60 | $24 (29%) | $5 | Unlimited profiles/rules/snapshots, all export formats (all cookies), real-time monitoring, GDPR scanner, cookie health score, encrypted export, cloud sync, side panel mode, DevTools panel editing, bulk edit, auto-load profiles by URL |
| **Team** | $14 (5 seats) | $120 (5 seats) | $48 (29%) | $10 | Everything in Pro + team profile sharing, shared cookie library, environment presets, activity log, admin dashboard, onboarding templates |

**Tier limit constants (hardcoded in `shared/constants.ts`):**

```typescript
export const TIER_LIMITS = {
  free:    { profiles: 2,  rules: 1,  snapshots: 0,   export_cookies_max: 25, gdpr_scans_monthly: 1,  whitelist: 5,  blacklist: 5,  cookie_locks: 5,  block_rules: 3 },
  starter: { profiles: 10, rules: 5,  snapshots: 5,   export_cookies_max: 200, gdpr_scans_monthly: 5, whitelist: 50, blacklist: 50, cookie_locks: 25, block_rules: 10 },
  pro:     { profiles: -1, rules: -1, snapshots: -1,  export_cookies_max: -1,  gdpr_scans_monthly: -1, whitelist: -1, blacklist: -1, cookie_locks: -1, block_rules: -1 },
  team:    { profiles: -1, rules: -1, snapshots: -1,  export_cookies_max: -1,  gdpr_scans_monthly: -1, whitelist: -1, blacklist: -1, cookie_locks: -1, block_rules: -1 },
} as const; // -1 = unlimited
```

---

### 6.2 Payment Integration

**Payment provider:** LemonSqueezy (Stripe-owned). Acts as Merchant of Record, handling global VAT/sales tax, subscription management, dunning, and license key generation.

**Checkout flow:**

1. User hits a paywall trigger inside Cookie Manager (e.g., attempts to save a 3rd profile).
2. Extension opens `https://zovo.app/upgrade?source=cookie-manager&trigger=profile_limit&tier=starter` in a new tab.
3. The Zovo web app displays the pricing page with the triggering context highlighted (e.g., "Unlock unlimited cookie profiles").
4. User selects a plan and completes payment via LemonSqueezy embedded checkout.
5. LemonSqueezy fires a `subscription_created` webhook to `https://api.zovo.app/webhooks/lemonsqueezy`.
6. Zovo backend (Supabase Edge Function) receives the webhook, verifies signature, creates/updates user record in Postgres, generates a JWT with `tier` claim.
7. Zovo web app stores the JWT in the response and signals the extension via a custom URL scheme or `chrome.runtime.sendMessage` (if the Zovo Hub extension is installed).
8. If the extension is still open, it polls `GET /auth/verify` (triggered by a `storage.onChanged` listener on the web app's localStorage, or by a 5-second polling interval on the upgrade page).
9. On successful verification, the extension writes `zovo_auth` to `chrome.storage.sync` with the new tier.
10. All installed Zovo extensions immediately read the updated `zovo_auth` via `chrome.storage.onChanged` and unlock Pro features.

**License verification flow:**

```
Extension opens
  └─> Read zovo_auth from chrome.storage.sync
       ├─> tier === "free" → show free UI, no API call needed
       ├─> token exists, not expired → show Pro UI, schedule background verify
       ├─> token exists, expired → call POST /auth/refresh
       │    ├─> success → update token, show Pro UI
       │    └─> failure → check license_cache (72-hour grace)
       │         ├─> within 72 hours → show Pro UI with "Reconnect" banner
       │         └─> expired → downgrade to free UI, prompt re-login
       └─> no token → show free UI
```

**Background license check (every 24 hours via `license-check` alarm):**
1. Call `GET /auth/verify` with Bearer token.
2. On success: update `license_cache.validated_at` to now. Update tier if changed.
3. On 401: attempt token refresh. If refresh fails, start 72-hour grace countdown.
4. On network error: no action (grace period covers this).

---

### 6.3 Trial Strategy

**No time-based trial.** Instead, use "taste" mechanics that let users experience premium value organically:

| Free Allowance | What It Demonstrates | Upgrade Trigger |
|----------------|----------------------|-----------------|
| 2 cookie profiles | Save/load workflow value | 3rd profile save attempt |
| 1 auto-delete rule | Automation convenience | 2nd rule creation attempt |
| 1 GDPR compliance scan | Compliance report value | 2nd scan attempt |
| 25-cookie JSON export (current site) | Export utility | Export > 25 cookies or select non-JSON format |
| cURL generation (current site) | Developer tool value | Attempt cURL for a profile or multi-domain set |
| 5 whitelist/blacklist entries | Domain management | 6th entry attempt |
| 5 cookie locks | Cookie protection value | 6th lock attempt |

**Why this works better than a 14-day trial:**
- Users retain free-tier value indefinitely, keeping the extension installed (uninstall rate stays low).
- The paywall appears at the moment of demonstrated need, not on an arbitrary calendar date.
- Users who never need Pro features remain as free users contributing to install count, ratings, and word-of-mouth.
- Research shows "taste" mechanics achieve 5-8% conversion vs. 2-5% baseline for time-limited trials in the Chrome extension market.

**Paywall dismissal behavior:** When a user dismisses an upgrade prompt, the `trigger_id` and timestamp are recorded in `onboarding.paywall_dismissals`. The same trigger will not appear again for 7 days. After 3 dismissals of the same trigger, frequency reduces to once per 30 days.

---

### 6.4 Zovo Membership Integration

**How Cookie Manager checks Pro status:**

```typescript
// shared/tier-guard.ts
import { TIER_LIMITS } from "./constants";

type Feature = keyof typeof TIER_LIMITS.free;

export async function canUse(feature: Feature, currentCount?: number): Promise<boolean> {
  const { zovo_auth } = await chrome.storage.sync.get("zovo_auth");
  const tier = zovo_auth?.tier ?? "free";
  const limit = TIER_LIMITS[tier][feature];
  if (limit === -1) return true; // unlimited
  if (currentCount !== undefined) return currentCount < limit;
  return limit > 0;
}

export async function getCurrentTier(): Promise<string> {
  const { zovo_auth } = await chrome.storage.sync.get("zovo_auth");
  return zovo_auth?.tier ?? "free";
}
```

**Cross-extension authentication:**

When a user upgrades via ANY Zovo extension (e.g., upgrades through Clipboard History Pro), the following happens:

1. The extension that handled the upgrade writes the new `zovo_auth` object to `chrome.storage.sync`.
2. `chrome.storage.onChanged` fires in every Zovo extension's service worker.
3. Each extension reads the updated `zovo_auth.tier` and refreshes its UI state.
4. No inter-extension messaging required for auth propagation -- `chrome.storage.sync` handles it natively.

For active UI updates (when the popup is open during an upgrade in another extension):

```typescript
// In popup/App.tsx -- listen for auth changes while popup is open
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "sync" && changes.zovo_auth) {
    const newTier = changes.zovo_auth.newValue?.tier ?? "free";
    setTier(newTier); // Re-render UI with new tier capabilities
  }
});
```

**"More from Zovo" section:**

The options page (`options/components/MoreFromZovo.tsx`) displays a grid of other Zovo extensions with:
- Extension name, icon, and one-line description.
- Install status (detected via `chrome.management.getAll()` if the `management` permission is added, or via a known-extensions registry checked against `chrome.runtime.sendMessage` to each extension ID).
- "Install" button linking to the Chrome Web Store listing.
- Badge showing "Included in your plan" for Starter+ users.

**Cross-extension feature integrations (Phase 4):**

| Integration | Mechanism | Description |
|-------------|-----------|-------------|
| **Form Filler triggers profile load** | `chrome.runtime.sendMessage` to Cookie Manager's extension ID with `{ action: "load_profile", profile_id: "..." }` | When Form Filler loads a form profile for a domain, it can also load the associated cookie profile. |
| **JSON Formatter renders cookie exports** | Open `chrome-extension://{json-formatter-id}/viewer.html?data=...` | When exporting cookies as JSON, offer "View in JSON Formatter" button that opens the formatted output in the Zovo JSON Formatter extension. |
| **Clipboard History captures exports** | Standard clipboard write via `navigator.clipboard.writeText()` | Cookie exports copied to clipboard automatically appear in Clipboard History Pro. No special integration needed. |
| **Tab Manager saves cookie state** | `chrome.runtime.sendMessage` to Cookie Manager with `{ action: "snapshot_for_session", tab_urls: [...] }` | When Tab Manager saves a session, it requests Cookie Manager to create a snapshot, so both tabs and cookies restore together. |

All cross-extension messages validate `sender.id` against a hardcoded allowlist of Zovo extension IDs in `shared/constants.ts` to prevent unauthorized extensions from triggering actions.

---

### 6.5 Analytics Events for Monetization Optimization

The following events feed into conversion funnel analysis, tracked via the `analytics_queue` and flushed to `POST /analytics/events`:

| Event | Properties | Purpose |
|-------|------------|---------|
| `extension_opened` | `tier`, `cookie_count`, `session_number` | Measure engagement frequency |
| `paywall_shown` | `trigger_id`, `tier`, `feature_attempted` | Track which limits users hit |
| `paywall_dismissed` | `trigger_id`, `dismissal_count` | Measure paywall fatigue |
| `paywall_clicked` | `trigger_id`, `destination_url` | Track upgrade intent |
| `upgrade_completed` | `from_tier`, `to_tier`, `billing_cycle`, `trigger_id` | Attribute conversions to triggers |
| `feature_used` | `feature_name`, `tier` | Understand which Pro features retain users |
| `profile_saved` | `profile_count`, `tier` | Track progression toward limit |
| `rule_created` | `rule_count`, `trigger_type`, `tier` | Track automation adoption |
| `export_completed` | `format`, `cookie_count`, `tier` | Track export usage patterns |

All analytics are privacy-respecting: no cookie values, no URLs, no PII beyond the user's Zovo account email (which they consented to at sign-up). Events are batched locally and sent every 5 minutes to minimize network overhead.
