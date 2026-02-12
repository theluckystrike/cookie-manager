// Cookie Manager - Tier Manager
// Based on competitive research: EditThisCookie, Cookie-Editor, Easy Local Storage
// Scoring: Acquisition(25%) + Habit(20%) + Upgrade(25%) + Differentiation(15%) + Cost(15%)

/**
 * PROMPT 03: Feature Value Scoring (5 Dimensions)
 * Cookie managers mostly free - monetize via bulk/export/sync
 */
(function () {
    'use strict';

    var FEATURE_SCORES = {
        // Feature: [Acquisition, Habit, Upgrade, Differentiation, Cost] => Total
        viewCookies: [10, 8, 2, 3, 10],   // 33 -> FREE (core)
        editCookies: [9, 7, 3, 4, 10],    // 33 -> FREE (core)
        deleteCookies: [8, 6, 2, 3, 10],    // 29 -> FREE
        searchCookies: [7, 8, 3, 5, 10],    // 33 -> FREE
        exportSingle: [5, 4, 6, 4, 10],    // 29 -> FREE (one at a time)
        exportBulk: [4, 3, 9, 6, 10],    // 32 -> PRO (bulk = value)
        importCookies: [5, 5, 8, 5, 10],    // 33 -> PRO
        cookieProfiles: [3, 6, 9, 8, 6],     // 32 -> PRO (Swap My Cookies pattern)
        syncAcrossDevices: [5, 4, 10, 7, 3],    // 29 -> PRO (#1 upgrade driver)
        protectedCookies: [4, 5, 7, 7, 10],    // 33 -> PRO
        cookieAlerts: [3, 4, 6, 6, 8]     // 27 -> PRO
    };

    var TIER_CONFIG = {
        free: {
            name: 'Free',
            limits: {
                maxCookiesExport: 10,        // Export 10 at a time free
                maxProfiles: 1,              // One profile free
                syncEnabled: false,
                exportFormats: ['txt']       // Basic export only
            },
            features: {
                viewCookies: true,           // Core - must be free
                editCookies: true,           // Core - must be free
                deleteCookies: true,         // Core - must be free
                searchCookies: true,         // Core - must be free
                exportSingle: true,          // One at a time
                // Visible but locked (Grammarly pattern)
                exportBulk: 'preview',
                importCookies: 'preview',
                cookieProfiles: 'limited',   // 1 profile free
                syncAcrossDevices: false,
                protectedCookies: 'preview',
                cookieAlerts: false
            }
        },

        pro: {
            name: 'Pro',
            price: {
                monthly: 4.00,               // Developer tool sweet spot
                yearly: 36.00,               // $3/mo billed yearly
                yearlyDiscount: '25%',
                weekly: 1.49
            },
            limits: {
                maxCookiesExport: Infinity,
                maxProfiles: Infinity,
                syncEnabled: true,
                exportFormats: ['txt', 'json', 'netscape', 'csv']
            },
            features: {
                viewCookies: true,
                editCookies: true,
                deleteCookies: true,
                searchCookies: true,
                exportSingle: true,
                // Pro unlocked
                exportBulk: true,            // Bulk export all
                importCookies: true,         // Import from file
                cookieProfiles: true,        // Multiple profiles (Swap My Cookies)
                syncAcrossDevices: true,     // Cross-device sync
                protectedCookies: true,      // Protect from deletion
                cookieAlerts: true           // Notifications on change
            }
        }
    };

    function TierManager() {
        this.currentTier = 'free';
        this.usageCache = null;
    }

    TierManager.prototype.init = function () {
        var self = this;
        return new Promise(function (resolve) {
            try {
                chrome.storage.local.get(['tier', 'proExpiry'], function (stored) {
                    if (chrome.runtime.lastError) {
                        console.warn('[TierManager] storage.get error:', chrome.runtime.lastError.message);
                        resolve(self);
                        return;
                    }
                    if (stored && stored.tier === 'pro' && stored.proExpiry > Date.now()) {
                        self.currentTier = 'pro';
                    }
                    resolve(self);
                });
            } catch (e) {
                console.warn('[TierManager] init error:', e);
                resolve(self);
            }
        });
    };

    TierManager.prototype.getTier = function () {
        return this.currentTier;
    };

    TierManager.prototype.getConfig = function () {
        return TIER_CONFIG[this.currentTier];
    };

    TierManager.prototype.getLimits = function () {
        return TIER_CONFIG[this.currentTier].limits;
    };

    TierManager.prototype.getFeatures = function () {
        return TIER_CONFIG[this.currentTier].features;
    };

    TierManager.prototype.canUseFeature = function (featureName) {
        var features = this.getFeatures();
        var value = features[featureName];
        return value === true;
    };

    TierManager.prototype.isFeaturePreview = function (featureName) {
        var features = this.getFeatures();
        var value = features[featureName];
        return value === 'preview' || value === 'limited';
    };

    TierManager.prototype.checkExportLimit = function (count) {
        if (this.currentTier === 'pro') return Promise.resolve(true);
        var limits = this.getLimits();
        return Promise.resolve(count <= limits.maxCookiesExport);
    };

    TierManager.prototype.checkProfileLimit = function () {
        var self = this;
        if (this.currentTier === 'pro') return Promise.resolve(true);
        var limits = this.getLimits();
        return new Promise(function (resolve) {
            try {
                chrome.storage.local.get(['cookieProfiles'], function (stored) {
                    if (chrome.runtime.lastError) {
                        resolve(true); // fail open
                        return;
                    }
                    var profiles = (stored && stored.cookieProfiles) || [];
                    resolve(profiles.length < limits.maxProfiles);
                });
            } catch (e) {
                resolve(true); // fail open
            }
        });
    };

    TierManager.prototype.getUpgradeUrl = function () {
        return 'https://www.zovo.one/pro?ref=cookie-manager';
    };

    TierManager.prototype.getPricing = function () {
        return TIER_CONFIG.pro.price;
    };

    // Export for Chrome extension (works in both service worker and window contexts)
    var tierManagerInstance = new TierManager();
    var _root = typeof self !== 'undefined' ? self : (typeof window !== 'undefined' ? window : {});
    _root.tierManager = tierManagerInstance;
    _root.TierManager = TierManager;
    _root.TIER_CONFIG = TIER_CONFIG;
    _root.FEATURE_SCORES = FEATURE_SCORES;
})();
