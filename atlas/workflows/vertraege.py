"""Haushaltsbuch light: Verträge, Versicherungen und Abos mit ihren laufenden Kosten.

Erkannt werden Beiträge aus Briefen (Beitragsrechnung, Beitragsanpassung, Vertragsbestätigung …) und
was der Nutzer im Chat nennt. JARVIS meldet Änderungen sofort (z. B. Beitragserhöhung) und gibt am
Monatsanfang einen Überblick: Summe je Monat, Änderungen, bald kündbare Verträge."""
import re
import threading
import uuid
from datetime import date, datetime

from atlas.paths import read_private_json, write_private_json
from atlas.tools import S, Tool, ToolError
from atlas.workflows.beihilfe_parser import BETRAG, betrag as lese_betrag

ZUSTAND = "vertraege.json"
INTERVALLE = {"monatlich": 1, "vierteljährlich": 3, "halbjährlich": 6, "jährlich": 12}
SIGNAL = re.compile(r"beitrag|prämie|tarif|abonnement|\babo\b|mitgliedschaft|vertragsbestätigung|vertragsnummer|"
                    r"versicherungsschein|police|abschlag|grundgebühr|monatlich|jährlich", re.I)


def _norm(s: str) -> str:
    return re.sub(r"[^a-z0-9äöüß]", "", (s or "").lower())


def intervall_aus(text: str) -> str:
    t = (text or "").lower()
    for wort, name in (("monatlich", "monatlich"), ("pro monat", "monatlich"), ("je monat", "monatlich"),
                       ("vierteljährlich", "vierteljährlich"), ("quartal", "vierteljährlich"),
                       ("halbjährlich", "halbjährlich"), ("jährlich", "jährlich"), ("jahresbeitrag", "jährlich"),
                       ("pro jahr", "jährlich")):
        if wort in t:
            return name
    return ""


def erkennen(text: str) -> dict | None:
    """Wiederkehrenden Beitrag in einem Brief finden: Betrag in der Nähe von Beitrag/Prämie + Intervall."""
    if not SIGNAL.search(text or ""):
        return None
    flach = re.sub(r"\s+", " ", text)
    treffer = [m for m in re.finditer(rf"(neue[rn]?\s+|bisherige[rn]?\s+)?(?:beitrag|prämie|monatsbeitrag|jahresbeitrag|"
                                      rf"abschlag|grundgebühr|zahlbetrag)[^.€\d]{{0,60}}?({BETRAG})", flach, re.I)]
    treffer = [m for m in treffer if not re.search(r"bisher", flach[max(0, m.start() - 25):m.start(2)], re.I)]
    if not treffer:
        return None
    m = next((x for x in treffer if x.group(1) and x.group(1).lower().startswith("neu")), treffer[-1])
    iv = intervall_aus(flach[max(0, m.start() - 80):m.end() + 80]) or intervall_aus(flach)
    if not iv:
        return None
    alt = re.search(rf"(?:bisher(?:iger)?\s+beitrag|bisher)[^.€\d]{{0,40}}?({BETRAG})", flach, re.I)
    return {"betrag": lese_betrag(m.group(2)), "intervall": iv,
            "bisher": lese_betrag(alt.group(1)) if alt else None,
            "erhoehung": bool(re.search(r"beitragsanpassung|beitragserhöhung|erhöh|anpassung\s+ihres\s+beitrags", flach, re.I))}


class Vertraege:
    def __init__(self, core):
        self.c = core
        self.lock = threading.Lock()

    def zustand(self) -> dict:
        z = read_private_json(ZUSTAND, {})
        z.setdefault("liste", []); z.setdefault("gemeldet", "")
        return z

    def speichern(self, z: dict) -> None:
        write_private_json(ZUSTAND, z)

    @staticmethod
    def monatlich(v: dict) -> float:
        return round((v.get("betrag") or 0) / INTERVALLE.get(v.get("intervall"), 1), 2)

    def eintragen(self, anbieter: str, betrag: str, intervall: str = "monatlich", art: str = "",
                  kuendbar_zum: str = "", notiz: str = "", quelle: str = "chat") -> dict:
        if isinstance(betrag, (int, float)):
            b = round(float(betrag), 2)
        else:
            t = str(betrag).strip()
            if "," not in t and re.fullmatch(r"\d+(\.\d{1,2})?", t):
                t = f"{float(t):.2f}".replace(".", ",")
            b = lese_betrag(t)
        if not b:
            raise ToolError("Betrag nicht lesbar")
        iv = intervall if intervall in INTERVALLE else (intervall_aus(intervall) or "monatlich")
        anbieter = (anbieter or "").strip()[:60]
        if not anbieter:
            raise ToolError("Anbieter fehlt")
        with self.lock:
            z = self.zustand()
            v = next((x for x in z["liste"] if _norm(x["anbieter"]) == _norm(anbieter) and not x.get("beendet")
                      and (not art or not x.get("art") or _norm(x["art"]) == _norm(art))), None)
            aenderung = None
            if v:
                if abs((v["betrag"] or 0) - b) > 0.009 or v["intervall"] != iv:
                    aenderung = {"von": v["betrag"], "von_intervall": v["intervall"], "zu": b, "zu_intervall": iv,
                                 "datum": date.today().isoformat(), "quelle": quelle}
                    v.setdefault("verlauf", []).append(aenderung)
                v.update({"betrag": b, "intervall": iv, "stand": date.today().isoformat()})
                if kuendbar_zum:
                    v["kuendbar_zum"] = kuendbar_zum
                if art:
                    v["art"] = art
            else:
                v = {"id": uuid.uuid4().hex[:8], "anbieter": anbieter, "art": art[:40], "betrag": b, "intervall": iv,
                     "kuendbar_zum": kuendbar_zum, "notiz": notiz[:200], "quelle": quelle,
                     "seit": date.today().isoformat(), "stand": date.today().isoformat(), "verlauf": []}
                z["liste"].append(v)
            self.speichern(z)
        if kuendbar_zum:
            try:
                self.c.fristen.eintragen(f"{anbieter} kündbar", kuendbar_zum, "Vertrag", quelle="Verträge")
            except Exception:
                pass
        return {**v, "monatlich": self.monatlich(v), **({"aenderung": aenderung} if aenderung else {})}

    def aus_brief(self, absender: str, text: str, quelle: str) -> str:
        """Vom Posteingang aufgerufen: Beitrag erkannt → eintragen und Änderung melden."""
        e = erkennen(text)
        if not e or not absender:
            return ""
        r = self.eintragen(absender, e["betrag"], e["intervall"], quelle=quelle)
        a = r.get("aenderung")
        euro = lambda x: f"{x:,.2f} €".replace(",", "X").replace(".", ",").replace("X", ".")
        if a and a["von"] is not None:
            richtung = "erhöht" if a["zu"] > a["von"] else "gesenkt"
            return (f"{absender}: Beitrag {richtung} von {euro(a['von'])} auf {euro(a['zu'])} ({a['zu_intervall']}).")
        if e.get("erhoehung") and e.get("bisher"):
            return f"{absender}: Beitrag steigt von {euro(e['bisher'])} auf {euro(e['betrag'])} ({e['intervall']})."
        return f"{absender}: {euro(e['betrag'])} {e['intervall']} im Haushaltsbuch vermerkt."

    def beenden(self, vertrag: str) -> dict:
        with self.lock:
            z = self.zustand()
            v = next((x for x in z["liste"] if x["id"] == vertrag), None) or \
                next((x for x in z["liste"] if not x.get("beendet") and _norm(vertrag) in _norm(x["anbieter"])), None)
            if not v:
                raise ToolError("Vertrag nicht gefunden")
            v["beendet"] = date.today().isoformat()
            self.speichern(z)
        return {"beendet": v["anbieter"]}

    def uebersicht(self) -> dict:
        aktiv = [v for v in self.zustand()["liste"] if not v.get("beendet")]
        heute = date.today()
        zeilen = sorted(({"anbieter": v["anbieter"], "art": v.get("art", ""), "betrag": v["betrag"],
                          "intervall": v["intervall"], "monatlich": self.monatlich(v),
                          "kuendbar_zum": v.get("kuendbar_zum", ""), "seit": v.get("seit"),
                          "letzte_aenderung": (v.get("verlauf") or [None])[-1]} for v in aktiv),
                        key=lambda x: -x["monatlich"])
        k = lambda v: f"{v or 0:.2f} €".replace(".", ",")
        aenderungen = [f"{x['anbieter']}: {k(x['letzte_aenderung']['von'])} → {k(x['letzte_aenderung']['zu'])}"
                       for x in zeilen if x["letzte_aenderung"] and
                       (heute - date.fromisoformat(x["letzte_aenderung"]["datum"])).days <= 62]
        return {"vertraege": zeilen, "summe_monat": round(sum(x["monatlich"] for x in zeilen), 2),
                "summe_jahr": round(sum(x["monatlich"] for x in zeilen) * 12, 2), "aenderungen": aenderungen}

    def monatsbericht(self) -> str:
        """Am Monatsanfang einmal fürs Briefing."""
        z = self.zustand()
        monat = date.today().strftime("%Y-%m")
        if date.today().day > 7 or z.get("gemeldet") == monat or not z["liste"]:
            return ""
        u = self.uebersicht()
        z["gemeldet"] = monat
        self.speichern(z)
        euro = lambda x: f"{x:,.0f} €".replace(",", ".")
        teuer = ", ".join(f"{x['anbieter']} ({euro(x['monatlich'])})" for x in u["vertraege"][:3])
        txt = f"Haushaltsbuch: {len(u['vertraege'])} laufende Verträge, zusammen {euro(u['summe_monat'])} im Monat. Größte Posten: {teuer}."
        if u["aenderungen"]:
            txt += " Geändert: " + "; ".join(u["aenderungen"][:3]) + "."
        bald = [x["anbieter"] for x in u["vertraege"] if x["kuendbar_zum"]][:3]
        if bald:
            txt += " Kündbar demnächst: " + ", ".join(bald) + "."
        return txt


def tools(core) -> list[Tool]:
    v = core.vertraege
    return [
        Tool("vertraege_uebersicht",
             "Haushaltsbuch: laufende Verträge, Versicherungen und Abos mit Kosten je Monat/Jahr, Änderungen, Kündbarkeit.",
             "steuer.lesen", v.uebersicht),
        Tool("vertrag_eintragen",
             "Vertrag/Abo/Versicherung mit Beitrag ins Haushaltsbuch eintragen oder Beitrag aktualisieren.",
             "steuer.schreiben", v.eintragen,
             {"anbieter": S("Anbieter, z. B. 'HUK-COBURG'"), "betrag": S("Beitrag, z. B. '12,90'"),
              "intervall": S("Intervall", enum=list(INTERVALLE)), "art": S("Art, z. B. 'Hausrat', 'Streaming'"),
              "kuendbar_zum": S("nächster Kündigungstermin JJJJ-MM-TT, optional"), "notiz": S("optional")},
             ["anbieter", "betrag"], label=lambda a: f"Haushaltsbuch: {a.get('anbieter')} {a.get('betrag')} €"),
        Tool("vertrag_beendet", "Vertrag/Abo im Haushaltsbuch als beendet markieren (id oder Anbieter).",
             "steuer.schreiben", v.beenden, {"vertrag": S("id oder Anbieter")}, ["vertrag"]),
    ]
