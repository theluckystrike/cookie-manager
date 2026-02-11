# Agent 3: Onboarding System

**Extension:** Zovo Cookie Manager
**Role:** First-run experience designer and implementation specialist
**Dependencies:** Agent 2 shared styles (`zovo-brand.css`), Phase 02 spec (Section 4 UI), Phase 04 Agent 1 (first-run experience spec), Phase 04 Agent 5 (monetization first-run constraints)
**Target:** Complete onboarding flow that builds trust in under 30 seconds, introduces core features, and establishes Zovo brand awareness without any paywall exposure

---

## 1. Onboarding Flow Design

### 1.1 Trigger Conditions

**First Install:**

The onboarding flow fires from the `chrome.runtime.onInstalled` listener when `details.reason === 'install'`. Before opening the onboarding tab, the service worker checks `chrome.storage.local` for the `onboardingComplete` flag. If the flag is already `true` (which can happen if a user reinstalls the extension on the same Chrome profile), onboarding is not shown again.

**Major Version Update:**

On `details.reason === 'update'`, the service worker compares the major version number of `details.previousVersion` against the current version from `chrome.runtime.getManifest().version`. If the major version has incremented (e.g., `1.x.x` to `2.x.x`), the "What's New" page opens instead of the full onboarding. Minor and patch updates are silent.

**Never Re-Show:**

If `onboardingComplete` is `true` in `chrome.storage.local`, onboarding never renders again. Both the "Get Started" CTA and the "Skip tour" link set this flag. There is no mechanism to reset this flag from the UI. The onboarding tab is opened exactly once per install per profile.

### 1.2 Flow Structure (4 Slides)

The onboarding is a 4-slide horizontal carousel rendered in a new tab at `600px` width. Each slide occupies the full viewport of the tab content area. The user navigates via Next/Back buttons, dot indicators, or arrow keys. A progress bar at the top shows completion percentage. The "Skip tour" link is visible on every slide.

**Slide 1: Welcome**

- Cookie Manager icon at 128px, centered
- Headline: "Welcome to Cookie Manager"
- Subtitle: "Part of the Zovo extension family"
- Description: "See, edit, and control every cookie in your browser -- the modern replacement for EditThisCookie."
- Trust badges row: "No tracking" / "No data collection" / "Open source" -- each with a green checkmark icon
- Primary CTA: "Get Started" (advances to slide 2)
- Skip link: "Skip tour" (visible in top-right, completes onboarding immediately)

**Slide 2: Key Feature -- Cookie Management**

- Inline SVG illustration of a cookie list UI (stylized, not a screenshot -- avoids version-lock)
- Headline: "All Your Cookies, One Click Away"
- Description: "View, edit, create, and delete cookies for any site. Search and filter by name, domain, or type."
- Highlight callout box: "Works on the current tab -- click the icon to see cookies instantly"

**Slide 3: Key Feature -- Profiles and Rules**

- Inline SVG illustration showing a profile card and a rule card side by side
- Headline: "Save Cookie Profiles & Auto-Cleanup"
- Description: "Save entire cookie sets as profiles for dev, staging, and production. Set auto-delete rules to clean up tracking cookies automatically."
- Subtle tier note (muted text, 11px): "Free: 2 profiles, 1 rule | Pro: Unlimited"

**Slide 4: Get Started**

- Large green checkmark icon (SVG, 64px)
- Headline: "You're all set!"
- Description: "Click the Cookie Manager icon in your toolbar to get started."
- Primary CTA: "Start Using Cookie Manager" (completes onboarding, closes tab)
- Secondary CTA: "Explore Zovo -- Get All Extensions" (opens `https://zovo.app?ref=cookie-manager&source=onboarding` in a new tab, then completes onboarding)
- Keyboard shortcut hint (muted text): "Tip: Press Ctrl+Shift+K to open Cookie Manager anytime"

### 1.3 Skip Behavior

- The "Skip tour" text link is fixed in the top-right corner on every slide
- Clicking "Skip tour" immediately sets `onboardingComplete: true` and `onboardingCompletedAt: Date.now()` in `chrome.storage.local`
- Skipping fires the `onboarding_skipped` analytics event with the current slide number
- Skipping closes the onboarding tab
- Skipping does not penalize the user -- no feature gating, no reduced functionality, no "you missed the tour" banner
- The user who skips gets the identical experience to the user who completed all slides

### 1.4 Timing Constraint

The entire flow is designed to complete in under 30 seconds. Each slide contains fewer than 40 words of body copy. No video, no animation that requires waiting, no multi-step interactions within a slide. A user who clicks "Next" four times and then "Start Using Cookie Manager" completes onboarding in approximately 12 seconds.

---

## 2. Complete Onboarding HTML

File: `src/onboarding/onboarding.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=600">
  <title>Welcome to Cookie Manager</title>
  <link rel="stylesheet" href="../shared/zovo-brand.css">
  <link rel="stylesheet" href="onboarding.css">
</head>
<body>
  <div class="onboarding" role="main">

    <!-- Progress Bar -->
    <div class="onboarding-progress" role="progressbar" aria-valuenow="25" aria-valuemin="0" aria-valuemax="100">
      <div class="onboarding-progress-bar" id="progressBar"></div>
    </div>

    <!-- Skip Button -->
    <button class="onboarding-skip" id="skipBtn" type="button" aria-label="Skip onboarding tour">
      Skip tour
    </button>

    <!-- Slides Container -->
    <div class="onboarding-slides" id="slidesContainer">

      <!-- Slide 1: Welcome -->
      <div class="onboarding-slide active" data-slide="1" role="tabpanel" aria-label="Welcome">
        <div class="onboarding-slide-content">
          <div class="onboarding-icon">
            <img src="../assets/icons/icon-128.png" alt="Cookie Manager" width="128" height="128">
          </div>
          <h1 class="onboarding-headline">Welcome to Cookie Manager</h1>
          <p class="onboarding-subtitle">Part of the Zovo extension family</p>
          <p class="onboarding-description">
            See, edit, and control every cookie in your browser &mdash; the modern replacement for EditThisCookie.
          </p>
          <div class="onboarding-trust-badges">
            <span class="trust-badge">
              <svg class="trust-icon" width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <circle cx="7" cy="7" r="7" fill="#10b981"/>
                <path d="M4 7l2 2 4-4" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              No tracking
            </span>
            <span class="trust-badge">
              <svg class="trust-icon" width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <circle cx="7" cy="7" r="7" fill="#10b981"/>
                <path d="M4 7l2 2 4-4" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              No data collection
            </span>
            <span class="trust-badge">
              <svg class="trust-icon" width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <circle cx="7" cy="7" r="7" fill="#10b981"/>
                <path d="M4 7l2 2 4-4" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              Open source
            </span>
          </div>
        </div>
      </div>

      <!-- Slide 2: Cookie Management -->
      <div class="onboarding-slide" data-slide="2" role="tabpanel" aria-label="Cookie Management">
        <div class="onboarding-slide-content">
          <div class="onboarding-feature-illustration">
            <svg width="280" height="160" viewBox="0 0 280 160" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <!-- Stylized cookie list UI illustration -->
              <rect x="0" y="0" width="280" height="160" rx="8" fill="var(--zovo-bg-secondary)"/>
              <!-- Search bar -->
              <rect x="16" y="12" width="248" height="28" rx="6" fill="var(--zovo-bg-primary)" stroke="var(--zovo-border)" stroke-width="1"/>
              <circle cx="30" cy="26" r="6" stroke="var(--zovo-text-muted)" stroke-width="1.5" fill="none"/>
              <line x1="34.5" y1="30.5" x2="37" y2="33" stroke="var(--zovo-text-muted)" stroke-width="1.5" stroke-linecap="round"/>
              <text x="44" y="30" font-size="10" fill="var(--zovo-text-muted)" font-family="Inter, sans-serif">Search cookies...</text>
              <!-- Cookie row 1 -->
              <rect x="16" y="48" width="248" height="32" rx="4" fill="var(--zovo-bg-primary)" stroke="var(--zovo-border)" stroke-width="1"/>
              <circle cx="32" cy="64" r="5" fill="#6366f1" opacity="0.2"/>
              <circle cx="32" cy="64" r="3" fill="#6366f1"/>
              <text x="44" y="68" font-size="11" fill="var(--zovo-text-primary)" font-family="Inter, sans-serif" font-weight="500">session_id</text>
              <text x="140" y="68" font-size="10" fill="var(--zovo-text-muted)" font-family="Inter, sans-serif">example.com</text>
              <!-- Cookie row 2 -->
              <rect x="16" y="84" width="248" height="32" rx="4" fill="var(--zovo-bg-primary)" stroke="var(--zovo-border)" stroke-width="1"/>
              <circle cx="32" cy="100" r="5" fill="#f59e0b" opacity="0.2"/>
              <circle cx="32" cy="100" r="3" fill="#f59e0b"/>
              <text x="44" y="104" font-size="11" fill="var(--zovo-text-primary)" font-family="Inter, sans-serif" font-weight="500">_ga</text>
              <text x="140" y="104" font-size="10" fill="var(--zovo-text-muted)" font-family="Inter, sans-serif">.google.com</text>
              <!-- Cookie row 3 -->
              <rect x="16" y="120" width="248" height="32" rx="4" fill="var(--zovo-bg-primary)" stroke="var(--zovo-border)" stroke-width="1"/>
              <circle cx="32" cy="136" r="5" fill="#10b981" opacity="0.2"/>
              <circle cx="32" cy="136" r="3" fill="#10b981"/>
              <text x="44" y="140" font-size="11" fill="var(--zovo-text-primary)" font-family="Inter, sans-serif" font-weight="500">csrf_token</text>
              <text x="140" y="140" font-size="10" fill="var(--zovo-text-muted)" font-family="Inter, sans-serif">example.com</text>
            </svg>
          </div>
          <h2 class="onboarding-headline">All Your Cookies, One Click Away</h2>
          <p class="onboarding-description">
            View, edit, create, and delete cookies for any site. Search and filter by name, domain, or type.
          </p>
          <div class="onboarding-highlight">
            <svg class="highlight-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M8 1v14M1 8h14" stroke="var(--zovo-primary)" stroke-width="2" stroke-linecap="round"/>
            </svg>
            Works on the current tab &mdash; click the icon to see cookies instantly
          </div>
        </div>
      </div>

      <!-- Slide 3: Profiles & Rules -->
      <div class="onboarding-slide" data-slide="3" role="tabpanel" aria-label="Profiles and Rules">
        <div class="onboarding-slide-content">
          <div class="onboarding-feature-illustration">
            <svg width="280" height="160" viewBox="0 0 280 160" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <!-- Profile card -->
              <rect x="8" y="8" width="126" height="144" rx="8" fill="var(--zovo-bg-primary)" stroke="var(--zovo-border)" stroke-width="1"/>
              <text x="20" y="30" font-size="10" fill="var(--zovo-text-muted)" font-family="Inter, sans-serif" font-weight="500" text-transform="uppercase" letter-spacing="0.5">PROFILES</text>
              <!-- Profile item 1 -->
              <rect x="16" y="40" width="110" height="28" rx="4" fill="var(--zovo-primary)" fill-opacity="0.08"/>
              <circle cx="30" cy="54" r="4" fill="var(--zovo-primary)"/>
              <text x="40" y="58" font-size="10" fill="var(--zovo-text-primary)" font-family="Inter, sans-serif" font-weight="500">Production</text>
              <!-- Profile item 2 -->
              <rect x="16" y="74" width="110" height="28" rx="4" fill="var(--zovo-bg-tertiary)"/>
              <circle cx="30" cy="88" r="4" fill="#f59e0b"/>
              <text x="40" y="92" font-size="10" fill="var(--zovo-text-primary)" font-family="Inter, sans-serif" font-weight="500">Staging</text>
              <!-- Profile item 3 -->
              <rect x="16" y="108" width="110" height="28" rx="4" fill="var(--zovo-bg-tertiary)"/>
              <circle cx="30" cy="122" r="4" fill="#10b981"/>
              <text x="40" y="126" font-size="10" fill="var(--zovo-text-primary)" font-family="Inter, sans-serif" font-weight="500">Dev Local</text>

              <!-- Rule card -->
              <rect x="146" y="8" width="126" height="144" rx="8" fill="var(--zovo-bg-primary)" stroke="var(--zovo-border)" stroke-width="1"/>
              <text x="158" y="30" font-size="10" fill="var(--zovo-text-muted)" font-family="Inter, sans-serif" font-weight="500" text-transform="uppercase" letter-spacing="0.5">RULES</text>
              <!-- Rule item -->
              <rect x="154" y="40" width="110" height="52" rx="4" fill="var(--zovo-bg-tertiary)"/>
              <text x="162" y="56" font-size="10" fill="var(--zovo-text-primary)" font-family="Inter, sans-serif" font-weight="500">Auto-delete</text>
              <text x="162" y="70" font-size="9" fill="var(--zovo-text-muted)" font-family="Inter, sans-serif">*tracking* cookies</text>
              <text x="162" y="84" font-size="9" fill="#10b981" font-family="Inter, sans-serif">Active</text>
              <!-- Toggle -->
              <rect x="154" y="100" width="110" height="36" rx="4" fill="var(--zovo-bg-tertiary)"/>
              <text x="162" y="116" font-size="10" fill="var(--zovo-text-primary)" font-family="Inter, sans-serif" font-weight="500">On tab close</text>
              <rect x="236" y="108" width="20" height="12" rx="6" fill="var(--zovo-primary)"/>
              <circle cx="250" cy="114" r="4" fill="#fff"/>
            </svg>
          </div>
          <h2 class="onboarding-headline">Save Cookie Profiles & Auto-Cleanup</h2>
          <p class="onboarding-description">
            Save entire cookie sets as profiles for dev, staging, and production. Set auto-delete rules to clean up tracking cookies automatically.
          </p>
          <p class="onboarding-tier-note">
            Free: 2 profiles, 1 rule &bull; Pro: Unlimited
          </p>
        </div>
      </div>

      <!-- Slide 4: Get Started -->
      <div class="onboarding-slide" data-slide="4" role="tabpanel" aria-label="Get Started">
        <div class="onboarding-slide-content">
          <div class="onboarding-icon">
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden="true">
              <circle cx="32" cy="32" r="32" fill="#10b981" opacity="0.12"/>
              <circle cx="32" cy="32" r="24" fill="#10b981" opacity="0.2"/>
              <path d="M22 32l7 7 13-13" stroke="#10b981" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <h2 class="onboarding-headline">You're all set!</h2>
          <p class="onboarding-description">
            Click the Cookie Manager icon in your toolbar to get started.
          </p>
          <div class="onboarding-cta-group">
            <button class="zovo-btn zovo-btn-primary zovo-btn-lg zovo-btn-block" id="startBtn" type="button">
              Start Using Cookie Manager
            </button>
            <a href="https://zovo.app?ref=cookie-manager&source=onboarding"
               target="_blank"
               rel="noopener"
               class="zovo-btn zovo-btn-secondary zovo-btn-lg zovo-btn-block"
               id="zovoBtn">
              Explore Zovo &mdash; Get All Extensions
            </a>
          </div>
          <p class="onboarding-shortcut-hint">
            Tip: Press <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>K</kbd> to open Cookie Manager anytime
          </p>
        </div>
      </div>

    </div>

    <!-- Bottom Navigation -->
    <div class="onboarding-nav">
      <button class="zovo-btn zovo-btn-ghost" id="prevBtn" type="button" disabled aria-label="Previous slide">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M10 4l-4 4 4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Back
      </button>
      <div class="onboarding-dots" role="tablist" aria-label="Onboarding slides">
        <button class="dot active" data-dot="1" role="tab" aria-selected="true" aria-label="Slide 1" type="button"></button>
        <button class="dot" data-dot="2" role="tab" aria-selected="false" aria-label="Slide 2" type="button"></button>
        <button class="dot" data-dot="3" role="tab" aria-selected="false" aria-label="Slide 3" type="button"></button>
        <button class="dot" data-dot="4" role="tab" aria-selected="false" aria-label="Slide 4" type="button"></button>
      </div>
      <button class="zovo-btn zovo-btn-primary" id="nextBtn" type="button" aria-label="Next slide">
        Next
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M6 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>

  </div>

  <script src="onboarding.js"></script>
</body>
</html>
```

---

## 3. Complete Onboarding JavaScript

File: `src/onboarding/onboarding.js`

```javascript
/**
 * ZovoOnboarding — Cookie Manager first-run onboarding experience.
 *
 * Manages a 4-slide horizontal carousel with progress tracking,
 * keyboard navigation, dot navigation, and local-only analytics.
 * No external network requests are made from this module.
 */

'use strict';

class ZovoOnboarding {
  /** @type {number} */
  #currentSlide;

  /** @type {number} */
  #totalSlides;

  /** @type {NodeListOf<HTMLElement>} */
  #slides;

  /** @type {NodeListOf<HTMLElement>} */
  #dots;

  /** @type {HTMLElement} */
  #progressBar;

  /** @type {HTMLButtonElement} */
  #prevBtn;

  /** @type {HTMLButtonElement} */
  #nextBtn;

  /** @type {HTMLButtonElement} */
  #startBtn;

  /** @type {HTMLButtonElement} */
  #skipBtn;

  /** @type {HTMLAnchorElement} */
  #zovoBtn;

  /** @type {HTMLElement} */
  #slidesContainer;

  /** @type {boolean} */
  #isTransitioning;

  constructor() {
    this.#currentSlide = 1;
    this.#totalSlides = 4;
    this.#isTransitioning = false;
    this.#init();
  }

  #init() {
    // Cache DOM references
    this.#slides = document.querySelectorAll('.onboarding-slide');
    this.#dots = document.querySelectorAll('.dot');
    this.#progressBar = document.getElementById('progressBar');
    this.#prevBtn = document.getElementById('prevBtn');
    this.#nextBtn = document.getElementById('nextBtn');
    this.#startBtn = document.getElementById('startBtn');
    this.#skipBtn = document.getElementById('skipBtn');
    this.#zovoBtn = document.getElementById('zovoBtn');
    this.#slidesContainer = document.getElementById('slidesContainer');

    // Bind navigation buttons
    this.#prevBtn.addEventListener('click', () => this.#prev());
    this.#nextBtn.addEventListener('click', () => this.#next());
    this.#startBtn.addEventListener('click', () => this.#complete());
    this.#skipBtn.addEventListener('click', () => this.#skip());

    // Bind Zovo CTA
    this.#zovoBtn.addEventListener('click', () => {
      this.#trackEvent('onboarding_zovo_clicked', { slide: this.#currentSlide });
      // Let the link open naturally (target="_blank"), then complete onboarding
      setTimeout(() => this.#complete(), 300);
    });

    // Bind dot navigation
    this.#dots.forEach((dot) => {
      dot.addEventListener('click', () => {
        const target = parseInt(dot.getAttribute('data-dot'), 10);
        if (target && target !== this.#currentSlide) {
          this.#goTo(target);
        }
      });
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => this.#handleKeydown(e));

    // Detect macOS for shortcut hint
    this.#updateShortcutHint();

    // Initial UI state
    this.#updateUI();

    // Track onboarding started
    this.#trackEvent('onboarding_started');
    this.#trackEvent('onboarding_slide_viewed', { slide: 1 });
  }

  /**
   * Navigate to a specific slide by number.
   * @param {number} slideNum - 1-indexed slide number
   */
  #goTo(slideNum) {
    if (slideNum < 1 || slideNum > this.#totalSlides) return;
    if (slideNum === this.#currentSlide) return;
    if (this.#isTransitioning) return;

    this.#isTransitioning = true;
    this.#currentSlide = slideNum;
    this.#updateUI();
    this.#trackEvent('onboarding_slide_viewed', { slide: slideNum });

    // Allow transition to complete before accepting new navigation
    setTimeout(() => {
      this.#isTransitioning = false;
    }, 350);
  }

  /** Advance to the next slide. */
  #next() {
    if (this.#currentSlide < this.#totalSlides) {
      this.#goTo(this.#currentSlide + 1);
    }
  }

  /** Go back to the previous slide. */
  #prev() {
    if (this.#currentSlide > 1) {
      this.#goTo(this.#currentSlide - 1);
    }
  }

  /** Update all visual elements to reflect the current slide. */
  #updateUI() {
    // Update slide visibility via transform
    const offset = (this.#currentSlide - 1) * -100;
    this.#slidesContainer.style.transform = `translateX(${offset}%)`;

    // Update active slide ARIA
    this.#slides.forEach((slide, i) => {
      const isActive = i + 1 === this.#currentSlide;
      slide.classList.toggle('active', isActive);
      slide.setAttribute('aria-hidden', String(!isActive));
    });

    // Update dot indicators
    this.#dots.forEach((dot, i) => {
      const isActive = i + 1 === this.#currentSlide;
      dot.classList.toggle('active', isActive);
      dot.setAttribute('aria-selected', String(isActive));
    });

    // Update progress bar
    const progress = (this.#currentSlide / this.#totalSlides) * 100;
    this.#progressBar.style.width = `${progress}%`;

    const progressContainer = this.#progressBar.parentElement;
    if (progressContainer) {
      progressContainer.setAttribute('aria-valuenow', String(progress));
    }

    // Update navigation button states
    this.#prevBtn.disabled = this.#currentSlide === 1;
    this.#prevBtn.style.visibility = this.#currentSlide === 1 ? 'hidden' : 'visible';

    if (this.#currentSlide === this.#totalSlides) {
      this.#nextBtn.style.display = 'none';
    } else {
      this.#nextBtn.style.display = 'inline-flex';
    }
  }

  /**
   * Handle keyboard events for navigation.
   * @param {KeyboardEvent} e
   */
  #handleKeydown(e) {
    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault();
        this.#next();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        this.#prev();
        break;
      case 'Enter':
        e.preventDefault();
        if (this.#currentSlide === this.#totalSlides) {
          this.#complete();
        } else {
          this.#next();
        }
        break;
      case 'Escape':
        e.preventDefault();
        this.#skip();
        break;
      default:
        break;
    }
  }

  /**
   * Detect macOS and update the keyboard shortcut hint.
   * macOS uses Cmd instead of Ctrl.
   */
  #updateShortcutHint() {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    if (isMac) {
      const hintEl = document.querySelector('.onboarding-shortcut-hint');
      if (hintEl) {
        hintEl.innerHTML =
          'Tip: Press <kbd>Cmd</kbd>+<kbd>Shift</kbd>+<kbd>K</kbd> to open Cookie Manager anytime';
      }
    }
  }

  /**
   * Complete onboarding: set flags, track event, close tab.
   */
  async #complete() {
    await chrome.storage.local.set({
      onboardingComplete: true,
      onboardingCompletedAt: Date.now(),
    });

    await this.#trackEvent('onboarding_completed', {
      slide: this.#currentSlide,
    });

    // Close the onboarding tab
    const tab = await chrome.tabs.getCurrent();
    if (tab && tab.id) {
      chrome.tabs.remove(tab.id);
    }
  }

  /**
   * Skip onboarding: same as complete, but tracks differently.
   */
  async #skip() {
    await chrome.storage.local.set({
      onboardingComplete: true,
      onboardingCompletedAt: Date.now(),
    });

    await this.#trackEvent('onboarding_skipped', {
      slide: this.#currentSlide,
    });

    // Close the onboarding tab
    const tab = await chrome.tabs.getCurrent();
    if (tab && tab.id) {
      chrome.tabs.remove(tab.id);
    }
  }

  /**
   * Track an onboarding analytics event locally.
   * No external network requests are made. Events are stored in
   * chrome.storage.local under the key `zovo_onboarding_events`.
   * The array is capped at 50 entries (FIFO eviction) to limit storage.
   *
   * @param {string} eventName - The event name
   * @param {Record<string, unknown>} [properties={}] - Optional properties
   */
  async #trackEvent(eventName, properties = {}) {
    try {
      const storageKey = 'zovo_onboarding_events';
      const data = await chrome.storage.local.get(storageKey);
      const events = data[storageKey] || [];

      events.push({
        event: eventName,
        properties,
        extension: 'cookie-manager',
        timestamp: Date.now(),
      });

      // Cap at 50 events to prevent unbounded storage growth
      while (events.length > 50) {
        events.shift();
      }

      await chrome.storage.local.set({ [storageKey]: events });
    } catch {
      // Storage errors should never break onboarding
    }
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new ZovoOnboarding());
} else {
  new ZovoOnboarding();
}
```

---

## 4. Service Worker Integration

The following handler should be added to the extension's main service worker file (e.g., `src/service-worker.js` or `src/background/index.js`). It handles both first install and major version updates.

File: `src/background/onboarding-handler.js` (imported by the main service worker)

```javascript
/**
 * Onboarding and What's New handler for Cookie Manager.
 *
 * Registers the chrome.runtime.onInstalled listener to trigger
 * the onboarding flow on first install and the What's New page
 * on major version updates.
 */

'use strict';

/**
 * Parse a semver string into its components.
 * @param {string} version - Version string like "1.2.3"
 * @returns {{ major: number, minor: number, patch: number }}
 */
function parseVersion(version) {
  const parts = (version || '0.0.0').split('.');
  return {
    major: parseInt(parts[0], 10) || 0,
    minor: parseInt(parts[1], 10) || 0,
    patch: parseInt(parts[2], 10) || 0,
  };
}

/**
 * Handle extension installation and updates.
 * @param {chrome.runtime.InstalledDetails} details
 */
async function handleInstalled(details) {
  const currentVersion = chrome.runtime.getManifest().version;

  if (details.reason === 'install') {
    await handleFirstInstall(currentVersion);
  }

  if (details.reason === 'update') {
    await handleUpdate(details.previousVersion, currentVersion);
  }
}

/**
 * Handle first-time installation.
 * Opens the onboarding tab unless onboarding was already completed
 * (e.g., reinstall on the same Chrome profile).
 *
 * @param {string} currentVersion
 */
async function handleFirstInstall(currentVersion) {
  // Store install metadata
  await chrome.storage.local.set({
    installedAt: Date.now(),
    installSource: 'install',
    extensionVersion: currentVersion,
  });

  // Check if onboarding was already completed (reinstall scenario)
  const { onboardingComplete } = await chrome.storage.local.get('onboardingComplete');

  if (!onboardingComplete) {
    // Open onboarding in a new tab
    chrome.tabs.create({
      url: chrome.runtime.getURL('onboarding/onboarding.html'),
      active: true,
    });
  }

  // Check if a Zovo auth session already exists (user has other Zovo extensions)
  const { zovo_auth } = await chrome.storage.sync.get('zovo_auth');
  if (zovo_auth && zovo_auth.tier && zovo_auth.tier !== 'free') {
    // User is already a Zovo member -- cache the license locally
    await chrome.storage.local.set({
      license_cache: {
        tier: zovo_auth.tier,
        validated_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
      },
    });
  }
}

/**
 * Handle extension update.
 * Shows the "What's New" page only on major version bumps.
 *
 * @param {string} previousVersion
 * @param {string} currentVersion
 */
async function handleUpdate(previousVersion, currentVersion) {
  const prev = parseVersion(previousVersion);
  const curr = parseVersion(currentVersion);

  // Update stored version
  await chrome.storage.local.set({
    extensionVersion: currentVersion,
    previousVersion: previousVersion,
    lastUpdatedAt: Date.now(),
  });

  // Show "What's New" page on major version bump
  if (curr.major > prev.major) {
    chrome.tabs.create({
      url: chrome.runtime.getURL('onboarding/whats-new.html'),
      active: true,
    });
  }
}

// Register the listener
chrome.runtime.onInstalled.addListener(handleInstalled);
```

**Integration with main service worker:**

In the main service worker file, import this module:

```javascript
// src/service-worker.js (or src/background/index.js)
import './onboarding-handler.js';

// ... rest of service worker code
```

---

## 5. "What's New" Page Design

The "What's New" page is shown after major version updates. It is a single-page layout that communicates what changed and provides a quick dismiss path.

### 5.1 Page Design

File: `src/onboarding/whats-new.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=600">
  <title>What's New in Cookie Manager</title>
  <link rel="stylesheet" href="../shared/zovo-brand.css">
  <link rel="stylesheet" href="onboarding.css">
</head>
<body>
  <div class="whats-new" role="main">
    <div class="whats-new-container">

      <div class="whats-new-header">
        <img src="../assets/icons/icon-48.png" alt="Cookie Manager" width="48" height="48">
        <div>
          <h1 class="whats-new-title">What's New in Cookie Manager</h1>
          <p class="whats-new-version" id="versionText">Version 2.0.0</p>
        </div>
      </div>

      <div class="whats-new-date" id="dateText"></div>

      <ul class="whats-new-list">
        <li class="whats-new-item">
          <span class="whats-new-badge whats-new-badge--new">New</span>
          <div>
            <strong>Cookie Profiles</strong>
            <p>Save and restore entire cookie sets for different environments. Switch between dev, staging, and production with one click.</p>
          </div>
        </li>
        <li class="whats-new-item">
          <span class="whats-new-badge whats-new-badge--new">New</span>
          <div>
            <strong>Auto-Delete Rules</strong>
            <p>Set rules to automatically clean up tracking cookies when you close a tab or on a schedule.</p>
          </div>
        </li>
        <li class="whats-new-item">
          <span class="whats-new-badge whats-new-badge--improved">Improved</span>
          <div>
            <strong>Faster Search</strong>
            <p>Search now returns results in under 50ms with improved filtering across name, value, and domain.</p>
          </div>
        </li>
        <li class="whats-new-item">
          <span class="whats-new-badge whats-new-badge--improved">Improved</span>
          <div>
            <strong>Dark Mode</strong>
            <p>Fully redesigned dark mode with improved contrast and reduced eye strain for late-night debugging sessions.</p>
          </div>
        </li>
        <li class="whats-new-item">
          <span class="whats-new-badge whats-new-badge--fixed">Fixed</span>
          <div>
            <strong>Cookie Editing Reliability</strong>
            <p>Fixed edge cases where editing httpOnly or secure cookies could fail silently.</p>
          </div>
        </li>
      </ul>

      <div class="whats-new-actions">
        <button class="zovo-btn zovo-btn-primary zovo-btn-lg" id="gotItBtn" type="button">
          Got it
        </button>
        <a href="https://github.com/nicholasodonnell/zovo-cookie-manager/blob/main/CHANGELOG.md"
           target="_blank"
           rel="noopener"
           class="whats-new-changelog-link">
          View full changelog
        </a>
      </div>

    </div>
  </div>

  <script src="whats-new.js"></script>
</body>
</html>
```

### 5.2 What's New JavaScript

File: `src/onboarding/whats-new.js`

```javascript
/**
 * What's New page controller for Cookie Manager.
 * Displays version update information and handles dismissal.
 */

'use strict';

class WhatsNew {
  constructor() {
    this.#init();
  }

  #init() {
    // Set version text from manifest
    const version = chrome.runtime.getManifest().version;
    const versionEl = document.getElementById('versionText');
    if (versionEl) {
      versionEl.textContent = `Version ${version}`;
    }

    // Set date
    const dateEl = document.getElementById('dateText');
    if (dateEl) {
      const now = new Date();
      dateEl.textContent = now.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    }

    // Bind "Got it" button
    const gotItBtn = document.getElementById('gotItBtn');
    if (gotItBtn) {
      gotItBtn.addEventListener('click', () => this.#dismiss());
    }

    // Keyboard: Enter or Escape to dismiss
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === 'Escape') {
        e.preventDefault();
        this.#dismiss();
      }
    });

    // Track view
    this.#trackEvent('whats_new_viewed', { version });
  }

  async #dismiss() {
    await this.#trackEvent('whats_new_dismissed');

    // Mark as seen so it does not reappear
    const version = chrome.runtime.getManifest().version;
    await chrome.storage.local.set({
      whatsNewSeenVersion: version,
    });

    // Close the tab
    const tab = await chrome.tabs.getCurrent();
    if (tab && tab.id) {
      chrome.tabs.remove(tab.id);
    }
  }

  /**
   * Track an event locally. Same pattern as onboarding events.
   * @param {string} eventName
   * @param {Record<string, unknown>} [properties={}]
   */
  async #trackEvent(eventName, properties = {}) {
    try {
      const storageKey = 'zovo_onboarding_events';
      const data = await chrome.storage.local.get(storageKey);
      const events = data[storageKey] || [];

      events.push({
        event: eventName,
        properties,
        extension: 'cookie-manager',
        timestamp: Date.now(),
      });

      while (events.length > 50) {
        events.shift();
      }

      await chrome.storage.local.set({ [storageKey]: events });
    } catch {
      // Never break the page over a storage error
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new WhatsNew());
} else {
  new WhatsNew();
}
```

### 5.3 Design Decisions

1. **Content is static per major version.** The bullet points in `whats-new.html` are hardcoded for each major release. When shipping version 3.0.0, the developer updates the HTML content in the same PR that bumps the version. This is simpler and more reliable than a dynamic content system for a low-frequency event.

2. **No version history.** The page shows only the current version's changes. Users who want the full history are directed to the changelog file via a link.

3. **Single dismiss action.** The "Got it" button closes the tab. There is no multi-step flow. The page stores `whatsNewSeenVersion` to prevent re-showing on subsequent browser launches.

4. **Badges.** Each changelog entry has a colored badge indicating its type: "New" (purple), "Improved" (blue), "Fixed" (green). This categorization matches standard changelog conventions and allows quick scanning.

---

## 6. Onboarding CSS

File: `src/onboarding/onboarding.css`

```css
/* ==========================================================================
   Cookie Manager Onboarding Styles
   Companion to zovo-brand.css. Styles specific to the onboarding and
   What's New pages.
   ========================================================================== */

/* =========================
   LAYOUT — ONBOARDING CONTAINER
   ========================= */

.onboarding {
  position: relative;
  width: 100%;
  max-width: 600px;
  min-height: 100vh;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--zovo-bg-primary);
}

/* =========================
   PROGRESS BAR
   ========================= */

.onboarding-progress {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--zovo-bg-tertiary);
  z-index: 100;
}

.onboarding-progress-bar {
  height: 100%;
  width: 25%;
  background: linear-gradient(90deg, var(--zovo-primary), #7C3AED);
  border-radius: 0 2px 2px 0;
  transition: width 350ms cubic-bezier(0.4, 0, 0.2, 1);
}

/* =========================
   SKIP BUTTON
   ========================= */

.onboarding-skip {
  position: fixed;
  top: 16px;
  right: 24px;
  z-index: 101;
  background: none;
  border: none;
  font-family: var(--zovo-font-family);
  font-size: var(--zovo-font-size-sm);
  color: var(--zovo-text-muted);
  cursor: pointer;
  padding: 4px 8px;
  border-radius: var(--zovo-radius-sm);
  transition: color var(--zovo-transition-fast), background var(--zovo-transition-fast);
}

.onboarding-skip:hover {
  color: var(--zovo-text-secondary);
  background: var(--zovo-bg-tertiary);
}

.onboarding-skip:focus-visible {
  outline: 2px solid var(--zovo-primary);
  outline-offset: 2px;
}

/* =========================
   SLIDES CONTAINER
   ========================= */

.onboarding-slides {
  flex: 1;
  display: flex;
  transition: transform 350ms cubic-bezier(0.4, 0, 0.2, 1);
  will-change: transform;
}

.onboarding-slide {
  flex: 0 0 100%;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 40px 80px;
  opacity: 0;
  transition: opacity 300ms ease;
}

.onboarding-slide.active {
  opacity: 1;
}

.onboarding-slide-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  max-width: 440px;
  width: 100%;
  gap: 16px;
}

/* =========================
   ICON / IMAGE
   ========================= */

.onboarding-icon {
  margin-bottom: 8px;
}

.onboarding-icon img {
  display: block;
}

.onboarding-feature-illustration {
  margin-bottom: 8px;
  border-radius: var(--zovo-radius-lg);
  overflow: hidden;
}

.onboarding-feature-illustration svg {
  display: block;
  width: 100%;
  max-width: 280px;
  height: auto;
}

/* =========================
   TYPOGRAPHY
   ========================= */

.onboarding-headline {
  font-family: var(--zovo-font-family);
  font-size: 22px;
  font-weight: var(--zovo-font-weight-bold);
  color: var(--zovo-text-primary);
  line-height: var(--zovo-line-height-tight);
  letter-spacing: -0.01em;
}

h1.onboarding-headline {
  font-size: 26px;
}

.onboarding-subtitle {
  font-size: var(--zovo-font-size-md);
  font-weight: var(--zovo-font-weight-medium);
  color: var(--zovo-text-muted);
  margin-top: -8px;
}

.onboarding-description {
  font-size: var(--zovo-font-size-md);
  color: var(--zovo-text-secondary);
  line-height: var(--zovo-line-height-relaxed);
  max-width: 380px;
}

.onboarding-tier-note {
  font-size: var(--zovo-font-size-xs);
  color: var(--zovo-text-muted);
  font-weight: var(--zovo-font-weight-normal);
  margin-top: 4px;
}

/* =========================
   TRUST BADGES
   ========================= */

.onboarding-trust-badges {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-top: 8px;
  flex-wrap: wrap;
}

.trust-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: var(--zovo-font-size-sm);
  color: var(--zovo-text-secondary);
  font-weight: var(--zovo-font-weight-medium);
}

.trust-icon {
  flex-shrink: 0;
}

/* =========================
   HIGHLIGHT CALLOUT
   ========================= */

.onboarding-highlight {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--zovo-primary-light);
  color: var(--zovo-primary);
  font-size: var(--zovo-font-size-sm);
  font-weight: var(--zovo-font-weight-medium);
  padding: 10px 16px;
  border-radius: var(--zovo-radius-md);
  border-left: 3px solid var(--zovo-primary);
  text-align: left;
  margin-top: 4px;
}

.highlight-icon {
  flex-shrink: 0;
}

/* =========================
   CTA BUTTON GROUP (Slide 4)
   ========================= */

.onboarding-cta-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  max-width: 320px;
  margin-top: 8px;
}

/* =========================
   KEYBOARD SHORTCUT HINT
   ========================= */

.onboarding-shortcut-hint {
  font-size: var(--zovo-font-size-xs);
  color: var(--zovo-text-muted);
  margin-top: 12px;
}

.onboarding-shortcut-hint kbd {
  display: inline-block;
  padding: 1px 5px;
  font-family: var(--zovo-font-family);
  font-size: 10px;
  font-weight: var(--zovo-font-weight-medium);
  color: var(--zovo-text-secondary);
  background: var(--zovo-bg-tertiary);
  border: 1px solid var(--zovo-border);
  border-radius: 3px;
  line-height: 1.4;
  vertical-align: middle;
}

/* =========================
   BOTTOM NAVIGATION
   ========================= */

.onboarding-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  max-width: 600px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  background: var(--zovo-bg-primary);
  border-top: 1px solid var(--zovo-border);
  z-index: 100;
}

/* =========================
   DOT NAVIGATION
   ========================= */

.onboarding-dots {
  display: flex;
  align-items: center;
  gap: 8px;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: none;
  background: var(--zovo-border);
  cursor: pointer;
  padding: 0;
  transition: background var(--zovo-transition-fast), transform var(--zovo-transition-fast);
}

.dot:hover {
  background: var(--zovo-text-muted);
}

.dot.active {
  background: var(--zovo-primary);
  transform: scale(1.25);
}

.dot:focus-visible {
  outline: 2px solid var(--zovo-primary);
  outline-offset: 2px;
}

/* =========================
   WHAT'S NEW PAGE
   ========================= */

.whats-new {
  width: 100%;
  max-width: 600px;
  min-height: 100vh;
  margin: 0 auto;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 48px 24px;
  background: var(--zovo-bg-primary);
}

.whats-new-container {
  width: 100%;
  max-width: 480px;
}

.whats-new-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 8px;
}

.whats-new-title {
  font-family: var(--zovo-font-family);
  font-size: 22px;
  font-weight: var(--zovo-font-weight-bold);
  color: var(--zovo-text-primary);
  line-height: var(--zovo-line-height-tight);
}

.whats-new-version {
  font-size: var(--zovo-font-size-sm);
  color: var(--zovo-text-muted);
  font-weight: var(--zovo-font-weight-medium);
}

.whats-new-date {
  font-size: var(--zovo-font-size-sm);
  color: var(--zovo-text-muted);
  margin-bottom: 24px;
}

/* =========================
   WHAT'S NEW — CHANGELOG LIST
   ========================= */

.whats-new-list {
  list-style: none;
  padding: 0;
  margin: 0 0 32px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.whats-new-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 16px;
  background: var(--zovo-bg-secondary);
  border-radius: var(--zovo-radius-lg);
  border: 1px solid var(--zovo-border);
}

.whats-new-item strong {
  display: block;
  font-size: var(--zovo-font-size-md);
  font-weight: var(--zovo-font-weight-semibold);
  color: var(--zovo-text-primary);
  margin-bottom: 4px;
}

.whats-new-item p {
  font-size: var(--zovo-font-size-sm);
  color: var(--zovo-text-secondary);
  line-height: var(--zovo-line-height-normal);
}

/* =========================
   WHAT'S NEW — BADGES
   ========================= */

.whats-new-badge {
  display: inline-block;
  flex-shrink: 0;
  padding: 2px 8px;
  font-size: 10px;
  font-weight: var(--zovo-font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.03em;
  border-radius: var(--zovo-radius-full);
  margin-top: 2px;
}

.whats-new-badge--new {
  background: #ede9fe;
  color: #7C3AED;
}

.whats-new-badge--improved {
  background: #dbeafe;
  color: #2563EB;
}

.whats-new-badge--fixed {
  background: #d1fae5;
  color: #059669;
}

/* =========================
   WHAT'S NEW — ACTIONS
   ========================= */

.whats-new-actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.whats-new-changelog-link {
  font-size: var(--zovo-font-size-sm);
  color: var(--zovo-text-muted);
  text-decoration: none;
  transition: color var(--zovo-transition-fast);
}

.whats-new-changelog-link:hover {
  color: var(--zovo-primary);
  text-decoration: underline;
}

/* =========================
   RESPONSIVE (below 600px)
   ========================= */

@media (max-width: 600px) {
  .onboarding-slide {
    padding: 40px 24px 80px;
  }

  h1.onboarding-headline {
    font-size: 22px;
  }

  .onboarding-headline {
    font-size: 20px;
  }

  .onboarding-trust-badges {
    gap: 12px;
  }

  .trust-badge {
    font-size: var(--zovo-font-size-xs);
  }

  .onboarding-feature-illustration svg {
    max-width: 240px;
  }

  .whats-new {
    padding: 32px 16px;
  }

  .whats-new-title {
    font-size: 18px;
  }
}

/* =========================
   DARK MODE OVERRIDES
   ========================= */

@media (prefers-color-scheme: dark) {
  .onboarding-highlight {
    background: rgba(99, 102, 241, 0.12);
    color: #a5b4fc;
    border-left-color: #818cf8;
  }

  .onboarding-shortcut-hint kbd {
    background: var(--zovo-bg-tertiary);
    border-color: #475569;
    color: var(--zovo-text-secondary);
  }

  .whats-new-badge--new {
    background: rgba(124, 58, 237, 0.15);
    color: #c4b5fd;
  }

  .whats-new-badge--improved {
    background: rgba(37, 99, 235, 0.15);
    color: #93c5fd;
  }

  .whats-new-badge--fixed {
    background: rgba(5, 150, 105, 0.15);
    color: #6ee7b7;
  }

  .dot {
    background: #475569;
  }

  .dot:hover {
    background: #64748b;
  }

  .onboarding-progress-bar {
    background: linear-gradient(90deg, #818cf8, #a78bfa);
  }
}

/* =========================
   REDUCED MOTION
   ========================= */

@media (prefers-reduced-motion: reduce) {
  .onboarding-slides {
    transition: none;
  }

  .onboarding-slide {
    transition: none;
  }

  .onboarding-progress-bar {
    transition: none;
  }

  .dot {
    transition: none;
  }
}

/* =========================
   FOCUS VISIBLE (Keyboard Nav)
   ========================= */

.zovo-btn:focus-visible {
  outline: 2px solid var(--zovo-primary);
  outline-offset: 2px;
}

/* =========================
   HIGH CONTRAST MODE
   ========================= */

@media (forced-colors: active) {
  .onboarding-progress-bar {
    background: Highlight;
  }

  .dot.active {
    background: Highlight;
  }

  .trust-icon circle {
    fill: Highlight;
  }

  .whats-new-badge {
    border: 1px solid ButtonText;
  }
}
```

---

## 7. Onboarding Analytics Events

All events are stored locally in `chrome.storage.local` under the key `zovo_onboarding_events`. No external network requests are made from the onboarding or What's New pages. Events follow the schema below.

### 7.1 Event Schema

```typescript
interface OnboardingEvent {
  event: string;              // Event name from the table below
  properties: {
    slide?: number;           // 1-indexed slide number where applicable
    version?: string;         // Extension version where applicable
    [key: string]: unknown;
  };
  extension: 'cookie-manager';
  timestamp: number;          // Date.now()
}
```

### 7.2 Event Definitions

| Event Name | Trigger | Properties | Notes |
|---|---|---|---|
| `onboarding_started` | Onboarding page loads and `ZovoOnboarding` initializes | `{}` | Fires once per onboarding session. If the user closes the tab and reopens it (before completing), it fires again. |
| `onboarding_slide_viewed` | User navigates to a slide (via Next, Back, dot click, or arrow key) | `{ slide: number }` | Fires for every slide view including the initial slide 1 view. Allows reconstruction of the full navigation path. |
| `onboarding_skipped` | User clicks "Skip tour" on any slide | `{ slide: number }` | The `slide` property records where the user dropped off. Slide 1 skips indicate zero interest. Slide 3 skips indicate the user saw features but chose not to finish. |
| `onboarding_completed` | User clicks "Start Using Cookie Manager" on slide 4 | `{ slide: 4 }` | This is the primary onboarding success metric. The user reached the final slide and actively chose to begin using the extension. |
| `onboarding_zovo_clicked` | User clicks "Explore Zovo -- Get All Extensions" on slide 4 | `{ slide: number }` | Tracks cross-portfolio interest during onboarding. This CTA opens `zovo.app` in a new tab and then completes onboarding. |
| `whats_new_viewed` | What's New page loads | `{ version: string }` | Tracks how many users see the major version update page. |
| `whats_new_dismissed` | User clicks "Got it" or presses Enter/Escape on What's New | `{}` | Tracks dismissal of the What's New page. |

### 7.3 Storage Constraints

- Maximum 50 events are stored in the `zovo_onboarding_events` array. Older events are evicted first (FIFO).
- Estimated storage per event: approximately 120 bytes. Maximum storage for onboarding events: approximately 6KB.
- Events are never sent to any external service from the onboarding module. If the broader analytics system (Phase 04 Agent 5) needs these events, it reads from `zovo_onboarding_events` during its own flush cycle.
- All events are written inside a try/catch block. A storage error must never break the onboarding experience.

### 7.4 Downstream Integration

The onboarding events feed into the broader analytics system defined in Phase 04 Agent 5. Specifically:

- `onboarding_completed` contributes to the `Install -> Active Day 1` step of the conversion funnel
- `onboarding_skipped` with `slide: 1` may indicate low-intent installs (accidental or competitive research)
- `onboarding_zovo_clicked` feeds the `cross_promo_clicked` metric when the source is `onboarding`
- The `onboardingComplete` and `onboardingCompletedAt` flags in `chrome.storage.local` are read by the `PaywallController` to enforce the "no paywall on first session" rule

---

## 8. File Structure Summary

```
src/
  onboarding/
    onboarding.html          # 4-slide onboarding page
    onboarding.js            # ZovoOnboarding class
    onboarding.css           # Onboarding + What's New styles
    whats-new.html           # Major version update page
    whats-new.js             # WhatsNew class
  background/
    onboarding-handler.js    # chrome.runtime.onInstalled listener
  shared/
    zovo-brand.css           # Shared brand stylesheet (from Agent 2)
  assets/
    icons/
      icon-48.png            # Used in What's New header
      icon-128.png           # Used in onboarding slide 1
```

---

## 9. Manifest Entries

The following entries must be present in `manifest.json` for the onboarding system to function:

```json
{
  "permissions": ["storage", "tabs"],
  "background": {
    "service_worker": "service-worker.js",
    "type": "module"
  },
  "commands": {
    "_execute_action": {
      "suggested_key": {
        "default": "Ctrl+Shift+K",
        "mac": "Command+Shift+K"
      },
      "description": "Open Cookie Manager"
    }
  }
}
```

The `onboarding/` directory must be included in the extension package. Since the onboarding page is opened via `chrome.runtime.getURL()`, it is loaded as a local extension page and does not require additional `web_accessible_resources` entries.

---

## 10. Integration with Phase 04 Spec

### 10.1 First-Run Experience Alignment

Phase 04 Agent 1 defines a 3-step first-run experience rendered inside the popup itself (Section 2.3 of `agent1-premium-ux.md`). This onboarding system is distinct: it opens in a new tab and provides a more detailed introduction. The two systems coexist as follows:

- **Onboarding tab** (this document): Opens on first install. Provides brand introduction, feature tour, and Zovo awareness. Sets `onboardingComplete: true` on completion or skip.
- **In-popup first-run** (Agent 1): If implemented, renders the first time the popup opens (not the onboarding tab). Focuses on the popup-specific UI rather than brand introduction. Checks for `onboarding.completed` in storage to avoid redundancy.

If the team decides only one first-run flow is needed, this onboarding tab system takes priority because it provides a fuller experience without being constrained by the 400x520px popup dimensions.

### 10.2 Paywall Suppression

Phase 04 Agent 5 specifies that no paywall fires during the first session (`session_count >= 2` check in `PaywallController`). The onboarding tab is not counted as a "session" in the popup session counter because it is not a popup open event. The onboarding tab runs in its own browsing context. The first popup open after onboarding counts as session 1, meaning the user must return for a second popup session before any paywall appears.

### 10.3 Engagement Prerequisites

Phase 04 Agent 5 defines engagement prerequisites for paywall triggers (Section 1.3). The onboarding system sets `installedAt` in storage, which is used by the monetization system to calculate `days_since_install` for time-gated triggers. No other engagement prerequisites are set by onboarding -- the user must earn those through natural usage.

---

*End of Agent 3 onboarding system specification. This document covers the complete first-run experience including trigger conditions, 4-slide flow design, production-ready HTML/CSS/JS, service worker integration, What's New page, analytics events, and integration with the Phase 04 premium UX and monetization specifications.*
