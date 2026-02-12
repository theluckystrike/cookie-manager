/**
 * Cookie Manager - Milestone Tracker
 * Tracks user usage milestones to trigger growth actions (review prompts,
 * share suggestions). All data stays 100% local — no external requests.
 */
(function (root) {
    'use strict';

    var COUNTERS_KEY = '_milestones';
    var REACHED_KEY = '_milestonesReached';
    var ACTION_MAP = {
        edit: 'editCount', export: 'exportCount', jwtDecode: 'jwtDecodeCount',
        clear: 'clearCount', session: 'sessionCount'
    };

    function read(key, fallback) {
        return new Promise(function (resolve) {
            try {
                chrome.storage.local.get(key, function (r) {
                    if (chrome.runtime.lastError) {
                        resolve(fallback);
                        return;
                    }
                    resolve(r[key] !== undefined ? r[key] : fallback);
                });
            } catch (e) { resolve(fallback); }
        });
    }

    function write(key, value) {
        var d = {}; d[key] = value;
        return new Promise(function (resolve) {
            try {
                chrome.storage.local.set(d, function () {
                    if (chrome.runtime.lastError) {
                        console.warn('[MilestoneTracker] write error:', chrome.runtime.lastError.message);
                    }
                    resolve();
                });
            }
            catch (e) { resolve(); }
        });
    }

    function reachedSet(arr) {
        var s = {};
        for (var i = 0; i < arr.length; i++) s[arr[i].id] = true;
        return s;
    }

    var MilestoneTracker = {
        MILESTONES: {
            FIRST_EDIT:   { key: 'editCount',      threshold: 1,   label: 'First cookie edited' },
            POWER_EDITOR: { key: 'editCount',      threshold: 25,  label: 'Power editor' },
            FIRST_EXPORT: { key: 'exportCount',     threshold: 1,   label: 'First export' },
            EXPORT_PRO:   { key: 'exportCount',     threshold: 5,   label: 'Export pro' },
            FIRST_JWT:    { key: 'jwtDecodeCount',  threshold: 1,   label: 'First JWT decoded' },
            FIRST_CLEAR:  { key: 'clearCount',      threshold: 1,   label: 'First domain cleared' },
            SESSIONS_5:   { key: 'sessionCount',    threshold: 5,   label: '5 sessions' },
            SESSIONS_25:  { key: 'sessionCount',    threshold: 25,  label: '25 sessions' },
            SESSIONS_100: { key: 'sessionCount',    threshold: 100, label: '100 sessions' }
        },

        async record(action) {
            try {
                var counterKey = ACTION_MAP[action];
                if (!counterKey) return [];
                var counters = await read(COUNTERS_KEY, {});
                counters[counterKey] = (counters[counterKey] || 0) + 1;
                await write(COUNTERS_KEY, counters);
                var reached = await read(REACHED_KEY, []);
                var seen = reachedSet(reached);
                var newlyReached = [];
                var ids = Object.keys(this.MILESTONES);
                for (var j = 0; j < ids.length; j++) {
                    var id = ids[j], m = this.MILESTONES[id];
                    if (m.key === counterKey && !seen[id] && counters[counterKey] >= m.threshold) {
                        var entry = { id: id, reachedAt: Date.now() };
                        reached.push(entry);
                        newlyReached.push(entry);
                    }
                }
                if (newlyReached.length > 0) await write(REACHED_KEY, reached);
                return newlyReached;
            } catch (e) { return []; }
        },

        async getReached() {
            try { return await read(REACHED_KEY, []); }
            catch (e) { return []; }
        },

        async getCounters() {
            try { return await read(COUNTERS_KEY, {}); }
            catch (e) { return {}; }
        },

        async isReached(milestoneId) {
            try {
                var reached = await read(REACHED_KEY, []);
                for (var i = 0; i < reached.length; i++) {
                    if (reached[i].id === milestoneId) return true;
                }
                return false;
            } catch (e) { return false; }
        },

        async getNextFor(action) {
            try {
                var counterKey = ACTION_MAP[action];
                if (!counterKey) return null;
                var counters = await read(COUNTERS_KEY, {});
                var seen = reachedSet(await read(REACHED_KEY, []));
                var best = null;
                var ids = Object.keys(this.MILESTONES);
                for (var j = 0; j < ids.length; j++) {
                    var id = ids[j], m = this.MILESTONES[id];
                    if (m.key === counterKey && !seen[id]) {
                        if (!best || m.threshold < this.MILESTONES[best].threshold) best = id;
                    }
                }
                if (!best) return null;
                var bm = this.MILESTONES[best];
                return { id: best, label: bm.label, threshold: bm.threshold, current: counters[counterKey] || 0 };
            } catch (e) { return null; }
        },

        async reset() {
            try { await write(COUNTERS_KEY, {}); await write(REACHED_KEY, []); }
            catch (e) { /* silent */ }
        }
    };

    root.MilestoneTracker = MilestoneTracker;
})(typeof self !== 'undefined' ? self : this);
