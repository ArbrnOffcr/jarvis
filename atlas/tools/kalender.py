"""Kalender über iCloud (CalDAV) – inkl. Familienkalender und Serienterminen.
Abonnierte Kalender (Feiertage, Ferien ...) werden als ICS-Links eingebunden."""
import datetime as dt
import time
import uuid

import caldav
import httpx
import icalendar
import recurring_ical_events

from atlas.tools import S, Tool, ToolError
from atlas.tools.zeit import TZ, as_dt, fmt, parse

ICLOUD_CALDAV = "https://caldav.icloud.com"


class Kalender:
    def __init__(self, cfg: dict, secrets: dict):
        self.cfg = cfg.get("kalender", {})
        self.user = secrets.get("icloud_apple_id") or secrets.get("icloud_email")
        self.pw = secrets.get("icloud_app_pw")
        self._cals = None
        self._abo_cache: dict[str, tuple[float, icalendar.Calendar]] = {}

    # ---------- Verbindung ----------
    def calendars(self):
        if self._cals is None:
            if not (self.user and self.pw):
                raise ToolError("iCloud-Zugang fehlt – bitte 'jarvis setup' ausführen")
            try:
                client = caldav.DAVClient(url=ICLOUD_CALDAV, username=self.user,
                                          password=self.pw, timeout=30)
                self._cals = client.principal().calendars()
            except Exception as e:
                raise ToolError(f"iCloud-Kalender nicht erreichbar: {e}")
        return self._cals

    def _find(self, name: str | None):
        name = name or self.cfg.get("standard")
        cals = self.calendars()
        if not name:
            raise ToolError("Welcher Kalender? Verfügbar: " + ", ".join(c.name for c in cals))
        for c in cals:
            if c.name and c.name.lower() == name.lower():
                return c
        raise ToolError(f"Kalender '{name}' nicht gefunden. Verfügbar: "
                        + ", ".join(c.name for c in cals))

    def _by_uid(self, uid: str):
        for c in self.calendars():
            try:
                return c, c.event_by_uid(uid)
            except Exception:
                continue
        raise ToolError(f"Termin mit Kennung {uid} nicht gefunden")

    def _abo(self, url: str):
        ts, cal = self._abo_cache.get(url, (0, None))
        if time.time() - ts > 6 * 3600:
            r = httpx.get(url.replace("webcal://", "https://"), timeout=20,
                          follow_redirects=True)
            r.raise_for_status()
            cal = icalendar.Calendar.from_ical(r.content)
            self._abo_cache[url] = (time.time(), cal)
        return cal

    # ---------- Werkzeuge ----------
    def liste(self) -> dict:
        return {"kalender": [c.name for c in self.calendars()],
                "abonniert": [a["name"] for a in self.cfg.get("abos", [])],
                "standard": self.cfg.get("standard") or None}

    def termine(self, von: str, bis: str = "", suche: str = "", kalender: str = "") -> list:
        start = as_dt(parse(von))
        end = as_dt(parse(bis)) if bis else start + dt.timedelta(days=1)
        if bis and len(bis.strip()) == 10:          # Enddatum einschließen
            end += dt.timedelta(days=1)
        out = []
        for c in self.calendars():
            if kalender and (c.name or "").lower() != kalender.lower():
                continue
            try:
                found = c.search(start=start, end=end, event=True, expand=True)
            except Exception:
                continue
            for ev in found:
                out += self._rows(ev.icalendar_instance, c.name)
        for abo in self.cfg.get("abos", []):
            if kalender and abo["name"].lower() != kalender.lower():
                continue
            try:
                cal = self._abo(abo["url"])
                for comp in recurring_ical_events.of(cal).between(start, end):
                    out += self._rows_from(comp, abo["name"] + " (Abo)")
            except Exception:
                continue
        if suche:
            q = suche.lower()
            out = [e for e in out if q in (e["titel"] + e.get("ort", "")).lower()]
        out.sort(key=lambda e: e["_sort"])
        for e in out:
            e.pop("_sort")
        return out

    def _rows(self, cal, name):
        return [r for comp in cal.walk("VEVENT") for r in self._rows_from(comp, name)]

    @staticmethod
    def _rows_from(comp, name):
        s = comp.get("dtstart").dt
        e = comp.get("dtend").dt if comp.get("dtend") else s
        if not isinstance(s, dt.datetime) and e > s:     # Ende ist exklusiv
            e = e - dt.timedelta(days=1)
        row = {"titel": str(comp.get("summary", "(ohne Titel)")), "kalender": name,
               "beginn": fmt(s), "ende": fmt(e), "ganztag": not isinstance(s, dt.datetime),
               "uid": str(comp.get("uid", "")), "serie": bool(comp.get("rrule") or comp.get("recurrence-id")),
               "datum": as_dt(s).astimezone(TZ).date().isoformat(),
               "zeit": as_dt(s).astimezone(TZ).strftime("%H:%M") if isinstance(s, dt.datetime) else None,
               "_sort": as_dt(s).astimezone(TZ).isoformat()}
        if comp.get("location"):
            row["ort"] = str(comp.get("location"))
        return [row]

    def anlegen(self, titel: str, start: str, ende: str = "", kalender: str = "",
                ort: str = "", notiz: str = "", ganztag: bool = False) -> dict:
        cal = self._find(kalender)
        s = parse(start)
        if ganztag or not isinstance(s, dt.datetime):
            s = s.date() if isinstance(s, dt.datetime) else s
            e = parse(ende) if ende else s + dt.timedelta(days=1)
            e = e.date() if isinstance(e, dt.datetime) else e
            if e <= s:
                e = s + dt.timedelta(days=1)
        else:
            e = parse(ende) if ende else s + dt.timedelta(hours=1)
            s, e = s.astimezone(dt.timezone.utc), as_dt(e).astimezone(dt.timezone.utc)
        uid = str(uuid.uuid4()).upper()
        ev = icalendar.Event()
        ev.add("uid", uid)
        ev.add("dtstamp", dt.datetime.now(dt.timezone.utc))
        ev.add("summary", titel)
        ev.add("dtstart", s)
        ev.add("dtend", e)
        if ort:
            ev.add("location", ort)
        if notiz:
            ev.add("description", notiz)
        ical = icalendar.Calendar()
        ical.add("prodid", "-//JARVIS//DE")
        ical.add("version", "2.0")
        ical.add_component(ev)
        cal.save_event(ical.to_ical().decode())
        return {"angelegt": titel, "kalender": cal.name, "beginn": fmt(s), "uid": uid}

    def verschieben(self, uid: str, neuer_start: str, neues_ende: str = "") -> dict:
        cal, ev = self._by_uid(uid)
        comp = ev.icalendar_component
        if comp.get("rrule"):
            raise ToolError("Serientermine kann ich noch nicht verschieben – bitte in der Kalender-App ändern")
        old_s = comp.get("dtstart").dt
        old_e = comp.get("dtend").dt if comp.get("dtend") else old_s
        dauer = as_dt(old_e) - as_dt(old_s)
        s = as_dt(parse(neuer_start))
        e = as_dt(parse(neues_ende)) if neues_ende else s + dauer
        for key, val in (("dtstart", s), ("dtend", e)):
            if key in comp:
                del comp[key]
            comp.add(key, val.astimezone(dt.timezone.utc))
        ev.save()
        return {"verschoben": str(comp.get("summary")), "neu": fmt(s), "kalender": cal.name}

    def loeschen(self, uid: str) -> dict:
        cal, ev = self._by_uid(uid)
        titel = str(ev.icalendar_component.get("summary"))
        ev.delete()
        return {"geloescht": titel, "kalender": cal.name}


def tools(cfg, secrets) -> list[Tool]:
    k = Kalender(cfg, secrets)
    return [
        Tool("kalender_liste", "Listet alle verfügbaren Kalender (iCloud, Familie, Abos).",
             "kalender.lesen", k.liste),
        Tool("kalender_termine",
             "Termine in einem Zeitraum lesen. Ohne 'bis' wird ein Tag ab 'von' geliefert.",
             "kalender.lesen", k.termine,
             {"von": S("Beginn, JJJJ-MM-TT oder JJJJ-MM-TTTHH:MM"),
              "bis": S("Ende (inklusive), optional"),
              "suche": S("Filter auf Titel/Ort, optional"),
              "kalender": S("Nur dieser Kalender, optional")}, ["von"]),
        Tool("kalender_anlegen", "Neuen Termin anlegen.", "kalender.schreiben", k.anlegen,
             {"titel": S("Titel"), "start": S("Beginn JJJJ-MM-TTTHH:MM oder JJJJ-MM-TT (ganztägig)"),
              "ende": S("Ende, optional (Standard: 1 Stunde)"),
              "kalender": S("Kalendername, z. B. Familienkalender"),
              "ort": S("Ort, optional"), "notiz": S("Notiz, optional"),
              "ganztag": {"type": "boolean", "description": "Ganztägiger Termin"}},
             ["titel", "start"],
             label=lambda a: f"Termin „{a['titel']}“ am {a['start']} anlegen"),
        Tool("kalender_verschieben", "Termin (per uid) auf neue Zeit verschieben.",
             "kalender.schreiben", k.verschieben,
             {"uid": S("Kennung aus kalender_termine"), "neuer_start": S("Neuer Beginn"),
              "neues_ende": S("Neues Ende, optional (Dauer bleibt sonst gleich)")},
             ["uid", "neuer_start"],
             label=lambda a: f"Termin auf {a['neuer_start']} verschieben"),
        Tool("kalender_loeschen", "Termin (per uid) löschen.", "kalender.loeschen",
             k.loeschen, {"uid": S("Kennung aus kalender_termine")}, ["uid"],
             label=lambda a: "Termin löschen"),
    ]
