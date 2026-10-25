"""Workflow „Arztrechnungen → Beihilfe → PKV“.

1. Neue Scans im Genius-Scan-Ordner (iCloud) werden erkannt:
   - Rechnung: Dateiname '[EHU] 2026_10 - 01-3496-001585.pdf'
   - Beihilfebescheid (BVA) und uniVersa-Leistungsabrechnung: am Inhalt erkannt
2. Rechnung: Daten lokal auslesen → ins Rechnungsarchiv verschieben → Zeile in der Excel-Tabelle
   'Beihilfe-PKV' anlegen → Erinnerungen: Beihilfe beantragen, PKV beantragen (heute) und
   Überweisen (2 Tage vor Zahlungstermin).
3. Abgehakte Erinnerungen setzen in Excel 'Antrag gestellt' bzw. 'Rechnung überwiesen'.
4. Bescheide: Erstattungen den Rechnungen zuordnen, 'Bescheid erhalten' + Betrag eintragen,
   Bescheid im Beihilfe- bzw. PKV-Archiv ablegen.
5. Morgenbriefing: Zahlungen 7 und 3 Tage vor dem Zahlungstermin, Überfälliges täglich.
Alles läuft lokal und nur auf dem Mac mit der Wache (kein doppeltes Verarbeiten)."""
import hashlib
import re
import shutil
import subprocess
import threading
import time
from datetime import date, datetime, timedelta
from pathlib import Path

from atlas.archiv.extract import extract
from atlas.paths import read_private_json, write_private_json
from atlas.tools import S, Tool, ToolError, jxa
from atlas.workflows import beihilfe_parser as P

ZUSTAND = "beihilfe.json"
AN, AUS = "☑", "☐"
RE_RECHNUNG = re.compile(r"^\[(?P<k>[A-Za-zÄÖÜäöü]{2,5})\]\s*(?P<j>\d{4})_(?P<m>\d{2})\s*-\s*(?P<nr>.+?)\.(pdf|jpe?g|png|heic)$", re.I)
DATEITYPEN = {".pdf", ".jpg", ".jpeg", ".png", ".heic"}

EXCEL_SKRIPT = r'''
on run argv
	set p to item 1 of argv
	set blatt to item 2 of argv
	set fname to item 3 of argv
	set f to POSIX file p
	tell application "Microsoft Excel"
		set wb to missing value
		try
			set wb to workbook fname
		end try
		set warOffen to (wb is not missing value)
		if wb is missing value then
			try
				open f
			on error e
				error "Öffnen fehlgeschlagen: " & e
			end try
			repeat 40 times
				try
					set wb to workbook fname
					exit repeat
				end try
				delay 0.5
			end repeat
		end if
		if wb is missing value then error "Arbeitsmappe nicht geöffnet (Excel-Zugriffsdialog bestätigen?)"
		try
			set sh to worksheet blatt of wb
		on error e
			error "Blatt '" & blatt & "' nicht gefunden: " & e
		end try
		set i to 4
		repeat while i ≤ (count of argv)
			set addr to item i of argv
			set typ to item (i + 1) of argv
			set val to item (i + 2) of argv
			try
				if typ is "n" then
					set value of range addr of sh to ((val as integer) / 100)
				else if typ is "d" then
					set value of range addr of sh to (val as integer)
				else if typ is "leer" then
					set value of range addr of sh to ""
				else
					set value of range addr of sh to val
				end if
			on error e
				error "Zelle " & addr & ": " & e
			end try
			set i to i + 3
		end repeat
		try
			save wb
		on error e
			error "Speichern fehlgeschlagen: " & e
		end try
		if not warOffen then close wb saving no
	end tell
	return "ok"
end run'''

ERINNERUNG_ANLEGEN = r"""
function run(argv){
  const app=Application('Reminders'); const [liste,titel,faellig,notiz]=argv;
  let l=null;
  try { l=app.lists.byName(liste); l.name(); } catch(e) { app.lists.push(app.List({name:liste})); l=app.lists.byName(liste); }
  const props={name:titel, body:notiz};
  if(faellig){ props.dueDate=new Date(faellig); props.remindMeDate=new Date(faellig); }
  const r=app.Reminder(props); l.reminders.push(r);
  let id=null; try { id=r.id(); } catch(e) {}
  if(!id){ const ids=l.reminders.whose({name:titel}).id(); id=ids[ids.length-1]; }
  return JSON.stringify({id:id});
}"""

ERINNERUNG_LOESCHEN = r"""
function run(argv){
  const app=Application('Reminders'); const out={};
  for (const id of JSON.parse(argv[0])) {
    try { app.delete(app.reminders.byId(id)); out[id]=true; } catch(e) { out[id]=false; }
  }
  return JSON.stringify(out);
}"""

ERINNERUNG_STATUS = r"""
function run(argv){
  const app=Application('Reminders'); const out={}; const liste=argv[1];
  for (const id of JSON.parse(argv[0])) {
    try { out[id]=app.reminders.byId(id).completed(); continue; } catch(e) {}
    try { const t=app.lists.byName(liste).reminders.whose({id:id}).completed(); out[id]=t.length?t[0]:null; }
    catch(e) { out[id]=null; }
  }
  return JSON.stringify(out);
}"""

ERINNERUNG_ERLEDIGT = r"""
function run(argv){
  const app=Application('Reminders');
  try { app.reminders.byId(argv[0]).completed=true; return JSON.stringify({ok:true}); }
  catch(e) { return JSON.stringify({ok:false}); }
}"""

REMINDERS_DB = Path.home() / "Library" / "Group Containers" / "group.com.apple.reminders" / "Container_v1" / "Stores"


def euro(x) -> str:
    return "–" if x is None else f"{x:,.2f} €".replace(",", "X").replace(".", ",").replace("X", ".")


def tag(d) -> str:
    return d.strftime("%d.%m.%Y") if d else "–"


def _d(s):
    if isinstance(s, datetime):
        return s.date()
    if isinstance(s, date):
        return s
    try:
        return date.fromisoformat(str(s)[:10])
    except ValueError:
        return None


class Beihilfe:
    def __init__(self, core):
        self.c = core
        self.cfg = core.cfg.get("beihilfe") or {}
        self.aktiv = bool(self.cfg.get("aktiv", True))
        self.lock = threading.Lock()
        self.letzter_scan = 0.0
        self.letzter_status = 0.0
        self.meldungen_einmal: set = set()
        self.excel_fehler = ""

    # ------------------------------------------------------------ Pfade
    @property
    def archiv(self) -> Path | None:
        return self.c.archiv.archive if self.c.archiv else None

    def pfad(self, key: str) -> Path | None:
        return self.archiv / self.cfg[key] if self.archiv and self.cfg.get(key) else None

    def eingang(self) -> Path | None:
        eigen = self.cfg.get("eingang")
        if eigen:
            p = Path(eigen).expanduser()
            return p if p.exists() else None
        basis = Path.home() / "Library" / "Mobile Documents"
        try:
            for d in sorted(basis.iterdir()):
                if "geniusscan" in d.name.lower().replace(" ", "").replace("-", ""):
                    return d / "Documents" if (d / "Documents").exists() else d
        except OSError:
            pass
        return None

    def kinder(self) -> dict:
        return self.cfg.get("kinder") or {}

    # ------------------------------------------------------------ Zustand
    def zustand(self) -> dict:
        z = read_private_json(ZUSTAND, {})
        z.setdefault("rechnungen", {}); z.setdefault("dateien", {}); z.setdefault("excel_ausstehend", [])
        z.setdefault("gemeldet", {})
        return z

    def speichern(self, z: dict) -> None:
        write_private_json(ZUSTAND, z)

    def melden(self, text: str, einmal: str = "") -> None:
        if einmal:
            if einmal in self.meldungen_einmal:
                return
            self.meldungen_einmal.add(einmal)
        self.c.audit.log("beihilfe", text=text[:300])
        try:
            self.c.proaktiv.hint(text)
        except Exception:
            self.c.broadcast({"type": "hinweis", "text": text})

    # ------------------------------------------------------------ Excel
    def excel_datei(self) -> Path | None:
        return self.pfad("excel")

    def excel_zeilen(self) -> list[dict]:
        import openpyxl
        f = self.excel_datei()
        if not f or not f.exists():
            raise ToolError("Excel-Datei nicht gefunden")
        wb = openpyxl.load_workbook(str(f), read_only=True, data_only=True)
        ws = wb[self.cfg["blatt"]]
        out, gelesen = [], {}
        for i, row in enumerate(ws.iter_rows(min_row=8, max_row=107, max_col=16, values_only=True), start=8):
            gelesen[i] = tuple(row) + (None,) * (16 - len(row))
        for i in range(8, 108):                         # nicht gespeicherte Zeilen gelten als leer
            row = gelesen.get(i, (None,) * 16)
            a, b, c, d, e, f_, g, h, i_, j, k, l = row[:12]
            out.append({"zeile": i, "kind": a, "nr": str(b) if b is not None else None, "datum": _d(c),
                        "ziel": _d(d), "betrag": float(e) if isinstance(e, (int, float)) else None,
                        "ueberwiesen": f_ == AN, "bh_antrag": g == AN, "bh_bescheid": h == AN,
                        "bh_erstattung": i_, "pkv_antrag": j == AN, "pkv_bescheid": k == AN,
                        "pkv_erstattung": l, "status": row[15] if len(row) > 15 else None})
        wb.close()
        return out

    def excel_schreiben(self, aenderungen: list[tuple[str, str, str]]) -> bool:
        """aenderungen: (Zelle, Typ, Wert) – Typ 't' Text, 'n' Betrag in Cent, 'd' Excel-Datum."""
        f = self.excel_datei()
        if not aenderungen or not f:
            return True
        args = [str(f), self.cfg["blatt"], f.name]
        for a in aenderungen:
            args += list(a)
        try:
            r = subprocess.run(["osascript", "-e", EXCEL_SKRIPT, *args], capture_output=True, text=True, timeout=180)
        except (OSError, subprocess.SubprocessError) as e:
            self.c.audit.log("fehler", bereich="beihilfe_excel", text=str(e)[:200])
            return False
        if r.returncode != 0:
            self.excel_fehler = re.sub(r"^\d+:\d+: execution error: ", "", r.stderr.strip())[-200:]
            self.c.audit.log("fehler", bereich="beihilfe_excel", text=r.stderr.strip()[-300:])
            return False
        self.excel_fehler = ""
        return True

    def excel(self, z: dict, aenderungen: list[tuple[str, str, str]], wofuer: str) -> None:
        """Schreiben oder – wenn Excel nicht kann – vormerken und später erneut versuchen."""
        if self.excel_schreiben(aenderungen):
            return
        z["excel_ausstehend"].append({"was": wofuer, "aenderungen": aenderungen})
        self.melden(f"Excel-Eintrag nicht möglich ({self.excel_fehler or 'unbekannt'}) – vorgemerkt, "
                    "ich trage es automatisch nach.", "excel_fehlt")

    def excel_nachholen(self, z: dict) -> None:
        offen, z["excel_ausstehend"] = z["excel_ausstehend"], []
        for job in offen:
            if not self.excel_schreiben([tuple(a) for a in job["aenderungen"]]):
                z["excel_ausstehend"].append(job)
        if offen and not z["excel_ausstehend"]:
            self.melden(f"Vorgemerkte Excel-Einträge nachgetragen ({len(offen)}).")

    @staticmethod
    def serial(d: date) -> str:
        return str((d - date(1899, 12, 30)).days)

    @staticmethod
    def cent(x: float) -> str:
        return str(int(round(x * 100)))

    # ------------------------------------------------------------ Erinnerungen
    def erinnerung(self, titel: str, faellig: datetime, notiz: str) -> str | None:
        try:
            r = jxa.run("Erinnerungen", ERINNERUNG_ANLEGEN, self.cfg.get("liste", "Beihilfe & PKV"), titel,
                        faellig.strftime("%Y-%m-%dT%H:%M"), notiz)
            return (r or {}).get("id")
        except ToolError as e:
            self.melden(f"Erinnerung konnte nicht angelegt werden: {e}", "erinnerung_fehlt")
            return None

    def termin(self, z: dict, t: datetime) -> datetime:
        """Nächste freie volle Stunde ab t – gemeinsames Raster aller Abläufe (Beihilfe, Post, Fristen):
        Erinnerungen liegen immer mindestens eine Stunde auseinander."""
        from atlas import hilfen
        belegt = [x for x in z.get("termine", []) if x[:10] >= date.today().isoformat()]
        while True:                                 # alte, nur hier gemerkte Belegungen weiter beachten
            t = hilfen.termin(t)
            if t.strftime("%Y-%m-%dT%H") not in belegt:
                return t
            t += timedelta(hours=1)

    def erinnerungen_anlegen(self, z: dict, r: dict, kind: dict, nr: str, notiz: str,
                             nur: tuple = ("beihilfe", "pkv", "zahlung")) -> dict:
        """Beihilfe → PKV → Überweisung, jeweils eine Stunde versetzt."""
        kurz = f"{kind['tabelle']} · {nr} · {euro(r['betrag'])}"
        ids = {}
        t = self.antrag_zeit()
        if "beihilfe" in nur:
            t = self.termin(z, t)
            ids["beihilfe"] = self.erinnerung(f"Beihilfe beantragen – {kurz}", t, notiz)
        if "pkv" in nur:
            t = self.termin(z, t + timedelta(hours=1) if "beihilfe" in nur else t)
            ids["pkv"] = self.erinnerung(f"uniVersa (PKV) einreichen – {kurz}", t, notiz)
        if "zahlung" in nur and not r.get("bezahlt") and r.get("ziel"):
            zt = datetime.combine(r["ziel"] - timedelta(days=int(self.cfg.get("zahlung_tage_vorher", 2))),
                                  datetime.min.time()).replace(hour=9)
            if zt < datetime.now():
                zt = datetime.now() + timedelta(hours=1)
            zt = self.termin(z, zt)
            ids["zahlung"] = self.erinnerung(f"Überweisen bis {r['ziel']:%d.%m.} – {kurz}", zt, notiz)
        return {k: v for k, v in ids.items() if v}

    def erinnerungen_loeschen(self, ids: list[str]) -> int:
        if not ids:
            return 0
        try:
            out = jxa.run("Erinnerungen", ERINNERUNG_LOESCHEN, __import__("json").dumps(ids)) or {}
            return sum(1 for v in out.values() if v)
        except ToolError:
            return 0

    def ausschluss(self) -> list[str]:
        """Namen der Familie – nie Zahlungsempfänger einer Rechnung."""
        namen = set()
        for k in self.kinder().values():
            namen.update(str(k.get("name", "")).split())
        namen.update(str(self.cfg.get("familienname", "")).split())
        return [n for n in namen if len(n) > 2]

    def notiz(self, r: dict, kind: dict, nr: str, datei: str) -> str:
        return "\n".join(x for x in [
            f"Kind: {kind['name']}", f"Rechnungsnummer: {nr}", f"Rechnungsdatum: {tag(r['datum'])}",
            f"Zahlungstermin: {tag(r['ziel'])}{' (geschätzt: Rechnungsdatum + 30 Tage)' if r.get('ziel_geschaetzt') else ''}",
            f"Betrag: {euro(r['betrag'])}",
            f"Empfänger: {r.get('empfaenger') or '–'}", f"IBAN: {r.get('iban') or '–'}",
            f"BIC: {r.get('bic') or '–'}", f"Verwendungszweck: {r.get('zweck') or nr}",
            f"Datei: DATENARCHIV/{self.cfg['rechnungsarchiv']}/{datei}",
            ("Bitte prüfen: " + ", ".join(r["probleme"])) if r["probleme"] else ""] if x)

    def antrag_zeit(self) -> datetime:
        hh, mm = map(int, str(self.cfg.get("antrag_uhrzeit", "18:00")).split(":"))
        t = datetime.now().replace(hour=hh, minute=mm, second=0, microsecond=0)
        return t if t > datetime.now() + timedelta(minutes=15) else datetime.now() + timedelta(minutes=30)

    # ------------------------------------------------------------ Hauptlauf
    def lauf(self, sofort: bool = False) -> list[str]:
        """Ein Durchgang: neue Dateien, abgehakte Erinnerungen, Excel nachholen."""
        if not self.aktiv:
            return ["Workflow ist ausgeschaltet (beihilfe.aktiv)."]
        with self.lock:
            z = self.zustand()
            berichte = []
            if z["excel_ausstehend"]:
                self.excel_nachholen(z)
            ein = self.eingang()
            if not ein:
                self.melden("Den Genius-Scan-Ordner finde ich nicht. Bitte in config.yaml unter "
                            "beihilfe → eingang den Pfad eintragen.", "kein_eingang")
            else:
                dateien = sorted(ein.rglob("*"), key=lambda p: (0 if RE_RECHNUNG.match(p.name) else 1, p.name))
                for f in dateien:                     # Rechnungen zuerst, dann Bescheide
                    if f.suffix.lower() not in DATEITYPEN or f.name.startswith("."):
                        continue
                    try:
                        st = f.stat()
                    except OSError:
                        continue
                    if not sofort and time.time() - st.st_mtime < 45:   # Upload noch nicht fertig
                        continue
                    try:
                        b = self.datei(f, z)
                    except Exception as e:
                        self.c.audit.log("fehler", bereich="beihilfe", datei=f.name, text=str(e)[:300])
                        b = None
                        self.melden(f"Konnte „{f.name}“ nicht verarbeiten: {e}", f"fehler:{f.name}")
                    if b:
                        berichte.append(b)
                        self.speichern(z)
            berichte += self.erinnerungen_abgleichen(z)
            self.speichern(z)
            return berichte

    def datei(self, f: Path, z: dict) -> str | None:
        h = hashlib.sha1(f.read_bytes()).hexdigest()
        schluessel = f"{h}:{f.name}"
        if schluessel in z["dateien"]:
            return None
        m = RE_RECHNUNG.match(f.name)
        if m and len(re.sub(r"[^A-Za-z0-9]", "", m.group("nr"))) < 3:
            # z. B. „[EHU] 2026_10 - .pdf“: Genius Scan exportiert noch oder die Nummer fehlt.
            # Nicht verarbeiten und nicht als erledigt merken – nach dem Umbenennen geht es weiter.
            self.melden(f"„{f.name}“ hat keine Rechnungsnummer im Namen – ich warte, bis die Datei "
                        f"„[Kürzel] Jahr_Monat - Rechnungsnummer“ heißt.", f"ohne_nr:{f.name}")
            return None
        frueher_r = next((v for k, v in z["dateien"].items()
                          if k.startswith(h + ":") and v.get("rechnung")), None) if m else None
        if frueher_r:                                  # gleiche Datei, anderer Name
            ziel = self.pfad("rechnungsarchiv")
            gleich = next((p for p in (ziel.iterdir() if ziel and ziel.exists() else [])
                           if p.is_file() and p.stat().st_size == f.stat().st_size and p.read_bytes() == f.read_bytes()), None)
            if gleich:
                f.unlink()
            bericht = (f"Diese Rechnung ist schon erfasst ({frueher_r['rechnung']}) – keine neuen Einträge."
                       + (f" Die doppelte Datei habe ich entfernt, das Original liegt als „{gleich.name}“ im Archiv." if gleich else ""))
            self.melden(bericht)
            z["dateien"][schluessel] = {"zeit": datetime.now().isoformat(timespec="seconds"), "ergebnis": "doppelt"}
            return bericht
        if m:
            bericht = self.rechnung(f, m, z)
        else:
            try:
                text = "\n".join(t for _, t in extract(f, ocr=True))
            except Exception:
                text = ""                              # kein lesbares Dokument – gehört nicht zu uns
            art = P.art(text) or P.art_aus_name(f.name)     # Inhalt oder Dateiname („Beihilfebescheid“, „Erstattung PKV“)
            frueher = next((v for k, v in z["dateien"].items()
                            if k.startswith(h + ":") and v.get("ergebnis") == "verarbeitet"), None)
            if art and frueher:                        # gleicher Bescheid, nur anders benannt
                bericht = self.doppelt(f, art, frueher)
            elif art:
                bericht = self.bescheid(f, text, art, z)
            else:                                      # alles andere ist Briefpost → Posteingang
                post = getattr(self.c, "post", None)
                bericht = post.brief(f, text) if post and post.aktiv else None
                if bericht:
                    z["dateien"][schluessel] = {"zeit": datetime.now().isoformat(timespec="seconds"),
                                                "ergebnis": "post"}
                    return bericht
        z["dateien"][schluessel] = {"zeit": datetime.now().isoformat(timespec="seconds"),
                                    "ergebnis": "verarbeitet" if bericht else "ignoriert"}
        if m and bericht:
            z["dateien"][schluessel]["rechnung"] = f"{m.group('k').upper()} {m.group('nr').strip()}"
        return bericht

    # ------------------------------------------------------------ Rechnung
    def rechnung(self, f: Path, m, z: dict) -> str | None:
        kz = m.group("k").upper()
        kind = self.kinder().get(kz)
        if not kind:
            self.melden(f"Rechnung „{f.name}“: Das Kürzel [{kz}] kenne ich nicht. Bitte in config.yaml "
                        f"unter beihilfe → kinder ergänzen.", f"kuerzel:{kz}:{f.name}")
            return None
        nr = m.group("nr").strip()
        key = f"{kz}:{P.norm_nr(nr)}"
        text = "\n".join(t for _, t in extract(f, ocr=True))
        r = P.rechnung(text, self.c.providers.get("lokal"), pfad=f, ausschluss=self.ausschluss())
        # Gleiche Rechnung unter anderem Namen? (Rechnungsnummer einer erfassten Rechnung steht im Text)
        flach = P.norm_nr(text)
        for k2, alt in z["rechnungen"].items():
            n2 = P.norm_nr(alt.get("nr"))
            if k2 != key and alt.get("kuerzel") == kz and len(n2) >= 6 and n2 in flach \
                    and (not alt.get("betrag") or alt.get("betrag") == r["betrag"]):
                bericht = (f"„{f.name}“ ist offenbar die schon erfasste Rechnung {alt['nr']} – nichts eingetragen. "
                           f"Die Datei bleibt im Scan-Ordner, bitte prüfen und ggf. löschen.")
                self.melden(bericht, f"dublette:{f.name}")
                return bericht
        if r.get("nummer") and P.norm_nr(r["nummer"]) != P.norm_nr(nr):
            r["probleme"].append(f"Rechnungsnummer im Dokument: {r['nummer']}")

        # 1) Ablage im Rechnungsarchiv
        ziel_ordner = self.pfad("rechnungsarchiv")
        ziel = self._ablegen(f, ziel_ordner, f.name)

        # 2) Excel – doppelte Einträge vermeiden
        zeilen = self.excel_zeilen()
        vorhanden = next((x for x in zeilen if x["nr"] and P.norm_nr(x["nr"]) == P.norm_nr(nr)
                          and x["kind"] == kind["tabelle"]), None)
        if vorhanden or key in z["rechnungen"]:
            return (f"Rechnung {nr} ({kind['tabelle']}) war schon erfasst – Datei ins Rechnungsarchiv "
                    f"verschoben, keine neuen Einträge.")
        frei = next((x["zeile"] for x in zeilen if not x["kind"] and not x["nr"]), None)
        if not frei:
            self.melden("Die Tabelle Beihilfe-PKV ist voll (Zeile 107). Bitte Zeilen erweitern.", "excel_voll")
            return None
        aend = [(f"A{frei}", "t", kind["tabelle"]), (f"B{frei}", "t", nr)]
        if r["datum"]:
            aend.append((f"C{frei}", "d", self.serial(r["datum"])))
        if r["ziel"]:
            aend.append((f"D{frei}", "d", self.serial(r["ziel"])))
        if r["betrag"]:
            aend.append((f"E{frei}", "n", self.cent(r["betrag"])))
        for col in "FGHJK":
            aend.append((f"{col}{frei}", "t", AN if col == "F" and r.get("bezahlt") else AUS))
        self.excel(z, aend, f"Rechnung {nr}")

        # 3) Erinnerungen – Beihilfe, PKV und Überweisung je eine Stunde versetzt
        ids = self.erinnerungen_anlegen(z, r, kind, nr, self.notiz(r, kind, nr, ziel.name))

        z["rechnungen"][key] = {
            "kuerzel": kz, "kind": kind["tabelle"], "nr": nr, "zeile": frei,
            "datum": str(r["datum"] or ""), "ziel": str(r["ziel"] or ""), "betrag": r["betrag"],
            "empfaenger": r.get("empfaenger"), "iban": r.get("iban"), "bic": r.get("bic"),
            "behandlung": str(r.get("behandlung") or ""), "bezahlt": bool(r.get("bezahlt")),
            "datei": ziel.name, "erinnerungen": ids,
            "erledigt": {}, "probleme": r["probleme"], "erfasst": datetime.now().isoformat(timespec="seconds")}
        bericht = (f"Neue Rechnung gefunden: {kind['tabelle']}, Nr. {nr}, {euro(r['betrag'])}, "
                   f"Zahlungstermin {tag(r['ziel'])}. Nach Beihilfe/PKV › Rechnungsarchiv verschoben, in Excel (Zeile {frei}) "
                   f"eingetragen, Erinnerungen für Beihilfe, PKV"
                   f"{' und Überweisung' if 'zahlung' in ids and ids['zahlung'] else ''} angelegt.")
        if r.get("bezahlt"):
            bericht += " Die Rechnung ist laut Beleg bereits bezahlt."
        if r["probleme"]:
            bericht += (f" Bitte prüfen: {', '.join(r['probleme'])}. Sag mir einfach die richtigen Angaben, "
                        f"z. B. „Rechnung {nr}: Betrag … Euro, Zahlungstermin …“.")
        self.melden(bericht)
        return bericht

    def _ablegen(self, quelle: Path, ordner: Path | None, name: str) -> Path:
        if not ordner:
            raise ToolError("Zielordner im DATENARCHIV nicht gefunden")
        ordner.mkdir(parents=True, exist_ok=True)
        ziel = ordner / name
        if ziel.exists():
            if ziel.read_bytes() == quelle.read_bytes():
                quelle.unlink()
                return ziel
            stamm, endung, n = ziel.stem.rstrip(), ziel.suffix, 2
            while (ordner / f"{stamm} {n}{endung}").exists():
                n += 1
            ziel = ordner / f"{stamm} {n}{endung}"
        shutil.move(str(quelle), str(ziel))
        return ziel

    # ------------------------------------------------------------ Bescheide
    def doppelt(self, f: Path, art: str, frueher: dict) -> str:
        """Ein bereits verarbeiteter Bescheid taucht erneut auf: nichts doppelt eintragen."""
        ordner, bez = ((self.pfad("beihilfe_archiv"), "Beihilfebescheid") if art == "beihilfe"
                       else (self.pfad("pkv_archiv"), "Erstattung PKV"))
        vorhanden = next((p for p in (ordner.iterdir() if ordner and ordner.exists() else [])
                          if p.is_file() and p.stat().st_size == f.stat().st_size and p.read_bytes() == f.read_bytes()), None)
        if vorhanden:
            f.unlink()                                 # identische Kopie liegt schon im Archiv
            ort = f"liegt bereits als „{vorhanden.name}“ im Archiv, die doppelte Datei habe ich entfernt"
        else:
            dm = re.match(r"^(\d{4})[_-](\d{2})[_-](\d{2})", f.name)
            eingang = date(*map(int, dm.groups())) if dm else date.fromtimestamp(f.stat().st_mtime)
            ziel = self._ablegen(f, ordner, f"{eingang:%Y_%m_%d} - {bez}{f.suffix.lower()}")
            ort = f"abgelegt als „{ziel.name}“"
        name = "Beihilfebescheid" if art == "beihilfe" else "uniVersa-Abrechnung"
        bericht = (f"Diesen {name} hatte ich schon am {frueher['zeit'][8:10]}.{frueher['zeit'][5:7]}. verarbeitet – "
                   f"die Excel-Tabelle ist bereits aktuell. Die Datei {ort}.")
        self.melden(bericht)
        return bericht

    def bescheid(self, f: Path, text: str, art: str, z: dict) -> str | None:
        if art == "beihilfe":
            b = P.beihilfebescheid(text)
            ordner, bez = self.pfad("beihilfe_archiv"), "Beihilfebescheid"
        else:
            b = P.pkv_abrechnung(text, {k: v["name"] for k, v in self.kinder().items()})
            ordner, bez = self.pfad("pkv_archiv"), "Erstattung PKV"
        dm = re.match(r"^(\d{4})[_-](\d{2})[_-](\d{2})", f.name)     # Datum im Namen hat Vorrang
        eingang = date(*map(int, dm.groups())) if dm else date.fromtimestamp(f.stat().st_mtime)
        ziel = self._ablegen(f, ordner, f"{eingang:%Y_%m_%d} - {bez}{f.suffix.lower()}")
        ordner_name = "Beihilfe/PKV › Beihilfearchiv" if art == "beihilfe" else "Beihilfe/PKV › PKV-Archiv"

        zeilen = self.excel_zeilen()
        benutzt, aend, zugeordnet, offen, bereits = set(), [], [], [], []
        zahl = lambda v: v if isinstance(v, (int, float)) else None

        def schon(spalte_ok, spalte_betrag, bl, nur_kind=None):
            """Ist dieser Beleg schon eingetragen (Häkchen gesetzt, gleicher Erstattungsbetrag)?"""
            for x in zeilen:
                if (x["zeile"] not in benutzt and x[spalte_ok] and x["betrag"] is not None
                        and abs(x["betrag"] - bl["betrag"]) < 0.01 and (nur_kind is None or x["kind"] == nur_kind)
                        and zahl(x[spalte_betrag]) is not None and abs(x[spalte_betrag] - bl["erstattung"]) < 0.01):
                    benutzt.add(x["zeile"])
                    return f"{x['kind']} {x['nr']}"
            return None
        for bl in b["belege"]:
            if art == "beihilfe":
                if bl["person"] not in ("K", "?"):
                    continue                          # eigene/Partner-Belege gehören nicht in diese Tabelle
                kand = [x for x in zeilen if x["zeile"] not in benutzt and x["kind"] and not x["bh_bescheid"]
                        and x["betrag"] is not None and abs(x["betrag"] - bl["betrag"]) < 0.01]
                genau = [x for x in kand if x["datum"] == bl["datum"]]
                kand = genau or [x for x in kand if x["datum"] and bl["datum"] and abs((x["datum"] - bl["datum"]).days) <= 3]
                if not kand:
                    s_ = schon("bh_bescheid", "bh_erstattung", bl)
                    (bereits.append(s_) if s_ else offen.append(f"{tag(bl['datum'])} {euro(bl['betrag'])}"))
                    continue
                x = sorted(kand, key=lambda x: x["zeile"])[0]
                benutzt.add(x["zeile"])
                aend += [(f"H{x['zeile']}", "t", AN), (f"I{x['zeile']}", "n", self.cent(bl["erstattung"]))]
                if not x["bh_antrag"]:
                    aend.append((f"G{x['zeile']}", "t", AN))
                zugeordnet.append(f"{x['kind']} {x['nr']}: {euro(bl['erstattung'])}")
            else:
                if bl["duplikat"]:
                    continue
                kind = (self.kinder().get(bl["person"]) or {}).get("tabelle")
                kand = [x for x in zeilen if x["zeile"] not in benutzt and x["kind"] == kind and not x["pkv_bescheid"]
                        and x["betrag"] is not None and abs(x["betrag"] - bl["betrag"]) < 0.01]
                if not kand:
                    s_ = schon("pkv_bescheid", "pkv_erstattung", bl, kind)
                    (bereits.append(s_) if s_ else offen.append(f"{kind or bl['person']} {euro(bl['betrag'])}"))
                    continue
                x = sorted(kand, key=lambda x: (x["datum"] or date.max, x["zeile"]))[0]
                benutzt.add(x["zeile"])
                aend += [(f"K{x['zeile']}", "t", AN), (f"L{x['zeile']}", "n", self.cent(bl["erstattung"]))]
                if not x["pkv_antrag"]:
                    aend.append((f"J{x['zeile']}", "t", AN))
                zugeordnet.append(f"{x['kind']} {x['nr']}: {euro(bl['erstattung'])}")
        if aend:
            self.excel(z, aend, f"{bez} {eingang}")
        name = "Beihilfebescheid" if art == "beihilfe" else "uniVersa-Leistungsabrechnung"
        bericht = (f"{name} vom {tag(b['datum'])} erkannt ({euro(b.get('summe'))}). "
                   + (f"In Excel eingetragen: {'; '.join(zugeordnet)}. " if zugeordnet else "")
                   + (f"Bereits eingetragen, nichts zu ändern: {'; '.join(bereits)}. " if bereits else "")
                   + (f"Nicht zuordenbar: {'; '.join(offen)} – bitte prüfen. " if offen else "")
                   + ("Die Beträge konnte ich nicht auslesen – bitte prüfen. " if not b["belege"] else "")
                   + f"Abgelegt in {ordner_name} als „{ziel.name}“.")
        if bereits and not zugeordnet and not offen:
            bericht += " Vermutlich ist das eine zweite Kopie eines schon verarbeiteten Bescheids."
        if art == "beihilfe" and not b.get("sicher"):
            bericht += " Achtung: Die Beträge ergeben nicht die Bescheidsumme – bitte kontrollieren."
        self.melden(bericht)
        return bericht

    # ------------------------------------------------------------ Erinnerungen → Excel
    def erinnerungen_abgleichen(self, z: dict) -> list[str]:
        ids = {}
        for key, r in z["rechnungen"].items():
            for art, rid in (r.get("erinnerungen") or {}).items():
                if not r.get("erledigt", {}).get(art):
                    ids[rid] = (key, art)
        if not ids:
            return []
        try:
            status = jxa.run("Erinnerungen", ERINNERUNG_STATUS, __import__("json").dumps(list(ids)),
                             self.cfg.get("liste", "Beihilfe & PKV"))
        except ToolError as e:
            self.c.audit.log("fehler", bereich="beihilfe_erinnerungen", text=str(e)[:200])
            return []
        fehlt = [rid for rid, v in (status or {}).items() if v is None]
        if fehlt:
            self.c.audit.log("fehler", bereich="beihilfe_erinnerungen",
                             text=f"{len(fehlt)} Erinnerung(en) nicht gefunden", ids=fehlt[:5])
        spalte = {"beihilfe": "G", "pkv": "J", "zahlung": "F"}
        text = {"beihilfe": "Beihilfe-Antrag gestellt", "pkv": "PKV-Antrag gestellt", "zahlung": "Rechnung überwiesen"}
        aend, berichte = [], []
        for rid, done in (status or {}).items():
            if not done:
                continue
            key, art = ids[rid]
            r = z["rechnungen"][key]
            r.setdefault("erledigt", {})[art] = datetime.now().isoformat(timespec="minutes")
            aend.append((f"{spalte[art]}{r['zeile']}", "t", AN))
            berichte.append(f"{text[art]}: {r['kind']} {r['nr']}")
        if aend:
            self.excel(z, aend, "abgehakte Erinnerungen")
            self.melden("Abgehakt und in Excel vermerkt: " + "; ".join(berichte) + ".")
        return berichte

    # ------------------------------------------------------------ Briefing
    def briefing_zeilen(self) -> list[str]:
        """Zahlungen 7 und 3 Tage vorher, Überfälliges täglich (aus der Excel-Tabelle)."""
        if not self.aktiv:
            return []
        try:
            zeilen = self.excel_zeilen()
        except Exception:
            return []
        z = self.zustand()
        heute, out = date.today(), []
        for x in zeilen:
            if not x["kind"] or x["ueberwiesen"] or not x["ziel"] or x["betrag"] is None:
                continue
            tage, key = (x["ziel"] - heute).days, f"{x['kind']}:{x['nr']}"
            gem = z["gemeldet"].setdefault(key, [])
            was = f"die Rechnung {x['nr']} für {x['kind']} über {euro(x['betrag'])}"
            if tage < 0:
                out.append(f"Überfällig seit {-tage} Tag{'en' if -tage != 1 else ''}: {was} (Zahlungstermin {tag(x['ziel'])}).")
            elif tage <= 3 and "3" not in gem:
                out.append(f"In {tage} Tag{'en' if tage != 1 else ''} fällig: {was} (bis {tag(x['ziel'])}).")
                gem += ["3", "7"]
            elif tage <= 7 and "7" not in gem:
                out.append(f"In {tage} Tagen fällig: {was} (bis {tag(x['ziel'])}).")
                gem.append("7")
        self.speichern(z)
        return out

    # ------------------------------------------------------------ Übersicht / Korrektur
    def status(self) -> dict:
        zeilen = [x for x in self.excel_zeilen() if x["kind"]]
        def liste(bed):
            return [f"{x['kind']} {x['nr']} ({euro(x['betrag'])}, Termin {tag(x['ziel'])})" for x in zeilen if bed(x)]
        zahl = lambda v: v if isinstance(v, (int, float)) else 0
        offen = sum((x["betrag"] or 0) - zahl(x["bh_erstattung"]) - zahl(x["pkv_erstattung"])
                    for x in zeilen if not (x["bh_bescheid"] and x["pkv_bescheid"]))
        return {"zu_ueberweisen": liste(lambda x: not x["ueberwiesen"]),
                "beihilfe_beantragen": liste(lambda x: not x["bh_antrag"]),
                "pkv_beantragen": liste(lambda x: not x["pkv_antrag"]),
                "warte_auf_beihilfe": liste(lambda x: x["bh_antrag"] and not x["bh_bescheid"]),
                "warte_auf_pkv": liste(lambda x: x["pkv_antrag"] and not x["pkv_bescheid"]),
                "noch_ausstehend_eur": round(offen, 2), "scan_ordner": str(self.eingang() or "nicht gefunden")}

    def ergaenzen(self, rechnungsnummer: str, betrag: str = "", rechnungsdatum: str = "",
                  zahlungstermin: str = "", bezahlt: bool | None = None) -> dict:
        with self.lock:
            zeilen = self.excel_zeilen()
            x = next((x for x in zeilen if x["nr"] and P.norm_nr(x["nr"]) == P.norm_nr(rechnungsnummer)), None)
            if not x:
                raise ToolError(f"Rechnung {rechnungsnummer} steht nicht in der Tabelle")
            z, aend, neu = self.zustand(), [], {}
            if betrag:
                b = P.betrag(betrag if "," in betrag else betrag.replace(".", ","))
                if not b:
                    raise ToolError("Betrag nicht lesbar")
                aend.append((f"E{x['zeile']}", "n", self.cent(b))); neu["betrag"] = b
            for feld, wert, sp in (("datum", rechnungsdatum, "C"), ("ziel", zahlungstermin, "D")):
                if wert:
                    d = P.datum(wert) or _d(wert)
                    if not d:
                        raise ToolError(f"Datum '{wert}' nicht lesbar")
                    aend.append((f"{sp}{x['zeile']}", "d", self.serial(d))); neu[feld] = str(d)
            if bezahlt is not None:
                aend.append((f"F{x['zeile']}", "t", AN if bezahlt else AUS))
            if not aend:
                return {"hinweis": "Nichts zu ändern."}
            if not self.excel_schreiben(aend):
                raise ToolError("Excel nicht erreichbar")
            for key, r in z["rechnungen"].items():
                if P.norm_nr(r["nr"]) == P.norm_nr(rechnungsnummer):
                    r.update(neu); r["probleme"] = []
                    if bezahlt and not r.get("erledigt", {}).get("zahlung"):
                        r.setdefault("erledigt", {})["zahlung"] = datetime.now().isoformat(timespec="minutes")
                        rid = (r.get("erinnerungen") or {}).get("zahlung")
                        if rid:                         # Erinnerung gleich mit abhaken
                            try:
                                jxa.run("Erinnerungen", ERINNERUNG_ERLEDIGT, rid)
                            except ToolError:
                                pass
                    if neu.get("ziel") and not r.get("bezahlt") and "zahlung" not in r.get("erinnerungen", {}):
                        zt = datetime.combine(date.fromisoformat(neu["ziel"]) - timedelta(days=2), datetime.min.time()).replace(hour=9)
                        rid = self.erinnerung(f"Überweisen bis {date.fromisoformat(neu['ziel']):%d.%m.} – {r['kind']} · {r['nr']}",
                                              self.termin(z, max(zt, datetime.now() + timedelta(hours=1))),
                                              f"Rechnungsnummer: {r['nr']}")
                        if rid:
                            r.setdefault("erinnerungen", {})["zahlung"] = rid
            self.speichern(z)
            return {"aktualisiert": f"Zeile {x['zeile']}", "felder": list(neu) + (["bezahlt"] if bezahlt is not None else [])}

    def _eintrag(self, z: dict, rechnungsnummer: str = "", zeile: int | None = None):
        for key, r in z["rechnungen"].items():
            if (zeile and int(r.get("zeile") or 0) == int(zeile)) or \
                    (rechnungsnummer and P.norm_nr(r["nr"]) == P.norm_nr(rechnungsnummer)):
                return key, r
        return None, None

    def neu_einlesen(self, rechnungsnummer: str) -> dict:
        """Archivierte Rechnung mit der aktuellen Auswertung erneut lesen, Excel-Werte (Datum, Termin,
        Betrag) korrigieren und offene Erinnerungen mit richtigen Angaben neu anlegen."""
        with self.lock:
            z = self.zustand()
            key, r = self._eintrag(z, rechnungsnummer)
            if not r:
                raise ToolError(f"Rechnung {rechnungsnummer} kenne ich nicht")
            f = (self.pfad("rechnungsarchiv") or Path("/nonexistent")) / r["datei"]
            if not f.exists():
                raise ToolError(f"Datei {r['datei']} liegt nicht mehr im Rechnungsarchiv")
            kind = self.kinder().get(r["kuerzel"]) or {"name": r["kind"], "tabelle": r["kind"]}
            text = "\n".join(t for _, t in extract(f, ocr=True))
            neu = P.rechnung(text, self.c.providers.get("lokal"), pfad=f, ausschluss=self.ausschluss())
            aend = []
            if neu["datum"]:
                aend.append((f"C{r['zeile']}", "d", self.serial(neu["datum"])))
            if neu["ziel"]:
                aend.append((f"D{r['zeile']}", "d", self.serial(neu["ziel"])))
            if neu["betrag"]:
                aend.append((f"E{r['zeile']}", "n", self.cent(neu["betrag"])))
            if aend and not self.excel_schreiben(aend):
                raise ToolError(f"Excel nicht erreichbar ({self.excel_fehler or 'unbekannt'})")
            offen = [k for k in r.get("erinnerungen", {}) if not r.get("erledigt", {}).get(k)]
            geloescht = self.erinnerungen_loeschen([r["erinnerungen"][k] for k in offen])
            for k in offen:
                r["erinnerungen"].pop(k, None)
            r.update({"datum": str(neu["datum"] or ""), "ziel": str(neu["ziel"] or ""), "betrag": neu["betrag"],
                      "empfaenger": neu.get("empfaenger"), "iban": neu.get("iban"), "bic": neu.get("bic"),
                      "bezahlt": bool(neu.get("bezahlt")), "probleme": neu["probleme"]})
            r["erinnerungen"].update(self.erinnerungen_anlegen(z, neu, kind, r["nr"],
                                                               self.notiz(neu, kind, r["nr"], r["datei"]), tuple(offen)))
            self.speichern(z)
            return {"zeile": r["zeile"], "betrag": euro(neu["betrag"]), "rechnungsdatum": tag(neu["datum"]),
                    "zahlungstermin": tag(neu["ziel"]), "empfaenger": neu.get("empfaenger") or "–",
                    "erinnerungen_ersetzt": f"{geloescht} gelöscht, {len(offen)} neu (je eine Stunde versetzt)",
                    "noch_pruefen": neu["probleme"]}

    def eintrag_entfernen(self, zeile: int) -> dict:
        """Fehlerhaften Eintrag zurücknehmen: Excel-Zeile leeren, zugehörige Erinnerungen löschen."""
        with self.lock:
            zeile = int(zeile)
            if not 8 <= zeile <= 107:
                raise ToolError("Zeile muss zwischen 8 und 107 liegen")
            z = self.zustand()
            key, r = self._eintrag(z, zeile=zeile)
            aend = [(f"{c}{zeile}", "leer", "") for c in "ABCDEFGHIJKL"]
            if not self.excel_schreiben(aend):
                raise ToolError(f"Excel nicht erreichbar ({self.excel_fehler or 'unbekannt'})")
            geloescht = 0
            if r:
                geloescht = self.erinnerungen_loeschen(list((r.get("erinnerungen") or {}).values()))
                z["rechnungen"].pop(key)
                for v in z["dateien"].values():
                    if v.get("rechnung") == f"{r['kuerzel']} {r['nr']}":
                        v.pop("rechnung", None)
                self.speichern(z)
            self.c.audit.log("beihilfe", text=f"Zeile {zeile} entfernt ({key or 'ohne Zustand'})")
            return {"zeile": zeile, "geleert": True, "erinnerungen_geloescht": geloescht,
                    "hinweis": "Die PDF-Datei im Rechnungsarchiv bleibt unverändert."}

    # ------------------------------------------------------------ Hintergrund
    def _reminders_stand(self) -> tuple:
        """Änderungsmerkmal der Erinnerungen-Datenbank (Festplattenvollzugriff vorhanden)."""
        try:
            return tuple(sorted((f.name, f.stat().st_mtime_ns) for f in REMINDERS_DB.glob("*.sqlite*")))
        except OSError:
            return ()

    def _offene_erinnerungen(self) -> bool:
        return any(not (r.get("erledigt") or {}).get(a)
                   for r in self.zustand()["rechnungen"].values() for a in (r.get("erinnerungen") or {}))

    def schleife(self, stop: threading.Event) -> None:
        """Alle 5 s nur die Dateizeit der Erinnerungen prüfen (kostet nichts). Wird etwas abgehakt,
        steht es nach wenigen Sekunden in Excel. Ohne Dateizugriff: Abgleich jede Minute.
        Neue Scans und Bescheide: alle paar Minuten."""
        stand, letzter_abgleich = self._reminders_stand(), 0.0
        while not stop.wait(5):
            try:
                if not self.aktiv or not getattr(self.c.proaktiv, "leader", False):
                    continue
                if time.time() - self.letzter_scan > int(self.cfg.get("intervall_min", 3)) * 60:
                    self.letzter_scan = letzter_abgleich = time.time()
                    stand = self._reminders_stand()
                    self.lauf()
                    continue
                neu = self._reminders_stand()
                faellig = (neu and neu != stand) or (not neu and time.time() - letzter_abgleich > 60)
                if faellig and self._offene_erinnerungen():
                    stand, letzter_abgleich = neu, time.time()
                    time.sleep(2)                       # Sync der Erinnerungen abschließen lassen
                    with self.lock:
                        z = self.zustand()
                        if self.erinnerungen_abgleichen(z):
                            self.speichern(z)
                else:
                    stand = neu
            except Exception as e:
                self.c.audit.log("fehler", bereich="beihilfe", text=str(e)[:300])

    def start(self, stop: threading.Event) -> None:
        if self.aktiv:
            threading.Thread(target=self.schleife, args=(stop,), name="beihilfe", daemon=True).start()


def tools(core) -> list[Tool]:
    w = core.beihilfe
    return [
        Tool("beihilfe_status",
             "Stand der Arztrechnungen der Kinder (Beihilfe/PKV): was zu überweisen ist, welche Anträge "
             "noch zu stellen sind, auf welche Bescheide gewartet wird, noch ausstehender Betrag.",
             "beihilfe.lesen", w.status),
        Tool("beihilfe_pruefen",
             "Genius-Scan-Ordner sofort auf neue Rechnungen und Bescheide prüfen und verarbeiten.",
             "beihilfe.verarbeiten", lambda: {"ergebnis": w.lauf(sofort=True) or ["Nichts Neues gefunden."]}),
        Tool("beihilfe_rechnung_ergaenzen",
             "Fehlende oder falsch erkannte Angaben einer Rechnung in der Beihilfe-Tabelle korrigieren.",
             "beihilfe.schreiben", w.ergaenzen,
             {"rechnungsnummer": S("Rechnungsnummer"), "betrag": S("Betrag, z. B. '60,83'"),
              "rechnungsdatum": S("TT.MM.JJJJ"), "zahlungstermin": S("TT.MM.JJJJ"),
              "bezahlt": {"type": "boolean", "description": "Rechnung bereits überwiesen?"}},
             ["rechnungsnummer"], label=lambda a: f"Rechnung {a.get('rechnungsnummer')} korrigieren"),
        Tool("beihilfe_rechnung_neu_einlesen",
             "Eine bereits erfasste Rechnung aus dem Rechnungsarchiv neu auswerten: Betrag, Datum und "
             "Zahlungstermin in Excel korrigieren und offene Erinnerungen mit richtigen Angaben neu anlegen.",
             "beihilfe.schreiben", w.neu_einlesen, {"rechnungsnummer": S("Rechnungsnummer")},
             ["rechnungsnummer"], label=lambda a: f"Rechnung {a.get('rechnungsnummer')} neu einlesen"),
        Tool("beihilfe_eintrag_entfernen",
             "Einen falschen oder doppelten Eintrag zurücknehmen: Excel-Zeile leeren und die zugehörigen "
             "Erinnerungen löschen. Nur auf ausdrücklichen Wunsch.",
             "beihilfe.schreiben", w.eintrag_entfernen,
             {"zeile": {"type": "integer", "description": "Zeilennummer in der Tabelle Beihilfe-PKV"}},
             ["zeile"], label=lambda a: f"Beihilfe-Tabelle: Zeile {a.get('zeile')} leeren"),
    ]
