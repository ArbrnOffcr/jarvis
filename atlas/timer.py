"""Timer und Wecker.

Läuft im Kern dieses Macs (nicht über iCloud geteilt – sonst klingelt es doppelt). Beim Ablauf: Alarm im
Dashboard (Ton, Ansage, Stopp/Schlummern), dazu eine Mitteilung mit Ton – auch wenn das Dashboard zu ist.
Wecker können sich an Wochentagen wiederholen."""
import json
import subprocess
import threading
import time
import uuid
from datetime import datetime, timedelta

from atlas.paths import LOCAL_DIR
from atlas.tools import S, Tool, ToolError

DATEI = LOCAL_DIR / "timer.json"
TAGE = ["mo", "di", "mi", "do", "fr", "sa", "so"]
SCHLUMMERN = 9 * 60


class Timer:
    def __init__(self, core):
        self.c = core
        self.lock = threading.Lock()
        self.liste: list[dict] = self._laden()
        self.klingelt: dict[str, dict] = {}

    def _laden(self) -> list[dict]:
        try:
            return json.loads(DATEI.read_text())
        except (OSError, ValueError):
            return []

    def _speichern(self) -> None:
        try:
            DATEI.write_text(json.dumps(self.liste, ensure_ascii=False))
        except OSError:
            pass
        self.c.broadcast({"type": "timer_liste", "liste": self.uebersicht()["timer"]})

    def start(self) -> None:
        threading.Thread(target=self._loop, name="timer", daemon=True).start()

    # ------------------------------------------------------------ anlegen
    def timer(self, stunden: int = 0, minuten: int = 0, sekunden: int = 0, titel: str = "") -> dict:
        dauer = int(stunden or 0) * 3600 + int(minuten or 0) * 60 + int(sekunden or 0)
        if dauer < 5 or dauer > 24 * 3600:
            raise ToolError("Dauer zwischen 5 Sekunden und 24 Stunden angeben")
        t = {"id": uuid.uuid4().hex[:6], "art": "timer", "titel": (titel or "Timer").strip()[:40],
             "ende": time.time() + dauer, "dauer": dauer}
        with self.lock:
            self.liste.append(t)
        self._speichern()
        return {"gestellt": t["titel"], "endet_um": datetime.fromtimestamp(t["ende"]).strftime("%H:%M:%S"),
                "dauer": _dauer_text(dauer)}

    def wecker(self, uhrzeit: str, titel: str = "", tage: list[str] | None = None) -> dict:
        try:
            hh, mm = [int(x) for x in uhrzeit.replace(".", ":").split(":")[:2]]
            assert 0 <= hh < 24 and 0 <= mm < 60
        except (ValueError, AssertionError):
            raise ToolError("Uhrzeit bitte als HH:MM")
        tage = [t.lower()[:2] for t in (tage or []) if t.lower()[:2] in TAGE]
        w = {"id": uuid.uuid4().hex[:6], "art": "wecker", "titel": (titel or "Wecker").strip()[:40],
             "uhrzeit": f"{hh:02d}:{mm:02d}", "tage": tage}
        w["ende"] = _naechster(w)
        with self.lock:
            self.liste.append(w)
        self._speichern()
        wann = datetime.fromtimestamp(w["ende"])
        tag = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"][wann.weekday()]
        return {"gestellt": w["titel"], "klingelt": f"{tag} {wann:%d.%m. %H:%M}",
                "wiederholt": ", ".join(tage) if tage else "einmalig"}

    # ------------------------------------------------------------ verwalten
    def uebersicht(self) -> dict:
        jetzt = time.time()
        return {"timer": [{"id": t["id"], "art": t["art"], "titel": t["titel"], "ende": t["ende"],
                           "rest": _dauer_text(max(0, t["ende"] - jetzt)),
                           "um": datetime.fromtimestamp(t["ende"]).strftime("%H:%M"),
                           **({"tage": t.get("tage")} if t["art"] == "wecker" else {})}
                          for t in sorted(self.liste, key=lambda x: x["ende"])],
                "klingelt": list(self.klingelt.values())}

    def loeschen(self, wer: str = "alle") -> dict:
        w = (wer or "alle").lower().strip()
        with self.lock:
            weg = [t for t in self.liste if w in ("alle", "alles") or t["id"] == w or w in t["titel"].lower()
                   or (w in ("timer", "wecker") and t["art"] == w)]
            self.liste = [t for t in self.liste if t not in weg]
        for t in list(self.klingelt):
            if w in ("alle", "alles") or t == w:
                self.klingelt.pop(t, None)
        self._speichern()
        if not weg:
            raise ToolError("Kein passender Timer oder Wecker")
        return {"geloescht": [t["titel"] for t in weg]}

    def stoppen(self, tid: str) -> dict:
        self.klingelt.pop(tid, None)
        self.c.broadcast({"type": "alarm_aus", "id": tid})
        return {"ok": True}

    def schlummern(self, tid: str) -> dict:
        a = self.klingelt.pop(tid, None)
        if not a:
            raise ToolError("Klingelt nicht")
        t = {"id": uuid.uuid4().hex[:6], "art": "timer", "titel": a["titel"], "ende": time.time() + SCHLUMMERN,
             "dauer": SCHLUMMERN}
        with self.lock:
            self.liste.append(t)
        self._speichern()
        self.c.broadcast({"type": "alarm_aus", "id": tid})
        return {"schlummern_bis": datetime.fromtimestamp(t["ende"]).strftime("%H:%M")}

    # ------------------------------------------------------------ Ablauf
    def _loop(self) -> None:
        while True:
            try:
                self._pruefen()
            except Exception as e:
                self.c.audit.log("fehler", bereich="timer", text=str(e)[:200])
            time.sleep(1)

    def _pruefen(self) -> None:
        jetzt, faellig = time.time(), []
        with self.lock:
            for t in list(self.liste):
                if t["ende"] <= jetzt:
                    faellig.append(t)
                    if t["art"] == "wecker" and t.get("tage"):
                        t["ende"] = _naechster(t, nach=jetzt + 60)
                    else:
                        self.liste.remove(t)
        if not faellig:
            return
        self._speichern()
        for t in faellig:
            if jetzt - t["ende"] > 3600:                  # Mac schlief: alte Alarme nur melden, nicht klingeln
                self._mitteilung(f"Verpasst: {t['titel']} ({datetime.fromtimestamp(t['ende']):%H:%M})", ton=False)
                continue
            a = {"id": t["id"], "art": t["art"], "titel": t["titel"], "seit": jetzt}
            self.klingelt[t["id"]] = a
            self.c.broadcast({"type": "alarm", **a})
            self._mitteilung(("⏰ " if t["art"] == "wecker" else "⏱ ") + t["titel"], ton=True)
            if not self.c.ws_clients:                     # kein Dashboard offen: Ton am Mac
                threading.Thread(target=self._klingeln, args=(t["id"],), daemon=True).start()
            self.c.audit.log("alarm", art=t["art"], titel=t["titel"])

    def _klingeln(self, tid: str) -> None:
        for _ in range(20):                               # höchstens ~1 Minute
            if tid not in self.klingelt or self.c.ws_clients:
                return
            try:
                subprocess.run(["afplay", "/System/Library/Sounds/Glass.aiff"], capture_output=True, timeout=10)
            except (OSError, subprocess.SubprocessError):
                return
            time.sleep(1.5)

    @staticmethod
    def _mitteilung(text: str, ton: bool) -> None:
        skript = f'display notification {json.dumps(text)} with title "JARVIS"' + (' sound name "Glass"' if ton else "")
        try:
            subprocess.run(["osascript", "-e", skript], capture_output=True, timeout=10)
        except (OSError, subprocess.SubprocessError):
            pass


def _naechster(w: dict, nach: float | None = None) -> float:
    jetzt = datetime.fromtimestamp(nach or time.time())
    hh, mm = map(int, w["uhrzeit"].split(":"))
    for tag in range(0, 8):
        d = (jetzt + timedelta(days=tag)).replace(hour=hh, minute=mm, second=0, microsecond=0)
        if d <= jetzt:
            continue
        if not w.get("tage") or TAGE[d.weekday()] in w["tage"]:
            return d.timestamp()
    return (jetzt + timedelta(days=1)).timestamp()


def _dauer_text(s: float) -> str:
    s = int(round(s))
    h, m, sek = s // 3600, s % 3600 // 60, s % 60
    if h:
        return f"{h} Std. {m} Min."
    if m:
        return f"{m} Min." + (f" {sek} Sek." if sek and m < 10 else "")
    return f"{sek} Sek."


def tools(core) -> list[Tool]:
    t = core.timer
    zahl = lambda d: {"type": "integer", "description": d}
    return [
        Tool("timer_stellen", "Countdown-Timer stellen (z. B. „Timer 10 Minuten für die Nudeln“). Klingelt im Dashboard "
             "und als Mitteilung.", "timer", t.timer,
             {"stunden": zahl("Stunden"), "minuten": zahl("Minuten"), "sekunden": zahl("Sekunden"),
              "titel": S("Wofür, z. B. 'Nudeln'")}, [], label=lambda a: f"Timer {a.get('titel') or ''}"),
        Tool("wecker_stellen", "Wecker zu einer Uhrzeit stellen, optional an bestimmten Wochentagen wiederholt.",
             "timer", t.wecker,
             {"uhrzeit": S("HH:MM"), "titel": S("optional"),
              "tage": {"type": "array", "items": {"type": "string", "enum": TAGE},
                       "description": "Wiederholung, z. B. ['mo','di','mi','do','fr']; leer = einmalig"}},
             ["uhrzeit"], label=lambda a: f"Wecker {a.get('uhrzeit')}"),
        Tool("timer_liste", "Laufende Timer und gestellte Wecker mit Restzeit.", "timer", t.uebersicht),
        Tool("timer_loeschen", "Timer/Wecker löschen oder klingelnden Alarm beenden: id, Teil des Titels, 'timer', "
             "'wecker' oder 'alle'.", "timer", t.loeschen, {"wer": S("id, Titel oder 'alle'")}),
    ]
