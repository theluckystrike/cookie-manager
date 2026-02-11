/**
 * Storage Utility
 * Handles extension settings persistence.
 * IIFE pattern - exposes Storage globally on self and window.
 */
(function () {
    'use strict';

    var DEFAULTS = {
        readOnlyMode: false,
        showHttpOnly: true,
        showSecure: true,
        showSessionCookies: true,
        defaultExportFormat: 'json',
        theme: 'system', // 'light' | 'dark' | 'system'
        protectedDomains: [],
        sortBy: 'name', // 'name' | 'domain' | 'expiry'
        sortOrder: 'asc' // 'asc' | 'desc'
    };

    var Storage = {
        /**
         * Get all settings
         * @returns {Promise<Object>}
         */
        getAll: function () {
            try {
                return chrome.storage.local.get(DEFAULTS).then(function (result) {
                    var merged = {};
                    var keys = Object.keys(DEFAULTS);
                    for (var i = 0; i < keys.length; i++) {
                        merged[keys[i]] = DEFAULTS[keys[i]];
                    }
                    if (result) {
                        var rKeys = Object.keys(result);
                        for (var j = 0; j < rKeys.length; j++) {
                            merged[rKeys[j]] = result[rKeys[j]];
                        }
                    }
                    return merged;
                });
            } catch (error) {
                console.error('[Storage] Error getting settings:', error);
                var copy = {};
                var keys = Object.keys(DEFAULTS);
                for (var i = 0; i < keys.length; i++) {
                    copy[keys[i]] = DEFAULTS[keys[i]];
                }
                return Promise.resolve(copy);
            }
        },

        /**
         * Get a specific setting
         * @param {string} key
         * @returns {Promise<any>}
         */
        get: function (key) {
            try {
                var query = {};
                query[key] = DEFAULTS.hasOwnProperty(key) ? DEFAULTS[key] : undefined;
                return chrome.storage.local.get(query).then(function (result) {
                    return result[key];
                });
            } catch (error) {
                console.error('[Storage] Error getting setting:', error);
                return Promise.resolve(DEFAULTS.hasOwnProperty(key) ? DEFAULTS[key] : undefined);
            }
        },

        /**
         * Set a setting
         * @param {string} key
         * @param {any} value
         * @returns {Promise<void>}
         */
        set: function (key, value) {
            try {
                var data = {};
                data[key] = value;
                return chrome.storage.local.set(data);
            } catch (error) {
                console.error('[Storage] Error setting value:', error);
                return Promise.resolve();
            }
        },

        /**
         * Set multiple settings at once
         * @param {Object} settings
         * @returns {Promise<void>}
         */
        setMultiple: function (settings) {
            try {
                return chrome.storage.local.set(settings);
            } catch (error) {
                console.error('[Storage] Error setting multiple values:', error);
                return Promise.resolve();
            }
        },

        /**
         * Toggle boolean setting
         * @param {string} key
         * @returns {Promise<boolean>} - New value
         */
        toggle: function (key) {
            var self = this;
            return this.get(key).then(function (current) {
                var newValue = !current;
                return self.set(key, newValue).then(function () {
                    return newValue;
                });
            });
        },

        /**
         * Add domain to protected list
         * @param {string} domain
         * @returns {Promise<void>}
         */
        protectDomain: function (domain) {
            var self = this;
            return this.get('protectedDomains').then(function (domains) {
                if (!Array.isArray(domains)) domains = [];
                if (domains.indexOf(domain) === -1) {
                    domains.push(domain);
                    return self.set('protectedDomains', domains);
                }
            });
        },

        /**
         * Remove domain from protected list
         * @param {string} domain
         * @returns {Promise<void>}
         */
        unprotectDomain: function (domain) {
            var self = this;
            return this.get('protectedDomains').then(function (domains) {
                if (!Array.isArray(domains)) return;
                var filtered = [];
                for (var i = 0; i < domains.length; i++) {
                    if (domains[i] !== domain) filtered.push(domains[i]);
                }
                return self.set('protectedDomains', filtered);
            });
        },

        /**
         * Check if domain is protected
         * @param {string} domain
         * @returns {Promise<boolean>}
         */
        isProtected: function (domain) {
            return this.get('protectedDomains').then(function (domains) {
                if (!Array.isArray(domains)) return false;
                for (var i = 0; i < domains.length; i++) {
                    if (domain.endsWith(domains[i])) return true;
                }
                return false;
            });
        },

        /**
         * Reset to defaults
         * @returns {Promise<void>}
         */
        reset: function () {
            try {
                return chrome.storage.local.clear().then(function () {
                    return chrome.storage.local.set(DEFAULTS);
                });
            } catch (error) {
                console.error('[Storage] Error resetting:', error);
                return Promise.resolve();
            }
        },

        /**
         * Export all settings as JSON
         * @returns {Promise<string>}
         */
        exportSettings: function () {
            return this.getAll().then(function (settings) {
                return JSON.stringify(settings, null, 2);
            });
        },

        /**
         * Import settings from JSON
         * @param {string} json
         * @returns {Promise<boolean>}
         */
        importSettings: function (json) {
            var self = this;
            try {
                var settings = JSON.parse(json);
                return self.setMultiple(settings).then(function () {
                    return true;
                });
            } catch (error) {
                console.error('[Storage] Error importing settings:', error);
                return Promise.resolve(false);
            }
        },

        /** Expose defaults for reference */
        DEFAULTS: DEFAULTS
    };

    // Expose globally on both self (service worker) and window (popup/pages)
    if (typeof self !== 'undefined') self.Storage = Storage;
    if (typeof window !== 'undefined') window.Storage = Storage;
})();
