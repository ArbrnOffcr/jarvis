"""Aufmerksamkeits-Router – gutes Timing statt Dauerbeschallung.

Jede Meldung (Hinweis, iMessage, Mail-Wache, HESTIA …) bekommt eine Zustellung:
- „sofort“: wie bisher (Dashboard, Telegram, macOS-Mitteilung)
- „stapel“: still gesammelt; im Dashboard nur ein Zähler. Ausgeliefert wird gebündelt im
  Entscheidungsstapel (Standard 12:30 und 18:00), sobald Ruhe/Fokus endet, und im Morgenbriefing.
Ruhezeiten: 22–7 Uhr, Samstag ab 14 Uhr, Sonntag, Kalenderblöcke „Familie“.
Fokus: Kalendertermine „Fokus“/„Konzentration“/Besprechungen oder per Satz („Ich brauche 2 Stunden Ruhe“).
Durch Ruhe und Fokus kommen nur Notfälle und als dringend markierte Mail-Wachen.
"""
import re
import secrets
import threading
import time
from datetime import date, datetime, timedelta

from atlas.paths import read_private_json, write_private_json
from atlas.tools import S, Tool

DATEI = "aufmerksamkeit.json"
STANDARD = {
    "aktiv": True,
    "ruhe_von": "22:00", "ruhe_bis": "07:00",
    "samstag_ab": "14:00", "sonntag": True,
    "ruhe_titel": ["Familie"],
    "fokus_titel": ["Fokus", "Konzentration", "Besprechung", "Meeting", "Sitzung"],
    "stapel_zeiten": ["12:30", "18:00"],
    "fokus_bis": "", "fokus_grund": "",
}
_ZEIT = re.compile(r"(\d{2})\.(\d{2})\.(\d{4})(?: (\d{2}):(\d{2}))?")


def _hm(s: str) -> tuple[int, int]:
    try:
        h, m = (s or "0:0").split(":")
        return int(h), int(m)
    except ValueError:
        return 0, 0


def _dt(s: str, ende: bool = False) -> datetime | None:
    m = _ZEIT.search(s or "")
    if not m:
        return None
    d, mo, y, h, mi = m.groups()
    if h is None:
        t = datetime(int(y), int(mo), int(d))
        return t + timedelta(days=1) if ende else t
    return datetime(int(y), int(mo), int(d), int(h), int(mi))


class Aufmerksamkeit:
    def __init__(self, core):
        self.c = core
        self.lock = threading.Lock()
        self._kal = (0.0, [])               # (Zeitpunkt, heutige Termine)
        self._letzter_modus = "normal"
        self._ausgeliefert: set[str] = set()

    # ------------------------------------------------------------ Einstellungen
    def einstellungen(self) -> dict:
        return {**STANDARD, **read_private_json(DATEI, {})}

    def einstellen(self, **werte) -> dict:
        with self.lock:
            z = {**STANDARD, **read_private_json(DATEI, {})}
            for k, v in werte.items():
                if k in STANDARD and k not in ("fokus_bis", "fokus_grund"):
                    z[k] = v
            write_private_json(DATEI, {k: v for k, v in z.items() if k != "stapel"})
        self.c.broadcast({"type": "modus", **self.modus()})
        return self.einstellungen()

    # ------------------------------------------------------------ Modus
    def _termine_heute(self) -> list[dict]:
        if time.time() - self._kal[0] < 300:
            return self._kal[1]
        t = self.c.tools.get("kalender_termine")
        rows = []
        if t:
            try:
                rows = t.func(von=date.today().isoformat()) or []
            except Exception:
                rows = []
        self._kal = (time.time(), rows)
        return rows

    def _im_termin(self, titel: list[str], jetzt: datetime) -> dict | None:
        woerter = [w.lower() for w in titel if w]
        for r in self._termine_heute():
            if r.get("ganztag") or not any(w in (r.get("titel") or "").lower() for w in woerter):
                continue
            a, e = _dt(r.get("beginn", "")), _dt(r.get("ende", ""), True)
            if a and e and a <= jetzt < e:
                return {"titel": r["titel"], "bis": e}
        return None

    def modus(self, jetzt: datetime | None = None) -> dict:
        z = self.einstellungen()
        jetzt = jetzt or datetime.now()
        if not z.get("aktiv", True):
            return {"modus": "normal", "grund": "Router aus", "bis": ""}
        if z.get("fokus_bis") and z["fokus_bis"] > jetzt.isoformat():
            return {"modus": "fokus", "grund": z.get("fokus_grund") or "Fokus", "bis": z["fokus_bis"][11:16]}
        hm = (jetzt.hour, jetzt.minute)
        von, bis = _hm(z["ruhe_von"]), _hm(z["ruhe_bis"])
        if (hm >= von or hm < bis) if von > bis else (von <= hm < bis):
            beginn = None
            try:                                    # Dienststellentage beginnen früher: Ruhe endet mit Dienstbeginn
                beginn = self.c.ziele.arbeitsbeginn(jetzt.date()) if hasattr(self.c, "ziele") and hm < bis else None
            except Exception:
                beginn = None
            if not (beginn and jetzt >= beginn):
                return {"modus": "ruhe", "grund": "Nachtruhe", "bis": z["ruhe_bis"]}
        if jetzt.weekday() == 6 and z.get("sonntag"):
            return {"modus": "ruhe", "grund": "Sonntag", "bis": ""}
        if jetzt.weekday() == 5 and z.get("samstag_ab") and hm >= _hm(z["samstag_ab"]):
            return {"modus": "ruhe", "grund": "Samstagnachmittag", "bis": ""}
        t = self._im_termin(z.get("ruhe_titel") or [], jetzt)
        if t:
            return {"modus": "ruhe", "grund": t["titel"], "bis": t["bis"].strftime("%H:%M")}
        t = self._im_termin(z.get("fokus_titel") or [], jetzt)
        if t:
            return {"modus": "fokus", "grund": t["titel"], "bis": t["bis"].strftime("%H:%M")}
        return {"modus": "normal", "grund": "", "bis": ""}

    def zustellung(self, art: str = "hinweis", dringend: bool = False) -> str:
        if dringend:
            return "sofort"
        return "sofort" if self.modus()["modus"] == "normal" else "stapel"

    # ------------------------------------------------------------ Stapel
    def _stapel(self) -> list[dict]:
        return read_private_json("stapel.json", {"eintraege": []})["eintraege"]

    def zuruecklegen(self, art: str, text: str, daten: dict | None = None) -> None:
        with self.lock:
            z = read_private_json("stapel.json", {"eintraege": []})
            z["eintraege"].append({"id": secrets.token_hex(3), "zeit": datetime.now().isoformat(timespec="minutes"),
                                   "art": art, "text": text[:300], "daten": daten or {}})
            z["eintraege"] = z["eintraege"][-100:]
            write_private_json("stapel.json", z)
        self.c.audit.log("zurueckgelegt", art=art, text=text[:120])
        self.c.broadcast({"type": "leise", "art": art, "text": text[:160], "anzahl": len(self._stapel()),
                          **self.modus()})

    def melden(self, art: str, text: str, dringend: bool = False, daten: dict | None = None) -> bool:
        """True = jetzt sofort zustellen (Aufrufer macht weiter wie bisher); False = zurückgelegt."""
        if self.zustellung(art, dringend) == "sofort":
            return True
        self.zuruecklegen(art, text, daten)
        return False

    def entscheidungen(self) -> list[dict]:
        """Offene Entscheidungen aus den Workflows (Billigungen, Ablagen)."""
        out = []
        c = self.c
        try:
            z = c.nebenkosten._z()
            v = len([x for x in z["vorschlaege"] if x["status"] == "offen"])
            a = len([x for x in z["anfragen"] if x["status"] == "entwurf"])
            if v:
                out.append({"art": "hestia", "text": f"HESTIA: {v} Beleg(e) zur Ablage-Bestätigung", "fenster": "hestia"})
            if a:
                out.append({"art": "hestia", "text": f"HESTIA: {a} Anfrage(n) an Versorger zur Billigung", "fenster": "hestia"})
        except Exception:
            pass
        try:
            n = len(c.post.offen()["offen"])
            if n:
                out.append({"art": "post", "text": f"Post: {n} Brief(e) warten auf Ablage", "fenster": "post"})
        except Exception:
            pass
        return out

    def stapel(self) -> dict:
        return {"zurueckgelegt": self._stapel(), "entscheidungen": self.entscheidungen(), **self.modus()}

    def ausliefern(self, grund: str = "", leeren: bool = True, telegram: bool = True) -> dict:
        if getattr(self.c, "notfall", None) and self.c.notfall.aktiv() and grund != "auf Wunsch":
            return {"leer": True}
        s = self.stapel()
        if not s["zurueckgelegt"] and not s["entscheidungen"]:
            return {"leer": True}
        self.c.broadcast({"type": "stapel", "grund": grund, **s})
        if telegram:
            zeilen = [f"• {e['text']}" for e in s["zurueckgelegt"][-12:]] + [f"☐ {e['text']}" for e in s["entscheidungen"]]
            try:
                self.c.proaktiv.telegram.send(f"🗂 Entscheidungsstapel{(' – ' + grund) if grund else ''}\n" + "\n".join(zeilen))
            except Exception:
                pass
        self.c.audit.log("stapel", grund=grund, zurueckgelegt=len(s["zurueckgelegt"]), entscheidungen=len(s["entscheidungen"]))
        if leeren:
            with self.lock:
                write_private_json("stapel.json", {"eintraege": []})
        return s

    def briefing_zeile(self) -> str:
        n = len(self._stapel())
        return f"Über Nacht zurückgelegt: {n} Meldung(en) – „Was liegt an?“ zeigt sie." if n else ""

    # ------------------------------------------------------------ Fokus per Satz
    def fokus_starten(self, minuten: int = 120, grund: str = "") -> dict:
        bis = datetime.now() + timedelta(minutes=max(10, min(int(minuten or 120), 600)))
        with self.lock:
            z = read_private_json(DATEI, {})
            z["fokus_bis"], z["fokus_grund"] = bis.isoformat(timespec="minutes"), (grund or "Fokus")[:60]
            write_private_json(DATEI, z)
        self.c.broadcast({"type": "modus", **self.modus()})
        return {"fokus_bis": bis.strftime("%H:%M"), "hinweis": "Nicht Dringendes sammle ich bis dahin."}

    def fokus_beenden(self) -> dict:
        with self.lock:
            z = read_private_json(DATEI, {})
            z["fokus_bis"], z["fokus_grund"] = "", ""
            write_private_json(DATEI, z)
        self.c.broadcast({"type": "modus", **self.modus()})
        s = self.ausliefern("Fokus beendet", telegram=False)
        return {"fokus": "beendet", "zurueckgelegt": len(s.get("zurueckgelegt", []))}

    # ------------------------------------------------------------ Hintergrund
    def schleife(self, stop: threading.Event) -> None:
        while not stop.wait(30):
            try:
                if not getattr(self.c.proaktiv, "leader", False):
                    continue
                jetzt = datetime.now()
                m = self.modus(jetzt)["modus"]
                if m != self._letzter_modus:
                    self.c.broadcast({"type": "modus", **self.modus(jetzt)})
                    if m == "normal" and self._stapel():
                        self.ausliefern("Ruhe/Fokus vorbei", telegram=False)
                    self._letzter_modus = m
                for zeit in self.einstellungen().get("stapel_zeiten") or []:
                    h, mi = _hm(zeit)
                    key = f"{jetzt.date()}_{zeit}"
                    soll = jetzt.replace(hour=h, minute=mi, second=0, microsecond=0)
                    if key not in self._ausgeliefert and soll <= jetzt < soll + timedelta(minutes=10):
                        self._ausgeliefert.add(key)
                        if m == "normal":
                            self.ausliefern(f"{zeit} Uhr")
            except Exception as e:
                self.c.audit.log("fehler", bereich="aufmerksamkeit", text=f"{type(e).__name__}: {e}"[:200])

    def start(self, stop: threading.Event) -> None:
        threading.Thread(target=self.schleife, args=(stop,), name="aufmerksamkeit", daemon=True).start()


def tools(core) -> list[Tool]:
    a = core.aufmerksamkeit
    return [
        Tool("fokus_starten", "Fokus/Ruhe für eine Zeit: Nicht Dringendes wird gesammelt statt gemeldet.", "fokus",
             lambda minuten=120, grund="": a.fokus_starten(minuten, grund),
             {"minuten": {"type": "integer", "description": "Dauer in Minuten (Standard 120)"}, "grund": S("optional")},
             label=lambda x: f"Fokus für {x.get('minuten') or 120} Minuten"),
        Tool("fokus_beenden", "Fokus beenden und Zurückgelegtes zeigen.", "fokus", lambda: a.fokus_beenden()),
        Tool("stapel_zeigen",
             "Entscheidungsstapel: zurückgelegte Meldungen und offene Entscheidungen (Billigungen, Ablagen) sowie der "
             "aktuelle Modus (normal/fokus/ruhe). Zeigt die Karte im Dashboard.",
             "fokus", lambda: (core.broadcast({"type": "stapel", "grund": "auf Wunsch", **a.stapel()}), a.stapel())[1]),
    ]
