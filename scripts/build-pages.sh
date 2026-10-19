#!/usr/bin/env bash
# Build the static output directory for Cloudflare Pages.
set -euo pipefail
cd "$(dirname "$0")/.."

rm -rf dist
mkdir -p dist
cp -r index.html assets favicon.ico site.webmanifest robots.txt _headers dist/

echo "Built dist/ ($(du -sh dist | cut -f1))"
