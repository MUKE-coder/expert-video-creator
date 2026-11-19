#!/usr/bin/env bash
# Render checked frames and a contact sheet.  Usage: bash stills.sh [.video] [frames...]
# With no frames: picks each scene's "busiest" moment (85% through the scene) from timing.json.
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"; source "$HERE/chrome.sh"
VID="${1:-.video}"; shift || true
P="$VID/project"; OUT="$(cd "$VID" && pwd)/stills"; mkdir -p "$OUT"; rm -f "$OUT"/*.png
cd "$P" && node scripts/timing.mjs >/dev/null
FRAMES=("$@")
if [ ${#FRAMES[@]} -eq 0 ]; then
  mapfile -t FRAMES < <(node -e 'const t=require("./timing.json");for(const s of t.scenes)console.log(Math.round(s.start+(s.end-s.start)*0.85))')
fi
for fr in "${FRAMES[@]}"; do
  npx remotion still src/index.ts Main "$OUT/f$(printf %05d "$fr").png" --frame="$fr" $BROWSER_FLAG --log=error
done
ls "$OUT"/f*.png > /dev/null
# contact sheet: 3 per row, scaled to 640 wide each
python3 - "$OUT" <<'PY'
import sys, glob
from PIL import Image
out = sys.argv[1]
fs = sorted(glob.glob(out + "/f*.png"))
ims = [Image.open(f) for f in fs]
w = 640; h = int(ims[0].height * w / ims[0].width)
cols = 3 if ims[0].width >= ims[0].height else 4
rows = (len(ims) + cols - 1) // cols
sheet = Image.new("RGB", (cols * w, rows * h), (40, 40, 40))
for i, im in enumerate(ims):
    sheet.paste(im.convert("RGB").resize((w, h)), ((i % cols) * w, (i // cols) * h))
sheet.save(out + "/contact.jpg", quality=88)
print(f"{len(ims)} stills + contact.jpg in {out}")
PY
