"""„Was kannst du?“ – JARVIS liest seine eigene Funktionsliste (FUNKTIONEN.md im Programmordner)."""
import re

from atlas.paths import REPO_DIR
from atlas.tools import S, Tool, ToolError


def lesen(bereich: str = "") -> dict:
    f = REPO_DIR / "FUNKTIONEN.md"
    if not f.exists():
        raise ToolError("Funktionsliste fehlt")
    text = f.read_text(encoding="utf-8")
    if bereich:
        teile = re.split(r"(?m)^## ", text)
        treffer = [t for t in teile[1:] if bereich.lower() in t.lower()]
        if treffer:
            text = "\n".join("## " + t for t in treffer)
    return {"funktionen": text[:12000],
            "hinweis": "Kurz zusammenfassen (Sprache: 3–5 Sätze); ❌ = kann JARVIS nicht, ⚙️ = braucht Einrichtung."}


def tools(cfg, secrets) -> list[Tool]:
    return [Tool("faehigkeiten",
                 "Eigene Funktionsliste: was JARVIS kann, was eine Einrichtung braucht und was nicht geht. "
                 "Nutzen bei „Was kannst du?“, „Kannst du …?“ oder wenn unklar ist, ob etwas unterstützt wird.",
                 "kalender.lesen", lesen, {"bereich": S("optional Stichwort, z. B. 'Mail' oder 'Kalender'")})]
