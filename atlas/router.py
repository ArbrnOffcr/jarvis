"""Router: entscheidet je Anfrage, ob lokal oder Claude antwortet."""
import re
from dataclasses import dataclass

CLAUDE_ROUTES = {"claude": "sonnet", "sonnet": "sonnet", "opus": "opus",
                 "haiku": "haiku"}


@dataclass
class Decision:
    target: str                 # "lokal" | "claude"
    alias: str | None           # Claude-Kurzname oder None
    reason: str
    ask_cloud: bool = False     # Rückfrage: darf das an Claude?


def _hits(text: str, words: list[str], whole: bool = False) -> list[str]:
    """Wortanfang genügt ('steuer' trifft 'Steuererklärung');
    bei whole=True nur ganze Wörter ('pin' trifft nicht 'Pinnwand')."""
    t = text.lower()
    end = r"\b" if whole else ""
    return [w for w in words if re.search(rf"\b{re.escape(w)}{end}", t)]


class Router:
    def __init__(self, cfg: dict):
        self.cfg = cfg["router"]
        self.default_alias = cfg["claude"]["default"]

    def classify(self, text: str) -> dict:
        forb = _hits(text, self.cfg["forbidden_keywords"], whole=True)
        sens = _hits(text, self.cfg["sensitive_keywords"])
        comp = _hits(text, self.cfg["complex_keywords"])
        long = len(text) >= self.cfg["complex_min_chars"]
        tool = _hits(text, self.cfg.get("tool_keywords", []))
        return {"forbidden": forb, "sensitive": sens, "tool": tool,
                "complex": bool(comp or long), "complex_words": comp}

    def decide(self, text: str, mode: str, session_sensitive: bool,
               local_ok: bool, cloud_ok: bool) -> Decision:
        c = self.classify(text)
        sensitive = bool(c["sensitive"]) or session_sensitive

        # 1. Zugangsdaten verlassen den Mac nie
        if c["forbidden"]:
            return Decision("lokal", None,
                            f"Zugangsdaten erkannt ({', '.join(c['forbidden'])}) – bleibt lokal")

        # 2. Manuelle Vorgabe
        if mode in CLAUDE_ROUTES:
            return Decision("claude", CLAUDE_ROUTES[mode], f"manuell: {mode}")
        if mode == "lokal":
            return Decision("lokal", None, "manuell: lokal")

        # 3. Automatik
        if not local_ok and not cloud_ok:
            return Decision("lokal", None, "weder lokal noch Cloud erreichbar")
        if sensitive and c["complex"]:
            return Decision("claude", self.default_alias,
                            "sensibel und komplex", ask_cloud=True)
        if sensitive:
            if local_ok:
                return Decision("lokal", None, "sensibel – bleibt lokal")
            return Decision("claude", self.default_alias,
                            "sensibel, lokales Modell nicht verfügbar", ask_cloud=True)
        if c["tool"] and not c["complex"] and cloud_ok:
            return Decision("claude", self.cfg.get("tool_model", "haiku"),
                            f"Werkzeug-Aufgabe ({', '.join(c['tool'][:3])})")
        if c["complex"]:
            if cloud_ok:
                why = ", ".join(c["complex_words"]) or "lange Anfrage"
                return Decision("claude", self.default_alias, f"komplex ({why})")
            return Decision("lokal", None, "komplex, aber offline")
        if self.cfg.get("einfach", "haiku") != "lokal" and cloud_ok:
            return Decision("claude", self.cfg.get("einfach", "haiku"), "Gespräch – schnell")
        if local_ok:
            return Decision("lokal", None, "einfache Anfrage")
        return Decision("claude", "haiku", "einfach, lokales Modell nicht verfügbar")
