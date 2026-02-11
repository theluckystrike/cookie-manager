# MD 17 — Churn Prevention & Reactivation
## Cookie Manager — Phase 17 Complete

**Date:** February 2026 | **Status:** Complete
**Extension:** Cookie Manager v1.0.0

---

## Overview

Phase 17 adds a fully local churn prevention system to Cookie Manager. It detects declining engagement, calculates an engagement health score, and delivers proactive retention prompts (welcome-back messages, feature hints, streak celebrations, milestones) through a non-intrusive banner in the popup UI. All data stays in local storage -- no external requests, no telemetry, no user tracking.

## Files Created

| File | Lines | Purpose |
|------|-------|---------|
| `src/shared/churn-detector.js` | ~160 | Local churn signal detection: inactivity, usage decline, streaks |
| `src/shared/engagement-score.js` | ~160 | Engagement health score calculator with tier classification |
| `src/shared/retention-triggers.js` | ~180 | Proactive retention prompt selection with cooldown logic |

## Files Modified

| File | Changes | Purpose |
|------|---------|---------|
| `src/background/service-worker.js` | Added churn alarm + 5 message handlers | Periodic churn assessment and data retrieval endpoints |
| `src/popup/popup.js` | Added banner display + usage recording | Shows retention banners and records feature usage on actions |
| `src/popup/popup.css` | Added retention banner styles | Slide-in banner with icon, title, message, and dismiss button |

## Churn Detection System

`ChurnDetector` in `src/shared/churn-detector.js` monitors local usage patterns to identify disengagement before it becomes permanent.

**API surface:**

| Method | Returns | Description |
|--------|---------|-------------|
| `recordUsage(action)` | void | Logs an action with today's date to usage history |
| `getDaysSinceLastUse()` | number | Calendar days since the most recent recorded action |
| `getUsageDecline()` | number (0-1) | Ratio of recent-week activity vs. prior-week activity |
| `getCurrentStreak()` | number | Consecutive days with at least one recorded action |
| `getLongestStreak()` | number | All-time longest consecutive usage streak |
| `assessRisk()` | object | Combined risk assessment with level and contributing factors |
| `getFeatureUsage()` | object | Map of feature names to usage counts |

**Risk thresholds:**

| Level | Inactivity | Decline | Description |
|-------|-----------|---------|-------------|
| `low` | < 5 days | < 40% | Normal usage pattern |
| `medium` | 5--9 days | 40--59% | Early warning signs |
| `high` | 10--19 days | 60--79% | Significant disengagement |
| `critical` | 20+ days | 80%+ | Near-complete abandonment |

## Engagement Scoring

`EngagementScore` in `src/shared/engagement-score.js` computes a 0--100 health score from four weighted dimensions.

**Score breakdown:**

| Dimension | Weight | Measures |
|-----------|--------|----------|
| Frequency | 0.30 | Days active in the last 14 days |
| Depth | 0.25 | Distinct features used in the last 14 days |
| Recency | 0.25 | Inverse of days since last use |
| Volume | 0.20 | Total actions in the last 14 days |

**Tier classification:**

| Tier | Score | Description |
|------|-------|-------------|
| `power_user` | 80--100 | Daily, multi-feature usage |
| `engaged` | 60--79 | Regular usage with moderate breadth |
| `casual` | 40--59 | Occasional usage, limited features |
| `at_risk` | 20--39 | Infrequent, narrow usage |
| `dormant` | 0--19 | Essentially inactive |

**Additional API:** `getUnusedFeatures()` returns features the user has never tried, `recordSession()` logs a popup open event, `getSummary()` returns the full score breakdown with tier.

## Retention Triggers

`RetentionTriggers` in `src/shared/retention-triggers.js` selects the highest-priority prompt to display when the user opens the popup.

**Trigger types (priority order):**

1. **Welcome-back** -- Shown when the user returns after 3+ days of inactivity. Message varies by absence length.
2. **Milestone** -- Celebrates usage milestones (e.g., 100 cookies managed, 7-day streak). Tracked in `celebratedMilestones` to avoid repeats.
3. **Streak** -- Encourages active streaks at 3, 7, 14, and 30 days.
4. **Feature hint** -- Suggests an unused feature the user has not yet tried.

**Cooldown mechanism:** When the user dismisses a trigger, its ID is stored in `dismissedTriggers` with a timestamp. The same trigger will not reappear for 7 days.

**API:** `getNextTrigger()` returns the highest-priority non-dismissed trigger, or `null` if none qualify. `dismissTrigger(id)` records the dismissal.

## Service Worker Integration

The service worker registers a `churnCheck` alarm that fires periodically to run `ChurnDetector.assessRisk()` in the background. Five new message handlers are added:

| Message Type | Response | Purpose |
|-------------|----------|---------|
| `getChurnRisk` | Risk assessment object | Popup requests current risk level |
| `getEngagementScore` | Score + tier object | Popup requests engagement summary |
| `getRetentionTrigger` | Trigger object or null | Popup requests next banner to display |
| `dismissRetentionTrigger` | Acknowledgement | Popup reports user dismissed a banner |
| `recordUsage` | Acknowledgement | Popup reports a user action for tracking |

## Popup Integration

On popup load, `popup.js` sends `getRetentionTrigger` to the service worker. If a trigger is returned, it renders a `.retention-banner` element above the cookie list containing an icon, title, message, and dismiss button. The banner uses a `retentionSlideIn` CSS animation.

Usage recording hooks are attached to key user actions (viewing cookies, editing, deleting, exporting) so that `ChurnDetector` and `EngagementScore` have accurate data.

## Storage Schema

All data is persisted in `chrome.storage.local` under these keys:

| Key | Type | Description |
|-----|------|-------------|
| `usageHistory` | `{ [date]: { actions: string[], count: number } }` | Daily usage log |
| `lastChurnAssessment` | `{ level, factors, timestamp }` | Most recent background risk check |
| `celebratedMilestones` | `string[]` | IDs of milestones already shown |
| `dismissedTriggers` | `{ [id]: timestamp }` | Dismissed trigger IDs with expiry tracking |

## Privacy Notes

- All engagement data is stored **100% locally** in `chrome.storage.local`.
- No data is transmitted to any external server.
- No personally identifiable information is collected -- only action names and dates.
- Users can clear all retention data by clearing extension storage.

## Integration Notes

The three new modules are independent of each other and communicate only through the service worker message bus:

- **Load order:** `churn-detector.js` and `engagement-score.js` have no dependencies. `retention-triggers.js` calls into both to decide which trigger to surface.
- **Backward compatible:** All modules are additive. Removing them has no effect on core cookie management functionality.
- **Graceful degradation:** If storage keys are missing (first install, cleared data), all modules default to safe initial states (low risk, zero score, no triggers).

---

*Phase 17 -- Churn Prevention & Reactivation -- Complete*
*Part of Cookie Manager by Zovo (https://zovo.one)*
