/**
 * Cookie Manager - Security Scanner
 * Static analysis tool for detecting common security vulnerabilities.
 * Usage: node scripts/security-scan.js [directory]
 * Exit code: 1 if critical/high findings, 0 otherwise
 */

const fs = require('fs');
const path = require('path');

const SEVERITY = { CRITICAL: 'CRITICAL', HIGH: 'HIGH', MEDIUM: 'MEDIUM', LOW: 'LOW' };

const COLORS = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
  magenta: '\x1b[35m',
  green: '\x1b[32m',
};

const SEVERITY_COLORS = {
  [SEVERITY.CRITICAL]: COLORS.red,
  [SEVERITY.HIGH]: COLORS.magenta,
  [SEVERITY.MEDIUM]: COLORS.yellow,
  [SEVERITY.LOW]: COLORS.cyan,
};

const RULES = [
  // Critical
  { severity: SEVERITY.CRITICAL, pattern: /\beval\s*\(/, description: 'eval() usage detected' },
  { severity: SEVERITY.CRITICAL, pattern: /new\s+Function\s*\(/, description: 'new Function() constructor detected' },
  {
    severity: SEVERITY.CRITICAL,
    pattern: /(?:api_key|password|secret|token)\s*[:=]\s*['"][^'"]{8,}['"]/i,
    description: 'Hardcoded secret detected',
  },
  // High
  { severity: SEVERITY.HIGH, pattern: /\.innerHTML\s*=/, description: 'Direct innerHTML assignment detected' },
  { severity: SEVERITY.HIGH, pattern: /document\.write\s*\(/, description: 'document.write() usage detected' },
  { severity: SEVERITY.HIGH, pattern: /\.outerHTML\s*=/, description: 'Direct outerHTML assignment detected' },
  {
    severity: SEVERITY.HIGH,
    pattern: /localStorage\.setItem\s*\(\s*['"][^'"]*(?:password|token|key|secret)[^'"]*['"]/i,
    description: 'Sensitive data stored in localStorage',
  },
  // Medium
  { severity: SEVERITY.MEDIUM, pattern: /['"]http:\/\//, description: 'Insecure HTTP URL detected' },
  {
    severity: SEVERITY.MEDIUM,
    pattern: /new\s+RegExp\s*\([^)]*\+/,
    description: 'Dynamic regex construction with concatenation',
  },
  {
    severity: SEVERITY.MEDIUM,
    pattern: /postMessage\s*\(\s*['"][*]['"]\s*\)/,
    description: 'postMessage with wildcard origin',
  },
  // Low
  { severity: SEVERITY.LOW, pattern: /\bconsole\.log\b/, description: 'console.log in production code' },
  { severity: SEVERITY.LOW, pattern: /\bdebugger\b/, description: 'debugger statement detected' },
];

const SCAN_EXTENSIONS = new Set(['.js', '.html', '.json']);
const SKIP_DIRS = new Set(['node_modules', '.git']);

function collectFiles(dir) {
  const files = [];
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return files;
  }
  for (const entry of entries) {
    if (entry.name.startsWith('.') || SKIP_DIRS.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectFiles(fullPath));
    } else if (SCAN_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
      files.push(fullPath);
    }
  }
  return files;
}

function scanFile(filePath, baseDir) {
  const findings = [];
  let content;
  try {
    content = fs.readFileSync(filePath, 'utf-8');
  } catch {
    return findings;
  }
  const lines = content.split('\n');
  const relativePath = path.relative(baseDir, filePath);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const rule of RULES) {
      const match = line.match(rule.pattern);
      if (match) {
        const snippet = line.trim().length > 80 ? line.trim().substring(0, 77) + '...' : line.trim();
        findings.push({
          severity: rule.severity,
          file: relativePath,
          line: i + 1,
          description: rule.description,
          match: snippet,
        });
      }
    }
  }
  return findings;
}

function printReport(findings, fileCount, baseDir) {
  const counts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
  for (const f of findings) counts[f.severity]++;

  console.log(`\n${COLORS.bold}=== Cookie Manager Security Scan ===${COLORS.reset}\n`);
  console.log(`Scanned: ${fileCount} files`);
  console.log(`Findings: ${findings.length} total`);
  console.log(`  ${SEVERITY_COLORS.CRITICAL}CRITICAL: ${counts.CRITICAL}${COLORS.reset}`);
  console.log(`  ${SEVERITY_COLORS.HIGH}HIGH: ${counts.HIGH}${COLORS.reset}`);
  console.log(`  ${SEVERITY_COLORS.MEDIUM}MEDIUM: ${counts.MEDIUM}${COLORS.reset}`);
  console.log(`  ${SEVERITY_COLORS.LOW}LOW: ${counts.LOW}${COLORS.reset}`);

  if (findings.length > 0) {
    console.log(`\n${COLORS.bold}--- Findings ---${COLORS.reset}\n`);

    const order = [SEVERITY.CRITICAL, SEVERITY.HIGH, SEVERITY.MEDIUM, SEVERITY.LOW];
    const grouped = {};
    for (const sev of order) grouped[sev] = findings.filter((f) => f.severity === sev);

    for (const sev of order) {
      for (const f of grouped[sev]) {
        const color = SEVERITY_COLORS[f.severity];
        console.log(`${color}[${f.severity}]${COLORS.reset} ${f.file}:${f.line}`);
        console.log(`  ${f.description}`);
        console.log(`  ${COLORS.gray}Match: ${f.match}${COLORS.reset}\n`);
      }
    }
  }

  const hasBlocking = counts.CRITICAL > 0 || counts.HIGH > 0;
  if (hasBlocking) {
    console.log(`${COLORS.red}${COLORS.bold}Result: FAIL (critical or high findings detected)${COLORS.reset}\n`);
  } else {
    console.log(
      `${COLORS.green}${COLORS.bold}Result: PASS (no critical or high findings blocking release)${COLORS.reset}\n`
    );
  }

  return hasBlocking;
}

function writeResultsFile(findings, fileCount, projectRoot) {
  const counts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
  for (const f of findings) counts[f.severity]++;

  const results = {
    timestamp: new Date().toISOString(),
    summary: {
      filesScanned: fileCount,
      totalFindings: findings.length,
      counts,
    },
    findings,
  };

  const outputPath = path.join(projectRoot, 'security-scan-results.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2) + '\n');
  console.log(`${COLORS.gray}Results written to ${outputPath}${COLORS.reset}\n`);
}

function main() {
  const projectRoot = path.resolve(__dirname, '..');
  const targetArg = process.argv[2];
  const scanDir = targetArg ? path.resolve(targetArg) : path.join(projectRoot, 'src');

  if (!fs.existsSync(scanDir)) {
    console.error(`Error: directory not found: ${scanDir}`);
    process.exit(1);
  }

  const files = collectFiles(scanDir);
  if (files.length === 0) {
    console.log('No files found to scan.');
    process.exit(0);
  }

  const allFindings = [];
  for (const file of files) {
    allFindings.push(...scanFile(file, projectRoot));
  }

  const hasBlocking = printReport(allFindings, files.length, projectRoot);
  writeResultsFile(allFindings, files.length, projectRoot);

  process.exit(hasBlocking ? 1 : 0);
}

main();
