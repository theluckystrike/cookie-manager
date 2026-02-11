# MD 20 — Performance Optimization Guide
**Status:** Complete
**Date:** 2026-02-11
**Extension:** Cookie Manager (zovo.one)

## Overview

- Adapted performance optimization patterns for a 100% local Chrome extension
- Implemented performance timing, storage optimization, performance auditing, and popup rendering improvements
- All profiling and metrics stored locally — zero external requests

## Architecture

- Performance timing module tracks operation durations with P50/P95 percentile analysis
- Storage optimizer provides batched writes, usage tracking, and automatic cleanup
- CLI audit script enforces file size budgets and reports code quality metrics
- Popup search debounced to reduce unnecessary renders

## New Files Created

### 1. `src/shared/perf-timer.js` (~200 lines)

- Performance marks and measures with fallback to Date.now()
- Operation timer pairs (startTimer/endTimer) with high-resolution timing
- Debounce and throttle utility functions
- Performance budget checker with Cookie Manager-specific thresholds
- P50/P95 percentile timing summary
- Persistence to chrome.storage.local
- Idle scheduler wrapping requestIdleCallback

### 2. `src/shared/storage-optimizer.js` (~200 lines)

- Batch writer with debounced auto-flush (500ms)
- Batch reader merging pending writes with stored data
- Storage usage tracker with ok/warning/critical status thresholds
- Automatic cleanup of known storage keys (errorLogs, analytics, etc.)
- Key size analyzer for identifying storage-heavy entries
- Auto-compact for scheduled maintenance

### 3. `scripts/perf-audit.js` (~200 lines)

- Zero-dependency Node.js CLI audit tool
- File size analysis grouped by directory
- Performance budget enforcement with color-coded PASS/WARN/FAIL
- Code quality metrics (lines, functions, storage operations)
- Module dependency map
- CI-friendly exit codes

## Files Modified

### 1. `src/background/service-worker.js`

- Added importScripts for perf-timer.js and storage-optimizer.js
- 5 new message handlers: GET_PERF_SUMMARY, CHECK_PERF_BUDGETS, GET_STORAGE_USAGE, RUN_STORAGE_CLEANUP, ANALYZE_STORAGE_KEYS
- StorageOptimizer.autoCompact() integrated into maintenance alarm

### 2. `src/popup/popup.js`

- Search input debounced (150ms) to reduce unnecessary cookie list re-renders

### 3. `manifests/firefox.json`

- Added perf-timer.js and storage-optimizer.js to background scripts

## Performance Budgets

| Target | Budget | Purpose |
|---|---|---|
| service-worker.js | < 50KB | Fast service worker startup |
| popup.js | < 60KB | Quick popup open |
| Single shared module | < 30KB | Modular loading |
| Total shared modules | < 200KB | Reasonable total footprint |
| Total extension JS | < 500KB | Chrome store compliance |

## Message Flow

```
Popup → GET_PERF_SUMMARY → Service Worker → PerfTimer.getSummary() → timing stats
Popup → GET_STORAGE_USAGE → Service Worker → StorageOptimizer.getUsage() → usage report
Maintenance Alarm → StorageOptimizer.autoCompact() → trimmed storage
```

## Security Considerations

- All timing data stored locally only
- No external reporting or telemetry
- Storage cleanup preserves data integrity (only trims oldest entries)
- Perf audit script runs offline with zero network access

## Testing Checklist

- [ ] PerfTimer.startTimer/endTimer returns correct durations
- [ ] PerfTimer.checkBudgets returns pass/fail results
- [ ] StorageOptimizer.batchSet accumulates and flushes correctly
- [ ] StorageOptimizer.getUsage returns accurate byte counts
- [ ] StorageOptimizer.cleanup trims known keys to specified limits
- [ ] perf-audit.js runs and reports file sizes accurately
- [ ] perf-audit.js exits with code 0 when budgets pass
- [ ] Search input debounce reduces render frequency
- [ ] Firefox manifest loads new background scripts
- [ ] Service worker imports new modules via importScripts
