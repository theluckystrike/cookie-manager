# MD 15 — Internationalization System
## Cookie Manager — Phase 15 Complete

**Date:** February 2026 | **Status:** Complete
**Extension:** Cookie Manager v1.0.0

---

## Overview

Phase 15 adds full internationalization (i18n) support to Cookie Manager using Chrome's built-in `chrome.i18n` API. The extension now supports 6 languages with 60+ translatable strings, `data-i18n` attribute-based DOM translation, RTL language awareness, and locale-aware number/date formatting.

## Supported Languages

| Language | Locale Code | Market Share | Priority |
|----------|-------------|-------------|----------|
| English | en | 40% | P0 (default) |
| Spanish | es | 15% | P1 |
| German | de | 10% | P1 |
| French | fr | 8% | P2 |
| Japanese | ja | 7% | P2 |
| Portuguese (BR) | pt_BR | 5% | P2 |

## Files Created

| File | Lines | Purpose |
|------|-------|---------|
| `_locales/en/messages.json` | ~250 | Master English locale (60+ message keys) |
| `_locales/es/messages.json` | ~250 | Spanish translation |
| `_locales/de/messages.json` | ~250 | German translation |
| `_locales/fr/messages.json` | ~250 | French translation |
| `_locales/ja/messages.json` | ~250 | Japanese translation |
| `_locales/pt_BR/messages.json` | ~250 | Portuguese (Brazil) translation |
| `src/shared/i18n.js` | ~120 | i18n helper module with DOM translation |

## Files Modified

| File | Changes |
|------|---------|
| `manifest.json` | Added `default_locale: "en"`, converted name/description/title to `__MSG_` references |
| `src/popup/index.html` | Added `data-i18n` attributes to all translatable elements, added i18n.js script |

## i18n Architecture

### Message Key Convention
- camelCase keys grouped by context: `extensionName`, `buttonSave`, `toastCookieDeleted`, `errorLoadCookies`
- Placeholders use `$NAME$` syntax with `content: "$1"` mapping
- Descriptions in English for translator context

### Translation Flow
1. `_locales/{locale}/messages.json` contains all translations
2. `manifest.json` uses `__MSG_key__` for browser-level strings
3. `index.html` uses `data-i18n="key"` attributes for static UI text
4. `popup.js` uses `I18n.t('key')` for dynamic strings (toasts, errors, confirmations)
5. `I18n.translatePage()` runs on DOM ready to apply translations

### RTL Support
- `I18n.getDirection()` returns 'ltr' or 'rtl'
- `I18n.isRTL()` boolean check
- `translatePage()` sets `document.documentElement.dir` automatically
- Ready for Arabic/Hebrew locale addition

## Adding a New Language

1. Create `_locales/{code}/messages.json`
2. Copy from `_locales/en/messages.json`
3. Translate all `message` values (keep `description` in English)
4. Keep technical terms untranslated: Cookie, JWT, HttpOnly, SameSite, Secure, Domain, Path
5. Keep brand names unchanged: "Cookie Manager", "zovo."
6. Test with `chrome://extensions` → Details → Language override

---

*Phase 15 — Internationalization System — Complete*
*Part of Cookie Manager by Zovo (https://zovo.one)*
