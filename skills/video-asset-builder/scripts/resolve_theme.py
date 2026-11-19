#!/usr/bin/env python3
"""Resolve a style preset (optionally with brand colours) into theme.json for the editor template.

Usage:
  python3 resolve_theme.py --preset mono --out .video/theme.json
  python3 resolve_theme.py --preset brand --captures .video/captures --out .video/theme.json
  python3 resolve_theme.py --preset custom --bg '#0B1020' --accent '#7C5CFF' --font Inter --out .video/theme.json
"""
import argparse
import json
import sys
from pathlib import Path

SYNTAX_DARK = {"cmd": "#52A8FF", "flag": "#BF7AF0", "str": "#62C073", "type": "#F5A524",
               "op": "#FF6166", "kw": "#FF4D8D", "comment": "#8F8F8F", "dir": "#3DD6C9", "ok": "#62C073"}
SYNTAX_LIGHT = {"cmd": "#0068D6", "flag": "#7D3BC4", "str": "#2F8A3E", "type": "#B26A00",
                "op": "#D6313A", "kw": "#C8246A", "comment": "#7A7A7A", "dir": "#0E8A80", "ok": "#2F8A3E"}

PRESETS = {
    "mono": dict(bg="#000000", fg="#EDEDED", muted="#8F8F8F", dim="#5E5E5E", border="#2A2A2A",
                 surface="#0A0A0A", surface2="#111111", accent="#FFFFFF", radius=14,
                 fontSans="Geist", fontMono="Geist Mono", backdrop="grid-glow", motion="calm", dark=True),
    "playful": dict(bg="#FFF8EE", fg="#1E1B18", muted="#6B645C", dim="#A39A8F", border="#E8DCCB",
                    surface="#FFFFFF", surface2="#FBF1E3", accent="#FF6B4A", radius=22,
                    fontSans="Geist", fontMono="Geist Mono", backdrop="blobs", motion="springy", dark=False),
    "bold": dict(bg="#0B0B0F", fg="#FFFFFF", muted="#A3A3B2", dim="#6A6A78", border="#262633",
                 surface="#14141C", surface2="#1B1B25", accent="#C6FF3D", radius=8,
                 fontSans="Geist", fontMono="Geist Mono", backdrop="noise", motion="fast", dark=True),
}


def mix(hex_a, hex_b, t):
    a = [int(hex_a[i:i + 2], 16) for i in (1, 3, 5)]
    b = [int(hex_b[i:i + 2], 16) for i in (1, 3, 5)]
    return "#%02X%02X%02X" % tuple(round(x + (y - x) * t) for x, y in zip(a, b))


def from_bg(bg, accent, dark):
    fg = "#EDEDED" if dark else "#111111"
    return dict(bg=bg, fg=fg, muted=mix(bg, fg, 0.6), dim=mix(bg, fg, 0.38), border=mix(bg, fg, 0.14),
                surface=mix(bg, fg, 0.04), surface2=mix(bg, fg, 0.07), accent=accent, radius=14,
                fontSans="Geist", fontMono="Geist Mono", backdrop="glow", motion="calm", dark=dark)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--preset", default="mono", choices=["mono", "brand", "playful", "bold", "custom"])
    ap.add_argument("--captures")
    ap.add_argument("--bg")
    ap.add_argument("--accent")
    ap.add_argument("--font")
    ap.add_argument("--mono-font")
    ap.add_argument("--out", default=".video/theme.json")
    a = ap.parse_args()

    if a.preset in PRESETS:
        t = dict(PRESETS[a.preset])
    elif a.preset == "brand":
        sys.path.insert(0, str(Path(__file__).parent))
        from brand_colors import palette  # noqa
        p = palette(a.captures or ".video/captures")
        # brand videos stay dark by default (reads better on video); use brand colour as accent
        bg = a.bg or ("#000000" if not p["is_dark"] else p["bg"])
        t = from_bg(bg, a.accent or p["primary"] or "#FFFFFF", True)
        t["brand"] = p
    else:
        if not a.bg:
            ap.error("--preset custom needs --bg")
        r, g, b = (int(a.bg[i:i + 2], 16) for i in (1, 3, 5))
        t = from_bg(a.bg, a.accent or "#FFFFFF", (0.299 * r + 0.587 * g + 0.114 * b) < 128)
    if a.font:
        t["fontSans"] = a.font
    if a.mono_font:
        t["fontMono"] = a.mono_font
    t["preset"] = a.preset
    t["syntax"] = SYNTAX_DARK if t["dark"] else SYNTAX_LIGHT
    Path(a.out).parent.mkdir(parents=True, exist_ok=True)
    Path(a.out).write_text(json.dumps(t, indent=2))
    print(json.dumps(t, indent=2))


if __name__ == "__main__":
    main()
