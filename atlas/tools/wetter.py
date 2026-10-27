"""Wetter über Open-Meteo (kostenlos, ohne Konto, keine persönlichen Daten)."""
import httpx

from atlas.tools import S, Tool, ToolError

WMO = {0: "klar", 1: "überwiegend klar", 2: "teils bewölkt", 3: "bedeckt", 45: "Nebel", 48: "Reifnebel",
       51: "leichter Niesel", 53: "Niesel", 55: "starker Niesel", 61: "leichter Regen", 63: "Regen",
       65: "starker Regen", 66: "gefrierender Regen", 67: "gefrierender Regen", 71: "leichter Schnee",
       73: "Schnee", 75: "starker Schnee", 77: "Schneegriesel", 80: "Regenschauer", 81: "Regenschauer",
       82: "heftige Schauer", 85: "Schneeschauer", 86: "Schneeschauer", 95: "Gewitter",
       96: "Gewitter mit Hagel", 99: "Gewitter mit Hagel"}


# Vom Kern gesetzt: aktueller Wetterort (Standort oder Heimatort) und heutige Reiseziele > 50 km
ORT = None          # () -> {"ort", "lat", "lon", "quelle"}
ZIELE = None        # () -> [{"ort", "lat", "lon", "km", "termin", "zeit"}]


def _vorhersage(lat: float, lon: float, name: str, tage: int = 3) -> dict:
    try:
        d = httpx.get("https://api.open-meteo.com/v1/forecast", timeout=10, params={
            "latitude": lat, "longitude": lon, "timezone": "Europe/Berlin", "forecast_days": max(1, min(7, tage)),
            "current": "temperature_2m,apparent_temperature,weather_code,wind_speed_10m",
            "hourly": "temperature_2m,precipitation_probability,weather_code",
            "daily": "temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code,sunrise,sunset",
        }).json()
    except (httpx.HTTPError, ValueError) as e:
        raise ToolError(f"Wetterdienst nicht erreichbar: {e}")
    cur, hr, dy = d["current"], d["hourly"], d["daily"]
    now = cur["time"][:13]
    start = next((i for i, t in enumerate(hr["time"]) if t[:13] >= now), 0)
    return {
        "ort": name,
        "aktuell": {"temp": round(cur["temperature_2m"]), "gefuehlt": round(cur["apparent_temperature"]),
                    "code": cur["weather_code"], "text": WMO.get(cur["weather_code"], "–"),
                    "wind_kmh": round(cur["wind_speed_10m"])},
        "stunden": [{"zeit": hr["time"][i][11:16], "temp": round(hr["temperature_2m"][i]),
                     "regen": hr["precipitation_probability"][i], "code": hr["weather_code"][i]}
                    for i in range(start, min(start + 24, len(hr["time"])))],
        "tage": [{"datum": dy["time"][i], "min": round(dy["temperature_2m_min"][i]),
                  "max": round(dy["temperature_2m_max"][i]), "regen": dy["precipitation_probability_max"][i],
                  "code": dy["weather_code"][i], "text": WMO.get(dy["weather_code"][i], "–"),
                  "aufgang": dy["sunrise"][i][11:], "untergang": dy["sunset"][i][11:]}
                 for i in range(len(dy["time"]))],
    }


def wetter(cfg: dict, ort: str = "", tage: int = 3) -> dict:
    """Wetter am aktuellen Standort (sonst Heimatort) – oder an einem genannten Ort. Ohne Ortsangabe kommen
    heutige Reiseziele (Termine mit Ort, > 50 km entfernt) mit ihrem Wetter zur Terminzeit dazu."""
    if ort and ort.strip():
        from atlas.standort import OrtNichtGefunden, geocode
        try:
            g = geocode(ort)
        except OrtNichtGefunden as e:
            raise ToolError(str(e))
        return _vorhersage(g["lat"], g["lon"], g["ort"], tage)
    basis = None
    if ORT:
        try:
            basis = ORT()
        except Exception:
            basis = None
    basis = basis or {"ort": cfg["ort"], "lat": cfg["lat"], "lon": cfg["lon"], "quelle": "heimatort"}
    out = _vorhersage(basis["lat"], basis["lon"], basis["ort"], tage)
    out["quelle"] = basis.get("quelle", "heimatort")
    if ZIELE:
        try:
            ziele = ZIELE()
        except Exception:
            ziele = []
        for z in ziele[:3]:
            try:
                w = _vorhersage(z["lat"], z["lon"], z["ort"], 1)
            except ToolError:
                continue
            h = next((s for s in w["stunden"] if z.get("zeit") and s["zeit"][:2] == str(z["zeit"])[:2]), None)
            t0 = (w["tage"] or [{}])[0]
            out.setdefault("reiseziele", []).append({
                "ort": z["ort"], "km": z["km"], "termin": z.get("termin", ""), "zeit": z.get("zeit"),
                "min": t0.get("min"), "max": t0.get("max"), "regen": t0.get("regen"), "code": t0.get("code"),
                "text": t0.get("text"), "zur_terminzeit": h})
    return out


def tools(cfg, secrets) -> list[Tool]:
    w = cfg["wetter"]
    return [Tool("wetter", "Wetter und Vorhersage am aktuellen Standort (sonst Heimatort " + w["ort"] + "); enthält "
                 "auch heutige Reiseziele aus dem Kalender (> 50 km entfernt) mit Wetter zur Terminzeit. "
                 "Optional ein anderer Ort.",
                 "wetter.lesen", lambda ort="", tage=3: wetter(w, ort, tage),
                 {"ort": S("Ort, optional"), "tage": {"type": "integer", "description": "1–7 Tage"}})]
