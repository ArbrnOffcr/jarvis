"""Gemeinsames für alle Fahrzeuge (Tesla, Ford …): TÜV/HU und Kfz-Versicherung als Fristen mit Erinnerung.

Jeder Eintrag trägt in der Notiz die Kennung „Fahrzeug: <VIN oder Kurzname>“ – so gehören die Fristen eindeutig zu
einem Fahrzeug, erscheinen aber trotzdem ganz normal im Briefing, im Lagevortrag und in der Zeitleiste."""
import calendar
from datetime import date, timedelta

from atlas.tools import ToolError


def termine(core, kennung: str) -> list[dict]:
    fr = getattr(core, "fristen", None)
    if not fr:
        return []
    marke = f"Fahrzeug: {kennung}"
    heute, out = date.today(), []
    for f in fr.zustand()["liste"]:
        if f.get("erledigt") or marke not in (f.get("notiz") or ""):
            continue
        d = date.fromisoformat(f["datum"])
        extra = {}
        for teil in (f.get("notiz") or "").split(" · "):
            if teil.startswith("Versicherer: "):
                extra["versicherer"] = teil[13:]
        out.append({"id": f["id"], "art": f["art"], "titel": f["titel"], "datum": f["datum"], "tage": (d - heute).days,
                    "rolle": "kuendigung" if "kündbar" in f["titel"] else "hu" if f["art"] == "TÜV" else "versicherung",
                    **extra})
    return sorted(out, key=lambda x: x["datum"])


def termine_setzen(core, kennung: str, name: str, tuev: str = "", versicherung: str = "", versicherer: str = "") -> dict:
    """TÜV (MM/JJJJ bzw. JJJJ-MM) und Hauptfälligkeit der Versicherung setzen; ersetzt die bisherigen Einträge.
    Zur Versicherung kommt die Kündigungsfrist dazu (Eingang einen Monat vor Hauptfälligkeit)."""
    from atlas.workflows.fristen import _datum
    fr = getattr(core, "fristen", None)
    if not fr:
        raise ToolError("Fristen-Verwaltung nicht verfügbar")
    marke = f"Fahrzeug: {kennung}"
    erg = {}

    def ersetzen(rollen):
        for t in termine(core, kennung):
            if t["rolle"] in rollen:
                fr.erledigt(t["id"])
    tuev, versicherung = (tuev or "").strip(), (versicherung or "").strip()
    if tuev:
        d = _datum(f"{tuev[5:]}/{tuev[:4]}") if len(tuev) == 7 and tuev[4] == "-" else _datum(tuev)
        if not d:
            raise ToolError("TÜV bitte als Monat/Jahr angeben, z. B. 03/2029")
        ersetzen({"hu"})
        erg["tuev"] = fr.eintragen(f"TÜV/HU {name}", d.isoformat(), "TÜV", marke, quelle="fahrzeug")["datum"]
    if versicherung:
        d = _datum(versicherung)
        if not d:
            raise ToolError("Hauptfälligkeit bitte als Datum angeben, z. B. 01.01.2027")
        ersetzen({"versicherung", "kuendigung"})
        notiz = marke + (f" · Versicherer: {versicherer.strip()[:60]}" if (versicherer or "").strip() else "")
        erg["versicherung"] = fr.eintragen(f"Kfz-Versicherung {name} – Hauptfälligkeit", d.isoformat(), "Versicherung",
                                           notiz, quelle="fahrzeug")["datum"]
        j, m = (d.year, d.month - 1) if d.month > 1 else (d.year - 1, 12)
        kuend = date(j, m, min(d.day, calendar.monthrange(j, m)[1])) - timedelta(days=1)
        if kuend >= date.today():
            erg["kuendbar_bis"] = fr.eintragen(f"Kfz-Versicherung {name} kündbar bis", kuend.isoformat(), "Versicherung",
                                               notiz, quelle="fahrzeug")["datum"]
    return {"ok": True, **erg, "termine": termine(core, kennung)}


# ------------------------------------------------------------ Eigenes Fahrzeugfoto (für jedes Fahrzeug)
def eigenes_bild(ordner):
    for n in ("eigenes_bild.png", "eigenes_bild.jpg"):
        if (ordner / n).exists():
            return ordner / n
    return None


def bild_hochladen(ordner, daten: bytes, name: str = "") -> dict:
    """Foto übernehmen; Hintergrund wird (macOS 14+) automatisch entfernt, sonst bleibt das Foto unverändert."""
    import shutil
    import subprocess
    from pathlib import Path
    if len(daten) < 2000 or len(daten) > 25_000_000:
        raise ToolError("Bitte ein Foto (JPG, PNG oder HEIC) bis 25 MB")
    endung = (Path(name).suffix.lower() or ".jpg") if name else ".jpg"
    if endung not in (".jpg", ".jpeg", ".png", ".heic", ".heif", ".webp"):
        endung = ".jpg"
    ordner.mkdir(parents=True, exist_ok=True)
    roh = ordner / f"eigenes_original{endung}"
    roh.write_bytes(daten)
    for alt in ("eigenes_bild.png", "eigenes_bild.jpg"):
        (ordner / alt).unlink(missing_ok=True)
    frei = freistellen(roh, ordner / "eigenes_bild.png")
    if not frei:
        ziel = ordner / ("eigenes_bild.png" if endung == ".png" else "eigenes_bild.jpg")
        if endung in (".heic", ".heif", ".webp"):
            subprocess.run(["sips", "-s", "format", "jpeg", str(roh), "--out", str(ziel)], capture_output=True)
        else:
            shutil.copyfile(roh, ziel)
    return {"ok": True, "freigestellt": frei,
            "text": "✓ Bild übernommen" + (" und freigestellt" if frei else " (Hintergrund bleibt – freistellen braucht macOS 14)")}


def bild_entfernen(ordner) -> dict:
    for n in ("eigenes_bild.png", "eigenes_bild.jpg"):
        (ordner / n).unlink(missing_ok=True)
    return {"ok": True}


def freistellen(ein, aus) -> bool:
    import subprocess
    from atlas.paths import LOCAL_DIR, REPO_DIR
    werkzeug = LOCAL_DIR / "bin" / "freistellen"
    quelle = REPO_DIR / "app" / "freistellen.swift"
    if not werkzeug.exists() or (quelle.exists() and quelle.stat().st_mtime > werkzeug.stat().st_mtime):
        werkzeug.parent.mkdir(parents=True, exist_ok=True)
        try:
            r = subprocess.run(["swiftc", "-O", str(quelle), "-o", str(werkzeug)], capture_output=True, timeout=300)
        except (OSError, subprocess.SubprocessError):
            return False
        if r.returncode:
            return False
    try:
        r = subprocess.run([str(werkzeug), str(ein), str(aus)], capture_output=True, timeout=120)
    except (OSError, subprocess.SubprocessError):
        return False
    return r.returncode == 0 and aus.exists() and aus.stat().st_size > 2000
