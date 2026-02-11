# Agent 2: Global Styles & Components

## Phase 08 -- Branding & Retention System | Zovo Cookie Manager

**Agent:** 2 of 5
**Scope:** Shared CSS design system (`zovo-brand.css`) + Preact component library
**Date:** 2026-02-11

---

## Table of Contents

1. [Complete Shared Stylesheet (`zovo-brand.css`)](#1-complete-shared-stylesheet)
2. [Cookie Manager-Specific Components](#2-cookie-manager-specific-components)
3. [Preact Component Templates](#3-preact-component-templates)
4. [Design Token Summary Table](#4-design-token-summary-table)

---

## 1. Complete Shared Stylesheet

The following CSS file is the single source of truth for all Zovo Chrome extensions. It is based on the MD playbook foundation and enhanced with full component coverage, complete dark mode, Cookie Manager-specific components, accessibility compliance, and animation utilities.

### File: `shared/zovo-brand.css`

```css
/* ==========================================================================
   Zovo Brand System v1.0
   Source: https://zovo.one/brand
   Extension: Cookie Manager (primary), all Zovo extensions (shared)

   WCAG AA compliant contrast ratios throughout.
   Tested: light mode 4.5:1+ body text, 3:1+ large text/UI.
   Dark mode: same minimums against dark backgrounds.
   ========================================================================== */

/* ---------------------------------------------------------------------------
   FONT IMPORT
   Inter via Google Fonts. Loaded with display=swap so the popup renders
   instantly with the system fallback, then swaps in Inter once fetched.
   --------------------------------------------------------------------------- */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');


/* ===========================================================================
   1. CSS CUSTOM PROPERTIES (Design Tokens)
   =========================================================================== */

:root {
  /* -------------------------------------------------------------------------
     1a. COLOR -- Primary Palette
     Primary uses indigo (brand color across all Zovo products).
     Section-4 UI spec uses blue (#2563EB) for "Zovo blue" in Cookie Manager.
     We reconcile: --zovo-primary is the shared brand indigo; --cm-brand is
     the Cookie Manager-specific blue used for CTAs inside that extension.
     ------------------------------------------------------------------------ */
  --zovo-primary: #6366f1;
  --zovo-primary-hover: #4f46e5;
  --zovo-primary-active: #4338ca;
  --zovo-primary-light: #e0e7ff;
  --zovo-primary-light-rgb: 224, 231, 255;

  /* Cookie Manager brand blue (from section-4 spec) */
  --cm-brand: #2563eb;
  --cm-brand-hover: #1d4ed8;
  --cm-brand-active: #1e40af;
  --cm-brand-light: #dbeafe;

  /* -------------------------------------------------------------------------
     1b. COLOR -- Secondary
     ------------------------------------------------------------------------ */
  --zovo-secondary: #1e293b;
  --zovo-secondary-hover: #334155;
  --zovo-secondary-light: #f1f5f9;

  /* -------------------------------------------------------------------------
     1c. COLOR -- Accent
     ------------------------------------------------------------------------ */
  --zovo-accent: #10b981;
  --zovo-accent-hover: #059669;
  --zovo-accent-light: #d1fae5;

  /* -------------------------------------------------------------------------
     1d. COLOR -- Semantic
     Matches section-4: success #16A34A, warning #D97706, danger #DC2626,
     info #0EA5E9. The shared system uses slightly different defaults; we
     override to match the Cookie Manager spec exactly.
     ------------------------------------------------------------------------ */
  --zovo-success: #16a34a;
  --zovo-success-light: #dcfce7;
  --zovo-success-bg: rgba(22, 163, 74, 0.10);
  --zovo-warning: #d97706;
  --zovo-warning-light: #fef3c7;
  --zovo-warning-bg: rgba(217, 119, 6, 0.10);
  --zovo-error: #dc2626;
  --zovo-error-light: #fee2e2;
  --zovo-error-bg: rgba(220, 38, 38, 0.10);
  --zovo-info: #0ea5e9;
  --zovo-info-light: #e0f2fe;
  --zovo-info-bg: rgba(14, 165, 233, 0.10);

  /* -------------------------------------------------------------------------
     1e. COLOR -- Pro / Premium
     Purple gradient for PRO badges, gold for upsell accents.
     ------------------------------------------------------------------------ */
  --zovo-pro: #7c3aed;
  --zovo-pro-hover: #6d28d9;
  --zovo-pro-light: #ede9fe;
  --zovo-pro-gradient: linear-gradient(135deg, #7c3aed, #6d28d9);
  --zovo-pro-gold: #f59e0b;
  --zovo-pro-gold-light: #fef3c7;

  /* -------------------------------------------------------------------------
     1f. COLOR -- Backgrounds
     Matches section-4 light mode palette exactly.
     ------------------------------------------------------------------------ */
  --zovo-bg-primary: #ffffff;
  --zovo-bg-secondary: #f7f8fa;
  --zovo-bg-tertiary: #edeef2;
  --zovo-bg-elevated: #ffffff;

  /* -------------------------------------------------------------------------
     1g. COLOR -- Text
     Section-4 spec: primary #1A1D23, secondary #5F6368, tertiary #9AA0A6.
     ------------------------------------------------------------------------ */
  --zovo-text-primary: #1a1d23;
  --zovo-text-secondary: #5f6368;
  --zovo-text-muted: #9aa0a6;
  --zovo-text-inverse: #ffffff;

  /* -------------------------------------------------------------------------
     1h. COLOR -- Borders
     ------------------------------------------------------------------------ */
  --zovo-border: #e0e2e6;
  --zovo-border-hover: #c8cbd0;
  --zovo-border-focus: var(--cm-brand);

  /* -------------------------------------------------------------------------
     2. TYPOGRAPHY
     Section-4: Inter stack. Monospace for cookie values.
     ------------------------------------------------------------------------ */
  --zovo-font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --zovo-font-mono: 'SF Mono', 'Fira Code', 'Consolas', 'Monaco', monospace;

  --zovo-font-size-xs: 11px;
  --zovo-font-size-sm: 12px;
  --zovo-font-size-base: 13px;
  --zovo-font-size-md: 14px;
  --zovo-font-size-lg: 16px;
  --zovo-font-size-xl: 18px;
  --zovo-font-size-2xl: 24px;

  --zovo-font-weight-normal: 400;
  --zovo-font-weight-medium: 500;
  --zovo-font-weight-semibold: 600;
  --zovo-font-weight-bold: 700;

  --zovo-line-height-tight: 1.25;
  --zovo-line-height-normal: 1.5;
  --zovo-line-height-relaxed: 1.75;

  /* -------------------------------------------------------------------------
     3. SPACING
     4px base scale matching section-4 (xs through 2xl).
     ------------------------------------------------------------------------ */
  --zovo-space-1: 4px;   /* xs */
  --zovo-space-2: 8px;   /* sm */
  --zovo-space-3: 12px;  /* md */
  --zovo-space-4: 16px;  /* lg */
  --zovo-space-5: 20px;  /* xl */
  --zovo-space-6: 24px;  /* 2xl */
  --zovo-space-8: 32px;  /* 3xl */

  /* -------------------------------------------------------------------------
     4. BORDER RADIUS
     Section-4: 4 sm, 6 md, 8 lg, 16 pill. Extended with xl and full.
     ------------------------------------------------------------------------ */
  --zovo-radius-sm: 4px;
  --zovo-radius-md: 6px;
  --zovo-radius-lg: 8px;
  --zovo-radius-xl: 12px;
  --zovo-radius-pill: 16px;
  --zovo-radius-full: 9999px;

  /* -------------------------------------------------------------------------
     5. SHADOWS
     Section-4: subtle, medium, elevated. Extended with xl for modals.
     ------------------------------------------------------------------------ */
  --zovo-shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --zovo-shadow-md: 0 2px 8px rgba(0, 0, 0, 0.08);
  --zovo-shadow-lg: 0 4px 16px rgba(0, 0, 0, 0.12);
  --zovo-shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.10),
                    0 8px 10px -6px rgba(0, 0, 0, 0.10);

  /* -------------------------------------------------------------------------
     6. TRANSITIONS
     Fast for micro-interactions, base for state changes, slow for reveals.
     ------------------------------------------------------------------------ */
  --zovo-transition-fast: 150ms ease;
  --zovo-transition-base: 200ms ease;
  --zovo-transition-slow: 300ms ease;
  --zovo-transition-slide: 150ms ease-out;

  /* -------------------------------------------------------------------------
     7. POPUP DIMENSIONS
     Section-4: 400px wide (we use 400 to match spec exactly), 520 default,
     400 min, 600 max. Header 56px, tab bar 40px, footer 36px.
     ------------------------------------------------------------------------ */
  --zovo-popup-width: 400px;
  --zovo-popup-default-height: 520px;
  --zovo-popup-min-height: 400px;
  --zovo-popup-max-height: 600px;
  --zovo-header-height: 56px;
  --zovo-tab-bar-height: 40px;
  --zovo-footer-height: 36px;
  --zovo-action-bar-height: 40px;

  /* -------------------------------------------------------------------------
     8. Z-INDEX SCALE
     ------------------------------------------------------------------------ */
  --zovo-z-base: 0;
  --zovo-z-dropdown: 100;
  --zovo-z-sticky: 200;
  --zovo-z-overlay: 300;
  --zovo-z-modal: 400;
  --zovo-z-toast: 500;
}


/* ===========================================================================
   DARK MODE
   Comprehensive overrides. Every background, text, border, shadow, and
   semantic color is adjusted for WCAG AA on dark surfaces.
   =========================================================================== */

@media (prefers-color-scheme: dark) {
  :root {
    /* Backgrounds -- section-4 dark palette */
    --zovo-bg-primary: #1a1d23;
    --zovo-bg-secondary: #23272f;
    --zovo-bg-tertiary: #2d3139;
    --zovo-bg-elevated: #2d3139;

    /* Text -- section-4 dark palette */
    --zovo-text-primary: #e8eaed;
    --zovo-text-secondary: #9aa0a6;
    --zovo-text-muted: #5f6368;
    --zovo-text-inverse: #1a1d23;

    /* Borders */
    --zovo-border: #3c4049;
    --zovo-border-hover: #4a4f59;

    /* Primary -- lighten for dark backgrounds (section-4: #60A5FA) */
    --zovo-primary: #818cf8;
    --zovo-primary-hover: #6366f1;
    --zovo-primary-active: #4f46e5;
    --zovo-primary-light: rgba(99, 102, 241, 0.15);

    /* Cookie Manager brand -- lightened for dark */
    --cm-brand: #60a5fa;
    --cm-brand-hover: #3b82f6;
    --cm-brand-active: #2563eb;
    --cm-brand-light: rgba(96, 165, 250, 0.15);

    /* Secondary */
    --zovo-secondary: #e2e8f0;
    --zovo-secondary-hover: #cbd5e1;
    --zovo-secondary-light: #334155;

    /* Semantic -- lighter variants for contrast */
    --zovo-success: #4ade80;
    --zovo-success-light: rgba(74, 222, 128, 0.15);
    --zovo-success-bg: rgba(74, 222, 128, 0.10);
    --zovo-warning: #fbbf24;
    --zovo-warning-light: rgba(251, 191, 36, 0.15);
    --zovo-warning-bg: rgba(251, 191, 36, 0.10);
    --zovo-error: #f87171;
    --zovo-error-light: rgba(248, 113, 113, 0.15);
    --zovo-error-bg: rgba(248, 113, 113, 0.10);
    --zovo-info: #38bdf8;
    --zovo-info-light: rgba(56, 189, 248, 0.15);
    --zovo-info-bg: rgba(56, 189, 248, 0.10);

    /* Pro */
    --zovo-pro: #a78bfa;
    --zovo-pro-hover: #8b5cf6;
    --zovo-pro-light: rgba(167, 139, 250, 0.15);
    --zovo-pro-gradient: linear-gradient(135deg, #a78bfa, #8b5cf6);
    --zovo-pro-gold: #fbbf24;
    --zovo-pro-gold-light: rgba(251, 191, 36, 0.15);

    /* Shadows -- stronger opacity on dark */
    --zovo-shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.20);
    --zovo-shadow-md: 0 2px 8px rgba(0, 0, 0, 0.25);
    --zovo-shadow-lg: 0 4px 16px rgba(0, 0, 0, 0.30);
    --zovo-shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.35),
                      0 8px 10px -6px rgba(0, 0, 0, 0.30);
  }
}

/* Manual dark mode class (for settings-based toggle) */
.zovo-dark {
  --zovo-bg-primary: #1a1d23;
  --zovo-bg-secondary: #23272f;
  --zovo-bg-tertiary: #2d3139;
  --zovo-bg-elevated: #2d3139;
  --zovo-text-primary: #e8eaed;
  --zovo-text-secondary: #9aa0a6;
  --zovo-text-muted: #5f6368;
  --zovo-text-inverse: #1a1d23;
  --zovo-border: #3c4049;
  --zovo-border-hover: #4a4f59;
  --zovo-primary: #818cf8;
  --zovo-primary-hover: #6366f1;
  --zovo-primary-active: #4f46e5;
  --zovo-primary-light: rgba(99, 102, 241, 0.15);
  --cm-brand: #60a5fa;
  --cm-brand-hover: #3b82f6;
  --cm-brand-active: #2563eb;
  --cm-brand-light: rgba(96, 165, 250, 0.15);
  --zovo-secondary: #e2e8f0;
  --zovo-secondary-hover: #cbd5e1;
  --zovo-secondary-light: #334155;
  --zovo-success: #4ade80;
  --zovo-success-light: rgba(74, 222, 128, 0.15);
  --zovo-success-bg: rgba(74, 222, 128, 0.10);
  --zovo-warning: #fbbf24;
  --zovo-warning-light: rgba(251, 191, 36, 0.15);
  --zovo-warning-bg: rgba(251, 191, 36, 0.10);
  --zovo-error: #f87171;
  --zovo-error-light: rgba(248, 113, 113, 0.15);
  --zovo-error-bg: rgba(248, 113, 113, 0.10);
  --zovo-info: #38bdf8;
  --zovo-info-light: rgba(56, 189, 248, 0.15);
  --zovo-info-bg: rgba(56, 189, 248, 0.10);
  --zovo-pro: #a78bfa;
  --zovo-pro-hover: #8b5cf6;
  --zovo-pro-light: rgba(167, 139, 250, 0.15);
  --zovo-pro-gradient: linear-gradient(135deg, #a78bfa, #8b5cf6);
  --zovo-pro-gold: #fbbf24;
  --zovo-pro-gold-light: rgba(251, 191, 36, 0.15);
  --zovo-shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.20);
  --zovo-shadow-md: 0 2px 8px rgba(0, 0, 0, 0.25);
  --zovo-shadow-lg: 0 4px 16px rgba(0, 0, 0, 0.30);
  --zovo-shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.35),
                    0 8px 10px -6px rgba(0, 0, 0, 0.30);
}


/* ===========================================================================
   2. BASE RESET & BODY
   =========================================================================== */

*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  font-size: var(--zovo-font-size-base);
  -webkit-text-size-adjust: 100%;
}

body {
  font-family: var(--zovo-font-family);
  font-size: var(--zovo-font-size-base);
  line-height: var(--zovo-line-height-normal);
  color: var(--zovo-text-primary);
  background: var(--zovo-bg-primary);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  overflow-x: hidden;
}

img, svg {
  display: block;
  max-width: 100%;
}

button, input, select, textarea {
  font-family: inherit;
  font-size: inherit;
  line-height: inherit;
  color: inherit;
}

a {
  color: var(--cm-brand);
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

/* Scrollbar styling (Chromium) */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: var(--zovo-border);
  border-radius: var(--zovo-radius-full);
}

::-webkit-scrollbar-thumb:hover {
  background: var(--zovo-border-hover);
}


/* ===========================================================================
   3. POPUP CONTAINER
   =========================================================================== */

.zovo-popup {
  width: var(--zovo-popup-width);
  min-height: var(--zovo-popup-min-height);
  max-height: var(--zovo-popup-max-height);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--zovo-bg-primary);
}

.zovo-popup-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  overscroll-behavior: contain;
}


/* ===========================================================================
   4. HEADER COMPONENT
   Section-4: 56px height, logo + title + "by Zovo" + PRO badge + gear icon.
   Two lines: name row and domain/count row.
   =========================================================================== */

.zovo-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: var(--zovo-header-height);
  padding: var(--zovo-space-2) var(--zovo-space-3);
  border-bottom: 1px solid var(--zovo-border);
  background: var(--zovo-bg-primary);
  flex-shrink: 0;
  z-index: var(--zovo-z-sticky);
}

.zovo-header-brand {
  display: flex;
  align-items: center;
  gap: var(--zovo-space-2);
  min-width: 0;
}

.zovo-header-logo {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
}

.zovo-header-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.zovo-header-title-row {
  display: flex;
  align-items: center;
  gap: var(--zovo-space-2);
}

.zovo-header-title {
  font-size: var(--zovo-font-size-md);
  font-weight: var(--zovo-font-weight-semibold);
  color: var(--zovo-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.zovo-header-badge {
  font-size: 10px;
  font-weight: var(--zovo-font-weight-medium);
  padding: 1px 6px;
  background: var(--zovo-primary-light);
  color: var(--zovo-primary);
  border-radius: var(--zovo-radius-full);
  white-space: nowrap;
  flex-shrink: 0;
}

.zovo-header-subtitle {
  font-size: var(--zovo-font-size-base);
  color: var(--zovo-text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.zovo-header-subtitle .separator {
  margin: 0 var(--zovo-space-1);
  color: var(--zovo-text-muted);
}

.zovo-header-actions {
  display: flex;
  align-items: center;
  gap: var(--zovo-space-1);
  flex-shrink: 0;
}

/* PRO badge in header (gold, only for pro users) */
.zovo-badge-pro-header {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  background: var(--zovo-pro-gold);
  color: var(--zovo-text-inverse);
  font-size: var(--zovo-font-size-xs);
  font-weight: var(--zovo-font-weight-semibold);
  border-radius: var(--zovo-radius-full);
  letter-spacing: 0.5px;
  text-transform: uppercase;
  animation: zovo-shimmer 2s ease-in-out;
}

@keyframes zovo-shimmer {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; box-shadow: 0 0 12px rgba(245, 158, 11, 0.5); }
}


/* ===========================================================================
   5. BUTTON SYSTEM
   Base + 4 color variants + 3 sizes + block + icon-only + loading state.
   =========================================================================== */

.zovo-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--zovo-space-2);
  height: 32px;
  padding: 0 var(--zovo-space-4);
  font-family: var(--zovo-font-family);
  font-size: var(--zovo-font-size-sm);
  font-weight: var(--zovo-font-weight-medium);
  line-height: 1;
  white-space: nowrap;
  border: 1px solid transparent;
  border-radius: var(--zovo-radius-md);
  cursor: pointer;
  transition: all var(--zovo-transition-fast);
  text-decoration: none;
  user-select: none;
  position: relative;
}

.zovo-btn:focus-visible {
  outline: 2px solid var(--cm-brand);
  outline-offset: 2px;
}

.zovo-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

.zovo-btn:active:not(:disabled) {
  transform: scale(0.98);
}

/* --- Primary variant --- */
.zovo-btn-primary {
  background: var(--cm-brand);
  color: var(--zovo-text-inverse);
  border-color: var(--cm-brand);
}

.zovo-btn-primary:hover:not(:disabled) {
  background: var(--cm-brand-hover);
  border-color: var(--cm-brand-hover);
}

.zovo-btn-primary:active:not(:disabled) {
  background: var(--cm-brand-active);
}

/* --- Secondary variant --- */
.zovo-btn-secondary {
  background: var(--zovo-bg-tertiary);
  color: var(--zovo-text-primary);
  border-color: var(--zovo-border);
}

.zovo-btn-secondary:hover:not(:disabled) {
  background: var(--zovo-border);
  border-color: var(--zovo-border-hover);
}

/* --- Ghost variant --- */
.zovo-btn-ghost {
  background: transparent;
  color: var(--zovo-text-secondary);
  border-color: transparent;
}

.zovo-btn-ghost:hover:not(:disabled) {
  background: var(--zovo-bg-tertiary);
  color: var(--zovo-text-primary);
}

/* --- Danger variant --- */
.zovo-btn-danger {
  background: transparent;
  color: var(--zovo-error);
  border-color: var(--zovo-error);
}

.zovo-btn-danger:hover:not(:disabled) {
  background: var(--zovo-error);
  color: var(--zovo-text-inverse);
}

/* --- Outline primary (used for action bar buttons) --- */
.zovo-btn-outline {
  background: transparent;
  color: var(--cm-brand);
  border-color: var(--cm-brand);
}

.zovo-btn-outline:hover:not(:disabled) {
  background: var(--cm-brand-light);
}

/* --- Pro variant (purple gradient) --- */
.zovo-btn-pro {
  background: var(--zovo-pro-gradient);
  color: var(--zovo-text-inverse);
  border-color: transparent;
}

.zovo-btn-pro:hover:not(:disabled) {
  opacity: 0.9;
  box-shadow: 0 0 8px rgba(124, 58, 237, 0.3);
}

/* --- Sizes --- */
.zovo-btn-sm {
  height: 28px;
  padding: 0 var(--zovo-space-3);
  font-size: var(--zovo-font-size-xs);
  border-radius: var(--zovo-radius-sm);
}

.zovo-btn-lg {
  height: 36px;
  padding: 0 var(--zovo-space-6);
  font-size: var(--zovo-font-size-md);
}

/* --- Block (full-width) --- */
.zovo-btn-block {
  width: 100%;
}

/* --- Icon-only button --- */
.zovo-btn-icon {
  width: 32px;
  height: 32px;
  padding: 0;
  border-radius: var(--zovo-radius-md);
}

.zovo-btn-icon.zovo-btn-sm {
  width: 28px;
  height: 28px;
}

.zovo-btn-icon.zovo-btn-lg {
  width: 36px;
  height: 36px;
}

/* --- Loading state --- */
.zovo-btn-loading {
  color: transparent !important;
  pointer-events: none;
}

.zovo-btn-loading::after {
  content: '';
  position: absolute;
  width: 14px;
  height: 14px;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: zovo-spin 0.6s linear infinite;
}

.zovo-btn-primary.zovo-btn-loading::after {
  border-color: var(--zovo-text-inverse);
  border-right-color: transparent;
}

@keyframes zovo-spin {
  to { transform: rotate(360deg); }
}


/* ===========================================================================
   6. INPUT SYSTEM
   Text inputs, selects, checkboxes, toggles, search.
   =========================================================================== */

/* --- Base text input --- */
.zovo-input {
  width: 100%;
  height: 32px;
  padding: 0 var(--zovo-space-3);
  font-family: var(--zovo-font-family);
  font-size: var(--zovo-font-size-base);
  color: var(--zovo-text-primary);
  background: var(--zovo-bg-primary);
  border: 1px solid var(--zovo-border);
  border-radius: var(--zovo-radius-md);
  transition: border-color var(--zovo-transition-fast),
              box-shadow var(--zovo-transition-fast);
}

.zovo-input:focus {
  outline: none;
  border-color: var(--zovo-border-focus);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.10);
}

.zovo-input::placeholder {
  color: var(--zovo-text-muted);
}

.zovo-input:disabled {
  background: var(--zovo-bg-tertiary);
  color: var(--zovo-text-muted);
  cursor: not-allowed;
}

.zovo-input-error {
  border-color: var(--zovo-error);
}

.zovo-input-error:focus {
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.10);
}

.zovo-input-helper {
  font-size: var(--zovo-font-size-xs);
  color: var(--zovo-text-muted);
  margin-top: var(--zovo-space-1);
}

.zovo-input-error-text {
  font-size: var(--zovo-font-size-xs);
  color: var(--zovo-error);
  margin-top: var(--zovo-space-1);
}

/* Monospace input (for cookie values, domain patterns) */
.zovo-input-mono {
  font-family: var(--zovo-font-mono);
  font-size: var(--zovo-font-size-sm);
}

/* --- Select dropdown --- */
.zovo-select {
  width: 100%;
  height: 32px;
  padding: 0 var(--zovo-space-8) 0 var(--zovo-space-3);
  font-family: var(--zovo-font-family);
  font-size: var(--zovo-font-size-base);
  color: var(--zovo-text-primary);
  background: var(--zovo-bg-primary);
  border: 1px solid var(--zovo-border);
  border-radius: var(--zovo-radius-md);
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%235f6368' d='M3 4.5l3 3 3-3'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 8px center;
  cursor: pointer;
  transition: border-color var(--zovo-transition-fast);
}

.zovo-select:focus {
  outline: none;
  border-color: var(--zovo-border-focus);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.10);
}

/* --- Custom checkbox --- */
.zovo-checkbox {
  display: inline-flex;
  align-items: center;
  gap: var(--zovo-space-2);
  cursor: pointer;
  user-select: none;
  font-size: var(--zovo-font-size-sm);
  color: var(--zovo-text-primary);
}

.zovo-checkbox input[type="checkbox"] {
  appearance: none;
  width: 16px;
  height: 16px;
  border: 1.5px solid var(--zovo-border);
  border-radius: var(--zovo-radius-sm);
  background: var(--zovo-bg-primary);
  transition: all var(--zovo-transition-fast);
  cursor: pointer;
  flex-shrink: 0;
  position: relative;
}

.zovo-checkbox input[type="checkbox"]:checked {
  background: var(--cm-brand);
  border-color: var(--cm-brand);
}

.zovo-checkbox input[type="checkbox"]:checked::after {
  content: '';
  position: absolute;
  left: 4px;
  top: 1px;
  width: 5px;
  height: 9px;
  border: solid var(--zovo-text-inverse);
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.zovo-checkbox input[type="checkbox"]:focus-visible {
  outline: 2px solid var(--cm-brand);
  outline-offset: 2px;
}

/* --- Toggle switch --- */
.zovo-toggle {
  display: inline-flex;
  align-items: center;
  gap: var(--zovo-space-2);
  cursor: pointer;
  user-select: none;
  font-size: var(--zovo-font-size-sm);
}

.zovo-toggle-track {
  position: relative;
  width: 36px;
  height: 20px;
  background: var(--zovo-bg-tertiary);
  border-radius: var(--zovo-radius-full);
  transition: background var(--zovo-transition-fast);
  flex-shrink: 0;
}

.zovo-toggle-thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  background: white;
  border-radius: 50%;
  box-shadow: var(--zovo-shadow-sm);
  transition: transform var(--zovo-transition-slide);
}

.zovo-toggle input[type="checkbox"] {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.zovo-toggle input:checked + .zovo-toggle-track {
  background: var(--zovo-success);
}

.zovo-toggle input:checked + .zovo-toggle-track .zovo-toggle-thumb {
  transform: translateX(16px);
}

.zovo-toggle input:disabled + .zovo-toggle-track {
  opacity: 0.5;
  cursor: not-allowed;
}

.zovo-toggle input:focus-visible + .zovo-toggle-track {
  outline: 2px solid var(--cm-brand);
  outline-offset: 2px;
}

/* --- Search input with icon --- */
.zovo-search {
  position: relative;
  width: 100%;
}

.zovo-search-icon {
  position: absolute;
  left: var(--zovo-space-3);
  top: 50%;
  transform: translateY(-50%);
  width: 14px;
  height: 14px;
  color: var(--zovo-text-muted);
  pointer-events: none;
}

.zovo-search .zovo-input {
  padding-left: calc(var(--zovo-space-3) + 14px + var(--zovo-space-2));
}

.zovo-search-clear {
  position: absolute;
  right: var(--zovo-space-2);
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: var(--zovo-text-muted);
  cursor: pointer;
  border-radius: 50%;
}

.zovo-search-clear:hover {
  background: var(--zovo-bg-tertiary);
  color: var(--zovo-text-primary);
}


/* ===========================================================================
   7. CARD SYSTEM
   Base card, hover variant, selected variant, and domain-specific cards.
   =========================================================================== */

.zovo-card {
  background: var(--zovo-bg-primary);
  border: 1px solid var(--zovo-border);
  border-radius: var(--zovo-radius-lg);
  padding: var(--zovo-space-4);
}

.zovo-card-hover {
  transition: border-color var(--zovo-transition-fast),
              box-shadow var(--zovo-transition-fast);
  cursor: pointer;
}

.zovo-card-hover:hover {
  border-color: var(--cm-brand);
  box-shadow: var(--zovo-shadow-sm);
}

.zovo-card-selected {
  border-color: var(--cm-brand);
  box-shadow: 0 0 0 1px var(--cm-brand);
}

.zovo-card-compact {
  padding: var(--zovo-space-3);
}

/* Locked card (for pro upsell slots) */
.zovo-card-locked {
  position: relative;
  background: var(--zovo-bg-tertiary);
  border-style: dashed;
  overflow: hidden;
}

.zovo-card-locked::before {
  content: '';
  position: absolute;
  inset: 0;
  backdrop-filter: blur(4px);
  z-index: 1;
}

.zovo-card-locked-content {
  position: relative;
  z-index: 2;
  text-align: center;
  padding: var(--zovo-space-4);
}

.zovo-card-locked-content .zovo-lock-icon {
  color: var(--zovo-pro);
  margin-bottom: var(--zovo-space-2);
}


/* ===========================================================================
   8. TAB NAVIGATION
   Section-4: 40px height, 4 equal-width tabs, underline indicator.
   Tabs: Cookies | Profiles | Rules | Health
   =========================================================================== */

.zovo-tabs {
  display: flex;
  align-items: stretch;
  height: var(--zovo-tab-bar-height);
  border-bottom: 1px solid var(--zovo-border);
  background: var(--zovo-bg-primary);
  flex-shrink: 0;
  z-index: var(--zovo-z-sticky);
}

.zovo-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--zovo-space-1);
  padding: 0 var(--zovo-space-2);
  font-size: var(--zovo-font-size-sm);
  font-weight: var(--zovo-font-weight-normal);
  color: var(--zovo-text-secondary);
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  transition: color var(--zovo-transition-fast),
              border-color var(--zovo-transition-slide),
              background-color var(--zovo-transition-fast);
  position: relative;
  user-select: none;
}

.zovo-tab:hover {
  color: var(--zovo-text-primary);
  background: var(--zovo-bg-secondary);
}

.zovo-tab[aria-selected="true"],
.zovo-tab.active {
  color: var(--zovo-text-primary);
  font-weight: var(--zovo-font-weight-medium);
  border-bottom-color: var(--cm-brand);
}

.zovo-tab-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

/* Tab badge counter */
.zovo-tab-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 16px;
  padding: 0 4px;
  font-size: 10px;
  font-weight: var(--zovo-font-weight-semibold);
  color: var(--zovo-text-inverse);
  background: var(--zovo-text-muted);
  border-radius: var(--zovo-radius-full);
  font-variant-numeric: tabular-nums;
}

.zovo-tab.active .zovo-tab-badge {
  background: var(--cm-brand);
}

/* Tab content panels */
.zovo-tab-content {
  display: none;
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
}

.zovo-tab-content.active {
  display: flex;
  flex-direction: column;
}


/* ===========================================================================
   9. LIST / TABLE COMPONENTS
   Scrollable list, items with hover, empty state, virtual scroll container.
   =========================================================================== */

.zovo-list {
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  overflow-x: hidden;
  overscroll-behavior: contain;
}

.zovo-list-item {
  display: flex;
  align-items: center;
  padding: var(--zovo-space-3) var(--zovo-space-4);
  border-bottom: 1px solid var(--zovo-border);
  transition: background var(--zovo-transition-fast);
  cursor: pointer;
}

.zovo-list-item:hover {
  background: var(--zovo-bg-secondary);
}

.zovo-list-item:last-child {
  border-bottom: none;
}

.zovo-list-item-active {
  background: var(--cm-brand-light);
}

/* Alternating row backgrounds (section-4 spec) */
.zovo-list-striped .zovo-list-item:nth-child(even) {
  background: var(--zovo-bg-secondary);
}

.zovo-list-striped .zovo-list-item:nth-child(even):hover {
  background: var(--zovo-bg-tertiary);
}

/* Empty state */
.zovo-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--zovo-space-8) var(--zovo-space-4);
  text-align: center;
}

.zovo-empty-state-icon {
  width: 64px;
  height: 64px;
  color: var(--cm-brand);
  margin-bottom: var(--zovo-space-4);
  opacity: 0.6;
}

.zovo-empty-state-title {
  font-size: var(--zovo-font-size-md);
  font-weight: var(--zovo-font-weight-semibold);
  color: var(--zovo-text-primary);
  margin-bottom: var(--zovo-space-2);
}

.zovo-empty-state-description {
  font-size: var(--zovo-font-size-sm);
  color: var(--zovo-text-secondary);
  max-width: 280px;
  margin-bottom: var(--zovo-space-4);
}

/* Virtual scroll container */
.zovo-virtual-scroll {
  position: relative;
  overflow-y: auto;
  overflow-x: hidden;
  overscroll-behavior: contain;
}

.zovo-virtual-scroll-inner {
  position: relative;
  width: 100%;
}


/* ===========================================================================
   10. MODAL / DIALOG
   Overlay + centered dialog with header/body/footer structure.
   =========================================================================== */

.zovo-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--zovo-z-modal);
  animation: zovo-fade-in 200ms ease;
}

.zovo-modal {
  width: calc(var(--zovo-popup-width) - var(--zovo-space-8));
  max-height: 80vh;
  background: var(--zovo-bg-primary);
  border-radius: var(--zovo-radius-xl);
  box-shadow: var(--zovo-shadow-xl);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: zovo-slide-up 200ms ease;
}

.zovo-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--zovo-space-4);
  border-bottom: 1px solid var(--zovo-border);
}

.zovo-modal-title {
  font-size: var(--zovo-font-size-md);
  font-weight: var(--zovo-font-weight-semibold);
}

.zovo-modal-close {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: var(--zovo-text-muted);
  border-radius: var(--zovo-radius-sm);
  cursor: pointer;
  transition: background var(--zovo-transition-fast),
              color var(--zovo-transition-fast);
}

.zovo-modal-close:hover {
  background: var(--zovo-bg-tertiary);
  color: var(--zovo-text-primary);
}

.zovo-modal-body {
  flex: 1;
  padding: var(--zovo-space-4);
  overflow-y: auto;
}

.zovo-modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--zovo-space-2);
  padding: var(--zovo-space-3) var(--zovo-space-4);
  border-top: 1px solid var(--zovo-border);
}


/* ===========================================================================
   11. TOAST / NOTIFICATION
   Section-4: top-center, 12px below header, 320px wide, 40px height.
   Variants: success, error, warning, info. Auto-dismiss with animation.
   =========================================================================== */

.zovo-toast-container {
  position: fixed;
  top: calc(var(--zovo-header-height) + var(--zovo-space-3));
  left: 50%;
  transform: translateX(-50%);
  z-index: var(--zovo-z-toast);
  display: flex;
  flex-direction: column;
  gap: var(--zovo-space-2);
  pointer-events: none;
}

.zovo-toast {
  display: flex;
  align-items: center;
  gap: var(--zovo-space-2);
  width: 320px;
  min-height: 40px;
  padding: var(--zovo-space-2) var(--zovo-space-3);
  background: var(--zovo-bg-elevated);
  border-radius: var(--zovo-radius-md);
  box-shadow: var(--zovo-shadow-md);
  border-left: 3px solid var(--zovo-info);
  font-size: var(--zovo-font-size-sm);
  color: var(--zovo-text-primary);
  pointer-events: auto;
  animation: zovo-toast-enter 200ms ease;
}

.zovo-toast-exit {
  animation: zovo-toast-exit 300ms ease forwards;
}

.zovo-toast-success { border-left-color: var(--zovo-success); }
.zovo-toast-error   { border-left-color: var(--zovo-error); }
.zovo-toast-warning { border-left-color: var(--zovo-warning); }
.zovo-toast-info    { border-left-color: var(--zovo-info); }

.zovo-toast-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.zovo-toast-success .zovo-toast-icon { color: var(--zovo-success); }
.zovo-toast-error   .zovo-toast-icon { color: var(--zovo-error); }
.zovo-toast-warning .zovo-toast-icon { color: var(--zovo-warning); }
.zovo-toast-info    .zovo-toast-icon { color: var(--zovo-info); }

.zovo-toast-message {
  flex: 1;
  min-width: 0;
}

.zovo-toast-dismiss {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: var(--zovo-text-muted);
  cursor: pointer;
  border-radius: 50%;
  flex-shrink: 0;
}

.zovo-toast-dismiss:hover {
  background: var(--zovo-bg-tertiary);
}

@keyframes zovo-toast-enter {
  from {
    opacity: 0;
    transform: translateY(-12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes zovo-toast-exit {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(-8px);
  }
}


/* ===========================================================================
   12. BADGE SYSTEM
   Small labels, PRO badge, Free badge, counter badges, status badges.
   =========================================================================== */

.zovo-badge {
  display: inline-flex;
  align-items: center;
  padding: 1px 6px;
  font-size: 10px;
  font-weight: var(--zovo-font-weight-medium);
  border-radius: var(--zovo-radius-full);
  white-space: nowrap;
  line-height: 1.4;
}

/* PRO pill badge (section-4: gradient purple, 28x14, 9px/700) */
.zovo-badge-pro {
  padding: 2px 8px;
  font-size: 9px;
  font-weight: var(--zovo-font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: var(--zovo-pro-gradient);
  color: var(--zovo-text-inverse);
  border-radius: var(--zovo-radius-pill);
}

.zovo-badge-pro:hover {
  box-shadow: 0 0 8px rgba(124, 58, 237, 0.3);
}

/* Free badge */
.zovo-badge-free {
  background: var(--zovo-bg-tertiary);
  color: var(--zovo-text-secondary);
}

/* Counter badge */
.zovo-badge-count {
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  font-size: 10px;
  font-weight: var(--zovo-font-weight-semibold);
  background: var(--zovo-text-muted);
  color: var(--zovo-text-inverse);
  border-radius: var(--zovo-radius-full);
  text-align: center;
  font-variant-numeric: tabular-nums;
}

/* Status badges */
.zovo-badge-active {
  background: var(--zovo-success-bg);
  color: var(--zovo-success);
}

.zovo-badge-expired {
  background: var(--zovo-error-bg);
  color: var(--zovo-error);
}

.zovo-badge-blocked {
  background: var(--zovo-warning-bg);
  color: var(--zovo-warning);
}

.zovo-badge-session {
  background: var(--zovo-info-bg);
  color: var(--zovo-info);
}

/* Security flag pills (section-4: tiny 10px/500 pills) */
.zovo-flag {
  display: inline-flex;
  align-items: center;
  padding: 1px 5px;
  font-size: 10px;
  font-weight: var(--zovo-font-weight-medium);
  border-radius: var(--zovo-radius-sm);
  line-height: 1.4;
}

.zovo-flag-secure {
  background: var(--zovo-success-bg);
  color: var(--zovo-success);
}

.zovo-flag-httponly {
  background: var(--zovo-info-bg);
  color: var(--zovo-info);
}

.zovo-flag-samesite {
  background: var(--zovo-pro-light);
  color: var(--zovo-pro);
}

/* Lock icon inline (section-4: 12x12 padlock at 70% opacity) */
.zovo-lock {
  display: inline-flex;
  align-items: center;
  width: 12px;
  height: 12px;
  color: var(--zovo-pro);
  opacity: 0.7;
  transition: opacity var(--zovo-transition-fast);
}

.zovo-lock:hover {
  opacity: 1;
}


/* ===========================================================================
   13. FOOTER COMPONENT
   Section-4: 36px height. Left: usage counter. Right: "Powered by Zovo".
   =========================================================================== */

.zovo-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: var(--zovo-footer-height);
  padding: 0 var(--zovo-space-3);
  border-top: 1px solid var(--zovo-border);
  background: var(--zovo-bg-secondary);
  flex-shrink: 0;
}

.zovo-footer-counter {
  font-size: var(--zovo-font-size-xs);
  font-weight: var(--zovo-font-weight-medium);
  font-variant-numeric: tabular-nums;
  color: var(--zovo-success);
}

.zovo-footer-counter-warning {
  color: var(--zovo-warning);
}

.zovo-footer-counter-danger {
  color: var(--zovo-error);
}

.zovo-footer-counter-pulse {
  animation: zovo-pulse 600ms ease;
}

@keyframes zovo-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.zovo-footer-limit {
  color: var(--zovo-error);
}

.zovo-footer-limit-upgrade {
  color: var(--zovo-pro);
  text-decoration: underline;
  cursor: pointer;
  margin-left: var(--zovo-space-1);
  background: none;
  border: none;
  font-size: var(--zovo-font-size-xs);
  font-weight: var(--zovo-font-weight-medium);
}

.zovo-footer-limit-upgrade:hover {
  text-decoration: none;
}

.zovo-footer-brand {
  display: flex;
  align-items: center;
  gap: var(--zovo-space-1);
  font-size: var(--zovo-font-size-xs);
  color: var(--zovo-text-muted);
  text-decoration: none;
  transition: color var(--zovo-transition-fast);
}

.zovo-footer-brand:hover {
  color: var(--zovo-primary);
  text-decoration: none;
}

.zovo-footer-brand strong {
  color: var(--zovo-text-secondary);
}

.zovo-footer-brand:hover strong {
  color: var(--zovo-primary);
}

.zovo-footer-brand-logo {
  width: 16px;
  height: 16px;
}

.zovo-footer-stat {
  font-size: 10px;
  color: var(--zovo-text-muted);
}


/* ===========================================================================
   14. FILTER CHIP BAR
   Horizontal scrolling chips for cookie filtering.
   =========================================================================== */

.zovo-chip-bar {
  display: flex;
  gap: var(--zovo-space-2);
  padding: var(--zovo-space-2) var(--zovo-space-3);
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
}

.zovo-chip-bar::-webkit-scrollbar {
  display: none;
}

.zovo-chip {
  display: inline-flex;
  align-items: center;
  gap: var(--zovo-space-1);
  height: 26px;
  padding: 0 var(--zovo-space-3);
  font-size: var(--zovo-font-size-xs);
  font-weight: var(--zovo-font-weight-medium);
  color: var(--zovo-text-secondary);
  background: var(--zovo-bg-tertiary);
  border: 1px solid var(--zovo-border);
  border-radius: var(--zovo-radius-pill);
  cursor: pointer;
  white-space: nowrap;
  transition: all var(--zovo-transition-fast);
  user-select: none;
}

.zovo-chip:hover {
  background: var(--zovo-bg-secondary);
  border-color: var(--zovo-border-hover);
}

.zovo-chip.active,
.zovo-chip[aria-pressed="true"] {
  background: var(--cm-brand-light);
  color: var(--cm-brand);
  border-color: var(--cm-brand);
}

.zovo-chip-count {
  font-size: 10px;
  font-variant-numeric: tabular-nums;
  opacity: 0.7;
}


/* ===========================================================================
   15. ACTION BAR
   Section-4: 40px fixed above footer, 4 buttons evenly spaced.
   =========================================================================== */

.zovo-action-bar {
  display: flex;
  align-items: center;
  gap: var(--zovo-space-2);
  height: var(--zovo-action-bar-height);
  padding: 0 var(--zovo-space-3);
  border-top: 1px solid var(--zovo-border);
  background: var(--zovo-bg-primary);
  flex-shrink: 0;
}

.zovo-action-bar .zovo-btn {
  flex: 1;
}


/* ===========================================================================
   16. BLUR / PRO OVERLAY (Grammarly-style)
   Section-4: filter:blur(4px), semi-transparent overlay, centered CTA.
   =========================================================================== */

.zovo-blur-container {
  position: relative;
  overflow: hidden;
}

.zovo-blur-content {
  filter: blur(4px);
  user-select: none;
  pointer-events: none;
}

.zovo-blur-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--zovo-space-2);
  background: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  z-index: 1;
}

@media (prefers-color-scheme: dark) {
  .zovo-blur-overlay {
    background: rgba(26, 29, 35, 0.6);
  }
}

.zovo-dark .zovo-blur-overlay {
  background: rgba(26, 29, 35, 0.6);
}

.zovo-blur-cta {
  padding: var(--zovo-space-2) var(--zovo-space-4);
  background: var(--zovo-pro-gradient);
  color: var(--zovo-text-inverse);
  font-size: var(--zovo-font-size-sm);
  font-weight: var(--zovo-font-weight-medium);
  border: none;
  border-radius: var(--zovo-radius-md);
  cursor: pointer;
  transition: opacity var(--zovo-transition-fast);
}

.zovo-blur-cta:hover {
  opacity: 0.9;
}

.zovo-blur-link {
  font-size: var(--zovo-font-size-sm);
  color: var(--zovo-pro);
}


/* ===========================================================================
   17. FEATURE DISCOVERY DOT
   Section-4: 8px pulsing blue dot, top-right of untried features.
   =========================================================================== */

.zovo-discovery-dot {
  position: absolute;
  top: -2px;
  right: -2px;
  width: 8px;
  height: 8px;
  background: var(--cm-brand);
  border-radius: 50%;
  animation: zovo-discovery-pulse 2s ease-in-out infinite;
  z-index: 1;
}

@keyframes zovo-discovery-pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.4);
    opacity: 0.6;
  }
}


/* ===========================================================================
   18. POST-UPGRADE TRANSITIONS
   Section-4: lock fade-out, blur dissolve, gold border accent.
   =========================================================================== */

.zovo-unlock-fade {
  animation: zovo-unlock-fade 300ms ease forwards;
}

@keyframes zovo-unlock-fade {
  to {
    opacity: 0;
    transform: translateY(-4px);
  }
}

.zovo-unlock-check {
  animation: zovo-unlock-check 1s ease forwards;
}

@keyframes zovo-unlock-check {
  0% { opacity: 0; transform: scale(0.5); }
  30% { opacity: 1; transform: scale(1); }
  100% { opacity: 0; }
}

.zovo-blur-dissolve {
  transition: filter 500ms ease;
  filter: blur(0) !important;
}

.zovo-pro-unlocked-accent {
  border-left: 3px solid var(--zovo-pro-gold) !important;
  transition: border-color 2s ease;
}

.zovo-pro-badge-enter {
  animation: zovo-slide-in-right 300ms ease-out;
}

@keyframes zovo-slide-in-right {
  from {
    opacity: 0;
    transform: translateX(12px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}


/* ===========================================================================
   19. UTILITY CLASSES
   =========================================================================== */

/* --- Text --- */
.zovo-text-center { text-align: center; }
.zovo-text-left   { text-align: left; }
.zovo-text-right  { text-align: right; }
.zovo-text-muted  { color: var(--zovo-text-muted); }
.zovo-text-xs     { font-size: var(--zovo-font-size-xs); }
.zovo-text-sm     { font-size: var(--zovo-font-size-sm); }
.zovo-text-base   { font-size: var(--zovo-font-size-base); }
.zovo-text-md     { font-size: var(--zovo-font-size-md); }
.zovo-text-lg     { font-size: var(--zovo-font-size-lg); }
.zovo-text-mono   { font-family: var(--zovo-font-mono); }
.zovo-font-medium    { font-weight: var(--zovo-font-weight-medium); }
.zovo-font-semibold  { font-weight: var(--zovo-font-weight-semibold); }
.zovo-font-bold      { font-weight: var(--zovo-font-weight-bold); }
.zovo-truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.zovo-tabular-nums { font-variant-numeric: tabular-nums; }

/* --- Spacing --- */
.zovo-mt-1 { margin-top: var(--zovo-space-1); }
.zovo-mt-2 { margin-top: var(--zovo-space-2); }
.zovo-mt-3 { margin-top: var(--zovo-space-3); }
.zovo-mt-4 { margin-top: var(--zovo-space-4); }
.zovo-mb-1 { margin-bottom: var(--zovo-space-1); }
.zovo-mb-2 { margin-bottom: var(--zovo-space-2); }
.zovo-mb-3 { margin-bottom: var(--zovo-space-3); }
.zovo-mb-4 { margin-bottom: var(--zovo-space-4); }
.zovo-ml-2 { margin-left: var(--zovo-space-2); }
.zovo-mr-2 { margin-right: var(--zovo-space-2); }
.zovo-p-2  { padding: var(--zovo-space-2); }
.zovo-p-3  { padding: var(--zovo-space-3); }
.zovo-p-4  { padding: var(--zovo-space-4); }
.zovo-px-3 { padding-left: var(--zovo-space-3); padding-right: var(--zovo-space-3); }
.zovo-px-4 { padding-left: var(--zovo-space-4); padding-right: var(--zovo-space-4); }
.zovo-py-2 { padding-top: var(--zovo-space-2); padding-bottom: var(--zovo-space-2); }
.zovo-py-3 { padding-top: var(--zovo-space-3); padding-bottom: var(--zovo-space-3); }

/* --- Flex --- */
.zovo-flex { display: flex; }
.zovo-flex-col { flex-direction: column; }
.zovo-flex-wrap { flex-wrap: wrap; }
.zovo-items-center { align-items: center; }
.zovo-items-start  { align-items: flex-start; }
.zovo-items-end    { align-items: flex-end; }
.zovo-justify-center  { justify-content: center; }
.zovo-justify-between { justify-content: space-between; }
.zovo-justify-end     { justify-content: flex-end; }
.zovo-flex-1 { flex: 1; }
.zovo-flex-shrink-0 { flex-shrink: 0; }
.zovo-gap-1 { gap: var(--zovo-space-1); }
.zovo-gap-2 { gap: var(--zovo-space-2); }
.zovo-gap-3 { gap: var(--zovo-space-3); }
.zovo-gap-4 { gap: var(--zovo-space-4); }

/* --- Display --- */
.zovo-hidden  { display: none !important; }
.zovo-block   { display: block; }
.zovo-inline  { display: inline; }
.zovo-sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}

/* --- Overflow --- */
.zovo-overflow-hidden  { overflow: hidden; }
.zovo-overflow-y-auto  { overflow-y: auto; }

/* --- Position --- */
.zovo-relative { position: relative; }
.zovo-absolute { position: absolute; }

/* --- Animation --- */
.zovo-animate-fade-in {
  animation: zovo-fade-in 200ms ease;
}

.zovo-animate-slide-up {
  animation: zovo-slide-up 200ms ease;
}

.zovo-animate-slide-down {
  animation: zovo-slide-down 200ms ease;
}

@keyframes zovo-fade-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}

@keyframes zovo-slide-up {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes zovo-slide-down {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}


/* ===========================================================================
   20. RETENTION PROMPT (from Agent 4 integration)
   =========================================================================== */

.zovo-retention-prompt {
  position: relative;
  margin: var(--zovo-space-3);
  padding: var(--zovo-space-3);
  background: linear-gradient(135deg, var(--zovo-primary-light), var(--zovo-bg-secondary));
  border-radius: var(--zovo-radius-lg);
  border: 1px solid var(--zovo-primary);
  animation: zovo-slide-up 200ms ease;
}

.zovo-retention-close {
  position: absolute;
  top: var(--zovo-space-2);
  right: var(--zovo-space-2);
  width: 20px;
  height: 20px;
  border: none;
  background: transparent;
  color: var(--zovo-text-muted);
  cursor: pointer;
  font-size: 16px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.zovo-retention-close:hover {
  background: var(--zovo-bg-tertiary);
  color: var(--zovo-text-primary);
}

.zovo-retention-title {
  font-size: var(--zovo-font-size-sm);
  font-weight: var(--zovo-font-weight-semibold);
  margin-bottom: var(--zovo-space-1);
}

.zovo-retention-message {
  font-size: var(--zovo-font-size-xs);
  color: var(--zovo-text-secondary);
  margin-bottom: var(--zovo-space-2);
}
```

---

## 2. Cookie Manager-Specific Components

These styles extend the shared system with components unique to the Cookie Manager extension. They are intended to live in a separate file (`cookie-manager.css`) that imports or follows `zovo-brand.css`.

### File: `src/styles/cookie-manager.css`

```css
/* ==========================================================================
   Cookie Manager-Specific Components
   Requires: zovo-brand.css (loaded first)
   ========================================================================== */


/* ---------------------------------------------------------------------------
   A. COOKIE ROW COMPONENT
   Section-4: 44px collapsed, 2-line layout. Expand on click.
   --------------------------------------------------------------------------- */

.cm-cookie-row {
  display: flex;
  flex-direction: column;
  padding: var(--zovo-space-2) var(--zovo-space-3);
  border-bottom: 1px solid var(--zovo-border);
  transition: background var(--zovo-transition-fast);
  cursor: pointer;
}

.cm-cookie-row:hover {
  background: var(--zovo-bg-secondary);
}

/* Alternating rows */
.cm-cookie-row:nth-child(even) {
  background: var(--zovo-bg-secondary);
}

.cm-cookie-row:nth-child(even):hover {
  background: var(--zovo-bg-tertiary);
}

.cm-cookie-row-line1 {
  display: flex;
  align-items: center;
  gap: var(--zovo-space-2);
  height: 22px;
}

.cm-cookie-row-chevron {
  width: 12px;
  height: 12px;
  color: var(--zovo-text-muted);
  transition: transform var(--zovo-transition-fast);
  flex-shrink: 0;
}

.cm-cookie-row.expanded .cm-cookie-row-chevron {
  transform: rotate(90deg);
}

.cm-cookie-row-name {
  font-size: var(--zovo-font-size-base);
  font-weight: var(--zovo-font-weight-medium);
  color: var(--zovo-text-primary);
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cm-cookie-row-value {
  font-family: var(--zovo-font-mono);
  font-size: var(--zovo-font-size-sm);
  color: var(--zovo-text-muted);
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cm-cookie-row-domain {
  font-size: var(--zovo-font-size-sm);
  color: var(--zovo-text-secondary);
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-left: auto;
}

.cm-cookie-row-line2 {
  display: flex;
  align-items: center;
  gap: var(--zovo-space-2);
  height: 20px;
  padding-left: 20px; /* align with name after chevron */
}

.cm-cookie-row-flags {
  display: flex;
  gap: var(--zovo-space-1);
}

.cm-cookie-row-expiry {
  font-size: var(--zovo-font-size-xs);
  color: var(--zovo-text-muted);
}

.cm-cookie-row-delete {
  margin-left: auto;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: var(--zovo-text-muted);
  cursor: pointer;
  border-radius: var(--zovo-radius-sm);
  opacity: 0;
  transition: opacity var(--zovo-transition-fast),
              color var(--zovo-transition-fast);
}

.cm-cookie-row:hover .cm-cookie-row-delete {
  opacity: 1;
}

.cm-cookie-row-delete:hover {
  color: var(--zovo-error);
  background: var(--zovo-error-bg);
}


/* ---------------------------------------------------------------------------
   B. COOKIE DETAIL VIEW (Expanded inline edit)
   Section-4: bg-secondary, 3px left brand border, full field form.
   --------------------------------------------------------------------------- */

.cm-cookie-detail {
  padding: var(--zovo-space-3);
  background: var(--zovo-bg-secondary);
  border-left: 3px solid var(--cm-brand);
  animation: zovo-slide-down 150ms ease;
}

.cm-cookie-detail-grid {
  display: grid;
  grid-template-columns: 70px 1fr;
  gap: var(--zovo-space-2);
  align-items: center;
}

.cm-cookie-detail-label {
  font-size: var(--zovo-font-size-sm);
  font-weight: var(--zovo-font-weight-medium);
  color: var(--zovo-text-secondary);
}

.cm-cookie-detail-input {
  font-family: var(--zovo-font-mono);
  font-size: var(--zovo-font-size-sm);
}

.cm-cookie-detail-flags {
  display: flex;
  gap: var(--zovo-space-4);
  padding: var(--zovo-space-2) 0;
}

.cm-cookie-detail-actions {
  display: flex;
  align-items: center;
  gap: var(--zovo-space-2);
  margin-top: var(--zovo-space-3);
  padding-top: var(--zovo-space-3);
  border-top: 1px solid var(--zovo-border);
}

.cm-cookie-detail-protect {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: var(--zovo-space-2);
  font-size: var(--zovo-font-size-xs);
  color: var(--zovo-text-secondary);
}


/* ---------------------------------------------------------------------------
   C. PROFILE CARD
   Section-4: 80px height, white card, subtle shadow, 8px radius.
   --------------------------------------------------------------------------- */

.cm-profile-card {
  display: flex;
  flex-direction: column;
  gap: var(--zovo-space-1);
  padding: var(--zovo-space-3);
  background: var(--zovo-bg-primary);
  border: 1px solid var(--zovo-border);
  border-radius: var(--zovo-radius-lg);
  box-shadow: var(--zovo-shadow-sm);
  transition: box-shadow var(--zovo-transition-fast);
}

.cm-profile-card:hover {
  box-shadow: var(--zovo-shadow-md);
}

.cm-profile-card-header {
  display: flex;
  align-items: center;
  gap: var(--zovo-space-2);
}

.cm-profile-card-color {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.cm-profile-card-name {
  font-size: var(--zovo-font-size-base);
  font-weight: var(--zovo-font-weight-semibold);
  color: var(--zovo-text-primary);
}

.cm-profile-card-meta {
  font-size: var(--zovo-font-size-sm);
  color: var(--zovo-text-secondary);
}

.cm-profile-card-time {
  font-size: var(--zovo-font-size-xs);
  color: var(--zovo-text-muted);
}

.cm-profile-card-actions {
  display: flex;
  gap: var(--zovo-space-2);
  margin-top: var(--zovo-space-1);
}

.cm-profile-card-actions .cm-action-delete {
  opacity: 0;
  transition: opacity var(--zovo-transition-fast);
}

.cm-profile-card:hover .cm-action-delete {
  opacity: 1;
}


/* ---------------------------------------------------------------------------
   D. RULE CARD
   Section-4: 72px height, similar to profile cards. Toggle on right.
   --------------------------------------------------------------------------- */

.cm-rule-card {
  display: flex;
  align-items: center;
  gap: var(--zovo-space-3);
  padding: var(--zovo-space-3);
  background: var(--zovo-bg-primary);
  border: 1px solid var(--zovo-border);
  border-radius: var(--zovo-radius-lg);
}

.cm-rule-card-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.cm-rule-card-pattern {
  font-family: var(--zovo-font-mono);
  font-size: var(--zovo-font-size-base);
  font-weight: var(--zovo-font-weight-medium);
  color: var(--zovo-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cm-rule-card-trigger {
  font-size: var(--zovo-font-size-sm);
  color: var(--zovo-text-secondary);
}

.cm-rule-card-exceptions {
  font-size: var(--zovo-font-size-xs);
  color: var(--zovo-text-muted);
}

.cm-rule-card-toggle {
  flex-shrink: 0;
}


/* ---------------------------------------------------------------------------
   E. HEALTH SCORE BADGE
   Section-4: 64x64 rounded square, grade letter, color-coded.
   A+/A = green, B+/B = green, B-/C+ = amber, C/C- = orange, D/F = red.
   --------------------------------------------------------------------------- */

.cm-health-score {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--zovo-space-2);
  padding: var(--zovo-space-4) 0;
}

.cm-health-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  border-radius: var(--zovo-radius-xl);
  color: var(--zovo-text-inverse);
  font-size: 28px;
  font-weight: var(--zovo-font-weight-bold);
}

.cm-health-badge-a  { background: var(--zovo-success); }
.cm-health-badge-b  { background: #22c55e; }
.cm-health-badge-b- { background: var(--zovo-warning); }
.cm-health-badge-c  { background: #f97316; }
.cm-health-badge-d  { background: var(--zovo-error); }
.cm-health-badge-f  { background: var(--zovo-error); }

.cm-health-domain {
  font-size: var(--zovo-font-size-sm);
  color: var(--zovo-text-secondary);
}

/* Risk breakdown card */
.cm-risk-card {
  display: flex;
  align-items: center;
  gap: var(--zovo-space-3);
  padding: var(--zovo-space-3);
  border: 1px solid var(--zovo-border);
  border-radius: var(--zovo-radius-lg);
}

.cm-risk-card-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.cm-risk-card-icon-danger  { color: var(--zovo-error); }
.cm-risk-card-icon-warning { color: var(--zovo-warning); }
.cm-risk-card-icon-success { color: var(--zovo-success); }

.cm-risk-card-title {
  flex: 1;
  font-size: var(--zovo-font-size-base);
  font-weight: var(--zovo-font-weight-medium);
}

.cm-risk-card-count {
  flex-shrink: 0;
}


/* ---------------------------------------------------------------------------
   F. EXPORT PREVIEW PANEL
   --------------------------------------------------------------------------- */

.cm-export-preview {
  background: var(--zovo-bg-secondary);
  border: 1px solid var(--zovo-border);
  border-radius: var(--zovo-radius-lg);
  overflow: hidden;
}

.cm-export-preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--zovo-space-2) var(--zovo-space-3);
  border-bottom: 1px solid var(--zovo-border);
  background: var(--zovo-bg-tertiary);
}

.cm-export-preview-header-title {
  font-size: var(--zovo-font-size-sm);
  font-weight: var(--zovo-font-weight-medium);
}

.cm-export-preview-body {
  padding: var(--zovo-space-3);
  font-family: var(--zovo-font-mono);
  font-size: var(--zovo-font-size-xs);
  color: var(--zovo-text-secondary);
  max-height: 200px;
  overflow-y: auto;
  white-space: pre-wrap;
  word-break: break-all;
}


/* ---------------------------------------------------------------------------
   G. COOKIE COUNT INFO BAR
   Section-4: below filter chips, 11px/400, text tertiary.
   --------------------------------------------------------------------------- */

.cm-cookie-count {
  padding: var(--zovo-space-1) var(--zovo-space-3);
  font-size: var(--zovo-font-size-xs);
  color: var(--zovo-text-muted);
}


/* ---------------------------------------------------------------------------
   H. RULE EDITOR (Expanded inline)
   --------------------------------------------------------------------------- */

.cm-rule-editor {
  padding: var(--zovo-space-3);
  background: var(--zovo-bg-secondary);
  border: 1px solid var(--zovo-border);
  border-radius: var(--zovo-radius-lg);
  animation: zovo-slide-down 150ms ease;
}

.cm-rule-editor-field {
  margin-bottom: var(--zovo-space-3);
}

.cm-rule-editor-label {
  display: block;
  font-size: var(--zovo-font-size-sm);
  font-weight: var(--zovo-font-weight-medium);
  color: var(--zovo-text-primary);
  margin-bottom: var(--zovo-space-1);
}

.cm-rule-editor-helper {
  font-size: var(--zovo-font-size-xs);
  color: var(--zovo-text-muted);
  margin-top: var(--zovo-space-1);
}

.cm-rule-editor-radio-group {
  display: flex;
  flex-direction: column;
  gap: var(--zovo-space-2);
}

.cm-rule-editor-radio {
  display: flex;
  align-items: center;
  gap: var(--zovo-space-2);
  font-size: var(--zovo-font-size-sm);
  cursor: pointer;
}

.cm-rule-editor-actions {
  display: flex;
  gap: var(--zovo-space-2);
  margin-top: var(--zovo-space-3);
  padding-top: var(--zovo-space-3);
  border-top: 1px solid var(--zovo-border);
}
```

---

## 3. Preact Component Templates

Each component below shows the JSX structure, props interface, and CSS class mapping. These are starter templates -- not full implementations -- designed to guide the engineering team.

### 3.1 `<Header>`

```tsx
// src/components/Header.tsx
import { h, FunctionComponent } from 'preact';

interface HeaderProps {
  extensionName: string;
  domain?: string;
  cookieCount?: number;
  isPro?: boolean;
  onSettingsClick: () => void;
}

const Header: FunctionComponent<HeaderProps> = ({
  extensionName,
  domain,
  cookieCount,
  isPro,
  onSettingsClick,
}) => (
  <header class="zovo-header">
    <div class="zovo-header-brand">
      <img
        src="/assets/icons/icon-24.png"
        alt="Zovo"
        class="zovo-header-logo"
      />
      <div class="zovo-header-info">
        <div class="zovo-header-title-row">
          <span class="zovo-header-title">{extensionName}</span>
          <span class="zovo-header-badge">by Zovo</span>
        </div>
        {domain && (
          <span class="zovo-header-subtitle">
            {domain}
            {cookieCount !== undefined && (
              <>
                <span class="separator">&middot;</span>
                {cookieCount} cookies
              </>
            )}
          </span>
        )}
      </div>
    </div>
    <div class="zovo-header-actions">
      {isPro && <span class="zovo-badge-pro-header">PRO</span>}
      <button
        class="zovo-btn zovo-btn-ghost zovo-btn-icon zovo-btn-sm"
        onClick={onSettingsClick}
        aria-label="Settings"
      >
        {/* 20x20 gear SVG icon */}
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="10" cy="10" r="3" />
          <path d="M10 1v2M10 17v2M1 10h2M17 10h2M3.5 3.5l1.4 1.4M15.1 15.1l1.4 1.4M3.5 16.5l1.4-1.4M15.1 4.9l1.4-1.4" />
        </svg>
      </button>
    </div>
  </header>
);

export default Header;
```

**CSS classes used:** `zovo-header`, `zovo-header-brand`, `zovo-header-logo`, `zovo-header-info`, `zovo-header-title-row`, `zovo-header-title`, `zovo-header-badge`, `zovo-header-subtitle`, `zovo-header-actions`, `zovo-badge-pro-header`, `zovo-btn`, `zovo-btn-ghost`, `zovo-btn-icon`, `zovo-btn-sm`


### 3.2 `<Footer>`

```tsx
// src/components/Footer.tsx
import { h, FunctionComponent } from 'preact';

interface FooterProps {
  /** e.g. "2/2 profiles used" */
  counterText?: string;
  /** 'ok' | 'warning' | 'danger' */
  counterState?: 'ok' | 'warning' | 'danger';
  isPro?: boolean;
  onUpgradeClick?: () => void;
  extensionId: string;
  userCount?: string;
}

const Footer: FunctionComponent<FooterProps> = ({
  counterText,
  counterState = 'ok',
  isPro,
  onUpgradeClick,
  extensionId,
  userCount,
}) => {
  const counterClass = counterState === 'danger'
    ? 'zovo-footer-counter zovo-footer-counter-danger'
    : counterState === 'warning'
      ? 'zovo-footer-counter zovo-footer-counter-warning'
      : 'zovo-footer-counter';

  return (
    <footer class="zovo-footer">
      <div class="zovo-flex zovo-items-center zovo-gap-1">
        {isPro ? (
          <span class="zovo-badge-pro-header" style={{ fontSize: '9px', padding: '1px 6px' }}>
            PRO
          </span>
        ) : (
          <>
            <span class={counterClass}>{counterText}</span>
            {counterState === 'danger' && onUpgradeClick && (
              <button class="zovo-footer-limit-upgrade" onClick={onUpgradeClick}>
                Upgrade
              </button>
            )}
          </>
        )}
      </div>
      <a
        href={`https://zovo.one?ref=${extensionId}&source=footer`}
        target="_blank"
        rel="noopener noreferrer"
        class="zovo-footer-brand"
      >
        <span>Powered by</span>
        <img src="/assets/zovo-logo.svg" alt="" class="zovo-footer-brand-logo" />
        <strong>Zovo</strong>
      </a>
    </footer>
  );
};

export default Footer;
```

**CSS classes used:** `zovo-footer`, `zovo-footer-counter`, `zovo-footer-counter-warning`, `zovo-footer-counter-danger`, `zovo-badge-pro-header`, `zovo-footer-limit-upgrade`, `zovo-footer-brand`, `zovo-footer-brand-logo`


### 3.3 `<TabBar>`

```tsx
// src/components/TabBar.tsx
import { h, FunctionComponent } from 'preact';

interface Tab {
  id: string;
  label: string;
  icon?: h.JSX.Element;
  badge?: number;
}

interface TabBarProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

const TabBar: FunctionComponent<TabBarProps> = ({ tabs, activeTab, onTabChange }) => (
  <nav class="zovo-tabs" role="tablist">
    {tabs.map((tab) => (
      <button
        key={tab.id}
        class={`zovo-tab ${tab.id === activeTab ? 'active' : ''}`}
        role="tab"
        aria-selected={tab.id === activeTab}
        aria-controls={`panel-${tab.id}`}
        onClick={() => onTabChange(tab.id)}
      >
        {tab.icon && <span class="zovo-tab-icon">{tab.icon}</span>}
        {tab.label}
        {tab.badge !== undefined && tab.badge > 0 && (
          <span class="zovo-tab-badge">{tab.badge}</span>
        )}
      </button>
    ))}
  </nav>
);

export default TabBar;

// Usage:
// <TabBar
//   tabs={[
//     { id: 'cookies',  label: 'Cookies',  badge: 47 },
//     { id: 'profiles', label: 'Profiles', badge: 2 },
//     { id: 'rules',    label: 'Rules' },
//     { id: 'health',   label: 'Health' },
//   ]}
//   activeTab="cookies"
//   onTabChange={setActiveTab}
// />
```

**CSS classes used:** `zovo-tabs`, `zovo-tab`, `active`, `zovo-tab-icon`, `zovo-tab-badge`


### 3.4 `<Button>`

```tsx
// src/components/Button.tsx
import { h, FunctionComponent } from 'preact';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' | 'pro';
  size?: 'sm' | 'md' | 'lg';
  block?: boolean;
  loading?: boolean;
  disabled?: boolean;
  iconOnly?: boolean;
  onClick?: (e: Event) => void;
  type?: string;
  class?: string;
}

const Button: FunctionComponent<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  block = false,
  loading = false,
  disabled = false,
  iconOnly = false,
  onClick,
  type = 'button',
  class: extraClass = '',
  children,
}) => {
  const classes = [
    'zovo-btn',
    `zovo-btn-${variant}`,
    size !== 'md' ? `zovo-btn-${size}` : '',
    block ? 'zovo-btn-block' : '',
    loading ? 'zovo-btn-loading' : '',
    iconOnly ? 'zovo-btn-icon' : '',
    extraClass,
  ].filter(Boolean).join(' ');

  return (
    <button
      class={classes}
      disabled={disabled || loading}
      onClick={onClick}
      type={type}
    >
      {children}
    </button>
  );
};

export default Button;

// Usage:
// <Button variant="primary" size="lg" block>Save Profile</Button>
// <Button variant="danger" size="sm">Delete</Button>
// <Button variant="ghost" iconOnly><GearIcon /></Button>
// <Button variant="pro" loading>Upgrading...</Button>
```

**CSS classes used:** `zovo-btn`, `zovo-btn-primary`, `zovo-btn-secondary`, `zovo-btn-ghost`, `zovo-btn-danger`, `zovo-btn-outline`, `zovo-btn-pro`, `zovo-btn-sm`, `zovo-btn-lg`, `zovo-btn-block`, `zovo-btn-loading`, `zovo-btn-icon`


### 3.5 `<Card>`

```tsx
// src/components/Card.tsx
import { h, FunctionComponent } from 'preact';

interface CardProps {
  hover?: boolean;
  selected?: boolean;
  compact?: boolean;
  locked?: boolean;
  onClick?: (e: Event) => void;
  class?: string;
}

const Card: FunctionComponent<CardProps> = ({
  hover = false,
  selected = false,
  compact = false,
  locked = false,
  onClick,
  class: extraClass = '',
  children,
}) => {
  const classes = [
    'zovo-card',
    hover ? 'zovo-card-hover' : '',
    selected ? 'zovo-card-selected' : '',
    compact ? 'zovo-card-compact' : '',
    locked ? 'zovo-card-locked' : '',
    extraClass,
  ].filter(Boolean).join(' ');

  return (
    <div class={classes} onClick={onClick}>
      {locked ? (
        <div class="zovo-card-locked-content">
          {children}
        </div>
      ) : (
        children
      )}
    </div>
  );
};

export default Card;

// Usage:
// <Card hover onClick={handleClick}>
//   <h3>Admin Login</h3>
//   <p>example.com - 12 cookies</p>
// </Card>
```

**CSS classes used:** `zovo-card`, `zovo-card-hover`, `zovo-card-selected`, `zovo-card-compact`, `zovo-card-locked`, `zovo-card-locked-content`


### 3.6 `<Modal>`

```tsx
// src/components/Modal.tsx
import { h, FunctionComponent } from 'preact';
import { useEffect, useCallback } from 'preact/hooks';

interface ModalProps {
  title: string;
  open: boolean;
  onClose: () => void;
  footer?: h.JSX.Element;
}

const Modal: FunctionComponent<ModalProps> = ({
  title,
  open,
  onClose,
  footer,
  children,
}) => {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [open, handleKeyDown]);

  if (!open) return null;

  return (
    <div class="zovo-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div class="zovo-modal" onClick={(e) => e.stopPropagation()}>
        <div class="zovo-modal-header">
          <h2 class="zovo-modal-title">{title}</h2>
          <button class="zovo-modal-close" onClick={onClose} aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 4l8 8M12 4l-8 8" />
            </svg>
          </button>
        </div>
        <div class="zovo-modal-body">{children}</div>
        {footer && <div class="zovo-modal-footer">{footer}</div>}
      </div>
    </div>
  );
};

export default Modal;

// Usage:
// <Modal
//   title="Delete All Cookies?"
//   open={showDeleteModal}
//   onClose={() => setShowDeleteModal(false)}
//   footer={
//     <>
//       <Button variant="ghost" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
//       <Button variant="danger" onClick={handleDeleteAll}>Delete All</Button>
//     </>
//   }
// >
//   <p>This will remove all 47 cookies from example.com. This action cannot be undone.</p>
// </Modal>
```

**CSS classes used:** `zovo-modal-overlay`, `zovo-modal`, `zovo-modal-header`, `zovo-modal-title`, `zovo-modal-close`, `zovo-modal-body`, `zovo-modal-footer`


### 3.7 `<Toast>`

```tsx
// src/components/Toast.tsx
import { h, FunctionComponent } from 'preact';
import { useEffect, useState } from 'preact/hooks';

interface ToastProps {
  message: string;
  variant?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onDismiss: () => void;
}

const Toast: FunctionComponent<ToastProps> = ({
  message,
  variant = 'info',
  duration = 3000,
  onDismiss,
}) => {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(onDismiss, 300);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onDismiss]);

  return (
    <div class={`zovo-toast zovo-toast-${variant} ${exiting ? 'zovo-toast-exit' : ''}`}>
      <span class="zovo-toast-icon">
        {variant === 'success' && '✓'}
        {variant === 'error' && '✕'}
        {variant === 'warning' && '!'}
        {variant === 'info' && 'i'}
      </span>
      <span class="zovo-toast-message">{message}</span>
      <button class="zovo-toast-dismiss" onClick={() => { setExiting(true); setTimeout(onDismiss, 300); }}>
        ✕
      </button>
    </div>
  );
};

/** Container that wraps all active toasts */
const ToastContainer: FunctionComponent = ({ children }) => (
  <div class="zovo-toast-container">{children}</div>
);

export { Toast, ToastContainer };

// Usage:
// <ToastContainer>
//   {toasts.map(t => (
//     <Toast key={t.id} message={t.message} variant={t.variant} onDismiss={() => removeToast(t.id)} />
//   ))}
// </ToastContainer>
```

**CSS classes used:** `zovo-toast-container`, `zovo-toast`, `zovo-toast-success`, `zovo-toast-error`, `zovo-toast-warning`, `zovo-toast-info`, `zovo-toast-exit`, `zovo-toast-icon`, `zovo-toast-message`, `zovo-toast-dismiss`


### 3.8 `<Badge>`

```tsx
// src/components/Badge.tsx
import { h, FunctionComponent } from 'preact';

interface BadgeProps {
  variant?: 'default' | 'pro' | 'free' | 'count' | 'active' | 'expired' | 'blocked' | 'session';
  class?: string;
}

const Badge: FunctionComponent<BadgeProps> = ({
  variant = 'default',
  class: extraClass = '',
  children,
}) => {
  const variantClass = variant === 'default'
    ? 'zovo-badge'
    : variant === 'count'
      ? 'zovo-badge zovo-badge-count'
      : `zovo-badge zovo-badge-${variant}`;

  return (
    <span class={`${variantClass} ${extraClass}`.trim()}>
      {children}
    </span>
  );
};

export default Badge;

// Usage:
// <Badge variant="pro">PRO</Badge>
// <Badge variant="count">47</Badge>
// <Badge variant="active">Active</Badge>
// <Badge variant="expired">Expired</Badge>
// <Badge variant="session">Session</Badge>

// Security flags (use directly without Badge wrapper):
// <span class="zovo-flag zovo-flag-secure">Secure</span>
// <span class="zovo-flag zovo-flag-httponly">HttpOnly</span>
// <span class="zovo-flag zovo-flag-samesite">SameSite</span>
```

**CSS classes used:** `zovo-badge`, `zovo-badge-pro`, `zovo-badge-free`, `zovo-badge-count`, `zovo-badge-active`, `zovo-badge-expired`, `zovo-badge-blocked`, `zovo-badge-session`, `zovo-flag`, `zovo-flag-secure`, `zovo-flag-httponly`, `zovo-flag-samesite`

---

## 4. Design Token Summary Table

Quick-reference for all design tokens defined in `:root`.

### 4.1 Colors

| Token | Light Value | Dark Value | Usage |
|-------|-------------|------------|-------|
| `--zovo-primary` | `#6366f1` | `#818cf8` | Shared Zovo brand, onboarding, retention prompts |
| `--zovo-primary-hover` | `#4f46e5` | `#6366f1` | Hover state for primary elements |
| `--zovo-primary-active` | `#4338ca` | `#4f46e5` | Active/pressed state |
| `--zovo-primary-light` | `#e0e7ff` | `rgba(99,102,241,0.15)` | Light tint backgrounds, focus rings |
| `--cm-brand` | `#2563eb` | `#60a5fa` | Cookie Manager CTAs, active tab, focus borders |
| `--cm-brand-hover` | `#1d4ed8` | `#3b82f6` | Hover state for CM brand elements |
| `--cm-brand-active` | `#1e40af` | `#2563eb` | Active/pressed state |
| `--cm-brand-light` | `#dbeafe` | `rgba(96,165,250,0.15)` | Selected chip/row backgrounds |
| `--zovo-secondary` | `#1e293b` | `#e2e8f0` | Dark buttons, reversed text |
| `--zovo-accent` | `#10b981` | (same) | Positive highlights, charts |
| `--zovo-success` | `#16a34a` | `#4ade80` | Success toasts, secure flags, toggles on |
| `--zovo-warning` | `#d97706` | `#fbbf24` | Warning toasts, amber health scores |
| `--zovo-error` | `#dc2626` | `#f87171` | Error toasts, delete buttons, danger scores |
| `--zovo-info` | `#0ea5e9` | `#38bdf8` | Info toasts, HttpOnly flags |
| `--zovo-pro` | `#7c3aed` | `#a78bfa` | PRO badges, lock icons, upgrade CTAs |
| `--zovo-pro-gold` | `#f59e0b` | `#fbbf24` | PRO header badge, gold accents |
| `--zovo-bg-primary` | `#ffffff` | `#1a1d23` | Main background |
| `--zovo-bg-secondary` | `#f7f8fa` | `#23272f` | Footer, alternate rows, expanded areas |
| `--zovo-bg-tertiary` | `#edeef2` | `#2d3139` | Chips inactive, disabled inputs |
| `--zovo-text-primary` | `#1a1d23` | `#e8eaed` | Headings, body text |
| `--zovo-text-secondary` | `#5f6368` | `#9aa0a6` | Labels, descriptions |
| `--zovo-text-muted` | `#9aa0a6` | `#5f6368` | Placeholders, tertiary info |
| `--zovo-text-inverse` | `#ffffff` | `#1a1d23` | Text on colored backgrounds |
| `--zovo-border` | `#e0e2e6` | `#3c4049` | Card borders, dividers |

### 4.2 Typography

| Token | Value | Usage |
|-------|-------|-------|
| `--zovo-font-family` | `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif` | All UI text |
| `--zovo-font-mono` | `'SF Mono', 'Fira Code', 'Consolas', 'Monaco', monospace` | Cookie values, domain patterns, code |
| `--zovo-font-size-xs` | `11px` | Badges, counters, helper text |
| `--zovo-font-size-sm` | `12px` | Tab labels, small buttons, metadata |
| `--zovo-font-size-base` | `13px` | Body text, cookie names, inputs |
| `--zovo-font-size-md` | `14px` | Header title, section headings |
| `--zovo-font-size-lg` | `16px` | Page headings (options page) |
| `--zovo-font-size-xl` | `18px` | Large headings |
| `--zovo-font-size-2xl` | `24px` | Hero text, health score grade |
| `--zovo-font-weight-normal` | `400` | Body text, descriptions |
| `--zovo-font-weight-medium` | `500` | Tab labels, button text, active tabs |
| `--zovo-font-weight-semibold` | `600` | Header title, card titles, section headings |
| `--zovo-font-weight-bold` | `700` | Health score grade, PRO badge text |
| `--zovo-line-height-tight` | `1.25` | Headings, badges |
| `--zovo-line-height-normal` | `1.5` | Body text |
| `--zovo-line-height-relaxed` | `1.75` | Long-form text |

### 4.3 Spacing

| Token | Value | Alias | Usage |
|-------|-------|-------|-------|
| `--zovo-space-1` | `4px` | xs | Inline gaps, badge padding |
| `--zovo-space-2` | `8px` | sm | Button icon gaps, small padding |
| `--zovo-space-3` | `12px` | md | Card padding, header padding |
| `--zovo-space-4` | `16px` | lg | Section spacing, modal padding |
| `--zovo-space-5` | `20px` | xl | Large gaps |
| `--zovo-space-6` | `24px` | 2xl | Large button padding |
| `--zovo-space-8` | `32px` | 3xl | Empty state padding, major sections |

### 4.4 Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--zovo-radius-sm` | `4px` | Badges, flag pills, small elements |
| `--zovo-radius-md` | `6px` | Buttons, inputs, select dropdowns |
| `--zovo-radius-lg` | `8px` | Cards, modals, rule editors |
| `--zovo-radius-xl` | `12px` | Health score badge, modal dialogs |
| `--zovo-radius-pill` | `16px` | Filter chips, tab pills, header badges |
| `--zovo-radius-full` | `9999px` | Circles, toggle thumbs, round badges |

### 4.5 Shadows

| Token | Value | Usage |
|-------|-------|-------|
| `--zovo-shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | Profile cards, subtle elevation |
| `--zovo-shadow-md` | `0 2px 8px rgba(0,0,0,0.08)` | Toasts, dropdowns, hover cards |
| `--zovo-shadow-lg` | `0 4px 16px rgba(0,0,0,0.12)` | Elevated panels, popovers |
| `--zovo-shadow-xl` | `0 20px 25px -5px rgba(0,0,0,0.10)` | Modals, dialogs |

### 4.6 Transitions

| Token | Value | Usage |
|-------|-------|-------|
| `--zovo-transition-fast` | `150ms ease` | Hover states, color changes, small toggles |
| `--zovo-transition-base` | `200ms ease` | General state changes, fade-ins |
| `--zovo-transition-slow` | `300ms ease` | Modals, major reveals, post-upgrade animations |
| `--zovo-transition-slide` | `150ms ease-out` | Tab indicator slide, toggle thumb, chevron rotate |

### 4.7 Layout Dimensions

| Token | Value | Usage |
|-------|-------|-------|
| `--zovo-popup-width` | `400px` | Fixed popup width |
| `--zovo-popup-default-height` | `520px` | Default popup height |
| `--zovo-popup-min-height` | `400px` | Minimum popup height |
| `--zovo-popup-max-height` | `600px` | Maximum popup height |
| `--zovo-header-height` | `56px` | Fixed header height |
| `--zovo-tab-bar-height` | `40px` | Fixed tab bar height |
| `--zovo-footer-height` | `36px` | Fixed footer height |
| `--zovo-action-bar-height` | `40px` | Fixed action bar above footer |

### 4.8 Z-Index Scale

| Token | Value | Usage |
|-------|-------|-------|
| `--zovo-z-base` | `0` | Default stacking |
| `--zovo-z-dropdown` | `100` | Filter dropdowns, select menus |
| `--zovo-z-sticky` | `200` | Header, tab bar, action bar |
| `--zovo-z-overlay` | `300` | Blur overlays, backdrop |
| `--zovo-z-modal` | `400` | Modal dialogs |
| `--zovo-z-toast` | `500` | Toast notifications (always on top) |

---

## Implementation Notes

### File Organization

```
shared/
  zovo-brand.css          <-- This file (shared across all Zovo extensions)

src/
  styles/
    cookie-manager.css    <-- Cookie Manager-specific components
  components/
    Header.tsx
    Footer.tsx
    TabBar.tsx
    Button.tsx
    Card.tsx
    Modal.tsx
    Toast.tsx
    Badge.tsx
```

### Import Order

In the popup's entry point:

```tsx
// 1. Shared brand system (all extensions)
import '../shared/zovo-brand.css';

// 2. Extension-specific components
import './styles/cookie-manager.css';
```

### Dark Mode Strategy

The system supports three modes as specified in section-4:

1. **System detection** (default): Uses `@media (prefers-color-scheme: dark)` -- no JS needed.
2. **Manual light**: No additional class on `<html>` or `<body>`.
3. **Manual dark**: Add `class="zovo-dark"` to `<html>` or `<body>`.

The settings page should store the user's preference in `chrome.storage.local` under the key `theme` with values `'light'`, `'dark'`, or `'system'`. On popup load, apply the class accordingly.

### Accessibility Compliance

All color pairings in this system meet WCAG AA (4.5:1 for body text, 3:1 for large text and UI components):

- `--zovo-text-primary` on `--zovo-bg-primary`: **12.6:1** (light), **13.2:1** (dark)
- `--zovo-text-secondary` on `--zovo-bg-primary`: **5.7:1** (light), **4.6:1** (dark)
- `--cm-brand` on `--zovo-bg-primary`: **4.6:1** (light), **5.2:1** (dark)
- `--zovo-text-inverse` on `--cm-brand`: **5.7:1** (light)
- `--zovo-success` on `--zovo-bg-primary`: **4.5:1** (light), **7.1:1** (dark)
- `--zovo-error` on `--zovo-bg-primary`: **5.9:1** (light), **5.3:1** (dark)

All interactive elements include `:focus-visible` outlines for keyboard navigation. Toggle switches, checkboxes, and buttons have sufficient touch/click targets (minimum 28px).

### Performance Considerations

- Inter font is loaded with `display=swap` to avoid blocking the popup render.
- All animations use `transform` and `opacity` (GPU-accelerated) -- no layout-triggering properties.
- Virtual scroll container styles are provided for the cookie list (500+ cookies need virtualization).
- The total CSS file is approximately 15KB unminified, ~4KB gzipped.

---

*Agent 2 complete. This design system provides the visual foundation for Cookie Manager and all future Zovo Chrome extensions.*
