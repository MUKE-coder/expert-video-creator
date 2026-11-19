#!/usr/bin/env python3
"""Generate voiceover lines with ElevenLabs or OpenAI TTS, using the user's own API key.

Usage:
  python3 tts.py .video/vo_script.json --out .video/audio [--provider elevenlabs|openai] [--voice <id|name>]

vo_script.json: {"fps": 30, "lines": [{"scene": 1, "text": "Grit is a full-stack framework...", "start_frame": 24}, ...]}
Keys come from the environment only: ELEVENLABS_API_KEY or OPENAI_API_KEY (or .video/.env).
Writes audio/vo/NN.mp3 and audio/vo.json with real durations and word timings
(exact from ElevenLabs alignment; estimated by character share for OpenAI).
Exit code 3 = no key / provider unreachable: fall back to captions-only.
"""
import argparse
import base64
import json
import os
import re
import subprocess
import sys
import urllib.error
import urllib.request
from pathlib import Path


def load_env():
    f = Path(".video/.env")
    if f.exists():
        for line in f.read_text().splitlines():
            m = re.match(r"\s*([A-Z_]+)\s*=\s*'?\"?(.*?)'?\"?\s*$", line)
            if m and m.group(1) not in os.environ:
                os.environ[m.group(1)] = m.group(2)


def post(url, headers, body):
    req = urllib.request.Request(url, data=json.dumps(body).encode(), headers=headers, method="POST")
    with urllib.request.urlopen(req, timeout=120) as r:
        return r.read()


def duration(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)],
                         capture_output=True, text=True).stdout.strip()
    return float(out or 0)


def words_from_chars(chars, starts, ends):
    words, cur, ws = [], "", None
    for c, s, e in zip(chars, starts, ends):
        if c.isspace():
            if cur:
                words.append({"text": cur, "start": ws, "end": prev_e})
            cur, ws = "", None
        else:
            if ws is None:
                ws = s
            cur += c
            prev_e = e
    if cur:
        words.append({"text": cur, "start": ws, "end": prev_e})
    return words


def estimate_words(text, dur):
    toks = text.split()
    total = sum(len(t) + 1 for t in toks) or 1
    t, out = 0.05, []
    for tok in toks:
        d = (len(tok) + 1) / total * (dur - 0.1)
        out.append({"text": tok, "start": round(t, 3), "end": round(t + d * 0.92, 3)})
        t += d
    return out


def eleven(text, voice, key, out):
    voice = voice or "21m00Tcm4TlvDq8ikWAM"  # a stock ElevenLabs voice id; pass --voice to choose
    raw = post(f"https://api.elevenlabs.io/v1/text-to-speech/{voice}/with-timestamps",
               {"xi-api-key": key, "Content-Type": "application/json"},
               {"text": text, "model_id": "eleven_multilingual_v2",
                "voice_settings": {"stability": 0.5, "similarity_boost": 0.75}})
    j = json.loads(raw)
    out.write_bytes(base64.b64decode(j["audio_base64"]))
    al = j.get("alignment") or {}
    if al:
        return words_from_chars(al["characters"], al["character_start_times_seconds"], al["character_end_times_seconds"])
    return None


def openai(text, voice, key, out):
    audio = post("https://api.openai.com/v1/audio/speech",
                 {"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
                 {"model": "gpt-4o-mini-tts", "voice": voice or "alloy", "input": text, "response_format": "mp3",
                  "instructions": "Warm, clear developer-advocate tone. Natural pace."})
    out.write_bytes(audio)
    return None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("script")
    ap.add_argument("--out", default=".video/audio")
    ap.add_argument("--provider", choices=["elevenlabs", "openai"])
    ap.add_argument("--voice")
    a = ap.parse_args()
    load_env()
    prov = a.provider or ("elevenlabs" if os.environ.get("ELEVENLABS_API_KEY") else
                          "openai" if os.environ.get("OPENAI_API_KEY") else None)
    if not prov:
        print("NO_KEY: set ELEVENLABS_API_KEY or OPENAI_API_KEY, or use captions-only.")
        sys.exit(3)
    key = os.environ["ELEVENLABS_API_KEY" if prov == "elevenlabs" else "OPENAI_API_KEY"]
    sc = json.loads(Path(a.script).read_text())
    vo_dir = Path(a.out) / "vo"
    vo_dir.mkdir(parents=True, exist_ok=True)
    lines = []
    for i, ln in enumerate(sc["lines"], 1):
        f = vo_dir / f"{i:02d}.mp3"
        try:
            words = (eleven if prov == "elevenlabs" else openai)(ln["text"], a.voice, key, f)
        except (urllib.error.URLError, OSError) as e:
            print(f"UNREACHABLE: {prov} failed ({e}). Network may be blocked here; fall back to captions-only.")
            sys.exit(3)
        d = duration(f)
        lines.append({**ln, "file": f"vo/{f.name}", "duration_s": round(d, 3),
                      "words": words or estimate_words(ln["text"], d), "timing": "exact" if words else "estimated"})
        print(f"  ✓ {f.name}  {d:.2f}s  {ln['text'][:50]}")
    (Path(a.out) / "vo.json").write_text(json.dumps({"provider": prov, "fps": sc.get("fps", 30), "lines": lines}, indent=2))
    print(f"wrote {a.out}/vo.json")


if __name__ == "__main__":
    main()
