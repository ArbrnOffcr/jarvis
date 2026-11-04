"""Sparmodus: Arbeitsspeicher freigeben, solange das JARVIS-Fenster zu (oder verborgen) ist.

Der Kern läuft weiter (Telegram, Scan-Ordner, Briefing, Fristen, NUKI, Updates …). Aber:
- Lokales Sprachmodell und Suchmodell (Ollama) bleiben nach Gebrauch nur kurz geladen (Standard 1 Minute statt 30);
  beim Schließen des Fensters werden geladene Modelle nach kurzem Nachlauf sofort entladen.
- Spracherkennung (Whisper, ca. 1,5–2 GB) wird nur bei offenem Fenster vorgeladen und bei geschlossenem
  Fenster nach Gebrauch (z. B. Telegram-Sprachnachricht) wieder freigegeben.
- Das lokale Modell läuft in der 4-Bit-Fassung (ca. 6–7 GB statt 16 GB); fehlt sie, lädt JARVIS sie im
  Hintergrund nach und nutzt bis dahin die vorhandene Fassung.
Einstellbar in config.yaml unter sparmodus: aktiv, nachlauf_min, keep_alive_zu.
"""
from __future__ import annotations

import gc
import threading
import time

import httpx

_INSTANZ: "Sparmodus | None" = None


def keep_alive(standard: str) -> str:
    """Wie lange Ollama ein Modell nach Gebrauch hält – abhängig davon, ob das Fenster offen ist."""
    return _INSTANZ.keep_alive(standard) if _INSTANZ else standard


class Sparmodus:
    def __init__(self, core):
        global _INSTANZ
        self.c = core
        cfg = core.cfg.get("sparmodus") or {}
        self.aktiv = bool(cfg.get("aktiv", True))
        self.nachlauf = float(cfg.get("nachlauf_min", 2)) * 60
        self.ka_zu = str(cfg.get("keep_alive_zu", "1m"))
        self.sichtbar: dict = {}                  # WebSocket → Fenster sichtbar?
        self._zu_seit: float | None = time.time()
        self._entladen = False
        self.url = (core.cfg.get("local") or {}).get("url", "http://127.0.0.1:11434").rstrip("/")
        _INSTANZ = self

    # ------------------------------------------------------------ Fensterzustand
    def fenster_offen(self) -> bool:
        return any(self.sichtbar.get(ws, True) for ws in list(self.c.ws_clients))

    def melden(self, ws, sichtbar: bool) -> None:
        vorher = self.fenster_offen()
        self.sichtbar[ws] = bool(sichtbar)
        if self.fenster_offen() and not vorher:
            self._geoeffnet()

    def verbunden(self, ws) -> None:
        self.sichtbar[ws] = True
        self._geoeffnet()

    def getrennt(self, ws) -> None:
        self.sichtbar.pop(ws, None)

    def _geoeffnet(self) -> None:
        self._zu_seit, self._entladen = None, False
        if self.aktiv:                             # Spracherkennung vorladen, damit der erste Sprachbefehl schnell ist
            threading.Thread(target=whisper_vorwaermen, args=(self.c,), daemon=True, name="whisper-vorwaermen").start()

    def keep_alive(self, standard: str) -> str:
        if not self.aktiv or self.fenster_offen():
            return standard
        return self.ka_zu

    # ------------------------------------------------------------ Hintergrund
    def start(self, stop: threading.Event | None = None) -> None:
        threading.Thread(target=self._lauf, args=(stop,), daemon=True, name="sparmodus").start()
        threading.Thread(target=self.modell_sicherstellen, daemon=True, name="sparmodus-modell").start()

    def _lauf(self, stop) -> None:
        while not (stop and stop.is_set()):
            try:
                self.pruefen()
            except Exception as e:
                self.c.audit.log("fehler", bereich="sparmodus", text=str(e)[:200])
            time.sleep(20)

    def pruefen(self) -> None:
        if not self.aktiv or self.fenster_offen():
            self._zu_seit = None
            return
        if self._zu_seit is None:
            self._zu_seit = time.time()
        if time.time() - self._zu_seit >= self.nachlauf and not self._entladen:
            self.entladen()
            self._entladen = True
        elif self._entladen:
            from atlas import plattform              # z. B. nach einer Telegram-Sprachnachricht wieder freigeben
            if plattform.whisper_geladen() and time.time() - plattform.whisper_zuletzt() > 60:
                plattform.whisper_entladen()

    def entladen(self) -> list[str]:
        """Alle von Ollama geladenen Modelle und die Spracherkennung sofort freigeben."""
        weg = []
        try:
            r = httpx.get(f"{self.url}/api/ps", timeout=3)
            for m in r.json().get("models", []):
                name = m.get("name") or m.get("model")
                ziel = "/api/embed" if "bge" in name or "embed" in name else "/api/generate"
                body = {"model": name, "keep_alive": 0, **({"input": []} if ziel == "/api/embed" else {})}
                try:
                    httpx.post(f"{self.url}{ziel}", json=body, timeout=30)
                    weg.append(name)
                except httpx.HTTPError:
                    pass
        except (httpx.HTTPError, ValueError):
            pass
        from atlas import plattform
        if plattform.whisper_entladen():
            weg.append("Spracherkennung")
        if weg:
            self.c.audit.log("sparmodus", aktion="entladen", was=", ".join(weg))
        return weg

    def stand(self) -> dict:
        from atlas import plattform
        geladen = []
        try:
            geladen = [{"name": m.get("name"), "gb": round(m.get("size", 0) / 1e9, 1), "bis": m.get("expires_at", "")}
                       for m in httpx.get(f"{self.url}/api/ps", timeout=3).json().get("models", [])]
        except (httpx.HTTPError, ValueError):
            pass
        return {"aktiv": self.aktiv, "fenster_offen": self.fenster_offen(), "modelle": geladen,
                "spracherkennung": plattform.whisper_geladen()}

    # ------------------------------------------------------------ 4-Bit-Modell
    def modell_sicherstellen(self) -> None:
        """Ist das bevorzugte (4-Bit-)Modell noch nicht da, im Hintergrund holen – bis dahin läuft die alte Fassung."""
        time.sleep(60)
        p = self.c.providers.get("lokal")
        if not p or not getattr(p, "preferred", None):
            return
        ziel = p.preferred[0]
        try:
            namen = p.list_models()
        except Exception:
            return
        if ziel in namen or ":" not in ziel:
            return
        self.c.audit.log("sparmodus", aktion="modell_laden", modell=ziel)
        try:
            r = httpx.post(f"{self.url}/api/pull", json={"model": ziel, "stream": False},
                           timeout=httpx.Timeout(10, read=7200))
            r.raise_for_status()
        except httpx.HTTPError as e:
            self.c.audit.log("fehler", bereich="sparmodus", text=f"{ziel} nicht geladen: {e}"[:200])
            return
        p._tags = None
        alt = [n for n in namen if n.split(":")[0] == ziel.split(":")[0] and n != ziel]
        text = (f"Das lokale Sprachmodell läuft jetzt in der sparsamen Fassung {ziel} (ca. 6–7 GB statt 16 GB im Speicher)."
                + (f" Die alte Fassung ({', '.join(alt)}) belegt noch Platz auf der Festplatte – entfernen im Terminal mit "
                   f"„ollama rm {alt[0]}“." if alt else ""))
        self.c.audit.log("sparmodus", aktion="modell_bereit", modell=ziel)
        try:
            self.c.proaktiv.hint(text)
        except Exception:
            pass


def whisper_vorwaermen(core) -> None:
    import numpy as np
    from atlas import plattform
    if plattform.whisper_geladen():
        return
    try:
        core.transcriber.transcribe(np.zeros(16000, dtype=np.int16))
    except Exception:
        pass
    gc.collect()
