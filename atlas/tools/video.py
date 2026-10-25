"""Kurze Videos aus Wikimedia Commons zeigen (frei lizenziert, stumm im Fenster).
Gleicher Weg wie bei Bildern: herunterladen, lokal ablegen, über /bild/<name> ausliefern."""
import hashlib
import re

import httpx

from atlas.tools import S, Tool, ToolError, anzeige
from atlas.tools.bild import API_COMMONS, DIR, UA, UNPASSEND, _aufraeumen, _get, _text

MAX_BYTES = 45_000_000


def _wahl(derivate: list[dict], dauer: float) -> dict | None:
    """Passende Fassung: VP9-WebM, 720p bevorzugt; 1080p nur bei kurzen Clips, sonst 480p."""
    vp9 = {d.get("transcodekey", ""): d for d in derivate
           if "webm" in d.get("type", "") and "vp9" in d.get("type", "") and d.get("transcodekey")}
    for key in ("720p.vp9.webm", *(["1080p.vp9.webm"] if dauer <= 30 else []), "480p.vp9.webm", "360p.vp9.webm"):
        if key in vp9:
            return vp9[key]
    return None


def kandidaten(q: str, anzahl: int = 1) -> list[dict]:
    d = _get(API_COMMONS, {"action": "query", "generator": "search", "gsrnamespace": 6, "gsrlimit": 15,
                           "gsrsearch": f"{q} filetype:video", "prop": "videoinfo",
                           "viprop": "url|mime|size|derivatives|extmetadata", "viurlwidth": 1280})
    out = []
    for p in sorted(d.get("query", {}).get("pages", []), key=lambda p: p.get("index", 0)):
        v = (p.get("videoinfo") or [{}])[0]
        dauer = float(v.get("duration") or 0)
        if not (2 <= dauer <= 150) or not v.get("thumburl") or UNPASSEND.search(p.get("title", "")):
            continue
        fassung = _wahl(v.get("derivatives") or [], dauer)
        if not fassung:
            continue
        meta = v.get("extmetadata") or {}
        out.append({"datei": p["title"], "video": fassung["src"], "poster": v["thumburl"], "dauer": dauer,
                    "breite": v.get("width", 16), "hoehe": v.get("height", 9),
                    "groesse": int(float(fassung.get("bandwidth") or 0) * dauer / 8),
                    "titel": _text((meta.get("ObjectName") or {}).get("value"))
                    or re.sub(r"^File:|\.\w+$", "", p["title"]),
                    "urheber": _text((meta.get("Artist") or {}).get("value")) or "unbekannt",
                    "lizenz": _text((meta.get("LicenseShortName") or {}).get("value")) or "siehe Quelle",
                    "seite": v.get("descriptionurl", "")})
    out = [c for c in out if c["groesse"] < MAX_BYTES]
    # kurze, gut aufgelöste Clips zuerst – aber Relevanz (Suchreihenfolge) bleibt das Hauptkriterium
    return out[:anzahl]


def _laden(url: str, ext: str) -> str:
    DIR.mkdir(parents=True, exist_ok=True)
    name = f"{hashlib.sha1(url.encode()).hexdigest()[:16]}.{ext}"
    ziel = DIR / name
    if not ziel.exists():
        tmp = ziel.with_suffix(".teil")
        n = 0
        with httpx.stream("GET", url, headers=UA, timeout=httpx.Timeout(10, read=60), follow_redirects=True) as r:
            r.raise_for_status()
            with open(tmp, "wb") as f:
                for chunk in r.iter_bytes(1 << 16):
                    n += len(chunk)
                    if n > MAX_BYTES:
                        f.close(); tmp.unlink(missing_ok=True)
                        raise ToolError("Video ist zu groß")
                    f.write(chunk)
        tmp.rename(ziel)
    return name


def zeigen(suchbegriff: str, ueberschrift: str = "") -> dict:
    q = (suchbegriff or "").strip()
    if not q:
        raise ToolError("Suchbegriff fehlt")
    _aufraeumen()
    try:
        treffer = kandidaten(q, 3)
    except httpx.HTTPError as e:
        raise ToolError(f"Videosuche nicht erreichbar: {e}") from e
    for c in treffer:                         # erster Clip, der sich laden lässt
        try:
            poster, video = _laden(c["poster"], "jpg"), _laden(c["video"], "webm")
        except (httpx.HTTPError, ToolError, OSError):
            continue
        eintrag = {"src": f"/bild/{poster}", "video": f"/bild/{video}", "titel": c["titel"],
                   "urheber": c["urheber"], "lizenz": c["lizenz"], "seite": c["seite"],
                   "seitenverhaeltnis": round(c["breite"] / max(1, c["hoehe"]), 3)}
        if anzeige.SINK:
            anzeige.SINK({"type": "bild", "titel": ueberschrift or q, "bilder": [eintrag]})
        return {"angezeigt": bool(anzeige.SINK), "titel": c["titel"], "dauer_s": round(c["dauer"]),
                "urheber": c["urheber"], "lizenz": c["lizenz"],
                "hinweis": "Das Video läuft stumm in Schleife im Fenster. Antworte nur mit ein, zwei Sätzen."}
    return {"angezeigt": False, "hinweis": f"Kein passendes freies Video zu '{q}' gefunden."}


def tools(cfg, secrets) -> list[Tool]:
    return [Tool(
        "video_zeigen",
        "Ein kurzes, frei lizenziertes Clip (Wikimedia Commons) stumm und in Schleife im Kern zeigen – "
        "zur Veranschaulichung beim Erklären oder wenn YouTube nicht eingerichtet ist. Für „Zeig mir ein "
        "Video von …“ sonst 'youtube_zeigen'. Suchbegriff kurz und möglichst auf Englisch.",
        "web.lesen", zeigen,
        {"suchbegriff": S("Kurzer Suchbegriff, bevorzugt Englisch"),
         "ueberschrift": S("Kurze deutsche Überschrift")},
        ["suchbegriff"],
        label=lambda a: f"Video suchen: {a.get('suchbegriff', '')}")]
