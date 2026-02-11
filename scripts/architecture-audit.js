#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const ROOT = path.resolve(__dirname, '..');
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', '.DS_Store']);

// Terminal colors (same pattern as other audit scripts)
const C = {
    reset: '\x1b[0m', bold: '\x1b[1m', dim: '\x1b[2m',
    red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m',
    blue: '\x1b[34m', cyan: '\x1b[36m'
};
function green(s)  { return `${C.green}${s}${C.reset}`; }
function red(s)    { return `${C.red}${s}${C.reset}`; }
function yellow(s) { return `${C.yellow}${s}${C.reset}`; }
function bold(s)   { return `${C.bold}${s}${C.reset}`; }
function dim(s)    { return `${C.dim}${s}${C.reset}`; }

// ---------------------------------------------------------------------------
// File helpers
// ---------------------------------------------------------------------------

function relPath(p) { return path.relative(ROOT, p); }
function readFile(relOrAbs) {
    const abs = path.isAbsolute(relOrAbs) ? relOrAbs : path.join(ROOT, relOrAbs);
    try { return fs.readFileSync(abs, 'utf8'); } catch { return null; }
}
function walkDir(dir, ext, results = []) {
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return results; }
    for (const entry of entries) {
        if (SKIP_DIRS.has(entry.name)) continue;
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walkDir(full, ext, results);
        else if (!ext || path.extname(entry.name) === ext) results.push(full);
    }
    return results;
}

// ---------------------------------------------------------------------------
// Result tracking
// ---------------------------------------------------------------------------

const results = { pass: 0, warn: 0, fail: 0, details: [] };
function pass(cat, msg, file) { results.pass++; results.details.push({ s: 'PASS', cat, msg, file }); }
function warn(cat, msg, file) { results.warn++; results.details.push({ s: 'WARN', cat, msg, file }); }
function fail(cat, msg, file) { results.fail++; results.details.push({ s: 'FAIL', cat, msg, file }); }
function statusTag(s) {
    if (s === 'PASS') return green('PASS');
    if (s === 'WARN') return yellow('WARN');
    return red('FAIL');
}

// ---------------------------------------------------------------------------
// 1. Module Organization (6 checks)
// ---------------------------------------------------------------------------

function auditModuleOrganization() {
    const sharedFiles = walkDir(path.join(ROOT, 'src', 'shared'), '.js');
    const swContent = readFile('src/background/service-worker.js') || '';
    const htmlContent = readFile('src/popup/index.html') || '';

    // 1a. Shared modules exist in src/shared/
    if (sharedFiles.length > 0) pass('Module Organization', `${sharedFiles.length} shared modules found in src/shared/`);
    else fail('Module Organization', 'No shared modules found in src/shared/');

    // 1b. Each shared module uses IIFE pattern
    let iifeCount = 0, nonIife = [];
    for (const f of sharedFiles) {
        const c = readFile(f); if (!c) continue;
        const trimmed = c.replace(/^\/\*[\s\S]*?\*\/\s*/m, '').replace(/^\/\/.*\n/gm, '').trim();
        if (/^\(function\s*[\(\{]/.test(trimmed)) iifeCount++;
        else nonIife.push(path.basename(f));
    }
    if (nonIife.length === 0) pass('Module Organization', `All ${iifeCount} shared modules use IIFE pattern`);
    else fail('Module Organization', `Modules missing IIFE pattern: ${nonIife.join(', ')}`);

    // 1c. Each shared module exposes a global (self./window./root. assignment)
    let globalCount = 0, noGlobal = [];
    for (const f of sharedFiles) {
        const c = readFile(f); if (!c) continue;
        if (/\b(self|window|root)\.\w+\s*=/.test(c) || /\(typeof\s+self\b/.test(c)) globalCount++;
        else noGlobal.push(path.basename(f));
    }
    if (noGlobal.length === 0) pass('Module Organization', `All ${globalCount} shared modules expose a global`);
    else warn('Module Organization', `Modules without obvious global exposure: ${noGlobal.join(', ')}`);

    // 1d. No circular dependencies between shared modules
    const moduleGlobals = {};
    for (const f of sharedFiles) {
        const c = readFile(f); if (!c) continue;
        const base = path.basename(f, '.js'), globals = [];
        for (const m of (c.match(/(?:self|root|window)\.\s*(\w+)\s*=/g) || [])) {
            const name = m.replace(/^(?:self|root|window)\.\s*/, '').replace(/\s*=$/, '');
            if (name && name !== 'onerror' && name !== 'onunhandledrejection') globals.push(name);
        }
        moduleGlobals[base] = { globals, content: c };
    }
    let circWarn = 0;
    const allBases = Object.keys(moduleGlobals);
    for (const base of allBases) {
        for (const other of allBases) {
            if (other === base) continue;
            for (const g of moduleGlobals[other].globals) {
                if (new RegExp('\\b' + g + '\\b').test(moduleGlobals[base].content) &&
                    !new RegExp('typeof\\s+' + g).test(moduleGlobals[base].content)) circWarn++;
            }
        }
    }
    if (circWarn === 0) pass('Module Organization', 'No hard circular dependencies detected between shared modules');
    else warn('Module Organization', `${circWarn} cross-module reference(s) detected (may indicate coupling)`);

    // 1e. Background scripts properly imported via importScripts
    const imports = swContent.match(/importScripts\s*\(\s*['"][^'"]+['"]\s*\)/g) || [];
    if (imports.length > 0) pass('Module Organization', `Service worker imports ${imports.length} module(s) via importScripts`);
    else fail('Module Organization', 'Service worker has no importScripts calls for shared modules');

    // 1f. Popup scripts loaded via script tags
    const scriptTags = (htmlContent.match(/<script\s+src\s*=\s*["'][^"']+["']/g) || []).filter(t => t.includes('shared/'));
    if (scriptTags.length > 0) pass('Module Organization', `Popup HTML loads ${scriptTags.length} shared module(s) via <script> tags`);
    else fail('Module Organization', 'Popup HTML has no <script> tags for shared modules');
}

// ---------------------------------------------------------------------------
// 2. Error Handling (5 checks)
// ---------------------------------------------------------------------------

function auditErrorHandling() {
    const sw = readFile('src/background/service-worker.js') || '';
    const popup = readFile('src/popup/popup.js') || '';

    // 2a. Global error handlers in service worker
    const hasErr = /self\.addEventListener\s*\(\s*['"]error['"]/.test(sw);
    const hasRej = /self\.addEventListener\s*\(\s*['"]unhandledrejection['"]/.test(sw);
    if (hasErr && hasRej) pass('Error Handling', 'Service worker has global error + unhandledrejection handlers');
    else if (hasErr || hasRej) warn('Error Handling', 'Service worker missing one global error handler (' + (!hasErr ? 'error' : 'unhandledrejection') + ')');
    else fail('Error Handling', 'Service worker missing global error handlers');

    // 2b. Popup has error handler
    if (/window\.onerror/.test(popup) || /PopupErrorHandler/.test(popup)) pass('Error Handling', 'Popup has error handler (PopupErrorHandler / window.onerror)');
    else fail('Error Handling', 'Popup missing error handler');

    // 2c. Try/catch around chrome.storage operations (spot check)
    const storageRe = /chrome\.storage\.\w+\.\s*(get|set|remove)\s*\(/g;
    let unguarded = 0, total = 0, m;
    while ((m = storageRe.exec(sw)) !== null) {
        total++;
        const before = sw.substring(Math.max(0, m.index - 300), m.index);
        if (!/try\s*\{/.test(before.split('\n').slice(-8).join('\n'))) unguarded++;
    }
    if (total === 0) warn('Error Handling', 'No chrome.storage calls found to verify');
    else if (unguarded === 0) pass('Error Handling', `All ${total} chrome.storage call(s) appear guarded by try/catch`);
    else warn('Error Handling', `${unguarded}/${total} chrome.storage call(s) may lack try/catch`);

    // 2d. Message handler has catch-all error handling
    if (/async\s+function\s+handleMessage[\s\S]*?try\s*\{/.test(sw)) pass('Error Handling', 'handleMessage has try/catch error handling');
    else fail('Error Handling', 'handleMessage missing try/catch error handling');

    // 2e. Module imports have error guards
    const importLines = sw.match(/.*importScripts.*/g) || [];
    const guarded = importLines.filter(l => /try\s*\{/.test(l) || l.trim().startsWith('try'));
    if (importLines.length === 0) warn('Error Handling', 'No importScripts calls to check');
    else if (guarded.length === importLines.length) pass('Error Handling', `All ${importLines.length} importScripts call(s) wrapped in try/catch`);
    else warn('Error Handling', `${importLines.length - guarded.length}/${importLines.length} importScripts call(s) not guarded`);
}

// ---------------------------------------------------------------------------
// 3. State Management (4 checks)
// ---------------------------------------------------------------------------

function auditStateManagement() {
    const sw = readFile('src/background/service-worker.js') || '';
    const popup = readFile('src/popup/popup.js') || '';

    // 3a. Settings have default values
    if (/STORAGE_DEFAULTS/.test(sw)) pass('State Management', 'Storage defaults defined (STORAGE_DEFAULTS found in service worker)');
    else fail('State Management', 'No STORAGE_DEFAULTS or default values pattern found');

    // 3b. State changes are persisted
    const setSW = (sw.match(/chrome\.storage\.local\.set\s*\(/g) || []).length;
    const setPop = (popup.match(/chrome\.storage\.local\.set\s*\(/g) || []).length;
    if (setSW + setPop > 0) pass('State Management', `State persistence found (${setSW} set calls in SW, ${setPop} in popup)`);
    else fail('State Management', 'No chrome.storage.local.set calls found');

    // 3c. No direct DOM manipulation in service worker
    if (!/\bdocument\.\b/.test(sw)) pass('State Management', 'Service worker has no direct document references');
    else warn('State Management', 'Service worker references "document" — invalid in SW context');

    // 3d. Storage keys are documented/consistent
    const keyNames = new Set();
    for (const call of (sw.match(/chrome\.storage\.local\.(get|set)\s*\(\s*[\[{]?\s*['"](\w+)['"]/g) || [])) {
        const km = call.match(/['"](\w+)['"]/); if (km) keyNames.add(km[1]);
    }
    const dm = sw.match(/STORAGE_DEFAULTS\s*=\s*\{([^}]+)\}/);
    if (dm) for (const dk of (dm[1].match(/(\w+)\s*:/g) || [])) keyNames.add(dk.replace(':', '').trim());

    if (keyNames.size > 0) {
        const camel = [...keyNames].filter(k => /^[a-z][a-zA-Z0-9]*$/.test(k) || k.startsWith('_')).length;
        if (camel / keyNames.size >= 0.8) pass('State Management', `${keyNames.size} storage key(s) with consistent camelCase naming`);
        else warn('State Management', `Mixed storage key naming (${camel}/${keyNames.size} camelCase)`);
    } else warn('State Management', 'Could not extract storage keys for consistency check');
}

// ---------------------------------------------------------------------------
// 4. Message Architecture (5 checks)
// ---------------------------------------------------------------------------

function auditMessageArchitecture() {
    const sw = readFile('src/background/service-worker.js') || '';
    const popup = readFile('src/popup/popup.js') || '';

    // 4a. Consistent message handler pattern (switch/case)
    const cases = sw.match(/case\s+['"][A-Z_]+['"]\s*:/g) || [];
    if (cases.length > 0) pass('Message Architecture', `Message handler uses switch with ${cases.length} case(s)`);
    else fail('Message Architecture', 'No switch/case pattern found in message handler');

    // 4b. Messages have action field validation
    if (/validateIncomingMessage/.test(sw) || /typeof\s+message\.action/.test(sw))
        pass('Message Architecture', 'Message action field is validated before processing');
    else fail('Message Architecture', 'No action field validation in message handler');

    // 4c. Sender validation is present
    if (/isValidSender/.test(sw) || /sender\.id/.test(sw))
        pass('Message Architecture', 'Sender validation present in message listener');
    else fail('Message Architecture', 'No sender validation in message listener');

    // 4d. Async responses handled correctly (return true)
    if (sw.match(/chrome\.runtime\.onMessage\.addListener\s*\([\s\S]*?return\s+true/))
        pass('Message Architecture', 'onMessage listener returns true for async response');
    else fail('Message Architecture', 'onMessage listener may not return true for async response handling');

    // 4e. No hardcoded action strings in popup without matching SW handler
    const popupActions = new Set(), swActions = new Set();
    let pm, sm;
    const pr = /action\s*:\s*['"]([A-Z_]+)['"]/g;
    while ((pm = pr.exec(popup)) !== null) popupActions.add(pm[1]);
    const sr = /case\s+['"]([A-Z_]+)['"]\s*:/g;
    while ((sm = sr.exec(sw)) !== null) swActions.add(sm[1]);
    const unmatched = [...popupActions].filter(a => !swActions.has(a));
    if (unmatched.length === 0) pass('Message Architecture', `All ${popupActions.size} popup action(s) have matching SW handler(s)`);
    else warn('Message Architecture', `Popup sends action(s) not handled in SW: ${unmatched.join(', ')}`);
}

// ---------------------------------------------------------------------------
// 5. Code Quality (5 checks)
// ---------------------------------------------------------------------------

function auditCodeQuality() {
    const css = readFile('src/popup/popup.css') || '';
    const html = readFile('src/popup/index.html') || '';
    const sw = readFile('src/background/service-worker.js') || '';
    const popup = readFile('src/popup/popup.js') || '';

    // 5a. CSS uses custom properties
    const hasRoot = /:root\s*\{/.test(css);
    const varCount = (css.match(/var\(\s*--/g) || []).length;
    if (hasRoot && varCount > 0) pass('Code Quality', `CSS uses custom properties (:root defined, ${varCount} var(--) usages)`);
    else if (hasRoot) warn('Code Quality', ':root block found but no var(--) usages detected');
    else fail('Code Quality', 'CSS missing :root custom properties');

    // 5b. No inline styles in HTML
    const inlines = html.match(/style\s*=\s*["'][^"']+["']/g) || [];
    if (inlines.length === 0) pass('Code Quality', 'No inline styles in popup HTML');
    else if (inlines.length <= 3) warn('Code Quality', `${inlines.length} inline style(s) in HTML (prefer CSS classes)`);
    else fail('Code Quality', `${inlines.length} inline styles in popup HTML — move to CSS`);

    // 5c. Functions are reasonably sized (warn if any exceed 100 lines)
    const files = [{ name: 'service-worker.js', content: sw }, { name: 'popup.js', content: popup }];
    const oversized = [];
    for (const file of files) {
        const lines = file.content.split('\n');
        let funcStart = -1, funcName = '', depth = 0, inFunc = false;
        for (let i = 0; i < lines.length; i++) {
            const fm = lines[i].match(/(?:async\s+)?function\s+(\w+)\s*\(/);
            if (fm && !inFunc) { funcStart = i; funcName = fm[1]; depth = 0; inFunc = true; }
            if (inFunc) {
                depth += (lines[i].match(/\{/g) || []).length - (lines[i].match(/\}/g) || []).length;
                if (depth <= 0 && funcStart >= 0) {
                    if (i - funcStart + 1 > 100) oversized.push({ name: funcName, len: i - funcStart + 1, file: file.name });
                    inFunc = false; funcStart = -1;
                }
            }
        }
    }
    if (oversized.length === 0) pass('Code Quality', 'All functions are within 100-line limit');
    else warn('Code Quality', `Oversized function(s): ${oversized.map(f => `${f.name}() = ${f.len} lines in ${f.file}`).join('; ')}`);

    // 5d. No excessive console.log in service worker
    const logCount = (sw.match(/console\.log\s*\(/g) || []).length;
    if (logCount <= 5) pass('Code Quality', `Service worker has ${logCount} console.log call(s) (clean)`);
    else if (logCount <= 20) warn('Code Quality', `Service worker has ${logCount} console.log call(s) (consider reducing)`);
    else fail('Code Quality', `Service worker has ${logCount} console.log calls (excessive for production)`);

    // 5e. No dead code patterns (code after return)
    let deadCode = 0;
    for (const file of files) {
        const lines = file.content.split('\n');
        for (let i = 0; i < lines.length - 1; i++) {
            const cur = lines[i].trim(), nxt = lines[i + 1]?.trim() || '';
            if (/^return\b/.test(cur) && nxt && !/^[}\]]/.test(nxt) && !/^(case|default:)/.test(nxt) && !/^\/\//.test(nxt) && nxt !== '') deadCode++;
        }
    }
    if (deadCode === 0) pass('Code Quality', 'No obvious dead code patterns detected');
    else warn('Code Quality', `${deadCode} potential dead code pattern(s) (code after return)`);
}

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

function calculateScore() {
    const total = results.pass + results.warn + results.fail;
    if (total === 0) return 0;
    return Math.round(((results.pass + results.warn * 0.5) / total) * 100);
}
function gradeFromScore(score) {
    if (score >= 95) return 'A+';
    if (score >= 90) return 'A';
    if (score >= 85) return 'B+';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
}
function scoreColor(score) {
    if (score >= 90) return green;
    if (score >= 70) return yellow;
    return red;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
    console.log('');
    console.log(bold('=== Cookie Manager Architecture Audit ==='));
    console.log(dim('  MD 24 — Code Architecture Patterns'));
    console.log('');

    auditModuleOrganization();
    auditErrorHandling();
    auditStateManagement();
    auditMessageArchitecture();
    auditCodeQuality();

    // Print results grouped by category
    const categories = ['Module Organization', 'Error Handling', 'State Management', 'Message Architecture', 'Code Quality'];
    for (const cat of categories) {
        const cr = results.details.filter(d => d.cat === cat);
        if (cr.length === 0) continue;
        const p = cr.filter(d => d.s === 'PASS').length;
        const w = cr.filter(d => d.s === 'WARN').length;
        const f = cr.filter(d => d.s === 'FAIL').length;
        console.log(bold(`  ${cat}`) + dim(`  (${p} pass, ${w} warn, ${f} fail)`));
        console.log('');
        for (const d of cr) {
            const fileStr = d.file ? dim(` [${d.file}]`) : '';
            console.log(`  ${statusTag(d.s)}  ${d.msg}${fileStr}`);
        }
        console.log('');
    }

    // Summary
    const score = calculateScore();
    const grade = gradeFromScore(score);
    const colorFn = scoreColor(score);
    console.log(bold('  Summary'));
    console.log('');
    console.log(`  Total checks:    ${results.pass + results.warn + results.fail}`);
    console.log(`  ${green('Passed:')}          ${results.pass}`);
    console.log(`  ${yellow('Warnings:')}        ${results.warn}`);
    console.log(`  ${red('Failed:')}          ${results.fail}`);
    console.log('');
    console.log(colorFn(`=== Architecture Score: ${score}/100 (${grade}) ===`));
    console.log('');

    process.exit(results.fail > 0 ? 1 : 0);
}

main();
