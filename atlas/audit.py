"""Audit-Log und Verbrauchszähler.

Geschrieben wird immer zuerst LOKAL (~/.atlas) – das klappt garantiert.
Ein Hintergrund-Abgleich kopiert die Dateien alle paar Minuten nach iCloud
(Audit-Log ins DATENARCHIV, Verbrauch ins private ATLAS-Privat).
Grund: iCloud sperrt Dateien während der Synchronisation kurzzeitig
(„Resource deadlock avoided“); direktes Schreiben dorthin ist unzuverlässig.

Je Gerät, Nutzer und Tag/Monat eine eigene Datei – so entstehen in iCloud
keine Konflikte, obwohl mehrere Macs gleichzeitig schreiben."""
import json
import shutil
import threading
from datetime import datetime
from pathlib import Path

from atlas.paths import HOST, LOCAL_DIR, USER, private_dir, shared_dir

SYNC_SECONDS = 300


class Audit:
    def __init__(self, cfg: dict):
        self.cloud_logs = shared_dir(cfg) / "logs"
        self.cloud_usage = private_dir() / "verbrauch"
        self.local_logs = LOCAL_DIR / "audit"
        self.local_usage = LOCAL_DIR / "verbrauch"
        for d in (self.local_logs, self.local_usage):
            d.mkdir(parents=True, exist_ok=True)
        for d in (self.cloud_logs, self.cloud_usage):
            try:
                d.mkdir(parents=True, exist_ok=True)
            except OSError:
                pass
        self.lock = threading.Lock()
        self._stop = threading.Event()
        # Übernahme bisheriger Stände aus iCloud (einmalig, falls lokal noch leer)
        for src_dir, dst in ((self.cloud_usage, self._usage_file()),
                             (self.cloud_logs, self._log_file())):
            src = src_dir / dst.name
            try:
                if not dst.exists() and src.exists():
                    shutil.copyfile(src, dst)
            except OSError:
                pass
        threading.Thread(target=self._sync_loop, name="audit-sync", daemon=True).start()

    # ---------- Protokoll ----------
    def _log_file(self, day: datetime | None = None) -> Path:
        return self.local_logs / f"{(day or datetime.now()):%Y-%m-%d}_{HOST}_{USER}.jsonl"

    def log(self, event: str, **details) -> None:
        """Schreibt nie eine Ausnahme nach außen – Protokollieren darf nichts lahmlegen."""
        now = datetime.now()
        entry = {"ts": now.isoformat(timespec="seconds"), "user": USER,
                 "host": HOST, "event": event, **details}
        try:
            with self.lock, open(self._log_file(now), "a", encoding="utf-8") as f:
                f.write(json.dumps(entry, ensure_ascii=False, default=str) + "\n")
        except OSError:
            pass

    def tail(self, n: int = 10, events=("werkzeug", "bestaetigung", "werkzeug_verweigert",
                                         "notaus", "fehler")) -> list[dict]:
        """Letzte Aktionen dieses Nutzers auf diesem Gerät (heute)."""
        path = self._log_file()
        if not path.exists():
            return []
        rows = []
        try:
            lines = path.read_text(encoding="utf-8").splitlines()[-400:]
        except OSError:
            return []
        for line in lines:
            try:
                e = json.loads(line)
            except ValueError:
                continue
            if e.get("event") in events:
                rows.append(e)
        return rows[-n:][::-1]

    # ---------- Verbrauch (Tokens) je Monat ----------
    def _usage_file(self) -> Path:
        return self.local_usage / f"{datetime.now():%Y-%m}_{HOST}.json"

    def add_usage(self, provider: str, tokens_in: int, tokens_out: int) -> None:
        path = self._usage_file()
        with self.lock:
            try:
                data = json.loads(path.read_text()) if path.exists() else {}
            except (OSError, ValueError):
                data = {}
            p = data.setdefault(provider, {"in": 0, "out": 0, "anfragen": 0})
            p["in"] += tokens_in
            p["out"] += tokens_out
            p["anfragen"] += 1
            try:
                path.write_text(json.dumps(data, indent=2))
            except OSError:
                pass

    def month_usage(self) -> dict:
        """Summe über alle Geräte dieses Nutzers im laufenden Monat:
        eigenes Gerät aus der lokalen Datei, andere Geräte aus iCloud."""
        month = f"{datetime.now():%Y-%m}"
        files = {f.name: f for f in self._safe_glob(self.cloud_usage, f"{month}_*.json")}
        own = self._usage_file()
        files[own.name] = own
        total: dict = {}
        for f in files.values():
            try:
                data = json.loads(f.read_text())
            except (OSError, ValueError):
                continue
            for prov, v in data.items():
                t = total.setdefault(prov, {"in": 0, "out": 0, "anfragen": 0})
                for k in t:
                    t[k] += v.get(k, 0)
        return total

    # ---------- Abgleich nach iCloud ----------
    @staticmethod
    def _safe_glob(folder: Path, pattern: str):
        try:
            return list(folder.glob(pattern))
        except OSError:
            return []

    @staticmethod
    def _copy(src: Path, dst_dir: Path) -> None:
        """Atomar kopieren; schlägt es fehl (iCloud gesperrt), beim nächsten Mal erneut."""
        try:
            tmp = dst_dir / f".{src.name}.tmp"
            shutil.copyfile(src, tmp)
            tmp.replace(dst_dir / src.name)
        except OSError:
            pass

    def sync(self) -> None:
        with self.lock:
            for f in sorted(self.local_logs.glob("*.jsonl"))[-3:]:     # heute + 2 Vortage
                self._copy(f, self.cloud_logs)
            own = self._usage_file()
            if own.exists():
                self._copy(own, self.cloud_usage)

    def _sync_loop(self):
        while not self._stop.wait(SYNC_SECONDS):
            self.sync()
