/**
 * Cookie Manager - Debug Logger
 * Privacy-focused diagnostic logging with sanitization and export.
 * Local only - no external endpoints.
 */
(function () {
    'use strict';

    var MAX_BUFFER = 500;
    var SENSITIVE_KEYS = /password|token|secret|api_key|authorization|cookie/i;
    var VALID_CATEGORIES = ['cookies', 'storage', 'ui', 'network', 'system', 'performance'];

    function DebugLogger() {
        this._buffer = [];
        this._debugMode = false;
        this._context = 'unknown';
        this._ready = false;
    }

    /**
     * Initialize the logger for a given context.
     * Reads debugMode from storage and listens for changes.
     */
    DebugLogger.prototype.init = function (contextName) {
        this._context = contextName || 'unknown';

        var logger = this;

        try {
            chrome.storage.local.get({ debugMode: false }, function (result) {
                if (chrome.runtime.lastError) {
                    logger._debugMode = false;
                } else {
                    logger._debugMode = !!result.debugMode;
                }
                logger._ready = true;
            });
        } catch (e) {
            logger._debugMode = false;
            logger._ready = true;
        }

        try {
            chrome.storage.onChanged.addListener(function (changes, area) {
                if (area === 'local' && changes.debugMode) {
                    logger._debugMode = !!changes.debugMode.newValue;
                }
            });
        } catch (e) {
            // Storage listener not available in this context
        }

        return this;
    };

    // ---- Data Sanitization ----

    DebugLogger.prototype.sanitize = function (data) {
        if (data === null || data === undefined) return data;
        if (typeof data !== 'object') return data;

        if (data instanceof Error) {
            return { message: data.message, stack: data.stack, name: data.name };
        }

        if (Array.isArray(data)) {
            var out = [];
            for (var i = 0; i < data.length; i++) {
                out.push(this.sanitize(data[i]));
            }
            return out;
        }

        var cleaned = {};
        var keys = Object.keys(data);
        for (var k = 0; k < keys.length; k++) {
            var key = keys[k];
            if (SENSITIVE_KEYS.test(key)) {
                cleaned[key] = '[REDACTED]';
            } else {
                cleaned[key] = this.sanitize(data[key]);
            }
        }
        return cleaned;
    };

    // ---- Internal helpers ----

    DebugLogger.prototype._push = function (level, category, message, data) {
        var entry = {
            timestamp: new Date().toISOString(),
            level: level,
            category: VALID_CATEGORIES.indexOf(category) !== -1 ? category : 'system',
            message: message,
            data: data !== undefined ? this.sanitize(data) : undefined,
            context: this._context
        };

        this._buffer.push(entry);
        if (this._buffer.length > MAX_BUFFER) {
            this._buffer.shift();
        }

        return entry;
    };

    DebugLogger.prototype._shouldLog = function (level) {
        if (this._debugMode) return true;
        return level === 'error';
    };

    // ---- Public logging methods ----

    DebugLogger.prototype.log = function (category, message, data) {
        var entry = this._push('info', category, message, data);
        if (this._shouldLog('info')) {
            console.log('[' + entry.context + '][' + entry.category + '] ' + message, entry.data || '');
        }
    };

    DebugLogger.prototype.warn = function (category, message, data) {
        var entry = this._push('warn', category, message, data);
        if (this._shouldLog('warn')) {
            console.warn('[' + entry.context + '][' + entry.category + '] ' + message, entry.data || '');
        }
    };

    DebugLogger.prototype.error = function (category, message, error, data) {
        var combined = {};
        if (error instanceof Error) {
            combined.error = { message: error.message, stack: error.stack, name: error.name };
        } else if (error !== undefined) {
            combined.error = error;
        }
        if (data !== undefined) {
            combined.data = data;
        }

        var entry = this._push('error', category, message, Object.keys(combined).length ? combined : undefined);
        console.error('[' + entry.context + '][' + entry.category + '] ' + message, entry.data || '');
    };

    // ---- Buffer access ----

    DebugLogger.prototype.getLogs = function (filter) {
        if (!filter) return this._buffer.slice();

        var since = filter.since ? new Date(filter.since).getTime() : 0;

        return this._buffer.filter(function (entry) {
            if (filter.category && entry.category !== filter.category) return false;
            if (filter.level && entry.level !== filter.level) return false;
            if (since && new Date(entry.timestamp).getTime() < since) return false;
            return true;
        });
    };

    DebugLogger.prototype.clear = function () {
        this._buffer = [];
    };

    // ---- Export ----

    DebugLogger.prototype.exportAsText = function () {
        var lines = [
            'Cookie Manager Debug Log',
            'Context: ' + this._context,
            'Exported: ' + new Date().toISOString(),
            'Entries: ' + this._buffer.length,
            '----------------------------------------'
        ];

        for (var i = 0; i < this._buffer.length; i++) {
            var e = this._buffer[i];
            var line = '[' + e.timestamp + '] [' + e.level.toUpperCase() + '] [' + e.category + '] ' + e.message;
            if (e.data !== undefined) {
                line += ' | ' + JSON.stringify(e.data);
            }
            lines.push(line);
        }

        return lines.join('\n');
    };

    DebugLogger.prototype.exportAsJSON = function () {
        return JSON.stringify({
            context: this._context,
            exported: new Date().toISOString(),
            entries: this._buffer
        }, null, 2);
    };

    DebugLogger.prototype.getLogBlob = function () {
        return new Blob([this.exportAsText()], { type: 'text/plain' });
    };

    // ---- Static factory ----

    DebugLogger.init = function (contextName) {
        var logger = new DebugLogger();
        return logger.init(contextName);
    };

    // Expose globally
    if (typeof self !== 'undefined') {
        self.DebugLogger = DebugLogger;
    }
    if (typeof window !== 'undefined') {
        window.DebugLogger = DebugLogger;
    }
})();
