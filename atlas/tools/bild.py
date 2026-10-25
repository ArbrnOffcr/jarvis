"""Bilder aus dem Internet zeigen – Quelle: Google Bilder (über Serper.dev, Schlüssel im Schlüsselbund),
ersatzweise Wikipedia/Wikimedia Commons (frei lizenziert).
Der Kern lädt das Bild herunter und legt es lokal ab; das Dashboard holt es über /bild/<name>
und blendet es in den 3D-Kern ein. Urheber und Lizenz werden immer mitgeführt."""
import hashlib
import html
import re
import time

import httpx

from atlas.paths import LOCAL_DIR
from atlas.tools import S, Tool, ToolError, anzeige

DIR = LOCAL_DIR / "bilder"
NAME_RE = re.compile(r"^[0-9a-f]{16}\.(jpg|png|webp|webm)$")
UA = {"User-Agent": "JARVIS-Privatassistent/1.0 (privater Assistent) httpx"}
BROWSER = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_6) AppleWebKit/605.1.15 (KHTML, like Gecko) "
                         "Version/18.0 Safari/605.1.15", "Accept": "image/avif,image/webp,image/jpeg,image/png,*/*;q=0.8"}
SERPER = "https://google.serper.dev/images"
# Bildagenturen mit Wasserzeichen und Seiten, die Bilder nur als Vorschau ausliefern
MEIDEN = re.compile(r"shutterstock|alamy|gettyimages|istockphoto|dreamstime|depositphotos|123rf|stock\.adobe|"
                    r"agefotostock|pond5|bigstock|canstockphoto|pinterest|pinimg|facebook|instagram|tiktok|x\.com|twitter", re.I)
API_COMMONS = "https://commons.wikimedia.org/w/api.php"
UNPASSEND = re.compile(r"\b(map|karte|diagram|diagramm|logo|flag|flagge|coat of arms|wappen|icon|chart|"
                       r"range|distribution|verbreitung|stamp|briefmarke|signature|unterschrift)\b", re.I)
EXT = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp"}


def _get(url: str, params: dict) -> dict:
    r = httpx.get(url, params={**params, "format": "json", "formatversion": 2},
                  headers=UA, timeout=10, follow_redirects=True)
    r.raise_for_status()
    return r.json()


def _text(v) -> str:
    """HTML aus den Wikimedia-Metadaten in schlichten Text wandeln."""
    v = re.sub(r"<[^>]+>", "", str(v or ""))
    return re.sub(r"\s+", " ", html.unescape(v)).strip()[:160]


def _lead_files(q: str) -> list[str]:
    """Hauptbild des passenden Wikipedia-Artikels – erst exakter Titel, dann bester Suchtreffer."""
    files: list[str] = []
    for params in ({"titles": q, "redirects": 1}, {"generator": "search", "gsrsearch": q, "gsrlimit": 1}):
        for lang in ("en", "de"):
            try:
                d = _get(f"https://{lang}.wikipedia.org/w/api.php", {
                    "action": "query", "prop": "pageimages", "piprop": "name", "pilicense": "free", **params})
            except httpx.HTTPError:
                continue
            for p in d.get("query", {}).get("pages", []):
                f = f"File:{p['pageimage']}" if p.get("pageimage") else None
                if f and f not in files:
                    files.append(f)
        if files:
            break
    return files


def _infos(params: dict) -> list[dict]:
    d = _get(API_COMMONS, {**params, "action": "query", "prop": "imageinfo",
                           "iiprop": "url|mime|size|extmetadata", "iiurlwidth": 1280})   # Standardgröße (Wikimedia drosselt andere)
    pages = sorted(d.get("query", {}).get("pages", []), key=lambda p: p.get("index", 0))
    out = []
    for p in pages:
        ii = (p.get("imageinfo") or [{}])[0]
        if not ii.get("thumburl"):
            continue
        meta = ii.get("extmetadata") or {}
        out.append({"datei": p.get("title", ""), "url": ii["thumburl"], "mime": ii.get("mime", ""),
                    "breite": ii.get("width", 0), "hoehe": ii.get("height", 0),
                    "titel": _text((meta.get("ObjectName") or {}).get("value"))
                    or re.sub(r"^File:|\.\w+$", "", p.get("title", "")),
                    "urheber": _text((meta.get("Artist") or {}).get("value")) or "unbekannt",
                    "lizenz": _text((meta.get("LicenseShortName") or {}).get("value")) or "siehe Quelle",
                    "seite": ii.get("descriptionurl", "")})
    return out


def _passt(c: dict) -> bool:
    return (c["mime"] in EXT and min(c["breite"], c["hoehe"]) >= 400
            and 0.4 <= c["breite"] / max(1, c["hoehe"]) <= 2.6
            and not UNPASSEND.search(c["datei"] + " " + c["titel"]))


def kandidaten(q: str, anzahl: int) -> list[dict]:
    files = _lead_files(q)
    found = []
    if files:
        found += _infos({"titles": "|".join(files[:6])})
    if len([c for c in found if _passt(c)]) < anzahl:
        found += _infos({"generator": "search", "gsrnamespace": 6, "gsrlimit": 15,
                         "gsrsearch": f"{q} filetype:bitmap"})
    seen, out = set(), []
    for c in found:
        if c["datei"] in seen or not _passt(c):
            continue
        seen.add(c["datei"])
        out.append(c)
    return out[:anzahl]


# ---------------------------------------------------------------- Google Bilder (Serper.dev)
def google_kandidaten(key: str, q: str, anzahl: int) -> list[dict]:
    r = httpx.post(SERPER, headers={"X-API-KEY": key, "Content-Type": "application/json"},
                   json={"q": q, "gl": "de", "hl": "de", "num": 30}, timeout=12)
    if r.status_code in (401, 403):
        raise ToolError("Google-Bildersuche: Schlüssel ungültig oder Guthaben aufgebraucht ('jarvis setup bilder')")
    r.raise_for_status()
    gut, mittel = [], []
    for i, b in enumerate(r.json().get("images") or []):
        url, w, h = b.get("imageUrl", ""), int(b.get("imageWidth") or 0), int(b.get("imageHeight") or 0)
        titel, quelle = b.get("title") or q, b.get("source") or b.get("domain") or ""
        if not url.startswith("http") or re.search(r"\.(svg|gif)(\?|$)", url, re.I):
            continue
        if MEIDEN.search(url + " " + (b.get("link") or "") + " " + quelle) or UNPASSEND.search(titel) \
                or re.search(r"logo|clip.?art|icon|vektor|vector|cartoon|comic|zeichnung|illustration|ausmalbild|"
                             r"transparent|sticker|emoji|meme", titel + " " + url, re.I):
            continue
        if not w or not h or not (0.5 <= w / h <= 2.2) or min(w, h) < 450:
            continue
        c = {"datei": url, "url": url, "mime": "google", "breite": w, "hoehe": h, "titel": titel[:120],
             "urheber": quelle[:80], "lizenz": "über Google Bilder", "seite": b.get("link") or url, "rang": i}
        (gut if min(w, h) >= 800 else mittel).append(c)
    # Googles Reihenfolge (Relevanz) bleibt maßgeblich; hochauflösende zuerst
    return (gut + mittel)[: max(anzahl * 4, 8)]


def _laden_google(c: dict) -> str:
    """Bild laden, prüfen und als JPEG neu speichern (entfernt Metadaten, begrenzt die Größe)."""
    from io import BytesIO
    from PIL import Image
    DIR.mkdir(parents=True, exist_ok=True)
    name = f"{hashlib.sha1(c['url'].encode()).hexdigest()[:16]}.jpg"
    ziel = DIR / name
    if ziel.exists():
        return name
    data = b""
    with httpx.stream("GET", c["url"], headers=BROWSER, timeout=httpx.Timeout(8, read=15), follow_redirects=True) as r:
        r.raise_for_status()
        if not r.headers.get("content-type", "image/").startswith("image/"):
            raise ToolError("keine Bilddatei")
        for chunk in r.iter_bytes():
            data += chunk
            if len(data) > 15_000_000:
                raise ToolError("Bild ist zu groß")
    with Image.open(BytesIO(data)) as img:
        img = img.convert("RGB")
        if min(img.size) < 380:
            raise ToolError("Bild zu klein")
        img.thumbnail((2000, 2000))
        c["breite"], c["hoehe"] = img.size
        img.save(ziel, "JPEG", quality=88)
    return name


def _laden(c: dict) -> str:
    if c.get("mime") == "google":
        return _laden_google(c)
    DIR.mkdir(parents=True, exist_ok=True)
    name = f"{hashlib.sha1(c['url'].encode()).hexdigest()[:16]}.{EXT[c['mime']]}"
    ziel = DIR / name
    if not ziel.exists():
        with httpx.stream("GET", c["url"], headers=UA, timeout=20, follow_redirects=True) as r:
            r.raise_for_status()
            data = b""
            for chunk in r.iter_bytes():
                data += chunk
                if len(data) > 12_000_000:
                    raise ToolError("Bild ist zu groß")
        ziel.write_bytes(data)
    return name


def _aufraeumen(tage: int = 7) -> None:
    if not DIR.exists():
        return
    grenze = time.time() - tage * 86400
    for f in DIR.iterdir():
        try:
            if f.stat().st_mtime < grenze:
                f.unlink()
        except OSError:
            pass


def zeigen(suchbegriff: str, anzahl: int = 1, ueberschrift: str = "") -> dict:
    q = (suchbegriff or "").strip()
    if not q:
        raise ToolError("Suchbegriff fehlt")
    anzahl = max(1, min(3, int(anzahl or 1)))
    _aufraeumen()
    from atlas.keystore import get_secret
    treffer = []
    key = get_secret("serper")
    if key:
        try:
            treffer = google_kandidaten(key, q, anzahl)
        except (httpx.HTTPError, ToolError, ValueError):
            treffer = []
    if not treffer:                                   # Ersatz: Wikimedia Commons
        try:
            treffer = kandidaten(q, anzahl)
        except httpx.HTTPError as e:
            raise ToolError(f"Bildersuche nicht erreichbar: {e}") from e
    if not treffer:
        return {"angezeigt": False, "hinweis": f"Kein passendes Bild zu '{q}' gefunden."}
    bilder = []
    for c in treffer:
        if len(bilder) >= anzahl:
            break
        try:
            bilder.append({"src": f"/bild/{_laden(c)}", "titel": c["titel"], "urheber": c["urheber"],
                           "lizenz": c["lizenz"], "seite": c["seite"],
                           "seitenverhaeltnis": round(c["breite"] / max(1, c["hoehe"]), 3)})
        except (httpx.HTTPError, ToolError, OSError):
            continue
    if not bilder:
        raise ToolError("Bilder konnten nicht geladen werden")
    if anzeige.SINK:
        anzeige.SINK({"type": "bild", "titel": ueberschrift or q, "bilder": bilder})
    return {"angezeigt": bool(anzeige.SINK),
            "bilder": [{"titel": b["titel"], "urheber": b["urheber"], "lizenz": b["lizenz"]} for b in bilder],
            "hinweis": "Das Bild ist im Fenster zu sehen (Urheber und Lizenz stehen darunter). "
                       "Antworte nur mit ein, zwei Sätzen dazu."}


def tools(cfg, secrets) -> list[Tool]:
    return [Tool(
        "bild_zeigen",
        "Ein oder mehrere Fotos aus dem Internet (Google Bilder, ersatzweise Wikimedia) suchen und im "
        "Fenster einblenden. Nutzen, wenn nach einem Bild, Foto oder Aussehen von etwas gefragt wird "
        "('Zeig mir ein Bild von einem Elefanten'). Suchbegriff so, wie man ihn bei Google eingeben würde, "
        "präzise (z. B. 'Afrikanischer Elefant Savanne', 'Brandenburger Tor').",
        "web.lesen", zeigen,
        {"suchbegriff": S("Suchbegriff wie bei Google"),
         "anzahl": {"type": "integer", "minimum": 1, "maximum": 3, "description": "Anzahl Bilder (Standard 1)"},
         "ueberschrift": S("Kurze deutsche Überschrift, z. B. 'Afrikanischer Elefant'")},
        ["suchbegriff"],
        label=lambda a: f"Bild suchen: {a.get('suchbegriff', '')}")]
