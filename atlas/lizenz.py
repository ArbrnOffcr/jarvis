"""Fernabschaltung für weitergegebene Installationen – ohne Datenübertragung.

Jede Installation aus der DMG hat eine zufällige Kennung (z. B. JV-7K3Q-P9XM), sichtbar unter
⚙ Einstellungen → System. Alle paar Stunden liest JARVIS die öffentliche Datei `sperrliste.json` im
Release-Repository. Steht die eigene Kennung darauf (oder ist „alle“ gesetzt bzw. die Version zu alt),
schaltet sich JARVIS ab: keine Antworten, keine Hintergrunddienste – nur die Prüfung läuft weiter, damit
eine Freigabe wieder wirkt. Gesendet wird dabei nichts; es ist ein reiner Abruf.

Eigene Installationen (mit git) sind davon nie betroffen.

    jarvis sperren <Kennung|alle> [Grund]     jarvis entsperren <Kennung|alle>     jarvis sperrliste
"""
import json
import secrets
import time

from atlas.paths import LOCAL_DIR, REPO_DIR

KENNUNG = LOCAL_DIR / "installation.json"
SPERRE = LOCAL_DIR / "DEAKTIVIERT"
ZEICHEN = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"


def kennung() -> str:
    try:
        return json.loads(KENNUNG.read_text())["kennung"]
    except (OSError, ValueError, KeyError):
        pass
    k = "JV-" + "".join(secrets.choice(ZEICHEN) for _ in range(4)) + "-" + "".join(secrets.choice(ZEICHEN) for _ in range(4))
    try:
        LOCAL_DIR.mkdir(parents=True, exist_ok=True)
        KENNUNG.write_text(json.dumps({"kennung": k, "seit": time.strftime("%Y-%m-%d")}))
    except OSError:
        pass
    return k


def betroffen(cfg: dict) -> bool:
    """Nur weitergegebene Installationen (ohne git, mit Release-Repository)."""
    return not (REPO_DIR / ".git").exists() and bool((cfg.get("release") or {}).get("repo"))


def gesperrt() -> str:
    try:
        return json.loads(SPERRE.read_text()).get("grund") or "JARVIS wurde vom Herausgeber deaktiviert."
    except (OSError, ValueError):
        return ""


def _version(v: str) -> tuple:
    return tuple(int(x) for x in str(v).split("-")[0].split(".") if x.isdigit())


def pruefen(cfg: dict) -> str | None:
    """Sperrliste abrufen. Rückgabe: Grund (gesperrt), "" (frei) oder None (nicht erreichbar)."""
    if not betroffen(cfg):
        return ""
    import httpx
    from atlas import __version__
    repo = cfg["release"]["repo"]
    try:
        r = httpx.get(f"https://raw.githubusercontent.com/{repo}/main/sperrliste.json",
                      params={"t": int(time.time() // 600)}, timeout=15)
        if r.status_code == 404:
            liste = {}
        else:
            r.raise_for_status()
            liste = r.json()
    except Exception:
        return None                                    # offline: letzter Zustand bleibt
    k = kennung()
    grund = ""
    eintraege = {str(e.get("kennung") if isinstance(e, dict) else e).upper():
                 (e.get("grund", "") if isinstance(e, dict) else "") for e in liste.get("gesperrt", [])}
    if liste.get("alle"):
        grund = liste.get("nachricht") or "JARVIS wurde vom Herausgeber vorübergehend deaktiviert."
    elif k.upper() in eintraege:
        grund = eintraege[k.upper()] or liste.get("nachricht") or "Diese Installation wurde vom Herausgeber deaktiviert."
    elif liste.get("mindestversion") and _version(__version__) < _version(liste["mindestversion"]):
        grund = f"Diese JARVIS-Version ist zu alt (mindestens {liste['mindestversion']}). Bitte neu installieren."
    try:
        if grund:
            SPERRE.write_text(json.dumps({"grund": grund, "seit": time.strftime("%Y-%m-%d %H:%M")}))
        else:
            SPERRE.unlink(missing_ok=True)
    except OSError:
        pass
    return grund


def waechter(core, alle_sek: int = 3 * 3600) -> None:
    """Hintergrund: regelmäßig prüfen; ändert sich der Zustand, Kern neu starten (launchd startet ihn wieder)."""
    import os
    import threading

    def lauf():
        vorher = gesperrt()
        while True:
            jetzt = pruefen(core.cfg)
            if jetzt is not None and bool(jetzt) != bool(vorher):
                core.audit.log("lizenz", gesperrt=bool(jetzt))
                try:
                    core.broadcast({"type": "gesperrt" if jetzt else "info",
                                    "text": jetzt or "JARVIS ist wieder freigegeben – startet neu."})
                except Exception:
                    pass
                time.sleep(2)
                os._exit(0)
            time.sleep(alle_sek if not vorher else 1800)
    if betroffen(core.cfg):
        threading.Thread(target=lauf, name="lizenz", daemon=True).start()


# ------------------------------------------------------------------ Verwaltung (nur beim Herausgeber)
def _klon():
    return LOCAL_DIR / "freundesversion"


def _liste_laden() -> dict:
    f = _klon() / "sperrliste.json"
    try:
        return json.loads(f.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return {"hinweis": "Von 'jarvis sperren' gepflegt. Installationen prüfen diese Datei alle paar Stunden.",
                "alle": False, "mindestversion": "", "nachricht": "", "gesperrt": []}


def verwalten(args: list[str]) -> None:
    import subprocess
    from rich.console import Console
    c = Console()
    klon = _klon()
    if not (klon / ".git").exists():
        c.print("[red]Noch keine Freundesversion veröffentlicht[/] – zuerst 'jarvis veroeffentlichen'.")
        return
    g = ["git", "-C", str(klon)]
    subprocess.run([*g, "pull", "-q", "--ff-only"], capture_output=True)
    liste = _liste_laden()
    befehl = args[0] if args else "sperrliste"
    if befehl == "sperrliste":
        c.print(f"Alle gesperrt: {'JA' if liste.get('alle') else 'nein'} · Mindestversion: {liste.get('mindestversion') or '–'}")
        for e in liste.get("gesperrt", []):
            c.print(f"  ✕ {e.get('kennung')}  {e.get('grund', '')}  (seit {e.get('seit', '?')})")
        if not liste.get("gesperrt"):
            c.print("  Keine einzelnen Installationen gesperrt.")
        return
    ziel = (args[1] if len(args) > 1 else "").strip().upper()
    grund = " ".join(args[2:]).strip()
    if not ziel:
        c.print("Aufruf: jarvis sperren <Kennung|alle> [Grund]  ·  jarvis entsperren <Kennung|alle>  ·  "
                "jarvis mindestversion <x.y.z|aus>")
        return
    if befehl == "sperren":
        if ziel == "ALLE":
            liste["alle"], liste["nachricht"] = True, grund
        else:
            liste["gesperrt"] = [e for e in liste.get("gesperrt", []) if e.get("kennung") != ziel]
            liste["gesperrt"].append({"kennung": ziel, "grund": grund, "seit": time.strftime("%Y-%m-%d")})
    elif befehl == "entsperren":
        if ziel == "ALLE":
            liste["alle"], liste["nachricht"] = False, ""
        else:
            liste["gesperrt"] = [e for e in liste.get("gesperrt", []) if e.get("kennung") != ziel]
    elif befehl == "mindestversion":
        liste["mindestversion"] = "" if ziel == "AUS" else ziel.lower()
    (klon / "sperrliste.json").write_text(json.dumps(liste, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    subprocess.run([*g, "add", "sperrliste.json"], capture_output=True)
    subprocess.run([*g, "commit", "-q", "-m", f"Sperrliste: {befehl} {ziel}"], capture_output=True)
    r = subprocess.run([*g, "push", "-q"], capture_output=True, text=True)
    if r.returncode:
        c.print(f"[red]Hochladen fehlgeschlagen:[/] {r.stderr[-300:]}")
        return
    c.print(f"[green]✓ Gespeichert:[/] {befehl} {ziel}. Die betroffenen Installationen übernehmen das innerhalb "
            "von höchstens 3 Stunden (beim nächsten Start sofort).")
