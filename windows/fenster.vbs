' Öffnet das JARVIS-Fenster ohne Konsolenfenster.
Set sh = CreateObject("WScript.Shell")
ordner = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)
sh.Run "powershell.exe -NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File """ & ordner & "\fenster.ps1""", 0, False
