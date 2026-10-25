"""Einkaufsliste in Apple Erinnerungen (Liste „Einkäufe“, in der Konfiguration änderbar).

„Setz Milch und Eier auf die Einkaufsliste“ → zwei Einträge, ohne Rückfrage, ohne Doppelte.
„Was muss ich einkaufen?“ → kurze Aufzählung der offenen Einträge."""
import json

from atlas.tools import Tool, ToolError, jxa

_LISTE = r"""
function liste(app, name, anlegen){
  const n=name.toLowerCase();
  for (const l of app.lists()) if (l.name().toLowerCase()===n) return l;
  if (!anlegen) return null;
  const l=app.List({name:name}); app.lists.push(l);
  return app.lists.byName(name);
}"""

HINZU = _LISTE + r"""
function run(argv){
  const app=Application('Reminders'); const l=liste(app, argv[0], true);
  const neu=JSON.parse(argv[1]);
  const offen=l.reminders.whose({completed:false}).name().map(x=>x.toLowerCase().trim());
  const ok=[], schon=[];
  for (const a of neu){
    if (offen.includes(a.toLowerCase())) { schon.push(a); continue; }
    l.reminders.push(app.Reminder({name:a})); offen.push(a.toLowerCase()); ok.push(a);
  }
  return JSON.stringify({liste:l.name(), hinzugefuegt:ok, schon_drauf:schon});
}"""

LESEN = _LISTE + r"""
function run(argv){
  const app=Application('Reminders'); const l=liste(app, argv[0], false);
  if (!l) return JSON.stringify({liste:argv[0], artikel:[], hinweis:'Liste gibt es noch nicht'});
  const rs=l.reminders.whose({completed:false});
  const namen=rs.name(), notiz=rs.body();
  return JSON.stringify({liste:l.name(), artikel:namen.map((n,i)=>notiz[i]? n+' ('+notiz[i]+')' : n)});
}"""

ABHAKEN = _LISTE + r"""
function run(argv){
  const app=Application('Reminders'); const l=liste(app, argv[0], false);
  if (!l) return JSON.stringify({abgehakt:[], nicht_gefunden:JSON.parse(argv[1])});
  const weg=JSON.parse(argv[1]).map(x=>x.toLowerCase().trim()); const ok=[], fehlt=[];
  const rs=l.reminders.whose({completed:false})();
  for (const w of weg){
    const r=rs.find(x=>x.name().toLowerCase().trim()===w) || rs.find(x=>x.name().toLowerCase().includes(w));
    if (r && !r.completed()) { r.completed=true; ok.push(r.name()); } else fehlt.push(w);
  }
  return JSON.stringify({abgehakt:ok, nicht_gefunden:fehlt});
}"""


def _artikel(artikel) -> list[str]:
    if isinstance(artikel, str):
        artikel = [artikel]
    out = []
    for a in artikel or []:
        a = " ".join(str(a).split()).strip(" .,;")
        if a:
            out.append(a[:1].upper() + a[1:])
    if not out:
        raise ToolError("Kein Artikel genannt")
    return out[:30]


def tools(cfg, secrets) -> list[Tool]:
    name = (cfg.get("einkauf") or {}).get("liste") or "Einkäufe"
    return [
        Tool("einkauf_hinzufuegen",
             f"Artikel auf die Einkaufsliste setzen (Apple Erinnerungen, Liste „{name}“). Ohne Rückfrage; "
             "jeden Artikel einzeln, Menge gehört zum Artikel (z. B. '2 Liter Milch'). Doppelte werden übersprungen.",
             "erinnerungen.schreiben",
             lambda artikel: jxa.run("Erinnerungen", HINZU, name, json.dumps(_artikel(artikel), ensure_ascii=False)),
             {"artikel": {"type": "array", "items": {"type": "string"}, "description": "Artikel, z. B. ['Milch', '6 Eier']"}},
             ["artikel"], label=lambda a: "Einkaufsliste: " + ", ".join(_artikel(a.get("artikel")))),
        Tool("einkaufsliste",
             f"Offene Einträge der Einkaufsliste (Liste „{name}“). Antwort kurz: nur die Artikel aufzählen.",
             "erinnerungen.lesen", lambda: jxa.run("Erinnerungen", LESEN, name)),
        Tool("einkauf_erledigt",
             f"Artikel auf der Einkaufsliste („{name}“) abhaken, z. B. wenn der Nutzer sie gekauft hat.",
             "erinnerungen.schreiben",
             lambda artikel: jxa.run("Erinnerungen", ABHAKEN, name, json.dumps(_artikel(artikel), ensure_ascii=False)),
             {"artikel": {"type": "array", "items": {"type": "string"}}}, ["artikel"],
             label=lambda a: "Abgehakt: " + ", ".join(_artikel(a.get("artikel")))),
    ]
