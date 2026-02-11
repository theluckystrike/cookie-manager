/**
 * License Manager
 * Handles license verification, caching, and feature gating for Pro/Lifetime tiers.
 * IIFE pattern - exposes LicenseManager globally on self and window.
 */
(function (root) {
    'use strict';

    var CONFIG = {
        apiUrl: 'https://api.zovo.dev/v1/license/verify',
        cacheDuration: 30 * 60 * 1000, // 30 minutes in ms
        storageKey: 'licenseData',
        licenseKeyKey: 'licenseKey',
        defaultTier: 'free'
    };

    // Feature map per tier
    var TIER_FEATURES = {
        free: [
            'viewCookies',
            'editCookies',
            'deleteCookies',
            'searchCookies',
            'exportSingle'
        ],
        pro: [
            'viewCookies',
            'editCookies',
            'deleteCookies',
            'searchCookies',
            'exportSingle',
            'exportBulk',
            'importCookies',
            'cookieProfiles',
            'syncAcrossDevices',
            'protectedCookies',
            'cookieAlerts'
        ],
        lifetime: [
            'viewCookies',
            'editCookies',
            'deleteCookies',
            'searchCookies',
            'exportSingle',
            'exportBulk',
            'importCookies',
            'cookieProfiles',
            'syncAcrossDevices',
            'protectedCookies',
            'cookieAlerts'
        ]
    };

    /**
     * Read cached license data from chrome.storage.local
     * @returns {Promise<Object|null>}
     */
    function getCachedLicense() {
        return chrome.storage.local.get(CONFIG.storageKey).then(function (result) {
            return result[CONFIG.storageKey] || null;
        }).catch(function (e) {
            console.error('[LicenseManager] Error reading cache:', e);
            return null;
        });
    }

    /**
     * Write license data to chrome.storage.local cache
     * @param {Object} data
     * @returns {Promise<void>}
     */
    function setCachedLicense(data) {
        var obj = {};
        obj[CONFIG.storageKey] = data;
        return chrome.storage.local.set(obj).catch(function (e) {
            console.error('[LicenseManager] Error writing cache:', e);
        });
    }

    /**
     * Clear cached license data
     * @returns {Promise<void>}
     */
    function clearCachedLicense() {
        return chrome.storage.local.remove([CONFIG.storageKey, CONFIG.licenseKeyKey]).catch(function (e) {
            console.error('[LicenseManager] Error clearing cache:', e);
        });
    }

    /**
     * Call the license verification API
     * @param {string} licenseKey
     * @returns {Promise<Object>}
     */
    function verifyWithApi(licenseKey) {
        return fetch(CONFIG.apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ licenseKey: licenseKey })
        }).then(function (response) {
            if (!response.ok) {
                throw new Error('API returned status ' + response.status);
            }
            return response.json();
        }).then(function (data) {
            // Normalize the API response into our cache format
            var licenseData = {
                valid: !!data.valid,
                tier: data.tier || CONFIG.defaultTier,
                features: data.features || TIER_FEATURES[data.tier] || TIER_FEATURES[CONFIG.defaultTier],
                expiresAt: data.expiresAt || null,
                licenseKey: licenseKey,
                cachedAt: Date.now()
            };
            return licenseData;
        });
    }

    /**
     * Check license status, using cache when available
     * @param {string} [licenseKey] - License key to verify. If omitted, reads stored key.
     * @param {boolean} [forceRefresh] - Skip cache and hit API directly
     * @returns {Promise<Object>} License data object
     */
    function checkLicense(licenseKey, forceRefresh) {
        // If no key provided, try to read stored key
        var keyPromise;
        if (licenseKey) {
            keyPromise = Promise.resolve(licenseKey);
        } else {
            keyPromise = chrome.storage.local.get(CONFIG.licenseKeyKey).then(function (result) {
                return result[CONFIG.licenseKeyKey] || null;
            });
        }

        return keyPromise.then(function (key) {
            if (!key) {
                // No license key - return free tier
                return _buildFreeTierData();
            }

            // Check cache first unless force refresh
            if (!forceRefresh) {
                return getCachedLicense().then(function (cached) {
                    if (cached && cached.valid && cached.cachedAt) {
                        var age = Date.now() - cached.cachedAt;
                        if (age < CONFIG.cacheDuration) {
                            return cached;
                        }
                    }
                    // Cache expired or missing - verify with API
                    return _verifyAndCache(key);
                });
            }

            return _verifyAndCache(key);
        });
    }

    /**
     * Verify with API and cache result, falling back to cache on error
     * @param {string} key
     * @returns {Promise<Object>}
     */
    function _verifyAndCache(key) {
        return verifyWithApi(key).then(function (licenseData) {
            return setCachedLicense(licenseData).then(function () {
                return licenseData;
            });
        }).catch(function (err) {
            console.warn('[LicenseManager] API verification failed, falling back to cache:', err.message);
            // Fall back to cached data on network error
            return getCachedLicense().then(function (cached) {
                if (cached && cached.valid) {
                    return cached;
                }
                // No valid cache - return free tier
                return _buildFreeTierData();
            });
        });
    }

    /**
     * Build a free-tier license data object
     * @returns {Object}
     */
    function _buildFreeTierData() {
        return {
            valid: false,
            tier: CONFIG.defaultTier,
            features: TIER_FEATURES[CONFIG.defaultTier],
            expiresAt: null,
            licenseKey: null,
            cachedAt: Date.now()
        };
    }

    /**
     * Check if the current user has a Pro (or Lifetime) license
     * @returns {Promise<boolean>}
     */
    function isPro() {
        return getCachedLicense().then(function (cached) {
            if (!cached || !cached.valid) return false;
            return cached.tier === 'pro' || cached.tier === 'lifetime';
        });
    }

    /**
     * Get the current tier string
     * @returns {Promise<string>} 'free', 'pro', or 'lifetime'
     */
    function getTier() {
        return getCachedLicense().then(function (cached) {
            if (!cached || !cached.valid) return CONFIG.defaultTier;
            return cached.tier || CONFIG.defaultTier;
        });
    }

    /**
     * Check if the user has access to a specific feature
     * @param {string} featureId
     * @returns {Promise<boolean>}
     */
    function hasFeature(featureId) {
        return getCachedLicense().then(function (cached) {
            var features;
            if (cached && cached.valid && cached.features) {
                features = cached.features;
            } else {
                features = TIER_FEATURES[CONFIG.defaultTier];
            }

            if (Array.isArray(features)) {
                return features.indexOf(featureId) !== -1;
            }
            // Support object-style features map
            return !!features[featureId];
        });
    }

    /**
     * Get the full features list for the current license
     * @returns {Promise<Array>}
     */
    function getFeatures() {
        return getCachedLicense().then(function (cached) {
            if (cached && cached.valid && cached.features) {
                return cached.features;
            }
            return TIER_FEATURES[CONFIG.defaultTier];
        });
    }

    /**
     * Get the license expiry date
     * @returns {Promise<string|null>} ISO date string or null
     */
    function getExpiryDate() {
        return getCachedLicense().then(function (cached) {
            if (!cached || !cached.valid) return null;
            return cached.expiresAt || null;
        });
    }

    /**
     * Activate a license key - stores the key and force-verifies it
     * @param {string} licenseKey
     * @returns {Promise<Object>} Verification result
     */
    function activateLicense(licenseKey) {
        if (!licenseKey || typeof licenseKey !== 'string' || !licenseKey.trim()) {
            return Promise.resolve({ valid: false, error: 'License key is required' });
        }

        var trimmedKey = licenseKey.trim();
        var obj = {};
        obj[CONFIG.licenseKeyKey] = trimmedKey;

        return chrome.storage.local.set(obj).then(function () {
            // Force-verify with API
            return checkLicense(trimmedKey, true);
        });
    }

    /**
     * Deactivate the current license - clears stored key and cache
     * @returns {Promise<Object>}
     */
    function deactivateLicense() {
        return clearCachedLicense().then(function () {
            return { success: true, tier: CONFIG.defaultTier };
        });
    }

    // Public API
    var LicenseManager = {
        CONFIG: CONFIG,
        TIER_FEATURES: TIER_FEATURES,
        checkLicense: checkLicense,
        isPro: isPro,
        getTier: getTier,
        hasFeature: hasFeature,
        getFeatures: getFeatures,
        getExpiryDate: getExpiryDate,
        activateLicense: activateLicense,
        deactivateLicense: deactivateLicense,
        getCachedLicense: getCachedLicense
    };

    // Expose globally on both self (service worker) and window (popup/pages)
    if (typeof self !== 'undefined') self.LicenseManager = LicenseManager;
    if (typeof window !== 'undefined') window.LicenseManager = LicenseManager;

})(typeof self !== 'undefined' ? self : typeof window !== 'undefined' ? window : this);
