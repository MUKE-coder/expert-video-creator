#!/usr/bin/env bash
# Copy pack outputs into the Remotion project: captures, assets, theme, captions, manifest.
set -euo pipefail
VID="${1:-.video}"; P="$VID/project"
mkdir -p "$P/public/captures" "$P/public/assets" "$P/src/data"
[ -d "$VID/captures" ] && find "$VID/captures" -maxdepth 1 -type f \( -name '*.jpg' -o -name '*.png' -o -name '*.webm' -o -name '*.mp4' \) -exec cp {} "$P/public/captures/" \;
[ -f "$VID/captures/manifest.json" ] && cp "$VID/captures/manifest.json" "$P/src/data/manifest.json"
[ -d "$VID/assets" ] && cp -r "$VID/assets/." "$P/public/assets/"
[ -f "$VID/theme.json" ] && cp "$VID/theme.json" "$P/src/theme.json"
[ -f "$VID/captions.json" ] && cp "$VID/captions.json" "$P/src/captions.json"
echo "synced captures/assets/theme/captions into $P"
