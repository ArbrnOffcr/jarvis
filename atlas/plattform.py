"""Plattform-Schicht: macOS und Windows an einer Stelle.

Alles, was sich zwischen Mac und Windows unterscheidet (Pfade der Python-Umgebung, Dateien öffnen, Ordner
wählen, Dienst neu starten, welche Funktionen es überhaupt gibt), steht hier. Der übrige Code fragt nur
`plattform.MAC` / `plattform.WINDOWS` oder ruft die Helfer auf.

Windows-Stand (Vorbereitung der Portierung): Kern, Dashboard (Edge-App-Fenster), Claude & andere KI-Anbieter,
lokales Modell (Ollama für Windows), Archiv (OneDrive, iCloud für Windows, lokal), Mail (IMAP), Kalender
(iCloud über CalDAV), Immobilien, Projekte, Telegram, Fahrzeuge, NUKI, Updates und Sperrliste.
Nur auf dem Mac: Apple-Erinnerungen/Notizen/Kontakte (JXA), iMessage, HomeKit-Kurzbefehle, Apple Music,
Texterkennung mit Apple Vision, Excel-Steuerung per AppleScript."""
from __future__ import annotations

import os
import re
import subprocess
import sys
from pathlib import Path

MAC = sys.platform == "darwin"
WINDOWS = sys.platform == "win32"
NAME = "macOS" if MAC else "Windows" if WINDOWS else sys.platform

# Werkzeuge, die es nur auf dem Mac gibt (AppleScript/JXA, iMessage, HomeKit, Apple Music)
NUR_MAC_WERKZEUGE = re.compile(r"^(erinnerung|notiz|einkauf|kontakt|imessage|nachricht|musik|podcast|zuhause_steuern|"
                               r"kurzbefehl|timer|wecker)")
# Hintergrunddienste, die es nur auf dem Mac gibt (Namen wie in server.run)
NUR_MAC_DIENSTE = {"iMessage", "Timer", "Musik"}


def venv_python(venv: Path) -> Path:
    return venv / ("Scripts/python.exe" if WINDOWS else "bin/python")


def venv_programm(venv: Path, name: str) -> Path:
    return venv / ("Scripts" if WINDOWS else "bin") / (name + (".exe" if WINDOWS else ""))


def uv() -> str:
    import shutil
    if shutil.which("uv"):
        return shutil.which("uv")
    kandidaten = ([Path.home() / ".local/bin/uv.exe", Path.home() / ".cargo/bin/uv.exe"] if WINDOWS
                  else [Path.home() / ".local/bin/uv", Path("/opt/homebrew/bin/uv")])
    return str(next((k for k in kandidaten if k.exists()), kandidaten[0]))


def oeffnen(pfad: str | Path) -> None:
    """Datei oder Ordner mit dem Standardprogramm öffnen."""
    if WINDOWS:
        os.startfile(str(pfad))  # type: ignore[attr-defined]
    else:
        subprocess.run(["open", str(pfad)], timeout=15)


def im_ordner_zeigen(pfad: str | Path) -> None:
    """Explorer/Finder öffnen und die Datei markieren."""
    if WINDOWS:
        subprocess.run(["explorer", "/select,", str(pfad)], timeout=15)
    else:
        subprocess.run(["open", "-R", str(pfad)], timeout=15)


def ordner_waehlen(titel: str, start: str = "") -> str:
    """Systemdialog „Ordner wählen“. Rückgabe: Pfad oder "" bei Abbruch."""
    if WINDOWS:
        ps = ("Add-Type -AssemblyName System.Windows.Forms;"
              "$d = New-Object System.Windows.Forms.FolderBrowserDialog;"
              f"$d.Description = '{titel.replace(chr(39), '')}';"
              + (f"$d.SelectedPath = '{start.replace(chr(39), '')}';" if start else "")
              + "if ($d.ShowDialog() -eq 'OK') { $d.SelectedPath }")
        r = subprocess.run(["powershell", "-NoProfile", "-STA", "-Command", ps], capture_output=True, text=True, timeout=600)
        return r.stdout.strip()
    ort = f' default location (POSIX file "{start}")' if start else ""
    r = subprocess.run(["osascript", "-e", 'tell application "System Events" to activate',
                        "-e", f'set f to choose folder with prompt "{titel}"{ort}', "-e", "return POSIX path of f"],
                       capture_output=True, text=True, timeout=600)
    return r.stdout.strip().rstrip("/") if r.returncode == 0 else ""


def dienst_neustarten() -> bool:
    """JARVIS-Kern neu starten. Windows: der Startskript-Kreislauf (start.ps1) startet ihn sofort wieder."""
    if WINDOWS:
        r = subprocess.run(["schtasks", "/Run", "/TN", "JARVIS Kern"], capture_output=True)
        pid = (Path.home() / ".atlas" / "core.pid")
        try:
            subprocess.run(["taskkill", "/PID", pid.read_text().strip(), "/F"], capture_output=True)
        except OSError:
            pass
        return r.returncode == 0
    return False


def benutzer_nummer() -> int:
    """Kleine Zahl je Benutzerkonto (für den Port, damit zwei Konten parallel laufen)."""
    if hasattr(os, "getuid"):
        return os.getuid()
    import getpass
    import zlib
    return zlib.crc32(getpass.getuser().encode("utf-8"))


# ------------------------------------------------------------------ Sprache (Erkennung und Ersatzstimme)
_WHISPER = {}
_WHISPER_ZEIT = [0.0]


def whisper_zuletzt() -> float:
    return _WHISPER_ZEIT[0]


def whisper_geladen() -> bool:
    if WINDOWS:
        return bool(_WHISPER)
    try:
        from mlx_whisper.transcribe import ModelHolder
        return ModelHolder.model is not None
    except Exception:
        return False


def whisper_entladen() -> bool:
    """Spracherkennung aus dem Speicher nehmen (Sparmodus); beim nächsten Gebrauch wird sie neu geladen."""
    import gc
    if not whisper_geladen():
        return False
    if WINDOWS:
        _WHISPER.clear()
    else:
        from mlx_whisper.transcribe import ModelHolder
        ModelHolder.model, ModelHolder.model_path = None, None
        gc.collect()
        try:
            import mlx.core as mx
            (getattr(mx, "clear_cache", None) or mx.metal.clear_cache)()
        except Exception:
            pass
    gc.collect()
    return True


def whisper(audio, modell: str, **optionen) -> dict:
    """Spracherkennung. Mac: mlx-whisper (Apple-Chip). Windows: faster-whisper (CPU, int8).
    Rückgabe wie mlx_whisper: {"text", "language", "segments": [{"start", "end", "text"}]}."""
    import time
    _WHISPER_ZEIT[0] = time.time()
    if not WINDOWS:
        import mlx_whisper
        try:
            return mlx_whisper.transcribe(audio, path_or_hf_repo=modell, **optionen)
        finally:
            _WHISPER_ZEIT[0] = time.time()
    from faster_whisper import WhisperModel
    name = str(modell).rsplit("/", 1)[-1].replace("whisper-", "") or "large-v3-turbo"
    if name not in _WHISPER:
        _WHISPER.clear()
        _WHISPER[name] = WhisperModel(name, device="cpu", compute_type="int8")
    segs, info = _WHISPER[name].transcribe(audio, language=optionen.get("language"),
                                           initial_prompt=optionen.get("initial_prompt"),
                                           condition_on_previous_text=bool(optionen.get("condition_on_previous_text", False)),
                                           vad_filter=True)
    liste = [{"start": s.start, "end": s.end, "text": s.text} for s in segs]
    _WHISPER_ZEIT[0] = time.time()
    return {"text": "".join(s["text"] for s in liste), "language": info.language, "segments": liste}


def ersatzstimme_wav(text: str, rate: int = 22050) -> bytes:
    """Ersatzstimme ohne ElevenLabs unter Windows: Sprachausgabe von Windows (SAPI) als WAV."""
    import tempfile
    with tempfile.TemporaryDirectory() as d:
        ziel = Path(d) / "a.wav"
        txt = Path(d) / "t.txt"
        txt.write_text(text, encoding="utf-8")
        ps = ("Add-Type -AssemblyName System.Speech;"
              "$s = New-Object System.Speech.Synthesis.SpeechSynthesizer;"
              "$v = $s.GetInstalledVoices() | Where-Object { $_.VoiceInfo.Culture.Name -like 'de-*' } | Select-Object -First 1;"
              "if ($v) { $s.SelectVoice($v.VoiceInfo.Name) };"
              f"$f = New-Object System.Speech.AudioFormat.SpeechAudioFormatInfo({rate}, 'Sixteen', 'Mono');"
              f"$s.SetOutputToWaveFile('{ziel}', $f);"
              f"$s.Speak([IO.File]::ReadAllText('{txt}', [Text.Encoding]::UTF8)); $s.Dispose()")
        subprocess.run(["powershell", "-NoProfile", "-Command", ps], capture_output=True, timeout=120, check=True)
        return ziel.read_bytes()


def papierkorb(pfad: str | Path) -> Path | None:
    """Datei in den Papierkorb legen (wiederherstellbar). Mac: ~/.Trash, Windows: Papierkorb über die Shell."""
    import shutil
    p = Path(pfad)
    if WINDOWS:
        befehl = ("Add-Type -AssemblyName Microsoft.VisualBasic; [Microsoft.VisualBasic.FileIO.FileSystem]::DeleteFile("
                  f"'{str(p).replace(chr(39), chr(39) * 2)}', 'OnlyErrorDialogs', 'SendToRecycleBin')")
        subprocess.run(["powershell", "-NoProfile", "-Command", befehl], capture_output=True, timeout=60, check=True)
        return None
    korb = Path.home() / ".Trash"
    korb.mkdir(exist_ok=True)
    ziel, i = korb / p.name, 1
    while ziel.exists():
        ziel, i = korb / f"{p.stem} ({i}){p.suffix}", i + 1
    shutil.move(str(p), str(ziel))
    return ziel


def leerlauf_sekunden() -> float | None:
    """Seit wann niemand Maus oder Tastatur benutzt hat (Sekunden); None, wenn unbekannt."""
    try:
        if WINDOWS:
            import ctypes

            class _LII(ctypes.Structure):
                _fields_ = [("cbSize", ctypes.c_uint), ("dwTime", ctypes.c_uint)]
            lii = _LII(); lii.cbSize = ctypes.sizeof(_LII)
            if not ctypes.windll.user32.GetLastInputInfo(ctypes.byref(lii)):
                return None
            return (ctypes.windll.kernel32.GetTickCount() - lii.dwTime) / 1000
        if MAC:
            out = subprocess.run(["ioreg", "-c", "IOHIDSystem", "-d", "4"], capture_output=True, text=True,
                                 timeout=5).stdout
            m = re.search(r'"HIDIdleTime" = (\d+)', out)
            return int(m.group(1)) / 1e9 if m else None
    except Exception:
        return None
    return None


def am_netzteil() -> bool:
    """Hängt der Rechner am Netzteil? (Ohne Akku – z. B. Mac mini – immer ja.)"""
    try:
        if WINDOWS:
            import ctypes

            class _SPS(ctypes.Structure):
                _fields_ = [("ACLineStatus", ctypes.c_ubyte), ("BatteryFlag", ctypes.c_ubyte),
                            ("BatteryLifePercent", ctypes.c_ubyte), ("SystemStatusFlag", ctypes.c_ubyte),
                            ("BatteryLifeTime", ctypes.c_ulong), ("BatteryFullLifeTime", ctypes.c_ulong)]
            s = _SPS()
            return bool(ctypes.windll.kernel32.GetSystemPowerStatus(ctypes.byref(s))) and s.ACLineStatus == 1
        if MAC:
            out = subprocess.run(["pmset", "-g", "batt"], capture_output=True, text=True, timeout=5).stdout
            return "AC Power" in out or "Netzstrom" in out
    except Exception:
        return False
    return False


_WACH = {"proc": None, "an": False}


def wach_halten(an: bool) -> bool:
    """Ruhezustand verhindern (Bildschirm darf ausgehen) – nur solange JARVIS nachts arbeitet.
    Mac: caffeinate -i (endet automatisch, wenn der Kern endet). Windows: SetThreadExecutionState."""
    if an == _WACH["an"]:
        return False
    try:
        if WINDOWS:
            import ctypes
            ES_CONTINUOUS, ES_SYSTEM_REQUIRED = 0x80000000, 0x00000001
            ctypes.windll.kernel32.SetThreadExecutionState(ES_CONTINUOUS | (ES_SYSTEM_REQUIRED if an else 0))
        elif MAC:
            if an:
                _WACH["proc"] = subprocess.Popen(["caffeinate", "-i", "-w", str(os.getpid())],
                                                 stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            elif _WACH["proc"]:
                _WACH["proc"].terminate()
                _WACH["proc"] = None
        else:
            return False
    except Exception:
        return False
    _WACH["an"] = an
    return True
