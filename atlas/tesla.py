"""Tesla über die offizielle Fleet API: Status (Akku, Reichweite, Laden, Klima, Standort), Klimatisierung,
Laden und Ladeplanung – plus Bild des Fahrzeugs fürs Dashboard.

Sicherheit und Kosten:
- Zugang nur mit eigener Tesla-Entwickler-App (Client-ID/Secret) und eigener Anmeldung; Tokens im Schlüsselbund.
- Steuerbefehle werden lokal mit einem eigenen Schlüssel signiert (virtueller Schlüssel im Auto); der private
  Schlüssel bleibt auf diesem Mac (~/.atlas/tesla/private_key.pem, nur für dich lesbar), öffentlich ist nur der
  Public Key (GitHub Pages), den Tesla dafür verlangt.
- Schläft das Auto, weckt JARVIS es nur auf ausdrücklichen Wunsch oder für einen Befehl (spart Akku und
  Abrufkosten; für ein Auto deckt Teslas Monatsguthaben die Kosten normalerweise ab).
- Keine Befehle zum Entriegeln, Öffnen oder Fahren – nur Klima und Laden.
"""
import json
import secrets as _secrets
import shutil
import subprocess
import threading
import time
from datetime import datetime
from pathlib import Path
from urllib.parse import urlencode

import httpx

from atlas.keystore import get_secret, set_secret
from atlas.paths import LOCAL_DIR, PORT, REPO_DIR
from atlas.tools import S, Tool, ToolError

SERVER = {"eu": "https://fleet-api.prd.eu.vn.cloud.tesla.com", "na": "https://fleet-api.prd.na.vn.cloud.tesla.com"}
TOKEN_URL = "https://fleet-auth.prd.vn.cloud.tesla.com/oauth2/v3/token"
AUTH_URL = "https://auth.tesla.com/oauth2/v3/authorize"
SCOPES = "openid offline_access vehicle_device_data vehicle_location vehicle_cmds vehicle_charging_cmds"
ORDNER = LOCAL_DIR / "tesla"
VENV = LOCAL_DIR / "tesla-venv"
HELFER = REPO_DIR / "atlas" / "tesla_helfer.py"
BIB = "tesla-fleet-api==1.18.1"
MEILE = 1.609344
ENDPOINTS = "charge_state;climate_state;drive_state;location_data;vehicle_state;vehicle_config;gui_settings"

# Lackcodes für das Konfigurator-Bild (Tesla-Compositor); unbekannte Farben → eigene Grafik
LACK = {"pearlwhite": "PPSW", "solidblack": "PBSB", "obsidianblack": "PMBL", "deepblue": "PPSB",
        "midnightsilver": "PMNG", "redmulticoat": "PPMR", "stealthgrey": "PN01", "quicksilver": "PN00",
        "ultrared": "PR01", "midnightcherryred": "PR00", "silvermetallic": "PMSS"}
LACK_FARBE = {"PBCW": "#f2f3f4", "PPSW": "#e9ecef", "PBSB": "#121417", "PMBL": "#16181c", "PPSB": "#1f3b73", "PMNG": "#4a5058",
              "PPMR": "#a3101a", "PN01": "#5a5f66", "PN00": "#a7acb2", "PR01": "#b3121f", "PR00": "#5c1420",
              "PMSS": "#9aa1a8"}
HIGHLAND_FELGEN = ("glider", "photon", "nova", "w38a", "w39s")       # Model 3 ab Ende 2023 („Highland“)
AUSSTATTUNG = {"50": "Standard Range", "62": "Standard Range", "74": "Long Range", "74d": "Long Range",
               "p74d": "Performance", "100d": "Long Range", "p100d": "Performance", "plaid": "Plaid"}
JAHR = dict(zip("ABCDEFGHJKLMNPRSTVWXY123456789", range(2010, 2040)))   # 10. Stelle der FIN
MODELL = {"modely": ("my", "Model Y"), "model3": ("m3", "Model 3"), "models": ("ms", "Model S"),
          "modelx": ("mx", "Model X"), "cybertruck": ("ct", "Cybertruck")}


class Tesla:
    def __init__(self, core):
        self.c = core
        self.cfg = core.cfg.get("tesla") or {}
        self.server = SERVER.get(self.cfg.get("region", "eu"), SERVER["eu"])
        self.lock = threading.Lock()
        self._oauth_state = ""
        self._helfer_laeuft = False
        ORDNER.mkdir(parents=True, exist_ok=True)

    # ------------------------------------------------------------ Zustand der Einrichtung
    def _zustand(self) -> dict:
        try:
            return json.loads((ORDNER / "zustand.json").read_text())
        except (OSError, ValueError):
            return {}

    def _zustand_setzen(self, **neu) -> dict:
        z = {**self._zustand(), **neu}
        (ORDNER / "zustand.json").write_text(json.dumps(z, ensure_ascii=False, indent=1))
        return z

    def bereit(self) -> bool:
        return bool(get_secret("tesla_refresh") and self._zustand().get("vin"))

    def einrichtung(self) -> dict:
        z = self._zustand()
        return {"app": bool(get_secret("tesla_client_id") and get_secret("tesla_client_secret")),
                "helfer": (VENV / "bin" / "python").exists(), "helfer_laedt": self._helfer_laeuft,
                "schluessel": (ORDNER / "public_key.pem").exists(), "domain": z.get("domain", ""),
                "veroeffentlicht": bool(z.get("veroeffentlicht")), "registriert": bool(z.get("registriert")),
                "angemeldet": bool(get_secret("tesla_refresh")), "vin": z.get("vin", ""),
                "fahrzeug": z.get("name", ""), "virtueller_schluessel": bool(z.get("virtueller_schluessel")),
                "redirect": self.redirect(), "origin": f"https://{z['domain']}" if z.get("domain") else "",
                "scopes": SCOPES, "fehler": z.get("fehler", "")}

    def redirect(self) -> str:
        return f"http://localhost:{PORT}/tesla/rueckruf"

    # ------------------------------------------------------------ Einrichtung, Schritt für Schritt
    def app_setzen(self, client_id: str, client_secret: str) -> dict:
        import re
        cid = re.sub(r"\s+", "", client_id or "")
        sec = re.sub(r"\s+", "", client_secret or "")
        if not cid or not sec:
            raise ToolError("Client-ID und Client-Secret eintragen")
        if cid.startswith("ta-secret") or (sec and re.fullmatch(r"[0-9a-f-]{36}", sec)):
            raise ToolError("Client-ID und Client-Secret scheinen vertauscht – die ID ist eine lange Zeichenkette mit "
                            "Bindestrichen, das Secret beginnt mit „ta-secret.“")
        if not re.fullmatch(r"[0-9a-fA-F-]{36}", cid):
            raise ToolError("Die Client-ID sieht ungewöhnlich aus (erwartet: 8-4-4-4-12 Zeichen mit Bindestrichen). "
                            "Bitte direkt aus dem Tesla-Portal kopieren.")
        if not sec.startswith("ta-secret."):
            raise ToolError("Das Client-Secret beginnt normalerweise mit „ta-secret.“ – im Tesla-Portal bei der App "
                            "auf „Anmeldedaten/Credentials“ das Secret einblenden und vollständig kopieren.")
        # Gleich bei Tesla prüfen, ob die Kombination angenommen wird
        r = httpx.post(TOKEN_URL, data={"grant_type": "client_credentials", "client_id": cid, "client_secret": sec,
                                        "scope": "openid vehicle_device_data", "audience": self.server}, timeout=30)
        if r.status_code != 200:
            fehler = ""
            try:
                fehler = r.json().get("error", "")
            except ValueError:
                pass
            if fehler == "unauthorized_client":
                raise ToolError("Tesla erkennt ID und Secret nicht an. Häufigste Ursachen: Secret unvollständig kopiert, "
                                "die App ist im Portal noch nicht freigegeben (Status prüfen) oder das Secret wurde neu "
                                "erzeugt. Im Portal das Secret erneut kopieren und hier speichern.")
            raise ToolError(f"Tesla meldet {r.status_code}: {r.text[:200]}")
        set_secret("tesla_client_id", cid)
        set_secret("tesla_client_secret", sec)
        return {"ok": True, "text": "✓ Von Tesla bestätigt und im Schlüsselbund gespeichert"}

    def helfer_einrichten(self) -> dict:
        """Eigene Python-3.13-Umgebung für die signierten Befehle (läuft im Hintergrund, ca. 1–2 Min.)."""
        if (VENV / "bin" / "python").exists():
            return {"ok": True, "text": "✓ Befehlsmodul bereit"}
        if self._helfer_laeuft:
            return {"ok": True, "text": "Wird eingerichtet …"}
        uv = shutil.which("uv") or next((p for p in ("/opt/homebrew/bin/uv", str(Path.home() / ".local/bin/uv"))
                                         if Path(p).exists()), None)
        if not uv:
            raise ToolError("uv fehlt – JARVIS-Installation prüfen")

        def lauf():
            self._helfer_laeuft = True
            try:
                r = subprocess.run([uv, "venv", "--python", "3.13", str(VENV)], capture_output=True, text=True, timeout=600)
                if r.returncode == 0:
                    r = subprocess.run([uv, "pip", "install", "-q", "--python", str(VENV / "bin" / "python"), BIB],
                                       capture_output=True, text=True, timeout=900)
                if r.returncode:
                    shutil.rmtree(VENV, ignore_errors=True)
                    self._zustand_setzen(fehler="Befehlsmodul: " + (r.stderr or r.stdout)[-300:])
                else:
                    self._zustand_setzen(fehler="")
            finally:
                self._helfer_laeuft = False
        threading.Thread(target=lauf, daemon=True).start()
        return {"ok": True, "text": "Befehlsmodul wird eingerichtet (1–2 Minuten) …"}

    def _helfer(self, auftrag: dict, timeout: int = 90) -> dict:
        py = VENV / "bin" / "python"
        if not py.exists():
            raise ToolError("Befehlsmodul noch nicht eingerichtet (Einstellungen → Verbindungen → Tesla)")
        r = subprocess.run([str(py), "-I", str(HELFER)], input=json.dumps(auftrag), capture_output=True, text=True,
                           timeout=timeout)
        try:
            return json.loads((r.stdout or "").strip().splitlines()[-1])
        except (ValueError, IndexError):
            raise ToolError(f"Befehlsmodul: {(r.stderr or r.stdout)[-200:]}")

    def schluessel_veroeffentlichen(self) -> dict:
        """Schlüsselpaar erzeugen und den öffentlichen Schlüssel unter https://<github-name>.github.io/.well-known/…
        bereitstellen (verlangt Tesla für signierte Befehle). Der private Schlüssel bleibt auf diesem Mac."""
        erg = self._helfer({"aktion": "schluessel", "pfad": str(ORDNER / "private_key.pem")}, 60)
        if not erg.get("ok"):
            raise ToolError(erg.get("fehler", "Schlüssel konnte nicht erzeugt werden"))
        (ORDNER / "public_key.pem").write_text(erg["public_key"])
        gh = shutil.which("gh") or ("/opt/homebrew/bin/gh" if Path("/opt/homebrew/bin/gh").exists() else None)
        if not gh:
            raise ToolError("GitHub-CLI fehlt: im Terminal 'brew install gh' und 'gh auth login', dann erneut.")
        login = subprocess.run([gh, "api", "user", "--jq", ".login"], capture_output=True, text=True).stdout.strip()
        if not login:
            raise ToolError("Nicht bei GitHub angemeldet – im Terminal 'gh auth login', dann erneut.")
        domain = f"{login.lower()}.github.io"
        repo = f"{login}/{domain}"
        klon = ORDNER / "pages"
        g = ["git", "-C", str(klon)]
        if not (klon / ".git").exists():
            shutil.rmtree(klon, ignore_errors=True)
            if subprocess.run([gh, "repo", "view", repo], capture_output=True).returncode == 0:
                subprocess.run([gh, "repo", "clone", repo, str(klon)], capture_output=True, timeout=120)
            else:
                klon.mkdir(parents=True)
                subprocess.run([*g, "init", "-q", "-b", "main"], capture_output=True)
        ziel = klon / ".well-known" / "appspecific"
        ziel.mkdir(parents=True, exist_ok=True)
        (ziel / "com.tesla.3p.public-key.pem").write_text(erg["public_key"])
        (klon / ".nojekyll").write_text("")
        if not (klon / "index.html").exists():
            (klon / "index.html").write_text("<!doctype html><meta charset='utf-8'><title>JARVIS</title>")
        subprocess.run([*g, "add", "-A"], capture_output=True)
        subprocess.run([*g, "-c", "user.name=JARVIS", "-c", f"user.email={login}@users.noreply.github.com",
                        "commit", "-q", "-m", "Tesla Public Key"], capture_output=True)
        if subprocess.run([gh, "repo", "view", repo], capture_output=True).returncode != 0:
            r = subprocess.run([gh, "repo", "create", repo, "--public", "--source", str(klon), "--remote", "origin",
                                "--push"], capture_output=True, text=True, timeout=180)
        else:
            r = subprocess.run([*g, "push", "-q", "origin", "HEAD"], capture_output=True, text=True, timeout=180)
        if r.returncode:
            raise ToolError(f"Hochladen fehlgeschlagen: {(r.stderr or r.stdout)[-200:]}")
        subprocess.run([gh, "api", "-X", "POST", f"repos/{repo}/pages", "-f", "source[branch]=main",
                        "-f", "source[path]=/"], capture_output=True)       # Pages einschalten (falls noch aus)
        self._zustand_setzen(domain=domain, veroeffentlicht=True)
        return {"ok": True, "domain": domain,
                "text": f"✓ Öffentlicher Schlüssel unter https://{domain}/.well-known/appspecific/com.tesla.3p.public-key.pem "
                        "(kann 1–2 Minuten dauern, bis er erreichbar ist)"}

    def _partner_token(self) -> str:
        r = httpx.post(TOKEN_URL, data={"grant_type": "client_credentials", "client_id": get_secret("tesla_client_id"),
                                        "client_secret": get_secret("tesla_client_secret"),
                                        "scope": SCOPES.replace("offline_access ", ""), "audience": self.server},
                       timeout=30)
        if r.status_code != 200:
            if "unauthorized_client" in r.text:
                raise ToolError("Tesla erkennt Client-ID/Secret nicht an – bitte in Schritt 1 erneut aus dem Tesla-Portal "
                                "kopieren und speichern (JARVIS prüft sie dann sofort).")
            raise ToolError(f"Tesla lehnt die App-Anmeldung ab ({r.status_code}): {r.text[:200]}")
        return r.json()["access_token"]

    def registrieren(self) -> dict:
        z = self._zustand()
        if not z.get("domain"):
            raise ToolError("Zuerst den Schlüssel veröffentlichen")
        token = self._partner_token()
        r = httpx.post(f"{self.server}/api/1/partner_accounts", json={"domain": z["domain"]},
                       headers={"Authorization": f"Bearer {token}"}, timeout=30)
        if r.status_code not in (200, 201):
            raise ToolError(f"Registrierung abgelehnt ({r.status_code}): {r.text[:250]} – ist der Schlüssel unter der "
                            "Domain schon erreichbar und stimmt 'Allowed Origin' in der Tesla-App?")
        self._zustand_setzen(registriert=True)
        return {"ok": True, "text": "✓ Bei Tesla registriert"}

    def anmelde_url(self) -> str:
        if not get_secret("tesla_client_id"):
            raise ToolError("Zuerst Client-ID und Secret eintragen")
        self._oauth_state = _secrets.token_urlsafe(16)
        return AUTH_URL + "?" + urlencode({"response_type": "code", "client_id": get_secret("tesla_client_id"),
                                           "redirect_uri": self.redirect(), "scope": SCOPES, "state": self._oauth_state,
                                           "locale": "de-DE", "prompt_missing_scopes": "true"})

    def rueckruf(self, code: str, state: str) -> str:
        if not code or not state or state != self._oauth_state:
            raise ToolError("Ungültige Anmeldung (Sicherheitscode passt nicht) – bitte erneut starten")
        self._oauth_state = ""
        r = httpx.post(TOKEN_URL, data={"grant_type": "authorization_code", "client_id": get_secret("tesla_client_id"),
                                        "client_secret": get_secret("tesla_client_secret"), "code": code,
                                        "audience": self.server, "redirect_uri": self.redirect()}, timeout=30)
        if r.status_code != 200:
            raise ToolError(f"Tesla-Anmeldung fehlgeschlagen ({r.status_code}): {r.text[:200]}")
        self._tokens_merken(r.json())
        autos = self._get("/api/1/vehicles").get("response") or []
        if autos:
            a = autos[0]
            self._zustand_setzen(vin=a.get("vin", ""), name=a.get("display_name") or "Tesla", fehler="")
        return autos[0].get("display_name", "Tesla") if autos else ""

    def _tokens_merken(self, j: dict) -> None:
        set_secret("tesla_access", j["access_token"])
        if j.get("refresh_token"):
            set_secret("tesla_refresh", j["refresh_token"])
        self._zustand_setzen(token_ablauf=time.time() + int(j.get("expires_in", 28800)) - 300)

    def _token(self) -> str:
        with self.lock:
            if get_secret("tesla_access") and time.time() < float(self._zustand().get("token_ablauf") or 0):
                return get_secret("tesla_access")
            rt = get_secret("tesla_refresh")
            if not rt:
                raise ToolError("Tesla ist nicht verbunden – Einstellungen → Verbindungen → Tesla")
            r = httpx.post(TOKEN_URL, data={"grant_type": "refresh_token", "client_id": get_secret("tesla_client_id"),
                                            "refresh_token": rt}, timeout=30)
            if r.status_code != 200:
                raise ToolError("Tesla-Anmeldung abgelaufen – bitte unter Einstellungen neu anmelden")
            self._tokens_merken(r.json())
            return get_secret("tesla_access")

    def _get(self, pfad: str, params: dict | None = None) -> dict:
        r = httpx.get(self.server + pfad, params=params, headers={"Authorization": f"Bearer {self._token()}"}, timeout=30)
        if r.status_code == 408:
            raise _Schlaeft()
        if r.status_code == 401:
            self._zustand_setzen(token_ablauf=0)
            r = httpx.get(self.server + pfad, params=params, headers={"Authorization": f"Bearer {self._token()}"}, timeout=30)
        if r.status_code >= 400:
            raise ToolError(f"Tesla meldet {r.status_code}: {r.text[:200]}")
        return r.json()

    def _post(self, pfad: str, daten: dict | None = None) -> dict:
        r = httpx.post(self.server + pfad, json=daten or {}, headers={"Authorization": f"Bearer {self._token()}"}, timeout=30)
        if r.status_code >= 400 and r.status_code != 408:
            raise ToolError(f"Tesla meldet {r.status_code}: {r.text[:200]}")
        return r.json() if r.content else {}

    # ------------------------------------------------------------ Fahrzeug
    def _vin(self) -> str:
        vin = self._zustand().get("vin")
        if not vin:
            raise ToolError("Kein Fahrzeug verbunden – Einstellungen → Verbindungen → Tesla")
        return vin

    def _zustand_auto(self) -> str:
        for a in self._get("/api/1/vehicles").get("response") or []:
            if a.get("vin") == self._vin():
                return a.get("state", "unknown")
        return "unknown"

    def wecken(self, warten: int = 40) -> bool:
        vin = self._vin()
        if self._zustand_auto() == "online":
            return True
        self._post(f"/api/1/vehicles/{vin}/wake_up")
        ende = time.time() + warten
        while time.time() < ende:
            time.sleep(4)
            if self._zustand_auto() == "online":
                return True
        return False

    def status(self, wecken: bool = False) -> dict:
        vin = self._vin()
        zustand = self._zustand_auto()
        if zustand != "online":
            if not wecken or not self.wecken():
                alt = self._cache()
                alt.update({"online": False, "zustand": "schläft" if zustand == "asleep" else "offline",
                            "hinweis": "Das Auto schläft – angezeigt wird der letzte bekannte Stand. "
                                       "„Aktualisieren“ weckt es (kostet etwas Akku)."})
                return alt
        try:
            roh = self._get(f"/api/1/vehicles/{vin}/vehicle_data", {"endpoints": ENDPOINTS}).get("response") or {}
        except _Schlaeft:
            return {**self._cache(), "online": False, "zustand": "schläft"}
        d = self._auswerten(roh)
        try:
            (ORDNER / "cache.json").write_text(json.dumps(d, ensure_ascii=False))
        except OSError:
            pass
        return d

    def _cache(self) -> dict:
        try:
            return json.loads((ORDNER / "cache.json").read_text())
        except (OSError, ValueError):
            return {"name": self._zustand().get("name", "Tesla"), "leer": True}

    def _auswerten(self, r: dict) -> dict:
        ch, cl, dr = r.get("charge_state") or {}, r.get("climate_state") or {}, r.get("drive_state") or {}
        vs, vc = r.get("vehicle_state") or {}, r.get("vehicle_config") or {}
        km = lambda m: round(m * MEILE) if isinstance(m, (int, float)) else None
        lat, lon = dr.get("latitude") or dr.get("active_route_latitude"), dr.get("longitude")
        ort = ""
        if lat is not None and lon is not None:
            try:
                from atlas.standort import ortsname
                ort = ortsname(lat, lon)
            except Exception:
                ort = ""
        plan = ch.get("scheduled_charging_mode") or "Off"
        plan_txt = ""
        if plan == "StartAt" and ch.get("scheduled_charging_start_time"):
            plan_txt = "Ladestart " + datetime.fromtimestamp(ch["scheduled_charging_start_time"]).strftime("%H:%M")
        elif plan == "DepartBy" and ch.get("scheduled_departure_time_minutes") is not None:
            m = int(ch["scheduled_departure_time_minutes"])
            plan_txt = f"Abfahrt {m // 60:02d}:{m % 60:02d}"
        typ = MODELL.get(str(vc.get("car_type", "")).lower(), ("my", "Tesla"))
        lack = LACK.get(str(vc.get("exterior_color", "")).lower().replace(" ", ""), "")
        if lack == "PPSW" and "white" in str(vc.get("exterior_color", "")).lower() and "pearl" not in str(vc.get("exterior_color", "")).lower():
            lack = "PBCW"
        vin = r.get("vin") or self._zustand().get("vin", "")
        jahr = JAHR.get(vin[9:10].upper()) if len(vin) >= 10 else None
        felgen = str(vc.get("wheel_type", "")).lower()
        highland = typ[0] == "m3" and (any(f in felgen for f in HIGHLAND_FELGEN) or (jahr or 0) >= 2024)
        variante = AUSSTATTUNG.get(str(vc.get("trim_badging", "")).lower(), "")
        if not variante and str(vc.get("trim_badging", "")).lower().startswith("p"):
            variante = "Performance"
        return {
            "name": r.get("display_name") or vs.get("vehicle_name") or self._zustand().get("name", "Tesla"),
            "modell": " ".join(x for x in (typ[1], variante) if x), "modell_code": typ[0], "lack": lack,
            "baujahr": jahr, "highland": highland, "farbe": LACK_FARBE.get(lack, "#9aa1a8"),
            "eigenes_bild": self._eigenes_bild() is not None,
            "farbname": vc.get("exterior_color", ""), "felgen": vc.get("wheel_type", ""),
            "online": True, "zustand": "online", "stand": datetime.now().isoformat(timespec="minutes"),
            "akku": ch.get("battery_level"), "akku_nutzbar": ch.get("usable_battery_level"),
            "reichweite_km": km(ch.get("battery_range")), "reichweite_geschaetzt_km": km(ch.get("est_battery_range")),
            "laden": {"zustand": ch.get("charging_state"), "limit": ch.get("charge_limit_soc"),
                      "leistung_kw": ch.get("charger_power"), "minuten_bis_voll": ch.get("minutes_to_full_charge"),
                      "kabel": ch.get("conn_charge_cable") not in (None, "<invalid>"), "plan": plan, "plan_text": plan_txt,
                      "km_pro_stunde": km(ch.get("charge_rate"))},
            "klima": {"an": cl.get("is_climate_on"), "innen": cl.get("inside_temp"), "aussen": cl.get("outside_temp"),
                      "soll": cl.get("driver_temp_setting"), "vorklimatisierung": cl.get("is_preconditioning")},
            "ort": {"lat": lat, "lon": lon, "name": ort, "faehrt": dr.get("shift_state") in ("D", "R"),
                    "geschwindigkeit_kmh": km(dr.get("speed"))},
            "verriegelt": vs.get("locked"), "waechter": vs.get("sentry_mode"),
            "kilometerstand": km(vs.get("odometer")), "software": vs.get("car_version", "").split(" ")[0],
        }

    def befehl(self, name: str, **args) -> dict:
        if not self._zustand().get("virtueller_schluessel"):
            raise ToolError("Steuerung noch nicht freigegeben: Virtuellen Schlüssel im Auto hinzufügen "
                            "(Einstellungen → Verbindungen → Tesla, Schritt 5)")
        if not self.wecken():
            raise ToolError("Das Auto ist nicht erreichbar (kein Netz?) – bitte später erneut")
        erg = self._helfer({"aktion": "befehl", "pfad": str(ORDNER / "private_key.pem"), "token": self._token(),
                            "region": self.cfg.get("region", "eu"), "vin": self._vin(), "befehl": name, "args": args})
        if not erg.get("ok"):
            f = erg.get("fehler", "")
            if "key" in f.lower() and ("not" in f.lower() or "unknown" in f.lower()):
                f += " – ist der virtuelle Schlüssel im Auto hinzugefügt?"
            raise ToolError(f"Tesla: {f}")
        self.c.audit.log("tesla_befehl", befehl=name)
        return {"ok": True}

    # ------------------------------------------------------------ Bild
    def _eigenes_bild(self) -> Path | None:
        for n in ("eigenes_bild.png", "eigenes_bild.jpg"):
            if (ORDNER / n).exists():
                return ORDNER / n
        return None

    def bild_hochladen(self, daten: bytes, name: str = "") -> dict:
        """Eigenes Foto des Autos: Hintergrund wird (macOS 14+) automatisch entfernt; sonst Foto unverändert."""
        if len(daten) < 2000 or len(daten) > 25_000_000:
            raise ToolError("Bitte ein Foto (JPG, PNG oder HEIC) bis 25 MB")
        endung = (Path(name).suffix.lower() or ".jpg") if name else ".jpg"
        if endung not in (".jpg", ".jpeg", ".png", ".heic", ".heif", ".webp"):
            endung = ".jpg"
        roh = ORDNER / f"eigenes_original{endung}"
        roh.write_bytes(daten)
        for alt in ("eigenes_bild.png", "eigenes_bild.jpg"):
            (ORDNER / alt).unlink(missing_ok=True)
        frei = self._freistellen(roh, ORDNER / "eigenes_bild.png")
        if not frei:                                   # ohne Freistellen: als JPG/PNG übernehmen
            ziel = ORDNER / ("eigenes_bild.png" if endung == ".png" else "eigenes_bild.jpg")
            if endung in (".heic", ".heif", ".webp"):
                subprocess.run(["sips", "-s", "format", "jpeg", str(roh), "--out", str(ziel)], capture_output=True)
            else:
                shutil.copyfile(roh, ziel)
        return {"ok": True, "freigestellt": frei,
                "text": "✓ Bild übernommen" + (" und freigestellt" if frei else " (Hintergrund bleibt – freistellen braucht macOS 14)")}

    def bild_entfernen(self) -> dict:
        for n in ("eigenes_bild.png", "eigenes_bild.jpg"):
            (ORDNER / n).unlink(missing_ok=True)
        return {"ok": True}

    def _freistellen(self, ein: Path, aus: Path) -> bool:
        werkzeug = LOCAL_DIR / "bin" / "freistellen"
        quelle = REPO_DIR / "app" / "freistellen.swift"
        if not werkzeug.exists() or (quelle.exists() and quelle.stat().st_mtime > werkzeug.stat().st_mtime):
            werkzeug.parent.mkdir(parents=True, exist_ok=True)
            try:
                r = subprocess.run(["swiftc", "-O", str(quelle), "-o", str(werkzeug)], capture_output=True, timeout=300)
            except (OSError, subprocess.SubprocessError):
                return False
            if r.returncode:
                return False
        try:
            r = subprocess.run([str(werkzeug), str(ein), str(aus)], capture_output=True, timeout=120)
        except (OSError, subprocess.SubprocessError):
            return False
        return r.returncode == 0 and aus.exists() and aus.stat().st_size > 2000

    def bild(self, modell: str, lack: str) -> tuple[bytes, str] | None:
        """Bild fürs Dashboard: eigenes Foto, sonst Konfigurator-Bild (Tesla-Compositor). Für das Model 3 ab 2024
        („Highland“) liefert der Compositor kein verlässliches Bild – dann zeichnet das Dashboard eine eigene Grafik."""
        eigen = self._eigenes_bild()
        if eigen:
            return eigen.read_bytes(), "image/png" if eigen.suffix == ".png" else "image/jpeg"
        if self._cache().get("highland") or (modell == "m3" and "highland" not in self._cache()):
            return None
        datei = ORDNER / f"bild_{modell}_{lack or 'x'}.png"
        if datei.exists() and datei.stat().st_size > 20000:
            return datei.read_bytes(), "image/png"
        if not lack:
            return None
        basis = "https://static-assets.tesla.com/configurator/compositor"
        for optionen in (f"${lack}", f"${lack},$W38B,$MTY13", f"${lack},$WY19B"):
            try:
                r = httpx.get(basis, params={"context": "design_studio_2", "options": optionen, "view": "STUD_3QTR",
                                             "model": modell, "size": 1400, "bkba_opt": 1, "crop": "0,0,0,0"},
                              headers={"User-Agent": "Mozilla/5.0"}, timeout=20)
            except httpx.HTTPError:
                return None
            if r.status_code == 200 and r.headers.get("content-type", "").startswith("image") and len(r.content) > 20000:
                datei.write_bytes(r.content)
                return r.content, "image/png"
        return None


class _Schlaeft(Exception):
    pass


def tools(core) -> list[Tool]:
    t = core.tesla

    def status(wecken=False, anzeigen=True):
        d = t.status(bool(wecken))
        if anzeigen:
            core.broadcast({"type": "tesla", "daten": d})
        kurz = {k: d.get(k) for k in ("name", "modell", "zustand", "stand", "akku", "reichweite_km", "laden", "klima",
                                      "ort", "verriegelt", "waechter", "hinweis")}
        if kurz.get("ort"):
            kurz["ort"] = {"name": d["ort"].get("name"), "faehrt": d["ort"].get("faehrt")}
        return kurz

    def klima(an, temperatur=None):
        if an:
            if temperatur:
                t.befehl("set_temps", driver_temp=float(temperatur), passenger_temp=float(temperatur))
            t.befehl("auto_conditioning_start")
        else:
            t.befehl("auto_conditioning_stop")
        return {"ok": True, "klima": "an" if an else "aus", "temperatur": temperatur}

    def laden(aktion, prozent=None):
        if aktion == "start":
            t.befehl("charge_start")
        elif aktion == "stop":
            t.befehl("charge_stop")
        elif aktion == "limit":
            p = int(prozent or 0)
            if not 50 <= p <= 100:
                raise ToolError("Ladelimit zwischen 50 und 100 %")
            t.befehl("set_charge_limit", percent=p)
        else:
            raise ToolError("aktion: start, stop oder limit")
        return {"ok": True, "aktion": aktion, "prozent": prozent}

    def ladeplan(modus, uhrzeit="", vorklimatisieren=False):
        minuten = 0
        if modus != "aus":
            try:
                h, m = (int(x) for x in str(uhrzeit).split(":")[:2])
                minuten = h * 60 + m
            except ValueError:
                raise ToolError("Uhrzeit als HH:MM angeben")
        if modus == "abfahrt":
            t.befehl("set_scheduled_departure", enable=True, departure_time=minuten,
                     preconditioning_enabled=bool(vorklimatisieren), off_peak_charging_enabled=False)
        elif modus == "start":
            t.befehl("set_scheduled_charging", enable=True, time=minuten)
        elif modus == "aus":
            t.befehl("set_scheduled_charging", enable=False, time=0)
            t.befehl("set_scheduled_departure", enable=False)
        else:
            raise ToolError("modus: abfahrt, start oder aus")
        return {"ok": True, "modus": modus, "uhrzeit": uhrzeit}

    return [
        Tool("tesla_status",
             "Status des Tesla: Akku in %, Reichweite, Laden (Leistung, Limit, Ladeplan), Klima (innen/außen), Standort, "
             "verriegelt. Zeigt das Auto mit Bild und Werten im Dashboard (anzeigen=true). Schläft das Auto, kommt der "
             "letzte Stand – wecken=true nur, wenn der Nutzer ausdrücklich aktuelle Werte will.",
             "tesla.lesen", status, {"wecken": {"type": "boolean"}, "anzeigen": {"type": "boolean"}}),
        Tool("tesla_klima", "Klimatisierung des Tesla ein- oder ausschalten, optional Wunschtemperatur in °C.",
             "tesla.steuern", klima, {"an": {"type": "boolean"}, "temperatur": {"type": "number", "description": "15–28 °C"}},
             ["an"], label=lambda a: f"Tesla-Klima {'an' if a.get('an') else 'aus'}"
                                     + (f" ({a['temperatur']} °C)" if a.get("temperatur") else "")),
        Tool("tesla_laden", "Laden des Tesla starten, stoppen oder Ladelimit setzen.", "tesla.steuern", laden,
             {"aktion": S("start | stop | limit", enum=["start", "stop", "limit"]),
              "prozent": {"type": "integer", "description": "Ladelimit 50–100"}}, ["aktion"],
             label=lambda a: f"Tesla: Laden {a.get('aktion')}" + (f" {a.get('prozent')} %" if a.get("prozent") else "")),
        Tool("tesla_ladeplan",
             "Ladeplanung: 'abfahrt' (fertig geladen und optional vorklimatisiert zur Uhrzeit), 'start' (Ladebeginn zur "
             "Uhrzeit) oder 'aus'.", "tesla.steuern", ladeplan,
             {"modus": S("abfahrt | start | aus", enum=["abfahrt", "start", "aus"]), "uhrzeit": S("HH:MM"),
              "vorklimatisieren": {"type": "boolean"}}, ["modus"],
             label=lambda a: f"Tesla-Ladeplan: {a.get('modus')} {a.get('uhrzeit', '')}"),
    ]
