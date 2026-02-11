# Zovo Cookie Manager -- Extension Specification

## Section 1: Product Overview

### 1.1 Extension Identity

- **Name:** Zovo Cookie Manager
- **Tagline:** "See, control, and own every cookie instantly."
- **Category:** Developer Tools
- **Target Users:**
  - **Primary:** Developers and QA engineers managing cookies across multiple environments (staging, production, feature branches), performing session debugging, and automating test workflows.
  - **Secondary:** Filipino virtual assistants managing multiple client accounts who need fast, reliable session switching; privacy-conscious users who want visibility into tracking behavior on every site they visit.

### 1.2 Problem Statement

**The vacuum.** EditThisCookie served over 3 million users as the de facto cookie management tool for Chrome. In December 2024, Google removed it from the Chrome Web Store for failing to comply with Manifest V3 requirements. Overnight, millions of developers, QA engineers, and power users lost their primary cookie workflow. The extensions that rushed to fill the gap are forks of uncertain provenance -- the leading EditThisCookie fork has accumulated roughly 1 million installs but carries a mediocre 4.1-star rating and inherits the same aging MV2 codebase. Users rightly distrust copycat extensions that request broad permissions with no established reputation.

**Weaknesses of current alternatives:**

| Competitor | Key Weakness |
|---|---|
| EditThisCookie Fork (~1M users, 4.1 stars) | Inherited legacy code, no original development, trust concerns, stale UI |
| Cookie-Editor by cgagnier (~330K, 4.6 stars) | Solid but minimal -- no profiles, no bulk operations, no monitoring, no health scoring |
| Cookie AutoDelete (~500K, 4.5 stars) | Narrow scope -- auto-deletion only, no editing or export workflow |
| J2TEAM Cookies (~200K, 4.81 stars) | Niche audience, limited search/filter, no advanced features beyond basic CRUD |
| HotCleaner (~100K, 4.6 stars) | Cleanup-focused, no developer tooling, no export/import pipeline |

Every competitor is entirely free, meaning none have built sustainable revenue or invested in differentiated feature development. The result is a market of adequate-but-stagnant tools with no innovation in profiles, monitoring, compliance, or collaboration.

**Why users will choose Zovo Cookie Manager:**

1. **MV3-native from day one.** Built on Manifest V3 with a service worker architecture, guaranteeing long-term Chrome Web Store compliance and no future removal risk.
2. **Trustworthy brand.** Zovo is a known extension ecosystem (18+ tools), not an anonymous fork. Clear privacy policy, minimal permissions, transparent data handling.
3. **Modern UI.** Clean, responsive popup and side panel with dark/light mode -- a visible step above the dated interfaces of every current competitor.
4. **Features no one else has.** Cookie profiles with one-click restore, real-time change monitoring, GDPR compliance scanning, cookie health scoring, cURL generation, and encrypted vault storage represent a category of functionality that zero competitors offer today.
5. **Funnel into Zovo membership.** The extension is free to use and genuinely useful at the free tier, following a Grammarly-style "gift before gate" model that earns trust before asking for payment.

### 1.3 Success Metrics

**Install targets:**

| Milestone | Target | Rationale |
|---|---|---|
| 30 days | 10,000 installs | Capture early adopters searching for EditThisCookie replacements; SEO on "EditThisCookie alternative MV3" |
| 60 days | 35,000 installs | Organic growth from ratings + word-of-mouth in dev communities (Reddit, X, Filipino VA Facebook groups) |
| 90 days | 75,000 installs | Sustained momentum; target 1-2% of the 3M+ displaced user base within first quarter |

**Conversion rate target:** 5-7% free-to-paid within 6 months of install. Based on competitive research showing zero paid alternatives, even modest conversion at $4-7/month represents greenfield revenue. The Grammarly model benchmarks at 4-6% in productivity tools; cookie management's higher pain-per-session for power users supports the upper end.

**Revenue targets (tied to Zovo membership):**

- Month 3: 3,750-5,250 paid users (75K installs x 5-7%), generating $15K-$37K MRR across Starter/Pro/Team tiers.
- Month 6: Target 150K installs, 7,500-10,500 conversions, $30K-$74K MRR.
- The cookie manager is the top-of-funnel entry point. Each converted user is a candidate for the full Zovo membership ($14/month for 18+ extensions), lifting LTV significantly beyond the standalone cookie tool.

**Rating target:** 4.5+ stars sustained. This positions Zovo above the EditThisCookie fork (4.1) and competitive with Cookie-Editor (4.6) and J2TEAM (4.81). Achieving this requires a polished free tier that genuinely solves the core problem without frustrating users with premature paywalls.

---

## Section 2: Feature Specification

### 2.1 Complete Feature Matrix

| Feature | Description | Free Tier | Pro Tier ($7/mo) | Technical Notes |
|---|---|---|---|---|
| **View/List Cookies** | Display all cookies for the active domain in a sortable, scannable table with columns for name, value (truncated), domain, path, expiry, size, httpOnly, secure, sameSite | Unlimited | Unlimited | Read via `chrome.cookies.getAll()`; group by domain/subdomain; show cookie count badge on extension icon |
| **Edit Cookie** | Inline editing of any cookie field (name, value, domain, path, expiry, httpOnly, secure, sameSite) with validation | Unlimited | Unlimited | `chrome.cookies.set()` to overwrite; validate domain format, expiry as Unix timestamp or date picker |
| **Create Cookie** | Form to create a new cookie with all standard fields, with sensible defaults pre-filled from current domain | Unlimited | Unlimited | Pre-fill domain from `chrome.tabs` active tab; default path `/`, secure `true`, sameSite `Lax` |
| **Delete Cookies** | Delete individual cookies with confirmation, or delete all cookies for the current domain | Single + all-for-domain | Single + all-for-domain + bulk multi-domain | `chrome.cookies.remove()`; confirmation modal to prevent accidents |
| **Search & Filter** | Find cookies by name, value, or domain | Plain text search | Regex search + saved filters (up to 20) | Free: `String.includes()` matching. Pro: full JS regex with syntax validation; saved filters stored in `chrome.storage.sync` |
| **Export Cookies** | Export cookies to file | JSON only, current domain only, max 25 cookies per export | JSON + Netscape HTTP + CSV + cURL batch, all domains, unlimited cookies | Free exports include a small "Exported with Zovo Cookie Manager" comment in JSON. Pro removes branding and adds format options |
| **Import Cookies** | Import cookies from file | JSON only, single domain, max 25 cookies per import | JSON + Netscape HTTP + CSV, any domain, unlimited, bulk import with conflict resolution (skip/overwrite/rename) | Validate imported data schema before applying; show preview diff before committing |
| **Cookie Profiles** | Save and restore named sets of cookies for a domain (e.g., "Staging Admin", "Prod ReadOnly") | 2 profiles total | Unlimited profiles + encrypted storage + profile tagging/organization | Stored in `chrome.storage.local`; Pro profiles encrypted with AES-256 before storage. Paywall triggers on 3rd profile save |
| **Auto-Delete Rules** | Automatically delete cookies matching a pattern when a tab closes or on a schedule | 1 rule | Unlimited rules + schedule-based deletion (hourly/daily) + domain-glob patterns | `chrome.tabs.onRemoved` listener; rules stored in `chrome.storage.sync`; Pro adds `chrome.alarms` for scheduled cleanup |
| **Whitelist / Blacklist** | Protect cookies from auto-delete (whitelist) or always delete on visit (blacklist) | 5 domains total across both lists | Unlimited domains + wildcard patterns (e.g., `*.google.com`) | Whitelist overrides auto-delete rules; blacklist fires on `chrome.webNavigation.onCompleted` |
| **Dark / Light Mode** | Toggle between dark and light UI themes; respects system preference by default | Full | Full | `prefers-color-scheme` media query for default; manual toggle saved in `chrome.storage.local` |
| **Cookie Protection** | Mark specific cookies as read-only; extension prevents edits and warns before deletion | 5 protected cookies | Unlimited protected cookies + lock icon overlay in cookie list | Protection flag stored as metadata in `chrome.storage.local`; intercept edit/delete actions with confirmation |
| **Bulk Operations** | Select multiple cookies across multiple domains and delete, export, or move to profile in one action | -- | Full | Multi-select UI with checkboxes; "Select All" per domain; batch `chrome.cookies.remove/set` |
| **Cookie Snapshots + Diff** | Capture a point-in-time snapshot of all cookies and compare two snapshots to see additions, deletions, and value changes | -- | Full | Snapshots stored in `chrome.storage.local` (limit 50, auto-prune oldest); diff rendered as side-by-side or inline with color-coded changes |
| **Real-Time Cookie Monitoring** | Live feed showing cookie changes (set, removed, overwritten) as they happen, with source attribution | -- | Full | `chrome.cookies.onChanged` event listener; display as scrolling event log with timestamp, change type, and cookie details; pause/resume toggle |
| **Cookie Health Score** | Analyze cookies on the current site and produce a security/privacy score (0-100) based on httpOnly, secure, sameSite, expiry length, third-party ratio | Badge score on icon (number only) | Full detailed report: per-cookie breakdown, risk flags, remediation suggestions | Scoring algorithm: +20 all httpOnly, +20 all secure, +20 all sameSite strict/lax, +20 no expiry >1yr, +20 no third-party. Pro report rendered as expandable accordion per cookie |
| **GDPR Compliance Scan** | Scan current site's cookies against known tracker databases and classify as strictly necessary, functional, analytics, or advertising | 1 scan per domain, results blurred after top 3 cookies shown | Unlimited scans, full unblurred report, exportable compliance PDF | Classification via bundled tracker list (EasyList-derived, updated monthly via remote config). Blurred results act as paywall teaser |
| **cURL Command Generation** | Generate a cURL command with cookies attached for replaying requests | Current site's cookies only | Any cookie set, batch cURL for multiple endpoints, copy-to-clipboard | Build cURL string with `-b "name=value; ..."` syntax; Pro allows selecting arbitrary cookies across domains |
| **Encrypted Cookie Vault** | Store sensitive cookie sets in an AES-256 encrypted vault with a user-defined passphrase | -- | Full | Web Crypto API `SubtleCrypto.encrypt()` with PBKDF2 key derivation; vault data in `chrome.storage.local`; passphrase never stored, derived key held in memory only during session |
| **Cross-Device Sync** | Sync profiles, rules, and protected cookies across devices via Chrome sync or Zovo cloud account | -- | Full | `chrome.storage.sync` for small payloads (<100KB); Zovo cloud API for larger datasets; conflict resolution: last-write-wins with manual merge option |
| **Team Sharing** | Share cookie profiles and auto-delete rules with team members via shared Zovo workspace | -- | Team tier ($14/mo, 5 seats) | Zovo cloud API with workspace model; invite via email; role-based access (admin/member); shared profiles are read-only for members unless promoted |

### 2.2 Free Tier Specification

The free tier must be a complete, genuinely useful cookie manager that solves the core problem without frustration. It replaces EditThisCookie for 90%+ of casual use cases. Every limit is chosen so that the user hits a natural boundary only when their usage demonstrates they are a power user who would benefit from Pro.

- **View/List/Edit/Create/Delete:** Fully unlimited for the current domain. No artificial restrictions on core CRUD. This is the "gift" that builds trust and earns the 4.5+ star rating.
- **Search & Filter:** Plain text search across cookie name, value, and domain fields. Covers the vast majority of lookup needs. No regex -- power users who need pattern matching are self-selecting into Pro.
- **Export:** JSON format only. Limited to the current domain and a maximum of 25 cookies per export operation. This covers single-site debugging and session sharing. The 25-cookie cap is rarely hit on a single domain (median site sets 8-15 cookies), so most free users never encounter it. Users managing multi-domain applications or full cookie dumps naturally need Pro.
- **Import:** JSON format only. Single domain, maximum 25 cookies per import. Mirrors export limits. Sufficient for restoring a single session or importing a colleague's shared cookies for one site.
- **Cookie Profiles (2 total):** Two named profiles across all domains. Enough to save "logged in" and "logged out" states for one site, or one profile each for two sites. The paywall triggers on the 3rd profile save attempt, at which point the user has already experienced the value of instant session switching and is motivated to unlock more.
- **Auto-Delete Rule (1 rule):** One rule that fires on tab close. Enough to auto-clean cookies for one problematic domain (e.g., a tracking-heavy site). Users who want per-domain rules or scheduled cleanup are managing complexity that justifies Pro.
- **Whitelist/Blacklist (5 domains):** Five total entries across both lists. Sufficient for protecting a handful of critical sessions (e.g., Gmail, primary work app) from auto-delete. Power users managing dozens of domains need unlimited.
- **Dark/Light Mode:** Fully free. This is a baseline UX expectation, not a monetization lever. Gating appearance would generate negative reviews.
- **Cookie Protection (5 cookies):** Five cookies can be marked read-only. Enough to lock down the most critical session tokens. Users managing many protected cookies across environments need Pro.
- **Cookie Health Score (badge only):** The extension icon shows the numeric score (0-100) for the current site. The user sees the number but cannot drill into per-cookie details or remediation steps. This creates curiosity and awareness -- "Why is this site a 35?" -- that drives clicks into the blurred Pro report.
- **GDPR Compliance Scan (1 scan, blurred):** One scan per domain reveals the top 3 cookies classified by category. Remaining results are visually blurred with a clear "Unlock full report with Pro" overlay. The user sees enough to understand the value (and enough to be alarmed about trackers) but cannot act on the full data without upgrading.
- **cURL Generation (current site):** Generate a cURL command using all cookies from the active tab's domain. Developers will use this daily for API debugging. The restriction to "current site only" is barely noticeable for casual use; Pro unlocks cross-domain cookie selection for advanced scripting.

**Why the free tier does not cannibalize Pro:** Every free limit corresponds to a natural complexity threshold. Users who stay within free limits are casual users who would never convert anyway. Users who exceed limits have already demonstrated power-user behavior and felt the value of the feature they are trying to scale. The Grammarly-style pattern ensures the free tier is the product's best marketing asset, not a loss leader.

### 2.3 Pro Tier Specification

Pro ($7/month or included in Zovo membership at $14/month) unlocks capabilities that serve daily professional workflows. Each Pro feature connects directly to a free-tier experience that the user has already validated.

- **Regex Search + Saved Filters:** Full JavaScript regex support with syntax highlighting and validation. Save up to 20 named filter presets (e.g., "session tokens", "tracking cookies", "expired"). **Worth paying for:** developers who search for cookies hundreds of times per week need patterns and recall, not re-typing. **Connection to free tier:** the user has already used plain-text search enough to feel its limits.
- **Unlimited Export (all formats, all domains):** Export in JSON, Netscape HTTP cookie format (for curl/wget), CSV (for spreadsheets), and cURL batch scripts. Export any combination of domains. No cookie count limit. **Worth paying for:** QA engineers exporting full session state across staging environments; VAs exporting client cookie sets for backup. **Connection:** the user hit the 25-cookie or single-domain limit on a real task.
- **Unlimited Import (all formats, bulk, conflict resolution):** Import from JSON, Netscape HTTP, and CSV. Bulk import across domains with a preview diff showing what will be added, modified, or skipped. Conflict resolution options: skip existing, overwrite, or rename (append suffix). **Worth paying for:** restoring complex multi-domain sessions or migrating cookie state between machines. **Connection:** the user has imported at least once and understands the workflow.
- **Unlimited Cookie Profiles + Encryption:** No cap on profiles. Profiles can be tagged and organized into folders. All profile data encrypted at rest with AES-256. **Worth paying for:** developers juggling 10+ environments, VAs managing 20+ client sessions. **Connection:** the user saved 2 profiles, loved the instant-switch experience, and tried to save a 3rd.
- **Unlimited Auto-Delete Rules + Scheduling:** Create rules per domain or using glob patterns (e.g., `*.ads.*`). Schedule-based deletion via `chrome.alarms` (hourly, daily, weekly). **Worth paying for:** privacy-focused users and compliance-conscious teams who need automated hygiene. **Connection:** the user created 1 rule and wants more.
- **Unlimited Whitelist/Blacklist + Wildcards:** No domain cap. Wildcard support for domain patterns. **Worth paying for:** managing policy across dozens of client or project domains. **Connection:** the user filled 5 slots.
- **Unlimited Cookie Protection:** No cap on read-only cookies. Bulk-protect by pattern. **Worth paying for:** preventing accidental session loss in complex environments.
- **Bulk Operations:** Multi-select cookies across multiple domains. Batch delete, export, or add to profile. **Worth paying for:** any workflow involving more than one domain at a time -- the daily reality for developers and VAs.
- **Cookie Snapshots + Diff:** Capture up to 50 snapshots. Compare any two snapshots with a visual diff (additions in green, deletions in red, changes in yellow). **Worth paying for:** debugging "what changed?" after a deploy or script execution. No competitor offers this.
- **Real-Time Monitoring:** Live event log of all cookie changes site-wide. Filter by domain, change type (set/remove/overwrite), and time range. Pause/resume. **Worth paying for:** debugging third-party scripts, tracking consent manager behavior, auditing cookie writes during QA. No competitor offers this.
- **Full Cookie Health Report:** Expandable per-cookie breakdown of the health score. Each cookie flagged with specific risks (missing httpOnly, excessive expiry, third-party origin) and actionable remediation text. **Worth paying for:** security-conscious teams and developers who need to document cookie posture. **Connection:** the user saw the badge score and wanted to know why.
- **Full GDPR Compliance Report:** Unblurred classification of every cookie. Exportable as PDF for compliance documentation. **Worth paying for:** EU-facing teams, agencies managing client compliance, privacy officers. **Connection:** the user saw 3 classified cookies and needs the rest.
- **cURL Generation (any cookie set):** Select arbitrary cookies across any domain to compose a cURL command. Batch generation for multiple endpoints. **Worth paying for:** advanced API debugging and scripting workflows.
- **Encrypted Vault:** AES-256 encrypted storage for sensitive cookie sets. Passphrase-protected, never stored, derived via PBKDF2. **Worth paying for:** storing production credentials, client session tokens, or any cookies with security sensitivity. No competitor offers this.
- **Cross-Device Sync:** Sync profiles, rules, whitelist/blacklist, and protected cookies across devices. Small payloads via `chrome.storage.sync`; larger datasets via Zovo cloud. **Worth paying for:** developers working across laptop and desktop, or VAs switching between machines.

### 2.4 Feature Priority (MVP)

**P0 -- Must have for launch (MVP):**

These features define the minimum viable product. Without every P0 feature, the extension cannot replace EditThisCookie for its core audience.

| Feature | Scope | Acceptance Criteria |
|---|---|---|
| View/List Cookies | Full | Sortable table, all standard cookie fields displayed, cookie count badge on icon |
| Edit Cookie | Full | Inline edit with validation, changes persist immediately |
| Create Cookie | Full | Form with pre-filled defaults from active tab |
| Delete Cookie | Full | Single delete with confirmation; delete-all-for-domain |
| Search (plain text) | Free tier | Filters cookie list in real time as user types; searches name, value, domain |
| Export (JSON, current domain, 25 max) | Free tier | One-click download; valid JSON output |
| Import (JSON, single domain, 25 max) | Free tier | File picker; schema validation; preview before apply |
| Cookie Profiles (2) | Free tier | Save/restore named cookie sets; paywall on 3rd save |
| Auto-Delete Rule (1) | Free tier | Rule fires on tab close; configurable domain pattern |
| Dark/Light Mode | Full | System preference detection; manual toggle; persisted |

**P1 -- Add within 2 weeks post-launch:**

These features differentiate Zovo from every competitor and activate the conversion funnel.

| Feature | Scope | Rationale |
|---|---|---|
| Cookie Health Score (badge) | Free tier | Visible differentiator on every page; drives curiosity |
| Cookie Health Score (full report) | Pro | First compelling Pro upsell moment |
| GDPR Compliance Scan (blurred teaser) | Free tier | Second upsell moment; high perceived value |
| Bulk Operations | Pro | Unblocks multi-domain workflows for power users |
| cURL Generation (current site) | Free tier | Developer magnet feature; no competitor has this |
| Regex Search + Saved Filters | Pro | Power-user retention feature |
| Whitelist/Blacklist (5 domains) | Free tier | Complements auto-delete rule |
| Cookie Protection (5 cookies) | Free tier | Prevents accidental session loss |

**P2 -- Future roadmap (1-3 months post-launch):**

These features build long-term moat and justify the Team tier.

| Feature | Scope | Rationale |
|---|---|---|
| Real-Time Cookie Monitoring | Pro | Most technically complex; requires persistent background listener and performant event log UI |
| Encrypted Cookie Vault (AES-256) | Pro | Requires Web Crypto API integration, key management UX, and security audit |
| Cross-Device Sync | Pro | Requires Zovo cloud API integration or careful `chrome.storage.sync` quota management |
| Cookie Snapshots + Diff | Pro | Requires snapshot storage strategy (quota management for 50 snapshots) and diff rendering engine |
| Team Sharing | Team tier | Requires Zovo workspace API, invitation flow, role-based access control |
| Full GDPR Report + PDF Export | Pro | Requires PDF generation library and up-to-date tracker classification database |
| Unlimited Export/Import (all formats) | Pro | Netscape HTTP and CSV parsers; conflict resolution UI for bulk import |

---

*End of Sections 1 and 2. Sections 3+ (UI/UX, Technical Architecture, Monetization, Launch Plan) to follow in subsequent documents.*
