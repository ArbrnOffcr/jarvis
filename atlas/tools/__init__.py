"""Werkzeuge, die JARVIS benutzen darf. Jedes Werkzeug nennt seine
Rechte-Aktion (siehe permissions.py) – die Prüfung erfolgt im Kern."""
from dataclasses import dataclass, field
from typing import Callable


class ToolError(Exception):
    """Fehler, der dem Modell (und damit dir) verständlich gemeldet wird."""


@dataclass
class Tool:
    name: str
    description: str
    action: str                              # Rechte-Aktion, z. B. "mail.senden"
    func: Callable
    params: dict = field(default_factory=dict)
    required: list = field(default_factory=list)
    label: Callable[[dict], str] | None = None   # Kurzbeschreibung für Rückfragen

    def schema(self) -> dict:
        return {"type": "object", "properties": self.params, "required": self.required}

    def describe(self, args: dict) -> str:
        if self.label:
            try:
                return self.label(args)
            except Exception:
                pass
        return f"{self.name}({', '.join(f'{k}={v!r}' for k, v in args.items())})"


def S(desc: str, **extra) -> dict:          # Kurzform: Text-Parameter
    return {"type": "string", "description": desc, **extra}


def build_tools(cfg: dict, secrets: dict, memory=None, archiv=None, shared=None) -> dict[str, Tool]:
    from atlas.tools import archiv as archiv_mod
    from atlas.tools import anzeige, bild, einkauf, faehigkeiten, skizze, video, youtube, erinnerungen, gedaechtnis, kalender, kontakte, mail, notizen, office, wetter
    tools: list[Tool] = []
    for mod in (faehigkeiten, kalender, erinnerungen, einkauf, notizen, kontakte, mail, wetter, anzeige, bild, video, youtube, skizze):
        tools += mod.tools(cfg, secrets)
    if memory is not None:
        tools += gedaechtnis.tools(cfg, secrets, memory)
    if archiv is not None and archiv.archive:
        tools += archiv_mod.tools(cfg, secrets, archiv, shared)
        tools += office.tools(cfg, secrets, archiv.archive, shared)
        from atlas.tools import vorschau
        tools += vorschau.tools(cfg, secrets, archiv, shared)
    return {t.name: t for t in tools}
