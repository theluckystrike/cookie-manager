# Agent 5: Analytics, A/B Testing Framework & Measurement System

**Extension:** Zovo Cookie Manager
**Role:** Conversion rate optimization specialist and analytics architect
**Dependencies:** Agent 1 keyword audit, Agent 2 visual/review strategy, Agent 3 content/competitive analysis, Agent 4 psychology/touchpoints, Phase 02 analytics spec (Section 7-8-9), Phase 04 monetization analytics (Agent 5)
**Objective:** Build the measurement infrastructure that validates every ASO and conversion hypothesis from Agents 1-4, and establish a continuous optimization loop

---

## 1. Metric Definitions

### 1.1 Primary KPIs

#### Free-to-Paid Conversion Rate
- **Definition:** Percentage of users who upgrade from the free tier to any paid tier (Starter, Pro, or Team) within a defined attribution window
- **Calculation:** `(upgrade_completed events in period) / (extension_installed events in attribution cohort) * 100`
- **Attribution window:** 90 days from install. A user who installs on January 1 and upgrades on March 15 counts toward the January cohort's conversion rate
- **Target:** 2-5% within 90 days of install
  - Month 1 target: 2-3% (early adopters, higher intent)
  - Month 3 target: 3-5% (stable, optimized funnel)
  - Month 6 target: 5-7% (with A/B test winners deployed)
- **Segmented targets:**
  - Developer segment: 4-7% (high willingness to pay for tools)
  - QA engineer segment: 3-5% (employer may reimburse)
  - Marketer segment: 2-4% (less frequent cookie management need)
  - Casual/privacy user: 1-2% (least likely to convert)
- **Alert threshold:** Below 1.5% sustained over 14 days triggers investigation

#### ARPU (Average Revenue Per User)
- **Definition:** Total monthly revenue divided by total active users (free + paid)
- **Calculation:** `(sum of all monthly payments) / (MAU count)`
- **Target ARPU:** $0.08-$0.35/month per active user
- **Blended revenue per paying user:**
  - Starter ($4/mo): 60% of conversions = $2.40 weighted
  - Pro ($7/mo): 30% of conversions = $2.10 weighted
  - Team ($14/mo): 10% of conversions = $1.40 weighted
  - Blended paying user revenue: ~$5.90/month
- **Annual billing discount impact:** Assume 40% choose annual (25% discount), reducing effective monthly revenue to ~$5.16/paying user
- **With 3% conversion rate and 10,000 MAU:** 300 paying users * $5.16 = ~$1,548 MRR

#### LTV (Lifetime Value)
- **Definition:** Average total revenue generated per paying user over their entire subscription lifetime
- **Calculation:** `ARPU_paying_user / monthly_churn_rate`
- **Estimated monthly churn rate:** 5-8% (standard for developer tools at this price point)
- **LTV targets by tier:**
  - Starter: $4/mo / 0.06 churn = $66.67 LTV
  - Pro: $7/mo / 0.05 churn = $140.00 LTV (lower churn -- more invested)
  - Team: $14/mo / 0.04 churn = $350.00 LTV (lowest churn -- organizational buy)
- **Blended LTV target:** $80-$120
- **LTV:CAC ratio target:** >3:1 (since CAC for organic CWS installs is effectively $0, this should be easily met; watch if paid acquisition is added)

#### Install Rate (CWS Impression-to-Install)
- **Definition:** Percentage of Chrome Web Store search impressions that result in an extension install
- **Calculation:** `(total installs in period) / (CWS impressions in period) * 100`
- **Funnel breakdown:**
  - Impression-to-detail-page click: 8-15% target
  - Detail-page-to-install: 25-40% target
  - Overall impression-to-install: 2-6% target
- **Data source:** Chrome Web Store Developer Dashboard analytics
- **Alert threshold:** Below 2% overall install rate sustained over 7 days

#### Retention Rate
- **Definition:** Percentage of users who open the extension at least once within a defined period after install
- **Targets:**

| Period | Definition | Target | Healthy | Concerning | Critical |
|--------|-----------|--------|---------|------------|----------|
| D1 | At least 1 popup_opened on day after install | 60% | >55% | 40-55% | <40% |
| D7 | At least 1 popup_opened in days 5-7 | 35% | >30% | 20-30% | <20% |
| D14 | At least 1 popup_opened in days 12-14 | 25% | >22% | 15-22% | <15% |
| D30 | At least 1 popup_opened in days 25-30 | 18% | >15% | 10-15% | <10% |

- **Retention by segment (target):**
  - Developers: D30 25% (daily workflow tool)
  - QA engineers: D30 20% (project-based usage)
  - Marketers: D30 12% (occasional use)
  - Casual users: D30 8% (one-off need)

### 1.2 Secondary KPIs

#### Paywall View Rate
- **Definition:** Percentage of active users who see at least one paywall in a given period
- **Calculation:** `(unique users with paywall_shown event) / (MAU) * 100`
- **Target:** 18-25% of MAU
- **Too low (<10%):** Free limits are too generous or users are not discovering Pro-gated features
- **Too high (>40%):** Paywall fatigue risk; review frequency caps

#### Paywall Conversion Rate (Views to Upgrades)
- **Definition:** Percentage of paywall views that result in a completed upgrade
- **Calculation:** `(upgrade_completed events) / (paywall_shown events) * 100`
- **Target:** 2-4% of paywall views
- **Breakdown by paywall type:**
  - Hard block (profile/rule limit): 3-5% target (highest urgency)
  - Soft banner (export limit): 1-3% target (lower friction but lower urgency)
  - Discovery/blur (health score, GDPR): 1-2% target (curiosity-driven)

#### Upgrade Page Visit Rate
- **Definition:** Percentage of paywall views where the user clicks through to the upgrade page
- **Calculation:** `(upgrade_clicked events) / (paywall_shown events) * 100`
- **Target:** 12-18% click-through rate
- **Alert:** Below 8% sustained over 7 days -- paywall copy needs revision

#### Email Open/Click Rates
- **Definition:** Standard email engagement metrics for the behavior-triggered email sequences (per Agent 4 drip campaigns)
- **Targets:**
  - Open rate: 25-35% (developer audience is above average for SaaS)
  - Click-through rate (CTR): 3-6%
  - Unsubscribe rate: <0.5% per email
  - Email-to-upgrade rate: 0.5-1.5% of email recipients

#### Feature Adoption Rates
- **Definition:** Percentage of active users who use each key feature at least once within 30 days
- **Targets:**

| Feature | Event | D7 Adoption Target | D30 Adoption Target |
|---------|-------|--------------------|---------------------|
| Cookie viewing | cm_cookie_viewed | 85% | 90% |
| Cookie editing | cm_cookie_edited | 45% | 55% |
| Cookie creation | cm_cookie_created | 20% | 30% |
| Profile creation | cm_profile_created | 15% | 25% |
| Rule creation | cm_rule_created | 8% | 15% |
| Export | cm_export_triggered | 25% | 35% |
| Health score viewed | cm_health_viewed | 20% | 30% |
| Search used | cm_search_used | 40% | 55% |
| Keyboard shortcut used | cm_shortcut_used | 5% | 12% |

### 1.3 Micro-Conversions (Leading Indicators)

These micro-events predict future conversion and retention. Track them to optimize the activation funnel.

#### Time to First Cookie Edit
- **Definition:** Seconds from first popup_opened to first cm_cookie_edited
- **Target:** <120 seconds (user finds value immediately)
- **Alert:** Median >300 seconds suggests the edit UI is not discoverable

#### Time to First Profile Creation
- **Definition:** Seconds from install to first cm_profile_created
- **Target:** <48 hours for users who navigate to the Profiles tab
- **Significance:** Profile creators convert at 3-5x the rate of non-creators

#### Time to First Rule Creation
- **Definition:** Seconds from install to first cm_rule_created
- **Target:** <72 hours for users who navigate to the Rules tab
- **Significance:** Rule creators are the highest-LTV segment

#### Keyboard Shortcut Discovery Rate
- **Definition:** Percentage of users who use Ctrl+Shift+K (popup) or Ctrl+Shift+E (quick export) at least once within D30
- **Target:** 12% discovery rate
- **Improvement lever:** Feature discovery blue dots, onboarding step mention

#### Tab Navigation Depth
- **Definition:** Number of unique popup tabs visited per session (Cookies, Profiles, Rules, Health)
- **Target:** Average 2.1 tabs per session by D7
- **Significance:** Users who visit 3+ tabs in first session convert at 2x the rate of single-tab users

#### Second Session Return
- **Definition:** Percentage of users who open the popup a second time (any day after first use)
- **Target:** 70% second-session rate
- **Alert:** Below 55% -- first-session experience is not creating return behavior

#### Feature Discovery Milestone
- **Definition:** Percentage of users who complete the onboarding milestone sequence (first_view, first_edit, first_export, first_profile)
- **Target:** 40% complete at least 3 of 4 milestones within D7

---

## 2. A/B Test Roadmap (Prioritized by Impact x Ease)

### 2.1 HIGH IMPACT TESTS (Months 1-2)

#### Test 1: Extension Name (Keyword-Optimized vs Brand-First)

- **Hypothesis:** "If we front-load the primary keyword 'Cookie Editor' in the extension name, then the CWS install rate will increase by 15-25% because users scanning search results match on the first 2-3 words"
- **Control:** "Zovo Cookie Manager - Edit, Export & Auto-Delete Cookies"
- **Variant A:** "Cookie Editor & Manager - Profiles, Auto-Delete | Zovo"
- **Variant B:** "Cookie Editor Pro - View, Edit, Export & Manage Cookies"
- **Primary metric:** CWS impression-to-install rate
- **Secondary metrics:** CWS impression-to-detail-page rate, brand search volume for "Zovo"
- **Sample size needed:** 10,000 impressions per variant (minimum)
- **Duration:** 14-21 days (CWS allows metadata changes; measure before/after since simultaneous A/B is not possible on CWS)
- **Success criteria:** >10% lift in impression-to-install rate with no decrease in detail-page conversion
- **Risk:** Brand dilution if Zovo is moved to the end. Monitor brand search queries
- **Implementation:** Sequential test -- run Control for 14 days, then Variant A for 14 days, comparing same-day-of-week cohorts

#### Test 2: Short Description Variants

- **Hypothesis:** "If we lead the short description with a pain-point hook ('Tired of losing cookies?') instead of a feature list, then the detail-page visit rate will increase by 10-20% because emotional hooks outperform feature lists in search results"
- **Control:** "View, edit, and manage cookies with profiles, auto-delete rules, and developer tools. The modern cookie editor for Chrome." (121 chars)
- **Variant A:** "Stop losing login sessions. Save, switch, and auto-delete cookies with profiles and rules. Built for developers." (114 chars)
- **Variant B:** "The EditThisCookie replacement. View, edit, export cookies with profiles, auto-delete rules, and health scores." (113 chars)
- **Primary metric:** CWS impression-to-detail-page rate
- **Secondary metrics:** Install rate, D1 retention (to ensure the description sets correct expectations)
- **Sample size needed:** 10,000 impressions per variant
- **Duration:** 14 days per variant (sequential)
- **Success criteria:** >8% lift in detail-page visit rate without D1 retention decrease

#### Test 3: Paywall Headline Copy (Feature-Focused vs Benefit-Focused vs Loss-Aversion)

- **Hypothesis:** "If we use loss-aversion framing in paywall headlines ('Don't lose your saved profiles'), then the paywall-to-click rate will increase by 20-30% compared to feature-focused copy ('Unlock Unlimited Profiles') because loss aversion is 2x more motivating than gain framing"
- **Control:** "Unlock Unlimited Profiles" (current feature-focused)
- **Variant A:** "Your 2 profiles are working overtime" (benefit/value-focused)
- **Variant B:** "Don't lose your saved environments" (loss-aversion)
- **Variant C:** "Most developers use 4-8 profiles" (social proof)
- **Primary metric:** paywall_clicked / paywall_shown rate per variant
- **Secondary metrics:** upgrade_completed rate, paywall_dismissed view_duration_ms (longer = more interest)
- **Sample size needed:** 500 paywall impressions per variant (1,500 per trigger minimum)
- **Duration:** 4-8 weeks (depends on paywall impression volume)
- **Success criteria:** >15% lift in paywall click-through rate
- **Implementation:** Use the existing copy_variation rotation system (paywall-copy.ts). Assign users to cohorts via a hash of their anonymous session_id modulo 4

#### Test 4: CTA Button Text

- **Hypothesis:** "If we use action-oriented CTA text ('Start Free Trial' or 'Unlock Everything') instead of the transactional 'Upgrade to Pro', then the CTA click rate will increase by 10-20% because action verbs reduce perceived commitment"
- **Control:** "Upgrade to Pro"
- **Variant A:** "Unlock Everything"
- **Variant B:** "Start Free Trial" (if trial is offered)
- **Variant C:** "See What You're Missing"
- **Variant D:** "Try Pro Free for 7 Days"
- **Primary metric:** CTA click-through rate on paywall modals
- **Secondary metrics:** upgrade_completed rate, time from click to payment
- **Sample size needed:** 300 paywall impressions per variant
- **Duration:** 4-6 weeks
- **Success criteria:** >10% lift in CTA click rate with no decrease in click-to-payment conversion

#### Test 5: Pricing Page Layout (With/Without Social Proof)

- **Hypothesis:** "If we add social proof elements (user count, rating badge, testimonial quote) to the upgrade/pricing page, then the pricing-page-to-checkout rate will increase by 15-25% because social proof reduces purchase anxiety at the decision point"
- **Control:** Current pricing page (feature comparison + CTA)
- **Variant A:** Pricing page with "Join 3,000+ developers who upgraded" banner + 4.5-star rating badge
- **Variant B:** Pricing page with single testimonial quote from a developer + user count
- **Variant C:** Pricing page with "X users upgraded this week" dynamic counter + testimonial
- **Primary metric:** Pricing page visit to checkout_started rate
- **Secondary metrics:** upgrade_completed rate, billing_cycle selection (monthly vs annual)
- **Sample size needed:** 200 pricing page visits per variant
- **Duration:** 6-10 weeks (lower traffic to pricing page)
- **Success criteria:** >12% lift in page-to-checkout conversion

### 2.2 MEDIUM IMPACT TESTS (Months 3-4)

#### Test 6: Screenshot Order

- **Hypothesis:** "If we lead with the Cookie Health Dashboard screenshot instead of the standard cookie list view, then the detail-page-to-install rate will increase by 8-15% because the health dashboard is the most visually differentiated feature from competitors"
- **Control:** Screenshot order: Cookie List, Profiles, Rules, Export, Health Dashboard
- **Variant A:** Screenshot order: Health Dashboard, Cookie List, Profiles, Export, Rules
- **Variant B:** Screenshot order: Cookie List, Health Dashboard, Export, Profiles, Rules
- **Primary metric:** Detail-page-to-install rate
- **Secondary metrics:** Time on detail page, scroll depth (if measurable via CWS analytics)
- **Sample size needed:** 5,000 detail page views per variant
- **Duration:** 14 days per variant (sequential)
- **Success criteria:** >6% lift in install conversion

#### Test 7: Email Subject Lines (Per Sequence)

- **Hypothesis:** "If we use personalized subject lines with the user's usage data ('You've edited 47 cookies -- here's what Pro unlocks'), then the email open rate will increase by 20-30% compared to generic subjects ('Unlock Pro features')"
- **Control subjects per email:**
  - Onboarding Day 3: "Get more from Cookie Manager"
  - Paywall follow-up: "Unlock Pro features for Cookie Manager"
  - Win-back: "We miss you! Cookie Manager has new features"
- **Variant A subjects:**
  - Onboarding Day 3: "You edited {count} cookies this week"
  - Paywall follow-up: "Your {feature} limit is waiting to be lifted"
  - Win-back: "Your {profile_count} saved profiles are still here"
- **Variant B subjects:**
  - Onboarding Day 3: "Quick question about your cookie workflow"
  - Paywall follow-up: "A faster way to manage cookies across projects"
  - Win-back: "{first_name}, your Cookie Manager profiles miss you"
- **Primary metric:** Email open rate per sequence
- **Secondary metrics:** Click-through rate, unsubscribe rate, upgrade rate
- **Sample size needed:** 1,000 email sends per variant per sequence
- **Duration:** 4-6 weeks per email in sequence
- **Success criteria:** >15% lift in open rate without >0.2% increase in unsubscribe rate

#### Test 8: Upgrade Prompt Timing (Operations Threshold)

- **Hypothesis:** "If we show the first soft upgrade nudge after 10 operations instead of 5, then the paywall-to-click rate will increase by 15-25% because users with more experience have higher perceived value of Pro features"
- **Control:** First soft nudge after 5 cookie operations (edits + creates + deletes)
- **Variant A:** First soft nudge after 10 operations
- **Variant B:** First soft nudge after 20 operations
- **Variant C:** First soft nudge after 3 sessions (time-based instead of operation-based)
- **Primary metric:** Paywall-to-upgrade rate (full funnel, not just click)
- **Secondary metrics:** D30 retention, paywall dismissal rate, time-to-first-paywall
- **Sample size needed:** 500 users per variant who reach the threshold
- **Duration:** 8-12 weeks
- **Success criteria:** >10% lift in paywall-to-upgrade rate without >5% decrease in D30 retention

#### Test 9: Feature Gating Boundaries (Export Cookie Limit)

- **Hypothesis:** "If we lower the free export limit from 25 to 15 cookies, then the export paywall conversion rate will increase by 25-40% because more users encounter the limit on real-world domains, but if we raise it to 50, retention improves without harming conversion"
- **Control:** 25 cookie export limit (current)
- **Variant A:** 15 cookie export limit (more aggressive gating)
- **Variant B:** 50 cookie export limit (more generous)
- **Primary metric:** Export paywall conversion rate (views to upgrade_completed)
- **Secondary metrics:** D30 retention, uninstall rate, export feature adoption rate
- **Sample size needed:** 1,000 users per variant who trigger an export
- **Duration:** 8-12 weeks
- **Success criteria:** Variant must either increase conversion by >20% without retention decrease, or increase D30 retention by >10% without conversion decrease
- **Risk:** Variant A may increase uninstalls. Monitor cm_extension_uninstalled closely

#### Test 10: Health Dashboard Teaser (Free Visibility)

- **Hypothesis:** "If we show 2 unblurred health cards in the free tier instead of 1, then the health-score-to-paywall-click rate will increase by 15-20% because users who see more value are more motivated to unlock the full report"
- **Control:** 1 unblurred card (tracking cookies count), rest blurred
- **Variant A:** 2 unblurred cards (tracking cookies + insecure cookies), rest blurred
- **Variant B:** All cards visible with truncated details (show category but blur specifics)
- **Primary metric:** Health tab paywall click-through rate
- **Secondary metrics:** Health tab visit rate, D7 retention for health-tab visitors
- **Sample size needed:** 500 health tab visitors per variant
- **Duration:** 6-8 weeks
- **Success criteria:** >12% lift in paywall click rate from health tab

### 2.3 QUICK WINS (Implement Immediately -- No A/B Test Needed)

These changes are based on established conversion optimization best practices and do not require statistical testing before deployment. Monitor metrics for 7 days after each change to confirm no regression.

#### Quick Win 11: CTA Button Color
- **Change:** Switch paywall CTA buttons from solid blue (#2563EB) to a high-contrast green (#16A34A) with white text
- **Rationale:** Green CTAs consistently outperform blue in upgrade contexts by 5-10% across SaaS benchmarks. Blue is already used extensively in the Zovo UI (links, badges), reducing CTA distinctiveness
- **Metric to watch:** paywall_clicked rate for 7 days post-change
- **Rollback if:** Click rate decreases by >5%

#### Quick Win 12: Testimonial Selection
- **Change:** Replace generic testimonials with role-specific quotes. Show developer testimonial to users who've used cURL generation or export. Show QA testimonial to users who've created profiles. Show general testimonial as default
- **Rationale:** Segment-matched social proof converts 20-30% better than generic
- **Implementation:** Add `user_segment` property to session state (inferred from feature usage). Select testimonial variant in paywall render logic
- **Metric to watch:** paywall_clicked rate segmented by testimonial variant

#### Quick Win 13: Guarantee Wording
- **Change:** Add "7-day money-back guarantee" badge below every CTA button on paywall modals and the upgrade page. Use a shield icon + green text
- **Rationale:** Risk-reversal guarantees reduce purchase anxiety and typically lift conversion by 5-15%
- **Exact copy:** "Try risk-free. Full refund within 7 days, no questions asked."
- **Metric to watch:** upgrade_completed rate for 14 days post-change

#### Quick Win 14: Annual Discount Badge Design
- **Change:** Add an animated "SAVE 25%" badge to the annual pricing option. Use a diagonal ribbon in the top-right corner of the annual pricing card, gold background (#F59E0B) with white text
- **Rationale:** Visual discount badges increase annual plan selection by 15-25%, improving LTV
- **Metric to watch:** Annual vs monthly billing_cycle split in upgrade_completed events

---

## 3. Analytics Implementation Spec

### 3.1 Events to Track (Cookie Manager Specific)

All events follow the established schema from Phase 02 Section 7: `{ event_name, timestamp, session_id, extension: "cookie-manager", extension_version, tier, properties }`. The events below are organized by category and extend the Phase 02 event definitions with ASO-specific and conversion-specific tracking.

#### Core Usage Events

| Event | Trigger | Properties | Purpose |
|-------|---------|------------|---------|
| `cm_popup_opened` | Popup script initializes | `domain`, `cookie_count`, `active_tab`, `time_since_last_open_ms`, `session_number`, `days_since_install` | Engagement frequency, session cadence, retention calculation |
| `cm_cookie_viewed` | Cookie detail row expanded | `domain`, `cookie_name_hash`, `cookie_age_days`, `is_session`, `is_secure` | Feature usage depth, which cookies draw attention |
| `cm_cookie_edited` | Cookie value saved after edit | `domain`, `field_changed` (value/expiry/path/flags), `edit_duration_ms` | Core feature engagement, time-to-edit as UX signal |
| `cm_cookie_created` | New cookie saved via create form | `domain`, `is_secure`, `is_httponly`, `is_first_create` | Feature adoption, security posture |
| `cm_cookie_deleted` | Cookie removed (single or bulk) | `domain`, `bulk_or_single`, `count_deleted`, `delete_method` (button/context_menu/keyboard) | Deletion patterns, method preference |
| `cm_search_used` | Search input receives text (debounced 500ms) | `query_length`, `result_count`, `regex_attempted`, `search_scope` | Search adoption, regex as Pro signal |
| `cm_filter_applied` | Filter chip toggled (Session/Persistent/Secure/Third-party) | `filter_type`, `active_filters_count`, `result_count` | Feature discovery, filter preference |
| `cm_tab_switched` | Popup tab navigation | `from_tab`, `to_tab`, `time_on_previous_tab_ms` | Tab discovery depth, navigation patterns |

#### Profile & Rule Events

| Event | Trigger | Properties | Purpose |
|-------|---------|------------|---------|
| `cm_profile_created` | Profile saved | `profile_number`, `cookie_count`, `is_encrypted`, `is_update`, `domain` | Profile adoption, conversion funnel (3rd triggers paywall) |
| `cm_profile_loaded` | Profile restored | `profile_id_hash`, `cookie_count`, `domain`, `load_time_ms` | Profile dependency, switching frequency |
| `cm_profile_deleted` | Profile removed | `profile_number`, `had_cookies`, `was_last_profile` | Churn signal, data management |
| `cm_rule_created` | Auto-delete rule added | `rule_number`, `trigger_type` (tab_close/schedule), `pattern_type` (exact/glob) | Rule adoption, 2nd rule triggers paywall |
| `cm_rule_triggered` | Auto-delete rule executed | `rule_id_hash`, `cookies_deleted`, `trigger_type`, `domain` | Automation value proof |
| `cm_rule_toggled` | Rule enabled/disabled | `rule_id_hash`, `new_state` (enabled/disabled) | Rule management, potential churn signal if disabled |

#### Export & Developer Events

| Event | Trigger | Properties | Purpose |
|-------|---------|------------|---------|
| `cm_export_triggered` | Export action initiated | `format` (json/netscape/csv/curl), `domain`, `estimated_count` | Format preference, pre-paywall intent |
| `cm_export_completed` | Export file saved or copied | `format`, `cookie_count`, `file_size_bytes`, `was_limited` | Export volume, limit encounters |
| `cm_import_triggered` | Import action initiated | `format`, `source` (file/clipboard) | Import adoption |
| `cm_import_completed` | Import finished | `format`, `cookie_count`, `conflicts_resolved`, `resolution_method` | Import complexity |
| `cm_curl_generated` | cURL command copied | `domain`, `cookie_count_included`, `is_cross_domain` | Developer workflow signal |

#### Conversion Events

| Event | Trigger | Properties | Purpose |
|-------|---------|------------|---------|
| `cm_paywall_shown` | Paywall modal/banner rendered | `trigger_id` (T1-T17), `paywall_type` (hard/soft/discovery), `copy_variation` (0-4), `times_shown_total`, `days_since_install`, `session_number` | Conversion funnel, copy A/B testing |
| `cm_paywall_dismissed` | Paywall closed without action | `trigger_id`, `dismiss_method` (x_button/maybe_later/escape/outside_click), `view_duration_ms`, `copy_variation` | Fatigue measurement, copy effectiveness |
| `cm_upgrade_clicked` | CTA clicked on paywall | `trigger_id`, `destination_url`, `copy_variation`, `days_since_install`, `has_account` | Upgrade intent, attribution |
| `cm_upgrade_started` | User lands on upgrade page | `trigger_id`, `plan_preselected`, `billing_cycle`, `referral_source` (paywall/settings/cross_promo) | Checkout funnel entry |
| `cm_upgrade_completed` | Payment confirmed | `from_tier`, `to_tier`, `billing_cycle`, `amount_cents`, `trigger_id`, `days_since_install`, `total_paywalls_seen`, `total_sessions` | Revenue attribution, optimal exposure analysis |
| `cm_upgrade_failed` | Payment or activation error | `error_type`, `plan_tier`, `billing_cycle`, `step_failed` | Drop-off diagnosis |

#### Engagement & Discovery Events

| Event | Trigger | Properties | Purpose |
|-------|---------|------------|---------|
| `cm_review_prompt_shown` | Review prompt rendered | `trigger_reason` (satisfaction_moment/milestone/feature_discovery), `days_since_install`, `session_number` | Review generation tracking |
| `cm_review_prompt_accepted` | User clicked "Rate Us" | `trigger_reason`, `prompt_variant` | Review conversion rate |
| `cm_review_prompt_dismissed` | User dismissed review prompt | `trigger_reason`, `dismiss_method` | Review prompt fatigue |
| `cm_health_viewed` | Health tab opened or badge clicked | `score_grade`, `score_value`, `risk_count`, `domain` | Health feature engagement |
| `cm_gdpr_scan_run` | GDPR scan initiated | `domain`, `finding_count`, `categories_found`, `is_first_scan` | GDPR feature value |
| `cm_shortcut_used` | Keyboard shortcut activated | `shortcut_key` (Ctrl+Shift+K/E), `context` (popup/export) | Shortcut discovery rate |
| `cm_context_menu_used` | Context menu item clicked | `action` (view/edit/delete/export), `domain` | Context menu adoption |
| `cm_onboarding_step` | Onboarding step completed or skipped | `step_number` (1-3), `action` (completed/skipped), `time_on_step_ms` | Onboarding funnel |
| `cm_feature_discovery_clicked` | Blue dot tooltip clicked | `feature_name`, `days_since_install` | Feature discovery effectiveness |
| `cm_settings_opened` | Settings page accessed | `access_method` (popup_link/options_page), `days_since_install` | Settings engagement |
| `cm_cross_promo_shown` | Cross-promotion bar rendered | `target_extension`, `trigger_action`, `session_number` | Cross-sell impressions |
| `cm_cross_promo_clicked` | Cross-promotion CTA clicked | `target_extension`, `trigger_action`, `user_tier` | Cross-sell effectiveness |
| `cm_session_ended` | Popup closed or loses focus | `duration_ms`, `actions_taken`, `tabs_visited`, `cookies_modified` | Engagement depth |

**Total: 38 tracked events** covering the full user lifecycle from install through conversion, retention, and cross-sell.

### 3.2 Funnel Definitions

#### Install Funnel
Tracks the journey from CWS discovery to first meaningful use.

```
CWS Search Impression (100%)
  --> Detail Page View (8-15%)
    --> Install Button Click (25-40% of detail views)
      --> Extension Installed (95%+ of clicks)
        --> First Popup Open (85% within 24h)
          --> First Cookie Viewed (70% of first opens)
```

**Data sources:**
- CWS impressions and detail page views: Chrome Web Store Developer Dashboard
- Install to first open: `cm_popup_opened` where `session_number = 1`
- First cookie viewed: `cm_cookie_viewed` where `is_first_view = true`

**Diagnostic questions:**
- If impression-to-detail is <8%: Icon, name, or short description needs optimization (Tests 1, 2)
- If detail-to-install is <25%: Screenshots, long description, or ratings need work (Tests 5, 6)
- If install-to-first-open is <85%: Permission prompt is scaring users, or extension is not discoverable in toolbar
- If first-open-to-first-view is <70%: Onboarding flow is not directing users to the cookie list

#### Activation Funnel
Tracks the journey from first open to "activated" user (someone who has experienced core value).

```
First Popup Open (100%)
  --> First Cookie Viewed (70%)
    --> First Cookie Edited (35%)
      --> Second Session (70% of editors)
        --> Profile Created (25% of returners)
          --> "Activated" User
```

**Activation definition:** A user is "activated" when they have completed at least 2 of the following within D7:
1. Edited or created a cookie (`cm_cookie_edited` or `cm_cookie_created`)
2. Created a profile (`cm_profile_created`)
3. Used export (`cm_export_completed`)
4. Visited 3+ tabs in a single session (`cm_tab_switched` analysis)

**Target activation rate:** 25-30% of installers within D7

#### Conversion Funnel
Tracks the journey from first paywall encounter to completed payment.

```
Paywall Shown (100%)
  --> Paywall Engaged (view_duration > 3s) (60%)
    --> Upgrade CTA Clicked (15-20% of engaged)
      --> Pricing Page Loaded (90% of clicks)
        --> Checkout Started (50% of page loads)
          --> Payment Completed (70% of checkouts)
```

**Key diagnostic ratios:**
- Shown-to-engaged <50%: Paywall is being dismissed immediately. Copy or timing issue
- Engaged-to-clicked <10%: Value proposition is not compelling. Test headlines (Test 3)
- Clicked-to-page <80%: Technical issue with redirect to zovo.app/upgrade
- Page-to-checkout <40%: Pricing page layout or pricing resistance. Test layout (Test 5)
- Checkout-to-payment <60%: Payment friction. Check LemonSqueezy integration

#### Retention Funnel
Tracks ongoing engagement over time.

```
D1 Active (100% baseline)
  --> D7 Active (58% of D1)
    --> D14 Active (71% of D7)
      --> D30 Active (72% of D14)
        --> D60 Active (80% of D30)
          --> D90 Active (85% of D60)
```

**Note:** Later-stage retention should stabilize. Users who survive to D30 have formed a habit and should show 80%+ month-over-month retention.

### 3.3 Cohort Definitions

#### By Install Source
- **Organic CWS search:** Users who found the extension via Chrome Web Store search (no referrer)
- **External link:** Users who arrived from a direct URL (blog post, social media, Product Hunt)
- **Cross-promotion:** Users referred from another Zovo extension
- **Direct/other:** Users who typed the URL or arrived via bookmark

**Tracking method:** The `source` property on `extension_installed` event, set by parsing `document.referrer` on the CWS detail page (if accessible) or by checking for UTM parameters in the post-install landing page

#### By User Segment
Segments are inferred from behavior, not self-reported.

| Segment | Inference Rules | Expected % |
|---------|----------------|------------|
| Developer | Used cURL generation, exported JSON, edited HttpOnly cookies, or used regex search | 40% |
| QA Engineer | Created 2+ profiles, loaded profiles 5+ times, used multiple domains | 20% |
| Marketer | Primarily viewed third-party/tracking cookies, used GDPR scan, visited health tab | 15% |
| Privacy-conscious | Deleted cookies frequently, created auto-delete rules, used whitelist/blacklist | 15% |
| Casual | <5 actions total, single session only, viewed but didn't edit | 10% |

**Segment assignment timing:** Assigned after D7 based on accumulated behavior. Reassessed monthly.

#### By Feature Usage Pattern
- **View-only:** Users who only view cookies (never edit, create, export, profile, or rule)
- **Editor:** Users who edit or create cookies but do not use profiles/rules
- **Power user:** Users who use profiles OR rules
- **Super user:** Users who use profiles AND rules AND export
- **Developer workflow:** Users who use cURL, export, AND keyboard shortcuts

#### By Paywall Encounter Frequency
- **Never seen paywall:** Free tier limits not yet hit
- **1 paywall:** Encountered exactly one paywall trigger
- **2-3 paywalls:** Encountered multiple triggers (approaching conversion-ready)
- **4+ paywalls:** High exposure; risk of fatigue (monitor dismissal rates closely)
- **Paywall converter:** Encountered paywall(s) and subsequently upgraded

### 3.4 Dashboard Requirements

#### Weekly Dashboard (Review Every Monday)

**Section 1: Acquisition**
- Total installs (week over week change)
- CWS impressions and impression-to-install rate
- Install source breakdown (organic, external, cross-promo)
- Top 5 search keywords driving impressions (from CWS dashboard)

**Section 2: Activation & Engagement**
- D1/D7 retention for the most recent complete cohort
- Feature adoption rates (profiles, rules, export, health)
- Average session duration and sessions per user
- Tab navigation depth distribution

**Section 3: Conversion**
- Paywall view count by trigger type
- Paywall-to-click rate by trigger and copy variation
- Upgrade completed count and conversion rate
- Revenue: MRR, new MRR, churned MRR, net MRR
- Billing split: monthly vs annual

**Section 4: Health**
- Uninstall count and rate (week over week)
- Error rate (cm_error_occurred events / total sessions)
- Average popup load time
- Rating: current average, new reviews this week, negative review count

#### Alert Thresholds (Automated Notifications)

| Alert | Condition | Severity | Action |
|-------|-----------|----------|--------|
| Conversion rate drop | Free-to-paid rate drops >20% vs 7-day rolling average | Critical | Investigate paywall changes, pricing page, checkout flow |
| Uninstall spike | Daily uninstalls exceed 2x the 7-day average | Critical | Check for broken update, permission changes, performance regression |
| Retention cliff | D7 retention drops below 20% for any weekly cohort | High | Investigate onboarding flow, first-session experience |
| Paywall fatigue | Paywall dismissal rate exceeds 95% for any trigger over 7 days | High | Reduce frequency, revise copy, or soften the paywall type |
| Checkout abandonment | Pricing-page-to-payment rate drops below 30% | High | Check LemonSqueezy status, pricing page rendering, price resistance |
| Rating decline | Average rating drops below 4.0 or 3+ negative reviews in one day | Medium | Prioritize bug fixes, respond to reviews within 24 hours |
| Error spike | Error rate exceeds 5% of sessions for any single day | Medium | Deploy hotfix, check error_type distribution |
| Feature discovery failure | Any key feature (profiles, rules, export) has <10% D7 adoption | Low | Add feature discovery prompts, improve onboarding |

---

## 4. Competitive Intelligence Monitoring

### 4.1 Weekly Competitor Check

**Competitors to monitor (ranked by threat level):**

| Competitor | Threat Level | CWS URL | Current Users | Current Rating |
|------------|-------------|---------|---------------|----------------|
| Cookie-Editor (cgfkvhnidhklbfnloglkpmjbcjkimnph) | High | CWS link | 400K+ | 4.5 |
| Cookie Manager (hdhngoamekjhmnpenphenpaiindoinpo) | Medium | CWS link | 100K+ | 4.3 |
| EditThisCookie (successor forks) | Medium | Various | Varies | Varies |
| CookieBro | Low-Medium | CWS link | 30K+ | 4.4 |
| J2Team Cookies | Low | CWS link | 60K+ | 4.2 |

**Weekly monitoring checklist (every Monday):**

1. **Feature changes:** Open each competitor's CWS page. Check version number and "Updated" date. If updated, install and check for new features
2. **Pricing changes:** Check if any competitor has added/changed pricing tiers. Note any free-to-paid or paid-to-free transitions
3. **Rating changes:** Record current rating and total review count. Calculate weekly change. Note any sudden drops (may indicate a buggy update -- opportunity for us)
4. **Description changes:** Screenshot the current short and long descriptions. Diff against previous week. Note any new keywords or positioning changes
5. **User count changes:** Record current user count (visible on CWS). Calculate weekly growth rate

**Documentation format:**

```markdown
## Competitive Intel - Week of [DATE]

### Cookie-Editor
- Version: [X.X.X] (changed: Y/N)
- Users: [count] (+/- [change])
- Rating: [X.X] ([count] reviews, +[new] this week)
- New features: [none / description]
- Pricing: [unchanged / description]
- Notable: [any observations]

### [Repeat for each competitor]

### Opportunities Identified
- [List any gaps, weaknesses, or openings]

### Threats Identified
- [List any competitive moves that threaten our positioning]
```

### 4.2 Keyword Ranking Tracking

**Monthly keyword tracking (aligns with Agent 1 keyword audit):**

Track CWS search ranking for these terms:

| Keyword | Current Rank | Previous Rank | Change | Target Rank |
|---------|-------------|---------------|--------|-------------|
| cookie editor | -- | -- | -- | Top 3 |
| cookie manager | -- | -- | -- | Top 3 |
| edit cookies chrome | -- | -- | -- | Top 3 |
| cookie manager chrome extension | -- | -- | -- | Top 3 |
| delete cookies | -- | -- | -- | Top 5 |
| export cookies | -- | -- | -- | Top 5 |
| editthiscookie alternative | -- | -- | -- | Top 1 |
| cookie profiles | -- | -- | -- | Top 1 |
| auto delete cookies | -- | -- | -- | Top 3 |
| developer cookie tools | -- | -- | -- | Top 3 |
| manage cookies chrome | -- | -- | -- | Top 5 |
| cookie health score | -- | -- | -- | Top 1 |

**Tracking method:** Manual CWS search from a clean Chrome profile (no extensions, incognito). Record the position of Zovo Cookie Manager in results. Repeat monthly or after any metadata change.

### 4.3 New Entrant Monitoring

**Monthly scan for new cookie management extensions:**

1. Search CWS for "cookie" in the Extensions category, sorted by "Recently Updated"
2. Filter to extensions published within the last 30 days
3. For any new extension with >100 users or >4.0 rating:
   - Record name, URL, user count, rating, feature set
   - Identify any unique features we do not have
   - Assess if they target the same keywords
   - Flag if they mention "EditThisCookie" or "Zovo" in their description

**Alert criteria:** New entrant with >1,000 users within first month, or any extension copying our unique features (health score, cookie profiles, GDPR scan).

### 4.4 Copycat Extension Detection

**Monthly check for brand/feature copying:**

1. Search CWS for "Zovo" -- flag any non-Zovo extensions using the brand name
2. Search CWS for "cookie health score" -- flag any extensions that copy this unique feature name
3. Search CWS for "cookie profiles" -- monitor for feature parity
4. Check if any competitor's screenshots resemble our UI design
5. If a copycat is detected: Document with screenshots, file CWS trademark complaint if applicable

---

## 5. Iteration Framework

### 5.1 Weekly Cadence (Every Monday)

**Duration:** 1-2 hours

| Task | Owner | Output |
|------|-------|--------|
| Review email metrics (open rate, CTR, unsubscribe) | Marketing | Email performance report, subject line winners |
| Check paywall metrics by copy variation | Product | Copy variation performance table |
| Review competitive intel | Strategy | Weekly competitor brief |
| Quick copy tests (deploy 1-2 new headline variants) | Copywriting | New A/B test launched |
| Check alert dashboard for any triggered alerts | Engineering | Issue triage if alerts fired |
| Review CWS rating and respond to new reviews | Support | All reviews responded to within 24h |

### 5.2 Monthly Cadence (First Monday of Month)

**Duration:** 4-6 hours

| Task | Owner | Output |
|------|-------|--------|
| Full conversion funnel review | Product | Funnel report with drop-off analysis |
| Implement A/B test winners from previous month | Engineering | Updated copy/UX deployed |
| Launch next prioritized A/B test | Product | New test hypothesis document |
| Review feature adoption rates | Product | Feature adoption report, discovery prompt adjustments |
| Update keyword rankings | Marketing | Keyword tracking table updated |
| Review cohort retention curves | Analytics | Cohort report, segment insights |
| Update competitive intelligence report | Strategy | Monthly competitor analysis |
| Review and update metadata if needed | Marketing | CWS description/screenshots updated |

### 5.3 Quarterly Cadence (Beginning of Each Quarter)

**Duration:** 1-2 days

| Task | Owner | Output |
|------|-------|--------|
| Pricing strategy review | Product + Finance | Price change recommendation (if any) |
| Major UX tests (paywall redesign, onboarding overhaul) | Design + Product | Major A/B test launched |
| Feature gating review (free vs paid boundaries) | Product | Gating changes recommendation |
| Full competitive landscape analysis | Strategy | Quarterly competitive report |
| LTV and churn analysis | Analytics | LTV report by tier and segment |
| Review and revise email sequences | Marketing | Updated drip campaigns |
| Annual plan promotion strategy | Marketing | Annual conversion campaign |
| CWS policy compliance audit | Legal/Compliance | Compliance checklist completed |
| Review A/B test archive for institutional learnings | Product | Learnings document updated |

### 5.4 Iteration Decision Framework

When reviewing any test or metric, use this decision tree:

```
Metric improved by >10% with statistical significance?
  YES --> Implement winner. Document learning. Move to next test.
  NO --> Was the test duration sufficient (>2 weeks)?
    NO --> Extend test duration.
    YES --> Was sample size sufficient?
      NO --> Extend test or increase traffic.
      YES --> Declare inconclusive. Document learning.
              Consider: Was the hypothesis wrong, or was the
              change too small to detect?
              Move to next prioritized test.
```

**Statistical significance standard:** 95% confidence level (p < 0.05). Use a two-tailed test. For tests with multiple variants, apply Bonferroni correction (divide p-threshold by number of variants).

---

## 6. Google-Safe Compliance Checklist

### 6.1 Chrome Web Store Policy Compliance

All ASO and conversion tactics in this document and across all Phase 07 agent outputs have been designed to comply with Chrome Web Store Developer Program Policies. This checklist should be verified before implementing any optimization.

#### Metadata Compliance

| Requirement | Status | Notes |
|-------------|--------|-------|
| Extension name accurately describes functionality | COMPLIANT | Name includes "Cookie Manager" which describes the core function |
| Short description is accurate and not misleading | COMPLIANT | All short description variants describe real features |
| Long description contains no keyword stuffing | VERIFY | Review all description variants. Keywords must appear naturally in sentences, not as comma-separated lists |
| No excessive use of keywords in metadata | VERIFY | Maximum 2 repetitions of any single keyword in the full description |
| Category selection is accurate | COMPLIANT | "Developer Tools" correctly describes the extension |
| No misleading claims about functionality | COMPLIANT | All feature claims correspond to implemented features |
| No use of another extension's name in our name | VERIFY | "EditThisCookie" may appear in description as a comparison but must NOT be in the extension name field |
| No trademark infringement | VERIFY | Ensure no competitor trademarks used in our name, icon, or screenshots |

#### Review Generation Compliance

| Requirement | Status | Notes |
|-------------|--------|-------|
| No incentivized reviews | COMPLIANT | Review prompts offer no reward, discount, or benefit for leaving a review |
| No fake or purchased reviews | COMPLIANT | All reviews are from genuine users |
| Review prompts use two-step satisfaction check | COMPLIANT | "Are you enjoying?" -> "Would you rate us?" pattern filters unhappy users before the review page |
| No review manipulation (asking only satisfied users) | COMPLIANT | The two-step flow is a standard UX pattern, not manipulation. Users who say "No" are shown a feedback form instead |
| No mass-solicitation of reviews | COMPLIANT | Review prompts are frequency-limited: max 1 per 30 days, max 3 lifetime |
| Review responses are professional and helpful | PROCESS | Template library per Agent 3; all responses must be signed by a real team member |

#### Screenshot & Visual Compliance

| Requirement | Status | Notes |
|-------------|--------|-------|
| Screenshots show real, actual UI | COMPLIANT | All screenshot specs (Agent 2) use real extension UI, not mockups or conceptual renders |
| No misleading visual representations | COMPLIANT | Screenshots show features that actually exist in the extension |
| No use of Google branding in screenshots | VERIFY | Ensure Chrome logo, Google logo, or "Google" text does not appear in screenshots |
| Promotional images are accurate | COMPLIANT | Promo tiles show actual extension icon and real feature descriptions |

#### Pricing & Upgrade Compliance

| Requirement | Status | Notes |
|-------------|--------|-------|
| Free tier provides genuine, useful functionality | COMPLIANT | Free tier includes full CRUD, search, export (25 cookies), 2 profiles, 1 rule |
| Paid features are clearly disclosed before install | COMPLIANT | Store description lists free vs paid features |
| No bait-and-switch (advertising free then forcing payment) | COMPLIANT | Core functionality works fully without payment. Paywalls only on advanced features |
| Pricing is transparent | COMPLIANT | All tiers and prices listed on upgrade page |
| No fake urgency or countdown timers | COMPLIANT | No artificial scarcity or fake limited-time offers. Urgency comes only from natural usage limits |
| No dark patterns in upgrade flow | COMPLIANT | Dismiss button is always visible. "Maybe later" option on every paywall. No hidden costs |

#### Data & Privacy Compliance

| Requirement | Status | Notes |
|-------------|--------|-------|
| Analytics follow privacy-first architecture | COMPLIANT | No PII, no cookie values transmitted, EU opt-out by default per Phase 02 Section 7.3 |
| Permissions match stated functionality | COMPLIANT | Every permission has documented justification per Phase 05 Agent 1 |
| No data sold to third parties | COMPLIANT | First-party analytics only (analytics.zovo.app) |
| Privacy policy is accurate and accessible | COMPLIANT | Full privacy policy per Phase 06 Agent 2 |

### 6.2 Pre-Implementation Compliance Sign-Off

Before deploying any A/B test or metadata change:

1. Review the change against the checklist above
2. Search the CWS Developer Program Policies page for any relevant updates
3. If any item is marked VERIFY, resolve it before proceeding
4. Document the compliance check with date and reviewer name
5. If in doubt about any tactic, err on the side of caution -- a policy violation can result in extension removal

---

## 7. Cross-Agent Integration Map

This section documents how Agent 5 analytics and testing connects to every other Phase 07 agent's deliverables.

### Agent 1 (Keyword Audit) Integration
- **Inputs from Agent 1:** Primary/secondary/long-tail keyword lists, competitor keyword gaps
- **Agent 5 measures:** CWS impression volume per keyword, impression-to-install rate changes after metadata updates, keyword ranking position over time
- **A/B tests driven by Agent 1:** Tests 1 (extension name) and 2 (short description) use Agent 1 keyword research to generate variants
- **Feedback loop:** Monthly keyword ranking data feeds back to Agent 1 for keyword strategy refinement

### Agent 2 (Visual/Review Strategy) Integration
- **Inputs from Agent 2:** Screenshot designs, icon variants, review prompt specifications
- **Agent 5 measures:** Detail-page-to-install rate (screenshot effectiveness), review prompt acceptance rate, review velocity, rating trajectory
- **A/B tests driven by Agent 2:** Test 6 (screenshot order), Quick Win 12 (testimonial selection)
- **Feedback loop:** Screenshot A/B test results feed back to Agent 2 for visual asset iteration

### Agent 3 (Content/Competitive) Integration
- **Inputs from Agent 3:** Content calendar, competitive positioning, external traffic strategy
- **Agent 5 measures:** Install source attribution (organic vs external link), content-to-install conversion rate, competitor user count/rating trends
- **A/B tests driven by Agent 3:** Competitive positioning informs paywall copy variants (Test 3)
- **Feedback loop:** Competitive intel data feeds back to Agent 3 for content topic selection

### Agent 4 (Psychology/Touchpoints) Integration
- **Inputs from Agent 4:** Paywall copy frameworks, email sequences, upgrade flow designs, pricing psychology
- **Agent 5 measures:** Paywall conversion rates by trigger/copy/variant, email open/click/conversion rates, upgrade funnel drop-off
- **A/B tests driven by Agent 4:** Tests 3 (paywall headline), 4 (CTA text), 5 (pricing page), 7 (email subjects), 8 (prompt timing)
- **Feedback loop:** Conversion data feeds back to Agent 4 for copy and UX refinement

---

## 8. Implementation Priority & Timeline

### Phase 1: Foundation (Week 1-2)
1. Deploy all 38 analytics events with the event schema defined in Section 3.1
2. Build the weekly dashboard (Section 3.4)
3. Configure alert thresholds
4. Establish baseline metrics for all KPIs
5. Set up competitive monitoring process (Section 4)

### Phase 2: Quick Wins (Week 2-3)
6. Deploy Quick Win 11 (CTA button color)
7. Deploy Quick Win 12 (segment-matched testimonials)
8. Deploy Quick Win 13 (guarantee badge)
9. Deploy Quick Win 14 (annual discount badge)
10. Monitor all quick wins for 7-day regression check

### Phase 3: High-Impact Tests (Week 3 onward)
11. Launch Test 1 (extension name) -- 14-day run
12. Launch Test 2 (short description) -- 14-day run
13. Launch Test 3 (paywall headline copy) -- 4-8 week run
14. Launch Test 4 (CTA button text) -- 4-6 week run
15. Launch Test 5 (pricing page social proof) -- 6-10 week run

### Phase 4: Medium-Impact Tests (Month 3+)
16. Launch Tests 6-10 based on results from Phase 3
17. Begin email sequence A/B testing (Test 7)
18. Run feature gating experiments (Test 9)

### Phase 5: Continuous Optimization (Ongoing)
19. Weekly, monthly, and quarterly cadences per Section 5
20. Maintain competitive intelligence per Section 4
21. Document all learnings in the A/B test archive

---

*End of Agent 5 analytics, A/B testing framework, and measurement system. This document defines 5 primary KPIs, 5 secondary KPIs, 7 micro-conversions, 14 prioritized A/B tests (5 high-impact, 5 medium-impact, 4 quick wins), 38 analytics events, 4 funnel definitions, 4 cohort dimensions, dashboard requirements with 8 automated alerts, competitive monitoring for 5 competitors, a 3-tier iteration framework (weekly/monthly/quarterly), and a complete CWS policy compliance checklist. All measurements feed a continuous optimization loop connecting all 5 Phase 07 agents.*
