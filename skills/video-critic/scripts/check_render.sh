#!/usr/bin/env bash
# Measure a rendered video: format, duration, loudness, black/frozen stretches, silence, and a contact sheet.
# Usage: bash check_render.sh .video/out/draft.mp4 [expected_seconds] [every_n_seconds]
set -uo pipefail
F="$1"; EXP="${2:-}"; EVERY="${3:-3}"
OUT="$(dirname "$F")/check"; mkdir -p "$OUT"; rm -f "$OUT"/t_*.jpg
echo "== format"
ffprobe -v error -show_entries stream=codec_name,width,height,r_frame_rate,pix_fmt,sample_rate,channels -show_entries format=duration,bit_rate -of default=nw=1 "$F" | sed 's/^/  /'
DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$F")
[ -n "$EXP" ] && python3 -c "d=$DUR;e=$EXP;print('  duration OK' if abs(d-e)<=max(0.5,e*0.03) else f'  ! duration {d:.2f}s vs expected {e}s')"
echo "== loudness (target -16 LUFS, peak <= -1.5 dBTP)"
if ffprobe -v error -select_streams a -show_entries stream=codec_name -of csv=p=0 "$F" | grep -q .; then
  ffmpeg -hide_banner -nostats -i "$F" -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+(I|Peak|LRA):" | sed 's/^/ /'
  echo "== silence > 2s"
  ffmpeg -hide_banner -nostats -i "$F" -af silencedetect=n=-45dB:d=2 -f null - 2>&1 | grep -E "silence_(start|end)" | sed 's/^.*\] /  /' | head -10
else
  echo "  ! no audio stream"
fi
echo "== black frames (>= 0.3s)"
ffmpeg -hide_banner -nostats -i "$F" -vf blackdetect=d=0.3:pix_th=0.05 -an -f null - 2>&1 | grep blackdetect | sed 's/^.*\] /  /' | head -10
echo "== frozen stretches (>= 2.5s, normal for holds; check they are intended)"
ffmpeg -hide_banner -nostats -i "$F" -vf freezedetect=n=0.002:d=2.5 -an -f null - 2>&1 | grep -E "freeze_(start|duration)" | sed 's/^.*\] /  /' | paste - - | head -12
echo "== contact sheet every ${EVERY}s"
ffmpeg -v error -i "$F" -vf "fps=1/$EVERY,scale=480:-1" "$OUT/t_%03d.jpg"
python3 - "$OUT" "$EVERY" <<'PY'
import sys, glob
from PIL import Image, ImageDraw
out, every = sys.argv[1], float(sys.argv[2])
fs = sorted(glob.glob(out + "/t_*.jpg")); ims = [Image.open(f) for f in fs]
if ims:
    w, h = ims[0].size; cols = 5 if w > h else 7; rows = (len(ims) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * w, rows * h), (30, 30, 30)); d = ImageDraw.Draw(sheet)
    for i, im in enumerate(ims):
        x, y = (i % cols) * w, (i // cols) * h; sheet.paste(im, (x, y))
        d.rectangle([x, y, x + 64, y + 22], fill=(0, 0, 0)); d.text((x + 6, y + 5), f"{(i + 1) * every - every:.0f}s", fill=(255, 255, 0))
    sheet.save(out + "/sheet.jpg", quality=85); print(f"  {len(ims)} frames -> {out}/sheet.jpg")
PY
