# =====================================================================
#  JARVIS – Installation unter Windows 10/11 (ohne Administratorrechte)
#  Aufruf: „JARVIS installieren.cmd“ im entpackten Paket (oder durch JARVIS-Setup.exe).
#  Kann gefahrlos erneut laufen – Erledigtes wird übersprungen bzw. aktualisiert.
#  Legt an:  %USERPROFILE%\.atlas\programm (Code), \venv (Python), \logs
#            Autostart (Ordner „Autostart“), Startmenü- und Desktop-Verknüpfung „JARVIS“
# =====================================================================
param([switch]$Lokal, [switch]$OhneFenster)
$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$RES   = $PSScriptRoot
$ATLAS = Join-Path $env:USERPROFILE ".atlas"
$CODE  = Join-Path $ATLAS "programm"
$VENV  = Join-Path $ATLAS "venv"
$LOGS  = Join-Path $ATLAS "logs"
$UVDIR = Join-Path $env:USERPROFILE ".local\bin"
New-Item -ItemType Directory -Force $ATLAS, $LOGS, $UVDIR | Out-Null
function Schritt($n, $t) { Write-Host ""; Write-Host "[$n/8] $t" -ForegroundColor Cyan }
function Info($t)  { Write-Host "  $t" }
function Warn($t)  { Write-Host "  ! $t" -ForegroundColor Yellow }
function Fehler($t){ Write-Host "  ✕ $t" -ForegroundColor Red; Read-Host "Enter zum Beenden"; exit 1 }

Schritt 1 "Rechner prüfen"
$os = [Environment]::OSVersion.Version
if ($os.Major -lt 10) { Fehler "JARVIS braucht Windows 10 oder 11." }
if (-not [Environment]::Is64BitOperatingSystem) { Fehler "JARVIS braucht ein 64-Bit-Windows." }
try { Invoke-WebRequest -UseBasicParsing -Method Head -TimeoutSec 15 https://pypi.org | Out-Null } catch { Fehler "Keine Internetverbindung." }
$frei = [math]::Round((Get-PSDrive ($env:USERPROFILE.Substring(0,1))).Free / 1GB)
if ($frei -lt 4) { Fehler "Zu wenig freier Speicher ($frei GB, mindestens 4 GB)." }
Info "Windows $($os.Major).$($os.Build), $frei GB frei"

Schritt 2 "Werkzeuge bereitstellen (uv, Python)"
$UV = Join-Path $UVDIR "uv.exe"
if (-not (Test-Path $UV)) {
  Info "Lade uv …"
  $env:UV_INSTALL_DIR = $UVDIR; $env:UV_NO_MODIFY_PATH = "1"
  powershell -NoProfile -ExecutionPolicy Bypass -Command "irm https://astral.sh/uv/install.ps1 | iex" *>> "$LOGS\installation.log"
}
if (-not (Test-Path $UV)) { Fehler "uv konnte nicht geladen werden (Details: $LOGS\installation.log)." }
Info (& $UV --version)

Schritt 3 "Programm kopieren"
$QUELLE = Join-Path $RES "programm"
if (-not (Test-Path "$QUELLE\atlas\server.py")) { Fehler "Programmpaket fehlt im Installer." }
# laufenden Kern beenden, damit der Ordner frei ist
$pidDatei = Join-Path $ATLAS "core.pid"
if (Test-Path $pidDatei) { Stop-Process -Id (Get-Content $pidDatei) -Force -ErrorAction SilentlyContinue }
Get-CimInstance Win32_Process -Filter "Name='powershell.exe'" | Where-Object { $_.CommandLine -like "*windows\start.ps1*" } |
  ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
Start-Sleep 1
if (Test-Path "$ATLAS\programm.vorher") { Remove-Item -Recurse -Force "$ATLAS\programm.vorher" }
if (Test-Path $CODE) { Rename-Item $CODE "programm.vorher" }
Copy-Item -Recurse $QUELLE $CODE
Info "Programm liegt in $CODE"

Schritt 4 "Python-Umgebung und Pakete (dauert ein paar Minuten)"
if (-not (Test-Path "$VENV\Scripts\python.exe")) { & $UV venv -q --python 3.12 $VENV *>> "$LOGS\installation.log" }
& $UV pip install --python "$VENV\Scripts\python.exe" -e $CODE *>> "$LOGS\installation.log"
& "$VENV\Scripts\python.exe" -c "import atlas.server" 2>> "$LOGS\installation.log"
if ($LASTEXITCODE -ne 0) { Fehler "Pakete unvollständig – Details in $LOGS\installation.log" }
Info "Python-Umgebung bereit"

Schritt 5 "Grundeinstellungen"
$release = @{}
if (Test-Path "$RES\release.json") { $release = Get-Content "$RES\release.json" -Raw | ConvertFrom-Json }
$angaben = @{ release_repo = $release.repo; lokal = [bool]$Lokal } | ConvertTo-Json -Compress
$angaben | & "$VENV\Scripts\jarvis.exe" einrichten --stdin 2>> "$LOGS\installation.log"
if ($release.sha) {
  @{ sha = $release.sha; repo = $release.repo; stand = (Get-Date -Format "yyyy-MM-dd HH:mm") } | ConvertTo-Json -Compress |
    Set-Content -Encoding UTF8 (Join-Path $ATLAS "version.json")
}
Info "Schlüssel richtest du gleich im Setup-Guide ein (nur im Windows-Anmeldeinformationsspeicher)."

Schritt 6 "Autostart und Verknüpfungen"
$sh = New-Object -ComObject WScript.Shell
$ico = Join-Path $CODE "windows\jarvis.ico"
function Verknuepfung($ziel, $vbs, $name) {
  $l = $sh.CreateShortcut($ziel); $l.TargetPath = "$env:WINDIR\System32\wscript.exe"
  $l.Arguments = "`"$CODE\windows\$vbs`""; $l.WorkingDirectory = $ATLAS; $l.Description = $name
  if (Test-Path $ico) { $l.IconLocation = $ico }; $l.Save()
}
$autostart = [Environment]::GetFolderPath("Startup")
$startmenue = Join-Path ([Environment]::GetFolderPath("Programs")) "JARVIS"
New-Item -ItemType Directory -Force $startmenue | Out-Null
Verknuepfung (Join-Path $autostart "JARVIS Kern.lnk") "kern.vbs" "JARVIS-Kern (Hintergrund)"
Verknuepfung (Join-Path $startmenue "JARVIS.lnk") "fenster.vbs" "JARVIS"
Verknuepfung (Join-Path ([Environment]::GetFolderPath("Desktop")) "JARVIS.lnk") "fenster.vbs" "JARVIS"
$d = $sh.CreateShortcut((Join-Path $startmenue "JARVIS deinstallieren.lnk"))
$d.TargetPath = "powershell.exe"; $d.Arguments = "-NoProfile -ExecutionPolicy Bypass -File `"$CODE\windows\deinstallieren.ps1`""; $d.Save()
Info "Startet bei jeder Anmeldung; „JARVIS“ im Startmenü und auf dem Desktop"

Schritt 7 "Lokales Sprachmodell (optional)"
if (-not $Lokal) {
  $a = Read-Host "  Lokales Modell einrichten? Privates bleibt dann auf dem PC (ca. 7 GB, 16 GB RAM empfohlen) [j/N]"
  $Lokal = $a -match "^[jJyY]"
}
if ($Lokal) {
  $ollama = Join-Path $env:LOCALAPPDATA "Programs\Ollama\ollama.exe"
  if (-not (Test-Path $ollama) -and -not (Get-Command ollama -ErrorAction SilentlyContinue)) {
    Info "Lade Ollama …"
    $setup = Join-Path $env:TEMP "OllamaSetup.exe"
    try { Invoke-WebRequest -UseBasicParsing -OutFile $setup https://ollama.com/download/OllamaSetup.exe
          Start-Process $setup -ArgumentList "/VERYSILENT", "/NORESTART" -Wait } catch { Warn "Ollama konnte nicht geladen werden – JARVIS nutzt dann nur das Cloud-Modell." }
  }
  if (Test-Path $ollama) {
    Start-Process -WindowStyle Hidden $ollama -ArgumentList "pull qwen3.5:9b"
    Start-Process -WindowStyle Hidden $ollama -ArgumentList "pull bge-m3"
    Info "Sprachmodell lädt im Hintergrund – bis dahin antwortet JARVIS über das Cloud-Modell."
  }
} else { Info "übersprungen (später: Einstellungen → Verbindungen → Lokales Modell)" }

Schritt 8 "JARVIS starten"
Start-Process "$env:WINDIR\System32\wscript.exe" -ArgumentList "`"$CODE\windows\kern.vbs`""
$port = & "$VENV\Scripts\python.exe" -c "from atlas.paths import PORT; print(PORT)"
$ok = $false
for ($i = 0; $i -lt 60; $i++) { try { Invoke-WebRequest -UseBasicParsing -TimeoutSec 2 "http://127.0.0.1:$port/" | Out-Null; $ok = $true; break } catch { Start-Sleep 2 } }
if (-not $ok) { Warn "Der Kern startet langsam – Details in $LOGS\core.log" } else { Info "JARVIS-Kern läuft (Port $port)" }
if (Test-Path "$ATLAS\programm.vorher") { Remove-Item -Recurse -Force "$ATLAS\programm.vorher" -ErrorAction SilentlyContinue }
if (-not $OhneFenster) { Start-Process "$env:WINDIR\System32\wscript.exe" -ArgumentList "`"$CODE\windows\fenster.vbs`"" }
Write-Host ""; Write-Host "Fertig. Im JARVIS-Fenster führt dich der Setup-Guide durch die Schlüssel." -ForegroundColor Green
