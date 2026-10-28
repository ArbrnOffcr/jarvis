"""HESTIA (IMMO) – Immobilienverwaltung: Objekte, Mieter, Mieten, Darlehen, Kennzahlen, Bilder, Fristen.

Datenschutz:
- Objektdaten liegen in ATLAS-Privat (iCloud, nur dieser Nutzer) und in ~/.atlas/cache.
- Der Mietvertrag wird NUR lokal gelesen: Text per PDF/Apple Vision auf dem Mac, Felder per lokalem Modell (Ollama).
  Ist das lokale Modell nicht bereit, wird abgebrochen – es gibt keinen Rückfall auf Claude.
- Werkzeug-Antworten an das Sprachmodell enthalten keine Namen oder Kontaktdaten der Mieter.
"""
import json
import re
import secrets
import shutil
import subprocess
import tempfile
import threading
from datetime import date, datetime
from pathlib import Path

import httpx

from atlas.paths import private_dir, read_private_json, write_private_json
from atlas.tools import S, Tool, ToolError

DATEI = "immobilien.json"
GRENZEN = {"brutto_gruen": 5.0, "brutto_gelb": 3.5, "cashflow_gruen": 0, "cashflow_gelb": -150,
           "beleihung_gruen": 60, "beleihung_gelb": 80, "dscr_gruen": 1.2, "dscr_gelb": 1.0, "kappung": 20}
UA = {"User-Agent": "JARVIS-Privatassistent/1.0 (persoenlicher Assistent)", "Accept-Language": "de"}
MAX_GALERIE = 5
BILD_ENDUNGEN = (".jpg", ".jpeg", ".png", ".heic", ".heif", ".webp")
FELDER_ZAHL = {"baujahr", "wohnflaeche", "grundstueck", "kaufpreis", "kaufnebenkosten", "marktwert", "nicht_umlagefaehig_jahr"}


def _zahl(x):
    if x in (None, ""):
        return None
    if isinstance(x, (int, float)):
        return float(x)
    s = re.sub(r"[^\d,.\-]", "", str(x))
    if re.fullmatch(r"-?\d{1,3}(\.\d{3})+", s):         # 500.000 → 500000
        s = s.replace(".", "")
    elif s.count(",") == 1 and (s.count(".") == 0 or s.rfind(",") > s.rfind(".")):
        s = s.replace(".", "").replace(",", ".")          # 1.234,56 → 1234.56
    else:
        s = s.replace(",", "")
    try:
        return float(s)
    except ValueError:
        return None


def _datum(x) -> date | None:
    if not x:
        return None
    s = str(x).strip()
    for f in ("%Y-%m-%d", "%d.%m.%Y", "%d.%m.%y", "%Y-%m"):
        try:
            d = datetime.strptime(s, f).date()
            return d
        except ValueError:
            continue
    m = re.match(r"(\d{1,2})/(\d{4})$", s)
    return date(int(m.group(2)), int(m.group(1)), 1) if m else None


def _monate(a: date, b: date) -> int:
    return (b.year - a.year) * 12 + b.month - a.month - (1 if b.day < a.day else 0)


def _plus_monate(d: date, n: int) -> date:
    import calendar
    j, m = divmod(d.month - 1 + n, 12)
    j, m = d.year + j, m + 1
    return date(j, m, min(d.day, calendar.monthrange(j, m)[1]))


class Immobilien:
    def __init__(self, core):
        self.c = core
        self.lock = threading.Lock()

    # ------------------------------------------------------------ Speicher
    def _laden(self) -> dict:
        return read_private_json(DATEI, {"objekte": [], "grenzen": dict(GRENZEN)})

    def _speichern(self, z: dict) -> None:
        write_private_json(DATEI, z)

    def _ordner(self, oid: str) -> Path:
        p = private_dir() / "immobilien" / oid
        p.mkdir(parents=True, exist_ok=True)
        return p

    def grenzen(self) -> dict:
        return {**GRENZEN, **(self._laden().get("grenzen") or {})}

    def grenzen_setzen(self, neu: dict) -> dict:
        with self.lock:
            z = self._laden()
            g = {**GRENZEN, **(z.get("grenzen") or {})}
            for k in GRENZEN:
                v = _zahl(neu.get(k))
                if v is not None:
                    g[k] = v
            z["grenzen"] = g
            self._speichern(z)
        return {"ok": True, "grenzen": g, "text": "✓ Grenzen gespeichert"}

    def _objekt_roh(self, oid: str) -> dict:
        for o in self._laden()["objekte"]:
            if o["id"] == oid:
                return o
        raise ToolError("Immobilie nicht gefunden")

    def finden(self, wort: str = "") -> dict:
        objs = self._laden()["objekte"]
        if not objs:
            raise ToolError("Noch keine Immobilie angelegt – im Immobilienfenster „＋ IMMOBILIE“")
        w = (wort or "").lower().strip()
        if w:
            for o in objs:
                if w in (o.get("name", "") + " " + o.get("adresse", "")).lower():
                    return o
        return objs[0]

    # ------------------------------------------------------------ Anlegen / Ändern
    def speichern(self, daten: dict, oid: str = "") -> dict:
        d = self._bereinigen(daten)
        if not d.get("adresse"):
            raise ToolError("Bitte die Adresse angeben")
        with self.lock:
            z = self._laden()
            alt = next((o for o in z["objekte"] if o["id"] == oid), None) if oid else None
            if alt:
                if d["adresse"] != alt.get("adresse") or alt.get("lat") is None:
                    d.update(self._geocode(d["adresse"]))
                else:
                    d["lat"], d["lon"] = alt.get("lat"), alt.get("lon")
                d["bilder"] = alt.get("bilder") or {"haupt": "", "galerie": []}
                d["id"] = oid
                d["angelegt"] = alt.get("angelegt")
                z["objekte"] = [d if o["id"] == oid else o for o in z["objekte"]]
            else:
                d.update(self._geocode(d["adresse"]))
                d["id"] = "obj-" + secrets.token_hex(3)
                d["bilder"] = {"haupt": "", "galerie": []}
                d["angelegt"] = date.today().isoformat()
                z["objekte"].append(d)
            self._speichern(z)
        try:
            self._fristen(d)
        except Exception:
            pass
        self.c.audit.log("immo_objekt", objekt=d["id"], aktion="geändert" if alt else "angelegt")
        return {"ok": True, "id": d["id"], "text": "✓ Gespeichert" if alt else "✓ Immobilie angelegt",
                "objekt": self.ansicht(d)}

    def _bereinigen(self, x: dict) -> dict:
        t = lambda k, n=120: str(x.get(k) or "").strip()[:n]
        d = {k: t(k) for k in ("name", "adresse", "art", "heizung", "energieklasse", "eigentuemer", "ordner", "kaufdatum",
                               "notiz")}
        for k in FELDER_ZAHL:
            d[k] = _zahl(x.get(k))
        m = x.get("mieter") or {}
        d["mieter"] = {"name": str(m.get("name") or "").strip()[:80], "seit": str(m.get("seit") or "")[:10],
                       "kontakt": str(m.get("kontakt") or "").strip()[:120], "kaution": _zahl(m.get("kaution")),
                       "mietart": str(m.get("mietart") or "vergleichsmiete")[:20]}
        mi = x.get("miete") or {}
        d["miete"] = {"kalt": _zahl(mi.get("kalt")), "nk": _zahl(mi.get("nk")),
                      "letzte_erhoehung": str(mi.get("letzte_erhoehung") or "")[:10]}
        d["darlehen"] = []
        for dl in (x.get("darlehen") or [])[:6]:
            e = {"bank": str(dl.get("bank") or "").strip()[:60], "betrag": _zahl(dl.get("betrag")),
                 "zins": _zahl(dl.get("zins")), "rate": _zahl(dl.get("rate")),
                 "zinsbindung_bis": str(dl.get("zinsbindung_bis") or "")[:10],
                 "restschuld": _zahl(dl.get("restschuld")), "restschuld_stand": str(dl.get("restschuld_stand") or "")[:10]}
            if e["betrag"] or e["restschuld"]:
                d["darlehen"].append(e)
        d["erhoehungen"] = []
        for e in (x.get("erhoehungen") or [])[:10]:
            if _datum(e.get("datum")) and _zahl(e.get("kalt_neu")):
                d["erhoehungen"].append({"datum": _datum(e["datum"]).isoformat(), "kalt_neu": _zahl(e["kalt_neu"]),
                                         "art": str(e.get("art") or "vergleichsmiete")[:20]})
        d["betriebskosten"] = [str(b)[:60] for b in (x.get("betriebskosten") or [])][:20]
        d["versorger"] = []
        for v in (x.get("versorger") or [])[:20]:
            if str(v.get("kostenart") or "").strip():
                d["versorger"].append({k: str(v.get(k) or "").strip()[:200] for k in
                                       ("kostenart", "name", "email", "anschrift", "kundennummer")})
        return d

    def _geocode(self, adresse: str) -> dict:
        try:
            r = httpx.get("https://nominatim.openstreetmap.org/search",
                          params={"q": adresse, "format": "json", "limit": 1, "countrycodes": "de"}, headers=UA, timeout=10)
            t = r.json()
            if t:
                return {"lat": float(t[0]["lat"]), "lon": float(t[0]["lon"])}
        except (httpx.HTTPError, ValueError, KeyError):
            pass
        try:
            from atlas.standort import geocode
            g = geocode(adresse)
            return {"lat": g["lat"], "lon": g["lon"]}
        except Exception:
            return {"lat": None, "lon": None}

    def verorten(self, oid: str) -> dict:
        """Koordinaten für die Adresse (erneut) suchen – z. B. wenn sie beim Anlegen nicht gefunden wurde."""
        with self.lock:
            z = self._laden()
            o = next((x for x in z["objekte"] if x["id"] == oid), None)
            if not o:
                raise ToolError("Immobilie nicht gefunden")
            o.update(self._geocode(o.get("adresse", "")))
            self._speichern(z)
        return {"ok": True, "lat": o.get("lat"), "lon": o.get("lon")}

    def entfernen(self, oid: str) -> dict:
        with self.lock:
            z = self._laden()
            z["objekte"] = [o for o in z["objekte"] if o["id"] != oid]
            self._speichern(z)
        ordner = private_dir() / "immobilien" / oid
        if ordner.exists():
            papierkorb = Path.home() / ".Trash" / f"JARVIS-Immobilie-{oid}"
            try:
                shutil.move(str(ordner), str(papierkorb))
            except OSError:
                pass
        return {"ok": True, "text": "✓ Entfernt (Bilder liegen im Papierkorb)"}

    # ------------------------------------------------------------ Fristen (Zinsbindung, Mieterhöhung)
    def _fristen(self, o: dict) -> None:
        fr = getattr(self.c, "fristen", None)
        if not fr:
            return
        marke = f"Immobilie: {o['id']}"
        for f in fr.zustand()["liste"]:
            if not f.get("erledigt") and marke in (f.get("notiz") or ""):
                fr.erledigt(f["id"])
        heute, name = date.today(), o.get("name") or o.get("adresse")
        for dl in o.get("darlehen") or []:
            ende = _datum(dl.get("zinsbindung_bis"))
            if ende and ende > heute:
                fr.eintragen(f"Zinsbindung endet: {dl.get('bank') or 'Darlehen'} ({name})", ende.isoformat(), "Vertrag",
                             marke, quelle="immobilien")
                pruefen = _plus_monate(ende, -12)
                if pruefen > heute:
                    fr.eintragen(f"Anschlussfinanzierung prüfen: {dl.get('bank') or 'Darlehen'} ({name})",
                                 pruefen.isoformat(), "Frist", marke, quelle="immobilien")
        for e in o.get("erhoehungen") or []:
            d = _datum(e["datum"])
            if d and d > heute:
                ank = _plus_monate(d, -3)          # Vergleichsmiete: Wirkung ab dem 3. Monat nach Zugang
                fr.eintragen(f"Mieterhöhung ankündigen ({name}): {e['kalt_neu']:.0f} € kalt ab {d.strftime('%d.%m.%Y')}",
                             (ank if ank > heute else heute).isoformat(), "Mietanpassung", marke, quelle="immobilien")

    # ------------------------------------------------------------ Kennzahlen
    @staticmethod
    def _restschuld(dl: dict, stichtag: date) -> float | None:
        rest, stand = dl.get("restschuld"), _datum(dl.get("restschuld_stand"))
        if rest is None:
            rest, stand = dl.get("betrag"), None
        if rest is None:
            return None
        if not stand or not dl.get("zins") or not dl.get("rate"):
            return rest
        z = dl["zins"] / 100 / 12
        for _ in range(max(0, min(600, _monate(stand, stichtag)))):
            rest = max(0.0, rest - (dl["rate"] - rest * z))
        return rest

    def kennzahlen(self, o: dict) -> dict:
        g, heute = self.grenzen(), date.today()
        mi = o.get("miete") or {}
        kalt, nk = mi.get("kalt"), mi.get("nk")
        warm = (kalt or 0) + (nk or 0) if kalt is not None else None
        jk = kalt * 12 if kalt else None
        kp, knk = o.get("kaufpreis"), o.get("kaufnebenkosten") or 0
        nuk = o.get("nicht_umlagefaehig_jahr") or 0
        dl = o.get("darlehen") or []
        rate = sum(x.get("rate") or 0 for x in dl)
        rest = sum(r for r in (self._restschuld(x, heute) for x in dl) if r is not None) if dl else 0
        betrag = sum(x.get("betrag") or 0 for x in dl)
        zinsen = sum((self._restschuld(x, heute) or 0) * (x.get("zins") or 0) / 100 for x in dl)
        wert = o.get("marktwert") or kp
        ek = (kp + knk - betrag) if kp else None
        k = {"warm": warm, "jahreskalt": jk, "rate": rate or None, "restschuld": round(rest) if dl else None,
             "kalt_qm": round(kalt / o["wohnflaeche"], 2) if kalt and o.get("wohnflaeche") else None,
             "brutto": round(jk / kp * 100, 2) if jk and kp else None,
             "netto": round((jk - nuk) / (kp + knk) * 100, 2) if jk and kp else None,
             "cashflow": round(kalt - rate - nuk / 12) if kalt is not None and dl else None,
             "beleihung": round(rest / wert * 100, 1) if dl and wert else None,
             "dscr": round(jk / (rate * 12), 2) if jk and rate else None,
             "tilgung": round((1 - rest / betrag) * 100, 1) if dl and betrag else None,
             "ek_rendite": round((jk - nuk - zinsen) / ek * 100, 1) if jk and ek and ek > 0 else None,
             "eigenkapital": round(ek) if ek is not None else None}
        seit = _datum((o.get("mieter") or {}).get("seit"))
        if seit:
            m = max(0, _monate(seit, heute))
            k["mietdauer"] = f"{m // 12} J {m % 12} M" if m >= 12 else f"{m} Monate"
        # Ampeln
        def amp(v, gr, ge, hoch=True):
            if v is None:
                return ""
            return ("gruen" if v >= gr else "gelb" if v >= ge else "rot") if hoch else \
                   ("gruen" if v <= gr else "gelb" if v <= ge else "rot")
        k["ampel"] = {"brutto": amp(k["brutto"], g["brutto_gruen"], g["brutto_gelb"]),
                      "cashflow": amp(k["cashflow"], g["cashflow_gruen"], g["cashflow_gelb"]),
                      "beleihung": amp(k["beleihung"], g["beleihung_gruen"], g["beleihung_gelb"], hoch=False),
                      "dscr": amp(k["dscr"], g["dscr_gruen"], g["dscr_gelb"])}
        # Restschuld zum Ende der Zinsbindung
        k["darlehen"] = []
        for x in dl:
            ende = _datum(x.get("zinsbindung_bis"))
            k["darlehen"].append({"rest_heute": round(self._restschuld(x, heute) or 0),
                                  "rest_ende": round(self._restschuld(x, ende) or 0) if ende else None,
                                  "monate_bis_ende": _monate(heute, ende) if ende else None})
        # Mieterhöhungen: frühester Termin und Kappungsgrenze (Vergleichsmiete, § 558 BGB)
        art = (o.get("mieter") or {}).get("mietart", "vergleichsmiete")
        basis = _datum(mi.get("letzte_erhoehung")) or seit
        k["erhoehung_ab"] = _plus_monate(basis, 15).isoformat() if basis and art == "vergleichsmiete" else None
        k["erhoehungen"] = []
        for e in o.get("erhoehungen") or []:
            pr = round((e["kalt_neu"] / kalt - 1) * 100, 1) if kalt else None
            hinweis = ""
            if art == "vergleichsmiete":
                if k["erhoehung_ab"] and e["datum"] < k["erhoehung_ab"]:
                    hinweis = f"frühestens ab {_datum(k['erhoehung_ab']).strftime('%d.%m.%Y')} wirksam (15 Monate)"
                elif pr is not None and pr > g["kappung"]:
                    hinweis = f"über der Kappungsgrenze ({g['kappung']:.0f} % in 3 Jahren)"
            elif art in ("staffelmiete", "indexmiete"):
                hinweis = "Staffel-/Indexmiete: § 558 gilt nicht – Vertrag maßgeblich"
            k["erhoehungen"].append({**e, "prozent": pr, "hinweis": hinweis})
        return k

    def ansicht(self, o: dict) -> dict:
        b = o.get("bilder") or {}
        return {**o, "kennzahlen": self.kennzahlen(o), "bilder": {"haupt": b.get("haupt", ""), "galerie": b.get("galerie", [])}}

    def alle(self) -> dict:
        z = self._laden()
        objs = [self.ansicht(o) for o in z["objekte"]]
        summe = {"objekte": len(objs), "kalt_monat": sum((o["miete"].get("kalt") or 0) for o in objs),
                 "restschuld": sum((o["kennzahlen"].get("restschuld") or 0) for o in objs),
                 "cashflow": sum((o["kennzahlen"].get("cashflow") or 0) for o in objs)}
        return {"objekte": objs, "summe": summe, "grenzen": self.grenzen()}

    # ------------------------------------------------------------ Bilder
    def bild_hochladen(self, oid: str, daten: bytes, name: str, haupt: bool = False) -> dict:
        if len(daten) < 1000 or len(daten) > 30_000_000:
            raise ToolError("Bitte ein Bild (JPG, PNG, HEIC) bis 30 MB")
        endung = Path(name or "bild.jpg").suffix.lower()
        if endung not in BILD_ENDUNGEN:
            raise ToolError("Bitte ein Bild (JPG, PNG, HEIC)")
        with self.lock:
            z = self._laden()
            o = next((x for x in z["objekte"] if x["id"] == oid), None)
            if not o:
                raise ToolError("Immobilie nicht gefunden")
            b = o.setdefault("bilder", {"haupt": "", "galerie": []})
            if not haupt and len(b.get("galerie") or []) >= MAX_GALERIE:
                raise ToolError(f"Die Galerie hat schon {MAX_GALERIE} Bilder – zuerst eines entfernen")
            ordner = self._ordner(oid)
            datei = f"bild-{secrets.token_hex(4)}.jpg" if endung in (".heic", ".heif", ".webp") else f"bild-{secrets.token_hex(4)}{endung}"
            ziel = ordner / datei
            if endung in (".heic", ".heif", ".webp"):
                tmp = ordner / f"_roh{endung}"
                tmp.write_bytes(daten)
                subprocess.run(["sips", "-s", "format", "jpeg", "-Z", "2400", str(tmp), "--out", str(ziel)], capture_output=True)
                tmp.unlink(missing_ok=True)
                if not ziel.exists():
                    raise ToolError("Bild konnte nicht umgewandelt werden")
            else:
                ziel.write_bytes(daten)
            if haupt:
                if b.get("haupt") and b["haupt"] not in (b.get("galerie") or []):
                    (ordner / b["haupt"]).unlink(missing_ok=True)
                b["haupt"] = datei
            else:
                b.setdefault("galerie", []).append(datei)
                if not b.get("haupt"):
                    b["haupt"] = datei
            self._speichern(z)
        return {"ok": True, "datei": datei, "bilder": b}

    def bild_aktion(self, oid: str, datei: str, aktion: str) -> dict:
        with self.lock:
            z = self._laden()
            o = next((x for x in z["objekte"] if x["id"] == oid), None)
            if not o:
                raise ToolError("Immobilie nicht gefunden")
            b = o.setdefault("bilder", {"haupt": "", "galerie": []})
            if aktion == "haupt":
                if datei not in b.get("galerie", []):
                    raise ToolError("Bild nicht in der Galerie")
                b["haupt"] = datei
            elif aktion == "entfernen":
                b["galerie"] = [x for x in b.get("galerie", []) if x != datei]
                if b.get("haupt") == datei:
                    b["haupt"] = b["galerie"][0] if b["galerie"] else ""
                (self._ordner(oid) / datei).unlink(missing_ok=True)
            self._speichern(z)
        return {"ok": True, "bilder": b}

    def bild(self, oid: str, datei: str) -> tuple[bytes, str] | None:
        if not re.fullmatch(r"bild-[0-9a-f]{8}\.(jpg|jpeg|png|webp)", datei or ""):
            return None
        p = private_dir() / "immobilien" / oid / datei
        if not p.exists():
            return None
        return p.read_bytes(), {"png": "image/png", "webp": "image/webp"}.get(p.suffix[1:], "image/jpeg")

    # ------------------------------------------------------------ Mietvertrag NUR lokal auslesen
    def mietvertrag_lesen(self, daten: bytes, name: str = "Mietvertrag.pdf") -> dict:
        lokal = self.c.providers.get("lokal")
        if not lokal or not lokal.available():
            raise ToolError("Das lokale Modell ist nicht bereit (Einstellungen → Konten → Lokales Sprachmodell). "
                            "Der Mietvertrag wird bewusst nicht an Claude gegeben.")
        endung = Path(name).suffix.lower() or ".pdf"
        with tempfile.TemporaryDirectory(prefix="jarvis-mv-") as tmp:
            p = Path(tmp) / f"mietvertrag{endung}"
            p.write_bytes(daten)
            from atlas.archiv.extract import extract
            seiten = extract(p, ocr=True)
        text = "\n".join(t for _, t in seiten)
        if len(text.strip()) < 200:
            raise ToolError("Im Dokument wurde kaum Text erkannt – ist es ein gut lesbarer Scan?")
        auszug = self._auszug(text)
        from atlas import hilfen
        schema = ('{"adresse": "Straße Nr, PLZ Ort des Mietobjekts", "art": "Einfamilienhaus|Wohnung|…", '
                  '"wohnflaeche": Zahl in m², "mieter_name": "Name(n) der Mieter", "mietbeginn": "JJJJ-MM-TT", '
                  '"kaltmiete": Zahl in € pro Monat, "nk_vorauszahlung": Zahl in € pro Monat, "kaution": Zahl in €, '
                  '"mietart": "vergleichsmiete|staffelmiete|indexmiete", "vermieter": "Name des Vermieters", '
                  '"betriebskosten": ["vereinbarte umlagefähige Kostenarten, kurz"]}')
        j = hilfen.lokal_json(lokal, "Du liest einen deutschen Wohnraummietvertrag und antwortest nur mit JSON. "
                                     "Erfinde nichts; unbekannt = null.",
                              f"Antworte nur mit JSON in dieser Form: {schema}\n\nAuszug aus dem Mietvertrag:\n{auszug}",
                              900) or {}
        # Gegenprobe gegen den Text und Regex-Rückfall für Beträge
        v = {"adresse": str(j.get("adresse") or "").strip()[:120], "art": str(j.get("art") or "").strip()[:40],
             "wohnflaeche": _zahl(j.get("wohnflaeche")), "mieter": {"name": str(j.get("mieter_name") or "").strip()[:80],
                                                                  "seit": "", "kaution": _zahl(j.get("kaution")),
                                                                  "mietart": str(j.get("mietart") or "").lower()[:20]},
             "miete": {"kalt": _zahl(j.get("kaltmiete")), "nk": _zahl(j.get("nk_vorauszahlung"))},
             "eigentuemer": str(j.get("vermieter") or "").strip()[:80],
             "betriebskosten": [str(b)[:60] for b in (j.get("betriebskosten") or []) if b][:20]}
        d = _datum(j.get("mietbeginn"))
        v["mieter"]["seit"] = d.isoformat() if d else ""
        if v["mieter"]["mietart"] not in ("vergleichsmiete", "staffelmiete", "indexmiete"):
            v["mieter"]["mietart"] = ("staffelmiete" if re.search(r"staffelmiete", text, re.I) else
                                      "indexmiete" if re.search(r"indexmiete|verbraucherpreisindex", text, re.I) else "vergleichsmiete")
        for feld, rx in (("kalt", r"(?:nettokalt|grundmiete|kaltmiete|miete beträgt)[^\d]{0,60}([\d.]+,\d{2})"),
                         ("nk", r"(?:vorauszahlung|betriebskosten)[^\d]{0,80}([\d.]+,\d{2})")):
            if v["miete"][feld] is None:
                m = re.search(rx, text, re.I)
                if m:
                    v["miete"][feld] = _zahl(m.group(1))
        geprueft = {k: bool(val) for k, val in (("adresse", v["adresse"] and v["adresse"].split()[0].lower() in text.lower()),
                                                ("kalt", v["miete"]["kalt"]), ("nk", v["miete"]["nk"]),
                                                ("seit", v["mieter"]["seit"]), ("wohnflaeche", v["wohnflaeche"]))}
        self.c.audit.log("immo_mietvertrag_lokal", seiten=len(seiten), modell="lokal")
        return {"ok": True, "vorschlag": v, "gefunden": geprueft,
                "text": "✓ Lokal ausgelesen – bitte jeden Wert prüfen, bevor du speicherst."}

    @staticmethod
    def _auszug(text: str, grenze: int = 7000) -> str:
        """Nur die Stellen, die für die Stammdaten zählen (passt in das Kontextfenster des lokalen Modells)."""
        rx = re.compile(r"mieter|vermieter|mietobjekt|wohnung|haus|straße|str\.|weg\b|plz|\b\d{5}\b|wohnfläche|m²|qm|"
                        r"beginn|mietverhältnis|beginnt|miete|nettokalt|grundmiete|vorauszahlung|betriebskosten|"
                        r"heizkosten|kaution|sicherheit|staffel|index|€|eur", re.I)
        zeilen = [z.strip() for z in text.splitlines() if z.strip()]
        out, gesehen = [], set()
        for i, z in enumerate(zeilen):
            if rx.search(z):
                for k in range(max(0, i - 1), min(len(zeilen), i + 2)):
                    if k not in gesehen:
                        gesehen.add(k)
                        out.append(zeilen[k])
            if sum(len(x) for x in out) > grenze:
                break
        return "\n".join(out)[:grenze]


# ---------------------------------------------------------------- Werkzeuge (ohne Mieternamen an das Modell)
def tools(core) -> list[Tool]:
    im = core.immobilien

    def zeigen(objekt=""):
        d = im.alle()
        if not d["objekte"]:
            core.broadcast({"type": "immobilien", "daten": d})
            return {"angezeigt": True, "objekte": 0, "hinweis": "Noch keine Immobilie angelegt – im Fenster „＋ IMMOBILIE“."}
        o = im.finden(objekt) if objekt else d["objekte"][0]
        core.broadcast({"type": "immobilien", "daten": d, "aktiv": o["id"]})
        return {"angezeigt": True, "objekte": len(d["objekte"]), **_kurz(im.ansicht(o))}

    def kennzahlen(objekt=""):
        return _kurz(im.ansicht(im.finden(objekt)))

    def erhoehung(datum, kalt_neu, objekt="", art="vergleichsmiete"):
        o = im.finden(objekt)
        e = list(o.get("erhoehungen") or []) + [{"datum": datum, "kalt_neu": kalt_neu, "art": art}]
        erg = im.speichern({**o, "erhoehungen": e}, o["id"])
        ke = erg["objekt"]["kennzahlen"]["erhoehungen"]
        return {"ok": True, "geplant": ke[-1] if ke else None}

    return [
        Tool("immobilien_zeigen",
             "Immobiliendashboard im Dashboard öffnen: Karte, Bilder, Mieter, Miete, Darlehen, Kennzahlen "
             "(Bruttomietrendite, Cashflow, Beleihung …). Für „Zeig mir meine Immobilie(n)“, „Wie läuft das Haus?“.",
             "immo.lesen", zeigen, {"objekt": S("Name oder Teil der Adresse, optional")}),
        Tool("immobilie_kennzahlen", "Kennzahlen einer Immobilie ohne Anzeige: Miete kalt/warm, Rendite, Cashflow, "
             "Restschuld, Zinsbindung, nächste mögliche Mieterhöhung.", "immo.lesen", kennzahlen,
             {"objekt": S("Name oder Teil der Adresse, optional")}),
        Tool("immobilie_mieterhoehung_planen",
             "Geplante Mieterhöhung eintragen (Datum der Wirkung, neue Kaltmiete). Prüft 15-Monats-Sperrfrist und "
             "Kappungsgrenze und legt eine Frist zum Ankündigen an.", "immo.objekt", erhoehung,
             {"datum": S("TT.MM.JJJJ, ab wann die neue Miete gilt"), "kalt_neu": {"type": "number"},
              "objekt": S("optional"), "art": S("vergleichsmiete|staffelmiete|indexmiete")}, ["datum", "kalt_neu"],
             label=lambda a: f"Mieterhöhung planen: {a.get('kalt_neu')} € kalt ab {a.get('datum')}"),
    ]


def _kurz(o: dict) -> dict:
    k, mi = o["kennzahlen"], o.get("miete") or {}
    return {"objekt": o.get("name") or o.get("adresse"), "art": o.get("art"), "wohnflaeche": o.get("wohnflaeche"),
            "vermietet_seit": (o.get("mieter") or {}).get("seit"), "mietdauer": k.get("mietdauer"),
            "kalt": mi.get("kalt"), "nk_vorauszahlung": mi.get("nk"), "warm": k.get("warm"),
            "bruttomietrendite_prozent": k.get("brutto"), "nettomietrendite_prozent": k.get("netto"),
            "cashflow_monat": k.get("cashflow"), "restschuld": k.get("restschuld"), "beleihung_prozent": k.get("beleihung"),
            "kapitaldienstdeckung": k.get("dscr"), "mieterhoehung_fruehestens": k.get("erhoehung_ab"),
            "geplante_erhoehungen": k.get("erhoehungen"),
            "zinsbindung": [d.get("zinsbindung_bis") for d in o.get("darlehen") or []]}
