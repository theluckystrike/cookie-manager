/**
 * Cookie Manager - Onboarding Flow
 * Part of Zovo Chrome Extensions
 */

class ZovoOnboarding {
    constructor() {
        this.currentSlide = 1;
        this.totalSlides = 4;
        this.init();
    }

    init() {
        this.slides = document.querySelectorAll('.onboarding-slide');
        this.dots = document.querySelectorAll('.dot');
        this.progressBar = document.getElementById('progressBar');
        this.prevBtn = document.getElementById('prevBtn');
        this.nextBtn = document.getElementById('nextBtn');
        this.startBtn = document.getElementById('startBtn');

        // Button events
        this.prevBtn?.addEventListener('click', () => this.prev());
        this.nextBtn?.addEventListener('click', () => this.next());
        this.startBtn?.addEventListener('click', () => this.complete());

        // Dot navigation
        this.dots.forEach(dot => {
            dot.addEventListener('click', () => {
                const slideNum = parseInt(dot.dataset.slide);
                if (slideNum) this.goTo(slideNum);
            });
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight' || e.key === 'Enter') this.next();
            if (e.key === 'ArrowLeft') this.prev();
            if (e.key === 'Escape') this.complete();
        });

        this.updateUI();
        this.trackEvent('onboarding_started');
    }

    goTo(slideNum) {
        if (slideNum >= 1 && slideNum <= this.totalSlides) {
            this.currentSlide = slideNum;
            this.updateUI();
            this.trackEvent(`onboarding_slide_${slideNum}`);
        }
    }

    next() {
        if (this.currentSlide < this.totalSlides) {
            this.currentSlide++;
            this.updateUI();
            this.trackEvent(`onboarding_slide_${this.currentSlide}`);
        }
    }

    prev() {
        if (this.currentSlide > 1) {
            this.currentSlide--;
            this.updateUI();
        }
    }

    updateUI() {
        // Update slides
        this.slides.forEach((slide, i) => {
            slide.classList.toggle('active', i + 1 === this.currentSlide);
        });

        // Update dots
        this.dots.forEach((dot, i) => {
            dot.classList.toggle('active', i + 1 === this.currentSlide);
        });

        // Update progress bar
        const progress = (this.currentSlide / this.totalSlides) * 100;
        if (this.progressBar) {
            this.progressBar.style.width = `${progress}%`;
        }

        // Update buttons
        if (this.prevBtn) {
            this.prevBtn.disabled = this.currentSlide === 1;
        }

        if (this.nextBtn) {
            if (this.currentSlide === this.totalSlides) {
                this.nextBtn.style.display = 'none';
            } else {
                this.nextBtn.style.display = 'inline-flex';
            }
        }
    }

    async complete() {
        try {
            // Mark onboarding as complete
            await chrome.storage.local.set({
                onboardingComplete: true,
                onboardingCompletedAt: Date.now()
            });

            // Track completion
            await this.trackEvent('onboarding_complete');

            // Close onboarding tab
            window.close();
        } catch (e) {
            // If chrome API not available (testing), just close
            console.log('Onboarding complete');
            window.close();
        }
    }

    async trackEvent(eventName) {
        try {
            const { analytics = [] } = await chrome.storage.local.get('analytics');
            analytics.push({
                event: eventName,
                timestamp: Date.now(),
                extension: 'cookie-manager'
            });

            // Keep only last 100 events
            if (analytics.length > 100) {
                analytics.shift();
            }

            await chrome.storage.local.set({ analytics });
        } catch (e) {
            // Silent fail if chrome API not available
            console.log('Event:', eventName);
        }
    }
}

// Initialize when DOM ready
document.addEventListener('DOMContentLoaded', () => {
    new ZovoOnboarding();
});
