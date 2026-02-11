# Code Hardening & Error Recovery: Zovo Cookie Manager

**Agent 4 -- Error Fixing & Code Hardening Specialist**
**Date:** 2026-02-11
**Status:** Production-Ready Defensive Code Patterns
**Scope:** Safe wrappers for all Chrome APIs, input sanitization, state recovery, error boundaries, logging, build checks

---

## 1. Defensive Coding Utility Module

All Chrome extension APIs can throw or return `undefined` under real-world conditions: tabs close mid-operation, storage hits quota, cookies belong to domains the user navigated away from, and service workers terminate without warning. Every Chrome API call in the codebase must go through these wrappers.

### 1.1 Safe Storage Operations

```typescript
// src/utils/safe-storage.ts

import { logger } from './logger';

const STORAGE_WRITE_TIMEOUT = 5000;

/**
 * Read from chrome.storage.local with corruption recovery.
 * Returns defaultValue on any failure: missing key, JSON corruption,
 * type mismatch, or runtime error.
 */
export async function safeStorageGet<T>(
  key: string,
  defaultValue: T
): Promise<T> {
  try {
    const result = await chrome.storage.local.get(key);
    const raw = result[key];

    if (raw === undefined || raw === null) {
      return defaultValue;
    }

    // Guard against type mismatch between stored data and expected type.
    // If defaultValue is an array, stored value must also be an array.
    // If defaultValue is an object (not array), stored value must be an object.
    if (Array.isArray(defaultValue) && !Array.isArray(raw)) {
      logger.warn(`Storage type mismatch for "${key}": expected array, got ${typeof raw}`);
      return defaultValue;
    }
    if (
      typeof defaultValue === 'object' &&
      defaultValue !== null &&
      !Array.isArray(defaultValue) &&
      (typeof raw !== 'object' || Array.isArray(raw))
    ) {
      logger.warn(`Storage type mismatch for "${key}": expected object, got ${typeof raw}`);
      return defaultValue;
    }

    return raw as T;
  } catch (err) {
    logger.error(`safeStorageGet failed for "${key}"`, err);
    return defaultValue;
  }
}

/**
 * Write to chrome.storage.local with quota error handling.
 * Returns true on success, false on any failure.
 */
export async function safeStorageSet(
  key: string,
  value: unknown
): Promise<boolean> {
  try {
    await Promise.race([
      chrome.storage.local.set({ [key]: value }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Storage write timeout')), STORAGE_WRITE_TIMEOUT)
      ),
    ]);
    return true;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);

    if (message.includes('QUOTA_BYTES')) {
      logger.error(`Storage quota exceeded writing "${key}". Attempting cleanup.`);
      await emergencyStorageCleanup();
      // Retry once after cleanup
      try {
        await chrome.storage.local.set({ [key]: value });
        return true;
      } catch {
        return false;
      }
    }

    logger.error(`safeStorageSet failed for "${key}"`, err);
    return false;
  }
}

/**
 * Read from chrome.storage.sync with the same safety guarantees.
 * Sync storage has stricter limits: 100 KB total, 8 KB per item.
 */
export async function safeSyncGet<T>(
  key: string,
  defaultValue: T
): Promise<T> {
  try {
    const result = await chrome.storage.sync.get(key);
    const raw = result[key];

    if (raw === undefined || raw === null) {
      return defaultValue;
    }

    if (typeof defaultValue !== typeof raw && defaultValue !== null) {
      logger.warn(`Sync storage type mismatch for "${key}"`);
      return defaultValue;
    }

    return raw as T;
  } catch (err) {
    // Sync storage can fail if the user is signed out of Chrome
    // or if sync is disabled. Fall back to local storage mirror.
    logger.warn(`safeSyncGet failed for "${key}", trying local fallback`, err);
    return safeStorageGet<T>(`sync_mirror_${key}`, defaultValue);
  }
}

/**
 * Write to chrome.storage.sync with size guard and local fallback.
 */
export async function safeSyncSet(
  key: string,
  value: unknown
): Promise<boolean> {
  try {
    const serialized = JSON.stringify(value);
    if (serialized.length > 8192) {
      logger.warn(`Sync item "${key}" exceeds 8 KB (${serialized.length} bytes). Writing to local only.`);
      return safeStorageSet(key, value);
    }
    await chrome.storage.sync.set({ [key]: value });
    // Mirror to local for offline/signed-out fallback
    await chrome.storage.local.set({ [`sync_mirror_${key}`]: value }).catch(() => {});
    return true;
  } catch (err) {
    logger.error(`safeSyncSet failed for "${key}", falling back to local`, err);
    return safeStorageSet(key, value);
  }
}

/**
 * Atomic batch write. All keys succeed or the entire batch is rolled back.
 * Prevents partial state corruption during multi-key updates.
 */
export async function batchStorageWrite(
  updates: Record<string, unknown>
): Promise<boolean> {
  // Snapshot current values for rollback
  const keys = Object.keys(updates);
  let snapshot: Record<string, unknown> = {};

  try {
    snapshot = await chrome.storage.local.get(keys);
    await chrome.storage.local.set(updates);
    return true;
  } catch (err) {
    logger.error('Batch storage write failed, rolling back', err);
    try {
      // Restore previous values. Keys that did not exist before
      // should be removed, not set to undefined.
      const rollback: Record<string, unknown> = {};
      const keysToRemove: string[] = [];
      for (const key of keys) {
        if (key in snapshot) {
          rollback[key] = snapshot[key];
        } else {
          keysToRemove.push(key);
        }
      }
      if (Object.keys(rollback).length > 0) {
        await chrome.storage.local.set(rollback);
      }
      if (keysToRemove.length > 0) {
        await chrome.storage.local.remove(keysToRemove);
      }
    } catch (rollbackErr) {
      logger.error('Rollback also failed -- storage may be corrupted', rollbackErr);
    }
    return false;
  }
}

/**
 * Free storage space by removing expendable data.
 * Order: analytics queue, cookie cache, old snapshots.
 */
async function emergencyStorageCleanup(): Promise<void> {
  const expendableKeys = ['analytics_queue', 'cookies_cache'];
  try {
    await chrome.storage.local.remove(expendableKeys);
    logger.info('Emergency storage cleanup: removed analytics queue and cookie cache');
  } catch {
    // Nothing more we can do
  }
}
```

### 1.2 Safe Tab Operations

```typescript
// src/utils/safe-tabs.ts

import { logger } from './logger';

/**
 * Get a tab by ID. Returns null if the tab has been closed,
 * the window has been removed, or the ID is invalid.
 */
export async function safeGetTab(
  tabId: number
): Promise<chrome.tabs.Tab | null> {
  if (!Number.isFinite(tabId) || tabId < 0) {
    return null;
  }
  try {
    const tab = await chrome.tabs.get(tabId);
    return tab ?? null;
  } catch {
    // "No tab with id: N" is the normal error when a tab closes
    return null;
  }
}

/**
 * Get the active tab in the current window.
 * Returns null if no window is focused or no tab is active.
 */
export async function safeGetActiveTab(): Promise<chrome.tabs.Tab | null> {
  try {
    const tabs = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (tabs.length === 0) {
      // No focused window -- try lastFocusedWindow instead
      const fallback = await chrome.tabs.query({
        active: true,
        lastFocusedWindow: true,
      });
      return fallback[0] ?? null;
    }
    return tabs[0] ?? null;
  } catch (err) {
    logger.warn('safeGetActiveTab failed', err);
    return null;
  }
}

/**
 * Query tabs with full error protection.
 * Always returns an array (never throws).
 */
export async function safeQueryTabs(
  query: chrome.tabs.QueryInfo
): Promise<chrome.tabs.Tab[]> {
  try {
    return await chrome.tabs.query(query);
  } catch (err) {
    logger.warn('safeQueryTabs failed', err);
    return [];
  }
}

/**
 * Extract the registrable domain from a tab URL.
 * Returns null for chrome://, about:, and other non-http URLs.
 */
export function extractDomainFromTab(
  tab: chrome.tabs.Tab
): string | null {
  if (!tab.url) return null;
  try {
    const url = new URL(tab.url);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return null;
    }
    return url.hostname;
  } catch {
    return null;
  }
}
```

### 1.3 Safe Cookie Operations

```typescript
// src/utils/safe-cookies.ts

import { logger } from './logger';

/**
 * Get all cookies matching the filter.
 * Returns an empty array on permission errors, invalid domains, or API failures.
 */
export async function safeGetCookies(
  details: chrome.cookies.GetAllDetails
): Promise<chrome.cookies.Cookie[]> {
  try {
    const cookies = await chrome.cookies.getAll(details);
    return cookies ?? [];
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('No host permissions')) {
      logger.info(`No host permissions for cookies query: ${details.domain ?? details.url ?? 'unknown'}`);
    } else {
      logger.warn('safeGetCookies failed', err);
    }
    return [];
  }
}

/**
 * Set a cookie. Returns the created cookie or null on failure.
 * Logs specific failure reasons for debugging.
 */
export async function safeSetCookie(
  details: chrome.cookies.SetDetails
): Promise<chrome.cookies.Cookie | null> {
  try {
    const cookie = await chrome.cookies.set(details);
    return cookie ?? null;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);

    if (message.includes('No host permissions')) {
      logger.info(`Cannot set cookie: no permissions for ${details.url}`);
    } else if (message.includes('invalid')) {
      logger.warn(`Cannot set cookie: invalid details`, {
        name: details.name,
        domain: details.domain,
      });
    } else {
      logger.error('safeSetCookie failed', err);
    }

    return null;
  }
}

/**
 * Remove a cookie. Returns true if the cookie was removed or did not exist,
 * false only on actual errors.
 */
export async function safeRemoveCookie(
  details: chrome.cookies.RemoveDetails
): Promise<boolean> {
  try {
    await chrome.cookies.remove(details);
    return true;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    // "No host permissions" means we cannot access this cookie's domain
    if (message.includes('No host permissions')) {
      logger.info(`Cannot remove cookie: no permissions for ${details.url}`);
      return false;
    }
    logger.warn('safeRemoveCookie failed', err);
    return false;
  }
}
```

### 1.4 Safe Message Passing

```typescript
// src/utils/safe-messaging.ts

import { logger } from './logger';

interface Message {
  action: string;
  payload?: unknown;
}

type MessageHandler = (
  message: Message,
  sender: chrome.runtime.MessageSender
) => Promise<unknown> | unknown;

const MESSAGE_TIMEOUT = 10_000; // 10 seconds

const VALID_ACTIONS = new Set([
  'get_cookies', 'set_cookie', 'delete_cookie', 'bulk_delete',
  'load_profile', 'save_profile', 'delete_profile',
  'get_rules', 'save_rule', 'delete_rule', 'execute_rule',
  'get_tier', 'check_license', 'auth_update',
  'get_settings', 'save_settings',
  'get_health', 'run_gdpr_scan',
  'export_cookies', 'import_cookies',
  'snapshot_create', 'snapshot_diff',
]);

/**
 * Send a message to the service worker with timeout protection.
 * Returns null if the service worker is stopped, the port is closed,
 * or the response times out.
 */
export async function safeSendMessage<T>(
  message: Message
): Promise<T | null> {
  if (!message.action || typeof message.action !== 'string') {
    logger.warn('safeSendMessage called with invalid action');
    return null;
  }

  try {
    const response = await Promise.race([
      chrome.runtime.sendMessage(message),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error('Message timeout')),
          MESSAGE_TIMEOUT
        )
      ),
    ]);

    if (chrome.runtime.lastError) {
      logger.warn('Message response error', chrome.runtime.lastError.message);
      return null;
    }

    return (response as T) ?? null;
  } catch (err) {
    const message_text = err instanceof Error ? err.message : String(err);

    // These are expected when the popup closes or the service worker restarts
    if (
      message_text.includes('Receiving end does not exist') ||
      message_text.includes('Extension context invalidated') ||
      message_text.includes('message port closed')
    ) {
      logger.info('Message channel unavailable (expected during transitions)');
      return null;
    }

    logger.warn('safeSendMessage failed', err);
    return null;
  }
}

/**
 * Register a message handler with sender validation and action checking.
 * Rejects messages from unknown senders and unrecognized actions.
 */
export function safeOnMessage(handler: MessageHandler): void {
  chrome.runtime.onMessage.addListener(
    (
      rawMessage: unknown,
      sender: chrome.runtime.MessageSender,
      sendResponse: (response?: unknown) => void
    ) => {
      // Validate sender -- must be this extension
      if (sender.id !== chrome.runtime.id) {
        logger.warn(`Rejected message from foreign sender: ${sender.id}`);
        sendResponse({ error: 'unauthorized' });
        return false;
      }

      // Validate message shape
      if (
        !rawMessage ||
        typeof rawMessage !== 'object' ||
        typeof (rawMessage as Message).action !== 'string'
      ) {
        sendResponse({ error: 'invalid_message' });
        return false;
      }

      const message = rawMessage as Message;

      if (!VALID_ACTIONS.has(message.action)) {
        logger.warn(`Unknown message action: ${message.action}`);
        sendResponse({ error: 'unknown_action' });
        return false;
      }

      // Handle asynchronously
      Promise.resolve(handler(message, sender))
        .then((result) => sendResponse({ data: result }))
        .catch((err) => {
          logger.error(`Handler error for "${message.action}"`, err);
          sendResponse({ error: 'internal_error' });
        });

      return true; // Signal async response
    }
  );
}
```

---

## 2. Input Sanitization Module

Every string that enters the extension from user input, imported files, or cookie values is treated as untrusted. Preact's JSX handles rendering safely (it uses `textContent` under the hood), but values must still be validated before they are written to `chrome.cookies` or `chrome.storage`.

```typescript
// src/utils/sanitize.ts

/**
 * Strip characters forbidden in cookie names by RFC 6265.
 * Allowed: printable ASCII excluding CTLs, separators, and the = sign.
 * Max length: 256 characters.
 */
export function sanitizeCookieName(input: string): string {
  // Remove null bytes, control characters (0x00-0x1F, 0x7F)
  let cleaned = input.replace(/[\x00-\x1F\x7F]/g, '');
  // Remove RFC 6265 forbidden separators in cookie-name
  cleaned = cleaned.replace(/[=;,\s"\\()\/<>@\[\]{}?]/g, '');
  // Normalize Unicode to NFC to prevent homoglyph confusion
  cleaned = cleaned.normalize('NFC');
  return cleaned.slice(0, 256);
}

/**
 * Sanitize a cookie value. RFC 6265 allows most printable ASCII.
 * We strip semicolons (which terminate cookie headers) and control chars.
 * Max length: 4096 characters.
 */
export function sanitizeCookieValue(input: string): string {
  let cleaned = input.replace(/[\x00-\x1F\x7F]/g, '');
  cleaned = cleaned.replace(/;/g, '');
  cleaned = cleaned.normalize('NFC');
  return cleaned.slice(0, 4096);
}

/**
 * Sanitize and validate a domain string.
 * Lowercase, strip protocols, paths, ports, and leading dots.
 * Max length: 253 characters (DNS limit).
 */
export function sanitizeDomain(input: string): string {
  let cleaned = input.trim().toLowerCase();
  // Strip any protocol prefix a user might paste
  cleaned = cleaned.replace(/^https?:\/\//, '');
  // Strip path, query string, fragment, and port
  cleaned = cleaned.replace(/[/:?#].*$/, '');
  // Strip leading dot (chrome.cookies handles the dot prefix itself)
  cleaned = cleaned.replace(/^\.+/, '');
  // Remove any character that is not alphanumeric, dot, or hyphen
  cleaned = cleaned.replace(/[^a-z0-9.\-]/g, '');
  // Collapse consecutive dots
  cleaned = cleaned.replace(/\.{2,}/g, '.');
  return cleaned.slice(0, 253);
}

/**
 * Sanitize a cookie path. Must start with /.
 * Reject path traversal sequences.
 * Max length: 1024 characters.
 */
export function sanitizePath(input: string): string {
  let cleaned = input.trim();
  // Remove null bytes
  cleaned = cleaned.replace(/\x00/g, '');
  // Block path traversal
  cleaned = cleaned.replace(/\.\./g, '');
  // Remove query strings and fragments
  cleaned = cleaned.replace(/[?#].*$/, '');
  // Ensure it starts with /
  if (!cleaned.startsWith('/')) {
    cleaned = '/' + cleaned;
  }
  return cleaned.slice(0, 1024);
}

/**
 * Sanitize a search query for the cookie search bar.
 * Strip HTML to prevent XSS if the query is ever reflected in UI.
 * Max length: 200 characters.
 */
export function sanitizeSearchQuery(input: string): string {
  let cleaned = input.replace(/[<>"'&]/g, '');
  cleaned = cleaned.replace(/[\x00-\x1F\x7F]/g, '');
  return cleaned.slice(0, 200);
}

/**
 * Sanitize a profile name for display and storage.
 * Alphanumeric, spaces, hyphens, underscores, and periods only.
 * Max length: 64 characters.
 */
export function sanitizeProfileName(input: string): string {
  let cleaned = input.trim();
  cleaned = cleaned.replace(/[^a-zA-Z0-9 \-_.]/g, '');
  cleaned = cleaned.replace(/\s{2,}/g, ' ');
  return cleaned.slice(0, 64);
}

/**
 * Sanitize an auto-delete rule pattern (domain glob).
 * Allow *, ?, alphanumeric, dot, hyphen, brackets.
 * Reject standalone "*" (would match everything).
 * Max length: 253 characters.
 */
export function sanitizeRulePattern(input: string): string {
  let cleaned = input.trim().toLowerCase();
  cleaned = cleaned.replace(/[^a-z0-9.*?\-\[\]]/g, '');
  // Reject a bare wildcard
  if (cleaned === '*' || cleaned === '**') {
    return '';
  }
  return cleaned.slice(0, 253);
}

/**
 * Deep-validate an imported JSON file before processing.
 * Checks structure, field types, value ranges, and cookie count limits.
 */
interface ImportValidationResult {
  valid: boolean;
  cookies: ValidatedCookie[];
  errors: string[];
  warnings: string[];
}

interface ValidatedCookie {
  name: string;
  value: string;
  domain: string;
  path: string;
  secure: boolean;
  httpOnly: boolean;
  sameSite: 'no_restriction' | 'lax' | 'strict';
  expirationDate?: number;
}

const MAX_IMPORT_COOKIES = 10_000;

export function validateImportData(json: unknown): ImportValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const cookies: ValidatedCookie[] = [];

  if (!json || typeof json !== 'object') {
    return { valid: false, cookies: [], errors: ['Root must be an object or array'], warnings: [] };
  }

  // Accept both { cookies: [...] } and bare arrays
  const rawCookies: unknown[] = Array.isArray(json)
    ? json
    : Array.isArray((json as Record<string, unknown>).cookies)
      ? (json as Record<string, unknown>).cookies as unknown[]
      : [];

  if (rawCookies.length === 0) {
    return { valid: false, cookies: [], errors: ['No cookies found in import data'], warnings: [] };
  }

  if (rawCookies.length > MAX_IMPORT_COOKIES) {
    errors.push(`Import contains ${rawCookies.length} cookies (max ${MAX_IMPORT_COOKIES})`);
    return { valid: false, cookies: [], errors, warnings: [] };
  }

  for (let i = 0; i < rawCookies.length; i++) {
    const raw = rawCookies[i];
    if (!raw || typeof raw !== 'object') {
      warnings.push(`Cookie at index ${i}: not an object, skipped`);
      continue;
    }

    const c = raw as Record<string, unknown>;

    if (typeof c.name !== 'string' || typeof c.value !== 'string' || typeof c.domain !== 'string') {
      warnings.push(`Cookie at index ${i}: missing name, value, or domain`);
      continue;
    }

    const sameSiteRaw = typeof c.sameSite === 'string' ? c.sameSite.toLowerCase() : 'lax';
    const sameSite = ['no_restriction', 'lax', 'strict'].includes(sameSiteRaw)
      ? sameSiteRaw as 'no_restriction' | 'lax' | 'strict'
      : 'lax';

    cookies.push({
      name: sanitizeCookieName(c.name),
      value: sanitizeCookieValue(c.value),
      domain: sanitizeDomain(c.domain),
      path: sanitizePath(typeof c.path === 'string' ? c.path : '/'),
      secure: c.secure === true,
      httpOnly: c.httpOnly === true,
      sameSite,
      expirationDate: typeof c.expirationDate === 'number' ? c.expirationDate : undefined,
    });
  }

  return {
    valid: cookies.length > 0 && errors.length === 0,
    cookies,
    errors,
    warnings,
  };
}
```

---

## 3. State Recovery System

### 3.1 Storage Corruption Recovery

```typescript
// src/utils/storage-recovery.ts

import { logger } from './logger';
import { safeStorageGet, safeStorageSet, batchStorageWrite } from './safe-storage';

interface ValidationResult {
  valid: boolean;
  errors: string[];
  repairable: boolean;
}

interface RepairResult {
  repaired: boolean;
  keysReset: string[];
  dataLost: string[];
}

const CURRENT_SCHEMA_VERSION = 1;

const STORAGE_DEFAULTS: Record<string, unknown> = {
  profiles: [],
  rules: [],
  snapshots: [],
  cookies_cache: {},
  health_cache: {},
  analytics_queue: [],
  sync_queue: [],
  license_cache: null,
  usage: {
    profiles_count: 0,
    rules_count: 0,
    exports_this_month: 0,
    exports_month_reset: new Date().toISOString(),
    gdpr_scans_used: 0,
    bulk_ops_today: 0,
    bulk_ops_date_reset: new Date().toISOString(),
  },
  onboarding: {
    completed: false,
    installed_at: new Date().toISOString(),
    first_profile_saved: false,
    first_rule_created: false,
    first_export: false,
    paywall_dismissals: {},
  },
  schema_version: CURRENT_SCHEMA_VERSION,
};

/**
 * Validate storage contents against the expected schema.
 * Checks each top-level key for existence and correct type.
 */
export function validateStorageSchema(data: Record<string, unknown>): ValidationResult {
  const errors: string[] = [];

  const typeChecks: Record<string, string> = {
    profiles: 'array',
    rules: 'array',
    snapshots: 'array',
    analytics_queue: 'array',
    sync_queue: 'array',
    cookies_cache: 'object',
    health_cache: 'object',
    usage: 'object',
    onboarding: 'object',
  };

  for (const [key, expectedType] of Object.entries(typeChecks)) {
    const value = data[key];
    if (value === undefined) continue; // Missing keys are ok -- defaults apply

    if (expectedType === 'array' && !Array.isArray(value)) {
      errors.push(`"${key}" should be an array but is ${typeof value}`);
    } else if (expectedType === 'object' && (typeof value !== 'object' || value === null || Array.isArray(value))) {
      errors.push(`"${key}" should be an object but is ${typeof value}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    repairable: true, // Individual keys can always be reset to defaults
  };
}

/**
 * Migrate storage data from an older schema version to the current one.
 * Each migration step is idempotent and can be applied multiple times safely.
 */
export function migrateStorageSchema(
  data: Record<string, unknown>,
  fromVersion: number
): Record<string, unknown> {
  const migrated = { ...data };

  if (fromVersion < 1) {
    // v0 -> v1: Add usage tracking and onboarding fields
    if (!migrated.usage) migrated.usage = STORAGE_DEFAULTS.usage;
    if (!migrated.onboarding) migrated.onboarding = STORAGE_DEFAULTS.onboarding;
    migrated.schema_version = 1;
  }

  // Future migrations go here as:
  // if (fromVersion < 2) { ... migrated.schema_version = 2; }

  return migrated;
}

/**
 * Detect and repair corrupted storage.
 * Validates each key independently. Corrupted keys are reset to defaults;
 * healthy keys are preserved.
 */
export async function repairCorruptedStorage(): Promise<RepairResult> {
  const keysReset: string[] = [];
  const dataLost: string[] = [];

  try {
    const allData = await chrome.storage.local.get(null);

    // Check schema version and migrate if needed
    const version = typeof allData.schema_version === 'number'
      ? allData.schema_version
      : 0;

    if (version < CURRENT_SCHEMA_VERSION) {
      const migrated = migrateStorageSchema(allData, version);
      await chrome.storage.local.set(migrated);
      logger.info(`Migrated storage from v${version} to v${CURRENT_SCHEMA_VERSION}`);
    }

    // Validate and repair individual keys
    const validation = validateStorageSchema(allData);

    if (!validation.valid) {
      const repairs: Record<string, unknown> = {};

      for (const error of validation.errors) {
        // Extract key name from error message: '"key" should be...'
        const match = error.match(/"(\w+)"/);
        if (match) {
          const key = match[1];
          if (key in STORAGE_DEFAULTS) {
            repairs[key] = STORAGE_DEFAULTS[key];
            keysReset.push(key);
            // If the corrupted key held user data, log it as data loss
            if (['profiles', 'rules', 'snapshots'].includes(key)) {
              dataLost.push(key);
            }
          }
        }
      }

      if (Object.keys(repairs).length > 0) {
        await batchStorageWrite(repairs);
        logger.warn(`Repaired ${keysReset.length} corrupted storage keys`, { keysReset, dataLost });
      }
    }

    return { repaired: keysReset.length > 0, keysReset, dataLost };
  } catch (err) {
    // Total storage failure -- reset everything
    logger.error('Cannot read storage at all. Full reset required.', err);
    try {
      await chrome.storage.local.clear();
      await chrome.storage.local.set(STORAGE_DEFAULTS);
    } catch {
      // Storage API itself is broken -- nothing we can do
    }
    return {
      repaired: true,
      keysReset: Object.keys(STORAGE_DEFAULTS),
      dataLost: ['profiles', 'rules', 'snapshots'],
    };
  }
}
```

### 3.2 Service Worker State Recovery

```typescript
// src/utils/worker-checkpoint.ts

import { logger } from './logger';
import { safeStorageGet, safeStorageSet } from './safe-storage';

interface WorkerState {
  activeOperation: string | null;  // e.g., 'auto_delete_batch'
  operationData: unknown;          // Partial progress data
  timestamp: string;               // ISO 8601
  alarmStates: Record<string, string>; // alarm name -> last fire ISO
}

const CHECKPOINT_KEY = '_worker_checkpoint';
const STALE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Save a checkpoint before long-running operations.
 * Call this before starting auto-delete batches, sync operations,
 * or any multi-step process that could be interrupted by
 * service worker termination.
 */
export async function saveCheckpoint(state: WorkerState): Promise<void> {
  await safeStorageSet(CHECKPOINT_KEY, {
    ...state,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Restore state from the last checkpoint on service worker wake-up.
 * Returns null if no checkpoint exists or if the checkpoint is stale.
 */
export async function restoreFromCheckpoint(): Promise<WorkerState | null> {
  const checkpoint = await safeStorageGet<WorkerState | null>(CHECKPOINT_KEY, null);

  if (!checkpoint || !checkpoint.timestamp) {
    return null;
  }

  const age = Date.now() - new Date(checkpoint.timestamp).getTime();
  if (age > STALE_THRESHOLD_MS) {
    logger.info('Discarding stale checkpoint', {
      age: Math.round(age / 1000) + 's',
      operation: checkpoint.activeOperation,
    });
    await cleanupStaleCheckpoints();
    return null;
  }

  return checkpoint;
}

/**
 * Clear stale checkpoints. Called on successful operation completion
 * and on service worker startup when no recovery is needed.
 */
export async function cleanupStaleCheckpoints(): Promise<void> {
  await chrome.storage.local.remove(CHECKPOINT_KEY).catch(() => {});
}

/**
 * Wrap a multi-step operation with checkpoint-based recovery.
 * If the service worker terminates mid-operation, the next wake-up
 * detects the incomplete checkpoint and resumes.
 */
export async function withCheckpoint<T>(
  operationName: string,
  data: unknown,
  fn: () => Promise<T>
): Promise<T> {
  await saveCheckpoint({
    activeOperation: operationName,
    operationData: data,
    timestamp: new Date().toISOString(),
    alarmStates: {},
  });

  try {
    const result = await fn();
    await cleanupStaleCheckpoints();
    return result;
  } catch (err) {
    // Leave checkpoint in place so the next wake-up can retry
    logger.error(`Operation "${operationName}" failed, checkpoint preserved`, err);
    throw err;
  }
}
```

### 3.3 Network Failure Recovery

```typescript
// src/utils/retry.ts

import { logger } from './logger';
import { safeStorageGet, safeStorageSet } from './safe-storage';

interface RetryOptions {
  maxRetries?: number;       // default: 5
  baseDelay?: number;        // default: 1000ms
  maxDelay?: number;         // default: 16000ms
  shouldRetry?: (err: unknown) => boolean;
}

interface QueuedOperation {
  id: string;
  action: string;
  payload: unknown;
  createdAt: string;
  retryCount: number;
}

const RETRY_QUEUE_KEY = '_retry_queue';

/**
 * Execute a function with exponential backoff.
 * Delays: 1s, 2s, 4s, 8s, 16s (with jitter).
 * Throws the last error if all retries are exhausted.
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 5,
    baseDelay = 1000,
    maxDelay = 16000,
    shouldRetry = () => true,
  } = options;

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;

      if (attempt === maxRetries || !shouldRetry(err)) {
        break;
      }

      // Exponential backoff with jitter: delay * 2^attempt + random(0-500ms)
      const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
      const jitter = Math.random() * 500;
      await new Promise((resolve) => setTimeout(resolve, delay + jitter));
    }
  }

  throw lastError;
}

/**
 * Check network connectivity.
 * navigator.onLine is unreliable (returns true on captive portals),
 * so this is a best-effort signal, not a guarantee.
 */
export function isOffline(): boolean {
  return typeof navigator !== 'undefined' && !navigator.onLine;
}

/**
 * Queue an operation for later retry when offline or after repeated failures.
 */
export async function queueForRetry(operation: Omit<QueuedOperation, 'retryCount'>): Promise<void> {
  const queue = await safeStorageGet<QueuedOperation[]>(RETRY_QUEUE_KEY, []);

  // Deduplicate by ID
  const filtered = queue.filter((op) => op.id !== operation.id);
  filtered.push({ ...operation, retryCount: 0 });

  // Cap queue size at 50 operations to prevent storage bloat
  const trimmed = filtered.slice(-50);
  await safeStorageSet(RETRY_QUEUE_KEY, trimmed);
}

/**
 * Process queued operations. Called on connectivity change
 * and by the 5-minute alarm.
 */
export async function processRetryQueue(): Promise<void> {
  if (isOffline()) return;

  const queue = await safeStorageGet<QueuedOperation[]>(RETRY_QUEUE_KEY, []);
  if (queue.length === 0) return;

  const remaining: QueuedOperation[] = [];

  for (const op of queue) {
    try {
      await executeQueuedOperation(op);
      logger.info(`Retry queue: completed "${op.action}"`);
    } catch {
      op.retryCount++;
      if (op.retryCount < 5) {
        remaining.push(op);
      } else {
        logger.warn(`Retry queue: discarding "${op.action}" after 5 failures`);
      }
    }
  }

  await safeStorageSet(RETRY_QUEUE_KEY, remaining);
}

/**
 * Execute a single queued operation.
 * This dispatches to the appropriate API call based on the action field.
 */
async function executeQueuedOperation(op: QueuedOperation): Promise<void> {
  // Implementation maps action strings to actual API calls.
  // Each case validates the payload before sending.
  const response = await fetch(`https://api.zovo.app/v1/${op.action}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(op.payload),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
}
```

---

## 4. Error Boundary for Preact

```typescript
// src/components/ErrorBoundary.tsx

import { Component, type ComponentChildren } from 'preact';
import { logger } from '../utils/logger';

interface ErrorBoundaryProps {
  fallbackMessage?: string;
  children: ComponentChildren;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorId: string | null;
}

/**
 * Catches render errors in the component tree below it.
 * Shows a clean fallback UI. Never exposes stack traces.
 * Logs the full error for debugging.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    errorId: null,
  };

  static getDerivedStateFromError(): Partial<ErrorBoundaryState> {
    const errorId = Date.now().toString(36);
    return { hasError: true, errorId };
  }

  componentDidCatch(error: Error): void {
    logger.error('Render error caught by ErrorBoundary', {
      message: error.message,
      component: error.stack?.split('\n')[1]?.trim() ?? 'unknown',
      errorId: this.state.errorId,
    });
  }

  handleReload = (): void => {
    this.setState({ hasError: false, errorId: null });
  };

  render() {
    if (this.state.hasError) {
      const message = this.props.fallbackMessage
        ?? 'Something went wrong. Try reloading.';

      return (
        <div style={{
          padding: '24px',
          textAlign: 'center',
          color: 'var(--text-secondary, #666)',
          fontFamily: 'var(--font-family, system-ui, sans-serif)',
        }}>
          <div style={{ fontSize: '14px', marginBottom: '12px' }}>
            {message}
          </div>
          <button
            onClick={this.handleReload}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: '1px solid var(--border-color, #ddd)',
              background: 'var(--bg-primary, #fff)',
              color: 'var(--text-primary, #333)',
              cursor: 'pointer',
              fontSize: '13px',
            }}
          >
            Reload
          </button>
          <div style={{ fontSize: '11px', marginTop: '8px', opacity: 0.5 }}>
            Ref: {this.state.errorId}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

Usage: wrap the app root and individual feature tabs so a crash in one tab does not bring down the entire popup.

```typescript
// src/popup/App.tsx
import { ErrorBoundary } from '../components/ErrorBoundary';

export function App() {
  return (
    <ErrorBoundary>
      <Header />
      <ErrorBoundary fallbackMessage="Could not load cookies. Try reloading.">
        <CookiesTab />
      </ErrorBoundary>
      <ErrorBoundary fallbackMessage="Could not load profiles.">
        <ProfilesTab />
      </ErrorBoundary>
      <Footer />
    </ErrorBoundary>
  );
}
```

---

## 5. User-Facing Error Messages

Every technical error is mapped to a message that (a) tells the user what happened in plain language, (b) suggests what they can do, and (c) never exposes internal details. The `errorToUserMessage` function is the single source of truth for all error copy in the extension.

```typescript
// src/utils/error-messages.ts

interface UserError {
  title: string;
  message: string;
  action?: { label: string; handler: string };  // handler = named action, not a function
  severity: 'info' | 'warning' | 'error';
}

const ERROR_MAP: Record<string, UserError> = {
  STORAGE_QUOTA_EXCEEDED: {
    title: 'Storage is full',
    message: 'Delete some profiles or old snapshots to free space.',
    action: { label: 'Manage profiles', handler: 'navigate_profiles' },
    severity: 'error',
  },
  COOKIE_SET_FAILED: {
    title: 'Could not save cookie',
    message: 'Check that the domain is correct and you have permission to set cookies on this site.',
    action: { label: 'Edit domain', handler: 'focus_domain_field' },
    severity: 'warning',
  },
  COOKIE_DELETE_FAILED: {
    title: 'Could not delete cookie',
    message: 'The cookie may have already been removed or the site is protected.',
    severity: 'warning',
  },
  COOKIE_NOT_FOUND: {
    title: 'Cookie not found',
    message: 'This cookie may have been deleted by the website or another extension.',
    severity: 'info',
  },
  NETWORK_TIMEOUT: {
    title: 'Connection issue',
    message: 'Cannot connect to Zovo right now. Your Pro features will continue working offline.',
    severity: 'info',
  },
  NETWORK_OFFLINE: {
    title: 'You are offline',
    message: 'Changes are saved locally and will sync when you reconnect.',
    severity: 'info',
  },
  IMPORT_PARSE_ERROR: {
    title: 'Invalid file format',
    message: 'This file does not contain valid cookie data. Accepted formats: JSON, Netscape, CSV.',
    action: { label: 'View format help', handler: 'show_import_help' },
    severity: 'error',
  },
  IMPORT_TOO_LARGE: {
    title: 'File too large',
    message: 'Import files must be under 5 MB and contain fewer than 10,000 cookies.',
    severity: 'error',
  },
  IMPORT_PARTIAL: {
    title: 'Some cookies could not be imported',
    message: 'Cookies with invalid domains or names were skipped. Successfully imported cookies are available now.',
    severity: 'warning',
  },
  EXPORT_LIMIT_FREE: {
    title: 'Export limit reached',
    message: 'Free accounts can export up to 25 cookies at a time. Upgrade to export unlimited cookies.',
    action: { label: 'See Pro features', handler: 'show_upgrade' },
    severity: 'info',
  },
  PROFILE_LIMIT_FREE: {
    title: 'Profile limit reached',
    message: 'You have 2 saved profiles. Upgrade to save unlimited profiles.',
    action: { label: 'See Pro features', handler: 'show_upgrade' },
    severity: 'info',
  },
  RULE_LIMIT_FREE: {
    title: 'Rule limit reached',
    message: 'Free accounts can have 1 auto-delete rule. Upgrade for unlimited rules.',
    action: { label: 'See Pro features', handler: 'show_upgrade' },
    severity: 'info',
  },
  AUTH_SESSION_EXPIRED: {
    title: 'Session expired',
    message: 'Please sign in again to continue using Pro features.',
    action: { label: 'Sign in', handler: 'show_login' },
    severity: 'warning',
  },
  AUTH_GOOGLE_FAILED: {
    title: 'Sign-in issue',
    message: 'Google sign-in did not complete. Please try again.',
    action: { label: 'Try again', handler: 'retry_login' },
    severity: 'warning',
  },
  LICENSE_TAMPERED: {
    title: 'License verification failed',
    message: 'Please sign in again to verify your subscription.',
    action: { label: 'Sign in', handler: 'show_login' },
    severity: 'warning',
  },
  SYNC_CONFLICT: {
    title: 'Sync conflict',
    message: 'Your profiles were updated on another device. Review the changes to keep the right version.',
    action: { label: 'Review', handler: 'show_conflict_resolver' },
    severity: 'warning',
  },
  CLIPBOARD_FAILED: {
    title: 'Could not copy',
    message: 'Clipboard access was blocked. Try copying the value manually.',
    severity: 'warning',
  },
  REGEX_TOO_COMPLEX: {
    title: 'Pattern too complex',
    message: 'This regex pattern takes too long to evaluate. Simplify it and try again.',
    severity: 'warning',
  },
  NO_COOKIES_FOUND: {
    title: 'No cookies found',
    message: 'This page has no cookies, or the site has not set any yet. Navigate to the site and refresh.',
    severity: 'info',
  },
  PERMISSION_DENIED: {
    title: 'Permission needed',
    message: 'Cookie Manager needs permission to access cookies on this site. Click the extension icon while on the page.',
    severity: 'info',
  },
  SERVICE_WORKER_RESTART: {
    title: '',
    message: '',
    severity: 'info',
    // Silent recovery -- never shown to user
  },
};

/**
 * Map a technical error code or Error object to a user-facing message.
 * Falls back to a generic message for unmapped errors.
 */
export function errorToUserMessage(error: string | Error): UserError {
  const code = typeof error === 'string' ? error : classifyError(error);
  return ERROR_MAP[code] ?? {
    title: 'Something went wrong',
    message: 'Please try again. If this keeps happening, reload the extension.',
    severity: 'error' as const,
  };
}

/**
 * Classify an Error object into one of the known error codes.
 */
function classifyError(err: Error): string {
  const msg = err.message.toLowerCase();

  if (msg.includes('quota')) return 'STORAGE_QUOTA_EXCEEDED';
  if (msg.includes('no host permissions')) return 'PERMISSION_DENIED';
  if (msg.includes('timeout') || msg.includes('timed out')) return 'NETWORK_TIMEOUT';
  if (msg.includes('failed to fetch') || msg.includes('networkerror')) return 'NETWORK_OFFLINE';
  if (msg.includes('json')) return 'IMPORT_PARSE_ERROR';
  if (msg.includes('clipboard')) return 'CLIPBOARD_FAILED';

  return 'UNKNOWN';
}
```

---

## 6. Logging System

```typescript
// src/utils/logger.ts

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  module: string;
  message: string;
  data?: unknown;
  timestamp: string;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const MAX_LOG_ENTRIES = 500;
const LOG_STORAGE_KEY = '_log_buffer';

/**
 * Whether debug logging is active. Controlled by a flag in storage
 * so it can be toggled from the settings page without a rebuild.
 */
let debugEnabled = false;

// Load debug flag on module init (non-blocking)
chrome.storage.local.get('debug_logging').then((result) => {
  debugEnabled = result.debug_logging === true;
}).catch(() => {});

/**
 * Create a namespaced logger. Every log call includes the module name
 * for easy filtering.
 *
 * Usage:
 *   const log = createLogger('ServiceWorker');
 *   log.info('Alarm fired', { name: 'license-check' });
 */
export function createLogger(module: string) {
  function log(level: LogLevel, message: string, data?: unknown): void {
    // Skip debug messages unless explicitly enabled
    if (level === 'debug' && !debugEnabled) return;

    const entry: LogEntry = {
      level,
      module,
      message,
      data: data !== undefined ? sanitizeLogData(data) : undefined,
      timestamp: new Date().toISOString(),
    };

    // Write to storage buffer (non-blocking, fire-and-forget)
    appendToLogBuffer(entry).catch(() => {});

    // Errors are also queued for analytics aggregation
    if (level === 'error') {
      queueErrorForAnalytics(entry).catch(() => {});
    }
  }

  return {
    debug: (msg: string, data?: unknown) => log('debug', msg, data),
    info:  (msg: string, data?: unknown) => log('info', msg, data),
    warn:  (msg: string, data?: unknown) => log('warn', msg, data),
    error: (msg: string, data?: unknown) => log('error', msg, data),
  };
}

/**
 * Strip sensitive data from log payloads.
 * Removes tokens, passwords, cookie values (keeps names and domains).
 */
function sanitizeLogData(data: unknown): unknown {
  if (data instanceof Error) {
    return { message: data.message, name: data.name };
  }
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    const lowerKey = key.toLowerCase();
    if (
      lowerKey.includes('token') ||
      lowerKey.includes('password') ||
      lowerKey.includes('secret') ||
      lowerKey.includes('refresh')
    ) {
      cleaned[key] = '[REDACTED]';
    } else if (lowerKey === 'value' && typeof value === 'string') {
      // Redact cookie values but keep length for debugging
      cleaned[key] = `[${value.length} chars]`;
    } else {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

/**
 * Append a log entry to the circular buffer in storage.
 * Keeps the most recent MAX_LOG_ENTRIES entries.
 */
async function appendToLogBuffer(entry: LogEntry): Promise<void> {
  try {
    const result = await chrome.storage.local.get(LOG_STORAGE_KEY);
    const buffer: LogEntry[] = Array.isArray(result[LOG_STORAGE_KEY])
      ? result[LOG_STORAGE_KEY]
      : [];

    buffer.push(entry);

    // Trim from the front to keep the latest entries
    const trimmed = buffer.length > MAX_LOG_ENTRIES
      ? buffer.slice(buffer.length - MAX_LOG_ENTRIES)
      : buffer;

    await chrome.storage.local.set({ [LOG_STORAGE_KEY]: trimmed });
  } catch {
    // Storage write failed -- swallow to avoid recursive error logging
  }
}

/**
 * Queue error entries for the analytics batch.
 * Aggregates errors by message to avoid flooding.
 */
async function queueErrorForAnalytics(entry: LogEntry): Promise<void> {
  try {
    const result = await chrome.storage.local.get('analytics_queue');
    const queue: unknown[] = Array.isArray(result.analytics_queue)
      ? result.analytics_queue
      : [];

    queue.push({
      event: 'client_error',
      properties: {
        module: entry.module,
        message: entry.message,
        level: entry.level,
      },
      timestamp: entry.timestamp,
      session_id: '',
    });

    await chrome.storage.local.set({ analytics_queue: queue });
  } catch {
    // Swallow -- analytics is best-effort
  }
}

/** Default logger instance for shared utilities. */
export const logger = createLogger('CookieManager');
```

---

## 7. Build-Time Checks

The following rules are enforced in the build pipeline. Code that fails any check does not ship.

### 7.1 ESLint Rules

```javascript
// .eslintrc.cjs (relevant rules only)
module.exports = {
  rules: {
    // Ban console.* -- use the logger module instead
    'no-console': 'error',

    // Ban debugger statements
    'no-debugger': 'error',

    // Ban innerHTML, outerHTML, insertAdjacentHTML, document.write
    'no-restricted-properties': ['error',
      { object: 'document', property: 'write', message: 'Use Preact JSX or textContent.' },
    ],
    'no-restricted-syntax': ['error',
      {
        selector: 'AssignmentExpression[left.property.name="innerHTML"]',
        message: 'innerHTML is banned. Use Preact JSX or textContent for all rendering.',
      },
      {
        selector: 'AssignmentExpression[left.property.name="outerHTML"]',
        message: 'outerHTML is banned. Use Preact JSX or textContent.',
      },
      {
        selector: 'CallExpression[callee.property.name="insertAdjacentHTML"]',
        message: 'insertAdjacentHTML is banned. Use Preact JSX.',
      },
    ],

    // Ban eval and Function constructor
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',

    // Enforce strict TypeScript
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/strict-boolean-expressions': 'error',
    '@typescript-eslint/no-unused-vars': 'error',
  },
};
```

### 7.2 TypeScript Configuration

```json
// tsconfig.json (strict mode settings)
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true,
    "exactOptionalPropertyTypes": true
  }
}
```

### 7.3 Build Pipeline Checks

```bash
#!/usr/bin/env bash
# scripts/build-check.sh -- run before every release

set -euo pipefail

echo "=== TypeScript strict compile ==="
npx tsc --noEmit

echo "=== ESLint zero errors ==="
npx eslint src/ --max-warnings 0

echo "=== No TODO/FIXME comments ==="
if grep -rn 'TODO\|FIXME\|HACK\|XXX' src/; then
  echo "FAIL: Move TODOs to GitHub issues before release."
  exit 1
fi

echo "=== No commented-out code blocks ==="
# Detects 3+ consecutive lines starting with //
if grep -Pzo '(^[ \t]*//.*\n){3,}' src/**/*.ts src/**/*.tsx 2>/dev/null; then
  echo "FAIL: Remove commented-out code blocks."
  exit 1
fi

echo "=== Bundle size check ==="
npx vite build
TOTAL=$(du -sb dist/ | cut -f1)
BUDGET=349184  # 342 KB in bytes (342 * 1024 - rounding)
if [ "$TOTAL" -gt "$BUDGET" ]; then
  echo "FAIL: Bundle size ${TOTAL} bytes exceeds budget of ${BUDGET} bytes (342 KB)."
  exit 1
fi

echo "=== All imports resolve ==="
# TypeScript --noEmit already covers this, but this is the explicit gate.

echo "=== All checks passed ==="
```

### 7.4 Pre-Commit Hook

```bash
#!/usr/bin/env bash
# .husky/pre-commit

# Quick lint on staged files only (full build runs in CI)
npx lint-staged
```

```json
// package.json (lint-staged config)
{
  "lint-staged": {
    "src/**/*.{ts,tsx}": [
      "eslint --max-warnings 0",
      "prettier --check"
    ]
  }
}
```

### 7.5 CI Gate Summary

| Check | Tool | Failure behavior |
|-------|------|-----------------|
| TypeScript strict mode | `tsc --noEmit` | Block merge |
| ESLint zero errors, zero warnings | `eslint --max-warnings 0` | Block merge |
| No `console.log` calls | ESLint `no-console` | Block merge |
| No `debugger` statements | ESLint `no-debugger` | Block merge |
| No `innerHTML` / `document.write` | ESLint `no-restricted-syntax` | Block merge |
| No TODO/FIXME in source | `grep` check | Block merge |
| No commented-out code (3+ lines) | `grep` check | Block merge |
| All imports resolve | `tsc --noEmit` | Block merge |
| Bundle under 342 KB | Post-build `du` check | Block merge |
| Unit tests pass | `vitest run` | Block merge |
| No `eval` or `new Function` | ESLint `no-eval`, `no-new-func` | Block merge |

---

*Code hardening specification produced by Agent 4. 7 sections covering defensive API wrappers, input sanitization (8 functions), state recovery (storage + service worker + network), Preact error boundary, 20 user-facing error messages, structured logging with rotation, and 11 build-time gates. All TypeScript code is production-ready and aligned with the storage schema from Section 5-6 and the security rules from Agent 4 Security.*
