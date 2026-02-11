#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const ROOT = path.resolve(__dirname, '..');
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', '.DS_Store']);

// ---------------------------------------------------------------------------
// Terminal colors (no dependencies)
// ---------------------------------------------------------------------------

const C = {
  reset:   '\x1b[0m',
  bold:    '\x1b[1m',
  dim:     '\x1b[2m',
  red:     '\x1b[31m',
  green:   '\x1b[32m',
  yellow:  '\x1b[33m',
  blue:    '\x1b[34m',
  cyan:    '\x1b[36m',
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

function walkDir(dir, ext, results) {
  results = results || [];
  var entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); }
  catch (e) { return results; }

  for (var i = 0; i < entries.length; i++) {
    var entry = entries[i];
    if (SKIP_DIRS.has(entry.name)) continue;
    var fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(fullPath, ext, results);
    } else if (!ext || path.extname(entry.name) === ext) {
      results.push(fullPath);
    }
  }
  return results;
}

function readFile(filePath) {
  try { return fs.readFileSync(filePath, 'utf8'); } catch (e) { return null; }
}

function relPath(p) { return path.relative(ROOT, p); }

// ---------------------------------------------------------------------------
// Result tracking
// ---------------------------------------------------------------------------

var results = { pass: 0, warn: 0, fail: 0, details: [] };

function pass(category, message) {
  results.pass++;
  results.details.push({ status: 'PASS', category: category, message: message });
}

function warn(category, message) {
  results.warn++;
  results.details.push({ status: 'WARN', category: category, message: message });
}

function fail(category, message) {
  results.fail++;
  results.details.push({ status: 'FAIL', category: category, message: message });
}

function statusTag(status) {
  if (status === 'PASS') return green('PASS');
  if (status === 'WARN') return yellow('WARN');
  return red('FAIL');
}

// ---------------------------------------------------------------------------
// 1. Privacy Documentation (5 checks)
// ---------------------------------------------------------------------------

function auditPrivacyDocs() {
  var privacyPath = path.join(ROOT, 'src', 'legal', 'privacy-policy.html');
  var tosPath = path.join(ROOT, 'src', 'legal', 'terms-of-service.html');
  var popupPath = path.join(ROOT, 'src', 'popup', 'index.html');
  var CAT = 'Privacy Docs';

  // 1a. Privacy policy exists
  var privacyContent = readFile(privacyPath);
  if (privacyContent) {
    pass(CAT, 'Privacy policy file exists (src/legal/privacy-policy.html)');
  } else {
    fail(CAT, 'Privacy policy file missing (src/legal/privacy-policy.html)');
  }

  // 1b. Terms of service exists
  var tosContent = readFile(tosPath);
  if (tosContent) {
    pass(CAT, 'Terms of service file exists (src/legal/terms-of-service.html)');
  } else {
    fail(CAT, 'Terms of service file missing (src/legal/terms-of-service.html)');
  }

  // 1c. Privacy policy contains key sections
  if (privacyContent) {
    var hasDataCollection = /data\s+collect/i.test(privacyContent) || /information\s+we\s+collect/i.test(privacyContent) || /what\s+data/i.test(privacyContent);
    var hasUserRights = /your\s+rights/i.test(privacyContent) || /user\s+rights/i.test(privacyContent) || /data\s+rights/i.test(privacyContent);
    var hasContact = /contact/i.test(privacyContent);
    if (hasDataCollection && hasUserRights && hasContact) {
      pass(CAT, 'Privacy policy contains key sections (data collection, user rights, contact)');
    } else {
      var missing = [];
      if (!hasDataCollection) missing.push('data collection');
      if (!hasUserRights) missing.push('user rights');
      if (!hasContact) missing.push('contact info');
      warn(CAT, 'Privacy policy missing sections: ' + missing.join(', '));
    }
  } else {
    fail(CAT, 'Cannot check privacy policy sections (file missing)');
  }

  // 1d. Terms of service contains key sections
  if (tosContent) {
    var hasLicense = /license/i.test(tosContent) || /grant/i.test(tosContent);
    var hasLiability = /liabilit/i.test(tosContent) || /warranty/i.test(tosContent) || /disclaimer/i.test(tosContent);
    var hasTermination = /terminat/i.test(tosContent) || /suspend/i.test(tosContent);
    if (hasLicense && hasLiability && hasTermination) {
      pass(CAT, 'Terms of service contains key sections (license, liability, termination)');
    } else {
      var tosMissing = [];
      if (!hasLicense) tosMissing.push('license');
      if (!hasLiability) tosMissing.push('liability');
      if (!hasTermination) tosMissing.push('termination');
      warn(CAT, 'Terms of service missing sections: ' + tosMissing.join(', '));
    }
  } else {
    fail(CAT, 'Cannot check terms of service sections (file missing)');
  }

  // 1e. Legal pages accessible (linked from popup HTML)
  var popupContent = readFile(popupPath);
  if (popupContent) {
    var linksPrivacy = /privacy-policy\.html/i.test(popupContent);
    if (linksPrivacy) {
      pass(CAT, 'Privacy policy is linked from popup HTML');
    } else {
      warn(CAT, 'Privacy policy is not linked from popup HTML');
    }
  } else {
    fail(CAT, 'Cannot check popup HTML for legal links (file missing)');
  }
}

// ---------------------------------------------------------------------------
// 2. Data Handling Practices (6 checks)
// ---------------------------------------------------------------------------

function auditDataHandling() {
  var CAT = 'Data Handling';
  var selfPath = path.resolve(__filename);

  // 2a. No external URLs in JS files
  var jsFiles = walkDir(path.join(ROOT, 'src'), '.js');
  var externalUrlFound = false;
  var allowedPatterns = [
    /xmlns/i,                          // SVG namespaces
    /chrome\.\w+/,                     // Chrome APIs
    /chrome-extension:\/\//,           // Extension URLs
    /zovo\.one/i,                      // Project homepage
    /w3\.org/i,                        // W3C namespaces
    /\/\//,                            // Comments (line starts with //)
  ];

  for (var i = 0; i < jsFiles.length; i++) {
    if (path.resolve(jsFiles[i]) === selfPath) continue;
    var content = readFile(jsFiles[i]);
    if (!content) continue;
    var lines = content.split('\n');
    for (var j = 0; j < lines.length; j++) {
      var line = lines[j].trim();
      // Skip comments
      if (line.startsWith('//') || line.startsWith('*') || line.startsWith('/*')) continue;

      // Check for fetch, XMLHttpRequest
      if (/\bfetch\s*\(/.test(line) || /XMLHttpRequest/.test(line)) {
        externalUrlFound = true;
        break;
      }

      // Check for http:// or https:// URLs
      var urlMatch = line.match(/https?:\/\/[^\s'"`)>]+/gi);
      if (urlMatch) {
        for (var k = 0; k < urlMatch.length; k++) {
          var url = urlMatch[k];
          var isAllowed = /xmlns/i.test(url) || /w3\.org/i.test(url) ||
                          /zovo\.one/i.test(url) || /chrome/i.test(url) ||
                          /mozilla\.org/i.test(url) || /example\.com/i.test(url) ||
                          /twitter\.com/i.test(url) || /linkedin\.com/i.test(url) ||
                          /dev\.to/i.test(url) || /\$\{/.test(line);
          if (!isAllowed) {
            externalUrlFound = true;
            break;
          }
        }
      }
      if (externalUrlFound) break;
    }
    if (externalUrlFound) break;
  }

  if (!externalUrlFound) {
    pass(CAT, 'No external URLs or fetch/XHR calls found in extension JS');
  } else {
    fail(CAT, 'External URL, fetch(), or XMLHttpRequest detected in extension JS');
  }

  // 2b. No tracking pixels or beacons in HTML
  var htmlFiles = walkDir(path.join(ROOT, 'src'), '.html');
  var trackingFound = false;
  for (var h = 0; h < htmlFiles.length; h++) {
    var htmlContent = readFile(htmlFiles[h]);
    if (!htmlContent) continue;
    if (/navigator\.sendBeacon\s*\(/i.test(htmlContent) ||
        /<img[^>]+width\s*=\s*["']?1["']?\s+height\s*=\s*["']?1["']?/i.test(htmlContent) ||
        /<script[^>]*google-analytics|<script[^>]*gtag|<script[^>]*facebook\.net|<script[^>]*analytics\.js/i.test(htmlContent)) {
      trackingFound = true;
      break;
    }
  }
  if (!trackingFound) {
    pass(CAT, 'No tracking pixels or analytics beacons found in HTML');
  } else {
    fail(CAT, 'Tracking pixel or analytics beacon detected in HTML');
  }

  // 2c. Content Security Policy blocks external scripts
  var manifestPath = path.join(ROOT, 'manifest.json');
  var manifestContent = readFile(manifestPath);
  if (manifestContent) {
    try {
      var manifest = JSON.parse(manifestContent);
      var csp = manifest.content_security_policy;
      var cspStr = '';
      if (typeof csp === 'string') cspStr = csp;
      else if (csp && typeof csp === 'object') cspStr = csp.extension_pages || '';

      if (/script-src\s+'self'/i.test(cspStr)) {
        pass(CAT, 'CSP restricts script-src to self only');
      } else {
        warn(CAT, 'CSP does not restrict script-src to self');
      }
    } catch (e) {
      fail(CAT, 'Cannot parse manifest.json for CSP check');
    }
  } else {
    fail(CAT, 'manifest.json not found');
  }

  // 2d. No eval() in main extension code (scripts/ directory is OK)
  var srcJsFiles = walkDir(path.join(ROOT, 'src'), '.js');
  var evalFound = false;
  for (var e = 0; e < srcJsFiles.length; e++) {
    var jsContent = readFile(srcJsFiles[e]);
    if (!jsContent) continue;
    var jsLines = jsContent.split('\n');
    for (var l = 0; l < jsLines.length; l++) {
      var jsLine = jsLines[l].trim();
      if (jsLine.startsWith('//') || jsLine.startsWith('*')) continue;
      if (/\beval\s*\(/.test(jsLine)) {
        evalFound = true;
        break;
      }
    }
    if (evalFound) break;
  }
  if (!evalFound) {
    pass(CAT, 'No eval() usage in extension source code');
  } else {
    fail(CAT, 'eval() detected in extension source code');
  }

  // 2e. LegalCompliance module exists
  var legalModulePath = path.join(ROOT, 'src', 'shared', 'legal-compliance.js');
  if (fs.existsSync(legalModulePath)) {
    pass(CAT, 'LegalCompliance module exists (src/shared/legal-compliance.js)');
  } else {
    fail(CAT, 'LegalCompliance module missing (src/shared/legal-compliance.js)');
  }

  // 2f. Consent mechanism available
  var legalContent = readFile(legalModulePath);
  if (legalContent && (/ConsentManager/i.test(legalContent) || /consent/i.test(legalContent))) {
    pass(CAT, 'Consent mechanism found in LegalCompliance module');
  } else {
    warn(CAT, 'No consent mechanism found in codebase');
  }
}

// ---------------------------------------------------------------------------
// 3. GDPR Compliance Indicators (5 checks)
// ---------------------------------------------------------------------------

function auditGDPR() {
  var CAT = 'GDPR';
  var allJs = walkDir(path.join(ROOT, 'src'), '.js');
  var combinedJs = '';
  for (var i = 0; i < allJs.length; i++) {
    var c = readFile(allJs[i]);
    if (c) combinedJs += c + '\n';
  }

  // 3a. Data export capability
  if (/exportUserData/i.test(combinedJs) || /EXPORT_USER_DATA/.test(combinedJs)) {
    pass(CAT, 'Data export capability found (exportUserData / EXPORT_USER_DATA)');
  } else {
    fail(CAT, 'No data export capability found');
  }

  // 3b. Data deletion capability
  if (/deleteUserData/i.test(combinedJs) || /DELETE_USER_DATA/.test(combinedJs)) {
    pass(CAT, 'Data deletion capability found (deleteUserData / DELETE_USER_DATA)');
  } else {
    fail(CAT, 'No data deletion capability found');
  }

  // 3c. Data access/summary capability
  if (/getDataSummary/i.test(combinedJs) || /GET_DATA_SUMMARY/.test(combinedJs) || /DataRights/i.test(combinedJs)) {
    pass(CAT, 'Data access/summary capability found');
  } else {
    warn(CAT, 'No data access or summary capability found');
  }

  // 3d. Consent management
  if (/ConsentManager/i.test(combinedJs) || /_legalConsent/.test(combinedJs) || /SAVE_CONSENT/.test(combinedJs)) {
    pass(CAT, 'Consent management found (ConsentManager / consent storage keys)');
  } else {
    warn(CAT, 'No consent management mechanism found');
  }

  // 3e. Data minimization (check permissions in manifest)
  var manifestContent = readFile(path.join(ROOT, 'manifest.json'));
  if (manifestContent) {
    try {
      var manifest = JSON.parse(manifestContent);
      var perms = manifest.permissions || [];
      var hostPerms = manifest.host_permissions || [];
      var expectedPerms = ['cookies', 'storage', 'activeTab'];
      var unexpected = perms.filter(function (p) { return expectedPerms.indexOf(p) === -1; });
      if (unexpected.length === 0) {
        pass(CAT, 'Data minimization: only essential permissions declared');
      } else {
        warn(CAT, 'Additional permissions beyond core set: ' + unexpected.join(', '));
      }
    } catch (e) {
      fail(CAT, 'Cannot parse manifest.json for permission check');
    }
  }
}

// ---------------------------------------------------------------------------
// 4. CCPA Compliance Indicators (3 checks)
// ---------------------------------------------------------------------------

function auditCCPA() {
  var CAT = 'CCPA';
  var allJs = walkDir(path.join(ROOT, 'src'), '.js');
  var combinedJs = '';
  for (var i = 0; i < allJs.length; i++) {
    var c = readFile(allJs[i]);
    if (c) combinedJs += c + '\n';
  }

  // 4a. No data selling (no external data transmission endpoints)
  var hasExternalEndpoints = /fetch\s*\(/.test(combinedJs) || /XMLHttpRequest/.test(combinedJs);
  if (!hasExternalEndpoints) {
    pass(CAT, 'No data selling: no external transmission endpoints found');
  } else {
    fail(CAT, 'External data transmission endpoint detected (potential data sharing)');
  }

  // 4b. User data access mechanism exists
  if (/exportUserData/i.test(combinedJs) || /getDataSummary/i.test(combinedJs)) {
    pass(CAT, 'User data access mechanism exists (export/summary)');
  } else {
    warn(CAT, 'No user data access mechanism found');
  }

  // 4c. Privacy policy accessible to users
  var privacyPath = path.join(ROOT, 'src', 'legal', 'privacy-policy.html');
  var popupPath = path.join(ROOT, 'src', 'popup', 'index.html');
  var popupContent = readFile(popupPath);
  if (fs.existsSync(privacyPath) && popupContent && /privacy/i.test(popupContent)) {
    pass(CAT, 'Privacy policy exists and is accessible to users');
  } else if (fs.existsSync(privacyPath)) {
    warn(CAT, 'Privacy policy exists but may not be linked to users');
  } else {
    fail(CAT, 'Privacy policy not found');
  }
}

// ---------------------------------------------------------------------------
// 5. Chrome Web Store Requirements (4 checks)
// ---------------------------------------------------------------------------

function auditCWSRequirements() {
  var CAT = 'CWS Requirements';
  var manifestContent = readFile(path.join(ROOT, 'manifest.json'));

  // 5a. Privacy policy URL can be provided
  var privacyPath = path.join(ROOT, 'src', 'legal', 'privacy-policy.html');
  if (fs.existsSync(privacyPath)) {
    pass(CAT, 'Privacy policy file exists for CWS submission');
  } else {
    fail(CAT, 'Privacy policy file missing (required for CWS)');
  }

  if (!manifestContent) {
    fail(CAT, 'manifest.json not found');
    return;
  }

  var manifest;
  try { manifest = JSON.parse(manifestContent); }
  catch (e) { fail(CAT, 'Cannot parse manifest.json'); return; }

  // 5b. Single purpose described (manifest description present)
  var desc = manifest.description || '';
  if (desc.length > 0) {
    pass(CAT, 'Manifest description present (single purpose)');
  } else {
    fail(CAT, 'Manifest description missing');
  }

  // 5c. Permissions justified (each permission used in code)
  var perms = manifest.permissions || [];
  var allJs = walkDir(path.join(ROOT, 'src'), '.js');
  var combinedJs = '';
  for (var i = 0; i < allJs.length; i++) {
    var c = readFile(allJs[i]);
    if (c) combinedJs += c + '\n';
  }

  var permUsageMap = {
    'cookies':        /chrome\.cookies/,
    'activeTab':      /activeTab|chrome\.tabs/,
    'storage':        /chrome\.storage/,
    'contextMenus':   /chrome\.contextMenus/,
    'notifications':  /chrome\.notifications/,
    'alarms':         /chrome\.alarms/,
  };

  var unusedPerms = [];
  for (var p = 0; p < perms.length; p++) {
    var perm = perms[p];
    var pattern = permUsageMap[perm];
    if (pattern && !pattern.test(combinedJs)) {
      unusedPerms.push(perm);
    }
  }

  if (unusedPerms.length === 0) {
    pass(CAT, 'All declared permissions are used in code');
  } else {
    warn(CAT, 'Permissions declared but not found in code: ' + unusedPerms.join(', '));
  }

  // 5d. No prohibited practices (crypto mining, keylogging)
  var hasCryptoMining = /cryptonight|coinhive|coinminer|crypto\s*min/i.test(combinedJs);
  var hasKeylogging = /keylog|keystroke\s*log|key\s*logger/i.test(combinedJs);
  if (!hasCryptoMining && !hasKeylogging) {
    pass(CAT, 'No prohibited practices detected (no crypto mining, no keylogging)');
  } else {
    var issues = [];
    if (hasCryptoMining) issues.push('crypto mining');
    if (hasKeylogging) issues.push('keylogging');
    fail(CAT, 'Prohibited practice detected: ' + issues.join(', '));
  }
}

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

function calculateScore() {
  var total = results.pass + results.warn + results.fail;
  if (total === 0) return 0;
  var score = ((results.pass + results.warn * 0.5) / total) * 100;
  return Math.round(score);
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
  console.log(bold('=== Cookie Manager Legal Compliance Audit ==='));
  console.log(dim('  GDPR / CCPA / Chrome Web Store readiness'));
  console.log('');

  // Run all audit categories
  auditPrivacyDocs();
  auditDataHandling();
  auditGDPR();
  auditCCPA();
  auditCWSRequirements();

  // Print results by category
  var categories = ['Privacy Docs', 'Data Handling', 'GDPR', 'CCPA', 'CWS Requirements'];

  for (var c = 0; c < categories.length; c++) {
    var cat = categories[c];
    var catResults = results.details.filter(function (d) { return d.category === cat; });
    if (catResults.length === 0) continue;

    var catPass = catResults.filter(function (d) { return d.status === 'PASS'; }).length;
    var catWarn = catResults.filter(function (d) { return d.status === 'WARN'; }).length;
    var catFail = catResults.filter(function (d) { return d.status === 'FAIL'; }).length;

    console.log(bold('  ' + cat) + dim('  (' + catPass + ' pass, ' + catWarn + ' warn, ' + catFail + ' fail)'));
    console.log('');

    for (var d = 0; d < catResults.length; d++) {
      var detail = catResults[d];
      var tag = statusTag(detail.status);
      console.log('  ' + tag + '  ' + detail.message);
    }
    console.log('');
  }

  // Score
  var score = calculateScore();
  var grade = gradeFromScore(score);
  var colorFn = scoreColor(score);

  console.log(bold('  Summary'));
  console.log('');
  console.log('  Total checks:    ' + (results.pass + results.warn + results.fail));
  console.log('  ' + green('Passed:') + '          ' + results.pass);
  console.log('  ' + yellow('Warnings:') + '        ' + results.warn);
  console.log('  ' + red('Failed:') + '          ' + results.fail);
  console.log('');
  console.log(colorFn('=== Legal Compliance Score: ' + score + '/100 (' + grade + ') ==='));
  console.log('');

  process.exit(results.fail > 0 ? 1 : 0);
}

main();
