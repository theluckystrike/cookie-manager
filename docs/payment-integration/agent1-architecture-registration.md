# Agent 1: Architecture & Product Registration

**Extension:** Zovo Cookie Manager
**Phase:** 09 -- Extension Payment Integration
**Role:** System architect and product registrar
**Dependencies:** Phase 02 spec (features, tiers), Phase 04 monetization spec (TIER_LIMITS, PaywallController), Phase 09 playbook (integration guide)
**Output:** Architecture diagrams, product registration, tier mapping, security considerations

---

## 1. System Architecture

### 1.1 Architecture Diagram

```
                        Cookie Manager Extension                                  Zovo Backend (Supabase)
 +---------------------------------------------------------+    HTTPS     +----------------------------------------+
 |                                                         |              |                                        |
 |  +-------------------+    +-------------------------+   |              |  +----------------------------------+   |
 |  | Popup / SidePanel |    | Background Service      |   |              |  | verify-extension-license         |   |
 |  | (Preact UI)       |    | Worker                  |   |              |  | (Edge Function)                  |   |
 |  |                   |    |                         |   |              |  |                                  |   |
 |  | +---------------+ |    | +---------------------+ |   |   POST      |  | - Validate license key format    |   |
 |  | | PaywallPrompt | |    | | license-checker.ts  |----+------------>|  | - Query licenses table           |   |
 |  | | (T1-T17)      | |    | | (24h alarm cycle)   | |   |              |  | - Check subscription status      |   |
 |  | +-------+-------+ |    | +---------------------+ |   |              |  | - Return tier + features array   |   |
 |  |         |          |    |                         |   |              |  +----------------------------------+   |
 |  | +-------v-------+ |    | +---------------------+ |   |              |                                        |
 |  | | tier-guard.ts  | |    | | analytics.ts        |   |   POST      |  +----------------------------------+   |
 |  | | canUse()       | |    | | (5min flush alarm) |----+------------>|  | log-paywall-hit                  |   |
 |  | +---------------+ |    | +---------------------+ |   |              |  | (Edge Function)                  |   |
 |  |                   |    |                         |   |              |  |                                  |   |
 |  | +---------------+ |    | +---------------------+ |   |              |  | - Record paywall encounter       |   |
 |  | | ZovoAuth.tsx  | |    | | sync-manager.ts     |   |              |  | - Enqueue drip email sequence    |   |
 |  | | (Google OAuth) | |    | | (15min poll alarm) |   |              |  | - Track conversion funnel        |   |
 |  | +---------------+ |    | +---------------------+ |   |              |  +----------------------------------+   |
 |  +-------------------+    +-------------------------+   |              |                                        |
 |                                                         |   POST      |  +----------------------------------+   |
 |  +---------------------------------------------------+  +------------>|  | collect-analytics                |   |
 |  |                   Storage Layer                    |  |              |  | (Edge Function)                  |   |
 |  |                                                    |  |              |  |                                  |   |
 |  |  chrome.storage.local          chrome.storage.sync |  |              |  | - Ingest batched events          |   |
 |  |  +---------------------+  +--------------------+  |  |              |  | - Power dashboards + alerts      |   |
 |  |  | license_cache       |  | zovo_auth          |  |  |              |  +----------------------------------+   |
 |  |  | analytics_queue     |  | (JWT + tier)       |  |  |              |                                        |
 |  |  | paywall_cooldowns   |  | licenseKey         |  |  |              |  +----------------------------------+   |
 |  |  | onboarding state    |  | (ZOVO-XXXX-...)    |  |  |              |  | Supabase Postgres                |   |
 |  |  +---------------------+  | user email         |  |  |              |  |                                  |   |
 |  |                            +--------------------+  |  |              |  | - extensions table               |   |
 |  |  chrome.storage.session                            |  |              |  | - licenses table                 |   |
 |  |  +---------------------+                           |  |              |  | - paywall_events table           |   |
 |  |  | session_id          |                           |  |              |  | - analytics_events table         |   |
 |  |  | (analytics tracking)|                           |  |              |  | - drip_sequences table           |   |
 |  |  +---------------------+                           |  |              |  +----------------------------------+   |
 |  +---------------------------------------------------+  |              |                                        |
 +---------------------------------------------------------+              +----------------------------------------+
                     |                                                                     ^
                     |              External Services                                      |
                     |     +-------------------------------------------+                   |
                     |     |                                           |                   |
                     +---->| zovo.app/upgrade?ref=cookie-manager       |                   |
                           | (LemonSqueezy embedded checkout)          |                   |
                           |                                           |                   |
                           | subscription_created webhook  ---------->-+                   |
                           | chrome.runtime.sendMessage  ------------>-+                   |
                           +-------------------------------------------+

 Auth Flow:
 chrome.identity API --> Google OAuth --> POST /auth/google --> Zovo JWT --> chrome.storage.sync
```

### 1.2 Data Flow Diagrams

#### Flow 1: License Verification

This flow executes on every popup open and every 24 hours via the `license-check` alarm.

```
 Extension popup opens
       |
       v
 [1] Read zovo_auth from chrome.storage.sync
       |
       +---> tier === "free" AND no licenseKey?
       |         |
       |         +---> YES: Render free UI. No API call. DONE.
       |
       +---> licenseKey exists OR tier !== "free"?
                 |
                 v
 [2] Read license_cache from chrome.storage.local
       |
       +---> Is license_cache present AND not stale?
       |     (stale = validated_at older than 5 minutes for popup,
       |      or older than 24 hours for background alarm)
       |         |
       |         +---> YES: Verify HMAC signature
       |         |         |
       |         |         +---> HMAC VALID: Use cached tier. Render UI. DONE.
       |         |         +---> HMAC INVALID: Treat as tampered. Force re-verify.
       |         |                       |
       |         +---> NO (stale):       |
       |                   |             |
       |                   v             v
       |           [3] Call POST /verify-extension-license
       |                   |
       |                   +---> SUCCESS (200):
       |                   |         |
       |                   |         v
       |                   |   [4] Update license_cache in chrome.storage.local:
       |                   |       { tier, validated_at: now, expires_at: now+72h,
       |                   |         signature: HMAC(tier + validated_at + expires_at) }
       |                   |       Update zovo_auth.tier in chrome.storage.sync if changed.
       |                   |       Render paid UI. DONE.
       |                   |
       |                   +---> FAILURE (401/403):
       |                   |         |
       |                   |         v
       |                   |   [5] Attempt POST /auth/refresh with refresh_token
       |                   |         |
       |                   |         +---> REFRESH SUCCESS: Go to step [3] with new token.
       |                   |         +---> REFRESH FAILURE: Check license_cache grace period.
       |                   |                       |
       |                   +---> NETWORK ERROR:    |
       |                              |            |
       |                              v            v
       |                   [6] Check license_cache.expires_at (72-hour grace)
       |                              |
       |                              +---> WITHIN 72 HOURS:
       |                              |       Render paid UI.
       |                              |       Show subtle banner: "Offline -- features
       |                              |       available for [X] more hours."
       |                              |       DONE.
       |                              |
       |                              +---> EXPIRED (>72 HOURS):
       |                                      Downgrade to free tier.
       |                                      Update zovo_auth.tier = "free".
       |                                      Show banner: "Your subscription could not
       |                                      be verified. Please reconnect."
       |                                      DONE.
```

#### Flow 2: Paywall Trigger

This flow fires whenever a user attempts a gated action.

```
 User performs action (e.g., save 3rd profile)
       |
       v
 [1] Call canUse(feature, currentCount) from tier-guard.ts
       |
       +---> result.allowed === true?
       |         |
       |         +---> YES: Execute action normally. DONE.
       |
       +---> result.allowed === false
                 |
                 v
 [2] Check engagement prerequisites (per trigger)
     (e.g., T1 requires both profiles loaded at least once,
      T2 requires existing rule to have executed)
       |
       +---> Prerequisites NOT met?
       |         |
       |         +---> Show helpful toast instead. DONE.
       |               ("Your current rule hasn't fired yet.")
       |
       +---> Prerequisites MET
                 |
                 v
 [3] PaywallController.shouldShow(triggerId, paywallType)
       |
       +---> Check Rule 1: Is this the first session ever?
       |         +---> YES: Suppress. DONE.
       |
       +---> Check Rule 2: Is an operation in progress?
       |         +---> YES: Suppress. DONE.
       |
       +---> Check Rule 3: Session frequency cap met?
       |     (1 hard block/session, 3 soft banners/session)
       |         +---> CAP HIT: Suppress. DONE.
       |
       +---> Check Rule 4: Per-trigger cooldown
       |     (48h after dismissal, 7d after 3 dismissals,
       |      30d after permanent softening)
       |         +---> IN COOLDOWN: Suppress. DONE.
       |
       +---> ALL CHECKS PASS
                 |
                 v
 [4] Get next copy variation via getNextCopyVariation(triggerId)
     (cycles through 5 variations sequentially)
       |
       v
 [5] Render paywall UI (hard block / soft banner / feature discovery)
       |
       v
 [6] Log paywall_shown event to analytics_queue
       |
       v
 [7] If user email is available:
     Call POST /log-paywall-hit to trigger drip sequence
       |
       v
 [8] User interaction:
       |
       +---> DISMISSES: Record dismissal in zovo_paywall_dismissals.
       |                 Log paywall_dismissed event. DONE.
       |
       +---> CLICKS CTA: Log paywall_clicked event.
                          Open upgrade URL. Go to Upgrade Flow.
```

#### Flow 3: Upgrade

```
 [1] User clicks primary CTA in paywall modal
       |
       v
 [2] Extension opens new tab:
     https://zovo.app/upgrade?ref=cookie-manager&trigger=T1&plan=starter
       |
       v
 [3] User on zovo.app:
     - Selects plan (Starter $4/mo, Pro $7/mo, Team $14/mo)
     - Annual toggle pre-selected (default ON)
     - Clicks "Continue to Checkout"
       |
       v
 [4] LemonSqueezy embedded checkout processes payment
     - Credit/debit card, PayPal, regional methods
     - Tax/VAT handled by LemonSqueezy (Merchant of Record)
       |
       v
 [5] LemonSqueezy fires subscription_created webhook
     --> https://api.zovo.app/webhooks/lemonsqueezy
       |
       v
 [6] Zovo backend (Supabase Edge Function):
     - Validates webhook signature
     - Creates/updates user record in Postgres
     - Generates JWT with claims: { user_id, email, tier, exp }
     - Generates license key: ZOVO-XXXX-XXXX-XXXX-XXXX
       |
       v
 [7] zovo.app upgrade page polls GET /auth/verify every 2s (max 60s)
     On success, sends message to extension:
     chrome.runtime.sendMessage(COOKIE_MANAGER_EXT_ID, {
       type: "ZOVO_LICENSE_UPDATE",
       token: "<JWT>",
       tier: "starter",
       user_id: "<UUID>",
       email: "user@example.com"
     })
       |
       v
 [8] Background service worker receives message:
     - Validates sender origin (must be https://zovo.app)
     - Validates token server-side via POST /auth/verify
     - Writes to chrome.storage.sync:
       zovo_auth: { tier, token, refresh_token, expires, user_id, email }
     - Writes to chrome.storage.local:
       license_cache: { tier, validated_at, expires_at, signature: HMAC(...) }
       |
       v
 [9] chrome.storage.onChanged fires in popup (if open):
     - Detects tier change from "free" to new tier
     - Triggers unlock animation sequence (1.9 seconds):
       T+0ms:   Confetti burst (30 CSS particles, 1.5s fade)
       T+0ms:   Badge transition (FREE -> PRO/STARTER/TEAM, 300ms)
       T+300ms: Lock icon dissolve (opacity fade, 300ms)
       T+400ms: Blur removal (filter: blur(6px) -> blur(0), 400ms)
       T+400ms: Usage counter text update (fade crossover)
     - T+2000ms: Welcome toast appears
       |
       v
 [10] chrome.storage.sync propagates to all Chrome instances
      and all installed Zovo extensions within seconds.
      Every other Zovo extension detects the change and unlocks.
```

#### Flow 4: Offline / Error Handling

```
 API call fails (network error, timeout, 5xx)
       |
       v
 [1] Is this a license verification call?
       |
       +---> YES:
       |       |
       |       v
       |   [2] Read license_cache from chrome.storage.local
       |       |
       |       +---> license_cache EXISTS and HMAC valid?
       |       |         |
       |       |         v
       |       |   [3] Calculate remaining grace time:
       |       |       grace_remaining = license_cache.expires_at - Date.now()
       |       |       (expires_at = validated_at + 72 hours)
       |       |         |
       |       |         +---> grace_remaining > 0:
       |       |         |       Use cached tier. Show subtle banner:
       |       |         |       "Offline -- features available for
       |       |         |       [hours remaining] more hours."
       |       |         |       Schedule retry on navigator.onLine event.
       |       |         |       DONE.
       |       |         |
       |       |         +---> grace_remaining <= 0:
       |       |                 Grace period expired. Downgrade to free.
       |       |                 Clear license_cache.
       |       |                 Update zovo_auth.tier = "free".
       |       |                 Show banner: "Subscription could not be
       |       |                 verified. Please reconnect."
       |       |                 DONE.
       |       |
       |       +---> license_cache DOES NOT EXIST or HMAC invalid:
       |               No grace period available.
       |               Treat as free tier.
       |               DONE.
       |
       +---> NO (analytics, sync, paywall-hit):
               |
               v
         [4] Queue the operation in the appropriate buffer:
             - Analytics: append to analytics_queue in chrome.storage.local
             - Sync: append to sync_queue in chrome.storage.local
             - Paywall hit: append to local paywall_events queue
             |
             v
         [5] Register retry:
             - navigator.onLine event listener for immediate retry
             - Next alarm cycle (5min for analytics, 15min for sync)
             - Exponential backoff: 1s, 2s, 4s, 8s, max 60s
             - Max 3 retries per queued item; discard after 3 failures
             DONE.
```

### 1.3 Storage Schema

#### `chrome.storage.local` -- Device-Specific (10 MB limit)

| Key | Type | Description | Estimated Size |
|-----|------|-------------|----------------|
| `zovoLicense` | `object` | License verification result cache from API. Contains `{ valid, tier, email, features[], cachedAt }`. Written by `payments.ts` `verifyLicense()`. | 200-500 bytes |
| `license_cache` | `object` | HMAC-protected license cache for offline grace. Contains `{ tier, validated_at, expires_at, signature }`. The signature prevents DevTools tampering. 72-hour TTL from `validated_at`. | 200-300 bytes |
| `analytics_queue` | `AnalyticsEvent[]` | Buffered analytics events awaiting batch flush. Flushed every 5 minutes via `analytics-flush` alarm or when queue exceeds 50 events. | 5-10 KB (100-200 bytes/event) |
| `zovo_paywall_dismissals` | `object` | Per-trigger dismissal tracking: `{ "T1": { count, last_dismissed }, ... }`. Powers cooldown logic in PaywallController. | 500 bytes |
| `zovo_prompt_rotation` | `object` | Copy variation index per trigger: `{ "T1": 2, "T2": 0, ... }`. Sequential cycling through 5 variations. | 200 bytes |
| `zovo_paywall_events` | `array` | Local log of paywall interactions for analytics batching. | 1-5 KB |
| `onboarding` | `object` | First-run state: `{ completed, installed_at, first_profile_saved, first_rule_created, first_export, session_count, search_count, health_views, open_days[] }`. | 500 bytes |
| `zovo_auto_delete_stats` | `object` | Rule execution stats: `{ [ruleId]: { cookies_removed } }`. Used for T2 prerequisite checks. | 200 bytes |
| `zovo_first_compliance_scan` | `object` | Stored result of the user's free GDPR scan. Used for T6 prerequisite and modal preview. | 2-5 KB |
| `zovo_post_upgrade_tour_seen` | `boolean` | Whether the 3-slide post-upgrade feature discovery tour has been shown. | 10 bytes |
| `zovo_referral_prompt_shown` | `boolean` | Whether the 72-hour-post-upgrade referral prompt has been shown. | 10 bytes |
| `zovo_crosspromo_dismissed` | `object` | Per-extension cross-promo dismissal: `{ "json-formatter": true, ... }`. | 100 bytes |
| `operation_in_progress` | `boolean` | Flag set during import/export/bulk operations. Prevents paywall interruption. | 10 bytes |
| `device_encryption_key` | `string` | 32-byte random secret generated on first install. Used for HMAC computation and auth token encryption. Never synced. | 64 bytes (base64) |
| `profiles` | `CookieProfile[]` | Saved cookie profiles. Free: max 2. Starter: 10. Pro/Team: unlimited. | 1-5 KB per profile |
| `rules` | `AutoDeleteRule[]` | Auto-delete rules. Free: max 1. Starter: 5. Pro/Team: unlimited. | 200-500 bytes per rule |
| `snapshots` | `CookieSnapshot[]` | Point-in-time cookie snapshots (Pro only). Max 50 snapshots. | 2-10 KB per snapshot |
| `cookies_cache` | `object` | Cached cookie data per domain for performance. Invalidated on `chrome.cookies.onChanged`. | 50-500 KB |
| `health_cache` | `object` | Last health scan results per domain. | 5-20 KB |
| `usage` | `object` | Usage counters for free-tier enforcement: `{ profiles_count, rules_count, exports_this_month, gdpr_scans_used, ... }`. | 200 bytes |
| `sync_queue` | `SyncOperation[]` | Offline mutation queue for replay on reconnect. Max 3 retries per item. | 1-10 KB |

#### `chrome.storage.sync` -- Cross-Device (100 KB total, 8 KB per item)

| Key | Type | Description | Estimated Size |
|-----|------|-------------|----------------|
| `zovo_auth` | `object` | Shared across ALL Zovo extensions. Contains `{ tier, token, refresh_token, expires, user_id, email, display_name?, team_id?, authenticated_at }`. Written by whichever extension handles login. | 500-1000 bytes |
| `licenseKey` | `string` | License key in `ZOVO-XXXX-XXXX-XXXX-XXXX` format. Persists across devices. Written after license key entry. | 30 bytes |
| `settings` | `object` | User preferences: `{ theme, default_tab, popup_height, popup_width, default_export_format, show_cookie_count_badge, confirm_delete, auto_refresh_on_change, compact_mode }`. | 200-500 bytes |
| `domain_lists` | `object` | Whitelist/blacklist: `{ whitelist: string[], blacklist: string[] }`. Max 100 entries in sync; overflow to local. | 1-5 KB |

**Total sync usage estimate:** ~2-7 KB, well within the 100 KB ceiling.

#### `chrome.storage.session` -- Session-Only (cleared when browser closes)

| Key | Type | Description | Estimated Size |
|-----|------|-------------|----------------|
| `sessionId` | `string` | UUID v4 for analytics session tracking. Generated via `crypto.randomUUID()` on first access per session. | 36 bytes |
| `paywallSessionState` | `object` | Session-level paywall frequency tracking: `{ hardBlocksShown, softBannersShown, crossPromosShown, sessionStart, isFirstSessionEver }`. | 100 bytes |

---

## 2. Product Registration

### 2.1 Extension Registration Config

```typescript
// src/shared/extension-config.ts

export const EXTENSION_CONFIG = {
  extensionId: 'cookie_manager',          // snake_case ID used in PRODUCT_FEATURES, API calls, database
  extensionSlug: 'cookie-manager',        // kebab-case slug used in URLs, file paths, analytics
  extensionName: 'Zovo Cookie Manager',   // Display name for UI, Chrome Web Store
  storeId: '[chrome-web-store-id]',       // Filled after Chrome Web Store publish
  version: '1.0.0',                       // Semver, updated on each release
  apiBase: 'https://xggdjlurppfcytxqoozs.supabase.co/functions/v1',
  upgradeUrl: 'https://zovo.one/join?ref=cookie_manager',
  feedbackUrl: 'https://zovo.one/feedback/uninstall/cookie-manager',
  privacyUrl: 'https://zovo.app/privacy/cookie-manager',
  landingUrl: 'https://zovo.one/tools/cookie-manager',
} as const;
```

### 2.2 PRODUCT_FEATURES Definition

This is the complete Pro features array for Cookie Manager. Every feature flag maps to a gated capability in the extension. The backend uses this array to determine which features a license key unlocks.

```typescript
// Used in: stripe-webhook/index.ts, create-license/index.ts

const PRODUCT_FEATURES: Record<string, string[]> = {
  // ... existing extensions ...
  cookie_manager: [
    // --- Profile & Session Management ---
    'unlimited_profiles',          // >2 cookie profiles (Free: 2, Starter: 10, Pro/Team: unlimited)
    'encrypted_profiles',          // AES-256-GCM encrypted profile storage (Pro+)
    'profile_tagging',             // Organize profiles with tags and folders (Pro+)
    'auto_load_profiles',          // Auto-load profiles by URL pattern (Pro+)
    'cross_device_sync',           // Sync profiles, rules, settings across devices (Pro+)

    // --- Auto-Delete Rules ---
    'unlimited_rules',             // >1 auto-delete rule (Free: 1, Starter: 5, Pro/Team: unlimited)
    'scheduled_rules',             // Timer-based deletion (hourly/daily/weekly) via chrome.alarms (Pro+)
    'advanced_rule_patterns',      // Domain glob patterns and regex conditions (Starter+)

    // --- Export & Import ---
    'bulk_export',                 // >25 cookies per export (Free: 25, Starter: 200, Pro/Team: unlimited)
    'cross_domain_export',         // Export cookies across multiple domains (Pro+)
    'export_all_formats',          // Netscape HTTP, CSV, Header String formats (Starter+)
    'encrypted_export',            // AES-256-GCM encrypted export files (Pro+)
    'bulk_import',                 // Import >25 cookies with conflict resolution (Starter+)

    // --- Bulk Operations ---
    'bulk_operations',             // Select-all, multi-domain select, batch delete/export/move (Pro+)

    // --- Search & Filter ---
    'regex_search',                // Full JavaScript regex in search field (Starter+)
    'saved_filters',               // Save up to 20 named filter presets (Starter+)

    // --- Health & Compliance ---
    'health_dashboard',            // Full per-cookie health breakdown and remediation (Starter+)
    'gdpr_scanner',                // Unlimited GDPR compliance scans (Free: 1, Starter: 5, Pro/Team: unlimited)
    'gdpr_export_pdf',             // Export compliance report as PDF (Pro+)

    // --- Monitoring & Snapshots ---
    'realtime_monitoring',         // Live cookie change feed via chrome.cookies.onChanged (Pro+)
    'cookie_snapshots',            // Save point-in-time snapshots and compare diffs (Pro+)

    // --- Security ---
    'encrypted_vault',             // AES-256-GCM encrypted cookie vault with passphrase (Pro+)
    'unlimited_cookie_locks',      // >5 protected cookies (Free: 5, Starter: 25, Pro/Team: unlimited)

    // --- Domain Management ---
    'unlimited_whitelist',         // >5 whitelisted domains (Free: 5, Starter: 50, Pro/Team: unlimited)
    'unlimited_blacklist',         // >5 blacklisted domains (Free: 5, Starter: 50, Pro/Team: unlimited)
    'wildcard_domain_patterns',    // Wildcard patterns (*.google.com) in whitelist/blacklist (Pro+)

    // --- Developer Tools ---
    'curl_generation_advanced',    // cURL generation for any cookie set, batch cURL (Pro+)
    'devtools_panel',              // Chrome DevTools panel with inline editing (Pro+)
    'side_panel_mode',             // Open extension in Chrome side panel (Pro+)

    // --- Team ---
    'team_sharing',                // Share profiles and rules with team members (Team)
    'team_library',                // Shared cookie profile library (Team)
    'team_activity_log',           // Team activity audit log (Team)

    // --- Support ---
    'priority_support',            // <24hr support response time (Starter+)
  ],
};
```

**Feature flag to spec mapping (exhaustive cross-reference):**

| Feature Flag | Phase 02 Spec Reference | Phase 04 TIER_LIMITS Key | Paywall Trigger |
|---|---|---|---|
| `unlimited_profiles` | Cookie Profiles (2 free, unlimited Pro) | `profiles` | T1 |
| `encrypted_profiles` | Cookie Profiles + Encryption (Pro) | `vault` | T8 |
| `profile_tagging` | Profile tagging/organization (Pro) | -- | -- |
| `auto_load_profiles` | Auto-load profiles by URL pattern (Pro) | `autoLoadProfiles` | -- |
| `cross_device_sync` | Cross-Device Sync (Pro) | `sync` | T9 |
| `unlimited_rules` | Auto-Delete Rules (1 free, unlimited Pro) | `rules` | T2 |
| `scheduled_rules` | Schedule-based deletion (Pro) | -- (subset of rules) | -- |
| `advanced_rule_patterns` | Domain-glob patterns (Starter+) | -- | -- |
| `bulk_export` | Export >25 cookies (Free: 25 max) | `exportLimit` | T3 |
| `cross_domain_export` | Export all domains (Pro) | `crossDomainExport` | T3/T4 |
| `export_all_formats` | Netscape, CSV, Header String (Starter+) | `nonJsonExport` | T13 |
| `encrypted_export` | Encrypted export (Pro) | `vault` | T8 |
| `bulk_import` | Bulk import with conflict resolution (Starter+) | -- | T14 |
| `bulk_operations` | Bulk operations across domains (Pro) | `bulkOps` | T4 |
| `regex_search` | Regex search + saved filters (Starter+) | `regexSearch` | T7 |
| `saved_filters` | Saved filter presets (Starter+) | `regexSearch` | T7 |
| `health_dashboard` | Full Cookie Health Score report (Starter+) | -- | T5 |
| `gdpr_scanner` | GDPR compliance scan (1 free, unlimited Pro) | `gdprScans` | T6 |
| `gdpr_export_pdf` | Exportable compliance PDF (Pro) | -- | T6 |
| `realtime_monitoring` | Real-time cookie monitoring (Pro) | `monitoring` | T12 |
| `cookie_snapshots` | Cookie snapshots + diff (Pro) | `snapshots` | T11 |
| `encrypted_vault` | AES-256-GCM encrypted vault (Pro) | `vault` | T8 |
| `unlimited_cookie_locks` | Cookie protection (5 free, unlimited Pro) | `protectedCookies` | -- |
| `unlimited_whitelist` | Whitelist (5 free, unlimited Pro) | `whitelistDomains` | T15 |
| `unlimited_blacklist` | Blacklist (5 free, unlimited Pro) | `blacklistDomains` | T15 |
| `wildcard_domain_patterns` | Wildcard patterns (Pro) | -- | -- |
| `curl_generation_advanced` | cURL for any cookie set, batch (Pro) | -- | -- |
| `devtools_panel` | DevTools panel integration (Pro) | `devtoolsEditing` | -- |
| `side_panel_mode` | Side panel mode (Pro) | `sidePanel` | T16 |
| `team_sharing` | Team sharing (Team) | `teamSharing` | T10 |
| `team_library` | Shared cookie library (Team) | `teamSharing` | T10 |
| `team_activity_log` | Team activity log (Team) | `teamSharing` | T10 |
| `priority_support` | Priority support (Starter+) | -- | -- |

### 2.3 Database Registration

#### Insert into `extensions` table

```sql
-- Register Cookie Manager in the Zovo extensions registry
INSERT INTO extensions (
  extension_id,
  slug,
  name,
  description,
  category,
  icon_url,
  store_url,
  landing_url,
  privacy_url,
  version,
  status,
  created_at,
  updated_at
) VALUES (
  'cookie_manager',
  'cookie-manager',
  'Zovo Cookie Manager',
  'See, control, and own every cookie instantly. View, edit, create, delete cookies with profiles, auto-delete rules, health scoring, GDPR compliance scanning, and encrypted vault storage.',
  'developer_tools',
  'https://zovo.app/assets/extensions/cookie-manager/icon-128.png',
  NULL,  -- Filled after Chrome Web Store publish
  'https://zovo.one/tools/cookie-manager',
  'https://zovo.app/privacy/cookie-manager',
  '1.0.0',
  'active',
  NOW(),
  NOW()
);
```

#### Create drip email templates for cookie_manager

```sql
-- Drip sequence 1: Profile limit hit (T1)
INSERT INTO drip_sequences (
  extension_id,
  trigger_feature,
  sequence_name,
  emails
) VALUES (
  'cookie_manager',
  'unlimited_profiles',
  'cookie_manager_profile_limit',
  '[
    {
      "delay_hours": 1,
      "subject": "Your Cookie Manager profiles are waiting",
      "template": "drip_cookie_manager_profiles_1",
      "body_summary": "Remind user they hit the 2-profile limit. Highlight how unlimited profiles save time switching between environments."
    },
    {
      "delay_hours": 24,
      "subject": "Developers save 15 min/day with unlimited profiles",
      "template": "drip_cookie_manager_profiles_2",
      "body_summary": "Social proof angle. Describe the workflow of developers managing staging/prod/QA with one-click profile switching."
    },
    {
      "delay_hours": 72,
      "subject": "Cookie Manager Pro: profiles, monitoring, and 16 more tools",
      "template": "drip_cookie_manager_profiles_3",
      "body_summary": "Bundle value pitch. List top 5 Pro features. Mention Zovo membership includes 18+ extensions."
    }
  ]'::jsonb
);

-- Drip sequence 2: Auto-delete rule limit hit (T2)
INSERT INTO drip_sequences (
  extension_id,
  trigger_feature,
  sequence_name,
  emails
) VALUES (
  'cookie_manager',
  'unlimited_rules',
  'cookie_manager_rule_limit',
  '[
    {
      "delay_hours": 1,
      "subject": "Your auto-delete rule removed [X] cookies",
      "template": "drip_cookie_manager_rules_1",
      "body_summary": "Personalized with actual cookie count from the rule. Highlight that unlimited rules automate cleanup across all sites."
    },
    {
      "delay_hours": 48,
      "subject": "Automate cookie cleanup across every site",
      "template": "drip_cookie_manager_rules_2",
      "body_summary": "Feature focus on scheduled rules, glob patterns, and per-domain automation."
    },
    {
      "delay_hours": 120,
      "subject": "One membership. 18 tools. From $3/month.",
      "template": "drip_cookie_manager_rules_3",
      "body_summary": "Final pitch with annual pricing emphasis and full Zovo bundle value."
    }
  ]'::jsonb
);

-- Drip sequence 3: Export limit hit (T3)
INSERT INTO drip_sequences (
  extension_id,
  trigger_feature,
  sequence_name,
  emails
) VALUES (
  'cookie_manager',
  'bulk_export',
  'cookie_manager_export_limit',
  '[
    {
      "delay_hours": 2,
      "subject": "Export all your cookies in any format",
      "template": "drip_cookie_manager_export_1",
      "body_summary": "Highlight unlimited export across JSON, Netscape, CSV, and cURL batch formats."
    },
    {
      "delay_hours": 48,
      "subject": "QA engineers export 200+ cookies daily with Pro",
      "template": "drip_cookie_manager_export_2",
      "body_summary": "Use case focus on multi-domain export for testing and debugging workflows."
    }
  ]'::jsonb
);

-- Drip sequence 4: Health score details (T5)
INSERT INTO drip_sequences (
  extension_id,
  trigger_feature,
  sequence_name,
  emails
) VALUES (
  'cookie_manager',
  'health_dashboard',
  'cookie_manager_health',
  '[
    {
      "delay_hours": 4,
      "subject": "Your site scored [X] on cookie health",
      "template": "drip_cookie_manager_health_1",
      "body_summary": "Include the score they saw. Tease the per-cookie breakdown and remediation suggestions."
    },
    {
      "delay_hours": 72,
      "subject": "Fix cookie security issues before they become problems",
      "template": "drip_cookie_manager_health_2",
      "body_summary": "Security angle. Describe httpOnly, SameSite, and expiry risks that Pro identifies."
    }
  ]'::jsonb
);

-- Drip sequence 5: GDPR scan (T6)
INSERT INTO drip_sequences (
  extension_id,
  trigger_feature,
  sequence_name,
  emails
) VALUES (
  'cookie_manager',
  'gdpr_scanner',
  'cookie_manager_gdpr',
  '[
    {
      "delay_hours": 2,
      "subject": "Your GDPR scan found [X] tracking cookies",
      "template": "drip_cookie_manager_gdpr_1",
      "body_summary": "Personalized with scan result count. Highlight compliance risk and exportable PDF reports."
    },
    {
      "delay_hours": 48,
      "subject": "Unlimited compliance scans for every site you manage",
      "template": "drip_cookie_manager_gdpr_2",
      "body_summary": "Compliance team angle. Mention exportable PDF and multi-site auditing."
    }
  ]'::jsonb
);

-- Drip sequence 6: Bulk operations (T4)
INSERT INTO drip_sequences (
  extension_id,
  trigger_feature,
  sequence_name,
  emails
) VALUES (
  'cookie_manager',
  'bulk_operations',
  'cookie_manager_bulk',
  '[
    {
      "delay_hours": 2,
      "subject": "Manage cookies across all your domains at once",
      "template": "drip_cookie_manager_bulk_1",
      "body_summary": "Highlight cross-domain select-all, batch delete, and batch export capabilities."
    },
    {
      "delay_hours": 72,
      "subject": "Bulk operations + 17 more Zovo tools",
      "template": "drip_cookie_manager_bulk_2",
      "body_summary": "Bundle value. Mention how bulk ops work alongside Form Filler and Tab Manager."
    }
  ]'::jsonb
);
```

#### Set up analytics dashboard views for cookie_manager

```sql
-- Create materialized view for Cookie Manager conversion funnel
CREATE MATERIALIZED VIEW IF NOT EXISTS cookie_manager_conversion_funnel AS
SELECT
  DATE_TRUNC('day', created_at) AS day,
  COUNT(*) FILTER (WHERE event_name = 'extension_opened') AS opens,
  COUNT(*) FILTER (WHERE event_name = 'paywall_shown') AS paywalls_shown,
  COUNT(*) FILTER (WHERE event_name = 'paywall_clicked') AS paywall_clicks,
  COUNT(*) FILTER (WHERE event_name = 'upgrade_started') AS upgrade_starts,
  COUNT(*) FILTER (WHERE event_name = 'upgrade_completed') AS upgrades,
  COUNT(*) FILTER (WHERE event_name = 'paywall_dismissed') AS dismissals
FROM analytics_events
WHERE extension_slug = 'cookie_manager'
  AND event_name IN ('extension_opened', 'paywall_shown', 'paywall_clicked',
                      'upgrade_started', 'upgrade_completed', 'paywall_dismissed')
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY day DESC;

-- Create materialized view for per-trigger conversion analysis
CREATE MATERIALIZED VIEW IF NOT EXISTS cookie_manager_trigger_performance AS
SELECT
  event_data->>'trigger_id' AS trigger_id,
  COUNT(*) FILTER (WHERE event_name = 'paywall_shown') AS impressions,
  COUNT(*) FILTER (WHERE event_name = 'paywall_clicked') AS clicks,
  COUNT(*) FILTER (WHERE event_name = 'paywall_dismissed') AS dismissals,
  COUNT(*) FILTER (WHERE event_name = 'upgrade_completed') AS conversions,
  ROUND(
    COUNT(*) FILTER (WHERE event_name = 'paywall_clicked')::numeric /
    NULLIF(COUNT(*) FILTER (WHERE event_name = 'paywall_shown'), 0),
    4
  ) AS click_rate,
  ROUND(
    COUNT(*) FILTER (WHERE event_name = 'upgrade_completed')::numeric /
    NULLIF(COUNT(*) FILTER (WHERE event_name = 'paywall_clicked'), 0),
    4
  ) AS conversion_rate
FROM analytics_events
WHERE extension_slug = 'cookie_manager'
  AND event_data->>'trigger_id' IS NOT NULL
GROUP BY event_data->>'trigger_id'
ORDER BY conversions DESC;

-- Refresh schedule (run daily via Supabase cron)
-- SELECT cron.schedule('refresh-cm-funnel', '0 3 * * *', 'REFRESH MATERIALIZED VIEW cookie_manager_conversion_funnel');
-- SELECT cron.schedule('refresh-cm-triggers', '0 3 * * *', 'REFRESH MATERIALIZED VIEW cookie_manager_trigger_performance');
```

### 2.4 Backend Updates Required

#### A. `stripe-webhook/index.ts` -- Add cookie_manager to PRODUCT_FEATURES

```typescript
// File: supabase/functions/stripe-webhook/index.ts
// Location: PRODUCT_FEATURES constant (top of file)
// Action: Add the cookie_manager key to the existing PRODUCT_FEATURES object

const PRODUCT_FEATURES: Record<string, string[]> = {
  // ... existing extensions (web_scraper_lite, etc.) ...

  cookie_manager: [
    'unlimited_profiles',
    'encrypted_profiles',
    'profile_tagging',
    'auto_load_profiles',
    'cross_device_sync',
    'unlimited_rules',
    'scheduled_rules',
    'advanced_rule_patterns',
    'bulk_export',
    'cross_domain_export',
    'export_all_formats',
    'encrypted_export',
    'bulk_import',
    'bulk_operations',
    'regex_search',
    'saved_filters',
    'health_dashboard',
    'gdpr_scanner',
    'gdpr_export_pdf',
    'realtime_monitoring',
    'cookie_snapshots',
    'encrypted_vault',
    'unlimited_cookie_locks',
    'unlimited_whitelist',
    'unlimited_blacklist',
    'wildcard_domain_patterns',
    'curl_generation_advanced',
    'devtools_panel',
    'side_panel_mode',
    'team_sharing',
    'team_library',
    'team_activity_log',
    'priority_support',
  ],
};
```

#### B. `create-license/index.ts` -- Add cookie_manager to PRODUCT_FEATURES (same mapping)

```typescript
// File: supabase/functions/create-license/index.ts
// Location: PRODUCT_FEATURES constant
// Action: Add the identical cookie_manager features array

// Same array as stripe-webhook/index.ts -- keep these in sync.
// Consider extracting to a shared constants file to avoid duplication:
// import { PRODUCT_FEATURES } from '../shared/product-features.ts';
```

#### C. `extensions` table in Supabase -- Add row for cookie_manager

Execute the SQL INSERT from Section 2.3 above. Verify the row exists:

```sql
SELECT * FROM extensions WHERE extension_id = 'cookie_manager';
```

Expected result: one row with `status = 'active'`.

#### D. `verify-extension-license/index.ts` -- Verify cookie_manager is handled

The existing `verify-extension-license` Edge Function should already work generically by looking up the `extension` parameter in PRODUCT_FEATURES. Verify that:

1. It accepts `{ license_key, extension: "cookie_manager" }` in the request body.
2. It queries the `licenses` table where `product = 'cookie_manager'`.
3. It returns the features array from PRODUCT_FEATURES for cookie_manager.
4. Rate limits are applied per the existing policy (10 req/60s per license key, 50 req/60s per IP).

#### E. `log-paywall-hit/index.ts` -- Verify cookie_manager drip sequences are triggered

The existing `log-paywall-hit` Edge Function should:

1. Accept `{ email, extension_id: "cookie_manager", feature_attempted: "unlimited_profiles" }`.
2. Insert into `paywall_events` table.
3. Look up matching `drip_sequences` where `extension_id = 'cookie_manager'` and `trigger_feature` matches.
4. Enqueue the first drip email if no existing sequence is active for this email + extension + feature.

---

## 3. Tier System Mapping

### 3.1 Free Tier Limits

| Feature | Free Limit | Feature Flag | TIER_LIMITS Key | Enforcement Mechanism | Paywall Trigger |
|---------|-----------|-------------|-----------------|----------------------|-----------------|
| Cookie profiles | 2 | `unlimited_profiles` | `profiles: 2` | Count check: `canUse("profiles", currentProfileCount)`. Read `profiles` array length from `chrome.storage.local`. | T1 (hard block) |
| Auto-delete rules | 1 | `unlimited_rules` | `rules: 1` | Count check: `canUse("rules", currentRuleCount)`. Read `rules` array length from `chrome.storage.local`. | T2 (hard block) |
| Export cookies | 25 max | `bulk_export` | `exportLimit: 25` | Count check before export: `canUse("exportLimit", cookiesToExport.length)`. Count obtained from `chrome.cookies.getAll()`. | T3 (soft banner) |
| Export format | JSON only | `export_all_formats` | `nonJsonExport: false` | Boolean check: `canUse("nonJsonExport")`. If false, show lock icons on Netscape/CSV/Header String format options. | T13 (soft banner) |
| Cross-domain export | No | `cross_domain_export` | `crossDomainExport: false` | Boolean check: `canUse("crossDomainExport")`. Block "Export All Cookies" across domains. | T3/T4 |
| Import cookies | 25 max, JSON only | `bulk_import` | -- | Count check on parsed file: reject files with >25 cookies. Format check: reject non-JSON files. | T14 (soft banner) |
| Whitelist domains | 5 | `unlimited_whitelist` | `whitelistDomains: 5` | Count check: `canUse("whitelistDomains", currentWhitelistCount)`. Read `domain_lists.whitelist.length` from sync storage. | T15 (soft banner) |
| Blacklist domains | 5 | `unlimited_blacklist` | `blacklistDomains: 5` | Count check: `canUse("blacklistDomains", currentBlacklistCount)`. Read `domain_lists.blacklist.length` from sync storage. | T15 (soft banner) |
| Protected cookies | 5 | `unlimited_cookie_locks` | `protectedCookies: 5` | Count check: `canUse("protectedCookies", currentLockedCount)`. | -- |
| GDPR scans | 1 per domain | `gdpr_scanner` | `gdprScans: 1` | Count check: `canUse("gdprScans", gdprScansUsed)`. Read `usage.gdpr_scans_used` from local storage. Resets monthly. | T6 (hard block) |
| Snapshots | 0 (blocked) | `cookie_snapshots` | `snapshots: 0` | Boolean check: `canUse("snapshots")`. Feature discovery page shown instead. | T11 (feature discovery) |
| Bulk operations | No | `bulk_operations` | `bulkOps: false` | Boolean check: `canUse("bulkOps")`. Block multi-domain select/batch actions. | T4 (hard block) |
| Regex search | No | `regex_search` | `regexSearch: false` | Boolean check: `canUse("regexSearch")`. Disable regex toggle in search bar. | T7 (soft banner) |
| Real-time monitoring | No | `realtime_monitoring` | `monitoring: false` | Boolean check: `canUse("monitoring")`. Feature discovery page shown. | T12 (feature discovery) |
| Encrypted vault | No | `encrypted_vault` | `vault: false` | Boolean check: `canUse("vault")`. Block vault and encrypted export options. | T8 (soft banner) |
| Cross-device sync | No | `cross_device_sync` | `sync: false` | Boolean check: `canUse("sync")`. Disable sync toggle in settings. | T9 (hard block) |
| Team sharing | No | `team_sharing` | `teamSharing: false` | Boolean check: `canUse("teamSharing")`. Block all team features. | T10 (hard block) |
| Side panel mode | No | `side_panel_mode` | `sidePanel: false` | Boolean check: `canUse("sidePanel")`. Disable side panel button. | T16 (soft banner) |
| DevTools panel | No | `devtools_panel` | `devtoolsEditing: false` | Boolean check: `canUse("devtoolsEditing")`. Read-only DevTools view for free. | -- |
| Cookie Health Score | Badge only | `health_dashboard` | -- | Special handling: badge score (0-100) always visible. Detail panel rendered with `filter: blur(6px)` for free users. | T5 (soft banner) |
| cURL generation | Current site only | `curl_generation_advanced` | -- | Scope check: only allow cURL from active tab domain. Cross-domain/batch cURL gated. | -- |
| Block rules | 3 | -- | `blockRules: 3` | Count check in rule creation. | -- |

### 3.2 Starter Tier ($4/mo or $36/year -- $3/mo effective)

Starter unlocks the most commonly needed power-user features at an accessible price point. It is the recommended entry tier for most paywall triggers.

| Feature | Starter Limit | Upgrade from Free |
|---------|--------------|-------------------|
| Cookie profiles | 10 | 2 -> 10 |
| Auto-delete rules | 5 | 1 -> 5 |
| Export cookies | 200 max | 25 -> 200 |
| Export formats | JSON + Netscape + CSV | JSON only -> all text formats |
| Import cookies | 200 max, all formats | 25 JSON -> 200 all formats |
| Whitelist domains | 50 | 5 -> 50 |
| Blacklist domains | 50 | 5 -> 50 |
| Protected cookies | 25 | 5 -> 25 |
| GDPR scans | 5 per month | 1 -> 5 |
| Snapshots | 5 | 0 -> 5 |
| Block rules | 10 | 3 -> 10 |
| Regex search | Yes | No -> Yes |
| Saved filters | Yes (up to 20) | No -> Yes |
| Cookie Health Score | Full report | Badge only -> full |
| Priority support | Yes | No -> Yes |
| Bulk operations | No | No |
| Real-time monitoring | No | No |
| Encrypted vault | No | No |
| Cross-device sync | No | No |
| Cross-domain export | No | No |
| Side panel | No | No |
| DevTools editing | No | No |
| Team features | No | No |

### 3.3 Pro Tier ($7/mo or $60/year -- $5/mo effective)

Pro unlocks everything for individual power users. This is the recommended tier for developers, QA engineers, and VAs with complex workflows.

| Feature | Pro Limit | Upgrade from Starter |
|---------|----------|---------------------|
| Cookie profiles | Unlimited | 10 -> unlimited |
| Encrypted profiles | Yes | No -> Yes |
| Profile tagging | Yes | No -> Yes |
| Auto-load profiles | Yes | No -> Yes |
| Auto-delete rules | Unlimited | 5 -> unlimited |
| Scheduled rules | Yes (hourly/daily/weekly) | No -> Yes |
| Export cookies | Unlimited | 200 -> unlimited |
| Cross-domain export | Yes | No -> Yes |
| Export all formats | Yes (+ Header String) | Yes |
| Encrypted export | Yes | No -> Yes |
| Import cookies | Unlimited, conflict resolution | 200 -> unlimited |
| Bulk operations | Yes | No -> Yes |
| Whitelist/blacklist | Unlimited + wildcards | 50 -> unlimited |
| Protected cookies | Unlimited | 25 -> unlimited |
| GDPR scans | Unlimited + PDF export | 5 -> unlimited |
| Snapshots | Unlimited (max 50 stored) | 5 -> unlimited |
| Block rules | Unlimited | 10 -> unlimited |
| Real-time monitoring | Yes | No -> Yes |
| Encrypted vault | Yes (AES-256-GCM) | No -> Yes |
| Cross-device sync | Yes | No -> Yes |
| cURL generation | Any cookie set, batch | Current site -> any |
| Side panel mode | Yes | No -> Yes |
| DevTools panel editing | Yes | No -> Yes |
| Team features | No | No |

### 3.4 Team Tier ($14/mo or $120/year -- $10/mo effective, 5 seats)

Team adds collaboration on top of everything in Pro. Designed for development teams, QA teams, and VA agencies.

| Feature | Team Limit | Upgrade from Pro |
|---------|-----------|-----------------|
| Everything in Pro | Yes | Yes |
| Team sharing | Yes (5 seats) | No -> Yes |
| Shared cookie library | Yes | No -> Yes |
| Environment presets | Yes | No -> Yes |
| Team activity log | Yes (audit trail) | No -> Yes |
| Admin dashboard | Yes | No -> Yes |
| Onboarding templates | Yes | No -> Yes |
| Role-based access | Admin / Member | No -> Yes |

### 3.5 Annual Pricing Summary

| Tier | Monthly | Annual | Annual per Month | Annual Savings |
|------|---------|--------|-----------------|----------------|
| Free | $0 | $0 | $0 | -- |
| Starter | $4 | $36 | $3 | $12 (25%) |
| Pro | $7 | $60 | $5 | $24 (29%) |
| Team (5 seats) | $14 | $120 | $10 | $48 (29%) |

Annual billing is pre-selected by default on the checkout page. The upgrade URL includes `&billing=annual` to pre-toggle the annual switch.

---

## 4. Registration Checklist

Every item below must be completed before Cookie Manager ships with payment integration. Items are ordered by dependency.

### Phase A: Backend Registration

- [ ] **Choose extension_id:** `cookie_manager` (snake_case). Confirmed unique in the Zovo system.
- [ ] **Define Pro features array:** 33 feature flags defined in Section 2.2. Reviewed against Phase 02 spec and Phase 04 monetization spec. Every gated feature has a corresponding flag.
- [ ] **Add features to `stripe-webhook/index.ts` PRODUCT_FEATURES:** Insert the `cookie_manager` key with the full 33-feature array. File location: `supabase/functions/stripe-webhook/index.ts`.
- [ ] **Add features to `create-license/index.ts` PRODUCT_FEATURES:** Insert the identical array. File location: `supabase/functions/create-license/index.ts`. Consider extracting to shared constants to prevent drift.
- [ ] **Add extension to `extensions` table in Supabase:** Execute the INSERT statement from Section 2.3. Verify with `SELECT * FROM extensions WHERE extension_id = 'cookie_manager'`.
- [ ] **Create drip email templates for cookie_manager:** Execute all 6 drip sequence INSERTs from Section 2.3. Create the corresponding email HTML templates in the email service (Resend/SendGrid/Postmark).
- [ ] **Verify `verify-extension-license` handles cookie_manager:** Test with `curl -X POST .../verify-extension-license -d '{"license_key":"ZOVO-TEST-TEST-TEST-TEST","extension":"cookie_manager"}'`. Expect `{ valid: false, error: "License key not found" }` (not a 500 or unrecognized extension error).
- [ ] **Verify `log-paywall-hit` triggers cookie_manager drip sequences:** Test with a valid email. Verify the first drip email is enqueued within 1 hour.
- [ ] **Create analytics materialized views:** Execute the SQL from Section 2.3 to create `cookie_manager_conversion_funnel` and `cookie_manager_trigger_performance` views. Schedule daily refresh via Supabase cron.

### Phase B: Extension Integration

- [ ] **Copy shared payments module to extension:** Place at `src/shared/payments.ts`. Update `EXTENSION_ID` to `cookie_manager`. Update `ZOVO_API_BASE` to match the Supabase Functions URL.
- [ ] **Implement PaywallController class:** Port from Phase 04 spec to `src/shared/paywall-controller.ts`. Enforce all frequency rules (1 hard/session, 3 soft/session, 48h cooldown, 7-day/30-day escalation).
- [ ] **Implement `canUse()` function:** Port from Phase 04 spec to `src/shared/tier-guard.ts`. Ensure it reads `zovo_auth.tier` from `chrome.storage.sync` and applies TIER_LIMITS.
- [ ] **Implement paywall UI components:** Build `PaywallPrompt.tsx` for hard block modals, soft banners, and feature discovery pages per Phase 02 Section 3 specs.
- [ ] **Add license key input flow:** Build UI for entering `ZOVO-XXXX-XXXX-XXXX-XXXX` format keys. Validate format client-side, verify server-side via `verifyLicense()`.
- [ ] **Gate all premium features with `hasFeature()` / `canUse()` checks:** Audit every component that touches a gated feature. Add checks to: ProfileManager, RuleEditor, ExportPanel, ImportPanel, SearchBar, HealthScore, ComplianceScan, BulkOps, SnapshotManager, MonitorPanel, VaultManager, SidePanelToggle, DevToolsPanel.
- [ ] **Implement upgrade flow:** CTA buttons open `https://zovo.one/join?ref=cookie_manager&trigger=TX&plan=starter`. Background service worker handles `ZOVO_LICENSE_UPDATE` messages from zovo.app.
- [ ] **Implement unlock animation:** Confetti burst + badge transition + lock dissolve + blur removal + usage counter update. Total duration: 1.9 seconds.
- [ ] **Track analytics events for feature usage:** Instrument all 14 monetization events from Phase 04 Agent 5 spec. Queue in `analytics_queue`, flush every 5 minutes.
- [ ] **Set uninstall URL:** `chrome.runtime.setUninstallURL('https://zovo.one/feedback/uninstall/cookie-manager')` in `chrome.runtime.onInstalled` handler.
- [ ] **Create privacy policy at `/privacy/cookie-manager`:** Host at `https://zovo.app/privacy/cookie-manager` per Phase 04 Agent 4 compliance spec.

### Phase C: Testing & Verification

- [ ] **Test license verification flow end-to-end:** Fresh install -> enter license key -> verify -> unlock features -> close popup -> reopen -> verify cached tier.
- [ ] **Test offline grace period:** Disconnect network -> verify Pro features remain for 72 hours -> reconnect -> verify re-validation.
- [ ] **Test paywall trigger flow for all 17 triggers:** Walk through T1-T17 on a free account. Verify correct paywall type, copy, and behavior for each.
- [ ] **Test upgrade flow end-to-end:** Hit paywall -> click CTA -> complete checkout (test mode) -> verify license delivery -> verify unlock animation -> verify all features unlocked.
- [ ] **Test downgrade flow:** Cancel subscription -> wait for webhook -> verify 72-hour grace -> verify graceful revert to free tier -> verify no data deleted.
- [ ] **Test cross-extension auth propagation:** Upgrade via another Zovo extension -> verify Cookie Manager detects the tier change via `chrome.storage.onChanged` -> verify features unlock.
- [ ] **Test storage tampering detection:** Modify `license_cache.tier` in DevTools -> reopen popup -> verify HMAC mismatch detected -> verify forced re-validation.
- [ ] **Test paywall frequency limits:** Dismiss T1 -> verify 48-hour cooldown -> dismiss 3 times -> verify 7-day cooldown -> dismiss again -> verify 30-day cooldown.
- [ ] **Test analytics event delivery:** Trigger paywall_shown, paywall_clicked, upgrade_completed events -> verify they appear in `analytics_queue` -> verify flush to backend.
- [ ] **Test drip email sequences:** Log a paywall hit with a test email -> verify drip email 1 arrives within 1-2 hours -> verify subsequent emails at scheduled intervals.

### Phase D: Launch

- [ ] **Update `storeId` in EXTENSION_CONFIG** after Chrome Web Store publish.
- [ ] **Update `store_url` in extensions table** with the Chrome Web Store listing URL.
- [ ] **Verify production API endpoints** are responding correctly for cookie_manager.
- [ ] **Monitor conversion funnel dashboard** for the first 48 hours after launch.
- [ ] **Monitor error rates** on verify-extension-license and log-paywall-hit endpoints.

---

## 5. Security Considerations

### 5.1 License Key Storage Security

**HMAC anti-tampering for license_cache:**

The `license_cache` object in `chrome.storage.local` stores the cached tier for offline grace period enforcement. Without protection, a user can open Chrome DevTools, navigate to the extension's storage, and change `license_cache.tier` from `"free"` to `"pro"`.

**Implementation:**

```typescript
// src/shared/license-security.ts

const HMAC_ALGORITHM = 'HMAC';
const HMAC_HASH = 'SHA-256';

async function getDeviceKey(): Promise<CryptoKey> {
  const stored = await chrome.storage.local.get('device_encryption_key');
  let keyData: ArrayBuffer;

  if (stored.device_encryption_key) {
    keyData = base64ToArrayBuffer(stored.device_encryption_key);
  } else {
    // Generate on first install, never synced
    keyData = crypto.getRandomValues(new Uint8Array(32)).buffer;
    await chrome.storage.local.set({
      device_encryption_key: arrayBufferToBase64(keyData),
    });
  }

  return crypto.subtle.importKey(
    'raw',
    keyData,
    { name: HMAC_ALGORITHM, hash: HMAC_HASH },
    false,
    ['sign', 'verify']
  );
}

export async function signLicenseCache(
  cache: { tier: string; validated_at: string; expires_at: string }
): Promise<string> {
  const key = await getDeviceKey();
  const message = JSON.stringify({
    tier: cache.tier,
    validated_at: cache.validated_at,
    expires_at: cache.expires_at,
  });
  const signature = await crypto.subtle.sign(
    HMAC_ALGORITHM,
    key,
    new TextEncoder().encode(message)
  );
  return arrayBufferToBase64(signature);
}

export async function verifyLicenseCacheSignature(
  cache: { tier: string; validated_at: string; expires_at: string; signature: string }
): Promise<boolean> {
  const key = await getDeviceKey();
  const message = JSON.stringify({
    tier: cache.tier,
    validated_at: cache.validated_at,
    expires_at: cache.expires_at,
  });
  const signatureBuffer = base64ToArrayBuffer(cache.signature);
  return crypto.subtle.verify(
    HMAC_ALGORITHM,
    key,
    signatureBuffer,
    new TextEncoder().encode(message)
  );
}
```

**On every license_cache read:**

1. Recompute HMAC over `{ tier, validated_at, expires_at }`.
2. Compare against stored `signature` using `crypto.subtle.verify` (timing-safe by default in Web Crypto API).
3. If mismatch: treat as tampered, force re-validation from server.
4. If server unreachable and HMAC invalid: downgrade to free tier immediately (no grace period for tampered caches).

**Limitation acknowledged:** A sophisticated attacker with DevTools access can also read the `device_encryption_key` from local storage. This protection prevents casual tampering and automated scripts, not a determined attacker. Server-side enforcement (re-validation on every API call) is the primary defense.

### 5.2 API Key Exposure Prevention

**No API keys are stored in the extension code.** The Supabase Edge Functions are public endpoints that use license key validation and JWT Bearer tokens for authentication. The extension never contains:

- Supabase service role key
- LemonSqueezy API key
- Google OAuth client secret (the OAuth flow uses PKCE; the secret remains server-side)
- Any database connection strings

**What the extension DOES contain:**

- The Supabase Functions base URL (public, by design)
- The Google OAuth client ID (public, by design)
- The extension's own product ID (`cookie_manager`)

**Build-time safety:**

- Add `.env` to `.gitignore` from day one.
- No environment variables are embedded in the production build. All configuration is in `src/shared/extension-config.ts` as constants (all values are public-safe).
- The Content Security Policy (`script-src 'self'`) prevents any injected script from reading these constants.

### 5.3 Rate Limit Handling

**API rate limits and extension response:**

| Endpoint | Rate Limit | Extension Behavior on 429 |
|----------|-----------|---------------------------|
| `verify-extension-license` | 10 req/60s per license key, 50 req/60s per IP | Exponential backoff: 1s, 2s, 4s, 8s, max 60s. Respect `Retry-After` header. Fall back to cached license during backoff. Never show error to user unless cache is also expired. |
| `log-paywall-hit` | 5 req/60s per IP | Queue locally in `zovo_paywall_events`. Retry on next analytics flush cycle (5 min). Silent fail -- user never sees an error for analytics. |
| `collect-analytics` | 12 req/hour (implicitly from batch flushing) | Increase batch interval from 5 to 15 minutes. Queue continues to grow locally. Flush when rate limit window resets. |
| `/auth/google` | 10 req/min per IP | Show "Please wait a moment and try again" message. Disable the sign-in button for 60 seconds. |
| `/auth/refresh` | 5 req/min per user | On failure, do not retry for 60 seconds. Use cached tier during wait. Show "Reconnecting..." in header badge. |
| `/auth/verify` | 60 req/hour per user | Schedule next verification via alarm, not immediate retry. The 24-hour alarm cycle naturally respects this limit. |

**Client-side rate limiting (proactive):**

The extension implements its own rate limiter to avoid hitting server limits:

```typescript
// src/shared/rate-limiter.ts

const RATE_LIMITS: Record<string, { max: number; windowMs: number }> = {
  'verify-license': { max: 5, windowMs: 60_000 },
  'log-paywall': { max: 3, windowMs: 60_000 },
  'analytics': { max: 10, windowMs: 3_600_000 },
  'auth-refresh': { max: 3, windowMs: 60_000 },
};
```

### 5.4 Man-in-the-Middle Protection for License Verification

**Threat:** An attacker on the same network intercepts the HTTPS request to `verify-extension-license` and returns a forged `{ valid: true, tier: "pro" }` response.

**Mitigations (layered):**

1. **HTTPS enforcement in code:** All fetch calls reject URLs not starting with `https://`. The API base URL is a hardcoded constant, not user-configurable.

2. **Chrome's built-in TLS validation:** Chrome verifies the server certificate chain, hostname match, and certificate revocation status. MITM requires a compromised CA or a trusted corporate proxy certificate.

3. **HSTS on api.zovo.app:** The server sends `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`. Once the browser has seen HSTS, it refuses HTTP connections even if the user or network tries to downgrade.

4. **Server-signed license response:** The `verify-extension-license` response includes a signed `token` field (JWT). The extension validates the JWT signature against a pinned Zovo public key before trusting the tier claim:

```typescript
// src/shared/jwt-verify.ts

const ZOVO_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...
-----END PUBLIC KEY-----`;

export async function verifyJwtSignature(token: string): Promise<boolean> {
  const [headerB64, payloadB64, signatureB64] = token.split('.');
  const key = await crypto.subtle.importKey(
    'spki',
    pemToArrayBuffer(ZOVO_PUBLIC_KEY),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify']
  );
  const data = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
  const signature = base64UrlToArrayBuffer(signatureB64);
  return crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, signature, data);
}
```

5. **Reject `alg: none` tokens:** The JWT verification explicitly rejects tokens where the header `alg` field is `"none"` or an HMAC algorithm (only RSA/ECDSA accepted).

6. **Cache integrity via HMAC:** Even if a forged response is briefly cached, the HMAC on `license_cache` uses the device key. A subsequent legitimate verification (when the attacker is no longer on the network) will overwrite the cache with valid data.

### 5.5 Token Refresh Strategy

**JWT lifecycle:**

| Token Type | Lifetime | Storage | Refresh Mechanism |
|-----------|----------|---------|-------------------|
| Access token (JWT) | 15 minutes | `chrome.storage.sync` (`zovo_auth.token`) | Refresh via `/auth/refresh` when expired or within 1 hour of expiry |
| Refresh token | 30 days | `chrome.storage.sync` (`zovo_auth.refresh_token`) | Single-use; rotated on each refresh call. New refresh token returned with new access token. |
| License cache | 72 hours | `chrome.storage.local` (`license_cache`) | Updated on every successful `/auth/verify` or `/verify-extension-license` call |

**Refresh timing:**

```
Popup opens
  |
  v
Read zovo_auth from sync storage
  |
  v
Check token expiry:
  |
  +---> Expires in > 1 hour: Use token. Schedule background verify.
  +---> Expires in < 1 hour (or already expired):
           |
           v
        Call POST /auth/refresh with refresh_token
           |
           +---> 200 OK:
           |       New access token + new refresh token returned.
           |       Update zovo_auth in sync storage.
           |       Old refresh token is now invalid (single-use).
           |       Continue with new token.
           |
           +---> 401 (refresh token expired or revoked):
           |       Clear zovo_auth from sync storage.
           |       Show "Please sign in again" prompt.
           |       Fall back to license_cache grace period if within 72h.
           |
           +---> Network error:
                   Fall back to license_cache grace period.
                   Retry refresh on next popup open or next alarm cycle.
```

**Refresh token rotation:** Each refresh token is single-use. When a refresh succeeds, the server issues a new refresh token and invalidates the old one. This limits the window for stolen refresh token abuse. If the same refresh token is used twice (indicating theft), the server revokes all tokens for that user and forces re-authentication.

**Background refresh via alarms:** The `license-check` alarm (24-hour cycle) also performs a token refresh if the access token will expire before the next alarm fire. This prevents the token from expiring during a period when the user is not actively opening the popup.

**Token encryption at rest:** Both the access token and refresh token are encrypted in `chrome.storage.sync` using a device-derived key (see Section 5.1). While not a perfect defense against DevTools inspection (the key is also in local storage), it prevents casual reading and raises the bar for automated credential harvesting tools.

---

*End of Agent 1 Architecture & Product Registration specification. This document covers system architecture (4 data flow diagrams), product registration (33 feature flags, database SQL, backend updates), tier system mapping (4 tiers with enforcement mechanisms), registration checklist (35 items across 4 phases), and security considerations (5 subsections covering HMAC, API keys, rate limits, MITM protection, and token refresh).*
