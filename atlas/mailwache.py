"""Mail-Wache: JARVIS überwacht den iCloud-Posteingang dauerhaft im Hintergrund und meldet sich sofort, wenn eine
erwartete Mail eintrifft („Sag mir Bescheid, sobald die Mail von der Personalstelle kommt“) – auf Wunsch auch bei jeder
neuen Mail.

- Prüft alle 2 Minuten (einstellbar) nur Kopfzeilen neuer Mails (Absender, Betreff); gelesen wird nichts markiert.
- Meldung: Ansage im Dashboard („Soll ich sie vorlesen?“), Mitteilung auf dem Mac und – falls eingerichtet – Telegram.
- Eine Wache endet nach dem ersten Treffer, außer sie ist „dauerhaft“; optional mit Enddatum.
- Läuft nur auf dem führenden Mac (wie Werbefilter und Briefing), damit nichts doppelt gemeldet wird.
"""
import email
import re
import secrets
import threading
import time
from datetime import date, datetime
from email.header import decode_header, make_header

from atlas.paths import read_private_json, write_private_json
from atlas.tools import S, Tool, ToolError

DATEI = "mailwache.json"


def _h(v) -> str:
    try:
        return str(make_header(decode_header(v or "")))
    except Exception:
        return str(v or "")


def _datum(s: str) -> str:
    s = (s or "").strip()
    for f in ("%Y-%m-%d", "%d.%m.%Y", "%d.%m.%y"):
        try:
            return datetime.strptime(s, f).date().isoformat()
        except ValueError:
            pass
    return ""


class MailWache:
    def __init__(self, core):
        self.c = core
        self.lock = threading.Lock()
        self.letzter = 0.0

    def _z(self) -> dict:
        return read_private_json(DATEI, {"wachen": [], "letzte_uid": 0, "intervall_s": 120, "treffer": []})

    def _s(self, z: dict) -> None:
        z["treffer"] = z.get("treffer", [])[-50:]
        write_private_json(DATEI, z)

    # ------------------------------------------------------------ Wachen verwalten
    def setzen(self, absender: str = "", stichwort: str = "", bis: str = "", dauerhaft: bool = False,
               alle: bool = False, notiz: str = "", dringend: bool = False) -> dict:
        absender, stichwort = (absender or "").strip()[:80], (stichwort or "").strip()[:80]
        if not (absender or stichwort or alle):
            raise ToolError("Worauf soll ich achten? Absender, ein Stichwort im Betreff – oder „jede neue Mail“")
        w = {"id": "w" + secrets.token_hex(3), "absender": absender, "stichwort": stichwort, "alle": bool(alle),
             "dringend": bool(dringend) and not alle, "dauerhaft": bool(dauerhaft or alle), "bis": _datum(bis), "notiz": (notiz or "").strip()[:120],
             "seit": datetime.now().isoformat(timespec="minutes"), "aktiv": True, "treffer": 0}
        with self.lock:
            z = self._z()
            z["wachen"].append(w)
            z["wachen"] = z["wachen"][-30:]
            self._s(z)
        self.letzter = 0                                  # gleich einmal prüfen (Startpunkt merken)
        self.c.broadcast({"type": "mailwache", "ereignis": "liste"})
        return {"ok": True, "wache": self._kurz(w), "hinweis": "Ich prüfe den Posteingang alle "
                f"{self._z()['intervall_s'] // 60} Minuten und melde mich sofort bei einem Treffer."}

    def beenden(self, wid: str = "", alle: bool = False) -> dict:
        with self.lock:
            z = self._z()
            n = 0
            for w in z["wachen"]:
                if w["aktiv"] and (alle or w["id"] == wid or (wid and wid.lower() in (w["absender"] + " " + w["stichwort"]).lower())):
                    w["aktiv"] = False
                    n += 1
            self._s(z)
        self.c.broadcast({"type": "mailwache", "ereignis": "liste"})
        return {"ok": True, "beendet": n}

    def intervall(self, sekunden: int) -> dict:
        with self.lock:
            z = self._z()
            z["intervall_s"] = max(60, min(1800, int(sekunden)))
            self._s(z)
        return {"ok": True, "intervall_s": z["intervall_s"], "text": "✓ Gespeichert"}

    @staticmethod
    def _kurz(w: dict) -> dict:
        return {"id": w["id"], "worauf": "jede neue Mail" if w["alle"] else " / ".join(x for x in (
                    f"von „{w['absender']}“" if w["absender"] else "", f"Betreff mit „{w['stichwort']}“" if w["stichwort"] else "") if x),
                "dauerhaft": w["dauerhaft"], "dringend": w.get("dringend", False), "bis": w["bis"], "seit": w["seit"], "treffer": w["treffer"], "aktiv": w["aktiv"]}

    def liste(self) -> dict:
        z = self._z()
        return {"wachen": [self._kurz(w) for w in z["wachen"] if w["aktiv"]], "intervall_s": z["intervall_s"],
                "letzte_treffer": [{k: t.get(k) for k in ("zeit", "von", "betreff", "uid")} for t in z["treffer"][-8:]]}

    def aktiv(self) -> list[dict]:
        heute = date.today().isoformat()
        return [w for w in self._z()["wachen"] if w["aktiv"] and (not w["bis"] or w["bis"] >= heute)]

    # ------------------------------------------------------------ Prüfen
    @staticmethod
    def _passt(w: dict, von: str, betreff: str) -> bool:
        if w["alle"]:
            return True
        ok = True
        if w["absender"]:
            ok &= w["absender"].lower() in von.lower()
        if w["stichwort"]:
            ok &= all(t in betreff.lower() for t in w["stichwort"].lower().split())
        return ok

    def werbung_ausnahme(self, von: str, betreff: str) -> bool:
        """Für den Werbefilter: eine erwartete Mail wird nie als Werbung aussortiert."""
        return any(not w["alle"] and self._passt(w, von, betreff) for w in self.aktiv())

    def pruefen(self) -> dict:
        from atlas.tools.mail import Mail
        wachen = self.aktiv()
        if not wachen:
            return {"ok": True, "treffer": 0}
        mail = Mail(self.c.secrets, self.c.cfg)
        m = mail._imap()
        treffer = []
        try:
            m.select("INBOX", readonly=True)
            z = self._z()
            letzte = int(z.get("letzte_uid") or 0)
            if not letzte:                                       # Startpunkt: nur Mails ab jetzt melden
                typ, d = m.uid("SEARCH", None, "ALL")
                uids = [int(u) for u in (d[0].split() if d and d[0] else [])]
                with self.lock:
                    z = self._z()
                    z["letzte_uid"] = max(uids) if uids else 0
                    self._s(z)
                return {"ok": True, "treffer": 0, "start": True}
            typ, d = m.uid("SEARCH", None, f"UID {letzte + 1}:*")
            uids = sorted(int(u) for u in (d[0].split() if d and d[0] else []) if int(u) > letzte)[:50]
            if uids:
                typ, data = m.uid("FETCH", ",".join(map(str, uids)), "(BODY.PEEK[HEADER.FIELDS (FROM SUBJECT DATE)])")
                for part in data:
                    if not isinstance(part, tuple):
                        continue
                    uid = int((re.search(rb"UID (\d+)", part[0]) or [0, b"0"])[1])
                    hdr = email.message_from_bytes(part[1])
                    von, betreff = _h(hdr["From"]), _h(hdr["Subject"])
                    for w in wachen:
                        if self._passt(w, von, betreff):
                            treffer.append({"uid": str(uid), "von": von, "betreff": betreff, "wache": w["id"],
                                            "dringend": w.get("dringend", False), "zeit": datetime.now().isoformat(timespec="minutes"), "alle": w["alle"]})
                            break
        finally:
            try:
                m.logout()
            except Exception:
                pass
        with self.lock:
            z = self._z()
            if uids:
                z["letzte_uid"] = max(uids + [int(z.get("letzte_uid") or 0)])
            for t in treffer:
                for w in z["wachen"]:
                    if w["id"] == t["wache"]:
                        w["treffer"] += 1
                        if not w["dauerhaft"]:
                            w["aktiv"] = False
                z["treffer"].append(t)
            self._s(z)
        for t in treffer:
            self._melden(t)
        return {"ok": True, "treffer": len(treffer)}

    def _melden(self, t: dict) -> None:
        name = re.sub(r"\s*<.*", "", t["von"]).strip('" ') or t["von"]
        self.c.audit.log("mailwache_treffer", von=name)
        auf = getattr(self.c, "aufmerksamkeit", None)
        if auf and not auf.melden("mailwache", f"Mail von {name}: „{t['betreff'][:100]}“", t.get("dringend", False),
                                  {"uid": t["uid"]}):
            return                                         # Ruhe/Fokus und nicht dringend: in den Stapel
        self.c.broadcast({"type": "mailwache", "ereignis": "treffer", "uid": t["uid"], "von": name, "betreff": t["betreff"],
                          "alle": t["alle"]})
        try:
            from atlas.proaktiv import macos_notify
            macos_notify(f"JARVIS · Mail von {name}", t["betreff"][:120])
        except Exception:
            pass
        try:
            if not t["alle"]:
                self.c.proaktiv.telegram.send(f"📬 Die erwartete Mail ist da – von {name}: „{t['betreff'][:120]}“")
        except Exception:
            pass

    def schleife(self, stop: threading.Event) -> None:
        while not stop.wait(20):
            try:
                if not getattr(self.c.proaktiv, "leader", False) or not self.c.secrets.get("icloud_app_pw"):
                    continue
                if not self.aktiv() or (getattr(self.c, "notfall", None) and self.c.notfall.aktiv()):
                    continue
                if time.time() - self.letzter >= int(self._z().get("intervall_s") or 120):
                    self.letzter = time.time()
                    self.pruefen()
            except Exception as e:
                self.c.audit.log("fehler", bereich="mailwache", text=f"{type(e).__name__}: {e}"[:200])
                self.letzter = time.time() + 600

    def start(self, stop: threading.Event) -> None:
        threading.Thread(target=self.schleife, args=(stop,), name="mailwache", daemon=True).start()


def tools(core) -> list[Tool]:
    mw = core.mailwache
    return [
        Tool("mail_wache_setzen",
             "Posteingang dauerhaft im Hintergrund überwachen und SOFORT melden, wenn eine passende Mail eintrifft – z. B. "
             "„Sag mir Bescheid, wenn die Mail von X kommt“, „Ich warte dringend auf die Antwort zum Antrag“. Absender "
             "(Name oder Adresse, Teil genügt) und/oder Stichwort im Betreff; alle=true meldet jede neue Mail. Endet nach dem "
             "ersten Treffer, außer dauerhaft=true; optional bis (Datum). dringend=true, wenn der Nutzer „dringend“/„wichtig“ "
             "sagt – nur dann kommt die Meldung auch in Ruhezeiten und im Fokus durch.", "mail.wache",
             lambda absender="", stichwort="", bis="", dauerhaft=False, alle=False, notiz="", dringend=False:
                 mw.setzen(absender, stichwort, bis, dauerhaft, alle, notiz, dringend),
             {"absender": S("Name oder Mailadresse (Teil genügt)"), "stichwort": S("Wort(e) im Betreff"),
              "bis": S("TT.MM.JJJJ, optional"), "dauerhaft": {"type": "boolean"}, "alle": {"type": "boolean"},
              "notiz": S("worum es geht, optional"), "dringend": {"type": "boolean"}}),
        Tool("mail_wache_liste", "Aktive Mail-Wachen und letzte Treffer.", "mail.wache", lambda: mw.liste()),
        Tool("mail_wache_beenden", "Mail-Wache beenden (id, Absender/Stichwort oder alle=true).", "mail.wache",
             lambda id="", alle=False: mw.beenden(id, alle), {"id": S("id oder Absender/Stichwort"), "alle": {"type": "boolean"}}),
    ]
