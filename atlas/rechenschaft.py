"""Rechenschaft und Rückgängig – „Was hast du heute ohne mich gemacht – und warum?“

Liest das Audit-Protokoll (alle Macs, über den gemeinsamen Log-Ordner) und ordnet jede Aktion ein:
per Befugnis, nach Bestätigung, gemeldet, abgelehnt/gesperrt – mit Kanal (Dashboard, Telegram, Stab …)
und Hinweis auf fremden Inhalt. Für ausgewählte Werkzeuge merkt sich JARVIS die Gegenaktion, damit
eine Aktion mit einem Klick (oder Satz) zurückgenommen werden kann.
"""
import json
import secrets
import threading
from datetime import date, datetime, timedelta

from atlas.paths import read_private_json, write_private_json
from atlas.tools import S, Tool, ToolError

DATEI = "rueckgaengig.json"
HALTEN_TAGE = 7
LESEND = (".lesen", "anzeige", "karte", "timer", "musik", "web.lesen")


def _gegenaktion(werkzeug: str, args: dict, ergebnis) -> dict | None:
    """Welche Werkzeugaktion macht diese Aktion rückgängig? None = nicht umkehrbar."""
    e = ergebnis if isinstance(ergebnis, dict) else {}
    if werkzeug == "kalender_anlegen" and e.get("uid"):
        return {"werkzeug": "kalender_loeschen", "args": {"uid": e["uid"]},
                "text": f"Termin „{e.get('angelegt', '')}“ wieder löschen"}
    if werkzeug == "kalender_verschieben" and e.get("uid") and e.get("alt_start"):
        alt = datetime.fromisoformat(e["alt_start"])
        return {"werkzeug": "kalender_verschieben",
                "args": {"uid": e["uid"], "neuer_start": e["alt_start"], "neues_ende": e.get("alt_ende", "")},
                "text": f"„{e.get('verschoben', '')}“ zurück auf {alt:%d.%m. %H:%M}"}
    if werkzeug == "datei_verschieben" and e.get("nach") and args.get("von"):
        return {"werkzeug": "datei_verschieben", "args": {"von": e["nach"], "nach": args["von"]},
                "text": f"„{e['nach']}“ zurück nach „{args['von']}“"}
    if werkzeug == "frist_eintragen" and e.get("id") and not e.get("vorhanden"):
        return {"werkzeug": "frist_erledigt", "args": {"frist": e["id"]},
                "text": f"Frist „{e.get('titel', '')}“ wieder austragen"}
    if werkzeug == "tesla_klima" and "an" in args:
        return {"werkzeug": "tesla_klima", "args": {"an": not args["an"]},
                "text": f"Tesla-Klima wieder {'aus' if args['an'] else 'an'}"}
    if werkzeug == "einkauf_hinzufuegen" and args.get("artikel"):
        return {"werkzeug": "einkauf_erledigt", "args": {"artikel": args["artikel"]},
                "text": "Artikel wieder von der Einkaufsliste nehmen"}
    if werkzeug == "einkauf_erledigt" and args.get("artikel"):
        return {"werkzeug": "einkauf_hinzufuegen", "args": {"artikel": args["artikel"]},
                "text": "Artikel wieder auf die Einkaufsliste setzen"}
    if werkzeug == "mail_wache_setzen" and (e.get("wache") or {}).get("id"):
        return {"werkzeug": "mail_wache_beenden", "args": {"id": e["wache"]["id"]}, "text": "Mail-Wache wieder beenden"}
    return None


class Rechenschaft:
    def __init__(self, core):
        self.c = core
        self.lock = threading.Lock()

    # ------------------------------------------------------------ Rückgängig-Speicher
    def _z(self) -> dict:
        z = read_private_json(DATEI, {"eintraege": []})
        grenze = (datetime.now() - timedelta(days=HALTEN_TAGE)).isoformat()
        z["eintraege"] = [x for x in z["eintraege"] if x["zeit"] >= grenze]
        return z

    def merken(self, werkzeug: str, args: dict, ergebnis) -> str:
        """Nach erfolgreicher Aktion aufrufen. Gibt die Rückgängig-id zurück (oder "")."""
        try:
            g = _gegenaktion(werkzeug, args or {}, ergebnis)
        except Exception:
            g = None
        if not g:
            return ""
        rid = "r" + secrets.token_hex(3)
        with self.lock:
            z = self._z()
            z["eintraege"].append({"id": rid, "zeit": datetime.now().isoformat(timespec="seconds"),
                                   "werkzeug": werkzeug, "gegen": g, "erledigt": False})
            write_private_json(DATEI, z)
        return rid

    def offen(self) -> dict:
        return {x["id"]: x for x in self._z()["eintraege"] if not x["erledigt"]}

    def beschreiben(self, rid: str) -> str:
        x = self.offen().get(rid)
        return x["gegen"]["text"] if x else f"Rückgängig {rid} (nicht mehr möglich)"

    def rueckgaengig(self, rid: str) -> dict:
        x = self.offen().get(rid)
        if not x:
            raise ToolError("Diese Aktion lässt sich nicht (mehr) rückgängig machen – älter als 7 Tage, schon "
                            "zurückgenommen oder nicht umkehrbar.")
        g = x["gegen"]
        tool = self.c.tools.get(g["werkzeug"])
        if not tool:
            raise ToolError(f"Werkzeug {g['werkzeug']} nicht verfügbar")
        ergebnis = tool.func(**g["args"])
        with self.lock:
            z = self._z()
            for e in z["eintraege"]:
                if e["id"] == rid:
                    e["erledigt"] = datetime.now().isoformat(timespec="seconds")
            write_private_json(DATEI, z)
        self.c.audit.log("rueckgaengig", id=rid, werkzeug=g["werkzeug"], was=g["text"])
        return {"rueckgaengig": g["text"], "ergebnis": ergebnis}

    # ------------------------------------------------------------ Protokoll lesen
    def _eintraege(self, tage: int) -> list[dict]:
        a = self.c.audit
        tage_namen = {(date.today() - timedelta(days=i)).isoformat() for i in range(max(1, tage))}
        dateien = {}
        for ordner in (a.cloud_logs, a.local_logs):              # lokal gewinnt (aktueller)
            try:
                for f in ordner.glob("*.jsonl"):
                    if f.name[:10] in tage_namen:
                        dateien[f.name] = f
            except OSError:
                pass
        out = []
        for f in dateien.values():
            try:
                for z in f.read_text(encoding="utf-8").splitlines():
                    try:
                        out.append(json.loads(z))
                    except ValueError:
                        pass
            except OSError:
                pass
        return sorted(out, key=lambda e: e.get("ts", ""))

    def bericht(self, tage: int = 1) -> dict:
        tage = max(1, min(int(tage or 1), 14))
        bef = {r["id"]: r["titel"] for r in (self.c.befugnisse.liste()["befugnisse"]
                                             if hasattr(self.c, "befugnisse") else [])}
        offen = self.offen()
        aktionen, abgelehnt, vorfaelle, bestaetigt = [], [], [], []
        letzte_best = {}
        for e in self._eintraege(tage):
            ev = e.get("event")
            if ev == "bestaetigung":
                letzte_best[e.get("aktion")] = e
                if not e.get("erteilt"):
                    abgelehnt.append({"zeit": e["ts"], "was": e.get("was") or e.get("aktion"), "grund": "von dir abgelehnt",
                                      "fremd": bool(e.get("fremd"))})
            elif ev == "werkzeug_verweigert":
                abgelehnt.append({"zeit": e["ts"], "was": e.get("werkzeug"), "grund": "gesperrt",
                                  "fremd": bool(e.get("fremd"))})
            elif ev == "injection_verdacht":
                vorfaelle.append({"zeit": e["ts"], "quelle": e.get("quelle"),
                                  "zitat": ((e.get("treffer") or [{}])[0]).get("zitat", "")})
            elif ev == "rueckgaengig":
                aktionen.append({"zeit": e["ts"], "was": f"↺ {e.get('was')}", "warum": "auf deinen Wunsch rückgängig",
                                 "kanal": "", "host": e.get("host")})
            elif ev == "werkzeug" and e.get("erfolg"):
                akt = e.get("aktion", "")
                if akt.endswith(LESEND) or akt in LESEND or e.get("stufe") == "FREI" and akt.endswith(".lesen"):
                    continue
                if e.get("stufe") == "FREI" and not e.get("befugnis"):
                    # freie, nicht lesende Aktionen (z. B. Einkaufsliste) trotzdem zeigen
                    pass
                if e.get("befugnis"):
                    warum = f"per Befugnis „{bef.get(e['befugnis'], e['befugnis'])}“"
                elif e.get("stufe") == "BESTAETIGEN":
                    warum = "von dir bestätigt"
                elif e.get("stufe") == "MELDEN":
                    warum = "erlaubt, danach gemeldet"
                elif e.get("stufe") == "FREI":
                    warum = "frei erlaubt"
                else:
                    warum = "bestätigt" if letzte_best.get(akt, {}).get("erteilt") else "erledigt"
                rk = e.get("rueckgaengig", "")
                aktionen.append({"zeit": e["ts"], "was": e.get("was") or e.get("werkzeug"), "werkzeug": e.get("werkzeug"),
                                 "warum": warum, "kanal": e.get("kanal") or e.get("quelle") or "",
                                 "fremd": e.get("fremd") or [], "host": e.get("host"),
                                 "rueckgaengig": rk if rk in offen else "",
                                 "rueckgaengig_text": offen[rk]["gegen"]["text"] if rk in offen else ""})
        selbst = [a for a in aktionen if a["warum"].startswith(("per Befugnis", "erlaubt", "frei"))]
        return {"zeitraum_tage": tage, "aktionen": aktionen[::-1][:150], "ohne_dich": len(selbst),
                "abgelehnt": abgelehnt[::-1][:50], "sicherheit": vorfaelle[::-1][:30],
                "zusammenfassung": f"{len(aktionen)} Aktionen, davon {len(selbst)} ohne Rückfrage; "
                                   f"{len(abgelehnt)} abgelehnt/gesperrt; {len(vorfaelle)} Sicherheitsvorfälle."}


def tools(core) -> list[Tool]:
    r = core.rechenschaft
    return [
        Tool("rechenschaft",
             "Rechenschaft: Was JARVIS getan hat (ohne Rückfrage, nach Bestätigung, abgelehnt) – mit Grund, Kanal und "
             "Rückgängig-ids – sowie erkannte Sicherheitsvorfälle. Zeigt das Fenster im Dashboard.",
             "rechenschaft.lesen",
             lambda tage=1: (core.broadcast({"type": "rechenschaft", "tage": int(tage or 1)}), r.bericht(tage))[1],
             {"tage": {"type": "integer", "description": "Zeitraum in Tagen (Standard 1 = heute)"}}),
        Tool("rueckgaengig", "Eine Aktion rückgängig machen (id aus 'rechenschaft').", "rueckgaengig",
             lambda id: r.rueckgaengig(id), {"id": S("Rückgängig-id, z. B. r3fa21c")}, ["id"],
             label=lambda a: "Rückgängig: " + r.beschreiben(a.get("id", ""))),
    ]
