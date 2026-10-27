"""JARVIS – Terminal.

  jarvis             Gespräch starten
  jarvis setup        API-Schlüssel hinterlegen (einmal je Mac und Benutzer)
  jarvis setup icloud nur den iCloud-Zugang (Kalender, Mail) neu einrichten
  jarvis status       Zustand anzeigen
  jarvis berechtigungen   Zugriff auf Kalender, Erinnerungen, Notizen, Kontakte, Mail prüfen
  jarvis index [pause|weiter|neu]   Stand des Archiv-Index
  jarvis dashboard [fenster|autostart an|autostart aus]   HUD-Oberfläche öffnen (Safari)
  jarvis token        Zugangsschlüssel in die Zwischenablage (für die Safari-Web-App)
  jarvis stimme [de|en <Voice-ID> | test]   ElevenLabs-Stimmen festlegen / testen
  jarvis setup sprache    ElevenLabs-Schlüssel hinterlegen
  jarvis setup telegram   Telegram-Bot verbinden
  jarvis briefing [jetzt]   Morgenbriefing anzeigen / sofort neu erstellen
  jarvis weckwort [hey_jarvis | hey_atlas.onnx | empfindlichkeit 0.5]   Weckwort wählen
  jarvis dienst start|stop|neustart|log
  jarvis update       neueste Version von GitHub holen (alle Macs)
  jarvis speichern "Text"   Änderungen sichern und zu GitHub hochladen
  jarvis iphone       JARVIS aufs iPhone: Web-App über Tailscale + Siri-Kurzbefehl „Frag Jarvis“
  jarvis sperren <Kennung|alle> [Grund]   weitergegebene Installation abschalten (entsperren, sperrliste)
  jarvis paket        Installations-DMG für Freunde bauen (Schreibtisch)
  jarvis veroeffentlichen   DMG bauen und Freundesversion auf GitHub veröffentlichen (Updates)
  jarvis einrichten --stdin   Ersteinrichtung aus dem grafischen Installer
"""
import getpass
import json
import os
import subprocess
import sys

import httpx
from prompt_toolkit import PromptSession
from prompt_toolkit.history import FileHistory
from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from websockets.sync.client import connect

from atlas import __version__
from atlas.keystore import core_token, set_secret
from atlas.paths import HOST, LOCAL_DIR, PORT, REPO_DIR, UID

console = Console()
BASE = f"http://127.0.0.1:{PORT}"
LABEL = "de.atlas.core"
PLIST = os.path.expanduser(f"~/Library/LaunchAgents/{LABEL}.plist")
VENV_PY = LOCAL_DIR / "venv/bin/python"

HELP = """[bold cyan]Befehle im Gespräch[/]
  /auto            Router entscheidet (Standard)
  /lokal           nur lokales Modell
  /claude /sonnet /opus /haiku   Claude erzwingen
  /status          Zustand anzeigen
  /neu             Gesprächsverlauf leeren (Kurzprotokoll wird abgelegt)
  /notaus  /weiter Not-Aus an/aus (nur noch Lesen)
  /hilfe           diese Hilfe
  /ende            beenden"""


# ---------------------------------------------------------------- Dienst
def _launchctl(*args) -> int:
    return subprocess.run(["launchctl", *args], capture_output=True).returncode


def dienst(cmd: str) -> None:
    target = f"gui/{UID}"
    if cmd == "start":
        _launchctl("bootstrap", target, PLIST)
        _launchctl("kickstart", f"{target}/{LABEL}")
        console.print("[green]JARVIS-Core gestartet.[/]")
    elif cmd == "stop":
        _launchctl("bootout", f"{target}/{LABEL}")
        console.print("[yellow]JARVIS-Core gestoppt.[/]")
    elif cmd == "neustart":
        if _launchctl("kickstart", "-k", f"{target}/{LABEL}") != 0:
            dienst("start")
        else:
            console.print("[green]JARVIS-Core neu gestartet.[/]")
    elif cmd == "log":
        subprocess.run(["tail", "-n", "40", str(LOCAL_DIR / "logs/core.log")])
    else:
        console.print("start | stop | neustart | log")


def _core_up() -> bool:
    try:
        httpx.get(f"{BASE}/status", headers={"x-atlas-token": core_token()}, timeout=2)
        return True
    except httpx.HTTPError:
        return False


# ---------------------------------------------------------------- Befehle
def setup(teil: str = "") -> None:
    console.print(Panel.fit("[bold cyan]JARVIS Einrichtung[/]\n"
                            "Eingaben bleiben unsichtbar. Enter = überspringen.",
                            border_style="cyan"))
    if teil != "icloud":
        key = getpass.getpass("Anthropic API-Key (beginnt mit sk-ant-): ").strip()
        if key:
            try:
                import anthropic
                anthropic.Anthropic(api_key=key).models.list(limit=1)
                set_secret("anthropic", key)
                console.print("  [green]✓ Anthropic-Schlüssel gültig und gespeichert[/]")
            except Exception as e:
                console.print(f"  [red]✗ Schlüssel abgelehnt – nicht gespeichert[/] ({str(e)[:90]})")
        value = getpass.getpass("ElevenLabs API-Key (Enter = später): ").strip()
        if value:
            ok, info = _check_elevenlabs(value)
            if ok:
                set_secret("elevenlabs", value)
                console.print(f"  [green]✓ ElevenLabs-Schlüssel gültig und gespeichert[/] {info}")
            else:
                console.print(f"  [red]✗ ElevenLabs-Schlüssel abgelehnt – nicht gespeichert[/] ({info})")
    setup_icloud()
    core_token()
    console.print("\nDienst wird neu gestartet ...")
    dienst("neustart")


def setup_icloud() -> None:
    console.print("\n[bold]iCloud-Zugang[/] für Kalender und Mail\n"
                  "[dim]1. Apple-ID = die E-Mail, mit der du dich bei Apple anmeldest "
                  "(Systemeinstellungen → dein Name).\n"
                  "2. App-spezifisches Passwort: account.apple.com → Anmeldung und Sicherheit → "
                  "App-spezifische Passwörter → „+“ (Format xxxx-xxxx-xxxx-xxxx).\n"
                  "   NICHT dein normales Apple-Passwort.[/]")
    apple_id = input("Apple-ID (Enter = überspringen): ").strip()
    if not apple_id:
        return
    mail = input(f"iCloud-Mailadresse (Enter = {apple_id}): ").strip() or apple_id
    pw = getpass.getpass("App-spezifisches Passwort: ").strip().replace(" ", "")
    if not pw:
        return

    console.print("\nPrüfe Zugang ...")
    import imaplib
    import caldav
    cal_ok = mail_ok = False
    try:
        caldav.DAVClient(url="https://caldav.icloud.com", username=apple_id,
                         password=pw, timeout=30).principal()
        cal_ok = True
    except Exception as e:
        console.print(f"  [red]✗ Kalender[/] – {str(e)[:120]}")
    for name in dict.fromkeys([mail, mail.split("@")[0], apple_id]):
        try:
            m = imaplib.IMAP4_SSL("imap.mail.me.com", 993, timeout=30)
            m.login(name, pw)
            m.logout()
            mail_ok = True
            break
        except Exception:
            continue
    if cal_ok:
        console.print("  [green]✓ Kalender[/]")
    if mail_ok:
        console.print("  [green]✓ Mail[/]")
    else:
        console.print("  [red]✗ Mail[/] – Anmeldung abgelehnt")

    if cal_ok or mail_ok:
        set_secret("icloud_apple_id", apple_id)
        set_secret("icloud_email", mail)
        set_secret("icloud_app_pw", pw)
        console.print("  [green]✓[/] iCloud-Zugang gespeichert")
    else:
        console.print("\n[yellow]Nichts gespeichert.[/] Häufigste Ursachen:\n"
                      "  • normales Apple-Passwort statt App-spezifischem Passwort\n"
                      "  • Apple-ID weicht von der iCloud-Mailadresse ab\n"
                      "  • Tippfehler – neues App-Passwort erzeugen und einfügen (Cmd+V)\n"
                      "Erneut versuchen: [bold]jarvis setup icloud[/]")


def baue_app(tmp, quelle=None, name: str = "JARVIS", bundle_id: str = "de.atlas.jarvis",
             frameworks=("Cocoa", "WebKit", "AVFoundation", "CoreLocation"), mikrofon: bool = True):
    """Übersetzt eine Swift-App nach tmp/<name>.app (mit Symbol, ad-hoc signiert). Rückgabe: Pfad oder None."""
    import plistlib
    from pathlib import Path
    from atlas import __version__
    quelle = Path(quelle or REPO_DIR / "app" / "main.swift")
    app = Path(tmp) / f"{name}.app"
    (app / "Contents/MacOS").mkdir(parents=True)
    (app / "Contents/Resources").mkdir(parents=True)
    exe = name.replace(" ", "")
    fw = sum((["-framework", f] for f in frameworks), [])
    r = subprocess.run(["swiftc", "-O", "-target", "arm64-apple-macos12.0", str(quelle),
                        "-o", str(app / "Contents/MacOS" / exe), *fw], capture_output=True, text=True)
    if r.returncode:
        console.print(f"[red]Übersetzen fehlgeschlagen ({quelle.name}):[/]\n{r.stderr[-2000:]}")
        return None
    info = {"CFBundleName": name, "CFBundleDisplayName": name, "CFBundleIdentifier": bundle_id,
            "CFBundleExecutable": exe, "CFBundlePackageType": "APPL", "CFBundleIconFile": "AppIcon",
            "CFBundleShortVersionString": __version__, "CFBundleVersion": __version__,
            "LSMinimumSystemVersion": "12.0", "NSHighResolutionCapable": True,
            "LSApplicationCategoryType": "public.app-category.productivity",
            "NSAppTransportSecurity": {"NSAllowsLocalNetworking": True}}
    if mikrofon:
        info["NSMicrophoneUsageDescription"] = "JARVIS hört auf „Hey Jarvis“ und auf deine Sprachbefehle."
        info["NSLocationUsageDescription"] = "JARVIS nutzt deinen ungefähren Standort für das Wetter vor Ort und an heutigen Reisezielen."
        info["NSLocationWhenInUseUsageDescription"] = info["NSLocationUsageDescription"]
    with open(app / "Contents/Info.plist", "wb") as f:
        plistlib.dump(info, f)
    icon = REPO_DIR / "app" / "icon.png"
    if icon.exists():                                  # Symbol in allen Größen
        iconset = Path(tmp) / f"{exe}.iconset"
        iconset.mkdir()
        for g in (16, 32, 128, 256, 512):
            for faktor, n in ((1, f"icon_{g}x{g}.png"), (2, f"icon_{g}x{g}@2x.png")):
                subprocess.run(["sips", "-z", str(g * faktor), str(g * faktor), str(icon), "--out",
                                str(iconset / n)], capture_output=True)
        subprocess.run(["iconutil", "-c", "icns", str(iconset), "-o",
                        str(app / "Contents/Resources/AppIcon.icns")], capture_output=True)
    return app


def signieren(app) -> None:
    subprocess.run(["codesign", "--force", "--deep", "-s", "-", str(app)], capture_output=True)


def app_bauen() -> None:
    """Eigene Mac-App für das Dashboard bauen (~/Applications/JARVIS.app).
    Vorteil gegenüber der Safari-Web-App: Mikrofon dauerhaft erlaubt, Stimme ohne Klick."""
    import shutil
    import tempfile
    from pathlib import Path
    ziel = Path.home() / "Applications" / "JARVIS.app"
    if not shutil.which("swiftc"):
        console.print("[red]swiftc fehlt.[/] Bitte 'xcode-select --install' ausführen und erneut versuchen.")
        return
    with tempfile.TemporaryDirectory() as tmp:
        console.print("→ Übersetze die App (dauert etwa eine halbe Minute) …")
        app = baue_app(tmp)
        if not app:
            return
        signieren(app)
        ziel.parent.mkdir(exist_ok=True)
        if ziel.exists():
            plist = ziel / "Contents/Info.plist"
            eigene = plist.exists() and b"de.atlas.jarvis" in plist.read_bytes()
            if eigene:
                shutil.rmtree(ziel)                        # ältere Fassung dieser App
            else:                                          # Safari-Web-App aufbewahren, nicht löschen
                alt, n = ziel.with_name("JARVIS (Safari).app"), 2
                while alt.exists():
                    alt, n = ziel.with_name(f"JARVIS (Safari {n}).app"), n + 1
                ziel.rename(alt)
                console.print(f"  Die bisherige Safari-Web-App heißt jetzt „{alt.name}“.")
        shutil.move(str(app), str(ziel))
    console.print(f"[green]✓ JARVIS-App installiert:[/] {ziel}")
    console.print("  Beim ersten Start fragt macOS einmal nach dem Mikrofon – danach nie wieder.\n"
                  "  Tipp: alte Dock-Verknüpfung entfernen und die neue App aus „Programme“ ins Dock ziehen.")
    subprocess.run(["open", str(ziel)])


def mail_test() -> None:
    """Schritt für Schritt prüfen, ob iCloud-Mail erreichbar ist – mit genauer Fehlermeldung."""
    import imaplib
    from atlas.keystore import get_secret
    from atlas.tools.mail import IMAP_HOST, Mail
    s = {k: get_secret(k) for k in ("icloud_email", "icloud_apple_id", "icloud_app_pw")}
    console.print(f"Adresse: {s['icloud_email'] or '–'} · Apple-ID: {s['icloud_apple_id'] or '–'} · "
                  f"App-Passwort: {'vorhanden' if s['icloud_app_pw'] else '[red]fehlt[/]'}")
    for name in Mail(s).logins:
        try:
            m = imaplib.IMAP4_SSL(IMAP_HOST, 993, timeout=30)
        except Exception as e:
            console.print(f"[red]✗ Keine Verbindung zu {IMAP_HOST}:[/] {e}")
            return
        try:
            m.login(name, s["icloud_app_pw"] or "")
            console.print(f"[green]✓ Anmeldung als {name}[/]")
            typ, d = m.select("INBOX", readonly=True)
            console.print(f"  Posteingang öffnen: {typ} · {(d[0] or b'0').decode()} Mails im Posteingang")
            typ, d = m.uid("SEARCH", None, "ALL")
            console.print(f"  Alle suchen: {typ} · {len((d[0] or b'').split()) if d else 0} Treffer")
            typ, d = m.uid("SEARCH", None, "UNSEEN")
            console.print(f"  Ungelesene suchen: {typ} · {len((d[0] or b'').split()) if d else 0} Treffer")
            m.logout()
            return
        except imaplib.IMAP4.error as e:
            console.print(f"[yellow]✗ Anmeldung/Abfrage als {name} abgelehnt:[/] {e}")
        except Exception as e:
            console.print(f"[red]✗ Fehler als {name}:[/] {type(e).__name__}: {e}")
        try:
            m.logout()
        except Exception:
            pass
    console.print("[red]Keine Anmeldung möglich.[/] Neues App-Passwort unter account.apple.com erstellen, "
                  "dann 'jarvis setup icloud'.")


def status() -> None:
    try:
        r = httpx.get(f"{BASE}/status", headers={"x-atlas-token": core_token()}, timeout=5)
        info = r.json()
    except httpx.HTTPError:
        console.print("[red]JARVIS-Core läuft nicht.[/] → jarvis dienst start")
        return
    t = Table(title="◢ JARVIS STATUS ◣", border_style="cyan", show_header=False)
    for k in ["version", "name", "host", "lokal", "claude", "icloud", "icloud_nachladen", "werkzeuge",
              "archiv", "gemeinsam"]:
        t.add_row(k, str(info.get(k)))
    ix = info.get("index", {})
    t.add_row("index", f"{ix.get('phase')} · {ix.get('lokal', {}).get('dokumente', 0)} Dokumente"
                       f" · {ix.get('offen', 0)} offen")
    t.add_row("not-aus", "[red]AKTIV[/]" if info["notaus"] else "aus")
    if info.get("config_fehler"):
        t.add_row("[red]config.yaml[/]", f"[red]Fehler – letzte gültige Fassung aktiv:[/] {info['config_fehler'][:120]}")
    for prov, v in info.get("verbrauch_monat", {}).items():
        t.add_row(f"verbrauch {prov}",
                  f"{v['anfragen']} Anfragen · {v['in']}↑ {v['out']}↓ Tokens")
    console.print(t)


def messen() -> None:
    """Geschwindigkeit mit und ohne Stab messen (dieselben Fragen, nur lesend)."""
    console.print("Messe JARVIS mit und ohne Stab (3 Fragen × 2 Durchgänge, ca. 3–6 Minuten, wenige Cent) …")
    try:
        r = httpx.post(f"{BASE}/stab/messen", headers={"x-atlas-token": core_token()}, json={}, timeout=1200)
        d = r.json()
    except httpx.HTTPError as e:
        console.print(f"[red]Messung nicht möglich:[/] {e}")
        return
    t = Table(title="◢ STAB-MESSUNG ◣", border_style="cyan")
    for k in ("Frage", "ohne Stab", "mit Stab", "Unterschied"):
        t.add_column(k)
    fragen: dict = {}
    for l in d.get("laeufe", []):
        fragen.setdefault(l["frage"], {})["an" if l["stab"] else "aus"] = l
    for f, v in fragen.items():
        a, b = v.get("aus", {}).get("sekunden"), v.get("an", {}).get("sekunden")
        diff = f"{(b - a):+.1f} s" if a is not None and b is not None else "–"
        farbe = "green" if a is not None and b is not None and b <= a else "yellow"
        t.add_row(f, f"{a} s", f"{b} s" + ("" if v.get("an", {}).get("stab_eingesetzt") else " (direkt)"),
                  f"[{farbe}]{diff}[/]")
    console.print(t)
    console.print("[dim]Ergebnis gespeichert unter ~/.atlas/messungen/[/]")


def berechtigungen() -> None:
    console.print("Prüfe Zugriffe – macOS fragt ggf. nach Erlaubnis. "
                  "Bitte jeweils [bold]OK[/] klicken.\n")
    try:
        r = httpx.post(f"{BASE}/berechtigungen", headers={"x-atlas-token": core_token()},
                       timeout=300)
    except httpx.HTTPError:
        console.print("[red]JARVIS-Core läuft nicht.[/] → jarvis dienst start")
        return
    for quelle, ergebnis in r.json().items():
        mark = "[green]✓[/]" if ergebnis == "ok" else "[red]✗[/]"
        console.print(f"  {mark} {quelle}" + ("" if ergebnis == "ok" else f" – {ergebnis}"))


def index(aktion: str = "") -> None:
    h = {"x-atlas-token": core_token()}
    try:
        if aktion in ("pause", "weiter", "neu"):
            r = httpx.post(f"{BASE}/index/{aktion}", headers=h, timeout=600)
        else:
            r = httpx.get(f"{BASE}/index", headers=h, timeout=10)
    except httpx.HTTPError:
        console.print("[red]JARVIS-Core läuft nicht.[/] → jarvis dienst start")
        return
    st = r.json()
    t = Table(title="◢ ARCHIV-INDEX ◣", border_style="cyan", show_header=False)
    lok = st.get("lokal", {})
    t.add_row("Zustand", str(st.get("phase")) + (" [yellow](pausiert)[/]" if st.get("pausiert") else ""))
    t.add_row("Dateien im Archiv", str(st.get("dateien") or "–"))
    t.add_row("noch offen", str(st.get("offen", 0)))
    t.add_row("durchsuchbar", f"{lok.get('dokumente', 0)} Dokumente · {lok.get('abschnitte', 0)} Abschnitte")
    t.add_row("nicht lesbar", str(st.get("fehler", 0)))
    t.add_row("zuständiges Gerät", str(st.get("wache") or "–"))
    console.print(t)


def update() -> None:
    if not (REPO_DIR / ".git").exists():                # weitergegebene Installation
        console.print("→ Frage nach neuer Version ...")
        try:
            r = httpx.post(f"{BASE}/update/pruefen", headers={"x-atlas-token": core_token()}, timeout=600)
            console.print(f"  {r.json().get('hinweis') or 'aktuell'}")
        except httpx.HTTPError:
            console.print("[green]✓ Neue Version eingespielt – JARVIS startet neu.[/]")
        return
    console.print("→ Hole neueste Version ...")
    if subprocess.run(["git", "-C", str(REPO_DIR), "pull", "--ff-only"]).returncode:
        console.print("[red]Update fehlgeschlagen.[/]")
        return
    subprocess.run(["uv", "pip", "install", "-q", "--python", str(VENV_PY),
                    "-e", str(REPO_DIR)])
    for name in ("jarvis", "atlas"):            # Befehle im Terminal verfügbar machen
        link = os.path.expanduser(f"~/.local/bin/{name}")
        target = str(LOCAL_DIR / "venv/bin" / name)
        if os.path.exists(target) and not os.path.exists(link):
            os.symlink(target, link)
    dienst("neustart")


def speichern(msg: str) -> None:
    g = ["git", "-C", str(REPO_DIR)]
    subprocess.run([*g, "add", "-A"])
    if subprocess.run([*g, "diff", "--cached", "--quiet"]).returncode != 0:
        subprocess.run([*g, "commit", "-q", "-m", msg or "Aktualisierung"])
    if subprocess.run([*g, "push", "-q"]).returncode == 0:
        console.print("[green]✓ Gesichert und zu GitHub hochgeladen.[/]")
        try:                                     # andere Macs sofort benachrichtigen (über iCloud)
            from atlas.aktualisierung import signal_setzen
            from atlas.config import load_config
            from atlas.paths import shared_dir
            signal_setzen(shared_dir(load_config()))
            console.print("  Die anderen Macs übernehmen die neue Version in den nächsten Minuten automatisch.")
        except Exception:
            pass
        dienst("neustart")                       # dieser Mac läuft sofort mit dem neuen Stand


def _ensure_core() -> None:
    if _core_up():
        return
    dienst("start")
    import time
    for _ in range(30):
        if _core_up():
            return
        time.sleep(0.5)
    console.print("[red]JARVIS-Core startet nicht.[/] → jarvis dienst log")
    sys.exit(1)


DASH_LABEL = "de.atlas.dashboard"
DASH_PLIST = os.path.expanduser(f"~/Library/LaunchAgents/{DASH_LABEL}.plist")


def dashboard(args: list[str]) -> None:
    if args[:1] == ["autostart"]:
        target = f"gui/{UID}"
        if args[1:2] == ["aus"]:
            _launchctl("bootout", f"{target}/{DASH_LABEL}")
            if os.path.exists(DASH_PLIST):
                os.remove(DASH_PLIST)
            console.print("Dashboard startet nicht mehr automatisch.")
            return
        exe = str(LOCAL_DIR / "venv/bin/atlas")
        with open(DASH_PLIST, "w") as f:
            f.write(f"""<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>{DASH_LABEL}</string>
  <key>ProgramArguments</key><array><string>{exe}</string><string>dashboard</string></array>
  <key>RunAtLoad</key><true/>
  <key>LimitLoadToSessionType</key><string>Aqua</string>
</dict></plist>""")
        _launchctl("bootout", f"{target}/{DASH_LABEL}")
        _launchctl("bootstrap", target, DASH_PLIST)
        console.print("[green]✓ Dashboard öffnet sich künftig bei der Anmeldung.[/]")
        return

    _ensure_core()
    if args[:1] == ["fenster"]:              # Python-Fenster (ohne Mikrofon)
        try:
            import webview
            webview.create_window("JARVIS", f"{BASE}/ui/?token={core_token()}", width=1500, height=920,
                                  min_size=(1000, 680), background_color="#03080D")
            webview.start()
            return
        except ImportError:
            pass
    webapp = next((os.path.expanduser(f"~/Applications/{n}.app") for n in ("JARVIS", "ATLAS")
                   if os.path.exists(os.path.expanduser(f"~/Applications/{n}.app"))), None)
    if webapp:
        subprocess.run(["open", "-a", webapp])
    else:
        subprocess.run(["open", "-a", "Safari", f"{BASE}/start?token={core_token()}"])
        console.print("[dim]Tipp: In Safari → Ablage → „Zum Dock hinzufügen …“, Name „JARVIS“. "
                      "Danach öffnet 'jarvis dashboard' die eigene JARVIS-App.[/]")


def token() -> None:
    subprocess.run(["pbcopy"], input=core_token().encode())
    console.print("[green]✓ Zugangsschlüssel in der Zwischenablage[/] – im Dashboard einfügen (Cmd+V, Enter).")


def stimme(args: list[str]) -> None:
    from atlas import voice
    if len(args) >= 2 and args[0] in ("de", "en"):
        voice.save_settings(**{f"stimme_{args[0]}": args[1].strip()})
        console.print(f"[green]✓ Stimme {args[0].upper()} gespeichert.[/] Test: jarvis stimme test")
        return
    if args[:1] == ["test"]:
        import tempfile
        _ensure_core()
        for lang, text in (("de", "Guten Tag. Hier spricht JARVIS. Alle Systeme sind bereit."),
                           ("en", "Good day. This is JARVIS speaking. All systems are ready.")):
            r = httpx.post(f"{BASE}/tts", headers={"x-atlas-token": core_token()},
                           json={"text": text, "lang": lang}, timeout=60)
            suffix = ".mp3" if "mpeg" in r.headers.get("content-type", "") else ".wav"
            with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as f:
                f.write(r.content)
            from urllib.parse import unquote
            quelle = r.headers.get("x-tts-engine", "?")
            grund = unquote(r.headers.get("x-tts-grund", ""))
            farbe = "green" if quelle == "ElevenLabs" else "yellow"
            console.print(f"▶ {lang.upper()} · [{farbe}]{quelle}[/] · {grund}")
            subprocess.run(["afplay", f.name])
        return
    st = voice.settings()
    console.print(f"Deutsch:  {st['stimme_de'] or '– nicht gesetzt'}\nEnglisch: {st['stimme_en'] or '– nicht gesetzt'}\n"
                  f"Modell:   {st['modell']}\n[dim]Setzen: jarvis stimme de <Voice-ID>[/]")


def weckwort(args: list[str]) -> None:
    from atlas import voice
    if args[:1] == ["empfindlichkeit"] and len(args) > 1:
        voice.save_settings(empfindlichkeit=float(args[1].replace(",", ".")))
    elif args:
        voice.save_settings(weckwort_modell=args[0])
    st = voice.settings()
    console.print(f"Weckwort: [bold]{st['weckwort_modell']}[/] · Schwelle {st['empfindlichkeit']} "
                  f"[dim](niedriger = reagiert leichter, höher = weniger Fehlauslösungen)[/]\n"
                  f"[dim]Wirksam nach Aus-/Einschalten von „Weckwort“ im Dashboard.[/]")


def _check_elevenlabs(key: str) -> tuple[bool, str]:
    """Gültig = ElevenLabs erkennt den Schlüssel. Ein eingeschränkter Schlüssel
    (nur Text to Speech) darf /models evtl. nicht lesen – das ist in Ordnung."""
    try:
        r = httpx.get("https://api.elevenlabs.io/v1/models", headers={"xi-api-key": key}, timeout=15)
    except httpx.HTTPError as e:
        return False, f"keine Verbindung: {e}"
    if r.status_code == 200:
        return True, ""
    if "invalid_api_key" in r.text:
        return False, "ElevenLabs kennt diesen Schlüssel nicht"
    return True, "(eingeschränkter Schlüssel)"


def setup_telegram() -> None:
    from atlas import telegram
    console.print(Panel.fit("[bold cyan]Telegram verbinden[/]", border_style="cyan"))
    console.print("1. In Telegram den Kontakt [bold]@BotFather[/] öffnen → /newbot\n"
                  "2. Namen wählen (z. B. „JARVIS Anna“) und einen Benutzernamen, der auf „bot“ endet\n"
                  "3. Den angezeigten Token kopieren (Format 123456789:ABC…)")
    token = getpass.getpass("\nBot-Token: ").strip()
    if not token:
        return
    try:
        me = httpx.get(f"https://api.telegram.org/bot{token}/getMe", timeout=15).json()
    except httpx.HTTPError as e:
        console.print(f"[red]Keine Verbindung zu Telegram:[/] {e}")
        return
    if not me.get("ok"):
        console.print("[red]✗ Token ungültig – nicht gespeichert.[/]")
        return
    set_secret("telegram", token)
    name = me["result"]["username"]
    console.print(f"[green]✓ Bot @{name} erkannt.[/]\n\nJetzt in Telegram [bold]@{name}[/] öffnen und "
                  f"[bold]Start[/] drücken (oder „Hallo“ schreiben). Ich warte bis zu 2 Minuten …")
    dienst("stop")                     # damit der Dienst die erste Nachricht nicht abholt
    chat = telegram.setup_chat_id(token)
    dienst("start")
    if chat:
        console.print("[green]✓ Verbunden.[/] Nur dieser Chat darf JARVIS steuern.")
        httpx.post(f"https://api.telegram.org/bot{token}/sendMessage",
                   json={"chat_id": chat, "text": "Zu Diensten. JARVIS ist verbunden."}, timeout=15)
    else:
        console.print("[yellow]Keine Nachricht erhalten.[/] Erneut: jarvis setup telegram")


def briefing(args: list[str]) -> None:
    _ensure_core()
    h = {"x-atlas-token": core_token()}
    if args[:1] == ["jetzt"]:
        console.print("Erstelle Briefing … (Telegram und Dashboard erhalten es ebenfalls)")
        r = httpx.post(f"{BASE}/briefing", headers=h, timeout=300)
    else:
        r = httpx.get(f"{BASE}/briefing", headers=h, timeout=30)
    b = r.json()
    if b.get("text"):
        console.print(Panel(b["text"], title=f"☀ Morgenbriefing · {b.get('zeit', '')} · {b.get('geraet', '')}",
                            border_style="cyan"))
    else:
        console.print("Heute noch kein Briefing. Sofort erstellen: [bold]jarvis briefing jetzt[/]")


def setup_bilder() -> None:
    console.print(Panel.fit("[bold cyan]Google-Bildersuche einrichten[/]", border_style="cyan"))
    console.print("[dim]Google selbst nimmt für seine Such-Schnittstelle keine neuen Kunden mehr an. JARVIS nutzt deshalb\n"
                  "Serper.dev, das die Ergebnisse von Google Bilder liefert:\n"
                  "1. serper.dev → „Sign up“ (2.500 Suchen gratis, ohne Kreditkarte)\n"
                  "2. Dashboard → „API Key“ kopieren[/]")
    v = getpass.getpass("Serper-API-Schlüssel (Enter = unverändert): ").strip()
    if not v:
        return
    try:
        r = httpx.post("https://google.serper.dev/images", timeout=15,
                       headers={"X-API-KEY": v, "Content-Type": "application/json"}, json={"q": "Elefant", "num": 10})
        ok = r.status_code == 200 and bool(r.json().get("images"))
        info = "" if ok else f"{r.status_code} {r.text[:100]}"
    except Exception as e:
        ok, info = False, str(e)[:120]
    if ok:
        set_secret("serper", v)
        console.print("  [green]✓ Schlüssel gültig und gespeichert – „Zeig mir ein Bild von …“ nutzt jetzt Google Bilder[/]")
    else:
        console.print(f"  [red]✗ Schlüssel abgelehnt – nicht gespeichert[/] ({info})")


def setup_youtube() -> None:
    console.print(Panel.fit("[bold cyan]YouTube einrichten[/]", border_style="cyan"))
    console.print("[dim]1. console.cloud.google.com → Projekt anlegen (z. B. „JARVIS“)\n"
                  "2. „APIs & Dienste“ → Bibliothek → „YouTube Data API v3“ → Aktivieren\n"
                  "3. „Anmeldedaten“ → „Anmeldedaten erstellen“ → API-Schlüssel → kopieren\n"
                  "   (Empfohlen: Schlüssel beschränken auf „YouTube Data API v3“.) Kostenlos, ca. 100 Suchen/Tag.[/]")
    v = getpass.getpass("YouTube-API-Schlüssel (beginnt mit AIza, Enter = unverändert): ").strip()
    if not v:
        return
    try:
        r = httpx.get("https://www.googleapis.com/youtube/v3/search", timeout=15,
                      params={"key": v, "part": "id", "q": "test", "type": "video", "maxResults": 1})
        ok = r.status_code == 200
        info = "" if ok else (r.json().get("error", {}).get("message", "") or str(r.status_code))[:120]
    except Exception as e:
        ok, info = False, str(e)[:120]
    if ok:
        set_secret("youtube", v)
        console.print("  [green]✓ YouTube-Schlüssel gültig und gespeichert[/]")
        dienst("neustart")
    else:
        console.print(f"  [red]✗ Schlüssel abgelehnt – nicht gespeichert[/] ({info})")


def setup_sprache() -> None:
    console.print(Panel.fit("[bold cyan]Sprache einrichten[/]", border_style="cyan"))
    console.print("[dim]Den Schlüssel (beginnt mit sk_) direkt nach dem Erstellen kopieren – "
                  "nicht den Namen und nicht die Key-ID.[/]")
    v = getpass.getpass("ElevenLabs API-Key (Enter = unverändert): ").strip()
    if v:
        ok, info = _check_elevenlabs(v)
        if ok:
            set_secret("elevenlabs", v)
            console.print(f"  [green]✓ ElevenLabs-Schlüssel gültig und gespeichert[/] {info}")
        else:
            console.print(f"  [red]✗ Schlüssel abgelehnt – nicht gespeichert[/] ({info})")
    dienst("neustart")


# ---------------------------------------------------------------- Gespräch
def chat() -> None:
    _ensure_core()

    LOCAL_DIR.mkdir(exist_ok=True)
    session = PromptSession(history=FileHistory(str(LOCAL_DIR / "history")))
    url = f"ws://127.0.0.1:{PORT}/ws?token={core_token()}"

    with connect(url, max_size=None) as ws:
        hello = json.loads(ws.recv())
        console.print(Panel.fit(
            f"[bold cyan]JARVIS[/] v{__version__}  ·  {HOST}\n{hello['text']}\n"
            f"[dim]/hilfe für Befehle[/]",
            border_style="cyan", title="◢ SYSTEM ONLINE ◣"))

        while True:
            try:
                text = session.prompt("\n▸ ").strip()
            except (KeyboardInterrupt, EOFError):
                text = "/ende"
            if not text:
                continue

            if text.startswith("/"):
                cmd = text[1:].split()[0].lower()
                if cmd in ("ende", "exit"):
                    console.print("[cyan]Zu Diensten. Bis später.[/]")
                    return
                if cmd in ("hilfe", "help"):
                    console.print(HELP)
                elif cmd == "status":
                    status()
                elif cmd == "neu":
                    ws.send(json.dumps({"type": "clear"}))
                    console.print(f"[dim]{json.loads(ws.recv())['text']}[/]")
                elif cmd in ("notaus", "weiter"):
                    state = "an" if cmd == "notaus" else "aus"
                    httpx.post(f"{BASE}/notaus/{state}",
                               headers={"x-atlas-token": core_token()})
                    console.print(f"[yellow]Not-Aus {state}.[/]")
                elif cmd in ("auto", "lokal", "claude", "sonnet", "opus", "haiku"):
                    ws.send(json.dumps({"type": "mode", "value": cmd}))
                    console.print(f"[green]{json.loads(ws.recv())['text']}[/]")
                else:
                    console.print("[yellow]Unbekannter Befehl.[/] /hilfe")
                continue

            ws.send(json.dumps({"type": "chat", "text": text}))
            _receive(ws)


def _receive(ws) -> None:
    """Antworten des Kerns anzeigen, bis die Antwort fertig ist."""
    while True:
        ev = json.loads(ws.recv())
        kind = ev["type"]
        if kind == "route":
            icon = "◆ lokal" if ev["target"] == "lokal" else "◇ claude"
            console.print(f"\n[dim]{icon} · {ev['model']} · {ev['reason']}[/]")
            console.print("[bold cyan]JARVIS[/] ", end="")
        elif kind == "tool":
            console.print(f"\n[dim]⚙ {ev['text']}[/]", end="")
        elif kind == "delta":
            console.out(ev["text"], end="", highlight=False)
        elif kind == "confirm":
            console.print(f"\n[yellow]? {ev['text']}[/]")
            answer = input("  [j/n] ▸ ").strip().lower().startswith("j")
            ws.send(json.dumps({"type": "confirm", "id": ev["id"], "answer": answer}))
        elif kind == "done":
            console.print(f"\n[dim]{ev['tokens_in']}↑ {ev['tokens_out']}↓ Tokens[/]")
            return
        elif kind == "error":
            console.print(f"\n[red]{ev['text']}[/]")
            return
        elif kind == "info":
            console.print(f"[dim]{ev['text']}[/]")


def main() -> None:
    args = sys.argv[1:]
    cmd = args[0] if args else "chat"
    if cmd == "setup" and args[1:2] == ["sprache"]:
        setup_sprache()
    elif cmd == "setup" and args[1:2] == ["bilder"]:
        setup_bilder()
    elif cmd == "setup" and args[1:2] == ["youtube"]:
        setup_youtube()
    elif cmd == "setup" and args[1:2] == ["telegram"]:
        setup_telegram()
    elif cmd == "briefing":
        briefing(args[1:])
    elif cmd == "setup":
        setup(args[1] if len(args) > 1 else "")
    elif cmd == "token":
        token()
    elif cmd == "stimme":
        stimme(args[1:])
    elif cmd == "weckwort":
        weckwort(args[1:])
    elif cmd == "app":
        app_bauen()
    elif cmd in ("sperren", "entsperren", "sperrliste", "mindestversion"):
        from atlas import lizenz
        lizenz.verwalten([cmd, *args[1:]])
    elif cmd == "iphone":
        from atlas import iphone
        iphone.einrichten(core_token())
    elif cmd == "einrichten":
        from atlas import einrichtung
        einrichtung.main(args[1:])
    elif cmd == "paket":
        from atlas import paket
        paket.paket()
    elif cmd in ("veroeffentlichen", "veröffentlichen"):
        from atlas import paket
        paket.veroeffentlichen()
    elif cmd == "mail" and args[1:2] == ["test"]:
        mail_test()
    elif cmd == "status":
        status()
    elif cmd == "berechtigungen":
        berechtigungen()
    elif cmd == "index":
        index(args[1] if len(args) > 1 else "")
    elif cmd == "dashboard":
        dashboard(args[1:])
    elif cmd == "dienst":
        dienst(args[1] if len(args) > 1 else "")
    elif cmd == "update":
        update()
    elif cmd == "messen":
        messen()
    elif cmd == "speichern":
        speichern(" ".join(args[1:]))
    elif cmd in ("chat", "gespraech"):
        chat()
    elif cmd in ("-h", "--help", "hilfe"):
        console.print(__doc__)
    else:
        console.print(__doc__)


if __name__ == "__main__":
    main()
