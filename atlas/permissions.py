"""Rechteprüfung – zentral im Kern, keine Oberfläche kann sie umgehen."""
from enum import IntEnum

from atlas.paths import LOCAL_DIR


class Level(IntEnum):
    FREI = 0          # ohne Rückfrage
    MELDEN = 1        # ausführen und danach melden
    BESTAETIGEN = 2   # nur nach ausdrücklicher Bestätigung
    VERBOTEN = 3      # nie


# Grundeinstellung (in config.yaml unter 'permissions' änderbar).
# Unbekannte Aktionen gelten automatisch als BESTAETIGEN.
DEFAULT_POLICY = {
    "chat.lokal": Level.FREI,
    "chat.cloud": Level.FREI,
    "cloud.sensibel": Level.BESTAETIGEN,    # sensible Inhalte an Claude
    "cloud.zugangsdaten": Level.VERBOTEN,   # Passwörter, PINs, IBAN ...
        "datei.lesen": Level.FREI,
    # DATENARCHIV: auf Wunsch vorsichtig – jede Veränderung nur nach Bestätigung
    "datei.anlegen": Level.BESTAETIGEN,
    "datei.aendern": Level.BESTAETIGEN,
    "datei.verschieben": Level.BESTAETIGEN,
    "datei.loeschen": Level.BESTAETIGEN,
    "gedaechtnis.lesen": Level.FREI,
    "gedaechtnis.schreiben": Level.MELDEN,
    "kalender.lesen": Level.FREI,
    "kalender.schreiben": Level.MELDEN,
    "kalender.loeschen": Level.BESTAETIGEN,
    "erinnerungen.lesen": Level.FREI,
    "erinnerungen.schreiben": Level.MELDEN,
    "notizen.lesen": Level.FREI,
    "notizen.anlegen": Level.FREI,
    "notizen.aendern": Level.MELDEN,
    "kontakte.lesen": Level.FREI,
    "wetter.lesen": Level.FREI,
    "anzeige": Level.FREI,
    "web.lesen": Level.FREI,
    "beihilfe.lesen": Level.FREI,
    "nachrichten.senden": Level.BESTAETIGEN,  # iMessage/SMS nur nach Bestätigung
    "musik": Level.FREI,
    "karte": Level.FREI,
    "timer": Level.FREI,
    "nachrichten.lesen": Level.FREI,      # iMessage: nur Absender/Uhrzeit an die KI, Inhalt nur lokal         # Workflow Arztrechnungen (lokal)
    "beihilfe.verarbeiten": Level.FREI,   # vom Nutzer ausdrücklich so gewünscht: automatisch ablegen/eintragen
    "beihilfe.schreiben": Level.MELDEN,              # frei lizenzierte Bilder (Wikimedia) suchen und zeigen
    "office.anlegen": Level.MELDEN,       # neue Dokumente nur im Ausgabeordner
    "office.aendern": Level.BESTAETIGEN,  # bestehende Dokumente (mit Sicherungskopie)
    "datei.oeffnen": Level.MELDEN,
    "kontakte.aendern": Level.BESTAETIGEN,
    "mail.lesen": Level.FREI,
    "mail.entwurf": Level.FREI,
    "mail.senden": Level.BESTAETIGEN,
    "shell": Level.BESTAETIGEN,
    "post.lesen": Level.FREI,
    "post.ablegen": Level.BESTAETIGEN,     # Ablage im DATENARCHIV: vorschlagen, Nutzer bestätigt
    "fristen.lesen": Level.FREI,
    "fristen.schreiben": Level.MELDEN,
    "steuer.lesen": Level.FREI,
    "steuer.schreiben": Level.MELDEN,
    # Stab (Sachgebietsagenten): Einsatz und Abstimmung untereinander ohne Rückfrage
    "tesla.lesen": Level.FREI,
    "ford.lesen": Level.FREI,
    "immo.lesen": Level.FREI,               # HESTIA: Immobilien lesen, Kennzahlen
    "immo.objekt": Level.MELDEN,            # Objektdaten ändern, Mieterhöhung planen               # Ford: nur Status, keine Steuerung möglich
    "tesla.steuern": Level.MELDEN,          # Klima und Laden; Entriegeln/Öffnen gibt es bewusst nicht
    "stab.einsatz": Level.FREI,
    "stab.lesen": Level.FREI,
    "stab.steuern": Level.MELDEN,          # an/aus, Kostengrenze – nur auf Befehl
    "stab.aendern": Level.BESTAETIGEN,     # Persona-Änderungen per Sprache: Unterschied bestätigen
}

NOTAUS_FILE = LOCAL_DIR / "NOTAUS"


class Gate:
    def __init__(self, cfg: dict, audit):
        self.policy = dict(DEFAULT_POLICY)
        for action, name in (cfg.get("permissions") or {}).items():
            self.policy[action] = Level[name.upper()]
        self.audit = audit

    @property
    def notaus(self) -> bool:
        return NOTAUS_FILE.exists()

    def set_notaus(self, on: bool) -> None:
        if on:
            NOTAUS_FILE.parent.mkdir(parents=True, exist_ok=True)
            NOTAUS_FILE.touch()
        else:
            NOTAUS_FILE.unlink(missing_ok=True)
        self.audit.log("notaus", aktiv=on)

    def level(self, action: str) -> Level:
        lvl = self.policy.get(action, Level.BESTAETIGEN)
        # Not-Aus: nur noch Lesen/Chatten erlaubt
        if (self.notaus and not action.startswith(("cloud.", "chat."))
                and not action.endswith(".lesen")):
            return Level.VERBOTEN
        return lvl
