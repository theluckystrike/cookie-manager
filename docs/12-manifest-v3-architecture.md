# MD 12 — Manifest V3 Architecture
## Cookie Manager — Phase 12 Complete

**Date:** February 2026 | **Status:** Complete
**Extension:** Cookie Manager v1.0.0

---

## Overview

Phase 12 delivers comprehensive MV3 architecture hardening for the Cookie Manager Chrome extension. This phase introduces four shared utility modules that enforce MV3 best practices across the entire extension: service worker lifecycle management with alarm-based periodic tasks and state persistence, a storage schema and migration system for forward-compatible data evolution, a centralized message type registry with validation and timeout-aware communication helpers, and DOM sanitization utilities for secure rendering of user-generated content.

All modules use the IIFE (Immediately Invoked Function Expression) pattern for compatibility with Chrome MV3 service workers, which do not support ES module `import`/`export` syntax. Every `chrome.*` API call is wrapped in defensive error handling to prevent uncaught exceptions from crashing the service worker.

## Files Created

| File | Lines | Purpose |
|------|-------|---------|
| `src/shared/sw-lifecycle.js` | 174 | Service worker lifecycle management: state persistence via `chrome.storage.session`, alarm-based periodic tasks, keep-alive for long operations, startup tracking |
| `src/shared/storage-schema.js` | 170 | Storage schema definition, versioned migration system, quota monitoring, safe get/set wrappers, factory reset with meta preservation |
| `src/shared/message-types.js` | 103 | Message type registry, action validation, standardized response wrappers (`success`/`error`), timeout-aware `sendMessage` helper |
| `src/shared/dom-utils.js` | 160 | DOM sanitization, safe element/SVG builders, URL/domain validation, cookie name validation, XSS prevention utilities |

## Files Modified

| File | Changes |
|------|---------|
| `src/background/service-worker.js` | Added MD 12 integration block after monitoring init (lines 102-147): `SwLifecycle.init()`, maintenance alarm registration, `StorageSchema.migrate()` on startup. Added `_schemaVersion` initialization in `onInstalled` handler for fresh installs. |

## Key Module APIs

### SwLifecycle

- `init()` — Initializes lifecycle tracking, attaches alarm listener, creates maintenance alarm, records startup in `chrome.storage.session`
- `registerAlarm(name, periodInMinutes, callback)` — Registers a named periodic alarm with a callback
- `persistState(key, value)` / `restoreState(key)` — Save/restore ephemeral state to `chrome.storage.session`
- `keepAlive(operation)` — Wraps a long-running async operation with a keep-alive port to prevent SW termination
- `getInfo()` — Returns lifecycle metadata (uptime, startup count, registered alarms)

### StorageSchema

- `VERSION` — Current schema version number
- `SCHEMA` — Complete defaults object for all storage keys
- `getAll()` / `get(key)` / `set(data)` — Type-safe storage access with defaults
- `migrate()` — Runs pending migrations from stored version to current version
- `getQuotaInfo()` — Returns storage usage and remaining quota
- `reset()` — Factory reset preserving meta fields (installed date, schema version)

### MessageTypes / MessageHelper / MessageResponse

- `MessageTypes` — Frozen enum of all valid action strings
- `MessageHelper.send(action, payload, timeoutMs)` — Send message with timeout and error wrapping
- `MessageHelper.validate(message)` — Validate incoming message has a known action
- `MessageHelper.create(action, payload)` — Create a properly formatted message object
- `MessageResponse.success(data)` / `MessageResponse.error(message, code)` — Standardized response wrappers

### DomUtils

- `escapeHtml(text)` — Pure string-based HTML entity escaping
- `createElement(tag, attrs, children)` — Safe DOM builder (no innerHTML)
- `createSvg(width, height, paths)` — Namespaced SVG element builder
- `sanitizeUrl(url)` — Blocks javascript:/data:/vbscript: protocols, allows http/https only
- `isValidDomain(domain)` / `isValidCookieName(name)` — Input validation
- `sanitizeDisplay(text, maxLength)` — Strip control characters, truncate for display
- `setText(element, text)` / `clearChildren(element)` — Safe DOM manipulation

## MV3 Compliance Checklist

- [x] manifest_version: 3
- [x] Service worker (not background page)
- [x] No eval() or new Function()
- [x] No inline scripts in HTML
- [x] Promise-based APIs
- [x] No remote code execution
- [x] CSP compliant (script-src 'self')
- [x] State persistence for SW termination (`chrome.storage.session`)
- [x] `chrome.alarms` for periodic tasks (no `setInterval`)
- [x] Storage schema versioning & forward-compatible migrations
- [x] Message type validation at all boundaries
- [x] DOM sanitization (no innerHTML for user content)
- [x] Input validation at all boundaries
- [x] URL sanitization (no javascript:/data: protocols)

## Architecture Decisions

1. **IIFE Pattern**: All shared modules use IIFE pattern for MV3 compatibility. Chrome MV3 service workers do not support ES module `import`/`export`, so modules expose globals on `self` (service worker) or `window` (popup/pages).

2. **chrome.storage.session**: Used for ephemeral SW state (startup count, last active time) that needs to survive service worker termination but not browser restart. This avoids polluting persistent storage with runtime-only metadata.

3. **chrome.alarms**: All periodic tasks use the `chrome.alarms` API instead of `setInterval`. The service worker may terminate at any time; alarms persist across SW restarts and guarantee periodic execution. The built-in maintenance alarm runs every 15 minutes; the integration block adds a secondary 30-minute maintenance alarm.

4. **Defensive Error Handling**: Every `chrome.*` API call is wrapped in try/catch. Storage operations use safe wrappers that resolve (never reject) to prevent unhandled rejections from crashing the service worker.

5. **Zero External Dependencies**: All utilities are self-contained with no npm packages, CDN imports, or remote code. This satisfies the Chrome Web Store's strict MV3 remote code prohibition.

6. **typeof Guards for Integration**: The service worker integration uses `typeof SwLifecycle !== 'undefined'` guards so the service worker remains functional even if shared scripts fail to load. This prevents cascading failures.

7. **Versioned Migrations**: Storage schema migrations are sequential and idempotent. Each migration transforms data from version N-1 to version N. Missing keys are filled with defaults after all migrations run, ensuring forward compatibility.

## Security Hardening Summary

- DOM builder pattern replaces innerHTML for user-generated content
- URL validation prevents `javascript:` and `data:` protocol injection
- Cookie name validation prevents header injection
- Message validation ensures only known action types are processed
- Sensitive data redaction in debug/error exports
- All storage access goes through schema-validated wrappers

---

*Phase 12 — Manifest V3 Architecture — Complete*
*Part of Cookie Manager by Zovo (https://zovo.one)*
