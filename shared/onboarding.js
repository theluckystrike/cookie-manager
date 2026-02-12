/**
 * Zovo Shared Onboarding System
 * Reusable onboarding flow for all Zovo extensions
 */

class ZovoOnboarding {
    constructor(config) {
        this.extensionId = config.extensionId;
        this.extensionName = config.extensionName;
        this.slides = config.slides || [];
        this.currentSlide = 0;
        this.totalSlides = this.slides.length;

        this.init();
    }

    init() {
        // DOM elements
        this.container = document.querySelector('.zovo-onboarding');
        this.slidesContainer = document.querySelector('.zovo-onboarding-slides');
        this.progressBar = document.querySelector('.zovo-onboarding-progress-fill');
        this.dots = document.querySelectorAll('.zovo-onboarding-dot');
        this.prevBtn = document.getElementById('prevBtn');
        this.nextBtn = document.getElementById('nextBtn');
        this.skipBtn = document.getElementById('skipBtn');
        this.startBtn = document.getElementById('startBtn');

        // Event listeners
        this.prevBtn?.addEventListener('click', () => this.prev());
        this.nextBtn?.addEventListener('click', () => this.next());
        this.skipBtn?.addEventListener('click', () => this.skip());
        this.startBtn?.addEventListener('click', () => this.complete());

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight') this.next();
            if (e.key === 'ArrowLeft') this.prev();
            if (e.key === 'Escape') this.skip();
        });

        this.updateUI();
    }

    goTo(index) {
        if (index >= 0 && index < this.totalSlides) {
            this.currentSlide = index;
            this.updateUI();
        }
    }

    next() {
        if (this.currentSlide < this.totalSlides - 1) {
            this.currentSlide++;
            this.updateUI();
        }
    }

    prev() {
        if (this.currentSlide > 0) {
            this.currentSlide--;
            this.updateUI();
        }
    }

    updateUI() {
        // Update slides
        const slides = document.querySelectorAll('.zovo-onboarding-slide');
        slides.forEach((slide, i) => {
            slide.classList.toggle('active', i === this.currentSlide);
        });

        // Update progress bar
        const progress = ((this.currentSlide + 1) / this.totalSlides) * 100;
        if (this.progressBar) {
            this.progressBar.style.width = `${progress}%`;
        }

        // Update dots
        this.dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === this.currentSlide);
        });

        // Update buttons
        if (this.prevBtn) {
            this.prevBtn.disabled = this.currentSlide === 0;
            this.prevBtn.style.visibility = this.currentSlide === 0 ? 'hidden' : 'visible';
        }

        if (this.nextBtn) {
            const isLast = this.currentSlide === this.totalSlides - 1;
            this.nextBtn.style.display = isLast ? 'none' : 'flex';
        }

        if (this.startBtn) {
            const isLast = this.currentSlide === this.totalSlides - 1;
            this.startBtn.style.display = isLast ? 'flex' : 'none';
        }
    }

    async skip() {
        await this.markComplete('skipped');
        window.close();
    }

    async complete() {
        await this.markComplete('completed');
        window.close();
    }

    async markComplete(status) {
        await chrome.storage.local.set({
            onboardingComplete: true,
            onboardingStatus: status,
            onboardingCompletedAt: Date.now()
        });

        // Track locally
        await this.trackEvent('onboarding_' + status);
    }

    async trackEvent(eventName) {
        const { analytics = [] } = await chrome.storage.local.get('analytics');

        analytics.push({
            event: eventName,
            extension: this.extensionId,
            timestamp: Date.now()
        });

        // Keep last 100 events
        if (analytics.length > 100) {
            analytics.shift();
        }

        await chrome.storage.local.set({ analytics });
    }
}

// Background script helper: trigger onboarding on install
async function triggerOnboardingOnInstall(details) {
    if (details.reason === 'install') {
        const { onboardingComplete } = await chrome.storage.local.get('onboardingComplete');

        if (!onboardingComplete) {
            chrome.tabs.create({
                url: chrome.runtime.getURL('onboarding/index.html')
            });
        }

        // Track install
        await chrome.storage.local.set({
            installedAt: Date.now(),
            installSource: details.reason
        });
    }

    if (details.reason === 'update') {
        const previousVersion = details.previousVersion;
        const currentVersion = chrome.runtime.getManifest().version;

        // Show changelog for major updates
        const previousMajor = parseInt(previousVersion?.split('.')[0] || '0');
        const currentMajor = parseInt(currentVersion.split('.')[0]);

        if (currentMajor > previousMajor) {
            chrome.tabs.create({
                url: chrome.runtime.getURL('onboarding/whats-new.html')
            });
        }
    }
}

// Export for use
if (typeof window !== 'undefined') {
    window.ZovoOnboarding = ZovoOnboarding;
}

if (typeof self !== 'undefined') {
    // Can be called from service worker (self) or window context
    self.triggerOnboardingOnInstall = triggerOnboardingOnInstall;
} else if (typeof window !== 'undefined') {
    window.triggerOnboardingOnInstall = triggerOnboardingOnInstall;
}
