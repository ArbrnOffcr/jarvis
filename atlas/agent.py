"""Kopfloser Agent: dieselbe Logik wie im Dashboard (Router, Werkzeuge,
Rechteprüfung), aber ohne Oberfläche – für Telegram, Morgenbriefing und
Hinweise. Läuft synchron in einem eigenen Thread."""
import json
from typing import Callable

from atlas.permissions import Level
from atlas.persona import system_prompt
from atlas.providers import ProviderError
from atlas.tools import ToolError

MAX_STEPS = 8


def run(core, text: str, history: list[dict] | None = None, *,
        confirm: Callable[[str], bool] | None = None,
        notify: Callable[[str], None] | None = None,
        hinweis: str = "", nur_lesen: bool = False, quelle: str = "agent") -> str:
    """Eine Anfrage vollständig beantworten. confirm=None heißt: alles, was
    eine Bestätigung bräuchte, wird abgelehnt."""
    c = core
    lokal, claude = c.providers["lokal"], c.providers["claude"]
    local_ok, cloud_ok = lokal.available(), claude.available()
    d = c.router.decide(text, "auto", False, local_ok, cloud_ok)
    if d.target == "claude" and d.ask_cloud:
        if not (confirm and confirm("Diese Anfrage enthält sensible Inhalte. Darf ich sie an Claude übermitteln?")):
            if not local_ok:
                return "Abgebrochen – lokales Modell nicht verfügbar."
            d.target, d.alias = "lokal", None
    k = c.costs()
    if d.target == "claude" and k["budget"] and k["kosten"] >= k["budget"] and local_ok:
        d.target, d.alias = "lokal", None
    provider = c.providers[d.target]
    model = provider.resolve_model(d.alias)
    from atlas import werkzeugwahl
    alle = c.stab.filtern(list(c.tools.values())) if hasattr(c, "stab") else list(c.tools.values())
    gruppen = None
    if (d.target == "lokal" or d.alias == "haiku") and c.cfg.get("werkzeugwahl", True):
        gruppen = werkzeugwahl.gruppen_fuer(" ".join([*(m.get("content", "") for m in (history or [])[-2:]
                                                         if isinstance(m.get("content"), str)), text]))
    tools = alle if gruppen is None else werkzeugwahl.auswahl(c.tools, gruppen)
    if hasattr(c, "stab") and gruppen is not None:
        tools = c.stab.filtern(tools)
    system = system_prompt(c.cfg["assistant_name"], c.name, d.target, True, c.memory.digest())
    if gruppen is not None:
        system += werkzeugwahl.hinweis(gruppen)
    if hinweis:
        system += "\n\n" + hinweis
    max_tokens = c.cfg["claude" if d.target == "claude" else "local"]["max_tokens"]
    if d.target == "claude" and hasattr(c, "stab"):           # Schnellweg: Lagefragen sofort an den Stab
        vorab = c.stab.schnellweg(text, nur_lesen, quelle)
        if vorab:
            system += c.stab.vorab_hinweis(vorab)
            tools = werkzeugwahl.auswahl(c.tools, set())
    work = [*(history or []), {"role": "user", "content": text}]
    reply, t_in, t_out = "", 0, 0
    for _ in range(MAX_STEPS):
        result = None
        for ev in provider.step(model, system, list(work), tools, max_tokens):
            if ev[0] == "text":
                reply += ev[1]
            else:
                result = ev[1]
        t_in += result.usage[0]
        t_out += result.usage[1]
        if result.pause:
            work.append(result.assistant_msg)
            continue
        if not result.tool_calls:
            break
        outs = []
        normale = [cl for cl in result.tool_calls if cl.name != werkzeugwahl.LADEN]
        vorweg = {}
        if len(normale) > 1 and all(cl.name in c.tools and c.gate.level(c.tools[cl.name].action) < Level.BESTAETIGEN
                                    for cl in normale):       # mehrere Leseabfragen gleichzeitig
            from concurrent.futures import ThreadPoolExecutor
            with ThreadPoolExecutor(max_workers=len(normale)) as tp:
                vorweg = dict(zip([id(cl) for cl in normale],
                                  tp.map(lambda cl: _tool(c, cl, confirm, notify, nur_lesen), normale)))
        for call in result.tool_calls:
            if call.name == werkzeugwahl.LADEN:
                tools = alle
                outs.append((call, "Alle Werkzeuge stehen jetzt zur Verfügung."))
            else:
                outs.append((call, vorweg[id(call)] if id(call) in vorweg else _tool(c, call, confirm, notify, nur_lesen)))
        if (d.target == "claude" and any(cl.name == "stab_einsatz" for cl in result.tool_calls)
                and c.stab.einstellungen().get("vortrag_modell") == "sonnet"
                and "sonnet" not in model and "opus" not in model):
            try:
                model = provider.resolve_model("sonnet")
            except ProviderError:
                pass
        work += [result.assistant_msg, *provider.tool_results(outs)]
        if reply and not reply.endswith("\n"):
            reply += "\n"
    key = f"claude:{c.family(model)}" if d.target == "claude" else "lokal"
    c.audit.add_usage(key, t_in, t_out)
    c.audit.log("chat", ziel=d.target, modell=model, grund=d.reason, quelle=quelle,
                tokens_in=t_in, tokens_out=t_out)
    if history is not None:
        history += [{"role": "user", "content": text},
                    {"role": "assistant", "content": reply.strip() or "(erledigt)"}]
        del history[:-20]
    return reply.strip()


def _tool(c, call, confirm, notify, nur_lesen) -> str:
    tool = c.tools.get(call.name)
    if not tool:
        return f"Fehler: unbekanntes Werkzeug {call.name}"
    lvl = c.gate.level(tool.action)
    what = tool.describe(call.args)
    if nur_lesen and lvl > Level.FREI:
        return "Verweigert: in diesem Modus sind nur lesende Werkzeuge erlaubt."
    if lvl == Level.VERBOTEN:
        c.audit.log("werkzeug_verweigert", werkzeug=call.name, aktion=tool.action)
        return f"Verweigert: '{tool.action}' ist gesperrt (Rechte oder Not-Aus)."
    if lvl == Level.BESTAETIGEN:
        ok = bool(confirm and confirm(f"{what}?"))
        c.audit.log("bestaetigung", aktion=tool.action, was=what, erteilt=ok)
        if not ok:
            return "Vom Nutzer abgelehnt oder keine Bestätigung möglich. Nicht erneut versuchen."
    try:
        out, ok = json.dumps(tool.func(**call.args), ensure_ascii=False, default=str), True
    except ToolError as e:
        out, ok = f"Fehler: {e}", False
    except Exception as e:
        out, ok = f"Fehler: {type(e).__name__}: {e}", False
    c.audit.log("werkzeug", werkzeug=call.name, aktion=tool.action, erfolg=ok)
    if ok and lvl == Level.MELDEN and notify:
        notify(f"✓ {what}")
    from atlas.hilfen import vs_schutz
    return vs_schutz(call.name, out)[:12000]
