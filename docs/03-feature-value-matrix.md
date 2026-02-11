# 03 - Feature Value Matrix: Zovo Portfolio

## Phase 03 Complete | Generated 2026-02-11

---

## Executive Summary

This report quantifies the exact value of every feature across the entire 17-extension Zovo portfolio. It establishes a consistent scoring framework, assigns free/pro tiers to every feature, defines bundle strategy, and provides a 90-day implementation plan.

**Total output:** 2,031 lines across 5 detailed documents from 5 parallel agents.

---

## Value Scoring Framework

### 5 Dimensions (Weighted)

| Dimension | Weight | What It Measures |
|-----------|--------|-----------------|
| Acquisition Power | 25% | Does this feature drive installs? |
| Habit Formation | 20% | Does it create daily usage? |
| Upgrade Trigger | 25% | Does hitting limits drive upgrades? |
| Differentiation | 15% | Is this unique vs competitors? |
| Cost to Serve | 15% | Server/API costs per use? |

### Tier Assignment Rules

| Weighted Score | Tier | Action |
|---------------|------|--------|
| 8.0+ | FREE | Drives adoption — never gate |
| 6.0 - 7.9 | LIMITED FREE | Free with specific cap |
| 4.0 - 5.9 | PRO | Upgrade driver |
| < 4.0 | PRO or CUT | Low value — consider removing |

### Strategic Overrides
- Table-stakes features stay FREE regardless of score (if every competitor offers it free)
- High upgrade-trigger features stay PRO even with high overall scores
- Expensive AI features (BeLikeNative) have adjusted cost-to-serve

---

## Portfolio Scoring Results

### High Monetization Potential (Priority 5)

| Extension | Features Scored | Conv. Rate | Expected MRR (6mo) |
|-----------|----------------|-----------|-------------------|
| BeLikeNative (optimize) | 10 features | 6-8% | +$200-400 |
| Cookie Manager | 18 features | 5-7% | +$50-150 |
| Clipboard History Pro | 10 features | 8-12% | +$100-200 |
| Form Filler Pro | 8 features | 8-12% | +$100-250 |
| JSON Formatter Pro | 11 features | 5-8% | +$100-200 |
| Quick Notes | 8 features | 5-8% | +$50-100 |

### Medium Monetization Potential (Priority 3-4)

| Extension | Conv. Rate | Expected MRR | Verdict |
|-----------|-----------|-------------|---------|
| Tab Suspender Pro | 3-4% | +$150-300 | Bundle value + some standalone |
| Color Contrast Checker | 3-5% | +$20-50 | WCAG compliance drives B2B |
| Color Palette Generator | 3-4% | +$20-50 | Export triggers paywall |
| QR Code Generator | 3-4% | +$10-30 | Custom logos = clear Pro |
| BoldTake | 3-5% | +$30-60 | Undervalued — promote as headline |

### Utility / Bundle Value (Priority 1-2)

| Extension | Conv. Rate | Verdict |
|-----------|-----------|---------|
| Word Counter | 2-3% | Readability scores = Pro hook |
| Bookmark Search | 3-5% | Dead link checker = Pro hook |
| Base64 Encoder | 2-3% | File encoding = only Pro hook |
| Timestamp Converter | 2-3% | Batch + timezone grid = Pro |
| Lorem Ipsum Generator | <1% | Weakest — freeze Pro development |
| Unit Converter | 2-3% | PHP currency = VA-relevant hook |

---

## Definitive Zovo Pricing

| Tier | Monthly | Annual (per mo) | Annual Total | Target User |
|------|---------|-----------------|-------------|-------------|
| **Free** | $0 | $0 | $0 | All users — the funnel |
| **Starter** | $4 | $3 | $36 | Filipino VAs, budget freelancers |
| **Pro** | $7 | $5 | $60 | Power users, developers |
| **Team** | $14 (5 seats) | $10 | $120 | VA agencies, dev teams |

**Bundle value proposition:** "17 pro tools. One membership. Save 84%." (vs $45/month individual value)

### Cross-Tier Feature Access

| Feature Category | Free | Starter | Pro | Team |
|-----------------|------|---------|-----|------|
| Core CRUD | Full | Full | Full | Full |
| Storage limits | Low | Medium | Unlimited | Unlimited |
| Sync | None | 2 devices | Unlimited | Unlimited |
| Export formats | 1 basic | 2-3 formats | All + encrypted | All + encrypted |
| Bulk operations | None | None | Full | Full |
| Advanced search | Text only | Text only | Regex + filters | Regex + filters |
| Automation/rules | 1 rule | 3 rules | Unlimited | Unlimited |
| Team features | None | None | None | Full |
| AI features | Limited | 10/day | Unlimited | Unlimited |
| Priority support | None | Email | 24hr response | Dedicated |

---

## Key Strategic Decisions

1. **Bundle-only pricing** — No individual extension sales. Every extension is free with Pro features unlocked via Zovo membership. This is the single most important structural decision.

2. **BeLikeNative folds into Zovo** — 6-month migration window with 12-month grandfather pricing for existing subscribers.

3. **Read-only grace on downgrade** — When users downgrade from Pro to Free, excess profiles/rules become read-only (not deleted). Leverages endowment effect for re-conversion.

4. **Accept free tier gaming** — Don't over-engineer anti-abuse. Multi-profile Chrome users represent <2% of the base.

5. **Capped lifetime deal** — 200 licenses at $79 as early adopter promotion. Never run again.

6. **Student discount** — 50% off Starter annual ($2/month) targeting Filipino VA training programs.

---

## Portfolio Consistency Patterns

All 17 extensions follow these consistent rules:

- **Limits:** Power users hit walls in 1-2 weeks; casual users rarely hit limits
- **Sync:** Local = Free, 2 devices = Starter, Unlimited = Pro
- **Export:** 1 basic format free, extended at Starter, all formats at Pro
- **Search:** Text search free, regex + advanced filters at Pro
- **Lock icons:** Zovo crown icon (14x14px), [PRO]/[STARTER] pill badges, 4px blur overlay
- **Paywall copy:** Gift framing template — "Zovo [what it did]. [Value statement]. Unlock with [Tier] →"

---

## Cross-Promotion Strategy

### Portfolio Stickiness (Churn Reduction)

| Extensions Installed | Monthly Churn | Estimated LTV |
|---------------------|--------------|---------------|
| 1 (free only) | 15-20% | -- |
| 1 (paid) | 8-10% | $79 |
| 2 (paid) | 4-6% | $140 |
| 3+ (paid) | 2-3% | $210+ |
| Pro + 4 extensions | 1.5-2% | $314 |

**Key insight:** Users hitting paywalls on 2+ extensions convert at 8-12% (2-3x single-extension rate). Cross-promotion is the #1 retention lever.

### Top Discovery Funnel Entry Points
1. BeLikeNative (highest search volume, existing user base)
2. Tab Suspender Pro (universal pain point)
3. Clipboard History Pro (high daily usage)

---

## 90-Day Implementation Plan

### Phase 1: Foundation (Days 1-30)
- **Week 1-2:** Build `@zovo/auth` shared module, LemonSqueezy integration, Supabase Auth
- **Week 2-3:** Optimize BeLikeNative (reduce free tier, add annual plan, A/B test paywalls)
- **Week 3-4:** Complete Cookie Manager v1.0 launch, Tab Suspender Pro build

### Phase 2: Launch & Iterate (Days 31-60)
- **Week 5-6:** Launch Form Filler Pro, Clipboard History Pro
- **Week 7-8:** Launch JSON Formatter Pro, Quick Notes, conversion optimization sprint

### Phase 3: Scale (Days 61-90)
- **Week 9-10:** Batch launch utility extensions (6-8 extensions)
- **Week 11-12:** Student program, referral program, full portfolio completion

### Milestones

| Day | Milestone | Success Metric |
|-----|-----------|---------------|
| 7 | @zovo/auth module complete | Shared auth working across 2 extensions |
| 14 | BeLikeNative optimized | +$100 MRR from paywall improvements |
| 30 | Cookie Manager + Tab Suspender live | 1,000+ combined installs |
| 45 | 4 extensions monetized | $600+ total MRR |
| 60 | 6 extensions monetized | $1,000+ total MRR |
| 75 | 10+ extensions live | Cross-promotion driving 15%+ cross-installs |
| 90 | Full portfolio live | $1,800-2,200 total MRR |

---

## Revenue Projections

### Conservative (2.5% conversion, $5.50 ARPU)

| Total Free Users | Paying Users | MRR | ARR |
|-----------------|-------------|-----|-----|
| 10,000 | 250 | $1,375 | $16,500 |
| 25,000 | 625 | $3,438 | $41,250 |
| 50,000 | 1,250 | $6,875 | $82,500 |
| 100,000 | 2,500 | $13,750 | $165,000 |

### Realistic 6-Month Target
~40,000 total users across portfolio → $1,800-$2,200 MRR

---

## Detailed Analysis Documents

| File | Lines | Contents |
|------|-------|----------|
| [part1-framework-top6.md](feature-value/part1-framework-top6.md) | 368 | Scoring framework + 65 features scored across 6 high-monetization extensions |
| [part2-remaining11.md](feature-value/part2-remaining11.md) | 417 | 11 medium/utility extensions scored with monetization verdicts |
| [part3-consistency-bundles.md](feature-value/part3-consistency-bundles.md) | 400 | 7 consistency checks across portfolio + bundle strategy + pricing page copy |
| [part5-priority-crosspromo.md](feature-value/part5-priority-crosspromo.md) | 534 | ROI-ranked implementation priority + cross-promotion matrix + network effects |
| [part7-edgecases-summary-plan.md](feature-value/part7-edgecases-summary-plan.md) | 312 | 10 edge case decisions + executive summary + 90-day week-by-week plan |

---

*Analysis produced by 5 parallel agents. 17 extensions scored, 100+ features evaluated, 10 strategic decisions documented, 90-day plan with weekly milestones.*
