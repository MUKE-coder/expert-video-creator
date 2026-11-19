#!/usr/bin/env python3
"""Find and download a site's logo candidates (SVG logo, apple-touch-icon, og:image, favicon).

Usage: python3 site_logo.py https://example.com [--out .video/assets/logos]
Uses a headless browser so JS-rendered headers work. Prints what it saved; pick one by looking at it.
"""
import argparse
import os
from pathlib import Path
from urllib.parse import urljoin

from playwright.sync_api import sync_playwright

JS = """() => {
  const q = s => [...document.querySelectorAll(s)];
  const out = [];
  q('link[rel*="icon"]').forEach(l => out.push({kind: 'icon', url: l.href, sizes: l.sizes ? l.sizes.value : ''}));
  q('meta[property="og:image"]').forEach(m => out.push({kind: 'og', url: m.content}));
  q('header img, nav img, a[href="/"] img, [class*="logo" i] img, img[alt*="logo" i]').forEach(i => out.push({kind: 'img', url: i.currentSrc || i.src}));
  const svg = document.querySelector('header svg, nav svg, a[href="/"] svg, [class*="logo" i] svg');
  return {cands: out, svg: svg ? svg.outerHTML : null};
}"""


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("url")
    ap.add_argument("--out", default=".video/assets/logos")
    a = ap.parse_args()
    out = Path(a.out)
    out.mkdir(parents=True, exist_ok=True)
    exe = next((p for p in ["/usr/bin/google-chrome", "/usr/bin/chromium"] if os.path.exists(p)), None)
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path=exe)
        pg = b.new_page()
        pg.goto(a.url, wait_until="networkidle")
        res = pg.evaluate(JS)
        if res["svg"]:
            (out / "inline-logo.svg").write_text(res["svg"])
            print("  ✓ inline-logo.svg (from header/nav)")
        seen = set()
        for i, c in enumerate(res["cands"]):
            u = urljoin(a.url, c["url"])
            if not u or u in seen or u.startswith("data:"):
                continue
            seen.add(u)
            r = pg.request.get(u)
            if r.ok:
                ext = u.split("?")[0].rsplit(".", 1)[-1][:4].lower()
                f = out / f"{c['kind']}-{i}.{ext if ext in ('svg','png','jpg','jpeg','webp','ico') else 'png'}"
                f.write_bytes(r.body())
                print(f"  ✓ {f.name}  {c.get('sizes','')}  <- {u}")
        b.close()


if __name__ == "__main__":
    main()
