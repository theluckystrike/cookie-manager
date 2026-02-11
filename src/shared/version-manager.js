/**
 * Cookie Manager - Version Release Management
 * Handles version info, feature flags, update tracking, release notes,
 * and changelog generation. All data stays 100% local via chrome.storage.local.
 */
(function () {
    'use strict';

    /* ── Storage Helpers ──────────────────────────────────────────── */

    function storageGet(keys) {
        return new Promise(function (resolve) {
            try {
                chrome.storage.local.get(keys, function (result) {
                    resolve(chrome.runtime.lastError ? {} : (result || {}));
                });
            } catch (e) { resolve({}); }
        });
    }

    function storageSet(data) {
        return new Promise(function (resolve) {
            try {
                chrome.storage.local.set(data, function () {
                    if (chrome.runtime.lastError) {
                        console.warn('[VersionManager] storage.set error:', chrome.runtime.lastError.message);
                    }
                    resolve();
                });
            } catch (e) {
                console.warn('[VersionManager] storage.set exception:', e);
                resolve();
            }
        });
    }

    function storageRemove(keys) {
        return new Promise(function (resolve) {
            try {
                chrome.storage.local.remove(keys, function () {
                    if (chrome.runtime.lastError) {
                        console.warn('[VersionManager] storage.remove error:', chrome.runtime.lastError.message);
                    }
                    resolve();
                });
            } catch (e) { resolve(); }
        });
    }

    /* ── Constants ─────────────────────────────────────────────────── */

    var OVERRIDES_KEY = '_ff_overrides';
    var UPDATE_HISTORY_KEY = '_update_history';
    var INSTALL_DATE_KEY = '_install_date';
    var MAX_UPDATE_HISTORY = 20;

    /* ── Default Feature Flags ─────────────────────────────────────── */

    var _flags = {
        'enhanced-search': { enabled: true, description: 'Enhanced search with filters' },
        'jwt-decoder': { enabled: true, description: 'JWT token decoder in cookie editor' },
        'export-json': { enabled: true, description: 'Export cookies as JSON' },
        'keyboard-shortcuts': { enabled: true, description: 'Keyboard shortcuts for quick actions' },
        'dark-mode-auto': { enabled: false, description: 'Auto dark mode based on system preference' }
    };

    /* ── Release Notes ─────────────────────────────────────────────── */

    var _releaseNotes = {
        '1.0.0': 'Initial release \u2014 cookie viewing, editing, and management'
    };

    /* ── Cached Overrides (loaded from storage during init) ────────── */

    var _overrides = {};

    /* ── Internal Helpers ──────────────────────────────────────────── */

    /** Safely retrieve the extension manifest. */
    function getManifest() {
        if (typeof chrome !== 'undefined' &&
            typeof chrome.runtime !== 'undefined' &&
            typeof chrome.runtime.getManifest === 'function') {
            return chrome.runtime.getManifest();
        }
        return {};
    }

    /** Parse a semver string into an array of numbers. '1.2.3' -> [1,2,3] */
    function parseVersion(v) {
        if (typeof v !== 'string') { return [0, 0, 0]; }
        var parts = v.split('.');
        var result = [];
        for (var i = 0; i < parts.length; i++) {
            var num = parseInt(parts[i], 10);
            result.push(isNaN(num) ? 0 : num);
        }
        while (result.length < 3) { result.push(0); }
        return result;
    }

    /* ── Public API ────────────────────────────────────────────────── */

    var VersionManager = {

        _flags: _flags,
        _releaseNotes: _releaseNotes,

        // ── 1. Version Info ──────────────────────────────────────────

        /** Returns the manifest version string (e.g. '1.0.0'). */
        getVersion: function () {
            var manifest = getManifest();
            return manifest.version || '0.0.0';
        },

        /** Returns version_name if available, otherwise version. */
        getDisplayVersion: function () {
            var manifest = getManifest();
            return manifest.version_name || manifest.version || '0.0.0';
        },

        /** Checks if version_name contains alpha, beta, or rc. */
        isPreRelease: function () {
            var display = this.getDisplayVersion();
            var lower = display.toLowerCase();
            return lower.indexOf('alpha') !== -1 ||
                   lower.indexOf('beta') !== -1 ||
                   lower.indexOf('rc') !== -1;
        },

        /**
         * Compare two semver version strings.
         * @returns {number} -1 if v1 < v2, 0 if equal, 1 if v1 > v2
         */
        compareVersions: function (v1, v2) {
            var a = parseVersion(v1);
            var b = parseVersion(v2);
            var len = Math.max(a.length, b.length);
            for (var i = 0; i < len; i++) {
                var av = i < a.length ? a[i] : 0;
                var bv = i < b.length ? b[i] : 0;
                if (av < bv) { return -1; }
                if (av > bv) { return 1; }
            }
            return 0;
        },

        /** Returns true if the current manifest version is newer than otherVersion. */
        isNewerThan: function (otherVersion) {
            var current = this.getVersion();
            return this.compareVersions(current, otherVersion) === 1;
        },

        // ── 2. Feature Flags ─────────────────────────────────────────

        /**
         * Check whether a feature flag is enabled.
         * Overrides take priority over defaults.
         */
        isFeatureEnabled: function (flagName) {
            if (_overrides.hasOwnProperty(flagName)) {
                return !!_overrides[flagName];
            }
            if (_flags.hasOwnProperty(flagName)) {
                return !!_flags[flagName].enabled;
            }
            return false;
        },

        /** Returns all flags with their current effective status. */
        getFlags: function () {
            var result = {};
            var keys = Object.keys(_flags);
            for (var i = 0; i < keys.length; i++) {
                var name = keys[i];
                var flag = _flags[name];
                var enabled = _overrides.hasOwnProperty(name)
                    ? !!_overrides[name]
                    : !!flag.enabled;
                result[name] = {
                    enabled: enabled,
                    description: flag.description,
                    overridden: _overrides.hasOwnProperty(name)
                };
            }
            return result;
        },

        /** Store a feature flag override in chrome.storage.local. */
        setOverride: function (flagName, enabled) {
            _overrides[flagName] = !!enabled;
            var data = {};
            data[OVERRIDES_KEY] = _overrides;
            return storageSet(data);
        },

        /** Remove all feature flag overrides from storage. */
        clearOverrides: function () {
            _overrides = {};
            return storageRemove(OVERRIDES_KEY);
        },

        /** Load feature flag overrides from chrome.storage.local (called during init). */
        loadOverrides: function () {
            return storageGet(OVERRIDES_KEY).then(function (result) {
                var stored = result[OVERRIDES_KEY];
                if (stored && typeof stored === 'object') {
                    _overrides = stored;
                } else {
                    _overrides = {};
                }
            });
        },

        // ── 3. Update Tracking ───────────────────────────────────────

        /**
         * Store an update event in the _update_history array.
         * Keeps a maximum of 20 entries.
         */
        trackUpdate: function (previousVersion, currentVersion) {
            return storageGet(UPDATE_HISTORY_KEY).then(function (result) {
                var history = Array.isArray(result[UPDATE_HISTORY_KEY])
                    ? result[UPDATE_HISTORY_KEY]
                    : [];

                history.push({
                    from: previousVersion,
                    to: currentVersion,
                    timestamp: Date.now()
                });

                // Trim to max entries, keeping the most recent
                if (history.length > MAX_UPDATE_HISTORY) {
                    history = history.slice(history.length - MAX_UPDATE_HISTORY);
                }

                var data = {};
                data[UPDATE_HISTORY_KEY] = history;
                return storageSet(data);
            });
        },

        /** Returns the update history array from storage. */
        getUpdateHistory: function () {
            return storageGet(UPDATE_HISTORY_KEY).then(function (result) {
                return Array.isArray(result[UPDATE_HISTORY_KEY])
                    ? result[UPDATE_HISTORY_KEY]
                    : [];
            });
        },

        /**
         * Handle chrome.runtime.onInstalled events.
         * Tracks updates and stores install date for new installs.
         */
        onInstalled: function (details) {
            var mgr = this;

            if (!details || typeof details !== 'object') {
                return Promise.resolve();
            }

            if (details.reason === 'update') {
                var previousVersion = details.previousVersion || '0.0.0';
                var currentVersion = mgr.getVersion();
                return mgr.trackUpdate(previousVersion, currentVersion);
            }

            if (details.reason === 'install') {
                var data = {};
                data[INSTALL_DATE_KEY] = Date.now();
                return storageSet(data);
            }

            return Promise.resolve();
        },

        // ── 4. Release Notes ─────────────────────────────────────────

        /** Returns the release notes for a given version, or null. */
        getReleaseNotes: function (version) {
            if (_releaseNotes.hasOwnProperty(version)) {
                return _releaseNotes[version];
            }
            return null;
        },

        /** Returns the release notes for the current manifest version. */
        getLatestReleaseNotes: function () {
            var currentVersion = this.getVersion();
            return this.getReleaseNotes(currentVersion);
        },

        // ── 5. Changelog Generation Helper ───────────────────────────

        /** Generate a formatted changelog summarizing version, features, and flags. */
        generateChangelog: function () {
            var lines = [];
            var version = this.getVersion();
            var displayVersion = this.getDisplayVersion();

            lines.push('Cookie Manager v' + displayVersion);
            lines.push('========================================');
            lines.push('');

            if (this.isPreRelease()) {
                lines.push('** PRE-RELEASE BUILD **');
                lines.push('');
            }

            // Release notes for current version
            var notes = this.getReleaseNotes(version);
            if (notes) {
                lines.push('Release Notes:');
                lines.push('  ' + notes);
                lines.push('');
            }

            // All known release notes (sorted newest first)
            var noteVersions = Object.keys(_releaseNotes);
            if (noteVersions.length > 0) {
                lines.push('Version History:');
                var mgr = this;
                noteVersions.sort(function (a, b) {
                    return mgr.compareVersions(b, a);
                });
                for (var i = 0; i < noteVersions.length; i++) {
                    lines.push('  v' + noteVersions[i] + ' - ' + _releaseNotes[noteVersions[i]]);
                }
                lines.push('');
            }

            // Feature flags summary
            var flags = this.getFlags();
            var flagNames = Object.keys(flags);
            if (flagNames.length > 0) {
                lines.push('Feature Flags:');
                for (var j = 0; j < flagNames.length; j++) {
                    var name = flagNames[j];
                    var flag = flags[name];
                    var status = flag.enabled ? 'ON' : 'OFF';
                    var override = flag.overridden ? ' (override)' : '';
                    lines.push('  [' + status + '] ' + name + ' - ' + flag.description + override);
                }
                lines.push('');
            }

            lines.push('Generated: ' + new Date().toISOString());
            return lines.join('\n');
        },

        // ── Initialization ───────────────────────────────────────────

        /** Initialize the VersionManager by loading overrides from storage. */
        init: function () {
            return this.loadOverrides();
        }
    };

    /* ── Expose on both self and window ────────────────────────────── */

    var root = typeof self !== 'undefined' ? self : (typeof window !== 'undefined' ? window : {});
    root.VersionManager = VersionManager;
})();
