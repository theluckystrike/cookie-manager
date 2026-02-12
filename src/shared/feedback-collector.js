/**
 * Cookie Manager - Feedback Collector
 * Local feedback collection with auto-categorization, sentiment analysis, and priority classification.
 * All data stored locally via chrome.storage.local. Zero external requests.
 *
 * Usage:
 *   FeedbackCollector.submitFeedback('bug', 'Extension crashes on YouTube').then(console.log);
 *   FeedbackCollector.getFeedbackStats().then(console.log);
 *   FeedbackCollector.analyzeSentiment('This extension is amazing!');
 */
(function () {
    'use strict';

    var ENTRIES_KEY = '_fb_entries';
    var MAX_ENTRIES = 100;
    var VALID_TYPES = ['bug', 'feature', 'question', 'praise', 'other'];

    var CATEGORY_KEYWORDS = {
        installation: ['install', 'setup', 'uninstall', 'download', 'enable', 'disable', 'add', 'remove extension'],
        bug: ['bug', 'error', 'crash', 'broken', 'not working', 'fail', 'glitch', 'freeze', 'stuck'],
        performance: ['slow', 'lag', 'memory', 'cpu', 'freeze', 'hang', 'loading', 'speed', 'heavy'],
        compatibility: ['browser', 'firefox', 'chrome', 'edge', 'safari', 'version', 'update', 'conflict'],
        howto: ['how to', 'how do', 'where is', 'can i', 'help', 'tutorial', 'guide', 'instructions'],
        feature: ['feature', 'request', 'wish', 'would be nice', 'suggestion', 'add support', 'please add'],
        general: []
    };

    var POSITIVE_WORDS = ['love', 'great', 'amazing', 'awesome', 'helpful', 'useful', 'perfect', 'thank', 'best', 'excellent'];
    var NEGATIVE_WORDS = ['hate', 'terrible', 'awful', 'worst', 'useless', 'broken', 'frustrated', 'disappointed', 'annoying', 'slow'];
    var INTENSIFIERS = ['very', 'extremely', 'really', 'absolutely', 'totally'];
    var URGENT_WORDS = ['crash', 'data loss', 'security', 'urgent'];

    /* ---- Storage helpers ---- */

    function readEntries() {
        return new Promise(function (resolve) {
            try {
                if (typeof chrome === 'undefined' || !chrome.storage) { resolve([]); return; }
                chrome.storage.local.get(ENTRIES_KEY, function (r) {
                    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.lastError) { resolve([]); return; }
                    resolve(Array.isArray(r[ENTRIES_KEY]) ? r[ENTRIES_KEY] : []);
                });
            } catch (e) { resolve([]); }
        });
    }

    function writeEntries(entries) {
        var data = {};
        data[ENTRIES_KEY] = entries;
        return new Promise(function (resolve) {
            try {
                if (typeof chrome === 'undefined' || !chrome.storage) { resolve(); return; }
                chrome.storage.local.set(data, function () {
                    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.lastError) {
                        console.warn('[FeedbackCollector] write failed:', chrome.runtime.lastError.message);
                    }
                    resolve();
                });
            } catch (e) { resolve(); }
        });
    }

    /* ---- Utilities ---- */

    function generateId() {
        return 'fb_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 8);
    }

    function normalizeText(text) {
        return (typeof text === 'string' ? text : '').toLowerCase().trim();
    }

    /* ---- Categorization ---- */

    function categorize(text) {
        var lower = normalizeText(text);
        var bestCategory = 'general';
        var bestCount = 0;
        var tags = [];
        var keys = Object.keys(CATEGORY_KEYWORDS);
        for (var i = 0; i < keys.length; i++) {
            var cat = keys[i];
            var words = CATEGORY_KEYWORDS[cat];
            var matchCount = 0;
            for (var j = 0; j < words.length; j++) {
                if (lower.indexOf(words[j]) !== -1) {
                    matchCount++;
                    if (tags.indexOf(words[j]) === -1) { tags.push(words[j]); }
                }
            }
            if (matchCount > bestCount) {
                bestCount = matchCount;
                bestCategory = cat;
            }
        }
        var confidence = bestCount === 0 ? 0.1 : Math.min(bestCount * 0.25, 1.0);
        return { category: bestCategory, tags: tags, confidence: Math.round(confidence * 100) / 100 };
    }

    /* ---- Sentiment Analysis ---- */

    function analyzeSentiment(text) {
        var lower = normalizeText(text);
        var words = lower.split(/\s+/);
        var posCount = 0;
        var negCount = 0;
        var hasIntensifier = false;
        var urgent = false;
        for (var i = 0; i < URGENT_WORDS.length; i++) {
            if (lower.indexOf(URGENT_WORDS[i]) !== -1) { urgent = true; break; }
        }
        for (var k = 0; k < words.length; k++) {
            var w = words[k];
            for (var p = 0; p < INTENSIFIERS.length; p++) {
                if (w === INTENSIFIERS[p]) { hasIntensifier = true; break; }
            }
            for (var a = 0; a < POSITIVE_WORDS.length; a++) {
                if (w.indexOf(POSITIVE_WORDS[a]) !== -1) { posCount++; break; }
            }
            for (var b = 0; b < NEGATIVE_WORDS.length; b++) {
                if (w.indexOf(NEGATIVE_WORDS[b]) !== -1) { negCount++; break; }
            }
        }
        var total = posCount + negCount;
        var score = total === 0 ? 0 : (posCount - negCount) / total;
        if (hasIntensifier && score !== 0) {
            score = score > 0 ? Math.min(score * 1.5, 1) : Math.max(score * 1.5, -1);
        }
        score = Math.round(score * 100) / 100;
        var label = score > 0.1 ? 'positive' : (score < -0.1 ? 'negative' : 'neutral');
        return { score: score, label: label, urgent: urgent };
    }

    /* ---- Priority Classification ---- */

    function classifyPriority(category, sentiment, text) {
        var lower = normalizeText(text || '');
        for (var i = 0; i < URGENT_WORDS.length; i++) {
            if (lower.indexOf(URGENT_WORDS[i]) !== -1) { return 'urgent'; }
        }
        if (category === 'bug' && typeof sentiment === 'object' && sentiment.label === 'negative') {
            return 'high';
        }
        if (category === 'feature' || (typeof sentiment === 'object' && sentiment.label === 'positive')) {
            return 'low';
        }
        return 'normal';
    }

    /* ---- Feedback Submission ---- */

    function submitFeedback(type, message, metadata) {
        if (VALID_TYPES.indexOf(type) === -1) { type = 'other'; }
        if (typeof message !== 'string' || !message.trim()) {
            return Promise.resolve(null);
        }
        var cat = categorize(message);
        var sentiment = analyzeSentiment(message);
        var priority = classifyPriority(cat.category, sentiment, message);
        var entry = {
            id: generateId(),
            type: type,
            message: message.trim(),
            category: cat.category,
            sentiment: sentiment,
            priority: priority,
            metadata: typeof metadata === 'object' && metadata !== null ? metadata : {},
            timestamp: Date.now()
        };
        return readEntries().then(function (entries) {
            entries.unshift(entry);
            if (entries.length > MAX_ENTRIES) { entries = entries.slice(0, MAX_ENTRIES); }
            return writeEntries(entries).then(function () { return entry; });
        });
    }

    /* ---- Retrieval & Management ---- */

    function getFeedback(filters) {
        return readEntries().then(function (entries) {
            if (typeof filters !== 'object' || filters === null) { return entries; }
            return entries.filter(function (e) {
                if (filters.type && e.type !== filters.type) { return false; }
                if (filters.category && e.category !== filters.category) { return false; }
                if (filters.priority && e.priority !== filters.priority) { return false; }
                return true;
            });
        });
    }

    function getFeedbackStats() {
        return readEntries().then(function (entries) {
            var byType = {}, byCategory = {}, bySentiment = {};
            for (var i = 0; i < entries.length; i++) {
                var e = entries[i];
                byType[e.type] = (byType[e.type] || 0) + 1;
                byCategory[e.category] = (byCategory[e.category] || 0) + 1;
                var sl = e.sentiment && e.sentiment.label ? e.sentiment.label : 'neutral';
                bySentiment[sl] = (bySentiment[sl] || 0) + 1;
            }
            return { total: entries.length, byType: byType, byCategory: byCategory, bySentiment: bySentiment };
        });
    }

    function clearFeedback() {
        return writeEntries([]);
    }

    function exportFeedback() {
        return readEntries().then(function (entries) {
            return JSON.stringify(entries, null, 2);
        });
    }

    /* ---- Public API ---- */

    var FeedbackCollector = {
        submitFeedback: submitFeedback,
        categorize: categorize,
        analyzeSentiment: analyzeSentiment,
        classifyPriority: classifyPriority,
        getFeedback: getFeedback,
        getFeedbackStats: getFeedbackStats,
        clearFeedback: clearFeedback,
        exportFeedback: exportFeedback
    };

    if (typeof self !== 'undefined') { self.FeedbackCollector = FeedbackCollector; }
    if (typeof window !== 'undefined') { window.FeedbackCollector = FeedbackCollector; }

})();
