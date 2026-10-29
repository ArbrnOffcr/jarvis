"""JARVIS – persönlicher AI-Assistent (Paketname: atlas)."""
__version__ = "0.23.6"

import mimetypes as _mimetypes

# ES-Module (z. B. die Kartenbibliothek MapLibre 6) müssen als JavaScript ausgeliefert werden – sonst lädt der Browser sie nicht.
_mimetypes.add_type("text/javascript", ".mjs")
