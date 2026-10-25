"""Apple Erinnerungen (Aufgaben, Einkaufslisten)."""
from atlas.tools import S, Tool, jxa
from atlas.tools.zeit import parse
import datetime as dt

OFFEN = r"""
function run(argv){
  const app=Application('Reminders'); const want=(argv[0]||'').toLowerCase(); const out=[];
  for (const l of app.lists()){
    const n=l.name(); if(want && n.toLowerCase()!==want) continue;
    const rs=l.reminders.whose({completed:false});
    const ids=rs.id(), names=rs.name(), due=rs.dueDate(), body=rs.body(), prio=rs.priority();
    for(let i=0;i<ids.length;i++) out.push({id:ids[i], titel:names[i], liste:n,
      faellig: due[i]? due[i].toISOString():null, notiz: body[i]||null, prioritaet: prio[i]});
  }
  return JSON.stringify(out);
}"""

LISTEN = r"""
function run(){ const app=Application('Reminders');
  return JSON.stringify({listen: app.lists.name(), standard: app.defaultList().name()}); }"""

ANLEGEN = r"""
function run(argv){
  const app=Application('Reminders'); const [titel,liste,faellig,notiz]=argv;
  const l = liste ? app.lists.byName(liste) : app.defaultList();
  const props={name:titel}; if(notiz) props.body=notiz; if(faellig) props.dueDate=new Date(faellig);
  const r=app.Reminder(props); l.reminders.push(r);
  return JSON.stringify({angelegt:titel, liste:l.name()});
}"""

ERLEDIGT = r"""
function run(argv){
  const app=Application('Reminders'); const r=app.reminders.byId(argv[0]);
  r.completed=true; return JSON.stringify({erledigt:r.name()});
}"""


def _local_iso(s: str) -> str:
    """Für JavaScript: Ortszeit ohne Zonenangabe ('2026-10-20T09:00')."""
    if not s:
        return ""
    d = parse(s)
    if not isinstance(d, dt.datetime):
        d = dt.datetime.combine(d, dt.time(9, 0))
    return d.strftime("%Y-%m-%dT%H:%M")


def tools(cfg, secrets) -> list[Tool]:
    return [
        Tool("erinnerungen_listen", "Listen der Erinnerungen-App und die Standardliste.",
             "erinnerungen.lesen", lambda: jxa.run("Erinnerungen", LISTEN)),
        Tool("erinnerungen_offen", "Offene Erinnerungen/Aufgaben, optional nur einer Liste.",
             "erinnerungen.lesen", lambda liste="": jxa.run("Erinnerungen", OFFEN, liste),
             {"liste": S("Listenname, optional")}),
        Tool("erinnerung_anlegen", "Neue Erinnerung anlegen.", "erinnerungen.schreiben",
             lambda titel, liste="", faellig="", notiz="":
                 jxa.run("Erinnerungen", ANLEGEN, titel, liste, _local_iso(faellig), notiz),
             {"titel": S("Text der Erinnerung"), "liste": S("Liste, optional (sonst Standardliste)"),
              "faellig": S("Fälligkeit JJJJ-MM-TT oder JJJJ-MM-TTTHH:MM, optional"),
              "notiz": S("Notiz, optional")}, ["titel"],
             label=lambda a: f"Erinnerung „{a['titel']}“ anlegen"),
        Tool("erinnerung_erledigt", "Erinnerung (per id) als erledigt markieren.",
             "erinnerungen.schreiben", lambda id: jxa.run("Erinnerungen", ERLEDIGT, id),
             {"id": S("Kennung aus erinnerungen_offen")}, ["id"],
             label=lambda a: "Erinnerung abhaken"),
    ]
