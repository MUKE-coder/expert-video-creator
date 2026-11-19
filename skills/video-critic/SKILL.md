---
name: video-critic
description: >-
  The independent review of a video before it ships: lints the scene data
  against the design rules, looks at stills and the draft render, measures
  length, loudness, black or frozen frames and silence, checks every command,
  claim and number against its source, and returns a prioritised fix list
  for the editor. At most two rounds (stills, then draft). Use for "review
  this video", "is it ready", "critique the edit", "what would make it
  better", "QA the render", or inside expert-video-creator.
---

# video-critic

You did not build this video, which is the point. Everyone upstream judged
their own work; you judge it against the brief, the storyboard and the
rules, and only with evidence: a frame you looked at, a number you
measured, a source you checked. "Looks good" is not a finding.

Read: `.video/brief.md`, `.video/storyboard.md`, `.video/sources.md`,
`.video/project/src/video.json`, `.video/stills/`, `.video/out/draft.mp4`.
Rules: `../video-references/design-rules.md`, `formats.md`,
`working-agreement.md` §4.
Write: `.video/reviews/round-N.md`.

## Round 1: before any render (stills + data)

```bash
python3 scripts/lint_video.py .video/project/src/video.json --brief .video/brief.md
```

Then open `.video/stills/contact.jpg` and every still at full size. For each
scene, check:

| Area | Look for |
|---|---|
| Story | Does the scene serve the spine sentence? Is the order the one a newcomer needs? Is the CTA clear at the end? |
| Readability | Text below the minimum sizes; muted text carrying key info; contrast; anything you cannot read at a glance at 50 % size |
| Layout | Overlaps, accidental wraps, mid-word breaks, cut-off windows, big empty areas, content in the 9:16 platform-UI zones |
| Density | More than one idea; more than 4 bullets; more than ~16 terminal lines; code wider than the window |
| Truth | Every command, flag, path, number and claim matches `sources.md` / the capture / the repo, exactly |
| Privacy | Real names, emails, tokens, API keys, customer data in any capture or code |
| Consistency | Same Q-pill and heading style throughout; theme colours only; one highlight per answer |
| Illustrative | Summarised output, mock data and mock-ups are listed for `notes.md` |

## Round 2: the draft render

```bash
bash scripts/check_render.sh .video/out/draft.mp4 <brief length_s> 3
```

Look at `check/sheet.jpg` (a frame every 3 s) for pacing, and confirm:
duration within 3 % of the brief; loudness −16 ±1 LUFS (−14 for social),
peak ≤ −1.5 dBTP; no unintended black frames; frozen stretches only where a
hold is intended (the template drifts 2 % per scene, so a true freeze > 2.5 s
means `drift: 0` or a static custom scene: flag it); no silence gaps when music
should be playing; audio starts on the first frame and fades at the end;
captions (if any) match the voice and sit in the safe area. Re-check the
round 1 findings that were "fixed": actually fixed, or moved?

## The report: `.video/reviews/round-N.md`

```markdown
# Critic round 1: 3 high · 4 medium · 2 low
| # | sev | scene / time | finding | evidence | fix |
|---|-----|--------------|---------|----------|-----|
| 1 | HIGH | 3 @ 0:21 | `grit new` command wraps mid-word | stills/f00620.png | split into two steps or raise wrap at `&&` |
| 2 | HIGH | 5 | "admin@example.com / password" not in sources | sources.md has no seed creds | cite docs URL or remove |
| 3 | MED | 7 | answer on screen 1.8 s, needs 3.3 s | lint | +1.5 s or cut sub-line |
```

Severity:
- **HIGH**: wrong or unverifiable information, private data, unreadable or
  overlapping text, broken render, length off by > 5 %, missing audio when
  the brief asks for it. Blocks shipping.
- **MED**: pacing, density, weak hierarchy, a scene that does not serve the
  spine, inconsistent style. Fix unless it costs a structural rework.
- **LOW**: polish. Fix if cheap; otherwise list in `notes.md`.

Order by what it costs the viewer, not by scene number. End with "Ship
after these fixes?" and the verdict: **ship**, **fix then ship**, or
**fix then re-review** (round 1 only). After round 2 the verdict is never
"re-review": the editor fixes the HIGH and MED items and renders final.
