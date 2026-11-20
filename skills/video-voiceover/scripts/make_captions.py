#!/usr/bin/env python3
"""Build caption pages (captions.json for the editor + captions.srt) from voiceover timings or a script.

Usage:
  python3 make_captions.py --vo .video/audio/vo.json --out .video        # timed from real/estimated word timings
  python3 make_captions.py --script .video/vo_script.json --out .video   # captions-only: timed by reading speed

Pages: max 6 words / 42 chars, broken at punctuation when possible.
captions.json uses the @remotion/captions Caption shape (text, startMs, endMs, timestampMs, confidence),
one entry per word, plus a "pages" list the template's <Captions> component renders.
"""
import argparse
import json
from pathlib import Path

MAX_WORDS, MAX_CHARS = 6, 42


def paginate(words):
    pages, cur = [], []
    for w in words:
        # never let one page span a pause (separate lines / scenes)
        if cur and w["startMs"] - cur[-1]["endMs"] > 700:
            pages.append(cur)
            cur = []
        cand = cur + [w]
        text = " ".join(x["text"] for x in cand)
        if cur and (len(cand) > MAX_WORDS or len(text) > MAX_CHARS):
            pages.append(cur)
            cur = [w]
        else:
            cur = cand
        if w["text"][-1:] in ".?!:" and len(cur) >= 2:
            pages.append(cur)
            cur = []
    if cur:
        pages.append(cur)
    # no orphans: fold a 1–2 word page into the page before it when they belong to the same line
    merged = []
    for pg in pages:
        prev = merged[-1] if merged else None
        if prev and len(pg) <= 2 and pg[0]["startMs"] - prev[-1]["endMs"] <= 700 \
                and len(" ".join(x["text"] for x in prev + pg)) <= MAX_CHARS + 12:
            prev.extend(pg)
        else:
            merged.append(pg)
    pages = merged
    return [{"text": " ".join(w["text"] for w in p), "startMs": p[0]["startMs"], "endMs": p[-1]["endMs"],
             "words": [{"text": w["text"], "startMs": w["startMs"], "endMs": w["endMs"]} for w in p]} for p in pages]


def srt_time(ms):
    h, ms = divmod(int(ms), 3600000)
    m, ms = divmod(ms, 60000)
    s, ms = divmod(ms, 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--vo")
    ap.add_argument("--script")
    ap.add_argument("--wps", type=float, default=2.6, help="reading speed for captions-only timing")
    ap.add_argument("--out", default=".video")
    a = ap.parse_args()
    words = []
    if a.vo:
        vo = json.loads(Path(a.vo).read_text())
        fps = vo.get("fps", 30)
        for ln in vo["lines"]:
            base = ln["start_frame"] / fps * 1000
            for w in ln["words"]:
                words.append({"text": w["text"], "startMs": round(base + w["start"] * 1000), "endMs": round(base + w["end"] * 1000)})
    elif a.script:
        sc = json.loads(Path(a.script).read_text())
        fps = sc.get("fps", 30)
        for ln in sc["lines"]:
            t = ln["start_frame"] / fps * 1000
            for tok in ln["text"].split():
                d = 1000 / a.wps
                words.append({"text": tok, "startMs": round(t), "endMs": round(t + d * 0.9)})
                t += d
    else:
        ap.error("--vo or --script")
    pages = paginate(words)
    caps = [{"text": (" " if i else "") + w["text"], "startMs": w["startMs"], "endMs": w["endMs"],
             "timestampMs": w["startMs"], "confidence": 1} for i, w in enumerate(words)]
    out = Path(a.out)
    (out / "captions.json").write_text(json.dumps({"captions": caps, "pages": pages}, indent=2))
    blocks = []
    for i, p in enumerate(pages):
        end = p["endMs"] + 150
        if i + 1 < len(pages):
            end = min(end, pages[i + 1]["startMs"] - 1)
        blocks.append(f"{i + 1}\n{srt_time(p['startMs'])} --> {srt_time(end)}\n{p['text']}\n")
    srt = "\n".join(blocks)
    (out / "out").mkdir(exist_ok=True)
    (out / "out" / "captions.srt").write_text(srt)
    print(f"wrote {out}/captions.json ({len(pages)} pages) and out/captions.srt")


if __name__ == "__main__":
    main()
