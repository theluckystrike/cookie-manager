#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.join(__dirname, '..', '_locales');
const SOURCE_LOCALE = 'en';
const TARGET_LOCALES = ['es', 'pt_BR', 'ja', 'de', 'fr'];
const MAX_NAME_LENGTH = 45;
const MAX_DESCRIPTION_LENGTH = 132;

// ANSI color codes
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const GREEN = '\x1b[32m';
const CYAN = '\x1b[36m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

let errors = 0;
let warnings = 0;

function error(msg) {
  errors++;
  console.error(`  ${RED}ERROR${RESET} ${msg}`);
}

function warn(msg) {
  warnings++;
  console.warn(`  ${YELLOW}WARN${RESET}  ${msg}`);
}

function info(msg) {
  console.log(`  ${CYAN}INFO${RESET}  ${msg}`);
}

function success(msg) {
  console.log(`  ${GREEN}PASS${RESET}  ${msg}`);
}

/**
 * Load and parse a messages.json file for a given locale.
 * Returns null if the file does not exist or is invalid JSON.
 */
function loadMessages(locale) {
  const filePath = path.join(LOCALES_DIR, locale, 'messages.json');

  if (!fs.existsSync(filePath)) {
    error(`[${locale}] messages.json does not exist at ${filePath}`);
    return null;
  }

  const raw = fs.readFileSync(filePath, 'utf8');

  try {
    const parsed = JSON.parse(raw);
    return parsed;
  } catch (e) {
    error(`[${locale}] messages.json is not valid JSON: ${e.message}`);
    return null;
  }
}

/**
 * Extract placeholder names from a message string.
 * Placeholders look like $NAME$ in Chrome i18n.
 */
function extractPlaceholders(messageStr) {
  const matches = messageStr.match(/\$[A-Z_0-9]+\$/g);
  if (!matches) return [];
  return matches.map(m => m.toUpperCase()).sort();
}

/**
 * Get placeholder keys defined in the "placeholders" object of a message entry.
 */
function getDefinedPlaceholderKeys(entry) {
  if (!entry.placeholders) return [];
  return Object.keys(entry.placeholders).map(k => `$${k.toUpperCase()}$`).sort();
}

/**
 * Check if a string contains HTML tags.
 */
function containsHtmlTags(str) {
  return /<[a-zA-Z][^>]*>/.test(str);
}

console.log('');
console.log(`${BOLD}=== Cookie Manager i18n Validation ===${RESET}`);
console.log('');

// Step 1: Check that all locale directories exist
console.log(`${BOLD}[1/9] Checking locale directories exist...${RESET}`);
const allLocales = [SOURCE_LOCALE, ...TARGET_LOCALES];
const missingDirs = [];

for (const locale of allLocales) {
  const dirPath = path.join(LOCALES_DIR, locale);
  if (!fs.existsSync(dirPath)) {
    error(`Locale directory missing: ${dirPath}`);
    missingDirs.push(locale);
  }
}

if (missingDirs.length === 0) {
  success('All locale directories exist');
}

// Step 2: Load all messages.json files and validate JSON
console.log('');
console.log(`${BOLD}[2/9] Validating messages.json files are valid JSON...${RESET}`);
const messages = {};

for (const locale of allLocales) {
  if (missingDirs.includes(locale)) continue;
  const data = loadMessages(locale);
  if (data !== null) {
    messages[locale] = data;
    success(`[${locale}] messages.json is valid JSON`);
  }
}

// If we don't have the source locale, we cannot proceed with comparison checks
if (!messages[SOURCE_LOCALE]) {
  console.log('');
  error(`Cannot proceed without source locale (${SOURCE_LOCALE}). Aborting.`);
  console.log('');
  console.log(`${BOLD}Result: ${RED}FAILED${RESET} (${errors} error(s), ${warnings} warning(s))`);
  process.exit(1);
}

const sourceKeys = Object.keys(messages[SOURCE_LOCALE]).sort();

// Step 3: Check every key in English exists in every locale
console.log('');
console.log(`${BOLD}[3/9] Checking all source keys exist in target locales...${RESET}`);

for (const locale of TARGET_LOCALES) {
  if (!messages[locale]) continue;
  const localeKeys = new Set(Object.keys(messages[locale]));
  const missing = sourceKeys.filter(k => !localeKeys.has(k));
  if (missing.length > 0) {
    error(`[${locale}] Missing ${missing.length} key(s): ${missing.join(', ')}`);
  } else {
    success(`[${locale}] All ${sourceKeys.length} source keys present`);
  }
}

// Step 4: Check for extra keys in locales (not in English)
console.log('');
console.log(`${BOLD}[4/9] Checking for extra keys not in source locale...${RESET}`);

for (const locale of TARGET_LOCALES) {
  if (!messages[locale]) continue;
  const sourceKeySet = new Set(sourceKeys);
  const localeKeys = Object.keys(messages[locale]);
  const extra = localeKeys.filter(k => !sourceKeySet.has(k));
  if (extra.length > 0) {
    warn(`[${locale}] ${extra.length} extra key(s) not in source: ${extra.join(', ')}`);
  } else {
    success(`[${locale}] No extra keys`);
  }
}

// Step 5: Check for empty messages
console.log('');
console.log(`${BOLD}[5/9] Checking for empty messages...${RESET}`);

for (const locale of allLocales) {
  if (!messages[locale]) continue;
  const emptyKeys = [];
  for (const [key, entry] of Object.entries(messages[locale])) {
    if (!entry.message || entry.message.trim() === '') {
      emptyKeys.push(key);
    }
  }
  if (emptyKeys.length > 0) {
    error(`[${locale}] ${emptyKeys.length} empty message(s): ${emptyKeys.join(', ')}`);
  } else {
    success(`[${locale}] No empty messages`);
  }
}

// Step 6: Check for HTML tags in messages
console.log('');
console.log(`${BOLD}[6/9] Checking for HTML tags in messages...${RESET}`);

for (const locale of allLocales) {
  if (!messages[locale]) continue;
  const htmlKeys = [];
  for (const [key, entry] of Object.entries(messages[locale])) {
    if (entry.message && containsHtmlTags(entry.message)) {
      htmlKeys.push(key);
    }
  }
  if (htmlKeys.length > 0) {
    error(`[${locale}] ${htmlKeys.length} message(s) contain HTML tags: ${htmlKeys.join(', ')}`);
  } else {
    success(`[${locale}] No HTML tags found`);
  }
}

// Step 7: Check placeholder tokens match between English and translations
console.log('');
console.log(`${BOLD}[7/9] Checking placeholder tokens match source locale...${RESET}`);

for (const locale of TARGET_LOCALES) {
  if (!messages[locale]) continue;
  let mismatchCount = 0;
  for (const key of sourceKeys) {
    if (!messages[locale][key]) continue;

    const sourceMsg = messages[SOURCE_LOCALE][key].message || '';
    const localeMsg = messages[locale][key].message || '';

    const sourcePlaceholders = extractPlaceholders(sourceMsg);
    const localePlaceholders = extractPlaceholders(localeMsg);

    if (sourcePlaceholders.join(',') !== localePlaceholders.join(',')) {
      error(`[${locale}] Placeholder mismatch in "${key}": source=[${sourcePlaceholders.join(', ')}] locale=[${localePlaceholders.join(', ')}]`);
      mismatchCount++;
    }

    // Also check that placeholder definitions exist if message uses placeholders
    const sourceDefinedKeys = getDefinedPlaceholderKeys(messages[SOURCE_LOCALE][key]);
    const localeDefinedKeys = getDefinedPlaceholderKeys(messages[locale][key]);

    if (sourcePlaceholders.length > 0 && localeDefinedKeys.length === 0 && sourceDefinedKeys.length > 0) {
      error(`[${locale}] Key "${key}" uses placeholders but has no placeholder definitions`);
      mismatchCount++;
    }
  }
  if (mismatchCount === 0) {
    success(`[${locale}] All placeholder tokens match`);
  }
}

// Step 8: Check extName and extDescription length limits
console.log('');
console.log(`${BOLD}[8/9] Checking Chrome Web Store length limits...${RESET}`);

for (const locale of allLocales) {
  if (!messages[locale]) continue;

  // Check extensionName (sometimes called extName)
  const nameKey = messages[locale].extensionName ? 'extensionName' : 'extName';
  const nameEntry = messages[locale][nameKey];
  if (nameEntry) {
    const nameLen = nameEntry.message.length;
    if (nameLen > MAX_NAME_LENGTH) {
      error(`[${locale}] extensionName is ${nameLen} chars (max ${MAX_NAME_LENGTH}): "${nameEntry.message}"`);
    } else {
      success(`[${locale}] extensionName: ${nameLen}/${MAX_NAME_LENGTH} chars`);
    }
  }

  // Check extensionDescription (sometimes called extDescription)
  const descKey = messages[locale].extensionDescription ? 'extensionDescription' : 'extDescription';
  const descEntry = messages[locale][descKey];
  if (descEntry) {
    const descLen = descEntry.message.length;
    if (descLen > MAX_DESCRIPTION_LENGTH) {
      error(`[${locale}] extensionDescription is ${descLen} chars (max ${MAX_DESCRIPTION_LENGTH}): "${descEntry.message}"`);
    } else {
      success(`[${locale}] extensionDescription: ${descLen}/${MAX_DESCRIPTION_LENGTH} chars`);
    }
  }
}

// Step 9: Check for untranslated strings (same as English)
console.log('');
console.log(`${BOLD}[9/9] Checking for potentially untranslated strings...${RESET}`);

// Keys that are expected to be the same across locales (brand names, technical terms, etc.)
const EXPECTED_SAME = new Set([
  'extensionName', 'actionTitle', 'brandTitle', 'footerBrand',
  'placeholderDomain', 'placeholderPath',
  'labelSecure', 'labelHttpOnly', 'labelSameSite',
  'sameSiteLax', 'sameSiteStrict', 'sameSiteNone',
  'badgeSecure', 'badgeHttpOnly', 'badgeJwt'
]);

for (const locale of TARGET_LOCALES) {
  if (!messages[locale]) continue;
  const untranslated = [];
  for (const key of sourceKeys) {
    if (!messages[locale][key]) continue;
    if (EXPECTED_SAME.has(key)) continue;

    const sourceMsg = messages[SOURCE_LOCALE][key].message;
    const localeMsg = messages[locale][key].message;

    if (sourceMsg === localeMsg && sourceMsg.length > 1) {
      untranslated.push(key);
    }
  }
  if (untranslated.length > 0) {
    warn(`[${locale}] ${untranslated.length} potentially untranslated string(s): ${untranslated.join(', ')}`);
  } else {
    success(`[${locale}] No untranslated strings detected`);
  }
}

// Summary
console.log('');
console.log(`${BOLD}=== Summary ===${RESET}`);
console.log(`  Source locale: ${SOURCE_LOCALE} (${sourceKeys.length} keys)`);
console.log(`  Target locales: ${TARGET_LOCALES.join(', ')}`);
console.log(`  Errors: ${errors > 0 ? RED : GREEN}${errors}${RESET}`);
console.log(`  Warnings: ${warnings > 0 ? YELLOW : GREEN}${warnings}${RESET}`);
console.log('');

if (errors > 0) {
  console.log(`${BOLD}Result: ${RED}FAILED${RESET}`);
  process.exit(1);
} else if (warnings > 0) {
  console.log(`${BOLD}Result: ${YELLOW}PASSED with warnings${RESET}`);
  process.exit(0);
} else {
  console.log(`${BOLD}Result: ${GREEN}PASSED${RESET}`);
  process.exit(0);
}