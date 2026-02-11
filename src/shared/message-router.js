/**
 * Cookie Manager - Message Router
 * Message routing abstraction for cleaner, middleware-capable message handling.
 * Designed for gradual adoption alongside the existing service worker handler.
 * IIFE pattern - exposes MessageRouter globally on self and window.
 *
 * Usage:
 *   var router = MessageRouter.createRouter();
 *   router.use(function(msg, sender, next) { console.log(msg.action); next(); });
 *   router.register('GET_COOKIES', function(payload, sender) { return cookies; });
 *   router.handle({ action: 'GET_COOKIES', payload: { url: '...' } }, sender)
 *     .then(function(result) { ... });
 *
 *   var types = MessageRouter.ActionTypes.define('COOKIE', ['GET', 'SET']);
 *   // => { GET: 'COOKIE_GET', SET: 'COOKIE_SET' }
 *
 *   var msg = MessageRouter.RequestBuilder.create('COOKIE_GET', { url: '...' });
 *   var result = MessageRouter.MessageValidator.validate(msg, schema);
 */
(function () {
    'use strict';

    // =========================================================================
    // Utilities
    // =========================================================================

    /**
     * Safe typeof check that never throws.
     */
    function _typeOf(value) {
        try {
            if (value === null || value === undefined) return 'null';
            if (Array.isArray(value)) return 'array';
            return typeof value;
        } catch (e) {
            return 'unknown';
        }
    }

    /**
     * Safe timestamp generator.
     */
    function _now() {
        try {
            return Date.now();
        } catch (e) {
            return 0;
        }
    }

    // =========================================================================
    // Router — Central message routing with middleware and stats
    // =========================================================================

    function _createRouter() {
        var _handlers = Object.create(null);
        var _middleware = [];
        var _stats = Object.create(null);

        /**
         * Execute middleware pipeline, then call the handler.
         * Each middleware receives (message, sender, next).
         * Returns a Promise resolving with the handler result.
         */
        function _runPipeline(message, sender, handler) {
            var index = 0;

            function next() {
                var mw = _middleware[index];
                index += 1;
                if (mw) {
                    return new Promise(function (resolve, reject) {
                        try {
                            mw(message, sender, function () {
                                resolve(next());
                            });
                        } catch (err) {
                            reject(err);
                        }
                    });
                }
                // All middleware executed — invoke handler
                return new Promise(function (resolve, reject) {
                    try {
                        var result = handler(message.payload || {}, sender);
                        resolve(result);
                    } catch (err) {
                        reject(err);
                    }
                });
            }

            return next();
        }

        var router = {
            /**
             * Register a handler for a message action string.
             * handler receives (payload, sender) and may return a value or Promise.
             */
            register: function (action, handler) {
                try {
                    if (typeof action !== 'string' || !action) {
                        return router;
                    }
                    if (typeof handler !== 'function') {
                        return router;
                    }
                    _handlers[action] = handler;
                } catch (e) {
                    // Silently fail — defensive
                }
                return router;
            },

            /**
             * Remove a handler for a given action.
             */
            unregister: function (action) {
                try {
                    if (typeof action === 'string' && _handlers[action]) {
                        delete _handlers[action];
                    }
                } catch (e) {
                    // Silently fail
                }
                return router;
            },

            /**
             * Check if an action has a registered handler.
             */
            hasHandler: function (action) {
                try {
                    return typeof action === 'string' && _handlers[action] !== undefined;
                } catch (e) {
                    return false;
                }
            },

            /**
             * Route a message to its handler through the middleware pipeline.
             * Returns a Promise resolving with the handler's result.
             * If no handler is found, resolves with {error: 'Unknown action: ...'}.
             */
            handle: function (message, sender) {
                var action = '';
                try {
                    if (!message || typeof message !== 'object') {
                        return Promise.resolve({ error: 'Invalid message' });
                    }
                    action = message.action || '';
                    if (typeof action !== 'string' || !action) {
                        return Promise.resolve({ error: 'Invalid message action' });
                    }
                } catch (e) {
                    return Promise.resolve({ error: 'Message parsing failed' });
                }

                // Initialize stats for this action if needed
                if (!_stats[action]) {
                    _stats[action] = { calls: 0, errors: 0, lastCall: null };
                }
                _stats[action].calls += 1;
                _stats[action].lastCall = _now();

                var handler = _handlers[action];
                if (!handler) {
                    return Promise.resolve({ error: 'Unknown action: ' + action });
                }

                return _runPipeline(message, sender, handler)
                    .then(function (result) {
                        return result;
                    })
                    .catch(function (err) {
                        try {
                            _stats[action].errors += 1;
                        } catch (e) {
                            // stats update failed
                        }
                        var errMsg = 'Handler error';
                        try {
                            errMsg = (err && err.message) ? err.message : String(err);
                        } catch (e) {
                            // toString failed
                        }
                        return { error: errMsg };
                    });
            },

            /**
             * Returns array of registered action strings.
             */
            listActions: function () {
                try {
                    return Object.keys(_handlers);
                } catch (e) {
                    return [];
                }
            },

            /**
             * Add middleware that runs before every handler.
             * Middleware signature: function(message, sender, next)
             * Must call next() to continue the pipeline.
             * Returns router for chaining.
             */
            use: function (middlewareFn) {
                try {
                    if (typeof middlewareFn === 'function') {
                        _middleware.push(middlewareFn);
                    }
                } catch (e) {
                    // Silently fail
                }
                return router;
            },

            /**
             * Returns object with call counts per action:
             * { action: { calls: N, errors: N, lastCall: timestamp } }
             */
            getStats: function () {
                try {
                    var result = Object.create(null);
                    var keys = Object.keys(_stats);
                    for (var i = 0; i < keys.length; i++) {
                        var k = keys[i];
                        result[k] = {
                            calls: _stats[k].calls,
                            errors: _stats[k].errors,
                            lastCall: _stats[k].lastCall
                        };
                    }
                    return result;
                } catch (e) {
                    return {};
                }
            }
        };

        return router;
    }

    // =========================================================================
    // MessageValidator — Validate message structure against a schema
    // =========================================================================

    var _MessageValidator = {
        /**
         * Validates a message object against a schema.
         * Schema keys are field names; values are type strings:
         *   'string', 'number', 'boolean', 'object', 'array'
         * Append '?' for optional fields (e.g., 'string?').
         * Returns { valid: boolean, errors: string[] }.
         */
        validate: function (message, schema) {
            var errors = [];
            try {
                if (!message || typeof message !== 'object') {
                    return { valid: false, errors: ['Message must be a non-null object'] };
                }
                if (!schema || typeof schema !== 'object') {
                    return { valid: true, errors: [] };
                }

                var fields = Object.keys(schema);
                for (var i = 0; i < fields.length; i++) {
                    var field = fields[i];
                    var spec = schema[field];
                    if (typeof spec !== 'string') continue;

                    var isOptional = spec.charAt(spec.length - 1) === '?';
                    var expectedType = isOptional ? spec.slice(0, spec.length - 1) : spec;
                    var value = message[field];

                    if (value === undefined || value === null) {
                        if (!isOptional) {
                            errors.push('Missing required field: ' + field);
                        }
                        continue;
                    }

                    var actualType = _typeOf(value);
                    if (actualType !== expectedType) {
                        errors.push(
                            'Field "' + field + '" expected ' + expectedType +
                            ', got ' + actualType
                        );
                    }
                }
            } catch (e) {
                errors.push('Validation error: ' + (e.message || 'unknown'));
            }

            return { valid: errors.length === 0, errors: errors };
        },

        /**
         * Helper that creates a schema object from a definition.
         * Accepts an object and returns it frozen (or a copy if freeze unavailable).
         */
        createSchema: function (definition) {
            try {
                if (!definition || typeof definition !== 'object') {
                    return {};
                }
                var schema = {};
                var keys = Object.keys(definition);
                for (var i = 0; i < keys.length; i++) {
                    schema[keys[i]] = definition[keys[i]];
                }
                if (typeof Object.freeze === 'function') {
                    Object.freeze(schema);
                }
                return schema;
            } catch (e) {
                return {};
            }
        }
    };

    // =========================================================================
    // ActionTypes — Constants helper
    // =========================================================================

    var _ActionTypes = {
        /**
         * Takes a namespace string and array of action names.
         * Returns an object mapping each action to NAMESPACE_ACTION.
         *
         * Example:
         *   define('COOKIE', ['GET', 'SET', 'DELETE'])
         *   => { GET: 'COOKIE_GET', SET: 'COOKIE_SET', DELETE: 'COOKIE_DELETE' }
         */
        define: function (namespace, actions) {
            var result = {};
            try {
                if (typeof namespace !== 'string' || !namespace) {
                    return result;
                }
                if (!Array.isArray(actions)) {
                    return result;
                }
                var prefix = namespace + '_';
                for (var i = 0; i < actions.length; i++) {
                    var action = actions[i];
                    if (typeof action === 'string' && action) {
                        result[action] = prefix + action;
                    }
                }
                if (typeof Object.freeze === 'function') {
                    Object.freeze(result);
                }
            } catch (e) {
                // Return partial result
            }
            return result;
        }
    };

    // =========================================================================
    // RequestBuilder — Build messages consistently
    // =========================================================================

    var _RequestBuilder = {
        /**
         * Returns a consistently formatted message object.
         * { action: action, payload: payload || {}, _timestamp: Date.now() }
         */
        create: function (action, payload) {
            try {
                return {
                    action: typeof action === 'string' ? action : '',
                    payload: (payload && typeof payload === 'object') ? payload : {},
                    _timestamp: _now()
                };
            } catch (e) {
                return { action: '', payload: {}, _timestamp: 0 };
            }
        },

        /**
         * Takes array of { action, payload } objects.
         * Returns array of properly formatted messages.
         */
        createBatch: function (requests) {
            var batch = [];
            try {
                if (!Array.isArray(requests)) {
                    return batch;
                }
                for (var i = 0; i < requests.length; i++) {
                    var req = requests[i];
                    if (req && typeof req === 'object') {
                        batch.push(_RequestBuilder.create(
                            req.action,
                            req.payload
                        ));
                    }
                }
            } catch (e) {
                // Return partial batch
            }
            return batch;
        }
    };

    // =========================================================================
    // Public API
    // =========================================================================

    var MessageRouter = {
        createRouter: _createRouter,
        MessageValidator: _MessageValidator,
        ActionTypes: _ActionTypes,
        RequestBuilder: _RequestBuilder
    };

    // =========================================================================
    // Expose Globally
    // =========================================================================

    if (typeof self !== 'undefined') {
        self.MessageRouter = MessageRouter;
    }
    if (typeof window !== 'undefined') {
        window.MessageRouter = MessageRouter;
    }
})();
