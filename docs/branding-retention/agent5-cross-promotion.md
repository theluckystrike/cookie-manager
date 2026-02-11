# Agent 5: Cross-Extension Promotion System

## Zovo Cookie Manager — Phase 08 Branding & Retention

---

## Table of Contents

1. ["More from Zovo" Panel](#1-more-from-zovo-panel)
2. [Zovo Extension Catalog](#2-zovo-extension-catalog)
3. [Footer Branding Component](#3-footer-branding-component)
4. [Smart Recommendation Toast](#4-smart-recommendation-toast)
5. [Ref Tracking System](#5-ref-tracking-system)
6. ["You Might Also Like" in Settings](#6-you-might-also-like-in-settings)

---

## 1. "More from Zovo" Panel

### 1.1 Panel Design — Full Specification

The "More from Zovo" panel is a slide-out overlay accessible from the popup footer. It provides a curated view of the Zovo extension portfolio, membership CTAs, and smart recommendations based on installed extensions and user behavior.

#### Trigger

- A small "More tools" link positioned in the popup footer, next to the "Built by Zovo" attribution
- Alternatively, a small Zovo logomark icon (16x16) in the footer that acts as the trigger
- On click, the panel slides in from the right edge of the popup, overlaying the main content

#### Panel Dimensions

- Width: 320px (fills most of the 400px popup, leaving a 80px strip of the underlying content visible as a visual anchor)
- Height: 100% of the popup viewport
- The underlying popup content is dimmed with a semi-transparent overlay (`rgba(0, 0, 0, 0.3)`)

#### Panel HTML

```html
<!-- Cross-Promotion Panel — append to popup.html -->
<div class="zovo-panel-overlay" id="panelOverlay" hidden>
  <div class="zovo-panel-backdrop" id="panelBackdrop"></div>
  <aside class="zovo-panel" id="morePanel" role="dialog" aria-label="More from Zovo">
    <!-- Panel Header -->
    <div class="zovo-panel-header">
      <div class="zovo-panel-header-brand">
        <svg class="zovo-panel-logo" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="20" height="20" rx="4" fill="var(--zovo-primary)"/>
          <path d="M5 6h10l-3.5 4L15 14H5l3.5-4L5 6z" fill="white"/>
        </svg>
        <span class="zovo-panel-title">More from Zovo</span>
      </div>
      <button class="zovo-panel-close" id="panelCloseBtn" aria-label="Close panel">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </button>
    </div>

    <!-- Panel Body (scrollable) -->
    <div class="zovo-panel-body">

      <!-- Membership CTA -->
      <div class="zovo-panel-membership">
        <div class="zovo-panel-membership-badge">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1l1.76 3.57L13 5.24l-3 2.92.71 4.13L7 10.27 3.29 12.3 4 8.16 1 5.24l4.24-.67L7 1z" fill="currentColor"/>
          </svg>
          <span>ZOVO MEMBERSHIP</span>
        </div>
        <h3 class="zovo-panel-membership-title">One membership, all tools</h3>
        <p class="zovo-panel-membership-subtitle">
          Get Cookie Manager Pro + 15 other extensions
        </p>
        <div class="zovo-panel-membership-pricing">
          <span class="zovo-panel-price-tag">$4/mo Starter</span>
          <span class="zovo-panel-price-sep">&bull;</span>
          <span class="zovo-panel-price-tag">$7/mo Pro</span>
          <span class="zovo-panel-price-sep">&bull;</span>
          <span class="zovo-panel-price-tag">$14/mo Team</span>
        </div>
        <a href="https://zovo.one?ref=cookie-manager&source=more_panel"
           target="_blank"
           class="zovo-btn zovo-btn-primary zovo-btn-block zovo-panel-membership-cta"
           id="membershipCta">
          Join Zovo — Save 84%
        </a>
      </div>

      <!-- Recommended Extensions -->
      <div class="zovo-panel-section">
        <h4 class="zovo-panel-section-title">Recommended for you</h4>
        <div class="zovo-panel-extension-list" id="recommendedExtensions">
          <!-- Populated by JS — max 3 items -->
        </div>
      </div>

      <!-- Full Catalog Link -->
      <div class="zovo-panel-catalog-link">
        <a href="https://zovo.one/tools?ref=cookie-manager&source=more_panel"
           target="_blank"
           class="zovo-panel-see-all"
           id="seeAllLink">
          See all 16 extensions
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M5 3l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </a>
      </div>
    </div>
  </aside>
</div>
```

#### Extension Card Template (injected by JS)

```html
<!-- Template for each recommended extension card -->
<div class="zovo-panel-ext-card" data-extension-id="{id}">
  <div class="zovo-panel-ext-icon">
    <img src="{iconUrl}" alt="{name}" width="32" height="32" loading="lazy">
  </div>
  <div class="zovo-panel-ext-info">
    <span class="zovo-panel-ext-name">{name}</span>
    <span class="zovo-panel-ext-tagline">{tagline}</span>
  </div>
  <a href="{storeUrl}"
     target="_blank"
     class="zovo-btn zovo-btn-primary zovo-btn-sm zovo-panel-ext-cta"
     data-ref-source="recommendation">
    Add
  </a>
</div>
```

### 1.2 Panel CSS

```css
/* ==========================================================================
   "More from Zovo" Panel
   ========================================================================== */

/* Overlay container */
.zovo-panel-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1000;
  display: flex;
  justify-content: flex-end;
}

.zovo-panel-overlay[hidden] {
  display: none;
}

/* Semi-transparent backdrop */
.zovo-panel-backdrop {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.3);
  opacity: 0;
  transition: opacity var(--zovo-transition-slow);
}

.zovo-panel-overlay:not([hidden]) .zovo-panel-backdrop {
  opacity: 1;
}

/* Panel container */
.zovo-panel {
  position: relative;
  width: 320px;
  height: 100%;
  background: var(--zovo-bg-primary);
  border-left: 1px solid var(--zovo-border);
  box-shadow: var(--zovo-shadow-xl);
  display: flex;
  flex-direction: column;
  transform: translateX(100%);
  transition: transform var(--zovo-transition-slow);
  z-index: 1;
}

.zovo-panel-overlay:not([hidden]) .zovo-panel {
  transform: translateX(0);
}

/* Panel header */
.zovo-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--zovo-space-3) var(--zovo-space-4);
  border-bottom: 1px solid var(--zovo-border);
  flex-shrink: 0;
}

.zovo-panel-header-brand {
  display: flex;
  align-items: center;
  gap: var(--zovo-space-2);
}

.zovo-panel-logo {
  flex-shrink: 0;
}

.zovo-panel-title {
  font-size: var(--zovo-font-size-md);
  font-weight: var(--zovo-font-weight-semibold);
  color: var(--zovo-text-primary);
}

.zovo-panel-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  color: var(--zovo-text-muted);
  border-radius: var(--zovo-radius-md);
  cursor: pointer;
  transition: all var(--zovo-transition-fast);
}

.zovo-panel-close:hover {
  background: var(--zovo-bg-tertiary);
  color: var(--zovo-text-primary);
}

/* Panel body (scrollable) */
.zovo-panel-body {
  flex: 1;
  overflow-y: auto;
  padding: var(--zovo-space-4);
  display: flex;
  flex-direction: column;
  gap: var(--zovo-space-5);
}

/* Membership CTA card */
.zovo-panel-membership {
  background: linear-gradient(135deg, var(--zovo-primary-light) 0%, #ede9fe 100%);
  border: 1px solid var(--zovo-primary);
  border-radius: var(--zovo-radius-lg);
  padding: var(--zovo-space-4);
  text-align: center;
}

.zovo-panel-membership-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 10px;
  background: var(--zovo-primary);
  color: var(--zovo-text-inverse);
  font-size: 10px;
  font-weight: var(--zovo-font-weight-bold);
  letter-spacing: 0.5px;
  border-radius: var(--zovo-radius-full);
  margin-bottom: var(--zovo-space-3);
}

.zovo-panel-membership-title {
  font-size: var(--zovo-font-size-lg);
  font-weight: var(--zovo-font-weight-bold);
  color: var(--zovo-text-primary);
  margin-bottom: var(--zovo-space-1);
}

.zovo-panel-membership-subtitle {
  font-size: var(--zovo-font-size-sm);
  color: var(--zovo-text-secondary);
  margin-bottom: var(--zovo-space-3);
}

.zovo-panel-membership-pricing {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--zovo-space-2);
  margin-bottom: var(--zovo-space-3);
  flex-wrap: wrap;
}

.zovo-panel-price-tag {
  font-size: var(--zovo-font-size-xs);
  font-weight: var(--zovo-font-weight-medium);
  color: var(--zovo-text-secondary);
}

.zovo-panel-price-sep {
  font-size: 8px;
  color: var(--zovo-text-muted);
}

.zovo-panel-membership-cta {
  font-weight: var(--zovo-font-weight-semibold);
}

/* Recommended extensions section */
.zovo-panel-section-title {
  font-size: var(--zovo-font-size-sm);
  font-weight: var(--zovo-font-weight-semibold);
  color: var(--zovo-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: var(--zovo-space-3);
}

.zovo-panel-extension-list {
  display: flex;
  flex-direction: column;
  gap: var(--zovo-space-3);
}

/* Individual extension card */
.zovo-panel-ext-card {
  display: flex;
  align-items: center;
  gap: var(--zovo-space-3);
  padding: var(--zovo-space-3);
  background: var(--zovo-bg-secondary);
  border: 1px solid var(--zovo-border);
  border-radius: var(--zovo-radius-lg);
  transition: border-color var(--zovo-transition-fast);
}

.zovo-panel-ext-card:hover {
  border-color: var(--zovo-primary);
}

.zovo-panel-ext-icon {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: var(--zovo-radius-md);
  overflow: hidden;
}

.zovo-panel-ext-icon img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.zovo-panel-ext-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.zovo-panel-ext-name {
  font-size: var(--zovo-font-size-sm);
  font-weight: var(--zovo-font-weight-semibold);
  color: var(--zovo-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.zovo-panel-ext-tagline {
  font-size: var(--zovo-font-size-xs);
  color: var(--zovo-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.zovo-panel-ext-cta {
  flex-shrink: 0;
  padding: var(--zovo-space-1) var(--zovo-space-3);
  font-size: var(--zovo-font-size-xs);
}

/* Full catalog link */
.zovo-panel-catalog-link {
  padding-top: var(--zovo-space-2);
  border-top: 1px solid var(--zovo-border);
  text-align: center;
}

.zovo-panel-see-all {
  display: inline-flex;
  align-items: center;
  gap: var(--zovo-space-1);
  font-size: var(--zovo-font-size-sm);
  font-weight: var(--zovo-font-weight-medium);
  color: var(--zovo-primary);
  text-decoration: none;
  transition: color var(--zovo-transition-fast);
}

.zovo-panel-see-all:hover {
  color: var(--zovo-primary-hover);
}

/* ==========================================================================
   Dark Mode Overrides
   ========================================================================== */

@media (prefers-color-scheme: dark) {
  .zovo-panel-membership {
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(99, 102, 241, 0.08) 100%);
    border-color: rgba(99, 102, 241, 0.4);
  }

  .zovo-panel-ext-card {
    background: var(--zovo-bg-tertiary);
  }

  .zovo-panel-backdrop {
    background: rgba(0, 0, 0, 0.5);
  }
}

/* [data-theme="dark"] manual toggle support */
[data-theme="dark"] .zovo-panel-membership {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(99, 102, 241, 0.08) 100%);
  border-color: rgba(99, 102, 241, 0.4);
}

[data-theme="dark"] .zovo-panel-ext-card {
  background: var(--zovo-bg-tertiary);
}

[data-theme="dark"] .zovo-panel-backdrop {
  background: rgba(0, 0, 0, 0.5);
}
```

### 1.3 Panel JavaScript Controller

```typescript
// panel-controller.ts — "More from Zovo" panel logic

import { getRecommendations, type ZovoExtension } from './catalog';
import { buildRefUrl, trackClick } from './ref-tracking';

const CURRENT_EXTENSION_ID = 'cookie-manager';

class MoreFromZovoPanel {
  private overlay: HTMLElement;
  private panel: HTMLElement;
  private backdrop: HTMLElement;
  private closeBtn: HTMLElement;
  private extensionList: HTMLElement;
  private membershipCta: HTMLElement;
  private seeAllLink: HTMLElement;
  private isOpen: boolean = false;

  constructor() {
    this.overlay = document.getElementById('panelOverlay')!;
    this.panel = document.getElementById('morePanel')!;
    this.backdrop = document.getElementById('panelBackdrop')!;
    this.closeBtn = document.getElementById('panelCloseBtn')!;
    this.extensionList = document.getElementById('recommendedExtensions')!;
    this.membershipCta = document.getElementById('membershipCta')!;
    this.seeAllLink = document.getElementById('seeAllLink')!;

    this.bindEvents();
  }

  private bindEvents(): void {
    this.closeBtn.addEventListener('click', () => this.close());
    this.backdrop.addEventListener('click', () => this.close());

    // Keyboard: Escape closes the panel
    document.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });

    // Track membership CTA clicks
    this.membershipCta.addEventListener('click', () => {
      trackClick('more_panel', 'membership_cta');
    });

    // Track "See all" clicks
    this.seeAllLink.addEventListener('click', () => {
      trackClick('more_panel', 'see_all');
    });
  }

  async open(): Promise<void> {
    if (this.isOpen) return;

    // Load recommendations
    await this.loadRecommendations();

    // Show overlay
    this.overlay.hidden = false;

    // Force reflow for transition
    void this.overlay.offsetHeight;

    this.isOpen = true;

    // Track panel open
    trackClick('more_panel', 'panel_open');

    // Focus trap: focus the close button
    this.closeBtn.focus();
  }

  close(): void {
    if (!this.isOpen) return;

    // Trigger close transition
    this.overlay.setAttribute('hidden', '');
    this.isOpen = false;
  }

  private async loadRecommendations(): Promise<void> {
    const recommendations = await getRecommendations(CURRENT_EXTENSION_ID, 3);

    this.extensionList.innerHTML = '';

    if (recommendations.length === 0) {
      this.extensionList.innerHTML = `
        <div class="zovo-panel-ext-empty">
          <p style="font-size: var(--zovo-font-size-sm); color: var(--zovo-text-muted); text-align: center; padding: var(--zovo-space-4);">
            You have all our recommended extensions installed. Nice!
          </p>
        </div>
      `;
      return;
    }

    recommendations.forEach((ext: ZovoExtension) => {
      const card = document.createElement('div');
      card.className = 'zovo-panel-ext-card';
      card.dataset.extensionId = ext.id;

      const storeUrlWithRef = buildRefUrl(ext.storeUrl, 'recommendation');

      card.innerHTML = `
        <div class="zovo-panel-ext-icon">
          <img src="${ext.iconUrl}" alt="${ext.name}" width="32" height="32" loading="lazy">
        </div>
        <div class="zovo-panel-ext-info">
          <span class="zovo-panel-ext-name">${ext.name}</span>
          <span class="zovo-panel-ext-tagline">${ext.tagline}</span>
        </div>
        <a href="${storeUrlWithRef}"
           target="_blank"
           class="zovo-btn zovo-btn-primary zovo-btn-sm zovo-panel-ext-cta">
          Add
        </a>
      `;

      // Track individual extension clicks
      const ctaBtn = card.querySelector('.zovo-panel-ext-cta');
      ctaBtn?.addEventListener('click', () => {
        trackClick('recommendation', ext.id);
      });

      this.extensionList.appendChild(card);
    });
  }
}

export default MoreFromZovoPanel;
```

### 1.4 Panel Content Structure

The panel content is ordered by conversion priority:

| Section | Position | Purpose | Conversion Goal |
|---------|----------|---------|-----------------|
| Membership CTA | Top | Promote Zovo bundle | Drive membership signups |
| Recommended Extensions (3) | Middle | Cross-install related tools | Increase extensions per user |
| Full Catalog Link | Bottom | Discover entire portfolio | Browse and install more tools |

**Content rules:**
- Membership CTA is always visible at the top, even when scrolling
- Recommended extensions are filtered to exclude already-installed extensions
- If fewer than 3 recommendations remain after filtering, show whatever is available
- If all recommended extensions are installed, show a congratulatory message and link to the full catalog
- The "See all 16 extensions" link always points to `zovo.one/tools` with ref tracking

---

## 2. Zovo Extension Catalog

### 2.1 Complete Catalog Data (`catalog.ts`)

```typescript
// catalog.ts — Complete Zovo extension portfolio for cross-promotion

// -------------------------------------------------------------------------
// Types
// -------------------------------------------------------------------------

export interface ZovoExtension {
  /** Unique slug identifier matching the extension directory name */
  id: string;
  /** Display name shown in UI */
  name: string;
  /** One-line value proposition (max 60 chars) */
  tagline: string;
  /** URL to the extension's 32x32 icon hosted on zovo.one CDN */
  iconUrl: string;
  /** Chrome Web Store listing URL */
  storeUrl: string;
  /** Functional category for grouping and relevance matching */
  category: 'developer' | 'productivity' | 'utility';
  /** Whether this extension is highlighted in cross-promo panels */
  featured: boolean;
  /** IDs of extensions whose users would likely benefit from this one */
  relatedTo: string[];
}

// -------------------------------------------------------------------------
// Catalog Data — All 16 Zovo Extensions
// -------------------------------------------------------------------------

export const ZOVO_CATALOG: ZovoExtension[] = [
  {
    id: 'tab-suspender-pro',
    name: 'Tab Suspender Pro',
    tagline: 'Save memory by suspending inactive tabs',
    iconUrl: 'https://zovo.one/icons/tab-suspender-pro-32.png',
    storeUrl: 'https://chromewebstore.google.com/detail/tab-suspender-pro/PLACEHOLDER_ID',
    category: 'productivity',
    featured: true,
    relatedTo: ['cookie-manager', 'clipboard-history', 'bookmark-search', 'quick-notes'],
  },
  {
    id: 'clipboard-history',
    name: 'Clipboard History',
    tagline: 'Never lose copied text again',
    iconUrl: 'https://zovo.one/icons/clipboard-history-32.png',
    storeUrl: 'https://chromewebstore.google.com/detail/clipboard-history/PLACEHOLDER_ID',
    category: 'productivity',
    featured: true,
    relatedTo: ['form-filler-pro', 'quick-notes', 'base64-encoder', 'cookie-manager'],
  },
  {
    id: 'json-formatter-pro',
    name: 'JSON Formatter Pro',
    tagline: 'Format, validate, and explore JSON beautifully',
    iconUrl: 'https://zovo.one/icons/json-formatter-pro-32.png',
    storeUrl: 'https://chromewebstore.google.com/detail/json-formatter-pro/PLACEHOLDER_ID',
    category: 'developer',
    featured: true,
    relatedTo: ['cookie-manager', 'base64-encoder', 'web-scraper-lite', 'timestamp-converter'],
  },
  {
    id: 'screenshot-annotate',
    name: 'Screenshot & Annotate',
    tagline: 'Capture, annotate, and share screenshots',
    iconUrl: 'https://zovo.one/icons/screenshot-annotate-32.png',
    storeUrl: 'https://chromewebstore.google.com/detail/screenshot-annotate/PLACEHOLDER_ID',
    category: 'productivity',
    featured: false,
    relatedTo: ['color-palette', 'quick-notes', 'clipboard-history'],
  },
  {
    id: 'form-filler-pro',
    name: 'Form Filler Pro',
    tagline: 'Auto-fill forms with saved profiles',
    iconUrl: 'https://zovo.one/icons/form-filler-pro-32.png',
    storeUrl: 'https://chromewebstore.google.com/detail/form-filler-pro/PLACEHOLDER_ID',
    category: 'productivity',
    featured: true,
    relatedTo: ['cookie-manager', 'clipboard-history', 'lorem-ipsum', 'web-scraper-lite'],
  },
  {
    id: 'web-scraper-lite',
    name: 'Web Scraper Lite',
    tagline: 'Extract structured data from any page',
    iconUrl: 'https://zovo.one/icons/web-scraper-lite-32.png',
    storeUrl: 'https://chromewebstore.google.com/detail/web-scraper-lite/PLACEHOLDER_ID',
    category: 'developer',
    featured: true,
    relatedTo: ['cookie-manager', 'json-formatter-pro', 'clipboard-history', 'base64-encoder'],
  },
  {
    id: 'quick-notes',
    name: 'Quick Notes',
    tagline: 'Jot notes without leaving the browser',
    iconUrl: 'https://zovo.one/icons/quick-notes-32.png',
    storeUrl: 'https://chromewebstore.google.com/detail/quick-notes/PLACEHOLDER_ID',
    category: 'productivity',
    featured: false,
    relatedTo: ['clipboard-history', 'word-counter', 'lorem-ipsum', 'bookmark-search'],
  },
  {
    id: 'base64-encoder',
    name: 'Base64 Encoder/Decoder',
    tagline: 'Encode and decode Base64 strings instantly',
    iconUrl: 'https://zovo.one/icons/base64-encoder-32.png',
    storeUrl: 'https://chromewebstore.google.com/detail/base64-encoder/PLACEHOLDER_ID',
    category: 'developer',
    featured: false,
    relatedTo: ['json-formatter-pro', 'cookie-manager', 'timestamp-converter', 'web-scraper-lite'],
  },
  {
    id: 'qr-generator',
    name: 'QR Code Generator',
    tagline: 'Generate QR codes for any URL or text',
    iconUrl: 'https://zovo.one/icons/qr-generator-32.png',
    storeUrl: 'https://chromewebstore.google.com/detail/qr-generator/PLACEHOLDER_ID',
    category: 'utility',
    featured: false,
    relatedTo: ['screenshot-annotate', 'clipboard-history', 'base64-encoder'],
  },
  {
    id: 'timestamp-converter',
    name: 'Timestamp Converter',
    tagline: 'Convert between Unix timestamps and dates',
    iconUrl: 'https://zovo.one/icons/timestamp-converter-32.png',
    storeUrl: 'https://chromewebstore.google.com/detail/timestamp-converter/PLACEHOLDER_ID',
    category: 'developer',
    featured: false,
    relatedTo: ['json-formatter-pro', 'cookie-manager', 'base64-encoder', 'unit-converter'],
  },
  {
    id: 'color-palette',
    name: 'Color Palette Generator',
    tagline: 'Pick colors and generate palettes from any page',
    iconUrl: 'https://zovo.one/icons/color-palette-32.png',
    storeUrl: 'https://chromewebstore.google.com/detail/color-palette/PLACEHOLDER_ID',
    category: 'utility',
    featured: false,
    relatedTo: ['screenshot-annotate', 'web-scraper-lite', 'qr-generator'],
  },
  {
    id: 'word-counter',
    name: 'Word Counter',
    tagline: 'Count words, characters, and reading time',
    iconUrl: 'https://zovo.one/icons/word-counter-32.png',
    storeUrl: 'https://chromewebstore.google.com/detail/word-counter/PLACEHOLDER_ID',
    category: 'utility',
    featured: false,
    relatedTo: ['quick-notes', 'lorem-ipsum', 'clipboard-history'],
  },
  {
    id: 'unit-converter',
    name: 'Unit Converter',
    tagline: 'Convert units, currencies, and measurements',
    iconUrl: 'https://zovo.one/icons/unit-converter-32.png',
    storeUrl: 'https://chromewebstore.google.com/detail/unit-converter/PLACEHOLDER_ID',
    category: 'utility',
    featured: false,
    relatedTo: ['timestamp-converter', 'base64-encoder', 'qr-generator'],
  },
  {
    id: 'bookmark-search',
    name: 'Bookmark Search',
    tagline: 'Search and organize bookmarks instantly',
    iconUrl: 'https://zovo.one/icons/bookmark-search-32.png',
    storeUrl: 'https://chromewebstore.google.com/detail/bookmark-search/PLACEHOLDER_ID',
    category: 'productivity',
    featured: false,
    relatedTo: ['tab-suspender-pro', 'quick-notes', 'clipboard-history'],
  },
  {
    id: 'lorem-ipsum',
    name: 'Lorem Ipsum Generator',
    tagline: 'Generate placeholder text in one click',
    iconUrl: 'https://zovo.one/icons/lorem-ipsum-32.png',
    storeUrl: 'https://chromewebstore.google.com/detail/lorem-ipsum/PLACEHOLDER_ID',
    category: 'utility',
    featured: false,
    relatedTo: ['form-filler-pro', 'word-counter', 'quick-notes'],
  },
  {
    id: 'cookie-manager',
    name: 'Zovo Cookie Manager',
    tagline: 'See, control, and own every cookie instantly',
    iconUrl: 'https://zovo.one/icons/cookie-manager-32.png',
    storeUrl: 'https://chromewebstore.google.com/detail/cookie-manager/PLACEHOLDER_ID',
    category: 'developer',
    featured: true,
    relatedTo: ['json-formatter-pro', 'web-scraper-lite', 'form-filler-pro', 'tab-suspender-pro'],
  },
];
```

### 2.2 Smart Recommendations Logic

```typescript
// recommendations.ts — Smart recommendation engine

import { ZOVO_CATALOG, type ZovoExtension } from './catalog';

// -------------------------------------------------------------------------
// Known Zovo Extension IDs for chrome.management detection
// -------------------------------------------------------------------------

/** Maps extension slug to Chrome Web Store extension ID (populated after CWS publish) */
const KNOWN_EXTENSION_IDS: Record<string, string> = {
  'tab-suspender-pro':   'PLACEHOLDER_CWS_ID_01',
  'clipboard-history':   'PLACEHOLDER_CWS_ID_02',
  'json-formatter-pro':  'PLACEHOLDER_CWS_ID_03',
  'screenshot-annotate': 'PLACEHOLDER_CWS_ID_04',
  'form-filler-pro':     'PLACEHOLDER_CWS_ID_05',
  'web-scraper-lite':    'PLACEHOLDER_CWS_ID_06',
  'quick-notes':         'PLACEHOLDER_CWS_ID_07',
  'base64-encoder':      'PLACEHOLDER_CWS_ID_08',
  'qr-generator':        'PLACEHOLDER_CWS_ID_09',
  'timestamp-converter': 'PLACEHOLDER_CWS_ID_10',
  'color-palette':       'PLACEHOLDER_CWS_ID_11',
  'word-counter':        'PLACEHOLDER_CWS_ID_12',
  'unit-converter':      'PLACEHOLDER_CWS_ID_13',
  'bookmark-search':     'PLACEHOLDER_CWS_ID_14',
  'lorem-ipsum':         'PLACEHOLDER_CWS_ID_15',
  'cookie-manager':      'PLACEHOLDER_CWS_ID_16',
};

// -------------------------------------------------------------------------
// Installed Extension Detection
// -------------------------------------------------------------------------

/**
 * Detect which Zovo extensions the user has installed.
 * Uses chrome.management API if available, falls back to empty set.
 *
 * NOTE: The chrome.management API requires the "management" permission in
 * manifest.json. If the permission is not granted, this silently returns
 * an empty set rather than erroring.
 */
async function getInstalledZovoExtensions(): Promise<Set<string>> {
  const installed = new Set<string>();

  // Always exclude self
  installed.add('cookie-manager');

  try {
    if (typeof chrome !== 'undefined' && chrome.management) {
      const allExtensions = await chrome.management.getAll();
      const installedIds = new Set(allExtensions.map((ext) => ext.id));

      for (const [slug, cwsId] of Object.entries(KNOWN_EXTENSION_IDS)) {
        if (installedIds.has(cwsId)) {
          installed.add(slug);
        }
      }
    }
  } catch {
    // chrome.management not available or permission denied — degrade gracefully
    console.debug('[Zovo] chrome.management not available; skipping installed detection');
  }

  return installed;
}

// -------------------------------------------------------------------------
// Relevance Scoring
// -------------------------------------------------------------------------

/**
 * Compute a relevance score for an extension relative to the current extension.
 *
 * Scoring factors:
 *   +3  if the extension is in the current extension's relatedTo list
 *   +3  if the current extension is in the candidate's relatedTo list (mutual)
 *   +2  if the extension is featured
 *   +1  if the extension shares the same category as the current extension
 *   +0.5  pseudo-random rotation factor based on day-of-year (prevents staleness)
 */
function scoreExtension(
  candidate: ZovoExtension,
  currentExtension: ZovoExtension,
  dayOfYear: number,
): number {
  let score = 0;

  // Mutual relevance
  if (currentExtension.relatedTo.includes(candidate.id)) {
    score += 3;
  }
  if (candidate.relatedTo.includes(currentExtension.id)) {
    score += 3;
  }

  // Featured bonus
  if (candidate.featured) {
    score += 2;
  }

  // Same category bonus
  if (candidate.category === currentExtension.category) {
    score += 1;
  }

  // Day-rotation factor: uses a simple hash of candidate ID + day to create
  // mild daily variation in ordering among similarly-scored items
  const hash = candidate.id.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  score += ((hash + dayOfYear) % 100) / 200; // 0 to 0.5

  return score;
}

// -------------------------------------------------------------------------
// Public API
// -------------------------------------------------------------------------

/**
 * Get recommended extensions for the current extension, filtered and sorted.
 *
 * @param currentExtensionId - The slug ID of the calling extension
 * @param maxCount - Maximum number of recommendations to return (default 3)
 * @returns Sorted array of recommended ZovoExtension objects
 */
export async function getRecommendations(
  currentExtensionId: string,
  maxCount: number = 3,
): Promise<ZovoExtension[]> {
  const installedSlugs = await getInstalledZovoExtensions();

  const currentExtension = ZOVO_CATALOG.find((ext) => ext.id === currentExtensionId);
  if (!currentExtension) {
    // Fallback: return top featured extensions excluding self
    return ZOVO_CATALOG
      .filter((ext) => ext.id !== currentExtensionId && ext.featured)
      .slice(0, maxCount);
  }

  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (24 * 60 * 60 * 1000),
  );

  const scored = ZOVO_CATALOG
    // Exclude self and already-installed extensions
    .filter((ext) => !installedSlugs.has(ext.id))
    // Score and sort by relevance (highest first)
    .map((ext) => ({
      extension: ext,
      score: scoreExtension(ext, currentExtension, dayOfYear),
    }))
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, maxCount).map((item) => item.extension);
}

/**
 * Get the full catalog (all 16 extensions).
 */
export function getCatalog(): ZovoExtension[] {
  return [...ZOVO_CATALOG];
}

/**
 * Get a single extension by ID.
 */
export function getExtensionById(id: string): ZovoExtension | undefined {
  return ZOVO_CATALOG.find((ext) => ext.id === id);
}
```

### 2.3 Relevance Matrix — Cookie Manager Perspective

The following table shows the top-scored extensions for cross-promotion from within Cookie Manager, based on the `relatedTo` mappings and scoring algorithm:

| Rank | Extension | Score Breakdown | Why Relevant to Cookie Manager Users |
|------|-----------|-----------------|--------------------------------------|
| 1 | JSON Formatter Pro | +3 mutual + 2 featured + 1 same category = **6** | Developers working with cookies frequently handle JSON (export/import format) |
| 2 | Web Scraper Lite | +3 mutual + 2 featured + 1 same category = **6** | QA engineers and developers scraping sites also manage cookies for auth sessions |
| 3 | Tab Suspender Pro | +3 related + 2 featured + 0 diff category = **5** | Power users with many tabs use Cookie Manager across multiple domains |
| 4 | Form Filler Pro | +3 related + 2 featured + 0 diff category = **5** | Cookie profiles and form profiles serve the same multi-account workflow |
| 5 | Clipboard History | +3 related + 2 featured + 0 diff category = **5** | Developers copying cookie values benefit from clipboard persistence |
| 6 | Base64 Encoder | +3 related + 0 not featured + 1 same category = **4** | Cookie values are frequently base64-encoded; natural developer tool pairing |
| 7 | Timestamp Converter | +3 related + 0 not featured + 1 same category = **4** | Cookie expiry dates are timestamps; direct functional complement |

The default 3 recommendations for Cookie Manager users will typically be **JSON Formatter Pro**, **Web Scraper Lite**, and **Tab Suspender Pro**, rotating with mild daily variation.

---

## 3. Footer Branding Component

### 3.1 Enhanced Footer HTML

This footer replaces the basic footer from Agent 2's global styles, adding the cross-promotion trigger and dynamic user count.

```html
<!-- Enhanced footer — replaces basic .zovo-footer in popup.html -->
<footer class="zovo-footer-enhanced" id="zovoFooter">
  <div class="zovo-footer-left">
    <a href="https://zovo.one?ref=cookie-manager&source=footer"
       target="_blank"
       class="zovo-footer-brand-link"
       id="footerBrandLink">
      <svg class="zovo-footer-logo" width="14" height="14" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="20" height="20" rx="4" fill="var(--zovo-primary)"/>
        <path d="M5 6h10l-3.5 4L15 14H5l3.5-4L5 6z" fill="white"/>
      </svg>
      <span class="zovo-footer-brand-text">
        Built by <strong>Zovo</strong>
      </span>
    </a>
    <span class="zovo-footer-separator">&bull;</span>
    <span class="zovo-footer-user-count" id="footerUserCount">
      Join 3,300+ users
    </span>
  </div>
  <button class="zovo-footer-more-trigger" id="moreToolsTrigger" type="button">
    More tools
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M4.5 2.5l3.5 3.5-3.5 3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  </button>
</footer>
```

### 3.2 Footer CSS (Complete with Dark Mode)

```css
/* ==========================================================================
   Enhanced Footer Branding Component
   ========================================================================== */

.zovo-footer-enhanced {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--zovo-space-2) var(--zovo-space-4);
  border-top: 1px solid var(--zovo-border);
  background: var(--zovo-bg-secondary);
  flex-shrink: 0;
  min-height: 36px;
}

/* Left section: brand + user count */
.zovo-footer-left {
  display: flex;
  align-items: center;
  gap: var(--zovo-space-2);
  min-width: 0;
}

/* Brand link */
.zovo-footer-brand-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  text-decoration: none;
  color: var(--zovo-text-muted);
  font-size: var(--zovo-font-size-xs);
  transition: color var(--zovo-transition-fast);
  white-space: nowrap;
}

.zovo-footer-brand-link:hover {
  color: var(--zovo-primary);
}

.zovo-footer-brand-link strong {
  color: var(--zovo-text-secondary);
  font-weight: var(--zovo-font-weight-semibold);
}

.zovo-footer-brand-link:hover strong {
  color: var(--zovo-primary);
}

.zovo-footer-logo {
  flex-shrink: 0;
}

.zovo-footer-brand-text {
  line-height: 1;
}

/* Separator dot */
.zovo-footer-separator {
  color: var(--zovo-text-muted);
  font-size: 8px;
  flex-shrink: 0;
}

/* Dynamic user count */
.zovo-footer-user-count {
  font-size: 10px;
  color: var(--zovo-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* "More tools" trigger button */
.zovo-footer-more-trigger {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 2px var(--zovo-space-2);
  background: transparent;
  border: none;
  color: var(--zovo-primary);
  font-family: var(--zovo-font-family);
  font-size: var(--zovo-font-size-xs);
  font-weight: var(--zovo-font-weight-medium);
  cursor: pointer;
  border-radius: var(--zovo-radius-sm);
  transition: all var(--zovo-transition-fast);
  white-space: nowrap;
  flex-shrink: 0;
}

.zovo-footer-more-trigger:hover {
  background: var(--zovo-primary-light);
  color: var(--zovo-primary-hover);
}

.zovo-footer-more-trigger svg {
  transition: transform var(--zovo-transition-fast);
}

.zovo-footer-more-trigger:hover svg {
  transform: translateX(2px);
}

/* ==========================================================================
   Footer Dark Mode
   ========================================================================== */

@media (prefers-color-scheme: dark) {
  .zovo-footer-enhanced {
    background: var(--zovo-bg-secondary);
    border-top-color: var(--zovo-border);
  }

  .zovo-footer-brand-link strong {
    color: var(--zovo-text-secondary);
  }

  .zovo-footer-more-trigger:hover {
    background: rgba(99, 102, 241, 0.15);
  }
}

[data-theme="dark"] .zovo-footer-enhanced {
  background: var(--zovo-bg-secondary);
  border-top-color: var(--zovo-border);
}

[data-theme="dark"] .zovo-footer-brand-link strong {
  color: var(--zovo-text-secondary);
}

[data-theme="dark"] .zovo-footer-more-trigger:hover {
  background: rgba(99, 102, 241, 0.15);
}
```

### 3.3 Footer Controller

```typescript
// footer-controller.ts — Enhanced footer branding logic

import MoreFromZovoPanel from './panel-controller';
import { trackClick } from './ref-tracking';

const CURRENT_EXTENSION_ID = 'cookie-manager';

class FooterBranding {
  private moreToolsTrigger: HTMLElement;
  private footerBrandLink: HTMLElement;
  private footerUserCount: HTMLElement;
  private panel: MoreFromZovoPanel;

  constructor(panel: MoreFromZovoPanel) {
    this.panel = panel;
    this.moreToolsTrigger = document.getElementById('moreToolsTrigger')!;
    this.footerBrandLink = document.getElementById('footerBrandLink')!;
    this.footerUserCount = document.getElementById('footerUserCount')!;

    this.bindEvents();
    this.updateUserCount();
  }

  private bindEvents(): void {
    // Open panel on "More tools" click
    this.moreToolsTrigger.addEventListener('click', () => {
      this.panel.open();
    });

    // Track footer brand link clicks
    this.footerBrandLink.addEventListener('click', () => {
      trackClick('footer', 'brand_link');
    });
  }

  /**
   * Update the user count display.
   * Checks chrome.storage.sync for a cached user count from the Zovo backend.
   * Falls back to a static default if no dynamic count is available.
   */
  private async updateUserCount(): Promise<void> {
    try {
      const { zovoUserCount } = await chrome.storage.sync.get('zovoUserCount');
      if (zovoUserCount && typeof zovoUserCount === 'number') {
        const formatted = zovoUserCount >= 1000
          ? `${(zovoUserCount / 1000).toFixed(1).replace(/\.0$/, '')}k`
          : String(zovoUserCount);
        this.footerUserCount.textContent = `Join ${formatted}+ users`;
      }
      // Otherwise, keep the default "Join 3,300+ users" from the HTML
    } catch {
      // Silently fail — static default remains visible
    }
  }
}

export default FooterBranding;
```

---

## 4. Smart Recommendation Toast

### 4.1 Contextual Recommendation Triggers

After certain user actions within Cookie Manager, show a subtle toast recommending a relevant Zovo extension. The toast appears with a **10% probability** and at most **once per 24 hours** to avoid being intrusive.

| User Action | Recommended Extension | Why |
|-------------|----------------------|-----|
| Successful JSON export | JSON Formatter Pro | User just exported JSON — they likely work with JSON data regularly |
| Managing cookies across 5+ tabs | Tab Suspender Pro | Power user with many tabs will benefit from memory management |
| Using search 10+ times in a session | Bookmark Search | Frequent searchers value fast-find tools across browser features |
| Copying a cookie value to clipboard | Clipboard History | Just used clipboard — Clipboard History prevents losing past copies |
| Viewing an expired/problematic cookie | Timestamp Converter | Debugging cookie expiry timestamps is easier with a converter |
| Exporting cookies as cURL | Web Scraper Lite | Developer using cURL export likely does web scraping or API testing |

### 4.2 Toast HTML

```html
<!-- Recommendation Toast — append to popup.html, below main content -->
<div class="zovo-toast-container" id="toastContainer" hidden aria-live="polite">
  <div class="zovo-toast" id="recommendationToast">
    <div class="zovo-toast-content">
      <div class="zovo-toast-icon" id="toastIcon">
        <!-- Extension icon injected by JS -->
      </div>
      <div class="zovo-toast-text">
        <span class="zovo-toast-title" id="toastTitle">
          <!-- Extension name injected by JS -->
        </span>
        <span class="zovo-toast-tagline" id="toastTagline">
          <!-- Tagline injected by JS -->
        </span>
      </div>
    </div>
    <div class="zovo-toast-actions">
      <a class="zovo-btn zovo-btn-primary zovo-btn-sm zovo-toast-cta"
         id="toastCta"
         target="_blank">
        Add to Chrome
      </a>
      <button class="zovo-toast-dismiss" id="toastDismiss" aria-label="Dismiss">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M3.5 3.5l7 7M10.5 3.5l-7 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </button>
    </div>
  </div>
</div>
```

### 4.3 Toast CSS

```css
/* ==========================================================================
   Smart Recommendation Toast
   ========================================================================== */

.zovo-toast-container {
  position: fixed;
  bottom: 44px; /* Above the footer (36px height + 8px gap) */
  left: var(--zovo-space-3);
  right: var(--zovo-space-3);
  z-index: 900;
  pointer-events: none;
}

.zovo-toast-container[hidden] {
  display: none;
}

.zovo-toast {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--zovo-space-3);
  padding: var(--zovo-space-3);
  background: var(--zovo-bg-primary);
  border: 1px solid var(--zovo-border);
  border-radius: var(--zovo-radius-lg);
  box-shadow: var(--zovo-shadow-lg);
  pointer-events: auto;

  /* Slide-up entrance animation */
  animation: zovo-toast-slide-up 300ms ease-out;
}

@keyframes zovo-toast-slide-up {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Toast is dismissing */
.zovo-toast.dismissing {
  animation: zovo-toast-slide-down 200ms ease-in forwards;
}

@keyframes zovo-toast-slide-down {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(16px);
  }
}

.zovo-toast-content {
  display: flex;
  align-items: center;
  gap: var(--zovo-space-2);
  min-width: 0;
  flex: 1;
}

.zovo-toast-icon {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  border-radius: var(--zovo-radius-md);
  overflow: hidden;
}

.zovo-toast-icon img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.zovo-toast-text {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.zovo-toast-title {
  font-size: var(--zovo-font-size-sm);
  font-weight: var(--zovo-font-weight-semibold);
  color: var(--zovo-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.zovo-toast-tagline {
  font-size: 10px;
  color: var(--zovo-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.zovo-toast-actions {
  display: flex;
  align-items: center;
  gap: var(--zovo-space-2);
  flex-shrink: 0;
}

.zovo-toast-cta {
  white-space: nowrap;
  text-decoration: none;
  font-size: var(--zovo-font-size-xs);
  padding: var(--zovo-space-1) var(--zovo-space-3);
}

.zovo-toast-dismiss {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  color: var(--zovo-text-muted);
  border-radius: var(--zovo-radius-sm);
  cursor: pointer;
  transition: all var(--zovo-transition-fast);
}

.zovo-toast-dismiss:hover {
  background: var(--zovo-bg-tertiary);
  color: var(--zovo-text-primary);
}

/* ==========================================================================
   Toast Dark Mode
   ========================================================================== */

@media (prefers-color-scheme: dark) {
  .zovo-toast {
    background: var(--zovo-bg-secondary);
    border-color: var(--zovo-border);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.4);
  }
}

[data-theme="dark"] .zovo-toast {
  background: var(--zovo-bg-secondary);
  border-color: var(--zovo-border);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.4);
}
```

### 4.4 Toast Controller

```typescript
// toast-controller.ts — Smart contextual recommendation toasts

import { getRecommendations, getExtensionById, type ZovoExtension } from './catalog';
import { buildRefUrl, trackClick } from './ref-tracking';

const CURRENT_EXTENSION_ID = 'cookie-manager';
const AUTO_DISMISS_MS = 8000; // 8 seconds
const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours
const SHOW_PROBABILITY = 0.1; // 10%

// -------------------------------------------------------------------------
// Contextual Mapping: action -> recommended extension slug
// -------------------------------------------------------------------------

interface ContextualTrigger {
  /** The action event name that fires the toast check */
  action: string;
  /** Preferred extension to recommend for this context */
  preferredExtensionId: string;
  /** Fallback: if preferred is installed, pick from general recommendations */
  fallbackToGeneral: boolean;
}

const CONTEXTUAL_TRIGGERS: ContextualTrigger[] = [
  {
    action: 'export_json_success',
    preferredExtensionId: 'json-formatter-pro',
    fallbackToGeneral: true,
  },
  {
    action: 'multi_tab_cookie_manage',
    preferredExtensionId: 'tab-suspender-pro',
    fallbackToGeneral: true,
  },
  {
    action: 'search_heavy_session',
    preferredExtensionId: 'bookmark-search',
    fallbackToGeneral: true,
  },
  {
    action: 'copy_cookie_value',
    preferredExtensionId: 'clipboard-history',
    fallbackToGeneral: true,
  },
  {
    action: 'view_expired_cookie',
    preferredExtensionId: 'timestamp-converter',
    fallbackToGeneral: true,
  },
  {
    action: 'export_curl',
    preferredExtensionId: 'web-scraper-lite',
    fallbackToGeneral: true,
  },
];

// -------------------------------------------------------------------------
// Toast Manager
// -------------------------------------------------------------------------

class RecommendationToast {
  private container: HTMLElement;
  private toast: HTMLElement;
  private iconEl: HTMLElement;
  private titleEl: HTMLElement;
  private taglineEl: HTMLElement;
  private ctaEl: HTMLAnchorElement;
  private dismissEl: HTMLElement;
  private autoDismissTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.container = document.getElementById('toastContainer')!;
    this.toast = document.getElementById('recommendationToast')!;
    this.iconEl = document.getElementById('toastIcon')!;
    this.titleEl = document.getElementById('toastTitle')!;
    this.taglineEl = document.getElementById('toastTagline')!;
    this.ctaEl = document.getElementById('toastCta') as HTMLAnchorElement;
    this.dismissEl = document.getElementById('toastDismiss')!;

    this.dismissEl.addEventListener('click', () => this.dismiss());
    this.ctaEl.addEventListener('click', () => {
      trackClick('toast', 'add_to_chrome');
      this.dismiss();
    });
  }

  /**
   * Called after a user action. Decides whether to show a recommendation toast.
   *
   * @param actionName - The action event name (must match a CONTEXTUAL_TRIGGERS entry)
   */
  async maybeShow(actionName: string): Promise<void> {
    // 1. Check cooldown (max once per 24 hours)
    const { lastRecommendationToast } = await chrome.storage.local.get('lastRecommendationToast');
    if (lastRecommendationToast && Date.now() - lastRecommendationToast < COOLDOWN_MS) {
      return;
    }

    // 2. Probability gate (10%)
    if (Math.random() > SHOW_PROBABILITY) {
      return;
    }

    // 3. Find contextual trigger
    const trigger = CONTEXTUAL_TRIGGERS.find((t) => t.action === actionName);
    if (!trigger) return;

    // 4. Resolve the extension to recommend
    let extension: ZovoExtension | undefined;

    // Try the preferred extension first
    const recommendations = await getRecommendations(CURRENT_EXTENSION_ID, 5);
    extension = recommendations.find((ext) => ext.id === trigger.preferredExtensionId);

    // If preferred is already installed (not in recommendations), fall back
    if (!extension && trigger.fallbackToGeneral) {
      extension = recommendations[0];
    }

    if (!extension) return;

    // 5. Show the toast
    this.show(extension);

    // 6. Record timestamp
    await chrome.storage.local.set({ lastRecommendationToast: Date.now() });
  }

  /**
   * Display the toast with the given extension's info.
   */
  private show(extension: ZovoExtension): void {
    // Populate content
    this.iconEl.innerHTML = `<img src="${extension.iconUrl}" alt="${extension.name}" width="28" height="28" loading="lazy">`;
    this.titleEl.textContent = extension.name;
    this.taglineEl.textContent = extension.tagline;
    this.ctaEl.href = buildRefUrl(extension.storeUrl, 'toast');

    // Show container
    this.container.hidden = false;
    this.toast.classList.remove('dismissing');

    // Track impression
    trackClick('toast', `impression_${extension.id}`);

    // Auto-dismiss after 8 seconds
    this.clearAutoDismiss();
    this.autoDismissTimer = setTimeout(() => this.dismiss(), AUTO_DISMISS_MS);
  }

  /**
   * Dismiss the toast with a slide-down animation.
   */
  private dismiss(): void {
    this.clearAutoDismiss();
    this.toast.classList.add('dismissing');

    // Wait for animation to complete before hiding
    setTimeout(() => {
      this.container.hidden = true;
      this.toast.classList.remove('dismissing');
    }, 200);
  }

  private clearAutoDismiss(): void {
    if (this.autoDismissTimer !== null) {
      clearTimeout(this.autoDismissTimer);
      this.autoDismissTimer = null;
    }
  }
}

export default RecommendationToast;
```

### 4.5 Integration with Cookie Manager Actions

The toast system hooks into existing Cookie Manager event emitters. The following shows where to call `maybeShow()` in the Cookie Manager codebase:

```typescript
// Integration points in Cookie Manager popup logic

import RecommendationToast from './toast-controller';

const toast = new RecommendationToast();

// After successful JSON export
async function handleExportComplete(format: string): Promise<void> {
  // ... existing export logic ...
  if (format === 'json') {
    toast.maybeShow('export_json_success');
  }
}

// After managing cookies on 5+ distinct domains in a single session
function handleCookieManaged(domain: string): void {
  // ... existing cookie management logic ...
  sessionDomains.add(domain);
  if (sessionDomains.size >= 5) {
    toast.maybeShow('multi_tab_cookie_manage');
  }
}

// After 10+ search operations in a session
function handleSearch(query: string): void {
  // ... existing search logic ...
  sessionSearchCount++;
  if (sessionSearchCount >= 10) {
    toast.maybeShow('search_heavy_session');
  }
}

// After copying a cookie value
function handleCopyCookieValue(cookieName: string): void {
  // ... existing copy logic ...
  toast.maybeShow('copy_cookie_value');
}

// After viewing a cookie with expiry in the past
function handleViewExpiredCookie(cookie: chrome.cookies.Cookie): void {
  // ... existing view logic ...
  if (cookie.expirationDate && cookie.expirationDate * 1000 < Date.now()) {
    toast.maybeShow('view_expired_cookie');
  }
}

// After exporting cookies as cURL command
function handleCurlExport(): void {
  // ... existing cURL export logic ...
  toast.maybeShow('export_curl');
}
```

---

## 5. Ref Tracking System

### 5.1 URL Format Specification

Every link from any Zovo extension to `zovo.one` (or to the Chrome Web Store for other Zovo extensions) includes ref-tracking parameters:

```
https://zovo.one?ref=[EXTENSION_ID]&source=[SOURCE]
```

**Parameters:**

| Parameter | Description | Example Values |
|-----------|-------------|----------------|
| `ref` | The slug ID of the extension originating the click | `cookie-manager`, `json-formatter-pro` |
| `source` | The specific UI location where the click occurred | See source table below |

### 5.2 Source Definitions

| Source Key | UI Location | Description |
|------------|-------------|-------------|
| `footer` | Popup footer | "Built by Zovo" link in the popup footer |
| `onboarding` | Onboarding flow | "Join Zovo" CTA on the onboarding completion slide |
| `retention_prompt` | Retention prompt | CTA button in retention prompt banners |
| `settings` | Settings/options page | "You might also like" section or Zovo branding in settings |
| `recommendation` | Cross-promo panel | "Add" button on recommended extension cards in the panel |
| `upgrade` | Paywall/upgrade CTA | "Upgrade" or membership CTA shown at paywall moments |
| `more_panel` | "More from Zovo" panel | Membership CTA or "See all extensions" link in the panel |
| `toast` | Recommendation toast | "Add to Chrome" button in the contextual toast notification |

### 5.3 Ref Tracking Module

```typescript
// ref-tracking.ts — URL generation and click tracking

const ZOVO_BASE_URL = 'https://zovo.one';
const CURRENT_EXTENSION_ID = 'cookie-manager';

// -------------------------------------------------------------------------
// Source Types
// -------------------------------------------------------------------------

export type RefSource =
  | 'footer'
  | 'onboarding'
  | 'retention_prompt'
  | 'settings'
  | 'recommendation'
  | 'upgrade'
  | 'more_panel'
  | 'toast';

// -------------------------------------------------------------------------
// URL Builder
// -------------------------------------------------------------------------

/**
 * Build a ref-tracked URL for any Zovo destination.
 *
 * @param baseUrl - The target URL (e.g., "https://zovo.one" or a CWS store link)
 * @param source - The UI source location
 * @param extensionId - Override the referrer extension ID (defaults to current)
 * @returns URL string with ref and source query parameters appended
 *
 * @example
 * buildRefUrl('https://zovo.one', 'footer')
 * // => "https://zovo.one?ref=cookie-manager&source=footer"
 *
 * buildRefUrl('https://zovo.one/tools', 'more_panel')
 * // => "https://zovo.one/tools?ref=cookie-manager&source=more_panel"
 *
 * buildRefUrl('https://chromewebstore.google.com/detail/xyz', 'recommendation')
 * // => "https://chromewebstore.google.com/detail/xyz?ref=cookie-manager&source=recommendation"
 */
export function buildRefUrl(
  baseUrl: string,
  source: RefSource,
  extensionId: string = CURRENT_EXTENSION_ID,
): string {
  const url = new URL(baseUrl);
  url.searchParams.set('ref', extensionId);
  url.searchParams.set('source', source);
  return url.toString();
}

/**
 * Build a ref-tracked URL to the Zovo homepage.
 */
export function buildZovoUrl(source: RefSource): string {
  return buildRefUrl(ZOVO_BASE_URL, source);
}

/**
 * Build a ref-tracked URL to the Zovo tools catalog.
 */
export function buildToolsUrl(source: RefSource): string {
  return buildRefUrl(`${ZOVO_BASE_URL}/tools`, source);
}

// -------------------------------------------------------------------------
// Click Tracking (Local Storage)
// -------------------------------------------------------------------------

interface ClickEvent {
  /** The ref source location */
  source: RefSource;
  /** A detail label (e.g., "brand_link", "membership_cta", extension slug) */
  label: string;
  /** Timestamp of the click */
  timestamp: number;
  /** Referrer extension ID */
  extensionId: string;
}

const MAX_STORED_CLICKS = 200;

/**
 * Log a click event to local storage. No external network requests.
 *
 * @param source - The UI source where the click occurred
 * @param label - A human-readable label for what was clicked
 */
export async function trackClick(
  source: RefSource | string,
  label: string,
): Promise<void> {
  try {
    const { refClicks = [] }: { refClicks: ClickEvent[] } =
      await chrome.storage.local.get('refClicks');

    refClicks.push({
      source: source as RefSource,
      label,
      timestamp: Date.now(),
      extensionId: CURRENT_EXTENSION_ID,
    });

    // Keep only the most recent clicks to avoid unbounded storage growth
    if (refClicks.length > MAX_STORED_CLICKS) {
      refClicks.splice(0, refClicks.length - MAX_STORED_CLICKS);
    }

    await chrome.storage.local.set({ refClicks });
  } catch {
    // Silently fail — tracking should never break the extension
    console.debug('[Zovo Ref] Failed to track click:', source, label);
  }
}

// -------------------------------------------------------------------------
// Click Analytics (for internal dashboards or Zovo backend sync)
// -------------------------------------------------------------------------

interface ClickSummary {
  source: string;
  count: number;
  lastClick: number;
}

/**
 * Get a summary of all tracked clicks, grouped by source.
 * Useful for displaying in settings or syncing to the Zovo backend.
 */
export async function getClickSummary(): Promise<ClickSummary[]> {
  const { refClicks = [] }: { refClicks: ClickEvent[] } =
    await chrome.storage.local.get('refClicks');

  const sourceMap = new Map<string, { count: number; lastClick: number }>();

  for (const click of refClicks) {
    const existing = sourceMap.get(click.source);
    if (existing) {
      existing.count++;
      existing.lastClick = Math.max(existing.lastClick, click.timestamp);
    } else {
      sourceMap.set(click.source, { count: 1, lastClick: click.timestamp });
    }
  }

  return Array.from(sourceMap.entries())
    .map(([source, data]) => ({ source, ...data }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Clear all stored click data. Used for testing or user data reset.
 */
export async function clearClickData(): Promise<void> {
  await chrome.storage.local.remove('refClicks');
}
```

### 5.4 Applying Ref Tracking Across All UI Touchpoints

The following table documents every link in the Cookie Manager extension that points to `zovo.one` or to a Zovo extension's CWS page, along with the correct ref tracking URL:

| UI Location | Link Text | Target URL |
|-------------|-----------|------------|
| Popup footer | "Built by Zovo" | `https://zovo.one?ref=cookie-manager&source=footer` |
| Popup footer | "More tools" | Opens the panel (no URL; panel open is tracked) |
| Panel membership CTA | "Join Zovo — Save 84%" | `https://zovo.one?ref=cookie-manager&source=more_panel` |
| Panel extension card | "Add" | `{storeUrl}?ref=cookie-manager&source=recommendation` |
| Panel catalog link | "See all 16 extensions" | `https://zovo.one/tools?ref=cookie-manager&source=more_panel` |
| Onboarding slide 4 | "Join Zovo — Get All Extensions" | `https://zovo.one?ref=cookie-manager&source=onboarding` |
| Retention prompt | CTA button | `https://zovo.one?ref=cookie-manager&source=retention_prompt` |
| Paywall modal | "Upgrade" / membership CTA | `https://zovo.one?ref=cookie-manager&source=upgrade` |
| Settings page | "You might also like" card CTAs | `{storeUrl}?ref=cookie-manager&source=settings` |
| Settings page | "Part of Zovo" link | `https://zovo.one?ref=cookie-manager&source=settings` |
| Recommendation toast | "Add to Chrome" | `{storeUrl}?ref=cookie-manager&source=toast` |

---

## 6. "You Might Also Like" in Settings

### 6.1 Settings Page Integration

A dedicated section in the Cookie Manager options/settings page showing 3 recommended extensions. This section appears near the bottom of the settings page, below the core settings but above the footer.

#### Settings Section HTML

```html
<!-- "You Might Also Like" section — add to options.html settings page -->
<section class="zovo-settings-section zovo-settings-recommendations" id="settingsRecommendations">
  <div class="zovo-settings-section-header">
    <h3 class="zovo-settings-section-title">You might also like</h3>
    <span class="zovo-settings-section-subtitle">More tools from Zovo</span>
  </div>
  <div class="zovo-settings-rec-grid" id="settingsRecGrid">
    <!-- Populated by JS — 3 recommendation cards -->
  </div>
  <div class="zovo-settings-rec-footer">
    <a href="https://zovo.one/tools?ref=cookie-manager&source=settings"
       target="_blank"
       class="zovo-settings-see-all"
       id="settingsSeeAll">
      Browse all Zovo extensions
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M5 3l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </a>
  </div>
</section>
```

#### Recommendation Card Template (injected by JS)

```html
<!-- Template for each settings recommendation card -->
<div class="zovo-settings-rec-card" data-extension-id="{id}">
  <div class="zovo-settings-rec-card-header">
    <img class="zovo-settings-rec-icon"
         src="{iconUrl}"
         alt="{name}"
         width="40"
         height="40"
         loading="lazy">
    <div class="zovo-settings-rec-meta">
      <span class="zovo-settings-rec-name">{name}</span>
      <span class="zovo-settings-rec-category">{category}</span>
    </div>
  </div>
  <p class="zovo-settings-rec-tagline">{tagline}</p>
  <a href="{storeUrlWithRef}"
     target="_blank"
     class="zovo-btn zovo-btn-primary zovo-btn-sm zovo-btn-block zovo-settings-rec-cta">
    Add to Chrome
  </a>
</div>
```

### 6.2 Settings Recommendations CSS

```css
/* ==========================================================================
   "You Might Also Like" — Settings Page Section
   ========================================================================== */

.zovo-settings-recommendations {
  margin-top: var(--zovo-space-8);
  padding-top: var(--zovo-space-6);
  border-top: 1px solid var(--zovo-border);
}

.zovo-settings-section-header {
  display: flex;
  align-items: baseline;
  gap: var(--zovo-space-2);
  margin-bottom: var(--zovo-space-4);
}

.zovo-settings-section-title {
  font-size: var(--zovo-font-size-md);
  font-weight: var(--zovo-font-weight-semibold);
  color: var(--zovo-text-primary);
}

.zovo-settings-section-subtitle {
  font-size: var(--zovo-font-size-xs);
  color: var(--zovo-text-muted);
}

/* Card grid: 3 cards in a row on desktop, stacked on narrow */
.zovo-settings-rec-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--zovo-space-3);
}

@media (max-width: 680px) {
  .zovo-settings-rec-grid {
    grid-template-columns: 1fr;
  }
}

/* Individual recommendation card */
.zovo-settings-rec-card {
  display: flex;
  flex-direction: column;
  gap: var(--zovo-space-3);
  padding: var(--zovo-space-4);
  background: var(--zovo-bg-secondary);
  border: 1px solid var(--zovo-border);
  border-radius: var(--zovo-radius-lg);
  transition: border-color var(--zovo-transition-fast), box-shadow var(--zovo-transition-fast);
}

.zovo-settings-rec-card:hover {
  border-color: var(--zovo-primary);
  box-shadow: var(--zovo-shadow-sm);
}

.zovo-settings-rec-card-header {
  display: flex;
  align-items: center;
  gap: var(--zovo-space-3);
}

.zovo-settings-rec-icon {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: var(--zovo-radius-lg);
  object-fit: cover;
}

.zovo-settings-rec-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.zovo-settings-rec-name {
  font-size: var(--zovo-font-size-sm);
  font-weight: var(--zovo-font-weight-semibold);
  color: var(--zovo-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.zovo-settings-rec-category {
  font-size: 10px;
  font-weight: var(--zovo-font-weight-medium);
  color: var(--zovo-text-muted);
  text-transform: capitalize;
}

.zovo-settings-rec-tagline {
  font-size: var(--zovo-font-size-sm);
  color: var(--zovo-text-secondary);
  line-height: var(--zovo-line-height-normal);
  flex: 1;
}

.zovo-settings-rec-cta {
  margin-top: auto;
  text-decoration: none;
}

/* Footer: "Browse all" link */
.zovo-settings-rec-footer {
  margin-top: var(--zovo-space-3);
  text-align: center;
}

.zovo-settings-see-all {
  display: inline-flex;
  align-items: center;
  gap: var(--zovo-space-1);
  font-size: var(--zovo-font-size-sm);
  font-weight: var(--zovo-font-weight-medium);
  color: var(--zovo-primary);
  text-decoration: none;
  transition: color var(--zovo-transition-fast);
}

.zovo-settings-see-all:hover {
  color: var(--zovo-primary-hover);
}

/* ==========================================================================
   Settings Recommendations — Dark Mode
   ========================================================================== */

@media (prefers-color-scheme: dark) {
  .zovo-settings-rec-card {
    background: var(--zovo-bg-tertiary);
  }
}

[data-theme="dark"] .zovo-settings-rec-card {
  background: var(--zovo-bg-tertiary);
}
```

### 6.3 Settings Recommendations Controller

```typescript
// settings-recommendations.ts — "You might also like" for the settings page

import { getRecommendations, type ZovoExtension } from './catalog';
import { buildRefUrl, trackClick } from './ref-tracking';

const CURRENT_EXTENSION_ID = 'cookie-manager';
const MAX_SETTINGS_RECOMMENDATIONS = 3;

class SettingsRecommendations {
  private grid: HTMLElement;
  private section: HTMLElement;
  private seeAllLink: HTMLElement;

  constructor() {
    this.section = document.getElementById('settingsRecommendations')!;
    this.grid = document.getElementById('settingsRecGrid')!;
    this.seeAllLink = document.getElementById('settingsSeeAll')!;

    this.init();
  }

  private async init(): Promise<void> {
    const recommendations = await getRecommendations(
      CURRENT_EXTENSION_ID,
      MAX_SETTINGS_RECOMMENDATIONS,
    );

    if (recommendations.length === 0) {
      // Hide the entire section if no recommendations available
      this.section.hidden = true;
      return;
    }

    this.renderCards(recommendations);
    this.bindEvents();
  }

  private renderCards(extensions: ZovoExtension[]): void {
    this.grid.innerHTML = '';

    extensions.forEach((ext) => {
      const card = document.createElement('div');
      card.className = 'zovo-settings-rec-card';
      card.dataset.extensionId = ext.id;

      const storeUrlWithRef = buildRefUrl(ext.storeUrl, 'settings');

      card.innerHTML = `
        <div class="zovo-settings-rec-card-header">
          <img class="zovo-settings-rec-icon"
               src="${ext.iconUrl}"
               alt="${ext.name}"
               width="40"
               height="40"
               loading="lazy">
          <div class="zovo-settings-rec-meta">
            <span class="zovo-settings-rec-name">${ext.name}</span>
            <span class="zovo-settings-rec-category">${ext.category}</span>
          </div>
        </div>
        <p class="zovo-settings-rec-tagline">${ext.tagline}</p>
        <a href="${storeUrlWithRef}"
           target="_blank"
           class="zovo-btn zovo-btn-primary zovo-btn-sm zovo-btn-block zovo-settings-rec-cta">
          Add to Chrome
        </a>
      `;

      // Track CTA clicks
      const cta = card.querySelector('.zovo-settings-rec-cta');
      cta?.addEventListener('click', () => {
        trackClick('settings', ext.id);
      });

      this.grid.appendChild(card);
    });
  }

  private bindEvents(): void {
    this.seeAllLink.addEventListener('click', () => {
      trackClick('settings', 'see_all');
    });
  }
}

export default SettingsRecommendations;
```

---

## 7. Initialization and Integration

### 7.1 Main Entry Point

All cross-promotion modules are initialized from a single entry point that runs when the popup loads:

```typescript
// cross-promotion.ts — Main initialization module

import MoreFromZovoPanel from './panel-controller';
import FooterBranding from './footer-controller';
import RecommendationToast from './toast-controller';

/**
 * Initialize all cross-promotion systems for the popup.
 * Call this once in the popup's main initialization flow.
 */
export function initCrossPromotion(): {
  panel: MoreFromZovoPanel;
  footer: FooterBranding;
  toast: RecommendationToast;
} {
  const panel = new MoreFromZovoPanel();
  const footer = new FooterBranding(panel);
  const toast = new RecommendationToast();

  return { panel, footer, toast };
}

// Settings page has its own init (imported separately in options.ts)
export { default as SettingsRecommendations } from './settings-recommendations';
```

### 7.2 Usage in Popup

```typescript
// In popup/main.ts or popup/index.ts

import { initCrossPromotion } from '../cross-promotion/cross-promotion';

document.addEventListener('DOMContentLoaded', () => {
  // ... other popup initialization ...

  // Initialize cross-promotion (panel, footer, toast)
  const { toast } = initCrossPromotion();

  // Pass toast to action handlers for contextual recommendations
  // Example: after JSON export
  exportButton.addEventListener('click', async () => {
    await performExport('json');
    toast.maybeShow('export_json_success');
  });
});
```

### 7.3 Usage in Settings

```typescript
// In options/main.ts or options/index.ts

import { SettingsRecommendations } from '../cross-promotion/cross-promotion';

document.addEventListener('DOMContentLoaded', () => {
  // ... other settings initialization ...

  // Initialize "You might also like" section
  new SettingsRecommendations();
});
```

### 7.4 Manifest Permissions

The cross-promotion system optionally uses the `management` permission to detect installed Zovo extensions. This permission is optional — the system degrades gracefully without it.

```json
{
  "optional_permissions": ["management"],
  "permissions": ["storage"]
}
```

If `management` is not granted, all 15 other extensions will be shown as potential recommendations (excluding self). The panel and settings section will still function correctly, just without the "already installed" filtering.

---

## 8. File Structure

```
src/
├── cross-promotion/
│   ├── catalog.ts                    # Full 16-extension catalog data
│   ├── recommendations.ts           # Smart recommendation engine
│   ├── ref-tracking.ts              # URL builder + click tracking
│   ├── panel-controller.ts          # "More from Zovo" slide-out panel
│   ├── footer-controller.ts         # Enhanced footer branding
│   ├── toast-controller.ts          # Contextual recommendation toasts
│   ├── settings-recommendations.ts  # Settings page "You might also like"
│   ├── cross-promotion.ts           # Main init entry point
│   └── styles/
│       ├── panel.css                # Panel styles (light + dark)
│       ├── footer.css               # Footer styles (light + dark)
│       ├── toast.css                # Toast styles (light + dark)
│       └── settings-rec.css         # Settings recommendations styles
└── popup/
    └── popup.html                    # Includes panel + toast + footer HTML
```

---

## 9. Design Principles

| Principle | Implementation |
|-----------|---------------|
| **Non-intrusive** | Panel requires explicit trigger (click); toast appears at 10% probability max once/day; footer is subtle 36px bar |
| **Relevant** | Recommendations are contextual (action-based toasts) and personalized (installed-extension filtering) |
| **Graceful degradation** | No `management` permission? Shows all extensions. No recommendations? Hides the section. Network down? Static defaults remain |
| **Privacy-first** | All click tracking is local-only (`chrome.storage.local`). No external analytics calls. No PII collected |
| **Consistent branding** | Uses Zovo design system variables (`--zovo-*`), matches Agent 2 global styles, supports dark mode throughout |
| **Conversion-focused** | Membership CTA always visible at top of panel; ref tracking on every link enables attribution analysis |
| **Rotation for freshness** | Day-of-year factor in scoring prevents showing the same 3 extensions indefinitely |
