"""Zahlen, Beträge, Daten und Abkürzungen für die deutsche Sprachausgabe ausschreiben.
ElevenLabs' schnelles Modell liest '249,77 €' oder '25.10.2026' sonst holprig vor."""
import re

EINER = ["null", "eins", "zwei", "drei", "vier", "fünf", "sechs", "sieben", "acht", "neun", "zehn", "elf",
         "zwölf", "dreizehn", "vierzehn", "fünfzehn", "sechzehn", "siebzehn", "achtzehn", "neunzehn"]
ZEHNER = ["", "", "zwanzig", "dreißig", "vierzig", "fünfzig", "sechzig", "siebzig", "achtzig", "neunzig"]
MONATE = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober",
          "November", "Dezember"]
ZIFFERN = EINER[:10]


def _u100(n: int) -> str:
    if n < 20:
        return EINER[n]
    z, e = divmod(n, 10)
    return ZEHNER[z] if e == 0 else ("ein" if e == 1 else EINER[e]) + "und" + ZEHNER[z]


def _u1000(n: int) -> str:
    h, r = divmod(n, 100)
    s = (("ein" if h == 1 else EINER[h]) + "hundert") if h else ""
    return s + (_u100(r) if r else "") if (h or r) else "null"


def zahl(n: int) -> str:
    if n < 0:
        return "minus " + zahl(-n)
    if n == 0:
        return "null"
    teile = []
    mrd, n = divmod(n, 10 ** 9)
    mio, n = divmod(n, 10 ** 6)
    tsd, n = divmod(n, 1000)
    if mrd:
        teile.append("eine Milliarde" if mrd == 1 else zahl(mrd) + " Milliarden")
    if mio:
        teile.append("eine Million" if mio == 1 else zahl(mio) + " Millionen")
    w = (("ein" if tsd == 1 else _u1000(tsd)) + "tausend") if tsd else ""
    w += _u1000(n) if n else ""
    if w:
        teile.append(w)
    return " ".join(teile)


def jahr(n: int) -> str:
    return _u100(n // 100) + "hundert" + (_u100(n % 100) if n % 100 else "") if 1100 <= n < 2000 else zahl(n)


def ordinal(n: int, endung: str = "er") -> str:
    besonders = {1: "ers", 3: "drit", 7: "sieb", 8: "ach"}
    if n < 20:
        stamm = besonders.get(n, zahl(n)) + "t"
    else:
        stamm = zahl(n) + "st"
    return stamm + endung


def ziffern(s: str) -> str:
    return " ".join(ZIFFERN[int(c)] if c.isdigit() else c for c in s if c.strip())


DATIV = r"(?:am|vom|zum|bis zum|seit dem|ab dem|ab|seit)\s+$"


def _datum(m: re.Match, text: str) -> str:
    t, mo = int(m.group("t")), int(m.group("m"))
    if not (1 <= t <= 31 and 1 <= mo <= 12):
        return m.group(0)
    vor = text[max(0, m.start() - 12):m.start()]
    end = "en" if re.search(DATIV, vor, re.I) else "er"
    s = f"{ordinal(t, end)} {MONATE[mo - 1]}"
    if m.group("j"):
        j = int(m.group("j"))
        j = j + 2000 if j < 100 else j
        s += " " + jahr(j)
    return s


def _betrag(euro: str, cent: str | None) -> str:
    e = int(euro.replace(".", ""))
    s = ("ein" if e == 1 else zahl(e)) + " Euro"
    if cent and int(cent):
        s += " " + zahl(int(cent))
    return s


ABK = [(r"\bz\.\s?B\.", "zum Beispiel"), (r"\bu\.\s?a\.", "unter anderem"), (r"\bd\.\s?h\.", "das heißt"),
       (r"\bca\.", "circa"), (r"\bNr\.", "Nummer"), (r"\bDr\.", "Doktor"), (r"\bbzw\.", "beziehungsweise"),
       (r"\busw\.", "und so weiter"), (r"\binkl\.", "inklusive"), (r"\bggf\.", "gegebenenfalls"),
       (r"\bevtl\.", "eventuell"), (r"\bMio\.", "Millionen"), (r"\bMrd\.", "Milliarden"),
       (r"\bTsd\.", "tausend"), (r"\bStr\.", "Straße"), (r"°C", " Grad"), (r"\bkm/h\b", "Kilometer pro Stunde"),
       (r"\bkm\b", "Kilometer"), (r"\bkg\b", "Kilogramm"), (r"\bmin\b", "Minuten"), (r"\bStd\.", "Stunden"),
       ]

BUCHSTABEN = {"A": "a", "B": "be", "C": "ze", "D": "de", "E": "e", "F": "eff", "G": "ge", "H": "ha", "I": "i",
              "J": "jott", "K": "ka", "L": "ell", "M": "emm", "N": "enn", "O": "o", "P": "pe", "Q": "ku",
              "R": "err", "S": "ess", "T": "te", "U": "u", "V": "vau", "W": "we", "X": "ix", "Y": "üpsilon",
              "Z": "zett", "Ä": "ä", "Ö": "ö", "Ü": "ü"}
# Wörter, die man ausspricht statt zu buchstabieren
ALS_WORT = {"JARVIS", "NATO", "IBAN", "BIC", "PIN", "TAN", "PUK", "UNO", "ESA", "NASA", "UNESCO", "ASAP",
            "LIDL", "ALDI", "IKEA", "OK", "TÜV", "DAX", "BAföG", "ADAC", "ICE", "SIM", "AIDS", "VIP"}


def buchstabieren(wort: str) -> str:
    return "-".join(BUCHSTABEN.get(c, c).capitalize() for c in wort)


def _abkuerzung(m: re.Match) -> str:
    w = m.group(0)
    return w if w in ALS_WORT else buchstabieren(w)


def normalisieren(text: str, lang: str = "de") -> str:
    if lang != "de" or not text:
        return text
    t = text
    for pat, ers in ABK:
        t = re.sub(pat, ers, t)
    # IBAN und lange Kennungen ziffernweise (Ländercode buchstabiert)
    t = re.sub(r"\b[A-Z]{2}\d{2}(?: ?[A-Z0-9]{4}){3,7}(?: ?[A-Z0-9]{1,3})?\b",
               lambda m: buchstabieren(m.group(0)[:2]) + ", " + ", ".join(
                   ziffern(g) for g in m.group(0)[2:].split()), t)
    # Beträge: 249,77 € · 1.250 EUR · € 12,50
    t = re.sub(r"€\s?(\d{1,3}(?:\.\d{3})+|\d+)(?:,(\d{2}))?", lambda m: _betrag(m.group(1), m.group(2)), t)
    t = re.sub(r"(\d{1,3}(?:\.\d{3})+|\d+)(?:,(\d{2}|-{1,2}))?\s?(?:€|EUR\b|Euro\b)",
               lambda m: _betrag(m.group(1), m.group(2) if m.group(2) and m.group(2)[0].isdigit() else None), t)
    # Daten: 25.10.2026 · 25.10.26 · 25.10. · 3. Oktober
    t = re.sub(r"\b(?P<t>\d{1,2})\.(?P<m>\d{1,2})\.(?P<j>\d{4}|\d{2})?(?!\d)", lambda m: _datum(m, t), t)
    t = re.sub(r"\b(\d{1,2})\.\s+(" + "|".join(MONATE) + r")\b",
               lambda m: ordinal(int(m.group(1)), "en" if re.search(DATIV, t[max(0, m.start() - 12):m.start()], re.I)
                                 else "er") + " " + m.group(2), t)
    # Uhrzeiten: 18:00 Uhr · 9:30
    t = re.sub(r"\b([01]?\d|2[0-3]):([0-5]\d)(\s*Uhr)?",
               lambda m: f"{zahl(int(m.group(1)))} Uhr" + (f" {zahl(int(m.group(2)))}" if int(m.group(2)) else ""), t)
    # Prozent
    t = re.sub(r"(\d+)(?:,(\d+))?\s?(?:%|Prozent\b)",
               lambda m: zahl(int(m.group(1))) + (" Komma " + ziffern(m.group(2)) if m.group(2) else "") + " Prozent", t)
    # Kennungen mit Bindestrich/Schrägstrich (Rechnungsnummern): gruppenweise
    def kennung(m):
        out = []
        for g in re.split(r"[-/–]", m.group(0)):
            if g.isdigit() and len(g) <= 3 and not g.startswith("0"):
                out.append(zahl(int(g)))
            else:
                out.append(ziffern(g) if any(c.isdigit() for c in g) else g)
        return ", ".join(out)
    t = re.sub(r"\b(?=[A-Z0-9]*\d)[A-Z0-9]+(?:[-/–][A-Z0-9]+){1,4}\b", kennung, t)
    # Jahreszahlen und Zahlen mit Tausenderpunkten
    t = re.sub(r"\b(\d{1,3}(?:\.\d{3})+)\b(?!,)", lambda m: zahl(int(m.group(1).replace(".", ""))), t)
    t = re.sub(r"\b(1[1-9]\d\d|20\d\d)\b", lambda m: jahr(int(m.group(1))), t)
    # Dezimalzahlen und ganze Zahlen
    t = re.sub(r"\b(\d+),(\d+)\b", lambda m: zahl(int(m.group(1))) + " Komma " + ziffern(m.group(2)), t)
    t = re.sub(r"\b\d{7,}\b", lambda m: ziffern(m.group(0)), t)
    t = re.sub(r"\b\d{1,6}\b", lambda m: zahl(int(m.group(0))), t)
    # Abkürzungen aus Großbuchstaben (PKV, BVA, LGU, GOÄ) buchstabieren
    t = re.sub(r"\b[A-ZÄÖÜ]{2,5}\b", _abkuerzung, t)
    return re.sub(r"\s{2,}", " ", t).strip()
