"""Weitere Cloud-Anbieter (OpenAI, Google Gemini, Mistral, beliebige OpenAI-kompatible Dienste) und die Cloud-Weiche.

Alle Anbieter sprechen nach außen dasselbe Nachrichtenformat wie Claude (Anthropic-Blöcke: text, tool_use,
tool_result). Übersetzt wird nur hier, im Moment des Aufrufs. Dadurch
  - bleibt der Gesprächsverlauf gleich, egal welches Modell antwortet (Wechsel und Ausweichen mitten im Gespräch),
  - wirkt der Datenschutz-Schleier (atlas/datenschutz.py) unverändert für jeden Anbieter.

Die Cloud-Weiche sitzt im Platz "claude" von core.providers: Hauptmodell nach Wahl, bei einem Fehler (Ausfall,
Schlüssel ungültig, Kontingent) springt das Ausweichmodell ein – nur solange noch kein Text ausgegeben wurde."""
from __future__ import annotations

import base64
import json
import re
import time
import uuid

import httpx

from atlas.persona import CACHE_MARKE
from atlas.providers.base import Provider, ProviderError, StepResult, ToolCall

# Stufen wie bei Claude: haiku = schnell, sonnet = Standard, opus = stark
STUFEN = ("haiku", "sonnet", "opus")
ANBIETER = {
    "claude": {"name": "Claude (Anthropic)", "schluessel": "anthropic", "konsole": "https://console.anthropic.com/settings/keys",
               "websuche": True},
    "openai": {"name": "OpenAI (GPT)", "schluessel": "openai", "url": "https://api.openai.com/v1",
               "max_param": "max_completion_tokens", "usage": True, "konsole": "https://platform.openai.com/api-keys"},
    "gemini": {"name": "Google Gemini", "schluessel": "gemini", "url": "https://generativelanguage.googleapis.com/v1beta/openai",
               "modelle": {"haiku": "gemini-flash-lite-latest", "sonnet": "gemini-flash-latest", "opus": "gemini-pro-latest"},
               "schema_streng": True, "konsole": "https://aistudio.google.com/apikey",
               "hinweis": "Kostenlose Stufe: Google darf Eingaben zur Verbesserung nutzen – für JARVIS nur mit bezahltem Konto."},
    "mistral": {"name": "Mistral (EU)", "schluessel": "mistral", "url": "https://api.mistral.ai/v1",
                "modelle": {"haiku": "mistral-small-latest", "sonnet": "mistral-medium-latest", "opus": "mistral-large-latest"},
                "konsole": "https://console.mistral.ai/api-keys"},
    "eigen": {"name": "Eigener Dienst (OpenAI-kompatibel)", "schluessel": "ki_eigen", "url": "",
              "hinweis": "Für OpenRouter, Groq, DeepSeek, LM Studio u. a.: Adresse endet meist auf /v1."},
}
_OHNE = re.compile(r"audio|realtime|transcribe|tts|image|dall-e|whisper|embedding|moderation|search|instruct|codex|"
                   r"computer|oss|\d{4}-\d{2}-\d{2}|preview|chat-latest", re.I)


def auto_modelle(art: str, liste: list[str]) -> dict:
    """Sinnvolle Modelle je Stufe aus der Liste des Anbieters (OpenAI und eigene Dienste): das neueste Hauptmodell
    für Standard/stark, dessen „mini“ für schnell. Feste Vorgaben (Gemini, Mistral) haben Vorrang."""
    fest = ANBIETER.get(art, {}).get("modelle")
    if fest:
        return dict(fest)
    if not liste:
        return {}
    if art == "openai":
        def version(n):
            m = re.match(r"gpt-(\d+)(?:\.(\d+))?", n)
            return (int(m.group(1)), int(m.group(2) or 0)) if m else (0, 0)
        gpt = [n for n in liste if n.startswith("gpt-") and not _OHNE.search(n)]
        basis = sorted([n for n in gpt if not re.search(r"-(mini|nano|pro)$", n)], key=version, reverse=True)
        mini = sorted([n for n in gpt if n.endswith("-mini")], key=version, reverse=True)
        if basis:
            return {"haiku": (mini or basis)[0], "sonnet": basis[0], "opus": basis[0]}
    m = liste[0]
    return {s: m for s in STUFEN}


def _text_aus(inhalt) -> str:
    if isinstance(inhalt, str):
        return inhalt
    if isinstance(inhalt, list):
        return "\n".join(b.get("text", "") for b in inhalt if isinstance(b, dict) and b.get("type") == "text")
    return str(inhalt or "")


def _dokument_text(b: dict) -> str:
    """PDF-Blöcke (Claude liest PDFs selbst) für andere Modelle lokal in Text umwandeln."""
    src = b.get("source") or {}
    titel = b.get("title") or "Dokument"
    if src.get("type") == "text":
        return f"[{titel}]\n{src.get('data', '')}"
    if src.get("type") == "base64" and src.get("media_type") == "application/pdf":
        try:
            import fitz
            with fitz.open(stream=base64.b64decode(src["data"]), filetype="pdf") as d:
                text = "\n".join(seite.get_text() for seite in d)[:120_000]
            return f"[{titel}]\n{text}" if text.strip() else f"[{titel}: gescanntes PDF ohne Textebene]"
        except Exception:
            return f"[{titel}: PDF konnte nicht gelesen werden]"
    return f"[{titel}]"


def zu_openai(system: str, messages: list[dict]) -> list[dict]:
    """Anthropic-Verlauf → Chat-Completions-Nachrichten."""
    out = [{"role": "system", "content": system.replace(CACHE_MARKE, "").strip()}]
    for m in messages:
        rolle, inhalt = m.get("role"), m.get("content")
        if rolle not in ("user", "assistant"):
            continue
        if isinstance(inhalt, str):
            out.append({"role": rolle, "content": inhalt})
            continue
        if not isinstance(inhalt, list):
            continue
        if rolle == "assistant":
            text = "".join(b.get("text", "") for b in inhalt if b.get("type") == "text")
            calls = [{"id": b.get("id") or f"call_{uuid.uuid4().hex[:10]}", "type": "function",
                      "function": {"name": b.get("name", ""), "arguments": json.dumps(b.get("input") or {}, ensure_ascii=False)}}
                     for b in inhalt if b.get("type") == "tool_use"]
            if text or calls:
                msg = {"role": "assistant", "content": text or None}
                if calls:
                    msg["tool_calls"] = calls
                out.append(msg)
            continue
        werkzeuge, teile, bild = [], [], False
        for b in inhalt:
            art = b.get("type")
            if art == "tool_result":
                werkzeuge.append({"role": "tool", "tool_call_id": b.get("tool_use_id"), "content": _text_aus(b.get("content")) or "ok"})
            elif art == "text":
                teile.append({"type": "text", "text": b.get("text", "")})
            elif art == "image" and (b.get("source") or {}).get("type") == "base64":
                s = b["source"]
                teile.append({"type": "image_url", "image_url": {"url": f"data:{s.get('media_type', 'image/png')};base64,{s['data']}"}})
                bild = True
            elif art == "document":
                teile.append({"type": "text", "text": _dokument_text(b)})
        out.extend(werkzeuge)                       # Antworten müssen direkt auf die Werkzeugaufrufe folgen
        if teile:
            out.append({"role": "user", "content": teile if bild else "\n\n".join(t["text"] for t in teile)})
    return out


def _schema(s, streng: bool):
    if not streng or not isinstance(s, (dict, list)):
        return s
    if isinstance(s, list):
        return [_schema(x, streng) for x in s]
    return {k: _schema(v, streng) for k, v in s.items() if k not in ("additionalProperties", "$schema", "examples", "default")}


class OpenAIKompatibel(Provider):
    """Chat-Completions-Schnittstelle (OpenAI und alle, die sie nachbauen: Gemini, Mistral, OpenRouter …)."""

    def __init__(self, art: str, api_key: str | None, url: str = "", modelle: dict | None = None):
        p = ANBIETER.get(art, ANBIETER["eigen"])
        self.art, self.name = art, art
        self.anzeige = p["name"]
        self.key = api_key
        self.url = (url or p.get("url") or "").rstrip("/")
        self.modelle = {**(p.get("modelle") or {}), **{k: v for k, v in (modelle or {}).items() if v}}
        self.max_param = p.get("max_param", "max_tokens")
        self.usage = p.get("usage", False)
        self.streng = p.get("schema_streng", False)
        self._liste: tuple[float, list[str]] | None = None

    def _kopf(self) -> dict:
        return {"Authorization": f"Bearer {self.key}", "Content-Type": "application/json"}

    def available(self) -> bool:
        return bool(self.key and self.url)

    def list_models(self) -> list[str]:
        if self._liste and time.monotonic() - self._liste[0] < 600:
            return self._liste[1]
        if not self.available():
            raise ProviderError(f"{self.anzeige}: kein Schlüssel")
        try:
            r = httpx.get(f"{self.url}/models", headers=self._kopf(), timeout=15)
            r.raise_for_status()
            daten = r.json().get("data") or r.json().get("models") or []
            namen = sorted({str(m.get("id") or m.get("name") or "").removeprefix("models/") for m in daten} - {""})
        except (httpx.HTTPError, ValueError) as e:
            raise ProviderError(f"{self.anzeige} nicht erreichbar: {e}") from e
        self._liste = (time.monotonic(), namen)
        return namen

    def resolve_model(self, alias: str | None = None) -> str:
        alias = alias or "sonnet"
        if not self.available():
            raise ProviderError(f"{self.anzeige}: kein Schlüssel – Einstellungen → Verbindungen → KI-Modelle")
        if alias in self.modelle:
            return self.modelle[alias]
        for s in STUFEN:                             # Familienname von Claude → Stufe
            if s in alias.lower() and s in self.modelle:
                return self.modelle[s]
        if self.modelle:
            return self.modelle.get("sonnet") or next(iter(self.modelle.values()))
        return alias

    def step(self, model, system, messages, tools, max_tokens, **kw):
        if not self.available():
            raise ProviderError(f"{self.anzeige}: kein Schlüssel")
        body = {"model": model, "messages": zu_openai(system, messages), "stream": True, self.max_param: max_tokens}
        if self.usage:
            body["stream_options"] = {"include_usage": True}
        if tools:
            body["tools"] = [{"type": "function", "function": {"name": t.name, "description": t.description[:1000],
                                                                "parameters": _schema(t.schema(), self.streng)}}
                             for t in tools]
        text, roh, usage = "", {}, (0, 0)
        try:
            with httpx.stream("POST", f"{self.url}/chat/completions", headers=self._kopf(), json=body,
                              timeout=httpx.Timeout(15, read=300)) as r:
                if r.status_code != 200:
                    r.read()
                    grund = {401: "Schlüssel ungültig", 403: "kein Zugriff", 404: f"Modell „{model}“ unbekannt",
                             429: "Kontingent/Limit erreicht"}.get(r.status_code, f"Fehler {r.status_code}")
                    raise ProviderError(f"{self.anzeige}: {grund} – {r.text[:200]}")
                for zeile in r.iter_lines():
                    if not zeile.startswith("data:"):
                        continue
                    d = zeile[5:].strip()
                    if d == "[DONE]":
                        break
                    try:
                        j = json.loads(d)
                    except json.JSONDecodeError:
                        continue
                    if j.get("error"):
                        raise ProviderError(f"{self.anzeige}: {j['error']}")
                    u = j.get("usage")
                    if u:
                        usage = (u.get("prompt_tokens", 0) or 0, u.get("completion_tokens", 0) or 0)
                    for ch in j.get("choices") or []:
                        delta = ch.get("delta") or {}
                        if delta.get("content"):
                            text += delta["content"]
                            yield ("text", delta["content"])
                        for tc in delta.get("tool_calls") or []:
                            k = tc.get("index")
                            if k is None:
                                k = next((i for i, e in roh.items() if tc.get("id") and e["id"] == tc["id"]), len(roh))
                            e = roh.setdefault(k, {"id": "", "name": "", "args": ""})
                            fn = tc.get("function") or {}
                            e["id"] = e["id"] or tc.get("id") or ""
                            e["name"] = e["name"] or fn.get("name") or ""
                            a = fn.get("arguments")
                            e["args"] += a if isinstance(a, str) else json.dumps(a or {}) if a else ""
        except httpx.HTTPError as e:
            raise ProviderError(f"{self.anzeige}: {e}") from e
        calls, bloecke = [], ([{"type": "text", "text": text}] if text else [])
        for k in sorted(roh):
            e = roh[k]
            try:
                args = json.loads(e["args"]) if e["args"].strip() else {}
            except json.JSONDecodeError:
                args = {}
            cid = e["id"] or f"call_{uuid.uuid4().hex[:10]}"
            calls.append(ToolCall(cid, e["name"], args if isinstance(args, dict) else {}))
            bloecke.append({"type": "tool_use", "id": cid, "name": e["name"], "input": args if isinstance(args, dict) else {}})
        yield ("end", StepResult(text, calls, {"role": "assistant", "content": bloecke or [{"type": "text", "text": ""}]}, usage))

    def tool_results(self, results):
        return [{"role": "user", "content": [
            {"type": "tool_result", "tool_use_id": call.id, "content": out} for call, out in results]}]


class CloudWeiche(Provider):
    """Hauptmodell + Ausweichmodell hinter dem Platz "claude". Wer wann geantwortet hat, steht im Protokoll."""
    name = "claude"

    def __init__(self, core):
        self.c = core
        self.haupt = self.ausweich = None
        self._besitzer: dict[str, Provider] = {}
        self._alias: dict[str, str] = {}
        self._zuletzt = None
        self.neu_laden()

    # ------------------------------------------------------------ Aufbau
    def neu_laden(self) -> None:
        from atlas import ki_anbieter
        w = ki_anbieter.wahl()
        self.haupt = ki_anbieter.bauen(self.c, w["haupt"], w)
        self.ausweich = ki_anbieter.bauen(self.c, w["ausweich"], w) if w.get("ausweich") and w["ausweich"] != w["haupt"] else None
        self.haupt_art, self.ausweich_art = w["haupt"], (w.get("ausweich") or "") if self.ausweich else ""
        self._besitzer.clear()
        self._alias.clear()

    def __getattr__(self, name):                     # vorwaermen, last_cache … des zuletzt genutzten Anbieters
        if name.startswith("__"):
            raise AttributeError(name)
        for p in (self.__dict__.get("_zuletzt"), self.__dict__.get("haupt")):
            if p is not None and hasattr(p, name):
                return getattr(p, name)
        raise AttributeError(name)

    def vorwaermen(self) -> None:
        if hasattr(self.haupt, "vorwaermen"):
            self.haupt.vorwaermen()

    @property
    def last_cache(self):
        return getattr(self._zuletzt, "last_cache", None)

    # ------------------------------------------------------------ Schnittstelle
    def available(self) -> bool:
        return bool(self.haupt and self.haupt.available()) or bool(self.ausweich and self.ausweich.available())

    def list_models(self) -> list[str]:
        return self.haupt.list_models()

    def _merken(self, p, alias, model) -> str:
        self._besitzer[model], self._alias[model] = p, alias
        return model

    def resolve_model(self, alias: str | None = None) -> str:
        alias = alias or "sonnet"
        try:
            if not self.haupt.available():
                raise ProviderError(f"{self.haupt_art}: kein Schlüssel")
            return self._merken(self.haupt, alias, self.haupt.resolve_model(alias))
        except ProviderError:
            if self.ausweich and self.ausweich.available():
                return self._merken(self.ausweich, alias, self.ausweich.resolve_model(alias))
            raise

    def step(self, model, system, messages, tools, max_tokens, **kw):
        p = self._besitzer.get(model, self.haupt)
        geschrieben = False
        try:
            for ev in p.step(model, system, messages, tools, max_tokens, **kw):
                if ev[0] == "text" and ev[1]:
                    geschrieben = True
                yield ev
            self._zuletzt = p
            return
        except ProviderError as e:
            ersatz = self.ausweich if p is not self.ausweich else None
            if not ersatz or not ersatz.available() or geschrieben:
                raise
            try:
                self.c.audit.log("ki_ausweich", von=getattr(p, "name", "?"), zu=getattr(ersatz, "name", "?"), grund=str(e)[:200])
            except Exception:
                pass
        alias = self._alias.get(model, "sonnet")
        m2 = self._merken(ersatz, alias, ersatz.resolve_model(alias))
        for ev in ersatz.step(m2, system, messages, tools, max_tokens, **kw):
            yield ev
        self._zuletzt = ersatz

    def tool_results(self, results):
        return [{"role": "user", "content": [
            {"type": "tool_result", "tool_use_id": call.id, "content": out} for call, out in results]}]

    def zuletzt(self) -> str:
        return getattr(self._zuletzt, "name", "") or ""
