/**
 * Cookie Manager - Storage Schema & Migration System
 * Central source of truth for all storage keys, defaults, and migrations.
 * IIFE pattern - exposes StorageSchema globally.
 */
(function (root) {
    'use strict';

    var TAG = '[StorageSchema]';
    var QUOTA_LIMIT = 5242880; // chrome.storage.local default: 5 MB

    // -- Migrations: each entry migrates from (version - 1) to version ----------
    var MIGRATIONS = [
        { version: 1, description: 'Initial schema version stamp', migrate: function (d) {
            d._schemaVersion = 1;
            return d;
        }},
        { version: 2, description: 'Add usage counters and ensure all defaults', migrate: function (d) {
            var fill = { totalOperations: 0, editCount: 0, reviewPrompted: false,
                showHttpOnly: true, showSecure: true, showSessionCookies: true,
                defaultExportFormat: 'json', theme: 'system', sortBy: 'name', sortOrder: 'asc' };
            var keys = Object.keys(fill);
            for (var i = 0; i < keys.length; i++) {
                if (typeof d[keys[i]] === 'undefined') d[keys[i]] = fill[keys[i]];
            }
            d._schemaVersion = 2;
            return d;
        }}
    ];

    var CURRENT_VERSION = MIGRATIONS[MIGRATIONS.length - 1].version;

    // -- Complete schema with all keys and defaults -----------------------------
    var SCHEMA = {
        // Meta
        _schemaVersion: CURRENT_VERSION,
        installedAt: 0,
        installSource: '',
        onboardingComplete: false,
        // Settings
        readOnlyMode: false,
        protectedDomains: [],
        showHttpOnly: true,
        showSecure: true,
        showSessionCookies: true,
        defaultExportFormat: 'json',
        theme: 'system',
        sortBy: 'name',
        sortOrder: 'asc',
        // Monitoring
        errorLogs: [],
        analytics: [],
        debugMode: false,
        startupHistory: [],
        popupLoadTimes: [],
        // Usage
        totalOperations: 0,
        editCount: 0,
        reviewPrompted: false
    };

    // -- StorageSchema API ------------------------------------------------------
    var StorageSchema = {
        VERSION: CURRENT_VERSION,
        SCHEMA: Object.assign({}, SCHEMA),

        getAll: function () {
            try {
                return chrome.storage.local.get(SCHEMA).then(function (result) {
                    return Object.assign({}, SCHEMA, result);
                });
            } catch (err) {
                console.error(TAG, 'getAll failed', err);
                return Promise.resolve(Object.assign({}, SCHEMA));
            }
        },

        get: function (key) {
            try {
                var q = {};
                q[key] = SCHEMA.hasOwnProperty(key) ? SCHEMA[key] : undefined;
                return chrome.storage.local.get(q).then(function (r) { return r[key]; });
            } catch (err) {
                console.error(TAG, 'get failed', key, err);
                return Promise.resolve(SCHEMA.hasOwnProperty(key) ? SCHEMA[key] : undefined);
            }
        },

        set: function (data) {
            try {
                return chrome.storage.local.set(data);
            } catch (err) {
                console.error(TAG, 'set failed', err);
                return Promise.resolve();
            }
        },

        migrate: function () {
            return chrome.storage.local.get({ _schemaVersion: 0 }).then(function (result) {
                var stored = result._schemaVersion || 0;
                if (stored >= CURRENT_VERSION) {
                    console.debug(TAG, 'Schema up to date at v' + stored);
                    return { migrated: false, from: stored, to: stored };
                }
                console.debug(TAG, 'Migrating v' + stored + ' -> v' + CURRENT_VERSION);
                return chrome.storage.local.get(null).then(function (allData) {
                    var data = Object.assign({}, allData);
                    for (var i = 0; i < MIGRATIONS.length; i++) {
                        var m = MIGRATIONS[i];
                        if (m.version > stored) {
                            console.debug(TAG, 'Running v' + m.version + ': ' + m.description);
                            try { data = m.migrate(data); } catch (err) {
                                console.error(TAG, 'Migration v' + m.version + ' failed', err);
                                return { migrated: false, from: stored, to: stored, error: err.message };
                            }
                        }
                    }
                    // Fill any keys still missing from schema
                    var keys = Object.keys(SCHEMA);
                    for (var k = 0; k < keys.length; k++) {
                        if (typeof data[keys[k]] === 'undefined') data[keys[k]] = SCHEMA[keys[k]];
                    }
                    return chrome.storage.local.set(data).then(function () {
                        console.debug(TAG, 'Migration complete: v' + stored + ' -> v' + CURRENT_VERSION);
                        return { migrated: true, from: stored, to: CURRENT_VERSION };
                    });
                });
            }).catch(function (err) {
                console.error(TAG, 'migrate failed', err);
                return { migrated: false, error: err.message };
            });
        },

        getQuotaInfo: function () {
            try {
                return chrome.storage.local.getBytesInUse(null).then(function (bytes) {
                    return {
                        bytesInUse: bytes,
                        quota: QUOTA_LIMIT,
                        percentUsed: Math.round((bytes / QUOTA_LIMIT) * 10000) / 100,
                        bytesRemaining: QUOTA_LIMIT - bytes
                    };
                });
            } catch (err) {
                console.error(TAG, 'getQuotaInfo failed', err);
                return Promise.resolve({ bytesInUse: 0, quota: QUOTA_LIMIT, percentUsed: 0, bytesRemaining: QUOTA_LIMIT });
            }
        },

        reset: function () {
            try {
                var metaKeys = { _schemaVersion: CURRENT_VERSION, installedAt: 0, installSource: '' };
                return chrome.storage.local.get(metaKeys).then(function (meta) {
                    return chrome.storage.local.clear().then(function () {
                        return chrome.storage.local.set(Object.assign({}, SCHEMA, meta));
                    });
                });
            } catch (err) {
                console.error(TAG, 'reset failed', err);
                return Promise.resolve();
            }
        }
    };

    // Expose globally for both service worker (self) and window contexts
    root.StorageSchema = StorageSchema;
    if (typeof window !== 'undefined' && window !== root) {
        window.StorageSchema = StorageSchema;
    }
})(typeof self !== 'undefined' ? self : this);
