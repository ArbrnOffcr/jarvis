"""Zuhause: Apple HomeKit (Lichter, Lautsprecher) über Kurzbefehle und das NUKI-Schloss.

HomeKit hat am Mac keine offene Schnittstelle – der saubere Weg sind Kurzbefehle. Du legst in der App
„Kurzbefehle“ für jede Szene/Aktion einen Kurzbefehl an, dessen Name mit „JARVIS“ beginnt (z. B. „JARVIS Licht
Wohnzimmer an“, „JARVIS Szene Abend“, „JARVIS Lautsprecher Küche leiser“). JARVIS findet sie selbst und kann sie
ausführen. Kurzbefehle zu Türen, Schlössern, Garagen oder Alarmanlagen führt er bewusst nie aus.

NUKI (Web-API, Token im Schlüsselbund): Status lesen und ABSCHLIESSEN. Aufschließen, Öffnen und Lock'n'Go gibt
es im Code nicht – wie beim Tesla. Abends um 21:45 meldet JARVIS eine nicht abgeschlossene Tür.
"""
import re
import subprocess
import threading
import time
from datetime import datetime


from atlas.keystore import get_secret
from atlas.tools import S, Tool, ToolError

PRAEFIX = re.compile(r"^\s*jarvis\b[\s:·\-–]*", re.I)
SPERRE = re.compile(r"tür|tuer|door|schloss|lock|nuki|öffne|oeffne|aufschließ|aufschliess|entriegel|garage|tor\b|"
                    r"alarm|kamera|camera|einbruch", re.I)
NUKI_API = "https://api.nuki.io"
SCHLOSS = {0: "nicht kalibriert", 1: "abgeschlossen", 2: "wird aufgeschlossen", 3: "aufgeschlossen", 4: "wird abgeschlossen",
           5: "offen (Falle gezogen)", 6: "aufgeschlossen (Lock'n'Go)", 7: "wird geöffnet", 253: "startet", 254: "Motor blockiert",
           255: "unbekannt"}
TUER = {0: "kein Türsensor", 1: "Sensor aus", 2: "geschlossen", 3: "offen", 4: "unbekannt", 5: "kalibriert"}
ABSCHLIESSEN = 2          # einzige Aktion, die JARVIS an das Schloss sendet
# Gerätetypen der NUKI-Web-API: 0 Smart Lock 1/2, 1 Box, 2 Opener, 3 Smart Door, 4 Smart Lock 3.0/4.0 (Pro), 5 Smart Lock Ultra.
# Box und Opener sind keine Schlösser – der Opener meldet z. B. state 1 = „online“, was sonst „abgeschlossen“ hieße.
SCHLOSS_TYPEN = {0, 3, 4, 5}
VERBINDUNG = {0: "verbunden", 1: "nicht registriert", 2: "Konfiguration wird übertragen", 3: "Konfigurationsfehler",
              4: "offline – keine Verbindung zum NUKI-Server"}


class Zuhause:
    def __init__(self, core):
        self.c = core
        self._kb = (0.0, [])

    # ------------------------------------------------------------ HomeKit über Kurzbefehle
    def kurzbefehle(self, neu: bool = False) -> list[dict]:
        if not neu and time.time() - self._kb[0] < 300:
            return self._kb[1]
        try:
            r = subprocess.run(["shortcuts", "list"], capture_output=True, text=True, timeout=20)
            namen = [z.strip() for z in r.stdout.splitlines() if z.strip()]
        except (OSError, subprocess.TimeoutExpired):
            namen = []
        out = [{"name": n, "aktion": PRAEFIX.sub("", n), "gesperrt": bool(SPERRE.search(n))}
               for n in namen if PRAEFIX.match(n) and PRAEFIX.sub("", n)]
        self._kb = (time.time(), out)
        return out

    def ausfuehren(self, aktion: str) -> dict:
        kb = [k for k in self.kurzbefehle() if not k["gesperrt"]]
        if not kb:
            raise ToolError("Keine JARVIS-Kurzbefehle gefunden. In der App „Kurzbefehle“ z. B. „JARVIS Licht Wohnzimmer an“ "
                            "anlegen (Aktion „Steuere Zuhause“).")
        a = (aktion or "").strip().lower()
        treffer = next((k for k in kb if k["aktion"].lower() == a), None) or \
            next((k for k in kb if a and a in k["aktion"].lower()), None)
        if not treffer:
            raise ToolError("Unbekannt. Verfügbar: " + ", ".join(k["aktion"] for k in kb))
        if SPERRE.search(treffer["name"]):
            raise ToolError("Türen, Schlösser und Alarmanlagen steuert JARVIS über Kurzbefehle nie.")
        try:
            r = subprocess.run(["shortcuts", "run", treffer["name"]], capture_output=True, text=True, timeout=45)
        except subprocess.TimeoutExpired:
            raise ToolError("Der Kurzbefehl hat nicht geantwortet.")
        if r.returncode != 0:
            raise ToolError(f"Kurzbefehl fehlgeschlagen: {(r.stderr or '').strip()[:160]}")
        return {"ausgefuehrt": treffer["aktion"]}

    # ------------------------------------------------------------ NUKI
    def _nuki(self, methode: str, pfad: str, **kw):
        import httpx
        token = get_secret("nuki")
        if not token:
            raise ToolError("NUKI ist nicht eingerichtet (⚙ Einstellungen → Zuhause → NUKI-Token).")
        try:
            r = httpx.request(methode, NUKI_API + pfad, headers={"Authorization": f"Bearer {token}",
                                                                 "Accept": "application/json"}, timeout=20, **kw)
        except httpx.HTTPError:
            raise ToolError("NUKI-Server nicht erreichbar.")
        if r.status_code in (401, 403):
            if methode == "POST":
                raise ToolError("NUKI lehnt den Befehl ab: Das API-Token darf nur lesen. In web.nuki.io → API ein neues "
                                "Token mit der Berechtigung „Smart Locks bedienen“ (Aktionen) erstellen und unter "
                                "Einstellungen → Konten → NUKI eintragen.")
            raise ToolError("NUKI-Token wird nicht angenommen.")
        if r.status_code >= 400:
            try:
                grund = (r.json() or {}).get("detailMessage") or (r.json() or {}).get("message") or ""
            except ValueError:
                grund = r.text[:160]
            raise ToolError(f"NUKI antwortet {r.status_code}{': ' + str(grund)[:160] if grund else ''}.")
        return r.json() if r.content else {}

    @staticmethod
    def _eintrag(s: dict) -> dict:
        st = s.get("state") or {}
        ladung = st.get("batteryCharge")
        aktual = s.get("updateDate") or ""
        alter_min = None
        if aktual:
            try:
                alter_min = int((datetime.now().astimezone() - datetime.fromisoformat(aktual.replace("Z", "+00:00"))).total_seconds() // 60)
            except ValueError:
                pass
        return {"id": s.get("smartlockId"), "name": s.get("name") or "Haustür", "typ": s.get("type"),
                "schloss": SCHLOSS.get(st.get("state"), "unbekannt"), "abgeschlossen": st.get("state") == 1,
                "tuer": TUER.get(st.get("doorState"), "unbekannt"),
                # Ladestand gibt es nur bei Smart Lock 3.0/4.0/Ultra; ältere melden nur „kritisch ja/nein“ – dann keine Prozentzahl
                "batterie": ladung if isinstance(ladung, (int, float)) and 0 <= ladung <= 100 and s.get("type") in (4, 5) else None,
                "batterie_kritisch": bool(st.get("batteryCritical")), "laedt": bool(st.get("batteryCharging")),
                "keypad_batterie_kritisch": bool(st.get("keypadBatteryCritical")),
                "tuersensor_batterie_kritisch": bool(st.get("doorsensorBatteryCritical")),
                "verbindung": VERBINDUNG.get(s.get("serverState"), "unbekannt"), "offline": s.get("serverState") == 4,
                "stand": aktual, "stand_alter_min": alter_min}

    def schloesser(self, frisch: bool = False) -> list[dict]:
        """Nur echte Schlösser (kein Opener, keine Box). Die Web-API liefert den zuletzt vom Schloss gemeldeten
        Stand – darum steht das Alter des Stands mit dabei (frisch: ungenutzt, bleibt für Aufrufer kompatibel)."""
        roh = [s for s in (self._nuki("GET", "/smartlock") or []) if s.get("type", 0) in SCHLOSS_TYPEN]
        return [self._eintrag(s) for s in roh]

    def _eines(self, sid) -> dict | None:
        s = self._nuki("GET", f"/smartlock/{int(sid)}")
        return self._eintrag(s) if s else None

    def abschliessen(self, name: str = "") -> dict:
        locks = self.schloesser()
        if not locks:
            raise ToolError("Kein NUKI-Schloss im Konto gefunden (Opener und Box zählen nicht).")
        ziel = next((l for l in locks if name and name.lower() in l["name"].lower()), locks[0])
        if ziel["tuer"] == "offen":
            raise ToolError(f"{ziel['name']}: Die Tür steht offen – erst schließen, dann schließe ich ab.")
        if ziel["offline"]:
            raise ToolError(f"{ziel['name']} ist offline (keine Verbindung zum NUKI-Server – Bridge bzw. WLAN prüfen). "
                            f"Der Befehl käme nicht an.")
        # Gemeldeter Zustand kann veraltet sein – „schon abgeschlossen“ wird darum nicht geglaubt, sondern trotzdem gesendet
        try:
            self._nuki("POST", f"/smartlock/{int(ziel['id'])}/action/lock")
        except ToolError as e:
            if "Berechtigung" in str(e):
                raise
            self._nuki("POST", f"/smartlock/{int(ziel['id'])}/action", json={"action": ABSCHLIESSEN, "option": 0})
        self.c.audit.log("zuhause", nuki="abschliessen", schloss=ziel["name"])
        # Nachsehen, ob es wirklich passiert ist (bis 30 s)
        ende = time.time() + 30
        while time.time() < ende:
            time.sleep(4)
            try:
                jetzt = self._eines(ziel["id"])
            except ToolError:
                continue
            if jetzt and jetzt["abgeschlossen"]:
                return {"schloss": ziel["name"], "status": "abgeschlossen ✓ (bestätigt)"}
            if jetzt and jetzt["schloss"] == "Motor blockiert":
                raise ToolError(f"{ziel['name']}: Motor blockiert – Riegel klemmt oder Tür nicht ganz zu.")
        return {"schloss": ziel["name"], "status": "Befehl gesendet, aber noch nicht bestätigt – das Schloss hat sich "
                                                  "binnen 30 s nicht als abgeschlossen gemeldet. Bitte kurz in der NUKI-App "
                                                  "nachsehen (Bridge/WLAN-Verbindung des Schlosses).", "bestaetigt": False}

    # ------------------------------------------------------------ Abendkontrolle
    def schleife(self, stop: threading.Event) -> None:
        gemeldet = ""
        while not stop.wait(120):
            try:
                if not getattr(self.c.proaktiv, "leader", False) or not get_secret("nuki"):
                    continue
                jetzt = datetime.now()
                if (jetzt.hour, jetzt.minute) >= (21, 45) and jetzt.hour < 23 and gemeldet != str(jetzt.date()):
                    gemeldet = str(jetzt.date())
                    offen = [l for l in self.schloesser() if not l["abgeschlossen"]]
                    if offen:
                        self.c.proaktiv.hint("🔓 " + ", ".join(f"{l['name']} ist {l['schloss']}" for l in offen)
                                             + " – soll ich abschließen?", dringend=True, art="zuhause")
                    kritisch = [l for l in self.schloesser() if l["batterie_kritisch"]]
                    if kritisch:
                        self.c.proaktiv.hint("🔋 NUKI-Batterie fast leer: " + ", ".join(l["name"] for l in kritisch), art="zuhause")
            except Exception as e:
                self.c.audit.log("fehler", bereich="zuhause", text=f"{type(e).__name__}: {e}"[:200])

    def start(self, stop: threading.Event) -> None:
        threading.Thread(target=self.schleife, args=(stop,), name="zuhause", daemon=True).start()

    def status(self) -> dict:
        kb = self.kurzbefehle()
        r = {"kurzbefehle": [k["aktion"] for k in kb if not k["gesperrt"]],
             "gesperrte_kurzbefehle": [k["aktion"] for k in kb if k["gesperrt"]], "nuki": bool(get_secret("nuki"))}
        if r["nuki"]:
            try:
                r["schloesser"] = self.schloesser(frisch=True)
            except ToolError as e:
                r["nuki_fehler"] = str(e)
        return r


def tools(core) -> list[Tool]:
    z = core.zuhause
    return [
        Tool("zuhause_status", "Zuhause: verfügbare HomeKit-Aktionen (Lichter, Lautsprecher, Szenen) und NUKI-Schloss "
             "(abgeschlossen? Tür offen? Batterie).", "zuhause.lesen", lambda: z.status()),
        Tool("zuhause_steuern", "HomeKit-Aktion ausführen (Licht, Lautsprecher, Szene) – Name aus zuhause_status, z. B. "
             "„Licht Wohnzimmer an“. Türen/Schlösser gehen hier nie.", "zuhause.steuern",
             lambda aktion: z.ausfuehren(aktion), {"aktion": S("Name der Aktion")}, ["aktion"],
             label=lambda a: f"Zuhause: {a.get('aktion')}"),
        Tool("nuki_abschliessen", "Haustür (NUKI) ABSCHLIESSEN. Aufschließen/Öffnen kann JARVIS bewusst nicht.",
             "nuki.abschliessen", lambda schloss="": z.abschliessen(schloss), {"schloss": S("Name, optional")},
             label=lambda a: f"{a.get('schloss') or 'Haustür'} abschließen"),
    ]
