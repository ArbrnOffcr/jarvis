import * as THREE from 'three';

// Self-contained: no runtime requests, textures, loaders or shared local modules.
const DESIGN = 'nova';
const STATES = {
  ruhe: [1, .13, .025, .65, 4],
  zuhoeren: [1.09, .08, .045, .95, 2.4],
  denken: [.93, .65, .06, .85, 1.8],
  sprechen: [1.02, .20, .12, 1, 1.2],
  warnung: [1.04, .06, .055, 1, 2.8]
};
export function erzeugen(container, { qualitaet = 'hoch' } = {}) {
  if (!container?.appendChild) throw new TypeError('Ein DOM-Container wird benötigt.');
  if (!['hoch', 'niedrig'].includes(qualitaet)) throw new RangeError('Unbekannte Qualität.');
  const low = qualitaet === 'niedrig';
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, .1, 30);
  camera.position.set(0, .08, 7.2);
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: !low, premultipliedAlpha: false });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, low ? 1 : 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.style.cssText = 'display:block;width:100%;height:100%;';
  renderer.domElement.setAttribute('aria-label', `${DESIGN}: menschenähnlicher männlicher Sprachassistent`);
  renderer.domElement.setAttribute('role', 'img');
  container.appendChild(renderer.domElement);
  const root = new THREE.Group(); scene.add(root);
  const resources = new Set();
  const keep = x => (resources.add(x), x);
  const uniforms = {
    tint: { value: new THREE.Color('#00e5ff') }, secondary: {value: new THREE.Color('#7ff3ff')}, core: {value: new THREE.Color('#e8fbff')},
    light: { value: .65 }, time: { value: 0 }
  };
  const fiber = keep(new THREE.ShaderMaterial({
    uniforms, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `varying vec3 normalV; varying vec3 positionV; void main(){normalV=normalize(normalMatrix*normal);vec4 p=modelViewMatrix*vec4(position,1.);positionV=p.xyz;gl_Position=projectionMatrix*p;}`,
    fragmentShader: `uniform vec3 tint;uniform vec3 secondary;uniform float light;uniform float time;varying vec3 normalV;varying vec3 positionV;
    void main(){float rim=pow(1.-abs(dot(normalize(normalV),normalize(-positionV))),1.6);float flow=.5+.5*sin(positionV.y*7.+positionV.x*3.-time*2.);vec3 c=mix(tint,secondary,rim*.6);float a=(.22+rim*.5+flow*.12)*light;gl_FragColor=vec4(c,a);}`
  }));
  const haze = keep(new THREE.ShaderMaterial({
    uniforms, transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
    vertexShader:`varying vec3 n;varying vec3 p;void main(){n=normalize(normalMatrix*normal);vec4 v=modelViewMatrix*vec4(position,1.);p=v.xyz;gl_Position=projectionMatrix*v;}`,
    fragmentShader:`uniform vec3 tint;uniform float light;varying vec3 n;varying vec3 p;void main(){float rim=pow(1.-abs(dot(normalize(n),normalize(-p))),3.);gl_FragColor=vec4(tint,(.018+rim*.13)*light);}`
  }));
  const parts=[];
  scene.add(new THREE.HemisphereLight(0xd4f5ff,0x0c1725,2.2));
  const keyLight=new THREE.DirectionalLight(0xe8fbff,4);keyLight.position.set(-3,4,5);scene.add(keyLight);
  const rimLight=new THREE.DirectionalLight(0x00e5ff,3);rimLight.position.set(3,2,-3);scene.add(rimLight);
  const skin=keep(new THREE.MeshStandardMaterial({color:DESIGN==='nova'?0x344552:DESIGN==='milo'?0x237a91:0xbcc6c8,metalness:DESIGN==='nova'?.7:.25,roughness:.32,transparent:DESIGN==='milo',opacity:DESIGN==='milo'?.62:1}));
  const outfit=keep(new THREE.MeshStandardMaterial({color:DESIGN==='nova'?0x101c27:DESIGN==='milo'?0x165167:0x9faeb1,metalness:.3,roughness:.48,transparent:DESIGN==='milo',opacity:DESIGN==='milo'?.72:1}));
  const dark=keep(new THREE.MeshBasicMaterial({color:0x07121b}));
  const sphere=keep(new THREE.SphereGeometry(1,low?16:32,low?12:24));
  function ellipsoid(parent,x,y,z,sx,sy,sz,mat=skin){const m=new THREE.Mesh(sphere,mat);m.position.set(x,y,z);m.scale.set(sx,sy,sz);parent.add(m);return m;}
  function rod(parent,a,b,r1,r2,mat=outfit){const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),d=end.clone().sub(start);const g=keep(new THREE.CylinderGeometry(r2,r1,d.length(),low?12:24));const m=new THREE.Mesh(g,mat);m.position.copy(start).add(end).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());parent.add(m);return m;}
  function line(parent,points,r=.005,mat=fiber){const path=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));const m=new THREE.Mesh(keep(new THREE.TubeGeometry(path,low?24:60,r,low?4:6,false)),mat);parent.add(m);return m;}
  // Masculine silhouette: broad shoulders, straight torso, thick neck and squared jaw.
  const torsoProfile=[[-.52,.27],[-.43,.34],[-.20,.31],[.1,.34],[.40,.46],[.65,.55],[.79,.48],[.88,.22]];
  const torsoGeo=keep(new THREE.LatheGeometry(torsoProfile.map(([y,r])=>new THREE.Vector2(r,y)),low?24:48));
  const tp=torsoGeo.attributes.position;for(let i=0;i<tp.count;i++)tp.setZ(i,tp.getZ(i)*.55);torsoGeo.computeVertexNormals();root.add(new THREE.Mesh(torsoGeo,outfit));
  ellipsoid(root,0,-.45,0,.34,.20,.19,outfit);
  rod(root,[0,.78,0],[0,1.20,0],.16,.15,skin);
  const head=new THREE.Group();head.position.set(0,1.44,0);root.add(head);
  const headGeo=keep(new THREE.SphereGeometry(1,low?24:64,low?20:48));
  const hp=headGeo.attributes.position;
  for(let i=0;i<hp.count;i++){
    let x=hp.getX(i),y=hp.getY(i),z=hp.getZ(i);
    x=Math.sign(x)*Math.pow(Math.abs(x),y<-.15?.65:.85)*.235;
    const originalY=y;y*=.30;z*=.22;
    if(z>0){z+=.055*Math.exp(-x*x/.0014-(originalY+.13)**2/.09);z-=.017*Math.exp(-((Math.abs(x)-.10)**2)/.0015-(originalY-.13)**2/.018);}
    hp.setXYZ(i,x,y,z);
  }
  headGeo.computeVertexNormals();head.add(new THREE.Mesh(headGeo,skin));
  for(const side of [-1,1]){
    ellipsoid(head,side*.236,-.01,0,.034,.072,.043);
    ellipsoid(head,side*.097,.034,.201,.078,.034,.028,dark);
    ellipsoid(head,side*.097,.035,.223,.059,.017,.012,fiber);
    const brow=ellipsoid(head,side*.10,.078,.203,.09,.028,.038);brow.rotation.z=side*-.05;
    line(head,[[side*.22,.18,.05],[side*.235,.11,.075],[side*.24,-.02,.065],[side*.21,-.14,.055]],.003);
  }
  const mouth=ellipsoid(head,0,-.135,.201,.073,.004,.007,dark);
  line(head,[[-.075,-.143,.201],[0,-.148,.209],[.075,-.143,.201]],.002,skin);
  // Collar, clavicle seam and one restrained vertical light seam.
  line(root,[[-.44,.66,.19],[-.25,.76,.16],[0,.82,.12],[.25,.76,.16],[.44,.66,.19]],.006);
  line(root,[[0,.74,.15],[0,.30,.24],[0,-.22,.19]],.004);
  const arms=[];
  for(const side of [-1,1]){
    const arm=new THREE.Group();arm.position.set(side*.53,.65,0);root.add(arm);arms.push(arm);
    ellipsoid(arm,0,0,0,.18,.20,.18,outfit);
    rod(arm,[0,-.03,0],[side*.10,-.47,.015],.13,.105);
    ellipsoid(arm,side*.10,-.47,.015,.108,.11,.105,outfit);
    rod(arm,[side*.10,-.47,.015],[side*.13,-.91,.095],.10,.064);
    ellipsoid(arm,side*.13,-1.01,.10,.078,.135,.047,skin);
    // Four fingers and thumb: a complete recognizable human hand.
    for(let f=0;f<4;f++){const fx=side*.13+(f-1.5)*.031;const len=[.12,.15,.14,.105][f];rod(arm,[fx,-1.075,.1],[fx,-1.075-len,.10],.016,.013,skin);ellipsoid(arm,fx,-1.075-len,.1,.013,.016,.013,skin);}
    rod(arm,[side*.07,-.96,.11],[side*.025,-1.065,.15],.022,.017,skin);
    line(arm,[[side*.12,-.80,.16],[side*.13,-.88,.16]],.004);
    rod(root,[side*.19,-.49,0],[side*.215,-1.12,.015],.17,.125);
    ellipsoid(root,side*.215,-1.12,.015,.126,.14,.125,outfit);
    rod(root,[side*.215,-1.12,.015],[side*.235,-1.79,.01],.12,.075);
    ellipsoid(root,side*.235,-1.85,.085,.105,.10,.20,outfit);
    line(root,[[side*.30,-.56,.13],[side*.32,-1.06,.105],[side*.30,-1.7,.08]],.003);
  }
  // Seeded particles: reproducible layouts and no external texture.
  let seed=42017; const random=()=>((seed=(1664525*seed+1013904223)>>>0)/4294967296);
  const count=low?200:800, pos=new Float32Array(count*3);
  for(let i=0;i<count;i++){
    const z=random()*2-1,a=random()*Math.PI*2,r=Math.cbrt(random())*.13,s=Math.sqrt(1-z*z);
    pos.set([r*s*Math.cos(a),r*z+.36,r*s*Math.sin(a)+.22],i*3);
  }
  const pg=keep(new THREE.BufferGeometry());pg.setAttribute('position',new THREE.BufferAttribute(pos,3));
  const pu={tint:uniforms.tint,core:uniforms.core,light:uniforms.light,dpr:{value:renderer.getPixelRatio()}};
  const pm=keep(new THREE.ShaderMaterial({uniforms:pu,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
    vertexShader:`uniform float dpr;void main(){vec4 p=modelViewMatrix*vec4(position,1.);gl_PointSize=min(30.,32.*dpr/max(1.,-p.z));gl_Position=projectionMatrix*p;}`,
    fragmentShader:`uniform vec3 tint;uniform vec3 core;uniform float light;void main(){float d=length(gl_PointCoord-.5)*2.;float a=exp(-d*d*5.)*(1.-smoothstep(.6,1.,d));gl_FragColor=vec4(mix(tint,core,.45),a*light);}`
  }));root.add(new THREE.Points(pg,pm));
  // Alpha-preserving separable Gaussian bloom; no addon or global renderer changes.
  let rt, blurA, blurB, postScene, postCamera, quad, blurMat, composite;
  if(!low){
    rt=keep(new THREE.WebGLRenderTarget(1,1,{depthBuffer:true}));
    blurA=keep(new THREE.WebGLRenderTarget(1,1,{depthBuffer:false}));
    blurB=keep(new THREE.WebGLRenderTarget(1,1,{depthBuffer:false}));
    const vertex=`varying vec2 v;void main(){v=uv;gl_Position=vec4(position.xy,0.,1.);}`;
    blurMat=keep(new THREE.ShaderMaterial({depthTest:false,depthWrite:false,uniforms:{src:{value:null},stepUV:{value:new THREE.Vector2()}},vertexShader:vertex,
      fragmentShader:`varying vec2 v;uniform sampler2D src;uniform vec2 stepUV;void main(){vec4 c=texture2D(src,v)*.227027;c+=(texture2D(src,v+stepUV*1.384615)+texture2D(src,v-stepUV*1.384615))*.316216;c+=(texture2D(src,v+stepUV*3.230769)+texture2D(src,v-stepUV*3.230769))*.070270;gl_FragColor=c;}` }));
    composite=keep(new THREE.ShaderMaterial({depthTest:false,depthWrite:false,uniforms:{src:{value:rt.texture},bloom:{value:blurB.texture}},vertexShader:vertex,
      fragmentShader:`varying vec2 v;uniform sampler2D src;uniform sampler2D bloom;void main(){vec4 a=texture2D(src,v),b=texture2D(bloom,v);vec3 rgb=a.rgb+b.rgb*.75;float alpha=clamp(a.a+b.a*.75,0.,1.);gl_FragColor=vec4(rgb/max(alpha,.0001),alpha);}` }));
    postScene=new THREE.Scene();postCamera=new THREE.Camera();quad=new THREE.Mesh(keep(new THREE.PlaneGeometry(2,2)),blurMat);postScene.add(quad);
  }
  let disposed=false, suspended=false, width=1,height=1;
  function resize(){
    if(disposed)return;
    const rect=container.getBoundingClientRect();width=Math.max(1,Math.floor(rect.width));height=Math.max(1,Math.floor(rect.height));
    renderer.setSize(width,height,false);camera.aspect=width/height;
    camera.position.z=camera.aspect<1?7.2/camera.aspect:7.2;camera.updateProjectionMatrix();
    if(rt){const d=renderer.getPixelRatio();rt.setSize(Math.round(width*d),Math.round(height*d));blurA.setSize(Math.max(1,Math.round(width*d/2)),Math.max(1,Math.round(height*d/2)));blurB.setSize(blurA.width,blurA.height);}
  }
  const observer=new ResizeObserver(resize);observer.observe(container);resize();
  const media=matchMedia('(prefers-reduced-motion: reduce)');let reduced=media.matches;
  const onMotion=e=>{reduced=e.matches;};media.addEventListener('change',onMotion);
  const onLost=e=>{e.preventDefault();suspended=true;};
  const onRestored=()=>{suspended=false;resize();};
  renderer.domElement.addEventListener('webglcontextlost',onLost);
  renderer.domElement.addEventListener('webglcontextrestored',onRestored);
  let target='ruhe',from=STATES.ruhe.slice(),current=from.slice(),changed=performance.now();
  let customColor=new THREE.Color('#00e5ff'),startColor=customColor.clone(),shownColor=customColor.clone();
  let rawLevel=0,level=0,lastAudio=-Infinity,visemeLevel=0;
  let last=0,start=performance.now(),phase=0,frame=0;
  function draw(now){
    if(disposed)return; frame=requestAnimationFrame(draw);
    if(low&&last&&now-last<1000/30-.5)return;
    const dt=Math.min((now-(last||now))/1000,.1);last=now;
    if(suspended||document.hidden)return;
    const t=(now-start)/1000,u=Math.min(1,(now-changed)/1200),ease=(1-Math.cos(u*Math.PI))/2;
    current=from.map((v,i)=>THREE.MathUtils.lerp(v,STATES[target][i],ease));
    const targetColor=target==='warnung'?new THREE.Color('#ffb547'):customColor;
    shownColor.copy(startColor).lerp(targetColor,ease);uniforms.tint.value.copy(shownColor);
    const signal=now-lastAudio<250?rawLevel:now-lastAudio<500?rawLevel*(500-(now-lastAudio))/250:visemeLevel;
    level=THREE.MathUtils.lerp(level,signal,1-Math.exp(-dt*14));
    const wave=Math.sin(t*Math.PI*2/(reduced?8:current[4]));
    const speech=target==='sprechen'?level*current[2]*ease:0;
    const warning=target==='warnung'?Math.pow(.5+.5*Math.sin(t*Math.PI*4/2.8),4)*.25*ease:0;
    const scale=reduced?1+.012*wave:current[0]+current[2]*wave+speech;
    root.scale.setScalar(reduced?1+.004*wave:1+.004*wave);head.rotation.x=reduced?0:(target==='zuhoeren'?-.09*ease:Math.sin(t*.7)*.018);head.rotation.y=reduced?0:Math.sin(t*.27)*.08;mouth.scale.y=reduced?.004:.004+(target==='sprechen'?level*.022:0);arms.forEach((a,i)=>{a.rotation.z=reduced?0:(i===0?-1:1)*(.04+(target==='sprechen'?level*.035:0));});
    root.position.y=reduced?0:Math.sin(t*.7)*.035;
    root.rotation.set(0,reduced?0:-.18+Math.sin(t*.25)*.025,0);
    uniforms.time.value=reduced?0:t*(target==='denken'?2.1:1);
    uniforms.light.value=reduced?.72:current[3]+speech*2+warning;
    if(low)renderer.render(scene,camera);
    else {
      renderer.setRenderTarget(rt);renderer.render(scene,camera);
      quad.material=blurMat;blurMat.uniforms.src.value=rt.texture;blurMat.uniforms.stepUV.value.set(2/blurA.width,0);
      renderer.setRenderTarget(blurA);renderer.render(postScene,postCamera);
      blurMat.uniforms.src.value=blurA.texture;blurMat.uniforms.stepUV.value.set(0,2/blurA.height);
      renderer.setRenderTarget(blurB);renderer.render(postScene,postCamera);
      quad.material=composite;renderer.setRenderTarget(null);renderer.render(postScene,postCamera);
    }
  }
  frame=requestAnimationFrame(draw);
  function transition(){from=current.slice();startColor.copy(shownColor);changed=performance.now();}
  return {
    zustand(name){if(disposed)return;if(!Object.hasOwn(STATES,name))throw new RangeError('Unbekannter Zustand: '+name);if(name===target)return;transition();target=name;},
    pegel(wert){if(disposed)return;if(!Number.isFinite(wert))return;rawLevel=THREE.MathUtils.clamp(wert,0,1);lastAudio=performance.now();},
    viseme(name){if(disposed)return;visemeLevel=({aa:.85,E:.65,I:.45,O:.75,U:.55,PP:.12,FF:.25,TH:.3,SS:.25,sil:0})[name]??0;},
    farbe(hex){if(disposed)return;if(!/^#[0-9a-f]{6}$/i.test(hex))throw new TypeError('Farbe als #rrggbb erwartet.');transition();customColor.set(hex);},
    entfernen(){if(disposed)return;disposed=true;cancelAnimationFrame(frame);observer.disconnect();media.removeEventListener('change',onMotion);renderer.domElement.removeEventListener('webglcontextlost',onLost);renderer.domElement.removeEventListener('webglcontextrestored',onRestored);resources.forEach(r=>r.dispose());resources.clear();scene.clear();postScene?.clear();renderer.renderLists.dispose();renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();}
  };
}
