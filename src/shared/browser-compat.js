/**
 * Cookie Manager - Browser Detection & Compatibility Layer
 * Detects browser, manifest version, API namespace, and feature availability.
 * Provides capability report and known-limitations map per browser.
 * Local only - zero external requests. Works in service worker and popup contexts.
 *
 * Usage:
 *   BrowserCompat.getBrowser()         // 'chrome' | 'firefox' | 'edge' | 'brave' | 'opera' | 'vivaldi' | 'safari' | 'unknown'
 *   BrowserCompat.getManifestVersion() // 2 | 3
 *   BrowserCompat.getNamespace()       // chrome or browser object
 *   BrowserCompat.hasAPI('cookies.getAll') // true | false
 *   BrowserCompat.getCapabilities()    // { cookies: true, storageLocal: true, ... }
 *   BrowserCompat.getLimitations()     // ['storage.sync unavailable ...', ...]
 *   BrowserCompat.isChromium()         // true | false
 *   BrowserCompat.getInfo()            // full info object
 */
(function () {
    'use strict';

    // -- Browser Detection ---------------------------------------------------

    function _detectBrowser() {
        var ua = (typeof navigator !== 'undefined' && navigator.userAgent) || '';
        try {
            if (typeof navigator !== 'undefined' && navigator.brave &&
                typeof navigator.brave.isBrave === 'function') return 'brave';
        } catch (e) { /* ignore */ }
        if (/Vivaldi/i.test(ua))                            return 'vivaldi';
        if (/OPR\//i.test(ua) || /Opera/i.test(ua))        return 'opera';
        if (/Edg\//i.test(ua))                              return 'edge';
        if (/Firefox\//i.test(ua))                          return 'firefox';
        if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) return 'safari';
        if (/Chrome\//i.test(ua))                           return 'chrome';
        return 'unknown';
    }

    function _parseBrowserVersion() {
        var ua = (typeof navigator !== 'undefined' && navigator.userAgent) || '';
        var patterns = {
            vivaldi: /Vivaldi\/([\d.]+)/i, opera: /OPR\/([\d.]+)/i,
            edge: /Edg\/([\d.]+)/i,       firefox: /Firefox\/([\d.]+)/i,
            safari: /Version\/([\d.]+)/i,  chrome: /Chrome\/([\d.]+)/i
        };
        var re = patterns[_detectBrowser()];
        if (re) { var m = ua.match(re); if (m) return m[1]; }
        return 'unknown';
    }

    // -- Namespace & Manifest ------------------------------------------------

    function _getNamespace() {
        if (typeof browser !== 'undefined' && browser && browser.runtime) return browser;
        if (typeof chrome !== 'undefined' && chrome && chrome.runtime) return chrome;
        return null;
    }

    function _getManifestVersion() {
        try {
            var ns = _getNamespace();
            if (ns && ns.runtime && typeof ns.runtime.getManifest === 'function') {
                return (ns.runtime.getManifest() || {}).manifest_version || 0;
            }
        } catch (e) { /* ignore */ }
        return 0;
    }

    // -- API Probing ---------------------------------------------------------

    /** Walk a dot-path (e.g. 'cookies.getAll') on the browser namespace. */
    function _resolve(root, path) {
        if (!root || typeof path !== 'string') return false;
        var parts = path.split('.');
        var cur = root;
        for (var i = 0; i < parts.length; i++) {
            if (cur == null || typeof cur !== 'object') return false;
            cur = cur[parts[i]];
        }
        return cur !== undefined && cur !== null;
    }

    function _hasAPI(apiPath) {
        var ns = _getNamespace();
        return ns ? _resolve(ns, apiPath) : false;
    }

    // -- Capabilities --------------------------------------------------------

    function _buildCapabilities() {
        return {
            cookies:        _hasAPI('cookies'),
            cookiesGetAll:  _hasAPI('cookies.getAll'),
            cookiesSet:     _hasAPI('cookies.set'),
            cookiesRemove:  _hasAPI('cookies.remove'),
            storageLocal:   _hasAPI('storage.local'),
            storageSession: _hasAPI('storage.session'),
            contextMenus:   _hasAPI('contextMenus'),
            notifications:  _hasAPI('notifications'),
            alarms:         _hasAPI('alarms'),
            action:         _hasAPI('action'),
            browserAction:  _hasAPI('browserAction'),
            tabs:           _hasAPI('tabs'),
            runtime:        _hasAPI('runtime'),
            activeTab:      true, // permission-based; not API-detectable
            promiseAPI:     typeof browser !== 'undefined' && !!browser && !!browser.runtime
        };
    }

    // -- Known Limitations Map -----------------------------------------------

    var _limitationsMap = {
        safari: [
            'storage.sync is unavailable; must fall back to storage.local',
            'Service workers not supported; uses background pages instead',
            'contextMenus support is limited in Safari Web Extensions',
            'notifications API may silently fail without macOS permission',
            'Cookie partitioning (CHIPS) is not supported'
        ],
        firefox: [
            'Uses background scripts instead of service_worker in MV2',
            'browser.* namespace returns Promises; chrome.* uses callbacks',
            'storage.session requires Firefox 115+',
            'contextMenus uses menus API alias (browser.menus)',
            'Some cookie SameSite values differ from Chromium behavior'
        ],
        brave: [
            'Shields may interfere with cookie reads on certain domains',
            'Notifications may be blocked by default fingerprinting protection',
            'navigator.brave detection is asynchronous'
        ],
        opera: [
            'Sidebar extensions may conflict with popup context',
            'Some Chromium APIs gated behind opera:// flags'
        ],
        vivaldi: [
            'Custom tab stack APIs not in standard chrome.tabs',
            'Panel UI may interfere with popup dimensions'
        ],
        edge: [
            'storage.session requires Edge 102+',
            'Collections feature may conflict with cookie grouping UI'
        ],
        chrome: [],
        unknown: [
            'Browser could not be identified; some features may be unavailable'
        ]
    };

    // -- Public API ----------------------------------------------------------

    var _cachedBrowser = null;

    var BrowserCompat = {
        getBrowser: function () {
            if (_cachedBrowser === null) _cachedBrowser = _detectBrowser();
            return _cachedBrowser;
        },

        getManifestVersion: function () {
            return _getManifestVersion();
        },

        getNamespace: function () {
            return _getNamespace();
        },

        hasAPI: function (apiPath) {
            return _hasAPI(apiPath);
        },

        getCapabilities: function () {
            return _buildCapabilities();
        },

        getLimitations: function () {
            return (_limitationsMap[BrowserCompat.getBrowser()] || _limitationsMap.unknown).slice();
        },

        isChromium: function () {
            var b = BrowserCompat.getBrowser();
            return b === 'chrome' || b === 'edge' || b === 'brave' || b === 'opera' || b === 'vivaldi';
        },

        getInfo: function () {
            return {
                browser:      BrowserCompat.getBrowser(),
                version:      _parseBrowserVersion(),
                manifest:     _getManifestVersion(),
                namespace:    BrowserCompat.isChromium() ? 'chrome' : (typeof browser !== 'undefined' ? 'browser' : 'chrome'),
                chromium:     BrowserCompat.isChromium(),
                capabilities: _buildCapabilities(),
                limitations:  BrowserCompat.getLimitations()
            };
        }
    };

    // -- Expose Globally -----------------------------------------------------

    if (typeof self !== 'undefined') self.BrowserCompat = BrowserCompat;
    if (typeof window !== 'undefined') window.BrowserCompat = BrowserCompat;
})();
