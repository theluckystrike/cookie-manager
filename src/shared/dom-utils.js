/**
 * Cookie Manager - DOM Utilities & Security Helpers
 * Prevents XSS by avoiding innerHTML for dynamic content.
 * Provides safe element builders, URL/domain validation, and sanitization.
 */
(function (root) {
    'use strict';

    var SVG_NS = 'http://www.w3.org/2000/svg';
    var MAX_DISPLAY = 1000;
    var DOMAIN_RE = /^(?:\*\.)?(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)*[a-z]{2,63}$/i;
    var CTRL_RE = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;
    var DANGER_PROTO = /^\s*(?:javascript|data|vbscript)\s*:/i;
    var COOKIE_UNSAFE = /[\x00-\x1F\x7F;=,\s]/;
    var ENT = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;' };

    // -- HTML Escaping -----------------------------------------------------

    function escapeHtml(text) {
        if (text == null) return '';
        return String(text).replace(/[&<>"']/g, function (c) { return ENT[c]; });
    }

    // -- Safe Element Builder ----------------------------------------------

    function applyAttrs(el, attrs) {
        if (!attrs || typeof attrs !== 'object') return;
        var keys = Object.keys(attrs);
        for (var i = 0; i < keys.length; i++) {
            var k = keys[i], v = attrs[k];
            if (v == null) continue;
            if (k === 'className') { el.className = String(v); continue; }
            if (k === 'dataset' && typeof v === 'object') {
                var dk = Object.keys(v);
                for (var d = 0; d < dk.length; d++) el.dataset[dk[d]] = String(v[dk[d]]);
                continue;
            }
            if (k === 'style' && typeof v === 'object') {
                var sk = Object.keys(v);
                for (var s = 0; s < sk.length; s++) el.style[sk[s]] = v[sk[s]];
                continue;
            }
            if (typeof v === 'boolean') { if (v) el.setAttribute(k, ''); }
            else el.setAttribute(k, String(v));
        }
    }

    function addChildren(parent, children) {
        if (!children) return;
        if (!Array.isArray(children)) children = [children];
        for (var i = 0; i < children.length; i++) {
            var c = children[i];
            if (c == null) continue;
            if (typeof c === 'string' || typeof c === 'number') {
                parent.appendChild(document.createTextNode(String(c)));
            } else if (c.nodeType) {
                parent.appendChild(c);
            }
        }
    }

    function createElement(tag, attrs, children) {
        if (typeof tag !== 'string' || !tag) return null;
        var el = document.createElement(tag);
        applyAttrs(el, attrs);
        addChildren(el, children);
        return el;
    }

    // -- SVG Builder (namespaced) ------------------------------------------

    function createSvg(width, height, paths) {
        var svg = document.createElementNS(SVG_NS, 'svg');
        svg.setAttribute('width', String(width));
        svg.setAttribute('height', String(height));
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('fill', 'none');
        svg.setAttribute('stroke', 'currentColor');
        svg.setAttribute('stroke-width', '2');
        svg.setAttribute('stroke-linecap', 'round');
        svg.setAttribute('stroke-linejoin', 'round');
        if (!Array.isArray(paths)) return svg;
        for (var i = 0; i < paths.length; i++) {
            var p = paths[i];
            if (!p || typeof p !== 'object') continue;
            var el = document.createElementNS(SVG_NS, p.tag || 'path');
            var ak = Object.keys(p);
            for (var j = 0; j < ak.length; j++) {
                if (ak[j] !== 'tag') el.setAttribute(ak[j], String(p[ak[j]]));
            }
            svg.appendChild(el);
        }
        return svg;
    }

    // -- URL & Domain Validation -------------------------------------------

    function sanitizeUrl(url) {
        if (typeof url !== 'string' || !url.trim()) return null;
        var trimmed = url.trim();
        if (DANGER_PROTO.test(trimmed)) return null;
        try {
            var parsed = new URL(trimmed);
            if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
            return parsed.href;
        } catch (_) { return null; }
    }

    function isValidDomain(domain) {
        if (typeof domain !== 'string') return false;
        var d = domain.startsWith('.') ? domain.slice(1) : domain;
        if (!d || d.length > 253) return false;
        return DOMAIN_RE.test(d);
    }

    // -- Cookie Name Validation --------------------------------------------

    function isValidCookieName(name) {
        if (typeof name !== 'string' || !name || name.length > 4096) return false;
        return !COOKIE_UNSAFE.test(name);
    }

    // -- Display Sanitization ----------------------------------------------

    function sanitizeDisplay(text, maxLength) {
        if (text == null) return '';
        var str = String(text).replace(CTRL_RE, '');
        var lim = (typeof maxLength === 'number' && maxLength > 0) ? maxLength : MAX_DISPLAY;
        return str.length > lim ? str.slice(0, lim) + '\u2026' : str;
    }

    // -- Safe DOM Helpers --------------------------------------------------

    function setText(element, text) {
        if (!element || typeof element.textContent === 'undefined') return;
        element.textContent = text == null ? '' : String(text);
    }

    function clearChildren(element) {
        if (!element) return;
        while (element.firstChild) element.removeChild(element.firstChild);
    }

    // -- Expose API --------------------------------------------------------

    var DomUtils = {
        escapeHtml: escapeHtml,
        createElement: createElement,
        createSvg: createSvg,
        sanitizeUrl: sanitizeUrl,
        isValidDomain: isValidDomain,
        isValidCookieName: isValidCookieName,
        sanitizeDisplay: sanitizeDisplay,
        setText: setText,
        clearChildren: clearChildren
    };

    if (typeof self !== 'undefined') self.DomUtils = DomUtils;
    if (typeof window !== 'undefined') window.DomUtils = DomUtils;
})(typeof self !== 'undefined' ? self : this);
