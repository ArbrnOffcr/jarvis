"""Schlüssel und Verbindungen über die Oberfläche einrichten (⚙ Einstellungen → Verbindungen).

Alles, was sonst im Terminal ginge (`jarvis setup …`), geht hier mit Eingabefeldern: Claude, ElevenLabs
(mit Stimmenauswahl), iCloud, Telegram, Google-Bilder, YouTube, Name/Wohnort, Archiv-Ordner und das lokale
Modell. Schlüssel werden vor dem Speichern geprüft und landen nur im Schlüsselbund dieses Macs; angezeigt
werden sie nie wieder, nur die letzten vier Zeichen."""
import json
import os
import shutil
import subprocess
import tarfile
import tempfile
import threading
import time
from pathlib import Path

import httpx

from atlas.keystore import SERVICE, get_secret, set_secret
from atlas.paths import LOCAL_DIR, private_dir, read_private_json, write_private_json
from atlas.tools import ToolError

from atlas.voice import STANDARD_STIMME        # ElevenLabs „Daniel“ – ruhig, britisch, spricht auch Deutsch
ART = ("anthropic", "elevenlabs", "telegram", "serper", "youtube", "nuki")
LOKAL_MODELL = "qwen3.5:9b"
OLLAMA = ["/opt/homebrew/bin/ollama", "/usr/local/bin/ollama", str(LOCAL_DIR / "ollama" / "ollama"),
          "/Applications/Ollama.app/Contents/Resources/ollama"]
_laden: dict = {}                                 # laufender Modell-Download


def _maske(v: str | None) -> str:
    return f"…{v[-4:]}" if v and len(v) > 8 else ("gesetzt" if v else "")


def neustart(core, grund: str) -> None:
    """Kern kurz neu starten (launchd startet ihn sofort wieder) – für Änderungen, die beim Start gelesen werden."""
    core.audit.log("einstellungen", neustart=grund)
    core.broadcast({"type": "update", "commit": grund})
    threading.Timer(1.5, lambda: os._exit(0)).start()


# ------------------------------------------------------------------ Übersicht
def status(core) -> dict:
    from atlas import voice
    from atlas.telegram import settings as tg
    st = voice.settings()
    cfg = core.cfg
    w = cfg.get("wetter") or {}
    return {
        "schluessel": {a: {"gesetzt": bool(get_secret(a)), "maske": _maske(get_secret(a))} for a in ART},
        "stimme": {"id": st.get("stimme_de") or "", "standard": STANDARD_STIMME},
        "icloud": {"apple_id": get_secret("icloud_apple_id") or "", "mail": get_secret("icloud_email") or "",
                   "gesetzt": bool(get_secret("icloud_app_pw"))},
        "telegram": {"verbunden": bool(tg().get("chat_id")), "bot": _bot_name(get_secret("telegram"))},
        "profil": {"name": cfg.get("name") or core.name, "anrede": cfg.get("anrede", "Sir"), "ort": w.get("ort", ""),
                   "standort": core.standort.status() if hasattr(core, "standort") else {"bekannt": False}},
        "archiv": str(core.archiv.archive) if core.archiv and core.archiv.archive else "",
        "lokal": lokal_status(),
    }


_bot_cache: dict = {}


def _bot_name(token: str | None) -> str:
    if not token:
        return ""
    if token in _bot_cache:
        return _bot_cache[token]
    try:
        n = httpx.get(f"https://api.telegram.org/bot{token}/getMe", timeout=8).json()["result"]["username"]
    except Exception:
        n = ""
    _bot_cache[token] = n
    return n


# ------------------------------------------------------------------ Schlüssel
def pruefen(art: str, wert: str) -> tuple[bool, str]:
    try:
        if art == "anthropic":
            r = httpx.get("https://api.anthropic.com/v1/models", params={"limit": 1}, timeout=15,
                          headers={"x-api-key": wert, "anthropic-version": "2023-06-01"})
        elif art == "elevenlabs":
            r = httpx.get("https://api.elevenlabs.io/v1/models", headers={"xi-api-key": wert}, timeout=15)
            if r.status_code in (401, 403) and "permission" in r.text:
                return True, "angenommen (eingeschränkter Schlüssel – Sprachausgabe reicht)"
        elif art == "telegram":
            r = httpx.get(f"https://api.telegram.org/bot{wert}/getMe", timeout=15)
        elif art == "serper":
            r = httpx.post("https://google.serper.dev/images", json={"q": "test", "num": 1},
                           headers={"X-API-KEY": wert}, timeout=15)
        elif art == "nuki":
            r = httpx.get("https://api.nuki.io/smartlock", headers={"Authorization": f"Bearer {wert}"}, timeout=15)
        elif art == "youtube":
            r = httpx.get("https://www.googleapis.com/youtube/v3/search",
                          params={"part": "id", "maxResults": 1, "q": "test", "key": wert}, timeout=15)
        else:
            return False, "unbekannt"
    except httpx.HTTPError:
        return False, "Keine Verbindung – Internet prüfen"
    if r.status_code == 200:
        return True, "gültig"
    if r.status_code in (400, 401, 403):
        return False, f"Schlüssel wird nicht angenommen ({r.status_code})"
    return False, f"Antwort {r.status_code} – später erneut versuchen"


def schluessel_setzen(core, art: str, wert: str) -> dict:
    wert = (wert or "").strip()
    if art not in ART or not wert:
        raise ToolError("Schlüssel fehlt")
    ok, text = pruefen(art, wert)
    if not ok:
        raise ToolError(text)
    set_secret(art, wert)
    if art == "anthropic":                        # sofort wirksam, ohne Neustart
        from atlas.providers import ClaudeProvider
        core.providers["claude"] = ClaudeProvider(wert, core.cfg["recherche"], (core.cfg.get("wetter") or {}).get("ort", ""))
    if art == "telegram":                         # neuer Bot: Chat neu verbinden
        write_private_json("telegram.json", {"chat_id": None})
        _bot_cache.clear()
        threading.Thread(target=_telegram_verbinden, args=(wert,), daemon=True).start()
        return {"ok": True, "text": f"Bot @{_bot_name(wert)} erkannt – jetzt in Telegram „Start“ drücken.",
                "warten": True}
    if art == "elevenlabs":
        from atlas import voice
        if not voice.settings().get("stimme_de"):
            voice.save_settings(stimme_de=STANDARD_STIMME)
    core.audit.log("einstellungen", schluessel=art)
    return {"ok": True, "text": f"✓ {text} – gespeichert"}


def schluessel_loeschen(core, art: str) -> dict:
    import keyring
    if art not in ART:
        raise ToolError("unbekannt")
    try:
        keyring.delete_password(SERVICE, art)
    except Exception:
        pass
    if art == "telegram":
        write_private_json("telegram.json", {"chat_id": None})
    core.audit.log("einstellungen", entfernt=art)
    return {"ok": True}


def _telegram_verbinden(token: str) -> None:
    from atlas import telegram
    chat = telegram.setup_chat_id(token, wait_seconds=180)
    if chat:
        try:
            httpx.post(f"https://api.telegram.org/bot{token}/sendMessage",
                       json={"chat_id": chat, "text": "Zu Diensten. JARVIS ist verbunden."}, timeout=15)
        except httpx.HTTPError:
            pass


# ------------------------------------------------------------------ Stimme
def stimmen(core) -> list[dict]:
    key = get_secret("elevenlabs")
    if not key:
        return []
    try:
        r = httpx.get("https://api.elevenlabs.io/v1/voices", headers={"xi-api-key": key}, timeout=15)
        r.raise_for_status()
        out = [{"id": v["voice_id"], "name": v["name"],
                "info": ", ".join(x for x in ((v.get("labels") or {}).get("gender"), (v.get("labels") or {}).get("accent"),
                                               (v.get("labels") or {}).get("description")) if x)}
               for v in r.json().get("voices", [])]
    except Exception:
        out = []
    if not any(v["id"] == STANDARD_STIMME for v in out):
        out.insert(0, {"id": STANDARD_STIMME, "name": "Daniel (Standard)", "info": "ruhig, britisch"})
    return out


def stimme_setzen(sid: str) -> dict:
    from atlas import voice
    voice.save_settings(stimme_de=(sid or "").strip() or STANDARD_STIMME)
    return {"ok": True}


# ------------------------------------------------------------------ iCloud
def icloud_setzen(core, apple_id: str, mail: str, pw: str) -> dict:
    from atlas.einrichtung import icloud_pruefen
    apple_id, pw = (apple_id or "").strip(), (pw or "").strip().replace(" ", "")
    mail = (mail or "").strip() or apple_id
    if not apple_id or not pw:
        raise ToolError("Apple-ID und App-Passwort angeben")
    cal, mail_ok = icloud_pruefen(apple_id, mail, pw)
    if not (cal or mail_ok):
        raise ToolError("Anmeldung abgelehnt – App-spezifisches Passwort prüfen (nicht das normale Apple-Passwort)")
    set_secret("icloud_apple_id", apple_id)
    set_secret("icloud_email", mail)
    set_secret("icloud_app_pw", pw)
    neustart(core, "iCloud verbunden")
    return {"ok": True, "text": f"✓ Kalender {'✓' if cal else '✗'} · Mail {'✓' if mail_ok else '✗'} – JARVIS startet neu"}


# ------------------------------------------------------------------ Profil und Archiv
def _config_aendern(aenderung) -> None:
    import yaml
    from atlas.config import SAMPLE
    pfad = private_dir() / "config.yaml"
    try:
        text = pfad.read_text(encoding="utf-8")
        cfg = yaml.safe_load(text) or {}
    except (OSError, yaml.YAMLError):
        text, cfg = "", {}
    aenderung(cfg)
    kopf = "".join(z + "\n" for z in text.splitlines() if z.startswith("#")) or SAMPLE
    pfad.write_text(kopf + "\n" + yaml.safe_dump(cfg, allow_unicode=True, sort_keys=False), encoding="utf-8")


def profil_setzen(core, name: str, anrede: str, ort: str) -> dict:
    from atlas.standort import OrtNichtGefunden, geocode
    w = None
    alt = (core.cfg.get("wetter") or {}).get("ort", "")
    if ort and ort.strip() and ort.strip() != alt:
        try:
            w = geocode(ort.strip())
        except OrtNichtGefunden as e:
            raise ToolError(str(e))

    def aendern(cfg):
        if name is not None:
            cfg["name"] = name.strip()
        if anrede is not None:
            cfg["anrede"] = anrede.strip()
        if w:
            cfg["wetter"] = w
    _config_aendern(aendern)
    neustart(core, "Profil gespeichert")
    return {"ok": True, "text": "✓ Gespeichert – JARVIS startet neu"}


def archiv_waehlen(core) -> dict:
    """macOS-Dialog „Ordner wählen“ auf diesem Mac öffnen."""
    skript = ('tell application "System Events" to activate\n'
              'set f to choose folder with prompt "Dokumenten-Ordner für JARVIS wählen"\n'
              'return POSIX path of f')
    try:
        r = subprocess.run(["osascript", "-e", skript], capture_output=True, text=True, timeout=300)
    except (OSError, subprocess.SubprocessError):
        raise ToolError("Ordnerauswahl nur am Mac möglich")
    pfad = r.stdout.strip().rstrip("/")
    if r.returncode or not pfad:
        return {"ok": False, "text": "Abgebrochen"}
    _config_aendern(lambda cfg: cfg.__setitem__("archive_path", pfad))
    neustart(core, "Archiv-Ordner gesetzt")
    return {"ok": True, "pfad": pfad, "text": "✓ Ordner gesetzt – JARVIS startet neu und baut die Suche auf"}


def archiv_entfernen(core) -> dict:
    _config_aendern(lambda cfg: cfg.pop("archive_path", None))
    neustart(core, "Archiv-Ordner entfernt")
    return {"ok": True}


# ------------------------------------------------------------------ Lokales Modell
def _ollama() -> str | None:
    for p in [shutil.which("ollama"), *OLLAMA]:
        if p and Path(p).exists():
            return p
    return None


def lokal_status() -> dict:
    try:
        tags = httpx.get("http://127.0.0.1:11434/api/tags", timeout=2).json().get("models", [])
        modelle = [m["name"] for m in tags]
        laeuft = True
    except Exception:
        modelle, laeuft = [], False
    p = _laden.get("prozess")
    return {"installiert": bool(_ollama()), "laeuft": laeuft, "modelle": modelle,
            "bereit": any(m.split(":")[0] in ("qwen3.5", "qwen3", "llama3.1") for m in modelle),
            "laedt": bool(_laden.get("aktiv") or (p and p.poll() is None)), "fortschritt": _laden.get("stand", "")}


def lokal_einrichten(core) -> dict:
    if _laden.get("prozess") and _laden["prozess"].poll() is None:
        return {"ok": True, "text": "Lädt bereits …"}
    threading.Thread(target=_lokal_job, daemon=True).start()
    return {"ok": True, "text": "Lokales Modell wird eingerichtet (ca. 7 GB, läuft im Hintergrund)."}


def _lokal_job() -> None:
    _laden["aktiv"] = True
    log = LOCAL_DIR / "logs" / "modelle.log"
    log.parent.mkdir(parents=True, exist_ok=True)
    try:
        b = _ollama()
        if not b:
            _laden["stand"] = "Lade Ollama …"
            ziel = LOCAL_DIR / "ollama"
            ziel.mkdir(parents=True, exist_ok=True)
            with tempfile.TemporaryDirectory() as tmp:
                tgz = Path(tmp) / "o.tgz"
                with httpx.stream("GET", "https://github.com/ollama/ollama/releases/latest/download/ollama-darwin.tgz",
                                  follow_redirects=True, timeout=900) as r:
                    r.raise_for_status()
                    with open(tgz, "wb") as f:
                        for c in r.iter_bytes():
                            f.write(c)
                with tarfile.open(tgz) as t:
                    t.extractall(ziel, filter="data")
            kand = [p for p in ziel.rglob("ollama") if p.is_file()]
            if not kand:
                raise RuntimeError("Ollama-Paket unvollständig")
            kand[0].chmod(0o755)
            if kand[0] != ziel / "ollama":
                (ziel / "ollama").unlink(missing_ok=True)
                (ziel / "ollama").symlink_to(kand[0])
            b = str(ziel / "ollama")
        if not lokal_status()["laeuft"]:
            _laden["stand"] = "Starte Ollama …"
            plist = Path.home() / "Library/LaunchAgents/de.atlas.ollama.plist"
            plist.write_text(f"""<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>de.atlas.ollama</string>
  <key>ProgramArguments</key><array><string>{b}</string><string>serve</string></array>
  <key>RunAtLoad</key><true/><key>KeepAlive</key><true/>
  <key>StandardOutPath</key><string>{LOCAL_DIR}/logs/ollama.log</string>
  <key>StandardErrorPath</key><string>{LOCAL_DIR}/logs/ollama.log</string>
</dict></plist>""")
            uid = os.getuid()
            subprocess.run(["launchctl", "bootout", f"gui/{uid}/de.atlas.ollama"], capture_output=True)
            subprocess.run(["launchctl", "bootstrap", f"gui/{uid}", str(plist)], capture_output=True)
            for _ in range(30):
                if lokal_status()["laeuft"]:
                    break
                time.sleep(1)
        for modell in (LOKAL_MODELL, "bge-m3"):
            _laden["stand"] = f"Lade {modell} …"
            with open(log, "a") as f:
                p = subprocess.Popen([b, "pull", modell], stdout=f, stderr=subprocess.STDOUT)
                _laden["prozess"] = p
                p.wait()
        _laden["stand"] = "fertig"
    except Exception as e:
        _laden["stand"] = f"Fehler: {e}"[:160]
    finally:
        _laden["aktiv"] = False
