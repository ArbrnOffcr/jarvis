"""Lokale Suchdatenbank je Mac/Benutzer – wird aus dem gemeinsamen Index
aufgebaut. Hybrid-Suche: Stichwörter (SQLite FTS5) + Bedeutung (Vektoren)."""
import re
import sqlite3
import threading
from pathlib import Path

import numpy as np

from atlas.archiv.store import SharedIndex


class LocalSearch:
    def __init__(self, folder: Path, shared: SharedIndex, embedder, model: str):
        folder.mkdir(parents=True, exist_ok=True)
        self.shared, self.embedder, self.model = shared, embedder, model
        self.vec_path = folder / "vektoren.f16"
        self.lock = threading.Lock()
        self.db = sqlite3.connect(folder / "suche.sqlite", check_same_thread=False)
        self.db.executescript("""
            CREATE TABLE IF NOT EXISTS docs(id TEXT PRIMARY KEY, pfad TEXT, mtime REAL,
                                            datei_mtime REAL);
            CREATE TABLE IF NOT EXISTS chunks(row INTEGER PRIMARY KEY, doc TEXT, seite INT,
                                              text TEXT, lebt INT DEFAULT 1);
            CREATE INDEX IF NOT EXISTS ch_doc ON chunks(doc);
            CREATE VIRTUAL TABLE IF NOT EXISTS fts USING fts5(text, content='chunks',
                                                             content_rowid='row');
            CREATE TABLE IF NOT EXISTS info(k TEXT PRIMARY KEY, v TEXT);
        """)
        self.dim = int(self._info("dim") or 0)
        if self._info("modell") not in (None, model):   # Modellwechsel -> neu aufbauen
            self.reset()

    # ---------- Hilfen ----------
    def _info(self, k):
        r = self.db.execute("SELECT v FROM info WHERE k=?", (k,)).fetchone()
        return r[0] if r else None

    def _set(self, k, v):
        self.db.execute("INSERT OR REPLACE INTO info VALUES(?,?)", (k, str(v)))

    def reset(self):
        with self.lock:
            self.db.executescript("DELETE FROM docs; DELETE FROM chunks; DELETE FROM info;"
                                  "INSERT INTO fts(fts) VALUES('delete-all');")
            self.vec_path.unlink(missing_ok=True)
            self.dim = 0
            self._set("modell", self.model)
            self.db.commit()

    def _rows(self) -> int:
        return self.vec_path.stat().st_size // (2 * self.dim) if self.dim and self.vec_path.exists() else 0

    # ---------- Abgleich mit dem gemeinsamen Index ----------
    def sync(self) -> int:
        """Neue/geänderte Indexdateien übernehmen, entfernte austragen."""
        changed = 0
        known = {r[0]: r[1] for r in self.db.execute("SELECT id, datei_mtime FROM docs")}
        seen = set()
        for f in self.shared.all_files():
            did = f.name.split(".")[0]
            seen.add(did)
            try:
                fm = f.stat().st_mtime
            except OSError:
                continue
            if known.get(did) == fm:
                continue
            try:
                data = self.shared.read(f)
            except Exception:
                continue
            if data.get("modell") != self.model:
                continue
            self._replace(did, data, fm)
            changed += 1
        for did in set(known) - seen:
            self._drop(did)
            changed += 1
        if changed:
            with self.lock:
                self.db.commit()
        return changed

    def _drop(self, did):
        with self.lock:
            rows = self.db.execute("SELECT row, text FROM chunks WHERE doc=? AND lebt=1", (did,)).fetchall()
            for row, text in rows:
                self.db.execute("INSERT INTO fts(fts, rowid, text) VALUES('delete', ?, ?)", (row, text))
            self.db.execute("UPDATE chunks SET lebt=0 WHERE doc=?", (did,))
            self.db.execute("DELETE FROM docs WHERE id=?", (did,))

    def _replace(self, did, data, fm):
        self._drop(did)
        vecs = data["vecs"]
        with self.lock:
            if vecs is not None and len(vecs):
                if not self.dim:
                    self.dim = vecs.shape[1]
                    self._set("dim", self.dim)
                start = self._rows()
                with open(self.vec_path, "ab") as fh:
                    fh.write(vecs.astype(np.float16).tobytes())
                for i, ch in enumerate(data["chunks"]):
                    row = start + i
                    self.db.execute("INSERT INTO chunks(row, doc, seite, text) VALUES(?,?,?,?)",
                                    (row, did, ch["seite"], ch["text"]))
                    self.db.execute("INSERT INTO fts(rowid, text) VALUES(?,?)", (row, ch["text"]))
            self.db.execute("INSERT OR REPLACE INTO docs VALUES(?,?,?,?)",
                            (did, data["pfad"], data["mtime"], fm))

    # ---------- Suche ----------
    def search(self, frage: str, k: int = 8, ordner: str = "") -> list[dict]:
        scores: dict[int, float] = {}
        # 1) Bedeutung
        n = self._rows()
        if n:
            q = self.embedder.embed([frage])[0].astype(np.float32)
            mm = np.memmap(self.vec_path, dtype=np.float16, mode="r", shape=(n, self.dim))
            best: list[tuple[float, int]] = []
            for s in range(0, n, 50_000):
                part = np.asarray(mm[s:s + 50_000], dtype=np.float32) @ q
                idx = np.argpartition(-part, min(60, len(part) - 1))[:60]
                best += [(float(part[i]), s + int(i)) for i in idx]
            best.sort(reverse=True)
            for rank, (_, row) in enumerate(best[:60]):
                scores[row] = scores.get(row, 0) + 1 / (60 + rank)
        # 2) Stichwörter
        words = [w for w in re.findall(r"[\wäöüÄÖÜß\-]{2,}", frage)][:12]
        if words:
            expr = " OR ".join(f'"{w}"' for w in words)
            try:
                hits = self.db.execute("SELECT rowid FROM fts WHERE fts MATCH ? ORDER BY bm25(fts) LIMIT 60",
                                       (expr,)).fetchall()
                for rank, (row,) in enumerate(hits):
                    scores[row] = scores.get(row, 0) + 1 / (60 + rank)
            except sqlite3.OperationalError:
                pass
        # 3) Zusammenführen, je Dokument max. 2 Treffer
        out, per_doc = [], {}
        for row, sc in sorted(scores.items(), key=lambda x: -x[1]):
            r = self.db.execute("""SELECT c.doc, c.seite, c.text, d.pfad FROM chunks c
                                   JOIN docs d ON d.id=c.doc WHERE c.row=? AND c.lebt=1""",
                                (row,)).fetchone()
            if not r or (ordner and not r[3].lower().startswith(ordner.lower().strip("/"))):
                continue
            if per_doc.get(r[0], 0) >= 2:
                continue
            per_doc[r[0]] = per_doc.get(r[0], 0) + 1
            out.append({"pfad": r[3], "seite": r[1] or None, "auszug": r[2][:400],
                        "relevanz": round(sc * 1000, 1)})
            if len(out) >= k:
                break
        return out

    def doc_text(self, rel_path: str) -> list[tuple[int, str]] | None:
        r = self.db.execute("SELECT id FROM docs WHERE pfad=?", (rel_path,)).fetchone()
        if not r:
            return None
        return self.db.execute("SELECT seite, text FROM chunks WHERE doc=? AND lebt=1 ORDER BY row",
                               (r[0],)).fetchall()

    def known(self) -> dict[str, float]:
        return {p: m for p, m in self.db.execute("SELECT pfad, mtime FROM docs")}

    def stats(self) -> dict:
        try:
            d = self.db.execute("SELECT COUNT(*) FROM docs").fetchone()[0]
            c = self.db.execute("SELECT COUNT(*) FROM chunks WHERE lebt=1").fetchone()[0]
            self._stats = {"dokumente": d, "abschnitte": c}
        except Exception:                      # Index wird gerade geschrieben – letzten Stand zeigen
            pass
        return getattr(self, "_stats", {"dokumente": 0, "abschnitte": 0})
