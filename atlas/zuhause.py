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
            raise ToolError("NUKI-Token wird nicht angenommen.")
        if r.status_code >= 400:
            raise ToolError(f"NUKI antwortet {r.status_code}.")
        return r.json() if r.content else {}

    def schloesser(self) -> list[dict]:
        out = []
        for s in self._nuki("GET", "/smartlock") or []:
            st = s.get("state") or {}
            out.append({"id": s.get("smartlockId"), "name": s.get("name") or "Haustür",
                        "schloss": SCHLOSS.get(st.get("state"), "unbekannt"), "abgeschlossen": st.get("state") == 1,
                        "tuer": TUER.get(st.get("doorState"), "unbekannt"),
                        "batterie": st.get("batteryCharge"), "batterie_kritisch": bool(st.get("batteryCritical"))})
        return out

    def abschliessen(self, name: str = "") -> dict:
        locks = self.schloesser()
        if not locks:
            raise ToolError("Kein NUKI-Schloss im Konto gefunden.")
        ziel = next((l for l in locks if name and name.lower() in l["name"].lower()), locks[0])
        if ziel["abgeschlossen"]:
            return {"schloss": ziel["name"], "status": "war schon abgeschlossen"}
        if ziel["tuer"] == "offen":
            raise ToolError(f"{ziel['name']}: Die Tür steht offen – erst schließen, dann schließe ich ab.")
        self._nuki("POST", f"/smartlock/{int(ziel['id'])}/action", json={"action": ABSCHLIESSEN})
        return {"schloss": ziel["name"], "status": "wird abgeschlossen"}

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
                r["schloesser"] = self.schloesser()
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
