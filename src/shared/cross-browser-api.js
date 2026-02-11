/**
 * Cookie Manager - Cross-Browser API Abstraction Layer
 * Unified interface for Chrome, Firefox, and Safari extension APIs.
 * Resolves namespace (chrome.* vs browser.*), wraps callbacks as Promises,
 * and provides graceful fallbacks for missing APIs (storage.session, notifications, etc).
 * IIFE pattern - exposes CrossBrowserAPI on both self and window.
 *
 * @fileoverview Cross-browser compatibility shim for Cookie Manager.
 */
(function () {
    'use strict';

    var TAG = '[CrossBrowserAPI]';

    // -- Namespace detection --------------------------------------------------
    var _ns = (typeof browser !== 'undefined' && browser && browser.runtime)
        ? browser
        : (typeof chrome !== 'undefined' && chrome && chrome.runtime) ? chrome : null;

    // -- Helpers --------------------------------------------------------------

    /** Wrap a callback-style Chrome API call as a Promise (pass-through if already thenable). */
    function promisify(apiFn, ctx) {
        return function () {
            var args = Array.prototype.slice.call(arguments);
            try {
                var r = apiFn.apply(ctx, args);
                if (r && typeof r.then === 'function') return r;
            } catch (_) { /* fall through to callback wrapping */ }
            return new Promise(function (resolve, reject) {
                try {
                    args.push(function (res) {
                        var err = _ns && _ns.runtime && _ns.runtime.lastError;
                        err ? reject(new Error(err.message || String(err))) : resolve(res);
                    });
                    apiFn.apply(ctx, args);
                } catch (e) { reject(e); }
            });
        };
    }

    /** Safely promisify and invoke, returning fallback on any error. */
    function safeAsync(apiFn, ctx, args, fallback) {
        try {
            return promisify(apiFn, ctx).apply(null, args || []);
        } catch (e) {
            console.warn(TAG, e.message);
            return Promise.resolve(fallback);
        }
    }

    function hasAPI(path) {
        if (!_ns) return false;
        var parts = path.split('.'), obj = _ns;
        for (var i = 0; i < parts.length; i++) {
            if (obj == null || typeof obj[parts[i]] === 'undefined') return false;
            obj = obj[parts[i]];
        }
        return true;
    }

    function safeCall(fn, ctx, args) {
        try { if (typeof fn === 'function') return fn.apply(ctx || null, args || []); }
        catch (e) { console.warn(TAG, 'safeCall:', e.message); }
    }

    function getActionAPI() {
        if (_ns && _ns.action) return _ns.action;
        if (_ns && _ns.browserAction) return _ns.browserAction;
        return null;
    }

    function hasSessionStorage() {
        try { return !!(_ns && _ns.storage && _ns.storage.session); }
        catch (_) { return false; }
    }

    // -- In-memory session storage fallback (Safari / older browsers) ---------
    var _mem = new Map();
    var _memorySession = {
        get: function (keys) {
            return new Promise(function (resolve) {
                var r = {};
                if (keys == null) {
                    _mem.forEach(function (v, k) { r[k] = v; });
                } else if (typeof keys === 'string') {
                    if (_mem.has(keys)) r[keys] = _mem.get(keys);
                } else if (Array.isArray(keys)) {
                    for (var i = 0; i < keys.length; i++) {
                        if (_mem.has(keys[i])) r[keys[i]] = _mem.get(keys[i]);
                    }
                } else {
                    var dk = Object.keys(keys);
                    for (var j = 0; j < dk.length; j++)
                        r[dk[j]] = _mem.has(dk[j]) ? _mem.get(dk[j]) : keys[dk[j]];
                }
                resolve(r);
            });
        },
        set: function (items) {
            return new Promise(function (resolve) {
                var ks = Object.keys(items);
                for (var i = 0; i < ks.length; i++) _mem.set(ks[i], items[ks[i]]);
                resolve();
            });
        }
    };

    // -- CrossBrowserAPI ------------------------------------------------------
    var CrossBrowserAPI = {

        /** Return the resolved browser namespace (chrome or browser object). */
        getNamespace: function () { return _ns; },

        // Cookies
        cookies: {
            getAll: function (details) {
                return safeAsync(_ns.cookies.getAll, _ns.cookies, [details], []);
            },
            set: function (details) {
                return safeAsync(_ns.cookies.set, _ns.cookies, [details], null);
            },
            remove: function (details) {
                return safeAsync(_ns.cookies.remove, _ns.cookies, [details], null);
            }
        },

        // Storage
        storage: {
            local: {
                get: function (keys) {
                    return safeAsync(_ns.storage.local.get, _ns.storage.local, [keys], {});
                },
                set: function (items) {
                    return safeAsync(_ns.storage.local.set, _ns.storage.local, [items], undefined);
                }
            },
            session: {
                get: function (keys) {
                    if (hasSessionStorage()) {
                        try { return promisify(_ns.storage.session.get, _ns.storage.session)(keys); }
                        catch (_) { /* fall through */ }
                    }
                    return _memorySession.get(keys);
                },
                set: function (items) {
                    if (hasSessionStorage()) {
                        try { return promisify(_ns.storage.session.set, _ns.storage.session)(items); }
                        catch (_) { /* fall through */ }
                    }
                    return _memorySession.set(items);
                }
            }
        },

        // Notifications (graceful no-op when unavailable, e.g. Safari)
        notifications: {
            create: function (id, options) {
                if (!hasAPI('notifications.create')) return Promise.resolve(null);
                return safeAsync(_ns.notifications.create, _ns.notifications, [id, options], null);
            }
        },

        // Context Menus
        contextMenus: {
            create: function (props) {
                if (!hasAPI('contextMenus.create')) return undefined;
                return safeCall(_ns.contextMenus.create, _ns.contextMenus, [props, function () {
                    if (_ns.runtime && _ns.runtime.lastError) { /* suppress duplicate ID errors */ }
                }]);
            },
            removeAll: function () {
                if (!hasAPI('contextMenus.removeAll')) return Promise.resolve();
                return safeAsync(_ns.contextMenus.removeAll, _ns.contextMenus, [], undefined);
            }
        },

        // Alarms
        alarms: {
            create: function (name, info) {
                if (!hasAPI('alarms.create')) return undefined;
                return safeCall(_ns.alarms.create, _ns.alarms, [name, info]);
            },
            clear: function (name) {
                if (!hasAPI('alarms.clear')) return Promise.resolve(false);
                return safeAsync(_ns.alarms.clear, _ns.alarms, [name], false);
            }
        },

        // Action / browserAction (Firefox MV2 compatibility)
        action: {
            setBadgeText: function (details) {
                var api = getActionAPI();
                if (api && typeof api.setBadgeText === 'function')
                    safeCall(api.setBadgeText, api, [details]);
            },
            setBadgeBackgroundColor: function (details) {
                var api = getActionAPI();
                if (api && typeof api.setBadgeBackgroundColor === 'function')
                    safeCall(api.setBadgeBackgroundColor, api, [details]);
            }
        },

        // Runtime
        runtime: {
            sendMessage: function (msg) {
                try { return promisify(_ns.runtime.sendMessage, _ns.runtime)(msg); }
                catch (e) { return Promise.reject(e); }
            },
            getManifest: function () {
                try { return _ns.runtime.getManifest(); }
                catch (_) { return {}; }
            }
        },

        // Tabs
        tabs: {
            query: function (queryInfo) {
                return safeAsync(_ns.tabs.query, _ns.tabs, [queryInfo], []);
            }
        }
    };

    // -- Expose globally ------------------------------------------------------
    if (typeof self !== 'undefined') self.CrossBrowserAPI = CrossBrowserAPI;
    if (typeof window !== 'undefined') window.CrossBrowserAPI = CrossBrowserAPI;
})();
