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

    // Security: redact cookie values from exported profiles to prevent
    // accidental sensitive data exposure (MD 18)
    function redactCookieProfiles(data) {
        if (!data || typeof data !== 'object') return data;
        var clone = JSON.parse(JSON.stringify(data));
        if (clone.cookieProfiles && typeof clone.cookieProfiles === 'object') {
            var profileNames = Object.keys(clone.cookieProfiles);
            for (var i = 0; i < profileNames.length; i++) {
                var profile = clone.cookieProfiles[profileNames[i]];
                if (profile && Array.isArray(profile.cookies)) {
                    for (var j = 0; j < profile.cookies.length; j++) {
                        if (profile.cookies[j] && typeof profile.cookies[j].value === 'string') {
                            profile.cookies[j].value = '[REDACTED]';
                        }
                    }
                }
            }
        }
        // Redact error log stacks that may contain sensitive data
        if (Array.isArray(clone.errorLogs)) {
            for (var e = 0; e < clone.errorLogs.length; e++) {
                if (clone.errorLogs[e] && clone.errorLogs[e].stack) {
                    clone.errorLogs[e].stack = '[REDACTED]';
                }
            }
        }
        return clone;
    }

    function exportAllData() {
        chrome.storage.local.get(null, function(data) {
            var safeData = redactCookieProfiles(data);
            var blob = new Blob([JSON.stringify(safeData, null, 2)], { type: 'application/json' });
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

    // Security: allowlist of keys that may be imported (MD 18)
    var IMPORTABLE_KEYS = [
        'themeMode', 'defaultTab', 'readOnlyDefault', 'defaultExportFormat',
        'showCookieSize', 'cookieSortOrder', 'notifyAutoDelete', 'notifyHealthAlerts',
        'readOnlyMode', 'protectedDomains', 'cookieProfiles', 'autoDeleteRules',
        'activePopupTab', 'debugMode'
    ];

    function sanitizeImportData(raw) {
        if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return null;
        var clean = {};
        for (var i = 0; i < IMPORTABLE_KEYS.length; i++) {
            var key = IMPORTABLE_KEYS[i];
            if (Object.prototype.hasOwnProperty.call(raw, key)) {
                clean[key] = raw[key];
            }
        }
        // Reject prototype pollution keys
        if (Object.keys(clean).length === 0) return null;
        return clean;
    }

    function handleImportFile(event) {
        var file = event.target.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function(e) {
            try {
                var raw = JSON.parse(e.target.result);
                if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
                    showToast('Invalid backup file format', 'error');
                    return;
                }
                // Security: only import allowlisted keys to prevent prototype pollution
                // and overwriting internal extension state (MD 18)
                var data = sanitizeImportData(raw);
                if (!data) {
                    showToast('No recognized settings found in backup file', 'error');
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
    // License Management
    // =========================================================================

    function loadLicenseStatus() {
        chrome.runtime.sendMessage({ action: 'GET_LICENSE_STATUS' }, function(response) {
            if (chrome.runtime.lastError) return;
            // Handle both wrapped {success, data} and direct response formats
            var data = (response && response.data) ? response.data : response;
            if (data) {
                updateLicenseDisplay(data);
            }
        });

        chrome.runtime.sendMessage({ action: 'GET_TRIAL_STATUS' }, function(response) {
            if (chrome.runtime.lastError) return;
            // Handle both wrapped {success, data} and direct response formats
            var data = (response && response.data) ? response.data : response;
            if (data) {
                updateTrialDisplay(data);
            }
        });
    }

    function updateLicenseDisplay(data) {
        var badge = document.getElementById('licenseTierBadge');
        var expiry = document.getElementById('licenseExpiry');
        var deactivateGroup = document.getElementById('deactivateGroup');
        var upgradeCtaGroup = document.getElementById('upgradeCtaGroup');

        if (!badge) return;

        var tier = data.tier || data.plan || 'free';
        if (data.isPro && tier === 'free') {
            tier = 'pro';
        }
        var tierLabel = tier.charAt(0).toUpperCase() + tier.slice(1);

        badge.textContent = tierLabel;
        badge.className = 'license-tier-badge';
        if (tier === 'pro') {
            badge.classList.add('license-tier-pro');
        } else if (tier === 'lifetime') {
            badge.classList.add('license-tier-lifetime');
        } else if (tier === 'trial') {
            badge.classList.add('license-tier-trial');
        }

        if (expiry) {
            if (data.expiresAt && tier !== 'lifetime') {
                var expiryDate = new Date(data.expiresAt);
                expiry.textContent = 'Expires ' + expiryDate.toLocaleDateString();
            } else if (tier === 'lifetime') {
                expiry.textContent = 'Never expires';
            } else {
                expiry.textContent = '';
            }
        }

        // Show deactivate button for paid tiers
        if (deactivateGroup) {
            deactivateGroup.hidden = !(tier === 'pro' || tier === 'lifetime');
        }

        // Hide upgrade CTA for paid tiers
        if (upgradeCtaGroup) {
            upgradeCtaGroup.hidden = (tier === 'pro' || tier === 'lifetime');
        }
    }

    function updateTrialDisplay(data) {
        var trialGroup = document.getElementById('trialStatusGroup');
        var trialText = document.getElementById('trialStatusText');

        if (!trialGroup || !trialText) return;

        // Handle multiple possible field names from the service worker
        var isActive = data.active || data.trialActive || data.isActive || data.isTrialing;

        if (isActive) {
            trialGroup.hidden = false;
            var daysLeft = data.daysRemaining || data.trialDaysLeft || data.daysLeft || 0;
            trialText.textContent = daysLeft + ' day' + (daysLeft !== 1 ? 's' : '') + ' remaining in your trial.';
        } else {
            trialGroup.hidden = true;
        }
    }

    function activateLicense() {
        var input = document.getElementById('licenseKeyInput');
        var errorEl = document.getElementById('licenseError');
        var successEl = document.getElementById('licenseSuccess');
        var activateBtn = document.getElementById('activateLicenseBtn');

        if (!input) return;

        var key = input.value.trim();
        if (!key) {
            showLicenseMessage(errorEl, 'Please enter a license key.');
            hideLicenseMessage(successEl);
            return;
        }

        // Disable button during request
        if (activateBtn) {
            activateBtn.disabled = true;
            activateBtn.textContent = 'Activating...';
        }

        hideLicenseMessage(errorEl);
        hideLicenseMessage(successEl);

        chrome.runtime.sendMessage({ action: 'ACTIVATE_LICENSE', payload: { licenseKey: key } }, function(response) {
            if (activateBtn) {
                activateBtn.disabled = false;
                activateBtn.textContent = 'Activate';
            }

            if (chrome.runtime.lastError) {
                showLicenseMessage(errorEl, 'Failed to communicate with the extension.');
                return;
            }

            if (response && response.success && response.data && response.data.valid) {
                showLicenseMessage(successEl, 'License activated successfully!');
                hideLicenseMessage(errorEl);
                input.value = '';
                updateLicenseDisplay(response.data);
                loadLicenseStatus();
            } else if (response && response.success && response.data && !response.data.valid) {
                // Service worker succeeded but license key was invalid
                showLicenseMessage(errorEl, 'Invalid license key. Please check and try again.');
                hideLicenseMessage(successEl);
            } else {
                var errMsg = (response && response.error) || 'Failed to activate license. Please check your key and try again.';
                showLicenseMessage(errorEl, errMsg);
                hideLicenseMessage(successEl);
            }
        });
    }

    function deactivateLicense() {
        var errorEl = document.getElementById('licenseError');
        var successEl = document.getElementById('licenseSuccess');

        showConfirm(
            'Deactivate License?',
            'This will remove your license from this device. You can reactivate it later.',
            function() {
                chrome.runtime.sendMessage({ action: 'DEACTIVATE_LICENSE' }, function(response) {
                    if (chrome.runtime.lastError) {
                        showLicenseMessage(errorEl, 'Failed to communicate with the extension.');
                        return;
                    }

                    if (response && response.success) {
                        showLicenseMessage(successEl, 'License deactivated.');
                        hideLicenseMessage(errorEl);
                        loadLicenseStatus();
                    } else {
                        var errMsg = (response && response.error) || 'Failed to deactivate license.';
                        showLicenseMessage(errorEl, errMsg);
                        hideLicenseMessage(successEl);
                    }
                });
            }
        );
    }

    function showLicenseMessage(el, message) {
        if (!el) return;
        el.textContent = message;
        el.hidden = false;
    }

    function hideLicenseMessage(el) {
        if (!el) return;
        el.textContent = '';
        el.hidden = true;
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

        // License management
        loadLicenseStatus();

        var activateLicenseBtn = document.getElementById('activateLicenseBtn');
        if (activateLicenseBtn) activateLicenseBtn.addEventListener('click', activateLicense);

        var deactivateLicenseBtn = document.getElementById('deactivateLicenseBtn');
        if (deactivateLicenseBtn) deactivateLicenseBtn.addEventListener('click', deactivateLicense);

        // Allow Enter key to activate license
        var licenseKeyInput = document.getElementById('licenseKeyInput');
        if (licenseKeyInput) {
            licenseKeyInput.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    activateLicense();
                }
            });
        }
    });
})();
