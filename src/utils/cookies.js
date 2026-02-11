/**
 * Cookie Manager - Cookie Utilities
 * Handles all Chrome cookies API interactions.
 * IIFE pattern - exposes CookieManager globally on self and window.
 */
(function () {
    'use strict';

    var CookieManager = {
        /**
         * Get all cookies for a specific URL
         * @param {string} url - The URL to get cookies for
         * @returns {Promise<chrome.cookies.Cookie[]>}
         */
        getAll: function (url) {
            try {
                var domain = new URL(url).hostname;
                return chrome.cookies.getAll({ domain }).then(function (cookies) {
                    return cookies || [];
                });
            } catch (error) {
                console.error('[CookieManager] Error getting cookies:', error);
                return Promise.resolve([]);
            }
        },

        /**
         * Get all cookies across all domains
         * @returns {Promise<chrome.cookies.Cookie[]>}
         */
        getAllGlobal: function () {
            try {
                return chrome.cookies.getAll({}).then(function (cookies) {
                    return cookies || [];
                });
            } catch (error) {
                console.error('[CookieManager] Error getting global cookies:', error);
                return Promise.resolve([]);
            }
        },

        /**
         * Get a specific cookie
         * @param {string} url - The URL
         * @param {string} name - Cookie name
         * @returns {Promise<chrome.cookies.Cookie|null>}
         */
        get: function (url, name) {
            try {
                return chrome.cookies.get({ url: url, name: name }).then(function (cookie) {
                    return cookie || null;
                });
            } catch (error) {
                console.error('[CookieManager] Error getting cookie:', error);
                return Promise.resolve(null);
            }
        },

        /**
         * Set/update a cookie
         * @param {Object} cookie - Cookie details
         * @returns {Promise<chrome.cookies.Cookie|null>}
         */
        set: function (cookie) {
            try {
                var domain = cookie.domain || '';
                var cleanDomain = domain.startsWith('.') ? domain.slice(1) : domain;
                var url = 'http' + (cookie.secure ? 's' : '') + '://' + cleanDomain + (cookie.path || '/');

                var details = {
                    url: url,
                    name: cookie.name,
                    value: cookie.value,
                    domain: cookie.domain,
                    path: cookie.path || '/',
                    secure: !!cookie.secure,
                    httpOnly: !!cookie.httpOnly,
                    sameSite: cookie.sameSite || 'lax'
                };

                if (cookie.expirationDate != null && typeof cookie.expirationDate === 'number') {
                    details.expirationDate = cookie.expirationDate;
                }

                return chrome.cookies.set(details).then(function (result) {
                    return result || null;
                });
            } catch (error) {
                console.error('[CookieManager] Error setting cookie:', error);
                return Promise.resolve(null);
            }
        },

        /**
         * Delete a cookie
         * @param {string} url - The URL
         * @param {string} name - Cookie name
         * @returns {Promise<Object|null>}
         */
        remove: function (url, name) {
            try {
                return chrome.cookies.remove({ url: url, name: name }).then(function (result) {
                    return result || null;
                });
            } catch (error) {
                console.error('[CookieManager] Error removing cookie:', error);
                return Promise.resolve(null);
            }
        },

        /**
         * Clear all cookies for a domain
         * @param {string} domain - Domain to clear
         * @returns {Promise<number>} - Number of cookies deleted
         */
        clearDomain: function (domain) {
            var self = this;
            try {
                return this.getAll('https://' + domain).then(function (cookies) {
                    var count = 0;
                    var chain = Promise.resolve();

                    for (var i = 0; i < cookies.length; i++) {
                        (function (cookie) {
                            chain = chain.then(function () {
                                var cookieDomain = cookie.domain.startsWith('.')
                                    ? cookie.domain.slice(1)
                                    : cookie.domain;
                                var url = 'http' + (cookie.secure ? 's' : '') + '://' + cookieDomain + cookie.path;
                                return self.remove(url, cookie.name).then(function () {
                                    count++;
                                });
                            });
                        })(cookies[i]);
                    }

                    return chain.then(function () {
                        return count;
                    });
                });
            } catch (error) {
                console.error('[CookieManager] Error clearing domain:', error);
                return Promise.resolve(0);
            }
        },

        /**
         * Export cookies as JSON
         * @param {chrome.cookies.Cookie[]} cookies
         * @returns {string}
         */
        toJSON: function (cookies) {
            return JSON.stringify(cookies, null, 2);
        },

        /**
         * Export cookies as Netscape format (for curl, etc)
         * @param {chrome.cookies.Cookie[]} cookies
         * @returns {string}
         */
        toNetscape: function (cookies) {
            var lines = ['# Netscape HTTP Cookie File', '# Generated by Cookie Manager (zovo.one)'];

            for (var i = 0; i < cookies.length; i++) {
                var c = cookies[i];
                var httpOnly = c.httpOnly ? '#HttpOnly_' : '';
                var domain = c.domain.startsWith('.') ? c.domain : '.' + c.domain;
                var flag = c.domain.startsWith('.') ? 'TRUE' : 'FALSE';
                var secure = c.secure ? 'TRUE' : 'FALSE';
                var expiry = c.expirationDate ? Math.floor(c.expirationDate) : '0';

                lines.push(httpOnly + domain + '\t' + flag + '\t' + c.path + '\t' + secure + '\t' + expiry + '\t' + c.name + '\t' + c.value);
            }

            return lines.join('\n');
        },

        /**
         * Parse cookie string (from document.cookie format)
         * @param {string} cookieString
         * @returns {Object[]}
         */
        parse: function (cookieString) {
            if (!cookieString) return [];

            var pairs = cookieString.split(';');
            var result = [];
            for (var i = 0; i < pairs.length; i++) {
                var parts = pairs[i].trim().split('=');
                var name = parts[0] ? parts[0].trim() : '';
                var value = parts.slice(1).join('=');
                if (name) {
                    result.push({ name: name, value: value });
                }
            }
            return result;
        },

        /**
         * Build URL from cookie properties
         * @param {chrome.cookies.Cookie} cookie
         * @returns {string}
         */
        buildUrl: function (cookie) {
            var domain = cookie.domain.startsWith('.')
                ? cookie.domain.slice(1)
                : cookie.domain;
            return 'http' + (cookie.secure ? 's' : '') + '://' + domain + (cookie.path || '/');
        }
    };

    // Expose globally on both self (service worker) and window (popup/pages)
    if (typeof self !== 'undefined') self.CookieManager = CookieManager;
    if (typeof window !== 'undefined') window.CookieManager = CookieManager;
})();
