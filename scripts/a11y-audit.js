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

function walkDir(dir, ext, results) {
  results = results || [];
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); }
  catch { return results; }

  for (const entry of entries) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(fullPath, ext, results);
    } else if (path.extname(entry.name) === ext) {
      results.push(fullPath);
    }
  }
  return results;
}

function collectFiles(ext) {
  return walkDir(ROOT, ext);
}

function relPath(p) { return path.relative(ROOT, p); }

// ---------------------------------------------------------------------------
// Result tracking
// ---------------------------------------------------------------------------

const results = { pass: 0, warn: 0, fail: 0, details: [] };

function pass(category, message, file) {
  results.pass++;
  results.details.push({ status: 'PASS', category, message, file });
}

function warn(category, message, file) {
  results.warn++;
  results.details.push({ status: 'WARN', category, message, file });
}

function fail(category, message, file) {
  results.fail++;
  results.details.push({ status: 'FAIL', category, message, file });
}

function statusTag(status) {
  if (status === 'PASS') return green('PASS');
  if (status === 'WARN') return yellow('WARN');
  return red('FAIL');
}

// ---------------------------------------------------------------------------
// 1. HTML Audit
// ---------------------------------------------------------------------------

function auditHTML() {
  const htmlFiles = collectFiles('.html');

  for (const file of htmlFiles) {
    const rel = relPath(file);
    const content = fs.readFileSync(file, 'utf8');

    // 1a. Check for <html lang="">
    if (/<html\s[^>]*lang\s*=\s*["'][^"']+["']/i.test(content)) {
      pass('HTML', `<html lang> attribute present`, rel);
    } else if (/<html/i.test(content)) {
      fail('HTML', `Missing lang attribute on <html>`, rel);
    }

    // 1b. Images without alt attribute
    const imgRegex = /<img\b[^>]*>/gi;
    let imgMatch;
    while ((imgMatch = imgRegex.exec(content)) !== null) {
      const tag = imgMatch[0];
      if (!/\balt\s*=/i.test(tag)) {
        fail('HTML', `<img> missing alt attribute`, rel);
      } else {
        pass('HTML', `<img> has alt attribute`, rel);
      }
    }

    // 1c. Buttons without accessible name
    // Match button tags and check for text content, aria-label, or aria-labelledby
    const buttonRegex = /<button\b([^>]*)>([\s\S]*?)<\/button>/gi;
    let btnMatch;
    while ((btnMatch = buttonRegex.exec(content)) !== null) {
      const attrs = btnMatch[1];
      const innerContent = btnMatch[2];
      const hasAriaLabel = /aria-label\s*=/i.test(attrs);
      const hasAriaLabelledBy = /aria-labelledby\s*=/i.test(attrs);
      const hasTitle = /\btitle\s*=/i.test(attrs);
      // Strip HTML tags to get text content
      const textContent = innerContent.replace(/<[^>]*>/g, '').trim();
      const hasText = textContent.length > 0;
      // Check for data-i18n attributes which provide text
      const hasI18n = /data-i18n/i.test(innerContent) || /data-i18n/i.test(attrs);

      if (hasAriaLabel || hasAriaLabelledBy || hasText || hasI18n || hasTitle) {
        pass('HTML', `<button> has accessible name`, rel);
      } else {
        warn('HTML', `<button> may lack accessible name (no text, aria-label, or title)`, rel);
      }
    }

    // 1d. Inputs without associated label or aria-label
    const inputRegex = /<input\b([^>]*)>/gi;
    let inputMatch;
    while ((inputMatch = inputRegex.exec(content)) !== null) {
      const attrs = inputMatch[1];
      // Skip hidden inputs
      if (/type\s*=\s*["']hidden["']/i.test(attrs)) continue;
      // Skip checkbox/radio inside <label>
      const hasAriaLabel = /aria-label\s*=/i.test(attrs);
      const hasId = /\bid\s*=\s*["']([^"']+)["']/i.exec(attrs);
      let hasAssociatedLabel = false;
      if (hasId) {
        const inputId = hasId[1];
        // Check for <label for="inputId">
        const labelForRegex = new RegExp('<label[^>]*\\bfor\\s*=\\s*["\']' + inputId + '["\']', 'i');
        hasAssociatedLabel = labelForRegex.test(content);
        // Also check if input is inside a <label> tag (rough heuristic)
        if (!hasAssociatedLabel) {
          const labelWrapRegex = new RegExp('<label[^>]*>[\\s\\S]*?' + inputId + '[\\s\\S]*?<\\/label>', 'i');
          hasAssociatedLabel = labelWrapRegex.test(content);
        }
      }
      const hasPlaceholder = /placeholder\s*=/i.test(attrs);

      if (hasAriaLabel || hasAssociatedLabel) {
        pass('HTML', `<input> has accessible label`, rel);
      } else if (hasPlaceholder) {
        warn('HTML', `<input> relies on placeholder only (should have label or aria-label)`, rel);
      } else {
        // Check if inside a wrapping <label>
        const hasLabelWrapper = /type\s*=\s*["'](checkbox|radio)["']/i.test(attrs);
        if (hasLabelWrapper) {
          pass('HTML', `<input type="checkbox/radio"> likely inside <label>`, rel);
        } else {
          fail('HTML', `<input> missing associated <label> or aria-label`, rel);
        }
      }
    }

    // 1e. SVGs inside buttons without aria-hidden
    const btnSvgRegex = /<button\b[^>]*>[\s\S]*?<svg\b([^>]*)>[\s\S]*?<\/svg>[\s\S]*?<\/button>/gi;
    let svgBtnMatch;
    while ((svgBtnMatch = btnSvgRegex.exec(content)) !== null) {
      const svgAttrs = svgBtnMatch[1];
      if (/aria-hidden\s*=\s*["']true["']/i.test(svgAttrs)) {
        pass('HTML', `SVG inside <button> has aria-hidden="true"`, rel);
      } else {
        warn('HTML', `SVG inside <button> missing aria-hidden="true"`, rel);
      }
    }

    // 1f. Modals/dialogs without role="dialog" or aria-modal
    const modalRegex = /<div\b([^>]*class\s*=\s*["'][^"']*modal[^"']*["'][^>]*)>/gi;
    let modalMatch;
    while ((modalMatch = modalRegex.exec(content)) !== null) {
      const attrs = modalMatch[1];
      // Skip modal-backdrop, modal-content, modal-header, etc.
      if (/modal-(backdrop|content|header|body|footer|close|sm|lg)/i.test(attrs)) continue;
      const hasRole = /role\s*=\s*["']dialog["']/i.test(attrs);
      const hasAriaModal = /aria-modal\s*=\s*["']true["']/i.test(attrs);
      if (hasRole || hasAriaModal) {
        pass('HTML', `Modal has role="dialog" or aria-modal`, rel);
      } else {
        warn('HTML', `Modal element missing role="dialog" or aria-modal`, rel);
      }
    }

    // 1g. Landmark roles
    const hasRoleMain = /role\s*=\s*["']main["']/i.test(content) || /<main[\s>]/i.test(content);
    const hasRoleBanner = /role\s*=\s*["']banner["']/i.test(content) || /<header[\s>]/i.test(content);
    const hasRoleContentinfo = /role\s*=\s*["']contentinfo["']/i.test(content) || /<footer[\s>]/i.test(content);

    if (hasRoleMain) {
      pass('HTML', `Main landmark present`, rel);
    } else {
      warn('HTML', `Missing main landmark (role="main" or <main>)`, rel);
    }

    if (hasRoleBanner) {
      pass('HTML', `Banner landmark present`, rel);
    } else {
      warn('HTML', `Missing banner landmark (role="banner" or <header>)`, rel);
    }

    if (hasRoleContentinfo) {
      pass('HTML', `Contentinfo landmark present`, rel);
    } else {
      warn('HTML', `Missing contentinfo landmark (role="contentinfo" or <footer>)`, rel);
    }
  }

  if (htmlFiles.length === 0) {
    warn('HTML', 'No HTML files found to audit', '');
  }
}

// ---------------------------------------------------------------------------
// 2. CSS Audit
// ---------------------------------------------------------------------------

function auditCSS() {
  const cssFiles = collectFiles('.css');
  const allCSS = cssFiles.map(f => ({
    path: f,
    rel: relPath(f),
    content: fs.readFileSync(f, 'utf8')
  }));

  const combinedCSS = allCSS.map(f => f.content).join('\n');

  // 2a. prefers-reduced-motion
  if (/prefers-reduced-motion/i.test(combinedCSS)) {
    pass('CSS', `prefers-reduced-motion media query found`);
  } else {
    fail('CSS', `Missing prefers-reduced-motion media query`);
  }

  // 2b. forced-colors
  if (/forced-colors/i.test(combinedCSS)) {
    pass('CSS', `forced-colors media query found`);
  } else {
    warn('CSS', `Missing forced-colors media query (high contrast support)`);
  }

  // 2c. focus-visible styles
  if (/focus-visible/i.test(combinedCSS)) {
    pass('CSS', `focus-visible styles found`);
  } else {
    fail('CSS', `Missing :focus-visible styles`);
  }

  // 2d. .visually-hidden class
  if (/\.visually-hidden/i.test(combinedCSS)) {
    pass('CSS', `.visually-hidden utility class found`);
  } else {
    warn('CSS', `Missing .visually-hidden utility class`);
  }

  // 2e. outline: none or outline: 0 without replacement focus style
  for (const file of allCSS) {
    const lines = file.content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (/outline\s*:\s*(none|0)\b/i.test(line)) {
        // Check if there's a box-shadow or border replacement nearby (within 3 lines)
        const context = lines.slice(Math.max(0, i - 2), i + 4).join(' ');
        const hasReplacement = /box-shadow/i.test(context) || /border-color/i.test(context);
        if (hasReplacement) {
          pass('CSS', `outline: none has focus replacement (line ${i + 1})`, file.rel);
        } else {
          // Check if it's within a :focus or :focus-visible block
          const blockContext = lines.slice(Math.max(0, i - 5), i + 1).join(' ');
          if (/(:focus-visible|:focus)\s*\{/.test(blockContext)) {
            warn('CSS', `outline: none in focus rule without visible replacement (line ${i + 1})`, file.rel);
          } else {
            // outline: none outside focus context is usually okay (e.g., on search input)
            pass('CSS', `outline: none used outside focus context (line ${i + 1})`, file.rel);
          }
        }
      }
    }
  }

  if (cssFiles.length === 0) {
    warn('CSS', 'No CSS files found to audit', '');
  }
}

// ---------------------------------------------------------------------------
// 3. JS Audit
// ---------------------------------------------------------------------------

function auditJS() {
  const jsFiles = collectFiles('.js');
  // Exclude this audit script itself
  const selfPath = path.resolve(__filename);
  const auditFiles = jsFiles.filter(f => path.resolve(f) !== selfPath);

  const allJS = auditFiles.map(f => ({
    path: f,
    rel: relPath(f),
    content: fs.readFileSync(f, 'utf8')
  }));

  const combinedJS = allJS.map(f => f.content).join('\n');

  // 3a. aria- attribute usage
  const ariaCount = (combinedJS.match(/aria-/g) || []).length;
  if (ariaCount > 0) {
    pass('JS', `ARIA attribute usage found (${ariaCount} references)`);
  } else {
    warn('JS', `No aria- attribute references found in JS`);
  }

  // 3b. Focus management (.focus() calls)
  const focusCount = (combinedJS.match(/\.focus\s*\(/g) || []).length;
  if (focusCount > 0) {
    pass('JS', `Focus management found (${focusCount} .focus() calls)`);
  } else {
    warn('JS', `No .focus() calls found (focus management may be missing)`);
  }

  // 3c. Live region / announcement patterns
  const hasLiveRegion = /aria-live/i.test(combinedJS) ||
                         /live.?region/i.test(combinedJS) ||
                         /announce/i.test(combinedJS);
  if (hasLiveRegion) {
    pass('JS', `Live region / screen reader announcement patterns found`);
  } else {
    warn('JS', `No live region or announcement patterns found`);
  }

  // 3d. Keyboard event handling
  const hasKeydown = /keydown/i.test(combinedJS);
  const hasKeyup = /keyup/i.test(combinedJS);
  const hasKeypress = /keypress/i.test(combinedJS);
  const keyboardEvents = [hasKeydown && 'keydown', hasKeyup && 'keyup', hasKeypress && 'keypress'].filter(Boolean);
  if (keyboardEvents.length > 0) {
    pass('JS', `Keyboard event handling found (${keyboardEvents.join(', ')})`);
  } else {
    warn('JS', `No keyboard event handling found`);
  }

  // 3e. tabindex > 0 (anti-pattern)
  for (const file of allJS) {
    const tabindexMatches = file.content.match(/tabindex\s*[=:]\s*["']?\s*(\d+)/gi) || [];
    for (const match of tabindexMatches) {
      const valueMatch = match.match(/(\d+)/);
      if (valueMatch) {
        const val = parseInt(valueMatch[1], 10);
        if (val > 0) {
          fail('JS', `tabindex="${val}" found (values > 0 are an anti-pattern)`, file.rel);
        }
      }
    }
  }

  // Also check HTML files for tabindex > 0
  const htmlFiles = collectFiles('.html');
  for (const file of htmlFiles) {
    const content = fs.readFileSync(file, 'utf8');
    const tabindexMatches = content.match(/tabindex\s*=\s*["']\s*(\d+)\s*["']/gi) || [];
    for (const match of tabindexMatches) {
      const valueMatch = match.match(/(\d+)/);
      if (valueMatch) {
        const val = parseInt(valueMatch[1], 10);
        if (val > 0) {
          fail('JS', `tabindex="${val}" in HTML (values > 0 are an anti-pattern)`, relPath(file));
        }
      }
    }
  }

  // No tabindex > 0 found is a pass
  const hasTabindexFail = results.details.some(d => d.category === 'JS' && d.status === 'FAIL' && d.message.includes('tabindex'));
  if (!hasTabindexFail) {
    pass('JS', `No tabindex > 0 anti-patterns found`);
  }

  // 3f. Check for A11yManager or accessibility module usage
  if (/A11yManager/i.test(combinedJS)) {
    pass('JS', `A11yManager accessibility module detected`);
  } else if (/accessibility|a11y/i.test(combinedJS)) {
    pass('JS', `Accessibility patterns referenced`);
  }

  // 3g. Check for focus trap patterns
  if (/focus.?trap/i.test(combinedJS) || /FocusTrap/i.test(combinedJS)) {
    pass('JS', `Focus trap implementation found`);
  } else {
    warn('JS', `No focus trap implementation found`);
  }

  // 3h. Check for reduced motion detection
  if (/prefers-reduced-motion/i.test(combinedJS) || /prefersReducedMotion/i.test(combinedJS)) {
    pass('JS', `Reduced motion detection in JS`);
  }

  if (auditFiles.length === 0) {
    warn('JS', 'No JS files found to audit', '');
  }
}

// ---------------------------------------------------------------------------
// Summary & Scoring
// ---------------------------------------------------------------------------

function calculateScore() {
  const total = results.pass + results.warn + results.fail;
  if (total === 0) return 0;
  // Pass = 1 point, Warn = 0.5 points, Fail = 0 points
  const score = ((results.pass + results.warn * 0.5) / total) * 100;
  return Math.round(score);
}

function scoreColor(score) {
  if (score >= 90) return green;
  if (score >= 70) return yellow;
  return red;
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

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  console.log('');
  console.log(bold('=== Cookie Manager Accessibility Audit ==='));
  console.log(dim('  WCAG 2.1 AA compliance checks'));
  console.log('');

  // Run audits
  auditHTML();
  auditCSS();
  auditJS();

  // Print results by category
  const categories = ['HTML', 'CSS', 'JS'];

  for (const cat of categories) {
    const catResults = results.details.filter(d => d.category === cat);
    if (catResults.length === 0) continue;

    const catPass = catResults.filter(d => d.status === 'PASS').length;
    const catWarn = catResults.filter(d => d.status === 'WARN').length;
    const catFail = catResults.filter(d => d.status === 'FAIL').length;

    console.log(bold(`  ${cat} Audit`) + dim(`  (${catPass} pass, ${catWarn} warn, ${catFail} fail)`));
    console.log('');

    for (const detail of catResults) {
      const tag = statusTag(detail.status);
      const fileStr = detail.file ? dim(` [${detail.file}]`) : '';
      console.log(`  ${tag}  ${detail.message}${fileStr}`);
    }
    console.log('');
  }

  // Score
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
  console.log(colorFn(`=== Accessibility Score: ${score}/100 (${grade}) ===`));
  console.log('');

  // Exit with error if there are failures
  process.exit(results.fail > 0 ? 1 : 0);
}

main();
