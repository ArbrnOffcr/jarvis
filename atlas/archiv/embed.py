"""Text -> Vektor (Bedeutung) mit einem lokalen Embedding-Modell über Ollama."""
import httpx
import numpy as np


class Embedder:
    def __init__(self, url: str, model: str):
        self.url, self.model = url.rstrip("/"), model

    def ensure_model(self) -> None:
        r = httpx.get(f"{self.url}/api/tags", timeout=5)
        names = [m["name"] for m in r.json().get("models", [])]
        if not any(n == self.model or n.split(":")[0] == self.model for n in names):
            httpx.post(f"{self.url}/api/pull", json={"model": self.model, "stream": False},
                       timeout=httpx.Timeout(10, read=3600)).raise_for_status()

    def embed(self, texts: list[str], batch: int = 32) -> np.ndarray:
        vecs = []
        for i in range(0, len(texts), batch):
            r = httpx.post(f"{self.url}/api/embed",
                           json={"model": self.model, "input": texts[i:i + batch]},
                           timeout=httpx.Timeout(10, read=600))
            r.raise_for_status()
            vecs += r.json()["embeddings"]
        arr = np.asarray(vecs, dtype=np.float32)
        norms = np.linalg.norm(arr, axis=1, keepdims=True)
        return arr / np.maximum(norms, 1e-9)
