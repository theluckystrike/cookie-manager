/**
 * Storage Utility
 * Handles extension settings persistence
 */

const DEFAULTS = {
    readOnlyMode: false,
    showHttpOnly: true,
    showSecure: true,
    showSessionCookies: true,
    defaultExportFormat: 'json',
    theme: 'system', // 'light' | 'dark' | 'system'
    protectedDomains: [],
    sortBy: 'name', // 'name' | 'domain' | 'expiry'
    sortOrder: 'asc' // 'asc' | 'desc'
};

export const Storage = {
    /**
     * Get all settings
     * @returns {Promise<Object>}
     */
    async getAll() {
        try {
            const result = await chrome.storage.local.get(DEFAULTS);
            return { ...DEFAULTS, ...result };
        } catch (error) {
            console.error('[Storage] Error getting settings:', error);
            return DEFAULTS;
        }
    },

    /**
     * Get a specific setting
     * @param {string} key
     * @returns {Promise<any>}
     */
    async get(key) {
        try {
            const defaultValue = DEFAULTS[key];
            const result = await chrome.storage.local.get({ [key]: defaultValue });
            return result[key];
        } catch (error) {
            console.error('[Storage] Error getting setting:', error);
            return DEFAULTS[key];
        }
    },

    /**
     * Set a setting
     * @param {string} key
     * @param {any} value
     * @returns {Promise<void>}
     */
    async set(key, value) {
        try {
            await chrome.storage.local.set({ [key]: value });
        } catch (error) {
            console.error('[Storage] Error setting value:', error);
        }
    },

    /**
     * Set multiple settings at once
     * @param {Object} settings
     * @returns {Promise<void>}
     */
    async setMultiple(settings) {
        try {
            await chrome.storage.local.set(settings);
        } catch (error) {
            console.error('[Storage] Error setting multiple values:', error);
        }
    },

    /**
     * Toggle boolean setting
     * @param {string} key
     * @returns {Promise<boolean>} - New value
     */
    async toggle(key) {
        const current = await this.get(key);
        const newValue = !current;
        await this.set(key, newValue);
        return newValue;
    },

    /**
     * Add domain to protected list
     * @param {string} domain
     * @returns {Promise<void>}
     */
    async protectDomain(domain) {
        const domains = await this.get('protectedDomains');
        if (!domains.includes(domain)) {
            domains.push(domain);
            await this.set('protectedDomains', domains);
        }
    },

    /**
     * Remove domain from protected list
     * @param {string} domain
     * @returns {Promise<void>}
     */
    async unprotectDomain(domain) {
        const domains = await this.get('protectedDomains');
        const filtered = domains.filter(d => d !== domain);
        await this.set('protectedDomains', filtered);
    },

    /**
     * Check if domain is protected
     * @param {string} domain
     * @returns {Promise<boolean>}
     */
    async isProtected(domain) {
        const domains = await this.get('protectedDomains');
        return domains.some(d => domain.endsWith(d));
    },

    /**
     * Reset to defaults
     * @returns {Promise<void>}
     */
    async reset() {
        try {
            await chrome.storage.local.clear();
            await chrome.storage.local.set(DEFAULTS);
        } catch (error) {
            console.error('[Storage] Error resetting:', error);
        }
    },

    /**
     * Export all settings as JSON
     * @returns {Promise<string>}
     */
    async exportSettings() {
        const settings = await this.getAll();
        return JSON.stringify(settings, null, 2);
    },

    /**
     * Import settings from JSON
     * @param {string} json
     * @returns {Promise<boolean>}
     */
    async importSettings(json) {
        try {
            const settings = JSON.parse(json);
            await this.setMultiple(settings);
            return true;
        } catch (error) {
            console.error('[Storage] Error importing settings:', error);
            return false;
        }
    }
};
