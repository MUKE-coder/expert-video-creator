# Formats

| Format | Size | Use | Notes |
|---|---|---|---|
| 16:9 | 1920×1080 | YouTube, docs, landing pages, X | default |
| 9:16 | 1080×1920 | TikTok, Reels, Shorts | keep text out of the bottom 320 px and top 220 px |
| 1:1 | 1080×1080 | LinkedIn, X feed | |
| 4:5 | 1080×1350 | Instagram/LinkedIn feed | |

All at 30 fps unless the brief asks for 60 (60 only for fast UI motion).

## Changing aspect ratio is a re-layout, not a crop

- Windows go full width minus margins; terminal font +4 px; long commands
  are split across lines at natural break points (`&&`, `--flag`, commas).
- Screenshots of desktop apps in 9:16: show the window at full width, then
  zoom/pan to the area that matters (Ken Burns), rather than shrinking.
- Side-by-side layouts become stacked.
- The template reads `width`/`height` from `video.json`; components use
  `useVideoConfig()` and the `isVertical` helper to switch layouts.

## Encoding

- H.264, `-pix_fmt yuv420p`, CRF 16–18 final, CRF 28 + half size for drafts.
- AAC 192 kbps, 48 kHz. `-movflags +faststart`.
- Loudness: overall −16 LUFS (−14 for social), true peak ≤ −1.5 dBTP; music
  bed alone around −20 LUFS; voice sits 8–12 dB over the music.
