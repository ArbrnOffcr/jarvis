"""Lokale Open-Source-Modelle über Ollama (läuft auf dem Mac selbst)."""
import json
import time
import uuid

import httpx

from atlas.persona import CACHE_MARKE
from atlas.providers.base import Provider, ProviderError, StepResult, ToolCall


class OllamaProvider(Provider):
    name = "lokal"

    def __init__(self, cfg: dict):
        self.url = cfg["url"].rstrip("/")
        self.preferred = [cfg["model"], *cfg.get("fallback_models", [])]
        self.think = cfg.get("think", False)
        self.num_ctx = cfg.get("num_ctx", 8192)
        self.keep_alive = cfg.get("keep_alive", "30m")
        self._tags: tuple[float, list[str]] | None = None

    def list_models(self) -> list[str]:
        if self._tags and time.monotonic() - self._tags[0] < 30:    # 30 s zwischenspeichern
            return self._tags[1]
        try:
            r = httpx.get(f"{self.url}/api/tags", timeout=2)
            r.raise_for_status()
            names = [m["name"] for m in r.json().get("models", [])]
            self._tags = (time.monotonic(), names)
            return names
        except httpx.HTTPError as e:
            raise ProviderError("Ollama nicht erreichbar") from e

    def available(self) -> bool:
        try:
            return bool(self.list_models())
        except ProviderError:
            return False

    def resolve_model(self, alias: str | None = None) -> str:
        installed = self.list_models()
        for name in ([alias] if alias else []) + self.preferred:
            for m in installed:
                if m == name or m.split(":")[0] == name or m == f"{name}:latest":
                    return m
        if installed:
            return installed[0]
        raise ProviderError("Kein lokales Modell installiert (ollama pull ...)")

    def step(self, model, system, messages, tools, max_tokens):
        body = {"model": model, "stream": True,
                "messages": [{"role": "system", "content": system.replace(CACHE_MARKE, "")}, *messages],
                "keep_alive": self.keep_alive,
                "options": {"num_predict": max_tokens, "num_ctx": self.num_ctx}}
        if tools:
            body["tools"] = [{"type": "function", "function": {
                "name": t.name, "description": t.description,
                "parameters": t.schema()}} for t in tools]
        if self.think is not None:
            body["think"] = self.think
        try:
            yield from self._step(body)
        except ProviderError as e:
            # ältere Ollama-Versionen/Modelle kennen 'think' nicht
            if "think" in body and "think" in str(e).lower():
                body.pop("think")
                yield from self._step(body)
            else:
                raise

    def _step(self, body):
        text, calls, raw_calls, usage = "", [], [], (0, 0)
        try:
            with httpx.stream("POST", f"{self.url}/api/chat", json=body,
                              timeout=httpx.Timeout(10, read=300)) as r:
                if r.status_code != 200:
                    r.read()
                    raise ProviderError(f"Ollama {r.status_code}: {r.text}")
                for line in r.iter_lines():
                    if not line:
                        continue
                    data = json.loads(line)
                    if "error" in data:
                        raise ProviderError(f"Ollama: {data['error']}")
                    msg = data.get("message", {})
                    if msg.get("content"):
                        text += msg["content"]
                        yield ("text", msg["content"])
                    for tc in msg.get("tool_calls") or []:
                        fn = tc.get("function", {})
                        args = fn.get("arguments") or {}
                        if isinstance(args, str):
                            try:
                                args = json.loads(args)
                            except json.JSONDecodeError:
                                args = {}
                        raw_calls.append(tc)
                        calls.append(ToolCall(uuid.uuid4().hex[:8], fn.get("name", ""), args))
                    if data.get("done"):
                        usage = (data.get("prompt_eval_count", 0), data.get("eval_count", 0))
        except httpx.HTTPError as e:
            raise ProviderError(f"Ollama: {e}") from e
        assistant = {"role": "assistant", "content": text}
        if raw_calls:
            assistant["tool_calls"] = raw_calls
        yield ("end", StepResult(text, calls, assistant, usage))

    def warmup(self) -> None:
        """Modell vorab in den Speicher laden (leere Anfrage)."""
        try:
            model = self.resolve_model()
            httpx.post(f"{self.url}/api/generate", json={"model": model, "keep_alive": self.keep_alive,
                       "options": {"num_ctx": self.num_ctx}}, timeout=120)
        except (httpx.HTTPError, ProviderError):
            pass

    def tool_results(self, results):
        return [{"role": "tool", "tool_name": call.name, "content": out}
                for call, out in results]
