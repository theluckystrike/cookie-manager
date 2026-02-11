/**
 * Cookie Manager - Smart Review & Share Prompt System
 * Tasteful, non-intrusive prompts based on user milestones.
 * 100% local - no data leaves the browser.
 */
(function (root) {
    'use strict';

    var TAG = '[GrowthPrompts]';
    var THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
    var REVIEW_KEY = '_reviewPromptState';
    var DISMISSED_KEY = '_sharePromptsDismissed';
    var CWS_BASE = 'https://chrome.google.com/webstore/detail/cookie-manager';
    var SHARE_URL = 'https://zovo.one/cookie-manager';

    var PROMPT_CONFIGS = {
        POWER_EDITOR:  { minEdits: 25, type: 'review',  message: "You're a power user! Mind leaving a review?" },
        EXPORT_PRO:    { minExports: 5, type: 'share',  message: 'You\'ve exported cookies 5 times. Share with colleagues?' },
        FIRST_JWT:     { type: 'share',  message: 'JWT decoding is handy, right? Share with dev friends!' },
        SESSIONS_25:   { minSessions: 25, type: 'review', message: 'You\'ve used Cookie Manager 25 times! Help us grow with a review.' }
    };

    function storageGet(keys) {
        try { return chrome.storage.local.get(keys); }
        catch (e) { console.error(TAG, 'get failed', e); return Promise.resolve({}); }
    }

    function storageSet(data) {
        try { return chrome.storage.local.set(data); }
        catch (e) { console.error(TAG, 'set failed', e); return Promise.resolve(); }
    }

    var GrowthPrompts = {
        SHARE_TEMPLATES: {
            twitter: 'Cookie Manager makes debugging auth flows so much easier. Check it out: ' + SHARE_URL,
            linkedin: 'Developer tip: Cookie Manager by Zovo is the cleanest way to manage browser cookies.',
            devto: 'Just discovered Cookie Manager \u2014 a privacy-focused cookie management extension. No data collection, fully open source.'
        },

        shouldShowReviewPrompt: function () {
            return storageGet({ editCount: 0, _reviewPromptState: null }).then(function (r) {
                if (r.editCount < 25) return false;
                var state = r[REVIEW_KEY];
                if (!state) return true;
                if (state.response === 'reviewed' || state.response === 'never') return false;
                if (state.shown && state.lastShownAt) {
                    return (Date.now() - state.lastShownAt) > THIRTY_DAYS;
                }
                return !state.shown;
            });
        },

        recordReviewResponse: function (response) {
            if (['reviewed', 'later', 'never'].indexOf(response) === -1) {
                return Promise.resolve();
            }
            var update = {};
            update[REVIEW_KEY] = { shown: true, response: response, lastShownAt: Date.now() };
            return storageSet(update);
        },

        shouldShowSharePrompt: function (milestoneId) {
            if (!PROMPT_CONFIGS[milestoneId]) return Promise.resolve(false);
            return storageGet({ _sharePromptsDismissed: [] }).then(function (r) {
                var dismissed = r[DISMISSED_KEY] || [];
                return dismissed.indexOf(milestoneId) === -1;
            });
        },

        dismissSharePrompt: function (milestoneId) {
            return storageGet({ _sharePromptsDismissed: [] }).then(function (r) {
                var dismissed = r[DISMISSED_KEY] || [];
                if (dismissed.indexOf(milestoneId) === -1) {
                    dismissed.push(milestoneId);
                    var update = {};
                    update[DISMISSED_KEY] = dismissed;
                    return storageSet(update);
                }
            });
        },

        getReviewUrl: function () {
            return CWS_BASE;
        },

        getShareUrl: function (platform) {
            var msg = encodeURIComponent(this.SHARE_TEMPLATES[platform] || this.SHARE_TEMPLATES.twitter);
            if (platform === 'twitter') return 'https://twitter.com/intent/tweet?text=' + msg;
            if (platform === 'linkedin') return 'https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(SHARE_URL);
            if (platform === 'devto') return 'https://dev.to/new?prefill=' + msg;
            return SHARE_URL;
        },

        getShareMessage: function (platform, customNote) {
            var base = this.SHARE_TEMPLATES[platform] || this.SHARE_TEMPLATES.twitter;
            if (customNote && typeof customNote === 'string') {
                return customNote.trim() + ' ' + base;
            }
            return base;
        },

        getPromptConfig: function (milestoneId) {
            var cfg = PROMPT_CONFIGS[milestoneId];
            if (!cfg) return null;
            return {
                id: milestoneId,
                type: cfg.type,
                message: cfg.message,
                reviewUrl: cfg.type === 'review' ? CWS_BASE : null,
                shareUrl: cfg.type === 'share' ? SHARE_URL : null
            };
        }
    };

    if (typeof self !== 'undefined') self.GrowthPrompts = GrowthPrompts;
    if (typeof window !== 'undefined') window.GrowthPrompts = GrowthPrompts;
})(typeof self !== 'undefined' ? self : this);
