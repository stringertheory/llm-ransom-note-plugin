#!/usr/bin/env bash
# Builds the bundle, stages the runtime files into dist/unpacked/, validates
# the manifest, and zips everything to dist/make-it-ransomy-<version>.zip
# ready for upload to the Chrome Web Store.
#
# Usage: npm run package    (or: bash dev/package.sh)

set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")"/.. && pwd)"
cd "$HERE"

# Whitelist of runtime files that go into the zip. Update this when adding
# a new runtime file. Anything not listed is excluded from the package.
RUNTIME_FILES=(
  manifest.json
  background.js
  content.js
  popup.html
  popup.js
  icon.png
  icon-off.png
  LICENSE
)

DIST="$HERE/dist"
STAGE="$DIST/unpacked"

# ── 1. Warn on dirty working tree ───────────────────────────────────
if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "warning: working tree is dirty — the package will reflect uncommitted changes." >&2
fi

# ── 2. Build the bundle fresh ───────────────────────────────────────
echo "→ npm run build"
npm run build

# ── 3. Read version from manifest ───────────────────────────────────
VERSION=$(node -p "require('./manifest.json').version")
if [[ -z "$VERSION" ]]; then
  echo "error: could not read version from manifest.json" >&2
  exit 1
fi
ZIP="$DIST/make-it-ransomy-$VERSION.zip"

# ── 4. Stage whitelisted files into a clean dist/unpacked ───────────
echo "→ stage to dist/unpacked/"
rm -rf "$DIST"
mkdir -p "$STAGE"
for f in "${RUNTIME_FILES[@]}"; do
  if [[ ! -e "$f" ]]; then
    echo "error: required file missing from repo: $f" >&2
    exit 1
  fi
  cp "$f" "$STAGE/"
done

# ── 5. Validate the manifest in the staged copy ─────────────────────
node -e "
const fs = require('fs');
const m = require('$STAGE/manifest.json');
const need = ['manifest_version', 'name', 'version', 'description'];
for (const k of need) {
  if (!m[k]) { console.error('manifest missing required field: ' + k); process.exit(1); }
}
if (m.manifest_version !== 3) {
  console.error('expected manifest_version 3, got ' + m.manifest_version); process.exit(1);
}
if (m.description.length > 132) {
  console.error('description is ' + m.description.length + ' chars; Chrome truncates at 132'); process.exit(1);
}
// Every file the manifest names must actually exist in the package.
const refs = [];
if (m.background && m.background.service_worker) refs.push(m.background.service_worker);
if (m.action && m.action.default_icon) refs.push(m.action.default_icon);
if (m.action && m.action.default_popup) refs.push(m.action.default_popup);
for (const cs of m.content_scripts || []) for (const js of cs.js || []) refs.push(js);
for (const r of refs) {
  if (!fs.existsSync('$STAGE/' + r)) {
    console.error('manifest references missing file: ' + r); process.exit(1);
  }
}
"

# ── 6. Zip ──────────────────────────────────────────────────────────
echo "→ zip dist/make-it-ransomy-$VERSION.zip"
(cd "$STAGE" && zip -rq "$ZIP" .)
unzip -tq "$ZIP" >/dev/null  # integrity check

# ── 7. Report ───────────────────────────────────────────────────────
SIZE=$(du -h "$ZIP" | cut -f1)
echo ""
echo "✓ packaged $ZIP ($SIZE)"
echo ""
echo "contents:"
unzip -l "$ZIP" | sed 's/^/  /'
echo ""
echo "smoke-test locally before uploading:"
echo "  chrome://extensions → Developer mode → Load unpacked → choose:"
echo "    $STAGE"
echo "  then open chatgpt.com, toggle the icon, try all three modes."
echo ""
echo "upload at:"
echo "  https://chrome.google.com/webstore/devconsole"
