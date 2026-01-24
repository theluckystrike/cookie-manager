# Contributing to Cookie Manager

Thank you for your interest in contributing to Cookie Manager!

## Getting Started

1. Fork the repository
2. Clone your fork locally
3. Load the extension in Chrome:
   - Go to `chrome://extensions`
   - Enable Developer Mode
   - Click "Load unpacked" and select the project folder

## Development

### Project Structure
```
cookie-manager/
├── src/
│   ├── popup/        # UI files (HTML, CSS, JS)
│   ├── background/   # Service worker
│   └── utils/        # Utility modules
├── assets/           # Icons and images
└── docs/             # Documentation
```

### Code Style
- Use ES6+ features
- Document functions with JSDoc comments
- Keep functions small and focused
- Use meaningful variable names

### Testing
Before submitting a PR:
1. Load the extension and test all features
2. Check for console errors
3. Test in both light and dark mode
4. Verify changes work on multiple sites

## Pull Requests

1. Create a feature branch from `main`
2. Make your changes
3. Update CHANGELOG.md if applicable
4. Submit a PR with a clear description

## Reporting Issues

Use the GitHub issue templates for:
- Bug reports
- Feature requests

## Code of Conduct

Be respectful and constructive. We're all here to make Cookie Manager better!

## Questions?

- Open an issue for technical questions
- Visit [zovo.one](https://zovo.one) for general inquiries
