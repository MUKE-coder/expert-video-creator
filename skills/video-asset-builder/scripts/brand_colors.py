#!/usr/bin/env python3
"""Extract a brand palette from screenshots.

Usage: python3 brand_colors.py .video/captures [--k 8] [--json]
Prints dominant colours with share and a guess at bg / primary / secondary.
"""
import argparse
import colorsys
import json
from pathlib import Path

import numpy as np
from PIL import Image


def kmeans(px, k, iters=12, seed=0):
    rng = np.random.default_rng(seed)
    c = px[rng.choice(len(px), k, replace=False)].astype(float)
    for _ in range(iters):
        d = ((px[:, None, :] - c[None]) ** 2).sum(-1)
        lab = d.argmin(1)
        for j in range(k):
            m = px[lab == j]
            if len(m):
                c[j] = m.mean(0)
    counts = np.bincount(lab, minlength=k)
    return c, counts


def hexc(c):
    return "#%02X%02X%02X" % tuple(int(round(v)) for v in c)


def lum(c):
    def ch(v):
        v = v / 255
        return v / 12.92 if v <= 0.03928 else ((v + 0.055) / 1.055) ** 2.4
    r, g, b = (ch(v) for v in c)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def contrast(a, b):
    la, lb = sorted([lum(a), lum(b)], reverse=True)
    return (la + 0.05) / (lb + 0.05)


def palette(folder, k=8):
    imgs = sorted(Path(folder).glob("*.jpg")) + sorted(Path(folder).glob("*.png"))
    if not imgs:
        raise SystemExit("no images found")
    px = []
    for f in imgs[:12]:
        im = Image.open(f).convert("RGB")
        im.thumbnail((240, 240))
        px.append(np.asarray(im).reshape(-1, 3))
    px = np.concatenate(px)
    cents, counts = kmeans(px, k)
    order = counts.argsort()[::-1]
    cols = [(cents[i], counts[i] / counts.sum()) for i in order]
    bg = cols[0][0]
    # saturated colours that are not the background = brand candidates
    cand = []
    for c, share in cols:
        h, l, s = colorsys.rgb_to_hls(*(c / 255))
        if s > 0.35 and 0.2 < l < 0.8 and share > 0.003:
            cand.append((s * (share ** 0.3), c))
    cand.sort(key=lambda x: -x[0])
    primary = cand[0][1] if cand else None
    secondary = cand[1][1] if len(cand) > 1 else None
    return {
        "dominant": [{"hex": hexc(c), "share": round(float(s), 3)} for c, s in cols],
        "bg": hexc(bg),
        "is_dark": lum(bg) < 0.2,
        "primary": hexc(primary) if primary is not None else None,
        "secondary": hexc(secondary) if secondary is not None else None,
        "primary_text_ok_on_bg": bool(primary is not None and contrast(primary, bg) >= 4.5),
    }


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("folder")
    ap.add_argument("--k", type=int, default=8)
    ap.add_argument("--json", action="store_true")
    a = ap.parse_args()
    p = palette(a.folder, a.k)
    print(json.dumps(p, indent=2) if a.json else "\n".join(f"{k}: {v}" for k, v in p.items()))
