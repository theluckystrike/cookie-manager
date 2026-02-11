/**
 * Cookie Manager - Error Tracker
 * Local-only crash analytics and error monitoring.
 * Works in both service worker (self) and popup (window) contexts.
 *
 * Usage:
 *   ErrorTracker.init('service-worker');
 *   ErrorTracker.init('popup');
 *
 *   ErrorTracker.track(new Error('something broke'), { action: 'SET_COOKIE' });
 *   ErrorTracker.getErrors().then(console.log);
 *   ErrorTracker.getStats().then(console.log);
 *   ErrorTracker.clearErrors().then(() => console.log('cleared'));
 */
(function (root) {
    'use strict';

    // ========================================================================
    // Constants
    // ========================================================================

    var STORAGE_KEY = 'errorLogs';
    var MAX_ENTRIES = 50;
    var VERSION = '0.0.0';
    try {
        if (typeof chrome !== 'undefined' && chrome.runtime && typeof chrome.runtime.getManifest === 'function') {
            VERSION = chrome.runtime.getManifest().version || '0.0.0';
        }
    } catch (e) { /* getManifest not available in this context */ }

    // ========================================================================
    // Severity Classification Patterns
    // ========================================================================

    var SEVERITY_PATTERNS = {
        critical: [
            /cannot read properties of null/i,
            /cannot read properties of undefined/i,
            /chrome\.storage.*error/i,
            /extension context invalidated/i,
            /service.worker.*(?:terminated|stopped|killed)/i,
            /quota.?exceeded/i
        ],
        high: [
            /failed to (?:fetch|load|set|remove)/i,
            /permission.*denied/i,
            /network.?error/i,
            /timeout/i,
            /runtime\.lastError/i,
            /message port closed/i
        ],
        medium: [
            /unexpected token/i,
            /syntax.?error/i,
            /type.?error/i,
            /reference.?error/i,
            /range.?error/i
        ],
        low: [
            /deprecated/i,
            /warning/i,
            /non-critical/i
        ]
    };

    // ========================================================================
    // Helpers
    // ========================================================================

    function hash(str) {
        var h = 5381;
        for (var i = 0; i < str.length; i++) {
            h = ((h << 5) + h + str.charCodeAt(i)) & 0xffffffff;
        }
        return h.toString(36);
    }

    function firstFrame(stack) {
        if (!stack) return '';
        var lines = stack.split('\n');
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i].trim();
            if (line && /^\s*at\s/.test(line)) {
                return line;
            }
        }
        return lines[1] ? lines[1].trim() : '';
    }

    function fingerprint(message, stack) {
        return hash((message || '') + '||' + firstFrame(stack));
    }

    function classifySeverity(message) {
        if (!message) return 'medium';
        var levels = ['critical', 'high', 'medium', 'low'];
        for (var i = 0; i < levels.length; i++) {
            var patterns = SEVERITY_PATTERNS[levels[i]];
            for (var j = 0; j < patterns.length; j++) {
                if (patterns[j].test(message)) {
                    return levels[i];
                }
            }
        }
        return 'medium';
    }

    function normalizeError(err) {
        if (err instanceof Error) {
            return { message: err.message, stack: err.stack || '' };
        }
        if (typeof err === 'string') {
            return { message: err, stack: '' };
        }
        if (err && typeof err === 'object') {
            return {
                message: err.message || String(err),
                stack: err.stack || ''
            };
        }
        return { message: String(err), stack: '' };
    }

    // ========================================================================
    // Core Storage Operations
    // ========================================================================

    function readLogs() {
        return new Promise(function (resolve) {
            chrome.storage.local.get(STORAGE_KEY, function (result) {
                resolve(result[STORAGE_KEY] || []);
            });
        });
    }

    function writeLogs(logs) {
        var data = {};
        data[STORAGE_KEY] = logs;
        return new Promise(function (resolve) {
            chrome.storage.local.set(data, function () {
                resolve();
            });
        });
    }

    // ========================================================================
    // ErrorTracker API
    // ========================================================================

    var _context = 'unknown';
    var _initialized = false;

    var ErrorTracker = {

        init: function (contextName) {
            _context = contextName || 'unknown';

            if (_initialized) return;
            _initialized = true;

            var scope = typeof self !== 'undefined' ? self : undefined;
            if (!scope) return;

            scope.addEventListener('error', function (event) {
                var err = event.error || { message: event.message, stack: '' };
                ErrorTracker.track(err, {
                    source: event.filename || '',
                    lineno: event.lineno,
                    colno: event.colno,
                    handler: 'onerror'
                });
            });

            scope.addEventListener('unhandledrejection', function (event) {
                var reason = event.reason || 'Unhandled promise rejection';
                ErrorTracker.track(reason, {
                    handler: 'unhandledrejection'
                });
            });

            console.debug('[ErrorTracker] Initialized for context:', _context);
        },

        track: function (error, extra) {
            var norm = normalizeError(error);
            var severity = classifySeverity(norm.message);
            var fp = fingerprint(norm.message, norm.stack);

            return readLogs().then(function (logs) {
                var existing = null;
                for (var i = 0; i < logs.length; i++) {
                    if (logs[i].fingerprint === fp) {
                        existing = logs[i];
                        break;
                    }
                }

                if (existing) {
                    existing.count = (existing.count || 1) + 1;
                    existing.lastSeen = Date.now();
                } else {
                    var entry = {
                        message: norm.message,
                        stack: norm.stack,
                        severity: severity,
                        fingerprint: fp,
                        context: _context,
                        version: VERSION,
                        timestamp: Date.now(),
                        lastSeen: Date.now(),
                        count: 1,
                        extra: extra || null
                    };
                    logs.push(entry);
                }

                while (logs.length > MAX_ENTRIES) {
                    logs.shift();
                }

                return writeLogs(logs);
            });
        },

        getErrors: function (filter) {
            return readLogs().then(function (logs) {
                if (!filter) return logs;

                return logs.filter(function (entry) {
                    if (filter.severity && entry.severity !== filter.severity) return false;
                    if (filter.context && entry.context !== filter.context) return false;
                    if (filter.since && entry.timestamp < filter.since) return false;
                    return true;
                });
            });
        },

        clearErrors: function () {
            return writeLogs([]);
        },

        getStats: function () {
            return readLogs().then(function (logs) {
                var stats = {
                    total: logs.length,
                    totalOccurrences: 0,
                    bySeverity: { critical: 0, high: 0, medium: 0, low: 0 },
                    byContext: {},
                    newest: null,
                    oldest: null
                };

                for (var i = 0; i < logs.length; i++) {
                    var entry = logs[i];
                    stats.totalOccurrences += entry.count || 1;
                    stats.bySeverity[entry.severity] = (stats.bySeverity[entry.severity] || 0) + 1;
                    stats.byContext[entry.context] = (stats.byContext[entry.context] || 0) + 1;

                    if (!stats.oldest || entry.timestamp < stats.oldest) {
                        stats.oldest = entry.timestamp;
                    }
                    if (!stats.newest || entry.timestamp > stats.newest) {
                        stats.newest = entry.timestamp;
                    }
                }

                return stats;
            });
        }
    };

    root.ErrorTracker = ErrorTracker;

})(typeof self !== 'undefined' ? self : this);
