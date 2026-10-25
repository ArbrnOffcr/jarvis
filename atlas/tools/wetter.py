"""Wetter über Open-Meteo (kostenlos, ohne Konto, keine persönlichen Daten)."""
import httpx

from atlas.tools import S, Tool, ToolError

WMO = {0: "klar", 1: "überwiegend klar", 2: "teils bewölkt", 3: "bedeckt", 45: "Nebel", 48: "Reifnebel",
       51: "leichter Niesel", 53: "Niesel", 55: "starker Niesel", 61: "leichter Regen", 63: "Regen",
       65: "starker Regen", 66: "gefrierender Regen", 67: "gefrierender Regen", 71: "leichter Schnee",
       73: "Schnee", 75: "starker Schnee", 77: "Schneegriesel", 80: "Regenschauer", 81: "Regenschauer",
       82: "heftige Schauer", 85: "Schneeschauer", 86: "Schneeschauer", 95: "Gewitter",
       96: "Gewitter mit Hagel", 99: "Gewitter mit Hagel"}


def wetter(cfg: dict, ort: str = "", tage: int = 3) -> dict:
    lat, lon, name = cfg["lat"], cfg["lon"], cfg["ort"]
    if ort and ort.lower() != name.lower():
        g = httpx.get("https://geocoding-api.open-meteo.com/v1/search",
                      params={"name": ort, "count": 1, "language": "de"}, timeout=10).json()
        if not g.get("results"):
            raise ToolError(f"Ort '{ort}' nicht gefunden")
        r = g["results"][0]
        lat, lon, name = r["latitude"], r["longitude"], r["name"]
    try:
        d = httpx.get("https://api.open-meteo.com/v1/forecast", timeout=10, params={
            "latitude": lat, "longitude": lon, "timezone": "Europe/Berlin", "forecast_days": max(1, min(7, tage)),
            "current": "temperature_2m,apparent_temperature,weather_code,wind_speed_10m",
            "hourly": "temperature_2m,precipitation_probability,weather_code",
            "daily": "temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code,sunrise,sunset",
        }).json()
    except httpx.HTTPError as e:
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
                    for i in range(start, min(start + 13, len(hr["time"])))],
        "tage": [{"datum": dy["time"][i], "min": round(dy["temperature_2m_min"][i]),
                  "max": round(dy["temperature_2m_max"][i]), "regen": dy["precipitation_probability_max"][i],
                  "code": dy["weather_code"][i], "text": WMO.get(dy["weather_code"][i], "–"),
                  "aufgang": dy["sunrise"][i][11:], "untergang": dy["sunset"][i][11:]}
                 for i in range(len(dy["time"]))],
    }


def tools(cfg, secrets) -> list[Tool]:
    w = cfg["wetter"]
    return [Tool("wetter", f"Wetter und Vorhersage (Standard: {w['ort']}). Optional anderer Ort.",
                 "wetter.lesen", lambda ort="", tage=3: wetter(w, ort, tage),
                 {"ort": S("Ort, optional"), "tage": {"type": "integer", "description": "1–7 Tage"}})]
