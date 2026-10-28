"""Konfiguration: Standardwerte im Code, persönliche Anpassungen in
iCloud/ATLAS-Privat/config.yaml (wird automatisch angelegt)."""
import copy

import yaml

from atlas.paths import private_dir

DEFAULTS: dict = {
    "assistant_name": "JARVIS",
    "name": "",                  # wie JARVIS dich nennt (leer = Vorname aus dem Mac-Benutzerkonto)
    "anrede": "Sir",             # Gruß beim Öffnen: „Guten Morgen, Sir.“ (leer = ohne)
    "persona": {"zusatz": ""},   # eigene Zusatzregeln für JARVIS (eine Zeile oder mehrere)
    "archive_path": "",          # leer = Ordner „DATENARCHIV“ in iCloud Drive automatisch erkennen
    "shared_subdir": "JARVIS",   # gemeinsamer Bereich im Archiv (Gedächtnis, Signale)
    "claude": {"default": "sonnet", "max_tokens": 4096},
    # Kosten in US-Dollar je 1 Mio. Tokens (Eingabe, Ausgabe) – Stand Okt. 2026,
    # bei Preisänderungen in der persönlichen config.yaml anpassen.
    "preise": {"opus": [4.0, 20.0], "sonnet": [2.0, 10.0], "haiku": [0.10, 0.50]},
    "budget_monat": 50,          # Kostenbremse: danach Rückfrage vor Claude
    "local": {
        "url": "http://127.0.0.1:11434",
        "model": "qwen3.5:9b",
        "fallback_models": ["qwen3:8b", "llama3.1:8b"],
        "max_tokens": 2048,
        "think": False,
        "num_ctx": 8192,          # genug Platz für Werkzeuge + Verlauf (Standard wäre 4096)
        "keep_alive": "30m",      # Modell im Speicher halten – kein Kaltstart
    },
    "archiv": {
        "embed_model": "bge-m3",     # mehrsprachig, gut für Deutsch
        "ausschluss": [],
        "max_mb": 100,
        "ocr": True,
        "intervall_min": 15,
    },
    "briefing": {"aktiv": True, "zeit": "06:30"},     # frühestens ab dieser Uhrzeit
    "hinweise": {"aktiv": True, "fristen_tage": 3, "erinnerung_minuten": 60,
                 "mail": True, "intervall_min": 15},
    "wetter": {"ort": "Berlin", "lat": 52.52, "lon": 13.40},
    "office": {"ausgabe": "JARVIS-Ausgaben"},
    "update": {"auto": True, "intervall_min": 15},
    # Updates ohne git (weitergegebene Installationen): öffentliches GitHub-Repository „besitzer/name“
    "release": {"repo": ""},
    "nachrichten": {"aktiv": True, "vorlesen_extern": True},    # iMessage mit ElevenLabs vorlesen; False = Mac-Stimme
    "werbung": {"aktiv": True, "probelauf_tage": 7, "intervall_min": 15},
    # Workflow Arztrechnungen → Beihilfe → PKV (Pfade relativ zum DATENARCHIV)
    "beihilfe": {
        "aktiv": False,                      # Assistent oder config.yaml schaltet ihn ein
        "eingang": "",                       # leer = Genius-Scan-Ordner in iCloud automatisch finden
        "rechnungsarchiv": "Beihilfe-PKV/Rechnungen",
        "beihilfe_archiv": "Beihilfe-PKV/Beihilfebescheide",
        "pkv_archiv": "Beihilfe-PKV/PKV-Abrechnungen",
        "excel": "",                         # Excel-Übersicht (relativ zum Archiv)
        "blatt": "Beihilfe-PKV",
        "kinder": {},                        # {"KÜRZEL": {"name": "Vorname Nachname", "tabelle": "Vorname"}}
        "liste": "Beihilfe & PKV",           # Liste in der Erinnerungen-App
        "antrag_uhrzeit": "18:00",
        "zahlung_tage_vorher": 2,
        "intervall_min": 3,
    },  # neue Versionen automatisch von GitHub holen      # Ordner im DATENARCHIV für neue Dokumente
    # Posteingang: jeder Scan ohne Rechnung/Bescheid ist ein Brief; Ablage nach Bestätigung,
    # bekannte Absender nach 3 Bestätigungen und frühestens 30 Tagen automatisch
    "post": {"aktiv": True, "auto_ab_bestaetigungen": 3, "auto_nach_tagen": 30},
    "fristen": {"liste": "Fristen"},
    "einkauf": {"liste": "Einkäufe"},                # Einkaufsliste in der Erinnerungen-App                 # Liste in der Erinnerungen-App
    "aufnahme": {"liste": "Aus Gesprächen"},         # Aufgaben aus Gesprächen
    "wochenplan": {"aktiv": True, "wochentag": 6, "zeit": "19:00"},   # Sonntag 19 Uhr
    "vergessen": {"aktiv": True, "wochentag": 4, "zeit": "16:00"},    # Freitag 16 Uhr: Was habe ich vergessen?
    "recherche": {"aktiv": True, "max_suchen": 5, "werkzeug": "web_search_20250305"},
    "kalender": {
        "standard": "",          # Kalender für neue Termine, z. B. "Familie"
        "abos": [],              # [{"name": "Feiertage", "url": "webcal://..."}]
    },
    "router": {
        # Wörter, die nie an die Cloud gehen dürfen (Zugangsdaten)
        "forbidden_keywords": ["passwort", "kennwort", "pin", "tan", "puk",
                               "zugangsdaten", "iban", "kreditkartennummer"],
        # Sensibel: bleibt lokal, Cloud nur nach Rückfrage
        "sensitive_keywords": ["steuer", "finanzamt", "konto", "gehalt",
                               "besoldung", "kredit", "darlehen", "schulden",
                               "versicherung", "arzt", "diagnose", "krank",
                               "gesundheit", "medikament", "befund",
                               "ausweis", "geburtsdatum", "sozialversicherung",
                               "rente", "vermögen", "miete", "mieter"],
        # Komplex: geht an Claude
        "complex_keywords": ["internet", "online", "aktuelle", "schlagzeilen", "news",
                             "suche im", "google", "webseite", "preis",
                             "analysier", "entwirf", "entwurf", "schreib",
                             "brief", "formulier", "recherch", "vergleich",
                             "konzept", "strategie", "präsentation",
                             "powerpoint", "excel", "word", "tabelle",
                             "übersetz", "bewert", "ausführlich", "plan"],
        "complex_min_chars": 400,
        # Werkzeug-Aufgaben (Kalender, Mail ...): Claude Haiku ist schnell,
        # günstig und zuverlässig im Umgang mit Werkzeugen.
        "tool_keywords": ["termin", "kalender", "erinner", "aufgabe", "todo", "tesla", "ford", "tourneo", "akku", "reichweite", "lade",
                          "klimaanlage", "vorklimat",
                          "einkauf", "notiz", "mail", "e-mail", "posteingang",
                          "kontakt", "telefonnummer", "adresse", "geburtstag",
                          "woche", "morgen", "heute", "übermorgen",
                          "archiv", "dokument", "datei", "ordner", "unterlagen",
                          "pdf", "scan", "merk", "vorgang", "vorgänge", "frist",
                          "wetter", "regen", "geburtstag", "tageslage",
                          "word", "excel", "powerpoint", "präsentation", "tabelle",
                          "öffne", "dokument", "bild", "foto", "zeig mir", "wie sieht",
                          "video", "clip", "film", "youtube", "ton an", "nachricht", "imessage", "sms", "erklär", "wie funktioniert", "skizze", "veranschaulich",
                          "brief", "post", "ablegen", "ablage", "vergessen", "liegengeblieben", "vertr", "abo", "haushaltsbuch",
                          "antworte", "entwurf", "anhang", "anhäng", "verschick", "versende", "schick", "visitenkarte", "wochenplan", "nächste woche", "beleg", "sammelmappe",
                          "ablauf", "läuft ab", "kündig", "tüv", "aufgaben",
                          "karte", "route", "navig", "wie komme", "wo ist", "wo liegt", "timer", "wecker", "weck mich",
                          "spiel", "musik", "song", "lied", "podcast", "lauter", "leiser", "was läuft", "abspielen",
                          "imessage", "kontakt"],
        "tool_model": "haiku",
        # Alltägliche, nicht sensible Gespräche: "haiku" (schnell) oder "lokal" (privat, langsamer)
        "einfach": "haiku",
    },
    "permissions": {},           # Abweichungen von atlas/permissions.py
}

SAMPLE = """# JARVIS – persönliche Einstellungen (überschreiben die Standardwerte)
# Beispiele – zum Aktivieren das '#' entfernen:
#
# claude:
#   default: sonnet          # opus | sonnet | haiku
# local:
#   model: qwen3.5:9b
# router:
#   complex_min_chars: 400
# archiv:
#   ausschluss:                  # Ordner, die JARVIS nicht indexieren soll
#     - Privat/Tagebuch
# briefing:
#   zeit: "06:30"               # Uhrzeit immer in Anführungszeichen
# hinweise:
#   mail: true                   # wichtige neue Mails melden (Einschätzung lokal)
# kalender:
#   standard: Familie
#   abos:
#     - name: Feiertage Sachsen
#       url: webcal://...   (Kalender-App → Rechtsklick auf Abo → Informationen → URL)
"""


def _merge(base: dict, extra: dict) -> dict:
    for k, v in (extra or {}).items():
        if isinstance(v, dict) and isinstance(base.get(k), dict):
            _merge(base[k], v)
        else:
            base[k] = v
    return base


def load_config() -> dict:
    """Persönliche Einstellungen aus iCloud; ist iCloud gerade nicht lesbar,
    gilt die zuletzt erfolgreich gelesene lokale Kopie."""
    from atlas.paths import LOCAL_DIR
    cfg = copy.deepcopy(DEFAULTS)
    cache = LOCAL_DIR / "config_cache.yaml"
    path = private_dir() / "config.yaml"
    text = None
    for _ in range(3):
        try:
            if not path.exists():
                path.write_text(SAMPLE, encoding="utf-8")
            text = path.read_text(encoding="utf-8")
            break
        except OSError:
            import time
            time.sleep(1)
    if text is None:
        try:
            text = cache.read_text(encoding="utf-8")
        except OSError:
            text = ""
    LOCAL_DIR.mkdir(parents=True, exist_ok=True)
    try:
        user = yaml.safe_load(text) or {}
    except yaml.YAMLError as e:
        # Tippfehler in config.yaml dürfen JARVIS nicht lahmlegen: letzte gültige Kopie nehmen
        cfg["_config_fehler"] = str(e).replace("\n", " ")[:300]
        try:
            user = yaml.safe_load(cache.read_text(encoding="utf-8")) or {}
        except (OSError, yaml.YAMLError):
            user = {}
        return _merge(cfg, user if isinstance(user, dict) else {})
    if not isinstance(user, dict):
        user = {}
    else:
        try:                                       # nur gültige Fassungen als Kopie merken
            cache.write_text(text, encoding="utf-8")
        except OSError:
            pass
    _merge(cfg, user)
    return cfg
