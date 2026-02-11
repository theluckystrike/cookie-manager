# 06 - Store Assets: Zovo Cookie Manager

## Phase 06 Complete | Generated 2026-02-11

---

## Overview

Five specialist agents produced all Chrome Web Store publishing assets for the Zovo Cookie Manager extension. This phase covers store listing copy, privacy section content, screenshot design specifications, icon and promotional image specifications, and a comprehensive publishing checklist. Together, these documents provide everything needed to submit the extension to the Chrome Web Store -- from the description text to pixel-level visual specs to the final pre-submission verification list.

**Total output:** 2,646 lines across 5 documents covering store listing copy, privacy declarations, screenshot specs, icon/promo image specs, and the publishing checklist.

---

## Agent Summary

### Agent 1: Store Listing Content (149 lines)

**Key deliverables:**
- **Full store description** (~3,640 characters) -- structured with hook, value proposition, "Why Zovo Cookie Manager" differentiators, 6 feature blocks (Cookie CRUD, Profiles, Auto-Delete Rules, Export/Import, Health Score, cURL Generation), target audience section, how-it-works steps, keyboard shortcuts, privacy & trust declaration, permissions explained, and "Built by Zovo" footer
- **Short description** (121 characters) -- "View, edit, and manage cookies with profiles, auto-delete rules, and developer tools. The modern cookie editor for Chrome."
- **Store metadata** -- Extension name, short name ("Cookies", 7 chars), category (Developer Tools), language (English), all three Zovo URLs (homepage, support, privacy policy)
- Validated character counts against CWS limits (description within 2,000-4,000; short description under 132)

### Agent 2: Privacy Section Content (631 lines)

**Key deliverables:**
- **Single purpose description** -- concise statement covering all 6 extension functions and 4 explicit "does NOT" declarations, with complete permission listing (6 required + 4 optional/runtime)
- **Permission justifications for all 7 permissions** -- cookies, storage, tabs, alarms, clipboardWrite, activeTab, identity (optional). Each includes: justification paragraph, numbered specific use cases, "What we DO / DO NOT do" lists, and user control statements. Ready to paste directly into the CWS Developer Dashboard
- **Remote code declaration** -- "No remote code" with strict CSP citation, 8 specific denials, and transparent disclosure of Pro tier network requests (LemonSqueezy, Google OAuth, Zovo API) with explicit statement that no cookie data is ever included
- **Data usage declaration** -- All 9 data type boxes documented as NOT COLLECTED with nuanced notes on optional Pro tier behaviors (OAuth email, anonymized analytics). All three CWS certifications checked with justification
- **Full privacy policy page** (12 sections, ~240 lines of markdown) -- covers data collection, local storage table (10 data types), data transmission (cookie data never transmitted + Pro tier request table), third-party services (LemonSqueezy, Google, Supabase with their privacy policy links), permissions table, data security (CSP, AES-256-GCM encryption, PKCE OAuth, HMAC anti-tampering), data retention schedule, user rights (GDPR/CCPA), children's privacy, open source, change notification policy, and contact information
- **CWS submission quick reference** -- 5-step guide mapping each dashboard field to the correct section of the document

### Agent 3: Screenshot Specifications (616 lines)

**Key deliverables:**
- **Consistent style guide** for all 5 screenshots -- 1280x800 canvas, gradient background (#f0f3ff to #f8fafc at 135 degrees), Inter font system (4 text roles with exact sizes/weights/colors), popup rendering at 400x520px with shadow and border specs, Zovo logo placement (bottom-right, 80px, 60% opacity), Pro badge pill specs, callout arrow specs
- **Screenshot 1: Hero Shot** ("All Your Cookies, One Click") -- Cookies tab with github.com data, 8 cookie rows with realistic names/values/flags, search bar, filter chips (Session/Persistent/Secure/Third-party), action bar (Add/Export/Import/Delete All), complete row rendering spec with two-line layout and security flag pills
- **Screenshot 2: Cookie Profiles** ("Switch Environments in Seconds") -- Profiles tab with 3 named profiles (Dev Environment, Staging Login, QA Session) with color dots, last-used timestamps, action buttons, locked "Unlock Unlimited Profiles" card with Pro upgrade CTA
- **Screenshot 3: Auto-Delete Rules** ("Automatic Cookie Cleanup") -- Rules tab with 3 active rules (doubleclick.net, facebook.com+instagram.com, Google Analytics cookies), toggle switches, glob pattern display, locked "Add Rule" area with Pro badge
- **Screenshot 4: Export & Developer Tools** ("Developer-Friendly Cookie Tools") -- Split layout with popup showing export dropdown (JSON free, Netscape/CSV/Header String locked to Pro) and floating code preview panel with syntax-highlighted JSON output and cURL tab, using Stripe API cookies as sample data
- **Screenshot 5: Cookie Health Dashboard** ("Know Your Cookie Health") -- Health tab with B+ score badge for nytimes.com, tracking cookies card (unblurred, showing doubleclick/facebook/nytimes trackers), insecure cookies card (blurred with "Unlock Details" CTA), oversized cookies card (blurred), expired cookies card (green check), GDPR scan button
- **Production checklist** -- 13-item verification table for screenshot consistency
- **Tools and creation workflow** -- Figma/Canva methods with step-by-step instructions

### Agent 4: Icon & Promo Image Specifications (1,055 lines)

**Key deliverables:**
- **Cookie-with-bite icon concept** -- Design philosophy (rounded square, purple gradient #6366f1 to #4f46e5, white cookie silhouette with bite mark at upper-right), cookie symbol anatomy with ASCII art
- **Pixel-perfect specs for all 4 icon sizes:**
  - icon-16.png: Solid purple (no gradient), 3px corner radius, 9px cookie circle, 2-3 chip dots at 1.5px, full pixel grid alignment map
  - icon-32.png: Gradient background, 7px corner radius, 20px cookie, 3-4 chip dots at 2.5px
  - icon-48.png: Full detail, 10px corner radius, 30px cookie, 4-5 chip dots with size variation, optional crumb texture
  - icon-128.png: Hero size with maximum detail, 28px corner radius, 80px cookie, 5-6 chip dots (5-8px), crumb fragments near bite, subtle surface texture, optional inner highlight
- **SVG vector source** -- Complete SVG structure with 5 layers (background, cookie-body, chip-dots, crumbs, texture), 512x512 viewBox, per-size export settings with layer enable/disable rules
- **AI image generation prompts** -- Primary prompt (Midjourney/DALL-E/Stable Diffusion) for 512x512 concept, variant prompt optimized for 16/32px clarity, and Figma/Illustrator manual recreation guide (10 steps)
- **Icon quality checklist** -- 23 verification items across recognizability (5), technical quality (8), brand compliance (6), and platform testing (7), plus 3 comparison tests
- **Manifest integration** -- Exact JSON for icons and action.default_icon fields, file structure with size budgets
- **Small promo tile (440x280)** -- Layout grid with element positions, purple gradient background, white cookie icon at 128px, extension name in Inter Semibold 24px, tagline, "by Zovo" badge, vertical rhythm spec, alternative tagline options
- **Marquee promo tile (1400x560)** -- Two-column layout (40/60 split), left section with icon + name + description, right section with popup UI mockup at 400x420px with shadow and optional 3D perspective tilt, Zovo logo placement, popup mockup content spec with developer-oriented domain data
- **Social share image (1200x630)** -- OG image layout with icon, headline, tagline, feature list (2 columns), divider line, website URL, complete Open Graph and Twitter Card meta tag HTML, platform-specific preview testing checklist (6 platforms)
- **Promo image quality checklist** -- 22 items across visual quality (6), content accuracy (6), technical requirements (7), brand consistency (5), and CWS compliance (5)
- **Creation tool recommendations** -- 4-tier tool matrix (Professional, Fast/Indie, AI-Assisted, Optimization) with 10 tools rated by purpose, cost, and notes. Complete 3-step recommended workflow (icon creation, promo tiles, social image)
- **Complete asset file manifest** -- All deliverable files with dimensions, size budgets, and usage context. Total icon budget <21KB (within 60KB performance spec), total promo budget <430KB

### Agent 5: Publishing Checklist (195 lines)

**Key deliverables:**
- **Pre-submission checklist** with 6 sections:
  - Code (13 items) -- extension loading, MV3, icons, permissions inventory with justifications for all 8 permissions, CSP, no eval/innerHTML, service worker survival, clean build output
  - Store Listing (16 items) -- description character count, structure validation, short description, all 5 screenshots with titles and content descriptions, promo tiles, category, language
  - Privacy (19 items) -- single purpose description, all 7 permission justifications, remote code declaration with Pro tier caveat, all 9 data type boxes, 3 certifications, privacy policy URL verification (live, HTTP 200, mentions extension by name, includes date, covers all 12 sections)
  - Links (6 items) -- all 3 Zovo URLs with HTTP 200 verification and content checks
  - Branding (7 items) -- icon colors, icon system compliance, screenshots with Zovo logo, description "Built by Zovo" section, promo tile branding
  - Final Verification (7 items) -- clean profile test, zip packaging, error check, console.log removal, version number, locale configuration
- **Post-submission checklist** (16 items) -- confirmation save, review time expectations, email monitoring, post-approval testing (5 sub-items), link verification (4 sub-items), search verification for 4 keyword phrases, social share OG image verification
- **If Rejected protocol** (6 steps) -- read rejection carefully, reference 13-REVIEW-REJECTION-RECOVERY.md, fix all issues, update version, resubmit with appeal, track rejection history
- **Quick reference table** -- 12-row mapping of every CWS Dashboard field to its source document and section

---

## Key Artifacts Produced

| Artifact | Purpose | Used When |
|----------|---------|-----------|
| Store description (~3,640 chars) | CWS listing detail page | Submission |
| Short description (121 chars) | CWS listing search results | Submission |
| Store metadata | CWS dashboard fields | Submission |
| Single purpose description | CWS privacy tab | Submission |
| 7 permission justifications | CWS privacy tab | Submission |
| Remote code declaration | CWS privacy tab | Submission |
| Data usage declaration | CWS privacy tab | Submission |
| Privacy policy page (full) | Host at zovo.one/privacy/cookie-manager | Before submission |
| 5 screenshot specifications | Design execution in Figma/Canva | Asset creation |
| Screenshot style guide | Consistency across all 5 screenshots | Asset creation |
| 4 icon size specifications | Icon creation (16, 32, 48, 128) | Asset creation |
| SVG vector source structure | Master icon source file | Asset creation |
| AI icon generation prompts | Midjourney/DALL-E icon concepts | Asset creation |
| Small promo tile spec (440x280) | CWS featured sections | Asset creation |
| Marquee promo tile spec (1400x560) | CWS featured banner | Asset creation |
| Social share image spec (1200x630) | OG image for link previews | Marketing |
| OG meta tag HTML | Landing page head section | Website deployment |
| Icon quality checklist (23 items) | Icon QA before submission | Asset QA |
| Promo image quality checklist (22 items) | Promo QA before submission | Asset QA |
| Publishing checklist (68+ items) | Final gate before CWS upload | Submission |

---

## Detailed Documents

| Agent | File | Lines | Focus |
|-------|------|-------|-------|
| 1 | [agent1-store-listing.md](store-assets/agent1-store-listing.md) | 149 | Store description, short description, metadata |
| 2 | [agent2-privacy-content.md](store-assets/agent2-privacy-content.md) | 631 | Single purpose, permission justifications, remote code, data usage, privacy policy |
| 3 | [agent3-screenshot-specs.md](store-assets/agent3-screenshot-specs.md) | 616 | 5 screenshot layouts with pixel-level specs, style guide, sample data |
| 4 | [agent4-icon-promo-specs.md](store-assets/agent4-icon-promo-specs.md) | 1,055 | 4 icon sizes, SVG source, AI prompts, promo tiles, social image, tool recommendations |
| 5 | [PUBLISHING-CHECKLIST.md](store-assets/PUBLISHING-CHECKLIST.md) | 195 | Pre-submission checklist, post-submission verification, rejection recovery protocol |

---

*Store assets specification produced by 5 specialist agents. 2,646 lines of publishing documentation: complete store listing copy, full privacy policy, 5 screenshot designs, 4 icon sizes with pixel grids, 3 promotional image layouts, AI generation prompts, and a 68+ item publishing checklist covering code, listing, privacy, links, branding, and post-submission verification.*
