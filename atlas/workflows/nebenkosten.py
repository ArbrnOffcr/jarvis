"""HESTIA – Nebenkosten (Betriebskosten) je Objekt und Jahr.

Ablauf: Belegliste anlegen → Postfach (iCloud-Alias) und Objektordner überwachen → Belege LOKAL erkennen →
Ablage nur nach Bestätigung → fehlende Belege anfragen (Mail/Brief nach Billigung) → Abrechnungsentwurf (PDF) →
Billigung → Versand an den Mieter → Zugang vermerken, Zahlungs-/Auszahlungsfrist.

Datenschutz: Belege werden auf dem Mac gelesen (Text + lokales Modell). Claude bekommt über die Werkzeuge nur
Kostenart, Zeitraum, Betrag und Status – keine Namen, Anschriften, Kundennummern oder Kontodaten. Die
Bankverbindung für Abrechnungen liegt im Schlüsselbund.
"""
import calendar
import email
import email.utils
import hashlib
import imaplib
import json
import math
import re
import secrets
import shutil
import smtplib
import subprocess
import threading
import time
from datetime import date, datetime, timedelta
from email.message import EmailMessage
from email.policy import default
from pathlib import Path

from atlas.keystore import get_secret, set_secret
from atlas.paths import LOCAL_DIR, find_archive, read_private_json, write_private_json
from atlas.tools import S, Tool, ToolError

DATEI = "nebenkosten.json"
EINGANG = LOCAL_DIR / "hestia" / "eingang"
ENTWURF = LOCAL_DIR / "hestia" / "entwuerfe"
ZIEL_MONAT, ZIEL_TAG = 3, 31          # Belege bis 31.03. des Folgejahres
ABRECHNEN_MONAT, ABRECHNEN_TAG = 6, 30  # Abrechnung bis 30.06.
ERINNERN_TAGE = 21
UNTERORDNER = "Nebenkosten"

# Kostenarten nach § 2 BetrKV mit Erkennungsmerkmalen
KOSTENARTEN = {
    "grundsteuer": ("Grundsteuer", "§ 2 Nr. 1 BetrKV", r"grundsteuer|grundbesitzabgabe"),
    "wasser": ("Wasserversorgung", "§ 2 Nr. 2 BetrKV", r"trinkwasser|wasserversorg|frischwasser|wasserverbrauch|wasserzähler"),
    "abwasser": ("Entwässerung", "§ 2 Nr. 3 BetrKV", r"abwasser|schmutzwasser|niederschlagswasser|entwässerung"),
    "heizung": ("Heizung – Wartung Wärmepumpe", "§ 2 Nr. 4a BetrKV", r"wärmepumpe|heizungswartung|wartung.{0,30}heiz"),
    "muell": ("Müllbeseitigung", "§ 2 Nr. 8 BetrKV", r"abfall|müll|muell|restabfall|biotonne|entsorgung"),
    "strassenreinigung": ("Straßenreinigung / Winterdienst", "§ 2 Nr. 8 BetrKV", r"straßenreinigung|winterdienst"),
    "garten": ("Gartenpflege", "§ 2 Nr. 10 BetrKV", r"gartenpflege|rasenmähen|baumschnitt|grünpflege"),
    "schornstein": ("Schornsteinfeger", "§ 2 Nr. 12 BetrKV", r"schornsteinfeger|kehrbezirk|feuerstätten"),
    "versicherung": ("Sach- und Haftpflichtversicherung", "§ 2 Nr. 13 BetrKV",
                     r"wohngebäude|gebäudeversicherung|haus- und grundbesitzer|grundbesitzerhaftpflicht|elementar|"
                     r"versicherung.{0,60}(gebäude|wohnhaus|einfamilienhaus|grundstück)"),
    "rauchmelder": ("Rauchwarnmelder – Wartung", "§ 2 Nr. 17 BetrKV", r"rauchwarnmelder|rauchmelder"),
    "sonstige": ("Sonstige Betriebskosten", "§ 2 Nr. 17 BetrKV", r"$^"),
}
STANDARD = ["grundsteuer", "wasser", "abwasser", "muell", "versicherung"]
BETRAG = re.compile(r"(?:gesamtbetrag|rechnungsbetrag|jahresbetrag|endbetrag|zu zahlen|summe|gesamt|betrag)\D{0,40}?"
                    r"(\d{1,3}(?:\.\d{3})*,\d{2})\s*(?:€|eur)", re.I)
ZEITRAUM = re.compile(r"(\d{1,2}\.\d{1,2}\.\d{4})\s*(?:-|–|bis)\s*(\d{1,2}\.\d{1,2}\.\d{4})")


def _d(x) -> date | None:
    if not x:
        return None
    if isinstance(x, date):
        return x
    for f in ("%Y-%m-%d", "%d.%m.%Y"):
        try:
            return datetime.strptime(str(x)[:10], f).date()
        except ValueError:
            pass
    return None


def _euro(x: float | None) -> str:
    if x is None:
        return "–"
    return f"{x:,.2f}\u00a0€".replace(",", "X").replace(".", ",").replace("X", ".")


def _de(d) -> str:
    d = _d(d)
    return d.strftime("%d.%m.%Y") if d else "–"


def _zahl(s) -> float | None:
    if s in (None, ""):
        return None
    if isinstance(s, (int, float)):
        return float(s)
    s = str(s).strip().replace("€", "").replace(" ", "")
    if re.fullmatch(r"-?\d{1,3}(\.\d{3})+(,\d+)?", s) or ("," in s and "." not in s):
        s = s.replace(".", "").replace(",", ".")
    try:
        return float(s)
    except ValueError:
        return None


def _monate(von: date, bis: date) -> int:
    return (bis.year - von.year) * 12 + bis.month - von.month + 1


def _sicher(name: str) -> str:
    return re.sub(r"[^\w äöüÄÖÜß.,&()-]", "", name).strip()[:120] or "Beleg"


def kostenart_aus_text(text: str) -> str:
    """Kostenart einer Bezeichnung (z. B. aus dem Mietvertrag) oder eines Belegs."""
    t = (text or "").lower()
    treffer = [(len(re.findall(rx, t)), k) for k, (_, _, rx) in KOSTENARTEN.items()]
    treffer.sort(reverse=True)
    return treffer[0][1] if treffer and treffer[0][0] else ""


# ---------------------------------------------------------------- PDF (lokal, PyMuPDF)
CSS = """
* {font-family: sans-serif; font-size: 10pt; color: #111;}
.absender {font-size: 7pt; color: #555; border-bottom: 0.5pt solid #999; padding-bottom: 1pt;}
.anschrift {margin-top: 4pt; line-height: 1.35;}
.datum {text-align: right; margin-top: 18pt;}
h1 {font-size: 12pt; font-weight: bold; margin-top: 16pt; margin-bottom: 8pt;}
p {margin-top: 0; margin-bottom: 7pt; line-height: 1.4;}
table {border-collapse: collapse; width: 100%; margin-top: 6pt; margin-bottom: 8pt;}
th {font-size: 8.5pt; text-align: left; border-bottom: 1pt solid #333; padding: 3pt 4pt;}
td {font-size: 9pt; border-bottom: 0.5pt solid #bbb; padding: 3pt 4pt;}
td.z, th.z {text-align: right;}
tr.summe td {font-weight: bold; border-top: 1pt solid #333; border-bottom: none;}
.klein {font-size: 8pt; color: #444;}
.ergebnis {font-size: 10.5pt; margin-top: 6pt;}
td.k {width: 40%;} td.g {width: 16%;} td.a {width: 16%;}
"""


def pdf_aus_html(html: str, ziel: Path, titel: str = "") -> Path:
    import fitz
    ziel.parent.mkdir(parents=True, exist_ok=True)
    story = fitz.Story(html=html, user_css=CSS)
    writer = fitz.DocumentWriter(str(ziel))
    seite = fitz.paper_rect("a4")
    inhalt = fitz.Rect(70, 50, seite.width - 57, seite.height - 60)
    mehr = 1
    while mehr:
        dev = writer.begin_page(seite)
        mehr, _ = story.place(inhalt)
        story.draw(dev)
        writer.end_page()
    writer.close()
    if titel:
        try:
            with fitz.open(str(ziel)) as doc:
                doc.set_metadata({"title": titel, "creator": "JARVIS · HESTIA"})
                doc.saveIncr()
        except Exception:
            pass
    return ziel


def _h(x) -> str:
    import html
    return html.escape(str(x or ""))


class Nebenkosten:
    def __init__(self, core):
        self.c = core
        self.lock = threading.RLock()
        self.letzter = 0.0
        EINGANG.mkdir(parents=True, exist_ok=True)
        ENTWURF.mkdir(parents=True, exist_ok=True)

    # ------------------------------------------------------------ Zustand
    def _z(self) -> dict:
        return read_private_json(DATEI, {"postfach": {"alias": "", "intervall_min": 15, "letzte_uid": 0, "letzter_lauf": ""},
                                         "jahre": {}, "vorschlaege": [], "anfragen": [], "protokoll": []})

    def _s(self, z: dict) -> None:
        z["protokoll"] = z.get("protokoll", [])[-200:]
        write_private_json(DATEI, z)

    def _log(self, z: dict, text: str) -> None:
        z.setdefault("protokoll", []).append({"zeit": datetime.now().isoformat(timespec="minutes"), "text": text[:200]})

    @property
    def im(self):
        return self.c.immobilien

    def _archiv(self) -> Path:
        a = find_archive(self.c.cfg)
        if not a:
            raise ToolError("DATENARCHIV nicht gefunden")
        return a

    def _objektordner(self, o: dict) -> Path | None:
        rel = (o.get("ordner") or "").strip().strip("/")
        if not rel:
            return None
        p = (self._archiv() / rel).resolve()
        return p if str(p).startswith(str(self._archiv().resolve())) else None

    @staticmethod
    def _schluessel(oid: str, jahr: int) -> str:
        return f"{oid}/{jahr}"

    # ------------------------------------------------------------ Jahr anlegen
    def jahr_anlegen(self, oid: str, jahr: int) -> dict:
        o = self.im._objekt_roh(oid)
        seit = _d((o.get("mieter") or {}).get("seit"))
        if not seit:
            raise ToolError("Für die Abrechnung fehlt der Mietbeginn (Immobilie bearbeiten → Mieter & Miete)")
        von, bis = max(date(jahr, 1, 1), seit), date(jahr, 12, 31)
        if von > bis:
            raise ToolError(f"Das Mietverhältnis beginnt erst nach {jahr} – keine Abrechnung nötig")
        with self.lock:
            z = self._z()
            k = self._schluessel(oid, jahr)
            if k in z["jahre"]:
                return {"ok": True, "vorhanden": True, "jahr": self.ansicht(oid, jahr)}
            arten = []
            for b in o.get("betriebskosten") or []:            # „Wasser und Abwasser“ → zwei Kostenarten
                for ka, (_, _, rx) in KOSTENARTEN.items():
                    if re.search(rx, b.lower()) and ka not in arten:
                        arten.append(ka)
                if re.search(r"\bwasser\b", b.lower()) and "wasser" not in arten:
                    arten.append("wasser")
            if not arten:
                arten = list(STANDARD)
            posten = [{"id": secrets.token_hex(3), "kostenart": ka, "bezeichnung": KOSTENARTEN[ka][0], "status": "fehlt",
                       "belege": [], "verteilung": "zeitanteil", "betrag_manuell": None} for ka in arten]
            z["jahre"][k] = {"objekt": oid, "jahr": jahr, "von": von.isoformat(), "bis": bis.isoformat(), "status": "sammeln",
                             "zielfrist": date(jahr + 1, ZIEL_MONAT, ZIEL_TAG).isoformat(),
                             "abrechnen_bis": date(jahr + 1, ABRECHNEN_MONAT, ABRECHNEN_TAG).isoformat(),
                             "gesetzlich_bis": date(jahr + 1, 12, 31).isoformat(), "posten": posten,
                             "vorauszahlungen_manuell": None, "angelegt": date.today().isoformat()}
            self._log(z, f"Abrechnung {jahr} angelegt ({o.get('name') or o.get('adresse')})")
            self._s(z)
        self._fristen(oid, jahr)
        return {"ok": True, "jahr": self.ansicht(oid, jahr), "text": f"✓ Abrechnung {jahr} angelegt – Belegliste steht"}

    def _fristen(self, oid: str, jahr: int) -> None:
        fr = getattr(self.c, "fristen", None)
        j = self._z()["jahre"].get(self._schluessel(oid, jahr))
        if not fr or not j:
            return
        marke = f"Nebenkosten: {oid}/{jahr}"
        for f in fr.zustand()["liste"]:
            if not f.get("erledigt") and marke in (f.get("notiz") or ""):
                fr.erledigt(f["id"])
        name = self.im._objekt_roh(oid).get("name") or "Immobilie"
        heute = date.today()
        if j["status"] in ("sammeln", "anfragen") and _d(j["zielfrist"]) >= heute:
            fr.eintragen(f"Nebenkosten {jahr} ({name}): alle Belege da?", j["zielfrist"], "Frist", marke, quelle="hestia")
        if j["status"] not in ("versendet", "abgeschlossen"):
            if _d(j["abrechnen_bis"]) >= heute:
                fr.eintragen(f"Nebenkostenabrechnung {jahr} ({name}) an den Mieter", j["abrechnen_bis"], "Frist", marke,
                             quelle="hestia")
            fr.eintragen(f"Gesetzliche Frist: Abrechnung {jahr} ({name}) muss beim Mieter sein", j["gesetzlich_bis"],
                         "Frist", marke, quelle="hestia")

    # ------------------------------------------------------------ Berechnung
    def _rechnen(self, j: dict, o: dict) -> dict:
        von, bis = _d(j["von"]), _d(j["bis"])
        tage_miete = (bis - von).days + 1
        zeilen, summe = [], 0.0
        for p in j["posten"]:
            if p["status"] == "entfaellt":
                continue
            gesamt = sum(b.get("betrag") or 0 for b in p["belege"]) if p["belege"] else None
            bvon = min((_d(b.get("von")) for b in p["belege"] if _d(b.get("von"))), default=date(von.year, 1, 1))
            bbis = max((_d(b.get("bis")) for b in p["belege"] if _d(b.get("bis"))), default=date(von.year, 12, 31))
            tage_beleg = max(1, (bbis - bvon).days + 1)
            ueber = max(0, (min(bis, bbis) - max(von, bvon)).days + 1)
            if p.get("betrag_manuell") is not None:
                anteil, schluessel = p["betrag_manuell"], "Verbrauch laut Zähler (Mieteranteil)"
            elif gesamt is None:
                anteil, schluessel = None, ""
            elif p["verteilung"] == "voll":
                anteil, schluessel = gesamt, "Wohnfläche 100 %"
            else:
                anteil = gesamt * ueber / tage_beleg
                schluessel = "Wohnfläche 100 %" + ("" if ueber == tage_beleg else f", zeitanteilig {ueber}/{tage_beleg} Tage")
            if anteil is not None:
                anteil = round(anteil, 2)
                summe += anteil
            zeilen.append({"id": p["id"], "bezeichnung": p["bezeichnung"], "grundlage": KOSTENARTEN.get(p["kostenart"], ("", "", ""))[1],
                           "gesamt": round(gesamt, 2) if gesamt is not None else None, "zeitraum": f"{_de(bvon)} – {_de(bbis)}",
                           "schluessel": schluessel, "anteil": anteil, "status": p["status"]})
        mon = _monate(von, bis)
        nk = (o.get("miete") or {}).get("nk") or 0
        vz = j["vorauszahlungen_manuell"] if j.get("vorauszahlungen_manuell") is not None else round(nk * mon, 2)
        summe = round(summe, 2)
        ergebnis = round(summe - vz, 2)
        neu = math.ceil(summe / mon / 5) * 5 if mon and summe else None
        return {"zeilen": zeilen, "summe": summe, "vorauszahlungen": vz, "monate": mon, "tage": tage_miete,
                "ergebnis": ergebnis, "art": "Nachzahlung" if ergebnis > 0 else "Guthaben" if ergebnis < 0 else "ausgeglichen",
                "vorschlag_vorauszahlung": neu if neu and abs(neu - nk) >= 5 else None, "vorauszahlung_bisher": nk}

    def ansicht(self, oid: str, jahr: int) -> dict:
        z = self._z()
        j = z["jahre"].get(self._schluessel(oid, jahr))
        if not j:
            return {}
        o = self.im._objekt_roh(oid)
        offen = [p for p in j["posten"] if p["status"] in ("fehlt", "angefragt")]
        anfragen = [a for a in z["anfragen"] if a["objekt"] == oid and a["jahr"] == jahr]
        return {**j, "rechnung": self._rechnen(j, o), "offen": len(offen), "vollstaendig": not offen,
                "anfragen": anfragen, "versorger": o.get("versorger") or []}

    def uebersicht(self, oid: str = "") -> dict:
        z = self._z()
        jahre = sorted({(j["objekt"], j["jahr"]) for j in z["jahre"].values() if not oid or j["objekt"] == oid},
                       key=lambda x: -x[1])
        return {"jahre": [self.ansicht(o, y) for o, y in jahre], "vorschlaege": [v for v in z["vorschlaege"] if v["status"] == "offen"],
                "postfach": {k: z["postfach"].get(k) for k in ("alias", "intervall_min", "letzter_lauf")},
                "bank": bool(get_secret("immo_iban")), "absender_anschrift": z.get("absender_anschrift", ""),
                "protokoll": z["protokoll"][-12:]}

    # ------------------------------------------------------------ Posten bearbeiten
    def posten_setzen(self, oid: str, jahr: int, pid: str, daten: dict) -> dict:
        with self.lock:
            z = self._z()
            j = z["jahre"].get(self._schluessel(oid, jahr))
            if not j:
                raise ToolError("Abrechnungsjahr nicht angelegt")
            if pid == "neu":
                ka = daten.get("kostenart") if daten.get("kostenart") in KOSTENARTEN else "sonstige"
                j["posten"].append({"id": secrets.token_hex(3), "kostenart": ka,
                                    "bezeichnung": str(daten.get("bezeichnung") or KOSTENARTEN[ka][0])[:80], "status": "fehlt",
                                    "belege": [], "verteilung": "zeitanteil", "betrag_manuell": None})
            else:
                p = next((x for x in j["posten"] if x["id"] == pid), None)
                if not p:
                    raise ToolError("Posten nicht gefunden")
                if daten.get("entfernen"):
                    j["posten"].remove(p)
                else:
                    if "status" in daten and daten["status"] in ("fehlt", "entfaellt", "vorhanden", "angefragt"):
                        p["status"] = daten["status"]
                    if daten.get("verteilung") in ("zeitanteil", "voll"):
                        p["verteilung"] = daten["verteilung"]
                    if "betrag_manuell" in daten:
                        p["betrag_manuell"] = _zahl(daten["betrag_manuell"])
                    if daten.get("bezeichnung"):
                        p["bezeichnung"] = str(daten["bezeichnung"])[:80]
                    if "beleg_betrag" in daten and p["belege"]:          # erkannten Betrag korrigieren
                        i = int(daten.get("beleg_index") or 0)
                        p["belege"][i]["betrag"] = _zahl(daten["beleg_betrag"])
                        for f in ("von", "bis"):
                            if _d(daten.get(f"beleg_{f}")):
                                p["belege"][i][f] = _d(daten[f"beleg_{f}"]).isoformat()
            if "vorauszahlungen_manuell" in daten:
                j["vorauszahlungen_manuell"] = _zahl(daten["vorauszahlungen_manuell"])
            self._status_pruefen(j)
            self._s(z)
        self._nach_aenderung(oid, jahr)
        return {"ok": True, "jahr": self.ansicht(oid, jahr)}

    def _status_pruefen(self, j: dict) -> None:
        if j["status"] in ("gebilligt", "versendet", "abgeschlossen"):
            return
        offen = [p for p in j["posten"] if p["status"] in ("fehlt", "angefragt")]
        if offen:
            j["status"] = "anfragen" if any(p["status"] == "angefragt" for p in offen) else "sammeln"
        elif j["status"] in ("sammeln", "anfragen"):
            j["status"] = "vollstaendig"

    def _nach_aenderung(self, oid: str, jahr: int) -> None:
        j = self._z()["jahre"].get(self._schluessel(oid, jahr))
        if j and j["status"] == "vollstaendig":
            try:
                self.entwurf(oid, jahr)
            except Exception as e:
                self.c.audit.log("fehler", bereich="hestia", text=f"Entwurf: {e}"[:200])

    # ------------------------------------------------------------ Beleg erkennen (LOKAL)
    def beleg_analysieren(self, datei: Path, quelle: dict) -> dict:
        from atlas.archiv.extract import extract
        try:
            text = "\n".join(t for _, t in extract(datei, ocr=True))
        except Exception as e:
            text = ""
            quelle = {**quelle, "hinweis": f"Text nicht lesbar: {e}"[:120]}
        low = text.lower()
        objekte = self.im._laden()["objekte"]
        obj, gruende = None, []
        for o in objekte:                                   # 1. Objekt über Straße/Kundennummer
            strasse = (o.get("adresse") or "").split(",")[0].lower()
            nummern = [v.get("kundennummer") for v in o.get("versorger") or [] if v.get("kundennummer")]
            if (strasse and strasse[:12] in low) or any(n and n.lower() in low for n in nummern):
                obj = o
                gruende.append("Objektadresse/Kundennummer im Beleg")
                break
        if not obj and len(objekte) == 1:
            obj = objekte[0]
        ka = ""
        for v in (obj or {}).get("versorger") or []:        # 2. bekannter Versorger
            if v.get("kundennummer") and v["kundennummer"].lower() in low or \
               (v.get("name") and v["name"].split()[0].lower() in low and len(v["name"].split()[0]) > 3):
                ka = v["kostenart"]
                gruende.append(f"bekannter Absender ({v.get('name') or ka})")
                break
        ka = ka or kostenart_aus_text(text + " " + (quelle.get("betreff") or ""))
        m = ZEITRAUM.search(text)
        von, bis = (_d(m.group(1)), _d(m.group(2))) if m else (None, None)
        jahre = [int(x) for x in re.findall(r"\b(20[2-4]\d)\b", text)]
        jahr = (bis or von).year if (bis or von) else (max(set(jahre), key=jahre.count) if jahre else date.today().year - 1)
        betraege = [_zahl(x) for x in BETRAG.findall(text)]
        betrag = max((b for b in betraege if b), default=None)
        absender = ""
        from atlas import hilfen
        j = hilfen.lokal_json(self.c.providers.get("lokal"),
                              "Du liest eine deutsche Rechnung oder einen Bescheid und antwortest nur mit JSON. Erfinde nichts.",
                              'Antworte nur mit JSON: {"absender": "Firma/Behörde kurz", "gesamtbetrag": Zahl in € für den '
                              'ganzen Abrechnungszeitraum, "zeitraum_von": "JJJJ-MM-TT", "zeitraum_bis": "JJJJ-MM-TT", '
                              '"art": "Grundsteuer|Wasser|Abwasser|Müll|Versicherung|Wartung Heizung|Sonstiges"}\n\nText:\n'
                              + text[:3500], 250) or {}
        if j:
            absender = str(j.get("absender") or "")[:60]
            if absender and absender.split()[0].lower()[:5] not in low:
                absender = ""                                  # Gegenprobe: muss im Text stehen
            b2 = _zahl(j.get("gesamtbetrag"))
            if b2 and (betrag is None or f"{b2:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".") in text):
                betrag = b2
            if not von and _d(j.get("zeitraum_von")) and _d(j.get("zeitraum_bis")):
                von, bis = _d(j["zeitraum_von"]), _d(j["zeitraum_bis"])
                jahr = bis.year
            if not ka:
                ka = kostenart_aus_text(str(j.get("art") or ""))
        absender = absender or re.sub(r"[<\"].*", "", quelle.get("von") or "").strip()[:60]
        ordner_rel, ordner_neu = "", False
        if obj:
            basis = self._objektordner(obj)
            if basis:
                ziel = basis / UNTERORDNER / str(jahr)
                ordner_rel = str(ziel.relative_to(self._archiv()))
                ordner_neu = not ziel.exists()
        relevant = bool(ka) or bool(obj and gruende)
        ka = ka or "sonstige"
        datum = (quelle.get("datum") or date.today().isoformat())[:10]
        name = _sicher(f"{datum} {absender or 'Beleg'} {KOSTENARTEN.get(ka, ('Beleg',))[0]} {jahr}") + (datei.suffix.lower() or ".pdf")
        return {"objekt": (obj or {}).get("id", ""), "objekt_name": (obj or {}).get("name", ""), "kostenart": ka or "sonstige",
                "jahr": jahr, "betrag": betrag, "von": von.isoformat() if von else "", "bis": bis.isoformat() if bis else "",
                "absender": absender, "ordner": ordner_rel, "ordner_neu": ordner_neu, "dateiname": name,
                "gruende": gruende, "relevant": relevant}

    def vorschlag_aus_datei(self, daten: bytes, name: str, quelle: dict) -> dict:
        h = hashlib.sha1(daten).hexdigest()[:16]
        with self.lock:
            z = self._z()
            if any(v.get("hash") == h for v in z["vorschlaege"]):
                return {"ok": True, "doppelt": True}
        endung = Path(name).suffix.lower() or ".pdf"
        if endung not in (".pdf", ".jpg", ".jpeg", ".png", ".heic", ".tif", ".tiff"):
            return {"ok": False, "ignoriert": True}
        pfad = EINGANG / f"{h}{endung}"
        pfad.write_bytes(daten)
        a = self.beleg_analysieren(pfad, quelle)
        v = {"id": secrets.token_hex(4), "hash": h, "datei": str(pfad), "original": name[:120], "status": "offen",
             "quelle": {k: quelle.get(k) for k in ("art", "von", "betreff", "datum")}, "eingang": datetime.now().isoformat(timespec="minutes"),
             **a}
        with self.lock:
            z = self._z()
            z["vorschlaege"].append(v)
            self._log(z, f"Beleg erkannt: {KOSTENARTEN.get(v['kostenart'], ('?',))[0]} {v['jahr']} – wartet auf Bestätigung")
            self._s(z)
        self.c.broadcast({"type": "hestia", "ereignis": "vorschlag"})
        return {"ok": True, "vorschlag": v}

    def vorschlag_bestaetigen(self, vid: str, aenderung: dict | None = None) -> dict:
        """Ablage ins Archiv – nur auf ausdrückliche Bestätigung (Klick/„Ja“)."""
        aenderung = aenderung or {}
        with self.lock:
            z = self._z()
            v = next((x for x in z["vorschlaege"] if x["id"] == vid and x["status"] == "offen"), None)
            if not v:
                raise ToolError("Vorschlag nicht gefunden oder schon erledigt")
            alt_art = v.get("kostenart")
            for k in ("objekt", "kostenart", "ordner", "dateiname", "von", "bis"):
                if aenderung.get(k):
                    v[k] = str(aenderung[k])
            if v["kostenart"] != alt_art and aenderung.get("dateiname") in (None, "", v.get("dateiname")):
                alt_name = KOSTENARTEN.get(alt_art, ("Beleg",))[0]
                v["dateiname"] = v["dateiname"].replace(alt_name, KOSTENARTEN.get(v["kostenart"], ("Beleg",))[0])
            if aenderung.get("jahr"):
                v["jahr"] = int(aenderung["jahr"])
            if "betrag" in aenderung:
                v["betrag"] = _zahl(aenderung["betrag"])
            if not v.get("objekt") or not v.get("ordner"):
                raise ToolError("Bitte Immobilie und Ordner wählen (Ordner der Immobilie unter „Bearbeiten“ eintragen)")
            archiv = self._archiv().resolve()
            ziel_dir = (archiv / v["ordner"].strip("/")).resolve()
            if not str(ziel_dir).startswith(str(archiv)):
                raise ToolError("Ordner liegt außerhalb des DATENARCHIVs")
            ziel_dir.mkdir(parents=True, exist_ok=True)
            quelle = Path(v["datei"])
            if v.get("quelle", {}).get("art") == "ordner" and quelle.parent.resolve() == ziel_dir:
                ziel = quelle                                  # liegt schon richtig – nur zuordnen
            else:
                ziel = ziel_dir / _sicher(v["dateiname"])
                n = 2
                while ziel.exists():
                    ziel = ziel_dir / f"{Path(_sicher(v['dateiname'])).stem} ({n}){ziel.suffix}"
                    n += 1
                if v.get("quelle", {}).get("art") == "ordner":
                    shutil.move(str(quelle), str(ziel))
                else:
                    shutil.copy2(str(quelle), str(ziel))
                    quelle.unlink(missing_ok=True)
            v.update({"status": "abgelegt", "abgelegt": str(ziel.relative_to(archiv)), "abgelegt_am": date.today().isoformat()})
            self._log(z, f"Abgelegt: {ziel.name}")
            # in die Belegliste übernehmen (Jahr bei Bedarf anlegen)
            k = self._schluessel(v["objekt"], v["jahr"])
            self._s(z)
        if k not in self._z()["jahre"]:
            try:
                self.jahr_anlegen(v["objekt"], v["jahr"])
            except ToolError:
                pass
        with self.lock:
            z = self._z()
            j = z["jahre"].get(k)
            if j:
                p = next((x for x in j["posten"] if x["kostenart"] == v["kostenart"]), None)
                if not p:
                    p = {"id": secrets.token_hex(3), "kostenart": v["kostenart"],
                         "bezeichnung": KOSTENARTEN.get(v["kostenart"], ("Sonstige",))[0], "status": "fehlt", "belege": [],
                         "verteilung": "zeitanteil", "betrag_manuell": None}
                    j["posten"].append(p)
                p["belege"].append({"datei": v["abgelegt"], "betrag": v.get("betrag"), "von": v.get("von"), "bis": v.get("bis"),
                                    "absender": v.get("absender"), "eingang": v["abgelegt_am"]})
                p["status"] = "vorhanden"
                for a in z["anfragen"]:
                    if a.get("posten") == p["id"] and a["status"] in ("entwurf", "gebilligt", "versendet"):
                        a["status"] = "erledigt"
                self._status_pruefen(j)
            self._s(z)
        self.c.audit.log("archiv_ablage", datei=v["abgelegt"], quelle="hestia", bestaetigt=True)
        self._nach_aenderung(v["objekt"], v["jahr"])
        return {"ok": True, "abgelegt": v["abgelegt"], "text": f"✓ Abgelegt: {Path(v['abgelegt']).name}"}

    def vorschlag_verwerfen(self, vid: str) -> dict:
        with self.lock:
            z = self._z()
            v = next((x for x in z["vorschlaege"] if x["id"] == vid), None)
            if not v:
                raise ToolError("Vorschlag nicht gefunden")
            v["status"] = "verworfen"
            if v.get("quelle", {}).get("art") != "ordner":
                Path(v["datei"]).unlink(missing_ok=True)
            self._s(z)
        return {"ok": True}

    def vorschlag_datei(self, vid: str) -> tuple[bytes, str] | None:
        v = next((x for x in self._z()["vorschlaege"] if x["id"] == vid), None)
        if not v or not Path(v["datei"]).exists():
            return None
        p = Path(v["datei"])
        return p.read_bytes(), "application/pdf" if p.suffix.lower() == ".pdf" else "image/jpeg"

    # ------------------------------------------------------------ Postfach (iCloud-Alias) und Objektordner
    def postfach_setzen(self, alias: str = "", intervall_min: int | None = None) -> dict:
        a = (alias or "").strip().lower()
        if a and not re.fullmatch(r"[^@\s]+@(icloud|me|mac)\.com", a):
            raise ToolError("Bitte eine iCloud-Adresse (…@icloud.com) – der Alias muss zu deinem iCloud-Konto gehören")
        with self.lock:
            z = self._z()
            z["postfach"]["alias"] = a
            if intervall_min:
                z["postfach"]["intervall_min"] = max(5, min(240, int(intervall_min)))
            self._s(z)
        return {"ok": True, "text": "✓ Gespeichert" + (" – JARVIS prüft das Postfach ab jetzt" if a else "")}

    def alias(self) -> str:
        return self._z()["postfach"].get("alias", "")

    def postfach_pruefen(self) -> dict:
        from atlas.tools.mail import Mail
        alias = self.alias()
        if not alias:
            return {"ok": False, "text": "Kein Immobilien-Postfach eingetragen"}
        mail = Mail(self.c.secrets, self.c.cfg)
        m = mail._imap()
        neu, gesehen = 0, 0
        try:
            m.select("INBOX", readonly=True)
            z = self._z()
            letzte = int(z["postfach"].get("letzte_uid") or 0)
            seit = (date.today() - timedelta(days=60)).strftime("%d-%b-%Y")
            typ, data = m.uid("SEARCH", None, "SINCE", seit, "TO", f'"{alias}"')
            uids = [int(u) for u in (data[0].split() if data and data[0] else [])]
            for uid in sorted(u for u in uids if u > letzte)[:40]:
                gesehen += 1
                msg = mail._fetch(m, str(uid))
                von = str(msg["From"] or "")
                betreff = str(msg["Subject"] or "")
                try:
                    datum = email.utils.parsedate_to_datetime(msg["Date"]).date().isoformat()
                except Exception:
                    datum = date.today().isoformat()
                anh = [p for p in msg.iter_attachments() if p.get_filename()]
                for p in anh:
                    erg = self.vorschlag_aus_datei(p.get_payload(decode=True) or b"", p.get_filename(),
                                                   {"art": "mail", "von": von, "betreff": betreff, "datum": datum, "uid": uid})
                    neu += 1 if erg.get("vorschlag") else 0
                if not anh:
                    with self.lock:
                        z2 = self._z()
                        self._log(z2, f"Mail ohne Anhang an das Immobilien-Postfach: „{betreff[:60]}“ – bitte selbst ansehen")
                        self._s(z2)
                with self.lock:
                    z2 = self._z()
                    z2["postfach"]["letzte_uid"] = max(int(z2["postfach"].get("letzte_uid") or 0), uid)
                    self._s(z2)
        finally:
            try:
                m.logout()
            except Exception:
                pass
        with self.lock:
            z = self._z()
            z["postfach"]["letzter_lauf"] = datetime.now().isoformat(timespec="minutes")
            self._s(z)
        return {"ok": True, "mails": gesehen, "neue_vorschlaege": neu,
                "text": f"✓ Postfach geprüft: {gesehen} neue Mail(s), {neu} Beleg(e) zur Bestätigung"}

    def ordner_pruefen(self) -> dict:
        """Belege, die du selbst in einen Nebenkosten-Jahresordner gelegt hast, der Belegliste zuordnen."""
        z = self._z()
        bekannt = {b["datei"] for j in z["jahre"].values() for p in j["posten"] for b in p["belege"]}
        bekannt |= {v.get("datei") for v in z["vorschlaege"]}
        neu = 0
        archiv = self._archiv()
        for o in self.im._laden()["objekte"]:
            basis = self._objektordner(o)
            if not basis or not (basis / UNTERORDNER).is_dir():
                continue
            for f in (basis / UNTERORDNER).rglob("*"):
                if f.suffix.lower() != ".pdf" or not f.is_file() or "Abrechnung" in f.name or "Anfrage" in f.name:
                    continue
                rel = str(f.relative_to(archiv))
                if rel in bekannt or str(f) in bekannt:
                    continue
                a = self.beleg_analysieren(f, {"art": "ordner", "datum": date.fromtimestamp(f.stat().st_mtime).isoformat()})
                a.update({"ordner": str(f.parent.relative_to(archiv)), "dateiname": f.name, "ordner_neu": False})
                with self.lock:
                    z = self._z()
                    z["vorschlaege"].append({"id": secrets.token_hex(4), "hash": "", "datei": str(f), "original": f.name,
                                             "status": "offen", "quelle": {"art": "ordner", "datum": a.get("jahr")},
                                             "eingang": datetime.now().isoformat(timespec="minutes"), **a})
                    self._s(z)
                neu += 1
        return {"ok": True, "neu": neu, "text": f"✓ Ordner geprüft: {neu} neue Datei(en) zur Zuordnung"}

    # ------------------------------------------------------------ Anfragen an Versorger
    def _versorger(self, o: dict, ka: str) -> dict:
        return next((v for v in o.get("versorger") or [] if v.get("kostenart") == ka), {})

    def versorger_setzen(self, oid: str, liste: list) -> dict:
        o = self.im._objekt_roh(oid)
        return self.im.speichern({**o, "versorger": liste}, oid)

    def _absender(self, o: dict) -> dict:
        eig = o.get("eigentuemer") or self.c.name
        bank = {"iban": get_secret("immo_iban") or "", "inhaber": get_secret("immo_kontoinhaber") or eig}
        return {"name": eig, "anschrift": self._z().get("absender_anschrift", ""),
                "mail": self.alias(), "bank": bank}

    def anfragen_erstellen(self, oid: str, jahr: int, nur_posten: str = "", erinnerung: bool = False) -> dict:
        o = self.im._objekt_roh(oid)
        erstellt = []
        with self.lock:
            z = self._z()
            j = z["jahre"].get(self._schluessel(oid, jahr))
            if not j:
                raise ToolError("Abrechnungsjahr nicht angelegt")
            for p in j["posten"]:
                if nur_posten and p["id"] != nur_posten:
                    continue
                if p["status"] not in ("fehlt", "angefragt"):
                    continue
                offen = [a for a in z["anfragen"] if a.get("posten") == p["id"] and a["status"] in ("entwurf", "gebilligt")]
                if offen:
                    continue
                v = self._versorger(o, p["kostenart"])
                art = "erinnerung" if erinnerung or p["status"] == "angefragt" else "anfrage"
                a = {"id": secrets.token_hex(4), "objekt": oid, "jahr": jahr, "posten": p["id"], "art": art,
                     "kostenart": p["kostenart"], "bezeichnung": p["bezeichnung"], "empfaenger": v.get("name", ""),
                     "email": v.get("email", ""), "anschrift": v.get("anschrift", ""), "kundennummer": v.get("kundennummer", ""),
                     "weg": "mail" if v.get("email") else "brief", "status": "entwurf", "erstellt": date.today().isoformat()}
                a["betreff"], a["text"] = self._anfrage_text(o, j, p, a)
                z["anfragen"].append(a)
                erstellt.append(a)
            if erstellt:
                self._log(z, f"{len(erstellt)} Anfrage(n) {jahr} zur Billigung vorbereitet")
            self._s(z)
        return {"ok": True, "anfragen": erstellt, "text": f"✓ {len(erstellt)} Anfrage(n) zur Billigung vorbereitet" if erstellt
                else "Keine offenen Belege ohne Anfrage"}

    def _anfrage_text(self, o: dict, j: dict, p: dict, a: dict) -> tuple[str, str]:
        ab = self._absender(o)
        kn = f" (Kundennummer {a['kundennummer']})" if a.get("kundennummer") else ""
        zeitraum = f"{j['jahr']}"
        betreff = (f"{'Erinnerung: ' if a['art'] == 'erinnerung' else ''}Bitte um Jahresabrechnung {zeitraum} – "
                   f"{o.get('adresse', '')}{kn}")
        erinnerung = ("wir hatten Sie bereits um die unten genannten Unterlagen gebeten und haben sie bisher nicht erhalten. "
                      if a["art"] == "erinnerung" else "")
        text = (f"Sehr geehrte Damen und Herren,\n\n{erinnerung}für die Betriebskostenabrechnung unseres vermieteten Objekts "
                f"{o.get('adresse', '')}{kn} benötigen wir die Jahresabrechnung bzw. den Bescheid für {p['bezeichnung']} "
                f"für das Jahr {j['jahr']}"
                + (" einschließlich der Zählerstände zu Beginn und Ende des Zeitraums" if p["kostenart"] in ("wasser", "abwasser") else "")
                + f".\n\nBitte senden Sie die Unterlagen bis zum {_de(date.today() + timedelta(days=21))} "
                + (f"an {ab['mail']}" if ab["mail"] else "an die obige Anschrift") + ".\n\nVielen Dank.\n\nMit freundlichen Grüßen\n"
                + f"{ab['name']}")
        return betreff, text

    def anfrage_aendern(self, aid: str, daten: dict) -> dict:
        with self.lock:
            z = self._z()
            a = next((x for x in z["anfragen"] if x["id"] == aid), None)
            if not a or a["status"] not in ("entwurf",):
                raise ToolError("Anfrage nicht (mehr) änderbar")
            for k in ("betreff", "text", "email", "anschrift", "empfaenger"):
                if k in daten:
                    a[k] = str(daten[k])[:4000]
            if daten.get("weg") in ("mail", "brief"):
                a["weg"] = daten["weg"]
            self._s(z)
        return {"ok": True, "anfrage": a}

    def anfrage_billigen(self, aid: str) -> dict:
        """Billigung = Versand (Mail) bzw. Brief-PDF zum Ausdrucken. Nur nach ausdrücklichem Klick/„Ja“."""
        with self.lock:
            z = self._z()
            a = next((x for x in z["anfragen"] if x["id"] == aid), None)
            if not a or a["status"] != "entwurf":
                raise ToolError("Anfrage nicht gefunden oder schon erledigt")
        o = self.im._objekt_roh(a["objekt"])
        erg = {}
        if a["weg"] == "mail":
            if not a.get("email"):
                raise ToolError("Keine Mailadresse des Versorgers – Adresse eintragen oder als Brief drucken")
            self._mail_senden(a["email"], a["betreff"], a["text"])
            status, erg["text"] = "versendet", f"✓ Anfrage an {a['email']} gesendet"
        else:
            pdf = self._brief_pdf(o, a)
            subprocess.run(["open", str(pdf)], capture_output=True)
            status, erg["text"] = "gebilligt", "✓ Brief geöffnet – bitte drucken und abschicken, dann „VERSCHICKT“ klicken"
            erg["pdf"] = str(pdf)
        with self.lock:
            z = self._z()
            a = next(x for x in z["anfragen"] if x["id"] == aid)
            a["status"] = status
            a["gebilligt"] = date.today().isoformat()
            if status == "versendet":
                a["versendet"] = date.today().isoformat()
                self._posten_angefragt(z, a)
            self._log(z, f"Anfrage {a['bezeichnung']} {a['jahr']}: {status}")
            self._s(z)
        self.c.audit.log("hestia_anfrage", weg=a["weg"], status=status, bestaetigt=True)
        return {"ok": True, **erg}

    def brief_verschickt(self, aid: str) -> dict:
        with self.lock:
            z = self._z()
            a = next((x for x in z["anfragen"] if x["id"] == aid), None)
            if not a or a["status"] != "gebilligt":
                raise ToolError("Anfrage nicht gefunden")
            a["status"], a["versendet"] = "versendet", date.today().isoformat()
            self._posten_angefragt(z, a)
            self._s(z)
        return {"ok": True, "text": "✓ Vermerkt – Erinnerung in 3 Wochen, falls nichts kommt"}

    def anfrage_verwerfen(self, aid: str) -> dict:
        with self.lock:
            z = self._z()
            z["anfragen"] = [x for x in z["anfragen"] if not (x["id"] == aid and x["status"] == "entwurf")]
            self._s(z)
        return {"ok": True}

    def _posten_angefragt(self, z: dict, a: dict) -> None:
        j = z["jahre"].get(self._schluessel(a["objekt"], a["jahr"]))
        p = next((x for x in (j or {}).get("posten", []) if x["id"] == a["posten"]), None)
        if p and p["status"] == "fehlt":
            p["status"] = "angefragt"
        if j:
            self._status_pruefen(j)

    def _mail_senden(self, an: str, betreff: str, text: str, anhaenge: list[Path] | None = None) -> None:
        from atlas.tools.mail import Mail, SMTP_HOST
        mail = Mail(self.c.secrets, self.c.cfg)
        msg = EmailMessage()
        alias = self.alias()
        msg["From"] = email.utils.formataddr((self._absender({}).get("name") or "", alias or mail.addr))
        if alias:
            msg["Reply-To"] = alias
        msg["To"], msg["Subject"] = an, betreff
        msg["Date"] = email.utils.formatdate(localtime=True)
        msg["Message-ID"] = email.utils.make_msgid(domain=(alias or mail.addr).split("@")[-1])
        msg.set_content(text)
        for p in anhaenge or []:
            msg.add_attachment(p.read_bytes(), maintype="application", subtype="pdf", filename=p.name)
        try:
            mail._imap().logout()                      # Anmeldename ermitteln
            with smtplib.SMTP(SMTP_HOST, 587, timeout=30) as s:
                s.starttls()
                s.login(getattr(mail, "login_name", None) or mail.addr, mail.pw)
                s.send_message(msg)
        except (smtplib.SMTPException, OSError) as e:
            raise ToolError(f"Senden fehlgeschlagen: {e}")
        try:
            from atlas.tools.mail import SENT
            m = mail._imap()
            m.append(SENT, "(\\Seen)", imaplib.Time2Internaldate(time.time()), msg.as_bytes())
            m.logout()
        except Exception:
            pass

    def _briefkopf(self, ab: dict, an_name: str, an_anschrift: str) -> str:
        zeilen = [x.strip() for x in (an_anschrift or "").replace(";", "\n").splitlines() if x.strip()]
        absz = " · ".join(x for x in [ab["name"], *(ab["anschrift"] or "").replace(";", "\n").splitlines()] if x.strip())
        return (f"<p class='absender'>{_h(absz)}</p><div class='anschrift'>{_h(an_name)}<br>{'<br>'.join(_h(z) for z in zeilen)}</div>"
                f"<p class='datum'>{date.today().strftime('%d.%m.%Y')}</p>")

    def _brief_pdf(self, o: dict, a: dict) -> Path:
        ab = self._absender(o)
        html = (self._briefkopf(ab, a.get("empfaenger") or "", a.get("anschrift") or "") + f"<h1>{_h(a['betreff'])}</h1>"
                + "".join(f"<p>{_h(x).replace(chr(10), '<br>')}</p>" for x in a["text"].split("\n\n")))
        return pdf_aus_html(html, ENTWURF / f"Anfrage {a['jahr']} {_sicher(a['bezeichnung'])} {a['id']}.pdf", a["betreff"])

    # ------------------------------------------------------------ Abrechnung
    def entwurf(self, oid: str, jahr: int) -> dict:
        o = self.im._objekt_roh(oid)
        with self.lock:
            z = self._z()
            j = z["jahre"].get(self._schluessel(oid, jahr))
            if not j:
                raise ToolError("Abrechnungsjahr nicht angelegt")
        r = self._rechnen(j, o)
        fehlt = [zl["bezeichnung"] for zl in r["zeilen"] if zl["anteil"] is None]
        if fehlt:
            raise ToolError("Es fehlen noch Beträge: " + ", ".join(fehlt))
        pdf = self._abrechnung_pdf(o, j, r, ENTWURF / f"Entwurf Betriebskostenabrechnung {jahr} {oid}.pdf", entwurf=True)
        with self.lock:
            z = self._z()
            j = z["jahre"][self._schluessel(oid, jahr)]
            if j["status"] in ("sammeln", "anfragen", "vollstaendig", "entwurf"):
                j["status"] = "entwurf"
            j["entwurf"] = {"datei": str(pdf), "erstellt": datetime.now().isoformat(timespec="minutes"), "summe": r["summe"],
                            "ergebnis": r["ergebnis"]}
            self._log(z, f"Abrechnungsentwurf {jahr} erstellt: {r['art']} {_euro(abs(r['ergebnis']))}")
            self._s(z)
        self.c.broadcast({"type": "hestia", "ereignis": "entwurf"})
        return {"ok": True, "ergebnis": r["ergebnis"], "art": r["art"], "text": "✓ Entwurf erstellt – bitte prüfen und billigen"}

    def _abrechnung_pdf(self, o: dict, j: dict, r: dict, ziel: Path, entwurf: bool) -> Path:
        ab, m = self._absender(o), o.get("mieter") or {}
        zeilen = "".join(f"<tr><td class='k'>{_h(x['bezeichnung'])}<br><span class='klein'>{_h(x['grundlage'])} · Beleg {_h(x['zeitraum'])}</span></td>"
                         f"<td class='z g'>{_euro(x['gesamt'])}</td><td>{_h(x['schluessel'])}</td><td class='z a'>{_euro(x['anteil'])}</td></tr>"
                         for x in r["zeilen"])
        erg = abs(r["ergebnis"])
        if r["ergebnis"] > 0:
            satz = (f"Daraus ergibt sich eine <b>Nachzahlung von {_euro(erg)}</b>. Bitte überweisen Sie den Betrag innerhalb von "
                    f"30 Tagen nach Zugang dieser Abrechnung"
                    + (f" auf das Konto {_h(ab['bank']['inhaber'])}, IBAN {_h(ab['bank']['iban'])}" if ab["bank"]["iban"] else "") + ".")
        elif r["ergebnis"] < 0:
            satz = f"Daraus ergibt sich ein <b>Guthaben von {_euro(erg)}</b> zu Ihren Gunsten. Wir überweisen es innerhalb von 30 Tagen auf Ihr Konto."
        else:
            satz = "Die Vorauszahlungen decken die Kosten genau; es ergibt sich weder Nachzahlung noch Guthaben."
        anpassung = ""
        if r.get("vorschlag_vorauszahlung"):
            anpassung = (f"<p>Auf Grundlage dieser Abrechnung passen wir die monatliche Vorauszahlung gemäß § 560 Abs. 4 BGB ab der "
                         f"übernächsten Mietzahlung von {_euro(r['vorauszahlung_bisher'])} auf <b>{_euro(r['vorschlag_vorauszahlung'])}</b> an.</p>")
        html = (self._briefkopf(ab, m.get("name") or "Mieter", o.get("adresse", "").replace(", ", "\n"))
                + (f"<p class='klein'><b>ENTWURF – nicht versenden</b></p>" if entwurf else "")
                + f"<h1>Betriebskostenabrechnung für den Zeitraum {_de(j['von'])} bis {_de(j['bis'])}</h1>"
                f"<p>Mietobjekt: {_h(o.get('adresse'))}{(', ' + _h(o.get('art'))) if o.get('art') else ''}"
                f"{(', ' + str(o['wohnflaeche']).replace('.', ',') + ' m² Wohnfläche') if o.get('wohnflaeche') else ''}</p>"
                f"<p>Sehr geehrte Damen und Herren,<br>nachfolgend erhalten Sie die Abrechnung der Betriebskosten für den Abrechnungszeitraum "
                f"{_de(j['von'])} bis {_de(j['bis'])} ({r['monate']} Monate). Sie sind alleinige Mietpartei des Objekts; die Kosten "
                f"werden daher zu 100 % umgelegt, bei abweichendem Belegzeitraum zeitanteilig nach Tagen.</p>"
                f"<table><tr><th>Kostenart</th><th class='z'>Gesamtkosten</th><th>Verteilerschlüssel</th><th class='z'>Ihr Anteil</th></tr>"
                f"{zeilen}<tr class='summe'><td>Summe Ihrer Betriebskosten</td><td></td><td></td><td class='z'>{_euro(r['summe'])}</td></tr>"
                f"<tr><td>abzüglich Ihrer Vorauszahlungen ({r['monate']}\u00a0×\u00a0{_euro(r['vorauszahlung_bisher'])})</td><td></td><td></td>"
                f"<td class='z'>−\u00a0{_euro(r['vorauszahlungen'])}</td></tr>"
                f"<tr class='summe'><td>{r['art']}</td><td></td><td></td><td class='z'>{_euro(erg)}</td></tr></table>"
                f"<p class='ergebnis'>{satz}</p>{anpassung}"
                f"<p class='klein'>Die Belege können Sie einsehen; auf Wunsch stellen wir sie Ihnen elektronisch zur Verfügung "
                f"(§ 556 Abs. 4 BGB). Einwendungen gegen diese Abrechnung teilen Sie uns bitte spätestens bis zum Ablauf des zwölften "
                f"Monats nach Zugang mit (§ 556 Abs. 3 BGB).</p><p>Mit freundlichen Grüßen<br>{_h(ab['name'])}</p>")
        return pdf_aus_html(html, ziel, f"Betriebskostenabrechnung {j['jahr']}")

    def entwurf_datei(self, oid: str, jahr: int) -> bytes | None:
        j = self._z()["jahre"].get(self._schluessel(oid, jahr)) or {}
        p = Path((j.get("final") or {}).get("lokal") or (j.get("entwurf") or {}).get("datei") or "")
        return p.read_bytes() if p.is_file() else None

    def billigen(self, oid: str, jahr: int) -> dict:
        """Billigung: endgültiges PDF erzeugen und (= bestätigte Ablage) in den Nebenkosten-Ordner legen."""
        o = self.im._objekt_roh(oid)
        with self.lock:
            z = self._z()
            j = z["jahre"].get(self._schluessel(oid, jahr))
            if not j or j["status"] != "entwurf":
                raise ToolError("Kein Entwurf zur Billigung")
        r = self._rechnen(j, o)
        lokal = self._abrechnung_pdf(o, j, r, ENTWURF / f"Betriebskostenabrechnung {jahr} {oid}.pdf", entwurf=False)
        abgelegt = ""
        basis = self._objektordner(o)
        if basis:
            ziel = basis / UNTERORDNER / str(jahr) / f"{date.today().isoformat()} Betriebskostenabrechnung {jahr}.pdf"
            ziel.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(str(lokal), str(ziel))
            abgelegt = str(ziel.relative_to(self._archiv()))
        with self.lock:
            z = self._z()
            j = z["jahre"][self._schluessel(oid, jahr)]
            j["status"] = "gebilligt"
            j["final"] = {"lokal": str(lokal), "archiv": abgelegt, "gebilligt": date.today().isoformat(), "summe": r["summe"],
                          "ergebnis": r["ergebnis"], "vorschlag_vorauszahlung": r.get("vorschlag_vorauszahlung")}
            self._log(z, f"Abrechnung {jahr} gebilligt" + (f", abgelegt: {abgelegt}" if abgelegt else ""))
            self._s(z)
        self.c.audit.log("hestia_abrechnung", jahr=jahr, status="gebilligt", bestaetigt=True)
        return {"ok": True, "abgelegt": abgelegt, "text": "✓ Gebilligt" + (" und im Objektordner abgelegt" if abgelegt else "")}

    def an_mieter(self, oid: str, jahr: int, weg: str, email_an: str = "") -> dict:
        o = self.im._objekt_roh(oid)
        j = self._z()["jahre"].get(self._schluessel(oid, jahr))
        if not j or j["status"] not in ("gebilligt", "versendet"):
            raise ToolError("Erst billigen")
        pdf = Path(j["final"]["lokal"])
        if weg == "mail":
            an = (email_an or (o.get("mieter") or {}).get("kontakt") or "").strip()
            if not re.fullmatch(r"[^@\s]+@[^@\s]+\.\w+", an):
                raise ToolError("Bitte die Mailadresse des Mieters angeben")
            belege = []
            archiv = self._archiv()
            for p in j["posten"]:
                for b in p["belege"]:
                    f = archiv / b["datei"]
                    if f.is_file() and f.suffix.lower() == ".pdf":
                        belege.append(f)
            self._mail_senden(an, f"Betriebskostenabrechnung {jahr} – {o.get('adresse', '')}",
                              f"Guten Tag,\n\nanbei erhalten Sie die Betriebskostenabrechnung für {_de(j['von'])} bis {_de(j['bis'])} "
                              f"sowie die zugehörigen Belege.\n\nMit freundlichen Grüßen\n{self._absender(o)['name']}",
                              [pdf, *belege[:10]])
            return self.zugang(oid, jahr, date.today().isoformat(), weg="mail")
        subprocess.run(["open", str(pdf)], capture_output=True)
        return {"ok": True, "text": "Abrechnung geöffnet – nach dem Versand den Zugang vermerken"}

    def zugang(self, oid: str, jahr: int, datum: str, weg: str = "brief") -> dict:
        d = _d(datum)
        if not d:
            raise ToolError("Datum des Zugangs angeben")
        o = self.im._objekt_roh(oid)
        with self.lock:
            z = self._z()
            j = z["jahre"].get(self._schluessel(oid, jahr))
            if not j or j["status"] not in ("gebilligt", "versendet"):
                raise ToolError("Erst billigen")
            j["status"], j["zugang"], j["versandweg"] = "versendet", d.isoformat(), weg
            erg = (j.get("final") or {}).get("ergebnis") or 0
            self._log(z, f"Abrechnung {jahr} zugegangen am {_de(d)}")
            self._s(z)
        fr = getattr(self.c, "fristen", None)
        if fr:
            marke = f"Nebenkosten: {oid}/{jahr}"
            for f in fr.zustand()["liste"]:
                if not f.get("erledigt") and marke in (f.get("notiz") or ""):
                    fr.erledigt(f["id"])
            name = o.get("name") or "Immobilie"
            if erg > 0:
                fr.eintragen(f"Nachzahlung Nebenkosten {jahr} ({name}) prüfen: {_euro(erg)}", (d + timedelta(days=30)).isoformat(),
                             "Zahlung", marke, quelle="hestia")
            elif erg < 0:
                fr.eintragen(f"Guthaben Nebenkosten {jahr} ({name}) auszahlen: {_euro(-erg)}", (d + timedelta(days=30)).isoformat(),
                             "Zahlung", marke, quelle="hestia")
            vz = (j.get("final") or {}).get("vorschlag_vorauszahlung")
            if vz:
                fr.eintragen(f"Neue NK-Vorauszahlung {_euro(vz)} ({name}) im Objekt eintragen", (d + timedelta(days=45)).isoformat(),
                             "Mietanpassung", marke, quelle="hestia")
        return {"ok": True, "text": f"✓ Zugang {_de(d)} vermerkt – Frist zur Zahlung eingetragen"}

    def absender_setzen(self, anschrift: str) -> dict:
        with self.lock:
            z = self._z()
            z["absender_anschrift"] = (anschrift or "").strip()[:200]
            self._s(z)
        return {"ok": True, "text": "✓ Absenderanschrift gespeichert"}

    def bank_setzen(self, iban: str, inhaber: str = "") -> dict:
        i = re.sub(r"\s+", "", iban or "").upper()
        if i and not re.fullmatch(r"[A-Z]{2}\d{2}[A-Z0-9]{10,30}", i):
            raise ToolError("IBAN sieht ungültig aus")
        set_secret("immo_iban", " ".join(i[k:k + 4] for k in range(0, len(i), 4)) if i else "")
        if inhaber:
            set_secret("immo_kontoinhaber", inhaber.strip()[:80])
        return {"ok": True, "text": "✓ Im Schlüsselbund gespeichert (nur für die Abrechnungs-PDFs auf dem Mac)"}

    # ------------------------------------------------------------ Jahreslauf und Briefing
    def jahreslauf(self) -> None:
        heute = date.today()
        for o in self.im._laden()["objekte"]:
            seit = _d((o.get("mieter") or {}).get("seit"))
            if not seit:
                continue
            vorjahr = heute.year - 1
            if heute >= date(heute.year, 1, 2) and seit <= date(vorjahr, 12, 31) and \
                    self._schluessel(o["id"], vorjahr) not in self._z()["jahre"]:
                try:
                    self.jahr_anlegen(o["id"], vorjahr)
                except ToolError:
                    pass
        z = self._z()
        for j in z["jahre"].values():
            if j["status"] not in ("sammeln", "anfragen"):
                continue
            if heute > _d(j["zielfrist"]):
                self.anfragen_erstellen(j["objekt"], j["jahr"])
            for a in [a for a in z["anfragen"] if a["objekt"] == j["objekt"] and a["jahr"] == j["jahr"]
                      and a["status"] == "versendet" and _d(a.get("versendet"))]:
                if (heute - _d(a["versendet"])).days >= ERINNERN_TAGE and not a.get("erinnert"):
                    erg = self.anfragen_erstellen(j["objekt"], j["jahr"], nur_posten=a["posten"], erinnerung=True)
                    if erg["anfragen"]:
                        with self.lock:
                            z2 = self._z()
                            for x in z2["anfragen"]:
                                if x["id"] == a["id"]:
                                    x["erinnert"] = heute.isoformat()
                            self._s(z2)

    def briefing_zeile(self) -> str:
        z = self._z()
        teile = []
        v = len([x for x in z["vorschlaege"] if x["status"] == "offen"])
        if v:
            teile.append(f"{v} Beleg(e) zur Ablage-Bestätigung")
        a = len([x for x in z["anfragen"] if x["status"] == "entwurf"])
        if a:
            teile.append(f"{a} Anfrage(n) an Versorger zur Billigung")
        b = len([x for x in z["anfragen"] if x["status"] == "gebilligt"])
        if b:
            teile.append(f"{b} Brief(e) noch zu verschicken")
        for j in z["jahre"].values():
            if j["status"] == "entwurf":
                teile.append(f"Nebenkostenabrechnung {j['jahr']} liegt als Entwurf zur Billigung vor")
            elif j["status"] in ("sammeln", "anfragen", "vollstaendig", "gebilligt"):
                rest = (_d(j["gesetzlich_bis"]) - date.today()).days
                if rest <= 60:
                    teile.append(f"Abrechnung {j['jahr']} muss in {rest} Tagen beim Mieter sein")
        return ("HESTIA: " + "; ".join(teile) + ".") if teile else ""

    def schleife(self, stop: threading.Event) -> None:
        letzter_tag = None
        while not stop.wait(60):
            try:
                if not getattr(self.c.proaktiv, "leader", False):
                    continue
                if letzter_tag != date.today():
                    letzter_tag = date.today()
                    self.jahreslauf()
                    try:
                        self.ordner_pruefen()
                    except ToolError:
                        pass
                p = self._z()["postfach"]
                if p.get("alias") and self.c.secrets.get("icloud_app_pw") and \
                        time.time() - self.letzter > int(p.get("intervall_min") or 15) * 60:
                    self.letzter = time.time()
                    self.postfach_pruefen()
            except Exception as e:
                self.c.audit.log("fehler", bereich="hestia", text=f"{type(e).__name__}: {e}"[:200])
                self.letzter = time.time() + 3600

    def start(self, stop: threading.Event) -> None:
        threading.Thread(target=self.schleife, args=(stop,), name="hestia", daemon=True).start()


# ---------------------------------------------------------------- Werkzeuge (ohne Personendaten)
def tools(core) -> list[Tool]:
    nk = core.nebenkosten

    def _ziel(objekt, jahr):
        o = core.immobilien.finden(objekt)
        return o["id"], int(jahr or (date.today().year - 1 if date.today().month <= 6 else date.today().year))

    def status(objekt="", jahr=None):
        oid, y = _ziel(objekt, jahr)
        a = nk.ansicht(oid, y)
        if not a:
            return {"jahr": y, "angelegt": False, "hinweis": "Für dieses Jahr ist noch keine Abrechnung angelegt."}
        r = a["rechnung"]
        return {"jahr": y, "zeitraum": f"{a['von']} bis {a['bis']}", "status": a["status"], "fristen": {
                    "belege_bis": a["zielfrist"], "an_mieter_bis": a["abrechnen_bis"], "gesetzlich_bis": a["gesetzlich_bis"]},
                "posten": [{"kostenart": z["bezeichnung"], "status": z["status"], "anteil": z["anteil"]} for z in r["zeilen"]],
                "summe": r["summe"], "vorauszahlungen": r["vorauszahlungen"], "ergebnis": r["ergebnis"], "art": r["art"],
                "offene_vorschlaege": len(nk.uebersicht()["vorschlaege"]),
                "anfragen": [{"kostenart": x["bezeichnung"], "status": x["status"], "weg": x["weg"]} for x in a["anfragen"]]}

    def anlegen(jahr, objekt=""):
        oid, y = _ziel(objekt, jahr)
        r = nk.jahr_anlegen(oid, y)
        return {"ok": True, "jahr": y, "posten": [p["bezeichnung"] for p in r["jahr"]["posten"]], "hinweis": r.get("text", "")}

    def zeigen(objekt="", jahr=None):
        oid, y = _ziel(objekt, jahr)
        core.broadcast({"type": "hestia", "ereignis": "zeigen", "objekt": oid, "jahr": y})
        return {"angezeigt": True, "jahr": y}

    def pruefen():
        erg = nk.postfach_pruefen() if nk.alias() else {"text": "Kein Postfach eingetragen"}
        try:
            erg2 = nk.ordner_pruefen()
        except ToolError as e:
            erg2 = {"text": str(e)}
        return {"postfach": erg.get("text"), "ordner": erg2.get("text")}

    def anfragen(objekt="", jahr=None):
        oid, y = _ziel(objekt, jahr)
        r = nk.anfragen_erstellen(oid, y)
        core.broadcast({"type": "hestia", "ereignis": "zeigen", "objekt": oid, "jahr": y})
        return {"vorbereitet": len(r["anfragen"]), "kostenarten": [a["bezeichnung"] for a in r["anfragen"]],
                "hinweis": "Liegen im Nebenkostenfenster zur Billigung."}

    return [
        Tool("nebenkosten_status", "Stand der Nebenkostenabrechnung eines Jahres: Belege vorhanden/fehlend, Anfragen, "
             "Fristen, vorläufiges Ergebnis.", "immo.lesen", status,
             {"objekt": S("optional"), "jahr": {"type": "integer", "description": "Abrechnungsjahr, z. B. 2026"}}),
        Tool("nebenkosten_zeigen", "Das Nebenkostenfenster (Belegliste, Ablage-Vorschläge, Anfragen, Entwurf) im Dashboard "
             "öffnen.", "immo.lesen", zeigen, {"objekt": S("optional"), "jahr": {"type": "integer"}}),
        Tool("nebenkosten_pruefen", "Immobilien-Postfach und Nebenkosten-Ordner jetzt auf neue Belege prüfen (Ablage erst "
             "nach Bestätigung).", "immo.lesen", pruefen),
        Tool("nebenkosten_jahr_anlegen", "Abrechnungsjahr anlegen: Belegliste aus dem Mietvertrag, Fristen.", "immo.objekt",
             anlegen, {"jahr": {"type": "integer"}, "objekt": S("optional")}, ["jahr"],
             label=lambda a: f"Nebenkostenabrechnung {a.get('jahr')} anlegen"),
        Tool("nebenkosten_anfragen_vorbereiten", "Anfragen an Versorger für fehlende Belege als Entwurf vorbereiten (gesendet "
             "wird erst nach Billigung im Fenster).", "immo.objekt", anfragen,
             {"objekt": S("optional"), "jahr": {"type": "integer"}}, label=lambda a: "Anfragen an Versorger vorbereiten"),
    ]
