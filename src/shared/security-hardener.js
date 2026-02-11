/**
 * Cookie Manager - Security Hardener
 * Input sanitization, XSS prevention, URL validation, and data safety utilities.
 * Provides defense-in-depth helpers for all user-facing and storage-facing data.
 * Local only - zero external dependencies. Works in service worker and popup contexts.
 *
 * Usage:
 *   SecurityHardener.sanitizeString(str, 256)
 *   SecurityHardener.sanitizeDomain('https://Example.COM/path')  // 'example.com'
 *   SecurityHardener.escapeHtml('<script>alert(1)</script>')
 *   SecurityHardener.isValidUrl('https://example.com')
 *   SecurityHardener.isValidCookieData({ name: 'a', value: 'b', domain: '.example.com' })
 *   SecurityHardener.checkCSPViolation()
 */
(function () {
    'use strict';

    // -- Constants -----------------------------------------------------------
    var DEFAULT_MAX_LENGTH = 4096;
    var MAX_DOMAIN_LENGTH = 253;
    var MAX_COOKIE_NAME_LEN = 512;
    var MAX_COOKIE_VALUE_LEN = 4096;
    var MAX_STORAGE_KEY_LEN = 128;
    var CTRL_RE = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g;
    // RFC 6265 s4.1.1 — valid cookie-name token (visible ASCII minus separators)
    var BAD_CNAME_RE = /[^\x21\x23-\x27\x2A\x2B\x2D\x2E\x30-\x39\x41-\x5A\x5E-\x7A\x7C\x7E]/g;
    var BAD_CVAL_RE = /[;\x00-\x1F\x7F]/g;
    var DOMAIN_RE = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)*[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
    var UNSAFE_REDIRECT_RE = /^\s*(?:javascript|data|vbscript|blob)\s*:/i;
    var UNSAFE_HTML_PATTERNS = [
        /<script[\s>\/]/i, /javascript\s*:/i, /vbscript\s*:/i,
        /on(?:load|error|click|mouse|focus|blur|submit|change|input|key|drag|touch|pointer|animation|transition)\s*=/i,
        /<iframe[\s>\/]/i, /<object[\s>\/]/i, /<embed[\s>\/]/i, /<form[\s>\/]/i,
        /expression\s*\(/i, /url\s*\(\s*['"]?\s*javascript/i
    ];

    // -- 1. Input Sanitization -----------------------------------------------

    function sanitizeString(str, maxLength) {
        if (typeof str !== 'string') return '';
        var limit = (typeof maxLength === 'number' && maxLength > 0) ? maxLength : DEFAULT_MAX_LENGTH;
        var result = str.trim();
        if (result.length > limit) result = result.substring(0, limit);
        return result.replace(CTRL_RE, '');
    }

    function sanitizeDomain(domain) {
        if (typeof domain !== 'string') return '';
        var d = domain.trim().toLowerCase();
        d = d.replace(/^(?:https?|ftp):\/\//, '');   // strip protocol
        d = d.replace(/[\/\?#:].*$/, '');             // strip path/query/fragment/port
        var dot = '';
        if (d.charAt(0) === '.') { dot = '.'; d = d.substring(1); }
        if (d.length === 0 || d.length > MAX_DOMAIN_LENGTH) return '';
        return DOMAIN_RE.test(d) ? dot + d : '';
    }

    function sanitizePath(path) {
        if (typeof path !== 'string') return '/';
        var p = path.trim();
        var qi = p.indexOf('?'); if (qi !== -1) p = p.substring(0, qi);
        var hi = p.indexOf('#'); if (hi !== -1) p = p.substring(0, hi);
        if (p.charAt(0) !== '/') p = '/' + p;
        p = p.replace(CTRL_RE, '');
        return p || '/';
    }

    function sanitizeCookieName(name) {
        if (typeof name !== 'string') return '';
        var n = name.trim();
        if (n.length > MAX_COOKIE_NAME_LEN) n = n.substring(0, MAX_COOKIE_NAME_LEN);
        return n.replace(BAD_CNAME_RE, '');
    }

    function sanitizeCookieValue(value) {
        if (typeof value !== 'string') return '';
        var v = value;
        if (v.length > MAX_COOKIE_VALUE_LEN) v = v.substring(0, MAX_COOKIE_VALUE_LEN);
        return v.replace(BAD_CVAL_RE, '');
    }

    // -- 2. XSS Prevention ---------------------------------------------------

    function escapeHtml(str) {
        if (typeof str !== 'string') return '';
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
                  .replace(/"/g, '&quot;').replace(/'/g, '&#x27;');
    }

    function isUnsafeHtml(str) {
        if (typeof str !== 'string') return false;
        for (var i = 0; i < UNSAFE_HTML_PATTERNS.length; i++) {
            if (UNSAFE_HTML_PATTERNS[i].test(str)) return true;
        }
        return false;
    }

    function stripHtml(str) {
        if (typeof str !== 'string') return '';
        return str.replace(/<[^>]*>/g, '');
    }

    // -- 3. URL Validation ---------------------------------------------------

    function isValidUrl(url) {
        if (typeof url !== 'string') return false;
        var t = url.trim();
        if (!/^https?:\/\//i.test(t)) return false;
        if (typeof URL === 'function') {
            try { var p = new URL(t); return p.protocol === 'http:' || p.protocol === 'https:'; }
            catch (e) { return false; }
        }
        return /^https?:\/\/[^\s]+$/.test(t);
    }

    function isExtensionUrl(url) {
        if (typeof url !== 'string') return false;
        return /^(?:chrome|moz)-extension:\/\//i.test(url.trim());
    }

    function isSafeRedirect(url) {
        if (typeof url !== 'string') return false;
        var t = url.trim();
        if (UNSAFE_REDIRECT_RE.test(t)) return false;
        if (isValidUrl(t) || isExtensionUrl(t)) return true;
        return t.charAt(0) === '/';
    }

    // -- 4. Data Validation --------------------------------------------------

    function isValidCookieData(cookie) {
        if (!cookie || typeof cookie !== 'object') return false;
        if (typeof cookie.name !== 'string' || cookie.name.trim().length === 0) return false;
        if (typeof cookie.value !== 'string') return false;
        if (cookie.domain != null) {
            if (typeof cookie.domain !== 'string' || sanitizeDomain(cookie.domain) === '') return false;
        }
        if (cookie.path != null && typeof cookie.path !== 'string') return false;
        if (isUnsafeHtml(cookie.name) || isUnsafeHtml(cookie.value)) return false;
        return true;
    }

    function isValidJSON(str) {
        if (typeof str !== 'string') return false;
        try { JSON.parse(str); return true; } catch (e) { return false; }
    }

    function validateStorageKey(key) {
        if (typeof key !== 'string') return false;
        var k = key.trim();
        if (k.length === 0 || k.length > MAX_STORAGE_KEY_LEN) return false;
        return /^[a-zA-Z0-9_\-\.]+$/.test(k);
    }

    // -- 5. CSP Helpers ------------------------------------------------------

    function checkCSPViolation() {
        try {
            var ns = (typeof chrome !== 'undefined' && chrome && chrome.runtime) ? chrome :
                     (typeof browser !== 'undefined' && browser && browser.runtime) ? browser : null;
            if (!ns || typeof ns.runtime.getManifest !== 'function') return null;
            var manifest = ns.runtime.getManifest();
            if (!manifest) return null;
            var csp = manifest.content_security_policy;
            if (typeof csp === 'string') return csp;
            if (csp && typeof csp === 'object') return csp.extension_pages || csp.sandbox || null;
            return null;
        } catch (e) { return null; }
    }

    function hasUnsafeInline() {
        var csp = checkCSPViolation();
        if (typeof csp !== 'string') return false;
        return /['"]?unsafe-inline['"]?/i.test(csp);
    }

    // -- Public API ----------------------------------------------------------

    var SecurityHardener = {
        sanitizeString: sanitizeString,
        sanitizeDomain: sanitizeDomain,
        sanitizePath: sanitizePath,
        sanitizeCookieName: sanitizeCookieName,
        sanitizeCookieValue: sanitizeCookieValue,
        escapeHtml: escapeHtml,
        isUnsafeHtml: isUnsafeHtml,
        stripHtml: stripHtml,
        isValidUrl: isValidUrl,
        isExtensionUrl: isExtensionUrl,
        isSafeRedirect: isSafeRedirect,
        isValidCookieData: isValidCookieData,
        isValidJSON: isValidJSON,
        validateStorageKey: validateStorageKey,
        checkCSPViolation: checkCSPViolation,
        hasUnsafeInline: hasUnsafeInline
    };

    // -- Expose Globally -----------------------------------------------------
    if (typeof self !== 'undefined') self.SecurityHardener = SecurityHardener;
    if (typeof window !== 'undefined') window.SecurityHardener = SecurityHardener;
})();
