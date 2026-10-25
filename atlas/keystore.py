"""API-Schlüssel im macOS-Schlüsselbund – niemals in Dateien oder Git."""
import os
import secrets as _secrets

import keyring

from atlas.paths import LOCAL_DIR

SERVICE = "ATLAS"
ENV = {"anthropic": "ANTHROPIC_API_KEY", "elevenlabs": "ELEVENLABS_API_KEY",
       "telegram": "TELEGRAM_BOT_TOKEN", "youtube": "YOUTUBE_API_KEY",
       "serper": "SERPER_API_KEY"}


def get_secret(name: str) -> str | None:
    try:
        value = keyring.get_password(SERVICE, name)
    except Exception:
        value = None
    return value or os.environ.get(ENV.get(name, ""))


def set_secret(name: str, value: str) -> None:
    keyring.set_password(SERVICE, name, value)


def core_token() -> str:
    """Zugangsschlüssel zwischen Oberflächen und Kern (nur dieser Benutzer)."""
    path = LOCAL_DIR / "token"
    if not path.exists():
        LOCAL_DIR.mkdir(parents=True, exist_ok=True)
        path.write_text(_secrets.token_urlsafe(32))
        path.chmod(0o600)
    return path.read_text().strip()
