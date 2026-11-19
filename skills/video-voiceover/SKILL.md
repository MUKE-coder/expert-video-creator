---
name: video-voiceover
description: >-
  Writes the narration script from the storyboard, records it with the user's
  own ElevenLabs or OpenAI key (or syncs the user's recorded audio), measures
  every line, and produces timed captions (captions.json for the editor plus
  an SRT). Without a key it produces captions only, never a robotic voice.
  Use for "add a voiceover", "narrate this", "add captions / subtitles",
  "make it work with sound off", or as part of expert-video-creator.
---

# video-voiceover

Narration should say what the screen cannot, in the time the scene allows.
If it reads out the on-screen text word for word, cut it.

Read `.video/brief.md` (`voice`), `.video/storyboard.md` (vo lines, scene
lengths). Write `.video/vo_script.json`, `.video/audio/vo/*`,
`.video/audio/vo.json`, `.video/captions.json`, `.video/out/captions.srt`.

## Step 1: the script

Collect each scene's `vo:` line. Check it against the scene: ≤ 2.5 words
per second of scene, starts ≥ 0.5 s after the scene starts, ends ≥ 0.5 s
before it ends. Commands are said the way people say them ("grit new contact
app"), not spelled out. Write `vo_script.json`:

```json
{"fps": 30, "lines": [{"scene": 1, "text": "Grit is a full-stack framework for Go and React.", "start_frame": 24}]}
```

`start_frame` is the scene's global start frame (from
`.video/project/timing.json` once the editor has it; otherwise computed
from the storyboard minus transition overlaps) plus the offset you want.

## Step 2: the voice, by `brief.voice`

- **`tts:elevenlabs` / `tts:openai`**: the user puts their key in the
  environment (`export ELEVENLABS_API_KEY=…` or `OPENAI_API_KEY`, or
  `.video/.env`); never paste it into chat or files that get committed.
  ```bash
  python3 scripts/tts.py .video/vo_script.json --out .video/audio [--voice <id or name>]
  ```
  Exit code 3 means no key or the provider is unreachable (common in
  sandboxed cloud sessions): tell the user in one line and fall back to
  captions-only. Offer a voice choice with the ask tool only if the user
  cares (2–3 named voices).
- **`user-audio:<path>`**: one file for the whole video or one per scene.
  Measure with `ffprobe`; if one file, split on silences
  (`silencedetect=n=-35dB:d=0.4`) and map pieces to scenes. Word timings: use
  the `remotion-captions` skill (Whisper via `@remotion/install-whisper-cpp`)
  if it can run; otherwise estimate.
- **`captions-only`**: no audio. Captions carry the narration for sound-off
  viewing. Skip a scene's caption when its on-screen copy already says the
  same thing (Q&A headlines usually do).
- **`none`**: stop here.

## Step 3: fit check

If a recorded line is longer than its slot, shorten the text and re-record
that line only, or ask the editor to extend the scene (and tell the
storyboard). Never speed audio up past 1.1×.

## Step 4: captions

```bash
python3 scripts/make_captions.py --vo .video/audio/vo.json --out .video        # with voice
python3 scripts/make_captions.py --script .video/vo_script.json --out .video   # captions-only
```

Pages hold ≤ 6 words / 42 characters. The editor's `<Captions>` component
renders them in the bottom safe area (above platform UI in 9:16) and
highlights the current word. Then hand `vo.json` to `video-sound` so music
ducks under the voice.
