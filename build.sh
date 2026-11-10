#!/usr/bin/env bash
set -e

# Navigate to script directory
cd "$(dirname "$0")"

echo "========================================================"
echo "  Building \"Zip This Folder\" Extension"
echo "========================================================"
echo ""

# Check Node.js installation
if ! command -v node >/dev/null 2>&1; then
    echo "[ERROR] Node.js is not installed or not in your PATH."
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Check npm installation
if ! command -v npm >/dev/null 2>&1; then
    echo "[ERROR] npm is not found in your PATH."
    exit 1
fi

# Install dependencies if node_modules is missing
if [ ! -d "node_modules" ]; then
    echo "[*] Installing dependencies..."
    npm install
    echo ""
fi

# Typecheck
echo "[*] Typechecking TypeScript sources..."
npm run check-types
echo ""

# Build & Package VSIX
echo "[*] Bundling extension and creating VSIX package..."
npm run package-vsix
echo ""

echo "========================================================"
echo "  Build Successful!"
echo "========================================================"
echo ""
echo "Generated VSIX file(s):"
for f in *.vsix; do
    [ -e "$f" ] || continue
    if stat -f %z "$f" >/dev/null 2>&1; then
        size=$(stat -f %z "$f")
    elif stat -c %s "$f" >/dev/null 2>&1; then
        size=$(stat -c %s "$f")
    else
        size=$(wc -c < "$f" | tr -d ' ')
    fi
    echo "  - $f (${size} bytes)"
done
echo ""
echo "To install in VS Code or Antigravity:"
for f in *.vsix; do
    [ -e "$f" ] || continue
    echo "  code --install-extension $f"
done
echo ""

