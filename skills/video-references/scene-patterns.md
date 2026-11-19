# Scene patterns

The scene types the editor template ships (`kind` in `video.json`), with the
timings that worked on real demos. Storyboards should be written in these
terms so the editor can build most of a video from data alone.

| kind | What it shows | Typical length | Props |
|---|---|---|---|
| `question` | Q-pill + big question → lifts → answer headline + one muted sub-line, optional chips | 6–8 s | `n, question, answer, highlight, sub, chips[]` |
| `title` | Logo/wordmark + tagline | 2–4 s | `title, tagline, logo` |
| `terminal` | macOS terminal; commands typed with syntax colours; output lines appear | 8–14 s | `title, question?, lines[] {cmd, dir, nextDir, out[]}` |
| `code` | Editor window, filename tab, line numbers, highlighted code, optional highlighted lines | 5–7 s | `file, lang, code, highlight[]` |
| `screenshot` | A capture in a browser (or phone) frame, slow zoom to a focus box, optional callout | 4–6 s per screen | `src, url, focus {x,y,w,h}, callout, device` |
| `flow` | 2–4 captures in sequence with a cursor/click between them (a user journey) | 3 s per step | `steps[] {src, focus, label}` |
| `schema` | Tables/entities with fields and a drawn relation line | 6–7 s | `tables[], relations[]` |
| `bullets` | Up to 4 short points, staggered | 4–6 s | `title, items[]` |
| `cheatsheet` | Commands with `# comments` in a window | 4–5 s | `rows[] {cmd, note}` |
| `outro` | Wordmark, tagline, URL pill / CTA | 2–3 s | `title, tagline, url` |

## Story structures

- **q-and-a** (beginners): What is it? → Who is it for? → How do I start? →
  Can I build something real? → steps… → What should I remember? → outro.
- **problem-solution** (launch/promo): the pain (1 scene) → the product
  (title) → 3 features as screenshot scenes → proof (a number or a flow) → CTA.
- **walkthrough** (existing users / tutorial): goal → step 1…n (terminal,
  code or screenshot each) → result → recap.
- **feature-tour** (app demo): title → login/landing capture → 3–5 key
  screens as `screenshot`/`flow` → one "what makes it different" → CTA.

## Pacing for a 60 s demo (template)

```
question 7s · question 6s · terminal 12s · schema 7s · terminal 10s ·
code 6s · screenshot/flow 8s · cheatsheet 4.5s · outro 3s  (+ 12-frame fades)
```
