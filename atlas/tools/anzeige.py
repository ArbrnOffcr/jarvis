"""Visuelle Darstellung im Dashboard: Tabellen, Diagramme, Karten, Quellen.
Das Modell ruft 'anzeige_zeigen' auf; das Dashboard blendet die Ansicht ein."""
from atlas.tools import S, Tool

SINK = None          # wird vom Kern gesetzt: callable(dict) -> an alle Dashboards


def zeigen(titel: str, art: str, spalten: list | None = None, zeilen: list | None = None,
           kategorien: list | None = None, reihen: list | None = None, diagrammtyp: str = "balken",
           einheit: str = "", karten: list | None = None, text: str = "", quellen: list | None = None) -> dict:
    data = {"titel": titel, "art": art, "spalten": spalten or [], "zeilen": (zeilen or [])[:200],
            "kategorien": (kategorien or [])[:60], "reihen": (reihen or [])[:3],
            "diagrammtyp": diagrammtyp, "einheit": einheit, "karten": (karten or [])[:12],
            "text": text[:4000], "quellen": (quellen or [])[:12]}
    if SINK:
        SINK({"type": "ansicht", "daten": data})
        return {"angezeigt": True, "hinweis": "Im Dashboard sichtbar; im Text nur kurz zusammenfassen."}
    return {"angezeigt": False, "hinweis": "Kein Dashboard offen – Inhalt im Text wiedergeben."}


def tools(cfg, secrets) -> list[Tool]:
    return [Tool(
        "anzeige_zeigen",
        "Ergebnisse im Dashboard visuell anzeigen – für Vergleiche, Zahlenreihen, Übersichten und "
        "Rechercheergebnisse. art='tabelle' (spalten+zeilen), 'diagramm' (kategorien + reihen mit "
        "werten; max. 3 Reihen; diagrammtyp 'balken' oder 'linie'), 'karten' (karten mit titel/text/link) "
        "oder 'text'. Quellen als [{titel,url}] mitgeben.",
        "anzeige", zeigen,
        {"titel": S("Überschrift"), "art": {"type": "string", "enum": ["tabelle", "diagramm", "karten", "text"]},
         "spalten": {"type": "array", "items": {"type": "string"}},
         "zeilen": {"type": "array", "items": {"type": "array", "items": {}}},
         "kategorien": {"type": "array", "items": {"type": "string"}, "description": "x-Achse"},
         "reihen": {"type": "array", "items": {"type": "object", "properties": {
             "name": {"type": "string"}, "werte": {"type": "array", "items": {"type": "number"}}}}},
         "diagrammtyp": {"type": "string", "enum": ["balken", "linie"]},
         "einheit": S("Einheit der Werte, z. B. '€' oder '%'"),
         "karten": {"type": "array", "items": {"type": "object", "properties": {
             "titel": {"type": "string"}, "text": {"type": "string"}, "link": {"type": "string"}}}},
         "text": S("Freitext (Markdown)"),
         "quellen": {"type": "array", "items": {"type": "object", "properties": {
             "titel": {"type": "string"}, "url": {"type": "string"}}}}},
        ["titel", "art"])]
