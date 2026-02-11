/**
 * Storage Optimizer — MD 20 Performance Optimization Guide
 * Batched writes, usage tracking, and cleanup for chrome.storage.local.
 * All data local — zero external requests.
 */
(function () {
    'use strict';

    var QUOTA_BYTES = 5242880;
    var DEFAULT_FLUSH_DELAY = 500;
    var DEFAULT_TRIM_TARGETS = {
        errorLogs: 50, analytics: 100, startupHistory: 20,
        popupLoadTimes: 20, _fb_entries: 100
    };

    var pendingBatch = {};
    var flushTimer = null;
    var flushPromiseResolvers = [];

    function hasStorageAPI() {
        return typeof chrome !== 'undefined' &&
               typeof chrome.storage !== 'undefined' &&
               typeof chrome.storage.local !== 'undefined';
    }

    function estimateBytes(obj) {
        try { return JSON.stringify(obj).length * 2; } // UTF-16
        catch (e) { return 0; }
    }

    function storageGet(keys) {
        return new Promise(function (resolve, reject) {
            try {
                if (!hasStorageAPI()) { return resolve({}); }
                chrome.storage.local.get(keys, function (result) {
                    if (typeof chrome.runtime !== 'undefined' && chrome.runtime.lastError) {
                        return reject(new Error(chrome.runtime.lastError.message));
                    }
                    resolve(result || {});
                });
            } catch (e) { resolve({}); }
        });
    }

    function storageSet(items) {
        return new Promise(function (resolve, reject) {
            try {
                if (!hasStorageAPI()) { return resolve(); }
                chrome.storage.local.set(items, function () {
                    if (typeof chrome.runtime !== 'undefined' && chrome.runtime.lastError) {
                        return reject(new Error(chrome.runtime.lastError.message));
                    }
                    resolve();
                });
            } catch (e) { resolve(); }
        });
    }

    function storageRemove(keys) {
        return new Promise(function (resolve, reject) {
            try {
                if (!hasStorageAPI()) { return resolve(); }
                chrome.storage.local.remove(keys, function () {
                    if (typeof chrome.runtime !== 'undefined' && chrome.runtime.lastError) {
                        return reject(new Error(chrome.runtime.lastError.message));
                    }
                    resolve();
                });
            } catch (e) { resolve(); }
        });
    }

    /* ── 1. Batch Writer ───────────────────────────────────────────── */

    function flushBatch() {
        try {
            if (flushTimer) { clearTimeout(flushTimer); flushTimer = null; }
            var items = pendingBatch;
            var resolvers = flushPromiseResolvers;
            pendingBatch = {};
            flushPromiseResolvers = [];
            if (Object.keys(items).length === 0) {
                resolvers.forEach(function (r) { r.resolve(); });
                return Promise.resolve();
            }
            return storageSet(items).then(function () {
                resolvers.forEach(function (r) { r.resolve(); });
            }).catch(function (err) {
                resolvers.forEach(function (r) { r.reject(err); });
            });
        } catch (e) { return Promise.resolve(); }
    }

    function scheduleFlush() {
        try {
            if (flushTimer) { clearTimeout(flushTimer); }
            flushTimer = setTimeout(function () {
                flushTimer = null;
                flushBatch();
            }, DEFAULT_FLUSH_DELAY);
        } catch (e) { /* timer failure is non-fatal */ }
    }

    function batchSet(key, value) {
        return new Promise(function (resolve, reject) {
            try {
                pendingBatch[key] = value;
                flushPromiseResolvers.push({ resolve: resolve, reject: reject });
                scheduleFlush();
            } catch (e) { reject(e); }
        });
    }

    /* ── 2. Batch Reader ───────────────────────────────────────────── */

    function batchGet(keys) {
        try {
            var keysArray = Array.isArray(keys) ? keys : [keys];
            var merged = {};
            var remaining = [];
            keysArray.forEach(function (k) {
                if (typeof pendingBatch[k] !== 'undefined') { merged[k] = pendingBatch[k]; }
                else { remaining.push(k); }
            });
            if (remaining.length === 0) { return Promise.resolve(merged); }
            return storageGet(remaining).then(function (stored) {
                Object.keys(stored).forEach(function (k) { merged[k] = stored[k]; });
                return merged;
            });
        } catch (e) { return Promise.resolve({}); }
    }

    /* ── 3. Storage Usage Tracker ──────────────────────────────────── */

    function buildUsageResult(bytesUsed) {
        var pct = (bytesUsed / QUOTA_BYTES) * 100;
        var status = pct >= 80 ? 'critical' : pct >= 50 ? 'warning' : 'ok';
        return {
            bytesUsed: bytesUsed, quotaBytes: QUOTA_BYTES,
            percentUsed: Math.round(pct * 100) / 100, status: status
        };
    }

    function fallbackUsage() {
        return storageGet(null).then(function (allData) {
            return buildUsageResult(estimateBytes(allData));
        }).catch(function () { return buildUsageResult(0); });
    }

    function getUsage() {
        try {
            if (hasStorageAPI() && typeof chrome.storage.local.getBytesInUse === 'function') {
                return new Promise(function (resolve) {
                    try {
                        chrome.storage.local.getBytesInUse(null, function (bytesUsed) {
                            if (typeof chrome.runtime !== 'undefined' && chrome.runtime.lastError) {
                                return fallbackUsage().then(resolve);
                            }
                            resolve(buildUsageResult(bytesUsed));
                        });
                    } catch (e) { fallbackUsage().then(resolve); }
                });
            }
            return fallbackUsage();
        } catch (e) { return Promise.resolve(buildUsageResult(0)); }
    }

    /* ── 4. Storage Cleanup ────────────────────────────────────────── */

    function cleanup(options) {
        try {
            var opts = options || {};
            var maxEntries = opts.maxEntries || DEFAULT_TRIM_TARGETS;
            var trimKeys = opts.trimKeys || Object.keys(DEFAULT_TRIM_TARGETS);
            var olderThan = opts.olderThan || null;
            var trimmedKeys = [];
            var bytesBefore = 0;

            return storageGet(null).then(function (allData) {
                bytesBefore = estimateBytes(allData);
                var updates = {};
                var removeKeys = [];
                trimKeys.forEach(function (key) {
                    try {
                        var limit = maxEntries[key] || DEFAULT_TRIM_TARGETS[key];
                        if (!limit) { return; }
                        var data = allData[key];
                        if (!Array.isArray(data) || data.length <= limit) { return; }
                        updates[key] = data.slice(data.length - limit);
                        trimmedKeys.push(key);
                    } catch (e) { /* skip key */ }
                });
                if (olderThan && typeof olderThan === 'number') {
                    Object.keys(allData).forEach(function (key) {
                        try {
                            var val = allData[key];
                            if (val && typeof val === 'object' &&
                                typeof val.timestamp === 'number' && val.timestamp < olderThan) {
                                removeKeys.push(key);
                                trimmedKeys.push(key);
                            }
                        } catch (e) { /* skip key */ }
                    });
                }
                var sp = Object.keys(updates).length > 0 ? storageSet(updates) : Promise.resolve();
                var rp = removeKeys.length > 0 ? storageRemove(removeKeys) : Promise.resolve();
                return Promise.all([sp, rp]).then(function () { return storageGet(null); });
            }).then(function (allDataAfter) {
                var bytesAfter = estimateBytes(allDataAfter);
                return { trimmedKeys: trimmedKeys, bytesFreed: Math.max(0, bytesBefore - bytesAfter) };
            }).catch(function () { return { trimmedKeys: [], bytesFreed: 0 }; });
        } catch (e) { return Promise.resolve({ trimmedKeys: [], bytesFreed: 0 }); }
    }

    /* ── 5. Key Size Analyzer ──────────────────────────────────────── */

    function analyzeKeys() {
        try {
            return storageGet(null).then(function (allData) {
                var totalBytes = 0;
                var entries = [];
                Object.keys(allData).forEach(function (key) {
                    try {
                        var sizeBytes = estimateBytes(allData[key]) + (key.length * 2);
                        totalBytes += sizeBytes;
                        entries.push({ key: key, sizeBytes: sizeBytes });
                    } catch (e) { /* skip key */ }
                });
                entries.sort(function (a, b) { return b.sizeBytes - a.sizeBytes; });
                entries.forEach(function (entry) {
                    entry.percentage = totalBytes > 0
                        ? Math.round((entry.sizeBytes / totalBytes) * 10000) / 100 : 0;
                });
                return entries;
            }).catch(function () { return []; });
        } catch (e) { return Promise.resolve([]); }
    }

    /* ── 6. Auto-Compact ───────────────────────────────────────────── */

    function autoCompact() {
        try {
            return cleanup({ maxEntries: DEFAULT_TRIM_TARGETS, trimKeys: Object.keys(DEFAULT_TRIM_TARGETS) });
        } catch (e) { return Promise.resolve({ trimmedKeys: [], bytesFreed: 0 }); }
    }

    /* ── Public API ────────────────────────────────────────────────── */

    var StorageOptimizer = {
        batchSet: batchSet,
        flushBatch: flushBatch,
        batchGet: batchGet,
        getUsage: getUsage,
        cleanup: cleanup,
        analyzeKeys: analyzeKeys,
        autoCompact: autoCompact
    };

    if (typeof self !== 'undefined') { self.StorageOptimizer = StorageOptimizer; }
    if (typeof window !== 'undefined') { window.StorageOptimizer = StorageOptimizer; }
})();
