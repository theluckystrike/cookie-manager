'use strict';

(function() {
    // Mark onboarding as complete on page load so the welcome page
    // will not be shown again even if the user closes the tab without
    // clicking the button.
    chrome.storage.local.set({ onboardingComplete: true }, function() {
        void chrome.runtime.lastError; // Suppress any error
    });

    // "Get Started" button scrolls to the features section
    var getStartedBtn = document.getElementById('get-started-btn');
    if (getStartedBtn) {
        getStartedBtn.addEventListener('click', function() {
            var featuresSection = document.getElementById('features');
            if (featuresSection) {
                featuresSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }

    // "Start Using Cookie Manager" button sets onboardingComplete and closes the tab
    var startBtn = document.getElementById('start-btn');
    if (startBtn) {
        startBtn.addEventListener('click', function() {
            chrome.storage.local.set({ onboardingComplete: true }, function() {
                void chrome.runtime.lastError; // Suppress any error
                window.close();
            });
        });
    }
})();
