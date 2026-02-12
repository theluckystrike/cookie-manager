/**
 * Cookie Manager - Engagement Health Score Calculator
 * Computes a 0-100 local engagement score from usage frequency, feature depth,
 * recency, and action volume. Reads the shared `usageHistory` storage key
 * (same format as ChurnDetector). 100% local data -- zero external requests.
 *
 * Usage:
 *   EngagementScore.calculateScore().then(console.log);    // 0-100
 *   EngagementScore.getSummary().then(console.log);        // full breakdown
 *   EngagementScore.getUnusedFeatures().then(console.log); // ['jwt', ...]
 *   EngagementScore.recordSession();                       // bump today's count
 */
(function () {
    'use strict';

    var STORAGE_KEY = 'usageHistory';
    var SESSION_KEY = '_engagementSessions';
    var DAY_MS = 86400000; // 24 * 60 * 60 * 1000
    var ALL_FEATURES = ['edit', 'export', 'jwt', 'clear', 'search', 'readOnly', 'addCookie'];
    var WEIGHTS = { frequency: 0.30, depth: 0.25, recency: 0.25, volume: 0.20 };

    // -- Storage helpers ------------------------------------------------------

    function storageGet(keys) {
        try {
            return chrome.storage.local.get(keys).catch(function () { return {}; });
        }
        catch (e) { return Promise.resolve({}); }
    }

    function storageSet(data) {
        try {
            return chrome.storage.local.set(data).catch(function (err) {
                console.warn('[EngagementScore] storage.set error:', err);
            });
        }
        catch (e) { return Promise.resolve(); }
    }

    // -- Date helpers ---------------------------------------------------------

    function todayStr() { return new Date().toISOString().slice(0, 10); }

    function toMs(d) { return new Date(d + 'T00:00:00Z').getTime(); }

    function subtractDays(dateStr, n) {
        var d = new Date(dateStr + 'T00:00:00Z');
        d.setUTCDate(d.getUTCDate() - n);
        return d.toISOString().slice(0, 10);
    }

    // -- Scoring helpers ------------------------------------------------------

    function last30Entries(entries) {
        var cutoff = subtractDays(todayStr(), 30);
        var result = [];
        for (var i = 0; i < entries.length; i++) {
            if (entries[i].date >= cutoff) result.push(entries[i]);
        }
        return result;
    }

    function collectUsedFeatures(entries) {
        var used = {};
        for (var i = 0; i < entries.length; i++) {
            var f = entries[i].features || {};
            var keys = Object.keys(f);
            for (var j = 0; j < keys.length; j++) {
                if (f[keys[j]] > 0) used[keys[j]] = true;
            }
        }
        return used;
    }

    function calcFrequency(recent) {
        var seen = {};
        for (var i = 0; i < recent.length; i++) seen[recent[i].date] = true;
        var perWeek = (Object.keys(seen).length / 30) * 7;
        if (perWeek >= 7) return 100;
        if (perWeek >= 5) return 85;
        if (perWeek >= 3) return 70;
        if (perWeek >= 1) return 50;
        return 10;
    }

    function calcDepth(entries) {
        var ratio = Object.keys(collectUsedFeatures(entries)).length / ALL_FEATURES.length;
        if (ratio >= 0.8) return 100;
        if (ratio >= 0.6) return 80;
        if (ratio >= 0.4) return 60;
        if (ratio >= 0.2) return 40;
        return 20;
    }

    function calcRecency(entries) {
        if (entries.length === 0) return 10;
        var diff = Math.round((toMs(todayStr()) - toMs(entries[entries.length - 1].date)) / DAY_MS);
        if (diff <= 1) return 100;  if (diff <= 3) return 85;
        if (diff <= 7) return 70;   if (diff <= 14) return 50;
        if (diff <= 30) return 30;  return 10;
    }

    function calcVolume(recent) {
        var total = 0;
        for (var i = 0; i < recent.length; i++) total += (recent[i].actions || 0);
        if (total >= 100) return 100; if (total >= 50) return 80;
        if (total >= 20) return 60;   if (total >= 5) return 40;
        return 20;
    }

    function computeScore(entries) {
        var recent = last30Entries(entries);
        var f = calcFrequency(recent), d = calcDepth(entries);
        var r = calcRecency(entries),   v = calcVolume(recent);
        var s = Math.round(f * WEIGHTS.frequency + d * WEIGHTS.depth +
                           r * WEIGHTS.recency + v * WEIGHTS.volume);
        return { score: Math.max(0, Math.min(100, s)),
                 breakdown: { frequency: f, depth: d, recency: r, volume: v },
                 totalActions30d: (function () {
                     var t = 0; for (var i = 0; i < recent.length; i++) t += (recent[i].actions || 0); return t;
                 })() };
    }

    function getTier(score) {
        if (score >= 80) return { tier: 'power_user', label: 'Power User' };
        if (score >= 60) return { tier: 'engaged', label: 'Engaged' };
        if (score >= 40) return { tier: 'casual', label: 'Casual' };
        if (score >= 20) return { tier: 'at_risk', label: 'At Risk' };
        return { tier: 'dormant', label: 'Dormant' };
    }

    // -- Public API -----------------------------------------------------------

    var EngagementScore = {

        calculateScore: function () {
            try {
                return storageGet(STORAGE_KEY).then(function (r) {
                    return computeScore(r[STORAGE_KEY] || []).score;
                });
            } catch (e) { return Promise.resolve(0); }
        },

        getUnusedFeatures: function () {
            try {
                return storageGet(STORAGE_KEY).then(function (r) {
                    var used = collectUsedFeatures(r[STORAGE_KEY] || []);
                    var unused = [];
                    for (var i = 0; i < ALL_FEATURES.length; i++) {
                        if (!used[ALL_FEATURES[i]]) unused.push(ALL_FEATURES[i]);
                    }
                    return unused;
                });
            } catch (e) { return Promise.resolve(ALL_FEATURES.slice()); }
        },

        recordSession: function () {
            try {
                var today = todayStr();
                return storageGet(SESSION_KEY).then(function (r) {
                    var sessions = r[SESSION_KEY] || {};
                    sessions[today] = (sessions[today] || 0) + 1;
                    var cutoff = subtractDays(today, 30);
                    var keys = Object.keys(sessions);
                    for (var i = 0; i < keys.length; i++) {
                        if (keys[i] < cutoff) delete sessions[keys[i]];
                    }
                    var update = {};
                    update[SESSION_KEY] = sessions;
                    return storageSet(update);
                });
            } catch (e) { return Promise.resolve(); }
        },

        getSummary: function () {
            try {
                return storageGet([STORAGE_KEY, SESSION_KEY]).then(function (r) {
                    var entries = r[STORAGE_KEY] || [];
                    var sessions = r[SESSION_KEY] || {};
                    var result = computeScore(entries);

                    // Sessions this week
                    var today = todayStr();
                    var weekAgo = subtractDays(today, 7);
                    var sessionsThisWeek = 0;
                    var sKeys = Object.keys(sessions);
                    for (var i = 0; i < sKeys.length; i++) {
                        if (sKeys[i] >= weekAgo && sKeys[i] <= today) sessionsThisWeek += sessions[sKeys[i]];
                    }

                    // Unused features
                    var used = collectUsedFeatures(entries);
                    var unused = [];
                    for (var j = 0; j < ALL_FEATURES.length; j++) {
                        if (!used[ALL_FEATURES[j]]) unused.push(ALL_FEATURES[j]);
                    }

                    return {
                        score: result.score,
                        tier: getTier(result.score),
                        breakdown: result.breakdown,
                        unusedFeatures: unused,
                        sessionsThisWeek: sessionsThisWeek,
                        totalActions30d: result.totalActions30d
                    };
                });
            } catch (e) {
                return Promise.resolve({
                    score: 0, tier: getTier(0),
                    breakdown: { frequency: 10, depth: 20, recency: 10, volume: 20 },
                    unusedFeatures: ALL_FEATURES.slice(), sessionsThisWeek: 0, totalActions30d: 0
                });
            }
        }
    };

    if (typeof self !== 'undefined') self.EngagementScore = EngagementScore;
    if (typeof window !== 'undefined') window.EngagementScore = EngagementScore;
})();
