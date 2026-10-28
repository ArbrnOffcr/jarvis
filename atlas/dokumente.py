"""Dokumente, die in den Chat gezogen werden.

Die Datei wird lokal gespeichert (~/.atlas/dokumente, 14 Tage) und lokal gelesen (Text, Texterkennung
bei Scans und Fotos). Ob Claude den Inhalt sehen darf, entscheidet der Nutzer bei jedem Dokument
(Rückfrage im Kern); sonst antwortet das lokale Modell. Ablage im DATENARCHIV nur nach Bestätigung."""
import shutil
import threading
import time
import uuid
from datetime import date, datetime
from pathlib import Path

from atlas import hilfen
from atlas.archiv.extract import SUPPORTED, extract
from atlas.paths import LOCAL_DIR
from atlas.tools import S, Tool, ToolError

DIR = LOCAL_DIR / "dokumente"
AUFBEWAHREN_TAGE = 14
MAX_MB = 60
MAX_ZEICHEN = 40000          # so viel Text geht höchstens in eine Anfrage


class Dokumente:
    def __init__(self, core):
        self.c = core
        self.dok: dict[str, dict] = {}
        self.lock = threading.Lock()
        DIR.mkdir(parents=True, exist_ok=True)
        self._aufraeumen()

    def _aufraeumen(self) -> None:
        grenze = time.time() - AUFBEWAHREN_TAGE * 86400
        for f in DIR.glob("*"):
            try:
                if f.stat().st_mtime < grenze:
                    f.unlink()
            except OSError:
                pass

    # ---------- Annahme ----------
    def aufnehmen(self, name: str, daten: bytes) -> dict:
        name = hilfen.dateiname(Path(name or "Dokument").name, 120)
        endung = Path(name).suffix.lower()
        if endung not in SUPPORTED:
            raise ToolError(f"Dateityp {endung or '(ohne Endung)'} kann ich nicht lesen")
        if len(daten) > MAX_MB * 1024 * 1024:
            raise ToolError(f"Datei größer als {MAX_MB} MB")
        did = uuid.uuid4().hex[:10]
        pfad = DIR / f"{did}{endung}"
        pfad.write_bytes(daten)
        try:
            seiten = extract(pfad, ocr=True)
        except Exception as e:
            pfad.unlink(missing_ok=True)
            raise ToolError(f"Konnte „{name}“ nicht lesen: {e}")
        text = "\n\n".join((f"[Seite {s}]\n{t}" if s else t) for s, t in seiten if t and t.strip())
        info = {"id": did, "name": name, "pfad": str(pfad), "text": text, "seiten": len(seiten) or 1,
                "zeichen": len(text), "sensibel": hilfen.sensibel_gruende(text),
                "zeit": datetime.now().isoformat(timespec="seconds")}
        with self.lock:
            self.dok[did] = info
        self.c.audit.log("dokument", aktion="aufgenommen", name=name, seiten=info["seiten"],
                         zeichen=info["zeichen"])         # ohne Inhalt
        return self.kurz(info)

    def kurz(self, d: dict) -> dict:
        fristen = []
        try:                                          # Fristen nur per Regeln (schnell, lokal) – für die Anzeige
            a = self.c.post.analysieren(d["text"], d["name"], schnell=True)
            fristen = [{"datum": f["datum"], "art": f["art"]} for f in a["fristen"]][:4]
        except Exception:
            pass
        return {"id": d["id"], "name": d["name"], "seiten": d["seiten"], "zeichen": d["zeichen"],
                "sensibel": d["sensibel"], "leer": not d["text"].strip(), "fristen": fristen}

    def get(self, did: str) -> dict:
        d = self.dok.get(did)
        if not d:
            raise ToolError("Dokument nicht mehr vorhanden – bitte erneut hineinziehen")
        return d

    # ---------- für das Modell ----------
    def anhang(self, did: str, cloud: bool) -> str:
        d = self.get(did)
        text = d["text"].strip() or "(Kein Text erkannt – evtl. ein Foto ohne Schrift.)"
        if cloud:
            text = hilfen.maskieren(text)
        gekuerzt = len(text) > MAX_ZEICHEN
        text = text[:MAX_ZEICHEN]
        if hasattr(self.c, "sicherheit"):         # Dokumente sind fremder Inhalt: prüfen und einrahmen
            text = self.c.sicherheit.text_schuetzen(f"dokument:{d['name']}", text)
        return (f"\n\n<dokument id=\"{did}\" name=\"{d['name']}\" seiten=\"{d['seiten']}\">\n{text}\n</dokument>"
                + (f"\n(Dokument gekürzt – für weitere Seiten 'dokument_lesen' mit id {did} nutzen.)" if gekuerzt else ""))

    def lesen(self, dokument_id: str, ab_zeichen: int = 0) -> dict:
        d = self.get(dokument_id)
        return {"name": d["name"], "ab": ab_zeichen, "text": d["text"][ab_zeichen:ab_zeichen + MAX_ZEICHEN // 2],
                "gesamt": len(d["text"])}

    # ---------- Ablage ----------
    def vorschlag(self, dokument_id: str) -> dict:
        """Ablageort und Dateinamen lokal vorschlagen (gleiche Logik wie beim Posteingang)."""
        d = self.get(dokument_id)
        a = self.c.post.analysieren(d["text"], d["name"])
        return {"ordner": a["ordner"], "dateiname": a["name"], "absender": a["absender"],
                "betreff": a["betreff"], "fristen": a["fristen"], "steuer": a["steuer"],
                "hinweis": "Nur ein Vorschlag – zum Ablegen 'dokument_ablegen' (wird vom Nutzer bestätigt)."}

    def ablegen(self, dokument_id: str, ordner: str, dateiname: str = "") -> dict:
        d = self.get(dokument_id)
        archiv = self.c.archiv.archive if self.c.archiv else None
        if not archiv:
            raise ToolError("DATENARCHIV nicht gefunden")
        ziel_ordner = (archiv / ordner.strip("/")).resolve()
        if not str(ziel_ordner).startswith(str(archiv.resolve())):
            raise ToolError("Ordner liegt außerhalb des DATENARCHIVS")
        if not ziel_ordner.exists():
            raise ToolError(f"Ordner „{ordner}“ gibt es nicht – bitte einen bestehenden wählen")
        endung = Path(d["pfad"]).suffix
        name = hilfen.dateiname(Path(dateiname).stem if dateiname else Path(d["name"]).stem, 110) + endung
        ziel = hilfen.frei(ziel_ordner / name)
        shutil.copy2(d["pfad"], ziel)
        rel = str(ziel.relative_to(archiv))
        d["abgelegt"] = rel
        self.c.audit.log("dokument", aktion="abgelegt", ziel=rel)
        try:                                       # vom Posteingang gelernt: Absender → Ordner
            self.c.post.lernen(self.c.post.analysieren(d["text"], d["name"], schnell=True)["absender"], ordner)
        except Exception:
            pass
        return {"abgelegt": rel}


def tools(core) -> list[Tool]:
    d = core.dokumente
    return [
        Tool("dokument_lesen", "Weiteren Text eines in den Chat gezogenen Dokuments lesen (ab Zeichenposition).",
             "datei.lesen", d.lesen, {"dokument_id": S("id aus <dokument id=…>"),
                                      "ab_zeichen": {"type": "integer", "description": "Startposition"}},
             ["dokument_id"]),
        Tool("dokument_ablage_vorschlag",
             "Für ein in den Chat gezogenes Dokument Ordner im DATENARCHIV und Dateinamen vorschlagen "
             "(lokal ermittelt). Danach dem Nutzer den Vorschlag nennen.",
             "datei.lesen", d.vorschlag, {"dokument_id": S("id aus <dokument id=…>")}, ["dokument_id"]),
        Tool("dokument_ablegen",
             "Ein in den Chat gezogenes Dokument als Kopie im DATENARCHIV ablegen (Ordner muss bestehen). "
             "Dateiname nach Schema 'JJJJ_MM_TT - Absender - Betreff'.",
             "datei.anlegen", d.ablegen,
             {"dokument_id": S("id aus <dokument id=…>"), "ordner": S("Ordner relativ zum DATENARCHIV"),
              "dateiname": S("Dateiname ohne Endung, optional")}, ["dokument_id", "ordner"],
             label=lambda a: f"Dokument ablegen in „{a.get('ordner')}“"
                             + (f" als „{a['dateiname']}“" if a.get("dateiname") else "")),
    ]
