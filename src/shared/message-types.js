/**
 * Message Types & Communication Helpers
 * Central registry of all message types with validation and sending utilities.
 * IIFE pattern - exposes MessageTypes, MessageResponse, MessageHelper globally.
 */
(function () {
    'use strict';

    var _types = {
        // Cookie operations
        GET_COOKIES: 'GET_COOKIES',
        SET_COOKIE: 'SET_COOKIE',
        DELETE_COOKIE: 'DELETE_COOKIE',
        CLEAR_DOMAIN: 'CLEAR_DOMAIN',
        EXPORT_COOKIES: 'EXPORT_COOKIES',
        // Settings
        GET_SETTINGS: 'GET_SETTINGS',
        // Monitoring (MD 11)
        REPORT_ERROR: 'REPORT_ERROR',
        REPORT_ERRORS_BATCH: 'REPORT_ERRORS_BATCH',
        GET_ERROR_LOGS: 'GET_ERROR_LOGS',
        CLEAR_ERROR_LOGS: 'CLEAR_ERROR_LOGS',
        GET_DEBUG_LOGS: 'GET_DEBUG_LOGS',
        GET_HEALTH_REPORT: 'GET_HEALTH_REPORT',
        TOGGLE_DEBUG_MODE: 'TOGGLE_DEBUG_MODE',
        // Growth & Milestones (MD 14)
        GET_MILESTONES: 'GET_MILESTONES',
        GET_GROWTH_STATS: 'GET_GROWTH_STATS',
        // Churn Prevention & Retention (MD 17)
        GET_CHURN_STATUS: 'GET_CHURN_STATUS',
        GET_ENGAGEMENT_SCORE: 'GET_ENGAGEMENT_SCORE',
        GET_RETENTION_TRIGGER: 'GET_RETENTION_TRIGGER',
        RECORD_USAGE: 'RECORD_USAGE',
        DISMISS_TRIGGER: 'DISMISS_TRIGGER',
        // Customer Support & Feedback (MD 19)
        SUBMIT_FEEDBACK: 'SUBMIT_FEEDBACK',
        GET_FEEDBACK_STATS: 'GET_FEEDBACK_STATS',
        GET_FEEDBACK: 'GET_FEEDBACK',
        EXPORT_FEEDBACK: 'EXPORT_FEEDBACK',
        GET_DIAGNOSTICS: 'GET_DIAGNOSTICS',
        GET_QUICK_CHECK: 'GET_QUICK_CHECK',
        // Performance Monitoring (MD 20)
        GET_PERF_SUMMARY: 'GET_PERF_SUMMARY',
        CHECK_PERF_BUDGETS: 'CHECK_PERF_BUDGETS',
        GET_STORAGE_USAGE: 'GET_STORAGE_USAGE',
        RUN_STORAGE_CLEANUP: 'RUN_STORAGE_CLEANUP',
        ANALYZE_STORAGE_KEYS: 'ANALYZE_STORAGE_KEYS',
        // Version & Release Management (MD 22)
        GET_VERSION_INFO: 'GET_VERSION_INFO',
        GET_FEATURE_FLAGS: 'GET_FEATURE_FLAGS',
        SET_FEATURE_FLAG: 'SET_FEATURE_FLAG',
        GET_UPDATE_HISTORY: 'GET_UPDATE_HISTORY',
        // Legal Compliance (MD 23)
        GET_PRIVACY_SUMMARY: 'GET_PRIVACY_SUMMARY',
        EXPORT_USER_DATA: 'EXPORT_USER_DATA',
        DELETE_USER_DATA: 'DELETE_USER_DATA',
        GET_DATA_SUMMARY: 'GET_DATA_SUMMARY',
        GET_CONSENT_STATUS: 'GET_CONSENT_STATUS',
        SET_CONSENT: 'SET_CONSENT',
        GET_COMPLIANCE_LOG: 'GET_COMPLIANCE_LOG',
        // Extended Cookie Operations
        GET_ALL_COOKIES: 'GET_ALL_COOKIES',
        // Cookie Profiles
        SAVE_COOKIE_PROFILE: 'SAVE_COOKIE_PROFILE',
        LOAD_COOKIE_PROFILE: 'LOAD_COOKIE_PROFILE',
        GET_COOKIE_PROFILES: 'GET_COOKIE_PROFILES',
        DELETE_COOKIE_PROFILE: 'DELETE_COOKIE_PROFILE',
        // Settings Management
        SAVE_SETTINGS: 'SAVE_SETTINGS',
        // Auto-Delete Rules
        GET_AUTO_DELETE_RULES: 'GET_AUTO_DELETE_RULES',
        SAVE_AUTO_DELETE_RULE: 'SAVE_AUTO_DELETE_RULE',
        DELETE_AUTO_DELETE_RULE: 'DELETE_AUTO_DELETE_RULE'
    };

    var _knownActions = Object.create(null);
    for (var k in _types) _knownActions[_types[k]] = true;
    Object.freeze(_types);

    // Standardized response wrapper
    var _response = {
        success: function (data) {
            return { success: true, data: data !== undefined ? data : null };
        },
        error: function (message, code) {
            return { success: false, error: String(message || 'Unknown error'), code: code || 'ERR_UNKNOWN' };
        }
    };

    var _helper = {
        /** Send message to background with timeout (default 10s) and error wrapping. */
        send: function (action, payload, timeoutMs) {
            var ms = typeof timeoutMs === 'number' && timeoutMs > 0 ? timeoutMs : 10000;
            var msg = _helper.create(action, payload);
            if (!msg) {
                return Promise.resolve(
                    _response.error('Invalid action: ' + action, 'ERR_INVALID_ACTION')
                );
            }
            return new Promise(function (resolve) {
                var settled = false;
                var timer = setTimeout(function () {
                    if (!settled) {
                        settled = true;
                        resolve(_response.error('Message timed out after ' + ms + 'ms', 'ERR_TIMEOUT'));
                    }
                }, ms);
                try {
                    chrome.runtime.sendMessage(msg, function (result) {
                        if (settled) return;
                        settled = true;
                        clearTimeout(timer);
                        var err = chrome.runtime.lastError;
                        resolve(err ? _response.error(err.message, 'ERR_RUNTIME') : result);
                    });
                } catch (e) {
                    if (!settled) {
                        settled = true;
                        clearTimeout(timer);
                        resolve(_response.error(e.message, 'ERR_SEND_FAILED'));
                    }
                }
            });
        },

        /** Validate that a message object has a known action. Returns { valid, error? }. */
        validate: function (message) {
            if (!message || typeof message !== 'object')
                return { valid: false, error: 'Message must be a non-null object' };
            if (!message.action || typeof message.action !== 'string')
                return { valid: false, error: 'Message must have a string action' };
            if (!_knownActions[message.action])
                return { valid: false, error: 'Unknown action: ' + message.action };
            return { valid: true };
        },

        /** Create a properly formatted message. Returns null if action is unknown. */
        create: function (action, payload) {
            if (!_knownActions[action]) return null;
            var msg = { action: action };
            if (payload !== undefined) msg.payload = payload;
            return msg;
        }
    };

    // Expose globally on both self (service worker) and window (popup/pages)
    var g = typeof self !== 'undefined' ? self : typeof window !== 'undefined' ? window : {};
    g.MessageTypes = _types;
    g.MessageResponse = _response;
    g.MessageHelper = _helper;
})();
