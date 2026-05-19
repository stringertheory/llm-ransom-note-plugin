#!/usr/bin/env bash
# Launches Chrome with a project-local profile and CDP port 9222, so dev
# scripts can attach to a real logged-in session. macOS only.

set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")"/.. && pwd)"
PROFILE="$HERE/.dev-chrome-profile"
mkdir -p "$PROFILE"

exec "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --user-data-dir="$PROFILE" \
  --remote-debugging-port=9222 \
  --load-extension="$HERE" \
  --disable-features=DisableLoadExtensionCommandLineSwitch \
  https://chatgpt.com/
