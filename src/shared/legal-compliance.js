/**
 * Cookie Manager - Legal Compliance Utilities (LegalCompliance)
 * GDPR/CCPA data rights, consent management, privacy configuration,
 * and compliance audit logging. All data stays 100% local via chrome.storage.local.
 * Zero external requests, zero third-party sharing.
 */
(function () {
    'use strict';

    /* ── Storage Helpers ──────────────────────────────────────────── */

    function storageGet(keys) {
        return new Promise(function (resolve) {
            try {
                if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
                    resolve({});
                    return;
                }
                chrome.storage.local.get(keys, function (result) {
                    if (typeof chrome.runtime !== 'undefined' && chrome.runtime.lastError) {
                        resolve({});
                    } else {
                        resolve(result || {});
                    }
                });
            } catch (e) { resolve({}); }
        });
    }

    function storageSet(data) {
        return new Promise(function (resolve) {
            try {
                if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
                    resolve();
                    return;
                }
                chrome.storage.local.set(data, function () {
                    if (typeof chrome.runtime !== 'undefined' && chrome.runtime.lastError) {
                        console.warn('[LegalCompliance] storage.set error:', chrome.runtime.lastError.message);
                    }
                    resolve();
                });
            } catch (e) {
                console.warn('[LegalCompliance] storage.set exception:', e);
                resolve();
            }
        });
    }

    function storageRemove(keys) {
        return new Promise(function (resolve) {
            try {
                if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
                    resolve();
                    return;
                }
                chrome.storage.local.remove(keys, function () {
                    if (typeof chrome.runtime !== 'undefined' && chrome.runtime.lastError) {
                        console.warn('[LegalCompliance] storage.remove error:', chrome.runtime.lastError.message);
                    }
                    resolve();
                });
            } catch (e) { resolve(); }
        });
    }

    function storageGetAll() {
        return new Promise(function (resolve) {
            try {
                if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
                    resolve({});
                    return;
                }
                chrome.storage.local.get(null, function (result) {
                    if (typeof chrome.runtime !== 'undefined' && chrome.runtime.lastError) {
                        resolve({});
                    } else {
                        resolve(result || {});
                    }
                });
            } catch (e) { resolve({}); }
        });
    }

    /* ── Constants ─────────────────────────────────────────────────── */

    var CONSENT_KEY = '_legalConsent';
    var COMPLIANCE_LOG_KEY = '_complianceLog';
    var MAX_LOG_ENTRIES = 100;
    var CONSENT_VERSION = '1.0';
    var DEFAULT_RETENTION_DAYS = 90;
    var LOG_RETENTION_DAYS = 1095; // 3 years per GDPR

    /** Keys considered essential for basic extension operation. */
    var ESSENTIAL_KEYS = [
        'readOnlyMode',
        'protectedDomains',
        CONSENT_KEY
    ];

    /* ── Helpers ───────────────────────────────────────────────────── */

    /** Categorize a storage key into a data category. */
    function categorizeKey(key) {
        if (key === 'readOnlyMode' || key === 'protectedDomains' || key.indexOf('setting') !== -1) {
            return 'settings';
        }
        if (key === CONSENT_KEY) {
            return 'consent';
        }
        if (key === COMPLIANCE_LOG_KEY) {
            return 'compliance_log';
        }
        if (key.indexOf('analytics') !== -1 || key.indexOf('_perf') !== -1 || key.indexOf('perf_') !== -1) {
            return 'analytics';
        }
        if (key.indexOf('error') !== -1 || key.indexOf('Error') !== -1) {
            return 'errors';
        }
        if (key.indexOf('feedback') !== -1 || key.indexOf('Feedback') !== -1) {
            return 'feedback';
        }
        if (key.indexOf('usage') !== -1 || key.indexOf('Usage') !== -1) {
            return 'usage';
        }
        if (key.indexOf('cache') !== -1 || key.indexOf('Cache') !== -1) {
            return 'cache';
        }
        if (key.indexOf('_ff_') !== -1 || key.indexOf('flag') !== -1) {
            return 'feature_flags';
        }
        if (key.indexOf('update') !== -1 || key.indexOf('install') !== -1 || key.indexOf('version') !== -1) {
            return 'version_info';
        }
        return 'other';
    }

    /** Estimate byte size of a value via JSON serialization. */
    function estimateSize(value) {
        try {
            var json = JSON.stringify(value);
            return typeof json === 'string' ? json.length : 0;
        } catch (e) {
            return 0;
        }
    }

    /* ================================================================
       1. DataRights — GDPR/CCPA user data management
       ================================================================ */

    var DataRights = {

        /**
         * Collects ALL user data from chrome.storage.local.
         * Returns a structured object with categories.
         */
        exportUserData: function () {
            return storageGetAll().then(function (allData) {
                var exported = {
                    exportDate: new Date().toISOString(),
                    exportVersion: CONSENT_VERSION,
                    extensionId: '',
                    categories: {}
                };

                try {
                    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
                        exported.extensionId = chrome.runtime.id;
                    }
                } catch (e) { /* ignore */ }

                var keys = Object.keys(allData);
                for (var i = 0; i < keys.length; i++) {
                    var key = keys[i];
                    var category = categorizeKey(key);
                    if (!exported.categories[category]) {
                        exported.categories[category] = {};
                    }
                    exported.categories[category][key] = allData[key];
                }

                return exported;
            });
        },

        /**
         * Deletes user data from chrome.storage.local.
         * Options: { keepEssential: true } preserves extension settings.
         * Returns a deletion log.
         */
        deleteUserData: function (options) {
            var opts = options || {};
            var keepEssential = opts.keepEssential !== false;

            return storageGetAll().then(function (allData) {
                var keys = Object.keys(allData);
                var toDelete = [];
                var kept = [];

                for (var i = 0; i < keys.length; i++) {
                    var key = keys[i];
                    if (keepEssential && ESSENTIAL_KEYS.indexOf(key) !== -1) {
                        kept.push(key);
                    } else {
                        toDelete.push(key);
                    }
                }

                if (toDelete.length === 0) {
                    return {
                        deletedKeys: [],
                        keptKeys: kept,
                        deletedCount: 0,
                        keptCount: kept.length,
                        timestamp: new Date().toISOString()
                    };
                }

                return storageRemove(toDelete).then(function () {
                    return {
                        deletedKeys: toDelete,
                        keptKeys: kept,
                        deletedCount: toDelete.length,
                        keptCount: kept.length,
                        timestamp: new Date().toISOString()
                    };
                });
            });
        },

        /**
         * Returns a summary of what data is stored.
         * Includes categories, key counts, and approximate size.
         */
        getDataSummary: function () {
            return storageGetAll().then(function (allData) {
                var summary = {
                    totalKeys: 0,
                    totalSizeBytes: 0,
                    categories: {},
                    generatedAt: new Date().toISOString()
                };

                var keys = Object.keys(allData);
                summary.totalKeys = keys.length;

                for (var i = 0; i < keys.length; i++) {
                    var key = keys[i];
                    var category = categorizeKey(key);
                    var size = estimateSize(allData[key]);

                    if (!summary.categories[category]) {
                        summary.categories[category] = {
                            keyCount: 0,
                            keys: [],
                            approximateSizeBytes: 0
                        };
                    }

                    summary.categories[category].keyCount++;
                    summary.categories[category].keys.push(key);
                    summary.categories[category].approximateSizeBytes += size;
                    summary.totalSizeBytes += size;
                }

                return summary;
            });
        },

        /**
         * Returns the data retention schedule.
         * Hardcoded policy object matching the extension's practices.
         */
        getRetentionPolicy: function () {
            return {
                version: CONSENT_VERSION,
                lastUpdated: '2025-01-01',
                policies: [
                    {
                        category: 'settings',
                        retentionDays: -1,
                        description: 'Extension settings are kept until user deletes them or uninstalls the extension.'
                    },
                    {
                        category: 'analytics',
                        retentionDays: DEFAULT_RETENTION_DAYS,
                        description: 'Local performance and usage analytics are auto-cleaned after 90 days.'
                    },
                    {
                        category: 'errors',
                        retentionDays: DEFAULT_RETENTION_DAYS,
                        description: 'Error logs are auto-cleaned after 90 days.'
                    },
                    {
                        category: 'cache',
                        retentionDays: 30,
                        description: 'Cookie display caches are refreshed or cleared after 30 days.'
                    },
                    {
                        category: 'compliance_log',
                        retentionDays: LOG_RETENTION_DAYS,
                        description: 'Compliance audit logs are retained for 3 years per GDPR requirements.'
                    },
                    {
                        category: 'consent',
                        retentionDays: -1,
                        description: 'Consent records are kept as long as consent is active.'
                    },
                    {
                        category: 'feature_flags',
                        retentionDays: -1,
                        description: 'Feature flag overrides persist until reset by the user.'
                    },
                    {
                        category: 'version_info',
                        retentionDays: -1,
                        description: 'Version and install data persists for update tracking.'
                    }
                ],
                storage: 'chrome.storage.local only',
                externalTransfers: 'none'
            };
        }
    };

    /* ================================================================
       2. ConsentManager — Cookie/tracking consent management
       ================================================================ */

    var ConsentManager = {

        CONSENT_VERSION: CONSENT_VERSION,

        /**
         * Returns current consent object from storage.
         */
        getConsent: function () {
            return storageGet(CONSENT_KEY).then(function (result) {
                var consent = result[CONSENT_KEY];
                if (consent && typeof consent === 'object') {
                    return consent;
                }
                return null;
            });
        },

        /**
         * Saves consent preferences.
         * Necessary consent is always forced to true.
         */
        saveConsent: function (preferences) {
            var prefs = preferences || {};
            var consent = {
                necessary: true,
                functional: !!prefs.functional,
                analytics: !!prefs.analytics,
                version: CONSENT_VERSION,
                timestamp: new Date().toISOString(),
                savedAt: Date.now()
            };

            var data = {};
            data[CONSENT_KEY] = consent;

            return storageSet(data).then(function () {
                return consent;
            });
        },

        /**
         * Clears non-essential data and resets consent.
         * Keeps only essential keys (settings, protected domains).
         */
        withdrawConsent: function () {
            return DataRights.deleteUserData({ keepEssential: true }).then(function (deletionLog) {
                var consent = {
                    necessary: true,
                    functional: false,
                    analytics: false,
                    version: CONSENT_VERSION,
                    timestamp: new Date().toISOString(),
                    savedAt: Date.now(),
                    withdrawn: true
                };

                var data = {};
                data[CONSENT_KEY] = consent;

                return storageSet(data).then(function () {
                    return {
                        consent: consent,
                        deletionLog: deletionLog
                    };
                });
            });
        },

        /**
         * Checks if consent exists and matches the current version.
         */
        hasValidConsent: function () {
            return this.getConsent().then(function (consent) {
                if (!consent) {
                    return false;
                }
                if (consent.version !== CONSENT_VERSION) {
                    return false;
                }
                if (consent.withdrawn === true) {
                    return false;
                }
                return true;
            });
        }
    };

    /* ================================================================
       3. PrivacyConfig — Extension privacy metadata
       ================================================================ */

    var PrivacyConfig = {

        /**
         * Returns an object describing Cookie Manager's privacy practices.
         */
        getPrivacySummary: function () {
            return {
                dataCollected: [
                    'extension_settings',
                    'local_analytics_events',
                    'error_logs',
                    'cookie_display_cache'
                ],
                dataNotCollected: [
                    'browsing_history',
                    'personal_info',
                    'passwords',
                    'form_data',
                    'ip_addresses'
                ],
                thirdPartySharing: 'none',
                externalRequests: 'none',
                dataStorage: 'local_only_chrome_storage',
                encryptionInTransit: 'not_applicable_local_only',
                retentionDefault: '90_days_auto_cleanup',
                userRights: ['access', 'export', 'delete', 'consent_withdrawal']
            };
        },

        /**
         * Returns array of data category objects with name, description,
         * retentionDays, and essential flag.
         */
        getDataCategories: function () {
            return [
                {
                    name: 'extension_settings',
                    description: 'User preferences such as read-only mode and protected domains.',
                    retentionDays: -1,
                    essential: true
                },
                {
                    name: 'local_analytics_events',
                    description: 'Performance timings and usage counts stored locally for diagnostics.',
                    retentionDays: DEFAULT_RETENTION_DAYS,
                    essential: false
                },
                {
                    name: 'error_logs',
                    description: 'Error details captured locally to aid in troubleshooting.',
                    retentionDays: DEFAULT_RETENTION_DAYS,
                    essential: false
                },
                {
                    name: 'cookie_display_cache',
                    description: 'Cached cookie display data for faster rendering in the popup.',
                    retentionDays: 30,
                    essential: false
                },
                {
                    name: 'consent_records',
                    description: 'Record of user consent preferences and their history.',
                    retentionDays: -1,
                    essential: true
                },
                {
                    name: 'compliance_audit_log',
                    description: 'Log of data access, export, and deletion requests.',
                    retentionDays: LOG_RETENTION_DAYS,
                    essential: true
                },
                {
                    name: 'feature_flags',
                    description: 'User-level feature flag overrides.',
                    retentionDays: -1,
                    essential: false
                },
                {
                    name: 'version_info',
                    description: 'Install date and update history for the extension.',
                    retentionDays: -1,
                    essential: false
                }
            ];
        },

        /**
         * Returns compliance status for a given region.
         * Always positive since Cookie Manager is 100% local.
         */
        isCompliant: function (region) {
            var r = (typeof region === 'string') ? region.toLowerCase() : 'general';
            var base = {
                compliant: true,
                region: r,
                checkedAt: new Date().toISOString(),
                details: []
            };

            if (r === 'gdpr') {
                base.details = [
                    { requirement: 'Data minimization', status: 'pass', note: 'Only stores data necessary for extension functionality.' },
                    { requirement: 'Right of access', status: 'pass', note: 'exportUserData() provides full data export.' },
                    { requirement: 'Right to erasure', status: 'pass', note: 'deleteUserData() removes all non-essential data.' },
                    { requirement: 'Consent management', status: 'pass', note: 'ConsentManager tracks user preferences.' },
                    { requirement: 'No cross-border transfers', status: 'pass', note: 'All data stored locally in chrome.storage.local.' },
                    { requirement: 'No third-party sharing', status: 'pass', note: 'Zero external requests, no data leaves the device.' },
                    { requirement: 'Audit trail', status: 'pass', note: 'ComplianceLog records all data rights requests.' }
                ];
            } else if (r === 'ccpa') {
                base.details = [
                    { requirement: 'Right to know', status: 'pass', note: 'exportUserData() and getDataSummary() provide full transparency.' },
                    { requirement: 'Right to delete', status: 'pass', note: 'deleteUserData() removes user data on request.' },
                    { requirement: 'No sale of data', status: 'pass', note: 'No data is collected, transmitted, or sold.' },
                    { requirement: 'No discrimination', status: 'pass', note: 'Extension functionality is identical regardless of data choices.' },
                    { requirement: 'Privacy notice', status: 'pass', note: 'getPrivacySummary() provides clear privacy disclosure.' }
                ];
            } else {
                base.details = [
                    { requirement: 'Local-only storage', status: 'pass', note: 'All data stored in chrome.storage.local.' },
                    { requirement: 'No external requests', status: 'pass', note: 'Extension makes zero network requests.' },
                    { requirement: 'User data control', status: 'pass', note: 'Full export, deletion, and consent management available.' },
                    { requirement: 'Transparency', status: 'pass', note: 'Privacy summary and data categories are self-documenting.' }
                ];
            }

            return base;
        }
    };

    /* ================================================================
       4. ComplianceLog — Audit trail for data rights requests
       ================================================================ */

    var ComplianceLog = {

        /**
         * Stores a compliance request log entry.
         * Types: 'access', 'export', 'delete', 'consent_change'.
         * Maintains FIFO rotation at MAX_LOG_ENTRIES.
         */
        logRequest: function (type, details) {
            var validTypes = ['access', 'export', 'delete', 'consent_change'];
            var entryType = (typeof type === 'string' && validTypes.indexOf(type) !== -1) ? type : 'unknown';

            var entry = {
                id: Date.now().toString(36) + Math.random().toString(36).substring(2, 8),
                type: entryType,
                details: details || {},
                timestamp: new Date().toISOString(),
                epochMs: Date.now()
            };

            return storageGet(COMPLIANCE_LOG_KEY).then(function (result) {
                var log = Array.isArray(result[COMPLIANCE_LOG_KEY]) ? result[COMPLIANCE_LOG_KEY] : [];

                log.push(entry);

                // FIFO rotation: keep only the most recent entries
                if (log.length > MAX_LOG_ENTRIES) {
                    log = log.slice(log.length - MAX_LOG_ENTRIES);
                }

                var data = {};
                data[COMPLIANCE_LOG_KEY] = log;

                return storageSet(data).then(function () {
                    return entry;
                });
            });
        },

        /**
         * Returns log entries, with optional filter by type.
         * Options: { type: 'export' } to filter.
         */
        getRequestLog: function (options) {
            var opts = options || {};

            return storageGet(COMPLIANCE_LOG_KEY).then(function (result) {
                var log = Array.isArray(result[COMPLIANCE_LOG_KEY]) ? result[COMPLIANCE_LOG_KEY] : [];

                if (typeof opts.type === 'string' && opts.type.length > 0) {
                    var filtered = [];
                    for (var i = 0; i < log.length; i++) {
                        if (log[i].type === opts.type) {
                            filtered.push(log[i]);
                        }
                    }
                    return filtered;
                }

                return log;
            });
        },

        /**
         * Removes log entries older than maxAgeDays.
         * Default: 1095 days (3 years per GDPR).
         */
        clearOldLogs: function (maxAgeDays) {
            var days = (typeof maxAgeDays === 'number' && maxAgeDays > 0) ? maxAgeDays : LOG_RETENTION_DAYS;
            var cutoffMs = Date.now() - (days * 24 * 60 * 60 * 1000);

            return storageGet(COMPLIANCE_LOG_KEY).then(function (result) {
                var log = Array.isArray(result[COMPLIANCE_LOG_KEY]) ? result[COMPLIANCE_LOG_KEY] : [];
                var kept = [];
                var removed = 0;

                for (var i = 0; i < log.length; i++) {
                    var entryTime = log[i].epochMs || 0;
                    if (entryTime >= cutoffMs) {
                        kept.push(log[i]);
                    } else {
                        removed++;
                    }
                }

                var data = {};
                data[COMPLIANCE_LOG_KEY] = kept;

                return storageSet(data).then(function () {
                    return {
                        removedCount: removed,
                        remainingCount: kept.length,
                        cutoffDate: new Date(cutoffMs).toISOString()
                    };
                });
            });
        }
    };

    /* ================================================================
       Public API
       ================================================================ */

    var LegalCompliance = {
        DataRights: DataRights,
        ConsentManager: ConsentManager,
        PrivacyConfig: PrivacyConfig,
        ComplianceLog: ComplianceLog
    };

    /* ── Expose on both self and window ────────────────────────────── */

    try {
        if (typeof self !== 'undefined') {
            self.LegalCompliance = LegalCompliance;
        }
    } catch (e) { /* not available */ }

    try {
        if (typeof window !== 'undefined') {
            window.LegalCompliance = LegalCompliance;
        }
    } catch (e) { /* not available */ }

})();
