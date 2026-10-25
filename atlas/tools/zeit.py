"""Datums-Hilfen: Eingaben gelten als deutsche Ortszeit."""
import datetime as dt
from zoneinfo import ZoneInfo

from atlas.tools import ToolError

TZ = ZoneInfo("Europe/Berlin")
TAGE = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"]


def parse(s: str) -> dt.datetime | dt.date:
    """'2026-10-20' -> date, '2026-10-20T09:30' -> datetime (Berlin)."""
    s = (s or "").strip().replace(" ", "T")
    try:
        if len(s) == 10:
            return dt.date.fromisoformat(s)
        d = dt.datetime.fromisoformat(s)
    except ValueError:
        raise ToolError(f"Ungültiges Datum '{s}' – Format JJJJ-MM-TT oder JJJJ-MM-TTTHH:MM")
    return d.replace(tzinfo=TZ) if d.tzinfo is None else d.astimezone(TZ)


def as_dt(d) -> dt.datetime:
    if isinstance(d, dt.datetime):
        return d if d.tzinfo else d.replace(tzinfo=TZ)
    return dt.datetime.combine(d, dt.time.min, TZ)


def fmt(d) -> str:
    if isinstance(d, dt.datetime):
        d = d.astimezone(TZ)
        return f"{TAGE[d.weekday()]} {d:%d.%m.%Y %H:%M}"
    return f"{TAGE[d.weekday()]} {d:%d.%m.%Y}"
