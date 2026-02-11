# Feature Value Analysis -- Part 1: Scoring Framework & Top 6 Extension Matrix

**Phase:** 03 -- Feature Value Scoring
**Date:** 2026-02-11
**Portfolio:** Zovo Chrome Extensions (18+ extensions, unified membership)
**Pricing:** Free / $4 Starter / $7 Pro / $14 Team (5 seats) | Annual ~30% discount
**Current state:** BeLikeNative flagship at 3,300 users, $400 MRR

---

## Part 1: Value Scoring Framework

### Purpose

Every feature must earn its tier placement based on measurable strategic value. This framework produces a tier assignment for any feature in any extension using five weighted dimensions.

### The Five Dimensions

| # | Dimension | Weight | What It Measures |
|---|-----------|--------|------------------|
| D1 | Acquisition Power | 25% | Does this feature drive installs? |
| D2 | Habit Formation | 20% | Does this feature create daily/weekly dependency? |
| D3 | Upgrade Trigger | 25% | Does limiting this feature create a compelling reason to pay? |
| D4 | Differentiation | 15% | Does this feature separate Zovo from competitors? |
| D5 | Cost to Serve | 15% | How expensive is it to provide at scale? |

### Scoring Rubric (1-10 for each dimension)

**D1: Acquisition Power** -- 10 = primary install reason; 5 = nice to have; 1 = discovered post-install.

**D2: Habit Formation** -- 10 = used multiple times daily; 5 = used weekly; 1 = used rarely.

**D3: Upgrade Trigger** -- 10 = strong emotional response at limit (frustration, urgency); 5 = mild friction; 1 = user does not care.

**D4: Differentiation** -- 10 = no competitor has this; 5 = some competitors have it; 1 = everyone has it.

**D5: Cost to Serve** -- 10 = zero cost (local only); 5 = minimal server cost; 1 = expensive (AI API calls, sync infrastructure).

### Weighted Score Formula

```
Weighted Score = (D1 x 0.25) + (D2 x 0.20) + (D3 x 0.25) + (D4 x 0.15) + (D5 x 0.15)
```

### Tier Assignment Rules

| Weighted Score | Default Tier | Strategic Logic |
|---------------|--------------|-----------------|
| 8.0+ | **FREE** | High acquisition + habit. Gating kills adoption. |
| 6.0 -- 7.9 | **LIMITED FREE** | Attracts users; cap creates upgrade moment. |
| 4.0 -- 5.9 | **PRO** | Strong upgrade driver. Low acquisition impact if gated. |
| Below 4.0 | **PRO or CUT** | Keep if differentiation is high (D4 >= 7); otherwise cut. |

### Strategic Override Rules

The weighted score provides the default tier. The following overrides take precedence:

1. **Table-stakes override (FREE):** If every major competitor offers a feature for free AND gating it would generate negative reviews, the feature is FREE regardless of score. These features inherently score low on D3 and D4 (cannot trigger upgrades, not differentiated) which drags their weighted score below the FREE threshold. This is expected -- the formula correctly identifies them as weak monetization candidates, but they must remain free for competitive reasons.

2. **Upgrade-power override (PRO):** If D3 >= 9 (strong upgrade trigger), the feature should be PRO or LIMITED FREE even if the weighted score lands in the LIMITED FREE range. The conversion value outweighs the acquisition value.

3. **Cost override (PRO):** If D5 <= 2 (expensive to serve), the feature should be PRO or LIMITED FREE regardless of other scores. Giving away expensive features destroys unit economics.

---

## Part 2: Master Feature Matrix -- Top 6 Extensions

---

### Extension 1: Cookie Manager

**Market context:** 100% free competitor landscape. EditThisCookie (3M+ users) removed Dec 2024. Cookie management is a funnel, not a standalone revenue product.

| Feature | D1 | D2 | D3 | D4 | D5 | Weighted | Tier |
|---------|----|----|----|----|----|---------:|------|
| View/edit/delete cookies | 10 | 9 | 1 | 1 | 10 | 6.20 | FREE* |
| Search & filter (text) | 9 | 8 | 2 | 2 | 10 | 6.15 | FREE* |
| Export (JSON) | 8 | 5 | 7 | 3 | 10 | 6.70 | LIMITED FREE |
| Import (JSON) | 7 | 4 | 6 | 3 | 10 | 6.00 | LIMITED FREE |
| Cookie profiles | 6 | 7 | 10 | 8 | 10 | 8.10 | LIMITED FREE |
| Auto-delete rules | 5 | 6 | 9 | 5 | 8 | 6.65 | LIMITED FREE |
| Whitelist/blacklist | 4 | 5 | 3 | 5 | 8 | 4.70 | PRO |
| Dark/light mode | 5 | 5 | 1 | 1 | 10 | 4.15 | FREE* |
| Cookie protection | 3 | 4 | 4 | 6 | 10 | 4.95 | LIMITED FREE |
| Bulk operations | 3 | 5 | 8 | 9 | 10 | 6.60 | PRO** |
| Snapshots + diff | 2 | 3 | 7 | 10 | 10 | 5.85 | PRO |
| Real-time monitoring | 2 | 4 | 6 | 10 | 9 | 5.65 | PRO |
| Cookie Health Score | 3 | 3 | 8 | 10 | 8 | 6.05 | LIMITED FREE |
| GDPR compliance scan | 2 | 2 | 7 | 10 | 3 | 4.60 | PRO |
| cURL generation | 5 | 5 | 5 | 9 | 10 | 6.35 | LIMITED FREE |
| Encrypted vault | 1 | 1 | 4 | 8 | 10 | 4.15 | PRO |
| Cross-device sync | 1 | 3 | 6 | 8 | 3 | 4.00 | PRO |
| Team sharing | 1 | 2 | 5 | 9 | 3 | 3.70 | TEAM |

*Table-stakes override: every competitor offers free. **Upgrade-power override: D3=8 makes this a strong PRO conversion driver.

**Free vs Pro Split**

| Tier | Feature | Limit |
|------|---------|-------|
| FREE | View/edit/delete cookies | Unlimited |
| FREE | Search & filter (plain text) | Unlimited |
| FREE | Dark/light mode | Full |
| LIMITED FREE | Export (JSON) | Current domain, max 25 cookies |
| LIMITED FREE | Import (JSON) | Single domain, max 25 cookies |
| LIMITED FREE | Cookie profiles | 2 profiles total |
| LIMITED FREE | Auto-delete rules | 1 rule |
| LIMITED FREE | Cookie protection | 5 protected cookies |
| LIMITED FREE | Cookie Health Score | Badge only; details blurred |
| LIMITED FREE | cURL generation | Current site only |
| PRO ($4+) | Whitelist/blacklist | Unlimited (free: 5 domains) |
| PRO ($4+) | Bulk operations | Full cross-domain select + batch |
| PRO ($7) | Snapshots + diff | 50 snapshots, visual diff |
| PRO ($7) | Real-time monitoring | Full event log with filters |
| PRO ($7) | GDPR compliance scan | Unlimited scans, PDF export |
| PRO ($7) | Encrypted vault | AES-256 with passphrase |
| PRO ($7) | Cross-device sync | Via Zovo cloud |
| PRO ($7) | Regex search + saved filters | Full JS regex, 20 filters |
| PRO ($7) | All export formats | JSON, Netscape, CSV, Header |
| TEAM ($14) | Team sharing | Shared profiles, 5 seats |

**Primary Paywall Trigger -- Profile Limit (T1)**
> "You've saved 2 cookie profiles -- nice workflow! Unlock unlimited profiles to manage every environment and client account. Includes 18+ Zovo tools. From $3/mo."

**Secondary Paywall Trigger -- Export Limit (T3)**
> "You have 73 cookies on this domain. Free accounts can export up to 25. Upgrade to export all cookies in JSON, Netscape, CSV, or Header format -- no limits."

**Expected Conversion Rate: 5-7%** -- Profile limit catches developers mid-workflow. Blurred Health Score creates persistent curiosity. Capped by 100% free competitor landscape.

---

### Extension 2: Clipboard History Pro

**Market context:** Paid models exist (Paste for Mac, $1.99/mo). VAs copy-paste hundreds of times daily. High-frequency, high-dependency category.

| Feature | D1 | D2 | D3 | D4 | D5 | Weighted | Tier |
|---------|----|----|----|----|----|---------:|------|
| Copy history storage | 10 | 10 | 8 | 3 | 10 | 8.45 | LIMITED FREE |
| Search clipboard | 8 | 9 | 3 | 3 | 10 | 6.50 | FREE* |
| Pin items | 5 | 7 | 6 | 5 | 10 | 6.40 | LIMITED FREE |
| Categories/folders | 3 | 5 | 7 | 6 | 10 | 5.90 | PRO |
| Text expander snippets | 4 | 9 | 9 | 7 | 10 | 7.60 | LIMITED FREE |
| Floating widget | 5 | 6 | 4 | 5 | 10 | 5.70 | PRO |
| Password lock | 3 | 2 | 5 | 6 | 10 | 4.80 | PRO |
| Keyboard shortcuts | 7 | 8 | 3 | 4 | 10 | 6.20 | FREE* |
| Cloud sync | 1 | 4 | 7 | 7 | 3 | 4.30 | PRO |
| Export history | 2 | 2 | 4 | 4 | 10 | 4.00 | PRO |

*Table-stakes override: clipboard search and keyboard shortcuts are baseline UX expectations.

**Free vs Pro Split**

| Tier | Feature | Limit |
|------|---------|-------|
| FREE | Search clipboard | Full text search |
| FREE | Keyboard shortcuts | Basic paste-from-history |
| LIMITED FREE | Copy history storage | 25 items rolling |
| LIMITED FREE | Pin items | 3 pinned items |
| LIMITED FREE | Text expander snippets | 5 snippets |
| PRO ($4+) | Unlimited history | No rolling cap |
| PRO ($4+) | Categories/folders | Organize clips into groups |
| PRO ($4+) | Floating widget | Persistent overlay |
| PRO ($4+) | Password lock | PIN/biometric lock |
| PRO ($7) | Cloud sync | Cross-device via Zovo cloud |
| PRO ($7) | Export history | CSV/JSON export |
| PRO ($7) | Unlimited pins + snippets | No caps |

**Primary Paywall Trigger -- 26th Clipboard Item**
> "Your clipboard history is full. Older items will be replaced. Upgrade to keep unlimited history and never lose a copied item. Includes 18+ Zovo tools."

**Secondary Paywall Trigger -- 6th Snippet**
> "Text snippets save hours of retyping. You've created 5 -- that's the free limit. Unlock unlimited snippets with Zovo Pro."

**Expected Conversion Rate: 8-12%** -- VAs hit the 25-item limit within 1-2 hours. Loss aversion ("older items will be replaced") is the strongest emotional trigger in the portfolio.

---

### Extension 3: BeLikeNative (Optimize Existing)

**Market context:** $400 MRR on 3,300 users (~3.6% conversion). Grammarly dominates at $12/mo for native speakers. BeLikeNative targets non-native speakers. AI API costs are the highest in the portfolio.

| Feature | D1 | D2 | D3 | D4 | D5 | Weighted | Tier |
|---------|----|----|----|----|----|---------:|------|
| Grammar correction | 10 | 10 | 9 | 3 | 1 | 7.35 | LIMITED FREE |
| Rephrasing | 8 | 8 | 7 | 5 | 1 | 6.25 | LIMITED FREE |
| Tone adjustment | 5 | 6 | 6 | 6 | 1 | 5.00 | PRO |
| Multi-language | 7 | 6 | 5 | 8 | 1 | 5.55 | PRO*** |
| Custom prompts | 2 | 5 | 6 | 7 | 1 | 4.20 | PRO |
| Vocabulary builder | 3 | 4 | 4 | 8 | 3 | 4.20 | PRO |
| Citation formatting | 2 | 2 | 3 | 6 | 1 | 2.70 | PRO |
| Team/classroom mode | 1 | 3 | 5 | 8 | 3 | 3.75 | TEAM |
| Priority AI processing | 1 | 3 | 7 | 5 | 1 | 3.50 | PRO |

***Cost override: D5=1 (expensive AI calls per language). Free tier limited to 1 language.

**Free vs Pro Split**

| Tier | Feature | Limit |
|------|---------|-------|
| LIMITED FREE | Grammar correction | 15 corrections/day (down from 20) |
| LIMITED FREE | Rephrasing | 3 suggestions/day, 1 alternative |
| FREE | Correction UI | Underline highlights, full interface |
| PRO ($4+) | Unlimited corrections | No daily cap |
| PRO ($4+) | Unlimited rephrasing | 5 alternatives with tone labels |
| PRO ($4+) | Tone adjustment | Professional, casual, academic, etc. |
| PRO ($4+) | All 84 languages | Switch anytime (free: 1 language) |
| PRO ($7) | Custom prompts | User-defined rewrite instructions |
| PRO ($7) | Vocabulary builder | Spaced repetition from corrections |
| PRO ($7) | Priority AI processing | Faster response, queue priority |
| TEAM ($14) | Team/classroom mode | Shared style guides, 5 seats |

**Primary Paywall Trigger -- Daily Limit**
> "You've used 15 of 15 free corrections today. Your writing is improving -- keep going. Unlimited corrections start at $3/mo."

**Secondary Paywall Trigger -- Second Language**
> "BeLikeNative Free supports 1 language. Want to add Spanish? Unlock all 84 languages with Zovo Pro."

**Expected Conversion Rate: 6-8% (up from 3.6%)** -- Reducing daily limit from 20 to 15 increases upgrade pressure. 15 corrections covers a short email but not a full work session. Filipino VAs write English professionally every day = daily trigger exposure. Annual plan optimization should lift ARPU from ~$3.60 to $5+.

---

### Extension 4: JSON Formatter Pro

**Market context:** JSON Formatter has 1M+ users, entirely free. Differentiation requires developer workflow tools (diff, query, schema). Developer willingness to pay is 2-3x higher than general users.

| Feature | D1 | D2 | D3 | D4 | D5 | Weighted | Tier |
|---------|----|----|----|----|----|---------:|------|
| Auto-format JSON | 10 | 10 | 1 | 1 | 10 | 6.40 | FREE* |
| Collapsible tree view | 9 | 9 | 1 | 3 | 10 | 6.25 | FREE* |
| Syntax highlighting | 9 | 8 | 1 | 2 | 10 | 5.90 | FREE* |
| Copy path | 7 | 7 | 3 | 5 | 10 | 6.15 | FREE* |
| Editable JSON | 5 | 6 | 8 | 7 | 10 | 7.00 | LIMITED FREE |
| Diff comparison | 3 | 4 | 9 | 8 | 10 | 6.50 | PRO** |
| JSONPath queries | 2 | 5 | 7 | 9 | 10 | 6.10 | PRO |
| Schema validation | 2 | 3 | 6 | 8 | 8 | 5.00 | PRO |
| Export to CSV/YAML | 3 | 3 | 6 | 6 | 10 | 5.25 | PRO |
| Dark themes (10+) | 6 | 4 | 2 | 3 | 10 | 4.75 | FREE* |
| Clipboard JSON formatting | 8 | 8 | 4 | 6 | 10 | 7.00 | FREE* |

*Table-stakes override: basic formatting features must match free competitors. **Upgrade-power override: D3=9 makes this a key conversion driver.

**Free vs Pro Split**

| Tier | Feature | Limit |
|------|---------|-------|
| FREE | Auto-format JSON | Unlimited |
| FREE | Collapsible tree view | Full |
| FREE | Syntax highlighting | 3 themes |
| FREE | Copy path to node | Full |
| FREE | Dark themes | 3 themes (light, dark, system) |
| FREE | Clipboard JSON formatting | Paste and format |
| LIMITED FREE | Editable JSON | Edit values only (not keys/structure) |
| PRO ($4+) | Full JSON editing | Add/remove keys, restructure |
| PRO ($4+) | Diff comparison | Side-by-side diff |
| PRO ($7) | JSONPath queries | JSONPath/JMESPath |
| PRO ($7) | Schema validation | JSON Schema draft 7+ |
| PRO ($7) | Export to CSV/YAML | Format conversion |
| PRO ($7) | 10+ premium themes | Monokai, Solarized, Dracula |

**Primary Paywall Trigger -- Diff Attempt**
> "Paste two JSON objects to see exactly what changed. JSON Diff is available with Zovo Pro -- perfect for comparing API responses and config files."

**Secondary Paywall Trigger -- Key/Structure Edit**
> "Editing values is free. Need to add keys, restructure, or validate schemas? Unlock the full editor with Zovo Pro."

**Expected Conversion Rate: 5-8%** -- Auto-activates on every JSON API response (high passive engagement). Diff trigger catches developers at peak friction. Free tier must be the best formatter available to win installs.

---

### Extension 5: Form Filler Pro

**Market context:** Easy Autofill (100K+ users) validates the daily-limit model. Filipino VAs fill 50-100+ forms daily. Core job function for the target audience.

| Feature | D1 | D2 | D3 | D4 | D5 | Weighted | Tier |
|---------|----|----|----|----|----|---------:|------|
| Auto-fill forms | 10 | 10 | 7 | 3 | 10 | 8.20 | LIMITED FREE |
| Saved profiles | 8 | 9 | 9 | 5 | 10 | 8.30 | LIMITED FREE |
| Custom field mappings | 4 | 6 | 7 | 7 | 10 | 6.50 | PRO |
| Dropdown/checkbox support | 8 | 8 | 5 | 5 | 10 | 7.10 | FREE* |
| Import/export profiles | 3 | 3 | 5 | 5 | 10 | 4.85 | PRO |
| Team-shared profiles | 1 | 4 | 6 | 8 | 5 | 4.50 | TEAM |
| Regex field detection | 2 | 5 | 5 | 8 | 10 | 5.45 | PRO |

*Table-stakes override: dropdown/checkbox fill is expected as part of form filling.

**Free vs Pro Split**

| Tier | Feature | Limit |
|------|---------|-------|
| FREE | Dropdown/checkbox support | Full (within daily limit) |
| FREE | Basic field detection | Standard HTML fields |
| LIMITED FREE | Auto-fill forms | 10 fills/day |
| LIMITED FREE | Saved profiles | 1 profile |
| PRO ($4+) | Unlimited daily fills | No cap |
| PRO ($4+) | Unlimited profiles | Per client, per form type |
| PRO ($4+) | Custom field mappings | Any profile field to any form field |
| PRO ($7) | Regex field detection | Custom framework fields |
| PRO ($7) | Import/export profiles | Share as JSON |
| TEAM ($14) | Team-shared profiles | Shared library, 5 seats |

**Primary Paywall Trigger -- 2nd Profile**
> "You have 1 saved profile. Managing multiple clients? Unlock unlimited profiles -- one per client, per form, per workflow."

**Secondary Paywall Trigger -- 11th Fill**
> "You've used 10 of 10 free fills today. At your pace, Zovo Pro saves 2+ hours/week. Unlimited fills from $3/mo."

**Expected Conversion Rate: 8-12%** -- Highest in the portfolio for the VA audience. VAs hit the 10-fill limit by mid-morning. 1-profile limit forces paywall on first session for multi-client VAs. $3/mo vs $3-7/hr wage = near-automatic upgrade.

---

### Extension 6: Quick Notes

**Market context:** Dominated by Notion, Keep, Obsidian. Chrome extension notes serve a niche: lightweight, in-browser, no app-switching. Page-context notes (anchored to URLs) are the differentiator.

| Feature | D1 | D2 | D3 | D4 | D5 | Weighted | Tier |
|---------|----|----|----|----|----|---------:|------|
| Create notes | 10 | 8 | 5 | 2 | 10 | 7.15 | LIMITED FREE |
| Rich text editing | 8 | 7 | 3 | 4 | 10 | 6.25 | FREE* |
| Markdown support | 4 | 5 | 5 | 5 | 10 | 5.50 | PRO |
| Folders/tags | 3 | 5 | 7 | 5 | 10 | 5.75 | PRO |
| Full-text search | 7 | 7 | 4 | 4 | 10 | 6.25 | FREE* |
| Page-context notes | 5 | 7 | 6 | 8 | 10 | 6.85 | LIMITED FREE |
| Cloud sync | 1 | 4 | 7 | 5 | 3 | 4.00 | PRO |
| Note linking | 2 | 4 | 5 | 7 | 10 | 5.10 | PRO |

*Table-stakes override: rich text editing and search are baseline note-taking features.

**Free vs Pro Split**

| Tier | Feature | Limit |
|------|---------|-------|
| FREE | Rich text editing | Bold, italic, lists |
| FREE | Full-text search | All stored notes |
| LIMITED FREE | Create notes | 20 notes total |
| LIMITED FREE | Page-context notes | 5 URL-anchored notes |
| PRO ($4+) | Unlimited notes | No cap |
| PRO ($4+) | Folders/tags | Hierarchical folders, tag system |
| PRO ($4+) | Markdown support | Full markdown with preview |
| PRO ($7) | Cloud sync | Cross-device via Zovo cloud |
| PRO ($7) | Note linking | Bidirectional wiki-style links |
| PRO ($7) | Unlimited page-context notes | No cap |

**Primary Paywall Trigger -- 21st Note**
> "You've created 20 notes -- Quick Notes is part of your workflow now. Unlock unlimited notes, folders, and cloud sync. Includes 18+ Zovo tools."

**Secondary Paywall Trigger -- 6th Page-Context Note**
> "Page-context notes anchor thoughts to specific pages. You've used 5 of 5 free slots. Unlimited with Zovo Pro."

**Expected Conversion Rate: 5-8%** -- Note data creates lock-in (20 notes = switching cost). Casual users last 6-8 weeks; active users hit the wall in 2-3 weeks. Page-context notes are unique -- no competitor anchors notes to URLs.

---

## Conversion Rate Summary

| Extension | Conv. Rate | Primary Driver | MRR at 5K users |
|-----------|-----------|----------------|-----------------|
| Clipboard History Pro | 8-12% | Loss aversion on rolling limit | $150-250 |
| Form Filler Pro | 8-12% | Daily fill limit for VAs | $150-300 |
| BeLikeNative | 6-8% | Daily correction limit | +$200-400 |
| Quick Notes | 5-8% | Data lock-in at 20 notes | $75-150 |
| JSON Formatter Pro | 5-8% | Diff comparison for devs | $100-200 |
| Cookie Manager | 5-7% | Profile limit + health score | $75-175 |

**Portfolio projection:** Top 6 extensions at 5K users each project $750-1,475/mo combined incremental MRR. At 25K users each (12-18 month target), the range is $3,750-7,375/mo, excluding 15-25% cross-sell uplift from Zovo membership discovery.

---

*End of Part 1. Part 2 covers the remaining 11 Zovo extensions with priority-ranked implementation recommendations.*
