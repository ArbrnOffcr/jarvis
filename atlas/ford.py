"""Ford über die offizielle Schnittstelle „FordConnect Query“ (Ford Developer Portal EU) – nur Status:
Tank/Reichweite, Kilometerstand, Standort (Live-Karte), Zündung, Verriegelung, Reifendruck, Ölwechsel, 12-V-Batterie.

Vorbereitet für den Ford Tourneo Custom (Übergabe März 2027): Fahrzeugprofil, Foto, TÜV und Versicherung lassen sich
schon vorher pflegen; nach der Übergabe nur noch App im Ford-Portal anlegen, anmelden, fertig.

Sicherheit:
- Eigener Zugang (Client-ID/Secret aus dem Ford-Portal) und eigene Anmeldung; alles im Schlüsselbund.
- Diese Schnittstelle kann NICHTS am Fahrzeug steuern (kein Öffnen, Starten, Klima) – reiner Lesezugriff.
- Die inoffizielle FordPass-Schnittstelle wird bewusst nicht benutzt (Sperrgefahr fürs Konto).
- Anmelde-/Token-Adressen und API-Pfade sind in den Experten-Einstellungen änderbar, falls Ford sie anpasst.
"""
import json
import re
import secrets as _secrets
import threading
import time
from datetime import datetime
from urllib.parse import urlencode

import httpx

from atlas.keystore import get_secret, set_secret
from atlas.paths import LOCAL_DIR, PORT
from atlas.tools import S, Tool, ToolError

ORDNER = LOCAL_DIR / "ford"
KENNUNG = "ford"                      # feste Kennung für Fristen (TÜV/Versicherung) – gilt schon vor der Übergabe
B2C = "https://dah2vb2cprod.b2clogin.com/914d88b1-3523-4bf6-9be4-1b96b4f6f919/oauth2/v2.0"
STANDARD = {
    "auth_url": f"{B2C}/authorize?p=B2C_1A_signup_signin_common",
    "token_url": f"{B2C}/token?p=B2C_1A_signup_signin_common",
    "api": "https://api.vehicle.ford.com/fcon-query/v1",
    "garage": "/garage",
    "telemetrie": "/telemetry",
    "kopfzeilen": {},
}
PORTAL = "https://developer.ford.com/developer-eu"
FARBEN = {"weiss": "#eef0f1", "weiß": "#eef0f1", "white": "#eef0f1", "frozen white": "#eef0f1", "schwarz": "#15171a",
          "black": "#15171a", "agate black": "#15171a", "grau": "#5d636a", "grey": "#5d636a", "gray": "#5d636a",
          "magnetic": "#4b5056", "silber": "#a9aeb3", "silver": "#a9aeb3", "moondust silver": "#a9aeb3",
          "blau": "#1f3e6e", "blue": "#1f3e6e", "chrome blue": "#1f3e6e", "rot": "#a3121c", "red": "#a3121c",
          "race red": "#b3121f", "grün": "#3f5a43", "green": "#3f5a43", "orange": "#d9661f"}
RAEDER = {"FRONT_LEFT": "VL", "FRONT_RIGHT": "VR", "REAR_LEFT": "HL", "REAR_RIGHT": "HR",
          "LEFT_FRONT": "VL", "RIGHT_FRONT": "VR", "LEFT_REAR": "HL", "RIGHT_REAR": "HR",
          "REAR_LEFT_OUTER": "HL", "REAR_RIGHT_OUTER": "HR"}
UNKRITISCH = {"OFF", "NORMAL", "FALSE", "NO_WARNING", "OK", "NONE", "INACTIVE", "NOT_ACTIVE", "0", "", "UNKNOWN"}
WARN_DE = [("tirepressure", "Reifendruck"), ("tire", "Reifen"), ("oilpressure", "Öldruck"), ("oil", "Öl"),
           ("coolant", "Kühlmittel"), ("brake", "Bremse"), ("airbag", "Airbag"), ("battery", "Batterie"),
           ("checkengine", "Motorkontrolle"), ("engine", "Motor"), ("exhaust", "Abgas/AdBlue"), ("diesel", "AdBlue"),
           ("washer", "Wischwasser"), ("light", "Beleuchtung"), ("lamp", "Leuchte"), ("service", "Service")]
MIN_ABSTAND = 30                      # Sekunden zwischen zwei Abrufen bei Ford (Rest aus dem Zwischenspeicher)


class Ford:
    def __init__(self, core):
        self.c = core
        self.lock = threading.Lock()
        self._oauth_state = ""
        self._letzter = 0.0
        ORDNER.mkdir(parents=True, exist_ok=True)

    # ------------------------------------------------------------ Zustand
    def _zustand(self) -> dict:
        try:
            return json.loads((ORDNER / "zustand.json").read_text())
        except (OSError, ValueError):
            return {}

    def _zustand_setzen(self, **neu) -> dict:
        z = {**self._zustand(), **neu}
        (ORDNER / "zustand.json").write_text(json.dumps(z, ensure_ascii=False, indent=1))
        return z

    def _url(self, name: str):
        return (self._zustand().get("urls") or {}).get(name) or STANDARD[name]

    def redirect(self) -> str:
        return f"http://localhost:{PORT}/ford/rueckruf"

    def profil(self) -> dict:
        z = self._zustand()
        p = z.get("profil") or {}
        return {"name": p.get("name") or z.get("name") or "Tourneo Custom", "modell": p.get("modell") or "Ford Tourneo Custom",
                "farbe": p.get("farbe") or "#eef0f1", "farbname": p.get("farbname", ""), "kennzeichen": p.get("kennzeichen", ""),
                "erwartet": p.get("erwartet", "")}

    def bereit(self) -> bool:
        return bool(get_secret("ford_refresh") and self._zustand().get("fahrzeug_id"))

    def einrichtung(self) -> dict:
        z = self._zustand()
        return {"app": bool(get_secret("ford_client_id") and get_secret("ford_client_secret")),
                "angemeldet": bool(get_secret("ford_refresh")), "fahrzeug_id": z.get("fahrzeug_id", ""),
                "vin": z.get("vin", ""), "fahrzeuge": z.get("fahrzeuge", []), "fahrzeug": z.get("name", ""),
                "redirect": self.redirect(), "portal": PORTAL, "profil": self.profil(), "demo": bool(z.get("demo")),
                "urls": {k: self._url(k) for k in STANDARD}, "standard": STANDARD,
                "fehler": z.get("fehler", ""), "letzter_abruf": z.get("letzter_abruf", "")}

    # ------------------------------------------------------------ Vor der Übergabe
    def profil_setzen(self, name: str = "", farbe: str = "", kennzeichen: str = "", erwartet: str = "") -> dict:
        p = self._zustand().get("profil") or {}
        if name.strip():
            p["name"] = name.strip()[:40]
        if farbe.strip():
            f = farbe.strip()
            p["farbe"] = f if re.fullmatch(r"#[0-9a-fA-F]{6}", f) else FARBEN.get(f.lower(), p.get("farbe", "#eef0f1"))
            if not f.startswith("#"):
                p["farbname"] = f[:30]
        p["kennzeichen"] = kennzeichen.strip().upper()[:15] if kennzeichen is not None else p.get("kennzeichen", "")
        if erwartet.strip():
            p["erwartet"] = erwartet.strip()[:20]
        self._zustand_setzen(profil=p)
        return {"ok": True, "text": "✓ Fahrzeugprofil gespeichert", "profil": self.profil()}

    def demo_setzen(self, an: bool) -> dict:
        self._zustand_setzen(demo=bool(an))
        return {"ok": True, "text": "✓ Vorschau mit Beispieldaten an" if an else "✓ Vorschau aus"}

    def urls_setzen(self, urls: dict) -> dict:
        neu = {}
        for k in ("auth_url", "token_url", "api"):
            v = str(urls.get(k) or "").strip()
            if v:
                if not v.startswith("https://"):
                    raise ToolError(f"{k}: bitte eine https-Adresse")
                neu[k] = v.rstrip("/") if k == "api" else v
        for k in ("garage", "telemetrie"):
            v = str(urls.get(k) or "").strip()
            if v:
                neu[k] = v if v.startswith("/") else "/" + v
        kz = urls.get("kopfzeilen")
        if kz:
            if isinstance(kz, str):
                try:
                    kz = json.loads(kz)
                except ValueError:
                    raise ToolError("Zusätzliche Kopfzeilen bitte als JSON, z. B. {\"Application-Id\": \"…\"}")
            if not isinstance(kz, dict):
                raise ToolError("Kopfzeilen als JSON-Objekt angeben")
            neu["kopfzeilen"] = {str(a)[:60]: str(b)[:200] for a, b in kz.items()}
        self._zustand_setzen(urls=neu)
        return {"ok": True, "text": "✓ Gespeichert" if neu else "✓ Auf Standard zurückgesetzt"}

    # ------------------------------------------------------------ Anmeldung (OAuth über Ford/Azure B2C)
    def app_setzen(self, client_id: str, client_secret: str) -> dict:
        cid, sec = re.sub(r"\s+", "", client_id or ""), (client_secret or "").strip()
        if not cid or not sec:
            raise ToolError("Client-ID und Client-Secret aus dem Ford-Portal eintragen")
        if len(cid) < 8 or len(sec) < 8:
            raise ToolError("Das sieht unvollständig aus – bitte direkt aus dem Ford-Portal kopieren")
        set_secret("ford_client_id", cid)
        set_secret("ford_client_secret", sec)
        return {"ok": True, "text": "✓ Im Schlüsselbund gespeichert – weiter mit „Anmelden“"}

    def anmelde_url(self) -> str:
        cid = get_secret("ford_client_id")
        if not cid:
            raise ToolError("Zuerst Client-ID und Secret eintragen")
        self._oauth_state = _secrets.token_urlsafe(16)
        basis = self._url("auth_url")
        return basis + ("&" if "?" in basis else "?") + urlencode({
            "client_id": cid, "response_type": "code", "redirect_uri": self.redirect(), "response_mode": "query",
            "scope": f"{cid} openid offline_access", "state": self._oauth_state, "ui_locales": "de-DE"})

    def _token_anfrage(self, daten: dict) -> dict:
        cid, sec = get_secret("ford_client_id"), get_secret("ford_client_secret")
        url = self._url("token_url")
        r = httpx.post(url, data={**daten, "client_id": cid, "client_secret": sec}, timeout=30)
        if r.status_code in (400, 401) and "invalid_client" in r.text:           # manche Server wollen Basic-Auth
            r = httpx.post(url, data={**daten, "client_id": cid}, auth=(cid, sec), timeout=30)
        if r.status_code != 200:
            raise ToolError(f"Ford lehnt die Anmeldung ab ({r.status_code}): {r.text[:200]}")
        return r.json()

    def rueckruf(self, code: str, state: str) -> str:
        if not code or not state or state != self._oauth_state:
            raise ToolError("Ungültige Anmeldung (Sicherheitscode passt nicht) – bitte erneut starten")
        self._oauth_state = ""
        cid = get_secret("ford_client_id")
        self._tokens_merken(self._token_anfrage({"grant_type": "authorization_code", "code": code,
                                                 "redirect_uri": self.redirect(),
                                                 "scope": f"{cid} openid offline_access"}))
        self._zustand_setzen(fehler="")
        try:
            autos = self.garage()
        except ToolError as e:
            self._zustand_setzen(fehler=str(e))
            return ""
        return autos[0]["name"] if autos else ""

    def _tokens_merken(self, j: dict) -> None:
        if not j.get("access_token"):
            raise ToolError("Ford hat kein Zugriffstoken geliefert")
        set_secret("ford_access", j["access_token"])
        if j.get("refresh_token"):
            set_secret("ford_refresh", j["refresh_token"])
        self._zustand_setzen(token_ablauf=time.time() + int(j.get("expires_in") or 1200) - 120)

    def _token(self) -> str:
        with self.lock:
            if get_secret("ford_access") and time.time() < float(self._zustand().get("token_ablauf") or 0):
                return get_secret("ford_access")
            rt = get_secret("ford_refresh")
            if not rt:
                raise ToolError("Der Ford ist noch nicht verbunden – Einstellungen → Verbindungen → Ford")
            cid = get_secret("ford_client_id")
            try:
                self._tokens_merken(self._token_anfrage({"grant_type": "refresh_token", "refresh_token": rt,
                                                         "scope": f"{cid} openid offline_access"}))
            except ToolError:
                raise ToolError("Ford-Anmeldung abgelaufen – bitte unter Einstellungen → Verbindungen → Ford neu anmelden")
            return get_secret("ford_access")

    def _get(self, pfad: str, params: dict | None = None) -> dict | list:
        z = self._zustand()
        pfad = pfad.replace("{id}", z.get("fahrzeug_id", "")).replace("{vin}", z.get("vin", ""))
        kopf = {"Authorization": f"Bearer {self._token()}", "Accept": "application/json", **(self._url("kopfzeilen") or {})}
        r = httpx.get(self._url("api") + pfad, params=params, headers=kopf, timeout=30)
        if r.status_code == 401:
            self._zustand_setzen(token_ablauf=0)
            kopf["Authorization"] = f"Bearer {self._token()}"
            r = httpx.get(self._url("api") + pfad, params=params, headers=kopf, timeout=30)
        if r.status_code == 429:
            raise ToolError("Ford begrenzt gerade die Abrufe – in ein paar Minuten erneut")
        if r.status_code >= 400:
            raise ToolError(f"Ford meldet {r.status_code}: {r.text[:200]}")
        try:
            return r.json()
        except ValueError:
            raise ToolError("Ford hat keine gültigen Daten geliefert")

    # ------------------------------------------------------------ Fahrzeuge
    def garage(self) -> list[dict]:
        roh = self._get(self._url("garage"))
        liste = roh if isinstance(roh, list) else (roh.get("vehicles") or roh.get("garage") or roh.get("data") or
                                                   ([roh] if roh.get("vin") or roh.get("vehicleId") else []))
        autos = []
        for a in liste:
            g = {k.lower(): v for k, v in a.items()} if isinstance(a, dict) else {}
            autos.append({"id": str(g.get("vehicleid") or g.get("id") or ""), "vin": str(g.get("vin") or ""),
                          "name": g.get("nickname") or " ".join(str(x) for x in (g.get("make"), g.get("modelname")) if x) or "Ford",
                          "modell": " ".join(str(x) for x in (g.get("make") or "Ford", g.get("modelname")) if x),
                          "jahr": g.get("modelyear"), "farbe": g.get("color") or "", "antrieb": g.get("enginetype") or ""})
        z = {"fahrzeuge": autos}
        if autos and not any(a["id"] == self._zustand().get("fahrzeug_id") for a in autos):
            z.update(self._auswahl_daten(autos[0]))
        self._zustand_setzen(**z)
        return autos

    def _auswahl_daten(self, a: dict) -> dict:
        p = self._zustand().get("profil") or {}
        if a.get("farbe") and not p.get("farbname"):
            p.update({"farbname": a["farbe"], "farbe": FARBEN.get(str(a["farbe"]).lower(), p.get("farbe", "#eef0f1"))})
        return {"fahrzeug_id": a["id"], "vin": a["vin"], "name": a["name"], "modell_api": a["modell"],
                "baujahr": a.get("jahr"), "antrieb": a.get("antrieb", ""), "profil": p}

    def waehlen(self, fahrzeug_id: str) -> dict:
        for a in self._zustand().get("fahrzeuge") or []:
            if a["id"] == fahrzeug_id:
                self._zustand_setzen(**self._auswahl_daten(a))
                return {"ok": True, "text": f"✓ {a['name']} gewählt"}
        raise ToolError("Fahrzeug nicht gefunden – bitte neu anmelden")

    def trennen(self) -> dict:
        for n in ("ford_access", "ford_refresh"):
            set_secret(n, "")
        self._zustand_setzen(fahrzeug_id="", vin="", fahrzeuge=[], token_ablauf=0)
        (ORDNER / "cache.json").unlink(missing_ok=True)
        return {"ok": True, "text": "✓ Verbindung getrennt (Profil, Foto und Termine bleiben)"}

    # ------------------------------------------------------------ Status
    def _cache(self) -> dict:
        try:
            return json.loads((ORDNER / "cache.json").read_text())
        except (OSError, ValueError):
            return {}

    def _telemetrie(self) -> dict:
        """Rohdaten von Ford, höchstens alle 30 s – sonst aus dem Zwischenspeicher."""
        if time.time() - self._letzter < MIN_ABSTAND:
            try:
                return json.loads((ORDNER / "roh.json").read_text())
            except (OSError, ValueError):
                pass
        if not self._zustand().get("fahrzeug_id"):
            self.garage()
        roh = self._get(self._url("telemetrie"), {"vehicleId": self._zustand().get("fahrzeug_id")} if "{id}" not in self._url("telemetrie") else None)
        self._letzter = time.time()
        try:                                  # nur lokal, für die Experten-Ansicht (Feldnamen prüfen)
            (ORDNER / "roh.json").write_text(json.dumps(roh, ensure_ascii=False))
            self._zustand_setzen(letzter_abruf=datetime.now().isoformat(timespec="seconds"))
        except OSError:
            pass
        return roh

    def status(self) -> dict:
        basis = {**self.profil(), "typ": "van", "eigenes_bild": self._eigenes_bild() is not None,
                 "termine": self.termine(), "baujahr": self._zustand().get("baujahr")}
        if self._zustand().get("demo") and not self.bereit():
            return {**basis, **self._demo()}
        if not self.bereit():
            return {**basis, "verbunden": False, "leer": True,
                    "hinweis": "Noch nicht verbunden – nach der Übergabe unter Einstellungen → Verbindungen → Ford anmelden."}
        try:
            d = self._auswerten(self._telemetrie())
        except ToolError as e:
            alt = self._cache()
            if alt:
                return {**basis, **alt, "verbunden": True, "online": False, "hinweis": f"{e} – angezeigt wird der letzte Stand."}
            raise
        try:
            (ORDNER / "cache.json").write_text(json.dumps(d, ensure_ascii=False))
        except OSError:
            pass
        return {**basis, **d}

    def position(self) -> dict:
        d = self.status()
        o = d.get("ort") or {}
        return {"lat": o.get("lat"), "lon": o.get("lon"), "heading": o.get("heading") or 0,
                "geschwindigkeit_kmh": o.get("geschwindigkeit_kmh") or 0, "faehrt": bool(o.get("faehrt")),
                "online": bool(d.get("online")), "zustand": "fährt" if o.get("faehrt") else "geparkt",
                "stand": o.get("stand") or d.get("stand"), "name": d.get("name"), "farbe": d.get("farbe"),
                "ort_name": o.get("name", ""), "typ": "van", "quelle": "ford", "demo": bool(d.get("demo"))}

    @staticmethod
    def _metrik(m: dict, *namen):
        for n in namen:
            v = m.get(n)
            if isinstance(v, dict) and "value" in v:
                return v.get("value"), v.get("updateTime")
        return None, None

    def _auswerten(self, roh: dict) -> dict:
        m = (roh.get("metrics") if isinstance(roh, dict) else None) or roh or {}
        if not isinstance(m, dict):
            m = {}
        zahl = lambda x: x if isinstance(x, (int, float)) else (float(x) if isinstance(x, str) and re.fullmatch(r"-?\d+(\.\d+)?", x) else None)
        tank, t_stand = self._metrik(m, "fuelLevel", "fuelLevelPercent")
        tank = zahl(tank)
        if tank is not None:
            tank = max(0, min(100, round(tank)))                         # Ford liefert teils > 100
        reichweite = zahl(self._metrik(m, "fuelRange", "distanceToEmpty", "xevBatteryRange")[0])
        km = zahl(self._metrik(m, "odometer")[0])
        pos, p_stand = self._metrik(m, "position")
        lat = lon = None
        if isinstance(pos, dict):
            loc = pos.get("location") or pos
            lat, lon = zahl(loc.get("lat") or loc.get("latitude")), zahl(loc.get("lon") or loc.get("longitude"))
        hd = self._metrik(m, "heading", "compassDirection")[0]
        if isinstance(hd, dict):
            hd = hd.get("heading")
        tempo = zahl(self._metrik(m, "speed", "vehicleSpeed")[0]) or 0
        zuendung = str(self._metrik(m, "ignitionStatus")[0] or "").upper()
        faehrt = zuendung in ("ON", "RUN", "START") and tempo > 2
        tueren = m.get("doorLockStatus")
        verriegelt = None
        if isinstance(tueren, list) and tueren:
            alle = next((t for t in tueren if str(t.get("vehicleDoor", "")).upper() == "ALL_DOORS"), None)
            werte = [str(t.get("value", "")).upper() for t in ([alle] if alle else tueren)]
            verriegelt = all(w in ("LOCKED", "DOUBLE_LOCKED") for w in werte)
        elif isinstance(tueren, dict):
            verriegelt = str(tueren.get("value", "")).upper() in ("LOCKED", "DOUBLE_LOCKED")
        reifen = {}
        for r in m.get("tirePressure") or []:
            pos_r, w = RAEDER.get(str(r.get("vehicleWheel", "")).upper()), zahl(r.get("value"))
            if pos_r and w:
                reifen[pos_r] = round(w / 100, 1) if w > 20 else round(w, 1)     # kPa → bar
        warn = []
        for k, v in m.items():
            if any(s in k.lower() for s in ("warning", "alert", "lamp")) and isinstance(v, dict):
                if str(v.get("value", "")).upper() not in UNKRITISCH:
                    kl = k.lower()
                    warn.append(next((de for en, de in WARN_DE if en in kl), re.sub(r"(?<!^)([A-Z])", r" \1", k).lower()))
        oel = zahl(self._metrik(m, "oilLifeRemaining", "oilLife")[0])
        adblue = self._metrik(m, "dieselExhaustFluidLevel", "dieselExhaustFluidLevelRangeRemaining", "dieselExhaustFluidRange")[0]
        batt = zahl(self._metrik(m, "batteryVoltage", "batteryStateOfCharge12V", "batteryVoltageLevel")[0])
        aussen = zahl(self._metrik(m, "outsideTemperature", "ambientTemp")[0])
        ort = ""
        if lat is not None and lon is not None:
            try:
                from atlas.standort import ortsname
                ort = ortsname(lat, lon)
            except Exception:
                ort = ""
        stand = p_stand or t_stand or roh.get("updateTime") if isinstance(roh, dict) else None
        return {"verbunden": True, "online": True, "zustand": "fährt" if faehrt else "geparkt",
                "stand": stand or datetime.now().isoformat(timespec="seconds"),
                "tank": tank, "reichweite_km": round(reichweite) if reichweite is not None else None,
                "kilometerstand": round(km) if km is not None else None, "zuendung": zuendung.lower() or None,
                "verriegelt": verriegelt, "reifen": reifen, "oel": round(oel) if oel is not None else None,
                "adblue": adblue, "batterie_v": round(batt, 1) if batt is not None else None, "aussen": aussen,
                "warnungen": warn[:6],
                "ort": {"lat": lat, "lon": lon, "name": ort, "heading": zahl(hd) or 0, "faehrt": faehrt,
                        "geschwindigkeit_kmh": round(tempo), "stand": p_stand or stand}}

    def _demo(self) -> dict:
        st = None
        try:
            st = self.c.standort.wetter_ort()
        except Exception:
            pass
        lat, lon = (st or {}).get("lat", 52.52), (st or {}).get("lon", 13.40)
        return {"verbunden": False, "demo": True, "online": True, "zustand": "geparkt",
                "stand": datetime.now().isoformat(timespec="minutes"), "tank": 68, "reichweite_km": 612,
                "kilometerstand": 1240, "zuendung": "off", "verriegelt": True,
                "reifen": {"VL": 3.4, "VR": 3.4, "HL": 3.8, "HR": 3.7}, "oel": 96, "adblue": "OK", "batterie_v": 12.6,
                "aussen": 9, "warnungen": [],
                "hinweis": "VORSCHAU mit Beispieldaten – so sieht es nach der Anbindung aus.",
                "ort": {"lat": lat + 0.002, "lon": lon + 0.003, "name": (st or {}).get("ort", "Zuhause"), "heading": 80,
                        "faehrt": False, "geschwindigkeit_kmh": 0, "stand": datetime.now().isoformat(timespec="seconds")}}

    def rohdaten(self) -> dict:
        try:
            roh = json.loads((ORDNER / "roh.json").read_text())
        except (OSError, ValueError):
            return {"leer": True}
        m = roh.get("metrics", roh) if isinstance(roh, dict) else {}
        return {"felder": sorted(m.keys()) if isinstance(m, dict) else [], "roh": roh}

    # ------------------------------------------------------------ Foto und Termine
    def _eigenes_bild(self):
        from atlas import fahrzeuge
        return fahrzeuge.eigenes_bild(ORDNER)

    def bild(self) -> tuple[bytes, str] | None:
        p = self._eigenes_bild()
        return (p.read_bytes(), "image/png" if p.suffix == ".png" else "image/jpeg") if p else None

    def bild_hochladen(self, daten: bytes, name: str = "") -> dict:
        from atlas import fahrzeuge
        return fahrzeuge.bild_hochladen(ORDNER, daten, name)

    def bild_entfernen(self) -> dict:
        from atlas import fahrzeuge
        return fahrzeuge.bild_entfernen(ORDNER)

    def termine(self) -> list[dict]:
        from atlas import fahrzeuge
        return fahrzeuge.termine(self.c, KENNUNG)

    def termine_setzen(self, tuev: str = "", versicherung: str = "", versicherer: str = "") -> dict:
        from atlas import fahrzeuge
        return fahrzeuge.termine_setzen(self.c, KENNUNG, self.profil()["name"], tuev, versicherung, versicherer)


def tools(core) -> list[Tool]:
    f = core.ford

    def status(anzeigen=True):
        d = f.status()
        if anzeigen:
            core.broadcast({"type": "ford", "daten": d})
        kurz = {k: d.get(k) for k in ("name", "verbunden", "demo", "zustand", "stand", "tank", "reichweite_km",
                                      "kilometerstand", "verriegelt", "reifen", "oel", "adblue", "warnungen", "hinweis")}
        kurz["ort"] = (d.get("ort") or {}).get("name")
        kurz["termine"] = [{"art": t["titel"], "datum": t["datum"], "in_tagen": t["tage"]} for t in d.get("termine") or []]
        return kurz

    def karte():
        pos = f.position()
        if pos.get("lat") is None:
            raise ToolError("Vom Ford ist noch keine Position bekannt" + ("" if f.bereit() else " – er ist noch nicht verbunden"))
        core.broadcast({"type": "tesla_karte", "position": pos})
        return {"angezeigt": True, "ort": pos.get("ort_name"), "faehrt": pos.get("faehrt"), "demo": pos.get("demo")}

    def termine(tuev="", versicherung="", versicherer=""):
        return f.termine_setzen(tuev, versicherung, versicherer)

    return [
        Tool("ford_status",
             "Status des Ford Tourneo Custom (Bus): Tank in %, Reichweite, Kilometerstand, Standort, verriegelt, "
             "Reifendruck, Öl, AdBlue, Warnungen, TÜV/Versicherung. Zeigt ihn im Dashboard (anzeigen=true). "
             "Nur Lesen – steuern lässt sich der Ford nicht.", "ford.lesen", status, {"anzeigen": {"type": "boolean"}}),
        Tool("ford_karte", "Den Ford (Bus) auf der Live-Karte im Dashboard zeigen. Für „Wo steht der Bus/der Ford?“.",
             "ford.lesen", karte),
        Tool("ford_termine_setzen",
             "TÜV/HU (MM/JJJJ) und/oder Hauptfälligkeit der Kfz-Versicherung (Datum) des Ford eintragen; legt Fristen mit "
             "Erinnerung an (bei der Versicherung auch die Kündigungsfrist). Geht schon vor der Übergabe.",
             "fristen.schreiben", termine,
             {"tuev": S("MM/JJJJ laut Plakette"), "versicherung": S("Hauptfälligkeit, TT.MM.JJJJ"),
              "versicherer": S("Name der Versicherung, optional")}, label=lambda a: "Ford-Termine eintragen"),
    ]
