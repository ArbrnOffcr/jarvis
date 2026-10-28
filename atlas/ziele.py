"""Zielregister – Richards feste Vorsätze, an denen JARVIS Pläne misst.

Ziele (Stand 28.10.2026, von Richard festgelegt):
- Wochenenden grundsätzlich für die Familie freihalten.
- Arbeitszeit: Dienststelle 05:45–15:15, mobiles Arbeiten 07:45–16:00.
- Sport täglich: in der Dienststelle 45 Minuten direkt morgens, im mobilen Arbeiten 15 Minuten.

Arbeitsort eines Tages: Kalendereintrag („Mobiles Arbeiten“ / „Dienst“) geht immer vor, sonst der Standort
(Mac/iPhone in der Nähe der Dienststelle = Dienststelle, zu Hause zur Dienstzeit = mobil), sonst das gelernte
Wochenmuster, sonst Dienststelle. JARVIS legt Sportblöcke im Privatkalender an (Befugnis „Private Termine“,
mit Meldung und Rückgängig), korrigiert sie am Morgen, wenn der Arbeitsort anders ist, und widerspricht, wenn
ein Termin gegen ein Ziel läuft – entschieden wird von Richard.
"""
import re
import threading
import time
from datetime import date, datetime, timedelta

from atlas.paths import read_private_json, write_private_json
from atlas.tools import S, Tool, ToolError

DATEI = "ziele.json"
WOCHENTAGE = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"]
STANDARD = {
    "aktiv": True,
    "wochenende_frei": True,
    "arbeit": {"dienst": {"beginn": "05:45", "ende": "15:15"}, "mobil": {"beginn": "07:45", "ende": "16:00"}},
    "sport": {"dienst": {"beginn": "05:45", "minuten": 45}, "mobil": {"beginn": "07:30", "minuten": 15}},
    "sport_bloecke": True,
    "sport_titel": "Sport",
    "marker_mobil": ["Mobiles Arbeiten", "MobA", "Homeoffice", "Home Office"],
    "marker_dienst": ["Dienststelle", "Dienst vor Ort"],
    "dienststelle": None,              # {"lat", "lon", "name"} – per „Ich bin in der Dienststelle“ gemerkt
    "radius_km": 2.0,
}
_ZEIT = re.compile(r"(\d{2})\.(\d{2})\.(\d{4})(?: (\d{2}):(\d{2}))?")


def _hm(s: str) -> tuple[int, int]:
    h, m = (s or "0:0").split(":")
    return int(h), int(m)


def _bei(tag: date, hm: str) -> datetime:
    h, m = _hm(hm)
    return datetime(tag.year, tag.month, tag.day, h, m)


def _dt(s: str) -> datetime | None:
    m = _ZEIT.search(s or "")
    if not m:
        return None
    d, mo, y, h, mi = m.groups()
    return datetime(int(y), int(mo), int(d), int(h or 0), int(mi or 0))


class Ziele:
    def __init__(self, core):
        self.c = core
        self.lock = threading.Lock()
        self._kal: dict = {}

    # ------------------------------------------------------------ Einstellungen
    def _z(self) -> dict:
        z = {**STANDARD, **read_private_json(DATEI, {})}
        z.setdefault("verlauf", {})
        z.setdefault("festgelegt", {})
        z.setdefault("sportbloecke", {})          # Tag → uid der von JARVIS angelegten Sportblöcke
        return z

    def _s(self, z: dict) -> None:
        write_private_json(DATEI, z)

    def einstellungen(self) -> dict:
        z = self._z()
        return {k: z[k] for k in STANDARD}

    def einstellen(self, **werte) -> dict:
        with self.lock:
            z = self._z()
            for k, v in werte.items():
                if k in STANDARD and k != "dienststelle":
                    z[k] = v
            self._s(z)
        self.c.audit.log("ziele_geaendert", felder=list(werte))
        return self.einstellungen()

    # ------------------------------------------------------------ Arbeitsort
    def _termine(self, tag: date) -> list[dict]:
        k = tag.isoformat()
        alt = self._kal.get(k)
        if alt and time.time() - alt[0] < 600:
            return alt[1]
        t = self.c.tools.get("kalender_termine")
        rows = []
        if t:
            try:
                rows = t.func(von=k) or []
            except Exception:
                rows = []
        self._kal[k] = (time.time(), rows)
        return rows

    def arbeitsort(self, tag: date | None = None) -> dict:
        """{"ort": "dienst"|"mobil"|"frei", "quelle": …}"""
        z = self._z()
        tag = tag or date.today()
        fest = z["festgelegt"].get(tag.isoformat())
        if fest:
            return {"ort": fest, "quelle": "von dir festgelegt"}
        for r in self._termine(tag):
            titel = (r.get("titel") or "").lower()
            if any(m.lower() in titel for m in z["marker_mobil"]):
                return {"ort": "mobil", "quelle": f"Kalender: {r['titel']}"}
            if any(m.lower() in titel for m in z["marker_dienst"]):
                return {"ort": "dienst", "quelle": f"Kalender: {r['titel']}"}
            if r.get("ganztag") and re.search(r"urlaub|frei\b|feiertag|krank", titel):
                return {"ort": "frei", "quelle": f"Kalender: {r['titel']}"}
        if tag.weekday() >= 5:
            return {"ort": "frei", "quelle": "Wochenende"}
        if tag == date.today():
            st = getattr(self.c, "standort", None)
            pos = st.aktuell(3 * 3600) if st else None
            ds = z.get("dienststelle")
            if pos and ds:
                from atlas.standort import km
                if km(pos["lat"], pos["lon"], ds["lat"], ds["lon"]) <= float(z.get("radius_km") or 2):
                    return {"ort": "dienst", "quelle": "Standort Dienststelle"}
                jetzt = datetime.now()
                if jetzt >= _bei(tag, z["arbeit"]["dienst"]["beginn"]) + timedelta(hours=2) and st:
                    heim = st.heim()
                    if km(pos["lat"], pos["lon"], heim["lat"], heim["lon"]) <= 3:
                        return {"ort": "mobil", "quelle": "Standort zu Hause zur Dienstzeit"}
        muster = self._muster(tag.weekday())
        if muster:
            return {"ort": muster, "quelle": f"üblich am {WOCHENTAGE[tag.weekday()]}"}
        return {"ort": "dienst", "quelle": "Standard"}

    def _muster(self, wochentag: int) -> str:
        v = self._z()["verlauf"]
        grenze = (date.today() - timedelta(days=42)).isoformat()
        orte = [o for d, o in v.items() if d >= grenze and date.fromisoformat(d).weekday() == wochentag
                and o in ("dienst", "mobil")]
        if len(orte) < 2:
            return ""
        return max(set(orte), key=orte.count)

    def _merken(self, tag: date, ort: str) -> None:
        with self.lock:
            z = self._z()
            z["verlauf"][tag.isoformat()] = ort
            z["verlauf"] = dict(sorted(z["verlauf"].items())[-90:])
            self._s(z)

    def arbeitsort_setzen(self, ort: str, datum: str = "") -> dict:
        ort = {"mobil": "mobil", "mobiles arbeiten": "mobil", "homeoffice": "mobil", "dienst": "dienst",
               "dienststelle": "dienst", "frei": "frei", "urlaub": "frei"}.get((ort or "").strip().lower())
        if not ort:
            raise ToolError("Arbeitsort: dienst, mobil oder frei")
        tag = date.fromisoformat(datum[:10]) if datum else date.today()
        with self.lock:
            z = self._z()
            z["festgelegt"][tag.isoformat()] = ort
            z["festgelegt"] = {k: v for k, v in z["festgelegt"].items() if k >= (date.today() - timedelta(days=7)).isoformat()}
            self._s(z)
        self._merken(tag, ort)
        threading.Thread(target=self.sport_abgleichen, args=(tag,), daemon=True).start()
        return {"tag": tag.isoformat(), "arbeitsort": ort, **self.tagesplan(tag)}

    def dienststelle_hier(self) -> dict:
        st = getattr(self.c, "standort", None)
        pos = st.aktuell(1800) if st else None
        if not pos:
            raise ToolError("Ich kenne deinen aktuellen Standort nicht – bitte die Ortung am Mac/iPhone erlauben.")
        with self.lock:
            z = self._z()
            z["dienststelle"] = {"lat": pos["lat"], "lon": pos["lon"], "name": pos.get("ort", "")}
            self._s(z)
        self._merken(date.today(), "dienst")
        return {"dienststelle": pos.get("ort", ""), "radius_km": self._z()["radius_km"]}

    # ------------------------------------------------------------ Tagesplan
    def tagesplan(self, tag: date | None = None) -> dict:
        z = self._z()
        tag = tag or date.today()
        a = self.arbeitsort(tag)
        if a["ort"] == "frei":
            return {"arbeitsort": "frei", "quelle": a["quelle"], "familie": tag.weekday() >= 5 and z["wochenende_frei"]}
        arb, sp = z["arbeit"][a["ort"]], z["sport"][a["ort"]]
        s0 = _bei(tag, sp["beginn"])
        return {"arbeitsort": a["ort"], "quelle": a["quelle"], "arbeit": f"{arb['beginn']}–{arb['ende']}",
                "sport": f"{s0:%H:%M}–{s0 + timedelta(minutes=int(sp['minuten'])):%H:%M} ({sp['minuten']} min)"}

    def arbeitsende(self, tag: date | None = None) -> datetime | None:
        tag = tag or date.today()
        a = self.arbeitsort(tag)["ort"]
        return _bei(tag, self._z()["arbeit"][a]["ende"]) if a in ("dienst", "mobil") else None

    def arbeitsbeginn(self, tag: date | None = None) -> datetime | None:
        tag = tag or date.today()
        a = self.arbeitsort(tag)["ort"]
        return _bei(tag, self._z()["arbeit"][a]["beginn"]) if a in ("dienst", "mobil") else None

    # ------------------------------------------------------------ Sportblöcke
    def _sportblock(self, tag: date) -> dict | None:
        titel = self._z()["sport_titel"].lower()
        for r in self._termine(tag):
            if (r.get("titel") or "").lower().startswith(titel) and not r.get("ganztag"):
                return r
        return None

    def sport_abgleichen(self, tag: date | None = None) -> dict:
        """Sportblock für den Tag anlegen oder an den Arbeitsort anpassen (über den normalen Werkzeugweg:
        Befugnis, Protokoll, Rückgängig)."""
        z = self._z()
        tag = tag or date.today()
        if not z["aktiv"] or not z["sport_bloecke"]:
            return {"aus": True}
        ort = self.arbeitsort(tag)["ort"]
        if ort == "frei":
            return {"frei": True}
        sp = z["sport"][ort]
        s0 = _bei(tag, sp["beginn"])
        e0 = s0 + timedelta(minutes=int(sp["minuten"]))
        self._kal.pop(tag.isoformat(), None)
        vorhanden = self._sportblock(tag)
        from atlas import agent
        from types import SimpleNamespace as NS
        melden = lambda t: self.c.proaktiv.hint(t, art="ziele") if hasattr(self.c, "proaktiv") else None
        if vorhanden:
            beginn = _dt(vorhanden.get("beginn", ""))
            if beginn and beginn.strftime("%H:%M") == s0.strftime("%H:%M"):
                return {"vorhanden": True}
            if vorhanden.get("uid") not in self._z()["sportbloecke"].values():
                return {"vorhanden": True, "eigener_termin": True}        # deinen eigenen Sporttermin fasse ich nicht an
            out = agent._tool(self.c, NS(name="kalender_verschieben", args={
                "uid": vorhanden["uid"], "neuer_start": s0.strftime("%Y-%m-%dT%H:%M"),
                "neues_ende": e0.strftime("%Y-%m-%dT%H:%M")}), None, melden, False, [], "ziele")
            return {"verschoben": out[:200]}
        if tag == date.today() and datetime.now() > e0:
            return {"vorbei": True}
        out = agent._tool(self.c, NS(name="kalender_anlegen", args={
            "titel": f"{z['sport_titel']} ({sp['minuten']} min)", "start": s0.strftime("%Y-%m-%dT%H:%M"),
            "ende": e0.strftime("%Y-%m-%dT%H:%M"), "notiz": f"Von JARVIS geblockt – Ziel: tägliche Sportzeit "
            f"({'Dienststelle' if ort == 'dienst' else 'mobiles Arbeiten'})."}), None, melden, False, [], "ziele")
        try:
            import json
            uid = json.loads(out).get("uid")
        except (ValueError, AttributeError):
            uid = None
        if uid:
            with self.lock:
                zz = self._z()
                zz["sportbloecke"][tag.isoformat()] = uid
                zz["sportbloecke"] = dict(sorted(zz["sportbloecke"].items())[-60:])
                self._s(zz)
        return {"angelegt": out[:200]}

    # ------------------------------------------------------------ Widerspruch
    def widerspruch(self, tool, args: dict) -> str:
        """Läuft eine Kalenderaktion gegen ein Ziel? Gibt einen kurzen Hinweis zurück (sonst "")."""
        z = self._z()
        if not z["aktiv"] or tool.name not in ("kalender_anlegen", "kalender_verschieben"):
            return ""
        if args.get("uid") and args["uid"] in z["sportbloecke"].values():
            return ""                                                    # eigener Sportblock wird angepasst
        titel = (args.get("titel") or "").lower()
        kal = (args.get("kalender") or "").lower()
        if "familie" in kal or "familie" in titel or titel.startswith(z["sport_titel"].lower()):
            return ""
        roh = args.get("start") or args.get("neuer_start") or ""
        try:
            beginn = datetime.fromisoformat(roh[:16]) if "T" in roh else None
        except ValueError:
            return ""
        if beginn is None:
            try:
                tag = date.fromisoformat(roh[:10])
            except ValueError:
                return ""
            if tag.weekday() >= 5 and z["wochenende_frei"]:
                return f"Ziel „Wochenenden für die Familie“: {WOCHENTAGE[tag.weekday()]} {tag:%d.%m.}"
            return ""
        tag = beginn.date()
        if tag.weekday() >= 5 and z["wochenende_frei"]:
            return f"Ziel „Wochenenden für die Familie“: {WOCHENTAGE[tag.weekday()]} {tag:%d.%m.} {beginn:%H:%M}"
        ort = self.arbeitsort(tag)["ort"]
        if ort in ("dienst", "mobil"):
            sp = z["sport"][ort]
            s0 = _bei(tag, sp["beginn"])
            if s0 <= beginn < s0 + timedelta(minutes=int(sp["minuten"])):
                return f"Ziel „tägliche Sportzeit“ ({s0:%H:%M}, {sp['minuten']} min)"
            ende = _bei(tag, z["arbeit"][ort]["ende"])
            if beginn >= ende and any(w in titel for w in ("besprechung", "meeting", "dienst", "lage", "telko", "call")):
                return f"Ziel „Arbeitsende {ende:%H:%M}“ ({'Dienststelle' if ort == 'dienst' else 'mobil'})"
        return ""

    def persona_zeile(self) -> str:
        z = self._z()
        if not z["aktiv"] or (getattr(self.c, "notfall", None) and self.c.notfall.aktiv()):
            return ""
        p = self.tagesplan()
        heute = (f"heute {('Dienststelle' if p['arbeitsort'] == 'dienst' else 'mobiles Arbeiten')} "
                 f"(Arbeit {p['arbeit']}, Sport {p['sport']})" if p["arbeitsort"] in ("dienst", "mobil") else "heute frei")
        return ("- ZIELE von Richard: Wochenenden für die Familie freihalten; Arbeitszeit Dienststelle "
                f"{z['arbeit']['dienst']['beginn']}–{z['arbeit']['dienst']['ende']}, mobil {z['arbeit']['mobil']['beginn']}–"
                f"{z['arbeit']['mobil']['ende']}; Sport täglich (Dienststelle {z['sport']['dienst']['minuten']} min morgens, mobil "
                f"{z['sport']['mobil']['minuten']} min). {heute}. Plant er etwas dagegen, sag es einmal kurz und sachlich "
                "– er entscheidet. Termine schlägst du innerhalb der Arbeitszeit vor.\n")

    def status(self) -> dict:
        z = self._z()
        woche = []
        montag = date.today() - timedelta(days=date.today().weekday())
        for i in range(7):
            t = montag + timedelta(days=i)
            p = self.tagesplan(t)
            woche.append({"tag": f"{WOCHENTAGE[i]} {t:%d.%m.}", **p})
        return {"ziele": {"wochenende_frei": z["wochenende_frei"], "arbeit": z["arbeit"], "sport": z["sport"]},
                "heute": self.tagesplan(), "woche": woche,
                "dienststelle": (z.get("dienststelle") or {}).get("name") or "noch nicht gemerkt"}

    # ------------------------------------------------------------ Hintergrund
    def schleife(self, stop: threading.Event) -> None:
        erledigt: set[str] = set()
        while not stop.wait(60):
            try:
                if not getattr(self.c.proaktiv, "leader", False) or not self._z()["aktiv"]:
                    continue
                if getattr(self.c, "notfall", None) and self.c.notfall.aktiv():
                    continue
                jetzt = datetime.now()
                heute = jetzt.date()
                morgen = heute + timedelta(days=1)
                if jetzt.hour == 19 and f"abend_{heute}" not in erledigt:       # Block für morgen
                    erledigt.add(f"abend_{heute}")
                    self.sport_abgleichen(morgen)
                if jetzt.hour == 8 and jetzt.minute >= 10 and f"morgen_{heute}" not in erledigt:
                    erledigt.add(f"morgen_{heute}")                               # Arbeitsort jetzt bekannt
                    ort = self.arbeitsort(heute)
                    if ort["ort"] in ("dienst", "mobil"):
                        self._merken(heute, ort["ort"])
                    self.sport_abgleichen(heute)
            except Exception as e:
                self.c.audit.log("fehler", bereich="ziele", text=f"{type(e).__name__}: {e}"[:200])

    def start(self, stop: threading.Event) -> None:
        threading.Thread(target=self.schleife, args=(stop,), name="ziele", daemon=True).start()


def tools(core) -> list[Tool]:
    z = core.ziele
    return [
        Tool("ziele_status", "Richards Ziele (Wochenende frei, Arbeitszeiten, Sport) und der Plan für heute und die "
             "Woche: Arbeitsort (Dienststelle/mobil/frei), Arbeitszeit, Sportzeit.", "ziele.lesen", lambda: z.status()),
        Tool("arbeitsort_setzen", "Arbeitsort für einen Tag festlegen, z. B. „Morgen bin ich im mobilen Arbeiten“. "
             "Passt den Sportblock an.", "ziele.schreiben", lambda ort, datum="": z.arbeitsort_setzen(ort, datum),
             {"ort": S("dienst | mobil | frei", enum=["dienst", "mobil", "frei"]), "datum": S("JJJJ-MM-TT, Standard heute")},
             ["ort"], label=lambda a: f"Arbeitsort {a.get('datum') or 'heute'}: {a.get('ort')}"),
        Tool("dienststelle_hier", "Den aktuellen Standort als Dienststelle merken („Ich bin jetzt in der Dienststelle“).",
             "ziele.schreiben", lambda: z.dienststelle_hier()),
    ]
