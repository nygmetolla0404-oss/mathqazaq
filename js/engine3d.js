// QAZAQ MATH — 3D қозғалтқыш: Қазақстан картасы, ат/бүркіт, порталдар, виртуалды әлемдер.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import * as MD from './models.js';
import * as AC from './actors.js';
import { makeBook } from './book.js';
import { MATH, BOOKS } from './content.js';

// ---------- география ----------
export const LON0 = 67, LAT0 = 48, K = 6, KX = K * Math.cos(48 * Math.PI / 180);
export const KM_PER_UNIT = 111.2 / K;       // ≈ 18,5 км
export const M_PER_HUNIT = 500;             // биіктіктің 1 бірлігі = 500 м
export const TIME_SCALE = 1800;             // 1 нақты секунд = 30 ойын минуты
export const proj = (lon, lat) => ({ x: (lon - LON0) * KX, z: -(lat - LAT0) * K });
export const unproj = (x, z) => ({ lon: x / KX + LON0, lat: -z / K + LAT0 });
export function haversine(lon1, lat1, lon2, lat2) {
  const R = 6371, r = Math.PI / 180;
  const a = Math.sin((lat2 - lat1) * r / 2) ** 2 + Math.cos(lat1 * r) * Math.cos(lat2 * r) * Math.sin((lon2 - lon1) * r / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
export function bearing(lon1, lat1, lon2, lat2) {
  const r = Math.PI / 180; const y = Math.sin((lon2 - lon1) * r) * Math.cos(lat2 * r);
  const x = Math.cos(lat1 * r) * Math.sin(lat2 * r) - Math.sin(lat1 * r) * Math.cos(lat2 * r) * Math.cos((lon2 - lon1) * r);
  return (Math.atan2(y, x) / r + 360) % 360;
}
function pip(pt, poly) { // point-in-polygon, [lon,lat]
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > pt[1]) !== (yj > pt[1]) && pt[0] < (xj - xi) * (pt[1] - yi) / (yj - yi) + xi) c = !c;
  }
  return c;
}
// value noise
function hash(x, y) { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); }
function vnoise(x, y, per) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x, y, o = 4) { let s = 0, a = .5, f = 1; for (let i = 0; i < o; i++) { s += a * vnoise(x * f, y * f); f *= 2; a *= .5; } return s; }
const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
function segDist(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay; const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy || 1)));
  return Math.hypot(px - ax - t * dx, py - ay - t * dy);
}
function ridge(lon, lat, pts, width, amp) {
  let d = 1e9; for (let i = 0; i < pts.length - 1; i++) d = Math.min(d, segDist(lon, lat, ...pts[i], ...pts[i + 1]));
  return amp * Math.exp(-(d * d) / (width * width));
}
// Рельеф (биіктік бірлігімен, 1 = 500 м)
function rawHeight(lon, lat) {
  let h = .32 + fbm(lon * .35, lat * .35) * .35;
  if (lon < 54 && lat < 48.5) h -= .2;                          // Каспий маңы ойпаты
  const n = fbm(lon * 1.7, lat * 1.7, 5);
  h += ridge(lon, lat, [[74.2, 43.0], [76.0, 43.05], [77.8, 43.0], [79.5, 42.7], [80.2, 42.25]], .32, 7.5) * (.6 + n * .8); // Іле Алатауы, Хан Тәңірі
  h += ridge(lon, lat, [[79.5, 42.3], [80.2, 42.2]], .25, 5);
  h += ridge(lon, lat, [[78.6, 45.1], [80.0, 45.25], [81.3, 45.15]], .35, 6) * (.6 + n * .8);  // Жетісу Алатауы
  h += ridge(lon, lat, [[83.6, 49.2], [85.0, 49.4], [86.5, 49.6]], .45, 8) * (.55 + n * .9);   // Алтай, Мұзтау
  h += ridge(lon, lat, [[81.6, 47.3], [83.8, 47.3]], .3, 3) * (.6 + n);                       // Тарбағатай
  h += ridge(lon, lat, [[68.4, 43.9], [70.4, 42.7]], .3, 2.2) * (.6 + n);                     // Қаратау
  h += ridge(lon, lat, [[58.5, 50.0], [58.8, 48.0]], .4, 1.1) * (.6 + n);                     // Мұғалжар
  h += Math.exp(-((lon - 74) ** 2 + (lat - 49) ** 2) / 6) * 1.4 * (.4 + n);                   // Сарыарқа
  h += Math.exp(-((lon - 75.7) ** 2 + (lat - 50.8) ** 2) / .12) * 1.4 * (.5 + n);             // Баянауыл
  h += Math.exp(-((lon - 70.2) ** 2 + (lat - 53.0) ** 2) / .15) * 1.5 * (.5 + n);             // Бурабай
  h += Math.exp(-((lon - 67.0) ** 2 + (lat - 48.6) ** 2) / .5) * 1.2 * (.5 + n);              // Ұлытау
  return h;
}

export class Engine {
  constructor(canvas, data, cb) {
    this.canvas = canvas; this.data = data; this.cb = cb;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping; this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = true; this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.camera = new THREE.PerspectiveCamera(50, 1, .1, 2000);
    this.pmrem = new THREE.PMREMGenerator(this.renderer); this.envTex = this.pmrem.fromScene(new RoomEnvironment(), .04).texture;
    this.clock = new THREE.Clock(); this.t = 0;
    this.keys = {}; this.joy = { x: 0, y: 0 }; this.btn = { up: false, down: false };
    this.mode = 'home'; this.mount = 'horse'; this.paused = false;
    this.peers = new Map(); this.labels = []; this.mixers = [];
    this.player = { x: 0, z: 0, y: 1, h: 0, speed: 0, vy: 0, km: 0, hours: 0 };
    this.camYaw = 0; this.camPitch = .32; this.camDist = 6;
    this.labelLayer = document.getElementById('labels');
    this.buildMask();
    this.mapScene = new THREE.Scene();
    this.buildMap();
    this.scene = this.mapScene;
    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true; this.controls.maxPolarAngle = 1.35; this.controls.minDistance = 8; this.controls.maxDistance = 260;
    this.controls.target.set(0, 0, 0); this.camera.position.set(0, 120, 150);
    this.bindInput(); this.resize(); addEventListener('resize', () => this.resize());
    const astana = data.places[0]; const p = proj(astana.lon, astana.lat);
    Object.assign(this.player, { x: p.x + 3.2, z: p.z + 3.6, h: Math.atan2(-3.2, -3.6) });
    this.loadModels();
    this.renderer.setAnimationLoop(() => this.frame());
  }

  // ---------- маска құрлық / көл ----------
  buildMask() {
    const W = 600, H = 330; this.mask = { W, H, a: new Uint8Array(W * H) };
    const b = this.data.border; this.bbox = { lon0: 46, lon1: 88, lat0: 40.3, lat1: 55.7 };
    const { lon0, lon1, lat0, lat1 } = this.bbox;
    const lakes = this.lakeShapes();
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
      const lon = lon0 + (i + .5) / W * (lon1 - lon0), lat = lat1 - (j + .5) / H * (lat1 - lat0);
      let v = pip([lon, lat], b) ? 1 : 0;
      if (v && lakes.some(f => f(lon, lat))) v = 2;
      this.mask.a[j * W + i] = v;
    }
  }
  lakeShapes() {
    return this.data.lakes.map(l => {
      if (l.c) return (lon, lat) => ((lon - l.c[0]) / l.r[0]) ** 2 + ((lat - l.c[1]) / l.r[1]) ** 2 < 1;
      return (lon, lat) => { for (let i = 0; i < l.line.length - 1; i++) { const d = segDist(lon, lat * 1.4, l.line[i][0], l.line[i][1] * 1.4, l.line[i + 1][0], l.line[i + 1][1] * 1.4); if (d < (l.w[i] + l.w[i + 1]) / 2 * 1.4) return true; } return false; };
    });
  }
  maskAt(lon, lat) {
    const { lon0, lon1, lat0, lat1 } = this.bbox; const { W, H, a } = this.mask;
    const i = Math.floor((lon - lon0) / (lon1 - lon0) * W), j = Math.floor((lat1 - lat) / (lat1 - lat0) * H);
    if (i < 0 || j < 0 || i >= W || j >= H) return 0; return a[j * W + i];
  }
  heightAt(x, z) { // сахна бірлігімен
    const { lon, lat } = unproj(x, z);
    const m = this.maskAt(lon, lat); if (!m) return -.2;
    let h = rawHeight(lon, lat) * this.edgeTaper(x, z);
    if (m === 2) h = Math.min(h, .12);
    return h;
  }
  edgeTaper(x, z) {
    if (!this.borderXZ) this.borderXZ = this.data.border.map(([lo, la]) => { const p = proj(lo, la); return [p.x, p.z]; });
    const b = this.borderXZ; let d = 1e9;
    for (let i = 0; i < b.length; i++) { const j = (i + 1) % b.length; d = Math.min(d, segDist(x, z, b[i][0], b[i][1], b[j][0], b[j][1])); }
    return sstep(0, 2.2, d);
  }

  // ---------- карта сахнасы ----------
  buildMap() {
    const S = this.mapScene; S.environment = this.envTex;
    S.fog = new THREE.Fog(0x9fd2ff, 180, 520);
    S.add(this.makeSky());
    const hemi = new THREE.HemisphereLight(0xcfe8ff, 0x3a5a2a, .75); S.add(hemi);
    const sun = new THREE.DirectionalLight(0xfff1d6, 2.4); sun.position.set(-60, 90, 40); sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -40, right: 40, top: 40, bottom: -40, near: 1, far: 300 }); sun.shadow.bias = -.0008;
    S.add(sun, sun.target); this.sun = sun;
    S.add(this.makeOcean());
    S.add(this.makeSlab());
    this.terrain = this.makeTerrain(); S.add(this.terrain);
    this.scatterTrees(S);
    this.makeClouds(S);
    this.makeMathSymbols(S, 26, 95, 18);
    // нысандар
    this.placeObjs = [];
    for (const p of this.data.places) {
      const { x, z } = proj(p.lon, p.lat); const y = this.heightAt(x, z);
      const g = MD.buildLandmark(p.model);
      const s = { bayterek: .5, khanshatyr: .42, pyramid: .38, mosque: .36, mausoleum: .42, koktobe: .4, rocket: .4, canyon_red: .45, canyon_white: .45, mountain: .45, yurt_village: .32, abai: .4, okzhetpes: .35, bayanaul: .32, ancient: .3, lake: .4, sea: .5, city: .3 }[p.model] || .35;
      g.scale.setScalar(s); g.position.set(x, y, z);
      g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
      S.add(g);
      const ring = new THREE.Mesh(new THREE.RingGeometry(1.9, 2.15, 48), p.kind === 'scientist' ? MD.MAT.holoGold().clone() : MD.MAT.holo().clone());
      ring.rotation.x = -Math.PI / 2; ring.position.set(x, y + .08, z); S.add(ring);
      const beam = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, 14, 6, 1, true), new THREE.MeshBasicMaterial({ color: p.kind === 'scientist' ? 0xffd36b : 0x5fe3ff, transparent: true, opacity: .22, blending: THREE.AdditiveBlending, depthWrite: false }));
      beam.position.set(x, y + 7, z); S.add(beam);
      this.placeObjs.push({ p, x, z, y, g, ring });
      this.addLabel({ kind: p.kind, place: p, x, z, y: y + (p.model === 'mountain' ? 7 : 6), title: p.name, sub: p.label });
    }
    for (const c of this.data.cities) {
      const { x, z } = proj(c.lon, c.lat); const y = this.heightAt(x, z);
      const g = MD.cityCluster(); g.scale.setScalar(.18); g.position.set(x, y, z); S.add(g);
      this.addLabel({ kind: 'city', city: c, x, z, y: y + 2, title: c.name });
    }
    // киіз үйлер мен жылқы үйірлері
    const rnd = MD.mulberry(99);
    for (let i = 0; i < 26; i++) {
      const lon = 50 + rnd() * 34, lat = 42.5 + rnd() * 11; if (this.maskAt(lon, lat) !== 1) continue;
      const { x, z } = proj(lon, lat); const yu = MD.yurt(.22); yu.position.set(x, this.heightAt(x, z), z); yu.rotation.y = rnd() * 6; S.add(yu);
    }
    // ою-өрнекті алтын жиек — голограммалық тор
    const grid = new THREE.Mesh(new THREE.RingGeometry(150, 151.2, 128), MD.MAT.holoGold()); grid.rotation.x = -Math.PI / 2; grid.position.y = -1; S.add(grid);
    const grid2 = new THREE.Mesh(new THREE.RingGeometry(170, 170.6, 128), MD.MAT.holo()); grid2.rotation.x = -Math.PI / 2; grid2.position.y = -1; S.add(grid2);
  }
  makeSky() {
    const geo = new THREE.SphereGeometry(900, 32, 16);
    const m = new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false, uniforms: { top: { value: new THREE.Color(0x0b3c99) }, mid: { value: new THREE.Color(0x58a8ff) }, bot: { value: new THREE.Color(0xdff2ff) } },
      vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
      fragmentShader: 'uniform vec3 top,mid,bot; varying vec3 vP; void main(){ float h=vP.y; vec3 c = h>0.15? mix(mid,top,smoothstep(.15,.8,h)) : mix(bot,mid,smoothstep(-.05,.15,h)); vec3 sd=normalize(vec3(-.5,.6,.35)); float s=pow(max(dot(vP,sd),0.),180.)*1.6+pow(max(dot(vP,sd),0.),8.)*.25; gl_FragColor=vec4(c+vec3(1.,.9,.7)*s,1.); }' });
    const sky = new THREE.Mesh(geo, m); sky.frustumCulled = false; return sky;
  }
  makeOcean() {
    const m = new THREE.ShaderMaterial({ fog: true, uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { t: { value: 0 } }]),
      vertexShader: '#include <fog_pars_vertex>\nvarying vec2 vW; void main(){ vec4 w = modelMatrix*vec4(position,1.); vW=w.xz; vec4 mvPosition = viewMatrix*w; gl_Position=projectionMatrix*mvPosition; \n#include <fog_vertex>\n}',
      fragmentShader: '#include <fog_pars_fragment>\nuniform float t; varying vec2 vW; void main(){ float r=length(vW); vec3 deep=vec3(.02,.18,.45), shal=vec3(.08,.45,.8); vec3 c=mix(shal,deep,smoothstep(40.,160.,r)); float w=sin(vW.x*.35+t*1.2)*sin(vW.y*.31-t*.9)+sin((vW.x+vW.y)*.8+t*2.)*.4; c+=vec3(.6,.85,1.)*smoothstep(1.05,1.35,w)*.25; vec2 g=abs(fract(vW/12.)-.5); float grid=smoothstep(.485,.5,max(g.x,g.y)); c+=vec3(.2,.8,1.)*grid*.18*smoothstep(170.,60.,r); gl_FragColor=vec4(c,1.);\n#include <fog_fragment>\n}' });
    this.oceanMat = m;
    const o = new THREE.Mesh(new THREE.PlaneGeometry(1600, 1600), m); o.rotation.x = -Math.PI / 2; o.position.y = -1.1; o.receiveShadow = false; return o;
  }
  makeSlab() {
    const shape = new THREE.Shape(this.data.border.map(([lo, la]) => { const p = proj(lo, la); return new THREE.Vector2(p.x, -p.z); }));
    const geo = new THREE.ExtrudeGeometry(shape, { depth: 2.6, bevelEnabled: true, bevelThickness: .35, bevelSize: .35, bevelSegments: 3, curveSegments: 1 });
    geo.rotateX(-Math.PI / 2); geo.translate(0, -3.05, 0);
    const side = new THREE.MeshStandardMaterial({ color: 0xffc23a, metalness: .9, roughness: .25, emissive: 0x5a3500, emissiveIntensity: .4 });
    const cap = new THREE.MeshStandardMaterial({ color: 0x6b5a3a, roughness: .9 });
    const m = new THREE.Mesh(geo, [cap, side]); m.receiveShadow = true; return m;
  }
  makeTerrain() {
    const { lon0, lon1, lat0, lat1 } = this.bbox;
    const a = proj(lon0, lat1), b = proj(lon1, lat0);
    const w = b.x - a.x, d = b.z - a.z, SX = 360, SZ = 200;
    const geo = new THREE.PlaneGeometry(w, d, SX, SZ); geo.rotateX(-Math.PI / 2); geo.translate(a.x + w / 2, 0, a.z + d / 2);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) { const x = pos.getX(i), z = pos.getZ(i); pos.setY(i, Math.max(-.15, this.heightAt(x, z))); }
    geo.computeVertexNormals();
    const tex = this.makeLandTexture(); tex.anisotropy = 8;
    const m = new THREE.MeshStandardMaterial({ map: tex, alphaTest: .5, roughness: .92, metalness: 0 });
    m.onBeforeCompile = (sh) => {
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying float vWY; varying vec2 vWXZ;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvec4 qw = modelMatrix*vec4(transformed,1.); vWY = qw.y; vWXZ = qw.xz;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vWY; varying vec2 vWXZ;').replace('#include <map_fragment>', `#include <map_fragment>
        float nz = sin(vWXZ.x*2.3)*sin(vWXZ.y*2.7)*.35;
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(.36,.34,.32), smoothstep(2.6, 4.0, vWY + nz) * .85);
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(.96,.98,1.), smoothstep(4.6, 5.6, vWY + nz));`);
    };
    const mesh = new THREE.Mesh(geo, m); mesh.receiveShadow = true; mesh.castShadow = true; return mesh;
  }
  makeLandTexture() {
    const W = 1600, H = Math.round(W * (15.4 / 42) * (K / KX)); // пропорция
    const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
    const { lon0, lon1, lat0, lat1 } = this.bbox; const img = g.createImageData(W, H); const D = img.data;
    const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
    const GREEN = [70, 132, 52], YEL = [168, 168, 82], DES = [222, 196, 138], FOR = [42, 102, 46], BEI = [226, 212, 184], FOOT = [86, 148, 66];
    for (let j = 0; j < H; j++) { const lat = lat1 - j / H * (lat1 - lat0);
      for (let i = 0; i < W; i++) { const lon = lon0 + i / W * (lon1 - lon0);
        const n = fbm(lon * 1.3, lat * 1.3, 4), n2 = vnoise(lon * 9, lat * 9);
        let col = mix(YEL, GREEN, sstep(49.3 + n, 52.5, lat));
        col = mix(col, FOR, sstep(53.2, 55, lat + n * .8) * .7);
        const des = sstep(47.2, 44.8, lat + (n - .5) * 1.6) * (lon < 76 ? 1 : sstep(79, 76, lon));
        col = mix(col, DES, des);
        col = mix(col, BEI, sstep(56, 54, lon) * sstep(46, 44.5, lat));
        col = mix(col, FOOT, sstep(44.6, 43.6, lat) * sstep(73.5, 75, lon) + sstep(47.5, 49, lon > 82 ? lat : 0) * .8);
        const k = .86 + n * .22 + n2 * .08, o = (j * W + i) * 4;
        D[o] = col[0] * k; D[o + 1] = col[1] * k; D[o + 2] = col[2] * k; D[o + 3] = 255;
      } }
    g.putImageData(img, 0, 0);
    const P = (lon, lat) => [(lon - lon0) / (lon1 - lon0) * W, (lat1 - lat) / (lat1 - lat0) * H];
    const sx = W / (lon1 - lon0), sy = H / (lat1 - lat0);
    // өзендер
    g.strokeStyle = '#2f8fe0'; g.lineCap = g.lineJoin = 'round';
    for (const r of this.data.rivers) { g.lineWidth = 3; g.beginPath(); r.line.forEach((pt, i) => { const [x, y] = P(...pt); i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.stroke(); }
    // көлдер
    g.fillStyle = '#1e8fd8'; g.strokeStyle = '#1e8fd8';
    for (const l of this.data.lakes) {
      if (l.c) { const [x, y] = P(...l.c); g.beginPath(); g.ellipse(x, y, l.r[0] * sx, l.r[1] * sy, 0, 0, Math.PI * 2); g.fill(); }
      else for (let i = 0; i < l.line.length - 1; i++) { g.lineWidth = (l.w[i] + l.w[i + 1]) * sy; g.beginPath(); g.moveTo(...P(...l.line[i])); g.lineTo(...P(...l.line[i + 1])); g.stroke(); }
    }
    // шекарамен қию
    g.globalCompositeOperation = 'destination-in'; g.beginPath();
    this.data.border.forEach((pt, i) => { const [x, y] = P(...pt); i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.closePath(); g.fill();
    g.globalCompositeOperation = 'source-over';
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }
  scatterTrees(S) {
    const rnd = MD.mulberry(7); const pines = [], leafs = [];
    for (let i = 0; i < 9000 && pines.length + leafs.length < 2600; i++) {
      const lon = 46.5 + rnd() * 41, lat = 40.6 + rnd() * 15; if (this.maskAt(lon, lat) !== 1) continue;
      const north = lat > 52.6 && rnd() < .6, east = lon > 81 && lat > 48 && rnd() < .55, se = lat < 44.4 && lon > 74 && rnd() < .5, bur = Math.hypot(lon - 70.2, lat - 53) < .8 || Math.hypot(lon - 75.7, lat - 50.8) < .6;
      if (!(north || east || se || bur)) continue;
      const { x, z } = proj(lon, lat); const y = this.heightAt(x, z); if (y > 4.5) continue;
      (north || bur || east ? pines : leafs).push([x, y, z, .7 + rnd() * .6]);
    }
    const dummy = new THREE.Object3D();
    const mk = (geo, mat, arr, yoff) => { const im = new THREE.InstancedMesh(geo, mat, arr.length); arr.forEach(([x, y, z, s], i) => { dummy.position.set(x, y + yoff * s, z); dummy.scale.setScalar(s); dummy.rotation.y = i; dummy.updateMatrix(); im.setMatrixAt(i, dummy.matrix); }); im.castShadow = true; im.receiveShadow = true; S.add(im); };
    mk(new THREE.ConeGeometry(.28, .9, 6), MD.MAT.pine(), pines, .45);
    mk(new THREE.IcosahedronGeometry(.32, 0), MD.MAT.leaf(), leafs, .4);
  }
  makeClouds(S) {
    const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
    for (let i = 0; i < 7; i++) { const x = 30 + Math.random() * 68, y = 50 + Math.random() * 28, r = 18 + Math.random() * 22; const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(255,255,255,.95)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); }
    const tex = new THREE.CanvasTexture(c); this.clouds = [];
    for (let i = 0; i < 24; i++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: .7, depthWrite: false }));
      s.position.set((Math.random() - .5) * 260, 18 + Math.random() * 10, (Math.random() - .5) * 150); s.scale.set(22 + Math.random() * 18, 11 + Math.random() * 6, 1);
      S.add(s); this.clouds.push(s);
    }
  }
  makeMathSymbols(S, n, R, y0, list) {
    const syms = list || ['π', '√x', 'Σ', '∞', 'x²', '%', '∠α', '△', 'log₂', 'a²+b²=c²', 'v=s/t', 'S=πr²', '÷', '±', '∫', 'sin α', '1:500', 'km²'];
    const arr = [];
    for (let i = 0; i < n; i++) {
      const txt = syms[i % syms.length]; const c = document.createElement('canvas'); c.width = 256; c.height = 128; const g = c.getContext('2d');
      g.font = `italic 600 64px "Noto Serif", Georgia, serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.shadowColor = i % 3 ? '#5fe3ff' : '#ffd36b'; g.shadowBlur = 18; g.fillStyle = i % 3 ? '#bff4ff' : '#ffe7a3'; g.fillText(txt, 128, 64);
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
      const a = i / n * Math.PI * 2, r = R * (.85 + Math.random() * .3);
      s.position.set(Math.cos(a) * r, y0 + Math.random() * 6, Math.sin(a) * r * .6); const sc = R > 50 ? 9 : 3.2; s.scale.set(sc, sc / 2, 1);
      s.userData.base = s.position.y; s.userData.ph = Math.random() * 6; S.add(s); arr.push(s);
    }
    (this.floaters ||= []).push(...arr); return arr;
  }

  // ---------- модельдер ----------
  loadModels() {
    const loader = new GLTFLoader();
    const norm = (obj, target, axis = 'y') => { const b = new THREE.Box3().setFromObject(obj); const sz = b.getSize(new THREE.Vector3()); obj.scale.multiplyScalar(target / sz[axis]); };
    this.eagleProto = { mesh: null, clip: null };
    fetch('assets/models/Horse.json').then(r => r.json()).then(j => {
      const bin = atob(j.data); const u8 = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
      loader.parse(u8.buffer, '', (gl) => {
        const m = gl.scene.children[0]; m.castShadow = true; if (!m.geometry.attributes.normal) m.geometry.computeVertexNormals(); norm(m, 1.25);
        m.material = new THREE.MeshStandardMaterial({ vertexColors: true, color: 0xffffff, roughness: .5, metalness: .05, envMapIntensity: .6 });
        // ер-тоқым қойылатын арқа нүктесі (морф-анимацияда бірге қозғалады)
        const pos = m.geometry.attributes.position; const bb = new THREE.Box3().setFromBufferAttribute(pos); const len = bb.max.z - bb.min.z, wid = bb.max.x - bb.min.x; let vi = 0, best = -1e9;
        for (let i = 0; i < pos.count; i++) { const z = pos.getZ(i), x = pos.getX(i); if (z > bb.min.z + len * .42 && z < bb.min.z + len * .54 && Math.abs(x - (bb.min.x + bb.max.x) / 2) < wid * .12 && pos.getY(i) > best) { best = pos.getY(i); vi = i; } }
        this.horseProto = { mesh: m, clip: gl.animations[0], vi }; this.makeMounts();
      }, () => { this.horseProto = { mesh: this.fallbackHorse(), clip: null }; this.makeMounts(); });
    }).catch(() => { this.horseProto = { mesh: this.fallbackHorse(), clip: null }; this.makeMounts(); });
  }
  fallbackHorse() { const g = new THREE.Group(); const m = MD.MAT.wood(); const b = new THREE.Mesh(new THREE.CapsuleGeometry(.25, .7, 4, 8), m); b.rotation.x = Math.PI / 2; b.position.y = .8; g.add(b); const n = new THREE.Mesh(new THREE.CapsuleGeometry(.12, .4, 4, 8), m); n.position.set(0, 1.1, .45); n.rotation.x = .6; g.add(n); for (const [x, z] of [[-.15, -.3], [.15, -.3], [-.15, .3], [.15, .3]]) { const l = new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, .6), m); l.position.set(x, .3, z); g.add(l); } return g; }
  /** арқа нүктесі (mount тобының координатасында) */
  backPoint(h, out = new THREE.Vector3()) {
    const m = h.obj; const vi = this.horseProto?.vi; if (vi == null || !m.geometry) return out.set(0, .82, 0);
    const g = m.geometry; out.fromBufferAttribute(g.attributes.position, vi);
    const mp = g.morphAttributes.position, inf = m.morphTargetInfluences;
    if (mp && inf) { const rel = g.morphTargetsRelative; for (let k = 0; k < mp.length; k++) { const w = inf[k]; if (!w) continue; const dx = mp[k].getX(vi), dy = mp[k].getY(vi), dz = mp[k].getZ(vi); if (rel) { out.x += dx * w; out.y += dy * w; out.z += dz * w; } else { out.x += (dx - out.x) * w; out.y += (dy - out.y) * w; out.z += (dz - out.z) * w; } } }
    m.updateMatrix(); return out.applyMatrix4(m.matrix);
  }
  cloneMount(kind, tint) {
    if (kind === 'eagle') { const e = AC.eagle(); e.scale.setScalar(.78); e.traverse(o => { if (o.isMesh) o.castShadow = true; }); return { obj: e, mixer: null, eagle: true }; }
    const proto = this.horseProto; if (!proto) return { obj: new THREE.Group(), mixer: null };
    const m = proto.mesh.clone(); if (tint && m.material) { m.material = m.material.clone(); m.material.color.lerp(new THREE.Color(tint), .25); }
    m.castShadow = true;
    let mixer = null; if (proto.clip) { mixer = new THREE.AnimationMixer(m); mixer.clipAction(proto.clip).setDuration(.8).play(); this.mixers.push(mixer); }
    return { obj: m, mixer };
  }
  /** ат + ер-тоқым + маскот */
  makeRider(prof, tint) {
    const g = new THREE.Group(); const h = this.cloneMount('horse', tint); g.add(h.obj);
    const sad = AC.saddle(prof.color || '#c4302b'); sad.scale.setScalar(.9); g.add(sad);
    const rider = AC.mascot(prof.char || 'tamshy', prof.color || '#2aa8ff'); rider.scale.setScalar(.4); g.add(rider);
    return { g, h, sad, rider };
  }
  makeFlyer(prof) {
    const g = new THREE.Group(); const e = this.cloneMount('eagle'); g.add(e.obj);
    const rider = AC.mascot(prof.char || 'tamshy', prof.color || '#2aa8ff'); rider.scale.setScalar(.3); rider.position.set(0, .2, .05); g.add(rider);
    return { g, e: e.obj, rider };
  }
  syncRider(R, t, moving) { const bp = this.backPoint(R.h, this._bp || (this._bp = new THREE.Vector3())); R.sad.position.set(bp.x, bp.y - .23, bp.z); R.rider.position.set(bp.x, bp.y + .02, bp.z - .02); AC.animateMascot(R.rider, t, moving, true); }
  makeMounts() {
    const prof = this.profile || {};
    if (this.playerGroup) this.mapScene.remove(this.playerGroup);
    this.playerGroup = new THREE.Group(); this.mapScene.add(this.playerGroup);
    this.riderSet = this.makeRider(prof); this.horse = this.riderSet.h; this.playerGroup.add(this.riderSet.g);
    this.flyer = this.makeFlyer(prof); this.eagle = { obj: this.flyer.g }; this.playerGroup.add(this.flyer.g);
    const halo = new THREE.Mesh(new THREE.RingGeometry(.5, .57, 48), new THREE.MeshBasicMaterial({ color: new THREE.Color(prof.color || '#f3c24b'), transparent: true, opacity: .55, depthWrite: false })); halo.rotation.x = -Math.PI / 2; halo.position.y = .05; this.playerHalo = halo; this.playerGroup.add(halo);
    this.setMount(this.mount);
    this.cb.onReady?.();
  }
  setProfile(p) {
    this.profile = p;
    if (this.horseProto && this.playerGroup) this.makeMounts();
  }
  setMount(m) {
    this.mount = m; document.body.classList.toggle('mount-eagle', m === 'eagle');
    if (!this.playerGroup) return;
    const fly = m === 'eagle';
    this.riderSet.g.visible = !fly; this.flyer.g.visible = fly;
    const P = this.player;
    if (fly) { P.y = Math.max(P.y, this.heightAt(P.x, P.z) + 4); P.speed = Math.max(P.speed, 40); }
    else { P.speed = Math.min(P.speed, 40); }
    this.camDist = fly ? 6.5 : 5.2;
    if (this.mode !== 'map') return;
    if (m === 'orbit') { this.playerGroup.visible = true; this.riderSet.g.visible = true; this.flyer.g.visible = false; this.controls.enabled = true; this.controls.target.set(P.x, P.y, P.z); this.camera.position.set(P.x, P.y + 45, P.z + 55); }
    else this.controls.enabled = false;
  }

  // ---------- белгілер ----------
  addLabel(o) {
    const el = document.createElement('button'); el.type = 'button';
    el.className = 'plabel ' + (o.kind === 'city' ? 'city' : o.kind === 'scientist' ? 'sci' : '');
    if (o.kind === 'city') el.textContent = o.title;
    else { const icon = { city: '◆', landmark: 'Σ', nature: '△', scientist: 'π' }[o.kind] || '•'; el.innerHTML = `<span class="pi">${icon}</span><span><b></b><small></small></span>`; el.querySelector('b').textContent = o.title; el.querySelector('small').textContent = o.sub || ''; }
    el.addEventListener('click', (e) => { e.stopPropagation(); if (o.place) this.cb.onPlaceClick?.(o.place); else if (o.city) this.cb.onCityClick?.(o.city); });
    this.labelLayer.appendChild(el); o.el = el; o.v = new THREE.Vector3(o.x, o.y, o.z); o.scene = o.scene || 'map'; this.labels.push(o); return o;
  }
  markDone(ids) { for (const l of this.labels) if (l.place) l.el.classList.toggle('done', ids.has(l.place.id)); }
  updateLabels() {
    const w = this.W, h = this.H; const cam = this.camera.position; const sceneKey = this.mode === 'world' ? 'world' : 'map';
    const near = this.mode === 'map' && this.mount !== 'orbit';
    for (const l of this.labels) {
      if (l.scene !== sceneKey || this.paused || this.mode === 'home') { if (l.vis !== false) { l.el.style.display = 'none'; l.vis = false; } continue; }
      const d = cam.distanceTo(l.v); const v = l.v.clone().project(this.camera);
      const maxD = l.kind === 'city' ? (near ? 45 : 170) : l.kind === 'peer' ? 80 : (near ? 70 : 400);
      const show = v.z < 1 && v.x > -1.1 && v.x < 1.1 && v.y > -1.1 && v.y < 1.1 && d < maxD;
      if (!show) { if (l.vis !== false) { l.el.style.display = 'none'; l.vis = false; } continue; }
      if (l.vis !== true) { l.el.style.display = ''; l.vis = true; }
      const sc = Math.max(.62, Math.min(1.05, 60 / d + .45));
      l.el.style.transform = `translate(${(v.x * .5 + .5) * w}px, ${(-v.y * .5 + .5) * h}px) translate(-50%,-100%) scale(${sc})`;
      l.el.style.zIndex = String(1000 - Math.round(d));
    }
  }

  // ---------- басқа оқушылар ----------
  setPeers(list) {
    const seen = new Set();
    for (const p of list) {
      if (!p.presence || p.presence.view !== 'map' || p.presence.x == null) continue;
      seen.add(p.sid); let e = this.peers.get(p.sid);
      if (!e) {
        const grp = new THREE.Group(); const kind = p.presence.mount === 'eagle' ? 'eagle' : 'horse';
        const prof = { char: p.char, color: p.color }; let mnt, R = null, F = null;
        if (kind === 'horse') { R = this.makeRider(prof, p.color); grp.add(R.g); mnt = R.h; } else { F = this.makeFlyer(prof); grp.add(F.g); mnt = { mixer: null }; }
        const ring = new THREE.Mesh(new THREE.RingGeometry(.7, .85, 32), new THREE.MeshBasicMaterial({ color: p.color || '#fff', transparent: true, opacity: .8, depthWrite: false })); ring.rotation.x = -Math.PI / 2; ring.position.y = .05; grp.add(ring);
        this.mapScene.add(grp);
        const lab = this.addLabel({ kind: 'peer', x: 0, y: 0, z: 0, title: '' }); lab.el.className = 'plabel peer'; lab.el.style.setProperty('--pc', p.color || '#fff');
        e = { grp, lab, kind, R, F, cur: new THREE.Vector3(p.presence.x, p.presence.y, p.presence.z), h: p.presence.h || 0, mixer: mnt.mixer };
        this.peers.set(p.sid, e); grp.position.copy(e.cur);
      }
      if ((p.presence.mount === 'eagle' ? 'eagle' : 'horse') !== e.kind) { this.removePeer(p.sid); continue; }
      e.target = new THREE.Vector3(p.presence.x, p.presence.y, p.presence.z); e.th = p.presence.h || 0;
      e.lab.el.textContent = `${p.name} · ${p.cls} · ★${p.stars || 0} · ${p.points || 0} ұпай`;
    }
    for (const sid of [...this.peers.keys()]) if (!seen.has(sid)) this.removePeer(sid);
  }
  removePeer(sid) {
    const e = this.peers.get(sid); if (!e) return; this.mapScene.remove(e.grp); e.lab.el.remove();
    this.labels = this.labels.filter(l => l !== e.lab); if (e.mixer) this.mixers = this.mixers.filter(m => m !== e.mixer); this.peers.delete(sid);
  }

  // ---------- енгізу ----------
  bindInput() {
    addEventListener('keydown', (e) => { if (e.target.closest('input,select,textarea')) return; if ((e.code === 'KeyW' || e.code === 'ArrowUp') && !e.repeat) this.tap = Math.min(8, (this.tap || 0) + 1); this.keys[e.code] = true; if (e.code === 'KeyE') this.cb.onAction?.(); if (e.code === 'Space' && this.mode !== 'home') e.preventDefault(); });
    addEventListener('keyup', (e) => { this.keys[e.code] = false; });
    let drag = null;
    this.canvas.addEventListener('pointerdown', (e) => { if (this.controls.enabled) return; drag = { x: e.clientX, y: e.clientY }; });
    addEventListener('pointerup', () => { drag = null; });
    addEventListener('pointermove', (e) => { if (!drag) return; this.camYaw -= (e.clientX - drag.x) * .006; this.camPitch = Math.max(this.mode === 'world' ? -.45 : .05, Math.min(1.2, this.camPitch + (e.clientY - drag.y) * .004)); drag = { x: e.clientX, y: e.clientY }; });
    this.canvas.addEventListener('wheel', (e) => { if (this.controls.enabled) return; this.camDist = Math.max(3, Math.min(30, this.camDist * (1 + Math.sign(e.deltaY) * .1))); }, { passive: true });
    const joy = (padId, knobId) => {
      const pad = document.getElementById(padId), knob = document.getElementById(knobId); if (!pad) return;
      let id = null; const R = 50;
      const move = (e) => { const r = pad.getBoundingClientRect(); let dx = e.clientX - r.left - r.width / 2, dy = e.clientY - r.top - r.height / 2; const l = Math.hypot(dx, dy); if (l > R) { dx *= R / l; dy *= R / l; } knob.style.transform = `translate(${dx}px,${dy}px)`; this.joy = { x: dx / R, y: -dy / R }; };
      pad.addEventListener('pointerdown', (e) => { id = e.pointerId; pad.setPointerCapture(id); move(e); this.tap = Math.min(8, (this.tap || 0) + 1); });
      pad.addEventListener('pointermove', (e) => { if (e.pointerId === id) move(e); });
      const end = () => { id = null; knob.style.transform = ''; this.joy = { x: 0, y: 0 }; };
      pad.addEventListener('pointerup', end); pad.addEventListener('pointercancel', end);
    };
    joy('joy', 'knob'); joy('joy2', 'knob2');
    const hold = (id, k) => { const b = document.getElementById(id); if (!b) return; b.addEventListener('pointerdown', () => { this.btn[k] = true; }); ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => b.addEventListener(ev, () => { this.btn[k] = false; })); };
    hold('tUp', 'up'); hold('tDown', 'down');
    ['tE', 'tE2'].forEach(id => document.getElementById(id)?.addEventListener('click', () => this.cb.onAction?.()));
  }
  resize() {
    this.W = innerWidth; this.H = innerHeight; this.renderer.setSize(this.W, this.H, false);
    this.camera.aspect = this.W / this.H; this.camera.updateProjectionMatrix();
  }

  // ---------- режимдер ----------
  setMode(mode) {
    this.mode = mode; this.paused = false;
    if (mode === 'home') { this.scene = this.mapScene; this.controls.enabled = true; this.controls.enableZoom = false; this.controls.autoRotate = true; this.controls.autoRotateSpeed = .35; this.controls.target.set(4, 0, 2); this.camera.position.set(-30, 95, 120); }
    else if (mode === 'map') { this.scene = this.mapScene; this.controls.autoRotate = false; this.controls.enableZoom = true; this.setMount(this.mount); }
    else if (mode === 'world') { this.controls.enabled = false; this.controls.autoRotate = false; }
    else if (mode === 'page') { this.paused = true; }
  }

  // ---------- кадр ----------
  frame() {
    const dt = Math.min(.1, this.clock.getDelta()); this.t += dt; this.tap = Math.max(0, (this.tap || 0) - dt * 1.1); this.boostMul = 1 + Math.min(1.3, (this.tap || 0) * .22);
    if (this.paused) { this.updateLabels(); return; }
    for (const m of this.mixers) m.update(dt);
    if (this.oceanMat) this.oceanMat.uniforms.t.value = this.t;
    for (const s of this.floaters || []) s.position.y = s.userData.base + Math.sin(this.t + s.userData.ph) * .6;
    if (this.scene === this.mapScene) {
      for (const c of this.clouds) { c.position.x += dt * .8; if (c.position.x > 140) c.position.x = -140; }
      for (const o of this.placeObjs) { const s = 1 + Math.sin(this.t * 2 + o.x) * .08; o.ring.scale.set(s, s, s); o.g.traverse(ch => { if (ch.name === 'spin') ch.rotation.y += dt * .6; if (ch.name === 'flame') ch.scale.y = 1 + Math.sin(this.t * 20) * .15; }); }
      if (this.mode === 'map' && this.mount !== 'orbit') this.updatePlayer(dt);
      else if (this.controls.enabled) { this.controls.update(); if (this.riderSet) this.syncRider(this.riderSet, this.t, 0); }
      this.updatePeers(dt);
      if (this.playerGroup) { const P = this.player; this.sun.position.set(P.x - 40, 80, P.z + 30); this.sun.target.position.set(P.x, 0, P.z); if (this.mode === 'home') { this.sun.position.set(-50, 90, 40); this.sun.target.position.set(0, 0, 0); } }
    } else if (this.world) this.updateWorld(dt);
    this.renderer.render(this.scene, this.camera);
    this.updateLabels();
  }
  input() {
    const k = this.keys;
    const fwd = (k.KeyW || k.ArrowUp ? 1 : 0) - (k.KeyS || k.ArrowDown ? 1 : 0) + this.joy.y;
    const turn = (k.KeyA || k.ArrowLeft ? 1 : 0) - (k.KeyD || k.ArrowRight ? 1 : 0) - this.joy.x;
    const up = (k.Space || this.btn.up ? 1 : 0) - (k.KeyC || this.btn.down ? 1 : 0);
    return { fwd: Math.max(-1, Math.min(1, fwd)), turn: Math.max(-1, Math.min(1, turn)), up, boost: k.ShiftLeft || k.ShiftRight || Math.hypot(this.joy.x, this.joy.y) > .95 };
  }
  updatePlayer(dt) {
    const P = this.player; if (!this.playerGroup) return;
    const I = this.input(); const fly = this.mount === 'eagle';
    const bm = this.boostMul || 1;
    const maxV = (fly ? (I.boost ? 160 : 110) : (I.boost ? 70 : 45)) * bm;
    const minV = 0;
    if (I.fwd > 0) P.speed += (fly ? 45 : 40) * dt * I.fwd * bm; else if (I.fwd < 0) P.speed += 60 * dt * I.fwd; else P.speed -= (fly ? 22 : 18) * dt;
    if (fly) { P.vy += (I.up * 3.2 - P.vy * 1.6) * dt * 2; if (P.vy < -.5) P.speed += -P.vy * 25 * dt; }
    P.speed = Math.max(minV, Math.min(P.speed, fly && P.vy < -.5 ? 260 : maxV)); if (P.speed > maxV) P.speed = maxV;
    if (!fly && P.speed > maxV) P.speed = maxV;
    P.h += I.turn * dt * (fly ? 1.1 : 1.7) * (P.speed > 2 || fly ? 1 : .6);
    const units = P.speed * dt * TIME_SCALE / 3600 / KM_PER_UNIT;
    const nx = P.x + Math.sin(P.h) * units, nz = P.z + Math.cos(P.h) * units;
    const ll = unproj(nx, nz); const m = this.maskAt(ll.lon, ll.lat);
    const ground = this.heightAt(nx, nz);
    if (fly) {
      if (Math.abs(nx) < 120 && Math.abs(nz) < 80) { P.x = nx; P.z = nz; P.km += units * KM_PER_UNIT; }
      P.y = Math.max(Math.max(ground, -.9) + .9, Math.min(16, P.y + P.vy * dt * 2));
    } else {
      if (m === 1) { P.x = nx; P.z = nz; P.km += units * KM_PER_UNIT; P.y = ground; }
      else { P.speed = 0; this.cb.onBlocked?.(m === 2 ? 'lake' : 'border'); }
    }
    P.hours += dt * TIME_SCALE / 3600 * (P.speed > 0 ? 1 : 0);
    const G = this.playerGroup; G.position.set(P.x, P.y, P.z); G.rotation.y = P.h;
    G.rotation.z = fly ? -I.turn * .35 : 0; G.rotation.x = fly ? -P.vy * .12 : 0;
    if (this.horse.mixer) this.horse.mixer.timeScale = fly ? 1 : Math.min(1.6, P.speed / 35);
    if (!fly) this.syncRider(this.riderSet, this.t, Math.min(1, P.speed / 30));
    else { AC.animateEagle(this.flyer.e, this.t, I.fwd > 0 || I.up > 0 || P.speed < 8 ? .95 : .25, I.turn); AC.animateMascot(this.flyer.rider, this.t, 0, true); }
    this.playerHalo.visible = !fly;
    // камера
    const yaw = P.h + Math.PI + this.camYaw; const dist = this.camDist;
    const target = new THREE.Vector3(P.x, P.y + (fly ? .5 : .95), P.z);
    const cp = new THREE.Vector3(target.x + Math.sin(yaw) * dist * Math.cos(this.camPitch), target.y + dist * Math.sin(this.camPitch) + .6, target.z + Math.cos(yaw) * dist * Math.cos(this.camPitch));
    cp.y = Math.max(cp.y, this.heightAt(cp.x, cp.z) + .6);
    this.camera.position.lerp(cp, 1 - Math.exp(-dt * 5)); this.camera.lookAt(target);
    this.camYaw *= (1 - dt * .6);
    if ((this._hudT = (this._hudT || 0) + dt) > .1) { this._hudT = 0; this.emitHud(); }
  }
  emitHud() {
    const P = this.player; const ll = unproj(P.x, P.z);
    const ground = this.heightAt(P.x, P.z);
    const altM = Math.round(Math.max(P.y, this.mount === 'eagle' ? P.y : ground) * M_PER_HUNIT);
    let best = null;
    for (const o of this.placeObjs) { const d = haversine(ll.lon, ll.lat, o.p.lon, o.p.lat); if (!best || d < best.d) best = { d, p: o.p }; }
    let city = null; for (const c of this.data.cities) { const d = haversine(ll.lon, ll.lat, c.lon, c.lat); if (!city || d < city.d) city = { d, c }; }
    best.bearing = bearing(ll.lon, ll.lat, best.p.lon, best.p.lat);
    const head = ((Math.PI - P.h) * 180 / Math.PI % 360 + 360) % 360;
    this.cb.onHud?.({ speed: P.speed, alt: altM, groundM: Math.round(ground * M_PER_HUNIT), km: P.km, hours: P.hours, head, lon: ll.lon, lat: ll.lat, nearest: best, city, mount: this.mount, vy: P.vy, boost: this.boostMul || 1, hover: this.mount === 'eagle' && P.speed < 3 });
  }
  updatePeers(dt) {
    for (const e of this.peers.values()) {
      if (e.target) { e.grp.position.lerp(e.target, 1 - Math.exp(-dt * 4)); let dh = e.th - e.grp.rotation.y; dh = Math.atan2(Math.sin(dh), Math.cos(dh)); e.grp.rotation.y += dh * Math.min(1, dt * 4); }
      e.lab.v.copy(e.grp.position).y += e.kind === 'eagle' ? 1.1 : 1.75;
      if (e.R) this.syncRider(e.R, this.t, 1); if (e.F) { AC.animateEagle(e.F.e, this.t, .5); AC.animateMascot(e.F.rider, this.t, 0, true); }
    }
  }
  presence() {
    const P = this.player; return { x: +P.x.toFixed(2), y: +P.y.toFixed(2), z: +P.z.toFixed(2), h: +P.h.toFixed(2), mount: this.mount === 'eagle' ? 'eagle' : 'horse' };
  }
  teleportTo(place) { const p = proj(place.lon, place.lat); Object.assign(this.player, { x: p.x + 2.2, z: p.z + 2.2, h: Math.atan2(-2.2, -2.2), speed: 0 }); this.player.y = this.heightAt(this.player.x, this.player.z) + (this.mount === 'eagle' ? 4 : 0); }

  // ======================= ВИРТУАЛДЫ ӘЛЕМ =======================
  enterWorld(place, solvedIdx, simDone) {
    this.exitWorldScene();
    const S = new THREE.Scene(); this.worldScene = S; this.scene = S; this.setMode('world'); S.environment = this.envTex;
    const theme = { canyon_red: [0xb8673f, 0xd9895a], canyon_white: [0xe8dcc6, 0xcfbfa5], sea: [0xdcc89b, 0xcab57f], mountain: [0x5d8a4a, 0x7a9a5a], rocket: [0xcdb486, 0xb89e70], mausoleum: [0xd9c08c, 0xc4a874], ancient: [0xd2b07e, 0xbf9b68], lake: [0x8fae5c, 0x7d9a4c] }[place.model] || [0x6fa34a, 0x86b55a];
    S.fog = new THREE.Fog(0xcfe8ff, 70, 240);
    S.add(this.makeSky());
    S.add(new THREE.HemisphereLight(0xdff0ff, 0x4a5a2a, .8));
    const sun = new THREE.DirectionalLight(0xfff0d0, 2.6); sun.position.set(-30, 50, 25); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -.0005;
    Object.assign(sun.shadow.camera, { left: -55, right: 55, top: 55, bottom: -55, far: 160 }); S.add(sun);
    // жер
    const gtex = (() => { const N = 256, c = document.createElement('canvas'); c.width = c.height = N; const g = c.getContext('2d'); const img = g.createImageData(N, N); const A = new THREE.Color(theme[0]), B = new THREE.Color(theme[1]);
      for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const u = i / N * 8, v = j / N * 8; const n = (vnoise(u, v) + vnoise(u * 2.7, v * 2.7) * .5 + vnoise(u * 9, v * 9) * .25) / 1.75; const t = Math.min(1, Math.max(0, n)); const k = .92 + vnoise(u * 23, v * 23) * .12; const o = (j * N + i) * 4;
        img.data[o] = (A.r + (B.r - A.r) * t) * 255 * k; img.data[o + 1] = (A.g + (B.g - A.g) * t) * 255 * k; img.data[o + 2] = (A.b + (B.b - A.b) * t) * 255 * k; img.data[o + 3] = 255; }
      g.putImageData(img, 0, 0); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(24, 24); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; })();
    const ground = new THREE.Mesh(new THREE.CircleGeometry(240, 64), new THREE.MeshStandardMaterial({ map: gtex, roughness: 1, envMapIntensity: .3 })); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; S.add(ground);
    { const tuft = new THREE.ConeGeometry(.12, .6, 3); const im = new THREE.InstancedMesh(tuft, new THREE.MeshStandardMaterial({ color: new THREE.Color(theme[0]).multiplyScalar(.8), roughness: 1, flatShading: true }), 1400); const d = new THREE.Object3D();
      for (let i = 0; i < 1400; i++) { const a = Math.random() * 6.28, r = 20 + Math.random() * 90; d.position.set(Math.cos(a) * r, .25, Math.sin(a) * r); d.rotation.set((Math.random() - .5) * .4, Math.random() * 3, 0); d.scale.setScalar(.6 + Math.random()); d.updateMatrix(); im.setMatrixAt(i, d.matrix); } S.add(im); }
    for (let i = 0; i < 26; i++) { const a = i / 26 * Math.PI * 2; const m = MD.mountain(14 + Math.random() * 22, 16 + Math.random() * 10, i); m.position.set(Math.cos(a) * (120 + Math.random() * 40), 0, Math.sin(a) * (120 + Math.random() * 40)); S.add(m); }
    // ақ мәрмәр алаң (жүру аймағы)
    const plaza = new THREE.Mesh(new THREE.CircleGeometry(19, 72), new THREE.MeshStandardMaterial({ color: 0xf4efe4, roughness: .55, map: this.plazaTex() })); plaza.rotation.x = -Math.PI / 2; plaza.position.set(0, .02, -2); plaza.receiveShadow = true; S.add(plaza);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(19, .18, 8, 96), MD.MAT.gold()); rim.rotation.x = Math.PI / 2; rim.position.set(0, .05, -2); S.add(rim);
    // негізгі нысан
    const lm = MD.buildLandmark(place.model); lm.scale.setScalar(place.model === 'mountain' ? 2.2 : place.model === 'yurt_village' ? 1.6 : 2.6); lm.position.set(0, 0, -36);
    lm.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); S.add(lm); this.worldLandmark = lm;
    this.rocketLaunch = null;
    this.addMathProps(S, place, lm);
    // қақпалар + формула кітаптары
    this.gates = [];
    const gpos = [[-12.5, -7], [0, -14], [12.5, -7]];
    place.tasks.forEach((t, i) => {
      const g = AC.kazakhGate(i + 1, t.s); g.position.set(gpos[i][0], 0, gpos[i][1]); g.lookAt(0, 0, 8); S.add(g);
      const bk = (BOOKS[place.id] || [])[i] || { n: t.s, f: '', pop: 'triangle', e: '' };
      const book = makeBook(bk, { place: place.name, subject: t.s, grade: t.g, task: t.t, solution: t.e, answer: `${String(t.a).replace('.', ',')} ${t.u}`.trim(), no: `${place.name} · ${i + 1}-кітап` }, [0x16306e, 0x7a1e2c, 0x0f5f4c][i]);
      book.scale.setScalar(.42); book.position.set(0, 1.42, 0); book.rotation.x = .55; g.userData.ped.add(book);
      const st = { g, i, x: gpos[i][0], z: gpos[i][1], open: false, anim: 0, leaves: g.userData.leaves, book, bookT: 0, glow: g.userData.ped.getObjectByName('glow') };
      this.gates.push(st); if (solvedIdx.includes(i)) this.openGate(i, true);
    });
    // қайту порталы
    const portal = new THREE.Group(); const ring = new THREE.Mesh(new THREE.TorusGeometry(2.4, .22, 16, 64), MD.MAT.gold()); ring.position.y = 2.7; portal.add(ring);
    const disk = new THREE.Mesh(new THREE.CircleGeometry(2.3, 48), new THREE.ShaderMaterial({ transparent: true, side: THREE.DoubleSide, uniforms: { t: { value: 0 } }, vertexShader: 'varying vec2 vU; void main(){vU=uv-.5; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}', fragmentShader: 'uniform float t; varying vec2 vU; void main(){ float r=length(vU)*2.; float a=atan(vU.y,vU.x); float s=sin(a*6.+r*14.-t*5.)*.5+.5; vec3 c=mix(vec3(.2,.9,1.),vec3(1.,.8,.3),s); gl_FragColor=vec4(c,(1.-r)*.85+.1); }' }));
    disk.position.y = 2.7; portal.add(disk); portal.position.set(0, 0, 32); portal.userData.disk = disk; S.add(portal); this.exitPortal = portal;
    // ақпарат тақтасы және симулятор станциясы
    S.add(this.makeInfoBoard(place, -14, 6));
    this.station = this.makeStation(simDone); this.station.position.set(14, 0, 6); S.add(this.station);
    [[-28, 8], [29, 6], [-24, 24], [26, 22]].forEach(([x, z]) => { const y = MD.yurt(1.3); y.position.set(x, 0, z); y.rotation.y = -Math.atan2(x, z); S.add(y); });
    this.worldHorses = [];
    for (let i = 0; i < 2; i++) { const hm = this.cloneMount('horse'); hm.obj.scale.multiplyScalar(1.8); hm.obj.position.set(22 + i * 4, 0, 32 + i * 2); hm.obj.rotation.y = -1.2; if (hm.mixer) hm.mixer.timeScale = .25; S.add(hm.obj); this.worldHorses.push(hm); }
    this.floatersWorld = this.makeMathSymbols(S, 14, 30, 9); this.floaters = this.floaters.filter(f => !this.floatersWorld.includes(f));
    const pg = new THREE.BufferGeometry(); const pp = []; for (let i = 0; i < 500; i++) pp.push((Math.random() - .5) * 70, Math.random() * 14, (Math.random() - .5) * 70);
    pg.setAttribute('position', new THREE.Float32BufferAttribute(pp, 3));
    this.dust = new THREE.Points(pg, new THREE.PointsMaterial({ color: 0xffe9a8, size: .1, transparent: true, opacity: .7, blending: THREE.AdditiveBlending, depthWrite: false })); S.add(this.dust);
    // ойыншы — атқа мінген маскот
    const prof = this.profile || {};
    this.meRide = this.makeRider(prof); this.me = this.meRide.g; this.me.scale.setScalar(1.75); this.me.position.set(0, 0, 13); this.me.rotation.y = Math.PI; S.add(this.me);
    if (this.meRide.h.mixer) this.meRide.h.mixer.timeScale = 0;
    this.wp = { x: 0, z: 13, h: Math.PI, v: 0, y: 0, vy: 0 };
    this.meFlyer = this.makeFlyer(prof); this.meFlyer.g.scale.setScalar(2.1); this.meFlyer.g.visible = false; S.add(this.meFlyer.g);
    this.wMount = 'horse'; this.wpeers = new Map();
    this.colliders = [{ x: 0, z: -36, r: place.model === 'mountain' ? 22 : place.model === 'yurt_village' ? 12 : 11 }, ...gpos.flatMap(([x, z]) => { const a = Math.atan2(-x, 8 - z); const cx = Math.cos(a), sx = Math.sin(a); return [{ x: x - cx * 1.9, z: z + sx * 1.9, r: .7 }, { x: x + cx * 1.9, z: z - sx * 1.9, r: .7 }, { x, z, r: 1.5 }, { x: x - sx * 1.6, z: z - cx * 1.6, r: 1 }]; }), { x: -28, z: 8, r: 3 }, { x: 29, z: 6, r: 3 }, { x: -24, z: 24, r: 3 }, { x: 26, z: 22, r: 3 }, { x: -14, z: 6, r: 1.4 }, { x: 14, z: 6, r: 1.6 }];
    this.world = { place }; if (this.textHidden) this.setTextVisible(false);
    this.camera.position.set(0, 6, 23); this.camera.lookAt(0, 2.4, 8); this.camYaw = 0; this.camPitch = .32;
  }
  plazaTex() {
    const c = document.createElement('canvas'); c.width = c.height = 1024; const g = c.getContext('2d');
    g.fillStyle = '#f4efe4'; g.fillRect(0, 0, 1024, 1024); g.translate(512, 512);
    g.strokeStyle = 'rgba(200,150,62,.55)'; g.lineWidth = 6; for (const r of [500, 420, 140]) { g.beginPath(); g.arc(0, 0, r, 0, 7); g.stroke(); }
    g.lineWidth = 3; for (let i = 0; i < 16; i++) { g.save(); g.rotate(i * Math.PI / 8); g.beginPath(); g.moveTo(0, 150); g.lineTo(0, 410); g.stroke(); g.beginPath(); g.moveTo(0, 440); g.bezierCurveTo(0, 470, -30, 470, -26, 452); g.moveTo(0, 440); g.bezierCurveTo(0, 470, 30, 470, 26, 452); g.stroke(); g.restore(); }
    g.font = 'italic 600 70px "Noto Serif", Georgia, serif'; g.fillStyle = 'rgba(15,27,61,.55)'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('π r²', 0, 0);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
  }
  /** Нысан жанындағы математика: сызғыш, өлшем сызықтары, голограмма-пішін, транспортир, формула */
  addMathProps(S, place, lm) {
    const M = MATH[place.id]; if (!M) return;
    lm.updateMatrixWorld(true); const bb = new THREE.Box3().setFromObject(lm); const sz = bb.getSize(new THREE.Vector3()); const c = bb.getCenter(new THREE.Vector3());
    let Hw = sz.y; if (place.model === 'mountain') Hw = sz.y;
    const holoM = new THREE.LineBasicMaterial({ color: 0x14c6d0, transparent: true, opacity: .9 });
    const fx = bb.max.x + 3.5;
    if (M.H) {
      const r = AC.bigRuler(Hw, M.H, M.step); r.position.set(fx, 0, c.z + 2); r.rotation.y = -.25; S.add(r);
      S.add(AC.dimLine(new THREE.Vector3(fx - 1.6, 0.05, c.z + 4), new THREE.Vector3(fx - 1.6, Hw, c.z + 4), `h = ${M.H.toLocaleString('ru-RU')} м`));
      // транспортир: бақылаушы нүктесінен ұшына қарау бұрышы
      const px = -13, pz = c.z + 17; const dx = c.x - px, dz = c.z - pz; const dist = Math.hypot(dx, dz); const ang = Math.atan2(Hw, dist) * 180 / Math.PI;
      const pr = AC.protractor(ang, Math.hypot(dist, Hw)); pr.position.set(px, .02, pz); pr.rotation.y = Math.atan2(dz / dist, -dx / dist); S.add(pr);
      const dReal = dist * M.H / Hw; const lab = AC.textSprite([`α ≈ ${Math.round(ang)}°`, `tg α = h : d = ${M.H} : ${Math.round(dReal)}`], { size: 40, scale: 1.4 }); lab.position.set(px, 4.2, pz); S.add(lab);
      S.add(AC.dimLine(new THREE.Vector3(px, .15, pz), new THREE.Vector3(c.x, .15, c.z), `d ≈ ${Math.round(dReal)} м`, 0xc8963e));
    }
    if (M.holo) {
      let geo, pos = new THREE.Vector3(c.x, 0, c.z);
      if (M.holo === 'pyramid') { geo = new THREE.ConeGeometry(sz.x * .62, sz.y * 1.02, 4, 1); geo.rotateY(Math.PI / 4); pos.y = sz.y * .51; }
      else if (M.holo === 'cone') { geo = new THREE.ConeGeometry(Math.max(sz.x, sz.z) * .52, sz.y * 1.02, 32, 4); pos.y = sz.y * .51; }
      else if (M.holo === 'sphere') { const r = place.id === 'otyrar' ? 6 : sz.x * .19; geo = new THREE.SphereGeometry(r, 24, 12); pos.y = place.id === 'otyrar' ? 13 : bb.max.y - r * .95; if (place.id === 'otyrar') pos.z += 5; }
      else if (M.holo === 'dome') { const r = Math.min(sz.x, sz.z) * .36; geo = new THREE.SphereGeometry(r, 24, 8, 0, Math.PI * 2, 0, Math.PI / 2); pos.y = bb.max.y - r * 1.1; }
      if (geo) { const w = new THREE.LineSegments(new THREE.EdgesGeometry(geo, 1), holoM); if (M.holo === 'sphere' || M.holo === 'dome') { w.geometry.dispose(); w.geometry = new THREE.WireframeGeometry(geo); } w.position.copy(pos); w.name = 'holo'; S.add(w); this.holo = w; }
      if (M.holo === 'pyramid' || M.holo === 'cone') S.add(AC.dimLine(new THREE.Vector3(bb.min.x, .1, bb.max.z + 1.5), new THREE.Vector3(bb.max.x, .1, bb.max.z + 1.5), place.id === 'pyramid' ? 'a = 62 м' : 'd ≈ 200 м', 0xc8963e));
    }
    const banner = AC.textSprite([M.shape, M.formula], { size: 52, scale: 2.2 }); banner.position.set(c.x, bb.max.y + 4.5, c.z); S.add(banner);
  }
  makeInfoBoard(place, x, z) {
    const g = new THREE.Group(); const c = document.createElement('canvas'); c.width = 900; c.height = 600; const k = c.getContext('2d'); const M = MATH[place.id] || { lines: [], formula: '' };
    k.fillStyle = '#ffffff'; k.beginPath(); k.roundRect(6, 6, 888, 588, 36); k.fill(); k.strokeStyle = '#c8963e'; k.lineWidth = 8; k.stroke();
    k.fillStyle = '#c8963e'; k.font = `800 26px ${AC.FONT_D}`; k.fillText('МАТЕМАТИКАЛЫҚ ПАСПОРТ', 44, 70);
    k.fillStyle = '#0f1b3d'; k.font = `800 44px ${AC.FONT_D}`; k.fillText(place.name.length > 30 ? place.name.slice(0, 29) + '…' : place.name, 44, 128);
    k.fillStyle = '#fff7e3'; k.beginPath(); k.roundRect(44, 160, 812, 100, 22); k.fill(); k.fillStyle = '#12245a'; k.font = `italic 600 46px "Noto Serif", Georgia, serif`; k.fillText(M.formula.length > 34 ? M.formula.slice(0, 34) : M.formula, 70, 226);
    k.font = `500 30px ${AC.FONT_B}`; let y = 320; for (const l of M.lines.slice(0, 4)) { k.fillStyle = '#0f8b8d'; k.beginPath(); k.arc(58, y - 10, 7, 0, 7); k.fill(); k.fillStyle = '#1d2742'; k.fillText(l.length > 50 ? l.slice(0, 49) + '…' : l, 78, y); y += 64; }
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
    const pl = new THREE.Mesh(new THREE.PlaneGeometry(6.6, 4.4), new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide })); pl.position.y = 3.8; g.add(pl);
    const frame = new THREE.Mesh(new THREE.BoxGeometry(6.9, 4.7, .12), MD.MAT.gold()); frame.position.set(0, 3.8, -.08); g.add(frame);
    for (const sx of [-2.6, 2.6]) { const post = new THREE.Mesh(new THREE.CylinderGeometry(.09, .12, 1.6), MD.MAT.gold()); post.position.set(sx, .8, -.1); g.add(post); }
    g.position.set(x, 0, z); g.lookAt(0, 0, 16); return g;
  }
  makeStation(done) {
    const g = new THREE.Group();
    const base = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.6, 1, 8), MD.MAT.marble()); base.position.y = .5; base.castShadow = true; g.add(base);
    const top = new THREE.Mesh(new THREE.CylinderGeometry(1.45, 1.3, .16, 8), MD.MAT.gold()); top.position.y = 1.08; g.add(top);
    const core = new THREE.Mesh(new THREE.IcosahedronGeometry(.75, 1), new THREE.MeshPhysicalMaterial({ color: done ? 0x3fbf6a : 0x14c6d0, metalness: .2, roughness: .1, transmission: 0, emissive: done ? 0x1a6a3a : 0x0a6a78, emissiveIntensity: .8, flatShading: true })); core.position.y = 2.6; core.name = 'core'; g.add(core);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.2, .05, 8, 48), MD.MAT.gold()); ring.position.y = 2.6; ring.name = 'ring'; g.add(ring);
    const sp = AC.textSprite(['Симулятор', done ? 'орындалды ✓' : 'жақында кел · E'], { size: 40, scale: .9, stroke: '#0f8b8d' }); sp.position.y = 4.3; g.add(sp);
    return g;
  }
  setStationDone() { if (!this.station) return; const c = this.station.getObjectByName('core'); c.material.color.set(0x3fbf6a); c.material.emissive.set(0x1a6a3a); }
  openGate(i, instant) {
    const G = this.gates[i]; if (!G || G.open) return; G.open = true;
    if (instant) { G.anim = 1; G.bookT = 1; this.applyGate(G); } else { G.anim = 0; G.bookT = 0; }
  }
  applyGate(G) {
    const k = 1 - Math.pow(1 - G.anim, 3);
    for (const { hinge, sx } of G.leaves) hinge.rotation.y = sx * k * 1.85;
    G.book.userData.setOpen(G.bookT); G.book.position.y = 1.42 + Math.sin(Math.min(1, G.bookT) * Math.PI) * .6;
    if (G.glow) G.glow.material.opacity = G.open ? .22 : .1;
  }
  /** Байқоңыр: 3D зымыран ұшыру */
  launchRocket(par, onTick) {
    const R = this.worldLandmark?.getObjectByName('rocketBody'); if (!R) return false;
    const m0 = (40 + (par?.fuel || 200)) * 1000, F = (par?.F || 4) * 1e6; const a = Math.max(0, (F - m0 * 9.81) / m0);
    if (!this.smoke) { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); const gr = g.createRadialGradient(32, 32, 2, 32, 32, 30); gr.addColorStop(0, 'rgba(255,255,255,.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); this.smokeTex = new THREE.CanvasTexture(c); }
    this.rocketLaunch = { R, a, t: -3, y0: R.position.y, puffs: [], onTick, m0, F };
    return true;
  }
  updateRocket(dt) {
    const L = this.rocketLaunch; if (!L) return; L.t += dt;
    if (L.t < 0) { L.onTick?.({ cd: Math.ceil(-L.t) }); return; }
    const realT = L.t * 4; const h = .5 * L.a * realT * realT; const v = L.a * realT;
    L.R.position.y = L.y0 + h / 40; // 40 м = 1 бірлік (модель масштабы)
    const fl = L.R.getObjectByName('flame'); if (fl) { fl.scale.set(1.4, 2 + Math.sin(this.t * 30) * .4, 1.4); }
    if (L.a > 0 && L.puffs.length < 160) for (let i = 0; i < 3; i++) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.smokeTex, transparent: true, opacity: .8, depthWrite: false })); const wp = new THREE.Vector3(); L.R.getWorldPosition(wp); sp.position.set(wp.x + (Math.random() - .5) * 3, Math.max(.5, wp.y - 1), wp.z + (Math.random() - .5) * 3); sp.scale.setScalar(2 + Math.random() * 2); sp.userData.v = new THREE.Vector3((Math.random() - .5) * 6, Math.random() * 1.5, (Math.random() - .5) * 6); this.worldScene.add(sp); L.puffs.push(sp); }
    for (const p of L.puffs) { p.position.addScaledVector(p.userData.v, dt); p.scale.multiplyScalar(1 + dt * .5); p.material.opacity *= (1 - dt * .35); }
    L.onTick?.({ t: realT, v, h, a: L.a });
    if (L.a === 0 && L.t > 3) { L.onTick?.({ fail: true }); this.resetRocket(); }
    else if (L.R.position.y > 400) this.resetRocket();
  }
  resetRocket() { const L = this.rocketLaunch; if (!L) return; L.R.position.y = L.y0; for (const p of L.puffs) { this.worldScene?.remove(p); p.material.dispose(); } const fl = L.R.getObjectByName('flame'); if (fl) fl.scale.set(1, 1, 1); L.onTick?.({ end: true }); this.rocketLaunch = null; }
  setWorldMount(m) {
    if (!this.world) return; this.wMount = m; const W = this.wp; const fly = m === 'eagle';
    this.me.visible = !fly; this.meFlyer.g.visible = fly;
    if (fly) { W.y = Math.max(W.y, 5); } else { W.y = 0; W.vy = 0; }
  }
  worldPresence() { const W = this.wp; return W ? { wx: +W.x.toFixed(2), wy: +W.y.toFixed(2), wz: +W.z.toFixed(2), wh: +W.h.toFixed(2), wm: this.wMount } : {}; }
  setWorldPeers(list) {
    if (!this.worldScene) return; const S = this.worldScene; const seen = new Set();
    for (const p of list) {
      const q = p.presence; if (!q || q.view !== 'world' || q.world !== this.world.place.id || q.wx == null) continue;
      seen.add(p.sid); let e = this.wpeers.get(p.sid); const kind = q.wm === 'eagle' ? 'eagle' : 'horse';
      if (e && e.kind !== kind) { this.removeWorldPeer(p.sid); e = null; }
      if (!e) {
        const prof = { char: p.char, color: p.color }; const grp = new THREE.Group(); let R = null, F = null;
        if (kind === 'horse') { R = this.makeRider(prof, p.color); R.g.scale.setScalar(1.75); grp.add(R.g); } else { F = this.makeFlyer(prof); F.g.scale.setScalar(2.1); grp.add(F.g); }
        const lab = AC.textSprite([p.name || 'Оқушы', `★ ${p.stars || 0} · ${p.cls || ''}`], { size: 40, scale: 1.1, stroke: p.color || '#c8963e' }); lab.position.y = kind === 'horse' ? 5.2 : 3.4; grp.add(lab);
        grp.position.set(q.wx, q.wy || 0, q.wz); S.add(grp);
        e = { grp, R, F, kind, lab }; this.wpeers.set(p.sid, e);
      }
      e.target = new THREE.Vector3(q.wx, q.wy || 0, q.wz); e.th = q.wh || 0;
    }
    for (const sid of [...this.wpeers.keys()]) if (!seen.has(sid)) this.removeWorldPeer(sid);
  }
  removeWorldPeer(sid) { const e = this.wpeers?.get(sid); if (!e) return; this.worldScene?.remove(e.grp); if (e.R?.h.mixer) this.mixers = this.mixers.filter(m => m !== e.R.h.mixer); this.wpeers.delete(sid); }
  updateWorld(dt) {
    const W = this.wp, I = this.input(); const fly = this.wMount === 'eagle'; const bm = this.boostMul || 1;
    // ат: W/S — алға/артқа, A/D — бұрылу. Бүркіт: + Space/C — жоғары/төмен, W жібермесең — қалықтап тұрады
    const maxV = (fly ? (I.boost ? 18 : 12) : (I.boost ? 11 : 7)) * bm;
    W.v += (I.fwd * maxV - W.v) * Math.min(1, dt * (fly ? 1.6 : 3));
    W.h += I.turn * dt * (fly ? 1.6 : 2.1) * (Math.abs(W.v) > .3 || fly ? 1 : .8);
    if (fly) { W.vy += (I.up * 7 - W.vy) * Math.min(1, dt * 3); W.y = Math.max(1.6, Math.min(70, W.y + W.vy * dt)); }
    let nx = W.x + Math.sin(W.h) * W.v * dt, nz = W.z + Math.cos(W.h) * W.v * dt;
    if (W.y < 9) for (const c of this.colliders) { const d = Math.hypot(nx - c.x, nz - c.z); if (d < c.r + 1) { nx = c.x + (nx - c.x) / d * (c.r + 1); nz = c.z + (nz - c.z) / d * (c.r + 1); } }
    const R = Math.hypot(nx, nz); const lim = fly ? 115 : 90; if (R > lim) { nx *= lim / R; nz *= lim / R; }
    W.x = nx; W.z = nz;
    if (fly) { const F = this.meFlyer.g; F.position.set(W.x, W.y, W.z); F.rotation.y = W.h; F.rotation.z = -I.turn * .3; F.rotation.x = -W.vy * .05; AC.animateEagle(this.meFlyer.e, this.t, Math.abs(W.v) < 2 || I.up > 0 ? .95 : I.fwd > 0 ? .7 : .3, I.turn); AC.animateMascot(this.meFlyer.rider, this.t, 0, true); }
    this.me.position.set(W.x, 0, W.z); this.me.rotation.y = W.h;
    if (this.meRide.h.mixer) this.meRide.h.mixer.timeScale = fly ? 0 : Math.min(1.6, Math.abs(W.v) / 6);
    this.syncRider(this.meRide, this.t, fly ? 0 : Math.min(1, Math.abs(W.v) / 6));
    for (const e of this.wpeers?.values() || []) { if (e.target) { e.grp.position.lerp(e.target, 1 - Math.exp(-dt * 4)); let dh = e.th - e.grp.rotation.y; dh = Math.atan2(Math.sin(dh), Math.cos(dh)); e.grp.rotation.y += dh * Math.min(1, dt * 4); }
      if (e.R) this.syncRider(e.R, this.t, 1); if (e.F) { AC.animateEagle(e.F.e, this.t, .7); AC.animateMascot(e.F.rider, this.t, 0, true); } }
    // камера аттың артында
    if (this.worldOrbit) { this.controls.update(); this.updateWorldAnims(dt, W); return; }
    const yaw = W.h + Math.PI + this.camYaw; const dist = Math.min(40, this.camDist * 1.8 + 3); const pitch = this.camPitch; const lookUp = pitch < .3 ? Math.min(24, (.3 - pitch) * 38) : 0; const ahead = 9 + lookUp / 24 * 34;
    const tgt = new THREE.Vector3(W.x + Math.sin(W.h + this.camYaw) * ahead, 3.4 + lookUp + W.y, W.z + Math.cos(W.h + this.camYaw) * ahead);
    const cp = new THREE.Vector3(W.x + Math.sin(yaw) * dist * Math.cos(pitch), Math.max(1.4, 2.2 + W.y + dist * Math.sin(pitch)), W.z + Math.cos(yaw) * dist * Math.cos(pitch));
    if (this.rocketLaunch && this.rocketLaunch.t > 0) { const wp = new THREE.Vector3(); this.rocketLaunch.R.getWorldPosition(wp); tgt.lerp(wp.setY(wp.y + 10), .7); }
    this.camera.position.lerp(cp, 1 - Math.exp(-dt * 5)); this.camera.lookAt(tgt); if (!this.keepView) this.camYaw *= (1 - dt * .5);
    this.updateWorldAnims(dt, W);
  }
  updateWorldAnims(dt, W) {
    // анимациялар
    for (const G of this.gates) {
      if (G.open && (G.anim < 1 || G.bookT < 1)) { G.anim = Math.min(1, G.anim + dt * .7); if (G.anim > .5) G.bookT = Math.min(1, G.bookT + dt * .55); this.applyGate(G); }
      if (G.open) G.book.userData.pop.rotation.y += dt * .5;
    }
    this.exitPortal.userData.disk.material.uniforms.t.value = this.t; this.exitPortal.rotation.y = Math.sin(this.t * .5) * .2;
    this.dust.rotation.y += dt * .03;
    for (const s of this.floatersWorld) s.position.y = s.userData.base + Math.sin(this.t + s.userData.ph) * .6;
    this.worldLandmark.traverse(ch => { if (ch.name === 'spin') ch.rotation.y += dt * .6; });
    if (this.holo) this.holo.material.opacity = .55 + Math.sin(this.t * 2.4) * .35;
    if (this.station) { const c = this.station.getObjectByName('core'); c.rotation.y += dt; c.position.y = 2.6 + Math.sin(this.t * 2) * .15; this.station.getObjectByName('ring').rotation.x = this.t; }
    this.updateRocket(dt);
    // жақындық
    let prompt = null; if (W.y > 12) { if (this._prompt) { this._prompt = null; this.cb.onWorldPrompt?.(null); } return; }
    for (const G of this.gates) { const d = Math.hypot(W.x - G.x, W.z - G.z); if (d < 6.2) prompt = G.open ? { type: 'book', i: G.i } : { type: 'gate', i: G.i }; }
    if (Math.hypot(W.x, W.z - 32) < 3.4) prompt = { type: 'exit' };
    if (!prompt && Math.hypot(W.x + 14, W.z - 6) < 4.2) prompt = { type: 'board' };
    if (!prompt && Math.hypot(W.x - 14, W.z - 6) < 4.4) prompt = { type: 'sim' };
    if (JSON.stringify(prompt) !== JSON.stringify(this._prompt)) { this._prompt = prompt; this.cb.onWorldPrompt?.(prompt); }
  }
  exitWorldScene() {
    if (!this.worldScene) return;
    if (this.rocketLaunch) this.rocketLaunch = null;
    this.worldScene.traverse(o => { if (o.geometry) o.geometry.dispose(); });
    for (const h of this.worldHorses || []) this.mixers = this.mixers.filter(m => m !== h.mixer);
    if (this.meRide?.h.mixer) this.mixers = this.mixers.filter(m => m !== this.meRide.h.mixer);
    for (const sid of [...(this.wpeers?.keys() || [])]) this.removeWorldPeer(sid);
    this.setWorldOrbit(false); this.worldScene = null; this.world = null; this.gates = []; this._prompt = null; this.floatersWorld = []; this.holo = null; this.station = null;
  }
  /** 360° шолу: нысанды айнала қарау (OrbitControls) */
  setWorldOrbit(on) {
    this.worldOrbit = !!on; const c = this.controls;
    if (on && this.worldLandmark) { const bb = new THREE.Box3().setFromObject(this.worldLandmark); const sz = bb.getSize(new THREE.Vector3()), ctr = bb.getCenter(new THREE.Vector3());
      c.enabled = true; c.autoRotate = false; c.enableZoom = true; c.minDistance = 4; c.maxDistance = 220; c.maxPolarAngle = 1.62; c.target.set(ctr.x, sz.y * .55, ctr.z); this.camera.position.set(ctr.x + sz.y * .9, sz.y * .75, ctr.z + sz.y * 1.4 + 20); c.update(); }
    else if (this.mode === 'world' || !on) { c.maxPolarAngle = 1.35; c.minDistance = 8; c.maxDistance = 260; if (this.mode === 'world') c.enabled = false; }
  }
  /** Жоғары қарау: камера төмендеп, ғимарат ұшына қарайды */
  lookUp(on) { this.camPitch = on ? -.32 : .32; this.keepView = on; }
  setTextVisible(on) { this.textHidden = !on; const S = this.worldScene; if (S) S.traverse(o => { if (o.isSprite) o.visible = on; }); for (const f of this.floaters || []) f.visible = on; }
  leaveWorld() { this.exitWorldScene(); this.scene = this.mapScene; this.setMode('map'); }
}
