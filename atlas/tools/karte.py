"""Karte und Routen im Dashboard (OpenStreetMap-Daten, ohne Konto).

Orte: Photon (komoot), ersatzweise Nominatim. Routen: OSRM-Server der FOSSGIS (Auto, Fahrrad, zu Fuß) –
ohne Live-Verkehr. „In Apple Karten öffnen“ übergibt Start/Ziel an die Karten-App. „Wo ist?“ hat keine
Schnittstelle; JARVIS öffnet dafür die App."""
import subprocess
import time
from datetime import datetime, timedelta
from urllib.parse import quote

import httpx

from atlas.tools import S, Tool, ToolError

UA = {"User-Agent": "JARVIS-Privatassistent/1.0 (persoenlicher Assistent)", "Accept-Language": "de"}
PROFIL = {"auto": "routed-car", "fahrrad": "routed-bike", "rad": "routed-bike", "fuss": "routed-foot",
          "zu fuß": "routed-foot", "fuß": "routed-foot", "laufen": "routed-foot"}
APPLE_FLAG = {"routed-car": "d", "routed-bike": "w", "routed-foot": "w"}
RICHTUNG = {"left": "links", "right": "rechts", "slight left": "leicht links", "slight right": "leicht rechts",
            "sharp left": "scharf links", "sharp right": "scharf rechts", "straight": "geradeaus", "uturn": "wenden"}


class Karte:
    def __init__(self, core):
        self.c = core
        self.standort = None              # (lat, lon, zeit) vom iPhone/Browser, falls freigegeben
        self._cache: dict[str, list] = {}

    # ------------------------------------------------------------ Orte
    def heim(self) -> dict:
        w = self.c.cfg.get("wetter") or {}
        return {"name": w.get("ort") or "Zuhause", "label": w.get("ort") or "Zuhause",
                "lat": w.get("lat", 52.52), "lon": w.get("lon", 13.40)}

    def hier(self) -> dict:
        if self.standort and time.time() - self.standort[2] < 900:
            return {"name": "Aktueller Standort", "label": "Aktueller Standort",
                    "lat": self.standort[0], "lon": self.standort[1]}
        return self.heim()

    def suchen(self, q: str, n: int = 5) -> list[dict]:
        q = (q or "").strip()
        if not q:
            raise ToolError("Kein Ort angegeben")
        if q.lower() in ("zuhause", "zu hause", "daheim", "heim", "nach hause", "home"):
            return [self.heim()]
        if q.lower() in ("hier", "mein standort", "aktueller standort", "standort"):
            return [self.hier()]
        if q in self._cache:
            return self._cache[q]
        bias = self.hier()
        out = []
        try:
            r = httpx.get("https://photon.komoot.io/api/", params={"q": q, "limit": n, "lang": "de",
                          "lat": bias["lat"], "lon": bias["lon"]}, headers=UA, timeout=12)
            for f in r.json().get("features", []):
                p, (lon, lat) = f["properties"], f["geometry"]["coordinates"]
                teile = [p.get("name"), " ".join(x for x in (p.get("street"), p.get("housenumber")) if x),
                         " ".join(x for x in (p.get("postcode"), p.get("city") or p.get("town") or p.get("village")) if x),
                         p.get("country") if p.get("countrycode") not in ("DE", None) else None]
                label = ", ".join(dict.fromkeys(t for t in teile if t))
                out.append({"name": p.get("name") or label.split(",")[0], "label": label, "lat": lat, "lon": lon,
                            "art": p.get("osm_value") or ""})
        except (httpx.HTTPError, ValueError, KeyError):
            pass
        if not out:
            try:
                r = httpx.get("https://nominatim.openstreetmap.org/search",
                              params={"q": q, "format": "jsonv2", "limit": n, "accept-language": "de"},
                              headers=UA, timeout=12)
                out = [{"name": x.get("name") or x["display_name"].split(",")[0], "label": x["display_name"],
                        "lat": float(x["lat"]), "lon": float(x["lon"]), "art": x.get("type", "")} for x in r.json()]
            except (httpx.HTTPError, ValueError, KeyError):
                pass
        if not out:
            raise ToolError(f"Ort „{q}“ nicht gefunden")
        self._cache[q] = out
        return out

    # ------------------------------------------------------------ Anzeige
    def zeigen(self, orte: list[str] | str, titel: str = "") -> dict:
        if isinstance(orte, str):
            orte = [orte]
        punkte = []
        for o in orte[:12]:
            p = self.suchen(o, 1)[0]
            punkte.append({**p, "frage": o})
        self.c.broadcast({"type": "karte", "modus": "orte", "titel": titel or punkte[0]["name"], "punkte": punkte,
                          "apple": f"https://maps.apple.com/?q={quote(punkte[0]['label'])}&ll={punkte[0]['lat']},{punkte[0]['lon']}"})
        return {"gezeigt": [p["label"] for p in punkte],
                "hinweis": "Die Karte ist im Dashboard eingeblendet – nur kurz bestätigen, keine Koordinaten vorlesen."}

    def route(self, ziel: str, start: str = "", verkehrsmittel: str = "auto") -> dict:
        profil = PROFIL.get((verkehrsmittel or "auto").lower().strip(), "routed-car")
        a = self.suchen(start, 1)[0] if start else self.hier()
        b = self.suchen(ziel, 1)[0]
        try:
            r = httpx.get(f"https://routing.openstreetmap.de/{profil}/route/v1/driving/"
                          f"{a['lon']},{a['lat']};{b['lon']},{b['lat']}",
                          params={"overview": "full", "geometries": "geojson", "steps": "true"}, headers=UA, timeout=20)
            j = r.json()
        except (httpx.HTTPError, ValueError) as e:
            raise ToolError(f"Routendienst nicht erreichbar ({type(e).__name__})")
        if j.get("code") != "Ok" or not j.get("routes"):
            raise ToolError("Keine Route gefunden")
        rt = j["routes"][0]
        schritte = []
        for leg in rt["legs"]:
            for s in leg["steps"]:
                t = _schritt(s)
                if t:
                    schritte.append({"text": t, "m": round(s.get("distance", 0))})
        dauer, distanz = rt["duration"], rt["distance"]
        ankunft = (datetime.now() + timedelta(seconds=dauer)).strftime("%H:%M")
        apple = (f"https://maps.apple.com/?saddr={a['lat']},{a['lon']}&daddr={b['lat']},{b['lon']}"
                 f"&dirflg={APPLE_FLAG.get(profil, 'd')}")
        self.c.broadcast({"type": "karte", "modus": "route", "titel": f"{a['name']} → {b['name']}",
                          "start": a, "ziel": b, "linie": rt["geometry"]["coordinates"], "dauer": dauer,
                          "distanz": distanz, "ankunft": ankunft, "schritte": schritte[:40],
                          "verkehrsmittel": {"routed-car": "Auto", "routed-bike": "Fahrrad", "routed-foot": "zu Fuß"}[profil],
                          "apple": apple})
        return {"von": a["label"], "nach": b["label"], "dauer": _dauer(dauer), "distanz": _km(distanz),
                "ankunft_ca": ankunft, "verkehrsmittel": verkehrsmittel,
                "hinweis": "Ohne Live-Verkehr. Karte mit Route ist im Dashboard eingeblendet; nenne Dauer, Entfernung "
                           "und ungefähre Ankunft in einem Satz. Für Verkehrslage: Knopf „In Apple Karten“."}

    def apple_oeffnen(self, url: str) -> dict:
        if not url.startswith("https://maps.apple.com/"):
            raise ToolError("Ungültiger Karten-Link")
        subprocess.run(["open", url], capture_output=True, timeout=15)
        return {"geoeffnet": True}

    def wo_ist(self) -> dict:
        r = subprocess.run(["open", "-b", "com.apple.findmy"], capture_output=True, text=True, timeout=15)
        if r.returncode:
            raise ToolError("„Wo ist?“ ließ sich nicht öffnen")
        return {"geoeffnet": "Wo ist?",
                "hinweis": "Die App „Wo ist?“ ist geöffnet – unter „Personen“ stehen alle, die ihren Standort teilen. "
                           "JARVIS selbst kann diese Standorte nicht auslesen (Apple sperrt das)."}


def _km(m: float) -> str:
    return f"{m / 1000:.0f} km" if m >= 10000 else f"{m / 1000:.1f} km".replace(".", ",") if m >= 1000 else f"{m:.0f} m"


def _dauer(s: float) -> str:
    m = round(s / 60)
    return f"{m // 60} Std. {m % 60} Min." if m >= 60 else f"{max(1, m)} Min."


def _schritt(s: dict) -> str:
    m = s.get("maneuver") or {}
    typ, mod = m.get("type", ""), RICHTUNG.get(m.get("modifier", ""), "")
    name = s.get("name") or s.get("ref") or ""
    auf = f" auf {name}" if name else ""
    if typ == "depart":
        return f"Start{auf}"
    if typ == "arrive":
        return "Ziel erreicht"
    if typ in ("roundabout", "rotary", "roundabout turn"):
        return f"Im Kreisverkehr {m.get('exit', '')}. Ausfahrt{auf}".replace(" . ", " ")
    if typ == "merge":
        return f"Einfädeln{auf}"
    if typ == "on ramp":
        return f"Auffahrt{auf}"
    if typ == "off ramp":
        return f"Ausfahrt {mod}{auf}".strip()
    if typ == "fork":
        return f"An der Gabelung {mod} halten{auf}"
    if typ == "end of road":
        return f"Am Straßenende {mod} abbiegen{auf}"
    if typ in ("new name", "continue"):
        return f"Weiter{auf}" if mod in ("", "geradeaus") else f"{mod.capitalize()} halten{auf}"
    if typ == "turn":
        return "Wenden" if mod == "wenden" else f"{mod.capitalize()} abbiegen{auf}" if mod else ""
    return ""


def tools(core) -> list[Tool]:
    k = core.karte
    return [
        Tool("karte_zeigen", "Einen oder mehrere Orte (Adresse, Stadt, Sehenswürdigkeit, Firma) auf der Karte im "
             "Dashboard zeigen.", "karte", k.zeigen,
             {"orte": {"type": "array", "items": {"type": "string"}, "description": "Orte, z. B. ['Völkerschlachtdenkmal Leipzig']"},
              "titel": S("Überschrift, optional")}, ["orte"]),
        Tool("route_zeigen", "Route mit Dauer, Entfernung und Ankunft berechnen und animiert auf der Karte zeigen. "
             "Start leer = aktueller Standort bzw. Zuhause. Ohne Live-Verkehr.", "karte", k.route,
             {"ziel": S("Ziel"), "start": S("Start, optional"),
              "verkehrsmittel": S("auto, fahrrad oder fuss", enum=["auto", "fahrrad", "fuss"])}, ["ziel"]),
        Tool("wo_ist_oeffnen", "Die App „Wo ist?“ öffnen, wenn der Nutzer wissen will, wo eine Person (die ihren "
             "Standort teilt), ein Gerät oder ein AirTag ist. JARVIS kann diese Standorte selbst nicht lesen.",
             "karte", k.wo_ist),
    ]
