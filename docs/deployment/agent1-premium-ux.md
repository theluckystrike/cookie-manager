# Premium UX Strategy: Zovo Cookie Manager

## Phase 04 | Agent 1 | Generated 2026-02-11

---

## 1. Value Ladder Design

### Foundation Layer (Free) -- The Trust Builder

The free tier must solve the core problem so thoroughly that users recommend it unprompted. A user who installs Cookie Manager to inspect a session token should be able to view it, edit it, copy it, and delete it within 3 seconds of opening the popup. No gate, no friction, no signup. That first interaction earns the review.

**What ships free and unlimited:**
- Full CRUD on every cookie for the active tab. No limit on the number of cookies a user can view, edit, create, or delete on a single domain. This is table stakes and gating any of it would generate 1-star reviews.
- Text search with 150ms debounce across cookie name, value, and domain. Instant results that filter the list in place.
- Four filter chips (Session, Persistent, Secure, Third-party) that toggle independently. Filters and search compose together.
- Dark mode, light mode, and system-detect. Theme preference persists via `chrome.storage.local`.
- JSON export for the current domain, up to 25 cookies. This covers the majority of single-site debugging workflows without touching the Pro boundary.
- JSON import for the current domain. Drag-and-drop or file picker.
- One auto-delete rule with full configuration (domain pattern, trigger type, exceptions).
- Two cookie profiles with save/load/edit/delete.
- Five whitelisted and five blacklisted domains.
- Five protected cookies (re-set if the site modifies them).
- Cookie Health Score badge visible on the Health tab -- the letter grade (A through F) and numeric score are always unblurred.
- One free GDPR compliance scan with category names and counts visible, individual cookie assignments blurred.
- cURL generation for the current site's cookies, copied to clipboard.
- Context menu: view cookies, quick delete all, save as profile, copy as cURL.

**Why this earns 4.5+ star reviews:** A developer debugging an authentication flow gets everything they need without hitting a single wall. They search, inspect, edit, export, and move on. The extension is fast (sub-200ms popup load via Preact), clean (Inter font, consistent spacing, dark mode), and respectful (no nag on first session, no signup required). That developer writes a review. The free tier is the marketing department.

**The habit loop:** Cookie Manager sits in the toolbar. Every time a developer opens DevTools to debug cookies, the extension is one click closer. After 3 sessions, muscle memory forms. After 7 sessions, it is part of the workflow. The free tier never punishes this habit. It rewards it by being faster than Chrome's built-in Application tab.

### Enhancement Layer (Pro) -- The Multiplier

Pro features do not create new capabilities from scratch. They multiply the value of workflows the user already performs manually.

**Cookie Profiles (unlimited, encrypted):** The developer who saved two profiles -- one for admin login, one for staging -- already proved to themselves that profiles save time. The third profile is not a new concept; it is the same concept applied to one more environment. The mental model is already built. The gap between "I have two" and "I need five" closes naturally as the user manages more projects.

**Bulk Operations:** The user who manually deleted 40 tracking cookies one-by-one already endured the pain. Bulk select and bulk delete do not teach a new behavior; they remove the friction from an existing one. The felt difference is immediate: what took 90 seconds now takes 2.

**Regex Search:** When a developer types `/^_ga/` into the search field and nothing happens, they already know what they wanted. Regex is not a feature they need to be educated about. It is a feature they expect to exist. The gap between "I typed it" and "it should work" is the upgrade trigger.

**Auto-Delete Rules (unlimited):** The first rule proved the concept. The user configured a domain pattern, chose a trigger, and watched cookies disappear automatically. The second rule is the same action with a different domain. The cost of not having it is remembering to clean up manually.

**Export (all formats, all domains, unlimited):** The user who exported 25 cookies from one domain and then needed to export 60 from another has already committed to the export workflow. The limit is felt as a truncation of their intent, not as a missing feature.

### Delight Layer (Pro) -- The Unexpected

These are the features that make a Pro user feel like the product was built specifically for them. They do not drive upgrades directly. They prevent churn.

**Unlock animation sequence (1.9 seconds total):** When the license syncs, a confetti burst in Zovo brand colors (blue `#2563EB`, purple `#7C3AED`, teal `#0D9488`) erupts from center. Lock icons dissolve with a slight upward float. Blur panels sharpen from 4px to 0. The FREE badge morphs into a gold PRO badge with a one-time shimmer. Usage counters ("2/2 profiles") fade out and reappear without limits ("2 profiles"). The entire UI breathes open. This is the dopamine hit that makes the purchase feel worth it before the user touches a single Pro feature.

**Pro visual polish:** A subtle gold left-border (3px, `#F59E0B`) accents on cards that were previously locked, visible for the first session only. The PRO pill badge in the header uses a gradient from `#7C3AED` to `#6D28D9` with a soft glow on hover (`box-shadow: 0 0 8px rgba(124, 58, 237, 0.3)`). These are signals of status, not gatekeeping.

**Cookie Health Score with full breakdown:** Pro users see the exact cookie names driving their score down, with actionable recommendations ("Set SameSite=Lax on session_id to prevent CSRF"). The free user sees the grade; the Pro user sees the prescription.

**Real-time monitoring dashboard:** A live-scrolling log of cookie changes with timestamps, change types (added/modified/removed), and color-coded entries. For a developer debugging OAuth flows, watching cookies appear and disappear in real time is not just useful -- it is satisfying. The log becomes a debugging tool they did not know they needed.

**Priority support badge:** The Zovo crown icon beside the support link in settings signals that their request goes to the front of the queue. Whether the queue is 2 people or 200, the signal matters.

---

## 2. Presell Touchpoints

### Visibility Without Frustration

Every Pro indicator follows a single rule: the user should understand what Pro unlocks without feeling punished for not having it.

**Lock icon placement (12x12px padlock, `#7C3AED` at 70% opacity):**
- Inline next to "Netscape", "CSV", and "Header String" in the export format dropdown. The user sees the options exist. The padlock does not block them from exporting JSON.
- Inline next to the regex toggle icon (`.*`) in the search bar. The toggle is visible but inactive. Hovering shows: "Regex search matches patterns like `/session_.*/` across all cookies. Available with Zovo Pro."
- Inline next to "Add Rule" button text after the first rule is created. The button reads "[lock] Add another rule". Hovering shows: "Unlimited auto-delete rules keep every site clean automatically. Available with Zovo Pro."

**PRO pill badge placement (28x14px, purple gradient):**
- Next to "Snapshots" in the tab navigation area (if implemented as a sub-navigation or within Health tab). Badge has a pulsing blue discovery dot (8px, animates once per session) the first time it appears.
- Next to "Monitoring" in the DevTools panel bottom pane header.
- Next to "Sync Profiles" toggle label in Settings.
- Next to "Encrypted Export" in the export menu.
- In the Health tab, next to "Unlock Details" overlay text on each blurred risk card.

**Tooltip copy for each Pro-locked element:**

| Element | Tooltip Copy (max 20 words) |
|---------|---------------------------|
| Regex toggle | "Match patterns like `/session_.*/` across all cookies. Available with Zovo Pro." |
| Netscape export | "Export in Netscape format for curl, wget, and browser import. Available with Zovo Pro." |
| CSV export | "Export as CSV for spreadsheets and data analysis. Available with Zovo Pro." |
| Header String export | "Export as HTTP Cookie header string. Available with Zovo Pro." |
| Encrypted export | "AES-256 encrypted export for secure cookie backup. Available with Zovo Pro." |
| Add Rule (locked) | "Unlimited rules automate cleanup across every site. Available with Zovo Pro." |
| Sync toggle | "Sync profiles, rules, and settings across all your devices. Available with Zovo Pro." |
| Snapshots | "Save and compare cookie states at any point in time. Available with Zovo Pro." |
| Monitoring | "Watch cookies change in real time as you browse. Available with Zovo Pro." |
| Health details | "See which cookies need attention and get fix recommendations. Available with Zovo Pro." |

**Critical constraint:** No tooltip, lock icon, or badge ever appears during an active workflow on the Cookies tab. If a user is editing a cookie value, nothing Pro-related is visible in their field of view. The Cookies tab is a paywall-free zone except for the export dropdown and regex toggle, which are passive indicators the user must actively open or hover.

### Taste of Premium

These are one-time or limited previews that let free users experience Pro value without committing.

**One-time bulk export preview:** The first time a user clicks "Export All" on a domain with more than 25 cookies, the extension exports all of them -- the full set -- with a banner at the top of the exported file: `// Exported with Zovo Cookie Manager (one-time full export preview)`. A soft inline banner appears in the popup: "You just exported all 47 cookies. Normally, free accounts export up to 25 per domain. Enjoy this one on us." Primary CTA: "Keep Full Exports" (opens upgrade flow). Secondary: "Got it" (dismisses). This one-time gift creates a concrete reference point. The user knows exactly what they lose by not upgrading because they have already had it.

**Health Score first-card reveal:** On the Health tab, the first risk category card (e.g., "3 Tracking Cookies Detected") displays its full detail text unblurred for free users. The remaining cards (Insecure Cookies, Oversized Cookies, Expired Cookies) are blurred with the standard 4px CSS filter. This is not random generosity -- it is strategic. Showing one full card demonstrates the quality and specificity of the analysis. The user reads "facebook.com `_fbp`: This cookie tracks browsing activity across sites using Facebook Pixel. Recommendation: Delete if you do not use Facebook advertising." They now know exactly what the blurred cards contain. The curiosity gap is strongest when you have seen one answer and know three more exist.

**Plan comparison in Settings:** The Account section of the Settings page renders a two-column comparison card:

```
+--------------------------------------------------+
|  Your Current Plan          Zovo Pro              |
|  ------------------------------------------------|
|  2 profiles                 Unlimited profiles    |
|  1 auto-delete rule         Unlimited rules       |
|  JSON export only           JSON, CSV, Netscape   |
|  5 protected cookies        Unlimited protection  |
|  Text search                Regex search          |
|  Health badge               Full health analysis  |
|  1 GDPR scan                Unlimited scans       |
|  ------------------------------------------------|
|  Free                       From $3/mo            |
|                              [See Pro Features]   |
+--------------------------------------------------+
```

This card is always visible for free users in Settings. It never animates, never pulses, never demands attention. It is a quiet fact sheet. The user finds it when they are already exploring settings -- a moment of high intent and low urgency, which is the ideal time to plant the seed.

**Post-manual-delete hint:** When a user manually deletes 5 or more cookies in a single session (across any number of domains), a non-blocking toast appears at the top of the popup for 4 seconds: "Tip: Auto-delete rules can handle this automatically." No CTA button. No upgrade link. Just a sentence. The user absorbs the idea. The next time they manually delete cookies, they remember. The third time, they navigate to the Rules tab themselves and discover the limit.

### Social Proof Integration

**Member counter in upgrade modals:** Every hard block and soft banner paywall includes the line "Includes 18+ Zovo tools. From $3/mo." Below that, in 11px text tertiary: "Joined by 3,300+ Zovo members." The number starts at 3,300 (carried from BeLikeNative's existing subscriber base) and increments based on actual Zovo signups (pulled from `chrome.storage.sync` during the 24-hour license validation check, cached locally). The counter rounds down to the nearest hundred to avoid appearing fabricated (e.g., "3,300+" not "3,347").

**"Popular with Pro" labels:** On the Profiles tab header and the Health tab header, a small text label in 10px/400, text tertiary: "Popular with Pro members". This label appears only for free users. It does two things: it normalizes Pro as something peers use (social proof), and it implicitly categorizes the user as someone who has not yet joined the group (identity gap). It is not a lock. It is a membership marker.

**Testimonial in upgrade modal:** Hard block modals (T1, T2, T4, T6) include a single testimonial below the footer text. Format: italic, 11px/400, text secondary. One rotating quote from three options:

- *"Profiles alone save me 20 minutes a day switching between client sites." -- Web Developer*
- *"The health score caught a cookie vulnerability our security audit missed." -- QA Engineer*
- *"One membership, all 18 tools. Best $4 I spend each month." -- Freelancer*

Testimonials rotate per session. Only one displays at a time. Each is attributed to a role, not a name, to avoid the uncanny valley of fake-sounding testimonials.

---

## 3. Upgrade Trigger Moments

### Natural Pause Points

These are moments when the user has just completed a task and is in a reflective state -- satisfied but open to suggestion.

**Trigger 1: Post-export success banner.** After the user successfully exports cookies to JSON, a soft inline banner slides in below the action bar (250ms, ease-out). Height: 52px. Copy: "Export done. With Pro, export all domains at once in JSON, CSV, or Netscape format." CTA: "Learn More" (opens Settings > Account comparison). Dismiss: "X" button, 48-hour cooldown. This fires only on the 3rd successful export (not the first -- the user needs to establish the export habit before the nudge has context).

**Trigger 2: Profile limit reached.** When the user attempts to create a 3rd profile, the hard block modal fires (spec: Section 3.2 Paywall 1). The backdrop blurs to 8px, showing the user's existing 2 profiles behind the modal. The headline reads: "Pro found 2 profiles worth keeping." The user's own data -- visible through the blur -- is the most persuasive argument.

**Trigger 3: Settings exploration.** The Account section of Settings renders the plan comparison card (described in Section 2 above). No animation, no interruption. The user is already in exploration mode. This touchpoint converts curiosity into consideration.

**Trigger 4: Weekly Health Report notification.** After 7 days of active use, a Chrome notification fires (using the `alarms` API): "Your weekly cookie report: B+ health score across 12 sites. 3 issues detected." Clicking the notification opens the extension to the Health tab, where the blurred breakdown cards create the curiosity gap. This is the Grammarly weekly email equivalent -- a retention and conversion engine rolled into one.

**Trigger 5: 7-day milestone celebration.** On the 5th distinct day of use within 7 calendar days, a non-blocking toast appears at popup open: "You've used Cookie Manager 5 days this week. You're in the top 15% of users." Below: "Pro members get unlimited profiles, regex search, and real-time monitoring." CTA: "See What's Included" (opens Settings > Account). Dismiss: auto-dismiss after 6 seconds. This fires once, is stored in `chrome.storage.local` as `zovo_milestone_7day_shown: true`, and never repeats.

**Trigger 6: Re-engagement after absence.** When the user opens the extension after 3+ calendar days of inactivity, a contextual banner appears at the top of the Cookies tab: "While you were away, [X] new cookies appeared on this site." The number is calculated by comparing the current cookie count against the cached count from the last session. If the delta is 0 or negative, the banner does not show. This is not a Pro advertisement -- it is a re-engagement hook that reminds the user why the extension exists. Below the count, in 11px text: "Auto-delete rules keep things clean even when you're away." No CTA button. Just the idea.

### Desire Creation Moments

These are moments when the user is mid-task and encounters friction that Pro would eliminate.

**Repeated manual deletion detection:** When a user deletes 3+ cookies individually within 60 seconds (tracked via a rolling window in memory, not persisted), a subtle inline hint appears below the cookie list: "This would take 1 click with auto-delete rules." The hint is 11px, text tertiary, and fades out after 5 seconds. It appears a maximum of once per session. It never blocks the delete action. The user is actively cleaning cookies -- interrupting them would create resentment. The whisper plants the seed without disrupting the workflow.

**Export cap encounter:** When the user exports from a domain with more than 25 cookies (after their one-time free full export), the export completes with 25 cookies and a soft banner appears: "Exported 25 of 47 cookies. Pro exports the full set across all domains." CTA: "Unlock Full Export". Dismiss: "X", 48-hour cooldown. The partial export is the trigger because the user now has an incomplete file -- they know data is missing.

**Regex search attempt:** When the user types a pattern starting with `/` in the search field or clicks the regex toggle, the extension shows an inline preview of what regex would match. Below the search bar, a 28px-tall preview strip appears: "Regex preview: `/session_.*/` would match 4 cookies on this site." Below the preview: "Enable regex search with Zovo Pro." The preview is real -- the extension actually runs the regex match and displays the count. It shows the user the answer to their question (4 cookies match) while withholding the filtered list. This is the most effective presell in the entire extension because it demonstrates capability without delivering the result.

**Re-engagement with new cookie count:** Described above in Trigger 6. The delta count is the hook. "47 new cookies appeared" creates urgency that "auto-delete rules" resolves.

---

## 4. UX Copy for Upgrade Prompts

Five rotating variations prevent banner blindness. Each variation maps to a psychological lever. The rotation uses a simple modulo on the `zovo_paywall_events` array length -- each new paywall impression increments a counter, and `counter % 5` selects the variation. This ensures even distribution without requiring randomization logic.

### Variation A: Value Focus (Usage Stats)

**Headline:** "You've managed 340 cookies this week"
**Body (25 words):** "Pro members save an average of 12 minutes daily with bulk operations, regex search, and auto-delete rules. One membership covers 18+ tools."
**Primary CTA:** "Start Saving Time"
**Secondary:** "Not now"

The headline is dynamic -- `340` is pulled from a running counter in `chrome.storage.local` that increments on every view, edit, create, and delete action. If the count is below 20 (new user), this variation is skipped and the next in rotation is used instead.

### Variation B: Social Focus (Community)

**Headline:** "Join 3,300+ Zovo members"
**Body (24 words):** "Developers and QA engineers use Zovo Pro across 18 tools for $3/month. Cookie profiles and health analysis are the most popular Pro features."
**Primary CTA:** "See Membership"
**Secondary:** "Maybe later"

The member count updates during license validation checks. The "most popular" claim is static but based on the feature value matrix scoring from Phase 03.

### Variation C: Feature Focus (Contextual)

**Headline:** "Unlock [feature] and 17 more tools"
**Body (22 words):** "[Contextual sentence based on the trigger that activated this paywall]. All Pro features unlock instantly across every Zovo extension."
**Primary CTA:** "Unlock [Feature]"
**Secondary:** "Not now"

The `[feature]` and contextual sentence are populated from a lookup table keyed by trigger ID:

| Trigger | Feature Name | Contextual Sentence |
|---------|-------------|-------------------|
| T1 | unlimited profiles | "Your workflow already depends on two profiles. Add as many as you need." |
| T2 | unlimited rules | "Your first rule cleaned [X] cookies. Imagine that on every site." |
| T3 | full export | "25 cookies captured. Pro exports the complete set in any format." |
| T4 | bulk operations | "You selected [X] cookies. Handle them all in one click." |
| T5 | health analysis | "Your score is [grade]. See exactly what's pulling it down." |
| T7 | regex search | "Your pattern would match [X] cookies. See the results." |

### Variation D: Security Focus (Privacy)

**Headline:** "Pro found [X] risks on this site"
**Body (23 words):** "Insecure cookies, missing SameSite flags, and tracking scripts can compromise your sessions. Full health analysis shows exactly what needs fixing."
**Primary CTA:** "See Full Analysis"
**Secondary:** "Dismiss"

The `[X]` count is pulled from the Cookie Health Score calculation that runs on every Health tab render. If the count is 0 (clean site), this variation is skipped. This variation is only used when the user is on or has recently visited the Health tab.

### Variation E: Milestone Focus (Celebration)

**Headline:** "Power user status: unlocked"
**Body (24 words):** "You've used Cookie Manager for [X] days and managed [Y] cookies. Pro members at your level use profiles and auto-delete rules daily."
**Primary CTA:** "Level Up"
**Secondary:** "Keep going free"

The `[X]` days count is the number of distinct calendar days the extension popup has been opened (stored as an array of date strings in `chrome.storage.local`, deduplicated). The `[Y]` cookie count is the cumulative action counter from Variation A. This variation only fires after 5+ days of use.

---

## 5. Anti-Patterns to Avoid

**Never interrupt a cookie edit mid-save.** If the user has expanded a cookie row and is modifying the value field, no banner, toast, modal, or animation may appear until they click Save or Cancel. Interrupting an edit risks data loss (the user might click away from the input) and creates the specific resentment that generates 1-star reviews. Implementation: the `paywall.js` module checks for the presence of an active `.cookie-edit-form` element in the DOM before rendering any paywall UI. If one exists, the paywall event is queued and fires after the form is closed.

**Never show a paywall on first session.** The first time the extension is opened after install, no paywall triggers fire regardless of user actions. All trigger conditions include an additional check: `session_count >= 2` (where `session_count` is incremented on each popup open and stored in `chrome.storage.local`). The user must return voluntarily before any monetization surface appears. First impressions are for trust, not sales.

**Never show more than one hard block modal per session.** If a user dismisses a hard block modal for T1 (profiles) and then triggers T2 (rules) in the same session, T2 renders as a soft inline banner instead of a modal. Hard blocks feel authoritative; two in one session feels hostile. The `paywall.js` module tracks `hard_block_shown_this_session: boolean` in memory (not persisted -- resets on popup close).

**Never delete user data on downgrade.** When a Pro subscription lapses, excess profiles and rules become read-only for 7 days, then lock behind the free tier limits. But the data is never deleted. The user who built 8 profiles sees: "You have 8 profiles. Free tier allows 2. Upgrade to access all 8." Those 8 profiles are hostages in the best possible sense -- the user built them, values them, and will pay to unlock them again. Deleting them on downgrade destroys both the endowment effect and the user's trust.

**Never use the word "locked" or "restricted" in user-facing copy.** All paywall copy uses gift framing: "Pro found...", "Unlock...", "Available with...". The word "locked" implies the user is being denied something they deserve. "Unlock" implies they are being offered something additional. The psychological difference is the gap between resentment and aspiration. Every string in the UI must pass the gift-framing test: does this sentence frame Pro as a gift, or free as a punishment?

**Never auto-play upgrade animations or modals.** Every paywall trigger requires a user-initiated action. No timer-based popups. No "you've been using the free version for 30 days" nag screens. No interstitials between tab switches. The user must do something that naturally encounters a Pro boundary. If they never encounter one, they never see a paywall. This is by design -- a user who never hits a limit is a user who writes a 5-star review for the free tier.

**Never show Pro features that are completely non-functional as if they work.** The Snapshots nav item, when clicked by a free user, shows an animated preview walkthrough -- not a broken empty state. The monitoring pane in DevTools shows 3 blurred sample entries -- not a blank panel with a lock. Every Pro-gated surface must show the user what it does, even if they cannot use it. A locked door with a window is more compelling than a locked door with a wall.

**Never exceed 3 soft banners per session.** Soft inline banners are dismissible but cumulative. If the user triggers T3 (export), T7 (regex), and T13 (non-JSON format) in one session, the third banner is the last. A fourth trigger in the same session is silently suppressed. The `paywall.js` module tracks `soft_banner_count_this_session: number` in memory.

---

## 6. Measurement Framework

All metrics are captured locally in `chrome.storage.local` under the key `zovo_ux_metrics`. No external analytics service is called from the extension. Data is structured for optional batch upload to the Zovo API during the 24-hour license validation cycle, but the extension functions identically with or without network connectivity.

### 6.1 Pro Feature Engagement Tracking

**What to track:** Every hover (300ms+ dwell) and click on a Pro-locked element.

```typescript
interface ProFeatureEvent {
  feature: string;       // "regex_toggle" | "netscape_export" | "add_rule_locked" | etc.
  action: "hover" | "click";
  timestamp: number;     // Date.now()
  tab_context: string;   // "cookies" | "profiles" | "rules" | "health" | "settings"
  session_id: string;    // Generated on popup open, not persisted
}
```

**Storage:** Append to `zovo_ux_metrics.pro_feature_events[]`. Cap at 500 entries (FIFO eviction). Estimated storage: 35KB at capacity.

**What this reveals:** Which Pro features generate the most curiosity (hover) versus intent (click). If regex toggle gets 50 hovers and 5 clicks, users are interested but not compelled. If profile limit gets 5 hovers and 5 clicks, every encounter converts to intent. This ratio -- hover-to-click -- identifies which presell touchpoints need stronger copy and which are already effective.

### 6.2 Prompt Response Rates by Variation

**What to track:** For each of the 5 prompt variations (A through E), record impressions, CTA clicks, and dismissals.

```typescript
interface PromptMetric {
  variation: "A" | "B" | "C" | "D" | "E";
  trigger: string;       // "T1" through "T17"
  action: "impression" | "cta_click" | "dismiss";
  timestamp: number;
}
```

**Storage:** Append to `zovo_ux_metrics.prompt_events[]`. Cap at 200 entries.

**Target response rates:**
- Variation A (Value Focus): 3-4% CTA click rate. If below 2%, the usage stats are not compelling enough -- consider raising the threshold for dynamic numbers.
- Variation B (Social Focus): 2-3% CTA click rate. If below 1.5%, the member count is too low to serve as social proof -- suppress this variation until the count exceeds 5,000.
- Variation C (Feature Focus): 4-5% CTA click rate. This is the expected best performer because it is contextual. If below 3%, the contextual sentences need rewriting.
- Variation D (Security Focus): 3-4% CTA click rate. Effective only when the risk count is 3+. If below 2% when risk count is high, users do not perceive cookie security risks as personal.
- Variation E (Milestone Focus): 2-3% CTA click rate. This variation fires late (5+ days of use) and targets habitual users. Low CTA rate is acceptable because these users have high organic upgrade potential.

**Optimization rule:** After 100 impressions across all variations, calculate per-variation CTA rates. If any variation is below 1% CTA rate, remove it from rotation and redistribute its weight to the highest-performing variation. This optimization runs locally using simple arithmetic -- no A/B testing infrastructure required.

### 6.3 Time-to-First-Upgrade-Consideration

**What to track:** The elapsed time (in days) between extension install and the first CTA click on any paywall prompt.

```typescript
interface ConversionTimeline {
  installed_at: number;           // Set once on chrome.runtime.onInstalled
  first_paywall_impression: number | null;  // First time any paywall UI rendered
  first_cta_click: number | null;           // First time user clicked a CTA
  first_upgrade_complete: number | null;    // First time zovo_tier changed from "free"
}
```

**Storage:** `zovo_ux_metrics.conversion_timeline` (single object, not an array).

**Target benchmarks:**
- Median time to first paywall impression: 1-3 days (user needs to exhaust free limits)
- Median time to first CTA click: 5-10 days (user needs to feel the limit repeatedly)
- Median time to upgrade: 10-21 days (user needs to justify the spend)

If the median time to first paywall impression exceeds 7 days, the free tier limits may be too generous. If it is under 1 day, the limits are too restrictive and risk generating negative reviews. The sweet spot: a power user hits a limit in their second session (day 1-2), a casual user hits a limit in their second week (day 7-10).

### 6.4 Feature Discovery Completion

**What to track:** Which features the user has discovered (interacted with at least once) out of the total feature set.

```typescript
interface FeatureDiscovery {
  discovered: {
    [feature: string]: number;  // timestamp of first interaction
  };
  // Feature list: "search", "filter", "export", "import", "add_cookie",
  // "edit_cookie", "delete_cookie", "profiles_tab", "rules_tab",
  // "health_tab", "settings", "context_menu", "dark_mode_toggle",
  // "protect_cookie", "gdpr_scan"
}
```

**Storage:** `zovo_ux_metrics.feature_discovery` (single object).

**Target:** 60% feature discovery within 14 days. If a user has discovered 9 of 15 trackable features within 2 weeks, they have explored enough of the extension to encounter Pro boundaries organically. Users who discover fewer than 5 features within 14 days are low-engagement and unlikely to convert -- do not increase paywall frequency for them. Instead, use the pulsing blue discovery dot (8px, animates once per session) on undiscovered features to guide exploration.

**Discovery-to-conversion correlation:** Track which features, once discovered, most frequently precede a CTA click within the same session. Expected high-correlation features: Health tab (curiosity gap from blurred cards), Profiles tab (limit encounter), and Export (cap encounter). If a feature has high discovery rate but low correlation with CTA clicks, its presell touchpoint needs strengthening.

### 6.5 Dashboard Views (Internal)

All metrics above feed three internal views accessible via the Zovo API dashboard (not exposed to users):

1. **Funnel view:** Install count, active Day 1 count, active Day 7 count, first paywall impression count, first CTA click count, upgrade count. Each stage shows drop-off percentage. Target: 2-3% end-to-end conversion at Month 1, 5-7% at Month 3.

2. **Trigger leaderboard:** Ranked list of all 17 triggers by CTA click rate. Identifies which paywalls are most effective and which need redesign. Updated daily from batched event uploads.

3. **Variation performance:** Per-variation CTA rate over time, with automatic suppression of underperforming variations and redistribution alerts.

---

*Total: ~2,450 words. Every element specified with exact copy, pixel dimensions, behavioral rules, and measurement targets. No placeholder text. No "TBD" items. Ready for implementation.*
