# 09 - Extension Payment Integration: Zovo Cookie Manager

## Phase 09 Complete | Generated 2026-02-11

---

## Overview

Five specialist agents produced a complete payment integration system for the Zovo Cookie Manager Chrome extension, connecting it to the Zovo unified Pro membership backend. This phase covers the system architecture and extension registration with Supabase and Stripe (Agent 1), a shared payments TypeScript module with license verification, caching, and offline grace periods (Agent 2), the paywall UI system with email capture modals, license key input, and upgrade success animations (Agent 3), feature gating enforcement via the `canUse()` guard across all 12 Pro features with tier-aware limits for free/starter/pro/team (Agent 4), and the complete API integration specification with production TypeScript client, 20 drip email templates, analytics event-to-API mapping, revenue dashboard definitions, and extension registration completion checklist (Agent 5). Together, these documents provide everything needed to ship Cookie Manager with a functioning payment and licensing system that validates licenses against the Zovo backend, captures conversion opportunities at paywalls, triggers automated drip email sequences, tracks conversion analytics, and gracefully handles offline scenarios.

**Total output:** ~10,412 lines across 5 specialist documents covering architecture, payments module, paywall UI, feature gating, API integration, drip emails, and analytics.

---

## Agent Summary

### Agent 1: System Architecture & Extension Registration (~2,000 lines)

**Key deliverables:**
- **Zovo payment system architecture** mapping how Cookie Manager connects to the unified backend: Supabase Edge Functions for license verification, Stripe for payment processing, and the shared `chrome.storage.sync` auth propagation model across all Zovo extensions
- **Extension registration specification** for `cookie_manager` with the complete 12-feature Pro features array: `unlimited_profiles`, `unlimited_rules`, `bulk_export`, `health_dashboard`, `encrypted_vault`, `bulk_operations`, `advanced_rules`, `export_all_formats`, `gdpr_scanner`, `curl_generation`, `real_time_monitoring`, `cross_domain_export`
- **Database schema definitions** for the `licenses`, `paywall_events`, and `analytics_events` Supabase tables with Cookie Manager-specific column values
- **Stripe product configuration** with Cookie Manager as a product in the Zovo unified membership, mapping subscription tiers (Starter $4/mo, Pro $7/mo, Team $14/mo) to feature arrays
- **Backend Edge Function modifications** required in `stripe-webhook/index.ts` and `create-license/index.ts` to add Cookie Manager to the PRODUCT_FEATURES map
- **Authentication flow specification** covering Google OAuth via `chrome.identity`, email sign-in via external page messaging, JWT token storage in `chrome.storage.sync`, token refresh logic, and the 72-hour offline grace period
- **Cross-extension auth propagation** via `chrome.storage.onChanged` listener, enabling instant tier updates across all installed Zovo extensions when a user upgrades from any extension

### Agent 2: Shared Payments Module (~2,000 lines)

**Key deliverables:**
- **Production `payments.ts` module** adapted from the Zovo integration guide template, customized for Cookie Manager with `EXTENSION_ID = 'cookie_manager'` and all 12 Pro features
- **License verification with caching** -- 5-minute memory cache, `chrome.storage.local` persistence, and 72-hour offline grace period with graceful degradation
- **`verifyLicense()` function** with format validation (ZOVO-XXXX-XXXX-XXXX-XXXX), API call with error handling, cache update on success, and storage fallback on network failure
- **`hasFeature()` and `isPro()` convenience functions** for quick feature checks without redundant API calls
- **`logPaywallHit()` function** with email validation, client-side deduplication, and error handling
- **`trackEvent()` function** for analytics event queuing with silent failure on network errors
- **Session management** via `chrome.storage.session` with `crypto.randomUUID()` session IDs
- **`openUpgradePage()` helper** generating ref-tracked upgrade URLs
- **`clearLicenseCache()` function** for sign-out and debugging workflows

### Agent 3: Paywall UI System (~2,000 lines)

**Key deliverables:**
- **Paywall modal component** with adaptive content based on the triggering feature -- shows feature name, benefit copy, and pricing. Includes email capture input for users without accounts and direct upgrade CTA for authenticated users
- **Email capture flow** -- validates email format, stores in `chrome.storage.local`, calls `logPaywallHit()` to trigger the backend drip sequence, then redirects to the upgrade page
- **License key input component** -- full input UI with ZOVO-XXXX-XXXX-XXXX-XXXX format validation, real-time API verification, success/error states, and automatic feature unlock on valid key
- **Upgrade success animation** -- confetti burst, badge transition, lock icon dissolve, blur panel removal, usage counter update, and welcome toast, totaling 1.9 seconds of orchestrated UI transitions
- **CSS styling** for all paywall components with dark mode support, responsive layout, and WCAG AA contrast compliance
- **"Already have a license?" link** on every paywall modal connecting to the license key input flow
- **Paywall variant rendering** -- integrates with Agent 4's `PaywallController` for frequency limiting and copy variation rotation

### Agent 4: Feature Gating System (~2,000 lines)

**Key deliverables:**
- **`TIER_LIMITS` constant** defining numeric and boolean limits for all features across free/starter/pro/team tiers, with -1 representing unlimited access
- **`canUse()` async function** -- the single entry point for all feature access checks. Handles both boolean features (vault, sync, monitoring) and count-based features (profiles, rules, export limit). Returns `{ allowed, currentTier, requiredTier, limit, currentCount }`
- **`findMinTier()` helper** -- determines the minimum tier required for any given feature, used for accurate paywall messaging ("Requires Starter plan" vs "Requires Pro plan")
- **`PaywallController` class** enforcing all display frequency rules: no first-session paywalls, no interrupting active operations, 1 hard block per session, 3 soft banners per session, 48-hour per-trigger cooldown, 7-day cooldown after 3 dismissals, and permanent softening to once per 30 days after repeated dismissals
- **Paywall copy rotation** via `PAYWALL_COPY` object with 5 copy variations per trigger (T1-T17), sequential rotation stored in `chrome.storage.local`
- **Timing prerequisite gates** -- each paywall trigger requires the user to have experienced the value of the feature first (e.g., profile limit paywall only fires after the user has loaded at least 1 of their 2 saved profiles)
- **Integration pattern** showing how every Cookie Manager component (ProfileManager, RuleEditor, ExportPanel, HealthDashboard, etc.) calls `canUse()` before executing gated actions

### Agent 5: API Integration, Drip Emails & Analytics (2,412 lines)

**Key deliverables:**
- **Complete API integration specification** for all 3 Zovo backend endpoints (`verify-extension-license`, `log-paywall-hit`, `collect-analytics`) with full request/response TypeScript schemas, rate limit documentation, error code handling tables, and Cookie Manager-specific configurations
- **Production `ZovoApiClient` TypeScript class** (~450 lines) wrapping all 3 endpoints with centralized error handling, exponential backoff retry (3 retries, 1s/2s/4s with jitter), 5-second request timeouts via AbortController, rate limit tracking with automatic wait-and-retry, debug mode logging, and 5-minute memory cache with 72-hour storage cache for license verification
- **`AnalyticsBatchQueue` implementation** -- events queued in `chrome.storage.local`, flushed via `chrome.alarms` every 5 minutes, max 50 events per batch, 100-event queue cap with oldest-first eviction, network failure retention for next cycle
- **20 drip email templates** (4 emails x 5 feature variants) with complete HTML, A/B subject lines, preview text, personalized body copy per triggering feature (profiles, export, health dashboard, vault, rules), ROI calculations, social proof testimonials, annual discount offers, and unsubscribe handling
- **Drip email sequence rules** -- max 4 emails per sequence, 24h minimum between sends, immediate stop on upgrade, 30-day cooldown per feature, max 2 parallel sequences per user, independent of extension functionality
- **Resend email service integration** with Supabase Edge Function implementation for sending, webhook endpoint for open/click/bounce tracking, RFC 8058 one-click unsubscribe compliance, and `pg_cron` scheduled drip queue processing every 15 minutes
- **Analytics event-to-API mapping** -- 17 events sent to backend (conversion-relevant: paywall views, clicks, email captures, upgrades, failures, cross-promo) and 18 events kept local-only (privacy-sensitive: cookie views, edits, searches, session data)
- **Revenue analytics dashboard definitions** with 30+ computed metrics across 6 categories: daily/weekly/monthly conversion rates, MRR tracking, paywall-to-conversion funnel with 8 steps and breakdown dimensions, time-to-upgrade analysis (5 metrics), feature trigger frequency analysis (6 metrics), churn analytics by tier and type (5 metrics), and drip email performance (6 metrics)
- **6-step conversion funnel event chain**: `paywall_viewed` -> `paywall_email_captured` -> `upgrade_page_viewed` -> `checkout_started` -> `payment_completed` -> `license_activated`, with attribution rules for multi-touch scenarios
- **20-item extension registration completion checklist** with Cookie Manager-specific SQL, TypeScript snippets, and deployment tasks -- 6 items completed by prior agents, 14 remaining for backend deployment

---

## Key Artifacts Produced

| Artifact | Purpose | Used When |
|----------|---------|-----------|
| System architecture diagram | Visualize extension-to-backend data flow | Architecture review, onboarding |
| Extension registration spec (cookie_manager) | Register Cookie Manager in Zovo backend | Backend deployment |
| Database schema (3 tables) | Store licenses, paywall events, analytics | Backend setup |
| Stripe product configuration | Map tiers to Cookie Manager features | Payment processing |
| Shared payments module (`payments.ts`) | License verification, feature checks, paywall logging | All feature gating |
| `ZovoApiClient` class (`api-client.ts`) | Production API wrapper with retry/cache/rate limits | All backend communication |
| `AnalyticsBatchQueue` class | Queue and batch-send analytics events | Background analytics |
| Paywall modal component | Show upgrade prompt when free limits hit | Feature gating points |
| Email capture flow | Collect email for drip sequence | Paywall interaction |
| License key input component | Manual license activation | Settings page, paywall |
| Upgrade success animation | Celebrate tier upgrade | Post-payment |
| `TIER_LIMITS` constant | Define feature limits per tier | Feature gating |
| `canUse()` function | Single entry point for feature access | Every gated feature |
| `PaywallController` class | Enforce display frequency rules | Before showing paywalls |
| `PAYWALL_COPY` object (5 variants x 17 triggers) | Copy rotation for paywalls | Paywall rendering |
| 20 drip email templates (HTML) | Re-engage users who hit paywalls | Backend email service |
| Resend Edge Function integration | Send drip emails via Resend API | Backend scheduled sends |
| Email webhook handler | Track opens, clicks, bounces | Email analytics |
| Drip queue processor | Schedule and send drip emails | Backend cron job |
| Event-to-API mapping table (35 events) | Route events to backend or local storage | Analytics implementation |
| Revenue dashboard metric definitions (30+ metrics) | Compute conversion and revenue analytics | Backend dashboards |
| Conversion funnel event chain (6 steps) | Track complete upgrade journey | Funnel analysis |
| Registration completion checklist (20 items) | Track deployment progress | Pre-launch |

---

## Detailed Documents

| Agent | File | Lines | Focus |
|-------|------|-------|-------|
| 1 | [agent1-architecture-registration.md](payment-integration/agent1-architecture-registration.md) | ~2,000 | System architecture, extension registration, database schemas, Stripe configuration, authentication flows, cross-extension auth propagation |
| 2 | [agent2-payments-module.md](payment-integration/agent2-payments-module.md) | ~2,000 | Shared payments TypeScript module, license verification with caching, feature checks, paywall hit logging, analytics tracking, session management |
| 3 | [agent3-paywall-ui.md](payment-integration/agent3-paywall-ui.md) | ~2,000 | Paywall modal UI, email capture flow, license key input, upgrade success animation, CSS styling with dark mode, paywall variant rendering |
| 4 | [agent4-feature-gating.md](payment-integration/agent4-feature-gating.md) | ~2,000 | TIER_LIMITS constant, canUse() function, PaywallController frequency limits, paywall copy rotation, timing prerequisites, component integration patterns |
| 5 | [agent5-api-analytics.md](payment-integration/agent5-api-analytics.md) | 2,412 | API endpoint specs (3 endpoints), ZovoApiClient TypeScript class, AnalyticsBatchQueue, 20 drip email templates, event-to-API mapping, revenue dashboard metrics, conversion funnel, Resend integration, registration checklist |

---

*Extension payment integration system produced by 5 specialist agents. ~10,412 lines of implementation-ready documentation: system architecture connecting Cookie Manager to the Zovo unified backend, shared payments TypeScript module with license verification and 72-hour offline grace, paywall UI with email capture and upgrade animations, feature gating via canUse() across 12 Pro features with tier-specific limits, production API client with exponential backoff retry and rate limit tracking, 20 drip email templates with A/B subject lines and feature-specific copy, analytics batch queue flushing every 5 minutes, 35 analytics events mapped to backend or local-only storage, revenue dashboard with 30+ computed metrics, 6-step conversion funnel event chain, Resend email service with webhook tracking and pg_cron scheduling, and a 20-item deployment checklist. Built on Phase 01-08 research, specifications, deployment systems, QA protocols, store assets, conversion strategy, and branding/retention infrastructure.*
