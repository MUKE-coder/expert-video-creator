#!/usr/bin/env python3
"""Generate an original, royalty-free background track that fits a video's length.

Usage:
  python3 music.py --mood lofi --duration 60 --out .video/audio/music.wav [--bpm 96] [--seed 7] [--key A]
Moods: lofi | ambient | upbeat | cinematic | corporate
The track is written for the exact duration (fade in 1.5 s, fade out 3 s) and loudness-normalised
later by mix.py. Everything is synthesised here, so the result is free to use anywhere.
"""
import argparse

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt

SR = 44100
KEYS = {"C": 0, "C#": 1, "D": 2, "Eb": 3, "E": 4, "F": 5, "F#": 6, "G": 7, "Ab": 8, "A": 9, "Bb": 10, "B": 11}

# progressions as (root offset from key, chord intervals) in a minor-ish/major-ish frame, relative to key root (MIDI 57 = A3)
PROGS = {
    "minor": [(0, [0, 3, 7, 10, 14]), (-4, [0, 4, 7, 11, 16]), (3, [0, 4, 7, 11, 16]), (-2, [0, 4, 7, 9, 12])],  # i9 VImaj7 IIImaj7 VII6
    "major": [(0, [0, 4, 7, 11, 14]), (7, [0, 4, 7, 10, 14]), (9, [0, 3, 7, 10, 14]), (5, [0, 4, 7, 11, 14])],   # I V vi IV
}

MOODS = {
    #            bpm  prog     drums     pluck  pad  bass  bright
    "lofi":      (92, "minor", "lofi",   True,  0.55, 0.30, 1400),
    "ambient":   (70, "minor", None,     True,  0.70, 0.18, 1100),
    "upbeat":    (118, "major", "four",  True,  0.40, 0.34, 2600),
    "cinematic": (80, "minor", "toms",   False, 0.75, 0.30, 900),
    "corporate": (108, "major", "soft",  True,  0.45, 0.28, 2000),
}


def midi(m):
    return 440 * 2 ** ((m - 69) / 12)


def lp(x, fc):
    return sosfilt(butter(2, fc, "low", fs=SR, output="sos"), x)


def hp(x, fc):
    return sosfilt(butter(2, fc, "high", fs=SR, output="sos"), x)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--mood", default="lofi", choices=MOODS)
    ap.add_argument("--duration", type=float, required=True)
    ap.add_argument("--bpm", type=float)
    ap.add_argument("--key", default="A", choices=KEYS)
    ap.add_argument("--seed", type=int, default=7)
    ap.add_argument("--out", default=".video/audio/music.wav")
    a = ap.parse_args()

    bpm, prog_name, drums, use_pluck, pad_gain, bass_gain, bright = MOODS[a.mood]
    bpm = a.bpm or bpm
    dur = a.duration
    beat = 60 / bpm
    bar = beat * 4
    N = int(SR * dur)
    t = np.arange(N) / SR
    mix = np.zeros((N, 2))
    rng = np.random.default_rng(a.seed)
    base = 57 + (KEYS[a.key] - 9)  # A3 when key=A
    if prog_name == "major":
        base += 3  # relative major
    prog = PROGS[prog_name]

    def place(sig, start, gain=1.0, pan=0.0):
        i = int(start * SR)
        if i >= N:
            return
        sig = sig[: N - i]
        l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
        mix[i:i + len(sig), 0] += sig * gain * l
        mix[i:i + len(sig), 1] += sig * gain * r

    nbars = int(np.ceil(dur / bar))
    for b in range(nbars):
        root_off, ivs = prog[b % 4]
        chord = [base + root_off + i for i in ivs]
        start = b * bar
        L = int(bar * SR * 1.15)
        tt = np.arange(L) / SR
        env = np.minimum(1, tt / 0.6) * np.exp(-np.maximum(0, tt - bar) * 6)
        pad = np.zeros(L)
        for m in chord:
            for d in (-0.08, 0.0, 0.09):
                f = midi(m + d)
                pad += 2 * ((f * tt) % 1) - 1 + 0.6 * np.sin(2 * np.pi * f * tt)
        pad = lp(pad, bright) * env / 30
        place(pad, start, pad_gain, -0.25)
        place(pad, start + 0.012, pad_gain, 0.25)

        if b >= 1:  # bass
            steps = 8 if a.mood == "upbeat" else 2
            for s in range(steps):
                bl = int(beat * 4 / steps * SR)
                bt = np.arange(bl) / SR
                benv = np.minimum(1, bt / 0.01) * np.exp(-bt * (5 if steps == 8 else 1.8))
                bass = lp(np.sin(2 * np.pi * midi(base + root_off - 12) * bt) * benv, 300)
                place(bass, start + s * beat * 4 / steps, bass_gain)

        drums_on = drums and 2 <= b < nbars - 2
        if drums_on:
            def kick(at, g=0.5):
                kl = int(0.35 * SR); kt = np.arange(kl) / SR
                f = 45 + 80 * np.exp(-kt * 30)
                place(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-kt * 9), at, g)

            def noise(at, dur_s, hpf, decay, g, pan=0.0):
                n = int(dur_s * SR); nt = np.arange(n) / SR
                place(hp(rng.standard_normal(n), hpf) * np.exp(-nt * decay), at, g, pan)

            for k in range(4):
                at = start + k * beat
                if drums == "four":
                    kick(at, 0.55)
                    if k in (1, 3):
                        noise(at, 0.2, 1200, 25, 0.14)
                    noise(at + beat / 2, 0.05, 7000, 80, 0.06, 0.3)
                elif drums == "lofi":
                    if k in (0, 2):
                        kick(at)
                    if k in (1, 3):
                        noise(at + 0.01, 0.25, 1500, 22, 0.10)
                    for e in range(2):
                        noise(at + e * beat / 2 + (0.02 if e else 0), 0.06, 7000, 70, 0.05 if e else 0.025, 0.3)
                elif drums == "soft":
                    if k == 0:
                        kick(at, 0.4)
                    noise(at + beat / 2, 0.05, 8000, 90, 0.04, 0.3)
                elif drums == "toms" and k == 0:
                    tl = int(0.8 * SR); tt2 = np.arange(tl) / SR
                    place(np.sin(2 * np.pi * (70 + 30 * np.exp(-tt2 * 8)) * tt2) * np.exp(-tt2 * 4), at, 0.5)

        if use_pluck and 4 <= b < nbars - 1:
            pattern = [0, 2, 4, 2, 3, 4, 2, 1]
            for e, idx in enumerate(pattern):
                m = chord[idx] + 12
                pl = int(0.8 * SR); pt = np.arange(pl) / SR
                f = midi(m)
                pluck = (np.sin(2 * np.pi * f * pt) + 0.3 * np.sin(4 * np.pi * f * pt)) * np.exp(-pt * 6)
                place(lp(pluck, 3500), start + e * beat / 2, 0.07, 0.4 if e % 2 else -0.4)

    d = int(beat * 0.75 * SR)  # ping-pong space
    wet = np.zeros_like(mix)
    wet[d:] = mix[:-d] * 0.25
    mix = mix + wet[:, ::-1]
    mix *= (np.minimum(1, t / 1.5) * np.minimum(1, (dur - t) / 3.0))[:, None]
    mix /= np.max(np.abs(mix)) + 1e-9
    wavfile.write(a.out, SR, (mix * 0.85 * 32767).astype(np.int16))
    print(f"wrote {a.out}  ({a.mood}, {bpm:.0f} bpm, key {a.key}, {dur:.1f}s)")


if __name__ == "__main__":
    main()
