"""Werkzeuge nach Bedarf: Statt aller ~75 Werkzeugbeschreibungen (rund 11.000 Tokens) bekommt das
Modell nur die Gruppen, die zur Frage passen. Das senkt die Zeit bis zum ersten Wort deutlich –
besonders im Gespräch. Fehlt ein Werkzeug doch, lädt das Modell mit 'werkzeuge_laden' alle nach
(kostet einen Zwischenschritt, kommt selten vor)."""
import re

from atlas.tools import Tool

LADEN = "werkzeuge_laden"

# Gruppe → Namensanfänge der Werkzeuge
GRUPPEN = {
    "kalender": ["kalender_", "wochenplan", "geburtstage"],
    "erinnerungen": ["erinnerung"],
    "einkauf": ["einkauf"],
    "faehigkeiten": ["faehigkeiten", "einfuehrung"],
    "notizen": ["notiz"],
    "kontakte": ["kontakt", "geburtstage"],
    "mail": ["mail_", "schreibstil", "kontakte_suchen"],
    "wetter": ["wetter"],
    "anzeige": ["anzeige_", "bild_", "video_", "youtube_", "skizze_"],
    "archiv": ["archiv_", "datei_", "dokument_", "word_", "excel_", "pptx_", "post_", "steuer_"],
    "gedaechtnis": ["gedaechtnis_", "vorgang", "vorgaenge"],
    "fristen": ["frist", "vertra", "was_vergessen"],
    "beihilfe": ["beihilfe_"],
    "nachrichten": ["nachricht"],
    "werbung": ["werbefilter"],
    "karte": ["karte_", "route_", "wo_ist"],
    "timer": ["timer_", "wecker_"],
    "musik": ["musik_", "podcast_"],
}

# Wortanfänge → Gruppen
SIGNALE = [
    (r"termin|kalender|woche|übermorgen|morgen|heute|montag|dienstag|mittwoch|donnerstag|freitag|samstag|sonntag|"
     r"wochenende|uhr\b|frei\b|zeit für|verschieb|absag", ["kalender", "erinnerungen"]),
    (r"tageslage|briefing|was steht an|was liegt an|überblick|was gibt.?s", ["kalender", "erinnerungen", "wetter", "fristen", "mail"]),
    (r"erinner|aufgabe|todo|to-do|erledig", ["erinnerungen"]),
    (r"einkauf|kaufen|gekauft|besorg|supermarkt|edeka|rewe|lidl|aldi|kaufland|drogerie|dm\b|vorrat|ist alle|aufgebraucht|"
     r"liste", ["einkauf"]),
    (r"notiz", ["notizen"]),
    (r"kontakt|telefonnummer|nummer von|adresse|visitenkarte|geburtstag|anruf", ["kontakte"]),
    (r"mail|posteingang|antworte|entwurf|anhang|anhäng|verschick|versende|schick", ["mail", "kontakte"]),
    (r"anhang|anhäng|verschick|versende", ["archiv"]),
    (r"wetter|regen|temperatur|grad\b|schnee|gewitter|jacke|schirm|sonnig", ["wetter"]),
    (r"zeig|bild|foto|video|clip|film|youtube|erklär|wie funktioniert|skizze|veranschaulich|diagramm|"
     r"tabelle|grafik|ton an|ton aus|lauter|leiser|stumm|pausier|weiter abspielen", ["anzeige"]),
    (r"zeig|öffne|archiv|dokument|datei|ordner|unterlagen|pdf|scan|word|excel|powerpoint|präsentation|"
     r"brief|post\b|ablag|ableg|beleg|sammelmappe|steuer|mietvertrag|vertrag|rechnung|bescheid|ausdruck", ["archiv"]),
    (r"merk|vorgang|vorgänge|vergiss|weißt du noch|erinnerst du|gedächtnis", ["gedaechtnis"]),
    (r"frist|ablauf|läuft ab|kündig|tüv|vertr|abo\b|abos\b|haushaltsbuch|vergessen|liegengeblieben|versicherung", ["fristen"]),
    (r"beihilfe|pkv|arztrechnung|universa|erstattung", ["beihilfe"]),
    (r"nachricht|imessage|sms|geschrieben", ["nachrichten"]),
    (r"werbung|werbefilter|spam", ["werbung"]),
    (r"karte|route|wie komme|navig|wie weit|entfernung|wo liegt|wo ist|wo sind|wo befindet|zeig mir (wo|den weg)|"
     r"fahr(e|t|en)? (ich )?nach|weg nach|weg zu|in der nähe|standort|airtag|wo steckt", ["karte"]),
    (r"timer|wecker|weck mich|stoppuhr|countdown|in \d+ (sekunden|minuten|stunden)|klingel", ["timer"]),
    (r"musik|spiel|song|lied|album|playlist|podcast|folge|hörbuch|pause|weiter|nächste[sn]? (lied|titel|song)|lauter|"
     r"leiser|was läuft|interpret|künstler|band\b|hören|abspielen|mach (die )?musik", ["musik"]),
    (r"schreib|schick|sag \w+,? dass|imessage", ["nachrichten"]),
    (r"was kannst du|kannst du|funktion|fähigkeit|features?\b|unterstützt du|geht das|einführung|tutorial|"
     r"anleitung|zeig mir wie|wie benutze|wie bediene", ["faehigkeiten"]),
]


def gruppen_fuer(text: str) -> set[str]:
    t = (text or "").lower()
    g: set[str] = set()
    for muster, ziele in SIGNALE:
        if re.search(rf"\b(?:{muster})", t):
            g.update(ziele)
    return g


def gruppe_von(name: str) -> str | None:
    for g, anfaenge in GRUPPEN.items():
        if any(name.startswith(a) for a in anfaenge):
            return g
    return None


def lade_werkzeug() -> Tool:
    return Tool(LADEN,
                "Lädt ALLE Werkzeuge (Kalender, Erinnerungen, Mail, Kontakte, Archiv, Anzeige, Fristen, Beihilfe …). "
                "Nur aufrufen, wenn du für die Anfrage ein Werkzeug brauchst, das dir gerade nicht zur Verfügung steht.",
                "chat.cloud", lambda: {"ok": True})


def auswahl(alle: dict[str, Tool], gruppen: set[str]) -> list[Tool]:
    """Werkzeuge der Gruppen (Reihenfolge bleibt stabil – wichtig für den Prompt-Cache) plus 'werkzeuge_laden'."""
    out = [t for t in alle.values() if gruppe_von(t.name) in gruppen]
    return out + [lade_werkzeug()]


def hinweis(gruppen: set[str]) -> str:
    welche = ", ".join(sorted(gruppen)) if gruppen else "keine"
    return (f"\n\nGerade geladene Werkzeuggruppen: {welche}. Brauchst du ein anderes Werkzeug (z. B. Kalender, "
            f"Mail, Archiv, Anzeige), rufe zuerst '{LADEN}' auf – ohne Vorrede – und mach dann normal weiter. "
            "Für reine Gesprächsfragen brauchst du keine Werkzeuge.")
