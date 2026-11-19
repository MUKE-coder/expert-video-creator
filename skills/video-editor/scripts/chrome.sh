# sourced: sets BROWSER_FLAG to a local Chrome if one exists (Remotion otherwise downloads its own)
BROWSER_FLAG=""
for c in /usr/bin/google-chrome /usr/bin/chromium /usr/bin/chromium-browser "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"; do
  [ -x "$c" ] && BROWSER_FLAG="--browser-executable=$c" && break
done
