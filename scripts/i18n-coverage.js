#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.join(__dirname, '..', '_locales');
const SOURCE_LOCALE = 'en';
const TARGET_LOCALES = ['es', 'pt_BR', 'ja', 'de', 'fr'];
const BAR_WIDTH = 20;

// ANSI color codes
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const GREEN = '\x1b[32m';
const CYAN = '\x1b[36m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const RESET = '\x1b[0m';

/**
 * Load and parse a messages.json file for a given locale.
 * Returns null if the file does not exist or is invalid JSON.
 */
function loadMessages(locale) {
  const filePath = path.join(LOCALES_DIR, locale, 'messages.json');

  if (!fs.existsSync(filePath)) {
    return null;
  }

  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

/**
 * Generate a progress bar string.
 */
function progressBar(percentage, width) {
  const filled = Math.round((percentage / 100) * width);
  const empty = width - filled;
  const filledStr = '\u2588'.repeat(filled);
  const emptyStr = '\u2591'.repeat(empty);

  let color;
  if (percentage >= 90) {
    color = GREEN;
  } else if (percentage >= 60) {
    color = YELLOW;
  } else {
    color = RED;
  }

  return `${color}${filledStr}${DIM}${emptyStr}${RESET}`;
}

/**
 * Pad a string to a given width (right-pad).
 */
function padRight(str, width) {
  if (str.length >= width) return str.substring(0, width);
  return str + ' '.repeat(width - str.length);
}

/**
 * Pad a string to a given width (left-pad).
 */
function padLeft(str, width) {
  if (str.length >= width) return str.substring(0, width);
  return ' '.repeat(width - str.length) + str;
}

console.log('');
console.log(`${BOLD}=== Cookie Manager i18n Coverage Report ===${RESET}`);
console.log('');

// Load source locale
const sourceMessages = loadMessages(SOURCE_LOCALE);

if (!sourceMessages) {
  console.error(`${RED}ERROR: Could not load source locale (${SOURCE_LOCALE}).${RESET}`);
  console.error(`Expected file at: ${path.join(LOCALES_DIR, SOURCE_LOCALE, 'messages.json')}`);
  process.exit(1);
}

const sourceKeys = Object.keys(sourceMessages).sort();
const totalKeys = sourceKeys.length;

console.log(`Source locale: ${CYAN}${SOURCE_LOCALE}${RESET} (${totalKeys} keys)`);
console.log('');

// Table header
const COL_LOCALE = 12;
const COL_TRANSLATED = 12;
const COL_MISSING = 9;
const COL_COVERAGE = 8;

const headerLine = [
  padRight('Locale', COL_LOCALE),
  padLeft('Translated', COL_TRANSLATED),
  padLeft('Missing', COL_MISSING),
  padLeft('Coverage', COL_COVERAGE),
  ' Progress'
].join(' | ');

const separatorLine = [
  '-'.repeat(COL_LOCALE),
  '-'.repeat(COL_TRANSLATED),
  '-'.repeat(COL_MISSING),
  '-'.repeat(COL_COVERAGE),
  '-'.repeat(BAR_WIDTH + 2)
].join('-|-');

console.log(` ${headerLine}`);
console.log(` ${separatorLine}`);

// Track overall statistics
let totalTranslated = 0;
let totalPossible = 0;
const results = [];

for (const locale of TARGET_LOCALES) {
  const localeMessages = loadMessages(locale);

  if (!localeMessages) {
    const row = [
      padRight(locale, COL_LOCALE),
      padLeft('--', COL_TRANSLATED),
      padLeft('--', COL_MISSING),
      padLeft('--', COL_COVERAGE),
      ` ${RED}FILE NOT FOUND${RESET}`
    ].join(' | ');
    console.log(` ${row}`);
    totalPossible += totalKeys;
    results.push({ locale, translated: 0, missing: totalKeys, percentage: 0 });
    continue;
  }

  const localeKeySet = new Set(Object.keys(localeMessages));
  let translated = 0;
  let missing = 0;
  const missingKeys = [];

  for (const key of sourceKeys) {
    if (localeKeySet.has(key) && localeMessages[key].message && localeMessages[key].message.trim() !== '') {
      translated++;
    } else {
      missing++;
      missingKeys.push(key);
    }
  }

  const percentage = totalKeys > 0 ? Math.round((translated / totalKeys) * 100) : 0;
  totalTranslated += translated;
  totalPossible += totalKeys;

  const row = [
    padRight(locale, COL_LOCALE),
    padLeft(String(translated), COL_TRANSLATED),
    padLeft(String(missing), COL_MISSING),
    padLeft(`${percentage}%`, COL_COVERAGE),
    ` ${progressBar(percentage, BAR_WIDTH)}`
  ].join(' | ');

  console.log(` ${row}`);
  results.push({ locale, translated, missing, percentage, missingKeys });
}

// Overall coverage
const overallPercentage = totalPossible > 0 ? Math.round((totalTranslated / totalPossible) * 100) : 0;

console.log(` ${separatorLine}`);

const overallRow = [
  padRight(`${BOLD}Overall${RESET}`, COL_LOCALE + 8), // extra for ANSI codes
  padLeft(String(totalTranslated), COL_TRANSLATED),
  padLeft(String(totalPossible - totalTranslated), COL_MISSING),
  padLeft(`${overallPercentage}%`, COL_COVERAGE),
  ` ${progressBar(overallPercentage, BAR_WIDTH)}`
].join(' | ');

console.log(` ${overallRow}`);

console.log('');
console.log(`${BOLD}Overall coverage: ${overallPercentage >= 90 ? GREEN : overallPercentage >= 60 ? YELLOW : RED}${overallPercentage}%${RESET}`);

// Show missing keys per locale if any
const localesWithMissing = results.filter(r => r.missingKeys && r.missingKeys.length > 0);

if (localesWithMissing.length > 0) {
  console.log('');
  console.log(`${BOLD}Missing keys by locale:${RESET}`);
  for (const result of localesWithMissing) {
    console.log(`  ${CYAN}${result.locale}${RESET} (${result.missing} missing):`);
    for (const key of result.missingKeys) {
      console.log(`    - ${key}`);
    }
  }
}

console.log('');