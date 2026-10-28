"""JARVIS-Core: der Hintergrunddienst mit der gesamten Logik.

Oberflächen (Terminal, später Dashboard, Sprache, Telegram) verbinden sich
per WebSocket auf 127.0.0.1 und weisen sich mit dem Zugangsschlüssel aus.

Nachrichten Oberfläche -> Kern:
  {"type":"chat","text":"..."}          Frage stellen
  {"type":"mode","value":"auto|lokal|claude|sonnet|opus|haiku"}
  {"type":"clear"}                      Gesprächsverlauf leeren
  {"type":"confirm","id":"..","answer":true|false}
Kern -> Oberfläche:
  route, delta, tool, confirm, done, info, error
"""
import asyncio
import json
import subprocess
import threading
import re
import time
import uuid
from datetime import date, datetime, timedelta
from pathlib import Path

import uvicorn
from fastapi import (Cookie, Depends, FastAPI, Header, HTTPException, Request, WebSocket,
                     WebSocketDisconnect)
from fastapi.responses import FileResponse, RedirectResponse, Response
from fastapi.staticfiles import StaticFiles

from atlas import __version__
from atlas.audit import Audit
from atlas.config import load_config
from atlas.keystore import core_token, get_secret
from atlas.paths import HOST, LOCAL_DIR, PORT, USER, display_name, find_archive, shared_dir
from atlas.permissions import Gate, Level
from atlas.persona import system_prompt
from atlas.providers import ClaudeProvider, OllamaProvider, ProviderError
from atlas.archiv.indexer import Archiv
from atlas.lage import Lagebild
from atlas.proaktiv import Proaktiv
from atlas.memory import Memory
from atlas import macos, voice
from atlas.voice import Speaker, Transcriber, VoiceSession
from atlas.router import Router
from atlas import werkzeugwahl
from atlas.tools import ToolError, anzeige, build_tools


class Core:
    def __init__(self):
        self.cfg = load_config()
        self.audit = Audit(self.cfg)
        self.gate = Gate(self.cfg, self.audit)
        self.router = Router(self.cfg)
        self.token = core_token()
        self.name = (self.cfg.get("name") or "").strip() or display_name()
        from atlas import persona as _persona
        _persona.ZUSATZ = str((self.cfg.get("persona") or {}).get("zusatz") or "")
        from atlas import hilfen as _hilfen
        _ar = self.cfg.get("archiv") or {}
        _hilfen.AUSGESCHLOSSEN = tuple(str(x) for x in [*(_ar.get("ausschluss") or []),
                                                        *(_ar.get("ablage_ausschluss") or [])])
        self.providers = {
            "lokal": OllamaProvider(self.cfg["local"]),
            "claude": ClaudeProvider(get_secret("anthropic"), self.cfg["recherche"],
                                     (self.cfg.get("wetter") or {}).get("ort", "")),
        }
        self.secrets = {k: get_secret(k) for k in ("icloud_email", "icloud_apple_id", "icloud_app_pw")}
        self.memory = Memory(self.cfg)
        self.shared = shared_dir(self.cfg)
        archive = find_archive(self.cfg)
        self.archiv = Archiv(self.cfg, archive, self.shared, self.audit) if archive else None
        self.tools = build_tools(self.cfg, self.secrets, self.memory, self.archiv, self.shared)
        self.lage = Lagebild(self)
        self.speaker = Speaker()
        self.transcriber = Transcriber()
        self.ws_clients: set = set()
        self.loop = None
        self.proaktiv = Proaktiv(self)
        from atlas.workflows import beihilfe as wf_beihilfe
        self.beihilfe = wf_beihilfe.Beihilfe(self)
        if self.beihilfe.aktiv and self.archiv:
            self.tools.update({t.name: t for t in wf_beihilfe.tools(self)})
        from atlas import nachrichten
        from atlas.workflows import werbung
        self.nachrichten = nachrichten.Nachrichten(self)
        self.werbung = werbung.Werbung(self)
        self.tools.update({t.name: t for t in nachrichten.tools(self)})
        if self.secrets.get("icloud_app_pw"):
            self.tools.update({t.name: t for t in werbung.tools(self)})
        # Dokumente im Chat, Posteingang, Fristen, Steuer-Sammelmappe, Wochenplan
        from atlas import dokumente, wochenplan
        from atlas.workflows import fristen, post, steuer
        self.fristen = fristen.Fristen(self)
        self.steuer = steuer.Steuer(self)
        self.post = post.Post(self)
        self.dokumente = dokumente.Dokumente(self)
        self.wochenplan = wochenplan.Wochenplan(self)
        from atlas import schreibstil, vergessen
        from atlas.workflows import vertraege
        self.vertraege = vertraege.Vertraege(self)
        self.schreibstil = schreibstil.Schreibstil(self)
        self.vergessen = vergessen.Vergessen(self)
        self.tools.update({t.name: t for t in fristen.tools(self) + wochenplan.tools(self)
                           + vertraege.tools(self) + vergessen.tools(self)})
        if self.secrets.get("icloud_app_pw"):
            self.tools.update({t.name: t for t in schreibstil.tools(self)})
        if self.archiv:
            self.tools.update({t.name: t for t in dokumente.tools(self) + post.tools(self) + steuer.tools(self)})
        # Karte/Routen, Timer/Wecker, Musik/Podcasts
        from atlas import musik as _musik, timer as _timer
        from atlas.tools import karte as _karte
        self.karte = _karte.Karte(self)
        self.timer = _timer.Timer(self)
        self.musik = _musik.Musik(self)
        self.tools.update({t.name: t for t in _karte.tools(self) + _timer.tools(self) + _musik.tools(self)})
        # Standort: Wetter dort, wo ich bin – und an heutigen Reisezielen (> 50 km)
        from atlas.standort import Standort
        from atlas.tools import wetter as _wetter_mod
        self.standort = Standort(self)
        # Tesla (Fleet API): Status, Klima, Laden, Ladeplanung
        from atlas import tesla as _tesla
        self.tesla = _tesla.Tesla(self)
        self.tools.update({t.name: t for t in _tesla.tools(self)})
        # Ford (FordConnect Query): nur Status – vorbereitet bis zur Übergabe
        from atlas import ford as _ford
        self.ford = _ford.Ford(self)
        self.tools.update({t.name: t for t in _ford.tools(self)})
        # HESTIA (IMMO): Immobilien, Mieter, Darlehen, Kennzahlen
        from atlas import immobilien as _immo
        self.immobilien = _immo.Immobilien(self)
        self.tools.update({t.name: t for t in _immo.tools(self)})
        from atlas import mailwache as _mw
        self.mailwache = _mw.MailWache(self)
        if self.secrets.get("icloud_app_pw"):
            self.tools.update({t.name: t for t in _mw.tools(self)})
        from atlas.grundriss import Grundriss
        self.grundriss = Grundriss(self)
        from atlas.workflows import nebenkosten as _nk
        self.nebenkosten = _nk.Nebenkosten(self)
        self.tools.update({t.name: t for t in _nk.tools(self)})
        # Butler Stufe 1: Schutz gegen eingeschleuste Anweisungen + Befugnisregister
        from atlas.sicherheit import Sicherheit
        from atlas import befugnisse as _bef
        self.sicherheit = Sicherheit(self)
        self.befugnisse = _bef.Befugnisse(self)
        self.tools.update({t.name: t for t in _bef.tools(self)})
        from atlas import rechenschaft as _rs, aufmerksamkeit as _auf
        self.rechenschaft = _rs.Rechenschaft(self)
        self.tools.update({t.name: t for t in _rs.tools(self)})
        self.aufmerksamkeit = _auf.Aufmerksamkeit(self)
        self.tools.update({t.name: t for t in _auf.tools(self)})
        from atlas import ziele as _ziele, persona as _persona
        self.ziele = _ziele.Ziele(self)
        self.tools.update({t.name: t for t in _ziele.tools(self)})
        _persona.ZIELE_FN = self.ziele.persona_zeile
        from atlas import notfall as _notfall
        self.notfall = _notfall.Notfall(self)
        self.tools.update({t.name: t for t in _notfall.tools(self)})
        _persona.NOTFALL_FN = self.notfall.persona
        from atlas import zuhause as _zh
        self.zuhause = _zh.Zuhause(self)
        self.tools.update({t.name: t for t in _zh.tools(self)})
        from atlas import werkzeugwahl as _ww
        _ww.IMMER_FN = lambda: {"notfall", "fristen", "kontakte", "mail", "kalender"} if self.notfall.aktiv() else set()
        _wetter_mod.ORT = self.standort.wetter_ort
        _wetter_mod.ZIELE = self.standort.reiseziele
        # Stab: JARVIS als Chef des Stabes mit Sachgebietsagenten (Einstellungen → Stab)
        from atlas.stab import Stab
        self.stab = Stab(self)
        self.tools.update({t.name: t for t in self.stab.tools()})
        from atlas.tools import Tool as _Tool, S as _S
        self.tools["kontakt_aus_dokument"] = _Tool(
            "kontakt_aus_dokument",
            "Kontaktdaten aus einem hineingezogenen Bild/Dokument (Visitenkarte, Signatur, Briefkopf) lokal lesen "
            "und dem Nutzer als Karte zum Bestätigen zeigen. Danach nichts weiter tun – angelegt wird per Klick.",
            "kontakte.lesen", lambda dokument_id: kontakt_vorschlag(dokument_id),
            {"dokument_id": _S("id aus <dokument id=…>")}, ["dokument_id"])
        self.tools["einfuehrung_starten"] = _Tool(
            "einfuehrung_starten",
            "Die geführte Einführung (Tutorial) im Dashboard starten – wenn der Nutzer sie sehen oder wiederholen will.",
            "kalender.lesen", lambda: (self.broadcast({"type": "einfuehrung"}), {"gestartet": True})[1])
        from atlas.aktualisierung import Aktualisierung
        self.update = Aktualisierung(self)
        self.chats_aktiv = 0
        self.aufnahmen_aktiv = 0
        anzeige.SINK = self.broadcast

    def broadcast(self, msg: dict) -> None:
        """Nachricht an alle offenen Dashboards (aus beliebigem Thread)."""
        if not self.loop:
            return
        for ws in list(self.ws_clients):
            try:
                asyncio.run_coroutine_threadsafe(ws.send_json(msg), self.loop)
            except Exception:
                pass

    def status(self) -> dict:
        lokal, claude = self.providers["lokal"], self.providers["claude"]
        from atlas import lizenz
        info = {"version": __version__, "update": self.update.stand, "user": USER, "name": self.name,
                "kennung": lizenz.kennung() if lizenz.betroffen(self.cfg) else "", "gesperrt": lizenz.gesperrt(),
                "host": HOST, "notaus": self.gate.notaus,
                "archiv": str(find_archive(self.cfg) or "nicht gefunden"),
                "gemeinsam": str(shared_dir(self.cfg)),
                "icloud": self.secrets.get("icloud_email") or "nicht eingerichtet",
                "werkzeuge": len(self.tools),
                "icloud_nachladen": macos.ICLOUD_OK,
                "config_fehler": self.cfg.get("_config_fehler", ""),
                "index": self.index_status(),
                "lokal": None, "claude": None,
                "verbrauch_monat": self.audit.month_usage(),
                "kosten_monat": self.costs()}
        try:
            info["lokal"] = lokal.resolve_model()
        except ProviderError as e:
            info["lokal"] = f"– ({e})"
        try:
            info["claude"] = claude.resolve_model(self.cfg["claude"]["default"])
        except Exception as e:
            info["claude"] = f"– ({e})"
        return info

    def family(self, model: str) -> str:
        for fam in self.cfg["preise"]:
            if fam in model.lower():
                return fam
        return "sonstige"

    def costs_cached(self) -> dict:
        """Kosten höchstens alle 60 s neu berechnen (liest Dateien aus iCloud)."""
        hit = getattr(self, "_costs_cache", None)
        if hit and time.monotonic() - hit[0] < 60:
            return hit[1]
        k = self.costs(); self._costs_cache = (time.monotonic(), k)
        return k

    def digest_cached(self) -> str:
        """Gedächtnis-Auszug für den Systemprompt, 30 s zwischengespeichert."""
        hit = getattr(self, "_digest_cache", None)
        if hit and time.monotonic() - hit[0] < 30:
            return hit[1]
        d = self.memory.digest(); self._digest_cache = (time.monotonic(), d)
        return d

    def costs(self) -> dict:
        """Verbrauch des laufenden Monats inkl. geschätzter Kosten (USD)."""
        usage = self.audit.month_usage()
        total, rows = 0.0, {}
        for key, v in usage.items():
            preis = self.cfg["preise"].get(key.split(":")[-1]) if key.startswith("claude") else None
            kosten = (v["in"] * preis[0] + v["out"] * preis[1]) / 1e6 if preis else 0.0
            total += kosten
            rows[key] = {**v, "kosten": round(kosten, 2)}
        return {"modelle": rows, "kosten": round(total, 2), "budget": self.cfg["budget_monat"]}

    def index_status(self) -> dict:
        if not self.archiv:
            return {"phase": "kein DATENARCHIV"}
        st = self.archiv.shared_status()
        return {"lokal": self.archiv.search.stats(), "phase": st.get("phase", "wartet"),
                "offen": st.get("offen", 0), "fehler": st.get("fehler", 0),
                "dateien": st.get("dateien_gesamt"), "wache": st.get("wache"),
                "stand": st.get("letzter_lauf") or st.get("aktualisiert"),
                "pausiert": self.archiv.pause.is_set()}


core: Core | None = None
app = FastAPI(title="JARVIS-Core")


def get_core() -> Core:
    global core
    if core is None:
        core = Core()
    return core


def auth(x_atlas_token: str | None = Header(default=None),
         atlas_token: str | None = Cookie(default=None)):
    if get_core().token not in (x_atlas_token, atlas_token):
        raise HTTPException(status_code=401, detail="Zugang verweigert")


@app.get("/status")
def status(_: None = Depends(auth)):
    return get_core().status()


@app.post("/notaus/{state}")
def notaus(state: str, _: None = Depends(auth)):
    get_core().gate.set_notaus(state == "an")
    return {"notaus": get_core().gate.notaus}


class Session:
    def __init__(self):
        self.messages: list[dict] = []
        self.mode = "auto"
        self.sensitive = False       # einmal sensibel -> ganze Sitzung sensibel
        self.last: tuple[str, str | None] | None = None   # (Ziel, Claude-Alias)
        self.fakten: list[str] = []  # Kurzfassung der Werkzeugergebnisse dieses Gesprächs
        self.freigaben: dict[str, bool] = {}   # Dokument-id → darf Claude es lesen?
        self.gruppen: set[str] | None = set()  # Werkzeuggruppen der letzten Antwort (None = alle)
        self.antworten: dict[str, asyncio.Future] = {}   # offene Rückfragen
        self.task: asyncio.Task | None = None  # laufende Antwort (abbrechbar)
        self.fremd: list[str] = []   # Quellen fremder Inhalte in diesem Durchlauf (Mail, Dokument, Web …)


MAX_STEPS = 8
MAX_RESULT = 12000


async def _ask(ws: WebSocket, text: str) -> bool:
    """Rückfrage an die Oberfläche und auf Antwort warten (die Antwort nimmt die Empfangsschleife entgegen)."""
    cid = uuid.uuid4().hex[:8]
    s = getattr(ws, "_atlas_session", None)
    if s is None:                               # ohne Sitzung (sollte nicht vorkommen): direkt lesen
        await ws.send_json({"type": "confirm", "id": cid, "text": text})
        while True:
            msg = await ws.receive_json()
            if msg.get("type") == "confirm" and msg.get("id") == cid:
                return bool(msg.get("answer"))
    fut = asyncio.get_running_loop().create_future()
    s.antworten[cid] = fut
    await ws.send_json({"type": "confirm", "id": cid, "text": text})
    try:
        return bool(await fut)
    finally:
        s.antworten.pop(cid, None)


async def _run_tool(ws: WebSocket, call) -> str:
    """Ein Werkzeug ausführen – mit Rechteprüfung, Befugnissen, Fremdinhalt-Schutz, Rückfrage und Protokoll."""
    c = get_core()
    tool = c.tools.get(call.name)
    if not tool:
        return f"Fehler: unbekanntes Werkzeug {call.name}"
    s = getattr(ws, "_atlas_session", None)
    fremd = s.fremd if s is not None else []
    lvl = c.gate.level(tool.action)
    lvl, hinweis, rid = c.sicherheit.entscheiden(tool, call.args, lvl, fremd)
    what = tool.describe(call.args)
    if lvl == Level.VERBOTEN:
        c.audit.log("werkzeug_verweigert", werkzeug=call.name, aktion=tool.action, fremd=bool(fremd))
        return f"Verweigert: '{tool.action}' ist gesperrt" + (f" – {hinweis}" if hinweis else " (Rechte oder Not-Aus).")
    if lvl == Level.BESTAETIGEN:
        ok = await _ask(ws, f"{what}?" + (f"\n{hinweis}" if hinweis else ""))
        c.audit.log("bestaetigung", aktion=tool.action, was=what, erteilt=ok, fremd=bool(fremd))
        if not ok:
            return "Vom Nutzer abgelehnt. Nicht erneut versuchen, sondern nachfragen."
    await ws.send_json({"type": "tool", "name": call.name, "text": what})
    result = None
    try:
        result = await asyncio.to_thread(tool.func, **call.args)
        out = json.dumps(result, ensure_ascii=False, default=str)
        ok = True
    except ToolError as e:
        out, ok = f"Fehler: {e}", False
    except TypeError as e:
        out, ok = f"Fehler: falsche Parameter ({e})", False
    except Exception as e:
        out, ok = f"Fehler: {type(e).__name__}: {e}", False
    rk = c.rechenschaft.merken(call.name, call.args, result) if ok and hasattr(c, "rechenschaft") else ""
    c.audit.log("werkzeug", werkzeug=call.name, aktion=tool.action, erfolg=ok, was=what, kanal="dashboard",
                stufe=lvl.name, **({"befugnis": rid} if rid else {}), **({"fremd": sorted(set(fremd))} if fremd else {}),
                **({"rueckgaengig": rk} if rk else {}),
                args={k: (v if len(str(v)) < 80 else str(v)[:80] + "…")
                      for k, v in call.args.items()}, **({} if ok else {"fehler": out[:300]}))
    if ok and rid:
        c.befugnisse.genutzt(rid)
    if ok and lvl == Level.MELDEN:
        await ws.send_json({"type": "info", "text": f"✓ {what}" + (" · per Befugnis" if rid else ""),
                            **({"rueckgaengig": rk} if rk else {})})
    if ok and isinstance(result, dict) and result.get("erstellt"):
        await ws.send_json({"type": "datei", "pfad": result["erstellt"], "art": result.get("art", "")})
    from atlas.hilfen import vs_schutz
    geschuetzt = vs_schutz(call.name, out)
    if geschuetzt != out:
        c.audit.log("vs_kennzeichnung", werkzeug=call.name)
    geschuetzt, ist_fremd = c.sicherheit.schuetzen(call.name, geschuetzt, "dashboard")
    if ist_fremd:
        fremd.append(call.name)
    return geschuetzt[:MAX_RESULT]


async def _chat(ws: WebSocket, s: Session, text: str, stimme: bool = False, quelle: str = "",
                dokumente: list | None = None):
    c = get_core()
    c.chats_aktiv += 1                 # während eines Gesprächs wird nicht aktualisiert
    try:
        await _chat_inner(ws, s, text, stimme, quelle, dokumente or [])
    finally:
        c.chats_aktiv -= 1


DOK_FRAGE = ("Was ist das für ein Dokument? Fasse kurz zusammen: worum es geht, was von mir verlangt "
             "wird und bis wann. Schlag mir am Ende vor, wo ich es ablegen sollte.")


async def _chat_inner(ws: WebSocket, s: Session, text: str, stimme: bool = False, quelle: str = "",
                      dok_ids: list | None = None):
    c = get_core()
    s.fremd = []                                  # Fremdinhalt-Markierung gilt je Auftrag
    t0 = time.monotonic(); t_erst = None          # Messung: bis zum ersten Wort / gesamt
    lokal, claude = c.providers["lokal"], c.providers["claude"]
    local_ok = await asyncio.to_thread(lokal.available)
    cloud_ok = claude.available()

    # Dokumente aus dem Chat: bei jedem Dokument fragen, ob Claude es lesen darf
    doks = [c.dokumente.dok[i] for i in (dok_ids or []) if i in c.dokumente.dok]
    if doks and not text:
        text = DOK_FRAGE
    for dk in doks:
        if dk["id"] in s.freigaben:
            continue
        if not cloud_ok or s.mode == "lokal":
            s.freigaben[dk["id"]] = False
            continue
        gruende = dk["sensibel"]
        ok = await _ask(ws, f"Darf Claude „{dk['name']}“ lesen ({dk['seiten']} S.)?"
                            + (f" Enthält vermutlich: {', '.join(gruende)}." if gruende else "")
                            + " Kontonummern werden unkenntlich gemacht. Bei „Nein“ antwortet das lokale Modell.")
        s.freigaben[dk["id"]] = ok
        c.audit.log("bestaetigung", aktion="dokument.cloud", name=dk["name"], erteilt=ok)
    dok_lokal = any(not s.freigaben.get(dk["id"]) for dk in doks)

    d = c.router.decide(text, s.mode, s.sensitive, local_ok, cloud_ok)
    cls = c.router.classify(text)
    if cls["sensitive"] or cls["forbidden"]:
        s.sensitive = True
    if doks and dok_lokal:
        if not local_ok:
            await ws.send_json({"type": "error", "text": "Das lokale Modell ist nicht erreichbar – "
                                                         "ohne Freigabe für Claude kann ich das Dokument nicht lesen."})
            return
        s.sensitive = True                      # Inhalt liegt im Verlauf: Folgefragen bleiben lokal
        from atlas.router import Decision
        d = Decision("lokal", None, "Dokument bleibt lokal")
    elif doks and not cls["forbidden"] and cloud_ok:
        from atlas.router import CLAUDE_ROUTES, Decision
        alias = CLAUDE_ROUTES.get(s.mode, c.cfg["claude"]["default"])
        d = Decision("claude", alias, f"Dokument ({len(doks)}) – freigegeben")
    anhang = "".join(c.dokumente.anhang(dk["id"], cloud=not dok_lokal) for dk in doks)
    if doks:
        s.fremd += [f"dokument:{dk['name']}" for dk in doks]   # nach Dokumenten: Aktionen nur mit Bestätigung
    # Kurze Rückfragen ("ja, mach das") beim bisherigen Modell lassen
    # Kurze Rückfragen nach einer lokalen Antwort beim lokalen Modell lassen; nach Claude-Antworten
    # übernimmt das schnelle Haiku (der Verlauf geht ja mit) – Sonnet nur für wirklich Komplexes
    if (s.mode == "auto" and d.reason in ("einfache Anfrage", "Gespräch – schnell") and s.last
            and s.last[0] == "claude" and not s.sensitive and cloud_ok):
        d.target, d.alias, d.reason = "claude", "haiku", "Fortsetzung"

    if c.notfall.aktiv():                         # Notfallbegleitung: der Notfallordner bleibt auf dem Mac
        s.sensitive = True
        if local_ok:
            from atlas.router import Decision
            d = Decision("lokal", None, "Notfallbegleitung – bleibt lokal")
    # Rechteprüfung für Cloud-Übermittlung (bei freigegebenen Dokumenten schon erfragt)
    if d.target == "claude" and not (doks and not dok_lokal):
        action = "cloud.sensibel" if (s.sensitive or d.ask_cloud) else "chat.cloud"
        if c.gate.level(action) == Level.VERBOTEN:
            d.target, d.alias, d.reason = "lokal", None, "Cloud gesperrt"
        elif d.ask_cloud or c.gate.level(action) == Level.BESTAETIGEN:
            ok = await _ask(ws, f"Diese Unterhaltung enthält sensible Inhalte ({d.reason}). "
                                f"Darf ich sie an Claude übermitteln?")
            c.audit.log("bestaetigung", aktion=action, erteilt=ok)
            if not ok:
                if not local_ok:
                    await ws.send_json({"type": "error", "text":
                        "Abgebrochen – lokales Modell nicht verfügbar."})
                    return
                d.target, d.alias, d.reason = "lokal", None, "Cloud abgelehnt – lokal"

    if d.target == "claude":
        k = await asyncio.to_thread(c.costs_cached)
        if k["budget"] and k["kosten"] >= k["budget"]:
            ok = await _ask(ws, f"Monatsbudget erreicht ({k['kosten']:.2f} $ von {k['budget']} $). "
                                f"Trotzdem Claude verwenden?")
            if not ok:
                if not local_ok:
                    await ws.send_json({"type": "error", "text": "Abgebrochen – Budget erreicht."})
                    return
                d.target, d.alias, d.reason = "lokal", None, "Budget erreicht – lokal"

    provider = c.providers[d.target]
    try:
        model = await asyncio.to_thread(provider.resolve_model, d.alias)
    except ProviderError as e:
        await ws.send_json({"type": "error", "text": str(e)})
        return

    await ws.send_json({"type": "route", "target": d.target, "model": model,
                        "reason": d.reason, "sensibel": s.sensitive})
    # Werkzeuge nach Bedarf: Gespräch und Alltagsaufgaben bekommen nur die passenden Gruppen
    alle = c.stab.filtern(list(c.tools.values()))
    gruppen = None
    if not doks and (d.target == "lokal" or d.alias == "haiku") and c.cfg.get("werkzeugwahl", True):
        gruppen = werkzeugwahl.gruppen_fuer(text)
        if d.reason == "Fortsetzung" or (s.last and len(text) < 80):
            gruppen = None if s.gruppen is None else gruppen | s.gruppen
    tools = alle if gruppen is None else c.stab.filtern(werkzeugwahl.auswahl(c.tools, gruppen))
    system = system_prompt(c.cfg["assistant_name"], c.name, d.target, True,
                           await asyncio.to_thread(c.digest_cached))
    if gruppen is not None:
        system += werkzeugwahl.hinweis(gruppen)
    if quelle == "dashboard" and not stimme:
        system += ("\n\nDie Antwort erscheint als Untertitel im Dashboard: fasse dich kurz "
                   "(meist 2–4 Sätze), Details und Listen nur, wenn ausdrücklich gewünscht.")
    if s.fakten:                     # ermittelte Daten bleiben über mehrere Fragen erhalten
        system += "\n\nBereits ermittelt (verlässlich, Stand dieses Gesprächs):\n" + "\n".join(s.fakten[-8:])
    if stimme:
        system += ("\n\nDiese Anfrage kam per Sprache, deine Antwort wird vorgelesen: antworte kurz "
                   "in ganzen Sätzen, ohne Tabellen, Aufzählungszeichen oder Sonderzeichen.")
    max_tokens = c.cfg["claude" if d.target == "claude" else "local"]["max_tokens"]

    if doks:
        system += ("\n\nDer Nutzer hat Dokumente angehängt (<dokument id=…>). Beantworte die Frage aus dem "
                   "Dokument; nenne Fristen und geforderte Handlungen ausdrücklich. Ablage nur auf Wunsch über "
                   "'dokument_ablage_vorschlag' und 'dokument_ablegen'; Fristen bei Bedarf mit 'frist_eintragen', "
                   "Steuerbelege nach der Ablage mit 'steuer_vormerken'.")
    # Schnellweg: Lagefragen gehen sofort und parallel an den Stab; JARVIS formuliert nur noch den Vortrag
    marken = None
    if (not doks and d.target == "claude" and s.mode == "auto" and hasattr(c, "stab")
            and await asyncio.to_thread(c.stab.bereit)):
        from atlas.stab import LAGE
        if LAGE.search(text or ""):
            await ws.send_json({"type": "tool", "name": "stab_einsatz", "text": "Stab: Lage wird erhoben"})
            vorab = await asyncio.to_thread(c.stab.schnellweg, text, False, "chat")
            if vorab:
                system += c.stab.vorab_hinweis(vorab)
                if vorab.get("_vortrag"):                       # animierte Darstellung im Dashboard
                    await ws.send_json({"type": "vortrag", "daten": vorab["_vortrag"]})
                    from atlas.stab import Markenfilter
                    marken = Markenfilter()
                tools, gruppen = werkzeugwahl.auswahl(c.tools, set()), set()   # nur 'werkzeuge_laden' – schlanker Aufruf
    work = [*s.messages, {"role": "user", "content": text + anhang}]
    reply, t_in, t_out = "", 0, 0
    unterbrochen = False

    async def ausgeben(stuecke):
        nonlocal reply, t_erst
        for art, wert in stuecke:
            if art == "marke":                     # Abschnittswechsel der Vortragsgrafik
                await ws.send_json({"type": "marke", "name": wert})
                continue
            if t_erst is None:
                t_erst = time.monotonic() - t0
            reply += wert
            await ws.send_json({"type": "delta", "text": wert})
    try:
        for _ in range(MAX_STEPS):
            it = provider.step(model, system, list(work), tools, max_tokens)
            result = None
            while True:
                ev = await asyncio.to_thread(next, it, None)
                if ev is None:
                    break
                if ev[0] == "text":
                    await ausgeben(marken.feed(ev[1]) if marken else [("text", ev[1])])
                else:
                    result = ev[1]
            if marken:
                await ausgeben(marken.ende())
            t_in += result.usage[0]
            t_out += result.usage[1]
            if result.quellen:
                await ws.send_json({"type": "quellen", "quellen": result.quellen})
            if result.pause:                     # lange Websuche: einfach fortsetzen
                work.append(result.assistant_msg)
                continue
            if not result.tool_calls:
                break
            outputs = []
            normale = [cl for cl in result.tool_calls if cl.name != werkzeugwahl.LADEN]
            parallel = len(normale) > 1 and all(                      # mehrere Leseabfragen gleichzeitig ausführen
                cl.name in c.tools and c.gate.level(c.tools[cl.name].action) == Level.FREI
                and cl.name not in __import__("atlas.sicherheit", fromlist=["x"]).SCHUTZ_FREI for cl in normale)   # nur reine Abfragen: Fremdinhalt-Schutz greift sonst zu spät
            vorweg = dict(zip([id(cl) for cl in normale],
                              await asyncio.gather(*[_run_tool(ws, cl) for cl in normale]))) if parallel else {}
            for call in result.tool_calls:
                if call.name == werkzeugwahl.LADEN:          # alle Werkzeuge nachladen
                    tools, gruppen = alle, None
                    outputs.append((call, "Alle Werkzeuge stehen jetzt zur Verfügung."))
                else:
                    outputs.append((call, vorweg[id(call)] if parallel else await _run_tool(ws, call)))
            for call, out in outputs:
                if call.name == werkzeugwahl.LADEN:
                    continue
                args = ", ".join(f"{k}={str(v)[:40]}" for k, v in call.args.items())
                s.fakten.append(f"- {call.name}({args}) → {out[:600]}")
            if result.text and reply.endswith(result.text):          # Vorrede vor Werkzeugaufruf nicht speichern
                reply = reply[: -len(result.text)]
            if (d.target == "claude" and any(cl.name == "stab_einsatz" for cl in result.tool_calls)
                    and c.stab.einstellungen().get("vortrag_modell") == "sonnet"
                    and "sonnet" not in model and "opus" not in model):   # Lagevortrag optional mit Sonnet
                try:
                    model = await asyncio.to_thread(provider.resolve_model, "sonnet")
                except ProviderError:
                    pass
            c.lage.invalidate("termine", "erinnerungen", "mail")   # Lagebild erneuern
            c._digest_cache = None                                  # Gedächtnis ggf. geändert
            work += [result.assistant_msg, *provider.tool_results(outputs)]
            if reply and not reply.endswith("\n"):
                reply += "\n"
                await ws.send_json({"type": "delta", "text": "\n"})
        else:
            reply += "\n(Abgebrochen: zu viele Werkzeugschritte.)"
    except asyncio.CancelledError:          # Nutzer ist ins Wort gefallen
        unterbrochen = True
        reply = reply.strip() + " …(unterbrochen)"
    except ProviderError as e:
        await ws.send_json({"type": "error", "text": str(e)})
        c.audit.log("fehler", ziel=d.target, modell=model, text=str(e))
        return

    # Im Verlauf bleiben nur Frage und Antworttext (anbieterneutral)
    s.messages += [{"role": "user", "content": text + anhang},
                   {"role": "assistant", "content": reply.strip() or "(erledigt)"}]
    s.last = (d.target, d.alias)
    s.gruppen = gruppen
    key = f"claude:{c.family(model)}" if d.target == "claude" else "lokal"
    c.audit.add_usage(key, t_in, t_out)
    gesamt = time.monotonic() - t0
    cache = getattr(provider, "last_cache", None) if d.target == "claude" else None
    c.audit.log("chat", ziel=d.target, modell=model, grund=d.reason,
                tokens_in=t_in, tokens_out=t_out, s_erstes_wort=round(t_erst or gesamt, 2),
                s_gesamt=round(gesamt, 2), cache=cache, stimme=stimme,
                werkzeuge=len(tools), **({"unterbrochen": True} if unterbrochen else {}))
    await ws.send_json({"type": "done", "target": d.target, "model": model, "unterbrochen": unterbrochen,
                        "tokens_in": t_in, "tokens_out": t_out,
                        "s_erst": round(t_erst or gesamt, 2), "s_gesamt": round(gesamt, 2)})


async def _summarize(messages: list[dict]) -> None:
    """Kurzprotokoll eines Gesprächs – lokal erstellt, privat abgelegt."""
    c = get_core()
    if len(messages) < 4:
        return
    lokal = c.providers["lokal"]
    if not await asyncio.to_thread(lokal.available):
        return
    verlauf = "\n".join(f"{m['role']}: {m['content'][:1500]}" for m in messages[-30:])
    try:
        model = await asyncio.to_thread(lokal.resolve_model)
        events = await asyncio.to_thread(lambda: list(lokal.step(
            model, "Fasse Gespräche in 2–5 deutschen Stichpunkten zusammen: Ergebnisse, "
                   "Entscheidungen, offene Punkte. Keine Passwörter, PINs oder Kontonummern.",
            [{"role": "user", "content": verlauf}], [], 400)))
        text = events[-1][1].text.strip()
        if text:
            await asyncio.to_thread(c.memory.gespraech_ablegen, text)
    except Exception:
        pass


@app.get("/index")
def index_status(_: None = Depends(auth)):
    return get_core().index_status()


@app.post("/index/{aktion}")
def index_aktion(aktion: str, _: None = Depends(auth)):
    a = get_core().archiv
    if not a:
        raise HTTPException(404, "kein DATENARCHIV")
    if aktion == "pause":
        a.pause.set()
    elif aktion == "weiter":
        a.pause.clear()
    elif aktion == "neu":          # lokale Suchdatenbank neu aus dem Index aufbauen
        a.search.reset()
        a.search.sync()
    return get_core().index_status()


@app.get("/lage")
async def lage(frisch: int = 0, _: None = Depends(auth)):
    return await asyncio.to_thread(get_core().lage.build, bool(frisch))


@app.get("/einstellungen")
def einstellungen(_: None = Depends(auth)):
    return get_core().lage.settings()


@app.post("/einstellungen")
def einstellungen_setzen(data: dict, _: None = Depends(auth)):
    return get_core().lage.save_settings(data)


@app.get("/stab")
def stab_uebersicht(_: None = Depends(auth)):
    return get_core().stab.uebersicht()


@app.post("/stab/schalter")
def stab_schalter(data: dict, _: None = Depends(auth)):
    return get_core().stab.schalten(bool(data.get("aktiv")))


@app.post("/stab/kostengrenze")
def stab_kostengrenze(data: dict, _: None = Depends(auth)):
    try:
        return get_core().stab.kostengrenze(data.get("wert"))
    except (TypeError, ValueError):
        raise HTTPException(400, "Ungültiger Betrag")


@app.post("/stab/messen")
async def stab_messen(data: dict | None = None, _: None = Depends(auth)):
    return await asyncio.to_thread(get_core().stab.messen, (data or {}).get("fragen"))


@app.post("/stab/persona/{agent}")
def stab_persona(agent: str, data: dict, _: None = Depends(auth)):
    try:
        return get_core().stab.speichern(agent, data.get("aenderungen") or {}, data.get("grund") or "",
                                         von="Einstellungen")
    except ValueError as e:
        raise HTTPException(400, str(e))


@app.post("/stab/zuruecksetzen/{agent}")
def stab_zuruecksetzen(agent: str, data: dict, _: None = Depends(auth)):
    try:
        return get_core().stab.zuruecksetzen(agent, str(data.get("version") or ""), data.get("grund") or "",
                                             von="Einstellungen")
    except ValueError as e:
        raise HTTPException(400, str(e))


@app.post("/standort")
async def standort_setzen(data: dict, _: None = Depends(auth)):
    try:
        lat, lon = float(data["lat"]), float(data["lon"])
    except (KeyError, TypeError, ValueError):
        raise HTTPException(400, "lat/lon fehlen")
    if not (-90 <= lat <= 90 and -180 <= lon <= 180):
        raise HTTPException(400, "ungültige Koordinaten")
    st = await asyncio.to_thread(get_core().standort.setzen, lat, lon, data.get("genauigkeit"),
                                 str(data.get("quelle") or "mac")[:20])
    return {"ok": True, "ort": st.get("ort", "")}


@app.get("/standort")
def standort_lesen(_: None = Depends(auth)):
    return get_core().standort.status()


@app.get("/notfall")
def notfall_status(_: None = Depends(auth)):
    """Notfallbegleitung: Status; ist sie aktiv, auch die Begleitung (Leitfaden mit Fortschritt – lokal angezeigt)."""
    n = get_core().notfall
    st = n.status()
    if st["aktiv"]:
        try:
            st["begleitung"] = n.uebersicht()
            st["fristen"] = n.fristen_vorschlag()
        except ToolError as e:
            st["hinweis"] = str(e)
    return st


@app.post("/notfall/{aktion}")
async def notfall_aktion(aktion: str, request: Request, data: dict | None = None, _: None = Depends(auth)):
    """Nur über das Dashboard (Eingabefeld/Klick) – kein Werkzeug des Sprachmodells kann hier aktivieren."""
    n, d = get_core().notfall, data or {}
    geraet = (request.headers.get("user-agent") or "")[:80]
    aufrufe = {
        "pruefen": lambda: n.pruefen(),
        "einrichten": lambda: n.einrichten(str(d.get("code") or ""), str(d.get("name") or "")),
        "aktivieren": lambda: n.aktivieren(str(d.get("code") or ""), geraet),
        "beenden": lambda: n.beenden(),
        "schritt": lambda: n.schritt(str(d.get("id") or ""), str(d.get("status") or "erledigt"), str(d.get("notiz") or "")),
        "sterbedatum": lambda: n.sterbedatum(str(d.get("datum") or "")),
        "fristen": lambda: n.fristen_eintragen(d.get("auswahl")),
    }
    if aktion not in aufrufe:
        raise HTTPException(404, "unbekannt")
    try:
        return await asyncio.to_thread(aufrufe[aktion])
    except (ToolError, ValueError) as e:
        raise HTTPException(400, str(e))


@app.get("/zuhause")
def zuhause_status(_: None = Depends(auth)):
    return get_core().zuhause.status()


@app.post("/zuhause/{aktion}")
async def zuhause_aktion(aktion: str, data: dict | None = None, _: None = Depends(auth)):
    """Klick im Dashboard = Bestätigung. Aufschließen gibt es nicht."""
    c, d = get_core(), data or {}
    aufrufe = {"steuern": lambda: c.zuhause.ausfuehren(str(d.get("aktion") or "")),
               "abschliessen": lambda: c.zuhause.abschliessen(str(d.get("schloss") or ""))}
    if aktion not in aufrufe:
        raise HTTPException(404, "unbekannt")
    try:
        r = await asyncio.to_thread(aufrufe[aktion])
    except ToolError as e:
        raise HTTPException(400, str(e))
    c.audit.log("werkzeug", werkzeug=f"zuhause_{aktion}", aktion="zuhause", erfolg=True, kanal="dashboard",
                stufe="BESTAETIGEN", was=str(d.get("aktion") or d.get("schloss") or aktion))
    return r


@app.get("/ziele")
def ziele_status(_: None = Depends(auth)):
    z = get_core().ziele
    return {**z.status(), "einstellungen": z.einstellungen()}


@app.post("/ziele/{aktion}")
async def ziele_aktion(aktion: str, data: dict | None = None, _: None = Depends(auth)):
    z, d = get_core().ziele, data or {}
    aufrufe = {"einstellen": lambda: z.einstellen(**d), "arbeitsort": lambda: z.arbeitsort_setzen(str(d.get("ort") or ""), str(d.get("datum") or "")),
               "dienststelle": lambda: z.dienststelle_hier(), "sport": lambda: z.sport_abgleichen()}
    if aktion not in aufrufe:
        raise HTTPException(404, "unbekannt")
    try:
        return await asyncio.to_thread(aufrufe[aktion])
    except (ToolError, ValueError) as e:
        raise HTTPException(400, str(e))


@app.get("/autopilot")
def autopilot(_: None = Depends(auth)):
    """Einstellungen → Autopilot: Befugnisse, Ruhe/Fokus/Stapel, Sicherheitsvorfälle."""
    c = get_core()
    return {"befugnisse": c.befugnisse.liste(), "aufmerksamkeit": c.aufmerksamkeit.einstellungen(),
            "modus": c.aufmerksamkeit.modus(), "vorfaelle": c.sicherheit.vorfaelle(30),
            "stapel": len(c.aufmerksamkeit._stapel())}


@app.post("/autopilot/{aktion}")
async def autopilot_aktion(aktion: str, data: dict | None = None, _: None = Depends(auth)):
    """Klicks im Dashboard gelten als Bestätigung des Nutzers."""
    c, d = get_core(), data or {}
    b, a = c.befugnisse, c.aufmerksamkeit
    aufrufe = {
        "erteilen": lambda: b.erteilen(str(d.get("bereich") or ""), str(d.get("titel") or ""), d.get("max_pro_woche"),
                                       str(d.get("gueltig_bis") or "")),
        "entziehen": lambda: b.entziehen(str(d.get("id") or ""), bool(d.get("alle"))),
        "aktivieren": lambda: b.wieder_aktivieren(str(d.get("id") or "")),
        "bedingung": lambda: b.bedingung_setzen(str(d.get("id") or ""), d.get("kalender_ausschluss"),
                                                d.get("max_pro_woche"), d.get("gueltig_bis")),
        "einstellen": lambda: a.einstellen(**{k: v for k, v in d.items()}),
        "fokus": lambda: a.fokus_starten(int(d.get("minuten") or 120), str(d.get("grund") or "")),
        "fokus_ende": lambda: a.fokus_beenden(),
        "stapel": lambda: a.ausliefern("auf Wunsch", leeren=bool(d.get("leeren", True)), telegram=False),
    }
    if aktion not in aufrufe:
        raise HTTPException(404, "unbekannt")
    try:
        r = await asyncio.to_thread(aufrufe[aktion])
    except ToolError as e:
        raise HTTPException(400, str(e))
    c.audit.log("autopilot", aktion=aktion, kanal="dashboard")
    return r


@app.get("/rechenschaft")
def rechenschaft(tage: int = 1, _: None = Depends(auth)):
    return get_core().rechenschaft.bericht(tage)


@app.post("/rueckgaengig/{rid}")
async def rueckgaengig(rid: str, _: None = Depends(auth)):
    try:
        return await asyncio.to_thread(get_core().rechenschaft.rueckgaengig, rid)
    except ToolError as e:
        raise HTTPException(400, str(e))


@app.get("/mailwache")
def mailwache_liste(_: None = Depends(auth)):
    return get_core().mailwache.liste()


@app.post("/mailwache/{aktion}")
async def mailwache_aktion(aktion: str, data: dict | None = None, _: None = Depends(auth)):
    mw, d = get_core().mailwache, data or {}
    aufrufe = {"setzen": lambda: mw.setzen(str(d.get("absender") or ""), str(d.get("stichwort") or ""), str(d.get("bis") or ""),
                                           bool(d.get("dauerhaft")), bool(d.get("alle")), "", bool(d.get("dringend"))),
               "beenden": lambda: mw.beenden(str(d.get("id") or ""), bool(d.get("alle"))),
               "intervall": lambda: mw.intervall(int(d.get("sekunden") or 120)),
               "pruefen": lambda: mw.pruefen()}
    if aktion not in aufrufe:
        raise HTTPException(404, "unbekannt")
    return await asyncio.to_thread(_ford_fehler, aufrufe[aktion])


@app.get("/standort/ort")
async def standort_ort(lat: float, lon: float, _: None = Depends(auth)):
    """Ort und Ortsteil für die Anzeige bei Durchfahrt (Live-Karte der Fahrzeuge)."""
    from atlas.standort import ort_mit_teil
    return await asyncio.to_thread(ort_mit_teil, lat, lon)


# ---------------------------------------------------------------- Tesla
@app.get("/tesla")
async def tesla_status(wecken: int = 0, _: None = Depends(auth)):
    from atlas.tools import ToolError
    try:
        return await asyncio.to_thread(get_core().tesla.status, bool(wecken))
    except ToolError as e:
        raise HTTPException(400, str(e))


@app.post("/tesla/termine")
async def tesla_termine(data: dict, _: None = Depends(auth)):
    from atlas.tools import ToolError
    try:
        return await asyncio.to_thread(get_core().tesla.termine_setzen, str(data.get("tuev") or ""),
                                       str(data.get("versicherung") or ""), str(data.get("versicherer") or ""))
    except ToolError as e:
        raise HTTPException(400, str(e))


@app.get("/tesla/position")
async def tesla_position(_: None = Depends(auth)):
    from atlas.tools import ToolError
    try:
        return await asyncio.to_thread(get_core().tesla.position)
    except ToolError as e:
        raise HTTPException(400, str(e))


@app.post("/tesla/befehl")
async def tesla_befehl(data: dict, _: None = Depends(auth)):
    """Knöpfe im Tesla-Fenster: ausdrücklicher Klick = Auftrag (wie ein bestätigter Sprachbefehl)."""
    from atlas.tools import ToolError
    c = get_core()
    name = {"klima": "tesla_klima", "laden": "tesla_laden", "ladeplan": "tesla_ladeplan"}.get(str(data.get("befehl")))
    if not name or name not in c.tools:
        raise HTTPException(400, "Unbekannter Befehl")
    try:
        erg = await asyncio.to_thread(c.tools[name].func, **(data.get("args") or {}))
    except ToolError as e:
        raise HTTPException(400, str(e))
    c.audit.log("werkzeug", werkzeug=name, aktion="tesla.steuern", erfolg=True, quelle="dashboard")
    return erg


@app.get("/tesla/bild")
async def tesla_bild(modell: str = "my", lack: str = "", _: None = Depends(auth)):
    import re as _re
    if not _re.fullmatch(r"[a-z0-9]{2}", modell) or (lack and not _re.fullmatch(r"[A-Z0-9]{4}", lack)):
        raise HTTPException(400, "ungültig")
    erg = await asyncio.to_thread(get_core().tesla.bild, modell, lack)
    if not erg:
        raise HTTPException(404, "kein Bild")
    return Response(erg[0], media_type=erg[1], headers={"Cache-Control": "no-cache"})


@app.post("/tesla/bild")
async def tesla_bild_hochladen(request: Request, x_dateiname: str = Header(default="Auto.jpg"),
                               _: None = Depends(auth)):
    from atlas.tools import ToolError
    daten = await request.body()
    try:
        return await asyncio.to_thread(get_core().tesla.bild_hochladen, daten, x_dateiname)
    except ToolError as e:
        raise HTTPException(400, str(e))


@app.delete("/tesla/bild")
async def tesla_bild_entfernen(_: None = Depends(auth)):
    return await asyncio.to_thread(get_core().tesla.bild_entfernen)


@app.get("/tesla/rueckruf")
async def tesla_rueckruf(code: str = "", state: str = "", error: str = ""):
    """Rücksprung nach der Tesla-Anmeldung im Browser (geschützt über den einmaligen state-Code)."""
    from fastapi.responses import HTMLResponse
    from atlas.tools import ToolError
    if error:
        text, ok = f"Tesla-Anmeldung abgebrochen: {error}", False
    else:
        try:
            name = await asyncio.to_thread(get_core().tesla.rueckruf, code, state)
            text, ok = f"Verbunden{' mit ' + name if name else ''}. Du kannst dieses Fenster schließen.", True
        except ToolError as e:
            text, ok = str(e), False
    get_core().broadcast({"type": "tesla_verbunden", "ok": ok, "text": text})
    farbe = "#3ddc97" if ok else "#ff6b4a"
    return HTMLResponse(f"<!doctype html><meta charset='utf-8'><title>JARVIS · Tesla</title>"
                        f"<body style='background:#02090e;color:#d9faff;font:16px -apple-system,sans-serif;display:grid;"
                        f"place-items:center;height:100vh;margin:0'><div style='text-align:center'><div style='font:600 12px "
                        f"monospace;letter-spacing:.3em;color:#00e5ff'>JARVIS · TESLA</div><p style='color:{farbe}'>"
                        f"{'✓ ' if ok else '⚠ '}{text}</p></div>")


@app.get("/verbindungen/tesla")
def verbindungen_tesla(_: None = Depends(auth)):
    return get_core().tesla.einrichtung()


@app.post("/verbindungen/tesla/{aktion}")
async def verbindungen_tesla_aktion(aktion: str, data: dict | None = None, _: None = Depends(auth)):
    from atlas.tools import ToolError
    t, d = get_core().tesla, data or {}
    try:
        if aktion == "app":
            return await asyncio.to_thread(t.app_setzen, d.get("client_id", ""), d.get("client_secret", ""))
        if aktion == "helfer":
            return await asyncio.to_thread(t.helfer_einrichten)
        if aktion == "schluessel":
            return await asyncio.to_thread(t.schluessel_veroeffentlichen)
        if aktion == "registrieren":
            return await asyncio.to_thread(t.registrieren)
        if aktion == "anmelden":
            url = t.anmelde_url()
            await asyncio.to_thread(subprocess.run, ["open", url], capture_output=True)
            return {"ok": True, "text": "Browser geöffnet – bei Tesla anmelden und Zugriff erlauben …"}
        if aktion == "vschluessel":
            dom = t.einrichtung().get("domain")
            if not dom:
                raise ToolError("Zuerst den Schlüssel veröffentlichen")
            from atlas import iphone
            link = f"https://tesla.com/_ak/{dom}"
            return {"ok": True, "link": link, "qr": iphone.qr_svg(link)}
        if aktion == "vschluessel_ok":
            t._zustand_setzen(virtueller_schluessel=True)
            return {"ok": True, "text": "✓ Steuerung freigeschaltet"}
    except ToolError as e:
        raise HTTPException(400, str(e))
    raise HTTPException(404, "unbekannt")


# ---------------------------------------------------------------- Ford (nur Status)
def _ford_fehler(fn, *a):
    from atlas.tools import ToolError
    try:
        return fn(*a)
    except ToolError as e:
        raise HTTPException(400, str(e))


@app.get("/ford")
async def ford_status(_: None = Depends(auth)):
    return await asyncio.to_thread(_ford_fehler, get_core().ford.status)


@app.get("/ford/position")
async def ford_position(_: None = Depends(auth)):
    return await asyncio.to_thread(_ford_fehler, get_core().ford.position)


@app.post("/ford/termine")
async def ford_termine(data: dict, _: None = Depends(auth)):
    return await asyncio.to_thread(_ford_fehler, get_core().ford.termine_setzen, str(data.get("tuev") or ""),
                                   str(data.get("versicherung") or ""), str(data.get("versicherer") or ""))


@app.get("/ford/bild")
async def ford_bild(_: None = Depends(auth)):
    erg = await asyncio.to_thread(get_core().ford.bild)
    if not erg:
        raise HTTPException(404, "kein Bild")
    return Response(erg[0], media_type=erg[1], headers={"Cache-Control": "no-cache"})


@app.post("/ford/bild")
async def ford_bild_hochladen(request: Request, x_dateiname: str = Header(default="Ford.jpg"), _: None = Depends(auth)):
    daten = await request.body()
    return await asyncio.to_thread(_ford_fehler, get_core().ford.bild_hochladen, daten, x_dateiname)


@app.delete("/ford/bild")
async def ford_bild_entfernen(_: None = Depends(auth)):
    return await asyncio.to_thread(get_core().ford.bild_entfernen)


@app.get("/ford/rueckruf")
async def ford_rueckruf(code: str = "", state: str = "", error: str = "", error_description: str = ""):
    """Rücksprung nach der Ford-Anmeldung. Kommt der Code im #-Teil der Adresse, reicht ein kleines Skript ihn weiter."""
    from fastapi.responses import HTMLResponse
    from atlas.tools import ToolError
    if not code and not error:
        return HTMLResponse("<!doctype html><meta charset='utf-8'><script>var h=location.hash.slice(1);"
                            "if(h&&!location.search){location.replace(location.pathname+'?'+h)}else{document.write("
                            "'Keine Anmeldedaten erhalten – bitte in JARVIS erneut anmelden.')}</script>")
    if error:
        text, ok = f"Ford-Anmeldung abgebrochen: {error_description or error}"[:300], False
    else:
        try:
            name = await asyncio.to_thread(get_core().ford.rueckruf, code, state)
            text, ok = f"Verbunden{' mit ' + name if name else ''}. Du kannst dieses Fenster schließen.", True
        except ToolError as e:
            text, ok = str(e), False
    get_core().broadcast({"type": "ford_verbunden", "ok": ok, "text": text})
    import html as _html
    farbe = "#3ddc97" if ok else "#ff6b4a"
    return HTMLResponse(f"<!doctype html><meta charset='utf-8'><title>JARVIS · Ford</title>"
                        f"<body style='background:#02090e;color:#d9faff;font:16px -apple-system,sans-serif;display:grid;"
                        f"place-items:center;height:100vh;margin:0'><div style='text-align:center'><div style='font:600 12px "
                        f"monospace;letter-spacing:.3em;color:#00e5ff'>JARVIS · FORD</div><p style='color:{farbe}'>"
                        f"{'✓ ' if ok else '⚠ '}{_html.escape(text)}</p></div>")


@app.get("/verbindungen/ford")
def verbindungen_ford(_: None = Depends(auth)):
    return get_core().ford.einrichtung()


@app.post("/verbindungen/ford/{aktion}")
async def verbindungen_ford_aktion(aktion: str, data: dict | None = None, _: None = Depends(auth)):
    f, d = get_core().ford, data or {}
    aufrufe = {
        "app": lambda: f.app_setzen(d.get("client_id", ""), d.get("client_secret", "")),
        "profil": lambda: f.profil_setzen(str(d.get("name") or ""), str(d.get("farbe") or ""),
                                          str(d.get("kennzeichen") or ""), str(d.get("erwartet") or "")),
        "demo": lambda: f.demo_setzen(bool(d.get("an"))),
        "urls": lambda: f.urls_setzen(d),
        "garage": lambda: {"ok": True, "fahrzeuge": f.garage(), "text": "✓ Fahrzeugliste geladen"},
        "waehlen": lambda: f.waehlen(str(d.get("id") or "")),
        "trennen": f.trennen,
        "rohdaten": f.rohdaten,
    }
    if aktion == "anmelden":
        url = _ford_fehler(f.anmelde_url)
        await asyncio.to_thread(subprocess.run, ["open", url], capture_output=True)
        return {"ok": True, "text": "Browser geöffnet – mit dem FordPass-Konto anmelden und Zugriff erlauben …"}
    if aktion not in aufrufe:
        raise HTTPException(404, "unbekannt")
    return await asyncio.to_thread(_ford_fehler, aufrufe[aktion])


# ---------------------------------------------------------------- Immobilien (HESTIA)
@app.get("/immobilien")
async def immobilien_liste(_: None = Depends(auth)):
    return await asyncio.to_thread(get_core().immobilien.alle)


@app.post("/immobilien")
async def immobilien_neu(data: dict, _: None = Depends(auth)):
    return await asyncio.to_thread(_ford_fehler, get_core().immobilien.speichern, data, "")


@app.post("/immobilien/grenzen")
async def immobilien_grenzen(data: dict, _: None = Depends(auth)):
    return await asyncio.to_thread(_ford_fehler, get_core().immobilien.grenzen_setzen, data)


@app.post("/immobilien/mietvertrag")
async def immobilien_mietvertrag(request: Request, x_dateiname: str = Header(default="Mietvertrag.pdf"),
                                 _: None = Depends(auth)):
    """Mietvertrag NUR lokal lesen (Text auf dem Mac, Felder vom lokalen Modell); die Datei wird nicht gespeichert."""
    daten = await request.body()
    if len(daten) > 60_000_000:
        raise HTTPException(400, "Datei zu groß")
    from urllib.parse import unquote
    return await asyncio.to_thread(_ford_fehler, get_core().immobilien.mietvertrag_lesen, daten, unquote(x_dateiname))


@app.post("/immobilien/{oid}/verorten")
async def immobilien_verorten(oid: str, _: None = Depends(auth)):
    return await asyncio.to_thread(_ford_fehler, get_core().immobilien.verorten, oid)


@app.post("/immobilien/{oid}")
async def immobilien_aendern(oid: str, data: dict, _: None = Depends(auth)):
    return await asyncio.to_thread(_ford_fehler, get_core().immobilien.speichern, data, oid)


@app.delete("/immobilien/{oid}")
async def immobilien_entfernen(oid: str, _: None = Depends(auth)):
    return await asyncio.to_thread(get_core().immobilien.entfernen, oid)


@app.post("/immobilien/{oid}/bild")
async def immobilien_bild_hoch(oid: str, request: Request, haupt: int = 0, x_dateiname: str = Header(default="Bild.jpg"),
                               _: None = Depends(auth)):
    from urllib.parse import unquote
    daten = await request.body()
    return await asyncio.to_thread(_ford_fehler, get_core().immobilien.bild_hochladen, oid, daten, unquote(x_dateiname), bool(haupt))


@app.post("/immobilien/{oid}/bild/{datei}/{aktion}")
async def immobilien_bild_aktion(oid: str, datei: str, aktion: str, _: None = Depends(auth)):
    if aktion not in ("haupt", "entfernen"):
        raise HTTPException(404, "unbekannt")
    return await asyncio.to_thread(_ford_fehler, get_core().immobilien.bild_aktion, oid, datei, aktion)


@app.get("/immobilien/{oid}/bild/{datei}")
async def immobilien_bild(oid: str, datei: str, _: None = Depends(auth)):
    erg = await asyncio.to_thread(get_core().immobilien.bild, oid, datei)
    if not erg:
        raise HTTPException(404, "kein Bild")
    return Response(erg[0], media_type=erg[1], headers={"Cache-Control": "max-age=86400"})


# ---------------------------------------------------------------- HESTIA: Grundriss → 3D
@app.get("/grundriss/{oid}")
async def grundriss_liste(oid: str, _: None = Depends(auth)):
    g = get_core().grundriss
    plaene = await asyncio.to_thread(_ford_fehler, g.liste, oid)
    return {"plaene": plaene, "abgleich": await asyncio.to_thread(_ford_fehler, g.abgleich, oid)}


@app.post("/grundriss/{oid}")
async def grundriss_hoch(oid: str, request: Request, x_dateiname: str = Header(default="Grundriss.pdf"),
                         x_stockwerk: str = Header(default=""), _: None = Depends(auth)):
    from urllib.parse import unquote
    daten = await request.body()
    return await asyncio.to_thread(_ford_fehler, get_core().grundriss.hochladen, oid, daten, unquote(x_dateiname),
                                   unquote(x_stockwerk))


@app.get("/grundriss/{oid}/{gid}/bild")
async def grundriss_bild(oid: str, gid: str, _: None = Depends(auth)):
    daten = await asyncio.to_thread(_ford_fehler, get_core().grundriss.bild, oid, gid)
    if not daten:
        raise HTTPException(404, "kein Bild")
    return Response(daten, media_type="image/png", headers={"Cache-Control": "private, max-age=600"})


@app.post("/grundriss/{oid}/{gid}/{aktion}")
async def grundriss_aktion(oid: str, gid: str, aktion: str, data: dict | None = None, _: None = Depends(auth)):
    g, d = get_core().grundriss, data or {}
    if aktion == "erkennen":           # schickt das Bild an Claude – nur mit ausdrücklicher Freigabe aus dem Dashboard
        return await asyncio.to_thread(_ford_fehler, g.erkennen, oid, gid, bool(d.get("freigabe")))
    if aktion == "speichern":
        return await asyncio.to_thread(_ford_fehler, g.speichern, oid, gid, d)
    if aktion == "entfernen":
        return await asyncio.to_thread(_ford_fehler, g.entfernen, oid, gid)
    raise HTTPException(404, "unbekannt")


# ---------------------------------------------------------------- HESTIA: Nebenkosten
@app.get("/hestia")
async def hestia_uebersicht(objekt: str = "", _: None = Depends(auth)):
    return await asyncio.to_thread(_ford_fehler, get_core().nebenkosten.uebersicht, objekt)


@app.post("/hestia/{aktion}")
async def hestia_aktion(aktion: str, data: dict | None = None, _: None = Depends(auth)):
    nk, d = get_core().nebenkosten, data or {}
    aufrufe = {
        "jahr": lambda: nk.jahr_anlegen(str(d.get("objekt")), int(d.get("jahr") or 0)),
        "posten": lambda: nk.posten_setzen(str(d.get("objekt")), int(d.get("jahr") or 0), str(d.get("posten")), d.get("daten") or {}),
        "bestaetigen": lambda: nk.vorschlag_bestaetigen(str(d.get("id")), d.get("aenderung") or {}),
        "verwerfen": lambda: nk.vorschlag_verwerfen(str(d.get("id"))),
        "pruefen": lambda: {"ok": True, "text": " · ".join(x["text"] for x in (
            nk.postfach_pruefen() if nk.alias() else {"text": "Kein Postfach eingetragen"}, nk.ordner_pruefen()))},
        "anfragen": lambda: nk.anfragen_erstellen(str(d.get("objekt")), int(d.get("jahr") or 0)),
        "anfrage_aendern": lambda: nk.anfrage_aendern(str(d.get("id")), d.get("daten") or {}),
        "anfrage_billigen": lambda: nk.anfrage_billigen(str(d.get("id"))),
        "anfrage_verschickt": lambda: nk.brief_verschickt(str(d.get("id"))),
        "anfrage_verwerfen": lambda: nk.anfrage_verwerfen(str(d.get("id"))),
        "entwurf": lambda: nk.entwurf(str(d.get("objekt")), int(d.get("jahr") or 0)),
        "billigen": lambda: nk.billigen(str(d.get("objekt")), int(d.get("jahr") or 0)),
        "mieter": lambda: nk.an_mieter(str(d.get("objekt")), int(d.get("jahr") or 0), str(d.get("weg") or "brief"),
                                       str(d.get("email") or "")),
        "zugang": lambda: nk.zugang(str(d.get("objekt")), int(d.get("jahr") or 0), str(d.get("datum") or ""),
                                    str(d.get("weg") or "brief")),
        "postfach": lambda: nk.postfach_setzen(str(d.get("alias") or ""), d.get("intervall_min")),
        "bank": lambda: nk.bank_setzen(str(d.get("iban") or ""), str(d.get("inhaber") or "")),
        "absender": lambda: nk.absender_setzen(str(d.get("anschrift") or "")),
        "versorger": lambda: nk.versorger_setzen(str(d.get("objekt")), d.get("liste") or []),
    }
    if aktion not in aufrufe:
        raise HTTPException(404, "unbekannt")
    return await asyncio.to_thread(_ford_fehler, aufrufe[aktion])


@app.post("/hestia-beleg")
async def hestia_beleg(request: Request, x_dateiname: str = Header(default="Beleg.pdf"), _: None = Depends(auth)):
    from urllib.parse import unquote
    daten = await request.body()
    if len(daten) > 40_000_000:
        raise HTTPException(400, "Datei zu groß")
    return await asyncio.to_thread(_ford_fehler, get_core().nebenkosten.vorschlag_aus_datei, daten, unquote(x_dateiname),
                                   {"art": "upload", "datum": __import__("datetime").date.today().isoformat()})


@app.get("/hestia-datei")
async def hestia_datei(vorschlag: str = "", objekt: str = "", jahr: int = 0, _: None = Depends(auth)):
    nk = get_core().nebenkosten
    if vorschlag:
        erg = await asyncio.to_thread(nk.vorschlag_datei, vorschlag)
        if not erg:
            raise HTTPException(404, "nicht gefunden")
        return Response(erg[0], media_type=erg[1], headers={"Cache-Control": "no-store"})
    daten = await asyncio.to_thread(nk.entwurf_datei, objekt, jahr)
    if not daten:
        raise HTTPException(404, "kein PDF")
    return Response(daten, media_type="application/pdf", headers={"Cache-Control": "no-store"})


@app.get("/fahrzeuge")
def fahrzeuge_liste(_: None = Depends(auth)):
    c = get_core()
    t = c.tesla.einrichtung()
    f = c.ford.einrichtung()
    return [{"id": "tesla", "name": t.get("fahrzeug") or "Tesla", "verbunden": bool(t.get("angemeldet") and t.get("vin"))},
            {"id": "ford", "name": f["profil"]["name"], "verbunden": bool(f.get("angemeldet") and f.get("fahrzeug_id")),
             "demo": f.get("demo")}]


@app.get("/briefing")
def briefing_get(_: None = Depends(auth)):
    return get_core().proaktiv.briefing_today()


@app.post("/briefing")
async def briefing_neu(_: None = Depends(auth)):
    return await asyncio.to_thread(get_core().proaktiv.make_briefing, True)


@app.post("/hinweise/pruefen")
async def hinweise_pruefen(_: None = Depends(auth)):
    await asyncio.to_thread(get_core().proaktiv.check_hints)
    return {"ok": True}


@app.get("/bild/{name}")
def bild_datei(name: str, request: Request, _: None = Depends(auth)):
    from atlas.tools import bild
    if not bild.NAME_RE.match(name) or not (bild.DIR / name).exists():
        raise HTTPException(404, "nicht gefunden")
    pfad = bild.DIR / name
    kopf = {"Cache-Control": "private, max-age=86400", "Accept-Ranges": "bytes"}
    rng = request.headers.get("range", "")
    m = re.match(r"bytes=(\d*)-(\d*)$", rng.strip())
    if name.endswith(".webm") and m:                 # Safari spielt Videos nur mit Range-Anfragen
        groesse = pfad.stat().st_size
        a = int(m.group(1)) if m.group(1) else max(0, groesse - int(m.group(2) or 0))
        b = min(int(m.group(2)), groesse - 1) if m.group(1) and m.group(2) else groesse - 1
        b = min(b, a + 4_000_000 - 1)                 # höchstens 4 MB je Antwort
        if a >= groesse:
            return Response(status_code=416, headers={"Content-Range": f"bytes */{groesse}"})
        with open(pfad, "rb") as f:
            f.seek(a)
            data = f.read(b - a + 1)
        return Response(data, status_code=206, media_type="video/webm",
                        headers={**kopf, "Content-Range": f"bytes {a}-{b}/{groesse}"})
    return FileResponse(pfad, headers=kopf, media_type="video/webm" if name.endswith(".webm") else None)


@app.get("/vorschau")
async def vorschau_seite(pfad: str, seite: int = 1, _: None = Depends(auth)):
    from atlas.tools import vorschau
    if not vorschau.INSTANZ:
        raise HTTPException(404, "DATENARCHIV nicht verfügbar")
    try:
        return await asyncio.to_thread(vorschau.INSTANZ.render, pfad, seite)
    except ToolError as e:
        raise HTTPException(400, str(e))


@app.post("/archiv/oeffnen")
async def archiv_oeffnen(data: dict, _: None = Depends(auth)):
    """Klick im Fenster: Datei separat in Vorschau öffnen (vom Nutzer selbst ausgelöst)."""
    from atlas.tools import vorschau
    if not vorschau.INSTANZ:
        raise HTTPException(404, "DATENARCHIV nicht verfügbar")
    try:
        r = await asyncio.to_thread(vorschau.INSTANZ.in_vorschau_oeffnen, data.get("pfad", ""))
    except ToolError as e:
        raise HTTPException(400, str(e))
    get_core().audit.log("werkzeug", name="datei_in_vorschau", pfad=r["geoeffnet"], quelle="klick")
    return r


# ---------------------------------------------------------------- Kontakte aus Fotos (Visitenkarte, Signatur)
def kontakt_vorschlag(dokument_id: str) -> dict:
    """Kontaktdaten aus einem (hineingezogenen oder vom iPhone importierten) Bild lesen – lokal – und als
    Karte zum Prüfen zeigen. Angelegt wird erst nach Klick auf ANLEGEN."""
    from atlas.tools import kontakte
    c = get_core()
    d = c.dokumente.get(dokument_id)
    k = kontakte.aus_text(d["text"], c.providers.get("lokal"))
    if not any(k.get(f) for f in ("vorname", "nachname", "firma", "emails", "telefone")):
        raise ToolError("Auf dem Bild habe ich keine Kontaktdaten erkannt")
    try:
        schon = kontakte.vorhanden(k)
    except Exception:
        schon = []
    c.broadcast({"type": "kontakt_vorschlag", "felder": k, "vorhanden": schon, "dokument_id": dokument_id})
    c.audit.log("kontakt", aktion="vorschlag", felder=sum(1 for v in k.values() if v))
    return {"felder": k, "vorhanden": schon,
            "hinweis": "Die Karte zum Prüfen ist im Dashboard; angelegt wird erst nach Bestätigung (ANLEGEN)."}


@app.post("/kontakt/aus-bild")
async def kontakt_aus_bild(request: Request, x_dateiname: str = Header(default="Kontakt.jpg"),
                           _: None = Depends(auth)):
    """Foto oder Scan (z. B. „Vom iPhone importieren“ in der JARVIS-App) → Kontaktkarte zum Bestätigen."""
    from urllib.parse import unquote
    daten = await request.body()
    try:
        d = await asyncio.to_thread(get_core().dokumente.aufnehmen, unquote(x_dateiname), daten)
        return await asyncio.to_thread(kontakt_vorschlag, d["id"])
    except ToolError as e:
        get_core().broadcast({"type": "info", "text": f"Kontakt: {e}"})
        raise HTTPException(400, str(e))


@app.post("/kontakt/anlegen")
async def kontakt_anlegen(data: dict, _: None = Depends(auth)):
    """Klick auf ANLEGEN in der Kontaktkarte = Bestätigung des Nutzers."""
    from atlas.tools import kontakte
    try:
        r = await asyncio.to_thread(kontakte.anlegen, data.get("felder") or {})
    except ToolError as e:
        raise HTTPException(400, str(e))
    get_core().audit.log("kontakt", aktion="angelegt", quelle="klick")
    return r


@app.post("/archiv/ordner")
async def archiv_ordner(data: dict, _: None = Depends(auth)):
    """Klick auf den Dateipfad: Finder öffnet den Ordner und markiert die Datei."""
    import subprocess
    from atlas.tools import vorschau
    if not vorschau.INSTANZ:
        raise HTTPException(404, "DATENARCHIV nicht verfügbar")
    try:
        p = vorschau.INSTANZ.at._path(data.get("pfad", ""))
        await asyncio.to_thread(subprocess.run, ["open", "-R", str(p)], timeout=15)
    except ToolError as e:
        raise HTTPException(400, str(e))
    return {"ordner": str(p.parent)}


@app.post("/ui-log")
def ui_log(data: dict, _: None = Depends(auth)):
    """Kurze Meldungen der Oberfläche ins Protokoll (Fehlersuche)."""
    get_core().audit.log("ui", text=str(data.get("text", ""))[:200])
    return {"ok": True}


@app.middleware("http")
async def kein_veralteter_cache(request: Request, call_next):
    """Oberfläche nie aus einem alten Zwischenspeicher laden – sonst wirken Updates erst Stunden später."""
    r = await call_next(request)
    if request.url.path.startswith("/ui"):
        r.headers["Cache-Control"] = "no-cache"
    return r


@app.post("/dokument")
async def dokument_hochladen(request: Request, x_dateiname: str = Header(default="Dokument"),
                             _: None = Depends(auth)):
    """Datei aus dem Dashboard (Hineinziehen): lokal speichern und lesen."""
    from urllib.parse import unquote
    daten = await request.body()
    try:
        return await asyncio.to_thread(get_core().dokumente.aufnehmen, unquote(x_dateiname), daten)
    except ToolError as e:
        raise HTTPException(400, str(e))


@app.get("/dokument/{did}/seite")
async def dokument_seite(did: str, _: None = Depends(auth)):
    """Erste Seite eines hineingezogenen Dokuments als Bild – für die Scan-Animation."""
    d = get_core().dokumente.dok.get(did)
    if not d:
        raise HTTPException(404, "nicht gefunden")
    png = await asyncio.to_thread(_erste_seite, d["pfad"])
    if not png:
        raise HTTPException(404, "keine Vorschau")
    return Response(png, media_type="image/png", headers={"Cache-Control": "private, max-age=3600"})


def _erste_seite(pfad: str) -> bytes | None:
    import io
    p = Path(pfad)
    try:
        if p.suffix.lower() == ".pdf":
            import fitz
            with fitz.open(str(p)) as doc:
                pg = doc[0]
                zoom = 560 / max(pg.rect.width, 1)
                return pg.get_pixmap(matrix=fitz.Matrix(zoom, zoom)).tobytes("png")
        if p.suffix.lower() in (".jpg", ".jpeg", ".png", ".heic", ".tif", ".tiff"):
            from PIL import Image
            if p.suffix.lower() == ".heic":
                from pillow_heif import register_heif_opener
                register_heif_opener()
            with Image.open(p) as img:
                img = img.convert("RGB"); img.thumbnail((560, 800))
                b = io.BytesIO(); img.save(b, "PNG"); return b.getvalue()
    except Exception:
        return None
    return None


@app.get("/post")
def post_offen(_: None = Depends(auth)):
    return get_core().post.offen()


@app.post("/post/{bid}/{aktion}")
async def post_aktion(bid: str, aktion: str, data: dict | None = None, _: None = Depends(auth)):
    """Klick auf der Briefkarte = Bestätigung des Nutzers."""
    p = get_core().post
    try:
        if aktion == "ablegen":
            d = data or {}
            r = await asyncio.to_thread(p.ablegen, bid, d.get("ordner", ""), d.get("dateiname", ""))
        elif aktion == "verwerfen":
            r = await asyncio.to_thread(p.verwerfen, bid)
        else:
            raise HTTPException(404, "unbekannte Aktion")
    except ToolError as e:
        raise HTTPException(400, str(e))
    get_core().audit.log("werkzeug", name=f"post_{aktion}", quelle="klick", **{k: v for k, v in r.items() if k != "hinweis"})
    return r


@app.get("/ordner")
def ordner_liste(_: None = Depends(auth)):
    return {"ordner": get_core().post.ordner()}


@app.post("/aufgaben")
async def aufgaben_anlegen(data: dict, _: None = Depends(auth)):
    """Aufgaben aus einem Gespräch als Erinnerungen anlegen (vom Nutzer ausgewählt)."""
    from atlas import hilfen
    from atlas.tools import jxa
    c = get_core()
    liste = (c.cfg.get("aufnahme") or {}).get("liste", "Aus Gesprächen")
    angelegt = []
    for a in (data.get("aufgaben") or [])[:20]:
        titel = str(a.get("titel") or "").strip()[:140]
        if not titel:
            continue
        faellig = ""
        try:
            if a.get("faellig"):
                faellig = (await asyncio.to_thread(hilfen.termin, hilfen.morgens(date.fromisoformat(a["faellig"][:10])))
                           ).strftime("%Y-%m-%dT%H:%M")
        except ValueError:
            pass
        notiz = f"Aus Gespräch: {data.get('quelle', '')}" + (f"\nWer: {a['wer']}" if a.get("wer") else "")
        try:
            await asyncio.to_thread(jxa.run, "Erinnerungen", ERINNERUNG_IN_LISTE, liste, titel, faellig, notiz)
            angelegt.append(titel)
        except ToolError as e:
            raise HTTPException(400, str(e))
    c.audit.log("aufgaben", anzahl=len(angelegt), liste=liste)
    c.lage.invalidate("erinnerungen")
    return {"angelegt": len(angelegt), "liste": liste}


ERINNERUNG_IN_LISTE = r"""
function run(argv){
  const app=Application('Reminders'); const [liste,titel,faellig,notiz]=argv;
  let l=null;
  try { l=app.lists.byName(liste); l.name(); } catch(e) { app.lists.push(app.List({name:liste})); l=app.lists.byName(liste); }
  const props={name:titel, body:notiz}; if(faellig){ props.dueDate=new Date(faellig); props.remindMeDate=new Date(faellig); }
  l.reminders.push(app.Reminder(props)); return JSON.stringify({ok:true});
}"""


@app.get("/nachricht/{rid}")
def nachricht_text(rid: int, _: None = Depends(auth)):
    """Text einer neuen iMessage – nur fürs Vorlesen im Dashboard, geht nicht an die KI."""
    try:
        return get_core().nachrichten.text(rid)
    except ToolError as e:
        raise HTTPException(404, str(e))


@app.post("/oeffnen")
async def oeffnen(data: dict, _: None = Depends(auth)):
    t = get_core().tools.get("datei_oeffnen")
    if not t:
        raise HTTPException(404, "nicht verfügbar")
    try:
        return await asyncio.to_thread(t.func, pfad=data.get("pfad", ""))
    except ToolError as e:
        raise HTTPException(400, str(e))


@app.get("/start")
def start(token: str = ""):
    """Einstieg für die Safari-Web-App: setzt den Zugang als Cookie."""
    if token != get_core().token:
        raise HTTPException(401, "Zugang verweigert – bitte 'jarvis dashboard' verwenden")
    r = RedirectResponse("/ui/")
    r.set_cookie("atlas_token", token, max_age=10 * 365 * 86400, httponly=True, samesite="strict")
    return r


@app.post("/tts")
async def tts(data: dict, _: None = Depends(auth)):
    sp = get_core().speaker
    audio, mime = await asyncio.to_thread(sp.tts, data.get("text", ""),
                                          data.get("lang", ""), bool(data.get("privat")))
    if sp.last["engine"] != "ElevenLabs":
        get_core().audit.log("tts_ersatzstimme", grund=sp.last["grund"])
    from urllib.parse import quote
    return Response(audio, media_type=mime, headers={
        "x-tts-engine": sp.last["engine"], "x-tts-grund": quote(sp.last["grund"]),
        "x-tts-lang": sp.last.get("lang", "")})


@app.post("/tts/stream")
async def tts_stream(data: dict, _: None = Depends(auth)):
    """Gestreamte Stimme: rohes 16-bit-PCM (mono, 24 kHz) in kleinen Stücken."""
    from fastapi.responses import StreamingResponse
    from urllib.parse import quote
    sp = get_core().speaker
    kopf, gen = await asyncio.to_thread(sp.stream, data.get("text", ""), data.get("lang", ""),
                                        bool(data.get("privat")))
    if kopf.get("engine") == "macOS":
        get_core().audit.log("tts_ersatzstimme", grund=kopf.get("grund", ""))
    return StreamingResponse(gen, media_type="application/octet-stream", headers={
        "x-tts-engine": kopf.get("engine", ""), "x-tts-grund": quote(kopf.get("grund", "")),
        "x-tts-rate": str(kopf.get("rate", 24000)), "cache-control": "no-store"})


# ------------------------------------------------------------------ iPhone (Web-App + Siri)
@app.get("/iphone")
def iphone_info(_: None = Depends(auth)):
    from atlas import iphone
    c = get_core()
    url = iphone.zustand().get("url", "")
    start = f"{url}/start?token={c.token}" if url else ""
    return {"url": url, "qr": iphone.qr_svg(start) if start else "", "kurzbefehl": iphone.KURZBEFEHL.exists()}


@app.post("/iphone/einrichten")
async def iphone_einrichten(_: None = Depends(auth)):
    from atlas import iphone
    return await asyncio.to_thread(iphone.einrichten_gui, get_core().token)


@app.get("/iphone/kurzbefehl")
def iphone_kurzbefehl(_: None = Depends(auth)):
    from atlas import iphone
    if not iphone.KURZBEFEHL.exists():
        raise HTTPException(404, "Noch nicht erstellt – 'jarvis iphone' ausführen")
    return FileResponse(iphone.KURZBEFEHL, media_type="application/octet-stream", filename="Frag Jarvis.shortcut")


@app.get("/manifest.webmanifest")
def manifest(atlas_token: str | None = Cookie(default=None)):
    c = get_core()
    start = f"/start?token={c.token}" if atlas_token == c.token else "/ui/"
    return Response(json.dumps({
        "name": "JARVIS", "short_name": "JARVIS", "start_url": start, "scope": "/", "display": "standalone",
        "background_color": "#03080d", "theme_color": "#03080d", "orientation": "portrait",
        "icons": [{"src": "/symbol/180.png", "sizes": "180x180", "type": "image/png"},
                  {"src": "/symbol/512.png", "sizes": "512x512", "type": "image/png"}]}),
        media_type="application/manifest+json")


@app.get("/symbol/{groesse}.png")
def symbol(groesse: int):
    from atlas.paths import REPO_DIR
    groesse = max(32, min(1024, groesse))
    ziel = LOCAL_DIR / "cache" / f"symbol_{groesse}.png"
    if not ziel.exists():
        if not (REPO_DIR / "app" / "icon.png").exists():
            raise HTTPException(404)
        from PIL import Image
        ziel.parent.mkdir(parents=True, exist_ok=True)
        Image.open(REPO_DIR / "app" / "icon.png").convert("RGB").resize((groesse, groesse), Image.LANCZOS).save(ziel)
    return FileResponse(ziel, media_type="image/png", headers={"cache-control": "max-age=86400"})


@app.post("/frage")
async def frage(data: dict, _: None = Depends(auth)):
    """Siri-Kurzbefehl „Frag Jarvis“: Frage rein, kurze Antwort als Text zurück (Siri liest sie vor)."""
    from atlas import agent
    c = get_core()
    text = str(data.get("text") or "").strip()
    from atlas import lizenz
    if lizenz.gesperrt():
        return Response(lizenz.gesperrt(), media_type="text/plain; charset=utf-8")
    if not text:
        return Response("Ich habe nichts verstanden.", media_type="text/plain; charset=utf-8")
    jetzt = time.time()
    if jetzt - getattr(c, "siri_zeit", 0) > 300:          # Folgefragen innerhalb von 5 Minuten behalten den Faden
        c.siri_verlauf = []
    c.siri_zeit = jetzt
    hinweis = ("Diese Frage kam per Siri vom iPhone, Siri liest deine Antwort vor: antworte in ein bis drei kurzen, "
               "ganzen Sätzen, ohne Listen, Tabellen, Sonderzeichen oder Links. Was eine Bestätigung bräuchte "
               "(Senden, Löschen, Ändern), nicht ausführen, sondern sagen, dass es am Mac oder in der Web-App bestätigt werden muss.")
    try:
        antwort = await asyncio.wait_for(asyncio.to_thread(
            agent.run, c, text, c.siri_verlauf, confirm=None, hinweis=hinweis, quelle="siri"), 50)
    except asyncio.TimeoutError:
        antwort = "Das dauert gerade zu lange. Bitte frag mich am Mac oder in der Web-App."
    except Exception as e:
        antwort = f"Da ist etwas schiefgegangen: {type(e).__name__}."
    from atlas.voice import clean_for_speech
    return Response(clean_for_speech(antwort or "Erledigt.")[:1200], media_type="text/plain; charset=utf-8")


# ------------------------------------------------------------------ Karte, Timer, Musik
@app.post("/karte/apple")
async def karte_apple(data: dict, _: None = Depends(auth)):
    return await asyncio.to_thread(get_core().karte.apple_oeffnen, str(data.get("url", "")))


@app.get("/timer")
def timer_liste(_: None = Depends(auth)):
    return get_core().timer.uebersicht()


@app.post("/alarm/{tid}/{aktion}")
def alarm(tid: str, aktion: str, _: None = Depends(auth)):
    t = get_core().timer
    if aktion == "schlummern":
        return t.schlummern(tid)
    return t.stoppen(tid)


@app.get("/musik/cover")
def musik_cover(_: None = Depends(auth)):
    from atlas.musik import COVER
    if not COVER.exists():
        raise HTTPException(404)
    return FileResponse(COVER, media_type="image/jpeg", headers={"cache-control": "no-store"})


@app.get("/musik/status")
async def musik_status(_: None = Depends(auth)):
    return await asyncio.to_thread(get_core().musik.status)


@app.post("/musik/ducken")
async def musik_ducken(data: dict, _: None = Depends(auth)):
    await asyncio.to_thread(get_core().musik.ducken, bool(data.get("an")))
    return {"ok": True}


@app.post("/musik/{aktion}")
async def musik_aktion(aktion: str, data: dict | None = None, _: None = Depends(auth)):
    try:
        return await asyncio.to_thread(get_core().musik.steuern, aktion, (data or {}).get("wert"))
    except ToolError as e:
        raise HTTPException(400, str(e))


# ------------------------------------------------------------------ Verbindungen (⚙ Einstellungen)
def _vb(f, *args):
    try:
        return f(*args)
    except ToolError as e:
        raise HTTPException(400, str(e))


@app.get("/verbindungen")
async def verbindungen_status(_: None = Depends(auth)):
    from atlas import verbindungen as vb
    return await asyncio.to_thread(vb.status, get_core())


@app.post("/verbindungen/schluessel/{art}")
async def verbindungen_schluessel(art: str, data: dict, _: None = Depends(auth)):
    from atlas import verbindungen as vb
    if data.get("loeschen"):
        return await asyncio.to_thread(_vb, vb.schluessel_loeschen, get_core(), art)
    return await asyncio.to_thread(_vb, vb.schluessel_setzen, get_core(), art, str(data.get("wert", "")))


@app.get("/verbindungen/stimmen")
async def verbindungen_stimmen(_: None = Depends(auth)):
    from atlas import verbindungen as vb
    return await asyncio.to_thread(vb.stimmen, get_core())


@app.post("/verbindungen/stimme")
def verbindungen_stimme(data: dict, _: None = Depends(auth)):
    from atlas import verbindungen as vb
    return vb.stimme_setzen(str(data.get("id", "")))


@app.post("/verbindungen/icloud")
async def verbindungen_icloud(data: dict, _: None = Depends(auth)):
    from atlas import verbindungen as vb
    return await asyncio.to_thread(_vb, vb.icloud_setzen, get_core(), data.get("apple_id", ""), data.get("mail", ""),
                                   data.get("pw", ""))


@app.post("/verbindungen/profil")
async def verbindungen_profil(data: dict, _: None = Depends(auth)):
    from atlas import verbindungen as vb
    return await asyncio.to_thread(_vb, vb.profil_setzen, get_core(), data.get("name"), data.get("anrede"),
                                   data.get("ort", ""))


@app.post("/verbindungen/archiv/{aktion}")
async def verbindungen_archiv(aktion: str, _: None = Depends(auth)):
    from atlas import verbindungen as vb
    f = vb.archiv_entfernen if aktion == "entfernen" else vb.archiv_waehlen
    return await asyncio.to_thread(_vb, f, get_core())


@app.post("/verbindungen/lokal")
def verbindungen_lokal(_: None = Depends(auth)):
    from atlas import verbindungen as vb
    return vb.lokal_einrichten(get_core())


@app.post("/link")
async def link_oeffnen(data: dict, _: None = Depends(auth)):
    """Hilfe-Links (Anbieterseiten) im Standardbrowser des Macs öffnen."""
    from urllib.parse import urlparse
    url = str(data.get("url", ""))
    erlaubt = ("console.anthropic.com", "elevenlabs.io", "account.apple.com", "t.me", "serper.dev", "developer.tesla.com",
               "auth.tesla.com", "tesla.com", "developer.ford.com",
               "console.cloud.google.com", "login.tailscale.com", "tailscale.com", "apps.apple.com")
    host = urlparse(url).hostname or ""
    if urlparse(url).scheme != "https" or not any(host == h or host.endswith("." + h) for h in erlaubt):
        raise HTTPException(400, "Link nicht erlaubt")
    await asyncio.to_thread(subprocess.run, ["open", url], capture_output=True)
    return {"ok": True}


@app.get("/funktionen")
def funktionen(_: None = Depends(auth)):
    from atlas.paths import REPO_DIR
    f = REPO_DIR / "FUNKTIONEN.md"
    return {"text": f.read_text(encoding="utf-8") if f.exists() else ""}


@app.post("/update/pruefen")
async def update_pruefen(_: None = Depends(auth)):
    """Sofort nach einer neuen Version sehen (spielt sie ggf. ein und startet neu)."""
    return await asyncio.to_thread(get_core().update.pruefen)


@app.get("/sprache")
def sprache(_: None = Depends(auth)):
    st = voice.settings()
    return {"stimme_de": bool(st["stimme_de"]), "stimme_en": bool(st["stimme_en"]),
            "elevenlabs": bool(get_secret("elevenlabs")), "weckwort": st["weckwort_modell"],
            "letzte_ausgabe": get_core().speaker.last}


@app.websocket("/aufnahme")
async def aufnahme_ws(ws: WebSocket, token: str = "", titel: str = ""):
    """Gesprächsaufnahme: Audio kommt als 16-kHz-PCM; beim Stopp (oder Abbruch) wird transkribiert."""
    from atlas import aufnahme
    c = get_core()
    if c.token not in (token, ws.cookies.get("atlas_token")):
        await ws.close(code=4401)
        return
    await ws.accept()
    a = await asyncio.to_thread(aufnahme.Aufnahme)
    c.aufnahmen_aktiv += 1
    c.audit.log("aufnahme", aktion="start", datei=a.pfad.name)
    await ws.send_json({"type": "laeuft", "datei": a.pfad.name})
    try:
        while True:
            msg = await ws.receive()
            if msg.get("type") == "websocket.disconnect":
                break
            if msg.get("bytes"):
                if not a.schreiben(msg["bytes"]):
                    await ws.send_json({"type": "info", "text": "Höchstdauer erreicht – Aufnahme beendet."})
                    break
            elif msg.get("text") and json.loads(msg["text"]).get("stop"):
                break
    except Exception:
        pass
    a.schliessen()
    c.aufnahmen_aktiv = max(0, c.aufnahmen_aktiv - 1)
    dauer = a.sekunden
    try:
        await ws.send_json({"type": "gestoppt", "sekunden": round(dauer)})
        await ws.close()
    except Exception:
        pass
    if dauer < 2:
        a.pfad.unlink(missing_ok=True)
        c.broadcast({"type": "transkript", "status": "leer"})
        return
    threading.Thread(target=_transkript_job, args=(a.pfad, a.start, titel[:60]), daemon=True).start()


def _transkript_job(wav, start, titel: str = "") -> None:
    from atlas import aufnahme, voice as v
    c = get_core()
    c.broadcast({"type": "transkript", "status": "laeuft", "sekunden": round(wav.stat().st_size / 32000)})
    try:
        if not c.archiv or not c.archiv.archive:
            raise RuntimeError("DATENARCHIV nicht gefunden")
        ziel_ordner = c.archiv.archive / c.cfg["office"]["ausgabe"] / "Transkripte"
        erg = aufnahme.transkribieren(wav, v.settings()["whisper"], c.transcriber.lock)
        c.broadcast({"type": "transkript", "status": "auswertung"})
        try:
            aw = aufnahme.auswerten(erg, c.providers["lokal"])
        except Exception as e:
            c.audit.log("fehler", bereich="transkript_auswertung", text=str(e)[:200])
            aw = {}
        datei = aufnahme.als_word(erg, start, ziel_ordner, titel=titel, auswertung=aw)
        rel = str(datei.relative_to(c.archiv.archive))
        c.audit.log("aufnahme", aktion="transkript", datei=rel, sekunden=round(erg["dauer"]))
        c.broadcast({"type": "transkript", "status": "fertig", "pfad": rel, "titel": titel,
                     "dauer": aufnahme._zeit(erg["dauer"]), "absaetze": len(erg["absaetze"]),
                     "zusammenfassung": aw.get("zusammenfassung") or [], "aufgaben": aw.get("aufgaben") or []})
        from atlas.proaktiv import macos_notify
        macos_notify("JARVIS", f"Transkript fertig: {datei.name}")
    except Exception as e:
        c.audit.log("fehler", bereich="transkript", text=str(e)[:300])
        c.broadcast({"type": "transkript", "status": "fehler", "text": str(e)[:200],
                     "aufnahme": wav.name})


@app.websocket("/audio")
async def audio_ws(ws: WebSocket, token: str = "", wake: int = 0):
    c = get_core()
    if c.token not in (token, ws.cookies.get("atlas_token")):
        await ws.close(code=4401)
        return
    await ws.accept()
    vs = await asyncio.to_thread(VoiceSession, bool(wake), c.transcriber)
    await ws.send_json({"type": "ready", "wake": bool(vs.oww), "wake_error": vs.wake_error,
                        "label": vs.wake_label})

    def vorwaermen():
        """Während du sprichst: Verbindungen zu Claude und ElevenLabs aufbauen."""
        try:
            c.providers["claude"].vorwaermen()
            c.speaker.vorwaermen()
        except Exception:
            pass

    async def finish():
        await ws.send_json({"type": "processing"})
        if vs.n < voice.RATE * 0.3:
            vs.take()
            await ws.send_json({"type": "cancel"})
            return
        t0 = time.monotonic()
        try:
            r = await asyncio.to_thread(vs.abschliessen)
            s_stt = round(time.monotonic() - t0, 2)
            await ws.send_json({"type": "transcript", "text": r["text"], "lang": r["lang"], "s_stt": s_stt})
            c.audit.log("sprache", s_audio=r["s_audio"], s_erkennung=s_stt, stuecke=r["stuecke"])
        except Exception as e:
            vs.take()
            await ws.send_json({"type": "error", "text": f"Spracherkennung: {e}"[:200]})

    try:
        while True:
            msg = await ws.receive()
            if msg.get("type") == "websocket.disconnect":
                break
            if msg.get("bytes"):
                ev = vs.feed(msg["bytes"])
                if ev == "wake":
                    c.audit.log("weckwort")
                    vorwaermen()
                    await ws.send_json({"type": "wake"})
                elif ev == "bargein":
                    c.audit.log("unterbrochen")
                    await ws.send_json({"type": "bargein"})
                elif ev == "cancel":
                    await ws.send_json({"type": "cancel"})
                elif ev == "done":
                    await finish()
            elif msg.get("text"):
                m = json.loads(msg["text"])
                cmd = m.get("ptt")
                if cmd == "start":
                    vs.start("ptt")
                    vorwaermen()
                elif cmd == "listen":                 # Gesprächsmodus: weiter zuhören ohne Weckwort
                    vs.start("wake", no_speech=float(m.get("sek") or 6))
                    vorwaermen()
                elif cmd == "monitor":                # JARVIS spricht: auf Dazwischenreden achten
                    if vs.mode in ("idle", "monitor"):
                        vs.start("monitor")
                elif cmd == "idle":
                    if vs.mode in ("monitor", "wake"):
                        vs.take()
                elif cmd == "stop" and vs.mode in ("ptt", "wake"):
                    await finish()
                elif cmd == "cancel":
                    vs.take()
    except WebSocketDisconnect:
        pass
    finally:
        vs.close()


WEB = Path(__file__).resolve().parent / "web"
app.mount("/ui", StaticFiles(directory=WEB, html=True), name="ui")


@app.get("/")
def root():
    return RedirectResponse("/ui/")


@app.post("/berechtigungen")
async def berechtigungen(_: None = Depends(auth)):
    """Jede Datenquelle einmal ansprechen – löst die macOS-Erlaubnisdialoge aus."""
    c = get_core()
    tests = {"Kalender (iCloud)": ("kalender_liste", {}),
             "Erinnerungen": ("erinnerungen_listen", {}),
             "Notizen": ("notizen_suchen", {"suchbegriff": "JARVIS-Test"}),
             "Kontakte": ("kontakte_suchen", {"name": "JARVIS-Test"}),
             "Mail (iCloud)": ("mail_posteingang", {"anzahl": 1})}
    out = {}
    for label, (name, args) in tests.items():
        try:
            await asyncio.to_thread(c.tools[name].func, **args)
            out[label] = "ok"
        except Exception as e:
            out[label] = str(e)
    return out


@app.websocket("/ws")
async def ws_endpoint(ws: WebSocket, token: str = ""):
    if get_core().token not in (token, ws.cookies.get("atlas_token")):
        await ws.close(code=4401)
        return
    await ws.accept()
    s = Session()
    c = get_core()
    from atlas import lizenz
    if lizenz.gesperrt():
        await ws.send_json({"type": "gesperrt", "text": lizenz.gesperrt()})
        try:
            while True:
                await ws.receive_json()
                await ws.send_json({"type": "gesperrt", "text": lizenz.gesperrt()})
        except WebSocketDisconnect:
            return
    c.audit.log("sitzung_start")
    c.loop = asyncio.get_running_loop()
    c.ws_clients.add(ws)
    h = datetime.now().hour
    gruss = "Guten Morgen" if 4 <= h < 11 else "Guten Tag" if 11 <= h < 18 else "Guten Abend"
    anrede = (c.cfg.get("anrede") or "").strip()
    shown = LOCAL_DIR / "briefing_gezeigt"
    b = await asyncio.to_thread(c.proaktiv.briefing_today)
    try:
        already = shown.read_text().strip() == date.today().isoformat()
    except OSError:
        already = False
    # Begrüßung nur gesprochen (kein Text im Dashboard); gibt es heute erstmals das Tagesupdate, begrüßt dieses
    await ws.send_json({"type": "gruss", "text": f"{gruss}, {anrede}." if anrede else f"{gruss}.",
                        "briefing": bool(b.get("text")) and not already})
    if b.get("text") and not already:
        await ws.send_json({"type": "briefing", "text": b["text"], "text_marken": b.get("text_marken") or b["text"],
                            "vortrag": b.get("vortrag")})
        try:
            shown.write_text(date.today().isoformat())
        except OSError:
            pass
    ws._atlas_session = s

    async def antworten(m: dict):
        try:
            await _chat(ws, s, m["text"].strip(), bool(m.get("stimme")),
                        m.get("quelle", ""), m.get("dokumente") or [])
        except (WebSocketDisconnect, asyncio.CancelledError):
            pass
        except Exception as e:             # Fehler melden, Verbindung halten
            c.audit.log("fehler", text=f"{type(e).__name__}: {e}"[:200])
            try:
                await ws.send_json({"type": "error", "text": f"Interner Fehler: {e}"[:200]})
            except Exception:
                pass

    try:
        while True:
            msg = await ws.receive_json()
            kind = msg.get("type")
            if kind == "confirm":
                f = s.antworten.get(msg.get("id"))
                if f and not f.done():
                    f.set_result(bool(msg.get("answer")))
            elif kind == "player":                 # Zustand des Podcast-Players im Dashboard
                c.musik.player_meldung(msg)
            elif kind == "stop":                   # Antwort abbrechen (Nutzer spricht dazwischen)
                if s.task and not s.task.done():
                    s.task.cancel()
                    for f in list(s.antworten.values()):
                        if not f.done():
                            f.set_result(False)
            elif kind == "chat" and (msg.get("text", "").strip() or msg.get("dokumente")):
                st = msg.get("standort")
                if isinstance(st, dict) and st.get("lat") is not None:
                    c.karte.standort = (float(st["lat"]), float(st["lon"]), time.time())
                    asyncio.get_running_loop().run_in_executor(None, c.standort.setzen, st["lat"], st["lon"], None, "browser")
                if s.task and not s.task.done():   # vorherige Antwort läuft noch: erst beenden
                    s.task.cancel()
                    try:
                        await asyncio.wait_for(asyncio.shield(s.task), 3)
                    except BaseException:
                        pass
                s.task = asyncio.create_task(antworten(msg))
            elif kind == "mode":
                s.mode = msg.get("value", "auto")
                await ws.send_json({"type": "info", "text": f"Modus: {s.mode}"})
            elif kind == "clear":
                asyncio.create_task(_summarize(list(s.messages)))
                s.messages.clear()
                s.fakten.clear()
                s.freigaben.clear()
                s.sensitive = False
                await ws.send_json({"type": "info", "text": "Verlauf geleert."})
    except WebSocketDisconnect:
        if s.task and not s.task.done():
            s.task.cancel()
        c.ws_clients.discard(ws)
        c.audit.log("sitzung_ende")
        asyncio.create_task(_summarize(list(s.messages)))


def _whisper_vorwaermen():
    """Spracherkennung beim Start einmal laden – sonst dauert der erste Sprachbefehl mehrere Sekunden."""
    import numpy as np
    time.sleep(20)
    try:
        get_core().transcriber.transcribe(np.zeros(16000, dtype=np.int16))
    except Exception:
        pass


def run():
    from atlas import aktualisierung
    aktualisierung.notfall_pruefen()   # startet der Kern immer wieder neu? Dann zuerst Korrektur holen
    c = get_core()      # Konfiguration früh laden, Fehler sofort sichtbar
    from atlas import lizenz
    if lizenz.betroffen(c.cfg):        # weitergegebene Installation: Sperrliste des Herausgebers prüfen
        lizenz.pruefen(c.cfg)
        lizenz.waechter(c)
        if lizenz.gesperrt():
            print("JARVIS ist deaktiviert:", lizenz.gesperrt(), flush=True)
            c.audit.log("lizenz", gesperrt=True)
            try:
                c.update.start()       # Updates laufen weiter (eine neue Version kann die Sperre aufheben)
            except Exception:
                pass
            uvicorn.run(app, host="127.0.0.1", port=PORT, log_level="warning")
            return
    # Zusatzdienste einzeln absichern: ein Fehler darin darf den Kern nie lahmlegen
    starts = [
        ("Archivindex", lambda: c.archiv and c.archiv.start()),
        ("Wache", c.proaktiv.start),
        ("Aktualisierung", c.update.start),
        ("iMessage", lambda: c.nachrichten.start(c.proaktiv.stop)),
        ("Spracherkennung vorwärmen", lambda: threading.Thread(target=_whisper_vorwaermen, daemon=True).start()),
        ("Werbefilter", lambda: c.werbung.start(c.proaktiv.stop)),
        ("HESTIA Nebenkosten", lambda: c.nebenkosten.start(c.proaktiv.stop)),
        ("Mail-Wache", lambda: c.mailwache.start(c.proaktiv.stop)),
        ("Aufmerksamkeit", lambda: c.aufmerksamkeit.start(c.proaktiv.stop)),
        ("Zielregister", lambda: c.ziele.start(c.proaktiv.stop)),
        ("Zuhause", lambda: c.zuhause.start(c.proaktiv.stop)),
        ("Timer", c.timer.start),
        ("Musik", c.musik.start),
        ("Beihilfe-Workflow", lambda: c.archiv and c.beihilfe.start(c.proaktiv.stop)),
        ("lokales Modell vorwärmen", lambda: c.cfg["router"].get("einfach") == "lokal" and
            threading.Thread(target=c.providers["lokal"].warmup, daemon=True).start()),
    ]
    for name, f in starts:
        try:
            f()
        except Exception as e:
            c.audit.log("fehler", bereich="start", dienst=name, text=f"{type(e).__name__}: {e}"[:300])
            print(f"Start von {name} fehlgeschlagen: {e}", flush=True)
    aktualisierung.start_erfolgreich()
    uvicorn.run(app, host="127.0.0.1", port=PORT, log_level="warning")

if __name__ == "__main__":
    run()
