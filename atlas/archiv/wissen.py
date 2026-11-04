"""Wissen: Steckbriefe (Bedeutung je Dokument) und weitere Quellen (Mails, Termine, Gedächtnis, Gespräche)
in derselben Suche – damit JARVIS Zusammenhänge über alles hinweg findet.

Steckbriefe
  Das lokale Modell liest den Anfang jedes Dokuments und schreibt eine Kurzfassung: Art, worum es geht, Absender,
  Beteiligte, Datum, Beträge, Fristen, Aktenzeichen, Orte, Schlagworte, Vorgang. Nichts davon verlässt den Mac
  beim Erstellen. Verschlusssachen (VS-Kennzeichnung) bekommen keinen Steckbrief; bei Gesundheitsdokumenten nennt
  der Steckbrief keine Diagnosen und gibt nur die Art heraus.
  Der Mac mit der Index-Wache erstellt die Steckbriefe und legt sie im gemeinsamen Bereich ab; andere Macs
  (z. B. deiner Frau) übernehmen sie nur.

Weitere Quellen (nur lokal, je Benutzer)
  Mails der letzten Monate (Posteingang + Gesendet), Termine (ein Jahr zurück, ein halbes voraus), Gedächtnis,
  Vorgänge und Gesprächszusammenfassungen. iMessage bleibt bewusst außen vor."""
import email
import email.policy
import hashlib
import html as htmlmod
import json
import re
import threading
import time
from datetime import date, datetime, timedelta
from email.utils import parsedate_to_datetime
from pathlib import Path

import numpy as np

STECKBRIEF_SYSTEM = (
    "Du erstellst Steckbriefe zu Dokumenten aus Richards privatem Archiv. Antworte nur mit einem JSON-Objekt. "
    "Erfinde nichts; was nicht im Text steht, lässt du weg. Nenne nie Diagnosen, Befunde, Behandlungen oder "
    "Medikamente – bei Gesundheitsdokumenten nur die Art (z. B. Arztrechnung) und \"gesundheit\": true.")
FELDER = ("art (Bescheid, Rechnung, Vertrag, Schreiben, Antrag, Bescheinigung, Bestätigung, Kontoauszug, Abrechnung, "
          "Präsentation, Protokoll, Notiz, Formular …), thema (2 Sätze: worum es geht und was das Ergebnis/Anliegen "
          "ist), absender, empfaenger, beteiligte (Liste: Personen, Behörden, Firmen), datum (JJJJ-MM-TT), "
          "betraege (Liste wie \"123,45 €\"), fristen (Liste \"JJJJ-MM-TT: was\"), aktenzeichen (Liste), "
          "orte (Liste), schlagworte (6–10 Begriffe inkl. Oberbegriffe und Synonyme), vorgang (kurzer Name des "
          "Vorgangs, z. B. \"Umzug Leipzig 2021\"), gesundheit (true/false)")
LISTEN = ("beteiligte", "betraege", "fristen", "aktenzeichen", "orte", "schlagworte")


def steckbrief_pruefen(d: dict | None) -> dict | None:
    """Antwort des Modells säubern: nur bekannte Felder, Listen als Listen, Texte gekürzt."""
    if not isinstance(d, dict) or not (d.get("thema") or d.get("art")):
        return None
    out = {}
    for k in ("art", "thema", "absender", "empfaenger", "datum", "vorgang"):
        v = d.get(k)
        if isinstance(v, str) and v.strip() and v.strip().lower() not in ("null", "none", "-", "–", "unbekannt"):
            out[k] = v.strip()[:400 if k == "thema" else 120]
    for k in LISTEN:
        v = d.get(k)
        if isinstance(v, str):
            v = [x.strip() for x in re.split(r"[;,]\s*", v) if x.strip()]
        if isinstance(v, list):
            v = [str(x).strip()[:80] for x in v if str(x).strip()][:12]
            if v:
                out[k] = v
    out["gesundheit"] = bool(d.get("gesundheit"))
    if out["gesundheit"]:                       # zur Sicherheit: keine Inhalte aus Gesundheitsdokumenten weitergeben
        out.pop("thema", None)
    return out


def steckbrief_text(pfad: str, d: dict) -> str:
    """Text, der als Vektor und für die Stichwortsuche dient (inkl. Thema – bleibt lokal)."""
    teile = [f"Steckbrief: {d.get('art', 'Dokument')}", d.get("thema", ""),
             f"Absender: {d['absender']}" if d.get("absender") else "",
             f"Beteiligte: {', '.join(d['beteiligte'])}" if d.get("beteiligte") else "",
             f"Orte: {', '.join(d['orte'])}" if d.get("orte") else "",
             f"Aktenzeichen: {', '.join(d['aktenzeichen'])}" if d.get("aktenzeichen") else "",
             f"Schlagworte: {', '.join(d['schlagworte'])}" if d.get("schlagworte") else "",
             f"Vorgang: {d['vorgang']}" if d.get("vorgang") else "",
             f"Datei: {pfad.rsplit('/', 1)[-1]}"]
    return " · ".join(t for t in teile if t)


def _id(*teile) -> str:
    return hashlib.sha1("|".join(str(t) for t in teile).encode("utf-8")).hexdigest()


def _stand(text: str) -> float:
    """Stabiler „Änderungsstand“ aus dem Inhalt (hash() wechselt bei jedem Start)."""
    return float(int(hashlib.sha1(text.encode("utf-8")).hexdigest()[:8], 16))


def gespraech_eintraege(text: str) -> list[tuple[str, str]]:
    """Gesprächszusammenfassungen ('## 01.11.2026 11:38' + Punkte) → [(Überschrift, Inhalt)]."""
    out = []
    for teil in re.split(r"^## ", text, flags=re.M)[1:]:
        kopf, _, rest = teil.partition("\n")
        if rest.strip():
            out.append((kopf.strip(), rest.strip()))
    return out


class Wissen:
    def __init__(self, core):
        self.c = core
        self.cfg = core.cfg.get("wissen") or {}
        self.stand = {"steckbriefe_neu": 0, "steckbriefe_fehler": 0, "quellen": {}, "zuletzt": ""}

    @property
    def search(self):
        return self.c.archiv.search if self.c.archiv else None

    def _ordner_steckbriefe(self) -> Path:
        d = self.c.shared / "steckbriefe"
        d.mkdir(parents=True, exist_ok=True)
        return d

    # ------------------------------------------------------------ Steckbriefe
    def _beschaeftigt(self) -> bool:
        """Gerade ein Gespräch? Dann hat JARVIS Vorrang vor den Steckbriefen."""
        for ws in list(getattr(self.c, "ws_clients", []) or []):
            s = getattr(ws, "_atlas_session", None)
            if s and s.task and not s.task.done():
                return True
        return bool(self.c.archiv and self.c.archiv.pause.is_set())

    def steckbriefe_erlaubt(self) -> tuple[bool, str]:
        """Steckbriefe brauchen das große lokale Modell. Standard: nur nachts (22–7 Uhr) oder wenn der Rechner
        mindestens 10 Minuten unbenutzt ist – tagsüber bleibt der Arbeitsspeicher frei.
        config.yaml: wissen → steckbriefe_zeit: nachts_oder_leerlauf | immer, nacht_von, nacht_bis, leerlauf_min."""
        if str(self.cfg.get("steckbriefe_zeit", "nachts_oder_leerlauf")) == "immer":
            return True, "immer"
        von, bis = int(self.cfg.get("nacht_von", 22)), int(self.cfg.get("nacht_bis", 7))
        h = datetime.now().hour
        if (von <= h or h < bis) if von > bis else (von <= h < bis):
            return True, "nachts"
        from atlas import plattform
        ruhe = plattform.leerlauf_sekunden()
        if ruhe is not None and ruhe >= float(self.cfg.get("leerlauf_min", 10)) * 60:
            return True, "Leerlauf"
        return False, "tagsüber in Benutzung"

    def _bin_wache(self) -> bool:
        from atlas.lease import ME
        try:
            return self.c.archiv.shared_status().get("wache") == ME
        except Exception:
            return False

    def steckbriefe_uebernehmen(self) -> int:
        """Gemeinsam abgelegte Steckbriefe (vom Mac mit der Wache) in die eigene Suche übernehmen."""
        s, n = self.search, 0
        if not s:
            return 0
        vorhanden = {d: m for d, m in s.db.execute("SELECT doc, mtime FROM steckbriefe")}
        docs = {d: m for d, m in s.db.execute("SELECT id, mtime FROM docs WHERE quelle='archiv'")}
        neu = []
        for f in self._ordner_steckbriefe().glob("*/*.json"):
            did = f.stem
            if did not in docs or vorhanden.get(did) == docs[did]:
                continue
            try:
                e = json.loads(f.read_text(encoding="utf-8"))
            except (OSError, ValueError):
                continue
            if e.get("mtime") == docs[did]:
                neu.append(e)
        for i in range(0, len(neu), 32):
            teil = neu[i:i + 32]
            vecs = s.embedder.embed([e["text"] or "-" for e in teil])
            for e, v in zip(teil, vecs):
                s.steckbrief_speichern(e["doc"], e["mtime"], e["daten"], e["text"],
                                       v if e["text"] else np.zeros(0))
                n += 1
        return n

    def steckbriefe_erstellen(self, grenze: int = 10, stop=None) -> int:
        from atlas.hilfen import lokal_json, vs_kennzeichnung
        s = self.search
        lokal = self.c.providers.get("lokal")
        if not s or not lokal or not lokal.available():
            return 0
        n = 0
        for did, pfad, mtime in s.steckbrief_offen(grenze):
            if (stop and stop.is_set()) or self._beschaeftigt() or not self.steckbriefe_erlaubt()[0]:
                break                                     # z. B. du sitzt wieder am Mac → sofort aufhören
            text = s.inhalt(did)
            if vs_kennzeichnung(text):                    # Verschlusssache: kein Steckbrief, nie auswerten
                daten, st = {"vs": True}, ""
            else:
                daten = steckbrief_pruefen(lokal_json(
                    lokal, STECKBRIEF_SYSTEM,
                    f"Datei: {pfad}\n\nText (Anfang):\n{text}\n\nJSON-Felder: {FELDER}", 700))
                if not daten:
                    self.stand["steckbriefe_fehler"] += 1
                    daten, st = {"fehlgeschlagen": True}, ""     # nicht endlos wiederholen; bei Änderung neu
                else:
                    st = steckbrief_text(pfad, daten)
            vec = s.embedder.embed([st])[0] if st else np.zeros(0)
            s.steckbrief_speichern(did, mtime, daten, st, vec)
            try:                                          # für die anderen Macs ablegen (ohne Vektor)
                ziel = self._ordner_steckbriefe() / did[:2] / f"{did}.json"
                ziel.parent.mkdir(parents=True, exist_ok=True)
                ziel.write_text(json.dumps({"doc": did, "mtime": mtime, "daten": daten, "text": st},
                                           ensure_ascii=False), encoding="utf-8")
            except OSError:
                pass
            n += 1
            self.stand["steckbriefe_neu"] += 1
        return n

    # ------------------------------------------------------------ weitere Quellen
    def _mails(self) -> int:
        if not self.c.secrets.get("mail_bereit"):
            return 0
        from atlas.tools.mail import Mail, _h
        s = self.search
        monate = int(self.cfg.get("mail_monate", 12))
        seit = (date.today() - timedelta(days=30 * monate)).strftime("%d-%b-%Y")
        mk = Mail(self.c.secrets, self.c.cfg)
        m = mk._imap()
        n = 0
        try:
            for ordner in ("INBOX", mk.ordner(m, "Sent").strip('"')):
                try:
                    if m.select(f'"{ordner}"', readonly=True)[0] != "OK":
                        continue
                except Exception:
                    continue
                schluessel = f"mail_uid:{ordner}"
                letzte = int(s._info(schluessel) or 0)
                krit = ["UID", f"{letzte + 1}:*"] if letzte else ["SINCE", seit]
                typ, data = m.uid("SEARCH", None, *krit)
                uids = [int(u) for u in (data[0] or b"").split() if int(u) > letzte][:int(self.cfg.get("mails_je_lauf", 300))]
                eintraege = []
                for uid in uids:
                    typ, d = m.uid("FETCH", str(uid).encode(), "(BODY.PEEK[])")
                    raw = next((p[1] for p in d if isinstance(p, tuple)), None)
                    if not raw:
                        continue
                    msg = email.message_from_bytes(raw, policy=email.policy.default)
                    try:
                        zeit = parsedate_to_datetime(msg["Date"]).astimezone()
                    except Exception:
                        zeit = datetime.now().astimezone()
                    body = msg.get_body(preferencelist=("plain", "html"))
                    try:
                        text = body.get_content() if body else ""
                    except Exception:
                        text = ""
                    if body is not None and body.get_content_type() == "text/html":
                        text = htmlmod.unescape(re.sub(r"<[^>]+>", " ", re.sub(r"(?is)<(script|style).*?</\1>", "", text)))
                    text = re.sub(r"\s+", " ", text).strip()[:3000]
                    von, an, betreff = _h(msg["From"]), _h(msg["To"]), _h(msg["Subject"])
                    anh = [p.get_filename() for p in msg.iter_attachments() if p.get_filename()]
                    kopf = (f"Mail {'gesendet an ' + an if ordner != 'INBOX' else 'von ' + von} am {zeit:%d.%m.%Y}: "
                            f"{betreff}" + (f" · Anhänge: {', '.join(anh)}" if anh else ""))
                    eintraege.append({"id": _id("mail", ordner, msg.get("Message-ID") or uid),
                                      "pfad": f"mail://{zeit:%Y-%m-%d} · {von if ordner == 'INBOX' else 'an ' + an} · {betreff}"[:300],
                                      "mtime": zeit.timestamp(), "texte": [f"{kopf}\n{text}"]})
                    letzte = max(letzte, uid)
                n += s.quelle_setzen("mail", eintraege)
                s._set(schluessel, letzte)
                s.db.commit()
        finally:
            try:
                m.logout()
            except Exception:
                pass
        return n

    def _termine(self) -> int:
        t = self.c.tools.get("kalender_termine")
        if not t:
            return 0
        eintraege, termine = [], []
        start = date.today() - timedelta(days=365)
        while start < date.today() + timedelta(days=183):     # in Monatsstücken – ein großer Abruf hängt bei iCloud
            ende = start + timedelta(days=30)
            try:
                termine += t.func(von=start.isoformat(), bis=(ende - timedelta(days=1)).isoformat()) or []
            except Exception as e:
                self.c.audit.log("fehler", bereich="wissen_termine", text=f"{start}: {type(e).__name__}: {e}"[:200])
            start = ende
        for e in termine:
            text = (f"Termin {e['titel']} am {e['datum']}" + (f" um {e['zeit']}" if e.get("zeit") else "")
                    + (f" · Ort: {e['ort']}" if e.get("ort") else "") + f" · Kalender: {e.get('kalender', '')}")
            eintraege.append({"id": _id("termin", e.get("uid"), e["datum"]),
                              "pfad": f"termin://{e['datum']} · {e['titel']}"[:300],
                              "mtime": _stand(text), "texte": [text]})
        return self.search.quelle_setzen("termin", eintraege, vollstaendig=True)

    def _gedaechtnis(self) -> int:
        mem = self.c.memory
        s, n = self.search, 0
        for quelle, dateien in (("gedaechtnis", [(b, f) for b, d in mem.dirs.items() for f in d.glob("*.md")]),
                                ("vorgang", [("vorgang", f) for f in mem.vorgaenge.glob("*.md")])):
            eintraege = []
            for bereich, f in dateien:
                try:
                    text = f.read_text(encoding="utf-8")
                except OSError:
                    continue
                art = "Vorgang" if quelle == "vorgang" else f"Gedächtnis ({bereich})"
                eintraege.append({"id": _id(quelle, f), "pfad": f"{quelle}://{f.stem}",
                                  "mtime": f.stat().st_mtime, "texte": [f"{art}: {f.stem}\n{text[:3000]}"]})
            n += s.quelle_setzen(quelle, eintraege, vollstaendig=True)
        eintraege = []
        for f in sorted(mem.gespraeche.glob("*.md")):
            try:
                text = f.read_text(encoding="utf-8")
            except OSError:
                continue
            for kopf, inhalt in gespraech_eintraege(text):
                try:
                    tag = datetime.strptime(kopf[:10], "%d.%m.%Y").date().isoformat()
                except ValueError:
                    tag = ""
                eintraege.append({"id": _id("gespraech", f.name, kopf), "pfad": f"gespraech://{tag} {kopf[11:]}".strip(),
                                  "mtime": _stand(inhalt), "texte": [f"Gespräch mit JARVIS am {kopf}:\n{inhalt}"]})
        n += s.quelle_setzen("gespraech", eintraege, vollstaendig=True)
        return n

    def quellen_aktualisieren(self) -> dict:
        out = {}
        for name, f in (("gedaechtnis", self._gedaechtnis), ("termine", self._termine), ("mails", self._mails)):
            t0 = time.time()
            self.stand["laeuft"] = name
            try:
                out[name] = f()
            except Exception as e:
                out[name] = f"Fehler: {type(e).__name__}"
                self.c.audit.log("fehler", bereich=f"wissen_{name}", text=f"{type(e).__name__}: {e}"[:200])
            out[f"{name}_s"] = round(time.time() - t0)
        self.stand.pop("laeuft", None)
        self.stand["quellen"] = out
        self.stand["zuletzt"] = datetime.now().isoformat(timespec="minutes")
        self.c.audit.log("wissen", quellen=out)              # Protokoll: was ist dazugekommen, wie lange
        return out

    # ------------------------------------------------------------ Hintergrund
    # Zwei getrennte Schleifen: ein langsamer Mail-/Kalenderabruf darf die Steckbriefe nicht aufhalten.
    def schleife_quellen(self, stop: threading.Event) -> None:
        while not stop.wait(30):
            try:
                if self.search and self.cfg.get("aktiv", True):
                    self.quellen_aktualisieren()
                    self.steckbriefe_uebernehmen()
            except Exception as e:
                self.c.audit.log("fehler", bereich="wissen_quellen", text=f"{type(e).__name__}: {e}"[:300])
            stop.wait(int(self.cfg.get("quellen_min", 30)) * 60)

    def schleife_steckbriefe(self, stop: threading.Event) -> None:
        letzte_meldung = 0
        while not stop.wait(15):
            try:
                if (self.search and self.cfg.get("aktiv", True) and self.cfg.get("steckbriefe", True)
                        and self._bin_wache() and not self._beschaeftigt() and self.steckbriefe_erlaubt()[0]):
                    self.steckbriefe_erstellen(int(self.cfg.get("steckbriefe_je_runde", 10)), stop)
                    n = self.stand["steckbriefe_neu"]
                    if n // 100 > letzte_meldung:                  # alle 100 Steckbriefe ein Protokolleintrag
                        letzte_meldung = n // 100
                        self.c.audit.log("wissen", steckbriefe_neu=n, fehler=self.stand["steckbriefe_fehler"])
            except Exception as e:
                self.c.audit.log("fehler", bereich="wissen_steckbriefe", text=f"{type(e).__name__}: {e}"[:300])

    def start(self, stop: threading.Event) -> None:
        threading.Thread(target=self.schleife_quellen, args=(stop,), name="wissen-quellen", daemon=True).start()
        threading.Thread(target=self.schleife_steckbriefe, args=(stop,), name="wissen-steckbriefe", daemon=True).start()

    def status(self) -> dict:
        st = self.search.stats() if self.search else {}
        offen = len(self.search.steckbrief_offen(100000)) if self.search else 0
        erlaubt, grund = self.steckbriefe_erlaubt()
        return {**self.stand, "steckbriefe": st.get("steckbriefe", 0), "steckbriefe_offen": offen,
                "steckbriefe_jetzt": erlaubt, "steckbriefe_grund": grund,
                "quellen_im_index": st.get("quellen", {})}


# ------------------------------------------------------------------ Goldfragen: misst, ob die Suche besser wird
GOLD = "goldfragen.json"
GOLD_START = {"fragen": [
    {"frage": "Meldebestätigung, wo ich damals in Leipzig gewohnt habe", "erwartet": "Meldebestätigung UNGER Leipzig"},
    {"frage": "Meine Versetzung nach Leipzig zum Ausbildungskommando", "erwartet": "Versetzung AusbKdo LEIPZIG"},
    {"frage": "Steuerbescheid 2023", "erwartet": "Steuerbescheid 2023"},
    {"frage": "Wohnungsgeberbestätigung für die Wohnung in Leipzig", "erwartet": "Landsberger Strasse/2021_03_16 - Wohnungsgeberbestätigung"},
    {"frage": "Unterlagen zur Berufsunfähigkeitsversicherung", "erwartet": "Berufsunfähigkeit"},
    {"frage": "Anerkennung der Umzugskosten für den Umzug in die USA", "erwartet": "BAIUDBw Anerkennung Umzug"},
    {"frage": "Antrag auf Wohnsitznahme in den USA", "erwartet": "Antrag Wohnsitznahme"},
    {"frage": "Abmeldebescheinigung aus Zülpich", "erwartet": "Abmeldebescheinigung"},
]}


def suchtest(search, read_json, write_json) -> dict:
    """Jede Goldfrage suchen: an welcher Stelle steht das erwartete Dokument? (Treffer@1, @5, MRR)"""
    from atlas.archiv.search import norm
    g = read_json(GOLD, None)
    if not g:
        g = GOLD_START
        write_json(GOLD, g)
    zeilen, rr = [], []
    for f in g.get("fragen", []):
        t0 = time.time()
        res = search.search(f["frage"], k=10, begriffe=f.get("begriffe"), quellen=["archiv"])
        rang = next((i + 1 for i, r in enumerate(res) if norm(f["erwartet"]) in norm(r["pfad"])), None)
        rr.append(1 / rang if rang else 0)
        zeilen.append({"frage": f["frage"], "rang": rang, "ms": int((time.time() - t0) * 1000),
                       "erster": res[0]["pfad"].rsplit("/", 1)[-1] if res else ""})
    n = len(zeilen) or 1
    return {"fragen": zeilen, "treffer_1": sum(1 for z in zeilen if z["rang"] == 1),
            "treffer_5": sum(1 for z in zeilen if z["rang"] and z["rang"] <= 5), "anzahl": len(zeilen),
            "mrr": round(sum(rr) / n, 3)}
