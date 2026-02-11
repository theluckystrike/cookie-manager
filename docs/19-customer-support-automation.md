# MD 19 — Customer Support Automation
**Status:** Complete
**Date:** 2026-02-11
**Extension:** Cookie Manager (zovo.one)

## Overview

MD 19 adapts customer support automation for a 100% local Chrome extension. There is no server, no email integration, and no external API usage. Instead, the implementation provides:

- Local feedback collection with auto-categorization and sentiment analysis
- Support diagnostics that generate debug bundles entirely on-device
- A self-service help page with searchable FAQ categories
- Popup integration via a help link and feedback submission function

All support features operate without any network requests, keeping user data fully local.

## Architecture

- All support modules run locally — zero external requests are made
- Storage uses `chrome.storage.local` with a `_fb_` prefix for feedback entries
- Modules follow the IIFE pattern with `var` declarations and `typeof` guards
- Graceful degradation when optional modules (e.g., SecurityHardener) are unavailable
- Message-based communication between popup, service worker, and support modules

## New Files Created

### 1. `src/shared/feedback-collector.js` (~226 lines)

Local feedback collection engine with automatic analysis:

- **Submission:** Stores feedback entries in `chrome.storage.local` with `_fb_` key prefix
- **Sentiment analysis:** Keyword-based detection of positive, negative, and neutral sentiment, plus urgency detection
- **Priority classification:** Assigns urgent, high, normal, or low priority based on keyword matching
- **Feedback types:** bug, feature, question, praise, other
- **Category detection:** Classifies into installation, bug, performance, compatibility, howto, feature, or general
- **Storage management:** Enforces a 100-entry cap to prevent storage bloat
- **Export:** Supports exporting all feedback entries as JSON

### 2. `src/shared/support-diagnostics.js` (~200 lines)

On-device diagnostic toolkit for troubleshooting:

- **System info:** Collects browser name, version, platform, screen dimensions, and language
- **Extension health:** Summarizes error count, startup history, and popup load times
- **Storage usage:** Estimates current storage consumption
- **Debug bundle:** Aggregates all diagnostic data into a single exportable object
- **Issue classifier:** Maps symptoms to suggested troubleshooting actions
- **Quick health check:** Runs an API availability self-test against Chrome extension APIs

### 3. `src/help/help.html` + `help.js` + `help.css`

Self-service help center accessible from the extension popup:

- **FAQ categories:** Getting Started, Managing Cookies, Security Features, Troubleshooting, Keyboard Shortcuts
- **Search:** Real-time filtering across all FAQ items
- **Collapsible items:** Uses `<details>`/`<summary>` elements for expand/collapse
- **Usage tracking:** Records FAQ item views in `chrome.storage.local`
- **Quick diagnostics:** Button to run and display a health check
- **Dark theme:** Matches the extension popup styling

## Files Modified

### 1. `src/background/service-worker.js`

Added six new message handlers to the service worker:

| Message | Handler | Description |
|---|---|---|
| `SUBMIT_FEEDBACK` | `FeedbackCollector.submitFeedback()` | Stores a new feedback entry |
| `GET_FEEDBACK_STATS` | `FeedbackCollector.getStats()` | Returns aggregated feedback statistics |
| `GET_FEEDBACK` | `FeedbackCollector.getFeedback()` | Retrieves stored feedback entries |
| `EXPORT_FEEDBACK` | `FeedbackCollector.exportFeedback()` | Exports all feedback as JSON |
| `GET_DIAGNOSTICS` | `SupportDiagnostics.generateDebugBundle()` | Returns full diagnostic bundle |
| `GET_QUICK_CHECK` | `SupportDiagnostics.quickHealthCheck()` | Runs API availability self-test |

Added `importScripts` calls for `feedback-collector.js` and `support-diagnostics.js`.

### 2. `src/popup/popup.js`

- Added `submitFeedback()` function to send feedback via `SUBMIT_FEEDBACK` message
- Added `openHelpPage()` function to open the help page in a new tab
- Wired up the help link click handler in `setupEventListeners()`

### 3. `src/popup/index.html`

- Added a help link (? icon) in the popup footer, triggering `openHelpPage()`

### 4. `manifests/firefox.json`

- Added `feedback-collector.js` and `support-diagnostics.js` to the background scripts array

## Message Flow

```
Popup → SUBMIT_FEEDBACK → Service Worker → FeedbackCollector.submitFeedback() → chrome.storage.local
Popup → GET_DIAGNOSTICS  → Service Worker → SupportDiagnostics.generateDebugBundle() → response
Popup → helpLink click   → chrome.tabs.create(help.html) → Self-service FAQ
```

Feedback submission flow:
1. User enters feedback text in popup
2. Popup sends `SUBMIT_FEEDBACK` message with text and optional type
3. Service worker invokes `FeedbackCollector.submitFeedback()`
4. Feedback is auto-categorized (category, sentiment, priority) and stored locally
5. Confirmation response returned to popup

Diagnostics flow:
1. Popup or help page sends `GET_DIAGNOSTICS` message
2. Service worker invokes `SupportDiagnostics.generateDebugBundle()`
3. Bundle aggregates system info, extension health, storage usage, and module status
4. Complete bundle returned as a single JSON-serializable object

## Security Considerations

- All feedback data is stored locally only — nothing leaves the device
- Input is sanitized before storage, leveraging `SecurityHardener` when available
- No external API calls and no data transmission of any kind
- Feedback entries are capped at 100 to prevent storage bloat
- All new message types are registered in the `MessageValidator` whitelist (MD 18)
- Help page runs in a sandboxed extension context with no elevated permissions

## Testing Checklist

- [ ] Submit feedback from popup — verify entry stored in `chrome.storage.local`
- [ ] Feedback auto-categorization returns correct categories for known keywords
- [ ] Sentiment analysis detects positive, negative, and neutral correctly
- [ ] Priority classification escalates entries containing urgent keywords
- [ ] `GET_FEEDBACK_STATS` returns correct aggregated counts and breakdowns
- [ ] Debug bundle includes all system info and module status fields
- [ ] Quick health check verifies Chrome API availability and returns pass/fail
- [ ] Help page loads and FAQ search filters items in real time
- [ ] FAQ items expand and collapse correctly via details/summary
- [ ] Help link in popup footer opens the help page in a new tab
- [ ] Firefox manifest loads new background scripts without errors
- [ ] Chrome service worker imports new modules via `importScripts` successfully
