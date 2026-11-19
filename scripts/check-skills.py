#!/usr/bin/env python3
"""Validate every skills/*/SKILL.md: frontmatter keys, name matches folder, description length, relative links exist."""
import re, sys
from pathlib import Path
root = Path(__file__).resolve().parent.parent / "skills"
bad = 0
for md in sorted(root.glob("*/SKILL.md")):
    txt = md.read_text()
    m = re.match(r"^---\n(.*?)\n---\n", txt, re.S)
    if not m:
        print(f"✗ {md}: no frontmatter"); bad += 1; continue
    fm = m.group(1)
    name = re.search(r"^name:\s*(\S+)", fm, re.M)
    desc = re.search(r"^description:\s*(>-\n(?:  .*\n?)+|.+)", fm, re.M)
    if not name or name.group(1) != md.parent.name:
        print(f"✗ {md}: name must equal folder '{md.parent.name}'"); bad += 1
    d = re.sub(r"\s+", " ", desc.group(1).replace(">-", "")).strip() if desc else ""
    if not (50 < len(d) <= 1024):
        print(f"✗ {md}: description length {len(d)} (must be 51–1024)"); bad += 1
    if "<" in d or ">" in d.replace(">-", ""):
        print(f"✗ {md}: no angle brackets in description"); bad += 1
    for ref in re.findall(r"`(\.\./[\w-]+/[\w./-]+|scripts/[\w./-]+)`", txt):
        p = (md.parent / ref.split()[0]).resolve()
        if not p.exists():
            print(f"✗ {md.parent.name}: missing referenced file {ref}"); bad += 1
    print(f"✓ {md.parent.name:24} {len(d):4} chars")
sys.exit(1 if bad else 0)
