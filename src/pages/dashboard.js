/**
 * Cookie Manager - Value Metrics Dashboard
 * Renders usage statistics, weekly activity, feature breakdown,
 * motivational statements, and upgrade CTA for free-tier users.
 *
 * Dependencies (loaded before this file):
 *   - ../features/feature-registry.js  (FeatureManager, FEATURES, TIERS)
 *   - ../features/usage-tracker.js     (UsageTracker)
 *
 * IIFE pattern - no globals exposed.
 */
(function () {
    'use strict';

    // ========================================================================
    // Constants
    // ========================================================================

    var SECONDS_PER_ACTION = 15;
    var DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // ========================================================================
    // Helpers
    // ========================================================================

    /**
     * Format seconds into a human-readable string.
     * @param {number} totalSeconds
     * @returns {string}
     */
    function formatTimeSaved(totalSeconds) {
        if (totalSeconds < 60) {
            return totalSeconds + 's';
        }
        var minutes = Math.floor(totalSeconds / 60);
        if (minutes < 60) {
            return minutes + 'm';
        }
        var hours = Math.floor(minutes / 60);
        var remainMin = minutes % 60;
        if (hours < 24) {
            return remainMin > 0 ? hours + 'h ' + remainMin + 'm' : hours + 'h';
        }
        var days = Math.floor(hours / 24);
        var remainHrs = hours % 24;
        return remainHrs > 0 ? days + 'd ' + remainHrs + 'h' : days + 'd';
    }

    /**
     * Get date string in YYYY-MM-DD format.
     * @param {Date} d
     * @returns {string}
     */
    function toDateKey(d) {
        var year = d.getFullYear();
        var month = String(d.getMonth() + 1).padStart(2, '0');
        var day = String(d.getDate()).padStart(2, '0');
        return year + '-' + month + '-' + day;
    }

    /**
     * Get the last 7 date keys (today and 6 days prior).
     * @returns {Array<string>}
     */
    function getLast7DateKeys() {
        var keys = [];
        var now = new Date();
        for (var i = 6; i >= 0; i--) {
            var d = new Date(now);
            d.setDate(d.getDate() - i);
            keys.push(toDateKey(d));
        }
        return keys;
    }

    /**
     * Format a date string as a short month/day label for display.
     * @param {string} dateKey - YYYY-MM-DD
     * @returns {{ label: string, dayOfWeek: number }}
     */
    function parseDateLabel(dateKey) {
        var parts = dateKey.split('-');
        var d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        return {
            label: DAY_LABELS[d.getDay()],
            dayOfWeek: d.getDay()
        };
    }

    /**
     * Safely get an element by ID.
     * @param {string} id
     * @returns {HTMLElement|null}
     */
    function $(id) {
        return document.getElementById(id);
    }

    // ========================================================================
    // Render Functions
    // ========================================================================

    /**
     * Show FREE or PRO tier badge.
     * @param {Object} fm - FeatureManager
     */
    function renderTierBadge(fm) {
        var badge = $('tierBadge');
        if (!badge) return;

        if (fm.isPro()) {
            badge.textContent = 'PRO';
            badge.className = 'tier-badge tier-pro';
        } else {
            badge.textContent = 'FREE';
            badge.className = 'tier-badge tier-free';
        }
    }

    /**
     * Display the member-since date from chrome.storage.local.
     */
    function renderMemberSince() {
        var el = $('memberSince');
        if (!el) return;

        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
            chrome.storage.local.get({ installDate: null }, function (result) {
                if (chrome.runtime && chrome.runtime.lastError) {
                    el.textContent = 'Member since --';
                    return;
                }
                var installDate = result.installDate;
                if (installDate) {
                    var d = new Date(installDate);
                    if (!isNaN(d.getTime())) {
                        var options = { year: 'numeric', month: 'short' };
                        el.textContent = 'Member since ' + d.toLocaleDateString(undefined, options);
                        return;
                    }
                }
                el.textContent = 'Member since --';
            });
        }
    }

    /**
     * Calculate and display value summary cards.
     * @param {Object} fm - FeatureManager
     * @param {Object} ut - UsageTracker
     */
    function renderValueCards(fm, ut) {
        var dateKeys = getLast7DateKeys();
        var todayKey = dateKeys[dateKeys.length - 1];

        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
            chrome.storage.local.get({ dailyHistory: {}, featureUsage: {} }, function (result) {
                if (chrome.runtime && chrome.runtime.lastError) return;

                var history = result.dailyHistory || {};
                var featureUsage = result.featureUsage || {};

                // Actions today
                var actionsToday = 0;
                if (history[todayKey]) {
                    var todayData = history[todayKey];
                    if (typeof todayData === 'number') {
                        actionsToday = todayData;
                    } else if (typeof todayData === 'object') {
                        var dayKeys = Object.keys(todayData);
                        for (var j = 0; j < dayKeys.length; j++) {
                            actionsToday += (typeof todayData[dayKeys[j]] === 'number') ? todayData[dayKeys[j]] : 0;
                        }
                    }
                }

                // Weekly total (for time saved)
                var weeklyTotal = 0;
                for (var i = 0; i < dateKeys.length; i++) {
                    var dayData = history[dateKeys[i]];
                    if (typeof dayData === 'number') {
                        weeklyTotal += dayData;
                    } else if (typeof dayData === 'object' && dayData !== null) {
                        var keys = Object.keys(dayData);
                        for (var k = 0; k < keys.length; k++) {
                            weeklyTotal += (typeof dayData[keys[k]] === 'number') ? dayData[keys[k]] : 0;
                        }
                    }
                }

                // Total actions (all time)
                var totalActions = 0;
                var allDays = Object.keys(history);
                for (var d = 0; d < allDays.length; d++) {
                    var val = history[allDays[d]];
                    if (typeof val === 'number') {
                        totalActions += val;
                    } else if (typeof val === 'object' && val !== null) {
                        var vKeys = Object.keys(val);
                        for (var v = 0; v < vKeys.length; v++) {
                            totalActions += (typeof val[vKeys[v]] === 'number') ? val[vKeys[v]] : 0;
                        }
                    }
                }

                // Features used count
                var featuresUsed = 0;
                var fKeys = Object.keys(featureUsage);
                for (var f = 0; f < fKeys.length; f++) {
                    if (featureUsage[fKeys[f]] > 0) {
                        featuresUsed++;
                    }
                }

                // Time saved this week
                var timeSaved = weeklyTotal * SECONDS_PER_ACTION;

                // Update DOM
                var timeSavedEl = $('timeSavedValue');
                if (timeSavedEl) timeSavedEl.textContent = formatTimeSaved(timeSaved);

                var actionsTodayEl = $('actionsTodayValue');
                if (actionsTodayEl) actionsTodayEl.textContent = String(actionsToday);

                var totalActionsEl = $('totalActionsValue');
                if (totalActionsEl) totalActionsEl.textContent = String(totalActions);

                var featuresUsedEl = $('featuresUsedValue');
                if (featuresUsedEl) featuresUsedEl.textContent = String(featuresUsed);
            });
        }
    }

    /**
     * Build the 7-day bar chart from dailyHistory in storage.
     * @param {Object} ut - UsageTracker
     */
    function renderWeeklyChart(ut) {
        var barsContainer = $('chartBars');
        var labelsContainer = $('chartLabels');
        var emptyEl = $('chartEmpty');
        if (!barsContainer || !labelsContainer) return;

        var dateKeys = getLast7DateKeys();
        var todayKey = dateKeys[dateKeys.length - 1];

        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
            chrome.storage.local.get({ dailyHistory: {} }, function (result) {
                if (chrome.runtime && chrome.runtime.lastError) return;

                var history = result.dailyHistory || {};

                // Extract counts for the 7 days
                var counts = [];
                for (var i = 0; i < dateKeys.length; i++) {
                    var dayData = history[dateKeys[i]];
                    var count = 0;
                    if (typeof dayData === 'number') {
                        count = dayData;
                    } else if (typeof dayData === 'object' && dayData !== null) {
                        var keys = Object.keys(dayData);
                        for (var k = 0; k < keys.length; k++) {
                            count += (typeof dayData[keys[k]] === 'number') ? dayData[keys[k]] : 0;
                        }
                    }
                    counts.push(count);
                }

                var maxCount = Math.max.apply(null, counts);
                var hasActivity = maxCount > 0;

                // Show/hide empty state
                if (emptyEl) {
                    emptyEl.hidden = hasActivity;
                }
                barsContainer.style.display = hasActivity ? '' : 'none';
                labelsContainer.style.display = hasActivity ? '' : 'none';

                if (!hasActivity) return;

                // Clear previous content (use textContent for safety)
                barsContainer.textContent = '';
                labelsContainer.textContent = '';

                // Build bars
                for (var b = 0; b < counts.length; b++) {
                    var pct = maxCount > 0 ? Math.round((counts[b] / maxCount) * 100) : 0;
                    var minPct = counts[b] > 0 ? Math.max(pct, 3) : 0;

                    var wrapper = document.createElement('div');
                    wrapper.className = 'chart-bar-wrapper';

                    var bar = document.createElement('div');
                    bar.className = 'chart-bar';
                    bar.style.height = minPct + '%';

                    var tooltip = document.createElement('span');
                    tooltip.className = 'chart-bar-tooltip';
                    tooltip.textContent = counts[b] + ' action' + (counts[b] !== 1 ? 's' : '');
                    bar.appendChild(tooltip);

                    wrapper.appendChild(bar);
                    barsContainer.appendChild(wrapper);

                    // Label
                    var info = parseDateLabel(dateKeys[b]);
                    var label = document.createElement('span');
                    label.className = 'chart-label';
                    if (dateKeys[b] === todayKey) {
                        label.className += ' chart-label-today';
                    }
                    label.textContent = info.label;
                    labelsContainer.appendChild(label);
                }
            });
        }
    }

    /**
     * Show per-feature usage with horizontal progress bars, sorted by count.
     * @param {Object} fm - FeatureManager
     * @param {Object} ut - UsageTracker
     */
    function renderFeatureBreakdown(fm, ut) {
        var container = $('featureBreakdown');
        var emptyEl = $('breakdownEmpty');
        if (!container) return;

        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
            chrome.storage.local.get({ featureUsage: {} }, function (result) {
                if (chrome.runtime && chrome.runtime.lastError) return;

                var featureUsage = result.featureUsage || {};
                var allFeatures = fm.getAllFeatures();

                // Build usage data with feature names
                var usageData = [];
                for (var i = 0; i < allFeatures.length; i++) {
                    var feature = allFeatures[i];
                    var count = featureUsage[feature.id] || 0;
                    if (count > 0) {
                        usageData.push({
                            name: feature.name,
                            count: count
                        });
                    }
                }

                // Sort by count descending
                usageData.sort(function (a, b) {
                    return b.count - a.count;
                });

                // Check for empty
                if (usageData.length === 0) {
                    if (emptyEl) emptyEl.hidden = false;
                    return;
                }

                if (emptyEl) emptyEl.hidden = true;

                // Remove any existing rows (but keep the empty element)
                var existing = container.querySelectorAll('.breakdown-row');
                for (var r = 0; r < existing.length; r++) {
                    container.removeChild(existing[r]);
                }

                var maxCount = usageData[0].count;

                // Build rows
                for (var j = 0; j < usageData.length; j++) {
                    var pct = maxCount > 0 ? Math.round((usageData[j].count / maxCount) * 100) : 0;

                    var row = document.createElement('div');
                    row.className = 'breakdown-row';

                    var nameEl = document.createElement('span');
                    nameEl.className = 'breakdown-name';
                    nameEl.textContent = usageData[j].name;
                    nameEl.title = usageData[j].name;

                    var track = document.createElement('div');
                    track.className = 'breakdown-bar-track';

                    var fill = document.createElement('div');
                    fill.className = 'breakdown-bar-fill';
                    fill.style.width = pct + '%';
                    track.appendChild(fill);

                    var countEl = document.createElement('span');
                    countEl.className = 'breakdown-count';
                    countEl.textContent = String(usageData[j].count);

                    row.appendChild(nameEl);
                    row.appendChild(track);
                    row.appendChild(countEl);
                    container.insertBefore(row, emptyEl);
                }
            });
        }
    }

    /**
     * Display a motivational message based on total usage.
     * @param {Object} ut - UsageTracker
     */
    function renderValueStatement(ut) {
        var textEl = $('statementText');
        if (!textEl) return;

        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
            chrome.storage.local.get({ dailyHistory: {} }, function (result) {
                if (chrome.runtime && chrome.runtime.lastError) return;

                var history = result.dailyHistory || {};
                var totalActions = 0;

                var allDays = Object.keys(history);
                for (var d = 0; d < allDays.length; d++) {
                    var val = history[allDays[d]];
                    if (typeof val === 'number') {
                        totalActions += val;
                    } else if (typeof val === 'object' && val !== null) {
                        var vKeys = Object.keys(val);
                        for (var v = 0; v < vKeys.length; v++) {
                            totalActions += (typeof val[vKeys[v]] === 'number') ? val[vKeys[v]] : 0;
                        }
                    }
                }

                var timeSaved = formatTimeSaved(totalActions * SECONDS_PER_ACTION);

                if (totalActions === 0) {
                    textEl.textContent = 'Start using Cookie Manager to see your personalized value summary.';
                } else if (totalActions < 10) {
                    textEl.textContent = 'You have managed ' + totalActions + ' cookie' + (totalActions !== 1 ? 's' : '') +
                        ' with Cookie Manager so far. Keep going!';
                } else if (totalActions < 50) {
                    textEl.textContent = 'Nice work! You have managed ' + totalActions +
                        ' cookies with Cookie Manager, saving roughly ' + timeSaved +
                        ' of time managing cookies manually.';
                } else if (totalActions < 200) {
                    textEl.textContent = 'Impressive! Cookie Manager has helped you manage ' + totalActions +
                        ' cookies, saving you approximately ' + timeSaved +
                        ' of tedious manual cookie management.';
                } else if (totalActions < 1000) {
                    textEl.textContent = 'You are a cookie management pro! With ' + totalActions +
                        ' cookies managed and roughly ' + timeSaved +
                        ' saved, Cookie Manager is a key part of your workflow.';
                } else {
                    textEl.textContent = 'Outstanding! You have managed over ' + totalActions +
                        ' cookies with Cookie Manager, saving an incredible ' + timeSaved +
                        '. Your productivity is off the charts!';
                }
            });
        }
    }

    /**
     * Show upgrade section for free-tier users with % of features available.
     * @param {Object} fm - FeatureManager
     */
    function renderUpgradeCTA(fm) {
        var ctaSection = $('upgradeCTA');
        if (!ctaSection) return;

        if (fm.isPro()) {
            ctaSection.hidden = true;
            return;
        }

        // Show the CTA for free users
        ctaSection.hidden = false;

        var allFeatures = fm.getAllFeatures();
        var freeFeatures = fm.getFeaturesByTier('free');
        var proFeatures = fm.getFeaturesByTier('pro');

        var freePercent = allFeatures.length > 0
            ? Math.round((freeFeatures.length / allFeatures.length) * 100)
            : 0;

        var pctEl = $('ctaFreePercent');
        if (pctEl) {
            pctEl.textContent = freePercent + '%';
        }

        // List pro features
        var listEl = $('ctaFeaturesList');
        if (listEl && proFeatures.length > 0) {
            listEl.textContent = '';
            for (var i = 0; i < proFeatures.length; i++) {
                var li = document.createElement('li');
                li.className = 'cta-feature-item';
                li.textContent = proFeatures[i].name + ' \u2014 ' + proFeatures[i].description;
                listEl.appendChild(li);
            }
        }

        // Upgrade button handler
        var upgradeBtn = $('ctaUpgradeBtn');
        if (upgradeBtn) {
            upgradeBtn.addEventListener('click', function () {
                // Open upgrade page or chrome web store
                if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
                    window.open(chrome.runtime.getURL('src/pages/upgrade.html'), '_blank');
                }
            });
        }
    }

    /**
     * Wire up footer actions: Reset Stats, Export Stats.
     * @param {Object} ut - UsageTracker
     */
    function setupFooterActions(ut) {
        var resetBtn = $('resetStatsBtn');
        var exportBtn = $('exportStatsBtn');

        if (resetBtn) {
            resetBtn.addEventListener('click', function () {
                var confirmed = confirm(
                    'Are you sure you want to reset all Cookie Manager usage statistics? This cannot be undone.'
                );
                if (!confirmed) return;

                if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                    chrome.storage.local.remove(['dailyHistory', 'featureUsage'], function () {
                        if (chrome.runtime && chrome.runtime.lastError) {
                            return;
                        }
                        // Reload the dashboard to reflect cleared data
                        window.location.reload();
                    });
                }
            });
        }

        if (exportBtn) {
            exportBtn.addEventListener('click', function () {
                if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                    chrome.storage.local.get(
                        { dailyHistory: {}, featureUsage: {}, installDate: null },
                        function (result) {
                            if (chrome.runtime && chrome.runtime.lastError) return;

                            var exportData = {
                                exportedAt: new Date().toISOString(),
                                extensionName: 'Cookie Manager',
                                installDate: result.installDate || null,
                                dailyHistory: result.dailyHistory || {},
                                featureUsage: result.featureUsage || {}
                            };

                            var blob = new Blob(
                                [JSON.stringify(exportData, null, 2)],
                                { type: 'application/json' }
                            );
                            var url = URL.createObjectURL(blob);
                            var a = document.createElement('a');
                            a.href = url;
                            a.download = 'cookie-manager-stats-' + toDateKey(new Date()) + '.json';
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            URL.revokeObjectURL(url);
                        }
                    );
                }
            });
        }
    }

    // ========================================================================
    // Initialization
    // ========================================================================

    document.addEventListener('DOMContentLoaded', function () {
        var fm = (typeof FeatureManager !== 'undefined') ? FeatureManager : null;
        var ut = (typeof UsageTracker !== 'undefined') ? UsageTracker : null;

        if (!fm) {
            // FeatureManager is required; bail if not loaded
            return;
        }

        fm.init().then(function () {
            renderTierBadge(fm);
            renderMemberSince();
            renderValueCards(fm, ut);
            renderWeeklyChart(ut);
            renderFeatureBreakdown(fm, ut);
            renderValueStatement(ut);
            renderUpgradeCTA(fm);
            setupFooterActions(ut);
        });
    });

})();
