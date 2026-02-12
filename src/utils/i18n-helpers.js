// Cookie Manager - i18n Helper Utilities
(function() {
    'use strict';

    var I18nHelpers = {
        // Shorthand for chrome.i18n.getMessage()
        t: function(key, substitutions) {
            var message = chrome.i18n.getMessage(key, substitutions);
            if (!message) {
                console.warn('[i18n] Missing translation for key: "' + key + '"');
                return key;
            }
            return message;
        },

        // Pluralization
        tPlural: function(baseKey, count) {
            var suffix;
            if (count === 0) suffix = '_zero';
            else if (count === 1) suffix = '_one';
            else suffix = '_other';

            var message = chrome.i18n.getMessage(baseKey + suffix, [String(count)]);
            if (!message) message = chrome.i18n.getMessage(baseKey + '_other', [String(count)]);
            if (!message) message = chrome.i18n.getMessage(baseKey, [String(count)]);
            if (!message) return count + ' items';
            return message;
        },

        // Locale-aware date formatting
        tDate: function(date, options) {
            var locale = this.getCurrentLocale();
            var dateObj = date instanceof Date ? date : new Date(date);
            if (isNaN(dateObj.getTime())) return String(date);
            var defaults = { dateStyle: 'medium' };
            if (options) {
                for (var k in options) { if (options.hasOwnProperty(k)) defaults[k] = options[k]; }
            }
            try { return new Intl.DateTimeFormat(locale, defaults).format(dateObj); }
            catch (e) { return dateObj.toLocaleDateString(locale); }
        },

        // Locale-aware number formatting
        tNumber: function(num, options) {
            var locale = this.getCurrentLocale();
            if (typeof num !== 'number' || isNaN(num)) return String(num);
            try { return new Intl.NumberFormat(locale, options || {}).format(num); }
            catch (e) { return num.toLocaleString(locale); }
        },

        // Relative time formatting
        tRelativeTime: function(date, style) {
            var locale = this.getCurrentLocale();
            var dateObj = date instanceof Date ? date : new Date(date);
            var now = new Date();
            var diffMs = dateObj.getTime() - now.getTime();
            var diffSec = Math.round(diffMs / 1000);
            var diffMin = Math.round(diffSec / 60);
            var diffHr = Math.round(diffMin / 60);
            var diffDay = Math.round(diffHr / 24);
            try {
                var rtf = new Intl.RelativeTimeFormat(locale, { style: style || 'long' });
                if (Math.abs(diffSec) < 60) return rtf.format(diffSec, 'second');
                if (Math.abs(diffMin) < 60) return rtf.format(diffMin, 'minute');
                if (Math.abs(diffHr) < 24) return rtf.format(diffHr, 'hour');
                return rtf.format(diffDay, 'day');
            } catch (e) { return this.tDate(dateObj); }
        },

        getCurrentLocale: function() {
            return chrome.i18n.getUILanguage().replace('_', '-');
        },

        isRtl: function() {
            var rtlLocales = ['ar', 'he', 'fa', 'ur'];
            var locale = chrome.i18n.getUILanguage();
            return rtlLocales.some(function(rtl) { return locale.startsWith(rtl); });
        },

        getDirection: function() {
            return this.isRtl() ? 'rtl' : 'ltr';
        }
    };

    // Expose globally
    if (typeof window !== 'undefined') {
        window.I18nHelpers = I18nHelpers;
        window.t = I18nHelpers.t.bind(I18nHelpers);
        window.tPlural = I18nHelpers.tPlural.bind(I18nHelpers);
        window.tDate = I18nHelpers.tDate.bind(I18nHelpers);
        window.tNumber = I18nHelpers.tNumber.bind(I18nHelpers);
        window.tRelativeTime = I18nHelpers.tRelativeTime.bind(I18nHelpers);
    }
    if (typeof self !== 'undefined') {
        self.I18nHelpers = I18nHelpers;
        self.t = I18nHelpers.t.bind(I18nHelpers);
    }
})();
