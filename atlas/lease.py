"""Wachhabender: Nur ein Gerät übernimmt Hintergrundaufgaben (Index,
später Briefing/Telegram). Die Wache liegt als kleine Datei im gemeinsamen
Bereich und wird regelmäßig erneuert; fällt sie aus, übernimmt ein anderer."""
import json
import time
from pathlib import Path

from atlas.paths import HOST, USER

ME = f"{HOST}/{USER}"


class Lease:
    def __init__(self, path: Path, ttl: int = 180, bevorzugt: str = ""):
        self.path, self.ttl = path, ttl
        # Bevorzugtes Gerät (z. B. der immer laufende Mac mini) holt sich die Wache zurück,
        # sobald es läuft – sonst bleibt sie zufällig auf dem MacBook hängen.
        self.vorrang = bool(bevorzugt) and bevorzugt.lower() in HOST.lower()
        path.parent.mkdir(parents=True, exist_ok=True)

    def holder(self) -> dict | None:
        try:
            data = json.loads(self.path.read_text())
        except (OSError, ValueError):
            return None
        return data if time.time() - data.get("ts", 0) < self.ttl else None

    def acquire(self) -> bool:
        """Wache übernehmen bzw. erneuern. True = dieses Gerät ist zuständig."""
        h = self.holder()
        if h and h.get("wer") != ME and not self.vorrang:
            return False
        tmp = self.path.with_suffix(".tmp")
        tmp.write_text(json.dumps({"wer": ME, "ts": time.time()}))
        tmp.replace(self.path)
        return True

    def release(self) -> None:
        h = self.holder()
        if h and h.get("wer") == ME:
            self.path.unlink(missing_ok=True)
