/**
 * Cookie Manager - Support Diagnostics
 * Collects system/extension info for troubleshooting and generates debug bundles.
 * All data stays local — zero external requests.
 *
 * Usage:
 *   SupportDiagnostics.getSystemInfo()
 *   SupportDiagnostics.getExtensionHealth().then(console.log);
 *   SupportDiagnostics.getStorageUsage().then(console.log);
 *   SupportDiagnostics.generateDebugBundle().then(console.log);
 *   SupportDiagnostics.classifyIssue('cookies not loading');
 *   SupportDiagnostics.quickCheck().then(console.log);
 */
(function () {
    'use strict';

    var STORAGE_QUOTA = 5242880; // 5 MB chrome.storage.local default quota

    var KNOWN_MODULES = [
        'BrowserCompat', 'SecurityHardener', 'MessageValidator',
        'FeedbackCollector', 'ChurnDetector', 'EngagementScore',
        'RetentionTriggers', 'MilestoneTracker', 'GrowthPrompts',
        'SwLifecycle', 'StorageSchema', 'PerformanceMonitor'
    ];

    /* ---- Issue classification keywords ---- */

    var ISSUE_KEYWORDS = {
        cookies: ['cookie', 'cookies', 'set cookie', 'delete cookie', 'clear cookie', 'domain', 'httponly', 'secure', 'samesite', 'expir', 'session cookie', 'persistent'],
        performance: ['slow', 'lag', 'freeze', 'memory', 'cpu', 'loading', 'hang', 'unresponsive', 'takes long', 'heavy', 'speed'],
        display: ['display', 'ui', 'layout', 'popup', 'render', 'blank', 'white screen', 'dark mode', 'font', 'icon', 'button', 'missing', 'invisible', 'overlap'],
        export: ['export', 'import', 'backup', 'restore', 'json', 'csv', 'download', 'file', 'save'],
        security: ['security', 'permission', 'access', 'unsafe', 'vulnerability', 'xss', 'injection', 'malicious', 'privacy', 'leak'],
        compatibility: ['browser', 'firefox', 'chrome', 'edge', 'safari', 'version', 'update', 'manifest', 'conflict', 'incompatible', 'not supported']
    };

    var SEVERITY_KEYWORDS = {
        critical: ['crash', 'data loss', 'security', 'vulnerability', 'corrupt', 'uninstall', 'broken completely'],
        high: ['not working', 'error', 'fail', 'broken', 'cannot', 'impossible', 'stuck'],
        medium: ['sometimes', 'intermittent', 'slow', 'delay', 'incorrect', 'wrong', 'unexpected'],
        low: ['minor', 'cosmetic', 'wish', 'suggestion', 'would be nice', 'small', 'typo']
    };

    var SUGGESTED_ACTIONS = {
        cookies: [
            'Clear the browser cache and reload the extension',
            'Check that the required host permissions are granted',
            'Verify the cookie domain and path values are correct',
            'Try disabling other cookie-related extensions temporarily'
        ],
        performance: [
            'Restart the browser to reset extension processes',
            'Check for excessive stored data in extension storage',
            'Disable other extensions to rule out conflicts',
            'Check system memory usage in Task Manager'
        ],
        display: [
            'Try toggling the browser zoom level to 100%',
            'Disable dark mode or custom themes temporarily',
            'Close and reopen the extension popup',
            'Check if hardware acceleration is causing render issues'
        ],
        export: [
            'Ensure the download directory is writable',
            'Check that the export file format is valid JSON',
            'Try exporting a smaller subset of cookies first',
            'Verify file permissions on the destination folder'
        ],
        security: [
            'Review the extension permissions in browser settings',
            'Ensure the extension was installed from the official store',
            'Check for any flagged content security policy violations',
            'Update the extension to the latest version'
        ],
        compatibility: [
            'Update the browser to the latest stable version',
            'Check the extension requirements for browser compatibility',
            'Try the extension in a fresh browser profile',
            'Verify that the manifest version is supported'
        ],
        general: [
            'Restart the browser and try again',
            'Check the extension error logs for details',
            'Try disabling and re-enabling the extension',
            'Generate a debug bundle and review the health summary'
        ]
    };

    /* ---- Helpers ---- */

    function safeGet(obj, path) {
        try {
            var parts = path.split('.');
            var cur = obj;
            for (var i = 0; i < parts.length; i++) {
                if (cur == null) { return undefined; }
                cur = cur[parts[i]];
            }
            return cur;
        } catch (e) {
            return undefined;
        }
    }

    function normalizeText(text) {
        return (typeof text === 'string' ? text : '').toLowerCase().trim();
    }

    function detectContext() {
        try {
            if (typeof ServiceWorkerGlobalScope !== 'undefined' &&
                typeof self !== 'undefined' &&
                self instanceof ServiceWorkerGlobalScope) {
                return 'service_worker';
            }
        } catch (e) { /* ignore */ }
        try {
            if (typeof window !== 'undefined' && typeof document !== 'undefined') {
                return 'popup';
            }
        } catch (e) { /* ignore */ }
        return 'unknown';
    }

    function parseBrowserFromUA(ua) {
        if (!ua || typeof ua !== 'string') { return { name: 'unknown', version: 'unknown' }; }
        var patterns = [
            { name: 'Vivaldi',  re: /Vivaldi\/([\d.]+)/i },
            { name: 'Opera',    re: /OPR\/([\d.]+)/i },
            { name: 'Edge',     re: /Edg\/([\d.]+)/i },
            { name: 'Firefox',  re: /Firefox\/([\d.]+)/i },
            { name: 'Safari',   re: /Version\/([\d.]+).*Safari/i },
            { name: 'Chrome',   re: /Chrome\/([\d.]+)/i }
        ];
        for (var i = 0; i < patterns.length; i++) {
            var m = ua.match(patterns[i].re);
            if (m) { return { name: patterns[i].name, version: m[1] }; }
        }
        return { name: 'unknown', version: 'unknown' };
    }

    /* ---- 1. System Info Collection ---- */

    function getSystemInfo() {
        var info = {
            browser: { name: 'unknown', version: 'unknown' },
            extensionVersion: 'unknown',
            manifestVersion: 0,
            platform: 'unknown',
            screen: { width: 0, height: 0 },
            language: 'unknown',
            context: detectContext()
        };

        try {
            if (typeof BrowserCompat !== 'undefined' && BrowserCompat && typeof BrowserCompat.getInfo === 'function') {
                var bcInfo = BrowserCompat.getInfo();
                info.browser.name = bcInfo.browser || 'unknown';
                info.browser.version = bcInfo.version || 'unknown';
            } else {
                var ua = (typeof navigator !== 'undefined' && navigator.userAgent) || '';
                var parsed = parseBrowserFromUA(ua);
                info.browser = parsed;
            }
        } catch (e) {
            /* keep defaults */
        }

        try {
            if (typeof chrome !== 'undefined' && chrome.runtime && typeof chrome.runtime.getManifest === 'function') {
                var manifest = chrome.runtime.getManifest();
                info.extensionVersion = (manifest && manifest.version) || 'unknown';
                info.manifestVersion = (manifest && manifest.manifest_version) || 0;
            }
        } catch (e) {
            /* keep defaults */
        }

        try {
            if (typeof navigator !== 'undefined') {
                info.platform = navigator.platform || 'unknown';
                info.language = navigator.language || 'unknown';
            }
        } catch (e) {
            /* keep defaults */
        }

        try {
            if (typeof screen !== 'undefined') {
                info.screen.width = screen.width || 0;
                info.screen.height = screen.height || 0;
            }
        } catch (e) {
            /* keep defaults */
        }

        return info;
    }

    /* ---- 2. Extension Health Summary ---- */

    function getExtensionHealth() {
        return new Promise(function (resolve) {
            try {
                if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
                    resolve({
                        errorCount: 0, lastError: null, startupCount: 0,
                        avgPopupLoadTime: 0, totalAnalyticsEvents: 0
                    });
                    return;
                }
                chrome.storage.local.get(
                    ['errorLogs', 'startupHistory', 'analytics', 'popupLoadTimes'],
                    function (data) {
                        try {
                            if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.lastError) {
                                resolve({
                                    errorCount: 0, lastError: null, startupCount: 0,
                                    avgPopupLoadTime: 0, totalAnalyticsEvents: 0
                                });
                                return;
                            }

                            var result = data || {};
                            var errorLogs = Array.isArray(result.errorLogs) ? result.errorLogs : [];
                            var startupHistory = Array.isArray(result.startupHistory) ? result.startupHistory : [];
                            var analytics = result.analytics;
                            var popupLoadTimes = Array.isArray(result.popupLoadTimes) ? result.popupLoadTimes : [];

                            var lastError = null;
                            if (errorLogs.length > 0) {
                                lastError = errorLogs[errorLogs.length - 1];
                            }

                            var avgPopupLoadTime = 0;
                            if (popupLoadTimes.length > 0) {
                                var totalMs = 0;
                                for (var i = 0; i < popupLoadTimes.length; i++) {
                                    var entry = popupLoadTimes[i];
                                    totalMs += (typeof entry === 'object' && entry !== null && typeof entry.durationMs === 'number')
                                        ? entry.durationMs : (typeof entry === 'number' ? entry : 0);
                                }
                                avgPopupLoadTime = Math.round((totalMs / popupLoadTimes.length) * 100) / 100;
                            }

                            var totalAnalyticsEvents = 0;
                            if (analytics && typeof analytics === 'object') {
                                if (typeof analytics.totalEvents === 'number') {
                                    totalAnalyticsEvents = analytics.totalEvents;
                                } else if (Array.isArray(analytics)) {
                                    totalAnalyticsEvents = analytics.length;
                                } else {
                                    var keys = Object.keys(analytics);
                                    for (var k = 0; k < keys.length; k++) {
                                        var val = analytics[keys[k]];
                                        if (typeof val === 'number') {
                                            totalAnalyticsEvents += val;
                                        }
                                    }
                                }
                            }

                            resolve({
                                errorCount: errorLogs.length,
                                lastError: lastError,
                                startupCount: startupHistory.length,
                                avgPopupLoadTime: avgPopupLoadTime,
                                totalAnalyticsEvents: totalAnalyticsEvents
                            });
                        } catch (innerErr) {
                            resolve({
                                errorCount: 0, lastError: null, startupCount: 0,
                                avgPopupLoadTime: 0, totalAnalyticsEvents: 0
                            });
                        }
                    }
                );
            } catch (e) {
                resolve({
                    errorCount: 0, lastError: null, startupCount: 0,
                    avgPopupLoadTime: 0, totalAnalyticsEvents: 0
                });
            }
        });
    }

    /* ---- 3. Storage Usage ---- */

    function getStorageUsage() {
        return new Promise(function (resolve) {
            try {
                if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
                    resolve({ bytesUsed: 0, percentUsed: 0, quota: STORAGE_QUOTA });
                    return;
                }

                if (typeof chrome.storage.local.getBytesInUse === 'function') {
                    chrome.storage.local.getBytesInUse(null, function (bytes) {
                        try {
                            if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.lastError) {
                                _estimateByStringify(resolve);
                                return;
                            }
                            var used = typeof bytes === 'number' ? bytes : 0;
                            resolve({
                                bytesUsed: used,
                                percentUsed: Math.round((used / STORAGE_QUOTA) * 10000) / 100,
                                quota: STORAGE_QUOTA
                            });
                        } catch (e) {
                            _estimateByStringify(resolve);
                        }
                    });
                } else {
                    _estimateByStringify(resolve);
                }
            } catch (e) {
                resolve({ bytesUsed: 0, percentUsed: 0, quota: STORAGE_QUOTA });
            }
        });
    }

    function _estimateByStringify(resolve) {
        try {
            chrome.storage.local.get(null, function (allData) {
                try {
                    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.lastError) {
                        resolve({ bytesUsed: 0, percentUsed: 0, quota: STORAGE_QUOTA });
                        return;
                    }
                    var json = JSON.stringify(allData || {});
                    var estimated = json.length * 2; // rough UTF-16 estimate
                    resolve({
                        bytesUsed: estimated,
                        percentUsed: Math.round((estimated / STORAGE_QUOTA) * 10000) / 100,
                        quota: STORAGE_QUOTA
                    });
                } catch (e) {
                    resolve({ bytesUsed: 0, percentUsed: 0, quota: STORAGE_QUOTA });
                }
            });
        } catch (e) {
            resolve({ bytesUsed: 0, percentUsed: 0, quota: STORAGE_QUOTA });
        }
    }

    /* ---- 4. Debug Bundle Generator ---- */

    function _getInstalledModules() {
        var modules = {};
        var scope = typeof self !== 'undefined' ? self : (typeof window !== 'undefined' ? window : {});
        for (var i = 0; i < KNOWN_MODULES.length; i++) {
            var name = KNOWN_MODULES[i];
            try {
                modules[name] = typeof scope[name] !== 'undefined' && scope[name] !== null;
            } catch (e) {
                modules[name] = false;
            }
        }
        return modules;
    }

    function generateDebugBundle() {
        var systemInfo = getSystemInfo();
        var installedModules = _getInstalledModules();

        return getExtensionHealth().then(function (health) {
            return getStorageUsage().then(function (storage) {
                return {
                    generatedAt: new Date().toISOString(),
                    systemInfo: systemInfo,
                    extensionHealth: health,
                    storageUsage: storage,
                    installedModules: installedModules
                };
            });
        });
    }

    /* ---- 5. Issue Classifier ---- */

    function classifyIssue(description) {
        var lower = normalizeText(description);
        var result = {
            category: 'general',
            severity: 'low',
            suggestedActions: SUGGESTED_ACTIONS.general.slice()
        };

        if (!lower) { return result; }

        // Determine category by keyword match count
        var bestCategory = 'general';
        var bestCount = 0;
        var cats = Object.keys(ISSUE_KEYWORDS);
        for (var i = 0; i < cats.length; i++) {
            var cat = cats[i];
            var words = ISSUE_KEYWORDS[cat];
            var matchCount = 0;
            for (var j = 0; j < words.length; j++) {
                if (lower.indexOf(words[j]) !== -1) {
                    matchCount++;
                }
            }
            if (matchCount > bestCount) {
                bestCount = matchCount;
                bestCategory = cat;
            }
        }
        result.category = bestCategory;

        // Determine severity
        var severityLevels = ['critical', 'high', 'medium', 'low'];
        for (var s = 0; s < severityLevels.length; s++) {
            var level = severityLevels[s];
            var sevWords = SEVERITY_KEYWORDS[level];
            var found = false;
            for (var w = 0; w < sevWords.length; w++) {
                if (lower.indexOf(sevWords[w]) !== -1) {
                    found = true;
                    break;
                }
            }
            if (found) {
                result.severity = level;
                break;
            }
        }

        // Attach suggested actions for the matched category
        result.suggestedActions = (SUGGESTED_ACTIONS[bestCategory] || SUGGESTED_ACTIONS.general).slice();

        return result;
    }

    /* ---- 6. Quick Health Check ---- */

    function quickCheck() {
        var checks = [];

        // Check chrome.cookies API
        try {
            var hasCookiesApi = typeof chrome !== 'undefined' && chrome.cookies && typeof chrome.cookies.getAll === 'function';
            checks.push({
                name: 'cookies_api',
                passed: !!hasCookiesApi,
                detail: hasCookiesApi ? 'chrome.cookies API available' : 'chrome.cookies API not available'
            });
        } catch (e) {
            checks.push({ name: 'cookies_api', passed: false, detail: 'Error checking cookies API: ' + e.message });
        }

        // Check chrome.runtime.getManifest
        try {
            var hasManifest = typeof chrome !== 'undefined' && chrome.runtime && typeof chrome.runtime.getManifest === 'function';
            var manifest = hasManifest ? chrome.runtime.getManifest() : null;
            checks.push({
                name: 'manifest',
                passed: !!manifest,
                detail: manifest ? 'Manifest v' + (manifest.manifest_version || '?') : 'Cannot read manifest'
            });
        } catch (e) {
            checks.push({ name: 'manifest', passed: false, detail: 'Error reading manifest: ' + e.message });
        }

        // Check chrome.storage via a write/read cycle
        return new Promise(function (resolve) {
            try {
                if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
                    checks.push({ name: 'storage', passed: false, detail: 'chrome.storage.local not available' });
                    resolve(_buildCheckResult(checks));
                    return;
                }

                var testKey = '__sd_health_check__';
                var testVal = Date.now();
                var testData = {};
                testData[testKey] = testVal;

                chrome.storage.local.set(testData, function () {
                    try {
                        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.lastError) {
                            checks.push({ name: 'storage', passed: false, detail: 'Storage write failed' });
                            resolve(_buildCheckResult(checks));
                            return;
                        }
                        chrome.storage.local.get(testKey, function (result) {
                            try {
                                var ok = result && result[testKey] === testVal;
                                checks.push({
                                    name: 'storage',
                                    passed: ok,
                                    detail: ok ? 'Storage read/write working' : 'Storage read mismatch'
                                });
                                // Clean up test key
                                try { chrome.storage.local.remove(testKey); } catch (e) { /* ignore */ }
                            } catch (e) {
                                checks.push({ name: 'storage', passed: false, detail: 'Storage read error: ' + e.message });
                            }
                            resolve(_buildCheckResult(checks));
                        });
                    } catch (e) {
                        checks.push({ name: 'storage', passed: false, detail: 'Storage callback error: ' + e.message });
                        resolve(_buildCheckResult(checks));
                    }
                });
            } catch (e) {
                checks.push({ name: 'storage', passed: false, detail: 'Storage check error: ' + e.message });
                resolve(_buildCheckResult(checks));
            }
        });
    }

    function _buildCheckResult(checks) {
        var failCount = 0;
        for (var i = 0; i < checks.length; i++) {
            if (!checks[i].passed) { failCount++; }
        }
        var status = failCount === 0 ? 'ok' : (failCount < checks.length ? 'degraded' : 'error');
        return { status: status, checks: checks };
    }

    /* ---- Public API ---- */

    var SupportDiagnostics = {
        getSystemInfo: getSystemInfo,
        getExtensionHealth: getExtensionHealth,
        getStorageUsage: getStorageUsage,
        generateDebugBundle: generateDebugBundle,
        classifyIssue: classifyIssue,
        quickCheck: quickCheck
    };

    if (typeof self !== 'undefined') { self.SupportDiagnostics = SupportDiagnostics; }
    if (typeof window !== 'undefined') { window.SupportDiagnostics = SupportDiagnostics; }

})();
