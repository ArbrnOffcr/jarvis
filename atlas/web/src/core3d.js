/* JARVIS – 3D-Kern (Three.js). Vier Stilwelten, Zustände, Datenströme, Archiv-Netz.
   Quelle: atlas/web/src/core3d.js → gebündelt nach atlas/web/core3d.bundle.js */
import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

// ---------------------------------------------------------------- Grundlagen
const NOISE = /* glsl */ `
vec3 mod289(vec3 x){return x-floor(x*(1./289.))*289.;}
vec4 mod289(vec4 x){return x-floor(x*(1./289.))*289.;}
vec4 permute(vec4 x){return mod289(((x*34.)+1.)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1./6.,1./3.);const vec4 D=vec4(0.,.5,1.,2.);
  vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.-g;vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.,i1.z,i2.z,1.))+i.y+vec4(0.,i1.y,i2.y,1.))+i.x+vec4(0.,i1.x,i2.x,1.));
  float n_=.142857142857;vec3 ns=n_*D.wyz-D.xzx;vec4 j=p-49.*floor(p*ns.z*ns.z);
  vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.*x_);vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;
  vec4 h=1.-abs(x)-abs(y);vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.+1.;vec4 s1=floor(b1)*2.+1.;vec4 sh=-step(h,vec4(0.));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.);m=m*m;
  return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));}`;

const PR = { value: 1 };              // Pixeldichte (für Punktgrößen), gemeinsam für alle Shader

const STATES = {
  idle: { e: 0.15, s: 0.25 }, think: { e: 0.75, s: 0.9 }, tool: { e: 0.9, s: 0.7 },
  speak: { e: 0.5, s: 0.35 }, listen: { e: 0.45, s: 0.3 }, ask: { e: 0.65, s: 0.12 },
  error: { e: 0.4, s: 0.08 }, off: { e: 0.0, s: 0.04 },
};

// Stilwelten: Farben (Grund, heiß, Freigabe, Fehler, Zuhören), Bloom
const THEMES = {
  holo:      { name: "HOLOGRAFISCH", base: 0x00e5ff, hot: 0xe6ffff, bloom: [1.15, 0.55, 0.08] },
  organisch: { name: "ORGANISCH",    base: 0x8b6cff, hot: 0x5ef2d6, bloom: [1.35, 0.7, 0.05] },
  taktisch:  { name: "TAKTISCH",     base: 0xffb547, hot: 0xfff1c9, bloom: [0.85, 0.45, 0.12] },
  minimal:   { name: "MINIMAL",      base: 0xdfeeff, hot: 0xffffff, bloom: [0.55, 0.35, 0.2] },
  plexus:    { name: "PLEXUS",       base: 0x2fa8ff, hot: 0xd6f3ff, bloom: [1.25, 0.65, 0.04] },
};
const STATE_TINT = { ask: 0xffb547, error: 0xff5468, listen: 0x3ddc97, off: 0x5a7f8e };

// Werkzeug → Sektor (Winkel in Grad, 0 = rechts, gegen den Uhrzeigersinn)
// [Muster, Winkel, Beschriftung, Farbakzent]
const SECTORS = [
  [/kalender|wochenplan/, 35, "KALENDER", 0x4da3ff], [/erinner/, 65, "ERINNERUNGEN", 0x5ec8ff],
  [/notiz/, 95, "NOTIZEN", 0x7fd6ff], [/kontakt|geburtstag/, 125, "KONTAKTE", 0x8fd0ff],
  [/frist|vergessen/, 140, "FRISTEN", 0xff5468], [/post|brief/, 165, "POST", 0xffb547],
  [/mail|schreibstil/, 155, "MAIL", 0xffc56b], [/steuer|vertrag|beihilfe/, 190, "FINANZEN", 0xf2d16b],
  [/archiv|datei|dokument/, 205, "ARCHIV", 0x3ddc97], [/youtube|video/, 230, "VIDEO", 0xb38cff],
  [/web|recherche/, 245, "WEB", 0x9d8cff], [/word|excel|pptx|office/, 285, "OFFICE", 0x5ee6c8],
  [/wetter/, 325, "WETTER", 0x9fe8ff], [/gedaechtnis|vorgang/, 5, "GEDÄCHTNIS", 0xc9a8ff],
  [/bild|skizze/, 90, "BILD", 0x7ff3ff], [/anzeige/, 180, "ANSICHT", 0x7ff3ff],
];

// ---------------------------------------------------------------- Bausteine
function fibSphere(n, r = 1) {
  const a = new Float32Array(n * 3), seed = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2, rr = Math.sqrt(1 - y * y), th = i * 2.399963229728653;
    a.set([Math.cos(th) * rr * r, y * r, Math.sin(th) * rr * r], i * 3); seed[i] = Math.random();
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(a, 3));
  g.setAttribute("seed", new THREE.BufferAttribute(seed, 1));
  return g;
}

function shared(u) {           // gemeinsame Uniforms je Stilwelt
  return Object.assign(u, {
    uTime: { value: 0 }, uEnergy: { value: 0.15 }, uLevel: { value: 0 },
    uColor: { value: new THREE.Color() }, uHot: { value: new THREE.Color() }, uPR: PR,
  });
}

function pointsMat(u, vertex, fragment) {
  return new THREE.ShaderMaterial({
    uniforms: u, vertexShader: vertex, fragmentShader: fragment,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
}

function ring(radius, tube, color, opacity) {
  const m = new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 8, 256),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false }));
  return m;
}

function circleLine(radius, segs, color, opacity, dashed = false) {
  const pts = [];
  for (let i = 0; i <= segs; i++) { const a = (i / segs) * Math.PI * 2; pts.push(new THREE.Vector3(Math.cos(a) * radius, Math.sin(a) * radius, 0)); }
  const g = new THREE.BufferGeometry().setFromPoints(pts);
  const mat = dashed
    ? new THREE.LineDashedMaterial({ color, transparent: true, opacity, dashSize: 0.06, gapSize: 0.05, blending: THREE.AdditiveBlending, depthWrite: false })
    : new THREE.LineBasicMaterial({ color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false });
  const l = new THREE.Line(g, mat); if (dashed) l.computeLineDistances(); return l;
}

const SPHERE_PTS_V = /* glsl */ `
  uniform float uTime, uEnergy, uLevel, uSize, uPR; attribute float seed; varying float vDepth; varying float vScan;
  ${NOISE}
  void main(){
    vec3 p = position;
    float n = snoise(p*1.8 + vec3(0., uTime*.35, 0.));
    p *= 1. + n*(.035 + uEnergy*.06) + uLevel*.08*sin(seed*40. + uTime*2.2);
    vec4 mv = modelViewMatrix*vec4(p,1.); gl_Position = projectionMatrix*mv;
    vec3 wn = normalize((modelMatrix*vec4(position,0.)).xyz);
    vDepth = clamp(dot(wn, vec3(0.,0.,1.))*.5+.5, 0., 1.);
    float band = sin(uTime*(.55+uEnergy)); vScan = smoothstep(.12, 0., abs(position.y - band))*uEnergy;
    gl_PointSize = uSize * (0.5 + vDepth*1.4 + vScan*2.) * uPR * (7./-mv.z);
  }`;
const SPHERE_PTS_F = /* glsl */ `
  uniform vec3 uColor, uHot; varying float vDepth; varying float vScan;
  void main(){
    float d = length(gl_PointCoord-.5); if(d>.5) discard;
    float a = smoothstep(.5,.0,d);
    vec3 c = mix(uColor*.35, mix(uColor, uHot, .35), vDepth); c = mix(c, uHot, vScan);
    gl_FragColor = vec4(c, a*(.12 + vDepth*.8 + vScan));
  }`;

const GLOW_V = /* glsl */ `varying vec3 vN; varying vec3 vV;
  void main(){ vN = normalize(normalMatrix*normal); vec4 mv = modelViewMatrix*vec4(position,1.); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }`;
const GLOW_F = /* glsl */ `uniform vec3 uColor, uHot; uniform float uEnergy, uLevel, uTime, uPow, uInner; varying vec3 vN; varying vec3 vV;
  void main(){ float f = pow(1. - abs(dot(vN, vV)), uPow);
    float core = uInner*pow(abs(dot(vN, vV)), 3.)*(.6+uEnergy*.8+uLevel);
    vec3 c = uColor*f*(1.+uEnergy) + uHot*core; gl_FragColor = vec4(c, clamp(f+core, 0., 1.)); }`;

// ---------------------------------------------------------------- Stilwelten
const BUILD = {
  holo(u) {
    const g = new THREE.Group();
    u.uSize = { value: 2.2 };
    const pts = new THREE.Points(fibSphere(26000), pointsMat(u, SPHERE_PTS_V, SPHERE_PTS_F)); g.add(pts);
    const inner = new THREE.Mesh(new THREE.SphereGeometry(0.55, 64, 64), new THREE.ShaderMaterial({
      uniforms: Object.assign({}, u, { uPow: { value: 1.2 }, uInner: { value: 1.6 } }), vertexShader: GLOW_V, fragmentShader: GLOW_F,
      transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); g.add(inner);
    const shell = new THREE.Mesh(new THREE.SphereGeometry(1.08, 64, 64), new THREE.ShaderMaterial({
      uniforms: Object.assign({}, u, { uPow: { value: 3.2 }, uInner: { value: 0 } }), vertexShader: GLOW_V, fragmentShader: GLOW_F,
      transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.FrontSide })); g.add(shell);
    const rings = [[1.42, .006, .55, [1.2, .3, 0]], [1.6, .003, .35, [-.5, 1, .2]], [1.78, .004, .4, [.25, -1.1, .6]]]
      .map(([r, t, o, rot]) => { const m = ring(r, t, 0xffffff, o); m.rotation.set(...rot); g.add(m); return m; });
    const dash = circleLine(2.05, 256, 0xffffff, .25, true); g.add(dash);
    return { group: g, update(t, dt, st) {
      pts.rotation.y += dt * st.s * .5; pts.rotation.x = .35 + Math.sin(t * .2) * .06;
      rings.forEach((r, i) => { r.rotation.z += dt * (.2 + i * .12) * (i % 2 ? -1 : 1) * (.5 + st.e); r.material.color.copy(u.uColor.value); });
      dash.rotation.z -= dt * .05; dash.material.color.copy(u.uColor.value);
    } };
  },

  organisch(u) {
    const g = new THREE.Group();
    const blob = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 48), new THREE.ShaderMaterial({
      uniforms: u, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
      vertexShader: `uniform float uTime, uEnergy, uLevel; varying vec3 vN; varying vec3 vV; varying float vD; ${NOISE}
        void main(){ float n = snoise(normal*1.3 + uTime*(.25+uEnergy*.5));
          float n2 = snoise(normal*3.5 - uTime*.4)*.35;
          float d = (n + n2)*(.16 + uEnergy*.14 + uLevel*.22); vD = d;
          vec3 p = position + normal*d; vN = normalize(normalMatrix*normal);
          vec4 mv = modelViewMatrix*vec4(p,1.); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }`,
      fragmentShader: `uniform vec3 uColor, uHot; uniform float uEnergy, uTime; varying vec3 vN; varying vec3 vV; varying float vD;
        void main(){ float f = pow(1. - abs(dot(vN, vV)), 2.2);
          vec3 c = mix(uColor, uHot, clamp(vD*2.+.5 + sin(uTime*.7)*.2, 0., 1.));
          gl_FragColor = vec4(c*(f*1.6 + .08 + uEnergy*.25), f*.9 + .05); }` }));
    g.add(blob);
    const n = 14000, pos = new Float32Array(n * 3), seed = new Float32Array(n);
    for (let i = 0; i < n; i++) { const r = 1.3 + Math.random() * 1.2, a = Math.random() * 6.283, b = Math.acos(Math.random() * 2 - 1);
      pos.set([r * Math.sin(b) * Math.cos(a), r * Math.cos(b) * .55, r * Math.sin(b) * Math.sin(a)], i * 3); seed[i] = Math.random(); }
    const cg = new THREE.BufferGeometry(); cg.setAttribute("position", new THREE.BufferAttribute(pos, 3)); cg.setAttribute("seed", new THREE.BufferAttribute(seed, 1));
    const cloud = new THREE.Points(cg, pointsMat(u,
      `uniform float uTime, uEnergy, uLevel, uPR; attribute float seed; varying float vA; ${NOISE}
       void main(){ vec3 p = position; float a = uTime*(.08 + seed*.12)*(1.+uEnergy*2.);
         p.xz = mat2(cos(a),-sin(a),sin(a),cos(a))*p.xz;
         p += vec3(snoise(p*.7+uTime*.1), snoise(p*.7+7.+uTime*.1), snoise(p*.7+13.))*.18*(1.+uEnergy);
         p *= 1. + uLevel*.15;
         vec4 mv = modelViewMatrix*vec4(p,1.); gl_Position = projectionMatrix*mv;
         vA = .25 + .75*fract(seed*7.3 + uTime*.2); gl_PointSize = (1. + seed*2.)*uPR*(8./-mv.z); }`,
      `uniform vec3 uColor, uHot; varying float vA; void main(){ float d = length(gl_PointCoord-.5); if(d>.5) discard;
         gl_FragColor = vec4(mix(uColor, uHot, vA), smoothstep(.5,0.,d)*vA*.55); }`));
    g.add(cloud);
    return { group: g, update(t, dt, st) { blob.rotation.y += dt * .15; blob.rotation.x = Math.sin(t * .15) * .3; } };
  },

  taktisch(u) {
    const g = new THREE.Group();
    const disc = new THREE.Mesh(new THREE.CircleGeometry(2.3, 128), new THREE.ShaderMaterial({
      uniforms: u, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      vertexShader: `varying vec2 vUv; void main(){ vUv = position.xy/2.3; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
      fragmentShader: `uniform vec3 uColor, uHot; uniform float uTime, uEnergy; varying vec2 vUv;
        void main(){ float r = length(vUv); if(r>1.) discard; float ang = atan(vUv.y, vUv.x);
          float rings = smoothstep(.012,.0,abs(fract(r*5.)-.5)*2.-.96+ .0) ;
          float ringl = 1.-smoothstep(0.,.008,abs(fract(r*5.+.0)-0.)) ;
          float rr = step(.985, fract(r*5.)) ;
          float spokes = step(.995, cos(ang*12.)) * step(.08, r);
          float grid = (step(.985, fract(vUv.x*10.)) + step(.985, fract(vUv.y*10.)))*.25;
          float sw = mod(ang - uTime*(1.2+uEnergy*2.), 6.2831853); float sweep = exp(-sw*2.2)*(1.-r*.2);
          float edge = smoothstep(.97,1.,r)*.8;
          float a = rr*.55 + spokes*.35 + grid*.35 + sweep*.85 + edge;
          vec3 c = mix(uColor, uHot, sweep*.6);
          gl_FragColor = vec4(c*a, a*.9); }` }));
    disc.rotation.x = -1.05; disc.position.y = -0.15; g.add(disc);
    // Ziele (Blips), die beim Überstreichen aufleuchten
    const nb = 40, bp = new Float32Array(nb * 3), bs = new Float32Array(nb);
    for (let i = 0; i < nb; i++) { const r = .4 + Math.random() * 1.75, a = Math.random() * 6.283; bp.set([Math.cos(a) * r, Math.sin(a) * r, 0.01], i * 3); bs[i] = a; }
    const bg = new THREE.BufferGeometry(); bg.setAttribute("position", new THREE.BufferAttribute(bp, 3)); bg.setAttribute("seed", new THREE.BufferAttribute(bs, 1));
    const blips = new THREE.Points(bg, pointsMat(u,
      `uniform float uTime, uEnergy, uPR; attribute float seed; varying float vA;
       void main(){ float ang = atan(position.y, position.x); float d = mod(ang - uTime*(1.2+uEnergy*2.), 6.2831853);
         vA = exp(-(6.2831853-d)*0.0)*exp(-d*.9); vec4 mv = modelViewMatrix*vec4(position,1.);
         gl_Position = projectionMatrix*mv; gl_PointSize = (3. + vA*7.)*uPR*(7./-mv.z); }`,
      `uniform vec3 uHot; varying float vA; void main(){ float d = length(gl_PointCoord-.5); if(d>.5) discard;
         gl_FragColor = vec4(uHot, smoothstep(.5,0.,d)*(.15+vA)); }`));
    disc.add(blips);
    // schwebender Kern: Ikosaeder-Gitter
    const ico = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(.62, 1)),
      new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: .9, blending: THREE.AdditiveBlending }));
    ico.position.y = .55; g.add(ico);
    const icoIn = new THREE.Mesh(new THREE.IcosahedronGeometry(.3, 0), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .35, blending: THREE.AdditiveBlending }));
    icoIn.position.y = .55; g.add(icoIn);
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(.01, .01, 1.4, 8), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .35, blending: THREE.AdditiveBlending }));
    beam.position.y = -.05; g.add(beam);
    return { group: g, update(t, dt, st) {
      ico.rotation.y += dt * (.3 + st.e * .8); ico.rotation.x += dt * .1;
      icoIn.rotation.y -= dt * (.6 + st.e * 1.2); const s = 1 + u.uLevel.value * .22 + Math.sin(t * 1.6) * .02 * (1 + st.e);
      ico.scale.setScalar(s); icoIn.scale.setScalar(s);
      [ico, icoIn, beam].forEach((o) => o.material.color.copy(u.uColor.value));
      ico.position.y = icoIn.position.y = .55 + Math.sin(t * .8) * .05;
    } };
  },

  minimal(u) {
    const g = new THREE.Group(), lines = [];
    const sphere = new THREE.Group(); g.add(sphere);
    for (let i = 1; i < 8; i++) { const lat = -1 + i / 4, r = Math.sqrt(1 - lat * lat);
      const c = circleLine(r, 128, 0xffffff, i === 4 ? .5 : .16); c.rotation.x = Math.PI / 2; c.position.y = lat; sphere.add(c); lines.push(c); }
    for (let i = 0; i < 10; i++) { const c = circleLine(1, 128, 0xffffff, .12); c.rotation.y = (i / 10) * Math.PI; sphere.add(c); lines.push(c); }
    const big = ring(1.75, .0025, 0xffffff, .6); big.rotation.x = 1.25; g.add(big);
    const big2 = ring(1.95, .0015, 0xffffff, .25); big2.rotation.x = 1.25; big2.rotation.y = .3; g.add(big2);
    const core = new THREE.Mesh(new THREE.SphereGeometry(.07, 32, 32), new THREE.MeshBasicMaterial({ color: 0xffffff })); g.add(core);
    const sat = new THREE.Mesh(new THREE.SphereGeometry(.025, 16, 16), new THREE.MeshBasicMaterial({ color: 0xffffff })); g.add(sat);
    u.uSize = { value: 1.4 };
    const dust = new THREE.Points(fibSphere(900, 2.6), pointsMat(u, SPHERE_PTS_V, SPHERE_PTS_F)); g.add(dust);
    return { group: g, update(t, dt, st) {
      sphere.rotation.y += dt * st.s * .4; sphere.rotation.x = .35;
      big.rotation.z += dt * .1 * (1 + st.e); big2.rotation.z -= dt * .06;
      const s = 1 + u.uLevel.value * 1.1 + st.e * .4 + Math.sin(t * 1.4) * .05; core.scale.setScalar(s);
      const a = t * (.6 + st.e); sat.position.set(Math.cos(a) * 1.75, Math.sin(a) * 1.75 * Math.cos(1.25), Math.sin(a) * 1.75 * Math.sin(1.25));
      [...lines, big, big2].forEach((l) => l.material.color.copy(u.uColor.value));
      core.material.color.copy(u.uHot.value); dust.rotation.y -= dt * .02;
    } };
  },
};

// ---------------------------------------------------------------- Plexus (reduzierte Ansicht)
// Knoten + Verbindungslinien + feine Facetten. Alle Teile verschieben ihre Punkte mit derselben
// Funktion move() im Shader, damit Linien und Flächen exakt an den Knoten hängen.
const PLEX_MOVE = /* glsl */ `
  uniform float uTime, uEnergy, uLevel, uExpand, uTwist, uPR;
  ${NOISE}
  vec3 move(vec3 p){
    float t = uTime;
    vec3 q = p + vec3(snoise(p*.8 + vec3(0., t*.13, 0.)), snoise(p*.8 + vec3(17., t*.13, 0.)),
                      snoise(p*.8 + vec3(31., 0., t*.13))) * (.09 + uEnergy*.13);
    // Sprechen: ungleichmäßiges Aufblühen im Takt der Stimme
    float burst = uLevel * .32 * (.45 + .55*(.5 + .5*snoise(normalize(q + 1e-4)*1.4 + t*.7)));
    q *= 1. + uExpand + burst;
    // Nachdenken: wirbelnde Verdrehung
    float a = uTwist * sin(t*1.25 + q.y*2.2) * .7;
    q.xz = mat2(cos(a), -sin(a), sin(a), cos(a)) * q.xz;
    return q;
  }`;

function plexusNodes(n) {
  const pos = [], dirs = [];
  const lobe = (d) => .86 + .14 * Math.sin(d.x * 3.1 + 1.3) * Math.cos(d.y * 2.7) + .1 * Math.sin(d.z * 4.3 + d.x * 2.0);
  for (let i = 0; i < n; i++) {
    const u = Math.random() * 2 - 1, th = Math.random() * Math.PI * 2, s = Math.sqrt(1 - u * u);
    const d = new THREE.Vector3(s * Math.cos(th), u, s * Math.sin(th)), k = Math.random();
    let r = k < .12 ? Math.random() * .38 : k < .82 ? .38 + Math.pow(Math.random(), .75) * .82 : 1.2 + Math.pow(Math.random(), 1.6) * .75;
    r *= lobe(d);
    pos.push(d.multiplyScalar(r)); dirs.push(Math.random());
  }
  return { pos, seed: dirs };
}

function plexusEdges(pos, k = 3, maxD = .4) {
  const n = pos.length, nb = Array.from({ length: n }, () => new Set()), edges = [];
  for (let i = 0; i < n; i++) {
    const best = [];
    for (let j = 0; j < n; j++) {
      if (i === j) continue; const d = pos[i].distanceToSquared(pos[j]);
      if (d > maxD * maxD) continue;
      if (best.length < k) { best.push([d, j]); best.sort((a, b) => a[0] - b[0]); }
      else if (d < best[k - 1][0]) { best[k - 1] = [d, j]; best.sort((a, b) => a[0] - b[0]); }
    }
    best.forEach(([, j]) => { if (!nb[i].has(j)) { nb[i].add(j); nb[j].add(i); edges.push([i, j]); } });
  }
  const tris = [];
  for (const [i, j] of edges) {
    for (const m of nb[i]) if (m !== j && nb[j].has(m) && m > j && Math.random() < .35) tris.push([i, j, m]);
    if (tris.length > 260) break;
  }
  return { edges, tris };
}

BUILD.plexus = function (u) {
  const g = new THREE.Group(), cloud = new THREE.Group(); g.add(cloud);
  Object.assign(u, { uExpand: { value: 0 }, uTwist: { value: 0 } });
  const { pos, seed } = plexusNodes(1500), { edges, tris } = plexusEdges(pos);

  // Knoten
  const pg = new THREE.BufferGeometry();
  pg.setAttribute("position", new THREE.BufferAttribute(new Float32Array(pos.flatMap((p) => [p.x, p.y, p.z])), 3));
  pg.setAttribute("seed", new THREE.BufferAttribute(new Float32Array(seed), 1));
  const nodes = new THREE.Points(pg, pointsMat(u,
    `attribute float seed; varying float vA; varying float vH; ${PLEX_MOVE}
     void main(){ vec3 p = move(position); vec4 mv = modelViewMatrix*vec4(p,1.); gl_Position = projectionMatrix*mv;
       float core = 1. - smoothstep(0., 1.25, length(position));
       float tw = .55 + .45*sin(uTime*(.8 + seed*2.6) + seed*40.);
       vA = (.3 + core*.7) * tw * (.65 + uEnergy*.6); vH = core;
       gl_PointSize = (1.1 + seed*seed*3.6) * (1. + uLevel*.18) * uPR * (7./-mv.z); }`,
    `uniform vec3 uColor, uHot; varying float vA; varying float vH;
     void main(){ float d = length(gl_PointCoord-.5); if(d>.5) discard;
       gl_FragColor = vec4(mix(uColor, uHot, vH*.75), smoothstep(.5, 0., d)*vA); }`));
  cloud.add(nodes);

  // Verbindungslinien – verblassen, wenn sie sich dehnen
  const lp = new Float32Array(edges.length * 6), lo = new Float32Array(edges.length * 6), ls = new Float32Array(edges.length * 2);
  edges.forEach(([i, j], e) => {
    const a = pos[i], b = pos[j];
    lp.set([a.x, a.y, a.z, b.x, b.y, b.z], e * 6); lo.set([b.x, b.y, b.z, a.x, a.y, a.z], e * 6);
    const s = Math.random(); ls[e * 2] = s; ls[e * 2 + 1] = s;
  });
  const lg = new THREE.BufferGeometry();
  lg.setAttribute("position", new THREE.BufferAttribute(lp, 3));
  lg.setAttribute("other", new THREE.BufferAttribute(lo, 3));
  lg.setAttribute("seed", new THREE.BufferAttribute(ls, 1));
  const lines = new THREE.LineSegments(lg, pointsMat(u,
    `attribute vec3 other; attribute float seed; varying float vA; varying float vH; ${PLEX_MOVE}
     void main(){ vec3 a = move(position), b = move(other); float L = distance(a, b);
       vec4 mv = modelViewMatrix*vec4(a,1.); gl_Position = projectionMatrix*mv;
       float core = 1. - smoothstep(0., 1.45, length(position)); vH = core;
       vA = smoothstep(.8, .18, L) * (.14 + core*.36) * (.7 + uEnergy*.9);
       vA *= .55 + .45*sin(uTime*(1.1 + seed*1.6) + seed*30.); }`,
    `uniform vec3 uColor, uHot; varying float vA; varying float vH;
     void main(){ gl_FragColor = vec4(mix(uColor, uHot, vH*.4), vA); }`));
  cloud.add(lines);

  // feine Facetten
  const tp = new Float32Array(tris.length * 9);
  tris.forEach((t, k) => t.forEach((i, m) => tp.set([pos[i].x, pos[i].y, pos[i].z], k * 9 + m * 3)));
  const tg = new THREE.BufferGeometry(); tg.setAttribute("position", new THREE.BufferAttribute(tp, 3));
  const facets = new THREE.Mesh(tg, new THREE.ShaderMaterial({ uniforms: u, transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    vertexShader: `varying float vA; ${PLEX_MOVE}
      void main(){ vec3 p = move(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(p,1.);
        vA = (.025 + uEnergy*.03 + uLevel*.012) * (1. - smoothstep(.4, 1.6, length(position))); }`,
    fragmentShader: `uniform vec3 uColor; varying float vA; void main(){ gl_FragColor = vec4(uColor, vA); }` }));
  cloud.add(facets);

  // heller Kern: weicher Lichtpunkt (Billboard), kein harter Kugelrand
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 2.4), new THREE.ShaderMaterial({
    uniforms: u, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv - .5; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: `uniform vec3 uColor, uHot; uniform float uEnergy, uLevel, uTime; varying vec2 vUv;
      void main(){ float r = length(vUv)*2.;
        float core = exp(-r*r*55.)*(1.1 + uLevel*.25);
        float halo = exp(-r*r*9.)*(.32 + uEnergy*.2 + uLevel*.16);
        float wide = exp(-r*r*2.6)*.08*(1. + uLevel*.3);
        vec3 c = uHot*core + mix(uColor, uHot, .3)*halo + uColor*wide;
        gl_FragColor = vec4(c, clamp(core + halo + wide, 0., 1.)); }` }));
  g.add(glow);

  // Staub in der Ferne
  const n = 700, dp = new Float32Array(n * 3), ds = new Float32Array(n);
  for (let i = 0; i < n; i++) { const r = 2.4 + Math.random() * 3.2, a = Math.random() * 6.283, b = Math.acos(Math.random() * 2 - 1);
    dp.set([r * Math.sin(b) * Math.cos(a), r * Math.cos(b), r * Math.sin(b) * Math.sin(a)], i * 3); ds[i] = Math.random(); }
  const dg = new THREE.BufferGeometry(); dg.setAttribute("position", new THREE.BufferAttribute(dp, 3)); dg.setAttribute("seed", new THREE.BufferAttribute(ds, 1));
  const dust = new THREE.Points(dg, pointsMat(u,
    `uniform float uTime, uPR, uLevel; attribute float seed; varying float vA;
     void main(){ vec3 p = position*(1. + uLevel*.06); vec4 mv = modelViewMatrix*vec4(p,1.); gl_Position = projectionMatrix*mv;
       vA = .12 + .3*(.5 + .5*sin(uTime*(.4 + seed) + seed*50.)); gl_PointSize = (.8 + seed*1.6)*uPR*(7./-mv.z); }`,
    `uniform vec3 uColor; varying float vA; void main(){ float d = length(gl_PointCoord-.5); if(d>.5) discard;
       gl_FragColor = vec4(uColor, smoothstep(.5,0.,d)*vA); }`));
  g.add(dust);

  const TARGET = { idle: [0, 0], listen: [-.16, 0], think: [.04, .55], tool: [.12, .3], speak: [.07, 0],
    ask: [0, .12], error: [-.06, 0], off: [-.3, 0] };
  return {
    group: g,
    update(t, dt, st, state) {
      const [ex, tw] = TARGET[state] || TARGET.idle, k = Math.min(1, dt * 2.5);
      u.uExpand.value += (ex + Math.sin(t * .9) * .02 - u.uExpand.value) * k;
      u.uTwist.value += (tw - u.uTwist.value) * k;
      cloud.rotation.y += dt * (.05 + st.s * .32); cloud.rotation.x = Math.sin(t * .13) * .22;
      dust.rotation.y -= dt * .012;
      glow.scale.setScalar(.9 + u.uLevel.value * .14 + st.e * .08 + Math.sin(t * 1.4) * .02);
    },
    zoom(state) { return state === "speak" ? .82 : state === "listen" ? .92 : state === "think" || state === "tool" ? .95 : 1; },
  };
};

// ---------------------------------------------------------------- Datenströme
class Streams {
  constructor(scene) {
    this.N = 6000; this.pos = new Float32Array(this.N * 3); this.data = [];
    this.alpha = new Float32Array(this.N);
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(this.pos, 3));
    g.setAttribute("alpha", new THREE.BufferAttribute(this.alpha, 1));
    this.u = { uColor: { value: new THREE.Color(0xffffff) }, uPR: PR };
    this.points = new THREE.Points(g, new THREE.ShaderMaterial({
      uniforms: this.u, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: `uniform float uPR; attribute float alpha; varying float vA; void main(){ vA = alpha; vec4 mv = modelViewMatrix*vec4(position,1.); gl_Position = projectionMatrix*mv; gl_PointSize = (2.+alpha*4.)*uPR*(7./-mv.z); }`,
      fragmentShader: `uniform vec3 uColor; varying float vA; void main(){ float d = length(gl_PointCoord-.5); if(d>.5) discard; gl_FragColor = vec4(uColor, smoothstep(.5,0.,d)*vA); }`,
    }));
    this.points.frustumCulled = false; scene.add(this.points); this.next = 0;
  }
  spawn(angleDeg, count = 220) {
    const a = (angleDeg * Math.PI) / 180, R = 4.6;
    const start = new THREE.Vector3(Math.cos(a) * R, Math.sin(a) * R * .62, .4);
    const ctrl = new THREE.Vector3(Math.cos(a + .6) * 2.4, Math.sin(a + .6) * 1.6, 1.2);
    for (let i = 0; i < count; i++) {
      const k = this.next; this.next = (this.next + 1) % this.N;
      this.data[k] = { t: -i * 0.006 - Math.random() * .05, start, ctrl, off: new THREE.Vector3((Math.random() - .5) * .14, (Math.random() - .5) * .14, (Math.random() - .5) * .14), sp: .55 + Math.random() * .25 };
    }
  }
  update(dt) {
    const p = new THREE.Vector3(), q = new THREE.Vector3();
    for (let k = 0; k < this.N; k++) {
      const d = this.data[k];
      if (!d) { this.alpha[k] = 0; continue; }
      d.t += dt * d.sp;
      if (d.t > 1) { this.data[k] = null; this.alpha[k] = 0; continue; }
      const t = Math.max(0, d.t), it = 1 - t;     // quadratische Bezierkurve zum Kern
      p.copy(d.start).multiplyScalar(it * it).add(q.copy(d.ctrl).multiplyScalar(2 * it * t)).addScaledVector(d.off, it);
      this.pos.set([p.x, p.y, p.z], k * 3);
      this.alpha[k] = d.t < 0 ? 0 : Math.sin(t * Math.PI) * .9;
    }
    this.points.geometry.attributes.position.needsUpdate = true;
    this.points.geometry.attributes.alpha.needsUpdate = true;
  }
}

// ---------------------------------------------------------------- Wellenringe
// Sprechen: weiche Ringe laufen nach außen. Zuhören: Ringe ziehen sich zum Kern zusammen.
class Ripples {
  constructor(scene) {
    this.group = new THREE.Group(); scene.add(this.group); this.pool = []; this.last = 0;
    for (let i = 0; i < 10; i++) {
      const l = circleLine(1, 160, 0xffffff, 0); l.visible = false; this.group.add(l);
      this.pool.push({ l, t: 1, rein: false });
    }
  }
  spawn(color, rein = false) {
    const r = this.pool.find((x) => x.t >= 1); if (!r) return;
    r.t = 0; r.rein = rein; r.l.visible = true; r.l.material.color.copy(color);
  }
  update(dt) {
    for (const r of this.pool) {
      if (r.t >= 1) { r.l.visible = false; continue; }
      r.t = Math.min(1, r.t + dt / (r.rein ? 1.3 : 1.9));
      const p = r.t, e = 1 - Math.pow(1 - p, 2);
      const s = r.rein ? 2.3 - e * 1.25 : 1.05 + e * 1.45;
      r.l.scale.setScalar(s);
      r.l.material.opacity = (r.rein ? Math.sin(p * Math.PI) * .26 : Math.pow(1 - p, 1.8) * .28);
    }
  }
}

// ---------------------------------------------------------------- Orbit: die nächsten 7 Tage
// Termine, Fälliges und Fristen kreisen als Lichtpunkte um den Kern – je dringender, desto näher
// und heller. Über den Punkten liegen unsichtbare Knöpfe (DOM) zum Anklicken.
const ORBIT_FARBE = { termin: 0x4da3ff, faellig: 0xffb547, frist: 0xff5468, geburtstag: 0xff8fd0 };
class Orbit {
  constructor(core) {
    this.core = core; this.items = []; this.group = new THREE.Group(); core.scene.add(this.group);
    this.group.rotation.x = .38; this.points = null; this.hits = [];
    this.host = document.createElement("div"); this.host.className = "orbit-hits";
    core.canvas.parentElement?.appendChild(this.host);
    this.v = new THREE.Vector3(); this.sichtbar = 1;
  }
  set(items) {
    this.items = (items || []).slice(0, 36);
    if (this.points) { this.group.remove(this.points); this.points.geometry.dispose(); this.points.material.dispose(); }
    this.host.innerHTML = ""; this.hits = [];
    const n = this.items.length; if (!n) { this.points = null; return; }
    const pos = new Float32Array(n * 3), col = new Float32Array(n * 3), gr = new Float32Array(n), ph = new Float32Array(n);
    this.items.forEach((it, i) => {
      const t = Math.max(0, Math.min(7, it.tage ?? 7)), r = 1.85 + t * .19;
      const a = (i / n) * Math.PI * 2 + (it.tage || 0) * .7;
      it._r = r; it._a = a; it._y = ((i % 3) - 1) * .06;
      pos.set([Math.cos(a) * r, it._y, Math.sin(a) * r], i * 3);
      const c = new THREE.Color(ORBIT_FARBE[it.typ] || 0x7ff3ff); col.set([c.r, c.g, c.b], i * 3);
      gr[i] = 1.25 - t * .1; ph[i] = Math.random() * 6.28;
      const b = document.createElement("button"); b.type = "button"; b.className = `orbit-hit ${it.typ || ""}`;
      b.setAttribute("aria-label", it.titel); b.dataset.i = i;
      b.innerHTML = `<span>${(it.titel || "").replace(/[<>&]/g, "")}</span>`;
      b.addEventListener("click", (e) => { e.stopPropagation(); window.dispatchEvent(new CustomEvent("jarvis-orbit-klick", { detail: it })); });
      this.host.appendChild(b); this.hits.push(b);
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    g.setAttribute("gr", new THREE.BufferAttribute(gr, 1)); g.setAttribute("ph", new THREE.BufferAttribute(ph, 1));
    this.u = { uTime: { value: 0 }, uPR: PR, uSicht: { value: 1 } };
    this.points = new THREE.Points(g, new THREE.ShaderMaterial({ uniforms: this.u, transparent: true, depthWrite: false,
      blending: THREE.AdditiveBlending, vertexColors: true,
      vertexShader: `attribute float gr; attribute float ph; uniform float uTime, uPR, uSicht; varying vec3 vC; varying float vA;
        void main(){ vC = color; vec4 mv = modelViewMatrix*vec4(position,1.); gl_Position = projectionMatrix*mv;
          float puls = .75 + .25*sin(uTime*(1.2 + gr) + ph);
          vA = uSicht * clamp(gr, .45, 1.25) * puls; gl_PointSize = (11. + gr*10.)*uPR*(7./-mv.z); }`,
      fragmentShader: `varying vec3 vC; varying float vA; void main(){ float d = length(gl_PointCoord-.5); if(d>.5) discard;
        float k = smoothstep(.5, 0., d); float kern = smoothstep(.16, 0., d);
        gl_FragColor = vec4(vC*(.7 + k*.6) + vec3(kern*.6), (k*k*.85 + kern)*vA); }` }));
    this.group.add(this.points);
    if (!this.ringe) {                       // feine Umlaufbahnen als Orientierung
      this.ringe = [1.85, 2.52, 3.2].map((r) => { const l = circleLine(r, 220, 0x7ff3ff, .06); l.rotation.x = Math.PI / 2; this.group.add(l); return l; });
    }
  }
  update(dt, t, fokus) {
    if (!this.points) return;
    this.group.rotation.y += dt * .045;
    this.sichtbar += ((fokus > .3 ? 0 : 1) - this.sichtbar) * Math.min(1, dt * 3);
    this.u.uTime.value = t; this.u.uSicht.value = this.sichtbar;
    this.ringe?.forEach((l) => { l.material.opacity = .06 * this.sichtbar; });
    const w = this.core.canvas.clientWidth, h = this.core.canvas.clientHeight;
    this.host.style.display = this.sichtbar < .2 ? "none" : "";
    const pos = this.points.geometry.attributes.position.array;
    this.group.updateMatrixWorld();
    for (let i = 0; i < this.hits.length; i++) {
      this.v.set(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]).applyMatrix4(this.group.matrixWorld);
      const hinten = this.v.z < -.4;
      this.v.project(this.core.camera);
      const b = this.hits[i];
      b.style.transform = `translate(${((this.v.x + 1) / 2 * w).toFixed(1)}px, ${((1 - this.v.y) / 2 * h).toFixed(1)}px)`;
      b.classList.toggle("hinten", hinten);
    }
  }
}

// Archiv-Netz: Dokumentknoten leuchten nacheinander auf
class Net {
  constructor(scene) { this.scene = scene; this.obj = null; this.t = 0; }
  fire(color) {
    this.clear();
    const n = 42, pts = [];
    for (let i = 0; i < n; i++) { const r = 2.1 + Math.random() * .9, a = Math.random() * 6.283, b = (Math.random() - .5) * 1.6;
      pts.push(new THREE.Vector3(Math.cos(a) * r, b, Math.sin(a) * r)); }
    const seg = [];
    pts.forEach((p, i) => { pts.map((q, j) => [p.distanceTo(q), j]).sort((x, y) => x[0] - y[0]).slice(1, 3)
      .forEach(([, j]) => { if (j > i) seg.push(p, pts[j]); }); });
    const g = new THREE.Group();
    this.lines = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(seg),
      new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
    const pg = new THREE.BufferGeometry().setFromPoints(pts);
    pg.setAttribute("ord", new THREE.BufferAttribute(new Float32Array(pts.map(() => Math.random())), 1));
    this.u = { uT: { value: 0 }, uColor: { value: new THREE.Color(color) }, uPR: PR };
    this.nodes = new THREE.Points(pg, new THREE.ShaderMaterial({ uniforms: this.u, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: `attribute float ord; uniform float uT, uPR; varying float vA; void main(){ vA = smoothstep(ord, ord+.08, uT) * (1. - smoothstep(1.4, 2., uT)); vec4 mv = modelViewMatrix*vec4(position,1.); gl_Position = projectionMatrix*mv; gl_PointSize = (4.+vA*6.)*uPR*(7./-mv.z); }`,
      fragmentShader: `uniform vec3 uColor; varying float vA; void main(){ float d = length(gl_PointCoord-.5); if(d>.5) discard; gl_FragColor = vec4(uColor, smoothstep(.5,0.,d)*vA); }` }));
    g.add(this.lines, this.nodes); this.obj = g; this.scene.add(g); this.t = 0;
  }
  clear() { if (this.obj) { this.scene.remove(this.obj); this.obj.traverse((o) => { o.geometry?.dispose(); o.material?.dispose(); }); this.obj = null; } }
  update(dt) {
    if (!this.obj) return; this.t += dt * .55; this.u.uT.value = this.t;
    this.lines.material.opacity = Math.min(.35, this.t * .4) * (1 - Math.min(1, Math.max(0, this.t - 1.4) / .6));
    this.obj.rotation.y += dt * .15; if (this.t > 2.1) this.clear();
  }
}

// ---------------------------------------------------------------- Bilder (Fotos aus dem Netz)
// Ein Foto entsteht aus Lichtpunkten, die aus dem Kern fliegen und sich zum Bild ordnen;
// danach blendet das echte Foto fleckig-weich darüber ein. Beim Schließen zerfällt es zurück.
const RAND_MASKE = /* glsl */ `
  uniform float uKante;                         // ab wo die Kante ausläuft (Foto .86, Dokument .97)
  float randMaske(vec2 uv, float t){            // weiche, leicht unregelmäßige Bildkante
    vec2 c = abs(uv - .5)*2.;
    float pw = uKante > .9 ? 14. : 6.;
    float d = pow(pow(c.x, pw) + pow(c.y, pw), 1./pw);
    float wob = snoise(vec3(uv*2.5, t*.15))*.012*(1. - step(.9, uKante));
    return 1. - smoothstep(uKante + wob, 1.0, d);
  }`;
const PIX_V = /* glsl */ `
  attribute vec3 start; attribute vec2 puv; attribute vec3 ctrl; attribute vec3 col; attribute float delay;
  uniform float uT, uOut, uReveal, uCell, uProj, uTime; varying vec3 vCol; varying float vA;
  ${NOISE}
  ${RAND_MASKE}
  vec3 bez(vec3 a, vec3 b, vec3 c, float k){ float i = 1. - k; return a*i*i + b*2.*i*k + c*k*k; }
  void main(){
    float k = smoothstep(0., 1., clamp((uT - delay) / 1.05, 0., 1.));
    vec3 p = bez(start, ctrl, position, k);
    p += vec3(snoise(position*2. + uTime*.5), snoise(position*2. + 9. + uTime*.5), 0.) * .05 * (1. - k);
    float o = smoothstep(0., 1., clamp((uOut - delay*.8) / .9, 0., 1.));      // Zerfall zurück zum Kern
    p = mix(p, bez(position, ctrl + vec3(0., 0., .6), start, o), step(.001, uOut));
    vec4 mv = modelViewMatrix*vec4(p, 1.); gl_Position = projectionMatrix*mv;
    float lum = dot(col, vec3(.299, .587, .114));
    vCol = col;
    float sicht = smoothstep(.0, .15, k) * (1. - smoothstep(.75, 1., o));
    float rm = randMaske(puv, uTime);
    vA = sicht * mix(1., .03 + lum*.06, uReveal) * mix(pow(rm, .6), 1., o);
    gl_PointSize = uCell * uProj / -mv.z * mix(2.2, 1.25, k) * (1. + o*.8);
  }`;
const PIX_F = /* glsl */ `
  uniform vec3 uColor; uniform float uT, uReveal; varying vec3 vCol; varying float vA;
  void main(){ float d = length(gl_PointCoord - .5); if (d > .5) discard;
    vec3 c = mix(uColor, vCol, smoothstep(.35, 1.1, uT)) * 1.1;
    gl_FragColor = vec4(c, smoothstep(.5, .1, d) * vA); }`;
const FOTO_F = /* glsl */ `
  uniform sampler2D uMap; uniform vec3 uColor; uniform float uReveal, uTime, uAspect; varying vec2 vUv;
  ${NOISE}
  ${RAND_MASKE}
  void main(){
    vec3 c = texture2D(uMap, vUv).rgb;
    float n = snoise(vec3(vUv*vec2(uAspect, 1.)*3.2, uTime*.15))*.5 + .5;     // fleckiges Einblenden
    float m = smoothstep(n - .12, n + .12, uReveal*1.3 - .15);
    float edge = randMaske(vUv, uTime);                                       // weich auslaufende Ränder
    float rand = 1. - smoothstep(.0, .9, edge);
    c = mix(c, uColor*dot(c, vec3(.33)), rand*.5);                            // Ränder in Kernfarbe getönt
    float scan = smoothstep(.02, 0., abs(vUv.y - fract(uTime*.35)))*(1. - uReveal)*.6;
    c += uColor*scan;
    float glimm = smoothstep(.0, .25, abs(m - .5) < .12 ? 1. : 0.)*(1. - uReveal)*.4;
    c += uColor*glimm;
    gl_FragColor = vec4(c, m*edge);
  }`;

class Gallery {
  constructor(core) {
    this.core = core; this.overlay = new THREE.Scene(); this.items = []; this.aktiv = false; this.t = 0; this.out = 0;
  }
  sichtbar() {
    const c = this.core.camera, h = 2 * this.core.camBase * Math.tan(THREE.MathUtils.degToRad(c.fov / 2));
    return { h, w: h * c.aspect };
  }
  async show(d) {
    const bilder = (d?.bilder || []).slice(0, 3); if (!bilder.length) return;
    if (this.items.length) this.clear();
    const token = (this.token = Symbol());
    const imgs = await Promise.all(bilder.map((b) => new Promise((res) => {
      const im = new Image(); im.decoding = "async"; im.onload = () => res(im); im.onerror = () => res(null); im.src = b.src;
    })));
    if (token !== this.token) return;                       // inzwischen ersetzt
    const ok = imgs.map((im, i) => im && { im, meta: bilder[i] }).filter(Boolean); if (!ok.length) return;
    const { h, w } = this.sichtbar(), gap = .18;
    const asp = ok.map(({ im }) => im.naturalWidth / im.naturalHeight);
    const dok = ok.some((o) => o.meta.pfad);                 // Dokumente: mehr Höhe zum Lesen
    const hh = Math.min(h * (dok ? .6 : .5), (w * .8 - gap * (ok.length - 1)) / asp.reduce((a, b) => a + b, 0));
    const cy = dok ? -.16 : -.08 - (h * .5 - hh) * .06;
    let x = -(asp.reduce((a, b) => a + b * hh, 0) + gap * (ok.length - 1)) / 2;
    const q = this.core.quality, N = (q === "niedrig" ? 5000 : q === "mittel" ? 9000 : 14000) / ok.length;
    const orb = new THREE.Vector3(0, 0, 0);
    ok.forEach(({ im }, i) => {
      const ww = asp[i] * hh, cx = x + ww / 2; x += ww + gap;
      const cols = Math.max(8, Math.round(Math.sqrt(N * asp[i]))), rows = Math.max(8, Math.round(cols / asp[i]));
      const cv = document.createElement("canvas"); cv.width = cols; cv.height = rows;
      const g2 = cv.getContext("2d", { willReadFrequently: true }); g2.drawImage(im, 0, 0, cols, rows);
      const px = g2.getImageData(0, 0, cols, rows).data, n = cols * rows;
      const puv = new Float32Array(n * 2), pos = new Float32Array(n * 3), st = new Float32Array(n * 3), ct = new Float32Array(n * 3), col = new Float32Array(n * 3), del = new Float32Array(n);
      for (let r = 0, k = 0; r < rows; r++) for (let c = 0; c < cols; c++, k++) {
        const jx = (Math.random() - .5) * .35, jy = (Math.random() - .5) * .35;   // kein starres Raster
        const tx = cx - ww / 2 + (c + .5 + jx) / cols * ww, ty = cy + hh / 2 - (r + .5 + jy) / rows * hh;
        puv.set([(c + .5) / cols, 1 - (r + .5) / rows], k * 2);
        pos.set([tx, ty, 0], k * 3);
        const a = Math.random() * 6.283, b = Math.acos(Math.random() * 2 - 1), rr = Math.cbrt(Math.random()) * .9;
        const sx = orb.x + rr * Math.sin(b) * Math.cos(a), sy = orb.y + rr * Math.cos(b), sz = orb.z + rr * Math.sin(b) * Math.sin(a);
        st.set([sx, sy, sz], k * 3);
        ct.set([(sx + tx) / 2 + (Math.random() - .5) * 1.2, (sy + ty) / 2 + (Math.random() - .5) * .9, 1.1 + Math.random() * 1.1], k * 3);
        col.set([px[k * 4] / 255, px[k * 4 + 1] / 255, px[k * 4 + 2] / 255], k * 3);
        del[k] = .15 + (c / cols) * .55 + (r / rows) * .15 + Math.random() * .25 + i * .2;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(pos, 3)); geo.setAttribute("start", new THREE.BufferAttribute(st, 3));
      geo.setAttribute("ctrl", new THREE.BufferAttribute(ct, 3)); geo.setAttribute("col", new THREE.BufferAttribute(col, 3));
      geo.setAttribute("delay", new THREE.BufferAttribute(del, 1)); geo.setAttribute("puv", new THREE.BufferAttribute(puv, 2));
      const kante = { value: ok[i].meta.pfad ? .975 : .86 };
      const u = { uT: { value: 0 }, uOut: { value: 0 }, uReveal: { value: 0 }, uTime: this.core.u.uTime, uKante: kante,
        uCell: { value: ww / cols }, uProj: { value: 1 }, uColor: { value: this.core.hotColor.clone() } };
      const pts = new THREE.Points(geo, new THREE.ShaderMaterial({ uniforms: u, vertexShader: PIX_V, fragmentShader: PIX_F,
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
      pts.frustumCulled = false; this.core.scene.add(pts);
      const tex = new THREE.Texture(im); tex.colorSpace = THREE.NoColorSpace; tex.minFilter = THREE.LinearFilter; tex.needsUpdate = true;
      const fu = { uMap: { value: tex }, uColor: { value: this.core.baseColor.clone() }, uReveal: { value: 0 }, uKante: kante, uTime: this.core.u.uTime, uAspect: { value: asp[i] } };
      const plane = new THREE.Mesh(new THREE.PlaneGeometry(ww, hh), new THREE.ShaderMaterial({ uniforms: fu,
        vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
        fragmentShader: FOTO_F, transparent: true, depthWrite: false }));
      plane.position.set(cx, cy, 0); this.overlay.add(plane);
      const meta = ok[i].meta;
      const item = { pts, plane, u, tex, fu, meta, ww, hh, cx, cy, swap: -1 };
      if (meta.video) {                                   // Video: stumm, in Schleife, ersetzt das Standbild
        const v = document.createElement("video");
        v.muted = true; v.defaultMuted = true; v.loop = true; v.playsInline = true; v.preload = "auto";
        v.setAttribute("muted", ""); v.setAttribute("playsinline", ""); v.src = meta.video;
        v.addEventListener("playing", () => {
          if (!this.items.includes(item)) return;
          const vt = new THREE.VideoTexture(v); vt.colorSpace = THREE.NoColorSpace; vt.minFilter = THREE.LinearFilter;
          fu.uMap.value = vt; item.vtex = vt;
        }, { once: true });
        setTimeout(() => v.play().catch(() => {}), 1200);  // erst, wenn die Lichtpunkte fast angekommen sind
        item.video = v;
      }
      this.items.push(item);
    });
    this.unten = cy - hh / 2; this.t = 0; this.out = 0; this.aktiv = true;
    this.caption(d.titel, ok.map((o) => o.meta));
    this.items.forEach((it, i) => this.hit(it, i));
  }
  caption(titel, metas) {
    const host = this.core.canvas.parentElement; if (!host) return;
    this.cap?.remove();
    const el = document.createElement("div"); el.className = "bild-caption";
    const h = document.createElement("div"); h.className = "bc-titel"; h.textContent = titel || metas[0]?.titel || ""; el.appendChild(h);
    const src = document.createElement("div"); src.className = "bc-quelle";
    if (metas.length === 1 && metas[0].pfad) {
      const m = metas[0];
      const pf = document.createElement("a"); pf.href = "#"; pf.className = "bc-pfad";
      pf.title = "Ordner im Finder öffnen"; pf.textContent = `▸ DATENARCHIV · ${m.pfad}`;
      pf.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation();
        window.dispatchEvent(new CustomEvent("jarvis-ordner-klick", { detail: { pfad: m.pfad } })); });
      src.appendChild(pf);
      if (m.seiten > 1) {
        const nav = document.createElement("span"); nav.className = "bc-seiten";
        const zur = document.createElement("button"); zur.type = "button"; zur.textContent = "‹"; zur.dataset.blatt = "-1";
        const vor = document.createElement("button"); vor.type = "button"; vor.textContent = "›"; vor.dataset.blatt = "1";
        const z = document.createElement("span"); z.className = "bc-zahl"; z.textContent = `SEITE ${m.seite} / ${m.seiten}`;
        nav.append(zur, z, vor); src.append(nav);
      }
      const hin = document.createElement("div"); hin.className = "bc-hinweis";
      hin.textContent = "Maus darüber: Lupe · Klick: in Vorschau öffnen" + (m.seiten > 1 ? " · ← → blättern" : "");
      el.appendChild(src); el.appendChild(hin);
      host.appendChild(el); this.cap = el; this.placeCaption();
      return;
    }
    metas.forEach((m, i) => {
      if (i) src.append(" · ");
      const safe = /^https:\/\//.test(m.seite || "") ? m.seite : null;
      const a = document.createElement(safe ? "a" : "span"); if (safe) { a.href = safe; a.target = "_blank"; a.rel = "noopener"; }
      a.textContent = `${m.video ? "Video" : "Foto"}: ${m.urheber} · ${m.lizenz}`; src.appendChild(a);
    });
    el.appendChild(src);
    host.appendChild(el); this.cap = el; this.placeCaption();
  }
  hit(it, i) {                                     // unsichtbare Fläche über dem Bild: Lupe und Klick
    const host = this.core.canvas.parentElement; if (!host) return;
    const el = document.createElement("div"); el.className = "bild-hit"; el.title = it.meta.pfad ? "Klick: in Vorschau öffnen" : "";
    const lupe = document.createElement("div"); lupe.className = "lupe"; el.appendChild(lupe);
    const Z = it.meta.pfad ? 2.6 : 2.2, R = 110;
    el.addEventListener("mousemove", (e) => {
      if (this.t < 2.2) return;
      const r = el.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      lupe.style.backgroundImage = `url("${it.src || it.meta.src}")`;
      lupe.style.backgroundSize = `${r.width * Z}px ${r.height * Z}px`;
      lupe.style.backgroundPosition = `${-(x * Z - R)}px ${-(y * Z - R)}px`;
      lupe.style.transform = `translate(${x - R}px, ${y - R}px)`; el.classList.add("zoom");
    });
    el.addEventListener("mouseleave", () => el.classList.remove("zoom"));
    el.addEventListener("click", (e) => {
      e.stopPropagation();
      window.dispatchEvent(new CustomEvent("jarvis-bild-klick", { detail: { index: i, meta: it.meta } }));
    });
    host.appendChild(el); it.hitEl = el;
  }
  async swap(i, meta) {                             // Blättern: neue Seite blendet fleckig ein
    const it = this.items[i]; if (!it) return;
    const im = await new Promise((res) => { const m = new Image(); m.onload = () => res(m); m.onerror = () => res(null); m.src = meta.src; });
    if (!im || !this.items.includes(it)) return;
    const tex = new THREE.Texture(im); tex.colorSpace = THREE.NoColorSpace; tex.minFilter = THREE.LinearFilter; tex.needsUpdate = true;
    it.fu.uMap.value.dispose?.(); it.fu.uMap.value = tex; it.tex = tex;
    it.meta = { ...it.meta, ...meta }; it.src = meta.src; it.swap = this.t;
    const z = this.cap?.querySelector(".bc-zahl"); if (z) z.textContent = `SEITE ${meta.seite} / ${meta.seiten}`;
  }
  placeHits() {
    const cam = this.core.camera, r = this.core.canvas.getBoundingClientRect(), host = this.core.canvas.parentElement.getBoundingClientRect();
    const v = new THREE.Vector3();
    this.items.forEach((it) => {
      if (!it.hitEl) return;
      v.set(it.cx - it.ww / 2, it.cy + it.hh / 2, 0).project(cam);
      const x0 = (v.x * .5 + .5) * r.width + r.left - host.left, y0 = (1 - (v.y * .5 + .5)) * r.height + r.top - host.top;
      v.set(it.cx + it.ww / 2, it.cy - it.hh / 2, 0).project(cam);
      const x1 = (v.x * .5 + .5) * r.width + r.left - host.left, y1 = (1 - (v.y * .5 + .5)) * r.height + r.top - host.top;
      Object.assign(it.hitEl.style, { left: `${x0}px`, top: `${y0}px`, width: `${x1 - x0}px`, height: `${y1 - y0}px` });
    });
  }
  placeCaption() {
    if (!this.cap) return;
    const v = new THREE.Vector3(0, this.unten, 0).project(this.core.camera);
    this.cap.style.top = `${(1 - (v.y * .5 + .5)) * 100}%`;
  }
  hide() {
    if (!this.aktiv) return;
    this.aktiv = false; this.out = .0001; this.cap?.classList.add("weg");
    this.items.forEach((it) => { it.hitEl?.remove(); it.hitEl = null; });
    const cap = this.cap; this.cap = null; setTimeout(() => cap?.remove(), 900);
  }
  clear() {
    this.items.forEach(({ pts, plane, tex, video, vtex }) => {
      if (video) { video.pause(); video.removeAttribute("src"); video.load(); }
      vtex?.dispose();
      this.core.scene.remove(pts); this.overlay.remove(plane);
      pts.geometry.dispose(); pts.material.dispose(); plane.geometry.dispose(); plane.material.dispose(); tex.dispose();
    });
    this.items.forEach((it) => it.hitEl?.remove());
    this.items = []; this.aktiv = false; this.out = 0; this.cap?.remove(); this.cap = null;
  }
  update(dt) {
    if (!this.items.length) return;
    const H = this.core.renderer.getDrawingBufferSize(new THREE.Vector2()).y;
    const proj = H / (2 * Math.tan(THREE.MathUtils.degToRad(this.core.camera.fov / 2)));
    this.t += dt;
    if (this.out > 0) this.out += dt * .9;
    const reveal = this.out > 0 ? Math.max(0, 1 - this.out * 3) : THREE.MathUtils.smoothstep(this.t, 1.7, 2.9);
    this.items.forEach((it) => {
      const { u, fu } = it;
      u.uT.value = this.t; u.uReveal.value = reveal; u.uOut.value = this.out > 0 ? this.out * 1.6 : 0; u.uProj.value = proj;
      fu.uReveal.value = it.swap >= 0 && this.out === 0 ? Math.min(reveal, THREE.MathUtils.smoothstep(this.t, it.swap, it.swap + .9)) : reveal;
    });
    this.placeCaption(); if (this.aktiv) this.placeHits();
    if (this.out > 1.9) this.clear();
  }
}

// ---------------------------------------------------------------- Kern
class Core3D {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
    this.renderer.setClearColor(0x000000, 0);
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(38, 1, .1, 100); this.camera.position.set(0, 0, 7.2);
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 1, .5, .1); this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());
    this.u = shared({}); this.state = "off"; this.st = { ...STATES.off }; this.level = 0;
    this.streams = new Streams(this.scene); this.net = new Net(this.scene);
    this.ripples = new Ripples(this.scene); this.orbit = new Orbit(this);
    this.toolTint = null; this.toolT = 0; this.thinkT = 0; this.ignT = 0;
    this.mood = { warm: 0, dim: 0 }; this.warmColor = new THREE.Color(0xffb27a);
    this.gallery = new Gallery(this); this.fokus = 0;
    this.quality = "hoch"; this.fpsT = 0; this.fpsN = 0; this.lowCount = 0;
    this.labels = [];
    this.resize(); new ResizeObserver(() => this.resize()).observe(canvas);
    this.setTheme("holo");
    this.last = performance.now(); this.elapsed = 0;
    this.reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.renderer.setAnimationLoop(() => this.frame());
  }
  resize() {
    const r = this.canvas.getBoundingClientRect(), w = Math.max(1, r.width), h = Math.max(1, r.height);
    const pr = { hoch: Math.min(devicePixelRatio, 2), mittel: 1.25, niedrig: 1 }[this.quality];
    this.renderer.setPixelRatio(pr); this.renderer.setSize(w, h, false); PR.value = pr;
    this.composer.setPixelRatio(pr); this.composer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camBase = w / h < 1.3 ? 8.6 : 7.2;              // schmale Bühne: etwas weiter weg
    this.camera.position.z = this.camBase * (this.zf || 1);
    this.camera.updateProjectionMatrix();
  }
  setTheme(name) {
    if (!THEMES[name]) name = "holo";
    this.themeName = name; this.theme = THEMES[name];
    if (this.world) { this.scene.remove(this.world.group); this.world.group.traverse((o) => { o.geometry?.dispose(); o.material?.dispose(); }); }
    this.u = shared({}); this.world = BUILD[name](this.u); this.scene.add(this.world.group);
    const [s, r, th] = this.theme.bloom; this.bloom.strength = s; this.bloom.radius = r; this.bloom.threshold = th;
    this.baseColor = new THREE.Color(this.theme.base); this.hotColor = new THREE.Color(this.theme.hot);
    this.u.uColor.value.copy(this.baseColor); this.u.uHot.value.copy(this.hotColor);
    this.streams.u.uColor.value.copy(this.hotColor);
    this.world.group.position.y = name === "taktisch" ? -.1 : 0;
    this.zf = 1; this.camera.position.z = this.camBase;
  }
  setState(s) { this.state = STATES[s] ? s : "idle"; }
  setLevel(v) { this.level = v; }
  setQuality(q) { if (["hoch", "mittel", "niedrig"].includes(q)) { this.quality = q; this.bloom.enabled = q !== "niedrig"; this.resize(); } }
  tool(name) {
    const s = SECTORS.find(([re]) => re.test(name || "")) || [null, 90 + Math.random() * 180, "WERKZEUG", null];
    if (s[3]) { this.toolTint = new THREE.Color(s[3]); this.toolT = 1.8; this.streams.u.uColor.value.copy(this.toolTint); }
    this.streams.spawn(s[1]);
    if (/archiv/.test(name)) this.net.fire(this.hotColor);
    this.label(s[2], s[1]);
  }
  label(text, angleDeg) {         // kurze Beschriftung am Rand, woher der Datenstrom kommt
    const host = this.canvas.parentElement; if (!host) return;
    const el = document.createElement("div"); el.className = "stream-label"; el.textContent = text;
    const a = (angleDeg * Math.PI) / 180, r = host.getBoundingClientRect();
    el.style.left = `${50 + Math.cos(a) * 40}%`; el.style.top = `${46 - Math.sin(a) * 34}%`;
    if (this.toolTint) el.style.color = `#${this.toolTint.getHexString()}`;
    host.appendChild(el); setTimeout(() => el.remove(), 1800);
    void r;
  }
  frame() {
    const now = performance.now(), dt = Math.min(.05, (now - this.last) / 1000) * (this.reduce ? .25 : 1); this.last = now; this.elapsed += dt; const t = this.elapsed;
    const target = STATES[this.state];
    // Plexus bleibt wie er ist; alle anderen Stilwelten reagieren ruhiger (weniger Ausschlag, weicher)
    const ruhig = this.themeName !== "plexus", kE = ruhig ? .7 : 1, kS = ruhig ? .75 : 1, kL = ruhig ? .4 : 1;
    this.st.e += (target.e * kE + this.level * .2 * kL - this.st.e) * Math.min(1, dt * (ruhig ? 1.2 : 2));
    this.st.s += (target.s * kS - this.st.s) * Math.min(1, dt * (ruhig ? 1.2 : 2));
    // Grundfarbe: Stilwelt, abends wärmer; Zustände und Werkzeuge färben vorübergehend
    const basis = this.baseColor.clone().lerp(this.warmColor, this.mood.warm * .32);
    let tint = STATE_TINT[this.state] ? new THREE.Color(STATE_TINT[this.state]) : basis;
    if (this.toolT > 0) { this.toolT -= dt; tint = basis.clone().lerp(this.toolTint, Math.min(1, this.toolT) * .75); }
    else if (this.streams.u.uColor.value.getHex() !== this.hotColor.getHex()) this.streams.u.uColor.value.lerp(this.hotColor, Math.min(1, dt * 2));
    this.u.uColor.value.lerp(tint, Math.min(1, dt * 3));
    // Denken: Datenströme fließen laufend zum Kern
    if (this.state === "think" && !this.reduce) {
      this.thinkT += dt;
      if (this.thinkT > .38) { this.thinkT = 0; this.streams.spawn(Math.random() * 360, 55); }
    }
    // Sprechen: Wellen nach außen im Takt der Stimme; Zuhören: Wellen nach innen
    const lvl = this.u.uLevel.value;
    if (!this.reduce && t - this.ripples.last > (this.state === "speak" ? .42 : .55)) {
      if (this.state === "speak" && lvl > (ruhig ? .12 : .16) && (!ruhig || t - this.ripples.last > .9)) { this.ripples.spawn(ruhig ? this.u.uColor.value : this.hotColor); this.ripples.last = t; }
      else if (this.state === "listen" && this.level > .1) { this.ripples.spawn(this.u.uColor.value, true); this.ripples.last = t; }
    }
    if (this.ignT > 0) this.ignT = Math.max(0, this.ignT - dt);
    const zuenden = this.ignT > 0 ? Math.sin(this.ignT / 1.4 * Math.PI) * .9 : 0;   // kurzes Aufflammen beim Start
    this.u.uTime.value = t; this.u.uEnergy.value = this.st.e;
    // Stimm-Hüllkurve: weich ansteigen, langsam abklingen – kein Flackern
    const lv = this.u.uLevel.value, ziel = Math.max(this.level * kL, zuenden);
    const rate = ziel > lv ? (ruhig ? 1.8 : 3.5) : (ruhig ? 1.0 : 1.6);
    this.u.uLevel.value += (ziel - lv) * Math.min(1, dt * rate);
    this.world.update(t, dt, this.st, this.state);
    const zf = this.world.zoom && !this.gallery.aktiv && !this.extFokus ? this.world.zoom(this.state, this.u.uLevel.value) : 1;   // Kamera taucht beim Sprechen ein
    this.zf = (this.zf || 1) + (zf - (this.zf || 1)) * Math.min(1, dt * .7);
    this.camera.position.z = this.camBase * this.zf;
    // Bühne: bei eingeblendeten Bildern rückt der Kern klein nach oben
    this.fokus += ((this.gallery.aktiv || this.extFokus ? 1 : 0) - this.fokus) * Math.min(1, dt * 2.2);
    const visH = 2 * this.camBase * Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2));
    this.world.group.position.y = (this.themeName === "taktisch" ? -.1 : 0) * (1 - this.fokus) + this.fokus * (visH / 2 - .62);
    this.world.group.scale.setScalar((1 + Math.sin(t * 1.3) * .006 + this.u.uLevel.value * (ruhig ? .006 : .015)) * (1 - this.fokus * .64));
    this.streams.update(dt); this.net.update(dt);
    this.ripples.group.position.copy(this.world.group.position);
    this.ripples.group.scale.copy(this.world.group.scale);
    this.ripples.update(dt);
    this.orbit.group.position.copy(this.world.group.position);
    this.orbit.update(dt, t, Math.max(this.fokus, this.orbitAus ? 1 : 0));
    this.bloom.strength = this.theme.bloom[0] * (1 + this.st.e * (ruhig ? .12 : .35) + this.ignT * .6) * (1 - this.mood.dim * .45);
    this.gallery.update(dt);
    // Gesicht (MOSAIK) aktiv: Kern, Ströme und Netz bleiben unsichtbar – nur Bilder/Dokumente erscheinen über dem Gesicht
    const kern = !this.kernAus;
    this.world.group.visible = kern; this.streams.points.visible = kern; this.ripples.group.visible = kern;
    this.orbit.group.visible = kern; if (this.net.obj) this.net.obj.visible = kern;
    this.renderer.autoClear = true;
    if (this.bloom.enabled && kern) this.composer.render(); else this.renderer.render(this.scene, this.camera);
    if (this.gallery.overlay.children.length) {          // Fotos ohne Bloom darüber zeichnen
      this.renderer.autoClear = false; this.renderer.clearDepth();
      this.renderer.render(this.gallery.overlay, this.camera); this.renderer.autoClear = true;
    }
    // Bildrate beobachten, bei Bedarf Qualität senken
    this.fpsN++; this.fpsT += dt;
    if (this.fpsT > 3) {
      const fps = this.fpsN / this.fpsT; this.fps = Math.round(fps); this.fpsN = 0; this.fpsT = 0;
      if (this.auto !== false && fps < 42 && !this.reduce) {
        if (++this.lowCount >= 2) { this.setQuality(this.quality === "hoch" ? "mittel" : "niedrig"); this.lowCount = 0; }
      } else this.lowCount = 0;
    }
  }
}

// ---------------------------------------------------------------- Start
function start() {
  const canvas = document.getElementById("core3d");
  if (!canvas) return;
  try {
    const c = new Core3D(canvas);
    window.jarvis3d = {
      active: true, themes: Object.fromEntries(Object.entries(THEMES).map(([k, v]) => [k, v.name])),
      setTheme: (n) => c.setTheme(n), setState: (s) => c.setState(s), setLevel: (v) => c.setLevel(v),
      tool: (n) => c.tool(n), showImages: (d) => c.gallery.show(d), hideImages: () => c.gallery.hide(),
      hasImages: () => c.gallery.aktiv,
      setOrbit: (items) => c.orbit.set(items), orbitAus: (b) => { c.orbitAus = !!b; }, kernAus: (b) => { c.kernAus = !!b; },
      setMood: (m) => { Object.assign(c.mood, m || {}); }, ignite: () => { c.ignT = 1.4; c.setState("idle"); }, swapImage: (i, m) => c.gallery.swap(i, m), setFocus: (b) => { c.extFokus = !!b; }, setQuality: (q) => { c.auto = false; c.setQuality(q); }, info: () => ({ fps: c.fps, quality: c.quality, theme: c.themeName }),
    };
    document.body.classList.add("gl");
    window.dispatchEvent(new Event("jarvis3d-ready"));
  } catch (e) {
    console.warn("WebGL nicht verfügbar – 2D-Darstellung bleibt aktiv", e);
  }
}
start();
