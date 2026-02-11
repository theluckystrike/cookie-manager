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
        TOGGLE_DEBUG_MODE: 'TOGGLE_DEBUG_MODE'
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
