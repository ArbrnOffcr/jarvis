"""Mail-Konto wählen: iCloud (Standard) oder ein anderer Dienst – Gmail, Outlook/Microsoft 365, GMX, WEB.DE,
T-Online oder ein beliebiger IMAP-Server (Einstellungen → Verbindungen → Mail-Konto).

- Passwörter/App-Passwörter und Microsoft-Anmeldetoken liegen nur im Schlüsselbund dieses Macs.
- In ATLAS-Privat/mail_konto.json stehen nur Anbieter, Adresse und Serveradressen.
- Outlook.com und Microsoft 365 erlauben keine Passwort-Anmeldung per IMAP mehr: dort meldest du dich einmal bei
  Microsoft an (Gerätecode), JARVIS bekommt nur ein Zugriffstoken für Mail (IMAP/SMTP).
- Der Kalender bleibt bei iCloud."""
from __future__ import annotations

import threading
import time

import httpx

from atlas.keystore import get_secret, set_secret
from atlas.paths import read_private_json, write_private_json
from atlas.tools import ToolError

DATEI = "mail_konto.json"
VORLAGEN = {
    "icloud": {"name": "iCloud", "hilfe": "App-spezifisches Passwort – Einstellung oben unter „Kalender & Mail (iCloud)“."},
    "gmail": {"name": "Gmail", "imap": ["imap.gmail.com", 993], "smtp": ["smtp.gmail.com", 587, False],
              "hilfe": "Braucht ein App-Passwort: Google-Konto → Sicherheit → Bestätigung in zwei Schritten an → App-Passwörter.",
              "link": "https://myaccount.google.com/apppasswords"},
    "outlook": {"name": "Outlook / Microsoft 365", "imap": ["outlook.office365.com", 993], "smtp": ["smtp.office365.com", 587, False],
                "oauth": True, "link": "https://entra.microsoft.com",
                "hilfe": "Microsoft erlaubt keine Passwort-Anmeldung mehr. Einmalig: im Microsoft-Entra-Portal eine App "
                         "registrieren (Konten: „beliebige Organisation und persönliche Microsoft-Konten“, öffentliche "
                         "Clientflows erlauben) und ihre Anwendungs-ID (Client-ID) hier eintragen. Danach meldest du dich "
                         "mit einem Code bei Microsoft an."},
    "gmx": {"name": "GMX", "imap": ["imap.gmx.net", 993], "smtp": ["mail.gmx.net", 587, False],
            "hilfe": "Im GMX-Postfach unter E-Mail-Einstellungen → POP3/IMAP-Abruf den Zugriff erlauben; dann normales Passwort."},
    "webde": {"name": "WEB.DE", "imap": ["imap.web.de", 993], "smtp": ["smtp.web.de", 587, False],
              "hilfe": "Bei WEB.DE unter Einstellungen → POP3/IMAP-Abruf den Zugriff erlauben; dann normales Passwort."},
    "tonline": {"name": "T-Online", "imap": ["secureimap.t-online.de", 993], "smtp": ["securesmtp.t-online.de", 465, True],
                "hilfe": "Im Telekom E-Mail-Center ein eigenes E-Mail-Passwort anlegen (nicht das Telekom-Login-Passwort)."},
    "imap": {"name": "Anderer IMAP-Server", "imap": ["", 993], "smtp": ["", 587, False],
             "hilfe": "Serverdaten stehen meist in der Hilfe deines Anbieters (IMAP mit SSL, SMTP mit STARTTLS oder SSL)."},
}
MS = "https://login.microsoftonline.com/common/oauth2/v2.0"
MS_SCOPE = "offline_access https://outlook.office.com/IMAP.AccessAsUser.All https://outlook.office.com/SMTP.Send"
_token: dict = {}
_ms: dict = {"status": ""}


def konto() -> dict:
    return read_private_json(DATEI, {}) or {}


def in_secrets(secrets: dict) -> None:
    """Beim Start: anderes Konto in die Zugangsdaten des Kerns übernehmen; 'mail_bereit' schaltet die Mailfunktionen."""
    k = konto()
    if k.get("anbieter") and k["anbieter"] != "icloud" and k.get("adresse"):
        secrets["mail_konto"] = k
        secrets["mail_pw"] = get_secret("mail_pw")
        secrets["mail_bereit"] = bool(secrets["mail_pw"] or (k.get("oauth") and get_secret("mail_oauth_refresh")))
    else:
        secrets["mail_bereit"] = bool(secrets.get("icloud_app_pw"))


def status() -> dict:
    k = konto()
    art = k.get("anbieter") or "icloud"
    return {"anbieter": art, "adresse": k.get("adresse", "") if art != "icloud" else (get_secret("icloud_email") or ""),
            "benutzer": k.get("benutzer", ""), "imap_host": k.get("imap_host", ""), "imap_port": k.get("imap_port", 993),
            "smtp_host": k.get("smtp_host", ""), "smtp_port": k.get("smtp_port", 587), "smtp_ssl": bool(k.get("smtp_ssl")),
            "client_id": k.get("client_id", "") or get_secret("mail_oauth_client") or "",
            "gesetzt": bool(get_secret("mail_pw") or get_secret("mail_oauth_refresh")) if art != "icloud" else bool(get_secret("icloud_app_pw")),
            "vorlagen": VORLAGEN, "outlook": dict(_ms)}


def _konto_aus(art: str, d: dict) -> dict:
    v = VORLAGEN[art]
    adresse = str(d.get("adresse", "")).strip()
    if "@" not in adresse:
        raise ToolError("Bitte die Mailadresse angeben")
    imap, smtp = list(v["imap"]), list(v["smtp"])
    if art == "imap":
        imap = [str(d.get("imap_host", "")).strip(), int(d.get("imap_port") or 993)]
        smtp = [str(d.get("smtp_host", "")).strip(), int(d.get("smtp_port") or 587), bool(d.get("smtp_ssl"))]
        if not imap[0] or not smtp[0]:
            raise ToolError("IMAP- und SMTP-Server angeben")
    return {"anbieter": art, "name": v["name"], "adresse": adresse, "benutzer": str(d.get("benutzer", "")).strip() or adresse,
            "imap_host": imap[0], "imap_port": imap[1], "smtp_host": smtp[0], "smtp_port": smtp[1], "smtp_ssl": smtp[2],
            "oauth": bool(v.get("oauth"))}


def testen(k: dict, pw: str | None) -> None:
    """IMAP und SMTP wirklich anmelden – vorher wird nichts gespeichert."""
    from atlas.tools.mail import Mail
    m = Mail({"mail_konto": k, "mail_pw": pw})
    try:
        m._imap().logout()
    except ToolError:
        raise
    except Exception as e:
        raise ToolError(f"IMAP ({k['imap_host']}) nicht erreichbar: {e}")
    try:
        with m._smtp():
            pass
    except Exception as e:
        raise ToolError(f"Lesen klappt, aber Senden (SMTP {k['smtp_host']}) nicht: {str(e)[:160]}")


def speichern(core, d: dict) -> dict:
    from atlas.verbindungen import neustart
    art = str(d.get("anbieter", ""))
    if art not in VORLAGEN or art == "icloud":
        raise ToolError("Unbekannter Anbieter")
    if VORLAGEN[art].get("oauth"):
        raise ToolError("Outlook bitte über „Bei Microsoft anmelden“ verbinden")
    k = _konto_aus(art, d)
    pw = str(d.get("passwort", "")).strip() or (get_secret("mail_pw") if konto().get("adresse") == k["adresse"] else "")
    if art == "gmail":
        pw = pw.replace(" ", "")
    if not pw:
        raise ToolError("Passwort fehlt")
    testen(k, pw)
    set_secret("mail_pw", pw)
    write_private_json(DATEI, k)
    core.audit.log("einstellungen", mail_konto=art)
    neustart(core, "Mail-Konto gesetzt")
    return {"ok": True, "text": f"✓ {k['name']}: Lesen und Senden geprüft – JARVIS startet neu"}


def zurueck_zu_icloud(core) -> dict:
    from atlas.verbindungen import neustart
    write_private_json(DATEI, {"anbieter": "icloud"})
    core.audit.log("einstellungen", mail_konto="icloud")
    neustart(core, "Mail wieder über iCloud")
    return {"ok": True, "text": "✓ Mail wieder über iCloud – JARVIS startet neu"}


# ------------------------------------------------------------------ Microsoft (Outlook.com, Microsoft 365)
def zugriffstoken() -> str:
    if _token.get("wert") and time.time() < _token.get("bis", 0) - 60:
        return _token["wert"]
    rt, cid = get_secret("mail_oauth_refresh"), get_secret("mail_oauth_client")
    if not (rt and cid):
        raise ToolError("Microsoft-Anmeldung fehlt – Einstellungen → Verbindungen → Mail-Konto → Outlook")
    r = httpx.post(f"{MS}/token", data={"client_id": cid, "grant_type": "refresh_token", "refresh_token": rt,
                                         "scope": MS_SCOPE}, timeout=20)
    j = r.json() if r.headers.get("content-type", "").startswith("application/json") else {}
    if r.status_code != 200 or "access_token" not in j:
        raise ToolError(f"Microsoft-Anmeldung abgelaufen – bitte neu verbinden ({j.get('error', r.status_code)})")
    if j.get("refresh_token") and j["refresh_token"] != rt:
        set_secret("mail_oauth_refresh", j["refresh_token"])
    _token.update(wert=j["access_token"], bis=time.time() + int(j.get("expires_in", 3600)))
    return _token["wert"]


def outlook_start(core, d: dict) -> dict:
    cid = str(d.get("client_id", "")).strip()
    k = _konto_aus("outlook", d)
    if len(cid) < 30:
        raise ToolError("Anwendungs-ID (Client-ID) aus der App-Registrierung eintragen")
    r = httpx.post(f"{MS}/devicecode", data={"client_id": cid, "scope": MS_SCOPE}, timeout=20)
    j = r.json() if r.headers.get("content-type", "").startswith("application/json") else {}
    if r.status_code != 200 or "device_code" not in j:
        raise ToolError(f"Microsoft lehnt ab: {j.get('error_description') or j.get('error') or r.status_code}"[:240])
    _ms.clear()
    _ms.update(status="warten", code=j["user_code"], url=j.get("verification_uri", "https://microsoft.com/devicelogin"),
               bis=time.time() + int(j.get("expires_in", 900)))
    threading.Thread(target=_outlook_warten, args=(core, cid, k, j), daemon=True).start()
    return {"ok": True, "code": j["user_code"], "url": _ms["url"],
            "text": f"Öffne {_ms['url']} und gib den Code {j['user_code']} ein – dann mit {k['adresse']} anmelden."}


def outlook_stand() -> dict:
    return {k: v for k, v in _ms.items() if k != "bis"}


def _outlook_warten(core, cid: str, k: dict, j: dict) -> None:
    from atlas.verbindungen import neustart
    pause = int(j.get("interval", 5))
    while time.time() < _ms.get("bis", 0):
        time.sleep(pause)
        try:
            r = httpx.post(f"{MS}/token", data={"client_id": cid, "device_code": j["device_code"],
                                                 "grant_type": "urn:ietf:params:oauth:grant-type:device_code"}, timeout=20)
            t = r.json()
        except Exception:
            continue
        if t.get("error") in ("authorization_pending",):
            continue
        if t.get("error") == "slow_down":
            pause += 5
            continue
        if "access_token" not in t:
            _ms.update(status="fehler", text=f"Microsoft: {t.get('error_description') or t.get('error')}"[:240])
            return
        set_secret("mail_oauth_client", cid)
        if t.get("refresh_token"):
            set_secret("mail_oauth_refresh", t["refresh_token"])
        _token.update(wert=t["access_token"], bis=time.time() + int(t.get("expires_in", 3600)))
        try:
            testen({**k, "client_id": cid}, None)
        except ToolError as e:
            _ms.update(status="fehler", text=str(e)[:240])
            return
        write_private_json(DATEI, {**k, "client_id": cid})
        core.audit.log("einstellungen", mail_konto="outlook")
        _ms.update(status="ok", text=f"✓ {k['adresse']} verbunden – JARVIS startet neu")
        neustart(core, "Mail-Konto Outlook verbunden")
        return
    _ms.update(status="fehler", text="Zeit abgelaufen – bitte erneut versuchen")
