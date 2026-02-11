#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Terminal colors (matching perf-audit.js style)
// ---------------------------------------------------------------------------

const C = {
  reset:  '\x1b[0m',
  bold:   '\x1b[1m',
  red:    '\x1b[31m',
  green:  '\x1b[32m',
  yellow: '\x1b[33m',
  cyan:   '\x1b[36m',
  dim:    '\x1b[2m',
};

function green(s)  { return `${C.green}${s}${C.reset}`; }
function red(s)    { return `${C.red}${s}${C.reset}`; }
function yellow(s) { return `${C.yellow}${s}${C.reset}`; }
function cyan(s)   { return `${C.cyan}${s}${C.reset}`; }
function bold(s)   { return `${C.bold}${s}${C.reset}`; }
function dim(s)    { return `${C.dim}${s}${C.reset}`; }

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ROOT = path.resolve(__dirname, '..');
const MANIFESTS_DIR = path.join(ROOT, 'manifests');
const CHANGELOG_PATH = path.join(ROOT, 'CHANGELOG.md');
const VALID_BUMPS = ['major', 'minor', 'patch', 'build'];
const SEMVER_RE = /^(\d+)\.(\d+)\.(\d+)(?:\.(\d+))?$/;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseVersion(version) {
  const match = version.match(SEMVER_RE);
  if (!match) return null;
  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
    build: match[4] != null ? parseInt(match[4], 10) : null,
  };
}

function formatVersion(parts) {
  const base = `${parts.major}.${parts.minor}.${parts.patch}`;
  return parts.build != null ? `${base}.${parts.build}` : base;
}

function bumpVersion(version, type) {
  const parts = parseVersion(version);
  if (!parts) return null;

  switch (type) {
    case 'major':
      return formatVersion({ major: parts.major + 1, minor: 0, patch: 0, build: null });
    case 'minor':
      return formatVersion({ major: parts.major, minor: parts.minor + 1, patch: 0, build: null });
    case 'patch':
      return formatVersion({ major: parts.major, minor: parts.minor, patch: parts.patch + 1, build: null });
    case 'build': {
      const nextBuild = (parts.build != null ? parts.build : 0) + 1;
      return formatVersion({ major: parts.major, minor: parts.minor, patch: parts.patch, build: nextBuild });
    }
    default:
      return null;
  }
}

function discoverManifests() {
  const files = [];

  // Root manifest.json
  const rootManifest = path.join(ROOT, 'manifest.json');
  if (fs.existsSync(rootManifest)) files.push(rootManifest);

  // All JSON files in manifests/ directory
  if (fs.existsSync(MANIFESTS_DIR)) {
    const entries = fs.readdirSync(MANIFESTS_DIR);
    for (const entry of entries) {
      if (entry.endsWith('.json')) {
        files.push(path.join(MANIFESTS_DIR, entry));
      }
    }
  }

  return files;
}

function readManifestVersion(filePath) {
  const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  return content.version || null;
}

function updateManifestVersion(filePath, newVersion, versionName, dryRun) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const content = JSON.parse(raw);
  content.version = newVersion;
  if (versionName) {
    content.version_name = versionName;
  }

  if (!dryRun) {
    // Detect indent style from original file
    const indent = raw.startsWith('{\n    ') ? 4 : 2;
    fs.writeFileSync(filePath, JSON.stringify(content, null, indent) + '\n', 'utf8');
  }
}

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function appendChangelog(newVersion, dryRun) {
  const entry = `\n## [${newVersion}] - ${todayISO()}\n\n### Changed\n- Version bump to ${newVersion}\n`;

  if (fs.existsSync(CHANGELOG_PATH)) {
    const content = fs.readFileSync(CHANGELOG_PATH, 'utf8');
    // Insert after the header block (after the first ## line's preceding blank line)
    const marker = content.indexOf('\n## [');
    if (marker !== -1) {
      const updated = content.slice(0, marker) + entry + content.slice(marker);
      if (!dryRun) fs.writeFileSync(CHANGELOG_PATH, updated, 'utf8');
    } else {
      if (!dryRun) fs.appendFileSync(CHANGELOG_PATH, entry, 'utf8');
    }
  } else {
    const header = '# Changelog\n\nAll notable changes to Cookie Manager will be documented in this file.\n';
    if (!dryRun) fs.writeFileSync(CHANGELOG_PATH, header + entry, 'utf8');
  }
}

function printUsage() {
  console.log('');
  console.log(bold('Usage:') + ' node scripts/bump-version.js [--dry-run] [--changelog] <major|minor|patch|build> [prerelease-label]');
  console.log('');
  console.log('  Examples:');
  console.log(`    ${cyan('node scripts/bump-version.js patch')}`);
  console.log(`    ${cyan('node scripts/bump-version.js minor Beta')}`);
  console.log(`    ${cyan('node scripts/bump-version.js --dry-run major')}`);
  console.log(`    ${cyan('node scripts/bump-version.js --changelog patch')}`);
  console.log('');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const changelog = args.includes('--changelog');
  const positional = args.filter(a => !a.startsWith('--'));

  const bumpType = positional[0];
  const preLabel = positional[1] || null;

  if (!bumpType || !VALID_BUMPS.includes(bumpType)) {
    console.error(red('Error: Missing or invalid bump type.'));
    printUsage();
    process.exit(1);
  }

  console.log('');
  console.log(bold('=== Cookie Manager Version Bump ==='));
  if (dryRun) console.log(yellow('  [DRY RUN] No files will be modified.'));
  console.log('');

  // Discover manifests
  const manifests = discoverManifests();
  if (manifests.length === 0) {
    console.error(red('  Error: No manifest files found.'));
    process.exit(1);
  }

  // Read current versions
  const versions = manifests.map(f => ({ file: f, version: readManifestVersion(f) }));
  const uniqueVersions = [...new Set(versions.map(v => v.version))];

  if (uniqueVersions.length > 1) {
    console.log(yellow('  Warning: Manifests have mismatched versions:'));
    for (const v of versions) {
      console.log(`    ${dim(path.relative(ROOT, v.file))}  ${v.version}`);
    }
    console.log('');
  }

  const currentVersion = versions[0].version;

  // Validate current version
  if (!parseVersion(currentVersion)) {
    console.error(red(`  Error: Current version "${currentVersion}" is not valid semver.`));
    process.exit(1);
  }

  // Compute new version
  const newVersion = bumpVersion(currentVersion, bumpType);
  if (!newVersion) {
    console.error(red('  Error: Failed to compute new version.'));
    process.exit(1);
  }

  const versionName = preLabel ? `${newVersion} ${preLabel}` : null;

  // Display change
  console.log(`  ${bold('Bump type:')}    ${cyan(bumpType)}`);
  console.log(`  ${bold('Old version:')}  ${dim(currentVersion)}`);
  console.log(`  ${bold('New version:')}  ${green(newVersion)}${versionName ? '  ' + dim('(' + versionName + ')') : ''}`);
  console.log('');

  // Update manifests
  console.log(bold('  Files updated:'));
  for (const { file } of versions) {
    const rel = path.relative(ROOT, file);
    updateManifestVersion(file, newVersion, versionName, dryRun);
    console.log(`    ${green('\u2713')} ${rel}`);
  }
  console.log('');

  // Changelog
  if (changelog) {
    appendChangelog(newVersion, dryRun);
    console.log(`    ${green('\u2713')} CHANGELOG.md`);
    console.log('');
  }

  // Git tag suggestion
  const tag = `v${newVersion}`;
  const label = versionName || `Release ${tag}`;
  console.log(bold('  Suggested git commands:'));
  console.log(`    ${cyan(`git add -A && git commit -m "Bump version to ${newVersion}"`)}`);
  console.log(`    ${cyan(`git tag -a ${tag} -m "${label}"`)}`);
  console.log('');

  if (dryRun) {
    console.log(yellow('  Dry run complete. No files were modified.'));
  } else {
    console.log(green('  Version bump complete!'));
  }
  console.log('');
}

main();
