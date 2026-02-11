# 02 - Extension Specification: Zovo Cookie Manager

## Phase 02 Complete | Generated 2026-02-11

---

## Overview

This is the complete, buildable specification for the **Zovo Cookie Manager** Chrome extension. It transforms the competitive intelligence from Phase 01 into actionable development specs across 9 sections produced by 5 parallel agents.

**Extension:** Zovo Cookie Manager
**Tagline:** "See, control, and own every cookie instantly."
**Category:** Developer Tools
**Target Users:** Developers/QA engineers (primary), Filipino VAs (secondary), privacy-conscious users (tertiary)
**Pricing:** Free / $4 Starter / $7 Pro / $14 Team (5 seats)

---

## Quick Reference

### Product Identity

- **Market Opportunity:** EditThisCookie (3M+ users) removed Dec 2024 for MV3 non-compliance. No clear successor.
- **Competitive Edge:** MV3-native, trustworthy brand, modern UI, unique features no competitor has (profiles, monitoring, GDPR scan, health score)
- **Revenue Model:** Free tier as funnel into Zovo membership (18+ extensions)

### Success Targets

| Timeframe | Installs | Conversion | MRR | Rating |
|-----------|----------|------------|-----|--------|
| Week 1 | 500+ | -- | -- | 4.0+ |
| Month 1 | 2,000+ | 2-3% | $200-300 | 4.3+ |
| Month 3 | 5,000+ | 5-7% | $1,375-2,450 | 4.5+ |
| Month 6 | 10,000+ | 5-7% | $50-150 standalone | 4.5+ |

### Feature Priority Summary

**P0 — Must Have for Launch:**
- Core CRUD: view, edit, create, delete cookies
- Search and filter (basic text)
- Export/import (JSON, single domain, 25 cookie limit)
- Dark/light mode with system detection
- Cookie profiles (2 free)
- Auto-delete rules (1 free)
- Whitelist/blacklist (5 domains)
- Settings page
- Paywall modals and upgrade flow
- Basic analytics

**P1 — Add Within 2 Weeks:**
- Cookie Health Score badge
- GDPR compliance scan teaser (1 free, blurred)
- Bulk operations across domains (Pro)
- cURL command generation
- Context menu integration
- Keyboard shortcuts
- Usage counter UI
- Lock icons and Pro badges throughout UI

**P2 — Future Roadmap (1-3 months):**
- Real-time cookie change monitoring (Pro)
- Encrypted cookie vault (Pro)
- Cross-device sync (Pro)
- Team sharing (Team tier)
- Cookie snapshots + diff (Pro)
- DevTools panel integration
- Side panel mode

### Free vs Pro Split (Quick View)

| Feature | Free | Pro |
|---------|------|-----|
| View/edit/create/delete cookies | Unlimited | Unlimited |
| Search | Basic text, current tab | Regex, all domains |
| Export | JSON, 1 domain, 25 cookies | All formats, all domains, unlimited |
| Import | JSON, 1 domain | All formats, bulk |
| Cookie profiles | 2 | Unlimited + encrypted |
| Auto-delete rules | 1 | Unlimited |
| Whitelist/blacklist | 5 domains each | Unlimited |
| Dark/light mode | Yes | Yes |
| Cookie protection | 5 cookies | Unlimited |
| Bulk operations | -- | Yes |
| Snapshots + diff | -- | Yes |
| Real-time monitoring | -- | Yes |
| Cookie Health Score | Badge only | Full analysis |
| GDPR scan | 1 free (blurred) | Full report |
| cURL generation | Current site | Any cookie set |
| Encrypted vault | -- | AES-256 |
| Cross-device sync | -- | Yes |
| Team sharing | -- | Yes (Team tier) |

### Paywall Strategy

**Primary triggers:**
1. 3rd cookie profile save attempt (hard block modal)
2. 2nd auto-delete rule creation (hard block modal)
3. Export >25 cookies (soft banner)
4. Cookie Health Score detail click (Grammarly-style blur)
5. Bulk operations across domains (hard block modal)

**All copy uses Grammarly-style "gift framing"** — "Here's what Pro found for you" not "This requires Pro."

### Technical Stack

- **Manifest V3** (required — EditThisCookie was removed for V2)
- **UI:** Preact (3KB) for popup/options
- **Auth:** Supabase Auth + Google OAuth
- **Payments:** LemonSqueezy (Stripe-owned, Merchant of Record)
- **License sync:** `chrome.storage.sync` across all Zovo extensions
- **Shared module:** `@zovo/auth` NPM package (~5KB)
- **Offline grace:** 72-hour local license cache

### Popup Dimensions

- 400px wide x 520px tall (resizable to 600px)
- 4 tabs: Cookies | Profiles | Rules | Health
- Fixed header (56px) + tab bar (40px) + scrollable content + fixed footer (36px)

### Key Chrome Permissions

| Permission | Purpose |
|------------|---------|
| `cookies` | Core: read, write, delete cookies |
| `activeTab` | Scope to current tab's domain |
| `storage` | Settings, profiles, rules, license |
| `tabs` | Tab context, auto-delete triggers |
| `alarms` | Scheduled rules, license checks |
| `notifications` | Cookie change alerts (Pro) |
| `clipboardWrite` | Copy values, cURL commands |
| `identity` | Google OAuth sign-in |

### Analytics Funnel

```
Install (100%) → Active Day 1 (60%) → Active Day 7 (35%) → Limit Hit (20%) → Paywall Shown (18%) → Upgrade Click (3%) → Payment (2.5%) → Success (2%)
```

### Launch Timeline

| Phase | Duration | Scope |
|-------|----------|-------|
| Core Development | Week 1-2 | MV3 scaffold, CRUD, search, export/import, settings, dark mode |
| Premium Features | Week 2-3 | Profiles, rules, health score, GDPR, paywalls, auth |
| Polish | Week 3-4 | Bulk ops, cURL, context menu, keyboard shortcuts, onboarding |
| Testing | Week 4 | Cross-browser, paywall flows, upgrade/downgrade, performance |
| Launch | Week 5 | CWS submission, monitoring, community launch |

---

## Detailed Specification Documents

| Section | File | Contents |
|---------|------|----------|
| **1-2** | [section-1-2-product-features.md](spec/section-1-2-product-features.md) | Product overview (identity, problem statement, success metrics) + complete feature specification (18-feature matrix, free/pro specs with exact limits, MVP priority tiers) |
| **3** | [section-3-paywall.md](spec/section-3-paywall.md) | 17 paywall triggers with exact conditions, 6 fully-specced paywall UIs with copy/animations/behavior, complete upgrade flow (trigger → LemonSqueezy → unlock), post-upgrade experience with feature discovery tour |
| **4** | [section-4-ui.md](spec/section-4-ui.md) | Full popup wireframes (4 tabs), design system (colors, typography, spacing), settings page layout, Pro feature indicators (lock icons, blur treatment), usage counter states, context menu, DevTools panel spec |
| **5-6** | [section-5-6-architecture-monetization.md](spec/section-5-6-architecture-monetization.md) | Chrome permissions table, complete storage schema (TypeScript interfaces), API endpoints with rate limits, sync architecture, background service worker alarms/listeners, file structure, pricing tiers, payment integration flow, trial strategy, Zovo membership integration |
| **7-8-9** | [section-7-8-9-analytics-launch.md](spec/section-7-8-9-analytics-launch.md) | 33 analytics events with properties, conversion funnel with health thresholds, privacy-first implementation, 3 dashboards, 80+ item launch checklist across 7 phases, success criteria for Week 1 / Month 1 / Month 3 / Month 6 / 12-month north star |

---

## Key Decisions Summary

1. **No time-based trial.** Use "taste" mechanics instead — 2 free profiles, 1 free rule, 1 free GDPR scan, 25-cookie export limit.
2. **Bundle value is the play.** Cookie management alone can't justify $4/month given the free market. Position as "Cookie Manager Pro + 15 other tools for $4/month."
3. **Gift framing everywhere.** Every paywall uses Grammarly's approach — show what Pro found, blur the details, never say "locked."
4. **Minimal permissions.** No `<all_urls>`. Use `activeTab` for scoped access. Justify every permission to build trust.
5. **Preact, not React.** 3KB bundle for the popup. Fast load (<200ms) is critical for extension UX.
6. **Offline-first license.** 72-hour grace period. Never break Pro features because of a network glitch.

---

*Specification generated by 5 parallel agents. Total output: ~2,700 lines of developer-ready specs across 9 sections. Built on Phase 01 competitive intelligence (10 research documents, 100+ web searches, 8 competitor deep dives).*
