#!/usr/bin/env python3
"""Capture sharp, demo-ready screenshots (and optional clips) of a web app.

Usage:
  python3 capture.py flow.json --out .video/captures [--save-state auth.json] [--state auth.json]
  python3 capture.py --discover https://app.example.com --max 12 --out .video/captures

Credentials are read from EVC_LOGIN_EMAIL / EVC_LOGIN_PASSWORD (env or .video/.env),
never from the flow file or the command line.
"""
import argparse
import json
import os
import re
import sys
from pathlib import Path
from urllib.parse import urljoin, urlparse

from playwright.sync_api import sync_playwright

CLEAN_CSS = """
*::-webkit-scrollbar{display:none!important}
html{scrollbar-width:none!important}
*{caret-color:transparent!important}
[id*="cookie" i],[class*="cookie" i],[id*="consent" i],[class*="consent" i],
[class*="intercom" i],[id*="intercom" i],#crisp-chatbox,[class*="toast" i]{display:none!important}
"""


def load_env():
    env_file = Path(".video/.env")
    if env_file.exists():
        for line in env_file.read_text().splitlines():
            m = re.match(r"\s*([A-Z_]+)\s*=\s*'?\"?(.*?)'?\"?\s*$", line)
            if m and m.group(1) not in os.environ:
                os.environ[m.group(1)] = m.group(2)


def find_browser():
    for p in ["/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"]:
        if os.path.exists(p):
            return p
    return None


def settle(page, extra_ms=500):
    try:
        page.wait_for_load_state("networkidle", timeout=15000)
    except Exception:
        pass
    page.wait_for_timeout(extra_ms)


def redact(page, selectors):
    for sel in selectors or []:
        try:
            page.add_style_tag(content=f"{sel}{{filter:blur(8px)!important}}")
        except Exception:
            pass


def boxes(page, selectors):
    out = []
    for sel in selectors or []:
        try:
            el = page.locator(sel).first
            b = el.bounding_box(timeout=3000)
            if b:
                out.append({"selector": sel, **{k: round(v) for k, v in b.items()}})
        except Exception:
            print(f"  ! focus selector not found: {sel}", file=sys.stderr)
    # rename width/height -> w/h
    for b in out:
        b["w"], b["h"] = b.pop("width"), b.pop("height")
    return out


def do_login(page, base, login):
    email, pw = os.environ.get("EVC_LOGIN_EMAIL"), os.environ.get("EVC_LOGIN_PASSWORD")
    if not (email and pw):
        sys.exit("Login needed but EVC_LOGIN_EMAIL / EVC_LOGIN_PASSWORD are not set.")
    page.goto(urljoin(base, login.get("url", "/login")))
    settle(page)
    page.fill(login.get("email", "input[type=email]"), email)
    page.fill(login.get("password", "input[type=password]"), pw)
    page.click(login.get("submit", "button[type=submit]"))
    want = login.get("success_url_contains")
    if want:
        page.wait_for_url(re.compile(re.escape(want)), timeout=20000)
    settle(page, 800)
    print("  ✓ signed in")


def run_actions(page, actions):
    for a in actions or []:
        if "click" in a:
            page.click(a["click"], timeout=8000)
        elif "fill" in a:
            page.fill(a["fill"], a.get("value", ""))
        elif "press" in a:
            page.keyboard.press(a["press"])
        elif "scroll" in a:
            page.mouse.wheel(0, a["scroll"])
        elif "hover" in a:
            page.hover(a["hover"])
        elif "wait" in a:
            page.wait_for_timeout(a["wait"])
        elif "wait_for" in a:
            page.wait_for_selector(a["wait_for"], timeout=10000)
        settle(page, 300)


def shoot(page, out_dir, sid, step, scale, vp, redact_sel):
    page.add_style_tag(content=CLEAN_CSS)
    redact(page, redact_sel + step.get("redact", []))
    page.wait_for_timeout(250)
    f = out_dir / f"{sid}.jpg"
    page.screenshot(path=str(f), type="jpeg", quality=92, full_page=step.get("full_page", False))
    entry = {
        "id": sid,
        "file": f.name,
        "url": urlparse(page.url).path or "/",
        "title": page.title(),
        "w": vp["width"] * scale,
        "h": vp["height"] * scale,
        "scale": scale,
        "focus": boxes(page, step.get("focus")),
        "notes": step.get("notes", ""),
        "redacted": redact_sel + step.get("redact", []),
    }
    print(f"  ✓ {f.name}  {entry['title'][:60]}")
    return entry


def run_flow(flow, out_dir, state_in=None, state_out=None):
    base = flow["base_url"]
    vp = flow.get("viewport", {"width": 1440, "height": 900})
    scale = flow.get("scale", 2)
    manifest = []
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=find_browser(), headless=True)
        ctx_args = dict(viewport=vp, device_scale_factor=scale, is_mobile=flow.get("mobile", False),
                        color_scheme=flow.get("color_scheme", "light"))
        if state_in:
            ctx_args["storage_state"] = state_in
        steps = flow.get("steps", [])
        wants_video = any(s.get("video") for s in steps)
        if wants_video:
            ctx_args["record_video_dir"] = str(out_dir / "_video")
            ctx_args["record_video_size"] = vp
        ctx = browser.new_context(**ctx_args)
        page = ctx.new_page()
        if flow.get("login") and not state_in:
            do_login(page, base, flow["login"])
        if state_out:
            ctx.storage_state(path=state_out)
        for step in steps:
            if "goto" in step:
                page.goto(urljoin(base, step["goto"]))
                settle(page, step.get("settle_ms", 600))
            run_actions(page, step.get("actions"))
            manifest.append(shoot(page, out_dir, step["id"], step, scale, vp, flow.get("redact", [])))
        ctx.close()
        browser.close()
    if wants_video:
        vids = sorted((out_dir / "_video").glob("*.webm"))
        if vids:
            vids[-1].rename(out_dir / "flow.webm")
            print("  ✓ flow.webm (whole session recording; trim in the editor)")
    return manifest


def discover(start, max_pages, out_dir, state_in=None):
    host = urlparse(start).netloc
    flow = {"base_url": start, "steps": []}
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=find_browser(), headless=True)
        ctx = browser.new_context(viewport={"width": 1440, "height": 900}, storage_state=state_in)
        page = ctx.new_page()
        seen, queue = set(), [start]
        while queue and len(seen) < max_pages:
            url = queue.pop(0).split("#")[0]
            if url in seen:
                continue
            seen.add(url)
            try:
                page.goto(url)
                settle(page)
            except Exception:
                continue
            path = urlparse(url).path or "/"
            slug = re.sub(r"[^a-z0-9]+", "-", path.lower()).strip("-") or "home"
            flow["steps"].append({"id": f"{len(flow['steps']) + 1:02d}-{slug}"[:40], "goto": path, "focus": ["h1"]})
            for href in page.eval_on_selector_all("a[href]", "els => els.map(e => e.href)"):
                u = urlparse(href)
                if u.netloc == host and not re.search(r"(logout|signout|delete|\.pdf$|\.zip$)", href, re.I):
                    queue.append(href)
        ctx.close()
        browser.close()
    print(f"  discovered {len(flow['steps'])} pages")
    return flow


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("flow", nargs="?")
    ap.add_argument("--out", default=".video/captures")
    ap.add_argument("--discover")
    ap.add_argument("--max", type=int, default=10)
    ap.add_argument("--state")
    ap.add_argument("--save-state")
    a = ap.parse_args()
    load_env()
    out = Path(a.out)
    out.mkdir(parents=True, exist_ok=True)
    if a.discover:
        flow = discover(a.discover, a.max, out, a.state)
        (out / "flow.json").write_text(json.dumps(flow, indent=2))
    elif a.flow:
        flow = json.loads(Path(a.flow).read_text())
    else:
        ap.error("give a flow.json or --discover URL")
    manifest = run_flow(flow, out, a.state, a.save_state)
    mf = out / "manifest.json"
    old = json.loads(mf.read_text()) if mf.exists() else []
    ids = {m["id"] for m in manifest}
    mf.write_text(json.dumps([o for o in old if o["id"] not in ids] + manifest, indent=2))
    print(f"wrote {mf} ({len(manifest)} captures)")


if __name__ == "__main__":
    main()
