"""Lokale Suchdatenbank je Mac/Benutzer – wird aus dem gemeinsamen Index aufgebaut.

Suche in drei Schichten, je Dokument zusammengeführt (Reciprocal Rank Fusion):
  1. Name & Ordner: Dateiname und Ordnerpfad, unscharf (Umlaute/ß, Wortstämme, zusammengesetzte Wörter –
     „Meldebestätigung“ findet „Meldebescheinigung“, „Landsberger Straße“ findet „Landsberger Strasse“).
     Funktioniert auch für Dokumente, deren Inhalt (noch) nicht lesbar ist.
  2. Stichwörter im Inhalt (SQLite FTS5, mit Wortanfängen).
  3. Bedeutung (Vektoren, bge-m3) – findet Sinnverwandtes ohne gleiche Wörter.
Dazu: Themenübersicht (viele Treffer, nach Ordnern gruppiert, mit Zeitachse) und „verwandte Dokumente“."""
import re
import sqlite3
import threading
import unicodedata
from pathlib import Path

import numpy as np

from atlas.archiv.store import SharedIndex

# Füllwörter, die in Suchanfragen vorkommen, aber nichts über das Dokument sagen
STOPP = set("""der die das den dem des ein eine einen einem einer und oder in im ins an am auf aus bei mit von vom zu zum
zur für fuer über ueber unter nach vor wo wie was wann welche welcher welches ich mir mich mein meine meinen meiner
du dir dein sie ihr wir uns unser damals mal bitte schau schaue such suche finde zeig zeige alle alles dokument
dokumente datei dateien thema themen zu zum sowie auch noch habe hatte hat haben ist war sind gibt gab dazu davon
etwas irgendwas irgendein irgendeine archiv datenarchiv nachweis nachweise unterlagen unterlage sache sachen""".split())
DATUM = re.compile(r"(?<!\d)((?:19|20)\d\d)[_\-. ]?(0[1-9]|1[0-2])?(?:[_\-. ]?(0[1-9]|[12]\d|3[01]))?(?!\d)")
SYNONYME = [      # Verwaltungsbegriffe, die im Alltag durcheinandergehen
    {"meldebestaetigung", "meldebescheinigung", "anmeldebestaetigung", "anmeldebescheinigung", "wohnsitz",
     "meldeadresse", "einwohnermeldeamt", "buergeramt", "ummeldung", "anmeldung"},
    {"abmeldebestaetigung", "abmeldebescheinigung", "abmeldung"},
    {"rechnung", "liquidation", "honorarrechnung", "beleg", "quittung"},
    {"bescheid", "festsetzung", "leistungsabrechnung", "erstattung"},
    {"vertrag", "vereinbarung", "kontrakt", "police", "versicherungsschein"},
    {"gehalt", "besoldung", "bezuege", "lohn", "gehaltsabrechnung", "besoldungsmitteilung"},
    {"steuer", "steuererklaerung", "steuerbescheid", "einkommensteuer", "est"},
    {"kfz", "auto", "fahrzeug", "pkw", "wagen"},
    {"mietvertrag", "miete", "mieter", "vermietung", "wohnung"},
    {"zeugnis", "beurteilung", "bewertung"},
    {"versetzung", "personalverfuegung", "kommandierung"},
    {"umzug", "umzuege", "umzugskosten", "wohnungswechsel"},
    {"arzt", "arztrechnung", "behandlung", "praxis", "klinik"},
]


def norm(s: str) -> str:
    """Vergleichsform: NFC, klein, ß→ss, Umlaute→ae/oe/ue, nur Buchstaben/Ziffern."""
    s = unicodedata.normalize("NFC", s or "").lower().replace("ß", "ss")
    s = s.replace("ä", "ae").replace("ö", "oe").replace("ü", "ue")
    s = unicodedata.normalize("NFKD", s)
    s = "".join(ch for ch in s if not unicodedata.combining(ch))
    return re.sub(r"[^a-z0-9]+", " ", s).strip()


def nfc(s: str) -> str:
    return unicodedata.normalize("NFC", s or "")


def begriffe_gewichtet(frage: str, extra: list[str] | None = None) -> list[tuple[str, float]]:
    """Wie begriffe_aus, aber mit Gewicht: eigene Wörter 1.0, zusätzliche Begriffe 0.8, Synonyme 0.45."""
    eigen = set(begriffe_aus(frage, None, synonyme=False))
    extra_n = set(begriffe_aus(" ".join(extra or []), None, synonyme=False))
    return [(b, 1.0 if b in eigen else 0.8 if b in extra_n else 0.45) for b in begriffe_aus(frage, extra)]


def begriffe_aus(frage: str, extra: list[str] | None = None, synonyme: bool = True) -> list[str]:
    """Suchbegriffe (normalisiert) aus Frage + zusätzlichen Begriffen, ohne Füllwörter, mit Synonymen."""
    roh = norm(" ".join([frage or "", *(extra or [])])).split()
    t, gesehen = [], set()
    for w in roh:
        if (len(w) < 3 and not w.isdigit()) or w in STOPP or w in gesehen:
            continue
        t.append(w)
        gesehen.add(w)
    for gruppe in (SYNONYME if synonyme else []):
        if any(w in gruppe or any(w.startswith(g) or g.startswith(w) for g in gruppe if len(w) >= 6) for w in t):
            for g in sorted(gruppe):
                if g not in gesehen:
                    t.append(g)
                    gesehen.add(g)
    return t


def _gemeinsam(a: str, b: str) -> int:
    n = 0
    for x, y in zip(a, b):
        if x != y:
            break
        n += 1
    return n


def wort_treffer(begriff: str, wort: str) -> float:
    """Wie gut passt ein Suchbegriff zu einem Wort im Namen/Pfad? 0 … 1."""
    if begriff == wort:
        return 1.0
    if begriff.isdigit() or wort.isdigit():
        return 0.0
    lb, lw = len(begriff), len(wort)
    if lb >= 4 and wort.startswith(begriff):               # Wortanfang: „melde“ → „meldebescheinigung“
        return 0.85
    if lw >= 4 and begriff.startswith(wort) and lw >= lb * 0.6:
        return 0.8
    if lb >= 5 and begriff in wort:                        # Teil eines zusammengesetzten Wortes
        return 0.7
    g = _gemeinsam(begriff, wort)
    if g >= 6 or (g >= 5 and min(lb, lw) <= 8):            # gleicher Stamm: meldebestaetigung ~ meldebescheinigung
        return 0.6
    return 0.0


GESUNDHEIT_PFAD = re.compile(r"beihilfe|pkv|universa|arzt|ärzt|medizin|gesundheit|krank|klinik|befund|rezept|"
                             r"therapie|zahn|labor|röntgen|roentgen|impf|kranken|pflege|ivf|icsi|patient|diagnose",
                             re.I)


def gesundheitsdokument(pfad: str, sb: dict | None = None, text: str = "") -> bool:
    """Gesundheitsbezug am Ablageort, Steckbrief oder Inhalt erkannt? Dann geht nie Wortlaut an die Cloud."""
    if sb and sb.get("gesundheit"):
        return True
    if GESUNDHEIT_PFAD.search(nfc(pfad or "")):
        return True
    from atlas.hilfen import sensibel_gruende
    return "Gesundheitsdaten" in sensibel_gruende(text or "")


def datum_aus(name: str) -> str:
    m = DATUM.search(name or "")
    if not m:
        return ""
    j, mo, t = m.groups()
    return f"{j}-{mo}-{t}" if t and mo else f"{j}-{mo}" if mo else j


class LocalSearch:
    def __init__(self, folder: Path, shared: SharedIndex, embedder, model: str):
        folder.mkdir(parents=True, exist_ok=True)
        self.shared, self.embedder, self.model = shared, embedder, model
        self.vec_path = folder / "vektoren.f16"
        self.lock = threading.Lock()
        self.db = sqlite3.connect(folder / "suche.sqlite", check_same_thread=False)
        self.db.executescript("""
            CREATE TABLE IF NOT EXISTS docs(id TEXT PRIMARY KEY, pfad TEXT, mtime REAL,
                                            datei_mtime REAL);
            CREATE TABLE IF NOT EXISTS chunks(row INTEGER PRIMARY KEY, doc TEXT, seite INT,
                                              text TEXT, lebt INT DEFAULT 1);
            CREATE INDEX IF NOT EXISTS ch_doc ON chunks(doc);
            CREATE VIRTUAL TABLE IF NOT EXISTS fts USING fts5(text, content='chunks',
                                                             content_rowid='row');
            CREATE TABLE IF NOT EXISTS info(k TEXT PRIMARY KEY, v TEXT);
        """)
        spalten = {r[1] for r in self.db.execute("PRAGMA table_info(docs)")}
        if "fehler" not in spalten:                   # Fehler/Versuche je Dokument (für erneute Versuche)
            self.db.execute("ALTER TABLE docs ADD COLUMN fehler TEXT DEFAULT ''")
        if "versuche" not in spalten:
            self.db.execute("ALTER TABLE docs ADD COLUMN versuche INT DEFAULT 0")
        if "quelle" not in spalten:                   # archiv | mail | termin | gedaechtnis | vorgang | gespraech
            self.db.execute("ALTER TABLE docs ADD COLUMN quelle TEXT DEFAULT 'archiv'")
        # Steckbriefe: Kurzfassung je Dokument (lokales Modell) + eigener Vektor → Suche nach Bedeutung
        self.db.executescript("""
            CREATE TABLE IF NOT EXISTS steckbriefe(doc TEXT PRIMARY KEY, mtime REAL, daten TEXT, text TEXT,
                                                   vec BLOB);
            CREATE VIRTUAL TABLE IF NOT EXISTS fts_sb USING fts5(doc UNINDEXED, text);
        """)
        self.db.commit()
        self._sb_cache = None                         # (ids, Matrix) aller Steckbrief-Vektoren
        self.dim = int(self._info("dim") or 0)
        self._namen = None                            # Namensverzeichnis (wird bei Änderungen neu gebaut)
        self._wortschatz: set = set()
        self._gewichte: list = []
        if self._info("modell") not in (None, model):   # Modellwechsel -> neu aufbauen
            self.reset()

    # ---------- Hilfen ----------
    def _info(self, k):
        r = self.db.execute("SELECT v FROM info WHERE k=?", (k,)).fetchone()
        return r[0] if r else None

    def _set(self, k, v):
        self.db.execute("INSERT OR REPLACE INTO info VALUES(?,?)", (k, str(v)))

    def reset(self):
        with self.lock:
            self.db.executescript("DELETE FROM docs; DELETE FROM chunks; DELETE FROM info; DELETE FROM steckbriefe;"
                                  "DELETE FROM fts_sb;"
                                  "INSERT INTO fts(fts) VALUES('delete-all');")
            self.vec_path.unlink(missing_ok=True)
            self.dim = 0
            self._set("modell", self.model)
            self.db.commit()
            self._namen = None

    def _rows(self) -> int:
        return self.vec_path.stat().st_size // (2 * self.dim) if self.dim and self.vec_path.exists() else 0

    def _matrix(self):
        n = self._rows()
        return (np.memmap(self.vec_path, dtype=np.float16, mode="r", shape=(n, self.dim)), n) if n else (None, 0)

    # ---------- Abgleich mit dem gemeinsamen Index ----------
    def sync(self) -> int:
        """Neue/geänderte Indexdateien übernehmen, entfernte austragen."""
        changed = 0
        known = {r[0]: r[1] for r in self.db.execute("SELECT id, datei_mtime FROM docs WHERE quelle='archiv'")}
        seen = set()
        for f in self.shared.all_files():
            did = f.name.split(".")[0]
            seen.add(did)
            try:
                fm = f.stat().st_mtime
            except OSError:
                continue
            if known.get(did) == fm:
                continue
            try:
                data = self.shared.read(f)
            except Exception:
                continue
            if data.get("modell") != self.model:
                continue
            self._replace(did, data, fm)
            changed += 1
        for did in set(known) - seen:
            self._drop(did)
            changed += 1
        if changed:
            with self.lock:
                self.db.commit()
                self._namen = None
        return changed

    def _drop(self, did):
        with self.lock:
            rows = self.db.execute("SELECT row, text FROM chunks WHERE doc=? AND lebt=1", (did,)).fetchall()
            for row, text in rows:
                self.db.execute("INSERT INTO fts(fts, rowid, text) VALUES('delete', ?, ?)", (row, text))
            self.db.execute("UPDATE chunks SET lebt=0 WHERE doc=?", (did,))
            self.db.execute("DELETE FROM docs WHERE id=?", (did,))

    def _replace(self, did, data, fm, quelle: str = "archiv"):
        self._drop(did)
        vecs = data["vecs"]
        with self.lock:
            if vecs is not None and len(vecs):
                if not self.dim:
                    self.dim = vecs.shape[1]
                    self._set("dim", self.dim)
                start = self._rows()
                with open(self.vec_path, "ab") as fh:
                    fh.write(vecs.astype(np.float16).tobytes())
                for i, ch in enumerate(data["chunks"]):
                    row = start + i
                    self.db.execute("INSERT INTO chunks(row, doc, seite, text) VALUES(?,?,?,?)",
                                    (row, did, ch["seite"], ch["text"]))
                    self.db.execute("INSERT INTO fts(rowid, text) VALUES(?,?)", (row, ch["text"]))
            self.db.execute("INSERT OR REPLACE INTO docs(id, pfad, mtime, datei_mtime, fehler, versuche, quelle) "
                            "VALUES(?,?,?,?,?,?,?)",
                            (did, data["pfad"], data["mtime"], fm, data.get("fehler") or "",
                             int(data.get("versuche") or 0), quelle))

    # ---------- weitere Quellen (Mails, Termine, Gedächtnis …) – nur lokal, je Benutzer ----------
    def quelle_setzen(self, quelle: str, eintraege: list[dict], vollstaendig: bool = False) -> int:
        """eintraege: {id, pfad, mtime, texte[]} – neue/geänderte übernehmen; vollstaendig=True: Rest austragen."""
        bekannt = {r[0]: r[1] for r in self.db.execute("SELECT id, mtime FROM docs WHERE quelle=?", (quelle,))}
        neu = [e for e in eintraege if bekannt.get(e["id"]) != e["mtime"]]
        geaendert = 0
        for i in range(0, len(neu), 32):
            teil = neu[i:i + 32]
            alle = [(e, t) for e in teil for t in e["texte"] if t.strip()]
            vecs = self.embedder.embed([t for _, t in alle]) if alle else np.zeros((0, self.dim or 1))
            k = 0
            for e in teil:
                n = len([t for t in e["texte"] if t.strip()])
                self._replace(e["id"], {"pfad": e["pfad"], "mtime": e["mtime"], "vecs": vecs[k:k + n],
                                        "chunks": [{"seite": 0, "text": t} for t in e["texte"] if t.strip()]},
                              e["mtime"], quelle)
                k += n
                geaendert += 1
        if vollstaendig:
            for did in set(bekannt) - {e["id"] for e in eintraege}:
                self._drop(did)
                geaendert += 1
        with self.lock:
            self.db.commit()
        return geaendert

    # ---------- Steckbriefe ----------
    def steckbrief_offen(self, grenze: int = 20) -> list[tuple[str, str, float]]:
        """Archiv-Dokumente mit lesbarem Inhalt, aber ohne (aktuellen) Steckbrief – neueste zuerst."""
        return self.db.execute("""
            SELECT d.id, d.pfad, d.mtime FROM docs d LEFT JOIN steckbriefe s ON s.doc=d.id
            WHERE d.quelle='archiv' AND (s.doc IS NULL OR s.mtime != d.mtime)
              AND (SELECT COALESCE(SUM(LENGTH(c.text)), 0) FROM chunks c
                   WHERE c.doc=d.id AND c.lebt=1 AND c.text NOT LIKE 'Datei:%') >= 200
            ORDER BY d.mtime DESC LIMIT ?""", (grenze,)).fetchall()

    def inhalt(self, did: str, zeichen: int = 4000) -> str:
        t, out = 0, []
        for (text,) in self.db.execute("SELECT text FROM chunks WHERE doc=? AND lebt=1 AND text NOT LIKE 'Datei:%' "
                                       "ORDER BY row", (did,)):
            out.append(text)
            t += len(text)
            if t >= zeichen:
                break
        return " ".join(out)[:zeichen]

    def steckbrief_speichern(self, did: str, mtime: float, daten: dict, text: str, vec: np.ndarray) -> None:
        import json as _json
        with self.lock:
            self.db.execute("DELETE FROM fts_sb WHERE doc=?", (did,))
            self.db.execute("INSERT OR REPLACE INTO steckbriefe VALUES(?,?,?,?,?)",
                            (did, mtime, _json.dumps(daten, ensure_ascii=False), text,
                             np.asarray(vec, dtype=np.float16).tobytes()))
            self.db.execute("INSERT INTO fts_sb(doc, text) VALUES(?,?)", (did, text))
            self.db.commit()
            self._sb_cache = None

    def steckbrief(self, did: str) -> dict | None:
        import json as _json
        r = self.db.execute("SELECT daten FROM steckbriefe WHERE doc=?", (did,)).fetchone()
        try:
            return _json.loads(r[0]) if r else None
        except ValueError:
            return None

    def _steckbrief_matrix(self):
        if self._sb_cache is None:
            ids, vs = [], []
            for did, vec in self.db.execute("SELECT doc, vec FROM steckbriefe"):
                v = np.frombuffer(vec, dtype=np.float16)
                if self.dim and len(v) == self.dim:
                    ids.append(did)
                    vs.append(v)
            self._sb_cache = (ids, np.vstack(vs).astype(np.float32) if vs else None)
        return self._sb_cache

    # ---------- Namensverzeichnis ----------
    def _namensliste(self):
        if self._namen is None:
            out = []
            for did, pfad in self.db.execute("SELECT id, pfad FROM docs WHERE quelle='archiv'"):
                p = nfc(pfad)
                teile = p.split("/")
                name = teile[-1].rsplit(".", 1)[0]
                out.append((did, p, norm(name).split(), norm(" ".join(teile[:-1])).split()))
            self._namen = out
            self._wortschatz = {w for _, _, a, b in out for w in (*a, *b)}
        return self._namen

    def _nach_name(self, begriffe: list, grenze: int = 80) -> list[tuple[str, float]]:
        """Dokumente, deren Dateiname/Ordner zu den Begriffen passen – bestes zuerst.
        begriffe: Wörter oder (Wort, Gewicht). Jeder Begriff wird nur einmal gegen den Wortschatz geprüft."""
        if not begriffe:
            return []
        gew = [(b, 1.0) if isinstance(b, str) else b for b in begriffe]
        liste = self._namensliste()
        karten = []
        for b, g in gew:
            k = {}
            for w in self._wortschatz:
                t = wort_treffer(b, w)
                if t:
                    k[w] = t
            karten.append((b, g, k))
        out = []
        for did, _p, name_w, ordner_w in liste:
            sc, syn, getroffen = 0.0, 0.0, 0
            for b, g, k in karten:
                if not k:
                    continue
                best = max([k.get(w, 0.0) for w in name_w] + [0.75 * k.get(w, 0.0) for w in ordner_w])
                if not best:
                    continue
                if g >= 0.8:
                    sc += best * g
                    getroffen += not b.isdigit()
                else:                                   # Synonyme zählen nur einmal (das beste)
                    syn = max(syn, best * g)
            sc += syn
            if sc >= 0.6:
                out.append((did, sc + 0.3 * getroffen))
        out.sort(key=lambda x: -x[1])
        return out[:grenze]

    # ---------- Suche ----------
    def _treffer_roh(self, frage: str, begriffe: list[str], tief: int = 60) -> dict:
        """Ränge je Dokument aus den drei Schichten: {doc: {"name": r, "wort": r, "sinn": r, "row": bestes Stück}}."""
        docs: dict[str, dict] = {}
        # 1) Name & Ordner
        for rang, (did, _) in enumerate(self._nach_name(self._gewichte or begriffe, tief)):
            docs.setdefault(did, {})["name"] = rang
        # 2) Stichwörter im Inhalt (Originalwörter + Wortanfänge)
        roh = [w for w in re.findall(r"[\wäöüÄÖÜß]{3,}", nfc(frage)) if norm(w) not in STOPP]
        eigene = [b for b, g in (self._gewichte or [(x, 1.0) for x in begriffe]) if g >= 0.8]   # keine Synonyme
        teile = [f'"{w}"' for w in roh[:12]] + [f'"{b}"' for b in eigene[:20]]
        teile += [f'"{w[:6]}"*' for w in roh if len(w) >= 8][:8]
        if teile:
            try:
                hits = self.db.execute("SELECT c.doc, c.row FROM fts JOIN chunks c ON c.row=fts.rowid "
                                       "WHERE fts MATCH ? AND c.lebt=1 ORDER BY bm25(fts) LIMIT ?",
                                       (" OR ".join(teile), tief * 3)).fetchall()
                rang = 0
                for did, row in hits:
                    d = docs.setdefault(did, {})
                    if "wort" not in d:
                        d["wort"], rang = rang, rang + 1
                        d.setdefault("row", row)
            except sqlite3.OperationalError:
                pass
        # 3) Bedeutung
        mm, n = self._matrix()
        q = None
        if n:
            q = self.embedder.embed([" ".join([frage, *begriffe[:8]])])[0].astype(np.float32)
            best: list[tuple[float, int]] = []
            for s in range(0, n, 50_000):
                part = np.asarray(mm[s:s + 50_000], dtype=np.float32) @ q
                idx = np.argpartition(-part, min(tief * 3, len(part) - 1))[:tief * 3]
                best += [(float(part[i]), s + int(i)) for i in idx]
            best.sort(reverse=True)
            rang = 0
            for _, row in best:
                r = self.db.execute("SELECT doc FROM chunks WHERE row=? AND lebt=1", (row,)).fetchone()
                if not r:
                    continue
                d = docs.setdefault(r[0], {})
                if "sinn" not in d:
                    d["sinn"], rang = rang, rang + 1
                    d.setdefault("row", row)
                if rang >= tief:
                    break
        # 4) Kern: Steckbriefe (Kurzfassung je Dokument) – nach Bedeutung und Stichwort
        ids, mat = self._steckbrief_matrix()
        if q is not None and mat is not None:
            sc = mat @ q
            for rang, i in enumerate(np.argsort(-sc)[:tief]):
                docs.setdefault(ids[int(i)], {})["kern"] = rang
        if teile:
            try:
                for rang, (did,) in enumerate(self.db.execute(
                        "SELECT doc FROM fts_sb WHERE fts_sb MATCH ? ORDER BY bm25(fts_sb) LIMIT ?",
                        (" OR ".join(teile), tief)).fetchall()):
                    d = docs.setdefault(did, {})
                    d["kern"] = min(d.get("kern", 10**6), rang)
            except sqlite3.OperationalError:
                pass
        return docs

    def search(self, frage: str, k: int = 8, ordner: str = "", begriffe: list[str] | None = None,
               tief: int = 60, quellen: list[str] | None = None) -> list[dict]:
        b = begriffe_aus(frage, begriffe)
        self._gewichte = begriffe_gewichtet(frage, begriffe)
        roh = self._treffer_roh(frage, b, max(tief, k * 3))
        gewicht = {"name": 1.6, "wort": 1.0, "sinn": 1.0, "kern": 1.4}
        bewertet = sorted(((sum(gewicht[a] / (20 + d[a]) for a in gewicht if a in d), did, d)
                           for did, d in roh.items()), key=lambda x: -x[0])
        ordner_n = norm(ordner)
        out = []
        for sc, did, d in bewertet:
            r = self.db.execute("SELECT pfad, quelle FROM docs WHERE id=?", (did,)).fetchone()
            if not r or (quellen and r[1] not in quellen):
                continue
            if r[1] != "archiv":
                out.append(self._eintrag_quelle(did, nfc(r[0]), r[1], d, sc))
                if len(out) >= k:
                    break
                continue
            pfad = nfc(r[0])
            if ordner_n and not norm(pfad).startswith(ordner_n):
                continue
            out.append(self._eintrag(did, pfad, d, sc))
            if len(out) >= k:
                break
        return out

    def _eintrag(self, did: str, pfad: str, d: dict, sc: float) -> dict:
        auszug, seite = "", None
        if d.get("row") is not None:
            r = self.db.execute("SELECT seite, text FROM chunks WHERE row=?", (d["row"],)).fetchone()
            if r:
                seite, auszug = r
        if not auszug or auszug.startswith("Datei:"):        # lieber echten Inhalt zeigen
            r = self.db.execute("SELECT seite, text FROM chunks WHERE doc=? AND lebt=1 AND text NOT LIKE 'Datei:%' "
                                "ORDER BY row LIMIT 1", (did,)).fetchone()
            if r:
                seite, auszug = r
        teile = pfad.split("/")
        grund = [n for a, n in (("name", "Name/Ordner"), ("wort", "Stichwort im Text"), ("sinn", "inhaltlich ähnlich"),
                                ("kern", "Steckbrief passt")) if a in d]
        e = {"pfad": pfad, "name": teile[-1], "ordner": "/".join(teile[:-1]), "datum": datum_aus(teile[-1]),
             "seite": seite or None, "auszug": (auszug or "")[:400], "gefunden_ueber": grund,
             "relevanz": round(sc * 1000, 1)}
        sb = self.steckbrief(did)
        if sb:
            e["quelle"] = "archiv"
            e["art"] = sb.get("art", "")
            if not sb.get("gesundheit"):                     # Gesundheitsinhalte: nur die Art, keine Kurzfassung
                e["worum"] = sb.get("thema", "")
                for f in ("absender", "aktenzeichen", "fristen", "betraege"):
                    if sb.get(f):
                        e[f] = sb[f]
        if gesundheitsdokument(pfad, sb, auszug or ""):         # Gesundheit: kein Wortlaut, nur die Art
            e["auszug"] = ""
            e.pop("worum", None)
            e["art"] = "Gesundheitsdokument"
            e["hinweis"] = "Inhalt nur lokal – Einzelheiten mit datei_lesen (wird lokal zusammengefasst)"
            return e
        if not auszug or auszug.startswith("Datei:"):         # nur Name bekannt (Inhalt nicht lesbar / noch offen)
            e["hinweis"] = "Inhalt noch nicht gelesen (wird nachgeholt) – zum Lesen datei_lesen verwenden"
        return e

    def _eintrag_quelle(self, did: str, pfad: str, quelle: str, d: dict, sc: float) -> dict:
        """Treffer aus Mail, Termin, Gedächtnis … (pfad z. B. 'mail://2026-10-03 · Absender · Betreff')."""
        r = self.db.execute("SELECT text FROM chunks WHERE doc=? AND lebt=1 ORDER BY row LIMIT 1", (did,)).fetchone()
        titel = pfad.split("://", 1)[-1]
        return {"quelle": quelle, "titel": titel, "datum": datum_aus(titel), "pfad": pfad,
                "auszug": ((r[0] if r else "") or "")[:400], "relevanz": round(sc * 1000, 1),
                "gefunden_ueber": [n for a, n in (("wort", "Stichwort"), ("sinn", "inhaltlich ähnlich")) if a in d]}

    def thema(self, thema: str, begriffe: list[str] | None = None, anzahl: int = 40, ordner: str = "",
              quellen: list[str] | None = None) -> dict:
        """Alles zu einem Thema: viele Treffer + verwandte Dokumente, nach Ordnern gruppiert, mit Zeitachse.
        Mails, Termine, Gedächtnis und Gespräche zum Thema kommen als eigene Gruppen dazu."""
        weitere = []
        if quellen is None or any(q != "archiv" for q in quellen):
            weitere = self.search(thema, k=max(8, anzahl // 3), begriffe=begriffe,
                                  quellen=[q for q in (quellen or ["mail", "termin", "gedaechtnis", "vorgang",
                                                                    "gespraech"]) if q != "archiv"])
        treffer = self.search(thema, k=anzahl, ordner=ordner, begriffe=begriffe, tief=max(80, anzahl * 2),
                              quellen=["archiv"])
        pfade = {t["pfad"] for t in treffer}
        verwandt = []
        kern = [t["pfad"] for t in treffer[:6]]
        if kern:
            for v in self.verwandte(kern, anzahl=max(6, anzahl // 4)):
                if v["pfad"] not in pfade:
                    v["verwandt"] = True
                    verwandt.append(v)
                    pfade.add(v["pfad"])
        alle = treffer + verwandt
        # gemeinsamen Ordneranfang überspringen, nach der ersten Ebene darunter gruppieren
        teile_alle = [t["ordner"].split("/") if t["ordner"] else [] for t in alle]
        tiefe = 1                                      # tiefste Ebene mit höchstens 8 Gruppen
        for d in range(1, 8):
            if len({"/".join(x[:d]) for x in teile_alle}) <= 8:
                tiefe = d
        gruppen: dict[str, list] = {}
        for t, teile in zip(alle, teile_alle):
            g = "/".join(teile[:tiefe]) if teile else "(oberste Ebene)"
            gruppen.setdefault(g, []).append(t)
        liste = []
        for g, ds in gruppen.items():
            ds.sort(key=lambda x: x.get("datum") or "9999")
            liste.append({"ordner": g, "anzahl": len(ds), "dokumente": [
                {k: v for k, v in x.items() if k in ("datum", "name", "pfad", "auszug", "verwandt", "hinweis")}
                | {"auszug": (x.get("auszug") or "")[:200]} for x in ds]})
        liste.sort(key=lambda x: -x["anzahl"])
        namen = {"mail": "Mails", "termin": "Termine", "gedaechtnis": "Gedächtnis", "vorgang": "Vorgänge",
                 "gespraech": "Gespräche mit JARVIS"}
        for q in namen:
            es = sorted([w for w in weitere if w["quelle"] == q], key=lambda x: x.get("datum") or "9999")
            if es:
                liste.append({"ordner": namen[q], "anzahl": len(es), "eintraege": [
                    {k: v for k, v in x.items() if k in ("datum", "titel", "auszug")} | {"auszug": x["auszug"][:200]}
                    for x in es]})
        daten = sorted(t["datum"] for t in treffer + verwandt + weitere if t.get("datum"))
        return {"thema": thema, "dokumente": len(treffer) + len(verwandt), "weitere_quellen": len(weitere),
                "gruppen": liste,
                "zeitraum": f"{daten[0]} bis {daten[-1]}" if daten else "",
                "suchbegriffe": begriffe_aus(thema, begriffe)[:20]}

    def verwandte(self, pfade: list[str] | str, anzahl: int = 10) -> list[dict]:
        """Inhaltlich verwandte Dokumente (Mittelwert der Vektoren der Ausgangsdokumente)."""
        if isinstance(pfade, str):
            pfade = [pfade]
        mm, n = self._matrix()
        if not n:
            return []
        ids = []
        for p in pfade:
            want = norm(p)
            r = next((did for did, pf, _, _ in self._namensliste() if norm(pf) == want), None)
            if r:
                ids.append(r)
        rows = [row for did in ids for (row,) in self.db.execute(
            "SELECT row FROM chunks WHERE doc=? AND lebt=1 AND row < ?", (did, n))]
        if not rows:
            return []
        q = np.asarray(mm[rows], dtype=np.float32).mean(axis=0)
        q /= (np.linalg.norm(q) or 1.0)
        best: list[tuple[float, int]] = []
        for s in range(0, n, 50_000):
            part = np.asarray(mm[s:s + 50_000], dtype=np.float32) @ q
            idx = np.argpartition(-part, min(400, len(part) - 1))[:400]
            best += [(float(part[i]), s + int(i)) for i in idx]
        best.sort(reverse=True)
        out, gesehen = [], set(ids)
        for sc, row in best:
            r = self.db.execute("SELECT c.doc, d.pfad, c.seite, c.text FROM chunks c JOIN docs d ON d.id=c.doc "
                                "WHERE c.row=? AND c.lebt=1 AND d.quelle='archiv'", (row,)).fetchone()
            if not r or r[0] in gesehen:
                continue
            gesehen.add(r[0])
            pfad = nfc(r[1])
            teile = pfad.split("/")
            gs = gesundheitsdokument(pfad, self.steckbrief(r[0]), r[3] or "")
            out.append({"pfad": pfad, "name": teile[-1], "ordner": "/".join(teile[:-1]), "datum": datum_aus(teile[-1]),
                        "seite": r[2] or None, "auszug": "" if gs else (r[3] or "")[:300], "aehnlichkeit": round(sc, 3),
                        **({"art": "Gesundheitsdokument"} if gs else {})})
            if len(out) >= anzahl:
                break
        return out

    def doc_text(self, rel_path: str) -> list[tuple[int, str]] | None:
        want = norm(rel_path)
        did = next((d for d, pf, _, _ in self._namensliste() if norm(pf) == want), None)
        if not did:
            return None
        return self.db.execute("SELECT seite, text FROM chunks WHERE doc=? AND lebt=1 ORDER BY row",
                               (did,)).fetchall()

    def known(self) -> dict[str, float]:
        return {p: m for p, m in self.db.execute("SELECT pfad, mtime FROM docs WHERE quelle='archiv'")}

    def fehlerhaft(self) -> dict[str, tuple[str, int]]:
        """Dokumente, deren Inhalt nicht gelesen werden konnte: {pfad: (fehler, versuche)}."""
        return {p: (f or "", int(v or 0)) for p, f, v in self.db.execute(
            "SELECT pfad, fehler, versuche FROM docs WHERE quelle='archiv' AND (fehler != '' OR NOT EXISTS "
            "(SELECT 1 FROM chunks c WHERE c.doc=docs.id AND c.lebt=1))")}

    def stats(self) -> dict:
        try:
            d = self.db.execute("SELECT COUNT(*) FROM docs WHERE quelle='archiv'").fetchone()[0]
            c = self.db.execute("SELECT COUNT(*) FROM chunks WHERE lebt=1").fetchone()[0]
            f = self.db.execute("SELECT COUNT(*) FROM docs WHERE quelle='archiv' AND fehler != ''").fetchone()[0]
            sb = self.db.execute("SELECT COUNT(*) FROM steckbriefe").fetchone()[0]
            q = dict(self.db.execute("SELECT quelle, COUNT(*) FROM docs WHERE quelle != 'archiv' GROUP BY quelle"))
            self._stats = {"dokumente": d, "abschnitte": c, "ohne_inhalt": f, "steckbriefe": sb, "quellen": q}
        except Exception:                      # Index wird gerade geschrieben – letzten Stand zeigen
            pass
        return getattr(self, "_stats", {"dokumente": 0, "abschnitte": 0})
