"""Prinzipskizzen: Das Modell beschreibt Elemente, Verbindungen und Schritte;
das Fenster zeichnet die Skizze Schritt für Schritt live, passend zur Erklärung."""
from atlas.tools import S, Tool, ToolError, anzeige

FORMEN = ["box", "kreis", "raute", "zylinder", "wolke", "text"]
ARTEN = ["pfeil", "doppelpfeil", "linie", "gestrichelt"]


def _zahl(v, lo=0.0, hi=100.0):
    try:
        return max(lo, min(hi, float(v)))
    except (TypeError, ValueError):
        return None


def zeichnen(titel: str, elemente: list, verbindungen: list | None = None,
             schritte: list | None = None, bereiche: list | None = None) -> dict:
    if not elemente:
        raise ToolError("Mindestens ein Element nötig")
    els, ids = [], set()
    for i, e in enumerate(elemente[:16]):
        eid = str(e.get("id") or f"e{i}")[:24]
        if eid in ids:
            continue
        ids.add(eid)
        els.append({"id": eid, "text": str(e.get("text", ""))[:60], "notiz": str(e.get("notiz", ""))[:80],
                    "form": e.get("form") if e.get("form") in FORMEN else "box",
                    "x": _zahl(e.get("x")), "y": _zahl(e.get("y")), "betont": bool(e.get("betont"))})
    vbs = [{"von": str(v.get("von")), "nach": str(v.get("nach")), "text": str(v.get("text", ""))[:40],
            "art": v.get("art") if v.get("art") in ARTEN else "pfeil"}
           for v in (verbindungen or [])[:24] if str(v.get("von")) in ids and str(v.get("nach")) in ids]
    stp = [[x for x in (s if isinstance(s, list) else [s]) if isinstance(x, str)] for s in (schritte or [])][:12]
    ber = [{"text": str(b.get("text", ""))[:40], "ids": [x for x in b.get("ids", []) if x in ids]}
           for b in (bereiche or [])[:4] if isinstance(b, dict)]
    daten = {"titel": titel[:80], "elemente": els, "verbindungen": vbs, "schritte": stp, "bereiche": ber}
    if anzeige.SINK:
        anzeige.SINK({"type": "skizze", "daten": daten})
        return {"angezeigt": True, "schritte": len(stp) or len(els),
                "hinweis": "Die Skizze baut sich Schritt für Schritt auf. Erkläre in derselben Reihenfolge, "
                           "knapp – ein bis zwei Sätze je Schritt."}
    return {"angezeigt": False, "hinweis": "Kein Fenster offen – nur mit Worten erklären."}


def tools(cfg, secrets) -> list[Tool]:
    return [Tool(
        "skizze_zeichnen",
        "Eine Prinzipskizze im Fenster live entstehen lassen, um eine Erklärung zu veranschaulichen "
        "(Abläufe, Aufbau, Ursache-Wirkung, Kreisläufe, Vergleiche). 3–10 Elemente mit kurzen Texten "
        "(max. 3–4 Wörter), Verbindungen mit optionaler Beschriftung. Positionen x/y im Raster 0–100 "
        "(0,0 = oben links); ohne Positionen ordnet das Fenster automatisch von links nach rechts an. "
        "'schritte' legt die Reihenfolge fest, in der Elemente (per id) erscheinen – passend zur Erklärung; "
        "Verbindungen erscheinen, sobald beide Enden sichtbar sind. Formen: box, kreis, raute (Entscheidung), "
        "zylinder (Speicher), wolke (Umgebung/Netz), text (freie Beschriftung).",
        "anzeige", zeichnen,
        {"titel": S("Überschrift der Skizze"),
         "elemente": {"type": "array", "items": {"type": "object", "properties": {
             "id": {"type": "string"}, "text": {"type": "string"},
             "form": {"type": "string", "enum": FORMEN},
             "x": {"type": "number"}, "y": {"type": "number"},
             "notiz": {"type": "string", "description": "kleine Zusatzzeile unter dem Element"},
             "betont": {"type": "boolean"}}, "required": ["id", "text"]}},
         "verbindungen": {"type": "array", "items": {"type": "object", "properties": {
             "von": {"type": "string"}, "nach": {"type": "string"}, "text": {"type": "string"},
             "art": {"type": "string", "enum": ARTEN}}, "required": ["von", "nach"]}},
         "schritte": {"type": "array", "items": {"type": "array", "items": {"type": "string"}},
                      "description": "z. B. [['sonne'], ['wasser','verdunstung'], ['wolke']]"},
         "bereiche": {"type": "array", "items": {"type": "object", "properties": {
             "text": {"type": "string"}, "ids": {"type": "array", "items": {"type": "string"}}}},
             "description": "optionale Rahmen um zusammengehörige Elemente"}},
        ["titel", "elemente"],
        label=lambda a: f"Skizze: {a.get('titel', '')}")]
