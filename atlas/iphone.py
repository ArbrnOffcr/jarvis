"""JARVIS auf dem iPhone – ohne eigene App.

A · Web-App: Tailscale („privates Netz nur zwischen deinen Geräten“) reicht das Dashboard verschlüsselt
    (HTTPS) ans iPhone weiter: https://<mac>.<tailnet>.ts.net. Einmal den QR-Code scannen, in Safari
    „Zum Home-Bildschirm“ – fertig. Nichts ist aus dem Internet erreichbar.
B · Siri: Kurzbefehl „Frag Jarvis“ (diktieren → /frage → vorlesen), signiert von macOS.

    jarvis iphone   richtet beides ein und zeigt den QR-Code.
"""
import json
import plistlib
import shutil
import subprocess
import tempfile
import uuid
from pathlib import Path

from atlas.paths import LOCAL_DIR, PORT

ZUSTAND = LOCAL_DIR / "iphone.json"
KURZBEFEHL = LOCAL_DIR / "Frag Jarvis.shortcut"
TAILSCALE = ["tailscale", "/Applications/Tailscale.app/Contents/MacOS/Tailscale", "/opt/homebrew/bin/tailscale",
             "/usr/local/bin/tailscale"]


def tailscale() -> str | None:
    for t in TAILSCALE:
        p = shutil.which(t) or (t if Path(t).exists() else None)
        if p:
            return p
    return None


def tailscale_status() -> dict:
    ts = tailscale()
    if not ts:
        return {"installiert": False}
    try:
        r = subprocess.run([ts, "status", "--json"], capture_output=True, text=True, timeout=15)
        j = json.loads(r.stdout or "{}")
    except (OSError, ValueError, subprocess.SubprocessError):
        return {"installiert": True, "laeuft": False}
    selbst = j.get("Self") or {}
    name = (selbst.get("DNSName") or "").rstrip(".")
    return {"installiert": True, "laeuft": j.get("BackendState") == "Running", "dns": name,
            "url": f"https://{name}" if name else ""}


def freigeben() -> tuple[bool, str]:
    """Dashboard per HTTPS im eigenen Tailnet freigeben (nicht im Internet)."""
    ts = tailscale()
    if not ts:
        return False, "Tailscale fehlt"
    versuche = [[ts, "serve", "--bg", "--https=443", f"http://127.0.0.1:{PORT}"],
                [ts, "serve", "--bg", str(PORT)],
                [ts, "serve", "https", "/", f"http://127.0.0.1:{PORT}"]]
    letzte = ""
    for cmd in versuche:
        try:
            r = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
        except (OSError, subprocess.SubprocessError) as e:
            letzte = str(e)
            continue
        if r.returncode == 0:
            return True, (r.stdout or r.stderr).strip()
        letzte = (r.stderr or r.stdout).strip()
    return False, letzte


def zustand() -> dict:
    try:
        return json.loads(ZUSTAND.read_text())
    except (OSError, ValueError):
        return {}


# ------------------------------------------------------------------ Siri-Kurzbefehl
def _text(s: str) -> dict:
    return {"Value": {"string": s}, "WFSerializationType": "WFTextTokenString"}


def _ausgabe(von: str, name: str) -> dict:
    return {"Value": {"string": "￼", "attachmentsByRange": {
        "{0, 1}": {"OutputUUID": von, "Type": "ActionOutput", "OutputName": name}}},
        "WFSerializationType": "WFTextTokenString"}


def _woerterbuch(paare: list[tuple[str, dict]]) -> dict:
    return {"Value": {"WFDictionaryFieldValueItems": [
        {"WFItemType": 0, "WFKey": _text(k), "WFValue": v} for k, v in paare]},
        "WFSerializationType": "WFDictionaryFieldValue"}


def kurzbefehl_bauen(url: str, token: str) -> Path | None:
    """„Frag Jarvis“: Diktat → POST {url}/frage → Antwort vorlesen. Von macOS signiert (iOS verlangt das)."""
    if not shutil.which("shortcuts"):
        return None
    u1, u2, u3 = (str(uuid.uuid4()).upper() for _ in range(3))
    wf = {
        "WFWorkflowClientVersion": "2302.0.4", "WFWorkflowMinimumClientVersion": 900,
        "WFWorkflowMinimumClientVersionString": "900",
        "WFWorkflowIcon": {"WFWorkflowIconStartColor": 463140863, "WFWorkflowIconGlyphNumber": 59511},
        "WFWorkflowImportQuestions": [], "WFWorkflowTypes": [], "WFWorkflowInputContentItemClasses": [],
        "WFWorkflowOutputContentItemClasses": [], "WFWorkflowHasShortcutInputVariables": False,
        "WFWorkflowActions": [
            {"WFWorkflowActionIdentifier": "is.workflow.actions.dictatetext",
             "WFWorkflowActionParameters": {"UUID": u1, "WFSpeechLanguage": "de-DE",
                                            "WFDictateTextStopListening": "After Pause"}},
            {"WFWorkflowActionIdentifier": "is.workflow.actions.downloadurl",
             "WFWorkflowActionParameters": {
                 "UUID": u2, "WFURL": url.rstrip("/") + "/frage", "WFHTTPMethod": "POST", "WFHTTPBodyType": "JSON",
                 "ShowHeaders": True,
                 "WFHTTPHeaders": _woerterbuch([("x-atlas-token", _text(token))]),
                 "WFJSONValues": _woerterbuch([("text", _ausgabe(u1, "Diktierter Text")),
                                               ("quelle", _text("siri"))])}},
            {"WFWorkflowActionIdentifier": "is.workflow.actions.speaktext",
             "WFWorkflowActionParameters": {"UUID": u3, "WFText": _ausgabe(u2, "Inhalte der URL")}},
        ],
    }
    with tempfile.TemporaryDirectory() as tmp:
        roh = Path(tmp) / "roh.shortcut"
        roh.write_bytes(plistlib.dumps(wf, fmt=plistlib.FMT_BINARY))
        ziel = Path(tmp) / "Frag Jarvis.shortcut"
        r = subprocess.run(["shortcuts", "sign", "--mode", "anyone", "--input", str(roh), "--output", str(ziel)],
                           capture_output=True, text=True, timeout=120)
        if r.returncode or not ziel.exists():
            return None
        KURZBEFEHL.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(ziel, KURZBEFEHL)
    return KURZBEFEHL


# ------------------------------------------------------------------ QR-Code
def qr_svg(text: str) -> str:
    try:
        import qrcode
        import qrcode.image.svg
    except ImportError:
        return ""
    img = qrcode.make(text, image_factory=qrcode.image.svg.SvgPathImage, box_size=8, border=2)
    return img.to_string(encoding="unicode")


def qr_terminal(text: str) -> str:
    try:
        import qrcode
    except ImportError:
        return ""
    q = qrcode.QRCode(border=1)
    q.add_data(text)
    q.make()
    import io
    f = io.StringIO()
    q.print_ascii(out=f, invert=True)
    return f.getvalue()


def einrichten_gui(token: str) -> dict:
    """Wie 'jarvis iphone', aber für den Knopf in den Einstellungen."""
    try:
        import qrcode  # noqa: F401
    except ImportError:
        uv = shutil.which("uv") or "/opt/homebrew/bin/uv"
        if not Path(uv).exists():
            uv = str(Path.home() / ".local/bin/uv")
        subprocess.run([uv, "pip", "install", "-q", "--python", str(LOCAL_DIR / "venv/bin/python"), "qrcode>=7.4"],
                       capture_output=True, timeout=300)
    st = tailscale_status()
    if not st.get("installiert"):
        return {"ok": False, "schritt": "installieren",
                "text": "Tailscale fehlt: aus dem App Store laden (Mac und iPhone), öffnen und mit demselben Konto anmelden."}
    if not st.get("laeuft"):
        return {"ok": False, "schritt": "anmelden", "text": "Tailscale ist nicht verbunden – Tailscale-App öffnen und anmelden."}
    ok, text = freigeben()
    if not ok:
        return {"ok": False, "schritt": "https",
                "text": "Freigabe abgelehnt. Auf login.tailscale.com → DNS „MagicDNS“ und „HTTPS Certificates“ "
                        f"einschalten, dann erneut versuchen. ({text[:120]})"}
    ZUSTAND.write_text(json.dumps({"url": st["url"]}))
    kb = kurzbefehl_bauen(st["url"], token)
    return {"ok": True, "url": st["url"], "kurzbefehl": bool(kb),
            "text": "✓ Bereit – QR-Code mit dem iPhone scannen." + ("" if kb else " (Siri-Kurzbefehl ließ sich nicht erstellen.)")}


# ------------------------------------------------------------------ Befehl
def einrichten(token: str) -> None:
    from rich.console import Console
    c = Console()
    c.print("\n[bold]JARVIS auf dem iPhone[/]\n")
    try:
        import qrcode  # noqa: F401
    except ImportError:
        c.print("→ Installiere QR-Code-Baustein …")
        uv = shutil.which("uv") or "/opt/homebrew/bin/uv"
        subprocess.run([uv, "pip", "install", "-q", "--python", str(LOCAL_DIR / "venv/bin/python"), "qrcode>=7.4"],
                       capture_output=True)
    st = tailscale_status()
    if not st.get("installiert"):
        c.print("[yellow]Tailscale fehlt.[/] So geht's (einmalig, kostenlos):\n"
                "  1. Auf dem Mac: App Store → „Tailscale“ laden, öffnen, anmelden (z. B. mit deiner Apple-ID).\n"
                "  2. Auf dem iPhone: App Store → „Tailscale“, mit demselben Konto anmelden, VPN erlauben.\n"
                "  3. Im Browser auf login.tailscale.com → DNS: „MagicDNS“ und „HTTPS Certificates“ aktivieren.\n"
                "  4. Danach erneut: [bold]jarvis iphone[/]")
        return
    if not st.get("laeuft"):
        c.print("[yellow]Tailscale ist nicht verbunden[/] – Tailscale-App öffnen und anmelden, dann erneut versuchen.")
        return
    ok, text = freigeben()
    if not ok:
        c.print(f"[red]Freigabe fehlgeschlagen:[/] {text}\n"
                "Tipp: auf login.tailscale.com unter DNS „HTTPS Certificates“ aktivieren.")
        return
    url = st["url"]
    ZUSTAND.write_text(json.dumps({"url": url}))
    c.print(f"[green]✓ Dashboard im privaten Netz:[/] {url}")
    start = f"{url}/start?token={token}"
    kb = kurzbefehl_bauen(url, token)
    c.print("[green]✓ Siri-Kurzbefehl „Frag Jarvis“ erstellt[/]" if kb else
            "[yellow]Siri-Kurzbefehl konnte nicht signiert werden[/] – Anleitung in den JARVIS-Einstellungen.")
    q = qr_terminal(start)
    if q:
        c.print("\nMit der iPhone-Kamera scannen:\n")
        print(q)
    c.print("Dann in Safari: Teilen → „Zum Home-Bildschirm“. Der QR-Code steht auch unter ⚙ Einstellungen → iPhone.\n"
            "[dim]Der Code enthält deinen Zugangsschlüssel – nicht weitergeben.[/]")
