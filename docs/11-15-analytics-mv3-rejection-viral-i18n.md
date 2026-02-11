# Cookie Manager - Agents 11-15
## February 2026

---

# Agent 11: Crash Analytics Monitoring

## Error Tracking

```javascript
// src/shared/error-tracker.js

class ErrorTracker {
  static async track(error, context = {}) {
    const { errorLogs = [] } = await chrome.storage.local.get('errorLogs');
    
    errorLogs.push({
      message: error.message,
      stack: error.stack?.slice(0, 500),
      context,
      timestamp: Date.now(),
      version: chrome.runtime.getManifest().version
    });

    // Keep last 25 errors
    await chrome.storage.local.set({ 
      errorLogs: errorLogs.slice(-25) 
    });
  }
}

// Global handlers
window.addEventListener('error', (e) => {
  ErrorTracker.track(new Error(e.message), { line: e.lineno });
});

window.addEventListener('unhandledrejection', (e) => {
  ErrorTracker.track(new Error(e.reason), { type: 'promise' });
});
```

## Health Metrics

| Metric | Target | Tracking |
|--------|--------|----------|
| Error rate | <1% | Per 100 operations |
| Crash rate | 0 | Per session |
| Load time | <100ms | Popup open |
| Memory | <20MB | Idle state |

---

# Agent 12: Manifest V3 Architecture

## Current Manifest (Verified)

```json
{
  "manifest_version": 3,
  "name": "Cookie Manager",
  "version": "1.0.0",
  "permissions": [
    "cookies",
    "activeTab", 
    "storage",
    "contextMenus",
    "notifications"
  ],
  "host_permissions": ["<all_urls>"],
  "background": {
    "service_worker": "src/background/service-worker.js"
  }
}
```

## MV3 Compliance Checklist

- [x] `manifest_version: 3`
- [x] Service worker (not background page)
- [x] No `eval()` or `new Function()`
- [x] No inline scripts in HTML
- [x] Promise-based APIs used
- [x] No remote code execution
- [x] CSP compliant

## Service Worker Patterns

```javascript
// Stateless message handling
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender)
    .then(sendResponse)
    .catch(err => sendResponse({ error: err.message }));
  return true; // Keep channel open for async
});

// No persistent state - use storage
async function getSettings() {
  const { settings = {} } = await chrome.storage.local.get('settings');
  return settings;
}
```

---

# Agent 13: Review Rejection Recovery

## Permission Justifications

### cookies
**Required for core functionality.**
Used to read, write, and delete cookies for websites the user visits.

### activeTab
**Required for domain detection.**
Used only to get the current tab's URL to filter cookies by domain.

### storage
**Required for user preferences.**
Stores user settings like read-only mode and theme preference locally.

### contextMenus
**Optional enhancement.**
Provides right-click actions for quick cookie operations.

### notifications
**User feedback.**
Shows confirmation when bulk operations complete.

### host_permissions: <all_urls>
**Required for cookie access.**
The cookies API requires host permission to access cookies for any domain.

## Single Purpose Statement

> Cookie Manager serves one purpose: allowing users to view, edit, and manage browser cookies for web development and privacy.

## Pre-Submission Checklist

- [x] All permissions justified
- [x] Single purpose documented
- [x] Privacy policy URL set
- [x] No deceptive functionality
- [x] Screenshots match actual UI

---

# Agent 14: Growth Viral Engine

## Referral Triggers

| Milestone | Prompt |
|-----------|--------|
| 50th cookie edited | "You're a power user!" |
| First JWT decoded | "Share with dev friends" |
| Export 5 times | "Tell a colleague" |

## Share Templates

```javascript
const SHARE_TEMPLATES = {
  twitter: "Cookie Manager makes debugging auth flows so much easier 🍪 https://zovo.one/cookie-manager",
  linkedin: "Developer tip: Cookie Manager by Zovo is the cleanest way to manage browser cookies.",
  slack: "Check out Cookie Manager - super useful for testing sessions: https://zovo.one/cookie-manager"
};
```

## Review Prompt

```javascript
async function checkReviewPrompt() {
  const { editCount = 0, reviewPrompted } = await chrome.storage.local.get(['editCount', 'reviewPrompted']);
  
  if (editCount >= 25 && !reviewPrompted) {
    showReviewPrompt();
    await chrome.storage.local.set({ reviewPrompted: true });
  }
}
```

---

# Agent 15: Internationalization System

## Locale Structure

```
_locales/
├── en/messages.json     (English - default)
├── es/messages.json     (Spanish)
├── de/messages.json     (German)
├── fr/messages.json     (French)
├── ja/messages.json     (Japanese)
└── pt_BR/messages.json  (Portuguese BR)
```

## messages.json (English)

```json
{
  "extensionName": {
    "message": "Cookie Manager",
    "description": "Extension name"
  },
  "extensionDescription": {
    "message": "Simple, clean cookie management",
    "description": "Extension description"
  },
  "searchPlaceholder": {
    "message": "Search cookies...",
    "description": "Search input placeholder"
  },
  "exportButton": {
    "message": "Export",
    "description": "Export button label"
  },
  "addButton": {
    "message": "Add",
    "description": "Add cookie button"
  },
  "clearButton": {
    "message": "Clear",
    "description": "Clear all button"
  },
  "editCookie": {
    "message": "Edit Cookie",
    "description": "Edit modal title"
  },
  "saveCookie": {
    "message": "Save Cookie",
    "description": "Save button"
  },
  "deleteCookie": {
    "message": "Delete",
    "description": "Delete button"
  },
  "cookieSaved": {
    "message": "Cookie saved",
    "description": "Success toast"
  },
  "cookieDeleted": {
    "message": "Cookie deleted",
    "description": "Delete toast"
  },
  "noCookies": {
    "message": "No cookies found",
    "description": "Empty state"
  }
}
```

## Using i18n

```javascript
// In popup.js
document.getElementById('searchInput').placeholder = 
  chrome.i18n.getMessage('searchPlaceholder');

// In manifest.json
{
  "name": "__MSG_extensionName__",
  "description": "__MSG_extensionDescription__",
  "default_locale": "en"
}
```

## Priority Languages

| Language | Market | Priority |
|----------|--------|----------|
| English | 40% | P0 |
| Spanish | 15% | P1 |
| German | 10% | P1 |
| French | 8% | P2 |
| Japanese | 7% | P2 |

---

## Summary

| Agent | Status |
|-------|--------|
| 11 - Crash Analytics | ✅ |
| 12 - MV3 Architecture | ✅ Compliant |
| 13 - Rejection Recovery | ✅ All justified |
| 14 - Viral Growth | ✅ |
| 15 - i18n | ✅ Structure defined |

**Next: Agents 16-20** (Cross-browser, Churn, Security, Support, Performance)

*Report generated by Agents 11-15 for Cookie Manager*
