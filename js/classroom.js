// QAZAQ MATH — «Онлайн сынып»: жылы кітапхана-сынып. Онлайн оқушылар өз кейіпкерімен жүреді,
// басқа жерде жүргендер партада отырады. Әр адамның үстінде аты мен ұпайы. Шешімдер көрсетілмейді.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import * as AC from './actors.js';
import { MAT, ornamentTex } from './models.js';

const std = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: .7, ...o });
function mesh(geo, m, cast = true) { const o = new THREE.Mesh(geo, m); o.castShadow = cast; o.receiveShadow = true; return o; }
function tex(w, h, draw, rep) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...rep); } return t; }

const ROOM = { w: 34, d: 26, h: 9 };
// партадағы орындар (12 парта: 4 × 3), айналмалы үстелдер
const SEATS = []; for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) SEATS.push([-10.5 + c * 7, -1 + r * 5.2]);

function buildRoom(S) {
  // еден — ағаш тақтай
  const floorT = tex(512, 512, (g) => { for (let i = 0; i < 8; i++) { g.fillStyle = `hsl(28, ${38 + (i % 3) * 6}%, ${30 + (i * 7) % 9}%)`; g.fillRect(0, i * 64, 512, 64); g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 2; g.strokeRect(0, i * 64, 512, 64); for (let k = 0; k < 3; k++) { const x = ((i * 173 + k * 197) % 512); g.beginPath(); g.moveTo(x, i * 64); g.lineTo(x, i * 64 + 64); g.stroke(); } for (let k = 0; k < 40; k++) { g.fillStyle = 'rgba(0,0,0,.05)'; g.fillRect(Math.random() * 512, i * 64 + Math.random() * 64, 60, 1); } } }, [6, 5]);
  const floor = mesh(new THREE.PlaneGeometry(ROOM.w, ROOM.d), std(0xffffff, { map: floorT, roughness: .55 }), false); floor.rotation.x = -Math.PI / 2; S.add(floor);
  // кілем (қазақ ою-өрнегі)
  const rugT = tex(512, 256, (g) => { g.fillStyle = '#7a1e2c'; g.fillRect(0, 0, 512, 256); g.strokeStyle = '#e9c46a'; g.lineWidth = 6; g.strokeRect(14, 14, 484, 228); g.lineWidth = 3; g.strokeRect(28, 28, 456, 200);
    const horn = (x, y, s) => { g.beginPath(); g.moveTo(x, y + 26 * s); g.lineTo(x, y); g.bezierCurveTo(x, y - 24 * s, x - 30 * s, y - 24 * s, x - 25 * s, y - 4 * s); g.bezierCurveTo(x - 21 * s, y + 9 * s, x - 9 * s, y + 5 * s, x - 11 * s, y - 4 * s); g.moveTo(x, y); g.bezierCurveTo(x, y - 24 * s, x + 30 * s, y - 24 * s, x + 25 * s, y - 4 * s); g.bezierCurveTo(x + 21 * s, y + 9 * s, x + 9 * s, y + 5 * s, x + 11 * s, y - 4 * s); g.stroke(); };
    g.lineWidth = 4; for (let i = 0; i < 5; i++) horn(80 + i * 88, 130, 1.3); });
  const rug = mesh(new THREE.PlaneGeometry(16, 8), std(0xffffff, { map: rugT, roughness: .95 }), false); rug.rotation.x = -Math.PI / 2; rug.position.set(0, .02, 9.5); S.add(rug);
  // қабырғалар
  const wallT = tex(256, 256, (g) => { const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, '#5b3a22'); gr.addColorStop(1, '#3b2414'); g.fillStyle = gr; g.fillRect(0, 0, 256, 256); g.strokeStyle = 'rgba(255,210,140,.12)'; g.lineWidth = 3; g.strokeRect(10, 10, 236, 236); }, [8, 2]);
  const wallM = std(0xffffff, { map: wallT, roughness: .8 });
  const back = mesh(new THREE.PlaneGeometry(ROOM.w, ROOM.h), wallM, false); back.position.set(0, ROOM.h / 2, -ROOM.d / 2); S.add(back);
  for (const sx of [-1, 1]) { const w = mesh(new THREE.PlaneGeometry(ROOM.d, ROOM.h), wallM, false); w.rotation.y = -sx * Math.PI / 2; w.position.set(sx * ROOM.w / 2, ROOM.h / 2, 0); S.add(w); }
  const front = mesh(new THREE.PlaneGeometry(ROOM.w, ROOM.h), wallM, false); front.rotation.y = Math.PI; front.position.set(0, ROOM.h / 2, ROOM.d / 2); S.add(front);
  const ceil = mesh(new THREE.PlaneGeometry(ROOM.w, ROOM.d), std(0x2a1a10, { roughness: 1 }), false); ceil.rotation.x = Math.PI / 2; ceil.position.y = ROOM.h; S.add(ceil);
  // кітап сөрелері
  const shelfM = std(0x4a2c17, { roughness: .6 }); const books = []; const dmy = new THREE.Object3D(); const rnd = (() => { let a = 7; return () => { a = (a * 16807) % 2147483647; return a / 2147483647; }; })();
  const addShelf = (x, z, rotY, len) => {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rotY; S.add(g);
    const body = mesh(new THREE.BoxGeometry(len, 7.2, .9), shelfM); body.position.set(0, 3.6, 0); g.add(body);
    for (let r = 0; r < 6; r++) { const y = .5 + r * 1.15; const pl = mesh(new THREE.BoxGeometry(len, .08, 1), shelfM); pl.position.set(0, y, .1); g.add(pl);
      let bx = -len / 2 + .2; while (bx < len / 2 - .3) { const w = .12 + rnd() * .14, h = .6 + rnd() * .38; if (rnd() < .08) { bx += .3; continue; } dmy.position.set(bx + w / 2, y + .04 + h / 2, .25); dmy.rotation.set(0, 0, rnd() < .06 ? .25 : 0); dmy.scale.set(w, h, .55); dmy.updateMatrix(); g.updateMatrixWorld(true); const m = new THREE.Matrix4().multiplyMatrices(g.matrixWorld, dmy.matrix); books.push(m); bx += w + .015; } }
  };
  addShelf(-8.5, -ROOM.d / 2 + .5, 0, 15); addShelf(8.5, -ROOM.d / 2 + .5, 0, 15);
  addShelf(-ROOM.w / 2 + .5, -4, Math.PI / 2, 14); addShelf(ROOM.w / 2 - .5, -4, -Math.PI / 2, 14);
  const bookM = std(0xffffff, { roughness: .6 }); const im = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), bookM, books.length);
  const cols = ['#7a1e2c', '#16306e', '#0f5f4c', '#8a5a2b', '#c8963e', '#3b2a5a', '#a63d24', '#2c4a2a', '#d9c49a'];
  books.forEach((m, i) => { im.setMatrixAt(i, m); im.setColorAt(i, new THREE.Color(cols[Math.floor(rnd() * cols.length)])); }); im.castShadow = true; S.add(im);
  // тақта + шаңырақ белгісі
  const boardT = tex(1024, 512, (g) => { g.fillStyle = '#1f3d33'; g.fillRect(0, 0, 1024, 512); g.strokeStyle = 'rgba(255,255,255,.08)'; for (let i = 0; i < 30; i++) { g.beginPath(); g.moveTo(Math.random() * 1024, Math.random() * 512); g.lineTo(Math.random() * 1024, Math.random() * 512); g.stroke(); }
    g.fillStyle = '#f3efe2'; g.font = '800 64px Montserrat, sans-serif'; g.textAlign = 'center'; g.fillText('QAZAQ MATH · Онлайн сынып', 512, 120); g.font = 'italic 600 70px "Noto Serif", Georgia, serif'; g.fillText('a² + b² = c²   ·   S = πr²', 512, 260); g.font = '600 44px Inter, sans-serif'; g.fillStyle = '#f0c040'; g.fillText('Білім. Есеп. Қазақстан!', 512, 380); });
  const board = mesh(new THREE.PlaneGeometry(10, 5), std(0xffffff, { map: boardT, roughness: .9 }), false); board.position.set(0, 4.6, -ROOM.d / 2 + .06); S.add(board);
  const bf = mesh(new THREE.BoxGeometry(10.4, 5.4, .1), std(0x8a5a2b)); bf.position.set(0, 4.6, -ROOM.d / 2 + .02); S.add(bf);
  const sh = mesh(new THREE.TorusGeometry(.9, .09, 10, 40), MAT.gold()); sh.position.set(0, 8.1, -ROOM.d / 2 + .2); S.add(sh);
  for (let i = 0; i < 4; i++) { const b = mesh(new THREE.BoxGeometry(1.8, .07, .07), MAT.gold()); b.position.copy(sh.position); b.rotation.z = i * Math.PI / 4; S.add(b); }
  // парталар, орындықтар, жасыл шамдар
  const deskM = std(0x6b3f1f, { roughness: .45 }), chairM = std(0x4a2a14, { roughness: .6 }), lampG = new THREE.MeshStandardMaterial({ color: 0x1f8a5a, emissive: 0x2fd08a, emissiveIntensity: .9, roughness: .3 });
  for (const [x, z] of SEATS) {
    const top = mesh(new THREE.BoxGeometry(3.2, .14, 1.6), deskM); top.position.set(x, 1.5, z - .9); S.add(top);
    for (const [dx, dz] of [[-1.45, -.65], [1.45, -.65], [-1.45, .65], [1.45, .65]]) { const l = mesh(new THREE.BoxGeometry(.12, 1.5, .12), deskM); l.position.set(x + dx, .75, z - .9 + dz); S.add(l); }
    const seat = mesh(new THREE.BoxGeometry(1.1, .12, 1), chairM); seat.position.set(x, .85, z + .3); S.add(seat);
    const backr = mesh(new THREE.BoxGeometry(1.1, .55, .1), chairM); backr.position.set(x, 1.2, z + .8); S.add(backr);
    const lamp = mesh(new THREE.CylinderGeometry(.32, .32, .5, 16, 1, false, 0, Math.PI), lampG); lamp.rotation.z = Math.PI / 2; lamp.position.set(x + 1, 2.05, z - 1.2); S.add(lamp);
    const stem = mesh(new THREE.CylinderGeometry(.03, .05, .5), MAT.gold()); stem.position.set(x + 1, 1.8, z - 1.2); S.add(stem);
  }
  // дөңгелек үстелдер
  for (const [x, z] of [[-11, 9], [11, 9]]) { const t = mesh(new THREE.CylinderGeometry(1.8, 1.8, .14, 32), deskM); t.position.set(x, 1.4, z); S.add(t); const leg = mesh(new THREE.CylinderGeometry(.18, .4, 1.4, 12), deskM); leg.position.set(x, .7, z); S.add(leg); }
  // люстра
  const ch = new THREE.Group(); ch.position.set(0, ROOM.h - 1.6, 2); S.add(ch);
  const ring = mesh(new THREE.TorusGeometry(2.6, .1, 8, 48), std(0x2a1a10, { metalness: .6, roughness: .4 })); ring.rotation.x = Math.PI / 2; ch.add(ring);
  for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; const bulb = mesh(new THREE.SphereGeometry(.28, 16, 12), new THREE.MeshBasicMaterial({ color: 0xffe2a8 }), false); bulb.position.set(Math.cos(a) * 2.6, .25, Math.sin(a) * 2.6); ch.add(bulb); }
  const glob = mesh(new THREE.SphereGeometry(.9, 24, 16), new THREE.MeshBasicMaterial({ color: 0xfff1d0 }), false); glob.position.y = -.4; ch.add(glob);
  // жарық
  S.add(new THREE.HemisphereLight(0xffd9a8, 0x2a1408, .75));
  const pl = new THREE.PointLight(0xffc98a, 60, 30, 1.6); pl.position.set(0, ROOM.h - 2.2, 2); S.add(pl);
  for (const [x, z] of [[-10, -6], [10, -6], [0, 10]]) { const p = new THREE.PointLight(0xffb870, 18, 16, 1.8); p.position.set(x, 5, z); S.add(p); }
  S.fog = new THREE.Fog(0x1a0f08, 30, 70); S.background = new THREE.Color(0x1a0f08);
}

export function installClassroom(Engine) {
  Object.assign(Engine.prototype, {
    enterClass(prof, observer) {
      this.leaveClass();
      const S = new THREE.Scene(); this.classScene = S; buildRoom(S);
      this.scene = S; this.mode = 'class'; this.paused = false; this.controls.enabled = false;
      this.cl = { x: 0, z: 9, h: Math.PI, v: 0, observer: !!observer, peers: new Map() };
      if (!observer) { this.clMe = AC.mascot(prof.char || 'tamshy', prof.color || '#2aa8ff'); this.clMe.scale.setScalar(1.25); this.clMe.position.set(0, 0, 9); S.add(this.clMe);
        this.clMeLab = AC.textSprite(['Мен', ''], { size: 40, scale: .26, stroke: prof.color || '#c8963e' }); this.clMeLab.position.y = 1.7; this.clMe.add(this.clMeLab); this.clMeLab.scale.multiplyScalar(1 / 1.25); }
      if (observer) { this.clOrbit = new OrbitControls(this.camera, this.canvas); this.clOrbit.target.set(0, 1.2, 4); this.clOrbit.enableDamping = true; this.clOrbit.maxPolarAngle = 1.45; this.clOrbit.minDistance = 4; this.clOrbit.maxDistance = 26; this.camera.position.set(0, 7.5, -10.5); }
      else { this.camera.position.set(0, 5, 17); this.camYaw = 0; this.camPitch = .35; }
    },
    leaveClass() {
      if (!this.classScene) return;
      this.clOrbit?.dispose(); this.clOrbit = null;
      this.classScene.traverse(o => { o.geometry?.dispose(); });
      this.classScene = null; this.cl = null; this.clMe = null;
    },
    classPresence() { const c = this.cl; return c && !c.observer ? { cx: +c.x.toFixed(2), cz: +c.z.toFixed(2), ch: +c.h.toFixed(2) } : {}; },
    setMyClassLabel(text) { if (!this.clMe || this._myLab === text) return; this._myLab = text; this.clMe.remove(this.clMeLab); const sp = AC.textSprite(text, { size: 40, scale: .26, stroke: '#c8963e' }); sp.position.y = 1.7; sp.scale.multiplyScalar(1 / 1.25); this.clMe.add(sp); this.clMeLab = sp; },
    /** list: [{sid, name, char, color, points, stars, where, presence}] — онлайн оқушылар (өзімнен басқа) */
    setClassPeers(list) {
      if (!this.classScene) return; const S = this.classScene, P = this.cl.peers; const seen = new Set();
      const seated = list.filter(p => p.presence?.view !== 'class').sort((a, b) => String(a.sid).localeCompare(String(b.sid)));
      for (const p of list) {
        seen.add(p.sid); let e = P.get(p.sid);
        if (!e) { const m = AC.mascot(p.char || 'tamshy', p.color || '#2aa8ff'); m.scale.setScalar(1.25); S.add(m); e = { m, lab: null, txt: '' }; P.set(p.sid, e); m.position.set(0, 0, 11); }
        const inClass = p.presence?.view === 'class' && p.presence.cx != null;
        if (inClass) { e.target = new THREE.Vector3(p.presence.cx, 0, p.presence.cz); e.th = p.presence.ch || 0; e.seat = null; }
        else { const i = seated.indexOf(p) % SEATS.length; const [sx, sz] = SEATS[i]; e.seat = [sx, sz]; e.target = new THREE.Vector3(sx, .9, sz + .3); e.th = Math.PI; }
        const txt = [`${p.first || p.name}  ·  ${p.points || 0} ұпай`, inClass ? `★ ${p.stars || 0} · сыныпта` : `★ ${p.stars || 0} · ${p.whereShort || ''}`];
        const key = txt.join('|');
        if (e.txt !== key) { if (e.lab) e.m.remove(e.lab); e.lab = AC.textSprite(txt, { size: 40, scale: .3, stroke: p.color || '#c8963e' }); e.lab.position.y = 1.75; e.lab.scale.multiplyScalar(1 / 1.25); e.m.add(e.lab); e.txt = key; }
      }
      for (const [sid, e] of [...P]) if (!seen.has(sid)) { S.remove(e.m); P.delete(sid); }
    },
    updateClass(dt) {
      const c = this.cl; if (!c) return;
      for (const e of c.peers.values()) {
        if (e.target) { const before = e.m.position.clone(); e.m.position.lerp(e.target, 1 - Math.exp(-dt * 4)); let dh = e.th - e.m.rotation.y; dh = Math.atan2(Math.sin(dh), Math.cos(dh)); e.m.rotation.y += dh * Math.min(1, dt * 5); e.moving = before.distanceTo(e.m.position) > dt * .4; }
        AC.animateMascot(e.m, this.t, e.moving && !e.seat ? 1 : 0, !!e.seat);
      }
      if (c.observer) { this.clOrbit?.update(); return; }
      const I = this.input(); const bm = this.boostMul || 1;
      c.v += (I.fwd * 5 * bm - c.v) * Math.min(1, dt * 4); c.h += I.turn * dt * 2.4;
      let nx = c.x + Math.sin(c.h) * c.v * dt, nz = c.z + Math.cos(c.h) * c.v * dt;
      nx = Math.max(-ROOM.w / 2 + 1.5, Math.min(ROOM.w / 2 - 1.5, nx)); nz = Math.max(-ROOM.d / 2 + 1.6, Math.min(ROOM.d / 2 - 1, nz));
      for (const [sx, sz] of SEATS) { if (Math.abs(nx - sx) < 2 && Math.abs(nz - (sz - .9)) < 1.2) { nx = c.x; nz = c.z; } }
      c.x = nx; c.z = nz; this.clMe.position.set(c.x, 0, c.z); this.clMe.rotation.y = c.h;
      AC.animateMascot(this.clMe, this.t, Math.abs(c.v) > .3 ? 1 : 0, false);
      const yaw = c.h + Math.PI + this.camYaw, dist = 7.5, pitch = Math.max(.12, Math.min(1.1, this.camPitch));
      const cp = new THREE.Vector3(c.x + Math.sin(yaw) * dist * Math.cos(pitch), 1.6 + dist * Math.sin(pitch), c.z + Math.cos(yaw) * dist * Math.cos(pitch));
      cp.x = Math.max(-ROOM.w / 2 + .5, Math.min(ROOM.w / 2 - .5, cp.x)); cp.z = Math.max(-ROOM.d / 2 + .5, Math.min(ROOM.d / 2 - .5, cp.z)); cp.y = Math.min(ROOM.h - .5, cp.y);
      this.camera.position.lerp(cp, 1 - Math.exp(-dt * 6)); this.camera.lookAt(c.x + Math.sin(c.h) * 3, 1.6, c.z + Math.cos(c.h) * 3); this.camYaw *= (1 - dt * .6);
    },
  });
}
