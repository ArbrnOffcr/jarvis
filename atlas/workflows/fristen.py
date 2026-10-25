"""Fristen- und Vertragsradar.

Fristen kommen aus Briefen (Posteingang), aus dem Chat („Mein Ausweis läuft am … ab“) oder aus
Dokumenten. Je Art gibt es einen eigenen Vorlauf im Morgenbriefing (Verträge früh, Zahlungen kurz
vorher) und – wo sinnvoll – eine Erinnerung in der Erinnerungen-App (Liste „Fristen“)."""
import json
import re
import threading
import uuid
from datetime import date, datetime, timedelta

from atlas import hilfen
from atlas.paths import read_private_json, write_private_json
from atlas.tools import S, Tool, ToolError, jxa

ZUSTAND = "fristen.json"

# Art → (Vorlauf-Tage fürs Briefing, Erinnerung so viele Tage vorher oder None)
ARTEN = {
    "Frist": ([7, 3, 1, 0], 2),
    "Zahlung": ([3, 1, 0], 2),
    "Vertrag": ([60, 30, 14, 7], 30),          # Vertragsende / Kündigungsfrist
    "Ausweis": ([90, 30, 7], 60),               # Personalausweis, Reisepass, Führerschein
    "TÜV": ([30, 7], 21),
    "Versicherung": ([30, 14, 7], 14),
    "Mietanpassung": ([30, 7], 14),
    "Einspruchsfrist": ([7, 2], None),          # Rechtsbehelfsfrist eines Bescheids
    "Termin": ([3, 1], None),
}

ERINNERUNG_ANLEGEN = r"""
function run(argv){
  const app=Application('Reminders'); const [liste,titel,faellig,notiz]=argv;
  let l=null;
  try { l=app.lists.byName(liste); l.name(); } catch(e) { app.lists.push(app.List({name:liste})); l=app.lists.byName(liste); }
  const props={name:titel, body:notiz};
  if(faellig){ props.dueDate=new Date(faellig); props.remindMeDate=new Date(faellig); }
  const r=app.Reminder(props); l.reminders.push(r);
  let id=null; try { id=r.id(); } catch(e) {}
  return JSON.stringify({id:id});
}"""

ERINNERUNG_STATUS = r"""
function run(argv){
  const app=Application('Reminders'); const out={};
  for (const id of JSON.parse(argv[0])) {
    try { out[id]=app.reminders.byId(id).completed(); } catch(e) { out[id]=null; }
  }
  return JSON.stringify(out);
}"""


def _datum(s) -> date | None:
    if isinstance(s, datetime):
        return s.date()
    if isinstance(s, date):
        return s
    s = str(s or "").strip()
    for fmt in ("%Y-%m-%d", "%d.%m.%Y", "%d.%m.%y"):
        try:
            return datetime.strptime(s[:10], fmt).date()
        except ValueError:
            continue
    m = re.match(r"^(\d{1,2})[./](\d{4})$", s)          # 05/2027 (TÜV-Plakette, Ausweis)
    if m:
        mo, j = int(m.group(1)), int(m.group(2))
        nxt = date(j + (mo == 12), mo % 12 + 1, 1)
        return nxt - timedelta(days=1)
    return None


def _norm(t: str) -> str:
    return re.sub(r"\W+", "", (t or "").lower())


class Fristen:
    def __init__(self, core):
        self.c = core
        self.cfg = core.cfg.get("fristen") or {}
        self.lock = threading.Lock()

    def zustand(self) -> dict:
        z = read_private_json(ZUSTAND, {})
        z.setdefault("liste", []); z.setdefault("gemeldet", {})
        return z

    def speichern(self, z: dict) -> None:
        write_private_json(ZUSTAND, z)

    # ---------- Eintragen ----------
    def eintragen(self, titel: str, datum: str, art: str = "Frist", notiz: str = "",
                  quelle: str = "chat", erinnerung: bool = True) -> dict:
        d = _datum(datum)
        if not d:
            raise ToolError(f"Datum „{datum}“ nicht lesbar (JJJJ-MM-TT, TT.MM.JJJJ oder MM/JJJJ)")
        art = next((a for a in ARTEN if a.lower() == (art or "").lower()), "Frist")
        titel = (titel or "").strip()[:120]
        if not titel:
            raise ToolError("Titel fehlt")
        with self.lock:
            z = self.zustand()
            alt = next((f for f in z["liste"] if _norm(f["titel"]) == _norm(titel) and f["datum"] == d.isoformat()), None)
            if alt:
                return {"vorhanden": True, **alt}
            f = {"id": uuid.uuid4().hex[:8], "titel": titel, "datum": d.isoformat(), "art": art,
                 "notiz": (notiz or "")[:300], "quelle": quelle, "erledigt": False,
                 "erfasst": datetime.now().isoformat(timespec="minutes")}
            tage_vorher = ARTEN[art][1]
            if erinnerung and tage_vorher is not None and d >= date.today():
                wann = hilfen.termin(hilfen.morgens(max(date.today(), d - timedelta(days=tage_vorher))))
                try:
                    r = jxa.run("Erinnerungen", ERINNERUNG_ANLEGEN, self.cfg.get("liste", "Fristen"),
                                f"{titel} – bis {d:%d.%m.%Y}", wann.strftime("%Y-%m-%dT%H:%M"),
                                "\n".join(x for x in (f"Art: {art}", f"Frist: {d:%d.%m.%Y}", notiz,
                                                      f"Quelle: {quelle}") if x))
                    f["erinnerung"] = (r or {}).get("id")
                    f["erinnerung_am"] = wann.strftime("%d.%m.%Y %H:%M")
                except ToolError as e:
                    self.c.audit.log("fehler", bereich="fristen", text=str(e)[:200])
            z["liste"].append(f)
            self.speichern(z)
        self.c.audit.log("frist", titel=titel, datum=d.isoformat(), art=art, quelle=quelle)
        try:
            self.c.lage.invalidate("erinnerungen")
        except Exception:
            pass
        return f

    def erledigt(self, frist: str) -> dict:
        with self.lock:
            z = self.zustand()
            f = next((x for x in z["liste"] if x["id"] == frist), None) or \
                next((x for x in z["liste"] if not x["erledigt"] and _norm(frist) in _norm(x["titel"])), None)
            if not f:
                raise ToolError(f"Frist „{frist}“ nicht gefunden")
            f["erledigt"] = True
            self.speichern(z)
            return {"erledigt": f["titel"]}

    def liste(self, tage: int = 120, auch_erledigte: bool = False) -> dict:
        self._abgleich()
        heute = date.today()
        out = []
        for f in sorted(self.zustand()["liste"], key=lambda x: x["datum"]):
            if f["erledigt"] and not auch_erledigte:
                continue
            t = (date.fromisoformat(f["datum"]) - heute).days
            if t > tage or t < -30:
                continue
            out.append({**f, "in_tagen": t})
        return {"fristen": out, "anzahl": len(out)}

    # ---------- abgehakte Erinnerungen → erledigt ----------
    def _abgleich(self) -> None:
        z = self.zustand()
        ids = {f["erinnerung"]: f for f in z["liste"] if f.get("erinnerung") and not f["erledigt"]}
        if not ids:
            return
        try:
            st = jxa.run("Erinnerungen", ERINNERUNG_STATUS, json.dumps(list(ids)))
        except ToolError:
            return
        geaendert = False
        for rid, done in (st or {}).items():
            if done:
                ids[rid]["erledigt"] = True
                geaendert = True
        if geaendert:
            self.speichern(z)

    # ---------- Briefing / Zeitleiste ----------
    def briefing_zeilen(self) -> list[str]:
        self._abgleich()
        z = self.zustand()
        heute, out = date.today(), []
        for f in sorted(z["liste"], key=lambda x: x["datum"]):
            if f["erledigt"]:
                continue
            t = (date.fromisoformat(f["datum"]) - heute).days
            gem = z["gemeldet"].setdefault(f["id"], [])
            stufen = ARTEN.get(f["art"], ARTEN["Frist"])[0]
            if t < 0:
                if t >= -7:
                    out.append(f"Überschritten seit {-t} Tag{'en' if t != -1 else ''}: {f['titel']} ({f['art']}).")
                continue
            faellig = [s for s in stufen if t <= s and str(s) not in gem]
            if faellig:
                gem += [str(s) for s in stufen if s >= t]
                wann = "heute" if t == 0 else "morgen" if t == 1 else f"in {t} Tagen"
                out.append(f"{f['art']}: {f['titel']} – {wann} ({date.fromisoformat(f['datum']):%d.%m.%Y}).")
        self.speichern(z)
        return out

    def zeitleiste(self, tage: int = 14) -> list[dict]:
        heute = date.today()
        return [{"datum": f["datum"], "zeit": None, "typ": "frist", "titel": f"{f['art']}: {f['titel']}"}
                for f in self.zustand()["liste"]
                if not f["erledigt"] and -7 <= (date.fromisoformat(f["datum"]) - heute).days <= tage]


def tools(core) -> list[Tool]:
    f = core.fristen
    return [
        Tool("frist_eintragen",
             "Frist oder Ablaufdatum ins Fristenradar eintragen (z. B. Ausweis läuft ab, Vertrag kündbar bis, "
             "TÜV fällig, Antwort ans Amt bis). Legt passend zur Art eine Erinnerung an.",
             "fristen.schreiben", f.eintragen,
             {"titel": S("Kurzer Titel, z. B. 'Personalausweis Anna'"),
              "datum": S("Datum JJJJ-MM-TT (oder MM/JJJJ bei TÜV/Ausweis)"),
              "art": S("Art", enum=list(ARTEN)), "notiz": S("Notiz, optional")},
             ["titel", "datum"], label=lambda a: f"Frist „{a.get('titel')}“ ({a.get('datum')}) eintragen"),
        Tool("fristen_liste", "Fristen, Vertragsenden und Ablaufdaten der nächsten Tage (Standard 120).",
             "fristen.lesen", f.liste, {"tage": {"type": "integer", "description": "Zeitraum in Tagen"},
                                        "auch_erledigte": {"type": "boolean"}}),
        Tool("frist_erledigt", "Frist als erledigt markieren (id oder Teil des Titels).",
             "fristen.schreiben", f.erledigt, {"frist": S("id oder Titel")}, ["frist"],
             label=lambda a: f"Frist „{a.get('frist')}“ erledigt"),
    ]
