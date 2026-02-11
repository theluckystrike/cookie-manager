#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');

const BROWSERS = ['chrome', 'firefox', 'edge'];

// Directories / globs to include in every build (relative to ROOT)
const SOURCE_DIRS = [
  'src',
  'assets/icons',
  '_locales',
  'onboarding',
  'shared',
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function log(msg) {
  console.log(`[build] ${msg}`);
}

function fatal(msg) {
  console.error(`[build] ERROR: ${msg}`);
  process.exit(1);
}

/** Recursively copy a directory, creating parents as needed. */
function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/** Deep-merge b into a (mutates a). Arrays are replaced, not concatenated. */
function deepMerge(a, b) {
  for (const key of Object.keys(b)) {
    if (
      a[key] && typeof a[key] === 'object' && !Array.isArray(a[key]) &&
      typeof b[key] === 'object' && !Array.isArray(b[key])
    ) {
      deepMerge(a[key], b[key]);
    } else {
      a[key] = b[key];
    }
  }
  return a;
}

// ---------------------------------------------------------------------------
// Manifest generation
// ---------------------------------------------------------------------------

function loadJSON(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function generateManifest(browser) {
  // Start from base manifest
  const basePath = path.join(ROOT, 'manifests', 'base.json');
  if (!fs.existsSync(basePath)) {
    fatal('manifests/base.json not found');
  }
  const manifest = loadJSON(basePath);

  // Merge browser-specific override file if it exists
  const overridePath = path.join(ROOT, 'manifests', `${browser}.json`);
  if (fs.existsSync(overridePath)) {
    const override = loadJSON(overridePath);
    log(`  Merging overrides from manifests/${browser}.json`);
    return deepMerge(manifest, override);
  }

  // Chromium browsers (chrome, edge) share the same manifest shape as the
  // root manifest.json — apply the standard Chrome fields from the root.
  const rootManifest = loadJSON(path.join(ROOT, 'manifest.json'));
  return deepMerge(manifest, {
    action: rootManifest.action,
    background: rootManifest.background,
  });
}

// ---------------------------------------------------------------------------
// Build one browser
// ---------------------------------------------------------------------------

function buildBrowser(browser) {
  log(`Building for ${browser}...`);

  const outDir = path.join(DIST, browser);

  // Clean previous build
  if (fs.existsSync(outDir)) {
    fs.rmSync(outDir, { recursive: true, force: true });
  }
  fs.mkdirSync(outDir, { recursive: true });

  // Copy source directories
  for (const rel of SOURCE_DIRS) {
    const src = path.join(ROOT, rel);
    const dest = path.join(outDir, rel);
    if (fs.existsSync(src)) {
      copyDir(src, dest);
      log(`  Copied ${rel}/`);
    }
  }

  // Generate and write manifest.json
  const manifest = generateManifest(browser);
  const manifestPath = path.join(outDir, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  log(`  Wrote manifest.json`);

  // Create ZIP archive
  const zipName = `cookie-manager-${browser}.zip`;
  const zipPath = path.join(DIST, zipName);
  if (fs.existsSync(zipPath)) {
    fs.unlinkSync(zipPath);
  }
  execSync(`cd "${outDir}" && zip -r "${zipPath}" . -x '*.DS_Store'`, {
    stdio: 'pipe',
  });
  const zipSize = (fs.statSync(zipPath).size / 1024).toFixed(1);
  log(`  Packaged ${zipName} (${zipSize} KB)`);

  log(`Done: ${browser}\n`);
}

// ---------------------------------------------------------------------------
// CLI entry point
// ---------------------------------------------------------------------------

function main() {
  const arg = process.argv[2];

  if (!arg) {
    console.log('Usage: node scripts/build.js <chrome|firefox|edge|all>');
    process.exit(1);
  }

  log(`Cookie Manager build script`);
  log(`Root: ${ROOT}\n`);

  // Ensure dist/ exists
  fs.mkdirSync(DIST, { recursive: true });

  if (arg === 'all') {
    for (const browser of BROWSERS) {
      buildBrowser(browser);
    }
    log('All builds complete.');
  } else if (BROWSERS.includes(arg)) {
    buildBrowser(arg);
  } else {
    fatal(`Unknown browser "${arg}". Use one of: ${BROWSERS.join(', ')}, all`);
  }
}

main();
