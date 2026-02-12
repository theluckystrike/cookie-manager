/**
 * Cookie Manager - Usage Tracking & Limits
 * Tracks per-feature usage counts and enforces configurable limits.
 * IIFE pattern - exposes UsageTracker globally on self and window.
 */
(function () {
    'use strict';

    // ========================================================================
    // Constants
    // ========================================================================

    var STORAGE_KEY = 'featureUsage';
    var LIMITS_CONFIG_PATH = 'src/features/limits-config.json';

    // ========================================================================
    // Internal State
    // ========================================================================

    /**
     * Cached usage data loaded from chrome.storage.local.
     * Shape:
     * {
     *   featureId: {
     *     count: number,           // usage count for current period
     *     total: number,           // all-time total
     *     period: 'daily'|'weekly'|'monthly'|'total'|'unlimited',
     *     periodStart: number,     // timestamp of current period start
     *     lastUsed: number|null    // timestamp of last usage
     *   }
     * }
     */
    var _usageData = {};
    var _initialized = false;

    /**
     * Cached limits config loaded from limits-config.json.
     * null until first fetch.
     */
    var _limitsConfig = null;

    // ========================================================================
    // Storage Helpers
    // ========================================================================

    /**
     * Read usage data from chrome.storage.local.
     * @returns {Promise<Object>}
     */
    function _loadFromStorage() {
        return new Promise(function (resolve) {
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                var query = {};
                query[STORAGE_KEY] = {};
                chrome.storage.local.get(query, function (result) {
                    if (chrome.runtime.lastError) {
                        resolve({});
                        return;
                    }
                    resolve(result[STORAGE_KEY] || {});
                });
            } else {
                resolve({});
            }
        });
    }

    /**
     * Persist usage data to chrome.storage.local.
     * @returns {Promise<void>}
     */
    function _saveToStorage() {
        return new Promise(function (resolve) {
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                var data = {};
                data[STORAGE_KEY] = _usageData;
                chrome.storage.local.set(data, function () {
                    if (chrome.runtime.lastError) {
                        console.warn('[UsageTracker] Storage write error:', chrome.runtime.lastError.message);
                    }
                    resolve();
                });
            } else {
                resolve();
            }
        });
    }

    // ========================================================================
    // Period Reset Logic
    // ========================================================================

    /**
     * Get the start of the current period as a timestamp.
     * @param {string} period - 'daily', 'weekly', 'monthly', 'total', 'unlimited'
     * @returns {number} - timestamp in milliseconds
     */
    function _getPeriodStart(period) {
        var now = new Date();

        switch (period) {
            case 'daily':
                return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

            case 'weekly':
                // Start of week (Sunday)
                var dayOfWeek = now.getDay();
                var weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek);
                return weekStart.getTime();

            case 'monthly':
                return new Date(now.getFullYear(), now.getMonth(), 1).getTime();

            case 'total':
            case 'unlimited':
            default:
                // No reset; use epoch as the "period start"
                return 0;
        }
    }

    /**
     * Check whether the usage entry for a feature needs a period reset.
     * If the stored periodStart is older than the current period boundary,
     * reset the count to 0 and update the periodStart.
     *
     * @param {string} featureId
     * @param {string} period - from limits config
     * @returns {boolean} - true if the entry was reset
     */
    function _checkAndResetPeriod(featureId, period) {
        if (period === 'total' || period === 'unlimited') {
            return false;
        }

        var entry = _usageData[featureId];
        if (!entry) {
            return false;
        }

        var currentPeriodStart = _getPeriodStart(period);
        if (entry.periodStart < currentPeriodStart) {
            // Period has rolled over - reset counter but keep total
            entry.count = 0;
            entry.periodStart = currentPeriodStart;
            return true;
        }

        return false;
    }

    // ========================================================================
    // Limits Config Loader
    // ========================================================================

    /**
     * Fetch limits configuration from limits-config.json.
     * Uses chrome.runtime.getURL to resolve the extension-relative path.
     * Caches the result after first successful fetch.
     *
     * @returns {Promise<Object|null>} - the parsed config, or null on error
     */
    function _fetchLimitsConfig() {
        if (_limitsConfig !== null) {
            return Promise.resolve(_limitsConfig);
        }

        return new Promise(function (resolve) {
            if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.getURL) {
                console.warn('[UsageTracker] chrome.runtime.getURL not available');
                resolve(null);
                return;
            }

            var url = chrome.runtime.getURL(LIMITS_CONFIG_PATH);

            fetch(url)
                .then(function (response) {
                    if (!response.ok) {
                        throw new Error('HTTP ' + response.status);
                    }
                    return response.json();
                })
                .then(function (config) {
                    _limitsConfig = config;
                    resolve(config);
                })
                .catch(function (err) {
                    console.warn('[UsageTracker] Failed to load limits config:', err.message);
                    resolve(null);
                });
        });
    }

    /**
     * Get the limit configuration for a specific feature and tier.
     *
     * @param {string} featureId
     * @param {string} tier - 'free' or 'pro'
     * @returns {Promise<{limit: number, period: string}|null>}
     *   limit: -1 = unlimited, 0 = blocked, >0 = numeric cap
     *   period: 'daily', 'weekly', 'monthly', 'total', 'unlimited'
     */
    function _getLimitsForFeature(featureId, tier) {
        return _fetchLimitsConfig().then(function (config) {
            if (!config || !config.features || !config.features[featureId]) {
                return null;
            }

            var featureConfig = config.features[featureId];
            var tierConfig = featureConfig[tier] || featureConfig['free'];

            if (!tierConfig) {
                return null;
            }

            return {
                limit: tierConfig.limit,
                period: tierConfig.period
            };
        });
    }

    // ========================================================================
    // Core API
    // ========================================================================

    /**
     * Initialize the UsageTracker by loading stored data from
     * chrome.storage.local (key: 'featureUsage').
     *
     * @returns {Promise<void>}
     */
    function init() {
        return _loadFromStorage().then(function (data) {
            _usageData = data || {};
            _initialized = true;
        });
    }

    /**
     * Record a usage event for a feature.
     * Increments the period count and all-time total, then persists.
     *
     * @param {string} featureId - the feature being used
     * @param {string} tier - 'free' or 'pro'
     * @returns {Promise<{allowed: boolean, remaining: number, reason: string}>}
     */
    function recordUsage(featureId, tier) {
        tier = tier || 'free';

        return _getLimitsForFeature(featureId, tier).then(function (limits) {
            // No config found - allow by default
            if (!limits) {
                _ensureEntry(featureId, 'unlimited');
                _usageData[featureId].count += 1;
                _usageData[featureId].total += 1;
                _usageData[featureId].lastUsed = Date.now();
                return _saveToStorage().then(function () {
                    return { allowed: true, remaining: -1, reason: 'no_config' };
                });
            }

            var period = limits.period;
            var limit = limits.limit;

            // Ensure usage entry exists
            _ensureEntry(featureId, period);

            // Check for period reset before recording
            _checkAndResetPeriod(featureId, period);

            var entry = _usageData[featureId];

            // Unlimited (-1) - always allowed
            if (limit === -1) {
                entry.count += 1;
                entry.total += 1;
                entry.lastUsed = Date.now();
                return _saveToStorage().then(function () {
                    return { allowed: true, remaining: -1, reason: 'unlimited' };
                });
            }

            // Blocked (0) - never allowed on this tier
            if (limit === 0) {
                return { allowed: false, remaining: 0, reason: 'pro_required' };
            }

            // Numeric limit - check current count
            if (entry.count >= limit) {
                var remaining = 0;
                return {
                    allowed: false,
                    remaining: remaining,
                    reason: 'limit_reached'
                };
            }

            // Within limit - record the usage
            entry.count += 1;
            entry.total += 1;
            entry.lastUsed = Date.now();
            var newRemaining = limit - entry.count;

            return _saveToStorage().then(function () {
                return {
                    allowed: true,
                    remaining: newRemaining,
                    reason: 'within_limit'
                };
            });
        });
    }

    /**
     * Check whether usage of a feature is allowed without recording it.
     *
     * @param {string} featureId
     * @param {string} tier - 'free' or 'pro'
     * @returns {Promise<{allowed: boolean, remaining: number, reason: string}>}
     */
    function checkLimit(featureId, tier) {
        tier = tier || 'free';

        return _getLimitsForFeature(featureId, tier).then(function (limits) {
            // No config found - allow by default
            if (!limits) {
                return { allowed: true, remaining: -1, reason: 'no_config' };
            }

            var period = limits.period;
            var limit = limits.limit;

            // Unlimited
            if (limit === -1) {
                return { allowed: true, remaining: -1, reason: 'unlimited' };
            }

            // Blocked (0)
            if (limit === 0) {
                return { allowed: false, remaining: 0, reason: 'pro_required' };
            }

            // Ensure entry exists and handle period reset
            _ensureEntry(featureId, period);
            _checkAndResetPeriod(featureId, period);

            var entry = _usageData[featureId];
            var remaining = limit - entry.count;

            if (remaining <= 0) {
                return { allowed: false, remaining: 0, reason: 'limit_reached' };
            }

            return { allowed: true, remaining: remaining, reason: 'within_limit' };
        });
    }

    /**
     * Get usage data for a specific feature.
     *
     * @param {string} featureId
     * @returns {Object|null} - { count, total, period, periodStart, lastUsed } or null
     */
    function getUsage(featureId) {
        if (!_usageData[featureId]) {
            return null;
        }
        // Return a shallow copy to prevent external mutation
        var entry = _usageData[featureId];
        return {
            count: entry.count,
            total: entry.total,
            period: entry.period,
            periodStart: entry.periodStart,
            lastUsed: entry.lastUsed
        };
    }

    /**
     * Get all usage data.
     *
     * @returns {Object} - shallow copy of the entire usage data map
     */
    function getAllUsage() {
        var copy = {};
        var keys = Object.keys(_usageData);
        for (var i = 0; i < keys.length; i++) {
            var key = keys[i];
            var entry = _usageData[key];
            copy[key] = {
                count: entry.count,
                total: entry.total,
                period: entry.period,
                periodStart: entry.periodStart,
                lastUsed: entry.lastUsed
            };
        }
        return copy;
    }

    /**
     * Get the sum of all-time totals across every tracked feature.
     *
     * @returns {number}
     */
    function getTotalActions() {
        var sum = 0;
        var keys = Object.keys(_usageData);
        for (var i = 0; i < keys.length; i++) {
            sum += (_usageData[keys[i]].total || 0);
        }
        return sum;
    }

    /**
     * Reset usage counters for a specific feature (count resets, total preserved).
     *
     * @param {string} featureId
     * @returns {Promise<void>}
     */
    function resetFeatureUsage(featureId) {
        if (_usageData[featureId]) {
            _usageData[featureId].count = 0;
            _usageData[featureId].periodStart = _getPeriodStart(_usageData[featureId].period);
        }
        return _saveToStorage();
    }

    /**
     * Reset all usage data entirely.
     *
     * @returns {Promise<void>}
     */
    function resetAll() {
        _usageData = {};
        return _saveToStorage();
    }

    // ========================================================================
    // Internal Helpers
    // ========================================================================

    /**
     * Ensure a usage entry exists for a feature. Creates a fresh entry if missing.
     *
     * @param {string} featureId
     * @param {string} period - 'daily', 'weekly', 'monthly', 'total', 'unlimited'
     */
    function _ensureEntry(featureId, period) {
        if (!_usageData[featureId]) {
            _usageData[featureId] = {
                count: 0,
                total: 0,
                period: period,
                periodStart: _getPeriodStart(period),
                lastUsed: null
            };
        }
    }

    // ========================================================================
    // Public API
    // ========================================================================

    var UsageTracker = {
        init:               init,
        recordUsage:        recordUsage,
        checkLimit:         checkLimit,
        getUsage:           getUsage,
        getAllUsage:         getAllUsage,
        getTotalActions:    getTotalActions,
        resetFeatureUsage:  resetFeatureUsage,
        resetAll:           resetAll,

        // Exposed for testing / introspection
        _getLimitsForFeature: _getLimitsForFeature
    };

    // Expose globally on both self (service worker) and window (popup/pages)
    if (typeof self !== 'undefined') self.UsageTracker = UsageTracker;
    if (typeof window !== 'undefined') window.UsageTracker = UsageTracker;

})();
