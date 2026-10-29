"""JARVIS auf dem iPhone – ohne eigene App.

A · Web-App: Tailscale („privates Netz nur zwischen deinen Geräten“) reicht das Dashboard verschlüsselt
    (HTTPS) ans iPhone weiter: https://<mac>.<tailnet>.ts.net. Einmal den QR-Code scannen, in Safari
    „Zum Home-Bildschirm“ – fertig. Nichts ist aus dem Internet erreichbar.
B · Siri: Kurzbefehl „Frag Jarvis“ (diktieren → /frage → vorlesen), signiert von macOS.

    jarvis iphone   richtet beides ein und zeigt den QR-Code.
"""
import json
import os
import plistlib
import shutil
import subprocess
import tempfile
import uuid
from pathlib import Path

from atlas.paths import LOCAL_DIR, PORT

ZUSTAND = LOCAL_DIR / "iphone.json"
KURZBEFEHL = LOCAL_DIR / "Frag Jarvis.shortcut"
# Eigenständige Befehlszeile zuerst, die Mac-App als letzte Wahl
TAILSCALE = ["/usr/local/bin/tailscale", "/opt/homebrew/bin/tailscale", "tailscale",
             "/Applications/Tailscale.app/Contents/MacOS/Tailscale"]
# Die Mac-App von Tailscale arbeitet nur dann als Befehlszeile, wenn sie nicht glaubt, als App gestartet worden zu sein.
# Im Hintergrunddienst (launchd) fehlt TERM und es hängen App-Variablen an – dann meldet sie
# „The Tailscale GUI failed to start … CLIError error 3“ (und beendet sich trotzdem mit 0).
GUI_FEHLER = "GUI failed to start"
APP_VARIABLEN = ("__CFBundleIdentifier", "XPC_SERVICE_NAME", "XPC_FLAGS")
GUI_HINWEIS = ("Tailscale antwortet nicht als Befehlszeile. Bitte: 1) Tailscale-App öffnen und angemeldet sein "
               "(Symbol in der Menüleiste, „Connected“). 2) In der Tailscale-App unter Settings „Install CLI“ "
               "(bzw. „CLI integration“) wählen. 3) JARVIS neu starten (jarvis dienst neustart).")


def _umgebung() -> dict:
    env = {k: v for k, v in os.environ.items() if k not in APP_VARIABLEN}
    if not env.get("TERM"):
        env["TERM"] = "dumb"
    pfad = env.get("PATH", "")
    for d in ("/usr/local/bin", "/opt/homebrew/bin"):
        if d not in pfad.split(":"):
            pfad = f"{pfad}:{d}" if pfad else d
    env["PATH"] = pfad
    return env


def tailscale() -> str | None:
    for t in TAILSCALE:
        p = shutil.which(t) or (t if Path(t).exists() else None)
        if p:
            return p
    return None


def _ts(*args, timeout: int = 15) -> tuple[int, str]:
    """Tailscale-Befehl ausführen; liefert (Rückgabecode, Ausgabe). Bricht nie mit einer Ausnahme ab."""
    ts = tailscale()
    if not ts:
        return 127, "Tailscale fehlt"
    try:
        r = subprocess.run([ts, *args], capture_output=True, text=True, timeout=timeout, env=_umgebung())
        aus = ((r.stdout or "") + (r.stderr or "")).strip()
        if GUI_FEHLER in aus:                     # trotz Rückgabe 0 kein Ergebnis
            return 125, f"{aus}\n{GUI_HINWEIS}"
        return r.returncode, aus
    except subprocess.TimeoutExpired as e:      # z. B. „Serve is not enabled … visit https://…“ – wartet auf Freigabe
        aus = e.stdout or b""
        aus = aus.decode(errors="ignore") if isinstance(aus, bytes) else aus
        fehler = e.stderr or b""
        fehler = fehler.decode(errors="ignore") if isinstance(fehler, bytes) else fehler
        return 124, (aus + fehler).strip()
    except OSError as e:
        return 126, str(e)


def tailscale_status() -> dict:
    ts = tailscale()
    if not ts:
        return {"installiert": False}
    code, aus = _ts("status", "--json")
    try:
        j = json.loads(aus[aus.find("{"):] if "{" in aus else "{}")
    except ValueError:
        j = {}
    if not j:
        return {"installiert": True, "laeuft": False, "pfad": ts, "fehler": aus[:600],
                **({"hinweis": GUI_HINWEIS} if code == 125 else {})}
    selbst = j.get("Self") or {}
    name = (selbst.get("DNSName") or "").rstrip(".")
    return {"installiert": True, "pfad": ts, "laeuft": j.get("BackendState") == "Running",
            "zustand": j.get("BackendState"), "dns": name, "url": f"https://{name}" if name else "",
            "magicdns": bool((j.get("CurrentTailnet") or {}).get("MagicDNSEnabled", bool(name))),
            "zertifikate": bool(j.get("CertDomains")), "version": j.get("Version", "")}


def _freigabe_link(text: str) -> str:
    import re
    m = re.search(r"https://login\.tailscale\.com/\S+", text or "")
    return m.group(0).rstrip(".,)") if m else ""


def freigeben() -> tuple[bool, str, str]:
    """Dashboard per HTTPS im eigenen Tailnet freigeben (nicht im Internet). Rückgabe: (ok, Text, Freigabe-Link)."""
    if not tailscale():
        return False, "Tailscale fehlt", ""
    code, aus = _ts("serve", "status", "--json")
    if code == 0 and f"127.0.0.1:{PORT}" in aus:          # schon freigegeben
        return True, "bereits freigegeben", ""
    letzte, link = "", ""
    for args in (("serve", "--bg", "--https=443", f"http://127.0.0.1:{PORT}"),
                 ("serve", "--bg", str(PORT)),
                 ("serve", "https", "/", f"http://127.0.0.1:{PORT}")):
        code, aus = _ts(*args, timeout=25)
        if code == 0:
            return True, aus, ""
        link = link or _freigabe_link(aus)
        letzte = aus
        if link:                                            # Tailnet verlangt eine Freigabe im Browser
            break
    return False, letzte, link


def diagnose() -> dict:
    st = tailscale_status()
    d = {"tailscale": st}
    if st.get("installiert"):
        d["serve"] = _ts("serve", "status")[1][:400]
    return d


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


def _qrcode_sicherstellen() -> None:
    try:
        import qrcode  # noqa: F401
        return
    except ImportError:
        pass
    for uv in (shutil.which("uv"), "/opt/homebrew/bin/uv", str(Path.home() / ".local/bin/uv")):
        if uv and Path(uv).exists():
            try:
                subprocess.run([uv, "pip", "install", "-q", "--python", str(LOCAL_DIR / "venv/bin/python"), "qrcode>=7.4"],
                               capture_output=True, timeout=300)
            except (OSError, subprocess.SubprocessError):
                pass
            return
    try:                                         # ohne uv: pip der eigenen Umgebung
        subprocess.run([str(LOCAL_DIR / "venv/bin/python"), "-m", "pip", "install", "-q", "qrcode>=7.4"],
                       capture_output=True, timeout=300)
    except (OSError, subprocess.SubprocessError):
        pass


def einrichten_gui(token: str) -> dict:
    """Wie 'jarvis iphone', aber für den Knopf in den Einstellungen. Wirft nie – jeder Fehler wird erklärt."""
    _qrcode_sicherstellen()
    st = tailscale_status()
    if not st.get("installiert"):
        return {"ok": False, "schritt": "installieren",
                "text": "Tailscale fehlt auf diesem Mac: aus dem App Store laden, öffnen und anmelden."}
    if not st.get("laeuft"):
        zust = st.get("zustand") or ""
        grund = {"NeedsLogin": "nicht angemeldet", "Stopped": "ausgeschaltet", "Starting": "startet noch",
                 "NeedsMachineAuth": "Gerät wartet auf Freigabe in der Admin-Konsole"}.get(zust, zust or "keine Antwort")
        return {"ok": False, "schritt": "anmelden", "diagnose": st,
                "text": f"Tailscale auf dem Mac ist nicht verbunden ({grund}). In der Menüleiste auf das Tailscale-Symbol → "
                        "„Connect“/„Anmelden“. " + (f"Meldung: {st['fehler'][:140]}" if st.get("fehler") else "")}
    if not st.get("dns"):
        return {"ok": False, "schritt": "magicdns", "link": "https://login.tailscale.com/admin/dns",
                "text": "MagicDNS ist im Tailnet ausgeschaltet. Auf login.tailscale.com → DNS „MagicDNS“ einschalten, dann erneut."}
    ok, text, link = freigeben()
    if not ok:
        if link:
            try:
                subprocess.run(["open", link], capture_output=True, timeout=10)
            except (OSError, subprocess.SubprocessError):
                pass
            return {"ok": False, "schritt": "serve", "link": link,
                    "text": "Tailscale möchte einmalig die HTTPS-Freigabe („Serve“) für deinen Mac bestätigt haben. Ich habe die Seite "
                            "im Browser geöffnet – dort bestätigen und dann hier erneut „iPhone verbinden“ drücken."}
        if not st.get("zertifikate"):
            return {"ok": False, "schritt": "https", "link": "https://login.tailscale.com/admin/dns",
                    "text": "HTTPS-Zertifikate sind im Tailnet ausgeschaltet: login.tailscale.com → DNS → „HTTPS Certificates“ "
                            "einschalten, dann erneut."}
        return {"ok": False, "schritt": "serve", "diagnose": st,
                "text": f"Tailscale hat die Freigabe abgelehnt: {text[:200] or 'keine Meldung'}"}
    ZUSTAND.write_text(json.dumps({"url": st["url"]}))
    try:
        kb = kurzbefehl_bauen(st["url"], token)
    except (OSError, subprocess.SubprocessError):
        kb = None
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
    ok, text, link = freigeben()
    if not ok:
        c.print(f"[red]Freigabe fehlgeschlagen:[/] {text}\n" + (f"Bitte im Browser bestätigen: {link}\n" if link else
                "Tipp: auf login.tailscale.com unter DNS „MagicDNS“ und „HTTPS Certificates“ aktivieren.\n")
                + "Danach erneut: jarvis iphone")
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
