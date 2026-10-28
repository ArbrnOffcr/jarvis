"""Standort: Wo bin ich – und wohin fahre ich heute noch?

- Aktueller Standort kommt von der JARVIS-App am Mac (Ortungsdienste) oder vom iPhone (Web-App), jeweils nur
  wenn erlaubt. Gespeichert wird nur die letzte Position (ATLAS-Privat/standort.json), keine Bewegungsspur.
- Wetter gilt für den aktuellen Standort (höchstens 8 h alt), sonst für den Heimatort aus den Einstellungen.
- Reiseziele: Termine von heute mit Ortsangabe, die noch bevorstehen und mehr als 50 km entfernt sind,
  bekommen zusätzlich ihr eigenes Wetter (zur Terminzeit).
- Ortssuche robust: Open-Meteo, dann OpenStreetMap (Photon, Nominatim); versteht „Leipzig“, „04109 Leipzig“,
  „Leipzig, Sachsen“ oder Straßenadressen.
"""
import math
import re
import threading
import time
from datetime import date, datetime

import httpx

from atlas.paths import HOST, read_private_json, write_private_json

DATEI = "standort.json"
MAX_ALTER = 8 * 3600
ZIEL_KM = 50
UA = {"User-Agent": "JARVIS-Privatassistent/1.0 (persoenlicher Assistent)", "Accept-Language": "de"}
KEIN_ORT = re.compile(r"\b(raum|zimmer|büro|buero|halle|saal|gebäude|geb\.|online|teams|zoom|webex|skype|telefon|"
                      r"anruf|videokonferenz|vtc|https?://|stab\b|kantine|besprechungsraum|hörsaal|block)\b", re.I)


class OrtNichtGefunden(Exception):
    pass


def km(a_lat: float, a_lon: float, b_lat: float, b_lon: float) -> float:
    r = 6371.0
    p1, p2 = math.radians(a_lat), math.radians(b_lat)
    dp, dl = p2 - p1, math.radians(b_lon - a_lon)
    h = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(h))


def _varianten(q: str) -> list[str]:
    q = re.sub(r"\s+", " ", (q or "").strip())
    out = [q]
    ohne_land = re.sub(r",?\s*(deutschland|germany|de|brd)\s*$", "", q, flags=re.I).strip(" ,")
    out.append(ohne_land)
    teile = [t.strip() for t in ohne_land.split(",") if t.strip()]
    if teile:
        out.append(teile[0])
    plz = re.search(r"\b(\d{5})\b", ohne_land)
    name = re.sub(r"\b\d{5}\b", "", teile[0] if teile else ohne_land).strip(" ,")
    if name:
        out.append(name)
    if plz:
        out.append(plz.group(1))
    return [v for v in dict.fromkeys(out) if len(v) >= 2]


def geocode(q: str) -> dict:
    """Ort → {ort, lat, lon}. Wirft OrtNichtGefunden mit verständlichem Grund."""
    q = (q or "").strip()
    if len(q) < 2:
        raise OrtNichtGefunden("Bitte einen Ort eingeben.")
    netz_fehler = 0
    for v in _varianten(q):                                   # 1. Open-Meteo (Ortsnamen, Postleitzahlen)
        try:
            r = httpx.get("https://geocoding-api.open-meteo.com/v1/search",
                          params={"name": v, "count": 5, "language": "de", "format": "json"}, timeout=10)
            treffer = r.json().get("results") or []
        except (httpx.HTTPError, ValueError):
            netz_fehler += 1
            continue
        if treffer:
            de = [t for t in treffer if t.get("country_code") == "DE"]
            t = (de or treffer)[0]
            return {"ort": t.get("name") or v, "lat": round(t["latitude"], 4), "lon": round(t["longitude"], 4)}
    try:                                                      # 2. Photon (OpenStreetMap, auch Adressen)
        r = httpx.get("https://photon.komoot.io/api/", params={"q": q, "limit": 1, "lang": "de"}, headers=UA, timeout=10)
        f = (r.json().get("features") or [None])[0]
        if f:
            p, (lon, lat) = f["properties"], f["geometry"]["coordinates"]
            return {"ort": p.get("city") or p.get("town") or p.get("village") or p.get("name") or q,
                    "lat": round(lat, 4), "lon": round(lon, 4)}
    except (httpx.HTTPError, ValueError, KeyError, IndexError):
        netz_fehler += 1
    try:                                                      # 3. Nominatim
        r = httpx.get("https://nominatim.openstreetmap.org/search",
                      params={"q": q, "format": "jsonv2", "limit": 1, "accept-language": "de", "addressdetails": 1},
                      headers=UA, timeout=10)
        x = (r.json() or [None])[0]
        if x:
            a = x.get("address") or {}
            return {"ort": a.get("city") or a.get("town") or a.get("village") or x.get("name") or q,
                    "lat": round(float(x["lat"]), 4), "lon": round(float(x["lon"]), 4)}
    except (httpx.HTTPError, ValueError, KeyError, IndexError):
        netz_fehler += 1
    if netz_fehler >= len(_varianten(q)) + 2:
        raise OrtNichtGefunden("Ortssuche nicht erreichbar – bitte Internetverbindung prüfen.")
    raise OrtNichtGefunden(f"Ort „{q}“ nicht gefunden – z. B. „Leipzig“ oder „04109 Leipzig“ eingeben.")


def ortsname(lat: float, lon: float) -> str:
    """Koordinaten → Ortsname (Photon, sonst Nominatim)."""
    try:
        r = httpx.get("https://photon.komoot.io/reverse", params={"lat": lat, "lon": lon, "lang": "de", "limit": 1},
                      headers=UA, timeout=8)
        p = (r.json().get("features") or [{}])[0].get("properties") or {}
        n = p.get("city") or p.get("town") or p.get("village") or p.get("district") or p.get("county")
        if n:
            return n
    except (httpx.HTTPError, ValueError, KeyError, IndexError):
        pass
    try:
        r = httpx.get("https://nominatim.openstreetmap.org/reverse",
                      params={"lat": lat, "lon": lon, "format": "jsonv2", "zoom": 10, "accept-language": "de"},
                      headers=UA, timeout=8)
        a = r.json().get("address") or {}
        return a.get("city") or a.get("town") or a.get("village") or a.get("county") or ""
    except (httpx.HTTPError, ValueError):
        return ""


_ORTE: dict = {}


def ort_mit_teil(lat: float, lon: float) -> dict:
    """Koordinaten → {ort, teil} für die Durchfahrt (Stadt/Gemeinde und Ortsteil); zwischengespeichert (~100 m)."""
    k = (round(lat, 3), round(lon, 3))
    if k in _ORTE:
        return _ORTE[k]
    erg = {"ort": "", "teil": ""}
    try:
        r = httpx.get("https://photon.komoot.io/reverse", params={"lat": lat, "lon": lon, "lang": "de", "limit": 1},
                      headers=UA, timeout=6)
        p = (r.json().get("features") or [{}])[0].get("properties") or {}
        erg["ort"] = p.get("city") or p.get("town") or p.get("village") or p.get("municipality") or p.get("county") or ""
        teil = p.get("district") or p.get("locality") or p.get("suburb") or ""
        erg["teil"] = teil if teil and teil != erg["ort"] else ""
    except (httpx.HTTPError, ValueError, KeyError, IndexError):
        try:
            r = httpx.get("https://nominatim.openstreetmap.org/reverse",
                          params={"lat": lat, "lon": lon, "format": "jsonv2", "zoom": 14, "accept-language": "de"},
                          headers=UA, timeout=6)
            a = r.json().get("address") or {}
            erg["ort"] = a.get("city") or a.get("town") or a.get("village") or a.get("municipality") or ""
            erg["teil"] = a.get("suburb") or a.get("city_district") or a.get("quarter") or ""
        except (httpx.HTTPError, ValueError):
            pass
    if len(_ORTE) > 3000:
        _ORTE.clear()
    _ORTE[k] = erg
    return erg


class Standort:
    def __init__(self, core):
        self.c = core
        self.lock = threading.Lock()
        self._namen: dict = {}
        self._orte: dict = {}
        self._ziele = (0.0, "", [])

    # ------------------------------------------------------------ aktueller Standort
    def setzen(self, lat: float, lon: float, genauigkeit: float | None = None, quelle: str = "mac") -> dict:
        lat, lon = round(float(lat), 4), round(float(lon), 4)
        alt = read_private_json(DATEI, {})
        if alt.get("lat") is not None and km(alt["lat"], alt["lon"], lat, lon) < 2 and alt.get("ort"):
            name = alt["ort"]                                  # kaum bewegt: Name nicht neu abfragen
        else:
            key = (round(lat, 2), round(lon, 2))
            name = self._namen.get(key) or ortsname(lat, lon)
            self._namen[key] = name
        st = {"lat": lat, "lon": lon, "ort": name, "genauigkeit": genauigkeit, "quelle": quelle,
              "zeit": time.time(), "geraet": HOST}
        write_private_json(DATEI, st)
        try:
            self.c.karte.standort = (lat, lon, time.time())
        except AttributeError:
            pass
        if not alt.get("ort") or alt.get("ort") != name:
            try:
                self.c.lage.invalidate("wetter")
            except Exception:
                pass
        return st

    def aktuell(self, max_alter: int = MAX_ALTER) -> dict | None:
        st = read_private_json(DATEI, {})
        if st.get("lat") is None or time.time() - float(st.get("zeit") or 0) > max_alter:
            return None
        return st

    def heim(self) -> dict:
        w = self.c.cfg.get("wetter") or {}
        return {"ort": w.get("ort", "Berlin"), "lat": w.get("lat", 52.52), "lon": w.get("lon", 13.40), "quelle": "heimatort"}

    def wetter_ort(self) -> dict:
        st = self.aktuell()
        if st:
            return {"ort": st.get("ort") or "Aktueller Standort", "lat": st["lat"], "lon": st["lon"],
                    "quelle": "standort"}
        return self.heim()

    def status(self) -> dict:
        st = read_private_json(DATEI, {})
        if st.get("lat") is None:
            return {"bekannt": False}
        alter = time.time() - float(st.get("zeit") or 0)
        return {"bekannt": True, "ort": st.get("ort", ""), "quelle": st.get("quelle", ""), "alter_min": round(alter / 60),
                "aktuell": alter <= MAX_ALTER}

    # ------------------------------------------------------------ Reiseziele heute
    def _ort_von(self, text: str) -> dict | None:
        text = (text or "").strip()
        if not text or len(text) < 3:
            return None
        if KEIN_ORT.search(text) and not re.search(r"\d{5}|,", text):
            return None
        if text in self._orte:
            return self._orte[text]
        ort = None
        try:
            ort = geocode(text)
        except OrtNichtGefunden:
            pass
        self._orte[text] = ort
        return ort

    def reiseziele(self) -> list[dict]:
        """Bevorstehende Termine von heute mit Ort > 50 km vom Standort (bzw. Heimatort)."""
        basis = self.wetter_ort()
        key = f"{date.today()}|{round(basis['lat'], 1)}|{round(basis['lon'], 1)}"
        t, k, ziele = self._ziele
        if k == key and time.time() - t < 900:
            return ziele
        tool = self.c.tools.get("kalender_termine")
        out = []
        if tool:
            try:
                termine = tool.func(von=date.today().isoformat())
            except Exception:
                termine = []
            jetzt = datetime.now().strftime("%H:%M")
            for x in termine or []:
                if not isinstance(x, dict) or not x.get("ort"):
                    continue
                ende = str(x.get("ende") or "")[11:16]
                if not x.get("ganztag") and ende and ende < jetzt:      # schon vorbei
                    continue
                o = self._ort_von(x["ort"])
                if not o:
                    continue
                d = km(basis["lat"], basis["lon"], o["lat"], o["lon"])
                if d < ZIEL_KM or (d > 1200 and not re.search(r"\d{5}|,", x["ort"])):
                    continue
                if any(km(z["lat"], z["lon"], o["lat"], o["lon"]) < 25 for z in out):
                    continue
                out.append({"ort": o["ort"], "lat": o["lat"], "lon": o["lon"], "km": round(d),
                            "termin": x.get("titel", ""), "zeit": x.get("zeit")})
        self._ziele = (time.time(), key, out)
        return out
