"""Wo liegt was? Erkennt Benutzer, Gerät, iCloud und DATENARCHIV automatisch."""
from atlas import macos  # noqa: F401  – erlaubt das Nachladen aus iCloud (zuerst!)
import getpass
import os
import socket
import sys
from pathlib import Path

from atlas.plattform import WINDOWS, benutzer_nummer

USER = getpass.getuser()
UID = benutzer_nummer()
HOST = socket.gethostname().split(".")[0]

ICLOUD = Path(os.environ.get(
    "ATLAS_ICLOUD", Path.home() / ("iCloudDrive" if WINDOWS else "Library/Mobile Documents/com~apple~CloudDocs")))
LOCAL_DIR = Path(os.environ.get("ATLAS_LOCAL_DIR", Path.home() / ".atlas"))
REPO_DIR = Path(__file__).resolve().parent.parent
# Weitere Cloud-Speicher auf dem Mac (OneDrive, Google Drive, Dropbox, Box … über den Dateianbieter von macOS)
CLOUDSTORAGE = Path.home() / "Library/CloudStorage"

# Jeder Benutzer bekommt einen eigenen Port – so laufen zwei Konten parallel.
PORT = 47000 + UID % 1000


def display_name() -> str:
    """Vorname aus dem Benutzerkonto (z. B. 'Anna')."""
    if sys.platform == "win32":
        return (os.environ.get("USERNAME") or USER).split(".")[0].capitalize()
    import pwd
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
    if ICLOUD.exists():
        direct = ICLOUD / "DATENARCHIV"
        if direct.exists():
            return direct
        for candidate in ICLOUD.glob("*/DATENARCHIV"):
            return candidate
    # ohne iCloud: ein Ordner „DATENARCHIV“ ganz oben in OneDrive, Google Drive, Dropbox …
    if WINDOWS:
        for var in ("OneDriveConsumer", "OneDrive", "OneDriveCommercial"):
            if os.environ.get(var) and (Path(os.environ[var]) / "DATENARCHIV").is_dir():
                return Path(os.environ[var]) / "DATENARCHIV"
        for w in (Path.home() / "Dropbox", Path.home() / "Google Drive" / "My Drive", Path.home() / "Documents"):
            if (w / "DATENARCHIV").is_dir():
                return w / "DATENARCHIV"
    try:
        for wurzel in sorted(CLOUDSTORAGE.iterdir()) if CLOUDSTORAGE.exists() else []:
            for kandidat in (wurzel / "DATENARCHIV", wurzel / "My Drive" / "DATENARCHIV", wurzel / "Meine Ablage" / "DATENARCHIV"):
                if kandidat.is_dir():
                    return kandidat
    except OSError:
        pass
    return None


def cloud_quellen() -> list[dict]:
    """Wo kann das DATENARCHIV liegen? iCloud Drive, Cloud-Speicher unter ~/Library/CloudStorage, lokale Ordner."""
    out = []
    if ICLOUD.exists():
        out.append({"art": "icloud", "name": "iCloud Drive", "pfad": str(ICLOUD)})
    try:
        for w in sorted(CLOUDSTORAGE.iterdir()) if CLOUDSTORAGE.exists() else []:
            if not w.is_dir() or w.name.startswith("."):
                continue
            n = w.name
            art = "onedrive" if n.lower().startswith("onedrive") else "gdrive" if n.lower().startswith("googledrive") else \
                "dropbox" if n.lower().startswith("dropbox") else "box" if n.lower().startswith("box") else "cloud"
            titel = {"onedrive": "OneDrive", "gdrive": "Google Drive", "dropbox": "Dropbox", "box": "Box"}.get(art, n)
            konto = n.split("-", 1)[1] if "-" in n else ""
            out.append({"art": art, "name": titel + (f" ({konto})" if konto else ""), "pfad": str(w)})
    except OSError:
        pass
    if WINDOWS:                                       # OneDrive (privat/geschäftlich), Dropbox, Google Drive für Windows
        gesehen = {q["pfad"] for q in out}
        for var, art, titel in (("OneDriveConsumer", "onedrive", "OneDrive"), ("OneDriveCommercial", "onedrive", "OneDrive (Arbeit)"),
                                ("OneDrive", "onedrive", "OneDrive")):
            p = os.environ.get(var)
            if p and Path(p).is_dir() and p not in gesehen:
                out.append({"art": art, "name": titel, "pfad": p}); gesehen.add(p)
        for name, art, titel in (("Dropbox", "dropbox", "Dropbox"), ("Google Drive", "gdrive", "Google Drive")):
            p = Path.home() / name
            if p.is_dir() and str(p) not in gesehen:
                out.append({"art": art, "name": titel, "pfad": str(p)})
    out.append({"art": "lokal", "name": "Lokaler Ordner auf diesem Rechner", "pfad": str(Path.home())})
    return out


def archiv_quelle(pfad: Path | str | None) -> dict:
    """Zu welchem Speicher gehört ein Archivpfad? (Anzeige und Nachladen von Platzhaltern)"""
    if not pfad:
        return {"art": "", "name": "–"}
    p = str(Path(pfad).expanduser())
    for q in cloud_quellen():
        if q["art"] != "lokal" and (p == q["pfad"] or p.startswith(q["pfad"] + "/")):
            return {"art": q["art"], "name": q["name"]}
    return {"art": "lokal", "name": "Lokaler Ordner"}


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
