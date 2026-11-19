#!/usr/bin/env python3
"""Check a video.json against the pack's design rules before anything renders.

Usage: python3 lint_video.py .video/project/src/video.json [--brief .video/brief.md] [--audience beginner]
Prints findings as  SEVERITY  scene  message ; exit 1 if any HIGH.
"""
import argparse
import json
import re
import sys
from pathlib import Path

findings = []


def add(sev, scene, msg):
    findings.append((sev, scene, msg))


def words(s):
    return len(re.findall(r"\S+", s or ""))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("video")
    ap.add_argument("--brief")
    ap.add_argument("--audience", default="")
    a = ap.parse_args()
    v = json.loads(Path(a.video).read_text())
    W, H, fps = v.get("width", 1920), v.get("height", 1080), v.get("fps", 30)
    vertical = H > W * 1.2
    xf = v.get("transitionFrames", 12)
    scenes = v["scenes"]
    total = sum(round(s["duration"] * fps) for s in scenes) - xf * sum(1 for i, s in enumerate(scenes) if i and s.get("transition", "fade") != "none")
    beginner = "beginner" in a.audience.lower()
    target = None
    if a.brief and Path(a.brief).exists():
        b = Path(a.brief).read_text()
        m = re.search(r"length_s:\s*(\d+)", b)
        target = int(m.group(1)) if m else None
        beginner = beginner or bool(re.search(r"audience:.*beginner", b, re.I))
    if target and abs(total / fps - target) > max(1.0, target * 0.05):
        add("HIGH", "-", f"length {total / fps:.1f}s vs brief {target}s")
    slow = 1.25 if beginner else 1.0

    max_code = 45 if vertical else 100
    for i, s in enumerate(scenes, 1):
        k, d = s["kind"], s["duration"]
        read = []  # text the viewer must read in this scene
        if k == "question":
            read = [s.get("question", ""), s.get("answer", ""), s.get("sub", "")]
            if s.get("answer") and words(s["answer"]) > 10:
                add("MED", i, f"answer has {words(s['answer'])} words (≤ 8–10 reads in one glance)")
            if s.get("sub") and words(s["sub"]) > 14:
                add("MED", i, f"sub-line has {words(s['sub'])} words (≤ 14)")
            if s.get("highlight") and s["highlight"] not in s.get("answer", ""):
                add("HIGH", i, f"highlight '{s['highlight']}' is not in the answer text")
            hold = d - (s.get("liftAt", 30) + 12 + 16) / fps
            need = (1 + words(s.get("answer", "")) / 3 + words(s.get("sub", "")) / 3) * slow
            if hold < need:
                add("HIGH", i, f"answer visible {hold:.1f}s but needs ~{need:.1f}s to read")
        elif k == "terminal":
            steps = s.get("steps", [])
            if len(steps) > (5 if vertical else 7):
                add("MED", i, f"{len(steps)} commands in one terminal; split the scene")
            t = (50 if s.get("question") else 24)
            for st in steps:
                cps = st.get("cps") or (4 if len(st["cmd"]) > 70 else 3 if len(st["cmd"]) > 40 else 2.5)
                t += len(st["cmd"]) / cps + 8 + len(st.get("out", [])) * 4 + 14
                if len(st["cmd"]) > (40 if vertical else 110) and "--fields" not in st["cmd"]:
                    add("LOW", i, f"long command ({len(st['cmd'])} chars) will wrap: '{st['cmd'][:40]}…'")
            if t / fps + 1.0 * slow > d:
                add("HIGH", i, f"typing ends at {t / fps:.1f}s; scene is {d}s (needs ≥ 1s hold after)")
        elif k == "code":
            lines = str(s.get("code", "")).split("\n")
            longest = max(len(l.replace("\t", "    ")) for l in lines)
            if longest > max_code:
                add("MED", i, f"longest code line {longest} chars (> {max_code}); font will shrink below the minimum")
            if len(lines) > (18 if not vertical else 22):
                add("MED", i, f"{len(lines)} code lines; show the excerpt that matters")
            if d < 4 + len(lines) * 0.15:
                add("MED", i, f"{d}s may be short for {len(lines)} lines of code")
        elif k in ("screenshot", "flow"):
            caps = [s.get("capture")] if k == "screenshot" else [x.get("capture") for x in s.get("steps", [])]
            mf = Path(a.video).parent / "data" / "manifest.json"
            known = {m["id"] for m in json.loads(mf.read_text())} if mf.exists() else set()
            for c in caps:
                if c and known and c not in known and not c.endswith((".jpg", ".png")):
                    add("HIGH", i, f"capture '{c}' not in manifest.json")
            if k == "flow" and d / max(1, len(s.get("steps", []))) < 2.5:
                add("MED", i, "flow steps shorter than 2.5 s each")
            if k == "screenshot" and d < 4:
                add("MED", i, "screenshot scenes need ≥ 4 s (zoom + callout + read)")
        elif k == "bullets":
            items = s.get("items", [])
            if len(items) > 4:
                add("MED", i, f"{len(items)} bullets (max 4)")
            read = [x if isinstance(x, str) else x.get("text", "") for x in items] + [s.get("title", "")]
        elif k == "cheatsheet":
            if len(s.get("rows", [])) > (6 if not vertical else 5):
                add("MED", i, "too many cheatsheet rows")
        if read and k != "question":
            need = (1 + sum(words(r) for r in read) / 3) * slow
            if d < need:
                add("HIGH", i, f"{d}s on screen but ~{need:.1f}s needed to read")
        if d > 16:
            add("LOW", i, f"{d}s is long for one scene; consider splitting")
        for key in ("question", "answer", "title"):
            if s.get(key) and re.search(r"lorem|TODO|TBD|xxx", s[key], re.I):
                add("HIGH", i, f"placeholder text in {key}")

    kinds = [s["kind"] for s in scenes]
    if kinds and kinds[-1] != "outro":
        add("LOW", "-", "no outro / CTA at the end")
    for j in range(2, len(kinds)):
        if kinds[j] == kinds[j - 1] == kinds[j - 2] and kinds[j] != "question":
            add("LOW", j + 1, f"three '{kinds[j]}' scenes in a row; vary the rhythm")

    order = {"HIGH": 0, "MED": 1, "LOW": 2}
    print(f"video: {W}x{H} @ {fps} fps, {len(scenes)} scenes, {total / fps:.2f}s")
    for sev, sc, msg in sorted(findings, key=lambda f: order[f[0]]):
        print(f"{sev:5} scene {sc}: {msg}")
    if not findings:
        print("no findings")
    sys.exit(1 if any(f[0] == "HIGH" for f in findings) else 0)


if __name__ == "__main__":
    main()
