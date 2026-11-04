"""Sichtbare Abläufe: Automationen (z. B. die PKV-Einreichung) melden ihre Schritte live an die Oberfläche.

Die Oberfläche zeigt daraus eine 3D-Strecke (Stationen, Lichtimpuls, rot bei Fehler mit Fehlerbild).
Nur Schrittnamen und kurze Statustexte gehen an die Oberfläche – nie Werte, Zugangsdaten oder Codes.
Fehlerbilder bleiben lokal und werden nur aus freigegebenen Ordnern ausgeliefert."""
from __future__ import annotations

import re
import threading
import time
import uuid
from pathlib import Path

BILDORDNER: dict[str, Path] = {}          # art → Ordner mit Fehlerbildern (z. B. "pkv" → ~/.atlas/pkv_portal/fehler)
_LETZTE: dict[str, dict] = {}
_LOCK = threading.Lock()
HALTEN_S = 30 * 60                        # so lange liefert /ablauf einen Ablauf noch nach (z. B. für ein neu geöffnetes Fenster)
NAME = re.compile(r"^[\w.-]{1,80}\.png$")


class Ablauf:
    def __init__(self, core, art: str, titel: str, schritte: list[str]):
        self.c = core
        self.art = art
        self.z = {"type": "ablauf", "id": f"{art}-{uuid.uuid4().hex[:8]}", "art": art, "titel": str(titel)[:60],
                  "schritte": [str(s)[:32] for s in schritte], "aktiv": -1, "status": "laeuft", "text": "",
                  "bild": "", "start": time.time(), "zeit": time.time()}
        self._senden()

    def schritt(self, i: int, text: str = "") -> None:
        self.z["aktiv"] = max(0, min(int(i), len(self.z["schritte"]) - 1))
        self.z["text"] = str(text)[:120]
        self._senden()

    def text(self, text: str) -> None:
        self.z["text"] = str(text)[:120]
        self._senden()

    def fertig(self, text: str = "") -> None:
        self.z.update(status="ok", aktiv=len(self.z["schritte"]), text=str(text)[:120])
        self._senden()

    def fehler(self, text: str, bild: Path | None = None) -> None:
        self.z.update(status="fehler", text=str(text)[:160])
        if bild and NAME.match(bild.name) and self.art in BILDORDNER:
            self.z["bild"] = f"/ablauf/bild/{self.art}/{bild.name}"
        self._senden()

    def _senden(self) -> None:
        self.z["zeit"] = time.time()
        with _LOCK:
            _LETZTE[self.z["id"]] = dict(self.z)
            for k in [k for k, v in _LETZTE.items() if time.time() - v["zeit"] > HALTEN_S]:
                _LETZTE.pop(k, None)
        try:
            self.c.broadcast(dict(self.z))
        except Exception:
            pass


def aktuell() -> list[dict]:
    with _LOCK:
        return sorted((dict(v) for v in _LETZTE.values() if time.time() - v["zeit"] <= HALTEN_S),
                      key=lambda v: v["start"])


def bild_pfad(art: str, name: str) -> Path | None:
    ordner = BILDORDNER.get(art)
    if not ordner or not NAME.match(name or ""):
        return None
    p = (ordner / name).resolve()
    return p if p.parent == ordner.resolve() and p.is_file() else None
