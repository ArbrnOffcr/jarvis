"""Indexer: durchläuft das DATENARCHIV und hält den gemeinsamen Index aktuell.
Läuft nur auf dem Gerät mit der Wache – alle anderen übernehmen nur."""
import json
import os
import threading
import time
from datetime import datetime
from pathlib import Path

from atlas.archiv.embed import Embedder
from atlas.archiv.extract import SUPPORTED, chunk, extract
from atlas.archiv.search import LocalSearch
from atlas.archiv.store import SharedIndex, doc_id
from atlas.lease import ME, Lease
from atlas.paths import LOCAL_DIR


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
        self.state = {"phase": "wartet", "offen": 0, "erledigt": 0, "fehler": 0}

    # ---------- Hilfen ----------
    def excluded(self, rel: str) -> bool:
        parts = rel.split("/")
        if any(p.startswith((".", "~$")) for p in parts):
            return True
        from atlas.notfall import ist_notfallordner      # Notfallordner nie in den Suchindex
        if ist_notfallordner(parts[-1]):
            return True
        return any(rel.startswith(x.strip("/")) for x in self.cfg["ausschluss"])

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
        todo = [(rel, mtime, size) for rel, mtime, size in files
                if known.get(rel) != mtime]
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
            while self.pause.is_set() and not self.stop.is_set():
                time.sleep(2)
            if time.time() - last_renew > 60:                  # Wache erneuern
                if not self.lease.acquire():
                    return
                last_renew = time.time()
            fehler = ""
            chunks, vecs = [], None
            try:
                if size > max_bytes:
                    raise ValueError("Datei zu groß")
                pages = extract(self.archive / rel, ocr=self.cfg["ocr"])
                chunks = chunk(pages)[:2000]
                # Dateiname mitindexieren (hilft bei Suchen nach Namen/Belegen)
                chunks.insert(0, {"seite": 0, "text": f"Datei: {rel}"})
                vecs = self.embedder.embed([c["text"] for c in chunks])
            except Exception as e:
                fehler = f"{type(e).__name__}: {e}"[:200]
                chunks, vecs = [], None
                self.state["fehler"] += 1
            self.index.write(rel, mtime, size, self.model, chunks, vecs, fehler)
            self.state["erledigt"] = n
            self.state["offen"] = len(todo) - n
            if n % 10 == 0:
                self._write_status(zuletzt=rel)
                self.search.sync()
        self.search.sync()
        self._write_status(phase="aktuell", offen=0, letzter_lauf=datetime.now().isoformat(timespec="seconds"))

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
