"""iCloud-Mail über IMAP/SMTP. Entwürfe landen im Ordner 'Entwürfe' und
erscheinen in Apple Mail auf allen Geräten. Senden nur nach Bestätigung."""
import email
import html as htmlmod
import imaplib
import re
import smtplib
import time
from email.header import decode_header, make_header
from email.message import EmailMessage
from email.policy import default
from email.utils import formataddr, make_msgid, parsedate_to_datetime

from atlas.paths import display_name
from atlas.tools import S, Tool, ToolError
from atlas.tools.zeit import fmt

IMAP_HOST, SMTP_HOST = "imap.mail.me.com", "smtp.mail.me.com"
DRAFTS, SENT = "Drafts", "Sent Messages"


def _h(value) -> str:
    try:
        return str(make_header(decode_header(value or "")))
    except Exception:
        return value or ""


def _uids(data) -> list[bytes]:
    """iCloud schickt bei 0 Treffern gar keine SEARCH-Zeile – dann liefert imaplib [None]."""
    return (data[0] or b"").split() if data else []


MAX_ANHANG_MB = 20


def _anhang_dateien(cfg: dict, pfade: list | None) -> list:
    """Anhänge aus dem DATENARCHIV (Pfad relativ zum Archiv) – nur vorhandene Dateien, zusammen max. 20 MB."""
    from pathlib import Path
    from atlas.paths import find_archive
    if not pfade:
        return []
    archiv = find_archive(cfg)
    if not archiv:
        raise ToolError("DATENARCHIV nicht gefunden – Anhang nicht möglich")
    basis, out, summe = archiv.resolve(), [], 0
    for rel in pfade if isinstance(pfade, list) else [pfade]:
        p = (basis / str(rel).strip().lstrip("/")).resolve()
        if not str(p).startswith(str(basis)) or not p.is_file():
            raise ToolError(f"Anhang „{rel}“ nicht im DATENARCHIV gefunden")
        summe += p.stat().st_size
        if summe > MAX_ANHANG_MB * 1024 * 1024:
            raise ToolError(f"Anhänge zusammen größer als {MAX_ANHANG_MB} MB")
        out.append(p)
    return out


class Mail:
    def __init__(self, secrets: dict, cfg: dict | None = None):
        self.cfg = cfg or {}
        self.addr = secrets.get("icloud_email") or secrets.get("icloud_apple_id")
        self.pw = secrets.get("icloud_app_pw")
        names = [self.addr, (self.addr or "").split("@")[0], secrets.get("icloud_apple_id")]
        self.logins = [n for i, n in enumerate(names) if n and n not in names[:i]]

    def _imap(self) -> imaplib.IMAP4_SSL:
        if not (self.addr and self.pw):
            raise ToolError("iCloud-Zugang fehlt – bitte 'jarvis setup' ausführen")
        last = None
        for name in self.logins:
            m = imaplib.IMAP4_SSL(IMAP_HOST, 993, timeout=30)
            try:
                m.login(name, self.pw)
                self.login_name = name
                return m
            except imaplib.IMAP4.error as e:
                last = e
                try:
                    m.logout()
                except Exception:
                    pass
        raise ToolError(f"iCloud-Mail-Anmeldung fehlgeschlagen ({last}). "
                        f"App-spezifisches Passwort und Adresse prüfen: 'jarvis setup icloud'")

    def _overview(self, m, uids: list[bytes]) -> list[dict]:
        if not uids:
            return []
        typ, data = m.uid("FETCH", b",".join(uids),
                          "(FLAGS BODY.PEEK[HEADER.FIELDS (FROM SUBJECT DATE)])")
        out = []
        for part in data:
            if not isinstance(part, tuple):
                continue
            meta = part[0].decode(errors="ignore")
            uid = re.search(r"UID (\d+)", meta)
            hdr = email.message_from_bytes(part[1])
            try:
                datum = fmt(parsedate_to_datetime(hdr["Date"]))
            except Exception:
                datum = hdr["Date"]
            out.append({"uid": uid.group(1) if uid else "?", "von": _h(hdr["From"]),
                        "betreff": _h(hdr["Subject"]), "datum": datum,
                        "ungelesen": "\\Seen" not in meta})
        out.sort(key=lambda r: int(r["uid"]) if r["uid"].isdigit() else 0, reverse=True)
        return out

    # ---------- Werkzeuge ----------
    def posteingang(self, anzahl: int = 15, nur_ungelesen: bool = False) -> list:
        m = self._imap()
        try:
            m.select("INBOX", readonly=True)
            typ, data = m.uid("SEARCH", None, "UNSEEN" if nur_ungelesen else "ALL")
            return self._overview(m, _uids(data)[-int(anzahl):])
        finally:
            m.logout()

    def kurzinfo(self, anzahl: int = 5) -> dict:
        """Anzahl ungelesener Mails + die neuesten davon (eine Verbindung)."""
        m = self._imap()
        try:
            m.select("INBOX", readonly=True)
            typ, data = m.uid("SEARCH", None, "UNSEEN")
            uids = _uids(data)
            return {"ungelesen": len(uids), "neueste": self._overview(m, uids[-anzahl:])}
        finally:
            m.logout()

    def suchen(self, begriff: str, anzahl: int = 15) -> list:
        m = self._imap()
        try:
            m.select("INBOX", readonly=True)
            m.literal = begriff.encode("utf-8")
            typ, data = m.uid("SEARCH", "CHARSET", "UTF-8", "TEXT")
            return self._overview(m, _uids(data)[-int(anzahl):])
        finally:
            m.logout()

    def _fetch(self, m, uid: str) -> email.message.EmailMessage:
        typ, data = m.uid("FETCH", uid.encode(), "(BODY.PEEK[])")
        raw = next((p[1] for p in data if isinstance(p, tuple)), None)
        if not raw:
            raise ToolError(f"Mail {uid} nicht gefunden")
        return email.message_from_bytes(raw, policy=default)

    def lesen(self, uid: str) -> dict:
        m = self._imap()
        try:
            m.select("INBOX", readonly=True)
            msg = self._fetch(m, uid)
        finally:
            m.logout()
        body = msg.get_body(preferencelist=("plain", "html"))
        text = body.get_content() if body else ""
        if body is not None and body.get_content_type() == "text/html":
            text = htmlmod.unescape(re.sub(r"<[^>]+>", " ", re.sub(
                r"(?is)<(script|style).*?</\1>", "", text)))
        text = re.sub(r"\n\s*\n+", "\n\n", re.sub(r"[ \t]+", " ", text)).strip()
        anh = [p.get_filename() for p in msg.iter_attachments() if p.get_filename()]
        return {"von": _h(msg["From"]), "an": _h(msg["To"]), "betreff": _h(msg["Subject"]),
                "datum": msg["Date"], "anhaenge": anh, "text": text[:8000]}

    def _build(self, an: str, betreff: str, text: str, antwort_auf: str = "", anhaenge: list | None = None) -> EmailMessage:
        msg = EmailMessage()
        msg["From"] = formataddr((display_name(), self.addr))
        msg["Message-ID"] = make_msgid(domain=self.addr.split("@")[-1])
        msg["Date"] = email.utils.formatdate(localtime=True)
        if antwort_auf:
            m = self._imap()
            try:
                m.select("INBOX", readonly=True)
                orig = self._fetch(m, antwort_auf)
            finally:
                m.logout()
            an = an or orig.get("Reply-To") or orig["From"]
            betreff = betreff or "Re: " + re.sub(r"^(re|aw):\s*", "", _h(orig["Subject"]), flags=re.I)
            if orig["Message-ID"]:
                msg["In-Reply-To"] = orig["Message-ID"]
                msg["References"] = f"{orig.get('References', '')} {orig['Message-ID']}".strip()
        if not an:
            raise ToolError("Empfänger fehlt")
        msg["To"] = an
        msg["Subject"] = betreff
        msg.set_content(text)
        import mimetypes
        for p in _anhang_dateien(self.cfg, anhaenge):
            typ = mimetypes.guess_type(p.name)[0] or "application/octet-stream"
            haupt, unter = typ.split("/", 1)
            msg.add_attachment(p.read_bytes(), maintype=haupt, subtype=unter, filename=p.name)
        return msg

    def entwurf(self, an: str = "", betreff: str = "", text: str = "", antwort_auf: str = "",
                anhaenge: list | None = None) -> dict:
        msg = self._build(an, betreff, text, antwort_auf, anhaenge)
        m = self._imap()
        try:
            m.append(DRAFTS, "(\\Draft)", imaplib.Time2Internaldate(time.time()), msg.as_bytes())
        finally:
            m.logout()
        return {"entwurf_gespeichert": True, "an": msg["To"], "betreff": msg["Subject"],
                "anhaenge": [str(a).split("/")[-1] for a in (anhaenge or [])],
                "hinweis": "Liegt in Apple Mail unter Entwürfe"}

    def senden(self, an: str = "", betreff: str = "", text: str = "", antwort_auf: str = "",
               anhaenge: list | None = None) -> dict:
        msg = self._build(an, betreff, text, antwort_auf, anhaenge)
        try:
            with smtplib.SMTP(SMTP_HOST, 587, timeout=30) as s:
                s.starttls()
                s.login(getattr(self, "login_name", None) or self.addr, self.pw)
                s.send_message(msg)
        except smtplib.SMTPException as e:
            raise ToolError(f"Senden fehlgeschlagen: {e}")
        try:
            m = self._imap()
            m.append(SENT, "(\\Seen)", imaplib.Time2Internaldate(time.time()), msg.as_bytes())
            m.logout()
        except Exception:
            pass
        return {"gesendet": True, "an": msg["To"], "betreff": msg["Subject"],
                "anhaenge": [str(a).split("/")[-1] for a in (anhaenge or [])]}


def tools(cfg, secrets) -> list[Tool]:
    mail = Mail(secrets, cfg)
    schreib = {"an": S("Empfänger-Adresse(n), bei Antwort optional"),
               "betreff": S("Betreff, bei Antwort optional"), "text": S("Nachrichtentext"),
               "antwort_auf": S("uid der Mail, auf die geantwortet wird, optional"),
               "anhaenge": {"type": "array", "items": {"type": "string"},
                            "description": "Dateien aus dem DATENARCHIV (Pfade wie bei datei_zeigen/archiv_suchen), optional"}}
    anh = lambda a: (" mit Anhang " + ", ".join(f"„{str(x).split('/')[-1]}“" for x in a["anhaenge"])) if a.get("anhaenge") else ""
    return [
        Tool("mail_posteingang", "Neueste Mails im Posteingang (Absender, Betreff, Datum, uid).",
             "mail.lesen", mail.posteingang,
             {"anzahl": {"type": "integer", "description": "Anzahl, Standard 15"},
              "nur_ungelesen": {"type": "boolean", "description": "Nur ungelesene"}}),
        Tool("mail_suchen", "Posteingang nach Begriff durchsuchen.", "mail.lesen", mail.suchen,
             {"begriff": S("Suchbegriff"), "anzahl": {"type": "integer"}}, ["begriff"]),
        Tool("mail_lesen", "Eine Mail (per uid) vollständig lesen.", "mail.lesen", mail.lesen,
             {"uid": S("uid aus mail_posteingang/mail_suchen")}, ["uid"]),
        Tool("mail_entwurf", "Mail-Entwurf in Apple Mail (Entwürfe) speichern – wird NICHT gesendet.",
             "mail.entwurf", mail.entwurf, schreib, ["text"],
             label=lambda a: f"Entwurf an {a.get('an') or 'Absender'}{anh(a)}"),
        Tool("mail_senden", "Mail sofort senden. Nur nutzen, wenn ausdrücklich Senden gewünscht ist.",
             "mail.senden", mail.senden, schreib, ["text"],
             label=lambda a: f"Mail an {a.get('an') or 'Absender'} senden – Betreff „{a.get('betreff', 'Re: …')}“{anh(a)}"),
    ]
