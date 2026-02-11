# SECTION 3: Cross-Category Patterns and the Grammarly Playbook

**Research Date:** February 11, 2026
**Analyst Context:** Competitive intelligence for Zovo Cookie Manager Chrome extension (portfolio of 18+ extensions, unified membership $4-14/month)

---

## TABLE OF CONTENTS

1. [Tier 2 Extension Overview](#tier-2-extension-overview)
2. [Feature Matrix Summaries](#feature-matrix-summaries)
3. [Pattern Library: 12 Reusable Paywall Patterns](#pattern-library-12-reusable-paywall-patterns)
4. [The Grammarly Playbook: Deep Dive](#the-grammarly-playbook-deep-dive)
5. [Strategic Takeaways for Zovo](#strategic-takeaways-for-zovo)

---

## TIER 2 EXTENSION OVERVIEW

| Extension | Model | Free Tier | Paid Tier | Price | Key Paywall Mechanic |
|-----------|-------|-----------|-----------|-------|---------------------|
| **Grammarly** | Freemium | Basic grammar/spelling, tone detection, 100 AI prompts/mo | Plagiarism checker, style suggestions, 1,000 AI prompts/mo | $12/mo (annual), $30/mo (monthly) | Blurred preview + gift framing |
| **Todoist** | Freemium | 5 projects, 300 tasks/project, 7-day history | 300 projects, reminders, filters, calendar sync, unlimited history | $4/mo (annual) | Feature cap + missing reminders |
| **LastPass** | Freemium (crippled) | Single device type, share with 1 person, no emergency access | All devices, 1-to-many sharing, 1GB storage, security dashboard | $3/mo (annual) | Hard device-type lock |
| **Evernote Web Clipper** | Freemium (restrictive) | 50 notes, 1 notebook, 250MB uploads, 1 device sync | Unlimited notes/notebooks, offline access, unlimited devices | $14.99/mo (Personal) | Upload cap + note limit |
| **Pocket** | Freemium (sunset July 2025) | Save articles, basic tagging | Permanent library, full-text search, unlimited highlights | $4.99/mo | Feature lock on search/library |
| **Loom** | Freemium | 5-min recordings, 25 videos, 50 creators | Unlimited recording/storage, transcription, custom branding | $15/user/mo (Business) | Hard time-limit cutoff |
| **Momentum** | Freemium | Daily backgrounds, basic to-do, weather, search | Focus mode, integrations, soundscapes, AI tools, habit tracking | $3.33/mo ($39.95/yr) | Feature visibility + lock icons |
| **Session Buddy** | Free (donation) | Full features: save/restore sessions, export/import | N/A | Free | No paywall (donation model) |
| **OneTab** | Free | Full features: tab-to-list conversion, restore, share | N/A | Free | No paywall |
| **The Great Suspender** | Free/OSS | Full tab suspension, configurable rules | N/A | Free | No paywall (open source) |

---

## FEATURE MATRIX SUMMARIES

### Grammarly: Free vs. Pro

| Feature | Free | Pro |
|---------|------|-----|
| Basic grammar and spelling | Yes | Yes |
| Punctuation corrections | Yes | Yes |
| Basic tone detection | Yes | Yes |
| Generative AI prompts | 100/month | 1,000/month |
| Style and clarity suggestions | No (shown blurred) | Yes |
| Plagiarism checker | No | Yes |
| Full-sentence rewrites | No | Yes |
| Vocabulary enhancement | No | Yes |
| Brand style guides | No | Yes |
| Analytics dashboard | No | Yes |

### Todoist: Free vs. Pro

| Feature | Free | Pro |
|---------|------|-----|
| Active projects | 5 | 300 |
| Tasks per project | 300 | 300 |
| Collaborators per project | 5 | 25 |
| Reminders | No | Yes |
| Filters | 3 | 150 |
| Labels | Limited | 250 |
| Activity history | 7 days | Unlimited |
| Calendar sync | No | Yes |
| File upload limit | 5MB | 100MB |

### LastPass: Free vs. Premium

| Feature | Free | Premium |
|---------|------|---------|
| Password storage | Unlimited | Unlimited |
| Device types | One type only (mobile OR desktop) | All devices |
| Password sharing | 1-to-1 only | 1-to-many |
| Encrypted file storage | No | 1GB |
| Emergency access | No | Yes |
| Security dashboard | No | Yes |
| Email support | No | Yes |
| Multi-factor authentication | Basic | Advanced |

---

## PATTERN LIBRARY: 12 REUSABLE PAYWALL PATTERNS

### Pattern 1: The Blurred Preview (Gift > Gate)
- **How it works:** Show the user what premium would give them -- the actual suggestion, rewrite, or insight -- but blur or obscure the content. The user sees that value exists, just out of reach.
- **Who uses it:** Grammarly (blurred style suggestions inline with text), Evernote (preview of clipped content features)
- **When to apply:** When premium features produce visible, per-session output that free users can glimpse. Works best for content-generation or analysis tools.
- **Example copy:** "Your writing could be 23% more concise. Upgrade to see how." [blurred rewrite visible beneath]
- **Cookie Manager application:** Show a blurred privacy risk score or compliance summary. "3 tracking cookies detected with known data brokers. Upgrade to see details."

### Pattern 2: The Hard Usage Cap
- **How it works:** Allow full feature access but impose a strict numeric limit -- after N uses, recordings, or items, the tool stops working until the user upgrades.
- **Who uses it:** Loom (5-minute recording limit, 25-video cap), Grammarly (100 AI prompts/month free), Evernote (50 notes, 250MB upload)
- **When to apply:** When the free experience must feel complete but you need a natural boundary. Usage caps let users experience the full product before hitting the wall.
- **Example copy:** Loom shows a countdown timer during recording: "0:42 remaining on free plan."
- **Cookie Manager application:** "You've exported 3 cookie profiles this month. Upgrade for unlimited exports."

### Pattern 3: The Device/Platform Lock
- **How it works:** Free tier works on one device type or platform only. Cross-device sync requires payment.
- **Who uses it:** LastPass (mobile OR desktop, not both), Evernote (1 device + web only)
- **When to apply:** When your tool stores data users need across contexts. The pain of being locked to one device creates daily friction.
- **Example copy:** LastPass on first login: "Choose your device type: Computers or Mobile Devices. You'll have 3 chances to switch."
- **Cookie Manager application:** "Sync cookie profiles across Chrome instances. Upgrade to enable cloud sync."

### Pattern 4: The Missing Essential
- **How it works:** Omit one feature that power users consider essential, making the free tier feel 90% complete but frustratingly incomplete.
- **Who uses it:** Todoist (no reminders on free tier -- the single most-requested feature), LastPass (no emergency access)
- **When to apply:** When you can identify a single feature that creates habitual dependency. The feature must feel like it "should" be included.
- **Example copy:** Todoist shows the reminders UI but with a lock icon: "Set reminders with Pro."
- **Cookie Manager application:** "Auto-delete rules require Zovo Pro. Set rules for automatic cookie cleanup on tab close."

### Pattern 5: The Countdown/Scarcity Timer
- **How it works:** Display a real-time countdown showing the user approaching their limit. Creates urgency and loss aversion as the number decreases.
- **Who uses it:** Loom (countdown from 5:00 during recording), Grammarly (AI prompt counter: "87 of 100 prompts remaining")
- **When to apply:** When usage is session-based and the limit can be visualized in real time. Most effective when the user is mid-task and invested.
- **Example copy:** "Recording ends in 0:42" (Loom) or "13 AI prompts remaining this month" (Grammarly)
- **Cookie Manager application:** "2 of 3 free bulk operations remaining this month."

### Pattern 6: The Progressive Feature Lock
- **How it works:** Start with everything unlocked, then progressively lock features as the user becomes more invested. New users get a taste; returning users hit walls.
- **Who uses it:** Momentum (originally more features free, gradually moved weather, focus mode, and customization behind Plus paywall), Evernote (historically generous free tier, steadily restricted)
- **When to apply:** When building an initial user base. Offer everything early, then gate features once the user is habituated.
- **Example copy:** Momentum: "Focus Mode is now a Plus feature. Upgrade for $3.33/mo to keep using it."
- **Cookie Manager application:** Offer full features for 14 days, then restrict advanced features to paid tier.

### Pattern 7: The Visible Lock Icon
- **How it works:** Display premium features in the UI with a small lock or "Pro" badge. The feature name and description are visible, but clicking triggers an upgrade prompt instead of the action.
- **Who uses it:** Todoist (lock icon on reminders, filters), Momentum (lock icon on integrations, soundscapes), Grammarly (diamond icon on premium suggestions)
- **When to apply:** Universally applicable. Every free UI should show what premium offers without hiding it in a separate pricing page.
- **Example copy:** Feature label with a small lock glyph: "Compliance Report [Pro]" -- clicking opens: "Unlock compliance reports with Zovo Pro."
- **Cookie Manager application:** Show "Export as HAR [Pro]" or "Schedule Auto-Clean [Pro]" in the toolbar with lock badges.

### Pattern 8: The History/Retention Limit
- **How it works:** Free users can use the tool but cannot access historical data beyond a short window. Past data becomes the premium value.
- **Who uses it:** Todoist (7-day activity history on free vs. unlimited on Pro), Pocket Premium (permanent library vs. ephemeral free)
- **When to apply:** When users generate data over time and that historical data has compounding value.
- **Example copy:** Todoist: "Activity from 8+ days ago is available with Pro."
- **Cookie Manager application:** "Cookie change history: last 7 days (free) or unlimited (Pro)."

### Pattern 9: The Collaboration Gate
- **How it works:** Individual use is free; sharing, team features, or multi-user scenarios require payment.
- **Who uses it:** Todoist (5 collaborators free, 25 on Pro), Loom (workspace features on Business), LastPass (1-to-1 sharing free, 1-to-many on Premium)
- **When to apply:** When the tool has natural sharing use cases. Works especially well for B2B upsells.
- **Example copy:** "Share this cookie profile with your team. Upgrade to Zovo Pro for team sharing."
- **Cookie Manager application:** "Share cookie profiles with up to 5 team members on Zovo Pro."

### Pattern 10: The Annoyance Nudge (Banner/Badge)
- **How it works:** Persistent but non-blocking banner, badge, or notification that reminds free users about premium. Does not block functionality.
- **Who uses it:** Grammarly (persistent green circle badge showing "X issues found, Y are Premium"), Momentum (subtle "Go Plus" link in settings)
- **When to apply:** As a background layer alongside other patterns. Should be dismissible but recurring.
- **Example copy:** Grammarly sidebar: "4 advanced issues found. Go Premium to fix them."
- **Cookie Manager application:** Small banner: "Zovo Pro members save 2+ hours/week with auto-clean rules."

### Pattern 11: The One-Free-Taste
- **How it works:** Give users exactly one premium action per day or session for free, enough to demonstrate value, not enough to satisfy the need.
- **Who uses it:** Grammarly (1 free Pro suggestion per day), various mobile apps
- **When to apply:** When individual premium actions are high-value and immediately demonstrable.
- **Example copy:** "Here's your free Pro tip for today: [suggestion]. Want unlimited tips? Upgrade."
- **Cookie Manager application:** "One free bulk cookie operation per day. Upgrade for unlimited."

### Pattern 12: The Anchored Discount
- **How it works:** Show the monthly price struck through next to the annual price, creating an anchoring effect that makes the annual plan feel like a deal.
- **Who uses it:** Grammarly ($30/mo vs. $12/mo annual -- 60% savings), Todoist ($5/mo vs. $4/mo annual), Momentum ($5/mo vs. $3.33/mo annual), LastPass ($4/mo vs. $3/mo annual)
- **When to apply:** Always. Every pricing page should anchor against the higher monthly price.
- **Example copy:** "~~$14/month~~ $5/month billed annually. Save 64%."
- **Cookie Manager application:** Show Zovo monthly at $14, annual equivalent at $5.83/mo with "Save 58%" badge.

---

## THE GRAMMARLY PLAYBOOK: DEEP DIVE

Grammarly is the gold standard for Chrome extension monetization. With 30+ million users and a freemium model that converts at scale, their approach -- specifically the 2023-2024 paywall redesign led by designer Shane Fontane -- provides the most directly applicable playbook for Zovo.

### Phase 1: Deliver Genuine Value Before Asking for Anything

Grammarly's free tier is not a demo. It catches real grammar errors, fixes spelling, identifies tone, and provides 100 AI prompts per month. Free users get a tool that meaningfully improves their writing every day. This builds the habit loop: install the extension, see red underlines, click to fix, feel smarter. By the time a user encounters a premium feature, they already trust Grammarly and rely on it.

**Zovo application:** Cookie Manager's free tier must solve real problems -- viewing, editing, exporting cookies -- without feeling crippled. The free experience builds trust. Premium is for power users, not basic functionality.

### Phase 2: Show, Don't Hide -- The Blur Preview Technique

The core insight of Grammarly's redesign: premium suggestions are not hidden. They are shown inline with the user's text, with the suggestion content blurred. The user sees:

1. An underline on a phrase (blue or purple for premium-tier issues like clarity or engagement)
2. A suggestion card that says something like "Make this sentence more concise"
3. The actual rewrite, blurred behind a frosted-glass overlay
4. A "Go Pro" button or diamond badge

The user can see that Grammarly found something and has a fix. They just cannot read the fix. This is fundamentally different from hiding the feature entirely. The blurred preview creates **feature envy** -- the user knows the value exists, personalized to their exact text, right now.

Grammarly also gives one free Pro suggestion per day, enough to prove the suggestions are genuinely useful.

**Zovo application:** In Cookie Manager, show a blurred or partially redacted "Privacy Risk Summary" or "Compliance Check" result. The user sees "3 high-risk tracking cookies detected from known data brokers" but the details (which cookies, which brokers, recommended actions) are blurred with a "Unlock with Zovo Pro" overlay.

### Phase 3: Gift Framing, Not Gate Framing

The critical psychological shift in Grammarly's redesign was reframing the paywall from a lock ("You can't access this") to a gift ("Here's a preview of what Pro gives you"). The team initially tested a "Locked UI" with lock icons, but user feedback showed people felt rejected and bounced.

Shane Fontane's redesign shifted the copy and framing:

- **Before (gate):** "This suggestion is available with Grammarly Premium" + lock icon
- **After (gift):** "Your writing could be sharper. Here's a taste of what Pro offers." + blurred preview + "Unlock"

This leverages two behavioral economics principles:

1. **Frame Effect:** "You're locked out" feels punishing. "You've earned a preview" feels rewarding. Same feature restriction, opposite emotional response.
2. **Endowment Effect:** By showing users a taste of premium (the blurred suggestion, the one free tip per day), users feel they already partially own the premium experience. Upgrading feels like completing something they already have, not buying something new.

**Results:** +22% upgrade conversions, +4% annual plan purchases, contributing to a 20% overall revenue increase and 100,000+ new upgrades.

**Zovo application:** Frame every locked feature as a preview, not a block. Instead of "This feature requires Zovo Pro," use "Here's what Zovo Pro found for you" + partial reveal + "See the full report."

### Phase 4: Badge Placement and Persistent Awareness

Grammarly uses a floating green circle badge in the bottom-right corner of every text field. For free users, this badge serves double duty:

1. **Functional:** Shows error count and overall score
2. **Upsell surface:** Displays "X advanced issues" that require Pro, visible every time the user writes

The badge is never intrusive enough to annoy, but it is always present. Over weeks and months, free users see "4 advanced issues" hundreds of times. This creates **usage anxiety** -- the nagging feeling that their writing has problems they cannot fix.

The Grammarly Editor sidebar also shows a breakdown: "Correctness: 4 issues (free) | Clarity: 3 issues (Pro) | Engagement: 2 issues (Pro)." The free issues are actionable; the Pro issues are visible but locked. The user sees the gap every session.

**Zovo application:** Place a small Zovo badge in the Cookie Manager popup showing "3 tracking risks detected [Pro]" alongside the free cookie count. Make the badge visible on every popup open.

### Phase 5: The Upgrade Flow

Grammarly's upgrade flow is streamlined:

1. User clicks a blurred suggestion or "Go Pro" badge
2. A modal appears inside the extension showing the value proposition (not a new tab)
3. One click goes to grammarly.com/premium with the plan pre-selected
4. Annual plan is pre-selected and visually emphasized ($12/mo vs. $30/mo monthly, with "Save 60%" badge)
5. 7-day money-back guarantee reduces risk
6. Student discount (30% off) available

The entire flow from "click blurred suggestion" to "enter payment info" is 2 clicks. No friction, no intermediate pages, no feature comparison charts blocking the path.

**Zovo application:** Upgrade click within Cookie Manager should open a streamlined Zovo checkout with the relevant tier pre-selected. Minimize clicks. Show the annual savings prominently. Consider a 7-day guarantee.

---

## STRATEGIC TAKEAWAYS FOR ZOVO

### What the Top Converters Have in Common

1. **Free tier is genuinely useful.** Grammarly, Todoist, and Loom all provide real daily value on free. Extensions that crippled their free tier (Evernote, LastPass) lost users to competitors instead of converting them.

2. **Premium is visible inside the free experience.** Lock icons, blurred previews, usage counters, and badge notifications all keep premium features in the user's peripheral vision without blocking core workflows.

3. **The paywall is contextual, not random.** The upgrade prompt appears at the moment the user wants the feature -- mid-writing for Grammarly, mid-recording for Loom, when setting a reminder for Todoist. Context creates intent.

4. **Annual pricing is anchored against monthly.** Every successful extension shows the monthly price as a reference point to make the annual plan feel like a bargain. Savings percentages (50-64%) are displayed prominently.

5. **Extensions with no monetization (Session Buddy, OneTab, The Great Suspender) struggle with sustainability.** The Great Suspender was sold to a new owner who injected malware -- a cautionary tale for free-only models. Session Buddy and OneTab remain small-scale projects. Free-only is not a viable long-term strategy for a portfolio business.

### Priority Patterns for Zovo Cookie Manager

| Priority | Pattern | Rationale |
|----------|---------|-----------|
| 1 | Visible Lock Icon (#7) | Lowest effort, highest visibility. Add [Pro] badges to features like bulk operations, auto-clean rules, compliance reports. |
| 2 | Blurred Preview (#1) | Adapt Grammarly's approach for privacy/compliance insights. Show partial results, blur details. |
| 3 | Hard Usage Cap (#2) | Limit exports or bulk operations to 3-5/month on free tier. Natural boundary for power users. |
| 4 | Annoyance Nudge (#10) | Persistent but dismissible banner showing Zovo Pro value proposition on each popup open. |
| 5 | Anchored Discount (#12) | Display monthly vs. annual pricing on every upgrade surface within the extension. |

---

*Sources: Grammarly pricing and feature data from grammarly.com and DemandSage (2026). Paywall UX analysis from Atlas Moth Newsletter coverage of Shane Fontane's redesign. Todoist pricing from todoist.com (2025 update). LastPass device restriction from 9to5Google and Android Police (March 2021). Loom pricing from Atlassian/Loom official plans. Momentum pricing from momentumdash.com/plus. Pocket sunset announced by Mozilla (May 2025). Session Buddy, OneTab, and The Great Suspender data from Chrome Web Store and GitHub repositories.*
