"""Reaktionszeit messen: Wie lange brauchen Spracherkennung, Modell und Werkzeuge? (aus dem lokalen Protokoll –
nur Zeiten, nie Inhalte).  jarvis reaktionszeit [Tage]"""
from __future__ import annotations

import json
import statistics
from datetime import date, timedelta
from pathlib import Path

from atlas.paths import LOCAL_DIR


def _median(werte: list[float]) -> float | None:
    return round(statistics.median(werte), 2) if werte else None


def _p90(werte: list[float]) -> float | None:
    if not werte:
        return None
    s = sorted(werte)
    return round(s[min(len(s) - 1, int(len(s) * 0.9))], 2)


def auswerten(dateien: list[Path]) -> dict:
    stt, stt_weg, faktor = [], {}, []
    such, wege_suche, kurz = {}, {}, {"aufrufe": 0, "lokal": 0, "treffer_einzeln": 0}
    wplan = {}
    gespraech, mit_werkzeug, wz = [], [], {}
    unterbrochen = 0
    for f in dateien:
        try:
            zeilen = f.read_text(encoding="utf-8").splitlines()
        except OSError:
            continue
        for z in zeilen:
            try:
                e = json.loads(z)
            except ValueError:
                continue
            if e.get("event") == "sprache" and e.get("s_erkennung") is not None:
                stt.append(e["s_erkennung"])
                stt_weg[e.get("weg") or "alt"] = stt_weg.get(e.get("weg") or "alt", 0) + 1
                if e.get("s_audio"):
                    faktor.append(e["s_erkennung"] / max(e["s_audio"], 0.1))
            elif e.get("event") == "werkzeug" and isinstance(e.get("teile"), dict):
                for k, v in e["teile"].items():
                    if isinstance(v, (int, float)):
                        such.setdefault(k, []).append(v)
                    elif k == "weg":
                        wege_suche[v] = wege_suche.get(v, 0) + 1
            elif e.get("event") == "wochenplan" and isinstance(e.get("teile"), dict):
                for k, v in e["teile"].items():
                    wplan.setdefault(k, []).append(v)
            elif e.get("event") == "datenschutz" and e.get("ziel") == "claude":
                kurz["aufrufe"] += 1
                kurz["lokal"] += int(e.get("lokal_zusammengefasst") or 0)
                kurz["treffer_einzeln"] += int(e.get("felder_zurueck") or 0)
            elif e.get("event") == "chat" and e.get("s_erstes_wort") is not None and e.get("stimme"):
                if e.get("unterbrochen"):
                    unterbrochen += 1
                if e.get("grund") == "Fortsetzung":
                    continue
                aufgabe = bool(e.get("s_werkzeuge")) or str(e.get("grund") or "").startswith("Werkzeug")
                (mit_werkzeug if aufgabe else gespraech).append(e["s_erstes_wort"])
                for n, s in (e.get("werkzeug_zeiten") or {}).items():
                    wz.setdefault(n, []).append(s)
    return {"erkennung": {"n": len(stt), "median": _median(stt), "p90": _p90(stt), "wege": stt_weg,
                          "je_sekunde_ton": _median(faktor)},
            "gespraech_erstes_wort": {"n": len(gespraech), "median": _median(gespraech), "p90": _p90(gespraech)},
            "mit_werkzeug_erstes_wort": {"n": len(mit_werkzeug), "median": _median(mit_werkzeug), "p90": _p90(mit_werkzeug)},
            "werkzeuge": {n: {"n": len(v), "median": _median(v), "max": round(max(v), 2)}
                          for n, v in sorted(wz.items(), key=lambda kv: -statistics.median(kv[1]))[:12]},
            "suche_teile": {k: _median(v) for k, v in such.items()}, "suche_wege": wege_suche, "wochenplan_teile": {k: _median(v) for k, v in wplan.items()}, "datenschutz": kurz,
            "unterbrochen": unterbrochen}


def befehl(args: list[str]) -> None:
    from rich.console import Console
    from rich.table import Table
    tage = int(args[0]) if args and args[0].isdigit() else 3
    ab = (date.today() - timedelta(days=tage - 1)).isoformat()
    dateien = [f for f in sorted((LOCAL_DIR / "audit").glob("*.jsonl")) if f.name[:10] >= ab]
    r = auswerten(dateien)
    c = Console()
    t = Table(title=f"◢ REAKTIONSZEIT – letzte {tage} Tage ◣", border_style="cyan")
    for kopf in ("Abschnitt", "Anzahl", "typisch (Median)", "langsam (9 von 10 schneller)"):
        t.add_column(kopf)
    sek = lambda x: "–" if x is None else f"{x:.1f} s".replace(".", ",")
    e = r["erkennung"]
    t.add_row("Spracherkennung", str(e["n"]), sek(e["median"]), sek(e["p90"]))
    g = r["gespraech_erstes_wort"]
    t.add_row("Gespräch: bis zum ersten Wort", str(g["n"]), sek(g["median"]), sek(g["p90"]))
    w = r["mit_werkzeug_erstes_wort"]
    t.add_row("Mit Werkzeugen: bis zum ersten Wort", str(w["n"]), sek(w["median"]), sek(w["p90"]))
    c.print(t)
    if e["wege"]:
        c.print("Erkennungsweg: " + ", ".join(f"{k} {v}×" for k, v in e["wege"].items())
                + "  (schnell = ein Durchgang; standard = Rückfall)")
    if r["werkzeuge"]:
        c.print("Langsamste Werkzeuge: " + " · ".join(f"{n} {sek(v['median'])} (max {sek(v['max'])})"
                                                       for n, v in r["werkzeuge"].items()))
    if r["suche_teile"]:
        c.print("Archivsuche, typische Dauer je Abschnitt: " + " · ".join(
            f"{k} {int(v)}" if k == "stuecke" else f"Treue {v:.3f}".replace(".", ",") if k == "treue" else f"{k} {sek(v)}" for k, v in r["suche_teile"].items())
            + ("  ·  Weg: " + ", ".join(f"{k} {v}×" for k, v in r["suche_wege"].items()) if r["suche_wege"] else ""))
    if r["wochenplan_teile"]:
        c.print("Wochenplan, Dauer je Quelle (laufen gleichzeitig): " + " · ".join(
            f"{k} {sek(v)}" for k, v in r["wochenplan_teile"].items()))
    d = r["datenschutz"]
    if d["aufrufe"]:
        c.print(f"Datenschutz: {d['lokal']}× lokale Kurzfassung (langsam), {d['treffer_einzeln']}× Treffer ohne Wartezeit entschärft")
    if r["unterbrochen"]:
        c.print(f"Abgebrochene Antworten (Dazwischenreden/Stopp): {r['unterbrochen']}")
