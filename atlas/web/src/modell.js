/* JARVIS · Avatar-Player für echte 3D-Modelle (glTF/.glb)
   Erwartet den Namensvertrag der Blender-Pipeline (Knochen Head/Neck/Spine2/LeftEye/RightEye, ARKit-Formen,
   Viseme, breath, Clips idle_atmen …), kommt aber auch mit weniger aus:
   - Formnamen werden vereinheitlicht (eyeBlinkLeft = eyeBlink_L), fehlende Viseme aus ARKit-Formen gemischt
   - ohne Kopf-/Augenknochen dreht er gleichnamige Knoten oder nutzt eyeLook-Formen
   - ohne Clips übernimmt eine prozedurale Bewegung (Atmen, Gewicht, Mikrobewegung)
   Steuerung zur Laufzeit: Blick folgt der Maus (Grenzen Kopf ±35°/±20°, Augen ±25°), Sakkaden, Blinzeln,
   Atmen, Mund aus Text (Laute) + Pegel, Nähte/Augen pulsieren mit der Stimme, drehen(), Zustände. */
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { KTX2Loader } from "three/examples/jsm/loaders/KTX2Loader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

const GRAD = Math.PI / 180;
const GRENZEN = { kopfSeite: 35 * GRAD, kopfHoch: 20 * GRAD, auge: 25 * GRAD };
const kanon = (n) => String(n).replace(/_L$/, "Left").replace(/_R$/, "Right").replace(/[_\s.-]/g, "").toLowerCase();

// Viseme aus ARKit-Formen, falls das Modell keine eigenen viseme_* hat
const VIS_MIX = {
  sil: {}, aa: { jawopen: .62, mouthstretchleft: .15, mouthstretchright: .15 },
  E: { jawopen: .32, mouthstretchleft: .38, mouthstretchright: .38, mouthsmileleft: .15, mouthsmileright: .15 },
  I: { jawopen: .2, mouthsmileleft: .4, mouthsmileright: .4, mouthstretchleft: .25, mouthstretchright: .25 },
  O: { jawopen: .45, mouthfunnel: .6, mouthpucker: .2 }, U: { jawopen: .18, mouthpucker: .72, mouthfunnel: .3 },
  PP: { mouthclose: .45, mouthpressleft: .4, mouthpressright: .4 }, FF: { jawopen: .08, mouthrolllower: .5, mouthupperupleft: .15, mouthupperupright: .15 },
  TH: { jawopen: .16, tongueout: .22 }, DD: { jawopen: .22, mouthstretchleft: .1, mouthstretchright: .1 },
  kk: { jawopen: .26 }, CH: { jawopen: .2, mouthfunnel: .32, mouthpucker: .12 }, SS: { jawopen: .1, mouthstretchleft: .25, mouthstretchright: .25 },
  nn: { jawopen: .14 }, RR: { jawopen: .2, mouthfunnel: .15 },
};
const VISEME = Object.keys(VIS_MIX);
// Deutsch: Buchstaben → Laut (grob, für die Mundbewegung genügt das)
function laute(text) {
  const t = String(text || "").toLowerCase().replace(/sch/g, "§").replace(/ch/g, "§").replace(/th/g, "þ");
  const out = [];
  for (const z of t) {
    if ("aä".includes(z)) out.push("aa"); else if ("eé".includes(z)) out.push("E"); else if ("iy".includes(z)) out.push("I");
    else if ("oö".includes(z)) out.push("O"); else if ("uü".includes(z)) out.push("U"); else if ("bpm".includes(z)) out.push("PP");
    else if ("fvw".includes(z)) out.push("FF"); else if ("dtl".includes(z)) out.push("DD"); else if (z === "n") out.push("nn");
    else if ("szßcx".includes(z)) out.push("SS"); else if ("kgq".includes(z)) out.push("kk"); else if (z === "r") out.push("RR");
    else if (z === "§" || z === "j") out.push("CH"); else if (z === "þ") out.push("TH"); else if (z === "h") continue;
    else if (/[\s]/.test(z)) out.push("sil"); else if (/[.,;:!?–-]/.test(z)) out.push("sil", "sil", "sil");
  }
  return out;
}
// weiches Rauschen aus inkommensurablen Sinuswellen (organische Mikrobewegung)
const rauschen = (t, s) => Math.sin(t * 0.61 + s) * 0.5 + Math.sin(t * 1.37 + s * 2.1) * 0.3 + Math.sin(t * 2.93 + s * 3.7) * 0.2;
const feder = (aktuell, ziel, dt, k) => aktuell + (ziel - aktuell) * (1 - Math.exp(-dt * k));

export function modell(container, { url, qualitaet = "hoch", basis = "vendor/basis/", beiFehler, beiGeladen } = {}) {
  const niedrig = qualitaet === "niedrig";
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: !niedrig });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, niedrig ? 1 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  renderer.domElement.style.cssText = "display:block;width:100%;height:100%;";
  container.appendChild(renderer.domElement);
  const szene = new THREE.Scene(), kamera = new THREE.PerspectiveCamera(26, 1, 0.01, 100);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const umgebung = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  szene.environment = umgebung; szene.environmentIntensity = 0.55;
  szene.add(new THREE.HemisphereLight(0xcff6ff, 0x081420, 0.9));
  const key = new THREE.DirectionalLight(0xf2fbff, 2.4); key.position.set(-1.5, 2.2, 2.5); szene.add(key);
  const rand = new THREE.DirectionalLight(0x00e5ff, 3.2); rand.position.set(2.2, 1.2, -2.2); szene.add(rand);
  const rand2 = new THREE.DirectionalLight(0x7ff3ff, 1.4); rand2.position.set(-2.4, 0.6, -1.8); szene.add(rand2);

  const wurzel = new THREE.Group(); szene.add(wurzel);
  let mixer = null, aktionen = {}, aktiverClip = null;
  const formen = new Map();            // kanonischer Name → [[mesh, index], …]
  const leucht = [];                   // [material, basisIntensität, basisFarbe]
  const knochen = {};
  let fokus = new THREE.Vector3(0, 1.6, 0), geladen = false, weg = false;

  // ---------- Laden ----------
  const ktx2 = new KTX2Loader().setTranscoderPath(basis).detectSupport(renderer);
  const loader = new GLTFLoader().setKTX2Loader(ktx2).setMeshoptDecoder(MeshoptDecoder);
  loader.load(url, (gltf) => {
    if (weg) return;
    const s = gltf.scene; wurzel.add(s);
    s.traverse((o) => {
      if (o.isMesh || o.isSkinnedMesh) {
        o.frustumCulled = false;
        if (o.morphTargetDictionary) for (const [n, i] of Object.entries(o.morphTargetDictionary)) {
          const k = kanon(n); if (!formen.has(k)) formen.set(k, []); formen.get(k).push([o, i]);
        }
        for (const m of [].concat(o.material)) {
          if (!m) continue;
          if (m.transparent) { m.depthWrite = false; o.renderOrder = /innen/i.test(o.name) ? 1 : 2; }
          if (/naeht|naht|seam|glut|glow|emiss/i.test(m.name) || (m.emissive && m.emissive.getHex() !== 0 && (m.emissiveIntensity || 1) > 0)) {
            leucht.push([m, m.emissiveIntensity || 1, m.emissive.clone()]);
          }
        }
      }
      const n = o.name || "";
      const passt = (re) => re.test(n);
      if (!knochen.kopf && passt(/^(Head|head|mixamorig:?Head)$/)) knochen.kopf = o;
      if (!knochen.hals && passt(/^(Neck|neck|mixamorig:?Neck)$/)) knochen.hals = o;
      if (!knochen.brust && passt(/^(Spine2|Chest|spine2|mixamorig:?Spine2)$/)) knochen.brust = o;
      if (!knochen.augeL && passt(/^(LeftEye|eyeLeft|Eye_L|eye_L|mixamorig:?LeftEye)$/)) knochen.augeL = o;
      if (!knochen.augeR && passt(/^(RightEye|eyeRight|Eye_R|eye_R|mixamorig:?RightEye)$/)) knochen.augeR = o;
    });
    // Augen nur als Knoten drehen, wenn ihr Drehpunkt in der Augapfelmitte liegt – sonst eyeLook-Formen
    s.updateMatrixWorld(true);
    for (const k of ["augeL", "augeR"]) {
      const o = knochen[k]; if (!o || o.isBone) continue;
      if (formen.has("eyelookinleft")) { delete knochen[k]; continue; }      // Formen sind verlässlicher als lose Knoten
      const kugel = new THREE.Box3().setFromObject(o).getBoundingSphere(new THREE.Sphere());
      if (!kugel.radius || o.getWorldPosition(new THREE.Vector3()).distanceTo(kugel.center) > kugel.radius * 0.35) delete knochen[k];
    }
    for (const k of ["kopf", "hals", "brust", "augeL", "augeR"]) if (knochen[k]) knochen[k].userData.ruhe = knochen[k].quaternion.clone();
    // Clips nach Vertrag (fremde Aufnahmen wie „Take 001“ werden ignoriert)
    mixer = new THREE.AnimationMixer(s);
    for (const c of gltf.animations || []) {
      if (/^(idle_atmen|idle_gewicht|zuhoeren|denken|sprechen_gesten|warnung)$/.test(c.name)) aktionen[c.name] = mixer.clipAction(c);
    }
    if (aktionen.idle_atmen) aktionen.idle_atmen.play();
    if (aktionen.idle_gewicht) { aktionen.idle_gewicht.setEffectiveWeight(0.6); aktionen.idle_gewicht.play(); }
    rahmen();
    geladen = performance.now();
    beiGeladen?.({ formen: formen.size, knochen: Object.keys(knochen), clips: Object.keys(aktionen) });
  }, undefined, (e) => { if (!weg) beiFehler?.(e); });

  // Bildausschnitt: Büste (Kopf + Brust) bzw. reiner Kopf
  function rahmen() {
    wurzel.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(wurzel), gr = box.getSize(new THREE.Vector3()), mitte = box.getCenter(new THREE.Vector3());
    let ziel, hoehe;
    if (knochen.kopf?.isBone) {
      const kp = knochen.kopf.getWorldPosition(new THREE.Vector3());
      hoehe = Math.max(0.55, (box.max.y - kp.y) * 4.2); ziel = new THREE.Vector3(kp.x, kp.y - hoehe * 0.18, kp.z);
    } else if (gr.y > gr.x * 1.6) { hoehe = gr.y * 0.62; ziel = new THREE.Vector3(mitte.x, box.max.y - hoehe * 0.45, mitte.z); }
    else { hoehe = gr.y * 1.05; ziel = mitte.clone(); }
    fokus.copy(ziel);
    const dist = (hoehe / 2) / Math.tan(kamera.fov * GRAD / 2);
    kamera.userData.dist = dist; kamera.userData.hoehe = hoehe;
    kamera.near = dist / 50; kamera.far = dist * 20; kamera.updateProjectionMatrix();
  }

  // ---------- Zustand ----------
  let ziel = "ruhe", wechsel = performance.now(), vonLicht = 1, licht = 1, warn = 0;
  let roh = 0, pegel = 0, letzterPegel = -1e9;
  let folge = [], folgeStart = 0, folgeRate = 74;          // ms je Buchstabe
  let visemDirekt = null, visemDirektBis = 0;
  const gewichte = new Map();                               // geglättete Formgewichte
  let maus = new THREE.Vector2(), mausZiel = new THREE.Vector2(), mausZeit = 0;
  let blick = new THREE.Vector2(), kopfBlick = new THREE.Vector2(), sakkade = new THREE.Vector2(), naechsteSakkade = 0;
  let blinzeln = 0, naechstesBlinzeln = performance.now() + 2500, doppel = false;
  let drehung = 0, drehStart = 0, drehZiel = 0, drehVon = 0;
  const reduziert = matchMedia("(prefers-reduced-motion: reduce)");
  const onMaus = (e) => { mausZiel.set((e.clientX / innerWidth) * 2 - 1, (e.clientY / innerHeight) * 2 - 1); mausZeit = performance.now(); };
  addEventListener("pointermove", onMaus, { passive: true });

  function setze(name, w) { for (const [m, i] of formen.get(kanon(name)) || []) m.morphTargetInfluences[i] = w; }
  function hat(name) { return formen.has(kanon(name)); }
  function weich(name, w, dt, k = 18) { const a = gewichte.get(name) || 0, n = feder(a, w, dt, k); gewichte.set(name, n); setze(name, n); }

  function groesse() {
    const r = container.getBoundingClientRect(), w = Math.max(1, r.width), h = Math.max(1, r.height);
    renderer.setSize(w, h, false); kamera.aspect = w / h; kamera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(groesse); ro.observe(container); groesse();

  // Drehung in welt-ausgerichteten Achsen (Y = seitlich, X = nicken), unabhängig von Knochen-Roll und Modellhierarchie
  const q = new THREE.Quaternion(), e = new THREE.Euler(), pq = new THREE.Quaternion();
  function drehKnochen(o, nick, gier, roll = 0) {
    if (!o) return;
    e.set(nick, gier, roll, "YXZ"); q.setFromEuler(e);
    if (o.parent) { o.parent.getWorldQuaternion(pq); q.premultiply(pq.clone().invert()).multiply(pq); }
    o.quaternion.premultiply(q);
  }

  let frame = 0, letzte = 0;
  const start = performance.now();
  function zeichne(now) {
    if (weg) return; frame = requestAnimationFrame(zeichne);
    if (niedrig && letzte && now - letzte < 1000 / 30 - 0.5) return;
    const dt = Math.min(0.1, (now - (letzte || now)) / 1000); letzte = now;
    if (document.hidden || !geladen) { if (!geladen) renderer.render(szene, kamera); return; }
    const t = (now - start) / 1000, ruhig = reduziert.matches;
    // erst Grundpose, dann Clips (überschreiben nur ihre eigenen Spuren), dann Blick/Atmung obendrauf
    for (const k of ["kopf", "hals", "brust", "augeL", "augeR"]) if (knochen[k]) knochen[k].quaternion.copy(knochen[k].userData.ruhe);
    if (mixer) mixer.update(ruhig ? 0 : dt);
    const e2 = Math.min(1, (now - wechsel) / 1200);
    licht = vonLicht + ({ ruhe: 1, zuhoeren: 1.15, denken: 1.05, sprechen: 1.1, warnung: 1.1 }[ziel] - vonLicht) * e2;
    warn = feder(warn, ziel === "warnung" ? 1 : 0, dt, 3);

    // ---------- Blick: Maus, sonst schweifend; Augen führen, Kopf folgt ----------
    maus.lerp(mausZiel, 1 - Math.exp(-dt * 6));
    let zx = maus.x, zy = maus.y;
    if (now - mausZeit > 5000) { zx = rauschen(t * 0.25, 1) * 0.35; zy = rauschen(t * 0.2, 4) * 0.15; }
    if (ziel === "denken") { zx = 0.45 + rauschen(t * 0.4, 7) * 0.1; zy = -0.35; }
    if (now > naechsteSakkade) { sakkade.set((Math.random() - 0.5) * 0.12, (Math.random() - 0.5) * 0.08); naechsteSakkade = now + 900 + Math.random() * 2600; }
    const gierZiel = THREE.MathUtils.clamp(zx * 0.9 + sakkade.x, -1, 1), nickZiel = THREE.MathUtils.clamp(zy * 0.9 + sakkade.y, -1, 1);
    blick.x = feder(blick.x, gierZiel, dt, 22); blick.y = feder(blick.y, nickZiel, dt, 22);          // Augen schnell
    kopfBlick.x = feder(kopfBlick.x, gierZiel, dt, 3.2); kopfBlick.y = feder(kopfBlick.y, nickZiel, dt, 3.2);  // Kopf träge
    if (!ruhig) {
      const kGier = kopfBlick.x * GRENZEN.kopfSeite + rauschen(t, 2) * 1.2 * GRAD;
      const kNick = kopfBlick.y * GRENZEN.kopfHoch + rauschen(t * 0.8, 5) * 0.9 * GRAD + (ziel === "zuhoeren" ? 3.5 * GRAD : 0);
      const roll = (ziel === "zuhoeren" ? 4 * GRAD : 0) + rauschen(t * 0.7, 9) * 0.8 * GRAD;
      if (knochen.hals) { drehKnochen(knochen.hals, kNick * 0.35, kGier * 0.4, roll * 0.4); drehKnochen(knochen.kopf, kNick * 0.65, kGier * 0.6, roll * 0.6); }
      else drehKnochen(knochen.kopf, kNick, kGier, roll);
      if (knochen.brust) drehKnochen(knochen.brust, Math.sin(t * Math.PI * 2 / 4.5) * 0.6 * GRAD, kGier * 0.12 + rauschen(t * 0.3, 3) * 0.8 * GRAD, 0);
      // Augen: Rest der Blickrichtung, begrenzt
      const aGier = THREE.MathUtils.clamp((blick.x - kopfBlick.x) * 1.6 + blick.x * 0.25, -1, 1) * GRENZEN.auge;
      const aNick = THREE.MathUtils.clamp((blick.y - kopfBlick.y) * 1.6 + blick.y * 0.2, -1, 1) * GRENZEN.auge * 0.7;
      if (knochen.augeL || knochen.augeR) { drehKnochen(knochen.augeL, aNick, aGier); drehKnochen(knochen.augeR, aNick, aGier); }
      else {
        const r = aGier / GRENZEN.auge, u = aNick / (GRENZEN.auge * 0.7);
        weich("eyeLookOutLeft", Math.max(0, -r), dt, 30); weich("eyeLookInLeft", Math.max(0, r), dt, 30);
        weich("eyeLookInRight", Math.max(0, -r), dt, 30); weich("eyeLookOutRight", Math.max(0, r), dt, 30);
        weich("eyeLookUpLeft", Math.max(0, -u), dt, 30); weich("eyeLookUpRight", Math.max(0, -u), dt, 30);
        weich("eyeLookDownLeft", Math.max(0, u), dt, 30); weich("eyeLookDownRight", Math.max(0, u), dt, 30);
      }
    }
    // ganzer Körper: drehen() und leichte Zuwendung
    if (drehZiel !== drehVon) {
      const k = Math.min(1, (now - drehStart) / 2600), ease = k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      drehung = drehVon + (drehZiel - drehVon) * ease; if (k >= 1) { drehVon = drehZiel = 0; drehung = 0; }
    }
    wurzel.rotation.y = drehung + (ruhig ? 0 : kopfBlick.x * 0.08 + rauschen(t * 0.15, 11) * 0.02);

    // ---------- Atmen ----------
    const atem = 0.5 + 0.5 * Math.sin(t * Math.PI * 2 / 4.5);
    if (!aktionen.idle_atmen) { if (hat("breath")) weich("breath", ruhig ? atem * 0.5 : atem, dt, 8); else wurzel.scale.setScalar(1 + atem * 0.003); }
    wurzel.position.y = ruhig ? 0 : rauschen(t * 0.35, 13) * 0.002;

    // ---------- Blinzeln ----------
    if (now > naechstesBlinzeln) { blinzeln = now; doppel = Math.random() < 0.15; naechstesBlinzeln = now + 2200 + Math.random() * 4200; }
    const b = (now - blinzeln) / 1000; let lid = 0;
    if (b < 0.07) lid = b / 0.07; else if (b < 0.18) lid = 1 - (b - 0.07) / 0.11;
    if (doppel && b > 0.26 && b < 0.44) { const c = b - 0.26; lid = c < 0.07 ? c / 0.07 : 1 - (c - 0.07) / 0.11; }
    setze("eyeBlinkLeft", Math.max(0, lid)); setze("eyeBlinkRight", Math.max(0, lid));

    // ---------- Mund ----------
    const signal = now - letzterPegel < 300 ? roh : 0;
    pegel = feder(pegel, signal, dt, 20);
    let laut = "sil";
    if (visemDirekt && now < visemDirektBis) laut = visemDirekt;
    else if (folge.length && folgeStart) {
      const i = Math.floor((now - folgeStart) / folgeRate);
      if (i >= folge.length) folge = []; else laut = folge[i];
      if (pegel < 0.02 && now - letzterPegel < 300) laut = "sil";            // Atempause der Stimme
    } else if (ziel === "sprechen" && pegel > 0.04) laut = VISEME[1 + (Math.floor(t * 9) % 5)];  // ohne Text: Vokale im Takt
    const staerke = ziel === "sprechen" || folge.length ? THREE.MathUtils.clamp(0.35 + pegel * 1.4, 0.35, 1) : 0;
    const zielMix = {};
    if (hat("viseme_" + laut) && laut !== "sil") zielMix["viseme_" + laut] = staerke;
    else for (const [n, w] of Object.entries(VIS_MIX[laut] || {})) zielMix[n] = w * staerke;
    const alle = new Set([...VISEME.map((v) => "viseme_" + v), ...Object.values(VIS_MIX).flatMap((m) => Object.keys(m))]);
    for (const n of alle) if (hat(n)) weich(n, zielMix[n] || 0, dt, 26);
    // freundliche Grundmimik, Augenbrauen beim Zuhören
    weich("mouthSmileLeft", (zielMix.mouthsmileleft || 0) + (ziel === "ruhe" ? 0.07 : 0.04), dt, 6);
    weich("mouthSmileRight", (zielMix.mouthsmileright || 0) + (ziel === "ruhe" ? 0.07 : 0.04), dt, 6);
    weich("browInnerUp", ziel === "zuhoeren" ? 0.25 : ziel === "denken" ? 0.15 : 0, dt, 5);
    weich("browDownLeft", ziel === "warnung" ? 0.3 : 0, dt, 5); weich("browDownRight", ziel === "warnung" ? 0.3 : 0, dt, 5);

    // ---------- Leuchten ----------
    const warnFarbe = new THREE.Color("#ffb547");
    for (const [m, basisI, basisF] of leucht) {
      m.emissiveIntensity = basisI * (licht + pegel * 0.9 + (ziel === "denken" ? 0.15 * Math.sin(t * 6) : 0));
      m.emissive.copy(basisF).lerp(warnFarbe, warn);
    }

    // ---------- Kamera: sanft atmender Bildausschnitt ----------
    const d = kamera.userData.dist || 3;
    kamera.position.set(fokus.x + (ruhig ? 0 : rauschen(t * 0.1, 17) * d * 0.01), fokus.y + d * 0.04, fokus.z + d);
    kamera.lookAt(fokus);
    renderer.render(szene, kamera);
  }
  frame = requestAnimationFrame(zeichne);

  function clip(name) {
    const neu = aktionen[name] || null;
    if (neu === aktiverClip) return;
    if (aktiverClip) aktiverClip.fadeOut(0.6);
    if (neu) { neu.reset().setEffectiveWeight(0.85).fadeIn(0.6).play(); }
    aktiverClip = neu;
  }
  return {
    zustand(name) {
      if (!["ruhe", "zuhoeren", "denken", "sprechen", "warnung"].includes(name)) throw new RangeError("Unbekannter Zustand: " + name);
      if (name === ziel) return;
      vonLicht = licht; wechsel = performance.now(); ziel = name;
      if (name === "sprechen" && folge.length && !folgeStart) folgeStart = performance.now();
      clip({ zuhoeren: "zuhoeren", denken: "denken", sprechen: "sprechen_gesten", warnung: "warnung" }[name]);
      if (name !== "sprechen" && folgeStart) folge = [];
    },
    pegel(w) { if (Number.isFinite(w)) { roh = Math.max(0, Math.min(1, w)); letzterPegel = performance.now(); } },
    viseme(name) { visemDirekt = VIS_MIX[name] ? name : null; visemDirektBis = performance.now() + 160; },
    // Text kommt meist kurz bevor die Stimme startet: Lautfolge beginnt mit dem Zustand „sprechen“
    text(satz, msJeZeichen = 74) {
      const neu = laute(satz); folgeRate = msJeZeichen;
      if (folge.length && folgeStart) { folge = folge.concat(["sil", "sil", "sil"], neu); return; }   // nächster Satz reiht sich ein
      if (folge.length && !folgeStart) { folge = folge.concat(["sil", "sil", "sil"], neu); return; }
      folge = neu; folgeStart = ziel === "sprechen" ? performance.now() : 0;
    },
    farbe() {},
    drehen(grad = 360) { drehVon = drehung; drehZiel = drehung + grad * GRAD; drehStart = performance.now(); },
    info() { return { geladen: !!geladen, formen: formen.size, knochen: Object.keys(knochen), clips: Object.keys(aktionen) }; },
    entfernen() {
      weg = true; cancelAnimationFrame(frame); ro.disconnect(); removeEventListener("pointermove", onMaus);
      szene.traverse((o) => { o.geometry?.dispose?.(); for (const m of [].concat(o.material || [])) { for (const v of Object.values(m)) v?.isTexture && v.dispose(); m.dispose?.(); } });
      umgebung.dispose(); pmrem.dispose(); ktx2.dispose(); renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove();
    },
  };
}
