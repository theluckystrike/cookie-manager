# Phase 18: Security Hardening Audit

## Overview
Comprehensive security hardening of the Cookie Manager extension covering input sanitization, XSS prevention, message validation, and automated security scanning.

## Architecture

### Security Layers
Cookie Manager implements defense-in-depth with multiple security layers:

1. **Content Security Policy** — Strict CSP in manifest (`script-src 'self'; object-src 'none'`)
2. **Input Sanitization** — All user inputs validated and sanitized before processing
3. **Message Validation** — Whitelist-based validation of all chrome.runtime messages
4. **XSS Prevention** — DOM API usage over innerHTML, HTML escaping, unsafe content detection
5. **Origin Verification** — Sender ID validation on all incoming messages
6. **Data Validation** — Cookie field validation against RFC 6265 rules

### Zero-Trust Message Pipeline
```
Popup/Content Script → Message → Sender Validation → Action Whitelist Check → Payload Sanitization → Handler
```

## New Modules

### `src/shared/security-hardener.js` (~200 lines)
Core security utilities providing:
- **Input sanitization**: `sanitizeString()`, `sanitizeDomain()`, `sanitizePath()`, `sanitizeCookieName()`, `sanitizeCookieValue()`
- **XSS prevention**: `escapeHtml()`, `isUnsafeHtml()`, `stripHtml()`
- **URL validation**: `isValidUrl()`, `isExtensionUrl()`, `isSafeRedirect()`
- **Data validation**: `isValidCookieData()`, `isValidJSON()`, `validateStorageKey()`
- **CSP helpers**: `checkCSPViolation()`, `hasUnsafeInline()`

### `src/shared/message-validator.js` (~180 lines)
Whitelist-based message validation:
- **Action registry**: All 22 known message actions with expected payload schemas
- **Message validation**: `validateMessage()` checks action, payload structure, field types
- **Payload sanitization**: `sanitizePayload()` strips unknown fields, trims strings, coerces types
- **Rate limiting**: In-memory sliding window rate limiter per action (60/min default)
- **Origin validation**: `isInternalSender()` verifies sender.id matches chrome.runtime.id

### `scripts/security-scan.js` (~200 lines)
Automated static analysis CLI tool:
- Scans `.js`, `.html`, `.json` files recursively
- Detects: eval(), innerHTML, document.write, hardcoded secrets, insecure URLs, dynamic regex
- 4 severity levels: critical, high, medium, low
- Color-coded terminal output grouped by severity
- JSON report output to `security-scan-results.json`
- CI-friendly exit codes (1 for critical/high findings)
- Usage: `node scripts/security-scan.js [directory]`

## Integration Changes

### Service Worker (`src/background/service-worker.js`)
- Added sender origin validation on all incoming messages
- Added message structure validation before routing
- Added input sanitization for SET_COOKIE payloads (name, domain, path, sameSite whitelist)
- Security section with `isValidSender()`, `validateIncomingMessage()`, `sanitizeInput()` helpers
- All security functions use `typeof` guards for optional module availability

### Popup (`src/popup/popup.js`)
- Replaced `innerHTML` in `renderCookies()` with template-based DOM insertion
- Replaced `innerHTML` in `showRetentionBanner()` with DOM API (createElement/appendChild)
- Documented safe static SVG innerHTML usage in `showToast()` with security comments

## Security Checklist Status

| Control | Status | Implementation |
|---------|--------|----------------|
| Manifest V3 | Done | manifest.json |
| Strict CSP | Done | `script-src 'self'; object-src 'none'` |
| No eval/Function | Done | Verified by security scanner |
| innerHTML hardened | Done | Replaced with DOM API or template |
| Input validation | Done | SecurityHardener module |
| Message whitelist | Done | MessageValidator module |
| Sender verification | Done | isValidSender() in service worker |
| No remote code | Done | Zero external requests architecture |
| Zero dependencies | Done | No npm packages, all code local |
| Cookie data validation | Done | RFC 6265 field validation |
| Automated scanning | Done | security-scan.js CLI tool |
| SameSite enforcement | Done | Whitelist validation in SET_COOKIE |

## Usage

### Run Security Scanner
```bash
# Scan src/ directory (default)
node scripts/security-scan.js

# Scan specific directory
node scripts/security-scan.js ./src/popup

# Check results
cat security-scan-results.json
```

### Validate a Message (in code)
```javascript
if (typeof MessageValidator !== 'undefined') {
    var result = MessageValidator.validateMessage(message);
    if (!result.valid) {
        console.warn('Invalid message:', result.errors);
    }
}
```

### Sanitize User Input (in code)
```javascript
if (typeof SecurityHardener !== 'undefined') {
    var safeName = SecurityHardener.sanitizeCookieName(userInput);
    var safeDomain = SecurityHardener.sanitizeDomain(rawDomain);
}
```

## Privacy & Data Handling
- All security operations are 100% local — zero external requests
- No telemetry, no error reporting to external services
- Cookie data never leaves the extension's storage boundary
- Security scan results stored locally only
- Rate limit counters are in-memory only (cleared on service worker restart)

## Files Changed
| File | Action | Description |
|------|--------|-------------|
| `src/shared/security-hardener.js` | Created | Security utilities module |
| `src/shared/message-validator.js` | Created | Message validation module |
| `scripts/security-scan.js` | Created | Automated security scanner |
| `src/background/service-worker.js` | Modified | Added sender/message validation, input sanitization |
| `src/popup/popup.js` | Modified | Replaced innerHTML with DOM API |
| `docs/18-security-hardening-audit.md` | Created | This report |
