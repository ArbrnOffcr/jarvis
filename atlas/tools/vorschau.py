"""Dateien aus dem DATENARCHIV im JARVIS-Fenster zeigen (statt sofort in Vorschau).
PDF seitenweise (PyMuPDF), Fotos direkt (HEIC über 'sips'), alles andere über Quick Look
('qlmanage', erste Seite). Die Bilder landen im lokalen Zwischenspeicher, nicht in der Cloud."""
import hashlib
import shutil
import subprocess
import tempfile
from pathlib import Path

from atlas.tools import S, Tool, ToolError, anzeige
from atlas.tools.archiv import ArchivTools
from atlas.tools.bild import DIR, _aufraeumen

MAX_KANTE = 2400
FOTO = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".tif", ".tiff"}
HEIC = {".heic", ".heif"}
INSTANZ = None                      # für die Endpunkte /vorschau und /archiv/oeffnen


class Vorschau:
    def __init__(self, archiv, shared: Path):
        self.at = ArchivTools(archiv, shared)

    def _ziel(self, p: Path, seite: int) -> Path:
        st = p.stat()
        key = hashlib.sha1(f"{p}|{st.st_mtime_ns}|{st.st_size}|{seite}".encode()).hexdigest()[:16]
        DIR.mkdir(parents=True, exist_ok=True)
        return DIR / f"{key}.jpg"

    @staticmethod
    def _speichern(img, ziel: Path) -> tuple[int, int]:
        from PIL import ImageOps
        img = ImageOps.exif_transpose(img)
        if img.mode not in ("RGB", "L"):
            hinten = img.convert("RGBA")
            from PIL import Image
            weiss = Image.new("RGB", hinten.size, (255, 255, 255))
            weiss.paste(hinten, mask=hinten.split()[-1])
            img = weiss
        img.thumbnail((MAX_KANTE, MAX_KANTE))
        img.convert("RGB").save(ziel, "JPEG", quality=88)
        return img.size

    def render(self, pfad: str, seite: int = 1) -> dict:
        p = self.at._path(pfad)
        if p.is_dir():
            raise ToolError("Das ist ein Ordner – bitte eine Datei angeben")
        from PIL import Image
        ext, seiten, seite = p.suffix.lower(), 1, max(1, int(seite or 1))
        if ext == ".pdf":
            try:
                import pymupdf as fitz
            except ImportError:
                import fitz
            with fitz.open(str(p)) as doc:
                seiten = doc.page_count
                seite = min(seite, seiten)
                ziel = self._ziel(p, seite)
                if not ziel.exists():
                    page = doc[seite - 1]
                    zoom = MAX_KANTE / max(page.rect.width, page.rect.height)
                    pix = page.get_pixmap(matrix=fitz.Matrix(zoom, zoom), alpha=False)
                    self._speichern(Image.frombytes("RGB", (pix.width, pix.height), pix.samples), ziel)
        else:
            ziel = self._ziel(p, 1)
            if not ziel.exists():
                if ext in FOTO:
                    with Image.open(p) as img:
                        self._speichern(img, ziel)
                elif ext in HEIC:
                    self._sips(p, ziel)
                else:
                    self._quicklook(p, ziel)
        with Image.open(ziel) as img:
            w, h = img.size
        _aufraeumen()
        return {"src": f"/bild/{ziel.name}", "titel": p.name, "pfad": self.at._rel(p),
                "seite": seite, "seiten": seiten, "art": "dokument",
                "seitenverhaeltnis": round(w / max(1, h), 3)}

    def _sips(self, p: Path, ziel: Path) -> None:
        try:
            subprocess.run(["sips", "-s", "format", "jpeg", "-Z", str(MAX_KANTE), str(p), "--out", str(ziel)],
                           check=True, capture_output=True, timeout=60)
        except (OSError, subprocess.SubprocessError) as e:
            raise ToolError(f"Foto konnte nicht umgewandelt werden: {e}")

    def _quicklook(self, p: Path, ziel: Path) -> None:
        """Erste Seite über Quick Look (Word, Excel, PowerPoint, Pages, Text …)."""
        tmp = Path(tempfile.mkdtemp(prefix="jarvis-ql-"))
        try:
            subprocess.run(["qlmanage", "-t", "-s", str(MAX_KANTE), "-o", str(tmp), str(p)],
                           capture_output=True, timeout=60)
            bilder = list(tmp.glob("*.png"))
            if not bilder:
                raise ToolError(f"Für '{p.name}' gibt es keine Vorschau – mit 'datei_oeffnen' im Programm öffnen")
            from PIL import Image
            with Image.open(bilder[0]) as img:
                self._speichern(img, ziel)
        except (OSError, subprocess.SubprocessError) as e:
            raise ToolError(f"Vorschau fehlgeschlagen: {e}")
        finally:
            shutil.rmtree(tmp, ignore_errors=True)

    def zeigen(self, pfad: str, seite: int = 1) -> dict:
        d = self.render(pfad, seite)
        if anzeige.SINK:
            anzeige.SINK({"type": "bild", "titel": d["titel"], "bilder": [d]})
        return {"angezeigt": bool(anzeige.SINK), "datei": d["pfad"], "seite": d["seite"], "seiten": d["seiten"],
                "hinweis": "Die Datei ist im Fenster zu sehen (Lupe per Maus, Klick öffnet sie in Vorschau, "
                           "Pfeiltasten blättern; der Ablageort steht darunter und führt per Klick zum Ordner). "
                           "Antworte nur kurz und nenne den Ablageort NICHT."}

    def in_vorschau_oeffnen(self, pfad: str) -> dict:
        p = self.at._path(pfad)
        app = ["-a", "Preview"] if p.suffix.lower() in FOTO | HEIC | {".pdf"} else []
        try:
            subprocess.run(["open", *app, str(p)], check=True, timeout=15)
        except (OSError, subprocess.SubprocessError) as e:
            raise ToolError(f"Konnte nicht öffnen: {e}")
        return {"geoeffnet": self.at._rel(p)}


def tools(cfg, secrets, archiv, shared: Path) -> list[Tool]:
    global INSTANZ
    INSTANZ = v = Vorschau(archiv, shared)
    return [Tool(
        "datei_zeigen",
        "Eine Datei aus dem DATENARCHIV im JARVIS-Fenster anzeigen (PDF, Scan, Foto, Word, Excel, "
        "PowerPoint …) – Standard, wenn der Nutzer etwas sehen/anschauen will. Mit Lupe; ein Klick öffnet "
        "sie in Vorschau. Pfad vorher mit 'archiv_suchen' ermitteln. 'seite' für mehrseitige PDFs.",
        "datei.lesen", v.zeigen,
        {"pfad": S("Pfad im DATENARCHIV"), "seite": {"type": "integer", "minimum": 1, "description": "Seite (PDF)"}},
        ["pfad"], label=lambda a: f"„{a.get('pfad', '')}“ anzeigen")]
