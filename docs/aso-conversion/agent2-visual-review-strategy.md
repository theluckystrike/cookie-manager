# Visual Conversion Optimization & Review Strategy: Zovo Cookie Manager

## Phase 07 | Agent 2 | Generated 2026-02-11

---

# PART A: Visual Conversion Optimization

---

## 1. Icon Optimization for CWS Search Results

### 1.1 Performance at Display Sizes

The Zovo Cookie Manager icon uses a white cookie silhouette with bite mark on a purple (#6366f1 to #4f46e5) rounded-square background. Here is how it performs at each critical CWS display size:

**128x128 (Listing page, install dialog):**
- The cookie shape reads clearly at this size. The bite arc, 5-6 chocolate chip dots, and optional crumb details all render with full fidelity.
- The rounded-square format with 28px corner radius is the current standard for modern Chrome extensions and will not appear dated.
- Risk: The purple gradient blends into itself at small scale. The icon may appear as a flat purple square with a white blob if chip dots are not rendered with sufficient contrast. The chip dots are "holes" revealing the purple background -- at 128px this creates a subtle effect that may not register as chocolate chips. This is acceptable because the cookie silhouette itself is the primary identifier.
- Verdict: Strong. The bite mark is the defining visual differentiator and reads instantly.

**48x48 (Extensions management page, CWS search results in grid view):**
- At 48px, the icon loses crumb details and surface texture. This is expected -- those layers should be disabled at this export size per the existing spec.
- The bite arc remains visible but becomes a subtle notch rather than a dramatic bite. With 4-5 chip dots at 2.5-3.5px each, the dots may merge into visual noise.
- Recommendation: Reduce to 3 chip dots at 48px for cleaner read. Position them in a loose triangle pattern for maximum separation.
- Verdict: Acceptable but at risk. Test with 3 dots versus 4-5 at this size.

**32x32 and 16x16 (Toolbar, search result favicons):**
- These sizes are not directly relevant to CWS conversion (users do not shop for extensions at toolbar size) but affect post-install perception. The existing specs handle these sizes well.

### 1.2 Color Contrast Analysis Against CWS Backgrounds

The Chrome Web Store renders extension tiles against different backgrounds depending on context:

**CWS Light Mode (default):**
- Background: White (#FFFFFF) or very light gray (#F8F9FA)
- The purple (#6366f1) icon has excellent contrast. The rounded-square format creates a visible boundary against white without needing a border or shadow.
- WCAG contrast ratio of #6366f1 against #FFFFFF: approximately 4.6:1. Passes AA for large text. The icon itself is not text, so contrast ratio is informational -- what matters is perceptual distinctness, which is high.

**CWS Dark Mode:**
- Background: Dark gray (#202124 or #292A2D)
- The purple icon has lower but still adequate contrast against dark backgrounds. The gradient from #6366f1 to #4f46e5 sits in the mid-luminance range -- not as bright as yellow or green icons, but clearly visible against dark gray.
- Risk: Purple is a mid-tone color. On dark backgrounds, the icon will not "pop" the way a bright green, yellow, or orange icon would. This is the single biggest visual risk for CWS dark mode users.
- Mitigation: Consider a 1px semi-transparent white stroke (#FFFFFF at 8-10% opacity) on the outer edge of the rounded square. This adds a subtle glow that separates the icon from dark backgrounds without affecting light-background rendering. This should be tested as Variant C below.

**CWS Category Pages and Featured Sections:**
- These often use colored or gradient backgrounds. The purple icon may clash with or disappear against purple/blue category headers.
- Mitigation: The white cookie silhouette inside the icon ensures there is always a high-contrast internal element, regardless of the external background. Even if the purple square blends into a purple page section, the white cookie shape remains visible.

### 1.3 Three Icon Variants for A/B Testing

**Variant A: Solid Purple (Current Design)**
- Background: Solid or near-solid #6366f1 (the gradient from #6366f1 to #4f46e5 is subtle enough to appear solid at small sizes)
- Foreground: White cookie silhouette with bite mark and chip dots
- Strengths: Clean, modern, consistent with Zovo brand palette. Professional appearance.
- Weaknesses: Purple is not the most attention-grabbing color in CWS search results. Competes with many developer tool icons that also use blue-purple palettes.
- Best for: Establishing brand consistency across the Zovo portfolio.

**Variant B: Gradient Purple with Warm Accent**
- Background: Linear gradient from #7C3AED (vivid purple, top-left) to #4F46E5 (indigo, bottom-right)
- Foreground: Cookie silhouette in warm off-white (#FEF3C7, a very light amber) instead of pure white. The chip dots remain as holes revealing the purple background.
- Bite mark edge: Add a subtle warm glow (#F59E0B at 15% opacity) along the bite arc, suggesting the interior of a freshly baked cookie.
- Strengths: The warm accent breaks the cold-purple monotony and draws the eye. The amber tint on the cookie reads as "baked" and reinforces the cookie metaphor. More visually distinctive in a sea of blue/purple developer tool icons.
- Weaknesses: Slightly less clean than Variant A. May not scale perfectly to 16px. The warm accent could be lost at small sizes.
- Best for: Standing out in CWS search results where visual differentiation drives CTR.

**Variant C: Purple with Bright Edge Outline**
- Background: Same gradient as Variant A (#6366f1 to #4f46e5)
- Foreground: White cookie silhouette, same as Variant A
- Addition: A 2px stroke outline on the entire rounded-square boundary in #A5B4FC (light lavender, 60% opacity). This creates a subtle "glow" border that lifts the icon off any background.
- At 128px: The outline is clearly visible and gives the icon a polished, app-store quality feel.
- At 48px: The outline reduces to a 1px subtle halo.
- Strengths: Solves the dark-background contrast problem. Makes the icon appear more refined and intentional. The light border catches the eye in CWS grid views.
- Weaknesses: Risk of appearing "boxy" if the border is too strong. Must be tested at multiple sizes to ensure it does not create aliasing artifacts.
- Best for: Maximizing visibility across all CWS backgrounds (light and dark mode).

### 1.4 Competitor Icon Comparison

**Cookie-Editor (by cgagnier):**
- Icon: A stylized cookie on a green background. The green is distinctive in the CWS developer tools category, which is dominated by blue/purple.
- Strengths: The green stands out. Cookie-Editor has strong install numbers partly because the icon is immediately identifiable.
- Weakness: The icon style is slightly dated (pre-2024 aesthetic).
- How Zovo differentiates: The purple rounded-square format looks more modern and professional. However, Zovo loses on raw color attention. Variant B (warm accent) partially addresses this by adding warmth to break the purple monotony.

**J2Team Cookies (by nicedream):**
- Icon: A blue/teal cookie on a light background. Uses a different visual metaphor with gears or network nodes incorporated.
- Strengths: The teal is distinctive. The icon communicates "technical tool" rather than just "cookie."
- Weakness: The icon is visually busy at small sizes.
- How Zovo differentiates: Zovo's clean, single-element design (cookie with bite) is more immediately recognizable. At 48x48, the simpler Zovo icon will outperform visually because it has fewer elements competing for attention.

**EditThisCookie (removed, but still the reference benchmark):**
- Icon: A colorful cookie with rainbow-like accent. Bright and attention-grabbing.
- Strengths: Extremely recognizable. Users who remember EditThisCookie will associate bright, colorful cookies with cookie management.
- How Zovo differentiates: Zovo takes the opposite approach -- professional restraint over candy-colored playfulness. This positions Zovo as the mature, trustworthy choice for developers, while sacrificing some of the casual-user appeal that EditThisCookie had. This is the correct trade-off given the developer-first audience.

**Differentiation Summary:**

| Attribute | Cookie-Editor | J2Team | EditThisCookie | Zovo Cookie Manager |
|-----------|--------------|--------|----------------|---------------------|
| Primary color | Green | Blue/Teal | Multi/Rainbow | Purple |
| Visual complexity | Medium | High | Medium | Low (clean) |
| Cookie recognizability | High | Medium | High | High |
| Professional feel | Medium | Medium | Low | High |
| Dark mode visibility | Good (green) | Good (teal) | Good (bright) | Moderate (purple) |

**Recommendation:** Lead with Variant A (solid purple) for brand consistency, but run a 2-week A/B test against Variant B (warm accent) to measure CTR difference. If Variant B outperforms by more than 10% CTR, adopt it permanently.

---

## 2. Screenshot Conversion Strategy

### 2.1 Analysis of Current 5 Screenshots Through a Conversion Lens

#### Screenshot 1: "All Your Cookies, One Click" (Hero Shot)

**Conversion analysis:**

This screenshot is the single most important visual asset. It appears on hover in CWS search results, which means it must communicate the extension's core value in under 2 seconds while the user's mouse is passing over the listing.

- **Does it communicate value in <2 seconds?** Partially. The headline "All Your Cookies, One Click" is clear and benefit-oriented. The popup showing a list of cookies for github.com immediately communicates what the tool does. However, the popup is information-dense with 8 cookie rows, filter chips, action buttons -- a lot to parse in 2 seconds.
- **Is the headline benefit-focused?** Yes. "All Your Cookies, One Click" focuses on the outcome (see all cookies) and the effort (one click). This is well-written.
- **Is the text readable at small sizes?** The headline at 42px/600 weight in Inter will be readable even at the reduced size CWS renders in hover previews. The subtext at 20px may become difficult to read when the 1280x800 screenshot is scaled to the hover preview size (approximately 320x200). The callout annotations at 16px will be illegible at hover-preview scale.
- **Does it differentiate from competitors?** Moderately. Most cookie manager screenshots show a list of cookies. The filter chips and search bar add some differentiation, but the visual impression is "yet another cookie list." The github.com domain choice is smart (developer audience recognition) but does not visually pop.

**Improvements:**
1. Increase headline font from 42px to 52px. At hover-preview scale, every pixel matters.
2. Remove the subtext entirely or merge it into the headline. At small scale, two lines of text become visual noise.
3. Reduce the popup content density. Show 5 cookie rows instead of 8, with larger text inside the popup. The goal is not to demonstrate data density -- it is to be readable at hover size.
4. Add a large, bold metric callout outside the popup: "23 cookies found" in a large badge (80x40px, green background, white text). This gives the viewer a single number to anchor on.
5. Move callout annotations to the right side only, and increase their font size to 18px.

**Revised headline option:** "See Every Cookie Instantly" (shorter, punchier, still benefit-focused).

#### Screenshot 2: "Switch Environments in Seconds" (Profiles)

**Conversion analysis:**

- **Does it communicate value in <2 seconds?** Yes, but only for developers who already understand environment switching. For non-developer users, "Switch Environments" is jargon. The profile cards showing "Dev Environment," "Staging Login," and "QA Session" reinforce the developer context but may confuse casual users.
- **Is the headline benefit-focused?** Yes. "In Seconds" quantifies the speed benefit.
- **Is the text readable at small sizes?** The profile card text at 13px/12px will be illegible at any reduced size. The overall visual structure (three cards stacked vertically) communicates "list of items" even when unreadable.
- **Does it differentiate from competitors?** Strongly. No competing cookie extension prominently features profile management. This is Zovo's unique selling proposition and the screenshot correctly positions it as the second-most-important visual.

**Improvements:**
1. The locked fourth profile card with "Upgrade to Pro" is smart presell, but in a screenshot it may create the impression that the extension is heavily paywalled. Consider replacing the locked card with a fourth unlocked profile to show abundance, and save the presell for the in-extension experience.
2. Add a visual metaphor: Show a small arrow or animation indicator between the profile cards and the popup header, suggesting the "load profile" action. Currently, the cards are static -- adding a visual "switching" element (even a curved arrow between cards) communicates the dynamic action.
3. Headline alternative: "One-Click Environment Switching" (adds the "one-click" speed claim).

#### Screenshot 3: "Automatic Cookie Cleanup" (Rules)

**Conversion analysis:**

- **Does it communicate value in <2 seconds?** Yes. "Automatic Cookie Cleanup" is universally understood. The toggle switches on rule cards create an immediate visual association with settings/automation.
- **Is the headline benefit-focused?** Yes. "Automatic" is the benefit -- the user does not have to do anything.
- **Is the text readable at small sizes?** The domain patterns in monospace (*.doubleclick.net) are small but the toggle switches are visually distinctive even at reduced scale. The green left borders on cards create a strong visual pattern that reads at any size.
- **Does it differentiate from competitors?** Strongly. Auto-delete rules are a Pro feature that no competitor offers in a comparable visual format. The toggle-switch paradigm is familiar (iOS Settings, Android permissions) and communicates power without complexity.

**Improvements:**
1. This is one of the strongest screenshots. Minimal changes needed.
2. Consider moving the three rule domain patterns to larger text (14px instead of 13px) for better small-size readability.
3. The locked "Add Rule" area is appropriate here because it reinforces the Pro value proposition in context. Keep it.
4. Headline alternative: "Auto-Delete Tracking Cookies" (more specific, names the pain point directly).

#### Screenshot 4: "Developer-Friendly Cookie Tools" (Export)

**Conversion analysis:**

- **Does it communicate value in <2 seconds?** Partially. The split layout (popup on left, code panel on right) is visually complex. At hover-preview scale, the two panels may merge into visual noise. The dark code panel is eye-catching, though, and signals "this is a developer tool."
- **Is the headline benefit-focused?** Somewhat. "Developer-Friendly" is a positioning statement, not a benefit. "Cookie Tools" is generic.
- **Is the text readable at small sizes?** The code in the dark panel uses 12px monospace, which will be illegible at hover-preview scale. However, the visual impression of a dark code editor panel communicates "developer tool" without needing to read the actual code.
- **Does it differentiate from competitors?** Moderately. Several cookie extensions offer JSON export, but the visual presentation of a formatted JSON output panel is distinctive. The cURL tab toggle is a strong differentiator.

**Improvements:**
1. Replace the headline with a benefit-focused alternative: "Export Cookies to JSON or cURL in One Click"
2. Increase the size of the code panel relative to the popup. The code panel is the hero element of this screenshot -- make it 60% of the horizontal space instead of 50%.
3. Add a large "Copied!" success badge overlaying the code panel (the spec mentions this but it should be more prominent -- 32px text, green badge). This communicates the one-click copy workflow.
4. Consider showing the cURL tab active instead of JSON. cURL output is more visually distinctive and signals a developer audience more strongly than JSON (which is generic).

#### Screenshot 5: "Know Your Cookie Health" (Health Dashboard)

**Conversion analysis:**

- **Does it communicate value in <2 seconds?** Yes. The large B+ grade badge in green is an immediate attention anchor. Users understand grading systems instantly. The combination of a letter grade with risk cards below creates a "scan results" visual metaphor that is familiar from antivirus software, website speed tests, and Grammarly.
- **Is the headline benefit-focused?** Somewhat. "Know Your Cookie Health" is informational, not benefit-focused. The benefit is not knowing -- it is fixing security risks.
- **Is the text readable at small sizes?** The B+ badge is large enough to read at any scale. The risk card headers ("3 Tracking Cookies Detected") are readable at moderate reduction. The blurred detail text is intentionally unreadable -- this is the presell mechanism.
- **Does it differentiate from competitors?** Extremely strongly. No competing cookie extension offers a health scoring dashboard. This is the most visually distinctive screenshot in the set.

**Improvements:**
1. Replace the headline with: "Your Cookie Security Score" or "Is This Site Safe? Check Your Cookie Score." These create curiosity and imply action.
2. The blurred cards are excellent presell but may confuse users who have not installed the extension yet. In the screenshot context, they might think the extension is broken or incomplete. Add a small label on the blurred area: "Unlock with Pro" to clarify that this is an intentional gate, not a rendering error.
3. Move the B+ badge higher and make it larger (80x80px instead of 64x64px). The grade is the hero element and should dominate the visual.
4. The color coding (red warning, amber warning, green check) is strong and should be preserved.

### 2.2 Screenshot Ordering Strategy

The current order is: Hero (cookies list) -> Profiles -> Rules -> Export -> Health.

**Recommended order for maximum conversion:**

| Position | Screenshot | Rationale |
|----------|-----------|-----------|
| 1 | Hero: "See Every Cookie Instantly" | Must be position 1 -- this is the hover preview in search results. Communicates core function. |
| 2 | Health: "Your Cookie Security Score" | Move UP from position 5. The B+ grade badge is the most visually distinctive element across all 5 screenshots. It creates immediate curiosity ("What's MY score?") and differentiates from every competitor. Position 2 catches users who scroll past the hero. |
| 3 | Profiles: "One-Click Environment Switching" | Strong differentiator for developer audience. Position 3 is where engaged users are evaluating features. |
| 4 | Rules: "Auto-Delete Tracking Cookies" | Demonstrates automation value. By position 4, the user is already considering installation and this tips them toward "I need this." |
| 5 | Export: "Export Cookies to JSON or cURL" | Developer utility. Position 5 is for users who are almost convinced and want to see one more capability. The code panel visual confirms "built for developers." |

**Why move Health to position 2:** In CWS, users who click into the listing page see the first 2-3 screenshots without scrolling (depending on viewport). The Health screenshot is the most visually unique -- no other cookie extension has anything like it. Placing it second maximizes the chance that a curious user sees it. Profiles and Rules are strong but visually conventional (card lists with toggles). The Health dashboard's B+ badge is an instant attention anchor that no competitor can match.

### 2.3 Text Overlay Best Practices

**Font size rules for CWS screenshots (1280x800 canvas):**
- Headlines: Minimum 48px, recommended 52-56px. CWS hover previews render at approximately 25% of original size, so 52px becomes ~13px in preview -- barely readable but the words register.
- Subtext: If used, minimum 22px. Strongly recommend omitting subtext entirely and letting the headline carry the message alone.
- Callout annotations: Minimum 16px, recommended 18px. These will be illegible in hover preview but readable on the listing detail page.

**Word count per headline:**
- Maximum 6 words. Every additional word reduces comprehension speed.
- Current headlines range from 4-5 words (good). "Developer-Friendly Cookie Tools" is 4 words but the first two are filler -- "Developer-Friendly" does not communicate a benefit on its own.

**Contrast requirements:**
- Headline text (#1e293b) on gradient background (#f0f3ff to #f8fafc) has excellent contrast. Keep this.
- Avoid placing text over the popup mockup -- text on top of UI elements creates visual confusion.
- All text should live in the top 20% of the canvas (headline zone) or in callout annotations positioned outside the popup boundary.

**Color accent for key words:**
- Consider coloring one word in each headline with the brand purple (#6366f1) for emphasis. Example: "See Every Cookie **Instantly**" where "Instantly" is in purple. This draws the eye to the benefit word.

---

## 3. Promotional Tile Conversion Analysis

### 3.1 The 440x280 Tile as a Mini Landing Page

The small promo tile (440x280) appears in CWS featured sections, category pages, and collections. At actual display size, CWS renders this at approximately 220x140 pixels -- half the designed size. Every element must be readable at 50% reduction.

**Current tile design analysis:**

The existing spec places the cookie icon (128x128) on the left, with "Zovo Cookie Manager" as the headline and "The modern cookie editor for Chrome" as the tagline on the right, all on a purple gradient.

**Issues:**
1. At 50% render size (220x140), the headline "Zovo Cookie Manager" at 24px becomes ~12px -- borderline readable.
2. The tagline at 14px becomes ~7px -- completely illegible.
3. The 128x128 icon at 50% becomes 64x64 -- still recognizable, but occupies a disproportionate amount of the tile's horizontal space.
4. The layout is left-heavy (icon) with text crammed to the right. At small sizes, the text column becomes too narrow to parse.

**Improved tile design:**

```
LAYOUT: Centered vertical stack (not left-right split)

┌──────────────────────────────────────────┐
│                                          │
│          [Cookie Icon - 72x72]           │
│                                          │
│       Zovo Cookie Manager                │
│       Inter Bold, 28px, #fff             │
│                                          │
│       See every cookie instantly          │
│       Inter Regular, 16px, #fff 80%      │
│                                          │
│                               by Zovo    │
└──────────────────────────────────────────┘
```

Changes:
- Reduce icon to 72x72 (from 128). The icon does not need to be hero-sized when the tile itself is small.
- Center all elements vertically and horizontally. This creates a balanced composition that reads well at any size.
- Increase headline to 28px Bold (from 24px Semibold). Bolder text reads better at reduced sizes.
- Simplify tagline. Keep it to one line that reinforces the headline.

### 3.2 Five-Word Value Prop Options for the Tile

| Option | Word Count | Focus |
|--------|------------|-------|
| "See every cookie instantly" | 4 | Speed + simplicity |
| "Manage cookies like a pro" | 5 | Competence + aspiration |
| "The modern cookie editor" | 4 | Modernity + category |
| "Cookie control for developers" | 4 | Audience + function |
| "Edit cookies without DevTools" | 4 | Pain point removal |

**Recommended:** "See every cookie instantly" -- it is the shortest, most benefit-focused, and communicates immediate value without jargon.

### 3.3 Competitor Tile Comparison

**Cookie-Editor:** Uses a green background with cookie icon and bold text. The green is distinctive in the CWS tile grid. Zovo's purple is less common than blue but more common than green.

**J2Team Cookies:** Uses a blue/teal background. The tile is text-heavy with multiple feature callouts. At reduced size, the text becomes noise.

**Zovo differentiation strategy for tiles:** Keep the tile visually simple. One icon, one headline, one tagline. Competitors clutter their tiles with feature lists, badges, and screenshots-within-tiles. Simplicity is the differentiator. When a user scans a grid of 12 extension tiles, the clean one with the most white space (relatively) catches the eye.

### 3.4 Current Tile Design Improvements

1. **Add a subtle cookie illustration element.** Below or behind the icon, add 2-3 faint cookie shapes (10% opacity white) scattered at angles. This adds visual interest without cluttering and reinforces the "cookie" theme.
2. **Add a user count badge.** If the extension has 1,000+ users, add a small badge: "1K+ users" in 10px white text at the bottom of the tile. Social proof on the tile itself increases click-through.
3. **Test a dark tile variant.** Instead of the purple gradient, test a dark background (#1A1D23) with the purple icon and white text. Dark tiles stand out dramatically against the white CWS background and signal "developer tool" immediately.

---

## 4. Video Asset Strategy

### 4.1 Video Concept: 45-Second Demo

CWS supports YouTube video embeds on extension listing pages. Video is optional but dramatically increases engagement time on the listing page, which correlates with higher install rates.

**Video parameters:**
- Length: 45 seconds (30-second minimum for substance, 60-second maximum before attention drops)
- Resolution: 1920x1080 (16:9)
- Frame rate: 30fps
- No narration (most users watch muted in CWS). All communication through text overlays and on-screen action.
- Captions: Burned-in text overlays, not YouTube captions (ensures visibility on muted playback)

### 4.2 Hook in First 3 Seconds

**Opening shot (0-3 seconds):**

Screen recording of Chrome DevTools open to the Application tab, cookies section. The user is trying to find a specific cookie among dozens of rows in the cramped DevTools interface. Text overlay appears immediately:

```
"Editing cookies in DevTools?"
(2-second hold)
"There's a better way."
(fade to Zovo Cookie Manager popup opening)
```

This hook works because:
- It shows the exact problem the target audience (developers) faces daily
- DevTools cookie editing is universally recognized as tedious
- The "better way" tease creates a 2-second curiosity gap before the solution appears

### 4.3 Storyboard Outline

| Timestamp | Visual | Text Overlay |
|-----------|--------|-------------|
| 0:00-0:03 | DevTools cookies panel, messy and hard to read | "Editing cookies in DevTools?" |
| 0:03-0:05 | Transition: DevTools closes, Zovo popup opens with a satisfying animation | "There's a better way." |
| 0:05-0:12 | Hero demo: User searches for a cookie, finds it instantly, clicks to expand, edits value, saves. All within the popup. | "Search. Edit. Save. One click." |
| 0:12-0:18 | Profiles tab: User clicks "Load" on a profile card. Cookie list updates instantly. Shows switching between "Dev" and "Staging" profiles. | "Switch environments instantly" |
| 0:18-0:24 | Rules tab: User creates an auto-delete rule for *.doubleclick.net. Toggle switches to ON. Green confirmation. | "Auto-delete tracking cookies" |
| 0:24-0:30 | Export demo: User clicks Export, selects JSON, code panel appears with formatted output. "Copied!" toast appears. | "Export as JSON or cURL" |
| 0:30-0:36 | Health tab: Camera zooms to the B+ badge. Risk cards appear below. One card is detailed, others blurred (presell). | "Know your cookie health score" |
| 0:36-0:42 | Quick montage: Dark mode toggle, filter chips, bulk delete, context menu -- each shown for 1.5 seconds | "Built for developers" |
| 0:42-0:45 | End card: Zovo Cookie Manager icon centered, "Free on Chrome Web Store" text, "Add to Chrome" button mockup | "Install free. Upgrade anytime." |

### 4.4 Production Notes

- **Screen recording tool:** Use OBS Studio or Loom to capture Chrome at 1920x1080.
- **Sample data:** Pre-populate the extension with realistic cookie data for github.com, stripe.com, and nytimes.com before recording. Use the same sample data from the screenshot specs for visual consistency.
- **Transitions:** Use simple crossfade transitions (300ms). No flashy effects. The product is the star.
- **Text overlay style:** White text (#FFFFFF) on a semi-transparent dark bar (#1A1D23 at 70% opacity) at the bottom of the frame. Inter Bold, 28px. The bar is 60px tall and spans the full width. This ensures text is readable against any background content.
- **Background music:** Optional. If used, choose a subtle lo-fi beat at low volume. Music is secondary to visual communication.

### 4.5 Hosting and Embedding

- Upload to the Zovo YouTube channel as an unlisted video.
- Add the YouTube URL to the CWS listing under "Promotional Video."
- Also embed the video on the Zovo landing page (zovo.one/tools/cookie-manager).
- Create a 15-second cut for social media (Twitter/X, LinkedIn) that shows only the hook (0:00-0:03) and the hero demo (0:05-0:12), ending with the install CTA.

---

## 5. Visual A/B Testing Plan

### 5.1 Icon Test Variants

| Test | Variant A (Control) | Variant B | Duration | Primary Metric | Minimum Sample |
|------|--------------------|-----------|---------|--------------------|----------------|
| Icon Color | Solid purple #6366f1 | Purple with warm cookie accent (#FEF3C7 cookie fill) | 14 days | Listing page CTR (impressions to detail page views) | 5,000 impressions per variant |
| Icon Border | No border | Light lavender border (#A5B4FC at 60%) | 14 days | Listing page CTR | 5,000 impressions per variant |

**Test protocol:**
- CWS does not natively support A/B testing for icons. Run tests sequentially: 2 weeks with Variant A, 2 weeks with Variant B, compare CTR.
- Control for external variables (CWS category page layout changes, seasonal traffic fluctuations) by tracking daily impression volume and normalizing CTR against it.
- Declare a winner only if the CTR difference exceeds 15% (given the inability to run simultaneous tests, a higher threshold is needed to account for temporal noise).

### 5.2 Screenshot Order Tests

| Test | Order A (Current) | Order B (Recommended) | Duration | Metric |
|------|-------------------|-----------------------|----------|--------|
| Position 2 | Profiles | Health Dashboard | 14 days | Install conversion rate (detail page views to installs) |

**Rationale:** The hero screenshot (position 1) should never change -- it is the search-result hover preview and must show the core product. Testing position 2 is the highest-leverage screenshot order test because it is the first image users see when scrolling on the listing detail page.

### 5.3 Headline Text Tests

| Test | Headline A | Headline B | Screenshot |
|------|-----------|------------|------------|
| Hero | "All Your Cookies, One Click" | "See Every Cookie Instantly" | Screenshot 1 |
| Health | "Know Your Cookie Health" | "Is This Site Tracking You?" | Screenshot 5 |
| Export | "Developer-Friendly Cookie Tools" | "Export Cookies to JSON in One Click" | Screenshot 4 |

Run headline tests on a 2-week cycle. Change one headline at a time (never test multiple headline changes simultaneously, since you cannot isolate which change drove the result).

### 5.4 Monthly Visual Refresh Schedule

| Month | Action |
|-------|--------|
| Month 1 (Launch) | Ship with current screenshots. Begin collecting impression and install data. |
| Month 2 | Run icon A/B test (Variant A vs B). Run screenshot order test (Health in position 2). |
| Month 3 | Implement icon winner. Run headline text tests on screenshots 1 and 5. |
| Month 4 | Update screenshots to reflect any UI changes from product updates. Run promotional tile test (centered layout vs current left-right layout). |
| Month 5 | Full screenshot refresh with updated sample data and any new features. Re-test screenshot order. |
| Month 6 | Review all visual assets holistically. Refresh screenshots with localized versions if international traffic exceeds 20% of total. |

**Ongoing:** Replace all screenshots within 48 hours of any major UI redesign, color palette change, or new feature launch that affects the popup appearance.

---

# PART B: Review & Social Proof Strategy

---

## 1. Review Generation System (100% Google-Safe)

### 1.1 Peak Satisfaction Moments for Cookie Manager

The review prompt system is based on identifying moments when the user has just experienced a clear win -- a task completed, a problem solved, friction removed. These moments produce the highest ratio of positive sentiment to prompt fatigue.

**Trigger 1: After First Successful Cookie Edit**

- **Detection:** Listen for the first `cookie.set()` call that modifies an existing cookie (not create -- the user must have opened an existing cookie, changed a value, and saved). Track in `chrome.storage.local` as `zovo_review_triggers.first_edit: timestamp`.
- **Timing:** Do not prompt immediately after the edit. Wait for the user to close the expanded cookie row (indicating they are done with that task). Then wait an additional 3 seconds of idle time (no clicks, no scrolls).
- **Prompt copy (Step 1):**
  - Banner at top of cookie list, 48px tall, light blue background (#EFF6FF), 8px border-radius:
  - "You just edited your first cookie. How's Cookie Manager so far?"
  - Two buttons: "It's great" (primary, #2563EB) | "Needs work" (secondary, #5F6368 text, no background)
- **If "It's great" (Step 2):**
  - Banner transforms (200ms crossfade): "Awesome! Would you mind leaving a quick rating? It really helps."
  - Single button: "Rate on Chrome Web Store" (opens `https://chromewebstore.google.com/detail/[extension-id]/reviews` in a new tab)
  - Below button: "Maybe later" link (11px, #9AA0A6, dismisses for 30 days)
- **If "Needs work":**
  - Banner transforms: "We'd love to hear how we can improve."
  - Single button: "Send Feedback" (opens a mailto: link or in-extension feedback form)
  - This routes dissatisfied users away from the CWS review page and toward private feedback channels.

**Trigger 2: After 10th Cookie Operation (Milestone)**

- **Detection:** Increment a counter in `chrome.storage.local` for every cookie view (expand), edit, create, or delete action. Fire at count = 10.
- **Timing:** Prompt at the next popup open after the 10th operation (not mid-session). The prompt appears as a toast at the top of the popup for 6 seconds before auto-dismissing.
- **Prompt copy (Step 1):**
  - "You've managed 10+ cookies with Cookie Manager. Enjoying it?"
  - "Love it" | "It's okay"
- **If "Love it" (Step 2):**
  - "Would you take 10 seconds to leave a rating? Every review helps us grow."
  - "Rate Now" button (deep-links to CWS review page)
  - "Not now" dismissal link
- **If "It's okay":**
  - Dismiss silently. Do not redirect to feedback. The user is not dissatisfied enough to file a bug but not satisfied enough to leave a positive review. Prompting further risks a lukewarm 3-star review.
- **Note:** This trigger fires only once. After it fires (regardless of response), set `zovo_review_triggers.milestone_10_shown: true`.

**Trigger 3: After First Profile Save**

- **Detection:** Listen for the first profile creation event (user clicks "Save Current as Profile" and completes the name/save flow). Track as `zovo_review_triggers.first_profile_save: timestamp`.
- **Timing:** 5 seconds after the profile card appears in the Profiles tab list (confirming the save was successful).
- **Prompt copy (Step 1):**
  - Inline card below the newly created profile card, same visual style as profile cards but with a blue left border (#2563EB):
  - "Nice -- your first profile! Cookie Manager is better with your feedback."
  - "Leave a review" | "Skip"
- **No two-step ask here.** Users who create profiles are power users with high intent. A single direct ask is appropriate. The profile creation is itself a strong signal of satisfaction (you don't save a profile in a tool you don't like).

**Trigger 4: After Successful Import/Export**

- **Detection:** Listen for a completed export (file downloaded) or import (cookies applied successfully). Track as `zovo_review_triggers.first_export: timestamp` or `zovo_review_triggers.first_import: timestamp`.
- **Timing:** Immediately after the "Export complete" or "Import complete" success toast appears (3-second delay to avoid stacking notifications).
- **Prompt copy (Step 1):**
  - Below the success toast, smaller secondary toast (36px, light green background #F0FDF4):
  - "Export worked? Help others find Cookie Manager -- leave a review."
  - "Rate on Chrome Web Store" link (inline, not a button -- less aggressive than a button CTA)
  - "Dismiss" link (11px, #9AA0A6)

### 1.2 Smart Timing Rules

| Rule | Implementation |
|------|---------------|
| Delay until 3+ value moments | Maintain a `value_moments` counter in `chrome.storage.local`. Increment on: cookie edit, profile save, export, import, rule creation, health score view. No review prompt fires until `value_moments >= 3`. |
| Two-step ask for Triggers 1 and 2 | First ask gauges sentiment. Only route positive respondents to CWS. Negative respondents go to private feedback. This filters out potential negative reviews. |
| Deep-link to CWS review page | URL format: `https://chromewebstore.google.com/detail/[extension-id]/reviews`. Opens in new tab (`chrome.tabs.create`). |
| Never show during first session | All triggers include guard: `if (session_count < 2) return`. Session count increments on each popup open (already tracked per the premium UX spec). |
| Max 1 prompt per 30 days | After any review prompt is shown (regardless of user response), set `zovo_review_triggers.last_prompt_shown: Date.now()`. Before showing any new prompt, check: `if (Date.now() - last_prompt_shown < 30 * 24 * 60 * 60 * 1000) return`. |
| Don't show to users who already rated | After the user clicks "Rate on Chrome Web Store" (regardless of whether they actually submitted a review -- we cannot track that), set `zovo_review_triggers.assumed_rated: true`. Suppress all future review prompts permanently. |
| Don't show during active cookie edit | Check for `.cookie-edit-form` in the DOM before rendering any review prompt. If present, queue the prompt for after form close (same guard used by the paywall system). |
| Priority order | If multiple triggers are eligible simultaneously, fire only the highest-priority one: Trigger 3 (profile save) > Trigger 4 (export/import) > Trigger 1 (first edit) > Trigger 2 (milestone). Higher-priority triggers indicate deeper engagement and produce better reviews. |

### 1.3 Implementation: Review Prompt Manager

```typescript
interface ReviewTriggerState {
  value_moments: number;
  session_count: number;  // shared with paywall system
  first_edit_shown: boolean;
  milestone_10_shown: boolean;
  first_profile_shown: boolean;
  first_export_shown: boolean;
  last_prompt_shown: number;  // timestamp
  assumed_rated: boolean;
}

// Check before showing any review prompt
function canShowReviewPrompt(state: ReviewTriggerState): boolean {
  if (state.assumed_rated) return false;
  if (state.session_count < 2) return false;
  if (state.value_moments < 3) return false;
  if (Date.now() - state.last_prompt_shown < 30 * 24 * 60 * 60 * 1000) return false;
  if (document.querySelector('.cookie-edit-form')) return false;
  return true;
}
```

---

## 2. Review Response Protocol

### 2.1 Template Library for Common Cookie Manager Issues

**Issue: "Can't edit HttpOnly cookies"**

```
Hi [reviewer name], thanks for the feedback!

HttpOnly cookies are protected by the browser for security reasons —
Chrome's extension API (chrome.cookies) intentionally prevents modification
of the HttpOnly flag itself, though you can still read and delete these cookies.

This is a browser-level security measure, not a limitation of Cookie Manager.
We display HttpOnly cookies clearly with a blue "HttpOnly" badge so you always
know which ones have this restriction.

If you need to test with modified HttpOnly cookies, the recommended approach
is to set them from your server/backend directly.

Thanks for using Cookie Manager!
— Zovo Team
```

**Issue: "Doesn't work on Chrome internal pages"**

```
Hi [reviewer name], thanks for reaching out!

Chrome extensions cannot access cookies on internal pages like
chrome://settings, chrome://extensions, or chrome-extension:// URLs.
This is a Chrome security restriction that applies to all extensions,
not just Cookie Manager.

Cookie Manager works on all regular websites (http:// and https:// URLs).
If you're testing on localhost, make sure you're accessing it via
http://localhost:PORT rather than a chrome:// URL.

Hope that helps! Let us know if you run into any issues on regular sites.
— Zovo Team
```

**Issue: "Import failed"**

```
Hi [reviewer name], sorry about the trouble!

Import failures usually happen for one of these reasons:

1. The JSON file format doesn't match Cookie Manager's expected structure.
   Try exporting a cookie first to see the correct format, then match your
   import file to that structure.

2. The cookies in the file target a different domain than the active tab.
   Make sure you're on the correct website before importing.

3. The file contains cookies with invalid fields (e.g., expiration dates
   in the past, or missing required fields like "name" and "value").

If none of these apply, could you email us at support@zovo.one with the
file (remove any sensitive values first)? We'll diagnose it and fix any
bugs in the next update.

Thanks for your patience!
— Zovo Team
```

**Issue: "Too many permissions"**

```
Hi [reviewer name], great question — we take permissions seriously.

Here's exactly what each permission does and why we need it:

• "cookies" — Core functionality. Read, write, and delete cookies.
  Without this, the extension can't function at all.

• "activeTab" — Scopes cookie operations to your current tab only.
  We chose this over "all URLs" specifically to limit our access.

• "storage" — Saves your settings, profiles, and rules locally on
  your device. No data is sent to any server.

• "tabs" — Detects when you close a tab so auto-delete rules can
  trigger. Also used to show the current domain in the header.

• "alarms" — Schedules timed auto-delete rules (e.g., "delete after
  1 hour"). Runs in the background service worker.

We don't use "<all_urls>", "webRequest", or any network-intercepting
permissions. Your browsing data stays on your device.

The full source is available for review. Thanks for caring about privacy!
— Zovo Team
```

**Generic Positive Response Template**

```
Thank you so much, [reviewer name]! Really glad Cookie Manager is
helping with your workflow. If you ever have feature requests or ideas,
we're all ears — support@zovo.one or the feedback form in Settings.

Happy debugging!
— Zovo Team
```

**Generic Negative Response Template**

```
Hi [reviewer name], sorry to hear about your experience. We'd like to
make it right.

Could you share more details about what went wrong? You can reach us at
support@zovo.one or through the feedback form in the extension's Settings
tab. We respond to all messages within 24 hours.

We take every review seriously and use your feedback to improve the
extension. Thanks for giving us a chance to fix this.
— Zovo Team
```

### 2.2 Response Tone Guidelines

- **Helpful:** Provide specific, actionable solutions. Never say "sorry, we can't do that" without explaining why and offering an alternative.
- **Technical but accessible:** Use developer terminology when appropriate (the audience is developers) but explain browser security concepts that may not be obvious.
- **Not defensive:** Never argue with a reviewer. If they describe a bug that is actually expected browser behavior, explain the behavior without implying the user is wrong. Frame it as "here's how Chrome handles this" not "you're mistaken."
- **Brief:** Keep responses under 150 words. Reviewers (and future visitors reading reviews) will not read walls of text.
- **Personal:** Use "we" not "the team" or "Zovo." Sign off with "-- Zovo Team" for brand consistency.

### 2.3 Response Time Targets

| Review Type | Response Target | Escalation |
|-------------|----------------|------------|
| 1-star review | < 4 hours during business hours, < 12 hours overnight | Immediate investigation. Check if the issue is reproducible. If it's a real bug, hot-fix within 24 hours and reply to the review with the fix. |
| 2-star review | < 12 hours | Same investigation as 1-star. These are often fixable issues. |
| 3-star review | < 24 hours | Usually "it's fine but..." reviews. Respond with gratitude and ask what would make it 5 stars. |
| 4-star review | < 48 hours | Thank the reviewer. Ask if there's one thing they'd improve. |
| 5-star review | < 48 hours | Thank the reviewer. Mention an upcoming feature that aligns with their use case if applicable. |

**Monitoring cadence:** Check CWS developer dashboard for new reviews at 9 AM, 1 PM, and 6 PM daily (local time). Set up email notifications for new reviews through the Chrome Developer Dashboard settings.

---

## 3. Social Proof Amplification

### 3.1 User Count Display Strategy

**Threshold-based display:**

| User Count | Display Format | Placement |
|------------|---------------|-----------|
| < 100 | Do not display | -- |
| 100-999 | "Trusted by 100+ developers" | Settings > Account section only |
| 1,000-4,999 | "Join 1,000+ developers" | Upgrade modals, Settings, CWS description |
| 5,000-9,999 | "Join 5,000+ developers" | Upgrade modals, Settings, CWS description, promotional tile |
| 10,000-49,999 | "Join 10K+ developers" | All surfaces including in-extension header badge |
| 50,000+ | "Join 50K+ developers" | All surfaces, prominently featured |

**Why "developers" not "users":** The target audience is developers and QA engineers. Using "developers" in the count creates an identity-based social proof signal: "people like me use this." Generic "users" dilutes the signal.

**Implementation:**
- Store user count in `chrome.storage.sync` as `zovo_social_proof.user_count` and `zovo_social_proof.user_count_updated_at`.
- Update during the 24-hour license validation check by querying the Zovo API endpoint for current install count.
- Round down to the nearest meaningful threshold (100, 500, 1K, 5K, 10K, etc.) to avoid appearing fabricated.
- Cache locally for 7 days. If the API is unreachable, display the last known count.

### 3.2 Review Snippet Selection for Marketing

**Criteria for selecting review snippets:**
1. Must be a verified CWS review (no fabricated quotes).
2. Must mention a specific feature or benefit (not just "great extension").
3. Must be from a reviewer whose display name or profile suggests the target audience (developer, QA, etc.).
4. Must be 4-star or 5-star.
5. Prefer reviews that mention unique features (profiles, health score, auto-delete rules) over generic cookie management.

**Snippet usage locations:**
- Upgrade modals (rotate 1 snippet per session, already specified in premium UX doc)
- CWS detailed description (add a "What Users Say" section at the bottom)
- Zovo landing page (zovo.one/tools/cookie-manager)
- Social media posts when sharing updates
- Blog post headers or sidebars

**Snippet formatting:**
```
"Profiles alone save me 20 minutes a day switching between client sites."
— Web Developer, 5-star review
```

Always include the role/title (from their review or profile) and star rating. Never use a real name without explicit permission -- use role/title attribution instead.

### 3.3 In-Extension Social Proof Placement

**Location 1: Upgrade modals**
- Already specified in the premium UX doc: "Joined by 3,300+ Zovo members" in 11px text below the CTA.
- Enhancement: When the extension-specific user count exceeds 1,000, switch to "Rated [X.X] by [count]+ developers" to add rating social proof alongside user count.

**Location 2: Health tab header**
- For free users, below the Health tab label: "Popular with Pro members" (already specified in premium UX doc).
- Enhancement: After the extension reaches 4.5+ stars, change to: "Rated 4.5+ by developers" to add rating credibility.

**Location 3: Post-export success state**
- After a successful export, add a small text below the success toast: "Cookie Manager is used by [X]+ developers worldwide." This reinforces the choice to use the extension at a moment of satisfaction.

**Location 4: Settings > Account section**
- In the plan comparison card, add a footer line: "Trusted by [X]+ developers. Rated [X.X] stars."

### 3.4 Social Proof in Upgrade Prompts

The premium UX doc specifies testimonial rotation in hard block modals. Here is the enhanced strategy:

**Level 1 social proof (user count < 1,000):**
- Show only the Zovo membership count ("Joined by 3,300+ Zovo members") since this is a portfolio-level number.
- Do not show extension-specific user counts until they are large enough to be impressive.

**Level 2 social proof (user count 1,000-4,999):**
- Show: "Join 1,000+ developers using Cookie Manager"
- Show: One rotating testimonial (role-attributed, not name-attributed)

**Level 3 social proof (user count 5,000+ and rating 4.5+):**
- Show: "Join 5,000+ developers. Rated 4.5 stars."
- Show: Two testimonials visible (one above CTA, one below)
- Show: Star rating visualization (5 stars with 4.5 filled) as a graphical element in the upgrade modal header

---

## 4. Rating Recovery Tactics

### 4.1 Bad Update Detection

**Monitoring triggers:**

| Signal | Threshold | Action |
|--------|-----------|--------|
| Rating drop | > 0.1 points within 7 days | Immediate investigation |
| Negative review spike | 3+ negative reviews (1-2 star) within 48 hours | Emergency response protocol |
| Uninstall rate spike | Daily uninstall rate doubles vs 7-day average | Check most recent update for regressions |
| Support email spike | 5+ emails about the same issue within 24 hours | Likely a bug introduced in the latest update |

**Detection implementation:**
- Check CWS developer dashboard daily at 9 AM.
- Track rating in a local spreadsheet: date, overall rating, new reviews (count by star level), uninstall count.
- Calculate 7-day rolling average rating. If today's average is 0.1+ below last week's average, trigger investigation.

### 4.2 Rapid Response Protocol

**When a rating drop is detected:**

1. **Hour 0-2: Identify the cause.**
   - Read all new negative reviews from the past 48 hours. Categorize issues.
   - Check if a new version was published recently. Compare timing.
   - Test the latest version on a clean Chrome profile. Reproduce reported bugs.

2. **Hour 2-6: Respond to every negative review.**
   - Use the templates from Section 2.1, customized to each specific issue.
   - If the issue is a confirmed bug, acknowledge it explicitly: "We've confirmed this bug and a fix is on the way."
   - If the issue is expected behavior, explain clearly and offer alternatives.

3. **Hour 6-24: Ship a fix (if applicable).**
   - For confirmed bugs introduced in the latest update, push a hotfix to CWS.
   - CWS review typically takes 1-3 days, so submit as soon as possible.
   - In the meantime, pin a note in the extension's CWS description: "Known issue with [X] in version [Y]. Fix submitted -- update rolling out shortly."

4. **Day 2-7: Follow up.**
   - After the fix is published, reply to every negative reviewer who reported the bug: "We've pushed a fix in version [Z]. Please update and let us know if this resolves your issue. We'd love a chance to earn back your stars."
   - This is the single most effective rating recovery tactic: responding to a negative review with a confirmed fix, then asking the reviewer to reconsider their rating. Approximately 20-30% of reviewers will update their rating after a fix.

### 4.3 Re-Engagement for Churned Users Who Left Negative Reviews

**Strategy: Fix, notify, request re-evaluation.**

When a user leaves a negative review citing a specific bug:

1. Fix the bug.
2. Reply to the review with the fix details (see protocol above).
3. If the reviewer's email is available through the developer dashboard or support correspondence, send a personal email:

```
Subject: We fixed the issue you reported in Cookie Manager

Hi,

You left a review mentioning [specific issue]. We've pushed a fix in
version [X.Y.Z] that addresses this.

We'd really appreciate it if you could give Cookie Manager another try
and update your review if the fix works for you.

Thanks for helping us improve,
— Zovo Team
```

**Important constraints:**
- Never incentivize a review update (violates CWS policy).
- Never ask the reviewer to delete their review. Only ask them to "update" it if the fix resolves their issue.
- Only send one follow-up email per reviewer per issue. Never re-contact.

### 4.4 Rating Health Monitoring Cadence

| Frequency | Action |
|-----------|--------|
| Daily (9 AM) | Check CWS dashboard for new reviews. Respond to any 1-2 star reviews immediately. Note overall rating. |
| Weekly (Monday) | Calculate 7-day average rating. Compare to previous week. Review uninstall rate trend. Identify any patterns in negative feedback. |
| Bi-weekly | Aggregate review themes. Create a "top 3 complaints" list. Prioritize product fixes based on complaint frequency. |
| Monthly | Full rating health report: average rating, review velocity (new reviews per week), sentiment distribution (% positive vs negative), comparison to competitor ratings. |
| After every update | Monitor reviews for 72 hours post-publish with increased frequency (check 3x daily instead of 1x). Most update-related complaints surface within 48 hours. |

### 4.5 Proactive Rating Protection

**Pre-update testing checklist to prevent rating drops:**

1. Test every core workflow (view, edit, create, delete, search, filter, export, import, profile save/load, rule create/toggle) on a clean Chrome profile before submitting to CWS.
2. Test on the three most recent Chrome stable versions.
3. Test with 0 cookies (empty state), 1 cookie, 25 cookies (free export limit), and 100+ cookies (performance edge case).
4. Test light mode and dark mode.
5. Test with the extension disabled and re-enabled (ensure storage persistence).
6. If the update touches paywall logic, test the full upgrade flow (trigger -> modal -> dismiss -> re-trigger) to ensure no regressions in the free tier experience.

**Version rollout strategy:**
- For minor updates (copy changes, small UI tweaks): Publish to 100% immediately.
- For major updates (new features, architectural changes): Use CWS staged rollout if available, starting at 10% for 24 hours, then 50% for 24 hours, then 100%. Monitor reviews at each stage.

---

## Appendix: Review Prompt Visual Specifications

### Review Prompt Banner (used by Triggers 1, 2, 4)

```
CONTAINER:
  Position: Top of cookie list, below search/filter area
  Width: Full width minus 12px horizontal padding
  Height: 48px (Step 1), 56px (Step 2)
  Background: #EFF6FF (light blue, signaling informational -- not an error or warning)
  Border: 1px solid #BFDBFE
  Border-radius: 8px
  Margin-bottom: 8px

TEXT:
  Prompt text: 13px/500 Inter, #1E40AF (dark blue)

BUTTONS:
  Primary: 12px/500 Inter, #FFFFFF on #2563EB, 28px height, 8px horizontal padding, 6px border-radius
  Secondary: 12px/400 Inter, #5F6368, no background, 28px height
  Button spacing: 8px between buttons
  Buttons right-aligned within the banner

DISMISSAL:
  "Maybe later" / "Skip" / "Dismiss" link: 11px/400 Inter, #9AA0A6
  Position: Below the banner, right-aligned, 4px margin-top

ANIMATION:
  Entrance: Slide down from 0 height to full height, 250ms ease-out
  Exit (dismiss): Fade out over 200ms
  Step 1 to Step 2 transition: Crossfade content, 200ms
```

### Review Prompt Inline Card (used by Trigger 3 -- Profile Save)

```
CONTAINER:
  Position: Below the newly created profile card
  Width: Full width minus 12px horizontal padding
  Height: 64px
  Background: #FFFFFF
  Border: 1px solid #E0E2E6
  Left border: 3px solid #2563EB (blue accent, matching the "Save" button color)
  Border-radius: 8px
  Shadow: 0 1px 2px rgba(0, 0, 0, 0.05)
  Margin-top: 8px

TEXT:
  Line 1: 13px/500 Inter, #1A1D23 -- "Nice -- your first profile!"
  Line 2: 12px/400 Inter, #5F6368 -- "Cookie Manager is better with your feedback."

BUTTON:
  "Leave a review": 12px/500 Inter, #2563EB, no background, underline on hover
  Position: Right-aligned, vertically centered within card
  "Skip": 11px/400 Inter, #9AA0A6, no background
  Position: Below "Leave a review", right-aligned
```

---

*Strategy generated for Phase 07 (ASO & Conversion Strategy), Agent 2. All tactics are Google-safe, specific to Cookie Manager, and ready for implementation. Total coverage: icon optimization with 3 A/B test variants, 5-screenshot conversion analysis with improved ordering, promotional tile redesign, video storyboard, review generation system with 4 triggers, response template library, social proof amplification strategy, and rating recovery protocol.*
