# 04 - Deployment System: Zovo Cookie Manager

## Phase 04 Complete | Generated 2026-02-11

---

## Overview

Five specialized agents worked in parallel to build production-ready deployment specifications for the Cookie Manager extension. Each agent covers a critical domain: Premium UX, Performance, QA/Debugging, Security, and Monetization.

**Total output:** 2,768 lines across 5 specialist documents.

---

## Agent Summary

### Agent 1: Premium UX — Presell Pro Without Manipulation

**Key deliverables:**
- **Value Ladder:** 3-layer design (Foundation free, Enhancement Pro, Delight Pro) with exact feature mapping
- **Presell Touchpoints:** 10 specific lock icon/badge placements with tooltip copy, 3 "taste of premium" mechanics (one-time bulk export, first health card unblurred, plan comparison)
- **Upgrade Triggers:** 6 natural pause points + 4 desire creation moments, each with specific conditions
- **5 Rotating Prompt Variations:** Value Focus, Social Focus, Feature Focus, Security Focus, Milestone Focus — each with exact headline (8 words), body (25 words), CTA, and dismiss text
- **8 Anti-Patterns:** Never interrupt edits, never paywall first session, max 1 hard block/session, never delete data on downgrade, never use "locked" in copy
- **Measurement Framework:** 4 metric categories tracked locally with TypeScript interfaces

### Agent 2: Performance — Every Millisecond Matters

**Key deliverables:**
- **Critical Path Analysis:** Popup open broken into stages (HTML parse 5ms → script load 15ms → Preact mount 10ms → cookie API 30ms → first paint 40ms) = <100ms interactive
- **Memory Estimates:** 4-6MB idle, 15-25MB with 1000 cookies
- **Bundle Budget:** <342KB total (popup 120KB, background 35KB, options 80KB, shared 42KB, assets 65KB)
- **17 Performance Benchmarks** with budgets and measurement methods
- **10 Prioritized Optimizations:** P0 (virtual scrolling, inline critical CSS, deferred tabs), P1 (storage batching, cookie caching, search debounce), P2 (bundle CI gate, alarm consolidation)
- **Browser Impact:** <1ms page load overhead, <5MB memory overhead, no measurable startup impact

### Agent 3: QA/Debugging — 127 Test Cases

**Key deliverables:**
- **Security Scan:** 20-item checklist (no eval, no innerHTML, CSP validation, message origin checks)
- **Functional Tests:** 78 test cases across Cookies Tab (48), Profiles (10), Rules (10), Health (9), Paywall (18), Context Menu (5), Settings (5)
- **Edge Cases:** 47 scenarios covering browser variations, cookie edge cases, user behavior, system conditions, data integrity
- **Test Suites:** Smoke test (5 min, 10 checks), Full regression (30 min, 6 phases), Release candidate checklist
- **Bug Report Template** with severity definitions (Critical: 4hr fix, High: 24hr, Medium: 1 week)
- **Test Data Sets:** Minimal, standard, stress, and adversarial cookie sets with XSS/injection payloads

### Agent 4: Security — Trust Is the #1 Differentiator

**Key deliverables:**
- **Permission Audit:** 10 permissions justified, 4 flagged as optional/runtime-requested
- **Strict CSP:** `script-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'`
- **Input Sanitization:** 10 input points with validation rules, max lengths, sanitization methods
- **Encryption Spec:** AES-256-GCM, PBKDF2 with 600,000 iterations, per-profile salt, per-operation IV
- **10 Threat Models:** XSS via cookie data (Critical), supply chain attack (Critical), storage tampering, message spoofing, OAuth theft, MITM, cached credentials, profile import, clickjacking, timing attacks
- **30+ Penetration Test Cases** across 7 categories
- **Compliance Docs:** CWS permission justifications, privacy practices disclosure, privacy policy outline
- **Critical finding:** GDPR scan endpoint should be local-only (no cookie data to external API)

### Agent 5: Monetization — Natural Upgrade Paths

**Key deliverables:**
- **Complete TIER_LIMITS constant** with 21 feature flags across 4 tiers (TypeScript-ready)
- **`canUse()` function spec** returning typed result with tier, limit, and count info
- **PaywallController class** enforcing all frequency rules (1 hard/session, 3 soft/session, 48hr cooldown, 7-day/30-day escalation)
- **Engagement Prerequisites:** Each trigger requires proof of value (T1 needs both profiles loaded, T2 needs rule executed, T7 needs 5+ text searches)
- **First Run Experience:** 3-step, <30 seconds, skip always available
- **Cross-Promotion:** 3 contextual triggers with exact copy, max 1/session, never alongside paywall
- **Auth Integration:** Google OAuth flow, token refresh, 72-hour offline grace, cross-extension propagation
- **14 Revenue Analytics Events** with funnel metrics and alert thresholds

---

## Key Decisions from This Phase

1. **No content scripts during normal use** — Zero page load overhead. Only inject for DevTools panel (P1).
2. **GDPR scan must be local-only** — Never send cookie data to external API. Use disconnect.me tracker lists bundled in extension.
3. **Engagement prerequisites for paywalls** — Users must experience value before seeing upgrade prompts. No paywall on first session ever.
4. **Virtual scrolling mandatory** — Cookie lists can have 1000+ items. Render only visible rows + 5 buffer.
5. **Bundle under 342KB** — Replace nanoid with crypto.randomUUID(), tree-shake Preact, inline critical CSS.
6. **AES-256-GCM for vault** — PBKDF2 key derivation with 600K iterations, per-profile salt. Web Crypto API only.
7. **HMAC-based anti-tampering** — License cache in storage gets HMAC signature to prevent manual tier override.

---

## Detailed Documents

| Agent | File | Lines | Focus |
|-------|------|-------|-------|
| 1 | [agent1-premium-ux.md](deployment/agent1-premium-ux.md) | 359 | Value ladder, presell touchpoints, upgrade triggers, copy variations, anti-patterns |
| 2 | [agent2-performance.md](deployment/agent2-performance.md) | 519 | Performance audit, 17 benchmarks, 10 optimizations, bundle budget, browser impact |
| 3 | [agent3-qa-testing.md](deployment/agent3-qa-testing.md) | 492 | 127 test cases, edge cases, security scan, test suites, bug report template |
| 4 | [agent4-security.md](deployment/agent4-security.md) | 592 | Permission audit, CSP, encryption, 10 threat models, 30 pen tests, compliance |
| 5 | [agent5-monetization.md](deployment/agent5-monetization.md) | 806 | TIER_LIMITS, PaywallController, auth flow, cross-promo, 14 analytics events |

---

*Deployment system produced by 5 specialist agents. 2,768 lines of production-ready specifications covering UX, performance, QA (127 test cases), security (10 threat models, 30 pen tests), and monetization (21 feature flags, 14 analytics events). Built on Phase 01-03 research and specifications.*
