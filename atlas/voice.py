"""Sprache: Erkennung (Whisper, lokal), Aktivierungswort (openWakeWord,
lokal, ohne Konto) und Ausgabe (ElevenLabs, bei sensiblen Inhalten/offline macOS-Stimme).

Das Mikrofon gehört dem Dashboard (Safari regelt die Erlaubnis); es schickt
16-kHz-Audio in kleinen Paketen über /audio an den Kern."""
import json
import re
import subprocess
import tempfile
import threading
import time
from pathlib import Path

import httpx
import numpy as np

from atlas.keystore import get_secret
from atlas.paths import private_dir, read_private_json, write_private_json

RATE = 16000
RATE_TTS = 24000
STANDARD_STIMME = "onwK4e9ZLuTAKqWW03F9"      # ElevenLabs „Daniel“, falls keine eigene Voice-ID gewählt
# Whisper „hört“ in Stille gern Abspanntexte – solche Stücke verwerfen
HALLUZINATION = re.compile(r"^\W*(untertitel(ung)?\b.{0,60}|vielen dank (fürs|für's|für das|für ihre) "
                           r"(zuschauen|aufmerksamkeit)\W*|copyright.{0,40}|.{0,20}amara\.org.{0,40}|"
                           r"thanks for watching\W*)$", re.I)
SETTINGS = "sprache.json"
DEFAULTS = {"stimme_de": "", "stimme_en": "", "modell": "eleven_flash_v2_5",
            "lokal_de": "Anna", "lokal_en": "Samantha",
            "whisper": "mlx-community/whisper-large-v3-turbo",
            # fertiges Modell (z. B. "hey_jarvis") oder eigene .onnx-Datei in ATLAS-Privat
            "weckwort_modell": "hey_jarvis", "empfindlichkeit": 0.5,
            # False = immer ElevenLabs (auch bei sensiblen Themen); True = sensible Inhalte mit Mac-Stimme
            "sensibel_lokal": False,
            # Gespräch: nach jeder gesprochenen Antwort so viele Sekunden weiter zuhören (0 = aus)
            "gespraech_sek": 6,
            # Dazwischenreden stoppt JARVIS; Lautstärkeschwelle (höher = unempfindlicher gegen eigenes Echo)
            "unterbrechen": True, "unterbrechen_schwelle": 1400}

DE_WORDS = set("der die das und ist nicht ich du wir sie ein eine mit für auf zu den dem im es "
               "auch noch wie bitte danke heute morgen termin habe hast wird werden".split())
EN_WORDS = set("the and is are not you we they a an with for on to of in it this that "
               "please thanks today tomorrow have has will would".split())


def settings() -> dict:
    return read_private_json(SETTINGS, DEFAULTS)


def save_settings(**kw) -> dict:
    cur = settings()
    cur.update({k: v for k, v in kw.items() if k in DEFAULTS})
    write_private_json(SETTINGS, cur)
    return cur


def detect_lang(text: str) -> str:
    """Deutsch ist Standard; Englisch nur bei eindeutig englischem, längerem Text."""
    words = re.findall(r"[a-zäöüß]+", text.lower())
    de = sum(w in DE_WORDS for w in words) + 2 * len(re.findall(r"[äöüß]", text.lower()))
    en = sum(w in EN_WORDS for w in words)
    return "en" if len(words) >= 6 and en >= 3 and en > 2 * de else "de"


def clean_for_speech(text: str) -> str:
    t = re.sub(r"`{1,3}[^`]*`{1,3}", "", text)
    t = re.sub(r"[*_#>|]+", "", t)
    t = re.sub(r"^\s*[-•]\s+", "", t, flags=re.M)
    t = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", t)
    t = t.replace("→", " ").replace("·", ",")
    return re.sub(r"\s+", " ", t).strip()


# ---------------------------------------------------------------- Ausgabe
class Speaker:
    def __init__(self):
        self.last = {"engine": "–", "grund": "noch nichts gesprochen"}
        # eine dauerhafte Verbindung zu ElevenLabs: kein TLS-Aufbau vor jedem Satz
        self.http = httpx.Client(timeout=httpx.Timeout(30, connect=5),
                                 limits=httpx.Limits(max_keepalive_connections=4, keepalive_expiry=300))
        self._warm = 0.0

    def vorwaermen(self) -> None:
        if time.monotonic() - self._warm < 60 or not get_secret("elevenlabs"):
            return
        self._warm = time.monotonic()

        def los():
            try:
                self.http.get("https://api.elevenlabs.io/v1/models",
                              headers={"xi-api-key": get_secret("elevenlabs")}, timeout=5)
            except Exception:
                pass
        threading.Thread(target=los, daemon=True).start()

    def _vorbereiten(self, text: str, lang: str):
        text = clean_for_speech(text)[:2000]
        if not text:
            return "", lang
        lang = lang or detect_lang(text)
        from atlas.sprechtext import normalisieren
        return normalisieren(text, lang)[:2500], lang

    def stream(self, text: str, lang: str = "", privat: bool = False):
        """Gestreamte Ausgabe: (Kopfdaten, Generator mit 16-bit-PCM, 24 kHz mono). Der erste Ton
        kommt so nach wenigen hundert Millisekunden, statt erst nach dem ganzen Satz."""
        text, lang = self._vorbereiten(text, lang)
        if not text:
            return {"engine": "–", "rate": RATE_TTS}, iter(())
        s = settings()
        key, voice = get_secret("elevenlabs"), s.get(f"stimme_{lang}") or s.get("stimme_de") or STANDARD_STIMME
        if privat and s.get("sensibel_lokal"):
            grund = "sensibler Inhalt – bleibt auf dem Mac"
        elif not key:
            grund = "kein ElevenLabs-Schlüssel ('jarvis setup sprache')"
        elif not voice:
            grund = f"keine Voice-ID für {lang.upper()} ('jarvis stimme {lang} <ID>')"
        else:
            self._sem.acquire()
            try:
                r = None
                for versuch in range(4):
                    req = self.http.build_request(
                        "POST", f"https://api.elevenlabs.io/v1/text-to-speech/{voice}/stream",
                        params={"output_format": f"pcm_{RATE_TTS}", "optimize_streaming_latency": 3},
                        headers={"xi-api-key": key},
                        json={"text": text, "model_id": s["modell"], "language_code": lang})
                    r = self.http.send(req, stream=True)
                    if r.status_code in (409, 429) and versuch < 3:
                        r.close()
                        time.sleep(0.35 * (versuch + 1))
                        continue
                    break
                if r.status_code >= 400:
                    r.read()
                    grund = f"ElevenLabs {r.status_code}: {r.text[:160]}"
                    r.close()
                    self._sem.release()
                else:
                    self.last = {"engine": "ElevenLabs", "grund": f"Stimme {lang.upper()}", "lang": lang}
                    sem = self._sem

                    def gen():
                        try:
                            for chunk in r.iter_bytes(4800):
                                yield chunk
                        except httpx.HTTPError:
                            pass
                        finally:
                            r.close()
                            sem.release()
                    return {**self.last, "rate": RATE_TTS}, gen()
            except httpx.HTTPError as e:
                self._sem.release()
                grund = f"ElevenLabs nicht erreichbar: {e}"[:160]
        self.last = {"engine": "macOS", "grund": grund, "lang": lang}
        pcm = self._macos_pcm(text, s[f"lokal_{lang}"])
        return {**self.last, "rate": RATE_TTS}, iter([pcm])

    @staticmethod
    def _macos_pcm(text, voice) -> bytes:
        import wave
        with tempfile.TemporaryDirectory() as d:
            out = Path(d) / "a.wav"
            cmd = ["say", "-v", voice, "--file-format=WAVE", f"--data-format=LEI16@{RATE_TTS}", "-o", str(out), text]
            if subprocess.run(cmd, capture_output=True).returncode != 0:
                subprocess.run(cmd[:1] + cmd[3:], capture_output=True, check=True)
            with wave.open(str(out)) as w:
                return w.readframes(w.getnframes())

    def tts(self, text: str, lang: str = "", privat: bool = False) -> tuple[bytes, str]:
        """Liefert (Audiodaten, MIME-Typ); self.last nennt Stimme und Grund."""
        text = clean_for_speech(text)[:2000]
        if not text:
            return b"", "audio/mpeg"
        lang = lang or detect_lang(text)
        from atlas.sprechtext import normalisieren
        text = normalisieren(text, lang)[:2500]           # Zahlen, Beträge, Daten ausschreiben
        s = settings()
        key, voice = get_secret("elevenlabs"), s.get(f"stimme_{lang}") or s.get("stimme_de") or STANDARD_STIMME
        if privat and s.get("sensibel_lokal"):
            grund = "sensibler Inhalt – bleibt auf dem Mac"
        elif not key:
            grund = "kein ElevenLabs-Schlüssel ('jarvis setup sprache')"
        elif not voice:
            grund = f"keine Voice-ID für {lang.upper()} ('jarvis stimme {lang} <ID>')"
        else:
            try:
                audio = self._eleven(text, lang, key, voice, s["modell"])
                self.last = {"engine": "ElevenLabs", "grund": f"Stimme {lang.upper()}", "lang": lang}
                return audio, "audio/mpeg"
            except httpx.HTTPStatusError as e:
                grund = f"ElevenLabs {e.response.status_code}: {e.response.text[:160]}"
            except httpx.HTTPError as e:
                grund = f"ElevenLabs nicht erreichbar: {e}"[:160]
        self.last = {"engine": "macOS", "grund": grund, "lang": lang}
        return self._macos(text, s[f"lokal_{lang}"]), "audio/wav"

    _sem = threading.BoundedSemaphore(3)            # ElevenLabs verträgt wenige parallele Anfragen

    @classmethod
    def _eleven(cls, text, lang, key, voice, model) -> bytes:
        """409 'already_running' (Bibliotheksstimme wird gerade dem Konto zugeordnet) und 429
        (zu viele gleichzeitige Anfragen) sind vorübergehend – kurz warten und erneut versuchen,
        statt auf die Mac-Stimme auszuweichen."""
        with cls._sem:
            for versuch in range(4):
                r = httpx.post(f"https://api.elevenlabs.io/v1/text-to-speech/{voice}",
                               params={"output_format": "mp3_44100_128", "optimize_streaming_latency": 2},
                               headers={"xi-api-key": key},
                               json={"text": text, "model_id": model, "language_code": lang},
                               timeout=30)
                if r.status_code in (409, 429) and versuch < 3:
                    time.sleep(0.35 * (versuch + 1))
                    continue
                r.raise_for_status()
                return r.content

    @staticmethod
    def _macos(text, voice) -> bytes:
        with tempfile.TemporaryDirectory() as d:
            out = Path(d) / "a.wav"
            cmd = ["say", "-v", voice, "--file-format=WAVE", "--data-format=LEI16@22050", "-o", str(out), text]
            if subprocess.run(cmd, capture_output=True).returncode != 0:      # Stimme fehlt
                subprocess.run(cmd[:1] + cmd[3:], capture_output=True, check=True)
            return out.read_bytes()


# ---------------------------------------------------------------- Erkennung
class Transcriber:
    def __init__(self):
        self.lock = threading.Lock()

    def transcribe(self, pcm: np.ndarray, sprache: str | None = None, vorher: str = "") -> dict:
        import mlx_whisper                      # lädt das Modell beim ersten Mal (~1,6 GB)
        audio = pcm.astype(np.float32) / 32768.0
        extra = {}
        if sprache:
            extra["language"] = sprache
        if vorher:
            extra["initial_prompt"] = vorher[-120:]
        with self.lock:
            r = mlx_whisper.transcribe(audio, path_or_hf_repo=settings()["whisper"],
                                       condition_on_previous_text=False, **extra)
        lang = r.get("language") or sprache or "de"
        return {"text": (r.get("text") or "").strip(), "lang": lang if lang in ("de", "en") else "de"}


_STT_POOL = None


def _pool():
    global _STT_POOL
    if _STT_POOL is None:
        from concurrent.futures import ThreadPoolExecutor
        _STT_POOL = ThreadPoolExecutor(max_workers=1, thread_name_prefix="stt")
    return _STT_POOL


# ---------------------------------------------------------------- Mikrofon-Strom
class VoiceSession:
    """Verarbeitet den Audiostrom eines Dashboards: Weckwort erkennen bzw. auf Tastendruck
    aufnehmen, Satzende erkennen, an Whisper geben.

    Schneller durch Vorab-Erkennung: Sobald du beim Sprechen kurz absetzt, wird das bisher Gesagte
    schon im Hintergrund erkannt. Am Ende muss nur noch das letzte Stück erkannt werden.
    Modi: idle | wake (selbst erkanntes Ende) | ptt (Taste) | monitor (JARVIS spricht: auf Dazwischenreden achten)."""
    SILENCE_END = 0.6      # Sekunden Stille nach Sprache = Ende (kürzer = schnellere Antwort)
    NO_SPEECH = 4.0        # nach Weckwort so lange auf Sprache warten
    MAX_LEN = 20.0
    PAUSE_SCHNITT = 0.32   # kurze Sprechpause → bisheriges Stück vorab erkennen
    MIN_STUECK = 1.2       # … wenn es mindestens so viel Sprache enthält

    def __init__(self, wake: bool, transcriber: "Transcriber | None" = None):
        self.mode = "idle"
        self.buf: list[np.ndarray] = []
        self.oww = None
        self.wake_error = ""
        self.wake_label = ""
        self.pending = np.zeros(0, dtype=np.int16)
        self.tr = transcriber
        if wake:
            self._init_wake()
        self.noise = 300.0                  # gleitender Grundpegel
        self.no_speech = self.NO_SPEECH
        self.ring: list[np.ndarray] = []    # letzte ~0,6 s im Monitor-Modus
        self._reset_counters()

    def _init_wake(self):
        name = settings()["weckwort_modell"]
        try:
            import openwakeword
            from openwakeword.model import Model
        except ImportError:
            self.wake_error = "openWakeWord nicht installiert – 'jarvis update'"
            return
        try:
            custom = private_dir() / name
            dl = getattr(openwakeword.utils, "download_models", None)   # ab Version 0.6
            if name.endswith(".onnx"):
                if not custom.exists():
                    self.wake_error = f"Weckwort-Modell fehlt: iCloud Drive/ATLAS-Privat/{name}"
                    return
                models = [str(custom)]
            else:
                models = [name]
            if dl:                       # Grund- und Weckwortmodelle einmalig laden (wenige MB)
                dl(model_names=[] if name.endswith(".onnx") else [name])
            self.oww = Model(wakeword_models=models, inference_framework="onnx")
            self.wake_label = "HEY " + name.replace(".onnx", "").replace("hey_", "").replace("_", " ").upper()
        except Exception as e:
            self.wake_error = f"Weckwort: {e}"[:160]

    def _reset_counters(self):
        self.t = 0.0
        self.heard = False
        self.silence = 0.0
        self.n = 0                  # Samples der laufenden Aufnahme
        self.seg_start = 0          # Beginn des noch nicht vorab erkannten Stücks
        self.seg_sprache = 0.0
        self.stuecke = []           # Futures der Vorab-Erkennung (in Reihenfolge)
        self.texte: list[str] = []
        self.sprache: str | None = None
        self.anlauf = 0.0           # Monitor: zusammenhängende Sprache
        self.echo = 0.0             # Monitor: Pegel des eigenen Echos

    def start(self, mode: str, no_speech: float | None = None):
        self.mode, self.buf = mode, []
        self._reset_counters()
        self.no_speech = no_speech or self.NO_SPEECH
        self.ring = []

    def _rms(self, pcm) -> float:
        return float(np.sqrt(np.mean(pcm.astype(np.float32) ** 2))) if len(pcm) else 0.0

    # ---- Vorab-Erkennung
    def _stueck(self, audio: np.ndarray):
        texte, tr = self.texte, self.tr          # an diese Aufnahme gebunden

        def job():
            if not tr:
                return None
            r = tr.transcribe(audio, self.sprache if texte is self.texte else None, " ".join(texte))
            if r["text"] and not HALLUZINATION.search(r["text"]):
                texte.append(r["text"])
                if texte is self.texte:
                    self.sprache = self.sprache or r["lang"]
            return r
        self.stuecke.append(_pool().submit(job))

    def _schneiden(self, ende: bool = False):
        audio = np.concatenate(self.buf)[self.seg_start:self.n] if self.buf else np.zeros(0, np.int16)
        self.seg_start = self.n
        sprache, self.seg_sprache = self.seg_sprache, 0.0
        return audio, sprache

    def feed(self, chunk: bytes) -> str | None:
        """Neue Audiodaten. Rückgabe: 'wake', 'bargein', 'done', 'cancel' oder None."""
        pcm = np.frombuffer(chunk, dtype=np.int16)
        dur = len(pcm) / RATE
        if self.mode == "idle":
            if not self.oww:
                return None
            self.pending = np.concatenate([self.pending, pcm])
            thr = settings()["empfindlichkeit"]
            while len(self.pending) >= 1280:                 # 80-ms-Pakete
                frame, self.pending = self.pending[:1280], self.pending[1280:]
                if max(self.oww.predict(frame).values()) >= thr:
                    self.oww.reset()
                    self.pending = np.zeros(0, dtype=np.int16)
                    self.start("wake")
                    return "wake"
            self.noise = 0.98 * self.noise + 0.02 * self._rms(pcm)
            return None

        rms = self._rms(pcm)
        if self.mode == "monitor":                           # JARVIS spricht gerade
            self.ring.append(pcm)
            while sum(len(x) for x in self.ring) > RATE * 0.6:
                self.ring.pop(0)
            st = settings()
            self.t += dur
            if self.t < 0.4:                                 # Anfang: nur den Echopegel lernen
                self.echo = max(self.echo, rms)
                return None
            # Echo der eigenen Stimme: Grundpegel während JARVIS spricht laufend mitlernen
            schwelle = max(float(st.get("unterbrechen_schwelle", 1400)), self.noise * 4, self.echo * 3)
            if rms > schwelle:
                self.anlauf += dur
            else:
                self.anlauf = max(0.0, self.anlauf - dur)
                self.echo = 0.96 * self.echo + 0.04 * rms
            if self.anlauf >= 0.25:
                vorlauf = list(self.ring)
                self.start("wake", no_speech=self.NO_SPEECH)
                self.buf = vorlauf
                self.n = sum(len(x) for x in vorlauf)
                self.t = self.n / RATE
                self.heard, self.seg_sprache = True, 0.25
                return "bargein"
            return None

        self.buf.append(pcm)
        self.n += len(pcm)
        self.t += dur
        speaking = rms > max(500.0, self.noise * 2.5)
        if speaking:
            self.heard, self.silence = True, 0.0
            self.seg_sprache += dur
        else:
            self.silence += dur
        # Pause im Satz: bisheriges Stück schon erkennen lassen
        if self.tr and self.seg_sprache >= self.MIN_STUECK and self.silence >= self.PAUSE_SCHNITT:
            audio, _ = self._schneiden()
            self._stueck(audio)
        if self.mode == "ptt":
            return "done" if self.t >= 60 else None
        if not self.heard and self.t > self.no_speech:
            self.mode = "idle"
            return "cancel"
        if (self.heard and self.silence > self.SILENCE_END) or self.t > self.MAX_LEN:
            return "done"
        return None

    def abschliessen(self) -> dict:
        """Ende der Aufnahme: wartet auf die Vorab-Erkennung und erkennt nur noch den Rest.
        Liefert {"text","lang","s_audio","stuecke"}."""
        stuecke = list(self.stuecke)
        rest, rest_sprache = self._schneiden()
        dauer = self.n / RATE
        voll = np.concatenate(self.buf) if self.buf else np.zeros(0, dtype=np.int16)
        self.mode, self.buf = "idle", []
        if not stuecke:                                    # kurzer Satz: alles auf einmal
            r = self.tr.transcribe(voll) if len(voll) else {"text": "", "lang": "de"}
            if HALLUZINATION.search(r["text"]):
                r = {**r, "text": ""}
            self._reset_counters()
            return {**r, "s_audio": round(dauer, 2), "stuecke": 1}
        try:
            for f in stuecke:
                f.result(timeout=30)
            if rest_sprache >= 0.15 and len(rest) > RATE * 0.25:
                r = self.tr.transcribe(rest, self.sprache, " ".join(self.texte))
                if r["text"] and not HALLUZINATION.search(r["text"]):
                    self.texte.append(r["text"])
            text = " ".join(t.strip() for t in self.texte if t.strip())
            out = {"text": text, "lang": self.sprache or "de"}
        except Exception:                                  # im Zweifel alles noch einmal am Stück
            out = self.tr.transcribe(voll)
        n = len(stuecke) + 1
        self._reset_counters()
        return {**out, "s_audio": round(dauer, 2), "stuecke": n}

    def take(self) -> np.ndarray:
        audio = np.concatenate(self.buf) if self.buf else np.zeros(0, dtype=np.int16)
        self.mode, self.buf = "idle", []
        self._reset_counters()
        return audio

    def close(self):
        self.oww = None
