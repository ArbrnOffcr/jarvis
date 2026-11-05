"""Indexer: durchläuft das DATENARCHIV und hält den gemeinsamen Index aktuell.
Läuft nur auf dem Gerät mit der Wache – alle anderen übernehmen nur."""
import json
import os
import re
import subprocess
import threading
import unicodedata
import time
from datetime import datetime
from pathlib import Path

from atlas.archiv.embed import Embedder
from atlas.archiv.extract import SUPPORTED, chunk, extract
from atlas.archiv.search import LocalSearch
from atlas.archiv.store import SharedIndex, doc_id
from atlas.lease import ME, Lease
from atlas.paths import LOCAL_DIR


# Vorübergehende Lesefehler (iCloud-Platzhalter noch nicht geladen, Datei gerade gesperrt, Ollama kurz weg):
# solche Dokumente versucht der Index später erneut – höchstens MAX_VERSUCHE Mal, im Abstand von Stunden.
VORUEBERGEHEND = re.compile(r"Failed to open|Resource deadlock|Errno 11|Errno 35|No such file|not found at|"
                            r"PackageNotFound|BadZipFile|not a zip|Timeout|timed out|Connect|embed|"
                            r"Ollama|cannot identify image|truncated", re.I)
MAX_VERSUCHE = 6
SF_DATALESS = 0x40000000            # macOS: Datei liegt nur in iCloud (Platzhalter)


def namensabschnitt(rel: str) -> str:
    """Name und Ordner lesbar – damit jedes Dokument mindestens über Titel und Ablageort gefunden wird."""
    rel = unicodedata.normalize("NFC", rel)
    teile = rel.split("/")
    titel = re.sub(r"[_]+", " ", teile[-1].rsplit(".", 1)[0]).strip()
    ordner = " / ".join(re.sub(r"[_]+", " ", t).strip() for t in teile[:-1])
    return f"Datei: {rel} · Titel: {titel} · Ablage: {ordner}"


def aus_icloud_laden(pfad: Path, warten: float = 90) -> None:
    """Ist die Datei nur ein Platzhalter in der Cloud, erst herunterladen und kurz warten.
    iCloud: brctl download. OneDrive, Google Drive, Dropbox (Dateianbieter von macOS): das erste Lesen lädt die Datei."""
    try:
        if not (os.stat(pfad).st_flags & SF_DATALESS):
            return
    except (OSError, AttributeError):
        return
    if "/Library/Mobile Documents/" not in str(pfad):
        try:
            with open(pfad, "rb") as f:          # löst das Herunterladen aus und wartet darauf
                f.read(1)
        except OSError:
            pass
        return
    try:
        subprocess.run(["brctl", "download", str(pfad)], capture_output=True, timeout=30)
    except (OSError, subprocess.SubprocessError):
        return
    ende = time.time() + warten
    while time.time() < ende:
        try:
            if not (os.stat(pfad).st_flags & SF_DATALESS):
                return
        except OSError:
            return
        time.sleep(2)


class Archiv:
    def __init__(self, cfg: dict, archive: Path | None, shared: Path, audit):
        self.cfg = cfg["archiv"]
        self.archive, self.audit = archive, audit
        self.model = self.cfg["embed_model"]
        self.embedder = Embedder(cfg["local"]["url"], self.model)
        self.index = SharedIndex(shared / "index")
        self.search = LocalSearch(LOCAL_DIR / "suche", self.index, self.embedder, self.model)
        self.lease = Lease(shared / "system" / "wache_index.json")
        self.status_file = shared / "system" / "index_status.json"
        self.stop = threading.Event()
        self.pause = threading.Event()
        self.darf = lambda: True                 # Sparmodus: nur rechnen, solange die JARVIS-App läuft
        self.state = {"phase": "wartet", "offen": 0, "erledigt": 0, "fehler": 0}

    # ---------- Hilfen ----------
    def excluded(self, rel: str) -> bool:
        parts = rel.split("/")
        if any(p.startswith((".", "~$")) for p in parts):
            return True
        from atlas.notfall import ist_notfallordner      # Notfallordner nie in den Suchindex
        if ist_notfallordner(parts[-1]):
            return True
        from atlas import hilfen as _h                   # JARVIS' eigener Datenordner (Index, Systemdateien)
        if any(rel == x or rel.startswith(x + "/") for x in _h.INTERN):
            return True
        return any(rel == x.strip("/") or rel.startswith(x.strip("/") + "/") for x in self.cfg["ausschluss"] if x.strip("/"))

    def files(self):
        """Alle passenden Dateien, neueste zuerst."""
        out = []
        for dirpath, dirnames, filenames in os.walk(self.archive):
            rel_dir = os.path.relpath(dirpath, self.archive)
            rel_dir = "" if rel_dir == "." else rel_dir
            dirnames[:] = [d for d in dirnames
                           if not self.excluded(f"{rel_dir}/{d}".strip("/"))]
            for fn in filenames:
                rel = f"{rel_dir}/{fn}".strip("/")
                if Path(fn).suffix.lower() not in SUPPORTED or self.excluded(rel):
                    continue
                try:
                    st = os.stat(os.path.join(dirpath, fn))
                except OSError:
                    continue
                out.append((rel, st.st_mtime, st.st_size))
        out.sort(key=lambda x: -x[1])
        return out

    def _write_status(self, **extra):
        self.state.update(extra, aktualisiert=datetime.now().isoformat(timespec="seconds"),
                          wache=ME)
        try:
            self.status_file.write_text(json.dumps(self.state, ensure_ascii=False, indent=1))
        except OSError:
            pass

    def shared_status(self) -> dict:
        try:
            return json.loads(self.status_file.read_text())
        except (OSError, ValueError):
            return {}

    # ---------- ein Indexlauf ----------
    def run_once(self):
        if not self.archive:
            return
        self.embedder.ensure_model()
        self.search.sync()
        files = self.files()
        known = self.search.known()            # {pfad: mtime} laut Index
        fehlerhaft = self.search.fehlerhaft()  # {pfad: (fehler, versuche)} – Inhalt (noch) nicht gelesen
        jetzt = time.time()
        todo = [(rel, mtime, size) for rel, mtime, size in files if known.get(rel) != mtime]
        neu_versuchen = [(rel, mtime, size) for rel, mtime, size in files
                         if known.get(rel) == mtime and rel in fehlerhaft
                         and self._nochmal(rel, *fehlerhaft[rel], jetzt)]
        # Schriftstücke vor Fotos: PDFs und Office-Dateien tragen den meisten Inhalt
        rang = {".pdf": 0, ".docx": 1, ".doc": 1, ".xlsx": 2, ".pptx": 2, ".txt": 1, ".rtf": 1}
        neu_versuchen.sort(key=lambda x: (rang.get(Path(x[0]).suffix.lower(), 5), -x[1]))
        todo += neu_versuchen[:int(self.cfg.get("wiederholen_je_lauf", 400))]
        # gelöschte Dateien austragen
        present = {doc_id(r) for r, _, _ in files}
        for f in self.index.all_files():
            if f.name.split(".")[0] not in present:
                f.unlink(missing_ok=True)
        self.state.update(phase="indexiert", offen=len(todo), erledigt=0, fehler=0,
                          dateien_gesamt=len(files))
        self._write_status()
        max_bytes = self.cfg["max_mb"] * 1_000_000
        last_renew = time.time()
        for n, (rel, mtime, size) in enumerate(todo, 1):
            if self.stop.is_set():
                return
            while (self.pause.is_set() or not self.darf()) and not self.stop.is_set():
                time.sleep(2)
                if time.time() - last_renew > 60:              # Wache halten, auch während der Pause
                    if not self.lease.acquire():
                        return
                    last_renew = time.time()
            if time.time() - last_renew > 60:                  # Wache erneuern
                if not self.lease.acquire():
                    return
                last_renew = time.time()
            fehler = ""
            chunks, vecs = [], None
            name = {"seite": 0, "text": namensabschnitt(rel)}
            versuche = (fehlerhaft.get(rel, ("", 0))[1] + 1) if rel in fehlerhaft and known.get(rel) == mtime else 0
            try:
                if size > max_bytes:
                    raise ValueError("Datei zu groß")
                aus_icloud_laden(self.archive / rel)
                pages = extract(self.archive / rel, ocr=self.cfg["ocr"])
                chunks = [name] + chunk(pages)[:2000]          # Name/Ordner immer mit im Index
                vecs = self.embedder.embed([c["text"] for c in chunks])
            except Exception as e:
                fehler = f"{type(e).__name__}: {e}"[:200]
                self.state["fehler"] += 1
                # Inhalt nicht lesbar – dann wenigstens Name und Ablageort, damit das Dokument auffindbar bleibt
                try:
                    chunks, vecs = [name], self.embedder.embed([name["text"]])
                except Exception as e2:
                    chunks, vecs = [], None
                    fehler = f"{fehler} | embed: {type(e2).__name__}"[:200]
            self.index.write(rel, mtime, size, self.model, chunks, vecs, fehler, versuche)
            self.state["erledigt"] = n
            self.state["offen"] = len(todo) - n
            if n % 10 == 0:
                self._write_status(zuletzt=rel)
                self.search.sync()
        self.search.sync()
        self._write_status(phase="aktuell", offen=0, letzter_lauf=datetime.now().isoformat(timespec="seconds"))

    @staticmethod
    def _nochmal(rel: str, fehler: str, versuche: int, jetzt: float) -> bool:
        """Erneut versuchen? Nur bei vorübergehenden Fehlern (oder leerem Eintrag aus alter Version),
        höchstens MAX_VERSUCHE Mal."""
        if versuche >= MAX_VERSUCHE:
            return False
        return not fehler or bool(VORUEBERGEHEND.search(fehler))

    # ---------- Hintergrundschleife ----------
    def loop(self):
        interval = self.cfg["intervall_min"] * 60
        while not self.stop.is_set():
            try:
                if self.lease.acquire():
                    self.run_once()
                self.search.sync()
            except Exception as e:
                self.state["phase"] = f"Fehler: {e}"[:200]
                try:
                    self.audit.log("index_fehler", text=str(e)[:200])
                except Exception:
                    pass
            self.stop.wait(interval)

    def start(self):
        threading.Thread(target=self.loop, name="archiv-index", daemon=True).start()
