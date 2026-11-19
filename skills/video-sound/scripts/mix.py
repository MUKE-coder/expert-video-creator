#!/usr/bin/env python3
"""Mix music + SFX cues + voiceover into one loudness-normalised track.

Usage:
  python3 mix.py --duration 60 --fps 30 --music .video/audio/music.wav \
      --cues .video/audio/cues.json [--vo .video/audio/vo.json] --out .video/audio/mix.wav [--target -16]

cues.json: [{"frame": 120, "file": "sfx/whoosh.wav", "gain_db": -12}, {"frame": 200, "file": "sfx/typing-1s.wav", "gain_db": -18, "dur_s": 0.8}]
vo.json:   {"lines": [{"scene": 1, "file": "vo/01.mp3", "start_frame": 20, "duration_s": 3.2}, ...]}
Paths in cues/vo are relative to the json file. Music is ducked ~9 dB under the voice.
"""
import argparse
import json
import subprocess
import tempfile
from pathlib import Path


def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode:
        raise SystemExit(r.stderr[-2000:])


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--duration", type=float, required=True)
    ap.add_argument("--fps", type=float, default=30)
    ap.add_argument("--music")
    ap.add_argument("--music-db", type=float, default=-20, help="target LUFS of the bed before mixing")
    ap.add_argument("--cues")
    ap.add_argument("--vo")
    ap.add_argument("--target", type=float, default=-16)
    ap.add_argument("--out", default=".video/audio/mix.wav")
    a = ap.parse_args()

    inputs, chains, labels = [], [], []
    tmp = Path(tempfile.mkdtemp())

    count = [1]  # input 0 is the silent base

    def add(path, filt, label):
        inputs.extend(["-i", str(path)])
        idx = count[0]
        count[0] += 1
        chains.append(f"[{idx}:a]{filt}[{label}]")
        return label

    # silent base so the length is exact
    inputs.extend(["-f", "lavfi", "-t", str(a.duration), "-i", "anullsrc=r=48000:cl=stereo"])
    chains.append("[0:a]anull[base]")

    vo_labels = []
    if a.vo:
        vj = Path(a.vo)
        for i, ln in enumerate(json.loads(vj.read_text())["lines"]):
            ms = int(ln["start_frame"] / a.fps * 1000)
            vo_labels.append(add(vj.parent / ln["file"], f"aresample=48000,aformat=channel_layouts=stereo,adelay={ms}|{ms},apad", f"vo{i}"))

    sfx_labels = []
    if a.cues:
        cj = Path(a.cues)
        for i, c in enumerate(json.loads(cj.read_text())):
            ms = int(c["frame"] / a.fps * 1000)
            trim = f"atrim=0:{c['dur_s']}," if c.get("dur_s") else ""
            sfx_labels.append(add(cj.parent / c["file"], f"{trim}aresample=48000,aformat=channel_layouts=stereo,volume={c.get('gain_db', -12)}dB,adelay={ms}|{ms},apad", f"sfx{i}"))

    music_label = None
    if a.music:
        norm = tmp / "music_norm.wav"
        run(["ffmpeg", "-v", "error", "-y", "-i", a.music, "-af", f"loudnorm=I={a.music_db}:TP=-3:LRA=11", "-ar", "48000", str(norm)])
        music_label = add(norm, "aformat=channel_layouts=stereo,apad", "mus")

    graph = list(chains)
    fg = []
    if vo_labels:
        graph.append("".join(f"[{l}]" for l in vo_labels) + f"amix=inputs={len(vo_labels)}:normalize=0,asplit=2[vo][vokey]")
    if music_label and vo_labels:
        graph.append(f"[{music_label}][vokey]sidechaincompress=threshold=0.03:ratio=6:attack=20:release=400[musd]")
        fg.append("[musd]")
    elif music_label:
        fg.append(f"[{music_label}]")
    if vo_labels:
        fg.append("[vo]")
    fg += [f"[{l}]" for l in sfx_labels]
    fg.insert(0, "[base]")
    graph.append("".join(fg) + f"amix=inputs={len(fg)}:normalize=0:duration=first,atrim=0:{a.duration},"
                 f"loudnorm=I={a.target}:TP=-1.5:LRA=11[out]")

    run(["ffmpeg", "-v", "error", "-y", *inputs, "-filter_complex", ";".join(graph), "-map", "[out]",
         "-ar", "48000", "-ac", "2", a.out])
    print(f"wrote {a.out}  (target {a.target} LUFS; {len(vo_labels)} VO lines, {len(sfx_labels)} SFX cues)")


if __name__ == "__main__":
    main()
