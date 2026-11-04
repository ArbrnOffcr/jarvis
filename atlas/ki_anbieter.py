"""KI-Anbieter wählen: Hauptmodell und Ausweichmodell (Einstellungen → Verbindungen → KI-Modelle).

Schlüssel liegen nur im Schlüsselbund dieses Macs; die Wahl (welcher Anbieter, welche Modelle je Stufe) in
ATLAS-Privat/ki_anbieter.json. Jeder Anbieter läuft durch den Datenschutz-Schleier."""
from __future__ import annotations

import httpx

from atlas.keystore import SERVICE, get_secret, set_secret
from atlas.paths import read_private_json, write_private_json
from atlas.providers.fremd import ANBIETER, STUFEN, OpenAIKompatibel, auto_modelle
from atlas.tools import ToolError

DATEI = "ki_anbieter.json"


def wahl() -> dict:
    w = read_private_json(DATEI, {}) or {}
    w.setdefault("haupt", "claude")
    w.setdefault("ausweich", "")
    w.setdefault("modelle", {})
    w.setdefault("url_eigen", "")
    if w["haupt"] not in ANBIETER:
        w["haupt"] = "claude"
    if w["ausweich"] not in ANBIETER:
        w["ausweich"] = ""
    return w


def bauen(core, art: str, w: dict | None = None):
    w = w or wahl()
    if art == "claude":
        from atlas.providers import ClaudeProvider
        return ClaudeProvider(get_secret("anthropic"), core.cfg.get("recherche"), (core.cfg.get("wetter") or {}).get("ort", ""))
    p = ANBIETER[art]
    return OpenAIKompatibel(art, get_secret(p["schluessel"]), w.get("url_eigen", "") if art == "eigen" else "",
                            (w.get("modelle") or {}).get(art))


def weiche(core):
    from atlas.providers.fremd import CloudWeiche
    p = core.providers.get("claude")
    p = getattr(p, "inner", p)
    return p if isinstance(p, CloudWeiche) else None


def neu_laden(core) -> None:
    w = weiche(core)
    if w:
        w.neu_laden()


def status(core) -> dict:
    w = wahl()
    anbieter = {}
    for art, p in ANBIETER.items():
        k = get_secret(p["schluessel"])
        anbieter[art] = {"name": p["name"], "gesetzt": bool(k), "maske": f"…{k[-4:]}" if k and len(k) > 8 else "",
                         "konsole": p.get("konsole", ""), "hinweis": p.get("hinweis", ""),
                         "websuche": bool(p.get("websuche")),
                         "modelle": {**(p.get("modelle") or {}), **((w.get("modelle") or {}).get(art) or {})}}
    we = weiche(core)
    return {"haupt": w["haupt"], "ausweich": w["ausweich"], "url_eigen": w["url_eigen"], "anbieter": anbieter,
            "stufen": list(STUFEN), "zuletzt": we.zuletzt() if we else ""}


def _pruefen(art: str, key: str, url: str = "") -> list[str]:
    if art == "claude":
        r = httpx.get("https://api.anthropic.com/v1/models", params={"limit": 100}, timeout=15,
                      headers={"x-api-key": key, "anthropic-version": "2023-06-01"})
        if r.status_code != 200:
            raise ToolError(f"Schlüssel wird nicht angenommen ({r.status_code})")
        return [m["id"] for m in r.json().get("data", [])]
    p = OpenAIKompatibel(art, key, url)
    if not p.url:
        raise ToolError("Adresse des Dienstes fehlt (z. B. https://openrouter.ai/api/v1)")
    try:
        return p.list_models()
    except Exception as e:
        raise ToolError(f"Schlüssel oder Adresse wird nicht angenommen: {str(e)[:160]}")


def schluessel_setzen(core, art: str, wert: str, url: str = "") -> dict:
    if art not in ANBIETER:
        raise ToolError("Unbekannter Anbieter")
    wert = (wert or "").strip()
    w = wahl()
    if art == "eigen":
        url = (url or w.get("url_eigen") or "").strip().rstrip("/")
        if not url.startswith("https://") and not url.startswith("http://127.0.0.1") and not url.startswith("http://localhost"):
            raise ToolError("Adresse muss mit https:// beginnen (lokal auch http://localhost)")
        w["url_eigen"] = url
    if not wert:
        raise ToolError("Schlüssel fehlt")
    liste = _pruefen(art, wert, url)
    set_secret(ANBIETER[art]["schluessel"], wert)
    if art != "claude" and not (w.get("modelle") or {}).get(art):
        w.setdefault("modelle", {})[art] = auto_modelle(art, liste)
    write_private_json(DATEI, w)
    neu_laden(core)
    core.audit.log("einstellungen", ki_schluessel=art)
    return {"ok": True, "text": f"✓ gültig – {len(liste)} Modelle verfügbar", "modelle": liste[:300]}


def schluessel_loeschen(core, art: str) -> dict:
    import keyring
    if art not in ANBIETER:
        raise ToolError("Unbekannter Anbieter")
    try:
        keyring.delete_password(SERVICE, ANBIETER[art]["schluessel"])
    except Exception:
        pass
    w = wahl()
    if w["haupt"] == art and art != "claude":
        w["haupt"] = "claude"
    if w["ausweich"] == art:
        w["ausweich"] = ""
    write_private_json(DATEI, w)
    neu_laden(core)
    core.audit.log("einstellungen", ki_entfernt=art)
    return {"ok": True, "text": "Entfernt"}


def modelle(core, art: str) -> list[str]:
    if art == "claude":
        k = get_secret("anthropic")
        return _pruefen("claude", k) if k else []
    p = bauen(core, art)
    try:
        return p.list_models() if p.available() else []
    except Exception:
        return []


def waehlen(core, haupt: str, ausweich: str, modelle_neu: dict | None = None) -> dict:
    w = wahl()
    if haupt not in ANBIETER or (ausweich and ausweich not in ANBIETER):
        raise ToolError("Unbekannter Anbieter")
    for art in (haupt, ausweich):
        if art and not get_secret(ANBIETER[art]["schluessel"]):
            raise ToolError(f"Für {ANBIETER[art]['name']} fehlt noch der Schlüssel")
    w["haupt"], w["ausweich"] = haupt, ("" if ausweich == haupt else ausweich or "")
    for art, m in (modelle_neu or {}).items():
        if art in ANBIETER and art != "claude" and isinstance(m, dict):
            w.setdefault("modelle", {})[art] = {s: str(m.get(s) or "").strip()[:120] for s in STUFEN if m.get(s)}
    write_private_json(DATEI, w)
    neu_laden(core)
    core.audit.log("einstellungen", ki_haupt=w["haupt"], ki_ausweich=w["ausweich"])
    n = ANBIETER[w["haupt"]]["name"]
    return {"ok": True, "text": f"✓ Hauptmodell: {n}" + (f" · Ausweich: {ANBIETER[w['ausweich']]['name']}" if w["ausweich"] else "")}
