"""Wochenplanung: Überblick über die kommende Woche – Termine, Fälliges, Zahlungen, Fristen, Post.

Sonntagabend automatisch (Dashboard, Mitteilung, Telegram), sonst jederzeit über das Werkzeug
'wochenplan'. Wird lokal zusammengestellt; kein Inhalt geht dafür in die Cloud."""
from datetime import date, datetime, timedelta

from atlas.paths import read_private_json, write_private_json
from atlas.tools import Tool
from atlas.tools.zeit import TZ

TAGE = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"]


def _start(heute: date | None = None) -> date:
    """Ab Samstag gilt die kommende Woche, sonst die laufende ab heute."""
    heute = heute or date.today()
    return heute + timedelta(days=7 - heute.weekday()) if heute.weekday() >= 5 else heute


def bauen(core, start: date | None = None) -> dict:
    c = core
    von = start or _start()
    bis = von + timedelta(days=6 - von.weekday()) if von.weekday() < 6 else von + timedelta(days=6)
    if (bis - von).days < 4:                       # Donnerstag/Freitag: bis Sonntag der Folgewoche
        bis += timedelta(days=7)
    tage: dict[date, list[str]] = {von + timedelta(days=i): [] for i in range((bis - von).days + 1)}
    gewicht: dict[date, int] = {d: 0 for d in tage}
    fehler, extra = [], []

    def tag_von(iso: str) -> date | None:
        try:
            return date.fromisoformat(iso[:10])
        except (TypeError, ValueError):
            return None

    # Termine
    t = c.tools.get("kalender_termine")
    if t:
        try:
            for x in t.func(von=von.isoformat(), bis=bis.isoformat()) or []:
                d = tag_von(x.get("datum"))
                if d in tage:
                    tage[d].append(f"{x.get('zeit') or 'ganztägig'} {x['titel']}")
                    gewicht[d] += 1
        except Exception as e:
            fehler.append(f"Kalender: {e}"[:80])
    # Erinnerungen mit Fälligkeit (und Überfälliges)
    ueberfaellig = []
    t = c.tools.get("erinnerungen_offen")
    if t:
        try:
            for r in t.func() or []:
                if not r.get("faellig"):
                    continue
                d = datetime.fromisoformat(r["faellig"].replace("Z", "+00:00")).astimezone(TZ).date()
                if d < von:
                    ueberfaellig.append(r["titel"])
                elif d in tage:
                    tage[d].append(f"▲ {r['titel']}")
        except Exception as e:
            fehler.append(f"Erinnerungen: {e}"[:80])
    # Fristen
    try:
        for f in c.fristen.liste(tage=(bis - date.today()).days)["fristen"]:
            d = date.fromisoformat(f["datum"])
            if d in tage:
                tage[d].append(f"◆ {f['art']}: {f['titel']}")
                gewicht[d] += 1
            elif d < von and not f["erledigt"]:
                ueberfaellig.append(f"{f['art']}: {f['titel']}")
    except Exception as e:
        fehler.append(f"Fristen: {e}"[:80])
    # Arztrechnungen: Überweisungen und offene Anträge
    try:
        if c.beihilfe.aktiv:
            for x in c.beihilfe.excel_zeilen():
                if x["kind"] and not x["ueberwiesen"] and x["ziel"] and x["betrag"] is not None:
                    from atlas.workflows.beihilfe import euro
                    if x["ziel"] in tage:
                        tage[x["ziel"]].append(f"€ Überweisen: {x['kind']} {x['nr']} ({euro(x['betrag'])})")
                    elif x["ziel"] < von:
                        ueberfaellig.append(f"Überweisung {x['kind']} {x['nr']} ({euro(x['betrag'])})")
            st = c.beihilfe.status()
            n_bh, n_pkv = len(st["beihilfe_beantragen"]), len(st["pkv_beantragen"])
            if n_bh or n_pkv:
                extra.append(f"Anträge offen: {n_bh}× Beihilfe, {n_pkv}× PKV.")
    except Exception as e:
        fehler.append(f"Beihilfe: {e}"[:80])
    # Post
    try:
        z = c.post.briefing_zeile()
        if z:
            extra.append(z)
    except Exception:
        pass
    # Geburtstage
    try:
        from atlas.tools import kontakte
        for g in kontakte.geburtstage((bis - date.today()).days + 1) or []:
            d = tag_von(g.get("datum"))
            if d in tage:
                tage[d].append(f"★ {g['name']}" + (f" ({g['alter']})" if g.get("alter") else ""))
    except Exception:
        pass

    # Text
    zeilen = [f"Wochenplan {von:%d.%m.} – {bis:%d.%m.%Y}"]
    if ueberfaellig:
        zeilen.append("Überfällig: " + "; ".join(ueberfaellig[:6]) + ".")
    for d, eintraege in tage.items():
        if eintraege:
            zeilen.append(f"{TAGE[d.weekday()]} {d:%d.%m.}: " + " · ".join(eintraege))
    engpass = [f"{TAGE[d.weekday()]} ({n} Termine/Fristen)" for d, n in gewicht.items() if n >= 3]
    frei_ = [TAGE[d.weekday()] for d, e in tage.items() if not e and d.weekday() < 5]
    if engpass:
        zeilen.append("Eng wird es am " + ", ".join(engpass) + ".")
    if frei_:
        zeilen.append("Noch frei: " + ", ".join(frei_) + " – gut für Liegengebliebenes.")
    zeilen += extra
    if len(zeilen) == 1:
        zeilen.append("Keine Termine, Fristen oder Fälligkeiten.")
    return {"text": "\n".join(zeilen), "von": von.isoformat(), "bis": bis.isoformat(),
            "ueberfaellig": ueberfaellig, "engpaesse": engpass, "fehler": fehler}


class Wochenplan:
    def __init__(self, core):
        self.c = core
        self.cfg = core.cfg.get("wochenplan") or {}

    def name(self) -> str:
        j, w, _ = (date.today() + timedelta(days=1)).isocalendar()      # Sonntag zählt zur Folgewoche
        return f"wochenplan_{j}-W{w:02d}.json"

    def faellig(self) -> bool:
        if not self.cfg.get("aktiv", True):
            return False
        jetzt = datetime.now()
        hh, mm = map(int, str(self.cfg.get("zeit", "19:00")).split(":")[:2])
        return (jetzt.weekday() == int(self.cfg.get("wochentag", 6))
                and jetzt.time() >= jetzt.replace(hour=hh, minute=mm).time()
                and not read_private_json(self.name(), {}).get("text"))

    def senden(self) -> dict:
        from atlas.proaktiv import macos_notify
        p = bauen(self.c)
        write_private_json(self.name(), {"text": p["text"], "zeit": datetime.now().isoformat(timespec="minutes")})
        self.c.audit.log("wochenplan", laenge=len(p["text"]))
        self.c.broadcast({"type": "wochenplan", "text": p["text"]})
        try:
            self.c.proaktiv.telegram.send("🗓 " + p["text"])
        except Exception:
            pass
        macos_notify("JARVIS · Wochenplan", p["text"].split("\n", 1)[-1][:200])
        return p


def tools(core) -> list[Tool]:
    return [Tool("wochenplan",
                 "Überblick über die (kommende) Woche: Termine je Tag, fällige Erinnerungen, Fristen, "
                 "Überweisungen, offene Anträge und Post, Engpässe und freie Tage.",
                 "kalender.lesen", lambda: bauen(core))]
