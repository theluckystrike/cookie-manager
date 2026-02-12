/**
 * Cookie Manager - Background Service Worker
 * Handles message routing, context menus, and cookie change events
 */

// Import shared modules - MV3 importScripts paths are relative to extension root
// Core messaging & schema
try { importScripts('src/shared/message-types.js'); } catch(e) { console.warn('message-types.js not loaded:', e.message); }
try { importScripts('src/shared/message-validator.js'); } catch(e) { console.warn('message-validator.js not loaded:', e.message); }
try { importScripts('src/shared/message-router.js'); } catch(e) { console.warn('message-router.js not loaded:', e.message); }
try { importScripts('src/shared/storage-schema.js'); } catch(e) { console.warn('storage-schema.js not loaded:', e.message); }

// Browser compatibility & security (MD 18)
try { importScripts('src/shared/browser-compat.js'); } catch(e) { console.warn('browser-compat.js not loaded:', e.message); }
try { importScripts('src/shared/cross-browser-api.js'); } catch(e) { console.warn('cross-browser-api.js not loaded:', e.message); }
try { importScripts('src/shared/security-hardener.js'); } catch(e) { console.warn('security-hardener.js not loaded:', e.message); }

// Lifecycle & monitoring (MD 11, MD 12)
try { importScripts('src/shared/sw-lifecycle.js'); } catch(e) { console.warn('sw-lifecycle.js not loaded:', e.message); }
try { importScripts('src/shared/error-tracker.js'); } catch(e) { console.warn('error-tracker.js not loaded:', e.message); }
try { importScripts('src/shared/debug-logger.js'); } catch(e) { console.warn('debug-logger.js not loaded:', e.message); }

// Growth & Retention modules (MD 14, MD 17)
try { importScripts('src/shared/milestone-tracker.js'); } catch(e) { console.warn('milestone-tracker.js not loaded:', e.message); }
try { importScripts('src/shared/churn-detector.js'); } catch(e) { console.warn('churn-detector.js not loaded:', e.message); }
try { importScripts('src/shared/engagement-score.js'); } catch(e) { console.warn('engagement-score.js not loaded:', e.message); }
try { importScripts('src/shared/retention-triggers.js'); } catch(e) { console.warn('retention-triggers.js not loaded:', e.message); }
try { importScripts('src/shared/growth-prompts.js'); } catch(e) { console.warn('growth-prompts.js not loaded:', e.message); }

// Customer Support & Feedback (MD 19)
try { importScripts('src/shared/feedback-collector.js'); } catch(e) { console.warn('feedback-collector.js not loaded:', e.message); }
try { importScripts('src/shared/support-diagnostics.js'); } catch(e) { console.warn('support-diagnostics.js not loaded:', e.message); }

// Performance modules (MD 20)
try { importScripts('src/shared/perf-timer.js'); } catch(e) { console.warn('perf-timer.js not loaded:', e.message); }
try { importScripts('src/shared/performance-monitor.js'); } catch(e) { console.warn('performance-monitor.js not loaded:', e.message); }
try { importScripts('src/shared/storage-optimizer.js'); } catch(e) { console.warn('storage-optimizer.js not loaded:', e.message); }

// Accessibility (MD 21)
try { importScripts('src/shared/accessibility.js'); } catch(e) { console.warn('accessibility.js not loaded:', e.message); }

// Version & Release (MD 22)
try { importScripts('src/shared/version-manager.js'); } catch(e) { console.warn('version-manager.js not loaded:', e.message); }

// Legal Compliance (MD 23)
try { importScripts('src/shared/legal-compliance.js'); } catch(e) { console.warn('legal-compliance.js not loaded:', e.message); }

// Architecture Patterns (MD 24)
try { importScripts('src/shared/architecture-patterns.js'); } catch(e) { console.warn('architecture-patterns.js not loaded:', e.message); }

// Feature Gating (Phase 05)
try { importScripts('src/features/feature-registry.js'); } catch(e) { console.warn('feature-registry.js not loaded:', e.message); }
try { importScripts('src/features/usage-tracker.js'); } catch(e) { console.warn('usage-tracker.js not loaded:', e.message); }

// Utility modules
try { importScripts('src/utils/cookies.js'); } catch(e) { console.warn('utils/cookies.js not loaded:', e.message); }
try { importScripts('src/utils/jwt.js'); } catch(e) { console.warn('utils/jwt.js not loaded:', e.message); }
try { importScripts('src/utils/storage.js'); } catch(e) { console.warn('utils/storage.js not loaded:', e.message); }

// Payment & Licensing (MD 08)
try { importScripts('src/utils/license-manager.js'); } catch(e) { console.warn('license-manager.js not loaded:', e.message); }
try { importScripts('src/utils/trial-manager.js'); } catch(e) { console.warn('trial-manager.js not loaded:', e.message); }

// ============================================================================
// Error Tracking & Monitoring (MD 11 - Crash Analytics)
// ============================================================================

const _swStartupTime = Date.now();
const _debugLogBuffer = [];
const DEBUG_BUFFER_MAX = 200;
const ERROR_LOG_MAX = 50;

function debugLog(level, source, message, data = null) {
    const entry = { level, source, message, data, timestamp: Date.now() };
    _debugLogBuffer.push(entry);
    while (_debugLogBuffer.length > DEBUG_BUFFER_MAX) _debugLogBuffer.shift();

    const tag = `[${source}]`;
    if (level === 'error') console.error(tag, message, data ?? '');
    else if (level === 'warn') console.warn(tag, message, data ?? '');
    else console.log(tag, message, data ?? '');
}

async function storeErrorLog(errorEntry) {
    try {
        const { errorLogs = [] } = await chrome.storage.local.get('errorLogs');
        errorLogs.push({ ...errorEntry, timestamp: errorEntry.timestamp || Date.now() });
        while (errorLogs.length > ERROR_LOG_MAX) errorLogs.shift();
        await chrome.storage.local.set({ errorLogs });
    } catch (e) {
        console.error('[Monitoring] Failed to store error log:', e);
    }
}

async function recordStartupTimestamp(reason) {
    try {
        const { startupHistory = [] } = await chrome.storage.local.get('startupHistory');
        startupHistory.push({ reason, timestamp: Date.now(), swStartupTime: _swStartupTime });
        while (startupHistory.length > 20) startupHistory.shift();
        await chrome.storage.local.set({ startupHistory });
    } catch (e) {
        console.error('[Monitoring] Failed to record startup:', e);
    }
}

async function getHealthReport() {
    try {
        const data = await chrome.storage.local.get(['errorLogs', 'startupHistory', 'analytics']);
        const errorLogs = data.errorLogs || [];
        const startupHistory = data.startupHistory || [];
        const analytics = data.analytics || [];
        const now = Date.now();

        return {
            uptime: now - _swStartupTime,
            errorCount: errorLogs.length,
            errorsLastHour: errorLogs.filter(e => e.timestamp > now - 3600000).length,
            errorsLastDay: errorLogs.filter(e => e.timestamp > now - 86400000).length,
            startupCount: startupHistory.length,
            lastStartup: startupHistory.length > 0 ? startupHistory[startupHistory.length - 1] : null,
            analyticsEventCount: analytics.length,
            debugBufferSize: _debugLogBuffer.length,
            timestamp: now
        };
    } catch (e) {
        return { error: e.message, timestamp: Date.now() };
    }
}

// Global error handlers for service worker
self.addEventListener('error', (event) => {
    const errorEntry = {
        type: 'uncaught_error',
        message: event.message || 'Unknown error',
        filename: event.filename || '',
        lineno: event.lineno || 0,
        colno: event.colno || 0,
        source: 'service-worker',
        timestamp: Date.now()
    };
    debugLog('error', 'GlobalHandler', 'Uncaught error', errorEntry);
    storeErrorLog(errorEntry);
});

self.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const errorEntry = {
        type: 'unhandled_rejection',
        message: reason?.message || String(reason) || 'Unknown rejection',
        stack: reason?.stack || '',
        source: 'service-worker',
        timestamp: Date.now()
    };
    debugLog('error', 'GlobalHandler', 'Unhandled rejection', errorEntry);
    storeErrorLog(errorEntry);
});

debugLog('info', 'Monitoring', 'Error tracking & monitoring initialized (MD 11)');

// ============================================================================
// MV3 Architecture Integration (MD 12)
// ============================================================================

// Initialize lifecycle manager
if (typeof SwLifecycle !== 'undefined') {
    SwLifecycle.init();

    // Register periodic maintenance alarm (every 30 minutes)
    SwLifecycle.registerAlarm('maintenance', 30, async () => {
        debugLog('info', 'Maintenance', 'Running periodic maintenance');

        // Trim error logs
        try {
            const { errorLogs = [] } = await chrome.storage.local.get('errorLogs');
            if (errorLogs.length > ERROR_LOG_MAX) {
                await chrome.storage.local.set({ errorLogs: errorLogs.slice(-ERROR_LOG_MAX) });
            }
        } catch (e) {
            debugLog('warn', 'Maintenance', 'Error trimming logs', e.message);
        }

        // Trim analytics
        try {
            const { analytics = [] } = await chrome.storage.local.get('analytics');
            if (analytics.length > 100) {
                await chrome.storage.local.set({ analytics: analytics.slice(-100) });
            }
        } catch (e) {
            debugLog('warn', 'Maintenance', 'Error trimming analytics', e.message);
        }

        // Storage auto-compact (MD 20)
        if (typeof StorageOptimizer !== 'undefined') {
            try {
                await StorageOptimizer.autoCompact();
                debugLog('info', 'Maintenance', 'Storage auto-compact complete');
            } catch (e) {
                debugLog('warn', 'Maintenance', 'Storage auto-compact failed', e.message);
            }
        }
    });

    debugLog('info', 'MV3', 'Lifecycle manager initialized');
}

// Run storage migrations on startup
if (typeof StorageSchema !== 'undefined') {
    StorageSchema.migrate().then(result => {
        if (result && result.migrated) {
            debugLog('info', 'MV3', 'Storage migration complete', result);
        }
    }).catch(e => {
        debugLog('warn', 'MV3', 'Storage migration error', e.message);
    });
}

// ============================================================================
// Security Hardening (MD 18 - Security Audit)
// ============================================================================

// Validate message sender origin
function isValidSender(sender) {
    if (typeof MessageValidator !== 'undefined' && typeof MessageValidator.isInternalSender === 'function') {
        return MessageValidator.isInternalSender(sender);
    }
    // Fallback: check sender.id matches our extension
    try {
        return sender && sender.id === chrome.runtime.id;
    } catch (e) {
        return false;
    }
}

// Validate and sanitize incoming message
function validateIncomingMessage(message) {
    if (typeof MessageValidator !== 'undefined' && typeof MessageValidator.validateMessage === 'function') {
        return MessageValidator.validateMessage(message);
    }
    // Fallback: basic validation
    if (!message || typeof message.action !== 'string') {
        return { valid: false, errors: ['Missing or invalid action'] };
    }
    return { valid: true, errors: [] };
}

// Sanitize string input for cookie operations
function sanitizeInput(str, maxLen) {
    if (typeof SecurityHardener !== 'undefined' && typeof SecurityHardener.sanitizeString === 'function') {
        return SecurityHardener.sanitizeString(str, maxLen);
    }
    if (typeof str !== 'string') return '';
    return str.trim().substring(0, maxLen || 4096);
}

debugLog('info', 'Security', 'Security hardening initialized (MD 18)');

// ============================================================================
// Cookie Operations (inline to avoid module loading issues in MV3)
// ============================================================================

const CookieOps = {
    async getAll(url) {
        try {
            const domain = new URL(url).hostname;
            return await chrome.cookies.getAll({ domain });
        } catch (error) {
            console.error('[ServiceWorker] Error getting cookies:', error);
            return [];
        }
    },

    async set(cookie) {
        try {
            const { domain, ...rest } = cookie;
            const cleanDomain = domain.startsWith('.') ? domain.slice(1) : domain;
            const url = `http${cookie.secure ? 's' : ''}://${cleanDomain}${cookie.path || '/'}`;

            return await chrome.cookies.set({
                url,
                domain,
                ...rest
            });
        } catch (error) {
            console.error('[ServiceWorker] Error setting cookie:', error);
            return null;
        }
    },

    async remove(url, name) {
        try {
            return await chrome.cookies.remove({ url, name });
        } catch (error) {
            console.error('[ServiceWorker] Error removing cookie:', error);
            return null;
        }
    },

    async clearDomain(domain) {
        try {
            const cookies = await chrome.cookies.getAll({ domain });
            let count = 0;

            for (const cookie of cookies) {
                const cookieDomain = cookie.domain.startsWith('.')
                    ? cookie.domain.slice(1)
                    : cookie.domain;
                const url = `http${cookie.secure ? 's' : ''}://${cookieDomain}${cookie.path}`;
                await chrome.cookies.remove({ url, name: cookie.name });
                count++;
            }

            return count;
        } catch (error) {
            console.error('[ServiceWorker] Error clearing domain:', error);
            return 0;
        }
    },

    toJSON(cookies) {
        return JSON.stringify(cookies, null, 2);
    },

    toNetscape(cookies) {
        const lines = ['# Netscape HTTP Cookie File', '# Generated by Cookie Manager (zovo.one)'];

        for (const c of cookies) {
            const httpOnly = c.httpOnly ? '#HttpOnly_' : '';
            const domain = c.domain.startsWith('.') ? c.domain : `.${c.domain}`;
            const flag = c.domain.startsWith('.') ? 'TRUE' : 'FALSE';
            const secure = c.secure ? 'TRUE' : 'FALSE';
            const expiry = c.expirationDate ? Math.floor(c.expirationDate) : '0';

            lines.push(`${httpOnly}${domain}\t${flag}\t${c.path}\t${secure}\t${expiry}\t${c.name}\t${c.value}`);
        }

        return lines.join('\n');
    }
};

// ============================================================================
// Storage Operations
// ============================================================================

const STORAGE_DEFAULTS = {
    readOnlyMode: false,
    protectedDomains: []
};

async function getSettings() {
    try {
        const result = await chrome.storage.local.get(STORAGE_DEFAULTS);
        return { ...STORAGE_DEFAULTS, ...result };
    } catch {
        return STORAGE_DEFAULTS;
    }
}

async function isProtected(domain) {
    const settings = await getSettings();
    return settings.protectedDomains.some(d => domain.endsWith(d));
}

// ============================================================================
// Message Handler
// ============================================================================

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // Security: validate sender origin (MD 18)
    if (!isValidSender(sender)) {
        debugLog('warn', 'Security', 'Rejected message from unknown sender', { senderId: sender?.id });
        sendResponse({ error: 'Unauthorized sender' });
        return true;
    }

    // Security: validate message structure (MD 18)
    var validation = validateIncomingMessage(message);
    if (!validation.valid) {
        debugLog('warn', 'Security', 'Rejected invalid message', { errors: validation.errors });
        sendResponse({ error: 'Invalid message: ' + validation.errors.join(', ') });
        return true;
    }

    handleMessage(message).then(sendResponse);
    return true; // Indicates async response
});

async function handleMessage(message) {
    const { action, payload } = message;

    debugLog('info', 'MessageHandler', 'Received message: ' + action);

    try {
        switch (action) {
            case 'GET_COOKIES':
                return await CookieOps.getAll(payload.url);

            case 'SET_COOKIE': {
                const settings = await getSettings();
                const domain = payload.domain.startsWith('.')
                    ? payload.domain.slice(1)
                    : payload.domain;

                if (settings.readOnlyMode) {
                    return { error: 'Read-only mode is enabled' };
                }

                if (await isProtected(domain)) {
                    return { error: 'Domain is protected' };
                }

                // Sanitize cookie fields (MD 18)
                var sanitizedPayload = {
                    name: sanitizeInput(payload.name, 256),
                    value: payload.value != null ? String(payload.value) : '',
                    domain: sanitizeInput(payload.domain, 253),
                    path: sanitizeInput(payload.path, 1024) || '/',
                    secure: !!payload.secure,
                    httpOnly: !!payload.httpOnly,
                    sameSite: ['lax', 'strict', 'no_restriction'].indexOf(payload.sameSite) !== -1 ? payload.sameSite : 'lax'
                };
                if (payload.expirationDate != null && typeof payload.expirationDate === 'number') {
                    sanitizedPayload.expirationDate = payload.expirationDate;
                }

                const result = await CookieOps.set(sanitizedPayload);
                return result || { error: 'Failed to set cookie' };
            }

            case 'DELETE_COOKIE': {
                const settings = await getSettings();

                if (settings.readOnlyMode) {
                    return { error: 'Read-only mode is enabled' };
                }

                // Extract domain from the URL for protection check
                try {
                    const deleteDomain = new URL(payload.url).hostname;
                    if (await isProtected(deleteDomain)) {
                        return { error: 'Domain is protected' };
                    }
                } catch (_) { /* invalid URL - let chrome.cookies.remove handle it */ }

                return await CookieOps.remove(payload.url, payload.name);
            }

            case 'CLEAR_DOMAIN': {
                const settings = await getSettings();

                if (settings.readOnlyMode) {
                    return { error: 'Read-only mode is enabled' };
                }

                if (await isProtected(payload.domain)) {
                    return { error: 'Domain is protected' };
                }

                return await CookieOps.clearDomain(payload.domain);
            }

            case 'EXPORT_COOKIES': {
                const cookies = await CookieOps.getAll(payload.url);
                if (payload.format === 'netscape') {
                    return CookieOps.toNetscape(cookies);
                }
                return CookieOps.toJSON(cookies);
            }

            case 'GET_SETTINGS':
                return await getSettings();

            // ==============================================================
            // Error Tracking & Monitoring Messages (MD 11)
            // ==============================================================

            case 'REPORT_ERROR': {
                const errorEntry = {
                    type: payload.type || 'reported_error',
                    message: payload.message || 'Unknown error',
                    stack: payload.stack || '',
                    source: payload.source || 'popup',
                    context: payload.context || {},
                    timestamp: payload.timestamp || Date.now()
                };
                debugLog('error', 'ReportedError', errorEntry.message, errorEntry);
                await storeErrorLog(errorEntry);
                return { success: true };
            }

            case 'REPORT_ERRORS_BATCH': {
                const errors = payload.errors || [];
                for (const err of errors) {
                    await storeErrorLog({
                        type: err.type || 'reported_error',
                        message: err.message || 'Unknown error',
                        stack: err.stack || '',
                        source: err.source || 'popup',
                        timestamp: err.timestamp || Date.now()
                    });
                }
                debugLog('info', 'ReportedError', `Batch received: ${errors.length} error(s)`);
                return { success: true, count: errors.length };
            }

            case 'GET_ERROR_LOGS': {
                const { errorLogs = [] } = await chrome.storage.local.get('errorLogs');
                return errorLogs;
            }

            case 'CLEAR_ERROR_LOGS': {
                await chrome.storage.local.set({ errorLogs: [] });
                debugLog('info', 'Monitoring', 'Error logs cleared');
                return { success: true };
            }

            case 'GET_DEBUG_LOGS': {
                return [..._debugLogBuffer];
            }

            case 'GET_HEALTH_REPORT': {
                return await getHealthReport();
            }

            case 'TOGGLE_DEBUG_MODE': {
                const { debugMode = false } = await chrome.storage.local.get('debugMode');
                const newMode = payload?.enabled !== undefined ? payload.enabled : !debugMode;
                await chrome.storage.local.set({ debugMode: newMode });
                debugLog('info', 'Monitoring', `Debug mode ${newMode ? 'enabled' : 'disabled'}`);
                return { debugMode: newMode };
            }

            // ==============================================================
            // Growth & Milestones (MD 14)
            // ==============================================================

            case 'GET_MILESTONES': {
                const { _milestones = {}, _milestonesReached = [] } = await chrome.storage.local.get(['_milestones', '_milestonesReached']);
                return { counters: _milestones, reached: _milestonesReached };
            }

            case 'GET_GROWTH_STATS': {
                const data = await chrome.storage.local.get(['_milestones', '_milestonesReached', '_reviewPromptState', 'analytics']);
                return {
                    milestones: data._milestones || {},
                    reached: data._milestonesReached || [],
                    reviewState: data._reviewPromptState || null,
                    totalEvents: (data.analytics || []).length
                };
            }

            // ==============================================================
            // Churn Prevention & Retention Messages (MD 17)
            // ==============================================================

            case 'GET_CHURN_STATUS': {
                const { lastChurnAssessment = null } = await chrome.storage.local.get('lastChurnAssessment');
                return lastChurnAssessment;
            }

            case 'GET_ENGAGEMENT_SCORE': {
                if (typeof EngagementScore !== 'undefined') {
                    try {
                        return await EngagementScore.getSummary();
                    } catch (e) {
                        return { error: e.message };
                    }
                }
                return { error: 'EngagementScore not available' };
            }

            case 'GET_RETENTION_TRIGGER': {
                if (typeof RetentionTriggers !== 'undefined') {
                    try {
                        return await RetentionTriggers.getNextTrigger();
                    } catch (e) {
                        return { error: e.message };
                    }
                }
                return { error: 'RetentionTriggers not available' };
            }

            case 'RECORD_USAGE': {
                if (typeof ChurnDetector !== 'undefined') {
                    try {
                        await ChurnDetector.recordUsage(payload?.usageAction);
                        return { success: true };
                    } catch (e) {
                        return { error: e.message };
                    }
                }
                return { error: 'ChurnDetector not available' };
            }

            case 'DISMISS_TRIGGER': {
                if (typeof RetentionTriggers !== 'undefined') {
                    try {
                        await RetentionTriggers.dismissTrigger(payload?.triggerId);
                        return { success: true };
                    } catch (e) {
                        return { error: e.message };
                    }
                }
                return { error: 'RetentionTriggers not available' };
            }

            // ==============================================================
            // Customer Support & Feedback (MD 19)
            // ==============================================================

            case 'SUBMIT_FEEDBACK': {
                if (typeof FeedbackCollector !== 'undefined') {
                    try {
                        var entry = await FeedbackCollector.submitFeedback(
                            payload.type || 'other',
                            payload.message || '',
                            payload.metadata || {}
                        );
                        return entry ? { success: true, entry: entry } : { error: 'Empty feedback' };
                    } catch (e) {
                        return { error: e.message };
                    }
                }
                return { error: 'FeedbackCollector not available' };
            }

            case 'GET_FEEDBACK_STATS': {
                if (typeof FeedbackCollector !== 'undefined') {
                    try {
                        return await FeedbackCollector.getFeedbackStats();
                    } catch (e) {
                        return { error: e.message };
                    }
                }
                return { error: 'FeedbackCollector not available' };
            }

            case 'GET_FEEDBACK': {
                if (typeof FeedbackCollector !== 'undefined') {
                    try {
                        return await FeedbackCollector.getFeedback(payload || {});
                    } catch (e) {
                        return { error: e.message };
                    }
                }
                return { error: 'FeedbackCollector not available' };
            }

            case 'EXPORT_FEEDBACK': {
                if (typeof FeedbackCollector !== 'undefined') {
                    try {
                        return await FeedbackCollector.exportFeedback();
                    } catch (e) {
                        return { error: e.message };
                    }
                }
                return { error: 'FeedbackCollector not available' };
            }

            case 'GET_DIAGNOSTICS': {
                if (typeof SupportDiagnostics !== 'undefined') {
                    try {
                        return await SupportDiagnostics.generateDebugBundle();
                    } catch (e) {
                        return { error: e.message };
                    }
                }
                return { error: 'SupportDiagnostics not available' };
            }

            case 'GET_QUICK_CHECK': {
                if (typeof SupportDiagnostics !== 'undefined') {
                    try {
                        return await SupportDiagnostics.quickCheck();
                    } catch (e) {
                        return { error: e.message };
                    }
                }
                return { error: 'SupportDiagnostics not available' };
            }

            // ==============================================================
            // Performance Monitoring (MD 20)
            // ==============================================================

            case 'GET_PERF_SUMMARY': {
                if (typeof PerfTimer !== 'undefined') {
                    try {
                        return PerfTimer.getSummary();
                    } catch (e) {
                        return { error: e.message };
                    }
                }
                return { error: 'PerfTimer not available' };
            }

            case 'CHECK_PERF_BUDGETS': {
                if (typeof PerfTimer !== 'undefined') {
                    try {
                        return PerfTimer.checkBudgets();
                    } catch (e) {
                        return { error: e.message };
                    }
                }
                return { error: 'PerfTimer not available' };
            }

            case 'GET_STORAGE_USAGE': {
                if (typeof StorageOptimizer !== 'undefined') {
                    try {
                        return await StorageOptimizer.getUsage();
                    } catch (e) {
                        return { error: e.message };
                    }
                }
                return { error: 'StorageOptimizer not available' };
            }

            case 'RUN_STORAGE_CLEANUP': {
                if (typeof StorageOptimizer !== 'undefined') {
                    try {
                        return await StorageOptimizer.autoCompact();
                    } catch (e) {
                        return { error: e.message };
                    }
                }
                return { error: 'StorageOptimizer not available' };
            }

            case 'ANALYZE_STORAGE_KEYS': {
                if (typeof StorageOptimizer !== 'undefined') {
                    try {
                        return await StorageOptimizer.analyzeKeys();
                    } catch (e) {
                        return { error: e.message };
                    }
                }
                return { error: 'StorageOptimizer not available' };
            }

            // ==============================================================
            // Version & Release Management (MD 22)
            // ==============================================================

            case 'GET_VERSION_INFO': {
                if (typeof VersionManager !== 'undefined') {
                    try {
                        return {
                            version: VersionManager.getVersion(),
                            displayVersion: VersionManager.getDisplayVersion(),
                            isPreRelease: VersionManager.isPreRelease()
                        };
                    } catch (e) { return { error: e.message }; }
                }
                return { error: 'VersionManager not available' };
            }

            case 'GET_FEATURE_FLAGS': {
                if (typeof VersionManager !== 'undefined') {
                    try {
                        return VersionManager.getFlags();
                    } catch (e) { return { error: e.message }; }
                }
                return { error: 'VersionManager not available' };
            }

            case 'SET_FEATURE_FLAG': {
                if (typeof VersionManager !== 'undefined') {
                    try {
                        var flagName = payload?.flagName;
                        var enabled = payload?.enabled;
                        return VersionManager.setOverride(flagName, enabled);
                    } catch (e) { return { error: e.message }; }
                }
                return { error: 'VersionManager not available' };
            }

            case 'GET_UPDATE_HISTORY': {
                if (typeof VersionManager !== 'undefined') {
                    try {
                        return await VersionManager.getUpdateHistory();
                    } catch (e) { return { error: e.message }; }
                }
                return { error: 'VersionManager not available' };
            }

            // ==============================================================
            // Legal Compliance (MD 23)
            // ==============================================================

            case 'GET_PRIVACY_SUMMARY': {
                if (typeof LegalCompliance !== 'undefined') {
                    try {
                        return LegalCompliance.PrivacyConfig.getPrivacySummary();
                    } catch (e) { return { error: e.message }; }
                }
                return { error: 'LegalCompliance not available' };
            }

            case 'EXPORT_USER_DATA': {
                if (typeof LegalCompliance !== 'undefined') {
                    try {
                        var exportResult = await LegalCompliance.DataRights.exportUserData();
                        await LegalCompliance.ComplianceLog.logRequest('export', { keyCount: Object.keys(exportResult.data || {}).length });
                        return exportResult;
                    } catch (e) { return { error: e.message }; }
                }
                return { error: 'LegalCompliance not available' };
            }

            case 'DELETE_USER_DATA': {
                if (typeof LegalCompliance !== 'undefined') {
                    try {
                        var keepEssential = payload && payload.keepEssential !== false;
                        var deleteResult = await LegalCompliance.DataRights.deleteUserData({ keepEssential: keepEssential });
                        await LegalCompliance.ComplianceLog.logRequest('delete', { keepEssential: keepEssential });
                        return deleteResult;
                    } catch (e) { return { error: e.message }; }
                }
                return { error: 'LegalCompliance not available' };
            }

            case 'GET_DATA_SUMMARY': {
                if (typeof LegalCompliance !== 'undefined') {
                    try {
                        return await LegalCompliance.DataRights.getDataSummary();
                    } catch (e) { return { error: e.message }; }
                }
                return { error: 'LegalCompliance not available' };
            }

            case 'GET_CONSENT_STATUS': {
                if (typeof LegalCompliance !== 'undefined') {
                    try {
                        return await LegalCompliance.ConsentManager.getConsent();
                    } catch (e) { return { error: e.message }; }
                }
                return { error: 'LegalCompliance not available' };
            }

            case 'SET_CONSENT': {
                if (typeof LegalCompliance !== 'undefined') {
                    try {
                        var consentResult = await LegalCompliance.ConsentManager.saveConsent(payload || {});
                        await LegalCompliance.ComplianceLog.logRequest('consent_change', payload || {});
                        return consentResult;
                    } catch (e) { return { error: e.message }; }
                }
                return { error: 'LegalCompliance not available' };
            }

            case 'GET_COMPLIANCE_LOG': {
                if (typeof LegalCompliance !== 'undefined') {
                    try {
                        return await LegalCompliance.ComplianceLog.getRequestLog(payload || {});
                    } catch (e) { return { error: e.message }; }
                }
                return { error: 'LegalCompliance not available' };
            }

            // ==============================================================
            // Extended Cookie Operations
            // ==============================================================

            case 'GET_ALL_COOKIES': {
                try {
                    const filters = {};
                    if (payload?.domain) filters.domain = payload.domain;
                    if (payload?.name) filters.name = payload.name;
                    if (payload?.url) filters.url = payload.url;
                    const cookies = await chrome.cookies.getAll(filters);
                    return cookies || [];
                } catch (e) {
                    debugLog('error', 'CookieOps', 'GET_ALL_COOKIES failed', e.message);
                    return { error: e.message };
                }
            }

            // ==============================================================
            // Cookie Profiles (save/load cookie sets)
            // ==============================================================

            case 'SAVE_COOKIE_PROFILE': {
                try {
                    const profileName = sanitizeInput(payload?.name, 128);
                    if (!profileName) {
                        return { error: 'Profile name is required' };
                    }

                    // Get cookies to save in the profile
                    let cookiesToSave = payload?.cookies;
                    if (!cookiesToSave && payload?.url) {
                        cookiesToSave = await CookieOps.getAll(payload.url);
                    }
                    if (!cookiesToSave || !Array.isArray(cookiesToSave) || cookiesToSave.length === 0) {
                        return { error: 'No cookies to save in profile' };
                    }

                    const { cookieProfiles = {} } = await chrome.storage.local.get('cookieProfiles');
                    cookieProfiles[profileName] = {
                        cookies: cookiesToSave,
                        createdAt: Date.now(),
                        updatedAt: Date.now(),
                        cookieCount: cookiesToSave.length
                    };

                    await chrome.storage.local.set({ cookieProfiles });
                    debugLog('info', 'Profiles', `Saved profile "${profileName}" with ${cookiesToSave.length} cookies`);
                    return { success: true, name: profileName, cookieCount: cookiesToSave.length };
                } catch (e) {
                    debugLog('error', 'Profiles', 'SAVE_COOKIE_PROFILE failed', e.message);
                    return { error: e.message };
                }
            }

            case 'LOAD_COOKIE_PROFILE': {
                try {
                    const profileName = sanitizeInput(payload?.name, 128);
                    if (!profileName) {
                        return { error: 'Profile name is required' };
                    }

                    const { cookieProfiles = {} } = await chrome.storage.local.get('cookieProfiles');
                    const profile = cookieProfiles[profileName];
                    if (!profile) {
                        return { error: `Profile "${profileName}" not found` };
                    }

                    const settingsCheck = await getSettings();
                    if (settingsCheck.readOnlyMode) {
                        return { error: 'Read-only mode is enabled' };
                    }

                    let restored = 0;
                    let failed = 0;
                    for (const cookie of profile.cookies) {
                        try {
                            const result = await CookieOps.set(cookie);
                            if (result) {
                                restored++;
                            } else {
                                failed++;
                            }
                        } catch {
                            failed++;
                        }
                    }

                    debugLog('info', 'Profiles', `Loaded profile "${profileName}": ${restored} restored, ${failed} failed`);
                    return { success: true, name: profileName, restored, failed, total: profile.cookies.length };
                } catch (e) {
                    debugLog('error', 'Profiles', 'LOAD_COOKIE_PROFILE failed', e.message);
                    return { error: e.message };
                }
            }

            case 'GET_COOKIE_PROFILES': {
                try {
                    const { cookieProfiles = {} } = await chrome.storage.local.get('cookieProfiles');
                    const list = Object.entries(cookieProfiles).map(([name, profile]) => ({
                        name,
                        cookieCount: profile.cookieCount || 0,
                        createdAt: profile.createdAt,
                        updatedAt: profile.updatedAt
                    }));
                    return list;
                } catch (e) {
                    debugLog('error', 'Profiles', 'GET_COOKIE_PROFILES failed', e.message);
                    return { error: e.message };
                }
            }

            case 'DELETE_COOKIE_PROFILE': {
                try {
                    const profileName = sanitizeInput(payload?.name, 128);
                    if (!profileName) {
                        return { error: 'Profile name is required' };
                    }

                    const { cookieProfiles = {} } = await chrome.storage.local.get('cookieProfiles');
                    if (!cookieProfiles[profileName]) {
                        return { error: `Profile "${profileName}" not found` };
                    }

                    delete cookieProfiles[profileName];
                    await chrome.storage.local.set({ cookieProfiles });
                    debugLog('info', 'Profiles', `Deleted profile "${profileName}"`);
                    return { success: true, name: profileName };
                } catch (e) {
                    debugLog('error', 'Profiles', 'DELETE_COOKIE_PROFILE failed', e.message);
                    return { error: e.message };
                }
            }

            // ==============================================================
            // Settings Management
            // ==============================================================

            case 'SAVE_SETTINGS': {
                try {
                    const allowedKeys = ['readOnlyMode', 'protectedDomains', 'showHttpOnly',
                        'showSecure', 'showSessionCookies', 'defaultExportFormat',
                        'theme', 'sortBy', 'sortOrder'];
                    const updates = {};
                    for (const key of allowedKeys) {
                        if (payload && payload[key] !== undefined) {
                            updates[key] = payload[key];
                        }
                    }
                    if (Object.keys(updates).length === 0) {
                        return { error: 'No valid settings to save' };
                    }
                    await chrome.storage.local.set(updates);
                    debugLog('info', 'Settings', 'Settings saved', Object.keys(updates));
                    return { success: true, updated: Object.keys(updates) };
                } catch (e) {
                    debugLog('error', 'Settings', 'SAVE_SETTINGS failed', e.message);
                    return { error: e.message };
                }
            }

            // ==============================================================
            // Auto-Delete Rules
            // ==============================================================

            case 'GET_AUTO_DELETE_RULES': {
                try {
                    const { autoDeleteRules = [] } = await chrome.storage.local.get('autoDeleteRules');
                    return autoDeleteRules;
                } catch (e) {
                    debugLog('error', 'AutoDelete', 'GET_AUTO_DELETE_RULES failed', e.message);
                    return { error: e.message };
                }
            }

            case 'SAVE_AUTO_DELETE_RULE': {
                try {
                    const domain = sanitizeInput(payload?.domain, 253);
                    if (!domain) {
                        return { error: 'Domain is required for auto-delete rule' };
                    }

                    var rawInterval = payload?.intervalMinutes;
                    // 0 means "on browser close", so allow it explicitly
                    var intervalMinutes = (typeof rawInterval === 'number' && rawInterval >= 0)
                        ? Math.min(rawInterval, 10080)
                        : 60;

                    // Security: sanitize rule pattern - only allow alphanumeric, *, -, _, .
                    // to prevent regex injection when pattern is used in auto-delete matching (MD 18)
                    var rawPattern = sanitizeInput(payload?.pattern, 256) || '*';
                    var safePattern = rawPattern.replace(/[^a-zA-Z0-9*\-_.]/g, '');
                    if (!safePattern) safePattern = '*';

                    // Security: sanitize rule ID to prevent injection (MD 18)
                    var ruleId = payload?.id ? sanitizeInput(payload.id, 64).replace(/[^a-zA-Z0-9_\-]/g, '') : '';
                    if (!ruleId) ruleId = `rule_${Date.now()}`;

                    const rule = {
                        id: ruleId,
                        domain: domain,
                        pattern: safePattern,
                        intervalMinutes: intervalMinutes,
                        enabled: payload?.enabled !== false,
                        createdAt: Date.now()
                    };

                    const { autoDeleteRules = [] } = await chrome.storage.local.get('autoDeleteRules');
                    const existingIndex = autoDeleteRules.findIndex(r => r.id === rule.id);
                    if (existingIndex >= 0) {
                        autoDeleteRules[existingIndex] = rule;
                    } else {
                        autoDeleteRules.push(rule);
                    }

                    await chrome.storage.local.set({ autoDeleteRules });

                    // Ensure auto-delete alarm is running
                    await chrome.alarms.create('auto-delete-cookies', { periodInMinutes: 1 });

                    debugLog('info', 'AutoDelete', `Saved rule for ${domain}`, rule);
                    return { success: true, rule };
                } catch (e) {
                    debugLog('error', 'AutoDelete', 'SAVE_AUTO_DELETE_RULE failed', e.message);
                    return { error: e.message };
                }
            }

            case 'DELETE_AUTO_DELETE_RULE': {
                try {
                    const ruleId = payload?.id;
                    if (!ruleId) {
                        return { error: 'Rule ID is required' };
                    }

                    const { autoDeleteRules = [] } = await chrome.storage.local.get('autoDeleteRules');
                    const filtered = autoDeleteRules.filter(r => r.id !== ruleId);
                    await chrome.storage.local.set({ autoDeleteRules: filtered });

                    // If no rules left, cancel the alarm
                    if (filtered.length === 0 || filtered.every(r => !r.enabled)) {
                        await chrome.alarms.clear('auto-delete-cookies');
                    }

                    debugLog('info', 'AutoDelete', `Deleted rule ${ruleId}`);
                    return { success: true };
                } catch (e) {
                    debugLog('error', 'AutoDelete', 'DELETE_AUTO_DELETE_RULE failed', e.message);
                    return { error: e.message };
                }
            }

            // ==============================================================
            // Payment & Licensing (MD 08)
            // ==============================================================

            case 'CHECK_LICENSE': {
                if (typeof LicenseManager !== 'undefined') {
                    try {
                        var storedKeyData = await chrome.storage.local.get('licenseKey');
                        var storedKey = storedKeyData.licenseKey || null;
                        var licenseResult = await LicenseManager.checkLicense(storedKey, !!(payload && payload.forceRefresh));
                        return { success: true, data: licenseResult };
                    } catch (e) {
                        return { error: e.message };
                    }
                }
                return { error: 'LicenseManager not available' };
            }

            case 'ACTIVATE_LICENSE': {
                if (typeof LicenseManager !== 'undefined') {
                    try {
                        var activateKey = payload && payload.licenseKey;
                        if (!activateKey) {
                            return { error: 'License key is required' };
                        }
                        var activateResult = await LicenseManager.activateLicense(activateKey);
                        return { success: true, data: activateResult };
                    } catch (e) {
                        return { error: e.message };
                    }
                }
                return { error: 'LicenseManager not available' };
            }

            case 'DEACTIVATE_LICENSE': {
                if (typeof LicenseManager !== 'undefined') {
                    try {
                        var deactivateResult = await LicenseManager.deactivateLicense();
                        return { success: true, data: deactivateResult };
                    } catch (e) {
                        return { error: e.message };
                    }
                }
                return { error: 'LicenseManager not available' };
            }

            case 'GET_LICENSE_STATUS': {
                if (typeof LicenseManager !== 'undefined') {
                    try {
                        var tier = await LicenseManager.getTier();
                        var isProUser = await LicenseManager.isPro();
                        var features = await LicenseManager.getFeatures();
                        var expiresAt = await LicenseManager.getExpiryDate();
                        return {
                            success: true,
                            data: {
                                tier: tier,
                                isPro: isProUser,
                                features: features,
                                expiresAt: expiresAt
                            }
                        };
                    } catch (e) {
                        return { error: e.message };
                    }
                }
                return { error: 'LicenseManager not available' };
            }

            // ==============================================================
            // Trial Management (MD 08)
            // ==============================================================

            case 'GET_TRIAL_STATUS': {
                if (typeof TrialManager !== 'undefined') {
                    try {
                        var trialStatus = await TrialManager.getStatus();
                        return { success: true, data: trialStatus };
                    } catch (e) {
                        return { error: e.message };
                    }
                }
                return { error: 'TrialManager not available' };
            }

            case 'CHECK_TRIAL_AND_LICENSE': {
                var combinedResult = {
                    trial: { trialActive: false, trialDaysLeft: 0, trialExpired: false, trialStarted: false },
                    license: { isPro: false, tier: 'free' },
                    effectivelyPro: false
                };

                // Get trial status
                if (typeof TrialManager !== 'undefined') {
                    try {
                        combinedResult.trial = await TrialManager.getStatus();
                    } catch (e) {
                        debugLog('warn', 'Trial', 'Failed to get trial status', e.message);
                    }
                }

                // Get license status
                if (typeof LicenseManager !== 'undefined') {
                    try {
                        var isPro = await LicenseManager.isPro();
                        var tier = await LicenseManager.getTier();
                        combinedResult.license = { isPro: isPro, tier: tier };
                    } catch (e) {
                        debugLog('warn', 'License', 'Failed to get license status', e.message);
                    }
                }

                // Effectively Pro if either paid license or active trial
                combinedResult.effectivelyPro = combinedResult.license.isPro || combinedResult.trial.trialActive;

                return { success: true, data: combinedResult };
            }

            case 'OPEN_FEEDBACK': {
                // chrome.action.openPopup() requires a user gesture and cannot
                // be called from a message handler.  Return an error so the
                // caller can fall back to its own method of opening the popup.
                return { error: 'Cannot open popup from background context' };
            }

            // ==============================================================
            // Feature Gating (Phase 05)
            // ==============================================================

            case 'CHECK_FEATURE_GATE': {
                // Uses FeatureManager and UsageTracker globals from imported scripts
                try {
                    if (typeof FeatureManager !== 'undefined') {
                        if (!FeatureManager._initialized) await FeatureManager.init();
                    }
                    if (typeof UsageTracker !== 'undefined') {
                        if (!UsageTracker._initialized) await UsageTracker.init();
                    }
                    if (typeof FeatureManager !== 'undefined') {
                        var access = FeatureManager.checkFeature(payload.featureId);
                        if (!access.allowed) {
                            return { success: true, data: { allowed: false, reason: access.reason } };
                        }
                        var featureTier = FeatureManager.getCurrentTier();
                        if (typeof UsageTracker !== 'undefined') {
                            var limit = await UsageTracker.checkLimit(payload.featureId, featureTier);
                            return { success: true, data: limit };
                        }
                        return { success: true, data: { allowed: true } };
                    }
                    return { success: true, data: { allowed: true } };
                } catch (e) {
                    return { success: false, error: e.message };
                }
            }

            case 'RECORD_FEATURE_USAGE': {
                try {
                    if (typeof FeatureManager !== 'undefined') {
                        if (!FeatureManager._initialized) await FeatureManager.init();
                    }
                    if (typeof UsageTracker !== 'undefined') {
                        if (!UsageTracker._initialized) await UsageTracker.init();
                        var recordTier = (typeof FeatureManager !== 'undefined') ? FeatureManager.getCurrentTier() : 'free';
                        var result = await UsageTracker.recordUsage(payload.featureId, recordTier);
                        // Also record daily history for dashboard
                        await recordDailyHistory();
                        return { success: true, data: result };
                    }
                    return { success: true, data: { recorded: false } };
                } catch (e) {
                    return { success: false, error: e.message };
                }
            }

            case 'OPEN_UPGRADE_PAGE': {
                var upgradeUrl = chrome.runtime.getURL('src/pages/upgrade.html');
                chrome.tabs.create({ url: upgradeUrl });
                return { success: true };
            }

            case 'GET_FEATURE_USAGE': {
                try {
                    if (typeof UsageTracker !== 'undefined') {
                        if (!UsageTracker._initialized) await UsageTracker.init();
                        var usage = UsageTracker.getAllUsage();
                        return { success: true, data: usage };
                    }
                    return { success: true, data: {} };
                } catch (e) {
                    return { success: false, error: e.message };
                }
            }

            default:
                return { error: 'Unknown action' };
        }
    } catch (error) {
        console.error('[ServiceWorker] Message handler error:', error);
        return { error: error.message };
    }
}

// ============================================================================
// Feature Gating Helpers (Phase 05)
// ============================================================================

async function recordDailyHistory() {
    var today = new Date().toISOString().split('T')[0];
    var result = await chrome.storage.local.get('dailyHistory');
    var history = result.dailyHistory || {};
    history[today] = (history[today] || 0) + 1;
    var keys = Object.keys(history).sort();
    if (keys.length > 30) {
        keys.slice(0, keys.length - 30).forEach(function(k) { delete history[k]; });
    }
    await chrome.storage.local.set({ dailyHistory: history });
}

// ============================================================================
// Context Menu
// ============================================================================

function setupContextMenu() {
    // Clear existing menus first (defensive pattern from Zovo framework)
    chrome.contextMenus.removeAll(() => {
        // Suppress any error from removeAll
        void chrome.runtime.lastError;

        chrome.contextMenus.create({
            id: 'clear-site-cookies',
            title: chrome.i18n.getMessage('ctxClearCookies') || 'Clear cookies for this site',
            contexts: ['page']
        }, () => {
            // Suppress duplicate ID error if it occurs
            void chrome.runtime.lastError;
        });

        chrome.contextMenus.create({
            id: 'export-site-cookies',
            title: chrome.i18n.getMessage('ctxExportCookies') || 'Export cookies for this site',
            contexts: ['page']
        }, () => void chrome.runtime.lastError);

        chrome.contextMenus.create({
            id: 'separator-1',
            type: 'separator',
            contexts: ['page']
        }, () => void chrome.runtime.lastError);

        chrome.contextMenus.create({
            id: 'open-cookie-manager',
            title: chrome.i18n.getMessage('ctxOpenCookieManager') || 'Open Cookie Manager',
            contexts: ['page']
        }, () => void chrome.runtime.lastError);

        chrome.contextMenus.create({
            id: 'open-settings',
            title: chrome.i18n.getMessage('ctxSettings') || 'Cookie Manager Settings',
            contexts: ['page']
        }, () => void chrome.runtime.lastError);
    });
}

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (!tab?.url || tab.url.startsWith('chrome://')) return;

    const domain = new URL(tab.url).hostname;

    switch (info.menuItemId) {
        case 'clear-site-cookies': {
            const settings = await getSettings();

            if (settings.readOnlyMode) {
                chrome.notifications.create({
                    type: 'basic',
                    iconUrl: 'assets/icons/icon-128.png',
                    title: chrome.i18n.getMessage('extName') || 'Cookie Manager',
                    message: chrome.i18n.getMessage('ntfReadOnlyEnabled') || 'Read-only mode is enabled. Disable it to clear cookies.'
                });
                return;
            }

            const count = await CookieOps.clearDomain(domain);

            chrome.notifications.create({
                type: 'basic',
                iconUrl: 'assets/icons/icon-128.png',
                title: chrome.i18n.getMessage('ntfCookiesClearedTitle') || 'Cookies Cleared',
                message: chrome.i18n.getMessage('ntfCookiesClearedMsg', [String(count), domain]) || 'Removed ' + count + ' cookie' + (count !== 1 ? 's' : '') + ' from ' + domain
            });
            break;
        }

        case 'export-site-cookies': {
            try {
                const cookies = await chrome.cookies.getAll({ domain });
                const json = JSON.stringify(cookies, null, 2);
                // Copy to clipboard via offscreen or notification
                chrome.notifications.create({
                    type: 'basic',
                    iconUrl: 'assets/icons/icon-128.png',
                    title: chrome.i18n.getMessage('ntfCookiesExportedTitle') || 'Cookies Exported',
                    message: chrome.i18n.getMessage('ntfCookiesExportedMsg', [String(cookies.length), domain]) || cookies.length + ' cookie' + (cookies.length !== 1 ? 's' : '') + ' from ' + domain + ' copied. Open popup to download.'
                });
                // Store temporarily for popup to pick up
                await chrome.storage.local.set({ _pendingExport: { domain, json, timestamp: Date.now() } });
            } catch (e) {
                debugLog('error', 'ContextMenu', 'Export failed', e);
            }
            break;
        }

        case 'open-cookie-manager':
            chrome.action.openPopup();
            break;

        case 'open-settings':
            chrome.runtime.openOptionsPage();
            break;
    }
});

// ============================================================================
// Cookie Change Listener
// ============================================================================

chrome.cookies.onChanged.addListener((changeInfo) => {
    // Log cookie changes for debugging
    const { removed, cookie, cause } = changeInfo;
    debugLog('info', 'CookieChange', (removed ? 'removed' : 'set') + ' ' + cookie.name, {
        domain: cookie.domain,
        cause
    });
});

// ============================================================================
// Notification Click Handler (MD 08 - Trial Notifications)
// ============================================================================

chrome.notifications.onClicked.addListener((notificationId) => {
    if (notificationId === 'trial-reminder' || notificationId === 'trial-expired') {
        var upgradeUrl = (typeof TrialManager !== 'undefined' && TrialManager.CONFIG)
            ? TrialManager.CONFIG.upgradeUrl
            : 'https://www.zovo.one/cookie-manager/upgrade';

        chrome.tabs.create({ url: upgradeUrl });
        chrome.notifications.clear(notificationId);
    }
});

// ============================================================================
// Installation & Startup
// ============================================================================

chrome.runtime.onInstalled.addListener(async (details) => {
    debugLog('info', 'Lifecycle', 'Installed: ' + details.reason);

    // Version tracking (MD 22)
    if (typeof VersionManager !== 'undefined' && VersionManager.onInstalled) {
        try { VersionManager.onInstalled(details); } catch(e) { debugLog('warn', 'Version', 'onInstalled tracking failed', e.message); }
    }

    setupContextMenu();
    await recordStartupTimestamp('installed_' + details.reason);
    debugLog('info', 'Lifecycle', 'onInstalled fired', { reason: details.reason });

    // Create license refresh alarm only if it doesn't already exist (MD 08)
    chrome.alarms.get('licenseRefresh', (existing) => {
        if (!existing) {
            chrome.alarms.create('licenseRefresh', { periodInMinutes: 30 });
            debugLog('info', 'License', 'Created licenseRefresh alarm (every 30 min)');
        }
    });

    // Record install date for feature gating (Phase 05)
    chrome.storage.local.set({ installDate: new Date().toISOString() });

    if (details.reason === 'install') {
        // Initialize default settings
        await chrome.storage.local.set({
            ...STORAGE_DEFAULTS,
            installedAt: Date.now(),
            installSource: 'chrome_web_store',
            analytics: [],
            errorLogs: [],
            debugMode: false
        });

        // Set initial schema version
        if (typeof StorageSchema !== 'undefined') {
            await chrome.storage.local.set({ _schemaVersion: StorageSchema.VERSION });
        }

        // Check if onboarding already shown
        const { onboardingComplete } = await chrome.storage.local.get('onboardingComplete');

        if (!onboardingComplete) {
            // Open onboarding tab
            chrome.tabs.create({
                url: chrome.runtime.getURL('onboarding/onboarding.html')
            });
        }

        // Start free trial (MD 08)
        if (typeof TrialManager !== 'undefined') {
            try {
                var trialResult = await TrialManager.startTrial();
                debugLog('info', 'Trial', 'Trial started on install', trialResult);
            } catch (e) {
                debugLog('warn', 'Trial', 'Failed to start trial on install', e.message);
            }
        }

        // Track install event
        await trackEvent('extension_installed');
    }

    if (details.reason === 'update') {
        const previousVersion = details.previousVersion;
        const currentVersion = chrome.runtime.getManifest().version;

        debugLog('info', 'Lifecycle', 'Updated from ' + previousVersion + ' to ' + currentVersion);

        // Track update
        await trackEvent('extension_updated', { previousVersion, currentVersion });

        // Show changelog for major updates (optional)
        const previousMajor = parseInt(previousVersion?.split('.')[0] || '0');
        const currentMajor = parseInt(currentVersion.split('.')[0]);

        if (currentMajor > previousMajor) {
            // Could open a what's-new page here
            debugLog('info', 'Lifecycle', 'Major version update');
        }
    }
});

chrome.runtime.onStartup.addListener(async () => {
    debugLog('info', 'Lifecycle', 'Startup');
    setupContextMenu();
    await recordStartupTimestamp('startup');
    debugLog('info', 'Lifecycle', 'onStartup fired');

    // Trim error logs if needed
    try {
        const { errorLogs = [] } = await chrome.storage.local.get('errorLogs');
        if (errorLogs.length > ERROR_LOG_MAX) {
            const trimmed = errorLogs.slice(errorLogs.length - ERROR_LOG_MAX);
            await chrome.storage.local.set({ errorLogs: trimmed });
        }
    } catch (e) {
        console.error('[Monitoring] Error processing pending logs on startup:', e);
    }

    // Restore auto-delete alarm if there are active rules
    try {
        const { autoDeleteRules = [] } = await chrome.storage.local.get('autoDeleteRules');
        const hasEnabledRules = autoDeleteRules.some(r => r.enabled);
        if (hasEnabledRules) {
            await chrome.alarms.create('auto-delete-cookies', { periodInMinutes: 1 });
            debugLog('info', 'AutoDelete', `Restored auto-delete alarm (${autoDeleteRules.filter(r => r.enabled).length} active rules)`);
        }
    } catch (e) {
        debugLog('warn', 'AutoDelete', 'Failed to restore auto-delete alarm on startup', e.message);
    }
});

// ============================================================================
// Zovo Analytics (Local Only - No External Requests)
// ============================================================================

async function trackEvent(eventName, properties = {}) {
    try {
        const { analytics = [] } = await chrome.storage.local.get('analytics');

        analytics.push({
            event: eventName,
            properties,
            extension: 'cookie-manager',
            timestamp: Date.now()
        });

        // Keep only last 100 events
        if (analytics.length > 100) {
            analytics.shift();
        }

        await chrome.storage.local.set({ analytics });
        debugLog('info', 'Analytics', `Event: ${eventName}`, properties);
    } catch (e) {
        console.error('[ServiceWorker] Analytics error:', e);
    }
}

// ============================================================================
// Churn Prevention & Retention (MD 17)
// ============================================================================

// Create churn daily check alarm only if it doesn't already exist.
// Re-creating it on every SW wake-up would reset the scheduled time and
// prevent the alarm from ever firing.
chrome.alarms.get('churn-daily-check', (existing) => {
    if (!existing) {
        chrome.alarms.create('churn-daily-check', { periodInMinutes: 1440 });
    }
});

// Handle alarms (churn check + auto-delete cookies)
chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === 'churn-daily-check') {
        try {
            if (typeof ChurnDetector !== 'undefined') {
                var assessment = await ChurnDetector.assessRisk();
                await chrome.storage.local.set({ lastChurnAssessment: assessment });
                debugLog('info', 'Retention', 'Daily churn assessment complete', assessment);
            }
        } catch (e) {
            debugLog('warn', 'Retention', 'Churn assessment failed', e.message);
        }
        return;
    }

    if (alarm.name === 'trialDailyCheck') {
        try {
            if (typeof TrialManager !== 'undefined') {
                await TrialManager.dailyCheck();
                debugLog('info', 'Trial', 'Daily trial check complete');
            }
        } catch (e) {
            debugLog('warn', 'Trial', 'Daily trial check failed', e.message);
        }
        return;
    }

    if (alarm.name === 'auto-delete-cookies') {
        try {
            const { autoDeleteRules = [] } = await chrome.storage.local.get('autoDeleteRules');
            const enabledRules = autoDeleteRules.filter(r => r.enabled);
            if (enabledRules.length === 0) {
                await chrome.alarms.clear('auto-delete-cookies');
                return;
            }

            const now = Date.now();
            let totalDeleted = 0;

            for (const rule of enabledRules) {
                // Skip "on browser close" rules (intervalMinutes === 0) -- they are not timer-based
                if (rule.intervalMinutes === 0) continue;

                // Check if enough time has passed since last run for this rule
                const lastRun = rule.lastRun || 0;
                if (now - lastRun < rule.intervalMinutes * 60000) continue;

                try {
                    const cookies = await chrome.cookies.getAll({ domain: rule.domain });
                    let deletedCount = 0;

                    for (const cookie of cookies) {
                        // Match by pattern (* = all, otherwise match cookie name)
                        // Security: escape regex special chars to prevent ReDoS / regex injection (MD 18)
                        const matches = rule.pattern === '*' ||
                            cookie.name === rule.pattern ||
                            (rule.pattern.includes('*') && new RegExp('^' + rule.pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$').test(cookie.name));

                        if (matches) {
                            const cookieDomain = cookie.domain.startsWith('.')
                                ? cookie.domain.slice(1)
                                : cookie.domain;
                            const url = `http${cookie.secure ? 's' : ''}://${cookieDomain}${cookie.path}`;
                            await chrome.cookies.remove({ url, name: cookie.name });
                            deletedCount++;
                        }
                    }

                    // Update lastRun timestamp on the rule
                    rule.lastRun = now;
                    totalDeleted += deletedCount;

                    if (deletedCount > 0) {
                        debugLog('info', 'AutoDelete', `Deleted ${deletedCount} cookies for ${rule.domain}`);
                    }
                } catch (e) {
                    debugLog('warn', 'AutoDelete', `Rule ${rule.id} failed for ${rule.domain}`, e.message);
                }
            }

            // Persist updated lastRun timestamps
            await chrome.storage.local.set({ autoDeleteRules });

            if (totalDeleted > 0) {
                debugLog('info', 'AutoDelete', `Auto-delete pass complete: ${totalDeleted} cookies removed`);
            }
        } catch (e) {
            debugLog('error', 'AutoDelete', 'Auto-delete alarm handler failed', e.message);
        }
        return;
    }

    // License refresh alarm (MD 08)
    if (alarm.name === 'licenseRefresh') {
        try {
            if (typeof LicenseManager !== 'undefined') {
                var licenseResult = await LicenseManager.checkLicense(null, true);
                debugLog('info', 'License', 'Periodic license refresh complete', { tier: licenseResult.tier, valid: licenseResult.valid });
            }
        } catch (e) {
            debugLog('warn', 'License', 'License refresh alarm failed', e.message);
        }
        return;
    }
});

debugLog('info', 'Retention', 'Churn prevention & retention initialized (MD 17)');

debugLog('info', 'Support', 'Customer support & feedback initialized (MD 19)');

debugLog('info', 'Performance', 'Performance optimization initialized (MD 20)');

debugLog('info', 'Accessibility', 'Accessibility compliance initialized (MD 21)');

// Load feature flag overrides at startup (MD 22)
if (typeof VersionManager !== 'undefined' && VersionManager.loadOverrides) {
    try { VersionManager.loadOverrides(); } catch(e) { /* silently ignore */ }
}

debugLog('info', 'Version', 'Version & release management initialized (MD 22)');

debugLog('info', 'Legal', 'Legal compliance initialized (MD 23)');

// Service Registry initialization (MD 24)
if (typeof ArchPatterns !== 'undefined' && ArchPatterns.ServiceRegistry) {
    try {
        if (typeof CookieOps !== 'undefined') ArchPatterns.ServiceRegistry.register('CookieOps', CookieOps);
        if (typeof PerfTimer !== 'undefined') ArchPatterns.ServiceRegistry.register('PerfTimer', PerfTimer);
        if (typeof StorageOptimizer !== 'undefined') ArchPatterns.ServiceRegistry.register('StorageOptimizer', StorageOptimizer);
        if (typeof VersionManager !== 'undefined') ArchPatterns.ServiceRegistry.register('VersionManager', VersionManager);
        if (typeof LegalCompliance !== 'undefined') ArchPatterns.ServiceRegistry.register('LegalCompliance', LegalCompliance);
        if (typeof A11yManager !== 'undefined') ArchPatterns.ServiceRegistry.register('A11yManager', A11yManager);
        debugLog('info', 'Architecture', 'Service registry populated with ' + ArchPatterns.ServiceRegistry.list().length + ' services');
    } catch (e) {
        debugLog('warn', 'Architecture', 'Service registry init failed', e.message);
    }
}

debugLog('info', 'Architecture', 'Architecture patterns initialized (MD 24)');

// Initial setup
setupContextMenu();

debugLog('info', 'Init', 'Cookie Manager initialized - Part of Zovo (https://www.zovo.one)');
