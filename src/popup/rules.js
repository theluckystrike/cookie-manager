/**
 * Cookie Manager - Auto-Delete Rules Tab
 * Manages creation, listing, toggling, and deletion of auto-delete rules.
 * Communicates with the background service worker via chrome.runtime.sendMessage.
 */

// ============================================================================
// Schedule Definitions
// ============================================================================

const SCHEDULE_OPTIONS = [
    { label: chrome.i18n.getMessage('scheduleEveryHour') || 'Every hour',       minutes: 60 },
    { label: chrome.i18n.getMessage('scheduleEvery6Hours') || 'Every 6 hours',    minutes: 360 },
    { label: chrome.i18n.getMessage('scheduleEveryDay') || 'Every day',        minutes: 1440 },
    { label: chrome.i18n.getMessage('scheduleOnBrowserClose') || 'On browser close', minutes: 0 }
];

function scheduleLabel(intervalMinutes) {
    if (intervalMinutes === 0) return chrome.i18n.getMessage('scheduleOnBrowserClose') || 'On browser close';
    var match = SCHEDULE_OPTIONS.find(function(o) { return o.minutes === intervalMinutes; });
    if (match) return match.label;
    if (intervalMinutes < 60) return intervalMinutes + 'm';
    if (intervalMinutes < 1440) return Math.round(intervalMinutes / 60) + 'h';
    return Math.round(intervalMinutes / 1440) + 'd';
}

// ============================================================================
// Free-tier limit
// ============================================================================

const RULES_FREE_LIMIT = 1;

// ============================================================================
// RulesManager
// ============================================================================

var RulesManager = (function() {

    // Cached rules list
    var _rules = [];
    var _loading = false;
    var _formVisible = false;
    var _editingRuleId = null; // null = creating new
    var _initialized = false;

    // ----- DOM references (resolved lazily on init) -----
    var _els = {};

    function $(id) { return document.getElementById(id); }

    function _resolveElements() {
        _els.container     = $('tabRules');
        _els.list          = $('rulesList');
        _els.emptyState    = $('rulesEmpty');
        _els.addBtn        = $('addRuleBtn');
        _els.limitBanner   = $('rulesLockOverlay');

        // Form
        _els.formWrap      = $('ruleFormOverlay');
        _els.formTitle      = $('ruleFormTitle');
        _els.domainInput   = $('ruleDomain');
        _els.patternInput  = $('ruleCookiePattern');
        _els.scheduleSelect = $('ruleSchedule');
        _els.saveBtn       = $('ruleFormSave');
        _els.cancelBtn     = $('ruleFormCancel');
    }

    // ----- Messaging helpers -----

    function _send(action, payload) {
        return chrome.runtime.sendMessage({ action: action, payload: payload || {} });
    }

    // ----- Data operations -----

    async function _loadRules() {
        if (_loading) return; // Prevent concurrent loads from rapid tab switching
        _loading = true;
        _renderLoading();
        try {
            var response = await _send('GET_AUTO_DELETE_RULES');
            _rules = Array.isArray(response) ? response : [];
        } catch (e) {
            console.error('[Rules] Failed to load rules:', e);
            _rules = [];
        }
        _loading = false;
        _render();
    }

    async function _saveRule(ruleData) {
        try {
            var response = await _send('SAVE_AUTO_DELETE_RULE', ruleData);
            if (response && response.error) {
                _toast(response.error, 'error');
                return false;
            }
            _toast(_editingRuleId ? (chrome.i18n.getMessage('ntfRuleUpdated') || 'Rule updated') : (chrome.i18n.getMessage('ntfRuleCreated') || 'Rule created'), 'success');
            return true;
        } catch (e) {
            console.error('[Rules] Failed to save rule:', e);
            _toast(chrome.i18n.getMessage('errFailedSaveRule') || 'Failed to save rule', 'error');
            return false;
        }
    }

    async function _deleteRule(id) {
        try {
            var response = await _send('DELETE_AUTO_DELETE_RULE', { id: id });
            if (response && response.error) {
                _toast(response.error, 'error');
                return false;
            }
            _toast(chrome.i18n.getMessage('ntfRuleDeleted') || 'Rule deleted', 'success');
            return true;
        } catch (e) {
            console.error('[Rules] Failed to delete rule:', e);
            _toast(chrome.i18n.getMessage('errFailedDeleteRule') || 'Failed to delete rule', 'error');
            return false;
        }
    }

    async function _toggleRule(id, enabled) {
        var rule = _rules.find(function(r) { return r.id === id; });
        if (!rule) return;
        var updatedRule = {
            id: rule.id,
            domain: rule.domain,
            pattern: rule.pattern,
            intervalMinutes: rule.intervalMinutes,
            enabled: enabled
        };
        var ok = await _saveRule(updatedRule);
        if (ok) await _loadRules();
    }

    // ----- Cookie count helper -----

    async function _getCookieCount(domain) {
        try {
            var response = await _send('GET_ALL_COOKIES', { domain: domain });
            if (Array.isArray(response)) return response.length;
            return 0;
        } catch (e) {
            return 0;
        }
    }

    // ----- Toast helper (delegates to popup.js global) -----

    function _toast(message, type) {
        if (typeof showToast === 'function') {
            showToast(message, type);
        } else {
            console.log('[Rules]', type, message);
        }
    }

    // ----- Escape HTML helper -----

    function _esc(text) {
        if (!text) return '';
        var d = document.createElement('div');
        d.textContent = text;
        return d.innerHTML;
    }

    // ----- Rendering -----

    function _renderLoading() {
        if (!_els.list) return;
        _els.list.hidden = true;
        if (_els.emptyState) _els.emptyState.hidden = true;
        if (_els.limitBanner) _els.limitBanner.hidden = true;
        if (_els.addBtn) _els.addBtn.hidden = true;
    }

    async function _render() {
        if (!_els.list) return;

        // Pro users bypass the free-tier limit
        var isPro = typeof LicenseManager !== 'undefined' && typeof LicenseManager.isPro === 'function' && await LicenseManager.isPro();
        var atLimit = !isPro && _rules.length >= RULES_FREE_LIMIT;

        // Show/hide add button vs limit banner
        if (_els.addBtn) _els.addBtn.hidden = atLimit;
        if (_els.limitBanner) _els.limitBanner.hidden = !atLimit;

        if (_rules.length === 0) {
            _els.list.hidden = true;
            if (_els.emptyState) _els.emptyState.hidden = false;
            return;
        }

        if (_els.emptyState) _els.emptyState.hidden = true;
        _els.list.hidden = false;
        _els.list.textContent = ''; // clear

        _rules.forEach(function(rule) {
            var card = _createRuleCard(rule);
            _els.list.appendChild(card);
        });

        // Fetch cookie counts async and patch in
        _rules.forEach(function(rule) {
            _getCookieCount(rule.domain).then(function(count) {
                var countEl = _els.list.querySelector('[data-rule-count="' + rule.id + '"]');
                if (countEl) {
                    countEl.textContent = chrome.i18n.getMessage('ruleCookiesAffected', [String(count)]) || count + ' cookie' + (count !== 1 ? 's' : '') + ' affected';
                }
            });
        });
    }

    function _createRuleCard(rule) {
        var card = document.createElement('div');
        card.className = 'rule-card' + (rule.enabled ? '' : ' rule-card--disabled');
        card.setAttribute('data-rule-id', rule.id);

        // -- Header row: domain + toggle --
        var header = document.createElement('div');
        header.className = 'rule-card-header';

        var domainSpan = document.createElement('span');
        domainSpan.className = 'rule-domain';
        domainSpan.textContent = rule.domain;

        var toggleLabel = document.createElement('label');
        toggleLabel.className = 'toggle rule-toggle';
        toggleLabel.title = rule.enabled ? 'Disable rule' : 'Enable rule';
        var toggleInput = document.createElement('input');
        toggleInput.type = 'checkbox';
        toggleInput.checked = rule.enabled;
        toggleInput.setAttribute('aria-label', (rule.enabled ? 'Disable' : 'Enable') + ' rule for ' + rule.domain);
        var toggleSlider = document.createElement('span');
        toggleSlider.className = 'toggle-slider';
        toggleLabel.appendChild(toggleInput);
        toggleLabel.appendChild(toggleSlider);

        toggleInput.addEventListener('change', function() {
            _toggleRule(rule.id, toggleInput.checked);
        });

        header.appendChild(domainSpan);
        header.appendChild(toggleLabel);

        // -- Meta row: pattern badge, schedule badge, cookie count --
        var meta = document.createElement('div');
        meta.className = 'rule-card-meta';

        var patternBadge = document.createElement('span');
        patternBadge.className = 'badge rule-badge-pattern';
        patternBadge.textContent = rule.pattern === '*' ? (chrome.i18n.getMessage('ruleAllCookies') || 'All cookies') : rule.pattern;

        var scheduleBadge = document.createElement('span');
        scheduleBadge.className = 'badge rule-badge-schedule';
        scheduleBadge.textContent = scheduleLabel(rule.intervalMinutes);

        var countBadge = document.createElement('span');
        countBadge.className = 'rule-cookie-count';
        countBadge.setAttribute('data-rule-count', rule.id);
        countBadge.textContent = '...';

        meta.appendChild(patternBadge);
        meta.appendChild(scheduleBadge);
        meta.appendChild(countBadge);

        // -- Actions row: edit + delete --
        var actions = document.createElement('div');
        actions.className = 'rule-card-actions';

        var editBtn = document.createElement('button');
        editBtn.className = 'btn btn-secondary btn-sm';
        editBtn.textContent = chrome.i18n.getMessage('buttonEdit') || 'Edit';
        editBtn.setAttribute('aria-label', 'Edit rule for ' + rule.domain);
        editBtn.addEventListener('click', function() {
            _openForm(rule);
        });

        var deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn btn-danger-outline btn-sm';
        deleteBtn.textContent = chrome.i18n.getMessage('buttonDelete') || 'Delete';
        deleteBtn.setAttribute('aria-label', 'Delete rule for ' + rule.domain);
        deleteBtn.addEventListener('click', function() {
            _confirmDeleteRule(rule);
        });

        actions.appendChild(editBtn);
        actions.appendChild(deleteBtn);

        card.appendChild(header);
        card.appendChild(meta);
        card.appendChild(actions);

        return card;
    }

    // ----- Confirm delete (uses popup.js showConfirm if available) -----

    function _confirmDeleteRule(rule) {
        if (typeof showConfirm === 'function') {
            showConfirm(
                chrome.i18n.getMessage('confirmDeleteRuleTitle') || 'Delete Rule?',
                chrome.i18n.getMessage('confirmDeleteRuleMsg', [rule.domain]) || 'Delete the auto-delete rule for "' + rule.domain + '"?',
                async function() {
                    var ok = await _deleteRule(rule.id);
                    if (ok) await _loadRules();
                }
            );
        } else {
            // Fallback: native confirm
            if (confirm(chrome.i18n.getMessage('confirmDeleteRuleMsg', [rule.domain]) || 'Delete the auto-delete rule for "' + rule.domain + '"?')) {
                _deleteRule(rule.id).then(function(ok) {
                    if (ok) _loadRules();
                });
            }
        }
    }

    // ----- Form -----

    function _openForm(rule) {
        if (!_els.formWrap) return;
        _formVisible = true;
        _editingRuleId = rule ? rule.id : null;

        if (_els.formTitle) {
            _els.formTitle.textContent = rule ? (chrome.i18n.getMessage('titleEditRule') || 'Edit Rule') : (chrome.i18n.getMessage('titleAddRule') || 'Add Rule');
        }

        _els.domainInput.value   = rule ? rule.domain : '';
        _els.patternInput.value  = rule ? rule.pattern : '*';

        // Select the matching schedule option
        var mins = rule ? rule.intervalMinutes : 60;
        var options = _els.scheduleSelect.options;
        var found = false;
        for (var i = 0; i < options.length; i++) {
            if (parseInt(options[i].value) === mins) {
                _els.scheduleSelect.selectedIndex = i;
                found = true;
                break;
            }
        }
        if (!found) _els.scheduleSelect.selectedIndex = 0;

        _els.formWrap.hidden = false;
        _els.domainInput.focus();
    }

    function _closeForm() {
        if (!_els.formWrap) return;
        _formVisible = false;
        _editingRuleId = null;
        _els.formWrap.hidden = true;
    }

    async function _handleFormSubmit() {
        var domain = (_els.domainInput.value || '').trim();
        var pattern = (_els.patternInput.value || '').trim() || '*';
        var intervalMinutes = parseInt(_els.scheduleSelect.value);
        if (isNaN(intervalMinutes)) intervalMinutes = 60;
        // When editing, preserve the rule's enabled state; new rules default to enabled
        var rule = _editingRuleId ? _rules.find(function(r) { return r.id === _editingRuleId; }) : null;
        var enabled = rule ? rule.enabled : true;

        if (!domain) {
            _toast(chrome.i18n.getMessage('errDomainPatternRequired') || 'Domain pattern is required', 'error');
            _els.domainInput.focus();
            return;
        }

        // Enforce free-tier limit when creating new (pro users bypass)
        var isPro = typeof LicenseManager !== 'undefined' && typeof LicenseManager.isPro === 'function' && await LicenseManager.isPro();
        if (!isPro && !_editingRuleId && _rules.length >= RULES_FREE_LIMIT) {
            _toast(chrome.i18n.getMessage('errFreeRuleLimit') || 'Free plan allows 1 rule. Upgrade for more.', 'error');
            return;
        }

        var ruleData = {
            domain: domain,
            pattern: pattern,
            intervalMinutes: intervalMinutes,
            enabled: enabled
        };

        if (_editingRuleId) {
            ruleData.id = _editingRuleId;
        }

        var ok = await _saveRule(ruleData);
        if (ok) {
            _closeForm();
            await _loadRules();
        }
    }

    // ----- Event binding -----

    function _bindEvents() {
        if (_els.addBtn) {
            _els.addBtn.addEventListener('click', function() {
                _openForm(null);
            });
        }

        if (_els.saveBtn) {
            _els.saveBtn.addEventListener('click', function() {
                _handleFormSubmit();
            });
        }

        if (_els.cancelBtn) {
            _els.cancelBtn.addEventListener('click', function() {
                _closeForm();
            });
        }

        // Allow Enter key to submit form (except in textareas)
        if (_els.formWrap) {
            _els.formWrap.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
                    e.preventDefault();
                    _handleFormSubmit();
                }
                if (e.key === 'Escape') {
                    _closeForm();
                }
            });
        }
    }

    // ----- Public API -----

    async function init() {
        _resolveElements();
        if (!_els.container) {
            // Tab content element not found yet; bail silently
            console.debug('[Rules] #tabRules not found, skipping init');
            return;
        }
        if (!_initialized) {
            _bindEvents();
            _initialized = true;
        }
        await _loadRules();
    }

    return {
        init: init,
        reload: _loadRules
    };

})();
