/**
 * Cookie Manager - Paywall Modal Component
 * Shows upgrade prompt when users hit free-tier limits.
 * IIFE pattern - exposes window.Paywall globally.
 */
(function () {
    'use strict';

    // ========================================================================
    // Configuration
    // ========================================================================

    var PAYMENT_URLS = {
        monthly: 'https://www.zovo.one/cookie-manager/checkout?plan=monthly',
        annual: 'https://www.zovo.one/cookie-manager/checkout?plan=annual'
    };

    var FEATURES = [
        { name: chrome.i18n.getMessage('featureViewSearchCookies') || 'View & Search Cookies',       free: 'check', pro: 'check' },
        { name: chrome.i18n.getMessage('featureEditDeleteCreate') || 'Edit, Delete & Create Cookies', free: 'check', pro: 'check' },
        { name: chrome.i18n.getMessage('featureCookieProfiles') || 'Cookie Profiles',                free: '2',     pro: chrome.i18n.getMessage('featureUnlimited') || 'Unlimited' },
        { name: chrome.i18n.getMessage('featureAutoDeleteRules') || 'Auto-Delete Rules',              free: '1',     pro: chrome.i18n.getMessage('featureUnlimited') || 'Unlimited' },
        { name: chrome.i18n.getMessage('featureJwtDecoder') || 'JWT Decoder',                        free: 'check', pro: 'check' },
        { name: chrome.i18n.getMessage('featureAdvancedExport') || 'Advanced Export (CSV, Netscape)', free: 'cross', pro: 'check' },
        { name: chrome.i18n.getMessage('featureImportCookies') || 'Import Cookies',                  free: 'cross', pro: 'check' },
        { name: chrome.i18n.getMessage('featureHealthDashboard') || 'Health Dashboard',               free: 'cross', pro: 'check' },
        { name: chrome.i18n.getMessage('featureBulkOps') || 'Bulk Operations',                       free: 'cross', pro: 'check' },
        { name: chrome.i18n.getMessage('featureNoDailyLimits') || 'No Daily Limits',                 free: 'cross', pro: 'check' }
    ];

    var IMPRESSION_CAP = 100;

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
     * Build a feature comparison row HTML.
     * @param {{ name: string, free: string, pro: string }} feature
     * @returns {string}
     */
    function buildFeatureRow(feature) {
        var freeCell = '';
        var proCell = '';

        // Free column
        if (feature.free === 'check') {
            freeCell = '<span class="paywall-check" aria-label="Included">&#10003;</span>';
        } else if (feature.free === 'cross') {
            freeCell = '<span class="paywall-cross" aria-label="Not included">&mdash;</span>';
        } else {
            freeCell = '<span class="paywall-limit">' + escapeHtml(feature.free) + '</span>';
        }

        // Pro column
        if (feature.pro === 'check') {
            proCell = '<span class="paywall-check" aria-label="Included">&#10003;</span>';
        } else if (feature.pro === 'cross') {
            proCell = '<span class="paywall-cross" aria-label="Not included">&mdash;</span>';
        } else {
            proCell = '<span class="paywall-unlimited">' + escapeHtml(feature.pro) + '</span>';
        }

        return '<tr>' +
            '<td>' + escapeHtml(feature.name) + '</td>' +
            '<td>' + freeCell + '</td>' +
            '<td>' + proCell + '</td>' +
            '</tr>';
    }

    // ========================================================================
    // Modal HTML Builder
    // ========================================================================

    /**
     * Build the full paywall modal HTML string.
     * @param {string} featureName - The feature that triggered the paywall
     * @returns {string}
     */
    function buildModalHTML(featureName) {
        var safeFeature = escapeHtml(featureName);

        // Feature comparison rows
        var featureRows = '';
        for (var i = 0; i < FEATURES.length; i++) {
            featureRows += buildFeatureRow(FEATURES[i]);
        }

        return '' +
            '<div class="paywall-modal" role="dialog" aria-modal="true" aria-labelledby="paywall-title">' +
                /* Close button */
                '<button class="paywall-close" data-action="close" title="Close" aria-label="Close upgrade dialog">' +
                    '&#10005;' +
                '</button>' +

                /* Header */
                '<div class="paywall-header">' +
                    '<div class="paywall-badge">' +
                        '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
                            '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>' +
                        '</svg>' +
                        '<span>PRO</span>' +
                    '</div>' +
                    '<h2 class="paywall-title" id="paywall-title">' + (chrome.i18n.getMessage('paywallUnlockTitle', [safeFeature]) || ('Unlock ' + safeFeature)) + '</h2>' +
                    '<p class="paywall-subtitle">' + (chrome.i18n.getMessage('paywallSubtitle') || 'Upgrade to Cookie Manager Pro for the full toolkit.') + '</p>' +
                '</div>' +

                /* Feature comparison */
                '<div class="paywall-comparison">' +
                    '<table>' +
                        '<thead>' +
                            '<tr>' +
                                '<th>' + (chrome.i18n.getMessage('paywallColFeature') || 'Feature') + '</th>' +
                                '<th>' + (chrome.i18n.getMessage('paywallColFree') || 'Free') + '</th>' +
                                '<th>' + (chrome.i18n.getMessage('paywallColPro') || 'Pro') + '</th>' +
                            '</tr>' +
                        '</thead>' +
                        '<tbody id="paywall-feature-tbody">' +
                            featureRows +
                        '</tbody>' +
                    '</table>' +
                '</div>' +

                /* Pricing tiers */
                '<div class="paywall-tiers">' +
                    /* Monthly */
                    '<div class="paywall-tier">' +
                        '<div class="paywall-tier-name">' + (chrome.i18n.getMessage('paywallMonthly') || 'Monthly') + '</div>' +
                        '<div class="paywall-tier-price">$3.99<span>/mo</span></div>' +
                        '<div class="paywall-tier-note">' + (chrome.i18n.getMessage('paywallBilledMonthly') || 'Billed monthly') + '</div>' +
                    '</div>' +
                    /* Annual (popular) */
                    '<div class="paywall-tier paywall-tier-popular">' +
                        '<div class="paywall-popular-badge">' + (chrome.i18n.getMessage('paywallBestValue') || 'Best Value') + '</div>' +
                        '<div class="paywall-tier-name">' + (chrome.i18n.getMessage('paywallAnnual') || 'Annual') + '</div>' +
                        '<div class="paywall-tier-price">$29.99<span>/yr</span></div>' +
                        '<div class="paywall-tier-note">' + (chrome.i18n.getMessage('paywallBilledAnnually') || '$2.50/mo billed annually') + '</div>' +
                        '<div class="paywall-savings">' + (chrome.i18n.getMessage('paywallSave37') || 'Save 37%') + '</div>' +
                    '</div>' +
                '</div>' +

                /* CTA buttons */
                '<div class="paywall-cta-section">' +
                    '<button class="paywall-cta paywall-cta-primary" data-action="annual">' +
                        (chrome.i18n.getMessage('paywallCtaAnnual') || 'Get Pro Annual &mdash; $29.99/yr') +
                    '</button>' +
                    '<button class="paywall-cta paywall-cta-secondary" data-action="monthly">' +
                        (chrome.i18n.getMessage('paywallCtaMonthly') || 'Start Monthly &mdash; $3.99/mo') +
                    '</button>' +
                '</div>' +

                /* Trust signals */
                '<div class="paywall-trust">' +
                    '<div class="paywall-trust-item">' +
                        '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
                            '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>' +
                            '<path d="M7 11V7a5 5 0 0 1 10 0v4"></path>' +
                        '</svg>' +
                        '<span>' + (chrome.i18n.getMessage('paywallTrustSecure') || 'Secure checkout') + '</span>' +
                    '</div>' +
                    '<div class="paywall-trust-item">' +
                        '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
                            '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>' +
                        '</svg>' +
                        '<span>' + (chrome.i18n.getMessage('paywallTrustMoneyBack') || '7-day money-back') + '</span>' +
                    '</div>' +
                    '<div class="paywall-trust-item">' +
                        '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
                            '<circle cx="12" cy="12" r="10"></circle>' +
                            '<polyline points="12 6 12 12 16 14"></polyline>' +
                        '</svg>' +
                        '<span>' + (chrome.i18n.getMessage('paywallTrustCancel') || 'Cancel anytime') + '</span>' +
                    '</div>' +
                '</div>' +

                /* License key entry */
                '<div class="paywall-license-entry">' +
                    '<button class="paywall-license-toggle" data-action="license-toggle" type="button">' +
                        (chrome.i18n.getMessage('paywallHaveLicenseKey') || 'Already have a license key?') +
                    '</button>' +
                    '<div class="paywall-license-form" id="paywall-license-form">' +
                        '<input class="paywall-license-input" id="paywall-license-input" type="text" placeholder="XXXX-XXXX-XXXX-XXXX" autocomplete="off" spellcheck="false" aria-label="License key">' +
                        '<button class="paywall-license-submit" data-action="license-submit" type="button">' +
                            (chrome.i18n.getMessage('paywallActivateLicense') || 'Activate License') +
                        '</button>' +
                        '<div class="paywall-license-error" id="paywall-license-error" role="alert"></div>' +
                    '</div>' +
                '</div>' +

            '</div>';
    }

    // ========================================================================
    // Event Binding
    // ========================================================================

    /**
     * Bind all event listeners on the overlay.
     * @param {HTMLElement} overlay - The paywall overlay element
     * @param {string} featureName - The feature that triggered the paywall
     * @param {Object} [options] - Optional callbacks { onDismiss }
     */
    function bindEvents(overlay, featureName, options) {
        var opts = options || {};

        // Delegate click handling
        overlay.addEventListener('click', function (e) {
            var target = e.target;
            var action = target.getAttribute('data-action');

            // Backdrop click (click directly on overlay, not on modal contents)
            if (target === overlay) {
                dismiss(overlay);
                if (typeof opts.onDismiss === 'function') opts.onDismiss();
                return;
            }

            if (!action) {
                // Check parent for data-action (in case click hit inner element)
                var parent = target.closest('[data-action]');
                if (parent) {
                    action = parent.getAttribute('data-action');
                }
            }

            if (!action) return;

            switch (action) {
                case 'close':
                    dismiss(overlay);
                    if (typeof opts.onDismiss === 'function') opts.onDismiss();
                    break;

                case 'monthly':
                    openCheckout(PAYMENT_URLS.monthly, featureName);
                    break;

                case 'annual':
                    openCheckout(PAYMENT_URLS.annual, featureName);
                    break;

                case 'license-toggle':
                    toggleLicenseForm(overlay);
                    break;

                case 'license-submit':
                    submitLicense(overlay);
                    break;
            }
        });

        // Escape key
        overlay._keyHandler = function (e) {
            if (e.key === 'Escape') {
                dismiss(overlay);
                if (typeof opts.onDismiss === 'function') opts.onDismiss();
            }
        };
        document.addEventListener('keydown', overlay._keyHandler);
    }

    /**
     * Open checkout page in a new tab.
     * @param {string} url
     * @param {string} featureName
     */
    function openCheckout(url, featureName) {
        var checkoutUrl = url;
        if (featureName) {
            checkoutUrl += '&feature=' + encodeURIComponent(featureName);
        }
        if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.create) {
            chrome.tabs.create({ url: checkoutUrl });
        } else {
            window.open(checkoutUrl, '_blank');
        }
    }

    /**
     * Toggle license key form visibility.
     * @param {HTMLElement} overlay
     */
    function toggleLicenseForm(overlay) {
        var form = overlay.querySelector('#paywall-license-form');
        if (form) {
            form.classList.toggle('visible');
            if (form.classList.contains('visible')) {
                var input = overlay.querySelector('#paywall-license-input');
                if (input) input.focus();
            }
        }
    }

    /**
     * Submit the license key for activation.
     * @param {HTMLElement} overlay
     */
    function submitLicense(overlay) {
        var input = overlay.querySelector('#paywall-license-input');
        var errorEl = overlay.querySelector('#paywall-license-error');
        var submitBtn = overlay.querySelector('[data-action="license-submit"]');

        if (!input || !submitBtn) return;

        var key = input.value.trim();
        if (!key) {
            showLicenseError(errorEl, chrome.i18n.getMessage('errEnterLicenseKey') || 'Please enter a license key.');
            return;
        }

        // Disable button while processing
        submitBtn.disabled = true;
        submitBtn.textContent = chrome.i18n.getMessage('paywallActivating') || 'Activating...';
        hideLicenseError(errorEl);

        // Send message to background
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
            chrome.runtime.sendMessage(
                { action: 'ACTIVATE_LICENSE', payload: { licenseKey: key } },
                function (response) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = chrome.i18n.getMessage('paywallActivateLicense') || 'Activate License';

                    if (chrome.runtime.lastError) {
                        showLicenseError(errorEl, chrome.i18n.getMessage('errFailedConnect') || 'Failed to connect. Please try again.');
                        return;
                    }

                    if (response && response.success && response.data && response.data.valid) {
                        // License activated and verified valid
                        dismiss(overlay);
                        // Reload page to reflect new state
                        if (typeof window !== 'undefined' && window.location) {
                            window.location.reload();
                        }
                    } else {
                        var msg = (response && response.error) ? response.error : (chrome.i18n.getMessage('errInvalidLicenseKey') || 'Invalid license key. Please check and try again.');
                        showLicenseError(errorEl, msg);
                    }
                }
            );
        } else {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Activate License';
            showLicenseError(errorEl, chrome.i18n.getMessage('errRuntimeNotAvailable') || 'Extension runtime not available.');
        }
    }

    /**
     * Show license error message.
     * @param {HTMLElement|null} el
     * @param {string} msg
     */
    function showLicenseError(el, msg) {
        if (!el) return;
        el.textContent = msg;
        el.classList.add('visible');
    }

    /**
     * Hide license error message.
     * @param {HTMLElement|null} el
     */
    function hideLicenseError(el) {
        if (!el) return;
        el.textContent = '';
        el.classList.remove('visible');
    }

    // ========================================================================
    // Impression Tracking
    // ========================================================================

    /**
     * Track that the paywall was shown for a feature.
     * Stores in chrome.storage.local with a cap of IMPRESSION_CAP items.
     * @param {string} featureName
     */
    function trackImpression(featureName) {
        if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) return;

        chrome.storage.local.get({ paywallImpressions: [] }, function (result) {
            var impressions = result.paywallImpressions || [];

            impressions.push({
                feature: featureName,
                timestamp: Date.now()
            });

            // Cap at IMPRESSION_CAP entries (keep most recent)
            if (impressions.length > IMPRESSION_CAP) {
                impressions = impressions.slice(impressions.length - IMPRESSION_CAP);
            }

            chrome.storage.local.set({ paywallImpressions: impressions });
        });
    }

    /**
     * Get the total number of paywall impressions.
     * @returns {Promise<number>}
     */
    function getImpressionCount() {
        return new Promise(function (resolve) {
            if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
                resolve(0);
                return;
            }
            chrome.storage.local.get({ paywallImpressions: [] }, function (result) {
                var impressions = result.paywallImpressions || [];
                resolve(impressions.length);
            });
        });
    }

    // ========================================================================
    // Show / Dismiss
    // ========================================================================

    /**
     * Show the paywall modal.
     * @param {string} featureName - Display name of the feature that triggered the paywall
     * @param {Object} [options] - Optional: { onDismiss: function }
     */
    function show(featureName, options) {
        // Prevent multiple paywalls
        var existing = document.querySelector('.paywall-overlay');
        if (existing) {
            dismiss(existing);
        }

        var overlay = document.createElement('div');
        overlay.className = 'paywall-overlay';
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');
        overlay.innerHTML = buildModalHTML(featureName || 'Pro Features');

        document.body.appendChild(overlay);

        // Trigger reflow before adding visible class for animation
        void overlay.offsetHeight;

        overlay.classList.add('visible');

        // Bind all interactions
        bindEvents(overlay, featureName, options);

        // Track impression
        trackImpression(featureName || 'Pro Features');

        // Focus the close button for keyboard users
        var closeBtn = overlay.querySelector('.paywall-close');
        if (closeBtn) closeBtn.focus();

        return overlay;
    }

    /**
     * Dismiss the paywall modal with animation.
     * @param {HTMLElement} overlay
     */
    function dismiss(overlay) {
        if (!overlay) return;

        // Remove escape key listener
        if (overlay._keyHandler) {
            document.removeEventListener('keydown', overlay._keyHandler);
            overlay._keyHandler = null;
        }

        overlay.classList.remove('visible');

        // Remove element after transition ends
        setTimeout(function () {
            if (overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
        }, 250);
    }

    // ========================================================================
    // Populate Feature Table (for external use)
    // ========================================================================

    /**
     * Populate a feature comparison table body.
     * Useful if the table is in a static HTML template rather than built dynamically.
     * @param {HTMLElement} [tbody] - Optional tbody element; defaults to #paywall-feature-tbody
     */
    function populateFeatureTable(tbody) {
        var el = tbody || document.getElementById('paywall-feature-tbody');
        if (!el) return;

        var html = '';
        for (var i = 0; i < FEATURES.length; i++) {
            html += buildFeatureRow(FEATURES[i]);
        }
        el.innerHTML = html;
    }

    // ========================================================================
    // Public API
    // ========================================================================

    var Paywall = {
        show: show,
        dismiss: dismiss,
        getImpressionCount: getImpressionCount,
        populateFeatureTable: populateFeatureTable
    };

    // Expose globally
    if (typeof window !== 'undefined') {
        window.Paywall = Paywall;
    }

})();
