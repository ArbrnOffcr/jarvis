"""„Was habe ich vergessen?“ – einmal pro Woche (Freitagnachmittag) und auf Nachfrage.

Gleicht alles Liegengebliebene ab und nennt die drei wichtigsten Punkte: überfällige Fristen und
Zahlungen, überfällige Erinnerungen, Vorgänge mit Frist, länger ungelesene wichtige Mails, nicht
abgelegte Post, offene Beihilfe-/PKV-Anträge. Alles lokal zusammengestellt."""
import re
from datetime import date, datetime, timedelta

from atlas.paths import read_private_json, write_private_json
from atlas.tools import Tool
from atlas.tools.zeit import TZ

UNWICHTIG = re.compile(r"newsletter|no-?reply|noreply|werbung|angebot|rabatt|sale|%|gutschein|deals?|"
                       r"benachrichtigung|notification|update|digest", re.I)


def pruefen(core) -> dict:
    c, heute, punkte = core, date.today(), []          # (gewicht, text)

    def add(g, t):
        punkte.append((g, t))

    try:
        for f in c.fristen.liste(tage=7)["fristen"]:
            if f["in_tagen"] < 0:
                add(100 - f["in_tagen"], f"{f['art']} „{f['titel']}“ ist seit {-f['in_tagen']} Tagen überschritten.")
            elif f["in_tagen"] <= 3:
                add(70 - f["in_tagen"] * 5, f"{f['art']} „{f['titel']}“ läuft in {f['in_tagen']} Tagen ab.")
    except Exception:
        pass
    try:
        if c.beihilfe.aktiv:
            from atlas.workflows.beihilfe import euro
            for x in c.beihilfe.excel_zeilen():
                if x["kind"] and not x["ueberwiesen"] and x["ziel"] and x["ziel"] < heute:
                    add(95, f"Arztrechnung {x['kind']} {x['nr']} ({euro(x['betrag'])}) ist seit {(heute - x['ziel']).days} Tagen fällig.")
                elif x["kind"] and x["datum"] and not x["bh_antrag"] and (heute - x["datum"]).days > 21:
                    add(40, f"Beihilfe-Antrag für {x['kind']} {x['nr']} steht seit über drei Wochen aus.")
    except Exception:
        pass
    t = c.tools.get("erinnerungen_offen")
    if t:
        try:
            alt = []
            for r in t.func() or []:
                if r.get("faellig"):
                    d = datetime.fromisoformat(r["faellig"].replace("Z", "+00:00")).astimezone(TZ).date()
                    if (heute - d).days >= 2:
                        alt.append(((heute - d).days, r["titel"]))
            for tage, titel in sorted(alt, reverse=True)[:3]:
                add(50 + min(tage, 30), f"Erinnerung „{titel}“ ist seit {tage} Tagen überfällig.")
        except Exception:
            pass
    try:
        for v in c.memory.vorgaenge_liste():
            try:
                tage = (datetime.strptime(v["frist"], "%d.%m.%Y").date() - heute).days
            except (ValueError, KeyError):
                continue
            if tage <= 5:
                add(80 - tage * 4, f"Vorgang „{v['titel']}“: Frist {v['frist']}, nächster Schritt: {v.get('naechster_schritt') or '?'}.")
    except Exception:
        pass
    try:
        o = c.post.offen()["offen"]
        if o:
            add(30 + len(o) * 3, f"{len(o)} gescannte Brief{'e' if len(o) != 1 else ''} noch nicht abgelegt.")
    except Exception:
        pass
    if c.secrets.get("icloud_app_pw"):
        try:
            from atlas.tools.mail import Mail
            for m in Mail(c.secrets).posteingang(30, nur_ungelesen=True):
                if UNWICHTIG.search(f"{m['von']} {m['betreff']}"):
                    continue
                dm = re.search(r"\d{2}\.\d{2}\.\d{4}", str(m.get("datum") or ""))
                if not dm:
                    continue
                d = datetime.strptime(dm.group(0), "%d.%m.%Y").date()
                tage = (heute - d).days
                if tage >= 3:
                    add(35 + min(tage, 20), f"Mail von {m['von'].split('<')[0].strip()} („{m['betreff'][:60]}“) seit {tage} Tagen ungelesen.")
        except Exception:
            pass
    punkte.sort(key=lambda p: -p[0])
    top = [t for _, t in punkte[:3]]
    return {"top3": top, "weitere": len(punkte) - len(top),
            "text": ("Das könnte untergegangen sein:\n" + "\n".join(f"{i + 1}. {t}" for i, t in enumerate(top))
                     + (f"\n(+{len(punkte) - 3} weitere Kleinigkeiten)" if len(punkte) > 3 else ""))
            if top else "Nichts liegengeblieben – alles im Griff."}


class Vergessen:
    def __init__(self, core):
        self.c = core
        self.cfg = core.cfg.get("vergessen") or {}

    def faellig(self) -> bool:
        if not self.cfg.get("aktiv", True):
            return False
        jetzt = datetime.now()
        hh, mm = map(int, str(self.cfg.get("zeit", "16:00")).split(":")[:2])
        woche = f"{jetzt.isocalendar()[0]}-W{jetzt.isocalendar()[1]:02d}"
        return (jetzt.weekday() == int(self.cfg.get("wochentag", 4)) and jetzt.time() >= jetzt.replace(hour=hh, minute=mm).time()
                and read_private_json("vergessen.json", {}).get("woche") != woche)

    def senden(self) -> dict:
        from atlas.proaktiv import macos_notify
        r = pruefen(self.c)
        j = datetime.now().isocalendar()
        write_private_json("vergessen.json", {"woche": f"{j[0]}-W{j[1]:02d}", "text": r["text"]})
        self.c.broadcast({"type": "vergessen", "text": r["text"], "top3": r["top3"]})
        try:
            self.c.proaktiv.telegram.send("🧭 " + r["text"])
        except Exception:
            pass
        if r["top3"]:
            macos_notify("JARVIS · Wochencheck", r["top3"][0])
        self.c.audit.log("vergessen", punkte=len(r["top3"]))
        return r


def tools(core) -> list[Tool]:
    return [Tool("was_vergessen",
                 "„Was habe ich vergessen?“: prüft überfällige Fristen, Zahlungen, Erinnerungen, Vorgänge, "
                 "länger ungelesene wichtige Mails und nicht abgelegte Post und nennt die drei wichtigsten Punkte.",
                 "kalender.lesen", lambda: pruefen(core))]
