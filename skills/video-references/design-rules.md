# Design rules

Learned the hard way on real demo videos. The critic checks every one.

## Readability

| Element | 16:9 (1920×1080) | 9:16 (1080×1920) |
|---|---|---|
| Headline / answer | 72–120 px | 72–96 px |
| Body / sub-line | ≥ 36 px | ≥ 44 px |
| Code & terminal | ≥ 24 px (26–30 preferred) | ≥ 30 px |
| Labels / pills | ≥ 22 px | ≥ 28 px |
| Max code line | ~100 chars at 24 px | ~45 chars at 30 px |
| Safe margin | 120 px sides, 80 px top/bottom | 80 px sides, 220 px top, 320 px bottom (platform UI) |

Contrast: body text ≥ 4.5:1 against its background; muted text only for
secondary lines, never for the thing the viewer must read.

**Never let text wrap by accident.** Commands and file paths get
`white-space: nowrap` or explicit break points (insert `​` after
commas in long `--fields` strings so they wrap between items, not mid-word).

## Timing

- Reading time: **1 s + 1 s per 3 words** of on-screen text the viewer must
  read, measured from when the text is fully visible.
- A question lands, holds ~1 s, then lifts; the answer appears 10–15 frames
  after the lift starts.
- Typing: 2.5–4 chars/frame for short commands, up to 4–5 for long ones. Hold
  ≥ 1 s after the last output line before leaving the scene.
- Transitions: 10–12 frame fades (or slides for walkthrough steps). No
  transition longer than 20 frames in a demo.
- A 60 s demo carries 7–10 scenes; a 30 s short 4–6; a 10 s teaser 3–4.
  Beginner audiences need the slow end of every range.

## Layout

- One idea per screen. Vertical rhythm: label pill → headline → content →
  (optional) one muted line. Nothing else.
- Centre the content block vertically. Large empty bottoms after a lifted
  question are the most common layout bug.
- Windows (terminal, editor, browser) are 1400–1640 px wide in 16:9, with a
  macOS title bar, 14 px radius, 1 px border, soft shadow.
- Screenshots: show the real capture inside a browser frame; zoom (1.0 →
  1.15) toward the element being discussed and add one highlight box or
  cursor, never three.

## Motion

- Ease: `bezier(0.16, 1, 0.3, 1)` for entrances; springs with damping 14–18
  for pops.
- Stagger list items 3–9 frames; never animate more than one group at once.
- Everything moves for a reason (entering, emphasising, leaving). No idle
  wobble.

## Syntax colours (mono preset; other presets map the same roles)

| Role | Colour |
|---|---|
| command / function | `#52A8FF` |
| flag / keyword-alt | `#BF7AF0` |
| string / key | `#62C073` |
| type / value | `#F5A524` |
| operator / keyword | `#FF6166` / `#FF4D8D` |
| comment / output | `#8F8F8F` |
| prompt dir | `#3DD6C9` |
