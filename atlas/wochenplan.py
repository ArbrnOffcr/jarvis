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

    # Die Quellen (Kalender, Erinnerungen, Fristen, Excel, Post, Kontakte) werden GLEICHZEITIG abgefragt – vorher
    # nacheinander (über 30 s, weil Erinnerungen/Kontakte/Excel jeweils mehrere Sekunden brauchen). Jede Quelle
    # schreibt in ihren eigenen Zettel; zusammengeführt wird in fester Reihenfolge, das Ergebnis bleibt gleich.
    import time as _t
    from concurrent.futures import ThreadPoolExecutor

    class Zettel:
        def __init__(self):
            self.tage = {d: [] for d in tage}
            self.gewicht = {d: 0 for d in tage}
            self.ueberfaellig, self.extra, self.fehler, self.s = [], [], [], 0.0

    def _termine(z):   # Termine
        t = c.tools.get("kalender_termine")
        if t:
            try:
                for x in t.func(von=von.isoformat(), bis=bis.isoformat()) or []:
                    d = tag_von(x.get("datum"))
                    if d in tage:
                        z.tage[d].append(f"{x.get('zeit') or 'ganztägig'} {x['titel']}")
                        z.gewicht[d] += 1
            except Exception as e:
                z.fehler.append(f"Kalender: {e}"[:80])

    def _erinnerungen(z):   # Erinnerungen mit Fälligkeit (und Überfälliges)
        t = c.tools.get("erinnerungen_offen")
        if t:
            try:
                for r in t.func() or []:
                    if not r.get("faellig"):
                        continue
                    d = datetime.fromisoformat(r["faellig"].replace("Z", "+00:00")).astimezone(TZ).date()
                    if d < von:
                        z.ueberfaellig.append(r["titel"])
                    elif d in tage:
                        z.tage[d].append(f"▲ {r['titel']}")
            except Exception as e:
                z.fehler.append(f"Erinnerungen: {e}"[:80])

    def _fristen(z):   # Fristen
        try:
            for f in c.fristen.liste(tage=(bis - date.today()).days)["fristen"]:
                d = date.fromisoformat(f["datum"])
                if d in tage:
                    z.tage[d].append(f"◆ {f['art']}: {f['titel']}")
                    z.gewicht[d] += 1
                elif d < von and not f["erledigt"]:
                    z.ueberfaellig.append(f"{f['art']}: {f['titel']}")
        except Exception as e:
            z.fehler.append(f"Fristen: {e}"[:80])

    def _beihilfe(z):   # Arztrechnungen: Überweisungen und offene Anträge
        try:
            if c.beihilfe.aktiv:
                for x in c.beihilfe.excel_zeilen():
                    if x["kind"] and not x["ueberwiesen"] and x["ziel"] and x["betrag"] is not None:
                        from atlas.workflows.beihilfe import euro
                        if x["ziel"] in tage:
                            z.tage[x["ziel"]].append(f"€ Überweisen: {x['kind']} {x['nr']} ({euro(x['betrag'])})")
                        elif x["ziel"] < von:
                            z.ueberfaellig.append(f"Überweisung {x['kind']} {x['nr']} ({euro(x['betrag'])})")
                st = c.beihilfe.status()
                n_bh, n_pkv = len(st["beihilfe_beantragen"]), len(st["pkv_beantragen"])
                if n_bh or n_pkv:
                    z.extra.append(f"Anträge offen: {n_bh}× Beihilfe, {n_pkv}× PKV.")
        except Exception as e:
            z.fehler.append(f"Beihilfe: {e}"[:80])

    def _post(z):   # Post
        try:
            zeile = c.post.briefing_zeile()
            if zeile:
                z.extra.append(zeile)
        except Exception:
            pass

    def _geburtstage(z):   # Geburtstage
        try:
            from atlas.tools import kontakte
            for g in kontakte.geburtstage((bis - date.today()).days + 1) or []:
                d = tag_von(g.get("datum"))
                if d in tage:
                    z.tage[d].append(f"★ {g['name']}" + (f" ({g['alter']})" if g.get("alter") else ""))
        except Exception:
            pass

    quellen = [_termine, _erinnerungen, _fristen, _beihilfe, _post, _geburtstage]

    def lauf(fn):
        z, t0 = Zettel(), _t.monotonic()
        try:
            fn(z)
        except Exception as e:
            z.fehler.append(f"{fn.__name__[1:]}: {e}"[:80])
        z.s = round(_t.monotonic() - t0, 2)
        return z
    with ThreadPoolExecutor(max_workers=len(quellen), thread_name_prefix="wochenplan") as pool:
        zettel = list(pool.map(lauf, quellen))
    ueberfaellig = []
    for z in zettel:                                # feste Reihenfolge wie bisher
        for d in tage:
            tage[d] += z.tage[d]
            gewicht[d] += z.gewicht[d]
        ueberfaellig += z.ueberfaellig
        extra += z.extra
        fehler += z.fehler
    try:
        c.audit.log("wochenplan", teile={fn.__name__[1:]: z.s for fn, z in zip(quellen, zettel)})
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
