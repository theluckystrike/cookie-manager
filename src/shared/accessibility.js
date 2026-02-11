/**
 * Cookie Manager - Accessibility Compliance Utilities (A11yManager)
 * Focus management, focus trapping, live region announcements,
 * keyboard shortcuts, reduced motion detection, and WCAG contrast checks.
 * Local only - zero external dependencies. Works in popup and options contexts.
 */
(function () {
    'use strict';

    // -- Constants -----------------------------------------------------------

    var FOCUSABLE_SELECTOR = [
        'button:not([disabled])',
        'a[href]',
        'input:not([disabled])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        '[tabindex]:not([tabindex="-1"])'
    ].join(', ');

    var LIVE_REGION_ID = 'a11y-live-region';
    var ANNOUNCEMENT_DELAY = 50;

    // ========================================================================
    // 1. FocusManager
    // ========================================================================

    /** Checks whether an element is visible in the DOM. */
    function isElementVisible(el) {
        if (!el) return false;
        if (el.hidden) return false;
        var style = el.style;
        if (style && (style.display === 'none' || style.visibility === 'hidden')) return false;
        if (el.offsetParent !== null) return true;
        // position:fixed elements have offsetParent === null but are still visible
        if (typeof getComputedStyle === 'function') {
            var computed = getComputedStyle(el);
            if (computed.position === 'fixed' && computed.display !== 'none') return true;
        }
        return false;
    }

    /** Returns an array of visible, focusable elements within the given container. */
    function getFocusableElements(container) {
        if (!container || typeof container.querySelectorAll !== 'function') return [];
        var candidates = container.querySelectorAll(FOCUSABLE_SELECTOR);
        var result = [];
        for (var i = 0; i < candidates.length; i++) {
            if (isElementVisible(candidates[i])) {
                result.push(candidates[i]);
            }
        }
        return result;
    }

    /** Moves focus to the first focusable element within the container. */
    function focusFirst(container) {
        var elements = getFocusableElements(container);
        if (elements.length > 0) {
            elements[0].focus();
            return elements[0];
        }
        return null;
    }

    /** Moves focus to the last focusable element within the container. */
    function focusLast(container) {
        var elements = getFocusableElements(container);
        if (elements.length > 0) {
            elements[elements.length - 1].focus();
            return elements[elements.length - 1];
        }
        return null;
    }

    var FocusManager = {
        getFocusableElements: getFocusableElements,
        focusFirst: focusFirst,
        focusLast: focusLast,
        isElementVisible: isElementVisible
    };

    // ========================================================================
    // 2. FocusTrap
    // ========================================================================

    /**
     * Creates a focus trap around the given element.
     * Returns an object with activate() and deactivate() methods.
     * Tab/Shift+Tab wrap within the element; Escape triggers onEscape callback.
     */
    function createTrap(element, options) {
        var opts = options || {};
        var previouslyFocused = null;
        var trapListener = null;
        var active = false;

        function handleKeydown(event) {
            var key = event.key || event.keyCode;

            // Handle Escape key
            if (key === 'Escape' || key === 'Esc' || key === 27) {
                if (typeof opts.onEscape === 'function') {
                    opts.onEscape(event);
                }
                trap.deactivate();
                return;
            }

            // Handle Tab key for focus wrapping
            if (key === 'Tab' || key === 9) {
                var focusable = getFocusableElements(element);
                if (focusable.length === 0) {
                    event.preventDefault();
                    return;
                }
                var first = focusable[0];
                var last = focusable[focusable.length - 1];

                if (event.shiftKey) {
                    if (document.activeElement === first) {
                        event.preventDefault();
                        last.focus();
                    }
                } else {
                    if (document.activeElement === last) {
                        event.preventDefault();
                        first.focus();
                    }
                }
            }
        }

        var trap = {
            activate: function () {
                if (active) return;
                active = true;
                previouslyFocused = document.activeElement;
                trapListener = handleKeydown;
                document.addEventListener('keydown', trapListener, true);
                focusFirst(element);
            },
            deactivate: function () {
                if (!active) return;
                active = false;
                if (trapListener) {
                    document.removeEventListener('keydown', trapListener, true);
                    trapListener = null;
                }
                if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
                    previouslyFocused.focus();
                }
                previouslyFocused = null;
            },
            isActive: function () {
                return active;
            }
        };

        return trap;
    }

    var FocusTrap = {
        createTrap: createTrap
    };

    // ========================================================================
    // 3. LiveRegion (Screen Reader Announcements)
    // ========================================================================

    var liveRegionElement = null;

    /** Creates a visually-hidden div with role=status and aria-live=polite. */
    function initLiveRegion() {
        if (liveRegionElement && document.body.contains(liveRegionElement)) {
            return liveRegionElement;
        }
        var existing = document.getElementById(LIVE_REGION_ID);
        if (existing) {
            liveRegionElement = existing;
            return liveRegionElement;
        }

        var el = document.createElement('div');
        el.id = LIVE_REGION_ID;
        el.setAttribute('role', 'status');
        el.setAttribute('aria-live', 'polite');
        el.setAttribute('aria-atomic', 'true');

        // Visually hidden but accessible to screen readers
        el.style.position = 'absolute';
        el.style.width = '1px';
        el.style.height = '1px';
        el.style.padding = '0';
        el.style.margin = '-1px';
        el.style.overflow = 'hidden';
        el.style.clip = 'rect(0, 0, 0, 0)';
        el.style.whiteSpace = 'nowrap';
        el.style.border = '0';

        document.body.appendChild(el);
        liveRegionElement = el;
        return liveRegionElement;
    }

    /**
     * Announces a message to screen readers. Clears text first, then sets it
     * in a requestAnimationFrame (or setTimeout 50ms fallback) so readers detect it.
     */
    function announce(message, priority) {
        var el = liveRegionElement;
        if (!el) {
            el = initLiveRegion();
        }
        var level = (priority === 'assertive') ? 'assertive' : 'polite';
        el.setAttribute('aria-live', level);

        // Clear then set in next frame so screen readers pick up the change
        el.textContent = '';
        if (typeof requestAnimationFrame === 'function') {
            requestAnimationFrame(function () {
                el.textContent = message || '';
            });
        } else {
            setTimeout(function () {
                el.textContent = message || '';
            }, ANNOUNCEMENT_DELAY);
        }
    }

    /** Clears any current announcement from the live region. */
    function clearAnnouncement() {
        if (liveRegionElement) {
            liveRegionElement.textContent = '';
        }
    }

    var LiveRegion = {
        initLiveRegion: initLiveRegion,
        announce: announce,
        clearAnnouncement: clearAnnouncement
    };

    // ========================================================================
    // 4. KeyboardShortcuts
    // ========================================================================

    var shortcuts = [];
    var shortcutsEnabled = true;
    var shortcutListener = null;

    /**
     * Normalizes a KeyboardEvent into a combo string.
     * Converts Ctrl/Meta to 'mod'. Example: 'mod+shift+e', 'escape', '/'.
     */
    function getKeyCombo(event) {
        var parts = [];
        if (event.ctrlKey || event.metaKey) parts.push('mod');
        if (event.altKey) parts.push('alt');
        if (event.shiftKey) parts.push('shift');

        var key = event.key;
        if (key) {
            key = key.toLowerCase();
            // Skip modifier-only keys
            if (key === 'control' || key === 'meta' || key === 'alt' || key === 'shift') {
                return parts.join('+');
            }
            if (key === 'esc') key = 'escape';
            if (key === ' ') key = 'space';
            if (key === 'arrowup') key = 'up';
            if (key === 'arrowdown') key = 'down';
            if (key === 'arrowleft') key = 'left';
            if (key === 'arrowright') key = 'right';
            parts.push(key);
        }
        return parts.join('+');
    }

    /** Normalizes a combo string to canonical order: mod, alt, shift, key. */
    function normalizeCombo(combo) {
        if (typeof combo !== 'string') return '';
        var parts = combo.toLowerCase().split('+');
        var modifiers = [];
        var key = '';

        for (var i = 0; i < parts.length; i++) {
            var part = parts[i].trim();
            if (part === 'mod' || part === 'ctrl' || part === 'meta' || part === 'cmd') {
                if (modifiers.indexOf('mod') === -1) modifiers.push('mod');
            } else if (part === 'alt') {
                if (modifiers.indexOf('alt') === -1) modifiers.push('alt');
            } else if (part === 'shift') {
                if (modifiers.indexOf('shift') === -1) modifiers.push('shift');
            } else {
                key = part;
            }
        }

        var order = ['mod', 'alt', 'shift'];
        modifiers.sort(function (a, b) {
            return order.indexOf(a) - order.indexOf(b);
        });
        if (key) modifiers.push(key);
        return modifiers.join('+');
    }

    /** Handles keydown events and dispatches to registered shortcut handlers. */
    function handleShortcutKeydown(event) {
        if (!shortcutsEnabled) return;

        var tag = event.target && event.target.tagName;
        var isInput = (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT');
        var isEditable = event.target && event.target.isContentEditable;

        var combo = getKeyCombo(event);
        var normalized = normalizeCombo(combo);

        for (var i = 0; i < shortcuts.length; i++) {
            var shortcut = shortcuts[i];
            if (shortcut.normalizedCombo === normalized) {
                // Single-character shortcuts (no modifiers) are skipped in input fields
                var hasModifier = normalized.indexOf('mod') !== -1 ||
                                  normalized.indexOf('alt') !== -1;
                if (!hasModifier && (isInput || isEditable)) continue;

                event.preventDefault();
                event.stopPropagation();
                shortcut.handler(event);
                return;
            }
        }
    }

    /** Registers a keyboard shortcut with a combo string, handler, and description. */
    function registerShortcut(combo, handler, description) {
        if (typeof combo !== 'string' || typeof handler !== 'function') return;
        var normalized = normalizeCombo(combo);
        if (!normalized) return;

        shortcuts.push({
            combo: combo,
            normalizedCombo: normalized,
            handler: handler,
            description: description || ''
        });

        // Attach global listener on first registration
        if (!shortcutListener) {
            shortcutListener = handleShortcutKeydown;
            document.addEventListener('keydown', shortcutListener, false);
        }
    }

    /** Removes a previously registered shortcut by its combo string. */
    function unregisterShortcut(combo) {
        var normalized = normalizeCombo(combo);
        for (var i = shortcuts.length - 1; i >= 0; i--) {
            if (shortcuts[i].normalizedCombo === normalized) {
                shortcuts.splice(i, 1);
            }
        }
    }

    /** Enables shortcut processing. */
    function enableShortcuts() {
        shortcutsEnabled = true;
    }

    /** Disables shortcut processing (e.g., when a modal with input is open). */
    function disableShortcuts() {
        shortcutsEnabled = false;
    }

    /** Returns array of {combo, description} for help display. */
    function getShortcutList() {
        var list = [];
        for (var i = 0; i < shortcuts.length; i++) {
            list.push({
                combo: shortcuts[i].combo,
                description: shortcuts[i].description
            });
        }
        return list;
    }

    var KeyboardShortcuts = {
        registerShortcut: registerShortcut,
        unregisterShortcut: unregisterShortcut,
        getKeyCombo: getKeyCombo,
        enableShortcuts: enableShortcuts,
        disableShortcuts: disableShortcuts,
        getShortcutList: getShortcutList
    };

    // ========================================================================
    // 5. Reduced Motion Check
    // ========================================================================

    /** Returns true if the user prefers reduced motion via OS/browser setting. */
    function prefersReducedMotion() {
        if (typeof matchMedia !== 'function') return false;
        var mql = matchMedia('(prefers-reduced-motion: reduce)');
        return mql && mql.matches === true;
    }

    // ========================================================================
    // 6. Contrast Check (lightweight WCAG utilities)
    // ========================================================================

    /** Computes relative luminance of an sRGB color per WCAG 2.x (channels 0-255). */
    function getLuminance(r, g, b) {
        var rn = r / 255;
        var gn = g / 255;
        var bn = b / 255;

        var rLin = rn <= 0.03928 ? rn / 12.92 : Math.pow((rn + 0.055) / 1.055, 2.4);
        var gLin = gn <= 0.03928 ? gn / 12.92 : Math.pow((gn + 0.055) / 1.055, 2.4);
        var bLin = bn <= 0.03928 ? bn / 12.92 : Math.pow((bn + 0.055) / 1.055, 2.4);

        return 0.2126 * rLin + 0.7152 * gLin + 0.0722 * bLin;
    }

    /** Returns the contrast ratio between two [r,g,b] arrays (ratio from 1 to 21). */
    function getContrastRatio(rgb1, rgb2) {
        if (!Array.isArray(rgb1) || !Array.isArray(rgb2)) return 1;
        if (rgb1.length < 3 || rgb2.length < 3) return 1;

        var l1 = getLuminance(rgb1[0], rgb1[1], rgb1[2]);
        var l2 = getLuminance(rgb2[0], rgb2[1], rgb2[2]);
        var lighter = Math.max(l1, l2);
        var darker = Math.min(l1, l2);

        return (lighter + 0.05) / (darker + 0.05);
    }

    /** Checks if ratio meets WCAG AA (4.5:1 normal text, 3:1 large text). */
    function meetsAA(ratio, isLarge) {
        var threshold = isLarge ? 3 : 4.5;
        return ratio >= threshold;
    }

    var Contrast = {
        getLuminance: getLuminance,
        getContrastRatio: getContrastRatio,
        meetsAA: meetsAA
    };

    // ========================================================================
    // Public API
    // ========================================================================

    var A11yManager = {
        FocusManager: FocusManager,
        FocusTrap: FocusTrap,
        LiveRegion: LiveRegion,
        KeyboardShortcuts: KeyboardShortcuts,
        Contrast: Contrast,
        prefersReducedMotion: prefersReducedMotion
    };

    // -- Expose Globally -----------------------------------------------------
    var root = typeof self !== 'undefined' ? self : (typeof window !== 'undefined' ? window : {});
    root.A11yManager = A11yManager;

    if (typeof self !== 'undefined') self.A11yManager = A11yManager;
    if (typeof window !== 'undefined') window.A11yManager = A11yManager;
})();
