' Startet den JARVIS-Kern unsichtbar im Hintergrund (Autostart bei der Anmeldung).
Set sh = CreateObject("WScript.Shell")
ordner = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)
sh.Run "powershell.exe -NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File """ & ordner & "\start.ps1""", 0, False
