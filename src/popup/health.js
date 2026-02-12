/**
 * Cookie Manager - Health Tab Logic
 * Calculates cookie health scores, detects trackers, provides recommendations.
 * Exports HealthManager for popup.js to call init() on.
 */

var HealthManager = (function () {
    'use strict';

    // ========================================================================
    // Known Tracker Patterns
    // ========================================================================

    var TRACKER_PATTERNS = [
        { name: '_ga',       label: 'Google Analytics',       company: 'Google' },
        { name: '_gid',      label: 'Google Analytics',       company: 'Google' },
        { name: '_gat',      label: 'Google Analytics',       company: 'Google' },
        { name: '_fbp',      label: 'Facebook Pixel',         company: 'Meta' },
        { name: '_fbc',      label: 'Facebook Click ID',      company: 'Meta' },
        { name: '_gcl',      label: 'Google Ads Conversion',  company: 'Google',  prefix: true },
        { name: '_uetsid',   label: 'Bing Ads',               company: 'Microsoft' },
        { name: '_uetvid',   label: 'Bing Ads',               company: 'Microsoft' },
        { name: 'MUID',      label: 'Microsoft User ID',      company: 'Microsoft' },
        { name: '_clck',     label: 'Microsoft Clarity',      company: 'Microsoft' },
        { name: '_clsk',     label: 'Microsoft Clarity',      company: 'Microsoft' },
        { name: 'IDE',       label: 'DoubleClick',            company: 'Google' },
        { name: 'DSID',      label: 'DoubleClick',            company: 'Google' },
        { name: 'NID',       label: 'Google Preferences',     company: 'Google' },
        { name: '__gads',    label: 'Google AdSense',         company: 'Google' },
        { name: 'fr',        label: 'Facebook Tracking',      company: 'Meta' },
        { name: 'datr',      label: 'Facebook Browser ID',    company: 'Meta' }
    ];

    // ========================================================================
    // Grade Thresholds and Colors
    // ========================================================================

    var GRADES = [
        { min: 95, grade: 'A+', color: '#10B981' },
        { min: 85, grade: 'A',  color: '#10B981' },
        { min: 75, grade: 'B',  color: '#3B82F6' },
        { min: 60, grade: 'C',  color: '#F59E0B' },
        { min: 40, grade: 'D',  color: '#F97316' },
        { min: 0,  grade: 'F',  color: '#EF4444' }
    ];

    // ========================================================================
    // State
    // ========================================================================

    var _cookies = [];
    var _analysis = null;
    var _initialized = false;
    var _fetchInProgress = false;

    // ========================================================================
    // Analysis Engine
    // ========================================================================

    function analyzeCookies(cookies) {
        var total = cookies.length;

        if (total === 0) {
            return {
                overallScore: 100,
                grade: 'A+',
                gradeColor: '#10B981',
                categories: {
                    quantity: { score: 100, label: 'Cookie Count', detail: '0 cookies', icon: 'count' },
                    secure: { score: 100, label: 'Secure Flag', detail: 'No cookies to check', icon: 'lock' },
                    httpOnly: { score: 100, label: 'HttpOnly Flag', detail: 'No cookies to check', icon: 'shield' },
                    sameSite: { score: 100, label: 'SameSite Policy', detail: 'No cookies to check', icon: 'policy' },
                    expiry: { score: 100, label: 'Cookie Lifespan', detail: 'No cookies to check', icon: 'clock' },
                    trackers: { score: 100, label: 'Tracking Cookies', detail: '0 trackers found', icon: 'eye' }
                },
                trackers: [],
                recommendations: [],
                totalCookies: 0
            };
        }

        // --- Category 1: Cookie Count ---
        var quantityScore;
        if (total <= 5) quantityScore = 100;
        else if (total <= 10) quantityScore = 90;
        else if (total <= 20) quantityScore = 75;
        else if (total <= 35) quantityScore = 55;
        else if (total <= 50) quantityScore = 35;
        else quantityScore = 15;

        // --- Category 2: Secure Flag ---
        var secureCount = 0;
        for (var i = 0; i < total; i++) {
            if (cookies[i].secure) secureCount++;
        }
        var securePct = Math.round((secureCount / total) * 100);
        var secureScore = securePct;

        // --- Category 3: HttpOnly Flag ---
        var httpOnlyCount = 0;
        for (var j = 0; j < total; j++) {
            if (cookies[j].httpOnly) httpOnlyCount++;
        }
        var httpOnlyPct = Math.round((httpOnlyCount / total) * 100);
        var httpOnlyScore = httpOnlyPct;

        // --- Category 4: SameSite ---
        var sameSiteCount = 0;
        for (var k = 0; k < total; k++) {
            var ss = cookies[k].sameSite;
            if (ss && ss !== 'unspecified' && ss !== 'no_restriction') {
                sameSiteCount++;
            }
        }
        var sameSitePct = Math.round((sameSiteCount / total) * 100);
        var sameSiteScore = sameSitePct;

        // --- Category 5: Cookie Lifespan ---
        var now = Date.now() / 1000;
        var longLivedCount = 0;
        var sessionCount = 0;
        for (var m = 0; m < total; m++) {
            if (!cookies[m].expirationDate) {
                sessionCount++;
            } else {
                var daysRemaining = (cookies[m].expirationDate - now) / 86400;
                if (daysRemaining > 365) longLivedCount++;
            }
        }
        var expiryScore;
        var longLivedPct = Math.round((longLivedCount / total) * 100);
        if (longLivedPct === 0) expiryScore = 100;
        else if (longLivedPct <= 10) expiryScore = 85;
        else if (longLivedPct <= 25) expiryScore = 70;
        else if (longLivedPct <= 50) expiryScore = 45;
        else expiryScore = 20;

        // --- Category 6: Tracking Cookies ---
        var trackers = detectTrackers(cookies);
        var trackerCount = trackers.length;
        var trackerScore;
        if (trackerCount === 0) trackerScore = 100;
        else if (trackerCount <= 2) trackerScore = 75;
        else if (trackerCount <= 5) trackerScore = 50;
        else if (trackerCount <= 10) trackerScore = 25;
        else trackerScore = 5;

        // --- Overall Score (weighted) ---
        var overallScore = Math.round(
            quantityScore * 0.10 +
            secureScore * 0.20 +
            httpOnlyScore * 0.20 +
            sameSiteScore * 0.15 +
            expiryScore * 0.10 +
            trackerScore * 0.25
        );

        // Clamp
        overallScore = Math.max(0, Math.min(100, overallScore));

        var gradeInfo = getGrade(overallScore);

        // --- Recommendations ---
        var recommendations = buildRecommendations({
            total: total,
            secureCount: secureCount,
            httpOnlyCount: httpOnlyCount,
            sameSiteCount: sameSiteCount,
            longLivedCount: longLivedCount,
            trackerCount: trackerCount,
            sessionCount: sessionCount
        });

        return {
            overallScore: overallScore,
            grade: gradeInfo.grade,
            gradeColor: gradeInfo.color,
            categories: {
                quantity: {
                    score: quantityScore,
                    label: 'Cookie Count',
                    detail: total + ' cookie' + (total !== 1 ? 's' : '') + ' on this domain',
                    icon: 'count'
                },
                secure: {
                    score: secureScore,
                    label: 'Secure Flag',
                    detail: secureCount + '/' + total + ' (' + securePct + '%) have Secure flag',
                    icon: 'lock'
                },
                httpOnly: {
                    score: httpOnlyScore,
                    label: 'HttpOnly Flag',
                    detail: httpOnlyCount + '/' + total + ' (' + httpOnlyPct + '%) have HttpOnly',
                    icon: 'shield'
                },
                sameSite: {
                    score: sameSiteScore,
                    label: 'SameSite Policy',
                    detail: sameSiteCount + '/' + total + ' (' + sameSitePct + '%) have SameSite set',
                    icon: 'policy'
                },
                expiry: {
                    score: expiryScore,
                    label: 'Cookie Lifespan',
                    detail: longLivedCount + ' long-lived (>1yr), ' + sessionCount + ' session',
                    icon: 'clock'
                },
                trackers: {
                    score: trackerScore,
                    label: 'Tracking Cookies',
                    detail: trackerCount + ' tracker' + (trackerCount !== 1 ? 's' : '') + ' detected',
                    icon: 'eye'
                }
            },
            trackers: trackers,
            recommendations: recommendations,
            totalCookies: total
        };
    }

    function getGrade(score) {
        for (var i = 0; i < GRADES.length; i++) {
            if (score >= GRADES[i].min) return GRADES[i];
        }
        return GRADES[GRADES.length - 1];
    }

    function detectTrackers(cookies) {
        var found = [];
        for (var i = 0; i < cookies.length; i++) {
            var cookie = cookies[i];
            for (var j = 0; j < TRACKER_PATTERNS.length; j++) {
                var pattern = TRACKER_PATTERNS[j];
                var match = false;
                if (pattern.prefix) {
                    match = cookie.name.indexOf(pattern.name) === 0;
                } else {
                    match = cookie.name === pattern.name;
                }
                if (match) {
                    found.push({
                        cookieName: cookie.name,
                        cookieDomain: cookie.domain,
                        label: pattern.label,
                        company: pattern.company,
                        secure: cookie.secure,
                        httpOnly: cookie.httpOnly
                    });
                    break;
                }
            }
        }
        return found;
    }

    function buildRecommendations(stats) {
        var recs = [];

        if (stats.trackerCount > 0) {
            recs.push({
                type: 'warning',
                title: 'Remove tracking cookies',
                text: 'Delete ' + stats.trackerCount + ' tracking cookie' + (stats.trackerCount !== 1 ? 's' : '') + ' to improve your privacy score.'
            });
        }

        var insecureCount = stats.total - stats.secureCount;
        if (insecureCount > 0) {
            recs.push({
                type: 'security',
                title: 'Add Secure flag',
                text: insecureCount + ' cookie' + (insecureCount !== 1 ? 's' : '') + ' lack the Secure flag, making them vulnerable on HTTP connections.'
            });
        }

        var nonHttpOnlyCount = stats.total - stats.httpOnlyCount;
        if (nonHttpOnlyCount > 0) {
            recs.push({
                type: 'security',
                title: 'Add HttpOnly flag',
                text: nonHttpOnlyCount + ' cookie' + (nonHttpOnlyCount !== 1 ? 's' : '') + ' are accessible to JavaScript and could be stolen via XSS.'
            });
        }

        var noSameSiteCount = stats.total - stats.sameSiteCount;
        if (noSameSiteCount > 0) {
            recs.push({
                type: 'info',
                title: 'Set SameSite policy',
                text: noSameSiteCount + ' cookie' + (noSameSiteCount !== 1 ? 's' : '') + ' lack a SameSite policy, increasing CSRF risk.'
            });
        }

        if (stats.longLivedCount > 0) {
            recs.push({
                type: 'info',
                title: 'Reduce cookie lifespan',
                text: stats.longLivedCount + ' cookie' + (stats.longLivedCount !== 1 ? 's' : '') + ' persist longer than 1 year. Shorter lifespans reduce tracking exposure.'
            });
        }

        // Limit to 5
        return recs.slice(0, 5);
    }

    // ========================================================================
    // Rendering
    // ========================================================================

    function render(analysis) {
        // Show/hide the empty state vs content sections
        var emptyEl = document.getElementById('healthEmpty');
        var scoreSection = document.querySelector('.health-score-section');
        var categoriesEl = document.getElementById('healthCategories');
        var trackersSection = document.getElementById('healthTrackers');
        var recsSection = document.getElementById('healthRecommendations');
        var actionsSection = document.getElementById('healthActions');

        if (analysis.totalCookies === 0) {
            // No cookies: show empty state, hide everything else
            if (emptyEl) emptyEl.hidden = false;
            if (scoreSection) scoreSection.style.display = 'none';
            if (categoriesEl) categoriesEl.style.display = 'none';
            if (trackersSection) trackersSection.hidden = true;
            if (recsSection) recsSection.hidden = true;
            if (actionsSection) actionsSection.hidden = true;
            return;
        }

        // Has cookies: hide empty state, show content
        if (emptyEl) emptyEl.hidden = true;
        if (scoreSection) scoreSection.style.display = '';
        if (categoriesEl) categoriesEl.style.display = '';

        renderScoreCircle(analysis);
        renderCategoryBreakdown(analysis);
        renderTrackers(analysis);
        renderRecommendations(analysis);
        setupQuickActions(analysis);
    }

    function renderScoreCircle(analysis) {
        // healthGrade displays grade letter (HTML id="healthGrade")
        var gradeEl = document.getElementById('healthGrade');
        // healthSummary displays summary text (HTML id="healthSummary")
        var summaryEl = document.getElementById('healthSummary');
        // healthRingFill is the SVG circle to animate (HTML id="healthRingFill")
        var circleEl = document.getElementById('healthRingFill');

        if (!gradeEl || !circleEl) return;

        gradeEl.textContent = analysis.grade;
        gradeEl.style.color = analysis.gradeColor;

        if (summaryEl) {
            summaryEl.textContent = analysis.totalCookies + ' cookie' + (analysis.totalCookies !== 1 ? 's' : '') + ' analyzed \u2014 Score: ' + analysis.overallScore + '/100';
        }

        // Animate the SVG circle
        // Circle: r=52 (from HTML), circumference = 2 * PI * 52 = 326.73
        var circumference = 2 * Math.PI * 52;
        var offset = circumference - (analysis.overallScore / 100) * circumference;
        circleEl.style.strokeDasharray = circumference;
        circleEl.style.strokeDashoffset = offset;
        circleEl.style.stroke = analysis.gradeColor;
    }

    function renderCategoryBreakdown(analysis) {
        // Map analysis category keys to HTML element IDs
        // HTML has: catSecure/catSecureFill, catHttpOnly/catHttpOnlyFill,
        //           catSameSite/catSameSiteFill, catTrackers/catTrackersFill
        var mapping = [
            { key: 'secure',   valueId: 'catSecure',   fillId: 'catSecureFill' },
            { key: 'httpOnly', valueId: 'catHttpOnly',  fillId: 'catHttpOnlyFill' },
            { key: 'sameSite', valueId: 'catSameSite',  fillId: 'catSameSiteFill' },
            { key: 'trackers', valueId: 'catTrackers',  fillId: 'catTrackersFill' }
        ];

        var categories = analysis.categories;

        for (var i = 0; i < mapping.length; i++) {
            var m = mapping[i];
            var cat = categories[m.key];
            if (!cat) continue;

            var valueEl = document.getElementById(m.valueId);
            var fillEl = document.getElementById(m.fillId);

            if (valueEl) {
                valueEl.textContent = cat.score + '/100';
                valueEl.style.color = getGrade(cat.score).color;
            }

            if (fillEl) {
                fillEl.style.width = cat.score + '%';
                fillEl.style.backgroundColor = getGrade(cat.score).color;
            }
        }
    }

    function renderTrackers(analysis) {
        // healthTrackers is the parent section (hidden by default in HTML)
        var section = document.getElementById('healthTrackers');
        // healthTrackerList is the container for tracker items
        var container = document.getElementById('healthTrackerList');

        if (!container) return;

        container.textContent = '';

        if (analysis.trackers.length === 0) {
            // No trackers: hide the entire section
            if (section) section.hidden = true;
            return;
        }

        // Has trackers: show the section
        if (section) section.hidden = false;

        for (var i = 0; i < analysis.trackers.length; i++) {
            var tracker = analysis.trackers[i];
            var item = document.createElement('div');
            item.className = 'health-tracker-item';

            var iconDiv = document.createElement('div');
            iconDiv.className = 'health-tracker-icon';
            iconDiv.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>';

            var infoDiv = document.createElement('div');
            infoDiv.className = 'health-tracker-info';

            var nameSpan = document.createElement('span');
            nameSpan.className = 'health-tracker-name';
            nameSpan.textContent = tracker.cookieName;

            var labelSpan = document.createElement('span');
            labelSpan.className = 'health-tracker-label';
            labelSpan.textContent = tracker.label + ' (' + tracker.company + ')';

            infoDiv.appendChild(nameSpan);
            infoDiv.appendChild(labelSpan);

            item.appendChild(iconDiv);
            item.appendChild(infoDiv);

            container.appendChild(item);
        }
    }

    function renderRecommendations(analysis) {
        // healthRecommendations is the parent section (hidden by default)
        var section = document.getElementById('healthRecommendations');
        // healthRecList is the actual list container inside the section
        var container = document.getElementById('healthRecList');
        if (!container) return;

        container.textContent = '';

        if (analysis.recommendations.length === 0) {
            // No recommendations: hide section or show "all clear"
            if (section) section.hidden = false;
            var allGood = document.createElement('div');
            allGood.className = 'health-rec-empty';
            allGood.textContent = 'All clear! Your cookies look healthy.';
            container.appendChild(allGood);
            return;
        }

        // Has recommendations: show the section
        if (section) section.hidden = false;

        for (var i = 0; i < analysis.recommendations.length; i++) {
            var rec = analysis.recommendations[i];
            var card = document.createElement('div');
            card.className = 'health-rec-card health-rec-' + rec.type;

            var iconEl = document.createElement('div');
            iconEl.className = 'health-rec-icon';
            if (rec.type === 'warning') {
                iconEl.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';
            } else if (rec.type === 'security') {
                iconEl.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>';
            } else {
                iconEl.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';
            }

            var textDiv = document.createElement('div');
            textDiv.className = 'health-rec-text';

            var titleEl = document.createElement('strong');
            titleEl.textContent = rec.title;

            var descEl = document.createElement('p');
            descEl.textContent = rec.text;

            textDiv.appendChild(titleEl);
            textDiv.appendChild(descEl);

            card.appendChild(iconEl);
            card.appendChild(textDiv);

            container.appendChild(card);
        }
    }

    function setupQuickActions(analysis) {
        // healthActions is the parent section (hidden by default in HTML)
        var actionsSection = document.getElementById('healthActions');
        // cleanTrackersBtn is the button ID in HTML
        var cleanTrackersBtn = document.getElementById('cleanTrackersBtn');

        var hasTrackers = analysis.trackers.length > 0;

        // Show the actions section only if there are trackers to clean
        if (actionsSection) {
            actionsSection.hidden = !hasTrackers;
        }

        if (cleanTrackersBtn) {
            // Remove old listeners by replacing node
            var newCleanBtn = cleanTrackersBtn.cloneNode(true);
            cleanTrackersBtn.parentNode.replaceChild(newCleanBtn, cleanTrackersBtn);

            newCleanBtn.disabled = !hasTrackers;
            newCleanBtn.addEventListener('click', function () {
                cleanTrackingCookies(analysis.trackers);
            });
        }
    }

    // ========================================================================
    // Quick Actions
    // ========================================================================

    function cleanTrackingCookies(trackers) {
        if (!trackers || trackers.length === 0) return;

        var count = trackers.length;
        var msg = 'Delete ' + count + ' tracking cookie' + (count !== 1 ? 's' : '') + '? This cannot be undone.';

        if (typeof showConfirm === 'function') {
            showConfirm('Clean Tracking Cookies?', msg, function () {
                doCleanTrackers(trackers);
            });
        } else {
            doCleanTrackers(trackers);
        }
    }

    function doCleanTrackers(trackers) {
        var promises = [];
        for (var i = 0; i < trackers.length; i++) {
            var t = trackers[i];
            var domain = t.cookieDomain;
            if (domain.indexOf('.') === 0) domain = domain.slice(1);
            var url = 'https://' + domain + '/';

            promises.push(
                chrome.runtime.sendMessage({
                    action: 'DELETE_COOKIE',
                    payload: { url: url, name: t.cookieName }
                }).catch(function () { return null; })
            );
        }

        Promise.all(promises).then(function (results) {
            // Count how many deletions actually succeeded vs returned errors
            var failed = 0;
            var firstError = null;
            for (var r = 0; r < results.length; r++) {
                var res = results[r];
                if (res && typeof res === 'object' && res.error) {
                    failed++;
                    if (!firstError) firstError = res.error;
                }
            }
            var succeeded = trackers.length - failed;

            if (typeof showToast === 'function') {
                if (failed === trackers.length) {
                    // All failed
                    showToast(firstError || 'Failed to remove tracking cookies', 'error');
                } else if (failed > 0) {
                    // Partial success
                    showToast('Removed ' + succeeded + ' of ' + trackers.length + ' tracking cookies (' + failed + ' failed)', 'success');
                } else {
                    showToast('Removed ' + trackers.length + ' tracking cookie' + (trackers.length !== 1 ? 's' : ''), 'success');
                }
            }
            // Reload and re-analyze
            refreshHealth();
            // Reload main cookie list if available
            if (typeof loadCookies === 'function') {
                loadCookies();
            }
        });
    }

    function secureAllCookies() {
        var insecure = [];
        for (var i = 0; i < _cookies.length; i++) {
            if (!_cookies[i].secure) {
                insecure.push(_cookies[i]);
            }
        }

        if (insecure.length === 0) return;

        var msg = 'Set Secure flag on ' + insecure.length + ' cookie' + (insecure.length !== 1 ? 's' : '') + '? Some cookies may not work on HTTP-only sites.';

        if (typeof showConfirm === 'function') {
            showConfirm('Secure All Cookies?', msg, function () {
                doSecureAll(insecure);
            });
        } else {
            doSecureAll(insecure);
        }
    }

    function doSecureAll(insecure) {
        var promises = [];
        for (var i = 0; i < insecure.length; i++) {
            var c = insecure[i];
            var payload = {
                name: c.name,
                value: c.value,
                domain: c.domain,
                path: c.path,
                secure: true,
                httpOnly: c.httpOnly,
                sameSite: c.sameSite
            };
            if (c.expirationDate) {
                payload.expirationDate = c.expirationDate;
            }

            promises.push(
                chrome.runtime.sendMessage({
                    action: 'SET_COOKIE',
                    payload: payload
                }).catch(function () { return null; })
            );
        }

        Promise.all(promises).then(function (results) {
            // Count how many operations actually succeeded vs returned errors
            var failed = 0;
            var firstError = null;
            for (var r = 0; r < results.length; r++) {
                var res = results[r];
                if (res && typeof res === 'object' && res.error) {
                    failed++;
                    if (!firstError) firstError = res.error;
                }
            }
            var succeeded = insecure.length - failed;

            if (typeof showToast === 'function') {
                if (failed === insecure.length) {
                    // All failed
                    showToast(firstError || 'Failed to secure cookies', 'error');
                } else if (failed > 0) {
                    showToast('Secured ' + succeeded + ' of ' + insecure.length + ' cookies (' + failed + ' failed)', 'success');
                } else {
                    showToast('Secured ' + insecure.length + ' cookie' + (insecure.length !== 1 ? 's' : ''), 'success');
                }
            }
            refreshHealth();
            if (typeof loadCookies === 'function') {
                loadCookies();
            }
        });
    }

    // ========================================================================
    // Data Loading
    // ========================================================================

    function fetchCookiesAndAnalyze() {
        // Guard against concurrent fetches from rapid tab switching
        if (_fetchInProgress) {
            return Promise.resolve(_analysis);
        }
        _fetchInProgress = true;

        return new Promise(function (resolve) {
            chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                var tab = tabs && tabs[0];
                if (!tab || !tab.url || tab.url.indexOf('chrome://') === 0 || tab.url.indexOf('chrome-extension://') === 0) {
                    _cookies = [];
                    _analysis = analyzeCookies([]);
                    render(_analysis);
                    _fetchInProgress = false;
                    resolve(_analysis);
                    return;
                }

                chrome.runtime.sendMessage({
                    action: 'GET_COOKIES',
                    payload: { url: tab.url }
                }).then(function (response) {
                    if (Array.isArray(response)) {
                        _cookies = response;
                    } else {
                        _cookies = [];
                    }
                    _analysis = analyzeCookies(_cookies);
                    render(_analysis);
                    _fetchInProgress = false;
                    resolve(_analysis);
                }).catch(function () {
                    _cookies = [];
                    _analysis = analyzeCookies([]);
                    render(_analysis);
                    _fetchInProgress = false;
                    resolve(_analysis);
                });
            });
        });
    }

    function refreshHealth() {
        return fetchCookiesAndAnalyze();
    }

    // ========================================================================
    // Public API
    // ========================================================================

    return {
        /**
         * Initialize the Health tab. Called once on DOMContentLoaded.
         */
        init: function () {
            if (_initialized) return;
            _initialized = true;
            // Initial load happens when tab becomes visible
        },

        /**
         * Called when Health tab becomes visible. Triggers (re)analysis.
         */
        onShow: function () {
            return fetchCookiesAndAnalyze();
        },

        /**
         * Get current analysis without re-fetching.
         */
        getAnalysis: function () {
            return _analysis;
        },

        /**
         * Force refresh.
         */
        refresh: refreshHealth,

        /**
         * Exposed for testing.
         */
        _analyzeCookies: analyzeCookies,
        _detectTrackers: detectTrackers
    };
})();
