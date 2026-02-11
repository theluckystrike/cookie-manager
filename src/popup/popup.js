/**
 * Cookie Manager - Popup Logic
 * Connects UI to background service worker
 */

// ============================================================================
// Error Tracking (MD 11 - Crash Analytics)
// ============================================================================

const PopupErrorHandler = {
    errors: [],

    init() {
        window.onerror = (message, source, lineno, colno, error) => {
            this.capture({ type: 'ui_error', message, source, lineno, colno, stack: error?.stack });
            return false;
        };
        window.addEventListener('unhandledrejection', (event) => {
            this.capture({ type: 'promise_rejection', message: event.reason?.message || String(event.reason), stack: event.reason?.stack });
        });
    },

    capture(errorData) {
        const entry = {
            ...errorData,
            context: 'popup',
            timestamp: Date.now(),
            version: chrome.runtime.getManifest().version
        };
        this.errors.push(entry);
        // Send to background for storage
        chrome.runtime.sendMessage({ action: 'REPORT_ERROR', payload: entry }).catch(() => {});
    },

    async exportDebugBundle() {
        const [errorLogs, healthData, settings] = await Promise.all([
            chrome.runtime.sendMessage({ action: 'GET_ERROR_LOGS' }).catch(() => []),
            chrome.runtime.sendMessage({ action: 'GET_HEALTH_REPORT' }).catch(() => ({})),
            chrome.runtime.sendMessage({ action: 'GET_SETTINGS' }).catch(() => ({}))
        ]);

        const bundle = {
            generatedAt: new Date().toISOString(),
            extension: {
                id: chrome.runtime.id,
                version: chrome.runtime.getManifest().version,
                name: chrome.runtime.getManifest().name
            },
            browser: {
                userAgent: navigator.userAgent,
                platform: navigator.platform,
                language: navigator.language
            },
            errors: errorLogs,
            health: healthData,
            sessionErrors: this.errors,
            settings: this.sanitize(settings)
        };

        const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cookie-manager-debug-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);

        showToast('Debug bundle exported', 'success');
    },

    sanitize(obj) {
        if (typeof obj !== 'object' || obj === null) return obj;
        const sensitive = ['password', 'token', 'secret', 'api_key'];
        const result = Array.isArray(obj) ? [] : {};
        for (const [key, value] of Object.entries(obj)) {
            if (sensitive.some(s => key.toLowerCase().includes(s))) {
                result[key] = '[REDACTED]';
            } else if (typeof value === 'object') {
                result[key] = this.sanitize(value);
            } else {
                result[key] = value;
            }
        }
        return result;
    }
};

// ============================================================================
// JWT Utility (inline to avoid module issues)
// ============================================================================

const JWT = {
    isJWT(value) {
        if (!value || typeof value !== 'string') return false;
        const parts = value.split('.');
        if (parts.length !== 3) return false;

        try {
            JSON.parse(atob(this._b64ToB64(parts[0])));
            JSON.parse(atob(this._b64ToB64(parts[1])));
            return true;
        } catch {
            return false;
        }
    },

    decode(token) {
        if (!this.isJWT(token)) return null;
        const parts = token.split('.');

        try {
            return {
                header: JSON.parse(atob(this._b64ToB64(parts[0]))),
                payload: JSON.parse(atob(this._b64ToB64(parts[1]))),
                signature: parts[2]
            };
        } catch {
            return null;
        }
    },

    formatExpiry(exp) {
        if (!exp) return { text: 'No expiration', expired: false };
        const now = Date.now();
        const expMs = exp * 1000;
        const diff = expMs - now;

        if (diff < 0) {
            return { text: `Expired ${this._timeAgo(Math.abs(diff))} ago`, expired: true };
        }
        return { text: `Expires in ${this._timeAgo(diff)}`, expired: false };
    },

    _b64ToB64(b64url) {
        let b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
        while (b64.length % 4) b64 += '=';
        return b64;
    },

    _timeAgo(ms) {
        const s = Math.floor(ms / 1000);
        const m = Math.floor(s / 60);
        const h = Math.floor(m / 60);
        const d = Math.floor(h / 24);

        if (d > 0) return `${d}d ${h % 24}h`;
        if (h > 0) return `${h}h ${m % 60}m`;
        if (m > 0) return `${m}m`;
        return `${s}s`;
    }
};

// ============================================================================
// State
// ============================================================================

var currentTab = null;
var currentCookies = [];
var selectedCookie = null;
var isNewCookie = false;
var settings = { readOnlyMode: false };
var _editorFocusTrap = null; // MD 21 - focus trap for editor modal
var _jwtFocusTrap = null; // MD 21 - focus trap for JWT modal
var _confirmFocusTrap = null; // MD 21 - focus trap for confirm modal

// ============================================================================
// DOM Elements
// ============================================================================

const $ = (id) => document.getElementById(id);

const elements = {
    currentDomain: $('currentDomain'),
    searchInput: $('searchInput'),
    cookieCount: $('cookieCount'),
    cookieList: $('cookieList'),
    emptyState: $('emptyState'),
    loadingState: $('loadingState'),

    // Actions
    refreshBtn: $('refreshBtn'),
    exportBtn: $('exportBtn'),
    addCookieBtn: $('addCookieBtn'),
    clearAllBtn: $('clearAllBtn'),
    readOnlyToggle: $('readOnlyToggle'),

    // Editor Modal
    editorModal: $('editorModal'),
    editorTitle: $('editorTitle'),
    closeModal: $('closeModal'),
    cookieName: $('cookieName'),
    cookieValue: $('cookieValue'),
    cookieDomain: $('cookieDomain'),
    cookiePath: $('cookiePath'),
    cookieExpiry: $('cookieExpiry'),
    cookieSecure: $('cookieSecure'),
    cookieHttpOnly: $('cookieHttpOnly'),
    cookieSameSite: $('cookieSameSite'),
    jwtBadge: $('jwtBadge'),
    decodeJwt: $('decodeJwt'),
    saveCookieBtn: $('saveCookieBtn'),
    deleteCookieBtn: $('deleteCookieBtn'),

    // JWT Modal
    jwtModal: $('jwtModal'),
    closeJwtModal: $('closeJwtModal'),
    jwtHeader: $('jwtHeader'),
    jwtPayload: $('jwtPayload'),
    jwtExpiry: $('jwtExpiry'),
    copyHeader: $('copyHeader'),
    copyPayload: $('copyPayload'),

    // Confirm Modal
    confirmModal: $('confirmModal'),
    confirmTitle: $('confirmTitle'),
    confirmMessage: $('confirmMessage'),
    confirmCancel: $('confirmCancel'),
    confirmOk: $('confirmOk'),

    // Toast
    toast: $('toast'),
    toastIcon: $('toastIcon'),
    toastMessage: $('toastMessage')
};

// ============================================================================
// Initialization
// ============================================================================

async function init() {
    try {
        PopupErrorHandler.init();

        // Accessibility (MD 21)
        if (typeof A11yManager !== 'undefined' && A11yManager.initLiveRegion) {
            A11yManager.initLiveRegion();
        }

        // Load settings
        const settingsResponse = await chrome.runtime.sendMessage({ action: 'GET_SETTINGS' });
        settings = settingsResponse || { readOnlyMode: false };
        elements.readOnlyToggle.checked = settings.readOnlyMode;

        // Get current tab
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        currentTab = tab;

        if (!tab?.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
            elements.currentDomain.textContent = 'Chrome page';
            showEmptyState('This page has no cookies');
            return;
        }

        const url = new URL(tab.url);
        elements.currentDomain.textContent = url.hostname;

        // Load cookies
        showLoading();
        await loadCookies();

        // Set up event listeners
        setupEventListeners();

        // Track session milestone (MD 14 - Growth)
        if (typeof MilestoneTracker !== 'undefined') {
            MilestoneTracker.record('session').then(newMilestones => {
                if (newMilestones && newMilestones.length > 0) {
                    checkGrowthPrompts(newMilestones);
                }
            }).catch(() => {});
        }

        // Initialize retention tracking (MD 17)
        if (typeof initRetention === 'function') {
            initRetention();
        }

        // Focus search on popup open (MD 21)
        var searchEl = document.getElementById('searchInput');
        if (searchEl) { searchEl.focus(); }

    } catch (error) {
        console.error('[Popup] Init error:', error);
        showEmptyState('Error loading cookies');
    }
}

// ============================================================================
// Cookie Loading & Rendering
// ============================================================================

async function loadCookies() {
    try {
        const response = await chrome.runtime.sendMessage({
            action: 'GET_COOKIES',
            payload: { url: currentTab.url }
        });

        currentCookies = response || [];
        renderCookies(currentCookies);

    } catch (error) {
        console.error('[Popup] Load cookies error:', error);
        currentCookies = [];
        showEmptyState('Error loading cookies');
    }
}

function renderCookies(cookies) {
    const searchTerm = elements.searchInput.value.toLowerCase().trim();

    let filtered = cookies;
    if (searchTerm) {
        filtered = cookies.filter(c =>
            c.name.toLowerCase().includes(searchTerm) ||
            c.value.toLowerCase().includes(searchTerm) ||
            c.domain.toLowerCase().includes(searchTerm)
        );
    }

    // Sort by name
    filtered.sort((a, b) => a.name.localeCompare(b.name));

    elements.cookieCount.textContent = filtered.length;
    elements.loadingState.hidden = true;

    // Announce search result count to screen readers (MD 21)
    if (searchTerm && typeof A11yManager !== 'undefined' && A11yManager.announce) {
        A11yManager.announce(filtered.length + ' cookie' + (filtered.length !== 1 ? 's' : '') + ' found');
    }

    if (filtered.length === 0) {
        if (searchTerm) {
            showEmptyState('No cookies match your search');
        } else {
            showEmptyState('This site has no cookies set');
        }
        return;
    }

    elements.emptyState.hidden = true;
    elements.cookieList.hidden = false;
    // Security: use DOM API instead of innerHTML (MD 18)
    elements.cookieList.textContent = '';
    filtered.forEach(function(cookie) {
        var template = document.createElement('template');
        template.innerHTML = createCookieItemHTML(cookie);
        elements.cookieList.appendChild(template.content);
    });

    // Add click handlers
    elements.cookieList.querySelectorAll('.cookie-item').forEach((item, index) => {
        item.addEventListener('click', () => openEditor(filtered[index]));
    });
}

function createCookieItemHTML(cookie) {
    const isJwt = JWT.isJWT(cookie.value);
    const isSession = !cookie.expirationDate;
    const badges = [];

    if (cookie.secure) {
        badges.push('<span class="badge badge-secure">Secure</span>');
    }
    if (cookie.httpOnly) {
        badges.push('<span class="badge badge-httponly">HttpOnly</span>');
    }
    if (isJwt) {
        badges.push('<span class="badge badge-jwt">JWT</span>');
    }
    if (isSession) {
        badges.push('<span class="badge badge-session">Session</span>');
    }

    const displayValue = cookie.value.length > 50
        ? cookie.value.substring(0, 50) + '...'
        : cookie.value;

    return `
    <div class="cookie-item" data-name="${escapeHtml(cookie.name)}">
      <div class="cookie-icon">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <circle cx="8" cy="9" r="1" fill="currentColor"></circle>
          <circle cx="15" cy="9" r="1" fill="currentColor"></circle>
          <circle cx="9" cy="14" r="1" fill="currentColor"></circle>
          <circle cx="14" cy="15" r="1" fill="currentColor"></circle>
        </svg>
      </div>
      <div class="cookie-info">
        <div class="cookie-name">${escapeHtml(cookie.name)}</div>
        <div class="cookie-value">${escapeHtml(displayValue) || '<empty>'}</div>
        ${badges.length ? `<div class="cookie-badges">${badges.join('')}</div>` : ''}
      </div>
    </div>
  `;
}

function showEmptyState(message = 'No cookies found') {
    elements.loadingState.hidden = true;
    elements.cookieList.hidden = true;
    elements.emptyState.hidden = false;

    const subtitle = elements.emptyState.querySelector('.empty-subtitle');
    if (subtitle) subtitle.textContent = message;
}

function showLoading() {
    elements.cookieList.hidden = true;
    elements.emptyState.hidden = true;
    elements.loadingState.hidden = false;
}

// ============================================================================
// Cookie Editor
// ============================================================================

function openEditor(cookie = null) {
    selectedCookie = cookie;
    isNewCookie = !cookie;

    elements.editorTitle.textContent = cookie ? 'Edit Cookie' : 'Add Cookie';
    elements.deleteCookieBtn.style.display = cookie ? 'flex' : 'none';

    if (cookie) {
        elements.cookieName.value = cookie.name;
        elements.cookieValue.value = cookie.value;
        elements.cookieDomain.value = cookie.domain;
        elements.cookiePath.value = cookie.path;
        elements.cookieSecure.checked = cookie.secure;
        elements.cookieHttpOnly.checked = cookie.httpOnly;
        elements.cookieSameSite.value = cookie.sameSite || 'lax';

        if (cookie.expirationDate) {
            const date = new Date(cookie.expirationDate * 1000);
            elements.cookieExpiry.value = formatDateTimeLocal(date);
        } else {
            elements.cookieExpiry.value = '';
        }

        // Check for JWT
        elements.jwtBadge.hidden = !JWT.isJWT(cookie.value);

    } else {
        // Clear form for new cookie
        const domain = new URL(currentTab.url).hostname;
        elements.cookieName.value = '';
        elements.cookieValue.value = '';
        elements.cookieDomain.value = domain;
        elements.cookiePath.value = '/';
        elements.cookieSecure.checked = currentTab.url.startsWith('https');
        elements.cookieHttpOnly.checked = false;
        elements.cookieSameSite.value = 'lax';
        elements.cookieExpiry.value = '';
        elements.jwtBadge.hidden = true;
    }

    elements.editorModal.hidden = false;

    // Focus trap for editor modal (MD 21)
    if (typeof A11yManager !== 'undefined' && A11yManager.createTrap) {
        _editorFocusTrap = A11yManager.createTrap(elements.editorModal);
        _editorFocusTrap.activate();
    }

    elements.cookieName.focus();
}

function closeEditor() {
    // Deactivate focus trap (MD 21)
    if (_editorFocusTrap && _editorFocusTrap.deactivate) {
        _editorFocusTrap.deactivate();
        _editorFocusTrap = null;
    }

    elements.editorModal.hidden = true;
    selectedCookie = null;
    isNewCookie = false;
}

async function saveCookie() {
    if (settings.readOnlyMode) {
        showToast('Read-only mode is enabled', 'error');
        return;
    }

    const name = elements.cookieName.value.trim();
    const value = elements.cookieValue.value;
    const domain = elements.cookieDomain.value.trim();
    const path = elements.cookiePath.value.trim() || '/';

    if (!name) {
        showToast('Cookie name is required', 'error');
        elements.cookieName.focus();
        return;
    }

    if (!domain) {
        showToast('Domain is required', 'error');
        elements.cookieDomain.focus();
        return;
    }

    const cookie = {
        name,
        value,
        domain,
        path,
        secure: elements.cookieSecure.checked,
        httpOnly: elements.cookieHttpOnly.checked,
        sameSite: elements.cookieSameSite.value
    };

    if (elements.cookieExpiry.value) {
        cookie.expirationDate = new Date(elements.cookieExpiry.value).getTime() / 1000;
    }

    try {
        const response = await chrome.runtime.sendMessage({
            action: 'SET_COOKIE',
            payload: cookie
        });

        if (response?.error) {
            showToast(response.error, 'error');
            return;
        }

        showToast(isNewCookie ? 'Cookie created' : 'Cookie saved', 'success');
        if (typeof MilestoneTracker !== 'undefined') {
            MilestoneTracker.record('edit').catch(() => {});
        }
        recordRetentionUsage('edit');
        closeEditor();
        await loadCookies();

    } catch (error) {
        console.error('[Popup] Save cookie error:', error);
        showToast('Failed to save cookie', 'error');
    }
}

async function deleteCookie() {
    if (!selectedCookie) return;

    if (settings.readOnlyMode) {
        showToast('Read-only mode is enabled', 'error');
        return;
    }

    const domain = selectedCookie.domain.startsWith('.')
        ? selectedCookie.domain.slice(1)
        : selectedCookie.domain;
    const url = `http${selectedCookie.secure ? 's' : ''}://${domain}${selectedCookie.path}`;

    try {
        await chrome.runtime.sendMessage({
            action: 'DELETE_COOKIE',
            payload: { url, name: selectedCookie.name }
        });

        showToast('Cookie deleted', 'success');
        closeEditor();
        await loadCookies();

    } catch (error) {
        console.error('[Popup] Delete cookie error:', error);
        showToast('Failed to delete cookie', 'error');
    }
}

// ============================================================================
// JWT Decoder
// ============================================================================

function showJwtDecoder() {
    const decoded = JWT.decode(elements.cookieValue.value);
    if (!decoded) {
        showToast('Invalid JWT token', 'error');
        return;
    }

    elements.jwtHeader.textContent = JSON.stringify(decoded.header, null, 2);
    elements.jwtPayload.textContent = JSON.stringify(decoded.payload, null, 2);

    const expiry = JWT.formatExpiry(decoded.payload.exp);
    elements.jwtExpiry.textContent = expiry.text;
    elements.jwtExpiry.className = `jwt-expiry ${expiry.expired ? 'expired' : 'valid'}`;

    elements.jwtModal.hidden = false;

    // Focus trap for JWT modal (MD 21)
    if (typeof A11yManager !== 'undefined' && A11yManager.createTrap) {
        _jwtFocusTrap = A11yManager.createTrap(elements.jwtModal);
        _jwtFocusTrap.activate();
    }

    if (typeof MilestoneTracker !== 'undefined') {
        MilestoneTracker.record('jwtDecode').catch(() => {});
    }
    recordRetentionUsage('jwt');
}

function closeJwtModal() {
    // Deactivate focus trap (MD 21)
    if (_jwtFocusTrap && _jwtFocusTrap.deactivate) {
        _jwtFocusTrap.deactivate();
        _jwtFocusTrap = null;
    }

    elements.jwtModal.hidden = true;
}

// ============================================================================
// Export & Clear
// ============================================================================

async function exportCookies() {
    try {
        const json = await chrome.runtime.sendMessage({
            action: 'EXPORT_COOKIES',
            payload: { url: currentTab.url, format: 'json' }
        });

        await navigator.clipboard.writeText(json);
        showToast(`${currentCookies.length} cookies copied to clipboard`, 'success');
        if (typeof MilestoneTracker !== 'undefined') {
            MilestoneTracker.record('export').catch(() => {});
        }
        recordRetentionUsage('export');

    } catch (error) {
        console.error('[Popup] Export error:', error);
        showToast('Failed to export cookies', 'error');
    }
}

async function clearAllCookies() {
    if (settings.readOnlyMode) {
        showToast('Read-only mode is enabled', 'error');
        return;
    }

    showConfirm(
        'Clear All Cookies?',
        `This will remove all ${currentCookies.length} cookies for this domain.`,
        async () => {
            try {
                const domain = new URL(currentTab.url).hostname;
                const count = await chrome.runtime.sendMessage({
                    action: 'CLEAR_DOMAIN',
                    payload: { domain }
                });

                showToast(`Cleared ${count} cookies`, 'success');
                if (typeof MilestoneTracker !== 'undefined') {
                    MilestoneTracker.record('clear').catch(() => {});
                }
                recordRetentionUsage('clear');
                await loadCookies();

            } catch (error) {
                console.error('[Popup] Clear all error:', error);
                showToast('Failed to clear cookies', 'error');
            }
        }
    );
}

// ============================================================================
// Confirm Dialog
// ============================================================================

let confirmCallback = null;

function showConfirm(title, message, onConfirm) {
    elements.confirmTitle.textContent = title;
    elements.confirmMessage.textContent = message;
    confirmCallback = onConfirm;
    elements.confirmModal.hidden = false;

    // Focus trap for confirm modal (MD 21)
    if (typeof A11yManager !== 'undefined' && A11yManager.createTrap) {
        _confirmFocusTrap = A11yManager.createTrap(elements.confirmModal);
        _confirmFocusTrap.activate();
    }
}

function closeConfirm() {
    // Deactivate focus trap (MD 21)
    if (_confirmFocusTrap && _confirmFocusTrap.deactivate) {
        _confirmFocusTrap.deactivate();
        _confirmFocusTrap = null;
    }

    elements.confirmModal.hidden = true;
    confirmCallback = null;
}

// ============================================================================
// Toast Notification
// ============================================================================

let toastTimeout = null;

function showToast(message, type = 'success') {
    if (toastTimeout) {
        clearTimeout(toastTimeout);
    }

    elements.toastMessage.textContent = message;
    elements.toast.className = `toast toast-${type}`;

    // Security note: SVG icons are static strings, no user input (MD 18)
    // Set icon
    if (type === 'success') {
        elements.toastIcon.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
    `;
    } else {
        elements.toastIcon.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
    `;
    }

    elements.toast.hidden = false;

    // Announce to screen readers (MD 21)
    if (typeof A11yManager !== 'undefined' && A11yManager.announce) {
        A11yManager.announce(message);
    }

    toastTimeout = setTimeout(() => {
        elements.toast.hidden = true;
    }, 2500);
}

// ============================================================================
// Utilities
// ============================================================================

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDateTimeLocal(date) {
    const pad = (n) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        showToast('Copied to clipboard', 'success');
    } catch {
        showToast('Failed to copy', 'error');
    }
}

// ============================================================================
// Event Listeners
// ============================================================================

function setupEventListeners() {
    // Search (debounced for performance - MD 20)
    var _searchDebounceTimer = null;
    elements.searchInput.addEventListener('input', function() {
        if (_searchDebounceTimer) { clearTimeout(_searchDebounceTimer); }
        _searchDebounceTimer = setTimeout(function() {
            renderCookies(currentCookies);
        }, 150);
    });

    // Refresh
    elements.refreshBtn.addEventListener('click', async () => {
        showLoading();
        await loadCookies();
        showToast('Cookies refreshed', 'success');
    });

    // Actions
    elements.exportBtn.addEventListener('click', exportCookies);
    elements.addCookieBtn.addEventListener('click', () => openEditor(null));
    elements.clearAllBtn.addEventListener('click', clearAllCookies);

    // Read-only toggle
    elements.readOnlyToggle.addEventListener('change', async (e) => {
        settings.readOnlyMode = e.target.checked;
        await chrome.storage.local.set({ readOnlyMode: e.target.checked });
        showToast(e.target.checked ? 'Read-only mode enabled' : 'Read-only mode disabled', 'success');
    });

    // Editor modal
    elements.closeModal.addEventListener('click', closeEditor);
    elements.saveCookieBtn.addEventListener('click', saveCookie);
    elements.deleteCookieBtn.addEventListener('click', deleteCookie);
    elements.decodeJwt.addEventListener('click', showJwtDecoder);

    // JWT detection on value change
    elements.cookieValue.addEventListener('input', () => {
        elements.jwtBadge.hidden = !JWT.isJWT(elements.cookieValue.value);
    });

    // JWT modal
    elements.closeJwtModal.addEventListener('click', closeJwtModal);
    elements.copyHeader.addEventListener('click', () => {
        copyToClipboard(elements.jwtHeader.textContent);
    });
    elements.copyPayload.addEventListener('click', () => {
        copyToClipboard(elements.jwtPayload.textContent);
    });

    // Confirm modal
    elements.confirmCancel.addEventListener('click', closeConfirm);
    elements.confirmOk.addEventListener('click', () => {
        if (confirmCallback) {
            confirmCallback();
        }
        closeConfirm();
    });

    // Close modals on backdrop click
    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
        backdrop.addEventListener('click', () => {
            // Deactivate any active focus traps (MD 21)
            if (_editorFocusTrap && _editorFocusTrap.deactivate) { _editorFocusTrap.deactivate(); _editorFocusTrap = null; }
            if (_jwtFocusTrap && _jwtFocusTrap.deactivate) { _jwtFocusTrap.deactivate(); _jwtFocusTrap = null; }
            if (_confirmFocusTrap && _confirmFocusTrap.deactivate) { _confirmFocusTrap.deactivate(); _confirmFocusTrap = null; }

            elements.editorModal.hidden = true;
            elements.jwtModal.hidden = true;
            elements.confirmModal.hidden = true;
            selectedCookie = null;
        });
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + Shift + D to export debug bundle
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'D') {
            e.preventDefault();
            PopupErrorHandler.exportDebugBundle();
            return;
        }

        // Escape to close modals
        if (e.key === 'Escape') {
            if (!elements.confirmModal.hidden) {
                closeConfirm();
            } else if (!elements.jwtModal.hidden) {
                closeJwtModal();
            } else if (!elements.editorModal.hidden) {
                closeEditor();
            }
            return;
        }

        // / to focus search (when not in input)
        if (e.key === '/' && !isInputFocused()) {
            e.preventDefault();
            elements.searchInput.focus();
            elements.searchInput.select();
            return;
        }

        // Ctrl/Cmd + E to export
        if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
            e.preventDefault();
            exportCookies();
            return;
        }

        // Ctrl/Cmd + N to add new cookie
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            openEditor(null);
            return;
        }
    });

    // Save on Enter in editor (when not in textarea)
    elements.editorModal.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
            e.preventDefault();
            saveCookie();
        }
    });

    // Help link (MD 19)
    var helpLink = document.getElementById('helpLink');
    if (helpLink) {
        helpLink.addEventListener('click', function(e) {
            e.preventDefault();
            openHelpPage();
        });
    }

    // Keyboard shortcuts (MD 21)
    if (typeof A11yManager !== 'undefined' && A11yManager.registerShortcut) {
        A11yManager.registerShortcut('/', function() {
            var searchInput = document.getElementById('searchInput');
            if (searchInput) { searchInput.focus(); }
        }, 'Focus search');

        A11yManager.registerShortcut('escape', function() {
            var modal = document.getElementById('editorModal');
            if (modal && !modal.hidden) {
                // close the modal - call existing close function
                closeEditor();
            }
        }, 'Close modal');

        A11yManager.registerShortcut('mod+shift+a', function() {
            var addBtn = document.getElementById('addCookieBtn');
            if (addBtn) { addBtn.click(); }
        }, 'Add cookie');
    }
}

function isInputFocused() {
    const active = document.activeElement;
    return active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.tagName === 'SELECT');
}

// ============================================================================
// Growth Prompts (MD 14 - Viral Engine)
// ============================================================================

async function checkGrowthPrompts(newMilestones) {
    if (typeof GrowthPrompts === 'undefined') return;

    // Check review prompt first
    const shouldReview = await GrowthPrompts.shouldShowReviewPrompt();
    if (shouldReview) {
        showGrowthBanner(
            'Enjoying Cookie Manager? A quick review helps other developers find us!',
            'Leave Review',
            () => {
                window.open(GrowthPrompts.getReviewUrl(), '_blank');
                GrowthPrompts.recordReviewResponse('reviewed');
            },
            () => GrowthPrompts.recordReviewResponse('later')
        );
        return;
    }

    // Check share prompts for new milestones
    for (const milestone of newMilestones) {
        const config = GrowthPrompts.getPromptConfig(milestone.id);
        if (!config) continue;

        const shouldShow = await GrowthPrompts.shouldShowSharePrompt(milestone.id);
        if (shouldShow) {
            showGrowthBanner(
                config.message,
                'Share',
                () => {
                    const url = GrowthPrompts.getShareUrl('twitter');
                    if (url) window.open(url, '_blank');
                    GrowthPrompts.dismissSharePrompt(milestone.id);
                },
                () => GrowthPrompts.dismissSharePrompt(milestone.id)
            );
            return;
        }
    }
}

function showGrowthBanner(message, actionLabel, onAction, onDismiss) {
    // Remove existing banner if present
    const existing = document.getElementById('growthBanner');
    if (existing) existing.remove();

    const banner = document.createElement('div');
    banner.id = 'growthBanner';
    banner.className = 'growth-banner';

    const text = document.createElement('span');
    text.className = 'growth-text';
    text.textContent = message;

    const actions = document.createElement('div');
    actions.className = 'growth-actions';

    const actionBtn = document.createElement('button');
    actionBtn.className = 'btn btn-primary btn-sm';
    actionBtn.textContent = actionLabel;
    actionBtn.addEventListener('click', () => { onAction(); banner.remove(); });

    const dismissBtn = document.createElement('button');
    dismissBtn.className = 'btn-link btn-sm';
    dismissBtn.textContent = 'Later';
    dismissBtn.addEventListener('click', () => { onDismiss(); banner.remove(); });

    actions.appendChild(actionBtn);
    actions.appendChild(dismissBtn);
    banner.appendChild(text);
    banner.appendChild(actions);

    // Insert before footer
    const footer = document.querySelector('.footer');
    if (footer) {
        footer.parentNode.insertBefore(banner, footer);
    }
}

// ============================================================================
// Churn Prevention & Retention (MD 17)
// ============================================================================

function initRetention() {
    try {
        // Record popup session open
        chrome.runtime.sendMessage({ action: 'RECORD_USAGE', usageAction: 'session_open' }).catch(function() {});

        // Check for retention trigger
        chrome.runtime.sendMessage({ action: 'GET_RETENTION_TRIGGER' }).then(function(trigger) {
            if (trigger && trigger.show === true) {
                showRetentionBanner(trigger);
            }
        }).catch(function() {});
    } catch (e) {
        console.log('[Popup] Retention init skipped:', e.message);
    }
}

function showRetentionBanner(trigger) {
    var existing = document.getElementById('retentionBanner');
    if (existing) existing.remove();

    var banner = document.createElement('div');
    banner.id = 'retentionBanner';
    banner.className = 'retention-banner';

    var messageText = (trigger && trigger.message) ? trigger.message : 'Welcome back! Check out what Cookie Manager can do.';

    // Security: use DOM API instead of innerHTML (MD 18)
    var content = document.createElement('div');
    content.className = 'retention-content';
    var textSpan = document.createElement('span');
    textSpan.className = 'retention-text';
    textSpan.textContent = messageText;
    var dismissBtn = document.createElement('button');
    dismissBtn.className = 'retention-dismiss';
    dismissBtn.setAttribute('aria-label', 'Dismiss');
    dismissBtn.textContent = '\u00D7';
    content.appendChild(textSpan);
    content.appendChild(dismissBtn);
    banner.appendChild(content);

    // Insert before cookie list
    var list = document.getElementById('cookieList');
    if (list && list.parentNode) {
        list.parentNode.insertBefore(banner, list);
    }

    // Dismiss handler
    var dismissBtn = banner.querySelector('.retention-dismiss');
    if (dismissBtn) {
        dismissBtn.addEventListener('click', function() {
            banner.remove();
            chrome.runtime.sendMessage({ action: 'DISMISS_TRIGGER', triggerId: trigger.type }).catch(function() {});
        });
    }
}

function recordRetentionUsage(usageAction) {
    try {
        chrome.runtime.sendMessage({ action: 'RECORD_USAGE', usageAction: usageAction }).catch(function() {});
    } catch (e) {
        // Silently ignore retention tracking errors
    }
}

// ============================================================================
// Customer Support & Feedback (MD 19)
// ============================================================================

async function submitFeedback(type, message) {
    try {
        const response = await chrome.runtime.sendMessage({
            action: 'SUBMIT_FEEDBACK',
            payload: { type: type, message: message, metadata: { source: 'popup' } }
        });
        if (response && response.success) {
            showToast('Feedback submitted. Thank you!', 'success');
        } else {
            showToast(response?.error || 'Failed to submit feedback', 'error');
        }
        return response;
    } catch (error) {
        console.error('[Popup] Feedback error:', error);
        showToast('Failed to submit feedback', 'error');
        return null;
    }
}

function openHelpPage() {
    chrome.tabs.create({ url: chrome.runtime.getURL('src/help/help.html') });
}

// ============================================================================
// Start
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    const startTime = performance.now();
    init().then(() => {
        const loadTime = Math.round(performance.now() - startTime);
        console.log(`[Popup] Loaded in ${loadTime}ms`);
        // Store popup load time
        chrome.storage.local.get({ popupLoadTimes: [] }, (result) => {
            const times = result.popupLoadTimes;
            times.push({ time: loadTime, timestamp: Date.now() });
            if (times.length > 20) times.shift();
            chrome.storage.local.set({ popupLoadTimes: times });
        });
    }).catch((err) => {
        PopupErrorHandler.capture({ type: 'init_error', message: err.message, stack: err.stack });
    });
});
