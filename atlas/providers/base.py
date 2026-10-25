"""Gemeinsame Schnittstelle für alle Modellanbieter (lokal und Cloud).

Ein 'Schritt' ist ein Modellaufruf. Er liefert Ereignisse:
  ("text", "...")        Textstück zum Anzeigen
  ("end", StepResult)    Abschluss mit evtl. Werkzeugaufrufen
"""
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Iterator


class ProviderError(Exception):
    pass


@dataclass
class ToolCall:
    id: str
    name: str
    args: dict


@dataclass
class StepResult:
    text: str
    tool_calls: list[ToolCall] = field(default_factory=list)
    assistant_msg: dict | None = None     # Antwort im Format des Anbieters
    usage: tuple[int, int] = (0, 0)
    pause: bool = False                   # Anbieter hat unterbrochen (z. B. lange Websuche)
    quellen: list = field(default_factory=list)   # [{titel, url}] aus der Websuche


class Provider(ABC):
    name = "base"

    @abstractmethod
    def available(self) -> bool: ...

    @abstractmethod
    def resolve_model(self, alias: str | None = None) -> str: ...

    @abstractmethod
    def list_models(self) -> list[str]: ...

    @abstractmethod
    def step(self, model: str, system: str, messages: list[dict],
             tools: list, max_tokens: int) -> Iterator[tuple]:
        """Ein Modellaufruf, siehe Moduldoku."""

    @abstractmethod
    def tool_results(self, results: list[tuple[ToolCall, str]]) -> list[dict]:
        """Werkzeugergebnisse als Nachrichten im Format des Anbieters."""
