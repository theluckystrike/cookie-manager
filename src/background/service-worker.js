/**
 * Cookie Manager - Background Service Worker
 * Handles message routing, context menus, and cookie change events
 */

// Import shared modules (MD 19)
try { importScripts('../shared/feedback-collector.js'); } catch(e) { console.warn('feedback-collector.js not loaded:', e.message); }
try { importScripts('../shared/support-diagnostics.js'); } catch(e) { console.warn('support-diagnostics.js not loaded:', e.message); }

// Import shared modules (MD 20)
try { importScripts('../shared/perf-timer.js'); } catch(e) { console.warn('perf-timer.js not loaded:', e.message); }
try { importScripts('../shared/storage-optimizer.js'); } catch(e) { console.warn('storage-optimizer.js not loaded:', e.message); }

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

    console.log('[ServiceWorker] Received message:', action);

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

                return await CookieOps.remove(payload.url, payload.name);
            }

            case 'CLEAR_DOMAIN': {
                const settings = await getSettings();

                if (settings.readOnlyMode) {
                    return { error: 'Read-only mode is enabled' };
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
                        await ChurnDetector.recordUsage(message.usageAction);
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
                        await RetentionTriggers.dismissTrigger(message.triggerId);
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

            default:
                return { error: 'Unknown action' };
        }
    } catch (error) {
        console.error('[ServiceWorker] Message handler error:', error);
        return { error: error.message };
    }
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
            title: 'Clear cookies for this site',
            contexts: ['page']
        }, () => {
            // Suppress duplicate ID error if it occurs
            void chrome.runtime.lastError;
        });

        chrome.contextMenus.create({
            id: 'separator-1',
            type: 'separator',
            contexts: ['page']
        }, () => void chrome.runtime.lastError);

        chrome.contextMenus.create({
            id: 'open-cookie-manager',
            title: 'Open Cookie Manager',
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
                    iconUrl: '/assets/icons/icon-128.png',
                    title: 'Cookie Manager',
                    message: 'Read-only mode is enabled. Disable it to clear cookies.'
                });
                return;
            }

            const count = await CookieOps.clearDomain(domain);

            chrome.notifications.create({
                type: 'basic',
                iconUrl: '/assets/icons/icon-128.png',
                title: 'Cookies Cleared',
                message: `Removed ${count} cookie${count !== 1 ? 's' : ''} from ${domain}`
            });
            break;
        }

        case 'open-cookie-manager':
            chrome.action.openPopup();
            break;
    }
});

// ============================================================================
// Cookie Change Listener
// ============================================================================

chrome.cookies.onChanged.addListener((changeInfo) => {
    // Log cookie changes for debugging
    const { removed, cookie, cause } = changeInfo;
    console.log('[ServiceWorker] Cookie changed:', {
        action: removed ? 'removed' : 'set',
        name: cookie.name,
        domain: cookie.domain,
        cause
    });
});

// ============================================================================
// Installation & Startup
// ============================================================================

chrome.runtime.onInstalled.addListener(async (details) => {
    console.log('[ServiceWorker] Installed:', details.reason);

    setupContextMenu();
    await recordStartupTimestamp('installed_' + details.reason);
    debugLog('info', 'Lifecycle', 'onInstalled fired', { reason: details.reason });

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

        // Track install event
        await trackEvent('extension_installed');
    }

    if (details.reason === 'update') {
        const previousVersion = details.previousVersion;
        const currentVersion = chrome.runtime.getManifest().version;

        console.log('[ServiceWorker] Updated from', previousVersion, 'to', currentVersion);

        // Track update
        await trackEvent('extension_updated', { previousVersion, currentVersion });

        // Show changelog for major updates (optional)
        const previousMajor = parseInt(previousVersion?.split('.')[0] || '0');
        const currentMajor = parseInt(currentVersion.split('.')[0]);

        if (currentMajor > previousMajor) {
            // Could open a what's-new page here
            console.log('[ServiceWorker] Major version update');
        }
    }
});

chrome.runtime.onStartup.addListener(async () => {
    console.log('[ServiceWorker] Startup');
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

// Create churn daily check alarm
chrome.alarms.create('churn-daily-check', { periodInMinutes: 1440 });

// Handle churn daily check alarm
chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name !== 'churn-daily-check') return;

    try {
        if (typeof ChurnDetector !== 'undefined') {
            var assessment = await ChurnDetector.assessRisk();
            await chrome.storage.local.set({ lastChurnAssessment: assessment });
            if (typeof debugLog === 'function') {
                debugLog('info', 'Retention', 'Daily churn assessment complete', assessment);
            }
        }
    } catch (e) {
        if (typeof debugLog === 'function') {
            debugLog('warn', 'Retention', 'Churn assessment failed', e.message);
        }
    }
});

debugLog('info', 'Retention', 'Churn prevention & retention initialized (MD 17)');

debugLog('info', 'Support', 'Customer support & feedback initialized (MD 19)');

debugLog('info', 'Performance', 'Performance optimization initialized (MD 20)');

// Initial setup
setupContextMenu();

console.log('[ServiceWorker] Cookie Manager initialized - Part of Zovo (https://zovo.one)');
