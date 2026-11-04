# JARVIS-Kern unter Windows: startet den Kern und startet ihn nach jedem Beenden wieder (wie launchd am Mac).
# Spielt bereitgelegte Updates (programm.neu) vor dem Start ein; nach 4 Abstürzen in 3 Minuten kommt die
# vorherige Fassung zurück. Wird vom Autostart (kern.vbs) unsichtbar gestartet.
$ATLAS = Join-Path $env:USERPROFILE ".atlas"
$CODE = Join-Path $ATLAS "programm"; $VENV = Join-Path $ATLAS "venv"; $LOGS = Join-Path $ATLAS "logs"
$UV = Join-Path $env:USERPROFILE ".local\bin\uv.exe"
New-Item -ItemType Directory -Force $LOGS | Out-Null
$mutex = New-Object System.Threading.Mutex($false, "Local\JARVIS-Kern")
if (-not $mutex.WaitOne(0)) { exit }              # läuft schon
Set-Location $ATLAS                                # nie im Programmordner stehen – sonst ist er für Updates gesperrt
$env:PYTHONIOENCODING = "utf-8"
$abstuerze = @()
while ($true) {
  $neu = "$CODE.neu"
  if (Test-Path "$neu\atlas\server.py") {
    try {
      if (Test-Path "$CODE.vorher") { Remove-Item -Recurse -Force "$CODE.vorher" }
      Rename-Item $CODE "programm.vorher" -ErrorAction Stop
      Rename-Item $neu "programm" -ErrorAction Stop
      if (Test-Path "$CODE\.pakete") {
        & $UV pip install -q --python "$VENV\Scripts\python.exe" -e $CODE *>> "$LOGS\installation.log"
        Remove-Item "$CODE\.pakete" -ErrorAction SilentlyContinue
      }
      Add-Content "$LOGS\core.log" "$(Get-Date -Format s) Update eingespielt"
    } catch { Add-Content "$LOGS\core.log" "$(Get-Date -Format s) Update-Tausch fehlgeschlagen: $_" }
  }
  & "$VENV\Scripts\atlas-core.exe" *>> "$LOGS\core.log"
  $jetzt = Get-Date
  $abstuerze = @($abstuerze | Where-Object { ($jetzt - $_).TotalSeconds -lt 180 }) + $jetzt
  if ($abstuerze.Count -ge 4 -and (Test-Path "$CODE.vorher\atlas\server.py")) {
    try {
      if (Test-Path "$CODE.defekt") { Remove-Item -Recurse -Force "$CODE.defekt" }
      Rename-Item $CODE "programm.defekt"; Rename-Item "$CODE.vorher" "programm"
      Add-Content "$LOGS\core.log" "$(Get-Date -Format s) Neue Version startet nicht – vorherige wiederhergestellt"
    } catch {}
    $abstuerze = @()
  }
  Start-Sleep -Seconds 3
}
