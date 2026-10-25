"""YouTube-Videos suchen und im JARVIS-Fenster eingebettet abspielen (startet stumm, Ton zuschaltbar).

Suche über die offizielle YouTube Data API v3 (Schlüssel im Schlüsselbund, 'jarvis setup youtube').
Abgespielt wird über den datensparsamen Einbettungsplayer (youtube-nocookie.com) – kein Herunterladen."""
import re

import httpx

from atlas.tools import S, Tool, ToolError, anzeige

API = "https://www.googleapis.com/youtube/v3"


def _dauer(iso: str) -> str:
    m = re.match(r"PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?", iso or "")
    if not m:
        return ""
    h, mi, s = (int(x or 0) for x in m.groups())
    return f"{h}:{mi:02d}:{s:02d}" if h else f"{mi}:{s:02d}"


def suchen(key: str, q: str, anzahl: int = 5, sprache: str = "de") -> list[dict]:
    try:
        r = httpx.get(f"{API}/search", timeout=15, params={
            "key": key, "part": "snippet", "q": q, "type": "video", "maxResults": anzahl,
            "videoEmbeddable": "true", "safeSearch": "moderate", "relevanceLanguage": sprache,
            "regionCode": "DE"})
    except httpx.HTTPError as e:
        raise ToolError(f"YouTube nicht erreichbar: {e}") from e
    if r.status_code in (400, 403):
        grund = (r.json().get("error", {}).get("errors") or [{}])[0].get("reason", "")
        if grund in ("quotaExceeded", "dailyLimitExceeded"):
            raise ToolError("YouTube-Tageskontingent aufgebraucht – morgen geht es wieder")
        raise ToolError("YouTube-Schlüssel ungültig – bitte 'jarvis setup youtube' ausführen")
    r.raise_for_status()
    items = [i for i in r.json().get("items", []) if i.get("id", {}).get("videoId")]
    ids = [i["id"]["videoId"] for i in items]
    dauer = {}
    if ids:                                   # Länge nachladen (kostet kaum Kontingent)
        try:
            v = httpx.get(f"{API}/videos", timeout=15,
                          params={"key": key, "part": "contentDetails", "id": ",".join(ids)}).json()
            dauer = {x["id"]: _dauer(x["contentDetails"]["duration"]) for x in v.get("items", [])}
        except Exception:
            pass
    out = []
    for i in items:
        sn = i["snippet"]
        vid = i["id"]["videoId"]
        thumbs = sn.get("thumbnails") or {}
        out.append({"id": vid, "titel": _html(sn.get("title", "")), "kanal": _html(sn.get("channelTitle", "")),
                    "bild": (thumbs.get("medium") or thumbs.get("default") or {}).get("url", ""),
                    "dauer": dauer.get(vid, ""), "datum": sn.get("publishedAt", "")[:10],
                    "live": sn.get("liveBroadcastContent") == "live"})
    return out


def _html(s: str) -> str:
    import html
    return html.unescape(s or "")


def tools(cfg, secrets) -> list[Tool]:
    from atlas.keystore import get_secret

    def zeigen(suchbegriff: str, ueberschrift: str = "") -> dict:
        key = get_secret("youtube")
        if not key:
            raise ToolError("YouTube ist noch nicht eingerichtet (Terminal: 'jarvis setup youtube'). "
                            "Biete ersatzweise 'video_zeigen' an.")
        q = (suchbegriff or "").strip()
        if not q:
            raise ToolError("Suchbegriff fehlt")
        treffer = suchen(key, q)
        if not treffer:
            return {"angezeigt": False, "hinweis": f"Kein einbettbares YouTube-Video zu „{q}“ gefunden."}
        if anzeige.SINK:
            anzeige.SINK({"type": "youtube", "titel": ueberschrift or q, "videos": treffer})
        v = treffer[0]
        return {"angezeigt": bool(anzeige.SINK), "titel": v["titel"], "kanal": v["kanal"], "dauer": v["dauer"],
                "weitere": [f"{t['titel']} ({t['kanal']})" for t in treffer[1:]],
                "hinweis": "Das Video läuft stumm im Fenster; Ton schaltet der Nutzer mit „Ton an“ oder dem Knopf "
                           "zu. Antworte nur mit einem Satz (Titel, Kanal) – nichts zum Inhalt erfinden."}

    def steuern(aktion: str) -> dict:
        erlaubt = ("ton_an", "ton_aus", "pause", "weiter", "naechstes", "schliessen", "gross")
        if aktion not in erlaubt:
            raise ToolError("Aktion: " + ", ".join(erlaubt))
        if anzeige.SINK:
            anzeige.SINK({"type": "youtube_steuern", "aktion": aktion})
        return {"ok": True}

    return [
        Tool("youtube_zeigen",
             "YouTube durchsuchen und das beste Video eingebettet im Fenster abspielen (startet stumm, Ton "
             "zuschaltbar; weitere Treffer zum Umschalten). Standard, wenn der Nutzer ein Video sehen möchte "
             "(„Zeig mir ein Video von …“, „Such auf YouTube …“). Suchbegriff in der Sprache, in der es die "
             "besten Videos gibt.",
             "web.lesen", zeigen,
             {"suchbegriff": S("Suchbegriff für YouTube"), "ueberschrift": S("Kurze deutsche Überschrift")},
             ["suchbegriff"], label=lambda a: f"YouTube: {a.get('suchbegriff', '')}"),
        Tool("youtube_steuern",
             "Das gerade gezeigte YouTube-Video steuern: Ton an/aus, Pause, weiter, nächstes Video, groß, schließen.",
             "anzeige", steuern,
             {"aktion": S("Aktion", enum=["ton_an", "ton_aus", "pause", "weiter", "naechstes", "schliessen", "gross"])},
             ["aktion"]),
    ]
