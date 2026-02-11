/**
 * Cookie Manager — Options Page Logic
 */

(function() {
    'use strict';

    // Default settings
    var DEFAULTS = {
        themeMode: 'auto',
        defaultTab: 'cookies',
        readOnlyDefault: false,
        defaultExportFormat: 'json',
        showCookieSize: false,
        cookieSortOrder: 'name',
        notifyAutoDelete: true,
        notifyHealthAlerts: true
    };

    // Setting element IDs mapped to storage keys
    var SETTING_IDS = {
        themeMode: 'select',
        defaultTab: 'select',
        readOnlyDefault: 'checkbox',
        defaultExportFormat: 'select',
        showCookieSize: 'checkbox',
        cookieSortOrder: 'select',
        notifyAutoDelete: 'checkbox',
        notifyHealthAlerts: 'checkbox'
    };

    // =========================================================================
    // Toast
    // =========================================================================

    var toastTimer = null;

    function showToast(message, type) {
        var toast = document.getElementById('toast');
        var icon = document.getElementById('toastIcon');
        var msg = document.getElementById('toastMessage');
        if (!toast || !msg) return;

        msg.textContent = message;
        icon.textContent = type === 'success' ? '\u2713' : type === 'error' ? '\u2717' : '\u2139';
        toast.hidden = false;
        clearTimeout(toastTimer);
        toastTimer = setTimeout(function() { toast.hidden = true; }, 3000);
    }

    // =========================================================================
    // Confirm Dialog
    // =========================================================================

    function showConfirm(title, message, onConfirm) {
        var overlay = document.getElementById('confirmOverlay');
        var titleEl = document.getElementById('confirmTitle');
        var msgEl = document.getElementById('confirmMessage');
        var cancelBtn = document.getElementById('confirmCancel');
        var okBtn = document.getElementById('confirmOk');
        if (!overlay) return;

        titleEl.textContent = title;
        msgEl.textContent = message;
        overlay.hidden = false;

        function cleanup() {
            overlay.hidden = true;
            cancelBtn.removeEventListener('click', onCancel);
            okBtn.removeEventListener('click', onOk);
        }
        function onCancel() { cleanup(); }
        function onOk() { cleanup(); onConfirm(); }

        cancelBtn.addEventListener('click', onCancel);
        okBtn.addEventListener('click', onOk);
    }

    // =========================================================================
    // Navigation
    // =========================================================================

    function switchSection(name) {
        document.querySelectorAll('.nav-item').forEach(function(item) {
            item.classList.toggle('active', item.dataset.section === name);
        });
        document.querySelectorAll('.options-section').forEach(function(sec) {
            var secName = sec.id.replace('section-', '');
            var isActive = secName === name;
            sec.classList.toggle('active', isActive);
            sec.hidden = !isActive;
        });
    }

    // =========================================================================
    // Load / Save Settings
    // =========================================================================

    function loadSettings() {
        chrome.storage.local.get(DEFAULTS, function(result) {
            Object.keys(SETTING_IDS).forEach(function(key) {
                var el = document.getElementById(key);
                if (!el) return;
                var type = SETTING_IDS[key];
                if (type === 'checkbox') {
                    el.checked = !!result[key];
                } else {
                    el.value = result[key] || DEFAULTS[key];
                }
            });
        });
    }

    function saveSetting(key, value) {
        var data = {};
        data[key] = value;
        chrome.storage.local.set(data, function() {
            showToast('Setting saved', 'success');
        });
    }

    // =========================================================================
    // Data Management
    // =========================================================================

    function exportAllData() {
        chrome.storage.local.get(null, function(data) {
            var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            var url = URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = url;
            a.download = 'cookie-manager-backup-' + new Date().toISOString().slice(0, 10) + '.json';
            a.click();
            URL.revokeObjectURL(url);
            showToast('Data exported successfully', 'success');
        });
    }

    function importAllData() {
        var fileInput = document.getElementById('importFileInput');
        if (!fileInput) return;
        fileInput.value = '';
        fileInput.click();
    }

    function handleImportFile(event) {
        var file = event.target.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function(e) {
            try {
                var data = JSON.parse(e.target.result);
                if (typeof data !== 'object' || data === null || Array.isArray(data)) {
                    showToast('Invalid backup file format', 'error');
                    return;
                }
                chrome.storage.local.set(data, function() {
                    showToast('Data imported successfully. Reloading...', 'success');
                    setTimeout(function() { location.reload(); }, 1500);
                });
            } catch (err) {
                showToast('Failed to parse import file', 'error');
            }
        };
        reader.readAsText(file);
    }

    function resetDefaults() {
        showConfirm(
            'Reset All Settings?',
            'This will clear all extension data including profiles, rules, and settings. This cannot be undone.',
            function() {
                chrome.storage.local.clear(function() {
                    showToast('All data cleared. Reloading...', 'success');
                    setTimeout(function() { location.reload(); }, 1500);
                });
            }
        );
    }

    // =========================================================================
    // Init
    // =========================================================================

    document.addEventListener('DOMContentLoaded', function() {
        // Version
        var versionBadge = document.getElementById('versionBadge');
        var aboutVersion = document.getElementById('aboutVersion');
        var version = 'v' + chrome.runtime.getManifest().version;
        if (versionBadge) versionBadge.textContent = version;
        if (aboutVersion) aboutVersion.textContent = version;

        // Load settings
        loadSettings();

        // Navigation
        document.querySelectorAll('.nav-item').forEach(function(item) {
            item.addEventListener('click', function(e) {
                e.preventDefault();
                switchSection(item.dataset.section);
            });
        });

        // Handle hash navigation
        if (window.location.hash) {
            var section = window.location.hash.replace('#', '');
            switchSection(section);
        }

        // Setting change handlers
        Object.keys(SETTING_IDS).forEach(function(key) {
            var el = document.getElementById(key);
            if (!el) return;
            var type = SETTING_IDS[key];
            el.addEventListener('change', function() {
                var value = type === 'checkbox' ? el.checked : el.value;
                saveSetting(key, value);
            });
        });

        // Data management
        var exportBtn = document.getElementById('exportAllData');
        if (exportBtn) exportBtn.addEventListener('click', exportAllData);

        var importBtn = document.getElementById('importAllData');
        if (importBtn) importBtn.addEventListener('click', importAllData);

        var importFile = document.getElementById('importFileInput');
        if (importFile) importFile.addEventListener('change', handleImportFile);

        var resetBtn = document.getElementById('resetDefaults');
        if (resetBtn) resetBtn.addEventListener('click', resetDefaults);
    });
})();
