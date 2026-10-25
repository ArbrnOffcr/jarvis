"""Ersteinrichtung aus dem grafischen Installer: liest die Angaben als JSON (stdin) und speichert sie.

Schlüssel und Passwörter landen ausschließlich im Schlüsselbund dieses Macs, alles andere in
iCloud Drive/ATLAS-Privat/config.yaml. Ausgabe: eine Zeile je Schritt („OK …“ / „WARN …“), damit
der Installer den Fortschritt anzeigen kann.

    echo '{…}' | jarvis einrichten --stdin
"""
import json
import sys

import httpx
import yaml

SCHLUESSEL = ("anthropic", "elevenlabs", "telegram", "serper", "youtube")


def _p(art: str, text: str) -> None:
    print(f"{art} {text}", flush=True)


def ort_finden(ort: str) -> dict | None:
    """Ort → Koordinaten (Open-Meteo, ohne Konto)."""
    try:
        r = httpx.get("https://geocoding-api.open-meteo.com/v1/search",
                      params={"name": ort, "count": 1, "language": "de", "format": "json"}, timeout=15)
        t = (r.json().get("results") or [None])[0]
        if t:
            return {"ort": t.get("name") or ort, "lat": round(t["latitude"], 3), "lon": round(t["longitude"], 3)}
    except Exception:
        pass
    return None


def icloud_pruefen(apple_id: str, mail: str, pw: str) -> tuple[bool, bool]:
    import imaplib
    cal_ok = mail_ok = False
    try:
        import caldav
        caldav.DAVClient(url="https://caldav.icloud.com", username=apple_id, password=pw, timeout=30).principal()
        cal_ok = True
    except Exception:
        pass
    for name in dict.fromkeys([mail, mail.split("@")[0], apple_id]):
        try:
            m = imaplib.IMAP4_SSL("imap.mail.me.com", 993, timeout=30)
            m.login(name, pw)
            m.logout()
            mail_ok = True
            break
        except Exception:
            continue
    return cal_ok, mail_ok


def anwenden(d: dict) -> dict:
    from atlas import voice
    from atlas.config import SAMPLE
    from atlas.keystore import set_secret
    from atlas.paths import private_dir, read_private_json, write_private_json

    # 1 · Schlüssel (nur Schlüsselbund)
    gesetzt = []
    for k in SCHLUESSEL:
        v = str((d.get("schluessel") or {}).get(k) or "").strip()
        if v:
            set_secret(k, v)
            gesetzt.append(k)
    _p("OK", "Schlüssel im Schlüsselbund: " + (", ".join(gesetzt) or "keine"))

    # 2 · iCloud (Kalender, Mail)
    ic = d.get("icloud") or {}
    if ic.get("apple_id") and ic.get("pw"):
        apple_id = ic["apple_id"].strip()
        mail = (ic.get("email") or apple_id).strip()
        pw = ic["pw"].strip().replace(" ", "")
        cal_ok, mail_ok = icloud_pruefen(apple_id, mail, pw)
        if cal_ok or mail_ok:
            set_secret("icloud_apple_id", apple_id)
            set_secret("icloud_email", mail)
            set_secret("icloud_app_pw", pw)
            _p("OK", f"iCloud: Kalender {'✓' if cal_ok else '✗'}, Mail {'✓' if mail_ok else '✗'}")
        else:
            _p("WARN", "iCloud-Anmeldung abgelehnt – später mit 'jarvis setup icloud' erneut versuchen")

    # 3 · Stimme
    st = d.get("stimme") or {}
    if st.get("de"):
        voice.save_settings(stimme_de=st["de"].strip())
    if st.get("en"):
        voice.save_settings(stimme_en=st["en"].strip())
    dash = read_private_json("dashboard.json", {"erinnerungen_ausblenden": []})
    dash["weckwort"] = bool(st.get("weckwort"))
    dash.setdefault("gespraech", True)
    dash["einfuehrung_offen"] = True              # Einführung startet beim ersten Öffnen von JARVIS
    write_private_json("dashboard.json", dash)
    _p("OK", "Stimme: " + ("ElevenLabs" if (d.get("schluessel") or {}).get("elevenlabs") else "Mac-Stimme"))

    # 4 · config.yaml
    pfad = private_dir() / "config.yaml"
    try:
        alt = yaml.safe_load(pfad.read_text(encoding="utf-8")) if pfad.exists() else {}
    except (OSError, yaml.YAMLError):
        alt = {}
    cfg = alt if isinstance(alt, dict) else {}
    if d.get("name"):
        cfg["name"] = d["name"].strip()
    if "anrede" in d:
        cfg["anrede"] = (d.get("anrede") or "").strip()
    if d.get("ort"):
        w = ort_finden(d["ort"].strip())
        if w:
            cfg["wetter"] = w
            _p("OK", f"Wohnort: {w['ort']}")
        else:
            _p("WARN", f"Ort „{d['ort']}“ nicht gefunden – Wetter für Berlin")
    if d.get("archiv"):
        cfg["archive_path"] = d["archiv"]
    if d.get("release_repo"):
        cfg.setdefault("release", {})["repo"] = d["release_repo"]
    if not d.get("lokal"):
        cfg.setdefault("router", {})["einfach"] = "haiku"
    bh = d.get("beihilfe") or {}
    if bh.get("aktiv"):
        kinder = {}
        for k in bh.get("kinder") or []:
            kz = str(k.get("kuerzel") or "").strip().upper()
            if kz and k.get("name"):
                kinder[kz] = {"name": k["name"].strip(),
                              "tabelle": (k.get("tabelle") or k["name"].split()[0]).strip()}
        cfg["beihilfe"] = {**(cfg.get("beihilfe") or {}), "aktiv": True, "kinder": kinder,
                           **({"excel": bh["excel"]} if bh.get("excel") else {})}
    else:
        cfg.setdefault("beihilfe", {})["aktiv"] = False
    pfad.write_text(SAMPLE + "\n" + yaml.safe_dump(cfg, allow_unicode=True, sort_keys=False), encoding="utf-8")
    _p("OK", "Einstellungen gespeichert")
    from atlas import lizenz
    _p("OK", f"Installations-Kennung: {lizenz.kennung()}")
    return cfg


def main(args: list[str]) -> None:
    if "--stdin" not in args:
        print("Aufruf: echo '{…}' | jarvis einrichten --stdin")
        return
    try:
        d = json.loads(sys.stdin.read() or "{}")
    except ValueError as e:
        _p("FEHLER", f"Ungültige Angaben: {e}")
        sys.exit(2)
    try:
        anwenden(d)
    except Exception as e:
        _p("FEHLER", f"{type(e).__name__}: {e}"[:300])
        sys.exit(1)
    _p("FERTIG", "Einrichtung gespeichert")
