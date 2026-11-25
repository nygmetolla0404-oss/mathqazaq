// Процедурные 3D-модели достопримечательностей Казахстана (без внешних файлов).
import * as THREE from 'three';

const M = {};
function mat(key, make) { return M[key] || (M[key] = make()); }
const std = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: .6, metalness: .05, ...o });

export const MAT = {
  white: () => mat('white', () => std(0xf4f6fb, { roughness: .35 })),
  marble: () => mat('marble', () => std(0xeef0f2, { roughness: .3 })),
  gold: () => mat('gold', () => std(0xffc83d, { metalness: 1, roughness: .18, emissive: 0x5a3a00, emissiveIntensity: .35 })),
  glassGold: () => mat('glassGold', () => new THREE.MeshPhysicalMaterial({ color: 0xffc23a, metalness: .9, roughness: .08, emissive: 0x7a4b00, emissiveIntensity: .5, clearcoat: 1 })),
  turq: () => mat('turq', () => std(0x1fb5c9, { roughness: .25, metalness: .3, emissive: 0x05343c, emissiveIntensity: .4 })),
  blueDome: () => mat('blueDome', () => std(0x2a6fd6, { roughness: .2, metalness: .35, emissive: 0x081c44, emissiveIntensity: .4 })),
  brick: () => mat('brick', () => std(0xc9a072, { roughness: .85, map: brickTex() })),
  sand: () => mat('sand', () => std(0xd8c49a, { roughness: .9 })),
  felt: () => mat('felt', () => std(0xf5efe2, { roughness: .95 })),
  feltBand: () => mat('feltBand', () => std(0xffffff, { roughness: .9, map: ornamentTex() })),
  wood: () => mat('wood', () => std(0x8a5a2b, { roughness: .8 })),
  red: () => mat('red', () => std(0xc4302b, { roughness: .6 })),
  glass: () => mat('glass', () => new THREE.MeshPhysicalMaterial({ color: 0x9fe6ff, transparent: true, opacity: .55, roughness: .05, metalness: .2, emissive: 0x0b4a66, emissiveIntensity: .35, side: THREE.DoubleSide })),
  steel: () => mat('steel', () => std(0xc9d3e0, { metalness: .8, roughness: .3 })),
  rockRed: () => mat('rockRed', () => std(0xffffff, { vertexColors: true, roughness: .95, flatShading: true })),
  rock: () => mat('rock', () => std(0x8d8a86, { roughness: .95, flatShading: true })),
  snowRock: () => mat('snowRock', () => std(0xffffff, { vertexColors: true, roughness: .9, flatShading: true })),
  pine: () => mat('pine', () => std(0x1f5a32, { roughness: .9, flatShading: true })),
  leaf: () => mat('leaf', () => std(0x3f8f3a, { roughness: .9, flatShading: true })),
  trunk: () => mat('trunk', () => std(0x6b4423, { roughness: .9 })),
  water: () => mat('water', () => std(0x1f8fd6, { roughness: .1, metalness: .3, transparent: true, opacity: .9, emissive: 0x06345a, emissiveIntensity: .3 })),
  holo: () => mat('holo', () => new THREE.MeshBasicMaterial({ color: 0x5fe3ff, transparent: true, opacity: .55, blending: THREE.AdditiveBlending, depthWrite: false })),
  holoGold: () => mat('holoGold', () => new THREE.MeshBasicMaterial({ color: 0xffd36b, transparent: true, opacity: .7, blending: THREE.AdditiveBlending, depthWrite: false })),
};

function canvasTex(w, h, draw, repeat) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); }
  return t;
}
function brickTex() {
  return canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#c9a072'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 16) for (let x = ((y / 16) % 2) * 16; x < w; x += 32) {
      g.fillStyle = `hsl(30,${35 + Math.random() * 15}%,${55 + Math.random() * 12}%)`; g.fillRect(x + 1, y + 1, 30, 14);
    }
    g.fillStyle = '#1f9fb8'; g.fillRect(0, 100, w, 22);
    g.fillStyle = '#f3e2b0'; for (let x = 0; x < w; x += 22) { g.beginPath(); g.moveTo(x, 111); g.lineTo(x + 11, 102); g.lineTo(x + 22, 111); g.lineTo(x + 11, 120); g.fill(); }
  }, [2, 2]);
}
export function ornamentTex() {
  return canvasTex(512, 64, (g, w, h) => {
    g.fillStyle = '#b3241e'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#ffd36b'; g.lineWidth = 4;
    for (let x = 0; x < w; x += 64) { // қошқар мүйіз
      g.beginPath(); g.moveTo(x + 32, 54); g.lineTo(x + 32, 30);
      g.bezierCurveTo(x + 32, 8, x + 6, 8, x + 10, 26); g.bezierCurveTo(x + 13, 36, x + 24, 32, x + 22, 24);
      g.moveTo(x + 32, 30); g.bezierCurveTo(x + 32, 8, x + 58, 8, x + 54, 26); g.bezierCurveTo(x + 51, 36, x + 40, 32, x + 42, 24);
      g.stroke();
    }
    g.fillStyle = '#ffd36b'; g.fillRect(0, 0, w, 4); g.fillRect(0, h - 4, w, 4);
  }, [6, 1]);
}

function mesh(geo, m, cast = true) { const o = new THREE.Mesh(geo, m); o.castShadow = cast; o.receiveShadow = true; return o; }
function strut(a, b, r, m) {
  const d = new THREE.Vector3().subVectors(b, a); const len = d.length();
  const o = mesh(new THREE.CylinderGeometry(r, r, len, 6), m);
  o.position.copy(a).addScaledVector(d, .5);
  o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
  return o;
}

// ---------- landmarks (≈10 units tall) ----------
export function bayterek() {
  const g = new THREE.Group();
  const base = mesh(new THREE.CylinderGeometry(2.6, 3, .5, 48), MAT.marble()); base.position.y = .25; g.add(base);
  const base2 = mesh(new THREE.CylinderGeometry(1.8, 2.1, .4, 48), MAT.marble()); base2.position.y = .7; g.add(base2);
  const W = MAT.white(); const N = 14;
  for (let i = 0; i < N; i++) {
    const a = i / N * Math.PI * 2;
    const p0 = new THREE.Vector3(Math.cos(a) * .55, .9, Math.sin(a) * .55);
    const a1 = a + .5, p1 = new THREE.Vector3(Math.cos(a1) * .45, 5, Math.sin(a1) * .45);
    const a2 = a1 + .35, p2 = new THREE.Vector3(Math.cos(a2) * 1.7, 8.4, Math.sin(a2) * 1.7);
    g.add(strut(p0, p1, .07, W)); g.add(strut(p1, p2, .065, W));
    const p3 = new THREE.Vector3(Math.cos(a2 + .2) * 1.35, 10.1, Math.sin(a2 + .2) * 1.35);
    g.add(strut(p2, p3, .05, W));
  }
  const core = mesh(new THREE.CylinderGeometry(.32, .38, 7.6, 16), W); core.position.y = 4.6; g.add(core);
  const ball = mesh(new THREE.SphereGeometry(1.25, 48, 32), MAT.glassGold()); ball.position.y = 9.25; g.add(ball);
  const ring = mesh(new THREE.TorusGeometry(1.32, .05, 8, 64), MAT.gold()); ring.position.y = 9.25; ring.rotation.x = Math.PI / 2; g.add(ring);
  const glow = new THREE.PointLight(0xffc040, 6, 14, 2); glow.position.y = 9.3; g.add(glow);
  return g;
}

export function khanshatyr() {
  const g = new THREE.Group();
  const shell = mesh(new THREE.ConeGeometry(4.6, 9.5, 64, 12, true), MAT.glass()); shell.position.y = 4.75; g.add(shell);
  const wire = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.ConeGeometry(4.62, 9.52, 24, 8, true), 1), new THREE.LineBasicMaterial({ color: 0xdff6ff, transparent: true, opacity: .55 }));
  wire.position.y = 4.75; g.add(wire);
  const ring = mesh(new THREE.TorusGeometry(4.6, .14, 8, 96), MAT.steel()); ring.rotation.x = Math.PI / 2; ring.position.y = .12; g.add(ring);
  for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI * 2; g.add(strut(new THREE.Vector3(Math.cos(a) * .3, 9, Math.sin(a) * .3), new THREE.Vector3(Math.cos(a) * .8, 12, Math.sin(a) * .8), .07, MAT.steel())); }
  g.rotation.z = .08;
  return g;
}

export function pyramid() {
  const g = new THREE.Group();
  const stone = mesh(new THREE.ConeGeometry(5.6, 8, 4, 1), std(0xe8dcc0, { roughness: .5, flatShading: true })); stone.position.y = 4; stone.rotation.y = Math.PI / 4; g.add(stone);
  const top = mesh(new THREE.ConeGeometry(2.1, 3, 4, 1), new THREE.MeshPhysicalMaterial({ color: 0x8fd8ff, transparent: true, opacity: .8, emissive: 0x2a8cff, emissiveIntensity: .6, roughness: .05, flatShading: true }));
  top.position.y = 6.5 + .01; top.rotation.y = Math.PI / 4; g.add(top);
  const base = mesh(new THREE.BoxGeometry(9, .3, 9), MAT.marble()); base.position.y = .15; g.add(base);
  return g;
}

function dome(r, m, ribs = 0, stretch = 1.1) {
  const g = new THREE.Group();
  const d = mesh(new THREE.SphereGeometry(r, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2), m); d.scale.y = stretch; g.add(d);
  for (let i = 0; i < ribs; i++) {
    const rib = mesh(new THREE.TorusGeometry(r * 1.005, r * .025, 6, 48, Math.PI / 2), MAT.gold());
    rib.rotation.y = i / ribs * Math.PI * 2; rib.scale.y = stretch; rib.rotation.z = 0; g.add(rib);
  }
  const spire = mesh(new THREE.ConeGeometry(r * .08, r * .6, 8), MAT.gold()); spire.position.y = r * stretch + r * .28; g.add(spire);
  return g;
}

export function mosque() {
  const g = new THREE.Group();
  const body = mesh(new THREE.BoxGeometry(7, 2.6, 7), MAT.marble()); body.position.y = 1.3; g.add(body);
  const drum = mesh(new THREE.CylinderGeometry(2.4, 2.6, 1.4, 32), MAT.marble()); drum.position.y = 3.3; g.add(drum);
  const d = dome(2.4, MAT.blueDome(), 12, 1.15); d.position.y = 4; g.add(d);
  for (const [x, z] of [[-4, -4], [4, -4], [-4, 4], [4, 4]]) {
    const m = mesh(new THREE.CylinderGeometry(.3, .4, 8.5, 12), MAT.marble()); m.position.set(x, 4.25, z); g.add(m);
    const b = mesh(new THREE.CylinderGeometry(.48, .48, .3, 12), MAT.gold()); b.position.set(x, 6.8, z); g.add(b);
    const c = mesh(new THREE.ConeGeometry(.34, 1.2, 12), MAT.blueDome()); c.position.set(x, 9.1, z); g.add(c);
  }
  for (const [x, z] of [[-2.5, 0], [2.5, 0], [0, -2.5], [0, 2.5]]) { const s = dome(.9, MAT.blueDome(), 0, 1); s.position.set(x, 2.6, z); g.add(s); }
  return g;
}

export function mausoleum() {
  const g = new THREE.Group();
  const body = mesh(new THREE.BoxGeometry(6.5, 4.2, 9), MAT.brick()); body.position.y = 2.1; g.add(body);
  const portal = mesh(new THREE.BoxGeometry(7.6, 6.6, 1.6), MAT.brick()); portal.position.set(0, 3.3, 4.6); g.add(portal);
  const arch = mesh(new THREE.BoxGeometry(2.6, 4.6, .3), std(0x3a2a1a)); arch.position.set(0, 2.5, 5.45); g.add(arch);
  for (const x of [-3.4, 3.4]) { const t = mesh(new THREE.CylinderGeometry(.45, .55, 6.8, 12), MAT.brick()); t.position.set(x, 3.4, 5.3); g.add(t); }
  const drum = mesh(new THREE.CylinderGeometry(2.1, 2.1, 1.4, 32), MAT.turq()); drum.position.set(0, 4.9, -1.6); g.add(drum);
  const big = new THREE.Group();
  const db = mesh(new THREE.SphereGeometry(2.15, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2), MAT.turq()); db.scale.y = 1.25; big.add(db);
  for (let i = 0; i < 24; i++) { const rib = mesh(new THREE.TorusGeometry(2.17, .06, 6, 32, Math.PI / 2), std(0x0f8fa3, { roughness: .3 })); rib.rotation.y = i / 24 * Math.PI * 2; rib.scale.y = 1.25; big.add(rib); }
  big.position.set(0, 5.6, -1.6); g.add(big);
  const sm = dome(1.2, MAT.turq(), 0, 1.15); sm.position.set(0, 4.2, 2.2); g.add(sm);
  return g;
}

export function koktobe() {
  const g = new THREE.Group();
  const hill = mesh(new THREE.SphereGeometry(4.5, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), std(0x3f7f3a, { roughness: .95 })); hill.scale.y = .45; g.add(hill);
  const H = 12; const segs = 10;
  for (let i = 0; i < segs; i++) {
    const r0 = .9 - i * .07, r1 = .9 - (i + 1) * .07;
    const seg = mesh(new THREE.CylinderGeometry(r1, r0, H / segs, 8, 1, true), new THREE.MeshStandardMaterial({ color: i % 2 ? 0xffffff : 0xd8302b, wireframe: true }));
    seg.position.y = 2 + (i + .5) * H / segs; g.add(seg);
  }
  const deck = mesh(new THREE.CylinderGeometry(.7, .5, .6, 16), MAT.steel()); deck.position.y = 2 + H * .62; g.add(deck);
  const tip = mesh(new THREE.CylinderGeometry(.05, .1, 2.4, 6), MAT.red()); tip.position.y = 2 + H + 1.2; g.add(tip);
  const l = new THREE.PointLight(0xff3030, 4, 6); l.position.y = 2 + H + 2.4; g.add(l);
  return g;
}

export function rocket() {
  const g = new THREE.Group();
  const pad = mesh(new THREE.CylinderGeometry(4, 4.4, .6, 32), std(0x6b6f78)); pad.position.y = .3; g.add(pad);
  const R = new THREE.Group(); R.name = 'rocketBody'; g.add(R);
  const W = MAT.white(); const core = mesh(new THREE.CylinderGeometry(.55, .6, 8, 32), W); core.position.y = 4.8; R.add(core);
  const band = mesh(new THREE.CylinderGeometry(.61, .61, .5, 32), std(0x1c4fb0, { roughness: .4 })); band.position.y = 7.6; R.add(band);
  const stage2 = mesh(new THREE.CylinderGeometry(.5, .55, 2.2, 32), W); stage2.position.y = 9.9; R.add(stage2);
  const nose = mesh(new THREE.ConeGeometry(.5, 1.8, 32), MAT.red()); nose.position.y = 11.9; R.add(nose);
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2; const b = mesh(new THREE.ConeGeometry(.45, 5, 24), W);
    b.position.set(Math.cos(a) * .9, 3.3, Math.sin(a) * .9); b.rotation.z = Math.cos(a) * .05; b.rotation.x = -Math.sin(a) * .05; R.add(b);
    const n = mesh(new THREE.CylinderGeometry(.42, .35, .5, 16), std(0x333333, { metalness: .6, roughness: .3 })); n.position.set(Math.cos(a) * .9, .95, Math.sin(a) * .9); R.add(n);
  }
  const flame = mesh(new THREE.ConeGeometry(.8, 2.4, 16, 1, true), MAT.holoGold()); flame.rotation.x = Math.PI; flame.position.y = -.1; flame.name = 'flame'; R.add(flame);
  const towerM = new THREE.MeshStandardMaterial({ color: 0xd08a2a, wireframe: true });
  const tower = mesh(new THREE.BoxGeometry(1.2, 11, 1.2, 2, 14, 2), towerM); tower.position.set(2.6, 6, 0); g.add(tower);
  const arm = mesh(new THREE.BoxGeometry(1.6, .3, .4), std(0xd08a2a)); arm.position.set(1.6, 8.5, 0); g.add(arm);
  return g;
}

function noisyRock(r, h, colors, seed = 1, detail = 1) {
  const geo = new THREE.CylinderGeometry(r * .8, r, h, 9, 6);
  const pos = geo.attributes.position; const col = []; const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i); const t = (y + h / 2) / h;
    const k = 1 + (Math.sin(i * 12.9898 + seed) * 43758.5453 % 1) * .18 * detail;
    pos.setX(i, pos.getX(i) * k); pos.setZ(i, pos.getZ(i) * k);
    c.set(colors[Math.min(colors.length - 1, Math.floor(t * colors.length * 2.3) % colors.length)]);
    col.push(c.r, c.g, c.b);
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); geo.computeVertexNormals();
  return geo;
}
export function canyon(kind = 'red') {
  const g = new THREE.Group();
  const cols = kind === 'red' ? ['#b4482a', '#d4693a', '#e08d55', '#a63d24', '#c96a40'] : ['#f2ede2', '#e9dccb', '#f7f3ea', '#e6c9b8', '#efe6d6'];
  const rnd = mulberry(kind === 'red' ? 7 : 11);
  for (let i = 0; i < 16; i++) {
    const a = rnd() * Math.PI * 2, d = 1.5 + rnd() * 6;
    const h = 2.5 + rnd() * (kind === 'red' ? 6 : 8), r = .8 + rnd() * 1.6;
    const m = mesh(new THREE.BufferGeometry().copy(noisyRock(r, h, cols, i, 1.4)), MAT.rockRed());
    m.position.set(Math.cos(a) * d, h / 2, Math.sin(a) * d); m.rotation.y = rnd() * 3; g.add(m);
    if (kind !== 'red' && rnd() > .5) { const cap = mesh(new THREE.ConeGeometry(r * .7, h * .4, 7), MAT.rockRed()); cap.geometry = noisyRock(r * .1, h * .35, cols, i + 5, 1); cap.position.set(m.position.x, h + h * .17, m.position.z); g.add(cap); }
  }
  return g;
}
export function mountain(h = 10, r = 8, seed = 3) {
  const geo = new THREE.ConeGeometry(r, h, 28, 10);
  const pos = geo.attributes.position; const col = []; const c = new THREE.Color(); const rnd = mulberry(seed);
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i); const t = (y + h / 2) / h;
    if (t < .98) { const k = 1 + (rnd() - .5) * .25; pos.setX(i, pos.getX(i) * k); pos.setZ(i, pos.getZ(i) * k); pos.setY(i, y + (rnd() - .5) * h * .04); }
    c.set(t > .62 ? '#f4f8ff' : t > .42 ? '#7d7f86' : '#4b6b3a'); col.push(c.r, c.g, c.b);
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); geo.computeVertexNormals();
  const m = mesh(geo, MAT.snowRock()); m.position.y = h / 2; return m;
}
export function mountainsGroup() {
  const g = new THREE.Group();
  [[0, 0, 12, 7], [-7, 2, 8, 5.5], [6, 3, 9, 6], [-3, -6, 7, 5], [4, -5, 6.5, 4.5]].forEach(([x, z, h, r], i) => { const m = mountain(h, r, i + 2); m.position.x = x; m.position.z = z; g.add(m); });
  return g;
}

export function yurt(s = 1) {
  const g = new THREE.Group();
  const wall = mesh(new THREE.CylinderGeometry(2, 2, 1.5, 40, 1, true), MAT.felt()); wall.position.y = .75; g.add(wall);
  const band = mesh(new THREE.CylinderGeometry(2.02, 2.02, .32, 40, 1, true), MAT.feltBand()); band.position.y = 1.25; g.add(band);
  const pts = []; for (let i = 0; i <= 12; i++) { const t = i / 12; pts.push(new THREE.Vector2(2.05 * (1 - t) + .35 * t, 1.5 + Math.sin(t * Math.PI * .5) * 1.25)); }
  const roof = mesh(new THREE.LatheGeometry(pts, 40), MAT.felt()); g.add(roof);
  const roofBand = mesh(new THREE.TorusGeometry(1.35, .05, 6, 40), MAT.red()); roofBand.rotation.x = Math.PI / 2; roofBand.position.y = 2.33; g.add(roofBand);
  const sh = mesh(new THREE.TorusGeometry(.36, .08, 8, 24), MAT.wood()); sh.rotation.x = Math.PI / 2; sh.position.y = 2.76; g.add(sh);
  for (let i = 0; i < 4; i++) { const b = mesh(new THREE.BoxGeometry(.72, .04, .06), MAT.wood()); b.position.y = 2.78; b.rotation.y = i * Math.PI / 4; g.add(b); }
  const door = mesh(new THREE.BoxGeometry(.8, 1.2, .08), std(0xd4572a, { map: ornamentTex() })); door.position.set(0, .6, 1.98); g.add(door);
  g.scale.setScalar(s);
  return g;
}
export function yurtVillage() {
  const g = new THREE.Group();
  const big = yurt(1.6); g.add(big);
  [[-6, 1], [6, 1.5], [-4, -5], [4.5, -5]].forEach(([x, z], i) => { const y = yurt(1.05); y.position.set(x, 0, z); y.rotation.y = -Math.atan2(x, z) + Math.PI; g.add(y); });
  const fire = mesh(new THREE.ConeGeometry(.35, .9, 8, 1, true), MAT.holoGold()); fire.position.set(0, .45, 4.5); fire.name = 'flame'; g.add(fire);
  const l = new THREE.PointLight(0xff9a30, 5, 8); l.position.set(0, 1, 4.5); g.add(l);
  return g;
}

export function abaiMonument() {
  const g = new THREE.Group();
  const ped = mesh(new THREE.BoxGeometry(3, 3, 3), std(0x5b4f45, { roughness: .6 })); ped.position.y = 1.5; g.add(ped);
  const body = mesh(new THREE.CylinderGeometry(.75, 1.05, 3.4, 16), std(0x6e5a3a, { metalness: .6, roughness: .4 })); body.position.y = 4.7; g.add(body);
  const head = mesh(new THREE.SphereGeometry(.55, 24, 16), std(0x6e5a3a, { metalness: .6, roughness: .4 })); head.position.y = 6.8; g.add(head);
  const hat = mesh(new THREE.CylinderGeometry(.55, .62, .35, 16), std(0x4e3f28, { metalness: .5, roughness: .5 })); hat.position.y = 7.2; g.add(hat);
  const book = mesh(new THREE.BoxGeometry(5, .25, 3.4), MAT.white()); book.position.set(0, .5, 4.2); book.rotation.x = -.15; g.add(book);
  const spine = mesh(new THREE.BoxGeometry(.2, .3, 3.4), MAT.gold()); spine.position.set(0, .66, 4.2); g.add(spine);
  return g;
}
export function okzhetpes() {
  const g = new THREE.Group();
  const cols = ['#8c8a84', '#a19d94', '#7b786f', '#b1ada3'];
  const r = mesh(noisyRock(1.6, 11, cols, 3, 1.8), MAT.rockRed()); r.position.y = 5.5; g.add(r);
  const r2 = mesh(noisyRock(1.2, 7, cols, 9, 1.6), MAT.rockRed()); r2.position.set(-2.6, 3.5, .6); g.add(r2);
  const lake = mesh(new THREE.CircleGeometry(7, 48), MAT.water(), false); lake.rotation.x = -Math.PI / 2; lake.position.set(0, .03, 7); g.add(lake);
  const jt = mesh(new THREE.DodecahedronGeometry(.9), MAT.rock()); jt.position.set(1, .4, 6); g.add(jt);
  for (let i = 0; i < 10; i++) { const p = pine(1.3 + Math.random() * .6); const a = Math.random() * Math.PI * 2; p.position.set(Math.cos(a) * 5, 0, Math.sin(a) * 5 - 3); g.add(p); }
  return g;
}
export function bayanaul() {
  const g = new THREE.Group();
  const rnd = mulberry(5);
  for (let i = 0; i < 14; i++) { const s = .8 + rnd() * 2; const m = mesh(new THREE.DodecahedronGeometry(s, 0), std(0xa89f95, { flatShading: true, roughness: .9 })); m.position.set((rnd() - .5) * 12, s * .7, (rnd() - .5) * 8 - 3); m.scale.y = .8 + rnd() * .6; m.rotation.set(rnd(), rnd(), rnd()); g.add(m); }
  const lake = mesh(new THREE.CircleGeometry(5, 48), MAT.water(), false); lake.rotation.x = -Math.PI / 2; lake.position.set(0, .03, 5); g.add(lake);
  for (let i = 0; i < 12; i++) { const p = pine(1.2 + rnd() * .8); p.position.set((rnd() - .5) * 16, 0, (rnd() - .5) * 6 - 6); g.add(p); }
  return g;
}
export function ancient() {
  const g = new THREE.Group();
  const clay = std(0xc8a476, { roughness: .95 });
  for (let i = 0; i < 18; i++) {
    const a = i / 18 * Math.PI * 2; if (i % 5 === 0) continue;
    const w = mesh(new THREE.BoxGeometry(2.2, 1 + Math.random() * 1.2, .6), clay); w.position.set(Math.cos(a) * 7, .6, Math.sin(a) * 7); w.rotation.y = -a + Math.PI / 2; g.add(w);
  }
  const min = mesh(new THREE.CylinderGeometry(.5, .8, 6, 16), MAT.brick()); min.position.set(-3, 3, -2); g.add(min);
  const dm = dome(1.6, MAT.turq(), 0, 1.1); const hall = mesh(new THREE.BoxGeometry(3.6, 2.2, 3.6), MAT.brick()); hall.position.set(2, 1.1, -1); dm.position.set(2, 2.2, -1); g.add(hall, dm);
  // голографическая астролябия — символ науки Әл-Фараби
  const astro = new THREE.Group(); astro.name = 'spin';
  for (let i = 0; i < 3; i++) { const t = mesh(new THREE.TorusGeometry(2.2, .05, 8, 64), MAT.holoGold(), false); t.rotation.set(i * .9, i * .6, 0); astro.add(t); }
  astro.add(mesh(new THREE.SphereGeometry(.35, 16, 12), MAT.holo(), false));
  astro.position.set(0, 5, 2); g.add(astro);
  return g;
}
export function cityCluster() {
  const g = new THREE.Group(); const rnd = mulberry(21);
  const winTex = canvasTex(64, 128, (c, w, h) => { c.fillStyle = '#16305e'; c.fillRect(0, 0, w, h); for (let y = 4; y < h; y += 8) for (let x = 4; x < w; x += 10) { c.fillStyle = Math.random() > .4 ? '#ffd98a' : '#284b86'; c.fillRect(x, y, 6, 4); } });
  const m = std(0xffffff, { map: winTex, emissive: 0xffffff, emissiveMap: winTex, emissiveIntensity: .5, metalness: .3, roughness: .4 });
  for (let i = 0; i < 9; i++) { const h = 2 + rnd() * 7; const b = mesh(new THREE.BoxGeometry(1.1 + rnd(), h, 1.1 + rnd()), m); b.position.set((rnd() - .5) * 8, h / 2, (rnd() - .5) * 8); g.add(b); }
  return g;
}
export function lakeScene() {
  const g = new THREE.Group();
  const lake = mesh(new THREE.CircleGeometry(8, 64), MAT.water(), false); lake.rotation.x = -Math.PI / 2; lake.position.y = .04; lake.scale.x = 1.6; g.add(lake);
  g.add(boat());
  for (let i = 0; i < 40; i++) { const a = Math.random() * Math.PI * 2; const r = mesh(new THREE.CylinderGeometry(.03, .05, 1.2, 4), std(0x9a8b3a)); r.position.set(Math.cos(a) * 12.5, .6, Math.sin(a) * 8); g.add(r); }
  return g;
}
export function boat() {
  const g = new THREE.Group(); g.name = 'boat';
  const hull = mesh(new THREE.BoxGeometry(.9, .4, 2.4), MAT.wood()); hull.position.y = .25; g.add(hull);
  const mast = mesh(new THREE.CylinderGeometry(.04, .04, 3, 6), MAT.wood()); mast.position.y = 1.8; g.add(mast);
  const sail = new THREE.Mesh(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, .6, -.1), new THREE.Vector3(0, 3.2, -.1), new THREE.Vector3(0, .6, 1.1)]), new THREE.MeshStandardMaterial({ color: 0xffffff, side: THREE.DoubleSide }));
  sail.geometry.computeVertexNormals(); g.add(sail);
  return g;
}
export function pine(h = 1.6) {
  const g = new THREE.Group();
  const t = mesh(new THREE.CylinderGeometry(.06, .09, h * .3, 5), MAT.trunk()); t.position.y = h * .15; g.add(t);
  for (let i = 0; i < 3; i++) { const c = mesh(new THREE.ConeGeometry(h * (.32 - i * .07), h * .45, 7), MAT.pine()); c.position.y = h * (.35 + i * .2); g.add(c); }
  return g;
}

export function buildLandmark(key) {
  switch (key) {
    case 'bayterek': return bayterek();
    case 'khanshatyr': return khanshatyr();
    case 'pyramid': return pyramid();
    case 'mosque': return mosque();
    case 'mausoleum': return mausoleum();
    case 'koktobe': return koktobe();
    case 'rocket': return rocket();
    case 'canyon_red': return canyon('red');
    case 'canyon_white': return canyon('white');
    case 'mountain': return mountainsGroup();
    case 'yurt_village': return yurtVillage();
    case 'abai': return abaiMonument();
    case 'okzhetpes': return okzhetpes();
    case 'bayanaul': return bayanaul();
    case 'ancient': return ancient();
    case 'lake': return lakeScene();
    case 'sea': { const g = lakeScene(); g.scale.set(1.3, 1, 1.3); return g; }
    default: return cityCluster();
  }
}

export function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
