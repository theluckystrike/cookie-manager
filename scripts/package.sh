#!/usr/bin/env bash
#
# package.sh — Build a Chrome Web Store-ready .zip for Cookie Manager
#
# Usage:
#   bash scripts/package.sh          # package from project root
#   npm run package                   # via npm script
#
# Output:
#   dist/cookie-manager-v{version}.zip
#
set -euo pipefail

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DIST="$ROOT/dist"
STAGE="$DIST/chrome"

# ---------------------------------------------------------------------------
# Read version from manifest.json
# ---------------------------------------------------------------------------
VERSION=$(node -e "console.log(JSON.parse(require('fs').readFileSync('$ROOT/manifest.json','utf8')).version)")
ZIP_NAME="cookie-manager-v${VERSION}.zip"
ZIP_PATH="$DIST/$ZIP_NAME"

echo "================================================"
echo "  Cookie Manager — Chrome Web Store Packager"
echo "================================================"
echo ""
echo "  Version:  $VERSION"
echo "  Output:   dist/$ZIP_NAME"
echo ""

# ---------------------------------------------------------------------------
# Clean previous build
# ---------------------------------------------------------------------------
echo "[package] Cleaning previous build..."
rm -rf "$STAGE"
rm -f "$ZIP_PATH"
mkdir -p "$STAGE"

# ---------------------------------------------------------------------------
# Copy production files
# ---------------------------------------------------------------------------
echo "[package] Copying production files..."

# manifest.json
cp "$ROOT/manifest.json" "$STAGE/manifest.json"
echo "  + manifest.json"

# Source directories
for dir in src assets _locales onboarding shared; do
    if [ -d "$ROOT/$dir" ]; then
        cp -R "$ROOT/$dir" "$STAGE/$dir"
        echo "  + $dir/"
    fi
done

# Top-level files
for file in LICENSE README.md; do
    if [ -f "$ROOT/$file" ]; then
        cp "$ROOT/$file" "$STAGE/$file"
        echo "  + $file"
    fi
done

# ---------------------------------------------------------------------------
# Remove non-production files from the staging area
# ---------------------------------------------------------------------------
echo "[package] Removing non-production files..."

# Remove source/design assets not needed at runtime
find "$STAGE" -name "*.DS_Store" -delete 2>/dev/null || true
find "$STAGE" -name "Thumbs.db" -delete 2>/dev/null || true
find "$STAGE" -name "icon-source.png" -delete 2>/dev/null || true
find "$STAGE" -name "*.map" -delete 2>/dev/null || true

# ---------------------------------------------------------------------------
# Create ZIP
# ---------------------------------------------------------------------------
echo "[package] Creating ZIP archive..."
cd "$STAGE"
zip -r "$ZIP_PATH" . -x '*.DS_Store' > /dev/null

# ---------------------------------------------------------------------------
# Report
# ---------------------------------------------------------------------------
ZIP_SIZE_BYTES=$(wc -c < "$ZIP_PATH" | tr -d ' ')
ZIP_SIZE_KB=$(echo "scale=1; $ZIP_SIZE_BYTES / 1024" | bc)
ZIP_SIZE_MB=$(echo "scale=2; $ZIP_SIZE_BYTES / 1048576" | bc)

echo ""
echo "================================================"
echo "  Build complete!"
echo "================================================"
echo ""
echo "  File:     dist/$ZIP_NAME"
echo "  Size:     ${ZIP_SIZE_KB} KB (${ZIP_SIZE_MB} MB)"
echo ""

# Chrome Web Store limit is 500 MB (practically never hit)
# Warn if zip is suspiciously large (> 10 MB)
if [ "$ZIP_SIZE_BYTES" -gt 10485760 ]; then
    echo "  WARNING: ZIP is over 10 MB. Consider optimizing assets."
    echo ""
fi

# ---------------------------------------------------------------------------
# Validate ZIP contents
# ---------------------------------------------------------------------------

# Dump file list to a temp file to avoid pipefail issues with head/grep
ZIP_LIST=$(mktemp)
trap "rm -f '$ZIP_LIST'" EXIT
zipinfo -1 "$ZIP_PATH" > "$ZIP_LIST"

TOTAL_FILES=$(wc -l < "$ZIP_LIST" | tr -d ' ')

echo "  Contents:"
echo "  ---------"
head -30 "$ZIP_LIST"
echo "  ... ($TOTAL_FILES files total)"
echo ""

# Check that required files exist in the ZIP
MISSING=""
for required in manifest.json LICENSE src/background/service-worker.js src/popup/index.html; do
    if ! grep -q "^${required}$" "$ZIP_LIST"; then
        MISSING="${MISSING}  - ${required}"$'\n'
    fi
done

if [ -n "$MISSING" ]; then
    echo "  ERROR: Missing required files in ZIP:"
    printf "%s" "$MISSING"
    echo ""
    exit 1
fi

echo "  Validation passed -- ready for Chrome Web Store upload."
echo ""
