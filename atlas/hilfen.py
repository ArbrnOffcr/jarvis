"""Gemeinsame Hilfen für die Arbeitsabläufe: Terminraster für Erinnerungen, lokales Modell mit
JSON-Antwort, Erkennung sensibler Inhalte und Ordnerliste des DATENARCHIVS."""
import json
import re
import threading
from datetime import date, datetime, timedelta
from pathlib import Path

from atlas.paths import read_private_json, write_private_json

RASTER = "termin_raster.json"
_raster_lock = threading.Lock()


def termin(t: datetime) -> datetime:
    """Nächste freie volle Stunde ab t – über alle Abläufe hinweg (Beihilfe, Post, Fristen,
    Gesprächsaufgaben). So liegen Erinnerungen nie zur selben Stunde und bleiben im Kalender
    getrennt sichtbar."""
    with _raster_lock:
        z = read_private_json(RASTER, {"belegt": []})
        heute = date.today().isoformat()
        belegt = [x for x in z.get("belegt", []) if x[:10] >= heute]
        t = t.replace(minute=0, second=0, microsecond=0) + (timedelta(hours=1) if t.minute else timedelta())
        while t.strftime("%Y-%m-%dT%H") in belegt:
            t += timedelta(hours=1)
        belegt.append(t.strftime("%Y-%m-%dT%H"))
        write_private_json(RASTER, {"belegt": belegt})
        return t


def morgens(d: date, stunde: int = 9) -> datetime:
    """Erinnerung an einem Tag um 9 Uhr; liegt das in der Vergangenheit, in einer Stunde."""
    t = datetime.combine(d, datetime.min.time()).replace(hour=stunde)
    return t if t > datetime.now() else datetime.now() + timedelta(hours=1)


def lokal_json(lokal, system: str, prompt: str, max_tokens: int = 600) -> dict | None:
    """Das lokale Modell antwortet mit JSON (Inhalte verlassen den Mac nicht)."""
    if not lokal or not lokal.available():
        return None
    try:
        model = lokal.resolve_model()
        out = "".join(e[1] for e in lokal.step(model, system, [{"role": "user", "content": prompt}],
                                                [], max_tokens) if e[0] == "text")
        m = re.search(r"\{.*\}", out, re.S)
        return json.loads(m.group(0)) if m else None
    except Exception:
        return None


# ------------------------------------------------------------------ sensible Inhalte
IBAN_RE = re.compile(r"\b[A-Z]{2}\d{2}(?:\s?[A-Z0-9]{4}){3,7}(?:\s?[A-Z0-9]{1,3})?\b")
SENSIBEL = [
    ("Gesundheitsdaten", r"\b(diagnose|befund|icd[- ]?10|arztbrief|krankenhaus|klinik|therapie|medikament|"
                         r"rezept|arbeitsunfähig|au-bescheinigung|patient)\w*"),
    ("Steuer-ID/Steuernummer", r"(steuer-?id|identifikationsnummer|steuernummer)"),
    ("Ausweisdaten", r"(personalausweis|reisepass|ausweisnummer|passnummer)"),
    ("Einkommen/Bezüge", r"\b(gehalt|besoldung|bezüge|lohnsteuer|nettobezug|bruttobezug)\w*"),
    ("Kontodaten", r"\b(kontostand|kontoauszug|saldo|kreditkarte)\w*"),
    ("Zugangsdaten", r"\b(passwort|kennwort|pin|tan|puk)\b"),
]


def sensibel_gruende(text: str) -> list[str]:
    t = text.lower()
    out = [name for name, rx in SENSIBEL if re.search(rx, t)]
    if IBAN_RE.search(text or ""):
        out.insert(0, "Bankverbindung (IBAN)")
    return out


def maskieren(text: str) -> str:
    """Für die Cloud: Kontonummern und Steuer-IDs unkenntlich machen (die Aussage bleibt verständlich)."""
    text = IBAN_RE.sub(lambda m: m.group(0)[:4] + " **** **** " + re.sub(r"\s", "", m.group(0))[-4:], text)
    text = re.sub(r"(?i)((?:steuer-?id|identifikationsnummer)\D{0,20})(\d[\d ]{9,13}\d)",
                  lambda m: m.group(1) + "*** *** ***", text)
    return text


# ------------------------------------------------------------------ DATENARCHIV-Ordner
AUSGESCHLOSSEN: tuple = ()      # beim Start aus config.yaml (archiv.ausschluss + archiv.ablage_ausschluss)


def ordnerliste(archiv: Path, tiefe: int = 3) -> list[str]:
    """Ordner des DATENARCHIVS (relativ) als Ablageziele – ohne dienstliche Unterordner."""
    out = []
    if not archiv or not archiv.exists():
        return out

    def lauf(p: Path, rel: str, t: int):
        try:
            kinder = sorted(x for x in p.iterdir() if x.is_dir() and not x.name.startswith("."))
        except OSError:
            return
        for k in kinder:
            r = f"{rel}/{k.name}" if rel else k.name
            if any(r.startswith(a) for a in AUSGESCHLOSSEN):
                continue
            out.append(r)
            if t > 1:
                lauf(k, r, t - 1)
    lauf(archiv, "", tiefe)
    return out


def dateiname(text: str, max_len: int = 70) -> str:
    """Sicherer Dateiname (kein / : und keine Steuerzeichen)."""
    s = re.sub(r"[/\\:*?\"<>|\x00-\x1f]+", " ", text or "").strip()
    s = re.sub(r"\s{2,}", " ", s)
    return s[:max_len].rstrip(" .-") or "Dokument"


def frei(ziel: Path) -> Path:
    """Nicht überschreiben: bei Namensgleichheit ' 2', ' 3' … anhängen."""
    if not ziel.exists():
        return ziel
    n = 2
    while (ziel.parent / f"{ziel.stem} {n}{ziel.suffix}").exists():
        n += 1
    return ziel.parent / f"{ziel.stem} {n}{ziel.suffix}"


# ------------------------------------------------------------------ VS-Kennzeichnungen
VS_MARKE = re.compile(
    r"VS\s*[-–]?\s*NUR\s+F(?:Ü|UE|U)R\s+DEN\s+DIENSTGEBRAUCH|\bVS[-\s]?NfD\b|VS\s*[-–]\s*VERTRAULICH|"
    r"\bSTRENG\s+GEHEIM\b|(?<![A-Za-zÄÖÜäöü])GEHEIM(?![A-Za-zÄÖÜäöü])|\bNATO\s+(?:RESTRICTED|CONFIDENTIAL|SECRET)\b|"
    r"\bCOSMIC\s+TOP\s+SECRET\b")


def vs_kennzeichnung(text: str) -> str:
    """Eingestufte Inhalte erkennen (Kennzeichnung in Großbuchstaben bzw. als VS-NfD). Rückgabe: Treffer oder ''."""
    m = VS_MARKE.search(text or "")
    return m.group(0) if m else ""


def vs_schutz(werkzeug: str, ausgabe: str) -> str:
    """Werkzeugergebnis mit VS-Kennzeichnung nicht an das Modell geben."""
    t = vs_kennzeichnung(ausgabe)
    if not t:
        return ausgabe
    return (f"[Zurückgehalten: Das Ergebnis von '{werkzeug}' enthält die Kennzeichnung „{t}“. Eingestufte Inhalte "
            "verarbeitet JARVIS nicht. Dem Nutzer nur sagen, dass ein Eintrag als Verschlusssache gekennzeichnet "
            "ist und deshalb nicht ausgewertet wird.]")
