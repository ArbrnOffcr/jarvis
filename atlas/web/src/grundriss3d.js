/* JARVIS – Grundriss als 3D-Puppenhaus (Three.js). Quelle: atlas/web/src/grundriss3d.js → atlas/web/grundriss3d.bundle.js
   window.Grundriss3D.erzeugen(container, plaene, {}) → { setzen(plaene), ebene(i|null), halbhoch(bool), entfernen() }
   Plan: { massstab (m/px), wandhoehe, waende:[{x1,y1,x2,y2,aussen}], oeffnungen:[{typ,wand,pos,breite_m}], raeume:[{name,polygon,flaeche,flaeche_plan}] } */
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

const FARBE_RAUM = [[/bad|wc|dusch/i, 0x8fc6d8], [/küche|kueche|koch/i, 0xe2c79a], [/wohn|ess/i, 0xd8cdb8], [/schlaf|eltern/i, 0xc9c0d8],
  [/kind/i, 0xc8dcb4], [/flur|diele|gang|eingang/i, 0xc4c8cc], [/hwr|technik|abstell|haus/i, 0xb7bcc0], [/terr|balkon/i, 0xa9b29c]];
const raumFarbe = (n) => (FARBE_RAUM.find(([rx]) => rx.test(n || "")) || [0, 0xd6d2c8])[1];

function schild(text1, text2) {
  const c = document.createElement("canvas"); c.width = 512; c.height = 160;
  const x = c.getContext("2d");
  x.font = "600 54px -apple-system, Helvetica, sans-serif"; x.textAlign = "center"; x.fillStyle = "#0b1a22";
  x.fillText(text1, 256, 70);
  if (text2) { x.font = "500 44px -apple-system, Helvetica, sans-serif"; x.fillStyle = "#24607a"; x.fillText(text2, 256, 128); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthTest: false }));
  s.scale.set(3.2, 1.0, 1); s.renderOrder = 10; return s;
}

function massstabVon(p) {
  if (p.massstab) return p.massstab;
  let mx = 0; for (const w of p.waende || []) mx = Math.max(mx, w.x1, w.x2, w.y1, w.y2);
  return mx ? 12 / mx : 0.02;                 // ohne Maßstab: Gebäude ~12 m breit annehmen
}

function ebeneBauen(p, mat, s, mitte, hoehe, faktor) {
  const g = new THREE.Group();
  const X = (px) => (px - mitte[0]) * s, Z = (py) => (py - mitte[1]) * s;
  const H = hoehe * faktor;
  const kanten = [];
  (p.waende || []).forEach((w, i) => {
    const ax = X(w.x1), az = Z(w.y1), bx = X(w.x2), bz = Z(w.y2);
    const L = Math.hypot(bx - ax, bz - az); if (L < 0.05) return;
    const d = w.aussen ? 0.36 : 0.12, rot = -Math.atan2(bz - az, bx - ax);
    const oe = (p.oeffnungen || []).filter((o) => o.wand === i).map((o) => {
      const b = Math.min(L - 0.1, o.breite_m || (o.typ === "tuer" ? 0.9 : 1.2)), m = o.pos * L;
      return { a: Math.max(0, m - b / 2), e: Math.min(L, m + b / 2), typ: o.typ };
    }).sort((u, v) => u.a - v.a);
    const stueck = (von, bis, y0, y1, m = mat.wand) => {
      if (bis - von < 0.01 || y1 - y0 < 0.01) return;
      const box = new THREE.Mesh(new THREE.BoxGeometry(bis - von, y1 - y0, d), m);
      const t = (von + bis) / 2 / L;
      box.position.set(ax + (bx - ax) * t, y0 + (y1 - y0) / 2, az + (bz - az) * t);
      box.rotation.y = rot; box.castShadow = box.receiveShadow = true; g.add(box);
      if (m === mat.wand) kanten.push(box);
    };
    let pos = 0;
    for (const o of oe) {
      stueck(pos, o.a, 0, H);
      const unten = o.typ === "tuer" ? 0 : Math.min(H, 0.9 * faktor), oben = Math.min(H, (o.typ === "tuer" ? 2.05 : 2.1) * faktor);
      stueck(o.a, o.e, 0, unten); stueck(o.a, o.e, oben, H);
      if (o.typ === "fenster") stueck(o.a, o.e, unten, oben, mat.glas);
      pos = o.e;
    }
    stueck(pos, L, 0, H);
  });
  for (const b of kanten) {
    const l = new THREE.LineSegments(new THREE.EdgesGeometry(b.geometry), mat.kante);
    l.position.copy(b.position); l.rotation.copy(b.rotation); g.add(l);
  }
  // Böden der Räume + Schilder
  for (const r of p.raeume || []) {
    const pts = r.polygon.map(([x, y]) => new THREE.Vector2(X(x), -Z(y)));
    const boden = new THREE.Mesh(new THREE.ShapeGeometry(new THREE.Shape(pts)),
      new THREE.MeshStandardMaterial({ color: raumFarbe(r.name), roughness: 0.75, emissive: raumFarbe(r.name), emissiveIntensity: 0.18 }));
    boden.rotation.x = -Math.PI / 2; boden.position.y = 0.02; g.add(boden);
    const cx = pts.reduce((a, q) => a + q.x, 0) / pts.length, cz = -pts.reduce((a, q) => a + q.y, 0) / pts.length;
    const f = r.flaeche_plan || r.flaeche;
    const sp = schild(r.name || "Raum", f ? `${f.toFixed(1).replace(".", ",")} m²` : "");
    sp.position.set(cx, Math.min(1.2, H + 0.4), cz); g.add(sp);
  }
  // Bodenplatte unter allem
  const box = new THREE.Box3().setFromObject(g);
  if (!box.isEmpty()) {
    const sz = box.getSize(new THREE.Vector3()), c = box.getCenter(new THREE.Vector3());
    const platte = new THREE.Mesh(new THREE.BoxGeometry(sz.x + 0.4, 0.2, sz.z + 0.4), mat.platte);
    platte.position.set(c.x, -0.1, c.z); platte.receiveShadow = true; g.add(platte);
  }
  return g;
}

function erzeugen(container, plaene, opt = {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);
  const szene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  szene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  szene.add(new THREE.HemisphereLight(0xeef9ff, 0x2a3a44, 1.25));
  const sonne = new THREE.DirectionalLight(0xfff6ea, 1.1); sonne.position.set(-10, 26, 14); sonne.shadow.radius = 4; sonne.shadow.bias = -0.0005; sonne.castShadow = true;
  sonne.shadow.mapSize.set(2048, 2048); Object.assign(sonne.shadow.camera, { left: -20, right: 20, top: 20, bottom: -20, far: 80 });
  szene.add(sonne);
  const raster = new THREE.GridHelper(60, 60, 0x0e5d78, 0x0a3346); raster.position.y = -0.21;
  raster.material.transparent = true; raster.material.opacity = 0.5; szene.add(raster);
  const kamera = new THREE.PerspectiveCamera(38, 1, 0.1, 400);
  const ctrl = new OrbitControls(kamera, renderer.domElement);
  ctrl.enableDamping = true; ctrl.maxPolarAngle = Math.PI * 0.49; ctrl.autoRotate = true; ctrl.autoRotateSpeed = 0.6;
  ctrl.addEventListener("start", () => { ctrl.autoRotate = false; });
  const mat = {
    wand: new THREE.MeshStandardMaterial({ color: 0xeef2f4, roughness: 0.9 }),
    glas: new THREE.MeshPhysicalMaterial({ color: 0x9fe8ff, transparent: true, opacity: 0.35, roughness: 0.05, metalness: 0.1 }),
    kante: new THREE.LineBasicMaterial({ color: 0x00b8d4, transparent: true, opacity: 0.35 }),
    platte: new THREE.MeshStandardMaterial({ color: 0x23323b, roughness: 1 }),
  };
  let gruppe = null, daten = plaene || [], aktiv = null, faktor = 1, laeuft = true, erstesMal = true;
  function bauen() {
    if (gruppe) { szene.remove(gruppe); gruppe.traverse((o) => { o.geometry?.dispose(); if (o.material && !Object.values(mat).includes(o.material)) { o.material.map?.dispose(); o.material.dispose(); } }); }
    gruppe = new THREE.Group();
    const erster = daten.find((p) => (p.waende || []).length) || {};
    const s0 = massstabVon(erster);
    let minx = Infinity, miny = Infinity, maxx = -Infinity, maxy = -Infinity;
    for (const w of erster.waende || []) { minx = Math.min(minx, w.x1, w.x2); maxx = Math.max(maxx, w.x1, w.x2); miny = Math.min(miny, w.y1, w.y2); maxy = Math.max(maxy, w.y1, w.y2); }
    let y = 0;
    daten.forEach((p, i) => {
      const s = massstabVon(p), h = p.wandhoehe || 2.5;
      // gleiche Mitte für alle Ebenen (Pläne im gleichen Bildausschnitt angenommen)
      const mitte = [(minx + maxx) / 2 * (s0 / s), (miny + maxy) / 2 * (s0 / s)];
      const g = ebeneBauen(p, mat, s, isFinite(mitte[0]) ? mitte : [0, 0], h, faktor);
      g.position.y = aktiv === null ? y : 0;
      g.visible = aktiv === null || aktiv === i;
      gruppe.add(g);
      y += h + 0.3 + (aktiv === null && daten.length > 1 ? 1.2 : 0);     // Ebenen leicht auseinander („explodiert“)
    });
    szene.add(gruppe);
    if (erstesMal) { ausrichten(); erstesMal = false; }
  }
  function ausrichten() {
    const b = new THREE.Box3().setFromObject(gruppe); if (b.isEmpty()) { kamera.position.set(12, 14, 16); ctrl.target.set(0, 0, 0); return; }
    const c = b.getCenter(new THREE.Vector3()), r = b.getSize(new THREE.Vector3()).length() * 0.7 * Math.pow(Math.max(1, 1.1 / (kamera.aspect || 1)), 0.8);
    ctrl.target.copy(c); kamera.position.set(c.x + r * 0.55, c.y + r * 1.45, c.z + r * 0.85); ctrl.update();
  }
  function groesse() {
    const w = container.clientWidth || 600, h = container.clientHeight || 400;
    renderer.setSize(w, h, false); renderer.domElement.style.width = w + "px"; renderer.domElement.style.height = h + "px";
    kamera.aspect = w / h; kamera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(groesse); ro.observe(container); groesse();
  bauen();
  (function bild() { if (!laeuft) return; requestAnimationFrame(bild); ctrl.update(); renderer.render(szene, kamera); })();
  return {
    setzen(p) { daten = p || []; bauen(); },
    ebene(i) { aktiv = i; bauen(); ausrichten(); },
    halbhoch(b) { faktor = b ? 0.45 : 1; bauen(); },
    ansicht() { ausrichten(); ctrl.autoRotate = false; },
    entfernen() { laeuft = false; ro.disconnect(); ctrl.dispose(); renderer.dispose(); pmrem.dispose(); renderer.domElement.remove(); },
  };
}
window.Grundriss3D = { erzeugen };
