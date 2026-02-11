# Feature Value Analysis -- Part 7: Edge Cases & Decisions, Executive Summary, and 90-Day Implementation Plan

**Date:** February 11, 2026
**Portfolio:** Zovo (17 Chrome extensions, unified membership)
**Current Baseline:** BeLikeNative at 3,300 users, $400 MRR
**Target Audience:** Filipino VAs ($3-7/hr), developers, QA testers

---

## PART 7: EDGE CASES & DECISIONS

### Q1: Should Tab Suspender be monetized?

**Decision: YES -- but the free tier must be generous.**

Tab suspension is a commodity feature and users expect it to work for free. The Great Suspender's removal for malware in 2021 created lasting distrust in the category, meaning any new entrant must over-deliver on trust. However, session save/restore, custom per-domain timers, memory usage dashboards, and tab grouping are demonstrably Pro-tier features that go beyond basic suspension. The free tier should auto-suspend after 30 minutes with a 5-site whitelist -- enough to be the best free suspender on the market. Pro unlocks custom timers, unlimited whitelist, and session management. This extension has high search volume (40K+ monthly for "tab suspender") and is the second-highest priority for launch after BeLikeNative optimization.

**Implementation notes:** Ship free tier first with zero mention of Pro for the first 2 weeks to accumulate reviews and installs. Add Pro upsell in v1.1 once the user base stabilizes above 1,000 installs.

---

### Q2: Should simple utilities (Unit Converter, Lorem Ipsum, Base64) have Pro tiers?

**Decision: YES -- but expectations must be calibrated to near-zero standalone conversion.**

These extensions will convert at 1-2% individually, which is fine. Their purpose is threefold: (a) they pad the bundle perceived value ($45/month standalone vs. $7/month bundled), (b) they serve as free top-of-funnel acquisition channels with organic Chrome Web Store discovery, and (c) they cross-sell users into the Zovo membership where stickier extensions (Clipboard History, Form Filler) retain them. Each utility should have a lightweight Pro tier that takes under one week to implement -- file-to-Base64 encoding, live currency rates, custom word lists. Do not over-invest engineering time here. The Pro features exist so that the pricing page can honestly say "Pro features in all 17 extensions."

**Implementation notes:** Build these last (weeks 9-12). Use a shared Pro feature template: one paywall modal, one upgrade CTA, one "More Zovo Tools" section. Total build time for all three should be under 2 weeks combined.

---

### Q3: How do we handle users who only want ONE extension?

**Decision: DO NOT offer individual extension pricing. Bundle-only.**

This is the most important structural decision in the entire monetization strategy. Offering individual pricing fragments the model, creates support complexity (17 different SKUs), and undermines the bundle value proposition. A user who only wants Cookie Manager at $4/month is actually getting 16 other tools for free -- the framing must be "you're getting a deal," not "you're paying for things you don't use." Data supports this: McKinsey research shows bundling lifts revenue 10-30% versus a-la-carte, and the $45 anchor price makes $4-7 feel like a steal. The user who "only wants one extension" will discover they use two or three once the others are installed. Portfolio stickiness data shows that users with 3+ Zovo extensions installed churn at half the rate of single-extension users.

**Implementation notes:** Every paywall in every extension says "Unlock [Extension] Pro + 16 other tools for just $4/month." The pricing page never shows per-extension pricing. If users ask for individual pricing in support, offer a 7-day free trial of the full membership instead.

---

### Q4: What happens when a user downgrades from Pro to Free?

**Decision: READ-ONLY GRACE -- keep data accessible but freeze modifications.**

Deleting user data on downgrade is hostile and generates support tickets and negative reviews. Keeping full access removes incentive to re-upgrade. The middle path: users who downgrade retain read-only access to all their Pro-tier data (profiles, rules, snapshots, export history) but cannot create new ones or modify existing ones beyond free-tier limits. For example, a user with 10 cookie profiles can still view and load any of them, but cannot create an 11th or edit profiles 3-10. This leverages the endowment effect -- the user can see everything they built but cannot extend it. The psychological friction of having "locked" data they created is a stronger re-upgrade motivator than deletion.

**Implementation notes:** Store a `downgraded_at` timestamp. Show a subtle banner on Pro-tier items: "This profile was created with Zovo Pro. Upgrade to edit or create new profiles." Exempt this data from any cleanup for 12 months. After 12 months of inactivity, archive (do not delete) and notify the user via email.

---

### Q5: Should BeLikeNative remain separately priced or fold into Zovo?

**Decision: FOLD INTO ZOVO -- but with a 6-month migration window.**

BeLikeNative's $400 MRR from separate pricing ($4 Learner / $6 Native) is real revenue that cannot be disrupted overnight. However, maintaining two billing systems (BeLikeNative standalone + Zovo membership) creates permanent technical debt, confuses users, and prevents cross-sell compounding. The migration path: (1) immediately offer existing BeLikeNative subscribers a free upgrade to Zovo Starter or Pro (matching or exceeding their current plan value), (2) new BeLikeNative users only see Zovo membership pricing going forward, (3) after 6 months, sunset the standalone BeLikeNative billing entirely. The short-term revenue risk (some existing users may not migrate) is outweighed by the long-term benefit of a unified model that compounds across 17 extensions.

**Implementation notes:** Email existing BeLikeNative subscribers with a migration offer: "You're getting an upgrade. Same price, 16 more tools." Map $4 Learner to Zovo Starter ($4), $6 Native to Zovo Pro ($7 but grandfather at $6 for 12 months). Track migration rate weekly. If migration drops below 60% after 30 days, extend the grandfather period.

---

### Q6: How do we handle the AI cost problem?

**Decision: STARTER includes limited BeLikeNative AI (10 checks/day). Full AI is Pro-only.**

BeLikeNative's AI API calls have real marginal cost (estimated $0.002-0.01 per check depending on length and model). At scale, giving unlimited AI to $4/month Starter users could make the tier unprofitable. The solution: Starter gets 10 AI checks/day (up from 3 free), which covers casual use for a VA checking a few emails. Pro gets unlimited checks, justified by the $7/month price point that absorbs the API cost with healthy margin. At $0.005/check average and 50 checks/day for a heavy Pro user, that is $0.25/day or $7.50/month in API costs -- barely breaking even on Pro. This means heavy BeLikeNative users effectively subsidize the rest of the portfolio, which is acceptable because they represent the highest-value segment.

**Implementation notes:** Monitor API cost per user monthly. If average Pro user API cost exceeds $5/month, implement a soft throttle at 100 checks/day with a "fair use" banner rather than a hard cutoff. Consider negotiating volume pricing with the AI provider once monthly API spend exceeds $500.

---

### Q7: What if users game the free tier limits?

**Decision: ACCEPT IT. Do not over-engineer anti-gaming measures.**

Users creating multiple Chrome profiles to bypass limits represent maybe 2-3% of the free tier. Building sophisticated fingerprinting or device-linking to combat this costs engineering time, creates false positives that punish legitimate users, and solves a problem that barely affects revenue. The users gaming your free tier are, by definition, not willing to pay -- no amount of limit enforcement will convert them. Instead, focus engineering time on making the Pro tier so valuable that the 3-5% of users who will pay are delighted. One tactical measure worth implementing: tie free-tier limits to a lightweight anonymous ID stored in `chrome.storage.sync` (which syncs across Chrome profiles logged into the same Google account). This catches the most common gaming pattern (same Google account, multiple Chrome profiles) without any invasive tracking.

**Implementation notes:** Use `chrome.storage.sync` for limit counters (syncs across profiles under the same Google account). Do not implement browser fingerprinting, hardware ID tracking, or IP-based rate limiting. If a user is determined enough to create separate Google accounts, let them -- they are not your customer.

---

### Q8: Should we offer a lifetime deal?

**Decision: NO -- except as a one-time early adopter promotion (capped at 200 licenses).**

Lifetime deals are recurring revenue poison. AppSumo-style LTDs attract deal-seekers who churn from engagement (even if they never cancel, they stop using the product and generate zero word-of-mouth). At a $49-79 lifetime price, each LTD user breaks even against a $7/month subscription in 7-11 months -- and then costs you server/API resources indefinitely. However, a strictly limited early adopter LTD (200 licenses at $79, sold directly on zovo.app, not through AppSumo) serves as a cash injection during the first 30 days of launch, creates urgency, generates early reviews, and builds a seed community of power users. The cap prevents long-term revenue damage.

**Implementation notes:** Create a /lifetime page on zovo.app with a live counter showing remaining licenses. Price at $79 (equivalent to 11 months of Pro). Include all current and future extensions. Add a "Founding Member" badge to their Zovo profile. After 200 sales ($15,800 total), remove the page permanently. Never run another LTD.

---

### Q9: How to handle feature parity across Starter vs Pro vs Team?

**Decision: KEEP ALL THREE TIERS -- but make Starter feel complete, not crippled.**

The risk with 3 paid tiers is that Starter feels like a demo. The solution: Starter must include every feature category (export, profiles, rules, sync) but with meaningful limits (3 profiles, 5 rules, 2-device sync). Pro removes all limits. Team adds collaboration. This way, Starter users never encounter a feature that is entirely locked -- they just hit the ceiling faster. The psychological framing matters: Starter is "everything you need to be productive," Pro is "no limits," Team is "work together." If analytics show that more than 40% of Starter users hit profile or rule limits within the first week, the limits are too tight and should be relaxed. The goal is a 30-day average time-to-limit, not a 3-day wall.

**Implementation notes:** Starter limits per extension: Cookie Manager (3 profiles, 5 auto-delete rules, export current site in all formats), Clipboard History (100 items, 2-device sync), Form Filler (3 profiles), Tab Suspender (custom timers, 15-site whitelist). Track "limit hit" events per user per extension. A/B test Starter limits in month 2 based on data.

---

### Q10: What about a student/education discount?

**Decision: YES -- 50% off Starter (effectively $2/month) with .edu email verification.**

The Filipino VA audience overlaps heavily with students in training programs and bootcamps. A $2/month student rate removes virtually all purchase friction for someone earning $3-7/hour. Grammarly's 30% student discount drives significant volume in developing markets. Zovo can go further with 50% off because the marginal cost of serving a student user is near-zero (no AI-heavy features at the Starter tier). Student users also have high lifetime value: they graduate into professional VAs who upgrade to Pro or Team when their employer reimburses tools. This is a 12-24 month investment in future Pro customers.

**Implementation notes:** Verify via .edu email or partner with 3-5 Filipino VA training programs (OnlineJobs.ph, FreeU, TESDA) for bulk student codes. Limit student discount to Starter annual only ($24/year = $2/month). Student plans auto-convert to regular Starter pricing after 2 years. Do not offer student Pro -- the goal is to get them in the door, then upsell when they enter the workforce.

---

## EXECUTIVE SUMMARY

### Zovo Chrome Extension Portfolio: Feature Value Analysis

**The Opportunity.** Zovo is a portfolio of 17 Chrome extensions targeting Filipino virtual assistants ($3-7/hour), developers, and QA professionals. The portfolio operates on a unified membership model: Free / $4 Starter / $7 Pro / $14 Team (5 seats). The flagship extension, BeLikeNative (AI writing assistant, 3,300 users), generates $400 MRR and validates the audience's willingness to pay. The immediate growth catalyst is EditThisCookie's removal from the Chrome Web Store, which displaced 3M+ users and created a vacuum in the cookie manager category that no strong successor has filled.

**Pricing Recommendation.**

| Tier | Monthly | Annual | Core Value |
|------|---------|--------|------------|
| **Free** | $0 | $0 | All 17 extensions with generous basic features. Hard limits at usage ceilings designed to trigger after 1-2 weeks of active use. |
| **Starter** | $4 | $36/yr ($3/mo) | Expanded limits across all extensions. 2-device sync. All export formats. 10 BeLikeNative AI checks/day. Targets Filipino VAs under the $5 psychological barrier. |
| **Pro** | $7 | $60/yr ($5/mo) | Unlimited everything. Advanced features (regex, bulk ops, snapshots, monitoring). Unlimited AI. Priority support. The designed "default choice" via decoy pricing. |
| **Team** | $14 (5 seats) | $120/yr ($10/mo) | Pro for 5 users ($2.80/seat). Shared profiles, team libraries, admin dashboard. Targets VA agencies. |

**Top 5 Revenue Drivers (by 6-month MRR contribution):**

1. **BeLikeNative** (optimize existing): +$200-400 MRR from paywall optimization, free tier reduction (5 to 3 checks/day), and annual plan launch. Lowest effort, highest ROI.
2. **Tab Suspender Pro**: Universal pain point, 40K+ monthly searches. Session saving and memory dashboards justify Pro. Target: +$150-300 at 5,000 users.
3. **Form Filler Pro**: Daily-use tool for the core VA audience. Natural paywall at 2nd profile. Target: +$100-250 at 3,000 users.
4. **Clipboard History Pro**: Highest switching cost -- once users depend on clipboard history, they will not leave. Target: +$100-200 at 4,000 users.
5. **Cookie Manager**: Fills the EditThisCookie vacuum. Cookie profiles and compliance scanning are unique Pro differentiators no competitor offers. Target: +$50-150 at 2,000 users.

**Total Addressable MRR (conservative: 2.5% conversion, $5.50 ARPU):**

| Total Free Users | Paying Users | Monthly Revenue | Annual Revenue |
|-----------------|-------------|-----------------|----------------|
| 10,000 | 250 | $1,375 | $16,500 |
| 25,000 | 625 | $3,438 | $41,250 |
| 50,000 | 1,250 | $6,875 | $82,500 |
| 100,000 | 2,500 | $13,750 | $165,000 |

**Three Most Important Strategic Decisions:**

1. **Bundle-only pricing, no individual extension sales.** Every extension funnels into the same $4-7/month Zovo membership. This maximizes perceived value ($45 standalone vs. $7 bundled = "84% savings") and prevents model fragmentation. (Q3)
2. **Fold BeLikeNative into Zovo with a 6-month migration window.** Unifying billing eliminates technical debt and enables cross-sell compounding. Grandfather existing subscribers at their current rate for 12 months. (Q5)
3. **Read-only grace on downgrade, never delete user data.** Leverage the endowment effect to drive re-upgrades instead of generating hostile support tickets. (Q4)

**Three Things to Do This Week:**

1. Reduce BeLikeNative free tier from 5 to 3 checks/day and add annual billing option ($36/year Starter, $60/year Pro) via LemonSqueezy.
2. Finalize the `@zovo/auth` shared module architecture and begin implementation. This unblocks every future extension launch.
3. Ship Cookie Manager v1.0 free tier to the Chrome Web Store to begin capturing EditThisCookie displacement traffic.

---

## 90-DAY IMPLEMENTATION PLAN

### Phase 1: Foundation (Days 1-30)

**Week 1: BeLikeNative Optimization + Auth Foundation**

- [ ] Reduce BeLikeNative free tier from 5 to 3 AI checks/day
- [ ] Add annual billing to BeLikeNative via LemonSqueezy ($36/yr Starter, $60/yr Pro)
- [ ] A/B test paywall placement: current position vs. after 2nd check (not 5th)
- [ ] Begin `@zovo/auth` shared module: Chrome storage sync schema, license token format, tier enum
- [ ] Set up Supabase project: Auth (Google OAuth + email), Edge Functions, Postgres schema for subscriptions
- **Extensions:** BeLikeNative
- **Metrics to check:** BeLikeNative daily conversion rate (baseline: ~3.6%), paywall impression-to-click ratio
- **Decisions needed:** Final `@zovo/auth` token format and refresh interval (recommend 24hr with 72hr offline grace)
- **Dependencies:** LemonSqueezy account configured with annual plan products

**Week 2: Auth Module Complete + Cookie Manager Free Tier**

- [ ] Complete `@zovo/auth` npm package: login/logout, tier check, license caching, cross-extension broadcast
- [ ] Integrate `@zovo/auth` into BeLikeNative (replace existing auth if different)
- [ ] Submit Cookie Manager v1.0 free tier to Chrome Web Store (core CRUD, JSON export, 2 profiles, 1 auto-delete rule, domain grouping, dark mode, resizable UI)
- [ ] Create zovo.app/upgrade landing page with tier comparison and LemonSqueezy checkout integration
- **Extensions:** BeLikeNative, Cookie Manager
- **Metrics to check:** Cookie Manager install rate (target: 50+/day in week 1 from EditThisCookie displacement), BeLikeNative A/B test preliminary results
- **Decisions needed:** Cookie Manager Chrome Web Store listing copy, screenshots, category selection
- **Dependencies:** `@zovo/auth` module must be functional before Cookie Manager submission

**Week 3: Cookie Manager Pro + Tab Suspender Free**

- [ ] Ship Cookie Manager Pro features: unlimited profiles, all export formats, regex search, bulk edit, snapshots
- [ ] Implement Cookie Manager paywall triggers: 3rd profile, non-JSON export format, 2nd auto-delete rule
- [ ] Begin Tab Suspender free tier development: auto-suspend at 30 min, 5-domain whitelist, memory indicator
- [ ] Launch BeLikeNative migration emails to existing subscribers: "Same price, 16 more tools coming"
- **Extensions:** Cookie Manager, Tab Suspender (dev), BeLikeNative
- **Metrics to check:** Cookie Manager free-to-Pro conversion rate (target: 2-3%), BeLikeNative annual plan adoption rate
- **Decisions needed:** Tab Suspender default suspend timeout (recommend 30 min), whitelist limit for free tier
- **Dependencies:** Cookie Manager must be live with reviews before adding Pro paywall

**Week 4: Tab Suspender Launch + Form Filler Start**

- [ ] Submit Tab Suspender free tier to Chrome Web Store
- [ ] Ship Tab Suspender Pro: custom timers, unlimited whitelist, session save/restore, memory dashboard
- [ ] Begin Form Filler free tier development: 1 profile, basic field auto-fill, 10 fills/day
- [ ] Analyze first 30 days of BeLikeNative optimization data; decide on final free tier limit
- [ ] Set up cross-extension "More Zovo Tools" discovery section in all shipped extensions
- **Extensions:** Tab Suspender, Form Filler (dev), Cookie Manager, BeLikeNative
- **Metrics to check:** Tab Suspender install velocity, total Zovo membership conversions across all extensions, BeLikeNative MRR (target: $600+)
- **Decisions needed:** Form Filler daily fill limit for free tier (recommend 10/day), whether to launch lifetime deal
- **Dependencies:** Tab Suspender needs 48-72 hours for Chrome Web Store review

---

### Phase 2: Launch & Iterate (Days 31-60)

**Weeks 5-6: Form Filler + Clipboard History Launch**

- [ ] Submit Form Filler to Chrome Web Store with free tier (1 profile, 10 fills/day)
- [ ] Ship Form Filler Pro: unlimited profiles, custom field mapping, CSV import, regex patterns
- [ ] Build and submit Clipboard History free tier: 25 items, basic search, pin 3 items
- [ ] Ship Clipboard History Pro: unlimited history, cloud sync, folders, text expander
- [ ] Launch early adopter lifetime deal (200 licenses at $79) on zovo.app/lifetime
- [ ] Implement weekly "Zovo Usage Report" email for all Zovo members (modeled on Grammarly's Monday email)
- **Extensions:** Form Filler, Clipboard History, all existing
- **Metrics to check:** Cross-extension install rate (do Cookie Manager users install Tab Suspender?), lifetime deal sales velocity, churn rate by tier
- **Decisions needed:** Whether to extend lifetime deal beyond 200 licenses based on demand, Clipboard History sync backend capacity
- **Dependencies:** `@zovo/auth` must support cross-extension discovery for "More Zovo Tools" prompts

**Weeks 7-8: JSON Formatter + Quick Notes + Optimization Sprint**

- [ ] Ship JSON Formatter free tier: auto-format, tree view, syntax highlighting
- [ ] Ship JSON Formatter Pro: editable JSON, diff comparison, JSONPath queries, schema validation
- [ ] Ship Quick Notes free tier: 20 notes, basic rich text
- [ ] Ship Quick Notes Pro: unlimited notes, folders, tags, markdown, cloud sync
- [ ] Run conversion rate optimization sprint across all extensions: A/B test paywall copy, CTA button colors, timing of first upgrade prompt
- [ ] Analyze which extensions drive the most cross-sell conversions; double down on their "More Zovo Tools" placement
- [ ] Begin BeLikeNative migration: new BeLikeNative users see Zovo pricing only
- **Extensions:** JSON Formatter, Quick Notes, optimization across all 6 live extensions
- **Metrics to check:** Total MRR (target: $1,000-1,200), total free users across portfolio (target: 8,000-12,000), conversion rate by extension, cross-extension install correlation
- **Decisions needed:** Whether JSON Formatter Pro conversion justifies continued developer-audience investment, Quick Notes note limit adjustment based on data
- **Dependencies:** All extensions must use `@zovo/auth` v1.x for consistent paywall behavior

---

### Phase 3: Scale (Days 61-90)

**Weeks 9-10: Utility Extensions Batch + Student Program**

- [ ] Batch-ship remaining utility extensions (free + Pro tiers): Word Counter, QR Code Generator, Bookmark Search, Color Palette Generator, Color Contrast Checker, Timestamp Converter
- [ ] Use shared Pro feature template for consistent paywall UX across all utilities
- [ ] Launch student discount program: 50% off Starter annual ($24/year) with .edu verification
- [ ] Partner with 2-3 Filipino VA training programs for bulk student codes
- [ ] Implement referral program via LemonSqueezy affiliate system: "Give a friend 1 month free, get 1 month free"
- **Extensions:** 6 utility extensions (batch), student program infrastructure
- **Metrics to check:** Utility extension install rates (expecting lower than top-5), student program sign-up rate, referral program viral coefficient
- **Decisions needed:** Whether to build dedicated Zovo Hub extension or rely on cross-extension discovery, student partner program terms
- **Dependencies:** LemonSqueezy affiliate/coupon system must be configured

**Weeks 11-12: Final Extensions + Scale Preparation**

- [ ] Ship final utility extensions: Base64 Encoder, Lorem Ipsum Generator, Unit Converter
- [ ] Full portfolio is now live: 17 extensions with free and Pro tiers
- [ ] Sunset standalone BeLikeNative billing for new users (existing users remain grandfathered)
- [ ] Implement portfolio-wide analytics dashboard: installs, conversions, MRR, churn, cross-extension correlation
- [ ] Prepare agency/team sales materials: landing page, case study from early Team subscribers, ROI calculator
- [ ] Conduct 90-day retrospective: which extensions are worth continued investment vs. maintenance mode
- [ ] Plan Phase 4 roadmap based on data: content marketing, SEO, agency partnerships, feature deepening for top 3 extensions
- **Extensions:** 3 final utilities, portfolio-wide optimization
- **Metrics to check:** Total MRR (target: $1,500-2,500), total free users (target: 15,000-25,000), blended conversion rate (target: 2.5-3.5%), churn rate by tier (target: <6% monthly)
- **Decisions needed:** Phase 4 priority (scale existing extensions vs. build new ones), whether to hire part-time support for growing user base, Stripe direct migration timeline
- **Dependencies:** All 17 extensions must be live and functional with `@zovo/auth` integration

---

### Milestones

| Day | Milestone | Success Metric |
|-----|-----------|---------------|
| 7 | BeLikeNative optimized (lower free tier, annual plans live) | Annual plan adoption >10% of new sign-ups; conversion rate up from 3.6% to 4%+ |
| 14 | Cookie Manager free tier live on Chrome Web Store; `@zovo/auth` v1.0 complete | 200+ Cookie Manager installs; auth module working across BeLikeNative + Cookie Manager |
| 30 | 4 extensions live (BeLikeNative, Cookie Manager, Tab Suspender, Form Filler in dev); BeLikeNative MRR at $600+ | Total portfolio installs >3,000; BeLikeNative MRR $600+; zovo.app/upgrade conversion >2% |
| 45 | 6 extensions live with Pro tiers; lifetime deal launched | Total MRR >$800; lifetime deal >50 licenses sold; cross-extension install rate >15% |
| 60 | 8 extensions live; first conversion optimization sprint complete | Total MRR >$1,200; blended conversion rate >2.5%; total free users >10,000 |
| 75 | 14 extensions live; student program launched; referral program active | Total MRR >$1,500; student sign-ups >100; referral program generating >5% of new users |
| 90 | Full portfolio (17 extensions) live; standalone BeLikeNative billing sunset for new users | Total MRR >$2,000; total free users >20,000; clear data on top 3 extensions for Phase 4 investment |

---

### Risks and Mitigations

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| **Chrome Web Store review delays or rejections** block launch timeline | Medium (30%) | High | Submit extensions 1 week before planned launch. Maintain strict Manifest V3 compliance. Have a checklist for common rejection reasons (excessive permissions, misleading descriptions). If rejected, fix and resubmit same day. |
| **BeLikeNative migration causes subscriber churn** -- existing users reject Zovo pricing or fail to migrate | Medium (25%) | High | 12-month grandfather period at current pricing. Personal email to every existing subscriber (not bulk). Offer 1 month free Zovo Pro for migrating. Track migration weekly; pause if churn exceeds 10%. |
| **AI API costs exceed revenue at scale** -- heavy BeLikeNative Pro users cost more than $7/month in API calls | Low-Medium (20%) | Medium | Monitor per-user API cost from day 1. Implement soft throttle at 100 checks/day. Negotiate volume pricing at $500/month API spend. Consider fine-tuning a smaller model for common corrections to reduce per-call cost. |
| **Cookie Manager fails to capture EditThisCookie vacuum** -- displaced users choose Cookie-Editor or another competitor instead | Medium (35%) | Medium | Differentiate on UX (resizable UI, dark mode, cookie profiles -- none of which Cookie-Editor offers). Target EditThisCookie-specific keywords in Chrome Web Store listing. Ship fast -- the vacuum is closing. Every week of delay loses displacement traffic. |
| **Low cross-extension install rate** -- users install one extension but never discover others | Medium (30%) | High | "More Zovo Tools" section in every extension settings page. Post-install notification suggesting related extensions. Weekly usage email highlighting tools the user has not tried. Chrome Web Store "from the same developer" listing helps organically. |
| **LemonSqueezy post-Stripe-acquisition changes** -- pricing, features, or reliability shifts unfavorably | Low (15%) | Medium | Architecture allows migration to Stripe direct + Supabase. Keep `@zovo/auth` payment-provider-agnostic (abstract the license validation layer). Monitor LemonSqueezy changelog monthly. Begin Stripe direct migration planning if LemonSqueezy fees increase or features are deprecated. |
| **Competitor launches a cookie manager with identical Pro features** -- eroding differentiation | Low (20%) | Medium | Speed is the moat. First-mover in the EditThisCookie vacuum with Pro features (profiles, snapshots, compliance) builds switching costs. Zovo portfolio bundle is structurally impossible for a single-extension competitor to match. Continue shipping differentiating features monthly. |

---

## Appendix: Decision Reference Summary

| # | Question | Decision | Key Rationale |
|---|----------|----------|---------------|
| Q1 | Monetize Tab Suspender? | Yes, generous free + Pro | Session management and custom timers justify Pro; free tier must beat competitors |
| Q2 | Pro tiers for simple utilities? | Yes, lightweight | Bundle padding + funnel value; near-zero standalone conversion expected |
| Q3 | Individual extension pricing? | No, bundle only | Fragmentation kills the model; $45 anchor vs. $7 bundle is the core value proposition |
| Q4 | Downgrade data handling? | Read-only grace | Endowment effect drives re-upgrades; deletion generates hostility |
| Q5 | BeLikeNative separate pricing? | Fold into Zovo (6-month window) | Unified billing + cross-sell compounding outweighs short-term migration risk |
| Q6 | AI costs at scale? | Starter: 10 checks/day; Pro: unlimited | Tiered AI access prevents Starter unprofitability; monitor and throttle at scale |
| Q7 | Free tier gaming? | Accept it | Anti-gaming engineering costs more than the lost revenue; focus on Pro value instead |
| Q8 | Lifetime deal? | Limited (200 at $79) | Cash injection + early community; capped to prevent recurring revenue damage |
| Q9 | Tier feature parity? | Starter = complete but limited | Starter must never feel crippled; 30-day average time-to-limit is the target |
| Q10 | Student discount? | 50% off Starter annual | $2/month removes friction for VA trainees; high future LTV as they enter workforce |
