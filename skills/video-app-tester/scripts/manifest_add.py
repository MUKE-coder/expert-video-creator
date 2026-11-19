#!/usr/bin/env python3
"""Register a screenshot taken by another tool (host browser, agent-browser, the user) in manifest.json.

Usage:
  python3 manifest_add.py shot.png --id 03-settings --url /settings --title "Settings" \
      --viewport 1440 [--focus "x,y,w,h[:label]" ...] [--out .video/captures]
The image is converted to JPEG q92 and copied into the captures folder. Focus boxes are in CSS px of a
viewport `--viewport` wide (the template converts); measure them from an accessibility snapshot or by eye.
"""
import argparse
import json
from pathlib import Path

from PIL import Image


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("image")
    ap.add_argument("--id", required=True)
    ap.add_argument("--url", default="")
    ap.add_argument("--title", default="")
    ap.add_argument("--viewport", type=int, help="CSS width the page was rendered at (default: image width)")
    ap.add_argument("--focus", action="append", default=[])
    ap.add_argument("--notes", default="")
    ap.add_argument("--out", default=".video/captures")
    a = ap.parse_args()
    out = Path(a.out)
    out.mkdir(parents=True, exist_ok=True)
    im = Image.open(a.image).convert("RGB")
    f = out / f"{a.id}.jpg"
    im.save(f, quality=92)
    scale = im.width / a.viewport if a.viewport else 1
    focus = []
    for spec in a.focus:
        box, _, label = spec.partition(":")
        x, y, w, h = (int(float(v)) for v in box.split(","))
        focus.append({"selector": label or f"box{len(focus)}", "x": x, "y": y, "w": w, "h": h})
    entry = {"id": a.id, "file": f.name, "url": a.url, "title": a.title, "w": im.width, "h": im.height,
             "scale": round(scale, 3), "focus": focus, "notes": a.notes, "redacted": []}
    mf = out / "manifest.json"
    data = json.loads(mf.read_text()) if mf.exists() else []
    data = [d for d in data if d["id"] != a.id] + [entry]
    mf.write_text(json.dumps(data, indent=2))
    print(f"  ✓ {f.name} {im.width}x{im.height} scale {scale:.2f}, {len(focus)} focus boxes")


if __name__ == "__main__":
    main()
