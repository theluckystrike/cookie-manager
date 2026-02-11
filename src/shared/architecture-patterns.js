/**
 * Cookie Manager - Architecture Patterns Library
 * Provides EventBus, StateStore, ServiceRegistry, CommandQueue, and Middleware.
 * Zero dependencies. All persistence via chrome.storage.local. No external requests.
 */
(function () {
    'use strict';

    var TAG = '[ArchPatterns] ';
    var MAX_LISTENERS = 50;
    var MAX_COMMAND_HISTORY = 50;
    var DEBOUNCE_MS = 500;

    /* ── Storage Helpers ──────────────────────────────────────────── */

    function storageGet(keys) {
        return new Promise(function (resolve) {
            try {
                if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
                    resolve({}); return;
                }
                chrome.storage.local.get(keys, function (result) {
                    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.lastError) {
                        resolve({});
                    } else {
                        resolve(result || {});
                    }
                });
            } catch (e) { resolve({}); }
        });
    }

    function storageSet(data) {
        return new Promise(function (resolve) {
            try {
                if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
                    resolve(); return;
                }
                chrome.storage.local.set(data, function () {
                    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.lastError) {
                        console.warn(TAG + 'storage.set error:', chrome.runtime.lastError.message);
                    }
                    resolve();
                });
            } catch (e) {
                console.warn(TAG + 'storage.set exception:', e);
                resolve();
            }
        });
    }

    /* ── 1. EventBus — Pub/Sub ────────────────────────────────────── */

    var EventBus = (function () {
        var _listeners = {};

        function _getList(event) {
            if (!_listeners[event]) { _listeners[event] = []; }
            return _listeners[event];
        }

        return {
            on: function (event, callback) {
                if (typeof event !== 'string' || typeof callback !== 'function') return function () {};
                var list = _getList(event);
                if (list.length >= MAX_LISTENERS) {
                    console.warn(TAG + 'EventBus: max listeners (' + MAX_LISTENERS + ') reached for "' + event + '"');
                    return function () {};
                }
                var entry = { callback: callback, once: false };
                list.push(entry);
                return function () {
                    var idx = list.indexOf(entry);
                    if (idx !== -1) list.splice(idx, 1);
                };
            },

            once: function (event, callback) {
                if (typeof event !== 'string' || typeof callback !== 'function') return function () {};
                var list = _getList(event);
                if (list.length >= MAX_LISTENERS) {
                    console.warn(TAG + 'EventBus: max listeners (' + MAX_LISTENERS + ') reached for "' + event + '"');
                    return function () {};
                }
                var entry = { callback: callback, once: true };
                list.push(entry);
                return function () {
                    var idx = list.indexOf(entry);
                    if (idx !== -1) list.splice(idx, 1);
                };
            },

            off: function (event, callback) {
                if (typeof event !== 'string' || typeof callback !== 'function') return;
                var list = _listeners[event];
                if (!list) return;
                for (var i = list.length - 1; i >= 0; i--) {
                    if (list[i].callback === callback) list.splice(i, 1);
                }
            },

            emit: function (event, data) {
                if (typeof event !== 'string') return;
                var list = _listeners[event];
                if (!list || list.length === 0) return;
                var toRemove = [];
                for (var i = 0; i < list.length; i++) {
                    try { list[i].callback(data); } catch (e) {
                        console.warn(TAG + 'EventBus: error in listener for "' + event + '":', e);
                    }
                    if (list[i] && list[i].once) toRemove.push(i);
                }
                for (var j = toRemove.length - 1; j >= 0; j--) list.splice(toRemove[j], 1);
            },

            clear: function (event) {
                if (typeof event === 'string') { delete _listeners[event]; }
                else { _listeners = {}; }
            },

            listenerCount: function (event) {
                if (typeof event !== 'string') return 0;
                var list = _listeners[event];
                return list ? list.length : 0;
            }
        };
    })();

    /* ── 2. StateStore — Observable State Management ──────────────── */

    var StateStore = {
        create: function (storageKey, initialState) {
            if (typeof storageKey !== 'string' || !storageKey) {
                console.warn(TAG + 'StateStore.create: invalid storageKey');
                storageKey = '_archpatterns_default';
            }
            var _initial = {};
            try { _initial = JSON.parse(JSON.stringify(initialState || {})); } catch (e) { _initial = {}; }

            var _state = JSON.parse(JSON.stringify(_initial));
            var _subscribers = [];
            var _selectors = [];
            var _debounceTimer = null;

            function _shallowCopy(obj) {
                var copy = {};
                var keys = Object.keys(obj);
                for (var i = 0; i < keys.length; i++) copy[keys[i]] = obj[keys[i]];
                return copy;
            }

            function _notifySubscribers(newState, prevState) {
                for (var i = 0; i < _subscribers.length; i++) {
                    try { _subscribers[i](newState, prevState); } catch (e) {
                        console.warn(TAG + 'StateStore: subscriber error:', e);
                    }
                }
            }

            function _notifySelectors(newState) {
                for (var i = 0; i < _selectors.length; i++) {
                    var sel = _selectors[i];
                    try {
                        var newVal = JSON.stringify(sel.selectorFn(newState));
                        if (newVal !== sel.lastValue) {
                            sel.lastValue = newVal;
                            sel.callback(JSON.parse(newVal), newState);
                        }
                    } catch (e) {
                        console.warn(TAG + 'StateStore: selector error:', e);
                    }
                }
            }

            function _schedulePersist() {
                if (_debounceTimer !== null) clearTimeout(_debounceTimer);
                _debounceTimer = setTimeout(function () {
                    _debounceTimer = null;
                    var data = {};
                    data[storageKey] = _state;
                    storageSet(data);
                }, DEBOUNCE_MS);
            }

            return {
                getState: function () { return _shallowCopy(_state); },

                setState: function (partial) {
                    if (!partial || typeof partial !== 'object') return;
                    var prevState = _shallowCopy(_state);
                    var keys = Object.keys(partial);
                    for (var i = 0; i < keys.length; i++) _state[keys[i]] = partial[keys[i]];
                    var newState = _shallowCopy(_state);
                    _notifySubscribers(newState, prevState);
                    _notifySelectors(newState);
                    _schedulePersist();
                },

                subscribe: function (callback) {
                    if (typeof callback !== 'function') return function () {};
                    _subscribers.push(callback);
                    return function () {
                        var idx = _subscribers.indexOf(callback);
                        if (idx !== -1) _subscribers.splice(idx, 1);
                    };
                },

                select: function (selectorFn, callback) {
                    if (typeof selectorFn !== 'function' || typeof callback !== 'function') {
                        return function () {};
                    }
                    var initialVal;
                    try { initialVal = JSON.stringify(selectorFn(_state)); } catch (e) { initialVal = 'undefined'; }
                    var entry = { selectorFn: selectorFn, callback: callback, lastValue: initialVal };
                    _selectors.push(entry);
                    return function () {
                        var idx = _selectors.indexOf(entry);
                        if (idx !== -1) _selectors.splice(idx, 1);
                    };
                },

                reset: function () {
                    var prevState = _shallowCopy(_state);
                    _state = JSON.parse(JSON.stringify(_initial));
                    var newState = _shallowCopy(_state);
                    _notifySubscribers(newState, prevState);
                    _notifySelectors(newState);
                    _schedulePersist();
                },

                load: function () {
                    return storageGet(storageKey).then(function (result) {
                        if (result && result[storageKey] && typeof result[storageKey] === 'object') {
                            var prevState = _shallowCopy(_state);
                            var loaded = result[storageKey];
                            var keys = Object.keys(loaded);
                            for (var i = 0; i < keys.length; i++) _state[keys[i]] = loaded[keys[i]];
                            var newState = _shallowCopy(_state);
                            _notifySubscribers(newState, prevState);
                            _notifySelectors(newState);
                        }
                        return _shallowCopy(_state);
                    }).catch(function (e) {
                        console.warn(TAG + 'StateStore.load error:', e);
                        return _shallowCopy(_state);
                    });
                }
            };
        }
    };

    /* ── 3. ServiceRegistry — Service Locator ─────────────────────── */

    var ServiceRegistry = (function () {
        var _services = {};
        var _onRegisterCallbacks = [];

        return {
            register: function (name, service) {
                if (typeof name !== 'string' || !name) {
                    console.warn(TAG + 'ServiceRegistry.register: invalid name');
                    return;
                }
                if (service === undefined || service === null) {
                    console.warn(TAG + 'ServiceRegistry.register: invalid service for "' + name + '"');
                    return;
                }
                _services[name] = service;
                for (var i = 0; i < _onRegisterCallbacks.length; i++) {
                    try { _onRegisterCallbacks[i](name, service); } catch (e) {
                        console.warn(TAG + 'ServiceRegistry: onRegister callback error:', e);
                    }
                }
            },

            get: function (name) {
                if (typeof name !== 'string' || !name) return null;
                return _services[name] !== undefined ? _services[name] : null;
            },

            has: function (name) {
                if (typeof name !== 'string') return false;
                return _services.hasOwnProperty(name);
            },

            remove: function (name) {
                if (typeof name !== 'string') return;
                delete _services[name];
            },

            list: function () { return Object.keys(_services); },

            onRegister: function (callback) {
                if (typeof callback !== 'function') return function () {};
                _onRegisterCallbacks.push(callback);
                return function () {
                    var idx = _onRegisterCallbacks.indexOf(callback);
                    if (idx !== -1) _onRegisterCallbacks.splice(idx, 1);
                };
            }
        };
    })();

    /* ── 4. CommandQueue — Ordered Execution with Undo ────────────── */

    var CommandQueue = (function () {
        var _history = [];
        var _undone = [];

        function _wrapPromise(result) {
            return (result && typeof result.then === 'function') ? result : Promise.resolve(result);
        }

        function _validateCommand(cmd) {
            return cmd && typeof cmd === 'object' && typeof cmd.run === 'function' && typeof cmd.undo === 'function';
        }

        return {
            execute: function (command) {
                if (!_validateCommand(command)) {
                    return Promise.reject(new Error('Invalid command: must have run() and undo() functions'));
                }
                try {
                    return _wrapPromise(command.run()).then(function (value) {
                        _history.push({
                            name: command.name || 'unnamed',
                            run: command.run, undo: command.undo, data: command.data
                        });
                        if (_history.length > MAX_COMMAND_HISTORY) {
                            _history.splice(0, _history.length - MAX_COMMAND_HISTORY);
                        }
                        _undone = [];
                        return value;
                    });
                } catch (e) { return Promise.reject(e); }
            },

            undo: function () {
                if (_history.length === 0) return Promise.reject(new Error('Nothing to undo'));
                var command = _history.pop();
                try {
                    return _wrapPromise(command.undo()).then(function (value) {
                        _undone.push(command);
                        return value;
                    });
                } catch (e) {
                    _history.push(command);
                    return Promise.reject(e);
                }
            },

            redo: function () {
                if (_undone.length === 0) return Promise.reject(new Error('Nothing to redo'));
                var command = _undone.pop();
                try {
                    return _wrapPromise(command.run()).then(function (value) {
                        _history.push(command);
                        if (_history.length > MAX_COMMAND_HISTORY) {
                            _history.splice(0, _history.length - MAX_COMMAND_HISTORY);
                        }
                        return value;
                    });
                } catch (e) {
                    _undone.push(command);
                    return Promise.reject(e);
                }
            },

            getHistory: function () {
                var out = [];
                for (var i = 0; i < _history.length; i++) {
                    out.push({ name: _history[i].name, data: _history[i].data });
                }
                return out;
            },

            clear: function () { _history = []; _undone = []; }
        };
    })();

    /* ── 5. Middleware — Pipeline Processing ──────────────────────── */

    var Middleware = {
        create: function () {
            var _fns = [];

            function dispatch(fns, context, i) {
                if (i >= fns.length) return Promise.resolve(context);
                var called = false;
                try {
                    var result = fns[i](context, function next() {
                        if (called) return Promise.resolve(context);
                        called = true;
                        return dispatch(fns, context, i + 1);
                    });
                    if (result && typeof result.then === 'function') {
                        return result.catch(function (e) {
                            console.warn(TAG + 'Middleware: error in middleware #' + i + ':', e);
                            return Promise.reject(e);
                        });
                    }
                    if (!called) return Promise.resolve(context);
                    return Promise.resolve(context);
                } catch (e) {
                    console.warn(TAG + 'Middleware: error in middleware #' + i + ':', e);
                    return Promise.reject(e);
                }
            }

            return {
                use: function (fn) {
                    if (typeof fn !== 'function') {
                        console.warn(TAG + 'Middleware.use: argument must be a function');
                        return;
                    }
                    _fns.push(fn);
                },
                run: function (context) {
                    if (_fns.length === 0) return Promise.resolve(context);
                    return dispatch(_fns.slice(), context, 0);
                }
            };
        }
    };

    /* ── Public API ───────────────────────────────────────────────── */

    var ArchPatterns = {
        EventBus: EventBus,
        StateStore: StateStore,
        ServiceRegistry: ServiceRegistry,
        CommandQueue: CommandQueue,
        Middleware: Middleware
    };

    /* ── Expose on both self and window ──────────────────────────── */

    if (typeof self !== 'undefined') { self.ArchPatterns = ArchPatterns; }
    if (typeof window !== 'undefined') { window.ArchPatterns = ArchPatterns; }
})();
