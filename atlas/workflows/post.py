"""Posteingang für Papierpost.

Jeder Scan im Genius-Scan-Ordner, der keine Kinder-Rechnung und kein Bescheid ist, gilt als Brief.
JARVIS liest ihn lokal (nichts geht in die Cloud), erkennt Absender, Betreff, Fristen und
Steuerrelevanz und schlägt Ordner und Dateinamen im DATENARCHIV vor. Abgelegt wird erst nach
Bestätigung (Karte im Dashboard oder im Chat). Bestätigt der Nutzer einen Absender mehrmals für
denselben Ordner, legt JARVIS ihn nach einem Monat selbst ab und meldet es. Wählt der Nutzer den Ordner einmal
ausdrücklich mit „künftig immer hier“ (Ordner-Browser auf der Briefkarte), gilt die Regel sofort: Briefe dieses
Absenders legt JARVIS ab dann selbst ab und meldet es."""
import hashlib
import os
import re
import shutil
import subprocess
import threading
import time
import uuid
from datetime import date, datetime, timedelta
from pathlib import Path

from atlas import hilfen, plattform
from atlas.paths import read_private_json, write_private_json
from atlas.tools import S, Tool, ToolError
from atlas.workflows import steuer as steuer_mod
from atlas.workflows.beihilfe_parser import BETRAG, betrag as lese_betrag, entsperren

ZUSTAND = "post.json"
D = r"(\d{1,2}\.\d{1,2}\.(?:\d{4}|\d{2}))(?!\d)"
MONATE = ["januar", "februar", "märz", "april", "mai", "juni", "juli", "august", "september", "oktober",
          "november", "dezember"]
D_LANG = r"(\d{1,2})\.\s*(" + "|".join(MONATE) + r")\s+(\d{4})"

# Bekannte Absendertypen → Schlüsselwörter für den Ordnervorschlag ohne Modell
ORDNER_HINWEISE = [
    (r"finanzamt|steuerbescheid|einkommensteuer", "01_Privat/03_Finanzen/01_Steuererklärungen"),
    (r"rentenversicherung", "01_Privat/04_Versicherungen/00_Deutsche Rentenversicherung"),
    (r"haftpflicht", "01_Privat/04_Versicherungen/01_Privathaftpflicht"),
    (r"hausrat", "01_Privat/04_Versicherungen/05_Hausrat"),
    (r"kfz-versicherung|kraftfahrtversicherung|kfz-haftpflicht", "01_Privat/04_Versicherungen/06_Kfz-Versicherung"),
    (r"\badac\b", "01_Privat/04_Versicherungen/14_ADAC"),
    (r"rechtsschutz", "01_Privat/04_Versicherungen/09_Rechtsschutz"),
    (r"unfallversicherung", "01_Privat/04_Versicherungen/08_Unfall"),
    (r"berufsunfähigkeit", "01_Privat/04_Versicherungen/03_Berufsunfähigkeit"),
    (r"lebensversicherung", "01_Privat/04_Versicherungen/04_Lebensversicherung"),
    (r"kündigungsbestätigung|vertragsbestätigung|ihr vertrag", "01_Privat/05_Verträge/01_laufend"),
    (r"zulassungsstelle|fahrzeugschein|hauptuntersuchung|\btüv\b|dekra", "01_Privat/01_Mobilität/01_Fahrzeuge"),
    (r"kontoauszug|depot|bank", "01_Privat/03_Finanzen/03_Konten"),
    (r"darlehen|kredit", "01_Privat/03_Finanzen/02_Kredite"),
    (r"tierarzt", "01_Privat/06_Hunde/02_Tierarzt"),
]

FRIST_WORTE = (r"frist|einreich|zahl|überweis|zurück|vorleg|meld|widerspruch|einspruch|antwort|nachreich|"
               r"stellungnahme|rücksend|begleich|bestätig|anmeld|kündig|termin|spätestens|bitte")


def _d(s: str) -> date | None:
    m = re.match(r"(\d{1,2})\.(\d{1,2})\.(\d{2,4})", s or "")
    if not m:
        return None
    t, mo, j = map(int, m.groups())
    j = j + 2000 if j < 100 else j
    try:
        return date(j, mo, t)
    except ValueError:
        return None


def _norm(s: str) -> str:
    return re.sub(r"[^a-z0-9äöüß]", "", (s or "").lower())


def _absender_kurz(s: str) -> str:
    """„Finanzamt X · Postfach 12 · 06749 Ort“ → „Finanzamt X“."""
    s = re.split(r"\s*(?:[·•|,;]|\s[-–]\s|postfach|\b\d{5}\b|tel\.?|telefon|www\.)", s or "", maxsplit=1, flags=re.I)[0]
    return re.sub(r"\s+", " ", s).strip(" .-")[:50]


def _monate_plus(d: date, n: int) -> date:
    m = d.month - 1 + n
    j, m = d.year + m // 12, m % 12 + 1
    import calendar
    return date(j, m, min(d.day, calendar.monthrange(j, m)[1]))



def _eigener_vorname() -> str:
    from atlas.paths import display_name
    try:
        return display_name().lower()
    except Exception:
        return ""

class Post:
    def __init__(self, core):
        self.c = core
        self.cfg = core.cfg.get("post") or {}
        self.aktiv = bool(self.cfg.get("aktiv", True))
        self.lock = threading.Lock()
        self._cache: dict[str, dict] = {}
        self._ordner: tuple[float, list] = (0.0, [])
        self._abgleich_laeuft = False
        self._aufr = {"laeuft": False, "gesamt": 0, "fertig": 0, "datei": ""}

    # ------------------------------------------------------------ Zustand
    def zustand(self) -> dict:
        z = read_private_json(ZUSTAND, {})
        z.setdefault("offen", {}); z.setdefault("regeln", {}); z.setdefault("verlauf", [])
        return z

    def speichern(self, z: dict) -> None:
        z["verlauf"] = z["verlauf"][-80:]
        write_private_json(ZUSTAND, z)

    @property
    def archiv(self) -> Path | None:
        return self.c.archiv.archive if self.c.archiv else None

    def ordner(self) -> list[str]:
        import time
        ts, liste = self._ordner
        if time.time() - ts > 600 or not liste:
            liste = hilfen.ordnerliste(self.archiv, 3)
            self._ordner = (time.time(), liste)
        return liste

    # ------------------------------------------------------------ Ordner-Browser (DATENARCHIV)
    def _innen(self, rel: str) -> Path:
        a = self.archiv
        if not a:
            raise ToolError("DATENARCHIV nicht gefunden")
        rel = (rel or "").strip().strip("/")
        p = (a / rel).resolve() if rel else a.resolve()
        if p != a.resolve() and not str(p).startswith(str(a.resolve()) + "/"):
            raise ToolError("Ordner liegt nicht im DATENARCHIV")
        if not p.is_dir():
            raise ToolError(f"Ordner „{rel}“ gibt es nicht")
        if rel and hilfen.ausgeschlossen(rel):
            raise ToolError("Das ist JARVIS' interner Datenordner bzw. in config.yaml ausgeschlossen")
        return p

    def baum(self, rel: str = "") -> dict:
        """Unterordner eines Ordners im DATENARCHIV – zum Durchklicken auf der Briefkarte."""
        p = self._innen(rel)
        rel = str(p.relative_to(self.archiv.resolve())) if p != self.archiv.resolve() else ""
        kinder = []
        try:
            for k in sorted(p.iterdir(), key=lambda x: x.name.lower()):
                if not k.is_dir() or k.name.startswith(".") or k.name.endswith((".app", ".pkg", ".photoslibrary")):
                    continue
                r = f"{rel}/{k.name}" if rel else k.name
                if hilfen.ausgeschlossen(r):
                    continue
                try:
                    hat = any(x.is_dir() and not x.name.startswith(".") for x in k.iterdir())
                except OSError:
                    hat = False
                kinder.append({"name": k.name, "pfad": r, "unterordner": hat})
        except OSError as e:
            raise ToolError(f"Ordner nicht lesbar: {e}")
        teile = rel.split("/") if rel else []
        return {"pfad": rel, "eltern": "/".join(teile[:-1]) if teile else None,
                "pfadteile": [{"name": t, "pfad": "/".join(teile[:i + 1])} for i, t in enumerate(teile)],
                "ordner": kinder, "archiv": self.archiv.name}

    def ordner_anlegen(self, rel: str, name: str) -> dict:
        name = hilfen.dateiname(name or "", 80).strip(" .")
        if not name:
            raise ToolError("Bitte einen Ordnernamen angeben")
        p = self._innen(rel) / name
        if p.exists():
            raise ToolError(f"„{name}“ gibt es dort schon")
        p.mkdir()
        self._ordner = (0.0, [])
        r = str(p.relative_to(self.archiv.resolve()))
        self.c.audit.log("post", aktion="ordner_angelegt", ordner=r)
        return {"ok": True, "pfad": r}

    def regeln(self) -> list[dict]:
        z = self.zustand()
        return sorted(({"schluessel": k, **v} for k, v in z["regeln"].items()), key=lambda r: (r.get("absender") or "").lower())

    def regel_loeschen(self, schluessel: str) -> dict:
        with self.lock:
            z = self.zustand()
            r = z["regeln"].pop(schluessel, None)
            self.speichern(z)
        if not r:
            raise ToolError("Regel nicht gefunden")
        return {"ok": True, "text": f"Regel für {r.get('absender') or '?'} entfernt"}

    # ------------------------------------------------------------ Auswertung (lokal)
    def analysieren(self, text: str, name: str = "", schnell: bool = False) -> dict:
        schluessel = hashlib.sha1((text or name).encode("utf-8", "ignore")).hexdigest()
        if schluessel in self._cache and (schnell or self._cache[schluessel].get("voll")):
            return self._cache[schluessel]
        t = entsperren(text or "")
        kopf = t[:1500]
        a = {"absender": "", "betreff": "", "datum": None, "art": "", "fristen": [], "steuer": None,
             "betrag": None, "ordner": "", "name": "", "ordner_grund": "", "voll": not schnell}

        # Briefdatum: „Leipzig, 12.10.2026“, „Datum: …“, „den …“, sonst erstes plausibles Datum oben
        heute = date.today()
        kand = re.search(r"(?:datum|den|vom)\s*:?\s*" + D, kopf, re.I) or \
            re.search(r"[A-ZÄÖÜ][a-zäöüß\-]+,\s*(?:den\s+)?" + D, kopf)
        bd = _d(kand.group(1)) if kand else None
        if not bd:
            m = re.search(D_LANG, kopf, re.I)
            if m:
                bd = date(int(m.group(3)), MONATE.index(m.group(2).lower()) + 1, int(m.group(1)))
        if not bd:
            for m in re.finditer(D, kopf):
                d = _d(m.group(1))
                if d and heute - timedelta(days=400) <= d <= heute + timedelta(days=2):
                    bd = d
                    break
        a["datum"] = bd

        # Absender, Betreff, Art: lokales Modell, geprüft gegen den Text
        if not schnell:
            j = hilfen.lokal_json(
                self.c.providers.get("lokal"),
                "Du liest private Briefe und antwortest nur mit JSON. Erfinde nichts.",
                'Antworte nur mit JSON: {"absender": "Organisation oder Person, kurz (z. B. Finanzamt '
                'Bitterfeld-Wolfen, HUK-COBURG, Stadt Leipzig)", "betreff": "worum es geht, 2-6 Wörter", '
                '"art": "Behörde|Versicherung|Bank|Vertrag|Rechnung|Kita/Schule|Vermietung|Arzt|Arbeitgeber|Sonstiges"}'
                "\n\nBrief:\n" + t[:3500], 200) or {}
            abs_ = str(j.get("absender") or "").strip()
            if abs_ and _norm(abs_.split()[0])[:5] in _norm(t):
                a["absender"] = _absender_kurz(abs_)
            a["betreff"] = str(j.get("betreff") or "").strip()[:60]
            a["art"] = str(j.get("art") or "").strip()[:30]
        if not a["absender"]:
            m = re.search(r"^.*\b(finanzamt|stadt|landkreis|gemeinde|amt|versicherung|bank|sparkasse|gmbh|ag|e\.\s?v\.|kg|"
                          r"bundesamt|familienkasse|jobcenter|krankenkasse|kita|schule|praxis)\b.*$", kopf, re.I | re.M)
            a["absender"] = _absender_kurz(m.group(0)) if m else ""
        if not a["betreff"]:
            m = re.search(r"^(?:betreff|betr\.|bezug)\s*:?\s*(.+)$", t, re.I | re.M)
            a["betreff"] = m.group(1).strip()[:60] if m else ""

        a["fristen"] = self._fristen(t, bd)
        a["steuer"] = steuer_mod.erkennen(t)
        m = re.search(rf"(?:betrag|summe|gesamt|zu zahlen|rechnungsbetrag|nachzahlung|erstattung|höhe von)[^\n]{{0,40}}?({BETRAG})", t, re.I)
        a["betrag"] = lese_betrag(m.group(1)) if m else None

        # Ordner und Dateiname
        a["ordner"], a["ordner_grund"] = self._ordner_vorschlag(t, a, schnell)
        datum = bd or heute
        teile = [f"{datum:%Y_%m_%d}", a["absender"] or Path(name).stem, a["betreff"]]
        a["name"] = hilfen.dateiname(" - ".join(x for x in teile if x), 110)
        self._cache[schluessel] = a
        return a

    def _fristen(self, t: str, briefdatum: date | None) -> list[dict]:
        heute, out = date.today(), []

        def add(d: date | None, was: str, art: str):
            if d and heute <= d <= heute + timedelta(days=800) and not any(f["datum"] == d.isoformat() and f["art"] == art for f in out):
                out.append({"datum": d.isoformat(), "was": re.sub(r"\s+", " ", was).strip()[:90], "art": art})

        flach = re.sub(r"[ \t]+", " ", t)
        for m in re.finditer(r"(?:bis\s+(?:zum|spätestens)?|spätestens\s+(?:am|bis)?|bis\s+einschließlich|frist[^.\n]{0,30}?)\s*" + D,
                             flach, re.I):
            vor = flach[max(0, m.start() - 140):m.start()]
            if re.search(FRIST_WORTE, vor + m.group(0), re.I):
                satz = flach[max(0, m.start() - 90):m.end()].split("\n")[-1]
                art = "Zahlung" if re.search(r"zahl|überweis|begleich", vor, re.I) else "Frist"
                add(_d(m.group(1)), satz, art)
        if briefdatum:
            m = re.search(r"innerhalb\s+(?:von\s+)?(\d{1,2}|zwei|drei|vier)\s+(tag|woche|monat)", flach, re.I)
            if m and re.search(FRIST_WORTE, flach[max(0, m.start() - 120):m.end() + 80], re.I) \
                    and not re.search(r"bekanntgabe|rechtsbehelf", flach[max(0, m.start() - 120):m.end() + 80], re.I):
                n = {"zwei": 2, "drei": 3, "vier": 4}.get(m.group(1).lower(), None) or int(m.group(1))
                e = m.group(2).lower()
                d = briefdatum + (timedelta(days=n) if e == "tag" else timedelta(weeks=n) if e == "woche" else timedelta())
                if e == "monat":
                    d = _monate_plus(briefdatum, n)
                add(d, flach[max(0, m.start() - 60):m.end() + 30], "Frist")
            # Bescheide: Einspruch/Widerspruch binnen eines Monats nach Bekanntgabe (3 Tage Postlauf)
            if re.search(r"\bbescheid\b", flach, re.I) and (re.search(r"(einspruch|widerspruch)[^.]{0,80}innerhalb\s+eines\s+monats", flach, re.I)
                                                       or re.search(r"innerhalb\s+eines\s+monats[^.]{0,80}(einspruch|widerspruch)", flach, re.I)):
                add(_monate_plus(briefdatum + timedelta(days=3), 1), "Einspruch/Widerspruch gegen den Bescheid", "Einspruchsfrist")
        # Verträge, Ausweise, TÜV
        for m in re.finditer(r"(vertragsende|laufzeit\s+bis|endet\s+am|kündbar\s+zum|kündigungsfrist[^.\n]{0,40}?zum|"
                             r"spätestens\s+zum)\s*:?\s*" + D, flach, re.I):
            add(_d(m.group(2)), m.group(0), "Vertrag")
        for m in re.finditer(r"(gültig\s+bis|ablaufdatum)\s*:?\s*" + D, flach, re.I):
            add(_d(m.group(2)), m.group(0), "Ausweis")
        for m in re.finditer(r"(hauptuntersuchung|nächste\s+hu|tüv)[^.\n]{0,40}?(\d{1,2})[./](\d{4})", flach, re.I):
            mo, j = int(m.group(2)), int(m.group(3))
            if 1 <= mo <= 12:
                add(date(j + (mo == 12), mo % 12 + 1, 1) - timedelta(days=1), m.group(0), "TÜV")
        return out

    def _ordner_vorschlag(self, t: str, a: dict, schnell: bool) -> tuple[str, str]:
        z = self.zustand()
        alle = self.ordner()
        regel = z["regeln"].get(_norm(a["absender"])) if a["absender"] else None
        if regel and regel.get("ordner") in alle:
            return self._jahr(regel["ordner"], a), f"wie zuletzt bei {a['absender']}"
        low = t.lower()
        for rx, ordner in ORDNER_HINWEISE:
            if re.search(rx, low) and ordner in alle:
                return self._jahr(ordner, a), "erkannt am Inhalt"
        # Namen der Familie → persönliche Dokumente
        for o in alle:
            if o.startswith("01_Privat/00_Dokumente/"):
                vor = o.split("_", 2)[-1].split()[0].lower()
                if vor and re.search(rf"\b{re.escape(vor)}\b", low) and vor != _eigener_vorname():
                    return o, "Name im Brief"
        if not schnell and alle:
            nummeriert = "\n".join(f"{i + 1}. {o}" for i, o in enumerate(alle))
            j = hilfen.lokal_json(
                self.c.providers.get("lokal"),
                "Du ordnest private Briefe in eine Ordnerstruktur ein. Antworte nur mit JSON.",
                f"Brief von {a['absender'] or 'unbekannt'} zum Thema „{a['betreff'] or '?'}“ ({a['art'] or '?'}).\n"
                f"Welcher Ordner passt am besten? Antworte nur mit {{\"nr\": Nummer}}.\n\n{nummeriert}\n\n"
                f"Briefanfang:\n{t[:1200]}", 40) or {}
            try:
                nr = int(j.get("nr"))
                if 1 <= nr <= len(alle):
                    return self._jahr(alle[nr - 1], a), "Vorschlag des lokalen Modells"
            except (TypeError, ValueError):
                pass
        return ("00_Durchlauf" if "00_Durchlauf" in alle else ""), "kein passender Ordner erkannt"

    def _jahr(self, ordner: str, a: dict) -> str:
        """Steuererklärungen u. Ä. sind nach Jahren geordnet: passenden Jahresordner nehmen."""
        a_ = self.archiv
        if not a_:
            return ordner
        jahr = (a.get("datum") or date.today()).year
        if "Steuer" in ordner and re.search(r"bescheid|erklärung|festsetzung", (a.get("betreff") or "").lower()):
            jahr -= 1                                    # Bescheid betrifft meist das Vorjahr
        for j in (jahr, jahr - 1):
            if (a_ / ordner / str(j)).is_dir():
                return f"{ordner}/{j}"
        return ordner

    # ------------------------------------------------------------ Brief verarbeiten
    def brief(self, f: Path, text: str) -> str | None:
        if not self.aktiv:
            return None
        a = self.analysieren(text, f.name)
        if not text.strip():
            a["betreff"] = a["betreff"] or "Scan ohne erkennbaren Text"
        pid = uuid.uuid4().hex[:8]
        eintrag = self._eintrag(f, a, pid)
        # Fristen sofort ins Radar (mit Erinnerung) – unabhängig von der Ablage
        fr_texte = []
        for fr in a["fristen"]:
            try:
                titel = f"{a['absender'] or 'Brief'}: {a['betreff'] or fr['was'][:40]}"
                self.c.fristen.eintragen(titel, fr["datum"], fr["art"], notiz=fr["was"],
                                         quelle=f"Brief {f.name}")
                fr_texte.append(f"{fr['art']} bis {date.fromisoformat(fr['datum']):%d.%m.%Y}")
            except Exception as e:
                self.c.audit.log("fehler", bereich="post_frist", text=str(e)[:200])
        vertrag_txt = ""
        try:
            vertrag_txt = self.c.vertraege.aus_brief(a["absender"], text, f"Brief {f.name}")
        except Exception as e:
            self.c.audit.log("fehler", bereich="post_vertrag", text=str(e)[:200])
        wer = a["absender"] or "unbekanntem Absender"
        was = f" – {a['betreff']}" if a["betreff"] else ""
        frist_txt = (" " + "; ".join(fr_texte) + " (Erinnerung angelegt).") if fr_texte else ""
        steuer_txt = (f" Steuerrelevant: {a['steuer']}." if a["steuer"] else "") + (f" {vertrag_txt}" if vertrag_txt else "")

        # Selbst ablegen, wenn der Absender schon mehrfach so bestätigt wurde (frühestens nach 30 Tagen)
        z = self.zustand()
        regel = z["regeln"].get(_norm(a["absender"])) if a["absender"] else None
        if (regel and regel.get("ordner") and a["ordner"].startswith(regel["ordner"])
                and (regel.get("fest") or (regel.get("n", 0) >= int(self.cfg.get("auto_ab_bestaetigungen", 3))
                     and (date.today() - date.fromisoformat(regel["erste"])).days >= int(self.cfg.get("auto_nach_tagen", 30))))):
            with self.lock:
                z["offen"][pid] = eintrag
                self.speichern(z)
            r = self.ablegen(pid, automatisch=True)
            bericht = (f"Brief von {wer}{was} automatisch abgelegt: {r['abgelegt']}.{frist_txt}{steuer_txt}")
            self.c.beihilfe.melden(bericht)
            return bericht
        with self.lock:
            z = self.zustand()
            z["offen"][pid] = eintrag
            self.speichern(z)
        self.c.broadcast({"type": "post", **self._karte(eintrag)})
        bericht = (f"Neuer Brief von {wer}{was}.{frist_txt}{steuer_txt} Vorschlag: ablegen in "
                   f"„{a['ordner'] or '?'}“ als „{a['name']}“ – bitte im Dashboard bestätigen.")
        self.c.audit.log("post", aktion="erkannt", absender=a["absender"], fristen=len(a["fristen"]))
        try:
            self.c.proaktiv.hint(bericht)
        except Exception:
            pass
        return bericht

    @staticmethod
    def _eintrag(f: Path, a: dict, pid: str) -> dict:
        e = {"id": pid, "datei": str(f), "original": f.name, "absender": a["absender"],
             "betreff": a["betreff"], "datum": str(a["datum"] or ""), "fristen": a["fristen"],
             "steuer": a["steuer"], "betrag": a["betrag"], "ordner": a["ordner"],
             "ordner_grund": a["ordner_grund"], "name": a["name"], "art": a["art"],
             "erkannt": datetime.now().isoformat(timespec="minutes")}
        try:                                           # zum Wiederfinden, falls du die Datei im Finder verschiebst
            e["groesse"] = f.stat().st_size
            e["sha1"] = hashlib.sha1(f.read_bytes()).hexdigest()
        except OSError:
            pass
        return e

    @staticmethod
    def _karte(e: dict) -> dict:
        return {"id": e["id"], "absender": e["absender"], "betreff": e["betreff"], "datum": e["datum"],
                "fristen": e["fristen"], "steuer": e["steuer"], "ordner": e["ordner"],
                "ordner_grund": e["ordner_grund"], "name": e["name"], "original": e["original"]}

    # ------------------------------------------------------------ Ablage / Lernen
    def lernen(self, absender: str, ordner: str, fest: bool = False) -> None:
        """fest=True: ausdrücklich „künftig immer hier“ – gilt ab sofort, ohne Wartezeit."""
        if not absender or not ordner:
            return
        with self.lock:
            z = self.zustand()
            r = z["regeln"].get(_norm(absender))
            basis = re.sub(r"/\d{4}$", "", ordner)          # Jahresordner nicht mitlernen
            if r and r.get("ordner") == basis:
                r["n"] = r.get("n", 0) + 1
                r["fest"] = bool(r.get("fest") or fest)
            else:
                z["regeln"][_norm(absender)] = {"absender": absender, "ordner": basis, "n": 1,
                                                "erste": date.today().isoformat(), "fest": bool(fest)}
            self.speichern(z)

    def ablegen(self, brief_id: str, ordner: str = "", dateiname: str = "", automatisch: bool = False,
                merken: bool = False) -> dict:
        with self.lock:
            z = self.zustand()
            e = z["offen"].get(brief_id)
        if not e:
            raise ToolError("Brief nicht (mehr) in der Ablage-Warteschlange")
        a = self.archiv
        if not a:
            raise ToolError("DATENARCHIV nicht gefunden")
        ordner = (ordner or e["ordner"]).strip("/")
        if not ordner:
            raise ToolError("Kein Ordner angegeben")
        ziel_ordner = (a / ordner).resolve()
        if not str(ziel_ordner).startswith(str(a.resolve())) or not ziel_ordner.is_dir():
            raise ToolError(f"Ordner „{ordner}“ gibt es im DATENARCHIV nicht")
        quelle = Path(e["datei"])
        if not quelle.exists():
            with self.lock:
                z = self.zustand(); z["offen"].pop(brief_id, None); self.speichern(z)
            raise ToolError("Die Scan-Datei ist nicht mehr im Scan-Ordner (verschoben oder gelöscht)")
        name = hilfen.dateiname(dateiname or e["name"], 110) + quelle.suffix.lower()
        ziel = hilfen.frei(ziel_ordner / name)
        shutil.move(str(quelle), str(ziel))
        rel = str(ziel.relative_to(a))
        if not automatisch:
            self.lernen(e["absender"], ordner, fest=merken)
        steuer_txt = ""
        if e.get("steuer") and e["steuer"] != "Finanzamt & Bescheide":
            try:
                jahr = int(e["datum"][:4]) if e.get("datum") else date.today().year
                self.c.steuer.vormerken(rel, e["steuer"], jahr, str(e.get("betrag") or ""), quelle="post")
                steuer_txt = f"in Steuer-Sammelmappe {jahr} ({e['steuer']})"
            except Exception as ex:
                self.c.audit.log("fehler", bereich="post_steuer", text=str(ex)[:200])
        with self.lock:
            z = self.zustand()
            z["offen"].pop(brief_id, None)
            z["verlauf"].append({"zeit": datetime.now().isoformat(timespec="minutes"), "absender": e["absender"],
                                 "ziel": rel, "auto": automatisch})
            self.speichern(z)
        self.c.audit.log("post", aktion="abgelegt", ziel=rel, automatisch=automatisch)
        self.c.broadcast({"type": "post_erledigt", "id": brief_id})
        return {"abgelegt": rel, **({"steuer": steuer_txt} if steuer_txt else {}),
                **({"regel": f"Briefe von {e['absender']} lege ich künftig selbst hier ab."} if merken and e.get("absender") else {})}

    def verwerfen(self, brief_id: str) -> dict:
        with self.lock:
            z = self.zustand()
            e = z["offen"].pop(brief_id, None)
            if e:
                z.setdefault("beiseite", {})[brief_id] = e
            self.speichern(z)
        if not e:
            raise ToolError("Brief nicht gefunden")
        self.c.broadcast({"type": "post_erledigt", "id": brief_id})
        return {"verworfen": e["original"], "hinweis": "Die Datei bleibt im Scan-Ordner."}

    def offen(self) -> dict:
        z = self.zustand()
        # Briefe, deren Datei inzwischen weg ist, still entfernen
        if any(not Path(e["datei"]).exists() for e in z["offen"].values()):
            self.finder_abgleich()
            z = self.zustand()
        return {"offen": [self._karte(e) for e in z["offen"].values()],
                "hinweis": "Ablegen mit 'post_ablegen' (id, optional anderer Ordner/Dateiname)."}

    # ------------------------------------------------------------ Im Finder verschoben → lernen
    def finder_abgleich(self) -> None:
        """Briefe, deren Scan nicht mehr im Scan-Ordner liegt: im DATENARCHIV suchen. Liegt er dort, war das
        deine Ablage – JARVIS merkt sich den Ordner für den Absender wie bei einem Klick auf „Ablegen“."""
        if self._abgleich_laeuft:
            return
        z = self.zustand()
        weg = {k: e for teil in ("offen", "beiseite") for k, e in (z.get(teil) or {}).items()
               if not Path(e["datei"]).exists()}
        if not weg:
            return
        self._abgleich_laeuft = True
        threading.Thread(target=self._abgleich_job, args=(weg,), daemon=True, name="post-finder").start()

    def _abgleich_job(self, weg: dict) -> None:
        gelernt, nicht = [], 0
        try:
            for k, e in weg.items():
                try:
                    p = self.wiederfinden(e)
                except Exception as ex:
                    self.c.audit.log("fehler", bereich="post_finder", text=str(ex)[:200])
                    p = None
                rel = ""
                if p and self.archiv:
                    rel = str(p.parent.relative_to(self.archiv))
                    if e.get("absender"):
                        self.lernen(e["absender"], rel)
                    gelernt.append((e, rel, p.name))
                else:
                    nicht += 1
                with self.lock:
                    z = self.zustand()
                    z["offen"].pop(k, None)
                    (z.get("beiseite") or {}).pop(k, None)
                    if rel:
                        z["verlauf"].append({"zeit": datetime.now().isoformat(timespec="minutes"),
                                             "absender": e.get("absender"), "ziel": f"{rel}/{p.name}", "finder": True})
                    self.speichern(z)
                self.c.broadcast({"type": "post_erledigt", "id": k})
            if gelernt:
                self.c.audit.log("post", aktion="finder_gelernt", anzahl=len(gelernt))
                zeilen = "; ".join(f"{e.get('absender') or e['original']} → {rel}" for e, rel, _ in gelernt[:6])
                mehr = f" und {len(gelernt) - 6} weitere" if len(gelernt) > 6 else ""
                text = (f"Gesehen: Du hast {len(gelernt)} Scan{'s' if len(gelernt) != 1 else ''} im Finder abgelegt "
                        f"({zeilen}{mehr}). Gemerkt – so schlage ich es künftig vor.")
                try:
                    self.c.proaktiv.hint(text)
                except Exception:
                    self.c.broadcast({"type": "hinweis", "text": text})
        finally:
            self._abgleich_laeuft = False

    def wiederfinden(self, e: dict) -> Path | None:
        """Datei im DATENARCHIV suchen: gleicher Name oder gleiche Größe, bei bekannter Prüfsumme auch gleicher Inhalt.
        Mac: Spotlight (schnell, auch iCloud), sonst Ordner durchgehen."""
        a = self.archiv
        if not a or not a.exists():
            return None
        name, groesse, sha = e.get("original", ""), e.get("groesse"), e.get("sha1")

        def passt(p: Path) -> bool:
            try:
                if not p.is_file() or hilfen.ausgeschlossen(str(p.relative_to(a))):
                    return False
                if groesse and p.stat().st_size != groesse:
                    return False
                return not sha or hashlib.sha1(p.read_bytes()).hexdigest() == sha
            except (OSError, ValueError):
                return False
        kand: list[Path] = []
        if plattform.MAC:
            for frage in ([f"kMDItemFSName == '{name.replace(chr(39), chr(92) + chr(39))}'"] +
                          ([f"kMDItemFSSize == {groesse}"] if groesse else [])):
                try:
                    out = subprocess.run(["mdfind", "-onlyin", str(a), frage], capture_output=True, text=True,
                                         timeout=30).stdout
                except (OSError, subprocess.SubprocessError):
                    out = ""
                kand = [Path(x) for x in out.splitlines() if x.strip()]
                treffer = next((p for p in kand if passt(p)), None)
                if treffer:
                    return treffer
        ende = time.time() + 90                         # ohne Spotlight: Ordner durchgehen (max. 90 s)
        for wurzel, ordner, dateien in os.walk(a):
            ordner[:] = [o for o in ordner if not o.startswith(".")]
            for d in dateien:
                if d == name or (groesse and Path(d).suffix.lower() == Path(name).suffix.lower()):
                    p = Path(wurzel) / d
                    if (d == name or (groesse and p.stat().st_size == groesse)) and passt(p):
                        return p
            if time.time() > ende:
                break
        return None

    # ------------------------------------------------------------ Scan-Ordner aufräumen („Ablage lernen“)
    def scan_ordner(self) -> Path | None:
        b = getattr(self.c, "beihilfe", None)
        return b.eingang() if b else None

    def aufraeumen(self) -> dict:
        """Alle Scans im Scan-Ordner in die Ablage-Warteschlange holen (auch früher „nicht abgelegte“),
        damit du sie der Reihe nach zuordnen kannst. Läuft im Hintergrund, Fortschritt per Ereignis."""
        if not self.aktiv:
            raise ToolError("Der Posteingang ist ausgeschaltet (post.aktiv).")
        ein = self.scan_ordner()
        if not ein:
            raise ToolError("Den Genius-Scan-Ordner finde ich nicht.")
        if not self._aufr["laeuft"]:
            self.finder_abgleich()
            z = self.zustand()
            schon = {e["datei"] for e in z["offen"].values()}
            beiseite = {e["datei"]: k for k, e in (z.get("beiseite") or {}).items()}
            from atlas.workflows.beihilfe import DATEITYPEN, RE_RECHNUNG
            neu = [f for f in sorted(ein.rglob("*"), key=lambda p: p.name)
                   if f.is_file() and f.suffix.lower() in DATEITYPEN and not f.name.startswith(".")
                   and not RE_RECHNUNG.match(f.name) and str(f) not in schon]
            with self.lock:                              # „nicht abgelegte“ wieder vorlegen (ohne neu zu lesen)
                z = self.zustand()
                for f in list(neu):
                    k = beiseite.get(str(f))
                    if k and k in z.get("beiseite", {}):
                        z["offen"][k] = z["beiseite"].pop(k)
                        neu.remove(f)
                self.speichern(z)
            self._aufr.update(laeuft=bool(neu), gesamt=len(neu), fertig=0, datei="")
            if neu:
                threading.Thread(target=self._aufraeumen_job, args=(neu,), daemon=True, name="post-aufraeumen").start()
        return self.aufraeumen_stand()

    def aufraeumen_stand(self) -> dict:
        return {**self._aufr, "offen": len(self.zustand()["offen"])}

    def _aufraeumen_job(self, dateien: list[Path]) -> None:
        from atlas.archiv.extract import extract
        from atlas.archiv.indexer import aus_icloud_laden
        try:
            for f in dateien:
                self._aufr["datei"] = f.name
                self.c.broadcast({"type": "post_aufraeumen", **self.aufraeumen_stand()})
                try:
                    aus_icloud_laden(f, 60)
                    try:
                        text = "\n".join(t for _, t in extract(f, ocr=True))
                    except Exception:
                        text = ""
                    a = self.analysieren(text, f.name)
                    if not text.strip():
                        a["betreff"] = a["betreff"] or "Scan ohne erkennbaren Text"
                    a["fristen"] = []                    # Fristen standen beim ersten Erkennen schon im Radar
                    pid = uuid.uuid4().hex[:8]
                    e = self._eintrag(f, a, pid)
                    e["nachgeholt"] = True
                    with self.lock:
                        z = self.zustand()
                        z["offen"][pid] = e
                        self.speichern(z)
                except Exception as ex:
                    self.c.audit.log("fehler", bereich="post_aufraeumen", datei=f.name, text=str(ex)[:200])
                self._aufr["fertig"] += 1
        finally:
            self._aufr.update(laeuft=False, datei="")
            self.c.broadcast({"type": "post_aufraeumen", **self.aufraeumen_stand()})

    def papierkorb(self, brief_id: str) -> dict:
        """Klick „Papierkorb“ = Bestätigung: Scan aus dem Scan-Ordner in den Papierkorb (wiederherstellbar)."""
        with self.lock:
            z = self.zustand()
            e = z["offen"].get(brief_id)
        if not e:
            raise ToolError("Brief nicht (mehr) in der Ablage-Warteschlange")
        f = Path(e["datei"])
        if f.exists():
            plattform.papierkorb(f)
        with self.lock:
            z = self.zustand()
            z["offen"].pop(brief_id, None)
            self.speichern(z)
        self.c.audit.log("post", aktion="papierkorb", datei=e["original"])
        self.c.broadcast({"type": "post_erledigt", "id": brief_id})
        return {"papierkorb": e["original"]}

    def datei(self, brief_id: str) -> Path:
        z = self.zustand()
        e = z["offen"].get(brief_id) or (z.get("beiseite") or {}).get(brief_id)
        if not e or not Path(e["datei"]).exists():
            raise ToolError("Scan nicht gefunden")
        return Path(e["datei"])

    def briefing_zeile(self) -> str:
        o = self.offen()["offen"]
        if not o:
            return ""
        wer = ", ".join(sorted({e["absender"] or "?" for e in o})[:3])
        return f"Post: {len(o)} Brief{'e' if len(o) != 1 else ''} warte{'n' if len(o) != 1 else 't'} auf Ablage ({wer})."


def tools(core) -> list[Tool]:
    p = core.post
    return [
        Tool("post_offen", "Gescannte Briefe, die noch auf Ablage warten, mit Ordner- und Namensvorschlag.",
             "post.lesen", p.offen),
        Tool("post_ablegen",
             "Einen gescannten Brief im DATENARCHIV ablegen – mit dem Vorschlag oder einem anderen Ordner/Namen.",
             "post.ablegen", lambda brief_id, ordner="", dateiname="": p.ablegen(brief_id, ordner, dateiname),
             {"brief_id": S("id aus post_offen"), "ordner": S("anderer Ordner relativ zum DATENARCHIV, optional"),
              "dateiname": S("anderer Dateiname ohne Endung, optional")}, ["brief_id"],
             label=lambda a: "Brief ablegen" + (f" in „{a['ordner']}“" if a.get("ordner") else " wie vorgeschlagen")),
        Tool("post_verwerfen", "Ablagevorschlag eines Briefs verwerfen (Datei bleibt im Scan-Ordner).",
             "post.ablegen", p.verwerfen, {"brief_id": S("id aus post_offen")}, ["brief_id"],
             label=lambda a: "Ablagevorschlag verwerfen"),
        Tool("post_aufraeumen",
             "Scan-Ordner aufräumen: alle noch darin liegenden Scans (auch früher nicht abgelegte) in die "
             "Ablage-Warteschlange holen. Danach im Dashboard über „Ablage lernen“ der Reihe nach zuordnen.",
             "post.lesen", lambda: p.aufraeumen(), label=lambda a: "Scan-Ordner aufräumen"),
    ]
