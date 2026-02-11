/**
 * Cookie Manager - Message Validator
 * Whitelist-based validation for chrome.runtime message passing.
 * Validates actions, payloads, rate limits, and sender origin.
 *
 * Usage:
 *   MessageValidator.isValidAction('GET_COOKIES')
 *   MessageValidator.validateMessage({ action: 'GET_COOKIES', payload: { url: '...' } })
 *   MessageValidator.sanitizePayload('SET_COOKIE', rawPayload)
 *   MessageValidator.checkRateLimit('GET_COOKIES')   // { allowed: true, remaining: 59 }
 *   MessageValidator.isInternalSender(sender)         // true | false
 */
(function () {
    'use strict';

    // -- Schema Definitions --------------------------------------------------
    // Field descriptor: { type: 'string'|'number'|'boolean'|'object'|'array', required: bool }
    // payload: null means no payload expected. topLevel: fields on message root.

    var S = 'string', N = 'number', B = 'boolean', O = 'object', A = 'array';
    var R = true, OPT = false;

    var _schemas = {
        GET_COOKIES:          { p: { url: { t: S, r: R } } },
        SET_COOKIE:           { p: { name: { t: S, r: R }, value: { t: S, r: R }, domain: { t: S, r: R },
                                     path: { t: S, r: R }, secure: { t: B, r: R }, httpOnly: { t: B, r: R },
                                     sameSite: { t: S, r: R }, expirationDate: { t: N, r: OPT } } },
        DELETE_COOKIE:        { p: { url: { t: S, r: R }, name: { t: S, r: R } } },
        CLEAR_DOMAIN:         { p: { domain: { t: S, r: R } } },
        EXPORT_COOKIES:       { p: { url: { t: S, r: R }, format: { t: S, r: R } } },
        GET_SETTINGS:         { p: null },
        REPORT_ERROR:         { p: { type: { t: S, r: R }, message: { t: S, r: R }, stack: { t: S, r: OPT },
                                     source: { t: S, r: OPT }, context: { t: O, r: OPT }, timestamp: { t: N, r: OPT } } },
        REPORT_ERRORS_BATCH:  { p: { errors: { t: A, r: R } } },
        GET_ERROR_LOGS:       { p: null },
        CLEAR_ERROR_LOGS:     { p: null },
        GET_DEBUG_LOGS:       { p: null },
        GET_HEALTH_REPORT:    { p: null },
        TOGGLE_DEBUG_MODE:    { p: { enabled: { t: B, r: OPT } } },
        GET_MILESTONES:       { p: null },
        GET_GROWTH_STATS:     { p: null },
        GET_CHURN_STATUS:     { p: null },
        GET_ENGAGEMENT_SCORE: { p: null },
        GET_RETENTION_TRIGGER:{ p: null },
        RECORD_USAGE:         { p: null, tl: { usageAction: { t: S, r: R } } },
        DISMISS_TRIGGER:      { p: null, tl: { triggerId: { t: S, r: R } } }
    };

    // Build allowed-actions lookup from schema keys
    var _allowedActions = Object.create(null);
    var _keys = Object.keys(_schemas);
    for (var i = 0; i < _keys.length; i++) _allowedActions[_keys[i]] = true;

    // -- Type Helpers --------------------------------------------------------

    function _typeOf(v) {
        if (v === null || v === undefined) return 'null';
        if (Array.isArray(v)) return A;
        return typeof v;
    }

    function _checkType(v, expected) {
        var actual = _typeOf(v);
        if (expected === A) return actual === A;
        if (expected === O) return actual === O && !Array.isArray(v);
        return actual === expected;
    }

    // -- Validation ----------------------------------------------------------

    function isValidAction(action) {
        return typeof action === S && _allowedActions[action] === true;
    }

    function _validateFields(source, fieldMap, errors, prefix) {
        var names = Object.keys(fieldMap);
        for (var i = 0; i < names.length; i++) {
            var name = names[i];
            var rule = fieldMap[name];
            var val = source[name];
            if (rule.r && (val === undefined || val === null)) {
                errors.push('Missing required ' + prefix + 'field: ' + name);
            } else if (val !== undefined && val !== null && !_checkType(val, rule.t)) {
                errors.push('Field ' + name + ' expected ' + rule.t + ', got ' + _typeOf(val));
            }
        }
    }

    function validateMessage(message) {
        var errors = [];
        if (!message || typeof message !== 'object')
            return { valid: false, errors: ['Message must be a non-null object'] };
        if (typeof message.action !== S) {
            errors.push('Message action must be a string');
            return { valid: false, errors: errors };
        }
        if (!_allowedActions[message.action]) {
            errors.push('Unknown action: ' + message.action);
            return { valid: false, errors: errors };
        }

        var schema = _schemas[message.action];

        // Validate payload fields
        if (schema.p) {
            if (!message.payload || typeof message.payload !== 'object') {
                errors.push('Action ' + message.action + ' requires a payload object');
            } else {
                _validateFields(message.payload, schema.p, errors, 'payload ');
            }
        }

        // Validate top-level fields (RECORD_USAGE, DISMISS_TRIGGER)
        if (schema.tl) {
            _validateFields(message, schema.tl, errors, 'message ');
        }

        return { valid: errors.length === 0, errors: errors };
    }

    // -- Payload Sanitization ------------------------------------------------

    function sanitizePayload(action, payload) {
        if (!isValidAction(action)) return null;
        var schema = _schemas[action];
        if (!schema.p || !payload || typeof payload !== 'object') return null;

        var clean = {};
        var names = Object.keys(schema.p);
        for (var i = 0; i < names.length; i++) {
            var name = names[i];
            var rule = schema.p[name];
            var val = payload[name];
            if (val === undefined || val === null) continue;

            if (rule.t === S) {
                clean[name] = (typeof val === S) ? val.trim() : String(val).trim();
            } else if (rule.t === N) {
                var num = Number(val);
                if (!isNaN(num) && isFinite(num)) clean[name] = num;
            } else if (rule.t === B) {
                clean[name] = !!val;
            } else if (rule.t === A) {
                clean[name] = Array.isArray(val) ? val : [];
            } else if (rule.t === O) {
                clean[name] = (typeof val === 'object' && !Array.isArray(val)) ? val : {};
            }
        }
        return clean;
    }

    // -- Rate Limiting (in-memory sliding window) ----------------------------

    var _rateBuckets = Object.create(null);

    function checkRateLimit(action, windowMs, maxCount) {
        var win = (typeof windowMs === N && windowMs > 0) ? windowMs : 60000;
        var max = (typeof maxCount === N && maxCount > 0) ? maxCount : 60;
        var now = Date.now();
        var key = String(action);

        if (!_rateBuckets[key]) _rateBuckets[key] = [];
        var bucket = _rateBuckets[key];

        // Evict expired timestamps
        var cutoff = now - win;
        while (bucket.length > 0 && bucket[0] <= cutoff) bucket.shift();

        if (bucket.length >= max) return { allowed: false, remaining: 0 };
        bucket.push(now);
        return { allowed: true, remaining: max - bucket.length };
    }

    // -- Origin Validation ---------------------------------------------------

    function isInternalSender(sender) {
        if (!sender || typeof sender !== 'object') return false;
        if (typeof sender.id !== S) return false;
        try {
            if (typeof chrome !== 'undefined' && chrome && chrome.runtime &&
                typeof chrome.runtime.id === S) {
                return sender.id === chrome.runtime.id;
            }
        } catch (e) { /* context invalidated */ }
        return false;
    }

    // -- Public API ----------------------------------------------------------

    var MessageValidator = {
        isValidAction: isValidAction,
        validateMessage: validateMessage,
        sanitizePayload: sanitizePayload,
        checkRateLimit: checkRateLimit,
        isInternalSender: isInternalSender,
        getAllowedActions: function () { return Object.keys(_allowedActions); }
    };

    // -- Expose Globally -----------------------------------------------------

    if (typeof self !== 'undefined') self.MessageValidator = MessageValidator;
    if (typeof window !== 'undefined') window.MessageValidator = MessageValidator;
})();
