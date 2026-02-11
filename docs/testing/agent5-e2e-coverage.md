# Agent 5: Code Coverage, Test Utilities & Consolidated Report

## Zovo Cookie Manager -- Automated Testing Suite (Phase 10, Agent 5 of 5)

---

## 1. Code Coverage Configuration

### 1.1 Jest Coverage Configuration

```javascript
// jest.config.js -- complete coverage section
/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/tests'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1',
    '^@mocks/(.*)$': '<rootDir>/tests/mocks/$1',
  },
  setupFilesAfterSetup: [
    '<rootDir>/tests/setup/jest.setup.ts',
  ],
  testMatch: [
    '**/tests/unit/**/*.test.ts',
    '**/tests/unit/**/*.test.tsx',
    '**/tests/integration/**/*.test.ts',
    '**/tests/integration/**/*.test.tsx',
    '**/tests/performance/**/*.perf.test.ts',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.test.json',
    }],
  },
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,

  // =========================================================================
  // COVERAGE CONFIGURATION
  // =========================================================================
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
    '!src/**/*.stories.{ts,tsx}',
    '!src/types/**',
    '!src/**/__fixtures__/**',
    '!src/**/__mocks__/**',
    '!src/**/test-utils/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'text-summary', 'lcov', 'html', 'json-summary'],
  coverageThreshold: {
    // -----------------------------------------------------------------
    // Global thresholds -- baseline for all source files
    // -----------------------------------------------------------------
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },

    // -----------------------------------------------------------------
    // Critical payment/licensing modules -- must be highest coverage
    // These handle real money and feature access; regressions here
    // mean lost revenue or users getting features they haven't paid for.
    // -----------------------------------------------------------------
    './src/shared/payments.ts': {
      branches: 90,
      functions: 95,
      lines: 90,
      statements: 90,
    },
    './src/shared/featureGating.ts': {
      branches: 90,
      functions: 95,
      lines: 90,
      statements: 90,
    },
    './src/shared/apiClient.ts': {
      branches: 90,
      functions: 95,
      lines: 90,
      statements: 90,
    },

    // -----------------------------------------------------------------
    // Background service worker modules -- high coverage required
    // Service worker is the extension brain; failures are invisible
    // to the user and hard to debug in production.
    // -----------------------------------------------------------------
    './src/background/': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },

    // -----------------------------------------------------------------
    // Shared utilities -- used everywhere, moderate-high coverage
    // -----------------------------------------------------------------
    './src/shared/': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },

    // -----------------------------------------------------------------
    // Cookie operations -- core product functionality
    // -----------------------------------------------------------------
    './src/shared/cookieOperations.ts': {
      branches: 90,
      functions: 95,
      lines: 90,
      statements: 90,
    },
    './src/shared/cookieProfiles.ts': {
      branches: 85,
      functions: 90,
      lines: 85,
      statements: 85,
    },
    './src/shared/autoDeleteRules.ts': {
      branches: 85,
      functions: 90,
      lines: 85,
      statements: 85,
    },

    // -----------------------------------------------------------------
    // Export/Import -- data integrity is critical
    // -----------------------------------------------------------------
    './src/shared/exportImport.ts': {
      branches: 85,
      functions: 90,
      lines: 85,
      statements: 85,
    },

    // -----------------------------------------------------------------
    // Popup UI components -- standard coverage
    // Visual bugs are caught by E2E; logic bugs caught here.
    // -----------------------------------------------------------------
    './src/popup/': {
      branches: 75,
      functions: 80,
      lines: 80,
      statements: 80,
    },

    // -----------------------------------------------------------------
    // Options page -- standard coverage
    // -----------------------------------------------------------------
    './src/options/': {
      branches: 75,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
```

### 1.2 Coverage Collection Rationale

| Category | Include/Exclude | Reason |
|----------|----------------|--------|
| `src/**/*.{ts,tsx}` | Include | All production source code |
| `src/**/*.d.ts` | Exclude | Type definitions have no runtime behavior |
| `src/**/index.ts` | Exclude | Re-export barrel files with no logic |
| `src/**/*.stories.{ts,tsx}` | Exclude | Storybook stories are not production code |
| `src/types/**` | Exclude | Pure type definitions directory |
| `src/**/__fixtures__/**` | Exclude | Test fixture data |
| `src/**/__mocks__/**` | Exclude | Manual mocks for testing |
| `dist/**` | Exclude (implicit) | Build output is not source |
| `tests/**` | Exclude (implicit) | Test files themselves |

### 1.3 Report Format Details

| Format | File | Purpose |
|--------|------|---------|
| `text` | stdout | Quick terminal readout during development |
| `text-summary` | stdout | Concise summary for CI logs |
| `lcov` | `coverage/lcov.info` | Codecov/Coveralls upload; IDE integration |
| `html` | `coverage/lcov-report/index.html` | Visual drill-down for developers |
| `json-summary` | `coverage/coverage-summary.json` | Machine-readable for scripts and badges |

---

## 2. Coverage Enforcement Script

### 2.1 `scripts/check-coverage.ts`

Parses the `coverage-summary.json` file, compares each metric against configured thresholds, and exits non-zero if any threshold is violated. Used in CI and pre-commit hooks.

```typescript
// scripts/check-coverage.ts
//
// Usage: ts-node scripts/check-coverage.ts
// Exit 0 = all thresholds met
// Exit 1 = one or more thresholds violated
//
import fs from 'fs';
import path from 'path';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface CoverageMetric {
  total: number;
  covered: number;
  skipped: number;
  pct: number;
}

interface FileCoverage {
  lines: CoverageMetric;
  statements: CoverageMetric;
  functions: CoverageMetric;
  branches: CoverageMetric;
}

interface CoverageSummary {
  total: FileCoverage;
  [filePath: string]: FileCoverage;
}

interface ThresholdSet {
  lines: number;
  branches: number;
  functions: number;
  statements: number;
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------
const GLOBAL_THRESHOLD: ThresholdSet = {
  lines: 80,
  branches: 80,
  functions: 80,
  statements: 80,
};

const CRITICAL_THRESHOLDS: Record<string, ThresholdSet> = {
  'src/shared/payments.ts': {
    lines: 90,
    branches: 90,
    functions: 95,
    statements: 90,
  },
  'src/shared/featureGating.ts': {
    lines: 90,
    branches: 90,
    functions: 95,
    statements: 90,
  },
  'src/shared/apiClient.ts': {
    lines: 90,
    branches: 90,
    functions: 95,
    statements: 90,
  },
  'src/shared/cookieOperations.ts': {
    lines: 90,
    branches: 90,
    functions: 95,
    statements: 90,
  },
  'src/background/messageHandler.ts': {
    lines: 90,
    branches: 90,
    functions: 90,
    statements: 90,
  },
  'src/background/storageManager.ts': {
    lines: 90,
    branches: 90,
    functions: 90,
    statements: 90,
  },
};

// ---------------------------------------------------------------------------
// Load coverage data
// ---------------------------------------------------------------------------
const coveragePath = path.join(
  __dirname, '..', 'coverage', 'coverage-summary.json'
);

if (!fs.existsSync(coveragePath)) {
  console.error('ERROR: coverage-summary.json not found.');
  console.error('Run "npm run test:coverage" first.');
  process.exit(1);
}

const summary: CoverageSummary = JSON.parse(
  fs.readFileSync(coveragePath, 'utf8')
);

// ---------------------------------------------------------------------------
// Check thresholds
// ---------------------------------------------------------------------------
interface Failure {
  scope: string;
  metric: string;
  actual: number;
  required: number;
}

const failures: Failure[] = [];

function checkThreshold(
  scope: string,
  coverage: FileCoverage,
  threshold: ThresholdSet
): void {
  const metrics: Array<keyof ThresholdSet> = [
    'lines', 'branches', 'functions', 'statements',
  ];

  for (const metric of metrics) {
    const actual = coverage[metric].pct;
    const required = threshold[metric];
    if (actual < required) {
      failures.push({ scope, metric, actual, required });
    }
  }
}

// Check global
checkThreshold('GLOBAL', summary.total, GLOBAL_THRESHOLD);

// Check critical files
for (const [relativePath, threshold] of Object.entries(CRITICAL_THRESHOLDS)) {
  // coverage-summary.json uses absolute paths as keys
  const absolutePath = path.resolve(__dirname, '..', relativePath);
  const coverage = summary[absolutePath];

  if (!coverage) {
    failures.push({
      scope: relativePath,
      metric: 'ALL',
      actual: 0,
      required: threshold.lines,
    });
    console.warn(`  WARNING: No coverage data for critical file: ${relativePath}`);
  } else {
    checkThreshold(relativePath, coverage, threshold);
  }
}

// ---------------------------------------------------------------------------
// Generate report table
// ---------------------------------------------------------------------------
console.log('\n========================================');
console.log('  COVERAGE REPORT');
console.log('========================================\n');

console.log('Global Coverage:');
console.log(`  Lines:      ${summary.total.lines.pct.toFixed(1)}% (target: ${GLOBAL_THRESHOLD.lines}%)`);
console.log(`  Branches:   ${summary.total.branches.pct.toFixed(1)}% (target: ${GLOBAL_THRESHOLD.branches}%)`);
console.log(`  Functions:  ${summary.total.functions.pct.toFixed(1)}% (target: ${GLOBAL_THRESHOLD.functions}%)`);
console.log(`  Statements: ${summary.total.statements.pct.toFixed(1)}% (target: ${GLOBAL_THRESHOLD.statements}%)`);

console.log('\nCritical Files:');
for (const [relativePath, threshold] of Object.entries(CRITICAL_THRESHOLDS)) {
  const absolutePath = path.resolve(__dirname, '..', relativePath);
  const coverage = summary[absolutePath];
  if (coverage) {
    const pass =
      coverage.lines.pct >= threshold.lines &&
      coverage.branches.pct >= threshold.branches &&
      coverage.functions.pct >= threshold.functions &&
      coverage.statements.pct >= threshold.statements;
    const icon = pass ? 'PASS' : 'FAIL';
    console.log(`  [${icon}] ${relativePath}: ${coverage.lines.pct.toFixed(1)}% lines`);
  } else {
    console.log(`  [MISS] ${relativePath}: no data`);
  }
}

// ---------------------------------------------------------------------------
// Exit
// ---------------------------------------------------------------------------
if (failures.length > 0) {
  console.log('\n--- FAILURES ---');
  for (const f of failures) {
    console.log(`  ${f.scope} > ${f.metric}: ${f.actual.toFixed(1)}% < ${f.required}% required`);
  }
  console.log(`\n${failures.length} threshold(s) not met.`);
  process.exit(1);
} else {
  console.log('\nAll coverage thresholds met.');
  process.exit(0);
}
```

### 2.2 `scripts/find-untested.ts`

Scans `src/` for all `.ts` and `.tsx` files, then checks whether a corresponding test file exists in `tests/`. Reports both completely untested files and files with less than 50% line coverage.

```typescript
// scripts/find-untested.ts
//
// Usage: ts-node scripts/find-untested.ts
// Reports source files without corresponding test files and low-coverage files.
//
import fs from 'fs';
import path from 'path';
import glob from 'glob';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface CoverageMetric {
  total: number;
  covered: number;
  skipped: number;
  pct: number;
}

interface FileCoverage {
  lines: CoverageMetric;
  branches: CoverageMetric;
  functions: CoverageMetric;
  statements: CoverageMetric;
}

interface CoverageSummary {
  total: FileCoverage;
  [filePath: string]: FileCoverage;
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------
const SRC_DIR = path.resolve(__dirname, '..', 'src');
const TESTS_DIR = path.resolve(__dirname, '..', 'tests');
const COVERAGE_PATH = path.resolve(__dirname, '..', 'coverage', 'coverage-summary.json');

const IGNORE_PATTERNS = [
  '**/*.d.ts',
  '**/index.ts',
  '**/types/**',
  '**/__fixtures__/**',
  '**/__mocks__/**',
];

const LOW_COVERAGE_THRESHOLD = 50; // percent

// ---------------------------------------------------------------------------
// Find source files
// ---------------------------------------------------------------------------
const srcFiles = glob.sync('**/*.{ts,tsx}', {
  cwd: SRC_DIR,
  ignore: IGNORE_PATTERNS,
});

console.log(`Found ${srcFiles.length} source files in src/\n`);

// ---------------------------------------------------------------------------
// Check for corresponding test files
// ---------------------------------------------------------------------------
function findTestFile(srcRelative: string): string | null {
  const parsed = path.parse(srcRelative);
  const baseName = parsed.name;
  const dirParts = parsed.dir.split(path.sep);

  // Possible test file patterns
  const testPatterns = [
    // tests/unit/<dir>/<name>.test.ts
    path.join(TESTS_DIR, 'unit', ...dirParts, `${baseName}.test.ts`),
    path.join(TESTS_DIR, 'unit', ...dirParts, `${baseName}.test.tsx`),
    // tests/integration/<dir>/<name>.integration.test.ts
    path.join(TESTS_DIR, 'integration', ...dirParts, `${baseName}.integration.test.ts`),
    path.join(TESTS_DIR, 'integration', `${baseName}.integration.test.ts`),
    // tests/unit/<name>.test.ts (flat)
    path.join(TESTS_DIR, 'unit', `${baseName}.test.ts`),
    path.join(TESTS_DIR, 'unit', `${baseName}.test.tsx`),
  ];

  for (const testPath of testPatterns) {
    if (fs.existsSync(testPath)) {
      return testPath;
    }
  }

  return null;
}

const untestedFiles: string[] = [];
const testedFiles: Array<{ src: string; test: string }> = [];

for (const srcFile of srcFiles) {
  const testFile = findTestFile(srcFile);
  if (testFile) {
    testedFiles.push({ src: srcFile, test: path.relative(TESTS_DIR, testFile) });
  } else {
    untestedFiles.push(srcFile);
  }
}

// ---------------------------------------------------------------------------
// Check coverage data for low-coverage files
// ---------------------------------------------------------------------------
let coverageData: CoverageSummary | null = null;
const lowCoverageFiles: Array<{ file: string; pct: number }> = [];

if (fs.existsSync(COVERAGE_PATH)) {
  coverageData = JSON.parse(fs.readFileSync(COVERAGE_PATH, 'utf8'));

  for (const srcFile of srcFiles) {
    const absoluteSrc = path.resolve(SRC_DIR, srcFile);
    const fileCoverage = coverageData![absoluteSrc];

    if (fileCoverage && fileCoverage.lines.pct < LOW_COVERAGE_THRESHOLD) {
      lowCoverageFiles.push({
        file: srcFile,
        pct: fileCoverage.lines.pct,
      });
    }
  }

  lowCoverageFiles.sort((a, b) => a.pct - b.pct);
} else {
  console.log('NOTE: No coverage-summary.json found. Run tests with coverage first');
  console.log('      to also see low-coverage file analysis.\n');
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------
console.log('=== Files WITH Test Coverage ===');
if (testedFiles.length === 0) {
  console.log('  (none)');
} else {
  for (const { src, test } of testedFiles) {
    console.log(`  [OK] ${src} -> ${test}`);
  }
}
console.log(`  Total: ${testedFiles.length}\n`);

console.log('=== Files WITHOUT Test Coverage ===');
if (untestedFiles.length === 0) {
  console.log('  All source files have corresponding test files!');
} else {
  for (const file of untestedFiles) {
    console.log(`  [MISSING] ${file}`);
  }
  console.log(`  Total: ${untestedFiles.length}`);
}

if (lowCoverageFiles.length > 0) {
  console.log(`\n=== Low Coverage Files (<${LOW_COVERAGE_THRESHOLD}% lines) ===`);
  for (const { file, pct } of lowCoverageFiles) {
    console.log(`  [LOW] ${file}: ${pct.toFixed(1)}%`);
  }
  console.log(`  Total: ${lowCoverageFiles.length}`);
}

// Summary
console.log('\n--- Summary ---');
console.log(`  Source files:   ${srcFiles.length}`);
console.log(`  With tests:     ${testedFiles.length} (${((testedFiles.length / srcFiles.length) * 100).toFixed(1)}%)`);
console.log(`  Without tests:  ${untestedFiles.length} (${((untestedFiles.length / srcFiles.length) * 100).toFixed(1)}%)`);
if (coverageData) {
  console.log(`  Low coverage:   ${lowCoverageFiles.length}`);
}

// Exit 1 if critical files are untested
const criticalUntested = untestedFiles.filter(f =>
  f.includes('payments') ||
  f.includes('featureGating') ||
  f.includes('apiClient') ||
  f.includes('cookieOperations') ||
  f.includes('messageHandler') ||
  f.includes('storageManager')
);

if (criticalUntested.length > 0) {
  console.error('\nERROR: Critical files are untested:');
  for (const f of criticalUntested) {
    console.error(`  - ${f}`);
  }
  process.exit(1);
}
```

### 2.3 Coverage Badge Generation

```javascript
// scripts/generate-badge.ts
//
// Reads coverage-summary.json and generates:
// 1. A shields.io badge JSON file at coverage/badge.json
// 2. A markdown badge URL for README.md
//
import fs from 'fs';
import path from 'path';

const coveragePath = path.join(
  __dirname, '..', 'coverage', 'coverage-summary.json'
);

if (!fs.existsSync(coveragePath)) {
  console.error('No coverage data found. Run: npm run test:coverage');
  process.exit(1);
}

const summary = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
const lineCoverage = Math.round(summary.total.lines.pct);
const branchCoverage = Math.round(summary.total.branches.pct);
const fnCoverage = Math.round(summary.total.functions.pct);
const stmtCoverage = Math.round(summary.total.statements.pct);

// Determine badge color based on line coverage
function getColor(pct: number): string {
  if (pct >= 95) return 'brightgreen';
  if (pct >= 90) return 'green';
  if (pct >= 80) return 'yellowgreen';
  if (pct >= 70) return 'yellow';
  if (pct >= 60) return 'orange';
  return 'red';
}

const color = getColor(lineCoverage);

// Write shields.io endpoint badge JSON
const badge = {
  schemaVersion: 1,
  label: 'coverage',
  message: `${lineCoverage}%`,
  color,
};

const badgePath = path.join(__dirname, '..', 'coverage', 'badge.json');
fs.writeFileSync(badgePath, JSON.stringify(badge, null, 2));

// Generate markdown badge URL
const encodedLabel = encodeURIComponent('coverage');
const encodedMessage = encodeURIComponent(`${lineCoverage}%`);
const shieldUrl = `https://img.shields.io/badge/${encodedLabel}-${encodedMessage}-${color}`;

console.log('\n=== Coverage Badge ===');
console.log(`Lines:      ${lineCoverage}%`);
console.log(`Branches:   ${branchCoverage}%`);
console.log(`Functions:  ${fnCoverage}%`);
console.log(`Statements: ${stmtCoverage}%`);
console.log(`Color:      ${color}`);
console.log('');
console.log('Badge JSON: coverage/badge.json');
console.log(`Shield URL: ${shieldUrl}`);
console.log('');
console.log('Markdown:');
console.log(`![Coverage](${shieldUrl})`);
console.log('');
console.log('HTML:');
console.log(`<img src="${shieldUrl}" alt="Coverage: ${lineCoverage}%">`);

// Optionally update README.md if it contains a badge placeholder
const readmePath = path.join(__dirname, '..', 'README.md');
if (fs.existsSync(readmePath)) {
  let readme = fs.readFileSync(readmePath, 'utf8');
  const badgeRegex = /!\[Coverage\]\(https:\/\/img\.shields\.io\/badge\/coverage-\d+%25-\w+\)/;
  const newBadge = `![Coverage](${shieldUrl})`;

  if (badgeRegex.test(readme)) {
    readme = readme.replace(badgeRegex, newBadge);
    fs.writeFileSync(readmePath, readme);
    console.log('\nREADME.md badge updated automatically.');
  }
}
```

---

## 3. Test Utilities (`tests/setup/testUtils.ts`)

Complete utility module providing DOM helpers, Chrome API helpers, assertion helpers, and factory functions for Cookie Manager tests.

```typescript
// tests/setup/testUtils.ts
//
// Centralized test utilities for the Zovo Cookie Manager test suite.
// Import what you need: import { createCookie, seedStorage, ... } from '@tests/setup/testUtils';
//

import { chrome } from 'jest-chrome';
import { render, RenderResult } from '@testing-library/preact';
import { FunctionComponent } from 'preact';
import { act } from 'preact/test-utils';

// =========================================================================
// 1. TEST ENVIRONMENT SETUP
// =========================================================================

/**
 * Call in describe() blocks to auto-setup and teardown Chrome API mocks.
 */
export function setupTestEnvironment(): void {
  beforeEach(() => {
    setupAllMocks();
    jest.useFakeTimers({ advanceTimers: true });
  });

  afterEach(() => {
    resetAllMocks();
    jest.clearAllMocks();
    jest.useRealTimers();
  });
}

function setupAllMocks(): void {
  setupStorageMock();
  setupCookiesMock();
  setupTabsMock();
  setupRuntimeMock();
  setupAlarmsMock();
}

function resetAllMocks(): void {
  mockStorageData.local = {};
  mockStorageData.sync = {};
  mockStorageData.session = {};
  mockCookieStore.length = 0;
  mockTabStore.clear();
  runtimeMessageListeners.clear();
  alarmListeners.clear();
  alarmStore.clear();
}

// =========================================================================
// 2. DOM HELPERS (Preact Component Testing)
// =========================================================================

/**
 * Render a Preact component in the test environment.
 * Returns the Testing Library render result.
 */
export function renderComponent<P extends Record<string, unknown>>(
  Component: FunctionComponent<P>,
  props: P
): RenderResult {
  let result!: RenderResult;
  act(() => {
    result = render(Component(props) as any);
  });
  return result;
}

/**
 * Wait for Preact to finish re-rendering.
 */
export async function waitForUpdate(): Promise<void> {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

/**
 * Find an element by its data-testid attribute.
 */
export function getByTestId(container: HTMLElement, testId: string): HTMLElement {
  const el = container.querySelector(`[data-testid="${testId}"]`);
  if (!el) {
    throw new Error(
      `Could not find element with data-testid="${testId}" within container.`
    );
  }
  return el as HTMLElement;
}

/**
 * Simulate typing text into an input element character by character.
 */
export async function typeIntoInput(
  input: HTMLElement,
  text: string
): Promise<void> {
  const inputEl = input as HTMLInputElement;
  inputEl.focus();

  for (const char of text) {
    inputEl.value += char;
    inputEl.dispatchEvent(new Event('input', { bubbles: true }));
    inputEl.dispatchEvent(new KeyboardEvent('keydown', { key: char, bubbles: true }));
    inputEl.dispatchEvent(new KeyboardEvent('keyup', { key: char, bubbles: true }));
  }

  inputEl.dispatchEvent(new Event('change', { bubbles: true }));
  await waitForUpdate();
}

/**
 * Simulate clicking a button element.
 */
export async function clickButton(button: HTMLElement): Promise<void> {
  await act(async () => {
    button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
  await waitForUpdate();
}

/**
 * Simulate selecting an option in a <select> element.
 */
export async function selectOption(
  selectEl: HTMLElement,
  value: string
): Promise<void> {
  const select = selectEl as HTMLSelectElement;
  select.value = value;
  select.dispatchEvent(new Event('change', { bubbles: true }));
  await waitForUpdate();
}

// =========================================================================
// 3. CHROME API HELPERS
// =========================================================================

// ---- Storage ----

const mockStorageData: {
  local: Record<string, any>;
  sync: Record<string, any>;
  session: Record<string, any>;
} = {
  local: {},
  sync: {},
  session: {},
};

function setupStorageMock(): void {
  const setupArea = (
    area: typeof chrome.storage.local,
    data: Record<string, any>
  ) => {
    area.get.mockImplementation((keys) => {
      if (!keys) return Promise.resolve({ ...data });
      if (typeof keys === 'string') return Promise.resolve({ [keys]: data[keys] });
      if (Array.isArray(keys)) {
        const result: Record<string, any> = {};
        keys.forEach((k) => {
          if (k in data) result[k] = data[k];
        });
        return Promise.resolve(result);
      }
      // Object with defaults
      const result: Record<string, any> = {};
      Object.entries(keys as Record<string, any>).forEach(([k, v]) => {
        result[k] = k in data ? data[k] : v;
      });
      return Promise.resolve(result);
    });

    area.set.mockImplementation((items) => {
      Object.assign(data, items);
      return Promise.resolve();
    });

    area.remove.mockImplementation((keys) => {
      const arr = Array.isArray(keys) ? keys : [keys];
      arr.forEach((k) => delete data[k]);
      return Promise.resolve();
    });

    area.clear.mockImplementation(() => {
      Object.keys(data).forEach((k) => delete data[k]);
      return Promise.resolve();
    });
  };

  setupArea(chrome.storage.local, mockStorageData.local);
  setupArea(chrome.storage.sync, mockStorageData.sync);
  setupArea(chrome.storage.session, mockStorageData.session);
}

/**
 * Seed local storage with test data. Merges into existing data.
 */
export async function seedStorage(
  data: Record<string, any>,
  area: 'local' | 'sync' | 'session' = 'local'
): Promise<void> {
  Object.assign(mockStorageData[area], data);
}

/**
 * Get current mock storage contents for assertions.
 */
export function getStorageContents(
  area: 'local' | 'sync' | 'session' = 'local'
): Record<string, any> {
  return { ...mockStorageData[area] };
}

// ---- Cookies ----

const mockCookieStore: chrome.cookies.Cookie[] = [];

function setupCookiesMock(): void {
  chrome.cookies.getAll.mockImplementation((details) => {
    let results = [...mockCookieStore];
    if (details.domain) {
      results = results.filter((c) => c.domain === details.domain || c.domain === `.${details.domain}`);
    }
    if (details.url) {
      try {
        const url = new URL(details.url);
        results = results.filter((c) =>
          url.hostname.endsWith(c.domain.replace(/^\./, ''))
        );
      } catch {
        // invalid URL, return empty
        results = [];
      }
    }
    if (details.name) {
      results = results.filter((c) => c.name === details.name);
    }
    return Promise.resolve(results);
  });

  chrome.cookies.get.mockImplementation((details) => {
    const found = mockCookieStore.find(
      (c) => c.name === details.name && c.url === details.url
    );
    return Promise.resolve(found || null);
  });

  chrome.cookies.set.mockImplementation((details) => {
    const cookie = createCookie({
      name: details.name || '',
      value: details.value || '',
      domain: details.domain || '',
      path: details.path || '/',
      secure: details.secure || false,
      httpOnly: details.httpOnly || false,
      expirationDate: details.expirationDate,
      sameSite: details.sameSite || 'unspecified',
    });
    // Remove existing cookie with same name+domain
    const idx = mockCookieStore.findIndex(
      (c) => c.name === cookie.name && c.domain === cookie.domain
    );
    if (idx >= 0) mockCookieStore.splice(idx, 1);
    mockCookieStore.push(cookie);
    return Promise.resolve(cookie);
  });

  chrome.cookies.remove.mockImplementation((details) => {
    const idx = mockCookieStore.findIndex(
      (c) => c.name === details.name && c.url === details.url
    );
    if (idx >= 0) {
      const removed = mockCookieStore.splice(idx, 1)[0];
      return Promise.resolve({
        url: details.url,
        name: details.name,
        storeId: removed.storeId,
      });
    }
    return Promise.resolve(null);
  });
}

/**
 * Seed the mock cookie store with test cookies.
 * Replaces the entire store contents.
 */
export function seedCookies(cookies: chrome.cookies.Cookie[]): void {
  mockCookieStore.length = 0;
  mockCookieStore.push(...cookies);
}

/**
 * Add a single cookie to the mock store.
 */
export function addCookie(cookie: chrome.cookies.Cookie): void {
  mockCookieStore.push(cookie);
}

/**
 * Get current mock cookie store contents.
 */
export function getCookieStore(): chrome.cookies.Cookie[] {
  return [...mockCookieStore];
}

// ---- Tabs ----

const mockTabStore: Map<number, chrome.tabs.Tab> = new Map();
let tabIdCounter = 1;

function setupTabsMock(): void {
  chrome.tabs.query.mockImplementation((queryInfo) => {
    let results = Array.from(mockTabStore.values());
    if (queryInfo.active !== undefined) {
      results = results.filter((t) => t.active === queryInfo.active);
    }
    if (queryInfo.currentWindow !== undefined) {
      results = results.filter((t) => t.windowId === 1);
    }
    if (queryInfo.url) {
      const patterns = Array.isArray(queryInfo.url) ? queryInfo.url : [queryInfo.url];
      results = results.filter((t) =>
        patterns.some((p) => new RegExp(p.replace(/\*/g, '.*')).test(t.url || ''))
      );
    }
    return Promise.resolve(results);
  });

  chrome.tabs.get.mockImplementation((tabId) => {
    const tab = mockTabStore.get(tabId);
    return tab ? Promise.resolve(tab) : Promise.reject(new Error(`No tab: ${tabId}`));
  });
}

/**
 * Simulate switching to a new tab with the given URL.
 */
export function simulateTabSwitch(tabId: number, url: string): void {
  const tab: chrome.tabs.Tab = {
    id: tabId,
    index: 0,
    windowId: 1,
    highlighted: true,
    active: true,
    pinned: false,
    incognito: false,
    url,
    title: url,
    status: 'complete',
  };

  // Deactivate all other tabs
  for (const [, existing] of mockTabStore) {
    existing.active = false;
    existing.highlighted = false;
  }

  mockTabStore.set(tabId, tab);
}

// ---- Runtime / Messages ----

const runtimeMessageListeners = new Set<
  (
    message: any,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void
  ) => boolean | void
>();

function setupRuntimeMock(): void {
  chrome.runtime.id = 'test-cookie-manager-extension-id';

  chrome.runtime.getManifest.mockReturnValue({
    name: 'Zovo Cookie Manager',
    version: '1.0.0',
    manifest_version: 3,
    permissions: ['cookies', 'storage', 'tabs', 'alarms'],
  } as any);

  chrome.runtime.getURL.mockImplementation(
    (p) => `chrome-extension://test-cookie-manager-extension-id/${p}`
  );

  chrome.runtime.onMessage.addListener.mockImplementation((cb) => {
    runtimeMessageListeners.add(cb);
  });

  chrome.runtime.onMessage.removeListener.mockImplementation((cb) => {
    runtimeMessageListeners.delete(cb);
  });

  chrome.runtime.sendMessage.mockImplementation((message) => {
    return new Promise((resolve) => {
      let responded = false;
      const sendResponse = (response: any) => {
        if (!responded) {
          responded = true;
          resolve(response);
        }
      };

      const sender: chrome.runtime.MessageSender = {
        id: chrome.runtime.id,
      };

      runtimeMessageListeners.forEach((listener) => {
        listener(message, sender, sendResponse);
      });

      setTimeout(() => {
        if (!responded) resolve(undefined);
      }, 0);
    });
  });

  chrome.runtime.onInstalled.addListener.mockImplementation(() => {});
  chrome.runtime.onStartup.addListener.mockImplementation(() => {});
}

/**
 * Simulate an incoming message from content script, popup, or background.
 */
export async function simulateMessage(
  message: any,
  sender?: Partial<chrome.runtime.MessageSender>
): Promise<any> {
  return new Promise((resolve) => {
    const fullSender: chrome.runtime.MessageSender = {
      id: chrome.runtime.id,
      ...sender,
    };

    runtimeMessageListeners.forEach((listener) => {
      listener(message, fullSender, resolve);
    });
  });
}

/**
 * Capture all messages sent via chrome.runtime.sendMessage.
 */
export function captureMessages(): { messages: any[]; clear: () => void } {
  const messages: any[] = [];

  chrome.runtime.sendMessage.mockImplementation((message) => {
    messages.push(message);
    return Promise.resolve();
  });

  return {
    messages,
    clear: () => {
      messages.length = 0;
    },
  };
}

// ---- Alarms ----

const alarmStore: Map<string, chrome.alarms.Alarm> = new Map();
const alarmListeners = new Set<(alarm: chrome.alarms.Alarm) => void>();

function setupAlarmsMock(): void {
  chrome.alarms.create.mockImplementation((name, info) => {
    const alarm: chrome.alarms.Alarm = {
      name,
      scheduledTime: Date.now() + (info.delayInMinutes || 0) * 60000,
      periodInMinutes: info.periodInMinutes,
    };
    alarmStore.set(name, alarm);
    return Promise.resolve();
  });

  chrome.alarms.get.mockImplementation((name) => {
    return Promise.resolve(alarmStore.get(name) || null);
  });

  chrome.alarms.getAll.mockImplementation(() => {
    return Promise.resolve(Array.from(alarmStore.values()));
  });

  chrome.alarms.clear.mockImplementation((name) => {
    return Promise.resolve(alarmStore.delete(name));
  });

  chrome.alarms.clearAll.mockImplementation(() => {
    alarmStore.clear();
    return Promise.resolve(true);
  });

  chrome.alarms.onAlarm.addListener.mockImplementation((cb) => {
    alarmListeners.add(cb);
  });
}

/**
 * Simulate an alarm firing.
 */
export function triggerAlarm(alarmName: string): void {
  const alarm = alarmStore.get(alarmName);
  if (alarm) {
    alarmListeners.forEach((listener) => listener(alarm));
  } else {
    // Create a synthetic alarm
    const synthetic: chrome.alarms.Alarm = {
      name: alarmName,
      scheduledTime: Date.now(),
    };
    alarmListeners.forEach((listener) => listener(synthetic));
  }
}

/**
 * Wait for all pending Chrome API promise chains to resolve.
 */
export async function flushChromePromises(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));
}

// ---- Fetch Mock ----

/**
 * Mock global fetch for API testing.
 */
export function mockFetch(
  responses: Map<string, any> | ((url: string) => any)
): { mock: jest.SpyInstance; restore: () => void } {
  const mockFn = jest.spyOn(global, 'fetch').mockImplementation((input) => {
    const url = typeof input === 'string' ? input : (input as Request).url;

    let responseData: any;
    if (responses instanceof Map) {
      responseData = responses.get(url);
    } else {
      responseData = responses(url);
    }

    if (!responseData) {
      return Promise.reject(new Error(`No mock response for: ${url}`));
    }

    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve(responseData),
      text: () => Promise.resolve(JSON.stringify(responseData)),
      headers: new Headers({ 'content-type': 'application/json' }),
    } as Response);
  });

  return {
    mock: mockFn,
    restore: () => mockFn.mockRestore(),
  };
}

// =========================================================================
// 4. ASSERTION HELPERS
// =========================================================================

/**
 * Assert that a cookie was created in the mock store with expected properties.
 */
export function expectCookieCreated(
  name: string,
  domain: string,
  value: string
): void {
  const found = mockCookieStore.find(
    (c) => c.name === name && c.domain === domain
  );
  expect(found).toBeDefined();
  expect(found!.value).toBe(value);
}

/**
 * Assert that a cookie exists in the mock store matching a partial shape.
 */
export function expectCookieMatches(
  partial: Partial<chrome.cookies.Cookie>
): void {
  const found = mockCookieStore.find((c) => {
    return Object.entries(partial).every(
      ([key, value]) => (c as any)[key] === value
    );
  });
  expect(found).toBeDefined();
}

/**
 * Assert that a cookie was removed from the mock store.
 */
export function expectCookieRemoved(name: string, domain: string): void {
  const found = mockCookieStore.find(
    (c) => c.name === name && c.domain === domain
  );
  expect(found).toBeUndefined();
}

/**
 * Assert that mock storage contains the expected key-value pair.
 */
export async function expectStorageContains(
  key: string,
  expected: any,
  area: 'local' | 'sync' | 'session' = 'local'
): Promise<void> {
  const actual = mockStorageData[area][key];
  expect(actual).toBeDefined();
  expect(actual).toEqual(expected);
}

/**
 * Assert that a paywall was triggered for a specific feature key.
 * Checks that chrome.runtime.sendMessage was called with a paywall message.
 */
export function expectPaywallShown(featureKey: string): void {
  expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(
    expect.objectContaining({
      type: 'PAYWALL_SHOWN',
      feature: featureKey,
    }),
    expect.any(Function)
  );
}

/**
 * Assert that an analytics event was tracked.
 */
export function expectEventTracked(
  eventName: string,
  properties?: Record<string, any>
): void {
  const matcher = properties
    ? expect.objectContaining({
        type: 'TRACK_EVENT',
        event: eventName,
        properties: expect.objectContaining(properties),
      })
    : expect.objectContaining({
        type: 'TRACK_EVENT',
        event: eventName,
      });

  expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(
    matcher,
    expect.any(Function)
  );
}

// =========================================================================
// 5. FACTORY FUNCTIONS
// =========================================================================

/**
 * Create a realistic test cookie with sensible defaults.
 * Override any property via the overrides parameter.
 */
export function createCookie(
  overrides?: Partial<chrome.cookies.Cookie>
): chrome.cookies.Cookie {
  return {
    name: 'session_id',
    value: 'abc123def456',
    domain: '.example.com',
    path: '/',
    secure: true,
    httpOnly: true,
    sameSite: 'lax',
    expirationDate: Math.floor(Date.now() / 1000) + 86400, // +1 day
    storeId: '0',
    hostOnly: false,
    session: false,
    ...overrides,
  };
}

/**
 * Create multiple test cookies across different domains.
 */
export function createCookieBatch(
  count: number,
  baseOverrides?: Partial<chrome.cookies.Cookie>
): chrome.cookies.Cookie[] {
  const domains = [
    '.example.com',
    '.google.com',
    '.github.com',
    '.stackoverflow.com',
    '.reddit.com',
  ];
  const names = [
    'session_id', '_ga', 'csrftoken', 'preferences', 'auth_token',
    'tracking', 'lang', 'theme', '_gid', 'consent',
  ];

  return Array.from({ length: count }, (_, i) => {
    return createCookie({
      name: names[i % names.length] + (i >= names.length ? `_${i}` : ''),
      domain: domains[i % domains.length],
      value: `value_${i}_${Math.random().toString(36).slice(2, 10)}`,
      ...baseOverrides,
    });
  });
}

/**
 * Cookie profile type matching the Cookie Manager spec.
 */
export interface CookieProfile {
  id: string;
  name: string;
  cookies: chrome.cookies.Cookie[];
  domain: string;
  createdAt: number;
  updatedAt: number;
  description?: string;
}

/**
 * Create a test cookie profile.
 */
export function createProfile(
  overrides?: Partial<CookieProfile>
): CookieProfile {
  const now = Date.now();
  return {
    id: `profile_${Math.random().toString(36).slice(2, 10)}`,
    name: 'Test Profile',
    cookies: [
      createCookie({ name: 'session', domain: '.example.com' }),
      createCookie({ name: 'prefs', domain: '.example.com', httpOnly: false }),
    ],
    domain: 'example.com',
    createdAt: now,
    updatedAt: now,
    description: 'A test profile for unit tests',
    ...overrides,
  };
}

/**
 * Auto-delete rule type matching the Cookie Manager spec.
 */
export interface AutoDeleteRule {
  id: string;
  domain: string;
  pattern: string;
  action: 'delete' | 'keep';
  schedule: 'on_close' | 'periodic' | 'on_visit';
  periodMinutes?: number;
  enabled: boolean;
  createdAt: number;
  lastTriggered?: number;
}

/**
 * Create a test auto-delete rule.
 */
export function createRule(
  overrides?: Partial<AutoDeleteRule>
): AutoDeleteRule {
  return {
    id: `rule_${Math.random().toString(36).slice(2, 10)}`,
    domain: 'example.com',
    pattern: '*',
    action: 'delete',
    schedule: 'on_close',
    enabled: true,
    createdAt: Date.now(),
    ...overrides,
  };
}

/**
 * License data type matching the Zovo payment system spec.
 */
export interface LicenseData {
  licenseKey: string;
  email: string;
  tier: 'free' | 'starter' | 'pro' | 'team';
  features: string[];
  expiresAt: string;
  isActive: boolean;
  teamSize?: number;
}

/**
 * Create test license data for a specific tier.
 */
export function createLicense(
  tier: 'free' | 'starter' | 'pro' | 'team'
): LicenseData {
  const TIER_FEATURES: Record<string, string[]> = {
    free: [],
    starter: [
      'unlimited_profiles',
      'unlimited_rules',
      'bulk_export',
    ],
    pro: [
      'unlimited_profiles',
      'unlimited_rules',
      'bulk_export',
      'health_dashboard',
      'encrypted_vault',
      'bulk_operations',
      'advanced_rules',
      'export_all_formats',
      'gdpr_scanner',
      'curl_generation',
      'real_time_monitoring',
      'cross_domain_export',
    ],
    team: [
      'unlimited_profiles',
      'unlimited_rules',
      'bulk_export',
      'health_dashboard',
      'encrypted_vault',
      'bulk_operations',
      'advanced_rules',
      'export_all_formats',
      'gdpr_scanner',
      'curl_generation',
      'real_time_monitoring',
      'cross_domain_export',
    ],
  };

  const LICENSE_KEYS: Record<string, string> = {
    free: '',
    starter: 'ZOVO-TEST-STAR-XXXX-0001',
    pro: 'ZOVO-TEST-PROX-XXXX-0002',
    team: 'ZOVO-TEST-TEAM-XXXX-0003',
  };

  const futureDate = new Date();
  futureDate.setFullYear(futureDate.getFullYear() + 1);

  return {
    licenseKey: LICENSE_KEYS[tier],
    email: `test-${tier}@example.com`,
    tier,
    features: TIER_FEATURES[tier],
    expiresAt: futureDate.toISOString(),
    isActive: tier !== 'free',
    teamSize: tier === 'team' ? 5 : undefined,
  };
}

/**
 * Create an expired license for testing grace period and offline scenarios.
 */
export function createExpiredLicense(
  tier: 'starter' | 'pro' | 'team',
  daysExpired: number = 1
): LicenseData {
  const license = createLicense(tier);
  const expired = new Date();
  expired.setDate(expired.getDate() - daysExpired);
  license.expiresAt = expired.toISOString();
  return license;
}

// =========================================================================
// 6. WAIT UTILITIES
// =========================================================================

/**
 * Wait for a condition to become true, with timeout.
 */
export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  timeout: number = 5000,
  interval: number = 50
): Promise<void> {
  const start = Date.now();

  while (Date.now() - start < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }

  throw new Error(`waitFor: condition not met within ${timeout}ms`);
}

/**
 * Wait a specified number of milliseconds.
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// =========================================================================
// 7. SNAPSHOT HELPERS
// =========================================================================

/**
 * Strip dynamic values (timestamps, IDs) from an object for stable snapshots.
 */
export function stabilize<T extends Record<string, any>>(
  obj: T,
  dynamicKeys: string[] = ['id', 'createdAt', 'updatedAt', 'lastTriggered']
): T {
  const clone = JSON.parse(JSON.stringify(obj));

  function walk(node: any): void {
    if (typeof node !== 'object' || node === null) return;
    for (const key of Object.keys(node)) {
      if (dynamicKeys.includes(key)) {
        node[key] = `[${key.toUpperCase()}]`;
      } else if (typeof node[key] === 'object') {
        walk(node[key]);
      }
    }
  }

  walk(clone);
  return clone;
}
```

---

## 4. Test Script Runner

### 4.1 Complete npm Scripts

```json
{
  "scripts": {
    "test": "jest --runInBand",
    "test:unit": "jest --testPathPattern=tests/unit --verbose",
    "test:integration": "jest --testPathPattern=tests/integration --verbose",
    "test:e2e": "npx playwright test",
    "test:e2e:headed": "npx playwright test --headed",
    "test:e2e:debug": "PWDEBUG=1 npx playwright test",
    "test:e2e:ui": "npx playwright test --ui",
    "test:coverage": "jest --coverage --coverageReporters=text,lcov,json-summary",
    "test:watch": "jest --watch",
    "test:ci": "jest --ci --coverage --runInBand && npx playwright test --reporter=github",
    "test:perf": "jest --testPathPattern=performance --verbose",
    "test:smoke": "jest --testPathPattern='smoke|critical' --bail",
    "test:changed": "jest --onlyChanged --verbose",
    "test:debug": "node --inspect-brk node_modules/.bin/jest --runInBand",
    "coverage:check": "ts-node scripts/check-coverage.ts",
    "coverage:badge": "ts-node scripts/generate-badge.ts",
    "coverage:report": "open coverage/lcov-report/index.html",
    "coverage:find-untested": "ts-node scripts/find-untested.ts"
  }
}
```

### 4.2 Script Descriptions

| Script | Purpose | When to Use |
|--------|---------|-------------|
| `test` | Run all Jest tests sequentially | Pre-push sanity check |
| `test:unit` | Run only unit tests | During development of a single module |
| `test:integration` | Run only integration tests | After changing cross-module interfaces |
| `test:e2e` | Run Playwright E2E tests | After building the extension |
| `test:e2e:headed` | E2E with visible browser | Debugging E2E failures |
| `test:e2e:debug` | E2E with Playwright inspector | Step-through debugging |
| `test:e2e:ui` | E2E with Playwright UI mode | Interactive test exploration |
| `test:coverage` | Run tests and generate coverage report | Before merging PRs |
| `test:watch` | Watch mode, re-runs on file save | TDD workflow |
| `test:ci` | Full CI pipeline (Jest + Playwright) | GitHub Actions |
| `test:perf` | Run performance benchmark tests only | Before releases, after optimization |
| `test:smoke` | Run critical path tests, bail on first failure | Quick sanity check |
| `test:changed` | Run tests related to uncommitted changes only | Pre-commit quick check |
| `test:debug` | Run Jest with Node debugger attached | Debugging test infrastructure issues |
| `coverage:check` | Verify coverage meets thresholds | CI gate, pre-merge |
| `coverage:badge` | Generate shields.io badge from report | After coverage report, in CI |
| `coverage:report` | Open HTML coverage report in browser | Developer review |
| `coverage:find-untested` | Find source files without tests | Sprint planning, coverage gap analysis |

---

## 5. Pre-Commit Hook Configuration

### 5.1 Husky Setup

```bash
# Install husky
npm install --save-dev husky lint-staged

# Initialize husky
npx husky init
```

### 5.2 `.husky/pre-commit`

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Run lint-staged (lints + runs related tests for staged files)
npx lint-staged
```

### 5.3 `.lintstagedrc.json`

```json
{
  "src/**/*.{ts,tsx}": [
    "eslint --fix --max-warnings=0",
    "jest --findRelatedTests --bail --passWithNoTests"
  ],
  "src/**/*.css": [
    "stylelint --fix"
  ],
  "*.{ts,tsx,js,json,md}": [
    "prettier --write"
  ]
}
```

### 5.4 `.husky/pre-push`

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Run full test suite with coverage before pushing
npm run test:coverage
npm run coverage:check
```

### 5.5 Hook Behavior Summary

| Hook | Trigger | Action | Blocking? |
|------|---------|--------|-----------|
| `pre-commit` | `git commit` | ESLint fix + related tests for staged `.ts`/`.tsx` files | Yes -- commit aborted on failure |
| `pre-push` | `git push` | Full test suite with coverage threshold check | Yes -- push aborted on failure |

---

## 6. Test Documentation

### 6.1 Test Naming Convention

| Category | Pattern | Example |
|----------|---------|---------|
| Unit test | `[module].test.ts` | `cookieOperations.test.ts` |
| Unit test (component) | `[Component].test.tsx` | `CookieTable.test.tsx` |
| Integration test | `[flow].integration.test.ts` | `cookieProfileFlow.integration.test.ts` |
| E2E test | `[feature].spec.ts` | `popup.spec.ts` |
| Performance test | `[area].perf.test.ts` | `cookieLoading.perf.test.ts` |
| Stress test | `[area].stress.test.ts` | `bulkOperations.stress.test.ts` |

### 6.2 Test Writing Guidelines

**Pattern: Arrange-Act-Assert**

```typescript
it('should delete cookies matching auto-delete rule domain', async () => {
  // Arrange
  seedCookies([
    createCookie({ name: 'session', domain: '.example.com' }),
    createCookie({ name: 'tracking', domain: '.ads.com' }),
  ]);
  const rule = createRule({ domain: 'example.com', action: 'delete' });

  // Act
  await executeRule(rule);

  // Assert
  expectCookieRemoved('session', '.example.com');
  expectCookieMatches({ name: 'tracking', domain: '.ads.com' }); // untouched
});
```

**Naming: "should [expected behavior] when [condition]"**

```typescript
// Good
it('should show paywall modal when free user exceeds 2 profiles', ...);
it('should export cookies as JSON when user clicks export button', ...);
it('should retry API call 3 times when network request fails', ...);
it('should preserve cookie flags when editing value only', ...);

// Bad
it('test profile limit', ...);
it('export works', ...);
it('handles error', ...);
```

**Rules:**
1. One logical assertion per test (multiple `expect()` calls are fine if they assert one concept)
2. No test interdependencies -- each test must work in isolation
3. Reset all state in `beforeEach` via `setupTestEnvironment()`
4. Use factory functions (`createCookie()`, `createProfile()`, etc.) instead of raw object literals
5. Use `seedStorage()` and `seedCookies()` instead of directly manipulating mock internals
6. Prefer async/await over promise chains
7. Avoid `setTimeout` in tests -- use `jest.useFakeTimers()` and `jest.advanceTimersByTime()`
8. Name test files to match source files: `src/shared/payments.ts` -> `tests/unit/shared/payments.test.ts`

### 6.3 Directory Structure

```
tests/
  unit/
    background/
      messageHandler.test.ts
      storageManager.test.ts
      alarmManager.test.ts
    popup/
      components/
        CookieTable.test.tsx
        ProfileManager.test.tsx
        RuleEditor.test.tsx
        SearchBar.test.tsx
        PaywallModal.test.tsx
    shared/
      cookieOperations.test.ts
      cookieProfiles.test.ts
      autoDeleteRules.test.ts
      exportImport.test.ts
      featureGating.test.ts
      payments.test.ts
      apiClient.test.ts
    options/
      SettingsPage.test.tsx
  integration/
    messaging/
      popupBackground.integration.test.ts
      backgroundStorage.integration.test.ts
    storage/
      storageSync.integration.test.ts
      storageMigration.integration.test.ts
    cookies/
      cookieProfileFlow.integration.test.ts
      autoDeleteFlow.integration.test.ts
      exportImportFlow.integration.test.ts
    payment/
      licensingFlow.integration.test.ts
      featureGatingFlow.integration.test.ts
    onboarding/
      firstRunFlow.integration.test.ts
  e2e/
    popup.spec.ts
    profiles.spec.ts
    rules.spec.ts
    exportImport.spec.ts
    onboarding.spec.ts
    payment.spec.ts
  performance/
    cookieLoading.perf.test.ts
    storageOperations.perf.test.ts
    bundleSize.perf.test.ts
    memory.perf.test.ts
  fixtures/
    cookies.ts
    profiles.ts
    rules.ts
    licenses.ts
  mocks/
    chrome.ts
    webApis.ts
  setup/
    jest.setup.ts
    playwright.setup.ts
    testUtils.ts
    browserMatrix.ts
```

### 6.4 Test Coverage Report Template

```
Cookie Manager Test Report
========================
Date: [YYYY-MM-DD]
Version: [X.Y.Z]
Commit: [short SHA]
Branch: [branch name]

RESULTS
-------
Unit Tests:        [X] passed, [Y] failed, [Z] skipped   ([T]s)
Integration Tests: [X] passed, [Y] failed                 ([T]s)
E2E Tests:         [X] passed, [Y] failed                 ([T]s)
Performance Tests: [X] passed, [Y] over budget             ([T]s)
                   ---
Total:             [X] passed, [Y] failed, [Z] skipped

COVERAGE
--------
  Lines:      XX.X% (target: 80%)  [PASS/FAIL]
  Branches:   XX.X% (target: 80%)  [PASS/FAIL]
  Functions:  XX.X% (target: 80%)  [PASS/FAIL]
  Statements: XX.X% (target: 80%)  [PASS/FAIL]

CRITICAL MODULE COVERAGE
-------------------------
  payments.ts:        XX.X% lines (target: 90%)  [PASS/FAIL]
  featureGating.ts:   XX.X% lines (target: 90%)  [PASS/FAIL]
  apiClient.ts:       XX.X% lines (target: 90%)  [PASS/FAIL]
  cookieOperations.ts:XX.X% lines (target: 90%)  [PASS/FAIL]
  messageHandler.ts:  XX.X% lines (target: 90%)  [PASS/FAIL]
  storageManager.ts:  XX.X% lines (target: 90%)  [PASS/FAIL]

BUNDLE SIZE
-----------
  Total:      XXX KB / 342 KB budget  [PASS/FAIL]
  Popup:      XXX KB / 120 KB budget  [PASS/FAIL]
  Background: XXX KB / 35 KB budget   [PASS/FAIL]
  Options:    XXX KB / 80 KB budget   [PASS/FAIL]

PERFORMANCE BUDGETS
-------------------
  Popup load:            XXX ms / 500 ms budget   [PASS/FAIL]
  Service worker init:   XXX ms / 1000 ms budget  [PASS/FAIL]
  Storage read:          XXX ms / 20 ms budget    [PASS/FAIL]
  Storage write:         XXX ms / 50 ms budget    [PASS/FAIL]
  Cookie list (1000):    XXX ms / 200 ms budget   [PASS/FAIL]
  Message processing:    XXX ms / 10 ms budget    [PASS/FAIL]

FLAKY TESTS (if any)
---------------------
  [test name] -- [X] failures in last [N] runs

LOW COVERAGE FILES (< 50%)
---------------------------
  [file path]: XX.X%
```

---

## 7. Complete Test Count Summary

### 7.1 Aggregate Test Counts Across All 5 Agents

| Category | Tests | Agent | Source |
|----------|-------|-------|--------|
| **Unit: Cookie Operations** | 25+ | Agent 1 | CRUD, batch ops, domain filtering, cookie flags, expiration |
| **Unit: Cookie Profiles** | 15+ | Agent 1 | Create, load, save, delete, rename, duplicate, limit enforcement |
| **Unit: Auto-Delete Rules** | 15+ | Agent 1 | Rule CRUD, pattern matching, schedule types, domain matching |
| **Unit: Export/Import** | 15+ | Agent 1 | JSON export, import validation, format detection, 25-cookie limit |
| **Unit: Feature Gating** | 10+ | Agent 1 | canUse(), tier checks, limit enforcement, findMinTier() |
| **Unit: Payments** | 10+ | Agent 1 | License verification, caching, offline grace, key format validation |
| **Integration: Messaging** | 20+ | Agent 2 | Popup-background, background-content, message routing, error handling |
| **Integration: Storage** | 20+ | Agent 2 | Local/sync operations, migration, quota handling, change listeners |
| **Integration: Cookie Flow** | 20+ | Agent 2 | Profile load/save, rule execution, export-import roundtrip |
| **Integration: Payment Flow** | 15+ | Agent 2 | License check + feature gate + paywall trigger chain |
| **Integration: Onboarding** | 10+ | Agent 2 | First-run flow, default settings, welcome state |
| **E2E: Popup** | 15 | Agent 3 | Cookie list, search, CRUD, navigation, dark mode |
| **E2E: Profiles** | 8 | Agent 3 | Create, load, switch, delete profiles via popup |
| **E2E: Rules** | 8 | Agent 3 | Create, enable, disable, delete auto-delete rules |
| **E2E: Export/Import** | 8 | Agent 3 | Export JSON, import file, validation errors |
| **E2E: Onboarding** | 5 | Agent 3 | First-run wizard, permission grants, initial setup |
| **E2E: Payment** | 6 | Agent 3 | Paywall display, license key entry, upgrade flow |
| **Performance: Benchmarks** | 20+ | Agent 4 | Memory, CPU, load time, bundle size, storage throughput |
| **Cross-Browser: Compatibility** | 15+ | Agent 4 | Chrome/Firefox/Edge API namespace, manifest version diffs |
| **Stress: Load Testing** | 10+ | Agent 4 | 1000+ cookies, rapid operations, concurrent storage access |
| **TOTAL** | **270+** | | |

### 7.2 Coverage by Module

| Module | Unit | Integration | E2E | Total |
|--------|------|-------------|-----|-------|
| Cookie Operations | 25+ | 20+ | 15 | 60+ |
| Profiles | 15+ | 10+ | 8 | 33+ |
| Auto-Delete Rules | 15+ | 10+ | 8 | 33+ |
| Export/Import | 15+ | 10+ | 8 | 33+ |
| Feature Gating | 10+ | 5+ | 3 | 18+ |
| Payments/Licensing | 10+ | 10+ | 6 | 26+ |
| Messaging | -- | 20+ | -- | 20+ |
| Storage | -- | 20+ | -- | 20+ |
| Onboarding | -- | 10+ | 5 | 15+ |
| Performance/Stress | -- | -- | -- | 30+ |
| Cross-Browser | -- | -- | -- | 15+ |

### 7.3 Test Pyramid Distribution

```
Target Distribution:
  Unit:        70%  -->  90+ tests  (Agents 1)
  Integration: 20%  -->  85+ tests  (Agent 2)
  E2E:         10%  -->  50+ tests  (Agent 3)
  +Performance/Cross-Browser:  45+ tests  (Agent 4)
  ----------------------------------------
  Total:              270+ tests
```

---

## 8. CI/CD Integration Points

### 8.1 GitHub Actions Coverage Job

```yaml
# .github/workflows/coverage.yml -- additional job for the extension-ci workflow
coverage-gate:
  name: Coverage Threshold Gate
  runs-on: ubuntu-latest
  needs: test
  steps:
    - uses: actions/checkout@v4

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Run tests with coverage
      run: npm run test:coverage

    - name: Check coverage thresholds
      run: npm run coverage:check

    - name: Generate coverage badge
      run: npm run coverage:badge

    - name: Find untested files
      run: npm run coverage:find-untested

    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v4
      with:
        token: ${{ secrets.CODECOV_TOKEN }}
        files: ./coverage/lcov.info
        fail_ci_if_error: true

    - name: Comment coverage on PR
      if: github.event_name == 'pull_request'
      uses: marocchino/sticky-pull-request-comment@v2
      with:
        header: coverage
        path: coverage/coverage-summary.txt
```

### 8.2 Branch Protection Rules

| Rule | Value | Rationale |
|------|-------|-----------|
| Required status checks | `lint`, `test`, `coverage-gate`, `build` | No merge without passing tests |
| Coverage threshold | 80% global, 90% critical | Enforced by `coverage:check` script |
| Required reviewers | 1 | Code review for all changes |
| Dismiss stale reviews | Yes | Force re-review after new pushes |

---

## 9. Troubleshooting Guide

### 9.1 Common Test Failures

| Symptom | Cause | Fix |
|---------|-------|-----|
| `chrome is not defined` | Missing Jest setup file | Ensure `jest.setup.ts` is in `setupFilesAfterSetup` |
| `Cannot find module '@/...'` | Module alias not configured | Check `moduleNameMapper` in `jest.config.js` |
| `Timeout - Async callback was not invoked` | Missing `await` or unresolved promise | Add `await` or increase `jest.setTimeout()` |
| `ReferenceError: fetch is not defined` | JSDOM does not include `fetch` | Install `whatwg-fetch` or use `mockFetch()` from testUtils |
| Coverage shows 0% for a file | File not matched by `collectCoverageFrom` | Check glob patterns and exclusions |
| Flaky test passes locally, fails in CI | Timing-dependent assertion | Replace `setTimeout` with `jest.useFakeTimers()` |
| `QUOTA_BYTES quota exceeded` | Storage mock does not enforce limits | Mock `set` to reject for limit testing |
| Playwright: `Extension not loaded` | Build not present in `dist/chrome` | Run `npm run build:chrome` before E2E tests |

### 9.2 Coverage Debugging

```bash
# See which lines are uncovered in a specific file
npx jest --coverage --collectCoverageFrom='src/shared/payments.ts' --verbose

# Generate HTML report and open it
npm run test:coverage && npm run coverage:report

# Find all source files missing tests
npm run coverage:find-untested
```

---

*Agent 5 of 5 -- Code Coverage, Test Utilities & Consolidated Report. Provides coverage configuration with global 80% and critical-module 90% thresholds, enforcement scripts for CI and pre-commit hooks, complete test utility module with DOM helpers, Chrome API helpers, assertion helpers, and factory functions for Cookie Manager-specific types (cookies, profiles, rules, licenses), npm script runner for all test scenarios, Husky pre-commit/pre-push hooks with lint-staged, test documentation standards, and aggregated 270+ test count summary across all 5 agents.*
