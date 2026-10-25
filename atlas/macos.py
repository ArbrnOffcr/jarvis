"""macOS-Besonderheiten.

iCloud lagert Dateien bei „Mac-Speicher optimieren“ aus (nur Platzhalter auf
der Platte). Hintergrunddienste dürfen solche Dateien standardmäßig NICHT
nachladen – macOS meldet dann „Resource deadlock avoided“ (EDEADLK).
Mit setiopolicy_np erlauben wir diesem Prozess, ausgelagerte Dateien bei
Bedarf aus iCloud zu holen."""
import ctypes
import ctypes.util
import sys

IOPOL_TYPE_VFS_MATERIALIZE_DATALESS_FILES = 3
IOPOL_SCOPE_PROCESS = 0
IOPOL_MATERIALIZE_DATALESS_FILES_ON = 2


def allow_icloud_downloads() -> bool:
    if sys.platform != "darwin":
        return False
    try:
        libc = ctypes.CDLL(ctypes.util.find_library("c"), use_errno=True)
        rc = libc.setiopolicy_np(IOPOL_TYPE_VFS_MATERIALIZE_DATALESS_FILES,
                                 IOPOL_SCOPE_PROCESS, IOPOL_MATERIALIZE_DATALESS_FILES_ON)
        return rc == 0
    except (OSError, AttributeError):
        return False


# Beim ersten Import sofort für den ganzen Prozess aktivieren
ICLOUD_OK = allow_icloud_downloads()
