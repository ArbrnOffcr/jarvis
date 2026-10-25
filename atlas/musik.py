"""Musik und Podcasts.

Apple Music: über die Musik-App des Macs (AppleScript). Titel, Alben, Künstler und Playlists aus deiner
Mediathek spielen sofort. Was nicht in der Mediathek ist, sucht JARVIS im Apple-Music-Katalog und öffnet es
in der Musik-App (Apple erlaubt fremden Programmen kein direktes Abspielen aus dem Katalog – startet es nicht
von selbst, einmal ▶ drücken; „Zur Mediathek hinzufügen“ macht es künftig direkt abspielbar).

Podcasts: Apple-Podcasts-Verzeichnis durchsuchen, Folge aus dem RSS-Feed im Dashboard abspielen
(eigener Player, merkt sich die Position). Die Podcasts-App selbst lässt sich nicht steuern."""
import json
import re
import subprocess
import threading
import time
import xml.etree.ElementTree as ET
from email.utils import parsedate_to_datetime
from pathlib import Path

import httpx

from atlas.paths import LOCAL_DIR
from atlas.tools import S, Tool, ToolError

COVER = LOCAL_DIR / "cache" / "cover.jpg"
ITUNES = "https://itunes.apple.com/search"
UA = {"User-Agent": "JARVIS-Privatassistent/1.0"}

MEDIATHEK = r"""
on run argv
  set q to item 1 of argv
  set art to item 2 of argv
  tell application "Music"
    if art is "playlist" then
      set pls to (every playlist whose name contains q)
      if (count of pls) is 0 then return "NICHT"
      play item 1 of pls
      return "PLAYLIST|" & (name of item 1 of pls)
    end if
    if art is "album" then
      set treffer to (every track of library playlist 1 whose album contains q)
    else if art is "kuenstler" then
      set treffer to (every track of library playlist 1 whose artist contains q)
    else
      set treffer to (every track of library playlist 1 whose name contains q)
      if (count of treffer) is 0 then set treffer to (search library playlist 1 for q)
    end if
    if (count of treffer) is 0 then return "NICHT"
    if (count of treffer) > 100 then set treffer to items 1 thru 100 of treffer
    if art is "titel" then
      play item 1 of treffer
    else
      if not (exists user playlist "JARVIS") then make new user playlist with properties {name:"JARVIS"}
      delete every track of user playlist "JARVIS"
      repeat with t in treffer
        duplicate t to user playlist "JARVIS"
      end repeat
      play user playlist "JARVIS"
    end if
    return "OK|" & (name of current track) & "|" & (artist of current track)
  end tell
end run"""

STATUS = r"""
on run argv
  if application "Music" is not running then return "AUS"
  tell application "Music"
    set st to player state as string
    if st is "stopped" then return "STOPP|" & sound volume
    set t to current track
    set aus to st & "|" & (name of t) & "|" & (artist of t) & "|" & (album of t) & "|" & (duration of t) & "|" & player position & "|" & sound volume & "|" & (persistent ID of t)
  end tell
  return aus
end run"""

COVER_SKRIPT = r"""
on run argv
  set ziel to item 1 of argv
  tell application "Music"
    set t to current track
    if (count of artworks of t) is 0 then return "KEIN"
    set d to raw data of artwork 1 of t
  end tell
  set f to open for access (POSIX file ziel) with write permission
  set eof f to 0
  write d to f
  close access f
  return "OK"
end run"""

BEFEHLE = {"pause": 'pause', "weiter": 'play', "play": 'play', "playpause": 'playpause', "naechster": 'next track',
           "vorheriger": 'previous track', "stopp": 'stop', "zurueck": 'back track'}


def _osa(skript: str, *args, timeout: int = 25) -> str:
    r = subprocess.run(["osascript", "-e", skript, *map(str, args)], capture_output=True, text=True, timeout=timeout)
    if r.returncode:
        err = r.stderr.strip()
        if "-1743" in err or "not authorized" in err.lower():
            raise ToolError("Keine Erlaubnis, die Musik-App zu steuern – Systemeinstellungen → Datenschutz & "
                            "Sicherheit → Automation → JARVIS/python → Musik erlauben.")
        raise ToolError(f"Musik: {err[-200:]}")
    return r.stdout.strip()


class Musik:
    def __init__(self, core):
        self.c = core
        self.quelle = ""                 # "music" | "podcast"
        self.letzter = {}
        self.cover_id = ""
        self.lauscht = 0.0               # bis wann aktiv abgefragt wird
        self.vor_ducken: int | None = None

    def start(self) -> None:
        threading.Thread(target=self._loop, name="musik", daemon=True).start()

    # ------------------------------------------------------------ Apple Music
    def abspielen(self, suche: str, art: str = "titel") -> dict:
        art = art if art in ("titel", "album", "kuenstler", "playlist") else "titel"
        suche = (suche or "").strip()
        if not suche:
            raise ToolError("Was soll ich spielen?")
        self._podcast_stoppen()
        # „Titel von Künstler“ → zuerst den Titelteil in der Mediathek suchen
        q = re.split(r"\s+(?:von|by)\s+", suche, maxsplit=1)[0] if art == "titel" else suche
        out = _osa(MEDIATHEK, q, art, timeout=60)
        if out.startswith(("OK", "PLAYLIST")):
            self.quelle, self.lauscht = "music", time.time() + 3600
            teile = out.split("|")
            self.c.broadcast({"type": "player_zeigen"})
            return {"spielt": " – ".join(teile[1:]) or suche, "quelle": "Mediathek"}
        return self._katalog(suche, art)

    def _katalog(self, suche: str, art: str) -> dict:
        entity = {"album": "album", "kuenstler": "song", "playlist": "song"}.get(art, "song")
        try:
            r = httpx.get(ITUNES, params={"term": suche, "country": "DE", "media": "music", "entity": entity,
                                          "limit": 5, "lang": "de_de"}, headers=UA, timeout=12)
            treffer = r.json().get("results", [])
        except (httpx.HTTPError, ValueError):
            treffer = []
        if not treffer:
            raise ToolError(f"„{suche}“ weder in der Mediathek noch bei Apple Music gefunden")
        t = treffer[0]
        url = t.get("trackViewUrl") or t.get("collectionViewUrl")
        subprocess.run(["open", "-a", "Music", url.replace("https://", "music://")], capture_output=True, timeout=15)
        self.quelle, self.lauscht = "music", time.time() + 3600
        time.sleep(3.5)
        try:
            if not _osa('tell application "Music" to return player state as string').startswith("playing"):
                _osa('tell application "Music" to play')
        except (ToolError, OSError):
            pass
        time.sleep(1.0)
        laeuft = False
        try:
            laeuft = _osa('tell application "Music" to return player state as string').startswith("playing")
        except (ToolError, OSError):
            pass
        name = " – ".join(x for x in (t.get("trackName") or t.get("collectionName"), t.get("artistName")) if x)
        self.c.broadcast({"type": "player_zeigen"})
        return {"titel": name, "quelle": "Apple Music Katalog", "spielt": laeuft,
                "hinweis": "Läuft." if laeuft else "In der Musik-App geöffnet, startet aber nicht von selbst (Apple-"
                "Beschränkung): einmal ▶ in der Musik-App drücken. Tipp: zur Mediathek hinzufügen, dann spielt "
                "JARVIS es künftig direkt."}

    def steuern(self, aktion: str, wert: int | None = None) -> dict:
        a = (aktion or "").lower()
        if self.quelle == "podcast":                     # Podcast läuft im Dashboard
            self.c.broadcast({"type": "player_befehl", "aktion": a, "wert": wert})
            return {"ok": True, "quelle": "Podcast"}
        if a in BEFEHLE:
            _osa(f'tell application "Music" to {BEFEHLE[a]}')
        elif a in ("lauter", "leiser", "lautstaerke"):
            akt = int(_osa('tell application "Music" to return sound volume') or 50)
            neu = wert if a == "lautstaerke" and wert is not None else akt + (15 if a == "lauter" else -15)
            _osa(f'tell application "Music" to set sound volume to {max(0, min(100, int(neu)))}')
        elif a == "zufall":
            _osa('tell application "Music" to set shuffle enabled to not shuffle enabled')
        elif a == "position" and wert is not None:
            _osa(f'tell application "Music" to set player position to {int(wert)}')
        else:
            raise ToolError("Unbekannte Aktion")
        self.lauscht = time.time() + 3600
        threading.Timer(0.4, self._status_senden).start()
        return {"ok": True}

    def jetzt(self) -> dict:
        if self.quelle == "podcast" and self.letzter.get("quelle") == "podcast":
            return self.letzter
        s = self.status()
        return s if s.get("titel") else {"spielt": False, "hinweis": "Gerade läuft nichts."}

    def status(self) -> dict:
        try:
            out = _osa(STATUS, timeout=8)
        except (ToolError, subprocess.SubprocessError, OSError):
            return {"quelle": "music", "zustand": "aus"}
        if out == "AUS" or out.startswith("STOPP"):
            return {"quelle": "music", "zustand": "stopp"}
        p = out.split("|")
        if len(p) < 8:
            return {"quelle": "music", "zustand": "stopp"}
        zustand = {"playing": "spielt", "paused": "pause"}.get(p[0], p[0])
        s = {"quelle": "music", "zustand": zustand, "titel": p[1], "kuenstler": p[2], "album": p[3],
             "dauer": _zahl(p[4]), "position": _zahl(p[5]), "lautstaerke": int(_zahl(p[6])), "id": p[7]}
        if p[7] != self.cover_id:
            self.cover_id = p[7]
            try:
                COVER.parent.mkdir(parents=True, exist_ok=True)
                ok = _osa(COVER_SKRIPT, str(COVER), timeout=10) == "OK"
            except (ToolError, subprocess.SubprocessError, OSError):
                ok = False
            s["cover_neu"] = ok
        s["cover"] = f"/musik/cover?v={p[7]}" if COVER.exists() else ""
        return s

    def _status_senden(self) -> None:
        if self.quelle != "music":
            return
        s = self.status()
        if s != self.letzter:
            self.letzter = s
            self.c.broadcast({"type": "player", **s})

    def _loop(self) -> None:
        while True:
            time.sleep(2)
            try:
                if self.quelle == "music" and self.c.ws_clients and time.time() < self.lauscht:
                    self._status_senden()
                elif not self.quelle and self.c.ws_clients:
                    # Musik am Mac von Hand gestartet? Dann Player einblenden (alle 10 s prüfen)
                    if int(time.time()) % 10 < 2 and subprocess.run(["pgrep", "-x", "Music"],
                                                                    capture_output=True).returncode == 0:
                        s = self.status()
                        if s.get("zustand") == "spielt":
                            self.quelle, self.lauscht = "music", time.time() + 3600
            except Exception:
                pass

    def ducken(self, an: bool) -> None:
        """Während JARVIS spricht, Musik leiser stellen."""
        if self.quelle != "music":
            return
        try:
            if an and self.vor_ducken is None:
                self.vor_ducken = int(_osa('tell application "Music" to return sound volume') or 50)
                _osa(f'tell application "Music" to set sound volume to {max(5, self.vor_ducken // 4)}')
            elif not an and self.vor_ducken is not None:
                _osa(f'tell application "Music" to set sound volume to {self.vor_ducken}')
                self.vor_ducken = None
        except (ToolError, subprocess.SubprocessError, OSError):
            pass

    # ------------------------------------------------------------ Podcasts
    def podcast(self, sendung: str, folge: str = "") -> dict:
        try:
            r = httpx.get(ITUNES, params={"term": sendung, "country": "DE", "media": "podcast", "entity": "podcast",
                                          "limit": 3}, headers=UA, timeout=12)
            treffer = [t for t in r.json().get("results", []) if t.get("feedUrl")]
        except (httpx.HTTPError, ValueError):
            treffer = []
        if not treffer:
            raise ToolError(f"Podcast „{sendung}“ nicht gefunden")
        p = treffer[0]
        folgen = self._feed(p["feedUrl"])
        if not folgen:
            raise ToolError("Keine abspielbare Folge im Feed")
        wahl = folgen[0]
        if folge and folge.lower() not in ("neueste", "aktuelle", "letzte", "neu"):
            worte = [w for w in re.findall(r"\w{3,}", folge.lower())]
            beste = max(folgen[:200], key=lambda f: sum(w in f["titel"].lower() for w in worte))
            if any(w in beste["titel"].lower() for w in worte):
                wahl = beste
        try:
            if self.quelle == "music" or subprocess.run(["pgrep", "-x", "Music"], capture_output=True).returncode == 0:
                _osa('tell application "Music" to pause')
        except (ToolError, subprocess.SubprocessError, OSError):
            pass
        self.quelle = "podcast"
        self.letzter = {"quelle": "podcast", "zustand": "spielt", "titel": wahl["titel"], "kuenstler": p.get("collectionName"),
                        "datum": wahl["datum"], "cover": wahl.get("bild") or p.get("artworkUrl600") or ""}
        self.c.broadcast({"type": "podcast", "url": wahl["url"], "titel": wahl["titel"],
                          "sendung": p.get("collectionName"), "datum": wahl["datum"], "dauer": wahl["dauer"],
                          "cover": self.letzter["cover"]})
        return {"spielt": wahl["titel"], "sendung": p.get("collectionName"), "vom": wahl["datum"],
                "hinweis": "Läuft im JARVIS-Player (nicht in der Podcasts-App)."}

    def _feed(self, url: str) -> list[dict]:
        try:
            r = httpx.get(url, headers=UA, timeout=20, follow_redirects=True)
            root = ET.fromstring(r.content)
        except (httpx.HTTPError, ET.ParseError):
            return []
        ns = {"itunes": "http://www.itunes.com/dtds/podcast-1.0.dtd"}
        out = []
        for it in root.iter("item"):
            enc = it.find("enclosure")
            if enc is None or not enc.get("url"):
                continue
            try:
                datum = parsedate_to_datetime(it.findtext("pubDate") or "").strftime("%d.%m.%Y")
            except (TypeError, ValueError):
                datum = ""
            bild = it.find("itunes:image", ns)
            out.append({"titel": (it.findtext("title") or "").strip(), "url": enc.get("url"), "datum": datum,
                        "dauer": _dauer_sek(it.findtext("itunes:duration", default="", namespaces=ns)),
                        "bild": bild.get("href") if bild is not None else ""})
        return out

    def _podcast_stoppen(self) -> None:
        if self.quelle == "podcast":
            self.c.broadcast({"type": "player_befehl", "aktion": "stopp"})
        self.quelle = ""

    def player_meldung(self, d: dict) -> None:
        """Vom Dashboard: Zustand des Podcast-Players."""
        if d.get("quelle") == "podcast":
            self.letzter = {**self.letzter, **d}
            if d.get("zustand") == "stopp":
                self.quelle = ""


def _zahl(s: str) -> float:
    try:
        return float(str(s).replace(",", "."))
    except ValueError:
        return 0.0


def _dauer_sek(s: str) -> int:
    s = (s or "").strip()
    if not s:
        return 0
    if s.isdigit():
        return int(s)
    teile = [int(x) for x in s.split(":") if x.isdigit()]
    n = 0
    for t in teile:
        n = n * 60 + t
    return n


def tools(core) -> list[Tool]:
    m = core.musik
    return [
        Tool("musik_abspielen", "Musik über Apple Music/Musik-App abspielen: Titel, Album, Künstler oder Playlist. "
             "Zuerst aus der Mediathek, sonst aus dem Apple-Music-Katalog.", "musik", m.abspielen,
             {"suche": S("z. B. 'Bohemian Rhapsody Queen' oder Playlist-Name"),
              "art": S("titel, album, kuenstler oder playlist", enum=["titel", "album", "kuenstler", "playlist"])},
             ["suche"], label=lambda a: f"Musik: {a.get('suche')}"),
        Tool("podcast_abspielen", "Podcast-Folge abspielen (Apple-Podcasts-Verzeichnis). folge leer = neueste Folge, "
             "sonst Stichwort aus dem Folgentitel.", "musik", m.podcast,
             {"sendung": S("Name des Podcasts"), "folge": S("optional: Stichwort oder 'neueste'")}, ["sendung"],
             label=lambda a: f"Podcast: {a.get('sendung')}"),
        Tool("musik_steuern", "Wiedergabe steuern (Musik oder Podcast): pause, weiter, naechster, vorheriger, stopp, "
             "lauter, leiser, lautstaerke (wert 0–100), zufall, position (wert Sekunden).", "musik", m.steuern,
             {"aktion": S("Aktion", enum=["pause", "weiter", "naechster", "vorheriger", "stopp", "lauter", "leiser",
                                          "lautstaerke", "zufall", "position"]),
              "wert": {"type": "integer"}}, ["aktion"]),
        Tool("musik_jetzt", "Was läuft gerade? (Titel, Künstler, Album bzw. Podcast-Folge)", "musik", m.jetzt),
    ]
