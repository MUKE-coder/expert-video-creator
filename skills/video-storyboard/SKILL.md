---
name: video-storyboard
description: >-
  Turns the brief, product notes and captures into a scene-by-scene plan: the
  story structure, each scene's length, exact on-screen copy, the visual
  (scene kind and capture/asset), voiceover line and sound cue, timed to the
  target length, then gets the user's approval. Use for "storyboard this",
  "plan the scenes", "write the script", "what goes in the video", or as the
  step before any building in expert-video-creator.
---

# video-storyboard

You decide what the viewer sees, in what order, for how long, and in what
words. Everyone after you builds exactly this, so it has to be specific
enough that the editor never has to invent copy and the critic can check
the video against it.

Read: `.video/brief.md`, `.video/sources.md`, `.video/product.md`,
`.video/captures/manifest.json` (and look at the captures).
Rules: `../video-references/design-rules.md`,
`../video-references/scene-patterns.md`.
Write: `.video/storyboard.md`.

## Step 1: pick the spine

Use the brief's `structure` (scene-patterns lists the four). Write the
**one sentence** the video exists to say, and the single action the viewer
should take at the end (the CTA). Every scene must serve one of those two; cut
the ones that do not.

## Step 2: budget the time

`length_s × fps` frames. Each transition overlaps ~12 frames, so the sum of
scene lengths is `total + (scenes − 1) × 12`. Allocate with the reading-time
rule (1 s + 1 s per 3 words that must be read, after the text is fully in);
beginner audiences get the slow end. If the copy does not fit, cut copy or
cut a scene, never speed up reading.

Rough capacity: 10 s ≈ 3 scenes, 30 s ≈ 5, 60 s ≈ 8–10, 120 s ≈ 14–18.

## Step 3: write each scene

For every scene, decide:

- **kind** from the template (`question`, `terminal`, `code`, `screenshot`,
  `flow`, `schema`, `bullets`, `cheatsheet`, `title`, `outro`). A new kind
  only if none fits; say why.
- **on-screen copy**, word for word. Headlines ≤ 8 words, sub-lines ≤ 14.
  Plain words for beginners: "builds the API for you", not "scaffolds CRUD
  endpoints".
- **source** of every factual element: a capture id, a `sources.md` URL, or
  a repo path. Commands and code are copied exactly from the source.
- **visual focus**: for screenshots, which `focus` box to zoom to and the one
  callout label.
- **voiceover line** (if `voice` is not none/captions-only, or captions
  wanted): ≤ 2.5 words per second of scene.
- **sound cue**: `whoosh` on a scene change, `type` under typing, `pop` on
  chips/cards, `ding` on success. Sparing: most scenes have none.

## Step 4: write `storyboard.md`

```markdown
# Storyboard: <title>  (60 s · 16:9 · mono · q-and-a)
Spine: <one sentence>   CTA: <action + url>

| # | kind | sec | on screen | source |
|---|------|-----|-----------|--------|
| 1 | question | 7.0 | Q1 What is Grit? → A full-stack framework for Go & React. | gritframework.dev |
| … |

## Scene 1: question (7.0 s)
copy: {n: 1, question: "What is Grit?", answer: "A full-stack framework for Go & React.", highlight: "Go & React", sub: "…", chips: [Go, Gin, …]}
vo: "Grit is a full-stack framework for Go and React."
sfx: none
notes: hold answer ≥ 3 s

## Scene 3: terminal (12.0 s)
lines:
  - {cmd: "curl -fsSL https://gritframework.dev/install.sh | sh", dir: "~"}
  - {cmd: "grit new contact-app", dir: "~", out: ["✓ Go API · Next.js web · admin panel"]}
illustrative: the ✓ lines summarise output (say so in notes.md)
```

Mark anything illustrative (summarised output, mock data, a mocked-up UI)
with `illustrative:` so the editor can list it in `notes.md`.

## Step 5: the gate

Show the user the table only (scene, seconds, on screen) and ask with the
ask tool: "Build this storyboard?" · "Change something" · "Shorter / longer".
Apply changes and re-ask once; then proceed.
