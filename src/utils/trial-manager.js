/**
 * Trial Manager
 * Handles 7-day free trial logic, daily expiry checks, and notifications.
 * IIFE pattern - exposes TrialManager globally on self and window.
 */
(function (root) {
    'use strict';

    var CONFIG = {
        trialDurationDays: 7,
        storageKey: 'trialData',
        alarmName: 'trialDailyCheck',
        alarmPeriodMinutes: 1440, // 24 hours
        upgradeUrl: 'https://www.zovo.one/cookie-manager/upgrade'
    };

    /**
     * Start the free trial. Creates trial data in chrome.storage.local if it
     * does not already exist, and sets up the daily check alarm.
     * @returns {Promise<{started: boolean, expiresAt: string}>}
     */
    function startTrial() {
        return chrome.storage.local.get(CONFIG.storageKey).then(function (result) {
            var existing = result[CONFIG.storageKey];
            if (existing) {
                // Trial already started - don't overwrite
                return { started: false, expiresAt: new Date(existing.expiresAtMs).toISOString() };
            }

            var now = Date.now();
            var expiresAtMs = now + CONFIG.trialDurationDays * 24 * 60 * 60 * 1000;

            var trialData = {
                startedAtMs: now,
                expiresAtMs: expiresAtMs,
                expired: false,
                convertedToPaid: false,
                reminderSentDays: []
            };

            var obj = {};
            obj[CONFIG.storageKey] = trialData;

            return chrome.storage.local.set(obj).then(function () {
                // Create the daily check alarm only if it doesn't already exist
                return new Promise(function (resolve) {
                    chrome.alarms.get(CONFIG.alarmName, function (existing) {
                        if (!existing) {
                            chrome.alarms.create(CONFIG.alarmName, { periodInMinutes: CONFIG.alarmPeriodMinutes });
                        }
                        resolve({ started: true, expiresAt: new Date(expiresAtMs).toISOString() });
                    });
                });
            });
        }).catch(function (e) {
            console.error('[TrialManager] Error starting trial:', e);
            return { started: false, error: e.message };
        });
    }

    /**
     * Read the raw trial data from chrome.storage.local
     * @returns {Promise<Object|null>}
     */
    function getTrialData() {
        return chrome.storage.local.get(CONFIG.storageKey).then(function (result) {
            return result[CONFIG.storageKey] || null;
        }).catch(function (e) {
            console.error('[TrialManager] Error reading trial data:', e);
            return null;
        });
    }

    /**
     * Check whether the trial is currently active (exists, not expired, not converted)
     * @returns {Promise<boolean>}
     */
    function isTrialActive() {
        return getTrialData().then(function (data) {
            if (!data) return false;
            if (data.convertedToPaid) return false;
            if (data.expired) return false;
            if (Date.now() >= data.expiresAtMs) return false;
            return true;
        });
    }

    /**
     * Calculate remaining days (0 if expired or no trial)
     * @returns {Promise<number>}
     */
    function getDaysRemaining() {
        return getTrialData().then(function (data) {
            if (!data) return 0;
            var remaining = data.expiresAtMs - Date.now();
            if (remaining <= 0) return 0;
            return Math.ceil(remaining / (24 * 60 * 60 * 1000));
        });
    }

    /**
     * Get the trial expiry date as an ISO string
     * @returns {Promise<string|null>}
     */
    function getExpiryDate() {
        return getTrialData().then(function (data) {
            if (!data) return null;
            return new Date(data.expiresAtMs).toISOString();
        });
    }

    /**
     * Check if the trial has expired (flag or time-based)
     * @returns {Promise<boolean>}
     */
    function isExpired() {
        return getTrialData().then(function (data) {
            if (!data) return false;
            if (data.expired) return true;
            if (Date.now() >= data.expiresAtMs) return true;
            return false;
        });
    }

    /**
     * Check if a trial was ever started
     * @returns {Promise<boolean>}
     */
    function wasTrialStarted() {
        return getTrialData().then(function (data) {
            return data !== null;
        });
    }

    /**
     * Daily check called by the alarm handler.
     * - Checks remaining days
     * - Sends reminder notification at 2 days remaining
     * - Marks expired when done and sends expiry notification
     * - Clears alarm when trial is over or converted
     * @returns {Promise<void>}
     */
    function dailyCheck() {
        return getTrialData().then(function (data) {
            if (!data) return;

            // Already converted - no need for checks
            if (data.convertedToPaid) {
                return chrome.alarms.clear(CONFIG.alarmName);
            }

            var now = Date.now();
            var remainingMs = data.expiresAtMs - now;
            var daysRemaining = Math.ceil(remainingMs / (24 * 60 * 60 * 1000));

            // Trial has expired
            if (remainingMs <= 0) {
                if (!data.expired) {
                    data.expired = true;
                    var obj = {};
                    obj[CONFIG.storageKey] = data;
                    return chrome.storage.local.set(obj).then(function () {
                        return sendExpiryNotification();
                    }).then(function () {
                        return chrome.alarms.clear(CONFIG.alarmName);
                    });
                }
                // Already marked expired - just clear alarm
                return chrome.alarms.clear(CONFIG.alarmName);
            }

            // Send reminder at 2 days remaining (only once)
            if (daysRemaining <= 2 && data.reminderSentDays.indexOf(daysRemaining) === -1) {
                data.reminderSentDays.push(daysRemaining);
                var obj = {};
                obj[CONFIG.storageKey] = data;
                return chrome.storage.local.set(obj).then(function () {
                    return sendReminderNotification(daysRemaining);
                });
            }
        }).catch(function (e) {
            console.error('[TrialManager] Daily check error:', e);
        });
    }

    /**
     * Send a reminder notification about upcoming trial expiry
     * @param {number} daysRemaining
     * @returns {Promise<void>}
     */
    function sendReminderNotification(daysRemaining) {
        return new Promise(function (resolve) {
            try {
                chrome.notifications.create('trial-reminder', {
                    type: 'basic',
                    iconUrl: 'assets/icons/icon-128.png',
                    title: 'Cookie Manager Pro Trial',
                    message: 'Your free trial expires in ' + daysRemaining + ' day' + (daysRemaining !== 1 ? 's' : '') + '. Upgrade now to keep Pro features!',
                    priority: 1
                }, function () {
                    // Suppress any error from notifications
                    void chrome.runtime.lastError;
                    resolve();
                });
            } catch (e) {
                console.warn('[TrialManager] Could not create reminder notification:', e);
                resolve();
            }
        });
    }

    /**
     * Send a notification that the trial has expired
     * @returns {Promise<void>}
     */
    function sendExpiryNotification() {
        return new Promise(function (resolve) {
            try {
                chrome.notifications.create('trial-expired', {
                    type: 'basic',
                    iconUrl: 'assets/icons/icon-128.png',
                    title: 'Cookie Manager Pro Trial Ended',
                    message: 'Your 7-day free trial has expired. Upgrade to Pro to continue using advanced features.',
                    priority: 2
                }, function () {
                    void chrome.runtime.lastError;
                    resolve();
                });
            } catch (e) {
                console.warn('[TrialManager] Could not create expiry notification:', e);
                resolve();
            }
        });
    }

    /**
     * Mark the trial as converted to paid. Clears the daily check alarm.
     * @returns {Promise<{success: boolean}>}
     */
    function markConverted() {
        return getTrialData().then(function (data) {
            if (!data) {
                return { success: false, error: 'No trial data found' };
            }
            data.convertedToPaid = true;
            data.convertedAtMs = Date.now();
            var obj = {};
            obj[CONFIG.storageKey] = data;
            return chrome.storage.local.set(obj).then(function () {
                return chrome.alarms.clear(CONFIG.alarmName);
            }).then(function () {
                return { success: true };
            });
        }).catch(function (e) {
            console.error('[TrialManager] Error marking converted:', e);
            return { success: false, error: e.message };
        });
    }

    /**
     * Get a summary status object for the trial
     * @returns {Promise<Object>}
     */
    function getStatus() {
        return getTrialData().then(function (data) {
            if (!data) {
                return {
                    trialActive: false,
                    trialDaysLeft: 0,
                    trialExpired: false,
                    trialStarted: false
                };
            }

            var now = Date.now();
            var remainingMs = data.expiresAtMs - now;
            var daysLeft = remainingMs > 0 ? Math.ceil(remainingMs / (24 * 60 * 60 * 1000)) : 0;
            var expired = data.expired || now >= data.expiresAtMs;
            var active = !expired && !data.convertedToPaid;

            return {
                trialActive: active,
                trialDaysLeft: daysLeft,
                trialExpired: expired,
                trialStarted: true
            };
        });
    }

    // Public API
    var TrialManager = {
        CONFIG: CONFIG,
        startTrial: startTrial,
        getTrialData: getTrialData,
        isTrialActive: isTrialActive,
        getDaysRemaining: getDaysRemaining,
        getExpiryDate: getExpiryDate,
        isExpired: isExpired,
        wasTrialStarted: wasTrialStarted,
        dailyCheck: dailyCheck,
        sendReminderNotification: sendReminderNotification,
        sendExpiryNotification: sendExpiryNotification,
        markConverted: markConverted,
        getStatus: getStatus
    };

    // Expose globally on both self (service worker) and window (popup/pages)
    if (typeof self !== 'undefined') self.TrialManager = TrialManager;
    if (typeof window !== 'undefined') window.TrialManager = TrialManager;

})(typeof self !== 'undefined' ? self : typeof window !== 'undefined' ? window : this);
