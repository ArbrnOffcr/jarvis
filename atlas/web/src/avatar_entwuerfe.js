import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";

const CYAN = new THREE.Color(0x00e5ff), SOFT = new THREE.Color(0x7ff3ff), WEISS = new THREE.Color(0xe8fbff);
const rnd = (a, b) => a + Math.random() * (b - a);

function punkte(pos, farben, groesse = 0.03, deckkraft = 0.9) {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  if (farben) g.setAttribute("color", new THREE.Float32BufferAttribute(farben, 3));
  const tex = (() => { const c = document.createElement("canvas"); c.width = c.height = 64; const x = c.getContext("2d");
    const gr = x.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(.35, "rgba(255,255,255,.55)"); gr.addColorStop(1, "rgba(255,255,255,0)");
    x.fillStyle = gr; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
  const m = new THREE.PointsMaterial({ size: groesse, map: tex, transparent: true, opacity: deckkraft, depthWrite: false,
    blending: THREE.AdditiveBlending, vertexColors: !!farben, color: farben ? 0xffffff : CYAN, sizeAttenuation: true });
  return new THREE.Points(g, m);
}
function linie(pts, farbe = CYAN, deckkraft = 0.8) {
  const g = new THREE.BufferGeometry().setFromPoints(pts);
  return new THREE.Line(g, new THREE.LineBasicMaterial({ color: farbe, transparent: true, opacity: deckkraft, blending: THREE.AdditiveBlending, depthWrite: false }));
}
function ring(r, n = 160, farbe = CYAN, deckkraft = 0.5, kipp = 0) {
  const pts = []; for (let i = 0; i <= n; i++) { const a = i / n * Math.PI * 2; pts.push(new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, 0)); }
  const l = linie(pts, farbe, deckkraft); l.rotation.x = kipp; return l;
}

// ---------- A · Iris-Kern ----------
function iris(szene, t) {
  const grp = new THREE.Group();
  const pos = [], N = 2600;
  for (let i = 0; i < N; i++) { const y = 1 - (i / (N - 1)) * 2, r = Math.sqrt(1 - y * y), th = i * 2.399963; pos.push(Math.cos(th) * r * 1.35, y * 1.35, Math.sin(th) * r * 1.35); }
  const kugel = punkte(pos, null, 0.022, 0.35); grp.add(kugel);
  const blenden = new THREE.Group();
  for (let k = 0; k < 4; k++) {
    const rIn = 0.18 + k * 0.17, rAus = rIn + 0.12, n = 48 + k * 18;
    for (let i = 0; i < n; i++) {
      const a = i / n * Math.PI * 2 + k * 0.2, w = a + 0.18;
      blenden.add(linie([new THREE.Vector3(Math.cos(a) * rIn, Math.sin(a) * rIn, 0.9), new THREE.Vector3(Math.cos(w) * rAus, Math.sin(w) * rAus, 0.9)],
        k === 0 ? WEISS : CYAN, 0.55 - k * 0.08));
    }
    const r = ring(rAus + 0.03, 200, SOFT, 0.35); r.position.z = 0.9; blenden.add(r);
  }
  grp.add(blenden);
  const pupille = punkte([0, 0, 0.92], null, 0.55, 1); pupille.material.color = WEISS; grp.add(pupille);
  for (const [r, kx, ky, op] of [[1.75, 1.2, 0.3, 0.45], [1.95, 1.45, -0.5, 0.3], [2.2, 1.05, 0.9, 0.22]]) {
    const o = ring(r, 260, CYAN, op); o.rotation.set(kx, ky, 0); grp.add(o);
    const p = punkte([r, 0, 0], null, 0.12, 1); p.position.set(0, 0, 0); const h = new THREE.Group(); h.add(p); h.rotation.set(kx, ky, t * 0.6 + r); grp.add(h);
  }
  // Sprach-Wellenring
  const wp = []; for (let i = 0; i <= 240; i++) { const a = i / 240 * Math.PI * 2; const rr = 0.95 + 0.06 * Math.sin(a * 9 + t * 3) * Math.sin(a * 3); wp.push(new THREE.Vector3(Math.cos(a) * rr, Math.sin(a) * rr, 0.9)); }
  grp.add(linie(wp, WEISS, 0.65));
  szene.add(grp); return (z) => { blenden.rotation.z = z * 0.15; grp.rotation.y = Math.sin(z * 0.3) * 0.12; };
}

// ---------- B · Holo-Profil ----------
const PROFIL = [[-0.9,1.0],[-0.5,1.22],[-0.05,1.3],[0.4,1.18],[0.7,0.92],[0.84,0.6],[0.9,0.42],[0.82,0.3],[0.88,0.2],[0.97,0.06],[1.06,-0.02],[0.98,-0.08],
  [0.9,-0.1],[0.94,-0.2],[0.88,-0.28],[0.93,-0.34],[0.86,-0.43],[0.86,-0.56],[0.72,-0.72],[0.42,-0.8],[0.15,-0.74],[0.12,-0.95],[0.1,-1.35],
  [-0.48,-1.35],[-0.5,-0.85],[-0.72,-0.55],[-0.9,-0.25],[-1.02,0.25]];
function innen(x, y) { let c = false; for (let i = 0, j = PROFIL.length - 1; i < PROFIL.length; j = i++) { const [xi, yi] = PROFIL[i], [xj, yj] = PROFIL[j];
  if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; }
function profil(szene) {
  const pos = [], col = []; let n = 0;
  while (n < 26000) {
    const x = rnd(-1.05, 1.1), y = rnd(-1.38, 1.32); if (!innen(x, y)) continue;
    const hals = y < -0.8, hw = hals ? 0.42 : 0.8 * Math.sqrt(Math.max(0.03, 1 - ((x + 0.05) / 1.08) ** 2));
    const z = (Math.random() < 0.5 ? -1 : 1) * hw * Math.sqrt(rnd(0.55, 1));
    const band = Math.abs(Math.sin(y * 34)) > 0.86 ? 1.0 : 0.45;
    const fade = hals ? Math.max(0, (y + 1.35) / 0.55) : 1;
    const c = new THREE.Color().copy(CYAN).lerp(WEISS, Math.max(0, x) * 0.35).multiplyScalar(band * fade * 0.9);
    pos.push(x, y, z); col.push(c.r, c.g, c.b); n++;
  }
  const kopf = punkte(pos, col, 0.026, 0.95);
  // Silhouette leuchtend
  const grp = new THREE.Group(); grp.add(kopf);
  // Scanbalken + Sockelring
  const sc = document.createElement("canvas"); sc.width = 256; sc.height = 16; const sx = sc.getContext("2d");
  const sg = sx.createLinearGradient(0, 0, 256, 0); sg.addColorStop(0, "rgba(127,243,255,0)"); sg.addColorStop(.5, "rgba(200,250,255,.9)"); sg.addColorStop(1, "rgba(127,243,255,0)");
  sx.fillStyle = sg; sx.fillRect(0, 6, 256, 4);
  const scan = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.06), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sc), transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false }));
  scan.position.set(0, 0.35, 0); scan.rotation.y = 0.0; grp.add(scan);
  for (const [r, op] of [[1.1, 0.5], [1.32, 0.25], [1.6, 0.12]]) { const s = ring(r, 220, CYAN, op, Math.PI / 2); s.position.y = -1.45; grp.add(s); }
  grp.rotation.y = -0.55; grp.position.y = 0.05;
  szene.add(grp); return (z) => { grp.rotation.y = -0.55 + Math.sin(z * 0.4) * 0.15; scan.position.y = Math.sin(z) * 1.1; };
}

// ---------- C · Facetten-Prisma ----------
function prisma(szene) {
  const grp = new THREE.Group();
  const aussen = new THREE.IcosahedronGeometry(1.15, 0);
  grp.add(new THREE.LineSegments(new THREE.EdgesGeometry(aussen), new THREE.LineBasicMaterial({ color: SOFT, transparent: true, opacity: 0.75, blending: THREE.AdditiveBlending })));
  grp.add(new THREE.Mesh(aussen, new THREE.MeshBasicMaterial({ color: 0x0a5a70, transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false })));
  const innenG = new THREE.DodecahedronGeometry(0.55, 0);
  const inn = new THREE.LineSegments(new THREE.EdgesGeometry(innenG), new THREE.LineBasicMaterial({ color: WEISS, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending }));
  inn.rotation.set(0.6, 0.3, 0.2); grp.add(inn);
  grp.add(punkte([0, 0, 0], null, 0.9, 1));
  const ecken = aussen.getAttribute("position"); const ep = [];
  for (let i = 0; i < ecken.count; i++) ep.push(ecken.getX(i), ecken.getY(i), ecken.getZ(i));
  grp.add(punkte(ep, null, 0.14, 1));
  const splitter = new THREE.Group();
  for (let i = 0; i < 18; i++) { const s = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.TetrahedronGeometry(rnd(0.05, 0.12))), new THREE.LineBasicMaterial({ color: CYAN, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending }));
    const a = rnd(0, Math.PI * 2), r = rnd(1.6, 2.2); s.position.set(Math.cos(a) * r, rnd(-0.7, 0.7), Math.sin(a) * r); s.rotation.set(rnd(0, 3), rnd(0, 3), 0); splitter.add(s); }
  grp.add(splitter);
  for (const [r, op] of [[1.5, 0.45], [1.75, 0.25]]) { const s = ring(r, 240, CYAN, op, Math.PI / 2 - 0.25); s.position.y = -1.35; grp.add(s); }
  grp.rotation.set(0.25, 0.4, 0);
  szene.add(grp); return (z) => { grp.rotation.y = 0.4 + z * 0.2; inn.rotation.x = 0.6 - z * 0.5; splitter.rotation.y = -z * 0.15; };
}

// ---------- D · Linienrelief ----------
function relief(szene) {
  const g = (x, y, cx, cy, sx, sy) => Math.exp(-(((x - cx) / sx) ** 2 + ((y - cy) / sy) ** 2));
  const h = (x, y) => {
    const e = (x / 0.72) ** 2 + (y / 1.0) ** 2; if (e >= 1) return 0;
    let z = 0.38 * Math.sqrt(1 - e);
    z -= 0.12 * g(x, y, -0.27, 0.18, 0.15, 0.09) + 0.12 * g(x, y, 0.27, 0.18, 0.15, 0.09);
    z += 0.06 * g(x, y, -0.27, 0.32, 0.2, 0.05) + 0.06 * g(x, y, 0.27, 0.32, 0.2, 0.05);
    z += 0.2 * g(x, y, 0, 0.02, 0.07, 0.22) + 0.08 * g(x, y, 0, -0.14, 0.11, 0.06);
    z += 0.05 * g(x, y, 0, -0.42, 0.2, 0.035) - 0.03 * g(x, y, 0, -0.47, 0.2, 0.012) + 0.04 * g(x, y, 0, -0.52, 0.17, 0.035);
    z += 0.04 * g(x, y, 0, -0.78, 0.25, 0.12);
    return z * (1 - Math.pow(e, 6));
  };
  const grp = new THREE.Group();
  for (let i = 0; i <= 64; i++) {
    const y = 1.12 - i * (2.3 / 64), pos = [], col = [];
    for (let k = 0; k <= 160; k++) {
      const x = -1.05 + k * (2.1 / 160), z = h(x, y);
      const e = (x / 0.95) ** 2 + (y / 1.2) ** 2, fade = Math.max(0, 1 - Math.pow(e, 2.2));
      pos.push(x * 1.25, y * 1.25, z * 2.4);
      const c = new THREE.Color().copy(CYAN).lerp(WEISS, Math.min(1, z * 2.2)).multiplyScalar(fade * (0.18 + Math.min(0.75, z * 2.0)));
      col.push(c.r, c.g, c.b);
    }
    const g2 = new THREE.BufferGeometry(); g2.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g2.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
    grp.add(new THREE.Line(g2, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })));
  }
  for (const [r, op] of [[1.25, 0.35], [1.5, 0.18]]) { const s = ring(r, 240, CYAN, op, Math.PI / 2); s.position.y = -1.7; grp.add(s); }
  grp.rotation.set(0.18, -0.62, 0);
  szene.add(grp); return (z) => { grp.rotation.y = -0.62 + Math.sin(z * 0.5) * 0.12; };
}

export function starten(el, entwurf = "A", zeit = 2.0) {
  const w = el.clientWidth, hh = el.clientHeight;
  const r = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true }); r.setPixelRatio(Math.min(2, devicePixelRatio)); r.setSize(w, hh);
  el.appendChild(r.domElement);
  const s = new THREE.Scene(), cam = new THREE.PerspectiveCamera(36, w / hh, 0.1, 50); cam.position.set(0, 0.15, 6.2);
  const tick = { A: () => iris(s, zeit), B: () => profil(s), C: () => prisma(s), D: () => relief(s) }[entwurf]();
  const comp = new EffectComposer(r); comp.addPass(new RenderPass(s, cam));
  comp.addPass(new UnrealBloomPass(new THREE.Vector2(w, hh), entwurf === "D" ? 0.7 : 1.05, 0.6, 0.05));
  tick(zeit); comp.render();
  let t0 = performance.now(); (function loop() { tick(zeit + (performance.now() - t0) / 1000); comp.render(); requestAnimationFrame(loop); })();
}
