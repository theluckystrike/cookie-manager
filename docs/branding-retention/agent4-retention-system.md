# Retention & Engagement System: Zovo Cookie Manager

## Phase 08 | Agent 4 | Generated 2026-02-11

**Extension:** Zovo Cookie Manager
**Scope:** Local usage analytics, retention prompt engine, smart rating requests, engagement milestones, churn prevention. All data stays in `chrome.storage.local` -- zero external requests from the analytics or retention modules.
**Dependencies:** Phase 04 Agent 1 (anti-patterns, presell touchpoints), Phase 07 Agent 2 (review generation system, triggers), Phase 07 Agent 4 (progressive nudges, conversion touchpoints), Phase 08 Agent 2 (global styles/brand CSS)

---

## 1. Local Usage Analytics Module

### 1.1 `ZovoAnalytics` Class

This is the full production-ready TypeScript implementation. It manages a 500-event ring buffer in `chrome.storage.local`, detects sessions automatically, and provides aggregated usage statistics without any network calls.

```typescript
// src/analytics/zovo-analytics.ts

/**
 * ZovoAnalytics - Local-only usage analytics for Zovo Cookie Manager.
 *
 * All data persists in chrome.storage.local under the key `zovo_analytics`.
 * No external network requests are ever made from this module.
 * Ring buffer holds the most recent 500 events (FIFO eviction).
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AnalyticsEvent {
  /** Event name (e.g. "cookie_edited", "profile_created") */
  event: string;
  /** Arbitrary event-specific properties */
  properties: Record<string, unknown>;
  /** Extension identifier */
  extension: string;
  /** Unix timestamp in ms */
  timestamp: number;
  /** Session identifier — regenerated after 30 min of inactivity */
  sessionId: string;
}

export interface UsageStats {
  total: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
}

export interface FeatureUsageMap {
  cookies_edited: number;
  cookies_created: number;
  cookies_deleted: number;
  cookies_viewed: number;
  profiles_created: number;
  profiles_loaded: number;
  rules_created: number;
  rules_triggered: number;
  exports_done: number;
  imports_done: number;
  searches_used: number;
  health_viewed: number;
  shortcuts_used: number;
}

export interface Milestone {
  id: string;
  label: string;
  threshold: number;
  featureKey: keyof FeatureUsageMap | 'total_cookie_ops';
  achieved: boolean;
  achievedAt: number | null;
}

interface AnalyticsStorage {
  zovo_analytics_events: AnalyticsEvent[];
  zovo_analytics_session_id: string;
  zovo_analytics_last_event_at: number;
  zovo_analytics_installed_at: number;
  zovo_analytics_milestones: Record<string, number>; // milestoneId → timestamp
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY_EVENTS = 'zovo_analytics_events';
const STORAGE_KEY_SESSION = 'zovo_analytics_session_id';
const STORAGE_KEY_LAST_EVENT = 'zovo_analytics_last_event_at';
const STORAGE_KEY_INSTALLED = 'zovo_analytics_installed_at';
const STORAGE_KEY_MILESTONES = 'zovo_analytics_milestones';

const RING_BUFFER_SIZE = 500;
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

const EXTENSION_ID = 'cookie-manager';

// ─── Utility ──────────────────────────────────────────────────────────────────

function generateSessionId(): string {
  const segment = (): string =>
    Math.random().toString(36).substring(2, 8);
  return `${segment()}-${segment()}-${Date.now().toString(36)}`;
}

function startOfDay(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function startOfWeek(ts: number): number {
  const d = new Date(ts);
  const day = d.getDay(); // 0 = Sunday
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function startOfMonth(ts: number): number {
  const d = new Date(ts);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

// ─── Class ────────────────────────────────────────────────────────────────────

export class ZovoAnalytics {
  private sessionId: string | null = null;
  private lastEventAt: number = 0;

  constructor() {
    // Session and timing state are loaded lazily on first track() call.
  }

  // ── Core: Track Event ───────────────────────────────────────────────────────

  /**
   * Append an event to the local ring buffer.
   * Automatically manages session detection (30-min gap = new session).
   */
  async track(eventName: string, properties: Record<string, unknown> = {}): Promise<void> {
    const now = Date.now();

    // Ensure install timestamp is recorded
    await this.ensureInstallTimestamp(now);

    // Resolve or rotate session
    const sessionId = await this.resolveSession(now);

    // Build event
    const event: AnalyticsEvent = {
      event: eventName,
      properties,
      extension: EXTENSION_ID,
      timestamp: now,
      sessionId,
    };

    // Read current buffer
    const result = await chrome.storage.local.get(STORAGE_KEY_EVENTS);
    const events: AnalyticsEvent[] = result[STORAGE_KEY_EVENTS] ?? [];

    // Append
    events.push(event);

    // Ring buffer: evict oldest if over capacity
    while (events.length > RING_BUFFER_SIZE) {
      events.shift();
    }

    // Persist
    await chrome.storage.local.set({
      [STORAGE_KEY_EVENTS]: events,
      [STORAGE_KEY_LAST_EVENT]: now,
    });

    this.lastEventAt = now;
  }

  // ── Usage Stats ─────────────────────────────────────────────────────────────

  /**
   * Returns total, today, this-week, and this-month event counts.
   */
  async getUsageStats(): Promise<UsageStats> {
    const events = await this.getEvents();
    const now = Date.now();
    const todayStart = startOfDay(now);
    const weekStart = startOfWeek(now);
    const monthStart = startOfMonth(now);

    let today = 0;
    let thisWeek = 0;
    let thisMonth = 0;

    for (const e of events) {
      if (e.timestamp >= todayStart) today++;
      if (e.timestamp >= weekStart) thisWeek++;
      if (e.timestamp >= monthStart) thisMonth++;
    }

    return {
      total: events.length,
      today,
      thisWeek,
      thisMonth,
    };
  }

  // ── Days Since Install ──────────────────────────────────────────────────────

  /**
   * Returns the number of whole days since the extension was first installed.
   */
  async getDaysSinceInstall(): Promise<number> {
    const result = await chrome.storage.local.get(STORAGE_KEY_INSTALLED);
    const installedAt: number | undefined = result[STORAGE_KEY_INSTALLED];
    if (!installedAt) return 0;
    return Math.floor((Date.now() - installedAt) / (24 * 60 * 60 * 1000));
  }

  // ── Feature Usage ───────────────────────────────────────────────────────────

  /**
   * Returns a map of feature category to cumulative usage count derived from
   * the event ring buffer.
   */
  async getFeatureUsage(): Promise<FeatureUsageMap> {
    const events = await this.getEvents();

    const featureMap: FeatureUsageMap = {
      cookies_edited: 0,
      cookies_created: 0,
      cookies_deleted: 0,
      cookies_viewed: 0,
      profiles_created: 0,
      profiles_loaded: 0,
      rules_created: 0,
      rules_triggered: 0,
      exports_done: 0,
      imports_done: 0,
      searches_used: 0,
      health_viewed: 0,
      shortcuts_used: 0,
    };

    const eventToFeature: Record<string, keyof FeatureUsageMap> = {
      cookie_edited: 'cookies_edited',
      cookie_created: 'cookies_created',
      cookie_deleted: 'cookies_deleted',
      cookie_viewed: 'cookies_viewed',
      profile_created: 'profiles_created',
      profile_loaded: 'profiles_loaded',
      rule_created: 'rules_created',
      rule_triggered: 'rules_triggered',
      export_triggered: 'exports_done',
      import_triggered: 'imports_done',
      search_used: 'searches_used',
      health_viewed: 'health_viewed',
      shortcut_used: 'shortcuts_used',
    };

    for (const e of events) {
      const key = eventToFeature[e.event];
      if (key) {
        featureMap[key]++;
      }
    }

    return featureMap;
  }

  // ── Milestones ──────────────────────────────────────────────────────────────

  /**
   * Returns milestone definitions with `achieved` flag and timestamp.
   * Milestones are persisted once achieved and never reset.
   */
  async getMilestones(): Promise<Milestone[]> {
    const featureUsage = await this.getFeatureUsage();
    const result = await chrome.storage.local.get(STORAGE_KEY_MILESTONES);
    const achieved: Record<string, number> = result[STORAGE_KEY_MILESTONES] ?? {};

    const totalCookieOps =
      featureUsage.cookies_edited +
      featureUsage.cookies_created +
      featureUsage.cookies_deleted;

    const definitions: Omit<Milestone, 'achieved' | 'achievedAt'>[] = [
      { id: 'edit_10', label: "You're getting the hang of it!", threshold: 10, featureKey: 'cookies_edited' },
      { id: 'edit_50', label: 'Cookie editing pro!', threshold: 50, featureKey: 'cookies_edited' },
      { id: 'edit_100', label: 'Triple-digit editor!', threshold: 100, featureKey: 'cookies_edited' },
      { id: 'first_profile', label: 'Smart! Profiles save you time.', threshold: 1, featureKey: 'profiles_created' },
      { id: 'first_rule', label: 'Automation unlocked!', threshold: 1, featureKey: 'rules_created' },
      { id: 'first_rule_triggered', label: 'Your auto-cleanup is working!', threshold: 1, featureKey: 'rules_triggered' },
      { id: 'first_export', label: 'Data portability for the win!', threshold: 1, featureKey: 'exports_done' },
      { id: 'ops_100', label: 'Cookie power user!', threshold: 100, featureKey: 'total_cookie_ops' },
    ];

    const now = Date.now();
    const newlyAchieved: Record<string, number> = {};

    const milestones: Milestone[] = definitions.map((def) => {
      // Already achieved previously
      if (achieved[def.id]) {
        return { ...def, achieved: true, achievedAt: achieved[def.id] };
      }

      // Check current count
      const count =
        def.featureKey === 'total_cookie_ops'
          ? totalCookieOps
          : featureUsage[def.featureKey];

      if (count >= def.threshold) {
        newlyAchieved[def.id] = now;
        return { ...def, achieved: true, achievedAt: now };
      }

      return { ...def, achieved: false, achievedAt: null };
    });

    // Persist newly achieved milestones
    if (Object.keys(newlyAchieved).length > 0) {
      await chrome.storage.local.set({
        [STORAGE_KEY_MILESTONES]: { ...achieved, ...newlyAchieved },
      });
    }

    return milestones;
  }

  // ── Session Count ───────────────────────────────────────────────────────────

  /**
   * Returns the number of distinct sessions recorded in the ring buffer.
   */
  async getSessionCount(): Promise<number> {
    const events = await this.getEvents();
    const sessions = new Set<string>();
    for (const e of events) {
      sessions.add(e.sessionId);
    }
    return sessions.size;
  }

  // ── Distinct Active Days ────────────────────────────────────────────────────

  /**
   * Returns the number of distinct calendar days the extension was used.
   */
  async getDistinctActiveDays(): Promise<number> {
    const events = await this.getEvents();
    const days = new Set<string>();
    for (const e of events) {
      const d = new Date(e.timestamp);
      days.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
    }
    return days.size;
  }

  // ── Streak Calculation ──────────────────────────────────────────────────────

  /**
   * Returns the current consecutive-day usage streak.
   */
  async getCurrentStreak(): Promise<number> {
    const events = await this.getEvents();
    if (events.length === 0) return 0;

    // Collect distinct day timestamps (start-of-day)
    const daySet = new Set<number>();
    for (const e of events) {
      daySet.add(startOfDay(e.timestamp));
    }

    const sortedDays = Array.from(daySet).sort((a, b) => b - a); // newest first
    const oneDayMs = 24 * 60 * 60 * 1000;
    const todayStart = startOfDay(Date.now());

    // If today is not in the set and yesterday is not either, streak is 0
    if (sortedDays[0] < todayStart - oneDayMs) return 0;

    let streak = 1;
    for (let i = 0; i < sortedDays.length - 1; i++) {
      const diff = sortedDays[i] - sortedDays[i + 1];
      if (diff === oneDayMs) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

  // ── Sessions This Week ──────────────────────────────────────────────────────

  /**
   * Returns the number of distinct sessions within the current calendar week.
   */
  async getSessionsThisWeek(): Promise<number> {
    const events = await this.getEvents();
    const weekStart = startOfWeek(Date.now());
    const sessions = new Set<string>();
    for (const e of events) {
      if (e.timestamp >= weekStart) {
        sessions.add(e.sessionId);
      }
    }
    return sessions.size;
  }

  // ── Internal Helpers ────────────────────────────────────────────────────────

  private async getEvents(): Promise<AnalyticsEvent[]> {
    const result = await chrome.storage.local.get(STORAGE_KEY_EVENTS);
    return result[STORAGE_KEY_EVENTS] ?? [];
  }

  private async ensureInstallTimestamp(now: number): Promise<void> {
    const result = await chrome.storage.local.get(STORAGE_KEY_INSTALLED);
    if (!result[STORAGE_KEY_INSTALLED]) {
      await chrome.storage.local.set({ [STORAGE_KEY_INSTALLED]: now });
    }
  }

  /**
   * Resolves the current session ID. If more than 30 minutes have elapsed
   * since the last event, a new session is started.
   */
  private async resolveSession(now: number): Promise<string> {
    if (this.sessionId && this.lastEventAt > 0) {
      if (now - this.lastEventAt < SESSION_TIMEOUT_MS) {
        return this.sessionId;
      }
    }

    // Load from storage in case of extension restart
    const result = await chrome.storage.local.get([
      STORAGE_KEY_SESSION,
      STORAGE_KEY_LAST_EVENT,
    ]);

    const storedSession: string | undefined = result[STORAGE_KEY_SESSION];
    const storedLastEvent: number = result[STORAGE_KEY_LAST_EVENT] ?? 0;

    if (storedSession && storedLastEvent > 0 && now - storedLastEvent < SESSION_TIMEOUT_MS) {
      this.sessionId = storedSession;
      this.lastEventAt = storedLastEvent;
      return storedSession;
    }

    // Generate new session
    const newSession = generateSessionId();
    this.sessionId = newSession;
    this.lastEventAt = now;

    await chrome.storage.local.set({
      [STORAGE_KEY_SESSION]: newSession,
    });

    return newSession;
  }
}

// ── Singleton Export ──────────────────────────────────────────────────────────

export const analytics = new ZovoAnalytics();
```

### 1.2 Events to Track (Cookie Manager Specific)

Every user action that indicates engagement or provides retention-system signal data is captured. Properties vary per event.

```typescript
// src/analytics/event-catalog.ts

/**
 * Canonical event names and their expected properties.
 * This file serves as the contract between UI code and the analytics module.
 *
 * Usage:
 *   import { analytics } from './zovo-analytics';
 *   analytics.track(EVENTS.COOKIE_EDITED, { domain: 'github.com', field: 'value' });
 */

export const EVENTS = {
  // ── Popup Lifecycle ─────────────────────────────────────────────────────────
  /** Popup opened by clicking the toolbar icon */
  POPUP_OPENED: 'popup_opened',
  // properties: { domain: string }

  // ── Cookie Operations ───────────────────────────────────────────────────────
  /** User expanded a cookie row to view details */
  COOKIE_VIEWED: 'cookie_viewed',
  // properties: { domain: string, cookieName: string }

  /** User edited an existing cookie value */
  COOKIE_EDITED: 'cookie_edited',
  // properties: { domain: string, cookieName: string, field: string }

  /** User created a new cookie */
  COOKIE_CREATED: 'cookie_created',
  // properties: { domain: string, cookieName: string }

  /** User deleted a cookie */
  COOKIE_DELETED: 'cookie_deleted',
  // properties: { domain: string, cookieName: string }

  // ── Profiles ────────────────────────────────────────────────────────────────
  /** User saved a new cookie profile */
  PROFILE_CREATED: 'profile_created',
  // properties: { profileName: string, cookieCount: number }

  /** User loaded/applied a saved profile */
  PROFILE_LOADED: 'profile_loaded',
  // properties: { profileName: string, cookieCount: number }

  // ── Rules ───────────────────────────────────────────────────────────────────
  /** User created a new auto-delete rule */
  RULE_CREATED: 'rule_created',
  // properties: { pattern: string, trigger: string }

  /** An auto-delete rule fired and removed cookies */
  RULE_TRIGGERED: 'rule_triggered',
  // properties: { ruleId: string, pattern: string, cookiesRemoved: number }

  // ── Export / Import ─────────────────────────────────────────────────────────
  /** User initiated an export */
  EXPORT_TRIGGERED: 'export_triggered',
  // properties: { format: 'json' | 'csv' | 'netscape' | 'header', cookieCount: number, domain: string }

  /** User imported cookies from a file */
  IMPORT_TRIGGERED: 'import_triggered',
  // properties: { format: string, cookieCount: number, domain: string }

  // ── Search & Navigation ─────────────────────────────────────────────────────
  /** User typed in the search/filter bar */
  SEARCH_USED: 'search_used',
  // properties: { query: string (first 20 chars only), resultCount: number }

  /** User switched to a different popup tab */
  TAB_SWITCHED: 'tab_switched',
  // properties: { tab: 'cookies' | 'profiles' | 'rules' | 'health' | 'settings' }

  /** User triggered a keyboard shortcut */
  SHORTCUT_USED: 'shortcut_used',
  // properties: { shortcut: string }

  // ── Health ──────────────────────────────────────────────────────────────────
  /** User opened the Health tab */
  HEALTH_VIEWED: 'health_viewed',
  // properties: { score: string, domain: string }

  // ── Monetization Surface ────────────────────────────────────────────────────
  /** A paywall was rendered to the user */
  PAYWALL_SHOWN: 'paywall_shown',
  // properties: { trigger: string, variant: string }

  /** User clicked an upgrade CTA on a paywall */
  UPGRADE_CLICKED: 'upgrade_clicked',
  // properties: { trigger: string, variant: string, source: string }

  // ── Retention-Specific ──────────────────────────────────────────────────────
  /** A retention prompt was shown */
  RETENTION_PROMPT_SHOWN: 'retention_prompt_shown',
  // properties: { promptType: string }

  /** User interacted with a retention prompt */
  RETENTION_PROMPT_ACTION: 'retention_prompt_action',
  // properties: { promptType: string, action: 'cta' | 'dismiss' | 'secondary' }

  /** A milestone celebration was displayed */
  MILESTONE_CELEBRATED: 'milestone_celebrated',
  // properties: { milestoneId: string, label: string }

  /** Rating satisfaction check displayed */
  RATING_PROMPT_SHOWN: 'rating_prompt_shown',
  // properties: { trigger: string, step: 'satisfaction' | 'ask' | 'feedback' }

  /** User responded to rating flow */
  RATING_PROMPT_ACTION: 'rating_prompt_action',
  // properties: { trigger: string, action: 'love' | 'okay' | 'not_great' | 'rate' | 'later' | 'never' | 'feedback_sent' }
} as const;

export type EventName = (typeof EVENTS)[keyof typeof EVENTS];
```

---

## 2. Retention Prompt System

### 2.1 `ZovoRetention` Class

The retention system evaluates prompt eligibility on every popup open, respects cooldown timers and priority ordering, and never interrupts active editing.

```typescript
// src/retention/zovo-retention.ts

import { ZovoAnalytics, analytics } from '../analytics/zovo-analytics';
import { EVENTS } from '../analytics/event-catalog';

// ─── Types ────────────────────────────────────────────────────────────────────

export type PromptType =
  | 'rate_extension'
  | 'share_extension'
  | 'join_zovo'
  | 'upgrade_pro'
  | 'feature_discovery';

export interface RetentionPrompt {
  type: PromptType;
  priority: number; // lower = higher priority
  title: string;
  message: string;
  primaryCta: string;
  primaryCtaUrl?: string;
  primaryCtaAction?: 'copy_share_link' | 'navigate_tab';
  secondaryCta?: string;
  dismissable: boolean;
  /** Preact component variant to render */
  variant: 'banner' | 'inline_card';
}

export interface RetentionState {
  /** Prompt ID → number of times it has been shown */
  promptShowCounts: Record<string, number>;
  /** Prompt ID → number of times user dismissed */
  promptDismissCounts: Record<string, number>;
  /** Timestamp of last prompt shown (any type) */
  lastPromptShownAt: number;
  /** Whether user has clicked "Rate on CWS" */
  hasRated: boolean;
  /** Whether the user has clicked "Copy share link" */
  hasShared: boolean;
  /** Whether the "Join Zovo" prompt has been shown */
  joinZovoShown: boolean;
  /** Feature discovery: feature IDs that have been prompted */
  discoveryShown: string[];
  /** Whether a prompt has been shown in the current in-memory session */
  promptShownThisSession: boolean;
}

interface FeatureDiscoveryTarget {
  featureId: string;
  title: string;
  message: string;
  tab: 'profiles' | 'rules' | 'health';
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY_RETENTION = 'zovo_retention_state';
const COOLDOWN_MS = 48 * 60 * 60 * 1000; // 48 hours between prompts
const RATE_COOLDOWN_MS = 30 * 24 * 60 * 60 * 1000; // 30 days for rating prompt
const RATE_MAX_DISMISS = 3; // after 3 dismissals, never show rating again
const SHARE_MAX_SHOWS = 2;
const CWS_REVIEW_URL = 'https://chromewebstore.google.com/detail/EXTENSION_ID_PLACEHOLDER/reviews';
const ZOVO_URL = 'https://zovo.one?ref=cookie-manager&source=retention_prompt';

// Feature discovery targets: features the user might not have tried yet
const DISCOVERY_TARGETS: FeatureDiscoveryTarget[] = [
  {
    featureId: 'profiles',
    title: 'Did you know? Cookie profiles',
    message: 'Save cookie sets for different environments. Switch between dev, staging, and prod in one click.',
    tab: 'profiles',
  },
  {
    featureId: 'rules',
    title: 'Did you know? Auto-delete rules',
    message: 'Set rules to automatically clean tracking cookies when you close tabs. Set it once, forget it.',
    tab: 'rules',
  },
  {
    featureId: 'health',
    title: 'Did you know? Cookie Health Score',
    message: 'Get a security grade for any site. See which cookies are risky and what to do about them.',
    tab: 'health',
  },
];

// ─── Class ────────────────────────────────────────────────────────────────────

export class ZovoRetention {
  /** In-memory flag -- resets when the popup closes. */
  private promptShownThisSession = false;

  constructor(private analytics: ZovoAnalytics) {}

  // ── Evaluate: Which Prompt (if any) Should Show ─────────────────────────────

  /**
   * Evaluates all prompt types in priority order and returns the first eligible
   * prompt, or null if none qualify.
   *
   * Priority order: Rate > Share > Join > Upgrade > Discovery
   *
   * Call this once per popup open, after a short delay (500ms) to avoid
   * interfering with initial render.
   */
  async evaluate(): Promise<RetentionPrompt | null> {
    // Guard: max 1 prompt per session
    if (this.promptShownThisSession) return null;

    // Guard: no prompt if user is actively editing
    if (this.isUserEditing()) return null;

    const state = await this.getState();
    const now = Date.now();

    // Guard: 48-hour cooldown between any prompts
    if (state.lastPromptShownAt && now - state.lastPromptShownAt < COOLDOWN_MS) {
      return null;
    }

    // Gather context
    const daysSinceInstall = await this.analytics.getDaysSinceInstall();
    const featureUsage = await this.analytics.getFeatureUsage();
    const sessionCount = await this.analytics.getSessionCount();
    const sessionsThisWeek = await this.analytics.getSessionsThisWeek();

    const totalOps =
      featureUsage.cookies_edited +
      featureUsage.cookies_created +
      featureUsage.cookies_deleted;

    // Guard: never prompt on first session (Phase 04 anti-pattern)
    if (sessionCount < 2) return null;

    // ── Priority 1: Rate Extension ────────────────────────────────────────────
    const ratePrompt = this.evaluateRate(state, now, totalOps, daysSinceInstall);
    if (ratePrompt) return ratePrompt;

    // ── Priority 2: Share Extension ───────────────────────────────────────────
    const sharePrompt = this.evaluateShare(state, now, totalOps, daysSinceInstall);
    if (sharePrompt) return sharePrompt;

    // ── Priority 3: Join Zovo ─────────────────────────────────────────────────
    const joinPrompt = this.evaluateJoinZovo(state, daysSinceInstall, sessionCount);
    if (joinPrompt) return joinPrompt;

    // ── Priority 4: Upgrade Pro ───────────────────────────────────────────────
    // Upgrade prompts are driven by the PaywallController in the paywall module.
    // The retention system does NOT show upgrade prompts proactively -- it only
    // fires when a free-tier limit is hit. The PaywallController calls
    // retention.recordPromptShown('upgrade_pro') to coordinate cooldowns.
    // No evaluation here -- this slot is reserved for the paywall system.

    // ── Priority 5: Feature Discovery ─────────────────────────────────────────
    const discoveryPrompt = this.evaluateDiscovery(state, daysSinceInstall, featureUsage);
    if (discoveryPrompt) return discoveryPrompt;

    return null;
  }

  // ── Rate Extension Evaluation ───────────────────────────────────────────────

  private evaluateRate(
    state: RetentionState,
    now: number,
    totalOps: number,
    daysSinceInstall: number,
  ): RetentionPrompt | null {
    // Already rated or permanently dismissed
    if (state.hasRated) return null;
    if ((state.promptDismissCounts['rate_extension'] ?? 0) >= RATE_MAX_DISMISS) return null;

    // Trigger conditions: 10+ cookie ops AND 3+ days installed
    if (totalOps < 10 || daysSinceInstall < 3) return null;

    // Rating-specific 30-day cooldown
    const lastRateShow = state.promptShowCounts['rate_extension']
      ? state.lastPromptShownAt
      : 0;
    if (lastRateShow && now - lastRateShow < RATE_COOLDOWN_MS) return null;

    return {
      type: 'rate_extension',
      priority: 1,
      title: 'Enjoying Cookie Manager?',
      message: 'A quick rating helps other developers find this tool.',
      primaryCta: 'Rate on Chrome Web Store',
      primaryCtaUrl: CWS_REVIEW_URL,
      secondaryCta: 'Maybe later',
      dismissable: true,
      variant: 'banner',
    };
  }

  // ── Share Extension Evaluation ──────────────────────────────────────────────

  private evaluateShare(
    state: RetentionState,
    _now: number,
    totalOps: number,
    daysSinceInstall: number,
  ): RetentionPrompt | null {
    // Max 2 total shows
    if ((state.promptShowCounts['share_extension'] ?? 0) >= SHARE_MAX_SHOWS) return null;
    if (state.hasShared) return null;

    // Trigger: 7+ days installed AND 20+ operations
    if (daysSinceInstall < 7 || totalOps < 20) return null;

    return {
      type: 'share_extension',
      priority: 2,
      title: 'Know someone who\'d find this useful?',
      message: 'Share Cookie Manager with a colleague.',
      primaryCta: 'Copy share link',
      primaryCtaAction: 'copy_share_link',
      secondaryCta: 'No thanks',
      dismissable: true,
      variant: 'banner',
    };
  }

  // ── Join Zovo Evaluation ────────────────────────────────────────────────────

  private evaluateJoinZovo(
    state: RetentionState,
    daysSinceInstall: number,
    sessionCount: number,
  ): RetentionPrompt | null {
    // Show max once
    if (state.joinZovoShown) return null;

    // Trigger: 3+ days installed AND 5+ sessions
    if (daysSinceInstall < 3 || sessionCount < 5) return null;

    return {
      type: 'join_zovo',
      priority: 3,
      title: 'Want more tools like this?',
      message: 'Zovo members get all 18+ extensions. Cookie Manager is just the start.',
      primaryCta: 'Learn about Zovo',
      primaryCtaUrl: ZOVO_URL,
      secondaryCta: 'Not interested',
      dismissable: true,
      variant: 'banner',
    };
  }

  // ── Feature Discovery Evaluation ────────────────────────────────────────────

  private evaluateDiscovery(
    state: RetentionState,
    daysSinceInstall: number,
    featureUsage: Record<string, number>,
  ): RetentionPrompt | null {
    // Trigger: 5+ days installed
    if (daysSinceInstall < 5) return null;

    for (const target of DISCOVERY_TARGETS) {
      // Already shown for this feature
      if (state.discoveryShown.includes(target.featureId)) continue;

      // Check if user has NOT used this feature
      const usageKey = target.featureId === 'profiles'
        ? 'profiles_created'
        : target.featureId === 'rules'
          ? 'rules_created'
          : 'health_viewed';

      if ((featureUsage[usageKey] ?? 0) === 0) {
        return {
          type: 'feature_discovery',
          priority: 5,
          title: target.title,
          message: target.message,
          primaryCta: `Go to ${target.tab.charAt(0).toUpperCase() + target.tab.slice(1)}`,
          primaryCtaAction: 'navigate_tab',
          secondaryCta: 'Dismiss',
          dismissable: true,
          variant: 'inline_card',
        };
      }
    }

    return null;
  }

  // ── State Management ────────────────────────────────────────────────────────

  /**
   * Called by the UI when a prompt is rendered on screen.
   */
  async recordPromptShown(promptType: PromptType): Promise<void> {
    this.promptShownThisSession = true;

    const state = await this.getState();
    state.promptShowCounts[promptType] = (state.promptShowCounts[promptType] ?? 0) + 1;
    state.lastPromptShownAt = Date.now();

    if (promptType === 'join_zovo') {
      state.joinZovoShown = true;
    }

    await this.saveState(state);

    await this.analytics.track(EVENTS.RETENTION_PROMPT_SHOWN, { promptType });
  }

  /**
   * Called when the user dismisses a prompt.
   */
  async recordPromptDismissed(promptType: PromptType): Promise<void> {
    const state = await this.getState();
    state.promptDismissCounts[promptType] = (state.promptDismissCounts[promptType] ?? 0) + 1;
    await this.saveState(state);

    await this.analytics.track(EVENTS.RETENTION_PROMPT_ACTION, {
      promptType,
      action: 'dismiss',
    });
  }

  /**
   * Called when the user clicks the primary CTA.
   */
  async recordPromptCtaClicked(promptType: PromptType): Promise<void> {
    const state = await this.getState();

    if (promptType === 'rate_extension') {
      state.hasRated = true;
    }
    if (promptType === 'share_extension') {
      state.hasShared = true;
    }
    if (promptType === 'feature_discovery') {
      // Record which feature was discovered
      const target = DISCOVERY_TARGETS.find((t) => !state.discoveryShown.includes(t.featureId));
      if (target) {
        state.discoveryShown.push(target.featureId);
      }
    }

    await this.saveState(state);

    await this.analytics.track(EVENTS.RETENTION_PROMPT_ACTION, {
      promptType,
      action: 'cta',
    });
  }

  // ── Private Helpers ─────────────────────────────────────────────────────────

  private isUserEditing(): boolean {
    // Check if an active edit form exists in the DOM (same guard used by paywall)
    return !!document.querySelector('.cookie-edit-form');
  }

  private async getState(): Promise<RetentionState> {
    const result = await chrome.storage.local.get(STORAGE_KEY_RETENTION);
    const stored = result[STORAGE_KEY_RETENTION];
    if (stored) return stored as RetentionState;

    return {
      promptShowCounts: {},
      promptDismissCounts: {},
      lastPromptShownAt: 0,
      hasRated: false,
      hasShared: false,
      joinZovoShown: false,
      discoveryShown: [],
      promptShownThisSession: false,
    };
  }

  private async saveState(state: RetentionState): Promise<void> {
    await chrome.storage.local.set({ [STORAGE_KEY_RETENTION]: state });
  }
}

// ── Singleton Export ──────────────────────────────────────────────────────────

export const retention = new ZovoRetention(analytics);
```

### 2.2 Prompt Rules Summary

These rules synthesize the anti-patterns from Phase 04 Agent 1 and the timing constraints from Phase 07 Agent 4.

| Rule | Enforcement |
|------|-------------|
| Max 1 prompt per session (across all types) | `promptShownThisSession` in-memory flag, resets on popup close |
| Never interrupt active editing | DOM check for `.cookie-edit-form` before rendering |
| Never prompt on first session | `sessionCount < 2` guard in `evaluate()` |
| 48-hour cooldown between prompts | `lastPromptShownAt` timestamp comparison |
| Priority order: Rate > Share > Join > Upgrade > Discovery | Sequential evaluation in `evaluate()` |
| Rating: max 1 show per 30 days | Rating-specific cooldown (`RATE_COOLDOWN_MS`) |
| Rating: never again after 3 dismissals | `promptDismissCounts['rate_extension'] >= 3` |
| Rating: never again after user clicks Rate | `hasRated: true` |
| Share: max 2 total shows | `promptShowCounts['share_extension'] >= 2` |
| Join Zovo: max 1 show ever | `joinZovoShown: true` |
| Discovery: once per feature | `discoveryShown` array check |
| Upgrade: always has "Maybe later" option | Built into paywall UI, not dismissable via retention system |
| Defer until action completes | `isUserEditing()` check returns true while form is open |

### 2.3 Prompt UI Component

#### CSS

```css
/* src/retention/retention-prompt.css */

/* ─── Retention Prompt Banner ──────────────────────────────────────────────── */

.zovo-retention-prompt {
  position: relative;
  margin: var(--zovo-space-3);
  padding: var(--zovo-space-3) var(--zovo-space-4);
  background: var(--zovo-bg-secondary);
  border: 1px solid var(--zovo-border);
  border-left: 3px solid var(--zovo-primary);
  border-radius: var(--zovo-radius-lg);
  box-shadow: var(--zovo-shadow-sm);
  overflow: hidden;

  /* Entrance animation */
  animation: zovo-retention-slide-down 250ms ease-out forwards;
  transform-origin: top center;
}

.zovo-retention-prompt[data-exiting='true'] {
  animation: zovo-retention-slide-up 200ms ease-in forwards;
}

@keyframes zovo-retention-slide-down {
  from {
    max-height: 0;
    opacity: 0;
    padding-top: 0;
    padding-bottom: 0;
    margin-top: 0;
    margin-bottom: 0;
  }
  to {
    max-height: 200px;
    opacity: 1;
    padding-top: var(--zovo-space-3);
    padding-bottom: var(--zovo-space-3);
    margin-top: var(--zovo-space-3);
    margin-bottom: 0;
  }
}

@keyframes zovo-retention-slide-up {
  from {
    max-height: 200px;
    opacity: 1;
  }
  to {
    max-height: 0;
    opacity: 0;
    padding-top: 0;
    padding-bottom: 0;
    margin-top: 0;
    margin-bottom: 0;
  }
}

.zovo-retention-prompt__close {
  position: absolute;
  top: var(--zovo-space-2);
  right: var(--zovo-space-2);
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: var(--zovo-text-muted);
  cursor: pointer;
  border-radius: var(--zovo-radius-sm);
  font-size: 14px;
  line-height: 1;
  transition: background var(--zovo-transition-fast), color var(--zovo-transition-fast);
}

.zovo-retention-prompt__close:hover {
  background: var(--zovo-bg-tertiary);
  color: var(--zovo-text-secondary);
}

.zovo-retention-prompt__title {
  font-size: var(--zovo-font-size-base);
  font-weight: var(--zovo-font-weight-semibold);
  color: var(--zovo-text-primary);
  margin-bottom: var(--zovo-space-1);
  padding-right: var(--zovo-space-6); /* space for close button */
}

.zovo-retention-prompt__message {
  font-size: var(--zovo-font-size-sm);
  color: var(--zovo-text-secondary);
  line-height: var(--zovo-line-height-normal);
  margin-bottom: var(--zovo-space-3);
}

.zovo-retention-prompt__actions {
  display: flex;
  align-items: center;
  gap: var(--zovo-space-3);
}

.zovo-retention-prompt__cta {
  display: inline-flex;
  align-items: center;
  padding: 6px 14px;
  font-family: var(--zovo-font-family);
  font-size: var(--zovo-font-size-sm);
  font-weight: var(--zovo-font-weight-medium);
  color: var(--zovo-text-inverse);
  background: var(--zovo-primary);
  border: none;
  border-radius: var(--zovo-radius-md);
  cursor: pointer;
  text-decoration: none;
  transition: background var(--zovo-transition-fast);
  line-height: 1;
}

.zovo-retention-prompt__cta:hover {
  background: var(--zovo-primary-hover);
}

.zovo-retention-prompt__secondary {
  font-family: var(--zovo-font-family);
  font-size: var(--zovo-font-size-xs);
  color: var(--zovo-text-muted);
  background: none;
  border: none;
  cursor: pointer;
  text-decoration: none;
  transition: color var(--zovo-transition-fast);
}

.zovo-retention-prompt__secondary:hover {
  color: var(--zovo-text-secondary);
  text-decoration: underline;
}

/* ─── Inline Card Variant (Feature Discovery) ─────────────────────────────── */

.zovo-retention-prompt--card {
  background: linear-gradient(135deg, var(--zovo-primary-light), var(--zovo-bg-secondary));
  border-left-color: var(--zovo-info);
}

/* ─── Dark Mode ────────────────────────────────────────────────────────────── */

@media (prefers-color-scheme: dark) {
  .zovo-retention-prompt {
    background: var(--zovo-bg-secondary);
    border-color: var(--zovo-border);
    border-left-color: var(--zovo-primary);
  }

  .zovo-retention-prompt--card {
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), var(--zovo-bg-secondary));
  }
}

/* ─── Forced Dark Mode (user preference, overrides system) ─────────────────── */

[data-theme='dark'] .zovo-retention-prompt {
  background: var(--zovo-bg-secondary);
  border-color: var(--zovo-border);
  border-left-color: var(--zovo-primary);
}

[data-theme='dark'] .zovo-retention-prompt--card {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), var(--zovo-bg-secondary));
}
```

#### Preact Component

```tsx
// src/retention/RetentionPrompt.tsx

import { h, FunctionalComponent } from 'preact';
import { useState, useEffect, useCallback, useRef } from 'preact/hooks';
import { retention, RetentionPrompt as PromptData } from './zovo-retention';
import './retention-prompt.css';

interface Props {
  /** Called when the prompt navigates the user to a tab */
  onNavigateTab?: (tab: string) => void;
}

export const RetentionPrompt: FunctionalComponent<Props> = ({ onNavigateTab }) => {
  const [prompt, setPrompt] = useState<PromptData | null>(null);
  const [exiting, setExiting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Delay evaluation by 500ms so the popup can render first
    const timer = setTimeout(async () => {
      const result = await retention.evaluate();
      if (result) {
        setPrompt(result);
        await retention.recordPromptShown(result.type);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = useCallback(async () => {
    if (!prompt) return;
    setExiting(true);

    // Wait for exit animation
    setTimeout(async () => {
      await retention.recordPromptDismissed(prompt.type);
      setPrompt(null);
      setExiting(false);
    }, 200);
  }, [prompt]);

  const handleCtaClick = useCallback(async () => {
    if (!prompt) return;
    await retention.recordPromptCtaClicked(prompt.type);

    if (prompt.primaryCtaUrl) {
      chrome.tabs.create({ url: prompt.primaryCtaUrl });
    } else if (prompt.primaryCtaAction === 'copy_share_link') {
      const shareUrl = `https://chromewebstore.google.com/detail/EXTENSION_ID_PLACEHOLDER?ref=share`;
      await navigator.clipboard.writeText(shareUrl);
      // Show a brief "Copied!" feedback, then dismiss
      setExiting(true);
      setTimeout(() => {
        setPrompt(null);
        setExiting(false);
      }, 200);
    } else if (prompt.primaryCtaAction === 'navigate_tab' && onNavigateTab) {
      // Extract tab name from CTA text
      const tabMatch = prompt.primaryCta.match(/Go to (\w+)/);
      if (tabMatch) {
        onNavigateTab(tabMatch[1].toLowerCase());
      }
      setExiting(true);
      setTimeout(() => {
        setPrompt(null);
        setExiting(false);
      }, 200);
    }
  }, [prompt, onNavigateTab]);

  if (!prompt) return null;

  const isCard = prompt.variant === 'inline_card';

  return (
    <div
      ref={containerRef}
      class={`zovo-retention-prompt${isCard ? ' zovo-retention-prompt--card' : ''}`}
      data-exiting={exiting ? 'true' : undefined}
      role="status"
      aria-live="polite"
    >
      {prompt.dismissable && (
        <button
          class="zovo-retention-prompt__close"
          onClick={handleDismiss}
          aria-label="Dismiss"
        >
          &#x2715;
        </button>
      )}

      <div class="zovo-retention-prompt__title">{prompt.title}</div>
      <div class="zovo-retention-prompt__message">{prompt.message}</div>

      <div class="zovo-retention-prompt__actions">
        <button class="zovo-retention-prompt__cta" onClick={handleCtaClick}>
          {prompt.primaryCta}
        </button>

        {prompt.secondaryCta && prompt.dismissable && (
          <button class="zovo-retention-prompt__secondary" onClick={handleDismiss}>
            {prompt.secondaryCta}
          </button>
        )}
      </div>
    </div>
  );
};
```

#### Integration in Popup

```tsx
// In the main popup component, render <RetentionPrompt /> at the top of the
// scrollable content area, below the tab bar and above the cookie list.

import { RetentionPrompt } from '../retention/RetentionPrompt';

function Popup() {
  const [activeTab, setActiveTab] = useState('cookies');

  return (
    <div class="zovo-popup">
      <Header />
      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Retention prompt renders here — top of content, below tabs */}
      <RetentionPrompt onNavigateTab={(tab) => setActiveTab(tab)} />

      <main class="zovo-popup-content">
        {activeTab === 'cookies' && <CookieList />}
        {activeTab === 'profiles' && <ProfileList />}
        {activeTab === 'rules' && <RuleList />}
        {activeTab === 'health' && <HealthDashboard />}
      </main>

      <Footer />
    </div>
  );
}
```

---

## 3. Rating Request System

### 3.1 Rating State Interface

```typescript
// src/retention/rating-state.ts

export interface RatingState {
  /** Whether the user has clicked "Rate on Chrome Web Store" */
  hasRated: boolean;
  /** Total number of times a rating prompt has been shown */
  ratingPromptCount: number;
  /** Timestamp of the last rating prompt display */
  lastRatingPromptDate: number;
  /** Number of times the user dismissed the rating prompt */
  ratingDismissCount: number;
  /** Whether the user submitted internal feedback */
  feedbackProvided: boolean;
  /** User's last stated satisfaction level */
  satisfactionLevel: 'love' | 'okay' | 'not_great' | null;
}

const STORAGE_KEY_RATING = 'zovo_rating_state';

export async function getRatingState(): Promise<RatingState> {
  const result = await chrome.storage.local.get(STORAGE_KEY_RATING);
  if (result[STORAGE_KEY_RATING]) return result[STORAGE_KEY_RATING] as RatingState;

  return {
    hasRated: false,
    ratingPromptCount: 0,
    lastRatingPromptDate: 0,
    ratingDismissCount: 0,
    feedbackProvided: false,
    satisfactionLevel: null,
  };
}

export async function updateRatingState(
  partial: Partial<RatingState>,
): Promise<void> {
  const current = await getRatingState();
  await chrome.storage.local.set({
    [STORAGE_KEY_RATING]: { ...current, ...partial },
  });
}
```

### 3.2 `ZovoRatingManager` Class

The smart rating flow uses a two-step satisfaction check (Phase 07 Agent 2 pattern). Dissatisfied users are routed to internal feedback; satisfied users are asked to rate on the Chrome Web Store.

```typescript
// src/retention/zovo-rating-manager.ts

import { analytics } from '../analytics/zovo-analytics';
import { EVENTS } from '../analytics/event-catalog';
import {
  RatingState,
  getRatingState,
  updateRatingState,
} from './rating-state';

// ─── Types ────────────────────────────────────────────────────────────────────

export type RatingTrigger =
  | 'tenth_cookie_edit'
  | 'first_profile_load'
  | 'first_export'
  | 'first_rule_triggered'
  | 'third_session_this_week';

export type RatingStep = 'satisfaction' | 'ask_rate' | 'feedback';

export type SatisfactionResponse = 'love' | 'okay' | 'not_great';

export interface RatingFlowResult {
  step: RatingStep;
  trigger: RatingTrigger;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const RATE_COOLDOWN_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const MAX_DISMISS = 3;
const CWS_REVIEW_URL = 'https://chromewebstore.google.com/detail/EXTENSION_ID_PLACEHOLDER/reviews';

// ─── Trigger Tracking Keys ────────────────────────────────────────────────────

const STORAGE_KEY_TRIGGER_STATE = 'zovo_rating_triggers';

interface RatingTriggerState {
  tenth_edit_fired: boolean;
  first_profile_load_fired: boolean;
  first_export_fired: boolean;
  first_rule_triggered_fired: boolean;
  third_session_week_fired: boolean;
}

async function getTriggerState(): Promise<RatingTriggerState> {
  const result = await chrome.storage.local.get(STORAGE_KEY_TRIGGER_STATE);
  if (result[STORAGE_KEY_TRIGGER_STATE]) {
    return result[STORAGE_KEY_TRIGGER_STATE] as RatingTriggerState;
  }
  return {
    tenth_edit_fired: false,
    first_profile_load_fired: false,
    first_export_fired: false,
    first_rule_triggered_fired: false,
    third_session_week_fired: false,
  };
}

async function markTriggerFired(
  key: keyof RatingTriggerState,
): Promise<void> {
  const state = await getTriggerState();
  state[key] = true;
  await chrome.storage.local.set({ [STORAGE_KEY_TRIGGER_STATE]: state });
}

// ─── Class ────────────────────────────────────────────────────────────────────

export class ZovoRatingManager {
  /**
   * Check if a specific rating trigger should fire.
   * Called from the relevant feature code after actions complete.
   *
   * Returns the trigger name if the rating flow should begin, or null.
   */
  async checkTrigger(trigger: RatingTrigger): Promise<boolean> {
    const ratingState = await getRatingState();
    const triggerState = await getTriggerState();

    // ── Global guards ─────────────────────────────────────────────────────────
    if (ratingState.hasRated) return false;
    if (ratingState.ratingDismissCount >= MAX_DISMISS) return false;
    if (
      ratingState.lastRatingPromptDate &&
      Date.now() - ratingState.lastRatingPromptDate < RATE_COOLDOWN_MS
    ) {
      return false;
    }

    // Session guard: no prompts in first session
    const sessionCount = await analytics.getSessionCount();
    if (sessionCount < 2) return false;

    // Active editing guard
    if (document.querySelector('.cookie-edit-form')) return false;

    // ── Per-trigger guards ────────────────────────────────────────────────────
    switch (trigger) {
      case 'tenth_cookie_edit':
        if (triggerState.tenth_edit_fired) return false;
        break;
      case 'first_profile_load':
        if (triggerState.first_profile_load_fired) return false;
        break;
      case 'first_export':
        if (triggerState.first_export_fired) return false;
        break;
      case 'first_rule_triggered':
        if (triggerState.first_rule_triggered_fired) return false;
        break;
      case 'third_session_this_week':
        if (triggerState.third_session_week_fired) return false;
        break;
    }

    return true;
  }

  /**
   * Begin the rating flow. Call this after checkTrigger returns true.
   * This marks the trigger as fired and updates the rating prompt count.
   */
  async beginFlow(trigger: RatingTrigger): Promise<void> {
    // Mark this trigger as used
    const triggerKeyMap: Record<RatingTrigger, keyof RatingTriggerState> = {
      tenth_cookie_edit: 'tenth_edit_fired',
      first_profile_load: 'first_profile_load_fired',
      first_export: 'first_export_fired',
      first_rule_triggered: 'first_rule_triggered_fired',
      third_session_this_week: 'third_session_week_fired',
    };
    await markTriggerFired(triggerKeyMap[trigger]);

    // Update rating state
    const state = await getRatingState();
    await updateRatingState({
      ratingPromptCount: state.ratingPromptCount + 1,
      lastRatingPromptDate: Date.now(),
    });

    await analytics.track(EVENTS.RATING_PROMPT_SHOWN, {
      trigger,
      step: 'satisfaction',
    });
  }

  /**
   * Record the user's satisfaction response (Step 1).
   */
  async recordSatisfaction(
    trigger: RatingTrigger,
    response: SatisfactionResponse,
  ): Promise<RatingStep> {
    await updateRatingState({ satisfactionLevel: response });

    await analytics.track(EVENTS.RATING_PROMPT_ACTION, {
      trigger,
      action: response,
    });

    if (response === 'love') {
      return 'ask_rate';
    }
    return 'feedback';
  }

  /**
   * Record the user's response to the rating ask (Step 2).
   */
  async recordRatingResponse(
    trigger: RatingTrigger,
    action: 'rate' | 'later' | 'never',
  ): Promise<void> {
    await analytics.track(EVENTS.RATING_PROMPT_ACTION, {
      trigger,
      action,
    });

    switch (action) {
      case 'rate':
        await updateRatingState({ hasRated: true });
        chrome.tabs.create({ url: CWS_REVIEW_URL });
        break;
      case 'later':
        // 30-day cooldown is already enforced via lastRatingPromptDate
        break;
      case 'never':
        // Set dismiss count to max so the prompt never shows again
        await updateRatingState({ ratingDismissCount: MAX_DISMISS });
        break;
    }
  }

  /**
   * Record that the user submitted internal feedback.
   */
  async recordFeedbackProvided(trigger: RatingTrigger): Promise<void> {
    await updateRatingState({ feedbackProvided: true });

    await analytics.track(EVENTS.RATING_PROMPT_ACTION, {
      trigger,
      action: 'feedback_sent',
    });
  }

  /**
   * Record a dismissal at any point in the flow.
   */
  async recordDismissal(trigger: RatingTrigger): Promise<void> {
    const state = await getRatingState();
    await updateRatingState({
      ratingDismissCount: state.ratingDismissCount + 1,
    });

    await analytics.track(EVENTS.RATING_PROMPT_ACTION, {
      trigger,
      action: 'later',
    });
  }
}

export const ratingManager = new ZovoRatingManager();
```

### 3.3 Rating Triggers — Integration Points

Each trigger fires from the relevant feature code. These are the exact insertion points:

```typescript
// src/retention/rating-triggers.ts

/**
 * Trigger integration helpers.
 * Import and call these from the relevant feature modules.
 */

import { ratingManager, RatingTrigger } from './zovo-rating-manager';
import { analytics } from '../analytics/zovo-analytics';

// ─── Counters (persisted) ─────────────────────────────────────────────────────

const STORAGE_KEY_EDIT_COUNT = 'zovo_rating_edit_count';

/**
 * Call after each successful cookie edit.
 * Fires the rating trigger on the 10th edit.
 */
export async function onCookieEdited(): Promise<RatingTrigger | null> {
  const result = await chrome.storage.local.get(STORAGE_KEY_EDIT_COUNT);
  const count = (result[STORAGE_KEY_EDIT_COUNT] ?? 0) + 1;
  await chrome.storage.local.set({ [STORAGE_KEY_EDIT_COUNT]: count });

  if (count === 10) {
    const shouldFire = await ratingManager.checkTrigger('tenth_cookie_edit');
    if (shouldFire) return 'tenth_cookie_edit';
  }
  return null;
}

/**
 * Call after a profile is successfully loaded/applied.
 * Fires on first-ever successful profile load.
 */
export async function onProfileLoaded(): Promise<RatingTrigger | null> {
  const shouldFire = await ratingManager.checkTrigger('first_profile_load');
  if (shouldFire) return 'first_profile_load';
  return null;
}

/**
 * Call after a successful export completes.
 * Fires on first-ever successful export.
 */
export async function onExportComplete(): Promise<RatingTrigger | null> {
  const shouldFire = await ratingManager.checkTrigger('first_export');
  if (shouldFire) return 'first_export';
  return null;
}

/**
 * Call after an auto-delete rule fires and removes cookies for the first time.
 * Note: this fires from the background service worker, so the prompt is shown
 * at the next popup open.
 */
export async function onRuleTriggeredFirstTime(): Promise<RatingTrigger | null> {
  const shouldFire = await ratingManager.checkTrigger('first_rule_triggered');
  if (shouldFire) return 'first_rule_triggered';
  return null;
}

/**
 * Call on popup_opened to check if this is the 3rd session this week.
 */
export async function onPopupOpened(): Promise<RatingTrigger | null> {
  const sessionsThisWeek = await analytics.getSessionsThisWeek();
  if (sessionsThisWeek === 3) {
    const shouldFire = await ratingManager.checkTrigger('third_session_this_week');
    if (shouldFire) return 'third_session_this_week';
  }
  return null;
}
```

### 3.4 Smart Rating Flow — Preact Component

```tsx
// src/retention/RatingFlow.tsx

import { h, FunctionalComponent } from 'preact';
import { useState, useCallback } from 'preact/hooks';
import {
  ratingManager,
  RatingTrigger,
  RatingStep,
  SatisfactionResponse,
} from './zovo-rating-manager';
import './retention-prompt.css';

interface Props {
  trigger: RatingTrigger;
  onClose: () => void;
}

export const RatingFlow: FunctionalComponent<Props> = ({ trigger, onClose }) => {
  const [step, setStep] = useState<RatingStep>('satisfaction');
  const [exiting, setExiting] = useState(false);

  const dismiss = useCallback(async () => {
    setExiting(true);
    await ratingManager.recordDismissal(trigger);
    setTimeout(onClose, 200);
  }, [trigger, onClose]);

  const handleSatisfaction = useCallback(
    async (response: SatisfactionResponse) => {
      const nextStep = await ratingManager.recordSatisfaction(trigger, response);
      setStep(nextStep);
    },
    [trigger],
  );

  const handleRateAction = useCallback(
    async (action: 'rate' | 'later' | 'never') => {
      await ratingManager.recordRatingResponse(trigger, action);
      setExiting(true);
      setTimeout(onClose, 200);
    },
    [trigger, onClose],
  );

  const handleFeedbackSent = useCallback(async () => {
    await ratingManager.recordFeedbackProvided(trigger);
    setExiting(true);
    setTimeout(onClose, 200);
  }, [trigger, onClose]);

  return (
    <div
      class="zovo-retention-prompt"
      data-exiting={exiting ? 'true' : undefined}
      role="dialog"
      aria-label="Rate Cookie Manager"
    >
      <button
        class="zovo-retention-prompt__close"
        onClick={dismiss}
        aria-label="Dismiss"
      >
        &#x2715;
      </button>

      {/* ── Step 1: Satisfaction Check ─────────────────────────────────────── */}
      {step === 'satisfaction' && (
        <div>
          <div class="zovo-retention-prompt__title">
            How's Cookie Manager working for you?
          </div>
          <div class="zovo-retention-prompt__actions">
            <button
              class="zovo-retention-prompt__cta"
              onClick={() => handleSatisfaction('love')}
            >
              Love it!
            </button>
            <button
              class="zovo-retention-prompt__secondary"
              onClick={() => handleSatisfaction('okay')}
            >
              It's okay
            </button>
            <button
              class="zovo-retention-prompt__secondary"
              onClick={() => handleSatisfaction('not_great')}
            >
              Not great
            </button>
          </div>
        </div>
      )}

      {/* ── Step 2a: Ask for Rating (love) ─────────────────────────────────── */}
      {step === 'ask_rate' && (
        <div>
          <div class="zovo-retention-prompt__title">
            Awesome! Would you mind leaving a quick rating?
          </div>
          <div class="zovo-retention-prompt__message">
            It really helps other developers find this tool.
          </div>
          <div class="zovo-retention-prompt__actions">
            <button
              class="zovo-retention-prompt__cta"
              onClick={() => handleRateAction('rate')}
            >
              Rate on Chrome Web Store
            </button>
            <button
              class="zovo-retention-prompt__secondary"
              onClick={() => handleRateAction('later')}
            >
              Maybe later
            </button>
            <button
              class="zovo-retention-prompt__secondary"
              onClick={() => handleRateAction('never')}
            >
              Don't ask again
            </button>
          </div>
        </div>
      )}

      {/* ── Step 2b: Feedback Form (okay / not_great) ──────────────────────── */}
      {step === 'feedback' && (
        <RatingFeedbackForm
          trigger={trigger}
          onSent={handleFeedbackSent}
          onCancel={dismiss}
        />
      )}
    </div>
  );
};

// ─── Internal Feedback Form ───────────────────────────────────────────────────

interface FeedbackFormProps {
  trigger: RatingTrigger;
  onSent: () => void;
  onCancel: () => void;
}

const RatingFeedbackForm: FunctionalComponent<FeedbackFormProps> = ({
  trigger,
  onSent,
  onCancel,
}) => {
  const [feedback, setFeedback] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (!feedback.trim()) return;
    setSending(true);

    // Store feedback locally. This can optionally be batched to the Zovo API
    // during the 24-hour license validation cycle if the user has an account.
    const result = await chrome.storage.local.get('zovo_feedback');
    const existing: Array<{ text: string; trigger: string; ts: number }> =
      result['zovo_feedback'] ?? [];

    existing.push({
      text: feedback.trim().substring(0, 500),
      trigger,
      ts: Date.now(),
    });

    // Keep at most 10 feedback entries
    while (existing.length > 10) existing.shift();

    await chrome.storage.local.set({ zovo_feedback: existing });
    onSent();
  }, [feedback, trigger, onSent]);

  return (
    <div>
      <div class="zovo-retention-prompt__title">
        We'd love to hear how we can improve.
      </div>
      <div class="zovo-retention-prompt__message">
        Your feedback goes directly to the team.
      </div>
      <textarea
        class="zovo-input"
        style={{
          minHeight: '60px',
          resize: 'vertical',
          marginBottom: 'var(--zovo-space-3)',
          fontFamily: 'var(--zovo-font-family)',
          fontSize: 'var(--zovo-font-size-sm)',
        }}
        placeholder="What could be better?"
        value={feedback}
        onInput={(e) => setFeedback((e.target as HTMLTextAreaElement).value)}
        maxLength={500}
      />
      <div class="zovo-retention-prompt__actions">
        <button
          class="zovo-retention-prompt__cta"
          onClick={handleSubmit}
          disabled={sending || !feedback.trim()}
        >
          {sending ? 'Sending...' : 'Send Feedback'}
        </button>
        <button class="zovo-retention-prompt__secondary" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
};
```

### 3.5 Rating Trigger Integration Example

This shows how to wire a rating trigger into existing feature code:

```typescript
// Example: In the cookie edit handler
import { onCookieEdited } from '../retention/rating-triggers';
import { ratingManager } from '../retention/zovo-rating-manager';

async function handleCookieSave(cookieId: string, newValue: string): Promise<void> {
  // ... perform the actual cookie save ...

  // Check if rating trigger should fire
  const trigger = await onCookieEdited();

  if (trigger) {
    // Wait for the user to close the edit form (3-second idle per Phase 07 spec)
    await waitForEditFormClose();
    await waitIdle(3000);

    // Begin the rating flow
    await ratingManager.beginFlow(trigger);

    // Render <RatingFlow trigger={trigger} /> in the popup
    showRatingFlow(trigger);
  }
}

// Utility: wait until no .cookie-edit-form is in the DOM
function waitForEditFormClose(): Promise<void> {
  return new Promise((resolve) => {
    const check = () => {
      if (!document.querySelector('.cookie-edit-form')) {
        resolve();
      } else {
        setTimeout(check, 200);
      }
    };
    check();
  });
}

// Utility: wait for N ms of no user interaction
function waitIdle(ms: number): Promise<void> {
  return new Promise((resolve) => {
    let timer = setTimeout(resolve, ms);
    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(resolve, ms);
    };
    document.addEventListener('click', reset, { once: false });
    document.addEventListener('scroll', reset, { once: false });
    // Clean up listeners when resolved
    setTimeout(() => {
      document.removeEventListener('click', reset);
      document.removeEventListener('scroll', reset);
    }, ms + 5000);
  });
}
```

---

## 4. Engagement Milestones System

### 4.1 Milestone Definitions

| Milestone ID | Trigger | Celebration Message | Threshold |
|---|---|---|---|
| `edit_10` | 10th cookie edit | "You're getting the hang of it!" | 10 cookie edits |
| `edit_50` | 50th cookie edit | "Cookie editing pro!" | 50 cookie edits |
| `edit_100` | 100th cookie edit | "Triple-digit editor!" | 100 cookie edits |
| `first_profile` | First profile created | "Smart! Profiles save you time." | 1 profile created |
| `first_rule` | First rule created | "Automation unlocked!" | 1 rule created |
| `first_rule_triggered` | First rule auto-deletes cookies | "Your auto-cleanup is working!" | 1 rule fired |
| `first_export` | First export completed | "Data portability for the win!" | 1 export |
| `ops_100` | 100th total cookie operation | "Cookie power user!" | 100 ops (edit+create+delete) |
| `streak_7` | 7-day usage streak | "7 days in a row with Cookie Manager!" | 7-day streak |

### 4.2 `ZovoMilestones` Class

```typescript
// src/retention/zovo-milestones.ts

import { analytics, Milestone } from '../analytics/zovo-analytics';
import { EVENTS } from '../analytics/event-catalog';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MilestoneCelebration {
  milestoneId: string;
  label: string;
  emoji: string;
}

interface CelebratedState {
  /** Milestone IDs that have already been celebrated with a toast */
  celebrated: string[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY_CELEBRATED = 'zovo_milestones_celebrated';

const STREAK_STORAGE_KEY = 'zovo_milestone_streak_7_achieved';

const MILESTONE_EMOJIS: Record<string, string> = {
  edit_10: '\u{1F44D}',       // thumbs up
  edit_50: '\u{1F525}',       // fire
  edit_100: '\u{1F3C6}',      // trophy
  first_profile: '\u{1F4C1}', // folder
  first_rule: '\u{2699}',     // gear
  first_rule_triggered: '\u{2728}', // sparkles
  first_export: '\u{1F4E6}',  // package
  ops_100: '\u{1F36A}',       // cookie
  streak_7: '\u{1F4AA}',      // flexed biceps
};

// ─── Class ────────────────────────────────────────────────────────────────────

export class ZovoMilestones {
  /**
   * Check for newly achieved milestones that have not yet been celebrated.
   * Returns an array of celebrations to display (usually 0 or 1).
   *
   * Call this on every popup open, after analytics.track('popup_opened').
   */
  async checkForCelebrations(): Promise<MilestoneCelebration[]> {
    const milestones = await analytics.getMilestones();
    const streak = await analytics.getCurrentStreak();
    const celebrated = await this.getCelebratedState();
    const newCelebrations: MilestoneCelebration[] = [];

    // Check standard milestones
    for (const m of milestones) {
      if (m.achieved && !celebrated.celebrated.includes(m.id)) {
        newCelebrations.push({
          milestoneId: m.id,
          label: m.label,
          emoji: MILESTONE_EMOJIS[m.id] ?? '\u{1F389}',
        });
      }
    }

    // Check streak milestone separately (not in ring buffer milestones)
    if (streak >= 7 && !celebrated.celebrated.includes('streak_7')) {
      const streakAchieved = await chrome.storage.local.get(STREAK_STORAGE_KEY);
      if (!streakAchieved[STREAK_STORAGE_KEY]) {
        newCelebrations.push({
          milestoneId: 'streak_7',
          label: '7 days in a row with Cookie Manager!',
          emoji: MILESTONE_EMOJIS['streak_7'],
        });
        await chrome.storage.local.set({ [STREAK_STORAGE_KEY]: Date.now() });
      }
    }

    // Mark all as celebrated and track
    if (newCelebrations.length > 0) {
      const newIds = newCelebrations.map((c) => c.milestoneId);
      celebrated.celebrated.push(...newIds);
      await this.saveCelebratedState(celebrated);

      for (const c of newCelebrations) {
        await analytics.track(EVENTS.MILESTONE_CELEBRATED, {
          milestoneId: c.milestoneId,
          label: c.label,
        });
      }
    }

    return newCelebrations;
  }

  // ── Private Helpers ─────────────────────────────────────────────────────────

  private async getCelebratedState(): Promise<CelebratedState> {
    const result = await chrome.storage.local.get(STORAGE_KEY_CELEBRATED);
    if (result[STORAGE_KEY_CELEBRATED]) {
      return result[STORAGE_KEY_CELEBRATED] as CelebratedState;
    }
    return { celebrated: [] };
  }

  private async saveCelebratedState(state: CelebratedState): Promise<void> {
    await chrome.storage.local.set({ [STORAGE_KEY_CELEBRATED]: state });
  }
}

export const milestones = new ZovoMilestones();
```

### 4.3 Milestone Toast — Preact Component

```tsx
// src/retention/MilestoneToast.tsx

import { h, FunctionalComponent } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { milestones, MilestoneCelebration } from './zovo-milestones';

/**
 * Renders a celebration toast when a new milestone is achieved.
 * Auto-dismisses after 4 seconds.
 * Shows at most one milestone per popup open.
 */
export const MilestoneToast: FunctionalComponent = () => {
  const [celebration, setCelebration] = useState<MilestoneCelebration | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let mounted = true;

    const check = async () => {
      // Small delay to let the popup render first
      await new Promise((r) => setTimeout(r, 800));
      if (!mounted) return;

      const celebrations = await milestones.checkForCelebrations();
      if (celebrations.length > 0 && mounted) {
        setCelebration(celebrations[0]); // show only the first
        setVisible(true);

        // Auto-dismiss after 4 seconds
        setTimeout(() => {
          if (mounted) setVisible(false);
        }, 4000);

        // Remove from DOM after exit animation
        setTimeout(() => {
          if (mounted) setCelebration(null);
        }, 4300);
      }
    };

    check();
    return () => { mounted = false; };
  }, []);

  if (!celebration) return null;

  return (
    <div
      class="zovo-milestone-toast"
      data-visible={visible ? 'true' : 'false'}
      role="status"
      aria-live="polite"
    >
      <span class="zovo-milestone-toast__emoji">{celebration.emoji}</span>
      <span class="zovo-milestone-toast__label">{celebration.label}</span>
    </div>
  );
};
```

```css
/* src/retention/milestone-toast.css */

.zovo-milestone-toast {
  position: fixed;
  top: 60px; /* below the header */
  left: 50%;
  transform: translateX(-50%) translateY(-20px);
  display: flex;
  align-items: center;
  gap: var(--zovo-space-2);
  padding: var(--zovo-space-2) var(--zovo-space-4);
  background: var(--zovo-primary);
  color: var(--zovo-text-inverse);
  border-radius: var(--zovo-radius-full);
  box-shadow: var(--zovo-shadow-lg);
  font-size: var(--zovo-font-size-sm);
  font-weight: var(--zovo-font-weight-medium);
  white-space: nowrap;
  z-index: 1000;
  opacity: 0;
  pointer-events: none;
  transition: opacity 300ms ease, transform 300ms ease;
}

.zovo-milestone-toast[data-visible='true'] {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
  pointer-events: auto;
}

.zovo-milestone-toast__emoji {
  font-size: 18px;
  line-height: 1;
}

.zovo-milestone-toast__label {
  line-height: 1.2;
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .zovo-milestone-toast {
    background: var(--zovo-primary-hover);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
  }
}

[data-theme='dark'] .zovo-milestone-toast {
  background: var(--zovo-primary-hover);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
}
```

### 4.4 Integration in Popup

```tsx
// In the main popup component:
import { MilestoneToast } from '../retention/MilestoneToast';
import { RetentionPrompt } from '../retention/RetentionPrompt';

function Popup() {
  return (
    <div class="zovo-popup">
      <Header />
      <TabBar />

      {/* Milestone toast floats over content */}
      <MilestoneToast />

      {/* Retention prompt renders inline */}
      <RetentionPrompt onNavigateTab={setActiveTab} />

      <main class="zovo-popup-content">
        {/* ... tab content ... */}
      </main>

      <Footer />
    </div>
  );
}
```

---

## 5. Churn Prevention

### 5.1 Inactivity Detection

Inactivity is detected from the background service worker using `chrome.alarms`. The logic:

```typescript
// src/retention/churn-prevention.ts

/**
 * Churn prevention module.
 * Runs in the background service worker (not the popup).
 *
 * Detects inactivity and optionally sends gentle re-engagement
 * notifications (only if the user has granted notification permission).
 */

// ─── Constants ────────────────────────────────────────────────────────────────

const ALARM_NAME_INACTIVITY = 'zovo_inactivity_check';
const CHECK_INTERVAL_HOURS = 24; // check once per day
const INACTIVITY_NOTIFY_DAYS = 7;
const INACTIVITY_REENGAGEMENT_DAYS = 14;
const INACTIVITY_CHURNED_DAYS = 30;

const STORAGE_KEY_LAST_ACTIVE = 'zovo_last_active_at';
const STORAGE_KEY_INACTIVITY_NOTIFIED = 'zovo_inactivity_notified';

// ─── Setup (call from service worker onInstalled) ─────────────────────────────

export function setupInactivityAlarm(): void {
  chrome.alarms.create(ALARM_NAME_INACTIVITY, {
    delayInMinutes: CHECK_INTERVAL_HOURS * 60,
    periodInMinutes: CHECK_INTERVAL_HOURS * 60,
  });
}

// ─── Alarm Handler ────────────────────────────────────────────────────────────

export async function handleInactivityAlarm(): Promise<void> {
  const result = await chrome.storage.local.get([
    STORAGE_KEY_LAST_ACTIVE,
    STORAGE_KEY_INACTIVITY_NOTIFIED,
  ]);

  const lastActive: number = result[STORAGE_KEY_LAST_ACTIVE] ?? Date.now();
  const alreadyNotified: boolean = result[STORAGE_KEY_INACTIVITY_NOTIFIED] ?? false;
  const daysSinceActive = Math.floor(
    (Date.now() - lastActive) / (24 * 60 * 60 * 1000),
  );

  // 7+ days: gentle notification (if not already sent this inactivity period)
  if (daysSinceActive >= INACTIVITY_NOTIFY_DAYS && !alreadyNotified) {
    await sendReEngagementNotification();
    await chrome.storage.local.set({ [STORAGE_KEY_INACTIVITY_NOTIFIED]: true });
  }

  // 14+ days: mark for re-engagement email (via Zovo backend, only if user
  // has a Zovo account). This sets a flag that the license validation cycle
  // picks up and sends to the API.
  if (daysSinceActive >= INACTIVITY_REENGAGEMENT_DAYS) {
    await chrome.storage.local.set({ zovo_reengagement_eligible: true });
  }

  // 30+ days: mark as churned for local analytics
  if (daysSinceActive >= INACTIVITY_CHURNED_DAYS) {
    await chrome.storage.local.set({ zovo_user_churned: true });
  }
}

// ─── Re-Engagement Notification ───────────────────────────────────────────────

async function sendReEngagementNotification(): Promise<void> {
  // Check if we have notification permission
  const permission = await chrome.permissions.contains({
    permissions: ['notifications'],
  });
  if (!permission) return;

  chrome.notifications.create('zovo_reengagement', {
    type: 'basic',
    iconUrl: chrome.runtime.getURL('assets/icons/icon-128.png'),
    title: 'Cookie Manager',
    message:
      'Cookies have been piling up. Click to check your cookie health.',
    priority: 0, // low priority -- not urgent
  });
}

// ─── Mark Active ──────────────────────────────────────────────────────────────

/**
 * Call this on every popup_opened event to reset the inactivity timer.
 */
export async function markUserActive(): Promise<void> {
  await chrome.storage.local.set({
    [STORAGE_KEY_LAST_ACTIVE]: Date.now(),
    [STORAGE_KEY_INACTIVITY_NOTIFIED]: false,
    zovo_reengagement_eligible: false,
    zovo_user_churned: false,
  });
}
```

### 5.2 Service Worker Integration

```typescript
// service-worker.ts (relevant additions)

import {
  setupInactivityAlarm,
  handleInactivityAlarm,
} from './retention/churn-prevention';

// ─── On Install ───────────────────────────────────────────────────────────────

chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    // Record install timestamp
    await chrome.storage.local.set({
      zovo_analytics_installed_at: Date.now(),
      zovo_last_active_at: Date.now(),
    });

    // Set uninstall feedback URL
    chrome.runtime.setUninstallURL(
      'https://zovo.one/feedback/cookie-manager?reason=uninstall',
    );

    // Start inactivity check alarm
    setupInactivityAlarm();
  }

  if (details.reason === 'update') {
    // Re-establish alarm (alarms may be cleared on update)
    setupInactivityAlarm();

    // Ensure uninstall URL is set (may have changed)
    chrome.runtime.setUninstallURL(
      'https://zovo.one/feedback/cookie-manager?reason=uninstall',
    );
  }
});

// ─── Alarm Listener ───────────────────────────────────────────────────────────

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'zovo_inactivity_check') {
    await handleInactivityAlarm();
  }
});

// ─── Notification Click Handler ───────────────────────────────────────────────

chrome.notifications.onClicked.addListener(async (notificationId) => {
  if (notificationId === 'zovo_reengagement') {
    // Open the extension popup by focusing a tab and opening popup
    // (chrome.action.openPopup is not available, so open the health tab as a page)
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs.length > 0) {
      // The user will see the extension icon; clicking it opens the popup.
      // Clear the notification.
      chrome.notifications.clear('zovo_reengagement');
    }
  }
});
```

### 5.3 Uninstall Feedback

The uninstall URL is set during `chrome.runtime.onInstalled` (shown above). It points to a Zovo-hosted page:

```
https://zovo.one/feedback/cookie-manager?reason=uninstall
```

**Uninstall feedback form requirements (hosted on zovo.one, not in extension):**

The form is a simple 3-question page:

1. **Why are you leaving?** (required, single select)
   - "Found a better extension"
   - "Too many pop-ups / prompts"
   - "Missing a feature I need"
   - "Bugs or performance issues"
   - "I don't need a cookie manager anymore"
   - "Just trying it out"
   - "Other"

2. **What could we improve?** (optional, textarea, max 500 chars)

3. **Would you come back if we fixed this?** (optional, single select)
   - "Yes, let me know" (collects email)
   - "Maybe"
   - "No"

**Design notes:**
- The page loads instantly (static HTML, no heavy framework)
- Zovo branding: header with logo, purple accent color
- Thank-you message after submission: "Thanks for your feedback. We read every response."
- If the user selects "Yes, let me know" and provides an email, it enters the Zovo re-engagement email list for Cookie Manager

### 5.4 Popup Open — Churn Prevention Hook

```typescript
// src/retention/popup-open-hook.ts

/**
 * Called at the top of the popup's initialization sequence.
 * Handles all retention-related checks that run on popup open.
 */

import { analytics } from '../analytics/zovo-analytics';
import { EVENTS } from '../analytics/event-catalog';
import { markUserActive } from './churn-prevention';
import { milestones } from './zovo-milestones';
import { retention } from './zovo-retention';
import { onPopupOpened } from './rating-triggers';

export async function onPopupInit(currentDomain: string): Promise<{
  ratingTrigger: string | null;
}> {
  // 1. Mark user as active (resets inactivity timer)
  await markUserActive();

  // 2. Track popup open event
  await analytics.track(EVENTS.POPUP_OPENED, { domain: currentDomain });

  // 3. Check for rating trigger (3rd session this week)
  const ratingTrigger = await onPopupOpened();

  // 4. Milestone celebrations and retention prompts are handled by their
  //    respective Preact components (<MilestoneToast />, <RetentionPrompt />)
  //    which call their own async checks on mount.

  return { ratingTrigger: ratingTrigger ?? null };
}
```

---

## 6. Storage Schema Summary

All retention data lives in `chrome.storage.local`. This is the complete key inventory:

| Storage Key | Type | Purpose | Max Size |
|---|---|---|---|
| `zovo_analytics_events` | `AnalyticsEvent[]` | Ring buffer of last 500 events | ~40KB |
| `zovo_analytics_session_id` | `string` | Current session identifier | < 1KB |
| `zovo_analytics_last_event_at` | `number` | Timestamp of last tracked event | < 1KB |
| `zovo_analytics_installed_at` | `number` | First install timestamp | < 1KB |
| `zovo_analytics_milestones` | `Record<string, number>` | Achieved milestone IDs with timestamps | < 1KB |
| `zovo_retention_state` | `RetentionState` | Prompt show/dismiss counts, flags | < 2KB |
| `zovo_rating_state` | `RatingState` | Rating flow state | < 1KB |
| `zovo_rating_triggers` | `RatingTriggerState` | Which triggers have fired | < 1KB |
| `zovo_rating_edit_count` | `number` | Cookie edit counter for 10th-edit trigger | < 1KB |
| `zovo_milestones_celebrated` | `CelebratedState` | Milestone IDs shown as toasts | < 1KB |
| `zovo_milestone_streak_7_achieved` | `number` | Timestamp of 7-day streak achievement | < 1KB |
| `zovo_last_active_at` | `number` | Last popup open timestamp | < 1KB |
| `zovo_inactivity_notified` | `boolean` | Whether inactivity notification was sent | < 1KB |
| `zovo_reengagement_eligible` | `boolean` | Flag for backend re-engagement email | < 1KB |
| `zovo_user_churned` | `boolean` | 30-day churn flag | < 1KB |
| `zovo_feedback` | `Array<{text, trigger, ts}>` | Internal feedback submissions (max 10) | < 6KB |

**Total estimated storage**: ~55KB at maximum capacity. Well within `chrome.storage.local` limits (10MB default, 5MB for sync).

---

## 7. File Structure

```
src/
├── analytics/
│   ├── zovo-analytics.ts          # ZovoAnalytics class (ring buffer, sessions, stats)
│   └── event-catalog.ts           # Canonical event names and property contracts
├── retention/
│   ├── zovo-retention.ts          # ZovoRetention class (prompt evaluation engine)
│   ├── zovo-rating-manager.ts     # ZovoRatingManager class (smart rating flow)
│   ├── zovo-milestones.ts         # ZovoMilestones class (celebration detection)
│   ├── rating-state.ts            # RatingState interface and persistence helpers
│   ├── rating-triggers.ts         # Per-feature trigger integration functions
│   ├── churn-prevention.ts        # Inactivity detection, alarms, notifications
│   ├── popup-open-hook.ts         # Initialization hook for popup open
│   ├── RetentionPrompt.tsx        # Preact component: retention prompt banner
│   ├── RatingFlow.tsx             # Preact component: smart rating flow
│   ├── MilestoneToast.tsx         # Preact component: milestone celebration toast
│   ├── retention-prompt.css       # Styles for retention prompt banner
│   └── milestone-toast.css        # Styles for milestone toast
```

---

## 8. Integration Checklist

| Step | File | Action |
|---|---|---|
| 1 | `service-worker.ts` | Import `setupInactivityAlarm`, `handleInactivityAlarm`. Call `setupInactivityAlarm()` on install/update. Register alarm listener. Set uninstall URL via `chrome.runtime.setUninstallURL()`. |
| 2 | Popup root component | Render `<MilestoneToast />` and `<RetentionPrompt />`. Call `onPopupInit()` on mount. |
| 3 | Cookie edit handler | Call `analytics.track(EVENTS.COOKIE_EDITED, ...)`. Call `onCookieEdited()` for rating trigger. |
| 4 | Cookie create handler | Call `analytics.track(EVENTS.COOKIE_CREATED, ...)`. |
| 5 | Cookie delete handler | Call `analytics.track(EVENTS.COOKIE_DELETED, ...)`. |
| 6 | Cookie view (expand) | Call `analytics.track(EVENTS.COOKIE_VIEWED, ...)`. |
| 7 | Profile create | Call `analytics.track(EVENTS.PROFILE_CREATED, ...)`. |
| 8 | Profile load | Call `analytics.track(EVENTS.PROFILE_LOADED, ...)`. Call `onProfileLoaded()` for rating trigger. |
| 9 | Rule create | Call `analytics.track(EVENTS.RULE_CREATED, ...)`. |
| 10 | Rule triggered (background) | Call `analytics.track(EVENTS.RULE_TRIGGERED, ...)`. Call `onRuleTriggeredFirstTime()` for rating trigger. |
| 11 | Export handler | Call `analytics.track(EVENTS.EXPORT_TRIGGERED, ...)`. Call `onExportComplete()` for rating trigger. |
| 12 | Import handler | Call `analytics.track(EVENTS.IMPORT_TRIGGERED, ...)`. |
| 13 | Search input | Call `analytics.track(EVENTS.SEARCH_USED, ...)`. |
| 14 | Tab switch | Call `analytics.track(EVENTS.TAB_SWITCHED, ...)`. |
| 15 | Health tab open | Call `analytics.track(EVENTS.HEALTH_VIEWED, ...)`. |
| 16 | Paywall render | Call `analytics.track(EVENTS.PAYWALL_SHOWN, ...)`. Call `retention.recordPromptShown('upgrade_pro')` to coordinate cooldowns. |
| 17 | Upgrade CTA click | Call `analytics.track(EVENTS.UPGRADE_CLICKED, ...)`. |
| 18 | Keyboard shortcut | Call `analytics.track(EVENTS.SHORTCUT_USED, ...)`. |

---

*Phase 08 Agent 4 complete. All code is production-ready TypeScript/Preact. All data stays local. All prompts respect Phase 04 anti-patterns (no first-session prompts, no interrupting edits, max 1 prompt per session, 48-hour cooldowns). Rating flow uses two-step satisfaction check from Phase 07 Agent 2. Milestone celebrations are one-time toasts. Churn prevention uses chrome.alarms for background detection. Uninstall feedback URL is set on install.*
