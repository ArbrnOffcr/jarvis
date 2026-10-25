"""Wo liegt was? Erkennt Benutzer, Gerät, iCloud und DATENARCHIV automatisch."""
from atlas import macos  # noqa: F401  – erlaubt das Nachladen aus iCloud (zuerst!)
import getpass
import os
import pwd
import socket
from pathlib import Path

USER = getpass.getuser()
UID = os.getuid()
HOST = socket.gethostname().split(".")[0]

ICLOUD = Path(os.environ.get(
    "ATLAS_ICLOUD", Path.home() / "Library/Mobile Documents/com~apple~CloudDocs"))
LOCAL_DIR = Path(os.environ.get("ATLAS_LOCAL_DIR", Path.home() / ".atlas"))
REPO_DIR = Path(__file__).resolve().parent.parent

# Jeder Benutzer bekommt einen eigenen Port – so laufen zwei Konten parallel.
PORT = 47000 + UID % 1000


def display_name() -> str:
    """Vorname aus dem macOS-Benutzerkonto (z. B. 'Anna')."""
    try:
        gecos = pwd.getpwnam(USER).pw_gecos.strip()
        return gecos.split()[0] if gecos else USER
    except KeyError:
        return USER


def private_dir() -> Path:
    """Privates Gedächtnis: im eigenen iCloud Drive (nur dieser Nutzer)."""
    base = ICLOUD / "ATLAS-Privat" if ICLOUD.exists() else LOCAL_DIR / "privat"
    base.mkdir(parents=True, exist_ok=True)
    return base


def find_archive(cfg: dict) -> Path | None:
    """DATENARCHIV finden: eigener Ordner oder als freigegebener Ordner im iCloud-Drive-Stamm;
    alternativ fester Pfad aus config.yaml (archive_path)."""
    if cfg.get("archive_path"):
        p = Path(cfg["archive_path"]).expanduser()
        return p if p.exists() else None
    if not ICLOUD.exists():
        return None
    direct = ICLOUD / "DATENARCHIV"
    if direct.exists():
        return direct
    for candidate in ICLOUD.glob("*/DATENARCHIV"):
        return candidate
    return None


def shared_dir(cfg: dict) -> Path:
    """Gemeinsamer JARVIS-Bereich im DATENARCHIV (für beide sichtbar)."""
    archive = find_archive(cfg)
    sub = cfg.get("shared_subdir") or "JARVIS"
    if archive and sub == "JARVIS":                  # ältere Installationen: bisherigen Ort weiter nutzen
        alt = archive / "01_Privat/10_Digitales/AI-Assistent/Daten"
        if alt.exists():
            sub = str(alt.relative_to(archive))
    base = archive / sub if archive else LOCAL_DIR / "gemeinsam"
    base.mkdir(parents=True, exist_ok=True)
    return base


def read_private_json(name: str, default: dict) -> dict:
    """Kleine Einstellungsdatei aus ATLAS-Privat (iCloud) lesen; ist iCloud gerade
    nicht lesbar, gilt die lokale Kopie in ~/.atlas/cache."""
    import json
    cache = LOCAL_DIR / "cache" / name
    try:
        text = (private_dir() / name).read_text(encoding="utf-8")
        cache.parent.mkdir(parents=True, exist_ok=True)
        cache.write_text(text, encoding="utf-8")
    except OSError:
        try:
            text = cache.read_text(encoding="utf-8")
        except OSError:
            return dict(default)
    try:
        return {**default, **json.loads(text)}
    except ValueError:
        return dict(default)


def write_private_json(name: str, data: dict) -> None:
    import json
    text = json.dumps(data, ensure_ascii=False, indent=1)
    cache = LOCAL_DIR / "cache" / name
    cache.parent.mkdir(parents=True, exist_ok=True)
    cache.write_text(text, encoding="utf-8")
    try:
        (private_dir() / name).write_text(text, encoding="utf-8")
    except OSError:
        pass
