# Phase 24: Code Architecture Patterns

## Objective
Apply professional-grade architecture patterns to improve the Cookie Manager extension's maintainability, testability, and scalability.

## 1. What Was Implemented

### New Files
| File | Lines | Description |
|------|-------|-------------|
| `src/shared/architecture-patterns.js` | ~555 | ArchPatterns module with EventBus, StateStore, ServiceRegistry, CommandQueue, Middleware |
| `src/shared/message-router.js` | ~431 | MessageRouter module with Router, MessageValidator, ActionTypes, RequestBuilder |
| `scripts/architecture-audit.js` | ~380 | Architecture quality audit CLI tool |

### Modified Files
- **service-worker.js** -- imports architecture-patterns.js and message-router.js; registers loaded modules in the ServiceRegistry at startup
- **popup.js** -- EventBus integration for reactive UI updates on cookie and settings changes
- **index.html** -- added script tags for the two new shared modules
- **firefox.json** -- added new shared modules to background scripts list

## 2. Architecture Patterns Applied

| Pattern | Implementation | Purpose |
|---------|---------------|---------|
| Pub/Sub (Observer) | EventBus | Loose coupling between modules, UI updates |
| State Store | StateStore | Observable state with persistence and selectors |
| Service Locator | ServiceRegistry | Module discovery without hard dependencies |
| Command | CommandQueue | Ordered execution with undo/redo support |
| Middleware | Middleware pipeline | Request preprocessing, logging, validation |
| Router | MessageRouter | Clean message dispatch with stats tracking |
| Validator | MessageValidator | Message structure validation |
| Builder | RequestBuilder | Consistent message construction |

## 3. EventBus Usage Examples

Modules communicate through named events without knowing about each other:

```javascript
// Cookie updated notification
ArchPatterns.EventBus.emit('cookie:updated', { domain: 'example.com' });

// Settings changed
ArchPatterns.EventBus.emit('settings:changed', { readOnlyMode: true });

// Subscribe in popup
ArchPatterns.EventBus.on('cookie:updated', function() { loadCookies(); });
```

The EventBus supports `on`, `off`, `once`, and wildcard listeners. A maximum of 50 listeners per event prevents accidental memory leaks.

## 4. StateStore Usage Examples

```javascript
// Create a persistent store (auto-synced to chrome.storage.local)
var appStore = ArchPatterns.StateStore.create('appState', { theme: 'dark', count: 0 });

// Subscribe to all changes
appStore.subscribe(function(state, prev) { console.log('State changed:', state); });

// Selective subscription -- fires only when the selected value changes
appStore.select(function(s) { return s.count; }, function(count) {
    console.log('Count changed to', count);
});

// Update state
appStore.setState({ count: 1 });
```

State is debounced (500 ms) before persisting to storage to avoid excessive writes.

## 5. ServiceRegistry Integration

At startup, the service worker registers all loaded modules so any part of the codebase can discover them without import chains:

- CookieOps, PerfTimer, StorageOptimizer, VersionManager, LegalCompliance, A11yManager

Any module can look up another:

```javascript
var timer = ArchPatterns.ServiceRegistry.get('PerfTimer');
if (timer) { timer.start('myOperation'); }
```

The registry also supports `has()`, `list()`, and `unregister()` for lifecycle management.

## 6. MessageRouter Architecture

The MessageRouter provides a structured alternative to the existing `switch`-based message handler in the service worker. It can be adopted gradually:

1. **Existing handler stays in place** -- no breaking changes.
2. **New routes are registered** for actions that benefit from middleware, validation, or stats tracking.
3. **Over time**, actions can migrate from the switch-case to the router at any pace.

The router supports middleware chains, per-action handlers, and dispatch statistics for debugging.

```javascript
var router = MessageRouter.createRouter();
router.use(function(msg, sender, next) { console.log(msg.action); next(); });
router.register('GET_COOKIES', function(payload, sender) { return cookies; });
```

ActionTypes and RequestBuilder enforce naming conventions and consistent message shapes:

```javascript
var types = MessageRouter.ActionTypes.define('COOKIE', ['GET', 'SET']);
// => { GET: 'COOKIE_GET', SET: 'COOKIE_SET' }

var msg = MessageRouter.RequestBuilder.create('COOKIE_GET', { url: 'https://example.com' });
```

## 7. Architecture Audit

The CLI audit tool checks 25 rules across 5 categories:

| Category | Checks | What It Verifies |
|----------|--------|------------------|
| Module Organization | 6 | IIFE wrapping, global exposure, file size limits, naming conventions |
| Error Handling | 5 | try/catch presence, chrome.runtime.lastError checks, Promise rejection handling |
| State Management | 4 | No raw localStorage, storage abstraction usage, state persistence patterns |
| Message Architecture | 5 | Action type constants, message validation, response format consistency |
| Code Quality | 5 | var-only declarations, no eval, no inline event handlers, JSDoc coverage |

Run the audit:

```bash
node scripts/architecture-audit.js
```

Output includes per-category scores, an overall grade, and specific remediation suggestions for any failing checks.

## 8. Design Principles Followed

- **Zero external dependencies** -- every pattern is self-contained, no npm packages
- **100% local** -- no network requests, no analytics, no telemetry
- **Graceful degradation** -- all chrome API calls are guarded with `typeof` checks so modules load safely in non-extension contexts (tests, Node)
- **IIFE isolation** -- no global pollution beyond the named exports (`ArchPatterns`, `MessageRouter`)
- **Promise-based async** -- no `async`/`await` for broader browser compatibility
- **var-only in shared modules** -- ensures compatibility with older environments and matches the existing codebase style

## 9. How to Test

Run the architecture audit to verify all patterns are wired correctly:

```bash
node scripts/architecture-audit.js
```

Manual testing in the browser:
1. Open the extension popup and verify console has no errors from the new modules.
2. In the service worker console, run `ArchPatterns.ServiceRegistry.list()` to confirm registered services.
3. Emit a test event: `ArchPatterns.EventBus.emit('test:ping', { ts: Date.now() })`.

## 10. Migration Path

All existing code continues to work unchanged. The new patterns are purely additive and can be adopted incrementally:

- **EventBus** -- modules can start emitting events for actions that other modules may care about (cookie changes, setting updates, errors).
- **StateStore** -- any module that currently reads/writes `chrome.storage.local` directly can migrate to a StateStore for observable, debounced persistence.
- **ServiceRegistry** -- replaces ad-hoc `typeof X !== 'undefined'` checks with a clean lookup API.
- **MessageRouter** -- new message actions should be registered on the router; existing switch-case actions can migrate one at a time.
- **CommandQueue** -- useful for any user action that should support undo (cookie deletion, bulk edits).

No refactoring deadline is imposed. Each pattern provides value independently, and adoption can happen organically as modules are touched for other work.
