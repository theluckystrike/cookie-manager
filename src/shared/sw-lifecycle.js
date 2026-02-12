/**
 * Cookie Manager - Service Worker Lifecycle Manager for MV3
 * Handles: state persistence, alarm-based periodic tasks, termination recovery.
 * MV3 service workers can terminate after 30s of idle; this module ensures
 * critical state survives restarts and periodic work uses chrome.alarms.
 */
(function (root) {
    'use strict';

    var LIFECYCLE_KEY = '_swLifecycle';
    var STATE_PREFIX = '_swState:';
    var MAINT_ALARM = 'sw-maintenance';
    var MAINT_PERIOD = 15;
    var ERROR_LOG_MAX = 50;
    var ANALYTICS_MAX = 100;
    var _alarmCallbacks = {};
    var _initTime = Date.now();
    var _ready = false;

    // Safe chrome.storage wrapper (works for both .session and .local)
    function safeGet(store, keys) {
        return new Promise(function (resolve) {
            try {
                store.get(keys, function (r) {
                    resolve(chrome.runtime.lastError ? {} : (r || {}));
                });
            } catch (_) { resolve({}); }
        });
    }

    function safeSet(store, data) {
        return new Promise(function (resolve) {
            try {
                store.set(data, function () {
                    if (chrome.runtime.lastError) {
                        console.warn('[SwLifecycle] storage.set error:', chrome.runtime.lastError.message);
                    }
                    resolve();
                });
            } catch (e) {
                console.warn('[SwLifecycle] storage.set exception:', e);
                resolve();
            }
        });
    }

    // Maintenance: trim error logs and analytics to their caps
    function runMaintenance() {
        return safeGet(chrome.storage.local, { errorLogs: [], analytics: [] }).then(function (data) {
            var patch = {};
            if ((data.errorLogs || []).length > ERROR_LOG_MAX) {
                patch.errorLogs = data.errorLogs.slice(-ERROR_LOG_MAX);
            }
            if ((data.analytics || []).length > ANALYTICS_MAX) {
                patch.analytics = data.analytics.slice(-ANALYTICS_MAX);
            }
            return Object.keys(patch).length ? safeSet(chrome.storage.local, patch) : undefined;
        });
    }

    // Central alarm dispatcher
    function onAlarmFired(alarm) {
        try {
            if (alarm.name === MAINT_ALARM) { runMaintenance(); return; }
            var cb = _alarmCallbacks[alarm.name];
            if (typeof cb === 'function') cb(alarm);
        } catch (e) {
            console.error('[SwLifecycle] Alarm handler error:', alarm.name, e);
        }
    }

    // ========================================================================
    // Public API
    // ========================================================================

    var SwLifecycle = {
        /** Initialize lifecycle tracking. Call once on SW startup. */
        init: function () {
            _initTime = Date.now();
            try { chrome.alarms.onAlarm.addListener(onAlarmFired); }
            catch (e) { console.error('[SwLifecycle] Alarm listener attach failed:', e); }

            try { chrome.alarms.create(MAINT_ALARM, { periodInMinutes: MAINT_PERIOD }); }
            catch (e) { console.error('[SwLifecycle] Maintenance alarm creation failed:', e); }

            return safeGet(chrome.storage.session, LIFECYCLE_KEY).then(function (result) {
                var info = result[LIFECYCLE_KEY] || { startupCount: 0, totalUptime: 0 };
                info.startupCount = (info.startupCount || 0) + 1;
                info.lastStartupTime = _initTime;
                info.lastActiveTime = _initTime;
                var d = {};
                d[LIFECYCLE_KEY] = info;
                _ready = true;
                return safeSet(chrome.storage.session, d);
            });
        },

        /**
         * Register a periodic alarm with a callback.
         * @param {string} name  Unique alarm name.
         * @param {number} periodInMinutes  Repeat interval (min 1 in production).
         * @param {Function} callback  Invoked when alarm fires.
         */
        registerAlarm: function (name, periodInMinutes, callback) {
            if (!name || typeof callback !== 'function') return;
            _alarmCallbacks[name] = callback;
            try { chrome.alarms.create(name, { periodInMinutes: periodInMinutes }); }
            catch (e) { console.error('[SwLifecycle] Alarm creation failed:', name, e); }
        },

        /**
         * Persist critical state to session storage.
         * Survives SW restart but not browser restart.
         */
        persistState: function (key, value) {
            var d = {};
            d[STATE_PREFIX + key] = value;
            return safeSet(chrome.storage.session, d);
        },

        /**
         * Restore state previously saved via persistState.
         * @returns {Promise} Resolves with stored value or undefined.
         */
        restoreState: function (key) {
            var k = STATE_PREFIX + key;
            return safeGet(chrome.storage.session, k).then(function (r) { return r[k]; });
        },

        /**
         * Wrap a long-running async operation with a keep-alive mechanism.
         * Opens a chrome.runtime port and sends heartbeats to prevent SW termination.
         * @param {Function} operation  Must return a Promise.
         * @returns {Promise} Resolves with the operation result.
         */
        keepAlive: function (operation) {
            var port, heartbeatTimer, alive = true;
            try { port = chrome.runtime.connect({ name: 'sw-keepalive' }); }
            catch (_) { return Promise.resolve().then(operation); }

            function sendHeartbeat() {
                if (!alive) return;
                try { port.postMessage({ type: 'keepalive', ts: Date.now() }); } catch (_) {}
                heartbeatTimer = setTimeout(sendHeartbeat, 20000);
            }
            heartbeatTimer = setTimeout(sendHeartbeat, 20000);

            function cleanup() {
                alive = false;
                clearTimeout(heartbeatTimer);
                try { port.disconnect(); } catch (_) {}
            }

            return Promise.resolve().then(operation)
                .then(function (result) { cleanup(); return result; })
                .catch(function (err) { cleanup(); throw err; });
        },

        /** Get lifecycle metadata. */
        getInfo: function () {
            var now = Date.now();
            return safeGet(chrome.storage.session, LIFECYCLE_KEY).then(function (result) {
                var info = result[LIFECYCLE_KEY] || {};
                return {
                    ready: _ready,
                    initTime: _initTime,
                    uptime: now - _initTime,
                    startupCount: info.startupCount || 1,
                    lastStartupTime: info.lastStartupTime || _initTime,
                    lastActiveTime: info.lastActiveTime || _initTime,
                    registeredAlarms: Object.keys(_alarmCallbacks)
                };
            });
        }
    };

    root.SwLifecycle = SwLifecycle;
})(typeof self !== 'undefined' ? self : this);
