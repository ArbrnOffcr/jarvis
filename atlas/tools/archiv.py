"""Werkzeuge für das DATENARCHIV: suchen, blättern, lesen, ablegen.
Veränderungen (anlegen, verschieben, löschen) nur nach Bestätigung.
Gelöschtes landet im JARVIS-Papierkorb, nicht endgültig."""
import shutil
from datetime import datetime
from pathlib import Path

from atlas.archiv.extract import ExtractError, extract
from atlas.tools import S, Tool, ToolError


class ArchivTools:
    def __init__(self, archiv, shared: Path):
        self.a = archiv
        self.root = archiv.archive
        self.trash = shared / "_Papierkorb"

    def _path(self, rel: str, must_exist: bool = True) -> Path:
        if not self.root:
            raise ToolError("DATENARCHIV nicht gefunden")
        rel = (rel or "").strip().lstrip("/")
        if rel.startswith("DATENARCHIV/"):
            rel = rel[len("DATENARCHIV/"):]
        p = (self.root / rel).resolve()
        if p != self.root.resolve() and self.root.resolve() not in p.parents:
            raise ToolError("Pfad liegt außerhalb des DATENARCHIVs")
        if must_exist and not p.exists():
            raise ToolError(f"'{rel}' nicht gefunden")
        return p

    def _rel(self, p: Path) -> str:
        return str(p.relative_to(self.root.resolve()))

    # ---------- lesen ----------
    def suchen(self, frage: str, ordner: str = "", anzahl: int = 8) -> dict:
        res = self.a.search.search(frage, k=int(anzahl), ordner=ordner)
        st = self.a.shared_status()
        hinweis = ""
        if st.get("offen"):
            hinweis = f"Index noch im Aufbau ({st.get('offen')} Dateien offen) – Ergebnisse unvollständig."
        return {"treffer": res, "hinweis": hinweis}

    def ordner(self, pfad: str = "") -> dict:
        p = self._path(pfad)
        if not p.is_dir():
            raise ToolError("Das ist kein Ordner")
        dirs, files = [], []
        for c in sorted(p.iterdir(), key=lambda x: x.name.lower()):
            if c.name.startswith("."):
                continue
            if c.is_dir():
                dirs.append(c.name + "/")
            else:
                st = c.stat()
                files.append({"name": c.name, "kb": round(st.st_size / 1024),
                              "geaendert": f"{datetime.fromtimestamp(st.st_mtime):%d.%m.%Y}"})
        return {"ordner": self._rel(p) or "/", "unterordner": dirs[:200],
                "dateien": files[:200], "gekuerzt": len(files) > 200}

    def lesen(self, pfad: str, seite_von: int = 0, seite_bis: int = 0) -> dict:
        p = self._path(pfad)
        if p.is_dir():
            raise ToolError("Das ist ein Ordner – archiv_ordner verwenden")
        try:
            pages = extract(p, ocr=True)
        except ExtractError as e:
            raise ToolError(str(e))
        if seite_von:
            pages = [(s, t) for s, t in pages if s >= seite_von and (not seite_bis or s <= seite_bis)]
        text = "\n\n".join(f"[Seite {s}]\n{t}" if s else t for s, t in pages)
        return {"pfad": self._rel(p), "seiten": len(pages), "text": text[:15000],
                "gekuerzt": len(text) > 15000}

    # ---------- verändern (Bestätigung) ----------
    def anlegen(self, pfad: str, inhalt: str) -> dict:
        p = self._path(pfad, must_exist=False)
        if p.suffix.lower() not in (".md", ".txt", ".csv"):
            raise ToolError("Nur .md, .txt oder .csv – Office-Dateien folgen in Phase 6")
        if p.exists():
            raise ToolError("Datei existiert bereits")
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(inhalt, encoding="utf-8")
        return {"angelegt": self._rel(p)}

    def verschieben(self, von: str, nach: str) -> dict:
        src = self._path(von)
        dst = self._path(nach, must_exist=False)
        if dst.exists() and dst.is_dir():
            dst = dst / src.name
        if dst.exists():
            raise ToolError(f"Ziel '{self._rel(dst)}' existiert bereits")
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.move(str(src), str(dst))
        return {"verschoben": von, "nach": self._rel(dst)}

    def loeschen(self, pfad: str) -> dict:
        p = self._path(pfad)
        rel = self._rel(p)
        stempel = f"{datetime.now():%Y-%m-%d_%H%M%S}"
        ziel = self.trash / stempel / rel
        ziel.parent.mkdir(parents=True, exist_ok=True)
        shutil.move(str(p), str(ziel))
        return {"in_papierkorb": rel, "wiederherstellen": f"{self.trash.name}/{stempel}/{rel}"}


def tools(cfg, secrets, archiv, shared: Path) -> list[Tool]:
    t = ArchivTools(archiv, shared)
    return [
        Tool("archiv_suchen",
             "DATENARCHIV inhaltlich durchsuchen (Bedeutung + Stichwörter). Liefert Dateipfade "
             "mit Auszügen. Erste Wahl bei Fragen zu Dokumenten, Verträgen, Rechnungen, Bescheiden.",
             "datei.lesen", t.suchen,
             {"frage": S("Wonach gesucht wird, in eigenen Worten"),
              "ordner": S("Nur in diesem Unterordner, optional"),
              "anzahl": {"type": "integer", "description": "Anzahl Treffer, Standard 8"}}, ["frage"]),
        Tool("archiv_ordner", "Inhalt eines Ordners im DATENARCHIV auflisten ('' = oberste Ebene).",
             "datei.lesen", t.ordner, {"pfad": S("Pfad relativ zum DATENARCHIV")}),
        Tool("datei_lesen", "Text einer Datei lesen (PDF, Office, Scan, Foto ...), optional Seitenbereich.",
             "datei.lesen", t.lesen,
             {"pfad": S("Pfad relativ zum DATENARCHIV"),
              "seite_von": {"type": "integer"}, "seite_bis": {"type": "integer"}}, ["pfad"]),
        Tool("datei_anlegen", "Neue Text-/Markdown-Datei im DATENARCHIV anlegen.",
             "datei.anlegen", t.anlegen, {"pfad": S("Zielpfad inkl. Dateiname"), "inhalt": S("Inhalt")},
             ["pfad", "inhalt"], label=lambda a: f"Datei „{a['pfad']}“ anlegen"),
        Tool("datei_verschieben", "Datei/Ordner im DATENARCHIV verschieben oder umbenennen.",
             "datei.verschieben", t.verschieben, {"von": S("Bisheriger Pfad"), "nach": S("Neuer Pfad oder Zielordner")},
             ["von", "nach"], label=lambda a: f"„{a['von']}“ → „{a['nach']}“ verschieben"),
        Tool("datei_loeschen", "Datei in den JARVIS-Papierkorb verschieben (wiederherstellbar).",
             "datei.loeschen", t.loeschen, {"pfad": S("Pfad")}, ["pfad"],
             label=lambda a: f"„{a['pfad']}“ löschen (in den Papierkorb)"),
    ]
