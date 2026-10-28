"""Lagebild für das Dashboard. Jede Quelle hat ihre eigene Gültigkeitsdauer,
damit z. B. das Wetter nicht jede Minute neu abgefragt wird. Fällt eine Quelle
aus, bleibt der Rest des Lagebilds sichtbar."""
import json
import threading
import time
from datetime import date, datetime, timedelta

from atlas.paths import read_private_json, write_private_json
from atlas.tools import kontakte
from atlas.tools.mail import Mail
from atlas.tools.wetter import wetter
from atlas.tools.zeit import TZ

TTL = {"termine": 600, "erinnerungen": 120, "mail": 120, "geburtstage": 6 * 3600, "wetter": 1800}
SETTINGS = "dashboard.json"


def _frist_tage(frist: str):
    try:
        return (datetime.strptime(frist.strip(), "%d.%m.%Y").date() - date.today()).days
    except (ValueError, AttributeError):
        return None


class Lagebild:
    def __init__(self, core):
        self.c = core
        self.cache: dict[str, tuple[float, object, str]] = {}
        self.lock = threading.Lock()

    # ---------- Einstellungen (privat, je Nutzer) ----------
    def settings(self) -> dict:
        return read_private_json(SETTINGS, {"erinnerungen_ausblenden": []})

    def save_settings(self, data: dict) -> dict:
        cur = self.settings()
        cur.update({k: v for k, v in data.items()
                    if k in ("erinnerungen_ausblenden", "stimme_ausgabe", "weckwort", "stil", "klang", "rein",
                             "gespraech", "unterbrechen", "einfuehrung_gesehen", "einfuehrung_offen", "avatar_modus")})
        write_private_json(SETTINGS, cur)
        self.cache.pop("erinnerungen", None)
        return cur

    def invalidate(self, *keys):
        for k in keys or list(self.cache):
            self.cache.pop(k, None)

    # ---------- Quellen ----------
    def _get(self, key, fn, force=False):
        ts, val, err = self.cache.get(key, (0, None, ""))
        if force or time.time() - ts > TTL[key]:
            try:
                val, err = fn(), ""
            except Exception as e:
                err = str(e)[:160]
                val = val if val is not None else []
            self.cache[key] = (time.time(), val, err)
        return val, err

    def _termine(self):
        t = self.c.tools.get("kalender_termine")
        if not t:
            return []
        return t.func(von=date.today().isoformat(), bis=(date.today() + timedelta(days=13)).isoformat())

    def _erinnerungen(self):
        t = self.c.tools.get("erinnerungen_offen")
        return (t.func() or []) if t else []

    def _mail(self):
        if not self.c.secrets.get("icloud_app_pw"):
            raise RuntimeError("iCloud-Mail nicht eingerichtet")
        return Mail(self.c.secrets).kurzinfo(5)

    # ---------- Gesamtbild ----------
    def build(self, force: bool = False) -> dict:
        with self.lock:
            return self._build(force)

    def _build(self, force):
        c, fehler = self.c, {}
        heute, morgen = date.today().isoformat(), (date.today() + timedelta(days=1)).isoformat()

        termine, e = self._get("termine", self._termine, force)
        if e: fehler["termine"] = e
        alle_erinn, e = self._get("erinnerungen", self._erinnerungen, force)
        if e: fehler["erinnerungen"] = e
        mail, e = self._get("mail", self._mail, force)
        if e: fehler["mail"] = e
        geb, e = self._get("geburtstage", lambda: kontakte.geburtstage(14), force)
        if e: fehler["geburtstage"] = e
        wet, e = self._get("wetter", lambda: wetter(c.cfg["wetter"], tage=2), force)
        if e: fehler["wetter"] = e

        aus = set(self.settings().get("erinnerungen_ausblenden", []))
        listen = sorted({r.get("liste", "") for r in alle_erinn})
        erinn = [r for r in alle_erinn if r.get("liste") not in aus]
        erinn.sort(key=lambda r: (r.get("faellig") is None, r.get("faellig") or ""))

        vorg = c.memory.vorgaenge_liste()
        for v in vorg:
            v["tage"] = _frist_tage(v.get("frist", ""))
        vorg.sort(key=lambda v: (v["tage"] is None, v["tage"] if v["tage"] is not None else 0))

        # Zeitleiste 14 Tage
        zl = [{"datum": t["datum"], "zeit": t.get("zeit"), "typ": "termin", "titel": t["titel"]}
              for t in termine or [] if t.get("datum")]
        for r in erinn:
            if r.get("faellig"):
                d = datetime.fromisoformat(r["faellig"].replace("Z", "+00:00")).astimezone(TZ)
                zl.append({"datum": d.date().isoformat(), "zeit": d.strftime("%H:%M"),
                           "typ": "faellig", "titel": r["titel"]})
        for v in vorg:
            if v["tage"] is not None and -7 <= v["tage"] <= 13:
                zl.append({"datum": (date.today() + timedelta(days=v["tage"])).isoformat(),
                           "zeit": None, "typ": "frist", "titel": v["titel"]})
        try:
            zl += c.fristen.zeitleiste(13)
        except Exception:
            pass
        for g in geb or []:
            zl.append({"datum": g["datum"], "zeit": None, "typ": "geburtstag",
                       "titel": f"{g['name']}" + (f" ({g['alter']})" if g.get("alter") else "")})

        return {
            "zeit": datetime.now().isoformat(timespec="seconds"),
            "termine": [t for t in termine or [] if t.get("datum") in (heute, morgen)],
            "erinnerungen": erinn[:10], "erinnerungslisten": listen, "ausgeblendet": sorted(aus),
            "mail": mail or {}, "geburtstage": geb or [], "wetter": wet or {},
            "vorgaenge": vorg, "zeitleiste": zl,
            "index": c.index_status(), "kosten": c.costs(), "aktionen": c.audit.tail(8),
            "fehler": fehler,
        }
