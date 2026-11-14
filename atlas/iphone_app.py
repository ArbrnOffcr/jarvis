"""JARVIS als eigene iPhone-App – ohne App Store (Weg 2: kostenlose Apple-ID, „Personal Team“).

  jarvis iphone-app              Xcode-Projekt erzeugen und in Xcode öffnen (erstes Mal: dort ▶ drücken)
  jarvis iphone-app installieren App bauen und auf das verbundene iPhone spielen (auch alle 7 Tage zum Erneuern)
  jarvis iphone-app link         QR-Code zum Verbinden der App mit diesem Mac (enthält den Zugangsschlüssel)

Mit kostenloser Apple-ID läuft die App 7 Tage, danach einfach `jarvis iphone-app installieren` (iPhone per Kabel
oder im selben WLAN, einmal gekoppelt). Mit Apple Developer Program (99 $/Jahr) wären es bis zu ein Jahr bzw. TestFlight.
"""
from __future__ import annotations

import json
import re
import secrets
import shutil
import subprocess
from datetime import datetime, timedelta
from pathlib import Path
from urllib.parse import quote

from atlas.paths import LOCAL_DIR, REPO_DIR

IOS = REPO_DIR / "ios"
PROJEKT = IOS / "JARVIS.xcodeproj"
ZUSTAND = LOCAL_DIR / "iphone_app.json"
GUELTIG_TAGE = 7


def zustand() -> dict:
    try:
        return json.loads(ZUSTAND.read_text())
    except (OSError, ValueError):
        return {}


def _speichern(z: dict) -> None:
    ZUSTAND.write_text(json.dumps(z, indent=1))
    ZUSTAND.chmod(0o600)


def bundle_id() -> str:
    """Eindeutige Kennung je Installation – mit kostenloser Apple-ID muss sie weltweit frei sein."""
    z = zustand()
    if not z.get("bundle"):
        z["bundle"] = f"de.jarvis.privat.{secrets.token_hex(4)}"
        _speichern(z)
    return z["bundle"]


def team_id() -> str | None:
    """Team-ID des Entwicklerzertifikats (auch beim kostenlosen „Personal Team“), aus dem Schlüsselbund des Macs."""
    try:
        pem = subprocess.run(["security", "find-certificate", "-a", "-c", "Apple Development", "-p"],
                             capture_output=True, text=True, timeout=20).stdout
    except (OSError, subprocess.SubprocessError):
        return None
    for block in re.findall(r"-----BEGIN CERTIFICATE-----.+?-----END CERTIFICATE-----", pem, re.S):
        try:
            sub = subprocess.run(["openssl", "x509", "-noout", "-subject"], input=block, capture_output=True,
                                 text=True, timeout=10).stdout
        except (OSError, subprocess.SubprocessError):
            continue
        m = re.search(r"OU\s*=\s*([A-Z0-9]{10})", sub)
        if m:
            return m.group(1)
    return None


def project_yml(bundle: str, team: str | None, version: str) -> str:
    """Bauplan für XcodeGen – daraus entsteht JARVIS.xcodeproj (nicht versioniert)."""
    return f"""name: JARVIS
options:
  deploymentTarget:
    iOS: "16.0"
  createIntermediateGroups: true
settings:
  base:
    MARKETING_VERSION: "{version}"
    CURRENT_PROJECT_VERSION: "{datetime.now():%Y%m%d%H%M}"
    CODE_SIGN_STYLE: Automatic
    DEVELOPMENT_TEAM: "{team or ''}"
    SWIFT_VERSION: "5.0"
targets:
  JARVIS:
    type: application
    platform: iOS
    sources: [JARVIS]
    info:
      path: JARVIS/Info.plist
      properties:
        CFBundleDisplayName: JARVIS
        CFBundleShortVersionString: "$(MARKETING_VERSION)"
        CFBundleVersion: "$(CURRENT_PROJECT_VERSION)"
        LSRequiresIPhoneOS: true
        UILaunchScreen:
          UIColorName: ""
        UIStatusBarStyle: UIStatusBarStyleLightContent
        UISupportedInterfaceOrientations: [UIInterfaceOrientationPortrait]
        NSMicrophoneUsageDescription: "JARVIS hört zu, wenn du mit ihm sprichst. Die Spracherkennung läuft auf deinem Mac."
        CFBundleURLTypes:
          - CFBundleURLName: de.jarvis.verbinden
            CFBundleURLSchemes: [jarvis-app]
    settings:
      base:
        PRODUCT_BUNDLE_IDENTIFIER: {bundle}
        ASSETCATALOG_COMPILER_APPICON_NAME: AppIcon
        TARGETED_DEVICE_FAMILY: "1"
        INFOPLIST_KEY_UIApplicationSupportsIndirectInputEvents: YES
"""


def _xcodegen() -> str | None:
    x = shutil.which("xcodegen") or next((p for p in ("/opt/homebrew/bin/xcodegen", "/usr/local/bin/xcodegen")
                                          if Path(p).exists()), None)
    if x:
        return x
    brew = shutil.which("brew") or next((p for p in ("/opt/homebrew/bin/brew", "/usr/local/bin/brew") if Path(p).exists()), None)
    if brew:
        subprocess.run([brew, "install", "xcodegen"], timeout=900)
        return shutil.which("xcodegen") or next((p for p in ("/opt/homebrew/bin/xcodegen", "/usr/local/bin/xcodegen")
                                                 if Path(p).exists()), None)
    return None


def xcode_da() -> bool:
    try:
        return subprocess.run(["xcodebuild", "-version"], capture_output=True, timeout=30).returncode == 0
    except (OSError, subprocess.SubprocessError):
        return False


def vorbereiten() -> tuple[bool, str]:
    """Xcode-Projekt aus ios/ erzeugen. Rückgabe (ok, Text)."""
    from atlas import __version__
    if not xcode_da():
        return False, ("Xcode fehlt. Bitte aus dem Mac App Store „Xcode“ installieren, einmal öffnen (Komponenten "
                       "installieren lassen), dann erneut: jarvis iphone-app")
    xg = _xcodegen()
    if not xg:
        return False, "XcodeGen fehlt und Homebrew ist nicht da. Bitte einmal: brew install xcodegen"
    team = team_id()
    (IOS / "project.yml").write_text(project_yml(bundle_id(), team, __version__.split("-")[0]), encoding="utf-8")
    r = subprocess.run([xg, "generate", "--spec", str(IOS / "project.yml"), "--project", str(IOS)],
                       capture_output=True, text=True, timeout=300)
    if r.returncode:
        return False, f"Xcode-Projekt ließ sich nicht erzeugen: {(r.stderr or r.stdout)[-400:]}"
    return True, team or ""


def geraet() -> tuple[str, str] | None:
    """Erstes verbundenes iPhone (Kabel oder gekoppelt im WLAN): (Kennung, Name)."""
    import tempfile
    try:
        with tempfile.TemporaryDirectory() as d:
            aus = Path(d) / "geraete.json"
            subprocess.run(["xcrun", "devicectl", "list", "devices", "--json-output", str(aus)],
                           capture_output=True, text=True, timeout=60)
            daten = json.loads(aus.read_text())
    except (OSError, subprocess.SubprocessError, ValueError):
        return None
    for d in (daten.get("result") or {}).get("devices", []):
        hw = d.get("hardwareProperties") or {}
        if hw.get("platform") == "iOS" and (d.get("connectionProperties") or {}).get("pairingState") == "paired":
            return d.get("identifier"), (d.get("deviceProperties") or {}).get("name", "iPhone")
    return None


def installieren() -> tuple[bool, str]:
    ok, team = vorbereiten()
    if not ok:
        return False, team
    if not team:
        return False, ("Noch kein Entwicklerzertifikat auf diesem Mac. Einmal: jarvis iphone-app → in Xcode unter "
                       "„Signing & Capabilities“ dein „Personal Team“ wählen und ▶ drücken.")
    g = geraet()
    if not g:
        return False, ("Kein iPhone gefunden. iPhone per Kabel verbinden, entsperren und „Vertrauen“ tippen "
                       "(Entwicklermodus muss an sein: Einstellungen → Datenschutz & Sicherheit → Entwicklermodus).")
    ziel = LOCAL_DIR / "iphone-app-build"
    r = subprocess.run(["xcodebuild", "-project", str(PROJEKT), "-scheme", "JARVIS", "-configuration", "Release",
                        "-destination", f"id={g[0]}", "-derivedDataPath", str(ziel), "-allowProvisioningUpdates",
                        "-allowProvisioningDeviceRegistration", f"DEVELOPMENT_TEAM={team}", "build"],
                       capture_output=True, text=True, timeout=1800)
    if r.returncode:
        zeilen = [z for z in (r.stdout + r.stderr).splitlines() if "error" in z.lower()][-5:]
        return False, "Bauen fehlgeschlagen:\n" + "\n".join(zeilen or [(r.stderr or r.stdout)[-600:]])
    app = next((ziel / "Build/Products").glob("Release-iphoneos/*.app"), None)
    if not app:
        return False, "Gebaute App nicht gefunden."
    r = subprocess.run(["xcrun", "devicectl", "device", "install", "app", "--device", g[0], str(app)],
                       capture_output=True, text=True, timeout=600)
    if r.returncode:
        return False, f"Aufspielen fehlgeschlagen: {(r.stderr or r.stdout)[-400:]}"
    z = zustand()
    z["installiert"] = datetime.now().isoformat(timespec="minutes")
    z["laeuft_ab"] = (datetime.now() + timedelta(days=GUELTIG_TAGE)).isoformat(timespec="minutes")
    _speichern(z)
    return True, g[1]


def startadresse(token: str) -> str | None:
    from atlas import iphone
    st = iphone.tailscale_status()
    return f"{st['url']}/start?token={token}" if st.get("url") else None


def app_link(token: str) -> str | None:
    s = startadresse(token)
    return f"jarvis-app://verbinden?u={quote(s, safe='')}" if s else None


def befehl(args: list[str], token: str) -> None:
    from rich.console import Console
    c = Console()
    aktion = (args[:1] or [""])[0]
    if aktion == "link":
        link = app_link(token)
        if not link:
            c.print("[yellow]Tailscale-Adresse unbekannt.[/] Erst einmal: jarvis iphone")
            return
        from atlas import iphone
        q = iphone.qr_terminal(link)
        c.print("\nMit der iPhone-[bold]Kamera[/] scannen → „In JARVIS öffnen“:\n")
        print(q or link)
        c.print("[dim]Der Code enthält deinen Zugangsschlüssel – nicht weitergeben.[/]")
        return
    if aktion == "installieren":
        c.print("→ Baue JARVIS für das iPhone und spiele es auf … (beim ersten Mal einige Minuten)")
        ok, text = installieren()
        if ok:
            c.print(f"[green]✓ JARVIS auf „{text}“ installiert[/] – läuft {GUELTIG_TAGE} Tage, dann erneut: "
                    "jarvis iphone-app installieren")
        else:
            c.print(f"[red]✗[/] {text}")
        return
    ok, team = vorbereiten()
    if not ok:
        c.print(f"[red]✗[/] {team}")
        return
    subprocess.run(["open", str(PROJEKT)])
    c.print(f"""[green]✓ Xcode-Projekt geöffnet[/] ({PROJEKT})

[bold]Einmalig – so kommt JARVIS auf dein iPhone (kostenlose Apple-ID):[/]
  1. Xcode → Einstellungen → Accounts → „+“ → mit deiner Apple-ID anmelden.
  2. Im Projekt links „JARVIS“ → Reiter „Signing & Capabilities“ → Team: „{'dein Personal Team' if not team else 'Personal Team (' + team + ')'}“.
  3. iPhone per Kabel anschließen, entsperren, „Vertrauen“ tippen. Auf dem iPhone:
     Einstellungen → Datenschutz & Sicherheit → [bold]Entwicklermodus[/] einschalten (iPhone startet neu).
  4. Oben in Xcode dein iPhone als Ziel wählen und ▶ drücken.
  5. Auf dem iPhone: Einstellungen → Allgemein → VPN & Geräteverwaltung → deinem Entwickler-Profil [bold]vertrauen[/].
  6. Verbinden: [bold]jarvis iphone-app link[/] → QR-Code mit der Kamera scannen.

Die App läuft {GUELTIG_TAGE} Tage. Danach (iPhone verbunden): [bold]jarvis iphone-app installieren[/]
Neu verbinden in der App: mit drei Fingern lange auf den Bildschirm drücken.""")


def erinnerung() -> str:
    """Für Briefing/Hinweise: läuft die iPhone-App bald ab?"""
    z = zustand()
    if not z.get("laeuft_ab"):
        return ""
    rest = datetime.fromisoformat(z["laeuft_ab"]) - datetime.now()
    if rest <= timedelta(days=1):
        return ("Die JARVIS-App auf dem iPhone läuft " + ("heute" if rest.total_seconds() > 0 else "nicht mehr")
                + " ab – iPhone verbinden und „jarvis iphone-app installieren“.")
    return ""
