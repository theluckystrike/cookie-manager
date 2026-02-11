# Phase 22: Version Release Management

## Objective

Establish professional version and release management for the Cookie Manager Chrome Extension. This phase introduces automated version bumping, pre-release validation, feature flags, update tracking, and a structured release workflow -- ensuring every published build is consistent, auditable, and safe.

## What Was Implemented

### 1. `src/shared/version-manager.js` — VersionManager Module

A zero-dependency version management library exposed as `VersionManager` on the global scope. Provides five sub-modules:

- **VersionInfo** — `getCurrent()` returns `{ version, manifestVersion, environment }` by reading from `chrome.runtime.getManifest()`. `compare(a, b)` performs semver comparison returning -1, 0, or 1. `parse(versionString)` splits a version string into `{ major, minor, patch }`.
- **FeatureFlags** — `getAll()` returns the full flag map with defaults. `isEnabled(flagName)` checks whether a specific flag is active (consulting storage overrides first, then defaults). `setOverride(flagName, value)` persists a per-flag override to `chrome.storage.local`. `clearOverrides()` removes all stored overrides.
- **UpdateTracker** — `onUpdate(previousVersion, currentVersion)` records the update event with a timestamp in storage. `getHistory()` returns the array of all recorded version transitions. `isFirstRun()` returns `true` when no previous version is stored.
- **ReleaseNotes** — `getForVersion(version)` returns the release notes object (summary, highlights array, date) for a given version. `getLatest()` returns notes for the current version. `hasUnread()` checks whether the user has seen the latest notes. `markAsRead()` sets the read flag in storage.
- **ChangelogHelper** — `formatEntry(version, changes)` produces a Keep a Changelog-formatted string for a single version. `getRecentEntries(count)` returns the last N entries from the embedded changelog data.

### 2. `scripts/bump-version.js` — Version Bump CLI

A Node.js CLI tool that bumps the extension version consistently across every location where it appears:

- `manifest.json` (root)
- `manifests/base.json`
- `manifests/firefox.json`
- `package.json`

Usage:

```
node scripts/bump-version.js <major|minor|patch> [--dry-run]
```

The tool parses the current version from `manifest.json`, computes the next version according to the requested bump level, updates all four files in place, and prints a summary of changes. The `--dry-run` flag previews what would change without writing to disk.

### 3. `scripts/release-checklist.js` — Pre-Release Validation CLI

A Node.js script that runs a suite of checks before any release is published:

| Check Category | What It Validates |
|---|---|
| Manifest consistency | Version strings match across all manifest and package files |
| File integrity | All files referenced in manifests exist on disk |
| Security | No inline scripts, no `eval()` usage, CSP is present and correct |
| Extension size | Total uncompressed size stays below 10 MB CWS limit |
| Locales | All `__MSG_*__` tokens resolve in every locale |
| Icons | All declared icon sizes exist and are valid PNGs |

Usage:

```
node scripts/release-checklist.js [--fix] [--verbose]
```

Exits with code 0 if all checks pass, or code 1 with a detailed report of failures. The `--fix` flag auto-corrects version mismatches by syncing everything to the root `manifest.json` version.

### 4. Service Worker Integration

The background service worker (`src/background/service-worker.js`) was extended with:

- **`onInstalled` handler** — Detects `install` vs. `update` reason. On install, records first-run state via `UpdateTracker`. On update, records the version transition and sets an `unreadReleaseNotes` flag.
- **Four new message handlers:**
  - `GET_VERSION_INFO` — Returns current version info via `VersionInfo.getCurrent()`.
  - `GET_FEATURE_FLAGS` — Returns the full feature flag map including overrides.
  - `GET_RELEASE_NOTES` — Returns release notes for the current version.
  - `CHECK_FOR_UPDATE` — Compares the stored previous version with the current version and returns update status.
- **Feature flag override loading** — On startup, loads any persisted flag overrides from `chrome.storage.local` and merges them into the runtime flag map.

### 5. Popup Integration

The popup (`src/popup/index.html` and `src/popup/popup.js`) now displays the extension version in the footer area. On load, the popup sends a `GET_VERSION_INFO` message to the service worker and renders the returned version string (e.g., "v1.0.0") in a `<span class="version-label">` element.

## Feature Flags

The following feature flags ship with this release. All flags default to **enabled** unless noted otherwise.

| Flag Name | Default | Description |
|---|---|---|
| `cookieEditing` | Enabled | Allow users to edit cookie values |
| `jwtDecoder` | Enabled | Show decoded JWT payload for token cookies |
| `exportJson` | Enabled | Enable the export-as-JSON button |
| `readOnlyMode` | Enabled | Show the read-only mode toggle |
| `contextMenu` | Enabled | Register right-click context menu items |
| `darkMode` | Enabled | Follow system dark mode preference |
| `feedbackCollector` | Enabled | Show the feedback prompt after milestone events |
| `releaseNotes` | Enabled | Display release notes popup after an update |

Flags can be overridden at runtime through `VersionManager.FeatureFlags.setOverride(flagName, value)` for testing or staged rollouts.

## Release Process Workflow

Every release follows this four-step workflow:

1. **Bump version** — Run `node scripts/bump-version.js <major|minor|patch>` to increment the version across all manifests and `package.json`.
2. **Run release checklist** — Run `node scripts/release-checklist.js --verbose` to validate manifest consistency, file integrity, security posture, and extension size.
3. **Commit and tag** — Commit all changed files with the message `release: vX.Y.Z` and create a git tag `vX.Y.Z`.
4. **Publish** — Upload the packaged `.zip` to the Chrome Web Store and submit for review. For Firefox, upload to AMO using the Firefox-specific manifest.

## Version Format

All versions follow **Semantic Versioning** (`MAJOR.MINOR.PATCH`):

- **MAJOR** — Incompatible changes or complete redesigns.
- **MINOR** — New features added in a backward-compatible manner.
- **PATCH** — Backward-compatible bug fixes and minor improvements.

## Scripts Reference

| Script | Command | Purpose |
|---|---|---|
| Version bump | `node scripts/bump-version.js <level>` | Bump version across all manifests |
| Release checklist | `node scripts/release-checklist.js` | Pre-release validation suite |
| Performance audit | `node scripts/perf-audit.js` | Audit runtime performance metrics |
| Accessibility audit | `node scripts/a11y-audit.js` | WCAG 2.1 AA compliance checks |
| Security scan | `node scripts/security-scan.js` | Static security analysis |
| Build / Package | `npm run package` | Create distributable `.zip` archive |
