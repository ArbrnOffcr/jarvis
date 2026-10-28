"""Notfallbegleitung – falls Richard stirbt, begleitet JARVIS seine Frau.

Leitlinie ist Richards Word-Dokument „Notfallordner“ im DATENARCHIV. JARVIS ist die administrative Unterstützung:
Kapitel und Schritte als Checkliste, Fortschritt, Notizen, Fristen, Entwürfe – jede Aktion nur mit ihrer Bestätigung.

Sicherheit:
- Aktivieren nur mit dem persönlichen Notfallcode seiner Frau (sie legt ihn selbst fest; gespeichert wird nur ein
  PBKDF2-Hash). Kein Werkzeug des Sprachmodells kann aktivieren – nur das Eingabefeld im Dashboard. Mails,
  Nachrichten oder Dokumente können den Modus also nie auslösen. 5 Fehlversuche → 1 Stunde gesperrt; Richard
  bekommt ab dem 3. Fehlversuch und bei jeder Aktivierung eine Telegram-Nachricht.
- Sofort aktiv (keine Wartezeit). Beenden im Dashboard (Banner) – z. B. bei einem Irrtum.
- Der Notfallordner wird nur lokal gelesen: Er ist aus dem Archivindex und aus datei_lesen ausgenommen; in der
  Begleitung antwortet das lokale Modell. Ist es nicht erreichbar, gehen nur maskierte Auszüge an Claude.
- Während der Begleitung: alle Befugnisse ruhen, Richards Briefing, Hinweise, Mail-Wachen und Sportblöcke pausieren.
"""
import hashlib
import hmac
import os
import re
import secrets
import threading
import time
from datetime import date, datetime, timedelta
from pathlib import Path

from atlas.paths import shared_dir
from atlas.tools import S, Tool, ToolError

MUSTER = re.compile(r"notfall[\s_-]*(ordner|mappe|akte)", re.I)
ITER = 240_000
MAX_FEHL = 5
SPERRE_S = 3600


def ist_notfallordner(pfad: str) -> bool:
    return bool(MUSTER.search(Path(pfad or "").name))


def _hash(code: str, salt: str) -> str:
    return hashlib.pbkdf2_hmac("sha256", code.encode(), bytes.fromhex(salt), ITER).hex()


def leitfaden_aus_docx(pfad: Path) -> list[dict]:
    """Word-Dokument lokal in Kapitel und Schritte zerlegen (Überschriften = Kapitel, Absätze/Listen/Tabellen = Schritte)."""
    import docx
    d = docx.Document(str(pfad))
    kapitel: list[dict] = []
    aktuell = None

    def neu(titel: str, ebene: int = 1):
        nonlocal aktuell
        aktuell = {"id": "k" + hashlib.sha1(f"{len(kapitel)}{titel}".encode()).hexdigest()[:6], "titel": titel.strip(),
                   "ebene": ebene, "schritte": []}
        kapitel.append(aktuell)

    def schritt(text: str, art: str = "text"):
        text = re.sub(r"\s+", " ", text or "").strip()
        if not text:
            return
        if aktuell is None:
            neu("Vorwort")
        sid = "s" + hashlib.sha1(f"{aktuell['id']}{len(aktuell['schritte'])}{text[:60]}".encode()).hexdigest()[:8]
        aktuell["schritte"].append({"id": sid, "text": text, "art": art})

    body = d.element.body
    from docx.table import Table
    from docx.text.paragraph import Paragraph
    for kind in body.iterchildren():
        tag = kind.tag.rsplit("}", 1)[-1]
        if tag == "p":
            p = Paragraph(kind, d)
            stil = (p.style.name if p.style is not None else "") or ""
            m = re.match(r"(?:Heading|Überschrift|Title|Titel)\s*(\d*)", stil, re.I)
            if m and p.text.strip():
                neu(p.text, int(m.group(1) or 1))
            elif re.search(r"list|liste|aufzählung", stil, re.I) or p._p.pPr is not None and p._p.pPr.numPr is not None:
                schritt(p.text, "aufgabe")
            else:
                schritt(p.text)
        elif tag == "tbl":
            t = Table(kind, d)
            for row in t.rows:
                zellen = []
                for c in row.cells:
                    if c.text.strip() and (not zellen or zellen[-1] != c.text.strip()):
                        zellen.append(c.text.strip())
                schritt(" | ".join(zellen), "tabelle")
    return [k for k in kapitel if k["schritte"] or k["ebene"] == 1]


STANDARD_FRISTEN = [
    # (Tage nach Sterbedatum, Titel, Hinweis) – nur Vorschläge; bitte mit dem Notfallordner abgleichen
    (2, "Unfall- und Lebensversicherungen den Todesfall melden",
     "Viele Unfallversicherungen verlangen die Meldung binnen 48 Stunden – genaue Frist steht in der Police."),
    (7, "Dienststelle / Bundeswehr: Hinterbliebenenversorgung und Sterbegeld klären",
     "Ansprechpartner und Unterlagen stehen ggf. im Notfallordner."),
    (42, "Erbschaft annehmen oder ausschlagen – Frist endet",
     "Ausschlagung binnen 6 Wochen ab Kenntnis (§ 1944 BGB) beim Nachlassgericht. Im Zweifel anwaltlich beraten lassen."),
]


class Notfall:
    def __init__(self, core):
        self.c = core
        self.lock = threading.Lock()
        self.datei = shared_dir(core.cfg) / "system" / "notfall.json"
        self._leitfaden = (0.0, "", [])

    # ------------------------------------------------------------ Zustand (gemeinsam für beide Macs)
    def _z(self) -> dict:
        import json
        try:
            return json.loads(self.datei.read_text(encoding="utf-8"))
        except (OSError, ValueError):
            return {}

    def _s(self, z: dict) -> None:
        import json
        self.datei.parent.mkdir(parents=True, exist_ok=True)
        tmp = self.datei.with_suffix(".tmp")
        tmp.write_text(json.dumps(z, ensure_ascii=False, indent=1), encoding="utf-8")
        os.replace(tmp, self.datei)

    def aktiv(self) -> bool:
        """Ernstfall ODER laufende Probe (verhält sich gleich, schreibt aber nichts dauerhaft)."""
        z = self._z()
        if z.get("aktiv"):
            return True
        pr = z.get("probe")
        if pr:
            if pr.get("bis", "") > datetime.now().isoformat(timespec="minutes"):
                return True
            threading.Thread(target=self.probe_beenden, kwargs={"auto": True}, daemon=True).start()
        return False

    def ist_probe(self) -> bool:
        z = self._z()
        return not z.get("aktiv") and bool(z.get("probe"))

    def _f(self, z: dict) -> dict:
        """Fortschritt: im Ernstfall dauerhaft, in der Probe getrennt (wird beim Ende verworfen)."""
        if not z.get("aktiv") and z.get("probe"):
            return z["probe"].setdefault("fortschritt", {})
        return z.setdefault("fortschritt", {})

    def name(self) -> str:
        return self._z().get("name") or ((self.c.cfg.get("notfall") or {}).get("name")) or "Dominique"

    # ------------------------------------------------------------ Dokument finden
    def dokument(self) -> Path | None:
        z = self._z()
        a = self.c.archiv.archive if getattr(self.c, "archiv", None) else None
        if not a:
            return None
        if z.get("pfad") and (a / z["pfad"]).exists():
            return a / z["pfad"]
        treffer = []
        for dirpath, dirnames, filenames in os.walk(a):
            dirnames[:] = [d for d in dirnames if not d.startswith(".")]
            for fn in filenames:
                if fn.lower().endswith(".docx") and ist_notfallordner(fn) and not fn.startswith("~$"):
                    treffer.append(Path(dirpath) / fn)
        if not treffer:
            return None
        treffer.sort(key=lambda p: -p.stat().st_mtime)
        with self.lock:
            z = self._z()
            z["pfad"] = str(treffer[0].relative_to(a))
            self._s(z)
        return treffer[0]

    def leitfaden(self) -> list[dict]:
        p = self.dokument()
        if not p:
            raise ToolError("Den Notfallordner (Word-Dokument „Notfallordner“) finde ich im DATENARCHIV nicht.")
        mt = p.stat().st_mtime
        if self._leitfaden[0] == mt and self._leitfaden[1] == str(p):
            return self._leitfaden[2]
        lf = leitfaden_aus_docx(p)
        self._leitfaden = (mt, str(p), lf)
        return lf

    def pruefen(self) -> dict:
        """Für Richard: Erkennt JARVIS die Struktur? (nur Titel und Anzahl – lokal, ohne Sprachmodell)"""
        p = self.dokument()
        if not p:
            return {"gefunden": False}
        lf = self.leitfaden()
        return {"gefunden": True, "datei": self._z().get("pfad"), "stand": datetime.fromtimestamp(p.stat().st_mtime).strftime("%d.%m.%Y"),
                "kapitel": [{"titel": k["titel"], "ebene": k["ebene"], "schritte": len(k["schritte"])} for k in lf],
                "eingerichtet": bool(self._z().get("hash"))}

    # ------------------------------------------------------------ Code
    def einrichten(self, code: str, name: str = "") -> dict:
        code = (code or "").strip()
        if len(code) < 6:
            raise ToolError("Der Notfallcode braucht mindestens 6 Zeichen.")
        salt = secrets.token_hex(16)
        with self.lock:
            z = self._z()
            if z.get("aktiv"):
                raise ToolError("Während der Begleitung kann der Code nicht geändert werden.")
            z.update({"salt": salt, "hash": _hash(code, salt), "eingerichtet": datetime.now().isoformat(timespec="minutes"),
                      "fehlversuche": 0, "gesperrt_bis": 0})
            if name.strip():
                z["name"] = name.strip()[:40]
            self._s(z)
        self.c.audit.log("notfall", ereignis="code_eingerichtet")
        return {"ok": True, "text": "Notfallcode gespeichert. Nur wer ihn kennt, kann die Begleitung starten."}

    def _code_ok(self, code: str) -> bool:
        with self.lock:
            z = self._z()
            if not z.get("hash"):
                raise ToolError("Es ist noch kein Notfallcode eingerichtet.")
            if time.time() < float(z.get("gesperrt_bis") or 0):
                raise ToolError("Zu viele Fehlversuche – bitte in einer Stunde erneut versuchen.")
            ok = hmac.compare_digest(_hash((code or "").strip(), z["salt"]), z["hash"])
            if ok:
                z["fehlversuche"] = 0
            else:
                z["fehlversuche"] = int(z.get("fehlversuche") or 0) + 1
                if z["fehlversuche"] >= MAX_FEHL:
                    z["gesperrt_bis"], z["fehlversuche"] = time.time() + SPERRE_S, 0
            self._s(z)
            n = z.get("fehlversuche", 0)
        if not ok:
            self.c.audit.log("notfall", ereignis="fehlversuch", anzahl=n)
            if n >= 3 or n == 0:
                self._an_richard(f"⚠ JARVIS: {('Fehlversuche' if n else '5 Fehlversuche – 1 h gesperrt')} beim Notfallcode "
                                 f"({n or MAX_FEHL}). Warst du das nicht, prüfe bitte, wer an deinem JARVIS sitzt.")
        return ok

    def _an_richard(self, text: str) -> None:
        try:
            self.c.proaktiv.telegram.send(text)
        except Exception:
            pass

    # ------------------------------------------------------------ Aktivieren / Beenden
    def aktivieren(self, code: str, geraet: str = "") -> dict:
        if not self._code_ok(code):
            raise ToolError("Der Code stimmt nicht.")
        befugnisse = []
        b = getattr(self.c, "befugnisse", None)
        if b:
            befugnisse = [r["id"] for r in b.liste()["befugnisse"] if r["aktiv"]]
            b.entziehen(alle=True)
        with self.lock:
            z = self._z()
            z.update({"aktiv": True, "seit": datetime.now().isoformat(timespec="minutes"), "geraet": geraet,
                      "befugnisse_vorher": befugnisse})
            z.setdefault("fortschritt", {})
            self._s(z)
        self.c.audit.log("notfall", ereignis="aktiviert", geraet=geraet)
        self._an_richard("🕯 JARVIS: Die Notfallbegleitung wurde aktiviert. War das ein Irrtum, beende sie bitte im "
                         "Dashboard (Banner oben).")
        self.c.broadcast({"type": "notfall", "aktiv": True})
        return {"aktiv": True, "name": self.name()}

    def beenden(self) -> dict:
        with self.lock:
            z = self._z()
            vorher = z.pop("befugnisse_vorher", [])
            z["aktiv"] = False
            z["beendet"] = datetime.now().isoformat(timespec="minutes")
            self._s(z)
        b = getattr(self.c, "befugnisse", None)
        for rid in vorher if b else []:
            try:
                b.wieder_aktivieren(rid)
            except Exception:
                pass
        self.c.audit.log("notfall", ereignis="beendet")
        self.c.broadcast({"type": "notfall", "aktiv": False})
        return {"aktiv": False}

    # ------------------------------------------------------------ Probe
    def selbsttest(self) -> list[dict]:
        """Was im Ernstfall gebraucht wird – jeder Punkt mit ok/warn und Hinweis."""
        t = []
        z = self._z()
        t.append({"ok": bool(z.get("hash")), "punkt": "Notfallcode eingerichtet",
                  "hinweis": "" if z.get("hash") else "Code unter ⚙ Einstellungen → Notfall einrichten lassen."})
        p = None
        try:
            p = self.dokument()
        except Exception:
            p = None
        t.append({"ok": bool(p), "punkt": "Notfallordner gefunden",
                  "hinweis": f"{z.get('pfad', '')} · Stand {datetime.fromtimestamp(p.stat().st_mtime):%d.%m.%Y}" if p
                  else "Kein Word-Dokument mit „Notfallordner“ im Namen im DATENARCHIV."})
        if p:
            try:
                lf = self.leitfaden()
                aufg = sum(1 for k in lf for s in k["schritte"] if s["art"] != "text")
                t.append({"ok": len(lf) >= 2 and aufg >= 3, "punkt": f"{len(lf)} Kapitel, {aufg} Aufgaben erkannt",
                          "hinweis": "" if aufg >= 3 else "Aufgaben als Aufzählung/Liste und Kapitel als Word-Überschrift formatieren."})
            except Exception as e:
                t.append({"ok": False, "punkt": "Notfallordner lesbar", "hinweis": str(e)[:160]})
            alter = (time.time() - p.stat().st_mtime) / 86400
            t.append({"ok": alter < 365, "punkt": "Notfallordner aktuell",
                      "hinweis": f"zuletzt vor {int(alter)} Tagen geändert" + (" – bitte einmal durchsehen" if alter >= 365 else "")})
        lokal = (getattr(self.c, "providers", {}) or {}).get("lokal")
        try:
            lok_ok = bool(lokal and lokal.available())
        except Exception:
            lok_ok = False
        t.append({"ok": lok_ok, "punkt": "Lokales Sprachmodell bereit",
                  "hinweis": "" if lok_ok else "Ohne lokales Modell gehen nur maskierte Auszüge an Claude (mit Rückfrage)."})
        tg = getattr(getattr(self.c, "proaktiv", None), "telegram", None)
        tg_ok = bool(tg and getattr(tg, "ready", False))
        t.append({"ok": tg_ok, "punkt": "Telegram-Benachrichtigung an Richard",
                  "hinweis": "" if tg_ok else "Ohne Telegram erfährt Richard nichts von einer Aktivierung."})
        t.append({"ok": hasattr(self.c, "fristen"), "punkt": "Fristenradar verfügbar", "hinweis": ""})
        t.append({"ok": self.datei.parent.exists(), "punkt": "Gemeinsamer Ordner (beide Macs) erreichbar",
                  "hinweis": str(self.datei.parent)})
        return t

    def probe_starten(self, code: str = "", minuten: int = 120) -> dict:
        z = self._z()
        if z.get("aktiv"):
            raise ToolError("Die echte Begleitung ist aktiv – keine Probe möglich.")
        mit_code = bool((code or "").strip())
        if mit_code and not self._code_ok(code):
            raise ToolError("Der Code stimmt nicht (zählt als Fehlversuch).")
        befugnisse = []
        b = getattr(self.c, "befugnisse", None)
        if b:
            befugnisse = [r["id"] for r in b.liste()["befugnisse"] if r["aktiv"]]
            b.entziehen(alle=True)
        bis = datetime.now() + timedelta(minutes=max(15, min(int(minuten or 120), 480)))
        with self.lock:
            z = self._z()
            z["probe"] = {"seit": datetime.now().isoformat(timespec="minutes"), "bis": bis.isoformat(timespec="minutes"),
                          "mit_code": mit_code, "befugnisse_vorher": befugnisse, "fortschritt": {}}
            self._s(z)
        self.c.audit.log("notfall", ereignis="probe_gestartet", mit_code=mit_code)
        self._an_richard(f"🧪 JARVIS: Notfall-Probe gestartet (bis {bis:%H:%M}). So käme die Nachricht im Ernstfall an.")
        self.c.broadcast({"type": "notfall", "aktiv": True, "probe": True})
        return {"probe": True, "bis": bis.strftime("%H:%M"), "mit_code": mit_code, "selbsttest": self.selbsttest()}

    def probe_beenden(self, auto: bool = False) -> dict:
        with self.lock:
            z = self._z()
            pr = z.pop("probe", None)
            if not pr:
                return {"probe": False}
            z["letzte_probe"] = {"datum": datetime.now().isoformat(timespec="minutes"), "seit": pr.get("seit"),
                                 "abgehakt": sum(1 for v in (pr.get("fortschritt") or {}).values() if v.get("status") == "erledigt"),
                                 "mit_code": pr.get("mit_code"), "automatisch": auto}
            self._s(z)
        b = getattr(self.c, "befugnisse", None)
        for rid in pr.get("befugnisse_vorher", []) if b else []:
            try:
                b.wieder_aktivieren(rid)
            except Exception:
                pass
        self.c.audit.log("notfall", ereignis="probe_beendet", automatisch=auto)
        self.c.broadcast({"type": "notfall", "aktiv": False, "probe": True, "beendet": True})
        return {"probe": False, "bericht": z["letzte_probe"], "selbsttest": self.selbsttest()}

    # ------------------------------------------------------------ Begleitung
    def _nur_aktiv(self):
        if not self.aktiv():
            raise ToolError("Die Notfallbegleitung ist nicht aktiv.")

    def uebersicht(self, kapitel: str = "", mit_text: bool = True) -> dict:
        self._nur_aktiv()
        from atlas.hilfen import maskieren
        z = self._z()
        f = (z.get("probe") or {}).get("fortschritt", {}) if self.ist_probe() else (z.get("fortschritt") or {})
        out = []
        for k in self.leitfaden():
            if kapitel and kapitel.lower() not in k["titel"].lower() and kapitel != k["id"]:
                continue
            schritte = [{"id": s["id"], "art": s["art"], "status": (f.get(s["id"]) or {}).get("status", "offen"),
                         "notiz": (f.get(s["id"]) or {}).get("notiz", ""),
                         **({"text": maskieren(s["text"])} if mit_text else {})} for s in k["schritte"]]
            erledigt = sum(1 for s in schritte if s["status"] == "erledigt")
            out.append({"id": k["id"], "titel": k["titel"], "ebene": k["ebene"], "erledigt": erledigt,
                        "gesamt": sum(1 for s in schritte if s["art"] != "text") or len(schritte), "schritte": schritte})
        naechster = next(({"kapitel": k["titel"], **s} for k in out for s in k["schritte"]
                          if s["art"] in ("aufgabe", "tabelle") and s["status"] == "offen"), None)
        quelle = z.get("probe") if self.ist_probe() else z
        return {"name": self.name(), "seit": quelle.get("seit"), "sterbedatum": quelle.get("sterbedatum", ""),
                "probe": self.ist_probe(), "probe_bis": (z.get("probe") or {}).get("bis", "")[11:16],
                "kapitel": out, "naechster_schritt": naechster,
                "fristen_vorgeschlagen": bool(z.get("fristen_vorgeschlagen"))}

    def schritt(self, schritt_id: str, status: str = "erledigt", notiz: str = "") -> dict:
        self._nur_aktiv()
        if status not in ("offen", "erledigt", "spaeter", "nicht_noetig"):
            raise ToolError("Status: offen, erledigt, spaeter oder nicht_noetig")
        ids = {s["id"] for k in self.leitfaden() for s in k["schritte"]}
        if schritt_id not in ids:
            raise ToolError("Diesen Schritt gibt es im Leitfaden nicht.")
        with self.lock:
            z = self._z()
            self._f(z)[schritt_id] = {"status": status, "notiz": (notiz or "")[:500],
                                                         "zeit": datetime.now().isoformat(timespec="minutes")}
            self._s(z)
        self.c.broadcast({"type": "notfall", "aktiv": True, "aktualisiert": True})
        return {"ok": True, "status": status}

    def sterbedatum(self, datum: str) -> dict:
        self._nur_aktiv()
        d = date.fromisoformat(datum[:10])
        with self.lock:
            z = self._z()
            (z["probe"] if self.ist_probe() else z)["sterbedatum"] = d.isoformat()
            self._s(z)
        return {"sterbedatum": d.isoformat(), "fristen": self.fristen_vorschlag()}

    def fristen_vorschlag(self) -> list[dict]:
        z = self._z()
        quelle = z.get("probe") if self.ist_probe() else z
        if not quelle.get("sterbedatum"):
            return []
        d = date.fromisoformat(quelle["sterbedatum"])
        return [{"datum": (d + timedelta(days=t)).isoformat(), "titel": titel, "hinweis": h} for t, titel, h in STANDARD_FRISTEN]

    def fristen_eintragen(self, auswahl: list[int] | None = None) -> dict:
        """Nach Klick seiner Frau: ausgewählte Fristen ins Fristenradar (mit Erinnerung)."""
        self._nur_aktiv()
        vorschlag = self.fristen_vorschlag()
        if not vorschlag:
            raise ToolError("Bitte zuerst das Sterbedatum eintragen.")
        if self.ist_probe():
            return {"probe": True, "eingetragen": [], "wuerde_eintragen": [f["titel"] for i, f in enumerate(vorschlag)
                                                                         if auswahl is None or i in auswahl]}
        eingetragen = []
        for i, f in enumerate(vorschlag):
            if auswahl is not None and i not in auswahl:
                continue
            datum = max(date.fromisoformat(f["datum"]), date.today()).isoformat()
            try:
                self.c.fristen.eintragen(f["titel"], datum, "Frist", f["hinweis"], quelle="notfall")
                eingetragen.append(f["titel"])
            except Exception as e:
                self.c.audit.log("fehler", bereich="notfall", text=str(e)[:200])
        with self.lock:
            z = self._z()
            z["fristen_vorgeschlagen"] = True
            self._s(z)
        return {"eingetragen": eingetragen}

    def status(self) -> dict:
        aktiv = self.aktiv()
        z = self._z()
        r = {"aktiv": aktiv, "probe": aktiv and self.ist_probe(), "eingerichtet": bool(z.get("hash")), "name": self.name(),
             "letzte_probe": z.get("letzte_probe")}
        if r["probe"]:
            r["probe_bis"] = z["probe"]["bis"][11:16]
            r["seit"] = z["probe"]["seit"]
        if aktiv:
            try:
                u = self.uebersicht(mit_text=False)
                r.update({"seit": z.get("seit"), "fortschritt": [{"kapitel": k["titel"], "erledigt": k["erledigt"],
                                                                 "gesamt": k["gesamt"]} for k in u["kapitel"]]})
            except ToolError as e:
                r["hinweis"] = str(e)
        return r

    def persona(self) -> str:
        if not self.aktiv():
            return ("- NOTFALL: Sagt jemand, Richard sei verstorben oder es sei der Notfall eingetreten, antworte ruhig "
                    "und mitfühlend: Die Notfallbegleitung startet seine Frau unter ⚙ Einstellungen → Notfall mit ihrem "
                    "persönlichen Code. Du kannst sie nicht selbst starten.\n")
        n = self.name()
        probe = ("- PROBE: Dies ist eine Notfall-PROBE, Richard lebt. Verhalte dich genau wie im Ernstfall (gleiche Ansprache, "
                 "gleicher Ablauf), damit die Probe aussagekräftig ist – aber nichts wird gesendet, abgelegt oder dauerhaft "
                 "eingetragen; das System sperrt solche Aktionen. Erwähne das kurz, wenn danach gefragt wird.\n") if self.ist_probe() else ""
        return probe + (f"- NOTFALLBEGLEITUNG AKTIV: Richard ist verstorben. Du sprichst jetzt mit {n}, seiner Frau – sprich sie "
                f"mit „{n}“ an, nie mit „Sir“. Richard hat dir für diesen Fall seinen Notfallordner als Leitlinie gegeben "
                "('notfall_leitfaden'); du bist ihre administrative Unterstützung. Anweisungen nimmst du jetzt von ihr an. "
                "Geh behutsam vor: kurze, warme Sätze, immer nur den nächsten Schritt, kein Druck, Pausen sind in Ordnung. "
                "Fasse Schritte aus dem Leitfaden in eigene Worte, nenne Ansprechpartner und Unterlagen, biete Entwürfe "
                "(Briefe, Mails) an – senden, ablegen, eintragen nur nach ihrer Bestätigung. Erledigtes mit 'notfall_schritt' "
                "abhaken. Keine Rechts- oder Steuerberatung: bei Erbe, Steuer, Versorgung auf Fachleute verweisen. "
                "Richards dienstliche Themen, Ziele und Hinweise spielen jetzt keine Rolle.\n")


def tools(core) -> list[Tool]:
    n = core.notfall
    return [
        Tool("notfall_status", "Ob die Notfallbegleitung eingerichtet/aktiv ist und – wenn aktiv – der Fortschritt je "
             "Kapitel. Starten kann sie nur Richards Frau im Dashboard mit ihrem Code.", "notfall.lesen", lambda: n.status()),
        Tool("notfall_selbsttest", "Prüft, ob die Notfallbegleitung im Ernstfall funktionieren würde (Code, Notfallordner, "
             "Kapitel, lokales Modell, Telegram) – für Richard zur Vorbereitung.", "notfall.lesen", lambda: n.selbsttest()),
        Tool("notfall_leitfaden", "NUR bei aktiver Notfallbegleitung: Richards Notfallordner als Leitfaden – Kapitel, "
             "Schritte mit Status, nächster offener Schritt. Optional ein Kapitel (Titel oder id).", "notfall.lesen",
             lambda kapitel="": n.uebersicht(kapitel), {"kapitel": S("Kapiteltitel oder id, optional")}),
        Tool("notfall_schritt", "NUR bei aktiver Notfallbegleitung: Schritt abhaken oder Status/Notiz setzen.",
             "notfall.schreiben", lambda schritt_id, status="erledigt", notiz="": n.schritt(schritt_id, status, notiz),
             {"schritt_id": S("id aus notfall_leitfaden"),
              "status": S("Status", enum=["offen", "erledigt", "spaeter", "nicht_noetig"]), "notiz": S("optional")},
             ["schritt_id"], label=lambda a: f"Schritt als „{a.get('status', 'erledigt')}“ markieren"),
    ]
