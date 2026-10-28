/* JARVIS – 3D-Fahrzeug für die Live-Karte (Three.js).
   Quelle: atlas/web/src/auto3d.js → gebündelt nach atlas/web/auto3d.bundle.js (esbuild, iife).
   Eigenständiges, allgemeines Limousinen-Modell aus Grundformen (kein Herstellermodell).
   window.Auto3D.erzeugen(container, {farbe, typ: "limousine" | "van"}) → { ausrichten(gierGrad, nickGrad), fahrt(bool), entfernen() } */
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

function profilForm(punkte) {
  const s = new THREE.Shape();
  punkte.forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y)));
  s.closePath();
  return s;
}
function glatt(punkte, n = 6) {               // Ecken des Profils abrunden (Catmull-Rom)
  const k = new THREE.CatmullRomCurve3(punkte.map(([x, y]) => new THREE.Vector3(x, y, 0)), true, "centripetal", 0.4);
  return k.getPoints(punkte.length * n).map((v) => [v.x, v.y]);
}
function extrudiert(punkte, breite, bevel, mat) {
  const g = new THREE.ExtrudeGeometry(profilForm(punkte), {
    depth: breite - 2 * bevel, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel * 0.9, bevelSegments: 6, curveSegments: 24 });
  g.translate(0, 0, -(breite - 2 * bevel) / 2);
  return new THREE.Mesh(g, mat);
}
function schattenTextur() {
  const c = document.createElement("canvas"); c.width = c.height = 128;
  const x = c.getContext("2d"), r = x.createRadialGradient(64, 64, 4, 64, 64, 64);
  r.addColorStop(0, "rgba(0,0,0,.75)"); r.addColorStop(.55, "rgba(0,0,0,.35)"); r.addColorStop(1, "rgba(0,0,0,0)");
  x.fillStyle = r; x.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}
function kegelTextur() {                      // weicher Lichtfleck der Scheinwerfer auf der Straße
  const c = document.createElement("canvas"); c.width = c.height = 128;
  const x = c.getContext("2d"), g = x.createRadialGradient(64, 64, 2, 64, 64, 64);
  g.addColorStop(0, "rgba(225,250,255,.9)"); g.addColorStop(.45, "rgba(170,240,255,.35)"); g.addColorStop(1, "rgba(160,240,255,0)");
  x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

function bauenVan(farbe) {
  // Großraum-Van (Kleinbus-Proportionen): kurze Haube, steile Front, langes hohes Dach, Fensterband
  const auto = new THREE.Group();
  const lack = new THREE.MeshPhysicalMaterial({ color: new THREE.Color(farbe), metalness: 0.2, roughness: 0.35, clearcoat: 1, clearcoatRoughness: 0.1 });
  const glas = new THREE.MeshPhysicalMaterial({ color: 0x0a1c26, metalness: 0.4, roughness: 0.05, clearcoat: 1 });
  const dunkel = new THREE.MeshStandardMaterial({ color: 0x0b0f12, roughness: 0.8 });
  const kunst = new THREE.MeshStandardMaterial({ color: 0x1a1f24, roughness: 0.6 });
  const karosse = glatt([[-2.54, 0.36], [-2.6, 0.72], [-2.45, 1.0], [-1.95, 1.12], [-1.3, 1.86], [-0.95, 1.98], [2.3, 1.99],
    [2.5, 1.9], [2.54, 0.55], [2.44, 0.34], [1.85, 0.28], [-1.85, 0.28]], 5);
  auto.add(extrudiert(karosse, 2.0, 0.14, lack));
  // Frontscheibe und Fensterband (leicht vor der Karosse, damit es von außen sichtbar ist)
  const scheibe = extrudiert([[-2.02, 1.12], [-1.38, 1.86], [-1.2, 1.86], [-1.84, 1.1]], 1.84, 0.04, glas); auto.add(scheibe);
  const band = extrudiert([[-1.2, 1.36], [-1.15, 1.78], [2.28, 1.78], [2.3, 1.36]], 2.03, 0.03, glas); auto.add(band);
  const heck = extrudiert([[2.5, 1.32], [2.5, 1.84], [2.56, 1.84], [2.56, 1.32]], 1.6, 0.03, glas); auto.add(heck);
  // Dachreling, Schweller, Stoßfänger
  for (const s of [-1, 1]) {
    const reling = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.05, 0.05), kunst); reling.position.set(0.7, 2.05, s * 0.82); auto.add(reling);
    const schweller = new THREE.Mesh(new THREE.BoxGeometry(3.3, 0.12, 0.04), kunst); schweller.position.set(0, 0.42, s * 1.0); auto.add(schweller);
  }
  const stoss = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.3, 1.96), kunst); stoss.position.set(-2.56, 0.5, 0); auto.add(stoss);
  // Lichter: durchgehende Lichtleiste vorn, hohe Rückleuchten
  const licht = new THREE.MeshStandardMaterial({ color: 0xe9fbff, emissive: 0xbff6ff, emissiveIntensity: 2.2 });
  const rot = new THREE.MeshStandardMaterial({ color: 0xff2a3a, emissive: 0xff2a3a, emissiveIntensity: 2.4 });
  const leiste = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 1.7), licht); leiste.position.set(-2.58, 0.98, 0); auto.add(leiste);
  for (const s of [-1, 1]) {
    const sw = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.42), licht); sw.position.set(-2.56, 0.86, s * 0.68); auto.add(sw);
    const rl = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.7, 0.1), rot); rl.position.set(2.53, 1.05, s * 0.93); auto.add(rl);
  }
  const raeder = raederBauen([[-1.7, 0.92], [-1.7, -0.92], [1.62, 0.92], [1.62, -0.92]], 0.38, dunkel);
  raeder.forEach((r) => auto.add(r));
  return { auto, raeder, ...umfeld(auto, 6.6, 3.6, 3.3) };
}
function raederBauen(lagen, rad, dunkel) {
  const reifenG = new THREE.CylinderGeometry(rad, rad, 0.26, 32); reifenG.rotateX(Math.PI / 2);
  const felgeG = new THREE.CylinderGeometry(rad * 0.63, rad * 0.63, 0.27, 20); felgeG.rotateX(Math.PI / 2);
  const felge = new THREE.MeshStandardMaterial({ color: 0x9aa4ab, metalness: 0.9, roughness: 0.25 });
  return lagen.map(([x, z]) => {
    const r = new THREE.Group();
    r.add(new THREE.Mesh(reifenG, dunkel)); r.add(new THREE.Mesh(felgeG, felge));
    for (let i = 0; i < 5; i++) { const sp = new THREE.Mesh(new THREE.BoxGeometry(0.05, rad * 1.05, 0.28), felge); sp.rotation.z = (i / 5) * Math.PI; r.add(sp); }
    r.position.set(x, rad, z); return r;
  });
}
function umfeld(auto, sl, sb, ringR) {
  const schatten = new THREE.Mesh(new THREE.PlaneGeometry(sl, sb), new THREE.MeshBasicMaterial({ map: schattenTextur(), transparent: true, depthWrite: false }));
  schatten.rotation.x = -Math.PI / 2; schatten.position.y = 0.01; auto.add(schatten);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.7, depthWrite: false });
  const ring = new THREE.Mesh(new THREE.RingGeometry(ringR, ringR + 0.18, 64), ringMat);
  ring.rotation.x = -Math.PI / 2; ring.position.y = 0.02; auto.add(ring);
  const kegelMat = new THREE.MeshBasicMaterial({ map: kegelTextur(), transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide });
  const kegel = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 2.8), kegelMat);
  kegel.rotation.x = -Math.PI / 2; kegel.position.set(-sl / 2 - 0.6, 0.03, 0); auto.add(kegel);
  return { ring, ringMat, kegelMat };
}

function bauen(farbe) {
  const auto = new THREE.Group();
  const lack = new THREE.MeshPhysicalMaterial({ color: new THREE.Color(farbe), metalness: 0.25, roughness: 0.32,
    clearcoat: 1, clearcoatRoughness: 0.08 });
  const glas = new THREE.MeshPhysicalMaterial({ color: 0x0a1c26, metalness: 0.4, roughness: 0.05, clearcoat: 1,
    transparent: true, opacity: 0.92 });
  const dunkel = new THREE.MeshStandardMaterial({ color: 0x0b0f12, roughness: 0.8 });
  // Seitenprofil (x = Länge vorn→hinten, y = Höhe), in Metern einer Mittelklasse-Limousine
  const L = 4.7, H = 1.42;
  const karosse = glatt([[-2.36, 0.36], [-2.4, 0.6], [-2.25, 0.74], [-1.5, 0.84], [-0.7, 0.92], [0.9, 0.95],
    [1.9, 0.9], [2.34, 0.82], [2.38, 0.56], [2.3, 0.34], [1.75, 0.26], [1.15, 0.24], [-1.1, 0.24], [-1.75, 0.26]]);
  const k = extrudiert(karosse, 1.86, 0.16, lack); auto.add(k);
  const kabine = glatt([[-1.25, 0.86], [-0.35, 1.34], [0.55, 1.4], [1.35, 1.28], [2.15, 0.9], [0.6, 0.88]]);
  const g = extrudiert(kabine, 1.66, 0.14, glas); auto.add(g);
  // Lichtleisten
  const licht = new THREE.MeshStandardMaterial({ color: 0xe9fbff, emissive: 0xbff6ff, emissiveIntensity: 2.2 });
  const rot = new THREE.MeshStandardMaterial({ color: 0xff2a3a, emissive: 0xff2a3a, emissiveIntensity: 2.4 });
  for (const s of [-1, 1]) {
    const sw = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.09, 0.5), licht);
    sw.position.set(-2.3, 0.68, s * 0.6); sw.rotation.y = s * 0.3; auto.add(sw);
  }
  const rueck = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 1.66), rot);
  rueck.position.set(2.33, 0.8, 0); auto.add(rueck);
  // Räder
  const reifenG = new THREE.CylinderGeometry(0.38, 0.38, 0.26, 32); reifenG.rotateX(Math.PI / 2);
  const felgeG = new THREE.CylinderGeometry(0.24, 0.24, 0.27, 20); felgeG.rotateX(Math.PI / 2);
  const felge = new THREE.MeshStandardMaterial({ color: 0x9aa4ab, metalness: 0.9, roughness: 0.25 });
  const raeder = [];
  for (const [x, z] of [[-1.42, 0.83], [-1.42, -0.83], [1.45, 0.83], [1.45, -0.83]]) {
    const r = new THREE.Group();
    r.add(new THREE.Mesh(reifenG, dunkel));
    const f = new THREE.Mesh(felgeG, felge); r.add(f);
    for (let i = 0; i < 5; i++) {                 // Speichen, damit man das Drehen sieht
      const sp = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.4, 0.28), felge); sp.rotation.z = (i / 5) * Math.PI; r.add(sp);
    }
    r.position.set(x, 0.38, z); auto.add(r); raeder.push(r);
  }
  // Schatten, Leuchtring, Lichtkegel
  const schatten = new THREE.Mesh(new THREE.PlaneGeometry(6.2, 3.4), new THREE.MeshBasicMaterial({ map: schattenTextur(), transparent: true, depthWrite: false }));
  schatten.rotation.x = -Math.PI / 2; schatten.position.y = 0.01; auto.add(schatten);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.7, depthWrite: false });
  const ring = new THREE.Mesh(new THREE.RingGeometry(3.0, 3.18, 64), ringMat);
  ring.rotation.x = -Math.PI / 2; ring.position.y = 0.02; auto.add(ring);
  const kegelMat = new THREE.MeshBasicMaterial({ map: kegelTextur(), transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide });
  const kegel = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 2.8), kegelMat);
  kegel.rotation.x = -Math.PI / 2; kegel.position.set(-3.7, 0.03, 0); auto.add(kegel);
  return { auto, raeder, ring, ringMat, kegelMat };
}

function erzeugen(container, opt = {}) {
  const groesse = container.clientWidth || 180;
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, premultipliedAlpha: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.setSize(groesse, groesse);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  container.appendChild(renderer.domElement);
  const szene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  szene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  szene.add(new THREE.HemisphereLight(0xbfefff, 0x0a1a24, 0.8));
  const sonne = new THREE.DirectionalLight(0xffffff, 1.6); sonne.position.set(-4, 9, 5); szene.add(sonne);
  const kante = new THREE.DirectionalLight(0x00e5ff, 1.2); kante.position.set(5, 3, -6); szene.add(kante);
  const kamera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  kamera.up.set(0, 0, -1);                         // Bildschirm-oben = Kartennorden (auch senkrecht von oben)
  const m = opt.typ === "van" ? bauenVan(opt.farbe || "#eef0f1") : bauen(opt.farbe || "#e9ecef");
  szene.add(m.auto);
  let gier = 0, nick = 55, faehrt = false, laeuft = true, letzte = 0, t0 = performance.now();
  const ausrichten = (g, n) => { gier = g; nick = Math.max(0, Math.min(80, n)); };
  function bild(t) {
    if (!laeuft) return;
    requestAnimationFrame(bild);
    if (t - letzte < 33) return;                      // ~30 Bilder/s genügen
    const dt = (t - letzte) / 1000; letzte = t;
    // Auto zeigt mit der Front in Fahrtrichtung: Kartennorden = -z der Szene
    m.auto.rotation.y = -THREE.MathUtils.degToRad(gier) - Math.PI / 2;
    const el = THREE.MathUtils.degToRad(90 - nick), d = opt.typ === "van" ? 21 : 19;
    kamera.position.set(0, d * Math.sin(el), d * Math.cos(el));
    kamera.lookAt(0, 0.4, 0);
    const z = (t - t0) / 1000;
    if (faehrt) m.raeder.forEach((r) => (r.rotation.z += dt * 9));
    m.auto.position.y = faehrt ? Math.sin(z * 18) * 0.012 : 0;
    const puls = (z * (faehrt ? 1.4 : 0.6)) % 1;
    m.ring.scale.setScalar(0.75 + puls * 0.55); m.ringMat.opacity = 0.75 * (1 - puls);
    m.ringMat.color.set(faehrt ? 0x3ddc97 : 0x00e5ff);
    m.kegelMat.opacity += ((faehrt ? 0.45 : 0) - m.kegelMat.opacity) * 0.1;
    renderer.render(szene, kamera);
  }
  requestAnimationFrame(bild);
  return {
    ausrichten, fahrt: (b) => { faehrt = !!b; },
    groesse: (px) => { renderer.setSize(px, px); },
    entfernen: () => { laeuft = false; renderer.dispose(); pmrem.dispose(); renderer.domElement.remove(); },
  };
}
window.Auto3D = { erzeugen };
