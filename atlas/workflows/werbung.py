"""Werbung im iCloud-Posteingang erkennen und in den Papierkorb verschieben.

Vorsichtig: Werbung nur, wenn mehrere Merkmale zusammenkommen (Abmeldelink/Massenversand,
typischer Absender oder Betreff) UND das lokale Modell zustimmt. Nie gelöscht werden Mails von
Kontakten, Antworten und alles mit Rechnung, Bescheid, Termin, Bestellung, Konto, Behörde …
Die erste Woche ist ein Probelauf: JARVIS meldet nur, was er löschen würde.
Gelöschtes liegt 30 Tage im iCloud-Papierkorb und lässt sich zurückholen."""
import email
import json
import re
import threading
import time
from datetime import date, datetime, timedelta

from atlas.paths import read_private_json, write_private_json
from atlas.tools import S, Tool, ToolError, jxa
from atlas.tools.mail import Mail, _h

ZUSTAND = "werbung.json"
PAPIERKORB = "Deleted Messages"
NIE = re.compile(r"rechnung|bescheid|termin|bestellung|bestellbestätigung|versand|lieferung|zahlung|überweisung|"
                 r"konto|kündigung|vertrag|passwort|sicherheitscode|bestätigungscode|verifizierung|einladung|"
                 r"beihilfe|universa|versicherung|finanzamt|elster|steuer|bundeswehr|behörde|gericht|schule|kita|"
                 r"arzt|praxis|klinik|bank|sparkasse|paypal|mahnung|frist|antrag|vermiet|mieter|kaution", re.I)
AMT = re.compile(r"\.bund\.de|bundeswehr|\.gov|finanzamt|\.landkreis|\.stadt-|bva\.", re.I)
ABSENDER = re.compile(r"newsletter|marketing|news@|angebote|deals|promo|werbung|mailing|noreply|no-reply|"
                      r"info@|hello@|kontakt@|service@|team@|shop", re.I)
BETREFF = re.compile(r"\d+\s?%|rabatt|angebot|sale\b|gutschein|newsletter|deal|gratis|sparen|black friday|"
                     r"cyber|aktion|nur heute|exklusiv|jetzt kaufen|neu im shop|bestseller|countdown|"
                     r"letzte chance|vorteil|bonus|preis(?:e|knaller)?", re.I)

KONTAKT_MAILS = r"""
function run(){ const app=Application('Contacts'); const out=[];
  for (const p of app.people()){ try{ for (const m of p.emails.value()) out.push(m.toLowerCase()); }catch(e){} }
  return JSON.stringify(out); }"""


class Werbung:
    def __init__(self, core):
        self.c = core
        self.cfg = core.cfg.get("werbung") or {}
        self.aktiv = self.cfg.get("aktiv", True)
        self.lock = threading.Lock()
        self.kontakte: set = set()
        self.kontakte_zeit = 0.0
        self.letzter = 0.0

    def zustand(self) -> dict:
        z = read_private_json(ZUSTAND, {})
        if "probelauf_bis" not in z:
            z["probelauf_bis"] = (date.today() + timedelta(days=int(self.cfg.get("probelauf_tage", 7)))).isoformat()
        z.setdefault("letzte_uid", 0); z.setdefault("ausnahmen", []); z.setdefault("protokoll", [])
        return z

    def speichern(self, z):
        z["protokoll"] = z["protokoll"][-400:]
        write_private_json(ZUSTAND, z)

    def probelauf(self, z) -> bool:
        return date.today() <= date.fromisoformat(z["probelauf_bis"])

    def _kontakte(self) -> set:
        if time.time() - self.kontakte_zeit > 6 * 3600:
            try:
                self.kontakte = set(jxa.run("Kontakte", KONTAKT_MAILS, timeout=120) or [])
            except ToolError:
                pass
            self.kontakte_zeit = time.time()
        return self.kontakte

    # ---------- Bewertung ----------
    def punkte(self, hdr, z) -> tuple[int, str]:
        von, betreff = _h(hdr["From"]), _h(hdr["Subject"])
        adresse = (re.search(r"<([^>]+)>", von) or re.search(r"(\S+@\S+)", von) or [None, ""])[1].lower()
        domain = adresse.split("@")[-1]
        if adresse in self._kontakte():
            return -9, "Kontakt"
        try:                                          # Mails an das Immobilien-Postfach (HESTIA) nie als Werbung
            alias = self.c.nebenkosten.alias()
            if alias and alias in str(hdr["To"] or "").lower() + str(hdr["Delivered-To"] or "").lower():
                return -9, "Immobilien-Postfach"
        except Exception:
            pass
        if any(a.lower() in (adresse, domain) or a.lower() in von.lower() for a in z["ausnahmen"]):
            return -9, "Ausnahme"
        if re.match(r"^\s*(re|aw|wg|fwd?):", betreff, re.I):
            return -9, "Antwort/Weiterleitung"
        if NIE.search(betreff) or NIE.search(von) or AMT.search(adresse):
            return -9, "wichtiges Stichwort"
        p, gruende = 0, []
        if hdr["List-Unsubscribe"] or hdr["List-Id"]:
            p += 2; gruende.append("Abmeldelink")
        if (hdr["Precedence"] or "").lower() in ("bulk", "list", "junk") or hdr["X-Campaign"] or hdr["X-Mailgun-Tag"]:
            p += 1; gruende.append("Massenversand")
        if ABSENDER.search(adresse):
            p += 1; gruende.append("Absender")
        if BETREFF.search(betreff):
            p += 1; gruende.append("Betreff")
        return p, ", ".join(gruende)

    def modell_sagt_werbung(self, von: str, betreff: str) -> bool | None:
        lokal = self.c.providers.get("lokal")
        if not lokal or not lokal.available():
            return None
        try:
            model = lokal.resolve_model()
            out = "".join(e[1] for e in lokal.step(
                model, "Du beurteilst E-Mails. Antworte nur mit WERBUNG oder WICHTIG. WERBUNG = Newsletter, "
                       "Angebote, Rabatte, Marketing. WICHTIG = alles Persönliche, Geschäftliche, Rechnungen, "
                       "Behörden, Bestellungen, Sicherheit, Termine.",
                [{"role": "user", "content": f"Von: {von}\nBetreff: {betreff}"}], [], 5) if e[0] == "text")
            return "WERBUNG" in out.upper()
        except Exception:
            return None

    # ---------- Lauf ----------
    def lauf(self) -> dict:
        if not self.aktiv:
            return {"hinweis": "ausgeschaltet"}
        with self.lock:
            z = self.zustand()
            mail = Mail(self.c.secrets)
            m = mail._imap()
            erkannt = []
            try:
                typ, d0 = m.select("INBOX")
                if typ != "OK":
                    raise ToolError(f"Posteingang nicht verfügbar: {d0}")
                typ, data = m.uid("SEARCH", None, "ALL")
                if typ != "OK":
                    raise ToolError(f"Suche im Posteingang fehlgeschlagen: {typ} {data}")
                uids = [int(u) for u in ((data[0] or b"").split() if data else [])]
                if not z["letzte_uid"]:                     # erster Lauf: die letzten 2 Tage ansehen
                    t = date.today() - timedelta(days=2)
                    mon = "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split()[t.month - 1]
                    typ, d2 = m.uid("SEARCH", None, f"SINCE {t.day:02d}-{mon}-{t.year}")
                    neu = [int(u) for u in (d2[0] or b"").split()] if d2 else []
                else:
                    neu = [u for u in uids if u > z["letzte_uid"]]
                if uids:
                    z["letzte_uid"] = max(uids)
                for uid in neu[-60:]:                       # nie mehr als 60 auf einmal (schont den Server)
                    typ, d = m.uid("FETCH", str(uid), "(BODY.PEEK[HEADER])")
                    roh = next((x[1] for x in d if isinstance(x, tuple)), None)
                    if not roh:
                        continue
                    hdr = email.message_from_bytes(roh)
                    p, grund = self.punkte(hdr, z)
                    if p < 2:
                        continue
                    von, betreff = _h(hdr["From"]), _h(hdr["Subject"])
                    urteil = self.modell_sagt_werbung(von, betreff)
                    if urteil is False or (urteil is None and p < 3):
                        continue
                    eintrag = {"uid": uid, "message_id": (hdr["Message-ID"] or "").strip(), "von": von[:80],
                               "betreff": betreff[:120], "grund": grund, "zeit": datetime.now().isoformat(timespec="minutes"),
                               "probelauf": self.probelauf(z)}
                    if not eintrag["probelauf"]:
                        if self._verschieben(m, str(uid), PAPIERKORB):
                            eintrag["geloescht"] = True
                        else:
                            continue
                    erkannt.append(eintrag)
                if any(e.get("geloescht") for e in erkannt):
                    m.expunge()
            finally:
                try:
                    m.logout()
                except Exception:
                    pass
            z["protokoll"] += erkannt
            self.speichern(z)
            if erkannt:
                self.c.audit.log("werbung", anzahl=len(erkannt), probelauf=self.probelauf(z))
            return {"erkannt": len(erkannt), "probelauf": self.probelauf(z)}

    @staticmethod
    def _verschieben(m, uid: str, ziel: str) -> bool:
        for name in (f'"{ziel}"', ziel):                 # je nach Python-Version mit/ohne Anführungszeichen
            for befehl in ("MOVE", "COPY"):
                try:
                    typ, _ = m.uid(befehl, uid, name)
                except Exception:
                    continue
                if typ == "OK":
                    if befehl == "COPY":
                        m.uid("STORE", uid, "+FLAGS", "(\\Deleted)")
                    return True
        return False

    # ---------- Berichte und Korrekturen ----------
    def heute(self) -> list[dict]:
        seit = (datetime.now() - timedelta(hours=24)).isoformat()
        return [e for e in self.zustand()["protokoll"] if e["zeit"] >= seit[:16]]

    def briefing_zeile(self) -> str:
        z, liste = self.zustand(), self.heute()
        if not liste:
            return ""
        namen = ", ".join(sorted({re.sub(r"\s*<.*", "", e["von"]).strip('" ') for e in liste})[:6])
        if self.probelauf(z):
            return (f"Probelauf Werbefilter: {len(liste)} Mails hätte ich in den Papierkorb gelegt (z. B. von {namen}). "
                    f"Ab dem {date.fromisoformat(z['probelauf_bis']) + timedelta(days=1):%d.%m.} lösche ich automatisch.")
        return f"Werbefilter: {len(liste)} Werbemails in den Papierkorb verschoben (z. B. von {namen})."

    def status(self) -> dict:
        z = self.zustand()
        return {"probelauf_bis": z["probelauf_bis"], "ausnahmen": z["ausnahmen"],
                "letzte_24h": [{"von": e["von"], "betreff": e["betreff"], "geloescht": e.get("geloescht", False)}
                               for e in self.heute()][-30:]}

    def ausnahme(self, absender: str) -> dict:
        z = self.zustand()
        a = absender.strip().lower()
        if a and a not in z["ausnahmen"]:
            z["ausnahmen"].append(a)
        self.speichern(z)
        return {"ausnahme": a, "hinweis": "Mails dieses Absenders werden nie als Werbung behandelt."}

    def wiederherstellen(self, absender: str = "", nur_heute: bool = True) -> dict:
        z = self.zustand()
        kand = [e for e in (self.heute() if nur_heute else z["protokoll"])
                if e.get("geloescht") and (not absender or absender.lower() in e["von"].lower())]
        if not kand:
            return {"wiederhergestellt": 0}
        m = Mail(self.c.secrets)._imap()
        n = 0
        try:
            m.select(f'"{PAPIERKORB}"')
            for e in kand:
                if not e.get("message_id"):
                    continue
                typ, d = m.uid("SEARCH", None, "HEADER", "Message-ID", e["message_id"])
                for uid in (d[0].split() if d and d[0] else []):
                    if self._verschieben(m, uid.decode(), "INBOX"):
                        n += 1
            m.expunge()
        finally:
            m.logout()
        if absender:
            self.ausnahme(absender)
        return {"wiederhergestellt": n}

    def schleife(self, stop: threading.Event) -> None:
        while not stop.wait(60):
            try:
                if not self.aktiv or not getattr(self.c.proaktiv, "leader", False) \
                        or not self.c.secrets.get("icloud_app_pw"):
                    continue
                if time.time() - self.letzter > int(self.cfg.get("intervall_min", 15)) * 60:
                    self.letzter = time.time()
                    self.lauf()
            except Exception as e:
                self.c.audit.log("fehler", bereich="werbung", text=str(e)[:200])
                self.letzter = time.time() + 3600              # bei Störung eine Stunde Pause

    def start(self, stop: threading.Event) -> None:
        if self.aktiv:
            threading.Thread(target=self.schleife, args=(stop,), name="werbung", daemon=True).start()


def tools(core) -> list[Tool]:
    w = core.werbung
    return [
        Tool("werbefilter_status", "Was der Werbefilter in den letzten 24 Stunden erkannt/gelöscht hat, Probelauf-Ende, Ausnahmen.",
             "mail.lesen", w.status),
        Tool("werbefilter_ausnahme", "Absender (Adresse, Domain oder Name) nie als Werbung behandeln.",
             "mail.entwurf", w.ausnahme, {"absender": S("Adresse, Domain oder Name")}, ["absender"]),
        Tool("werbefilter_wiederherstellen",
             "Vom Werbefilter gelöschte Mails aus dem Papierkorb zurück in den Posteingang holen (optional nur ein Absender).",
             "mail.entwurf", w.wiederherstellen, {"absender": S("Absender, optional"),
                                                  "nur_heute": {"type": "boolean", "description": "nur letzte 24 h (Standard)"}}),
    ]
