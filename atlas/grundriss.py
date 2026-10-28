"""HESTIA – Grundriss zu 3D.

1. Grundriss (PDF, Foto, HEIC) hochladen → lokal als PNG gespeichert (ATLAS-Privat/immobilien/<objekt>/).
2. Erkennen: NUR nach ausdrücklicher Freigabe pro Grundriss geht das Bild an Claude (Vision). Zurück kommt ein
   Plan in Bildpixeln: Wände, Türen, Fenster, Räume, Maßketten.
3. Korrigieren im Editor (Wände ziehen, Öffnungen setzen, Maßstab über eine bekannte Länge).
4. Das Dashboard baut daraus das 3D-Modell (Three.js); Flächen werden mit der Wohnfläche abgeglichen.
"""
import base64
import json
import math
import re
import secrets
import subprocess
from datetime import datetime
from pathlib import Path

from atlas.paths import private_dir
from atlas.tools import ToolError

MAX_KANTE = 2000
PROMPT = """Du bekommst einen Grundriss (Architektenplan, Skizze oder Foto) eines Stockwerks. Erfasse ihn als Vektorplan.
Alle Koordinaten in PIXELN dieses Bildes ({b} × {h}), Ursprung oben links.
Antworte NUR mit JSON in genau dieser Form, ohne Erklärung:
{{"waende": [{{"x1": 0, "y1": 0, "x2": 0, "y2": 0, "aussen": true}}],
  "tueren": [{{"x": 0, "y": 0, "breite_px": 0}}],
  "fenster": [{{"x": 0, "y": 0, "breite_px": 0}}],
  "raeume": [{{"name": "Wohnen", "polygon": [[0,0],[0,0],[0,0]], "flaeche_m2_laut_plan": null}}],
  "masse": [{{"x1": 0, "y1": 0, "x2": 0, "y2": 0, "laenge_m": 0.0}}],
  "stockwerk": "EG|OG|DG|KG|unbekannt", "hinweis": "kurz, was unsicher ist"}}
Regeln: Wände als Mittellinien, gerade Abschnitte, Ecken möglichst exakt auf gemeinsamen Punkten. Türen und Fenster als
Mittelpunkt auf der Wand mit lichter Breite in Pixeln. Räume als geschlossene Polygone entlang der Innenwände; Name wie im
Plan (Wohnen, Küche, Bad, Schlafen, Kind, Flur, HWR …), m² nur wenn im Plan angegeben. Maßketten: nur gut lesbare Maße,
in Metern (z. B. 4,51 → 4.51; cm → durch 100). Erfinde nichts."""


def _ordner(oid: str) -> Path:
    if not re.fullmatch(r"obj-[0-9a-f]{6}", oid or ""):
        raise ToolError("Ungültige Immobilie")
    p = private_dir() / "immobilien" / oid
    p.mkdir(parents=True, exist_ok=True)
    return p


def _gid_ok(gid: str) -> str:
    if not re.fullmatch(r"g[0-9a-f]{6}", gid or ""):
        raise ToolError("Ungültiger Grundriss")
    return gid


class Grundriss:
    def __init__(self, core):
        self.c = core

    # ------------------------------------------------------------ Liste, Laden, Speichern
    def liste(self, oid: str) -> list[dict]:
        out = []
        for f in sorted(_ordner(oid).glob("grundriss-g*.json")):
            try:
                p = json.loads(f.read_text())
            except (OSError, ValueError):
                continue
            out.append(self._mit_flaechen(p))
        return sorted(out, key=lambda p: p.get("reihenfolge", 0))

    def laden(self, oid: str, gid: str) -> dict:
        f = _ordner(oid) / f"grundriss-{_gid_ok(gid)}.json"
        if not f.exists():
            raise ToolError("Grundriss nicht gefunden")
        return json.loads(f.read_text())

    def speichern(self, oid: str, gid: str, plan: dict) -> dict:
        alt = self.laden(oid, gid)
        neu = {**alt}
        for k in ("waende", "oeffnungen", "raeume", "masse"):
            if isinstance(plan.get(k), list):
                neu[k] = plan[k][:800]
        for k in ("stockwerk", "name"):
            if plan.get(k):
                neu[k] = str(plan[k])[:30]
        for k in ("massstab", "wandhoehe", "reihenfolge"):
            if plan.get(k) is not None:
                try:
                    neu[k] = float(plan[k])
                except (TypeError, ValueError):
                    pass
        neu["geaendert"] = datetime.now().isoformat(timespec="minutes")
        neu["korrigiert"] = True
        (_ordner(oid) / f"grundriss-{gid}.json").write_text(json.dumps(neu, ensure_ascii=False))
        return {"ok": True, "plan": self._mit_flaechen(neu)}

    def entfernen(self, oid: str, gid: str) -> dict:
        o = _ordner(oid)
        for f in (o / f"grundriss-{_gid_ok(gid)}.json", o / f"grundriss-{gid}.png"):
            f.unlink(missing_ok=True)
        return {"ok": True}

    def bild(self, oid: str, gid: str) -> bytes | None:
        f = _ordner(oid) / f"grundriss-{_gid_ok(gid)}.png"
        return f.read_bytes() if f.exists() else None

    # ------------------------------------------------------------ Hochladen (lokal, in PNG umwandeln)
    def hochladen(self, oid: str, daten: bytes, name: str, stockwerk: str = "") -> dict:
        if len(daten) < 500 or len(daten) > 40_000_000:
            raise ToolError("Bitte eine Datei bis 40 MB (PDF, PNG, JPG, HEIC)")
        gid = "g" + secrets.token_hex(3)
        o = _ordner(oid)
        ziel = o / f"grundriss-{gid}.png"
        endung = Path(name or "plan.pdf").suffix.lower()
        if endung == ".pdf" or daten[:4] == b"%PDF":
            import fitz
            with fitz.open(stream=daten, filetype="pdf") as doc:
                seite = doc[0]
                faktor = min(4.0, MAX_KANTE / max(seite.rect.width, seite.rect.height))
                seite.get_pixmap(matrix=fitz.Matrix(faktor, faktor), alpha=False).save(str(ziel))
        else:
            roh = o / f"_roh-{gid}{endung or '.jpg'}"
            roh.write_bytes(daten)
            r = subprocess.run(["sips", "-s", "format", "png", "-Z", str(MAX_KANTE), str(roh), "--out", str(ziel)],
                               capture_output=True)
            roh.unlink(missing_ok=True)
            if r.returncode or not ziel.exists():
                raise ToolError("Bild konnte nicht gelesen werden")
        b, h = self._groesse(ziel)
        anzahl = len(self.liste(oid))
        plan = {"id": gid, "objekt": oid, "stockwerk": stockwerk or ("EG" if not anzahl else f"Ebene {anzahl + 1}"),
                "bild_b": b, "bild_h": h, "waende": [], "oeffnungen": [], "raeume": [], "masse": [], "massstab": None,
                "wandhoehe": 2.5, "reihenfolge": anzahl, "erkannt": "", "korrigiert": False,
                "angelegt": datetime.now().isoformat(timespec="minutes"), "original": (name or "")[:120]}
        (o / f"grundriss-{gid}.json").write_text(json.dumps(plan, ensure_ascii=False))
        return {"ok": True, "plan": plan, "text": "✓ Grundriss übernommen – jetzt erkennen lassen oder selbst zeichnen"}

    @staticmethod
    def _groesse(p: Path) -> tuple[int, int]:
        with p.open("rb") as f:
            kopf = f.read(24)
        return int.from_bytes(kopf[16:20], "big"), int.from_bytes(kopf[20:24], "big")

    # ------------------------------------------------------------ Erkennen (Claude Vision – nur mit Freigabe)
    def erkennen(self, oid: str, gid: str, freigabe: bool) -> dict:
        if not freigabe:
            raise ToolError("Das Erkennen schickt den Grundriss an Claude – bitte ausdrücklich freigeben")
        plan = self.laden(oid, gid)
        bild = self.bild(oid, gid)
        claude = self.c.providers.get("claude")
        if not bild or not claude or not claude.available():
            raise ToolError("Claude ist nicht eingerichtet (Einstellungen → Konten & Schlüssel)")
        modell = None
        for alias in ("opus", "sonnet"):
            try:
                modell = claude.resolve_model(alias)
                break
            except Exception:
                continue
        if not modell:
            raise ToolError("Kein passendes Claude-Modell verfügbar")
        try:
            r = claude.client.messages.create(
                model=modell, max_tokens=12000,
                messages=[{"role": "user", "content": [
                    {"type": "image", "source": {"type": "base64", "media_type": "image/png",
                                                 "data": base64.b64encode(bild).decode()}},
                    {"type": "text", "text": PROMPT.format(b=plan["bild_b"], h=plan["bild_h"])}]}])
        except Exception as e:
            raise ToolError(f"Claude konnte den Grundriss nicht lesen: {e}"[:300])
        text = "".join(getattr(b, "text", "") for b in r.content)
        m = re.search(r"\{.*\}", text, re.S)
        try:
            roh = json.loads(m.group(0)) if m else {}
        except ValueError:
            roh = {}
        if not roh.get("waende"):
            raise ToolError("Im Bild wurden keine Wände erkannt – ist es ein Grundriss? Du kannst die Wände auch selbst zeichnen.")
        self.c.audit.log("grundriss_cloud", objekt=oid, grundriss=gid, modell=modell, freigabe=True)
        try:
            preis = (self.c.cfg.get("preise") or {}).get("opus" if "opus" in modell else "sonnet", [2, 10])
            kosten = (r.usage.input_tokens * preis[0] + r.usage.output_tokens * preis[1]) / 1e6
        except Exception:
            kosten = None
        neu = self._aufbereiten(roh, plan)
        neu["erkannt"] = datetime.now().isoformat(timespec="minutes")
        neu["erkannt_mit"] = modell
        (_ordner(oid) / f"grundriss-{gid}.json").write_text(json.dumps(neu, ensure_ascii=False))
        return {"ok": True, "plan": self._mit_flaechen(neu), "kosten_eur": round(kosten, 3) if kosten else None,
                "hinweis": str(roh.get("hinweis") or "")[:300],
                "text": f"✓ Erkannt: {len(neu['waende'])} Wände, {len(neu['oeffnungen'])} Öffnungen, {len(neu['raeume'])} Räume"
                        + ("" if neu.get("massstab") else " – bitte Maßstab setzen")}

    def _aufbereiten(self, roh: dict, plan: dict) -> dict:
        z = lambda v: float(v) if isinstance(v, (int, float)) else 0.0
        waende = []
        for w in roh.get("waende") or []:
            a = [z(w.get("x1")), z(w.get("y1")), z(w.get("x2")), z(w.get("y2"))]
            if math.hypot(a[2] - a[0], a[3] - a[1]) >= 4:
                waende.append({"x1": a[0], "y1": a[1], "x2": a[2], "y2": a[3], "aussen": bool(w.get("aussen"))})
        waende = self._einrasten(waende)
        oeff = []
        for typ, liste in (("tuer", roh.get("tueren")), ("fenster", roh.get("fenster"))):
            for t in liste or []:
                zu = self._auf_wand(waende, z(t.get("x")), z(t.get("y")))
                if zu:
                    oeff.append({"typ": typ, "wand": zu[0], "pos": round(zu[1], 4), "breite_px": max(6.0, z(t.get("breite_px")))})
        raeume = []
        for r in roh.get("raeume") or []:
            poly = [[z(p[0]), z(p[1])] for p in (r.get("polygon") or []) if isinstance(p, (list, tuple)) and len(p) >= 2]
            if len(poly) >= 3:
                raeume.append({"name": str(r.get("name") or "Raum")[:30], "polygon": poly,
                               "flaeche_plan": r.get("flaeche_m2_laut_plan") if isinstance(r.get("flaeche_m2_laut_plan"), (int, float)) else None})
        masse = []
        for m in roh.get("masse") or []:
            px = math.hypot(z(m.get("x2")) - z(m.get("x1")), z(m.get("y2")) - z(m.get("y1")))
            if px > 20 and 0.3 < z(m.get("laenge_m")) < 60:
                masse.append({"x1": z(m["x1"]), "y1": z(m["y1"]), "x2": z(m["x2"]), "y2": z(m["y2"]), "laenge_m": z(m["laenge_m"]),
                              "m_pro_px": z(m["laenge_m"]) / px})
        massstab = plan.get("massstab")
        if masse:                                         # Median der Maßketten als Maßstab-Vorschlag
            werte = sorted(m["m_pro_px"] for m in masse)
            massstab = werte[len(werte) // 2]
        for o in oeff:
            o["breite_m"] = round(o.pop("breite_px") * massstab, 2) if massstab else (0.9 if o["typ"] == "tuer" else 1.2)
        st = str(roh.get("stockwerk") or "")
        return {**plan, "waende": waende, "oeffnungen": oeff, "raeume": raeume, "masse": masse, "massstab": massstab,
                "stockwerk": st if st in ("EG", "OG", "DG", "KG") and not plan.get("korrigiert") else plan["stockwerk"]}

    @staticmethod
    def _einrasten(waende: list[dict], toleranz: float = 10) -> list[dict]:
        """Wandenden, die fast zusammenfallen, auf einen gemeinsamen Punkt ziehen (saubere Ecken)."""
        punkte = []
        for w in waende:
            for a in (("x1", "y1"), ("x2", "y2")):
                p = (w[a[0]], w[a[1]])
                ziel = next((q for q in punkte if math.hypot(q[0] - p[0], q[1] - p[1]) <= toleranz), None)
                if ziel:
                    w[a[0]], w[a[1]] = ziel
                else:
                    punkte.append(p)
        return waende

    @staticmethod
    def _auf_wand(waende: list[dict], x: float, y: float) -> tuple[int, float] | None:
        best = None
        for i, w in enumerate(waende):
            dx, dy = w["x2"] - w["x1"], w["y2"] - w["y1"]
            l2 = dx * dx + dy * dy
            if not l2:
                continue
            t = max(0.0, min(1.0, ((x - w["x1"]) * dx + (y - w["y1"]) * dy) / l2))
            d = math.hypot(w["x1"] + t * dx - x, w["y1"] + t * dy - y)
            if best is None or d < best[2]:
                best = (i, t, d)
        return (best[0], best[1]) if best and best[2] < 40 else None

    # ------------------------------------------------------------ Flächen
    @staticmethod
    def _flaeche_px(poly: list) -> float:
        return abs(sum(poly[i][0] * poly[(i + 1) % len(poly)][1] - poly[(i + 1) % len(poly)][0] * poly[i][1]
                       for i in range(len(poly)))) / 2

    def _mit_flaechen(self, p: dict) -> dict:
        s = p.get("massstab")
        summe = 0.0
        for r in p.get("raeume") or []:
            r["flaeche"] = round(self._flaeche_px(r["polygon"]) * s * s, 2) if s else None
            summe += r.get("flaeche_plan") or r["flaeche"] or 0
        p["flaeche_summe"] = round(summe, 1) if summe else None
        return p

    def abgleich(self, oid: str) -> dict:
        plaene = self.liste(oid)
        summe = sum(p.get("flaeche_summe") or 0 for p in plaene)
        o = self.c.immobilien._objekt_roh(oid)
        wf = o.get("wohnflaeche")
        abw = round((summe / wf - 1) * 100, 1) if summe and wf else None
        return {"summe_modell": round(summe, 1) if summe else None, "wohnflaeche": wf, "abweichung_prozent": abw,
                "warnung": abs(abw) > 10 if abw is not None else False}
