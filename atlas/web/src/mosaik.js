/* JARVIS – Stilwelt MOSAIK: frontales Gesicht, eingebettet in einen atmenden Teppich feiner blauer Kacheln (three.js).
   - Jede Kachel ist ein Würfel; Höhe und Helligkeit kommen aus dem Gesichtsrelief, abstrahiert und weich in den Teppich
     eingebettet. Alle Kacheln atmen leicht (eigene Phase + langsames Wellenfeld) – nichts steht still.
   - Mimik aus neun Posen (ChatGPT, ausgerichtet, als Unterschied zur neutralen Pose), bewusst dezent überblendet.
     Die Augen bleiben immer geschlossen.
   - Der Teppich wabert wie eine zähe Masse: treibende Wölbungen und sich drehende Wellen heben und neigen die Kacheln
     (echte Tiefe + Licht auf der Neigung). Die Augen sind dunkle Höhlen ohne Lider; das Gesicht folgt leicht der Maus.
   - Zuhören: Gesicht färbt sich ins Plexus-Grün. Denken/Werkzeuge: Datenströme wie bei Plexus, die hinter dem Kopf
     verschwinden; Farbe je Quelle (Kalender, Mail, Archiv …).
   - Startsequenz: warten() hält den Teppich flach, laden(x) lässt ihn von der Mitte her anwachsen, zuenden() entfaltet ihn.

   window.JarvisAvatar.erzeugen(container, {qualitaet})
     → {zustand, pegel, viseme, text, werkzeug, farbe, warten, laden, zuenden, drehen, info, entfernen}
   Bauen: npx esbuild src/mosaik.js --bundle --minify --format=iife --outfile=mosaik.bundle.js */
import * as THREE from "three";
import { T1, T2, T3, SEITE } from "./mosaik_gesicht.js";

const GRUEN = 0x3ddc97;            // wie Plexus beim Zuhören
const HEISS = 0xd6f3ff;            // Datenströme beim Nachdenken (Plexus „heiß“)
const PLEXUS = 0x2fa8ff;           // Grundfarbe des Plexus-Stils
// Zustand → Brauen hoch, Stirnrunzeln, Lächeln, Licht, Tönung des Gesichts (Farbe, Stärke), Puls, Datenströme
const ZUST = {
  ruhe:     { brauen: 0, stirn: 0, laecheln: 0, licht: 0.95, farbe: null, staerke: 0, puls: 0, stroeme: 0 },
  zuhoeren: { brauen: 0.35, stirn: 0, laecheln: 0.08, licht: 1.0, farbe: GRUEN, staerke: 0.9, puls: 0, stroeme: 0 },
  denken:   { brauen: 0, stirn: 0.35, laecheln: 0, licht: 0.98, farbe: null, staerke: 0, puls: 0, stroeme: 1 },
  sprechen: { brauen: 0.08, stirn: 0, laecheln: 0.05, licht: 1.02, farbe: null, staerke: 0, puls: 0, stroeme: 0 },
  warnung:  { brauen: 0.1, stirn: 0.3, laecheln: 0, licht: 1.0, farbe: 0xffb547, staerke: 0.6, puls: 1, stroeme: 0 },
};
// Mundformen als Gewichte der Posen A, O, E/I, M/B/P, F/V – dezent (höchstens knapp die Hälfte der Pose)
const MUND_MAX = 0.32;
const FORM = {
  rest: [0, 0, 0, 0, 0], A: [1, 0, 0, 0, 0], O: [0, 1, 0, 0, 0], E: [0, 0, 0.8, 0, 0],
  M: [0, 0, 0, 1, 0], F: [0, 0, 0, 0, 1], N: [0.4, 0, 0.3, 0, 0],
};
const VIS = { aa: "A", E: "E", I: "E", O: "O", U: "O", PP: "M", FF: "F", TH: "N", SS: "E", DD: "N", kk: "N", CH: "E", nn: "N", RR: "N", sil: "rest" };
// Quellen der Datenströme (wie im Plexus-Kern): Werkzeugname → Farbe
const QUELLEN = [
  [/kalender|wochenplan/, 0x4da3ff], [/erinner/, 0x5ec8ff], [/notiz/, 0x7fd6ff], [/kontakt|geburtstag/, 0x8fd0ff],
  [/frist|vergessen/, 0xff5468], [/post|brief/, 0xffb547], [/mail|schreibstil/, 0xffc56b],
  [/steuer|vertrag|beihilfe/, 0xf2d16b], [/archiv|datei|dokument/, 0x3ddc97], [/youtube|video/, 0xb38cff],
  [/web|recherche|projekt/, 0x9d8cff], [/word|excel|pptx|office/, 0x5ee6c8], [/wetter/, 0x9fe8ff],
  [/gedaechtnis|vorgang/, 0xc9a8ff], [/bild|skizze|anzeige/, 0x7ff3ff], [/tesla|ford|immo|nebenkosten/, 0x8fe3b0],
];
function laut(ch) {
  const c = ch.toLowerCase();
  if ("aá".includes(c)) return "A";
  if ("oóuúö".includes(c)) return "O";
  if ("eéiíäüy".includes(c)) return "E";
  if ("mbp".includes(c)) return "M";
  if ("fvw".includes(c)) return "F";
  if (/[a-zß]/.test(c)) return "N";
  return "rest";
}

const VERT = `
attribute vec2 aPos; attribute float aZufall;
uniform sampler2D uT1, uT2, uT3; uniform vec4 uFace; uniform float uZeit, uBereit, uAtmen, uHex, uTiefe, uTexel, uWind; uniform vec2 uBlick;
uniform float uA, uO, uE, uM, uF, uSmile, uStirn, uBrauen;
varying vec3 vN; varying vec2 vUv, vNeig; varying float vL, vMaske, vSeite;
#define D(v) (((v) - 0.5) / 0.6)
float probe(vec2 uv) {
  vec3 a = texture2D(uT1, uv).rgb, b = texture2D(uT2, uv).rgb, c = texture2D(uT3, uv).rgb;
  return a.r + uA * D(a.g) + uO * D(a.b) + uE * D(b.r) + uM * D(b.g) + uF * D(b.b)
       + uSmile * D(c.r) + uStirn * D(c.g) + uBrauen * D(c.b);
}
float gesicht(vec2 uv, out float maske) {
  maske = 0.;
  if (uv.x < -0.02 || uv.x > 1.02 || uv.y < -0.02 || uv.y > 1.02) return 0.;
  // weich gezeichnet: Mittel aus fünf Proben – abstrakter, ohne harte Details
  vec2 o = vec2(uTexel * 2.2, 0.), q = vec2(0., uTexel * 2.2);
  float l = (probe(uv) * 2. + probe(uv + o) + probe(uv - o) + probe(uv + q) + probe(uv - q)) / 6.;
  maske = smoothstep(0.08, 0.7, l) * smoothstep(-0.02, 0.06, min(min(uv.x, 1. - uv.x), min(uv.y, 1. - uv.y)));
  return clamp(l, 0., 1.);
}
// Wabern: weiche Wölbungen treiben wie eine zähe Masse ziellos über den Teppich (Lissajous-Bahnen, verschiedene
// Größen und Tempi), dazu ein Feld aus sich langsam drehenden Wellen – keine Vorzugsrichtung, kein Links-nach-rechts
float buckel(vec2 p, vec2 c, float r) { vec2 q = (p - c) / r; return exp(-dot(q, q)); }
float wind(vec2 p, float t) {
  float R = uHex;
  float s = buckel(p, R * vec2(0.9 * sin(t * 0.13), 0.7 * cos(t * 0.11 + 1.3)), R * 0.55)
          - buckel(p, R * vec2(1.1 * cos(t * 0.09 + 2.1), 0.8 * sin(t * 0.15 + 0.4)), R * 0.65)
          + buckel(p, R * vec2(1.4 * sin(t * 0.07 + 4.0), 0.9 * sin(t * 0.12 + 2.6)), R * 0.45)
          - buckel(p, R * vec2(0.6 * cos(t * 0.17 + 5.2), 1.0 * cos(t * 0.08 + 3.3)), R * 0.4)
          + 0.7 * buckel(p, R * vec2(1.6 * cos(t * 0.05 + 0.7), 1.1 * sin(t * 0.06 + 5.0)), R * 0.8);
  float a1 = t * 0.031, a2 = -t * 0.023 + 2.;
  vec2 d1 = vec2(cos(a1), sin(a1)), d2 = vec2(cos(a2), sin(a2));
  float w = sin(dot(p, d1) * 0.05 + sin(dot(p, d2) * 0.04 + t * 0.35) * 1.4 + t * 0.27)
          * sin(dot(p, d2) * 0.045 - t * 0.21);
  return s * 1.1 + w * 0.45;
}
void main() {
  // Blick folgt der Maus: Gesicht rückt leicht in die Richtung, die Mitte etwas mehr als der Rand (angedeutete Drehung)
  vec2 uv = (aPos - uFace.xy - uBlick * uFace.zw * vec2(0.03, 0.025)) / uFace.zw + 0.5;
  uv -= uBlick * vec2(0.03, 0.022) * (1. - 4. * (uv - 0.5) * (uv - 0.5));
  float maske; float l = gesicht(uv, maske);
  float d = length(aPos - uFace.xy) / (uHex * 1.3);
  float k = clamp(uBereit * 1.7 - d * 0.7, 0., 1.); k = k * k * (3. - 2. * k);     // Auftauchen von innen nach außen
  float eigen = sin(uZeit * (0.55 + aZufall * 0.35) + aZufall * 6.2832);
  float atmen = 1. + uAtmen * 0.04 * sin(uZeit * 6.2832 / 4.6);
  float A = uAtmen * uWind;
  float tw = uZeit * 2.4;                                              // deutlich lebhafter als zuvor
  float w = wind(aPos, tw);
  vec2 g = vec2(wind(aPos + vec2(1., 0.), tw) - wind(aPos - vec2(1., 0.), tw),
                wind(aPos + vec2(0., 1.), tw) - wind(aPos - vec2(0., 1.), tw)) * 0.5;
  vNeig = g * A * k * (1. - 0.45 * maske);                                                   // Neigung der Kacheln → Licht
  float relief = maske * (0.3 + 0.7 * smoothstep(0.25, 0.95, l));
  float h = (relief * uTiefe * atmen + A * w * (1. - 0.45 * maske) + uAtmen * eigen * 0.25) * k;   // Gesicht bleibt lesbar
  vMaske = maske;
  float ton = 0.2 + 0.3 * smoothstep(0.3, 0.97, l);                  // Gesicht nur wenig heller als der Teppich
  vL = mix(0.2, ton, vMaske) + aZufall * 0.04 + uAtmen * eigen * 0.025;
  vec3 pos = position; pos.xy += aPos; pos.z += h;
  vN = normal; vSeite = 1. - step(0.5, normal.z);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.);
  vUv = vec2(position.x, position.y) / 0.88 + 0.5;
}`;
const FRAG = `
uniform vec3 uFarbe, uTint; uniform float uTintStaerke, uLicht, uPuls, uZeit;
varying vec3 vN; varying vec2 vUv, vNeig; varying float vL, vMaske, vSeite;
void main() {
  vec3 licht = normalize(vec3(-0.45, 0.6, 0.75));
  float dif = max(dot(normalize(vN), licht), 0.);
  vec3 nv = normalize(vec3(-vNeig * 9., 1.));                          // geneigte Oberseite (Wind)
  float neig = (0.45 + 0.75 * max(dot(nv, licht), 0.)) / (0.45 + 0.75 * licht.z);
  float rand = min(min(vUv.x, 1. - vUv.x), min(vUv.y, 1. - vUv.y));
  float fase = smoothstep(0.0, 0.18, rand);
  float kante = (1. - fase) * ((vUv.y > vUv.x) ? 0.4 : -0.35);       // Fase: oben links hell, unten rechts dunkel
  float kissen = 1. + 0.16 * ((vUv.y - 0.5) - (vUv.x - 0.5));
  float hell = (0.32 + 1.35 * pow(vL, 1.3)) * (vSeite > 0.5 ? (0.2 + 0.5 * dif) : (1. + kante) * kissen * neig);
  hell *= 0.6 * uLicht;                                                // insgesamt dunkel (Plexus)
  vec3 c = mix(uFarbe, uTint, uTintStaerke * (0.12 + 0.88 * vMaske)) * hell;   // Tönung vor allem im Gesicht
  c *= 1. + uPuls * 0.12 * pow(0.5 + 0.5 * sin(uZeit * 4.5), 4.);
  gl_FragColor = vec4(c, 1.);
}`;

// Datenströme: Partikelbahnen vom Bildrand bis an den Rand des Sechsecks (wie die Plexus-Ströme zum Kern)
class Stroeme {
  constructor(szene) {
    this.N = 7000; this.pos = new Float32Array(this.N * 3); this.alpha = new Float32Array(this.N);
    this.farbe = new Float32Array(this.N * 3); this.data = new Array(this.N); this.next = 0;
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(this.pos, 3));
    g.setAttribute("alpha", new THREE.BufferAttribute(this.alpha, 1));
    g.setAttribute("farbe", new THREE.BufferAttribute(this.farbe, 3));
    this.u = { uPx: { value: 6 } };
    this.punkte = new THREE.Points(g, new THREE.ShaderMaterial({
      uniforms: this.u, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending,
      vertexShader: `uniform float uPx; attribute float alpha; attribute vec3 farbe; varying float vA; varying vec3 vF;
        void main(){ vA = alpha; vF = farbe; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); gl_PointSize = uPx * (0.7 + alpha * 1.1); }`,
      fragmentShader: `varying float vA; varying vec3 vF; void main(){ float d = length(gl_PointCoord - .5); if (d > .5) discard;
        gl_FragColor = vec4(vF, smoothstep(.5, 0., d) * vA); }`,
    }));
    this.punkte.frustumCulled = false; this.punkte.renderOrder = 2; szene.add(this.punkte);
    this.grenzen = { w: 50, h: 40, rx: 20, ry: 26, z: 3 };
  }
  spawn(winkel, farbe, anzahl = 160) {
    const { w, h, rx, ry, z, fh = ry / 0.47 } = this.grenzen;
    const dx = Math.cos(winkel), dy = Math.sin(winkel);
    const r0 = Math.hypot(w, h) * 1.02;                                            // außerhalb des Bildes
    const start = new THREE.Vector2(dx * r0, dy * r0);
    // Ziel: das Gehirn – oben hinter der Stirn. Bahnen schwingen seitlich um den Kopf und tauchen von oben ein.
    const ende = new THREE.Vector2((Math.random() - 0.5) * rx * 0.5, fh * (0.27 + Math.random() * 0.06));
    const seite = dx >= 0 ? 1 : -1;
    const ctrl = dy > 0.3
      ? new THREE.Vector2(dx * r0 * 0.45, Math.max(dy * r0 * 0.55, ry * 1.4))
      : new THREE.Vector2(seite * rx * (1.45 + Math.random() * 0.35), ry * (1.25 + Math.random() * 0.4));
    const c = new THREE.Color(farbe).lerp(new THREE.Color(PLEXUS), 0.45).multiplyScalar(0.75);   // gedämpft, nah am Grundton
    for (let i = 0; i < anzahl; i++) {
      const k = this.next; this.next = (this.next + 1) % this.N;
      this.data[k] = { t: -i * 0.006 - Math.random() * 0.05, sp: 0.45 + Math.random() * 0.2, start, ctrl, ende, z,
        off: new THREE.Vector2((Math.random() - 0.5) * 2.4, (Math.random() - 0.5) * 2.4) };
      this.farbe.set([c.r, c.g, c.b], k * 3);
    }
    this.punkte.geometry.attributes.farbe.needsUpdate = true;
  }
  update(dt) {
    const { rx, ry, fh = ry / 0.47 } = this.grenzen;
    for (let k = 0; k < this.N; k++) {
      const d = this.data[k];
      if (!d) { if (this.alpha[k]) this.alpha[k] = 0; continue; }
      d.t += dt * d.sp;
      if (d.t > 1) { this.data[k] = null; this.alpha[k] = 0; continue; }
      const t = Math.max(0, d.t), it = 1 - t;                                  // quadratische Bezierkurve ins Gehirn
      const x = d.start.x * it * it + d.ctrl.x * 2 * it * t + d.ende.x * t * t + d.off.x * it;
      const y = d.start.y * it * it + d.ctrl.y * 2 * it * t + d.ende.y * t * t + d.off.y * it;
      this.pos.set([x, y, d.z], k * 3);
      const e = (x / rx) ** 2 + (y / ry) ** 2;                                   // innerhalb des Kopfumrisses?
      const aussen = Math.min(1, Math.max(0, (e - 1.0) / 0.35));
      // über der Stirn bleibt der Strom als Schimmer sichtbar und verlischt im Gehirn; vor dem Gesicht ist er unsichtbar
      const stirn = Math.min(1, Math.max(0, (y - fh * 0.16) / (fh * 0.08)));
      const sicht = Math.max(aussen, stirn * 0.55 * (1 - Math.max(0, (t - 0.8) / 0.2)));
      this.alpha[k] = d.t < 0 ? 0 : Math.sin(t * Math.PI * 0.5 + 0.2) * sicht * 0.5;
    }
    this.punkte.geometry.attributes.position.needsUpdate = true;
    this.punkte.geometry.attributes.alpha.needsUpdate = true;
  }
  aktiv() { return this.data.some(Boolean); }
}

function mosaik(container, { qualitaet = "hoch" } = {}) {
  const niedrig = qualitaet === "niedrig";
  const renderer = new THREE.WebGLRenderer({ antialias: !niedrig, alpha: false, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, niedrig ? 1.5 : 2));
  renderer.setClearColor(0x01050a, 1);                  // dunkler Grund wie im Plexus-Stil
  renderer.domElement.className = "mosaik-cv";
  container.appendChild(renderer.domElement);
  const szene = new THREE.Scene();
  const FOV = 24, kamera = new THREE.PerspectiveCamera(FOV, 1, 1, 4000);
  const lade = (src) => { const x = new THREE.TextureLoader().load(src); x.minFilter = THREE.LinearFilter; x.magFilter = THREE.LinearFilter; return x; };
  const texs = [lade(T1), lade(T2), lade(T3)];
  const u = {
    uT1: { value: texs[0] }, uT2: { value: texs[1] }, uT3: { value: texs[2] }, uTexel: { value: 1 / 376 },
    uFace: { value: new THREE.Vector4(0, 0, 50, 60) }, uZeit: { value: 0 }, uBereit: { value: 0 },
    uAtmen: { value: 1 }, uHex: { value: 40 }, uTiefe: { value: 5 }, uWind: { value: 1.2 }, uBlick: { value: new THREE.Vector2() },
    uA: { value: 0 }, uO: { value: 0 }, uE: { value: 0 }, uM: { value: 0 }, uF: { value: 0 }, uSmile: { value: 0 },
    uBrauen: { value: 0 }, uStirn: { value: 0 },
    uFarbe: { value: new THREE.Color(PLEXUS) }, uTint: { value: new THREE.Color(GRUEN) }, uTintStaerke: { value: 0 },
    uLicht: { value: 0.95 }, uPuls: { value: 0 },
  };
  const mat = new THREE.ShaderMaterial({ uniforms: u, vertexShader: VERT, fragmentShader: FRAG });
  const geo = new THREE.BoxGeometry(0.88, 0.88, 10); geo.translate(0, 0, -5);
  const stroeme = new Stroeme(szene);
  let netz = null, zeilen = 0;
  function aufbauen(w, h) {
    // feine Kacheln: am Mac 150 Zeilen (ca. 40.000 Kacheln), auf dem iPhone weniger
    zeilen = niedrig ? (w < h ? 150 : 96) : (w < h ? 190 : 150);
    const spalten = Math.ceil(zeilen * w / h) + 2, n = spalten * (zeilen + 2);
    if (netz) { szene.remove(netz); netz.geometry.dispose(); }
    const g = new THREE.InstancedBufferGeometry().copy(geo); g.instanceCount = n;
    const pos = new Float32Array(n * 2), zuf = new Float32Array(n);
    let i = 0;
    for (let y = 0; y < zeilen + 2; y++) for (let x = 0; x < spalten; x++) {
      pos[i * 2] = x - (spalten - 1) / 2; pos[i * 2 + 1] = y - (zeilen + 1) / 2; zuf[i] = Math.random(); i++;
    }
    g.setAttribute("aPos", new THREE.InstancedBufferAttribute(pos, 2));
    g.setAttribute("aZufall", new THREE.InstancedBufferAttribute(zuf, 1));
    netz = new THREE.Mesh(g, mat); netz.frustumCulled = false; szene.add(netz);
    const R = Math.min(zeilen * 0.47, (zeilen * w / h) * 0.47 / 0.866);   // Sechseck passt in Höhe und Breite
    u.uHex.value = R;
    const fh = 2 * R * 0.86, fw = fh * SEITE;
    u.uFace.value.set(0, 0, fw, fh);
    u.uTiefe.value = zeilen * 0.034;                                        // Relief relativ zur Bildhöhe – flach, eingebettet
    u.uWind.value = zeilen * 0.032;                                         // Wellenhöhe des Windes (Kacheln)
    kamera.position.set(0, 0, (zeilen / 2) / Math.tan(THREE.MathUtils.degToRad(FOV / 2)));
    kamera.far = kamera.position.z + 100; kamera.near = 1;
    stroeme.grenzen = { w: zeilen * w / h / 2, h: zeilen / 2, rx: fw * 0.47, ry: fh * 0.47, fh, z: u.uTiefe.value + 2 };
    stroeme.u.uPx.value = Math.max(3, (h / zeilen) * renderer.getPixelRatio() * 1.5);
  }
  function groesse() {
    const r = container.getBoundingClientRect(), w = Math.max(1, r.width), h = Math.max(1, r.height);
    renderer.setSize(w, h, false); kamera.aspect = w / h; kamera.updateProjectionMatrix();
    aufbauen(w, h);
  }
  const ro = new ResizeObserver(groesse); ro.observe(container); groesse();

  const reduziert = matchMedia("(prefers-reduced-motion: reduce)");
  const blick = new THREE.Vector2(), blickZiel = new THREE.Vector2();
  const onMaus = (e) => { blickZiel.set((e.clientX / innerWidth - 0.5) * 2, -(e.clientY / innerHeight - 0.5) * 2); };
  addEventListener("pointermove", onMaus, { passive: true });
  let weg = false, frame = 0, letzte = 0, start = performance.now(), bereitIst = 0, bereitZiel = 1, bereitRate = 1.4, stummBis = 0;
  let ziel = "ruhe", roh = 0, pegelZeit = -1e9, pegel = 0, visem = "rest", visemZeit = -1e9, stromT = 0;
  let folge = [], folgeStart = 0, folgeDauer = 70;
  const ist = { a: 0, o: 0, e: 0, m: 0, f: 0, smile: 0, brauen: 0, stirn: 0, licht: 0.95, staerke: 0, puls: 0 };
  const tint = new THREE.Color(GRUEN);
  const nah = (k, wert, rate, dt) => { ist[k] += (wert - ist[k]) * (1 - Math.exp(-dt * rate)); };
  function zeichne(now) {
    if (weg) return; frame = requestAnimationFrame(zeichne);
    if (niedrig && letzte && now - letzte < 1000 / 30 - 0.5) return;
    const dt = Math.min(0.1, (now - (letzte || now)) / 1000); letzte = now;
    if (document.hidden) return;
    const t = (now - start) / 1000, ruhig = reduziert.matches, z = ZUST[ziel];
    // Mund: Laute aus dem Text bzw. Viseme, Öffnung aus dem Stimmpegel – weich und dezent
    let form = "rest";
    if (ziel === "sprechen") {
      if (now - visemZeit < 250) form = visem;
      else if (folge.length) { const i = Math.floor((now - folgeStart) / folgeDauer); form = i < folge.length ? folge[i] : "rest"; }
      else form = Math.floor(t * 6) % 3 ? "A" : "E";
    }
    // stilles Vorlesen (Textantwort ohne Stimme): eigener Sprechrhythmus statt Pegel
    const stumm = now < stummBis;
    const stimme = stumm ? 0.45 + 0.4 * Math.abs(Math.sin(t * 8.3) * Math.sin(t * 3.1 + 1.)) :
      now - pegelZeit < 300 ? Math.min(1, roh * 1.5) : (ziel === "sprechen" ? 0.55 : 0);
    pegel += (stimme - pegel) * (1 - Math.exp(-dt * 12));
    const f = FORM[form] || FORM.rest, auf = ziel === "sprechen" ? (0.35 + 0.65 * pegel) * MUND_MAX : 0;
    nah("a", f[0] * auf, 10, dt); nah("o", f[1] * auf, 10, dt); nah("e", f[2] * auf, 10, dt);
    nah("m", f[3] * (ziel === "sprechen" ? MUND_MAX : 0), 12, dt); nah("f", f[4] * auf, 10, dt); nah("smile", z.laecheln, 2.5, dt);
    nah("brauen", z.brauen, 2.5, dt); nah("stirn", z.stirn, 2.5, dt);
    nah("licht", z.licht, 2.5, dt); nah("staerke", z.staerke, 2.2, dt); nah("puls", z.puls, 3, dt);
    if (z.farbe !== null) tint.lerp(new THREE.Color(z.farbe), 1 - Math.exp(-dt * 4));
    // Nachdenken: laufend Datenströme aus allen Richtungen zum Sechseck
    if (z.stroeme && !ruhig) { stromT += dt; if (stromT > 0.38) { stromT = 0; stroeme.spawn(Math.random() * Math.PI * 2, HEISS, 70); } }
    stroeme.update(dt); stroeme.punkte.visible = stroeme.aktiv();
    u.uZeit.value = t; u.uAtmen.value = ruhig ? 0 : 1;
    blick.lerp(ruhig ? blickZiel.clone().multiplyScalar(0) : blickZiel, 1 - Math.exp(-dt * 2.2)); u.uBlick.value.copy(blick);
    bereitIst += (bereitZiel - bereitIst) * (1 - Math.exp(-dt * bereitRate)); u.uBereit.value = Math.min(1, bereitIst * 1.02);
    u.uA.value = ist.a; u.uO.value = ist.o; u.uE.value = ist.e; u.uM.value = ist.m; u.uF.value = ist.f;
    u.uSmile.value = ist.smile; u.uBrauen.value = ist.brauen; u.uStirn.value = ist.stirn;
    u.uLicht.value = ist.licht; u.uTintStaerke.value = ist.staerke; u.uPuls.value = ist.puls; u.uTint.value.copy(tint);
    renderer.render(szene, kamera);
  }
  frame = requestAnimationFrame(zeichne);
  return {
    zustand(name) { if (!ZUST[name]) throw new RangeError("Unbekannter Zustand: " + name); ziel = name; },
    pegel(w) { if (Number.isFinite(w)) { roh = Math.max(0, Math.min(1, w)); pegelZeit = performance.now(); } },
    viseme(name) { visem = VIS[name] || "rest"; visemZeit = performance.now(); },
    text(t, ms, opt = {}) {
      const s = String(t || "").replace(/\s+/g, " ").trim(); if (!s) return;
      folge = [...s].map(laut); folgeStart = performance.now();
      folgeDauer = ms ? Math.max(40, ms / folge.length) : 68;
      stummBis = opt.stumm ? folgeStart + folge.length * folgeDauer : 0;
    },
    // Werkzeug läuft: Datenstrom in der Farbe der Quelle
    werkzeug(name) {
      if (reduziert.matches) return;
      const q = QUELLEN.find(([re]) => re.test(String(name || "")));
      stroeme.spawn(Math.random() * Math.PI * 2, q ? q[1] : HEISS, 200);
    },
    farbe(hex) { u.uFarbe.value.set(hex); },
    warten() { bereitZiel = 0; bereitIst = 0; },                       // Startsequenz läuft: flach und still
    laden(x) { bereitZiel = Math.max(bereitZiel, Math.min(0.6, x)); bereitRate = 0.8; },   // Energie sammelt sich
    zuenden() { bereitZiel = 1; bereitRate = 1.6; },
    drehen() {},
    info() { return { modell: false, mosaik: true, kacheln: netz ? netz.geometry.instanceCount : 0 }; },
    entfernen() {
      weg = true; cancelAnimationFrame(frame); ro.disconnect(); removeEventListener("pointermove", onMaus);
      texs.forEach((x) => x.dispose()); geo.dispose(); netz?.geometry.dispose(); mat.dispose();
      stroeme.punkte.geometry.dispose(); stroeme.punkte.material.dispose();
      renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove();
    },
  };
}

window.JarvisAvatar = { erzeugen: (container, opt = {}) => mosaik(container, opt), stile: ["mosaik"] };
