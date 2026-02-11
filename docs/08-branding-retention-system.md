# 08 - Branding & Retention System: Zovo Cookie Manager

## Phase 08 Complete | Generated 2026-02-11

---

## Overview

Five specialist agents produced a complete branding, onboarding, retention, and cross-promotion system for the Zovo Cookie Manager Chrome extension. This phase covers the icon and asset design system for all 16 Zovo extensions, a shared CSS design system with Preact component library, a 4-slide first-run onboarding experience, a local-only retention and engagement engine with smart rating requests and churn prevention, and a cross-extension promotion system with contextual recommendation toasts, a slide-out panel, and ref-tracked links. Together, these documents establish Zovo as a recognizable brand across the Chrome toolbar, build trust from the first install, keep users engaged through milestones and smart prompts, and drive cross-installs and membership signups across the full 16-extension portfolio.

**Total output:** 11,132 lines across 5 specialist documents covering icon design, global styles, onboarding flows, retention mechanics, and cross-promotion infrastructure.

---

## Agent Summary

### Agent 1: Icon & Asset System (1,448 lines)

**Key deliverables:**
- **Master icon template system** defining the unified Zovo icon language: rounded square (squircle) background, linear gradient from #6366f1 to #4f46e5 at 135 degrees, white foreground symbol centered in a 55-65% safe area, with 6 consistency rules enforced across all 16 extensions
- **Size-specific guidelines for 4 sizes** with technical constraints per size: 16px (solid fill, no gradient, max 3-4 shapes, pixel-grid aligned), 32px (gradient, 3-5 shapes, sub-pixel AA acceptable), 48px (full detail, crumbs), 128px (maximum detail with crumbs, surface texture, bite-edge irregularities, optional highlight)
- **Detailed Cookie Manager icon specification** with pixel grid maps at 16x16, exact coordinates for cookie circle, bite arc, and chocolate chip dot placements at all 4 sizes, and a complete SVG source structure with 5 layers (background, cookie-body, chip-dots, crumbs, texture)
- **All 16 Zovo extension icon designs** -- each with symbol description, detailed rendering notes per size, and AI generation prompts: Tab Suspender Pro (moon+Zs), Clipboard History (layered clipboard), JSON Formatter Pro (curly braces), Screenshot Annotate (viewfinder), Form Filler Pro (checkbox list), Web Scraper Lite (download arrow+brackets), Quick Notes (note with fold), Base64 Encoder (01+arrows), QR Generator (QR grid), Timestamp Converter (clock face), Color Palette (Venn circles), Word Counter (hashtag), Unit Converter (bidirectional arrows), Bookmark Search (bookmark+magnifier), Lorem Ipsum (text lines)
- **Icon quality checklist** -- 42 items across recognizability (6), technical quality (10), brand compliance (10), platform testing (7), consistency (4), and 5 Cookie Manager-specific checks
- **3 promo asset specifications** -- marquee tile (1400x560) with two-column layout and popup mockup, small tile (440x280) with centered vertical stack, large tile (920x680) with hero and 3 feature cards -- all with exact element positions, typography specs, and copy options
- **AI generation prompts** for Midjourney/DALL-E with primary, simplified, and manual recreation variants
- **3 icon A/B test variants** from Phase 07 integration: control (white on purple), warm accent (#FEF3C7 cookie), and edge outline (lavender stroke)

### Agent 2: Global Styles & Components (3,151 lines)

**Key deliverables:**
- **Complete `zovo-brand.css` stylesheet** (~1,900 lines of CSS) serving as the single source of truth for all Zovo Chrome extensions, with WCAG AA compliance throughout (4.5:1+ body text, 3:1+ large text/UI)
- **85+ CSS custom properties** (design tokens) organized in 8 categories: primary palette (with Cookie Manager-specific `--cm-brand` blue), secondary/accent, semantic colors (success/warning/error/info with light tints and background variants), backgrounds (3-tier), text (4-tier + inverse), borders, and a Pro accent palette (`--zovo-pro` purple, `--zovo-pro-gold` amber)
- **Full dark mode system** via both `prefers-color-scheme: dark` media query and `[data-theme="dark"]` attribute selector, with 25+ token overrides and dark-aware adjustments for primary, secondary, accent, semantic, background, text, and border tokens
- **Complete component CSS** for all Cookie Manager UI elements: header (56px fixed with brand logo, title, domain, cookie count, Pro badge), tab bar (4-tab with animated slide indicator), buttons (primary, secondary, ghost, danger in sm/md/lg/block), inputs (text, search with icon, select), cards (base, hover, expandable cookie row with two-line layout and security flag pills), modals (overlay + centered dialog with header/body/footer), toasts (4 semantic types with slide-in animation), tooltips, scroll container, empty states, skeleton loading, and blur overlay
- **Cookie Manager-specific components** -- cookie flag pills (Secure, HttpOnly, SameSite with color coding), profile cards, rule cards, health score badge (A-F with color gradients), health score cards, usage counters (with limit bars), Pro lock icons (14x14 crown SVG), Pro badges (pill and inline), paywall blur treatment, and a post-upgrade confetti animation
- **7 Preact component templates** (JSX + props interfaces): `<Header>`, `<Footer>`, `<TabBar>`, `<Button>`, `<Card>`, `<Modal>`, `<Toast>` -- each with complete CSS class mappings and extensionId-aware branding
- **Design token summary table** with 88 tokens across colors (26), typography (16), spacing (7), border radius (6), shadows (4), transitions (4), layout dimensions (8), and z-index scale (6)
- **Implementation notes** with file organization and integration guidance

### Agent 3: Onboarding System (1,668 lines)

**Key deliverables:**
- **4-slide onboarding flow** triggered on first install via `chrome.runtime.onInstalled`, designed to complete in under 30 seconds (fewer than 40 words per slide), with a "Skip tour" link on every slide that sets `onboardingComplete: true` without any penalty
- **Slide content specification:** (1) Welcome with 128px icon, brand intro, trust badges ("No tracking / No data collection / Open source"); (2) Cookie Management feature overview with stylized SVG illustration; (3) Profiles and Rules with tier note ("Free: 2 profiles, 1 rule | Pro: Unlimited"); (4) Get Started with "Start Using Cookie Manager" primary CTA and "Explore Zovo -- Get All Extensions" secondary CTA with ref tracking
- **Complete onboarding HTML** (~220 lines) with semantic structure, ARIA roles (progressbar, navigation), keyboard navigation (arrow keys, Enter, Escape), and focus management
- **Complete `ZovoOnboarding` JavaScript class** (~300 lines) with slide navigation, dot indicators, progress bar animation, keyboard shortcuts, skip behavior, completion tracking (`onboardingComplete`, `onboardingCompletedAt` in `chrome.storage.local`), and local-only analytics events (`onboarding_started`, `onboarding_slide_viewed`, `onboarding_completed`, `onboarding_skipped`, `onboarding_zovo_cta_clicked`)
- **Service worker integration** (`onboarding-handler.js`) with `chrome.runtime.onInstalled` listener for both install (onboarding tab) and update (What's New page on major version increment) events, including `installedAt` timestamp and `installSource` tracking
- **"What's New" page** for major version updates -- complete HTML, JavaScript (`WhatsNew` class), and CSS for a single-page changelog view with versioned changelog entries, "What's New" badges, and a "Got it" dismiss button
- **Complete onboarding CSS** (~580 lines) covering layout, slides, progress bar, navigation, trust badges, feature illustration, Pro features list, CTA groups, skip button, animations (fade + slide transitions), responsive layout, and full dark mode support
- **7 analytics events** defined with properties for onboarding flow tracking
- **Manifest entries** for storage, tabs permissions, and keyboard shortcut (`Ctrl+Shift+K` / `Cmd+Shift+K`)
- **Phase 04 integration notes** documenting coexistence with in-popup first-run (Phase 04 Agent 1), paywall suppression during onboarding (Phase 04 Agent 5 `session_count >= 2` rule), and engagement prerequisite alignment

### Agent 4: Retention & Engagement System (2,565 lines)

**Key deliverables:**
- **`ZovoAnalytics` class** (production-ready TypeScript, ~260 lines) -- local-only usage analytics with a 500-event ring buffer in `chrome.storage.local`, automatic 30-minute session detection, feature usage aggregation across 13 feature keys (`cookies_edited`, `profiles_created`, `rules_triggered`, `exports_done`, etc.), and `getUsageStats()` / `getDaysSinceInstall()` / `getFeatureUsageCounts()` methods -- zero external network requests
- **`ZovoRetention` prompt system** (TypeScript, ~350 lines) with 5 prompt types: rate extension (after 10+ uses, day 3+), join Zovo (day 5+), upgrade Pro (free limit hit), share extension (day 7+, 15+ uses), and try another Zovo tool (day 10+, 20+ uses) -- each with configurable trigger conditions, dismissal tracking, 48-hour cooldown between prompts, max 1 prompt per session, and strict anti-pattern compliance (no first-session prompts, no interrupting active edits)
- **`ZovoRatingManager` class** (TypeScript, ~300 lines) implementing the Phase 07 two-step satisfaction flow: 4 trigger moments (10th cookie edit, first auto-delete rule fire, first profile save/load, 7th day of active use), satisfaction gate ("Enjoying Cookie Manager?"), CWS review page deep link for satisfied users, optional feedback form for dissatisfied users, with "never show again" after rating or 2 dismissals
- **Rating prompt UI** as a Preact `<RatingFlow>` component with 3 states (initial question, positive confirmation with CWS link, negative feedback form), complete CSS with gradient background, dark mode, and slide-in animation
- **Retention prompt UI** as a Preact `<RetentionPrompt>` component with dismiss button, gradient background banner, CTA button, and auto-integration with the prompt evaluation engine
- **`ZovoMilestones` engagement system** (TypeScript, ~200 lines) with 8 milestones: First Cookie Edit (1), Cookie Explorer (25 viewed), Profile Creator (1 created), Rule Master (1 rule triggered), Export Pro (5 exports), Power User (100 total cookie ops), Search Expert (50 searches), 7-Day Streak -- each shown as a one-time celebration toast with icon, label, and confetti-style accent
- **Milestone toast UI** as a Preact `<MilestoneToast>` component with star icon, slide-up animation, 5-second auto-dismiss
- **Churn prevention system** -- `chrome.alarms`-based inactivity detection (checks every 4 hours), 7-day inactivity notification via `chrome.notifications`, 14-day re-engagement eligibility flag for backend email triggers, 30-day churn flag, and `chrome.runtime.setUninstallURL()` for exit survey
- **Complete storage schema** -- 16 storage keys totaling ~55KB at maximum capacity, all in `chrome.storage.local`
- **18-step integration checklist** mapping every handler in Cookie Manager (edit, create, delete, view, profile, rule, export, import, search, tab switch, health, paywall, upgrade, shortcut) to the correct analytics and retention calls

### Agent 5: Cross-Extension Promotion System (2,300 lines)

**Key deliverables:**
- **"More from Zovo" slide-out panel** -- complete HTML, CSS, and TypeScript controller for a 320px panel that slides in from the right when triggered by a "More tools" link in the popup footer. Panel contains: (1) Zovo membership CTA at top with tier pricing ($4/$7/$14) and "Join Zovo -- Save 84%" button, (2) up to 3 recommended extension cards filtered by installed status, and (3) "See all 16 extensions" link to zovo.one/tools. Panel includes backdrop overlay, close button, Escape key dismissal, and full dark mode support
- **Complete Zovo extension catalog** (`catalog.ts`, all 16 extensions) with TypeScript interface `ZovoExtension` defining id, name, tagline, iconUrl, storeUrl, category (`developer` | `productivity` | `utility`), featured flag, and relatedTo array. Each extension has carefully authored taglines and hand-curated relatedTo mappings based on user workflow overlap
- **Smart recommendations engine** (`recommendations.ts`) with installed-extension detection via `chrome.management` API (optional permission, graceful degradation), relevance scoring algorithm (mutual relatedTo +3/+3, featured +2, same category +1, day-of-year rotation factor +0-0.5), and `getRecommendations()` function returning filtered, sorted results. Relevance matrix documented for Cookie Manager showing JSON Formatter Pro, Web Scraper Lite, and Tab Suspender Pro as top 3 defaults
- **Enhanced footer branding component** -- "Built by Zovo" link with 14px logomark, dynamic user count ("Join 3,300+ users" with `chrome.storage.sync` override for live data), and "More tools" trigger button. Complete CSS with dark mode for both `prefers-color-scheme` and `[data-theme="dark"]` selectors
- **Smart contextual recommendation toast** -- appears after specific Cookie Manager actions (JSON export -> JSON Formatter Pro, multi-tab management -> Tab Suspender Pro, heavy search -> Bookmark Search, copy value -> Clipboard History, expired cookie -> Timestamp Converter, cURL export -> Web Scraper Lite) with 10% probability and max once per 24 hours. Slides up from bottom of popup, shows extension icon + name + tagline + "Add to Chrome" button, auto-dismisses after 8 seconds. Complete HTML, CSS (with slide-up/slide-down animations), and TypeScript controller
- **Ref tracking system** -- `buildRefUrl()` function generating `?ref=[EXTENSION_ID]&source=[SOURCE]` parameters for all links, 8 source types defined (footer, onboarding, retention_prompt, settings, recommendation, upgrade, more_panel, toast), local-only click logging in `chrome.storage.local` with 200-event ring buffer, `getClickSummary()` analytics function, and a complete mapping of all 11 UI touchpoints to their correct ref-tracked URLs
- **"You Might Also Like" settings section** -- card grid layout showing 3 recommended extensions with icon (40x40), name, category, tagline, and "Add to Chrome" CTA. Hides entirely if no recommendations available. Complete HTML, CSS (responsive 3-column grid collapsing to 1-column), and TypeScript controller with full dark mode
- **Main initialization module** (`cross-promotion.ts`) wiring panel, footer, and toast together for popup, plus separate settings page integration

---

## Key Artifacts Produced

| Artifact | Purpose | Used When |
|----------|---------|-----------|
| Master icon template (16/32/48/128 + SVG) | Unified Zovo visual identity across toolbar | Icon creation for all 16 extensions |
| Cookie Manager icon spec (4 sizes + pixel grids) | Primary extension icon | Asset creation |
| 16 extension icon designs with AI prompts | Portfolio visual consistency | Icon creation per extension |
| Icon quality checklist (42 items) | QA gate for all icons | Before shipping icons |
| 3 promo tile specs (440x280, 920x680, 1400x560) | CWS store listing visuals | Store submission |
| `zovo-brand.css` (85+ tokens, full dark mode) | Shared design system | All extension UI development |
| 7 Preact component templates | UI component library | Extension development |
| Design token reference table (88 tokens) | Developer quick-reference | During CSS/component work |
| 4-slide onboarding HTML/JS/CSS | First-run user experience | On extension install |
| "What's New" page HTML/JS/CSS | Major version update announcements | On major version update |
| Service worker onboarding handler | Install/update detection | Background script |
| `ZovoAnalytics` class (500-event ring buffer) | Local usage tracking | All user actions |
| `ZovoRetention` prompt system (5 prompt types) | User engagement and conversion | After usage thresholds |
| `ZovoRatingManager` (2-step satisfaction flow) | CWS rating growth | After 4 trigger moments |
| `ZovoMilestones` system (8 milestones) | User engagement celebration | On milestone achievement |
| Churn prevention system (alarms + notifications) | Reduce inactivity and churn | Background monitoring |
| Extension catalog (`catalog.ts`, 16 extensions) | Cross-promotion data source | Panel, toast, settings |
| Smart recommendations engine | Personalized extension suggestions | Panel, toast, settings |
| "More from Zovo" slide-out panel | Cross-install and membership CTA | User-triggered from footer |
| Contextual recommendation toast (6 triggers) | Context-aware cross-promotion | After specific user actions |
| Enhanced footer with brand + "More tools" | Persistent brand presence + panel trigger | Every popup open |
| Ref tracking module (8 source types) | Attribution for all Zovo links | Every outbound link |
| "You Might Also Like" settings section | Cross-promotion in settings page | Settings page load |
| Retention prompt Preact component | Prompt rendering | Popup open with active prompt |
| Rating flow Preact component (3 states) | Rating request UI | After trigger moments |
| Milestone toast Preact component | Celebration rendering | On milestone achievement |

---

## Detailed Documents

| Agent | File | Lines | Focus |
|-------|------|-------|-------|
| 1 | [agent1-icon-asset-system.md](branding-retention/agent1-icon-asset-system.md) | 1,448 | Master icon template, Cookie Manager icon at 4 sizes with pixel grids, all 16 extension icons with AI prompts, 3 promo tile specs, quality checklists |
| 2 | [agent2-global-styles.md](branding-retention/agent2-global-styles.md) | 3,151 | Complete `zovo-brand.css` with 85+ tokens, full dark mode, Cookie Manager components, 7 Preact templates, design token reference tables |
| 3 | [agent3-onboarding-system.md](branding-retention/agent3-onboarding-system.md) | 1,668 | 4-slide onboarding flow, complete HTML/JS/CSS, "What's New" page, service worker integration, 7 analytics events, Phase 04 alignment |
| 4 | [agent4-retention-system.md](branding-retention/agent4-retention-system.md) | 2,565 | Local analytics (500-event ring buffer), 5 retention prompts, smart rating flow (4 triggers), 8 engagement milestones, churn prevention (alarms + notifications), 18-step integration checklist |
| 5 | [agent5-cross-promotion.md](branding-retention/agent5-cross-promotion.md) | 2,300 | "More from Zovo" panel, 16-extension catalog, smart recommendations engine, enhanced footer, contextual toast (6 triggers), ref tracking (8 sources), settings "You Might Also Like" section |

---

*Branding and retention system produced by 5 specialist agents. 11,132 lines of implementation-ready documentation: unified icon system for 16 extensions with pixel grids and AI prompts, 85+ CSS design tokens with full dark mode, 4-slide onboarding flow, 500-event local analytics engine, 5 retention prompts with 48-hour cooldowns, 2-step smart rating flow, 8 engagement milestones, churn prevention via chrome.alarms, cross-promotion panel with 16-extension catalog and contextual recommendation toasts, ref-tracked links across 8 source types, and Preact component templates for the complete UI. Built on Phase 01-07 research, specifications, deployment systems, QA protocols, store assets, and conversion strategy.*
