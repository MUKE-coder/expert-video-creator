---
name: video-sound
description: >-
  Scores the video: generates an original royalty-free background track for
  the exact length and mood (or uses the user's file), synthesises UI sound
  effects (whoosh, pop, ding, click, typing), places SFX cues on the
  storyboard's frames, ducks music under any voiceover and mixes everything to
  broadcast loudness. Use for "add background music", "add sound effects",
  "the music is too loud", "mix the audio", or as part of expert-video-creator.
---

# video-sound

Sound is what makes a silent screen recording feel produced, and it is the
easiest thing to overdo. Your job is a bed the viewer forgets is there and a
handful of cues that land exactly on the frame they belong to.

Read `.video/brief.md` (`music`, `length_s`, `fps`), `.video/storyboard.md`
(sfx cues), `.video/audio/vo.json` if voiceover exists.
Write `.video/audio/music.wav`, `sfx/*.wav`, `cues.json`, `mix.wav`.
Loudness targets: `../video-references/formats.md`.

## Step 1: music

- `music: file:<path>`: use it. Trim/loop to length with ffmpeg (`-stream_loop
  -1 -t <len>`), fade in 1.5 s and out 3 s, and note in `notes.md` that the
  licence is the user's responsibility.
- `music: generate:<mood>`: make it for the exact duration, taken from the
  editor's `timing.json` (`total / fps`), not the brief's round number:
  ```bash
  python3 scripts/music.py --mood lofi --duration 60 --out .video/audio/music.wav
  ```
  Moods: `lofi` (dev tools, tutorials), `ambient` (calm explainers,
  narration-heavy), `upbeat` (launches, promos, social), `cinematic`
  (announcements), `corporate` (B2B). Change `--seed` or `--key` for a
  different track in the same mood. Drums drop out for the last two bars so
  the end card breathes.
- `music: none`: skip.

Listen-check without ears: render a spectrogram
(`ffmpeg -i music.wav -lavfi showspectrumpic=s=1200x300 spec.png`) and look:
the intro is quiet, the drums come in, nothing clips, the end fades.

## Step 2: SFX

```bash
python3 scripts/sfx.py --out .video/audio/sfx
```

Place cues from the storyboard in `cues.json` with frame numbers taken from
the editor's scene start frames (ask the editor for `.video/project/timing.json`
if it exists, or compute from the storyboard durations minus transition
overlaps). Guidance:

| Cue | Where | Level |
|---|---|---|
| whoosh | scene changes that move (not every fade) | −14 dB |
| typing-1s | under terminal typing, trimmed to the typing length | −20 dB |
| pop | chips/cards appearing (first of a group only) | −16 dB |
| ding | a success moment ("it runs!") | −14 dB |
| click | a cursor click in a flow scene | −12 dB |

Fewer is better: 6–12 cues in a 60 s video.

## Step 3: mix

```bash
python3 scripts/mix.py --duration 60 --fps 30 \
  --music .video/audio/music.wav --cues .video/audio/cues.json \
  [--vo .video/audio/vo.json] --out .video/audio/mix.wav --target -16
```

Bed at −20 LUFS before mixing, voice ducks the music ~9 dB, final −16 LUFS
(−14 for social shorts), true peak −1.5 dBTP. Verify:

```bash
ffmpeg -i .video/audio/mix.wav -af ebur128 -f null - 2>&1 | grep -A2 Summary
```

The editor muxes `mix.wav` with `-c:v copy`; changing the sound never needs a
video re-render.
