#!/usr/bin/env bash
# Render a draft or the final video and mux the mix.  Usage: bash render.sh draft|final [.video]
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"; source "$HERE/chrome.sh"
MODE="${1:-draft}"; VID="$(cd "${2:-.video}" && pwd)"; P="$VID/project"; OUTD="$VID/out"; mkdir -p "$OUTD"
CORES=$(node -e 'console.log(require("os").cpus().length)')
cd "$P" && node scripts/timing.mjs >/dev/null
if [ "$MODE" = draft ]; then FLAGS="--scale=0.5 --crf=28"; NAME=draft; else FLAGS="--crf=17"; NAME=final; fi
TMP="$OUTD/tmp_${NAME}_video.mp4"
npx remotion render src/index.ts Main "$TMP" --codec=h264 --pixel-format=yuv420p $FLAGS --concurrency="$CORES" $BROWSER_FLAG --log=error
if [ -f "$VID/audio/mix.wav" ]; then
  ffmpeg -v error -y -i "$TMP" -i "$VID/audio/mix.wav" -map 0:v -map 1:a -c:v copy -af apad -c:a aac -b:a 192k -shortest -movflags +faststart "$OUTD/tmp_${NAME}.mp4"
  rm "$TMP"
else
  ffmpeg -v error -y -i "$TMP" -c copy -movflags +faststart "$OUTD/tmp_${NAME}.mp4" && rm "$TMP"
fi
mv "$OUTD/tmp_${NAME}.mp4" "$OUTD/${NAME}.mp4"
if [ "$MODE" = final ]; then
  POSTER=$(node -e 'const t=require("./timing.json");const s=t.scenes[Math.min(2,t.scenes.length-1)];console.log(((s.start+(s.end-s.start)*0.85)/t.fps).toFixed(2))')
  ffmpeg -v error -y -ss "$POSTER" -i "$OUTD/final.mp4" -frames:v 1 -q:v 2 "$OUTD/poster.jpg"
fi
ffprobe -v error -show_entries format=duration:stream=codec_name,width,height -of compact "$OUTD/${NAME}.mp4"
echo "wrote $OUTD/${NAME}.mp4"
