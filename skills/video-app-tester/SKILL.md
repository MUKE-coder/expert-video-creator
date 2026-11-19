---
name: video-app-tester
description: >-
  Explores the product the video is about and captures it: browses a live web
  app (signing in with a demo account when needed), walks its key flows, and
  saves sharp screenshots, element positions and short clips; or reads a
  GitHub repo (public directly, private after the user connects GitHub) and,
  if useful, runs it locally to capture it. Hands captures and a product
  summary to the storyboard and asset builder. Use for "screenshot my app",
  "capture these screens", "go through the app", "read this repo for a demo".
---

# video-app-tester

You are the person who actually uses the product before anyone writes a
scene about it. The storyboard can only show what you captured, so capture
what a new user would see on the happy path, sharply and without anyone's
private data in frame.

Outputs (see `../video-references/working-agreement.md`):
`.video/captures/NN-slug.jpg`, `.video/captures/manifest.json`, optional
`.video/captures/NN-slug.webm`, and `.video/product.md`.

## Step 1: what are we testing?

Read `.video/brief.md`. You have one or more of: `app_url`, `repo`, `docs`.

### A live web app

1. **Login?** If `brief.login` is `required`, ask with the ask tool how to
   sign in:
   - "I'll give a demo account" → ask the user to put it in the environment
     so you never handle the password in chat or files:
     ```bash
     export EVC_LOGIN_EMAIL='demo@example.com'
     export EVC_LOGIN_PASSWORD='…'        # or put both in .video/.env (gitignored)
     ```
     In Claude.ai or any host with its own browser credential flow, use that
     flow instead; never type a password you were sent in chat.
   - "I'll sign in myself" → open the app headed (`agent-browser open <url>
     --headed`, or the host browser), let them sign in, then save the session
     (`agent-browser state save .video/auth.json`, or the capture script's
     `--save-state`).
   - Use a **demo** account. If the only account is a real admin on
     production, say so and ask before going on.
2. **Explore first, capture second.** Load `agent-browser skills get core`
   (or use the host browser / Playwright). Take an accessibility snapshot of
   the landing page, list the navigation, and walk the happy path the brief
   cares about (`must_show`). Write down each screen: URL, title, what it is
   for, the 1–2 elements worth zooming on.
3. **Capture.** Write a flow file and run the capture script. It signs in
   from the environment, waits for the network to settle, hides scrollbars and
   cookie banners, blurs selectors you list as private, saves JPEGs at 2×
   device scale (sharp enough to zoom 1.3× in a 1080p frame), and records the
   pixel box of every `focus` selector so the editor can zoom to it.

   ```bash
   python3 scripts/capture.py flow.json --out .video/captures
   python3 scripts/capture.py --discover https://app.example.com --max 12 --out .video/captures   # crawl mode
   ```

   Flow file (`.video/captures/flow.json`):

   ```json
   {
     "base_url": "https://app.example.com",
     "viewport": {"width": 1440, "height": 900},
     "scale": 2,
     "login": {
       "url": "/login",
       "email": "input[type=email]",
       "password": "input[type=password]",
       "submit": "button[type=submit]",
       "success_url_contains": "/dashboard"
     },
     "redact": [".user-email", "[data-private]"],
     "steps": [
       {"id": "01-dashboard", "goto": "/dashboard", "focus": ["h1", ".stats-grid"]},
       {"id": "02-contacts", "goto": "/contacts", "focus": ["table"],
        "actions": [{"click": "text=New Contact"}, {"wait": 600}], "video": true}
     ]
   }
   ```

   Login steps read `EVC_LOGIN_EMAIL` / `EVC_LOGIN_PASSWORD`; leave
   `login` out for public apps.
   **Sandboxed sessions** (cloud Claude.ai/Claude Code on the web): if the
   script fails with `ERR_TUNNEL_CONNECTION_FAILED` or a proxy error, the
   shell cannot reach the site. Use the host's browser tool instead (Claude in
   Chrome, the built-in or cloud browser), following its own sign-in rules:
   take each screenshot with its save option, read the snapshot for element
   positions, and register each file:
   ```bash
   python3 scripts/manifest_add.py /path/shot.png --id 01-dashboard --url /dashboard \
     --title Dashboard --viewport 1440 --focus "308,154,1092,108:.stats"
   ```
   Apps on `localhost` (a repo you started) still work with the script; set
   `NO_PROXY=localhost,127.0.0.1`.
4. **Mobile.** If the brief is vertical or the product is mobile-first, also
   capture at `{"width": 390, "height": 844}` with `"mobile": true`.

### A GitHub repo

1. Public: `bash scripts/repo_scan.sh <url>`: shallow clone, tree, README,
   stack detection, scripts, routes, any images already in the repo.
2. Private: if the clone fails, ask the user to connect GitHub: in Claude
   Code `gh auth login` (then `gh repo clone`); in Claude.ai, connect GitHub
   and add the repository to the session. Do not ask for a token in chat.
3. Decide with the user (ask tool) whether to **run it locally** for real
   screens: "Run the app locally and capture it (takes a few minutes)" ·
   "Use README/docs images and code only". If running: follow the README's
   dev steps, start it in the background, capture `http://localhost:<port>`
   with the same script, and stop it afterwards.
4. Collect code worth showing: the 1–3 files that best explain the product
   (a model, a route, a config). Copy short excerpts into `product.md` with
   path and line numbers; the editor's `code` scene uses them verbatim.

## Step 2: write `product.md`

```markdown
# Product: <name>
What it is (1 line, from the product's own words, with source)
Who uses it
Happy path: 1. … 2. … 3. …
Screens: NN-slug | url | what it shows | focus elements
Real commands / code excerpts (path:lines)
Brand: logo URL/file, primary colours seen, font
Things NOT to show: (private data, unfinished pages, error states)
```

## Step 3: check your captures

Open every JPEG (Read the image). Reject and retake any with: a spinner or
skeleton, a cookie/consent banner, a toast, real personal data, a 404/500,
an empty state when the story needs data (seed or create demo data first,
but only in a demo account), or a cut-off modal. Write the final list to
`manifest.json`:

```json
[{"id": "01-dashboard", "file": "01-dashboard.jpg", "url": "/dashboard",
  "title": "Dashboard", "w": 2880, "h": 1800, "scale": 2,
  "focus": [{"selector": ".stats-grid", "x": 240, "y": 180, "w": 1100, "h": 320}],
  "notes": "KPIs after seeding", "redacted": [".user-email"]}]
```

Boxes are in CSS pixels of the viewport (multiply by `scale` for image
pixels); the editor converts.

## Rules

- Never submit anything destructive or outward-facing in the app (delete,
  pay, send, invite, publish) to get a screenshot. Creating demo records in
  a demo account is fine; say so in the log.
- No CAPTCHA solving; if one appears, ask the user to get past it in the
  headed browser.
- Secrets never land in files, logs, `flow.json`, screenshots or the repo.
