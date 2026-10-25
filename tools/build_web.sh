#!/bin/zsh
# Baut den 3D-Kern (atlas/web/src/core3d.js -> atlas/web/core3d.bundle.js).
# Nur nötig, wenn src/core3d.js geändert wurde. Braucht Node.js (brew install node).
set -e
cd "$(dirname "$0")/.."
TMP=$(mktemp -d)
cp atlas/web/src/core3d.js "$TMP/"
cd "$TMP" && npm init -y >/dev/null && npm i -s three@0.186.1 esbuild >/dev/null
npx esbuild core3d.js --bundle --minify --format=esm --target=safari16 \
  --alias:three/addons=three/examples/jsm --outfile=core3d.bundle.js
cd - >/dev/null && cp "$TMP/core3d.bundle.js" atlas/web/core3d.bundle.js
echo "✓ atlas/web/core3d.bundle.js aktualisiert"
