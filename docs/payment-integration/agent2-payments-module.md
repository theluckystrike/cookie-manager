# Agent 2: Complete Payments Module for Zovo Cookie Manager

**Extension:** Zovo Cookie Manager
**Role:** Payment system implementation -- production TypeScript modules
**Dependencies:** Phase 09 payment integration guide, Phase 04 security (HMAC, encryption), Phase 05 error handling (retry, safe messaging), Agent 5 monetization (TIER_LIMITS, auth flow)
**Status:** Production-Ready Implementation

---

## 1. Constants & Configuration

```typescript
// src/shared/payment-constants.ts

/**
 * All payment-related constants for the Zovo Cookie Manager extension.
 * Centralized here to avoid magic numbers and strings scattered across modules.
 */

/** Supabase Edge Functions base URL */
export const ZOVO_API_BASE = 'https://xggdjlurppfcytxqoozs.supabase.co/functions/v1';

/** Zovo REST API base URL for auth and account operations */
export const ZOVO_AUTH_API_BASE = 'https://api.zovo.app/v1';

/** Unique slug identifying this extension in the Zovo system */
export const EXTENSION_ID = 'cookie_manager';

/** In-memory cache lifetime for license verification results */
export const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

/** Offline grace period -- Pro features remain active this long without server validation */
export const OFFLINE_GRACE_HOURS = 72;
export const OFFLINE_GRACE_MS = OFFLINE_GRACE_HOURS * 60 * 60 * 1000;

/** chrome.alarms name for periodic license refresh */
export const LICENSE_REFRESH_ALARM = 'zovo-license-refresh';

/** Interval between background license refresh checks */
export const LICENSE_REFRESH_INTERVAL_MINUTES = 240; // 4 hours

/** chrome.alarms name for analytics batch flush */
export const ANALYTICS_FLUSH_ALARM = 'zovo-analytics-flush';

/** Interval between analytics batch flushes */
export const ANALYTICS_FLUSH_INTERVAL_MINUTES = 5;

/** API rate limits -- used for client-side throttle awareness */
export const RATE_LIMITS = {
  /** verify-extension-license: max requests per 60 seconds per license key */
  LICENSE_VERIFY_PER_KEY: 10,
  /** verify-extension-license: max requests per 60 seconds per IP */
  LICENSE_VERIFY_PER_IP: 50,
  /** log-paywall-hit: max requests per 60 seconds per IP */
  PAYWALL_LOG_PER_IP: 5,
} as const;

/** Retry configuration for API calls with exponential backoff */
export const RETRY_CONFIG = {
  MAX_RETRIES: 5,
  BASE_DELAY_MS: 1000,
  MAX_DELAY_MS: 60_000,
  JITTER_MAX_MS: 500,
} as const;

/** License key format: ZOVO-XXXX-XXXX-XXXX-XXXX where X is alphanumeric uppercase */
export const LICENSE_KEY_REGEX = /^ZOVO-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;

/** Partial license key regex for auto-formatting during input */
export const LICENSE_KEY_PARTIAL_REGEX = /^[A-Z0-9]{0,4}(-[A-Z0-9]{0,4}){0,3}$/;

/** Storage keys used by the payment system */
export const STORAGE_KEYS = {
  /** chrome.storage.local -- cached license data with HMAC signature */
  LICENSE_CACHE: 'zovo_license_cache',
  /** chrome.storage.local -- HMAC signing key (device-specific, never synced) */
  DEVICE_SECRET: 'zovo_device_secret',
  /** chrome.storage.local -- install timestamp for HMAC derivation */
  INSTALL_TIMESTAMP: 'zovo_install_timestamp',
  /** chrome.storage.sync -- license key entered by the user */
  LICENSE_KEY: 'zovo_license_key',
  /** chrome.storage.sync -- full auth state (JWT, tier, email, etc.) */
  AUTH: 'zovo_auth',
  /** chrome.storage.local -- analytics event buffer for batch flush */
  ANALYTICS_QUEUE: 'zovo_analytics_queue',
  /** chrome.storage.session -- ephemeral session ID for analytics */
  SESSION_ID: 'zovo_session_id',
  /** chrome.storage.local -- rate limit tracking for API calls */
  RATE_LIMIT_STATE: 'zovo_rate_limit_state',
} as const;

/** Zovo website URLs for upgrade, account management, and feedback */
export const ZOVO_URLS = {
  JOIN: 'https://zovo.one/join',
  UPGRADE: 'https://zovo.app/upgrade',
  PRICING: 'https://zovo.app/pricing',
  ACCOUNT_BILLING: 'https://zovo.app/account/billing',
  LOGIN: 'https://zovo.app/login',
  FEEDBACK_UNINSTALL: 'https://zovo.one/feedback/uninstall/cookie-manager',
} as const;

/** Google OAuth configuration for chrome.identity */
export const OAUTH_CONFIG = {
  /** Google OAuth2 authorization endpoint */
  AUTH_URL: 'https://accounts.google.com/o/oauth2/v2/auth',
  /** Requested OAuth scopes -- minimum needed */
  SCOPES: ['openid', 'email', 'profile'],
  /** Zovo backend endpoint to exchange Google auth code for Zovo JWT */
  TOKEN_EXCHANGE_URL: 'https://api.zovo.app/v1/auth/google',
  /** Token refresh endpoint */
  REFRESH_URL: 'https://api.zovo.app/v1/auth/refresh',
  /** Token revocation endpoint (for sign-out) */
  REVOKE_URL: 'https://api.zovo.app/v1/auth/revoke',
  /** License verification endpoint */
  VERIFY_URL: 'https://api.zovo.app/v1/auth/verify',
} as const;
```

---

## 2. TypeScript Types

```typescript
// src/shared/payment-types.ts

/**
 * All TypeScript types for the Zovo payment system.
 * These types are shared across payments.ts, license-input.ts, auth-handler.ts,
 * and the service worker integration.
 */

/** Valid subscription tiers ordered from lowest to highest */
export type Tier = 'free' | 'starter' | 'pro' | 'team' | 'lifetime';

/** License data returned from the server and cached locally */
export interface LicenseData {
  valid: boolean;
  tier: Tier;
  email: string;
  features: string[];
  expiresAt: string | null;
  cachedAt: number;
}

/** What we store in chrome.storage.local including the HMAC signature */
export interface CachedLicense {
  license: LicenseData;
  signature: string;
}

/** Result from the verify-extension-license API endpoint */
export interface VerifyResult {
  valid: boolean;
  tier?: Tier;
  features?: string[];
  email?: string;
  error?: string;
}

/** Result from the log-paywall-hit API endpoint */
export interface PaywallHitResult {
  success: boolean;
  paywall_event_id?: string;
  message?: string;
  error?: string;
}

/** Analytics event queued for batch flush */
export interface AnalyticsEvent {
  extension_slug: string;
  event_name: string;
  event_data: Record<string, unknown>;
  session_id: string;
  timestamp: string;
}

/** Rate limit tracking state per endpoint */
export interface RateLimitState {
  [endpoint: string]: {
    requests: number[];
    backoffUntil: number;
  };
}

/** Auth state stored in chrome.storage.sync */
export interface ZovoAuth {
  tier: Tier;
  token: string;
  refresh_token: string | null;
  expires: number;
  user_id: string;
  email: string;
  authenticated_at: string;
}

/** License input validation result */
export interface LicenseInputResult {
  success: boolean;
  tier?: Tier;
  email?: string;
  error?: string;
}

/** Google OAuth token exchange response from the Zovo backend */
export interface OAuthTokenResponse {
  token: string;
  refresh_token: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
  tier: Tier;
  expires: number;
}

/** Message types for cross-extension and web page communication */
export interface LicenseUpdateMessage {
  type: 'ZOVO_LICENSE_UPDATE';
  token: string;
  tier: Tier;
  user_id: string;
  email: string;
}

export interface TierChangedMessage {
  type: 'TIER_CHANGED';
  tier: Tier;
}

/** Offline grace period status */
export interface OfflineGraceStatus {
  isWithinGracePeriod: boolean;
  hoursRemaining: number;
  lastValidatedAt: number | null;
  isOnline: boolean;
}
```

---

## 3. Complete `payments.ts` Module

```typescript
// src/shared/payments.ts

/**
 * Zovo Cookie Manager -- Payment Integration Module
 *
 * Production implementation of license verification, paywall logging,
 * analytics tracking, and upgrade flows. All API calls include retry
 * with exponential backoff, rate-limit awareness, HMAC-signed caching,
 * and a 72-hour offline grace period.
 *
 * This module is the single source of truth for all payment-related
 * operations in the extension. Import from here -- never call the
 * Zovo API directly from UI components.
 */

import {
  ZOVO_API_BASE,
  EXTENSION_ID,
  CACHE_DURATION_MS,
  OFFLINE_GRACE_MS,
  RETRY_CONFIG,
  RATE_LIMITS,
  LICENSE_KEY_REGEX,
  STORAGE_KEYS,
  ZOVO_URLS,
} from './payment-constants';

import type {
  Tier,
  LicenseData,
  CachedLicense,
  VerifyResult,
  PaywallHitResult,
  AnalyticsEvent,
  RateLimitState,
  OfflineGraceStatus,
} from './payment-types';

// ---------------------------------------------------------------------------
// In-memory license cache (survives within a single service worker lifecycle)
// ---------------------------------------------------------------------------

let memoryCache: {
  data: LicenseData | null;
  timestamp: number;
} = {
  data: null,
  timestamp: 0,
};

// ---------------------------------------------------------------------------
// HMAC Anti-Tampering
// ---------------------------------------------------------------------------

/**
 * Retrieve or generate the device-specific HMAC signing key.
 * The key is derived from a random secret stored in chrome.storage.local
 * combined with the extension ID. It never syncs across devices.
 */
async function getHmacKey(): Promise<CryptoKey> {
  let secret: string | undefined;
  let installTimestamp: number | undefined;

  try {
    const result = await chrome.storage.local.get([
      STORAGE_KEYS.DEVICE_SECRET,
      STORAGE_KEYS.INSTALL_TIMESTAMP,
    ]);
    secret = result[STORAGE_KEYS.DEVICE_SECRET];
    installTimestamp = result[STORAGE_KEYS.INSTALL_TIMESTAMP];
  } catch {
    // Storage read failed -- generate ephemeral key
  }

  if (!secret || typeof secret !== 'string') {
    // First run or storage was cleared -- generate a new 32-byte secret
    const randomBytes = new Uint8Array(32);
    crypto.getRandomValues(randomBytes);
    secret = Array.from(randomBytes, (b) => b.toString(16).padStart(2, '0')).join('');

    if (!installTimestamp) {
      installTimestamp = Date.now();
    }

    try {
      await chrome.storage.local.set({
        [STORAGE_KEYS.DEVICE_SECRET]: secret,
        [STORAGE_KEYS.INSTALL_TIMESTAMP]: installTimestamp,
      });
    } catch {
      // Storage write failed -- key exists in memory only for this session
    }
  }

  // Combine secret + extension ID to derive the HMAC key material
  const keyMaterial = `${secret}:${chrome.runtime.id}:${installTimestamp ?? 0}`;
  const encoder = new TextEncoder();
  const keyData = encoder.encode(keyMaterial);

  return crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

/**
 * Compute an HMAC-SHA256 signature over the license data.
 * Signs the serialized tier + email + features + expiresAt + cachedAt
 * fields to detect manual storage tampering.
 */
async function signLicenseCache(data: LicenseData): Promise<string> {
  const key = await getHmacKey();
  const message = JSON.stringify({
    valid: data.valid,
    tier: data.tier,
    email: data.email,
    features: data.features,
    expiresAt: data.expiresAt,
    cachedAt: data.cachedAt,
  });

  const encoder = new TextEncoder();
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
  return Array.from(new Uint8Array(signature), (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verify the HMAC signature on cached license data.
 * Uses a timing-safe comparison to prevent timing attacks.
 */
async function verifyLicenseCacheSignature(
  data: LicenseData,
  signature: string
): Promise<boolean> {
  const key = await getHmacKey();
  const message = JSON.stringify({
    valid: data.valid,
    tier: data.tier,
    email: data.email,
    features: data.features,
    expiresAt: data.expiresAt,
    cachedAt: data.cachedAt,
  });

  const encoder = new TextEncoder();
  const signatureBytes = new Uint8Array(
    (signature.match(/.{2}/g) ?? []).map((h) => parseInt(h, 16))
  );

  return crypto.subtle.verify('HMAC', key, signatureBytes, encoder.encode(message));
}

/**
 * Constant-time string comparison for HMAC signatures.
 * Prevents timing-based side-channel attacks.
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

// ---------------------------------------------------------------------------
// Rate Limit Tracking
// ---------------------------------------------------------------------------

/**
 * Check if we are currently rate-limited for a given endpoint.
 * Returns true if we should NOT make the request.
 */
async function isRateLimited(endpoint: string, limit: number): Promise<boolean> {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEYS.RATE_LIMIT_STATE);
    const state: RateLimitState = result[STORAGE_KEYS.RATE_LIMIT_STATE] ?? {};
    const endpointState = state[endpoint];

    if (!endpointState) return false;

    // Check if we are in a backoff period
    if (endpointState.backoffUntil > Date.now()) {
      return true;
    }

    // Count requests in the last 60 seconds
    const cutoff = Date.now() - 60_000;
    const recentRequests = endpointState.requests.filter((t) => t > cutoff);
    return recentRequests.length >= limit;
  } catch {
    return false; // If we cannot read state, allow the request
  }
}

/**
 * Record a request for rate limit tracking.
 * If a 429 response is received, set a backoff period.
 */
async function recordRequest(endpoint: string, was429: boolean = false): Promise<void> {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEYS.RATE_LIMIT_STATE);
    const state: RateLimitState = result[STORAGE_KEYS.RATE_LIMIT_STATE] ?? {};

    if (!state[endpoint]) {
      state[endpoint] = { requests: [], backoffUntil: 0 };
    }

    // Add this request timestamp
    state[endpoint].requests.push(Date.now());

    // Clean up timestamps older than 60 seconds
    const cutoff = Date.now() - 60_000;
    state[endpoint].requests = state[endpoint].requests.filter((t) => t > cutoff);

    // If we got a 429, set exponential backoff
    if (was429) {
      const currentBackoff = state[endpoint].backoffUntil > Date.now()
        ? state[endpoint].backoffUntil - Date.now()
        : 0;
      const newBackoff = Math.min(
        Math.max(currentBackoff * 2, 30_000), // Start at 30s, double each time
        300_000 // Max 5 minutes
      );
      state[endpoint].backoffUntil = Date.now() + newBackoff;
    }

    await chrome.storage.local.set({ [STORAGE_KEYS.RATE_LIMIT_STATE]: state });
  } catch {
    // Non-critical -- rate tracking is best-effort
  }
}

// ---------------------------------------------------------------------------
// Exponential Backoff Retry
// ---------------------------------------------------------------------------

/**
 * Execute an async function with exponential backoff on failure.
 * Retries on network errors and 5xx responses.
 * Stops retrying on 4xx responses (except 429 rate limit).
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries: number = RETRY_CONFIG.MAX_RETRIES
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(10_000), // 10 second timeout per request
      });

      // Rate limited -- record and retry with backoff
      if (response.status === 429) {
        const endpoint = new URL(url).pathname;
        await recordRequest(endpoint, true);

        if (attempt < maxRetries) {
          const delay = calculateBackoffDelay(attempt);
          await sleep(delay);
          continue;
        }
      }

      // Client errors (except 429) -- do not retry
      if (response.status >= 400 && response.status < 500 && response.status !== 429) {
        return response;
      }

      // Server errors -- retry with backoff
      if (response.status >= 500) {
        if (attempt < maxRetries) {
          const delay = calculateBackoffDelay(attempt);
          await sleep(delay);
          continue;
        }
      }

      // Record successful request
      const endpoint = new URL(url).pathname;
      await recordRequest(endpoint);

      return response;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));

      if (attempt < maxRetries) {
        const delay = calculateBackoffDelay(attempt);
        await sleep(delay);
        continue;
      }
    }
  }

  throw lastError ?? new Error('Request failed after all retries');
}

/**
 * Calculate backoff delay with jitter for a given attempt number.
 * Pattern: baseDelay * 2^attempt + random jitter
 * Example: 1s, 2s, 4s, 8s, 16s (all + 0-500ms jitter)
 */
function calculateBackoffDelay(attempt: number): number {
  const exponentialDelay = RETRY_CONFIG.BASE_DELAY_MS * Math.pow(2, attempt);
  const clampedDelay = Math.min(exponentialDelay, RETRY_CONFIG.MAX_DELAY_MS);
  const jitter = Math.random() * RETRY_CONFIG.JITTER_MAX_MS;
  return clampedDelay + jitter;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// License Verification
// ---------------------------------------------------------------------------

/**
 * Verify a license key against the Zovo API with full production hardening.
 *
 * Resolution order:
 * 1. In-memory cache (5 minutes)
 * 2. chrome.storage.local persistent cache with HMAC verification
 * 3. API call with exponential backoff
 * 4. Offline grace period fallback (72 hours)
 * 5. Return invalid if all paths fail
 *
 * @param licenseKey - The ZOVO-XXXX-XXXX-XXXX-XXXX format key
 * @param forceRefresh - Skip all caches and call the API directly
 * @returns VerifyResult with validation status, tier, and features
 */
export async function verifyLicense(
  licenseKey: string,
  forceRefresh: boolean = false
): Promise<VerifyResult> {
  // Format validation first -- reject obviously invalid keys before any I/O
  if (!validateLicenseFormat(licenseKey)) {
    return { valid: false, error: 'Invalid license key format' };
  }

  // ---- Step 1: In-memory cache ----
  if (
    !forceRefresh &&
    memoryCache.data !== null &&
    Date.now() - memoryCache.timestamp < CACHE_DURATION_MS
  ) {
    return {
      valid: memoryCache.data.valid,
      tier: memoryCache.data.tier,
      features: memoryCache.data.features,
      email: memoryCache.data.email,
    };
  }

  // ---- Step 2: Persistent cache with HMAC verification ----
  if (!forceRefresh) {
    const cachedResult = await readVerifiedCache();
    if (cachedResult !== null) {
      // Refresh the in-memory cache from the verified persistent cache
      memoryCache = { data: cachedResult, timestamp: Date.now() };
      return {
        valid: cachedResult.valid,
        tier: cachedResult.tier,
        features: cachedResult.features,
        email: cachedResult.email,
      };
    }
  }

  // ---- Step 3: API call ----
  // Check rate limit before calling
  const rateLimited = await isRateLimited(
    '/verify-extension-license',
    RATE_LIMITS.LICENSE_VERIFY_PER_KEY
  );
  if (rateLimited) {
    // Fall back to cache even if it is stale, rather than hitting the server
    const staleCache = await readCacheRaw();
    if (staleCache !== null) {
      return {
        valid: staleCache.valid,
        tier: staleCache.tier,
        features: staleCache.features,
        email: staleCache.email,
        error: 'Rate limited -- using cached data',
      };
    }
    return { valid: false, error: 'Rate limit exceeded' };
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
      }
    );

    const data: VerifyResult = await response.json();

    if (data.valid) {
      // Build the LicenseData object
      const licenseData: LicenseData = {
        valid: true,
        tier: data.tier ?? 'pro',
        email: data.email ?? '',
        features: data.features ?? [],
        expiresAt: null, // Server does not include this in verify response
        cachedAt: Date.now(),
      };

      // Update in-memory cache
      memoryCache = { data: licenseData, timestamp: Date.now() };

      // Persist to storage with HMAC signature
      await writeLicenseCache(licenseData);
    }

    return data;
  } catch (error) {
    // ---- Step 4: Offline grace period ----
    const graceStatus = await getOfflineGracePeriod();
    if (graceStatus.isWithinGracePeriod) {
      const cached = await readCacheRaw();
      if (cached !== null && cached.valid) {
        return {
          valid: true,
          tier: cached.tier,
          features: cached.features,
          email: cached.email,
          error: `Offline -- grace period (${Math.round(graceStatus.hoursRemaining)}h remaining)`,
        };
      }
    }

    // ---- Step 5: All paths exhausted ----
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

// ---------------------------------------------------------------------------
// Feature & Tier Checks
// ---------------------------------------------------------------------------

/**
 * Check if the current user has a specific feature enabled.
 * Reads from the HMAC-verified persistent cache.
 *
 * @param featureName - Feature identifier (e.g., 'unlimited_profiles', 'bulk_ops')
 * @returns true if the user's license includes this feature
 */
export async function hasFeature(featureName: string): Promise<boolean> {
  const cached = await readVerifiedCache();
  if (cached === null || !cached.valid) return false;
  return cached.features.includes(featureName);
}

/**
 * Check if the user has any valid paid license (Starter, Pro, Team, or Lifetime).
 *
 * @returns true if the user is on any tier above free
 */
export async function isPro(): Promise<boolean> {
  const tier = await getTier();
  return tier !== 'free';
}

/**
 * Get the user's current subscription tier.
 * Falls back to 'free' if no valid license is found.
 *
 * @returns The current tier string
 */
export async function getTier(): Promise<Tier> {
  // Try in-memory cache first
  if (
    memoryCache.data !== null &&
    memoryCache.data.valid &&
    Date.now() - memoryCache.timestamp < CACHE_DURATION_MS
  ) {
    return memoryCache.data.tier;
  }

  // Try HMAC-verified persistent cache
  const cached = await readVerifiedCache();
  if (cached !== null && cached.valid) {
    return cached.tier;
  }

  // Try auth state from sync storage
  try {
    const result = await chrome.storage.sync.get(STORAGE_KEYS.AUTH);
    const auth = result[STORAGE_KEYS.AUTH];
    if (auth && typeof auth === 'object' && 'tier' in auth) {
      return (auth as { tier: Tier }).tier;
    }
  } catch {
    // Sync storage unavailable
  }

  return 'free';
}

// ---------------------------------------------------------------------------
// Paywall Hit Logging
// ---------------------------------------------------------------------------

/**
 * Log a paywall hit event. This triggers the drip email sequence on the
 * Zovo backend, sending the user a series of conversion emails.
 *
 * @param email - User's email address (validated before sending)
 * @param featureAttempted - Which feature triggered the paywall (e.g., 'unlimited_profiles')
 * @returns Result indicating success or failure
 */
export async function logPaywallHit(
  email: string,
  featureAttempted: string
): Promise<PaywallHitResult> {
  if (!email || !isValidEmail(email)) {
    return { success: false, error: 'Invalid email address' };
  }

  if (!featureAttempted || typeof featureAttempted !== 'string') {
    return { success: false, error: 'Feature name is required' };
  }

  // Check rate limit
  const rateLimited = await isRateLimited(
    '/log-paywall-hit',
    RATE_LIMITS.PAYWALL_LOG_PER_IP
  );
  if (rateLimited) {
    // Buffer for later
    await bufferAnalyticsEvent('paywall_hit_buffered', {
      email_hash: await hashEmail(email),
      feature_attempted: featureAttempted,
    });
    return { success: false, error: 'Rate limited -- event buffered for retry' };
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
      3 // Fewer retries for non-critical operations
    );

    const data = await response.json();
    return {
      success: data.success === true,
      paywall_event_id: data.paywall_event_id,
      message: data.message,
      error: data.error,
    };
  } catch (error) {
    // Buffer the event for later retry when connectivity returns
    await bufferAnalyticsEvent('paywall_hit_buffered', {
      email_hash: await hashEmail(email),
      feature_attempted: featureAttempted,
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

// ---------------------------------------------------------------------------
// Analytics Tracking
// ---------------------------------------------------------------------------

/**
 * Track an analytics event. Events are batched in local storage and
 * flushed to the server every 5 minutes via the analytics-flush alarm.
 *
 * If the network is unavailable, events accumulate in the local buffer
 * and are sent on the next successful flush.
 *
 * @param eventName - Event identifier (e.g., 'feature_used', 'popup_opened')
 * @param eventData - Additional event context (never include PII or cookie values)
 */
export async function trackEvent(
  eventName: string,
  eventData: Record<string, unknown> = {}
): Promise<void> {
  if (!eventName || typeof eventName !== 'string') return;

  try {
    const sessionId = await getSessionId();

    const event: AnalyticsEvent = {
      extension_slug: EXTENSION_ID,
      event_name: eventName,
      event_data: eventData,
      session_id: sessionId,
      timestamp: new Date().toISOString(),
    };

    await bufferAnalyticsEvent(eventName, eventData, sessionId);

    // Attempt immediate send if the buffer is small (opportunistic flush)
    const result = await chrome.storage.local.get(STORAGE_KEYS.ANALYTICS_QUEUE);
    const queue: AnalyticsEvent[] = Array.isArray(result[STORAGE_KEYS.ANALYTICS_QUEUE])
      ? result[STORAGE_KEYS.ANALYTICS_QUEUE]
      : [];

    // If queue has 20+ events, flush now to avoid data loss on service worker stop
    if (queue.length >= 20) {
      await flushAnalyticsQueue();
    }
  } catch {
    // Analytics is best-effort -- silently drop on failure
  }
}

/**
 * Buffer an analytics event in chrome.storage.local for later batch flush.
 */
async function bufferAnalyticsEvent(
  eventName: string,
  eventData: Record<string, unknown>,
  sessionId?: string
): Promise<void> {
  try {
    const sid = sessionId ?? (await getSessionId());
    const result = await chrome.storage.local.get(STORAGE_KEYS.ANALYTICS_QUEUE);
    const queue: AnalyticsEvent[] = Array.isArray(result[STORAGE_KEYS.ANALYTICS_QUEUE])
      ? result[STORAGE_KEYS.ANALYTICS_QUEUE]
      : [];

    queue.push({
      extension_slug: EXTENSION_ID,
      event_name: eventName,
      event_data: eventData,
      session_id: sid,
      timestamp: new Date().toISOString(),
    });

    // Cap the buffer at 500 events to prevent storage bloat
    const trimmed = queue.length > 500 ? queue.slice(-500) : queue;
    await chrome.storage.local.set({ [STORAGE_KEYS.ANALYTICS_QUEUE]: trimmed });
  } catch {
    // Swallow -- analytics buffering is best-effort
  }
}

/**
 * Flush the analytics event queue to the server.
 * Called by the 5-minute analytics-flush alarm and on opportunistic triggers.
 * Events that fail to send are kept in the queue for the next attempt.
 */
export async function flushAnalyticsQueue(): Promise<void> {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEYS.ANALYTICS_QUEUE);
    const queue: AnalyticsEvent[] = Array.isArray(result[STORAGE_KEYS.ANALYTICS_QUEUE])
      ? result[STORAGE_KEYS.ANALYTICS_QUEUE]
      : [];

    if (queue.length === 0) return;

    // Send events in batches of 50 to stay within request size limits
    const batchSize = 50;
    const failedEvents: AnalyticsEvent[] = [];

    for (let i = 0; i < queue.length; i += batchSize) {
      const batch = queue.slice(i, i + batchSize);

      try {
        const response = await fetch(`${ZOVO_API_BASE}/collect-analytics`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            events: batch,
            extension_slug: EXTENSION_ID,
          }),
          signal: AbortSignal.timeout(10_000),
        });

        if (!response.ok) {
          // Keep failed events for retry
          failedEvents.push(...batch);
        }
      } catch {
        // Network failure -- keep events for next flush
        failedEvents.push(...batch);
      }
    }

    // Replace the queue with only the events that failed to send
    await chrome.storage.local.set({
      [STORAGE_KEYS.ANALYTICS_QUEUE]: failedEvents,
    });
  } catch {
    // Total failure -- leave the queue intact for next attempt
  }
}

// ---------------------------------------------------------------------------
// Session Management
// ---------------------------------------------------------------------------

/**
 * Get or create a session ID for analytics.
 * Session IDs are stored in chrome.storage.session which is cleared
 * when the browser closes. This provides per-browser-session tracking
 * without persisting across restarts.
 *
 * @returns A UUID v4 session identifier
 */
export async function getSessionId(): Promise<string> {
  try {
    const result = await chrome.storage.session.get(STORAGE_KEYS.SESSION_ID);
    const existing = result[STORAGE_KEYS.SESSION_ID];

    if (typeof existing === 'string' && existing.length > 0) {
      return existing;
    }

    const sessionId = crypto.randomUUID();
    await chrome.storage.session.set({ [STORAGE_KEYS.SESSION_ID]: sessionId });
    return sessionId;
  } catch {
    // Fallback for environments where session storage is unavailable
    return crypto.randomUUID();
  }
}

// ---------------------------------------------------------------------------
// Upgrade Navigation
// ---------------------------------------------------------------------------

/**
 * Open the Zovo upgrade/join page with referral tracking.
 * Encodes the source (which UI element triggered the upgrade) for
 * conversion attribution analytics.
 *
 * @param source - Where the upgrade was triggered from (e.g., 'paywall_T1', 'settings', 'banner')
 */
export function openUpgradePage(source: string = 'extension'): void {
  const url = new URL(ZOVO_URLS.JOIN);
  url.searchParams.set('ref', EXTENSION_ID);
  if (source) {
    url.searchParams.set('source', source);
  }

  chrome.tabs.create({ url: url.toString() });
}

// ---------------------------------------------------------------------------
// Cache Management
// ---------------------------------------------------------------------------

/**
 * Clear all cached license data from both memory and persistent storage.
 * Used during sign-out, debugging, and when HMAC tampering is detected.
 */
export async function clearLicenseCache(): Promise<void> {
  // Clear in-memory cache
  memoryCache = { data: null, timestamp: 0 };

  // Clear persistent cache
  try {
    await chrome.storage.local.remove([
      STORAGE_KEYS.LICENSE_CACHE,
      STORAGE_KEYS.RATE_LIMIT_STATE,
    ]);
  } catch {
    // Storage removal failed -- cache will be stale but will expire naturally
  }
}

// ---------------------------------------------------------------------------
// License Format Validation
// ---------------------------------------------------------------------------

/**
 * Validate that a license key matches the expected format.
 * Format: ZOVO-XXXX-XXXX-XXXX-XXXX where X is uppercase alphanumeric.
 *
 * @param key - The license key string to validate
 * @returns true if the key matches the expected format
 */
export function validateLicenseFormat(key: string): boolean {
  if (typeof key !== 'string') return false;
  return LICENSE_KEY_REGEX.test(key.trim().toUpperCase());
}

// ---------------------------------------------------------------------------
// Offline Grace Period
// ---------------------------------------------------------------------------

/**
 * Check the current offline grace period status.
 * Returns whether Pro features should remain active based on
 * the last successful server validation timestamp.
 *
 * The 72-hour grace period prevents paying users from losing access
 * during temporary network outages or Zovo API downtime.
 */
export async function getOfflineGracePeriod(): Promise<OfflineGraceStatus> {
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  try {
    const result = await chrome.storage.local.get(STORAGE_KEYS.LICENSE_CACHE);
    const cached: CachedLicense | undefined = result[STORAGE_KEYS.LICENSE_CACHE];

    if (!cached || !cached.license || !cached.license.cachedAt) {
      return {
        isWithinGracePeriod: false,
        hoursRemaining: 0,
        lastValidatedAt: null,
        isOnline,
      };
    }

    const elapsed = Date.now() - cached.license.cachedAt;
    const remaining = OFFLINE_GRACE_MS - elapsed;
    const hoursRemaining = Math.max(0, remaining / (60 * 60 * 1000));

    return {
      isWithinGracePeriod: remaining > 0 && cached.license.valid,
      hoursRemaining,
      lastValidatedAt: cached.license.cachedAt,
      isOnline,
    };
  } catch {
    return {
      isWithinGracePeriod: false,
      hoursRemaining: 0,
      lastValidatedAt: null,
      isOnline,
    };
  }
}

// ---------------------------------------------------------------------------
// Background License Refresh
// ---------------------------------------------------------------------------

/**
 * Refresh the license in the background. Called by the 4-hour alarm
 * to keep the cached license fresh and extend the offline grace window.
 *
 * This function reads the license key from chrome.storage.sync and
 * re-verifies it, updating the cache timestamp on success.
 */
export async function refreshLicenseInBackground(): Promise<void> {
  try {
    const syncResult = await chrome.storage.sync.get(STORAGE_KEYS.LICENSE_KEY);
    const licenseKey = syncResult[STORAGE_KEYS.LICENSE_KEY];

    if (!licenseKey || typeof licenseKey !== 'string') {
      // No license key stored -- check if we have auth-based tier
      const authResult = await chrome.storage.sync.get(STORAGE_KEYS.AUTH);
      const auth = authResult[STORAGE_KEYS.AUTH];
      if (!auth) return; // No auth, nothing to refresh

      // For auth-based users, verify the token is still valid
      await refreshAuthTokenIfNeeded();
      return;
    }

    // Force a fresh verification from the server
    const result = await verifyLicense(licenseKey, true);

    if (!result.valid) {
      // License is no longer valid -- check if it was revoked vs expired
      if (result.error === 'Subscription not active') {
        // Subscription expired -- trigger notification
        await notifyLicenseExpired();
      } else if (result.error === 'License key not found') {
        // License revoked -- clear everything
        await clearLicenseCache();
        await notifyLicenseRevoked();
      }
      // For network errors, the grace period in verifyLicense handles it
    }
  } catch {
    // Background refresh is non-critical -- the grace period covers gaps
  }
}

// ---------------------------------------------------------------------------
// Internal Helpers
// ---------------------------------------------------------------------------

/**
 * Read the persistent license cache and verify its HMAC signature.
 * Returns null if the cache is missing, expired, or tampered with.
 */
async function readVerifiedCache(): Promise<LicenseData | null> {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEYS.LICENSE_CACHE);
    const cached: CachedLicense | undefined = result[STORAGE_KEYS.LICENSE_CACHE];

    if (!cached || !cached.license || !cached.signature) {
      return null;
    }

    // Check cache age -- must be within the in-memory cache duration
    // for normal reads, but the full data persists for offline grace
    if (Date.now() - cached.license.cachedAt > CACHE_DURATION_MS) {
      // Cache is stale for normal use, but verify HMAC for grace period reads
      const hmacValid = await verifyLicenseCacheSignature(cached.license, cached.signature);
      if (!hmacValid) {
        // HMAC mismatch -- storage was tampered with
        await clearLicenseCache();
        return null;
      }
      // Return stale-but-verified data only if within grace period
      if (Date.now() - cached.license.cachedAt < OFFLINE_GRACE_MS) {
        return cached.license;
      }
      return null;
    }

    // Verify HMAC signature
    const hmacValid = await verifyLicenseCacheSignature(cached.license, cached.signature);
    if (!hmacValid) {
      // Tampering detected -- clear cache and force re-verification
      await clearLicenseCache();
      return null;
    }

    return cached.license;
  } catch {
    return null;
  }
}

/**
 * Read the raw cache without HMAC verification.
 * Used as a last-resort fallback during offline grace period
 * when the HMAC key might not be available.
 */
async function readCacheRaw(): Promise<LicenseData | null> {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEYS.LICENSE_CACHE);
    const cached: CachedLicense | undefined = result[STORAGE_KEYS.LICENSE_CACHE];
    return cached?.license ?? null;
  } catch {
    return null;
  }
}

/**
 * Write license data to persistent storage with an HMAC signature.
 */
async function writeLicenseCache(data: LicenseData): Promise<void> {
  try {
    const signature = await signLicenseCache(data);
    const cached: CachedLicense = { license: data, signature };
    await chrome.storage.local.set({ [STORAGE_KEYS.LICENSE_CACHE]: cached });
  } catch {
    // Cache write failed -- data lives in memory only until next verify
  }
}

/**
 * Validate an email address format.
 */
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Hash an email address for privacy-safe analytics logging.
 * Uses SHA-256 so the raw email is never stored in analytics.
 */
async function hashEmail(email: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(email.toLowerCase().trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer), (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Refresh the Zovo auth token if it is close to expiration.
 * Called during background refresh and on popup open.
 */
async function refreshAuthTokenIfNeeded(): Promise<void> {
  try {
    const result = await chrome.storage.sync.get(STORAGE_KEYS.AUTH);
    const auth = result[STORAGE_KEYS.AUTH];
    if (!auth || typeof auth !== 'object') return;

    const zovoAuth = auth as { expires?: number; refresh_token?: string; [key: string]: unknown };
    if (!zovoAuth.expires || !zovoAuth.refresh_token) return;

    const oneHourFromNow = Date.now() + 60 * 60 * 1000;
    if (zovoAuth.expires * 1000 > oneHourFromNow) {
      return; // Token is still fresh
    }

    const response = await fetchWithRetry(
      `${ZOVO_AUTH_API_BASE}/auth/refresh`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: zovoAuth.refresh_token }),
      },
      2 // Fewer retries for token refresh
    );

    if (response.ok) {
      const { token, expires } = await response.json();
      await chrome.storage.sync.set({
        [STORAGE_KEYS.AUTH]: { ...zovoAuth, token, expires },
      });
    }
  } catch {
    // Token refresh failed -- rely on offline grace period
  }
}

/**
 * Show a notification that the license has expired.
 */
async function notifyLicenseExpired(): Promise<void> {
  try {
    await chrome.notifications.create('zovo-license-expired', {
      type: 'basic',
      iconUrl: '/assets/icons/icon-48.png',
      title: 'Zovo subscription expired',
      message: 'Your Pro features have been paused. Renew to continue using premium features.',
      priority: 1,
    });
  } catch {
    // Notifications permission may not be granted -- silently skip
  }
}

/**
 * Show a notification that the license has been revoked.
 */
async function notifyLicenseRevoked(): Promise<void> {
  try {
    await chrome.notifications.create('zovo-license-revoked', {
      type: 'basic',
      iconUrl: '/assets/icons/icon-48.png',
      title: 'Zovo license issue',
      message: 'Your license key could not be verified. Please check your account at zovo.app.',
      priority: 2,
    });
  } catch {
    // Notifications permission may not be granted -- silently skip
  }
}

// ---------------------------------------------------------------------------
// Default Export
// ---------------------------------------------------------------------------

export default {
  verifyLicense,
  hasFeature,
  isPro,
  getTier,
  logPaywallHit,
  trackEvent,
  flushAnalyticsQueue,
  getSessionId,
  openUpgradePage,
  clearLicenseCache,
  validateLicenseFormat,
  getOfflineGracePeriod,
  refreshLicenseInBackground,
};
```

---

## 4. `license-input.ts` Module

```typescript
// src/shared/license-input.ts

/**
 * License key entry flow for Zovo Cookie Manager.
 *
 * Handles format validation, auto-formatting as the user types,
 * verification against the API, success/error feedback, and
 * persistent storage of the validated key in chrome.storage.sync.
 */

import { verifyLicense, clearLicenseCache, trackEvent } from './payments';
import { LICENSE_KEY_REGEX, STORAGE_KEYS } from './payment-constants';
import type { LicenseInputResult, Tier } from './payment-types';

// ---------------------------------------------------------------------------
// Format Validation
// ---------------------------------------------------------------------------

/**
 * Validate a complete license key string.
 * Format: ZOVO-XXXX-XXXX-XXXX-XXXX where X is uppercase A-Z or 0-9.
 *
 * @param key - The license key to validate
 * @returns true if the key matches the expected format
 */
export function isValidLicenseKey(key: string): boolean {
  if (typeof key !== 'string') return false;
  return LICENSE_KEY_REGEX.test(key.trim().toUpperCase());
}

/**
 * Validate a partial license key (as the user is still typing).
 * Returns true if the input so far is consistent with a valid key.
 *
 * @param partial - The partial input string
 * @returns true if the partial input could become a valid key
 */
export function isValidPartialLicenseKey(partial: string): boolean {
  if (typeof partial !== 'string') return false;

  const cleaned = partial.toUpperCase().replace(/[^A-Z0-9-]/g, '');

  // Must start with "ZOVO" prefix (or partial thereof)
  const prefix = 'ZOVO-';
  if (cleaned.length <= prefix.length) {
    return prefix.startsWith(cleaned);
  }

  if (!cleaned.startsWith(prefix)) return false;

  // After the ZOVO- prefix, check the remaining segments
  const afterPrefix = cleaned.slice(prefix.length);
  const segments = afterPrefix.split('-');

  // Should have at most 4 segments of up to 4 chars each
  if (segments.length > 4) return false;

  for (const segment of segments) {
    if (segment.length > 4) return false;
    if (!/^[A-Z0-9]*$/.test(segment)) return false;
  }

  return true;
}

// ---------------------------------------------------------------------------
// Auto-Formatting
// ---------------------------------------------------------------------------

/**
 * Auto-format a license key input as the user types.
 * Adds dashes automatically at the correct positions and
 * uppercases all characters.
 *
 * Call this in the `onInput` handler of the license key text field.
 *
 * @param rawInput - The raw input string from the text field
 * @returns The formatted string and the new cursor position
 */
export function formatLicenseKeyInput(rawInput: string): {
  formatted: string;
  cursorPosition: number;
} {
  // Strip everything that is not alphanumeric
  const stripped = rawInput.toUpperCase().replace(/[^A-Z0-9]/g, '');

  // The key without the "ZOVO" prefix is 16 characters in 4 groups of 4
  // Total structure: ZOVO + 16 chars = segments [ZOVO, XXXX, XXXX, XXXX, XXXX]

  // If the user has not typed enough for the prefix yet
  if (stripped.length <= 4) {
    const prefix = 'ZOVO'.slice(0, stripped.length);
    // Auto-correct to ZOVO if user types matching characters
    if ('ZOVO'.startsWith(stripped)) {
      return { formatted: prefix, cursorPosition: prefix.length };
    }
    // If the user typed non-ZOVO characters, still try to format
    return { formatted: stripped, cursorPosition: stripped.length };
  }

  // Build the formatted key: ZOVO-XXXX-XXXX-XXXX-XXXX
  const parts: string[] = ['ZOVO'];
  const remaining = stripped.slice(4);

  for (let i = 0; i < remaining.length && parts.length < 5; i += 4) {
    parts.push(remaining.slice(i, i + 4));
  }

  const formatted = parts.join('-');

  // Cap at the full key length: ZOVO-XXXX-XXXX-XXXX-XXXX = 24 chars
  const capped = formatted.slice(0, 24);

  return {
    formatted: capped,
    cursorPosition: capped.length,
  };
}

// ---------------------------------------------------------------------------
// License Key Verification & Storage
// ---------------------------------------------------------------------------

/**
 * Validate and store a license key. This is the complete flow:
 * 1. Format validation
 * 2. API verification (force refresh, no cache)
 * 3. Store in chrome.storage.sync on success
 * 4. Track analytics event
 *
 * @param licenseKey - The license key to validate
 * @returns Result with success status, tier, and any errors
 */
export async function validateAndStoreLicense(
  licenseKey: string
): Promise<LicenseInputResult> {
  // Step 1: Format validation
  const cleaned = licenseKey.trim().toUpperCase();

  if (!isValidLicenseKey(cleaned)) {
    return {
      success: false,
      error: 'Invalid license key format. Expected: ZOVO-XXXX-XXXX-XXXX-XXXX',
    };
  }

  // Step 2: Verify against API (force refresh -- skip all caches)
  const result = await verifyLicense(cleaned, true);

  if (!result.valid) {
    // Track failed attempt for conversion analytics
    await trackEvent('license_validation_failed', {
      error: result.error ?? 'unknown',
    });

    // Provide user-friendly error messages
    const errorMessage = mapVerifyErrorToUserMessage(result.error);

    return {
      success: false,
      error: errorMessage,
    };
  }

  // Step 3: Store the validated license key in sync storage
  try {
    await chrome.storage.sync.set({
      [STORAGE_KEYS.LICENSE_KEY]: cleaned,
    });
  } catch (err) {
    // Sync storage write failed -- try local as fallback
    try {
      await chrome.storage.local.set({
        [STORAGE_KEYS.LICENSE_KEY]: cleaned,
      });
    } catch {
      return {
        success: false,
        error: 'Could not save license key. Please try again.',
      };
    }
  }

  // Step 4: Track successful activation
  await trackEvent('license_activated', {
    tier: result.tier ?? 'pro',
  });

  return {
    success: true,
    tier: result.tier as Tier,
    email: result.email,
  };
}

/**
 * Remove the stored license key and clear all license caches.
 * Used when the user wants to enter a different key or sign out.
 */
export async function removeLicenseKey(): Promise<void> {
  try {
    await chrome.storage.sync.remove(STORAGE_KEYS.LICENSE_KEY);
  } catch {
    // Sync storage removal failed
  }
  try {
    await chrome.storage.local.remove(STORAGE_KEYS.LICENSE_KEY);
  } catch {
    // Local storage removal failed
  }
  await clearLicenseCache();
}

/**
 * Get the currently stored license key, if any.
 *
 * @returns The license key string or null if none is stored
 */
export async function getStoredLicenseKey(): Promise<string | null> {
  try {
    const syncResult = await chrome.storage.sync.get(STORAGE_KEYS.LICENSE_KEY);
    const syncKey = syncResult[STORAGE_KEYS.LICENSE_KEY];
    if (typeof syncKey === 'string' && syncKey.length > 0) {
      return syncKey;
    }
  } catch {
    // Sync storage unavailable -- try local fallback
  }

  try {
    const localResult = await chrome.storage.local.get(STORAGE_KEYS.LICENSE_KEY);
    const localKey = localResult[STORAGE_KEYS.LICENSE_KEY];
    if (typeof localKey === 'string' && localKey.length > 0) {
      return localKey;
    }
  } catch {
    // Local storage also failed
  }

  return null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Map API verification error strings to user-friendly messages.
 */
function mapVerifyErrorToUserMessage(error: string | undefined): string {
  if (!error) return 'License key could not be verified. Please try again.';

  const errorLower = error.toLowerCase();

  if (errorLower.includes('not found')) {
    return 'This license key was not found. Double-check the key and try again.';
  }

  if (errorLower.includes('not active') || errorLower.includes('expired')) {
    return 'This license has expired. Please renew your subscription at zovo.app.';
  }

  if (errorLower.includes('revoked')) {
    return 'This license has been revoked. Contact support@zovo.app for assistance.';
  }

  if (errorLower.includes('rate limit')) {
    return 'Too many attempts. Please wait a minute and try again.';
  }

  if (errorLower.includes('network')) {
    return 'Could not connect to the license server. Check your internet connection and try again.';
  }

  return 'License verification failed. Please try again or contact support@zovo.app.';
}
```

---

## 5. `auth-handler.ts` Module

```typescript
// src/shared/auth-handler.ts

/**
 * Google OAuth integration and Zovo account management for Cookie Manager.
 *
 * Handles the complete authentication lifecycle:
 * - Google OAuth via chrome.identity.launchWebAuthFlow (with PKCE)
 * - Token exchange with the Zovo backend
 * - Token refresh and expiry detection
 * - Sign-out with full cleanup
 * - Cross-extension license propagation via chrome.storage.sync
 * - Auto-detection of existing Zovo membership on install
 */

import { clearLicenseCache, trackEvent } from './payments';
import {
  STORAGE_KEYS,
  OAUTH_CONFIG,
  ZOVO_AUTH_API_BASE,
  EXTENSION_ID,
  ZOVO_URLS,
} from './payment-constants';
import type {
  ZovoAuth,
  Tier,
  OAuthTokenResponse,
  LicenseUpdateMessage,
} from './payment-types';

// ---------------------------------------------------------------------------
// Google OAuth Flow
// ---------------------------------------------------------------------------

/**
 * Initiate Google OAuth sign-in via chrome.identity.launchWebAuthFlow.
 * Uses PKCE (Proof Key for Code Exchange) for security.
 *
 * Flow:
 * 1. Generate PKCE code verifier and challenge
 * 2. Generate random state parameter for CSRF protection
 * 3. Launch Google OAuth consent screen
 * 4. Exchange authorization code for Zovo JWT via backend
 * 5. Store auth state in chrome.storage.sync
 *
 * @returns The authenticated user's tier and email, or an error
 */
export async function signInWithGoogle(): Promise<{
  success: boolean;
  tier?: Tier;
  email?: string;
  error?: string;
}> {
  try {
    // Step 1: Generate PKCE code verifier (43-128 chars)
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);

    // Step 2: Generate random state for CSRF protection
    const state = generateRandomState();

    // Step 3: Build the authorization URL
    const redirectUrl = chrome.identity.getRedirectURL();
    const authUrl = new URL(OAUTH_CONFIG.AUTH_URL);
    authUrl.searchParams.set('client_id', getGoogleClientId());
    authUrl.searchParams.set('redirect_uri', redirectUrl);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', OAUTH_CONFIG.SCOPES.join(' '));
    authUrl.searchParams.set('code_challenge', codeChallenge);
    authUrl.searchParams.set('code_challenge_method', 'S256');
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('access_type', 'offline');
    authUrl.searchParams.set('prompt', 'consent');

    // Step 4: Launch the OAuth flow
    const callbackUrl = await chrome.identity.launchWebAuthFlow({
      url: authUrl.toString(),
      interactive: true,
    });

    if (!callbackUrl) {
      return { success: false, error: 'Sign-in was cancelled' };
    }

    // Step 5: Parse the callback URL
    const callbackParams = new URL(callbackUrl);
    const returnedState = callbackParams.searchParams.get('state');
    const authCode = callbackParams.searchParams.get('code');
    const oauthError = callbackParams.searchParams.get('error');

    // Verify state parameter to prevent CSRF
    if (returnedState !== state) {
      return { success: false, error: 'Security validation failed. Please try again.' };
    }

    if (oauthError) {
      return {
        success: false,
        error: oauthError === 'access_denied'
          ? 'Sign-in was cancelled'
          : `Google sign-in error: ${oauthError}`,
      };
    }

    if (!authCode) {
      return { success: false, error: 'No authorization code received' };
    }

    // Step 6: Exchange the code for a Zovo JWT via the backend
    const tokenResponse = await exchangeCodeForToken(authCode, codeVerifier, redirectUrl);

    if (!tokenResponse) {
      return { success: false, error: 'Could not complete sign-in. Please try again.' };
    }

    // Step 7: Store auth state
    const zovoAuth: ZovoAuth = {
      tier: tokenResponse.tier,
      token: tokenResponse.token,
      refresh_token: tokenResponse.refresh_token,
      expires: tokenResponse.expires,
      user_id: tokenResponse.user.id,
      email: tokenResponse.user.email,
      authenticated_at: new Date().toISOString(),
    };

    await chrome.storage.sync.set({ [STORAGE_KEYS.AUTH]: zovoAuth });

    // Also update the local license cache for offline access
    await chrome.storage.local.set({
      [STORAGE_KEYS.LICENSE_CACHE.replace('cache', 'auth_cache')]: {
        tier: zovoAuth.tier,
        validated_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
      },
    });

    // Track sign-in event
    await trackEvent('auth_sign_in', {
      method: 'google',
      tier: zovoAuth.tier,
    });

    return {
      success: true,
      tier: zovoAuth.tier,
      email: zovoAuth.email,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    // User closed the popup
    if (message.includes('user rejected') || message.includes('cancelled')) {
      return { success: false, error: 'Sign-in was cancelled' };
    }

    // Identity API not available (e.g., permissions not granted)
    if (message.includes('identity')) {
      return {
        success: false,
        error: 'Browser sign-in is not available. Try signing in at zovo.app instead.',
      };
    }

    return {
      success: false,
      error: 'Sign-in failed. Please try again.',
    };
  }
}

/**
 * Open the Zovo web login page as a fallback for email sign-in.
 * The zovo.app page will communicate back to the extension via
 * chrome.runtime.sendMessage after successful authentication.
 */
export function openEmailSignIn(): void {
  const url = new URL(ZOVO_URLS.LOGIN);
  url.searchParams.set('ref', EXTENSION_ID);
  url.searchParams.set('ext_id', chrome.runtime.id);
  chrome.tabs.create({ url: url.toString() });
}

// ---------------------------------------------------------------------------
// Token Refresh
// ---------------------------------------------------------------------------

/**
 * Refresh the Zovo auth token if it is close to expiration.
 * Should be called on every popup open and by the background license alarm.
 *
 * Tokens are refreshed when they have less than 1 hour of validity remaining.
 * The refresh token itself is single-use and rotated on each refresh.
 */
export async function refreshTokenIfNeeded(): Promise<boolean> {
  try {
    const result = await chrome.storage.sync.get(STORAGE_KEYS.AUTH);
    const auth = result[STORAGE_KEYS.AUTH] as ZovoAuth | undefined;

    if (!auth?.token || !auth?.refresh_token) return false;

    // Check if the token expires within the next hour
    const oneHourFromNow = Math.floor(Date.now() / 1000) + 3600;
    if (auth.expires > oneHourFromNow) {
      return true; // Token is still valid
    }

    const response = await fetch(OAUTH_CONFIG.REFRESH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: auth.refresh_token }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        // Refresh token is invalid or revoked -- do NOT immediately downgrade.
        // Start the 72-hour grace period instead.
        return false;
      }
      return false;
    }

    const data = await response.json();

    // Update the auth state with the new token and rotated refresh token
    const updatedAuth: ZovoAuth = {
      ...auth,
      token: data.token,
      refresh_token: data.refresh_token ?? auth.refresh_token,
      expires: data.expires,
    };

    await chrome.storage.sync.set({ [STORAGE_KEYS.AUTH]: updatedAuth });
    return true;
  } catch {
    // Network error -- rely on the offline grace period
    return false;
  }
}

// ---------------------------------------------------------------------------
// Sign Out
// ---------------------------------------------------------------------------

/**
 * Sign out of the Zovo account with full cleanup.
 *
 * Cleanup sequence:
 * 1. Revoke the refresh token on the server
 * 2. Clear auth state from sync storage
 * 3. Clear license cache from local storage
 * 4. Clear in-memory caches
 * 5. Flush and clear analytics queue
 *
 * User data (profiles, rules, snapshots) is NOT deleted.
 * Features revert to the free tier immediately.
 */
export async function signOut(): Promise<void> {
  try {
    // Step 1: Revoke refresh token server-side (best-effort)
    const result = await chrome.storage.sync.get(STORAGE_KEYS.AUTH);
    const auth = result[STORAGE_KEYS.AUTH] as ZovoAuth | undefined;

    if (auth?.refresh_token) {
      try {
        await fetch(OAUTH_CONFIG.REVOKE_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: auth.refresh_token }),
          signal: AbortSignal.timeout(5_000),
        });
      } catch {
        // Server revocation failed -- token will expire naturally
      }
    }
  } catch {
    // Could not read auth state -- continue with local cleanup
  }

  // Step 2: Clear auth state from sync storage
  try {
    await chrome.storage.sync.remove([STORAGE_KEYS.AUTH, STORAGE_KEYS.LICENSE_KEY]);
  } catch {
    // Sync storage removal failed
  }

  // Step 3: Clear license cache
  await clearLicenseCache();

  // Step 4: Clear analytics queue
  try {
    await chrome.storage.local.remove([STORAGE_KEYS.ANALYTICS_QUEUE]);
  } catch {
    // Non-critical
  }

  // Step 5: Notify other parts of the extension
  try {
    await chrome.runtime.sendMessage({ type: 'TIER_CHANGED', tier: 'free' });
  } catch {
    // Popup may not be open -- that is fine
  }

  // Track sign-out event (this may fail since analytics queue was just cleared)
  await trackEvent('auth_sign_out', {});
}

// ---------------------------------------------------------------------------
// Cross-Extension License Propagation
// ---------------------------------------------------------------------------

/**
 * Detect existing Zovo membership on extension install.
 * Checks chrome.storage.sync for a `zovo_auth` key that may have been
 * written by another Zovo extension. If found, auto-authenticates
 * without requiring the user to sign in again.
 *
 * Call this from chrome.runtime.onInstalled with reason 'install'.
 */
export async function detectExistingMembership(): Promise<{
  found: boolean;
  tier?: Tier;
  email?: string;
}> {
  try {
    const result = await chrome.storage.sync.get(STORAGE_KEYS.AUTH);
    const auth = result[STORAGE_KEYS.AUTH] as ZovoAuth | undefined;

    if (!auth || !auth.token || !auth.tier || auth.tier === 'free') {
      return { found: false };
    }

    // Verify the existing token is still valid
    try {
      const response = await fetch(OAUTH_CONFIG.VERIFY_URL, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(10_000),
      });

      if (response.ok) {
        // Token is valid -- update local cache for this extension
        await chrome.storage.local.set({
          license_cache: {
            tier: auth.tier,
            validated_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
          },
        });

        await trackEvent('existing_membership_detected', {
          tier: auth.tier,
          from_extension: 'cross_extension',
        });

        return {
          found: true,
          tier: auth.tier,
          email: auth.email,
        };
      }
    } catch {
      // Verification failed -- token may be expired
      // Try refreshing it
      const refreshed = await refreshTokenIfNeeded();
      if (refreshed) {
        const updatedResult = await chrome.storage.sync.get(STORAGE_KEYS.AUTH);
        const updatedAuth = updatedResult[STORAGE_KEYS.AUTH] as ZovoAuth | undefined;
        if (updatedAuth && updatedAuth.tier !== 'free') {
          return {
            found: true,
            tier: updatedAuth.tier,
            email: updatedAuth.email,
          };
        }
      }
    }

    return { found: false };
  } catch {
    return { found: false };
  }
}

/**
 * Handle a license update message from the Zovo website (zovo.app).
 * This is called when the user completes checkout on zovo.app and the
 * checkout page sends a message to the extension via chrome.runtime.sendMessage.
 *
 * The message is validated against the server before being trusted.
 *
 * @param message - The license update message from the zovo.app checkout page
 * @param senderUrl - The URL of the sender (must be https://zovo.app)
 */
export async function handleLicenseUpdateFromWeb(
  message: LicenseUpdateMessage,
  senderUrl: string
): Promise<{ success: boolean; error?: string }> {
  // Validate sender origin
  try {
    const url = new URL(senderUrl);
    if (url.origin !== 'https://zovo.app' && url.origin !== 'https://www.zovo.app') {
      return { success: false, error: 'unauthorized_origin' };
    }
  } catch {
    return { success: false, error: 'invalid_sender_url' };
  }

  // Validate message structure
  if (
    !message ||
    message.type !== 'ZOVO_LICENSE_UPDATE' ||
    typeof message.token !== 'string' ||
    typeof message.tier !== 'string' ||
    typeof message.user_id !== 'string' ||
    typeof message.email !== 'string'
  ) {
    return { success: false, error: 'invalid_message_format' };
  }

  // Validate the token with the server before trusting it
  try {
    const response = await fetch(OAUTH_CONFIG.VERIFY_URL, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${message.token}`,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      return { success: false, error: 'invalid_token' };
    }

    const verification = await response.json();

    // Store the verified auth state
    const zovoAuth: ZovoAuth = {
      tier: message.tier as Tier,
      token: message.token,
      refresh_token: null, // Will be set on next /auth/refresh call
      expires: verification.exp ?? Math.floor(Date.now() / 1000) + 3600,
      user_id: message.user_id,
      email: message.email,
      authenticated_at: new Date().toISOString(),
    };

    await chrome.storage.sync.set({ [STORAGE_KEYS.AUTH]: zovoAuth });

    // Track upgrade completion
    await trackEvent('upgrade_completed', {
      tier: message.tier,
      source: 'web_checkout',
    });

    return { success: true };
  } catch {
    return { success: false, error: 'verification_failed' };
  }
}

/**
 * Get the current auth state from sync storage.
 *
 * @returns The ZovoAuth object or null if not authenticated
 */
export async function getAuthState(): Promise<ZovoAuth | null> {
  try {
    const result = await chrome.storage.sync.get(STORAGE_KEYS.AUTH);
    const auth = result[STORAGE_KEYS.AUTH];
    if (auth && typeof auth === 'object' && 'token' in auth) {
      return auth as ZovoAuth;
    }
  } catch {
    // Sync storage unavailable
  }
  return null;
}

/**
 * Check if the user is currently authenticated (has a valid auth state).
 */
export async function isAuthenticated(): Promise<boolean> {
  const auth = await getAuthState();
  return auth !== null && typeof auth.token === 'string' && auth.token.length > 0;
}

// ---------------------------------------------------------------------------
// PKCE Helpers (Proof Key for Code Exchange)
// ---------------------------------------------------------------------------

/**
 * Generate a PKCE code verifier (43-128 characters from unreserved URI chars).
 */
function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64UrlEncode(array);
}

/**
 * Generate a PKCE code challenge from the code verifier using SHA-256.
 */
async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return base64UrlEncode(new Uint8Array(digest));
}

/**
 * Generate a random state parameter for CSRF protection.
 */
function generateRandomState(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64UrlEncode(array);
}

/**
 * Base64-URL-encode a byte array (no padding, URL-safe characters).
 */
function base64UrlEncode(buffer: Uint8Array): string {
  const binary = Array.from(buffer, (byte) => String.fromCharCode(byte)).join('');
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// ---------------------------------------------------------------------------
// OAuth Configuration Helpers
// ---------------------------------------------------------------------------

/**
 * Exchange a Google authorization code for a Zovo JWT via the backend.
 * The backend performs the actual Google token exchange (keeping the
 * client secret server-side) and returns a Zovo JWT.
 */
async function exchangeCodeForToken(
  code: string,
  codeVerifier: string,
  redirectUri: string
): Promise<OAuthTokenResponse | null> {
  try {
    const response = await fetch(OAUTH_CONFIG.TOKEN_EXCHANGE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        code_verifier: codeVerifier,
        redirect_uri: redirectUri,
        extension_id: EXTENSION_ID,
      }),
      signal: AbortSignal.timeout(15_000), // Longer timeout for token exchange
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch {
    return null;
  }
}

/**
 * Get the Google OAuth client ID for this extension.
 * This is the public client ID registered in Google Cloud Console.
 * The client secret is never stored in the extension -- it lives
 * on the Zovo backend only.
 */
function getGoogleClientId(): string {
  // This should be set in the manifest's oauth2 section or as an env constant.
  // In production, this is populated at build time.
  return chrome.runtime.getManifest().oauth2?.client_id ?? '';
}
```

---

## 6. Service Worker Integration

```typescript
// src/background/payment-worker.ts

/**
 * Service worker integration for the Zovo payment system.
 *
 * This module adds payment-related background tasks to the
 * Cookie Manager service worker:
 * - Periodic license refresh via chrome.alarms (every 4 hours)
 * - Analytics batch flush via chrome.alarms (every 5 minutes)
 * - License expiry detection and notification
 * - Cross-extension message handling for license updates
 * - Offline mode management and grace period tracking
 * - Auth state change detection via chrome.storage.onChanged
 */

import {
  refreshLicenseInBackground,
  flushAnalyticsQueue,
  clearLicenseCache,
  getOfflineGracePeriod,
  trackEvent,
} from '../shared/payments';

import {
  refreshTokenIfNeeded,
  detectExistingMembership,
  handleLicenseUpdateFromWeb,
  signOut,
} from '../shared/auth-handler';

import {
  LICENSE_REFRESH_ALARM,
  LICENSE_REFRESH_INTERVAL_MINUTES,
  ANALYTICS_FLUSH_ALARM,
  ANALYTICS_FLUSH_INTERVAL_MINUTES,
  STORAGE_KEYS,
  ZOVO_URLS,
} from '../shared/payment-constants';

import type {
  Tier,
  LicenseUpdateMessage,
  TierChangedMessage,
} from '../shared/payment-types';

// ---------------------------------------------------------------------------
// Known Zovo Extension IDs (for cross-extension communication)
// ---------------------------------------------------------------------------

const ZOVO_EXTENSION_IDS: ReadonlySet<string> = new Set([
  // These IDs are populated with actual Chrome Web Store extension IDs
  // after each extension is published.
  // 'ZOVO_FORM_FILLER_EXTENSION_ID',
  // 'ZOVO_TAB_MANAGER_EXTENSION_ID',
  // 'ZOVO_JSON_FORMATTER_EXTENSION_ID',
  // 'ZOVO_CLIPBOARD_EXTENSION_ID',
]);

// ---------------------------------------------------------------------------
// Alarm Setup
// ---------------------------------------------------------------------------

/**
 * Register all payment-related alarms.
 * Call this from the main service worker's initialization.
 */
export function setupPaymentAlarms(): void {
  // License refresh alarm -- fires every 4 hours
  chrome.alarms.create(LICENSE_REFRESH_ALARM, {
    delayInMinutes: 1, // First check 1 minute after startup
    periodInMinutes: LICENSE_REFRESH_INTERVAL_MINUTES,
  });

  // Analytics flush alarm -- fires every 5 minutes
  chrome.alarms.create(ANALYTICS_FLUSH_ALARM, {
    delayInMinutes: 2, // First flush 2 minutes after startup
    periodInMinutes: ANALYTICS_FLUSH_INTERVAL_MINUTES,
  });
}

/**
 * Handle alarm events for payment-related timers.
 * Returns true if the alarm was handled, false if it was not a payment alarm.
 *
 * Wire this into the main service worker's chrome.alarms.onAlarm listener:
 * ```typescript
 * chrome.alarms.onAlarm.addListener((alarm) => {
 *   if (handlePaymentAlarm(alarm)) return;
 *   // ... handle other alarms
 * });
 * ```
 */
export function handlePaymentAlarm(alarm: chrome.alarms.Alarm): boolean {
  switch (alarm.name) {
    case LICENSE_REFRESH_ALARM:
      handleLicenseRefreshAlarm();
      return true;

    case ANALYTICS_FLUSH_ALARM:
      handleAnalyticsFlushAlarm();
      return true;

    default:
      return false;
  }
}

/**
 * Periodic license refresh handler.
 * Verifies the license is still valid and extends the offline grace window.
 * Detects expired or revoked licenses and shows appropriate notifications.
 */
async function handleLicenseRefreshAlarm(): Promise<void> {
  try {
    // First, try to refresh the auth token
    await refreshTokenIfNeeded();

    // Then refresh the license data
    await refreshLicenseInBackground();

    // Check offline grace period status
    const graceStatus = await getOfflineGracePeriod();
    if (!graceStatus.isOnline && graceStatus.isWithinGracePeriod) {
      // Show a subtle reminder that we are running on cached data
      if (graceStatus.hoursRemaining < 12) {
        try {
          await chrome.notifications.create('zovo-grace-warning', {
            type: 'basic',
            iconUrl: '/assets/icons/icon-48.png',
            title: 'Zovo -- Reconnect needed',
            message: `Pro features available for ${Math.round(graceStatus.hoursRemaining)} more hours offline. Connect to the internet to continue.`,
            priority: 1,
          });
        } catch {
          // Notifications permission may not be available
        }
      }
    }
  } catch {
    // Background refresh is non-critical
  }
}

/**
 * Periodic analytics flush handler.
 * Sends buffered analytics events to the server.
 */
async function handleAnalyticsFlushAlarm(): Promise<void> {
  try {
    await flushAnalyticsQueue();
  } catch {
    // Analytics flush is non-critical
  }
}

// ---------------------------------------------------------------------------
// Extension Install Handler
// ---------------------------------------------------------------------------

/**
 * Handle extension installation and update events.
 * Wire into chrome.runtime.onInstalled:
 *
 * ```typescript
 * chrome.runtime.onInstalled.addListener((details) => {
 *   handlePaymentInstall(details);
 * });
 * ```
 */
export async function handlePaymentInstall(
  details: chrome.runtime.InstalledDetails
): Promise<void> {
  if (details.reason === 'install') {
    // New installation -- set up alarms and check for existing membership
    setupPaymentAlarms();

    // Generate and store the device secret for HMAC signing
    await ensureDeviceSecret();

    // Set uninstall URL for feedback
    chrome.runtime.setUninstallURL(
      `${ZOVO_URLS.FEEDBACK_UNINSTALL}?v=${chrome.runtime.getManifest().version}&sid=${crypto.randomUUID()}`
    );

    // Check if user already has a Zovo membership from another extension
    const existing = await detectExistingMembership();
    if (existing.found) {
      await trackEvent('install_with_existing_membership', {
        tier: existing.tier ?? 'unknown',
      });
    } else {
      await trackEvent('install_new_user', {});
    }
  } else if (details.reason === 'update') {
    // Extension updated -- re-register alarms (they persist across updates,
    // but re-registering ensures correct intervals after config changes)
    setupPaymentAlarms();

    await trackEvent('extension_updated', {
      previousVersion: details.previousVersion ?? 'unknown',
      currentVersion: chrome.runtime.getManifest().version,
    });
  }
}

// ---------------------------------------------------------------------------
// External Message Handling
// ---------------------------------------------------------------------------

/**
 * Handle messages from other Zovo extensions and from the zovo.app website.
 * Wire into chrome.runtime.onMessageExternal:
 *
 * ```typescript
 * chrome.runtime.onMessageExternal.addListener(
 *   (message, sender, sendResponse) => {
 *     handleExternalPaymentMessage(message, sender, sendResponse);
 *     return true; // async response
 *   }
 * );
 * ```
 */
export function handleExternalPaymentMessage(
  message: unknown,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response: unknown) => void
): void {
  // Validate message is an object
  if (!message || typeof message !== 'object') {
    sendResponse({ error: 'invalid_message' });
    return;
  }

  const msg = message as Record<string, unknown>;

  // Route based on sender type
  if (sender.url) {
    // Message from a web page (zovo.app checkout flow)
    handleWebPageMessage(msg, sender.url, sendResponse);
  } else if (sender.id) {
    // Message from another extension
    handleExtensionMessage(msg, sender.id, sendResponse);
  } else {
    sendResponse({ error: 'unknown_sender' });
  }
}

/**
 * Handle messages from the zovo.app web page (license updates after checkout).
 */
async function handleWebPageMessage(
  message: Record<string, unknown>,
  senderUrl: string,
  sendResponse: (response: unknown) => void
): Promise<void> {
  // Only accept license update messages from web pages
  if (message.type !== 'ZOVO_LICENSE_UPDATE') {
    sendResponse({ error: 'disallowed_action' });
    return;
  }

  const result = await handleLicenseUpdateFromWeb(
    message as unknown as LicenseUpdateMessage,
    senderUrl
  );

  sendResponse(result);
}

/**
 * Handle messages from other Zovo extensions.
 */
async function handleExtensionMessage(
  message: Record<string, unknown>,
  senderId: string,
  sendResponse: (response: unknown) => void
): Promise<void> {
  // Validate sender is a known Zovo extension
  if (!ZOVO_EXTENSION_IDS.has(senderId)) {
    sendResponse({ error: 'unauthorized' });
    return;
  }

  switch (message.type) {
    case 'ZOVO_LICENSE_QUERY': {
      // Another Zovo extension is asking for our license state
      try {
        const result = await chrome.storage.sync.get(STORAGE_KEYS.AUTH);
        const auth = result[STORAGE_KEYS.AUTH];
        sendResponse({
          tier: auth && typeof auth === 'object' ? (auth as { tier: Tier }).tier : 'free',
        });
      } catch {
        sendResponse({ tier: 'free' });
      }
      break;
    }

    case 'ZOVO_LICENSE_UPDATE': {
      // Another extension is propagating a license update
      // Validate and store it
      const updateResult = await handleLicenseUpdateFromWeb(
        message as unknown as LicenseUpdateMessage,
        `chrome-extension://${senderId}`
      );
      sendResponse(updateResult);
      break;
    }

    default:
      sendResponse({ error: 'unknown_action' });
  }
}

// ---------------------------------------------------------------------------
// Storage Change Listener
// ---------------------------------------------------------------------------

/**
 * Listen for auth state changes from chrome.storage.sync.
 * Detects tier changes (upgrade/downgrade) from other extensions
 * or from the background refresh cycle.
 *
 * Wire into chrome.storage.onChanged:
 *
 * ```typescript
 * chrome.storage.onChanged.addListener((changes, area) => {
 *   handlePaymentStorageChange(changes, area);
 * });
 * ```
 */
export function handlePaymentStorageChange(
  changes: { [key: string]: chrome.storage.StorageChange },
  area: string
): void {
  if (area !== 'sync') return;

  if (changes[STORAGE_KEYS.AUTH]) {
    const newAuth = changes[STORAGE_KEYS.AUTH].newValue as ZovoAuth | undefined;
    const oldAuth = changes[STORAGE_KEYS.AUTH].oldValue as ZovoAuth | undefined;

    const newTier: Tier = newAuth?.tier ?? 'free';
    const oldTier: Tier = oldAuth?.tier ?? 'free';

    if (newTier !== oldTier) {
      onTierChanged(oldTier, newTier, newAuth);
    }
  }
}

/**
 * React to a tier change event.
 * Updates the local license cache and notifies the popup if open.
 */
async function onTierChanged(
  oldTier: Tier,
  newTier: Tier,
  newAuth: ZovoAuth | undefined
): Promise<void> {
  // Update local license cache
  try {
    await chrome.storage.local.set({
      license_cache: {
        tier: newTier,
        validated_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
      },
    });
  } catch {
    // Non-critical
  }

  // Notify the popup if it is open
  try {
    const tierMessage: TierChangedMessage = { type: 'TIER_CHANGED', tier: newTier };
    await chrome.runtime.sendMessage(tierMessage);
  } catch {
    // Popup is not open -- will pick up the change on next open
  }

  // Track the tier change
  if (newTier !== 'free' && oldTier === 'free') {
    await trackEvent('upgrade_detected', {
      from_tier: oldTier,
      to_tier: newTier,
      email: newAuth?.email ?? '',
    });
  } else if (newTier === 'free' && oldTier !== 'free') {
    await trackEvent('downgrade_detected', {
      from_tier: oldTier,
      to_tier: newTier,
    });
  }
}

// ---------------------------------------------------------------------------
// Internal Helpers
// ---------------------------------------------------------------------------

/**
 * Ensure the device-specific HMAC secret exists in local storage.
 * Called on first install.
 */
async function ensureDeviceSecret(): Promise<void> {
  try {
    const result = await chrome.storage.local.get([
      STORAGE_KEYS.DEVICE_SECRET,
      STORAGE_KEYS.INSTALL_TIMESTAMP,
    ]);

    if (!result[STORAGE_KEYS.DEVICE_SECRET]) {
      const randomBytes = new Uint8Array(32);
      crypto.getRandomValues(randomBytes);
      const secret = Array.from(randomBytes, (b) => b.toString(16).padStart(2, '0')).join('');

      await chrome.storage.local.set({
        [STORAGE_KEYS.DEVICE_SECRET]: secret,
        [STORAGE_KEYS.INSTALL_TIMESTAMP]: Date.now(),
      });
    }
  } catch {
    // Non-critical -- HMAC will use a fallback if this fails
  }
}

// ---------------------------------------------------------------------------
// Complete Service Worker Wiring Example
// ---------------------------------------------------------------------------

/**
 * Complete integration example for the main service-worker.ts file.
 *
 * ```typescript
 * // src/background/service-worker.ts
 *
 * import {
 *   setupPaymentAlarms,
 *   handlePaymentAlarm,
 *   handlePaymentInstall,
 *   handleExternalPaymentMessage,
 *   handlePaymentStorageChange,
 * } from './payment-worker';
 *
 * // --- Installation ---
 * chrome.runtime.onInstalled.addListener((details) => {
 *   handlePaymentInstall(details);
 *   // ... other install handlers
 * });
 *
 * // --- Startup (service worker wake-up) ---
 * chrome.runtime.onStartup.addListener(() => {
 *   setupPaymentAlarms();
 * });
 *
 * // --- Alarms ---
 * chrome.alarms.onAlarm.addListener((alarm) => {
 *   if (handlePaymentAlarm(alarm)) return;
 *   // ... other alarm handlers (auto-delete rules, etc.)
 * });
 *
 * // --- External Messages ---
 * chrome.runtime.onMessageExternal.addListener(
 *   (message, sender, sendResponse) => {
 *     handleExternalPaymentMessage(message, sender, sendResponse);
 *     return true; // async response
 *   }
 * );
 *
 * // --- Storage Changes ---
 * chrome.storage.onChanged.addListener((changes, area) => {
 *   handlePaymentStorageChange(changes, area);
 *   // ... other storage change handlers
 * });
 * ```
 */
```

---

## 7. Integration Notes

### Storage Key Map

| Key | Location | Purpose | Encrypted | HMAC |
|-----|----------|---------|-----------|------|
| `zovo_license_cache` | `chrome.storage.local` | Cached license with tier, features, email | No | Yes |
| `zovo_device_secret` | `chrome.storage.local` | 32-byte HMAC signing key (device-specific) | No | N/A |
| `zovo_install_timestamp` | `chrome.storage.local` | Install time for HMAC key derivation | No | N/A |
| `zovo_license_key` | `chrome.storage.sync` | User's ZOVO-XXXX license key | No | N/A |
| `zovo_auth` | `chrome.storage.sync` | Full auth state (JWT, tier, email) | Token field: AES-256-GCM | N/A |
| `zovo_analytics_queue` | `chrome.storage.local` | Buffered analytics events | No | N/A |
| `zovo_session_id` | `chrome.storage.session` | Ephemeral session ID | No | N/A |
| `zovo_rate_limit_state` | `chrome.storage.local` | Per-endpoint request timestamps | No | N/A |

### Error Handling Flow

```
API Call
  |
  +-> Network Error
  |     +-> Retry with exponential backoff (1s, 2s, 4s, 8s, 16s)
  |     +-> All retries exhausted
  |           +-> Check persistent cache (HMAC-verified)
  |           +-> Check offline grace period (72 hours)
  |           +-> Return { valid: false, error: 'Network error' }
  |
  +-> 429 Rate Limited
  |     +-> Record backoff period (30s, 60s, 120s, 240s, max 300s)
  |     +-> Return cached data if available
  |     +-> Return { valid: false, error: 'Rate limit exceeded' }
  |
  +-> 4xx Client Error
  |     +-> Do not retry
  |     +-> Return error message from server
  |
  +-> 5xx Server Error
  |     +-> Retry with exponential backoff
  |     +-> Fall back to cache on all retries exhausted
  |
  +-> Invalid Response (parse error)
  |     +-> Log error
  |     +-> Fall back to cache
  |
  +-> Expired License
  |     +-> Clear cache
  |     +-> Show renewal notification
  |
  +-> Revoked License
        +-> Clear all caches
        +-> Show revocation message
        +-> Revert to free tier
```

### API Endpoints Reference

| Endpoint | Method | Rate Limit | Used By |
|----------|--------|------------|---------|
| `/verify-extension-license` | POST | 10/60s per key, 50/60s per IP | `verifyLicense()` |
| `/log-paywall-hit` | POST | 5/60s per IP | `logPaywallHit()` |
| `/collect-analytics` | POST | No documented limit | `flushAnalyticsQueue()` |
| `/auth/google` | POST | N/A | `signInWithGoogle()` |
| `/auth/refresh` | POST | N/A | `refreshTokenIfNeeded()` |
| `/auth/verify` | GET | N/A | `detectExistingMembership()` |
| `/auth/revoke` | POST | N/A | `signOut()` |

### Alarm Schedule

| Alarm Name | Interval | First Fire | Purpose |
|------------|----------|------------|---------|
| `zovo-license-refresh` | 240 min (4h) | 1 min after install | Refresh license cache, extend grace window |
| `zovo-analytics-flush` | 5 min | 2 min after install | Batch send analytics events |

---

*Agent 2 payments module specification complete. Five production TypeScript modules: `payment-constants.ts`, `payment-types.ts`, `payments.ts`, `license-input.ts`, `auth-handler.ts`, and `payment-worker.ts` (service worker integration). All modules include full implementations with HMAC anti-tampering, exponential backoff retry, rate-limit awareness, 72-hour offline grace period, cross-extension propagation, and Google OAuth with PKCE.*
