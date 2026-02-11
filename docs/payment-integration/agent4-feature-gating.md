# Feature Gating System: Zovo Cookie Manager

## Phase 09 | Agent 4 | Generated 2026-02-11

**Extension:** Zovo Cookie Manager
**Scope:** Per-feature access control for all Cookie Manager Pro features. Complete `TIER_LIMITS` constant, `canUse()` function, per-feature gate implementations, middleware, paywall strategy mapping, usage tracking, and codebase integration points.
**Dependencies:** Phase 02 Section 2 (feature matrix, free/pro split), Phase 02 Section 3 (17 paywall triggers), Phase 04 Agent 5 (TIER_LIMITS draft, canUse() prototype, PaywallController), Phase 07 Agent 4 (paywall touchpoint designs), Phase 08 Agent 4 (local analytics, ZovoAnalytics)
**Pricing:** Free / $4 Starter / $7 Pro / $14 Team (annual ~30% discount)

---

## 1. TIER_LIMITS Constant (Complete)

This is the single source of truth for every feature limit across all tiers. All UI components and background logic reference this constant to determine access. The value `-1` represents unlimited. Boolean values represent binary feature toggles.

```typescript
// src/shared/constants.ts

/**
 * Complete feature limit definitions for all Zovo Cookie Manager tiers.
 *
 * Numeric values:
 *   -1 = unlimited (no cap enforced)
 *    0 = feature disabled at this tier
 *   >0 = hard cap at that number
 *
 * Boolean values:
 *   true  = feature available
 *   false = feature locked
 *
 * String arrays:
 *   List of allowed values (e.g., export formats)
 */

export interface TierLimits {
  // ── Count-Based Limits ──────────────────────────────────────────────────────
  /** Maximum saved cookie profiles */
  maxProfiles: number;
  /** Maximum active auto-delete rules */
  maxAutoDeleteRules: number;
  /** Maximum cookies per single export operation */
  maxExportCookies: number;
  /** Maximum cookies per single import operation */
  maxImportCookies: number;
  /** Maximum whitelisted domains */
  maxWhitelistedDomains: number;
  /** Maximum blacklisted domains */
  maxBlacklistedDomains: number;
  /** Maximum cookies that can be marked as protected (read-only) */
  maxProtectedCookies: number;
  /** Maximum cookies selectable at once in bulk operations (0 = no bulk) */
  maxBulkSelectCount: number;
  /** Maximum GDPR compliance scans (resets monthly) */
  maxGdprScans: number;
  /** Maximum cookie snapshots stored */
  maxSnapshots: number;
  /** Maximum cookie-blocking rules */
  maxBlockRules: number;
  /** Maximum saved search filter presets */
  maxSavedFilters: number;
  /** Maximum cURL generations per day (0 = disabled, -1 = unlimited) */
  maxCurlPerDay: number;

  // ── Boolean Feature Toggles ─────────────────────────────────────────────────
  /** Full cookie health dashboard with per-cookie breakdown */
  fullHealthCards: boolean;
  /** Encrypted cookie vault (AES-256) */
  encryptedVault: boolean;
  /** Advanced rule patterns: regex, complex glob, schedule triggers */
  advancedRulePatterns: boolean;
  /** Regex search in cookie search bar */
  regexSearch: boolean;
  /** Bulk operations across multiple domains */
  bulkOperations: boolean;
  /** Cross-domain bulk selection and export */
  crossDomainExport: boolean;
  /** Full GDPR compliance report (unblurred) */
  gdprFullReport: boolean;
  /** Real-time cookie change monitoring */
  cookieMonitoring: boolean;
  /** Cross-device sync via Zovo cloud */
  crossBrowserSync: boolean;
  /** Cookie snapshots and diff comparison */
  cookieSnapshots: boolean;
  /** Side panel mode */
  sidePanel: boolean;
  /** DevTools panel integration */
  devtoolsEditing: boolean;
  /** Auto-load profiles by URL pattern */
  autoLoadProfiles: boolean;
  /** Non-JSON export formats (Netscape, CSV, Header String) */
  nonJsonExport: boolean;
  /** Priority support channel */
  prioritySupport: boolean;
  /** Shared profiles within a team workspace */
  sharedProfiles: boolean;
  /** Team management (invite, roles, workspace) */
  teamManagement: boolean;

  // ── Array-Based Limits ──────────────────────────────────────────────────────
  /** Which export formats are available at this tier */
  exportFormats: ExportFormat[];
  /** Which import formats are available at this tier */
  importFormats: ImportFormat[];
  /** Which auto-delete rule triggers are available */
  ruleTriggers: RuleTrigger[];
}

export type ExportFormat = 'json' | 'netscape' | 'csv' | 'header_string' | 'curl_batch';
export type ImportFormat = 'json' | 'netscape' | 'csv';
export type RuleTrigger = 'tab_close' | 'timer' | 'browser_start' | 'manual';

export type TierName = 'free' | 'starter' | 'pro' | 'team';

export const TIER_LIMITS: Record<TierName, TierLimits> = {
  free: {
    // Count-based
    maxProfiles: 2,
    maxAutoDeleteRules: 1,
    maxExportCookies: 25,
    maxImportCookies: 25,
    maxWhitelistedDomains: 5,
    maxBlacklistedDomains: 5,
    maxProtectedCookies: 5,
    maxBulkSelectCount: 10,
    maxGdprScans: 1,
    maxSnapshots: 0,
    maxBlockRules: 3,
    maxSavedFilters: 0,
    maxCurlPerDay: 3,

    // Boolean toggles
    fullHealthCards: false,
    encryptedVault: false,
    advancedRulePatterns: false,
    regexSearch: false,
    bulkOperations: false,
    crossDomainExport: false,
    gdprFullReport: false,
    cookieMonitoring: false,
    crossBrowserSync: false,
    cookieSnapshots: false,
    sidePanel: false,
    devtoolsEditing: false,
    autoLoadProfiles: false,
    nonJsonExport: false,
    prioritySupport: false,
    sharedProfiles: false,
    teamManagement: false,

    // Array-based
    exportFormats: ['json'],
    importFormats: ['json'],
    ruleTriggers: ['tab_close'],
  },

  starter: {
    // Count-based
    maxProfiles: 10,
    maxAutoDeleteRules: 5,
    maxExportCookies: 200,
    maxImportCookies: 200,
    maxWhitelistedDomains: 50,
    maxBlacklistedDomains: 50,
    maxProtectedCookies: 25,
    maxBulkSelectCount: 50,
    maxGdprScans: 5,
    maxSnapshots: 5,
    maxBlockRules: 10,
    maxSavedFilters: 10,
    maxCurlPerDay: -1,

    // Boolean toggles
    fullHealthCards: true,
    encryptedVault: false,
    advancedRulePatterns: false,
    regexSearch: true,
    bulkOperations: false,
    crossDomainExport: false,
    gdprFullReport: true,
    cookieMonitoring: false,
    crossBrowserSync: false,
    cookieSnapshots: false,
    sidePanel: false,
    devtoolsEditing: false,
    autoLoadProfiles: false,
    nonJsonExport: true,
    prioritySupport: false,
    sharedProfiles: false,
    teamManagement: false,

    // Array-based
    exportFormats: ['json', 'netscape', 'csv', 'header_string'],
    importFormats: ['json', 'netscape', 'csv'],
    ruleTriggers: ['tab_close', 'manual'],
  },

  pro: {
    // Count-based (-1 = unlimited)
    maxProfiles: -1,
    maxAutoDeleteRules: -1,
    maxExportCookies: -1,
    maxImportCookies: -1,
    maxWhitelistedDomains: -1,
    maxBlacklistedDomains: -1,
    maxProtectedCookies: -1,
    maxBulkSelectCount: -1,
    maxGdprScans: -1,
    maxSnapshots: -1,
    maxBlockRules: -1,
    maxSavedFilters: -1,
    maxCurlPerDay: -1,

    // Boolean toggles
    fullHealthCards: true,
    encryptedVault: true,
    advancedRulePatterns: true,
    regexSearch: true,
    bulkOperations: true,
    crossDomainExport: true,
    gdprFullReport: true,
    cookieMonitoring: true,
    crossBrowserSync: true,
    cookieSnapshots: true,
    sidePanel: true,
    devtoolsEditing: true,
    autoLoadProfiles: true,
    nonJsonExport: true,
    prioritySupport: true,
    sharedProfiles: false,
    teamManagement: false,

    // Array-based
    exportFormats: ['json', 'netscape', 'csv', 'header_string', 'curl_batch'],
    importFormats: ['json', 'netscape', 'csv'],
    ruleTriggers: ['tab_close', 'timer', 'browser_start', 'manual'],
  },

  team: {
    // Count-based (-1 = unlimited)
    maxProfiles: -1,
    maxAutoDeleteRules: -1,
    maxExportCookies: -1,
    maxImportCookies: -1,
    maxWhitelistedDomains: -1,
    maxBlacklistedDomains: -1,
    maxProtectedCookies: -1,
    maxBulkSelectCount: -1,
    maxGdprScans: -1,
    maxSnapshots: -1,
    maxBlockRules: -1,
    maxSavedFilters: -1,
    maxCurlPerDay: -1,

    // Boolean toggles
    fullHealthCards: true,
    encryptedVault: true,
    advancedRulePatterns: true,
    regexSearch: true,
    bulkOperations: true,
    crossDomainExport: true,
    gdprFullReport: true,
    cookieMonitoring: true,
    crossBrowserSync: true,
    cookieSnapshots: true,
    sidePanel: true,
    devtoolsEditing: true,
    autoLoadProfiles: true,
    nonJsonExport: true,
    prioritySupport: true,
    sharedProfiles: true,
    teamManagement: true,

    // Array-based
    exportFormats: ['json', 'netscape', 'csv', 'header_string', 'curl_batch'],
    importFormats: ['json', 'netscape', 'csv'],
    ruleTriggers: ['tab_close', 'timer', 'browser_start', 'manual'],
  },
} as const;

/**
 * Human-readable tier names for UI display.
 */
export const TIER_DISPLAY_NAMES: Record<TierName, string> = {
  free: 'Free',
  starter: 'Starter',
  pro: 'Pro',
  team: 'Team',
};

/**
 * Monthly pricing per tier in USD.
 */
export const TIER_PRICING: Record<TierName, { monthly: number; annual: number }> = {
  free: { monthly: 0, annual: 0 },
  starter: { monthly: 4, annual: 3 },
  pro: { monthly: 7, annual: 5 },
  team: { monthly: 14, annual: 10 },
};
```

---

## 2. `canUse()` Function

The central feature gate. Every UI component and background process calls this function before executing a gated action. It reads the user's current tier from cached auth state, compares against `TIER_LIMITS`, and returns a typed result that drives both access control and paywall rendering.

```typescript
// src/shared/tier-guard.ts

import { TIER_LIMITS, TierName, TierLimits, TIER_DISPLAY_NAMES } from './constants';

// ── Result Type ───────────────────────────────────────────────────────────────

export interface CanUseResult {
  /** Whether the action is allowed at the current tier */
  allowed: boolean;
  /** The user's current tier */
  tier: TierName;
  /** For count-based features: the numeric limit at the current tier (-1 = unlimited) */
  limit?: number;
  /** For count-based features: the user's current usage count */
  current?: number;
  /** The key of the feature being checked (matches TierLimits property name) */
  featureKey: string;
  /** If not allowed, the minimum tier required to unlock this feature */
  upgradeRequired?: TierName;
  /** Human-readable name of the required tier */
  upgradeRequiredLabel?: string;
  /** For array-based features: the specific value that was denied */
  deniedValue?: string;
}

// ── Tier Resolution ───────────────────────────────────────────────────────────

/**
 * Reads the user's current tier from chrome.storage.sync.
 * Falls back to the local license cache if sync is unavailable.
 * Defaults to 'free' if no auth data exists.
 */
export async function getCurrentTier(): Promise<TierName> {
  try {
    const { zovo_auth } = await chrome.storage.sync.get('zovo_auth');
    if (zovo_auth?.tier && isValidTier(zovo_auth.tier)) {
      return zovo_auth.tier;
    }
  } catch {
    // chrome.storage.sync may fail in certain contexts (e.g., incognito with sync disabled)
  }

  // Fallback: check local license cache (72-hour offline grace)
  try {
    const { license_cache } = await chrome.storage.local.get('license_cache');
    if (license_cache?.tier && isValidTier(license_cache.tier)) {
      const expiresAt = new Date(license_cache.expires_at).getTime();
      if (Date.now() < expiresAt) {
        return license_cache.tier;
      }
    }
  } catch {
    // Storage read failed; default to free
  }

  return 'free';
}

function isValidTier(tier: string): tier is TierName {
  return tier === 'free' || tier === 'starter' || tier === 'pro' || tier === 'team';
}

// ── Tier Hierarchy ────────────────────────────────────────────────────────────

const TIER_ORDER: TierName[] = ['free', 'starter', 'pro', 'team'];

function tierIndex(tier: TierName): number {
  return TIER_ORDER.indexOf(tier);
}

/**
 * Finds the minimum tier at which a boolean feature is enabled.
 * For count-based features, finds the minimum tier with a limit > 0.
 */
function findMinTierForFeature(featureKey: keyof TierLimits): TierName {
  for (const tier of TIER_ORDER) {
    const val = TIER_LIMITS[tier][featureKey];
    if (typeof val === 'boolean' && val === true) return tier;
    if (typeof val === 'number' && (val === -1 || val > 0)) return tier;
    if (Array.isArray(val) && val.length > 0) return tier;
  }
  return 'team'; // Fallback: highest tier
}

/**
 * For a specific value in an array-based feature (e.g., a specific export format),
 * finds the minimum tier that includes that value.
 */
function findMinTierForValue(featureKey: keyof TierLimits, value: string): TierName {
  for (const tier of TIER_ORDER) {
    const arr = TIER_LIMITS[tier][featureKey];
    if (Array.isArray(arr) && arr.includes(value as never)) {
      return tier;
    }
  }
  return 'team';
}

/**
 * For a count-based feature, finds the minimum tier where the limit
 * accommodates the given count (limit === -1 or limit > count).
 */
function findMinTierForCount(featureKey: keyof TierLimits, count: number): TierName {
  for (const tier of TIER_ORDER) {
    const limit = TIER_LIMITS[tier][featureKey] as number;
    if (limit === -1 || limit > count) return tier;
  }
  return 'team';
}

// ── Core canUse() ─────────────────────────────────────────────────────────────

/**
 * Central feature gate function. Determines whether the current user
 * is allowed to perform a specific gated action.
 *
 * @param featureKey - The key in TierLimits to check (e.g., 'maxProfiles', 'encryptedVault')
 * @param context - Optional context:
 *   - For count-based limits: `{ currentCount: number }` -- the user's current usage
 *   - For array-based limits: `{ value: string }` -- the specific value to check
 *   - For count-based limits where the action involves a quantity: `{ requestedCount: number }`
 *
 * @returns CanUseResult with allowed/denied status and upgrade guidance
 */
export async function canUse(
  featureKey: keyof TierLimits,
  context?: { currentCount?: number; requestedCount?: number; value?: string }
): Promise<CanUseResult> {
  const tier = await getCurrentTier();
  const limit = TIER_LIMITS[tier][featureKey];

  const baseResult: Pick<CanUseResult, 'tier' | 'featureKey'> = {
    tier,
    featureKey: featureKey as string,
  };

  // ── Boolean features ────────────────────────────────────────────────────────
  if (typeof limit === 'boolean') {
    if (limit) {
      return { ...baseResult, allowed: true };
    }
    const requiredTier = findMinTierForFeature(featureKey);
    return {
      ...baseResult,
      allowed: false,
      upgradeRequired: requiredTier,
      upgradeRequiredLabel: TIER_DISPLAY_NAMES[requiredTier],
    };
  }

  // ── Array-based features (exportFormats, importFormats, ruleTriggers) ──────
  if (Array.isArray(limit)) {
    if (context?.value) {
      if (limit.includes(context.value as never)) {
        return { ...baseResult, allowed: true };
      }
      const requiredTier = findMinTierForValue(featureKey, context.value);
      return {
        ...baseResult,
        allowed: false,
        deniedValue: context.value,
        upgradeRequired: requiredTier,
        upgradeRequiredLabel: TIER_DISPLAY_NAMES[requiredTier],
      };
    }
    // No specific value requested; return allowed if the array is non-empty
    return { ...baseResult, allowed: limit.length > 0 };
  }

  // ── Numeric features ────────────────────────────────────────────────────────
  if (typeof limit === 'number') {
    // Unlimited
    if (limit === -1) {
      return {
        ...baseResult,
        allowed: true,
        limit: -1,
        current: context?.currentCount,
      };
    }

    // Feature completely disabled at this tier (0)
    if (limit === 0) {
      const requiredTier = findMinTierForFeature(featureKey);
      return {
        ...baseResult,
        allowed: false,
        limit: 0,
        current: context?.currentCount ?? 0,
        upgradeRequired: requiredTier,
        upgradeRequiredLabel: TIER_DISPLAY_NAMES[requiredTier],
      };
    }

    // Count-based check: does the current count exceed or meet the limit?
    if (context?.currentCount !== undefined) {
      const allowed = context.currentCount < limit;
      if (allowed) {
        return {
          ...baseResult,
          allowed: true,
          limit,
          current: context.currentCount,
        };
      }
      const requiredTier = findMinTierForCount(featureKey, context.currentCount);
      return {
        ...baseResult,
        allowed: false,
        limit,
        current: context.currentCount,
        upgradeRequired: requiredTier,
        upgradeRequiredLabel: TIER_DISPLAY_NAMES[requiredTier],
      };
    }

    // Requested count check: does the requested operation exceed the limit?
    if (context?.requestedCount !== undefined) {
      const allowed = context.requestedCount <= limit;
      if (allowed) {
        return {
          ...baseResult,
          allowed: true,
          limit,
          current: context.requestedCount,
        };
      }
      const requiredTier = findMinTierForCount(featureKey, context.requestedCount);
      return {
        ...baseResult,
        allowed: false,
        limit,
        current: context.requestedCount,
        upgradeRequired: requiredTier,
        upgradeRequiredLabel: TIER_DISPLAY_NAMES[requiredTier],
      };
    }

    // No count provided: just confirm the limit is positive
    return {
      ...baseResult,
      allowed: limit > 0,
      limit,
    };
  }

  // Fallback: deny
  return {
    ...baseResult,
    allowed: false,
    upgradeRequired: 'pro',
    upgradeRequiredLabel: TIER_DISPLAY_NAMES.pro,
  };
}
```

---

## 3. Feature Gate Implementations

Each gated feature has a dedicated function that combines `canUse()` with the `FeatureUsageTracker` (Section 6) to provide a complete access check. These functions are the ones called directly by UI components.

```typescript
// src/shared/feature-gates.ts

import { canUse, CanUseResult, getCurrentTier } from './tier-guard';
import { TIER_LIMITS, TierName } from './constants';
import { FeatureUsageTracker } from './feature-usage-tracker';

const tracker = new FeatureUsageTracker();

// ── 3a. Profile Management ──────────────────────────────────────────────────

/**
 * Gate: Can the user create a new cookie profile?
 *
 * Free: 2 profiles max
 * Starter: 10 profiles max
 * Pro/Team: unlimited
 *
 * Called by: ProfileManager.tsx "Save Profile" and "+" buttons
 * Trigger: T1
 */
export async function canCreateProfile(): Promise<CanUseResult> {
  const currentCount = await tracker.getProfileCount();
  return canUse('maxProfiles', { currentCount });
}

// ── 3b. Auto-Delete Rules ───────────────────────────────────────────────────

/**
 * Gate: Can the user create a new auto-delete rule?
 *
 * Free: 1 rule max
 * Starter: 5 rules max
 * Pro/Team: unlimited
 *
 * Called by: RuleEditor.tsx "Add Rule" button
 * Trigger: T2
 */
export async function canCreateRule(): Promise<CanUseResult> {
  const currentCount = await tracker.getRuleCount();
  return canUse('maxAutoDeleteRules', { currentCount });
}

// ── 3c. Cookie Export ───────────────────────────────────────────────────────

/**
 * Gate: Can the user export the specified number of cookies?
 *
 * Free: 25 cookies per export (soft paywall -- exports first 25, shows limit banner for rest)
 * Starter: 200 cookies per export
 * Pro/Team: unlimited
 *
 * For the soft paywall variant: the first 25 are always exported. The CanUseResult
 * indicates whether the FULL set is allowed. The caller uses this to decide
 * whether to show the "X more cookies available with Pro" banner.
 *
 * Called by: ExportPanel.tsx export action
 * Trigger: T3
 */
export async function canExportCookies(cookieCount: number): Promise<CanUseResult> {
  const result = await canUse('maxExportCookies', { requestedCount: cookieCount });

  // One-time gift exception: first full export is free regardless of count.
  // Check if the gift has already been used.
  if (!result.allowed) {
    const { zovo_onetime_full_export } = await chrome.storage.local.get(
      'zovo_onetime_full_export'
    );
    if (!zovo_onetime_full_export) {
      // Grant the one-time gift -- caller must set the flag after export completes
      return {
        ...result,
        allowed: true,
        // Keep the limit/current fields so the caller knows this was a gift
      };
    }
  }

  return result;
}

/**
 * Mark the one-time full export gift as consumed.
 * Called by ExportPanel.tsx immediately after the first gift export completes.
 */
export async function consumeOneTimeExportGift(): Promise<void> {
  await chrome.storage.local.set({ zovo_onetime_full_export: true });
}

// ── 3d. Cookie Import ───────────────────────────────────────────────────────

/**
 * Gate: Can the user import the specified number of cookies?
 *
 * Free: 25 cookies per import
 * Starter: 200 cookies per import
 * Pro/Team: unlimited
 *
 * Called by: ImportPanel.tsx after file parsing
 * Trigger: T14
 */
export async function canImportCookies(cookieCount: number): Promise<CanUseResult> {
  return canUse('maxImportCookies', { requestedCount: cookieCount });
}

// ── 3e. Health Dashboard ────────────────────────────────────────────────────

/**
 * Gate: Can the user view a specific health card in the health dashboard?
 *
 * The health badge (letter grade + score) is always visible to all users.
 * Card index 0 (first risk category) is always fully revealed as a "taste of premium."
 * Cards at index 1+ require Starter or above.
 *
 * Free: card 0 visible, cards 1+ blurred
 * Starter+: all cards visible
 *
 * Called by: HealthScore.tsx card rendering
 * Trigger: T5
 */
export async function canViewHealthCard(cardIndex: number): Promise<CanUseResult> {
  // First card is always free (taste of premium)
  if (cardIndex === 0) {
    const tier = await getCurrentTier();
    return {
      allowed: true,
      tier,
      featureKey: 'fullHealthCards',
    };
  }

  // Cards 1+ require the fullHealthCards boolean toggle
  return canUse('fullHealthCards');
}

// ── 3f. Encrypted Vault ─────────────────────────────────────────────────────

/**
 * Gate: Can the user access the encrypted cookie vault?
 *
 * This is a hard paywall -- completely locked for Free and Starter tiers.
 * No partial access, no preview data.
 *
 * Free: locked
 * Starter: locked
 * Pro/Team: full access
 *
 * Called by: ExportPanel.tsx "Encrypted Export" and vault UI
 * Trigger: T8
 */
export async function canUseVault(): Promise<CanUseResult> {
  return canUse('encryptedVault');
}

// ── 3g. Bulk Operations ─────────────────────────────────────────────────────

/**
 * Gate: Can the user perform bulk operations on the given number of cookies?
 *
 * Free: up to 10 cookies in a single-domain selection
 * Starter: up to 50 cookies in a single-domain selection
 * Pro/Team: unlimited, including cross-domain selection
 *
 * Two checks are performed:
 * 1. maxBulkSelectCount -- does the selected count exceed the tier limit?
 * 2. bulkOperations -- for cross-domain selection, is bulkOperations enabled?
 *
 * Called by: CookieList.tsx multi-select checkboxes, "Select All" action
 * Trigger: T4
 */
export async function canBulkSelect(
  selectedCount: number,
  isCrossDomain: boolean = false
): Promise<CanUseResult> {
  // Cross-domain selection requires Pro+ bulkOperations toggle
  if (isCrossDomain) {
    const crossDomainResult = await canUse('crossDomainExport');
    if (!crossDomainResult.allowed) {
      return crossDomainResult;
    }
  }

  // Count-based check against maxBulkSelectCount
  return canUse('maxBulkSelectCount', { requestedCount: selectedCount });
}

// ── 3h. Export Formats ──────────────────────────────────────────────────────

/**
 * Gate: Can the user export in the specified format?
 *
 * Free: JSON only
 * Starter+: JSON, Netscape, CSV, Header String
 * Pro+: adds curl_batch
 *
 * Called by: ExportPanel.tsx format dropdown
 * Trigger: T13
 */
export async function canExportFormat(format: string): Promise<CanUseResult> {
  return canUse('exportFormats', { value: format });
}

/**
 * Gate: Can the user import in the specified format?
 *
 * Free: JSON only
 * Starter+: JSON, Netscape, CSV
 */
export async function canImportFormat(format: string): Promise<CanUseResult> {
  return canUse('importFormats', { value: format });
}

// ── 3i. Advanced Rule Patterns ──────────────────────────────────────────────

/**
 * Gate: Can the user use advanced rule patterns (regex, complex glob, schedules)?
 *
 * Free: simple glob patterns and tab_close trigger only
 * Starter: adds regex search (but not advanced rule patterns)
 * Pro+: full regex, complex conditions, all trigger types
 *
 * Called by: RuleEditor.tsx pattern type selector and trigger selector
 * Trigger: T2 (part of rule creation flow)
 */
export async function canUseAdvancedRulePattern(): Promise<CanUseResult> {
  return canUse('advancedRulePatterns');
}

/**
 * Gate: Can the user use the specified rule trigger type?
 *
 * Free: tab_close only
 * Starter: tab_close, manual
 * Pro+: tab_close, timer, browser_start, manual
 */
export async function canUseRuleTrigger(trigger: string): Promise<CanUseResult> {
  return canUse('ruleTriggers', { value: trigger });
}

// ── 3j. Whitelisted Domains ─────────────────────────────────────────────────

/**
 * Gate: Can the user add another domain to the whitelist?
 *
 * Free: 5 domains max
 * Starter: 50 domains max
 * Pro/Team: unlimited
 *
 * Called by: Settings whitelist "Add Domain" button
 * Trigger: T15
 */
export async function canAddWhitelistDomain(): Promise<CanUseResult> {
  const currentCount = await tracker.getWhitelistCount();
  return canUse('maxWhitelistedDomains', { currentCount });
}

/**
 * Gate: Can the user add another domain to the blacklist?
 *
 * Free: 5 domains max
 * Starter: 50 domains max
 * Pro/Team: unlimited
 *
 * Called by: Settings blacklist "Add Domain" button
 * Trigger: T15
 */
export async function canAddBlacklistDomain(): Promise<CanUseResult> {
  const currentCount = await tracker.getBlacklistCount();
  return canUse('maxBlacklistedDomains', { currentCount });
}

// ── 3k. GDPR Compliance Scan ────────────────────────────────────────────────

/**
 * Gate: Can the user run a GDPR compliance scan?
 *
 * Free: 1 scan (resets monthly). Results are blurred after top 3 cookies.
 * Starter: 5 scans per month with full results.
 * Pro/Team: unlimited scans with full results.
 *
 * Called by: HealthScore.tsx / compliance scan UI "Run Scan" button
 * Trigger: T6
 */
export async function canRunGdprScan(): Promise<CanUseResult> {
  const currentCount = await tracker.getGdprScanCountThisMonth();
  return canUse('maxGdprScans', { currentCount });
}

/**
 * Gate: Can the user see the full (unblurred) GDPR report?
 *
 * Free: blurred after top 3 cookies
 * Starter+: full report visible
 */
export async function canViewFullGdprReport(): Promise<CanUseResult> {
  return canUse('gdprFullReport');
}

// ── 3l. cURL Generation ─────────────────────────────────────────────────────

/**
 * Gate: Can the user generate a cURL command?
 *
 * Free: 3 per day (resets at midnight local time)
 * Starter+: unlimited
 *
 * Called by: CookieDetail.tsx / CookieList.tsx "Copy as cURL" action
 */
export async function canGenerateCurl(): Promise<CanUseResult> {
  const currentCount = await tracker.getCurlCountToday();
  return canUse('maxCurlPerDay', { currentCount });
}

// ── 3m. Regex Search ────────────────────────────────────────────────────────

/**
 * Gate: Can the user use regex search?
 *
 * Free: plain text search only
 * Starter+: regex search enabled
 *
 * Called by: SearchBar.tsx regex toggle button
 * Trigger: T7
 */
export async function canUseRegexSearch(): Promise<CanUseResult> {
  return canUse('regexSearch');
}

// ── 3n. Cookie Monitoring ───────────────────────────────────────────────────

/**
 * Gate: Can the user enable real-time cookie monitoring?
 *
 * Free: disabled
 * Starter: disabled
 * Pro/Team: full access
 *
 * Called by: Monitor tab or "Start Monitoring" toggle
 * Trigger: T12
 */
export async function canUseCookieMonitoring(): Promise<CanUseResult> {
  return canUse('cookieMonitoring');
}

// ── 3o. Cookie Snapshots ────────────────────────────────────────────────────

/**
 * Gate: Can the user take a cookie snapshot?
 *
 * Free: 0 snapshots (feature locked)
 * Starter: 5 snapshots
 * Pro/Team: unlimited
 *
 * Called by: Snapshots tab "Take Snapshot" button
 * Trigger: T11
 */
export async function canTakeSnapshot(): Promise<CanUseResult> {
  const currentCount = await tracker.getSnapshotCount();
  return canUse('maxSnapshots', { currentCount });
}

// ── 3p. Cross-Device Sync ───────────────────────────────────────────────────

/**
 * Gate: Can the user enable cross-device sync?
 *
 * Free: disabled
 * Starter: disabled
 * Pro/Team: full access
 *
 * Called by: Settings "Sync Profiles" toggle
 * Trigger: T9
 */
export async function canUseCrossDeviceSync(): Promise<CanUseResult> {
  return canUse('crossBrowserSync');
}

// ── 3q. Side Panel Mode ─────────────────────────────────────────────────────

/**
 * Gate: Can the user open the extension in side panel mode?
 *
 * Free: disabled
 * Starter: disabled
 * Pro/Team: full access
 *
 * Called by: Popup header "Open in Side Panel" button
 * Trigger: T16
 */
export async function canUseSidePanel(): Promise<CanUseResult> {
  return canUse('sidePanel');
}

// ── 3r. Cookie Protection ───────────────────────────────────────────────────

/**
 * Gate: Can the user mark another cookie as protected (read-only)?
 *
 * Free: 5 protected cookies max
 * Starter: 25
 * Pro/Team: unlimited
 *
 * Called by: CookieDetail.tsx "Protect" toggle
 */
export async function canProtectCookie(): Promise<CanUseResult> {
  const currentCount = await tracker.getProtectedCookieCount();
  return canUse('maxProtectedCookies', { currentCount });
}

// ── 3s. Team Features ───────────────────────────────────────────────────────

/**
 * Gate: Can the user access team sharing features?
 *
 * Free/Starter/Pro: disabled
 * Team: full access
 *
 * Called by: "Share with Team", "Team Library", "Invite" actions
 * Trigger: T10
 */
export async function canUseTeamSharing(): Promise<CanUseResult> {
  return canUse('sharedProfiles');
}

export async function canUseTeamManagement(): Promise<CanUseResult> {
  return canUse('teamManagement');
}

// ── 3t. Saved Filters ──────────────────────────────────────────────────────

/**
 * Gate: Can the user save a search filter preset?
 *
 * Free: 0 (disabled)
 * Starter: 10 saved filters
 * Pro/Team: unlimited
 *
 * Called by: SearchBar.tsx "Save Filter" button
 */
export async function canSaveFilter(): Promise<CanUseResult> {
  const currentCount = await tracker.getSavedFilterCount();
  return canUse('maxSavedFilters', { currentCount });
}
```

---

## 4. Feature Gate Middleware

A higher-order function that wraps any user action with a feature gate check. This is the standard pattern used throughout the UI to ensure consistent gating, paywall display, and analytics tracking.

```typescript
// src/shared/feature-gate-middleware.ts

import { CanUseResult } from './tier-guard';
import { analytics } from '../analytics/zovo-analytics';

/**
 * Wraps an action with a feature gate check.
 *
 * If the feature check returns `allowed: true`, the action executes and its
 * return value is passed through.
 *
 * If the feature check returns `allowed: false`, the `onBlocked` callback
 * fires with the check result (typically to render a paywall), and the
 * action is never called.
 *
 * Usage:
 * ```typescript
 * const handleExport = withFeatureGate(
 *   () => canExportCookies(selectedCookies.length),
 *   () => performExport(selectedCookies),
 *   (result) => showPaywall('T3', result)
 * );
 *
 * // In the click handler:
 * await handleExport();
 * ```
 *
 * @param featureCheck - Async function that returns a CanUseResult
 * @param action - The action to execute if allowed
 * @param onBlocked - Callback when the action is denied; receives the CanUseResult
 * @returns A wrapped async function
 */
export function withFeatureGate<T>(
  featureCheck: () => Promise<CanUseResult>,
  action: () => Promise<T>,
  onBlocked: (result: CanUseResult) => void
): () => Promise<T | void> {
  return async (): Promise<T | void> => {
    const result = await featureCheck();

    if (result.allowed) {
      return action();
    }

    // Track the blocked attempt for analytics
    await analytics.track('feature_gate_blocked', {
      featureKey: result.featureKey,
      tier: result.tier,
      upgradeRequired: result.upgradeRequired ?? 'unknown',
      limit: result.limit ?? null,
      current: result.current ?? null,
    });

    onBlocked(result);
  };
}

/**
 * Variant of withFeatureGate that passes the CanUseResult to the action
 * even when allowed. This is useful for actions that need to show contextual
 * information about limits (e.g., "2/2 profiles used").
 */
export function withFeatureGateContext<T>(
  featureCheck: () => Promise<CanUseResult>,
  action: (result: CanUseResult) => Promise<T>,
  onBlocked: (result: CanUseResult) => void
): () => Promise<T | void> {
  return async (): Promise<T | void> => {
    const result = await featureCheck();

    if (result.allowed) {
      return action(result);
    }

    await analytics.track('feature_gate_blocked', {
      featureKey: result.featureKey,
      tier: result.tier,
      upgradeRequired: result.upgradeRequired ?? 'unknown',
      limit: result.limit ?? null,
      current: result.current ?? null,
    });

    onBlocked(result);
  };
}

/**
 * Decorator-style gate for use in class methods.
 * Checks the feature gate before invoking the decorated method.
 *
 * Usage:
 * ```typescript
 * class ProfileManager {
 *   @featureGated(() => canCreateProfile(), showPaywall)
 *   async saveProfile(profile: CookieProfile): Promise<void> {
 *     // Only executes if canCreateProfile() returns allowed: true
 *   }
 * }
 * ```
 */
export function featureGated(
  featureCheck: () => Promise<CanUseResult>,
  onBlocked: (result: CanUseResult) => void
) {
  return function (
    _target: unknown,
    _propertyKey: string,
    descriptor: PropertyDescriptor
  ): PropertyDescriptor {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: unknown[]) {
      const result = await featureCheck();

      if (!result.allowed) {
        await analytics.track('feature_gate_blocked', {
          featureKey: result.featureKey,
          tier: result.tier,
          upgradeRequired: result.upgradeRequired ?? 'unknown',
        });
        onBlocked(result);
        return;
      }

      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

/**
 * Batch feature gate check. Evaluates multiple feature gates in parallel
 * and returns the first denial (if any). Useful for complex actions that
 * require multiple permissions (e.g., cross-domain bulk export in a non-JSON format).
 *
 * If all checks pass, returns the last result (all allowed).
 * If any check fails, returns the first failing result.
 */
export async function checkAllGates(
  checks: Array<() => Promise<CanUseResult>>
): Promise<CanUseResult> {
  const results = await Promise.all(checks.map((check) => check()));

  const denied = results.find((r) => !r.allowed);
  if (denied) return denied;

  return results[results.length - 1];
}
```

---

## 5. Soft vs Hard Paywall Strategy

Every gated feature uses either a soft or hard paywall. The strategy is determined by the Phase 02 Section 3 paywall specification and Phase 07 Agent 4 touchpoint designs. The following table documents the complete mapping.

| Feature | Trigger | Paywall Type | Behavior | Min. Tier |
|---------|---------|-------------|----------|-----------|
| Cookie Profiles (3rd+) | T1 | Soft (hard modal, softens after 3 dismissals) | "Save Profile" button remains visible and clickable. On click, action is intercepted and upgrade modal appears. User's existing 2 profiles visible through blur. | Starter |
| Auto-Delete Rules (2nd+) | T2 | Soft (hard modal, softens after 3 dismissals) | "Add Rule" button remains visible. Modal shows existing rule's stats (cookies removed). After 3 dismissals, becomes inline banner. | Starter |
| Cookie Export (>25 cookies) | T3 | Soft | Exports first 25 cookies immediately. Shows inline banner: "[X] more cookies available with Pro." First export is a one-time gift (full export). | Starter |
| Bulk Cross-Domain Ops | T4 | Soft (hard modal, softens after 3 dismissals) | Free users can select up to 10 cookies on a single domain. Selecting 11th or cross-domain triggers modal. | Pro |
| Health Dashboard (cards 1+) | T5 | Soft | First risk category card fully visible. Remaining cards are blurred with 6px CSS filter. Inline CTA banner below blurred panel. | Starter |
| GDPR Scan (2nd+) | T6 | Hard | Second scan attempt triggers hard block. First scan's results are blurred after top 3 cookies. | Pro |
| Regex Search | T7 | Soft | Regex toggle icon is visible but clicking shows inline banner. Search continues to work in plain-text mode. | Starter |
| Encrypted Vault | T8 | Hard | Feature entirely locked. Clicking "Encrypted Export" or "Cookie Vault" shows feature discovery page with animated preview. | Pro |
| Cross-Device Sync | T9 | Hard | "Sync Profiles" toggle is visible but clicking triggers hard block modal. | Pro |
| Team Sharing | T10 | Hard | All team features (Share, Library, Invite) locked behind hard modal. | Team |
| Cookie Snapshots | T11 | Soft | Feature discovery with pulsing blue dot and preview animation. | Pro |
| Real-Time Monitoring | T12 | Soft | Feature discovery with pulsing blue dot and preview animation. | Pro |
| Non-JSON Export | T13 | Soft | Locked format options in dropdown show lock icon. Selecting triggers inline banner. | Starter |
| Import >25 Cookies | T14 | Soft | File parses fully in preview. Cookies beyond 25 shown with lock icons. | Starter |
| Whitelist/Blacklist (6th+) | T15 | Soft | "Add Domain" button visible. Inline banner appears on 6th attempt. | Starter |
| Side Panel Mode | T16 | Soft | "Open in Side Panel" button visible with lock icon. Inline banner on click. | Pro |
| 7-Day Engagement Nudge | T17 | Soft | Feature discovery: pulsing blue dot on Pro badge in header. | Starter |

### Paywall Type Definitions

**Hard Paywall:**
- Modal overlay with blurred background (`backdrop-filter: blur(8px)`)
- Action is completely blocked -- no partial execution
- Dismissible via "Maybe later", Escape, or outside click
- 48-hour cooldown after dismissal
- After 3 total dismissals for the same trigger, permanently converts to a soft inline banner
- Maximum 1 hard block per session

**Soft Paywall:**
- Inline banner below the relevant UI element (slides in, 250ms ease-out)
- Partial functionality is delivered (e.g., first 25 cookies export, first health card visible)
- Dismissible via X button or text link
- 48-hour cooldown after dismissal
- Maximum 3 soft banners per session across all triggers

**Feature Discovery:**
- Pulsing blue dot on the Pro-only UI element
- Click opens an animated preview showing the feature in action
- No modal or block -- purely informational
- Pulsing animation plays once per session, then dot remains static
- No cooldown (always visible for free users)

### Paywall Rendering Decision Flow

```typescript
// src/shared/paywall-renderer.ts

import { CanUseResult } from './tier-guard';
import { PaywallController } from './paywall-controller';

type PaywallType = 'hard' | 'soft' | 'discovery';

/**
 * Maps trigger IDs to their paywall type. The PaywallController uses this
 * to enforce per-type session frequency limits.
 */
const TRIGGER_PAYWALL_TYPE: Record<string, PaywallType> = {
  T1: 'hard',
  T2: 'hard',
  T3: 'soft',
  T4: 'hard',
  T5: 'soft',
  T6: 'hard',
  T7: 'soft',
  T8: 'soft',   // Feature discovery page, not modal
  T9: 'hard',
  T10: 'hard',
  T11: 'discovery',
  T12: 'discovery',
  T13: 'soft',
  T14: 'soft',
  T15: 'soft',
  T16: 'soft',
  T17: 'discovery',
};

/**
 * Determines whether a paywall should be shown for a given trigger,
 * respecting all frequency limits, cooldowns, and prerequisites.
 *
 * This is the final gatekeeper before any paywall renders.
 */
export async function shouldShowPaywall(
  triggerId: string,
  gateResult: CanUseResult
): Promise<boolean> {
  // Feature is allowed -- no paywall needed
  if (gateResult.allowed) return false;

  const paywallType = TRIGGER_PAYWALL_TYPE[triggerId] ?? 'soft';
  const controller = new PaywallController();

  return controller.shouldShow(triggerId, paywallType);
}
```

---

## 6. Feature Usage Tracker

This module tracks current usage counts for all gated features. It reads from `chrome.storage.local` and provides the counts that `canUse()` needs to evaluate limits. It also manages daily and monthly counter resets.

```typescript
// src/shared/feature-usage-tracker.ts

/**
 * FeatureUsageTracker -- reads current usage counts from chrome.storage.local.
 *
 * This class does NOT write data (except for daily/monthly resets). Writes happen
 * in the respective feature modules (ProfileManager, RuleEditor, ExportPanel, etc.)
 * when they persist data. This class only reads the current state to provide
 * counts for feature gate evaluation.
 *
 * Storage keys read:
 *   - profiles: CookieProfile[]
 *   - rules: AutoDeleteRule[]
 *   - snapshots: CookieSnapshot[]
 *   - usage: { exports_this_month, gdpr_scans_used, bulk_ops_today, ... }
 *   - zovo_daily_counts: { curl_count, date }
 *   - domain_lists (from chrome.storage.sync): { whitelist, blacklist }
 */

interface DailyCounts {
  /** ISO date string (YYYY-MM-DD) for the day these counts apply */
  date: string;
  /** Number of cURL commands generated today */
  curlCount: number;
}

interface UsageCounters {
  profiles_count: number;
  rules_count: number;
  exports_this_month: number;
  exports_month_reset: string;
  gdpr_scans_used: number;
  gdpr_scans_month_reset: string;
  bulk_ops_today: number;
  bulk_ops_date_reset: string;
}

export class FeatureUsageTracker {
  // ── Profile Count ───────────────────────────────────────────────────────────

  /**
   * Returns the number of saved cookie profiles.
   * Reads the `profiles` array from chrome.storage.local.
   */
  async getProfileCount(): Promise<number> {
    const { profiles } = await chrome.storage.local.get('profiles');
    if (Array.isArray(profiles)) {
      return profiles.length;
    }
    return 0;
  }

  // ── Rule Count ──────────────────────────────────────────────────────────────

  /**
   * Returns the number of active auto-delete rules.
   * Reads the `rules` array from chrome.storage.local.
   */
  async getRuleCount(): Promise<number> {
    const { rules } = await chrome.storage.local.get('rules');
    if (Array.isArray(rules)) {
      return rules.filter((r: { enabled: boolean }) => r.enabled !== false).length;
    }
    return 0;
  }

  // ── Snapshot Count ──────────────────────────────────────────────────────────

  /**
   * Returns the number of stored cookie snapshots.
   */
  async getSnapshotCount(): Promise<number> {
    const { snapshots } = await chrome.storage.local.get('snapshots');
    if (Array.isArray(snapshots)) {
      return snapshots.length;
    }
    return 0;
  }

  // ── Export Count (Monthly) ──────────────────────────────────────────────────

  /**
   * Returns the number of exports performed this calendar month.
   * Resets automatically when the month changes.
   */
  async getExportCountThisMonth(): Promise<number> {
    const { usage } = await chrome.storage.local.get('usage');
    if (!usage) return 0;

    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Check if the stored reset month matches the current month
    if (usage.exports_month_reset !== currentMonth) {
      // Month changed -- reset the counter
      await this.resetMonthlyExportCount(currentMonth);
      return 0;
    }

    return usage.exports_this_month ?? 0;
  }

  // ── GDPR Scan Count (Monthly) ──────────────────────────────────────────────

  /**
   * Returns the number of GDPR compliance scans performed this calendar month.
   * Resets automatically when the month changes.
   */
  async getGdprScanCountThisMonth(): Promise<number> {
    const { usage } = await chrome.storage.local.get('usage');
    if (!usage) return 0;

    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    if (usage.gdpr_scans_month_reset !== currentMonth) {
      await this.resetMonthlyGdprCount(currentMonth);
      return 0;
    }

    return usage.gdpr_scans_used ?? 0;
  }

  // ── cURL Count (Daily) ─────────────────────────────────────────────────────

  /**
   * Returns the number of cURL commands generated today.
   * Resets automatically at midnight local time (when the date string changes).
   */
  async getCurlCountToday(): Promise<number> {
    const { zovo_daily_counts } = await chrome.storage.local.get('zovo_daily_counts');
    if (!zovo_daily_counts) return 0;

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    if (zovo_daily_counts.date !== today) {
      // Day changed -- reset
      await this.resetDailyCounts();
      return 0;
    }

    return zovo_daily_counts.curlCount ?? 0;
  }

  // ── Whitelist Count ─────────────────────────────────────────────────────────

  /**
   * Returns the number of whitelisted domains.
   * Reads from chrome.storage.sync (domain_lists.whitelist).
   */
  async getWhitelistCount(): Promise<number> {
    const { domain_lists } = await chrome.storage.sync.get('domain_lists');
    if (domain_lists?.whitelist && Array.isArray(domain_lists.whitelist)) {
      return domain_lists.whitelist.length;
    }
    return 0;
  }

  // ── Blacklist Count ─────────────────────────────────────────────────────────

  /**
   * Returns the number of blacklisted domains.
   * Reads from chrome.storage.sync (domain_lists.blacklist).
   */
  async getBlacklistCount(): Promise<number> {
    const { domain_lists } = await chrome.storage.sync.get('domain_lists');
    if (domain_lists?.blacklist && Array.isArray(domain_lists.blacklist)) {
      return domain_lists.blacklist.length;
    }
    return 0;
  }

  // ── Protected Cookie Count ──────────────────────────────────────────────────

  /**
   * Returns the number of cookies marked as protected (read-only).
   * Protected cookies are stored as metadata in chrome.storage.local
   * under the key `protected_cookies` (array of cookie identifiers).
   */
  async getProtectedCookieCount(): Promise<number> {
    const { protected_cookies } = await chrome.storage.local.get('protected_cookies');
    if (Array.isArray(protected_cookies)) {
      return protected_cookies.length;
    }
    return 0;
  }

  // ── Saved Filter Count ──────────────────────────────────────────────────────

  /**
   * Returns the number of saved search filter presets.
   * Stored in chrome.storage.sync under `saved_filters`.
   */
  async getSavedFilterCount(): Promise<number> {
    const { saved_filters } = await chrome.storage.sync.get('saved_filters');
    if (Array.isArray(saved_filters)) {
      return saved_filters.length;
    }
    return 0;
  }

  // ── Block Rule Count ────────────────────────────────────────────────────────

  /**
   * Returns the number of cookie-blocking rules.
   */
  async getBlockRuleCount(): Promise<number> {
    const { block_rules } = await chrome.storage.local.get('block_rules');
    if (Array.isArray(block_rules)) {
      return block_rules.length;
    }
    return 0;
  }

  // ── Counter Incrementers ────────────────────────────────────────────────────

  /**
   * Increment the daily cURL generation counter.
   * Called by the cURL generation module after each successful generation.
   */
  async incrementCurlCount(): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const { zovo_daily_counts } = await chrome.storage.local.get('zovo_daily_counts');

    const counts: DailyCounts = zovo_daily_counts?.date === today
      ? zovo_daily_counts
      : { date: today, curlCount: 0 };

    counts.curlCount++;

    await chrome.storage.local.set({ zovo_daily_counts: counts });
  }

  /**
   * Increment the monthly GDPR scan counter.
   * Called by the GDPR scan module after each completed scan.
   */
  async incrementGdprScanCount(): Promise<void> {
    const { usage } = await chrome.storage.local.get('usage');
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const updatedUsage: Partial<UsageCounters> = {
      ...(usage ?? {}),
      gdpr_scans_used:
        usage?.gdpr_scans_month_reset === currentMonth
          ? (usage.gdpr_scans_used ?? 0) + 1
          : 1,
      gdpr_scans_month_reset: currentMonth,
    };

    await chrome.storage.local.set({ usage: { ...usage, ...updatedUsage } });
  }

  /**
   * Increment the monthly export counter.
   * Called by the export module after each completed export.
   */
  async incrementExportCount(): Promise<void> {
    const { usage } = await chrome.storage.local.get('usage');
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const updatedUsage: Partial<UsageCounters> = {
      ...(usage ?? {}),
      exports_this_month:
        usage?.exports_month_reset === currentMonth
          ? (usage.exports_this_month ?? 0) + 1
          : 1,
      exports_month_reset: currentMonth,
    };

    await chrome.storage.local.set({ usage: { ...usage, ...updatedUsage } });
  }

  // ── Reset Functions ─────────────────────────────────────────────────────────

  /**
   * Resets all daily counters. Called by the `usage-reset-daily` alarm
   * in the background service worker.
   */
  async resetDailyCounts(): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    await chrome.storage.local.set({
      zovo_daily_counts: {
        date: today,
        curlCount: 0,
      },
    });
  }

  /**
   * Resets the monthly export counter for the given month.
   */
  private async resetMonthlyExportCount(currentMonth: string): Promise<void> {
    const { usage } = await chrome.storage.local.get('usage');
    await chrome.storage.local.set({
      usage: {
        ...(usage ?? {}),
        exports_this_month: 0,
        exports_month_reset: currentMonth,
      },
    });
  }

  /**
   * Resets the monthly GDPR scan counter for the given month.
   */
  private async resetMonthlyGdprCount(currentMonth: string): Promise<void> {
    const { usage } = await chrome.storage.local.get('usage');
    await chrome.storage.local.set({
      usage: {
        ...(usage ?? {}),
        gdpr_scans_used: 0,
        gdpr_scans_month_reset: currentMonth,
      },
    });
  }

  /**
   * Full reset of all counters. Used for debugging and testing.
   * NOT called in production except via developer tools.
   */
  async resetAllCounts(): Promise<void> {
    await this.resetDailyCounts();

    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    await chrome.storage.local.set({
      usage: {
        profiles_count: 0,
        rules_count: 0,
        exports_this_month: 0,
        exports_month_reset: currentMonth,
        gdpr_scans_used: 0,
        gdpr_scans_month_reset: currentMonth,
        bulk_ops_today: 0,
        bulk_ops_date_reset: new Date().toISOString().split('T')[0],
      },
    });
  }
}
```

### Background Service Worker Integration

The daily and monthly resets are triggered by Chrome alarms in the background service worker:

```typescript
// In background/service-worker.ts

import { FeatureUsageTracker } from '../shared/feature-usage-tracker';

const usageTracker = new FeatureUsageTracker();

// Register the daily reset alarm on install/startup
chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create('usage-reset-daily', {
    periodInMinutes: 60, // Check every hour; actual reset happens when date changes
  });

  chrome.alarms.create('usage-reset-monthly', {
    periodInMinutes: 1440, // Check every 24 hours
  });
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'usage-reset-daily') {
    // The tracker's getCurlCountToday() auto-resets when the date changes.
    // This alarm ensures the reset happens even if the popup is never opened.
    await usageTracker.resetDailyCounts();
  }

  if (alarm.name === 'usage-reset-monthly') {
    // Monthly counters auto-reset when the month changes in their respective
    // getter methods. This alarm is a safety net.
    await usageTracker.getExportCountThisMonth();
    await usageTracker.getGdprScanCountThisMonth();
  }
});
```

---

## 7. Integration Points

This section documents every location in the Cookie Manager codebase where a feature gate check is called. Each entry specifies the component, the user action that triggers the check, the gate function called, and the paywall trigger ID.

### 7.1 Popup Components

| Component | File | User Action | Gate Function | Trigger |
|-----------|------|-------------|---------------|---------|
| **ProfileManager** | `src/popup/components/ProfileManager.tsx` | Clicks "Save Profile" or "+" button | `canCreateProfile()` | T1 |
| **ProfileManager** | `src/popup/components/ProfileManager.tsx` | Toggles auto-load by URL pattern | `canUse('autoLoadProfiles')` | -- |
| **RuleEditor** | `src/popup/components/RuleEditor.tsx` | Clicks "Add Rule" button | `canCreateRule()` | T2 |
| **RuleEditor** | `src/popup/components/RuleEditor.tsx` | Selects regex or complex pattern type | `canUseAdvancedRulePattern()` | T2 |
| **RuleEditor** | `src/popup/components/RuleEditor.tsx` | Selects `timer` or `browser_start` trigger | `canUseRuleTrigger(trigger)` | T2 |
| **ExportPanel** | `src/popup/components/ExportPanel.tsx` | Clicks "Export" with cookie count > limit | `canExportCookies(count)` | T3 |
| **ExportPanel** | `src/popup/components/ExportPanel.tsx` | Selects non-JSON format in dropdown | `canExportFormat(format)` | T13 |
| **ExportPanel** | `src/popup/components/ExportPanel.tsx` | Clicks "Encrypted Export" or "Cookie Vault" | `canUseVault()` | T8 |
| **ImportPanel** | `src/popup/components/ImportPanel.tsx` | Imports file with >25 cookies | `canImportCookies(count)` | T14 |
| **ImportPanel** | `src/popup/components/ImportPanel.tsx` | Selects non-JSON import format | `canImportFormat(format)` | -- |
| **CookieList** | `src/popup/components/CookieList.tsx` | Selects >10 cookies (or any cross-domain) | `canBulkSelect(count, isCrossDomain)` | T4 |
| **CookieList** | `src/popup/components/CookieList.tsx` | Clicks "Select All" in global view | `canBulkSelect(totalCount, true)` | T4 |
| **CookieDetail** | `src/popup/components/CookieDetail.tsx` | Clicks "Copy as cURL" | `canGenerateCurl()` | -- |
| **CookieDetail** | `src/popup/components/CookieDetail.tsx` | Clicks "Protect" toggle | `canProtectCookie()` | -- |
| **SearchBar** | `src/popup/components/SearchBar.tsx` | Clicks regex toggle (`.*`) icon | `canUseRegexSearch()` | T7 |
| **SearchBar** | `src/popup/components/SearchBar.tsx` | Types pattern starting with `/` | `canUseRegexSearch()` | T7 |
| **SearchBar** | `src/popup/components/SearchBar.tsx` | Clicks "Save Filter" | `canSaveFilter()` | -- |
| **HealthScore** | `src/popup/components/HealthScore.tsx` | Clicks on blurred health card (index > 0) | `canViewHealthCard(cardIndex)` | T5 |
| **HealthScore** | `src/popup/components/HealthScore.tsx` | Clicks "Run Compliance Scan" | `canRunGdprScan()` | T6 |
| **HealthScore** | `src/popup/components/HealthScore.tsx` | Clicks on blurred GDPR results | `canViewFullGdprReport()` | T6 |

### 7.2 Popup Tab Navigation

| Tab | File | User Action | Gate Function | Trigger |
|-----|------|-------------|---------------|---------|
| **Monitor** | `src/popup/App.tsx` | Clicks "Monitor" tab | `canUseCookieMonitoring()` | T12 |
| **Snapshots** | `src/popup/App.tsx` | Clicks "Snapshots" tab or "Take Snapshot" | `canTakeSnapshot()` | T11 |

### 7.3 Settings / Options Page

| Component | File | User Action | Gate Function | Trigger |
|-----------|------|-------------|---------------|---------|
| **GeneralSettings** | `src/options/components/GeneralSettings.tsx` | Adds 6th whitelist domain | `canAddWhitelistDomain()` | T15 |
| **GeneralSettings** | `src/options/components/GeneralSettings.tsx` | Adds 6th blacklist domain | `canAddBlacklistDomain()` | T15 |
| **GeneralSettings** | `src/options/components/GeneralSettings.tsx` | Toggles "Sync Profiles" | `canUseCrossDeviceSync()` | T9 |
| **GeneralSettings** | `src/options/components/GeneralSettings.tsx` | Clicks "Open in Side Panel" | `canUseSidePanel()` | T16 |
| **AccountSettings** | `src/options/components/AccountSettings.tsx` | Clicks "Share with Team" | `canUseTeamSharing()` | T10 |
| **AccountSettings** | `src/options/components/AccountSettings.tsx` | Clicks "Team Library" or "Invite" | `canUseTeamManagement()` | T10 |

### 7.4 Background Service Worker

| Module | File | Trigger | Gate Function | Purpose |
|--------|------|---------|---------------|---------|
| **rules-engine** | `src/background/rules-engine.ts` | Timer or browser_start alarm fires | `canUseRuleTrigger(rule.trigger)` | Prevents free-tier rules from running with Pro-only triggers |
| **cookie-monitor** | `src/background/cookie-monitor.ts` | `chrome.cookies.onChanged` event | `canUseCookieMonitoring()` | Skips monitoring logic if user is not Pro+ |
| **sync-manager** | `src/background/sync-manager.ts` | `sync-poll` alarm fires | `canUseCrossDeviceSync()` | Skips API sync for free users |

### 7.5 Context Menu

| Action | File | User Action | Gate Function | Trigger |
|--------|------|-------------|---------------|---------|
| "Export as Netscape" | `src/background/context-menu.ts` | Right-click context menu | `canExportFormat('netscape')` | T13 |
| "Copy as cURL" | `src/background/context-menu.ts` | Right-click context menu | `canGenerateCurl()` | -- |
| "Protect Cookie" | `src/background/context-menu.ts` | Right-click context menu | `canProtectCookie()` | -- |

### 7.6 Integration Example: Complete Profile Save Flow

This example shows the full flow from user click to gate check to paywall or action execution, illustrating how all the pieces connect.

```typescript
// In src/popup/components/ProfileManager.tsx

import { canCreateProfile } from '../../shared/feature-gates';
import { withFeatureGate } from '../../shared/feature-gate-middleware';
import { shouldShowPaywall } from '../../shared/paywall-renderer';
import { PaywallController } from '../../shared/paywall-controller';
import { showPaywall } from '../paywall/PaywallModal';
import { analytics } from '../../analytics/zovo-analytics';
import { EVENTS } from '../../analytics/event-catalog';

async function handleSaveProfile(profileData: CookieProfile): Promise<void> {
  // Step 1: Feature gate check
  const gateResult = await canCreateProfile();

  if (!gateResult.allowed) {
    // Step 2: Check prerequisite -- has user loaded at least 1 profile?
    const { onboarding } = await chrome.storage.local.get('onboarding');
    if (!onboarding?.first_profile_loaded) {
      // Don't show paywall yet -- user hasn't experienced profile value
      showToast('Try loading one of your saved profiles first.');
      return;
    }

    // Step 3: Check paywall frequency limits
    const shouldShow = await shouldShowPaywall('T1', gateResult);
    if (shouldShow) {
      // Step 4: Render paywall
      showPaywall('T1', gateResult);

      // Step 5: Track the paywall impression
      await analytics.track(EVENTS.PAYWALL_SHOWN, {
        trigger: 'T1',
        tier: gateResult.tier,
        limit: gateResult.limit,
        current: gateResult.current,
      });
    }
    return;
  }

  // Step 6: Gate passed -- save the profile
  await saveProfileToStorage(profileData);

  // Step 7: Track the successful action
  await analytics.track(EVENTS.PROFILE_CREATED, {
    profileName: profileData.name,
    cookieCount: profileData.cookies.length,
  });

  // Step 8: Show usage counter update
  updateUsageCounter('profiles', gateResult.current! + 1, gateResult.limit!);
}
```

### 7.7 Integration Example: Export with Soft Paywall

```typescript
// In src/popup/components/ExportPanel.tsx

import {
  canExportCookies,
  canExportFormat,
  consumeOneTimeExportGift,
} from '../../shared/feature-gates';
import { checkAllGates } from '../../shared/feature-gate-middleware';
import { shouldShowPaywall } from '../../shared/paywall-renderer';
import { analytics } from '../../analytics/zovo-analytics';
import { EVENTS } from '../../analytics/event-catalog';
import { FeatureUsageTracker } from '../../shared/feature-usage-tracker';

const tracker = new FeatureUsageTracker();

async function handleExport(
  cookies: ChromeCookie[],
  format: string,
  domain: string
): Promise<void> {
  // Step 1: Check format gate first
  const formatResult = await canExportFormat(format);
  if (!formatResult.allowed) {
    const shouldShow = await shouldShowPaywall('T13', formatResult);
    if (shouldShow) {
      showFormatPaywall(formatResult);
    }
    return;
  }

  // Step 2: Check cookie count gate
  const countResult = await canExportCookies(cookies.length);

  // Step 3: Check for one-time gift
  const { zovo_onetime_full_export } = await chrome.storage.local.get(
    'zovo_onetime_full_export'
  );
  const isGiftExport = !zovo_onetime_full_export && !countResult.allowed;

  if (countResult.allowed || isGiftExport) {
    // Export all cookies
    await performExport(cookies, format);

    if (isGiftExport) {
      // Mark the gift as consumed
      await consumeOneTimeExportGift();

      // Show gift banner
      showGiftBanner(
        `You just exported all ${cookies.length} cookies. ` +
        `Normally, free accounts export up to 25 per domain. Enjoy this one on us.`
      );
    }

    // Track the export
    await tracker.incrementExportCount();
    await analytics.track(EVENTS.EXPORT_TRIGGERED, {
      format,
      cookieCount: cookies.length,
      domain,
      wasGift: isGiftExport,
    });
    return;
  }

  // Step 4: Soft paywall -- export first 25, show banner for the rest
  const freeCookies = cookies.slice(0, countResult.limit!);
  const lockedCookies = cookies.slice(countResult.limit!);

  await performExport(freeCookies, format);
  await tracker.incrementExportCount();

  // Show soft paywall with locked cookies
  const shouldShow = await shouldShowPaywall('T3', countResult);
  if (shouldShow) {
    showExportLimitBanner({
      exportedCount: freeCookies.length,
      lockedCount: lockedCookies.length,
      totalCount: cookies.length,
      gateResult: countResult,
    });
  }

  await analytics.track(EVENTS.EXPORT_TRIGGERED, {
    format,
    cookieCount: freeCookies.length,
    domain,
    limitHit: true,
    lockedCount: lockedCookies.length,
  });
}
```

### 7.8 Integration Example: Bulk Select with Progressive Gate

```typescript
// In src/popup/components/CookieList.tsx

import { canBulkSelect } from '../../shared/feature-gates';
import { TIER_LIMITS } from '../../shared/constants';
import { getCurrentTier } from '../../shared/tier-guard';

/**
 * Called every time a cookie checkbox is toggled.
 * Proactively checks whether the next selection would exceed the limit.
 */
async function handleCookieSelectionChange(
  selectedCookies: Set<string>,
  newCookieId: string,
  isCrossDomain: boolean
): Promise<boolean> {
  const newCount = selectedCookies.size + 1;

  const result = await canBulkSelect(newCount, isCrossDomain);

  if (!result.allowed) {
    // Don't add the cookie to the selection
    const shouldShow = await shouldShowPaywall('T4', result);
    if (shouldShow) {
      showPaywall('T4', result);
    } else {
      // Paywall is in cooldown -- show a brief toast instead
      const tier = await getCurrentTier();
      const limit = TIER_LIMITS[tier].maxBulkSelectCount;
      showToast(
        limit === 0
          ? 'Bulk operations require a paid plan.'
          : `Free tier allows selecting up to ${limit} cookies at once.`
      );
    }
    return false; // Selection not added
  }

  return true; // Selection allowed
}
```

---

## 8. Usage Counter UI Integration

Feature gates provide the data needed to render usage counters throughout the UI. These counters show the user how close they are to their tier limits, creating natural upgrade awareness.

```typescript
// src/popup/components/UsageCounter.tsx

import { h, FunctionalComponent } from 'preact';
import { CanUseResult, getCurrentTier } from '../../shared/tier-guard';
import { TIER_LIMITS, TIER_DISPLAY_NAMES, TierName } from '../../shared/constants';

interface UsageCounterProps {
  /** The feature key (e.g., 'maxProfiles') */
  featureKey: keyof typeof TIER_LIMITS.free;
  /** Current count (e.g., number of saved profiles) */
  current: number;
  /** Optional label override (defaults to feature key) */
  label?: string;
}

/**
 * Renders a usage counter like "2/2 profiles" with color coding.
 *
 * - Green: < 50% of limit
 * - Yellow: 50-99% of limit
 * - Red: at limit
 * - Hidden: when limit is -1 (unlimited) -- show plain count instead
 */
export const UsageCounter: FunctionalComponent<UsageCounterProps> = ({
  featureKey,
  current,
  label,
}) => {
  const [tier, setTier] = useState<TierName>('free');

  useEffect(() => {
    getCurrentTier().then(setTier);
  }, []);

  const limit = TIER_LIMITS[tier][featureKey] as number;

  // Unlimited: show plain count
  if (limit === -1) {
    return <span class="usage-counter usage-counter--unlimited">{current} {label}</span>;
  }

  // Determine color
  const ratio = limit > 0 ? current / limit : 1;
  const colorClass =
    ratio >= 1
      ? 'usage-counter--at-limit'
      : ratio >= 0.5
        ? 'usage-counter--warning'
        : 'usage-counter--ok';

  return (
    <span class={`usage-counter ${colorClass}`}>
      {current}/{limit} {label}
      {ratio >= 1 && (
        <span class="usage-counter__upgrade-hint">
          Upgrade to {TIER_DISPLAY_NAMES[findNextTier(tier)]}
        </span>
      )}
    </span>
  );
};

function findNextTier(current: TierName): TierName {
  const order: TierName[] = ['free', 'starter', 'pro', 'team'];
  const idx = order.indexOf(current);
  return idx < order.length - 1 ? order[idx + 1] : 'team';
}
```

---

## 9. Testing Utilities

A helper module for testing feature gates in development and automated tests.

```typescript
// src/shared/__tests__/tier-guard-test-utils.ts

import { TierName } from '../constants';

/**
 * Override the current tier for testing. Sets a mock zovo_auth object
 * in chrome.storage.sync. Call resetMockTier() to restore defaults.
 */
export async function setMockTier(tier: TierName): Promise<void> {
  await chrome.storage.sync.set({
    zovo_auth: {
      tier,
      token: 'mock-token',
      refresh_token: 'mock-refresh',
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      user_id: 'mock-user-id',
      email: 'test@example.com',
      authenticated_at: new Date().toISOString(),
    },
  });
}

/**
 * Reset to free tier (remove auth).
 */
export async function resetMockTier(): Promise<void> {
  await chrome.storage.sync.remove('zovo_auth');
}

/**
 * Set mock usage counts for testing limit boundaries.
 */
export async function setMockUsage(overrides: {
  profileCount?: number;
  ruleCount?: number;
  whitelistCount?: number;
  blacklistCount?: number;
  gdprScans?: number;
  curlCount?: number;
}): Promise<void> {
  if (overrides.profileCount !== undefined) {
    const profiles = Array.from({ length: overrides.profileCount }, (_, i) => ({
      id: `mock-profile-${i}`,
      name: `Test Profile ${i}`,
      domain: 'example.com',
      cookies: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));
    await chrome.storage.local.set({ profiles });
  }

  if (overrides.ruleCount !== undefined) {
    const rules = Array.from({ length: overrides.ruleCount }, (_, i) => ({
      id: `mock-rule-${i}`,
      name: `Test Rule ${i}`,
      pattern: `*.test${i}.com`,
      trigger: 'tab_close',
      exceptions: [],
      delete_first_party: true,
      delete_third_party: true,
      enabled: true,
      created_at: new Date().toISOString(),
    }));
    await chrome.storage.local.set({ rules });
  }

  if (overrides.whitelistCount !== undefined || overrides.blacklistCount !== undefined) {
    const { domain_lists } = await chrome.storage.sync.get('domain_lists');
    const updated = { ...(domain_lists ?? { whitelist: [], blacklist: [] }) };
    if (overrides.whitelistCount !== undefined) {
      updated.whitelist = Array.from(
        { length: overrides.whitelistCount },
        (_, i) => `whitelist${i}.com`
      );
    }
    if (overrides.blacklistCount !== undefined) {
      updated.blacklist = Array.from(
        { length: overrides.blacklistCount },
        (_, i) => `blacklist${i}.com`
      );
    }
    await chrome.storage.sync.set({ domain_lists: updated });
  }

  if (overrides.gdprScans !== undefined) {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const { usage } = await chrome.storage.local.get('usage');
    await chrome.storage.local.set({
      usage: {
        ...(usage ?? {}),
        gdpr_scans_used: overrides.gdprScans,
        gdpr_scans_month_reset: currentMonth,
      },
    });
  }

  if (overrides.curlCount !== undefined) {
    const today = new Date().toISOString().split('T')[0];
    await chrome.storage.local.set({
      zovo_daily_counts: { date: today, curlCount: overrides.curlCount },
    });
  }
}
```

---

*End of Agent 4 feature gating specification. This document provides the complete `TIER_LIMITS` constant, `canUse()` function, per-feature gate implementations, middleware patterns, paywall strategy mapping, usage tracking module, codebase integration points, and testing utilities for the Zovo Cookie Manager extension.*
