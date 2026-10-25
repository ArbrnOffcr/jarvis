"""iMessage/SMS: neue Nachrichten bemerken und auf Wunsch vorlesen.

Liest die Nachrichten-Datenbank des Macs (~/Library/Messages/chat.db) nur lesend. Dafür braucht
JARVIS einmalig den Festplattenvollzugriff. Inhalte gehen nicht in die Cloud: Das Dashboard fragt
„vorlesen?“ und liest den Text mit der Mac-Stimme vor; die KI sieht nur Absender und Uhrzeit."""
import json
import re
import sqlite3
import threading
import time
from datetime import datetime
from pathlib import Path

from atlas.tools import S, Tool, ToolError, jxa

DB = Path.home() / "Library" / "Messages" / "chat.db"

KONTAKTE = r"""
function run(){ const app=Application('Contacts'); const out={};
  const ps=app.people();
  for (const p of ps){ let n=''; try{ n=p.name(); }catch(e){ continue; }
    try{ for (const t of p.phones.value()) out[t]=n; }catch(e){}
    try{ for (const m of p.emails.value()) out[m.toLowerCase()]=n; }catch(e){} }
  return JSON.stringify(out); }"""


def _text_aus_blob(blob: bytes | None) -> str:
    """Neuere macOS-Versionen speichern den Text nur im 'attributedBody' (NSAttributedString)."""
    if not blob:
        return ""
    i = blob.find(b"NSString")
    if i < 0:
        return ""
    j = blob.find(b"+", i)
    if j < 0 or j + 2 > len(blob):
        return ""
    n, start = blob[j + 1], j + 2
    if n == 0x81:
        n, start = int.from_bytes(blob[j + 2:j + 4], "little"), j + 4
    elif n == 0x82:
        n, start = int.from_bytes(blob[j + 2:j + 5], "little"), j + 5
    return blob[start:start + n].decode("utf-8", errors="ignore").strip()


def _ziffern(s: str) -> str:
    d = re.sub(r"\D", "", s or "")
    return d[-9:] if len(d) >= 9 else d


class Nachrichten:
    def __init__(self, core):
        self.c = core
        self.cfg = core.cfg.get("nachrichten") or {}
        self.aktiv = self.cfg.get("aktiv", True)
        self.letzte = None
        self.neu: dict[int, dict] = {}
        self.namen: dict[str, str] = {}
        self.namen_zeit = 0.0
        self.gemeldet_fehlt = False

    # ---------- Datenbank ----------
    def _db(self) -> sqlite3.Connection:
        return sqlite3.connect(f"file:{DB}?mode=ro", uri=True, timeout=5)

    def lesbar(self) -> bool:
        try:
            with self._db() as con:
                con.execute("SELECT 1 FROM message LIMIT 1")
            return True
        except sqlite3.Error:
            return False

    def _namen_laden(self) -> None:
        """Telefonnummern/Adressen → Namen. Schnell direkt aus der Kontakte-Datenbank (dank
        Festplattenvollzugriff), sonst über die Kontakte-App."""
        namen = {}
        basis = Path.home() / "Library" / "Application Support" / "AddressBook"
        for db in list(basis.glob("Sources/*/AddressBook-v22.abcddb")) + list(basis.glob("AddressBook-v22.abcddb")):
            try:
                with sqlite3.connect(f"file:{db}?mode=ro", uri=True, timeout=3) as con:
                    for vor, nach, firma, nummer in con.execute(
                            "SELECT r.ZFIRSTNAME, r.ZLASTNAME, r.ZORGANIZATION, p.ZFULLNUMBER FROM ZABCDPHONENUMBER p "
                            "JOIN ZABCDRECORD r ON p.ZOWNER = r.Z_PK"):
                        n = " ".join(x for x in (vor, nach) if x) or firma
                        if n and nummer:
                            namen[_ziffern(nummer)] = n
                    for vor, nach, firma, adr in con.execute(
                            "SELECT r.ZFIRSTNAME, r.ZLASTNAME, r.ZORGANIZATION, e.ZADDRESS FROM ZABCDEMAILADDRESS e "
                            "JOIN ZABCDRECORD r ON e.ZOWNER = r.Z_PK"):
                        n = " ".join(x for x in (vor, nach) if x) or firma
                        if n and adr:
                            namen[adr.lower()] = n
            except sqlite3.Error:
                continue
        if not namen:
            try:
                roh = jxa.run("Kontakte", KONTAKTE, timeout=120) or {}
                namen = {(_ziffern(k) if "@" not in k else k): v for k, v in roh.items()}
            except ToolError:
                pass
        if namen:
            self.namen = namen
        self.namen_zeit = time.time()

    def _name(self, handle: str) -> str:
        if time.time() - self.namen_zeit > 3600:
            self._namen_laden()
        if not handle:
            return "Unbekannt"
        key = handle.lower() if "@" in handle else _ziffern(handle)
        return self.namen.get(key) or handle

    def abrufen(self) -> list[dict]:
        with self._db() as con:
            if self.letzte is None:              # beim Start: Bisheriges nicht melden
                self.letzte = con.execute("SELECT IFNULL(MAX(ROWID),0) FROM message").fetchone()[0]
                return []
            rows = con.execute("""
                SELECT m.ROWID, m.text, m.attributedBody, m.date, h.id, m.cache_has_attachments, c.display_name
                FROM message m
                LEFT JOIN handle h ON m.handle_id = h.ROWID
                LEFT JOIN chat_message_join cmj ON cmj.message_id = m.ROWID
                LEFT JOIN chat c ON c.ROWID = cmj.chat_id
                WHERE m.ROWID > ? AND m.is_from_me = 0 AND IFNULL(m.associated_message_type,0) = 0
                ORDER BY m.ROWID""", (self.letzte,)).fetchall()
        out = []
        for rid, text, blob, d, handle, anhang, gruppe in rows:
            self.letzte = max(self.letzte, rid)
            inhalt = (text or _text_aus_blob(blob) or "").replace("￼", "").strip()
            if not inhalt and anhang:
                inhalt = "(Bild oder Anhang)"
            if not inhalt:
                continue
            sek = (d or 0) / 1e9 if (d or 0) > 1e11 else (d or 0)      # Nanosekunden seit 2001 (UTC)
            zeit = datetime.fromtimestamp(978307200 + sek)
            out.append({"id": rid, "von": self._name(handle), "gruppe": gruppe or "",
                        "zeit": zeit.strftime("%H:%M"), "text": inhalt})
        return out

    # ---------- Hintergrund ----------
    def _stand(self) -> tuple:
        """Änderungsmerkmal der Datenbank (neue Nachrichten landen zuerst in chat.db-wal)."""
        out = []
        for f in (DB, DB.with_name("chat.db-wal")):
            try:
                st = f.stat()
                out.append((st.st_mtime_ns, st.st_size))
            except OSError:
                out.append(None)
        return tuple(out)

    def schleife(self, stop: threading.Event) -> None:
        self._namen_laden()                        # vorab, damit die erste Meldung sofort einen Namen hat
        stand = None
        while not stop.wait(1):                    # jede Sekunde nur die Dateizeit prüfen – kostet nichts
            if not self.aktiv:
                continue
            neu_stand = self._stand()
            if neu_stand == stand and self.letzte is not None:
                continue
            stand = neu_stand
            try:
                for n in self.abrufen():
                    self.neu[n["id"]] = n
                    self.c.audit.log("nachricht", von=n["von"], gruppe=n["gruppe"])   # ohne Inhalt
                    self.c.broadcast({"type": "nachricht", "id": n["id"], "von": n["von"],
                                      "gruppe": n["gruppe"], "zeit": n["zeit"]})
                while len(self.neu) > 50:
                    self.neu.pop(next(iter(self.neu)))
            except sqlite3.Error:
                if not self.gemeldet_fehlt:
                    self.gemeldet_fehlt = True
                    self.c.broadcast({"type": "info", "text":
                        "Für iMessage braucht JARVIS den Festplattenvollzugriff: Systemeinstellungen → "
                        "Datenschutz & Sicherheit → Festplattenvollzugriff → JARVIS-Core (python) hinzufügen."})
            except Exception as e:
                self.c.audit.log("fehler", bereich="nachrichten", text=str(e)[:200])

    def start(self, stop: threading.Event) -> None:
        if self.aktiv:
            threading.Thread(target=self.schleife, args=(stop,), name="nachrichten", daemon=True).start()

    # ---------- für Dashboard und KI ----------
    def text(self, rid: int) -> dict:
        n = self.neu.get(int(rid))
        if not n:
            raise ToolError("Nachricht nicht mehr vorhanden")
        return {**n, "privat": not self.cfg.get("vorlesen_extern", False)}

    def liste(self) -> dict:
        return {"neue_nachrichten": [{"id": n["id"], "von": n["von"], "gruppe": n["gruppe"], "zeit": n["zeit"]}
                                     for n in list(self.neu.values())[-10:]],
                "hinweis": "Inhalte siehst du nicht; zum Vorlesen 'nachricht_vorlesen' nutzen."}

    def vorlesen(self, von: str = "") -> dict:
        kand = [n for n in self.neu.values() if not von or von.lower() in n["von"].lower()]
        if not kand:
            return {"vorgelesen": False, "hinweis": "Keine passende neue Nachricht."}
        n = kand[-1]
        self.c.broadcast({"type": "nachricht_vorlesen", "id": n["id"]})
        return {"vorgelesen": True, "von": n["von"],
                "hinweis": "Das Dashboard liest die Nachricht jetzt vor. Sag selbst nichts zum Inhalt."}


SENDEN = r"""
on run argv
  set ziel to item 1 of argv
  set txt to item 2 of argv
  set dienst to item 3 of argv
  tell application "Messages"
    if dienst is "SMS" then
      set konto to 1st account whose service type = SMS
    else
      set konto to 1st account whose service type = iMessage
    end if
    send txt to participant ziel of konto
  end tell
  return "ok"
end run"""


def _empfaenger(wer: str) -> tuple[str, str]:
    """Name, Nummer oder Mail → (Adresse für Nachrichten, Anzeigename)."""
    wer = (wer or "").strip()
    if "@" in wer or re.fullmatch(r"[+\d][\d\s/()-]{5,}", wer):
        return re.sub(r"[\s/()-]", "", wer) if "@" not in wer else wer, wer
    from atlas.tools.kontakte import finden, suchen
    k = finden(wer)
    voll = next((x for x in suchen(k["name"]) if x.get("id") == k.get("id")), k)
    telefone = voll.get("telefon") or []
    mobil = [t for t in telefone if re.search(r"mobil|iphone|handy|mobile", t, re.I)]
    for t in mobil + telefone:
        nr = re.sub(r"[^\d+]", "", t.split(":", 1)[-1])
        if nr:
            return nr, voll["name"]
    if voll.get("emails"):
        return voll["emails"][0], voll["name"]
    raise ToolError(f"Für {voll['name']} ist keine Nummer oder Mail hinterlegt")


def senden(empfaenger: str, text: str) -> dict:
    import subprocess
    text = (text or "").strip()
    if not text:
        raise ToolError("Kein Text")
    ziel, name = _empfaenger(empfaenger)
    fehler = ""
    for dienst in ("iMessage", "SMS"):
        r = subprocess.run(["osascript", "-e", SENDEN, ziel, text, dienst], capture_output=True, text=True, timeout=60)
        if r.returncode == 0:
            return {"gesendet_an": name, "adresse": ziel, "dienst": dienst}
        fehler = r.stderr.strip()[-200:]
    if "-1743" in fehler or "not authorized" in fehler.lower():
        raise ToolError("Keine Erlaubnis, Nachrichten zu steuern – Systemeinstellungen → Datenschutz & Sicherheit → "
                        "Automation → JARVIS/python → Nachrichten erlauben.")
    raise ToolError(f"Nachricht nicht gesendet: {fehler}")


def tools(core) -> list[Tool]:
    n = core.nachrichten
    return [
        Tool("nachricht_senden",
             "iMessage (sonst SMS) an einen Kontakt, eine Nummer oder Mail senden. Wird vom Nutzer bestätigt. Text so "
             "formulieren, wie der Nutzer ihn diktiert bzw. gewünscht hat.", "nachrichten.senden", senden,
             {"empfaenger": S("Name aus den Kontakten, Telefonnummer oder Apple-ID"), "text": S("Nachrichtentext")},
             ["empfaenger", "text"], label=lambda a: f"Nachricht an {a.get('empfaenger')}: „{str(a.get('text'))[:120]}“"),
        Tool("nachrichten_neu", "Neue iMessages/SMS: Absender und Uhrzeit (ohne Inhalt).",
             "nachrichten.lesen", n.liste),
        Tool("nachricht_vorlesen", "Die neueste Nachricht (optional eines Absenders) im Dashboard vorlesen lassen.",
             "nachrichten.lesen", n.vorlesen, {"von": S("Absender, optional")}),
    ]
