/**
 * Cookie Manager - Internationalization Helper
 * Wraps chrome.i18n API with fallbacks and DOM translation.
 */
(function (root) {
    'use strict';

    var RTL_LANGS = /^(ar|fa|he|ur|yi|ps|sd|ku|dv|ug)/i;

    function t(key, substitutions) {
        try {
            var subs = substitutions;
            if (typeof subs === 'string') subs = [subs];
            var msg = chrome.i18n.getMessage(key, subs);
            return msg || key;
        } catch (_) { return key; }
    }

    function getLocale() {
        try { return chrome.i18n.getUILanguage(); }
        catch (_) { return 'en'; }
    }

    function getDirection() {
        try {
            var dir = chrome.i18n.getMessage('@@bidi_dir');
            return dir || 'ltr';
        } catch (_) { return 'ltr'; }
    }

    function isRTL() {
        try { return getDirection() === 'rtl'; }
        catch (_) { return false; }
    }

    function _applyI18n(el) {
        try {
            var key = el.getAttribute('data-i18n');
            if (key) el.textContent = t(key);

            var phKey = el.getAttribute('data-i18n-placeholder');
            if (phKey) el.placeholder = t(phKey);

            var titleKey = el.getAttribute('data-i18n-title');
            if (titleKey) el.title = t(titleKey);

            var ariaKey = el.getAttribute('data-i18n-aria');
            if (ariaKey) el.setAttribute('aria-label', t(ariaKey));
        } catch (_) { /* skip element */ }
    }

    function translatePage() {
        try {
            var doc = document.documentElement;
            doc.dir = getDirection();
            doc.lang = getLocale();

            var els = document.querySelectorAll(
                '[data-i18n],[data-i18n-placeholder],[data-i18n-title],[data-i18n-aria]'
            );
            for (var i = 0; i < els.length; i++) {
                _applyI18n(els[i]);
            }
        } catch (_) { /* translation pass failed */ }
    }

    function translateElement(el) {
        try {
            if (!el || !el.querySelectorAll) return;
            _applyI18n(el);
            var children = el.querySelectorAll(
                '[data-i18n],[data-i18n-placeholder],[data-i18n-title],[data-i18n-aria]'
            );
            for (var i = 0; i < children.length; i++) {
                _applyI18n(children[i]);
            }
        } catch (_) { /* element translation failed */ }
    }

    function formatNumber(num) {
        try {
            return new Intl.NumberFormat(getLocale()).format(num);
        } catch (_) { return String(num); }
    }

    function formatDate(date) {
        try {
            var d = date instanceof Date ? date : new Date(date);
            return new Intl.DateTimeFormat(getLocale()).format(d);
        } catch (_) { return String(date); }
    }

    var I18n = {
        t: t,
        translatePage: translatePage,
        translateElement: translateElement,
        getLocale: getLocale,
        getDirection: getDirection,
        isRTL: isRTL,
        formatNumber: formatNumber,
        formatDate: formatDate
    };

    if (typeof self !== 'undefined') self.I18n = I18n;
    if (typeof window !== 'undefined') window.I18n = I18n;
})(typeof self !== 'undefined' ? self : this);
