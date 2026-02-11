# Zovo Cookie Manager -- Extension Specification

## Section 7: Analytics & Tracking

### 7.1 Events to Track

Every event follows a consistent schema: `{ event_name, timestamp, session_id, extension_version, browser, user_tier (free|starter|pro|team), properties }`. No personally identifiable information is ever collected. Cookie names are SHA-256 hashed before transmission. Domain names are included only as top-level domain (e.g., `example.com`, never full URLs with paths or query strings).

| Event | Trigger | Properties | Purpose |
|-------|---------|------------|---------|
| `extension_installed` | First install detected via `chrome.runtime.onInstalled` (reason: "install") | `source` (organic, referral, direct), `version`, `browser_version`, `os`, `locale`, `timezone` | Acquisition tracking, channel attribution, EU detection |
| `extension_updated` | Version update detected via `chrome.runtime.onInstalled` (reason: "update") | `old_version`, `new_version`, `days_since_install` | Update adoption rate, version fragmentation |
| `extension_uninstalled` | Uninstall survey page load (set via `chrome.runtime.setUninstallURL`) | `days_installed`, `was_pro`, `last_feature_used`, `total_sessions`, `profile_count`, `rule_count` | Churn analysis, feature gaps, tier-specific retention |
| `popup_opened` | Each popup open via popup script init | `domain`, `cookie_count`, `tab` (cookies/health/settings), `time_since_last_open_seconds` | Engagement frequency, session cadence |
| `cookie_viewed` | Cookie detail row expanded | `domain`, `cookie_name_hash`, `cookie_age_days` | Feature usage depth, which cookies draw attention |
| `cookie_edited` | Cookie value saved after edit | `domain`, `field_changed` (value/expiry/path/flags), `is_session_cookie` | Core feature usage, field-level engagement |
| `cookie_created` | New cookie saved via create form | `domain`, `is_secure`, `is_httponly` | Feature usage, security posture of user-created cookies |
| `cookie_deleted` | Cookie removed | `domain`, `bulk_or_single`, `count_deleted` | Usage patterns, bulk vs. single behavior |
| `cookies_exported` | Export action completed | `format` (json/netscape/csv/curl), `count`, `domain`, `file_size_bytes` | Format preference, export volume |
| `cookies_imported` | Import action completed | `format`, `count`, `conflicts_resolved`, `resolution_method` (skip/overwrite/rename) | Import complexity, conflict frequency |
| `profile_saved` | Profile created or updated | `profile_number` (1st, 2nd, 3rd...), `cookie_count`, `is_encrypted`, `is_update` | Conversion funnel -- 3rd save triggers paywall |
| `profile_loaded` | Profile restored via one-click load | `profile_id_hash`, `cookie_count`, `domain`, `load_time_ms` | Feature dependency, profile switching frequency |
| `rule_created` | Auto-delete rule added | `rule_number` (1st, 2nd...), `trigger_type` (tab_close/schedule), `pattern_type` (exact/glob) | Conversion funnel -- 2nd rule triggers paywall |
| `rule_triggered` | Auto-delete rule executed automatically | `rule_id_hash`, `cookies_deleted`, `trigger_type`, `domain` | Feature value proof, automation engagement |
| `health_score_viewed` | Health tab opened or badge clicked | `score_grade` (A-F), `score_value` (0-100), `risk_count`, `domain` | Engagement with differentiating feature |
| `gdpr_scan_run` | GDPR scan initiated | `domain`, `finding_count`, `categories_found` (necessary/functional/analytics/advertising), `is_first_scan` | Feature value, scan-to-upgrade correlation |
| `search_used` | Search bar receives input (debounced 500ms) | `query_length`, `result_count`, `regex_attempted` (boolean), `search_scope` (name/value/domain) | Feature usage, regex as Pro upgrade signal |
| `curl_generated` | cURL command copied to clipboard | `domain`, `cookie_count_included`, `is_cross_domain` (Pro) | Developer workflow integration |
| `limit_reached` | User hits any free tier ceiling | `limit_type` (profiles/rules/export/import/whitelist/protection/gdpr/regex), `current_count`, `limit_value` | Primary conversion trigger, limit frequency |
| `paywall_shown` | Paywall modal or banner rendered | `trigger_name` (profile_limit/rule_limit/export_limit/gdpr_blur/bulk_locked/regex_locked), `location` (modal/banner/inline), `times_shown_total`, `days_since_install` | Conversion funnel, paywall fatigue tracking |
| `paywall_dismissed` | User closes paywall without action | `trigger_name`, `times_dismissed_total`, `dismiss_method` (x_button/outside_click/escape_key), `view_duration_seconds` | Friction analysis, paywall effectiveness |
| `upgrade_clicked` | CTA button clicked on any paywall | `trigger_name`, `source_location` (modal/banner/settings/health_tab/gdpr_tab), `plan_preselected` | Conversion funnel, highest-converting entry points |
| `upgrade_completed` | Payment confirmed, license activated | `plan_tier` (starter/pro/team), `billing_period` (monthly/annual), `amount_cents`, `days_since_install`, `trigger_that_converted` | Revenue, time-to-convert, attribution |
| `upgrade_failed` | Payment or license activation error | `error_type` (payment_declined/network/license_invalid/timeout), `plan_tier`, `step_failed` (checkout/activation) | Drop-off analysis, payment friction |
| `settings_changed` | Any setting modified | `setting_name`, `old_value`, `new_value` | Preference trends, feature discovery |
| `theme_changed` | Theme toggled manually | `new_theme` (light/dark/system), `previous_theme` | UX preferences, dark mode adoption |
| `tab_switched` | Popup tab navigation | `from_tab`, `to_tab`, `time_on_previous_tab_seconds` | UI engagement, tab discovery |
| `zovo_cross_promo_clicked` | Clicked "More Zovo Tools" or specific extension link | `target_extension`, `promo_location` (footer/settings/post_upgrade) | Cross-sell effectiveness |
| `feature_discovery_shown` | Blue dot tooltip rendered for undiscovered feature | `feature_name`, `days_since_install`, `was_clicked` (boolean) | Onboarding effectiveness, feature awareness |
| `session_duration` | Popup closed or loses focus | `duration_seconds`, `actions_taken` (count), `tabs_visited` (count), `cookies_modified` (count) | Engagement depth per session |
| `onboarding_step_completed` | User completes an onboarding milestone | `step_name` (first_view/first_edit/first_export/first_profile), `step_number`, `time_to_complete_seconds` | Activation funnel, onboarding drop-off |
| `error_occurred` | Any unhandled error or API failure | `error_type`, `error_message_hash`, `context` (feature where error occurred), `extension_version` | Stability monitoring, bug prioritization |

### 7.2 Conversion Funnel

The funnel tracks users from acquisition through monetization. Each stage has a concrete definition, target rate, and diagnostic thresholds.

```
Install (100%)
  --> Active Day 1 (60%)
    --> Active Day 7 (35%)
      --> Core Feature Used (28%)
        --> Limit Hit (20%)
          --> Paywall Shown (18%)
            --> Upgrade Clicked (3%)
              --> Payment Page Loaded (2.5%)
                --> Payment Success (2%)
```

**Stage definitions and health metrics:**

| Stage | Definition | Target Rate | Healthy | Concerning | Critical |
|-------|-----------|-------------|---------|------------|----------|
| **Install** | `extension_installed` fires | 100% (baseline) | -- | -- | -- |
| **Active Day 1** | At least 2 `popup_opened` events on install day | 60% | >55% | 40-55% | <40% |
| **Active Day 7** | At least 1 `popup_opened` event on days 5-7 post-install | 35% | >30% | 20-30% | <20% |
| **Core Feature Used** | At least 1 of: `profile_saved`, `rule_created`, `cookies_exported`, `health_score_viewed`, `gdpr_scan_run` | 28% | >25% | 15-25% | <15% |
| **Limit Hit** | At least 1 `limit_reached` event | 20% | >18% | 10-18% | <10% |
| **Paywall Shown** | At least 1 `paywall_shown` event | 18% | >15% | 8-15% | <8% |
| **Upgrade Clicked** | At least 1 `upgrade_clicked` event | 3% | >2.5% | 1.5-2.5% | <1.5% |
| **Payment Page** | User reaches LemonSqueezy checkout (tracked via redirect URL) | 2.5% | >2% | 1-2% | <1% |
| **Payment Success** | `upgrade_completed` fires | 2% | >1.5% | 0.8-1.5% | <0.8% |

**Funnel diagnostics:**

- **Day 1 drop-off >50%:** The popup UI is not delivering immediate value. Investigate: Is the cookie list loading fast enough? Is the first-run experience clear? Are permissions scaring users away?
- **Day 7 drop-off >70%:** Users are not forming a habit. Investigate: Are they finding cookies useful beyond one-time checks? Is the extension discoverable (icon badge, keyboard shortcut)?
- **Limit Hit <10%:** Free limits are too generous, or users are not discovering Pro-gated features. Investigate: Are feature discovery blue dots rendering? Are users navigating beyond the Cookies tab?
- **Paywall Shown but Upgrade Clicked <1.5%:** The paywall copy, design, or timing is failing. A/B test: different copy, different trigger moment, different value proposition framing.
- **Upgrade Clicked but Payment Success <60% of clicks:** Checkout friction. Investigate: Is LemonSqueezy loading correctly? Is the plan pre-selected? Are pricing tiers clear?

**Cohort analysis cadence:** Run weekly cohorts segmented by install source, browser, and locale. Compare Day 1/7/30 retention across cohorts to identify high-value acquisition channels.

### 7.3 Analytics Implementation

**Privacy-first architecture:**

- **No PII collected.** No email addresses, usernames, IP addresses, or full URLs are transmitted. Cookie names are SHA-256 hashed before inclusion in any event.
- **Domain-level only.** Only the registrable domain (eTLD+1) is recorded, never full URLs, paths, or query parameters.
- **EU opt-out by default.** On `extension_installed`, detect the user's timezone via `Intl.DateTimeFormat().resolvedOptions().timeZone`. If the timezone maps to an EU/EEA country, analytics are disabled by default. A non-intrusive banner in Settings reads: "Help improve Zovo by sharing anonymous usage data. No personal information is collected. [Enable] [Learn more]."
- **Global opt-out.** All users can disable analytics in Settings at any time. The toggle is prominently placed, not buried. When disabled, the local event queue is flushed (deleted), and no further events are queued.
- **No third-party scripts.** Analytics are sent to a first-party Zovo endpoint (`analytics.zovo.app/v1/events`). No Google Analytics, no Mixpanel, no Segment. This keeps the extension lightweight and avoids third-party data sharing.

**Batching and queuing:**

- Events are written to a local queue in `chrome.storage.local` under the key `zovo_analytics_queue`.
- A `chrome.alarms` alarm fires every 5 minutes to flush the queue. The service worker reads all queued events, sends them in a single POST request to the analytics endpoint, and clears the queue on success.
- **Payload format:** `{ batch_id, extension_id: "cookie-manager", events: [...], sent_at }`. Each event includes `event_name`, `timestamp`, `session_id`, `properties`.
- **Retry logic:** If the API returns a non-2xx response or the request times out (10-second timeout), the events remain in the queue for the next flush cycle.
- **Queue cap:** Maximum 1,000 events stored locally. If the queue exceeds 1,000 events (e.g., prolonged offline), the oldest events are discarded first (FIFO eviction). At typical usage of 10-20 events per session, this represents approximately 50-100 sessions of buffer.
- **Storage budget:** The analytics queue should never exceed 500KB of `chrome.storage.local`. Each event averages ~300 bytes, so 1,000 events consume approximately 300KB, well within budget.

**Session management:**

- A session starts when the popup opens and ends when it closes or loses focus. A `session_id` (UUID v4) is generated on popup open and included in all events within that session.
- The `session_duration` event fires on popup close with aggregate metrics for the session.

### 7.4 Key Dashboards

**Dashboard 1: Growth Dashboard**

Purpose: Track acquisition, retention, and overall extension health. Reviewed daily by the product lead.

| Metric | Visualization | Data Source |
|--------|--------------|-------------|
| Daily Active Users (DAU) | Line chart, 30-day rolling | Count of unique `session_id` per day |
| Weekly Active Users (WAU) | Line chart, 12-week rolling | Count of unique users with at least 1 `popup_opened` in trailing 7 days |
| MAU / DAU ratio | Single number + trend | Stickiness indicator; target >20% |
| New installs (daily) | Bar chart + cumulative line | `extension_installed` count |
| Uninstalls (daily) | Bar chart + net growth line | `extension_uninstalled` count |
| Net growth rate | Single number | (Installs - Uninstalls) / Total users |
| Day 1 / Day 7 / Day 30 retention | Cohort retention curves | Cohorted by install week, measuring `popup_opened` recurrence |
| Install source breakdown | Pie chart | `extension_installed.source` distribution |
| Chrome Web Store rating | Single number + trend | External scrape or manual entry |
| Error rate | Line chart with threshold alert | `error_occurred` count / DAU; alert if >2% |

**Dashboard 2: Conversion Dashboard**

Purpose: Track monetization funnel performance and paywall effectiveness. Reviewed weekly by the product and growth team.

| Metric | Visualization | Data Source |
|--------|--------------|-------------|
| Funnel waterfall | Horizontal funnel chart | All 9 funnel stages with drop-off percentages |
| Conversion rate (overall) | Single number + trend | `upgrade_completed` / total installs (lifetime) |
| Conversion rate (30-day cohort) | Line chart by cohort | `upgrade_completed` within 30 days of install / cohort size |
| Paywall performance by trigger | Ranked table | For each `trigger_name`: impressions, click-through rate, conversion rate |
| Revenue (MRR) | Line chart + breakdown by tier | Sum of `upgrade_completed.amount_cents` by `billing_period` |
| Revenue by tier | Stacked bar chart | `upgrade_completed` segmented by `plan_tier` |
| Annual vs. monthly split | Donut chart | `upgrade_completed.billing_period` distribution; target >40% annual |
| Time to convert | Histogram | `upgrade_completed.days_since_install` distribution |
| Paywall fatigue index | Line chart | Average `times_shown_total` at time of conversion vs. time of churn |
| Upgrade failure rate | Single number + trend | `upgrade_failed` / `upgrade_clicked`; alert if >15% |
| Top converting trigger | Ranked list | `trigger_that_converted` from `upgrade_completed`, sorted by volume |
| Limit hit frequency | Bar chart by limit type | `limit_reached.limit_type` distribution |

**Dashboard 3: Feature Dashboard**

Purpose: Understand which features drive engagement and conversion. Reviewed weekly to inform roadmap prioritization.

| Metric | Visualization | Data Source |
|--------|--------------|-------------|
| Feature usage frequency | Ranked bar chart | Count of each feature event (edit, create, delete, export, import, profile, rule, health, gdpr, search, curl) per week |
| Feature usage by tier | Grouped bar chart | Same as above, segmented by `user_tier` |
| Most-used Pro features | Ranked list | Feature events where `user_tier` is pro/team, sorted by frequency |
| Least-used features | Bottom 5 list | Features with <5% weekly active user engagement |
| Feature-to-conversion correlation | Scatter plot | For each feature, plot usage frequency vs. conversion rate of users who used that feature |
| Profile usage depth | Histogram | Distribution of `profile_saved.profile_number` -- how many profiles do active users create? |
| Export format preference | Pie chart | `cookies_exported.format` distribution among Pro users |
| Search regex adoption | Percentage gauge | `search_used` events where `regex_attempted` = true / total searches |
| Tab navigation heatmap | Flow diagram | `tab_switched` from/to patterns showing user navigation paths |
| Session engagement depth | Histogram | `session_duration.actions_taken` distribution |
| Cross-sell click-through | Single number + trend | `zovo_cross_promo_clicked` / `popup_opened` where promo was visible |
| Onboarding completion rate | Funnel chart | `onboarding_step_completed` by step, showing drop-off at each milestone |

---

## Section 8: Launch Checklist

### Pre-Development

- [ ] Spec reviewed and approved by product lead and engineering lead
- [ ] Sections 1-9 of this specification finalized and version-controlled
- [ ] Design system chosen (Tailwind CSS + shadcn/ui components recommended)
- [ ] Component library prototyped: popup layout, modal, banner, cookie row, tab bar
- [ ] API endpoints documented: analytics ingestion, license validation, Zovo cloud sync
- [ ] LemonSqueezy account configured with 4 Zovo products (Free/Starter/Pro/Team)
- [ ] LemonSqueezy webhook endpoint deployed for payment events (checkout.completed, subscription.updated, subscription.cancelled)
- [ ] Supabase Auth project created with Google OAuth provider configured
- [ ] Development environment set up: TypeScript 5.x, Vite/CRXJS for MV3, ESLint, Prettier
- [ ] GitHub repository created with branch protection on `main`, CI/CD via GitHub Actions
- [ ] `@zovo/auth` shared module available or stubbed for local development
- [ ] Chrome Developer Dashboard account verified (one-time $5 fee paid)
- [ ] Privacy policy draft reviewed by legal, hosted at `zovo.app/privacy`

### Development -- Core (Week 1-2)

- [ ] Manifest V3 scaffold: `manifest.json` with `permissions: ["cookies", "activeTab", "storage", "alarms"]`, service worker, popup entry point
- [ ] Popup UI shell: tab bar (Cookies / Health / Settings), responsive layout, dark/light mode with `prefers-color-scheme` detection
- [ ] Cookies tab: sortable table displaying all cookies for the active domain (name, value truncated, domain, path, expiry, size, httpOnly, secure, sameSite)
- [ ] Cookie count badge on extension icon via `chrome.action.setBadgeText`
- [ ] Cookie detail expansion: click row to expand and view full value, all fields
- [ ] Edit cookie: inline editing with field validation, save via `chrome.cookies.set()`
- [ ] Create cookie: form with pre-filled defaults from active tab domain
- [ ] Delete cookie: single delete with confirmation, delete-all-for-domain with confirmation
- [ ] Search and filter: real-time plain-text search across name, value, domain
- [ ] Export cookies: JSON format, current domain, max 25 cookies, one-click download
- [ ] Import cookies: JSON format, file picker, schema validation, preview before apply
- [ ] Settings page: theme toggle, analytics opt-in/out, about/version, links to privacy policy and support
- [ ] Basic analytics: event queue in `chrome.storage.local`, 5-minute batch flush via `chrome.alarms`, privacy controls

### Development -- Premium Features (Week 2-3)

- [ ] Cookie profiles: save/load named cookie sets with 2-free-profile limit
- [ ] Profile paywall: modal triggers on 3rd profile save attempt
- [ ] Auto-delete rules: 1 free rule, fires on `chrome.tabs.onRemoved`
- [ ] Rule paywall: modal triggers on 2nd rule creation attempt
- [ ] Cookie Health Score: scoring algorithm (httpOnly +20, secure +20, sameSite +20, no long expiry +20, no third-party +20), badge on icon
- [ ] Health Score detail tab: per-cookie breakdown (blurred for free, full for Pro)
- [ ] GDPR compliance scan: classify cookies against bundled tracker list, 1 free scan per domain, results blurred after top 3
- [ ] GDPR paywall: "Unlock full report" overlay on blurred results
- [ ] Paywall modal component: reusable modal with trigger name, value proposition copy, CTA button, "Not now" dismiss
- [ ] Paywall banner component: inline yellow banner for soft nudges, dismissible, max 3 appearances before converting to subtle badge dot
- [ ] Usage counter UI: "2 of 2 profiles used" progress indicators
- [ ] Lock icons and [Pro] badges on gated features throughout the UI
- [ ] `@zovo/auth` integration: sign-in flow, license token storage in `chrome.storage.sync`, tier detection
- [ ] LemonSqueezy checkout redirect: pre-selected plan, pre-filled email if authenticated
- [ ] License validation: check on extension start, cache for 72 hours (offline grace period)
- [ ] Tier enforcement: read `user_tier` from `chrome.storage.sync`, gate features accordingly

### Development -- Polish (Week 3-4)

- [ ] Bulk operations (Pro): multi-select checkboxes, select-all per domain, batch delete/export/add-to-profile
- [ ] Whitelist/blacklist: 5-domain free limit, UI for managing entries
- [ ] Cookie protection: mark up to 5 cookies as read-only (free), intercept edit/delete with warning
- [ ] cURL command generation: current-site cookies, one-click copy to clipboard
- [ ] Regex search (Pro): full JS regex with syntax validation and error feedback
- [ ] Context menu integration: right-click on page to open Cookie Manager for current domain
- [ ] Keyboard shortcuts: `Ctrl+Shift+K` to open popup, `Ctrl+F` for search within popup, `Escape` to close modals
- [ ] Onboarding first-run experience: welcome screen on first install, guided tour of 4 key features (view, edit, profiles, health), feature discovery blue dots on untried features
- [ ] Error handling: graceful degradation for API failures, user-friendly error messages, automatic retry for transient errors
- [ ] Performance optimization: popup opens in <200ms, lazy-load cookie details, virtualized list for domains with 100+ cookies, no memory leaks on long sessions
- [ ] Uninstall survey URL: set via `chrome.runtime.setUninstallURL` pointing to short feedback form

### Testing

- [ ] **Free tier validation:** All free features work within documented limits; no accidental access to Pro features
- [ ] **Pro tier validation:** All features unlocked correctly when valid Pro license is present
- [ ] **Starter tier validation:** Starter-specific limits enforced (if tier has distinct limits)
- [ ] **Team tier validation:** Team sharing, 5 seats, role-based access working
- [ ] **Paywall trigger accuracy:** Each of the 6+ paywall triggers fires at the exact correct moment (3rd profile, 2nd rule, 26th export cookie, etc.)
- [ ] **Upgrade flow end-to-end:** CTA click -> LemonSqueezy checkout -> payment -> webhook -> license issued -> `chrome.storage.sync` updated -> features unlocked in <5 seconds
- [ ] **Downgrade/expiry flow:** Pro license expires -> 72-hour grace period -> graceful downgrade to free tier (no data loss, profiles preserved but locked beyond 2)
- [ ] **Cross-browser testing:** Chrome 120+, Edge 120+, Brave latest, Opera latest -- all core features functional
- [ ] **Analytics event audit:** Every event in the tracking table fires correctly with accurate properties; verify batch queue and flush cycle
- [ ] **Offline behavior:** Extension usable without internet; Pro features remain unlocked for 72 hours after last successful license check; analytics queue does not overflow
- [ ] **Performance benchmarks:** Popup opens in <200ms on a domain with 50 cookies; memory usage stays under 50MB after 30-minute session; no service worker crashes
- [ ] **Edge cases:** Domain with 0 cookies, domain with 500+ cookies, corrupt import file, expired cookie, cookie with unicode characters, cookie value >4KB
- [ ] **Security review:** No cookie values transmitted to analytics; hashing verified; no XSS vectors in cookie value display; CSP headers in popup HTML
- [ ] **Accessibility:** Keyboard navigation through all UI elements; screen reader labels on icons and buttons; color contrast ratios meet WCAG AA

### Pre-Launch

- [ ] **Chrome Web Store listing title:** "Zovo Cookie Manager -- View, Edit & Manage Cookies" (max 75 chars)
- [ ] **Chrome Web Store description:** 500-word description with keywords: "cookie manager", "cookie editor", "EditThisCookie alternative", "MV3 cookie manager", "manage cookies Chrome", "cookie profiles", "GDPR cookies"
- [ ] **Category:** Developer Tools
- [ ] **Screenshots:** 5 screenshots at 1280x800:
  1. Cookie list view (light mode) -- "See every cookie at a glance"
  2. Edit cookie with inline form -- "Edit any cookie field instantly"
  3. Cookie profiles with one-click restore -- "Switch sessions in one click"
  4. Health Score report -- "Know your cookie security score"
  5. Dark mode full view -- "Beautiful dark mode included"
- [ ] **Promotional tiles:** Small tile (440x280), large tile (920x680), marquee tile (1400x560) -- consistent Zovo branding, tagline, key feature callouts
- [ ] **Extension icon:** 128x128 and 48x48 PNG, visually distinct at 16x16 in toolbar
- [ ] **Privacy policy:** Published and accessible at `zovo.app/privacy`, covering: data collected (anonymous analytics only), data not collected (no PII, no cookie values), opt-out mechanism, data retention (90 days), contact information
- [ ] **Support infrastructure:** Support email (`support@zovo.app`) configured and monitored; GitHub Issues template created for bug reports and feature requests
- [ ] **Changelog:** Version 1.0.0 release notes written, published at `zovo.app/cookie-manager/changelog`
- [ ] **Analytics endpoint:** `analytics.zovo.app/v1/events` deployed, tested with sample payloads, monitoring alerts configured
- [ ] **License validation endpoint:** Deployed and tested; returns correct tier for valid/invalid/expired licenses
- [ ] **Backup and rollback plan:** Previous extension version packaged and ready for emergency rollback via Chrome Web Store

### Launch

- [ ] Extension `.zip` submitted to Chrome Web Store via Developer Dashboard
- [ ] Review status monitored (typical review: 1-3 business days; complex extensions may take longer)
- [ ] Review approved and extension published (public visibility confirmed)
- [ ] Verify extension installable from Chrome Web Store listing
- [ ] Verify analytics events flowing to dashboard (install event from real user)
- [ ] Verify license validation working in production (test upgrade with real LemonSqueezy checkout)
- [ ] Monitoring dashboard live: error rate, install rate, API latency, service worker health
- [ ] Support channels confirmed operational: email auto-responder set, GitHub Issues monitored
- [ ] **Product Hunt launch:** Listing prepared with tagline, description, 4 screenshots, maker comment
- [ ] **Reddit posts:** r/chrome ("I built an MV3 cookie manager to replace EditThisCookie"), r/webdev ("Cookie manager with health scoring and GDPR scanning"), r/webdev weekly showcase thread
- [ ] **Twitter/X announcement:** Thread with GIF demos of key features, tag relevant dev tool accounts
- [ ] **Hacker News:** "Show HN" post if community reception warrants
- [ ] **Dev community outreach:** Dev.to article, relevant Discord servers (Chrome Extensions, Web Dev)
- [ ] **SEO content:** Blog post at `zovo.app/blog` targeting "EditThisCookie alternative 2026" and "best cookie manager Chrome extension"

### Post-Launch (Week 1)

- [ ] Monitor crash reports and `error_occurred` events hourly for first 48 hours
- [ ] Respond to every Chrome Web Store review within 24 hours (positive: thank and ask for feature requests; negative: acknowledge, ask for details, commit to fix timeline)
- [ ] Daily check: conversion funnel dashboard for unexpected drop-offs
- [ ] Daily check: uninstall rate -- alert if >5% daily uninstall rate in first week
- [ ] Triage and fix any critical bugs within 24 hours; submit hotfix update to Chrome Web Store
- [ ] Review analytics data quality: Are all events firing? Are properties populated correctly? Any null/missing fields?
- [ ] Identify top 3 highest-converting paywall triggers from real data
- [ ] Begin first A/B test: vary paywall copy on the highest-volume trigger (profile limit)
- [ ] Gather qualitative feedback: reach out to 10 active users via support email for 5-minute feedback calls
- [ ] Assess initial Chrome Web Store search ranking for target keywords
- [ ] Cross-sell measurement: track `zovo_cross_promo_clicked` volume and downstream installs of other Zovo extensions

---

## Section 9: Success Criteria

Every target below is a concrete, measurable number. Metrics are tracked via the dashboards defined in Section 7.4 and reviewed at the cadences specified.

### Week 1 Targets

| Metric | Target | Rationale | Measurement |
|--------|--------|-----------|-------------|
| Total installs | 500+ | EditThisCookie displaced users searching for alternatives; SEO keywords "EditThisCookie alternative" and "cookie manager Chrome" in listing | `extension_installed` count |
| Day 1 retention | 60%+ | Users who open the extension at least twice on install day; indicates immediate value delivery | Cohort: users with 2+ `popup_opened` events on day 0 / total installs |
| Critical bugs | 0 | No data loss, no crashes, no broken core features (view/edit/create/delete) | `error_occurred` events with severity "critical"; Chrome Web Store crash reports |
| Minor bugs | <3 reported | Minor UI glitches, non-blocking edge cases acceptable | GitHub Issues + Chrome Web Store reviews mentioning bugs |
| Average rating | 4.0+ | Floor for credibility; anything below 4.0 signals a quality problem requiring immediate hotfix | Chrome Web Store rating |
| Review count | 5+ | Enough reviews to establish initial social proof | Chrome Web Store review count |
| Analytics pipeline | Fully operational | All 30+ events firing, dashboards populated, batch queue flushing correctly | Manual audit of dashboard data completeness |
| Popup load time | <200ms (p95) | Performance is a competitive advantage; EditThisCookie fork is notably slow | `popup_opened` timestamp minus page load start (internal timing) |
| Error rate | <1% of sessions | Fewer than 1 in 100 sessions encounters any error | `error_occurred` count / unique `session_id` count |

### Month 1 Targets

| Metric | Target | Rationale | Measurement |
|--------|--------|-----------|-------------|
| Total installs | 2,000+ | Sustained organic growth from Chrome Web Store search ranking, Reddit/community posts, and word-of-mouth | Cumulative `extension_installed` count |
| Day 7 retention | 35%+ | Users returning after first week indicate habit formation | Cohort: users with `popup_opened` on days 5-7 / install cohort size |
| Day 30 retention | 20%+ | Monthly active users from the install cohort | Cohort: users with `popup_opened` on days 25-30 / install cohort size |
| Users hitting a free limit | 20% of WAU | Validates that free limits are correctly calibrated -- not too generous, not too restrictive | Unique users with `limit_reached` / WAU |
| Users seeing a paywall | 18% of WAU | Paywall rendering slightly below limit-hit rate (some users hit limits but may not see paywall immediately) | Unique users with `paywall_shown` / WAU |
| Free-to-paid conversion | 2-3% of total installs (40-60 paying users) | Conservative month-1 target; most conversions happen in the first 30 days | `upgrade_completed` count / cumulative installs |
| MRR contribution | $200-$300 | Based on 40-60 users at blended ARPU of ~$5.50 (mix of $4 Starter and $7 Pro) | Sum of active subscription revenue |
| Average rating | 4.3+ | Above the EditThisCookie fork (4.1); approaching Cookie-Editor (4.6) | Chrome Web Store rating |
| Review count | 20+ | Sufficient social proof to influence new users' install decisions | Chrome Web Store review count |
| Top 3 paywall triggers identified | Ranked by conversion rate | Data-driven prioritization for A/B testing in month 2 | `upgrade_completed.trigger_that_converted` analysis |
| Chrome Web Store search ranking | Top 10 for "cookie manager" | Installs + rating + keyword relevance drive CWS ranking algorithm | Manual search verification |
| Support response time | <24 hours for all inquiries | Responsive support drives positive reviews | Email response timestamps |
| Cross-sell installs | 5%+ of Cookie Manager users install 1 other Zovo extension | Early signal of portfolio synergy | `zovo_cross_promo_clicked` -> downstream install tracking |

### Month 3 Targets

| Metric | Target | Rationale | Measurement |
|--------|--------|-----------|-------------|
| Total installs | 5,000+ | Continued organic growth plus impact of SEO content and community presence | Cumulative `extension_installed` count |
| Conversion rate | 5-7% of total installs | Approaching steady-state conversion; paywall A/B tests should be lifting rate | `upgrade_completed` / cumulative installs |
| Paying users | 250-350 | 5,000 installs x 5-7% conversion | Active subscriptions count |
| MRR | $1,375-$2,450 | 250-350 users x $5.50 blended ARPU | LemonSqueezy MRR dashboard |
| Cookie Manager standalone MRR | $50-$150 | Conservative: some revenue is bundled Zovo membership attributed across extensions | Attributed MRR from cookie-manager-sourced upgrades |
| Average rating | 4.5+ | Competitive with Cookie-Editor (4.6); significant trust signal | Chrome Web Store rating |
| Review count | 50+ | Strong social proof; helps CWS ranking | Chrome Web Store review count |
| Chrome Web Store search ranking | Top 5 for "cookie manager" and "cookie editor" | Ranking improvement from install velocity and rating | Manual search verification |
| A/B tests completed | 2+ paywall variants tested | Systematic optimization of highest-volume paywall trigger | A/B test framework results |
| Annual billing adoption | 30%+ of paid users on annual plans | Annual billing drives 30-40% higher LTV; pre-selected annual plan in checkout | `upgrade_completed.billing_period` distribution |
| Day 30 retention (month 3 cohort) | 25%+ | Improving retention as onboarding and feature discovery improve | Cohort retention analysis |
| Net Promoter Score (NPS) | 40+ | Measured via optional in-extension survey at day 30 | Survey responses |
| Feature usage breadth | 60%+ of WAU uses 3+ distinct features per week | Indicates users are engaging beyond basic cookie viewing | Distinct feature events per user per week |

### Month 6 Targets

| Metric | Target | Rationale | Measurement |
|--------|--------|-----------|-------------|
| Total installs | 10,000+ | Doubling from month 3 through sustained SEO, community, and organic growth | Cumulative `extension_installed` count |
| Conversion rate | Stable 5-7% | Steady-state conversion after funnel optimization | `upgrade_completed` / cumulative installs |
| Paying users | 500-700 | 10,000 installs x 5-7% | Active subscriptions count |
| MRR | $2,750-$4,900 | 500-700 users x $5.50 blended ARPU | LemonSqueezy MRR dashboard |
| Cookie Manager standalone MRR | $100-$200 | Growth from month 3 standalone target | Attributed MRR |
| Cross-sell rate | 10%+ of Cookie Manager users install at least 1 other Zovo extension | Meaningful portfolio synergy; Cookie Manager proven as top-of-funnel entry point | Cross-extension install tracking |
| Zovo membership upgrades sourced from Cookie Manager | 15%+ of Cookie Manager paid users on full Zovo membership ($14/mo) | Users who start with Cookie Manager and upgrade to the full bundle for access to 18+ extensions | `upgrade_completed.plan_tier` = "team" or Zovo membership tier |
| Average rating | 4.5+ sustained | Maintained through responsive support and continuous quality improvements | Chrome Web Store rating |
| Review count | 100+ | Dominant social proof in the category | Chrome Web Store review count |
| Chrome Web Store search ranking | Top 3 for "cookie manager", top 5 for "cookie editor", top 3 for "EditThisCookie alternative" | SEO dominance in the category | Manual search verification |
| Annual billing adoption | 40%+ of paid users | Increasing annual adoption through in-app messaging to monthly subscribers | Billing period distribution |
| Feature roadmap informed by data | 3+ feature decisions backed by analytics | Dashboard data directly influencing what gets built next | Product decision log |
| Community feedback loop | Active channel with 50+ participants | Discord channel, GitHub Discussions, or similar community space where users provide ongoing feedback | Community membership count |
| Churn rate (monthly) | <5% | Fewer than 5% of paid users cancel per month | (Cancellations in month) / (Active subscribers at start of month) |
| LTV per user | $40+ | Based on average subscription duration of 7+ months at $5.50/month ARPU | LemonSqueezy cohort LTV analysis |
| Paywall optimization | 4+ A/B tests completed, winning variants deployed | Continuous improvement of conversion rate through systematic experimentation | A/B test log and results |

### Long-Term North Star (12 Months)

| Metric | Target | Significance |
|--------|--------|-------------|
| Total installs | 25,000+ | Establishes Zovo Cookie Manager as a top-3 cookie management extension by user count |
| Paying users | 1,250-1,750 | Meaningful revenue contributor to the Zovo portfolio |
| MRR (portfolio contribution) | $6,875-$12,250 | Cookie Manager as one of the top 3 revenue-generating Zovo extensions |
| Chrome Web Store ranking | #1 or #2 for "cookie manager" | Category leadership through sustained quality, reviews, and install velocity |
| Average rating | 4.6+ | Best-in-class rating, matching or exceeding Cookie-Editor |
| Brand recognition | "Zovo" recognized as a trusted extension brand in developer communities | Qualitative: mentions in blog posts, recommendations in forums, organic backlinks |

---

*End of Sections 7, 8, and 9. This document completes the Analytics & Tracking, Launch Checklist, and Success Criteria specifications for the Zovo Cookie Manager Chrome extension.*
