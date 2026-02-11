# Agent 5: Monetization Integration & Upgrade Path Implementation

**Extension:** Zovo Cookie Manager
**Role:** Monetization strategist and integration specialist
**Dependencies:** Phase 02 paywall spec (Section 3), Phase 03 pricing/architecture (Sections 5-6)
**Target:** Maximize Zovo membership conversions while maintaining a UX that feels generous, not adversarial

---

## 1. Paywall Implementation Specification

### 1.1 Feature Gating System

All feature access flows through a single `canUse()` function in `src/shared/tier-guard.ts`. Every UI component that renders a gated feature calls `canUse()` before allowing the action. If the function returns `false`, the component renders the appropriate paywall instead of executing the action.

```typescript
// src/shared/constants.ts

export const TIER_LIMITS = {
  free: {
    profiles: 2,
    rules: 1,
    exportLimit: 25,
    whitelistDomains: 5,
    blacklistDomains: 5,
    protectedCookies: 5,
    gdprScans: 1,
    snapshots: 0,
    blockRules: 3,
    bulkOps: false,
    sync: false,
    monitoring: false,
    vault: false,
    regexSearch: false,
    teamSharing: false,
    sidePanel: false,
    devtoolsEditing: false,
    nonJsonExport: false,
    crossDomainExport: false,
    autoLoadProfiles: false,
  },
  starter: {
    profiles: 10,
    rules: 5,
    exportLimit: 200,
    whitelistDomains: 50,
    blacklistDomains: 50,
    protectedCookies: 25,
    gdprScans: 5,
    snapshots: 5,
    blockRules: 10,
    bulkOps: false,
    sync: false,
    monitoring: false,
    vault: false,
    regexSearch: true,
    teamSharing: false,
    sidePanel: false,
    devtoolsEditing: false,
    nonJsonExport: true,
    crossDomainExport: false,
    autoLoadProfiles: false,
  },
  pro: {
    profiles: -1,
    rules: -1,
    exportLimit: -1,
    whitelistDomains: -1,
    blacklistDomains: -1,
    protectedCookies: -1,
    gdprScans: -1,
    snapshots: -1,
    blockRules: -1,
    bulkOps: true,
    sync: true,
    monitoring: true,
    vault: true,
    regexSearch: true,
    teamSharing: false,
    sidePanel: true,
    devtoolsEditing: true,
    nonJsonExport: true,
    crossDomainExport: true,
    autoLoadProfiles: true,
  },
  team: {
    profiles: -1,
    rules: -1,
    exportLimit: -1,
    whitelistDomains: -1,
    blacklistDomains: -1,
    protectedCookies: -1,
    gdprScans: -1,
    snapshots: -1,
    blockRules: -1,
    bulkOps: true,
    sync: true,
    monitoring: true,
    vault: true,
    regexSearch: true,
    teamSharing: true,
    sidePanel: true,
    devtoolsEditing: true,
    nonJsonExport: true,
    crossDomainExport: true,
    autoLoadProfiles: true,
  },
} as const; // -1 = unlimited
```

**The `canUse()` function:**

```typescript
// src/shared/tier-guard.ts

import { TIER_LIMITS } from "./constants";

type TierName = keyof typeof TIER_LIMITS;
type Feature = keyof typeof TIER_LIMITS.free;

interface CanUseResult {
  allowed: boolean;
  currentTier: TierName;
  requiredTier: TierName;
  limit: number | boolean;
  currentCount?: number;
}

export async function canUse(
  feature: Feature,
  currentCount?: number
): Promise<CanUseResult> {
  const { zovo_auth } = await chrome.storage.sync.get("zovo_auth");
  const tier: TierName = zovo_auth?.tier ?? "free";
  const limit = TIER_LIMITS[tier][feature];

  // Boolean features (bulkOps, sync, monitoring, etc.)
  if (typeof limit === "boolean") {
    return {
      allowed: limit,
      currentTier: tier,
      requiredTier: findMinTier(feature),
      limit,
    };
  }

  // Numeric features with -1 = unlimited
  if (limit === -1) {
    return { allowed: true, currentTier: tier, requiredTier: tier, limit, currentCount };
  }

  // Count-based check
  const allowed = currentCount !== undefined ? currentCount < limit : limit > 0;
  return {
    allowed,
    currentTier: tier,
    requiredTier: findMinTier(feature),
    limit,
    currentCount,
  };
}

function findMinTier(feature: Feature): TierName {
  const tiers: TierName[] = ["free", "starter", "pro", "team"];
  for (const t of tiers) {
    const val = TIER_LIMITS[t][feature];
    if (val === true || val === -1 || (typeof val === "number" && val > 0)) return t;
  }
  return "team";
}

export async function getCurrentTier(): Promise<TierName> {
  const { zovo_auth } = await chrome.storage.sync.get("zovo_auth");
  return zovo_auth?.tier ?? "free";
}
```

Components call `canUse()` like this:

```typescript
// In ProfileManager.tsx, on "Save Profile" click
const result = await canUse("profiles", currentProfileCount);
if (!result.allowed) {
  showPaywall("T1", result); // Show profile limit paywall
  return;
}
// Proceed with save
```

### 1.2 Upgrade Prompt System

**Prompt Rotation (5 variations per trigger):**

Each paywall trigger has 5 copy variations stored in `src/shared/paywall-copy.ts`. The system cycles through them sequentially, not randomly, to prevent repeat impressions. The variation index is stored in `chrome.storage.local` under `zovo_prompt_rotation`.

```typescript
// src/shared/paywall-copy.ts

export const PAYWALL_COPY = {
  T1: [
    {
      headline: "Pro found 2 profiles worth keeping",
      body: "You've built a real workflow -- switching between profiles saves hours. Unlock unlimited profiles to manage every environment and client account.",
      cta: "Unlock Unlimited Profiles",
    },
    {
      headline: "Your profiles are working hard",
      body: "Two profiles, two contexts you care about. Unlimited profiles mean every client, every staging server, every test account -- one click away.",
      cta: "Add More Profiles",
    },
    {
      headline: "You outgrew 2 profiles",
      body: "Most developers manage 4-8 cookie profiles. Unlock unlimited profiles and stop re-entering credentials.",
      cta: "Unlock Profiles",
    },
    {
      headline: "Profile switching saves 15 min/day",
      body: "You already know this -- you have been using it. Unlimited profiles let you build a complete environment library.",
      cta: "Go Unlimited",
    },
    {
      headline: "Every environment, one click",
      body: "Staging, production, QA, client demo -- unlimited profiles mean you never manually set cookies again.",
      cta: "Unlock All Profiles",
    },
  ],
  // T2 through T17 follow the same 5-variation pattern
};
```

**Rotation logic:**

```typescript
async function getNextCopyVariation(triggerId: string): Promise<number> {
  const key = "zovo_prompt_rotation";
  const data = (await chrome.storage.local.get(key))[key] ?? {};
  const currentIndex = data[triggerId] ?? 0;
  const nextIndex = (currentIndex + 1) % 5;
  data[triggerId] = nextIndex;
  await chrome.storage.local.set({ [key]: data });
  return currentIndex;
}
```

**Frequency Limiting:**

Session-level and cross-session rules prevent paywall fatigue. The `PaywallController` class enforces all constraints.

```typescript
// src/shared/paywall-controller.ts

interface SessionState {
  hardBlocksShown: number;    // Max 1 per session
  softBannersShown: number;   // Max 3 per session
  crossPromosShown: number;   // Max 1 per session
  sessionStart: number;
  isFirstSessionEver: boolean;
}

interface DismissalRecord {
  count: number;
  lastDismissed: number;      // Unix timestamp
  permanentlySoftened: boolean; // After 3 dismissals, hard blocks become soft banners
}

class PaywallController {
  private session: SessionState;

  async shouldShow(triggerId: string, paywallType: "hard" | "soft" | "discovery"): Promise<boolean> {
    // Rule 1: Never on first session ever
    if (this.session.isFirstSessionEver) return false;

    // Rule 2: Never interrupt active operations
    if (await this.isOperationInProgress()) return false;

    // Rule 3: Session frequency caps
    if (paywallType === "hard" && this.session.hardBlocksShown >= 1) return false;
    if (paywallType === "soft" && this.session.softBannersShown >= 3) return false;

    // Rule 4: Per-trigger cooldown
    const dismissals = await this.getDismissals(triggerId);

    // 48-hour cooldown after any dismissal
    if (dismissals.lastDismissed && Date.now() - dismissals.lastDismissed < 48 * 60 * 60 * 1000) {
      return false;
    }

    // 7-day cooldown after 3 dismissals
    if (dismissals.count >= 3 && Date.now() - dismissals.lastDismissed < 7 * 24 * 60 * 60 * 1000) {
      return false;
    }

    // After 3 dismissals total, reduce to once per 30 days
    if (dismissals.count >= 3 && dismissals.permanentlySoftened) {
      if (Date.now() - dismissals.lastDismissed < 30 * 24 * 60 * 60 * 1000) {
        return false;
      }
    }

    return true;
  }

  private async isOperationInProgress(): Promise<boolean> {
    // Check flags set by import, export, bulk delete, and profile save operations
    const { operation_in_progress } = await chrome.storage.local.get("operation_in_progress");
    return !!operation_in_progress;
  }
}
```

### 1.3 Timing Logic -- Prerequisite Engagement Gates

Paywalls only fire after the user has experienced the value of the feature they are being upsold on. These engagement prerequisites are checked before any paywall renders.

| Trigger | Prerequisite | Storage Key | Check |
|---------|-------------|-------------|-------|
| T1 Profile limit | User has saved 2 profiles AND loaded at least 1 of them | `onboarding.first_profile_loaded: true` | Both profiles must exist and at least one `profile_loaded` event must be logged |
| T2 Rule limit | User has created 1 rule AND that rule has executed at least once | `zovo_auto_delete_stats[ruleId].cookies_removed > 0` | The rule must have a nonzero execution count |
| T3 Export limit | The current domain actually has >25 cookies | Real-time `chrome.cookies.getAll()` count | Only fires when the domain genuinely exceeds the threshold -- never on domains with fewer cookies |
| T5 Health details | User has viewed the health score badge at least twice | `onboarding.health_views >= 2` | Two separate sessions where the Health tab was opened |
| T6 GDPR scan | User has completed 1 full scan and viewed the results | `zovo_first_compliance_scan` is populated | The stored scan result must exist with complete data |
| T7 Regex search | User has performed at least 5 plain-text searches | `onboarding.search_count >= 5` | Demonstrates the user actually uses search before showing regex upsell |
| T17 Engagement nudge | User has opened the extension on 5+ separate days within a 7-day window | `onboarding.open_days` array with 5+ unique dates in trailing 7 days | Calendar-day counting, not session counting |

**Implementation pattern in component code:**

```typescript
// In RuleEditor.tsx, on "Add Rule" click
async function handleAddRule() {
  const ruleCount = await getRuleCount();
  const result = await canUse("rules", ruleCount);

  if (!result.allowed) {
    // Check prerequisite: has the existing rule actually fired?
    const stats = await chrome.storage.local.get("zovo_auto_delete_stats");
    const existingRules = await getRules();
    const hasExecuted = existingRules.some(
      (r) => stats.zovo_auto_delete_stats?.[r.id]?.cookies_removed > 0
    );

    if (!hasExecuted) {
      // Don't show paywall yet -- the user hasn't seen their rule work
      showToast("Your current rule hasn't fired yet. It will auto-delete cookies when you close matching tabs.");
      return;
    }

    // Prerequisite met, check frequency limits
    const controller = new PaywallController();
    if (await controller.shouldShow("T2", "hard")) {
      showPaywall("T2", result);
    }
    return;
  }

  // Proceed with rule creation
  openRuleForm();
}
```

---

## 2. Zovo Branding Implementation

### 2.1 Extension Popup Branding

**Footer (always visible):**

A 24px-tall footer bar at the bottom of the popup. Left-aligned: 16x16px Zovo logomark followed by "Part of Zovo" in 11px, color `#64748B` (slate-500). The text is a link to `https://zovo.app`. Opacity 0.7, hover to 1.0 over 150ms. This footer never changes regardless of tier.

```html
<footer class="zovo-footer">
  <a href="https://zovo.app" target="_blank" rel="noopener">
    <img src="/assets/icons/zovo-mark-16.png" width="16" height="16" alt="Zovo" />
    <span>Part of Zovo</span>
  </a>
</footer>
```

**Header badge (tier-aware):**

The popup header shows the extension name and a tier indicator. The indicator adapts based on the user's current tier.

| Tier | Header Element | Style |
|------|---------------|-------|
| Free | Text link: "Upgrade" | 12px, color `#2563EB`, no underline, hover underline. Positioned right-aligned in the header bar. Not a button -- a subtle text link. |
| Starter | Badge: "STARTER" | 14x14px blue crown icon + "STARTER" text in 10px uppercase, background `#DBEAFE`, color `#2563EB`, border-radius 4px, padding 2px 6px. |
| Pro | Badge: "PRO" | 14x14px gold crown icon + "PRO" text in 10px uppercase, background `#FEF3C7`, color `#D97706`, border-radius 4px, padding 2px 6px. |
| Team | Badge: "TEAM" | 14x14px teal shield icon + "TEAM" text in 10px uppercase, background `#CCFBF1`, color `#0D9488`, border-radius 4px, padding 2px 6px. |

**Pro badge hover tooltip (Starter/Pro/Team only):**

On hover, a 200px-wide tooltip appears below the badge showing: "Zovo [Tier] Member" on line 1, "All premium features unlocked" on line 2, and "Manage subscription" as a link on line 3. Tooltip appears after 300ms hover delay to avoid accidental triggers.

### 2.2 Settings Page Branding

**"Zovo Membership" section -- top of settings page:**

This section renders differently for free and paid users.

**Free user view:**

```
+--------------------------------------------------+
|  ZOVO MEMBERSHIP                                 |
|                                                  |
|  +----------------------------------------------+
|  |  [Zovo Logo 32px]                            |
|  |                                              |
|  |  17 pro tools. One membership.               |
|  |  Save 84%.                                   |
|  |                                              |
|  |  +------------------+  +------------------+  |
|  |  |  ANNUAL (BEST)   |  |  MONTHLY         |  |
|  |  |  $3/mo billed    |  |  $4/mo           |  |
|  |  |  annually        |  |                  |  |
|  |  +------------------+  +------------------+  |
|  |                                              |
|  |  [Upgrade to Starter]                        |
|  |                                              |
|  |  See all plans at zovo.app/pricing           |
|  +----------------------------------------------+
+--------------------------------------------------+
```

Annual is pre-selected by default. The card uses a blue gradient border (`#2563EB` to `#7C3AED`) and a subtle background (`#F8FAFC`). The CTA button is solid blue (`#2563EB`), white text, 36px height, full-width within the card.

**Paid user view:**

```
+--------------------------------------------------+
|  ZOVO MEMBERSHIP                                 |
|                                                  |
|  [Crown Icon]  Zovo Pro                          |
|  mike@example.com                                |
|                                                  |
|  Plan: Pro ($7/mo, annual)                       |
|  Next billing: March 11, 2026                    |
|  [Manage Subscription]  [Sign Out]               |
+--------------------------------------------------+
```

"Manage Subscription" opens `https://zovo.app/account/billing` in a new tab. "Sign Out" triggers the `signOut()` flow described in Section 4.

### 2.3 First Run Experience

Three steps, each rendered as a full-popup card with navigation dots at the bottom. Total time: under 30 seconds. A "Skip" text link is visible in the top-right corner of every step.

**Step 1: "Welcome to Cookie Manager"**

Three feature cards in a horizontal scroll:
1. Card icon: eye icon. Title: "See Everything." Body: "View every cookie on any site -- name, value, flags, expiry."
2. Card icon: pencil icon. Title: "Edit Instantly." Body: "Change any cookie field inline. Create new cookies in seconds."
3. Card icon: download icon. Title: "Export & Import." Body: "Save cookies as JSON. Restore them anytime."

**Step 2: "Part of the Zovo Toolkit"**

Single centered message: "Cookie Manager is one of 17 free developer and productivity tools from Zovo. One optional membership unlocks premium features across all of them." Below: a row of 5 extension icons (Cookie Manager, JSON Formatter, Clipboard History, Form Filler, Tab Suspender) with a "+12 more" label. This step is informational only -- no CTA, no signup push.

**Step 3: "Get Started"**

A single CTA button: "Open Cookie Manager." Clicking it closes the onboarding overlay and opens the popup on the Cookies tab, focused on the current domain. The onboarding flag `onboarding.completed` is set to `true`. This step also sets `onboarding.installed_at` to the current ISO 8601 timestamp if not already set.

**Storage:** `chrome.storage.local` key `onboarding.completed`. If `true`, the first-run experience never renders again.

---

## 3. Cross-Promotion System

### 3.1 "From Zovo" Settings Section

Rendered by `src/options/components/MoreFromZovo.tsx`. Shows 3 extensions selected from the cross-promotion matrix. Each card is 100% width, stacked vertically with 8px gaps.

**Card layout per extension:**

```
+--------------------------------------------------+
|  [32px Icon]  JSON Formatter Pro                 |
|               Format exported cookie data         |
|               3,000 users                         |
|               [Install Free]                      |
+--------------------------------------------------+
```

**The three recommended extensions for Cookie Manager:**

1. **JSON Formatter Pro** -- "Format exported cookie data." Shown because Cookie Manager's export workflow produces JSON that benefits from formatting and diffing.
2. **Form Filler Pro** -- "Auto-fill forms with saved profiles." Shown because Cookie Manager users managing login sessions frequently also manage form submissions.
3. **Clipboard History Pro** -- "Never lose copied cookie values." Shown because the most common action after viewing a cookie is copying its value.

**Pro member enhancement:** For Starter/Pro/Team users, each card shows a green checkmark and "Included in your plan" instead of "Install Free" if the extension is not yet installed, or "Installed" with a checkmark if it is already installed. Detection uses `chrome.management.getAll()` when the `management` permission is available, otherwise falls back to attempting `chrome.runtime.sendMessage()` to known Zovo extension IDs.

### 3.2 Contextual Cross-Promotion Triggers

These appear as a dismissible 48px-tall bar below the action area, styled with a light blue background (`#EFF6FF`) and left blue border (3px, `#2563EB`). They appear after the user's action completes successfully -- never interrupting workflow.

| User Action | Target Extension | Copy | Trigger Condition |
|-------------|-----------------|------|-------------------|
| Exports cookies as JSON | JSON Formatter Pro | "Need to format that JSON? Try JSON Formatter Pro -- free with Zovo." | After successful JSON export download or clipboard copy |
| Copies a cookie value | Clipboard History Pro | "Keep every copied value. Clipboard History Pro -- free with Zovo." | After copying any cookie value via the copy button |
| Saves a profile containing form-related cookies (cookies with names matching `csrf`, `session`, `login`, `auth`, `token`) | Form Filler Pro | "Auto-fill forms with saved profiles. Form Filler Pro -- free with Zovo." | After profile save when cookie names suggest authentication/form context |

**Frequency rules:**

- Maximum 1 cross-promo bar per session across all triggers.
- Only shown after the user has had 3+ total sessions (stored in `onboarding.session_count`).
- Each cross-promo for a specific extension is dismissible. Dismissal is stored in `chrome.storage.local` under `zovo_crosspromo_dismissed`. A dismissed cross-promo for a specific extension never appears again.
- Cross-promos never appear in the same session as a paywall modal or banner.

**Implementation:**

```typescript
// src/shared/cross-promo-controller.ts

async function shouldShowCrossPromo(targetExtension: string): Promise<boolean> {
  const { onboarding } = await chrome.storage.local.get("onboarding");
  if ((onboarding?.session_count ?? 0) < 3) return false;

  const { zovo_crosspromo_dismissed } = await chrome.storage.local.get("zovo_crosspromo_dismissed");
  if (zovo_crosspromo_dismissed?.[targetExtension]) return false;

  // Check if any paywall was shown this session
  const session = getSessionState();
  if (session.hardBlocksShown > 0 || session.softBannersShown > 0) return false;
  if (session.crossPromosShown >= 1) return false;

  return true;
}
```

### 3.3 Upgrade Success Flow

The full sequence from payment to feature unlock, with exact timing.

**Step 1: Payment completes (external)**

LemonSqueezy processes the payment and fires a `subscription_created` webhook to `https://api.zovo.app/webhooks/lemonsqueezy`. The Zovo backend validates the webhook signature, updates the user's subscription record in Supabase Postgres, and generates a JWT with claims: `{ user_id, email, tier, exp }`.

**Step 2: Token delivery to extension (0-10 seconds after payment)**

The Zovo upgrade page (`zovo.app/upgrade`) polls `GET /auth/verify` every 2 seconds for up to 60 seconds. On success, it calls `chrome.runtime.sendMessage()` to the Cookie Manager extension ID with payload:

```json
{
  "type": "ZOVO_LICENSE_UPDATE",
  "token": "<JWT>",
  "tier": "starter",
  "user_id": "<UUID>",
  "email": "user@example.com"
}
```

**Step 3: Token storage (immediate)**

The background service worker receives the message in `chrome.runtime.onMessageExternal`, validates the sender origin against the allowlist, decodes the JWT to verify claims, and writes to `chrome.storage.sync`:

```typescript
await chrome.storage.sync.set({
  zovo_auth: {
    tier: message.tier,
    token: message.token,
    refresh_token: null, // Set on next /auth/refresh call
    expires: decodedJwt.exp,
    user_id: message.user_id,
    email: message.email,
    authenticated_at: new Date().toISOString(),
  },
});
```

**Step 4: UI unlock (0-2 seconds after storage write)**

The popup detects the change via `chrome.storage.onChanged`:

```typescript
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "sync" && changes.zovo_auth) {
    const newTier = changes.zovo_auth.newValue?.tier ?? "free";
    const oldTier = changes.zovo_auth.oldValue?.tier ?? "free";
    if (newTier !== oldTier && newTier !== "free") {
      playUpgradeAnimation(newTier);
    }
  }
});
```

**Step 5: Unlock animation sequence (1.9 seconds total)**

1. **T+0ms:** Confetti burst. 30 CSS-animated particles in Zovo brand colors (`#2563EB`, `#7C3AED`, `#0D9488`). Particles burst from center, randomized trajectories, fade out over 1500ms. Pure CSS `@keyframes` -- no JS animation library.
2. **T+0ms (simultaneous):** Badge transition. Header badge background transitions from gray `#94A3B8` to tier color over 300ms. Text crossfades from "FREE" to "PRO" (or "STARTER"/"TEAM") over 150ms.
3. **T+300ms:** Lock icon dissolve. All `.zovo-lock-icon` elements animate `opacity: 1` to `opacity: 0` over 300ms, then are removed from the DOM.
4. **T+400ms:** Blur removal. All `.zovo-blur-panel` elements animate `filter: blur(6px)` to `filter: blur(0)` over 400ms.
5. **T+400ms (simultaneous):** Usage counter text update. "2/2 profiles used" fades out and is replaced by "2 profiles" with a fade-in.

**Step 6: Welcome toast (T+2000ms)**

A non-blocking toast slides up from the bottom of the popup:

- Icon: green check-circle
- Line 1: "Welcome to Zovo [Tier Name]!"
- Line 2: "All 17 extensions are now unlocked."
- Link: "Explore what's new" -- opens the 3-slide feature discovery carousel
- Auto-dismiss after 8 seconds if not interacted with

**Step 7: Feature discovery tour (next popup open)**

A 3-slide overlay carousel, stored in `chrome.storage.local` as `zovo_post_upgrade_tour_seen: false`. Renders on the next popup open after upgrade (not immediately, to avoid overwhelming).

- Slide 1: **Unlimited Profiles.** "Save as many cookie profiles as you need. Switch between clients, environments, or test accounts with one click."
- Slide 2: **Snapshots and Diffs.** "Capture your cookie state at any moment. Compare snapshots to see exactly what changed."
- Slide 3: **Real-Time Monitoring.** "Watch cookies change live as you browse. Essential for debugging auth flows and tracking scripts."

Each slide has back/next navigation. The final slide's CTA is "Start Using Pro." Dismissable via X button at any slide. Either action sets `zovo_post_upgrade_tour_seen: true`.

**Step 8: Referral prompt (T+72 hours)**

72 hours after upgrade, a one-time prompt appears at the bottom of the popup:

- Headline: "Know someone who'd find this useful?"
- Body: "Share Zovo with a colleague and you both get 1 month free when they upgrade."
- CTA: "Share Referral Link" -- generates `https://zovo.app/ref/[USER_HASH]`, copies to clipboard, shows "Copied!" confirmation.
- Dismiss: "Not now" -- sets `zovo_referral_prompt_shown: true` permanently. This prompt shows exactly once.

---

## 4. Authentication Integration

### 4.1 Zovo Account Connection

**Google OAuth flow:**

1. User clicks "Sign in with Google" in the settings page or paywall modal.
2. Extension calls `chrome.identity.launchWebAuthFlow({ url: authUrl, interactive: true })` where `authUrl` is `https://accounts.google.com/o/oauth2/v2/auth?client_id=...&redirect_uri=...&response_type=code&scope=email+profile`.
3. Google returns an authorization code to the redirect URI.
4. Extension sends the code to `POST /auth/google` on the Zovo API.
5. Zovo backend exchanges the code for Google tokens, creates or retrieves the user record in Supabase Auth, and returns `{ token, refresh_token, user, tier }`.
6. Extension writes the complete `zovo_auth` object to `chrome.storage.sync`.

**Email sign-in flow:**

1. User clicks "Sign in with email" in the settings page.
2. Extension opens `https://zovo.app/login?ref=cookie-manager` in a new tab.
3. User completes email/password authentication on zovo.app.
4. On success, the zovo.app page sends a message to the extension via `chrome.runtime.sendMessage()` with the auth payload.
5. Extension writes `zovo_auth` to `chrome.storage.sync`.

**Token format:**

```json
{
  "user_id": "uuid-v4",
  "email": "user@example.com",
  "tier": "pro",
  "exp": 1739366400,
  "iat": 1739280000,
  "iss": "zovo.app"
}
```

**Token refresh logic (on every popup open):**

```typescript
async function refreshTokenIfNeeded(): Promise<void> {
  const { zovo_auth } = await chrome.storage.sync.get("zovo_auth");
  if (!zovo_auth?.token) return;

  const exp = zovo_auth.expires;
  const oneHourFromNow = Date.now() + 60 * 60 * 1000;

  if (new Date(exp).getTime() < oneHourFromNow) {
    try {
      const response = await fetch("https://api.zovo.app/v1/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: zovo_auth.refresh_token }),
      });
      if (response.ok) {
        const { token, expires } = await response.json();
        await chrome.storage.sync.set({
          zovo_auth: { ...zovo_auth, token, expires },
        });
      }
    } catch {
      // Network error -- rely on offline grace period
    }
  }
}
```

**Sign out:** Clicking "Sign Out" in settings calls:

```typescript
async function signOut(): Promise<void> {
  await chrome.storage.sync.remove("zovo_auth");
  // All features immediately revert to free tier
  // No data is deleted -- profiles, rules, snapshots remain in local storage
  // They become locked (inaccessible beyond free limits) but preserved
}
```

### 4.2 Membership Verification

**Primary check (every popup open):**

Read `chrome.storage.sync` `zovo_auth.tier`. If tier is not "free" and token is not expired, render the paid UI immediately. Schedule a background verification call to `GET /auth/verify` that runs asynchronously without blocking popup render.

**Fallback (expired token):**

If `zovo_auth.expires` is in the past, attempt `POST /auth/refresh` with the refresh token. On success, update `zovo_auth` and continue with paid UI. On failure, check `license_cache` in `chrome.storage.local`.

**Offline grace period (72 hours):**

If no network is available, the extension checks `license_cache.validated_at`. If the last successful validation was within 72 hours, Pro features remain unlocked. The popup shows a subtle banner: "Offline -- features available for [X] more hours." After 72 hours, the extension reverts to free tier and shows: "Your Zovo subscription could not be verified. Please reconnect to continue using Pro features."

**Error handling -- no immediate downgrade:**

If the API returns 401 or 403, the extension does not immediately strip Pro features. Instead:
1. Attempt token refresh once.
2. If refresh fails, show a non-blocking banner: "Please sign in again to verify your subscription."
3. Start the 72-hour grace countdown from `license_cache.validated_at`.
4. Only downgrade after the grace period expires with no successful verification.

This prevents a transient API outage from punishing paying users.

### 4.3 Cross-Extension Auth Propagation

All Zovo extensions share the `zovo_auth` key in `chrome.storage.sync`. When any extension writes to this key, Chrome's sync storage automatically propagates the change to all extensions on the same Chrome profile.

**Listener in every Zovo extension's service worker:**

```typescript
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "sync" && changes.zovo_auth) {
    const newAuth = changes.zovo_auth.newValue;
    // Update local license cache
    chrome.storage.local.set({
      license_cache: {
        tier: newAuth?.tier ?? "free",
        validated_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
      },
    });
    // If popup is open, trigger re-render
    chrome.runtime.sendMessage({ type: "TIER_CHANGED", tier: newAuth?.tier ?? "free" });
  }
});
```

**New extension installed:** On `chrome.runtime.onInstalled` with reason `"install"`, the extension reads `zovo_auth` from `chrome.storage.sync`. If a valid auth object exists, the extension auto-authenticates -- no sign-in required. The user sees their Pro badge immediately.

**Upgrade propagation timing:** When a user upgrades via Cookie Manager, all other installed Zovo extensions detect the `chrome.storage.sync` change within seconds. Each extension's popup (if open) triggers the unlock animation. Extensions that are not open will show the upgraded UI on their next open.

**Downgrade propagation:** Downgrades propagate on the next `license-check` alarm cycle (every 24 hours). This intentional delay prevents a brief payment processing gap from disrupting the user's workflow. If the background license check confirms a downgrade, it updates `zovo_auth.tier` to `"free"`, which triggers `chrome.storage.onChanged` in all extensions.

---

## 5. Revenue Analytics

Every monetization-relevant event follows the schema: `{ event_name, timestamp, session_id, extension: "cookie-manager", tier, properties }`. Events are queued in `chrome.storage.local` under `zovo_analytics_queue` and flushed to `POST /analytics/events` every 5 minutes via the `analytics-flush` alarm.

### 5.1 Monetization Event Definitions

| Event | Properties | Purpose |
|-------|-----------|---------|
| `paywall_shown` | `trigger_id` (T1-T17), `paywall_type` (hard/soft/discovery), `copy_variation` (0-4), `times_shown_total` (lifetime count for this trigger), `days_since_install`, `session_number`, `domain_tld` | Track which limits users hit and which copy variation was displayed. Powers conversion-per-trigger analysis and copy A/B testing. |
| `paywall_dismissed` | `trigger_id`, `dismiss_method` (x_button/maybe_later/escape/outside_click), `view_duration_ms` (time from render to dismiss), `times_dismissed_total`, `copy_variation` | Measure fatigue and identify which copy or trigger combinations cause the fastest dismissals. High `view_duration_ms` with eventual dismiss suggests interest but insufficient value proposition. |
| `paywall_clicked` | `trigger_id`, `destination_url`, `copy_variation`, `days_since_install`, `session_number`, `has_account` (boolean) | Track upgrade intent. The `has_account` flag indicates whether this click leads to signup or direct checkout -- different friction levels. |
| `upgrade_started` | `trigger_id`, `plan_preselected` (starter/pro/team), `billing_cycle` (monthly/annual), `referral_source` (paywall/settings/cross_promo) | Fires when the user lands on the zovo.app/upgrade page. Captures the plan and cycle that were pre-selected by the CTA. Distinguish between paywall-driven and settings-driven upgrade paths. |
| `upgrade_completed` | `from_tier`, `to_tier`, `billing_cycle`, `amount_cents`, `trigger_id` (the trigger that ultimately converted this user), `days_since_install`, `total_paywalls_seen`, `total_sessions`, `extensions_installed_count` | The most important event. Attributes conversion to the trigger and copy variation that drove it. `total_paywalls_seen` reveals optimal paywall exposure before conversion. `extensions_installed_count` validates the multi-extension conversion multiplier hypothesis. |
| `upgrade_failed` | `error_type` (payment_declined/network/timeout/license_invalid), `plan_tier`, `billing_cycle`, `step_failed` (checkout/activation/token_delivery) | Identify drop-off points in the payment flow. High `token_delivery` failures indicate extension messaging issues. High `payment_declined` rates suggest pricing resistance. |
| `cross_promo_shown` | `target_extension`, `trigger_action` (export_json/copy_value/save_profile), `session_number`, `days_since_install` | Track cross-promotion impressions. Compare against `cross_promo_clicked` to calculate click-through rate per extension and trigger combination. |
| `cross_promo_clicked` | `target_extension`, `trigger_action`, `destination` (chrome_web_store_url), `user_tier` | Measure cross-sell effectiveness. Segment by tier to determine if free or paid users are more responsive to cross-promotion. |
| `cross_extension_installed` | `installed_extension`, `referral_source` (settings/contextual/first_run/upgrade_page), `total_zovo_extensions`, `user_tier` | Fires when the "More from Zovo" section detects a newly installed Zovo extension (checked on each settings page render). `total_zovo_extensions` tracks portfolio penetration depth. |
| `downgrade_detected` | `from_tier`, `to_tier`, `reason` (subscription_cancelled/payment_failed/token_expired/manual_signout), `days_as_paid_user`, `total_paid_amount_cents` | Track churn events with context. `days_as_paid_user` feeds LTV calculations. `reason` identifies whether churn is voluntary (cancellation) or involuntary (payment failure -- recoverable via dunning). |
| `churn_detected` | `last_tier`, `days_since_downgrade`, `profiles_count`, `rules_count`, `total_sessions`, `referral_used` (boolean) | Fires 30 days after downgrade if the user has not re-upgraded. Captures the depth of feature investment the user had, which informs win-back targeting. Users with many profiles/rules are high-value win-back candidates. |
| `referral_shared` | `referral_url_hash`, `share_method` (clipboard_copy), `days_since_upgrade`, `user_tier` | Track referral link generation. Combined with backend referral redemption data to calculate referral conversion rate. |
| `annual_upsell_shown` | `current_billing_cycle` (monthly), `months_as_subscriber`, `trigger_location` (settings/renewal_reminder) | Track annual plan upsell impressions for monthly subscribers. Shown in settings and as a pre-renewal reminder. |
| `annual_upsell_clicked` | `current_billing_cycle`, `months_as_subscriber`, `annual_savings_shown` | Measure annual conversion intent. `annual_savings_shown` captures the dollar amount displayed (e.g., "$24/year saved"). |

### 5.2 Funnel-Specific Composite Metrics

These metrics are computed server-side from the raw events above. They power the Conversion Dashboard.

| Metric | Computation | Target | Alert Threshold |
|--------|------------|--------|----------------|
| **Paywall-to-click rate** | `paywall_clicked` / `paywall_shown` per trigger | 15-20% | Below 10% for any trigger sustained over 7 days |
| **Click-to-payment rate** | `upgrade_completed` / `paywall_clicked` | 60-70% | Below 40% (checkout friction) |
| **Optimal exposure count** | Median `total_paywalls_seen` at time of `upgrade_completed` | 3-5 impressions | If median exceeds 8, paywalls are fatiguing users before converting |
| **Time-to-convert** | Median `days_since_install` at time of `upgrade_completed` | 7-14 days | If median exceeds 30 days, free tier may be too generous |
| **Copy variation winner** | Conversion rate per `copy_variation` per trigger | Highest variant promoted to default | Run for 500+ impressions per variation before declaring winner |
| **Cross-promo install rate** | `cross_extension_installed` / `cross_promo_shown` | 5-8% | Below 3% suggests copy or placement needs revision |
| **Multi-extension conversion lift** | Conversion rate for users with 2+ Zovo extensions vs. 1 | 2-3x lift | If lift is below 1.5x, cross-promotion is not driving sufficient portfolio value |
| **Involuntary churn rate** | `downgrade_detected` where reason is `payment_failed` / total downgrades | Below 30% of all churn | Above 40% indicates dunning sequence needs optimization |

### 5.3 Privacy Safeguards

All analytics follow the privacy architecture defined in Section 7.3:

- No cookie values are ever transmitted. Cookie names are SHA-256 hashed.
- Only the registrable domain (eTLD+1) is recorded as `domain_tld`, never full URLs.
- EU users (detected via timezone) have analytics disabled by default with an opt-in banner.
- All users can disable analytics in settings. Disabling flushes (deletes) the local queue.
- Events are sent to the first-party endpoint `analytics.zovo.app/v1/events` only. No third-party analytics services.

---

*End of Agent 5 monetization integration specification. This document covers feature gating, upgrade prompts, Zovo branding, cross-promotion, authentication, and revenue analytics for the Zovo Cookie Manager extension.*
