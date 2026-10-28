"""Befugnis-Register – der verhandelbare Autopilot.

Eine Befugnis erlaubt JARVIS eine Aktion ohne Rückfrage (er meldet sie danach), innerhalb einer Grenze:
Werkzeuge, Bedingung (z. B. nicht in Dienst- oder Familienkalendern), Höchstzahl pro Woche, gültig bis.
Wird ein Werkzeug von einer Befugnis abgedeckt, die Bedingung aber verletzt, gilt BESTÄTIGEN.
- Erteilen nur durch dich (Bestätigung, nie nach fremdem Inhalt); Entziehen sofort per Satz, auch „Notbremse“.
- Jede Nutzung wird mit Befugnis-id protokolliert (Rechenschaftsansicht).
"""
import secrets
import threading
from datetime import date, datetime, timedelta

from atlas.paths import read_private_json, write_private_json
from atlas.tools import S, Tool, ToolError

DATEI = "befugnisse.json"
# Bereiche, aus denen Befugnisse gebaut werden (nur diese – keine beliebigen Werkzeuge)
BEREICHE = {
    "kalender_privat": ("Private Termine anlegen und verschieben", ["kalender_anlegen", "kalender_verschieben"]),
    "erinnerungen": ("Erinnerungen anlegen und abhaken", ["erinnerung_anlegen", "erinnerung_erledigt"]),
    "einkauf": ("Einkaufsliste führen", ["einkauf_hinzufuegen", "einkauf_erledigt"]),
    "fristen": ("Fristen eintragen und erledigen", ["frist_eintragen", "frist_erledigt"]),
    "notizen": ("Notizen ergänzen", ["notiz_ergaenzen"]),
    "tesla_klima": ("Tesla vorklimatisieren und Ladeplan setzen", ["tesla_klima", "tesla_ladeplan"]),
    "gedaechtnis": ("Gedächtnis pflegen", ["gedaechtnis_vergessen", "vorgang_aktualisieren"]),
}
STANDARD = [{
    "id": "b-kalender", "bereich": "kalender_privat", "titel": "Private Termine (Handwerker, Privates) anlegen und "
    "verschieben – melden", "bedingung": {"kalender_ausschluss": ["bundeswehr", "dienst", "familie"]},
    "max_pro_woche": None, "gueltig_bis": "", "aktiv": True, "erteilt": "2026-10-28", "von": "Konzept (gebilligt)",
    "nutzungen": []}]


class Befugnisse:
    def __init__(self, core):
        self.c = core
        self.lock = threading.Lock()

    def _z(self) -> dict:
        z = read_private_json(DATEI, {"regeln": None})
        if z.get("regeln") is None:
            z["regeln"] = [dict(r) for r in STANDARD]
            write_private_json(DATEI, z)
        return z

    def _s(self, z: dict) -> None:
        write_private_json(DATEI, z)

    def liste(self) -> dict:
        heute = date.today().isoformat()
        out = []
        for r in self._z()["regeln"]:
            woche = [n for n in r.get("nutzungen", []) if n >= (date.today() - timedelta(days=7)).isoformat()]
            out.append({**{k: r.get(k) for k in ("id", "bereich", "titel", "bedingung", "max_pro_woche", "gueltig_bis",
                                                  "aktiv", "erteilt", "von")},
                        "abgelaufen": bool(r.get("gueltig_bis") and r["gueltig_bis"] < heute),
                        "nutzungen_7_tage": len(woche), "werkzeuge": BEREICHE.get(r["bereich"], ("", []))[1]})
        return {"befugnisse": out, "bereiche": {k: v[0] for k, v in BEREICHE.items()}}

    # ------------------------------------------------------------ Prüfung vor der Ausführung
    def pruefen(self, tool, args: dict, lvl):
        from atlas.permissions import Level
        heute = date.today().isoformat()
        betroffen = [r for r in self._z()["regeln"] if tool.name in BEREICHE.get(r["bereich"], ("", []))[1]]
        if not betroffen:
            return lvl, "", ""
        for r in betroffen:
            if not r.get("aktiv") or (r.get("gueltig_bis") and r["gueltig_bis"] < heute):
                continue
            ok, grund = self._bedingung(r, tool, args)
            if not ok:
                continue
            if r.get("max_pro_woche"):
                woche = [n for n in r.get("nutzungen", []) if n >= (date.today() - timedelta(days=7)).isoformat()]
                if len(woche) >= int(r["max_pro_woche"]):
                    return Level.BESTAETIGEN, f"Wochengrenze der Befugnis „{r['titel']}“ erreicht", ""
            return Level.MELDEN, "", r["id"]
        # abgedeckt, aber außerhalb der Befugnis → nachfragen
        return max(lvl, Level.BESTAETIGEN), "außerhalb deiner Befugnisse (z. B. Dienst- oder Familienkalender)", ""

    def _bedingung(self, r: dict, tool, args: dict) -> tuple[bool, str]:
        b = r.get("bedingung") or {}
        aus = [x.lower() for x in b.get("kalender_ausschluss") or []]
        if aus and tool.name.startswith("kalender_"):
            kal = (args.get("kalender") or "").lower()
            if tool.name == "kalender_verschieben":
                try:
                    cal, _ = tool.func.__self__._by_uid(args.get("uid", ""))
                    kal = (cal.name or "").lower()
                except Exception:
                    return False, "Kalender unbekannt"
            if not kal and tool.name == "kalender_anlegen":
                kal = str((self.c.cfg.get("kalender") or {}).get("standard") or "").lower()
            if any(a in kal for a in aus):
                return False, "Kalender ausgeschlossen"
        return True, ""

    def genutzt(self, rid: str) -> None:
        if not rid:
            return
        with self.lock:
            z = self._z()
            for r in z["regeln"]:
                if r["id"] == rid:
                    r.setdefault("nutzungen", []).append(datetime.now().isoformat(timespec="minutes"))
                    r["nutzungen"] = r["nutzungen"][-200:]
            self._s(z)

    # ------------------------------------------------------------ Erteilen / Entziehen
    def erteilen(self, bereich: str, titel: str = "", max_pro_woche: int | None = None, gueltig_bis: str = "",
                 kalender_ausschluss: list | None = None) -> dict:
        if bereich not in BEREICHE:
            raise ToolError("Unbekannter Bereich. Möglich: " + ", ".join(f"{k} ({v[0]})" for k, v in BEREICHE.items()))
        r = {"id": "b-" + secrets.token_hex(3), "bereich": bereich, "titel": (titel or BEREICHE[bereich][0])[:120],
             "bedingung": {"kalender_ausschluss": [x.lower() for x in (kalender_ausschluss or
                                                                       (["bundeswehr", "dienst", "familie"] if bereich == "kalender_privat" else []))]},
             "max_pro_woche": int(max_pro_woche) if max_pro_woche else None, "gueltig_bis": (gueltig_bis or "")[:10],
             "aktiv": True, "erteilt": date.today().isoformat(), "von": "du", "nutzungen": []}
        with self.lock:
            z = self._z()
            z["regeln"].append(r)
            self._s(z)
        self.c.audit.log("befugnis_erteilt", befugnis=r["id"], bereich=bereich, titel=r["titel"])
        self.c.broadcast({"type": "befugnisse"})
        return {"ok": True, "befugnis": r["titel"], "id": r["id"]}

    def entziehen(self, wer: str = "", alle: bool = False) -> dict:
        n = 0
        with self.lock:
            z = self._z()
            for r in z["regeln"]:
                if r.get("aktiv") and (alle or r["id"] == wer or (wer and (wer.lower() in r["titel"].lower()
                                                                          or wer.lower() == r["bereich"]))):
                    r["aktiv"] = False
                    n += 1
            self._s(z)
        self.c.audit.log("befugnis_entzogen", wer=wer or "alle", anzahl=n)
        self.c.broadcast({"type": "befugnisse"})
        return {"ok": True, "entzogen": n, "hinweis": "Wirkt sofort." if n else "Keine passende aktive Befugnis."}

    def wieder_aktivieren(self, rid: str) -> dict:
        with self.lock:
            z = self._z()
            for r in z["regeln"]:
                if r["id"] == rid:
                    r["aktiv"] = True
            self._s(z)
        self.c.audit.log("befugnis_aktiviert", befugnis=rid)
        return {"ok": True}

    def bedingung_setzen(self, rid: str, kalender_ausschluss: list | None = None, max_pro_woche=None,
                         gueltig_bis: str | None = None) -> dict:
        with self.lock:
            z = self._z()
            r = next((x for x in z["regeln"] if x["id"] == rid), None)
            if not r:
                raise ToolError("Befugnis nicht gefunden")
            if kalender_ausschluss is not None:
                r.setdefault("bedingung", {})["kalender_ausschluss"] = [x.strip().lower() for x in kalender_ausschluss if x.strip()]
            if max_pro_woche is not None:
                r["max_pro_woche"] = int(max_pro_woche) or None
            if gueltig_bis is not None:
                r["gueltig_bis"] = gueltig_bis[:10]
            self._s(z)
        self.c.audit.log("befugnis_geaendert", befugnis=rid)
        return {"ok": True}


def tools(core) -> list[Tool]:
    b = core.befugnisse
    return [
        Tool("befugnisse_liste", "Was JARVIS ohne Rückfrage darf (Befugnisse mit Grenzen) und welche Bereiche es gibt.",
             "befugnis.lesen", lambda: b.liste()),
        Tool("befugnis_erteilen",
             "Neue Befugnis NUR auf ausdrücklichen Wunsch des Nutzers: Bereich (kalender_privat, erinnerungen, einkauf, "
             "fristen, notizen, tesla_klima, gedaechtnis), optional Höchstzahl pro Woche und gültig bis.",
             "befugnis.erteilen", lambda bereich, titel="", max_pro_woche=None, gueltig_bis="":
                 b.erteilen(bereich, titel, max_pro_woche, gueltig_bis),
             {"bereich": S("Bereich", enum=list(BEREICHE)), "titel": S("in den Worten des Nutzers"),
              "max_pro_woche": {"type": "integer"}, "gueltig_bis": S("JJJJ-MM-TT, optional")}, ["bereich"],
             label=lambda a: f"Befugnis erteilen: {BEREICHE.get(a.get('bereich'), ('?',))[0]}"
                             + (f", max. {a['max_pro_woche']}/Woche" if a.get("max_pro_woche") else "")
                             + (f", bis {a['gueltig_bis']}" if a.get("gueltig_bis") else "")),
        Tool("befugnis_entziehen",
             "Befugnis sofort entziehen (id, Bereich oder Teil des Titels); alle=true ist die Notbremse für alle Befugnisse.",
             "befugnis.entziehen", lambda wer="", alle=False: b.entziehen(wer, alle),
             {"wer": S("id, Bereich oder Teil des Titels"), "alle": {"type": "boolean"}}),
    ]
