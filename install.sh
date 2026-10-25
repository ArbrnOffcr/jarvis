#!/bin/zsh
# JARVIS – Installation für den angemeldeten Benutzer auf diesem Mac.
# Wird von bootstrap.sh aufgerufen; kann jederzeit erneut laufen.
set -e
REPO="$(cd "$(dirname "$0")" && pwd)"
ATLAS="$HOME/.atlas"
VENV="$ATLAS/venv"
LABEL="de.atlas.core"
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"

mkdir -p "$ATLAS/logs" "$HOME/Library/LaunchAgents" "$HOME/.local/bin"

echo "→ Python-Umgebung (lokal, nicht in iCloud) ..."
[ -d "$VENV" ] || uv venv -q --python 3.12 "$VENV"
uv pip install -q --python "$VENV/bin/python" -e "$REPO"
ln -sf "$VENV/bin/atlas" "$HOME/.local/bin/atlas"
ln -sf "$VENV/bin/jarvis" "$HOME/.local/bin/jarvis"
grep -q '.local/bin' "$HOME/.zshrc" 2>/dev/null || echo 'export PATH="$HOME/.local/bin:$PATH"' >> "$HOME/.zshrc"

echo "→ Autostart bei Anmeldung einrichten ..."
cat > "$PLIST" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>$LABEL</string>
  <key>ProgramArguments</key>
  <array><string>$VENV/bin/atlas-core</string></array>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>ThrottleInterval</key><integer>10</integer>
  <key>StandardOutPath</key><string>$ATLAS/logs/core.log</string>
  <key>StandardErrorPath</key><string>$ATLAS/logs/core.log</string>
  <key>EnvironmentVariables</key>
  <dict><key>PATH</key><string>/opt/homebrew/bin:/usr/bin:/bin</string></dict>
</dict>
</plist>
PLIST

launchctl bootout "gui/$(id -u)/$LABEL" 2>/dev/null || true
launchctl bootstrap "gui/$(id -u)" "$PLIST"
echo "✓ JARVIS-Core läuft und startet künftig automatisch."
