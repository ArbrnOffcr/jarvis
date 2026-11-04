# JARVIS von diesem PC entfernen. Einstellungen, Gedächtnis und Schlüssel bleiben erhalten (für eine Neuinstallation);
# wer alles löschen will, löscht danach den Ordner %USERPROFILE%\.atlas.
$ATLAS = Join-Path $env:USERPROFILE ".atlas"
$a = Read-Host "JARVIS wirklich deinstallieren? [j/N]"; if ($a -notmatch "^[jJ]") { exit }
if (Test-Path "$ATLAS\core.pid") { Stop-Process -Id (Get-Content "$ATLAS\core.pid") -Force -ErrorAction SilentlyContinue }
Get-CimInstance Win32_Process -Filter "Name='powershell.exe'" | Where-Object { $_.CommandLine -like "*windows\start.ps1*" } |
  ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
Remove-Item (Join-Path ([Environment]::GetFolderPath("Startup")) "JARVIS Kern.lnk") -ErrorAction SilentlyContinue
Remove-Item (Join-Path ([Environment]::GetFolderPath("Desktop")) "JARVIS.lnk") -ErrorAction SilentlyContinue
Remove-Item -Recurse (Join-Path ([Environment]::GetFolderPath("Programs")) "JARVIS") -ErrorAction SilentlyContinue
Start-Sleep 1
Remove-Item -Recurse -Force "$ATLAS\programm", "$ATLAS\venv" -ErrorAction SilentlyContinue
Write-Host "JARVIS ist entfernt. Deine Daten liegen weiter in $ATLAS (und im Cloud-Speicher)."
Read-Host "Enter zum Beenden"
