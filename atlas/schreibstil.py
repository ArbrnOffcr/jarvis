"""Schreibstil des Nutzers für Mail-Entwürfe.

Aus den zuletzt gesendeten Mails (iCloud, Ordner „Gesendet“) leitet das lokale Modell ein kurzes
Stilprofil ab: Anrede, Grußformel, Länge, Ton, typische Wendungen – ohne Namen und Inhalte.
Die Mails selbst verlassen den Mac nicht; nur das Profil geht beim Entwerfen an Claude."""
import email
import re
from datetime import datetime, timedelta
from email.policy import default

from atlas import hilfen
from atlas.paths import read_private_json, write_private_json
from atlas.tools import S, Tool, ToolError
from atlas.tools.mail import SENT, Mail, _uids

ZUSTAND = "schreibstil.json"
ZITAT = re.compile(r"(?ms)^(?:>.*$|Am .{5,120} schrieb .*|On .{5,120} wrote:.*|-----Original.*|Von: .*Gesendet: .*)")


def _text(raw: bytes) -> str:
    msg = email.message_from_bytes(raw, policy=default)
    body = msg.get_body(preferencelist=("plain",))
    if not body:
        return ""
    t = body.get_content()
    t = ZITAT.split(t)[0]                                   # zitierte Antworten abschneiden
    t = re.sub(r"\n{3,}", "\n\n", t).strip()
    return t[:1200]


class Schreibstil:
    def __init__(self, core):
        self.c = core

    def profil(self, neu_lernen: bool = False) -> dict:
        p = read_private_json(ZUSTAND, {})
        alt = not p.get("stand") or datetime.fromisoformat(p["stand"]) < datetime.now() - timedelta(days=60)
        if neu_lernen or alt:
            try:
                p = self.lernen()
            except ToolError as e:
                if not p.get("profil"):
                    return {"profil": None, "hinweis": f"Stil konnte nicht gelernt werden ({e}). Schreibe "
                                                         "höflich, knapp, mit „Viele Grüße“ und Vornamen."}
        return {"profil": p.get("profil"), "stand": p.get("stand"),
                "hinweis": "Entwürfe in genau diesem Stil schreiben (Anrede, Gruß, Länge, Ton). Nur als Entwurf "
                           "speichern ('mail_entwurf'); gesendet wird erst nach ausdrücklichem Wunsch."}

    def lernen(self) -> dict:
        m = Mail(self.c.secrets)
        imap = m._imap()
        texte = []
        try:
            imap.select(f"\"{SENT}\"", readonly=True)
            typ, data = imap.uid("SEARCH", None, "ALL")
            for uid in _uids(data)[-40:][::-1]:
                typ, d = imap.uid("FETCH", uid, "(BODY.PEEK[])")
                raw = next((x[1] for x in d if isinstance(x, tuple)), None)
                if raw:
                    t = _text(raw)
                    if len(t) > 40:
                        texte.append(t)
                if len(texte) >= 25:
                    break
        finally:
            try:
                imap.logout()
            except Exception:
                pass
        if len(texte) < 3:
            raise ToolError("zu wenige gesendete Mails gefunden")
        beispiele = "\n\n---\n\n".join(texte)[:9000]
        j = hilfen.lokal_json(
            self.c.providers.get("lokal"),
            "Du analysierst den Schreibstil eines Menschen. Antworte nur mit JSON. Keine Namen, keine Inhalte, "
            "keine Adressen, keine Zahlen – nur Stilmerkmale.",
            'Antworte nur mit JSON: {"anrede_foermlich": "z. B. Sehr geehrte Frau …,", "anrede_privat": "z. B. Hallo …,", '
            '"gruss_foermlich": "…", "gruss_privat": "…", "unterschrift": "nur Vorname oder Vor- und Nachname?", '
            '"laenge": "kurz/mittel/ausführlich", "ton": "2-4 Adjektive", "du_oder_sie": "…", '
            '"typische_wendungen": ["…"], "vermeidet": ["…"]}\n\nGesendete Mails:\n' + beispiele, 500)
        if not j:
            raise ToolError("lokales Modell nicht erreichbar")
        p = {"profil": j, "stand": datetime.now().isoformat(timespec="minutes"), "mails": len(texte)}
        write_private_json(ZUSTAND, p)
        self.c.audit.log("schreibstil", aktion="gelernt", mails=len(texte))
        return p


def tools(core) -> list[Tool]:
    s = core.schreibstil
    return [Tool("schreibstil",
                 "Stilprofil des Nutzers für Mails (Anrede, Gruß, Länge, Ton). VOR jedem 'mail_entwurf' abrufen "
                 "und den Entwurf genau so formulieren. neu_lernen=true, wenn der Nutzer sagt, der Stil passt nicht.",
                 "mail.lesen", s.profil, {"neu_lernen": {"type": "boolean"}})]
