/**
 * Cookie Manager - Performance Monitor
 * Local-only performance tracking for startup timing, operation measurement,
 * popup load times, and health reporting.
 */
(function(global) {
    'use strict';

    var MAX_STARTUP_HISTORY = 20;
    var MAX_POPUP_LOAD_TIMES = 20;
    var MAX_MEASUREMENTS = 200;

    function now() {
        return (typeof performance !== 'undefined' && performance.now)
            ? performance.now()
            : Date.now();
    }

    function PerformanceMonitor() {
        this._marks = {};
        this._startupStart = now();
        this._measurements = [];
        this._popupTimerStart = null;
    }

    // ========================================================================
    // Startup Timing
    // ========================================================================

    PerformanceMonitor.prototype.mark = function(name) {
        this._marks[name] = now();
    };

    PerformanceMonitor.prototype.complete = function() {
        var endTime = now();
        var totalMs = Math.round((endTime - this._startupStart) * 100) / 100;
        var marks = {};
        var self = this;

        Object.keys(this._marks).forEach(function(name) {
            marks[name] = Math.round((self._marks[name] - self._startupStart) * 100) / 100;
        });

        var entry = {
            timestamp: Date.now(),
            totalMs: totalMs,
            marks: marks
        };

        return chrome.storage.local.get({ startupHistory: [] }).then(function(result) {
            var history = result.startupHistory;
            history.push(entry);
            if (history.length > MAX_STARTUP_HISTORY) {
                history = history.slice(history.length - MAX_STARTUP_HISTORY);
            }
            return chrome.storage.local.set({ startupHistory: history }).then(function() {
                return entry;
            });
        });
    };

    // ========================================================================
    // Operation Timing
    // ========================================================================

    PerformanceMonitor.prototype.measureSync = function(label, fn) {
        var start = now();
        try {
            var result = fn();
            this._recordMeasurement(label, now() - start, true);
            return result;
        } catch (err) {
            this._recordMeasurement(label, now() - start, false);
            throw err;
        }
    };

    PerformanceMonitor.prototype.measureAsync = function(label, fn) {
        var self = this;
        var start = now();
        return fn().then(function(result) {
            self._recordMeasurement(label, now() - start, true);
            return result;
        }).catch(function(err) {
            self._recordMeasurement(label, now() - start, false);
            throw err;
        });
    };

    PerformanceMonitor.prototype._recordMeasurement = function(label, durationMs, success) {
        this._measurements.push({
            label: label,
            durationMs: Math.round(durationMs * 100) / 100,
            success: success,
            timestamp: Date.now()
        });
        if (this._measurements.length > MAX_MEASUREMENTS) {
            this._measurements = this._measurements.slice(
                this._measurements.length - MAX_MEASUREMENTS
            );
        }
    };

    PerformanceMonitor.prototype.getStats = function(label) {
        var items = label
            ? this._measurements.filter(function(m) { return m.label === label; })
            : this._measurements;

        if (items.length === 0) {
            return { count: 0, avgMs: 0, minMs: 0, maxMs: 0, successRate: 1 };
        }

        var sum = 0;
        var min = Infinity;
        var max = 0;
        var successes = 0;

        items.forEach(function(m) {
            sum += m.durationMs;
            if (m.durationMs < min) min = m.durationMs;
            if (m.durationMs > max) max = m.durationMs;
            if (m.success) successes++;
        });

        return {
            count: items.length,
            avgMs: Math.round((sum / items.length) * 100) / 100,
            minMs: min,
            maxMs: max,
            successRate: Math.round((successes / items.length) * 100) / 100
        };
    };

    // ========================================================================
    // Popup Load Timer
    // ========================================================================

    PerformanceMonitor.prototype.startPopupTimer = function() {
        this._popupTimerStart = now();
    };

    PerformanceMonitor.prototype.endPopupTimer = function() {
        if (this._popupTimerStart === null) {
            return Promise.resolve(0);
        }
        var durationMs = Math.round((now() - this._popupTimerStart) * 100) / 100;
        this._popupTimerStart = null;

        return chrome.storage.local.get({ popupLoadTimes: [] }).then(function(result) {
            var times = result.popupLoadTimes;
            times.push({ timestamp: Date.now(), durationMs: durationMs });
            if (times.length > MAX_POPUP_LOAD_TIMES) {
                times = times.slice(times.length - MAX_POPUP_LOAD_TIMES);
            }
            return chrome.storage.local.set({ popupLoadTimes: times }).then(function() {
                return durationMs;
            });
        });
    };

    // ========================================================================
    // Health Report
    // ========================================================================

    PerformanceMonitor.prototype.getHealthReport = function() {
        var self = this;

        return chrome.storage.local.get({
            popupLoadTimes: [],
            errorLogs: [],
            totalOperations: 0
        }).then(function(data) {
            var loadTimes = data.popupLoadTimes;
            var popupLoadTime = loadTimes.length > 0
                ? loadTimes[loadTimes.length - 1].durationMs
                : null;

            var memoryUsage = null;
            if (typeof performance !== 'undefined' && performance.memory) {
                memoryUsage = {
                    usedJSHeapSize: performance.memory.usedJSHeapSize,
                    totalJSHeapSize: performance.memory.totalJSHeapSize,
                    usedMB: Math.round(performance.memory.usedJSHeapSize / (1024 * 1024) * 100) / 100
                };
            }

            var totalOps = data.totalOperations || 1;
            var errorRate = Math.round((data.errorLogs.length / totalOps) * 10000) / 10000;

            return {
                popupLoadTime: popupLoadTime,
                memoryUsage: memoryUsage,
                errorRate: errorRate,
                operationStats: self.getStats()
            };
        });
    };

    global.PerformanceMonitor = PerformanceMonitor;

})(typeof self !== 'undefined' ? self : this);
