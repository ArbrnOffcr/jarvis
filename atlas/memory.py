"""Gedächtnis als lesbare Markdown-Dateien.

privat     → iCloud Drive/ATLAS-Privat/gedaechtnis/   (nur dieser Nutzer)
gemeinsam  → DATENARCHIV/…/Daten/gedaechtnis/         (beide)
vorgänge   → DATENARCHIV/…/Daten/vorgaenge/           (beide)
"""
import re
from datetime import date, datetime
from pathlib import Path

from atlas.paths import private_dir, shared_dir

PRIVAT_THEMEN = "ueber_mich, vorlieben, kontakte_notizen"
GEMEINSAM_THEMEN = "familie, haushalt, fahrzeuge, wohnung_haus"


def _slug(s: str) -> str:
    s = s.lower().strip()
    for a, b in (("ä", "ae"), ("ö", "oe"), ("ü", "ue"), ("ß", "ss")):
        s = s.replace(a, b)
    return re.sub(r"[^a-z0-9]+", "_", s).strip("_")[:60] or "allgemein"


class Memory:
    def __init__(self, cfg: dict):
        self.dirs = {"privat": private_dir() / "gedaechtnis",
                     "gemeinsam": shared_dir(cfg) / "gedaechtnis"}
        self.vorgaenge = shared_dir(cfg) / "vorgaenge"
        self.gespraeche = private_dir() / "gespraeche"
        for d in [*self.dirs.values(), self.vorgaenge, self.gespraeche]:
            d.mkdir(parents=True, exist_ok=True)

    def _file(self, bereich: str, thema: str) -> Path:
        if bereich not in self.dirs:
            raise ValueError("bereich muss 'privat' oder 'gemeinsam' sein")
        return self.dirs[bereich] / f"{_slug(thema)}.md"

    # ---------- Fakten ----------
    def merken(self, bereich: str, thema: str, fakt: str) -> dict:
        f = self._file(bereich, thema)
        if not f.exists():
            f.write_text(f"# {thema}\n\n", encoding="utf-8")
        text = f.read_text(encoding="utf-8")
        if fakt.strip() in text:
            return {"bereits_bekannt": fakt}
        with open(f, "a", encoding="utf-8") as fh:
            fh.write(f"- {fakt.strip()} ({date.today():%d.%m.%Y})\n")
        return {"gemerkt": fakt, "datei": f"{bereich}/{f.name}"}

    def vergessen(self, bereich: str, thema: str, text: str) -> dict:
        f = self._file(bereich, thema)
        if not f.exists():
            return {"nicht_gefunden": thema}
        lines = f.read_text(encoding="utf-8").splitlines()
        keep = [l for l in lines if not (l.startswith("- ") and text.lower() in l.lower())]
        f.write_text("\n".join(keep) + "\n", encoding="utf-8")
        return {"entfernt": len(lines) - len(keep)}

    def lesen(self, bereich: str = "", thema: str = "") -> dict:
        out = {}
        for b, d in self.dirs.items():
            if bereich and b != bereich:
                continue
            for f in sorted(d.glob("*.md")):
                if thema and _slug(thema) != f.stem:
                    continue
                out[f"{b}/{f.stem}"] = f.read_text(encoding="utf-8")[:6000]
        return out

    # ---------- Vorgänge ----------
    def vorgang(self, titel: str, status: str = "", frist: str = "", naechster_schritt: str = "",
                notiz: str = "", abgeschlossen: bool = False) -> dict:
        f = self.vorgaenge / f"{_slug(titel)}.md"
        stand = f"{datetime.now():%d.%m.%Y %H:%M}"
        if not f.exists():
            f.write_text(f"# {titel}\n\n- Status: offen\n- Frist: –\n- Nächster Schritt: –\n\n"
                         f"## Verlauf\n", encoding="utf-8")
        text = f.read_text(encoding="utf-8")
        def setline(key, val):
            nonlocal text
            text = re.sub(rf"^- {key}: .*$", f"- {key}: {val}", text, count=1, flags=re.M)
        if abgeschlossen:
            setline("Status", "abgeschlossen")
        elif status:
            setline("Status", status)
        if frist:
            setline("Frist", frist)
        if naechster_schritt:
            setline("Nächster Schritt", naechster_schritt)
        eintrag = notiz or status or naechster_schritt or ("abgeschlossen" if abgeschlossen else "")
        if eintrag:
            text += f"- {stand}: {eintrag}\n"
        f.write_text(text, encoding="utf-8")
        return {"vorgang": titel, "aktualisiert": True}

    def vorgaenge_liste(self, auch_abgeschlossene: bool = False) -> list[dict]:
        out = []
        for f in sorted(self.vorgaenge.glob("*.md")):
            text = f.read_text(encoding="utf-8")
            get = lambda k: (re.search(rf"^- {k}: (.*)$", text, re.M) or [None, "–"])[1]
            status = get("Status")
            if status == "abgeschlossen" and not auch_abgeschlossene:
                continue
            out.append({"titel": text.splitlines()[0].lstrip("# "), "status": status,
                        "frist": get("Frist"), "naechster_schritt": get("Nächster Schritt")})
        return out

    def vorgang_lesen(self, titel: str) -> str:
        f = self.vorgaenge / f"{_slug(titel)}.md"
        if not f.exists():
            cands = [p.stem for p in self.vorgaenge.glob("*.md") if _slug(titel) in p.stem]
            if len(cands) == 1:
                f = self.vorgaenge / f"{cands[0]}.md"
            else:
                return f"Nicht gefunden. Vorhanden: {', '.join(p.stem for p in self.vorgaenge.glob('*.md'))}"
        return f.read_text(encoding="utf-8")[:8000]

    # ---------- für den Systemprompt ----------
    def digest(self, limit: int = 3500) -> str:
        parts = []
        for key in ("privat/ueber_mich", "privat/vorlieben", "gemeinsam/familie"):
            b, t = key.split("/")
            f = self.dirs[b] / f"{t}.md"
            if f.exists():
                lines = [l for l in f.read_text(encoding="utf-8").splitlines() if l.startswith("- ")]
                if lines:
                    parts.append(f"[{key}]\n" + "\n".join(lines[-25:]))
        offen = self.vorgaenge_liste()
        if offen:
            parts.append("[offene Vorgänge]\n" + "\n".join(
                f"- {v['titel']} · Status: {v['status']} · Frist: {v['frist']}" for v in offen[:20]))
        themen = sorted(f"{b}/{p.stem}" for b, d in self.dirs.items() for p in d.glob("*.md"))
        if themen:
            parts.append("[weitere Gedächtnis-Themen]\n" + ", ".join(themen))
        text = "\n\n".join(parts)
        return text[:limit]

    def gespraech_ablegen(self, zusammenfassung: str) -> None:
        f = self.gespraeche / f"{datetime.now():%Y-%m}.md"
        with open(f, "a", encoding="utf-8") as fh:
            fh.write(f"\n## {datetime.now():%d.%m.%Y %H:%M}\n{zusammenfassung.strip()}\n")
