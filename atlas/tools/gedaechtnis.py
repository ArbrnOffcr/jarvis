"""Werkzeuge für das Gedächtnis und laufende Vorgänge."""
from atlas.memory import GEMEINSAM_THEMEN, PRIVAT_THEMEN
from atlas.tools import S, Tool

BEREICH = {"type": "string", "enum": ["privat", "gemeinsam"],
           "description": "privat = nur dieser Nutzer; gemeinsam = Familie/Haushalt (beide sehen es)"}


def tools(cfg, secrets, memory) -> list[Tool]:
    m = memory
    return [
        Tool("gedaechtnis_merken",
             f"Dauerhaften Fakt merken, wenn der Nutzer etwas Wichtiges über sich, Familie, "
             f"Haushalt, Fahrzeuge oder Vorlieben sagt oder darum bittet. Themen z. B. privat: "
             f"{PRIVAT_THEMEN}; gemeinsam: {GEMEINSAM_THEMEN}. Keine Passwörter/PINs/Kontonummern.",
             "gedaechtnis.schreiben", m.merken,
             {"bereich": BEREICH, "thema": S("Thema (Dateiname)"), "fakt": S("Kurzer Fakt")},
             ["bereich", "thema", "fakt"], label=lambda a: f"Gemerkt ({a['bereich']}): {a['fakt']}"),
        Tool("gedaechtnis_vergessen", "Fakt aus dem Gedächtnis entfernen.", "gedaechtnis.schreiben",
             m.vergessen, {"bereich": BEREICH, "thema": S("Thema"), "text": S("Textstück der Zeile")},
             ["bereich", "thema", "text"], label=lambda a: f"Vergessen: {a['text']}"),
        Tool("gedaechtnis_lesen", "Gemerkte Fakten lesen (optional nach Bereich/Thema).",
             "gedaechtnis.lesen", m.lesen, {"bereich": BEREICH, "thema": S("Thema, optional")}),
        Tool("vorgang_aktualisieren",
             "Laufenden Vorgang anlegen oder fortschreiben (z. B. Steuer-Rückfrage, Antrag, Kauf): "
             "Status, Frist, nächster Schritt, Verlaufsnotiz.",
             "gedaechtnis.schreiben", m.vorgang,
             {"titel": S("Name des Vorgangs"), "status": S("Status, optional"),
              "frist": S("Frist TT.MM.JJJJ, optional"), "naechster_schritt": S("optional"),
              "notiz": S("Verlaufseintrag, optional"),
              "abgeschlossen": {"type": "boolean", "description": "Vorgang abschließen"}},
             ["titel"], label=lambda a: f"Vorgang „{a['titel']}“ aktualisiert"),
        Tool("vorgaenge_liste", "Offene (optional auch abgeschlossene) Vorgänge mit Status und Frist.",
             "gedaechtnis.lesen", m.vorgaenge_liste,
             {"auch_abgeschlossene": {"type": "boolean"}}),
        Tool("vorgang_lesen", "Einen Vorgang vollständig mit Verlauf lesen.", "gedaechtnis.lesen",
             m.vorgang_lesen, {"titel": S("Name des Vorgangs")}, ["titel"]),
    ]
