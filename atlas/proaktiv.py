"""Proaktiv: Morgenbriefing und Hinweise – nur auf dem Gerät mit der Wache.

Wache je Nutzer (privat, in iCloud): Der zuerst aktive Mac übernimmt Briefing,
Hinweise und Telegram; läuft er nicht mehr, übernimmt nach ~3 Min. der andere."""
import json
import subprocess
import threading
import time
from datetime import date, datetime, timedelta

from atlas import agent
from atlas.lease import Lease
from atlas.paths import HOST, LOCAL_DIR, private_dir, read_private_json, write_private_json
from atlas.telegram import BRIEFING_PROMPT, TelegramBot
from atlas.tools.mail import Mail
from atlas.tools.zeit import TZ


def macos_notify(title: str, text: str) -> None:
    esc = lambda s: s.replace("\\", "\\\\").replace('"', '\\"')[:220]
    try:
        subprocess.run(["osascript", "-e", f'display notification "{esc(text)}" with title "{esc(title)}"'],
                       capture_output=True, timeout=10)
    except (OSError, subprocess.SubprocessError):
        pass


class Proaktiv:
    def __init__(self, core):
        self.c = core
        self.cfg_b = core.cfg["briefing"]
        self.cfg_h = core.cfg["hinweise"]
        self.lease = Lease(private_dir() / "system" / "wache_nutzer.json",
                           bevorzugt=str((core.cfg.get("wache") or {}).get("bevorzugt", "Mac-mini")))
        self.leader = False
        self.stop = threading.Event()
        self.telegram = TelegramBot(core)
        self.started = time.time()
        self.last_hints = 0.0
        self.state_file = LOCAL_DIR / "hinweise_status.json"

    # ---------- Wache ----------
    def _renew(self):
        try:
            self.leader = self.lease.acquire()
        except OSError:
            pass                      # iCloud gerade gesperrt – Stand beibehalten
        return self.leader

    # ---------- Briefing ----------
    @staticmethod
    def briefing_name(d: date | None = None) -> str:
        return f"briefing_{(d or date.today()).isoformat()}.json"

    def briefing_today(self) -> dict:
        return read_private_json(self.briefing_name(), {})

    def make_briefing(self, force: bool = False) -> dict:
        if getattr(self.c, "notfall", None) and self.c.notfall.aktiv():
            return {}
        if not force and self.briefing_today().get("text"):
            return self.briefing_today()
        stab = getattr(self.c, "stab", None)
        if stab:
            stab.letzter_vortrag = None
        text = agent.run(self.c, BRIEFING_PROMPT, nur_lesen=True, quelle="briefing", marken=True,
                         hinweis="Dies ist das Morgenbriefing; es wird vorgelesen und per Telegram "
                                 "verschickt. Keine Rückfragen, keine Markdown-Formatierung. "
                                 + (self.c.stab.briefing_hinweis() if hasattr(self.c, "stab") else ""))
        vortrag = stab.letzter_vortrag if stab else None
        try:                                     # Zahlungen aus dem Rechnungs-Workflow (lokal ermittelt)
            zahlungen = self.c.beihilfe.briefing_zeilen()
        except Exception:
            zahlungen = []
        if vortrag:                              # hat der Stab schon gemeldet (Quaestor), nicht doppelt anhängen
            zahlungen = []
        if zahlungen:
            text = (text or "").rstrip() + "\n\nZahlungen: " + " ".join(zahlungen)
        weitere = []
        for quelle in ((lambda: []) if vortrag else (lambda: self.c.fristen.briefing_zeilen()), lambda: [self.c.post.briefing_zeile()],
                       lambda: [self.c.steuer.briefing_hinweis()], lambda: [self.c.vertraege.monatsbericht()]):
            try:
                weitere += [z for z in quelle() if z]
            except Exception:
                pass
        if weitere:
            text = (text or "").rstrip() + "\n\nFristen & Post: " + " ".join(weitere)
        try:
            hestia = self.c.nebenkosten.briefing_zeile()
        except Exception:
            hestia = ""
        if hestia:
            text = (text or "").rstrip() + "\n\n" + hestia
        try:
            proj = self.c.projekte.briefing_zeile()
        except Exception:
            proj = ""
        if proj:
            text = (text or "").rstrip() + "\n\n" + proj
        try:
            nacht = self.c.aufmerksamkeit.briefing_zeile()
        except Exception:
            nacht = ""
        if nacht:
            text = (text or "").rstrip() + "\n\n" + nacht
        try:
            werbung = self.c.werbung.briefing_zeile()
        except Exception:
            werbung = ""
        if werbung:
            text = (text or "").rstrip() + "\n\n" + werbung
        from atlas.stab import ohne_marken
        data = {"text": ohne_marken(text), "text_marken": text, "vortrag": vortrag,
                "zeit": datetime.now().isoformat(timespec="minutes"), "geraet": HOST}
        text = data["text"]
        write_private_json(self.briefing_name(), data)
        self.c.audit.log("briefing", laenge=len(text))
        self.telegram.send(f"☀️ Morgenbriefing\n\n{text}")
        self.c.broadcast({"type": "briefing", "text": text, "text_marken": data["text_marken"], "vortrag": vortrag})
        macos_notify("JARVIS · Morgenbriefing", text[:200])
        return data

    def briefing_due(self) -> bool:
        if not self.cfg_b.get("aktiv", True) or self.briefing_today().get("text"):
            return False
        z = self.cfg_b.get("zeit", "06:30")
        if isinstance(z, int):                 # YAML liest 05:00 ohne Anführungszeichen als Minuten
            hh, mm = divmod(z, 60)
        else:
            hh, mm = map(int, str(z).split(":")[:2])
        return datetime.now().time() >= datetime.now().replace(hour=hh, minute=mm).time() \
            and time.time() - self.started > 60       # Netzwerk nach dem Start abwarten

    # ---------- Hinweise ----------
    def _state(self) -> dict:
        try:
            st = json.loads(self.state_file.read_text())
        except (OSError, ValueError):
            st = {}
        if st.get("tag") != date.today().isoformat():
            st = {"tag": date.today().isoformat(), "gemeldet": [], "mail_uid": st.get("mail_uid", 0),
                  "mail_init": st.get("mail_init")}
        return st

    def _save_state(self, st):
        try:
            self.state_file.write_text(json.dumps(st))
        except OSError:
            pass

    def hint(self, text: str, dringend: bool = False, art: str = "hinweis") -> None:
        nf = getattr(self.c, "notfall", None)
        if nf and art != "notfall" and nf.aktiv():           # in der Notfallbegleitung keine Hinweise für Richard
            self.c.audit.log("hinweis", text=text[:200], zustellung="pausiert (Notfall)")
            return
        auf = getattr(self.c, "aufmerksamkeit", None)
        if auf and not auf.melden(art, text, dringend):      # Ruhe/Fokus: zurücklegen statt stören
            self.c.audit.log("hinweis", text=text[:200], zustellung="stapel")
            return
        self.c.audit.log("hinweis", text=text[:200])
        self.telegram.send(f"🔔 {text}")
        self.c.broadcast({"type": "hinweis", "text": text})
        macos_notify("JARVIS", text)

    def check_hints(self) -> None:
        if not self.cfg_h.get("aktiv", True):
            return
        st, neu = self._state(), []
        # 1) Vorgangsfristen
        for v in self.c.memory.vorgaenge_liste():
            try:
                tage = (datetime.strptime(v["frist"], "%d.%m.%Y").date() - date.today()).days
            except ValueError:
                continue
            key = f"frist:{v['titel']}"
            if tage <= self.cfg_h["fristen_tage"] and key not in st["gemeldet"]:
                wann = "heute" if tage == 0 else "morgen" if tage == 1 else \
                    f"seit {-tage} Tagen überschritten" if tage < 0 else f"in {tage} Tagen"
                neu.append((key, f"Frist „{v['titel']}“ {wann} (nächster Schritt: {v['naechster_schritt']})"))
        # 2) bald fällige Erinnerungen
        t = self.c.tools.get("erinnerungen_offen")
        if t:
            try:
                horizon = datetime.now(TZ) + timedelta(minutes=self.cfg_h["erinnerung_minuten"])
                for r in t.func() or []:
                    if not r.get("faellig"):
                        continue
                    d = datetime.fromisoformat(r["faellig"].replace("Z", "+00:00")).astimezone(TZ)
                    key = f"erinn:{r['id']}"
                    if d.date() == date.today() and d <= horizon and key not in st["gemeldet"]:
                        neu.append((key, f"Erinnerung um {d:%H:%M}: {r['titel']}"))
            except Exception:
                pass
        # 3) wichtige neue Mails – Einschätzung lokal, Inhalte verlassen den Mac nicht
        if self.cfg_h.get("mail", True) and self.c.secrets.get("icloud_app_pw"):
            try:
                neu += self._mail_hints(st)
            except Exception:
                pass
        for key, text in neu:
            st["gemeldet"].append(key)
            self.hint(text)
        self._save_state(st)

    def _mail_hints(self, st) -> list:
        info = Mail(self.c.secrets).kurzinfo(10)
        mails = [m for m in info.get("neueste", []) if int(m["uid"]) > st.get("mail_uid", 0)]
        if not mails:
            return []
        st["mail_uid"] = max(int(m["uid"]) for m in mails)
        if st.get("mail_init") is None:              # erster Lauf: nur merken, nicht melden
            st["mail_init"] = True
            return []
        lokal = self.c.providers["lokal"]
        if not lokal.available():
            return []
        liste = "\n".join(f"{i+1}. Von: {m['von']} | Betreff: {m['betreff']}" for i, m in enumerate(mails))
        model = lokal.resolve_model()
        out = "".join(e[1] for e in lokal.step(
            model, "Du sortierst private E-Mails. Wichtig sind: Behörden, Finanzamt, Banken, "
                   "Versicherungen, Arbeitgeber, Ärzte, Schule/Kita, Vermietung, Rechnungen mit Frist, "
                   "persönliche Nachrichten von Menschen. Unwichtig: Werbung, Newsletter, "
                   "Benachrichtigungen. Antworte NUR mit den Nummern der wichtigen Mails, "
                   "kommagetrennt, oder 'keine'.",
            [{"role": "user", "content": liste}], [], 50) if e[0] == "text")
        nums = {int(n) for n in __import__("re").findall(r"\d+", out)}
        return [(f"mail:{mails[n-1]['uid']}",
                 f"Wichtige Mail von {mails[n-1]['von'].split('<')[0].strip()}: {mails[n-1]['betreff']}")
                for n in sorted(nums) if 1 <= n <= len(mails)]

    # ---------- Schleife ----------
    def loop(self):
        while not self.stop.wait(60):
            try:
                if not self._renew():
                    continue
                if self.briefing_due():
                    self.make_briefing()
                if self.c.wochenplan.faellig():
                    self.c.wochenplan.senden()
                if self.c.vergessen.faellig():
                    self.c.vergessen.senden()
                if time.time() - self.last_hints > self.cfg_h["intervall_min"] * 60:
                    self.last_hints = time.time()
                    self.check_hints()
            except Exception as e:
                self.c.audit.log("proaktiv_fehler", text=str(e)[:200])

    def start(self):
        threading.Thread(target=self.loop, name="proaktiv", daemon=True).start()
        threading.Thread(target=self.telegram.loop, args=(lambda: self.leader, self.stop),
                         name="telegram", daemon=True).start()
