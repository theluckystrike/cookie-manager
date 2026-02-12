/**
 * Cookie Manager - Feature Gate Middleware
 * Controls access to free vs pro features with usage tracking.
 * IIFE pattern - exposes FeatureGate globally on self and window.
 */
(function () {
    'use strict';

    // ========================================================================
    // Feature Tier Registry
    // ========================================================================

    /**
     * Maps feature IDs to their required tier.
     * 'free' = available to all users (may have usage limits).
     * 'pro'  = requires an active pro license.
     */
    var FEATURE_TIERS = {
        'cookie_view':        'free',
        'cookie_edit':        'free',
        'cookie_delete':      'free',
        'cookie_create':      'free',
        'basic_export':       'free',
        'advanced_export':    'pro',
        'cookie_profiles':    'free',
        'unlimited_profiles': 'pro',
        'auto_delete_rules':  'free',
        'unlimited_rules':    'pro',
        'health_dashboard':   'pro',
        'jwt_decoder':        'free',
        'bulk_operations':    'pro',
        'import_cookies':     'pro'
    };

    // ========================================================================
    // Free-Tier Usage Limits
    // ========================================================================

    /**
     * Maximum number of resources a free user can create for limited features.
     * Features not listed here have no usage cap on the free tier.
     */
    var FREE_LIMITS = {
        'cookie_profiles':   2,
        'auto_delete_rules': 1
    };

    // ========================================================================
    // Storage key for persisted usage counters
    // ========================================================================

    var STORAGE_KEY = 'featureGateUsage';

    // ========================================================================
    // Internal helpers
    // ========================================================================

    /**
     * Read the usage map from chrome.storage.local.
     * @returns {Promise<Object>} - e.g. { cookie_profiles: 2, auto_delete_rules: 1 }
     */
    function _getUsageMap() {
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
     * Persist the full usage map back to chrome.storage.local.
     * @param {Object} usageMap
     * @returns {Promise<void>}
     */
    function _setUsageMap(usageMap) {
        return new Promise(function (resolve) {
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                var data = {};
                data[STORAGE_KEY] = usageMap;
                chrome.storage.local.set(data, function () {
                    resolve();
                });
            } else {
                resolve();
            }
        });
    }

    // ========================================================================
    // Core API
    // ========================================================================

    /**
     * Gate a feature behind tier / limit checks.
     *
     * Flow:
     *  1. If the feature tier is 'free' and has no limit  -> callback()
     *  2. If the feature tier is 'free' and has a limit   -> check usage
     *       a. Within limit  -> callback()
     *       b. At/over limit -> show paywall or call onBlocked
     *  3. If the feature tier is 'pro'                    -> check license
     *       a. Licensed      -> callback()
     *       b. Not licensed  -> show paywall or call onBlocked
     *
     * @param {string}   featureId  - Key from FEATURE_TIERS
     * @param {Function} callback   - Called when access is granted
     * @param {Object}   [options]
     * @param {Function} [options.onBlocked] - Called instead of default paywall when blocked
     * @param {boolean}  [options.skipIncrement] - If true, do not increment usage counter
     */
    function gateFeature(featureId, callback, options) {
        options = options || {};

        var tier = FEATURE_TIERS[featureId];

        // Unknown feature -> allow (fail-open for future extensibility)
        if (typeof tier === 'undefined') {
            if (typeof callback === 'function') callback();
            return;
        }

        // --- Pro-only features ---
        if (tier === 'pro') {
            getLicenseStatus().then(function (license) {
                if (license && license.tier === 'pro') {
                    if (typeof callback === 'function') callback();
                } else {
                    _handleBlocked(featureId, options);
                }
            });
            return;
        }

        // --- Free features with a usage limit ---
        var limit = FREE_LIMITS[featureId];
        if (typeof limit === 'number') {
            _getUsageMap().then(function (usageMap) {
                var currentUsage = usageMap[featureId] || 0;

                if (currentUsage < limit) {
                    // Within limit - optionally increment, then call back
                    if (!options.skipIncrement) {
                        usageMap[featureId] = currentUsage + 1;
                        _setUsageMap(usageMap).then(function () {
                            if (typeof callback === 'function') callback();
                        });
                    } else {
                        if (typeof callback === 'function') callback();
                    }
                } else {
                    // At or over the free limit - check if user has pro license
                    getLicenseStatus().then(function (license) {
                        if (license && license.tier === 'pro') {
                            // Pro user - no limit
                            if (typeof callback === 'function') callback();
                        } else {
                            _handleBlocked(featureId, options);
                        }
                    });
                }
            });
            return;
        }

        // --- Free features with no limit ---
        if (typeof callback === 'function') callback();
    }

    /**
     * Handle a blocked feature: call onBlocked callback or show paywall.
     * @param {string} featureId
     * @param {Object} options
     */
    function _handleBlocked(featureId, options) {
        if (typeof options.onBlocked === 'function') {
            options.onBlocked(featureId);
            return;
        }

        // Attempt to show Paywall modal (with typeof guard for environments
        // where the Paywall module has not been loaded)
        if (typeof Paywall !== 'undefined' && typeof Paywall.show === 'function') {
            Paywall.show(formatFeatureName(featureId));
        } else {
            // Fallback: log a warning so callers know the gate fired
            console.warn('[FeatureGate] Feature "' + featureId + '" requires Pro. Paywall module not loaded.');
        }
    }

    /**
     * Check whether a feature is available to the current user without
     * executing any callback or incrementing usage.
     *
     * @param {string} featureId
     * @returns {Promise<boolean>}
     */
    function isAvailable(featureId) {
        var tier = FEATURE_TIERS[featureId];

        // Unknown feature -> available
        if (typeof tier === 'undefined') {
            return Promise.resolve(true);
        }

        if (tier === 'pro') {
            return getLicenseStatus().then(function (license) {
                return !!(license && license.tier === 'pro');
            });
        }

        // Free tier with limit
        var limit = FREE_LIMITS[featureId];
        if (typeof limit === 'number') {
            return _getUsageMap().then(function (usageMap) {
                var currentUsage = usageMap[featureId] || 0;
                if (currentUsage < limit) {
                    return true;
                }
                // At limit - still available if user is pro
                return getLicenseStatus().then(function (license) {
                    return !!(license && license.tier === 'pro');
                });
            });
        }

        // Free with no limit
        return Promise.resolve(true);
    }

    /**
     * Get the number of remaining uses for a limited free feature.
     * Returns null for features that have no numeric limit.
     *
     * @param {string} featureId
     * @returns {Promise<number|null>}
     */
    function getRemainingUses(featureId) {
        var limit = FREE_LIMITS[featureId];
        if (typeof limit !== 'number') {
            return Promise.resolve(null);
        }

        return _getUsageMap().then(function (usageMap) {
            var currentUsage = usageMap[featureId] || 0;
            var remaining = limit - currentUsage;
            return remaining > 0 ? remaining : 0;
        });
    }

    /**
     * Get the required tier for a feature.
     *
     * @param {string} featureId
     * @returns {string} - 'free' or 'pro'
     */
    function getRequiredTier(featureId) {
        return FEATURE_TIERS[featureId] || 'free';
    }

    /**
     * Get the current usage count for a feature from chrome.storage.local.
     *
     * @param {string} featureId
     * @returns {Promise<number>}
     */
    function getUsage(featureId) {
        return _getUsageMap().then(function (usageMap) {
            return usageMap[featureId] || 0;
        });
    }

    /**
     * Manually increment the usage counter for a feature.
     *
     * @param {string} featureId
     * @returns {Promise<number>} - the new usage count
     */
    function incrementUsage(featureId) {
        return _getUsageMap().then(function (usageMap) {
            var current = usageMap[featureId] || 0;
            usageMap[featureId] = current + 1;
            return _setUsageMap(usageMap).then(function () {
                return usageMap[featureId];
            });
        });
    }

    /**
     * Reset all usage counters.
     *
     * @returns {Promise<void>}
     */
    function resetUsage() {
        return _setUsageMap({});
    }

    /**
     * Retrieve the current license / tier status.
     *
     * Strategy:
     *  1. Send GET_LICENSE_STATUS message to the service worker.
     *  2. If messaging fails (e.g. service worker not available),
     *     fall back to reading chrome.storage.local directly.
     *
     * @returns {Promise<Object>} - { tier: 'free'|'pro', expiresAt: number|null }
     */
    function getLicenseStatus() {
        return new Promise(function (resolve) {
            // Guard: chrome.runtime may not be available in all contexts
            if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.sendMessage) {
                _fallbackLicenseCheck().then(resolve);
                return;
            }

            try {
                chrome.runtime.sendMessage({ action: 'GET_LICENSE_STATUS' }, function (response) {
                    // Handle messaging errors (e.g. no listener on the other side)
                    if (chrome.runtime.lastError || !response) {
                        _fallbackLicenseCheck().then(resolve);
                        return;
                    }
                    // Unwrap { success, data } envelope from service worker
                    resolve((response && response.data) ? response.data : response);
                });
            } catch (e) {
                _fallbackLicenseCheck().then(resolve);
            }
        });
    }

    /**
     * Fallback license check that reads directly from chrome.storage.local.
     * @returns {Promise<Object>}
     */
    function _fallbackLicenseCheck() {
        return new Promise(function (resolve) {
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                chrome.storage.local.get({ licenseData: null }, function (result) {
                    if (chrome.runtime.lastError || !result.licenseData) {
                        resolve({ tier: 'free', expiresAt: null });
                        return;
                    }
                    var status = result.licenseData;
                    // Validate expiry
                    if (status.tier === 'pro' && status.expiresAt && status.expiresAt < Date.now()) {
                        resolve({ tier: 'free', expiresAt: null });
                        return;
                    }
                    resolve(status);
                });
            } else {
                resolve({ tier: 'free', expiresAt: null });
            }
        });
    }

    // ========================================================================
    // Helper: Format feature name
    // ========================================================================

    /**
     * Convert a snake_case feature ID to Title Case display name.
     * e.g. 'advanced_export' -> 'Advanced Export'
     *
     * @param {string} featureId
     * @returns {string}
     */
    function formatFeatureName(featureId) {
        if (!featureId || typeof featureId !== 'string') return '';
        return featureId
            .split('_')
            .map(function (word) {
                if (!word) return '';
                return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
            })
            .join(' ');
    }

    // ========================================================================
    // Public API
    // ========================================================================

    var FeatureGate = {
        // Core methods
        gateFeature:      gateFeature,
        isAvailable:      isAvailable,
        getRemainingUses: getRemainingUses,
        getRequiredTier:  getRequiredTier,
        getUsage:         getUsage,
        incrementUsage:   incrementUsage,
        resetUsage:       resetUsage,
        getLicenseStatus: getLicenseStatus,

        // Helper
        formatFeatureName: formatFeatureName,

        // Expose registries for introspection / testing
        FEATURE_TIERS: FEATURE_TIERS,
        FREE_LIMITS:   FREE_LIMITS
    };

    // Expose globally on both self (service worker) and window (popup/pages)
    if (typeof self !== 'undefined') self.FeatureGate = FeatureGate;
    if (typeof window !== 'undefined') window.FeatureGate = FeatureGate;

})();
