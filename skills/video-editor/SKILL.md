---
name: video-editor
description: >-
  Designs, builds and renders the video in Remotion from the approved
  storyboard: sets up the data-driven template (Q&A scenes, macOS terminal with
  typed, syntax-highlighted commands, code editor, browser/phone screenshot
  frames with zoom-to-focus, user-flow, schema diagrams, bullets, cheatsheet,
  captions, outro), lays out for 16:9, 9:16, 1:1 or 4:5, checks stills,
  applies the critic's fixes, renders draft and final, muxes the audio mix
  and writes the deliverables. Use for "build the video", "edit the video",
  "render", "make a vertical version", "change scene 3", or inside
  expert-video-creator.
---

# video-editor

You turn the storyboard into frames. The template already contains the
scene kinds that worked on real demo videos; most videos are a `video.json`
plus, at most, one or two custom scenes. Your craft is in the timing, the
layout and looking at every busy frame before anyone waits for a render.

Read: `.video/storyboard.md`, `.video/brief.md`, `.video/theme.json`,
`.video/captures/manifest.json`, `.video/assets/assets.json`,
`.video/captions.json`, `.video/reviews/*`.
Rules: `../video-references/design-rules.md`, `formats.md`,
`scene-patterns.md`. Also load `remotion-best-practices` (and
`remotion-markup`) if installed; this template already follows them
(frame-driven animation, no CSS transitions, `staticFile` assets,
`TransitionSeries`).

## Step 1: set up the project

```bash
bash scripts/new_project.sh .video      # copies template → .video/project, npm install, syncs assets
bash scripts/sync.sh .video             # re-run after captures/assets/theme/captions change
```

Remotion needs a Chrome: the scripts pass a local Chrome if there is one
(`chrome.sh`), otherwise Remotion downloads its own headless shell. Fonts are
local (Geist from npm), so renders never need the network.

## Step 2: write `src/video.json`

```json
{"width": 1920, "height": 1080, "fps": 30, "transitionFrames": 12, "captions": false,
 "scenes": [
  {"kind": "question", "duration": 7, "n": 1, "question": "What is Grit?",
   "answer": "A full-stack framework for Go & React.", "highlight": "Go & React",
   "sub": "Describe your data once. Grit builds the API, types and admin panel.",
   "chips": ["Go", "React", "PostgreSQL"]},
  {"kind": "terminal", "duration": 12, "n": 3, "question": "How do I get started?", "window": "contact-app — zsh",
   "steps": [{"cmd": "grit new contact-app"}, {"cmd": "cd contact-app && pnpm install", "nextDir": "contact-app", "out": ["✓ dependencies installed"]}]},
  {"kind": "code", "duration": 6, "question": "What did it generate?", "file": "apps/api/internal/models/contact.go", "lang": "go", "code": "…", "highlight": [10, 11]},
  {"kind": "screenshot", "duration": 5, "question": "Does it run?", "capture": "01-dashboard", "focus": ".stats", "callout": "Live KPIs", "cursor": true},
  {"kind": "flow", "duration": 8, "title": "Create a contact", "steps": [{"capture": "02-list", "focus": 0, "label": "Open"}, {"capture": "03-form", "focus": "form", "label": "Fill", "callout": "Group dropdown"}]},
  {"kind": "schema", "duration": 7, "question": "Can we build something real?", "answer": "A Contact app with two tables.", "highlight": "Contact app",
   "tables": [{"name": "contacts", "fields": [["id", "uint"], ["group_id", "FK → groups", true]]}, {"name": "groups", "fields": [["id", "uint"], ["name", "string"]]}],
   "relations": [{"from": "contacts.group_id", "to": "groups.id", "label": "belongs_to"}]},
  {"kind": "bullets", "duration": 5, "title": "Why it matters", "items": ["One command", {"text": "Typed end to end", "icon": "shield-check"}]},
  {"kind": "cheatsheet", "duration": 4.5, "question": "What should I remember?", "rows": [{"cmd": "grit start", "note": "run everything"}]},
  {"kind": "outro", "duration": 3, "title": "grit", "tagline": "The full-stack framework for Go & React.", "url": "gritframework.dev"}
 ]}
```

Every scene accepts `transition` (`fade` default, `slide`, `none`). The
full prop list for each kind is in `scene-patterns.md`; the implementation is
`template/src/scenes/index.tsx`. Terminal output shorthand: `"✓ text"`,
`"+ path"`, `"! warning"`, `"✗ error"`, or plain text.

Then `cd .video/project && npm run timing` prints every scene's global start
frame and writes `timing.json`. Give it to `video-sound` and
`video-voiceover`; cue frames come from here.

**Custom scenes**, only when no kind fits: add a component in
`src/custom/`, register it in `src/custom/index.ts`, and use `{"kind":
"custom", "component": "Name", …}`. Build it from `components/ui.tsx`
(`Window`, `Question`, `Answer`, `FadeUp`, `Mark`, `Pill`, `Cursor`) and
`lib/anim.ts` (`tween`, `useEnter`, `useLayout`) so it matches the rest.

**Formats.** Change `width`/`height` only; every kind re-lays out
(`useLayout().vertical`): windows go full width, fonts step up, landscape
screenshots become a tall crop that pans to the focus. For "both 16:9 and
9:16", keep two json files and render each.

## Step 3: look before you render

```bash
bash scripts/stills.sh .video                 # each scene at 85% through, + stills/contact.jpg
bash scripts/stills.sh .video 140 420 610     # specific frames
```

Open `contact.jpg` and the busiest frames at full size (Read the PNGs).
Fix before going on: wrapped commands, overlapping blocks, empty bottoms,
text under the minimum sizes, anything cut off, a callout covering the thing
it points at. Then hand to `video-critic` (round 1).

## Step 4: draft, critic, final

```bash
bash scripts/render.sh draft .video    # half size, CRF 28, muxes audio/mix.wav if present → out/draft.mp4
bash scripts/render.sh final .video    # full size, CRF 17 → out/final.mp4 + out/poster.jpg
```

Apply each critic finding by changing `video.json` (or a custom scene), re-run
stills for the scenes you touched, then render. Sound changes never need a
re-render: `video-sound` remixes and you re-mux with `-c:v copy`.

## Step 5: deliverables

Write `.video/out/notes.md`: what is illustrative (summarised output,
mock-ups, sample data), sources, music/SFX licence ("original, generated
for this video"), fonts and icons, and the low-severity items left. Send
`final.mp4` (and `captions.srt` if made) to the user.

## Rules that save renders

- Animate from `useCurrentFrame()` only. No CSS transitions or
  `setTimeout`.
- Assets via `staticFile()` from `public/`; never hot-link remote images in
  a final render.
- Long commands: let the terminal wrap (it breaks after commas in
  `--fields` strings) or split them into two `steps`.
- Keep the template's look consistent: don't add new colours, use theme
  tokens (`T.fg`, `T.muted`, `T.syntax.*`).
- Low CPU: the render script uses every core; a 60 s 1080p video takes
  ~3–6 min on 2 cores. Draft first.
