# Öffnet JARVIS als eigenes Fenster (Microsoft Edge im App-Modus, eigenes Profil: Mikrofon-Freigabe bleibt).
$ATLAS = Join-Path $env:USERPROFILE ".atlas"; $PY = Join-Path $ATLAS "venv\Scripts\python.exe"
$zeilen = & $PY -c "from atlas.paths import PORT; from atlas.keystore import core_token; print(PORT); print(core_token())"
$port = $zeilen[0].Trim(); $token = $zeilen[1].Trim()
$url = "http://127.0.0.1:$port/?token=$token"
$laeuft = $false
try { Invoke-WebRequest -UseBasicParsing -TimeoutSec 2 "http://127.0.0.1:$port/" | Out-Null; $laeuft = $true } catch {}
if (-not $laeuft) {
  Start-Process "$env:WINDIR\System32\wscript.exe" -ArgumentList "`"$PSScriptRoot\kern.vbs`""
  for ($i = 0; $i -lt 45; $i++) { try { Invoke-WebRequest -UseBasicParsing -TimeoutSec 2 "http://127.0.0.1:$port/" | Out-Null; break } catch { Start-Sleep 2 } }
}
$edge = @("${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe", "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe") |
  Where-Object { Test-Path $_ } | Select-Object -First 1
if ($edge) { Start-Process $edge -ArgumentList "--app=$url", "--user-data-dir=`"$ATLAS\fenster-profil`"", "--window-size=1440,900", "--no-first-run" }
else { Start-Process $url }
