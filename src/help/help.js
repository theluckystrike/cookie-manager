/**
 * Cookie Manager - Help Page
 * Self-service FAQ with search, expand/collapse, diagnostics, and usage tracking.
 * All data stored locally via chrome.storage.local. Zero external requests.
 */
(function () {
    'use strict';

    var STATS_KEY = '_help_stats';

    /* ---- DOM references ---- */

    var searchInput = document.getElementById('help-search-input');
    var toggleAllBtn = document.getElementById('help-toggle-all');
    var diagnosticsBtn = document.getElementById('help-diagnostics-btn');
    var diagnosticsOutput = document.getElementById('help-diagnostics-output');
    var feedbackBtn = document.getElementById('help-feedback-btn');
    var closeBtn = document.getElementById('help-close-btn');
    var faqItems = document.querySelectorAll('.faq-item');
    var faqSections = document.querySelectorAll('.faq-section');
    var allExpanded = false;

    /* ---- Storage helpers ---- */

    function readStats(callback) {
        try {
            if (typeof chrome === 'undefined' || !chrome.storage) { callback({}); return; }
            chrome.storage.local.get(STATS_KEY, function (result) {
                if (chrome.runtime && chrome.runtime.lastError) { callback({}); return; }
                callback(result[STATS_KEY] || {});
            });
        } catch (e) { callback({}); }
    }

    function writeStats(stats) {
        try {
            if (typeof chrome === 'undefined' || !chrome.storage) { return; }
            var data = {};
            data[STATS_KEY] = stats;
            chrome.storage.local.set(data, function () {
                if (chrome.runtime && chrome.runtime.lastError) { /* silently ignore */ }
            });
        } catch (e) { /* silently ignore */ }
    }

    function trackOpen(faqId) {
        readStats(function (stats) {
            if (!stats.opened) { stats.opened = {}; }
            if (!stats.opened[faqId]) { stats.opened[faqId] = 0; }
            stats.opened[faqId] = stats.opened[faqId] + 1;
            stats.lastViewed = faqId;
            stats.lastViewedAt = Date.now();
            writeStats(stats);
        });
    }

    /* ---- Search / Filter ---- */

    function filterFAQ() {
        var query = (searchInput.value || '').toLowerCase().trim();

        for (var i = 0; i < faqSections.length; i++) {
            var section = faqSections[i];
            var items = section.querySelectorAll('.faq-item');
            var visibleCount = 0;

            for (var j = 0; j < items.length; j++) {
                var item = items[j];
                var text = (item.textContent || '').toLowerCase();
                var matches = query === '' || text.indexOf(query) !== -1;
                item.style.display = matches ? '' : 'none';
                if (matches) { visibleCount++; }
            }

            section.style.display = visibleCount > 0 ? '' : 'none';
        }
    }

    if (searchInput) {
        searchInput.addEventListener('input', filterFAQ);
    }

    /* ---- Expand / Collapse All ---- */

    function setAllExpanded(expand) {
        for (var i = 0; i < faqItems.length; i++) {
            if (faqItems[i].style.display !== 'none') {
                faqItems[i].open = expand;
            }
        }
        allExpanded = expand;
        if (toggleAllBtn) {
            toggleAllBtn.textContent = expand ? 'Collapse All' : 'Expand All';
        }
    }

    if (toggleAllBtn) {
        toggleAllBtn.addEventListener('click', function () {
            setAllExpanded(!allExpanded);
        });
    }

    /* ---- Track FAQ opens ---- */

    for (var i = 0; i < faqItems.length; i++) {
        (function (item) {
            item.addEventListener('toggle', function () {
                if (item.open) {
                    var faqId = item.getAttribute('data-faq') || 'unknown';
                    trackOpen(faqId);
                }
            });
        })(faqItems[i]);
    }

    /* ---- Close / Back button ---- */

    if (closeBtn) {
        closeBtn.addEventListener('click', function () {
            if (window.history.length > 1) {
                window.history.back();
            } else {
                window.close();
            }
        });
    }

    /* ---- Feedback button ---- */

    if (feedbackBtn) {
        feedbackBtn.addEventListener('click', function () {
            try {
                if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
                    chrome.runtime.sendMessage({ action: 'OPEN_FEEDBACK' }, function () {
                        if (chrome.runtime.lastError) {
                            openPopupFallback();
                        }
                    });
                } else {
                    openPopupFallback();
                }
            } catch (e) {
                openPopupFallback();
            }
        });
    }

    function openPopupFallback() {
        try {
            if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
                window.open(chrome.runtime.getURL('src/popup/index.html'), '_blank');
            }
        } catch (e) { /* silently ignore */ }
    }

    /* ---- Quick Diagnostics ---- */

    if (diagnosticsBtn) {
        diagnosticsBtn.addEventListener('click', function () {
            diagnosticsBtn.disabled = true;
            diagnosticsBtn.textContent = 'Running...';

            if (typeof SupportDiagnostics !== 'undefined' && SupportDiagnostics.quickCheck) {
                try {
                    var result = SupportDiagnostics.quickCheck();
                    if (result && typeof result.then === 'function') {
                        result.then(function (data) {
                            showDiagnostics(data);
                        }).catch(function () {
                            showDiagnostics({ error: 'Diagnostics check failed.' });
                        });
                    } else {
                        showDiagnostics(result || { status: 'ok' });
                    }
                } catch (e) {
                    showDiagnostics({ error: e.message || 'Diagnostics threw an error.' });
                }
            } else {
                showDiagnostics({
                    browser: navigator.userAgent,
                    platform: navigator.platform,
                    language: navigator.language,
                    extensionId: (typeof chrome !== 'undefined' && chrome.runtime) ? chrome.runtime.id : 'N/A',
                    timestamp: new Date().toISOString(),
                    note: 'SupportDiagnostics module not available. Basic info shown.'
                });
            }
        });
    }

    function showDiagnostics(data) {
        if (!diagnosticsOutput) { return; }
        diagnosticsOutput.hidden = false;
        diagnosticsOutput.textContent = JSON.stringify(data, null, 2);
        if (diagnosticsBtn) {
            diagnosticsBtn.disabled = false;
            diagnosticsBtn.textContent = 'Quick Diagnostics';
        }
    }

    /* ---- Public API ---- */

    var HelpPage = {
        filterFAQ: filterFAQ,
        setAllExpanded: setAllExpanded,
        showDiagnostics: showDiagnostics,
        trackOpen: trackOpen
    };

    window.HelpPage = HelpPage;

})();
