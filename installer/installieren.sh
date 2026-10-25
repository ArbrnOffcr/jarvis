#!/bin/zsh
# =====================================================================
#  JARVIS – Installation aus dem grafischen Installer (ohne Terminal, ohne Admin-Rechte)
#  Aufruf durch „JARVIS installieren.app“ mit:
#    JARVIS_RES      Ressourcen-Ordner des Installers (Code, App, release.json)
#    JARVIS_ANGABEN  JSON-Datei mit den Eingaben (wird nach dem Speichern gelöscht)
#    JARVIS_LOKAL    1 = lokales Sprachmodell (Ollama) einrichten
#  Ausgabe je Zeile: SCHRITT n Titel | INFO … | WARN … | FEHLER … | FERTIG
#  Kann gefahrlos erneut laufen – Erledigtes wird übersprungen bzw. aktualisiert.
# =====================================================================
set -u
setopt pipefail 2>/dev/null || true
export PATH="$HOME/.local/bin:/usr/bin:/bin:/usr/sbin:/sbin:/opt/homebrew/bin"

ATLAS="$HOME/.atlas"
CODE="$ATLAS/programm"
VENV="$ATLAS/venv"
LOGS="$ATLAS/logs"
mkdir -p "$ATLAS" "$LOGS" "$HOME/.local/bin" "$HOME/Library/LaunchAgents" "$HOME/Applications"

schritt() { print -r -- "SCHRITT $1 $2"; }
info()    { print -r -- "INFO $*"; }
warn()    { print -r -- "WARN $*"; }
fehler()  { print -r -- "FEHLER $*"; rm -f "${JARVIS_ANGABEN:-/nonexistent}"; exit 1; }

# ---------------------------------------------------------------- 1
schritt 1 "Mac prüfen"
[[ "$(uname -m)" == "arm64" ]] || fehler "JARVIS braucht einen Mac mit Apple-Chip (M1 oder neuer)."
MAJOR=$(sw_vers -productVersion | cut -d. -f1)
(( MAJOR >= 13 )) || fehler "macOS $(sw_vers -productVersion) ist zu alt (mindestens 13)."
curl -fsI --max-time 15 https://pypi.org >/dev/null 2>&1 || fehler "Keine Internetverbindung."
FREI=$(df -g "$HOME" | awk 'NR==2{print $4}')
(( FREI >= 4 )) || fehler "Zu wenig freier Speicher (${FREI} GB, mindestens 4 GB)."
info "Mac geeignet: macOS $(sw_vers -productVersion), ${FREI} GB frei"

# ---------------------------------------------------------------- 2
schritt 2 "Werkzeuge bereitstellen"
if ! command -v uv >/dev/null 2>&1; then
  info "Lade uv (Python-Verwaltung) …"
  curl -LsSf https://astral.sh/uv/install.sh | env UV_NO_MODIFY_PATH=1 INSTALLER_NO_MODIFY_PATH=1 sh >>"$LOGS/installation.log" 2>&1 \
    || fehler "uv konnte nicht geladen werden."
fi
command -v uv >/dev/null 2>&1 || fehler "uv nicht gefunden."
print -r -- "uv $(uv --version 2>/dev/null)"

# ---------------------------------------------------------------- 3
schritt 3 "Programm kopieren"
[[ -f "$JARVIS_RES/jarvis-code.tar.gz" ]] || fehler "Programmpaket fehlt im Installer."
NEU="$ATLAS/programm.neu"
rm -rf "$NEU"; mkdir -p "$NEU"
tar -xzf "$JARVIS_RES/jarvis-code.tar.gz" -C "$NEU" || fehler "Programmpaket beschädigt."
if [[ -d "$CODE" ]]; then rm -rf "$ATLAS/programm.vorher"; mv "$CODE" "$ATLAS/programm.vorher"; fi
mv "$NEU" "$CODE"
info "Programm liegt in ~/.atlas/programm"

# ---------------------------------------------------------------- 4
schritt 4 "Python-Umgebung und Pakete"
info "Lade Python und die Programmbibliotheken – das dauert ein paar Minuten …"
[[ -x "$VENV/bin/python" ]] || uv venv -q --python 3.12 "$VENV" >>"$LOGS/installation.log" 2>&1 || fehler "Python-Umgebung konnte nicht angelegt werden."
uv pip install --python "$VENV/bin/python" -e "$CODE" 2>&1 | while IFS= read -r z; do
  print -r -- "$z" >>"$LOGS/installation.log"
  [[ "$z" == *"Installed"* || "$z" == *"Prepared"* || "$z" == *"Resolved"* ]] && print -r -- "$z"
done
"$VENV/bin/python" -c "import atlas.server" >/dev/null 2>&1 || fehler "Pakete unvollständig – Details in ~/.atlas/logs/installation.log"
ln -sf "$VENV/bin/jarvis" "$HOME/.local/bin/jarvis"
ln -sf "$VENV/bin/atlas" "$HOME/.local/bin/atlas"
grep -q '.local/bin' "$HOME/.zshrc" 2>/dev/null || print 'export PATH="$HOME/.local/bin:$PATH"' >> "$HOME/.zshrc"

# ---------------------------------------------------------------- 5
schritt 5 "Einstellungen und Schlüssel speichern"
if [[ -n "${JARVIS_ANGABEN:-}" && -f "$JARVIS_ANGABEN" ]]; then
  "$VENV/bin/jarvis" einrichten --stdin < "$JARVIS_ANGABEN" 2>>"$LOGS/installation.log"
  RC=$?
  rm -f "$JARVIS_ANGABEN"
  (( RC == 0 )) || fehler "Einstellungen konnten nicht gespeichert werden."
fi
if [[ -f "$JARVIS_RES/release.json" ]]; then
  SHA=$("$VENV/bin/python" -c "import json,sys;print(json.load(open(sys.argv[1])).get('sha',''))" "$JARVIS_RES/release.json")
  REPO=$("$VENV/bin/python" -c "import json,sys;print(json.load(open(sys.argv[1])).get('repo',''))" "$JARVIS_RES/release.json")
  print -r -- "{\"sha\": \"$SHA\", \"repo\": \"$REPO\", \"stand\": \"$(date '+%Y-%m-%d %H:%M')\"}" > "$ATLAS/version.json"
fi

# ---------------------------------------------------------------- 6
schritt 6 "Hintergrunddienst starten"
LABEL="de.atlas.core"
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"
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
  <key>StandardOutPath</key><string>$LOGS/core.log</string>
  <key>StandardErrorPath</key><string>$LOGS/core.log</string>
  <key>EnvironmentVariables</key>
  <dict><key>PATH</key><string>$HOME/.local/bin:/opt/homebrew/bin:/usr/bin:/bin</string></dict>
</dict>
</plist>
PLIST
launchctl bootout "gui/$(id -u)/$LABEL" 2>/dev/null
launchctl bootstrap "gui/$(id -u)" "$PLIST" 2>>"$LOGS/installation.log" || launchctl kickstart -k "gui/$(id -u)/$LABEL"
PORT=$(( 47000 + $(id -u) % 1000 ))
for i in {1..60}; do
  curl -s -o /dev/null --max-time 2 "http://127.0.0.1:$PORT/" && break
  sleep 2
done
curl -s -o /dev/null --max-time 2 "http://127.0.0.1:$PORT/" || warn "Dienst startet langsam – Details in ~/.atlas/logs/core.log"
info "JARVIS-Kern läuft"

# ---------------------------------------------------------------- 7
schritt 7 "JARVIS-App einrichten"
if [[ -d "$JARVIS_RES/JARVIS.app" ]]; then
  rm -rf "$HOME/Applications/JARVIS.app"
  ditto "$JARVIS_RES/JARVIS.app" "$HOME/Applications/JARVIS.app"
  xattr -dr com.apple.quarantine "$HOME/Applications/JARVIS.app" 2>/dev/null
  info "App unter Benutzer → Programme → JARVIS"
else
  warn "App fehlt im Installer – Dashboard über 'jarvis dashboard' öffnen"
fi

# ---------------------------------------------------------------- 8
schritt 8 "Lokales Modell"
if [[ "${JARVIS_LOKAL:-0}" == "1" ]]; then
  OL="$ATLAS/ollama"
  if [[ ! -x "$OL/ollama" ]] && ! command -v ollama >/dev/null 2>&1; then
    info "Lade Ollama …"
    mkdir -p "$OL"
    if curl -fsSL --max-time 900 -o "$ATLAS/ollama.tgz" https://github.com/ollama/ollama/releases/latest/download/ollama-darwin.tgz \
       && tar -xzf "$ATLAS/ollama.tgz" -C "$OL"; then
      rm -f "$ATLAS/ollama.tgz"
      [[ -x "$OL/ollama" ]] || { B=$(find "$OL" -name ollama -type f -perm -u+x | head -1); [[ -n "$B" ]] && ln -sf "$B" "$OL/ollama"; }
    else
      warn "Ollama konnte nicht geladen werden – JARVIS nutzt nur Claude."
    fi
  fi
  OBIN="$OL/ollama"; [[ -x "$OBIN" ]] || OBIN="$(command -v ollama || true)"
  if [[ -n "$OBIN" && -x "$OBIN" ]]; then
    ln -sf "$OBIN" "$HOME/.local/bin/ollama"
    if ! curl -s --max-time 2 http://127.0.0.1:11434/api/tags >/dev/null; then
      OPL="$HOME/Library/LaunchAgents/de.atlas.ollama.plist"
      cat > "$OPL" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>de.atlas.ollama</string>
  <key>ProgramArguments</key><array><string>$OBIN</string><string>serve</string></array>
  <key>RunAtLoad</key><true/><key>KeepAlive</key><true/>
  <key>StandardOutPath</key><string>$LOGS/ollama.log</string>
  <key>StandardErrorPath</key><string>$LOGS/ollama.log</string>
</dict>
</plist>
PLIST
      launchctl bootout "gui/$(id -u)/de.atlas.ollama" 2>/dev/null
      launchctl bootstrap "gui/$(id -u)" "$OPL" 2>>"$LOGS/installation.log"
      for i in {1..20}; do curl -s --max-time 2 http://127.0.0.1:11434/api/tags >/dev/null && break; sleep 1; done
    fi
    # Modelle laden im Hintergrund weiter – JARVIS ist schon vorher benutzbar (über Claude)
    nohup zsh -c "\"$OBIN\" pull qwen3.5:9b || \"$OBIN\" pull qwen3:8b; \"$OBIN\" pull bge-m3" >"$LOGS/modelle.log" 2>&1 &
    info "Sprachmodell lädt im Hintergrund (ca. 7 GB) – bis dahin antwortet JARVIS über Claude."
  fi
else
  print -r -- "übersprungen"
fi

# ---------------------------------------------------------------- 9
schritt 9 "Abschluss"
info "Frage macOS-Berechtigungen an – bitte die Dialoge mit „OK“ bestätigen …"
"$VENV/bin/jarvis" berechtigungen >>"$LOGS/installation.log" 2>&1 || warn "Berechtigungen bitte später mit 'jarvis berechtigungen' erteilen."
"$VENV/bin/jarvis" dashboard autostart >>"$LOGS/installation.log" 2>&1 || true   # öffnet JARVIS bei jeder Anmeldung
rm -rf "$ATLAS/programm.vorher"
print -r -- "FERTIG"
exit 0
