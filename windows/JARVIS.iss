; JARVIS-Setup.exe (Inno Setup) – wird bei jeder Veröffentlichung automatisch auf GitHub gebaut
; (.github/workflows/windows-setup.yml). Packt das Paket aus und ruft installieren.ps1 auf.
#define Version GetEnv("JARVIS_VERSION")
[Setup]
AppName=JARVIS
AppVersion={#Version}
AppPublisher=JARVIS
DefaultDirName={localappdata}\JARVIS-Setup
PrivilegesRequired=lowest
OutputBaseFilename=JARVIS-Setup-{#Version}
OutputDir=..\ausgabe
Compression=lzma2
SolidCompression=yes
DisableDirPage=yes
DisableProgramGroupPage=yes
SetupIconFile=jarvis.ico
WizardStyle=modern
[Languages]
Name: "de"; MessagesFile: "compiler:Languages\German.isl"
[Files]
Source: "..\paket\*"; DestDir: "{app}"; Flags: recursesubdirs ignoreversion
[Run]
Filename: "powershell.exe"; Parameters: "-NoProfile -ExecutionPolicy Bypass -File ""{app}\installer\installieren.ps1"""; StatusMsg: "JARVIS wird eingerichtet …"; Flags: waituntilterminated
