/**
 * Cookie Manager - Proactive Retention Triggers
 * Determines retention-related prompts/messages to show based on local usage
 * data. Works alongside ChurnDetector and EngagementScore modules.
 * 100% local — no data leaves the browser.
 *
 * Usage:
 *   RetentionTriggers.getNextTrigger().then(console.log);
 *   RetentionTriggers.dismissTrigger('welcome-back').then(...);
 */
(function (root) {
    'use strict';

    var TAG = '[RetentionTriggers]';
    var DAY_MS = 24 * 60 * 60 * 1000;
    var DISMISS_COOLDOWN = 7 * DAY_MS;

    var STORAGE_KEYS = {
        lastOpened: '_rt_lastOpened',
        featuresUsed: '_rt_featuresUsed',
        streak: '_rt_streak',
        lastStreakDate: '_rt_lastStreakDate',
        totalActions: '_rt_totalActions',
        celebratedMilestones: '_rt_celebratedMilestones',
        dismissedTriggers: '_rt_dismissedTriggers'
    };

    var WELCOME_MESSAGES = [
        { min: 3, max: 6, message: 'Welcome back! Your cookies are waiting.' },
        { min: 7, max: 13, message: "It's been a while! Here's what you can do with Cookie Manager." },
        { min: 14, max: 29, message: 'We missed you! Did you know you can export cookies as JSON?' },
        { min: 30, max: Infinity, message: 'Long time no see! Cookie Manager has been keeping your data safe.' }
    ];

    var FEATURE_HINTS = {
        export:   { title: 'Export Cookies', description: 'Export your cookies as JSON for backup or debugging' },
        jwt:      { title: 'JWT Decoder', description: 'Decode JWT tokens directly from cookie values' },
        readOnly: { title: 'Read-Only Mode', description: 'Enable read-only mode to prevent accidental changes' },
        addCookie:{ title: 'Add Cookie', description: 'Create custom cookies for development and testing' },
        search:   { title: 'Search Cookies', description: 'Search cookies by name or value to find what you need' },
        clear:    { title: 'Clear Domain', description: 'Clear all cookies for the current domain with one click' }
    };

    var STREAK_MILESTONES = [3, 7, 14, 30];

    var ACTION_MILESTONES = [10, 50, 100, 500, 1000];

    // -- Storage helpers ----------------------------------------------------------

    function storageGet(keys) {
        try {
            return chrome.storage.local.get(keys).catch(function (err) {
                console.error(TAG, 'get failed', err);
                return {};
            });
        } catch (e) {
            console.error(TAG, 'get failed', e);
            return Promise.resolve({});
        }
    }

    function storageSet(data) {
        try {
            return chrome.storage.local.set(data).catch(function (err) {
                console.error(TAG, 'set failed', err);
            });
        } catch (e) {
            console.error(TAG, 'set failed', e);
            return Promise.resolve();
        }
    }

    function daysBetween(ts1, ts2) {
        return Math.floor(Math.abs(ts2 - ts1) / DAY_MS);
    }

    function isDismissed(dismissed, triggerId) {
        if (!dismissed || !dismissed[triggerId]) return false;
        return (Date.now() - dismissed[triggerId]) < DISMISS_COOLDOWN;
    }

    // -- Public API ---------------------------------------------------------------

    var RetentionTriggers = {

        getWelcomeBack: function () {
            try {
                var keys = {};
                keys[STORAGE_KEYS.lastOpened] = 0;
                keys[STORAGE_KEYS.dismissedTriggers] = {};
                return storageGet(keys).then(function (r) {
                    var last = r[STORAGE_KEYS.lastOpened];
                    var dismissed = r[STORAGE_KEYS.dismissedTriggers] || {};
                    if (!last || isDismissed(dismissed, 'welcome-back')) {
                        return { show: false, daysSince: 0, message: '' };
                    }
                    var days = daysBetween(last, Date.now());
                    for (var i = 0; i < WELCOME_MESSAGES.length; i++) {
                        var tier = WELCOME_MESSAGES[i];
                        if (days >= tier.min && days <= tier.max) {
                            return { show: true, daysSince: days, message: tier.message };
                        }
                    }
                    return { show: false, daysSince: days, message: '' };
                });
            } catch (e) {
                console.error(TAG, 'getWelcomeBack failed', e);
                return Promise.resolve({ show: false, daysSince: 0, message: '' });
            }
        },

        getFeatureHint: function () {
            try {
                var keys = {};
                keys[STORAGE_KEYS.featuresUsed] = [];
                keys[STORAGE_KEYS.dismissedTriggers] = {};
                return storageGet(keys).then(function (r) {
                    var used = r[STORAGE_KEYS.featuresUsed] || [];
                    var dismissed = r[STORAGE_KEYS.dismissedTriggers] || {};
                    var featureIds = Object.keys(FEATURE_HINTS);
                    for (var i = 0; i < featureIds.length; i++) {
                        var id = featureIds[i];
                        if (used.indexOf(id) === -1 && !isDismissed(dismissed, 'feature-' + id)) {
                            var hint = FEATURE_HINTS[id];
                            return { show: true, featureId: id, title: hint.title, description: hint.description };
                        }
                    }
                    return { show: false };
                });
            } catch (e) {
                console.error(TAG, 'getFeatureHint failed', e);
                return Promise.resolve({ show: false });
            }
        },

        getStreakMessage: function () {
            try {
                var keys = {};
                keys[STORAGE_KEYS.streak] = 0;
                keys[STORAGE_KEYS.dismissedTriggers] = {};
                return storageGet(keys).then(function (r) {
                    var streak = r[STORAGE_KEYS.streak] || 0;
                    var dismissed = r[STORAGE_KEYS.dismissedTriggers] || {};
                    if (isDismissed(dismissed, 'streak')) {
                        return { show: false, streak: streak, message: '' };
                    }
                    for (var i = STREAK_MILESTONES.length - 1; i >= 0; i--) {
                        if (streak === STREAK_MILESTONES[i]) {
                            return {
                                show: true,
                                streak: streak,
                                message: streak + '-day streak! You\'re on a roll with Cookie Manager.'
                            };
                        }
                    }
                    return { show: false, streak: streak, message: '' };
                });
            } catch (e) {
                console.error(TAG, 'getStreakMessage failed', e);
                return Promise.resolve({ show: false, streak: 0, message: '' });
            }
        },

        getMilestoneMessage: function () {
            try {
                var keys = {};
                keys[STORAGE_KEYS.totalActions] = 0;
                keys[STORAGE_KEYS.celebratedMilestones] = [];
                keys[STORAGE_KEYS.dismissedTriggers] = {};
                return storageGet(keys).then(function (r) {
                    var count = r[STORAGE_KEYS.totalActions] || 0;
                    var celebrated = r[STORAGE_KEYS.celebratedMilestones] || [];
                    var dismissed = r[STORAGE_KEYS.dismissedTriggers] || {};
                    if (isDismissed(dismissed, 'milestone')) {
                        return { show: false, count: count, message: '' };
                    }
                    for (var i = ACTION_MILESTONES.length - 1; i >= 0; i--) {
                        var threshold = ACTION_MILESTONES[i];
                        if (count >= threshold && celebrated.indexOf(threshold) === -1) {
                            var update = {};
                            celebrated.push(threshold);
                            update[STORAGE_KEYS.celebratedMilestones] = celebrated;
                            return storageSet(update).then(function () {
                                return {
                                    show: true,
                                    count: threshold,
                                    message: 'Milestone reached! You\'ve performed ' + threshold + ' actions in Cookie Manager.'
                                };
                            });
                        }
                    }
                    return { show: false, count: count, message: '' };
                });
            } catch (e) {
                console.error(TAG, 'getMilestoneMessage failed', e);
                return Promise.resolve({ show: false, count: 0, message: '' });
            }
        },

        getNextTrigger: function () {
            var self = this;
            try {
                return self.getWelcomeBack().then(function (wb) {
                    if (wb.show) return { type: 'welcome-back', data: wb };
                    return self.getMilestoneMessage().then(function (ms) {
                        if (ms.show) return { type: 'milestone', data: ms };
                        return self.getStreakMessage().then(function (st) {
                            if (st.show) return { type: 'streak', data: st };
                            return self.getFeatureHint().then(function (fh) {
                                if (fh.show) return { type: 'feature-hint', data: fh };
                                return null;
                            });
                        });
                    });
                });
            } catch (e) {
                console.error(TAG, 'getNextTrigger failed', e);
                return Promise.resolve(null);
            }
        },

        dismissTrigger: function (triggerId) {
            try {
                var key = {};
                key[STORAGE_KEYS.dismissedTriggers] = {};
                return storageGet(key).then(function (r) {
                    var dismissed = r[STORAGE_KEYS.dismissedTriggers] || {};
                    dismissed[triggerId] = Date.now();
                    var update = {};
                    update[STORAGE_KEYS.dismissedTriggers] = dismissed;
                    return storageSet(update);
                });
            } catch (e) {
                console.error(TAG, 'dismissTrigger failed', e);
                return Promise.resolve();
            }
        },

        recordOpen: function () {
            try {
                var now = Date.now();
                var todayStr = new Date(now).toDateString();
                var keys = {};
                keys[STORAGE_KEYS.lastOpened] = 0;
                keys[STORAGE_KEYS.streak] = 0;
                keys[STORAGE_KEYS.lastStreakDate] = '';
                return storageGet(keys).then(function (r) {
                    var lastDate = r[STORAGE_KEYS.lastStreakDate] || '';
                    var streak = r[STORAGE_KEYS.streak] || 0;
                    var update = {};
                    update[STORAGE_KEYS.lastOpened] = now;
                    if (lastDate !== todayStr) {
                        var yesterday = new Date(now - DAY_MS).toDateString();
                        streak = (lastDate === yesterday) ? streak + 1 : 1;
                        update[STORAGE_KEYS.streak] = streak;
                        update[STORAGE_KEYS.lastStreakDate] = todayStr;
                    }
                    return storageSet(update);
                });
            } catch (e) {
                console.error(TAG, 'recordOpen failed', e);
                return Promise.resolve();
            }
        },

        recordAction: function (featureId) {
            try {
                var keys = {};
                keys[STORAGE_KEYS.totalActions] = 0;
                keys[STORAGE_KEYS.featuresUsed] = [];
                return storageGet(keys).then(function (r) {
                    var update = {};
                    update[STORAGE_KEYS.totalActions] = (r[STORAGE_KEYS.totalActions] || 0) + 1;
                    var used = r[STORAGE_KEYS.featuresUsed] || [];
                    if (featureId && used.indexOf(featureId) === -1) {
                        used.push(featureId);
                        update[STORAGE_KEYS.featuresUsed] = used;
                    }
                    return storageSet(update);
                });
            } catch (e) {
                console.error(TAG, 'recordAction failed', e);
                return Promise.resolve();
            }
        }
    };

    if (typeof self !== 'undefined') self.RetentionTriggers = RetentionTriggers;
    if (typeof window !== 'undefined') window.RetentionTriggers = RetentionTriggers;
})(typeof self !== 'undefined' ? self : this);
