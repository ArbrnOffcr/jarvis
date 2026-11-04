"""HESTIA Profi-Dashboard: Portfolio vieler Mietobjekte mit Wohneinheiten und Investoren-Kennzahlen.

Rechenweg wie im Kalkulationstool (Cockpit) – je Objekt:
  Bewirtschaftung nicht umlagefähig = Verwaltung/sonstige (nicht_umlagefaehig_jahr/12)
                                      + eigene Instandhaltungsrücklage (m² × €/m² p.a. / 12)
                                      + kalkulatorischer Mietausfall (% der Warmmiete)
  Cashflow operativ   = Kaltmiete (Ist) − Bewirtschaftung n. u. − Kapitaldienst (Zins + Tilgung)
                        (die Nebenkostenvorauszahlung deckt die umlagefähigen Kosten und fällt heraus)
  AfA                 = ((Kaufpreis + Kaufnebenkosten) × Gebäudeanteil + aktivierte Investitionen) × AfA-Satz
  zu versteuern       = Kaltmiete − Verwaltung/sonstige − Zinsen − AfA   (Rücklage, Mietausfall: steuerlich nicht absetzbar)
  Cashflow n. Steuern = Cashflow operativ − zu versteuern × Grenzsteuersatz   (negativ versteuert = Erstattung)
  Vermögenszuwachs    = Tilgung + Cashflow n. Steuern (+ Wertsteigerung)   je Jahr
Mieterhöhung je Einheit: Vergleichsmiete § 558 BGB frühestens 15 Monate nach Einzug/letzter Erhöhung wirksam
(Verlangen 3 Monate vorher), Kappungsgrenze 20 % (15 %) in 3 Jahren; Indexmiete § 557b frühestens 12 Monate nach
der letzten Änderung; Staffelmiete: nächste vereinbarte Staffel.
Keine Rechts- oder Steuerberatung – Annahmen stehen in den Einstellungen."""
from __future__ import annotations

import secrets
from datetime import date

from atlas.immobilien import _datum, _monate, _plus_monate, _zahl

PROFI = {"aktiv": False, "grenzsteuersatz": 42.0, "horizont": 10, "mietsteigerung": 2.0, "wertsteigerung": 2.0,
         "kostensteigerung": 2.0, "instandhaltung_qm": 8.0, "mietausfall": 2.0, "afa_satz": 2.0, "gebaeudeanteil": 75.0}
OBJEKT_PROFI = ("afa_satz", "gebaeudeanteil", "investitionen", "instandhaltung_qm", "mietausfall", "marktfaktor")
STATUS = ("vermietet", "vakant", "renovierung", "eigennutzung")
MIETART = ("vergleichsmiete", "staffelmiete", "indexmiete")


def r(x, n=0):
    return None if x is None else round(x, n) if n else round(x)


# ------------------------------------------------------------------ Bereinigen
def einheiten_bereinigen(liste) -> list[dict]:
    out = []
    for e in (liste or [])[:80]:
        t = lambda k, n=80: str(e.get(k) or "").strip()[:n]
        m, mi = e.get("mieter") or {}, e.get("miete") or {}
        status = t("status", 20) if t("status", 20) in STATUS else "vermietet"
        staffeln = []
        for s in (e.get("staffeln") or [])[:20]:
            d, k = _datum(s.get("datum")), _zahl(s.get("kalt"))
            if d and k:
                staffeln.append({"datum": d.isoformat(), "kalt": k})
        out.append({"id": t("id", 20) or "we-" + secrets.token_hex(3), "name": t("name", 40) or f"WE {len(out) + 1}",
                    "etage": t("etage", 20), "flaeche": _zahl(e.get("flaeche")), "zimmer": _zahl(e.get("zimmer")),
                    "status": status, "frei_seit": t("frei_seit", 10),
                    "mieter": {"name": str(m.get("name") or "").strip()[:80], "seit": str(m.get("seit") or "")[:10],
                               "mietart": m.get("mietart") if m.get("mietart") in MIETART else "vergleichsmiete",
                               "kaution": _zahl(m.get("kaution"))},
                    "miete": {"kalt": _zahl(mi.get("kalt")), "nk": _zahl(mi.get("nk")),
                              "letzte_erhoehung": str(mi.get("letzte_erhoehung") or "")[:10]},
                    "marktmiete_qm": _zahl(e.get("marktmiete_qm")),
                    "staffeln": sorted(staffeln, key=lambda s: s["datum"])})
    return out


def objekt_profi_bereinigen(p) -> dict:
    p = p or {}
    return {k: _zahl(p.get(k)) for k in OBJEKT_PROFI}


def einheiten(o: dict) -> list[dict]:
    """Wohneinheiten – ohne Eintrag gilt das Objekt als eine Einheit (Mieter und Miete aus den Objektdaten)."""
    if o.get("einheiten"):
        return o["einheiten"]
    mi, m = o.get("miete") or {}, o.get("mieter") or {}
    return [{"id": "we-haupt", "name": o.get("name") or "Wohnung", "etage": "", "flaeche": o.get("wohnflaeche"),
             "zimmer": None, "status": "vermietet" if mi.get("kalt") else "vakant", "frei_seit": "",
             "mieter": {"name": m.get("name", ""), "seit": m.get("seit", ""), "mietart": m.get("mietart") or "vergleichsmiete",
                        "kaution": m.get("kaution")},
             "miete": {"kalt": mi.get("kalt"), "nk": mi.get("nk"), "letzte_erhoehung": mi.get("letzte_erhoehung", "")},
             "marktmiete_qm": None, "staffeln": [], "virtuell": True}]


# ------------------------------------------------------------------ Darlehen
def _darlehen_lauf(dl: dict, start_rest: float, monate: int) -> tuple[float, float, float]:
    """Restschuld nach n Monaten sowie Summe Zinsen und Tilgung dieser Monate (Annuität)."""
    rest, zs, tg = start_rest, 0.0, 0.0
    z = (dl.get("zins") or 0) / 100 / 12
    rate = dl.get("rate") or 0
    for _ in range(max(0, monate)):
        if rest <= 0:
            break
        zi = rest * z
        t = min(rest, max(0.0, rate - zi))
        rest -= t
        zs += zi
        tg += t
    return rest, zs, tg


def _volltilgung(dl: dict, rest: float, heute: date) -> int | None:
    z, rate = (dl.get("zins") or 0) / 100 / 12, dl.get("rate") or 0
    if not rest or rate <= rest * z:
        return None
    n = 0
    while rest > 0 and n < 1200:
        rest -= rate - rest * z
        n += 1
    return _plus_monate(heute, n).year


# ------------------------------------------------------------------ Mieterhöhung je Einheit
def naechste_erhoehung(e: dict, kappung: float, heute: date) -> dict:
    mi, m = e.get("miete") or {}, e.get("mieter") or {}
    kalt = mi.get("kalt")
    if e.get("status") != "vermietet" or not kalt:
        return {"art": "", "ab": None, "stand": "keine", "text": "nicht vermietet"}
    art = m.get("mietart") or "vergleichsmiete"
    basis = _datum(mi.get("letzte_erhoehung")) or _datum(m.get("seit"))
    out = {"art": art, "ab": None, "ankuendigen_ab": None, "max_kalt": None, "potenzial": None}
    if art == "staffelmiete":
        n = next((s for s in e.get("staffeln") or [] if _datum(s["datum"]) > heute), None)
        if not n:
            return {**out, "stand": "keine", "text": "keine weitere Staffel eingetragen"}
        out.update(ab=n["datum"], max_kalt=n["kalt"], potenzial=r(n["kalt"] - kalt))
    elif not basis:
        return {**out, "stand": "unbekannt", "text": "Einzug/letzte Erhöhung fehlt"}
    elif art == "indexmiete":
        ab = _plus_monate(basis, 12)
        out.update(ab=ab.isoformat(), ankuendigen_ab=_plus_monate(ab, -2).isoformat())
    else:
        ab = _plus_monate(basis, 15)
        mx = kalt * (1 + kappung / 100)
        markt = (e.get("marktmiete_qm") or 0) * (e.get("flaeche") or 0)
        ziel = min(mx, markt) if markt else mx
        out.update(ab=ab.isoformat(), ankuendigen_ab=_plus_monate(ab, -3).isoformat(), max_kalt=r(ziel),
                   potenzial=r(max(0.0, ziel - kalt)), bis_marktmiete=bool(markt))
    ab = _datum(out["ab"])
    out["stand"] = "jetzt" if ab <= heute else "bald" if ab <= _plus_monate(heute, 3) else "spaeter"
    out["monate"] = max(0, _monate(heute, ab))
    return out


# ------------------------------------------------------------------ Objekt
def objekt(o: dict, g: dict, p: dict, grenzen: dict, heute: date | None = None) -> dict:
    heute = heute or date.today()
    op = {**{k: p.get(k) for k in ("afa_satz", "gebaeudeanteil", "instandhaltung_qm", "mietausfall")},
          **{k: v for k, v in (o.get("profi") or {}).items() if v is not None}}
    we = einheiten(o)
    fl_ges = sum(e.get("flaeche") or 0 for e in we) or (o.get("wohnflaeche") or 0)
    ist_kalt = sum((e["miete"].get("kalt") or 0) for e in we if e["status"] == "vermietet")
    ist_nk = sum((e["miete"].get("nk") or 0) for e in we if e["status"] == "vermietet")

    def soll(e):
        if e["status"] == "vermietet":
            return e["miete"].get("kalt") or 0
        if e["status"] == "eigennutzung":
            return 0
        return (e.get("marktmiete_qm") or 0) * (e.get("flaeche") or 0) or (e["miete"].get("kalt") or 0)
    soll_kalt = sum(soll(e) for e in we)
    vermietbar = [e for e in we if e["status"] != "eigennutzung"]
    leer = [e for e in vermietbar if e["status"] in ("vakant", "renovierung")]
    fl_vermietbar = sum(e.get("flaeche") or 0 for e in vermietbar)
    leer_fl = sum(e.get("flaeche") or 0 for e in leer)
    leerstand = (leer_fl / fl_vermietbar * 100) if fl_vermietbar else (len(leer) / len(vermietbar) * 100 if vermietbar else 0)

    kp, knk, inv = o.get("kaufpreis"), o.get("kaufnebenkosten") or 0, op.get("investitionen") or 0
    gesamt_inv = (kp or 0) + knk + inv
    basis_nu = (o.get("nicht_umlagefaehig_jahr") or 0) / 12
    ruecklage = fl_ges * (op.get("instandhaltung_qm") or 0) / 12
    ausfall = (ist_kalt + ist_nk) * (op.get("mietausfall") or 0) / 100
    bewirt_nu = basis_nu + ruecklage + ausfall

    dls = o.get("darlehen") or []
    from atlas.immobilien import Immobilien
    rest_je = [Immobilien._restschuld(x, heute) or 0 for x in dls]
    rest = sum(rest_je)
    rate = sum(x.get("rate") or 0 for x in dls)
    zinsen = sum(rj * (x.get("zins") or 0) / 100 / 12 for x, rj in zip(dls, rest_je))
    tilgung = max(0.0, rate - zinsen)
    betrag = sum(x.get("betrag") or 0 for x in dls)
    zins_gew = (sum(rj * (x.get("zins") or 0) for x, rj in zip(dls, rest_je)) / rest) if rest else None

    afa = (((kp or 0) + knk) * (op.get("gebaeudeanteil") or 0) / 100 + inv) * (op.get("afa_satz") or 0) / 100 / 12
    cf_op = ist_kalt - bewirt_nu - rate
    zu_verst = ist_kalt - basis_nu - zinsen - afa
    steuer = zu_verst * g["grenzsteuersatz"] / 100
    cf_ns = cf_op - steuer
    wert = o.get("marktwert") or kp or 0
    jk = ist_kalt * 12
    wert_faktor = jk * op["marktfaktor"] if op.get("marktfaktor") and jk else None
    ek = gesamt_inv - betrag if kp else None
    zuwachs = (tilgung + cf_ns) * 12
    zuwachs_wert = zuwachs + wert * g["wertsteigerung"] / 100

    # Hochrechnung Jahr für Jahr (Miete, Kosten, Wert wachsen; Darlehen tilgen)
    reihe, kum, be, kum_pos = [], 0.0, None, None
    rest_j = list(rest_je)
    for j in range(0, int(g["horizont"]) + 1):
        f_m, f_k, f_w = (1 + g["mietsteigerung"] / 100) ** j, (1 + g["kostensteigerung"] / 100) ** j, (1 + g["wertsteigerung"] / 100) ** j
        z_j = t_j = 0.0
        neu = []
        for x, rj in zip(dls, rest_j):
            rn, zs, tg = _darlehen_lauf(x, rj, 12)
            neu.append(rn)
            z_j += zs
            t_j += tg
        kalt_j = ist_kalt * f_m
        nu_j = (basis_nu + ruecklage) * f_k + ausfall * f_m
        cf_op_j = kalt_j * 12 - nu_j * 12 - z_j - t_j
        st_j = (kalt_j * 12 - basis_nu * f_k * 12 - z_j - afa * 12) * g["grenzsteuersatz"] / 100
        cf_ns_j = cf_op_j - st_j
        kum += cf_ns_j
        rest_j = neu
        jahr = heute.year + j
        if be is None and cf_ns_j >= 0:
            be = jahr
        if kum_pos is None and kum >= 0:
            kum_pos = jahr
        reihe.append({"jahr": jahr, "wert": r(wert * f_w), "restschuld": r(sum(neu)), "cf_op_monat": r(cf_op_j / 12),
                      "cf_ns_monat": r(cf_ns_j / 12), "kumuliert": r(kum)})

    kappung = grenzen.get("kappung", 20)
    einh = []
    for e in we:
        anteil = ((e.get("flaeche") or 0) / fl_ges) if fl_ges and e.get("flaeche") else 1 / len(we)
        kalt = (e["miete"].get("kalt") or 0) if e["status"] == "vermietet" else 0
        nk = (e["miete"].get("nk") or 0) if e["status"] == "vermietet" else 0
        kosten = (basis_nu + rate) * anteil + (e.get("flaeche") or fl_ges * anteil) * (op.get("instandhaltung_qm") or 0) / 12 \
            + (kalt + nk) * (op.get("mietausfall") or 0) / 100
        cf_e = kalt - kosten
        cf_e_ns = cf_e - steuer * anteil
        einh.append({**{k: e.get(k) for k in ("id", "name", "etage", "flaeche", "zimmer", "status", "frei_seit",
                                              "marktmiete_qm", "staffeln", "virtuell")},
                     "mieter": e.get("mieter"), "miete": e.get("miete"),
                     "kalt_qm": r(kalt / e["flaeche"], 2) if kalt and e.get("flaeche") else None,
                     "anteil": r(anteil * 100, 1), "cf_op": r(cf_e), "cf_ns": r(cf_e_ns),
                     "erhoehung": naechste_erhoehung(e, kappung, heute)})

    k = {"einheiten_anzahl": len(we), "vermietet": sum(1 for e in we if e["status"] == "vermietet"),
         "vakant": sum(1 for e in we if e["status"] == "vakant"), "renovierung": sum(1 for e in we if e["status"] == "renovierung"),
         "eigennutzung": sum(1 for e in we if e["status"] == "eigennutzung"),
         "flaeche": r(fl_ges, 1), "leerstand": r(leerstand, 1),
         "ist_kalt": r(ist_kalt), "soll_kalt": r(soll_kalt), "ist_nk": r(ist_nk), "warm": r(ist_kalt + ist_nk),
         "kalt_qm": r(ist_kalt / fl_ges, 2) if fl_ges and ist_kalt else None,
         "faktor": r(kp / jk, 1) if kp and jk else None,
         "brutto": r(jk / kp * 100, 2) if kp and jk else None,
         "netto": r((jk - bewirt_nu * 12) / gesamt_inv * 100, 2) if gesamt_inv and jk else None,
         "bewirt_nu": r(bewirt_nu), "ruecklage": r(ruecklage), "mietausfall": r(ausfall), "verwaltung": r(basis_nu),
         "kapitaldienst": r(rate), "zinsen": r(zinsen), "tilgung": r(tilgung), "zins_gewichtet": r(zins_gew, 2),
         "afa": r(afa), "zu_versteuern": r(zu_verst), "steuer": r(steuer),
         "cf_op": r(cf_op), "cf_ns": r(cf_ns),
         "restschuld": r(rest), "wert": r(wert), "wert_faktor": r(wert_faktor), "netto_vermoegen": r(wert - rest),
         "beleihung": r(rest / wert * 100, 1) if wert and dls else None,
         "dscr": r(jk / (rate * 12), 2) if jk and rate else None,
         "eigenkapital": r(ek), "zuwachs": r(zuwachs), "zuwachs_mit_wert": r(zuwachs_wert),
         "ek_rendite": r(zuwachs_wert / ek * 100, 1) if ek and ek > 0 else None,
         "break_even": be, "kum_positiv": kum_pos, "gesamtinvestition": r(gesamt_inv),
         "volltilgung": max([v for v in (_volltilgung(x, rj, heute) for x, rj in zip(dls, rest_je)) if v] or [None]) if dls else None,
         "zinsbindung": [{"bank": x.get("bank") or "Darlehen", "bis": x.get("zinsbindung_bis"),
                          "monate": _monate(heute, _datum(x["zinsbindung_bis"])) if _datum(x.get("zinsbindung_bis")) else None}
                         for x in dls]}
    return {"id": o["id"], "name": o.get("name") or o.get("adresse"), "adresse": o.get("adresse"), "art": o.get("art"),
            "baujahr": o.get("baujahr"), "kaufpreis": kp, "kaufnebenkosten": knk, "kaufdatum": o.get("kaufdatum"),
            "marktwert": o.get("marktwert"), "nicht_umlagefaehig_jahr": o.get("nicht_umlagefaehig_jahr"),
            "bild": (o.get("bilder") or {}).get("haupt", ""), "profi": {**objekt_profi_bereinigen(o.get("profi")), "wirksam": op},
            "kennzahlen": k, "einheiten": einh, "reihe": reihe}


# ------------------------------------------------------------------ Portfolio
def portfolio(objekte: list[dict], g: dict, grenzen: dict, heute: date | None = None) -> dict:
    heute = heute or date.today()
    obs = [objekt(o, g, g, grenzen, heute) for o in objekte]
    s = lambda k: sum((x["kennzahlen"].get(k) or 0) for x in obs)
    kp = sum(x["kaufpreis"] or 0 for x in obs)
    ist = s("ist_kalt")
    wert, rest = s("wert"), s("restschuld")
    jahre = {}
    for x in obs:
        for z in x["reihe"]:
            j = jahre.setdefault(z["jahr"], {"jahr": z["jahr"], "wert": 0, "restschuld": 0, "cf_ns_monat": 0, "kumuliert": 0})
            for k in ("wert", "restschuld", "cf_ns_monat", "kumuliert"):
                j[k] += z[k] or 0
    reihe = [jahre[j] for j in sorted(jahre)]
    summe = {"objekte": len(obs), "einheiten": s("einheiten_anzahl"), "vermietet": s("vermietet"), "vakant": s("vakant"),
             "renovierung": s("renovierung"), "eigennutzung": s("eigennutzung"), "flaeche": r(s("flaeche"), 1),
             "ist_kalt": r(ist), "soll_kalt": r(s("soll_kalt")), "leerstand_euro": r(s("soll_kalt") - ist),
             "cf_op": r(s("cf_op")), "cf_ns": r(s("cf_ns")), "kapitaldienst": r(s("kapitaldienst")),
             "restschuld": r(rest), "wert": r(wert), "netto_vermoegen": r(wert - rest),
             "beleihung": r(rest / wert * 100, 1) if wert and rest else None,
             "brutto": r(ist * 12 / kp * 100, 2) if kp and ist else None, "faktor": r(kp / (ist * 12), 1) if kp and ist else None,
             "dscr": r(ist * 12 / (s("kapitaldienst") * 12), 2) if ist and s("kapitaldienst") else None,
             "zuwachs": r(s("zuwachs")), "zuwachs_mit_wert": r(s("zuwachs_mit_wert")),
             "leerstand": r(sum((x["kennzahlen"]["leerstand"] or 0) * (x["kennzahlen"]["flaeche"] or 0) for x in obs)
                            / s("flaeche"), 1) if s("flaeche") else None,
             "break_even": next((z["jahr"] for z in reihe if z["cf_ns_monat"] >= 0), None)}
    # Handlungsbedarf
    hin = []
    for x in obs:
        k = x["kennzahlen"]
        for e in x["einheiten"]:
            if e["status"] in ("vakant", "renovierung"):
                hin.append({"art": "leer", "stufe": "kritisch", "objekt": x["name"], "id": x["id"],
                            "text": f"{e['name']}: {'vakant' if e['status'] == 'vakant' else 'in Renovierung'}"
                                    + (f" seit {_datum(e['frei_seit']).strftime('%m/%Y')}" if _datum(e.get("frei_seit")) else "")})
            er = e["erhoehung"]
            if er.get("stand") == "jetzt":
                hin.append({"art": "erhoehung", "stufe": "gut", "objekt": x["name"], "id": x["id"],
                            "text": f"{e['name']}: Mieterhöhung jetzt möglich" + (f" (bis +{er['potenzial']} €)" if er.get("potenzial") else "")})
        for zb in k["zinsbindung"]:
            if zb["monate"] is not None and 0 <= zb["monate"] <= 24:
                hin.append({"art": "zins", "stufe": "warnung", "objekt": x["name"], "id": x["id"],
                            "text": f"Zinsbindung {zb['bank']} endet in {zb['monate']} Monaten"})
        if k["cf_ns"] is not None and k["cf_ns"] < 0:
            hin.append({"art": "cashflow", "stufe": "warnung", "objekt": x["name"], "id": x["id"],
                        "text": f"Cashflow nach Steuern negativ ({k['cf_ns']} €/Monat)"})
    rang = {"kritisch": 0, "warnung": 1, "gut": 2}
    hin.sort(key=lambda h: rang[h["stufe"]])
    return {"stand": heute.isoformat(), "annahmen": g, "summe": summe, "objekte": obs, "reihe": reihe, "hinweise": hin}
