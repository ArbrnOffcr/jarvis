"""Steuerung der Apple-Apps (Erinnerungen, Notizen, Kontakte) über JavaScript
for Automation. macOS fragt beim ersten Zugriff einmalig nach der Erlaubnis."""
import json
import subprocess

from atlas.tools import ToolError


def run(app: str, script: str, *args, timeout: int = 90):
    try:
        r = subprocess.run(["osascript", "-l", "JavaScript", "-e", script,
                            *[str(a) if a is not None else "" for a in args]],
                           capture_output=True, text=True, timeout=timeout)
    except FileNotFoundError:
        raise ToolError("osascript fehlt – nur auf dem Mac verfügbar")
    except subprocess.TimeoutExpired:
        raise ToolError(f"{app} antwortet nicht (Zeitüberschreitung)")
    if r.returncode != 0:
        err = r.stderr.strip()
        if "-1743" in err or "berechtigt" in err.lower() or "not authorized" in err.lower():
            raise ToolError(
                f"Keine Erlaubnis, {app} zu steuern. Bitte 'jarvis berechtigungen' "
                f"ausführen oder in Systemeinstellungen → Datenschutz & Sicherheit → "
                f"Automation für JARVIS/python freigeben.")
        raise ToolError(f"{app}: {err[-300:]}")
    out = r.stdout.strip()
    return json.loads(out) if out else None
