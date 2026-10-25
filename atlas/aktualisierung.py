"""Automatische Aktualisierung auf allen Macs.

Ablauf: Auf dem Entwicklungs-Mac sichert 'jarvis speichern' die Änderungen auf GitHub und legt
ein kleines Signal im gemeinsamen Bereich (iCloud) ab. Jeder laufende JARVIS-Kern prüft das Signal
jede Minute und GitHub zusätzlich alle 15 Minuten. Gibt es eine neuere Version, holt er sie
(nur „fast-forward“, nie bei lokalen Änderungen), installiert bei Bedarf neue Pakete und startet
sich neu – launchd startet ihn sofort wieder. Offene Dashboards laden danach von selbst neu."""
import os
import shutil
import subprocess
import threading
import time
from pathlib import Path

from atlas.paths import LOCAL_DIR, REPO_DIR

SIGNAL = "system/version.txt"            # im gemeinsamen Bereich (shared_dir)
VERSION = LOCAL_DIR / "version.json"     # Stand weitergegebener Installationen (ohne git)


def release_stand() -> str:
    import json
    try:
        return json.loads(VERSION.read_text()).get("sha", "")
    except (OSError, ValueError):
        return ""


def _git(*args, timeout=60) -> subprocess.CompletedProcess:
    return subprocess.run(["git", "-C", str(REPO_DIR), *args], capture_output=True, text=True, timeout=timeout)


def commit() -> str:
    r = _git("rev-parse", "HEAD")
    return r.stdout.strip() if r.returncode == 0 else ""


def signal_setzen(shared: Path) -> None:
    """Von 'jarvis speichern' aufgerufen: andere Macs sofort auf die neue Version aufmerksam machen."""
    try:
        f = shared / SIGNAL
        f.parent.mkdir(parents=True, exist_ok=True)
        f.write_text(commit() + "\n", encoding="utf-8")
    except OSError:
        pass


class Aktualisierung:
    def __init__(self, core):
        self.c = core
        cfg = core.cfg.get("update") or {}
        self.repo = ((core.cfg.get("release") or {}).get("repo") or "").strip()
        self.git = (REPO_DIR / ".git").exists()
        self.aktiv = cfg.get("auto", True) and (self.git or bool(self.repo))
        self.intervall = max(5, int(cfg.get("intervall_min", 15))) * 60
        if not self.git:                                 # GitHub-API ohne Anmeldung: sparsam fragen
            self.intervall = max(self.intervall, 3 * 3600)
        self.letzter_fetch = 0.0
        self.gemeldet = ""
        self.stand = {"commit": (commit() if self.git else release_stand())[:7], "geprueft": None, "hinweis": ""}

    def start(self) -> None:
        if self.aktiv:
            threading.Thread(target=self._loop, name="aktualisierung", daemon=True).start()

    # ------------------------------------------------------------------
    def _signal(self) -> str:
        try:
            return (self.c.shared / SIGNAL).read_text(encoding="utf-8").strip()
        except OSError:
            return ""

    def _loop(self) -> None:
        time.sleep(45)                                   # erst in Ruhe starten
        while True:
            try:
                sig = self._signal()
                faellig = time.time() - self.letzter_fetch > self.intervall
                if faellig or (sig and sig != commit() and sig != self.gemeldet):
                    self.pruefen()
            except Exception as e:                       # Aktualisierung darf nie den Kern stören
                self.c.audit.log("fehler", bereich="aktualisierung", text=str(e)[:300])
            time.sleep(60)

    def beschaeftigt(self) -> bool:
        return bool(getattr(self.c, "aufnahmen_aktiv", 0) or getattr(self.c, "chats_aktiv", 0))

    def pruefen(self) -> dict:
        self.letzter_fetch = time.time()
        self.stand["geprueft"] = time.strftime("%H:%M")
        if not self.git:
            return self.release_pruefen()
        r = _git("fetch", "-q", "origin", "main", timeout=90)
        if r.returncode:
            self.stand["hinweis"] = "GitHub nicht erreichbar"
            return self.stand
        alt, neu = commit(), _git("rev-parse", "origin/main").stdout.strip()
        if not neu or alt == neu:
            self.stand["hinweis"] = "aktuell"
            return self.stand
        if _git("merge-base", "--is-ancestor", "HEAD", "origin/main").returncode:
            return self._melden(neu, "Neue Version verfügbar, aber dieser Mac hat eigene Änderungen – "
                                     "bitte 'jarvis speichern' oder 'jarvis update'.")
        if _git("status", "--porcelain", "--untracked-files=no").stdout.strip():
            return self._melden(neu, "Neue Version verfügbar, aber es gibt ungesicherte Änderungen – "
                                     "bitte 'jarvis speichern'.")
        if self.beschaeftigt():
            self.stand["hinweis"] = "wartet (Aufnahme oder Gespräch läuft)"
            self.letzter_fetch = time.time() - self.intervall + 120     # in 2 Minuten erneut
            return self.stand
        geaendert = _git("diff", "--name-only", alt, neu).stdout.split()
        if _git("merge", "--ff-only", "-q", "origin/main").returncode:
            return self._melden(neu, "Update konnte nicht eingespielt werden – 'jarvis update' ausführen.")
        if "pyproject.toml" in geaendert:                # neue Pakete
            uv = shutil.which("uv") or "/opt/homebrew/bin/uv"
            subprocess.run([uv, "pip", "install", "-q", "--python", str(LOCAL_DIR / "venv/bin/python"),
                            "-e", str(REPO_DIR)], capture_output=True, timeout=900)
        self.c.audit.log("aktualisierung", von=alt[:7], nach=neu[:7], dateien=len(geaendert))
        self.c.broadcast({"type": "update", "commit": neu[:7]})
        time.sleep(1.5)
        os._exit(0)                                      # launchd startet den Kern mit neuem Code

    # ------------------------------------------------ weitergegebene Installationen
    def release_pruefen(self) -> dict:
        """Neuesten Stand des öffentlichen Repositorys holen und einspielen (ohne git)."""
        import json
        import tarfile
        import tempfile
        import httpx
        try:
            r = httpx.get(f"https://api.github.com/repos/{self.repo}/commits/main",
                          headers={"Accept": "application/vnd.github+json"}, timeout=20)
            r.raise_for_status()
            neu = r.json()["sha"]
        except Exception:
            self.stand["hinweis"] = "GitHub nicht erreichbar"
            return self.stand
        alt = release_stand()
        if neu == alt:
            self.stand["hinweis"] = "aktuell"
            return self.stand
        if self.beschaeftigt():
            self.stand["hinweis"] = "wartet (Aufnahme oder Gespräch läuft)"
            self.letzter_fetch = time.time() - self.intervall + 300
            return self.stand
        with tempfile.TemporaryDirectory() as tmp:
            tgz = Path(tmp) / "neu.tar.gz"
            with httpx.stream("GET", f"https://codeload.github.com/{self.repo}/tar.gz/{neu}",
                              timeout=120, follow_redirects=True) as resp:
                resp.raise_for_status()
                with open(tgz, "wb") as f:
                    for chunk in resp.iter_bytes():
                        f.write(chunk)
            with tarfile.open(tgz) as t:
                t.extractall(tmp, filter="data")
            quelle = next(p for p in Path(tmp).iterdir() if p.is_dir())
            if not (quelle / "atlas" / "server.py").exists():
                return self._melden(neu, "Update unvollständig – übersprungen.")
            pakete = (quelle / "pyproject.toml").read_bytes() != (REPO_DIR / "pyproject.toml").read_bytes()
            sicher = REPO_DIR.with_name(REPO_DIR.name + ".vorher")
            shutil.rmtree(sicher, ignore_errors=True)
            REPO_DIR.rename(sicher)
            shutil.move(str(quelle), str(REPO_DIR))
        if pakete:
            uv = shutil.which("uv") or str(Path.home() / ".local/bin/uv")
            subprocess.run([uv, "pip", "install", "-q", "--python", str(LOCAL_DIR / "venv/bin/python"),
                            "-e", str(REPO_DIR)], capture_output=True, timeout=900)
        VERSION.write_text(json.dumps({"sha": neu, "repo": self.repo, "stand": time.strftime("%Y-%m-%d %H:%M")}))
        self.c.audit.log("aktualisierung", von=alt[:7], nach=neu[:7], art="release")
        self.c.broadcast({"type": "update", "commit": neu[:7]})
        time.sleep(1.5)
        os._exit(0)

    def _melden(self, neu: str, text: str) -> dict:
        self.stand["hinweis"] = text
        if self.gemeldet != neu:
            self.gemeldet = neu
            self.c.broadcast({"type": "info", "text": text})
        return self.stand


# ---------------------------------------------------------------- Selbstheilung
STARTS = LOCAL_DIR / "starts.json"


def notfall_pruefen() -> None:
    """Stürzt der Kern direkt nach dem Start immer wieder ab (z. B. durch einen Fehler in einer neuen
    Version), kommt der normale Update-Takt nie zum Zug. Darum: nach 3 Startversuchen binnen
    3 Minuten sofort bei GitHub nach einer korrigierten Version sehen und sie einspielen."""
    import json
    try:
        liste = [t for t in json.loads(STARTS.read_text()) if time.time() - t < 180]
    except (OSError, ValueError):
        liste = []
    liste.append(time.time())
    try:
        STARTS.write_text(json.dumps(liste))
    except OSError:
        pass
    if len(liste) < 3 or not (REPO_DIR / ".git").exists():
        if len(liste) >= 3 and (REPO_DIR.with_name(REPO_DIR.name + ".vorher") / "atlas").exists() \
                and not (REPO_DIR / ".git").exists():
            # weitergegebene Installation: neue Version startet nicht → vorherige zurückholen
            kaputt = REPO_DIR.with_name(REPO_DIR.name + ".defekt")
            shutil.rmtree(kaputt, ignore_errors=True)
            REPO_DIR.rename(kaputt)
            REPO_DIR.with_name(REPO_DIR.name + ".vorher").rename(REPO_DIR)
            print("Neue Version startet nicht – vorherige wiederhergestellt", flush=True)
            os._exit(0)
        return
    if _git("status", "--porcelain", "--untracked-files=no").stdout.strip():
        return                                       # lokale Änderungen nie überschreiben
    if _git("fetch", "-q", "origin", "main", timeout=60).returncode:
        return
    if commit() == _git("rev-parse", "origin/main").stdout.strip():
        return
    alt = commit()
    if _git("merge", "--ff-only", "-q", "origin/main").returncode == 0:
        if "pyproject.toml" in _git("diff", "--name-only", alt, "HEAD").stdout.split():
            uv = shutil.which("uv") or "/opt/homebrew/bin/uv"
            subprocess.run([uv, "pip", "install", "-q", "--python", str(LOCAL_DIR / "venv/bin/python"),
                            "-e", str(REPO_DIR)], capture_output=True, timeout=900)
        print("Notfall-Aktualisierung eingespielt – Neustart", flush=True)
        os._exit(0)


def start_erfolgreich() -> None:
    try:
        STARTS.write_text("[]")
    except OSError:
        pass
