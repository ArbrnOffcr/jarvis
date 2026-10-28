/* JARVIS · Avatare AURA, NOVA, MILO
   Zwei Darstellungen je Person:
   - "portraet" (Standard): das ausgearbeitete Konzeptbild als lebendes Hologramm – Atmen, Blickparallaxe, leuchtende
     Augen, Nähte und Mund reagieren auf die Stimme, Scanlinie, weiche Ränder ohne harte Kanten.
   - "figur": die mitgelieferten three.js-Prototypen (schematische 3D-Figur, Lizenz MIT).
   Schnittstelle (wie vereinbart):
   window.JarvisAvatar.erzeugen(container, {person, modus, qualitaet}) → {zustand, pegel, viseme, farbe, entfernen} */
import * as THREE from "three";
import { erzeugen as figurAura } from "./figur/aura.js";
import { erzeugen as figurNova } from "./figur/nova.js";
import { erzeugen as figurMilo } from "./figur/milo.js";
import { modell } from "./modell.js";

const FIGUR = { aura: figurAura, nova: figurNova, milo: figurMilo };
// Augen und Mund im Bildausschnitt (UV, y nach oben) – von Hand an den Konzeptbildern vermessen
const PERSON = {
  nova: { augen: [[0.5813, 0.8115], [0.6979, 0.7832]], mund: [0.6375, 0.666], mundbreite: 0.12, kopf: [0.6, 0.72], ton: 1.0 },
  aura: { augen: [[0.526, 0.7959], [0.6823, 0.7637]], mund: [0.5781, 0.6367], mundbreite: 0.125, kopf: [0.57, 0.7], ton: 0.92 },
  milo: { augen: [[0.5333, 0.7773], [0.675, 0.7402]], mund: [0.5854, 0.6191], mundbreite: 0.13, kopf: [0.57, 0.7], ton: 0.95 },
};
// Zustand → [Licht, Augen, Tempo, Neigung, Glitch, Warnung]
const ZUST = {
  ruhe:     [0.92, 0.55, 0.6, 0.0, 0.0, 0.0],
  zuhoeren: [1.0, 1.0, 0.8, 1.0, 0.0, 0.0],
  denken:   [0.96, 0.8, 1.8, 0.2, 1.0, 0.0],
  sprechen: [1.02, 0.85, 1.0, 0.0, 0.0, 0.0],
  warnung:  [1.0, 0.9, 0.9, 0.0, 0.2, 1.0],
};
const VIS = { aa: .85, E: .65, I: .45, O: .75, U: .55, PP: .12, FF: .25, TH: .3, SS: .25, DD: .4, kk: .35, CH: .35, nn: .3, RR: .4, sil: 0 };

const VERT = `
uniform float zeit, neigung; uniform vec2 kopf;
varying vec2 vUv; varying float vTiefe;
void main(){
  vUv = uv;
  vec2 d = (uv - kopf) / vec2(0.26, 0.34);
  float kopfT = exp(-dot(d, d) * 1.6);
  vec2 k = (uv - vec2(0.5, 0.2)) / vec2(0.55, 0.32);
  float koerper = exp(-dot(k, k) * 1.4);
  float z = kopfT * 0.22 + koerper * 0.12;
  vTiefe = z;
  vec3 p = position + vec3(0.0, 0.0, z);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}`;
const FRAG = `
uniform sampler2D bild; uniform float zeit, licht, augenI, glitch, warn, pegel, ton, bereit, minimal;
uniform vec2 auge1, auge2, mund; uniform float mundbreite; uniform vec3 farbe, warnfarbe;
varying vec2 vUv; varying float vTiefe;
float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
void main(){
  vec2 uv = vUv;
  // Kiefer: Bereich unter der Mundlinie gleitet mit dem Pegel minimal nach unten
  vec2 m = (uv - mund) / vec2(mundbreite * 1.1, 0.075);
  float unter = smoothstep(0.004, -0.012, uv.y - mund.y);
  float kiefer = exp(-dot(m, m) * 1.2) * unter;
  uv.y += pegel * 0.0065 * kiefer;
  // Denken: leichter, fließender Versatz in Bändern
  float band = step(0.985, hash(vec2(floor(uv.y * 90.0), floor(zeit * 6.0))));
  uv.x += glitch * band * 0.004 * (hash(vec2(zeit, uv.y)) - 0.5);
  vec3 c = texture2D(bild, uv).rgb;
  if (glitch > 0.0) { c.r = mix(c.r, texture2D(bild, uv + vec2(0.0018 * glitch, 0.0)).r, 0.6); c.b = mix(c.b, texture2D(bild, uv - vec2(0.0018 * glitch, 0.0)).b, 0.6); }
  c *= ton;
  // Mundspalt dunkelt beim Sprechen ab
  float spalt = exp(-pow((vUv.y - mund.y) / 0.0045, 2.0)) * exp(-pow((vUv.x - mund.x) / (mundbreite * 0.45), 2.0));
  c *= 1.0 - pegel * 0.55 * spalt;
  // Leuchtende Nähte/Augen (cyanfarbige Bildanteile) atmen mit Licht und Stimme
  float cyan = clamp((c.g + c.b) * 0.5 - c.r, 0.0, 1.0) * smoothstep(0.3, 0.75, max(c.g, c.b));
  vec3 naht = mix(farbe, warnfarbe, warn);
  vec3 cWarn = mix(c, vec3(dot(c, vec3(0.33))) * warnfarbe * 1.6, cyan * warn);
  c = cWarn + naht * cyan * (licht - 0.9 + pegel * 0.9) * 0.9;
  // Augenglühen
  float a1 = length((vUv - auge1) * vec2(1.0, 1.25)), a2 = length((vUv - auge2) * vec2(1.0, 1.25));
  float glut = exp(-a1 * a1 / 0.00012) + exp(-a2 * a2 / 0.00012);
  float hof = exp(-a1 * a1 / 0.0016) + exp(-a2 * a2 / 0.0016);
  c += mix(vec3(0.85, 0.98, 1.0), naht, 0.35) * glut * augenI * 0.9 + naht * hof * augenI * 0.18;
  // Holo: feine Zeilen, wandernde Scanlinie, leichtes Rauschen
  if (minimal < 0.5) {
    c *= 0.95 + 0.05 * sin(vUv.y * 1400.0);
    float scan = exp(-pow((vUv.y - fract(zeit * 0.07)) / 0.01, 2.0));
    c += naht * scan * 0.08;
    c += (hash(vUv * 900.0 + zeit) - 0.5) * 0.015;
  }
  c *= licht;
  // Weiche Ränder: keine Kante, das Bild löst sich ins Dunkel auf
  vec2 r = (vUv - vec2(0.57, 0.56)) / vec2(0.5, 0.58);
  float rand = 1.0 - smoothstep(0.45, 1.0, length(r));
  rand *= smoothstep(0.02, 0.38, vUv.y) * smoothstep(0.05, 0.32, vUv.x) * smoothstep(1.0, 0.72, vUv.x) * smoothstep(1.0, 0.95, vUv.y);
  float alpha = rand * bereit;
  gl_FragColor = vec4(c * alpha, alpha);
}`;

function portraet(container, person, qualitaet) {
  const p = PERSON[person];
  const niedrig = qualitaet === "niedrig";
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: !niedrig, premultipliedAlpha: true });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, niedrig ? 1 : 2));
  renderer.domElement.style.cssText = "display:block;width:100%;height:100%;";
  renderer.domElement.setAttribute("role", "img");
  renderer.domElement.setAttribute("aria-label", `JARVIS-Avatar ${person.toUpperCase()}`);
  container.appendChild(renderer.domElement);
  const szene = new THREE.Scene(), kamera = new THREE.PerspectiveCamera(30, 1, 0.1, 20);
  kamera.position.set(0, 0, 4.2);
  const tex = new THREE.TextureLoader().load(`avatare/${person}.jpg`, () => { geladen = performance.now(); });
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const u = {
    bild: { value: tex }, zeit: { value: 0 }, licht: { value: 0.92 }, augenI: { value: 0.55 }, glitch: { value: 0 }, warn: { value: 0 },
    pegel: { value: 0 }, ton: { value: p.ton }, bereit: { value: 0 }, minimal: { value: niedrig ? 1 : 0 }, neigung: { value: 0 },
    auge1: { value: new THREE.Vector2(...p.augen[0]) }, auge2: { value: new THREE.Vector2(...p.augen[1]) },
    mund: { value: new THREE.Vector2(...p.mund) }, mundbreite: { value: p.mundbreite }, kopf: { value: new THREE.Vector2(...p.kopf) },
    farbe: { value: new THREE.Color("#00e5ff") }, warnfarbe: { value: new THREE.Color("#ffb547") },
  };
  const geo = new THREE.PlaneGeometry(1.875 * 0.9375, 1.875, niedrig ? 40 : 96, niedrig ? 40 : 96);
  const mat = new THREE.ShaderMaterial({ uniforms: u, vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false,
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor });
  const flaeche = new THREE.Mesh(geo, mat); szene.add(flaeche);
  // Lichtstaub um die Gestalt
  const n = niedrig ? 120 : 420, pos = new Float32Array(n * 3), ph = new Float32Array(n);
  for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, r = 0.55 + Math.random() * 0.55; pos.set([Math.cos(a) * r * 0.9, Math.sin(a) * r * 0.95 + 0.05, -0.2 + Math.random() * 0.5], i * 3); ph[i] = Math.random() * 6.28; }
  const pg = new THREE.BufferGeometry(); pg.setAttribute("position", new THREE.BufferAttribute(pos, 3)); pg.setAttribute("ph", new THREE.BufferAttribute(ph, 1));
  const pm = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { zeit: u.zeit, farbe: u.farbe, licht: u.licht, dpr: { value: renderer.getPixelRatio() }, bereit: u.bereit },
    vertexShader: `attribute float ph; uniform float zeit, dpr; varying float vA; void main(){ vec3 p = position; p.y += sin(zeit*0.3+ph)*0.03; p.x += cos(zeit*0.25+ph)*0.02;
      vA = 0.35 + 0.65 * pow(0.5 + 0.5 * sin(zeit * 0.9 + ph * 3.0), 3.0); vec4 mv = modelViewMatrix * vec4(p, 1.0); gl_PointSize = 5.0 * dpr / max(1.0, -mv.z * 0.5); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform vec3 farbe; uniform float licht, bereit; varying float vA; void main(){ float d = length(gl_PointCoord - 0.5) * 2.0; gl_FragColor = vec4(farbe * exp(-d*d*4.0) * vA * 0.5 * licht * bereit, 0.0); }` });
  const staub = new THREE.Points(pg, pm); szene.add(staub);

  let geladen = 0, weg = false, frame = 0, start = performance.now(), letzte = 0;
  let ziel = "ruhe", von = ZUST.ruhe.slice(), jetzt = von.slice(), wechsel = start;
  let roh = 0, pegel = 0, letzterPegel = -1e9, visem = 0, maus = new THREE.Vector2(), mausZiel = new THREE.Vector2();
  const reduziert = matchMedia("(prefers-reduced-motion: reduce)");
  const onMaus = (e) => { mausZiel.set(e.clientX / innerWidth - 0.5, e.clientY / innerHeight - 0.5); };
  addEventListener("pointermove", onMaus, { passive: true });
  function groesse() {
    const r = container.getBoundingClientRect(), w = Math.max(1, r.width), h = Math.max(1, r.height);
    renderer.setSize(w, h, false); kamera.aspect = w / h;
    kamera.position.z = 4.2 * Math.max(1, 0.95 / kamera.aspect); kamera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(groesse); ro.observe(container); groesse();
  function zeichne(now) {
    if (weg) return; frame = requestAnimationFrame(zeichne);
    if (niedrig && letzte && now - letzte < 1000 / 30 - 0.5) return;
    const dt = Math.min(0.1, (now - (letzte || now)) / 1000); letzte = now;
    if (document.hidden) return;
    const t = (now - start) / 1000, ruhig = reduziert.matches;
    const e = Math.min(1, (now - wechsel) / 1200), ease = (1 - Math.cos(e * Math.PI)) / 2;
    jetzt = von.map((v, i) => v + (ZUST[ziel][i] - v) * ease);
    const [l, augen, tempo, neig, gl, wa] = jetzt;
    const signal = now - letzterPegel < 300 ? roh : visem;
    pegel += (signal * (ziel === "sprechen" ? 1 : 0.15) - pegel) * (1 - Math.exp(-dt * 16));
    u.zeit.value = ruhig ? 0 : t * tempo;
    u.bereit.value = geladen ? Math.min(1, (now - geladen) / 1400) : 0;
    const atmen = Math.sin(t * Math.PI * 2 / 4.2);
    u.licht.value = l + atmen * 0.02 + (wa ? Math.pow(0.5 + 0.5 * Math.sin(t * 4.5), 4) * 0.08 * wa : 0);
    const blinzeln = ruhig ? 1 : (Math.sin(t * 0.83) > 0.995 ? 0.2 : 1);
    u.augenI.value = augen * blinzeln * (1 + pegel * 0.35);
    u.glitch.value = ruhig ? 0 : gl * (0.6 + 0.4 * Math.sin(t * 3));
    u.warn.value = wa; u.pegel.value = ruhig ? 0 : pegel;
    maus.lerp(mausZiel, 1 - Math.exp(-dt * 3));
    if (!ruhig) {
      flaeche.rotation.y = -0.06 + maus.x * 0.16 + Math.sin(t * 0.21) * 0.025;
      flaeche.rotation.x = maus.y * 0.08 + neig * 0.05;
      flaeche.position.y = atmen * 0.008; flaeche.scale.setScalar(1 + atmen * 0.004);
      staub.rotation.y = t * 0.03;
    } else { flaeche.rotation.set(0, 0, 0); flaeche.scale.setScalar(1 + atmen * 0.003); }
    renderer.render(szene, kamera);
  }
  frame = requestAnimationFrame(zeichne);
  function uebergang() { von = jetzt.slice(); wechsel = performance.now(); }
  return {
    zustand(name) { if (!ZUST[name]) throw new RangeError("Unbekannter Zustand: " + name); if (name !== ziel) { uebergang(); ziel = name; } },
    pegel(w) { if (Number.isFinite(w)) { roh = Math.max(0, Math.min(1, w)); letzterPegel = performance.now(); } },
    viseme(name) { visem = VIS[name] ?? 0; },
    farbe(hex) { u.farbe.value.set(hex); },
    text() {}, drehen() {}, info() { return { modell: false }; },
    entfernen() { weg = true; cancelAnimationFrame(frame); ro.disconnect(); removeEventListener("pointermove", onMaus);
      tex.dispose(); geo.dispose(); mat.dispose(); pg.dispose(); pm.dispose(); renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove(); },
  };
}

// „modell“: echtes 3D-Modell (.glb) – fehlt es, springt die Darstellung automatisch auf das Porträt zurück
function mitModell(container, person, qualitaet, url, basis, meldung) {
  let inst = null, puffer = { zustand: "ruhe" };
  const api = {
    zustand(n) { puffer.zustand = n; inst?.zustand(n); }, pegel(w) { inst?.pegel(w); }, viseme(n) { inst?.viseme(n); },
    farbe(h) { puffer.farbe = h; inst?.farbe(h); }, text(t, ms) { inst?.text?.(t, ms); }, drehen(g) { inst?.drehen?.(g); },
    info() { return inst?.info?.() || { modell: false }; }, entfernen() { inst?.entfernen(); inst = null; },
  };
  inst = modell(container, { url, qualitaet, basis,
    beiGeladen: (i) => meldung?.({ modell: true, ...i }),
    beiFehler: () => { if (!inst) return; inst.entfernen(); inst = portraet(container, person, qualitaet); inst.zustand(puffer.zustand);
      if (puffer.farbe) inst.farbe(puffer.farbe); meldung?.({ modell: false }); } });
  inst.zustand(puffer.zustand);
  return api;
}

function erzeugen(container, { person = "nova", modus = "portraet", qualitaet = "hoch", url = "", basis = "vendor/basis/", meldung } = {}) {
  if (!PERSON[person] && modus !== "modell") throw new RangeError("Unbekannte Person: " + person);
  if (modus === "figur") return FIGUR[person](container, { qualitaet });
  if (modus === "modell") return mitModell(container, person, qualitaet, url || `/avatar-modell/${person}${qualitaet === "niedrig" ? "?lod=1" : ""}`, basis, meldung);
  return portraet(container, person, qualitaet);
}
window.JarvisAvatar = { erzeugen, personen: Object.keys(PERSON) };
