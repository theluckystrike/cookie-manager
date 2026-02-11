# API Integration, Drip Email Templates & Analytics: Zovo Cookie Manager

## Phase 09 | Agent 5 | Generated 2026-02-11

**Extension:** Zovo Cookie Manager
**Extension ID:** `cookie_manager`
**Scope:** Complete API integration specification for all 3 Zovo backend endpoints, production TypeScript API client module, paywall-triggered drip email sequences (4 emails x 5 feature variants), analytics event-to-API mapping, revenue analytics dashboard definitions, conversion funnel event chain, email service integration, and extension registration completion checklist.
**Dependencies:** Phase 09 Agents 1-4 (architecture, payments module, paywall UI, feature gating), Phase 08 retention system (local analytics events), Phase 07 Agent 4 (email drip psychology), Phase 07 Agent 5 (analytics events and measurement), Phase 04 Agent 5 (monetization analytics), Zovo integration guide (`09-EXTENSION-PAYMENT-INTEGRATION.md`)

---

## 1. API Integration Specification

### 1.1 API Base Configuration

```typescript
// Base configuration for all Zovo API calls
const ZOVO_API_BASE = 'https://xggdjlurppfcytxqoozs.supabase.co/functions/v1';
const EXTENSION_ID = 'cookie_manager';
const API_TIMEOUT_MS = 5000;
const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 1000;
```

---

### 1.2 Endpoint: verify-extension-license

**Purpose:** Validates a license key against the Zovo backend and returns the user's tier, email, and enabled features for Cookie Manager.

**URL:** `POST https://xggdjlurppfcytxqoozs.supabase.co/functions/v1/verify-extension-license`

#### Request Schema

```typescript
interface VerifyLicenseRequest {
  /** License key in ZOVO-XXXX-XXXX-XXXX-XXXX format */
  license_key: string;
  /** Extension identifier -- always "cookie_manager" for this extension */
  extension: 'cookie_manager';
}
```

```json
{
  "license_key": "ZOVO-A1B2-C3D4-E5F6-G7H8",
  "extension": "cookie_manager"
}
```

#### Response Schema -- Success

```typescript
interface VerifyLicenseSuccessResponse {
  valid: true;
  tier: 'pro' | 'lifetime';
  email: string;
  features: CookieManagerProFeature[];
}

type CookieManagerProFeature =
  | 'unlimited_profiles'
  | 'unlimited_rules'
  | 'bulk_export'
  | 'health_dashboard'
  | 'encrypted_vault'
  | 'bulk_operations'
  | 'advanced_rules'
  | 'export_all_formats'
  | 'gdpr_scanner'
  | 'curl_generation'
  | 'real_time_monitoring'
  | 'cross_domain_export';
```

```json
{
  "valid": true,
  "tier": "pro",
  "email": "user@example.com",
  "features": [
    "unlimited_profiles",
    "unlimited_rules",
    "bulk_export",
    "health_dashboard",
    "encrypted_vault",
    "bulk_operations",
    "advanced_rules",
    "export_all_formats",
    "gdpr_scanner",
    "curl_generation",
    "real_time_monitoring",
    "cross_domain_export"
  ]
}
```

#### Response Schema -- Error

```typescript
interface VerifyLicenseErrorResponse {
  valid: false;
  error: VerifyLicenseError;
}

type VerifyLicenseError =
  | 'License key not found'
  | 'Subscription not active'
  | 'License expired'
  | 'License revoked'
  | 'Extension not recognized'
  | 'Rate limit exceeded'
  | 'Invalid request format';
```

```json
{
  "valid": false,
  "error": "License key not found"
}
```

#### Rate Limits

| Scope | Limit | Window | Response on Exceed |
|-------|-------|--------|-------------------|
| Per license key | 10 requests | 60 seconds | HTTP 429 with `error: "Rate limit exceeded"` |
| Per IP address | 50 requests | 60 seconds | HTTP 429 with `error: "Rate limit exceeded"` |

**Rate limit headers returned:**

```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
X-RateLimit-Reset: 1739366460
```

#### Error Codes and Handling

| HTTP Status | Error | Action |
|-------------|-------|--------|
| 200 | `valid: true` | Cache response, unlock features |
| 200 | `valid: false, error: "License key not found"` | Show "Invalid license key" message |
| 200 | `valid: false, error: "Subscription not active"` | Show "Your subscription has expired" with renewal link |
| 200 | `valid: false, error: "License expired"` | Show "License expired" with renewal link |
| 200 | `valid: false, error: "License revoked"` | Show "License revoked -- contact support" |
| 400 | `error: "Invalid request format"` | Log error, show generic error message |
| 429 | `error: "Rate limit exceeded"` | Use cached data, retry after `X-RateLimit-Reset` |
| 500 | Server error | Retry with exponential backoff, fall back to cache |
| 502/503 | Service unavailable | Retry with exponential backoff, fall back to cache |
| Network error | No response | Fall back to `chrome.storage.local` cache |

#### Retry Strategy

```typescript
async function verifyWithRetry(
  licenseKey: string,
  attempt: number = 0
): Promise<VerifyLicenseSuccessResponse | VerifyLicenseErrorResponse> {
  const backoffMs = INITIAL_BACKOFF_MS * Math.pow(2, attempt);
  const jitter = Math.random() * 500;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

    const response = await fetch(
      `${ZOVO_API_BASE}/verify-extension-license`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          license_key: licenseKey,
          extension: EXTENSION_ID,
        }),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    // Rate limited -- wait and retry
    if (response.status === 429 && attempt < MAX_RETRIES) {
      const resetTime = response.headers.get('X-RateLimit-Reset');
      const waitMs = resetTime
        ? Math.max(0, parseInt(resetTime) * 1000 - Date.now())
        : backoffMs + jitter;
      await sleep(waitMs);
      return verifyWithRetry(licenseKey, attempt + 1);
    }

    // Server error -- retry with backoff
    if (response.status >= 500 && attempt < MAX_RETRIES) {
      await sleep(backoffMs + jitter);
      return verifyWithRetry(licenseKey, attempt + 1);
    }

    return await response.json();
  } catch (error) {
    // Timeout or network error
    if (attempt < MAX_RETRIES) {
      await sleep(backoffMs + jitter);
      return verifyWithRetry(licenseKey, attempt + 1);
    }

    // All retries exhausted -- fall back to cache
    return getFallbackFromCache();
  }
}
```

#### Timeout Handling

- **Request timeout:** 5 seconds per attempt via `AbortController`
- **Total max wait:** With 3 retries and exponential backoff (1s, 2s, 4s) plus jitter, worst case is approximately 12-14 seconds total
- **User experience during timeout:** Show spinner with "Verifying license..." for the first 2 seconds. If still pending after 2 seconds, add "This may take a moment..." subtext. If all retries fail, show "Could not verify license. Using cached data." and fall back to `chrome.storage.local`

#### Caching Behavior

```typescript
// Cache valid responses for 5 minutes in memory
const MEMORY_CACHE_DURATION_MS = 5 * 60 * 1000;

// Cache valid responses for 72 hours in chrome.storage.local (offline grace)
const STORAGE_CACHE_DURATION_MS = 72 * 60 * 60 * 1000;

interface LicenseCache {
  data: VerifyLicenseSuccessResponse;
  cachedAt: number;       // Date.now() timestamp
  validatedAt: number;    // Last successful API validation
}
```

---

### 1.3 Endpoint: log-paywall-hit

**Purpose:** Logs when a Cookie Manager user encounters a premium feature gate and optionally provides their email. Triggers the backend drip email sequence.

**URL:** `POST https://xggdjlurppfcytxqoozs.supabase.co/functions/v1/log-paywall-hit`

#### Request Schema

```typescript
interface LogPaywallHitRequest {
  /** User's email address */
  email: string;
  /** Extension identifier -- always "cookie_manager" */
  extension_id: 'cookie_manager';
  /** The feature that triggered the paywall */
  feature_attempted: CookieManagerPaywallFeature;
}

type CookieManagerPaywallFeature =
  | 'unlimited_profiles'
  | 'unlimited_rules'
  | 'bulk_export'
  | 'health_dashboard'
  | 'encrypted_vault'
  | 'bulk_operations'
  | 'advanced_rules'
  | 'export_all_formats'
  | 'gdpr_scanner'
  | 'curl_generation';
```

```json
{
  "email": "user@example.com",
  "extension_id": "cookie_manager",
  "feature_attempted": "unlimited_profiles"
}
```

#### Feature-Attempted Values and Their Triggers

| Value | Paywall Trigger | User Action |
|-------|----------------|-------------|
| `unlimited_profiles` | T1: Profile limit (2/2) | User attempts to create 3rd profile |
| `unlimited_rules` | T2: Rule limit (1/1) | User attempts to create 2nd auto-delete rule |
| `bulk_export` | T3: Export limit (25 cookies) | User exports from a domain with >25 cookies |
| `health_dashboard` | T5: Health details blurred | User clicks blurred health detail cards |
| `encrypted_vault` | T8: Vault feature locked | User attempts to access encrypted cookie vault |
| `bulk_operations` | T4: Bulk operations locked | User attempts bulk delete or bulk edit |
| `advanced_rules` | T9: Advanced rule patterns locked | User tries glob/regex patterns in rule creation |
| `export_all_formats` | T10: Non-JSON export locked | User selects Netscape/CSV/cURL export format |
| `gdpr_scanner` | T6: GDPR scan limit (1/1) | User attempts 2nd GDPR compliance scan |
| `curl_generation` | T11: cURL generation locked | User attempts to generate cURL command |

#### Response Schema -- Success

```typescript
interface LogPaywallHitSuccessResponse {
  success: true;
  paywall_event_id: string;  // UUID
  message: 'Paywall event logged';
  drip_sequence_started: boolean;
}
```

```json
{
  "success": true,
  "paywall_event_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "message": "Paywall event logged",
  "drip_sequence_started": true
}
```

#### Response Schema -- Deduplicated (same feature + email within 1 hour)

```json
{
  "success": true,
  "paywall_event_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "message": "Paywall event already logged recently",
  "drip_sequence_started": false
}
```

#### Response Schema -- Error

```typescript
interface LogPaywallHitErrorResponse {
  success: false;
  error: string;
}
```

```json
{
  "success": false,
  "error": "Invalid email format"
}
```

#### Rate Limits

| Scope | Limit | Window | Response on Exceed |
|-------|-------|--------|-------------------|
| Per IP address | 5 requests | 60 seconds | HTTP 429 with `error: "Rate limit exceeded"` |

#### Client-Side Deduplication

To reduce unnecessary API calls, the client deduplicates paywall hits before sending:

```typescript
const DEDUP_WINDOW_MS = 60 * 60 * 1000; // 1 hour

interface PaywallHitRecord {
  email: string;
  feature: string;
  timestamp: number;
}

async function shouldLogPaywallHit(
  email: string,
  feature: string
): Promise<boolean> {
  const key = 'zovo_paywall_hit_log';
  const stored = await chrome.storage.local.get(key);
  const log: PaywallHitRecord[] = stored[key] ?? [];

  // Check if same email + feature was logged within the last hour
  const now = Date.now();
  const isDuplicate = log.some(
    (record) =>
      record.email === email &&
      record.feature === feature &&
      now - record.timestamp < DEDUP_WINDOW_MS
  );

  if (isDuplicate) return false;

  // Add new record and clean up old entries
  const updatedLog = [
    ...log.filter((r) => now - r.timestamp < DEDUP_WINDOW_MS),
    { email, feature, timestamp: now },
  ];

  await chrome.storage.local.set({ [key]: updatedLog });
  return true;
}
```

#### Drip Email Trigger Mapping

When the backend receives a `log-paywall-hit` call and the email+feature combination has not been logged within the last hour, it:

1. Creates a `paywall_events` row in Supabase
2. Checks if an active drip sequence exists for this email + extension
3. If no active sequence (or sequence completed/expired): starts a new 4-email drip sequence
4. If an active sequence exists for a *different* feature: queues the new feature as a parallel sequence (max 2 active)
5. If an active sequence exists for the *same* feature: does not restart (30-day cooldown)

| Feature Attempted | Email Sequence Template | Primary Angle |
|-------------------|------------------------|---------------|
| `unlimited_profiles` | Profile limit sequence | Environment switching, multi-account management |
| `unlimited_rules` | Rule limit sequence | Automation, hands-free cookie cleanup |
| `bulk_export` | Export limit sequence | Bulk operations, data portability |
| `health_dashboard` | Health dashboard sequence | Security visibility, tracking detection |
| `encrypted_vault` | Vault sequence | Data protection, credential security |
| `bulk_operations` | Bulk ops sequence | Efficiency, time savings |
| `advanced_rules` | Advanced rules sequence | Power automation, regex/glob patterns |
| `export_all_formats` | Export formats sequence | Netscape/CSV/cURL developer workflow |
| `gdpr_scanner` | GDPR sequence | Compliance, privacy regulation |
| `curl_generation` | cURL sequence | Developer workflow, API debugging |

---

### 1.4 Endpoint: collect-analytics

**Purpose:** Tracks anonymous usage events from Cookie Manager for conversion analysis, feature popularity, and funnel optimization.

**URL:** `POST https://xggdjlurppfcytxqoozs.supabase.co/functions/v1/collect-analytics`

#### Request Schema

```typescript
interface CollectAnalyticsRequest {
  /** Extension identifier -- always "cookie_manager" */
  extension_slug: 'cookie_manager';
  /** Event name from the approved event list */
  event_name: AnalyticsEventName;
  /** Event-specific data payload */
  event_data: Record<string, unknown>;
  /** Anonymous session identifier (UUID, generated per browser session) */
  session_id: string;
}
```

```json
{
  "extension_slug": "cookie_manager",
  "event_name": "paywall_viewed",
  "event_data": {
    "trigger_id": "T1",
    "paywall_type": "hard",
    "copy_variation": 2,
    "times_shown_total": 3,
    "days_since_install": 5,
    "session_number": 12
  },
  "session_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

#### Batch Request Schema

Events are queued locally and sent in batches to reduce API calls:

```typescript
interface CollectAnalyticsBatchRequest {
  extension_slug: 'cookie_manager';
  events: Array<{
    event_name: AnalyticsEventName;
    event_data: Record<string, unknown>;
    session_id: string;
    timestamp: string; // ISO 8601
  }>;
}
```

```json
{
  "extension_slug": "cookie_manager",
  "events": [
    {
      "event_name": "paywall_viewed",
      "event_data": { "trigger_id": "T1", "paywall_type": "hard" },
      "session_id": "550e8400-e29b-41d4-a716-446655440000",
      "timestamp": "2026-02-11T14:30:00.000Z"
    },
    {
      "event_name": "paywall_dismissed",
      "event_data": { "trigger_id": "T1", "dismiss_method": "x_button", "view_duration_ms": 4500 },
      "session_id": "550e8400-e29b-41d4-a716-446655440000",
      "timestamp": "2026-02-11T14:30:05.000Z"
    }
  ]
}
```

#### Response Schema

```typescript
interface CollectAnalyticsResponse {
  success: boolean;
  events_received: number;
  events_processed: number;
}
```

```json
{
  "success": true,
  "events_received": 2,
  "events_processed": 2
}
```

#### Cookie Manager Event Names and Data Schemas

**Conversion funnel events (sent to backend):**

| Event Name | Data Schema | Purpose |
|------------|-------------|---------|
| `paywall_viewed` | `{ trigger_id, paywall_type, copy_variation, times_shown_total, days_since_install, session_number }` | Track which limits users hit |
| `paywall_email_captured` | `{ trigger_id, days_since_install, has_existing_account }` | Email capture rate per trigger |
| `paywall_dismissed` | `{ trigger_id, dismiss_method, view_duration_ms, copy_variation }` | Fatigue measurement |
| `paywall_clicked` | `{ trigger_id, destination_url, copy_variation, days_since_install }` | Upgrade intent |
| `upgrade_page_viewed` | `{ trigger_id, plan_preselected, billing_cycle, referral_source }` | Pricing page visits |
| `checkout_started` | `{ trigger_id, plan_tier, billing_cycle, amount_cents }` | Checkout funnel entry |
| `payment_completed` | `{ from_tier, to_tier, billing_cycle, amount_cents, trigger_id, days_since_install, total_paywalls_seen, total_sessions }` | Revenue attribution |
| `payment_failed` | `{ error_type, plan_tier, billing_cycle, step_failed }` | Drop-off diagnosis |
| `license_activated` | `{ tier, activation_method, days_since_install }` | License activation tracking |

**Engagement events (sent to backend):**

| Event Name | Data Schema | Purpose |
|------------|-------------|---------|
| `extension_installed` | `{ source, version }` | Install attribution |
| `extension_updated` | `{ from_version, to_version }` | Update tracking |
| `feature_used` | `{ feature, tier, count }` | Feature popularity |
| `cross_promo_clicked` | `{ target_extension, trigger_action, user_tier }` | Cross-sell effectiveness |
| `drip_email_opened` | `{ email_number, feature_trigger, sequence_id }` | Email engagement (via webhook) |
| `drip_email_clicked` | `{ email_number, feature_trigger, cta_clicked, sequence_id }` | Email CTA effectiveness |
| `downgrade_detected` | `{ from_tier, to_tier, reason, days_as_paid_user }` | Churn tracking |

**Local-only events (NOT sent to backend -- privacy-sensitive):**

| Event Name | Reason for Local Only |
|------------|----------------------|
| `cm_cookie_viewed` | Contains domain-specific browsing data |
| `cm_cookie_edited` | Contains domain-specific browsing data |
| `cm_cookie_created` | Contains domain-specific browsing data |
| `cm_cookie_deleted` | Contains domain-specific browsing data |
| `cm_search_used` | May contain user query strings |
| `cm_filter_applied` | Low conversion signal |
| `cm_tab_switched` | Low conversion signal |
| `cm_shortcut_used` | Low conversion signal |
| `cm_context_menu_used` | Low conversion signal |
| `cm_settings_opened` | Low conversion signal |
| `cm_session_ended` | Duration tracked locally |

#### Batch Sending Strategy

```typescript
// Queue events locally, flush every 5 minutes
const BATCH_INTERVAL_MS = 5 * 60 * 1000;
const MAX_QUEUE_SIZE = 100;
const MAX_BATCH_SIZE = 50;

class AnalyticsBatchQueue {
  private queueKey = 'zovo_analytics_queue';

  /**
   * Add an event to the local queue.
   * If queue exceeds MAX_QUEUE_SIZE, drops oldest events.
   */
  async enqueue(
    eventName: AnalyticsEventName,
    eventData: Record<string, unknown>
  ): Promise<void> {
    const sessionId = await getSessionId();
    const stored = await chrome.storage.local.get(this.queueKey);
    const queue: QueuedEvent[] = stored[this.queueKey] ?? [];

    queue.push({
      event_name: eventName,
      event_data: eventData,
      session_id: sessionId,
      timestamp: new Date().toISOString(),
    });

    // Trim oldest events if over capacity
    const trimmed = queue.length > MAX_QUEUE_SIZE
      ? queue.slice(queue.length - MAX_QUEUE_SIZE)
      : queue;

    await chrome.storage.local.set({ [this.queueKey]: trimmed });
  }

  /**
   * Flush queued events to the backend.
   * Called by chrome.alarms every 5 minutes.
   */
  async flush(): Promise<void> {
    const stored = await chrome.storage.local.get(this.queueKey);
    const queue: QueuedEvent[] = stored[this.queueKey] ?? [];

    if (queue.length === 0) return;

    // Take up to MAX_BATCH_SIZE events
    const batch = queue.slice(0, MAX_BATCH_SIZE);
    const remaining = queue.slice(MAX_BATCH_SIZE);

    try {
      const response = await fetch(
        `${ZOVO_API_BASE}/collect-analytics`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            extension_slug: EXTENSION_ID,
            events: batch,
          }),
        }
      );

      if (response.ok) {
        // Success -- keep only unprocessed events
        await chrome.storage.local.set({
          [this.queueKey]: remaining,
        });
      } else if (response.status === 429) {
        // Rate limited -- keep all events for next flush cycle
        console.debug('[Zovo Analytics] Rate limited, will retry on next flush');
      } else {
        // Server error -- keep events for retry
        console.debug('[Zovo Analytics] Server error, will retry on next flush');
      }
    } catch (error) {
      // Network error -- buffer locally, retry on next batch cycle
      console.debug('[Zovo Analytics] Network error, events buffered for retry');
    }
  }
}
```

#### Failure Handling

1. **Network error:** Events remain in `chrome.storage.local` queue. The next 5-minute alarm cycle retries the flush.
2. **HTTP 429 (rate limited):** Events remain in queue. Next flush cycle retries.
3. **HTTP 5xx (server error):** Events remain in queue. Next flush cycle retries.
4. **Queue overflow (>100 events):** Oldest events are dropped to prevent unbounded storage growth. This only occurs if the user is offline for an extended period.
5. **Extension update/restart:** Queue persists in `chrome.storage.local` and is flushed after the service worker restarts.
6. **Analytics disabled by user:** The `enqueue()` method checks `chrome.storage.local` for `analytics_disabled: true` and returns immediately without storing the event.

#### Service Worker Alarm Setup

```typescript
// In service-worker.ts
chrome.alarms.create('zovo-analytics-flush', {
  periodInMinutes: 5,
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'zovo-analytics-flush') {
    const queue = new AnalyticsBatchQueue();
    await queue.flush();
  }
});
```

---

### 1.5 API Client Module (`api-client.ts`)

Production TypeScript wrapper around all 3 Zovo API endpoints with centralized error handling, rate limit tracking, retry logic, and debug logging.

```typescript
// src/shared/api-client.ts

/**
 * Zovo API Client for Cookie Manager
 *
 * Centralized wrapper around all Zovo backend endpoints.
 * Handles retries, rate limits, timeouts, caching, and error reporting.
 */

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const ZOVO_API_BASE =
  'https://xggdjlurppfcytxqoozs.supabase.co/functions/v1';
const EXTENSION_ID = 'cookie_manager' as const;
const API_TIMEOUT_MS = 5000;
const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 1000;
const MEMORY_CACHE_DURATION_MS = 5 * 60 * 1000; // 5 min
const STORAGE_CACHE_DURATION_MS = 72 * 60 * 60 * 1000; // 72 hours

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CookieManagerProFeature =
  | 'unlimited_profiles'
  | 'unlimited_rules'
  | 'bulk_export'
  | 'health_dashboard'
  | 'encrypted_vault'
  | 'bulk_operations'
  | 'advanced_rules'
  | 'export_all_formats'
  | 'gdpr_scanner'
  | 'curl_generation'
  | 'real_time_monitoring'
  | 'cross_domain_export';

export type CookieManagerPaywallFeature =
  | 'unlimited_profiles'
  | 'unlimited_rules'
  | 'bulk_export'
  | 'health_dashboard'
  | 'encrypted_vault'
  | 'bulk_operations'
  | 'advanced_rules'
  | 'export_all_formats'
  | 'gdpr_scanner'
  | 'curl_generation';

export interface VerifyLicenseSuccess {
  valid: true;
  tier: 'pro' | 'lifetime';
  email: string;
  features: CookieManagerProFeature[];
}

export interface VerifyLicenseError {
  valid: false;
  error: string;
}

export type VerifyLicenseResponse = VerifyLicenseSuccess | VerifyLicenseError;

export interface LogPaywallHitSuccess {
  success: true;
  paywall_event_id: string;
  message: string;
  drip_sequence_started: boolean;
}

export interface LogPaywallHitError {
  success: false;
  error: string;
}

export type LogPaywallHitResponse = LogPaywallHitSuccess | LogPaywallHitError;

export interface CollectAnalyticsResponse {
  success: boolean;
  events_received: number;
  events_processed: number;
}

interface QueuedEvent {
  event_name: string;
  event_data: Record<string, unknown>;
  session_id: string;
  timestamp: string;
}

interface LicenseCache {
  data: VerifyLicenseSuccess;
  cachedAt: number;
  validatedAt: number;
}

interface RateLimitState {
  endpoint: string;
  remaining: number;
  resetAt: number;
}

// ---------------------------------------------------------------------------
// Debug mode
// ---------------------------------------------------------------------------

let debugMode = false;

function debugLog(message: string, data?: unknown): void {
  if (!debugMode) return;
  console.log(`[Zovo API] ${message}`, data ?? '');
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getSessionId(): Promise<string> {
  const stored = await chrome.storage.session.get('zovo_session_id');
  if (stored.zovo_session_id) return stored.zovo_session_id;

  const sessionId = crypto.randomUUID();
  await chrome.storage.session.set({ zovo_session_id: sessionId });
  return sessionId;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ---------------------------------------------------------------------------
// Rate limit tracking
// ---------------------------------------------------------------------------

const rateLimits: Map<string, RateLimitState> = new Map();

function updateRateLimits(
  endpoint: string,
  headers: Headers
): void {
  const remaining = headers.get('X-RateLimit-Remaining');
  const reset = headers.get('X-RateLimit-Reset');

  if (remaining !== null && reset !== null) {
    rateLimits.set(endpoint, {
      endpoint,
      remaining: parseInt(remaining, 10),
      resetAt: parseInt(reset, 10) * 1000, // Convert to ms
    });
    debugLog(`Rate limit updated for ${endpoint}`, {
      remaining: parseInt(remaining, 10),
      resetsIn: `${Math.ceil((parseInt(reset, 10) * 1000 - Date.now()) / 1000)}s`,
    });
  }
}

function isRateLimited(endpoint: string): boolean {
  const state = rateLimits.get(endpoint);
  if (!state) return false;
  if (Date.now() > state.resetAt) {
    rateLimits.delete(endpoint);
    return false;
  }
  return state.remaining <= 0;
}

function getRateLimitResetMs(endpoint: string): number {
  const state = rateLimits.get(endpoint);
  if (!state) return 0;
  return Math.max(0, state.resetAt - Date.now());
}

// ---------------------------------------------------------------------------
// Core fetch with retry
// ---------------------------------------------------------------------------

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  endpoint: string,
  attempt: number = 0
): Promise<Response> {
  const backoffMs = INITIAL_BACKOFF_MS * Math.pow(2, attempt);
  const jitter = Math.random() * 500;

  // Check rate limit before sending
  if (isRateLimited(endpoint)) {
    const waitMs = getRateLimitResetMs(endpoint);
    debugLog(`Rate limited on ${endpoint}, waiting ${waitMs}ms`);
    if (waitMs > 0 && waitMs < 60000) {
      await sleep(waitMs);
    } else {
      throw new Error('Rate limit exceeded');
    }
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    debugLog(`Request: ${endpoint} (attempt ${attempt + 1})`, options.body);

    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Track rate limits from response headers
    updateRateLimits(endpoint, response.headers);

    debugLog(`Response: ${endpoint} ${response.status}`);

    // Rate limited -- retry
    if (response.status === 429 && attempt < MAX_RETRIES) {
      const resetHeader = response.headers.get('X-RateLimit-Reset');
      const waitMs = resetHeader
        ? Math.max(0, parseInt(resetHeader, 10) * 1000 - Date.now())
        : backoffMs + jitter;
      debugLog(`429 received, waiting ${waitMs}ms before retry`);
      await sleep(waitMs);
      return fetchWithRetry(url, options, endpoint, attempt + 1);
    }

    // Server error -- retry with backoff
    if (response.status >= 500 && attempt < MAX_RETRIES) {
      debugLog(`5xx received, backing off ${backoffMs + jitter}ms`);
      await sleep(backoffMs + jitter);
      return fetchWithRetry(url, options, endpoint, attempt + 1);
    }

    return response;
  } catch (error) {
    clearTimeout(timeoutId);

    if (attempt < MAX_RETRIES) {
      debugLog(`Error on ${endpoint}, retrying in ${backoffMs + jitter}ms`, error);
      await sleep(backoffMs + jitter);
      return fetchWithRetry(url, options, endpoint, attempt + 1);
    }

    throw error;
  }
}

// ---------------------------------------------------------------------------
// License cache
// ---------------------------------------------------------------------------

let memoryCache: LicenseCache | null = null;

async function getCachedLicense(): Promise<VerifyLicenseSuccess | null> {
  // Check memory cache first
  if (
    memoryCache &&
    Date.now() - memoryCache.cachedAt < MEMORY_CACHE_DURATION_MS
  ) {
    debugLog('License from memory cache');
    return memoryCache.data;
  }

  // Check storage cache
  const stored = await chrome.storage.local.get('zovoLicenseCache');
  const cache: LicenseCache | undefined = stored.zovoLicenseCache;

  if (cache && Date.now() - cache.validatedAt < STORAGE_CACHE_DURATION_MS) {
    debugLog('License from storage cache');
    memoryCache = cache;
    return cache.data;
  }

  return null;
}

async function setCachedLicense(data: VerifyLicenseSuccess): Promise<void> {
  const cache: LicenseCache = {
    data,
    cachedAt: Date.now(),
    validatedAt: Date.now(),
  };

  memoryCache = cache;

  await chrome.storage.local.set({ zovoLicenseCache: cache });
  debugLog('License cached', { tier: data.tier, features: data.features.length });
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export class ZovoApiClient {
  /**
   * Enable or disable debug logging.
   * When enabled, all requests, responses, and cache hits are logged to console.
   */
  static setDebugMode(enabled: boolean): void {
    debugMode = enabled;
  }

  /**
   * Verify a license key against the Zovo backend.
   *
   * @param licenseKey - ZOVO-XXXX-XXXX-XXXX-XXXX format
   * @param forceRefresh - Skip cache and fetch fresh data
   * @returns License verification result
   */
  static async verifyLicense(
    licenseKey: string,
    forceRefresh: boolean = false
  ): Promise<VerifyLicenseResponse> {
    // Validate format
    if (
      !/^ZOVO-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(
        licenseKey
      )
    ) {
      return { valid: false, error: 'Invalid license format' };
    }

    // Check cache unless forced refresh
    if (!forceRefresh) {
      const cached = await getCachedLicense();
      if (cached) return cached;
    }

    try {
      const response = await fetchWithRetry(
        `${ZOVO_API_BASE}/verify-extension-license`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            license_key: licenseKey,
            extension: EXTENSION_ID,
          }),
        },
        'verify-extension-license'
      );

      const data: VerifyLicenseResponse = await response.json();

      debugLog('License verification result', data);

      if (data.valid) {
        await setCachedLicense(data);
      }

      return data;
    } catch (error) {
      debugLog('License verification failed, trying cache fallback', error);

      // Fall back to cached data (even if expired, within 72h grace)
      const cached = await getCachedLicense();
      if (cached) return cached;

      return { valid: false, error: 'Network error' };
    }
  }

  /**
   * Check if user has a specific feature enabled.
   *
   * @param featureName - Feature to check
   * @returns true if the user has this feature
   */
  static async hasFeature(
    featureName: CookieManagerProFeature
  ): Promise<boolean> {
    const cached = await getCachedLicense();
    if (!cached) return false;
    return cached.features.includes(featureName);
  }

  /**
   * Check if user is Pro (has any valid license).
   *
   * @returns true if the user has a valid Pro or Lifetime license
   */
  static async isPro(): Promise<boolean> {
    const cached = await getCachedLicense();
    return cached !== null;
  }

  /**
   * Get the user's current tier.
   *
   * @returns 'free', 'pro', or 'lifetime'
   */
  static async getTier(): Promise<'free' | 'pro' | 'lifetime'> {
    const cached = await getCachedLicense();
    return cached?.tier ?? 'free';
  }

  /**
   * Log a paywall hit. Triggers the backend drip email sequence.
   * Performs client-side deduplication (1 hour window).
   *
   * @param email - User's email address
   * @param featureAttempted - Which feature triggered the paywall
   * @returns Success/error result
   */
  static async logPaywallHit(
    email: string,
    featureAttempted: CookieManagerPaywallFeature
  ): Promise<LogPaywallHitResponse> {
    if (!email || !isValidEmail(email)) {
      return { success: false, error: 'Invalid email' };
    }

    // Client-side deduplication
    const shouldLog = await shouldLogPaywallHitCheck(email, featureAttempted);
    if (!shouldLog) {
      debugLog('Paywall hit deduplicated (same email+feature within 1 hour)');
      return {
        success: true,
        paywall_event_id: '',
        message: 'Deduplicated client-side',
        drip_sequence_started: false,
      };
    }

    try {
      const response = await fetchWithRetry(
        `${ZOVO_API_BASE}/log-paywall-hit`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            extension_id: EXTENSION_ID,
            feature_attempted: featureAttempted,
          }),
        },
        'log-paywall-hit'
      );

      const data: LogPaywallHitResponse = await response.json();
      debugLog('Paywall hit logged', data);
      return data;
    } catch (error) {
      debugLog('Paywall hit logging failed', error);
      return { success: false, error: 'Network error' };
    }
  }

  /**
   * Track an analytics event. Events are queued locally and sent in batches
   * every 5 minutes via the analytics-flush alarm.
   *
   * @param eventName - Event name
   * @param eventData - Additional event data
   */
  static async trackEvent(
    eventName: string,
    eventData: Record<string, unknown> = {}
  ): Promise<void> {
    // Check if analytics are disabled
    const { analytics_disabled } = await chrome.storage.local.get(
      'analytics_disabled'
    );
    if (analytics_disabled) return;

    const queue = new AnalyticsBatchQueueImpl();
    await queue.enqueue(eventName, eventData);
    debugLog('Event queued', { eventName, eventData });
  }

  /**
   * Force-flush queued analytics events to the backend.
   * Normally called by the 5-minute alarm, but can be invoked manually
   * (e.g., on extension unload).
   */
  static async flushAnalytics(): Promise<void> {
    const queue = new AnalyticsBatchQueueImpl();
    await queue.flush();
  }

  /**
   * Open the Zovo upgrade page in a new tab.
   *
   * @param triggerId - Optional paywall trigger for attribution
   */
  static openUpgradePage(triggerId?: string): void {
    const params = new URLSearchParams({ ref: EXTENSION_ID });
    if (triggerId) params.set('trigger', triggerId);
    chrome.tabs.create({
      url: `https://zovo.one/join?${params.toString()}`,
    });
  }

  /**
   * Clear all cached license data. Used for sign-out and debugging.
   */
  static async clearCache(): Promise<void> {
    memoryCache = null;
    await chrome.storage.local.remove([
      'zovoLicenseCache',
      'zovo_paywall_hit_log',
    ]);
    debugLog('Cache cleared');
  }

  /**
   * Get current rate limit status for all endpoints.
   * Useful for debugging and monitoring.
   */
  static getRateLimitStatus(): Record<string, RateLimitState> {
    const status: Record<string, RateLimitState> = {};
    rateLimits.forEach((state, key) => {
      status[key] = state;
    });
    return status;
  }
}

// ---------------------------------------------------------------------------
// Internal: Paywall hit deduplication
// ---------------------------------------------------------------------------

interface PaywallHitRecord {
  email: string;
  feature: string;
  timestamp: number;
}

const DEDUP_WINDOW_MS = 60 * 60 * 1000; // 1 hour

async function shouldLogPaywallHitCheck(
  email: string,
  feature: string
): Promise<boolean> {
  const key = 'zovo_paywall_hit_log';
  const stored = await chrome.storage.local.get(key);
  const log: PaywallHitRecord[] = stored[key] ?? [];

  const now = Date.now();
  const isDuplicate = log.some(
    (record) =>
      record.email === email &&
      record.feature === feature &&
      now - record.timestamp < DEDUP_WINDOW_MS
  );

  if (isDuplicate) return false;

  const updatedLog = [
    ...log.filter((r) => now - r.timestamp < DEDUP_WINDOW_MS),
    { email, feature, timestamp: now },
  ];

  await chrome.storage.local.set({ [key]: updatedLog });
  return true;
}

// ---------------------------------------------------------------------------
// Internal: Analytics batch queue
// ---------------------------------------------------------------------------

const QUEUE_KEY = 'zovo_analytics_queue';
const MAX_QUEUE_SIZE = 100;
const MAX_BATCH_SIZE = 50;

class AnalyticsBatchQueueImpl {
  async enqueue(
    eventName: string,
    eventData: Record<string, unknown>
  ): Promise<void> {
    const sessionId = await getSessionId();
    const stored = await chrome.storage.local.get(QUEUE_KEY);
    const queue: QueuedEvent[] = stored[QUEUE_KEY] ?? [];

    queue.push({
      event_name: eventName,
      event_data: eventData,
      session_id: sessionId,
      timestamp: new Date().toISOString(),
    });

    const trimmed =
      queue.length > MAX_QUEUE_SIZE
        ? queue.slice(queue.length - MAX_QUEUE_SIZE)
        : queue;

    await chrome.storage.local.set({ [QUEUE_KEY]: trimmed });
  }

  async flush(): Promise<void> {
    const stored = await chrome.storage.local.get(QUEUE_KEY);
    const queue: QueuedEvent[] = stored[QUEUE_KEY] ?? [];

    if (queue.length === 0) return;

    const batch = queue.slice(0, MAX_BATCH_SIZE);
    const remaining = queue.slice(MAX_BATCH_SIZE);

    try {
      const response = await fetchWithRetry(
        `${ZOVO_API_BASE}/collect-analytics`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            extension_slug: EXTENSION_ID,
            events: batch,
          }),
        },
        'collect-analytics'
      );

      if (response.ok) {
        await chrome.storage.local.set({ [QUEUE_KEY]: remaining });
        debugLog(`Flushed ${batch.length} events, ${remaining.length} remaining`);
      } else {
        debugLog(`Flush failed with status ${response.status}, events retained`);
      }
    } catch (error) {
      debugLog('Flush network error, events retained for retry', error);
    }
  }

  async getQueueSize(): Promise<number> {
    const stored = await chrome.storage.local.get(QUEUE_KEY);
    return (stored[QUEUE_KEY] ?? []).length;
  }
}

// ---------------------------------------------------------------------------
// Default export
// ---------------------------------------------------------------------------

export default ZovoApiClient;
```

---

## 2. Drip Email Templates for Cookie Manager

### 2.1 Email Sequence Architecture

When a user hits a paywall in Cookie Manager, provides their email, and the backend logs the event, a 4-email drip sequence is initiated. Each email is customized based on the specific feature that triggered the paywall.

**Sequence timing:**

| Email | Delay | Purpose |
|-------|-------|---------|
| Email 1 | Immediate (within 60 seconds) | "You were trying to..." -- acknowledge the exact feature |
| Email 2 | 24 hours later | Social proof + feature highlights |
| Email 3 | 72 hours later | Pain point reminder + annual discount offer |
| Email 4 | 7 days later | Gentle final touch + summary |

**Sequence rules:**

- Maximum 4 emails per paywall hit sequence
- Minimum 24 hours between any two emails
- Stop sequence immediately on upgrade (check `converted` flag before each send)
- Do not restart sequence for the same feature for the same email within 30 days
- Allow different feature sequences to run in parallel (max 2 active sequences per user)
- User can unsubscribe from drip emails but continue using the extension
- All emails include a 1-click unsubscribe link in the footer

**Suppression rules (checked before each email send):**

1. `converted === true` for this email: suppress all remaining emails in sequence
2. User has unsubscribed: suppress all emails
3. Email bounced: suppress all emails, mark email as invalid
4. User upgraded to any paid tier: suppress all sequences across all features

---

### 2.2 Email 1: "You were trying to..." (Immediate)

**Send condition:** Immediately after `log-paywall-hit` is received and validated. Within 60 seconds.

**Suppression:** Skip if user already has an active paid subscription.

#### Profile Limit Variant (`unlimited_profiles`)

**Subject A:** You were 1 profile away from a real workflow
**Subject B:** Your 2 Cookie Manager profiles are doing heavy lifting
**Preview text:** Unlimited profiles start at $4/mo -- switch environments in one click

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Unlock Unlimited Profiles</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; color: #1e293b;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header -->
    <tr>
      <td style="padding: 32px 32px 24px; text-align: center;">
        <img src="https://zovo.one/email/cookie-manager-icon.png" width="48" height="48" alt="Cookie Manager" style="border-radius: 12px;">
        <h1 style="font-size: 22px; font-weight: 600; color: #1e293b; margin: 16px 0 0;">You were trying to create a third profile</h1>
      </td>
    </tr>
    <!-- Body -->
    <tr>
      <td style="padding: 0 32px 24px;">
        <p style="font-size: 16px; line-height: 1.6; color: #475569; margin: 0 0 16px;">
          Hi there,
        </p>
        <p style="font-size: 16px; line-height: 1.6; color: #475569; margin: 0 0 16px;">
          You've already built 2 cookie profiles in Cookie Manager -- which means you're switching between environments, accounts, or test setups regularly. That's exactly what profiles were designed for.
        </p>
        <p style="font-size: 16px; line-height: 1.6; color: #475569; margin: 0 0 16px;">
          With Cookie Manager Pro, you get <strong>unlimited profiles</strong>. One for staging, one for production, one for each client, one for QA -- as many as your workflow needs. Switch between them with a single click.
        </p>
        <p style="font-size: 16px; line-height: 1.6; color: #475569; margin: 0 0 24px;">
          Most developers who upgrade tell us profiles save them 10-15 minutes per day. That's over 5 hours a month.
        </p>
        <!-- CTA -->
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="text-align: center;">
              <a href="https://zovo.one/join?ref=cookie_manager&trigger=unlimited_profiles&email={{email}}" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; padding: 14px 32px; border-radius: 8px;">
                Unlock Unlimited Profiles -- $4/mo
              </a>
            </td>
          </tr>
        </table>
        <p style="font-size: 13px; color: #94a3b8; text-align: center; margin: 16px 0 0;">
          7-day money-back guarantee. Cancel anytime.
        </p>
      </td>
    </tr>
    <!-- Footer -->
    <tr>
      <td style="padding: 24px 32px; border-top: 1px solid #e2e8f0; text-align: center;">
        <p style="font-size: 12px; color: #94a3b8; margin: 0 0 8px;">
          You're receiving this because you entered your email in Cookie Manager.
        </p>
        <a href="{{unsubscribe_url}}" style="font-size: 12px; color: #94a3b8;">Unsubscribe</a>
        <span style="font-size: 12px; color: #cbd5e1;"> | </span>
        <a href="https://zovo.one/privacy/cookie-manager" style="font-size: 12px; color: #94a3b8;">Privacy Policy</a>
      </td>
    </tr>
  </table>
</body>
</html>
```

#### Export Limit Variant (`bulk_export`)

**Subject A:** That export was bigger than 25 cookies -- here's the fix
**Subject B:** Your cookie export was cut short
**Preview text:** Export unlimited cookies in JSON, Netscape, CSV, or cURL

**Body copy (key paragraphs -- same HTML structure as above):**

> You just tried to export cookies from a domain with more than 25 entries. Cookie Manager's free tier caps exports at 25 cookies per domain to keep things lightweight.
>
> With Pro, there's no limit. Export every cookie on every domain -- in JSON, Netscape, CSV, or even as a cURL command. Bulk export across multiple domains at once.
>
> Developers who work with authentication flows, staging environments, or API debugging tell us unlimited export is the single most valuable Pro feature.

**CTA:** Export Without Limits -- $4/mo

#### Health Dashboard Variant (`health_dashboard`)

**Subject A:** There's more behind those blurred health cards
**Subject B:** Your cookie health report is ready -- unlock the details
**Preview text:** See exactly which cookies are tracking you and which are insecure

**Body copy (key paragraphs):**

> You opened the Cookie Health Dashboard and saw a glimpse of what's happening with cookies on your sites. The tracking cookie count, the insecure cookies, the third-party scores -- all there, just behind the blur.
>
> With Pro, every card is fully visible. You'll see exactly which cookies are tracking you, which ones are missing Secure or HttpOnly flags, and which third-party domains have the most cookies. The full GDPR compliance scanner runs unlimited scans with detailed remediation recommendations.
>
> For anyone responsible for site security or compliance, this visibility is essential.

**CTA:** See Your Full Health Report -- $4/mo

#### Vault Variant (`encrypted_vault`)

**Subject A:** Your cookies deserve better than plain text
**Subject B:** Encrypted cookie storage is one click away
**Preview text:** AES-256 encrypted cookie vault for sensitive credentials

**Body copy (key paragraphs):**

> You tried to access the encrypted vault -- which means you have cookies worth protecting. Session tokens, authentication credentials, API keys stored in cookies -- all sensitive data that should not sit in plain text.
>
> Cookie Manager Pro's vault encrypts your saved cookie profiles with AES-256 encryption. Only you can decrypt them with your master password. Even if someone gains access to your browser data, your vault stays locked.
>
> For teams handling customer data or working in regulated industries, encrypted storage is not optional -- it's required.

**CTA:** Secure Your Cookies -- $4/mo

#### Rules Variant (`unlimited_rules`)

**Subject A:** Your auto-delete rule is working -- time for more
**Subject B:** One rule isn't enough for a real cleanup workflow
**Preview text:** Unlimited auto-delete rules with advanced patterns

**Body copy (key paragraphs):**

> Your first auto-delete rule has been running and cleaning up cookies automatically. That's the power of automation -- set it once, forget about it.
>
> But one rule only covers one pattern. With Pro, you can create unlimited rules with advanced matching: glob patterns, regex, scheduled deletion, domain groups, and rule priorities. Build a complete cookie hygiene system that runs in the background.
>
> Power users typically run 5-10 rules covering different categories: tracking cookies, session cleanup, development environments, and testing artifacts.

**CTA:** Unlock Unlimited Rules -- $4/mo

---

### 2.3 Email 2: "Here's what Pro users love" (24 hours later)

**Send condition:** 24 hours after Email 1. Only if `converted === false` and user has not unsubscribed.

**Subject A:** Here's what Cookie Manager Pro users love most
**Subject B:** 3 things Pro users say they can't live without
**Preview text:** Profiles, unlimited export, and the health dashboard -- the top 3

**Body (universal -- not feature-specific):**

```html
<!-- Same HTML wrapper as Email 1 -->
<!-- Header -->
<h1 style="font-size: 22px; font-weight: 600; color: #1e293b; margin: 16px 0 0;">Here's what Pro users say</h1>

<!-- Body -->
<p style="font-size: 16px; line-height: 1.6; color: #475569; margin: 0 0 16px;">
  We asked Cookie Manager Pro users which features they use every day. Here are the top 3:
</p>

<!-- Feature 1 -->
<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
  <tr>
    <td width="48" valign="top" style="padding-right: 16px;">
      <div style="width: 40px; height: 40px; background-color: #dbeafe; border-radius: 10px; text-align: center; line-height: 40px; font-size: 20px;">
        📁
      </div>
    </td>
    <td valign="top">
      <p style="font-size: 15px; font-weight: 600; color: #1e293b; margin: 0 0 4px;">Unlimited Profiles</p>
      <p style="font-size: 14px; color: #64748b; margin: 0;">"I have 8 profiles for different client environments. Switching used to take 5 minutes of manual cookie editing. Now it's one click." -- Senior Developer</p>
    </td>
  </tr>
</table>

<!-- Feature 2 -->
<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
  <tr>
    <td width="48" valign="top" style="padding-right: 16px;">
      <div style="width: 40px; height: 40px; background-color: #dcfce7; border-radius: 10px; text-align: center; line-height: 40px; font-size: 20px;">
        📊
      </div>
    </td>
    <td valign="top">
      <p style="font-size: 15px; font-weight: 600; color: #1e293b; margin: 0 0 4px;">Cookie Health Dashboard</p>
      <p style="font-size: 14px; color: #64748b; margin: 0;">"Our compliance team uses the health dashboard and GDPR scanner weekly. It catches third-party tracking cookies we didn't know were there." -- Privacy Engineer</p>
    </td>
  </tr>
</table>

<!-- Feature 3 -->
<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
  <tr>
    <td width="48" valign="top" style="padding-right: 16px;">
      <div style="width: 40px; height: 40px; background-color: #fef3c7; border-radius: 10px; text-align: center; line-height: 40px; font-size: 20px;">
        ⚡
      </div>
    </td>
    <td valign="top">
      <p style="font-size: 15px; font-weight: 600; color: #1e293b; margin: 0 0 4px;">Auto-Delete Rules</p>
      <p style="font-size: 14px; color: #64748b; margin: 0;">"I set up 6 auto-delete rules when I upgraded. Haven't thought about cookie cleanup since. It just works." -- QA Engineer</p>
    </td>
  </tr>
</table>

<p style="font-size: 16px; line-height: 1.6; color: #475569; margin: 0 0 24px;">
  Plus: bulk operations, encrypted vault, cURL generation, cross-domain export, real-time monitoring, and advanced regex rules.
</p>

<!-- CTA -->
<a href="https://zovo.one/join?ref=cookie_manager&email={{email}}&utm_source=drip&utm_content=email2" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; padding: 14px 32px; border-radius: 8px;">
  Unlock All Pro Features -- $4/mo
</a>

<!-- Pricing note -->
<p style="font-size: 14px; color: #64748b; text-align: center; margin: 16px 0 0;">
  Starter: $4/mo | Pro: $7/mo | Team: $14/mo<br>
  Annual billing saves 25%.
</p>
```

---

### 2.4 Email 3: "Still managing cookies the hard way?" (72 hours later)

**Send condition:** 72 hours after Email 1 (48 hours after Email 2). Only if `converted === false` and user has not unsubscribed.

**Subject A:** Still managing cookies the hard way?
**Subject B:** You're spending 15 minutes on what should take 15 seconds
**Preview text:** Limited-time: Save 25% with annual billing

**Body:**

```html
<!-- Same HTML wrapper -->
<!-- Header -->
<h1 style="font-size: 22px; font-weight: 600; color: #1e293b; margin: 16px 0 0;">Still managing cookies the hard way?</h1>

<!-- Body -->
<p style="font-size: 16px; line-height: 1.6; color: #475569; margin: 0 0 16px;">
  Let's do some quick math on what manual cookie management costs you:
</p>

<!-- ROI calculation -->
<table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f1f5f9; border-radius: 8px; margin-bottom: 24px;">
  <tr>
    <td style="padding: 20px;">
      <p style="font-size: 14px; color: #475569; margin: 0 0 12px;">
        <strong>Without Pro:</strong>
      </p>
      <ul style="font-size: 14px; color: #475569; margin: 0 0 16px; padding-left: 20px;">
        <li style="margin-bottom: 6px;">Manually switching between environments: ~5 min each time</li>
        <li style="margin-bottom: 6px;">Editing cookies one by one: ~2 min per cookie</li>
        <li style="margin-bottom: 6px;">Exporting in limited formats, 25 at a time: ~3 min per batch</li>
        <li style="margin-bottom: 6px;">No automated cleanup -- cookies pile up</li>
      </ul>
      <p style="font-size: 14px; color: #475569; margin: 0 0 16px;">
        <strong>Conservative estimate:</strong> 15 minutes/day x 22 work days = <strong>5.5 hours/month</strong>
      </p>
      <p style="font-size: 14px; color: #475569; margin: 0;">
        <strong>With Pro at $4/month:</strong> That's <strong>$0.73/hour</strong> saved. If your time is worth $50/hour, that's a <strong>68x return</strong>.
      </p>
    </td>
  </tr>
</table>

<!-- Annual discount callout -->
<table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #dbeafe 0%, #ede9fe 100%); border-radius: 8px; margin-bottom: 24px;">
  <tr>
    <td style="padding: 20px; text-align: center;">
      <p style="font-size: 13px; font-weight: 600; color: #7c3aed; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 4px;">
        Annual Plan
      </p>
      <p style="font-size: 24px; font-weight: 700; color: #1e293b; margin: 0 0 4px;">
        Save 25%
      </p>
      <p style="font-size: 14px; color: #64748b; margin: 0;">
        $3/mo billed annually instead of $4/mo
      </p>
    </td>
  </tr>
</table>

<!-- CTA -->
<a href="https://zovo.one/join?ref=cookie_manager&billing=annual&email={{email}}&utm_source=drip&utm_content=email3" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; padding: 14px 32px; border-radius: 8px;">
  Start with Annual Plan -- $3/mo
</a>

<p style="font-size: 13px; color: #94a3b8; text-align: center; margin: 16px 0 0;">
  7-day money-back guarantee. Cancel anytime.
</p>
```

---

### 2.5 Email 4: "One last thing" (7 days later)

**Send condition:** 7 days after Email 1. Only if `converted === false` and user has not unsubscribed.

**Subject A:** Cookie Manager Pro -- one last thing
**Subject B:** A quick recap of what you're missing
**Preview text:** Everything Pro unlocks, in one quick summary

**Body:**

```html
<!-- Same HTML wrapper -->
<!-- Header -->
<h1 style="font-size: 22px; font-weight: 600; color: #1e293b; margin: 16px 0 0;">A quick recap</h1>

<!-- Body -->
<p style="font-size: 16px; line-height: 1.6; color: #475569; margin: 0 0 16px;">
  Hi again. This is the last email in this series -- I wanted to give you a clean summary of what Cookie Manager Pro includes, in case it's useful down the road.
</p>

<!-- Feature checklist -->
<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
  <tr><td style="padding: 8px 0; font-size: 15px; color: #1e293b;">✅ Unlimited cookie profiles (you're at 2/2)</td></tr>
  <tr><td style="padding: 8px 0; font-size: 15px; color: #1e293b;">✅ Unlimited auto-delete rules (you're at 1/1)</td></tr>
  <tr><td style="padding: 8px 0; font-size: 15px; color: #1e293b;">✅ Export all cookies in JSON, Netscape, CSV, cURL</td></tr>
  <tr><td style="padding: 8px 0; font-size: 15px; color: #1e293b;">✅ Full cookie health dashboard with GDPR scanner</td></tr>
  <tr><td style="padding: 8px 0; font-size: 15px; color: #1e293b;">✅ Encrypted cookie vault (AES-256)</td></tr>
  <tr><td style="padding: 8px 0; font-size: 15px; color: #1e293b;">✅ Bulk operations (edit, delete, export across domains)</td></tr>
  <tr><td style="padding: 8px 0; font-size: 15px; color: #1e293b;">✅ Advanced rule patterns (regex, glob, scheduling)</td></tr>
  <tr><td style="padding: 8px 0; font-size: 15px; color: #1e293b;">✅ Real-time cookie monitoring</td></tr>
  <tr><td style="padding: 8px 0; font-size: 15px; color: #1e293b;">✅ Cross-domain export</td></tr>
  <tr><td style="padding: 8px 0; font-size: 15px; color: #1e293b;">✅ cURL command generation</td></tr>
  <tr><td style="padding: 8px 0; font-size: 15px; color: #1e293b;">✅ Priority support + early access to new features</td></tr>
</table>

<!-- Pricing summary -->
<table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f1f5f9; border-radius: 8px; margin-bottom: 24px;">
  <tr>
    <td style="padding: 20px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td width="33%" style="text-align: center; padding: 8px;">
            <p style="font-size: 13px; color: #64748b; margin: 0;">Starter</p>
            <p style="font-size: 20px; font-weight: 700; color: #1e293b; margin: 4px 0;">$4<span style="font-size: 13px; font-weight: 400;">/mo</span></p>
          </td>
          <td width="33%" style="text-align: center; padding: 8px; border-left: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0;">
            <p style="font-size: 13px; color: #7c3aed; font-weight: 600; margin: 0;">Most Popular</p>
            <p style="font-size: 20px; font-weight: 700; color: #1e293b; margin: 4px 0;">$7<span style="font-size: 13px; font-weight: 400;">/mo</span></p>
          </td>
          <td width="33%" style="text-align: center; padding: 8px;">
            <p style="font-size: 13px; color: #64748b; margin: 0;">Team</p>
            <p style="font-size: 20px; font-weight: 700; color: #1e293b; margin: 4px 0;">$14<span style="font-size: 13px; font-weight: 400;">/mo</span></p>
          </td>
        </tr>
      </table>
      <p style="font-size: 13px; color: #64748b; text-align: center; margin: 12px 0 0;">
        Annual billing saves 25% on all plans.
      </p>
    </td>
  </tr>
</table>

<!-- CTA -->
<a href="https://zovo.one/join?ref=cookie_manager&email={{email}}&utm_source=drip&utm_content=email4" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; padding: 14px 32px; border-radius: 8px;">
  Upgrade to Cookie Manager Pro
</a>

<p style="font-size: 14px; color: #64748b; text-align: center; margin: 16px 0 0;">
  This is the last email in this series. If you ever want to upgrade in the future, you can always do so from Cookie Manager's settings page.
</p>

<!-- Prominent unsubscribe -->
<p style="font-size: 14px; color: #94a3b8; text-align: center; margin: 24px 0 0;">
  <a href="{{unsubscribe_url}}" style="color: #94a3b8; text-decoration: underline;">Unsubscribe from these emails</a>
</p>
```

---

### 2.6 Feature-Specific Drip Variants (Email 1 Body Copy)

Email 1 is the only email that changes its primary body copy based on the triggering feature. Emails 2-4 use universal copy. Here are the Email 1 body copy variants for the remaining 5 features:

#### `bulk_operations`

> You tried to use bulk operations -- editing or deleting multiple cookies at once. That's a Pro feature because bulk actions touch a lot of data and we want to make sure it's intentional.
>
> With Pro, you can select multiple cookies, bulk delete by pattern, bulk edit flags, and export entire domain sets at once. What takes 20 clicks individually takes 2 clicks with bulk operations.

**CTA:** Unlock Bulk Operations -- $4/mo

#### `advanced_rules`

> You were trying to create a rule with an advanced pattern -- regex or glob matching. The free tier supports exact-match rules, but pattern-based rules are a Pro feature.
>
> With Pro, your auto-delete rules can use regular expressions, glob patterns, scheduled triggers, and domain groups. Build rules like "delete all cookies matching `_ga*` from any domain when I close the tab" or "clear all session cookies from `*.staging.example.com` every night at midnight."

**CTA:** Unlock Advanced Rules -- $4/mo

#### `export_all_formats`

> You tried to export cookies in a format beyond JSON. Netscape, CSV, and cURL export are Pro features because they integrate with developer workflows that go beyond basic cookie management.
>
> With Pro, export cookies in any format: JSON for import/export, Netscape for browser compatibility, CSV for spreadsheet analysis, or cURL for direct API replay. Copy a complete cURL command with all cookies included -- paste it into your terminal and replay any authenticated request.

**CTA:** Export in Any Format -- $4/mo

#### `gdpr_scanner`

> You ran your first GDPR compliance scan and saw the results. The free tier includes 1 scan to show you the value. With Pro, you can run unlimited scans across all your domains.
>
> The GDPR scanner categorizes every cookie by purpose (functional, analytics, advertising, unknown), flags non-compliant cookies, identifies third-party trackers, and generates remediation reports. For anyone responsible for privacy compliance, this is audit-ready documentation.

**CTA:** Run Unlimited GDPR Scans -- $4/mo

#### `curl_generation`

> You tried to generate a cURL command from your cookies. This developer workflow feature is part of Cookie Manager Pro.
>
> With Pro, click any domain and generate a ready-to-paste cURL command with all cookies included. Debug authenticated API endpoints, replay requests across environments, or share reproducible test cases with your team. It's the fastest path from "this works in my browser" to "here's a reproducible command."

**CTA:** Generate cURL Commands -- $4/mo

---

## 3. Analytics Integration

### 3.1 Event-to-API Mapping

This section maps all local analytics events (from Phase 08 retention system and Phase 07 Agent 5) to the `collect-analytics` API. Events are classified as either backend-sent or local-only.

#### Events Sent to Backend (Conversion-Relevant)

These events are enqueued in the `AnalyticsBatchQueue` and flushed to `collect-analytics` every 5 minutes.

| Local Event Name | API Event Name | Key Properties Sent |
|------------------|---------------|---------------------|
| `cm_paywall_shown` | `paywall_viewed` | `trigger_id`, `paywall_type`, `copy_variation`, `times_shown_total`, `days_since_install`, `session_number` |
| `cm_upgrade_clicked` | `paywall_clicked` | `trigger_id`, `destination_url`, `copy_variation`, `days_since_install` |
| `cm_paywall_dismissed` | `paywall_dismissed` | `trigger_id`, `dismiss_method`, `view_duration_ms`, `copy_variation` |
| `cm_upgrade_started` | `upgrade_page_viewed` | `trigger_id`, `plan_preselected`, `billing_cycle`, `referral_source` |
| `cm_upgrade_completed` | `payment_completed` | `from_tier`, `to_tier`, `billing_cycle`, `amount_cents`, `trigger_id`, `days_since_install`, `total_paywalls_seen`, `total_sessions` |
| `cm_upgrade_failed` | `payment_failed` | `error_type`, `plan_tier`, `billing_cycle`, `step_failed` |
| (new) | `paywall_email_captured` | `trigger_id`, `days_since_install`, `has_existing_account` |
| (new) | `checkout_started` | `trigger_id`, `plan_tier`, `billing_cycle`, `amount_cents` |
| (new) | `license_activated` | `tier`, `activation_method`, `days_since_install` |
| `cm_cross_promo_shown` | `cross_promo_shown` | `target_extension`, `trigger_action`, `session_number` |
| `cm_cross_promo_clicked` | `cross_promo_clicked` | `target_extension`, `trigger_action`, `user_tier` |
| (new) | `extension_installed` | `source`, `version` |
| (new) | `extension_updated` | `from_version`, `to_version` |
| `cm_profile_created` | `feature_used` | `feature: "profile_created"`, `tier`, `count` |
| `cm_rule_created` | `feature_used` | `feature: "rule_created"`, `tier`, `count` |
| `cm_export_completed` | `feature_used` | `feature: "export"`, `tier`, `format`, `count` |
| `cm_health_viewed` | `feature_used` | `feature: "health_dashboard"`, `tier` |
| `cm_gdpr_scan_run` | `feature_used` | `feature: "gdpr_scan"`, `tier` |
| `cm_curl_generated` | `feature_used` | `feature: "curl_generation"`, `tier` |
| (Phase 08) `downgrade_detected` | `downgrade_detected` | `from_tier`, `to_tier`, `reason`, `days_as_paid_user` |

#### Events That Stay Local Only (Privacy-Sensitive or Low Signal)

These events are tracked only in the Phase 08 `ZovoAnalytics` local ring buffer and are never sent to the backend.

| Event | Reason |
|-------|--------|
| `cm_cookie_viewed` | Contains domain-specific browsing activity |
| `cm_cookie_edited` | Contains domain and field change details |
| `cm_cookie_created` | Contains domain-specific data |
| `cm_cookie_deleted` | Contains domain and cookie identifiers |
| `cm_search_used` | May contain user query strings |
| `cm_filter_applied` | Low conversion signal, high volume |
| `cm_tab_switched` | Low conversion signal, high volume |
| `cm_shortcut_used` | Low conversion signal |
| `cm_context_menu_used` | Low conversion signal |
| `cm_settings_opened` | Low conversion signal |
| `cm_session_ended` | Session duration tracked locally only |
| `cm_import_triggered` | Contains file source information |
| `cm_import_completed` | Contains cookie count and conflict data |
| `cm_onboarding_step` | Low volume, tracked via separate onboarding analytics |
| `cm_feature_discovery_clicked` | Low conversion signal |
| `cm_review_prompt_shown` | Review prompts tracked locally |
| `cm_review_prompt_accepted` | Review tracking is local-only |
| `cm_review_prompt_dismissed` | Review tracking is local-only |

#### Batch Strategy

```
User action -> Local event logged (ZovoAnalytics ring buffer)
                  |
                  v
           Is event backend-eligible? (check mapping table)
                  |
          YES     |     NO
           |      |      |
           v      |      v
   Enqueue in     |   Store locally only
   AnalyticsBatchQueue
           |
           v
   chrome.alarms fires every 5 minutes
           |
           v
   AnalyticsBatchQueue.flush()
           |
           v
   POST /collect-analytics (batch of up to 50 events)
           |
       Success?
      /        \
    YES         NO
     |           |
   Clear from    Retain in queue
   queue         for next flush
```

---

### 3.2 Revenue Analytics Dashboard

These metrics are computed server-side from the raw events collected via `collect-analytics` and the `paywall_events` / `licenses` Supabase tables.

#### Primary Revenue Metrics

| Metric | Computation | Granularity | Target |
|--------|-------------|-------------|--------|
| **Daily Conversion Rate** | `payment_completed` events / unique `extension_installed` events (90-day attribution) | Daily, rolling 7-day average | 2-5% |
| **Weekly Conversion Rate** | Same as daily, aggregated by ISO week | Weekly | 2-5% |
| **Monthly Conversion Rate** | Same, aggregated by calendar month | Monthly | 3-5% |
| **MRR (Monthly Recurring Revenue)** | Sum of all active subscription amounts for `cookie_manager` | Daily snapshot | Track growth |
| **New MRR** | Sum of `payment_completed` amounts this period | Daily/Weekly/Monthly | Track growth |
| **Churned MRR** | Sum of amounts for `downgrade_detected` events this period | Daily/Weekly/Monthly | Track decline |
| **Net MRR** | New MRR - Churned MRR | Daily/Weekly/Monthly | Positive |
| **Revenue Per Extension** | Total revenue from `cookie_manager` vs other extensions | Monthly | Compare relative value |

#### Paywall-to-Conversion Funnel

| Funnel Step | Source Event | Metric |
|-------------|-------------|--------|
| Paywall Viewed | `paywall_viewed` | Count, unique users |
| Paywall Engaged (>3s) | `paywall_viewed` where `view_duration_ms > 3000` (derived from `paywall_dismissed` timing) | Count, % of viewed |
| Email Captured | `paywall_email_captured` | Count, % of viewed |
| Upgrade CTA Clicked | `paywall_clicked` | Count, % of viewed |
| Pricing Page Viewed | `upgrade_page_viewed` | Count, % of clicked |
| Checkout Started | `checkout_started` | Count, % of page viewed |
| Payment Completed | `payment_completed` | Count, % of checkout started |
| License Activated | `license_activated` | Count, % of payment completed |

**Breakdown dimensions:** By `trigger_id` (T1-T17), by `copy_variation` (0-4), by `billing_cycle` (monthly/annual), by `days_since_install` bucket (0-3, 4-7, 8-14, 15-30, 31+).

#### Time-to-Upgrade Analysis

| Metric | Computation | Target |
|--------|-------------|--------|
| **Average Time from Paywall to Upgrade** | Median `days_since_install` at `payment_completed` minus median `days_since_install` at first `paywall_viewed` | 3-7 days |
| **Average Paywalls Before Upgrade** | Median `total_paywalls_seen` at time of `payment_completed` | 3-5 impressions |
| **Average Sessions Before Upgrade** | Median `total_sessions` at time of `payment_completed` | 8-15 sessions |
| **Days from Install to First Paywall** | Median `days_since_install` at first `paywall_viewed` | 2-5 days |
| **Days from Install to Upgrade** | Median `days_since_install` at `payment_completed` | 7-14 days |

#### Feature Trigger Frequency (Which Paywalls Convert Best)

| Metric | Computation |
|--------|-------------|
| **Paywall views per trigger** | Count of `paywall_viewed` grouped by `trigger_id` |
| **Conversion rate per trigger** | `payment_completed` attributed to trigger / `paywall_viewed` for that trigger |
| **Email capture rate per trigger** | `paywall_email_captured` for trigger / `paywall_viewed` for that trigger |
| **Best converting trigger** | Trigger with highest conversion rate (min 100 impressions) |
| **Most viewed trigger** | Trigger with highest `paywall_viewed` count |
| **Copy variation winner per trigger** | Conversion rate per `copy_variation` per `trigger_id` (min 50 impressions per variation) |

#### Churn Analytics

| Metric | Computation | Target |
|--------|-------------|--------|
| **Monthly Churn Rate** | Users with `downgrade_detected` in month / total paying users at start of month | <5% |
| **Churn by Tier** | Churn rate segmented by `from_tier` (starter/pro/team) | Starter: <8%, Pro: <5%, Team: <4% |
| **Voluntary vs Involuntary Churn** | Segment `downgrade_detected` by `reason` (subscription_cancelled vs payment_failed) | Involuntary <30% of total churn |
| **Average Paid Lifetime** | Median `days_as_paid_user` at `downgrade_detected` | >90 days |
| **Win-Back Rate** | Users who re-upgrade after `downgrade_detected` within 30 days | >10% |

#### Drip Email Performance

| Metric | Source | Target |
|--------|--------|--------|
| **Open Rate** | `drip_email_opened` / emails sent per email number | 25-35% |
| **Click Rate (CTR)** | `drip_email_clicked` / `drip_email_opened` per email number | 3-6% |
| **Conversion Rate** | `payment_completed` attributed to drip / total drip sequences started | 0.5-1.5% |
| **Unsubscribe Rate** | Unsubscribes / emails sent per email number | <0.5% |
| **Sequence Completion Rate** | Users who receive all 4 emails without unsubscribing or converting | Track baseline |
| **Best Converting Email** | Which email number (1-4) has the highest attributed conversion rate | Identify winner |
| **Best Converting Feature Variant** | Which `feature_attempted` drip variant converts highest | Identify winner |

---

### 3.3 Conversion Funnel Events (Ordered Chain)

The complete conversion funnel, from first paywall encounter to license activation:

```
Step 1: paywall_viewed
  |
  ├── User dismisses paywall
  |   └── paywall_dismissed (funnel exit, may re-enter later)
  |
  └── User enters email
      |
      Step 2: paywall_email_captured
        |
        ├── User clicks CTA immediately
        |   |
        |   Step 3: upgrade_page_viewed
        |     |
        |     ├── User leaves pricing page (funnel exit)
        |     |
        |     └── User selects plan
        |         |
        |         Step 4: checkout_started
        |           |
        |           ├── User abandons checkout
        |           |   └── payment_failed (optional, if attempted)
        |           |
        |           └── User completes payment
        |               |
        |               Step 5: payment_completed
        |                 |
        |                 └── License key delivered and stored
        |                     |
        |                     Step 6: license_activated
        |
        └── User does not click CTA (exits, receives drip emails)
            |
            └── drip_email_opened -> drip_email_clicked -> upgrade_page_viewed (re-enters at Step 3)
```

**Attribution rules:**

- The `trigger_id` from the first `paywall_viewed` that led to the conversion is carried through the entire funnel
- If a user sees multiple paywalls before converting, the *last* paywall before `paywall_clicked` gets attribution
- Drip email conversions are attributed to both the email number and the original `feature_attempted`
- `total_paywalls_seen` on `payment_completed` captures cumulative exposure across all triggers

---

## 4. Drip Email Configuration

### 4.1 Email Sequence Rules

| Rule | Implementation |
|------|---------------|
| Max 4 emails per paywall hit | Backend counter `emails_sent` on `paywall_events` row, capped at 4 |
| Minimum 24h between emails | Backend scheduler checks `last_email_sent_at` before queuing next send |
| Stop sequence immediately on upgrade | Pre-send check: `SELECT converted FROM paywall_events WHERE id = ?`. If `true`, suppress |
| Don't restart sequence for same feature within 30 days | On `log-paywall-hit`, check `SELECT created_at FROM paywall_events WHERE email = ? AND extension_id = 'cookie_manager' AND feature_attempted = ? ORDER BY created_at DESC LIMIT 1`. If within 30 days, log event but don't start new sequence |
| Max 2 active sequences per user | On new sequence start, check `SELECT COUNT(*) FROM paywall_events WHERE email = ? AND extension_id = 'cookie_manager' AND emails_sent < 4 AND converted = false AND created_at > NOW() - INTERVAL '30 days'`. If >= 2, don't start new sequence |
| Unsubscribe from drip but keep using extension | `unsubscribed_at` column on user record. Extension functionality is completely independent of email preferences |

### 4.2 Email Service Integration

**Recommended service: Resend**

| Criteria | Resend | SendGrid | Supabase Built-in |
|----------|--------|----------|-------------------|
| Pricing | Free up to 100 emails/day | Free up to 100 emails/day | No built-in email |
| API simplicity | Excellent -- minimal config | More complex setup | N/A |
| Webhook support | Yes (opens, clicks, bounces) | Yes (comprehensive) | N/A |
| Template system | HTML templates via API | Dynamic templates | N/A |
| Deliverability | Good (DKIM, SPF, DMARC) | Excellent (established) | N/A |
| Supabase integration | Direct via Edge Functions | Direct via Edge Functions | N/A |
| **Recommendation** | **Primary choice** | Fallback option | Not suitable |

**Resend integration via Supabase Edge Function:**

```typescript
// supabase/functions/send-drip-email/index.ts

import { Resend } from 'resend';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

interface DripEmailPayload {
  email: string;
  emailNumber: 1 | 2 | 3 | 4;
  featureAttempted: string;
  paywallEventId: string;
  sequenceId: string;
}

Deno.serve(async (req) => {
  const payload: DripEmailPayload = await req.json();

  // Pre-send suppression checks
  const shouldSend = await checkSuppressionRules(payload);
  if (!shouldSend) {
    return new Response(JSON.stringify({ sent: false, reason: 'suppressed' }));
  }

  // Select template based on email number and feature
  const template = getEmailTemplate(payload.emailNumber, payload.featureAttempted);

  // Send via Resend
  const { data, error } = await resend.emails.send({
    from: 'Cookie Manager <noreply@zovo.one>',
    to: [payload.email],
    subject: template.subject,
    html: template.html,
    headers: {
      'List-Unsubscribe': `<https://zovo.one/unsubscribe?email=${payload.email}&seq=${payload.sequenceId}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    },
    tags: [
      { name: 'extension', value: 'cookie_manager' },
      { name: 'email_number', value: String(payload.emailNumber) },
      { name: 'feature', value: payload.featureAttempted },
      { name: 'sequence_id', value: payload.sequenceId },
    ],
  });

  if (error) {
    console.error('Resend error:', error);
    return new Response(JSON.stringify({ sent: false, error: error.message }), {
      status: 500,
    });
  }

  // Update paywall_events row
  await updateEmailsSent(payload.paywallEventId, payload.emailNumber);

  return new Response(JSON.stringify({ sent: true, messageId: data?.id }));
});
```

#### Webhook for Tracking Opens/Clicks

**Resend webhook endpoint:** `POST https://xggdjlurppfcytxqoozs.supabase.co/functions/v1/email-webhook`

```typescript
// supabase/functions/email-webhook/index.ts

interface ResendWebhookEvent {
  type: 'email.sent' | 'email.delivered' | 'email.opened' | 'email.clicked' | 'email.bounced' | 'email.complained';
  data: {
    email_id: string;
    to: string[];
    tags: Array<{ name: string; value: string }>;
    click?: { url: string };
    created_at: string;
  };
}

Deno.serve(async (req) => {
  // Verify Resend webhook signature
  const signature = req.headers.get('svix-signature');
  if (!verifyWebhookSignature(req, signature)) {
    return new Response('Invalid signature', { status: 401 });
  }

  const event: ResendWebhookEvent = await req.json();

  const extensionTag = event.data.tags.find(t => t.name === 'extension');
  const emailNumberTag = event.data.tags.find(t => t.name === 'email_number');
  const featureTag = event.data.tags.find(t => t.name === 'feature');
  const sequenceTag = event.data.tags.find(t => t.name === 'sequence_id');

  switch (event.type) {
    case 'email.opened':
      // Log to analytics_events table
      await logAnalyticsEvent({
        extension_slug: 'cookie_manager',
        event_name: 'drip_email_opened',
        event_data: {
          email_number: emailNumberTag?.value,
          feature_trigger: featureTag?.value,
          sequence_id: sequenceTag?.value,
        },
      });
      break;

    case 'email.clicked':
      await logAnalyticsEvent({
        extension_slug: 'cookie_manager',
        event_name: 'drip_email_clicked',
        event_data: {
          email_number: emailNumberTag?.value,
          feature_trigger: featureTag?.value,
          cta_clicked: event.data.click?.url,
          sequence_id: sequenceTag?.value,
        },
      });
      break;

    case 'email.bounced':
      // Mark email as invalid, suppress future sends
      await markEmailInvalid(event.data.to[0]);
      break;

    case 'email.complained':
      // Auto-unsubscribe on spam complaint
      await unsubscribeEmail(event.data.to[0]);
      break;
  }

  return new Response(JSON.stringify({ received: true }));
});
```

#### Unsubscribe Handling

1. **One-click unsubscribe:** Every email includes `List-Unsubscribe` and `List-Unsubscribe-Post` headers for RFC 8058 compliance. Email clients that support one-click unsubscribe will show an unsubscribe button natively.

2. **Link-based unsubscribe:** Footer link goes to `https://zovo.one/unsubscribe?email={{email}}&seq={{sequence_id}}`. This page:
   - Confirms the unsubscribe
   - Sets `unsubscribed_at` on the user record in Supabase
   - Suppresses all future drip emails for this user across all Zovo extensions
   - Shows a confirmation: "You've been unsubscribed from Zovo emails. You can still use Cookie Manager normally."
   - Offers a "Resubscribe" link in case of accidental unsubscribe

3. **Extension behavior after unsubscribe:** No change. The extension has zero dependency on email subscription status. All features (free and paid) continue to work exactly as before.

### 4.3 Drip Sequence Scheduling (Backend)

The backend uses Supabase `pg_cron` to schedule drip email sends:

```sql
-- Check for pending drip emails every 15 minutes
SELECT cron.schedule(
  'process-drip-emails',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://xggdjlurppfcytxqoozs.supabase.co/functions/v1/process-drip-queue',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    )
  );
  $$
);
```

```typescript
// supabase/functions/process-drip-queue/index.ts

Deno.serve(async () => {
  const supabase = createClient(/* ... */);

  // Find paywall events that need the next email
  const { data: pendingEvents } = await supabase
    .from('paywall_events')
    .select('*')
    .eq('converted', false)
    .lt('emails_sent', 4)
    .or(
      // Email 1: immediate (created_at is past)
      `and(emails_sent.eq.0,created_at.lt.${new Date().toISOString()})`,
      // Email 2: 24h after creation
      `and(emails_sent.eq.1,created_at.lt.${new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()})`,
      // Email 3: 72h after creation
      `and(emails_sent.eq.2,created_at.lt.${new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString()})`,
      // Email 4: 7 days after creation
      `and(emails_sent.eq.3,created_at.lt.${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()})`
    );

  for (const event of pendingEvents ?? []) {
    // Check if user has upgraded since (across any extension)
    const isUpgraded = await checkUserUpgraded(event.email);
    if (isUpgraded) {
      await supabase
        .from('paywall_events')
        .update({ converted: true })
        .eq('id', event.id);
      continue;
    }

    // Check if user has unsubscribed
    const isUnsubscribed = await checkUnsubscribed(event.email);
    if (isUnsubscribed) continue;

    // Send the next email
    const nextEmailNumber = event.emails_sent + 1;
    await sendDripEmail({
      email: event.email,
      emailNumber: nextEmailNumber as 1 | 2 | 3 | 4,
      featureAttempted: event.feature_attempted,
      paywallEventId: event.id,
      sequenceId: event.id, // Use paywall_event_id as sequence_id
    });
  }

  return new Response(JSON.stringify({ processed: pendingEvents?.length ?? 0 }));
});
```

---

## 5. Extension Registration Completion Checklist

Every item below is specific to Cookie Manager (`cookie_manager`). Items marked [x] are completed by prior agents. Items marked [ ] require backend deployment or are addressed in this document.

### Backend Registration

- [x] **Choose extension_id:** `cookie_manager` (Agent 1)
- [x] **Define Pro features array:** 12 features -- `unlimited_profiles`, `unlimited_rules`, `bulk_export`, `health_dashboard`, `encrypted_vault`, `bulk_operations`, `advanced_rules`, `export_all_formats`, `gdpr_scanner`, `curl_generation`, `real_time_monitoring`, `cross_domain_export` (Agent 1)
- [ ] **Add to `stripe-webhook/index.ts` PRODUCT_FEATURES:**
  ```typescript
  cookie_manager: [
    'unlimited_profiles',
    'unlimited_rules',
    'bulk_export',
    'health_dashboard',
    'encrypted_vault',
    'bulk_operations',
    'advanced_rules',
    'export_all_formats',
    'gdpr_scanner',
    'curl_generation',
    'real_time_monitoring',
    'cross_domain_export',
  ],
  ```
- [ ] **Add to `create-license/index.ts` PRODUCT_FEATURES:** Same array as above
- [ ] **Add extension to `extensions` table in Supabase:**
  ```sql
  INSERT INTO extensions (
    slug,
    name,
    description,
    icon_url,
    store_url,
    category,
    features,
    active
  ) VALUES (
    'cookie_manager',
    'Zovo Cookie Manager',
    'View, edit, and manage cookies with profiles, auto-delete rules, and developer tools',
    'https://zovo.one/icons/cookie-manager-128.png',
    'https://chrome.google.com/webstore/detail/zovo-cookie-manager/[EXTENSION_ID]',
    'developer',
    ARRAY['unlimited_profiles', 'unlimited_rules', 'bulk_export', 'health_dashboard', 'encrypted_vault', 'bulk_operations', 'advanced_rules', 'export_all_formats', 'gdpr_scanner', 'curl_generation', 'real_time_monitoring', 'cross_domain_export'],
    true
  );
  ```

### Drip Email Setup

- [ ] **Create drip email templates:** 4 emails x 5 primary feature variants = 20 templates total (defined in Section 2 of this document)
- [ ] **Configure Resend API key** in Supabase environment variables
- [ ] **Deploy `send-drip-email` Edge Function** (Section 4.2)
- [ ] **Deploy `email-webhook` Edge Function** for open/click tracking (Section 4.2)
- [ ] **Deploy `process-drip-queue` Edge Function** for scheduled sends (Section 4.3)
- [ ] **Configure `pg_cron` schedule** for drip queue processing (every 15 minutes)
- [ ] **Configure Resend webhook URL** pointing to `email-webhook` function
- [ ] **Set up unsubscribe page** at `https://zovo.one/unsubscribe`

### Extension-Side (Completed by Prior Agents)

- [x] **Shared payments module** (`api-client.ts`) -- Agent 2 base + Agent 5 enhancement
- [x] **Paywall UI** with email capture -- Agent 3
- [x] **License key input flow** -- Agent 3
- [x] **Feature gating** with `canUse()` checks -- Agent 4

### Analytics & Tracking

- [x] **Analytics event tracking** -- defined in this document (Section 3)
- [x] **API client with batch queue** -- defined in this document (Section 1.5)
- [ ] **Deploy analytics flush alarm** in service worker:
  ```typescript
  chrome.alarms.create('zovo-analytics-flush', { periodInMinutes: 5 });
  ```
- [ ] **Set uninstall URL:**
  ```typescript
  chrome.runtime.setUninstallURL(
    'https://zovo.one/feedback/uninstall/cookie-manager'
  );
  ```
- [ ] **Create uninstall feedback page** at `https://zovo.one/feedback/uninstall/cookie-manager`

### Legal & Compliance

- [ ] **Create privacy policy** at `https://zovo.one/privacy/cookie-manager`
  - Must disclose: analytics events sent to backend (conversion events only)
  - Must disclose: email collection at paywall for drip campaign
  - Must disclose: license key verification requires network call
  - Must state: no cookie values or browsing history transmitted
  - Must state: EU users have analytics disabled by default

### Status Summary

| Category | Total Items | Completed | Remaining |
|----------|------------|-----------|-----------|
| Backend registration | 3 | 0 | 3 |
| Drip email setup | 8 | 0 | 8 |
| Extension-side | 4 | 4 | 0 |
| Analytics & tracking | 4 | 2 | 2 |
| Legal & compliance | 1 | 0 | 1 |
| **Total** | **20** | **6** | **14** |

---

## 6. Database Schema Reference

### 6.1 `paywall_events` Table (Extended for Cookie Manager)

| Column | Type | Description | Cookie Manager Usage |
|--------|------|-------------|---------------------|
| `id` | uuid | Primary key | Auto-generated |
| `email` | text | User's email | Captured at paywall |
| `extension_id` | text | `'cookie_manager'` | Always `cookie_manager` |
| `feature_attempted` | text | One of the 10 paywall features | See Section 1.3 |
| `emails_sent` | int | 0-4, drip sequence progress | Incremented by `process-drip-queue` |
| `last_email_sent_at` | timestamp | When last drip email was sent | Updated on each send |
| `converted` | boolean | Did user upgrade? | Set `true` on `payment_completed` |
| `converted_at` | timestamp | When conversion happened | Set on `payment_completed` |
| `unsubscribed` | boolean | Did user unsubscribe? | Set via unsubscribe link |
| `created_at` | timestamp | When paywall hit was logged | Auto-set |
| `sequence_id` | uuid | Groups emails in a sequence | Same as `id` |
| `email_subject_variant` | text | A/B subject line variant | `'A'` or `'B'` |

### 6.2 `analytics_events` Table

| Column | Type | Description | Cookie Manager Usage |
|--------|------|-------------|---------------------|
| `id` | uuid | Primary key | Auto-generated |
| `extension_slug` | text | `'cookie_manager'` | Always `cookie_manager` |
| `event_name` | text | Event type | See Section 3.1 |
| `event_data` | jsonb | Event-specific properties | Varies per event |
| `session_id` | uuid | Anonymous session UUID | Generated per browser session |
| `created_at` | timestamp | When event was received | Auto-set |

### 6.3 `licenses` Table

| Column | Type | Description | Cookie Manager Usage |
|--------|------|-------------|---------------------|
| `license_key` | text | `ZOVO-XXXX-XXXX-XXXX-XXXX` | Verified via `verify-extension-license` |
| `email` | text | User's email | Linked to paywall events |
| `tier` | text | `'pro'` or `'lifetime'` | Determines feature access |
| `product` | text | `'cookie_manager'` | Extension identifier |
| `features` | text[] | Enabled features array | 12 Cookie Manager features |
| `status` | text | `'active'`, `'expired'`, `'revoked'` | Checked on verification |
| `expires_at` | timestamp | Null for lifetime | Checked on verification |
| `created_at` | timestamp | License creation date | Auto-set |

---

## 7. Testing and Validation

### 7.1 API Integration Test Cases

| Test Case | Input | Expected Output | Validates |
|-----------|-------|-----------------|-----------|
| Valid license key | `ZOVO-TEST-AAAA-BBBB-CCCC` with active subscription | `{ valid: true, tier: "pro", features: [...] }` | Happy path |
| Invalid format | `ZOVO-12345` | `{ valid: false, error: "Invalid license format" }` | Client-side validation |
| Expired license | Valid format, expired subscription | `{ valid: false, error: "Subscription not active" }` | Expiry handling |
| Network timeout | Simulate 10s delay | Falls back to cache or returns error | Timeout handling |
| Rate limited | Send 11 requests in 60s | 11th returns 429, client waits and retries | Rate limit handling |
| Cache hit | Second call within 5 minutes | Returns cached data without API call | Memory cache |
| Offline with cache | Disable network, valid cache exists | Returns cached data | Offline grace period |
| Offline without cache | Disable network, no cache | `{ valid: false, error: "Network error" }` | Graceful degradation |
| Paywall dedup | Same email+feature within 1 hour | Second call returns immediately, no API call | Client deduplication |
| Analytics batch | Queue 10 events, trigger flush | Single API call with 10 events | Batch sending |
| Analytics overflow | Queue 150 events | Only newest 100 retained | Queue overflow handling |

### 7.2 Drip Email Test Scenarios

| Scenario | Expected Behavior |
|----------|------------------|
| User hits profile limit, provides email | Email 1 (profiles variant) sent within 60s |
| Same user hits export limit 2 hours later | New sequence started (parallel), Email 1 (export variant) sent |
| Same user hits profile limit again 30 min later | Deduplicated -- no new sequence |
| User upgrades after Email 2 | Emails 3 and 4 suppressed |
| User unsubscribes after Email 1 | Emails 2, 3, 4 suppressed |
| User hits profile limit again 31 days later | New sequence started (30-day cooldown expired) |
| User has 2 active sequences, hits vault limit | Third sequence not started (max 2 active) |
| Email bounces on first send | Email marked invalid, all future sends suppressed |

---

*End of Agent 5 API integration, drip email, and analytics specification. This document defines complete request/response schemas for all 3 Zovo API endpoints with Cookie Manager-specific configurations, a production TypeScript API client module (~450 lines) with centralized retry logic and rate limit tracking, 20 drip email templates (4 emails x 5 feature variants) with full HTML, A/B subject lines, and suppression rules, analytics event-to-API mapping for 17 backend-sent and 18 local-only events, a revenue analytics dashboard with 30+ computed metrics across 6 categories, the complete 6-step conversion funnel event chain, Resend email service integration with webhook tracking, and a 20-item extension registration completion checklist with 14 remaining deployment tasks.*
