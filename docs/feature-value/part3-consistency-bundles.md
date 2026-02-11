# Feature Value Analysis: Part 3 & Part 4
# Portfolio Consistency Check & Bundle Strategy

**Date:** February 11, 2026
**Portfolio:** Zovo Chrome Extensions (16 extensions, unified membership)
**Pricing:** Free / $4 Starter / $7 Pro / $14 Team (5 seats)
**Audience:** Filipino VAs ($3-7/hr), developers, QA testers, content creators

---

## PART 3: PORTFOLIO CONSISTENCY CHECK

Every Zovo extension must feel like it belongs to the same product family. Inconsistent limits, random paywall placement, or mismatched UI patterns erode trust and make the bundle feel stitched together rather than designed. The following tables verify that all 16 extensions follow uniform logic for limits, sync, export, search, visual treatment, and tier mapping.

---

### 3.1 Usage Limits Pattern

**Design principle:** Power users hit free limits within 1-2 weeks of daily use. Casual users (fewer than 3 sessions per week) rarely hit limits -- ensuring positive reviews and organic word-of-mouth.

| Extension | Free Limit | Starter Limit | Pro Limit | Limit Type | Limit Justification |
|-----------|------------|---------------|-----------|------------|---------------------|
| **BeLikeNative** | 3 corrections/day | 30 corrections/day | Unlimited | Daily action cap | 3/day lets users experience value on 1-2 messages. VAs processing 20+ emails/day hit the wall by mid-morning of Day 1. |
| **Cookie Manager** | 2 profiles; export 25 cookies; 1 auto-delete rule | 10 profiles; export 200 cookies; 10 rules | Unlimited profiles, export, rules | Item count + action cap | Developers managing 2 environments stay free. Anyone with staging + production + QA hits the wall in week 1. |
| **Clipboard History Pro** | 25 items retained; pin 3 items | 200 items; pin 20 items | Unlimited | Item count | 25 items fills in ~2 hours of active copy-paste work. VAs doing data entry hit this by lunch on Day 1. |
| **Tab Suspender Pro** | Auto-suspend after 30 min; whitelist 5 domains | Custom timers; whitelist 25 domains | Unlimited whitelist; per-domain timers | Domain count + time config | Users with 6+ critical sites (Gmail, Slack, CRM, docs, etc.) hit the whitelist wall in week 1. |
| **JSON Formatter Pro** | Format + validate + tree view; copy node path | JSON diff; JSONPath queries | All features + schema validation | Feature gate | Free covers 80% of formatting needs. Developers needing diff or schema hit the gate on first complex debugging session. |
| **Form Filler Pro** | 1 profile; 10 fills/day | 5 profiles; 50 fills/day | Unlimited profiles and fills | Profile count + daily cap | VAs filling 10+ forms/day for clients hit the cap by mid-afternoon. Second client = second profile = paywall. |
| **Quick Notes** | 20 notes; basic rich text | 100 notes; folders and tags | Unlimited; markdown; cloud sync | Item count + feature gate | 20 notes fills in ~2 weeks of meeting notes. Tags/folders needed once organization becomes painful. |
| **Word Counter** | Word/char/sentence count; reading time | Keyword density; readability scores | Full analysis + export | Feature gate | Basic counting is always free. SEO/readability analysis is the power-user gate. |
| **QR Code Generator** | Static QR from URL; PNG 300px | Custom colors; high-res PNG | Logos; batch generation; SVG; analytics | Feature gate + format gate | Casual users generate 1-2 QR codes and stay free. Marketing teams needing branded QR codes hit the wall immediately. |
| **Base64 Encoder** | Text encode/decode; copy result | File encoding up to 1MB | Unlimited file size; batch; JWT decode | File size + feature gate | Text encoding is always free. Developers encoding images or decoding JWTs hit the gate on first attempt. |
| **Color Palette Generator** | Extract 5 colors from page; copy hex | Extract full palette; save palettes | Export ASE/CSS/SCSS/Tailwind; image upload | Color count + export gate | 5 colors is enough for casual use. Designers needing full palettes or export formats hit the wall on first real project. |
| **Bookmark Search** | Fuzzy search; recent searches (10) | Full-text page content search; tags | Dead link checker; bulk ops; analytics | Feature gate | Basic search is always free. Power users needing content search or dead link detection hit the gate when library grows. |
| **Timestamp Converter** | Convert current time; single timestamp paste | Batch convert; timezone grid (5 zones) | Unlimited zones; duration calc; log parser | Batch count + feature gate | Single conversions stay free. Developers parsing log files or coordinating across timezones hit the wall on first batch task. |
| **Color Contrast Checker** | Manual 2-color check; WCAG AA | Full-page audit; WCAG AAA | Color blindness sim; export reports; batch | Scope gate (manual vs auto) | Checking one pair is free. Compliance teams needing full-page audits hit the gate on first accessibility review. |
| **Lorem Ipsum Generator** | 1-3 paragraphs; standard lorem ipsum | Custom length; HTML output | Custom word lists; multi-language; templates | Paragraph count + feature gate | 3 paragraphs covers most quick mockup needs. Designers needing structured HTML or custom lists hit the gate on larger projects. |
| **Unit Converter** | 5 categories (length, weight, temp, volume, speed) | 10 categories + conversion history | All 15+ categories; live currency; batch; inline page convert | Category count | 5 categories covers daily needs. Anyone needing currency conversion or developer units (bytes, pixels, ems) hits the gate immediately. |

**Consistency verification:** Every extension follows one of three limit patterns: (a) item count that fills within 1-2 weeks of active use, (b) daily action cap that restricts heavy users by mid-day, or (c) feature gate where advanced capabilities are locked behind Pro. No extension uses arbitrary or disproportionate limits.

---

### 3.2 Sync Pattern

**Universal rule:** Local storage = Free. Cloud sync via Zovo account = Starter (2 devices) / Pro (unlimited devices). This is consistent across every extension -- no exceptions.

| Extension | What Syncs | Sync Size Estimate | Conflict Resolution |
|-----------|------------|-------------------|---------------------|
| **BeLikeNative** | Custom dictionary, correction preferences, writing style profiles | ~50KB per user | Last-write-wins for preferences; merge for dictionary (union of both device word lists) |
| **Cookie Manager** | Cookie profiles, auto-delete rules, whitelist/blacklist | ~200KB per user (profiles can be large) | Last-write-wins for rules; profiles use timestamp-based merge (newer profile version wins) |
| **Clipboard History Pro** | Pinned clips, folders, text snippets | ~500KB per user (text-heavy) | Append-only for clipboard items; last-write-wins for folder structure |
| **Tab Suspender Pro** | Whitelist domains, suspend timers, session saves | ~30KB per user | Union merge for whitelist; last-write-wins for timers |
| **JSON Formatter Pro** | Saved queries, theme preferences, recent diffs | ~20KB per user | Last-write-wins for all (low-conflict data) |
| **Form Filler Pro** | Form profiles, custom field mappings | ~100KB per user | Timestamp-based merge for profiles; last-write-wins for mappings |
| **Quick Notes** | Notes, folders, tags | ~1MB per user (notes can be lengthy) | CRDT-style merge for note content (character-level); last-write-wins for folder/tag structure |
| **Word Counter** | Writing goals, analysis history | ~10KB per user | Last-write-wins (low-conflict) |
| **QR Code Generator** | Saved QR codes, design templates | ~100KB per user (includes image data) | Last-write-wins per QR code ID |
| **Base64 Encoder** | Encoding history, saved conversions | ~30KB per user | Append-only for history |
| **Color Palette Generator** | Saved palettes, export presets | ~50KB per user | Last-write-wins per palette ID |
| **Bookmark Search** | Tags, search history, collections | ~50KB per user | Union merge for tags; last-write-wins for collections |
| **Timestamp Converter** | Favorite timezones, format presets | ~5KB per user | Last-write-wins (trivial data) |
| **Color Contrast Checker** | Saved checks, report history | ~30KB per user | Append-only for check history |
| **Lorem Ipsum Generator** | Custom word lists, saved templates | ~20KB per user | Last-write-wins per template ID |
| **Unit Converter** | Favorite conversions, custom units | ~10KB per user | Union merge for favorites; last-write-wins for custom units |

**Total sync budget:** ~2.2MB per user across all 16 extensions. Well within `chrome.storage.sync` limits (100KB) for tier/license data; user content syncs via Zovo cloud API.

---

### 3.3 Export Pattern

**Universal rule:** Basic export (single format, current context) = Free. Pro formats (multiple formats, unlimited scope) = Starter/Pro. Encrypted export = Pro only.

| Extension | Free Export | Starter Export | Pro Export Formats | Export Limit (Free) |
|-----------|------------|----------------|-------------------|-------------------|
| **BeLikeNative** | Copy corrected text to clipboard | Export correction history (TXT) | CSV, JSON, PDF correction reports | Last 10 corrections |
| **Cookie Manager** | JSON for current site | JSON + Netscape for current site | JSON, Netscape, CSV, Header String, encrypted AES | 25 cookies (free), 200 (Starter), unlimited (Pro) |
| **Clipboard History Pro** | Copy individual items | Export selected items as TXT | JSON, CSV, HTML, with metadata | Last 25 items |
| **Tab Suspender Pro** | N/A (no meaningful export) | Export session as URL list (TXT) | JSON session with metadata, HTML bookmarks format | Current session only |
| **JSON Formatter Pro** | Copy formatted JSON | Export as formatted JSON file | CSV, YAML, minified, schema | Current document |
| **Form Filler Pro** | Copy single profile as JSON | Export profiles as JSON | CSV, encrypted JSON, team-importable format | 1 profile |
| **Quick Notes** | Copy note text | Export note as TXT, Markdown | PDF, HTML, JSON (all notes), bulk export | 1 note at a time |
| **Word Counter** | Copy stats to clipboard | Export stats as TXT | CSV report, PDF analysis | Current selection |
| **QR Code Generator** | Download as PNG (300px) | PNG up to 1000px; JPG | SVG, EPS, PNG up to 4000px, PDF | 1 QR code at a time |
| **Base64 Encoder** | Copy encoded/decoded text | Export as TXT file | Batch export, data URI file | Text only |
| **Color Palette Generator** | Copy hex values | Export as CSS variables | ASE, SCSS, Tailwind config, JSON, PNG swatch | 5 colors |
| **Bookmark Search** | Copy search results | Export as URL list (TXT) | HTML bookmarks, CSV, JSON with tags | 10 results |
| **Timestamp Converter** | Copy converted timestamp | Export as TXT | CSV batch results, JSON, iCal | 1 conversion |
| **Color Contrast Checker** | Copy contrast ratio | Export check as TXT | CSV, JSON, PDF compliance report | 1 check |
| **Lorem Ipsum Generator** | Copy generated text | Copy as HTML | Markdown, structured HTML with headings | 3 paragraphs |
| **Unit Converter** | Copy converted value | Export history as TXT | CSV batch results, JSON | 1 conversion |

---

### 3.4 Search Pattern

| Extension | Free Search | Starter Search | Pro Search |
|-----------|------------|----------------|------------|
| **BeLikeNative** | N/A (input-based) | N/A | Search correction history with filters |
| **Cookie Manager** | Text search by cookie name (current site) | Text search across all domains | Regex search across all domains + filter by flag, expiry, size |
| **Clipboard History Pro** | Text search last 25 items | Text search all items | Regex search + filter by type (text, image, link) |
| **Tab Suspender Pro** | Search whitelist domains | Search all suspended tabs | Regex domain matching for rules |
| **JSON Formatter Pro** | Ctrl+F text search in formatted view | JSONPath basic queries | JSONPath + JMESPath queries; search across saved documents |
| **Form Filler Pro** | N/A (profile-based) | Search across profile fields | Regex field matching for custom mappings |
| **Quick Notes** | Text search note titles | Text search note content | Full-text search with tag filters, date ranges, regex |
| **Word Counter** | N/A (selection-based) | Keyword search in analysis | Keyword density search with regex patterns |
| **QR Code Generator** | N/A | Search saved QR codes | Filter by type, date, scan count |
| **Base64 Encoder** | N/A | Search encoding history | Regex search in history |
| **Color Palette Generator** | N/A | Search saved palettes by name | Search by hex value, color range, or tag |
| **Bookmark Search** | Fuzzy search bookmark titles | Full-text search bookmarked page content | Regex search + filter by tag, date, domain |
| **Timestamp Converter** | N/A | Search conversion history | Filter by timezone, date range |
| **Color Contrast Checker** | N/A | Search check history | Filter by pass/fail status, WCAG level, date |
| **Lorem Ipsum Generator** | N/A | N/A | Search custom word lists |
| **Unit Converter** | Search unit categories | Search conversion history | Filter by category, favorites |

**Consistency verification:** Every extension that stores user-generated data supports text search at Starter tier and regex/advanced filtering at Pro tier. Extensions without stored data (pure input-output tools) have N/A search -- this is expected and consistent.

---

### 3.5 Feature Lock Icon Consistency

All 16 extensions must use identical visual treatment for gated features. Deviations will be flagged during code review.

**Standard lock treatment (mandatory for all extensions):**

| Element | Specification |
|---------|--------------|
| **Lock icon** | Zovo crown icon (SVG, 14x14px) in `--zovo-accent` color (#6C5CE7). Placed inline to the right of the feature label. |
| **[PRO] badge** | Pill-shaped badge: `font-size: 10px; font-weight: 600; color: #FFFFFF; background: linear-gradient(135deg, #6C5CE7, #A855F7); border-radius: 10px; padding: 2px 8px;`. Text reads "PRO" for Pro features, "STARTER" for Starter-gated features, "TEAM" for Team features. |
| **Blur treatment** | When a Pro feature has a preview (e.g., a chart, report, or dashboard), show the content with a `filter: blur(4px)` overlay and a centered unlock prompt on top. Never fully hide the feature -- let users see what they are missing. |
| **Disabled state** | Locked buttons use `opacity: 0.6; cursor: not-allowed;` with the crown icon replacing the normal icon. |
| **Hover tooltip** | On hover over any locked element: `"Available with Zovo [Tier]. Unlock now -->"`. Links to pricing page. |

**Implementation checklist:**
- [ ] Every extension imports lock icons from `@zovo/ui-kit` (shared component library)
- [ ] No extension uses custom lock icons, padlock emojis, or non-standard badge styles
- [ ] Lock colors match the Zovo brand palette exactly
- [ ] Badge text uses the tier name, never "Premium" or "Paid" or "Upgrade"
- [ ] Blur overlay has consistent 4px blur radius and identical overlay opacity (0.85) across all extensions

---

### 3.6 Paywall Copy Consistency

**Universal principle:** Every paywall uses "gift framing" (Grammarly-style). The extension tells the user what it already found or did for them, then frames Pro as an enhancement -- never a punishment. The word "locked" never appears in any Zovo paywall. The word "limit" is replaced with the positive frame of what Pro unlocks.

**Template sentence pattern (mandatory for all extensions):**

> "Zovo [what the extension found/did for the user]. [Specific value statement with a number or concrete outcome]. Unlock with [Tier] -->"

**Per-extension paywall copy:**

| Extension | Paywall Copy |
|-----------|-------------|
| **BeLikeNative** | "Zovo improved 3 sentences for you today. Pro members get unlimited corrections -- VAs save an average of 45 minutes per day. Unlock with Pro -->" |
| **Cookie Manager** | "Zovo found 73 cookies on this domain. Export all of them in JSON, Netscape, or CSV format with one click. Unlock with Starter -->" |
| **Clipboard History Pro** | "Zovo saved 25 clipboard items for you. Keep your full copy history and never lose a snippet again. Unlock with Starter -->" |
| **Tab Suspender Pro** | "Zovo freed 1.2 GB of memory by suspending 12 tabs. Add more sites to your always-active list. Unlock with Starter -->" |
| **JSON Formatter Pro** | "Zovo formatted your JSON perfectly. Compare two JSON objects side-by-side to find every difference instantly. Unlock with Pro -->" |
| **Form Filler Pro** | "Zovo filled 10 forms for you today. Create additional profiles for different clients and fill unlimited forms daily. Unlock with Starter -->" |
| **Quick Notes** | "Zovo saved 20 notes for you. Organize them with folders and tags, and sync across all your devices. Unlock with Starter -->" |
| **Word Counter** | "Zovo counted 847 words in your selection. See readability scores and keyword density to optimize your content. Unlock with Pro -->" |
| **QR Code Generator** | "Zovo generated your QR code. Add your brand logo and download in SVG for print-quality output. Unlock with Pro -->" |
| **Base64 Encoder** | "Zovo encoded your text instantly. Encode files, decode JWTs, and batch-process multiple items. Unlock with Pro -->" |
| **Color Palette Generator** | "Zovo extracted 5 colors from this page. Get the full palette and export to CSS, SCSS, or Tailwind config. Unlock with Starter -->" |
| **Bookmark Search** | "Zovo searched 2,400 bookmarks in 0.3 seconds. Search inside bookmarked pages and find dead links automatically. Unlock with Pro -->" |
| **Timestamp Converter** | "Zovo converted your timestamp. Batch-convert log files and compare times across 5+ timezones simultaneously. Unlock with Pro -->" |
| **Color Contrast Checker** | "Zovo checked your contrast ratio: 4.2:1 (AA pass). Run a full-page accessibility audit and export compliance reports. Unlock with Pro -->" |
| **Lorem Ipsum Generator** | "Zovo generated 3 paragraphs for you. Create custom placeholder text in any language with structured HTML output. Unlock with Pro -->" |
| **Unit Converter** | "Zovo converted your value instantly. Add live currency rates, developer units, and batch conversion. Unlock with Pro -->" |

**Footer on every paywall (mandatory):**
> "Includes all 16 Zovo extensions. From $4/month."

This reframes the decision from "pay for one feature" to "pay for an entire productivity suite."

---

### 3.7 Cross-Tier Feature Mapping

This is the definitive tier matrix. Every extension reads the user's tier from `chrome.storage.sync` and applies these exact gates.

| Feature Category | Free ($0) | Starter ($4/mo) | Pro ($7/mo) | Team ($14/mo, 5 seats) |
|-----------------|-----------|-----------------|-------------|----------------------|
| **Core CRUD** (view, create, edit, delete) | Full access | Full access | Full access | Full access |
| **Storage limits** | Low (see 3.1 per-extension) | Medium (3-5x free limits) | Unlimited | Unlimited |
| **Cloud sync** | None (local only) | 2 devices | Unlimited devices | Unlimited devices |
| **Export formats** | 1 basic format (JSON or TXT or PNG) | 2-3 formats | All formats + encrypted | All formats + encrypted |
| **Export scope** | Current context only (current site, current selection) | Current context + expanded | All data, cross-domain, batch | All data, cross-domain, batch |
| **Import** | Basic (1 format, limited count) | Multiple formats, expanded count | All formats, unlimited | All formats, unlimited |
| **Search** | Basic text search (where applicable) | Text search across all stored data | Regex + advanced filters | Regex + advanced filters |
| **Bulk operations** | None | Limited (batch of 10) | Unlimited | Unlimited |
| **Automation / rules** | 1 rule (where applicable) | 5 rules | Unlimited rules | Unlimited rules |
| **Profiles / saved configs** | 1-2 (enough to experience the feature) | 5-10 | Unlimited | Unlimited |
| **Analytics / reports** | Basic stats (current context) | Expanded stats | Full dashboards + export | Full dashboards + export |
| **Customization** | Default theme (light/dark) | 3 themes | Full theme library + custom | Full theme library + custom |
| **Keyboard shortcuts** | Default shortcuts | Default shortcuts | Custom shortcut mapping | Custom shortcut mapping |
| **API / developer access** | None | None | Full API access | Full API access + webhooks |
| **Team sharing** | None | None | None | Full sharing + library |
| **Admin dashboard** | None | None | None | Full admin panel |
| **Shared profiles / configs** | None | None | None | Team-wide shared profiles |
| **Activity / audit log** | None | None | None | Full team activity log |
| **Priority support** | Community forum | Email (48hr response) | Email (24hr response) | Dedicated onboarding + 12hr response |
| **Future extensions** | Basic features only | Expanded features | Full access on launch day | Full access on launch day |
| **Cross-extension integrations** | None | Basic (data passing) | Full (workflow automation) | Full + team orchestration |

---

## PART 4: BUNDLE STRATEGY

### 4.1 Natural Bundles by User Type

While the "All Access" membership is the recommended default, presenting role-specific bundles helps users see immediate personal relevance. These bundles are not separate products -- they are marketing frames for the same membership tiers.

| Bundle | Extensions Included | Target User | Perceived Individual Value | Bundle Price | Savings % |
|--------|-------------------|-------------|---------------------------|-------------|-----------|
| **Developer Bundle** | JSON Formatter ($3), Cookie Manager ($3), Base64 Encoder ($2), Timestamp Converter ($2), Color Contrast Checker ($2) | Frontend/backend developers, QA engineers | $12/month | $4/mo (Starter) | 67% |
| **Writer Bundle** | BeLikeNative ($9), Word Counter ($2), Lorem Ipsum Generator ($1), Quick Notes ($3) | Content writers, VAs doing email/content work | $15/month | $4/mo (Starter) | 73% |
| **Productivity Bundle** | Clipboard History ($3), Form Filler ($4), Tab Suspender ($3), Bookmark Search ($2), QR Code Generator ($2) | Filipino VAs, administrative assistants | $14/month | $4/mo (Starter) | 71% |
| **All Access** | All 16 extensions | Everyone (recommended default) | **$45/month** | **$7/mo (Pro)** | **84%** |

**Visual presentation on pricing page:** Show all four bundles in a horizontal row. The All Access bundle should be 1.2x the size of the others, centered, with a "BEST VALUE" badge and a subtle glow/shadow treatment. The three role-specific bundles flank it, clearly showing they are subsets.

---

### 4.2 Bundle Pricing Psychology

**Anchor pricing display (critical for conversion):**

```
  Developer         Writer          ALL ACCESS         Productivity
  5 tools           4 tools         16 tools           5 tools
  ~~$12/mo~~        ~~$15/mo~~      ~~$45/mo~~         ~~$14/mo~~
  $4/mo             $4/mo           $7/mo              $4/mo
  Save 67%          Save 73%        Save 84%           Save 71%
                                    ★ MOST POPULAR ★
```

**Decoy effect implementation:**

The Starter tier at $4/month for a role bundle (5 tools) makes the Pro tier at $7/month for ALL 16 tools feel like the obvious choice. The math is immediate: $3 more per month buys 11 additional tools. This is textbook decoy pricing -- the Starter tier exists not primarily to generate revenue at $4, but to make the $7 Pro tier feel like a steal.

**Specific psychological triggers to deploy:**

1. **Struck-through anchor price.** Always show `~~$45/mo~~` next to `$7/mo`. Stanford research confirms this lifts conversion by 35%. The gap between $45 and $7 is large enough to trigger deal-seeking behavior without seeming implausible, because each individual tool's price is modest and credible.

2. **"Price of a coffee" reframe.** At $7/month, the cost is $0.23/day or $1.75/week. Use the copy: "Less than one coffee a week for your entire toolkit." For the Filipino VA audience, localize: "Less than a Jollibee meal per month."

3. **Loss aversion on annual.** Show annual pricing as the default. When users toggle to monthly, display: "You'd save $24/year with annual billing" in orange text. The loss frame ("you'd save") outperforms the gain frame ("get 2 months free") by 15-20% in A/B tests.

4. **Social proof counter.** Below the Pro tier: "Join 3,300+ professionals using Zovo" (current BeLikeNative user count -- update this number as the portfolio grows).

5. **Per-tool cost breakdown.** Under the All Access price: "$7 / 16 tools = $0.44 per tool per month." This micro-price makes each tool feel essentially free.

---

### 4.3 Recommended Final Zovo Pricing

This is the definitive pricing document. All extensions, all tiers, all features.

| Tier | Monthly | Annual (per mo) | Annual Total | What's Included | Target User | Key Differentiator |
|------|---------|-----------------|-------------|-----------------|-------------|-------------------|
| **Free** | $0 | $0 | $0 | All 16 extensions with core features. Hard limits per extension (see Section 3.1). Local storage only. 1 basic export format. No sync. No bulk operations. No automation. Community forum support. | Evaluators, students, casual users who need 1-2 tools occasionally | Genuinely useful -- drives installs, reviews, and word-of-mouth |
| **Starter** | $4/mo | $3/mo | $36/yr | All 16 extensions with expanded limits (3-5x free). Cloud sync across 2 devices. 2-3 export formats per tool. Text search across all data. Up to 5 automation rules. Up to 10 profiles/configs. Email support (48hr). | Filipino VAs, budget freelancers, individual users who hit free limits within their first week | Under the $5 psychological barrier. Cross-device sync is the killer feature for VAs who work on laptop + desktop. |
| **Pro** | $7/mo | $5/mo | $60/yr | All 16 extensions with unlimited usage. Unlimited cloud sync. All export formats including encrypted. Regex search. Unlimited automation rules. Unlimited profiles. Full analytics dashboards. Custom keyboard shortcuts. API access. All future extensions included on launch day. Priority email support (24hr). | Power users, developers, professional VAs, content creators, anyone who uses 3+ extensions daily | Unlimited everything. The "default choice" -- designed to be the obviously best value via decoy pricing against Starter. |
| **Team** | $14/mo | $10/mo | $120/yr | Everything in Pro for up to 5 users ($2.80/seat effective). Admin dashboard with usage analytics. Shared profiles, configs, and templates across team. Team clipboard sharing. Activity/audit log. Role-based access controls. Dedicated onboarding call. Priority support (12hr). | VA agencies, dev teams (3-5 people), small companies with shared workflows | Team sharing and admin controls. The per-seat math ($2.80) makes it an easy line-item expense for any agency. |

**Per-extension feature access by tier (summary reference):**

| Extension | Free | Starter ($4) | Pro ($7) | Team ($14) |
|-----------|------|-------------|----------|-----------|
| BeLikeNative | 3 corrections/day, 1 language | 30/day, 3 languages | Unlimited, all 84 languages, tone control | + team/classroom mode |
| Cookie Manager | 2 profiles, 25-cookie export, 1 rule | 10 profiles, 200 export, 10 rules | Unlimited, all formats, monitoring | + shared profiles, env presets |
| Clipboard History | 25 items, 3 pins | 200 items, 20 pins | Unlimited, folders, snippets | + team clipboard sharing |
| Tab Suspender | 30-min timer, 5-site whitelist | Custom timers, 25-site whitelist | Unlimited whitelist, session save | + team session templates |
| JSON Formatter | Format, validate, tree view | + JSONPath basic queries | + diff, schema validation, all exports | + shared schemas |
| Form Filler | 1 profile, 10 fills/day | 5 profiles, 50 fills/day | Unlimited profiles and fills | + team-shared profiles |
| Quick Notes | 20 notes, basic rich text | 100 notes, folders, tags | Unlimited, markdown, sync | + shared team notes |
| Word Counter | Basic counts, reading time | + keyword density | + readability scores, export | + team writing analytics |
| QR Code Generator | Static URL QR, PNG 300px | Custom colors, 1000px | Logo, batch, SVG, analytics | + branded team templates |
| Base64 Encoder | Text encode/decode | File encoding up to 1MB | Unlimited, batch, JWT decode | + shared encoding presets |
| Color Palette | 5 colors, copy hex | Full palette, save | Export ASE/CSS/SCSS/Tailwind | + shared brand palettes |
| Bookmark Search | Fuzzy title search | Full-text content search, tags | Dead links, bulk ops, analytics | + shared collections |
| Timestamp Converter | Single convert | Batch, 5-zone grid | Unlimited zones, log parser | + team timezone presets |
| Color Contrast | Manual 2-color, AA | Full-page audit, AAA | Blindness sim, reports, batch | + shared compliance reports |
| Lorem Ipsum | 1-3 paragraphs | Custom length, HTML | Custom lists, multi-language | + team content templates |
| Unit Converter | 5 categories | 10 categories, history | All 15+, live currency, batch | + shared custom units |

---

### 4.4 Pricing Page Copy Recommendations

**Headline:**
> 16 pro tools. One membership. Save 84%.

**Subheadline:**
> Everything a VA, developer, or content creator needs in Chrome -- from grammar correction to cookie management. $45/month value, starting at $4.

**Per-tier descriptions:**

| Tier | Description | CTA Button Text |
|------|-------------|-----------------|
| **Free** | "Get started with all 16 tools. No credit card, no trial -- just useful software. Upgrade when you're ready." | **Get Started Free** |
| **Starter** | "For professionals who need more. Sync across devices, export your work, and unlock expanded limits on every tool." | **Start for $4/mo** |
| **Pro** | "Unlimited everything. All 16 tools, all features, all future extensions. The complete Zovo experience." | **Go Pro -- $7/mo** *(highlighted as recommended)* |
| **Team** | "Built for teams of up to 5. Shared profiles, admin controls, and onboarding support. Just $2.80 per person." | **Get Team Access** |

**Annual billing nudge (appears above the pricing cards):**
> Toggle: [Monthly] / [**Annual -- Save 30%**]
> Annual should be the DEFAULT selection. When users click "Monthly," show: "Switch to annual and save $24/year" in a subtle orange banner.

**FAQ Section (minimum 5 items):**

**Q: Can I use just one extension for free?**
A: Absolutely. Every Zovo extension works independently and is genuinely useful at the free tier. You can use Cookie Manager without ever installing BeLikeNative, and vice versa. The membership unlocks advanced features across whichever extensions you use.

**Q: What happens when I cancel my subscription?**
A: Your data stays. You keep all your notes, profiles, clipboard history, and saved configurations. You simply revert to the free tier limits -- nothing is deleted. If you re-subscribe later, everything is exactly where you left it.

**Q: Do you offer refunds?**
A: Yes. We offer a full refund within 14 days of any payment, no questions asked. If you subscribed annually and want a refund after 14 days, we will issue a prorated refund for unused months.

**Q: I only need BeLikeNative. Why should I pay for 16 tools?**
A: You are not paying for 16 tools -- you are paying for unlimited BeLikeNative. The other 15 tools are included at no extra cost. At $7/month for Pro, you are paying less than BeLikeNative's previous standalone price of $6/month for the Native tier, and you get 15 bonus tools.

**Q: How does Team pricing work?**
A: The Team plan covers up to 5 users for $14/month ($2.80 per person). Each team member gets their own account with full Pro features, plus shared profiles, team clipboard, and an admin dashboard. Need more than 5 seats? Contact us for custom pricing.

**Q: Do I need to install all 16 extensions?**
A: No. Install only what you need. Your membership applies to any Zovo extension you install -- now or in the future. We are continuously adding new tools, and Pro/Team members get instant access to every new release.

**Q: Is my data private and secure?**
A: Yes. Zovo extensions process data locally in your browser. Cloud sync (Starter and above) uses AES-256 encryption in transit and at rest. We never sell data, never show ads, and never access your cookies, clipboard, or notes. Our privacy policy is plain-language and public.

**Q: Do you offer discounts for students or nonprofits?**
A: Yes. Students get 50% off any plan with a valid .edu email address. Nonprofits with fewer than 10 employees qualify for the same discount. Email support@zovo.app with your details.

---

### 4.5 Upgrade Path Psychology

Each transition point requires a distinct psychological trigger. Below are the specific mechanisms, copy, and timing for each upgrade path.

**Free to Starter ($0 to $4/mo) -- Crossing the first-dollar barrier:**

The hardest conversion in the entire funnel. The user must go from "this is a free tool" to "I am paying for software." For Filipino VAs earning $3-7/hr, $4/month is 30-60 minutes of work.

- **Primary trigger:** Usage limit hit (clipboard fills up, cookie export blocked, form fill quota exhausted). The user is mid-task and blocked.
- **Psychological lever:** Loss aversion. The user already created data (clipboard items, cookie profiles, notes) that they will lose access to if they do not upgrade. The paywall shows their data behind a blur and says "Your 25 clipboard items are safe. Unlock them with Starter."
- **Friction reduction:** Offer a 7-day free trial of Starter. No credit card required for the trial if the user has a Zovo account. After 7 days, show a gentle "Your trial ended. Keep your expanded limits for $4/mo?" prompt.
- **Social proof:** "Join 3,300+ VAs and developers who use Zovo Pro tools daily." Update this number monthly.
- **Employer reframe:** For the VA audience specifically, add: "Ask your client to cover this -- most do. Here is a template email you can send." Provide a one-click copyable email template requesting tool reimbursement.

**Starter to Pro ($4 to $7/mo) -- The $3 jump:**

This is the conversion Zovo should optimize hardest. The $3 increment is small, but it unlocks unlimited usage -- which means Pro users are far stickier (lower churn) and have higher lifetime value.

- **Primary trigger:** User hits a Starter limit that Pro would remove (regex search, unlimited profiles, encrypted export, API access). Timing: after 2-4 weeks of active Starter use, when the user is committed.
- **Psychological lever:** Decoy effect. The Starter tier is designed to feel "almost enough" but not quite. At $4 for limited features vs $7 for unlimited everything, the math is obvious: $3 more buys 3x the capability.
- **In-product nudge:** Show a persistent (but dismissable) banner: "You are using 4 of 16 Zovo tools. Upgrade to Pro and unlock unlimited features across all of them -- just $3 more per month."
- **Annual lock-in:** When a Starter user considers upgrading, default the upgrade page to annual Pro ($5/mo). Show: "Upgrade to Pro Annual: $5/mo. You save $24/year compared to monthly, and $480/year compared to buying tools separately."

**Pro to Team ($7 to $14/mo) -- When team makes sense:**

This conversion is event-driven, not usage-driven. It happens when a user shares their Zovo workflow with a colleague and realizes they need shared access.

- **Primary trigger:** User attempts to share a cookie profile, clipboard snippet, or form fill config with someone else. Or user mentions "team" in a support email. Or user installs Zovo on a second account.
- **Psychological lever:** Per-seat math. "$14/month for your team of 5 = $2.80 per person. That is less than a single cup of coffee per teammate per month."
- **Upgrade prompt timing:** Only show the Team upsell when the user performs a sharing action (export for someone else, "Share" button click). Never show Team prompts to solo users -- it is irrelevant and annoying.
- **Agency pitch:** For users who identify as VAs or agencies (detected via BeLikeNative usage patterns or self-reported during onboarding): "VA agencies: onboard new team members in minutes with shared profiles and templates. One admin dashboard for your entire team."

**Monthly to Annual -- Nudging long-term commitment:**

Annual subscribers churn at 2-3x lower rates and have 30-40% higher LTV. Every pricing interaction should default to annual.

- **Default selection:** On the pricing page, the annual toggle is ON by default. Monthly pricing is shown in smaller text below annual.
- **Savings badge:** Next to every annual price, show a green badge: "Save 30%" or "2 months free." Both frames work -- A/B test to determine which converts better for the VA audience.
- **Upgrade prompt for monthly subscribers:** After 60 days of monthly billing, show: "You have paid $14 over 2 months. Switch to annual and your next 12 months cost just $60 total -- that is $5/mo instead of $7/mo. You would save $24 this year." The specific dollar amount ("$24") outperforms percentage framing for price-sensitive audiences.
- **Annual-only perks:** Consider offering one small perk exclusive to annual subscribers: early access to new extensions, or a "Zovo Annual" badge on their profile. This creates a status incentive beyond the price savings.
- **Cancellation deflection:** When a monthly subscriber attempts to cancel, offer: "Before you go -- switch to annual at $5/mo (30% less than you have been paying) and keep all your data synced." This catches price-sensitive churners who like the product but find monthly billing too expensive.

---

## Summary

Parts 3 and 4 establish the operational backbone of Zovo's monetization: consistent patterns that scale across 16 extensions (Part 3) and a bundle strategy that makes the All Access Pro tier feel like the only rational choice (Part 4).

**Key numbers to remember:**
- Individual perceived value stack: **$45/month**
- All Access Pro price: **$7/month**
- Savings framing: **84%**
- Per-tool cost: **$0.44/month**
- Per-seat Team cost: **$2.80/month**
- Annual savings vs monthly: **30%** ($24/year on Pro)

**Three actions that matter most:**
1. Default every pricing interaction to annual billing
2. Show the struck-through $45 anchor price everywhere
3. Use gift framing on every paywall -- never say "locked"
