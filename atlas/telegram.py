"""Telegram-Bot: JARVIS vom iPhone erreichen und Hinweise/Briefing erhalten.

Ein Bot je Nutzer (eigener Schlüssel von @BotFather). Abgerufen wird nur auf
dem Gerät mit der Wache – Telegram erlaubt ohnehin nur einen Abrufer.
Antworten gehen ausschließlich an die hinterlegte Chat-ID."""
import threading
import time
import uuid

import httpx

from atlas import agent
from atlas.keystore import get_secret
from atlas.paths import read_private_json, write_private_json

API = "https://api.telegram.org/bot{token}/{method}"
SETTINGS = "telegram.json"


def settings() -> dict:
    return read_private_json(SETTINGS, {"chat_id": None})


class TelegramBot:
    def __init__(self, core):
        self.c = core
        self.token = get_secret("telegram")
        self.chat_id = settings().get("chat_id")
        self.offset = 0
        self.history: list[dict] = []
        self.pending: dict[str, dict] = {}      # Rückfragen: id -> {"event", "answer"}
        self.busy = threading.Lock()

    @property
    def ready(self) -> bool:
        return bool(self.token and self.chat_id)

    def _call(self, method: str, timeout: float = 20, **params):
        r = httpx.post(API.format(token=self.token, method=method), json=params, timeout=timeout)
        r.raise_for_status()
        return r.json().get("result")

    # ---------- senden ----------
    def send(self, text: str, buttons: list[list[dict]] | None = None) -> None:
        if not self.ready or not text:
            return
        for i in range(0, len(text), 3900):                  # Telegram-Limit 4096
            params = {"chat_id": self.chat_id, "text": text[i:i + 3900]}
            if buttons and i + 3900 >= len(text):
                params["reply_markup"] = {"inline_keyboard": buttons}
            try:
                self._call("sendMessage", **params)
            except httpx.HTTPError:
                pass

    def confirm(self, question: str, timeout: int = 180) -> bool:
        """Rückfrage mit Ja/Nein-Knöpfen; wartet auf die Antwort."""
        cid = uuid.uuid4().hex[:10]
        ev = threading.Event()
        self.pending[cid] = {"event": ev, "answer": False}
        self.send(f"❓ {question}", [[{"text": "✅ Ja", "callback_data": f"{cid}:1"},
                                     {"text": "✖️ Nein", "callback_data": f"{cid}:0"}]])
        ev.wait(timeout)
        return self.pending.pop(cid, {}).get("answer", False)

    # ---------- empfangen ----------
    def poll_once(self) -> None:
        r = httpx.post(API.format(token=self.token, method="getUpdates"), timeout=35,
                       json={"offset": self.offset, "timeout": 25,
                             "allowed_updates": ["message", "callback_query"]})
        r.raise_for_status()
        updates = r.json().get("result") or []
        for u in updates:
            self.offset = u["update_id"] + 1
            if "callback_query" in u:
                self._on_button(u["callback_query"])
            elif "message" in u:
                msg = u["message"]
                if str(msg.get("chat", {}).get("id")) != str(self.chat_id):
                    continue                                # fremde Absender ignorieren
                text = (msg.get("text") or "").strip()
                if msg.get("photo") or msg.get("document"):
                    threading.Thread(target=self._datei, args=(msg,), daemon=True).start()
                elif text:
                    threading.Thread(target=self._answer, args=(text,), daemon=True).start()

    def _on_button(self, q):
        if str(q.get("message", {}).get("chat", {}).get("id")) != str(self.chat_id):
            return
        cid, _, val = (q.get("data") or "").partition(":")
        p = self.pending.get(cid)
        try:
            self._call("answerCallbackQuery", callback_query_id=q["id"],
                       text="Freigegeben" if val == "1" else "Abgelehnt")
        except httpx.HTTPError:
            pass
        if p:
            p["answer"] = val == "1"
            p["event"].set()

    # ---------- Fotos/PDFs von Briefen → Posteingang ----------
    def _datei(self, msg: dict) -> None:
        """Ein Foto oder PDF vom iPhone landet im Genius-Scan-Ordner und wird sofort verarbeitet –
        wie ein Scan (Rechnung, Bescheid oder Brief). Die Bildunterschrift kann den Dateinamen vorgeben,
        z. B. „[EHU] 2026_10 - 01-3496-001600“ für eine Arztrechnung."""
        import re
        from datetime import datetime
        from pathlib import Path
        from atlas.workflows.beihilfe import DATEITYPEN, RE_RECHNUNG
        ein = self.c.beihilfe.eingang() if getattr(self.c, "beihilfe", None) else None
        if not ein:
            self.send("Den Scan-Ordner finde ich nicht – Datei nicht übernommen.")
            return
        if msg.get("document"):
            d = msg["document"]
            fid, ext = d["file_id"], Path(d.get("file_name") or "x.pdf").suffix.lower() or ".pdf"
        else:
            fid, ext = msg["photo"][-1]["file_id"], ".jpg"          # größte Auflösung
        if ext not in DATEITYPEN:
            self.send(f"Dateityp {ext} kann ich nicht verarbeiten (PDF oder Foto bitte).")
            return
        try:
            info = self._call("getFile", file_id=fid)
            r = httpx.get(f"https://api.telegram.org/file/bot{self.token}/{info['file_path']}", timeout=60)
            r.raise_for_status()
        except (httpx.HTTPError, KeyError, TypeError) as e:
            self.send(f"Download fehlgeschlagen: {e}"[:200])
            return
        if (msg.get("caption") or "").strip().lower().startswith(("kontakt", "visitenkarte")):
            self._kontakt(r.content, ext)
            return
        caption = re.sub(r'[/\\:*?"<>|]', " ", (msg.get("caption") or "").strip())[:110]
        name = caption + ext if caption and RE_RECHNUNG.match(caption + ext) else \
            f"Telegram {datetime.now():%Y-%m-%d %H.%M.%S}{ext}"
        ziel = Path(ein) / name
        ziel.write_bytes(r.content)
        self.c.audit.log("telegram", aktion="datei", name=name, bytes=len(r.content))
        self.send(f"📥 Erhalten – lese „{name}“ …")
        try:
            berichte = self.c.beihilfe.lauf(sofort=True)
        except Exception as e:
            berichte = [f"Fehler bei der Verarbeitung: {e}"[:200]]
        eigene = [b for b in berichte if b] or ["Datei liegt im Scan-Ordner; ich verarbeite sie beim nächsten Durchgang."]
        self.send("\n\n".join(eigene)[:3800])

    def _kontakt(self, daten: bytes, ext: str) -> None:
        """Foto einer Visitenkarte mit Bildunterschrift „Kontakt“: auslesen, zeigen, nach Ja anlegen."""
        from atlas.tools import ToolError, kontakte
        try:
            d = self.c.dokumente.aufnehmen(f"Kontakt{ext}", daten)
            k = kontakte.aus_text(self.c.dokumente.get(d["id"])["text"], self.c.providers.get("lokal"))
        except ToolError as e:
            self.send(f"Konnte das Bild nicht lesen: {e}")
            return
        name = " ".join(x for x in (k["vorname"], k["nachname"]) if x)
        if not (name or k["firma"] or k["emails"] or k["telefone"]):
            self.send("Auf dem Bild habe ich keine Kontaktdaten erkannt.")
            return
        zeilen = [x for x in (name, k["position"], k["firma"], *k["emails"],
                              *(f"{t['art']}: {t['nummer']}" for t in k["telefone"]),
                              " ".join(x for x in (k["strasse"], k["plz"], k["ort"]) if x), k["webseite"]) if x]
        schon = kontakte.vorhanden(k)
        frage = "👤 Erkannt:\n" + "\n".join(zeilen) + (f"\n\n⚠️ Ähnlicher Kontakt vorhanden: {', '.join(schon)}" if schon else "") \
            + "\n\nSo anlegen?"
        if self.confirm(frage):
            try:
                r = kontakte.anlegen(k)
                self.send(f"✅ Kontakt „{r.get('angelegt')}“ angelegt.")
                self.c.audit.log("kontakt", aktion="angelegt", quelle="telegram")
            except ToolError as e:
                self.send(f"Anlegen fehlgeschlagen: {e}")
        else:
            self.send("Nicht angelegt.")

    def _answer(self, text: str):
        if text in ("/start", "/hilfe"):
            self.send("Zu Diensten. Schreib mir einfach, was ich tun soll. Fotos oder PDFs von Briefen "
                      "kommen direkt in den Posteingang (Bildunterschrift „[EHU] 2026_10 - Nummer“ für Arztrechnungen). "
                      "/briefing – Tageslage · /neu – Verlauf leeren · /stop – Not-Aus")
            return
        if text == "/neu":
            self.history.clear()
            self.send("Verlauf geleert.")
            return
        if text == "/stop":
            self.c.gate.set_notaus(True)
            self.send("⛔ Not-Aus aktiv – ich lese nur noch. Aufheben im Dashboard oder mit /weiter.")
            return
        if text == "/weiter":
            self.c.gate.set_notaus(False)
            self.send("Not-Aus aufgehoben.")
            return
        if text == "/briefing":
            text = BRIEFING_PROMPT
        with self.busy:
            try:
                self._call("sendChatAction", chat_id=self.chat_id, action="typing")
            except httpx.HTTPError:
                pass
            try:
                reply = agent.run(self.c, text, self.history, confirm=self.confirm,
                                  notify=self.send, quelle="telegram",
                                  hinweis="Die Antwort geht per Telegram aufs iPhone: kurz, "
                                          "ohne Tabellen und ohne Markdown-Formatierung.")
            except Exception as e:
                reply = f"Fehler: {e}"[:300]
        self.send(reply or "(erledigt)")

    # ---------- Schleife (nur mit Wache) ----------
    def loop(self, is_leader, stop: threading.Event):
        while not stop.is_set():
            if not self.ready or not is_leader():
                stop.wait(30)
                self.token = get_secret("telegram")
                self.chat_id = settings().get("chat_id")
                continue
            try:
                self.poll_once()
            except httpx.HTTPStatusError as e:
                stop.wait(60 if e.response.status_code == 409 else 15)  # 409: anderer Abrufer
            except Exception:
                stop.wait(10)


BRIEFING_PROMPT = (
    "Erstelle mein Morgenbriefing: Begrüßung, Wetter heute, Termine heute mit Uhrzeit, "
    "fällige und überfällige Erinnerungen, wichtige ungelesene Mails (höchstens drei, "
    "Absender und Thema), Fristen der nächsten 7 Tage und Geburtstage. Nutze die Werkzeuge. "
    "Gut vorlesbar, ganze Sätze, höchstens 140 Wörter, das Wichtigste zuerst.")


def setup_chat_id(token: str, wait_seconds: int = 120) -> str | None:
    """Wartet auf die erste Nachricht an den Bot und merkt sich deren Chat-ID."""
    end = time.time() + wait_seconds
    offset = 0
    while time.time() < end:
        r = httpx.post(API.format(token=token, method="getUpdates"),
                       json={"offset": offset, "timeout": 20}, timeout=30).json()
        for u in r.get("result", []):
            offset = u["update_id"] + 1
            chat = (u.get("message") or {}).get("chat", {})
            if chat.get("id"):
                write_private_json(SETTINGS, {"chat_id": chat["id"]})
                httpx.post(API.format(token=token, method="getUpdates"), json={"offset": offset}, timeout=10)
                return str(chat["id"])
    return None
