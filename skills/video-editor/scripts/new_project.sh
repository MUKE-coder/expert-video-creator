#!/usr/bin/env bash
# Create .video/project from the template and install it.  Usage: bash new_project.sh [.video]
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
VID="${1:-.video}"
P="$VID/project"
if [ -d "$P/node_modules" ]; then echo "project exists: $P"; else
  mkdir -p "$P" && cp -r "$HERE/../template/." "$P/"
  (cd "$P" && npm install --no-audit --no-fund --loglevel=error)
fi
bash "$HERE/sync.sh" "$VID"
echo "ready: $P  (edit $P/src/video.json, then: bash $HERE/stills.sh)"
