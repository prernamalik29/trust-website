#!/usr/bin/env bash
# build.sh — Unified build script for Netlify
# Copies the static public site and builds the admin React SPA into dist/

set -e  # Exit on any error

echo "=== OAIT Website Build ==="

# ─── 1. Clean & create dist ──────────────────────────────────────────────────
rm -rf dist
mkdir -p dist

# ─── 2. Copy public static site files ───────────────────────────────────────
echo "Copying public site files..."
cp *.html dist/

for dir in css js assets images data; do
  if [ -d "$dir" ]; then
    cp -r "$dir" dist/
    echo "  Copied $dir/"
  fi
done

# Copy favicon if present at root
[ -f "favicon.ico" ]  && cp favicon.ico dist/  || true
[ -f "favicon.png" ]  && cp favicon.png dist/  || true
[ -f "robots.txt" ]   && cp robots.txt dist/   || true
[ -f "sitemap.xml" ]  && cp sitemap.xml dist/  || true

# ─── 3. Build admin React app ────────────────────────────────────────────────
echo "Building admin panel..."
cd admin
npm ci
npm run build
cd ..

echo "=== Build complete. Static output is in dist/ ==="
