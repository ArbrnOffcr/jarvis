"""Apple Notizen."""
import html

from atlas.tools import S, Tool, jxa

SUCHEN = r"""
function run(argv){
  const app=Application('Notes'); const q=argv[0];
  let ns;
  try { ns=app.notes.whose({_or:[{name:{_contains:q}},{plaintext:{_contains:q}}]}); ns.id(); }
  catch(e){ ns=app.notes.whose({name:{_contains:q}}); }
  const ids=ns.id(), names=ns.name(), mod=ns.modificationDate(); const out=[];
  for(let i=0;i<Math.min(ids.length,25);i++) out.push({id:ids[i], titel:names[i], geaendert:mod[i].toISOString().slice(0,10)});
  return JSON.stringify(out);
}"""

LESEN = r"""
function run(argv){ const n=Application('Notes').notes.byId(argv[0]);
  return JSON.stringify({titel:n.name(), text:n.plaintext().slice(0,12000),
                         geaendert:n.modificationDate().toISOString().slice(0,10)}); }"""

ANLEGEN = r"""
function run(argv){
  const app=Application('Notes'); const [body,ordner]=argv; const acc=app.defaultAccount();
  let f;
  if(ordner){ f=acc.folders.byName(ordner);
    try { f.name(); } catch(e){ acc.folders.push(app.Folder({name:ordner})); f=acc.folders.byName(ordner); } }
  else { f=acc.defaultFolder(); }
  const n=app.Note({body:body}); f.notes.push(n);
  return JSON.stringify({angelegt:true, ordner:f.name()});
}"""

ERGAENZEN = r"""
function run(argv){ const n=Application('Notes').notes.byId(argv[0]);
  n.body = n.body() + argv[1]; return JSON.stringify({ergaenzt:n.name()}); }"""


def _html(text: str) -> str:
    return "".join(f"<div>{html.escape(line) or '<br>'}</div>" for line in text.split("\n"))


def tools(cfg, secrets) -> list[Tool]:
    return [
        Tool("notizen_suchen", "Notizen nach Begriff in Titel oder Text durchsuchen.",
             "notizen.lesen", lambda suchbegriff: jxa.run("Notizen", SUCHEN, suchbegriff),
             {"suchbegriff": S("Suchbegriff")}, ["suchbegriff"]),
        Tool("notiz_lesen", "Volltext einer Notiz (per id) lesen.", "notizen.lesen",
             lambda id: jxa.run("Notizen", LESEN, id), {"id": S("Kennung aus notizen_suchen")}, ["id"]),
        Tool("notiz_anlegen", "Neue Notiz anlegen.", "notizen.anlegen",
             lambda titel, text, ordner="": jxa.run(
                 "Notizen", ANLEGEN, f"<div><h1>{html.escape(titel)}</h1></div>" + _html(text), ordner),
             {"titel": S("Titel"), "text": S("Inhalt"), "ordner": S("Ordner, optional")},
             ["titel", "text"], label=lambda a: f"Notiz „{a['titel']}“ anlegen"),
        Tool("notiz_ergaenzen", "Text an bestehende Notiz (per id) anhängen.", "notizen.aendern",
             lambda id, text: jxa.run("Notizen", ERGAENZEN, id, _html(text)),
             {"id": S("Kennung aus notizen_suchen"), "text": S("Anzuhängender Text")},
             ["id", "text"], label=lambda a: "Notiz ergänzen"),
    ]
