#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const ROOT = path.resolve(__dirname, '..');
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', '.DS_Store']);
const EXTENSIONS = new Set(['.js', '.html', '.css']);

const KNOWN_MODULES = [
  'BrowserCompat', 'SecurityHardener', 'MessageValidator', 'FeedbackCollector',
  'SupportDiagnostics', 'ChurnDetector', 'EngagementScore', 'RetentionTriggers',
  'MilestoneTracker', 'GrowthPrompts', 'SwLifecycle', 'StorageSchema',
  'PerformanceMonitor', 'PerfTimer', 'StorageOptimizer'
];

// Budgets: [label, matcher(filePath, sizeMap), limitKB]
const BUDGETS = [
  ['service-worker.js',  (f) => f.endsWith('service-worker.js'),       50],
  ['popup.js',           (f) => f.endsWith('popup.js'),                 60],
  ['popup.css',          (f) => f.endsWith('popup.css'),                30],
  ['help.css',           (f) => f.endsWith('help.css'),                 30],
];

const AGGREGATE_BUDGETS = [
  ['Any single shared module', 'single_shared', 30],
  ['Total shared modules',     'total_shared',  200],
  ['Total extension JS',       'total_js',      500],
  ['Total CSS',                'total_css',     80],
];

// ---------------------------------------------------------------------------
// Terminal colors (no dependencies)
// ---------------------------------------------------------------------------

const C = {
  reset:   '\x1b[0m',
  bold:    '\x1b[1m',
  red:     '\x1b[31m',
  green:   '\x1b[32m',
  yellow:  '\x1b[33m',
  cyan:    '\x1b[36m',
  dim:     '\x1b[2m',
  white:   '\x1b[37m',
};

function green(s)  { return `${C.green}${s}${C.reset}`; }
function red(s)    { return `${C.red}${s}${C.reset}`; }
function yellow(s) { return `${C.yellow}${s}${C.reset}`; }
function cyan(s)   { return `${C.cyan}${s}${C.reset}`; }
function bold(s)   { return `${C.bold}${s}${C.reset}`; }
function dim(s)    { return `${C.dim}${s}${C.reset}`; }

// ---------------------------------------------------------------------------
// File scanning
// ---------------------------------------------------------------------------

function walkDir(dir, results = []) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); }
  catch { return results; }

  for (const entry of entries) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(fullPath, results);
    } else if (EXTENSIONS.has(path.extname(entry.name))) {
      const stat = fs.statSync(fullPath);
      results.push({ path: fullPath, size: stat.size });
    }
  }
  return results;
}

function relPath(p) { return path.relative(ROOT, p); }
function toKB(bytes) { return bytes / 1024; }
function fmtKB(kb)   { return kb.toFixed(1).padStart(8) + ' KB'; }

function groupKey(rel) {
  const parts = rel.split(path.sep);
  if (parts[0] === 'src' && parts.length > 1) return parts.slice(0, 2).join('/');
  if (parts[0] === 'scripts')   return 'scripts';
  if (parts[0] === 'shared')    return 'shared';
  if (parts[0] === 'onboarding') return 'onboarding';
  if (parts[0] === 'store')     return 'store';
  return parts[0];
}

// ---------------------------------------------------------------------------
// Budget evaluation
// ---------------------------------------------------------------------------

function evaluateBudgets(files) {
  const results = [];
  let pass = 0, warn = 0, fail = 0;

  // Per-file budgets
  for (const [label, matcher, limitKB] of BUDGETS) {
    const match = files.find(f => matcher(relPath(f.path)));
    const sizeKB = match ? toKB(match.size) : 0;
    const pct = (sizeKB / limitKB) * 100;
    const status = sizeKB > limitKB ? 'FAIL' : pct > 80 ? 'WARN' : 'PASS';
    if (status === 'PASS') pass++; else if (status === 'WARN') warn++; else fail++;
    results.push({ label, sizeKB, limitKB, pct, status });
  }

  // Aggregate budgets
  const sharedJsFiles = files.filter(f => relPath(f.path).startsWith(path.join('src', 'shared')) && f.path.endsWith('.js'));
  const allJsFiles = files.filter(f => f.path.endsWith('.js'));
  const allCssFiles = files.filter(f => f.path.endsWith('.css'));

  for (const [label, type, limitKB] of AGGREGATE_BUDGETS) {
    let sizeKB = 0;
    if (type === 'single_shared') {
      // Worst-case single shared module
      const largest = sharedJsFiles.reduce((max, f) => toKB(f.size) > max ? toKB(f.size) : max, 0);
      sizeKB = largest;
    } else if (type === 'total_shared') {
      sizeKB = sharedJsFiles.reduce((sum, f) => sum + toKB(f.size), 0);
    } else if (type === 'total_js') {
      sizeKB = allJsFiles.reduce((sum, f) => sum + toKB(f.size), 0);
    } else if (type === 'total_css') {
      sizeKB = allCssFiles.reduce((sum, f) => sum + toKB(f.size), 0);
    }
    const pct = (sizeKB / limitKB) * 100;
    const status = sizeKB > limitKB ? 'FAIL' : pct > 80 ? 'WARN' : 'PASS';
    if (status === 'PASS') pass++; else if (status === 'WARN') warn++; else fail++;
    results.push({ label, sizeKB, limitKB, pct, status });
  }

  return { results, pass, warn, fail };
}

// ---------------------------------------------------------------------------
// Code quality metrics
// ---------------------------------------------------------------------------

function analyzeCode(files) {
  const jsFiles = files.filter(f => f.path.endsWith('.js'));
  let totalLines = 0;
  let totalFunctions = 0;
  let importScriptsCalls = 0;
  let storageOps = 0;
  let consoleCalls = 0;

  for (const file of jsFiles) {
    const content = fs.readFileSync(file.path, 'utf8');
    const lines = content.split('\n');
    let inBlockComment = false;

    for (const line of lines) {
      const trimmed = line.trim();

      // Track block comments
      if (inBlockComment) {
        if (trimmed.includes('*/')) inBlockComment = false;
        continue;
      }
      if (trimmed.startsWith('/*')) {
        if (!trimmed.includes('*/')) inBlockComment = true;
        continue;
      }

      // Skip blank lines and single-line comments
      if (trimmed === '' || trimmed.startsWith('//')) continue;

      totalLines++;
    }

    // Pattern counts on full content
    const funcMatches = content.match(/\bfunction\s+\w+/g);
    totalFunctions += funcMatches ? funcMatches.length : 0;

    const isMatches = content.match(/\bimportScripts\s*\(/g);
    importScriptsCalls += isMatches ? isMatches.length : 0;

    const storageMatches = content.match(/chrome\.storage\.\w+\.\s*(get|set|remove)\b/g);
    storageOps += storageMatches ? storageMatches.length : 0;

    const consoleMatches = content.match(/console\.(log|warn|error)\s*\(/g);
    consoleCalls += consoleMatches ? consoleMatches.length : 0;
  }

  return { totalLines, totalFunctions, importScriptsCalls, storageOps, consoleCalls, fileCount: jsFiles.length };
}

// ---------------------------------------------------------------------------
// Module dependency map
// ---------------------------------------------------------------------------

function buildDependencyMap(files) {
  const selfPath = path.resolve(__filename);
  const jsFiles = files.filter(f => f.path.endsWith('.js') && path.resolve(f.path) !== selfPath);
  const deps = {};

  for (const file of jsFiles) {
    const rel = relPath(file.path);
    const content = fs.readFileSync(file.path, 'utf8');
    const refs = [];
    for (const mod of KNOWN_MODULES) {
      // Check for typeof references or direct usage
      const pat = new RegExp(`\\b${mod}\\b`);
      if (pat.test(content)) refs.push(mod);
    }
    if (refs.length > 0) deps[rel] = refs;
  }
  return deps;
}

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

function fmtNumber(n) { return n.toLocaleString(); }

function statusTag(status) {
  if (status === 'PASS') return green('PASS');
  if (status === 'WARN') return yellow('WARN');
  return red('FAIL');
}

function budgetIndicator(sizeKB, limitKB) {
  const pct = (sizeKB / limitKB) * 100;
  if (sizeKB > limitKB) return red('X');
  if (pct > 80) return yellow('~');
  return green('\u2713');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  console.log('');
  console.log(bold('=== Cookie Manager Performance Audit ==='));
  console.log('');

  // 1. Scan files
  const files = walkDir(ROOT);
  files.sort((a, b) => relPath(a.path).localeCompare(relPath(b.path)));

  // 2. File size analysis grouped by directory
  console.log(bold('  File Size Analysis'));
  console.log('');

  const groups = {};
  for (const f of files) {
    const rel = relPath(f.path);
    const gk = groupKey(rel);
    if (!groups[gk]) groups[gk] = [];
    groups[gk].push(f);
  }

  let grandTotal = 0;
  const sortedGroups = Object.keys(groups).sort();
  for (const gk of sortedGroups) {
    const groupFiles = groups[gk];
    const groupTotal = groupFiles.reduce((s, f) => s + f.size, 0);
    grandTotal += groupTotal;
    console.log(`  ${cyan(gk + '/')}  ${dim('(' + fmtKB(toKB(groupTotal)) + ' total)')}`);
    for (const f of groupFiles) {
      const rel = relPath(f.path);
      const name = path.basename(f.path);
      const kb = toKB(f.size);
      // Check if this file has a budget
      const budget = BUDGETS.find(([, matcher]) => matcher(rel));
      const indicator = budget ? `  ${budgetIndicator(kb, budget[2])} ${dim('(budget: ' + budget[2] + 'KB)')}` : '';
      console.log(`    ${name.padEnd(35)} ${fmtKB(kb)}${indicator}`);
    }
    console.log('');
  }
  console.log(`  ${bold('Grand total:')} ${fmtKB(toKB(grandTotal))}`);
  console.log('');

  // 3. Performance budgets
  console.log(bold('  Performance Budgets'));
  console.log('');

  const { results: budgetResults, pass, warn, fail } = evaluateBudgets(files);
  for (const b of budgetResults) {
    const tag = statusTag(b.status);
    const label = b.label.padEnd(28);
    const size = b.sizeKB.toFixed(1).padStart(7);
    const limit = b.limitKB.toFixed(1);
    const pct = b.pct.toFixed(0);
    console.log(`  ${tag}  ${label} ${size} / ${limit} KB (${pct}%)`);
  }
  console.log('');

  // 4. Code quality metrics
  console.log(bold('  Code Metrics'));
  console.log('');

  const metrics = analyzeCode(files);
  console.log(`  Total JS files:          ${fmtNumber(metrics.fileCount)}`);
  console.log(`  Total JS lines:          ${fmtNumber(metrics.totalLines)}`);
  console.log(`  Total functions:         ${fmtNumber(metrics.totalFunctions)}`);
  console.log(`  importScripts calls:     ${fmtNumber(metrics.importScriptsCalls)}`);
  console.log(`  chrome.storage ops:      ${fmtNumber(metrics.storageOps)}`);
  console.log(`  console.log/warn/error:  ${fmtNumber(metrics.consoleCalls)}`);
  console.log('');

  // 5. Module dependency map
  console.log(bold('  Module Dependency Map'));
  console.log('');

  const depMap = buildDependencyMap(files);
  const depEntries = Object.entries(depMap).sort(([a], [b]) => a.localeCompare(b));
  if (depEntries.length === 0) {
    console.log(`  ${dim('No known module references found.')}`);
  } else {
    for (const [file, mods] of depEntries) {
      console.log(`  ${file}`);
      console.log(`    ${dim('->')} ${mods.join(', ')}`);
    }
  }
  console.log('');

  // 6. Summary
  const totalBudgets = pass + warn + fail;
  const summaryColor = fail > 0 ? red : warn > 0 ? yellow : green;
  console.log(summaryColor(`=== Result: ${pass}/${totalBudgets} budgets passed, ${fail} failed, ${warn} warnings ===`));
  console.log('');

  process.exit(fail > 0 ? 1 : 0);
}

main();
