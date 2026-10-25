"""Gemeinsamer Index im DATENARCHIV: pro Dokument eine kleine Datei.
Einzeldateien statt Datenbank, damit iCloud nie eine halbe Datenbank
zwischen zwei Macs synchronisiert."""
import base64
import gzip
import hashlib
import json
from pathlib import Path

import numpy as np

VERSION = 1


def doc_id(rel: str) -> str:
    return hashlib.sha1(rel.encode("utf-8")).hexdigest()


class SharedIndex:
    def __init__(self, root: Path):
        self.root = root
        root.mkdir(parents=True, exist_ok=True)

    def file(self, did: str) -> Path:
        return self.root / did[:2] / f"{did}.json.gz"

    def write(self, rel: str, mtime: float, size: int, model: str,
              chunks: list[dict], vecs: np.ndarray | None, fehler: str = "") -> None:
        did = doc_id(rel)
        f = self.file(did)
        f.parent.mkdir(parents=True, exist_ok=True)
        data = {"v": VERSION, "pfad": rel, "mtime": mtime, "size": size, "modell": model,
                "dim": int(vecs.shape[1]) if vecs is not None and len(vecs) else 0,
                "chunks": chunks, "fehler": fehler,
                "vektoren": base64.b64encode(vecs.astype(np.float16).tobytes()).decode()
                if vecs is not None and len(vecs) else ""}
        tmp = f.with_name(f.name + ".tmp")
        with gzip.open(tmp, "wt", encoding="utf-8") as fh:
            json.dump(data, fh, ensure_ascii=False)
        tmp.replace(f)

    @staticmethod
    def read(f: Path) -> dict:
        with gzip.open(f, "rt", encoding="utf-8") as fh:
            data = json.load(fh)
        if data.get("vektoren"):
            raw = base64.b64decode(data["vektoren"])
            data["vecs"] = np.frombuffer(raw, dtype=np.float16).reshape(-1, data["dim"])
        else:
            data["vecs"] = None
        return data

    def meta(self, rel: str) -> dict | None:
        """Nur Kopfdaten (ohne Vektoren) – für 'ist das schon aktuell?'."""
        f = self.file(doc_id(rel))
        if not f.exists():
            return None
        try:
            d = self.read(f)
            return {k: d.get(k) for k in ("pfad", "mtime", "size", "modell", "fehler")}
        except Exception:
            return None

    def remove(self, rel: str) -> None:
        self.file(doc_id(rel)).unlink(missing_ok=True)

    def all_files(self):
        """Alle Indexdateien; iCloud-Konfliktkopien ('… 2.json.gz') werden ignoriert."""
        for f in self.root.glob("*/*.json.gz"):
            if " " not in f.name:
                yield f
