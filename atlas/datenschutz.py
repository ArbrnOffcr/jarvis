"""Datenschutz-Schleier: Was an Claude geht, wird vorher datensparsam gemacht – zentral für JEDEN Claude-Aufruf
(Gespräch, Morgenbriefing, Telegram, Stab, Projekte …), weil der Schleier den Claude-Anbieter selbst umhüllt.

1. Platzhalter statt echter Daten: Namen (Familie, Kinder, eigener Nachname), Anschriften, IBAN, Steuer-ID und
   Steuernummer, Versicherungs-, Renten-, Kunden-, Vertrags-, Personalnummern, Aktenzeichen, Geburtsdaten, Telefon-
   nummern und E-Mail-Adressen werden zu [NAME_1], [ADRESSE_2] … Claude sieht den Sachverhalt, nicht die Person.
   Seine Antworten und Werkzeugaufrufe setzt JARVIS lokal wieder zusammen (Anzeige, Stimme, Werkzeuge bekommen die
   echten Werte). Die Zuordnung bleibt nur im Arbeitsspeicher dieses Macs.
2. Sensibles nach Inhalt: Enthält ein Werkzeugergebnis Gesundheits-, Konto-, Ausweis-, Steuer-ID- oder
   Bezügedaten, fasst das LOKALE Modell es zuerst zusammen – ohne Diagnosen, Nummern, Einzelposten. Claude bekommt
   nur die Kurzfassung. Ist das lokale Modell nicht erreichbar, bleibt der Inhalt zurück.
3. Protokoll: je Claude-Aufruf Zeichenzahl, Zahl der Ersetzungen je Art und lokale Zusammenfassungen – nie Inhalte."""
import hashlib
import re
import threading
from collections import OrderedDict

# Werkzeuge, deren Ergebnis bewusst knapp/ungefährlich ist (nur Platzhalter, keine lokale Zusammenfassung)
OHNE_ZUSAMMENFASSUNG = {"werkzeuge_laden", "wetter", "zeit_jetzt", "datenschutz_bericht", "briefing_anpassen",
                        "gespraechssprache", "darstellung_waehlen"}
ZUSAMMENFASSEN = {"Gesundheitsdaten", "Kontodaten", "Ausweisdaten", "Einkommen/Bezüge", "Steuer-ID/Steuernummer",
                  "Bankverbindung (IBAN)"}

_STR = r"(?:straße|strasse|str\.|weg|allee|platz|gasse|ring|damm|ufer|chaussee|steig|pfad|hof|markt)"
MUSTER = [   # (Art, Regex, Gruppe mit dem zu ersetzenden Teil)
    ("IBAN", re.compile(r"\b[A-Z]{2}\d{2}(?:\s?[A-Z0-9]{4}){3,7}(?:\s?[A-Z0-9]{1,3})?\b"), 0),
    ("EMAIL", re.compile(r"\b[\w.+-]+@[\w-]+(?:\.[\w-]+)+\b"), 0),
    ("STEUERID", re.compile(r"(?i)(?:steuer-?id|identifikationsnummer|idnr\.?|steuerliche id)\D{0,20}"
                            r"(\d{2}\s?\d{3}\s?\d{3}\s?\d{3})"), 1),
    ("STEUERNR", re.compile(r"\b\d{2,3}/\d{3}/\d{4,5}\b"), 0),
    ("VERSNR", re.compile(r"\b[A-Z]\d{9}\b"), 0),                                   # Krankenversichertennummer
    ("RVNR", re.compile(r"\b\d{2}\s?\d{6}\s?[A-Z]\s?\d{3}\b"), 0),                 # Rentenversicherungsnummer
    ("NUMMER", re.compile(r"(?i)(?:aktenzeichen|az\.|gesch\.?-?z(?:eichen)?\.?|kunden-?nr\.?|kundennummer|"
                          r"vertrags-?nr\.?|vertragsnummer|versicherungs-?nr\.?|versicherungsnummer|"
                          r"versicherungsschein-?nr\.?|personal-?nr\.?|personalnummer|mitglieds-?nr\.?|"
                          r"mitgliedsnummer|policen-?nr\.?|beihilfe-?nr\.?|beihilfenummer)\s*[:.#]?\s*"
                          r"([A-Z0-9][A-Z0-9/\-. ]{3,24}[A-Z0-9])"), 1),
    ("GEBDATUM", re.compile(r"(?i)(?:geb\.|geboren(?: am)?|geburtsdatum:?)\s*(\d{1,2}\.\s?\d{1,2}\.\s?\d{2,4})"), 1),
    ("ADRESSE", re.compile(r"\b(?:(?:Am|Zum|Zur|An der|Auf dem|Im|In der|Unter den) [A-ZÄÖÜ][\wäöüß\-]+|"
                           rf"[A-ZÄÖÜ][\wäöüß\-]*{_STR}|"
                           r"[A-ZÄÖÜ][\wäöüß\-]+ (?:Straße|Strasse|Str\.|Weg|Allee|Platz|Gasse|Ring|Damm|Ufer|Chaussee))"
                           r"\s+\d{1,4}\s?[a-zA-Z]?\b(?:,?\s*\d{5}\s+[A-ZÄÖÜ][\wäöüß\-]+)?"), 0),
    ("TELEFON", re.compile(r"(?<![\d.,])(?:\+49|0049|0)\s?[1-9]\d{1,4}[\s/\-]?\d{3,}(?:[\s\-]?\d{1,6})?(?!\d|[.,]\d)"), 0),
]
PLATZHALTER = re.compile(r"\[(DOK|NAME|IBAN|EMAIL|STEUERID|STEUERNR|VERSNR|RVNR|NUMMER|GEBDATUM|ADRESSE|TELEFON)_(\d+)\]")


class Schleier:
    """Zuordnung echter Wert ↔ Platzhalter (stabil, solange JARVIS läuft; nur im Arbeitsspeicher)."""

    def __init__(self, namen: list[str] | None = None):
        self.lock = threading.Lock()
        self.echt_zu_ph: dict[str, str] = {}
        self.ph_zu_echt: dict[str, str] = {}
        self.zaehler: dict[str, int] = {}
        self.namen_setzen(namen or [])

    def namen_setzen(self, namen: list[str]) -> None:
        sauber = sorted({n.strip() for n in namen if n and len(n.strip()) >= 3}, key=len, reverse=True)
        self.namen = sauber
        self.namen_re = re.compile(r"\b(" + "|".join(re.escape(n) for n in sauber) + r")\b", re.I) if sauber else None

    def _ph(self, art: str, wert: str) -> str:
        schluessel = art + ":" + " ".join(wert.split())
        with self.lock:
            ph = self.echt_zu_ph.get(schluessel)
            if not ph:
                self.zaehler[art] = self.zaehler.get(art, 0) + 1
                ph = f"[{art}_{self.zaehler[art]}]"
                self.echt_zu_ph[schluessel] = ph
                self.ph_zu_echt[ph] = wert.strip()
            return ph

    def maskieren(self, text: str, statistik: dict | None = None) -> str:
        if not text or not isinstance(text, str):
            return text

        def ersetze(art, m, gruppe):
            wert = m.group(gruppe)
            if not wert or PLATZHALTER.fullmatch(wert):
                return m.group(0)
            if statistik is not None:
                statistik[art] = statistik.get(art, 0) + 1
            ph = self._ph(art, wert)
            return m.group(0).replace(wert, ph) if gruppe else ph
        for art, rx, gruppe in MUSTER:
            text = rx.sub(lambda m, a=art, g=gruppe: ersetze(a, m, g), text)
        if self.namen_re:
            text = self.namen_re.sub(lambda m: ersetze("NAME", m, 0), text)
        return text

    def entschleiern(self, text: str) -> str:
        if not text or not isinstance(text, str) or "[" not in text:
            return text
        return PLATZHALTER.sub(lambda m: self.ph_zu_echt.get(m.group(0), m.group(0)), text)

    def tief(self, obj, fn, schluessel: str = ""):
        """Strings in Nachrichten/Argumenten verarbeiten – nur Inhalte (text, content, input …), nie IDs/Typen."""
        if isinstance(obj, str):
            return fn(obj) if schluessel not in ("id", "tool_use_id", "type", "name", "role", "media_type",
                                                 "cache_control", "url", "data", "signature") else obj
        if isinstance(obj, list):
            return [self.tief(x, fn, schluessel) for x in obj]
        if isinstance(obj, dict):
            return {k: self.tief(v, fn, k) for k, v in obj.items()}
        return obj


class Strom:
    """Textstrom von Claude zurückübersetzen – Platzhalter können über zwei Stücke verteilt ankommen."""

    def __init__(self, schleier: Schleier):
        self.s, self.puffer = schleier, ""

    def feed(self, stueck: str) -> str:
        t = self.puffer + stueck
        i = t.rfind("[")
        if i >= 0 and "]" not in t[i:] and len(t) - i <= 24:
            self.puffer, t = t[i:], t[:i]
        else:
            self.puffer = ""
        return self.s.entschleiern(t)

    def ende(self) -> str:
        t, self.puffer = self.s.entschleiern(self.puffer), ""
        return t


def sensibel_arten(text: str) -> list[str]:
    from atlas.hilfen import sensibel_gruende
    return [g for g in sensibel_gruende(text or "") if g in ZUSAMMENFASSEN]


ZUSAMMENFASSUNG_SYSTEM = (
    "Du gibst ein Werkzeugergebnis datensparsam an ein Cloud-Sprachmodell weiter. Schreibe eine knappe deutsche "
    "Kurzfassung mit genau dem, was zur Beantwortung der Frage nötig ist: Art des Dokuments/Eintrags, Datum, "
    "Absender, Status, Fristen, Gesamtbeträge. NIEMALS nennen: Diagnosen, Befunde, Behandlungen, Medikamente, "
    "Kontonummern/IBAN, Steuer-ID, Ausweis-, Versicherungs- oder Personalnummern, einzelne Gehaltsposten, "
    "Geburtsdaten. Höchstens 8 Zeilen. Keine Einleitung.")


# Felder eines Suchtreffers, die das Dokument nur bezeichnen (Pfad, Name) – alles andere ist Inhalt
TREFFER_ORT = ("pfad", "name", "ordner", "titel")
TREFFER_NEUTRAL = {"datum", "seite", "relevanz", "quelle", "verwandt"}


def treffer_einzeln(inhalt: str, schleier: "Schleier", stat: dict) -> str | None:
    """Suchergebnisse Treffer für Treffer datensparsam machen – ohne das lokale Modell und damit ohne Wartezeit.
    Je Treffer (Eintrag mit „pfad“): Jedes Inhaltsfeld (Auszug, Worum, Beträge …), das Sensibles enthält, bleibt
    auf dem Mac. Verrät schon der Name/Pfad Sensibles, bekommt Claude statt des Pfads nur einen Platzhalter
    [DOK_n] – damit kann er das Dokument zeigen oder lesen lassen (JARVIS setzt den echten Pfad lokal ein), ohne
    den Namen zu kennen. Rückgabe None → lokale Kurzfassung wie bisher: kein Suchergebnis, danach noch Sensibles
    übrig, oder mehr als die Hälfte der Treffer ist schon dem Namen nach sensibel (dann geht es in der Frage um
    genau solche Dokumente, und Claude könnte sie ohne Kurzfassung nicht unterscheiden)."""
    import json
    if not inhalt.lstrip().startswith("{"):
        return None
    try:
        daten = json.loads(inhalt)
    except ValueError:
        return None
    gefunden, verdeckt = [0], [0]

    def gang(x):
        if isinstance(x, list):
            return [gang(y) for y in x]
        if not isinstance(x, dict):
            return x
        if not isinstance(x.get("pfad"), str):
            return {k: gang(v) for k, v in x.items()}
        gefunden[0] += 1
        neu, weg = {}, set()
        ort = " ".join(str(x.get(k) or "") for k in TREFFER_ORT)
        ort_arten = sensibel_arten(ort)
        for k, v in x.items():
            if k in TREFFER_ORT:
                if not ort_arten:
                    neu[k] = v
                elif k == "pfad":
                    neu[k] = schleier._ph("DOK", v)
                continue
            if k in TREFFER_NEUTRAL and not isinstance(v, (dict, list, str)):
                neu[k] = v
                continue
            arten = sensibel_arten(v if isinstance(v, str) else json.dumps(v, ensure_ascii=False, default=str))
            if arten:
                weg.update(arten)
            else:
                neu[k] = v
        if ort_arten:
            verdeckt[0] += 1
            neu["art"] = "geschütztes Dokument (Name bleibt auf dem Mac)"
        if weg or ort_arten:
            zurueck[0] += 1
            neu["hinweis"] = ("Geschützte Angaben dieses Treffers bleiben auf dem Mac. Für Einzelheiten datei_lesen "
                              "mit diesem pfad aufrufen (wird lokal zusammengefasst); zum Zeigen datei_zeigen.")
        return neu
    zurueck = [0]
    out = json.dumps(gang(daten), ensure_ascii=False, default=str)
    if not gefunden[0] or verdeckt[0] * 2 > gefunden[0] or sensibel_arten(out):
        return None
    if zurueck[0]:
        stat["felder_zurueck"] = stat.get("felder_zurueck", 0) + zurueck[0]
    return out


class GeschuetzterAnbieter:
    """Umhüllt den Claude-Anbieter: maskiert alles Ausgehende, übersetzt alles Eingehende zurück."""

    def __init__(self, inner, core):
        self.inner, self.c = inner, core
        self.schleier = Schleier()
        self.cache: OrderedDict[str, str] = OrderedDict()
        self.namen_aktualisieren()

    def __getattr__(self, name):                      # available, resolve_model, list_models, last_cache …
        return getattr(self.inner, name)

    def namen_aktualisieren(self) -> None:
        cfg = self.c.cfg
        namen = list((cfg.get("datenschutz") or {}).get("namen") or [])
        for k in ((cfg.get("beihilfe") or {}).get("kinder") or {}).values():
            namen += [k.get("name", ""), *str(k.get("name", "")).split(), k.get("tabelle", "")]
        if (cfg.get("beihilfe") or {}).get("familienname"):
            namen.append(cfg["beihilfe"]["familienname"])
        self.schleier.namen_setzen([n for n in namen if n])

    # ---------------------------------------------------------- Werkzeugergebnisse
    def _frage(self, messages) -> str:
        for m in reversed(messages):
            if m.get("role") == "user" and isinstance(m.get("content"), str):
                return m["content"][:500]
        return ""

    def _kurzfassung(self, werkzeug: str, inhalt: str, frage: str, arten: list[str], stat: dict) -> str:
        h = hashlib.sha1(f"{werkzeug}|{frage}|{inhalt}".encode("utf-8")).hexdigest()
        if h in self.cache:
            self.cache.move_to_end(h)
            return self.cache[h]
        lokal = self.c.providers.get("lokal")
        kurz = ""
        if lokal and lokal.available():
            try:
                # sichtbar machen, warum es dauert: das lokale Modell fasst Sensibles erst zusammen (nur die Art geht raus)
                self.c.broadcast({"type": "phase", "name": "schleier", "arten": arten})
            except Exception:
                pass
            try:
                model = lokal.resolve_model()
                kurz = "".join(e[1] for e in lokal.step(
                    model, ZUSAMMENFASSUNG_SYSTEM,
                    [{"role": "user", "content": f"Frage: {frage}\nWerkzeug: {werkzeug}\n\nErgebnis:\n{inhalt[:6000]}"}],
                    [], 500) if e[0] == "text").strip()
            except Exception:
                kurz = ""
        if kurz:
            out = (f"[Lokal zusammengefasst – enthielt {', '.join(arten)}; Einzelheiten bleiben auf dem Mac. Bei Bedarf "
                   f"Richard auf das Dokument verweisen.]\n{kurz}")
            stat["lokal_zusammengefasst"] = stat.get("lokal_zusammengefasst", 0) + 1
        else:
            out = (f"[Zurückgehalten – enthielt {', '.join(arten)} und das lokale Modell ist gerade nicht erreichbar. "
                   f"Sag Richard, dass er die Einzelheiten selbst nachsehen oder die Frage lokal stellen kann.]")
            stat["zurueckgehalten"] = stat.get("zurueckgehalten", 0) + 1
        self.cache[h] = out
        while len(self.cache) > 300:
            self.cache.popitem(last=False)
        return out

    def _werkzeugergebnisse(self, messages: list[dict], stat: dict) -> list[dict]:
        namen = {}
        for m in messages:                            # tool_use-id → Werkzeugname
            if m.get("role") == "assistant" and isinstance(m.get("content"), list):
                for b in m["content"]:
                    if isinstance(b, dict) and b.get("type") == "tool_use":
                        namen[b.get("id")] = b.get("name", "")
        frage, out = self._frage(messages), []
        for m in messages:
            if m.get("role") == "user" and isinstance(m.get("content"), list):
                neu = []
                for b in m["content"]:
                    if isinstance(b, dict) and b.get("type") == "tool_result" and isinstance(b.get("content"), str):
                        w = namen.get(b.get("tool_use_id"), "")
                        arten = sensibel_arten(b["content"]) if w not in OHNE_ZUSAMMENFASSUNG and len(b["content"]) > 120 else []
                        if arten:
                            einzeln = treffer_einzeln(b["content"], self.schleier, stat)
                            b = {**b, "content": einzeln if einzeln is not None
                                 else self._kurzfassung(w, b["content"], frage, arten, stat)}
                    neu.append(b)
                m = {**m, "content": neu}
            out.append(m)
        return out

    # ---------------------------------------------------------- Aufruf
    def step(self, model, system, messages, tools, max_tokens, **kw):
        from atlas.providers.base import StepResult, ToolCall
        stat: dict = {}
        letzte_alt = messages[-1] if messages else {}
        msgs = self._werkzeugergebnisse(list(messages), stat)
        zus = 0
        if msgs and isinstance(msgs[-1].get("content"), list) and isinstance(letzte_alt.get("content"), list):
            zus = sum(1 for x, y in zip(letzte_alt["content"], msgs[-1]["content"]) if x is not y)
        msgs = self.schleier.tief(msgs, lambda t: self.schleier.maskieren(t, stat))
        self._sichtbar(letzte_alt, msgs[-1] if msgs else {}, zus)
        system = self.schleier.maskieren(system, stat)
        zeichen = len(system) + sum(len(str(m.get("content", ""))) for m in msgs)
        strom = Strom(self.schleier)
        for ev in self.inner.step(model, system, msgs, tools, max_tokens, **kw):
            if ev[0] == "text":
                t = strom.feed(ev[1])
                if t:
                    yield ("text", t)
            elif ev[0] == "end":
                rest = strom.ende()
                if rest:
                    yield ("text", rest)
                r = ev[1]
                calls = [ToolCall(cl.id, cl.name, self.schleier.tief(cl.args, self.schleier.entschleiern))
                         for cl in r.tool_calls]
                yield ("end", StepResult(self.schleier.entschleiern(r.text), calls, r.assistant_msg, r.usage,
                                         pause=r.pause, quellen=r.quellen))
            else:
                yield ev
        try:
            self.c.audit.log("datenschutz", ziel="claude", zeichen=zeichen,
                             ersetzt={k: v for k, v in stat.items() if k.isupper()},
                             lokal_zusammengefasst=stat.get("lokal_zusammengefasst", 0),
                             zurueckgehalten=stat.get("zurueckgehalten", 0),
                             **({"felder_zurueck": stat["felder_zurueck"]} if stat.get("felder_zurueck") else {}))
        except Exception:
            pass

    def _sichtbar(self, alt: dict, neu: dict, zusammengefasst: int) -> None:
        """Oberfläche zeigt den Schleier (MOSAIK beschlägt kurz) – nur wenn in der NEUEN Nachricht etwas verdeckt
        wurde. Es gehen nur Anzahl und Arten raus, nie Werte oder Platzhalter-Zuordnungen."""
        try:
            vorher = set(PLATZHALTER.findall(str(alt.get("content", ""))))
            jetzt = set(PLATZHALTER.findall(str(neu.get("content", "")))) - vorher
            if jetzt or zusammengefasst:
                self.c.broadcast({"type": "schleier", "anzahl": len(jetzt), "zusammengefasst": zusammengefasst,
                                  "arten": sorted({a for a, _ in jetzt})})
        except Exception:
            pass

    def tool_results(self, results):
        return self.inner.tool_results(results)


# ------------------------------------------------------------------ Sprachausgabe (ElevenLabs)
SPRECHEN = [   # nie vorlesen – steht auf dem Bildschirm
    (re.compile(r"\b[A-Z]{2}\d{2}(?:\s?[A-Z0-9]{4}){3,7}(?:\s?[A-Z0-9]{1,3})?\b"), "die IBAN (siehe Bildschirm)"),
    (MUSTER[2][1], lambda m: m.group(0).replace(m.group(1), "(siehe Bildschirm)")),
    (MUSTER[3][1], "die Steuernummer (siehe Bildschirm)"),
    (MUSTER[4][1], "die Versichertennummer (siehe Bildschirm)"),
    (MUSTER[5][1], "die Rentenversicherungsnummer (siehe Bildschirm)"),
    (MUSTER[6][1], lambda m: m.group(0).replace(m.group(1), "(siehe Bildschirm)")),
    (MUSTER[8][1], "die Anschrift (siehe Bildschirm)"),
]


def sprechtext_schuetzen(text: str) -> str:
    for rx, ers in SPRECHEN:
        text = rx.sub(ers, text)
    return text


# ------------------------------------------------------------------ Bericht
def bericht(audit_dateien: list, tag: str) -> dict:
    """Was ging an einem Tag an Claude und ElevenLabs? (nur Zähler aus dem Protokoll)"""
    import json
    c = {"claude": {"aufrufe": 0, "zeichen": 0, "ersetzt": {}, "lokal_zusammengefasst": 0, "zurueckgehalten": 0},
         "elevenlabs": {"ausgaben": 0, "zeichen": 0, "geloescht": 0, "mac_stimme_sensibel": 0}}
    for f in audit_dateien:
        try:
            with open(f, encoding="utf-8") as fh:
                zeilen = fh.read().splitlines()
        except OSError:
            continue
        for z in zeilen:
            if '"datenschutz"' not in z:
                continue
            try:
                e = json.loads(z)
            except ValueError:
                continue
            if not str(e.get("ts", "")).startswith(tag) or e.get("event") != "datenschutz":
                continue
            if e.get("ziel") == "claude":
                k = c["claude"]
                k["aufrufe"] += 1
                k["zeichen"] += int(e.get("zeichen", 0))
                k["lokal_zusammengefasst"] += int(e.get("lokal_zusammengefasst", 0))
                k["zurueckgehalten"] += int(e.get("zurueckgehalten", 0))
                for a, n in (e.get("ersetzt") or {}).items():
                    k["ersetzt"][a] = k["ersetzt"].get(a, 0) + int(n)
            elif e.get("ziel") == "elevenlabs":
                k = c["elevenlabs"]
                if e.get("art") == "geloescht":
                    k["geloescht"] += int(e.get("anzahl", 1))
                elif e.get("art") == "mac_stimme":
                    k["mac_stimme_sensibel"] += 1
                else:
                    k["ausgaben"] += 1
                    k["zeichen"] += int(e.get("zeichen", 0))
    return {"tag": tag, **c}
