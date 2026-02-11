(function () {
  'use strict';

  // ---------------------------------------------------------------------------
  // Internal state
  // ---------------------------------------------------------------------------

  var MAX_BUFFER = 200;
  var MAX_PERSIST = 500;
  var STORAGE_KEY = '_perf_timings';

  var measurements = [];
  var activeTimers = {};

  // ---------------------------------------------------------------------------
  // Environment detection
  // ---------------------------------------------------------------------------

  var hasPerformance = (typeof performance !== 'undefined' && typeof performance.now === 'function');
  var hasPerformanceMark = (hasPerformance && typeof performance.mark === 'function');
  var hasPerformanceMeasure = (hasPerformance && typeof performance.measure === 'function');
  var hasChromeStorage = (typeof chrome !== 'undefined' && chrome !== null &&
    typeof chrome.storage !== 'undefined' && chrome.storage !== null &&
    typeof chrome.storage.local !== 'undefined' && chrome.storage.local !== null);
  var hasRequestIdleCallback = (typeof requestIdleCallback === 'function');

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  function now() {
    try {
      if (hasPerformance) {
        return performance.now();
      }
    } catch (e) { /* fall through */ }
    return Date.now();
  }

  function timestamp() {
    try {
      return Date.now();
    } catch (e) {
      return 0;
    }
  }

  function addToBuffer(entry) {
    try {
      measurements.push(entry);
      if (measurements.length > MAX_BUFFER) {
        measurements = measurements.slice(measurements.length - MAX_BUFFER);
      }
    } catch (e) { /* silently discard */ }
  }

  function percentile(sortedArr, p) {
    try {
      if (!sortedArr || sortedArr.length === 0) {
        return 0;
      }
      var index = Math.ceil((p / 100) * sortedArr.length) - 1;
      if (index < 0) { index = 0; }
      if (index >= sortedArr.length) { index = sortedArr.length - 1; }
      return sortedArr[index];
    } catch (e) {
      return 0;
    }
  }

  // ---------------------------------------------------------------------------
  // 1. Performance Marks & Measures
  // ---------------------------------------------------------------------------

  function mark(name) {
    try {
      if (hasPerformanceMark) {
        performance.mark(name);
      }
      addToBuffer({
        type: 'mark',
        name: name,
        timestamp: timestamp()
      });
    } catch (e) { /* silently discard */ }
  }

  function measure(name, startMark, endMark) {
    var duration = 0;
    try {
      if (hasPerformanceMeasure) {
        try {
          var entry = performance.measure(name, startMark, endMark);
          if (entry && typeof entry.duration === 'number') {
            duration = entry.duration;
          }
        } catch (measureErr) {
          // Marks may not exist; compute from buffer as fallback
          duration = computeDurationFromBuffer(startMark, endMark);
        }
      } else {
        duration = computeDurationFromBuffer(startMark, endMark);
      }
      addToBuffer({
        type: 'measure',
        name: name,
        startMark: startMark,
        endMark: endMark,
        duration: duration,
        timestamp: timestamp()
      });
    } catch (e) { /* silently discard */ }
    return duration;
  }

  function computeDurationFromBuffer(startName, endName) {
    try {
      var startTs = 0;
      var endTs = 0;
      for (var i = measurements.length - 1; i >= 0; i--) {
        var m = measurements[i];
        if (m.type === 'mark') {
          if (m.name === endName && endTs === 0) {
            endTs = m.timestamp;
          }
          if (m.name === startName && startTs === 0) {
            startTs = m.timestamp;
          }
        }
        if (startTs !== 0 && endTs !== 0) { break; }
      }
      if (startTs !== 0 && endTs !== 0) {
        return endTs - startTs;
      }
    } catch (e) { /* fall through */ }
    return 0;
  }

  // ---------------------------------------------------------------------------
  // 2. Operation Timer
  // ---------------------------------------------------------------------------

  function startTimer(label) {
    try {
      activeTimers[label] = {
        start: now(),
        timestamp: timestamp()
      };
    } catch (e) { /* silently discard */ }
  }

  function endTimer(label) {
    try {
      var timer = activeTimers[label];
      if (!timer) {
        return null;
      }
      var duration = now() - timer.start;
      var result = {
        label: label,
        duration: duration,
        timestamp: timer.timestamp
      };
      delete activeTimers[label];
      addToBuffer({
        type: 'timer',
        label: label,
        duration: duration,
        timestamp: timer.timestamp
      });
      return result;
    } catch (e) {
      return null;
    }
  }

  // ---------------------------------------------------------------------------
  // 3. Debounce & Throttle
  // ---------------------------------------------------------------------------

  function debounce(fn, delay) {
    var timeoutId = null;
    return function debounced() {
      var ctx = this;
      var args = arguments;
      try {
        if (timeoutId !== null) {
          clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(function () {
          timeoutId = null;
          try {
            fn.apply(ctx, args);
          } catch (e) { /* silently discard */ }
        }, delay);
      } catch (e) { /* silently discard */ }
    };
  }

  function throttle(fn, limit) {
    var inThrottle = false;
    var lastArgs = null;
    var lastCtx = null;
    return function throttled() {
      var ctx = this;
      var args = arguments;
      try {
        if (!inThrottle) {
          try {
            fn.apply(ctx, args);
          } catch (e) { /* silently discard */ }
          inThrottle = true;
          lastArgs = null;
          lastCtx = null;
          setTimeout(function () {
            inThrottle = false;
            if (lastArgs !== null) {
              try {
                fn.apply(lastCtx, lastArgs);
              } catch (e) { /* silently discard */ }
              lastArgs = null;
              lastCtx = null;
            }
          }, limit);
        } else {
          lastArgs = args;
          lastCtx = ctx;
        }
      } catch (e) { /* silently discard */ }
    };
  }

  // ---------------------------------------------------------------------------
  // 4. Performance Budget Checker
  // ---------------------------------------------------------------------------

  var budgets = {
    popupOpen: 200,
    serviceWorkerWake: 150,
    storageRead: 100,
    storageWrite: 200,
    cookieListRender: 300,
    messageRoundTrip: 500
  };

  function checkBudgets() {
    var result = { passed: [], failed: [], warnings: [] };
    try {
      var latestByLabel = {};
      for (var i = 0; i < measurements.length; i++) {
        var m = measurements[i];
        var key = m.label || m.name;
        if (key && typeof m.duration === 'number') {
          latestByLabel[key] = m.duration;
        }
      }
      var budgetKeys = Object.keys(budgets);
      for (var j = 0; j < budgetKeys.length; j++) {
        var label = budgetKeys[j];
        var limit = budgets[label];
        if (typeof latestByLabel[label] === 'undefined') {
          continue;
        }
        var duration = latestByLabel[label];
        var entry = {
          label: label,
          budget: limit,
          actual: duration
        };
        if (duration <= limit) {
          result.passed.push(entry);
        } else if (duration <= limit * 1.2) {
          entry.overage = duration - limit;
          result.warnings.push(entry);
        } else {
          entry.overage = duration - limit;
          result.failed.push(entry);
        }
      }
    } catch (e) { /* return whatever we have */ }
    return result;
  }

  // ---------------------------------------------------------------------------
  // 5. Timing Summary
  // ---------------------------------------------------------------------------

  function getSummary() {
    var summary = {
      total: 0,
      averages: {},
      slowest: [],
      percentiles: {}
    };
    try {
      var grouped = {};
      for (var i = 0; i < measurements.length; i++) {
        var m = measurements[i];
        if (typeof m.duration !== 'number') { continue; }
        var key = m.label || m.name;
        if (!key) { continue; }
        if (!grouped[key]) {
          grouped[key] = [];
        }
        grouped[key].push(m.duration);
        summary.total++;
      }

      var allEntries = [];
      var keys = Object.keys(grouped);
      for (var j = 0; j < keys.length; j++) {
        var label = keys[j];
        var durations = grouped[label];
        var sum = 0;
        for (var k = 0; k < durations.length; k++) {
          sum += durations[k];
        }
        var avg = sum / durations.length;
        summary.averages[label] = Math.round(avg * 100) / 100;

        // Sort for percentile calculation
        var sorted = durations.slice().sort(function (a, b) { return a - b; });
        summary.percentiles[label] = {
          p50: Math.round(percentile(sorted, 50) * 100) / 100,
          p95: Math.round(percentile(sorted, 95) * 100) / 100
        };

        // Track for slowest
        var maxDuration = sorted[sorted.length - 1];
        allEntries.push({ label: label, duration: maxDuration });
      }

      // Sort slowest descending and take top 5
      allEntries.sort(function (a, b) { return b.duration - a.duration; });
      summary.slowest = allEntries.slice(0, 5);
    } catch (e) { /* return whatever we have */ }
    return summary;
  }

  // ---------------------------------------------------------------------------
  // 6. Storage Persistence
  // ---------------------------------------------------------------------------

  function persistTimings() {
    try {
      if (!hasChromeStorage) {
        return Promise.resolve(false);
      }
      var data = measurements.slice();
      if (data.length > MAX_PERSIST) {
        data = data.slice(data.length - MAX_PERSIST);
      }
      var payload = {};
      payload[STORAGE_KEY] = data;
      return new Promise(function (resolve) {
        try {
          chrome.storage.local.set(payload, function () {
            try {
              if (typeof chrome.runtime !== 'undefined' &&
                  chrome.runtime !== null &&
                  typeof chrome.runtime.lastError !== 'undefined' &&
                  chrome.runtime.lastError !== null) {
                resolve(false);
              } else {
                resolve(true);
              }
            } catch (e) {
              resolve(false);
            }
          });
        } catch (e) {
          resolve(false);
        }
      });
    } catch (e) {
      return Promise.resolve(false);
    }
  }

  function loadTimings() {
    try {
      if (!hasChromeStorage) {
        return Promise.resolve([]);
      }
      return new Promise(function (resolve) {
        try {
          chrome.storage.local.get(STORAGE_KEY, function (result) {
            try {
              if (typeof chrome.runtime !== 'undefined' &&
                  chrome.runtime !== null &&
                  typeof chrome.runtime.lastError !== 'undefined' &&
                  chrome.runtime.lastError !== null) {
                resolve([]);
                return;
              }
              var loaded = (result && result[STORAGE_KEY]) ? result[STORAGE_KEY] : [];
              if (Array.isArray(loaded)) {
                for (var i = 0; i < loaded.length; i++) {
                  addToBuffer(loaded[i]);
                }
              }
              resolve(loaded);
            } catch (e) {
              resolve([]);
            }
          });
        } catch (e) {
          resolve([]);
        }
      });
    } catch (e) {
      return Promise.resolve([]);
    }
  }

  // ---------------------------------------------------------------------------
  // 7. Idle Scheduler
  // ---------------------------------------------------------------------------

  function scheduleIdle(callback, timeout) {
    try {
      var opts = (typeof timeout === 'number') ? { timeout: timeout } : undefined;
      if (hasRequestIdleCallback) {
        return requestIdleCallback(function (deadline) {
          try {
            callback(deadline);
          } catch (e) { /* silently discard */ }
        }, opts);
      }
      // Fallback for service worker or environments without requestIdleCallback
      var fallbackTimeout = (typeof timeout === 'number') ? timeout : 50;
      return setTimeout(function () {
        try {
          // Provide a minimal deadline-like object
          var start = now();
          callback({
            didTimeout: false,
            timeRemaining: function () {
              var elapsed = now() - start;
              var remaining = Math.max(0, 50 - elapsed);
              return remaining;
            }
          });
        } catch (e) { /* silently discard */ }
      }, fallbackTimeout);
    } catch (e) {
      return -1;
    }
  }

  // ---------------------------------------------------------------------------
  // 8. Get raw timings
  // ---------------------------------------------------------------------------

  function getTimings() {
    try {
      return measurements.slice();
    } catch (e) {
      return [];
    }
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  var PerfTimer = {
    mark: mark,
    measure: measure,
    startTimer: startTimer,
    endTimer: endTimer,
    debounce: debounce,
    throttle: throttle,
    checkBudgets: checkBudgets,
    getSummary: getSummary,
    persistTimings: persistTimings,
    loadTimings: loadTimings,
    scheduleIdle: scheduleIdle,
    getTimings: getTimings
  };

  // Expose globally
  try {
    if (typeof self !== 'undefined') {
      self.PerfTimer = PerfTimer;
    }
  } catch (e) { /* not available */ }

  try {
    if (typeof window !== 'undefined') {
      window.PerfTimer = PerfTimer;
    }
  } catch (e) { /* not available */ }

})();
