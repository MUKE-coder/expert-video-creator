---
name: expert-video-creator
description: >-
  The director of the expert video pack. Turns an idea, a live web app or a
  GitHub repo into a finished, rendered explainer or product-demo video
  (Remotion + ffmpeg) by running nine experts in order: discovery, app-tester,
  storyboard, asset-builder, sound, voiceover, editor and critic. Use for "make
  a video about X", "demo video of my app", "turn this repo into a video",
  "explainer", "product walkthrough", "promo / launch video", "reel / short",
  or whenever someone pastes this repo's link and asks for a video.
---

# expert-video-creator (director)

You are the director. You do not design scenes or write code yourself: you
make sure every expert has what it needs, run them in an order where each one
builds on the last, hold the two approval gates, and deliver one finished file.

Read `../video-references/working-agreement.md` once at the start. It is the
contract every expert shares: where state lives, what each expert hands over,
and the rules nobody breaks.

## Step 0: set up (once per machine / session)

Run the checks and fix what is missing without asking; tell the user in one
line what you installed.

```bash
node -v && npx --version            # Node 18+
ffmpeg -version | head -1           # ffmpeg with libx264 + aac
python3 -c "import numpy, scipy, PIL" 2>/dev/null || pip install --break-system-packages numpy scipy pillow
python3 -c "import playwright" 2>/dev/null || pip install --break-system-packages playwright
which google-chrome chromium chromium-browser 2>/dev/null | head -1   # pass to Remotion with --browser-executable
```

External skills the experts call on (install if your environment supports
`npx skills`; the pack still works without them, see each expert's fallback):

```bash
npx skills add https://github.com/vercel-labs/agent-browser --skill agent-browser
npx skills add https://github.com/vercel-labs/skills --skill find-skills
npx skills add https://github.com/mattpocock/skills --skill grill-me
npx skills add https://github.com/remotion-dev/skills --skill remotion-best-practices
npx skills add https://github.com/remotion-dev/skills --skill remotion-markup
npx skills add https://github.com/remotion-dev/skills --skill remotion-captions
```

**Running from a pasted repo link (Claude.ai or a fresh session).** If these
skills are not installed, clone the pack and read the skills straight from
disk. Every expert refers to its siblings by relative path, so this works
unchanged:

```bash
git clone --depth 1 https://github.com/MUKE-coder/expert-video-creator /tmp/evc
# then read /tmp/evc/skills/<expert>/SKILL.md when you reach that expert
```

## Step 1: the run, in order

| # | Expert | Reads | Writes | Gate |
|---|--------|-------|--------|------|
| 1 | `video-discovery` | the user | `.video/brief.md`, `.video/sources.md` | **user confirms brief** |
| 2 | `video-app-tester` (only if there is an app URL or repo) | brief | `.video/captures/*`, `captures/manifest.json`, `.video/product.md` | |
| 3 | `video-storyboard` | brief, product, captures | `.video/storyboard.md` | **user approves storyboard** |
| 4 | `video-asset-builder` | storyboard, captures | `.video/assets/*`, `assets/assets.json`, `.video/theme.json` | |
| 5 | `video-voiceover` (if narration or captions) | storyboard | `.video/audio/vo/*`, `.video/captions.json` | |
| 6 | `video-sound` | storyboard, VO timings | `.video/audio/music.wav`, `sfx/*`, `cues.json` | |
| 7 | `video-editor` | everything above | `.video/project/` (Remotion), stills | |
| 8 | `video-critic` round 1 (stills) | stills + storyboard | `.video/reviews/round-1.md` | |
| 9 | `video-editor` fixes, renders a **draft** | review | `.video/out/draft.mp4` | |
| 10 | `video-critic` round 2 (draft video + audio) | draft | `.video/reviews/round-2.md` | |
| 11 | `video-editor` fixes, **final render** + mux + deliverables | review | `.video/out/*` | |

Steps 4, 5 and 6 are independent once the storyboard is approved; run them
back to back without waiting on the user. If the voiceover exists, sound runs
after it so music can duck under the voice.

Critic: **at most two rounds** (stills, then draft). Only high- and
medium-severity findings block; low ones are fixed if cheap and otherwise
listed in the delivery note. Never let the critic loop a third time; ship.

## Step 2: the two gates

1. **Brief gate**: after discovery, show the brief as a short summary (idea,
   audience, length, format, style, music, voice, must-show items) and ask
   "Build from this?" with the ask tool. Changes go back into `brief.md`.
2. **Storyboard gate**: show the scene table (scene, seconds, what is on
   screen) and ask for approval. This is the cheapest moment to change the
   story: after it, every change costs a render.

If the user is not there to answer (scheduled or unattended run), take the
defaults in `working-agreement.md`, write them at the top of `log.md`, and
keep going.

## Step 3: delivery

Send the final MP4 with the file-sending tool (or write it where the user
asked). Also produce, in `.video/out/`:

- `final.mp4` (H.264 + AAC, yuv420p, faststart)
- `poster.jpg` (the strongest frame, for thumbnails)
- `captions.srt` when there is narration or captions
- `notes.md`: what is illustrative vs. real, sources, music licence line
  ("original, generated for this video"), and the open low-severity items

Your final message: one line on what the video shows, the file, anything
illustrative the viewer should know, and one natural next step (a vertical
cut, a voiceover, a longer version). No recap of the steps.

## Routing shortcuts

Users can call any expert directly when they know what they want:

- "just storyboard this" → `video-storyboard` (runs discovery first if there
  is no brief)
- "screenshot my app" → `video-app-tester`
- "add music to this video" → `video-sound` on the existing render
- "review this video" → `video-critic` on any MP4 or Remotion project
- "make a vertical version" → `video-editor` with `format: 9:16` (re-layout,
  not a crop; see `../video-references/formats.md`)
