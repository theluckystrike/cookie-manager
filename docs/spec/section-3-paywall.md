# Section 3: Paywall Specification

**Extension:** Zovo Cookie Manager
**Version:** 1.0
**Last Updated:** 2026-02-11
**Pricing Context:** Free / $4 Starter / $7 Pro / $14 Team (annual ~30% discount)
**Payment Provider:** LemonSqueezy (Stripe-backed)

---

## 3.1 Paywall Trigger Points

Every trigger follows the "Gift Before Gate" principle: the user must experience genuine value before encountering any paywall. No trigger fires on first use. Triggers activate only after the user has demonstrated engagement through repeated actions.

### Complete Trigger Table

| # | Trigger | Condition | User Action | Paywall Type | Min. Tier | Priority | Est. Conversion |
|---|---------|-----------|-------------|--------------|-----------|----------|-----------------|
| T1 | Profile limit reached | User has 2 saved profiles and attempts to create a 3rd | Clicks "Save Profile" or "+" button in profile list | Hard block modal (blurred background) | Starter | P0 - Critical | 4-6% |
| T2 | Auto-delete rule limit | User has 1 active rule and attempts to create a 2nd | Clicks "Add Rule" in auto-delete settings | Hard block modal (blurred background) | Starter | P0 - Critical | 3-5% |
| T3 | Large domain export | User clicks export on a domain with >25 cookies | Selects "Export All" for a domain with 26+ cookies | Soft inline banner (dismissible) | Starter | P1 - High | 2-4% |
| T4 | Bulk cross-domain operations | User attempts to select cookies across multiple domains | Clicks "Select All" in global cookie view or multi-selects across domain groups | Hard block modal (blurred background) | Pro | P1 - High | 3-5% |
| T5 | Cookie Health Score details | User clicks on the blurred health score breakdown | Clicks anywhere on the blurred score detail panel | Soft inline banner (dismissible) | Starter | P1 - High | 3-5% |
| T6 | GDPR compliance scan (2nd use) | User has used 1 free compliance scan and initiates a 2nd | Clicks "Run Compliance Scan" for a second time | Hard block modal (blurred background) | Pro | P1 - High | 4-6% |
| T7 | Regex search attempt | User types a regex pattern in the search field or toggles regex mode | Clicks the regex toggle icon (.*) or types a pattern starting with `/` | Soft inline banner (dismissible) | Starter | P2 - Medium | 2-3% |
| T8 | Encrypted vault access | User clicks on the encrypted export or vault feature | Clicks "Encrypted Export" or "Cookie Vault" in the export menu | Soft inline banner (dismissible) | Pro | P2 - Medium | 2-4% |
| T9 | Cross-device sync toggle | User attempts to enable Chrome sync for profiles | Toggles "Sync Profiles" in settings | Hard block modal (blurred background) | Starter | P2 - Medium | 3-5% |
| T10 | Team sharing attempt | User clicks any team/sharing feature | Clicks "Share with Team", "Team Library", or "Invite" | Hard block modal (blurred background) | Team | P2 - Medium | 5-8% (high intent) |
| T11 | Cookie snapshot/diff | User clicks on the Snapshots tab or "Compare" button | Clicks "Snapshots" nav item or "Take Snapshot" button | Feature discovery (pulsing blue dot + preview) | Pro | P2 - Medium | 2-4% |
| T12 | Real-time monitoring toggle | User clicks the monitoring tab or toggle | Clicks "Monitor" nav item or "Start Monitoring" toggle | Feature discovery (pulsing blue dot + preview) | Pro | P2 - Medium | 2-3% |
| T13 | Non-JSON export format | User selects Netscape, CSV, or Header String format | Clicks a locked format option in the export dropdown | Soft inline banner (dismissible) | Starter | P3 - Low | 1-3% |
| T14 | Import over 50 cookies | User imports a file containing >50 cookies | Drags/selects a file with 51+ cookies in the import dialog | Soft inline banner (dismissible) | Starter | P3 - Low | 2-3% |
| T15 | Whitelist/blacklist limit | User has 5 entries and attempts a 6th | Clicks "Add Domain" in whitelist or blacklist settings | Soft inline banner (dismissible) | Starter | P3 - Low | 1-2% |
| T16 | Side panel or full-tab mode | User attempts to open the extension in side panel or full tab | Clicks the "Open in Side Panel" or "Full Tab" button | Soft inline banner (dismissible) | Pro | P3 - Low | 1-2% |
| T17 | 7-day engagement nudge | User has opened the extension on 5+ separate days within 7 days and has not seen an upgrade prompt | Automatic on 5th-day session open | Feature discovery (pulsing blue dot on Pro badge) | Starter | P3 - Low | 1-2% |

### Trigger Frequency Rules

- **Hard block modals:** Maximum 1 per session. If a user dismisses a hard block, no other hard block appears for that session.
- **Soft inline banners:** Maximum 3 per session across all triggers. Each individual banner is dismissible and remembers dismissal for 48 hours.
- **Feature discovery dots:** Always visible on Pro-only nav items. Pulsing animation plays once per session, then the dot remains static.
- **Session definition:** A session starts when the user opens the extension popup/panel and ends when they close it or navigate away.

---

## 3.2 Paywall UI Specifications

### Paywall 1: Profile Limit Reached (T1)

```
TRIGGER: Profile Limit Reached
CONDITION: User has exactly 2 saved profiles and clicks "Save Profile" or the "+" button
MODAL TYPE: Hard block modal with blurred background
```

**VISUAL SPEC:**
```
┌────────────────────────────────────────────┐
│                                            │
│            [Folder+ Icon]                  │
│                                            │
│    Pro found 2 profiles worth keeping      │
│                                            │
│    You've built a real workflow --          │
│    switching between profiles saves hours.  │
│    Unlock unlimited profiles to manage     │
│    every environment and client account.   │
│                                            │
│    ┌──────────────────────────────────┐    │
│    │   Unlock Unlimited Profiles      │    │
│    └──────────────────────────────────┘    │
│                                            │
│    Includes 18+ Zovo tools. From $3/mo.   │
│                                            │
│              Maybe later                   │
│                                            │
└────────────────────────────────────────────┘
```

**COPY:**
- Headline: "Pro found 2 profiles worth keeping"
- Body: "You've built a real workflow -- switching between profiles saves hours. Unlock unlimited profiles to manage every environment and client account."
- Primary CTA: "Unlock Unlimited Profiles"
- Secondary: "Maybe later"
- Footer: "Includes 18+ Zovo tools. From $3/mo."

**BEHAVIOR:**
- Dismissable: Yes (click "Maybe later" or press Escape)
- Remember dismissal: Yes (48 hours for this specific trigger)
- Animation: Fade in over 200ms. Background blurs from 0 to 8px over 200ms. Modal scales from 0.95 to 1.0.
- Re-show logic: Reappears on the next "Save Profile" attempt after 48 hours. If dismissed 3 times total, switches to a soft inline banner permanently for this trigger.
- Backdrop: The existing profile list remains visible but blurred behind the modal. The user can see their 2 saved profiles, reinforcing that they have real data they care about.

---

### Paywall 2: Auto-Delete Rule Limit (T2)

```
TRIGGER: Auto-Delete Rule Limit
CONDITION: User has 1 active auto-delete rule and clicks "Add Rule"
MODAL TYPE: Hard block modal with blurred background
```

**VISUAL SPEC:**
```
┌────────────────────────────────────────────┐
│                                            │
│            [Shield-Check Icon]             │
│                                            │
│    Your first rule is already cleaning     │
│                                            │
│    Nice -- your auto-delete rule has       │
│    removed [X] cookies so far. Unlimited   │
│    rules let you automate cleanup across   │
│    every site you visit.                   │
│                                            │
│    ┌──────────────────────────────────┐    │
│    │      Automate Everything         │    │
│    └──────────────────────────────────┘    │
│                                            │
│    Includes 18+ Zovo tools. From $3/mo.   │
│                                            │
│              Maybe later                   │
│                                            │
└────────────────────────────────────────────┘
```

**COPY:**
- Headline: "Your first rule is already cleaning"
- Body: "Nice -- your auto-delete rule has removed [X] cookies so far. Unlimited rules let you automate cleanup across every site you visit." (Replace [X] with the actual count from the rule's activity log. If count is 0, use "Your auto-delete rule is standing guard. Unlimited rules let you automate cleanup across every site you visit.")
- Primary CTA: "Automate Everything"
- Secondary: "Maybe later"
- Footer: "Includes 18+ Zovo tools. From $3/mo."

**BEHAVIOR:**
- Dismissable: Yes
- Remember dismissal: Yes (48 hours)
- Animation: Fade in over 200ms with background blur.
- Re-show logic: Reappears on next "Add Rule" attempt after 48 hours. After 3 total dismissals, switches to soft inline banner permanently.
- Dynamic element: The "[X] cookies removed" count is pulled from `chrome.storage.local` where the auto-delete rule logs its activity. This personalization reinforces that the free feature is already delivering value.

---

### Paywall 3: Cookie Health Score Details (T5)

```
TRIGGER: Cookie Health Score Details
CONDITION: User clicks on the blurred health score breakdown panel visible on the current site's cookie view
MODAL TYPE: Soft inline banner (appears below the blurred panel)
```

**VISUAL SPEC:**
```
┌────────────────────────────────────────────┐
│  COOKIE HEALTH SCORE                       │
│                                            │
│         B+                                 │
│    ████████████░░░ 78/100                 │
│                                            │
│  ┌──────────────────────────────────┐     │
│  │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │     │
│  │ ░░ 3 insecure cookies ░░░░░░░░░ │     │
│  │ ░░ 2 missing SameSite ░░░░░░░░░ │     │
│  │ ░░ 1 oversized cookie ░░░░░░░░░ │     │
│  │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │     │
│  └──────────────────────────────────┘     │
│                                            │
│  ┌──────────────────────────────────────┐ │
│  │ [Shield Icon]                        │ │
│  │ Pro found 6 issues on this site      │ │
│  │                                      │ │
│  │ See which cookies need attention     │ │
│  │ and get fix recommendations.         │ │
│  │                                      │ │
│  │ [See Full Analysis]  [Dismiss]       │ │
│  └──────────────────────────────────────┘ │
└────────────────────────────────────────────┘
```

**COPY:**
- Headline: "Pro found 6 issues on this site"
- Body: "See which cookies need attention and get fix recommendations."
- Primary CTA: "See Full Analysis"
- Secondary: "Dismiss"
- Blurred panel text (visible but unreadable): Shows the actual issue count and categories -- "3 insecure cookies", "2 missing SameSite", "1 oversized cookie" -- but rendered with a 6px CSS blur filter. The numbers and category labels are real, not placeholder text.

**BEHAVIOR:**
- Dismissable: Yes (click "Dismiss")
- Remember dismissal: Yes (72 hours for this specific trigger)
- Animation: The blurred panel is always visible (rendered on page load for the current site). The inline banner slides up from below the blurred panel over 250ms when the user clicks anywhere on the blurred area.
- Re-show logic: The blurred panel is always present. The inline banner reappears on click after 72 hours. The blur itself never goes away for free users.
- Grammarly technique: The health score letter grade (B+) and numeric score (78/100) are always visible and unblurred. The detailed breakdown beneath is blurred. This creates a curiosity gap -- the user knows their score but cannot see what is driving it down.

---

### Paywall 4: GDPR Compliance Scan (T6)

```
TRIGGER: GDPR Compliance Scan (2nd Use)
CONDITION: User has completed 1 free compliance scan and clicks "Run Compliance Scan" again (on any domain)
MODAL TYPE: Hard block modal with blurred background
```

**VISUAL SPEC:**
```
┌────────────────────────────────────────────┐
│                                            │
│            [Clipboard-Check Icon]          │
│                                            │
│    Your first scan found [X] issues       │
│                                            │
│    Unlimited compliance scans let you      │
│    audit every site you manage. Generate   │
│    reports your compliance team will       │
│    actually use.                           │
│                                            │
│    LAST SCAN RESULTS (preview):            │
│    ✓ Necessary: 4 cookies                 │
│    ⚠ Analytics: 3 cookies (1 issue)       │
│    ░░░░░░░░░░░░░░░░░░░░░░░░░░░           │
│    ░░░░░░░░░░░░░░░░░░░░░░░░░░░           │
│                                            │
│    ┌──────────────────────────────────┐    │
│    │    Unlock Unlimited Scans        │    │
│    └──────────────────────────────────┘    │
│                                            │
│    Includes 18+ Zovo tools. From $3/mo.   │
│                                            │
│              Maybe later                   │
│                                            │
└────────────────────────────────────────────┘
```

**COPY:**
- Headline: "Your first scan found [X] issues" (dynamic, pulled from the stored result of the free scan)
- Body: "Unlimited compliance scans let you audit every site you manage. Generate reports your compliance team will actually use."
- Primary CTA: "Unlock Unlimited Scans"
- Secondary: "Maybe later"
- Footer: "Includes 18+ Zovo tools. From $3/mo."
- Preview section: Shows the first 2 categories from the previous scan result in full, with remaining categories blurred. This proves the scan works and teases the full output.

**BEHAVIOR:**
- Dismissable: Yes
- Remember dismissal: Yes (48 hours)
- Animation: Fade in over 200ms. The preview section animates category rows in sequentially (staggered 100ms per row) to draw the eye to the blurred rows at the bottom.
- Re-show logic: Reappears on every "Run Compliance Scan" attempt until upgraded (this is a hard block on functionality, not a nag). Dismissal hides the modal but does not run the scan.

---

### Paywall 5: Bulk Cross-Domain Operations (T4)

```
TRIGGER: Bulk Cross-Domain Operations
CONDITION: User selects cookies from 2+ different domains in the global cookie view and clicks any bulk action (delete, edit, export)
MODAL TYPE: Hard block modal with blurred background
```

**VISUAL SPEC:**
```
┌────────────────────────────────────────────┐
│                                            │
│            [Layers Icon]                   │
│                                            │
│    Pro can handle all [X] cookies at once  │
│                                            │
│    You selected cookies across [Y]         │
│    domains. Bulk operations across         │
│    domains save serious time when          │
│    managing multiple sites.                │
│                                            │
│    ┌──────────────────────────────────┐    │
│    │     Unlock Bulk Operations       │    │
│    └──────────────────────────────────┘    │
│                                            │
│    Includes 18+ Zovo tools. From $3/mo.   │
│                                            │
│              Maybe later                   │
│                                            │
└────────────────────────────────────────────┘
```

**COPY:**
- Headline: "Pro can handle all [X] cookies at once" (dynamic -- [X] = number of selected cookies)
- Body: "You selected cookies across [Y] domains. Bulk operations across domains save serious time when managing multiple sites." ([Y] = number of distinct domains in selection)
- Primary CTA: "Unlock Bulk Operations"
- Secondary: "Maybe later"
- Footer: "Includes 18+ Zovo tools. From $3/mo."

**BEHAVIOR:**
- Dismissable: Yes
- Remember dismissal: Yes (48 hours)
- Animation: Fade in over 200ms with background blur. Selected cookies remain highlighted (visible through the blur) to remind the user of their intent.
- Re-show logic: Reappears on every cross-domain bulk action attempt after 48 hours. Single-domain bulk actions remain free (users can still select-all within one domain and act on them).

---

### Paywall 6: Cookie Snapshot/Diff (T11)

```
TRIGGER: Cookie Snapshot/Diff Feature Discovery
CONDITION: User clicks the "Snapshots" navigation item or "Take Snapshot" button for the first time
MODAL TYPE: Feature discovery (animated preview + inline upgrade prompt)
```

**VISUAL SPEC:**
```
┌────────────────────────────────────────────┐
│  SNAPSHOTS                          [PRO]  │
│                                            │
│  ┌──────────────────────────────────────┐ │
│  │  [Animated Preview - 6 seconds]      │ │
│  │                                      │ │
│  │  Step 1: "Take Snapshot" click       │ │
│  │  Step 2: Cookie list saved           │ │
│  │  Step 3: Make changes on site        │ │
│  │  Step 4: Take 2nd snapshot           │ │
│  │  Step 5: Diff view highlights        │ │
│  │           added/removed/changed      │ │
│  │                                      │ │
│  └──────────────────────────────────────┘ │
│                                            │
│  Save and compare cookie states across     │
│  any point in time. Perfect for QA         │
│  testing and debugging auth flows.         │
│                                            │
│    ┌──────────────────────────────────┐    │
│    │       Try Snapshots              │    │
│    └──────────────────────────────────┘    │
│                                            │
│    Includes 18+ Zovo tools. From $3/mo.   │
│                                            │
│              Not now                       │
│                                            │
└────────────────────────────────────────────┘
```

**COPY:**
- Headline: (None -- the feature name "SNAPSHOTS" in the nav serves as the heading)
- Body: "Save and compare cookie states across any point in time. Perfect for QA testing and debugging auth flows."
- Primary CTA: "Try Snapshots"
- Secondary: "Not now"
- Footer: "Includes 18+ Zovo tools. From $3/mo."

**BEHAVIOR:**
- Dismissable: Yes (click "Not now" or navigate away)
- Remember dismissal: No -- the preview page always shows when the Snapshots nav item is clicked by free users. The animated walkthrough plays once per session; after that it shows the final diff-view frame as a static image.
- Animation: The preview panel is a CSS animation sequence. Each "step" fades in over 400ms, holds for 800ms, then the next step fades in. Total animation duration: 6 seconds. The animation uses mock data (fictional domain "shop.example.com" with 3 cookies changing) to demonstrate the feature without requiring any real data.
- Re-show logic: Always shows for free users. This is a feature discovery page, not a nag modal. The page replaces the content area (not an overlay), so it feels like part of the extension rather than an interruption.

---

## 3.3 Upgrade Flow

### Step-by-Step Journey: Trigger to Payment to Feature Unlock

**Step 1: User Hits a Trigger**

The user performs an action that activates one of the 17 triggers defined in Section 3.1. The extension's `paywall.js` module evaluates the trigger against the user's current tier (stored in `chrome.storage.sync` under the key `zovo_tier`, default value: `"free"`).

If the user's tier does not satisfy the trigger's minimum tier requirement, the paywall flow begins.

**Step 2: Modal or Banner Appears**

Based on the trigger's configured paywall type:

- **Hard block modal:** A `<div class="zovo-paywall-overlay">` is injected into the extension popup DOM. It contains the blurred backdrop (`backdrop-filter: blur(8px)`), the modal card, and the CTA button. Focus is trapped within the modal (Tab key cycles through CTA, dismiss link, and close button). The underlying UI is inert (`aria-hidden="true"` on the main content container).

- **Soft inline banner:** A `<div class="zovo-paywall-banner">` is inserted into the relevant section of the UI (below the feature that triggered it). It does not block interaction with other parts of the extension. Maximum height: 120px. Includes a close (X) button in the top-right corner.

- **Feature discovery:** The content area for the Pro-only feature renders the preview/walkthrough page instead of a paywall modal. No overlay or blur is used. The page includes the animated preview and CTA.

**Step 3: User Clicks Primary CTA**

When the user clicks the primary CTA button (e.g., "Unlock Unlimited Profiles"), the extension performs the following actions in sequence:

1. Log the event to `chrome.storage.local` under `zovo_paywall_events[]` with: `{ trigger: "T1", action: "cta_click", timestamp: Date.now(), domain: currentTab.url }`.
2. Check if the user has a Zovo account by reading `chrome.storage.sync` for `zovo_user_id`.
   - **If no account exists:** Open `https://zovo.app/signup?ref=cookie-manager&trigger=T1&plan=starter` in a new tab.
   - **If account exists but no subscription:** Open `https://zovo.app/upgrade?ref=cookie-manager&trigger=T1&plan=starter` in a new tab.
   - **If account exists with a lower tier:** Open `https://zovo.app/upgrade?ref=cookie-manager&trigger=T1&plan=pro` in a new tab (pre-selects the next tier up).

The `ref` parameter attributes the conversion to the cookie manager extension. The `trigger` parameter identifies which paywall triggered the visit (for A/B testing and conversion analytics). The `plan` parameter pre-selects the recommended tier on the checkout page.

**Step 4: Zovo Signup/Login Page**

The `zovo.app/signup` page offers:
- Google OAuth (one-click signup)
- Email + password
- A prominent message: "Sign up to unlock Pro features across all 18+ Zovo extensions."

If the user already has an account, the page auto-redirects to `/upgrade`.

The page is optimized for the post-paywall context: no unnecessary navigation, no marketing fluff, just the signup form and a summary of what the user is unlocking.

**Step 5: LemonSqueezy Checkout**

After signup/login, the user lands on the upgrade page which displays:

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  Unlock Zovo Pro                                    │
│                                                     │
│  ┌─────────────────┐  ┌─────────────────────────┐  │
│  │  ANNUAL (SAVE    │  │  MONTHLY               │  │
│  │  30%)            │  │                         │  │
│  │                  │  │  Starter    $4/mo       │  │
│  │  Starter  $3/mo  │  │  Pro        $7/mo       │  │
│  │  Pro      $5/mo  │  │  Team       $14/mo      │  │
│  │  Team    $10/mo  │  │                         │  │
│  │                  │  │                         │  │
│  │  [RECOMMENDED]   │  │                         │  │
│  └─────────────────┘  └─────────────────────────┘  │
│                                                     │
│  The plan specified by the trigger's min. tier is   │
│  pre-selected and highlighted.                      │
│                                                     │
│  Annual toggle is ON by default.                    │
│                                                     │
│        [Continue to Checkout]                       │
│                                                     │
└─────────────────────────────────────────────────────┘
```

Clicking "Continue to Checkout" opens the LemonSqueezy overlay checkout (embedded iframe, not a redirect). LemonSqueezy handles:
- Credit/debit card payment
- PayPal
- Regional payment methods
- Tax/VAT calculation and collection
- Subscription creation

**Step 6: Success Webhook and License Storage**

After successful payment:

1. LemonSqueezy fires a `subscription_created` webhook to `https://api.zovo.app/webhooks/lemonsqueezy`.
2. The Zovo backend (Supabase Edge Function) receives the webhook, validates the signature, and updates the user's record in the `subscriptions` table with: `tier`, `plan_id`, `started_at`, `current_period_end`, `license_key`.
3. The backend generates a JWT-style license token containing: `{ user_id, tier, expires_at, extensions: ["all"] }`.
4. The Zovo upgrade page receives confirmation via WebSocket or polling (checks every 2 seconds for up to 60 seconds).
5. The upgrade page calls the Zovo Auth API to fetch the new license token.
6. The upgrade page sends a message to the cookie manager extension via `chrome.runtime.sendMessage` (using the extension's known ID) with: `{ type: "ZOVO_LICENSE_UPDATE", token: "...", tier: "starter" }`.
7. The extension's background service worker receives the message, validates the token, and writes to `chrome.storage.sync`: `{ zovo_tier: "starter", zovo_token: "...", zovo_token_expires: timestamp }`.
8. Because `chrome.storage.sync` propagates across devices, all Chrome instances where the user is signed in will receive the tier update within seconds.
9. All other installed Zovo extensions also read from `chrome.storage.sync` and unlock simultaneously.

**Step 7: Feature Unlock Experience**

After the license is stored, the extension popup detects the tier change via a `chrome.storage.onChanged` listener. The following sequence plays:

1. **Confetti burst** (200ms): CSS-only confetti animation using 30 colored particles (Zovo brand colors: blue `#2563EB`, purple `#7C3AED`, teal `#0D9488`) that burst from the center of the popup and fade out over 1.5 seconds. Implementation: CSS `@keyframes` with randomized `transform: translate()` and `opacity` transitions. No JavaScript animation library required.

2. **Badge transition** (simultaneous with confetti): The "FREE" text badge in the extension header morphs into a "PRO" badge (or "STARTER" / "TEAM" depending on tier). Animation: background color transitions from gray `#94A3B8` to blue `#2563EB` over 300ms. Text fades out ("FREE") and fades in ("PRO") with a 150ms crossfade.

3. **Lock icons dissolve** (300ms after confetti): All lock icons (`<svg class="zovo-lock-icon">`) across the UI simultaneously fade out (opacity 1 to 0 over 300ms) and are removed from the DOM. In profile lists, rule lists, and nav items, the lock icons disappear to reveal the now-unlocked feature.

4. **Blur removal** (400ms after confetti): Any blurred panels (Cookie Health Score details, compliance scan previews) animate from `filter: blur(6px)` to `filter: blur(0)` over 400ms, revealing the previously hidden content.

5. **Usage counters removed** (simultaneous with blur removal): Any "2/2 profiles used" or "1/1 rules used" counter text fades out and is replaced by the count without a limit (e.g., "2 profiles").

Total unlock animation duration: 1.9 seconds from trigger to fully settled UI.

**Step 8: Welcome Moment**

After the unlock animation completes (2 seconds after tier change detection), a non-blocking toast notification appears at the bottom of the extension popup:

```
┌────────────────────────────────────────────┐
│  [Check-Circle Icon]                       │
│  Welcome to Zovo [Tier Name]!              │
│  All Pro features are now unlocked.        │
│  [Explore what's new]          [Dismiss]   │
└────────────────────────────────────────────┘
```

- Duration: Auto-dismisses after 8 seconds if not interacted with.
- "Explore what's new" link: Opens a one-time feature discovery slideshow (3 slides) highlighting the top 3 newly unlocked features relevant to the trigger that caused the upgrade. For example, if the user upgraded from the profile limit trigger (T1), the slides are: (1) Unlimited Profiles, (2) Auto-Load Profiles by URL, (3) Profile Sync Across Devices.
- The toast uses `position: fixed; bottom: 12px; left: 12px; right: 12px;` and slides up from below the viewport over 300ms.

---

## 3.4 Post-Upgrade Experience

### Immediate Changes (Within 2 Seconds of License Sync)

**Visual changes that apply to the entire extension UI:**

1. **Header badge:** "FREE" badge replaced with tier-colored badge.
   - Starter: Blue badge with text "STARTER"
   - Pro: Purple badge with text "PRO"
   - Team: Teal badge with text "TEAM"
   - Badge has a subtle shimmer animation on first appearance (CSS gradient animation, plays once over 2 seconds, then settles to a static badge).

2. **Lock icons removed:** Every `<svg class="zovo-lock-icon">` in the extension is removed. These appear next to: locked export formats, the regex toggle, the Snapshots nav item, the Monitoring nav item, the Compliance nav item, the encrypted export option, the sync toggle, and the team sharing button.

3. **Usage counters updated:** All "X/Y used" counters are replaced:
   - "2/2 profiles" becomes "2 profiles"
   - "1/1 auto-delete rules" becomes "1 auto-delete rule"
   - "5/5 whitelist entries" becomes "5 whitelist entries"

4. **Blurred panels unblurred:** The Cookie Health Score detail breakdown and any compliance scan previews animate from blurred to clear.

5. **Navigation items activated:** Nav items for Snapshots, Monitoring, and Compliance change from a muted/disabled appearance (`opacity: 0.5; pointer-events: none`) to fully active (`opacity: 1; pointer-events: auto`). Their "PRO" tags remain but change from a locked style (gray background, lock icon) to an included style (tier-colored background, checkmark icon).

6. **Export dropdown expanded:** The export format dropdown now shows all formats (JSON, Netscape, CSV, Header String, Encrypted) without lock icons. The "Export All Cookies" option (previously showing a lock for cross-domain export) is now fully active.

### Welcome Message and Feature Discovery

After the unlock animation and toast, the extension stores a flag in `chrome.storage.local`: `zovo_post_upgrade_tour_seen: false`. On the next full popup open (not the current session, to avoid overwhelming the user), a feature discovery tour begins:

**Tour structure (3 slides, shown as an overlay carousel):**

Slide 1 of 3:
```
┌────────────────────────────────────────────┐
│                                            │
│     [Illustration: profile cards]          │
│                                            │
│     Unlimited Profiles                     │
│                                            │
│     Save as many cookie profiles as you    │
│     need. Switch between clients,          │
│     environments, or test accounts with    │
│     one click.                             │
│                                            │
│              [Next ->]              1/3    │
│                                            │
└────────────────────────────────────────────┘
```

Slide 2 of 3:
```
┌────────────────────────────────────────────┐
│                                            │
│     [Illustration: camera snapshot]        │
│                                            │
│     Snapshots and Diffs                    │
│                                            │
│     Capture your cookie state at any       │
│     moment. Compare snapshots to see       │
│     exactly what changed.                  │
│                                            │
│     [<- Back]  [Next ->]            2/3    │
│                                            │
└────────────────────────────────────────────┘
```

Slide 3 of 3:
```
┌────────────────────────────────────────────┐
│                                            │
│     [Illustration: monitor pulse]          │
│                                            │
│     Real-Time Monitoring                   │
│                                            │
│     Watch cookies change live as you       │
│     browse. Essential for debugging        │
│     auth flows and tracking scripts.       │
│                                            │
│     [<- Back]  [Start Using Pro]    3/3    │
│                                            │
└────────────────────────────────────────────┘
```

- The tour is skippable at any slide via an "X" button in the top-right corner.
- "Start Using Pro" closes the tour and sets `zovo_post_upgrade_tour_seen: true`.
- If the user closes the tour early, it will not re-show. The flag is still set to `true`.
- Tour slide transitions: horizontal slide animation, 250ms duration, ease-out timing.

### "Share with a Colleague" Prompt

72 hours after upgrade (not immediately -- the user needs time to experience value first), a one-time prompt appears at the bottom of the extension popup:

```
┌────────────────────────────────────────────┐
│  [Gift Icon]                               │
│                                            │
│  Know someone who'd find this useful?      │
│                                            │
│  Share Zovo with a colleague and you       │
│  both get 1 month free when they upgrade.  │
│                                            │
│  [Share Referral Link]         [Not now]   │
└────────────────────────────────────────────┘
```

- **"Share Referral Link"** generates a unique referral URL via the LemonSqueezy affiliate system: `https://zovo.app/ref/[USER_HASH]`. Copies the URL to clipboard and shows a "Copied!" confirmation.
- **"Not now"** dismisses permanently. This prompt shows a maximum of 1 time. It is stored in `chrome.storage.local` as `zovo_referral_prompt_shown: true`.
- Referral reward: Both referrer and referee receive 1 free month. This is managed by LemonSqueezy's built-in affiliate program with a custom reward configuration.

### Ongoing Pro Experience

For the duration of the subscription, the following apply:

1. **No paywall modals ever appear.** All paywall logic checks `zovo_tier` before rendering. If tier satisfies the trigger's minimum, the trigger is skipped entirely.

2. **Pro badge is persistent.** The tier badge in the header is always visible, reinforcing the user's status.

3. **Weekly Cookie Health Report** (Phase 2 feature, not v1.0): A summary email sent every Monday showing cookies managed, security issues detected, and compliance status across all sites visited that week. Free users receive a teaser version with blurred details. Pro users receive the full report. This is the Grammarly "weekly writing report" equivalent and serves as the primary retention engine.

4. **License re-validation:** The extension validates the license token against `https://api.zovo.app/auth/validate` once every 24 hours. If the token is valid, it updates `zovo_token_expires` in `chrome.storage.sync`. If validation fails (network error, server down), the extension continues operating in Pro mode for a 72-hour grace period. After 72 hours without successful validation, the extension reverts to free tier and shows a non-blocking banner: "Your Zovo subscription could not be verified. Please check your account at zovo.app."

5. **Downgrade experience:** If a subscription lapses (cancellation, failed payment after dunning), the extension reverts gracefully:
   - Pro features become read-only for 7 days ("grace period"). Existing profiles, rules, and snapshots remain visible and usable but cannot be created or edited.
   - After 7 days, Pro features revert to free-tier limits. Excess profiles/rules are not deleted -- they are preserved but locked. The user sees: "You have 8 profiles. Free tier allows 2. Upgrade to access all 8."
   - No data is ever deleted on downgrade. This is critical for trust and re-conversion.

---

## Implementation Reference

### Storage Keys

| Key | Storage | Type | Description |
|-----|---------|------|-------------|
| `zovo_tier` | `chrome.storage.sync` | string | `"free"`, `"starter"`, `"pro"`, or `"team"` |
| `zovo_token` | `chrome.storage.sync` | string | JWT license token |
| `zovo_token_expires` | `chrome.storage.sync` | number | Unix timestamp (ms) of token expiry |
| `zovo_user_id` | `chrome.storage.sync` | string | Zovo account UUID |
| `zovo_paywall_events` | `chrome.storage.local` | array | Array of paywall interaction events for analytics |
| `zovo_paywall_dismissals` | `chrome.storage.local` | object | `{ "T1": { count: 2, last_dismissed: timestamp }, ... }` |
| `zovo_post_upgrade_tour_seen` | `chrome.storage.local` | boolean | Whether the post-upgrade tour has been shown |
| `zovo_referral_prompt_shown` | `chrome.storage.local` | boolean | Whether the referral prompt has been shown |
| `zovo_first_compliance_scan` | `chrome.storage.local` | object | Stored result of the user's free compliance scan |
| `zovo_auto_delete_stats` | `chrome.storage.local` | object | `{ rule_id: { cookies_removed: number } }` |

### CSS Classes

| Class | Purpose |
|-------|---------|
| `.zovo-paywall-overlay` | Hard block modal backdrop (blur + darken) |
| `.zovo-paywall-modal` | Modal card container |
| `.zovo-paywall-banner` | Soft inline banner |
| `.zovo-lock-icon` | Lock icon SVG on gated features |
| `.zovo-pro-badge` | "PRO" badge in header and nav items |
| `.zovo-blur-panel` | Blurred content panel (health score, compliance preview) |
| `.zovo-confetti` | Confetti burst animation container |
| `.zovo-toast` | Bottom toast notification |
| `.zovo-tour-overlay` | Feature discovery tour overlay |
| `.zovo-tier-badge` | Tier-specific badge (with color variants via data attribute) |

### Event Tracking

Every paywall interaction is logged to `zovo_paywall_events` for analytics and A/B testing:

```json
{
  "trigger": "T1",
  "action": "impression | cta_click | dismiss | upgrade_complete",
  "timestamp": 1739280000000,
  "domain": "https://example.com",
  "session_id": "abc123",
  "tier_at_time": "free"
}
```

These events are batched and sent to `https://api.zovo.app/analytics/paywall` every 24 hours (or on extension update/install). This data powers conversion rate analysis per trigger, A/B test evaluation, and paywall placement optimization.
