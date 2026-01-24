# Privacy Policy

**Last updated: January 24, 2026**

Cookie Manager is built by [Zovo](https://zovo.one) with privacy as a core principle.

## TL;DR

- We collect **nothing**
- Your cookies stay on **your device**
- We make **zero network requests**
- The code is **open source** for verification

## Data Collection

Cookie Manager does **not** collect, store, or transmit any user data. Period.

### What we DON'T do:
- ❌ Send your cookies to any server
- ❌ Track your browsing activity
- ❌ Use analytics or telemetry
- ❌ Store data outside your browser
- ❌ Make any network requests

### What we DO:
- ✅ Read cookies for display (using Chrome's cookies API)
- ✅ Modify cookies when you explicitly request it
- ✅ Store your settings locally (using Chrome's storage API)

## Permissions Explained

### `cookies`
Required to read, create, modify, and delete cookies. This is the core functionality of the extension.

### `activeTab`
Required to get the current tab's URL to show relevant cookies.

### `storage`
Required to save your preferences (like read-only mode) locally on your device.

### `host_permissions: <all_urls>`
Required to access cookies for any website you visit. Without this, we couldn't show cookies for the current site.

## Data Storage

All data is stored locally using Chrome's built-in storage APIs:
- Settings are stored in `chrome.storage.local`
- No external databases or servers are used
- Data never leaves your browser

## Open Source

Cookie Manager is open source. You can review the complete source code at:
https://github.com/nicholasip/cookie-manager

## Contact

For privacy concerns, contact: privacy@zovo.one

## Changes

We will update this policy as needed. Significant changes will be noted in the extension's changelog.
