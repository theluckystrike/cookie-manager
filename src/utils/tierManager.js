// Cookie Manager - Tier Manager
// Based on competitive research: EditThisCookie, Cookie-Editor, Easy Local Storage
// Scoring: Acquisition(25%) + Habit(20%) + Upgrade(25%) + Differentiation(15%) + Cost(15%)

/**
 * PROMPT 03: Feature Value Scoring (5 Dimensions)
 * Cookie managers mostly free - monetize via bulk/export/sync
 */
const FEATURE_SCORES = {
    // Feature: [Acquisition, Habit, Upgrade, Differentiation, Cost] => Total
    viewCookies: [10, 8, 2, 3, 10],   // 33 → FREE (core)
    editCookies: [9, 7, 3, 4, 10],    // 33 → FREE (core)
    deleteCookies: [8, 6, 2, 3, 10],    // 29 → FREE 
    searchCookies: [7, 8, 3, 5, 10],    // 33 → FREE
    exportSingle: [5, 4, 6, 4, 10],    // 29 → FREE (one at a time)
    exportBulk: [4, 3, 9, 6, 10],    // 32 → PRO (bulk = value)
    importCookies: [5, 5, 8, 5, 10],    // 33 → PRO
    cookieProfiles: [3, 6, 9, 8, 6],     // 32 → PRO (Swap My Cookies pattern)
    syncAcrossDevices: [5, 4, 10, 7, 3],    // 29 → PRO (#1 upgrade driver)
    protectedCookies: [4, 5, 7, 7, 10],    // 33 → PRO
    cookieAlerts: [3, 4, 6, 6, 8],     // 27 → PRO
};

const TIER_CONFIG = {
    free: {
        name: 'Free',
        limits: {
            maxCookiesExport: 10,        // Export 10 at a time free
            maxProfiles: 1,              // One profile free
            syncEnabled: false,
            exportFormats: ['txt'],      // Basic export only
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

class TierManager {
    constructor() {
        this.currentTier = 'free';
        this.usageCache = null;
    }

    async init() {
        const stored = await chrome.storage.sync.get(['tier', 'proExpiry']);
        if (stored.tier === 'pro' && stored.proExpiry > Date.now()) {
            this.currentTier = 'pro';
        }
        return this;
    }

    getTier() {
        return this.currentTier;
    }

    getConfig() {
        return TIER_CONFIG[this.currentTier];
    }

    getLimits() {
        return TIER_CONFIG[this.currentTier].limits;
    }

    getFeatures() {
        return TIER_CONFIG[this.currentTier].features;
    }

    canUseFeature(featureName) {
        const features = this.getFeatures();
        const value = features[featureName];
        return value === true;
    }

    isFeaturePreview(featureName) {
        const features = this.getFeatures();
        const value = features[featureName];
        return value === 'preview' || value === 'limited';
    }

    async checkExportLimit(count) {
        if (this.currentTier === 'pro') return true;
        const limits = this.getLimits();
        return count <= limits.maxCookiesExport;
    }

    async checkProfileLimit() {
        if (this.currentTier === 'pro') return true;
        const limits = this.getLimits();
        const stored = await chrome.storage.local.get(['cookieProfiles']);
        const profiles = stored.cookieProfiles || [];
        return profiles.length < limits.maxProfiles;
    }

    getUpgradeUrl() {
        return 'https://zovo.one/pro?ref=cookie-manager';
    }

    getPricing() {
        return TIER_CONFIG.pro.price;
    }
}

// Export for Chrome extension
const tierManager = new TierManager();
window.tierManager = tierManager;
window.TierManager = TierManager;
window.TIER_CONFIG = TIER_CONFIG;
window.FEATURE_SCORES = FEATURE_SCORES;

