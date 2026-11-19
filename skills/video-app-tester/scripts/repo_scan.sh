#!/usr/bin/env bash
# Shallow-clone a repo and print what a video needs to know about it.
# Usage: bash repo_scan.sh <git-url-or-owner/repo> [dest]
set -euo pipefail
SRC="$1"
[[ "$SRC" != http* && "$SRC" != git@* ]] && SRC="https://github.com/$SRC"
DEST="${2:-.video/repo}"
mkdir -p "$(dirname "$DEST")"
if [ ! -d "$DEST/.git" ]; then
  git clone -q --depth 1 "$SRC" "$DEST" 2>/dev/null || {
    if command -v gh >/dev/null && gh auth status >/dev/null 2>&1; then
      gh repo clone "${SRC#https://github.com/}" "$DEST" -- --depth 1 -q
    else
      echo "CLONE_FAILED: repo is private or unreachable. Ask the user to connect GitHub (gh auth login / add the repo to the session)."; exit 2
    fi
  }
fi
cd "$DEST"
echo "== repo: $SRC  (commit $(git rev-parse --short HEAD))"
echo; echo "== tree (depth 3)"
find . -maxdepth 3 -not -path '*/.git*' -not -path '*/node_modules*' -not -path '*/vendor*' -not -path '*/dist*' -not -path '*/.next*' | sort | head -120
echo; echo "== README (first 120 lines)"
for r in README.md readme.md README.MD README; do [ -f "$r" ] && sed -n 1,120p "$r" && break; done
echo; echo "== stack"
[ -f package.json ] && node -e 'const p=require("./package.json");console.log("node:",p.name,"\nscripts:",JSON.stringify(p.scripts||{},null,1),"\ndeps:",Object.keys({...p.dependencies,...p.devDependencies}).slice(0,60).join(", "))' || true
[ -f go.mod ] && head -20 go.mod || true
[ -f pyproject.toml ] && head -40 pyproject.toml || true
[ -f requirements.txt ] && head -30 requirements.txt || true
[ -f Cargo.toml ] && head -30 Cargo.toml || true
ls docker-compose*.yml compose*.yml 2>/dev/null || true
echo; echo "== routes / pages"
find . \( -path '*/app/*' -name 'page.*' -o -path '*/pages/*' -name '*.tsx' -o -path '*/routes/*' \) -not -path '*/node_modules/*' 2>/dev/null | head -40
echo; echo "== images already in the repo (logos, screenshots)"
find . \( -iname '*.png' -o -iname '*.jpg' -o -iname '*.svg' -o -iname '*.gif' -o -iname '*.webp' \) -not -path '*/node_modules/*' -not -path '*/.git/*' 2>/dev/null | grep -iE 'logo|screen|demo|preview|hero|og|banner|icon' | head -30
echo; echo "== env example"
for e in .env.example .env.sample env.example; do [ -f "$e" ] && sed 's/=.*/=…/' "$e" && break; done || true
