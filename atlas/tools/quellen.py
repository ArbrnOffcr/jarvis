"""Quellen einer Recherche im Browser öffnen – auf Richards Aufforderung, im Hintergrund.

JARVIS merkt sich die Quellen der letzten Recherche (aus der Websuche: zuerst die, die er in der Antwort tatsächlich
zitiert hat, danach die übrigen Treffer). „Öffne die Quellen“, „Öffne Quelle 2 und 3“ oder „Öffne alle Links“ öffnen
sie in Safari, ohne dass Safari nach vorn kommt (macOS: open -g).

Sicherheit: Das Modell kann nur Nummern aus dieser Liste wählen – nie eine selbst gebaute Adresse. So kann eine
eingeschleuste Anweisung in einer Webseite keine Daten in eine Adresse schreiben und abrufen lassen. Nur http(s),
keine Adressen mit Benutzername/Passwort, höchstens 15 auf einmal."""
from __future__ import annotations

import threading
from datetime import datetime
from urllib.parse import urlsplit

from atlas.tools import S, Tool, ToolError

MAX_LISTE = 40
MAX_AUF_EINMAL = 15
STANDARD = 8          # ohne Angabe: die zitierten Quellen, höchstens so viele


def url_sicher(url: str) -> str | None:
    try:
        u = urlsplit((url or "").strip())
    except ValueError:
        return None
    if u.scheme not in ("http", "https") or not u.hostname or u.username or u.password:
        return None
    if any(ch in url for ch in "\n\r\t \"'<>`"):
        return None
    return u.geturl()


class Quellen:
    def __init__(self, core):
        self.c = core
        self.lock = threading.Lock()
        self.liste: list[dict] = []          # [{nr, titel, url, zitiert}]
        self.am = ""

    # ---------------------------------------------------------- merken
    def merken(self, quellen: list[dict], neu: bool) -> list[dict]:
        """Quellen einer Antwort übernehmen. neu=True: erste Websuche dieser Antwort ersetzt die alte Liste."""
        with self.lock:
            alt = [] if neu else list(self.liste)
            gesehen = {q["url"] for q in alt}
            zitiert = [q for q in quellen if q.get("zitiert")]
            rest = [q for q in quellen if not q.get("zitiert")]
            # zitierte nach vorn – auch solche, die schon als einfacher Treffer in der Liste stehen
            for q in zitiert:
                u = url_sicher(q.get("url", ""))
                for a in alt:
                    if a["url"] == u and not a["zitiert"]:
                        a["zitiert"] = True
            for q in zitiert + rest:
                u = url_sicher(q.get("url", ""))
                if not u or u in gesehen:
                    continue
                gesehen.add(u)
                alt.append({"titel": (q.get("titel") or urlsplit(u).hostname or u)[:140], "url": u,
                            "zitiert": bool(q.get("zitiert"))})
            alt.sort(key=lambda q: not q["zitiert"])            # stabil: zitierte zuerst, sonst Reihenfolge der Suche
            self.liste = [{**q, "nr": i} for i, q in enumerate(alt[:MAX_LISTE], 1)]
            self.am = datetime.now().strftime("%d.%m. %H:%M")
            return list(self.liste)

    # ---------------------------------------------------------- Werkzeuge
    def anzeigen(self) -> dict:
        if not self.liste:
            return {"quellen": [], "hinweis": "Aus diesem Gespräch liegen keine Recherche-Quellen vor."}
        return {"stand": self.am, "quellen": [{k: q[k] for k in ("nr", "titel", "url", "zitiert")} for q in self.liste]}

    def oeffnen(self, nummern: list | None = None, alle: bool = False) -> dict:
        if not self.liste:
            raise ToolError("Es liegen keine Quellen aus einer Recherche vor – erst recherchieren, dann öffnen.")
        if nummern:
            try:
                wahl = sorted({int(n) for n in nummern})
            except (TypeError, ValueError):
                raise ToolError("nummern: ganze Zahlen aus der Quellenliste angeben")
            fehlend = [n for n in wahl if not 1 <= n <= len(self.liste)]
            if fehlend:
                raise ToolError(f"Quelle {', '.join(map(str, fehlend))} gibt es nicht – es gibt 1 bis {len(self.liste)}.")
            ziel = [self.liste[n - 1] for n in wahl]
        elif alle:
            ziel = list(self.liste)
        else:
            ziel = [q for q in self.liste if q["zitiert"]][:STANDARD] or self.liste[:min(5, len(self.liste))]
        weggelassen = max(0, len(ziel) - MAX_AUF_EINMAL)
        ziel = ziel[:MAX_AUF_EINMAL]
        from atlas import plattform
        geoeffnet, fehler = [], []
        for q in ziel:
            u = url_sicher(q["url"])                         # noch einmal prüfen, direkt vor dem Öffnen
            if not u:
                fehler.append(q["nr"])
                continue
            try:
                plattform.url_oeffnen(u, hintergrund=True)
                geoeffnet.append({"nr": q["nr"], "titel": q["titel"]})
            except Exception as e:
                fehler.append(q["nr"])
                if not geoeffnet and len(fehler) == len(ziel):
                    raise ToolError(f"Safari ließ sich nicht öffnen: {e}"[:200])
        out = {"geoeffnet": geoeffnet, "browser": "Safari im Hintergrund" if not plattform.WINDOWS else "Standardbrowser"}
        if weggelassen:
            out["hinweis"] = f"{weggelassen} weitere nicht geöffnet (höchstens {MAX_AUF_EINMAL} auf einmal)."
        if fehler:
            out["nicht_geoeffnet"] = fehler
        return out


def tools(core) -> list[Tool]:
    q = core.quellen
    return [
        Tool("quellen_oeffnen",
             "Quellen der letzten Recherche (Websuche) im Browser öffnen – Safari im Hintergrund auf diesem Mac. NUR auf "
             "Richards Aufforderung („Öffne die Quellen“, „Öffne den zweiten Link“, „Mach alle Links auf“). Ohne Angabe: "
             "die Quellen, die du in der Antwort genannt hast. Nummern beziehen sich auf die Quellenliste "
             "(quellen_liste); Adressen kannst du nicht selbst angeben.",
             "web.oeffnen", q.oeffnen,
             {"nummern": {"type": "array", "items": {"type": "integer"}, "description": "Nummern aus der Quellenliste, optional"},
              "alle": {"type": "boolean", "description": "alle Quellen der Recherche öffnen (höchstens 15)"}},
             label=lambda a: (f"Quellen {', '.join(map(str, a.get('nummern') or []))} in Safari öffnen" if a.get("nummern")
                              else "alle Quellen in Safari öffnen" if a.get("alle") else "genannte Quellen in Safari öffnen")),
        Tool("quellen_liste",
             "Die nummerierte Liste der Quellen der letzten Recherche (Titel, Adresse, ob in der Antwort zitiert) – z. B. "
             "um zu klären, welche Nummer Richard meint.",
             "web.lesen", q.anzeigen),
    ]
