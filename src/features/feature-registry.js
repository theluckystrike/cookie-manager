/**
 * Cookie Manager - Feature Registry & FeatureManager
 * Rich feature definitions with metadata, categories, and limit descriptors.
 * Complements FeatureGate (src/utils/feature-gate.js) which handles runtime
 * gating logic. This module provides the *catalog* of features plus helper
 * queries used by UI components, comparison tables, and onboarding flows.
 *
 * IIFE pattern - exposes FeatureManager, FEATURES, and TIERS globally.
 */
(function () {
    'use strict';

    // ========================================================================
    // Tier Constants
    // ========================================================================

    var TIERS = {
        FREE: 'free',
        PRO:  'pro'
    };

    // ========================================================================
    // Feature Categories
    // ========================================================================

    var CATEGORIES = {
        CORE:       'core',
        EXPORT:     'export',
        PROFILES:   'profiles',
        AUTOMATION: 'automation',
        ANALYSIS:   'analysis',
        BULK:       'bulk'
    };

    // ========================================================================
    // Feature Definitions
    // ========================================================================

    /**
     * Each feature entry describes:
     *   id          {string}        - Unique snake_case identifier (matches FeatureGate keys)
     *   name        {string}        - Human-readable display name
     *   description {string}        - Short explanation of the feature
     *   tier        {string}        - Required tier ('free' or 'pro')
     *   category    {string}        - Grouping category (see CATEGORIES)
     *   limit       {Object|null}   - Usage limit descriptor for free tier
     *       .count  {number}        - Maximum allowed actions/resources
     *       .period {string|null}   - 'daily' for rolling 24h limits, null for lifetime/resource caps
     *   icon        {string}        - CSS class or icon identifier for UI rendering
     */
    var FEATURES = {
        // ---- Free features ------------------------------------------------

        cookie_view: {
            id:          'cookie_view',
            name:        'View Cookies',
            description: 'View cookies for any site',
            tier:        TIERS.FREE,
            category:    CATEGORIES.CORE,
            limit:       null,
            icon:        'icon-view'
        },

        cookie_edit: {
            id:          'cookie_edit',
            name:        'Edit Cookies',
            description: 'Edit cookie values',
            tier:        TIERS.FREE,
            category:    CATEGORIES.CORE,
            limit:       { count: 25, period: 'daily' },
            icon:        'icon-edit'
        },

        cookie_delete: {
            id:          'cookie_delete',
            name:        'Delete Cookies',
            description: 'Delete individual cookies',
            tier:        TIERS.FREE,
            category:    CATEGORIES.CORE,
            limit:       { count: 50, period: 'daily' },
            icon:        'icon-delete'
        },

        cookie_create: {
            id:          'cookie_create',
            name:        'Create Cookies',
            description: 'Create new cookies',
            tier:        TIERS.FREE,
            category:    CATEGORIES.CORE,
            limit:       { count: 10, period: 'daily' },
            icon:        'icon-create'
        },

        basic_export: {
            id:          'basic_export',
            name:        'Basic Export',
            description: 'Export cookies as JSON',
            tier:        TIERS.FREE,
            category:    CATEGORIES.EXPORT,
            limit:       { count: 5, period: 'daily' },
            icon:        'icon-export'
        },

        cookie_profiles: {
            id:          'cookie_profiles',
            name:        'Cookie Profiles',
            description: 'Save and restore cookie profiles',
            tier:        TIERS.FREE,
            category:    CATEGORIES.PROFILES,
            limit:       { count: 2, period: null },
            icon:        'icon-profiles'
        },

        auto_delete_rules: {
            id:          'auto_delete_rules',
            name:        'Auto-Delete Rules',
            description: 'Automatically delete cookies based on rules',
            tier:        TIERS.FREE,
            category:    CATEGORIES.AUTOMATION,
            limit:       { count: 1, period: null },
            icon:        'icon-rules'
        },

        jwt_decoder: {
            id:          'jwt_decoder',
            name:        'JWT Decoder',
            description: 'Decode JWT cookie values',
            tier:        TIERS.FREE,
            category:    CATEGORIES.ANALYSIS,
            limit:       null,
            icon:        'icon-jwt'
        },

        // ---- Pro features -------------------------------------------------

        advanced_export: {
            id:          'advanced_export',
            name:        'Advanced Export',
            description: 'Export as Netscape, CSV, or other formats',
            tier:        TIERS.PRO,
            category:    CATEGORIES.EXPORT,
            limit:       null,
            icon:        'icon-export-adv'
        },

        unlimited_profiles: {
            id:          'unlimited_profiles',
            name:        'Unlimited Profiles',
            description: 'Create unlimited cookie profiles',
            tier:        TIERS.PRO,
            category:    CATEGORIES.PROFILES,
            limit:       null,
            icon:        'icon-profiles-pro'
        },

        unlimited_rules: {
            id:          'unlimited_rules',
            name:        'Unlimited Rules',
            description: 'Create unlimited auto-delete rules',
            tier:        TIERS.PRO,
            category:    CATEGORIES.AUTOMATION,
            limit:       null,
            icon:        'icon-rules-pro'
        },

        health_dashboard: {
            id:          'health_dashboard',
            name:        'Health Dashboard',
            description: 'Cookie health analysis dashboard',
            tier:        TIERS.PRO,
            category:    CATEGORIES.ANALYSIS,
            limit:       null,
            icon:        'icon-health'
        },

        bulk_operations: {
            id:          'bulk_operations',
            name:        'Bulk Operations',
            description: 'Bulk delete and edit cookies',
            tier:        TIERS.PRO,
            category:    CATEGORIES.BULK,
            limit:       null,
            icon:        'icon-bulk'
        },

        import_cookies: {
            id:          'import_cookies',
            name:        'Import Cookies',
            description: 'Import cookies from file',
            tier:        TIERS.PRO,
            category:    CATEGORIES.EXPORT,
            limit:       null,
            icon:        'icon-import'
        }
    };

    // ========================================================================
    // Internal State
    // ========================================================================

    var _currentTier = TIERS.FREE;
    var _initialized = false;

    // ========================================================================
    // Internal Helpers
    // ========================================================================

    /**
     * Resolve the current tier from LicenseManager or FeatureGate, falling
     * back to chrome.storage.local if neither is loaded yet.
     * @returns {Promise<string>}
     */
    function _resolveTierFromStorage() {
        // Prefer LicenseManager if available (it owns the license cache)
        if (typeof LicenseManager !== 'undefined' && typeof LicenseManager.getTier === 'function') {
            return LicenseManager.getTier().then(function (tier) {
                return tier === 'pro' || tier === 'lifetime' ? TIERS.PRO : TIERS.FREE;
            });
        }

        // Fall back to FeatureGate's getLicenseStatus if available
        if (typeof FeatureGate !== 'undefined' && typeof FeatureGate.getLicenseStatus === 'function') {
            return FeatureGate.getLicenseStatus().then(function (status) {
                return (status && status.tier === 'pro') ? TIERS.PRO : TIERS.FREE;
            });
        }

        // Last resort: read directly from chrome.storage.local
        return new Promise(function (resolve) {
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                chrome.storage.local.get({ licenseData: null }, function (result) {
                    if (chrome.runtime && chrome.runtime.lastError) {
                        resolve(TIERS.FREE);
                        return;
                    }
                    var data = result.licenseData;
                    if (data && data.tier === 'pro' && (!data.expiresAt || data.expiresAt > Date.now())) {
                        resolve(TIERS.PRO);
                    } else {
                        resolve(TIERS.FREE);
                    }
                });
            } else {
                resolve(TIERS.FREE);
            }
        });
    }

    // ========================================================================
    // FeatureManager API
    // ========================================================================

    var featureManager = {

        /**
         * Initialize the FeatureManager by resolving the current license tier.
         * Safe to call multiple times; subsequent calls re-sync the tier.
         * @returns {Promise<void>}
         */
        init: function init() {
            return _resolveTierFromStorage().then(function (tier) {
                _currentTier = tier;
                _initialized = true;
            });
        },

        /**
         * Return the current tier string ('free' or 'pro').
         * If init() has not been called yet, returns 'free'.
         * @returns {string}
         */
        getCurrentTier: function getCurrentTier() {
            return _currentTier;
        },

        /**
         * Convenience: is the current tier 'pro'?
         * @returns {boolean}
         */
        isPro: function isPro() {
            return _currentTier === TIERS.PRO;
        },

        /**
         * Manually override the current tier. Useful after a license change
         * event so the UI can update without re-reading storage.
         * @param {string} tier - 'free' or 'pro'
         */
        setTier: function setTier(tier) {
            if (tier === TIERS.FREE || tier === TIERS.PRO) {
                _currentTier = tier;
            }
        },

        /**
         * Check whether a feature is accessible under the current tier.
         *
         * Returns an object:
         *   { allowed: boolean, reason?: string, feature: Object }
         *
         * For free-tier features with daily/resource limits, this method only
         * checks tier eligibility -- it does NOT enforce usage counters.
         * Use FeatureGate.gateFeature() at call-time for counter enforcement.
         *
         * @param {string} featureId
         * @returns {{ allowed: boolean, reason: string|undefined, feature: Object|undefined }}
         */
        checkFeature: function checkFeature(featureId) {
            var feature = FEATURES[featureId];

            if (!feature) {
                return { allowed: false, reason: 'Unknown feature: ' + featureId };
            }

            // Pro features require a pro tier
            if (feature.tier === TIERS.PRO && _currentTier !== TIERS.PRO) {
                return {
                    allowed: false,
                    reason:  'Requires Pro upgrade',
                    feature: feature
                };
            }

            return { allowed: true, feature: feature };
        },

        /**
         * Retrieve the full definition object for a single feature.
         * @param {string} featureId
         * @returns {Object|null}
         */
        getFeature: function getFeature(featureId) {
            return FEATURES[featureId] || null;
        },

        /**
         * Return an array of feature objects that belong to the given tier.
         * @param {string} tier - 'free' or 'pro'
         * @returns {Array<Object>}
         */
        getFeaturesByTier: function getFeaturesByTier(tier) {
            var results = [];
            var keys = Object.keys(FEATURES);
            for (var i = 0; i < keys.length; i++) {
                if (FEATURES[keys[i]].tier === tier) {
                    results.push(FEATURES[keys[i]]);
                }
            }
            return results;
        },

        /**
         * Return all feature definitions as an array.
         * @returns {Array<Object>}
         */
        getAllFeatures: function getAllFeatures() {
            var results = [];
            var keys = Object.keys(FEATURES);
            for (var i = 0; i < keys.length; i++) {
                results.push(FEATURES[keys[i]]);
            }
            return results;
        },

        /**
         * Group features by category.
         * @returns {Object<string, Array<Object>>}
         *   e.g. { core: [...], export: [...], profiles: [...] }
         */
        getFeaturesByCategory: function getFeaturesByCategory() {
            var grouped = {};
            var keys = Object.keys(FEATURES);
            for (var i = 0; i < keys.length; i++) {
                var feature = FEATURES[keys[i]];
                var cat = feature.category;
                if (!grouped[cat]) {
                    grouped[cat] = [];
                }
                grouped[cat].push(feature);
            }
            return grouped;
        },

        /**
         * Build a comparison table suitable for rendering a Free-vs-Pro grid.
         *
         * Returns an array of objects, one per feature:
         * {
         *   id:          string,
         *   name:        string,
         *   description: string,
         *   category:    string,
         *   free:        string,   // e.g. 'Unlimited', '25/day', '2 profiles', '--'
         *   pro:         string    // e.g. 'Unlimited', 'Unlimited', 'Unlimited', 'Included'
         * }
         *
         * @returns {Array<Object>}
         */
        getComparisonTable: function getComparisonTable() {
            var table = [];
            var keys = Object.keys(FEATURES);

            for (var i = 0; i < keys.length; i++) {
                var f = FEATURES[keys[i]];
                var freeLabel;
                var proLabel;

                if (f.tier === TIERS.PRO) {
                    // Pro-only features
                    freeLabel = '--';
                    proLabel  = 'Included';
                } else if (f.limit === null) {
                    // Free with no limit
                    freeLabel = 'Unlimited';
                    proLabel  = 'Unlimited';
                } else {
                    // Free with a limit
                    proLabel = 'Unlimited';
                    if (f.limit.period === 'daily') {
                        freeLabel = f.limit.count + '/day';
                    } else {
                        // Resource cap (e.g. "2 profiles")
                        freeLabel = String(f.limit.count);
                    }
                }

                table.push({
                    id:          f.id,
                    name:        f.name,
                    description: f.description,
                    category:    f.category,
                    free:        freeLabel,
                    pro:         proLabel
                });
            }

            return table;
        }
    };

    // ========================================================================
    // Expose Globals
    // ========================================================================

    if (typeof self !== 'undefined') {
        self.FeatureManager = featureManager;
        self.FEATURES       = FEATURES;
        self.TIERS           = TIERS;
    }
    if (typeof window !== 'undefined') {
        window.FeatureManager = featureManager;
        window.FEATURES       = FEATURES;
        window.TIERS           = TIERS;
    }

})();
