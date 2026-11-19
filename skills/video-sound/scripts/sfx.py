#!/usr/bin/env python3
"""Synthesise the small UI sound effects demo videos use. All original, free to use.

Usage: python3 sfx.py --out .video/audio/sfx
Writes: whoosh.wav pop.wav ding.wav click.wav type.wav (one key) typing-1s.wav (a burst)
"""
import argparse
from pathlib import Path

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt

SR = 44100
rng = np.random.default_rng(3)


def bp(x, lo, hi):
    return sosfilt(butter(2, [lo, hi], "band", fs=SR, output="sos"), x)


def env(n, a, d):
    t = np.arange(n) / SR
    return np.minimum(1, t / max(a, 1e-4)) * np.exp(-t * d)


def write(out, name, x, gain=0.8):
    x = x / (np.max(np.abs(x)) + 1e-9) * gain
    wavfile.write(out / name, SR, (x * 32767).astype(np.int16))
    print("  ✓", name)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default=".video/audio/sfx")
    out = Path(ap.parse_args().out)
    out.mkdir(parents=True, exist_ok=True)

    # whoosh: filtered noise with a sweeping band and a swell
    n = int(0.6 * SR); t = np.arange(n) / SR
    noise = rng.standard_normal(n)
    sweep = np.zeros(n)
    for i, (lo, hi) in enumerate(np.linspace([300, 900], [2500, 6000], 12)):
        seg = slice(i * n // 12, (i + 1) * n // 12)
        sweep[seg] = bp(noise, lo, hi)[seg]
    write(out, "whoosh.wav", sweep * np.sin(np.pi * t / t[-1]) ** 2, 0.5)

    # pop: short pitched blip
    n = int(0.12 * SR); t = np.arange(n) / SR
    f = 900 * np.exp(-t * 18) + 300
    write(out, "pop.wav", np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.002, 40), 0.6)

    # ding: two soft bell partials
    n = int(1.2 * SR); t = np.arange(n) / SR
    bell = np.sin(2 * np.pi * 1318.5 * t) + 0.5 * np.sin(2 * np.pi * 1975.5 * t) + 0.2 * np.sin(2 * np.pi * 2637 * t)
    write(out, "ding.wav", bell * env(n, 0.003, 4.5), 0.45)

    # click: UI click
    n = int(0.03 * SR)
    write(out, "click.wav", bp(rng.standard_normal(n), 1500, 6000) * env(n, 0.0005, 260), 0.6)

    # one keystroke + a 1 s typing burst (randomised spacing / pitch)
    def key():
        n = int(0.05 * SR)
        k = bp(rng.standard_normal(n), 1800 + rng.uniform(-400, 400), 7000) * env(n, 0.0005, 180)
        thock = np.sin(2 * np.pi * 180 * np.arange(n) / SR) * env(n, 0.001, 120) * 0.4
        return k + thock
    write(out, "type.wav", key(), 0.5)
    burst = np.zeros(SR)
    at = 0.0
    while at < 0.95:
        k = key(); i = int(at * SR)
        burst[i:i + len(k)] += k[: SR - i] * rng.uniform(0.6, 1.0)
        at += rng.uniform(0.045, 0.11)
    write(out, "typing-1s.wav", burst, 0.45)


if __name__ == "__main__":
    main()
