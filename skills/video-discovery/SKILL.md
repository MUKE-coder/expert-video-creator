---
name: video-discovery
description: >-
  Interviews the user once, with the ask tool and real options, and writes the
  video brief: the idea, audience, goal, length, format (vertical or
  horizontal), style, story structure, music, voice, call to action, links,
  login needs and must-show items. Pre-reads every link given. Use for "I want
  a video", "plan a video", "help me think through a video idea", or as the
  first step of expert-video-creator.
---

# video-discovery

You turn "make me a video about X" into a brief that the other eight experts
can build from without asking the user anything else. The best interview is
short: every question is one the user can answer with a click, and nothing is
asked that a link, the repo or the conversation already answers.

Write to `.video/brief.md` and `.video/sources.md` (format in
`../video-references/working-agreement.md`). If `brief.md` already exists,
read it, ask only about what is missing or what the user wants changed, and
append.

## Step 1: read before you ask

From the request and anything attached or linked, extract what you already
know: product name, links, repo, audience hints, length, platform ("for
TikTok" = 9:16). Then pre-read the links:

- Docs/landing pages: fetch them (web fetch). Note the tagline, what it is,
  who it is for, install/getting-started steps, key commands or features,
  brand colours/logo URL. Every fact you keep goes in `sources.md` with its URL.
- A repo: read the README (and `package.json`/`go.mod` etc.) via `git clone
  --depth 1` or the GitHub tool. If it is private and you cannot reach it,
  note it for app-tester; do not ask the user yet.
- A live app: just record the URL. app-tester does the browsing.

If a page will not load with fetch (a JS-only app), use `agent-browser`
(`agent-browser skills get core` first) or a browser tool to read it.

## Step 2: the interview, in rounds

Use the ask tool. Up to four questions per round, each with 2–4 concrete
options, the recommended one first and marked "(Recommended)". Skip any
question whose answer you already have, and say what you assumed in the
question text ("You said TikTok, so vertical 9:16: keep that?").

**If the idea itself is missing or vague**, ask for it first in plain words
(it cannot be a multiple choice): "In one or two sentences: what should
someone know or do after watching?" If the answer is still fuzzy, run the
`grill-me` skill (or `grilling`) for a few questions to sharpen it, then
continue.

**Round 1: the video**
1. Type: product demo · explainer · feature launch · tutorial · promo ·
   social short.
2. Length: 15 s · 30 s · 60 s · 90–120 s (recommend 60 s for demos, 30 s for
   social; warn that under 20 s fits about 3 ideas).
3. Format: horizontal 16:9 · vertical 9:16 · square 1:1 · 4:5 (and "both
   16:9 + 9:16" as an option: the editor re-lays out, it does not crop).
4. Audience: complete beginners · developers who know the stack · customers /
   non-technical · investors / stakeholders.

**Round 2: the material**
1. What should we show? multiSelect: a live web app (I'll browse it) · a
   GitHub repo · docs / website · just the idea (no product UI).
2. Does the app need a login? No · Yes, I'll give a **demo** account · Yes,
   but I'll sign in myself in the browser. (Never ask for credentials in
   this question; app-tester collects them safely.)
3. Story structure: Q&A (best for beginners) · problem → solution ·
   step-by-step walkthrough · feature tour.
4. Must-show items: offer 3–4 candidates you found while pre-reading (e.g.
   "install command", "the admin panel", "generate command"), multiSelect.

**Round 3: look and sound**
1. Style: show the presets from `../video-references/style-presets.md` as
   options with a one-line description each; "brand" pulls colours from the
   product; Other = custom.
2. Background music: generate original (lo-fi / ambient · upbeat · cinematic)
   · I'll upload a track · no music.
3. Voice: on-screen captions only (Recommended without a key) · AI voiceover
   (needs an ElevenLabs or OpenAI key) · I'll record my own · none.
4. Call to action / end card: offer the site URL, "Star on GitHub", a docs
   link, or Other.

Ask one more round only if something blocks building (e.g. a brand logo
file, a release date that must not be shown, a language other than English).

## Step 3: capabilities check

If the brief needs something this pack does not do (maps, 3D, Lottie, screen
recordings of a desktop app, a specific language voice), use `find-skills`
(`npx skills find <query>`) to look for a skill, and add the result to the
brief under `extra_skills:`. Remotion's own skills cover maps
(`remotion-maps`) and media (`remotion-multimedia`).

## Step 4: write and confirm

Write `brief.md` (frontmatter + the user's story in their words) and
`sources.md`. Then show the user a six-line summary and ask, with the ask
tool, "Build from this brief?" with options: Yes · Change something. That is
the director's first gate.

Never put passwords, API keys or tokens in the brief; write `login: provided`
and let app-tester handle the secret.
