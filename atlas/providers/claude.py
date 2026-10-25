"""Anthropic Claude über die API."""
import threading
import time

import anthropic
import httpx

from atlas.persona import CACHE_MARKE
from atlas.providers.base import Provider, ProviderError, StepResult, ToolCall


def _cache_last(messages: list[dict]) -> list[dict]:
    """Cache-Punkt an die letzte Nachricht: Werkzeugschleifen senden den Verlauf erneut –
    so wird er nur einmal voll berechnet. Originale bleiben unverändert."""
    if not messages:
        return messages
    last = dict(messages[-1])
    content = last.get("content")
    if isinstance(content, str):
        if not content.strip():
            return messages
        content = [{"type": "text", "text": content}]
    elif isinstance(content, list) and content:
        content = [dict(b) for b in content]
    else:
        return messages
    if content[-1].get("type") in ("text", "tool_result", "image", "document"):
        content[-1]["cache_control"] = {"type": "ephemeral"}
    last["content"] = content
    return [*messages[:-1], last]


class ClaudeProvider(Provider):
    name = "claude"

    def __init__(self, api_key: str | None, recherche: dict | None = None, ort: str = ""):
        # Verbindungen lange offen halten: spart den TLS-Aufbau (100–300 ms) vor jeder Antwort
        http = anthropic.DefaultHttpxClient(limits=httpx.Limits(max_keepalive_connections=4,
                                                                keepalive_expiry=300))
        self.client = anthropic.Anthropic(api_key=api_key, http_client=http) if api_key else None
        self._models: list[str] | None = None
        self.recherche = recherche or {}
        self.ort = ort
        self.ttl_1h = True              # Prompt-Cache 1 Stunde statt 5 Minuten (Rückfall, falls abgelehnt)
        self._letzter = 0.0

    def vorwaermen(self) -> None:
        """Verbindung aufbauen, solange der Nutzer noch spricht (läuft im Hintergrund)."""
        if not self.client or time.monotonic() - self._letzter < 60:
            return
        self._letzter = time.monotonic()

        def los():
            try:
                self.client.with_options(timeout=5).models.list(limit=1)
            except Exception:
                pass
        threading.Thread(target=los, daemon=True).start()

    def available(self) -> bool:
        return self.client is not None

    def list_models(self) -> list[str]:
        if self._models is None:
            if not self.client:
                raise ProviderError("Kein Anthropic API-Key – bitte 'jarvis setup'")
            try:
                self._models = [m.id for m in self.client.models.list(limit=100)]
            except (anthropic.APIError, httpx.HTTPError) as e:
                raise ProviderError(f"Claude nicht erreichbar: {e}") from e
        return self._models

    def resolve_model(self, alias: str | None = None) -> str:
        """'opus'/'sonnet'/'haiku' -> neuestes Modell dieser Familie."""
        alias = alias or "sonnet"
        models = self.list_models()
        if alias in models:
            return alias
        for m in models:                 # API liefert neueste zuerst
            if alias.lower() in m.lower():
                return m
        raise ProviderError(f"Kein Claude-Modell für '{alias}' gefunden")

    def step(self, model, system, messages, tools, max_tokens):
        if not self.client:
            raise ProviderError("Kein Anthropic API-Key – bitte 'jarvis setup'")
        fest, _, wechselnd = system.partition(CACHE_MARKE)
        cc = {"type": "ephemeral", "ttl": "1h"} if self.ttl_1h else {"type": "ephemeral"}
        sys_blocks = [{"type": "text", "text": fest.strip(), "cache_control": cc}]
        if wechselnd.strip():
            sys_blocks.append({"type": "text", "text": wechselnd.strip()})
        kwargs = dict(model=model, system=sys_blocks, messages=_cache_last(messages),
                      max_tokens=max_tokens)
        tool_list = [{"name": t.name, "description": t.description,
                      "input_schema": t.schema()} for t in tools or []]
        if self.recherche.get("aktiv"):            # Websuche läuft bei Anthropic (Servertool)
            tool_list.append({"type": self.recherche.get("werkzeug", "web_search_20250305"),
                              "name": "web_search", "max_uses": self.recherche.get("max_suchen", 5),
                              "user_location": {"type": "approximate", "city": self.ort or "Berlin",
                                                "country": "DE", "timezone": "Europe/Berlin"}})
        if tool_list:
            kwargs["tools"] = tool_list
        text = ""
        self._letzter = time.monotonic()
        for versuch in (1, 2):
            try:
                with self.client.messages.stream(**kwargs) as s:
                    for chunk in s.text_stream:
                        text += chunk
                        yield ("text", chunk)
                    final = s.get_final_message()
                break
            except anthropic.BadRequestError as e:
                if versuch == 1 and not text and self.ttl_1h and "ttl" in str(e).lower():
                    self.ttl_1h = False                   # API kennt den 1-h-Cache nicht: ohne weiter
                    sys_blocks[0]["cache_control"] = {"type": "ephemeral"}
                    continue
                raise ProviderError(f"Claude: {e}") from e
            except (anthropic.APIError, httpx.HTTPError) as e:
                raise ProviderError(f"Claude: {e}") from e
        self._letzter = time.monotonic()
        calls = [ToolCall(b.id, b.name, dict(b.input))
                 for b in final.content if b.type == "tool_use"]
        content = [b.model_dump(exclude_none=True) for b in final.content]
        quellen = []
        for b in final.content:
            if b.type == "web_search_tool_result" and isinstance(b.content, list):
                quellen += [{"titel": r.title, "url": r.url} for r in b.content
                            if getattr(r, "url", None)]
        u = final.usage                # Cache: Lesen kostet 10 %, Schreiben 125 % des Eingabepreises
        gelesen = getattr(u, "cache_read_input_tokens", 0) or 0
        geschrieben = getattr(u, "cache_creation_input_tokens", 0) or 0
        t_in = round((u.input_tokens or 0) + 0.1 * gelesen + (2.0 if self.ttl_1h else 1.25) * geschrieben)
        self.last_cache = (gelesen, geschrieben)
        yield ("end", StepResult(text, calls, {"role": "assistant", "content": content},
                                 (t_in, final.usage.output_tokens),
                                 pause=final.stop_reason == "pause_turn", quellen=quellen))

    def tool_results(self, results):
        return [{"role": "user", "content": [
            {"type": "tool_result", "tool_use_id": call.id, "content": out}
            for call, out in results]}]
