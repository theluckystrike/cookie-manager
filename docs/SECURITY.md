# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability in Cookie Manager, please report it responsibly:

1. **Do NOT** open a public GitHub issue
2. Email security concerns to: security@zovo.one
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Any suggested fixes

## Response Timeline

- We will acknowledge receipt within 48 hours
- We will provide an initial assessment within 7 days
- We will work with you to understand and resolve the issue

## Security Design

Cookie Manager is designed with security in mind:

- **No network requests** - All data stays on your device
- **No external dependencies** - Pure vanilla JavaScript
- **Minimal permissions** - Only requests what's necessary
- **Open source** - Full code transparency

## Scope

The following are in scope for security reports:
- XSS vulnerabilities in the popup UI
- Data leakage to external services
- Permission escalation
- Cookie manipulation vulnerabilities

The following are out of scope:
- Bugs that require physical access to the device
- Social engineering attacks
- Issues in Chrome itself
