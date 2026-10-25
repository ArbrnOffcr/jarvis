"""Apple Kontakte: suchen, Geburtstage, neue Kontakte anlegen (nur nach Bestätigung)."""
import re

from atlas.tools import S, Tool, jxa

SUCHEN = r"""
function run(argv){
  const app=Application('Contacts'); const q=argv[0];
  const ps=app.people.whose({_or:[{name:{_contains:q}},{organization:{_contains:q}},{nickname:{_contains:q}}]})();
  return JSON.stringify(ps.slice(0,15).map(p=>({
    id:p.id(), name:p.name(), firma:p.organization()||null,
    emails:p.emails().map(e=>e.value()),
    telefon:p.phones().map(t=>[t.label(), t.value()]),
    adressen:p.addresses().map(a=>a.formattedAddress()),
    geburtstag:p.birthDate()? p.birthDate().toISOString().slice(0,10):null })));
}"""


GEBURTSTAGE = r"""
function run(){
  const app=Application('Contacts'); const names=app.people.name(), bd=app.people.birthDate(); const out=[];
  for(let i=0;i<names.length;i++){ const d=bd[i]; if(!d) continue;
    out.push({name:names[i], jahr:d.getFullYear(), monat:d.getMonth()+1, tag:d.getDate()}); }
  return JSON.stringify(out);
}"""


def geburtstage(tage: int = 14) -> list[dict]:
    """Geburtstage der nächsten Tage aus den Kontakten."""
    import datetime as dt
    heute = dt.date.today()
    out = []
    for p in jxa.run("Kontakte", GEBURTSTAGE) or []:
        for jahr in (heute.year, heute.year + 1):
            try:
                d = dt.date(jahr, p["monat"], p["tag"])
            except ValueError:          # 29. Februar
                d = dt.date(jahr, 3, 1)
            if 0 <= (d - heute).days <= tage:
                alter = jahr - p["jahr"] if p["jahr"] > 1700 else None
                out.append({"name": p["name"], "datum": d.isoformat(), "in_tagen": (d - heute).days,
                            "alter": alter})
                break
    return sorted(out, key=lambda x: x["in_tagen"])


def _clean(label: str) -> str:
    return re.sub(r"_\$!<(.+?)>!\$_", r"\1", label or "")


def suchen(name: str):
    rows = jxa.run("Kontakte", SUCHEN, name) or []
    for r in rows:
        r["telefon"] = [f"{_clean(l)}: {v}" for l, v in r["telefon"]]
    return rows


def tools(cfg, secrets) -> list[Tool]:
    return [Tool("geburtstage", "Geburtstage der nächsten Tage aus den Kontakten.", "kontakte.lesen",
                 geburtstage, {"tage": {"type": "integer", "description": "Zeitraum in Tagen, Standard 14"}}),
            Tool("kontakte_suchen", "Kontakt nach Name/Firma suchen (Mail, Telefon, Adresse, Geburtstag).",
                 "kontakte.lesen", suchen, {"name": S("Name oder Firma")}, ["name"]),
            Tool("kontakt_anlegen",
                 "Neuen Kontakt in Apple Kontakte anlegen (wird vom Nutzer bestätigt). Vorher mit 'kontakte_suchen' "
                 "prüfen, ob es ihn schon gibt.", "kontakte.aendern",
                 lambda **k: anlegen(k),
                 {"vorname": S("Vorname"), "nachname": S("Nachname"), "firma": S("Firma"), "position": S("Funktion"),
                  "emails": {"type": "array", "items": {"type": "string"}},
                  "telefone": {"type": "array", "items": {"type": "object", "properties": {
                      "art": S("work, mobile, home oder fax"), "nummer": S("Nummer")}}},
                  "webseite": S("Webseite"), "strasse": S("Straße und Hausnummer"), "plz": S("PLZ"), "ort": S("Ort"),
                  "land": S("Land"), "notiz": S("Notiz")}, [],
                 label=lambda a: "Kontakt anlegen: " + (" ".join(x for x in (a.get("vorname"), a.get("nachname")) if x)
                                                         or a.get("firma") or "?")),
            Tool("kontakt_aendern",
                 "Bestehenden Kontakt ändern (wird vom Nutzer bestätigt): Namen, Firma, Funktion, Geburtstag, Notiz setzen; "
                 "Telefonnummern/E-Mails hinzufügen oder entfernen; Adresse hinzufügen. 'kontakt' = Name oder id aus "
                 "'kontakte_suchen'. Nur angegebene Felder werden geändert.", "kontakte.aendern", aendern,
                 {"kontakt": S("Name oder id"), "vorname": S("neuer Vorname"), "nachname": S("neuer Nachname"),
                  "firma": S("Firma"), "position": S("Funktion"), "geburtstag": S("JJJJ-MM-TT"), "notiz": S("Notiz (ersetzt)"),
                  "telefon_hinzu": {"type": "array", "items": {"type": "object", "properties": {
                      "nummer": S("Nummer"), "art": S("mobile, work, home oder iPhone")}}},
                  "telefon_entfernen": {"type": "array", "items": {"type": "string"}},
                  "mail_hinzu": {"type": "array", "items": {"type": "string"}},
                  "mail_entfernen": {"type": "array", "items": {"type": "string"}},
                  "adresse_hinzu": {"type": "object", "properties": {"strasse": S("Straße"), "plz": S("PLZ"),
                                                                    "ort": S("Ort"), "land": S("Land"),
                                                                    "art": S("home oder work")}}},
                 ["kontakt"], label=_aendern_label)]


# ---------------------------------------------------------------- Kontakt ändern
AENDERN = r"""
function run(argv){
  const app=Application('Contacts'); const d=JSON.parse(argv[1]);
  const p=app.people.byId(argv[0]); const name=p.name(); const ziff=(s)=>String(s||'').replace(/\D/g,'').slice(-9);
  if (d.vorname!==undefined) p.firstName=d.vorname;
  if (d.nachname!==undefined) p.lastName=d.nachname;
  if (d.firma!==undefined) p.organization=d.firma;
  if (d.position!==undefined) p.jobTitle=d.position;
  if (d.notiz!==undefined) p.note=d.notiz;
  if (d.geburtstag) p.birthDate=new Date(d.geburtstag+'T12:00:00');
  for (const n of (d.telefon_entfernen||[])) for (const t of p.phones()) if (ziff(t.value())===ziff(n)) app.delete(t);
  for (const m of (d.mail_entfernen||[])) for (const e of p.emails()) if (e.value().toLowerCase()===String(m).toLowerCase()) app.delete(e);
  for (const t of (d.telefon_hinzu||[])) p.phones.push(app.Phone({label:t.art||'mobile', value:t.nummer}));
  for (const m of (d.mail_hinzu||[])) p.emails.push(app.Email({label:'home', value:m}));
  if (d.adresse_hinzu) { const a=d.adresse_hinzu;
    p.addresses.push(app.Address({label:a.art||'home', street:a.strasse||'', zip:a.plz||'', city:a.ort||'', country:a.land||''})); }
  app.save();
  return JSON.stringify({geaendert:name, jetzt:p.name(), telefon:p.phones.value(), emails:p.emails.value()});
}"""

FELDER = ("vorname", "nachname", "firma", "position", "geburtstag", "notiz", "telefon_hinzu", "telefon_entfernen",
          "mail_hinzu", "mail_entfernen", "adresse_hinzu")


def _aendern_label(a: dict) -> str:
    teile = []
    for k in FELDER:
        v = a.get(k)
        if not v:
            continue
        if k == "telefon_hinzu":
            teile.append("+ Tel " + ", ".join(str(t.get("nummer")) for t in v if isinstance(t, dict)))
        elif k == "adresse_hinzu" and isinstance(v, dict):
            teile.append("+ Adresse " + " ".join(str(v.get(x) or "") for x in ("strasse", "plz", "ort")).strip())
        elif isinstance(v, list):
            teile.append(f"{k.replace('_', ' ')}: {', '.join(map(str, v))}")
        else:
            teile.append(f"{k} → {v}")
    return f"Kontakt „{a.get('kontakt')}“ ändern: " + ("; ".join(teile) or "nichts")


def finden(kontakt: str) -> dict:
    """Name oder id → genau ein Kontakt (sonst verständlicher Fehler)."""
    from atlas.tools import ToolError
    if ":ABPerson" in kontakt:
        return {"id": kontakt, "name": kontakt}
    treffer = suchen(kontakt)
    exakt = [t for t in treffer if t["name"].lower() == kontakt.lower()]
    if len(exakt) == 1 or len(treffer) == 1:
        return (exakt or treffer)[0]
    if not treffer:
        raise ToolError(f"Kein Kontakt „{kontakt}“ gefunden")
    raise ToolError("Mehrere Kontakte passen: " + "; ".join(f"{t['name']} (id {t['id']})" for t in treffer[:6])
                    + " – bitte genauer angeben.")


def aendern(kontakt: str, **felder) -> dict:
    import json
    from atlas.tools import ToolError
    d = {k: v for k, v in felder.items() if k in FELDER and v not in (None, "", [], {})}
    if not d:
        raise ToolError("Keine Änderung angegeben")
    k = finden(kontakt)
    return jxa.run("Kontakte", AENDERN, k["id"], json.dumps(d, ensure_ascii=False))


# ---------------------------------------------------------------- Neue Kontakte (z. B. aus einer Visitenkarte)
ANLEGEN = r"""
function run(argv){
  const app=Application('Contacts'); const k=JSON.parse(argv[0]);
  const props={}; if(k.vorname) props.firstName=k.vorname; if(k.nachname) props.lastName=k.nachname;
  if(k.firma) props.organization=k.firma; if(k.position) props.jobTitle=k.position;
  if(k.abteilung) props.department=k.abteilung; if(k.notiz) props.note=k.notiz;
  const p=app.Person(props); app.people.push(p);
  (k.emails||[]).forEach((e,i)=>{ p.emails.push(app.Email({label:i? 'other':'work', value:e})); });
  (k.telefone||[]).forEach((t)=>{ p.phones.push(app.Phone({label:t.art==='fax'?'work fax':(t.art||'work'), value:t.nummer})); });
  if(k.webseite){ try{ p.urls.push(app.Url({label:'homepage', value:k.webseite})); }catch(e){} }
  if(k.strasse||k.ort){ p.addresses.push(app.Address({label:'work', street:k.strasse||'', zip:k.plz||'', city:k.ort||'', country:k.land||''})); }
  app.save();
  return JSON.stringify({angelegt:p.name(), id:p.id()});
}"""

E_MAIL = re.compile(r"[\w.+-]+@[\w-]+(?:\.[\w-]+)+")
TELEFON = re.compile(r"(?:(?:tel|telefon|fon|phone|mobil|mobile|handy|cell|fax|t|m|f)\.?\s*[:.]?\s*)?(\+?\d[\d\s/().-]{6,}\d)", re.I)
WEB = re.compile(r"\b(?:https?://)?(?:www\.)[\w-]+(?:\.[\w-]+)+(?:/\S*)?", re.I)
PLZ_ORT = re.compile(r"\b(\d{5})\s+([A-ZÄÖÜ][\wäöüß .-]{1,40})")


def _art(zeile: str) -> str:
    z = zeile.lower()
    return "fax" if "fax" in z else "mobile" if re.search(r"mobil|handy|cell|\bm\b", z) else "work"


def aus_text(text: str, lokal=None) -> dict:
    """Kontaktdaten aus OCR-Text: Mail, Telefon, Webseite, Adresse per Regeln; Name, Firma und Funktion
    mit dem lokalen Modell (geprüft gegen den Text)."""
    from atlas import hilfen
    zeilen = [z.strip() for z in (text or "").splitlines() if z.strip()]
    k = {"vorname": "", "nachname": "", "firma": "", "position": "", "abteilung": "", "emails": [], "telefone": [],
         "webseite": "", "strasse": "", "plz": "", "ort": "", "land": "", "notiz": ""}
    k["emails"] = list(dict.fromkeys(m.lower() for m in E_MAIL.findall(text or "")))[:3]
    for z in zeilen:
        if E_MAIL.search(z):
            continue
        for m in TELEFON.finditer(z):
            nummer = re.sub(r"[^\d+-]", " ", m.group(1)).strip()
            nummer = re.sub(r"\s+", " ", nummer)
            if len(re.sub(r"\D", "", nummer)) >= 7 and not PLZ_ORT.fullmatch(m.group(1).strip()):
                if not any(t["nummer"].replace(" ", "") == nummer.replace(" ", "") for t in k["telefone"]):
                    k["telefone"].append({"art": _art(z), "nummer": nummer})
    w = WEB.search(text or "")
    k["webseite"] = w.group(0) if w else ""
    for i, z in enumerate(zeilen):
        m = PLZ_ORT.search(z)
        if m and not TELEFON.fullmatch(z):
            k["plz"], k["ort"] = m.group(1), m.group(2).strip()
            vorher = zeilen[i - 1] if i else ""
            if re.search(r"(str\.|straße|strasse|weg|platz|allee|ring|gasse|damm|\d+\s*[a-z]?$)", vorher, re.I):
                k["strasse"] = vorher
            break
    j = hilfen.lokal_json(
        lokal, "Du liest Visitenkarten und Signaturen aus. Antworte nur mit JSON, erfinde nichts.",
        'Antworte nur mit JSON: {"vorname": "", "nachname": "", "firma": "", "position": "", "abteilung": ""}'
        "\n\nText der Karte:\n" + "\n".join(zeilen)[:2500], 200) or {}
    flach = re.sub(r"\s+", " ", text or "").lower()
    for f in ("vorname", "nachname", "firma", "position", "abteilung"):
        v = str(j.get(f) or "").strip()
        if v and v.lower()[:12] in flach:
            k[f] = v[:80]
    if not k["firma"]:                                  # Ersatz: Zeile mit Rechtsform
        f = next((z for z in zeilen if re.search(r"\b(GmbH|mbH|AG|KG|OHG|GbR|UG|e\.\s?V\.|SE|Ltd|Inc|LLC|Praxis|Kanzlei)\b", z)), "")
        k["firma"] = f[:80]
    if not (k["vorname"] or k["nachname"]):            # Ersatz: erste Zeile mit zwei großgeschriebenen Wörtern
        for z in zeilen[:6]:
            m = re.fullmatch(r"(?:(?:Dr|Prof|Dipl)\.[\w.-]*\s+)*([A-ZÄÖÜ][a-zäöüß-]+)\s+([A-ZÄÖÜ][a-zäöüß-]+)", z)
            if m:
                k["vorname"], k["nachname"] = m.group(1), m.group(2)
                break
    return k


def anlegen(kontakt: dict) -> dict:
    import json
    k = {kk: v for kk, v in (kontakt or {}).items() if v}
    if not (k.get("vorname") or k.get("nachname") or k.get("firma")):
        from atlas.tools import ToolError
        raise ToolError("Name oder Firma fehlt")
    if isinstance(k.get("emails"), str):
        k["emails"] = [e.strip() for e in k["emails"].split(",") if e.strip()]
    if isinstance(k.get("telefone"), str):
        k["telefone"] = [{"art": "work", "nummer": t.strip()} for t in k["telefone"].split(",") if t.strip()]
    return jxa.run("Kontakte", ANLEGEN, json.dumps(k, ensure_ascii=False))


def vorhanden(k: dict) -> list[str]:
    """Gibt es den Kontakt schon? (Name oder E-Mail)"""
    treffer = []
    name = " ".join(x for x in (k.get("vorname"), k.get("nachname")) if x).strip()
    for q in [name] + list(k.get("emails") or [])[:1]:
        if not q:
            continue
        try:
            for r in suchen(q.split("@")[0] if "@" in q else q)[:3]:
                if name and r["name"].lower() == name.lower() or q in (r.get("emails") or []):
                    treffer.append(r["name"])
        except Exception:
            pass
    return sorted(set(treffer))
