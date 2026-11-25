// QAZAQ MATH — әр виртуалды әлемдегі интерактивті математикалық симуляторлар (2D canvas).
const W = 960, H = 600;
const P = { bg: '#fbf8f1', ink: '#0f1b3d', ink2: '#43506e', mute: '#8a94ad', line: '#e4ddcc', teal: '#0f8b8d', teal2: '#14a3a6', gold: '#c8963e', gold2: '#f0b432', red: '#e5484d', sky: '#5ec8ff', green: '#2fa866', violet: '#7c5cff', paper: '#ffffff' };
const FD = 'Montserrat, Inter, sans-serif', FB = 'Inter, sans-serif', FF = '"Noto Serif", Georgia, serif';
const esc = (s) => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const nf = (x, d = 0) => Number(x).toLocaleString('ru-RU', { maximumFractionDigits: d });
const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const parseNum = (s) => { s = String(s).trim().replace(/\s/g, '').replace(',', '.').replace('−', '-'); if (/^-?\d+(\.\d+)?\/\d+$/.test(s)) { const [a, b] = s.split('/').map(Number); return a / b; } return s === '' ? NaN : Number(s); };

function T(g, s, x, y, o = {}) { g.font = `${o.w || 600} ${o.size || 18}px ${o.f === 'F' ? FF : o.f === 'D' ? FD : FB}`; g.fillStyle = o.c || P.ink; g.textAlign = o.a || 'left'; g.textBaseline = o.b || 'alphabetic'; g.fillText(s, x, y); }
function RR(g, x, y, w, h, r, fill, stroke, lw = 2) { g.beginPath(); g.roundRect(x, y, w, h, r); if (fill) { g.fillStyle = fill; g.fill(); } if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw; g.stroke(); } }
function bg(g, top = '#eaf5ff', bot = '#fbf8f1') { const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, top); gr.addColorStop(1, bot); g.fillStyle = gr; g.fillRect(0, 0, W, H); }
function arrow(g, x1, y1, x2, y2, c = P.teal, lw = 3) { g.strokeStyle = c; g.fillStyle = c; g.lineWidth = lw; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); const a = Math.atan2(y2 - y1, x2 - x1); for (const [x, y, s] of [[x2, y2, 1], [x1, y1, -1]]) { g.beginPath(); g.moveTo(x, y); g.lineTo(x - s * 12 * Math.cos(a - .4), y - s * 12 * Math.sin(a - .4)); g.lineTo(x - s * 12 * Math.cos(a + .4), y - s * 12 * Math.sin(a + .4)); g.closePath(); g.fill(); } }
function mascotDot(g, x, y, r = 16, c = '#3fb6ff') { g.fillStyle = c; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); g.fillStyle = '#fff'; for (const s of [-1, 1]) { g.beginPath(); g.ellipse(x + s * r * .35, y - r * .15, r * .22, r * .28, 0, 0, 7); g.fill(); } g.fillStyle = P.ink; for (const s of [-1, 1]) { g.beginPath(); g.arc(x + s * r * .35 + 1, y - r * .1, r * .13, 0, 7); g.fill(); } g.strokeStyle = P.ink; g.lineWidth = 2; g.beginPath(); g.arc(x, y + r * .2, r * .28, .3, Math.PI - .3); g.stroke(); }

/** Симуляторды root ішіне орнату. ctx: {onDone(), place, color, char, onLaunch3D} */
export function mountSim(root, sim, ctx) {
  root.innerHTML = `<div class="sim-wrap"><div class="sim-stage"><canvas width="${W}" height="${H}"></canvas><div class="sim-badge" hidden></div></div>
    <aside class="sim-side"><p class="eyebrow">${sim.choice ? 'Адал азамат · зертхана' : 'Симулятор · ' + esc(ctx.place.name)}</p><h3>${esc(sim.title)}</h3><p class="sim-goal">${esc(sim.goal)}</p>
    <div class="sim-ctrl"></div><div class="sim-read"></div>
    <form class="sim-q" hidden><label class="sim-qt"></label><div class="sim-row"><input inputmode="decimal" autocomplete="off" aria-label="Жауап"><span class="sim-unit"></span><button class="btn-primary sm" type="submit">Тексеру</button></div><div class="sim-fb"></div></form>
    <div class="sim-done" hidden></div></aside></div>`;
  const cv = root.querySelector('canvas'), g = cv.getContext('2d');
  const api = { cv, g, sim, ctx, ctrl: root.querySelector('.sim-ctrl'), readEl: root.querySelector('.sim-read'), qEl: root.querySelector('.sim-q'), doneEl: root.querySelector('.sim-done'), badge: root.querySelector('.sim-badge'), finished: false, raf: 0 };
  api.read = (rows) => { api.readEl.innerHTML = rows.map(r => Array.isArray(r) ? `<div class="sr"><span>${esc(r[0])}</span><b>${esc(r[1])}</b></div>` : `<div class="sf">${esc(r)}</div>`).join(''); };
  api.slider = (label, min, max, step, val, unit, on) => {
    const w = document.createElement('label'); w.className = 'sim-sl'; w.innerHTML = `<span>${esc(label)} <b></b> ${esc(unit || '')}</span><input type="range" min="${min}" max="${max}" step="${step}" value="${val}">`;
    api.ctrl.appendChild(w); const i = w.querySelector('input'), b = w.querySelector('b'); const u = () => { b.textContent = nf(+i.value, step < 1 ? 2 : 0); }; u();
    i.addEventListener('input', () => { u(); on?.(+i.value); api.draw(); }); return i;
  };
  api.button = (label, on, cls = 'btn-soft sm') => { let row = api.ctrl.querySelector('.sim-btns'); if (!row) { row = document.createElement('div'); row.className = 'sim-btns'; api.ctrl.appendChild(row); } const b = document.createElement('button'); b.type = 'button'; b.className = cls; b.textContent = label; b.addEventListener('click', () => { on(); api.draw(); }); row.appendChild(b); return b; };
  api.ask = (text, ans, tol = 0, unit = '') => { api.qEl.hidden = false; api.qEl.querySelector('.sim-qt').textContent = text; api.qEl.querySelector('.sim-unit').textContent = unit; api.ans = ans; api.tol = tol; api.qEl.querySelector('input').value = ''; api.qEl.querySelector('.sim-fb').textContent = ''; api.tries = 0; };
  api.flash = (msg, ok = true) => { api.badge.textContent = msg; api.badge.className = 'sim-badge ' + (ok ? 'ok' : 'bad'); api.badge.hidden = false; clearTimeout(api._bt); api._bt = setTimeout(() => { api.badge.hidden = true; }, 2200); };
  api.done = (msg) => { if (api.finished) return; api.finished = true; api.doneEl.hidden = false; api.doneEl.innerHTML = `<b>${sim.choice ? 'Зертхана орындалды!' : 'Симулятор орындалды!'}</b><span>${esc(msg || '')}</span>`; api.flash('Тамаша! ✓'); ctx.onDone?.();
    if (sim.choice) { const box = document.createElement('div'); box.className = 'sim-choice'; box.innerHTML = `<p class="ac-ask">${esc(sim.ask || 'Сен не істер едің?')}</p>${sim.choice.map((c, k) => `<button type="button" class="ac-opt" data-k="${k}">${esc(c[0])}</button>`).join('')}<p class="ac-why"></p>`; api.doneEl.after(box);
      box.querySelectorAll('.ac-opt').forEach(b => b.addEventListener('click', () => { if (box.dataset.done) return; box.dataset.done = 1; const k = +b.dataset.k; b.classList.add(sim.choice[k][1] ? 'good' : 'bad'); box.querySelector('.ac-why').textContent = sim.choice[k][2]; ctx.onChoice?.(k, !!sim.choice[k][1]); })); } };
  api.qEl.addEventListener('submit', (e) => {
    e.preventDefault(); const v = parseNum(api.qEl.querySelector('input').value); const fb = api.qEl.querySelector('.sim-fb');
    if (Number.isNaN(v)) { fb.textContent = 'Жауапты сан түрінде жаз.'; fb.className = 'sim-fb bad'; return; }
    api.tries++;
    if (Math.abs(v - api.ans) <= api.tol + 1e-9) { fb.textContent = 'Дұрыс! ✓'; fb.className = 'sim-fb ok'; (api.onCorrect || (() => api.done(api.doneMsg)))(); }
    else { fb.textContent = api.tries >= 3 ? `Дұрыс жауап: ${nf(api.ans, 2)}. Сызбаны тағы зертте!` : 'Әлі дұрыс емес — өлшеуді қайта тексер.'; fb.className = 'sim-fb bad'; if (api.tries >= 3) (api.onCorrect || (() => api.done(api.doneMsg)))(); }
  });
  const pt = (e) => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * H }; };
  cv.addEventListener('pointerdown', (e) => { cv.setPointerCapture(e.pointerId); const p = pt(e); api.eng.down?.(api, p.x, p.y); api.draw(); });
  cv.addEventListener('pointermove', (e) => { const p = pt(e); if (api.eng.move?.(api, p.x, p.y, e.buttons) !== false) api.draw(); });
  cv.addEventListener('pointerup', () => { api.eng.up?.(api); api.draw(); });
  api.loop = (fn) => { cancelAnimationFrame(api.raf); let last = performance.now(); const tick = (now) => { const dt = Math.min(.05, (now - last) / 1000); last = now; if (fn(dt) !== false) api.raf = requestAnimationFrame(tick); else api.raf = 0; api.draw(); }; api.raf = requestAnimationFrame(tick); };
  api.eng = ENGINES[sim.type]; api.draw = () => api.eng.draw(api);
  api.eng.setup(api); api.draw();
  return { destroy() { cancelAnimationFrame(api.raf); api.dead = true; } };
}

// =============================== ENGINES ===============================
const ENGINES = {};

// ---- 1. Сызғыш пен транспортир ----
ENGINES.measure = {
  setup(a) {
    const s = a.sim; const H0 = s.H; const al = s.rock ? rnd(20, 34) : rnd(32, 58);
    const L = H0 / Math.tan(al * Math.PI / 180); const scale = Math.min(330 / H0, 700 / L);
    a.s = { al, L, scale, H0, baseX: s.rock ? 820 : 800, gy: 500, ruler: { x: 120, y: 540, drag: false }, prot: { x: 220, y: 150, drag: false }, step: H0 > 110 ? 20 : 10 };
    a.s.rulerLen = Math.ceil(L * 1.15 / 50) * 50;
    a.read([['Нысан', s.rock ? 'Бозжыра құзары' : 'Бәйтерек'], 'Сызғышты көлеңкеге, транспортирді бұрыш ұшына сүйреп апар.', 'h = L · tg α']);
    a.ask(`Сызғыш пен транспортирдің көрсеткішін пайдаланып, ${s.rock ? 'құзардың' : 'Бәйтеректің'} биіктігін тап (м).`, H0, H0 * .06, 'м');
    a.doneMsg = `h = L · tg α = ${nf(L, 0)} · tg ${al}° ≈ ${nf(H0)} м. Сен нағыз геодезист сияқты өлшедің!`;
    a.button('Жаңа бұрыш', () => { ENGINES.measure.setup2(a); });
  },
  setup2(a) { const s = a.s; s.al = a.sim.rock ? rnd(20, 34) : rnd(32, 58); s.L = s.H0 / Math.tan(s.al * Math.PI / 180); s.scale = Math.min(330 / s.H0, 700 / s.L); s.rulerLen = Math.ceil(s.L * 1.15 / 50) * 50; },
  down(a, x, y) { const s = a.s; const r = s.ruler, p = s.prot; if (x > r.x - 10 && x < r.x + s.rulerLen * s.scale + 10 && y > r.y - 30 && y < r.y + 30) { r.drag = true; r.ox = x - r.x; r.oy = y - r.y; } else if (Math.hypot(x - p.x, y - p.y) < 110 && y <= p.y + 10) { p.drag = true; p.ox = x - p.x; p.oy = y - p.y; } },
  move(a, x, y, b) { const s = a.s; if (!b) return false; if (s.ruler.drag) { s.ruler.x = x - s.ruler.ox; s.ruler.y = y - s.ruler.oy; } else if (s.prot.drag) { s.prot.x = x - s.prot.ox; s.prot.y = y - s.prot.oy; const tipX = s.baseX - s.L * s.scale; if (Math.hypot(s.prot.x - tipX, s.prot.y - s.gy) < 28) { s.prot.x = tipX; s.prot.y = s.gy; } } else return false; },
  up(a) { const s = a.s; const tipX = s.baseX - s.L * s.scale; if (s.ruler.drag && Math.abs(s.ruler.y - s.gy - 14) < 30) { s.ruler.y = s.gy + 14; if (Math.abs(s.ruler.x - tipX) < 30) s.ruler.x = tipX; } s.ruler.drag = s.prot.drag = false; },
  draw(a) {
    const { g, s } = a; const rock = a.sim.rock; bg(g, rock ? '#ffe9cf' : '#d8eeff', '#fbf8f1');
    const top = s.gy - s.H0 * s.scale, tipX = s.baseX - s.L * s.scale;
    // күн
    const sunX = s.baseX + Math.cos(Math.PI - s.al * Math.PI / 180) * -1 * 0; g.fillStyle = '#ffd84a'; g.beginPath(); g.arc(W - 70, 70, 34, 0, 7); g.fill();
    g.fillStyle = rock ? '#e9d7b9' : '#cfe3c0'; g.fillRect(0, s.gy, W, H - s.gy);
    // көлеңке
    g.fillStyle = 'rgba(30,40,70,.28)'; g.beginPath(); g.moveTo(s.baseX + 14, s.gy); g.lineTo(tipX, s.gy + 3); g.lineTo(tipX, s.gy - 3); g.lineTo(s.baseX - 14, s.gy); g.fill();
    // нысан
    if (rock) { g.fillStyle = '#f2ead9'; g.strokeStyle = '#cbbd9f'; g.lineWidth = 2; g.beginPath(); g.moveTo(s.baseX - 40, s.gy); g.lineTo(s.baseX - 22, top + 30); g.lineTo(s.baseX - 4, top); g.lineTo(s.baseX + 30, top + 18); g.lineTo(s.baseX + 70, s.gy); g.closePath(); g.fill(); g.stroke(); for (let i = 1; i < 6; i++) { g.beginPath(); g.moveTo(s.baseX - 36 + i * 3, s.gy - i * (s.gy - top) / 6); g.lineTo(s.baseX + 60 - i * 6, s.gy - i * (s.gy - top) / 6); g.strokeStyle = '#e0cfae'; g.stroke(); } }
    else { g.fillStyle = '#ffffff'; g.strokeStyle = '#b9c4d8'; g.lineWidth = 2; g.beginPath(); g.moveTo(s.baseX - 16, s.gy); g.lineTo(s.baseX - 6, top + 40); g.lineTo(s.baseX + 6, top + 40); g.lineTo(s.baseX + 16, s.gy); g.closePath(); g.fill(); g.stroke(); const r = 22 * s.scale / 3.4 * 1.0; g.fillStyle = '#f0b432'; g.beginPath(); g.arc(s.baseX, top + 28, Math.max(14, Math.min(34, r)), 0, 7); g.fill(); g.strokeStyle = '#c8963e'; g.stroke(); }
    // күн сәулесі
    g.setLineDash([8, 6]); g.strokeStyle = '#f0a020'; g.lineWidth = 2; g.beginPath(); const dx = s.baseX - tipX, dy = s.gy - top; g.moveTo(tipX, s.gy); g.lineTo(s.baseX + dx * .25, top - dy * .25); g.stroke(); g.setLineDash([]);
    if (rock) mascotDot(g, tipX - 4, s.gy - 18, 14, a.ctx.color || '#3fb6ff');
    // сызғыш
    const R = s.ruler, len = s.rulerLen * s.scale; RR(g, R.x, R.y - 16, len, 34, 6, 'rgba(255,231,168,.95)', '#c8963e');
    for (let m = 0; m <= s.rulerLen; m += 5) { const x = R.x + m * s.scale; const big = m % s.step === 0; g.strokeStyle = '#4a3a10'; g.lineWidth = big ? 2 : 1; g.beginPath(); g.moveTo(x, R.y - 16); g.lineTo(x, R.y - 16 + (big ? 14 : 7)); g.stroke(); if (big && m % (s.step * (s.scale < 2.5 ? 2 : 1)) === 0) T(g, String(m), x, R.y + 12, { size: 11, a: 'center', w: 700, c: '#4a3a10' }); }
    T(g, 'м', R.x + len - 12, R.y + 12, { size: 11, w: 700, c: '#4a3a10' });
    // транспортир
    const p = s.prot; g.save(); g.translate(p.x, p.y);
    g.fillStyle = 'rgba(214,240,255,.75)'; g.beginPath(); g.arc(0, 0, 100, Math.PI, 0); g.closePath(); g.fill(); g.strokeStyle = '#1b4a7a'; g.lineWidth = 2; g.stroke();
    for (let d = 0; d <= 180; d += 2) { const an = Math.PI + d * Math.PI / 180; const r0 = d % 10 === 0 ? 84 : 92; g.lineWidth = d % 10 === 0 ? 2 : 1; g.beginPath(); g.moveTo(Math.cos(an) * r0, Math.sin(an) * r0); g.lineTo(Math.cos(an) * 100, Math.sin(an) * 100); g.stroke(); if (d % 30 === 0) T(g, String(180 - d), Math.cos(an) * 70, Math.sin(an) * 70 + 4, { size: 11, a: 'center', w: 700, c: '#1b4a7a' }); }
    g.fillStyle = '#1b4a7a'; g.beginPath(); g.arc(0, 0, 4, 0, 7); g.fill();
    g.restore();
    const onTip = p.x === tipX && p.y === s.gy;
    if (onTip) { g.fillStyle = 'rgba(240,180,50,.45)'; g.beginPath(); g.moveTo(tipX, s.gy); g.arc(tipX, s.gy, 60, -s.al * Math.PI / 180, 0); g.closePath(); g.fill(); T(g, `α = ${s.al}°`, tipX + 66, s.gy - 22, { size: 20, w: 800, c: P.gold }); }
    const onRuler = Math.abs(R.y - s.gy - 14) < 2 && Math.abs(R.x - tipX) < 1;
    a.read([['Бұрыш α', onTip ? `${s.al}°` : 'транспортирді көлеңке ұшына сүйре'], ['tg α', onTip ? nf(Math.tan(s.al * Math.PI / 180), 3) : '—'], [a.sim.rock ? 'Қашықтық d' : 'Көлеңке L', onRuler ? `сызғыш бойынша оқы (0 — көлеңке ұшында)` : 'сызғыштың 0-ін көлеңке ұшына қой'], a.sim.rock ? 'h = d · tg α' : 'h = L · tg α', 'Сызғыштың кіші бөлігі = 5 м']);
  },
};

// ---- 2. Конус/пирамида құрастырушы ----
ENGINES.solid = {
  setup(a) {
    const cone = a.sim.shape === 'cone'; a.s = { cone, r: cone ? 60 : 40, h: cone ? 90 : 40, rot: 0, net: false, ok: false };
    a.slider(cone ? 'Табан радиусы r' : 'Табан қабырғасы a', 10, cone ? 140 : 90, 1, a.s.r, 'м', v => { a.s.r = v; }); a.slider('Биіктігі h', 10, cone ? 200 : 90, 1, a.s.h, 'м', v => { a.s.h = v; });
    a.button('Жазбасын көрсету', () => { a.s.net = !a.s.net; });
    a.loop((dt) => { a.s.rot += dt * .5; return !a.dead; });
  },
  draw(a) {
    const { g, s } = a; bg(g, '#eef6ff'); const cone = s.cone;
    const V = cone ? Math.PI * s.r * s.r * s.h / 3 : s.r * s.r * s.h / 3; const tgt = a.sim.target;
    const k = 220 / Math.max(cone ? 140 : 90, 200 * .0 + (cone ? 200 : 90)); const sc = 1.55;
    if (!s.net) {
      const cx = 330, cy = 470; const pr = (x, y, z) => { const c = Math.cos(s.rot), sn = Math.sin(s.rot); const X = x * c - z * sn, Z = x * sn + z * c; return [cx + X * sc, cy - y * sc - Z * sc * .32, Z]; };
      const faces = []; const apex = [0, s.h, 0];
      if (cone) { const n = 48; for (let i = 0; i < n; i++) { const a0 = i / n * Math.PI * 2, a1 = (i + 1) / n * Math.PI * 2; faces.push([[s.r * Math.cos(a0), 0, s.r * Math.sin(a0)], [s.r * Math.cos(a1), 0, s.r * Math.sin(a1)], apex]); } }
      else { const q = s.r / 2; const b = [[-q, 0, -q], [q, 0, -q], [q, 0, q], [-q, 0, q]]; for (let i = 0; i < 4; i++) faces.push([b[i], b[(i + 1) % 4], apex]); }
      // табан эллипсі
      g.fillStyle = 'rgba(15,27,61,.08)'; g.beginPath(); g.ellipse(cx, cy + 6, (cone ? s.r : s.r * .75) * sc + 10, (cone ? s.r : s.r * .75) * sc * .32 + 6, 0, 0, 7); g.fill();
      const lit = (f) => { const [p0, p1, p2] = f; const u = [p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]], v = [p2[0] - p0[0], p2[1] - p0[1], p2[2] - p0[2]]; const nx = u[1] * v[2] - u[2] * v[1], ny = u[2] * v[0] - u[0] * v[2], nz = u[0] * v[1] - u[1] * v[0]; const l = Math.hypot(nx, ny, nz) || 1; return Math.abs((nx * -.4 + ny * .7 + nz * .5) / l); };
      const pf = faces.map(f => ({ f, p: f.map(v => pr(...v)), z: f.reduce((s2, v) => s2 + pr(...v)[2], 0) / 3 })).sort((x, y) => x.z - y.z);
      for (const { f, p } of pf) { const l = .45 + lit(f) * .55; g.fillStyle = cone ? `rgba(${110 * l + 40},${200 * l},${255 * l},.9)` : `rgb(${240 * l},${205 * l},${140 * l})`; g.beginPath(); g.moveTo(p[0][0], p[0][1]); g.lineTo(p[1][0], p[1][1]); g.lineTo(p[2][0], p[2][1]); g.closePath(); g.fill(); if (!cone) { g.strokeStyle = '#a07a30'; g.lineWidth = 1.5; g.stroke(); } }
      const ap = pr(0, s.h, 0), bc = pr(0, 0, 0); g.setLineDash([6, 5]); g.strokeStyle = P.red; g.lineWidth = 2; g.beginPath(); g.moveTo(ap[0], ap[1]); g.lineTo(bc[0], bc[1]); g.stroke(); g.setLineDash([]);
      T(g, `h = ${s.h} м`, bc[0] + 10, (ap[1] + bc[1]) / 2, { size: 18, w: 800, c: P.red, f: 'D' });
      const re = pr(cone ? s.r : s.r / 2, 0, 0); g.strokeStyle = P.teal; g.lineWidth = 3; g.beginPath(); g.moveTo(bc[0], bc[1]); g.lineTo(re[0], re[1]); g.stroke(); T(g, cone ? `r = ${s.r} м` : `a = ${s.r} м`, (bc[0] + re[0]) / 2 - 20, bc[1] + 34, { size: 18, w: 800, c: P.teal, f: 'D' });
    } else {
      // жазба
      const cx = 330, cy = 300; g.lineWidth = 2;
      if (cone) { const l = Math.hypot(s.r, s.h); const ang = 2 * Math.PI * s.r / l; const R = 230 / Math.max(l, 1) * l; const sc2 = 230 / l; g.fillStyle = 'rgba(94,200,255,.5)'; g.strokeStyle = P.teal; g.beginPath(); g.moveTo(cx, cy - 120); g.arc(cx, cy - 120, l * sc2, Math.PI / 2 - ang / 2, Math.PI / 2 + ang / 2); g.closePath(); g.fill(); g.stroke(); g.beginPath(); g.arc(cx, cy - 120 + l * sc2 + s.r * sc2, s.r * sc2, 0, 7); g.fill(); g.stroke(); T(g, `сектор бұрышы = 360° · r : l ≈ ${nf(ang * 180 / Math.PI)}°`, cx, 40, { a: 'center', size: 17, w: 700 }); T(g, `l = √(r² + h²) ≈ ${nf(l, 1)} м`, cx, 66, { a: 'center', size: 16, c: P.ink2 }); }
      else { const ap = Math.hypot(s.h, s.r / 2); const k2 = 140 / Math.max(s.r, ap); const a2 = s.r * k2 / 2, L2 = ap * k2; g.fillStyle = '#f6dfae'; g.strokeStyle = '#a07a30'; g.fillRect(cx - a2, cy - a2, a2 * 2, a2 * 2); g.strokeRect(cx - a2, cy - a2, a2 * 2, a2 * 2); for (let i = 0; i < 4; i++) { g.save(); g.translate(cx, cy); g.rotate(i * Math.PI / 2); g.beginPath(); g.moveTo(-a2, -a2); g.lineTo(a2, -a2); g.lineTo(0, -a2 - L2); g.closePath(); g.fillStyle = '#efc777'; g.fill(); g.stroke(); g.restore(); } T(g, `Апофема l = √(h² + (a/2)²) ≈ ${nf(ap, 1)} м`, cx, 36, { a: 'center', size: 17, w: 700 }); }
    }
    // көлем шкаласы
    const pct = clamp(V / tgt, 0, 2); RR(g, 640, 120, 280, 360, 18, '#fff', P.line);
    T(g, 'Көлем', 660, 156, { size: 15, c: P.mute, w: 700 }); T(g, `${nf(V)} м³`, 660, 192, { size: 26, w: 800, f: 'D' });
    T(g, `Мақсат: ≈ ${nf(tgt)} м³`, 660, 222, { size: 14, c: P.ink2 });
    const bx = 700, by = 450, bh = 200; RR(g, bx, by - bh, 50, bh, 10, '#eef1f7'); const fh = clamp(pct / 2, 0, 1) * bh; RR(g, bx, by - fh, 50, fh, 10, Math.abs(V - tgt) <= a.sim.tol ? P.green : P.sky);
    g.strokeStyle = P.gold; g.lineWidth = 3; g.beginPath(); g.moveTo(bx - 8, by - bh / 2); g.lineTo(bx + 58, by - bh / 2); g.stroke(); T(g, 'мақсат', bx + 64, by - bh / 2 + 5, { size: 13, c: P.gold, w: 700 });
    a.read([cone ? `V = ⅓ · π · r² · h` : `V = ⅓ · a² · h`, cone ? `V = ⅓ · 3,14 · ${s.r}² · ${s.h} ≈ ${nf(V)} м³` : `V = ⅓ · ${s.r}² · ${s.h} ≈ ${nf(V)} м³`, ['Табан ауданы', cone ? `${nf(Math.PI * s.r * s.r)} м²` : `${nf(s.r * s.r)} м²`]]);
    if (!a.finished && Math.abs(V - tgt) <= a.sim.tol) a.done(cone ? 'Хан Шатыр шынымен де r ≈ 100 м, h ≈ 150 м конусқа ұқсайды.' : 'Бейбітшілік сарайы: a = 62 м, h = 62 м — биіктігі мен ені тең пирамида!');
  },
};

// ---- 3. Тор: симметрия / тіктөртбұрыш ----
const ORN = ['000000000000', '011000000000', '100100000000', '100101100000', '011010010000', '000010010110', '000001101001', '000000001001', '011000000110', '100100000000', '100100000000', '011000000000'];
const MOUNT = ['000000000000', '000000100000', '000001110000', '000011111000', '000111111100', '001111111110', '011111111111', '111111111111'];
ENGINES.grid = {
  setup(a) {
    const s = a.s = { mode: a.sim.mode, hor: !!a.sim.horizontal, cells: {}, drag: null, rect: null, tried: [] };
    if (s.mode === 'mirror') {
      s.N = 12; s.M = s.hor ? 16 : 12; s.cs = s.hor ? 30 : 40;
      if (s.hor) { s.cols = 12; s.rows = 16; MOUNT.forEach((row, r) => [...row].forEach((c, k) => { if (c === '1') s.cells[`${k},${r}`] = 1; })); }
      else { s.cols = 12; s.rows = 12; ORN.forEach((row, r) => [...row.slice(0, 6)].forEach((c, k) => { if (c === '1') s.cells[`${k},${r}`] = 1; })); }
      a.read(['Бос ұяшықты бас — бояу/өшіру.', s.hor ? 'Ось — көл беті (көлденең).' : 'Ось — ортадағы тік сызық.']);
      a.button('Тексеру', () => ENGINES.grid.check(a), 'btn-primary sm'); a.button('Тазалау', () => { for (const k of Object.keys(s.cells)) { const [x, y] = k.split(',').map(Number); if (ENGINES.grid.editable(s, x, y)) delete s.cells[k]; } });
    } else {
      s.cols = 16; s.rows = 11; s.cs = 36;
      a.read(['Торда тышқанмен сүйреп, қора (тіктөртбұрыш) сыз.', 'P = 2(a + b),  S = a · b']);
      a.ask('Периметрі 24 м болатын қоралардың ішіндегі ең үлкен аудан неше м²?', 36, 0, 'м²');
      a.doneMsg = 'Периметрі тұрақты болғанда ең үлкен аудан — шаршыда: 6 × 6 = 36 м².';
    }
  },
  origin(s) { return { ox: (W - s.cols * s.cs) / 2, oy: (H - s.rows * s.cs) / 2 }; },
  editable(s, x, y) { return s.hor ? y >= 8 : x >= 6; },
  target(s) { const t = new Set(); for (const k of Object.keys(s.cells)) { const [x, y] = k.split(',').map(Number); if (s.hor ? y < 8 : x < 6) t.add(s.hor ? `${x},${15 - y}` : `${11 - x},${y}`); } return t; },
  check(a) { const s = a.s; const tg = ENGINES.grid.target(s); let wrong = 0, miss = 0; for (const k of tg) if (!s.cells[k]) miss++; for (const k of Object.keys(s.cells)) { const [x, y] = k.split(',').map(Number); if (ENGINES.grid.editable(s, x, y) && !tg.has(k)) wrong++; }
    if (!wrong && !miss) a.done(s.hor ? 'Көл беті — симметрия осі: (x; y) → (x; −y).' : 'Осьтік симметрия: (x; y) → (−x; y). Қазақ ою-өрнегінің негізі!'); else a.flash(`Жетіспейді: ${miss}, артық: ${wrong}`, false); },
  cell(a, x, y) { const s = a.s; const { ox, oy } = ENGINES.grid.origin(s); const cx = Math.floor((x - ox) / s.cs), cy = Math.floor((y - oy) / s.cs); return cx >= 0 && cy >= 0 && cx < s.cols && cy < s.rows ? [cx, cy] : null; },
  down(a, x, y) { const s = a.s; const c = ENGINES.grid.cell(a, x, y); if (!c) return; if (s.mode === 'mirror') { if (!ENGINES.grid.editable(s, ...c)) return; const k = c.join(','); s.paint = !s.cells[k]; if (s.paint) s.cells[k] = 1; else delete s.cells[k]; s.drag = true; } else { s.drag = c; s.rect = [c, c]; } },
  move(a, x, y, b) { const s = a.s; if (!b || !s.drag) return false; const c = ENGINES.grid.cell(a, x, y); if (!c) return; if (s.mode === 'mirror') { if (!ENGINES.grid.editable(s, ...c)) return; const k = c.join(','); if (s.paint) s.cells[k] = 1; else delete s.cells[k]; } else s.rect = [s.drag, c]; },
  up(a) { const s = a.s; if (s.mode === 'rect' && s.rect) { const [w, h] = ENGINES.grid.dims(s); if (w && h) { const P2 = 2 * (w + h); if (!s.tried.some(t => t[0] === w && t[1] === h)) s.tried.push([w, h]); if (P2 === 24) a.flash(`P = 24 м ✓  S = ${w * h} м²`); } } s.drag = null; },
  dims(s) { if (!s.rect) return [0, 0]; const [[x0, y0], [x1, y1]] = s.rect; return [Math.abs(x1 - x0) + 1, Math.abs(y1 - y0) + 1]; },
  draw(a) {
    const { g, s } = a; bg(g, s.hor ? '#dff1ff' : '#fff8ea'); const { ox, oy } = ENGINES.grid.origin(s);
    if (s.hor) { g.fillStyle = 'rgba(94,200,255,.25)'; g.fillRect(ox, oy + 8 * s.cs, s.cols * s.cs, 8 * s.cs); }
    for (let y = 0; y < s.rows; y++) for (let x = 0; x < s.cols; x++) {
      const k = `${x},${y}`; const X = ox + x * s.cs, Y = oy + y * s.cs; g.strokeStyle = P.line; g.lineWidth = 1; g.strokeRect(X, Y, s.cs, s.cs);
      if (s.cells[k]) { const fixed = s.mode === 'mirror' && !ENGINES.grid.editable(s, x, y); g.fillStyle = fixed ? (s.hor ? '#6f7d6a' : '#c4302b') : (s.hor ? 'rgba(80,110,90,.55)' : '#0f8b8d'); g.fillRect(X + 2, Y + 2, s.cs - 4, s.cs - 4); }
    }
    if (s.mode === 'mirror') { g.strokeStyle = P.gold; g.lineWidth = 4; g.setLineDash([10, 6]); g.beginPath(); if (s.hor) { g.moveTo(ox - 10, oy + 8 * s.cs); g.lineTo(ox + s.cols * s.cs + 10, oy + 8 * s.cs); } else { g.moveTo(ox + 6 * s.cs, oy - 10); g.lineTo(ox + 6 * s.cs, oy + s.rows * s.cs + 10); } g.stroke(); g.setLineDash([]); }
    else {
      const [w, h] = ENGINES.grid.dims(s);
      if (s.rect) { const [[x0, y0], [x1, y1]] = s.rect; const X = ox + Math.min(x0, x1) * s.cs, Y = oy + Math.min(y0, y1) * s.cs; g.fillStyle = 'rgba(240,180,50,.28)'; g.fillRect(X, Y, w * s.cs, h * s.cs); g.strokeStyle = '#8a5a2b'; g.lineWidth = 5; g.strokeRect(X, Y, w * s.cs, h * s.cs); for (let i = 0; i <= w; i++) for (const yy of [Y, Y + h * s.cs]) { g.fillStyle = '#6b3b1a'; g.fillRect(X + i * s.cs - 3, yy - 3, 6, 6); } for (let j = 0; j <= h; j++) for (const xx of [X, X + w * s.cs]) g.fillRect(xx - 3, Y + j * s.cs - 3, 6, 6); T(g, `${w} м`, X + w * s.cs / 2, Y - 8, { a: 'center', w: 800, f: 'D', size: 16 }); T(g, `${h} м`, X + w * s.cs + 8, Y + h * s.cs / 2, { w: 800, f: 'D', size: 16 }); }
      const tr = s.tried.filter(t => 2 * (t[0] + t[1]) === 24).sort((p, q) => p[0] * p[1] - q[0] * q[1]);
      a.read([['Ұзындығы × ені', w ? `${w} × ${h} м` : '—'], ['Периметр P', w ? `${2 * (w + h)} м` : '—'], ['Аудан S', w ? `${w * h} м²` : '—'], tr.length ? 'P = 24 болған қоралар: ' + tr.map(t => `${t[0]}×${t[1]} → ${t[0] * t[1]} м²`).join(';  ') : 'P = 24 болатын бірнеше қора салып көр.']);
    }
  },
};

// ---- 4. Таразы ----
ENGINES.balance = {
  setup(a) {
    const ore = a.sim.items === 'ore', sack = a.sim.items === 'sack'; const s = a.s = { ore, sack, right: [], left: [], u: sack ? 'кг' : 'г' };
    if (sack) { s.x = pick([12, 15, 18]); s.n = 1; s.ore = true; s.p = 0; }
    else if (ore) { s.x = rnd(8, 18) * 50; s.n = 1; s.p = pick([2, 3, 4, 5]); }
    else { s.x = pick([150, 180, 200, 220, 250]); s.n = pick([3, 4]); s.extra = pick([0, 100]); }
    s.leftMass = s.x * s.n + (s.extra || 0);
    s.weights = sack ? [1, 2, 5, 10] : [50, 100, 200, 500];
    a.read(['Төмендегі гірлерді басып, оң табаққа қой. Табақтағы гірді басса — алынады.']);
    a.ask(sack ? 'Алма қапшығының массасы неше кг?' : ore ? 'Кен үлгісінің массасы неше грамм?' : `Бір апорт алманың массасы неше грамм?`, s.x, 0, s.u);
    a.onCorrect = () => { if (sack && !s.stage2) { s.stage2 = true; a.ask(`Алманы 3 досқа тең бөл: әрқайсысына неше кг?`, s.x / 3, 0, 'кг'); a.doneMsg = `${s.x} : 3 = ${s.x / 3} кг. Таразыда тексер: ${s.x / 3} кг + ${s.x / 3} кг + ${s.x / 3} кг = ${s.x} кг. Әділ бөліс!`; a.onCorrect = null; } else if (ore && !s.stage2) { s.stage2 = true; a.ask(`Кенде ${s.p} % мыс бар. Үлгіде неше грамм мыс бар?`, s.x * s.p / 100, .01, 'г'); a.doneMsg = `m(мыс) = ${s.x} · ${s.p} : 100 = ${nf(s.x * s.p / 100, 2)} г. Сәтбаев сияқты кен байлығын есептедің!`; a.onCorrect = null; } else a.done(ore ? '' : `${s.n}x${s.extra ? ' + ' + s.extra : ''} = ${s.leftMass} → x = ${s.x} г. Теңдеу — таразының тепе-теңдігі!`); };
  },
  down(a, x, y) { const s = a.s; for (const b of s.rb || []) if (x > b.x - 4 && x < b.x + 34 && y > b.y - 4 && y < b.y + 34) { s.right.splice(b.i, 1); return; } s.weights.forEach((w, i) => { const bx = 120 + i * 120; if (x > bx - 40 && x < bx + 40 && y > 500 && y < 580 && s.right.length < 15) s.right.push(w); }); },
  tilt(s) { const R = s.right.reduce((p, w) => p + w, 0); return clamp((R - s.leftMass) / (s.sack ? 8 : 400), -1, 1) * .22; },
  draw(a) {
    const { g, s } = a; bg(g, '#f3fbf4'); const R = s.right.reduce((p, w) => p + w, 0); const t = ENGINES.balance.tilt(s);
    const cx = 480, cy = 200; g.fillStyle = '#c8963e'; g.beginPath(); g.moveTo(cx - 60, 470); g.lineTo(cx + 60, 470); g.lineTo(cx + 14, cy); g.lineTo(cx - 14, cy); g.closePath(); g.fill();
    g.save(); g.translate(cx, cy); g.rotate(t); RR(g, -260, -8, 520, 16, 8, '#e0a526', '#a8761a'); g.restore();
    const ends = [-1, 1].map(sd => [cx + Math.cos(t) * 250 * sd, cy + Math.sin(t) * 250 * sd]);
    for (const [ex, ey] of ends) { g.strokeStyle = '#8a6a2a'; g.lineWidth = 2; g.beginPath(); g.moveTo(ex, ey); g.lineTo(ex - 80, ey + 100); g.moveTo(ex, ey); g.lineTo(ex + 80, ey + 100); g.stroke(); g.fillStyle = '#f0b432'; g.beginPath(); g.ellipse(ex, ey + 104, 96, 16, 0, 0, 7); g.fill(); g.strokeStyle = '#a8761a'; g.stroke(); }
    const [lx, ly] = ends[0], [rx, ry] = ends[1];
    for (let i = 0; i < s.n; i++) { const ax = lx - (s.n - 1) * 26 + i * 52, ay = ly + 78; if (s.sack) { g.fillStyle = '#b08850'; g.beginPath(); g.ellipse(ax, ay, 44, 34, 0, 0, 7); g.fill(); for (let k = 0; k < 5; k++) { g.fillStyle = '#d33'; g.beginPath(); g.arc(ax - 26 + k * 13, ay - 30 + (k % 2) * 6, 9, 0, 7); g.fill(); } T(g, '?', ax, ay + 8, { a: 'center', size: 22, w: 800, c: '#fff' }); } else if (s.ore) { g.fillStyle = '#7d756a'; g.beginPath(); g.moveTo(ax - 40, ay + 20); g.lineTo(ax - 28, ay - 18); g.lineTo(ax + 8, ay - 28); g.lineTo(ax + 40, ay - 4); g.lineTo(ax + 34, ay + 20); g.closePath(); g.fill(); for (let k = 0; k < 6; k++) { g.fillStyle = '#d98b3a'; g.beginPath(); g.arc(ax - 20 + k * 8, ay - 4 + (k % 2) * 10, 3, 0, 7); g.fill(); } T(g, '?', ax, ay + 4, { a: 'center', size: 22, w: 800, c: '#fff' }); }
      else { const gr = g.createRadialGradient(ax - 7, ay - 8, 3, ax, ay, 24); gr.addColorStop(0, '#ff8a7a'); gr.addColorStop(1, '#c8201b'); g.fillStyle = gr; g.beginPath(); g.arc(ax, ay, 22, 0, 7); g.fill(); g.strokeStyle = '#6b3b1a'; g.lineWidth = 3; g.beginPath(); g.moveTo(ax, ay - 20); g.lineTo(ax + 3, ay - 30); g.stroke(); T(g, 'x', ax, ay + 6, { a: 'center', size: 18, w: 800, c: '#fff', f: 'F' }); } }
    if (s.extra) { RR(g, lx + 50, ly + 66, 36, 34, 6, '#5b6b88'); T(g, String(s.extra), lx + 68, ly + 88, { a: 'center', size: 12, w: 800, c: '#fff' }); }
    s.rb = []; s.right.forEach((w, i) => { const wx = rx - 70 + (i % 5) * 34, wy = ry + 74 - Math.floor(i / 5) * 34; s.rb.push({ x: wx - 15, y: wy, i }); RR(g, wx - 15, wy, 30, 30, 6, (s.sack ? w * 100 : w) >= 500 ? '#2b3a5c' : (s.sack ? w * 100 : w) >= 200 ? '#43506e' : (s.sack ? w * 100 : w) >= 100 ? '#6b7a99' : '#9aa6bd'); T(g, String(w), wx, wy + 20, { a: 'center', size: 11, w: 800, c: '#fff' }); });
    s.weights.forEach((w, i) => { const bx = 120 + i * 120; RR(g, bx - 40, 510, 80, 60, 14, '#fff', P.line); RR(g, bx - 18, 520, 36, 30, 6, (s.sack ? w * 100 : w) >= 500 ? '#2b3a5c' : (s.sack ? w * 100 : w) >= 200 ? '#43506e' : (s.sack ? w * 100 : w) >= 100 ? '#6b7a99' : '#9aa6bd'); T(g, `${w} ${s.u}`, bx, 565, { a: 'center', size: 13, w: 700 }); });
    T(g, '+ гір қосу', 640, 548, { size: 15, c: P.mute, w: 700 });
    const bal = R === s.leftMass;
    T(g, bal ? 'ТЕПЕ-ТЕҢ ✓' : R < s.leftMass ? 'Сол жақ ауыр' : 'Оң жақ ауыр', cx, 120, { a: 'center', size: 22, w: 800, f: 'D', c: bal ? P.green : P.ink2 });
    a.read([['Оң табақтағы гірлер', `${R} ${s.u}`], s.ore ? 'm = гірлер массасы' : `${s.n}x${s.extra ? ' + ' + s.extra : ''} = ${bal ? R : '?'}`, bal ? (s.ore ? `m = ${R} г` : `x = (${R}${s.extra ? ' − ' + s.extra : ''}) : ${s.n}`) : 'Тепе-теңдікке жеткенше гір қос.']);
  },
};

// ---- 5. Кірпіш қалау ----
ENGINES.bricks = {
  setup(a) { const s = a.s = { d: pick([2, 3]), h: pick([4, 5, 6]) }; s.l0 = rnd(4, 8); s.N = s.l0 * s.h * s.d; s.l = 3; s.hh = 2; s.dd = 1;
    a.slider('Ұзындығы (кірпіш)', 1, 10, 1, s.l, '', v => { s.l = v; }); a.slider('Биіктігі (қатар)', 1, 8, 1, s.hh, '', v => { s.hh = v; }); a.slider('Қалыңдығы (қабат)', 1, 3, 1, s.dd, '', v => { s.dd = v; });
    a.read([`Тапсырма: ${s.N} кірпіштен биіктігі ${s.h} қатар, қалыңдығы ${s.d} қабат қабырға қала.`]); },
  draw(a) {
    const { g, s } = a; bg(g, '#fff3e0'); const n = s.l * s.hh * s.dd; const bw = 46, bh = 22, dz = 18;
    const ox = 330 - s.l * bw / 2 - s.dd * dz / 4, oy = 480;
    for (let z = s.dd - 1; z >= 0; z--) for (let y = 0; y < s.hh; y++) for (let x = 0; x < s.l; x++) {
      const X = ox + x * bw + z * dz * .5, Y = oy - (y + 1) * bh - z * dz * .5;
      const band = y === Math.floor(s.hh * .6); const base = band ? '#1f9fb8' : `hsl(${28 + ((x * 7 + y * 3) % 5)}, 52%, ${58 + ((x + y) % 3) * 4}%)`;
      g.fillStyle = base; g.fillRect(X, Y, bw - 3, bh - 3);
      g.fillStyle = 'rgba(255,255,255,.18)'; g.beginPath(); g.moveTo(X, Y); g.lineTo(X + dz * .5, Y - dz * .5); g.lineTo(X + bw - 3 + dz * .5, Y - dz * .5); g.lineTo(X + bw - 3, Y); g.fill();
      g.fillStyle = 'rgba(0,0,0,.12)'; g.beginPath(); g.moveTo(X + bw - 3, Y); g.lineTo(X + bw - 3 + dz * .5, Y - dz * .5); g.lineTo(X + bw - 3 + dz * .5, Y + bh - 3 - dz * .5); g.lineTo(X + bw - 3, Y + bh - 3); g.fill();
    }
    g.fillStyle = '#c9b48e'; g.fillRect(60, oy, 560, 10);
    RR(g, 660, 120, 260, 300, 18, '#fff', P.line);
    T(g, 'Кірпіш саны', 680, 156, { size: 15, c: P.mute, w: 700 }); T(g, `${n} / ${s.N}`, 680, 196, { size: 32, w: 800, f: 'D', c: n === s.N ? P.green : P.ink });
    T(g, 'V = a · b · c', 680, 250, { size: 22, w: 600, f: 'F' }); T(g, `${s.l} · ${s.hh} · ${s.dd} = ${n}`, 680, 286, { size: 20, w: 700 });
    const ok = n === s.N && s.hh === s.h && s.dd === s.d;
    T(g, ok ? 'Қабырға дайын ✓' : s.hh !== s.h ? `Биіктігі ${s.h} қатар болсын` : s.dd !== s.d ? `Қалыңдығы ${s.d} қабат болсын` : n < s.N ? 'Кірпіш жетпейді' : 'Кірпіш артық', 680, 340, { size: 16, w: 700, c: ok ? P.green : P.red });
    a.read([['Ұзындығы', `${s.l} кірпіш`], ['Биіктігі', `${s.hh} қатар`], ['Қалыңдығы', `${s.dd} қабат`], `Ұзындық = N : (биіктік · қалыңдық) = ${s.N} : ${s.h * s.d}`]);
    if (ok && !a.finished) a.done(`${s.N} = ${s.l0} · ${s.h} · ${s.d}. Тікбұрышты параллелепипед көлемі V = a·b·c — Ясауи кесенесінің шеберлері де осылай есептеген.`);
  },
};

// ---- 6. Лабиринт ----
ENGINES.maze = {
  setup(a) { const C = 13, R = 9; const s = a.s = { C, R, cs: 44, path: [[0, 0]], walls: {} };
    const vis = new Set(['0,0']); const st = [[0, 0]]; const key = (x, y) => `${x},${y}`; for (let x = 0; x < C; x++) for (let y = 0; y < R; y++) s.walls[key(x, y)] = { r: 1, b: 1 };
    while (st.length) { const [x, y] = st[st.length - 1]; const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => [x + dx, y + dy]).filter(([nx, ny]) => nx >= 0 && ny >= 0 && nx < C && ny < R && !vis.has(key(nx, ny))); if (!nb.length) { st.pop(); continue; } const [nx, ny] = nb[Math.floor(Math.random() * nb.length)]; if (nx > x) s.walls[key(x, y)].r = 0; if (nx < x) s.walls[key(nx, ny)].r = 0; if (ny > y) s.walls[key(x, y)].b = 0; if (ny < y) s.walls[key(nx, ny)].b = 0; vis.add(key(nx, ny)); st.push([nx, ny]); }
    // қосымша өткелдер (бірнеше жол болсын)
    for (let i = 0; i < 14; i++) { const x = rnd(0, C - 2), y = rnd(0, R - 2); s.walls[key(x, y)][Math.random() < .5 ? 'r' : 'b'] = 0; }
    s.goal = [C - 1, R - 1]; s.best = ENGINES.maze.bfs(s);
    a.button('Қайта бастау', () => { s.path = [[0, 0]]; });
    a.read(['Тышқанмен сүйреп немесе басып жол сыз.']); },
  open(s, [x, y], [nx, ny]) { const k = (a, b) => `${a},${b}`; if (nx === x + 1 && ny === y) return !s.walls[k(x, y)].r; if (nx === x - 1 && ny === y) return !s.walls[k(nx, ny)].r; if (ny === y + 1 && nx === x) return !s.walls[k(x, y)].b; if (ny === y - 1 && nx === x) return !s.walls[k(nx, ny)].b; return false; },
  bfs(s) { const q = [[0, 0, 0]]; const seen = new Set(['0,0']); while (q.length) { const [x, y, d] = q.shift(); if (x === s.goal[0] && y === s.goal[1]) return d; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= s.C || ny >= s.R || seen.has(`${nx},${ny}`)) continue; if (ENGINES.maze.open(s, [x, y], [nx, ny])) { seen.add(`${nx},${ny}`); q.push([nx, ny, d + 1]); } } } return -1; },
  cell(a, x, y) { const s = a.s, ox = 40, oy = 70; const cx = Math.floor((x - ox) / s.cs), cy = Math.floor((y - oy) / s.cs); return cx >= 0 && cy >= 0 && cx < s.C && cy < s.R ? [cx, cy] : null; },
  step(a, c) { const s = a.s; if (!c) return; const last = s.path[s.path.length - 1]; if (c[0] === last[0] && c[1] === last[1]) return; const prev = s.path[s.path.length - 2]; if (prev && prev[0] === c[0] && prev[1] === c[1]) { s.path.pop(); return; } if (ENGINES.maze.open(s, last, c)) { s.path.push(c); if (c[0] === s.goal[0] && c[1] === s.goal[1]) ENGINES.maze.finish(a); } },
  finish(a) { const s = a.s; const L = s.path.length - 1; if (L === s.best) a.done(`Жол ұзындығы ${L} қадам — ең қысқа жол! Әл-Фараби: «Білім — ең қысқа жол».`); else a.flash(`Кітапханаға жеттің! ${L} қадам. Ең қысқасы — ${s.best}. Қысқартып көр!`, false); },
  down(a, x, y) { ENGINES.maze.step(a, ENGINES.maze.cell(a, x, y)); },
  move(a, x, y, b) { if (!b) return false; ENGINES.maze.step(a, ENGINES.maze.cell(a, x, y)); },
  draw(a) {
    const { g, s } = a; bg(g, '#fdf6e6'); const ox = 40, oy = 70, cs = s.cs;
    RR(g, ox - 8, oy - 8, s.C * cs + 16, s.R * cs + 16, 12, '#f3e6c8');
    g.strokeStyle = '#7a4a1a'; g.lineWidth = 5; g.lineCap = 'round';
    for (let x = 0; x < s.C; x++) for (let y = 0; y < s.R; y++) { const w = s.walls[`${x},${y}`]; const X = ox + x * cs, Y = oy + y * cs; if (w.r && x < s.C - 1) { g.beginPath(); g.moveTo(X + cs, Y); g.lineTo(X + cs, Y + cs); g.stroke(); } if (w.b && y < s.R - 1) { g.beginPath(); g.moveTo(X, Y + cs); g.lineTo(X + cs, Y + cs); g.stroke(); } }
    g.strokeRect(ox, oy, s.C * cs, s.R * cs);
    g.strokeStyle = 'rgba(15,139,141,.85)'; g.lineWidth = 12; g.lineJoin = 'round'; g.beginPath(); s.path.forEach(([x, y], i) => { const X = ox + x * cs + cs / 2, Y = oy + y * cs + cs / 2; i ? g.lineTo(X, Y) : g.moveTo(X, Y); }); g.stroke();
    const [gx, gy] = s.goal; RR(g, ox + gx * cs + 6, oy + gy * cs + 8, cs - 12, cs - 16, 4, '#16306e'); T(g, '📚', ox + gx * cs + cs / 2, oy + gy * cs + cs / 2 + 7, { a: 'center', size: 20 });
    const last = s.path[s.path.length - 1]; mascotDot(g, ox + last[0] * cs + cs / 2, oy + last[1] * cs + cs / 2, 15, a.ctx.color || '#f0b432');
    T(g, 'Әл-Фараби → Отырар кітапханасы', ox, 46, { size: 18, w: 800, f: 'D' });
    const cmds = []; for (let i = 1; i < s.path.length; i++) { const [x0, y0] = s.path[i - 1], [x1, y1] = s.path[i]; const c = x1 > x0 ? '→' : x1 < x0 ? '←' : y1 > y0 ? '↓' : '↑'; if (cmds.length && cmds[cmds.length - 1][0] === c) cmds[cmds.length - 1][1]++; else cmds.push([c, 1]); }
    a.read([['Қадам саны', String(s.path.length - 1)], ['Ең қысқа жол', `${s.best} қадам`], 'Алгоритм: ' + (cmds.length ? cmds.map(([c, n]) => n > 1 ? `${c}×${n}` : c).join(' ') : '—')]);
  },
};

// ---- 7. Бәліш / көл бөлу ----
ENGINES.cake = {
  setup(a) { const lake = a.sim.mode === 'lake'; const s = a.s = { lake, n: 4, sel: new Set() };
    const opts = lake ? [[1, 2], [2, 5], [3, 5], [3, 8], [5, 8]] : [[1, 4], [3, 8], [2, 3], [5, 6], [3, 4], [5, 12], [7, 10]]; [s.k, s.m] = pick(opts);
    a.slider('Бөлік саны n', 2, 12, 1, s.n, '', v => { s.n = v; s.sel.clear(); });
    a.read([lake ? `Тапсырма: көлдің ${s.k}/${s.m} бөлігін «тұщы су» деп белгіле.` : `Тапсырма: қонақтарға бәліштің ${s.k}/${s.m} бөлігін бер.`]); },
  down(a, x, y) { const s = a.s; if (s.lake) { const L = 90, Rr = 590; if (x < L || x > Rr || y < 180 || y > 420) return; const i = Math.floor((x - L) / ((Rr - L) / s.n)); s.sel.has(i) ? s.sel.delete(i) : s.sel.add(i); } else { const cx = 330, cy = 300; const d = Math.hypot(x - cx, y - cy); if (d > 220) return; let an = Math.atan2(y - cy, x - cx) + Math.PI / 2; if (an < 0) an += Math.PI * 2; const i = Math.floor(an / (Math.PI * 2 / s.n)); s.sel.has(i) ? s.sel.delete(i) : s.sel.add(i); } },
  draw(a) {
    const { g, s } = a; bg(g, s.lake ? '#e8f6ff' : '#fff4e2'); const k = s.sel.size;
    if (s.lake) {
      const L = 90, Rr = 590; g.save(); g.beginPath(); g.moveTo(L, 300); g.bezierCurveTo(L + 60, 170, 300, 230, 380, 200); g.bezierCurveTo(470, 170, Rr - 30, 190, Rr, 260); g.bezierCurveTo(Rr + 10, 330, 470, 360, 380, 380); g.bezierCurveTo(280, 400, L + 40, 420, L, 300); g.closePath(); g.clip();
      for (let i = 0; i < s.n; i++) { const x0 = L + i * (Rr - L) / s.n; g.fillStyle = s.sel.has(i) ? '#8fd8ff' : '#2f8fa8'; g.fillRect(x0, 150, (Rr - L) / s.n, 300); g.strokeStyle = '#fff'; g.lineWidth = 3; g.beginPath(); g.moveTo(x0, 150); g.lineTo(x0, 450); g.stroke(); }
      g.restore(); T(g, 'Батыс (тұщы)', L, 470, { w: 700, c: P.teal }); T(g, 'Шығыс (тұзды)', Rr, 470, { w: 700, c: '#2f6f88', a: 'right' }); T(g, 'Балқаш көлі', 340, 140, { a: 'center', size: 22, w: 800, f: 'D' });
    } else {
      const cx = 330, cy = 300, R = 220; g.fillStyle = 'rgba(0,0,0,.08)'; g.beginPath(); g.ellipse(cx, cy + 16, R + 10, R * .96, 0, 0, 7); g.fill();
      for (let i = 0; i < s.n; i++) { const a0 = -Math.PI / 2 + i * Math.PI * 2 / s.n, a1 = a0 + Math.PI * 2 / s.n; const off = s.sel.has(i) ? 16 : 0; const mx = Math.cos((a0 + a1) / 2) * off, my = Math.sin((a0 + a1) / 2) * off;
        const gr = g.createRadialGradient(cx + mx, cy + my, 20, cx + mx, cy + my, R); gr.addColorStop(0, s.sel.has(i) ? '#ffd88a' : '#f2c062'); gr.addColorStop(1, s.sel.has(i) ? '#e09a2a' : '#c47f2a'); g.fillStyle = gr;
        g.beginPath(); g.moveTo(cx + mx, cy + my); g.arc(cx + mx, cy + my, R, a0, a1); g.closePath(); g.fill(); g.strokeStyle = '#8a4f14'; g.lineWidth = 2; g.stroke();
        for (let j = 0; j < 3; j++) { const am = a0 + (a1 - a0) * (j + 1) / 4; g.fillStyle = 'rgba(138,79,20,.35)'; g.beginPath(); g.arc(cx + mx + Math.cos(am) * R * .62, cy + my + Math.sin(am) * R * .62, 6, 0, 7); g.fill(); } }
      g.strokeStyle = '#fff3d0'; g.lineWidth = 3; g.beginPath(); g.arc(cx, cy, R * .35, 0, 7); g.stroke();
    }
    RR(g, 660, 110, 270, 330, 18, '#fff', P.line);
    T(g, 'Тапсырма', 680, 146, { size: 14, c: P.mute, w: 700 }); T(g, `${s.k}/${s.m}`, 680, 190, { size: 40, w: 800, f: 'F' });
    T(g, 'Таңдалғаны', 680, 236, { size: 14, c: P.mute, w: 700 }); T(g, `${k}/${s.n}`, 680, 280, { size: 40, w: 800, f: 'F', c: k * s.m === s.k * s.n && k ? P.green : P.ink });
    T(g, `≈ ${nf(k / s.n * 100, 1)} %`, 680, 316, { size: 18, w: 700, c: P.ink2 }); if (!s.lake) T(g, `1 бөлік = 360° : ${s.n} = ${nf(360 / s.n, 1)}°`, 680, 350, { size: 15, w: 600, c: P.ink2 });
    T(g, 'Бөлшектер тең: a/b = c/d ⇔ a·d = b·c', 680, 410, { size: 12, w: 600, c: P.mute });
    a.read([['Бөлік саны', String(s.n)], ['Таңдалды', `${k} бөлік`], `${k}/${s.n} ${k * s.m === s.k * s.n ? '=' : '≠'} ${s.k}/${s.m}`]);
    if (k && k * s.m === s.k * s.n && !a.finished) a.done(`${k}/${s.n} = ${s.k}/${s.m} ≈ ${nf(s.k / s.m * 100, 1)} %. ${s.lake ? 'Балқаштың бір бөлігі тұщы, бір бөлігі тұзды — табиғаттың ерекше құбылысы.' : 'Той дастарханы әділ бөлінді!'}`);
  },
};

// ---- 8. Зымыран ----
ENGINES.rocket = {
  setup(a) { const s = a.s = { fuel: 200, F: 4, dry: 40, run: false, t: 0, h: 0, v: 0, acc: 0, m: 0, hist: [], cd: 0, msg: '' };
    a.slider('Отын массасы', 50, 300, 10, s.fuel, 'т', v => { s.fuel = v; }); a.slider('Тарту күші F', 1, 8, .1, s.F, 'МН', v => { s.F = v; });
    a.button('🚀 Ұшыру', () => ENGINES.rocket.launch(a), 'btn-primary sm'); a.button('Қайта бастау', () => { s.run = false; s.t = s.h = s.v = 0; s.hist = []; s.msg = ''; });
    if (a.ctx.onLaunch3D) a.button('3D-де ұшыру', () => a.ctx.onLaunch3D({ fuel: s.fuel, F: s.F }));
    s.stars = [...Array(90)].map(() => [Math.random() * 600, Math.random() * 600, Math.random() * 1.6 + .4]); },
  launch(a) { const s = a.s; s.run = true; s.t = s.h = s.v = 0; s.hist = []; s.mf = s.fuel * 1000; s.cd = 3; s.msg = '';
    a.loop((dt) => { if (!s.run) return false; if (s.cd > 0) { s.cd -= dt; return true; } const sub = 40, h = dt * 20 / sub; for (let i = 0; i < sub; i++) { const m = s.dry * 1000 + s.mf; const thrust = s.mf > 0 ? s.F * 1e6 : 0; const g0 = 9.81 * Math.pow(6371e3 / (6371e3 + s.h), 2); let acc = (thrust - m * g0) / m; if (s.h <= 0 && acc < 0 && s.v <= 0) { acc = 0; s.v = 0; } s.acc = acc; s.m = m; s.v += acc * h; s.h = Math.max(0, s.h + s.v * h); if (s.mf > 0) s.mf = Math.max(0, s.mf - thrust / 3000 * h); s.t += h; }
      if (s.hist.length === 0 || s.t - s.hist[s.hist.length - 1][0] > 2) s.hist.push([s.t, s.v, s.h]);
      if (s.h >= 100000 && !a.finished) { a.done(`Қарман сызығынан (100 км) өттің! t ≈ ${nf(s.t)} с, v ≈ ${nf(s.v)} м/с. Ғарыш — Байқоңырдан басталады!`); }
      if (s.t > 2 && s.h <= 0 && s.v <= 0) { s.run = false; s.msg = s.F * 1e6 <= (s.dry + s.fuel) * 1000 * 9.81 ? 'Зымыран көтерілмеді: F < m·g. Тарту күшін арттыр немесе отынды азайт!' : 'Зымыран жерге қайтты.'; return false; }
      if (s.t > 400 || s.h > 250000) { s.run = false; return false; } return true; }); },
  draw(a) {
    const { g, s } = a; const sp = clamp(s.h / 100000, 0, 1);
    const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, `rgb(${Math.round(110 * (1 - sp) + 4)},${Math.round(180 * (1 - sp) + 8)},${Math.round(255 * (1 - sp) + 30)})`); gr.addColorStop(1, `rgb(${Math.round(220 * (1 - sp) + 10)},${Math.round(236 * (1 - sp) + 16)},${Math.round(255 * (1 - sp) + 50)})`); g.fillStyle = gr; g.fillRect(0, 0, 600, H);
    if (sp > .3) for (const [x, y, r] of s.stars) { g.fillStyle = `rgba(255,255,255,${(sp - .3) * 1.4})`; g.beginPath(); g.arc(x, (y + s.h / 400) % H, r, 0, 7); g.fill(); }
    const camY = Math.min(s.h, 1e9); const groundY = 520 + Math.min(camY * .8, 900);
    if (groundY < H + 40) { g.fillStyle = '#d9c49a'; g.fillRect(0, groundY, 600, H); g.fillStyle = '#6b6f78'; g.fillRect(230, groundY - 14, 140, 14); }
    const ry = Math.max(150, 470 - s.h * .8); const rx = 300;
    if (s.run && s.mf > 0 && s.cd <= 0) { const fl = 50 + Math.random() * 30; const fg = g.createLinearGradient(0, ry + 60, 0, ry + 60 + fl); fg.addColorStop(0, '#fff6b0'); fg.addColorStop(.5, '#ffb21a'); fg.addColorStop(1, 'rgba(255,80,0,0)'); g.fillStyle = fg; g.beginPath(); g.moveTo(rx - 16, ry + 60); g.quadraticCurveTo(rx, ry + 60 + fl * 1.4, rx + 16, ry + 60); g.fill(); if (s.h < 3000) for (let i = 0; i < 10; i++) { g.fillStyle = `rgba(230,230,235,${.5 - i * .04})`; g.beginPath(); g.arc(rx + (Math.random() - .5) * 120, groundY - 10 - Math.random() * 30, 20 + Math.random() * 20, 0, 7); g.fill(); } }
    g.fillStyle = '#fff'; g.strokeStyle = '#9aa6bd'; g.lineWidth = 2; RR(g, rx - 18, ry - 40, 36, 100, 8, '#fff', '#9aa6bd'); g.fillStyle = P.red; g.beginPath(); g.moveTo(rx - 18, ry - 38); g.quadraticCurveTo(rx, ry - 90, rx + 18, ry - 38); g.fill(); g.fillStyle = '#1c4fb0'; g.fillRect(rx - 18, ry + 6, 36, 8); for (const sd of [-1, 1]) { g.fillStyle = '#e8edf5'; g.beginPath(); g.moveTo(rx + sd * 18, ry + 10); g.lineTo(rx + sd * 34, ry + 60); g.lineTo(rx + sd * 18, ry + 60); g.fill(); }
    if (s.cd > 0) T(g, String(Math.ceil(s.cd)), 300, 260, { a: 'center', size: 90, w: 800, f: 'D', c: '#fff' });
    if (s.h > 0) T(g, `${nf(s.h / 1000, 1)} км`, rx + 50, ry, { size: 18, w: 800, c: sp > .4 ? '#fff' : P.ink });
    // графиктер
    RR(g, 620, 20, 320, 270, 16, '#fff', P.line); RR(g, 620, 310, 320, 270, 16, '#fff', P.line);
    const plot = (y0, idx, max, lab, col) => { T(g, lab, 640, y0 + 30, { size: 14, w: 800, c: col }); g.strokeStyle = P.line; g.lineWidth = 1; g.beginPath(); g.moveTo(650, y0 + 240); g.lineTo(920, y0 + 240); g.moveTo(650, y0 + 240); g.lineTo(650, y0 + 50); g.stroke(); const tm = Math.max(60, s.t); g.strokeStyle = col; g.lineWidth = 3; g.beginPath(); s.hist.forEach((p, i) => { const X = 650 + p[0] / tm * 270, Y = y0 + 240 - clamp(p[idx] / max, 0, 1) * 190; i ? g.lineTo(X, Y) : g.moveTo(X, Y); }); g.stroke(); T(g, `t, с (0…${nf(tm)})`, 920, y0 + 258, { a: 'right', size: 11, c: P.mute }); };
    plot(20, 1, Math.max(1000, ...s.hist.map(p => p[1])), 'v(t) — жылдамдық, м/с', P.red); plot(310, 2, Math.max(10000, ...s.hist.map(p => p[2])), 'h(t) — биіктік, м', P.teal);
    if (s.msg) { RR(g, 40, 30, 520, 60, 14, 'rgba(255,255,255,.95)', P.red); T(g, s.msg, 300, 66, { a: 'center', size: 15, w: 700, c: P.red }); }
    const m0 = (s.dry + s.fuel) * 1000; const a0 = (s.F * 1e6 - m0 * 9.81) / m0;
    a.read([['Старттағы масса m', `${nf(m0 / 1000)} т`], ['Ауырлық күші mg', `${nf(m0 * 9.81 / 1e6, 2)} МН`], ['Старттағы үдеу a', `${nf(a0, 2)} м/с²`], ['Қазір: t / v / h', `${nf(s.t)} с · ${nf(s.v)} м/с · ${nf(s.h / 1000, 1)} км`], 'a = (F − m·g) : m']);
  },
};

// ---- 9. Координаталық жазықтық ----
ENGINES.coords = {
  setup(a) { const s = a.s = { A: [rnd(-4, -2), rnd(-1, 3)], click: null, stage: 1 }; do { s.B = [rnd(1, 4), rnd(-5, 1)]; } while (s.B[0] === s.A[0]);
    s.km = 50; a.read([`Ақтау портынан A(${s.A[0]}; ${s.A[1]}) шығамыз.`, `1-қадам: B(${s.B[0]}; ${s.B[1]}) нүктесін картадан тауып, бас.`, '1 бірлік = 50 км']); },
  toS(x, y) { return [60 + (x + 8) * 34, 300 - y * 34]; },
  down(a, x, y) { const s = a.s; const gx = Math.round((x - 60) / 34 - 8), gy = Math.round((300 - y) / 34); if (gx < -8 || gx > 8 || gy < -7 || gy > 7) return; s.click = [gx, gy];
    if (s.stage === 1) { if (gx === s.B[0] && gy === s.B[1]) { s.stage = 2; a.flash('B нүктесі табылды ✓'); const d = Math.hypot(s.B[0] - s.A[0], s.B[1] - s.A[1]) * s.km; a.ask('AB қашықтығы неше км? (Пифагор: √(Δx² + Δy²) · 50, бүтінге дөңгелекте)', Math.round(d), 3, 'км'); a.doneMsg = `AB = √(${s.B[0] - s.A[0]}² + ${s.B[1] - s.A[1]}²) · 50 ≈ ${nf(d)} км.`; } else a.flash(`Бұл (${gx}; ${gy}) нүктесі. B(${s.B[0]}; ${s.B[1]}) емес.`, false); } },
  draw(a) {
    const { g, s } = a; bg(g, '#e6f4ff'); const c = ENGINES.coords.toS;
    const sea = [[-2, 7.2], [1, 7], [2.5, 5.5], [1.5, 4], [3.5, 2.5], [5, 1], [4, -1], [5.5, -3], [4.5, -5.5], [2, -7], [-1, -6.8], [-3, -5], [-2, -2.5], [-4.5, -1], [-6, 1.5], [-5, 4], [-4, 6]];
    g.fillStyle = '#8fd0f0'; g.strokeStyle = '#5aaed6'; g.lineWidth = 3; g.beginPath();
    sea.forEach((pt, i) => { const nx = sea[(i + 1) % sea.length]; const [x1, y1] = c(...pt), [x2, y2] = c(...nx); if (!i) g.moveTo((x1 + x2) / 2, (y1 + y2) / 2); else g.quadraticCurveTo(x1, y1, (x1 + x2) / 2, (y1 + y2) / 2); });
    { const [x1, y1] = c(...sea[0]), [x2, y2] = c(...sea[1]); g.quadraticCurveTo(x1, y1, (x1 + x2) / 2, (y1 + y2) / 2); } g.closePath(); g.fill(); g.stroke();
    T(g, 'Ақтау', ...c(-5.6, 0.2), { size: 12, w: 700, c: P.ink2 }); T(g, 'Атырау', ...c(-1.6, 7.6), { size: 12, w: 700, c: P.ink2 });
    for (let x = -8; x <= 8; x++) { const [X] = c(x, 0); g.strokeStyle = x === 0 ? P.ink : 'rgba(15,27,61,.14)'; g.lineWidth = x === 0 ? 2 : 1; g.beginPath(); g.moveTo(X, 62); g.lineTo(X, 538); g.stroke(); if (x) T(g, String(x), X, 318, { a: 'center', size: 11, c: P.ink2 }); }
    for (let y = -7; y <= 7; y++) { const [, Y] = c(0, y); g.strokeStyle = y === 0 ? P.ink : 'rgba(15,27,61,.14)'; g.lineWidth = y === 0 ? 2 : 1; g.beginPath(); g.moveTo(60, Y); g.lineTo(604, Y); g.stroke(); if (y) T(g, String(y), 334 + 6, Y + 4, { size: 11, c: P.ink2 }); }
    T(g, 'x', 600, 292, { size: 16, w: 800, f: 'F' }); T(g, 'y', 345, 72, { size: 16, w: 800, f: 'F' });
    const [ax, ay] = c(...s.A); g.fillStyle = P.red; g.beginPath(); g.arc(ax, ay, 8, 0, 7); g.fill(); T(g, `A(${s.A[0]}; ${s.A[1]})`, ax + 10, ay - 10, { w: 800, size: 15 });
    if (s.stage >= 2) { const [bx, by] = c(...s.B); g.strokeStyle = P.teal; g.lineWidth = 4; g.beginPath(); g.moveTo(ax, ay); g.lineTo(bx, by); g.stroke(); g.setLineDash([6, 5]); g.strokeStyle = P.gold; g.lineWidth = 2; g.beginPath(); g.moveTo(ax, ay); g.lineTo(bx, ay); g.lineTo(bx, by); g.stroke(); g.setLineDash([]); T(g, `Δx = ${s.B[0] - s.A[0]}`, (ax + bx) / 2, ay + (by > ay ? -10 : 22), { a: 'center', w: 800, c: P.gold }); T(g, `Δy = ${s.B[1] - s.A[1]}`, bx + 8, (ay + by) / 2, { w: 800, c: P.gold }); g.fillStyle = P.teal; g.beginPath(); g.arc(bx, by, 8, 0, 7); g.fill(); T(g, `B(${s.B[0]}; ${s.B[1]})`, bx + 10, by - 10, { w: 800, size: 15 }); }
    if (s.click) { const [cx, cy] = c(...s.click); g.strokeStyle = P.violet; g.lineWidth = 2; g.beginPath(); g.arc(cx, cy, 12, 0, 7); g.stroke(); }
    RR(g, 630, 60, 300, 210, 16, '#fff', P.line); T(g, 'Каспий теңізі', 650, 96, { size: 20, w: 800, f: 'D' }); T(g, 'Кеменің бағыты: A → B', 650, 128, { size: 15, c: P.ink2 }); T(g, 'd = √(Δx² + Δy²)', 650, 176, { size: 22, f: 'F', w: 600 }); T(g, '1 бірлік = 50 км', 650, 214, { size: 15, c: P.ink2 });
  },
};

// ---- 10. Еркін түсу ----
ENGINES.fall = {
  setup(a) { const s = a.s = { h: 20, run: false, t: 0, y: 0, marks: [], q: pick([[45, 3], [80, 4], [125, 5], [20, 2]]) };
    a.slider('Биіктік h', 5, 125, 5, s.h, 'м', v => { s.h = v; s.run = false; s.t = 0; s.marks = []; });
    a.button('Тасты тастау', () => { s.run = true; s.t = 0; s.marks = []; a.loop((dt) => { if (!s.run) return false; s.t += dt; const y = 5 * s.t * s.t; if (Math.floor(s.t * 2) > s.marks.length - 1 && y < s.h) s.marks.push(y); if (y >= s.h) { s.t = Math.sqrt(2 * s.h / 10); s.run = false; return false; } return true; }); }, 'btn-primary sm');
    a.ask(`Тас ${s.q[0]} м биіктіктен неше секундта құлайды? (g = 10 м/с²)`, s.q[1], .05, 'с'); a.doneMsg = `t = √(2h : g) = √(2 · ${s.q[0]} : 10) = ${s.q[1]} с.`; },
  draw(a) {
    const { g, s } = a; bg(g, '#ffeede'); const top = 60, bot = 540; const k = (bot - top) / 125; const cy = bot - s.h * k;
    g.fillStyle = '#c4572f'; g.beginPath(); g.moveTo(0, bot); g.lineTo(0, cy); g.lineTo(200, cy); g.lineTo(230, cy + 30); g.lineTo(210, bot); g.closePath(); g.fill();
    for (let i = 0; i < 8; i++) { g.strokeStyle = 'rgba(255,255,255,.15)'; g.lineWidth = 3; g.beginPath(); g.moveTo(0, cy + i * (bot - cy) / 8); g.lineTo(215, cy + i * (bot - cy) / 8 + 8); g.stroke(); }
    g.fillStyle = '#9fd28a'; g.fillRect(0, bot, W, H - bot);
    for (let m = 0; m <= 125; m += 25) { const Y = bot - m * k; g.strokeStyle = 'rgba(15,27,61,.25)'; g.beginPath(); g.moveTo(240, Y); g.lineTo(520, Y); g.stroke(); T(g, `${m} м`, 528, Y + 4, { size: 12, c: P.ink2 }); }
    const y = s.run || s.t ? Math.min(s.h, 5 * s.t * s.t) : 0;
    s.marks.forEach((m, i) => { g.fillStyle = 'rgba(15,139,141,.35)'; g.beginPath(); g.arc(300, cy + m * k, 11, 0, 7); g.fill(); T(g, `${nf(i * .5, 1)} с`, 318, cy + m * k + 4, { size: 11, c: P.teal, w: 700 }); });
    g.fillStyle = '#6b5a48'; g.beginPath(); g.arc(300, cy + y * k, 13, 0, 7); g.fill();
    mascotDot(g, 180, cy - 22, 18, a.ctx.color || '#3fb6ff');
    RR(g, 620, 60, 310, 230, 16, '#fff', P.line);
    T(g, 'Секундомер', 640, 96, { size: 14, c: P.mute, w: 700 }); T(g, `${nf(s.t, 2)} с`, 640, 146, { size: 44, w: 800, f: 'D' }); T(g, `v = g·t = ${nf(10 * s.t, 1)} м/с`, 640, 190, { size: 17, w: 700, c: P.red }); T(g, 'h = g · t² : 2', 640, 236, { size: 22, f: 'F', w: 600 }); T(g, 'Әр 0,5 с сайын тастың орны', 640, 268, { size: 12, c: P.mute });
    RR(g, 620, 310, 310, 250, 16, '#fff', P.line); T(g, 'h(t) графигі — парабола', 640, 340, { size: 14, w: 800, c: P.teal }); g.strokeStyle = P.teal; g.lineWidth = 3; g.beginPath(); for (let i = 0; i <= 50; i++) { const t = i / 50 * 5; const X = 650 + t / 5 * 260, Y = 540 - Math.min(125, 5 * t * t) / 125 * 180; i ? g.lineTo(X, Y) : g.moveTo(X, Y); } g.stroke();
    if (s.t) { g.fillStyle = P.red; g.beginPath(); g.arc(650 + s.t / 5 * 260, 540 - y / 125 * 180, 6, 0, 7); g.fill(); }
    a.read([['Биіктік', `${s.h} м`], ['Құлау уақыты', `${nf(Math.sqrt(2 * s.h / 10), 2)} с`], 'Биіктік 4 есе артса — уақыт 2 есе артады.']);
  },
};

// ---- 11. Температура графигі ----
ENGINES.graph = {
  setup(a) { const s = a.s = { h: 1000 }; a.slider('Альпинист биіктігі', 1000, 4500, 50, s.h, 'м', v => { s.h = v; });
    a.ask('Қандай биіктікте ауа температурасы 0 °C болады?', 4000, 60, 'м'); a.doneMsg = 't = 18 − 6 · (h − 1000) : 1000 = 0 → h = 4000 м. Сызықтық функция!'; },
  draw(a) {
    const { g, s } = a; const t = 18 - 6 * (s.h - 1000) / 1000; bg(g, t > 0 ? '#e8f6ff' : '#eef3ff');
    const prof = (x) => 540 - Math.max(0, 1 - Math.abs(x - 300) / 260) ** .9 * 420; g.fillStyle = '#7d8a76'; g.beginPath(); g.moveTo(30, 540); for (let x = 30; x <= 570; x += 6) g.lineTo(x, prof(x) + Math.sin(x * .13) * 6); g.lineTo(570, 540); g.fill();
    g.fillStyle = '#fff'; g.beginPath(); g.moveTo(230, prof(230)); for (let x = 230; x <= 370; x += 6) g.lineTo(x, prof(x) + Math.sin(x * .13) * 6); g.fill();
    const hy = 540 - (s.h - 500) / 4006 * 420; let mx = 30; for (let x = 30; x <= 300; x += 2) if (prof(x) <= hy) { mx = x; break; } mascotDot(g, mx, hy - 16, 15, a.ctx.color || '#ff7a1a');
    T(g, 'Мұзтау 4506 м', 300, 104, { a: 'center', w: 800, f: 'D' });
    // термометр
    RR(g, 600, 60, 70, 480, 35, '#fff', P.line); const ty = 470 - (t + 10) / 40 * 380; g.fillStyle = t > 0 ? P.red : P.sky; g.fillRect(625, ty, 20, 470 - ty); g.beginPath(); g.arc(635, 490, 24, 0, 7); g.fill(); T(g, `${nf(t, 1)} °C`, 635, 40, { a: 'center', w: 800, size: 22, f: 'D', c: t > 0 ? P.red : '#2b7bb9' });
    // график
    RR(g, 700, 60, 240, 480, 16, '#fff', P.line); const X = (h) => 720 + (h - 1000) / 3500 * 200, Y = (tt) => 300 - tt * 10;
    g.strokeStyle = P.line; g.beginPath(); g.moveTo(720, Y(0)); g.lineTo(925, Y(0)); g.moveTo(720, 90); g.lineTo(720, 520); g.stroke(); T(g, '0 °C', 724, Y(0) - 6, { size: 11, c: P.mute });
    g.strokeStyle = P.teal; g.lineWidth = 3; g.beginPath(); g.moveTo(X(1000), Y(18)); g.lineTo(X(4500), Y(18 - 21)); g.stroke(); g.fillStyle = P.red; g.beginPath(); g.arc(X(s.h), Y(t), 7, 0, 7); g.fill();
    T(g, 't(h)', 900, 110, { f: 'F', size: 18, w: 600 }); T(g, 'h, м →', 925, 536, { a: 'right', size: 11, c: P.mute });
    a.read([['Биіктік h', `${nf(s.h)} м`], ['Температура t', `${nf(t, 1)} °C`], 't = 18 − 6 · (h − 1000) : 1000', 'Әр 1000 м — 6 °C салқынырақ']);
  },
};

// ---- 12. Абай өлеңі: буын ----
const ABAI = [[['Ғы', 'лым'], ['тап', 'пай'], ['мақ', 'тан', 'ба,']], [['О', 'рын'], ['тап', 'пай'], ['бап', 'тан', 'ба,']], [['Құ', 'мар', 'ла', 'нып'], ['шат', 'тан', 'ба,']], [['Ой', 'нап'], ['бос', 'қа'], ['кү', 'лу', 'ге.']]];
ENGINES.syllables = {
  setup(a) { const s = a.s = { open: new Set(), boxes: [] }; a.ask('Төрт жолда барлығы неше буын бар?', 28, 0, 'буын'); a.doneMsg = '7 + 7 + 7 + 7 = 28. Абайдың «Ғылым таппай мақтанба» өлеңінің әр жолы — 7 буын. Өлең де математикаға бағынады!'; a.read(['Сөзді бас — ол буынға бөлінеді.']); },
  down(a, x, y) { const s = a.s; for (const b of s.boxes) if (x > b.x && x < b.x + b.w && y > b.y && y < b.y + b.h) { s.open.has(b.k) ? s.open.delete(b.k) : s.open.add(b.k); } },
  draw(a) {
    const { g, s } = a; bg(g, '#fbf3e2'); s.boxes = [];
    T(g, 'Абай Құнанбайұлы · «Ғылым таппай мақтанба»', 40, 60, { size: 20, w: 800, f: 'D' });
    let total = 0;
    ABAI.forEach((line, li) => { let x = 40; const y = 110 + li * 110; let cnt = 0, allOpen = true;
      line.forEach((word, wi) => { const k = `${li}-${wi}`; const open = s.open.has(k); g.font = `700 26px ${FB}`;
        if (open) { word.forEach((syl, si) => { const w = g.measureText(syl).width + 24; RR(g, x, y, w, 52, 12, ['#d7f2ef', '#fde7b6', '#e5defd', '#ffd9d9'][si % 4], P.line); T(g, syl, x + 12, y + 35, { size: 26, w: 700 }); s.boxes.push({ x, y, w, h: 52, k }); x += w + 4; }); cnt += word.length; }
        else { allOpen = false; const t = word.join(''); const w = g.measureText(t).width + 28; RR(g, x, y, w, 52, 12, '#fff', P.gold); T(g, t, x + 14, y + 35, { size: 26, w: 700 }); s.boxes.push({ x, y, w, h: 52, k }); x += w; }
        x += 18; });
      RR(g, 780, y + 4, 140, 44, 22, allOpen ? P.teal : '#eee', null); T(g, allOpen ? `${cnt} буын` : '? буын', 850, y + 33, { a: 'center', size: 18, w: 800, c: allOpen ? '#fff' : P.mute }); if (allOpen) total += cnt; });
    a.read([['Ашылған жолдардағы буын', String(total)], 'Қара өлең: әр жолда 7 немесе 11 буын', 'Буын — дауысты дыбыс саны']);
  },
};

// =============================== «АДАЛ АЗАМАТ» ЗЕРТХАНАЛАРЫ ===============================
const MONEY = { 1: ['c', '#c9ccd3'], 2: ['c', '#c9ccd3'], 5: ['c', '#d9b25a'], 10: ['c', '#c9ccd3'], 20: ['c', '#d9b25a'], 50: ['c', '#c9ccd3'], 100: ['c', '#d9b25a'], 200: ['c', '#e6c066'], 500: ['n', '#6d8fb0'], 1000: ['n', '#4f9a8c'], 2000: ['n', '#5f8f4a'], 5000: ['n', '#a06a3a'], 10000: ['n', '#6a5aa8'], 20000: ['n', '#3f6f9a'] };
function drawMoney(g, v, x, y, sc = 1) {
  const [k, col] = MONEY[v];
  if (k === 'c') { const r = (v >= 100 ? 30 : v >= 10 ? 26 : 22) * sc; const gr = g.createRadialGradient(x - r * .3, y - r * .3, 2, x, y, r); gr.addColorStop(0, '#fff'); gr.addColorStop(1, col); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = 2; g.stroke(); g.beginPath(); g.arc(x, y, r * .78, 0, 7); g.strokeStyle = 'rgba(0,0,0,.12)'; g.stroke(); T(g, String(v), x, y + 5, { a: 'center', size: Math.round(15 * sc), w: 800, c: '#2a2a2a' }); return [r * 2, r * 2]; }
  const w = 120 * sc, h = 60 * sc; RR(g, x - w / 2, y - h / 2, w, h, 6, col, 'rgba(0,0,0,.25)'); g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 1.5; g.strokeRect(x - w / 2 + 6, y - h / 2 + 6, w - 12, h - 12);
  g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.arc(x - w * .25, y, h * .28, 0, 7); g.fill();
  T(g, `${v} ₸`, x + w * .12, y + 6, { a: 'center', size: Math.round(17 * sc), w: 800, c: '#fff' }); return [w, h];
}
ENGINES.money = {
  setup(a) {
    const s = a.s = { mode: a.sim.mode || 'change', out: [], boxes: [] };
    if (s.mode === 'change') { s.items = [['Нан', 230], ['Сүт', 420]]; s.total = 650; s.paid = 1000; s.target = 350; s.tray = [500, 200, 100, 50, 20, 10];
      a.read(['Науадан ақша бас — «Қайтарым» табағына түседі. Табақтағы ақшаны басса — қайтып алынады.', 'Қайтарым = Берілгені − Бағасы']); a.button('Қайтарымды беру', () => ENGINES.money.check(a), 'btn-primary sm'); }
    else { s.wallet = [5000, 1000, 5000, 1000, 1000, 5000, 1000]; s.counted = []; a.read(['Әмияндағы банкноттарды бас — үстелге номиналы бойынша жиналады. Содан кейін санап, жауабын жаз.']);
      a.ask('Әмиянда барлығы неше теңге бар?', 19000, 0, '₸'); a.doneMsg = '3 · 5000 + 4 · 1000 = 19 000 ₸.'; }
  },
  check(a) { const s = a.s; const sum = s.out.reduce((p, v) => p + v, 0); if (sum === s.target) a.done(`1000 − (230 + 420) = 350 ₸. Қайтарымды дәл жинадың: ${s.out.join(' + ')} = 350 ₸.`); else a.flash(sum < s.target ? `Әлі ${s.target - sum} ₸ жетпейді` : `${sum - s.target} ₸ артық!`, false); },
  down(a, x, y) { const s = a.s; for (const b of s.boxes) if (x > b.x && x < b.x + b.w && y > b.y && y < b.y + b.h) { b.fn(); return; } },
  draw(a) {
    const { g, s } = a; bg(g, '#f3fbf4', '#fbf8f1'); s.boxes = [];
    if (s.mode === 'change') {
      RR(g, 40, 30, 300, 260, 12, '#fff', P.line); T(g, 'ЧЕК · ДҮКЕН', 190, 64, { a: 'center', size: 16, w: 800, f: 'D' }); g.setLineDash([4, 4]); g.strokeStyle = P.line; g.beginPath(); g.moveTo(60, 80); g.lineTo(320, 80); g.stroke(); g.setLineDash([]);
      s.items.forEach(([n, p], i) => { T(g, n, 60, 115 + i * 34, { size: 17 }); T(g, `${p} ₸`, 320, 115 + i * 34, { a: 'right', size: 17, w: 700 }); });
      T(g, 'Барлығы', 60, 200, { size: 18, w: 800 }); T(g, `${s.total} ₸`, 320, 200, { a: 'right', size: 18, w: 800 }); T(g, 'Берілгені', 60, 236, { size: 16, c: P.ink2 }); T(g, '1000 ₸', 320, 236, { a: 'right', size: 16, c: P.ink2 }); T(g, 'Қайтарым', 60, 268, { size: 16, c: P.teal, w: 800 }); T(g, '? ₸', 320, 268, { a: 'right', size: 16, c: P.teal, w: 800 });
      drawMoney(g, 1000, 470, 100, 1.4); T(g, 'Сатып алушы берді', 470, 160, { a: 'center', size: 14, c: P.mute });
      RR(g, 380, 210, 540, 170, 18, 'rgba(15,139,141,.06)', P.teal); T(g, 'Қайтарым табағы', 400, 236, { size: 14, w: 800, c: P.teal });
      let cx = 420; s.out.forEach((v, i) => { const [w] = drawMoney(g, v, cx + (MONEY[v][0] === 'n' ? 50 : 20), 300); const bx = cx; s.boxes.push({ x: bx, y: 260, w: w + 6, h: 80, fn: () => s.out.splice(i, 1) }); cx += w + 10; });
      const sum = s.out.reduce((p, v) => p + v, 0); T(g, `${sum} ₸`, 900, 236, { a: 'right', size: 20, w: 800, f: 'D', c: sum === s.target ? P.green : P.ink });
      RR(g, 40, 420, 880, 150, 18, '#fff', P.line); T(g, 'Касса науасы', 60, 448, { size: 14, w: 800, c: P.mute });
      s.tray.forEach((v, i) => { const x = 120 + i * 140; drawMoney(g, v, x, 510); s.boxes.push({ x: x - 62, y: 470, w: 124, h: 80, fn: () => { if (s.out.length < 9) s.out.push(v); } }); });
      a.read([['Қайтарымда', `${sum} ₸`], 'Қайтарым = 1000 − 650', 'Ең аз монетамен жина!']);
    } else {
      RR(g, 40, 60, 360, 480, 26, '#7a4a22', '#5a3416'); T(g, 'Әмиян', 220, 100, { a: 'center', size: 18, w: 800, c: '#fff', f: 'D' });
      s.wallet.forEach((v, i) => { const x = 220, y = 150 + i * 52; drawMoney(g, v, x, y, 1.3); s.boxes.push({ x: x - 80, y: y - 26, w: 160, h: 48, fn: () => { s.counted.push(s.wallet.splice(i, 1)[0]); } }); });
      RR(g, 440, 60, 480, 480, 20, '#fff', P.line); T(g, 'Үстел — номинал бойынша сана', 460, 92, { size: 15, w: 800, c: P.mute });
      [5000, 1000].forEach((d, j) => { const n = s.counted.filter(v => v === d).length; for (let k = 0; k < n; k++) drawMoney(g, d, 560 + j * 230 + k * 6, 200 + k * 16, 1.3); T(g, `${d} ₸ × ${n}`, 560 + j * 230, 420, { a: 'center', size: 18, w: 800 }); });
      a.read([['Үстелде', `${s.counted.length} банкнот`], 'Барлығы = 5000 · a + 1000 · b']);
    }
  },
};
ENGINES.budget = {
  setup(a) { const s = a.s = { total: 10000, v: { 'Автобус': 3000, 'Музей билеті': 2000, 'Тамақ': 3000, 'Резерв': 0 } };
    for (const k of Object.keys(s.v)) a.slider(k, 0, 6000, 100, s.v[k], '₸', (x) => { s.v[k] = x; });
    a.read(['Шарттар: автобус ≥ 4000 ₸, билет 25 · 100 = 2500 ₸, резерв ≥ 10 %, барлығы дәл 10 000 ₸.']); a.button('Есепті сыныпқа жариялау', () => ENGINES.budget.check(a), 'btn-primary sm'); },
  check(a) { const s = a.s, v = s.v; const sum = Object.values(v).reduce((p, x) => p + x, 0);
    const err = sum !== s.total ? `Қосынды ${sum} ₸ — дәл 10 000 болуы керек` : v['Автобус'] < 4000 ? 'Автобусқа кемінде 4000 ₸' : v['Музей билеті'] !== 2500 ? 'Билет: 25 · 100 = 2500 ₸' : v['Резерв'] < 1000 ? 'Резерв кемінде 10 % (1000 ₸)' : null;
    if (err) a.flash(err, false); else a.done('Бюджет теңгерілді және ашық жарияланды. Ашықтық — сенімнің кепілі.'); },
  draw(a) {
    const { g, s } = a; bg(g, '#f6f3ff', '#fbf8f1'); const cols = ['#1c4fb0', '#c8963e', '#0f8b8d', '#7c5cff']; const keys = Object.keys(s.v); const sum = keys.reduce((p, k) => p + s.v[k], 0);
    const cx = 260, cy = 300, R = 180; let a0 = -Math.PI / 2;
    keys.forEach((k, i) => { const f = s.v[k] / Math.max(sum, s.total); g.fillStyle = cols[i]; g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, R, a0, a0 + f * Math.PI * 2); g.closePath(); g.fill(); a0 += f * Math.PI * 2; });
    if (sum < s.total) { g.fillStyle = '#e6e0d3'; g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, R, a0, -Math.PI / 2 + Math.PI * 2); g.closePath(); g.fill(); }
    g.fillStyle = '#fff'; g.beginPath(); g.arc(cx, cy, 80, 0, 7); g.fill(); T(g, `${sum}`, cx, cy - 4, { a: 'center', size: 26, w: 800, f: 'D', c: sum === s.total ? P.green : sum > s.total ? P.red : P.ink }); T(g, '/ 10 000 ₸', cx, cy + 22, { a: 'center', size: 14, c: P.mute });
    RR(g, 500, 80, 420, 440, 18, '#fff', P.line); T(g, 'ЕСЕП-ҚИСАП (ашық кесте)', 520, 116, { size: 15, w: 800, c: P.gold });
    keys.forEach((k, i) => { const y = 160 + i * 64; g.fillStyle = cols[i]; g.fillRect(520, y - 14, 18, 18); T(g, k, 550, y, { size: 17, w: 600 }); T(g, `${s.v[k]} ₸`, 820, y, { a: 'right', size: 17, w: 800 }); T(g, `${nf(s.v[k] / s.total * 100, 1)} %`, 900, y, { a: 'right', size: 14, c: P.mute }); });
    g.strokeStyle = P.line; g.beginPath(); g.moveTo(520, 420); g.lineTo(900, 420); g.stroke(); T(g, 'Барлығы', 550, 452, { size: 18, w: 800 }); T(g, `${sum} ₸`, 820, 452, { a: 'right', size: 18, w: 800, c: sum === s.total ? P.green : P.red });
    a.read([['Қалды', `${s.total - sum} ₸`], 'p % = бөлік : бүтін · 100']);
  },
};
ENGINES.clock = {
  setup(a) { const s = a.s = { min: 7 * 60 + 30, drag: false }; s.target = 8 * 60 + 7;
    a.read(['Минут тілін тышқанмен айналдыр. Сағат тілі өзі жылжиды.', 'Сабақ 08:30 · жол 1,2 км · жылдамдық 4 км/сағ · қор 5 мин']); a.button('Осы уақытта шығамын', () => ENGINES.clock.check(a), 'btn-primary sm'); },
  check(a) { const s = a.s; if (s.min === s.target) a.done('t = 1,2 : 4 = 0,3 сағ = 18 мин; 08:30 − 18 − 5 = 08:07.'); else a.flash(s.min > s.target ? 'Кешігесің! Ертерек шық.' : 'Тым ерте — 08:07 жеткілікті.', false); },
  ang(x, y) { return (Math.atan2(x - 300, -(y - 300)) + Math.PI * 2) % (Math.PI * 2); },
  down(a, x, y) { if (Math.hypot(x - 300, y - 300) < 230) { a.s.drag = true; a.s.last = ENGINES.clock.ang(x, y); } },
  move(a, x, y, b) { const s = a.s; if (!b || !s.drag) return false; const an = ENGINES.clock.ang(x, y); let d = an - s.last; if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; s.acc = (s.acc || 0) + d / (Math.PI * 2) * 60; const st = Math.round(s.acc); if (st) { s.min = Math.max(6 * 60, Math.min(9 * 60 + 59, s.min + st)); s.acc -= st; } s.last = an; },
  up(a) { a.s.drag = false; },
  draw(a) {
    const { g, s } = a; bg(g, '#eef6ff', '#fbf8f1'); const cx = 300, cy = 300, R = 220;
    g.fillStyle = '#fff'; g.beginPath(); g.arc(cx, cy, R, 0, 7); g.fill(); g.strokeStyle = P.ink; g.lineWidth = 8; g.stroke();
    for (let i = 0; i < 60; i++) { const an = i / 60 * Math.PI * 2; const r0 = i % 5 ? R - 16 : R - 30; g.lineWidth = i % 5 ? 2 : 5; g.strokeStyle = P.ink; g.beginPath(); g.moveTo(cx + Math.sin(an) * r0, cy - Math.cos(an) * r0); g.lineTo(cx + Math.sin(an) * (R - 6), cy - Math.cos(an) * (R - 6)); g.stroke(); if (i % 5 === 0) T(g, String(i / 5 || 12), cx + Math.sin(an) * (R - 56), cy - Math.cos(an) * (R - 56) + 9, { a: 'center', size: 26, w: 800, f: 'D' }); }
    const h = s.min / 60, m = s.min % 60; const ha = (h % 12) / 12 * Math.PI * 2, ma = m / 60 * Math.PI * 2;
    g.lineCap = 'round'; g.strokeStyle = P.ink; g.lineWidth = 12; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.sin(ha) * 110, cy - Math.cos(ha) * 110); g.stroke();
    g.strokeStyle = P.gold; g.lineWidth = 7; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.sin(ma) * 180, cy - Math.cos(ma) * 180); g.stroke(); g.lineCap = 'butt';
    g.fillStyle = P.red; g.beginPath(); g.arc(cx, cy, 10, 0, 7); g.fill();
    const hh = String(Math.floor(s.min / 60)).padStart(2, '0'), mm = String(m).padStart(2, '0');
    RR(g, 590, 80, 330, 120, 18, P.ink); T(g, `${hh}:${mm}`, 755, 156, { a: 'center', size: 56, w: 800, f: 'D', c: '#fff' });
    // уақыт сызығы
    const X = (t) => 600 + (t - 7 * 60) / 120 * 310; line2(g, 600, 330, 910, 330);
    [[s.min, 'Шығу', P.gold], [s.min + 18, 'Мектеп', P.teal], [8 * 60 + 30, '08:30 сабақ', P.red]].forEach(([t, l, c], i) => { g.fillStyle = c; g.beginPath(); g.arc(X(t), 330, 8, 0, 7); g.fill(); T(g, l, X(t), 300 - (i % 2) * 26 + (i === 2 ? 70 : 0), { a: 'center', size: 13, w: 700, c }); });
    a.read([['Шығу уақыты', `${hh}:${mm}`], ['Мектепке жету', `${String(Math.floor((s.min + 18) / 60)).padStart(2, '0')}:${String((s.min + 18) % 60).padStart(2, '0')}`], 't = s : v']);
  },
};
function line2(g, x1, y1, x2, y2) { g.strokeStyle = P.line; g.lineWidth = 4; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); }
ENGINES.energy = {
  setup(a) { const s = a.s = { boxes: [], list: [['Шам × 4', 240, 12, 36, 5], ['Теледидар', 120, 10, 120, 4], ['Компьютер', 200, 8, 200, 3], ['Шәйнек', 2000, 1.5, 2000, .5], ['Тоңазытқыш', 150, 24, 150, 24]], on: [1, 1, 1, 1, 0] };
    s.target = 4000; a.read(['Құрылғыны бас: «ысырап» ↔ «үнемді» режим (LED шам, қажет кезде ғана қосу).', 'E = P · t,  құны = E · 25 ₸/кВт·сағ']); },
  bill(s) { let e = 0; s.list.forEach((d, i) => { const [, P1, t1, P2, t2] = d; e += (s.on[i] ? P1 * t1 : P2 * t2) * 30 / 1000; }); return e; },
  down(a, x, y) { for (const b of a.s.boxes) if (x > b.x && x < b.x + b.w && y > b.y && y < b.y + b.h) { a.s.on[b.i] = a.s.on[b.i] ? 0 : 1; } },
  draw(a) {
    const { g, s } = a; bg(g, '#fffbe8', '#fbf8f1'); s.boxes = []; const e = ENGINES.energy.bill(s), cost = e * 25;
    s.list.forEach((d, i) => { const [n, P1, t1, P2, t2] = d; const x = 40, y = 40 + i * 104; const w = s.on[i]; RR(g, x, y, 560, 92, 16, w ? '#fff1f0' : '#effaf3', w ? '#f3c4c6' : '#bfe3cc');
      g.fillStyle = w ? '#ffd23a' : '#9fdcb2'; g.beginPath(); g.arc(x + 46, y + 46, 26, 0, 7); g.fill(); if (w) { for (let k = 0; k < 8; k++) { const an = k / 8 * Math.PI * 2; line(g, x + 46 + Math.cos(an) * 32, y + 46 + Math.sin(an) * 32, x + 46 + Math.cos(an) * 42, y + 46 + Math.sin(an) * 42, '#f0b432', 3); } }
      T(g, n, x + 90, y + 38, { size: 19, w: 800 }); T(g, w ? `Ысырап: ${P1} Вт × ${t1} сағ/тәулік` : `Үнемді: ${P2} Вт × ${t2} сағ/тәулік`, x + 90, y + 66, { size: 15, c: w ? P.red : P.green, w: 600 });
      T(g, `${nf((w ? P1 * t1 : P2 * t2) * 30 / 1000, 1)} кВт·сағ`, x + 540, y + 52, { a: 'right', size: 16, w: 800 }); s.boxes.push({ x, y, w: 560, h: 92, i }); });
    RR(g, 640, 60, 280, 300, 18, '#fff', P.line); T(g, 'Айлық төлем', 660, 96, { size: 15, w: 800, c: P.mute }); T(g, `${nf(cost)} ₸`, 660, 150, { size: 40, w: 800, f: 'D', c: cost <= s.target ? P.green : P.red });
    T(g, `${nf(e, 1)} кВт·сағ / ай`, 660, 190, { size: 18, w: 700 }); T(g, `Мақсат: ≤ ${nf(s.target)} ₸`, 660, 230, { size: 15, c: P.ink2 }); T(g, 'E = P · t · 30', 660, 290, { size: 22, f: 'F', w: 600 });
    a.read([['Энергия', `${nf(e, 1)} кВт·сағ`], ['Төлем', `${nf(cost)} ₸`], '1 кВт·сағ = 1000 Вт · 1 сағ']);
    if (cost <= s.target && !a.finished) a.done(`Айлық төлем ${nf(cost)} ₸-ге түсті. Электр қуатын үнемдеу — табиғатқа және отбасы бюджетіне жауапкершілік.`);
  },
};
ENGINES.brake = {
  setup(a) { const s = a.s = { v: 60, run: false, x: 0, res: [] }; s.D = 25;
    a.slider('Жылдамдық v', 20, 70, 5, s.v, 'км/сағ', (x) => { s.v = x; s.run = false; s.x = 0; });
    a.button('Тежеу сынағы', () => ENGINES.brake.go(a), 'btn-primary sm');
    a.ask('Көлік жаяу өткелге (25 м) жетпей тоқтауы үшін ең үлкен жылдамдық қандай? (5-ке еселі, км/сағ)', 45, 0, 'км/сағ'); a.doneMsg = 's = v·t + v² : (2a). 45 км/сағ-та s ≈ 23,7 м < 25 м; 50 км/сағ-та s ≈ 27,7 м — қауіпті!'; },
  dist(v) { const u = v / 3.6; return u * 1 + u * u / 14; },
  go(a) { const s = a.s; s.run = true; s.x = 0; s.t = 0; const u0 = s.v / 3.6; s.u = u0;
    a.loop((dt) => { if (!s.run) return false; s.t += dt; if (s.t > 1) s.u = Math.max(0, s.u - 7 * dt); s.x += s.u * dt; if (s.u <= 0 && s.t > 1) { s.run = false; const d = ENGINES.brake.dist(s.v); s.res.push([s.v, d]); a.flash(d < s.D ? `${s.v} км/сағ: ${nf(d, 1)} м — үлгерді ✓` : `${s.v} км/сағ: ${nf(d, 1)} м — қауіпті!`, d < s.D); return false; } return true; }); },
  draw(a) {
    const { g, s } = a; bg(g, '#eaf4ff', '#eef0f3'); const k = 22, x0 = 60;
    g.fillStyle = '#3a3f4a'; g.fillRect(0, 300, W, 140); for (let i = 0; i < W; i += 60) { g.fillStyle = '#fff'; g.fillRect(i, 366, 34, 6); }
    const zx = x0 + s.D * k + 60; for (let i = 0; i < 6; i++) { g.fillStyle = '#fff'; g.fillRect(zx, 304 + i * 23, 70, 12); }
    mascotDot(g, zx + 35, 280, 16, a.ctx.color || '#3fb6ff');
    const cx = x0 + s.x * k; RR(g, cx, 330, 110, 46, 12, P.red); RR(g, cx + 20, 310, 60, 26, 8, '#ff8a8a'); for (const wx of [cx + 22, cx + 88]) { g.fillStyle = '#111'; g.beginPath(); g.arc(wx, 378, 13, 0, 7); g.fill(); }
    const d = ENGINES.brake.dist(s.v); g.setLineDash([8, 6]); g.strokeStyle = d < s.D ? P.green : P.red; g.lineWidth = 3; g.beginPath(); g.moveTo(x0 + 110, 460); g.lineTo(x0 + 110 + d * k, 460); g.stroke(); g.setLineDash([]); T(g, `тоқтау жолы ≈ ${nf(d, 1)} м`, x0 + 110 + d * k / 2, 490, { a: 'center', size: 16, w: 700, c: d < s.D ? P.green : P.red });
    T(g, 's = v · t реакция + v² : (2a)', 480, 80, { a: 'center', size: 26, f: 'F', w: 600 }); T(g, 't = 1 с,  a = 7 м/с²', 480, 116, { a: 'center', size: 16, c: P.ink2 });
    T(g, 'Сынақтар: ' + (s.res.map(r => `${r[0]}→${nf(r[1], 0)} м`).join('  ') || '—'), 40, 560, { size: 14, c: P.ink2 });
    a.read([['Жылдамдық', `${s.v} км/сағ = ${nf(s.v / 3.6, 1)} м/с`], ['Тоқтау жолы', `${nf(d, 1)} м`], ['Өткелге дейін', '25 м']]);
  },
};
const EVENTS = [[1961, 'Байқоңырдан Гагарин ұшты'], [1991, 'Қазақстанның Тәуелсіздігі'], [1995, 'Конституция қабылданды'], [1997, 'Астана — елорда'], [2003, 'Ясауи кесенесі ЮНЕСКО тізімінде']];
ENGINES.timeline = {
  setup(a) { const s = a.s = { cards: EVENTS.map((e, i) => ({ e, x: 90 + ((i * 3) % 5) * 170, y: 470, slot: -1 })), drag: null };
    a.read(['Карточкаларды сүйреп, уақыт сызығындағы орындарға реті бойынша қой.']); a.button('Ретін тексеру', () => ENGINES.timeline.check(a), 'btn-primary sm'); },
  slotX(i) { return 120 + i * 180; },
  check(a) { const s = a.s; const ok = s.cards.every(c => c.slot >= 0 && EVENTS[c.slot][0] === c.e[0]); if (ok && !s.q) { s.q = true; a.flash('Хронология дұрыс ✓'); a.ask('2026 жылы Тәуелсіздігімізге неше жыл толады?', 35, 0, 'жыл'); a.doneMsg = '2026 − 1991 = 35 жыл. Тарих — сандардағы Отан шежіресі.'; } else if (!ok) a.flash('Рет әлі дұрыс емес', false); },
  down(a, x, y) { const s = a.s; for (const c of [...s.cards].reverse()) if (Math.abs(x - c.x) < 80 && Math.abs(y - c.y) < 40) { s.drag = c; c.ox = x - c.x; c.oy = y - c.y; c.slot = -1; return; } },
  move(a, x, y, b) { const s = a.s; if (!b || !s.drag) return false; s.drag.x = x - s.drag.ox; s.drag.y = y - s.drag.oy; },
  up(a) { const s = a.s, c = s.drag; if (!c) return; s.drag = null; for (let i = 0; i < 5; i++) { const sx = ENGINES.timeline.slotX(i); if (Math.abs(c.x - sx) < 85 && Math.abs(c.y - 250) < 70 && !s.cards.some(o => o !== c && o.slot === i)) { c.x = sx; c.y = 250; c.slot = i; return; } } },
  draw(a) {
    const { g, s } = a; bg(g, '#fff6e8', '#fbf8f1');
    line(g, 60, 330, 900, 330, P.gold, 6); T(g, 'Уақыт сызығы →', 900, 360, { a: 'right', size: 14, c: P.mute, w: 700 });
    for (let i = 0; i < 5; i++) { const x = ENGINES.timeline.slotX(i); g.setLineDash([6, 5]); g.strokeStyle = P.line2 || '#d9d1bf'; g.lineWidth = 2; g.strokeRect(x - 80, 210, 160, 80); g.setLineDash([]); g.fillStyle = P.gold; g.beginPath(); g.arc(x, 330, 9, 0, 7); g.fill(); }
    for (const c of s.cards) { RR(g, c.x - 80, c.y - 40, 160, 80, 12, '#fff', c.slot >= 0 ? P.teal : P.gold, 3); T(g, String(c.e[0]), c.x, c.y - 14, { a: 'center', size: 20, w: 800, f: 'D' }); wrapT(g, c.e[1], c.x, c.y + 10, 140, 15); }
    a.read(['Кейінгі жыл − бұрынғы жыл = өткен жылдар', 'Мысалы: 1997 − 1991 = 6 жыл']);
  },
};
function wrapT(g, s, x, y, w, lh) { g.font = `600 12px ${FB}`; const words = s.split(' '); let l = '', yy = y; for (const wd of words) { const t = l ? l + ' ' + wd : wd; if (g.measureText(t).width > w && l) { T(g, l, x, yy, { a: 'center', size: 12, c: P.ink2 }); l = wd; yy += lh; } else l = t; } T(g, l, x, yy, { a: 'center', size: 12, c: P.ink2 }); }
function line(g, x1, y1, x2, y2, c, w = 3) { g.strokeStyle = c; g.lineWidth = w; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); }
