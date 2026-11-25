// QAZAQ MATH — 3D «формула кітабы»: 45° бұрышпен ашылатын, ішінен 3D фигура көтерілетін кітап.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { FONT_D, FONT_B, textSprite } from './actors.js';

const PW = 2, PH = 2.8, T = .16; // бет ені, биіктігі, бет қалыңдығы
const FONT_F = '"Noto Serif", Georgia, serif';
const phys = (c, o = {}) => new THREE.MeshPhysicalMaterial({ color: c, roughness: .35, clearcoat: .6, ...o });
const std = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: .55, ...o });

function wrap(g, text, x, y, maxW, lh) {
  const words = String(text).split(' '); let line = '', yy = y;
  for (const w of words) { const t = line ? line + ' ' + w : w; if (g.measureText(t).width > maxW && line) { g.fillText(line, x, yy); line = w; yy += lh; } else line = t; }
  if (line) g.fillText(line, x, yy); return yy + lh;
}
function paper(g, W, H, side) {
  const gr = g.createLinearGradient(side === 'L' ? W : 0, 0, side === 'L' ? 0 : W, 0);
  gr.addColorStop(0, '#e8dcc2'); gr.addColorStop(.07, '#faf4e6'); gr.addColorStop(1, '#fdf9ef'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  g.strokeStyle = '#c8963e'; g.lineWidth = 4; g.strokeRect(40, 40, W - 80, H - 80); g.lineWidth = 1.5; g.strokeRect(52, 52, W - 104, H - 104);
  // бұрыштағы қошқар мүйіз
  g.lineWidth = 3; for (const [cx, cy, sx, sy] of [[52, 52, 1, 1], [W - 52, 52, -1, 1], [52, H - 52, 1, -1], [W - 52, H - 52, -1, -1]]) { g.beginPath(); g.moveTo(cx, cy + sy * 50); g.bezierCurveTo(cx + sx * 40, cy + sy * 40, cx + sx * 40, cy + sy * 10, cx + sx * 20, cy + sy * 16); g.moveTo(cx + sx * 50, cy); g.bezierCurveTo(cx + sx * 40, cy + sy * 40, cx + sx * 10, cy + sy * 40, cx + sx * 16, cy + sy * 20); g.stroke(); }
}
export function pageTextures(book, meta) {
  const W = 1024, H = 1434;
  const mk = (draw) => { const c = document.createElement('canvas'); c.width = W; c.height = H; draw(c.getContext('2d')); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };
  const L = mk((g) => {
    paper(g, W, H, 'L');
    g.fillStyle = '#9a7a3e'; g.font = `700 30px ${FONT_B}`; g.textAlign = 'center'; g.fillText('QAZAQ MATH · ФОРМУЛА КІТАБЫ', W / 2, 140);
    g.fillStyle = '#0f8b8d'; g.font = `700 36px ${FONT_B}`; g.fillText(meta.place || '', W / 2, 200);
    g.fillStyle = '#0f1b3d'; g.font = `800 66px ${FONT_D}`; let y = wrap(g, book.n, W / 2, 330, W - 200, 80);
    g.strokeStyle = '#c8963e'; g.lineWidth = 3; g.beginPath(); g.moveTo(W / 2 - 120, y - 20); g.lineTo(W / 2 + 120, y - 20); g.stroke();
    // формула
    g.fillStyle = '#fff8e6'; g.strokeStyle = '#c8963e'; g.lineWidth = 5; g.beginPath(); g.roundRect(110, y + 40, W - 220, 300, 40); g.fill(); g.stroke();
    let fs = 128; g.font = `italic 600 ${fs}px ${FONT_F}`; while (g.measureText(book.f).width > W - 300 && fs > 50) { fs -= 6; g.font = `italic 600 ${fs}px ${FONT_F}`; }
    g.fillStyle = '#12245a'; g.textBaseline = 'middle'; g.fillText(book.f, W / 2, y + 192); g.textBaseline = 'alphabetic';
    g.fillStyle = '#43506e'; g.font = `500 40px ${FONT_B}`; wrap(g, book.e, W / 2, y + 430, W - 220, 54);
    g.fillStyle = '#9a7a3e'; g.font = `600 30px ${FONT_B}`; g.fillText(meta.subject ? `${meta.subject} · ${meta.grade || ''} сынып` : '', W / 2, H - 110);
  });
  const R = mk((g) => {
    paper(g, W, H, 'R');
    g.textAlign = 'left'; g.fillStyle = '#c8963e'; g.font = `800 34px ${FONT_D}`; g.fillText('ЕСЕП', 110, 160);
    g.fillStyle = '#1d2742'; g.font = `500 38px ${FONT_B}`; let y = wrap(g, meta.task || '', 110, 220, W - 220, 52);
    g.fillStyle = '#c8963e'; g.font = `800 34px ${FONT_D}`; g.fillText('ШЕШУІ', 110, y + 50);
    g.fillStyle = '#1d2742'; g.font = `italic 500 40px ${FONT_F}`; y = wrap(g, meta.solution || '', 110, y + 112, W - 220, 56);
    if (meta.answer) { g.fillStyle = '#e8f6f1'; g.strokeStyle = '#0f8b8d'; g.lineWidth = 4; g.beginPath(); g.roundRect(110, y + 20, W - 220, 120, 28); g.fill(); g.stroke(); g.fillStyle = '#0b6b6c'; g.font = `800 52px ${FONT_D}`; g.textAlign = 'center'; g.fillText('Жауабы: ' + meta.answer, W / 2, y + 98); }
    g.textAlign = 'center'; g.fillStyle = '#9a7a3e'; g.font = `600 30px ${FONT_B}`; g.fillText(meta.no || '', W / 2, H - 110);
  });
  return { L, R };
}

// ---------- 3D pop-up фигуралар ----------
const C = { navy: 0x1b3a8c, teal: 0x14a3a6, gold: 0xf0b432, red: 0xe5484d, green: 0x3fbf6a, violet: 0x7c5cff, sky: 0x5ec8ff };
const lab = (t, x, y, z, s = .55) => { const sp = textSprite(t, { size: 54, scale: s, font: FONT_F }); sp.position.set(x, y, z); return sp; };
export function popup(kind) {
  const g = new THREE.Group(); const M = (c, o) => phys(c, o);
  const add = (geo, c, x = 0, y = 0, z = 0, o) => { const m = new THREE.Mesh(geo, M(c, o)); m.position.set(x, y, z); m.castShadow = true; g.add(m); return m; };
  switch (kind) {
    case 'triangle': { const s = new THREE.Shape([new THREE.Vector2(-.8, 0), new THREE.Vector2(.8, 0), new THREE.Vector2(.8, 1.2)]); const m = add(new THREE.ExtrudeGeometry(s, { depth: .12, bevelEnabled: true, bevelSize: .03, bevelThickness: .03 }), C.teal); m.position.z = -.06;
      add(new THREE.BoxGeometry(.18, .18, .14), C.gold, .71, .09, 0); g.add(lab('a', 0, -.18, .1), lab('b', 1.02, .6, .1), lab('c', -.1, .78, .1)); break; }
    case 'sphere': { add(new THREE.SphereGeometry(.7, 48, 32), C.gold, 0, .8, 0, { metalness: .8, roughness: .15 }); const r = new THREE.Mesh(new THREE.CylinderGeometry(.015, .015, .7), new THREE.MeshBasicMaterial({ color: 0x0f1b3d })); r.rotation.z = Math.PI / 2; r.position.set(.35, .8, .72); g.add(r); g.add(lab('r', .35, 1.02, .75)); break; }
    case 'cone': { add(new THREE.ConeGeometry(.75, 1.5, 48), C.sky, 0, .75, 0, { transparent: true, opacity: .85 }); add(new THREE.CylinderGeometry(.012, .012, 1.5), C.red, 0, .75, 0); g.add(lab('h', .15, .8, 0), lab('r', .4, .12, .4)); break; }
    case 'pyramid': { const m = add(new THREE.ConeGeometry(.9, 1.3, 4), C.gold, 0, .65, 0, { flatShading: true }); m.rotation.y = Math.PI / 4; g.add(lab('h', .1, .7, .1), lab('a', 0, .08, .75)); break; }
    case 'circle': case 'yurt': { if (kind === 'yurt') { add(new THREE.CylinderGeometry(.75, .75, .5, 40), 0xf5efe2, 0, .25, 0); add(new THREE.ConeGeometry(.82, .55, 40), 0xf5efe2, 0, .78, 0); add(new THREE.TorusGeometry(.2, .04, 8, 24), 0x8a5a2b, 0, 1.03, 0).rotation.x = Math.PI / 2; }
      else { add(new THREE.CylinderGeometry(.8, .8, .08, 64), C.teal, 0, .5, 0).rotation.x = Math.PI / 2; const r = new THREE.Mesh(new THREE.CylinderGeometry(.015, .015, .8), new THREE.MeshBasicMaterial({ color: 0xffffff })); r.rotation.z = Math.PI / 2; r.position.set(.4, .5, .06); g.add(r); g.add(lab('r', .4, .7, .1)); } break; }
    case 'square': case 'rect': { const w = kind === 'square' ? 1.1 : 1.5; add(new THREE.BoxGeometry(w, 1.1, .1), kind === 'square' ? C.violet : C.green, 0, .7, 0); g.add(lab('a', 0, .02, .1), lab(kind === 'square' ? 'a' : 'b', w / 2 + .18, .7, .1)); break; }
    case 'bars': { [.5, .9, 1.3, .7].forEach((h, i) => add(new THREE.BoxGeometry(.28, h, .28), [C.teal, C.gold, C.red, C.violet][i], -.54 + i * .36, h / 2, 0)); break; }
    case 'star8': { const s = new THREE.Shape(); for (let i = 0; i < 16; i++) { const r = i % 2 ? .38 : .8, a = i / 16 * Math.PI * 2; i ? s.lineTo(Math.cos(a) * r, Math.sin(a) * r) : s.moveTo(Math.cos(a) * r, Math.sin(a) * r); } const m = add(new THREE.ExtrudeGeometry(s, { depth: .12, bevelSize: .03, bevelThickness: .03 }), C.sky, 0, .85, -.06, { metalness: .4 }); m.name = 'spinz'; g.add(lab('45°', .7, 1.5, .1)); break; }
    case 'mountain': { add(new THREE.ConeGeometry(.8, 1.4, 7), 0x6f7d6a, -.2, .7, 0, { flatShading: true }); add(new THREE.ConeGeometry(.33, .45, 7), 0xffffff, -.2, 1.2, 0, { flatShading: true }); add(new THREE.ConeGeometry(.5, .8, 6), 0x7d8a76, .55, .4, .1, { flatShading: true }); g.add(lab('Δh', .75, 1.1, .1)); break; }
    case 'thermo': { add(new THREE.CylinderGeometry(.12, .12, 1.4, 24), 0xffffff, 0, .8, 0, { transparent: true, opacity: .5 }); add(new THREE.CylinderGeometry(.07, .07, .9, 16), C.red, 0, .55, 0); add(new THREE.SphereGeometry(.2, 24, 16), C.red, 0, .12, 0); for (let i = 0; i < 6; i++) add(new THREE.BoxGeometry(.16, .02, .02), 0x0f1b3d, .16, .3 + i * .2, 0); g.add(lab('t°', .45, 1.3, 0)); break; }
    case 'ruler': { add(new THREE.BoxGeometry(1.7, .3, .05), C.gold, 0, .5, 0); for (let i = 0; i <= 10; i++) add(new THREE.BoxGeometry(.015, i % 5 ? .08 : .15, .02), 0x0f1b3d, -.8 + i * .16, .58 + (i % 5 ? .02 : -.02), .035); g.add(lab('1 : k', 0, .95, .05)); break; }
    case 'timeline': { add(new THREE.BoxGeometry(1.7, .06, .06), C.navy, 0, .5, 0); [-.7, 0, .7].forEach((x, i) => { add(new THREE.SphereGeometry(.1, 16, 12), [C.gold, C.teal, C.red][i], x, .5, 0); }); g.add(lab('t₁', -.7, .82, 0), lab('t₂', .7, .82, 0), lab('Δt', 0, .2, 0)); break; }
    case 'string': { add(new THREE.SphereGeometry(.45, 32, 16), 0xa8642c, -.45, .55, 0).scale.set(1, 1.3, .35); add(new THREE.BoxGeometry(1.4, .1, .05), 0x6b3b1a, .5, .55, 0); add(new THREE.CylinderGeometry(.008, .008, 1.9), 0xffffff, .3, .6, .05).rotation.z = Math.PI / 2; g.add(lab('2 : 1', .3, 1.05, .05)); break; }
    case 'road': { add(new THREE.BoxGeometry(1.8, .04, .45), 0x3a3f4a, 0, .05, 0); for (let i = 0; i < 5; i++) add(new THREE.BoxGeometry(.18, .045, .04), 0xffffff, -.7 + i * .35, .07, 0); add(new THREE.BoxGeometry(.4, .22, .26), C.red, -.4, .2, 0); g.add(lab('s = v · t', 0, .7, 0)); break; }
    case 'lever': { add(new THREE.ConeGeometry(.22, .35, 3), C.gold, 0, .18, 0); const b = add(new THREE.BoxGeometry(1.9, .06, .2), C.navy, 0, .4, 0); b.rotation.z = .08; add(new THREE.BoxGeometry(.3, .3, .3), C.red, -.75, .6, 0); add(new THREE.BoxGeometry(.2, .2, .2), C.teal, .8, .38, 0); g.add(lab('F₁l₁ = F₂l₂', 0, 1.05, 0)); break; }
    case 'balance': { add(new THREE.CylinderGeometry(.04, .06, 1, 12), C.gold, 0, .5, 0); add(new THREE.BoxGeometry(1.6, .04, .06), C.gold, 0, 1, 0); for (const x of [-.7, .7]) { add(new THREE.CylinderGeometry(.3, .25, .05, 24), C.gold, x, .7, 0); } add(new THREE.BoxGeometry(.2, .2, .2), C.red, -.7, .83, 0); add(new THREE.SphereGeometry(.12, 16, 12), C.teal, .62, .85, 0); add(new THREE.SphereGeometry(.12, 16, 12), C.teal, .8, .85, 0); g.add(lab('x', -.7, 1.15, .1)); break; }
    case 'rocket': { add(new THREE.CylinderGeometry(.18, .2, 1.1, 24), 0xffffff, 0, .75, 0); add(new THREE.ConeGeometry(.18, .4, 24), C.red, 0, 1.5, 0); for (let i = 0; i < 4; i++) { const f = add(new THREE.BoxGeometry(.03, .3, .22), C.navy, Math.cos(i * Math.PI / 2) * .2, .3, Math.sin(i * Math.PI / 2) * .2); f.rotation.y = -i * Math.PI / 2; } add(new THREE.ConeGeometry(.15, .4, 16), C.gold, 0, .02, 0, { emissive: 0xff8800, emissiveIntensity: 1 }).rotation.x = Math.PI; break; }
    case 'graph': { add(new THREE.BoxGeometry(1.6, .03, .03), 0x0f1b3d, 0, .1, 0); add(new THREE.BoxGeometry(.03, 1.4, .03), 0x0f1b3d, -.8, .8, 0); const pts = []; for (let i = 0; i <= 30; i++) { const x = i / 30; pts.push(new THREE.Vector3(-.8 + x * 1.6, .12 + Math.log2(1 + x * 15) / 4 * 1.2, 0)); } const tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 60, .035, 8), M(C.red)); g.add(tube); g.add(lab('y = log₂ x', .2, 1.45, 0)); break; }
    case 'clock': { add(new THREE.CylinderGeometry(.7, .7, .1, 48), 0xffffff, 0, .8, 0).rotation.x = Math.PI / 2; add(new THREE.TorusGeometry(.7, .05, 8, 48), C.gold, 0, .8, 0); add(new THREE.BoxGeometry(.04, .45, .04), C.navy, 0, 1, .08); add(new THREE.BoxGeometry(.3, .04, .04), C.red, .14, .8, .08); break; }
    case 'pie': { const p1 = add(new THREE.CylinderGeometry(.8, .8, .14, 48, 1, false, 0, Math.PI * 2 * .86), C.teal, 0, .5, 0); p1.rotation.x = Math.PI / 2; const p2 = add(new THREE.CylinderGeometry(.8, .8, .14, 24, 1, false, Math.PI * 2 * .86, Math.PI * 2 * .14), C.gold, .12, .6, .1); p2.rotation.x = Math.PI / 2; g.add(lab('%', .2, 1.45, .1)); break; }
    case 'numberline': { add(new THREE.BoxGeometry(1.9, .04, .04), C.navy, 0, .5, 0); for (let i = 0; i <= 8; i++) add(new THREE.BoxGeometry(.02, .12, .04), C.navy, -.9 + i * .225, .5, 0); add(new THREE.SphereGeometry(.09, 16, 12), C.red, -.45, .5, 0); add(new THREE.SphereGeometry(.09, 16, 12), C.teal, .675, .5, 0); g.add(lab('−', -.45, .8, 0), lab('0', 0, .2, 0), lab('+', .675, .8, 0)); break; }
    case 'fall': { add(new THREE.SphereGeometry(.16, 24, 16), 0x8a6a4a, .3, 1.3, 0, { flatShading: true }).name = 'drop'; for (let i = 0; i < 5; i++) add(new THREE.SphereGeometry(.035, 8, 8), C.sky, .3, 1.1 - i * i * .04, 0); add(new THREE.BoxGeometry(.5, 1.4, .4), 0xb4482a, -.4, .7, 0, { flatShading: true }); g.add(lab('h = gt²/2', .25, 1.7, 0)); break; }
    case 'series': { [1, .5, .25, .125, .0625].forEach((w, i, a) => { const x = -.9 + a.slice(0, i).reduce((s, v) => s + v * .85, 0) + w * .85 / 2; add(new THREE.BoxGeometry(w * .85 - .02, .6, .2), [C.teal, C.gold, C.red, C.violet, C.green][i], x, .5, 0); }); g.add(lab('1 + ½ + ¼ + … = 2', 0, 1.1, 0)); break; }
    default: add(new THREE.TorusKnotGeometry(.4, .14, 120, 16), C.gold, 0, .8, 0);
  }
  return g;
}

/** Кітап: {group, setOpen(0..1)} */
export function makeBook(book, meta, coverColor = 0x16306e) {
  const g = new THREE.Group();
  const { L, R } = pageTextures(book, meta);
  const edge = std(0xf2ead6, { roughness: .9 });
  const coverM = phys(coverColor, { roughness: .45, clearcoat: .4 });
  const goldM = phys(0xf0b432, { metalness: .9, roughness: .2 });
  const pageMat = (tex) => [edge, edge, new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: 0xffffff, emissiveIntensity: .62, roughness: .95, envMapIntensity: .2, toneMapped: false }), edge, edge, edge];
  // сол жақ
  const left = new THREE.Group(); g.add(left);
  const lb = new THREE.Mesh(new THREE.BoxGeometry(PW, T, PH), pageMat(L)); lb.position.set(-PW / 2 - .02, -T / 2, 0); lb.castShadow = lb.receiveShadow = true; left.add(lb);
  const lc = new THREE.Mesh(new THREE.BoxGeometry(PW + .12, .06, PH + .14), coverM); lc.position.set(-PW / 2 - .02, -T - .03, 0); lc.castShadow = true; left.add(lc);
  // оң жақ (топсада)
  const pivot = new THREE.Group(); g.add(pivot);
  const rb = new THREE.Mesh(new THREE.BoxGeometry(PW, T, PH), pageMat(R)); rb.position.set(PW / 2 + .02, -T / 2, 0); rb.castShadow = rb.receiveShadow = true; pivot.add(rb);
  const rc = new THREE.Mesh(new THREE.BoxGeometry(PW + .12, .06, PH + .14), coverM); rc.position.set(PW / 2 + .02, -T - .03, 0); rc.castShadow = true; pivot.add(rc);
  // мұқабадағы алтын ою (сыртқы жағы)
  const orn = document.createElement('canvas'); orn.width = 512; orn.height = 720; const og = orn.getContext('2d');
  og.fillStyle = '#' + new THREE.Color(coverColor).getHexString(); og.fillRect(0, 0, 512, 720); og.strokeStyle = '#f0c040'; og.lineWidth = 8; og.strokeRect(30, 30, 452, 660);
  og.fillStyle = '#f0c040'; og.font = `800 54px ${FONT_D}`; og.textAlign = 'center'; og.fillText('QAZAQ', 256, 300); og.fillText('MATH', 256, 360); og.font = `italic 600 46px ${FONT_F}`; og.fillText(book.f.slice(0, 16), 256, 470);
  const ot = new THREE.CanvasTexture(orn); ot.colorSpace = THREE.SRGBColorSpace;
  const outer = new THREE.Mesh(new THREE.PlaneGeometry(PW + .1, PH + .12), std(0xffffff, { map: ot, roughness: .4, metalness: .2 })); outer.rotation.x = Math.PI / 2; outer.position.set(PW / 2 + .02, -T - .061, 0); pivot.add(outer);
  // түптеме
  const spine = new THREE.Mesh(new THREE.CylinderGeometry(.09, .09, PH + .14, 16, 1, false, Math.PI / 2, Math.PI), coverM); spine.rotation.x = -Math.PI / 2; spine.position.y = -T - .03; g.add(spine);
  const band = new THREE.Mesh(new THREE.BoxGeometry(.05, .02, PH + .16), goldM); band.position.y = -T - .1; g.add(band);
  // парақтар (ашылу кезінде желпінеді)
  const sheets = [];
  for (let i = 0; i < 5; i++) { const sp = new THREE.Group(); const s = new THREE.Mesh(new THREE.PlaneGeometry(PW * .98, PH * .97), std(0xfbf6ea, { side: THREE.DoubleSide, roughness: .9 })); s.rotation.x = -Math.PI / 2; s.position.x = PW * .49; sp.add(s); sp.position.y = .004 + i * .002; g.add(sp); sheets.push(sp); }
  // pop-up
  const pop = popup(book.pop); pop.position.set(0, 0, -1.25); pop.scale.setScalar(.78); const popWrap = new THREE.Group(); popWrap.add(pop); g.add(popWrap);
  const setOpen = (t) => {
    const e = t < 0 ? 0 : t > 1 ? 1 : t; const k = 1 - Math.pow(1 - e, 3);
    pivot.rotation.z = Math.PI * (1 - k) * .995;
    sheets.forEach((s, i) => { const d = Math.max(0, Math.min(1, (e - .25 - i * .1) / .45)); s.rotation.z = Math.PI * (1 - k) * .99 + Math.PI * Math.sin(d * Math.PI) * .25 * (i % 2 ? 1 : -.6) * (1 - d); s.visible = e < .98; });
    const p = Math.max(0, Math.min(1, (e - .45) / .55)); const pe = p < 1 ? 1 - Math.pow(2, -10 * p) * Math.cos(p * 9) : 1;
    popWrap.scale.set(Math.max(.001, pe), Math.max(.001, pe), Math.max(.001, pe)); popWrap.rotation.x = -(1 - p) * Math.PI / 2;
  };
  setOpen(0);
  g.userData = { setOpen, pop };
  return g;
}

// ---------- Кітапты көру терезесі ----------
export class BookViewer {
  constructor(canvas) {
    this.canvas = canvas;
    this.r = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.r.setPixelRatio(Math.min(devicePixelRatio, 2)); this.r.outputColorSpace = THREE.SRGBColorSpace; this.r.toneMapping = THREE.ACESFilmicToneMapping; this.r.toneMappingExposure = 1.05;
    this.r.shadowMap.enabled = true; this.r.shadowMap.type = THREE.PCFSoftShadowMap;
    this.scene = new THREE.Scene();
    const pm = new THREE.PMREMGenerator(this.r); this.scene.environment = pm.fromScene(new RoomEnvironment(), .04).texture;
    this.cam = new THREE.PerspectiveCamera(36, 1, .1, 100);
    this.cam.position.set(0, 4.5, 4.5); // 45° бұрыш
    this.ctl = new OrbitControls(this.cam, canvas); this.ctl.target.set(0, .3, 0); this.ctl.enableDamping = true; this.ctl.minDistance = 3.4; this.ctl.maxDistance = 12; this.ctl.maxPolarAngle = 1.25; this.ctl.enablePan = false;
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0xe8dcc2, .9));
    const d = new THREE.DirectionalLight(0xfff3dc, 2.2); d.position.set(-3, 8, 4); d.castShadow = true; d.shadow.mapSize.set(2048, 2048); Object.assign(d.shadow.camera, { left: -5, right: 5, top: 5, bottom: -5 }); d.shadow.radius = 6; this.scene.add(d);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.ShadowMaterial({ opacity: .18 })); ground.rotation.x = -Math.PI / 2; ground.position.y = -.25; ground.receiveShadow = true; this.scene.add(ground);
    this.clock = new THREE.Clock();
  }
  show(book, meta) {
    if (this.book) { this.scene.remove(this.book); this.book.traverse(o => { o.geometry?.dispose(); }); }
    this.book = makeBook(book, meta, meta.cover || 0x16306e); this.book.rotation.x = 0; this.scene.add(this.book);
    this.t0 = performance.now(); this.cam.position.set(0, 4.5, 4.5); this.ctl.target.set(0, .2, -.1);
    this.resize(); this.r.setAnimationLoop(() => this.frame());
  }
  resize() { const w = this.canvas.clientWidth || 800, h = this.canvas.clientHeight || 500; this.r.setSize(w, h, false); this.cam.aspect = w / h; this.cam.updateProjectionMatrix(); }
  frame() {
    const t = (performance.now() - this.t0) / 1000; const dt = this.clock.getDelta();
    if (this.book) { this.book.userData.setOpen(Math.min(1, t / 1.8)); const p = this.book.userData.pop; p.rotation.y = Math.sin(t * .6) * .35; p.traverse(o => { if (o.name === 'spinz') o.rotation.z += dt * .6; }); this.book.position.y = Math.sin(t * 1.2) * .03; }
    this.ctl.update(); this.r.render(this.scene, this.cam);
  }
  hide() { this.r.setAnimationLoop(null); }
}
