# expert-video-creator

Ten Claude skills that turn an idea, a live web app or a GitHub repo into a
finished, rendered demo or explainer video: interviewed, captured, storyboarded,
built in [Remotion](https://remotion.dev), scored, reviewed and rendered to MP4.

A **director** runs nine experts in order and holds two approval gates (the
brief and the storyboard), so you are asked the right questions once and then
get a video, not a pile of files.

| Expert | What it does |
|---|---|
| `expert-video-creator` | The director. Runs everything below in the right order, holds the gates, delivers the file. **Start here.** |
| `video-discovery` | Interviews you with click-to-answer questions (idea, length, vertical/horizontal, audience, style, music, voice, links, login) and writes the brief. Pre-reads every link. |
| `video-app-tester` | Browses your live app (signs in with a **demo** account from environment variables, never chat), walks the happy path and saves sharp screenshots with element positions; or reads a GitHub repo (public directly, private after you connect GitHub) and can run it locally to capture it. |
| `video-storyboard` | Scene-by-scene plan with exact on-screen copy, timings that respect reading speed, sources for every fact, VO lines and sound cues. You approve it before anything is built. |
| `video-asset-builder` | Resolves the style into tokens (preset or colours pulled from your product), finds your logo, open-licence icons and tech logos, fonts, cleaned captures. Records every licence. |
| `video-voiceover` | Narration script, ElevenLabs/OpenAI TTS with **your** key, or your own recording; timed captions + SRT. No key: captions only. |
| `video-sound` | Original, generated background music (lo-fi, ambient, upbeat, cinematic, corporate) cut to the exact length, UI sound effects, ducking under the voice, mixed to −16 LUFS. Or your own track. |
| `video-editor` | Builds the video from a data-driven Remotion template: Q&A scenes, a macOS terminal with typed, syntax-highlighted commands, code editor, browser/phone frames that zoom to the element that matters, user-flow, schema diagrams, bullets, cheatsheet, captions, outro, in 16:9, 9:16, 1:1 or 4:5. Checks stills before rendering. |
| `video-critic` | Independent review with evidence: lints timings and density, looks at every busy frame, measures length/loudness/black/frozen frames, and checks every command and claim against its source. Two rounds max, then ship. |
| `video-references` | The shared rulebook: working agreement, design rules, style presets, formats, scene patterns. |

## Install

### Claude Code

```bash
npx skills add MUKE-coder/expert-video-creator -g -y
```

or, where `/plugin` is available:

```
/plugin marketplace add MUKE-coder/expert-video-creator
/plugin install expert-video-creator@expert-video-creator
```

Start a new session so the skills load. Requirements: Node 18+, ffmpeg,
Python 3 (numpy, scipy, pillow, playwright; the director installs what is
missing). Remotion downloads its own headless Chrome if you do not have one.

Optional skills the experts use when present (the director installs them):
`agent-browser`, `find-skills`, `grill-me`, `remotion-best-practices`,
`remotion-markup`, `remotion-captions`.

### Claude.ai (or any session without the skills installed)

Paste the repo link and say what you want:

```
https://github.com/MUKE-coder/expert-video-creator
Use this to make a 60-second demo video of https://my-app.example.com
```

Claude clones the pack and follows the director from disk. To install it
permanently in Claude.ai, run `bash scripts/package-claude-ai.sh` and
upload the zips from `dist/` under Settings → Capabilities → Skills.

## Use

```
/expert-video-creator make a 60s beginner demo of https://gritframework.dev
/expert-video-creator turn github.com/me/my-saas into a 30s vertical promo
/expert-video-creator demo video of my app (it needs a login)
```

Or call an expert directly:

```
/video-critic review out/final.mp4
/video-sound add upbeat music to this video
/video-editor make a 9:16 version
```

Everything the experts produce lives in `.video/` in your working folder, so
any step can be re-run alone and a new session can pick up where the last one
stopped. The final video, poster, captions and a `notes.md` (what is
illustrative, sources, licences) land in `.video/out/`.

## What makes it different

- **It asks once, then builds.** Two gates (brief and storyboard), click-to-
  answer questions, sensible defaults when you are away.
- **It shows the real product.** Captures come from your app or repo, with
  element positions so the camera zooms to what matters, and private data
  blurred.
- **Truth on screen.** Commands, code and claims are copied from a source and
  checked by the critic; anything illustrative is listed in `notes.md`.
- **Readable by design.** Minimum sizes, reading-time budgets, one idea per
  screen, verified on stills before any render.
- **Free to publish.** Music and sound effects are generated, icons are open-
  licence, fonts are OFL.

## Credentials and privacy

Demo logins and API keys go in environment variables (`EVC_LOGIN_EMAIL`,
`EVC_LOGIN_PASSWORD`, `ELEVENLABS_API_KEY`, `OPENAI_API_KEY`) or a
git-ignored `.video/.env`, never in chat, files or the video. Use a demo
account, not a production admin.

## Licence

MIT. Generated music and SFX are yours to use anywhere.
