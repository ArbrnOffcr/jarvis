"""Freundesversion: Installations-DMG bauen und (optional) veröffentlichen.

    jarvis paket              → ~/Desktop/JARVIS-<Version>.dmg
    jarvis veroeffentlichen   → Code ins öffentliche Repo (eigene, saubere Historie), DMG als GitHub-Release.
                                 Installationen deiner Freunde holen sich neue Versionen von dort.

Ins Paket kommt nur der Programmcode (zuletzt gesicherter Stand). Persönliche Einstellungen, Gedächtnis,
Schlüssel und Archiv liegen ohnehin außerhalb (iCloud/ATLAS-Privat, Schlüsselbund). Vor jedem Export
prüft ein Datenschutz-Scan, dass weder Schlüssel noch persönliche Angaben im Code stehen."""
import json
import re
import shutil
import subprocess
import tarfile
import tempfile
import time
from pathlib import Path

from rich.console import Console

from atlas import __version__
from atlas.paths import LOCAL_DIR, REPO_DIR

console = Console()
EXPORT = ["atlas", "app", "installer", "tools", "install.sh", "pyproject.toml", ".gitignore", "FUNKTIONEN.md"]
TEXT = {".py", ".js", ".html", ".css", ".swift", ".sh", ".toml", ".md", ".txt", ".json", ".yaml", ".yml"}

README = """# JARVIS – persönlicher Assistent für den Mac

Termine, Erinnerungen, Einkaufsliste, Mails, Dokumente und Wetter – per Sprache oder Text,
mit Claude als Gehirn und optional einem lokalen Sprachmodell für Privates.

## Installation
1. Unter **Releases** die neueste `JARVIS-….dmg` laden und öffnen.
2. **Rechtsklick** auf „JARVIS installieren“ → **Öffnen** → nochmals **Öffnen**
   (die App ist nicht von Apple beglaubigt – nur beim ersten Start nötig).
3. Den Assistenten ausfüllen – nur der Claude-Schlüssel ist Pflicht.

Voraussetzungen: Mac mit Apple-Chip (M1 oder neuer), macOS 13 oder neuer.

## Datenschutz
- Schlüssel und Passwörter liegen nur im Schlüsselbund deines Macs.
- Einstellungen und Gedächtnis liegen in deinem iCloud Drive (Ordner `ATLAS-Privat`).
- Sensible Themen (Gesundheit, Finanzen, Zugangsdaten) bleiben auf dem Mac, wenn das lokale Modell installiert ist.

## Was JARVIS kann
Siehe [FUNKTIONEN.md](FUNKTIONEN.md) – oder JARVIS selbst fragen: „Was kannst du?“

## Updates
JARVIS sieht alle paar Stunden nach einer neuen Version und spielt sie selbst ein (`jarvis update` erzwingt es).
"""

ANLEITUNG = """JARVIS installieren
===================

1. Rechtsklick (oder Ctrl-Klick) auf „JARVIS installieren“ und „Öffnen“ wählen.
   macOS warnt, weil die App nicht von Apple beglaubigt ist – noch einmal „Öffnen“ klicken.
   (Falls kein „Öffnen“ erscheint: Systemeinstellungen → Datenschutz & Sicherheit → ganz unten „Dennoch öffnen“.)

2. Den Assistenten ausfüllen. Pflicht ist nur der Claude-Schlüssel von console.anthropic.com.

3. Am Ende fragt macOS nach Kalender, Erinnerungen, Kontakten und Mikrofon – jeweils „OK“.

Danach liegt JARVIS unter Benutzer → Programme und startet bei jeder Anmeldung.
Die DMG kann anschließend ausgeworfen und gelöscht werden.
"""


def funktionen_als_text(md: str) -> str:
    """FUNKTIONEN.md (Tabellen) → gut lesbare Textdatei für die DMG."""
    import re
    import textwrap
    zeilen, titel = [], ""
    for z in md.splitlines():
        z = z.rstrip()
        if z.startswith("# "):
            titel = z[2:].strip()
            zeilen += [titel.upper(), "=" * len(titel), ""]
        elif z.startswith("## "):
            k = re.sub(r"^\d+\.\s*", "", z[3:].strip())
            zeilen += ["", k.upper(), "-" * len(k)]
        elif z.startswith("|"):
            zellen = [c.strip() for c in z.strip("|").split("|")]
            if len(zellen) < 2 or zellen[0] in ("Funktion", "") or set(zellen[0]) <= set("-: "):
                continue
            funktion, stand = zellen[0], zellen[1]
            hinweis = zellen[2] if len(zellen) > 2 else ""
            funktion = funktion.replace("`", "")
            hinweis = hinweis.replace("`", "")
            kopf = f"  {stand}  "
            text = funktion + (f"  ({hinweis})" if hinweis else "")
            umbruch = textwrap.wrap(text, 86) or [""]
            zeilen.append(kopf + umbruch[0])
            zeilen += ["      " + u for u in umbruch[1:]]
        elif z.strip() == "---":
            continue
        else:
            zeilen.append(z.replace("`", "").replace("**", ""))
    zeilen += ["", "Tipp: Frag JARVIS jederzeit „Was kannst du?“ – oder öffne ⚙ Einstellungen → Funktionsliste.", ""]
    return "\n".join(re.sub(r"\n{3,}", "\n\n", "\n".join(zeilen)).splitlines()) + "\n"


def _run(cmd, **kw) -> subprocess.CompletedProcess:
    return subprocess.run(cmd, capture_output=True, text=True, **kw)


def _cfg() -> dict:
    from atlas.config import load_config
    return load_config()


# ------------------------------------------------------------------ Export + Datenschutz-Scan
def verbotene_texte(cfg: dict) -> list[str]:
    """Was nie in der Freundesversion stehen darf: Schlüssel und persönliche Angaben aus config.yaml."""
    from atlas.keystore import get_secret
    out = []
    for name in ("anthropic", "elevenlabs", "telegram", "serper", "youtube", "icloud_app_pw", "icloud_apple_id",
                 "icloud_email"):
        v = get_secret(name)
        if v and len(v) >= 8:
            out.append(v)
    bh = cfg.get("beihilfe") or {}
    for k in (bh.get("kinder") or {}).values():
        for teil in str(k.get("name", "")).split():
            if len(teil) >= 4:
                out.append(teil)
    for pfad in (bh.get("excel"), cfg.get("archive_path")):
        if pfad:
            out.append(Path(str(pfad)).name)
    return sorted({x for x in out if x})


def exportieren(ziel: Path, cfg: dict) -> None:
    """Zuletzt gesicherten Stand (git HEAD) exportieren und prüfen."""
    r = _run(["git", "-C", str(REPO_DIR), "status", "--porcelain", "--untracked-files=no"])
    if r.stdout.strip():
        console.print("[yellow]Hinweis:[/] Es gibt ungesicherte Änderungen – exportiert wird der zuletzt mit "
                      "'jarvis speichern' gesicherte Stand.")
    vorhanden = [p for p in EXPORT if (REPO_DIR / p).exists()]
    ziel.mkdir(parents=True, exist_ok=True)
    arch = subprocess.run(["git", "-C", str(REPO_DIR), "archive", "--format=tar", "HEAD", *vorhanden],
                          capture_output=True)
    if arch.returncode:
        raise SystemExit(f"git archive fehlgeschlagen: {arch.stderr.decode()[-300:]}")
    with tempfile.NamedTemporaryFile(suffix=".tar") as t:
        t.write(arch.stdout)
        t.flush()
        with tarfile.open(t.name) as tf:
            tf.extractall(ziel, filter="data")
    (ziel / "README.md").write_text(README, encoding="utf-8")
    for p in ziel.rglob("__pycache__"):
        shutil.rmtree(p, ignore_errors=True)
    treffer = []
    verboten = verbotene_texte(cfg)
    # Schlüssel-Muster – greifen auch, wenn ein fremder oder alter Schlüssel im Code gelandet wäre
    muster = re.compile(r"sk-ant-[A-Za-z0-9_-]{16,}|AIza[0-9A-Za-z_-]{30,}|sk_[0-9a-f]{30,}|"
                        r"\b\d{8,10}:AA[0-9A-Za-z_-]{30,}|\b[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}\b")
    for f in ziel.rglob("*"):
        if not f.is_file():
            continue
        try:
            roh = f.read_bytes()
        except OSError:
            continue
        rel = f.relative_to(ziel)
        for v in verboten:                                   # auch in Binärdateien suchen
            i = roh.find(v.encode("utf-8"))
            if i >= 0:
                zeile = roh[:i].count(b"\n") + 1
                zeig = v if len(v) < 20 else v[:4] + "…"          # Schlüssel nie ausgeben
                treffer.append(f"{rel}:{zeile}  enthält „{zeig}“")
        if f.suffix.lower() in TEXT and "vendor" not in rel.parts:
            text = roh.decode("utf-8", errors="ignore")
            for m in muster.finditer(text):
                if m.group(0) in ("abcd-efgh-ijkl-mnop", "xxxx-xxxx-xxxx-xxxx"):      # Beispiele in Anleitungen
                    continue
                treffer.append(f"{rel}:{text[:m.start()].count(chr(10)) + 1}  sieht aus wie ein Schlüssel ({m.group(0)[:6]}…)")
    if treffer:
        console.print("[red]✕ Datenschutz-Scan: persönliche Angaben oder Schlüssel im Code gefunden:[/]")
        for t in treffer[:30]:
            console.print("   " + t)
        raise SystemExit("Abgebrochen – bitte diese Stellen bereinigen, sichern und erneut versuchen.")
    console.print(f"[green]✓[/] Datenschutz-Scan ohne Befund ({len(verboten)} Prüfmuster)")


# ------------------------------------------------------------------ DMG
def paket(sha: str = "", repo: str = "") -> Path | None:
    from atlas.cli import baue_app, signieren
    for werkzeug in ("swiftc", "hdiutil", "git", "ditto"):
        if not shutil.which(werkzeug):
            console.print(f"[red]{werkzeug} fehlt[/] – 'xcode-select --install' ausführen.")
            return None
    cfg = _cfg()
    repo = repo or (cfg.get("veroeffentlichen") or {}).get("repo", "")
    version = f"{__version__}-{time.strftime('%Y%m%d')}"
    ziel_dmg = Path.home() / "Desktop" / f"JARVIS-{version}.dmg"
    with tempfile.TemporaryDirectory() as tmp:
        tmp = Path(tmp)
        console.print("→ Programmcode exportieren …")
        code = tmp / "code"
        exportieren(code, cfg)
        res_dateien = tmp / "res"
        res_dateien.mkdir()
        with tarfile.open(res_dateien / "jarvis-code.tar.gz", "w:gz") as tf:
            for p in sorted(code.iterdir()):
                tf.add(p, arcname=p.name)

        console.print("→ JARVIS-App übersetzen …")
        (tmp / "a").mkdir()
        app = baue_app(tmp / "a")
        if not app:
            return None
        signieren(app)

        console.print("→ Installer übersetzen …")
        (tmp / "i").mkdir()
        inst = baue_app(tmp / "i", quelle=code / "installer" / "Installer.swift", name="JARVIS installieren",
                        bundle_id="de.atlas.jarvis.installer", frameworks=("Cocoa", "WebKit"), mikrofon=False)
        if not inst:
            return None
        r = inst / "Contents/Resources"
        shutil.copy2(code / "installer" / "assistent.html", r / "assistent.html")
        shutil.copy2(code / "installer" / "installieren.sh", r / "installieren.sh")
        shutil.copy2(res_dateien / "jarvis-code.tar.gz", r / "jarvis-code.tar.gz")
        _run(["ditto", str(app), str(r / "JARVIS.app")])
        (r / "release.json").write_text(json.dumps({"version": version, "sha": sha, "repo": repo,
                                                    "datum": time.strftime("%Y-%m-%d")}), encoding="utf-8")
        signieren(inst)

        console.print("→ DMG erstellen …")
        dmg = tmp / "dmg"
        dmg.mkdir()
        _run(["ditto", str(inst), str(dmg / inst.name)])
        (dmg / "So geht's.txt").write_text(ANLEITUNG, encoding="utf-8")
        liste = code / "FUNKTIONEN.md"
        if liste.exists():
            (dmg / "Was JARVIS kann.txt").write_text(funktionen_als_text(liste.read_text(encoding="utf-8")),
                                                       encoding="utf-8")
        ziel_dmg.unlink(missing_ok=True)
        r = _run(["hdiutil", "create", "-volname", f"JARVIS {__version__}", "-srcfolder", str(dmg),
                  "-ov", "-format", "UDZO", str(ziel_dmg)])
        if r.returncode:
            console.print(f"[red]hdiutil:[/] {r.stderr[-400:]}")
            return None
    mb = ziel_dmg.stat().st_size / 1e6
    console.print(f"[green]✓ Installations-DMG:[/] {ziel_dmg} ({mb:.0f} MB)")
    if not repo:
        console.print("[dim]Ohne Veröffentlichung bekommen diese Installationen keine automatischen Updates "
                      "('jarvis veroeffentlichen').[/]")
    return ziel_dmg


# ------------------------------------------------------------------ Veröffentlichen
def veroeffentlichen() -> None:
    if not shutil.which("gh"):
        console.print("[red]GitHub-CLI (gh) fehlt[/] – 'brew install gh' und 'gh auth login'.")
        return
    cfg = _cfg()
    repo = (cfg.get("veroeffentlichen") or {}).get("repo", "")
    if not repo:
        nutzer = _run(["gh", "api", "user", "--jq", ".login"]).stdout.strip()
        if not nutzer:
            console.print("[red]Nicht bei GitHub angemeldet[/] – 'gh auth login'.")
            return
        repo = f"{nutzer}/jarvis"
    klon = LOCAL_DIR / "freundesversion"
    if not (klon / ".git").exists():
        shutil.rmtree(klon, ignore_errors=True)
        if _run(["gh", "repo", "view", repo]).returncode == 0:
            if _run(["gh", "repo", "clone", repo, str(klon)]).returncode:
                console.print(f"[red]Klonen von {repo} fehlgeschlagen.[/]")
                return
        else:
            klon.mkdir(parents=True)
            _run(["git", "-C", str(klon), "init", "-q", "-b", "main"])
    console.print(f"→ Freundesversion vorbereiten ({repo}) …")
    with tempfile.TemporaryDirectory() as tmp:
        code = Path(tmp) / "code"
        exportieren(code, cfg)
        for p in klon.iterdir():                         # alles außer .git und Sperrliste ersetzen
            if p.name not in (".git", "sperrliste.json"):
                shutil.rmtree(p) if p.is_dir() else p.unlink()
        for p in code.iterdir():
            (shutil.copytree if p.is_dir() else shutil.copy2)(p, klon / p.name)
    g = ["git", "-C", str(klon)]
    _run([*g, "add", "-A"])
    neu = _run([*g, "diff", "--cached", "--quiet"]).returncode != 0
    if neu:
        _run([*g, "commit", "-q", "-m", f"JARVIS {__version__} – {time.strftime('%d.%m.%Y')}"])
    if _run([*g, "remote", "get-url", "origin"]).returncode:
        r = _run(["gh", "repo", "create", repo, "--public", "--source", str(klon), "--remote", "origin",
                  "--description", "JARVIS – persönlicher Assistent für macOS", "--push"])
        if r.returncode:
            console.print(f"[red]Repository anlegen fehlgeschlagen:[/] {r.stderr[-300:]}")
            return
        console.print(f"[green]✓ Öffentliches Repository angelegt:[/] https://github.com/{repo}")
    elif neu:
        r = _run([*g, "push", "-q", "-u", "origin", "main"])
        if r.returncode:
            console.print(f"[red]Hochladen fehlgeschlagen:[/] {r.stderr[-300:]}")
            return
    sha = _run([*g, "rev-parse", "HEAD"]).stdout.strip()
    console.print(f"[green]✓ Code veröffentlicht[/] ({sha[:7]}{'' if neu else ', unverändert'})")
    dmg = paket(sha, repo)
    if not dmg:
        return
    tag = f"v{__version__}-{sha[:7]}"
    if _run(["gh", "release", "view", tag, "--repo", repo]).returncode == 0:
        r = _run(["gh", "release", "upload", tag, str(dmg), "--clobber", "--repo", repo])
    else:
        r = _run(["gh", "release", "create", tag, str(dmg), "--repo", repo, "--title", f"JARVIS {__version__}",
                  "--notes", "DMG laden, öffnen, „JARVIS installieren“ per Rechtsklick → Öffnen starten."])
    if r.returncode:
        console.print(f"[red]Release fehlgeschlagen:[/] {r.stderr[-300:]}")
        return
    console.print(f"[green]✓ Download für deine Freunde:[/] https://github.com/{repo}/releases/latest")
    console.print("  Bereits installierte Freundes-Macs übernehmen die neue Version innerhalb weniger Stunden.")
