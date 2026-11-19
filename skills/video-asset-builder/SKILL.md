---
name: video-asset-builder
description: >-
  Builds everything the editor places on screen apart from the scenes
  themselves: the resolved style (theme.json with colours and fonts from a
  preset or the product's brand), the product logo, open-licence icons and
  technology logos, fonts, cleaned and cropped captures, highlight crops,
  backgrounds and the thumbnail art. Records the source and licence of each.
  Use for "make the assets", "get the logo", "icons for the video", "match
  our brand colours", or after the storyboard in expert-video-creator.
---

# video-asset-builder

You make sure that when the editor reaches for something, it exists, looks
right at 1080p, and is allowed to be used.

Read `.video/brief.md`, `.video/storyboard.md`, `.video/captures/`.
Write `.video/theme.json`, `.video/assets/**`, `.video/assets/assets.json`.
Rules: `../video-references/style-presets.md`, `working-agreement.md` §4.6.

## Step 1: resolve the style into `theme.json`

```bash
python3 scripts/resolve_theme.py --preset mono --out .video/theme.json
python3 scripts/resolve_theme.py --preset brand --captures .video/captures --out .video/theme.json
python3 scripts/resolve_theme.py --preset custom --bg '#0B1020' --accent '#7C5CFF' --font 'Inter' --out .video/theme.json
```

`brand` runs `brand_colors.py` over the captures (k-means on pixels,
ignoring near-white/near-black UI chrome) and picks a primary and secondary
colour, then checks contrast: a brand colour that fails 4.5:1 on the
background is used for fills and lines only, never body text. Show the user
the palette as a small inline swatch if they are present.

## Step 2: fonts

The template ships Geist and Geist Mono (from the `geist` npm package,
OFL). For another open font, install its Fontsource package and copy the
woff2 into `project/public/fonts/`:

```bash
npm i @fontsource-variable/inter && cp node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2 .video/project/public/fonts/
```

Use only open-licensed fonts (OFL/Apache). If the brand font is commercial,
use the closest open one and say so in `notes.md`.

## Step 3: logo and icons

- **Product logo**: in order of preference: a file the user gave, an SVG in
  the repo (`repo_scan` lists them), the site's SVG logo or
  `apple-touch-icon`/`og:image` (`python3 scripts/site_logo.py <url>`), or a
  crop from a capture. Never redraw a real company's logo; if none can be
  found, use the product name set in the theme font as a wordmark.
- **UI icons**: Lucide (ISC). `bash scripts/icons.sh lucide terminal
  database rocket check` copies SVGs to `assets/icons/`.
- **Technology logos** (Go, React, Postgres… in a "built with" row):
  Simple Icons (CC0; trademarks belong to their owners, used only to name
  the technology). `bash scripts/icons.sh simple go react postgresql`.
- Tint SVG icons with `currentColor` so the theme colours them.

## Step 4: captures, ready to place

For every capture the storyboard uses:

- Check again for private data; blur or crop it out (`PIL` is fine).
- If a scene zooms past 1.3×, make a pre-cropped high-res version around the
  focus box (`assets/images/<id>-focus.jpg`) so text stays sharp.
- Keep original aspect ratios; never stretch.

## Step 5: generated art

Backgrounds, gradients, grids and glows are drawn in code by the template,
not as images. Make an image only when the storyboard asks for one that code
cannot draw well (an illustration, a texture). Prefer SVG you write
yourself; never use stock photos of real people or copyrighted characters.

## Step 6: `assets.json`

```json
[{"id": "logo", "file": "logos/product.svg", "source": "https://site/logo.svg", "licence": "product owner's mark, used to identify it"},
 {"id": "icon-terminal", "file": "icons/terminal.svg", "source": "lucide-static", "licence": "ISC"},
 {"id": "tech-go", "file": "icons/go.svg", "source": "simple-icons", "licence": "CC0 (trademark of owner)"}]
```
