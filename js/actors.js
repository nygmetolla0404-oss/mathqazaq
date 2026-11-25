// QAZAQ MATH — кейіпкерлер (маскоттар), бүркіт, ер-тоқым, қақпа, сызғыш, транспортир.
import * as THREE from 'three';
import { MAT, ornamentTex } from './models.js';

export const FONT_D = 'Montserrat, Inter, sans-serif';
export const FONT_B = 'Inter, Montserrat, sans-serif';

const phys = (c, o = {}) => new THREE.MeshPhysicalMaterial({ color: c, roughness: .32, metalness: 0, clearcoat: 1, clearcoatRoughness: .18, ...o });
const std = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: .6, metalness: .05, ...o });
function mesh(geo, m, cast = true) { const o = new THREE.Mesh(geo, m); o.castShadow = cast; o.receiveShadow = true; return o; }

// ======================= МАСКОТТАР =======================
export const CHARACTERS = [
  { id: 'tamshy', name: 'Тамшы', hint: 'су тамшысы', c: '#3fb6ff' },
  { id: 'kun', name: 'Күншуақ', hint: 'күннің көзі', c: '#ffb81f' },
  { id: 'zhuldyz', name: 'Жұлдыз', hint: 'аспан жұлдызы', c: '#ffd84a' },
  { id: 'bulut', name: 'Бұлт', hint: 'ақ бұлт', c: '#e8f1ff' },
  { id: 'alma', name: 'Алма', hint: 'Алматы апорты', c: '#ef3f3a' },
  { id: 'zhalyn', name: 'Жалын', hint: 'от жалыны', c: '#ff7a1a' },
];
// 2D белгіше (SVG) — интерфейс үшін
export function charSVG(id, color = '#2aa8ff', size = 40) {
  const eyes = (y = 30) => `<ellipse cx="25" cy="${y}" rx="4.2" ry="5.2" fill="#fff"/><ellipse cx="39" cy="${y}" rx="4.2" ry="5.2" fill="#fff"/><circle cx="25.8" cy="${y + .8}" r="2.6" fill="#1b2340"/><circle cx="39.8" cy="${y + .8}" r="2.6" fill="#1b2340"/><circle cx="26.8" cy="${y - .6}" r="1" fill="#fff"/><circle cx="40.8" cy="${y - .6}" r="1" fill="#fff"/>`;
  const mouth = (y = 40) => `<path d="M27 ${y}q5 5 10 0" stroke="#1b2340" stroke-width="2.2" fill="none" stroke-linecap="round"/><ellipse cx="20" cy="${y - 2}" rx="3.2" ry="2" fill="#ff8aa0" opacity=".7"/><ellipse cx="44" cy="${y - 2}" rx="3.2" ry="2" fill="#ff8aa0" opacity=".7"/>`;
  const hat = `<path d="M21 13q11-8 22 0l-1 4H22z" fill="${color}"/><path d="M22 17h20" stroke="#ffd36b" stroke-width="2"/><path d="M32 6q4-6 2 1" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
  let body = '';
  if (id === 'tamshy') body = `<path d="M32 8C26 20 13 30 13 43a19 19 0 0 0 38 0C51 30 38 20 32 8z" fill="url(#gd)"/><defs><linearGradient id="gd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fdcff"/><stop offset="1" stop-color="#1d8fe0"/></linearGradient></defs>${eyes(38)}${mouth(48)}`;
  else if (id === 'kun') body = `${[...Array(12)].map((_, i) => `<path d="M32 4l3 8h-6z" fill="#ffcf3a" transform="rotate(${i * 30} 32 34)"/>`).join('')}<circle cx="32" cy="34" r="19" fill="url(#gk)"/><defs><radialGradient id="gk" cx=".4" cy=".35"><stop offset="0" stop-color="#ffe98a"/><stop offset="1" stop-color="#ff9f12"/></radialGradient></defs>${eyes(32)}${mouth(42)}`;
  else if (id === 'zhuldyz') body = `<path d="M32 6l7.6 16.4 18 2-13.4 12.3 3.8 17.7L32 45.5 16 54.4l3.8-17.7L6.4 24.4l18-2z" fill="url(#gz)" stroke="#e0a400" stroke-width="1.2" stroke-linejoin="round"/><defs><linearGradient id="gz" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff2a8"/><stop offset="1" stop-color="#ffc21a"/></linearGradient></defs>${eyes(31)}${mouth(40)}`;
  else if (id === 'bulut') body = `<g fill="#fff" stroke="#c9d8f0" stroke-width="1.2"><circle cx="20" cy="38" r="11"/><circle cx="44" cy="38" r="11"/><circle cx="32" cy="30" r="14"/><rect x="18" y="36" width="28" height="14" rx="7" stroke="none"/></g>${eyes(34)}${mouth(43)}`;
  else if (id === 'alma') body = `<path d="M32 18c-6-5-20-3-20 14 0 14 10 24 20 22 10 2 20-8 20-22 0-17-14-19-20-14z" fill="url(#ga)"/><path d="M32 18q0-6 3-9" stroke="#6b3b1a" stroke-width="2.4" fill="none"/><path d="M35 12q8-5 12 1-6 4-12-1z" fill="#4caf50"/><defs><radialGradient id="ga" cx=".35" cy=".3"><stop offset="0" stop-color="#ff8a7a"/><stop offset="1" stop-color="#c8201b"/></radialGradient></defs>${eyes(34)}${mouth(43)}`;
  else body = `<path d="M32 4c4 10 18 18 18 34a18 18 0 0 1-36 0c0-9 5-13 8-19 1 5 3 7 5 8 0-9 2-16 5-23z" fill="url(#gf)"/><defs><linearGradient id="gf" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ffd23a"/><stop offset=".55" stop-color="#ff7a1a"/><stop offset="1" stop-color="#e8361b"/></linearGradient></defs>${eyes(38)}${mouth(47)}`;
  return `<svg viewBox="0 0 64 64" width="${size}" height="${size}" aria-hidden="true">${body}${id === 'kun' || id === 'zhuldyz' ? '' : hat}</svg>`;
}

function lathe(profile, seg = 48) { return new THREE.LatheGeometry(profile.map(([x, y]) => new THREE.Vector2(x, y)), seg); }
function face(g, y, z, s = 1, spread = .17) {
  const white = phys(0xffffff, { roughness: .15 }), dark = phys(0x141a33, { roughness: .1 });
  for (const sx of [-1, 1]) {
    const e = mesh(new THREE.SphereGeometry(.1 * s, 20, 16), white, false); e.scale.set(1, 1.22, .55); e.position.set(sx * spread * s, y, z); g.add(e);
    const p = mesh(new THREE.SphereGeometry(.062 * s, 16, 12), dark, false); p.scale.set(1, 1.15, .5); p.position.set(sx * spread * s + .008, y - .012 * s, z + .045 * s); g.add(p);
    const h = mesh(new THREE.SphereGeometry(.022 * s, 8, 8), white, false); h.position.set(sx * spread * s + .03 * s, y + .03 * s, z + .075 * s); g.add(h);
    const ck = mesh(new THREE.CircleGeometry(.055 * s, 16), new THREE.MeshBasicMaterial({ color: 0xff8aa0, transparent: true, opacity: .55 }), false); ck.position.set(sx * (spread + .1) * s, y - .13 * s, z - .01); g.add(ck);
  }
  const sm = mesh(new THREE.TorusGeometry(.07 * s, .016 * s, 8, 20, Math.PI), dark, false); sm.rotation.z = Math.PI; sm.position.set(0, y - .12 * s, z + .005); g.add(sm);
}
function takiya(color) { // қазақтың тақиясы + үкі
  const g = new THREE.Group();
  const capM = std(new THREE.Color(color), { roughness: .5 });
  const cap = mesh(new THREE.SphereGeometry(.22, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), capM); cap.scale.y = .55; g.add(cap);
  const band = mesh(new THREE.CylinderGeometry(.222, .222, .06, 24, 1, true), MAT.feltBand()); band.position.y = .02; g.add(band);
  const uki = new THREE.Group();
  for (let i = 0; i < 5; i++) { const f = mesh(new THREE.ConeGeometry(.018, .2, 5), std(0xffffff, { roughness: .9 })); f.position.y = .1; f.rotation.z = (i - 2) * .22; uki.add(f); }
  uki.position.y = .1; g.add(uki);
  return g;
}
function limbs(g, col, y = .28, spread = .36) {
  const m = phys(col);
  for (const sx of [-1, 1]) {
    const a = mesh(new THREE.CapsuleGeometry(.05, .14, 4, 8), m); a.position.set(sx * spread, y, .02); a.rotation.z = sx * .9; a.name = sx < 0 ? 'armL' : 'armR'; g.add(a);
    const f = mesh(new THREE.SphereGeometry(.085, 14, 10), m); f.scale.set(1, .6, 1.3); f.position.set(sx * .13, .04, .04); f.name = sx < 0 ? 'legL' : 'legR'; g.add(f);
  }
}

/** Кіші маскот (биіктігі ≈ 1). Алдыңғы жағы +Z. */
export function mascot(id = 'tamshy', color = '#2aa8ff') {
  const g = new THREE.Group(); const body = new THREE.Group(); body.name = 'body'; g.add(body);
  let headTop = 1;
  if (id === 'tamshy') {
    const prof = []; for (let i = 0; i <= 40; i++) { const t = i / 40 * Math.PI; prof.push([Math.max(.0001, .42 * Math.sin(t) * Math.pow(1 - t / Math.PI, .62) * 1.12), .44 - .44 * Math.cos(t) * 1.0 + (t > 2.2 ? (t - 2.2) * .18 : 0)]); }
    const geo = lathe(prof); const m = phys(0x49b9ff, { roughness: .05, transmission: 0, opacity: .94, transparent: true, emissive: 0x0b4a8a, emissiveIntensity: .25, sheen: .5, iridescence: .4 });
    body.add(mesh(geo, m)); face(body, .42, .36); limbs(body, 0x2b98e8); headTop = 1.02;
    const hl = mesh(new THREE.SphereGeometry(.07, 12, 8), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .8 }), false); hl.scale.set(.6, 1.4, .4); hl.position.set(-.22, .62, .25); body.add(hl);
  } else if (id === 'kun') {
    const core = mesh(new THREE.SphereGeometry(.4, 32, 24), phys(0xffb21a, { emissive: 0xff7a00, emissiveIntensity: .45, roughness: .25 })); core.position.y = .46; body.add(core);
    const rays = new THREE.Group(); rays.name = 'spin';
    for (let i = 0; i < 12; i++) { const r = mesh(new THREE.ConeGeometry(.07, .2, 10), phys(0xffd23a, { emissive: 0xffa000, emissiveIntensity: .5 })); const a = i / 12 * Math.PI * 2; r.position.set(Math.cos(a) * .5, Math.sin(a) * .5, 0); r.rotation.z = a - Math.PI / 2; rays.add(r); }
    rays.position.set(0, .46, -.04); body.add(rays); face(body, .5, .37); limbs(body, 0xff9f12, .2, .34); headTop = .9;
  } else if (id === 'zhuldyz') {
    const s = new THREE.Shape(); for (let i = 0; i < 10; i++) { const r = i % 2 ? .2 : .46, a = i / 10 * Math.PI * 2 + Math.PI / 2; i ? s.lineTo(Math.cos(a) * r, Math.sin(a) * r) : s.moveTo(Math.cos(a) * r, Math.sin(a) * r); } s.closePath();
    const geo = new THREE.ExtrudeGeometry(s, { depth: .16, bevelEnabled: true, bevelSize: .07, bevelThickness: .08, bevelSegments: 5, curveSegments: 4 }); geo.translate(0, 0, -.08);
    const st = mesh(geo, phys(0xffd23a, { emissive: 0xffa500, emissiveIntensity: .35, metalness: .2, roughness: .25 })); st.position.y = .5; body.add(st);
    face(body, .52, .17, .85, .15); limbs(body, 0xffb81f, .22, .3); headTop = .98;
  } else if (id === 'bulut') {
    const m = phys(0xffffff, { roughness: .6, clearcoat: .3, sheen: 1, sheenColor: new THREE.Color(0xcfe6ff) });
    [[0, .48, 0, .34], [-.3, .36, 0, .24], [.3, .36, 0, .24], [-.16, .62, -.05, .22], [.18, .64, -.06, .2], [0, .3, .05, .26]].forEach(([x, y, z, r]) => { const b = mesh(new THREE.SphereGeometry(r, 24, 16), m); b.position.set(x, y, z); body.add(b); });
    face(body, .5, .32, .9); limbs(body, 0xdde9fb, .26, .44); headTop = .92;
  } else if (id === 'alma') {
    const prof = []; for (let i = 0; i <= 32; i++) { const t = i / 32 * Math.PI; const r = .42 * Math.sin(t) * (1 + .12 * Math.sin(t * 2)); prof.push([Math.max(.0001, r), .44 - .4 * Math.cos(t) - (i > 29 ? .06 : 0)]); }
    const ap = mesh(lathe(prof), phys(0xe0302a, { roughness: .2, emissive: 0x400000, emissiveIntensity: .2 })); body.add(ap);
    const stem = mesh(new THREE.CylinderGeometry(.02, .025, .16, 6), std(0x6b3b1a)); stem.position.set(0, .9, 0); stem.rotation.z = -.2; body.add(stem);
    const leaf = mesh(new THREE.SphereGeometry(.1, 12, 8), phys(0x47b04b)); leaf.scale.set(1.4, .25, .6); leaf.position.set(.1, .93, 0); leaf.rotation.z = .4; body.add(leaf);
    face(body, .46, .37); limbs(body, 0xc8201b); headTop = .96;
  } else {
    const prof = []; for (let i = 0; i <= 40; i++) { const t = i / 40 * Math.PI; prof.push([Math.max(.0001, .4 * Math.sin(t) * Math.pow(1 - t / Math.PI, .5)), .42 - .42 * Math.cos(t) + (t > 1.9 ? (t - 1.9) * .32 : 0)]); }
    const geo = lathe(prof); const col = []; const p = geo.attributes.position; const c = new THREE.Color();
    for (let i = 0; i < p.count; i++) { const y = p.getY(i); c.setHSL(.13 - Math.min(1, y / 1.1) * .12, 1, .55 - y * .08); col.push(c.r, c.g, c.b); }
    geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    const fl = mesh(geo, phys(0xffffff, { vertexColors: true, emissive: 0xff5a00, emissiveIntensity: .35, roughness: .3 })); fl.name = 'flicker'; body.add(fl);
    face(body, .4, .37); limbs(body, 0xff7a1a); headTop = 1.05;
  }
  if (id !== 'kun' && id !== 'zhuldyz') { const h = takiya(color); h.position.y = headTop - .1; h.scale.setScalar(id === 'bulut' ? 1.1 : .95); body.add(h); }
  else { // жұлдыз бен күнге — түсті орамал
    const sc = mesh(new THREE.TorusGeometry(.17, .045, 8, 24), std(new THREE.Color(color), { roughness: .5 })); sc.rotation.x = Math.PI / 2; sc.position.y = .17; sc.scale.set(1.2, 1, 1); body.add(sc);
  }
  g.userData.char = id;
  return g;
}
/** маскот анимациясы: секіру, қол бұлғау */
export function animateMascot(g, t, moving = 0, sitting = false) {
  const b = g.getObjectByName('body'); if (!b) return;
  if (sitting) { b.position.y = Math.abs(Math.sin(t * 7.8)) * .05 * moving; b.rotation.z = Math.sin(t * 2) * .04; }
  else { b.position.y = moving ? Math.abs(Math.sin(t * 9)) * .22 : Math.sin(t * 2.2) * .03; b.rotation.z = moving ? Math.sin(t * 9) * .08 : 0; b.scale.y = 1 + (moving ? Math.cos(t * 18) * .04 : Math.sin(t * 2.2) * .015); }
  const aL = b.getObjectByName('armL'), aR = b.getObjectByName('armR');
  if (aL) aL.rotation.z = -.9 - Math.sin(t * (moving ? 9 : 2)) * (moving ? .5 : .15);
  if (aR) aR.rotation.z = .9 + Math.sin(t * (moving ? 9 : 2)) * (moving ? .5 : .15);
  const sp = b.getObjectByName('spin'); if (sp) sp.rotation.z = t * .6;
  const fl = b.getObjectByName('flicker'); if (fl) { fl.scale.x = fl.scale.z = 1 + Math.sin(t * 13) * .04; fl.scale.y = 1 + Math.sin(t * 17) * .05; }
}

// ======================= БҮРКІТ (процедуралық) =======================
function featherGeo(len, w, tipRound = .5) {
  const s = new THREE.Shape(); s.moveTo(-w * .32, 0); s.quadraticCurveTo(-w * .55, len * .55, -w * .38, len * .86); s.quadraticCurveTo(0, len * (1 + tipRound * .12), w * .42, len * .84); s.quadraticCurveTo(w * .55, len * .5, w * .3, 0); s.closePath();
  const geo = new THREE.ShapeGeometry(s, 6); geo.rotateX(-Math.PI / 2); // жазықтық XZ, ұзындығы −Z бойымен
  geo.scale(1, 1, 1);
  const p = geo.attributes.position; for (let i = 0; i < p.count; i++) { const z = p.getZ(i); p.setY(i, p.getY(i) - Math.pow(Math.abs(z) / len, 2) * len * .08); } // аздап иілу
  geo.computeVertexNormals(); return geo;
}
export function eagle() {
  const root = new THREE.Group();
  const dark = std(0x2e1c10, { roughness: .78, side: THREE.DoubleSide });
  const brown = std(0x4d3018, { roughness: .75, side: THREE.DoubleSide });
  const mid = std(0x6b4321, { roughness: .72, side: THREE.DoubleSide });
  const golden = std(0xc58f3f, { roughness: .6 });
  const yellow = phys(0xf2bf2a, { roughness: .35 });
  const beakM = phys(0x2f3138, { roughness: .25 });
  const body = new THREE.Group(); body.name = 'body'; root.add(body);
  // дене
  const torso = mesh(new THREE.SphereGeometry(.3, 28, 20), brown); torso.scale.set(1.05, .9, 2.1); body.add(torso);
  const chest = mesh(new THREE.SphereGeometry(.27, 24, 16), mid); chest.scale.set(1, .95, 1.3); chest.position.set(0, -.04, .28); body.add(chest);
  // бас пен мойын — алтын жал
  const neck = mesh(new THREE.SphereGeometry(.22, 24, 16), golden); neck.scale.set(1, 1, 1.2); neck.position.set(0, .1, .58); body.add(neck);
  const head = mesh(new THREE.SphereGeometry(.19, 28, 20), golden); head.scale.set(.92, .95, 1.15); head.position.set(0, .17, .78); body.add(head);
  const brow = mesh(new THREE.BoxGeometry(.3, .05, .12), std(0x3a2412)); brow.position.set(0, .25, .86); brow.rotation.x = .25; body.add(brow);
  for (const sx of [-1, 1]) {
    const e = mesh(new THREE.SphereGeometry(.042, 16, 12), phys(0xd9901a, { roughness: .1 })); e.position.set(sx * .12, .2, .88); body.add(e);
    const p = mesh(new THREE.SphereGeometry(.024, 10, 8), phys(0x050505, { roughness: .05 })); p.position.set(sx * .135, .2, .91); body.add(p);
  }
  const cere = mesh(new THREE.CylinderGeometry(.065, .075, .07, 16), yellow); cere.rotation.x = Math.PI / 2; cere.position.set(0, .16, .94); body.add(cere);
  // имек тұмсық: конусты иеміз
  const bg = new THREE.ConeGeometry(.062, .24, 16, 8); const bp = bg.attributes.position;
  for (let i = 0; i < bp.count; i++) { const y = bp.getY(i), s = (y + .12) / .24; bp.setZ(i, bp.getZ(i) - s * s * .11); }
  bg.rotateX(Math.PI / 2); bg.computeVertexNormals();
  const beak = mesh(bg, beakM); beak.position.set(0, .15, 1.06); body.add(beak);
  // құйрық — желпуіш
  const tail = new THREE.Group(); tail.position.set(0, .02, -.55); tail.name = 'tail';
  for (let i = 0; i < 11; i++) { const a = (i - 5) / 5 * .42; const f = mesh(featherGeo(.62, .14), i % 2 ? dark : brown); f.rotation.y = a; f.position.x = a * .1; tail.add(f); }
  body.add(tail);
  // аяқтар
  for (const sx of [-1, 1]) {
    const leg = mesh(new THREE.CapsuleGeometry(.07, .12, 4, 8), mid); leg.position.set(sx * .12, -.24, -.12); leg.rotation.x = 1.1; body.add(leg);
    const foot = mesh(new THREE.ConeGeometry(.05, .14, 8), yellow); foot.position.set(sx * .12, -.3, -.28); foot.rotation.x = -2; body.add(foot);
  }
  // қанаттар
  const wings = [];
  for (const sx of [-1, 1]) {
    const pivot = new THREE.Group(); pivot.position.set(sx * .2, .1, .14); body.add(pivot);
    const inner = new THREE.Group(); pivot.add(inner);
    // жамылғы қауырсындар (алтын-қоңыр) + екінші реттік қауырсындар
    const cov = mesh(new THREE.SphereGeometry(.5, 20, 10), mid); cov.scale.set(.82, .1, .32); cov.position.set(sx * .4, .02, -.08); inner.add(cov);
    for (let i = 0; i < 8; i++) { const f = mesh(featherGeo(.5 - i * .006, .16), i % 2 ? brown : dark); f.position.set(sx * (.08 + i * .095), -.01, -.12); f.rotation.y = sx * -.05; inner.add(f); }
    for (let i = 0; i < 7; i++) { const f = mesh(featherGeo(.26, .14), golden); f.position.set(sx * (.08 + i * .1), .03, .06); inner.add(f); }
    const outer = new THREE.Group(); outer.position.set(sx * .8, 0, -.02); inner.add(outer);
    const cov2 = mesh(new THREE.SphereGeometry(.34, 16, 8), brown); cov2.scale.set(.9, .09, .4); cov2.position.set(sx * .22, .02, -.05); outer.add(cov2);
    // бүркіттің «саусақтары» — 6 бастапқы қауырсын
    for (let i = 0; i < 6; i++) { const L = .62 + Math.sin(i / 5 * Math.PI) * .12; const f = mesh(featherGeo(L, .13, .8), dark); f.position.set(sx * (.08 + i * .07), -.005 + i * .004, .02 - i * .02); f.rotation.y = sx * (1.25 - i * .19); outer.add(f); }
    wings.push({ pivot, inner, outer, sx });
  }
  root.userData.wings = wings; root.userData.body = body;
  root.scale.setScalar(1.05);
  return root;
}
/** бүркіттің қанат қағуы. flap: 0 — қалықтау, 1 — белсенді */
export function animateEagle(e, t, flap = .6, bank = 0) {
  const w = e.userData.wings; if (!w) return;
  const f = Math.sin(t * 7.5) * (.15 + flap * .55);
  for (const { pivot, outer, sx } of w) {
    pivot.rotation.z = sx * (f + .06) + bank * .15; pivot.rotation.y = sx * Math.sin(t * 7.5 + .4) * .06 * flap;
    outer.rotation.z = sx * (Math.sin(t * 7.5 - .9) * (.12 + flap * .35) + .05);
  }
  e.userData.body.position.y = -f * .06;
  const tl = e.userData.body.getObjectByName('tail'); if (tl) tl.rotation.x = Math.sin(t * 3) * .05;
}

// ======================= ЕР-ТОҚЫМ =======================
export function saddle(color = '#c4302b') {
  const g = new THREE.Group();
  const cloth = mesh(new THREE.CylinderGeometry(.27, .27, .5, 24, 1, true, -1.15, 2.3), std(0xffffff, { map: ornamentTex(), side: THREE.DoubleSide, roughness: .8 }));
  cloth.rotation.x = -Math.PI / 2; g.add(cloth);
  const cl2 = mesh(new THREE.CylinderGeometry(.275, .275, .52, 24, 1, true, -1.18, 2.36), std(new THREE.Color(color), { side: THREE.BackSide, roughness: .8 })); cl2.rotation.copy(cloth.rotation); g.add(cl2);
  const seat = mesh(new THREE.CylinderGeometry(.285, .285, .3, 24, 1, true, -.6, 1.2), std(0x5a3216, { side: THREE.DoubleSide, roughness: .5 })); seat.rotation.copy(cloth.rotation); g.add(seat);
  const pommel = mesh(new THREE.TorusGeometry(.12, .03, 8, 20, Math.PI), MAT.gold()); pommel.position.set(0, .25, .16); g.add(pommel);
  const cantle = mesh(new THREE.TorusGeometry(.12, .025, 8, 20, Math.PI), MAT.gold()); cantle.position.set(0, .24, -.16); g.add(cantle);
  for (const sx of [-1, 1]) { const st = mesh(new THREE.TorusGeometry(.04, .01, 6, 12), MAT.gold()); st.position.set(sx * .28, -.12, .02); st.rotation.y = Math.PI / 2; g.add(st); }
  return g;
}

// ======================= ҚАЗАҚЫ ҚАҚПА + КІТАП ТҰҒЫРЫ =======================
function carvedTex(color = '#7a3f1a') {
  const c = document.createElement('canvas'); c.width = 256; c.height = 512; const g = c.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 256, 0); gr.addColorStop(0, '#5a2c10'); gr.addColorStop(.5, color); gr.addColorStop(1, '#5a2c10'); g.fillStyle = gr; g.fillRect(0, 0, 256, 512);
  g.strokeStyle = '#ffd36b'; g.lineWidth = 6; g.strokeRect(16, 16, 224, 480); g.lineWidth = 3; g.strokeRect(30, 30, 196, 452);
  const horn = (x, y, s) => { g.beginPath(); g.moveTo(x, y + 30 * s); g.lineTo(x, y); g.bezierCurveTo(x, y - 28 * s, x - 34 * s, y - 28 * s, x - 28 * s, y - 4 * s); g.bezierCurveTo(x - 24 * s, y + 10 * s, x - 10 * s, y + 6 * s, x - 12 * s, y - 4 * s); g.moveTo(x, y); g.bezierCurveTo(x, y - 28 * s, x + 34 * s, y - 28 * s, x + 28 * s, y - 4 * s); g.bezierCurveTo(x + 24 * s, y + 10 * s, x + 10 * s, y + 6 * s, x + 12 * s, y - 4 * s); g.stroke(); };
  g.lineWidth = 5; horn(128, 130, 1.6); horn(128, 380, 1.6);
  g.beginPath(); g.moveTo(128, 200); g.lineTo(190, 256); g.lineTo(128, 312); g.lineTo(66, 256); g.closePath(); g.stroke();
  g.beginPath(); g.arc(128, 256, 20, 0, 7); g.stroke();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
export function kazakhGate(num, subject, labelFont = FONT_D) {
  const g = new THREE.Group();
  const pil = std(0xffffff, { map: ornamentTex(), roughness: .5 });
  for (const x of [-1.9, 1.9]) {
    const base = mesh(new THREE.BoxGeometry(.9, .5, .9), MAT.marble()); base.position.set(x, .25, 0); g.add(base);
    const p = mesh(new THREE.CylinderGeometry(.32, .36, 4.4, 16), MAT.marble()); p.position.set(x, 2.7, 0); g.add(p);
    const band = mesh(new THREE.CylinderGeometry(.37, .37, .5, 16), pil); band.position.set(x, 1.2, 0); g.add(band);
    const band2 = band.clone(); band2.position.y = 4.2; g.add(band2);
    const cap = mesh(new THREE.SphereGeometry(.42, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2), MAT.gold()); cap.position.set(x, 4.9, 0); cap.scale.y = 1.4; g.add(cap);
  }
  // жоғарғы доға (шаңырақ үлгісі)
  const arch = mesh(new THREE.TorusGeometry(1.9, .2, 12, 48, Math.PI), MAT.gold()); arch.position.y = 4.9; g.add(arch);
  const sh = mesh(new THREE.TorusGeometry(.55, .09, 10, 32), MAT.gold()); sh.position.y = 6.3; g.add(sh);
  for (let i = 0; i < 4; i++) { const b = mesh(new THREE.BoxGeometry(1.1, .06, .06), MAT.gold()); b.position.y = 6.3; b.rotation.z = i * Math.PI / 4; g.add(b); }
  // есіктің екі жақтауы (топсада)
  const doorM = std(0xffffff, { map: carvedTex(), roughness: .55, metalness: .1 });
  const leaves = [];
  for (const sx of [-1, 1]) {
    const hinge = new THREE.Group(); hinge.position.set(sx * 1.56, 0, 0); g.add(hinge);
    const leaf = mesh(new THREE.BoxGeometry(1.56, 4.3, .12), doorM); leaf.position.set(-sx * .78, 2.65, 0); hinge.add(leaf);
    const knob = mesh(new THREE.TorusGeometry(.1, .025, 8, 16), MAT.gold()); knob.position.set(-sx * 1.35, 2.5, .09); hinge.add(knob);
    leaves.push({ hinge, sx });
  }
  // тұғыр мен кітап
  const ped = new THREE.Group(); ped.position.set(0, 0, -1.6); g.add(ped);
  const col = mesh(new THREE.CylinderGeometry(.35, .5, 1.1, 8), MAT.marble()); col.position.y = .55; ped.add(col);
  const top = mesh(new THREE.CylinderGeometry(.62, .45, .14, 8), MAT.gold()); top.position.y = 1.15; ped.add(top);
  const glow = mesh(new THREE.CylinderGeometry(.6, .6, 3, 24, 1, true), new THREE.MeshBasicMaterial({ color: 0xffe08a, transparent: true, opacity: .12, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }), false); glow.position.y = 2.7; glow.name = 'glow'; ped.add(glow);
  // белгі
  const c = document.createElement('canvas'); c.width = 512; c.height = 200; const x = c.getContext('2d');
  x.fillStyle = 'rgba(255,255,255,.95)'; x.beginPath(); x.roundRect(6, 6, 500, 188, 36); x.fill(); x.strokeStyle = '#c8963e'; x.lineWidth = 6; x.stroke();
  x.fillStyle = '#0f1b3d'; x.font = `800 84px ${labelFont}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(String(num), 110, 104);
  x.fillStyle = '#c8963e'; x.fillRect(190, 40, 4, 120);
  x.fillStyle = '#0f1b3d'; x.textAlign = 'left'; x.font = `700 40px ${labelFont}`; x.fillText(subject.length > 13 ? subject.slice(0, 12) + '…' : subject, 220, 84);
  x.fillStyle = '#6b7a99'; x.font = `600 30px ${FONT_B}`; x.fillText('Формула кітабы', 220, 136);
  const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tx, transparent: true })); sp.position.y = 7.4; sp.scale.set(3.6, 1.4, 1); g.add(sp);
  g.userData = { leaves, ped };
  return g;
}

// ======================= СЫЗҒЫШ, ТРАНСПОРТИР, ӨЛШЕМ СЫЗЫҚТАРЫ =======================
/** биіктігі H (сахна бірлігі) тік сызғыш, белгілері нақты метрмен */
export function bigRuler(H, realM, step) {
  const g = new THREE.Group();
  const c = document.createElement('canvas'); c.width = 128; c.height = 2048; const x = c.getContext('2d');
  const gr = x.createLinearGradient(0, 0, 128, 0); gr.addColorStop(0, '#ffe7a8'); gr.addColorStop(1, '#f2c45a'); x.fillStyle = gr; x.fillRect(0, 0, 128, 2048);
  x.strokeStyle = '#3a2a10'; x.fillStyle = '#2a1d08'; x.textAlign = 'left'; x.textBaseline = 'middle';
  const n = Math.round(realM / step);
  for (let i = 0; i <= n * 5; i++) { const v = i * step / 5; if (v > realM + 1e-6) break; const y = 2048 - v / realM * 2048; const big = i % 5 === 0; x.lineWidth = big ? 5 : 2; x.beginPath(); x.moveTo(0, y); x.lineTo(big ? 60 : 30, y); x.stroke(); if (big && v > 0 && 2048 - y > 40) { x.font = `800 30px ${FONT_D}`; x.fillText(String(Math.round(v)), 66, y); } }
  x.font = `800 30px ${FONT_D}`; x.fillText('м', 66, 2048 - 22);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  const bar = mesh(new THREE.BoxGeometry(.7, H, .12), [std(0xe6b54a), std(0xe6b54a), std(0xe6b54a), std(0xe6b54a), std(0xffffff, { map: t, roughness: .45 }), std(0xe6b54a)]);
  bar.position.y = H / 2; g.add(bar);
  const foot = mesh(new THREE.BoxGeometry(1.6, .2, 1), MAT.gold()); foot.position.y = .1; g.add(foot);
  return g;
}
export function textSprite(lines, opt = {}) {
  const arr = Array.isArray(lines) ? lines : [lines]; const fs = opt.size || 44, pad = 26;
  const c = document.createElement('canvas'); const x = c.getContext('2d');
  x.font = `700 ${fs}px ${opt.font || FONT_D}`; const w = Math.max(...arr.map(l => x.measureText(l).width)) + pad * 2; const h = arr.length * fs * 1.3 + pad * 1.4;
  c.width = Math.ceil(w); c.height = Math.ceil(h);
  x.fillStyle = opt.bg || 'rgba(255,255,255,.94)'; x.beginPath(); x.roundRect(3, 3, c.width - 6, c.height - 6, 22); x.fill();
  x.strokeStyle = opt.stroke || '#c8963e'; x.lineWidth = 4; x.stroke();
  arr.forEach((l, i) => { x.font = `${i === 0 ? 800 : 600} ${i === 0 ? fs : fs * .8}px ${i === 0 ? (opt.font || FONT_D) : FONT_B}`; x.fillStyle = i === 0 ? (opt.color || '#0f1b3d') : '#43506e'; x.textBaseline = 'middle'; x.fillText(l, pad, pad * .7 + fs * .65 + i * fs * 1.3); });
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthTest: opt.depthTest !== false })); const k = (opt.scale || 1) / 100; s.scale.set(c.width * k, c.height * k, 1);
  return s;
}
/** a → b өлшем сызығы (ұштарында көрсеткі) + жазу */
export function dimLine(a, b, label, color = 0x0f8b8d) {
  const g = new THREE.Group(); const m = new THREE.MeshBasicMaterial({ color });
  const d = new THREE.Vector3().subVectors(b, a); const L = d.length(); const dir = d.clone().normalize();
  const cyl = new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, L, 8), m); cyl.position.copy(a).addScaledVector(d, .5); cyl.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir); g.add(cyl);
  for (const [p, s] of [[a, -1], [b, 1]]) { const c = new THREE.Mesh(new THREE.ConeGeometry(.2, .5, 12), m); c.position.copy(p).addScaledVector(dir, -s * .25); c.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().multiplyScalar(s)); g.add(c); }
  if (label) { const sp = textSprite(label, { size: 46, scale: 1.3, stroke: '#0f8b8d' }); sp.position.copy(a).addScaledVector(d, .5); sp.position.y += .9; g.add(sp); }
  return g;
}
/** жерде тұрған транспортир; бұрыш доғасы мен сәуле */
export function protractor(angleDeg, rayLen) {
  const g = new THREE.Group();
  const c = document.createElement('canvas'); c.width = 1024; c.height = 520; const x = c.getContext('2d');
  x.translate(512, 500);
  x.fillStyle = 'rgba(220,245,255,.55)'; x.beginPath(); x.arc(0, 0, 490, Math.PI, 0); x.closePath(); x.fill();
  x.strokeStyle = '#0d3a5c'; x.lineWidth = 4; x.stroke();
  for (let a = 0; a <= 180; a++) { const r0 = a % 10 === 0 ? 420 : a % 5 === 0 ? 445 : 462; const ang = Math.PI + a * Math.PI / 180; x.lineWidth = a % 10 === 0 ? 4 : 2; x.beginPath(); x.moveTo(Math.cos(ang) * r0, Math.sin(ang) * r0); x.lineTo(Math.cos(ang) * 488, Math.sin(ang) * 488); x.stroke();
    if (a % 10 === 0) { x.save(); x.rotate(ang + Math.PI / 2); x.fillStyle = '#0d3a5c'; x.font = `700 30px ${FONT_D}`; x.textAlign = 'center'; x.fillText(String(a), 0, -385); x.restore(); } }
  x.fillStyle = '#0d3a5c'; x.beginPath(); x.arc(0, 0, 12, 0, 7); x.fill();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const pl = new THREE.Mesh(new THREE.PlaneGeometry(4, 4 * 520 / 1024), new THREE.MeshBasicMaterial({ map: t, transparent: true, side: THREE.DoubleSide, depthWrite: false }));
  pl.position.y = .4615 * 4 * 520 / 1024; g.add(pl);
  // бұрыш секторы
  const a = angleDeg * Math.PI / 180;
  const sec = new THREE.Mesh(new THREE.CircleGeometry(1.4, 32, 0, a), new THREE.MeshBasicMaterial({ color: 0xffb21a, transparent: true, opacity: .55, side: THREE.DoubleSide, depthWrite: false }));
  sec.rotation.y = Math.PI; sec.position.z = .01; g.add(sec);
  // сәуле (лазер)
  const ray = new THREE.Mesh(new THREE.CylinderGeometry(.04, .04, rayLen, 6), new THREE.MeshBasicMaterial({ color: 0xff3b3b, transparent: true, opacity: .85 }));
  ray.position.set(-Math.cos(a) * rayLen / 2, Math.sin(a) * rayLen / 2, 0); ray.rotation.z = Math.PI / 2 - a; g.add(ray);
  return g;
}
