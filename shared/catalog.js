/**
 * Zovo Extension Catalog
 * For cross-promotion between Zovo extensions
 */

const ZOVO_CATALOG = [
    {
        id: 'tab-suspender-pro',
        name: 'Tab Suspender Pro',
        tagline: 'Save memory, suspend inactive tabs',
        icon: 'https://zovo.one/icons/tab-suspender.png',
        storeUrl: 'https://chrome.google.com/webstore/detail/tab-suspender-pro',
        zovoUrl: 'https://zovo.one/extensions/tab-suspender-pro',
        category: 'productivity',
        featured: true
    },
    {
        id: 'clipboard-history-pro',
        name: 'Clipboard History Pro',
        tagline: 'Never lose copied text again',
        icon: 'https://zovo.one/icons/clipboard.png',
        storeUrl: 'https://chrome.google.com/webstore/detail/clipboard-history-pro',
        zovoUrl: 'https://zovo.one/extensions/clipboard-history-pro',
        category: 'productivity',
        featured: true
    },
    {
        id: 'cookie-manager',
        name: 'Cookie Manager',
        tagline: 'View, edit, export cookies',
        icon: 'https://zovo.one/icons/cookie-manager.png',
        storeUrl: 'https://chrome.google.com/webstore/detail/cookie-manager',
        zovoUrl: 'https://zovo.one/extensions/cookie-manager',
        category: 'developer',
        featured: true
    },
    {
        id: 'json-formatter-pro',
        name: 'JSON Formatter Pro',
        tagline: 'Format and validate JSON',
        icon: 'https://zovo.one/icons/json-formatter.png',
        storeUrl: 'https://chrome.google.com/webstore/detail/json-formatter-pro',
        zovoUrl: 'https://zovo.one/extensions/json-formatter-pro',
        category: 'developer',
        featured: true
    },
    {
        id: 'form-filler-pro',
        name: 'Form Filler Pro',
        tagline: 'Auto-fill forms with custom profiles',
        icon: 'https://zovo.one/icons/form-filler.png',
        storeUrl: 'https://chrome.google.com/webstore/detail/form-filler-pro',
        zovoUrl: 'https://zovo.one/extensions/form-filler-pro',
        category: 'productivity',
        featured: true
    },
    {
        id: 'api-testing-lite',
        name: 'API Testing Lite',
        tagline: 'Lightweight REST API testing',
        icon: 'https://zovo.one/icons/api-testing.png',
        storeUrl: 'https://chrome.google.com/webstore/detail/api-testing-lite',
        zovoUrl: 'https://zovo.one/extensions/api-testing-lite',
        category: 'developer',
        featured: true
    }
];

/**
 * Get recommended extensions (excluding current)
 */
function getRecommendations(currentExtensionId, limit = 3) {
    return ZOVO_CATALOG
        .filter(ext => ext.id !== currentExtensionId)
        .filter(ext => ext.featured)
        .slice(0, limit);
}

/**
 * Get all extensions in catalog
 */
function getCatalog() {
    return ZOVO_CATALOG;
}

/**
 * Get extension by ID
 */
function getExtension(extensionId) {
    return ZOVO_CATALOG.find(ext => ext.id === extensionId);
}

/**
 * Generate referral URL
 */
function getReferralUrl(extensionId, source = 'cross_promo') {
    return `https://zovo.one?ref=${extensionId}&source=${source}`;
}

// Export for use
if (typeof window !== 'undefined') {
    window.ZovoCatalog = {
        getRecommendations,
        getCatalog,
        getExtension,
        getReferralUrl
    };
}
