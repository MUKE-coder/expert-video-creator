#!/usr/bin/env bash
# Copy open-licence SVG icons into .video/assets/icons/
#   bash icons.sh lucide terminal database rocket      # Lucide (ISC)
#   bash icons.sh simple go react postgresql docker    # Simple Icons (CC0; marks belong to owners)
set -euo pipefail
SET="$1"; shift
OUT="${EVC_ICON_OUT:-.video/assets/icons}"
CACHE="${TMPDIR:-/tmp}/evc-icons"
mkdir -p "$OUT" "$CACHE"
case "$SET" in
  lucide) PKG=lucide-static; DIR=icons ;;
  simple) PKG=simple-icons; DIR=icons ;;
  *) echo "set must be lucide or simple"; exit 1 ;;
esac
if [ ! -d "$CACHE/$PKG/package" ]; then
  mkdir -p "$CACHE/$PKG" && (cd "$CACHE/$PKG" && npm pack "$PKG" --silent >/dev/null && tar xzf ./*.tgz)
fi
for name in "$@"; do
  f="$CACHE/$PKG/package/$DIR/$name.svg"
  if [ -f "$f" ]; then
    if [ "$SET" = simple ]; then
      sed 's/<svg /<svg fill="currentColor" /' "$f" > "$OUT/$name.svg"
    else cp "$f" "$OUT/$name.svg"; fi
    echo "  ✓ $name.svg ($PKG)"
  else
    echo "  ! $name not in $PKG; close matches:"; ls "$CACHE/$PKG/package/$DIR" | grep -i "$name" | head -5 | sed 's/^/      /'
  fi
done
