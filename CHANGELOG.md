# Changelog

All notable changes to the Cookie Manager extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-02-11

### Added
- Core cookie viewing, editing, and deletion
- Cookie search and filtering
- JWT token decoder
- Export cookies as JSON
- Read-only mode toggle
- Context menu integration
- Internationalization (6 locales)
- Cross-browser support (Chrome + Firefox)
- Churn prevention and retention system
- Security hardening (XSS prevention, input validation, CSP)
- Customer support (feedback collector, diagnostics, help page)
- Performance optimization (timing, storage optimizer, debouncing)
- Accessibility compliance (WCAG 2.1 AA, keyboard nav, screen readers)
- Version and release management system

### Security
- Content Security Policy enforcement
- Input sanitization on all user inputs
- Message validation between extension components
- No external network requests — 100% local operation

### Developer Tools
- Performance audit CLI (`scripts/perf-audit.js`)
- Accessibility audit CLI (`scripts/a11y-audit.js`)
- Release checklist CLI (`scripts/release-checklist.js`)
- Version bump CLI (`scripts/bump-version.js`)
- Security scanner (`scripts/security-scan.js`)
