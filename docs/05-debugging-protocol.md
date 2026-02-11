# 05 - Debugging Protocol: Zovo Cookie Manager

## Phase 05 Complete | Generated 2026-02-11

---

## Overview

Five specialist agents produced a comprehensive pre-publication debugging and QA system for the Cookie Manager. This protocol should be executed before every Chrome Web Store submission.

**Total output:** 3,917 lines across 5 documents covering manifest validation, JS error prevention, runtime testing, code hardening, and final QA sign-off.

---

## Agent Summary

### Agent 1: Manifest & Permissions Audit (379 lines)

**Key deliverables:**
- **Complete production-ready manifest.json** — copy-pasteable MV3 manifest with all fields, i18n support via `__MSG_*__` placeholders
- **Permission audit table** — 10 permissions (6 required, 4 optional/runtime) with CWS justification text ready to paste into Developer Dashboard
- **Strict CSP** — `script-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'`
- **Service worker config** — 10 event listeners, 5 alarm types, `type: module` requirement
- **No content scripts for MVP** — confirmed; future GDPR banner detection documented for P2
- **Keyboard shortcuts** — Ctrl+Shift+K (popup), Ctrl+Shift+E (quick export)
- **File structure validation** — every manifest path mapped to source files with build output paths

### Agent 2: JavaScript Error Detection (1,156 lines)

**Key deliverables:**
- **Complete ESLint config** — 40+ rules for TypeScript + Preact + Chrome extension (bans eval, innerHTML, localStorage, document access in background/)
- **Chrome API validation patterns** — correct vs incorrect usage for all 6 API surfaces (cookies, storage, tabs, alarms, runtime, identity) with TypeScript examples
- **Async error handling** — 5 patterns: chromeApi() wrapper, fetchWithTimeout, withRetry (exponential backoff), Preact ErrorBoundary, unhandledrejection catcher
- **Service worker restrictions** — 6 constraint violations documented with correct patterns
- **TypeScript type definitions** — ChromeCookie, CookieProfile, AutoDeleteRule, ExtensionMessage (discriminated union), LocalStorage, SyncStorage, TIER_LIMITS
- **25-row bug prevention checklist** — security, async, service worker, tabs, cookies, storage, alarms, identity, types, UI, messaging
- **Debug utility module** — production-safe logger with ring buffer, perf timer, anonymized error reporting

### Agent 3: Runtime Testing (272 lines)

**Key deliverables:**
- **63 test procedures** across 7 suites:
  - P1: Popup testing (22 tests) — rendering, CRUD, search, filter, export/import, protection, keyboard
  - B1: Background script (10 tests) — service worker lifecycle, alarms, auto-delete, message passing
  - S1: Storage (8 tests) — persistence, corruption recovery, quota warning
  - E1-E3: Edge cases (16 tests) — 0/1000+ cookies, special chars, HttpOnly, incognito, offline
  - PW1: Paywall (9 tests) — trigger verification, cooldowns, upgrade flow
  - Performance (8 benchmarks) — all with measurement methods and target/critical thresholds
- **Error documentation template** with severity definitions and response SLAs
- **Test environment setup scripts** and adversarial test data

### Agent 4: Code Hardening (1,707 lines)

**Key deliverables:**
- **Safe Storage module** — `safeStorageGet/Set`, `batchStorageWrite` with rollback, `emergencyStorageCleanup`
- **Safe Tabs module** — null-safe tab queries, domain extraction
- **Safe Cookies module** — permission/domain error handling, incognito store support
- **Safe Messaging module** — 10s timeout, sender validation, action allowlist
- **Input Sanitization module** — 8 functions (cookie name/value/domain/path, search, profile name, rule pattern, import validation) with XSS/injection prevention
- **State Recovery system** — storage schema validation + migration, service worker checkpoints, network retry with exponential backoff
- **Preact ErrorBoundary** — user-friendly fallback with reference ID, nested per-tab
- **20 user-facing error messages** — mapped from technical errors to friendly copy with recovery actions
- **Production logging system** — `createLogger()` factory, 500-entry ring buffer, sensitive data redaction
- **11 build-time CI gates** — ESLint bans, TypeScript strict, bundle size check, Husky pre-commit

### Agent 5: Final QA Report (403 lines)

**Key deliverables:**
- **Clean build checklist** — 18 items for pre-submission code hygiene
- **Full regression test report template** — 65 tests (15 critical path + 35 feature + 15 edge case) with fill-in format
- **Cross-platform matrix** — 15 test areas across 8 browser/OS combinations with release-blocker criteria
- **Performance validation** — 20 metrics with targets and blank "Measured" fields
- **Security review checklist** — 20 checks requiring evidence (grep results, code snippets, test outputs)
- **CWS readiness checklist** — 32 items across manifest, listing assets, and privacy/compliance
- **Final QA sign-off template** — status declaration, issue summary, change log, 4 signature lines
- **Debug reference checklist** — 25 common Chrome extension issues with Cookie Manager-specific fixes

---

## Key Artifacts Produced

| Artifact | Purpose | Used When |
|----------|---------|-----------|
| manifest.json (complete) | Production-ready manifest | Build setup |
| .eslintrc.json | Code quality enforcement | Development |
| TypeScript type definitions | Type safety | Development |
| Safe utility modules (5) | Defensive coding | Development |
| Input sanitization module | Security | Development |
| State recovery system | Reliability | Development |
| Error boundary component | UX | Development |
| Logger module | Debugging | Development + Production |
| 63 runtime test procedures | QA | Pre-release |
| 65-test regression template | QA | Pre-release |
| 20 performance benchmarks | Performance | Pre-release |
| 20 security checks | Security | Pre-release |
| 32 CWS readiness checks | Publication | Pre-submission |
| 25 debug reference issues | Maintenance | Post-release |

---

## Detailed Documents

| Agent | File | Lines | Focus |
|-------|------|-------|-------|
| 1 | [agent1-manifest-audit.md](debugging/agent1-manifest-audit.md) | 379 | Manifest.json, permissions, CSP, shortcuts, file validation |
| 2 | [agent2-js-error-detection.md](debugging/agent2-js-error-detection.md) | 1,156 | ESLint, Chrome API patterns, async handling, TypeScript types, debug utilities |
| 3 | [agent3-runtime-tests.md](debugging/agent3-runtime-tests.md) | 272 | 63 test procedures, 7 suites, performance benchmarks, error template |
| 4 | [agent4-code-hardening.md](debugging/agent4-code-hardening.md) | 1,707 | 5 safe utility modules, sanitization, state recovery, error boundary, logger |
| 5 | [agent5-final-qa-report.md](debugging/agent5-final-qa-report.md) | 403 | Regression template, cross-platform matrix, CWS readiness, QA sign-off |

---

*Debugging protocol produced by 5 specialist agents. 3,917 lines of QA infrastructure: 170 verification points, 63 test procedures, 25 bug prevention rules, 20 security checks, complete production manifest, 5 defensive coding modules, and templates for every release cycle.*
