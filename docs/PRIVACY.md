# Privacy Policy

**Last updated: February 2026**

Cookie Manager is built by [Zovo](https://zovo.one) with privacy as a core principle.

## TL;DR

- **100% local** -- all data stays on your device
- **Zero network requests** -- we never transmit anything, anywhere
- **Zero data collection** -- no analytics servers, no telemetry endpoints
- The code is **open source** for verification

## Data Stored Locally

Cookie Manager stores all data locally on your device using Chrome's built-in storage APIs. Nothing ever leaves your browser.

### User Settings

Stored in `chrome.storage.local`:
- Read-only mode preference
- Protected domains list
- Theme selection (light/dark/system)
- Sort preferences
- Export format preference
- Schema version metadata

### Local Diagnostic Data

Stored in `chrome.storage.local` to help **you** troubleshoot issues:
- **Error logs** -- max 50 entries, records extension errors with timestamps
- **Startup history** -- max 20 entries, tracks service worker start events
- **Popup load times** -- max 20 entries, measures popup rendering performance

This data is never sent externally. It exists solely for your own debugging use.

### Local Analytics Events

Stored in `chrome.storage.local`, max 100 entries. Records extension lifecycle events (install, update) locally. These events are **never transmitted** to any server. They exist only for local diagnostics.

### Debug Mode Data

When debug mode is enabled, additional logs are kept in an **in-memory buffer only**. This data is not persisted to storage and is lost when the service worker restarts.

### What We NEVER Do

- Send your cookies or any data to any server
- Track your browsing activity
- Transmit analytics or telemetry externally
- Store data outside your browser
- Make any network requests whatsoever

## Permissions Explained

### `cookies`
Required to read, create, modify, and delete cookies. This is the core functionality of the extension.

### `activeTab`
Required to get the current tab's URL to display relevant cookies for the site you are viewing.

### `storage`
Required to save your settings, local diagnostic data, and local analytics on your device using `chrome.storage.local`.

### `contextMenus`
Required to provide right-click menu options for quick cookie actions.

### `notifications`
Required to display browser notifications for cookie protection alerts and operation confirmations.

### `alarms`
Required to schedule periodic tasks such as diagnostic log cleanup and storage maintenance.

### `host_permissions: <all_urls>`
Required to access cookies for any website you visit. Without this, the extension could not display cookies for the current site.

## Chrome Web Store Data Disclosure

Per Chrome Web Store requirements:

| Disclosure Question | Answer |
|---|---|
| Does your extension collect user data? | No user data is collected or transmitted. |
| Personal communications | Not collected |
| Location / Financial / Health data | Not collected |
| Web history / User activity | Not collected |
| Website content | Not collected |
| Personally identifiable information | Not collected |

All locally stored data (settings, diagnostic logs, analytics events) remains entirely on your device and is never accessible to us or any third party.

## Your Control

- You can clear all extension data at any time via Chrome's extension settings
- Debug mode can be toggled on/off; in-memory logs are discarded on restart
- Diagnostic data is automatically capped (error logs: 50, analytics: 100, startup history: 20, load times: 20)

## Open Source

Cookie Manager is open source. You can review the complete source code at:
https://github.com/theluckystrike/cookie-manager

## Contact

For privacy concerns, contact: privacy@zovo.one

## Changes

We will update this policy as needed. Significant changes will be noted in the extension's changelog.
