#!/usr/bin/env node
'use strict';

/**
 * Cookie Manager - Manifest & Extension Validation Script
 * Checks that all file paths referenced in manifest.json exist on disk,
 * icons are valid PNGs, locale files are present, and script references resolve.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
let errors = 0;
let warnings = 0;

function error(msg) {
    console.error(`  ERROR: ${msg}`);
    errors++;
}

function warn(msg) {
    console.warn(`  WARN:  ${msg}`);
    warnings++;
}

function ok(msg) {
    console.log(`  OK:    ${msg}`);
}

function fileExists(relPath) {
    return fs.existsSync(path.join(ROOT, relPath));
}

// ---------------------------------------------------------------------------
// 1. Load and parse manifest.json
// ---------------------------------------------------------------------------

console.log('\n=== Cookie Manager Extension Validator ===\n');
console.log('[1] Checking manifest.json...');

const manifestPath = path.join(ROOT, 'manifest.json');
if (!fs.existsSync(manifestPath)) {
    console.error('FATAL: manifest.json not found at project root');
    process.exit(1);
}

let manifest;
try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    ok('manifest.json is valid JSON');
} catch (e) {
    console.error(`FATAL: manifest.json parse error: ${e.message}`);
    process.exit(1);
}

// Check required fields
if (manifest.manifest_version !== 3) {
    error(`manifest_version should be 3, got ${manifest.manifest_version}`);
}
if (!manifest.name) error('Missing "name" field');
if (!manifest.version) error('Missing "version" field');
if (!manifest.description) error('Missing "description" field');

// ---------------------------------------------------------------------------
// 2. Check icon files
// ---------------------------------------------------------------------------

console.log('\n[2] Checking icon files...');

const iconSizes = ['16', '32', '48', '128'];

if (manifest.icons) {
    for (const size of Object.keys(manifest.icons)) {
        const iconPath = manifest.icons[size];
        if (!fileExists(iconPath)) {
            error(`Icon missing: ${iconPath} (size ${size})`);
        } else {
            // Check if file starts with PNG magic bytes
            const buf = Buffer.alloc(8);
            const fd = fs.openSync(path.join(ROOT, iconPath), 'r');
            fs.readSync(fd, buf, 0, 8, 0);
            fs.closeSync(fd);
            const isPNG = buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47;
            if (!isPNG) {
                error(`${iconPath} is not a valid PNG file (wrong magic bytes)`);
            } else {
                ok(`${iconPath} exists and is a valid PNG`);
            }
        }
    }
} else {
    warn('No "icons" field in manifest');
}

if (manifest.action && manifest.action.default_icon) {
    for (const size of Object.keys(manifest.action.default_icon)) {
        const iconPath = manifest.action.default_icon[size];
        if (!fileExists(iconPath)) {
            error(`Action icon missing: ${iconPath} (size ${size})`);
        } else {
            ok(`Action icon ${iconPath} exists`);
        }
    }
}

// ---------------------------------------------------------------------------
// 3. Check popup HTML
// ---------------------------------------------------------------------------

console.log('\n[3] Checking popup HTML and scripts...');

if (manifest.action && manifest.action.default_popup) {
    const popupPath = manifest.action.default_popup;
    if (!fileExists(popupPath)) {
        error(`Popup HTML missing: ${popupPath}`);
    } else {
        ok(`Popup HTML exists: ${popupPath}`);

        // Parse HTML for script and link references
        const html = fs.readFileSync(path.join(ROOT, popupPath), 'utf8');
        const popupDir = path.dirname(popupPath);

        // Check <script src="..."> references
        const scriptMatches = html.matchAll(/<script\s+src="([^"]+)"/g);
        for (const match of scriptMatches) {
            const src = match[1];
            // Resolve relative to popup HTML directory
            const resolvedPath = path.normalize(path.join(popupDir, src));
            if (!fileExists(resolvedPath)) {
                error(`Script not found: ${src} (resolved to ${resolvedPath})`);
            } else {
                ok(`Script exists: ${resolvedPath}`);
            }
        }

        // Check <link rel="stylesheet" href="..."> references
        const linkMatches = html.matchAll(/<link\s+rel="stylesheet"\s+href="([^"]+)"/g);
        for (const match of linkMatches) {
            const href = match[1];
            const resolvedPath = path.normalize(path.join(popupDir, href));
            if (!fileExists(resolvedPath)) {
                error(`Stylesheet not found: ${href} (resolved to ${resolvedPath})`);
            } else {
                ok(`Stylesheet exists: ${resolvedPath}`);
            }
        }
    }
} else {
    warn('No popup defined in manifest');
}

// ---------------------------------------------------------------------------
// 4. Check service worker
// ---------------------------------------------------------------------------

console.log('\n[4] Checking service worker...');

if (manifest.background && manifest.background.service_worker) {
    const swPath = manifest.background.service_worker;
    if (!fileExists(swPath)) {
        error(`Service worker missing: ${swPath}`);
    } else {
        ok(`Service worker exists: ${swPath}`);

        // Check importScripts references
        const swContent = fs.readFileSync(path.join(ROOT, swPath), 'utf8');
        const importMatches = swContent.matchAll(/importScripts\(['"]([^'"]+)['"]\)/g);
        for (const match of importMatches) {
            const importPath = match[1];
            // importScripts paths in MV3 are relative to extension root
            if (!fileExists(importPath)) {
                error(`importScripts target missing: ${importPath}`);
            } else {
                ok(`importScripts target exists: ${importPath}`);
            }
        }
    }
} else {
    warn('No service worker defined in manifest');
}

// ---------------------------------------------------------------------------
// 5. Check locale files
// ---------------------------------------------------------------------------

console.log('\n[5] Checking locale files...');

if (manifest.default_locale) {
    const defaultLocalePath = `_locales/${manifest.default_locale}/messages.json`;
    if (!fileExists(defaultLocalePath)) {
        error(`Default locale file missing: ${defaultLocalePath}`);
    } else {
        ok(`Default locale exists: ${defaultLocalePath}`);

        // Verify it's valid JSON
        try {
            JSON.parse(fs.readFileSync(path.join(ROOT, defaultLocalePath), 'utf8'));
            ok('Default locale messages.json is valid JSON');
        } catch (e) {
            error(`Default locale messages.json is invalid JSON: ${e.message}`);
        }
    }

    // Check all locale directories
    const localesDir = path.join(ROOT, '_locales');
    if (fs.existsSync(localesDir)) {
        const locales = fs.readdirSync(localesDir, { withFileTypes: true })
            .filter(d => d.isDirectory())
            .map(d => d.name);

        for (const locale of locales) {
            const msgPath = `_locales/${locale}/messages.json`;
            if (!fileExists(msgPath)) {
                error(`Locale messages.json missing: ${msgPath}`);
            } else {
                try {
                    JSON.parse(fs.readFileSync(path.join(ROOT, msgPath), 'utf8'));
                    ok(`Locale ${locale} is valid`);
                } catch (e) {
                    error(`Locale ${locale} messages.json is invalid JSON: ${e.message}`);
                }
            }
        }
    }
} else if (manifest.name && manifest.name.startsWith('__MSG_')) {
    error('manifest uses __MSG_ references but no default_locale is set');
}

// ---------------------------------------------------------------------------
// 6. Check for common MV3 issues
// ---------------------------------------------------------------------------

console.log('\n[6] Checking for common issues...');

// Scan all JS files for MV2 APIs
const jsFiles = [];
function findJS(dir) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== '.git') {
            findJS(fullPath);
        } else if (entry.isFile() && entry.name.endsWith('.js')) {
            jsFiles.push(fullPath);
        }
    }
}
findJS(path.join(ROOT, 'src'));

const mv2Patterns = [
    { pattern: /chrome\.browserAction/g, name: 'chrome.browserAction (use chrome.action in MV3)' },
    { pattern: /chrome\.extension\.getBackgroundPage/g, name: 'chrome.extension.getBackgroundPage (not available in MV3)' },
    { pattern: /chrome\.tabs\.executeScript\b/g, name: 'chrome.tabs.executeScript (use chrome.scripting.executeScript in MV3)' },
    { pattern: /chrome\.tabs\.insertCSS\b/g, name: 'chrome.tabs.insertCSS (use chrome.scripting.insertCSS in MV3)' },
    { pattern: /\beval\s*\(/g, name: 'eval() (violates CSP in MV3)' },
    { pattern: /new\s+Function\s*\(/g, name: 'new Function() (violates CSP in MV3)' },
];

for (const file of jsFiles) {
    const content = fs.readFileSync(file, 'utf8');
    const relFile = path.relative(ROOT, file);
    for (const { pattern, name } of mv2Patterns) {
        pattern.lastIndex = 0;
        if (pattern.test(content)) {
            error(`${relFile}: Uses deprecated/forbidden API: ${name}`);
        }
    }
}

if (errors === 0) {
    ok('No MV2 deprecated APIs or CSP violations found');
}

// ---------------------------------------------------------------------------
// 7. Check permissions
// ---------------------------------------------------------------------------

console.log('\n[7] Checking permissions...');

const declaredPerms = new Set(manifest.permissions || []);
const requiredPerms = new Map();

// Scan for API usage
for (const file of jsFiles) {
    const content = fs.readFileSync(file, 'utf8');
    const relFile = path.relative(ROOT, file);

    if (/chrome\.cookies\b/.test(content)) requiredPerms.set('cookies', relFile);
    if (/chrome\.contextMenus\b/.test(content)) requiredPerms.set('contextMenus', relFile);
    if (/chrome\.notifications\b/.test(content)) requiredPerms.set('notifications', relFile);
    if (/chrome\.alarms\b/.test(content)) requiredPerms.set('alarms', relFile);
    if (/chrome\.storage\b/.test(content)) requiredPerms.set('storage', relFile);
    if (/chrome\.tabs\b/.test(content) && !/chrome\.tabs\.query\({.*active:.*true/.test(content)) {
        // tabs.query with active:true only needs activeTab
    }
}

for (const [perm, file] of requiredPerms) {
    if (declaredPerms.has(perm)) {
        ok(`Permission "${perm}" is declared (used in ${file})`);
    } else {
        error(`Missing permission "${perm}" (used in ${file})`);
    }
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

console.log('\n=== Validation Complete ===');
console.log(`  Errors:   ${errors}`);
console.log(`  Warnings: ${warnings}`);
console.log('');

if (errors > 0) {
    console.error('FAILED: Fix the errors above before loading in Chrome.\n');
    process.exit(1);
} else {
    console.log('PASSED: Extension should load without errors.\n');
    process.exit(0);
}
