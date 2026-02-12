/**
 * Cookie Manager - Churn Signal Detector
 * Analyzes local usage patterns to detect churn risk signals.
 * Tracks daily actions, streaks, feature breadth, and inactivity.
 * 100% local data — zero external requests.
 *
 * Usage:
 *   ChurnDetector.recordUsage('edit');
 *   ChurnDetector.assessRisk().then(console.log);
 *   ChurnDetector.getDaysSinceLastUse().then(console.log);
 */
(function () {
    'use strict';

    var STORAGE_KEY = 'usageHistory';
    var MAX_DAYS = 90;
    var DAY_MS = 86400000;
    var VALID_FEATURES = ['edit', 'export', 'jwt', 'clear', 'search'];

    function read(fallback) {
        return new Promise(function (resolve) {
            try {
                chrome.storage.local.get(STORAGE_KEY, function (r) {
                    if (chrome.runtime.lastError) {
                        resolve(fallback);
                        return;
                    }
                    resolve(r[STORAGE_KEY] !== undefined ? r[STORAGE_KEY] : fallback);
                });
            } catch (e) { resolve(fallback); }
        });
    }

    function write(value) {
        var d = {};
        d[STORAGE_KEY] = value;
        return new Promise(function (resolve) {
            try {
                chrome.storage.local.set(d, function () {
                    if (chrome.runtime.lastError) {
                        console.warn('[ChurnDetector] write error:', chrome.runtime.lastError.message);
                    }
                    resolve();
                });
            }
            catch (e) { resolve(); }
        });
    }

    function todayStr() {
        return new Date().toISOString().slice(0, 10);
    }

    function daysBetween(a, b) {
        var ta = new Date(a + 'T00:00:00Z').getTime();
        var tb = new Date(b + 'T00:00:00Z').getTime();
        return Math.round(Math.abs(ta - tb) / DAY_MS);
    }

    function subtractDays(dateStr, n) {
        var d = new Date(dateStr + 'T00:00:00Z');
        d.setUTCDate(d.getUTCDate() - n);
        return d.toISOString().slice(0, 10);
    }

    function pruneOld(entries) {
        return entries.length <= MAX_DAYS ? entries : entries.slice(entries.length - MAX_DAYS);
    }

    function findEntry(entries, date) {
        for (var i = 0; i < entries.length; i++) {
            if (entries[i].date === date) return entries[i];
        }
        return null;
    }

    function avgActions(entries, fromDate, days) {
        var total = 0;
        for (var i = 0; i < days; i++) {
            var entry = findEntry(entries, subtractDays(fromDate, i));
            if (entry) total += entry.actions;
        }
        return total / days;
    }

    function emptyFeatures() {
        var f = {};
        for (var i = 0; i < VALID_FEATURES.length; i++) f[VALID_FEATURES[i]] = 0;
        return f;
    }

    var ChurnDetector = {
        recordUsage: function (action) {
            try {
                var feature = VALID_FEATURES.indexOf(action) !== -1 ? action : null;
                return read([]).then(function (entries) {
                    var today = todayStr();
                    var entry = findEntry(entries, today);
                    if (!entry) {
                        entry = { date: today, actions: 0, features: emptyFeatures() };
                        entries.push(entry);
                    }
                    entry.actions += 1;
                    if (feature) entry.features[feature] = (entry.features[feature] || 0) + 1;
                    return write(pruneOld(entries));
                });
            } catch (e) { return Promise.resolve(); }
        },

        getDaysSinceLastUse: function () {
            try {
                return read([]).then(function (entries) {
                    if (entries.length === 0) return -1;
                    return daysBetween(todayStr(), entries[entries.length - 1].date);
                });
            } catch (e) { return Promise.resolve(-1); }
        },

        getUsageDecline: function () {
            try {
                return read([]).then(function (entries) {
                    var today = todayStr();
                    var recent = avgActions(entries, today, 7);
                    var previous = avgActions(entries, subtractDays(today, 7), 7);
                    if (previous <= 0) return 0;
                    var decline = ((previous - recent) / previous) * 100;
                    return Math.max(0, Math.min(100, Math.round(decline)));
                });
            } catch (e) { return Promise.resolve(0); }
        },

        getCurrentStreak: function () {
            try {
                return read([]).then(function (entries) {
                    if (entries.length === 0) return 0;
                    var streak = 0;
                    var check = todayStr();
                    for (var i = 0; i < entries.length; i++) {
                        var entry = findEntry(entries, check);
                        if (entry && entry.actions > 0) {
                            streak++;
                            check = subtractDays(check, 1);
                        } else { break; }
                    }
                    return streak;
                });
            } catch (e) { return Promise.resolve(0); }
        },

        getLongestStreak: function () {
            try {
                return read([]).then(function (entries) {
                    if (entries.length === 0) return 0;
                    var longest = 0;
                    var current = 1;
                    for (var i = 1; i < entries.length; i++) {
                        if (daysBetween(entries[i - 1].date, entries[i].date) === 1) {
                            current++;
                        } else {
                            if (current > longest) longest = current;
                            current = 1;
                        }
                    }
                    return current > longest ? current : longest;
                });
            } catch (e) { return Promise.resolve(0); }
        },

        getFeatureUsage: function () {
            try {
                return read([]).then(function (entries) {
                    var totals = emptyFeatures();
                    for (var j = 0; j < entries.length; j++) {
                        var f = entries[j].features || {};
                        for (var k = 0; k < VALID_FEATURES.length; k++) {
                            totals[VALID_FEATURES[k]] += (f[VALID_FEATURES[k]] || 0);
                        }
                    }
                    return totals;
                });
            } catch (e) { return Promise.resolve(emptyFeatures()); }
        },

        assessRisk: function () {
            var detector = this;
            try {
                return Promise.all([
                    detector.getDaysSinceLastUse(),
                    detector.getUsageDecline(),
                    detector.getCurrentStreak()
                ]).then(function (results) {
                    var daysSince = results[0];
                    var decline = results[1];
                    var streak = results[2];
                    var signals = [];
                    var level = 'low';

                    if (daysSince >= 20 || decline >= 80) level = 'critical';
                    else if (daysSince >= 10 || decline >= 60) level = 'high';
                    else if (daysSince >= 5 || decline >= 40) level = 'medium';

                    if (daysSince >= 5) signals.push('inactive_' + daysSince + '_days');
                    if (decline >= 40) signals.push('usage_decline_' + decline + '%');
                    if (streak === 0) signals.push('streak_broken');

                    return {
                        isAtRisk: level !== 'low',
                        riskLevel: level,
                        daysSinceActive: daysSince,
                        usageDecline: decline,
                        streak: streak,
                        signals: signals
                    };
                });
            } catch (e) {
                return Promise.resolve({
                    isAtRisk: false, riskLevel: 'low', daysSinceActive: -1,
                    usageDecline: 0, streak: 0, signals: []
                });
            }
        }
    };

    if (typeof self !== 'undefined') self.ChurnDetector = ChurnDetector;
    if (typeof window !== 'undefined') window.ChurnDetector = ChurnDetector;
})();
