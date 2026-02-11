#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const ROOT = path.resolve(__dirname, '..');
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', '.DS_Store']);
const MANIFEST_PATHS = [
  path.join(ROOT, 'manifest.json'),
  path.join(ROOT, 'manifests', 'base.json'),
  path.join(ROOT, 'manifests', 'firefox.json'),
];
const REQUIRED_FIELDS = ['name', 'version', 'manifest_version', 'description', 'icons', 'permissions'];
const EXT_DIRS = ['src', 'manifests', 'assets', 'onboarding', 'shared', 'store', '_locales'];
const FILE_SIZE_WARN = 100 * 1024;          // 100 KB per file
const TOTAL_SIZE_WARN = 10 * 1024 * 1024;   // 10 MB total

// ---------------------------------------------------------------------------
// Terminal colors (no dependencies)
// ---------------------------------------------------------------------------

const C = { reset: '\x1b[0m', bold: '\x1b[1m', red: '\x1b[31m', green: '\x1b[32m',
            yellow: '\x1b[33m', cyan: '\x1b[36m', dim: '\x1b[2m' };

function green(s)  { return `${C.green}${s}${C.reset}`; }
function red(s)    { return `${C.red}${s}${C.reset}`; }
function yellow(s) { return `${C.yellow}${s}${C.reset}`; }
function bold(s)   { return `${C.bold}${s}${C.reset}`; }
function dim(s)    { return `${C.dim}${s}${C.reset}`; }

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function walkDir(dir, results) {
  results = results || [];
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); }
  catch { return results; }
  for (const entry of entries) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) { walkDir(full, results); }
    else { results.push({ path: full, size: fs.statSync(full).size }); }
  }
  return results;
}

function byExt(ext) { return walkDir(ROOT).filter(f => path.extname(f.path) === ext); }
function rel(p) { return path.relative(ROOT, p); }
function fmtKB(bytes) { return (bytes / 1024).toFixed(1) + ' KB'; }
function readText(p) { return fs.readFileSync(p, 'utf8'); }

const R = { pass: 0, warn: 0, fail: 0, details: [] };
function pass(cat, msg) { R.pass++; R.details.push({ s: 'PASS', cat, msg }); }
function warn(cat, msg) { R.warn++; R.details.push({ s: 'WARN', cat, msg }); }
function fail(cat, msg) { R.fail++; R.details.push({ s: 'FAIL', cat, msg }); }

function tag(s) {
  if (s === 'PASS') return green('PASS');
  if (s === 'WARN') return yellow('WARN');
  return red('FAIL');
}

// ---------------------------------------------------------------------------
// 1. Manifest Validation
// ---------------------------------------------------------------------------

function checkManifests() {
  const parsed = [];

  for (const mp of MANIFEST_PATHS) {
    const r = rel(mp);
    if (!fs.existsSync(mp)) { fail('Manifest', `Missing manifest: ${r}`); continue; }
    try {
      parsed.push({ rel: r, data: JSON.parse(readText(mp)) });
      pass('Manifest', `Valid JSON: ${r}`);
    } catch (e) { fail('Manifest', `Invalid JSON in ${r}: ${e.message}`); }
  }
  if (parsed.length === 0) return;

  // Version consistency
  const versions = parsed.map(m => m.data.version).filter(Boolean);
  if (new Set(versions).size <= 1 && versions.length > 0) {
    pass('Manifest', `Version consistent across manifests: ${versions[0]}`);
  } else {
    fail('Manifest', `Version mismatch: ${parsed.map(m => m.rel + '=' + (m.data.version || 'missing')).join(', ')}`);
  }

  // Required fields (main manifest)
  const main = parsed.find(m => m.rel === 'manifest.json') || parsed[0];
  for (const field of REQUIRED_FIELDS) {
    if (main.data[field] !== undefined) pass('Manifest', `Required field present: ${field}`);
    else fail('Manifest', `Missing required field: ${field} in ${main.rel}`);
  }

  // Icon files exist on disk
  for (const m of parsed) {
    if (!m.data.icons) continue;
    for (const [size, iconPath] of Object.entries(m.data.icons)) {
      if (fs.existsSync(path.join(ROOT, iconPath))) pass('Manifest', `Icon ${size}px exists: ${iconPath}`);
      else fail('Manifest', `Icon ${size}px missing: ${iconPath} (${m.rel})`);
    }
    break; // check once to avoid duplicates
  }

  // No duplicate permissions
  for (const m of parsed) {
    const perms = m.data.permissions;
    if (!Array.isArray(perms)) continue;
    const seen = new Set();
    let dupes = false;
    for (const p of perms) { if (seen.has(p)) { fail('Manifest', `Duplicate permission "${p}" in ${m.rel}`); dupes = true; } seen.add(p); }
    if (!dupes) pass('Manifest', `No duplicate permissions in ${m.rel}`);
  }
}

// ---------------------------------------------------------------------------
// 2. File Integrity
// ---------------------------------------------------------------------------

function checkFileIntegrity() {
  const self = path.resolve(__filename);

  // JS syntax check
  const jsFiles = byExt('.js');
  let ok = 0, bad = 0;
  for (const f of jsFiles) {
    try { execSync(`node -c "${f.path}"`, { stdio: 'pipe' }); ok++; }
    catch { fail('Integrity', `Syntax error in ${rel(f.path)}`); bad++; }
  }
  if (ok > 0 && bad === 0) pass('Integrity', `All ${ok} JS files pass syntax check`);
  else if (ok > 0) warn('Integrity', `${ok}/${ok + bad} JS files pass syntax check`);

  // HTML non-empty
  const htmlFiles = byExt('.html');
  let htmlOk = 0;
  for (const f of htmlFiles) { if (f.size === 0) fail('Integrity', `Empty HTML file: ${rel(f.path)}`); else htmlOk++; }
  if (htmlOk > 0) pass('Integrity', `All ${htmlOk} HTML files are non-empty`);

  // CSS non-empty
  const cssFiles = byExt('.css');
  let cssOk = 0;
  for (const f of cssFiles) { if (f.size === 0) fail('Integrity', `Empty CSS file: ${rel(f.path)}`); else cssOk++; }
  if (cssOk > 0) pass('Integrity', `All ${cssOk} CSS files are non-empty`);

  // Large files warning
  const large = walkDir(ROOT).filter(f => f.size > FILE_SIZE_WARN);
  if (large.length === 0) pass('Integrity', 'No files exceed 100KB size limit');
  else for (const f of large) warn('Integrity', `Large file (${fmtKB(f.size)}): ${rel(f.path)}`);

  // TODO/FIXME comments
  let todoCount = 0;
  const todoFiles = [];
  for (const f of jsFiles) {
    if (path.resolve(f.path) === self) continue;
    const m = readText(f.path).match(/\b(TODO|FIXME)\b/g);
    if (m) { todoCount += m.length; todoFiles.push(rel(f.path)); }
  }
  if (todoCount === 0) pass('Integrity', 'No TODO/FIXME comments found in JS files');
  else warn('Integrity', `Found ${todoCount} TODO/FIXME comment(s) in: ${todoFiles.join(', ')}`);
}

// ---------------------------------------------------------------------------
// 3. Security Checks
// ---------------------------------------------------------------------------

function checkSecurity() {
  const self = path.resolve(__filename);
  const jsFiles = byExt('.js');
  const htmlFiles = byExt('.html');

  // No eval()
  let evalFound = false;
  for (const f of jsFiles) {
    if (path.resolve(f.path) === self) continue;
    if (/\beval\s*\(/.test(readText(f.path))) { fail('Security', `eval() found in ${rel(f.path)}`); evalFound = true; }
  }
  if (!evalFound) pass('Security', 'No eval() calls found');

  // No inline event handlers
  const handlerRe = /\b(onclick|onload|onerror|onmouseover|onmouseout|onsubmit|onchange|onfocus|onblur|onkeydown|onkeyup|onkeypress)\s*=/i;
  let inlineFound = false;
  for (const f of htmlFiles) {
    if (handlerRe.test(readText(f.path))) { fail('Security', `Inline event handler found in ${rel(f.path)}`); inlineFound = true; }
  }
  if (!inlineFound) pass('Security', 'No inline event handlers in HTML');

  // CSP in manifest
  const mp = path.join(ROOT, 'manifest.json');
  if (fs.existsSync(mp)) {
    try {
      const data = JSON.parse(readText(mp));
      if (data.content_security_policy) pass('Security', 'Content Security Policy present in manifest');
      else fail('Security', 'Missing Content Security Policy in manifest');
    } catch { /* already reported */ }
  }

  // No http:// URLs
  let httpFound = false;
  for (const f of [...jsFiles, ...htmlFiles]) {
    if (path.resolve(f.path) === self) continue;
    const m = readText(f.path).match(/['"`]http:\/\/[^'"`\s]+/g);
    if (m) { fail('Security', `Insecure http:// URL in ${rel(f.path)}: ${m[0].substring(0, 50)}`); httpFound = true; }
  }
  if (!httpFound) pass('Security', 'No insecure http:// URLs found');

  // No hardcoded secrets
  const secretPatterns = [
    ['API key',     /['"`](AIza[0-9A-Za-z_-]{35}|[A-Za-z0-9_]{20,}key[A-Za-z0-9_]{10,})['"`]/i],
    ['AWS key',     /AKIA[0-9A-Z]{16}/],
    ['Bearer token', /['"`]Bearer\s+[A-Za-z0-9\-._~+/]+=*['"`]/],
    ['Private key', /-----BEGIN\s+(RSA\s+)?PRIVATE\s+KEY-----/],
    ['Secret assignment', /(api_key|api_secret|access_token|secret_key|private_key)\s*[:=]\s*['"`][^'"`]{8,}['"`]/i],
  ];
  let secretsFound = false;
  for (const f of jsFiles) {
    if (path.resolve(f.path) === self) continue;
    const content = readText(f.path);
    for (const [name, pat] of secretPatterns) {
      if (pat.test(content)) { fail('Security', `Possible ${name} found in ${rel(f.path)}`); secretsFound = true; }
    }
  }
  if (!secretsFound) pass('Security', 'No hardcoded API keys or tokens detected');
}

// ---------------------------------------------------------------------------
// 4. Extension Size
// ---------------------------------------------------------------------------

function checkExtensionSize() {
  let totalSize = 0;
  const allFiles = [];

  for (const dir of EXT_DIRS) {
    const dp = path.join(ROOT, dir);
    if (!fs.existsSync(dp)) continue;
    const files = walkDir(dp);
    allFiles.push(...files);
    for (const f of files) totalSize += f.size;
  }
  const mp = path.join(ROOT, 'manifest.json');
  if (fs.existsSync(mp)) { const s = fs.statSync(mp); allFiles.push({ path: mp, size: s.size }); totalSize += s.size; }

  if (totalSize > TOTAL_SIZE_WARN) warn('Size', `Total extension size ${fmtKB(totalSize)} exceeds 10MB recommendation`);
  else pass('Size', `Total extension size: ${fmtKB(totalSize)}`);

  // Top 10 largest files
  allFiles.sort((a, b) => b.size - a.size);
  console.log(dim('  Top 10 largest files:'));
  for (const f of allFiles.slice(0, 10)) {
    console.log(dim(`    ${fmtKB(f.size).padStart(10)}  ${rel(f.path)}`));
  }
  console.log('');
}

// ---------------------------------------------------------------------------
// 5. Changelog Check
// ---------------------------------------------------------------------------

function checkChangelog() {
  const cp = path.join(ROOT, 'CHANGELOG.md');
  if (!fs.existsSync(cp)) { fail('Changelog', 'CHANGELOG.md not found'); return; }
  pass('Changelog', 'CHANGELOG.md exists');

  let version = 'unknown';
  try { version = JSON.parse(readText(path.join(ROOT, 'manifest.json'))).version || 'unknown'; }
  catch { /* fallback */ }

  if (readText(cp).includes(`[${version}]`)) pass('Changelog', `Entry found for version ${version}`);
  else fail('Changelog', `No entry found for current version ${version}`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  console.log('');
  console.log(bold('=== Cookie Manager Release Checklist ==='));
  console.log(dim('  Pre-release validation checks'));
  console.log('');

  const sections = [
    { name: 'Manifest Validation', fn: checkManifests },
    { name: 'File Integrity',      fn: checkFileIntegrity },
    { name: 'Security Checks',     fn: checkSecurity },
    { name: 'Extension Size',      fn: checkExtensionSize },
    { name: 'Changelog',           fn: checkChangelog },
  ];

  for (const section of sections) {
    const before = R.details.length;
    console.log(bold(`  ${section.name}`));
    console.log('');
    section.fn();
    for (const d of R.details.slice(before)) console.log(`  ${tag(d.s)}  ${d.msg}`);
    console.log('');
  }

  // Summary
  const total = R.pass + R.warn + R.fail;
  console.log(bold('  Summary'));
  console.log('');
  console.log(`  Total checks:    ${total}`);
  console.log(`  ${green('Passed:')}          ${R.pass}`);
  console.log(`  ${yellow('Warnings:')}        ${R.warn}`);
  console.log(`  ${red('Failed:')}          ${R.fail}`);
  console.log('');

  const color = R.fail > 0 ? red : R.warn > 0 ? yellow : green;
  const verdict = R.fail > 0 ? 'RELEASE BLOCKED' : R.warn > 0 ? 'RELEASE OK (with warnings)' : 'RELEASE READY';
  console.log(color(`=== ${verdict}: ${R.pass}/${total} passed, ${R.fail} failed, ${R.warn} warnings ===`));
  console.log('');

  process.exit(R.fail > 0 ? 1 : 0);
}

main();
