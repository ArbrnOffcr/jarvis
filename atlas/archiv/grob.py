"""Schnelle Vorauswahl für die Bedeutungssuche.

Bisher wurde bei JEDER Suche die ganze Vektordatei (alle Textstücke × 1024 Werte, halbe Genauigkeit) gelesen,
umgerechnet und verglichen – bei 665 000 Stücken rund 4,6 Sekunden. Jetzt:

1. Einmalig (und bei neuen Stücken nur für die neuen) wird jedes Stück auf 128 Hauptrichtungen verkleinert
   (Hauptachsen aus einer Stichprobe). Diese kleine Tabelle liegt im Arbeitsspeicher, solange die App läuft.
2. Je Suche: grober Vergleich mit der kleinen Tabelle → die besten paar tausend Kandidaten (wie viele nötig sind,
   misst der Aufbau am eigenen Bestand aus und nimmt die kleinste Stufe, die mindestens 99,5 % Treue erreicht).
3. Nur diese Kandidaten werden mit den vollen Vektoren exakt nachgerechnet – die Rangfolge der Treffer ist damit
   dieselbe wie bei der vollständigen Suche, solange der richtige Treffer unter den Kandidaten ist.

Beim Aufbau prüft sich das Verfahren selbst (Treue: Anteil der echten Top-Treffer, die es findet). Liegt sie
unter der Schwelle, bleibt die bisherige vollständige Suche aktiv. Alles lokal; die Dateien liegen neben dem Index."""
from __future__ import annotations

import json
import threading
from pathlib import Path

import numpy as np

K = 128                 # Hauptrichtungen
STUFEN = (4000, 10_000, 20_000, 40_000)   # Kandidaten, die exakt nachgerechnet werden – die kleinste Stufe, die reicht
STICHPROBE = 30_000
BLOCK = 50_000
MIN_STUECKE = 60_000    # darunter ist die vollständige Suche schnell genug
MIN_TREUE = 0.995
NACHLAUF = 20_000       # so viele neue Stücke dürfen fehlen – sie werden je Suche vollständig mitgeprüft


class Grob:
    def __init__(self, ordner: Path):
        self.basis_pfad = ordner / "vektoren_grob_basis.npy"
        self.klein_pfad = ordner / "vektoren_grob.f16"
        self.meta_pfad = ordner / "vektoren_grob.json"
        self.lock = threading.Lock()
        self.V: np.ndarray | None = None          # (dim, K)
        self.M: np.ndarray | None = None          # (n, K) float32 im Arbeitsspeicher
        self.n = 0
        self.treue: float | None = None
        self.kand = STUFEN[0]
        self.aus = ""                             # Grund, falls abgeschaltet
        self._baut = False

    # ------------------------------------------------------------ Zustand
    def bereit(self, n: int) -> bool:
        return self.M is not None and self.n == n and not self.aus

    def nutzbar(self, n: int) -> bool:
        """Auch brauchbar, wenn seit dem Aufbau ein paar Stücke dazugekommen sind (die prüft die Suche direkt)."""
        return self.M is not None and not self.aus and 0 <= n - self.n <= NACHLAUF

    def freigeben(self) -> bool:
        """Arbeitsspeicher freigeben (App geschlossen) – die Dateien bleiben, das Laden dauert unter einer Sekunde."""
        with self.lock:
            war = self.M is not None
            self.M, self.n = None, 0
            return war

    def verwerfen(self) -> None:
        with self.lock:
            self.M, self.V, self.n, self.treue, self.aus, self.kand = None, None, 0, None, "", STUFEN[0]
            for p in (self.basis_pfad, self.klein_pfad, self.meta_pfad):
                p.unlink(missing_ok=True)

    def stand(self) -> dict:
        return {"aktiv": self.M is not None and not self.aus, "stuecke": self.n, "treue": self.treue, "kandidaten": self.kand,
                "aus": self.aus, "mb": round(self.M.nbytes / 1e6) if self.M is not None else 0}

    # ------------------------------------------------------------ Aufbau
    def _meta(self) -> dict:
        try:
            return json.loads(self.meta_pfad.read_text(encoding="utf-8"))
        except (OSError, ValueError):
            return {}

    def sicherstellen(self, mm, n: int, dim: int, hintergrund: bool = True) -> None:
        """Kleine Tabelle laden/ergänzen/neu bauen. Im Hintergrund – die Suche läuft so lange vollständig."""
        if n < MIN_STUECKE or self.bereit(n) or self._baut or self.aus:
            return
        self._baut = True
        if hintergrund:
            threading.Thread(target=self._bauen, args=(mm, n, dim), daemon=True, name="grob").start()
        else:
            self._bauen(mm, n, dim)

    def _bauen(self, mm, n: int, dim: int) -> None:
        try:
            with self.lock:
                meta = self._meta()
                V = None
                if (meta.get("dim") == dim and meta.get("k") == K and self.basis_pfad.exists()
                        and self.klein_pfad.exists() and 0 < meta.get("n", 0) <= n
                        and self.klein_pfad.stat().st_size == meta["n"] * K * 2):
                    V = np.load(self.basis_pfad)
                    alt = meta["n"]
                else:
                    alt = 0
                    schritt = max(1, n // STICHPROBE)
                    probe = np.asarray(mm[::schritt][:STICHPROBE], dtype=np.float32)
                    # Hauptachsen OHNE Zentrieren: so bleibt das Skalarprodukt (Ähnlichkeit) bestmöglich erhalten
                    _, _, vt = np.linalg.svd(probe, full_matrices=False)
                    V = np.ascontiguousarray(vt[:K].T.astype(np.float32))
                    np.save(self.basis_pfad, V)
                    self.klein_pfad.unlink(missing_ok=True)
                with open(self.klein_pfad, "ab") as fh:
                    for s in range(alt, n, BLOCK):
                        fh.write((np.asarray(mm[s:s + BLOCK], dtype=np.float32) @ V).astype(np.float16).tobytes())
                M = np.fromfile(self.klein_pfad, dtype=np.float16).reshape(-1, K).astype(np.float32)
                if len(M) != n:
                    raise ValueError(f"kleine Tabelle hat {len(M)} statt {n} Zeilen")
                if alt and alt >= n * 0.8 and meta.get("treue") is not None and meta.get("kand"):
                    treue, kand = meta["treue"], int(meta["kand"])
                else:
                    treue, kand = self._treue_messen(mm, n, V, M)
                self.meta_pfad.write_text(json.dumps({"dim": dim, "k": K, "n": n, "treue": treue, "kand": kand}),
                                          encoding="utf-8")
                self.V, self.M, self.n, self.treue, self.kand = V, M, n, treue, kand
                if treue is not None and treue < MIN_TREUE:
                    self.aus = f"Treue {treue:.2f} unter {MIN_TREUE} – vollständige Suche bleibt aktiv"
                    self.M = None
        except Exception as e:                     # nie die Suche gefährden: dann eben vollständig wie bisher
            self.aus = f"{type(e).__name__}: {e}"[:160]
            self.M = None
        finally:
            self._baut = False

    def _treue_messen(self, mm, n: int, V, M, fragen: int = 32, top: int = 60) -> tuple[float, int]:
        """Anteil der echten besten Treffer, die die Vorauswahl findet – und die kleinste Kandidatenzahl, die reicht.
        Fragen: echte Stücke und (schwerer) Mischungen aus zwei Stücken, wie eine Frage, die zwei Themen berührt."""
        rng = np.random.default_rng(7)
        idx = np.sort(rng.choice(n, size=min(fragen, n), replace=False))
        Q = np.asarray(mm[idx], dtype=np.float32)                     # (f, dim)
        Q = Q[np.any(Q != 0, axis=1)]
        if len(Q) < 2:
            return 1.0, STUFEN[0]
        h = len(Q) // 2
        Q[:h] = Q[:h] + Q[h:2 * h]                                    # erste Hälfte: Mischfragen
        Q /= np.linalg.norm(Q, axis=1, keepdims=True)
        beste = [[] for _ in Q]
        for s in range(0, n, BLOCK):                                  # ein vollständiger Durchgang für alle Fragen
            sc = np.asarray(mm[s:s + BLOCK], dtype=np.float32) @ Q.T  # (block, f)
            for j in range(len(Q)):
                sp = sc[:, j]
                i = np.argpartition(-sp, min(top, len(sp) - 1))[:top]
                beste[j] += [(float(sp[x]), s + int(x)) for x in i]
        echt = [{r for _, r in sorted(b, reverse=True)[:top]} for b in beste]
        grob = [M @ (q @ V) for q in Q]
        treue = 0.0
        for stufe in STUFEN:
            c = min(stufe, n)
            treffer = sum(len(e & set(np.argpartition(-g, c - 1)[:c].tolist())) for e, g in zip(echt, grob))
            treue = round(treffer / max(sum(len(e) for e in echt), 1), 4)
            if treue >= MIN_TREUE:
                return treue, stufe
        return treue, STUFEN[-1]

    # ------------------------------------------------------------ Suche
    @staticmethod
    def _kandidaten(q, V, M, anzahl: int) -> np.ndarray:
        sc = M @ (q @ V)
        anzahl = min(anzahl, len(sc))
        return np.argpartition(-sc, anzahl - 1)[:anzahl]

    def beste(self, mm, q: np.ndarray, anzahl: int) -> list[tuple[float, int]] | None:
        """Die besten Stücke (Wert, Zeile), exakt nachgerechnet – oder None, wenn die Vorauswahl nicht bereitsteht."""
        V, M = self.V, self.M
        if V is None or M is None or self.aus:
            return None
        kand = np.sort(self._kandidaten(q.astype(np.float32), V, M, self.kand))
        if len(mm) > len(M):                                          # neue Stücke seit dem Aufbau: alle mitprüfen
            kand = np.concatenate([kand, np.arange(len(M), len(mm))])
        genau = np.asarray(mm[kand], dtype=np.float32) @ q
        ordnung = np.argsort(-genau)[:anzahl]
        return [(float(genau[i]), int(kand[i])) for i in ordnung]
