"""Stab: JARVIS als Chef des Stabes mit sieben Sachgebietsagenten.

- Nur JARVIS spricht mit dem Nutzer. Er verteilt Teilaufträge (Werkzeug 'stab_einsatz'), die Agenten
  arbeiten parallel, stimmen sich bei Bedarf untereinander ab ('abstimmen', nur lesend, ohne Freigabe)
  und melden an JARVIS. JARVIS gewichtet (Dringlichkeit × Wichtigkeit × Bezug) und trägt vor.
- Personas liegen versioniert in ATLAS-Privat/agenten/<kürzel>.yaml (jarvis.yaml = Persönlichkeit von
  JARVIS selbst). Jede Änderung: neue Version, alte Fassung in agenten/archiv/, Eintrag in AENDERUNGEN.md.
- Einsatzprotokoll (nur Metadaten, keine Inhalte): ATLAS-Privat/protokoll/einsaetze-JJJJ-MM.jsonl
- Rechte bleiben unverändert: Agenten nutzen dieselbe Rechteprüfung; alles Bestätigungspflichtige wird
  nur vorgeschlagen. VS-Schutz läuft auf jeder Werkzeugausgabe.
"""
import copy
import json
import re
import threading
import time
from concurrent.futures import ThreadPoolExecutor, wait
from datetime import date, datetime, timedelta

import yaml

from atlas.paths import private_dir

REIHENFOLGE = ["zeit", "kom", "dienst", "fin", "akte", "aufkl", "log", "immo"]
EUR_JE_USD = 0.92
MAX_TIEFE = 2            # höchstens zwei Weiterleitungen zwischen Agenten
MAX_SCHRITTE = 5
FRIST_S = 30             # Arbeitszeit je Agent; danach meldet er, was er hat
WARTE_S = 38             # so lange wartet JARVIS höchstens auf den Stab
MELDE_TOKENS = 700

# Lagefragen, bei denen JARVIS den Stab sofort und ohne eigenen Denkschritt einsetzt (Schnellweg)
LAGE = re.compile(r"bereite\b.{0,30}\b(woche|tag|morgen|heute)|was steht (heute |morgen |diese woche |die woche |in der woche "
                  r"|demnächst )?an|was liegt (heute |morgen |diese woche )?an|lagevortrag|lagebild|^(wie ist die )?lage\b|"
                  r"tagesüberblick|wochenüberblick|überblick über (heute|morgen|die woche|meine woche|den tag)|"
                  r"briefing|tageslage", re.I)
FIN_SCHNELL = re.compile(r"frist|offen|überblick|woche|heute|morgen|lage|briefing|stand|zahlung|fällig", re.I)


def _zeitraum(text: str) -> tuple[date, date]:
    t, h = (text or "").lower(), date.today()
    if re.search(r"woche|7 tage|nächsten tage|wochenende", t):
        return h, h + timedelta(days=6)
    if "übermorgen" in t:
        return h + timedelta(days=2), h + timedelta(days=2)
    if re.search(r"\bmorgen\b", t.replace("guten morgen", "")) and "heute" not in t:
        return h + timedelta(days=1), h + timedelta(days=1)
    return h, h


# Was jeder Agent sicher braucht, holt der Stab VOR dem ersten Denkschritt parallel ab (spart je Agent einen
# kompletten Modell-Durchlauf). Gleiche Abfragen mehrerer Agenten laufen nur einmal.
def _vorabruf(k: str, v: date, b: date) -> list[tuple[str, dict]]:
    tage = (b - v).days + 1
    return {
        "zeit": [("kalender_termine", {"von": v.isoformat(), "bis": b.isoformat()}), ("erinnerungen_offen", {}),
                 ("geburtstage", {"tage": max(7, tage)})],
        "dienst": [("kalender_termine", {"von": v.isoformat(), "bis": b.isoformat()}),
                   ("mail_posteingang", {"anzahl": 15, "nur_ungelesen": True})],
        "kom": [("mail_posteingang", {"anzahl": 15, "nur_ungelesen": True})],
        "fin": [("fristen_liste", {"tage": 30}), ("beihilfe_status", {})],
        "akte": [("post_offen", {})],
        "aufkl": [("wetter", {"tage": min(7, max(2, tage))})],
        "log": [("einkaufsliste", {})],
        "immo": [("immobilie_kennzahlen", {}), ("nebenkosten_status", {})],
    }.get(k, [])

# ---------------------------------------------------------------- Persönlichkeit JARVIS
GRUNDTON = {
    "butler": ("Britischer Butler", "ein professioneller britischer Butler – höflich, vorausschauend, diskret und präzise"),
    "stabsoffizier": ("Stabsoffizier", "ein erfahrener Stabsoffizier – militärisch-knapp, klar gegliedert, Ergebnis zuerst, "
                                       "ohne Floskeln"),
    "herzlich": ("Herzlich", "ein warmherziger, zugewandter Assistent – freundlich und ermutigend, dabei präzise"),
    "sachlich": ("Sachlich", "ein nüchterner, sachlicher Assistent – neutral, faktenorientiert, ohne Ausschmückung"),
}
HUMOR = {
    "kein": ("Keiner", "Verzichte auf Humor."),
    "dezent": ("Dezent", "Ein feiner, dezenter Humor ist gelegentlich erlaubt."),
    "trocken": ("Trocken", "Pflege einen trockenen, britischen Humor – sparsam und nie auf Kosten der Klarheit."),
    "viel": ("Viel", "Humor und Schlagfertigkeit sind ausdrücklich erwünscht, solange die Sache nicht leidet."),
}
AUSFUEHRLICH = {
    "knapp": ("Knapp", "Antworten sind knapp und klar gegliedert; das Wichtigste zuerst."),
    "normal": ("Normal", "Antworten sind vollständig, aber ohne Umschweife; das Wichtigste zuerst."),
    "ausfuehrlich": ("Ausführlich", "Antworten dürfen ausführlich sein und Hintergründe erklären; das Wichtigste trotzdem zuerst."),
}
ANREDE = {"du": ("Du", "duzt ihn und bleibst dabei stets respektvoll"),
          "sie": ("Sie", "siezt ihn und bleibst dabei stets respektvoll")}
MODELLE = {"haiku": "Haiku (schnell, günstig)", "sonnet": "Sonnet (gründlich)", "lokal": "Lokal auf dem Mac"}

JARVIS_STANDARD = {
    "kuerzel": "JARVIS", "name": "JARVIS", "rolle": "Chef des Stabes / persönlicher Assistent",
    "auftrag": "Absicht erfassen, Lage beurteilen, Teilaufträge erteilen, Ergebnisse gewichten, Lagevortrag halten. "
               "Einziger Ansprechpartner des Nutzers.",
    "darf": ["Alles, was JARVIS bisher darf", "Agenten beauftragen und Ergebnisse zusammenführen"],
    "darf_nicht": ["Bestätigungspflichtige Aktionen ohne ausdrückliches Ja ausführen"],
    "werkzeuge": ["alle"],
    "persoenlichkeit": {"grundton": "butler", "humor": "trocken", "ausfuehrlichkeit": "knapp",
                        "anrede_form": "du", "zusatz": ""},
}

AGENTEN_STANDARD = {
    "zeit": {"name": "Chronos", "sachgebiet": "Kalender, Erinnerungen, Fristen, Terminkonflikte",
             "auftrag": "Führt Termine, Erinnerungen und Fristen. Meldet Konflikte, Pufferzeiten und Fälliges – nie nur Listen.",
             "darf": ["Kalender und Erinnerungen lesen", "Erinnerungen und Termine eintragen (wird gemeldet)"],
             "darf_nicht": ["Termine löschen ohne Bestätigung", "Dienstliches mit Privatem vermischen"],
             "werkzeuge": ["kalender", "erinnerungen", "fristen"], "modell": "haiku", "datenschutz": "normal",
             "tonfall": "pünktlich, vorausschauend, nennt Uhrzeiten immer konkret"},
    "kom": {"name": "Hermes", "sachgebiet": "Mail, iMessage, Kontakte",
            "auftrag": "Sichtet Mails und Nachrichten, meldet Unbeantwortetes und entwirft Antworten im Stil des Nutzers.",
            "darf": ["Mails lesen und Entwürfe anlegen", "Kontakte nachschlagen", "Absender/Uhrzeit von iMessages sehen"],
            "darf_nicht": ["Mails oder Nachrichten selbst senden", "Inhalte von iMessages an ein Modell geben"],
            "werkzeuge": ["mail", "kontakte", "nachrichten"], "modell": "sonnet", "datenschutz": "hoch",
            "tonfall": "diskret, verbindlich, formuliert im Stil des Nutzers"},
    "dienst": {"name": "Adjutant", "sachgebiet": "Dienstkalender und dienstliche Mails (offen eingestuft)",
               "auftrag": "Wertet den Dienstkalender und weitergeleitete Dienstmails aus; trennt Dienstliches strikt von Privatem.",
               "darf": ["Dienstkalender und offen eingestufte Dienstmails lesen", "Dienstliche Termine melden"],
               "darf_nicht": ["Inhalte mit VS-Kennzeichnung verarbeiten (sofort abbrechen und nur melden)",
                              "Dienstliches nach außen senden"],
               "werkzeuge": ["kalender", "mail"], "modell": "sonnet", "datenschutz": "hoch",
               "tonfall": "militärisch-knapp, Zeitangaben als Datum-Zeit-Gruppe"},
    "fin": {"name": "Quaestor", "sachgebiet": "Beihilfe/PKV, Rechnungen, Steuer, Verträge",
            "auftrag": "Verwaltet Beihilfe, PKV, Rechnungen, Steuer und Vertragsfristen. Meldet offene Beträge, fällige "
                       "Fristen und fehlende Belege.",
            "darf": ["Rechnungen und Bescheide lokal lesen", "Beihilfe-Workflow ausführen", "Fristen eintragen"],
            "darf_nicht": ["Inhalte medizinischer Belege an Cloud-Modelle geben (nur anonymisierte Summen)",
                           "Zahlungen auslösen oder Kontonummern weitergeben"],
            "werkzeuge": ["beihilfe", "fristen", "archiv"], "modell": "lokal", "datenschutz": "sehr_hoch",
            "tonfall": "nüchtern, zahlengenau, Beträge immer mit € und Datum"},
    "akte": {"name": "Archivar", "sachgebiet": "Post, Scans, Ablage, Dokumentensuche",
             "auftrag": "Sucht Dokumente, sichtet die Post und schlägt Ablageorte vor.",
             "darf": ["Archiv durchsuchen und Dokumente lesen", "Ablage vorschlagen"],
             "darf_nicht": ["Dateien ohne Bestätigung verschieben, ändern oder löschen"],
             "werkzeuge": ["archiv", "notizen", "gedaechtnis"], "modell": "haiku", "datenschutz": "hoch",
             "tonfall": "ordentlich, nennt immer Ordner und Dateiname"},
    "aufkl": {"name": "Scout", "sachgebiet": "Recherche, Web, Nachrichtenlage, Wetter",
              "auftrag": "Recherchiert im Internet und liefert Wetter und Lageinformationen mit Quelle und Stand.",
              "darf": ["Im Web suchen", "Wetter abfragen"],
              "darf_nicht": ["Private Daten in Suchanfragen verwenden"],
              "werkzeuge": ["wetter"], "modell": "haiku", "datenschutz": "normal",
              "tonfall": "neugierig, trennt Fakt von Einschätzung, nennt Quellen"},
    "log": {"name": "Quartiermeister", "sachgebiet": "Einkauf, Routen, Reiseplanung",
            "auftrag": "Kümmert sich um Einkaufsliste, Wege, Fahrzeiten und Reiseplanung.",
            "darf": ["Einkaufsliste lesen und ergänzen", "Routen und Orte berechnen"],
            "darf_nicht": ["Bestellungen oder Buchungen auslösen"],
            "werkzeuge": ["einkauf", "karte"], "modell": "haiku", "datenschutz": "normal",
            "tonfall": "praktisch, denkt in Wegen, Zeiten und Mengen"},
    "immo": {"name": "Hestia", "sachgebiet": "Immobilien, Mietverhältnisse, Nebenkosten, Darlehen der Objekte",
             "auftrag": "Verwaltet die Immobilien der GbR: Stammdaten, Mieter, Mieten, Darlehen und Kennzahlen; plant "
                        "Mieterhöhungen und hält Zinsbindung und Nebenkostenfristen im Blick.",
             "darf": ["Immobiliendaten und Kennzahlen lesen", "Fristen vorschlagen", "Entwürfe vorbereiten"],
             "darf_nicht": ["Schreiben an Mieter oder Versorger senden", "im Archiv ohne Bestätigung ablegen",
                            "Namen oder Kontaktdaten von Mietern an die Cloud geben"],
             "werkzeuge": ["immo", "fristen"], "modell": "haiku", "datenschutz": "hoch",
             "tonfall": "gewissenhafte Hausverwalterin – ruhig, genau, fristbewusst, knapp"},
}
KUERZEL = {"zeit": "ZEIT", "kom": "KOM", "dienst": "DIENST", "fin": "FIN", "akte": "AKTE", "aufkl": "AUFKL", "log": "LOG",
           "immo": "IMMO"}
FEST_LOKAL = {"fin"}
RECHTE = {"auftrag", "darf", "darf_nicht"}
TECHNIK = {"werkzeuge", "modell", "aktiv"}


def _heute() -> str:
    return date.today().isoformat()


def _hoch(version: str, stufe: str) -> str:
    try:
        x, y, z = (int(v) for v in str(version).split("."))
    except ValueError:
        x, y, z = 1, 0, 0
    return {"x": f"{x + 1}.0.0", "y": f"{x}.{y + 1}.0"}.get(stufe, f"{x}.{y}.{z + 1}")


def _standard(k: str) -> dict:
    if k == "jarvis":
        p = copy.deepcopy(JARVIS_STANDARD)
    else:
        p = {"kuerzel": KUERZEL[k], **copy.deepcopy(AGENTEN_STANDARD[k]), "ausfuehrlichkeit": "knapp", "zusatz": "",
             "aktiv": True,
             "meldeform": "Lage: <1 Satz>\nPunkte: <je Zeile ein Sachverhalt mit Datum/Uhrzeit>\nEmpfehlung: <1 Satz>",
             "eskalation": {"sofort": "Frist < 7 Tage, Konflikt heute/morgen", "rueckfrage": "unklare Zuordnung"}}
    p.update({"version": "1.0.0", "stand": _heute(),
              "verlauf": [{"version": "1.0.0", "datum": _heute(), "grund": "Erstfassung", "von": "System"}]})
    return p


def stil_text(p: dict) -> str:
    """Stil-Absatz für den Systemprompt von JARVIS ({user} wird dort ersetzt)."""
    e = {**JARVIS_STANDARD["persoenlichkeit"], **(p.get("persoenlichkeit") or {})}
    g = GRUNDTON.get(e["grundton"], GRUNDTON["butler"])[1]
    a = ANREDE.get(e["anrede_form"], ANREDE["du"])[1]
    t = (f"Dein Stil: {g}.\nDu antwortest in der Sprache, in der {{user}} schreibt (meist Deutsch, bei englischen "
         f"Projekten Englisch), {a}. {AUSFUEHRLICH.get(e['ausfuehrlichkeit'], AUSFUEHRLICH['knapp'])[1]} "
         f"{HUMOR.get(e['humor'], HUMOR['trocken'])[1]}")
    if str(e.get("zusatz") or "").strip():
        t += "\nEigene Vorgabe des Nutzers zu deinem Auftreten: " + str(e["zusatz"]).strip()
    return t


class Stab:
    def __init__(self, core):
        self.c = core
        self.lock = threading.RLock()
        self.ordner = private_dir() / "agenten"
        self.protokoll = private_dir() / "protokoll"
        try:
            self._sicherstellen()
        except OSError:
            pass
        self.anwenden()
        self.letzter_vortrag = None

    # ------------------------------------------------------------ Dateien
    def _datei(self, k: str):
        return self.ordner / f"{k}.yaml"

    def _sicherstellen(self) -> None:
        (self.ordner / "archiv").mkdir(parents=True, exist_ok=True)
        self.protokoll.mkdir(parents=True, exist_ok=True)
        for k in ["jarvis", *REIHENFOLGE]:
            if not self._datei(k).exists():
                self._schreiben(k, _standard(k))
        if not (self.ordner / "stab.yaml").exists():
            self._yaml(self.ordner / "stab.yaml", {"aktiv": True, "kostengrenze_eur": 20.0, "hinweis_80": ""})
        if not (self.ordner / "gewichtung.yaml").exists():
            self._yaml(self.ordner / "gewichtung.yaml", {
                "agenten": {"DIENST": 1, "FIN": 1},
                "stichworte": {"familie": 1, "kinder": 1, "frist": 1, "werbung": -2, "newsletter": -2}})
        if not (self.ordner / "AENDERUNGEN.md").exists():
            (self.ordner / "AENDERUNGEN.md").write_text("# Änderungsbuch der Stab-Personas\n\n", encoding="utf-8")

    @staticmethod
    def _yaml(pfad, data) -> None:
        pfad.write_text(yaml.safe_dump(data, allow_unicode=True, sort_keys=False), encoding="utf-8")

    @staticmethod
    def _lesen_yaml(pfad, default):
        try:
            d = yaml.safe_load(pfad.read_text(encoding="utf-8"))
            return d if isinstance(d, type(default)) else default
        except (OSError, yaml.YAMLError):
            return default

    def _schreiben(self, k: str, p: dict) -> None:
        self._yaml(self._datei(k), p)

    def laden(self, k: str) -> dict:
        k = k.lower()
        std = _standard(k)
        p = self._lesen_yaml(self._datei(k), {})
        out = {**std, **p}
        if k == "jarvis":
            out["persoenlichkeit"] = {**std["persoenlichkeit"], **(p.get("persoenlichkeit") or {})}
        if k in FEST_LOKAL:
            out["modell"] = "lokal"
        return out

    def einstellungen(self) -> dict:
        st = self._lesen_yaml(self.ordner / "stab.yaml", {})
        aktiv = bool(st.get("aktiv", True)) if getattr(self, "erzwingen", None) is None else self.erzwingen
        return {"aktiv": aktiv, "kostengrenze_eur": st.get("kostengrenze_eur", 20.0),
                "hinweis_80": st.get("hinweis_80", ""), "vortrag_modell": st.get("vortrag_modell", "haiku")}

    def _einst_setzen(self, **neu) -> dict:
        with self.lock:
            st = {**self._lesen_yaml(self.ordner / "stab.yaml", {}), **neu}
            self._yaml(self.ordner / "stab.yaml", st)
        self.anwenden()
        return st

    def _buch(self, zeile: str) -> None:
        try:
            with (self.ordner / "AENDERUNGEN.md").open("a", encoding="utf-8") as f:
                f.write(zeile.rstrip() + "\n")
        except OSError:
            pass

    # ------------------------------------------------------------ Schalter, Kosten
    def schalten(self, aktiv: bool) -> dict:
        st = self._einst_setzen(aktiv=bool(aktiv))
        self._buch(f"- {datetime.now():%Y-%m-%d %H:%M} · Stab {'eingeschaltet' if aktiv else 'abgeschaltet'}")
        self.c.audit.log("stab_schalter", aktiv=bool(aktiv))
        self.c.broadcast({"type": "stab", "phase": "schalter", "aktiv": bool(aktiv)})
        return st

    def kostengrenze(self, wert) -> dict:
        w = None if wert in (None, "", "aus", "keine") else round(float(wert), 2)
        if w is not None and w <= 0:
            w = None
        st = self._einst_setzen(kostengrenze_eur=w, hinweis_80="")
        self._buch(f"- {datetime.now():%Y-%m-%d %H:%M} · Kostengrenze {'aufgehoben' if w is None else f'auf {w:.2f} €'}")
        self.c.audit.log("stab_kostengrenze", wert=w)
        return st

    def _protokoll_datei(self, monat: str | None = None):
        return self.protokoll / f"einsaetze-{monat or datetime.now().strftime('%Y-%m')}.jsonl"

    def einsaetze(self, n: int = 10) -> list[dict]:
        try:
            zeilen = self._protokoll_datei().read_text(encoding="utf-8").splitlines()
        except OSError:
            return []
        out = []
        for z in reversed(zeilen[-n:]):
            try:
                out.append(json.loads(z))
            except ValueError:
                pass
        return out

    def kosten_monat(self) -> float:
        try:
            zeilen = self._protokoll_datei().read_text(encoding="utf-8").splitlines()
        except OSError:
            return 0.0
        s = 0.0
        for z in zeilen:
            try:
                s += float(json.loads(z).get("kosten_eur") or 0)
            except ValueError:
                pass
        return round(s, 4)

    def grenze_erreicht(self) -> bool:
        g = self.einstellungen()["kostengrenze_eur"]
        return bool(g) and self.kosten_monat() >= float(g)

    def bereit(self) -> bool:
        return self.einstellungen()["aktiv"] and not self.grenze_erreicht()

    # ------------------------------------------------------------ Personas ändern
    def speichern(self, k: str, aenderungen: dict, grund: str, von: str = "Nutzer") -> dict:
        k = k.lower()
        if k not in ("jarvis", *REIHENFOLGE):
            raise ValueError(f"Unbekannter Agent: {k}")
        grund = (grund or "").strip() or "ohne Angabe"
        erlaubt = ({"persoenlichkeit"} if k == "jarvis" else
                   {"tonfall", "ausfuehrlichkeit", "zusatz", "modell", "aktiv", "auftrag", "darf", "darf_nicht",
                    "werkzeuge", "meldeform", "eskalation", "name"})
        neu = {f: v for f, v in (aenderungen or {}).items() if f in erlaubt}
        if k in FEST_LOKAL:
            neu.pop("modell", None)
        if "modell" in neu and neu["modell"] not in MODELLE:
            raise ValueError("Modell muss haiku, sonnet oder lokal sein")
        with self.lock:
            alt = self.laden(k)
            if k == "jarvis" and "persoenlichkeit" in neu:
                pe = {**alt["persoenlichkeit"]}
                for f, v in (neu["persoenlichkeit"] or {}).items():
                    if f in ("grundton", "humor", "ausfuehrlichkeit", "anrede_form", "zusatz"):
                        pe[f] = str(v)[:600]
                neu["persoenlichkeit"] = pe
            geaendert = [f for f, v in neu.items() if alt.get(f) != v]
            if not geaendert:
                return {"ok": True, "unveraendert": True, "version": alt["version"]}
            stufe = "x" if RECHTE & set(geaendert) else "y" if TECHNIK & set(geaendert) else "z"
            try:
                self._yaml(self.ordner / "archiv" / f"{k}_{alt['version']}.yaml", alt)
            except OSError:
                pass
            p = {**alt, **neu}
            p["version"] = _hoch(alt["version"], stufe)
            p["stand"] = _heute()
            p["verlauf"] = [*(alt.get("verlauf") or []),
                            {"version": p["version"], "datum": _heute(), "grund": grund, "von": von,
                             "felder": geaendert}][-30:]
            self._schreiben(k, p)
        self._buch(f"- {datetime.now():%Y-%m-%d %H:%M} · {p['name']} {alt['version']} → {p['version']} "
                   f"({', '.join(geaendert)}) – {grund} [{von}]")
        self.c.audit.log("stab_persona", agent=k, version=p["version"], felder=geaendert)
        self.anwenden()
        return {"ok": True, "version": p["version"], "felder": geaendert}

    def versionen(self, k: str) -> list[str]:
        return sorted((f.stem.split("_", 1)[1] for f in (self.ordner / "archiv").glob(f"{k.lower()}_*.yaml")),
                      key=lambda v: [int(x) if x.isdigit() else 0 for x in v.split(".")])

    def zuruecksetzen(self, k: str, version: str, grund: str = "", von: str = "Nutzer") -> dict:
        k = k.lower()
        alt = self._lesen_yaml(self.ordner / "archiv" / f"{k}_{version}.yaml", {})
        if not alt:
            raise ValueError(f"Version {version} von {k} ist nicht im Archiv")
        felder = ["persoenlichkeit"] if k == "jarvis" else [
            "tonfall", "ausfuehrlichkeit", "zusatz", "modell", "aktiv", "auftrag", "darf", "darf_nicht",
            "werkzeuge", "meldeform", "eskalation", "name"]
        return self.speichern(k, {f: alt[f] for f in felder if f in alt},
                              f"Zurückgesetzt auf {version}" + (f" – {grund}" if grund else ""), von)

    # ------------------------------------------------------------ Systemprompt JARVIS
    def anwenden(self) -> None:
        from atlas import persona
        try:
            persona.STIL = stil_text(self.laden("jarvis"))
            persona.STAB = self.hinweis() if self.einstellungen()["aktiv"] else ""
        except Exception:
            persona.STAB = ""

    def aktive(self) -> list[dict]:
        return [p for p in (self.laden(k) for k in REIHENFOLGE) if p.get("aktiv", True)]

    def hinweis(self) -> str:
        liste = "\n".join(f"  - {p['kuerzel']} ({p['name']}): {p['sachgebiet']}" for p in self.aktive())
        return ("Stabsarbeit: Du bist Chef des Stabes. Dir unterstehen Sachgebietsagenten:\n" + liste + "\n"
                "Entscheidungsregel: Ein Werkzeug, ein Schritt (Musik, Timer, Einkauf, Uhrzeit, Wetter, kurze Fragen) → "
                "selbst erledigen. Mehrere Schritte in einem Sachgebiet oder mehrere Sachgebiete („bereite … vor“, "
                "„was steht an“, „kümmere dich um“, Wochen-/Tagesüberblick) → 'stab_einsatz' mit je einem Teilauftrag "
                "(Ziel, Rahmen/Zeitraum) pro Agent, alle in EINEM Aufruf. Ohne Vorrede aufrufen. Danach trägst du das "
                "Ergebnis als Lagevortrag vor: Sofort (höchstens drei Punkte, mit Handlungsvorschlag) – Diese Woche – "
                "Zur Kenntnis (nur Anzahl). Doppelungen zusammenführen, Agentennamen nur nennen, wenn hilfreich. "
                "Vorgeschlagene Aktionen bietest du als Frage an. Meldet 'stab_einsatz' einen Fehler, erledigst du "
                "es selbst. Die Agenten sprechen nie mit dem Nutzer – nur du.")

    def briefing_hinweis(self) -> str:
        return ""          # das Briefing läuft über den Schnellweg (siehe schnellweg)
        if not self.bereit():
            return ""
        return ("Erstelle das Briefing über den Stab: ein 'stab_einsatz' mit ZEIT (Termine heute, fällige "
                "Erinnerungen, Geburtstage), DIENST (Diensttermine heute), KOM (wichtige ungelesene Mails), FIN "
                "(Fristen 7 Tage) und AUFKL (Wetter heute) – nur aktive Agenten.")

    def filtern(self, tools: list) -> list:
        """Ohne aktiven Stab (oder über der Kostengrenze) bekommt JARVIS 'stab_einsatz' nicht angeboten."""
        if self.bereit():
            return tools
        return [t for t in tools if t.name != "stab_einsatz"]

    # ------------------------------------------------------------ Agentenlauf
    def _prompt(self, p: dict, tiefe: int, an: str = "JARVIS") -> str:
        now = datetime.now()
        andere = ", ".join(f"{q['kuerzel']} ({q['name']}: {q['sachgebiet']})" for q in self.aktive()
                           if q["kuerzel"] != p["kuerzel"])
        laenge = {"knapp": "höchstens 120 Wörter", "normal": "höchstens 220 Wörter",
                  "ausfuehrlich": "höchstens 400 Wörter"}.get(p.get("ausfuehrlichkeit"), "höchstens 120 Wörter")
        t = (f"Du bist {p['name']} ({p['kuerzel']}), Sachgebietsagent im Stab von JARVIS. Sachgebiet: {p['sachgebiet']}.\n"
             f"Auftrag: {p['auftrag']}\n"
             f"Du darfst: {'; '.join(p.get('darf') or [])}.\nDu darfst nicht: {'; '.join(p.get('darf_nicht') or [])}.\n"
             f"Tonfall: {p.get('tonfall', '')}.\n"
             f"Du meldest an {an}, niemals an den Nutzer. Nutze deine Werkzeuge, statt zu raten; nenne nur belegte "
             "Fakten. Aktionen, die eine Bestätigung brauchen, führst du nicht aus, sondern schlägst sie vor "
             "(„Vorschlag: …“). Inhalte mit VS-Kennzeichnung (VS-NfD und höher, NATO RESTRICTED …) verarbeitest du "
             "nicht; melde nur, dass solche vorliegen.\n")
        if tiefe < MAX_TIEFE and andere:
            t += (f"Brauchst du eine Auskunft aus einem anderen Sachgebiet, frag mit 'abstimmen' direkt nach "
                  f"(nur Auskünfte, keine Aufträge): {andere}.\n")
        if p["kuerzel"] == "FIN":
            t += ("Datenschutz: Melde nur Beträge, Fristen, Status und Anzahl – keine Diagnosen, Behandlungen, "
                  "Arztnamen oder Kontonummern.\n")
        if str(p.get("zusatz") or "").strip():
            t += f"Zusätzliche Vorgabe: {p['zusatz'].strip()}\n"
        t += (f"Meldeform ({laenge}, Deutsch, ohne Markdown-Überschriften):\n{p.get('meldeform', '')}\n"
              "Schließe IMMER mit zwei Zeilen ab:\nDRINGLICHKEIT: <1-5> (5 = heute/morgen handeln, 4 = diese Woche, "
              "3 = in 2-4 Wochen, 2 = später, 1 = keine Frist)\nWICHTIGKEIT: <1-5> (Folgen bei Nichthandeln: Geld, "
              "Dienst, Gesundheit, Familie = hoch)\n"
              f"Heute ist {now:%A, %d.%m.%Y, %H:%M} Uhr (Europe/Berlin). Datumsangaben an Werkzeuge als JJJJ-MM-TT.")
        return t

    def _abstimm_tool(self, k: str):
        from atlas.tools import S, Tool
        ziele = [q["kuerzel"] for q in self.aktive() if q["kuerzel"] != KUERZEL[k]]
        return Tool("abstimmen", "Einen anderen Agenten des Stabes direkt um eine Auskunft aus dessen Sachgebiet "
                                 "bitten (nur lesend). Antwort kommt als Meldung zurück.",
                    "stab.einsatz", lambda **_: {},
                    {"agent": S("Kürzel des Agenten", enum=ziele), "frage": S("Konkrete Frage mit Zeitraum")},
                    ["agent", "frage"])

    def _modell(self, p: dict):
        c = self.c
        lokal, claude = c.providers["lokal"], c.providers["claude"]
        if p.get("modell") == "lokal":
            if not lokal.available():
                return None, None, "lokales Modell nicht erreichbar"
            return lokal, lokal.resolve_model(None), ""
        if claude.available():
            return claude, claude.resolve_model(p.get("modell") or "haiku"), ""
        if lokal.available():
            return lokal, lokal.resolve_model(None), ""
        return None, None, "kein Modell erreichbar"

    def _werkzeug(self, name: str, args: dict, roh: dict | None = None, key: str = "") -> str:
        """Leseabfrage für den Vorabruf – mit Rechteprüfung und VS-Schutz. Das unveränderte Ergebnis wird
        zusätzlich für die Visualisierung des Lagevortrags aufbewahrt (nicht bei VS-Kennzeichnung)."""
        from atlas.hilfen import vs_schutz
        from atlas.permissions import Level
        c = self.c
        tool = c.tools.get(name)
        if not tool or c.gate.level(tool.action) != Level.FREI:
            return f"Fehler: {name} nicht verfügbar"
        try:
            ergebnis = tool.func(**args)
            out = json.dumps(ergebnis, ensure_ascii=False, default=str)
        except Exception as e:
            c.audit.log("werkzeug", werkzeug=name, aktion=tool.action, erfolg=False, quelle="stab")
            return f"Fehler: {type(e).__name__}: {e}"
        c.audit.log("werkzeug", werkzeug=name, aktion=tool.action, erfolg=True, quelle="stab")
        geschuetzt = vs_schutz(name, out)
        if roh is not None and geschuetzt == out:
            roh[key or name] = ergebnis
        if hasattr(c, "sicherheit"):
            geschuetzt, _ = c.sicherheit.schuetzen(name, geschuetzt, "stab")
        return geschuetzt[:12000]

    def _fristen_zahlungen(self) -> tuple[list, list]:
        """Fristen (30 Tage) und offene Zahlungen (14 Tage, Überfälliges) – nur lesend, ohne die
        Erinnerungsstufen des Morgenbriefings zu verbrauchen."""
        fristen, zahlungen = [], []
        try:
            fristen = sorted(self.c.fristen.zeitleiste(30), key=lambda f: f["datum"])
        except Exception:
            pass
        try:
            from atlas.workflows.beihilfe import euro, tag
            heute = date.today()
            for x in self.c.beihilfe.excel_zeilen() if getattr(self.c.beihilfe, "aktiv", False) else []:
                if not x["kind"] or x["ueberwiesen"] or not x["ziel"] or x["betrag"] is None:
                    continue
                t = (x["ziel"] - heute).days
                if t <= 14:
                    zahlungen.append({"titel": f"Rechnung {x['nr']} ({x['kind']})", "betrag": euro(x["betrag"]),
                                      "datum": x["ziel"].isoformat(), "tage": t, "text": f"Rechnung {x['nr']} für "
                                      f"{x['kind']} über {euro(x['betrag'])} bis {tag(x['ziel'])}"})
        except Exception:
            pass
        return fristen, zahlungen

    def _fin_schnell(self, auftrag: str) -> str | None:
        """Quaestor ohne Sprachmodell: Fristen und Zahlungen lokal ermittelt – schnell und ohne Belegdetails."""
        if not FIN_SCHNELL.search(auftrag or ""):
            return None
        fr, za = self._fristen_zahlungen()
        heute = date.today()
        frist = [f"{f['titel']} – {self._wann((date.fromisoformat(f['datum']) - heute).days)} "
                 f"({date.fromisoformat(f['datum']):%d.%m.%Y})" for f in fr if (date.fromisoformat(f['datum']) - heute).days <= 14]
        zahl = [f"{z['text']} – {self._wann(z['tage'])}" for z in za]
        if not zahl and not frist:
            return "Lage: Keine fälligen Fristen oder offenen Zahlungen.\nDRINGLICHKEIT: 1\nWICHTIGKEIT: 2"
        t = "Lage: " + ("Fristen und Zahlungen stehen an." if zahl and frist else "Fristen stehen an." if frist
                        else "Zahlungen stehen an.")
        t += "".join(f"\n- {z}" for z in [*frist, *zahl][:8])
        naechst = min([(date.fromisoformat(f["datum"]) - heute).days for f in fr] + [z["tage"] for z in za] or [30])
        return t + f"\nDRINGLICHKEIT: {5 if naechst <= 1 else 4 if naechst <= 7 else 3}\nWICHTIGKEIT: 4"

    @staticmethod
    def _wann(t: int) -> str:
        return ("überfällig seit " + str(-t) + " Tag" + ("en" if t != -1 else "")) if t < 0 else \
            "heute" if t == 0 else "morgen" if t == 1 else f"in {t} Tagen"

    def _lauf(self, k: str, auftrag: str, tiefe: int = 0, nur_lesen: bool = False, an: str = "JARVIS",
              vorab: list | None = None) -> dict:
        from atlas import agent, werkzeugwahl
        c = self.c
        p = self.laden(k)
        t0 = time.monotonic()
        erg = {"agent": p["kuerzel"], "name": p["name"], "version": p["version"], "auftrag": auftrag[:300],
               "werkzeuge": [], "abstimmungen": [], "tokens_in": 0, "tokens_out": 0, "kosten_eur": 0.0,
               "modell": "", "status": "ok", "meldung": ""}
        if k == "fin" and tiefe == 0:
            schnell = self._fin_schnell(auftrag)
            if schnell:
                return self._auswerten(erg, schnell, t0, "lokal (ohne Modell)")
        prov, model, fehler = self._modell(p)
        if not prov:
            erg.update(status="nicht verfügbar", meldung=f"{p['name']}: {fehler}.")
            return erg
        erg["modell"] = model
        tools = [t for t in werkzeugwahl.auswahl(c.tools, set(p.get("werkzeuge") or [])) if t.name != werkzeugwahl.LADEN]
        if tiefe < MAX_TIEFE:
            tools.append(self._abstimm_tool(k))
        system = self._prompt(p, tiefe, an)
        ist_cloud = prov is c.providers["claude"]
        max_tokens = min(c.cfg["claude" if ist_cloud else "local"]["max_tokens"], MELDE_TOKENS)
        inhalt = auftrag
        if vorab:                                    # vorab abgeholte Daten gleich mitgeben
            teile = []
            for name, args, fut in vorab:
                try:
                    out = fut.result(timeout=max(1, FRIST_S - (time.monotonic() - t0)))
                except Exception as e:
                    out = f"Fehler: {e}"
                a = ", ".join(f"{x}={y}" for x, y in args.items())
                teile.append(f"[{name}({a})]\n{str(out)[:5000]}")
            inhalt += ("\n\nVorab ermittelt (aktuell, verlässlich) – nutze es direkt, rufe Werkzeuge nur für fehlende "
                       "Details auf:\n" + "\n\n".join(teile))
        work = [{"role": "user", "content": inhalt}]
        text = ""
        stab_fremd: list[str] = []                   # Fremdinhalt im Agentenlauf → Aktionen nur mit Bestätigung
        try:
            for _ in range(MAX_SCHRITTE):
                if time.monotonic() - t0 > FRIST_S:
                    erg["status"] = "Zeitüberschreitung"
                    break
                result = None
                for ev in prov.step(model, system, list(work), tools, max_tokens):
                    if ev[0] == "text":
                        text += ev[1]
                    else:
                        result = ev[1]
                erg["tokens_in"] += result.usage[0]
                erg["tokens_out"] += result.usage[1]
                if result.pause:
                    work.append(result.assistant_msg)
                    continue
                if not result.tool_calls:
                    break
                if result.text and text.endswith(result.text):
                    text = text[: -len(result.text)]
                def ausf(call):
                    if call.name == "abstimmen":
                        return call, self._abstimmen(p, call.args, tiefe, erg)
                    return call, agent._tool(c, call, None, None, nur_lesen, stab_fremd, f"stab:{p.get('kuerzel', '')}")
                erg["werkzeuge"] += [cl.name for cl in result.tool_calls]
                if len(result.tool_calls) > 1:            # mehrere Abfragen gleichzeitig
                    with ThreadPoolExecutor(max_workers=len(result.tool_calls)) as tp:
                        outs = list(tp.map(ausf, result.tool_calls))
                else:
                    outs = [ausf(result.tool_calls[0])]
                work += [result.assistant_msg, *prov.tool_results(outs)]
        except Exception as e:
            erg["status"] = "Fehler"
            text = (text + f"\n(Fehler: {type(e).__name__}: {str(e)[:200]})").strip()
        if ist_cloud:
            fam = c.family(model)
            c.audit.add_usage(f"claude:{fam}", erg["tokens_in"], erg["tokens_out"])
            preis = c.cfg["preise"].get(fam)
            if preis:
                erg["kosten_eur"] += (erg["tokens_in"] * preis[0] + erg["tokens_out"] * preis[1]) / 1e6 * EUR_JE_USD
        else:
            c.audit.add_usage("lokal", erg["tokens_in"], erg["tokens_out"])
        return self._auswerten(erg, text, t0)

    @staticmethod
    def _auswerten(erg: dict, text: str, t0: float, modell: str = "") -> dict:
        if modell:
            erg["modell"] = modell
        erg["kosten_eur"] = round(erg["kosten_eur"], 5)
        d = re.search(r"DRINGLICHKEIT:\s*([1-5])", text)
        w = re.search(r"WICHTIGKEIT:\s*([1-5])", text)
        erg["dringlichkeit"] = int(d.group(1)) if d else 3
        erg["wichtigkeit"] = int(w.group(1)) if w else 3
        erg["meldung"] = re.sub(r"\n?\s*(DRINGLICHKEIT|WICHTIGKEIT):\s*\d\s*", "", text).strip() or "(keine Meldung)"
        erg["dauer_s"] = round(time.monotonic() - t0, 1)
        return erg

    def _abstimmen(self, von: dict, args: dict, tiefe: int, erg: dict) -> str:
        ziel = str(args.get("agent") or "").lower()
        frage = str(args.get("frage") or "").strip()
        if ziel not in KUERZEL or KUERZEL[ziel] == von["kuerzel"]:
            return "Fehler: unbekannter oder eigener Agent."
        if not self.laden(ziel).get("aktiv", True):
            return f"{KUERZEL[ziel]} ist abgeschaltet."
        self.c.broadcast({"type": "stab", "phase": "abstimmung", "von": von["kuerzel"], "an": KUERZEL[ziel]})
        a = self._lauf(ziel, frage, tiefe + 1, nur_lesen=True, an=f"{von['name']} ({von['kuerzel']})")
        erg["abstimmungen"].append({"an": a["agent"], "status": a["status"], "kosten_eur": a["kosten_eur"],
                                    "dauer_s": a.get("dauer_s")})
        erg["kosten_eur"] += a["kosten_eur"]
        self.c.audit.log("stab_abstimmung", von=von["kuerzel"], an=a["agent"], status=a["status"])
        return a["meldung"][:4000]

    # ------------------------------------------------------------ Gewichtung, Einsatz
    def _bezug(self, kuerzel: str, meldung: str) -> int:
        gw = self._lesen_yaml(self.ordner / "gewichtung.yaml", {})
        b = 3 + int((gw.get("agenten") or {}).get(kuerzel, 0) or 0)
        t = meldung.lower()
        for wort, bonus in (gw.get("stichworte") or {}).items():
            if str(wort).lower() in t:
                b += int(bonus or 0)
        return max(1, min(5, b))

    def einsatz(self, auftraege: list, nur_lesen: bool = False, quelle: str = "chat", text: str = "") -> dict:
        st = self.einstellungen()
        if not st["aktiv"]:
            return {"fehler": "Der Stab ist abgeschaltet – erledige es selbst."}
        if self.grenze_erreicht():
            return {"fehler": f"Kostengrenze des Stabs ({st['kostengrenze_eur']} €) erreicht – erledige es selbst."}
        jobs, gesehen = [], set()
        for a in auftraege or []:
            k = str((a or {}).get("agent") or "").strip().lower()
            k = {v.lower(): kk for kk, v in KUERZEL.items()}.get(k, k)
            if k in KUERZEL and k not in gesehen and self.laden(k).get("aktiv", True) and str(a.get("auftrag") or "").strip():
                gesehen.add(k)
                jobs.append((k, str(a["auftrag"]).strip()))
        if not jobs:
            return {"fehler": "Kein gültiger Teilauftrag (Agent unbekannt oder abgeschaltet) – erledige es selbst."}
        t0 = time.monotonic()
        namen = [self.laden(k)["name"] for k, _ in jobs]
        self.c.broadcast({"type": "stab", "phase": "start", "agenten": namen, "kuerzel": [KUERZEL[k] for k, _ in jobs]})
        vor_pool = ThreadPoolExecutor(max_workers=8, thread_name_prefix="stab-vorab")
        abrufe: dict = {}
        roh: dict = {}

        def hol(name: str, args: dict):
            key = name + json.dumps(args, sort_keys=True)
            if key not in abrufe:
                abrufe[key] = vor_pool.submit(self._werkzeug, name, args, roh, name)
            return abrufe[key]
        vorab = {}
        for k, a in jobs:
            if k == "fin" and self._fin_schnell(a):
                continue
            v, b = _zeitraum(a + " " + (text or ""))
            vorab[k] = [(n, args, hol(n, args)) for n, args in _vorabruf(k, v, b) if n in self.c.tools]
        ex = ThreadPoolExecutor(max_workers=len(jobs), thread_name_prefix="stab")
        futs = {ex.submit(self._lauf, k, a, 0, nur_lesen, "JARVIS", vorab.get(k)): (k, a) for k, a in jobs}
        for f, (k, _) in futs.items():              # Dashboard: Meldung eines Agenten ist da
            f.add_done_callback(lambda _f, kz=KUERZEL[k]: self.c.broadcast({"type": "stab", "phase": "meldung", "kuerzel": kz}))
        fertig, offen = wait(futs, timeout=WARTE_S)
        ex.shutdown(wait=False)
        vor_pool.shutdown(wait=False)
        meldungen = []
        for f, (k, a) in futs.items():
            if f in fertig:
                try:
                    r = f.result()
                except Exception as e:
                    r = {"agent": KUERZEL[k], "name": self.laden(k)["name"], "status": "Fehler",
                         "meldung": f"Fehler: {e}", "kosten_eur": 0, "dringlichkeit": 1, "wichtigkeit": 1}
            else:
                r = {"agent": KUERZEL[k], "name": self.laden(k)["name"], "status": "Zeitüberschreitung",
                     "meldung": f"Keine Meldung innerhalb von {WARTE_S} s.", "kosten_eur": 0, "dringlichkeit": 1,
                     "wichtigkeit": 1}
            r["bezug"] = self._bezug(r["agent"], r.get("meldung", ""))
            r["gewicht"] = r.get("dringlichkeit", 3) * r.get("wichtigkeit", 3) * r["bezug"]
            meldungen.append(r)
        meldungen.sort(key=lambda r: -r["gewicht"])
        kosten = round(sum(float(r.get("kosten_eur") or 0) for r in meldungen), 5)
        eintrag = {"zeit": datetime.now().isoformat(timespec="seconds"), "quelle": quelle,
                   "auftrag": (text or "")[:160], "dauer_s": round(time.monotonic() - t0, 1), "kosten_eur": kosten,
                   "agenten": [{k: r.get(k) for k in ("agent", "version", "auftrag", "modell", "werkzeuge",
                                                     "abstimmungen", "dauer_s", "tokens_in", "tokens_out",
                                                     "kosten_eur", "status", "gewicht")} for r in meldungen]}
        try:
            with self.lock, self._protokoll_datei().open("a", encoding="utf-8") as f:
                f.write(json.dumps(eintrag, ensure_ascii=False) + "\n")
        except OSError:
            pass
        self.c.audit.log("stab_einsatz", agenten=[r["agent"] for r in meldungen], kosten_eur=kosten,
                         dauer_s=eintrag["dauer_s"])
        self.c.broadcast({"type": "stab", "phase": "ende", "agenten": namen, "kuerzel": [r["agent"] for r in meldungen],
                          "dauer_s": eintrag["dauer_s"]})
        out = {"meldungen": [{"agent": r["agent"], "name": r["name"], "gewicht": r["gewicht"],
                              "dringlichkeit": r.get("dringlichkeit"), "wichtigkeit": r.get("wichtigkeit"),
                              "bezug": r["bezug"], "status": r.get("status"), "meldung": r.get("meldung", "")}
                             for r in meldungen],
               "vortrag": "Gewicht G = Dringlichkeit × Wichtigkeit × Bezug (1–125). Sofort: G ≥ 60, Diese Woche: "
                          "G 20–59, Zur Kenntnis: G < 20. Du darfst die Gewichtung mit gutem Grund korrigieren."}
        g = st["kostengrenze_eur"]
        monat = datetime.now().strftime("%Y-%m")
        if g and self.kosten_monat() >= 0.8 * float(g) and st.get("hinweis_80") != monat:
            self._einst_setzen(hinweis_80=monat)
            out["kostenhinweis"] = (f"Erwähne kurz: Der Stab hat {self.kosten_monat():.2f} € von {g} € Monatsgrenze "
                                    "verbraucht (Grenze per Befehl erhöhbar).")
            self.c.broadcast({"type": "info", "text": f"Stab: 80 % der Kostengrenze erreicht ({self.kosten_monat():.2f} € / {g} €)"})
        out["_roh"] = roh                          # nur intern (Visualisierung), geht nicht ans Modell
        return out

    # ------------------------------------------------------------ Schnellweg
    def schnellweg(self, text: str, nur_lesen: bool = False, quelle: str = "chat") -> dict | None:
        """Typische Lagefragen („Was steht heute an?“, „Bereite meine Woche vor“, Morgenbriefing): Der Stab legt
        sofort los – ohne dass JARVIS erst überlegt, wen er beauftragt. JARVIS formuliert danach nur noch den
        Vortrag (ein einziger Modell-Durchlauf)."""
        t = (text or "").strip()
        if not t or len(t) > 260 or not self.bereit() or not LAGE.search(t):
            return None
        v, b = _zeitraum(t)
        zr = ("heute" if v == b == date.today() else f"{v:%d.%m.}" if v == b else f"{v:%d.%m.} bis {b:%d.%m.%Y}")
        auftraege = [{"agent": "ZEIT", "auftrag": f"Termine, Konflikte, fällige Erinnerungen und Geburtstage ({zr})"},
                     {"agent": "DIENST", "auftrag": f"Dienstliche Termine und neue dienstliche Mails ({zr})"},
                     {"agent": "KOM", "auftrag": "Wichtige ungelesene oder unbeantwortete private Mails"},
                     {"agent": "FIN", "auftrag": "Fällige Fristen und offene Zahlungen"},
                     {"agent": "AUFKL", "auftrag": f"Wetter ({zr})"}]
        erg = self.einsatz(auftraege, nur_lesen=nur_lesen, quelle=quelle, text=t)
        if erg.get("fehler"):
            return None
        try:
            erg["_vortrag"] = self.vortrag_daten(erg, erg.pop("_roh", {}), t)
        except Exception as e:
            self.c.audit.log("fehler", bereich="vortrag", text=f"{type(e).__name__}: {e}"[:200])
            erg.pop("_roh", None)
        self.letzter_vortrag = erg.get("_vortrag")
        return erg

    def vorab_hinweis(self, erg: dict) -> str:
        nutz = {k: v for k, v in erg.items() if not k.startswith("_")}
        szenen = (erg.get("_vortrag") or {}).get("szenen") or []
        marken = ""
        if szenen:
            marken = ("\nIm Dashboard läuft parallel eine animierte Darstellung. Gliedere den Vortrag in Abschnitte und "
                      "beginne jeden Abschnitt mit seiner Marke allein auf einer Zeile, damit die passende Grafik "
                      "erscheint: " + ", ".join(f"[{x}]" for x in szenen) + ". Nur diese Marken, jede höchstens einmal, "
                      "Reihenfolge nach Wichtigkeit ([SOFORT] zuerst, falls vorhanden). Die Marken werden nicht "
                      "vorgelesen. Verweise gelegentlich auf die Grafik („Wie Sie in der Übersicht sehen …“), "
                      "lies aber keine Listen vollständig vor – die stehen in der Grafik.")
        return ("\n\nDein Stab hat zu dieser Anfrage bereits gemeldet (Ergebnis von 'stab_einsatz'). Trage daraus "
                "direkt den Lagevortrag vor – ohne weitere Werkzeuge, außer es fehlt Wesentliches." + marken + "\n"
                + json.dumps(nutz, ensure_ascii=False)[:14000])

    # ------------------------------------------------------------ Daten für die Visualisierung
    def vortrag_daten(self, erg: dict, roh: dict, text: str) -> dict:
        v, b = _zeitraum(text)
        dienst_rx = re.compile(r"bundeswehr|dienst|\bbw\b|kaserne|truppe|einheit|kommando", re.I)
        termine = []
        for x in roh.get("kalender_termine") or []:
            if isinstance(x, dict) and x.get("datum"):
                termine.append({"titel": x.get("titel", ""), "datum": x["datum"], "zeit": x.get("zeit"),
                                "ende": str(x.get("ende") or "")[11:16] if not x.get("ganztag") else "",
                                "ganztag": bool(x.get("ganztag")), "kalender": x.get("kalender", ""),
                                "ort": x.get("ort", ""), "dienst": bool(dienst_rx.search(x.get("kalender", "") or ""))})
        termine.sort(key=lambda x: (x["datum"], x["zeit"] or ""))
        w = roh.get("wetter") or {}
        wetter = {"ort": w.get("ort", ""), "tage": [t for t in w.get("tage") or [] if v.isoformat() <= t.get("datum", "") <= b.isoformat()]
                  or (w.get("tage") or [])[:1], "aktuell": w.get("aktuell"), "quelle": w.get("quelle", ""),
                  "reiseziele": w.get("reiseziele") or []} if isinstance(w, dict) and w.get("tage") else None
        m = roh.get("mail_posteingang")
        mails = None
        if isinstance(m, dict):
            mails = {"ungelesen": m.get("ungelesen", 0), "neueste": [{"von": re.sub(r"\s*<.*?>", "", x.get("von", ""))[:40],
                     "betreff": x.get("betreff", "")[:70]} for x in (m.get("neueste") or [])[:4]]}
        ende = b.isoformat() + "T23:59"
        erinnerungen = [{"titel": x.get("titel", ""), "faellig": (x.get("faellig") or "")[:10]}
                        for x in roh.get("erinnerungen_offen") or [] if isinstance(x, dict)
                        and x.get("faellig") and x["faellig"][:16] <= ende][:6]
        geburtstage = [{"name": x.get("name", ""), "datum": x.get("datum", ""), "in_tagen": x.get("in_tagen", 0)}
                       for x in roh.get("geburtstage") or [] if isinstance(x, dict)
                       and x.get("in_tagen", 99) <= (b - v).days + (b - date.today()).days + 1][:5]
        fristen, zahlungen = self._fristen_zahlungen()
        heute = date.today()
        fristen = [{"titel": f["titel"], "datum": f["datum"], "tage": (date.fromisoformat(f["datum"]) - heute).days}
                   for f in fristen][:6]
        meldungen = [{"agent": x["agent"], "name": x["name"], "gewicht": x["gewicht"], "meldung": x["meldung"][:600]}
                     for x in erg.get("meldungen") or []]
        d = {"titel": "WOCHENÜBERBLICK" if v != b else "TAGESLAGE", "von": v.isoformat(), "bis": b.isoformat(),
             "meldungen": meldungen, "termine": termine[:40], "wetter": wetter, "mails": mails,
             "erinnerungen": erinnerungen, "geburtstage": geburtstage, "fristen": fristen, "zahlungen": zahlungen}
        sofort = [x for x in meldungen if x["gewicht"] >= 60]
        szenen = []
        if sofort:
            szenen.append("SOFORT")
        if termine:
            szenen.append("TERMINE")
        if wetter:
            szenen.append("WETTER")
        if fristen or zahlungen:
            szenen.append("FRISTEN")
        if mails or erinnerungen or geburtstage:
            szenen.append("POST")
        if len(meldungen) > len(sofort):
            szenen.append("KENNTNIS")
        d["szenen"] = szenen
        return d

    # ------------------------------------------------------------ Messung: mit vs. ohne Stab
    MESSFRAGEN = ["Was steht heute an?", "Bereite meine Woche vor.", "Wie wird das Wetter morgen?"]

    def messen(self, fragen: list | None = None) -> dict:
        from atlas import agent
        from atlas.paths import LOCAL_DIR
        laeufe = []
        try:
            for modus in (False, True):              # Aufwärmen (Prompt-Cache), zählt nicht
                self.erzwingen = modus
                self.anwenden()
                agent.run(self.c, "Hallo", nur_lesen=True, quelle="messung")
            for frage in fragen or self.MESSFRAGEN:
                for modus in (False, True):
                    self.erzwingen = modus
                    self.anwenden()
                    vorher = len(self.einsaetze(500))
                    t0 = time.monotonic()
                    try:
                        antwort = agent.run(self.c, frage, nur_lesen=True, quelle="messung")
                    except Exception as e:
                        antwort = f"Fehler: {type(e).__name__}: {e}"
                    laeufe.append({"frage": frage, "stab": modus, "sekunden": round(time.monotonic() - t0, 1),
                                   "stab_eingesetzt": len(self.einsaetze(500)) > vorher,
                                   "antwort": (antwort or "")[:500]})
        finally:
            self.erzwingen = None
            self.anwenden()
        ergebnis = {"zeit": datetime.now().isoformat(timespec="seconds"), "laeufe": laeufe}
        try:
            ordner = LOCAL_DIR / "messungen"
            ordner.mkdir(parents=True, exist_ok=True)
            (ordner / f"messung-{datetime.now():%Y%m%d-%H%M}.json").write_text(
                json.dumps(ergebnis, ensure_ascii=False, indent=1), encoding="utf-8")
        except OSError:
            pass
        self.c.audit.log("stab_messung", laeufe=[(l["frage"][:20], l["stab"], l["sekunden"]) for l in laeufe])
        return ergebnis

    # ------------------------------------------------------------ Übersicht (Dashboard/Werkzeug)
    def uebersicht(self) -> dict:
        st = self.einstellungen()
        return {**st, "kosten_monat": round(self.kosten_monat(), 2), "jarvis": self.laden("jarvis"),
                "agenten": [{**self.laden(k), "id": k, "fest_lokal": k in FEST_LOKAL, "versionen": self.versionen(k)}
                            for k in REIHENFOLGE],
                "jarvis_versionen": self.versionen("jarvis"),
                "einsaetze": self.einsaetze(8),
                "optionen": {"grundton": {k: v[0] for k, v in GRUNDTON.items()},
                             "humor": {k: v[0] for k, v in HUMOR.items()},
                             "ausfuehrlichkeit": {k: v[0] for k, v in AUSFUEHRLICH.items()},
                             "anrede_form": {k: v[0] for k, v in ANREDE.items()},
                             "modell": MODELLE}}

    def tools(self) -> list:
        from atlas.tools import S, Tool

        def einsatz(auftraege, **_):
            erg = self.einsatz(auftraege, quelle="chat",
                               text="; ".join(f"{a.get('agent')}: {a.get('auftrag')}" for a in auftraege or [])[:160])
            erg.pop("_roh", None)
            return erg

        def status():
            u = self.uebersicht()
            return {"aktiv": u["aktiv"], "kostengrenze_eur": u["kostengrenze_eur"], "kosten_monat_eur": u["kosten_monat"],
                    "jarvis": {"version": u["jarvis"]["version"], "persoenlichkeit": u["jarvis"]["persoenlichkeit"]},
                    "agenten": [{"kuerzel": a["kuerzel"], "name": a["name"], "sachgebiet": a["sachgebiet"],
                                 "aktiv": a.get("aktiv", True), "version": a["version"], "modell": a["modell"],
                                 "tonfall": a.get("tonfall")} for a in u["agenten"]],
                    "letzte_einsaetze": [{"zeit": e["zeit"], "auftrag": e.get("auftrag"), "kosten_eur": e.get("kosten_eur")}
                                         for e in u["einsaetze"][:3]]}

        def aendern(agent, aenderungen, grund):
            k = {v.lower(): kk for kk, v in KUERZEL.items()}.get(str(agent).lower(), str(agent).lower())
            if isinstance(aenderungen, str):
                try:
                    aenderungen = json.loads(aenderungen)
                except ValueError:
                    raise ValueError("aenderungen muss ein Objekt sein")
            return self.speichern(k, aenderungen, grund, von="per Sprache/Chat")

        def zurueck(agent, version, grund=""):
            k = {v.lower(): kk for kk, v in KUERZEL.items()}.get(str(agent).lower(), str(agent).lower())
            return self.zuruecksetzen(k, version, grund, von="per Sprache/Chat")

        def grenze(betrag_eur=None):
            st = self.kostengrenze(betrag_eur)
            return {"kostengrenze_eur": st["kostengrenze_eur"], "kosten_monat_eur": round(self.kosten_monat(), 2)}

        def schalter(aktiv):
            return {"aktiv": self.schalten(bool(aktiv))["aktiv"]}

        agenten_enum = [KUERZEL[k] for k in REIHENFOLGE]
        return [
            Tool("stab_einsatz",
                 "Teilaufträge PARALLEL an Sachgebietsagenten des Stabes geben und ihre gewichteten Meldungen erhalten. "
                 "Ein Aufruf mit allen nötigen Teilaufträgen. Agenten: ZEIT (Kalender/Erinnerungen/Fristen), KOM "
                 "(Mail/iMessage/Kontakte), DIENST (Dienstkalender/Dienstmails), FIN (Beihilfe/Rechnungen/Steuer/"
                 "Verträge), AKTE (Archiv/Post/Ablage), AUFKL (Recherche/Wetter), LOG (Einkauf/Routen/Reisen), IMMO (Immobilien/Mieter/Darlehen/"
                 "Nebenkosten).",
                 "stab.einsatz", einsatz,
                 {"auftraege": {"type": "array", "description": "Je Agent ein Teilauftrag",
                                "items": {"type": "object", "properties": {
                                    "agent": S("Kürzel", enum=agenten_enum),
                                    "auftrag": S("Ziel und Rahmen, z. B. 'Termine Mo–So, Konflikte, Fristen'")},
                                    "required": ["agent", "auftrag"]}}},
                 ["auftraege"], label=lambda a: "Stab: " + ", ".join(str(x.get("agent")) for x in a.get("auftraege") or [])),
            Tool("stab_status", "Stab anzeigen: Agenten, Versionen, Persönlichkeit von JARVIS, Kosten, letzte Einsätze.",
                 "stab.lesen", status),
            Tool("stab_persona_aendern",
                 "Persona eines Agenten oder von JARVIS selbst ändern (neue Version, wird protokolliert). "
                 "JARVIS: aenderungen={'persoenlichkeit': {'grundton': butler|stabsoffizier|herzlich|sachlich, 'humor': "
                 "kein|dezent|trocken|viel, 'ausfuehrlichkeit': knapp|normal|ausfuehrlich, 'anrede_form': du|sie, "
                 "'zusatz': Text}}. Agenten: tonfall, ausfuehrlichkeit, zusatz, modell (haiku|sonnet|lokal), aktiv, "
                 "auftrag, darf, darf_nicht, werkzeuge.",
                 "stab.aendern", aendern,
                 {"agent": S("JARVIS oder Kürzel/Name des Agenten"),
                  "aenderungen": {"type": "object", "description": "Felder und neue Werte"},
                  "grund": S("Grund der Änderung (wird protokolliert)")},
                 ["agent", "aenderungen", "grund"],
                 label=lambda a: f"Persona {a.get('agent')} ändern ({', '.join((a.get('aenderungen') or {}).keys()) if isinstance(a.get('aenderungen'), dict) else ''}) – {a.get('grund', '')}"),
            Tool("stab_persona_zuruecksetzen", "Persona eines Agenten (oder JARVIS) auf eine frühere Version zurücksetzen.",
                 "stab.aendern", zurueck,
                 {"agent": S("JARVIS oder Kürzel"), "version": S("z. B. 1.0.0"), "grund": S("Grund")},
                 ["agent", "version"], label=lambda a: f"{a.get('agent')} auf Version {a.get('version')} zurücksetzen"),
            Tool("stab_kostengrenze",
                 "Monatliche Kostengrenze des Stabs setzen/erhöhen (betrag_eur) oder aufheben (betrag_eur weglassen "
                 "oder 0). Nur auf ausdrücklichen Befehl des Nutzers.",
                 "stab.steuern", grenze, {"betrag_eur": {"type": "number", "description": "Neue Grenze in Euro; 0 = aufheben"}},
                 [], label=lambda a: f"Kostengrenze Stab: {a.get('betrag_eur') or 'aufheben'}"),
            Tool("stab_schalten", "Den Stab ein- oder ausschalten (aus = JARVIS erledigt alles selbst).",
                 "stab.steuern", schalter, {"aktiv": {"type": "boolean", "description": "true = an"}}, ["aktiv"],
                 label=lambda a: f"Stab {'einschalten' if a.get('aktiv') else 'ausschalten'}"),
        ]


# ---------------------------------------------------------------- Abschnittsmarken im Lagevortrag
MARKE = re.compile(r"\[(SOFORT|TERMINE|WETTER|FRISTEN|POST|KENNTNIS)\][ \t]*\n?")


def ohne_marken(t: str) -> str:
    return MARKE.sub("", t or "")


class Markenfilter:
    """Trennt gestreamten Text in Text und Abschnittsmarken – auch wenn eine Marke über zwei Stücke verteilt ist."""
    def __init__(self):
        self.rest = ""

    def feed(self, stueck: str) -> list[tuple[str, str]]:
        self.rest += stueck or ""
        out = []
        while True:
            m = MARKE.search(self.rest)
            if m:
                out.append(("text", self.rest[:m.start()]))
                out.append(("marke", m.group(1)))
                self.rest = self.rest[m.end():]
                continue
            i = self.rest.rfind("[")
            if i != -1 and "]" not in self.rest[i:] and len(self.rest) - i < 12:
                out.append(("text", self.rest[:i]))
                self.rest = self.rest[i:]
            else:
                out.append(("text", self.rest))
                self.rest = ""
            break
        return [(a, w) for a, w in out if w]

    def ende(self) -> list[tuple[str, str]]:
        out, self.rest = ([("text", self.rest)] if self.rest else []), ""
        return out
