// Mikrofon -> 16 kHz, 16 Bit, Pakete à 512 Samples (32 ms) für den JARVIS-Kern
class Mic16k extends AudioWorkletProcessor {
  constructor() {
    super();
    this.ratio = sampleRate / 16000;
    this.pos = 0;
    this.out = new Int16Array(512);
    this.n = 0;
  }
  process(inputs) {
    const ch = inputs[0] && inputs[0][0];
    if (!ch) return true;
    // lineare Interpolation auf 16 kHz
    while (this.pos < ch.length) {
      const i = Math.floor(this.pos), f = this.pos - i;
      const v = ch[i] * (1 - f) + (i + 1 < ch.length ? ch[i + 1] : ch[i]) * f;
      this.out[this.n++] = Math.max(-1, Math.min(1, v)) * 32767;
      if (this.n === 512) { this.port.postMessage(this.out.buffer.slice(0)); this.n = 0; }
      this.pos += this.ratio;
    }
    this.pos -= ch.length;
    return true;
  }
}
registerProcessor("mic16k", Mic16k);
