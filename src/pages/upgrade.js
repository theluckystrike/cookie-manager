'use strict';

/**
 * Cookie Manager - Upgrade Page Logic
 * Full-page upgrade experience opened when users hit free-tier limits.
 * IIFE pattern, no ES modules.
 */
(function () {

    // ========================================================================
    // Configuration
    // ========================================================================

    var CHECKOUT_BASE = 'https://api.zovo.dev/checkout';

    var CHECKOUT_URLS = {
        monthly: CHECKOUT_BASE + '?plan=monthly',
        annual: CHECKOUT_BASE + '?plan=annual'
    };

    /**
     * Feature comparison data for the upgrade table.
     * Each entry: { name, free, pro }
     *   - free/pro values: 'check' (included), 'cross' (not included),
     *     'pro-only', or a string describing the limit/value.
     */
    var COMPARISON_FEATURES = [
        { name: 'View Cookies',           free: 'check',    pro: 'check' },
        { name: 'Edit Cookies',           free: '25/day',   pro: 'Unlimited' },
        { name: 'Delete Cookies',         free: '50/day',   pro: 'Unlimited' },
        { name: 'Create Cookies',         free: '10/day',   pro: 'Unlimited' },
        { name: 'Export (JSON)',           free: '5/day',    pro: 'Unlimited' },
        { name: 'Export (Netscape/CSV)',   free: 'cross',    pro: 'check' },
        { name: 'Cookie Profiles',        free: '2',        pro: 'Unlimited' },
        { name: 'Auto-Delete Rules',      free: '1',        pro: 'Unlimited' },
        { name: 'JWT Decoder',            free: 'check',    pro: 'check' },
        { name: 'Health Dashboard',       free: 'cross',    pro: 'check' },
        { name: 'Bulk Operations',        free: 'cross',    pro: 'check' },
        { name: 'Import Cookies',         free: 'cross',    pro: 'check' }
    ];

    /**
     * Map of feature query param values to human-readable names for the limit banner.
     */
    var FEATURE_DISPLAY_NAMES = {
        'edit':           'Edit Cookies',
        'delete':         'Delete Cookies',
        'create':         'Create Cookies',
        'export':         'Export Cookies',
        'export_json':    'JSON Export',
        'export_netscape':'Netscape Export',
        'export_csv':     'CSV Export',
        'profiles':       'Cookie Profiles',
        'auto_delete':    'Auto-Delete Rules',
        'health':         'Health Dashboard',
        'bulk':           'Bulk Operations',
        'import':         'Import Cookies'
    };

    // ========================================================================
    // Helpers
    // ========================================================================

    /**
     * Escape HTML special characters to prevent XSS.
     * @param {string} str
     * @returns {string}
     */
    function escapeHtml(str) {
        if (!str) return '';
        var map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
        return String(str).replace(/[&<>"']/g, function (ch) { return map[ch]; });
    }

    /**
     * Get URL search parameters.
     * @returns {{ feature: string|null, reason: string|null }}
     */
    function getUrlParams() {
        var params = new URLSearchParams(window.location.search);
        return {
            feature: params.get('feature'),
            reason: params.get('reason')
        };
    }

    // ========================================================================
    // Limit Banner
    // ========================================================================

    /**
     * Show the limit banner if URL params indicate a limit was hit.
     */
    function initLimitBanner() {
        var params = getUrlParams();
        if (!params.feature) return;

        var banner = document.getElementById('limitBanner');
        var bannerText = document.getElementById('limitBannerText');
        var closeBtn = document.getElementById('limitBannerClose');

        if (!banner || !bannerText) return;

        // Build banner message using safe DOM API (no innerHTML with user-derived data)
        var featureName = FEATURE_DISPLAY_NAMES[params.feature] || params.feature;
        bannerText.textContent = '';

        if (params.reason === 'limit') {
            bannerText.appendChild(document.createTextNode('You\u2019ve reached your daily limit for '));
            var strong1 = document.createElement('strong');
            strong1.textContent = featureName;
            bannerText.appendChild(strong1);
            bannerText.appendChild(document.createTextNode('. Upgrade to Pro for unlimited access.'));
        } else if (params.reason === 'pro_only') {
            var strong2 = document.createElement('strong');
            strong2.textContent = featureName;
            bannerText.appendChild(strong2);
            bannerText.appendChild(document.createTextNode(' is a Pro-only feature. Upgrade to unlock it.'));
        } else {
            bannerText.appendChild(document.createTextNode('Upgrade to Pro to unlock full access to '));
            var strong3 = document.createElement('strong');
            strong3.textContent = featureName;
            bannerText.appendChild(strong3);
            bannerText.appendChild(document.createTextNode('.'));
        }
        banner.hidden = false;

        // Close button
        if (closeBtn) {
            closeBtn.addEventListener('click', function () {
                banner.hidden = true;
            });
        }
    }

    // ========================================================================
    // Feature Comparison Table
    // ========================================================================

    /**
     * Build HTML for a single cell based on its value type.
     * @param {string} value
     * @param {boolean} isProCol
     * @returns {string}
     */
    function buildCellHtml(value, isProCol) {
        if (value === 'check') {
            return '<span class="comp-check" aria-label="Included">&#10003;</span>';
        }
        if (value === 'cross') {
            return '<span class="comp-cross" aria-label="Not included">&mdash;</span>';
        }
        if (value === 'pro-only') {
            return '<span class="comp-pro-only">Pro Only</span>';
        }
        if (value === 'Unlimited') {
            return '<span class="comp-unlimited">Unlimited</span>';
        }
        // Numeric limit (e.g., "25/day", "2")
        if (isProCol) {
            return '<span class="comp-unlimited">' + escapeHtml(value) + '</span>';
        }
        return '<span class="comp-limit">' + escapeHtml(value) + '</span>';
    }

    /**
     * Populate the comparison table from feature data.
     * Attempts to use FeatureManager from feature-registry.js if available,
     * otherwise falls back to the hardcoded COMPARISON_FEATURES list.
     */
    function populateComparisonTable() {
        var tbody = document.getElementById('comparisonTableBody');
        if (!tbody) return;

        var features = COMPARISON_FEATURES;

        // If FeatureManager is available, build the table from its registry data.
        // FeatureManager.getComparisonTable() returns { name, free, pro } but uses
        // '--' and 'Included' instead of 'cross'/'check'. Map to the format that
        // buildCellHtml() expects.
        if (typeof window.FeatureManager !== 'undefined' && typeof window.FeatureManager.getComparisonTable === 'function') {
            try {
                var rawFeatures = window.FeatureManager.getComparisonTable();
                if (rawFeatures && rawFeatures.length > 0) {
                    features = rawFeatures.map(function (f) {
                        return {
                            name: f.name,
                            free: f.free === '--' ? 'cross' : (f.free === 'Included' ? 'check' : f.free),
                            pro:  f.pro === '--'  ? 'cross' : (f.pro === 'Included'  ? 'check' : f.pro)
                        };
                    });
                }
            } catch (e) {
                // Fall back to hardcoded features
            }
        }

        var html = '';
        for (var i = 0; i < features.length; i++) {
            var f = features[i];
            html += '<tr>' +
                '<td>' + escapeHtml(f.name) + '</td>' +
                '<td>' + buildCellHtml(f.free, false) + '</td>' +
                '<td>' + buildCellHtml(f.pro, true) + '</td>' +
                '</tr>';
        }

        tbody.innerHTML = html;
    }

    // ========================================================================
    // Pricing CTA Handlers
    // ========================================================================

    /**
     * Open checkout page for the given plan.
     * @param {string} plan - 'monthly' or 'annual'
     */
    function openCheckout(plan) {
        var url = CHECKOUT_URLS[plan];
        if (!url) return;

        // Append feature param if arriving from a limit
        var params = getUrlParams();
        if (params.feature) {
            url += '&feature=' + encodeURIComponent(params.feature);
        }

        if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.create) {
            chrome.tabs.create({ url: url });
        } else {
            window.open(url, '_blank');
        }
    }

    /**
     * Wire up CTA buttons on pricing cards.
     */
    function initPricingButtons() {
        var buttons = document.querySelectorAll('[data-plan]');
        for (var i = 0; i < buttons.length; i++) {
            buttons[i].addEventListener('click', function (e) {
                var plan = this.getAttribute('data-plan');
                if (plan) {
                    openCheckout(plan);
                }
            });
        }
    }

    // ========================================================================
    // Restore Purchase
    // ========================================================================

    /**
     * Initialize the Restore Purchase flow.
     */
    function initRestorePurchase() {
        var restoreBtn = document.getElementById('restorePurchase');
        var overlay = document.getElementById('restoreOverlay');
        var cancelBtn = document.getElementById('restoreCancel');
        var submitBtn = document.getElementById('restoreSubmit');
        var input = document.getElementById('restoreLicenseInput');
        var errorEl = document.getElementById('restoreError');

        if (!restoreBtn || !overlay) return;

        // Open modal
        restoreBtn.addEventListener('click', function () {
            overlay.hidden = false;
            if (input) {
                input.value = '';
                input.focus();
            }
            if (errorEl) errorEl.textContent = '';
        });

        // Cancel / close modal
        if (cancelBtn) {
            cancelBtn.addEventListener('click', function () {
                overlay.hidden = true;
            });
        }

        // Click on overlay backdrop closes
        overlay.addEventListener('click', function (e) {
            if (e.target === overlay) {
                overlay.hidden = true;
            }
        });

        // Submit license key
        if (submitBtn) {
            submitBtn.addEventListener('click', function () {
                handleLicenseSubmit(input, submitBtn, errorEl, overlay);
            });
        }

        // Enter key in input submits
        if (input) {
            input.addEventListener('keydown', function (e) {
                if (e.key === 'Enter') {
                    handleLicenseSubmit(input, submitBtn, errorEl, overlay);
                }
            });
        }
    }

    /**
     * Handle license key submission via ACTIVATE_LICENSE message.
     * @param {HTMLInputElement} input
     * @param {HTMLButtonElement} submitBtn
     * @param {HTMLElement} errorEl
     * @param {HTMLElement} overlay
     */
    function handleLicenseSubmit(input, submitBtn, errorEl, overlay) {
        if (!input) return;

        var key = input.value.trim();
        if (!key) {
            if (errorEl) errorEl.textContent = 'Please enter a license key.';
            return;
        }

        // Disable button
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Activating...';
        }
        if (errorEl) errorEl.textContent = '';

        // Send message to background service worker
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
            chrome.runtime.sendMessage(
                { action: 'ACTIVATE_LICENSE', payload: { licenseKey: key } },
                function (response) {
                    // Re-enable button
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.textContent = 'Activate License';
                    }

                    if (chrome.runtime.lastError) {
                        if (errorEl) errorEl.textContent = 'Failed to connect. Please try again.';
                        return;
                    }

                    if (response && response.success && response.data && response.data.valid) {
                        // License activated successfully
                        overlay.hidden = true;
                        showActivationSuccess();
                    } else {
                        var msg = (response && response.error)
                            ? response.error
                            : 'Invalid license key. Please check and try again.';
                        if (errorEl) errorEl.textContent = msg;
                    }
                }
            );
        } else {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Activate License';
            }
            if (errorEl) errorEl.textContent = 'Extension runtime not available.';
        }
    }

    /**
     * Show a success state after license activation.
     * Replace pricing cards with a confirmation message.
     */
    function showActivationSuccess() {
        var hero = document.querySelector('.upgrade-hero');
        if (hero) {
            // Use DOM API instead of innerHTML for CSP compliance
            hero.textContent = '';
            var successDiv = document.createElement('div');
            successDiv.className = 'hero-success';

            // SVG checkmark icon (static content, safe for innerHTML on detached element)
            var iconWrapper = document.createElement('div');
            iconWrapper.innerHTML =
                '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--success); margin-bottom: 16px;">' +
                    '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>' +
                    '<polyline points="22 4 12 14.01 9 11.01"></polyline>' +
                '</svg>';
            if (iconWrapper.firstChild) successDiv.appendChild(iconWrapper.firstChild);

            var title = document.createElement('h2');
            title.className = 'hero-title';
            title.style.color = 'var(--success)';
            title.textContent = 'Pro Activated!';
            successDiv.appendChild(title);

            var subtitle = document.createElement('p');
            subtitle.className = 'hero-subtitle';
            subtitle.textContent = 'Your license has been activated. All Pro features are now unlocked.';
            successDiv.appendChild(subtitle);

            hero.appendChild(successDiv);
        }

        // Hide pricing and comparison sections, keep social proof
        var sections = document.querySelectorAll('.upgrade-section');
        for (var i = 0; i < sections.length; i++) {
            var section = sections[i];
            if (!section.classList.contains('social-proof-section')) {
                section.style.display = 'none';
            }
        }
    }

    // ========================================================================
    // Back to Extension
    // ========================================================================

    /**
     * Wire up "Back to Cookie Manager" link.
     */
    function initBackLink() {
        var backBtn = document.getElementById('backToExtension');
        if (backBtn) {
            backBtn.addEventListener('click', function () {
                window.close();
            });
        }
    }

    // ========================================================================
    // Initialization
    // ========================================================================

    /**
     * Main initialization - runs on DOMContentLoaded.
     */
    function init() {
        initLimitBanner();
        populateComparisonTable();
        initPricingButtons();
        initRestorePurchase();
        initBackLink();
    }

    // Wait for DOM to be ready
    document.addEventListener('DOMContentLoaded', init);

})();
