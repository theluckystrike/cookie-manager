# Cookie Manager

[![Chrome Web Store](https://img.shields.io/badge/Chrome-Extension-4285F4?logo=googlechrome&logoColor=white)](https://chrome.google.com/webstore/detail/cookie-manager)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![GitHub](https://img.shields.io/github/stars/theluckystrike/cookie-manager?style=social)](https://github.com/theluckystrike/cookie-manager)

Simple, clean cookie management for Chrome. Built by [Zovo](https://zovo.one).

## Features

### Cookie Management
- **View All Cookies** -- See every cookie for the current site in a clean, searchable list
- **Edit Cookies** -- Modify name, value, domain, path, expiration, and flags (Secure, HttpOnly, SameSite)
- **Add Cookies** -- Create new cookies with a simple form
- **Delete Cookies** -- Remove cookies individually or clear all cookies for a domain
- **Search & Filter** -- Instantly find cookies by name, value, or domain
- **Export** -- Copy all cookies as JSON or Netscape format
- **Import** -- Load cookies from a JSON file

### Developer Tools
- **JWT Decode** -- Automatically detect and decode JWT tokens in cookie values
- **Cookie Health Dashboard** -- Analyze cookie security (Secure, HttpOnly, SameSite flags) with a visual health score
- **Cookie Profiles** -- Save and restore cookie sets for different testing scenarios
- **Auto-Cleanup Rules** -- Schedule automatic cookie cleanup by domain on a timer or at browser close

### Protection & Privacy
- **Read-Only Mode** -- Prevent accidental cookie modifications
- **Domain Protection** -- Configure protected domains in settings
- **100% Local** -- No data collection, no analytics, no network requests

### User Experience
- **Context Menus** -- Right-click to clear site cookies or open Cookie Manager
- **Keyboard Shortcuts** -- Fast workflow with keyboard navigation
- **Notifications** -- Configurable alerts for cookie operations
- **Options Page** -- Full settings panel for general preferences, cookie defaults, notifications, and data management
- **Onboarding** -- Guided setup on first install
- **Internationalization** -- Available in English, Spanish, French, German, Japanese, and Portuguese (Brazil)

## Why Cookie Manager?

EditThisCookie (2M+ users) was removed from the Chrome Web Store. Remaining alternatives have complex, cluttered interfaces. Cookie Manager gives developers what they need: simple view/edit/clear functionality with a clean UI.

## Install

[Add to Chrome](https://chrome.google.com/webstore/detail/cookie-manager/EXTENSION_ID)

Or load unpacked:
1. Clone this repo
2. Go to `chrome://extensions`
3. Enable Developer Mode
4. Click "Load unpacked" and select the project folder

## Build & Package

Requires [Node.js](https://nodejs.org/) (for version reading and build scripts).

```bash
# Package for Chrome Web Store submission
npm run package

# Output: dist/cookie-manager-v{version}.zip
# The zip contains only production files, ready to upload.

# Multi-browser build (Chrome, Firefox, Edge)
npm run build:all

# Validate extension structure
npm run validate

# Lint source files
npm run lint
```

## Project Structure

```
cookie-manager/
  manifest.json          # Chrome extension manifest (MV3)
  src/
    popup/               # Main popup UI (Cookies, Profiles, Rules, Health tabs)
    background/          # Service worker (message routing, context menus, alarms)
    options/             # Settings page
    help/                # Help page
    legal/               # Privacy policy and terms of service
    shared/              # Shared modules (i18n, storage, security, etc.)
    utils/               # Cookie utilities, JWT decoder, storage helpers
  assets/icons/          # Extension icons (16, 32, 48, 128px)
  _locales/              # i18n translations (en, es, fr, de, ja, pt_BR)
  onboarding/            # First-run onboarding flow
  shared/                # Zovo brand styles and growth modules
  scripts/               # Build, packaging, and validation scripts
  store/                 # Chrome Web Store listing assets
```

## Privacy

Cookie Manager:
- Works 100% locally
- No data collection
- No analytics
- No network requests
- Open source

[Full Privacy Policy](https://zovo.one/privacy)

## Contributing

See [CONTRIBUTING.md](docs/CONTRIBUTING.md)

## License

MIT License -- see [LICENSE](LICENSE)

## Support

- [Report a bug](https://github.com/theluckystrike/cookie-manager/issues/new?template=bug_report.md)
- [Request a feature](https://zovo.one/request)
- [Join Zovo](https://zovo.one) for priority support

---

Built by [Michael Ip](https://michaelip.dev) | Part of [Zovo](https://zovo.one)
