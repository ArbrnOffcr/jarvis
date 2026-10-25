"""Auslesen von Arztrechnungen, Beihilfebescheiden (BVA) und uniVersa-Leistungsabrechnungen.
Alles lokal: zuerst feste Regeln (bekannte Formate), für Lücken das lokale Sprachmodell.
Diagnosen werden nie übernommen."""
import json
import re
from datetime import date, datetime, timedelta

BETRAG = r"(?<![\d,.])\d{1,3}(?:\.\d{3})*,\d{2}(?![\d,])"   # nicht „2,30“ aus Faktor „2,300“
DATUM = r"\d{2}\.\d{2}\.\d{4}"
BIC_RE = re.compile(r"[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}(?:[A-Z0-9]{3})?")
IBAN_RE = re.compile(r"\b([A-Z]{2}\d{2}(?:\s?[A-Z0-9]{4}){3,7}(?:\s?[A-Z0-9]{1,3})?)\b")


def entsperren(text: str) -> str:
    """OCR-Sperrschrift wie '2 3 . 0 5 . 2 0 2 5' oder 'S u m m e' zusammenziehen."""
    def zus(m):
        return m.group(0).replace(" ", "")
    text = re.sub(r"(?<![\w])(?:[\w.,:/()-] ){2,}[\w.,:/()-](?![\w])", zus, text)
    return text


def betrag(s: str) -> float | None:
    m = re.search(BETRAG, s or "")
    return round(float(m.group(0).replace(".", "").replace(",", ".")), 2) if m else None


def datum(s: str) -> date | None:
    m = re.search(r"(\d{1,2})\.(\d{1,2})\.(\d{2,4})", s or "")
    if not m:
        return None
    d, mo, y = map(int, m.groups())
    y = y + 2000 if y < 100 else y
    try:
        return date(y, mo, d)
    except ValueError:
        return None


def iban_ok(iban: str) -> bool:
    s = re.sub(r"\s", "", iban).upper()
    if not re.fullmatch(r"[A-Z]{2}\d{2}[A-Z0-9]{11,30}", s):
        return False
    n = "".join(str(int(c, 36)) for c in s[4:] + s[:4])
    return int(n) % 97 == 1


def norm_nr(s: str) -> str:
    """Rechnungsnummern vergleichbar machen (Bindestrich-Varianten, Schrägstriche, Leerzeichen)."""
    return re.sub(r"[\s\-–—/_.]", "", (s or "")).upper()


# ------------------------------------------------------------------ Rechnung
LABELS = {
    "nummer": r"rechnungs?[\s.-]*n(?:umme)?r\.?|re\.?[\s-]*nr\.?",
    "betrag": r"(?:offener\s+)?re(?:chnungs)?\.?[\s-]*betrag|rechnungsbetrag|gesamtbetrag|endbetrag|zu\s+zahlen(?:der\s+betrag)?|offener\s+betrag|summe\s+gesamt|zu\s+liquidieren",
    "datum": r"rechnungsdatum|datum\s+der\s+rechnung|rechnung\s+vom",
    "ziel": r"zahlungstermin|zahlungsziel|fällig\s+(?:am|bis)|zahlbar\s+bis|fälligkeit",
    "empfaenger": r"begünstigter|empfänger|kontoinhaber|zahlungsempfänger",
    "iban": r"iban",
    "bic": r"bic|swift",
    "zweck": r"verwendungszweck",
}


def _label_von(zeile: str) -> str | None:
    z = zeile.strip().rstrip(":").strip().lower()
    for key, pat in LABELS.items():
        if re.fullmatch(rf"(?:{pat})\s*:?", z):
            return key
    return None


def rechnung_regeln(text: str) -> dict:
    """Bekannte Layouts: 'Label: Wert' in einer Zeile oder ein Block Labels gefolgt von einem
    Block Werte (z. B. PVS-Rechnungen)."""
    zeilen = [z.strip() for z in text.splitlines() if z.strip()]
    f: dict = {}
    i = 0
    while i < len(zeilen):
        z = zeilen[i]
        m = re.match(r"^([^:]{3,40}):\s*(.+)$", z)            # 'Label: Wert'
        if m and _label_von(m.group(1)) and _label_von(m.group(1)) not in f:
            f[_label_von(m.group(1))] = m.group(2).strip()
            i += 1
            continue
        if _label_von(z):                                    # Label-Block
            block = []
            while i < len(zeilen) and _label_von(zeilen[i]):
                block.append(_label_von(zeilen[i]))
                i += 1
            werte = zeilen[i:i + len(block)]
            for k, w in zip(block, werte):
                if k not in f and not _label_von(w):
                    f[k] = w
            i += len(block)
            continue
        i += 1
    out = {"betrag": betrag(f.get("betrag", "")), "datum": datum(f.get("datum", "")),
           "ziel": datum(f.get("ziel", "")), "nummer": (f.get("nummer") or "").strip(),
           "empfaenger": (f.get("empfaenger") or "").strip()[:80],
           "iban": None, "bic": (f.get("bic") or "").replace(" ", "")[:11] or None,
           "zweck": (f.get("zweck") or "").strip()[:80]}
    # IBAN: bevorzugt der beschriftete Wert, sonst die erste gültige IBAN im Text
    for kand in [f.get("iban", "")] + [m.group(1) for m in IBAN_RE.finditer(text)]:
        if kand and iban_ok(kand):
            s = re.sub(r"\s", "", kand).upper()
            out["iban"] = " ".join(s[i:i + 4] for i in range(0, len(s), 4))
            break
    # Rechnungsdatum: 'Datum: 15.08.2025' oder 'Rechnung … vom 15.08.2025'
    if not out["datum"]:
        m = re.search(r"rechnung\S*\s+(?:nr\.?\s*)?\S*\s*vom\s+(\d{1,2}\.\d{1,2}\.\d{2,4})", text, re.I) or \
            re.search(r"(?:^|\n)\s*datum:?\s+(\d{1,2}\.\d{1,2}\.\d{2,4})", text, re.I)
        if m:
            out["datum"] = datum(m.group(1))
    # Betrag ohne Beschriftung: 'Erhaltener Betrag: 280,00 €' oder größter mehrfach genannter Betrag
    if not out["betrag"]:
        m = re.search(rf"(?:erhaltener\s+betrag|endsumme(?:\s+zu\s*zahlen)?(?:\s+eur)?|gesamt(?:summe|betrag)?|betrag\s+eur)\s*:?\s*({BETRAG})", text, re.I)
        if m:
            out["betrag"] = betrag(m.group(1))
        else:
            alle = [betrag(x) for x in re.findall(BETRAG, text)]
            mehrfach = [b for b in set(alle) if alle.count(b) >= 2 and b > 0]
            if mehrfach:
                out["betrag"] = max(mehrfach)
                out["betrag_unsicher"] = True
    # Bereits bezahlt (Apotheke, Kartenzahlung)?
    out["bezahlt"] = bool(re.search(r"kartenzahlung|ec-karte|girocard|bar\s*bezahlt|barzahlung|betrag\s+dankend\s+erhalten", text, re.I))
    # Zahlungsziel aus Fließtext: 'bitte überweisen … bis zum 25.10.2026' oder 'innerhalb von 30 Tagen'
    if not out["ziel"]:
        m = re.search(rf"(?:überweis|zahl|begleich)[^.\n]{{0,120}}?bis\s+(?:zum\s+|spätestens\s+)?({DATUM})", text, re.I)
        if m:
            out["ziel"] = datum(m.group(1))
        else:
            m = re.search(r"innerhalb\s+(?:von\s+)?(\d{1,3})\s+tagen", text, re.I)
            if m and out["datum"]:
                out["ziel"] = out["datum"] + timedelta(days=int(m.group(1)))
    m = re.search(r"behandlungszeitraum:?\s*(\d{1,2}\.\d{1,2}\.\d{2,4})", text, re.I) or \
        re.search(r"am\s+(\d{2}\.\d{2}\.\d{4})\s+erfolgte\s+behandlung", text, re.I)
    out["behandlung"] = datum(m.group(1)) if m else None
    return out


def rechnung_lokal_llm(text: str, lokal) -> dict:
    """Lücken mit dem lokalen Modell füllen (nur Felder, keine Diagnosen)."""
    if not lokal or not lokal.available():
        return {}
    prompt = ("Lies aus dieser Arztrechnung nur diese Felder und antworte ausschließlich mit JSON: "
              '{"rechnungsbetrag": "123,45", "rechnungsdatum": "TT.MM.JJJJ", "zahlungstermin": "TT.MM.JJJJ oder leer", '
              '"empfaenger": "Name", "iban": "", "bic": "", "verwendungszweck": ""}. Keine Diagnosen.\n\n' + text[:6000])
    try:
        model = lokal.resolve_model()
        out = "".join(e[1] for e in lokal.step(model, "Du extrahierst Rechnungsdaten exakt und erfindest nichts.",
                                               [{"role": "user", "content": prompt}], [], 300) if e[0] == "text")
        d = json.loads(re.search(r"\{.*\}", out, re.S).group(0))
    except Exception:
        return {}
    r = {"betrag": betrag(str(d.get("rechnungsbetrag", ""))), "datum": datum(str(d.get("rechnungsdatum", ""))),
         "ziel": datum(str(d.get("zahlungstermin", ""))), "empfaenger": str(d.get("empfaenger", ""))[:80],
         "bic": str(d.get("bic", "")).replace(" ", "")[:11] or None, "zweck": str(d.get("verwendungszweck", ""))[:80]}
    iban = str(d.get("iban", ""))
    r["iban"] = iban if iban and iban_ok(iban) and re.sub(r"\s", "", iban) in re.sub(r"\s", "", text) else None
    # Nur übernehmen, was wirklich im Text steht (gegen erfundene Werte)
    if r["betrag"]:
        de = f"{r['betrag']:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
        if de not in text and de.replace(".", "") not in text:
            r["betrag"] = None
    if r["datum"] and r["datum"].strftime("%d.%m.%Y") not in text and r["datum"].strftime("%d.%m.%y") not in text:
        r["datum"] = None
    return r


# ------------------------------------------------------------------ Layout (PDF-Geometrie)
# Viele Abrechnungsstellen setzen Beschriftung und Wert nicht in eine Textzeile: „Datum“ steht über
# dem Wert, „zu liquidieren“ links neben dem Betrag in einer anderen Spalte. Darum werden die Wörter
# mit ihrer Position gelesen und Werte rechts neben bzw. direkt unter der Beschriftung gesucht.
GEO_LABELS = {
    "betrag": ["zu liquidieren", "rechnungsbetrag", "gesamtbetrag", "endbetrag", "zahlbetrag", "zu zahlen",
               "zu zahlender betrag", "offener betrag", "rechnungssumme", "gesamtsumme", "endsumme", "summe"],
    "datum": ["rechnungsdatum", "datum der rechnung", "datum"],
    "ziel": ["zahlungsziel", "zahlungstermin", "fällig am", "fällig bis", "zahlbar bis", "fälligkeit"],
    "nummer": ["rechnungsnummer", "rechnungs-nr.", "rechnung-nr.", "rechnungs-nr", "re-nr.", "rechnung nr."],
}
KOPF_NICHT = re.compile(r"^(?:privat)?(?:rechnung|liquidation|quittung|kassenbon|kundenbeleg|mahnung|zahlungserinnerung)\b", re.I)


def _woerter(pfad) -> list[dict]:
    try:
        import fitz
        doc = fitz.open(str(pfad))
    except Exception:
        return []
    out = []
    for p in doc:
        roh = sorted(p.get_text("words"), key=lambda w: (w[5], w[6], w[0]))
        for x0, y0, x1, y1, t, b, l, _ in roh:
            v = out[-1] if out else None
            # Texterkennung von Scans zerlegt Wörter oft in einzelne Zeichen („z u l i q u i d …“):
            # eng beieinanderliegende Einzelzeichen derselben Zeile wieder zusammensetzen.
            if (v and v["p"] == p.number and v["letzt"] <= 2 and len(t) <= 2 and abs((y0 + y1) / 2 - v["yc"]) < 2
                    and 0 <= x0 - v["x1"] < 0.3 * (y1 - y0)):
                v["t"] += t; v["x1"] = x1; v["letzt"] = len(t)
                continue
            out.append({"p": p.number, "x0": x0, "y0": y0, "x1": x1, "y1": y1, "t": t, "b": b, "l": l,
                        "h": y1 - y0, "yc": (y0 + y1) / 2, "ph": p.rect.height, "letzt": len(t)})
    return out


def _tok(t: str) -> str:
    return t.lower().strip(":;,")


def _labels(ws: list[dict], phrase: str) -> list[dict]:
    """Fundstellen einer Beschriftung (auch mehrwortig) als Rechteck."""
    teile = phrase.split()
    out = []
    for i, w in enumerate(ws):
        if _tok(w["t"]) != teile[0]:
            continue
        box, ok, j = dict(w), True, i
        for t in teile[1:]:
            j += 1
            if j >= len(ws):
                ok = False; break
            n = ws[j]
            if _tok(n["t"]) != t or n["p"] != w["p"] or abs(n["yc"] - w["yc"]) > 3 or n["x0"] - box["x1"] > 20:
                ok = False; break
            box["x1"], box["t"] = n["x1"], box["t"] + " " + n["t"]
        if ok:
            out.append(box)
    return out


def _zeile(woerter: list[dict]) -> str:
    return entsperren(" ".join(w["t"] for w in sorted(woerter, key=lambda w: w["x0"])))


def _wert(ws: list[dict], lab: dict, rx: str) -> str | None:
    h = max(lab["h"], 6)
    # 1) rechts daneben, gleiche Höhe
    rechts = [w for w in ws if w["p"] == lab["p"] and abs(w["yc"] - lab["yc"]) < max(4, h * 0.6)
              and w["x0"] >= lab["x1"] - 1 and w["x0"] - lab["x1"] < 260]
    m = re.search(rx, _zeile(rechts))
    if m:
        return m.group(0)
    # 2) darunter, gleiche Spalte (höchstens zwei Zeilen tiefer)
    unten = [w for w in ws if w["p"] == lab["p"] and w["yc"] > lab["yc"] + 2 and w["y0"] <= lab["y1"] + 2.6 * h
             and w["x0"] < lab["x1"] + 25 and w["x1"] > lab["x0"] - 25]
    for y in sorted({round(w["yc"]) for w in unten}):
        m = re.search(rx, _zeile([w for w in unten if abs(w["yc"] - y) < 3]))
        if m:
            return m.group(0)
    return None


def _briefkopf(ws: list[dict], seite: int, ausschluss: list[str]) -> str:
    """Absender = die größte Schrift im oberen Drittel (Briefkopf), ohne das Wort „Rechnung“."""
    oben = [w for w in ws if w["p"] == seite and w["y1"] < w["ph"] * 0.33]
    if not oben:
        return ""
    hoehen = sorted(w["h"] for w in ws if w["p"] == seite)
    normal = hoehen[len(hoehen) // 2]
    zeilen: dict = {}
    for w in oben:
        zeilen.setdefault((w["b"], w["l"]), []).append(w)
    kand = []
    for ws_z in zeilen.values():
        text = " ".join(w["t"] for w in sorted(ws_z, key=lambda w: w["x0"])).strip()
        hz = max(w["h"] for w in ws_z)
        if hz < normal * 1.25 or KOPF_NICHT.match(text) or len(re.sub(r"[^A-Za-zÄÖÜäöüß]", "", text)) < 3:
            continue
        if any(a.lower() in text.lower().split() for a in ausschluss):
            continue
        kand.append((min(w["y0"] for w in ws_z), hz, text))
    if not kand:
        return ""
    kand.sort()
    groesste = max(k[1] for k in kand)
    teile, letzte_y = [], None
    for y, hz, text in kand:
        if hz < groesste * 0.8:
            continue
        if (letzte_y is not None and y - letzte_y > hz * 2.2) or re.search(r"\d", text):
            break
        teile.append(text); letzte_y = y
    return entsperren(" ".join(teile))[:80]


def rechnung_layout(pfad, ausschluss: list[str] | None = None) -> dict:
    ws = _woerter(pfad)
    if not ws:
        return {}
    rx = {"betrag": BETRAG, "datum": r"\d{1,2}\.\d{1,2}\.\d{2,4}", "ziel": r"\d{1,2}\.\d{1,2}\.\d{2,4}",
          "nummer": r"[A-Z0-9][A-Z0-9/\-.]*\d[A-Z0-9/\-.]*"}
    out: dict = {}
    for feld, labels in GEO_LABELS.items():
        for lab_text in labels:
            for lab in _labels(ws, lab_text):
                v = _wert(ws, lab, rx[feld])
                if v:
                    out[feld] = {"betrag": betrag, "datum": datum, "ziel": datum}.get(feld, str)(v)
                    out[feld + "_seite"] = lab["p"]
                    break
            if out.get(feld):
                break
    seite = out.get("betrag_seite", 0)
    out["empfaenger"] = _briefkopf(ws, seite, ausschluss or [])
    return out


def _gueltige_bic(bic: str | None, text: str) -> str | None:
    b = re.sub(r"\s", "", bic or "").upper()
    return b if b and BIC_RE.fullmatch(b) and b in re.sub(r"\s", "", text).upper() else None


def _empfaenger_ok(name: str | None, text: str, ausschluss: list[str]) -> bool:
    if not name or len(name) < 4:
        return False
    worte = re.findall(r"[a-zäöüß]+", name.lower())
    if any(a.lower() in worte for a in ausschluss):
        return False                                  # Patient/Familie ist nie der Zahlungsempfänger
    flach = re.sub(r"\s+", " ", entsperren(text)).lower()
    return re.sub(r"\s+", " ", name).lower()[:25] in flach


def _datum_fallback(text: str) -> date | None:
    """Kassenbons u. Ä. ohne Beschriftung: erstes plausibles Datum mit vierstelligem Jahr,
    das kein Geburtsdatum ist."""
    heute = date.today()
    for m in re.finditer(r"(\d{1,2}\.\d{1,2}\.\d{4})", text):
        if re.search(r"(?:geb(?:\.|oren|urtsdatum)|ziel|fällig|bis|gültig)[^\n]{0,25}$", text[max(0, m.start() - 40):m.start()], re.I):
            continue
        d = datum(m.group(1))
        if d and heute - timedelta(days=550) <= d <= heute + timedelta(days=3):
            return d
    return None


def rechnung(text: str, lokal=None, pfad=None, ausschluss: list[str] | None = None) -> dict:
    """Reihenfolge: feste Regeln → Seitenlayout (Beschriftung neben/über dem Wert) → lokales Modell.
    Jeder Wert wird geprüft, unsichere Werte werden als „Bitte prüfen“ gemeldet statt geraten."""
    ausschluss = ausschluss or []
    text = entsperren(text)
    r = rechnung_regeln(text)
    if pfad:
        g = rechnung_layout(pfad, ausschluss)
        if g.get("betrag") and (not r["betrag"] or r.get("betrag_unsicher")):
            r["betrag"], r["betrag_unsicher"] = g["betrag"], False
        for k in ("datum", "ziel"):
            if g.get(k) and not r[k]:
                r[k] = g[k]
        if g.get("nummer") and not re.search(r"\d", r.get("nummer") or ""):
            r["nummer"] = g["nummer"]
        if not _empfaenger_ok(r.get("empfaenger"), text, ausschluss) and g.get("empfaenger"):
            r["empfaenger"] = g["empfaenger"]
    if not r["datum"]:
        r["datum"] = _datum_fallback(text)
    if not (r["betrag"] and r["datum"] and r["iban"]) or r.get("betrag_unsicher"):
        for k, v in rechnung_lokal_llm(text, lokal).items():
            if v and (not r.get(k) or (k == "betrag" and r.get("betrag_unsicher"))):
                r[k] = v
                if k == "betrag":
                    r["betrag_unsicher"] = False
    # Plausibilität der Nebenfelder
    if not re.search(r"\d", r.get("nummer") or ""):
        r["nummer"] = ""
    r["bic"] = _gueltige_bic(r.get("bic"), text)
    if not r["bic"] and r.get("iban"):                  # BIC steht meist direkt hinter der IBAN
        flach = re.sub(r"\s+", " ", text)
        mi = re.search(r"\s?".join(r["iban"].replace(" ", "")), flach)
        if mi:
            m = re.search(r"\b([A-Z]{4}DE[A-Z0-9]{2}(?:[A-Z0-9]{3})?)\b", flach[mi.end():mi.end() + 200])
            r["bic"] = _gueltige_bic(m.group(1), text) if m else None
    if not _empfaenger_ok(r.get("empfaenger"), text, ausschluss):
        r["empfaenger"] = ""
    heute = date.today()
    probleme = []
    if not r["betrag"] or not (0 < r["betrag"] < 20000):
        probleme.append("Betrag"); r["betrag"] = None
    elif r.get("betrag_unsicher"):
        probleme.append("Betrag (unsicher)")
    if not r["datum"] or not (heute - timedelta(days=550) <= r["datum"] <= heute + timedelta(days=3)):
        probleme.append("Rechnungsdatum"); r["datum"] = None
    if r["ziel"] and r["datum"] and r["ziel"] < r["datum"]:
        r["ziel"] = None
    if not r["ziel"] and r["datum"]:
        r["ziel"] = r["datum"] + timedelta(days=30)            # übliche Frist nach GOÄ
        r["ziel_geschaetzt"] = True
    if not r["iban"] and not r.get("bezahlt"):
        probleme.append("IBAN")
    r["probleme"] = probleme
    return r


# ------------------------------------------------------------------ Bescheide
def art(text: str) -> str | None:
    t = text.lower()
    if "beihilfebescheid" in t or ("festsetzung zum beihilfeantrag" in t):
        return "beihilfe"
    if "universa" in t and ("leistungsabrechnung" in t or "erstattungsbetrag" in t):
        return "pkv"
    return None


def art_aus_name(name: str) -> str | None:
    """'2026_10_10 - Beihilfebescheid', 'Bescheid Beihilfe', 'Erstattung PKV', 'uniVersa Abrechnung' …"""
    n = re.sub(r"[\s_\-.]+", "", name.lower())
    if "beihilfe" in n and ("bescheid" in n or "festsetzung" in n):
        return "beihilfe"
    if ("pkv" in n or "universa" in n) and any(w in n for w in ("erstattung", "bescheid", "abrechnung", "leistung")):
        return "pkv"
    if "leistungsabrechnung" in n:
        return "pkv"
    return None


def beihilfebescheid(text: str) -> dict:
    """BVA-Bescheid: Belege mit Person, Rechnungsdatum, Rechnungsbetrag … Beihilfe."""
    flach = re.sub(r"\s+", " ", text)
    m = re.search(rf"den\s+({DATUM})", flach)
    belege = []
    pat = re.compile(rf"\b(\d{{1,3}}) (B|K|E/L|E|L) ({DATUM}) ({BETRAG}) ({BETRAG}) ({BETRAG}) ({BETRAG}) (\d{{1,3}},\d{{2}}) ({BETRAG})")
    for g in pat.finditer(flach):
        belege.append({"beleg": int(g.group(1)), "person": g.group(2), "datum": datum(g.group(3)),
                       "betrag": betrag(g.group(4)), "satz": betrag(g.group(8)), "erstattung": betrag(g.group(9))})
    summe = re.search(rf"Summe festgesetzte Beihilfe:?\s*-?\s*({BETRAG})", flach) or \
        re.search(rf"Zahlbetrag:?\s*\W{{0,3}}\s*({BETRAG})", flach)
    summe = betrag(summe.group(1)) if summe else None
    if not belege or (summe and abs(sum(b["erstattung"] for b in belege) - summe) > 0.02):
        spalten = _bescheid_spalten(text)
        if spalten and (not summe or abs(sum(b["erstattung"] for b in spalten) - summe) <= 0.02):
            belege = spalten
    sicher = bool(belege) and (summe is None or abs(sum(b["erstattung"] for b in belege) - summe) <= 0.02)
    return {"art": "beihilfe", "datum": datum(m.group(1)) if m else None, "belege": belege,
            "summe": summe, "sicher": sicher}


def _bescheid_spalten(text: str) -> list[dict]:
    """Gescannte Bescheide: Die Texterkennung liest spaltenweise. Personen-, Datums-, Betrags- und
    Beihilfespalte werden getrennt eingesammelt und zeilenweise wieder zusammengesetzt."""
    t = entsperren(text)
    a = t.find("Festsetzung zum Beihilfeantrag")
    e = t.find("Summe Beihilfe")
    if a < 0 or e < 0:
        return []
    teil = t[a:e]
    kopf = teil.split("\n", 1)[1] if "\n" in teil else teil
    daten = [datum(d) for d in re.findall(DATUM, kopf)]
    n = len(daten)
    if not n:
        return []
    personen = [p for p in re.findall(r"(?m)^\s*(K|B|E/L|E|L)\s*$", kopf)][:n]
    nach_daten = kopf[kopf.rfind(re.findall(DATUM, kopf)[-1]):]
    betraege = [betrag(x) for x in re.findall(BETRAG, nach_daten)][:n]
    h = max(kopf.rfind("Beihilfe"), kopf.rfind("Hinweis"), kopf.rfind("weis"))
    beihilfe = [round(float(x.replace(".", "").replace(",", ".")) if "," in x else float(x), 2)
                for x in re.findall(r"\d{1,3}(?:\.\d{3})*,\d{2}|\b\d{1,4}\.\d{2}\b", kopf[h:])][:n]
    if len(betraege) < n or len(beihilfe) < n:
        return []
    return [{"beleg": i + 1, "person": personen[i] if i < len(personen) else "?", "datum": daten[i],
             "betrag": betraege[i], "satz": None, "erstattung": beihilfe[i]} for i in range(n)]


def pkv_abrechnung(text: str, kinder_namen: dict) -> dict:
    """uniVersa-Leistungsabrechnung: Abschnitte je Person, darin Belege 'B/26/21 … Erstattungsbetrag'."""
    zeilen = [z.strip() for z in text.splitlines() if z.strip()]
    flach = " ".join(zeilen)
    m = re.search(r"Nürnberg, den (\d{1,2})\. (\w+) (\d{4})", flach)
    monate = ["januar", "februar", "märz", "april", "mai", "juni", "juli", "august", "september",
              "oktober", "november", "dezember"]
    bdatum = None
    if m and m.group(2).lower() in monate:
        bdatum = date(int(m.group(3)), monate.index(m.group(2).lower()) + 1, int(m.group(1)))
    belege, person = [], None
    blk: list[str] = []

    def abschliessen():
        if not blk or not person:
            return
        txt = " ".join(blk)
        betraege = [betrag(x) for x in re.findall(BETRAG, txt)]
        if not betraege:
            return
        dup = "duplikat" in txt.lower() or "liegt uns schon vor" in txt.lower()
        dm = re.search(rf"({DATUM})", txt) or re.search(r"(\d{2}\.\d{2}\.)-(\d{2}\.\d{2}\.\d{4})", txt)
        belege.append({"beleg": blk[0], "person": person, "betrag": betraege[0],
                       "erstattung": 0.0 if dup else betraege[-1], "duplikat": dup,
                       "behandlung": datum(dm.group(dm.lastindex)) if dm else None})

    for z in zeilen:
        pm = re.match(r"^(.+?),\s*geb\.\s*\d", z)
        if pm:
            abschliessen(); blk = []
            name = pm.group(1).strip().lower()
            person = next((k for k, v in kinder_namen.items() if v.lower() == name), None)
            continue
        if re.match(r"^[A-Z]/\d{2}/\d+$", z):
            abschliessen(); blk = [z]
            continue
        if z.lower().startswith("gesamtsumme"):
            abschliessen(); blk = []
            continue
        if blk:
            blk.append(z)
    abschliessen()
    aus = re.search(rf"Auszahlungsbetrag ({BETRAG})", flach) or re.search(rf"überweisen heute ({BETRAG})", flach)
    return {"art": "pkv", "datum": bdatum, "belege": belege, "summe": betrag(aus.group(1)) if aus else None}
