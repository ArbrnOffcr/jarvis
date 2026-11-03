"""PKV-Einreichung im uniVersa-Kundenportal – JARVIS bedient den Browser selbst.

Einlernen (einmalig): JARVIS öffnet ein eigenes Browserfenster. Du reichst einen echten, offenen PKV-Antrag
einmal selbst ein; JARVIS schreibt jeden Schritt als „Rezept“ mit (Feld, Knopf, Auswahl, Hochladen).
- Passwortfelder werden NIE aufgezeichnet – schon im Browser wird der Wert durch {{passwort}} ersetzt.
- Der Anmeldecode kommt per E-Mail: JARVIS holt ihn aus dem Postfach (nur lokal per Regel, nie an die KI)
  und zeigt ihn im Fenster an; im Rezept steht nur {{mailcode}}.
- Werte deines Antrags (Kind, Summe, Rechnungsnummer …) werden zu Platzhaltern, damit das Rezept für jeden
  späteren Antrag passt.

Einreichen: Das Rezept wird lokal abgespielt – ohne Sprachmodell. Zugangsdaten kommen aus dem Schlüsselbund und
erst im Moment des Eintippens. Danach: Bestätigungsseite als PDF ins PKV-Archiv, Excel Spalte J ☑,
Erinnerung abgehakt, Meldung. Bei Unklarheit (Portal verändert, Captcha, kein Code) hört JARVIS auf, statt zu
raten – und klickt nach dem Absenden nie ein zweites Mal.

Freigabe: Einreichen ist BESTÄTIGEN. Mit der Befugnis „pkv_einreichen“ reicht JARVIS selbstständig ein
(täglich zur Antragszeit) und meldet nur noch."""
import email
import email.policy
import html as htmlmod
import json
import random
import re
import shutil
import threading
import time
from datetime import date, datetime, timedelta
from email.utils import parsedate_to_datetime
from pathlib import Path

from atlas.keystore import get_secret
from atlas.paths import LOCAL_DIR
from atlas.tools import S, Tool, ToolError

ORDNER = LOCAL_DIR / "pkv_portal"                 # lokal (nicht iCloud): Rezept, Browserprofil, Fehlerbilder
REZEPT = ORDNER / "rezept.json"
PROFIL = ORDNER / "browser"
SCHLUESSEL_BENUTZER, SCHLUESSEL_PASSWORT = "universa_benutzer", "universa_passwort"
START_URL = "https://www.universa.de/kundenportal"
MAX_RUNDEN_VORSCHLAG = 3                          # nach so vielen bestätigten Einreichungen Befugnis vorschlagen

# --------------------------------------------------------------------------- Aufzeichnung im Browser
AUFZEICHNER_JS = r"""
(() => {
  if (window.__jvAuf) return; window.__jvAuf = true;
  // Jede Meldung zusätzlich in sessionStorage: löst ein Klick sofort einen Seitenwechsel aus, geht sie sonst
  // verloren – die nächste Seite schickt sie nach (Python verwirft Doppelte über die id).
  const Q = 'jvWarteschlange';
  const lies = () => { try { return JSON.parse(sessionStorage.getItem(Q) || '[]'); } catch (e) { return []; } };
  const melde = (o) => {
    o.id = Date.now() + '-' + Math.random().toString(36).slice(2, 8);
    try { const q = lies(); q.push(o); sessionStorage.setItem(Q, JSON.stringify(q.slice(-40))); } catch (e) {}
    try { window.jvMelde(o); } catch (e) {}
  };
  setTimeout(() => { for (const o of lies()) { try { window.jvMelde(o); } catch (e) {} } }, 300);
  const cssPfad = (el) => {
    const teile = [];
    while (el && el.nodeType === 1 && teile.length < 6) {
      let t = el.tagName.toLowerCase();
      if (el.id && !/\d{3,}/.test(el.id)) { teile.unshift('#' + CSS.escape(el.id)); break; }
      const p = el.parentElement;
      if (p) { const gleiche = [...p.children].filter(k => k.tagName === el.tagName);
        if (gleiche.length > 1) t += ':nth-of-type(' + (gleiche.indexOf(el) + 1) + ')'; }
      teile.unshift(t); el = p;
    }
    return teile.join(' > ');
  };
  const beschreibe = (el) => {
    const k = [], tag = el.tagName.toLowerCase();
    if (el.id && !/\d{3,}/.test(el.id)) k.push('#' + CSS.escape(el.id));
    const n = el.getAttribute('name'); if (n) k.push(tag + '[name="' + n + '"]');
    const dt = el.getAttribute('data-testid') || el.getAttribute('data-test') || el.getAttribute('data-qa');
    if (dt) k.push('[data-testid="' + dt + '"],[data-test="' + dt + '"],[data-qa="' + dt + '"]');
    const a = el.getAttribute('aria-label'); if (a) k.push(tag + '[aria-label="' + a + '"]');
    const ph = el.getAttribute('placeholder'); if (ph) k.push(tag + '[placeholder="' + ph + '"]');
    const eingabe = /^(input|textarea|select)$/.test(tag) && !/^(submit|button|reset)$/.test((el.type || '').toLowerCase());
    const text = eingabe ? '' : (el.innerText || el.value || '').trim().replace(/\s+/g, ' ');   // nie Feldinhalte
    if (text && text.length < 60 && /^(button|a|label|span|div|li)$/.test(tag)) k.push('text="' + text + '"');
    k.push(cssPfad(el));
    const lab = (el.labels && el.labels[0]) ? el.labels[0].innerText.trim().replace(/\s+/g, ' ') : '';
    return { kandidaten: k, tag, typ: (el.type || '').toLowerCase(), text: text.slice(0, 80), label: lab.slice(0, 80),
             autocomplete: el.getAttribute('autocomplete') || '', mehrfach: !!el.multiple };
  };
  const imFenster = (el) => el && el.closest && el.closest('#jv-leiste');
  const gemeldet = new WeakMap();                  // zuletzt gemeldeter Wert je Feld
  const feldMelden = (el) => {
    const tag = el.tagName.toLowerCase(), typ = (el.type || '').toLowerCase();
    if (!(tag === 'input' || tag === 'textarea') || /^(file|checkbox|radio|submit|button|reset|image)$/.test(typ)) return;
    if (gemeldet.get(el) === el.value) return;
    gemeldet.set(el, el.value);
    // Passwort verlässt den Browser nie. Verdeckte Felder mit 4–8 Ziffern sind meist der Code aus der Mail.
    const wert = typ === 'password' ? (/^\d{4,8}$/.test(el.value) ? '{{ziffern}}' : '{{passwort}}') : el.value;
    melde({ art: 'fuellen', url: location.href, wert, ...beschreibe(el) });
  };
  let letzterKlick = 0;
  document.addEventListener('pointerdown', (e) => {
    if (imFenster(e.target)) return;
    const aktiv = document.activeElement;            // Feld, das gerade verlassen wird, zuerst melden
    if (aktiv && aktiv !== e.target && !imFenster(aktiv)) feldMelden(aktiv);
    const el = e.target.closest('button,a,[role=button],[role=option],[role=tab],[role=menuitem],input[type=submit],input[type=button],input[type=checkbox],input[type=radio],label,summary,[onclick]') || e.target;
    const tag = el.tagName.toLowerCase(), typ = (el.type || '').toLowerCase();
    if ((tag === 'input' && !/^(submit|button|checkbox|radio|image)$/.test(typ)) || tag === 'textarea' || tag === 'select') return;
    if (typ === 'file') return;
    const jetzt = Date.now(); if (jetzt - letzterKlick < 80) return; letzterKlick = jetzt;
    const kasten = (typ === 'checkbox' || typ === 'radio') ? el : (tag === 'label' && el.control && /^(checkbox|radio)$/.test(el.control.type) ? el.control : null);
    melde({ art: 'klick', url: location.href, ...beschreibe(el), ...(kasten ? { ankreuzen: !kasten.checked } : {}) });
  }, true);
  document.addEventListener('change', (e) => {
    const el = e.target; if (imFenster(el)) return;
    const tag = el.tagName.toLowerCase(), typ = (el.type || '').toLowerCase();
    if (typ === 'file') { melde({ art: 'hochladen', url: location.href, dateien: [...el.files].map(f => f.name), ...beschreibe(el) }); return; }
    if (tag === 'select') { const o = el.options[el.selectedIndex];
      melde({ art: 'waehlen', url: location.href, wert: el.value, wahltext: o ? o.text.trim() : '', ...beschreibe(el) }); return; }
    if (/^(checkbox|radio|submit|button)$/.test(typ)) return;
    feldMelden(el);
  }, true);
  document.addEventListener('keydown', (e) => {     // Enter schickt Formulare ab – Feld vorher melden
    if (e.key === 'Enter' && !imFenster(e.target)) feldMelden(e.target);
  }, true);
  const leiste = () => {
    if (document.getElementById('jv-leiste') || !document.body) return;
    const d = document.createElement('div'); d.id = 'jv-leiste';
    d.style.cssText = 'position:fixed;z-index:2147483647;right:14px;bottom:14px;background:#03111c;color:#cfefff;font:13px -apple-system,sans-serif;padding:10px 12px;border:1px solid #2fa8ff;box-shadow:0 4px 18px rgba(0,0,0,.4);max-width:330px';
    d.innerHTML = '<b style="color:#2fa8ff;letter-spacing:.12em">JARVIS LERNT MIT</b><div id="jv-text" style="margin:6px 0 8px">Reiche den Antrag ganz normal ein. Bei „Durchsuchen“ lege ich die Belege selbst ein. Passwörter zeichne ich nicht auf.</div>' +
      '<button id="jv-belege" style="margin:0 6px 6px 0">Belege einlegen</button><button id="jv-absenden" style="margin-right:6px">Nächster Klick = Absenden</button><button id="jv-fertig">Fertig</button>';
    document.body.appendChild(d);
    d.querySelector('#jv-belege').onclick = (e) => { e.stopPropagation(); melde({ art: 'markierung', was: 'belege' }); };
    d.querySelector('#jv-absenden').onclick = (e) => { e.stopPropagation(); melde({ art: 'markierung', was: 'absenden' });
      d.querySelector('#jv-absenden').textContent = '✓ markiert'; };
    d.querySelector('#jv-fertig').onclick = (e) => { e.stopPropagation(); melde({ art: 'markierung', was: 'fertig' }); };
  };
  window.jvText = (t) => { leiste(); const x = document.getElementById('jv-text'); if (x) x.textContent = t; };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', leiste); else leiste();
  window.addEventListener('load', leiste);
})();
"""

CAPTCHA = re.compile(r"recaptcha|hcaptcha|turnstile|captcha|ich bin kein roboter|i'm not a robot", re.I)


# --------------------------------------------------------------------------- reine Hilfsfunktionen (getestet)
def betrag_varianten(x: float) -> set[str]:
    a = f"{x:.2f}"
    return {a, a.replace(".", ","), f"{x:,.2f}".replace(",", "X").replace(".", ",").replace("X", "."),
            f"{x:g}", f"{x:g}".replace(".", ",")}


def datum_varianten(d) -> set[str]:
    if not d:
        return set()
    if isinstance(d, str):
        try:
            d = date.fromisoformat(d[:10])
        except ValueError:
            return set()
    return {d.strftime("%d.%m.%Y"), d.isoformat(), d.strftime("%d.%m.%y")}


def platzhalter_werte(kontext: dict) -> dict[str, set[str]]:
    """Welche Werte im Rezept durch Platzhalter ersetzt werden (längere zuerst)."""
    w: dict[str, set[str]] = {}
    if kontext.get("benutzer"):
        w["benutzer"] = {kontext["benutzer"]}
    if kontext.get("mailcode"):
        mc = kontext["mailcode"]
        w["mailcode"] = set(mc) if isinstance(mc, (list, set, tuple)) else {mc}
    if kontext.get("kind_name"):
        w["kind_name"] = {kontext["kind_name"]}
        vor = kontext["kind_name"].split()[0]
        w["kind_vorname"] = {vor}
    if kontext.get("summe") is not None:
        w["summe"] = betrag_varianten(float(kontext["summe"]))
    if len(kontext.get("belege") or []) == 1:
        b = kontext["belege"][0]
        if b.get("nr"):
            w["rechnungsnummer"] = {b["nr"]}
        if b.get("datum"):
            w["rechnungsdatum"] = datum_varianten(b["datum"])
        if b.get("betrag") is not None:
            w.setdefault("summe", set()).update(betrag_varianten(float(b["betrag"])))
    w["anzahl"] = {str(len(kontext.get("belege") or []))} if kontext.get("belege") else set()
    w["heute"] = datum_varianten(date.today())
    return w


def ersetzen(wert: str, werte: dict[str, set[str]]) -> str:
    """Ganzen Feldwert durch einen Platzhalter ersetzen, wenn er einem bekannten Wert entspricht."""
    if wert is None:
        return ""
    s = str(wert).strip()
    if s.startswith("{{") and s.endswith("}}"):
        return s
    for name in ("mailcode", "benutzer", "kind_name", "rechnungsnummer", "summe", "rechnungsdatum", "heute",
                 "kind_vorname", "anzahl"):
        if s and s in (werte.get(name) or set()):
            return "{{" + name + "}}"
    return s


def einsetzen(wert: str, werte: dict[str, str]) -> str:
    return re.sub(r"\{\{(\w+)\}\}", lambda m: str(werte.get(m.group(1), m.group(0))), str(wert or ""))


def code_aus_text(text: str, streng: bool = False) -> str | None:
    """Anmeldecode aus einer Mail (Betreff + Text). Bevorzugt eine Zahl nahe bei „Code“/„TAN“/„PIN“;
    streng = nur mit diesem Stichwort (beim Einlernen, solange der Absender noch unbekannt ist)."""
    t = re.sub(r"\s+", " ", text or "")
    m = re.search(r"(?:code|tan|pin|kennwort|passcode)\w*\b[^0-9]{0,60}?\b(\d{4,8})\b", t, re.I)
    if m:
        return m.group(1)
    if streng:
        return None
    m = re.search(r"\b(\d{6})\b", t)
    return m.group(1) if m else None


CODE_FELD = re.compile(r"code|\btan\b|otp|one-time|bestätigung|bestaetigung|sicherheits|einmal|verif", re.I)
SENDEN = re.compile(r"absenden|abschicken|einreichen|senden|übermitteln|uebermitteln|beantragen|bestätigen", re.I)


def rezept_bauen(ereignisse: list[dict], kontext: dict, erfolg: dict | None = None) -> dict:
    """Aufgezeichnete Ereignisse → Rezept: Platzhalter, Anmeldeschritte optional, doppelte Eingaben zusammengefasst."""
    werte = platzhalter_werte(kontext)
    schritte: list[dict] = []
    absenden_folgt = False
    for e in ereignisse:
        if e.get("art") == "markierung":
            if e.get("was") == "absenden":
                absenden_folgt = True
            continue
        s = {k: e[k] for k in ("art", "kandidaten", "tag", "typ", "text", "label", "mehrfach", "ankreuzen") if k in e}
        if e.get("art") in ("fuellen", "waehlen"):
            s["wert"] = ersetzen(e.get("wert", ""), werte)
            if e.get("typ") == "password":
                # verdecktes Feld: Code aus der Mail (Beschriftung/Ziffern, nach dem Passwort) oder das Passwort
                codeartig = bool(CODE_FELD.search(" ".join([e.get("label") or "", e.get("autocomplete") or "",
                                                             *[str(k) for k in e.get("kandidaten") or []]])))
                schon_pw = any(x.get("wert") == "{{passwort}}" for x in schritte)
                s["wert"] = "{{mailcode}}" if (codeartig or (e.get("wert") == "{{ziffern}}" and schon_pw)) else "{{passwort}}"
            if e.get("art") == "waehlen":
                s["wahltext"] = ersetzen(e.get("wahltext", ""), werte)
            # gleiche Feld zweimal hintereinander gefüllt → nur der letzte Wert zählt
            if schritte and schritte[-1]["art"] == s["art"] and schritte[-1].get("kandidaten") == s.get("kandidaten"):
                schritte.pop()
        if e.get("art") == "hochladen":
            s["wert"] = "{{belege}}"
        if e.get("art") == "klick" and absenden_folgt:
            s["absenden"] = True
            absenden_folgt = False
        schritte.append(s)
    # Anmeldung: vom Benutzernamen bis zum Klick nach dem Mailcode (bzw. nach dem Passwort) optional –
    # ist die Sitzung noch gültig, überspringt JARVIS sie.
    i0 = next((i for i, s in enumerate(schritte) if s.get("wert") == "{{benutzer}}"), None)
    if i0 is not None:
        ende = next((i for i, s in enumerate(schritte) if s.get("wert") == "{{mailcode}}"), None)
        if ende is None:
            ende = next((i for i, s in enumerate(schritte) if s.get("wert") == "{{passwort}}"), i0)
        k = next((i for i in range(ende + 1, len(schritte)) if schritte[i]["art"] == "klick"), ende)
        for i in range(i0, k + 1):
            schritte[i]["anmeldung"] = True
    for s in schritte:
        if s.get("wert") == "{{mailcode}}":
            s["art"] = "mailcode"
    # Absende-Klick vergessen zu markieren? Dann gilt der letzte „Senden/Einreichen“-Klick nach dem Hochladen.
    geraten = False
    if not any(s.get("absenden") for s in schritte):
        hoch = max((i for i, s in enumerate(schritte) if s["art"] == "hochladen"), default=None)
        if hoch is not None:
            k = next((i for i in range(len(schritte) - 1, hoch, -1) if schritte[i]["art"] == "klick"
                      and SENDEN.search(f"{schritte[i].get('text', '')} {schritte[i].get('label', '')}")), None)
            if k is not None:
                schritte[k]["absenden"] = geraten = True
    # niemals ein Klartext-Passwort oder ein Code im Rezept (zweite Sicherung): betroffene Felder ersetzen
    mc = kontext.get("mailcode")
    mcs = list(mc) if isinstance(mc, (list, set, tuple)) else [mc]
    geheim = [(x, n) for x, n in [(kontext.get("passwort"), "{{passwort}}"), *[(c, "{{mailcode}}") for c in mcs]] if x]
    for s in schritte:
        for feld, v in list(s.items()):
            if isinstance(v, str):
                for x, n in geheim:
                    if x in v:
                        s[feld] = n if feld == "wert" else ""
            elif isinstance(v, list):
                s[feld] = [k for k in v if not any(x in str(k) for x, _ in geheim)]
    return {"version": 1, "portal": "uniVersa", "eingelernt": datetime.now().isoformat(timespec="minutes"),
            "start_url": kontext.get("start_url") or START_URL, "mail_absender": kontext.get("mail_absender", ""),
            "schritte": schritte, "erfolg": erfolg or {}, "hat_absenden": any(s.get("absenden") for s in schritte),
            "absenden_geraten": geraten}


def belege_zusammenfuegen(dateien: list[Path], ziel: Path) -> Path:
    """Mehrere Belege (PDF/Bild) zu einem PDF – für Portale, die nur eine Datei je Antrag annehmen."""
    import fitz
    doc = fitz.open()
    for f in dateien:
        if f.suffix.lower() == ".pdf":
            with fitz.open(f) as src:
                doc.insert_pdf(src)
        else:
            with fitz.open(f) as img:
                with fitz.open("pdf", img.convert_to_pdf()) as src:
                    doc.insert_pdf(src)
    ziel.parent.mkdir(parents=True, exist_ok=True)
    doc.save(ziel)
    doc.close()
    return ziel


# --------------------------------------------------------------------------- Mailcode
class MailCode:
    def __init__(self, core):
        self.c = core

    def neue_codes(self, seit: datetime, absender: str = "") -> list[dict]:
        from atlas.tools.mail import Mail, _h
        m = Mail(self.c.secrets, self.c.cfg)._imap()
        try:
            m.select("INBOX", readonly=True)
            krit = ["SINCE", (seit - timedelta(days=1)).strftime("%d-%b-%Y")]
            if absender:
                krit += ["FROM", absender]
            typ, data = m.uid("SEARCH", None, *krit)
            uids = (data[0] or b"").split()[-15:]
            out = []
            for uid in reversed(uids):
                typ, d = m.uid("FETCH", uid, "(BODY.PEEK[])")
                raw = next((p[1] for p in d if isinstance(p, tuple)), None)
                if not raw:
                    continue
                msg = email.message_from_bytes(raw, policy=email.policy.default)
                try:
                    zeit = parsedate_to_datetime(msg["Date"]).astimezone().replace(tzinfo=None)
                except Exception:
                    continue
                if zeit < seit - timedelta(seconds=90):
                    continue
                body = msg.get_body(preferencelist=("plain", "html"))
                text = body.get_content() if body else ""
                if body is not None and body.get_content_type() == "text/html":
                    text = htmlmod.unescape(re.sub(r"<[^>]+>", " ", text))
                code = code_aus_text(f"{_h(msg['Subject'])} {text}", streng=not absender)
                if code:
                    von = _h(msg["From"])
                    adr = re.search(r"[\w.+-]+@([\w-]+\.)+\w+", von)
                    out.append({"code": code, "von": adr.group(0) if adr else von, "zeit": zeit})
            return out
        finally:
            m.logout()

    def warten(self, seit: datetime, absender: str = "", timeout: int = 180, stop=None) -> dict | None:
        ende = time.time() + timeout
        while time.time() < ende:
            if stop and stop.is_set():
                return None
            try:
                codes = self.neue_codes(seit, absender)
                if codes:
                    return codes[0]
            except Exception as e:
                self.c.audit.log("fehler", bereich="pkv_mailcode", text=str(e)[:200])
            time.sleep(8)
        return None


# --------------------------------------------------------------------------- Browser
def _browser(pw, sichtbar: bool, art: str = "webkit"):
    """Standard: WebKit – die Browser-Technik von Safari, ohne dass Chrome installiert sein muss.
    Safari selbst lässt sich nicht fernsteuern, ohne dass es Hochladen und Anmeldecookies verliert."""
    opt = dict(headless=not sichtbar, locale="de-DE", accept_downloads=False, viewport={"width": 1280, "height": 860})
    versuche = {"webkit": [("webkit", {}), ("chromium", {})],
                "chrome": [("chromium", {"channel": "chrome"}), ("webkit", {}), ("chromium", {})],
                "chromium": [("chromium", {}), ("webkit", {})]}.get(art, [("webkit", {}), ("chromium", {})])
    fehler = None
    for motor, extra in versuche:
        profil = PROFIL / (extra.get("channel") or motor)       # Profile der Browser sind nicht austauschbar
        profil.mkdir(parents=True, exist_ok=True)
        try:
            ORDNER.chmod(0o700)
        except OSError:
            pass
        try:
            return getattr(pw, motor).launch_persistent_context(user_data_dir=str(profil), **opt, **extra)
        except Exception as e:
            fehler = e
    raise ToolError(f"Kein Browser startbar ({type(fehler).__name__}). Bitte 'jarvis setup universa' ausführen.")


def _playwright():
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        raise ToolError("Für die Browsersteuerung fehlt Playwright. Bitte einmal 'jarvis setup universa' ausführen.")
    return sync_playwright


class Abbruch(Exception):
    """Ablauf gestoppt – Grund steht im Text (ohne Geheimnisse)."""


class PkvPortal:
    def __init__(self, core):
        self.c = core
        self.cfg = (core.cfg.get("beihilfe") or {}).get("pkv_portal") or {}
        self.lock = threading.Lock()
        self.laeuft = ""
        self.lernen_stop = threading.Event()
        self.lernen_start = {"ereignis": threading.Event(), "fehler": None}

    def melden(self, text: str, einmal: str = "") -> None:
        """Ergebnisse der Browsersteuerung sofort zustellen – nicht im Hinweis-Stapel parken."""
        if einmal:
            if einmal in self.bh.meldungen_einmal:
                return
            self.bh.meldungen_einmal.add(einmal)
        self.c.audit.log("pkv_portal", text=text[:300])
        try:
            self.c.proaktiv.hint(text, dringend=True)
        except Exception:
            self.c.broadcast({"type": "hinweis", "text": text})

    # ------------------------------------------------------------ Zustand
    @property
    def bh(self):
        return self.c.beihilfe

    def rezept(self) -> dict | None:
        try:
            return json.loads(REZEPT.read_text(encoding="utf-8"))
        except (OSError, ValueError):
            return None

    def zugang(self) -> tuple[str | None, bool]:
        return get_secret(SCHLUESSEL_BENUTZER), bool(get_secret(SCHLUESSEL_PASSWORT))

    def offen(self) -> dict[str, list[dict]]:
        """Offene PKV-Belege je Kind (Kürzel): erfasst, aber PKV-Antrag noch nicht gestellt."""
        z = self.bh.zustand()
        try:
            ex = {(x["kind"], str(x["nr"])): x for x in self.bh.excel_zeilen() if x["kind"]}
        except Exception:
            ex = {}
        out: dict[str, list[dict]] = {}
        archiv = self.bh.pfad("rechnungsarchiv")
        for key, r in z["rechnungen"].items():
            if (r.get("erledigt") or {}).get("pkv"):
                continue
            x = ex.get((r.get("kind"), str(r.get("nr"))))
            if x and x["pkv_antrag"]:
                continue
            datei = archiv / r["datei"] if archiv and r.get("datei") else None
            if not datei or not datei.exists():
                continue
            out.setdefault(r["kuerzel"], []).append({"key": key, "nr": r["nr"], "datum": r.get("datum"),
                                                     "betrag": r.get("betrag"), "datei": datei, "zeile": r.get("zeile"),
                                                     "kind": r.get("kind")})
        return out

    def alle_offen(self) -> list[dict]:
        """Ein Antrag für alle offenen Rechnungen – das Portal fragt nicht nach dem Kind."""
        return [b for bel in self.offen().values() for b in bel]

    def kurz(self, belege: list[dict] | None = None) -> str:
        from atlas.workflows.beihilfe import euro
        belege = self.alle_offen() if belege is None else belege
        if not belege:
            return "keine offenen Belege"
        je = {}
        for b in belege:
            je[b["kind"]] = je.get(b["kind"], 0) + 1
        return (f"{len(belege)} Rechnung{'en' if len(belege) != 1 else ''} "
                f"({', '.join(f'{k} {n}' for k, n in je.items())}), {euro(sum(b['betrag'] or 0 for b in belege))}")

    def status(self) -> dict:
        r = self.rezept()
        benutzer, pw = self.zugang()
        z = self.bh.zustand().get("pkv_portal", {})
        return {"eingelernt": bool(r and r.get("hat_absenden")),
                "eingelernt_am": (r or {}).get("eingelernt"), "schritte": len((r or {}).get("schritte", [])),
                "zugang_im_schluesselbund": bool(benutzer and pw), "offen": self.kurz(),
                "selbststaendig": self._befugnis()[0], "laeuft": self.laeuft or None,
                "einreichungen": len(z.get("verlauf", [])), "letzte": (z.get("verlauf") or [None])[-1]}

    # ------------------------------------------------------------ Befugnis
    def _befugnis(self) -> tuple[bool, str]:
        try:
            from atlas.permissions import Level
            tool = self.c.tools.get("pkv_einreichen")
            if not tool:
                return False, ""
            lvl, _, rid = self.c.befugnisse.pruefen(tool, {}, Level.BESTAETIGEN)
            return lvl == Level.MELDEN and bool(rid), rid
        except Exception:
            return False, ""

    # ------------------------------------------------------------ Belege vorbereiten
    def vorbereiten(self, belege: list[dict]) -> dict:
        tag = date.today().isoformat()
        d = ORDNER / "einreichen" / tag
        if d.exists():
            shutil.rmtree(d, ignore_errors=True)
        d.mkdir(parents=True)
        einzeln = []
        for b in belege:
            ziel = d / b["datei"].name
            shutil.copy2(b["datei"], ziel)
            einzeln.append(ziel)
        try:
            gesamt = belege_zusammenfuegen(einzeln, d / f"PKV-Antrag {tag}.pdf") if len(einzeln) > 1 else einzeln[0]
        except Exception:
            gesamt = einzeln[0]
        return {"ordner": d, "einzeln": einzeln, "gesamt": gesamt}

    def _kontext(self, belege: list[dict]) -> dict:
        kinder = {b["kind"] for b in belege}
        name = ""
        if len(kinder) == 1:                         # nur falls ein Portal doch einmal eine Person abfragt
            kind = next((k for k in (self.bh.kinder() or {}).values() if k.get("tabelle") in kinder), {})
            name = kind.get("name") or next(iter(kinder))
        return {"kind_name": name,
                "summe": round(sum(b["betrag"] or 0 for b in belege), 2), "belege": belege}

    # ------------------------------------------------------------ Einlernen
    def einlernen(self) -> dict:
        if self.laeuft:
            raise ToolError(f"Es läuft schon: {self.laeuft}")
        benutzer, pw = self.zugang()
        if not (benutzer and pw):
            raise ToolError("Zugangsdaten fehlen. Bitte einmal 'jarvis setup universa' im Terminal ausführen "
                            "(Benutzername und Passwort landen nur im Schlüsselbund).")
        belege = self.alle_offen()
        if not belege:
            raise ToolError("Zum Einlernen brauche ich einen echten offenen PKV-Antrag – im Moment gibt es keinen. "
                            "Sobald die nächste Arztrechnung erfasst ist, geht es.")
        _playwright()
        self.lernen_stop.clear()
        self.lernen_start = {"ereignis": threading.Event(), "fehler": None}
        threading.Thread(target=self._einlernen, args=(belege,), name="pkv_einlernen", daemon=True).start()
        if not self.lernen_start["ereignis"].wait(45):
            return {"ok": False, "hinweis": "Das Browserfenster startet ungewöhnlich langsam – ich melde mich, sobald es da ist."}
        if self.lernen_start["fehler"]:
            raise ToolError(f"Browserfenster ließ sich nicht öffnen: {self.lernen_start['fehler']}")
        return {"ok": True, "hinweis": f"Browserfenster ist offen. Reiche die offenen Rechnungen ({self.kurz(belege)}) "
                f"einmal ganz normal selbst ein – alle in einem Antrag. Vor dem letzten Klick auf „Nächster Klick = "
                f"Absenden“ tippen, danach „Fertig“. Die Belege liegen im Ordner, den das Fenster anzeigt."}

    def _einlernen(self, belege: list[dict]) -> None:
        self.laeuft = "Einlernen"
        ereignisse: list[dict] = []
        start = datetime.now()
        info = {"code": None, "codes": set(), "von": "", "erfolg": {}, "fertig": False, "abgesendet": False, "beweis": None}
        vor = None
        try:
            vor = self.vorbereiten(belege)
            with _playwright()() as p:
                ctx = _browser(p, True, self.cfg.get("browser", "webkit"))
                page = ctx.pages[0] if ctx.pages else ctx.new_page()

                gesehen: set = set()

                def melde(_src, obj):
                    if not isinstance(obj, dict) or obj.get("id") in gesehen:
                        return
                    gesehen.add(obj.get("id"))
                    if obj.get("art") == "markierung" and obj.get("was") == "fertig":
                        info["fertig"] = True
                        return
                    if obj.get("art") == "markierung" and obj.get("was") == "belege":
                        info["belege_einlegen"] = True
                        return
                    ereignisse.append(obj)

                ctx.expose_binding("jvMelde", melde)
                ctx.add_init_script(AUFZEICHNER_JS)
                # „Durchsuchen“: Der gesteuerte Browser zeigt keinen Mac-Dateidialog – JARVIS legt die vorbereiteten
                # Belege selbst ein (mehrere erlaubt → einzeln, sonst als ein zusammengefügtes PDF).
                waehler = self.dateiwahl(vor)
                for pg in ctx.pages:
                    pg.on("filechooser", waehler)
                ctx.on("page", lambda pg: pg.on("filechooser", waehler))
                page.goto(self.cfg.get("start_url") or START_URL, wait_until="domcontentloaded")
                self.lernen_start["ereignis"].set()              # Fenster und Portal sind da
                start_url = page.url
                text = f"Belege liegen bereit in: {vor['ordner']}"
                gezeigt, letzter_mailblick, letzter_hinweis = "", 0.0, 0.0
                ende = time.time() + 25 * 60
                while not info["fertig"] and time.time() < ende and not self.lernen_stop.is_set():
                    try:
                        page = ctx.pages[-1] if ctx.pages else page
                        if not ctx.pages:
                            break
                        # Anmeldecode aus der Mail holen und im Fenster zeigen (nur lokal)
                        if time.time() - letzter_mailblick > 10:        # jeder neue Code (auch „Code erneut senden“)
                            letzter_mailblick = time.time()
                            try:
                                codes = MailCode(self.c).neue_codes(start)
                                if codes:
                                    info["code"], info["von"] = codes[0]["code"], codes[0]["von"]
                                    info["codes"].update(c["code"] for c in codes)
                            except Exception:
                                pass
                        t = text + (f" · Code aus deiner Mail: {info['code']}" if info["code"] else "")
                        if t != gezeigt or time.time() - letzter_hinweis > 3:   # nach jedem Seitenwechsel neu zeigen
                            page.evaluate("t => window.jvText && window.jvText(t)", t)
                            gezeigt, letzter_hinweis = t, time.time()
                        if info.pop("belege_einlegen", False):          # Knopf in der Leiste (z. B. nur Drag & Drop)
                            if not self.belege_einlegen(page, vor):
                                page.evaluate("t => window.jvText && window.jvText(t)",
                                              "Hier finde ich kein Upload-Feld – bitte erst die Seite mit dem Upload öffnen.")
                                letzter_hinweis = time.time() + 4
                        # nach dem markierten Absende-Klick: Bestätigungsseite merken
                        if not info["abgesendet"] and any(e.get("art") == "klick" for e in self._nach_markierung(ereignisse)):
                            info["abgesendet"] = True
                            page.wait_for_timeout(4000)
                            info["erfolg"] = self._seitenmerkmal(page)
                            info["beweis"] = page.screenshot(full_page=True)
                    except Exception:
                        pass
                    try:
                        page.wait_for_timeout(500)              # hält Playwright am Laufen (Meldungen kommen an)
                    except Exception:
                        time.sleep(0.5)
                if not info["abgesendet"]:
                    try:
                        info["erfolg_spaet"] = self._seitenmerkmal(page)
                    except Exception:
                        pass
                try:
                    ctx.close()
                except Exception:
                    pass
            kontext = {**self._kontext(belege), "benutzer": get_secret(SCHLUESSEL_BENUTZER),
                       "passwort": get_secret(SCHLUESSEL_PASSWORT), "mailcode": sorted(info["codes"]),
                       "mail_absender": info["von"], "start_url": start_url}
            r = rezept_bauen(ereignisse, kontext, info["erfolg"])
            if r.get("absenden_geraten") and not r["erfolg"]:
                r["erfolg"] = info.get("erfolg_spaet") or {}
            ORDNER.mkdir(parents=True, exist_ok=True)
            REZEPT.write_text(json.dumps(r, ensure_ascii=False, indent=1), encoding="utf-8")
            REZEPT.chmod(0o600)
            self.c.audit.log("pkv_portal", aktion="eingelernt", schritte=len(r["schritte"]), absenden=r["hat_absenden"])
            if info["abgesendet"]:
                self._erledigt(belege, info["beweis"], "beim Einlernen von dir abgesendet")
            if r.get("absenden_geraten"):
                self.melden(f"PKV-Einreichung eingelernt ({len(r['schritte'])} Schritte). Den Absende-Knopf hast du "
                            f"nicht markiert – ich habe den letzten Klick „{next(s.get('text') for s in r['schritte'] if s.get('absenden'))}“ "
                            f"dafür genommen. Falls du den Antrag wirklich abgeschickt hast, hake die PKV-Erinnerungen "
                            f"ab, dann trage ich es in Excel ein.")
            elif r["hat_absenden"]:
                self.melden(f"PKV-Einreichung eingelernt ({len(r['schritte'])} Schritte). Ab jetzt kann ich "
                               f"PKV-Anträge selbst stellen – sag einfach „Reiche die PKV ein“.")
            else:
                self.melden("Einlernen beendet, aber ohne markierten Absende-Klick. Bitte noch einmal einlernen "
                               "und vor dem letzten Klick „Nächster Klick = Absenden“ tippen.")
        except Exception as e:
            self.c.audit.log("fehler", bereich="pkv_einlernen", text=f"{type(e).__name__}: {e}"[:300])
            self.lernen_start["fehler"] = f"{type(e).__name__}: {e}"[:300]
            self.lernen_start["ereignis"].set()
            self.melden(f"Einlernen abgebrochen: {e}")
        finally:
            if vor:
                shutil.rmtree(vor["ordner"], ignore_errors=True)
            self.lernen_start["ereignis"].set()
            self.laeuft = ""

    @staticmethod
    def dateiwahl(vor: dict):
        def waehlen(fc):
            fc.set_files([str(x) for x in (vor["einzeln"] if fc.is_multiple() else [vor["gesamt"]])])
        return waehlen

    @staticmethod
    def belege_einlegen(page, vor: dict) -> bool:
        for frame in page.frames:
            loc = frame.locator("input[type=file]")
            try:
                if loc.count():
                    el = loc.first
                    mehrfach = bool(el.evaluate("e => e.multiple"))
                    el.set_input_files([str(x) for x in (vor["einzeln"] if mehrfach else [vor["gesamt"]])])
                    return True
            except Exception:
                continue
        return False

    @staticmethod
    def _nach_markierung(ereignisse: list[dict]) -> list[dict]:
        idx = max((i for i, e in enumerate(ereignisse) if e.get("art") == "markierung" and e.get("was") == "absenden"),
                  default=None)
        return ereignisse[idx + 1:] if idx is not None else []

    @staticmethod
    def _seitenmerkmal(page) -> dict:
        try:
            ueberschrift = page.evaluate("() => { const h = document.querySelector('h1,h2,[role=heading],.alert-success,.success');"
                                         " return h ? h.innerText.trim().slice(0, 80) : ''; }")
        except Exception:
            ueberschrift = ""
        url = page.url.split("?")[0]
        return {"url_teil": "/".join(url.split("/")[-2:]), "text": ueberschrift}

    # ------------------------------------------------------------ Einreichen
    def einreichen(self, selbststaendig: bool = False) -> dict:
        if self.laeuft:
            raise ToolError(f"Es läuft schon: {self.laeuft}")
        r = self.rezept()
        if not r or not r.get("hat_absenden"):
            raise ToolError("Die PKV-Einreichung ist noch nicht eingelernt. Sag „Lerne die PKV-Einreichung“.")
        benutzer, pw = self.zugang()
        if not (benutzer and pw):
            raise ToolError("Zugangsdaten fehlen im Schlüsselbund – 'jarvis setup universa'.")
        belege = self.alle_offen()
        if not belege:
            return {"ok": True, "ergebnis": "Keine offenen PKV-Belege."}
        _playwright()
        threading.Thread(target=self._einreichen_alle, args=(r, belege, selbststaendig),
                         name="pkv_einreichen", daemon=True).start()
        return {"ok": True, "ergebnis": f"Ich reiche ein: {self.kurz(belege)}. Das dauert ein bis drei Minuten – "
                                        f"ich melde mich mit dem Ergebnis."}

    def _einreichen_alle(self, r: dict, belege: list[dict], selbststaendig: bool) -> None:
        with self.lock:
            self.laeuft = "PKV-Antrag"
            try:
                beweis, merkmal_ok = self._abspielen(r, belege)
                self._erledigt(belege, beweis, "selbstständig" if selbststaendig else "auf deinen Auftrag",
                               unsicher=not merkmal_ok)
            except Abbruch as e:
                self.c.audit.log("pkv_portal", aktion="abbruch", belege=len(belege), grund=str(e)[:200])
                self.melden(f"PKV-Antrag nicht gestellt: {e}")
            except Exception as e:
                self.c.audit.log("fehler", bereich="pkv_einreichen", text=f"{type(e).__name__}: {e}"[:300])
                self.melden(f"PKV-Antrag: unerwarteter Fehler ({type(e).__name__}). Bitte im Portal nachsehen, "
                               f"bevor ich es noch einmal versuche.")
            finally:
                self.laeuft = ""
            self._vorschlagen()

    def _abspielen(self, r: dict, belege: list[dict]) -> tuple[bytes | None, bool]:
        vor = self.vorbereiten(belege)
        kontext = self._kontext(belege)
        werte = {"benutzer": get_secret(SCHLUESSEL_BENUTZER), "kind_name": kontext["kind_name"],
                 "kind_vorname": (kontext["kind_name"].split() or [""])[0], "anzahl": str(len(belege)),
                 "summe": f"{kontext['summe']:.2f}".replace(".", ","), "heute": date.today().strftime("%d.%m.%Y")}
        if len(belege) == 1:
            werte["rechnungsnummer"] = belege[0]["nr"]
            werte["rechnungsdatum"] = next(iter(sorted(datum_varianten(belege[0]["datum"]))), "")
            for v in datum_varianten(belege[0]["datum"]):
                if re.fullmatch(r"\d\d\.\d\d\.\d{4}", v):
                    werte["rechnungsdatum"] = v
        dialog_dateien = {"gesetzt": False}
        letzter_klick = datetime.now()
        abgesendet = False
        try:
            with _playwright()() as p:
                ctx = _browser(p, bool(self.cfg.get("sichtbar", True)), self.cfg.get("browser", "webkit"))
                page = ctx.pages[0] if ctx.pages else ctx.new_page()

                def dateiwahl(fc):
                    fc.set_files([str(x) for x in (vor["einzeln"] if fc.is_multiple() else [vor["gesamt"]])])
                    dialog_dateien["gesetzt"] = True
                page.on("filechooser", dateiwahl)
                ctx.on("page", lambda pg: pg.on("filechooser", dateiwahl))
                page.goto(r.get("start_url") or START_URL, wait_until="domcontentloaded")
                schritte = r["schritte"]
                i = 0
                while i < len(schritte):
                    s = schritte[i]
                    self._captcha(page)
                    if s.get("absenden"):
                        if abgesendet:
                            raise Abbruch("Ablauf wollte ein zweites Mal absenden – gestoppt")
                    el = self._finden(page, s, 10 if s.get("anmeldung") else 15)
                    if el is None and s["art"] == "mailcode":
                        # Code-Feld erscheint erst nach dem Anmelde-Klick – hat der nicht ausgelöst, einmal erneut drücken
                        vorher = next((schritte[k] for k in range(i - 1, -1, -1) if schritte[k]["art"] == "klick"), None)
                        knopf = self._finden(page, vorher, 3) if vorher else None
                        if knopf is not None:
                            letzter_klick = datetime.now()
                            knopf.click()
                            el = self._finden(page, s, 15)
                    if el is None:
                        if s.get("anmeldung"):          # Sitzung noch gültig → Anmeldung überspringen
                            j = next((k for k in range(i, len(schritte)) if not schritte[k].get("anmeldung")), len(schritte))
                            if j < len(schritte) and self._finden(page, schritte[j], 8) is not None:
                                i = j
                                continue
                        self._fehlerbild(page)
                        raise Abbruch(f"Schritt {i + 1} nicht gefunden („{s.get('label') or s.get('text') or s['art']}“) – "
                                      f"das Portal hat sich vielleicht verändert. Bitte einmal neu einlernen.")
                    self._menschlich()
                    art = s["art"]
                    if art == "klick" and "ankreuzen" in s and not s.get("absenden"):
                        el.check() if s["ankreuzen"] else el.uncheck()       # Zielzustand statt Umschalten
                    elif art == "klick":
                        letzter_klick = datetime.now()
                        el.click()
                        if s.get("absenden"):
                            abgesendet = True
                        try:
                            page.wait_for_load_state("domcontentloaded", timeout=15000)
                        except Exception:
                            pass
                        page.wait_for_timeout(1200)
                        page = ctx.pages[-1]
                    elif art == "fuellen":
                        wert = get_secret(SCHLUESSEL_PASSWORT) if s.get("wert") == "{{passwort}}" else einsetzen(s.get("wert"), werte)
                        self._tippen(el, wert, 35, 90)
                        wert = None
                    elif art == "waehlen":
                        self._waehlen(el, s, werte)
                    elif art == "hochladen":
                        if not dialog_dateien["gesetzt"]:
                            el.set_input_files([str(x) for x in (vor["einzeln"] if s.get("mehrfach") else [vor["gesamt"]])])
                        dialog_dateien["gesetzt"] = False
                        page.wait_for_timeout(1500)
                    elif art == "mailcode":
                        gesamt = int(self.cfg.get("code_warten_s", 180))
                        c = MailCode(self.c).warten(letzter_klick, r.get("mail_absender", ""), min(60, gesamt))
                        if not c:
                            # Kein Code nach einer Minute: Anmelde-Knopf hat evtl. nicht ausgelöst – einmal erneut drücken
                            vorher = next((schritte[k] for k in range(i - 1, -1, -1) if schritte[k]["art"] == "klick"), None)
                            knopf = self._finden(page, vorher, 5) if vorher else None
                            if knopf is not None:
                                letzter_klick = datetime.now()
                                knopf.click()
                                page.wait_for_timeout(1500)
                            c = MailCode(self.c).warten(letzter_klick, r.get("mail_absender", ""), max(60, gesamt - 60))
                        if not c:
                            self._fehlerbild(page)
                            raise Abbruch("Der Anmeldecode kam nicht per Mail an – das Portal hat vermutlich keinen Code "
                                          "verschickt. Bitte kurz im JARVIS-Fenster prüfen, ob die Anmeldung hängt.")
                        self._tippen(el, c["code"], 60, 120)
                        c = None
                    i += 1
                if not abgesendet:
                    raise Abbruch("Ablauf endete ohne Absenden")
                page.wait_for_timeout(3500)
                merkmal = self._seitenmerkmal(page)
                erwartet = r.get("erfolg") or {}
                ok = (not erwartet) or (erwartet.get("url_teil") and erwartet["url_teil"] == merkmal["url_teil"]) \
                    or (erwartet.get("text") and erwartet["text"][:30].lower() in (merkmal["text"] or "").lower())
                beweis = page.screenshot(full_page=True)
                ctx.close()
                return beweis, bool(ok)
        except Abbruch:
            if abgesendet:
                raise Abbruch("Nach dem Absenden ist etwas schiefgegangen – bitte im Portal prüfen, ob der Antrag "
                              "eingegangen ist. Ich versuche es nicht noch einmal.")
            raise
        finally:
            shutil.rmtree(vor["ordner"], ignore_errors=True)

    @staticmethod
    def _waehlen(el, s: dict, werte: dict) -> None:
        """Auswahlliste: hängt die Auswahl an einem Platzhalter (z. B. Kind), zählt nur der sichtbare Text –
        nie der beim Einlernen gespeicherte interne Wert (der gehörte zum damaligen Kind)."""
        roh = s.get("wahltext") or ""
        if "{{" not in roh and "{{" not in (s.get("wert") or ""):
            el.select_option(value=s.get("wert")) if s.get("wert") else el.select_option(label=roh)
            return
        ziel = einsetzen(roh, werte).strip().lower()
        vor = (werte.get("kind_vorname") or "").lower() if "kind" in roh else ""
        texte = el.evaluate("e => [...e.options].map(o => o.text.trim())")
        treffer = [t for t in texte if t.lower() == ziel] or [t for t in texte if ziel and ziel in t.lower()] \
            or ([t for t in texte if vor and re.search(r"\b" + re.escape(vor) + r"\b", t.lower())] if vor else [])
        if len(treffer) != 1:
            raise Abbruch(f"In der Auswahlliste „{s.get('label') or 'Person'}“ finde ich „{einsetzen(roh, werte)}“ "
                          f"nicht eindeutig – ich wähle lieber nichts Falsches aus.")
        el.select_option(label=treffer[0])

    @staticmethod
    def _passt(loc, s: dict) -> bool:
        """Passt das gefundene Element zum aufgezeichneten? Bei Klicks muss die Elementart stimmen –
        sonst trifft „Anmelden“ die Überschrift statt des Knopfs."""
        if s["art"] == "hochladen":
            return True
        if not loc.is_visible():
            return False
        if s["art"] != "klick" or not s.get("tag"):
            return True
        try:
            tag, typ = loc.evaluate("e => [e.tagName.toLowerCase(), (e.type || '').toLowerCase()]")
        except Exception:
            return False
        if s.get("typ") in ("submit", "button") and tag in ("button", "input") and typ and typ != s["typ"]:
            return False                      # Reiter „Anmelden“ (type=button) ist nicht der Absende-Knopf (submit)
        if tag == s["tag"]:
            return loc.is_enabled() if tag in ("button", "input") else True
        knopf = s.get("typ") in ("submit", "button") or s["tag"] == "button"
        return knopf and (tag == "button" or (tag == "input" and typ in ("submit", "button")))

    def _finden(self, page, s: dict, sekunden: int):
        ende = time.time() + sekunden
        while time.time() < ende:
            for frame in [page.main_frame, *[f for f in page.frames if f is not page.main_frame]]:
                # Knöpfe zuerst über ihre Rolle suchen (eindeutiger als ein Text, der auch als Überschrift vorkommt)
                if s["art"] == "klick" and s.get("text") and (s.get("tag") == "button" or s.get("typ") in ("submit", "button")):
                    try:
                        if s.get("typ") == "submit":      # Absende-Knopf eines Formulars (z. B. gelbes „Anmelden“)
                            alle = frame.locator('button[type="submit"], input[type="submit"], form button:not([type])')
                            alle = alle.filter(has_text=re.compile(rf"^\s*{re.escape(s['text'])}\s*$"))
                        else:
                            alle = frame.get_by_role("button", name=s["text"], exact=True)
                        for k in range(min(alle.count(), 6)):
                            if self._passt(alle.nth(k), s):
                                return alle.nth(k)
                    except Exception:
                        pass
                for sel in s.get("kandidaten") or []:
                    try:
                        alle = frame.locator(sel)
                        for k in range(min(alle.count(), 6)):
                            if self._passt(alle.nth(k), s):
                                return alle.nth(k)
                    except Exception:
                        continue
            page.wait_for_timeout(400)
        return None

    def _captcha(self, page) -> None:
        try:
            quellen = " ".join(f.url for f in page.frames)
            text = page.evaluate("() => document.body ? document.body.innerText.slice(0, 4000) : ''")
        except Exception:
            return
        if CAPTCHA.search(quellen) or re.search(r"ich bin kein roboter|i'm not a robot", text or "", re.I):
            raise Abbruch("Das Portal zeigt eine Roboter-Prüfung (Captcha). Die löse ich bewusst nicht – bitte "
                          "diesmal selbst einreichen.")

    @staticmethod
    def _tippen(el, wert: str, a: int, b: int) -> None:
        el.fill("")
        try:
            el.press_sequentially(wert, delay=random.randint(a, b))
        except AttributeError:
            el.type(wert, delay=random.randint(a, b))

    @staticmethod
    def _menschlich() -> None:
        time.sleep(random.uniform(0.5, 1.4))

    def _fehlerbild(self, page) -> None:
        try:
            d = ORDNER / "fehler"
            d.mkdir(parents=True, exist_ok=True)
            page.screenshot(path=str(d / f"{datetime.now():%Y-%m-%d_%H%M%S}.png"))
            for alt in sorted(d.glob("*.png"))[:-5]:
                alt.unlink(missing_ok=True)
        except Exception:
            pass

    # ------------------------------------------------------------ Abschluss
    def _erledigt(self, belege: list[dict], beweis: bytes | None, wie: str, unsicher: bool = False) -> None:
        from atlas.workflows import beihilfe as B
        from atlas.tools import jxa
        archiv_datei = None
        if beweis:
            try:
                import io
                from PIL import Image
                ziel = self.bh.pfad("pkv_archiv")
                if ziel:
                    ziel.mkdir(parents=True, exist_ok=True)
                    archiv_datei = ziel / f"{date.today():%Y_%m_%d} - Antrag PKV.pdf"
                    n = 2
                    while archiv_datei.exists():
                        archiv_datei = ziel / f"{date.today():%Y_%m_%d} - Antrag PKV ({n}).pdf"
                        n += 1
                    Image.open(io.BytesIO(beweis)).convert("RGB").save(archiv_datei, "PDF", resolution=110)
            except Exception as e:
                self.c.audit.log("fehler", bereich="pkv_beweis", text=str(e)[:200])
        with self.bh.lock:
            z = self.bh.zustand()
            aend = []
            for b in belege:
                rr = z["rechnungen"].get(b["key"])
                if not rr:
                    continue
                rr.setdefault("erledigt", {})["pkv"] = datetime.now().isoformat(timespec="minutes")
                aend.append((f"J{rr['zeile']}", "t", B.AN))
                rid = (rr.get("erinnerungen") or {}).get("pkv")
                if rid:
                    try:
                        jxa.run("Erinnerungen", B.ERINNERUNG_ERLEDIGT, rid)
                    except Exception:
                        pass
            pp = z.setdefault("pkv_portal", {})
            pp.setdefault("verlauf", []).append({"datum": datetime.now().isoformat(timespec="minutes"), "rechnungen": [b["nr"] for b in belege],
                                                 "belege": len(belege), "wie": wie, "unsicher": unsicher})
            pp["verlauf"] = pp["verlauf"][-50:]
            if aend:
                self.bh.excel(z, aend, "PKV-Antrag gestellt")
            self.bh.speichern(z)
        text = (f"PKV-Antrag gesendet ({wie}): {self.kurz(belege)}. In Excel vermerkt"
                f"{', Bestätigung im PKV-Archiv' if archiv_datei else ''}.")
        if unsicher:
            text += " Die Bestätigungsseite sah anders aus als beim Einlernen – bitte kurz im Portal gegenprüfen."
        self.c.audit.log("pkv_portal", aktion="eingereicht", belege=len(belege), wie=wie, unsicher=unsicher)
        self.melden(text)

    def _vorschlagen(self) -> None:
        z = self.bh.zustand().get("pkv_portal", {})
        ok = [v for v in z.get("verlauf", []) if not v.get("unsicher")]
        if len(ok) >= MAX_RUNDEN_VORSCHLAG and not self._befugnis()[0]:
            self.melden("Die PKV-Einreichung hat jetzt mehrmals sauber geklappt. Wenn du magst, erteile mir die "
                           "Befugnis „PKV selbstständig einreichen“ – dann stelle ich die Anträge zur Antragszeit "
                           "ohne Rückfrage und melde nur noch.", "pkv_befugnis_vorschlag")

    # ------------------------------------------------------------ Täglicher Lauf
    def faellig(self) -> None:
        """Einmal täglich zur PKV-Zeit: mit Befugnis selbst einreichen, sonst Bescheid geben."""
        if not self.rezept() or self.laeuft:
            return
        offen = self.offen()
        if not offen:
            return
        z = self.bh.zustand()
        pp = z.setdefault("pkv_portal", {})
        heute = date.today().isoformat()
        if pp.get("tageslauf") == heute:
            return
        hh, mm = map(int, str(self.cfg.get("uhrzeit", "19:00")).split(":"))
        if datetime.now() < datetime.now().replace(hour=hh, minute=mm, second=0):
            return
        pp["tageslauf"] = heute
        self.bh.speichern(z)
        erlaubt, rid = self._befugnis()
        if erlaubt:
            self.c.befugnisse.genutzt(rid)
            self.einreichen(selbststaendig=True)
        else:
            self.melden(f"PKV-Antrag bereit ({self.kurz()}). Sag „Reiche die PKV ein“, dann erledige ich das im Portal.",
                           f"pkv_bereit:{heute}")

    def schleife(self, stop: threading.Event) -> None:
        while not stop.wait(60):
            try:
                if getattr(self.c.proaktiv, "leader", False):
                    self.faellig()
            except Exception as e:
                self.c.audit.log("fehler", bereich="pkv_portal", text=str(e)[:300])

    def start(self, stop: threading.Event) -> None:
        if self.bh.aktiv and self.cfg.get("aktiv", True):
            threading.Thread(target=self.schleife, args=(stop,), name="pkv_portal", daemon=True).start()


def tools(core) -> list[Tool]:
    w = core.pkv
    return [
        Tool("pkv_portal_status",
             "Stand der automatischen PKV-Einreichung im uniVersa-Portal: eingelernt?, Zugangsdaten vorhanden?, "
             "offene PKV-Belege, selbstständig erlaubt?, letzte Einreichung.",
             "beihilfe.lesen", w.status),
        Tool("pkv_einlernen",
             "PKV-Einreichung im uniVersa-Kundenportal einlernen: öffnet ein Browserfenster, Richard reicht einen "
             "offenen Antrag einmal selbst ein, JARVIS zeichnet die Schritte auf (ohne Passwort).",
             "beihilfe.verarbeiten", w.einlernen),
        Tool("pkv_einreichen",
             "Offene Arztrechnungen bei der PKV (uniVersa) einreichen: JARVIS meldet sich im Kundenportal an "
             "(Code aus der Mail), lädt alle offenen Rechnungen in einem Antrag hoch und sendet ab.",
             "beihilfe.einreichen", w.einreichen,
             label=lambda a: f"PKV-Antrag im uniVersa-Portal absenden – {w.kurz()}"),
    ]
