// Cookie Manager - i18n Loader
// Handles automatic localization of HTML pages using data-i18n attributes.
(function() {
    'use strict';

    var I18nLoader = {
        init: function() {
            this.localizeTextContent();
            this.localizePlaceholders();
            this.localizeTitle();
            this.localizeAriaLabels();
            this.localizeHtmlTitle();
            this.setDocumentDirection();
        },

        localizeTextContent: function() {
            var elements = document.querySelectorAll('[data-i18n]');
            elements.forEach(function(el) {
                var key = el.getAttribute('data-i18n');
                if (!key) return;
                var message = chrome.i18n.getMessage(key);
                if (message) el.textContent = message;
            });
        },

        localizePlaceholders: function() {
            var elements = document.querySelectorAll('[data-i18n-placeholder]');
            elements.forEach(function(el) {
                var key = el.getAttribute('data-i18n-placeholder');
                if (!key) return;
                var message = chrome.i18n.getMessage(key);
                if (message) el.setAttribute('placeholder', message);
            });
        },

        localizeTitle: function() {
            var elements = document.querySelectorAll('[data-i18n-title]');
            elements.forEach(function(el) {
                var key = el.getAttribute('data-i18n-title');
                if (!key) return;
                var message = chrome.i18n.getMessage(key);
                if (message) el.setAttribute('title', message);
            });
        },

        localizeAriaLabels: function() {
            var elements = document.querySelectorAll('[data-i18n-aria]');
            elements.forEach(function(el) {
                var key = el.getAttribute('data-i18n-aria');
                if (!key) return;
                var message = chrome.i18n.getMessage(key);
                if (message) el.setAttribute('aria-label', message);
            });
        },

        localizeHtmlTitle: function() {
            var titleEl = document.querySelector('title[data-i18n]');
            if (titleEl) {
                var key = titleEl.getAttribute('data-i18n');
                var message = chrome.i18n.getMessage(key);
                if (message) document.title = message;
            }
        },

        setDocumentDirection: function() {
            var rtlLocales = ['ar', 'he', 'fa', 'ur'];
            var uiLocale = chrome.i18n.getUILanguage();
            var isRtl = rtlLocales.some(function(loc) { return uiLocale.startsWith(loc); });
            document.documentElement.setAttribute('dir', isRtl ? 'rtl' : 'ltr');
            document.documentElement.setAttribute('lang', uiLocale);
            if (isRtl) document.body.classList.add('rtl');
        },

        localizeElement: function(element) {
            if (element.hasAttribute('data-i18n')) {
                var msg = chrome.i18n.getMessage(element.getAttribute('data-i18n'));
                if (msg) element.textContent = msg;
            }
            if (element.hasAttribute('data-i18n-placeholder')) {
                var msg2 = chrome.i18n.getMessage(element.getAttribute('data-i18n-placeholder'));
                if (msg2) element.setAttribute('placeholder', msg2);
            }
            if (element.hasAttribute('data-i18n-title')) {
                var msg3 = chrome.i18n.getMessage(element.getAttribute('data-i18n-title'));
                if (msg3) element.setAttribute('title', msg3);
            }
            if (element.hasAttribute('data-i18n-aria')) {
                var msg4 = chrome.i18n.getMessage(element.getAttribute('data-i18n-aria'));
                if (msg4) element.setAttribute('aria-label', msg4);
            }
        },

        localizeContainer: function(container) {
            var elements = container.querySelectorAll('[data-i18n], [data-i18n-placeholder], [data-i18n-title], [data-i18n-aria]');
            var self = this;
            elements.forEach(function(el) { self.localizeElement(el); });
        }
    };

    // Run on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() { I18nLoader.init(); });
    } else {
        I18nLoader.init();
    }

    // Expose globally (only in window context; I18nLoader uses document APIs)
    if (typeof window !== 'undefined') window.I18nLoader = I18nLoader;
})();
