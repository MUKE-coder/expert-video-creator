#!/usr/bin/env bash
# Zip each skill for upload in Claude.ai (Settings → Capabilities → Skills). Output: dist/<skill>.zip
set -euo pipefail
cd "$(dirname "$0")/.."
rm -rf dist && mkdir -p dist
for d in skills/*/; do
  n=$(basename "$d")
  tmp=$(mktemp -d); cp -r "$d" "$tmp/$n"
  # skills reference ../video-references; bundle it so each zip works alone
  [ "$n" != video-references ] && cp -r skills/video-references "$tmp/video-references"
  (cd "$tmp" && zip -qr "$OLDPWD/dist/$n.zip" . -x '*/node_modules/*' '*/.DS_Store')
  rm -rf "$tmp"; echo "  ✓ dist/$n.zip"
done
