// Математикалық виртуалды зертхана: 1–11 сынып, қазақ мәдениеті негізіндегі интерактивті модульдер.
import { haversine } from './engine3d.js';

const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = (x, d = 2) => (Math.round(x * 10 ** d) / 10 ** d).toLocaleString('ru-RU', { maximumFractionDigits: d });
const rint = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const parseNum = (s) => { s = String(s).trim().replace(/\s/g, '').replace(',', '.'); if (/^-?\d+(\.\d+)?\/\d+(\.\d+)?$/.test(s)) { const [a, b] = s.split('/').map(Number); return a / b; } return s === '' ? NaN : Number(s); };
const C = { bg: '#fbf8f1', cyan: '#0f8b8d', gold: '#c8963e', text: '#0f1b3d', muted: '#7a849c', red: '#d93b41', green: '#22995a', felt: '#f5efe2' };

let ctx2 = null, onScore = () => {};
export function initLab(data, scoreCb) {
  onScore = scoreCb;
  const tabs = $('#labTabs');
  MODULES.forEach((m, i) => {
    const b = document.createElement('button'); b.type = 'button'; b.role = 'tab';
    b.innerHTML = `<span class="ln">${String(i + 1).padStart(2, '0')}</span><b>${esc(m.title)}</b><small>${esc(m.grade)} · ${esc(m.subject)}</small>`;
    b.addEventListener('click', () => open(i)); tabs.appendChild(b);
  });
  ctx2 = { data };
  open(0);
}
function open(i) {
  [...$('#labTabs').children].forEach((b, j) => { b.classList.toggle('on', i === j); b.setAttribute('aria-selected', String(i === j)); });
  const m = MODULES[i]; const st = $('#labStage');
  st.innerHTML = `<div class="card"><canvas class="lab-canvas" width="800" height="600"></canvas></div><div class="card lab-ctrl"><p class="eyebrow">${esc(m.grade)} · ${esc(m.subject)}</p><h3>${esc(m.title)}</h3><p>${esc(m.intro)}</p><div class="lab-controls"></div><div class="calc"></div><div class="lab-q"><b>Өзіңді тексер</b><p class="q-text"></p><form class="tm-row"><input inputmode="decimal" aria-label="Жауап" placeholder="Жауап"><button class="btn-primary sm" type="submit">Тексеру</button><button class="btn-soft sm" type="button" data-new>Жаңа есеп</button></form><div class="lab-fb"></div></div></div>`;
  const cv = $('canvas', st), g = cv.getContext('2d');
  const api = { cv, g, ctrl: $('.lab-controls', st), calc: $('.calc', st), qText: $('.q-text', st), fb: $('.lab-fb', st), input: $('.lab-q input', st), data: ctx2.data, answer: null, tol: 0 };
  api.slider = (id, label, min, max, step, val, unit = '') => {
    const w = document.createElement('label'); w.innerHTML = `<span>${esc(label)}: <span class="val"></span>${unit ? ' ' + esc(unit) : ''}</span><input type="range" min="${min}" max="${max}" step="${step}" value="${val}" id="lab_${id}">`;
    api.ctrl.appendChild(w); const inp = $('input', w), v = $('.val', w); const upd = () => { v.textContent = fmt(+inp.value, 3); }; upd();
    inp.addEventListener('input', () => { upd(); m.draw(api); }); return inp;
  };
  api.select = (id, label, opts, val) => {
    const w = document.createElement('label'); w.innerHTML = `<span>${esc(label)}</span><select id="lab_${id}">${opts.map(o => `<option value="${esc(o[0])}">${esc(o[1])}</option>`).join('')}</select>`;
    api.ctrl.appendChild(w); const s = $('select', w); if (val != null) s.value = val; s.addEventListener('change', () => m.draw(api)); return s;
  };
  api.buttons = (list) => { const d = document.createElement('div'); d.className = 'btn-row'; for (const [t, fn] of list) { const b = document.createElement('button'); b.type = 'button'; b.className = 'btn-soft sm'; b.textContent = t; b.addEventListener('click', () => { fn(); m.draw(api); }); d.appendChild(b); } api.ctrl.appendChild(d); };
  api.ask = (text, ans, tol = 0) => { api.qText.textContent = text; api.answer = ans; api.tol = tol; api.fb.textContent = ''; api.fb.className = 'lab-fb'; api.input.value = ''; api.tries = 0; };
  m.setup(api); m.draw(api); m.newQ(api);
  $('form', st).addEventListener('submit', (e) => {
    e.preventDefault(); const v = parseNum(api.input.value); if (Number.isNaN(v)) { api.fb.textContent = 'Санды енгіз (мысалы: 12, 3,5 немесе 3/8).'; return; }
    api.tries++;
    if (Math.abs(v - api.answer) <= api.tol + 1e-9) { api.fb.textContent = `Дұрыс! ${api.tries === 1 ? '+5 ұпай' : '+2 ұпай'} 🎉`; api.fb.className = 'lab-fb ok'; onScore(api.tries === 1 ? 5 : 2, m.id); setTimeout(() => m.newQ(api), 1600); }
    else { api.fb.textContent = api.tries >= 3 ? `Дұрыс жауап: ${fmt(api.answer, 3)}. Келесі есепті шешіп көр!` : 'Әлі дұрыс емес. Сызбаға қарап, тағы есепте.'; api.fb.className = 'lab-fb bad'; }
  });
  $('[data-new]', st).addEventListener('click', () => m.newQ(api));
}

// ---------- сурет көмекшілері ----------
function clear(g) { g.clearRect(0, 0, 800, 600); }
function text(g, s, x, y, o = {}) { g.font = `${o.w || 600} ${o.size || 22}px ${o.mono ? 'Montserrat, Inter, sans-serif' : 'Inter, sans-serif'}`; g.fillStyle = o.color || C.text; g.textAlign = o.align || 'left'; g.textBaseline = o.base || 'alphabetic'; g.fillText(s, x, y); }
function asyk(g, x, y, s, color = '#f2e3c4', rot = 0) {
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
  g.beginPath(); g.moveTo(-20, -12); g.bezierCurveTo(-8, -6, 8, -6, 20, -12); g.bezierCurveTo(30, -6, 30, 6, 20, 12); g.bezierCurveTo(8, 6, -8, 6, -20, 12); g.bezierCurveTo(-30, 6, -30, -6, -20, -12); g.closePath();
  const gr = g.createLinearGradient(0, -14, 0, 14); gr.addColorStop(0, '#fff'); gr.addColorStop(1, color); g.fillStyle = gr; g.fill(); g.strokeStyle = '#8a6a3a'; g.lineWidth = 1.5; g.stroke();
  g.beginPath(); g.ellipse(0, 0, 5, 3, 0, 0, 7); g.fillStyle = 'rgba(120,80,30,.35)'; g.fill(); g.restore();
}
function axes(g, x0, y0, w, h, xmax, ymax, xl, yl, nx = 5, ny = 5) {
  g.strokeStyle = 'rgba(15,27,61,.10)'; g.lineWidth = 1;
  for (let i = 0; i <= nx; i++) { const x = x0 + w * i / nx; g.beginPath(); g.moveTo(x, y0); g.lineTo(x, y0 - h); g.stroke(); text(g, fmt(xmax * i / nx, 1), x, y0 + 22, { size: 14, align: 'center', color: C.muted, mono: true }); }
  for (let i = 0; i <= ny; i++) { const y = y0 - h * i / ny; g.beginPath(); g.moveTo(x0, y); g.lineTo(x0 + w, y); g.stroke(); text(g, fmt(ymax * i / ny, 0), x0 - 8, y + 5, { size: 14, align: 'right', color: C.muted, mono: true }); }
  text(g, xl, x0 + w, y0 + 44, { size: 15, align: 'right', color: C.gold }); text(g, yl, x0, y0 - h - 14, { size: 15, color: C.gold });
}

// ---------- модульдер ----------
const MODULES = [
  { id: 'asyk', grade: '1–2 сынып', subject: 'Қосу және азайту', title: 'Асық санау',
    intro: 'Асық — қазақтың ұлттық ойыны. Асықтарды санап, қосу мен азайтуды үйрен!',
    setup(a) { a.s = { x: 4, y: 3, op: '+' }; },
    draw(a) {
      const { g } = a, { x, y, op } = a.s; clear(g);
      text(g, op === '+' ? 'Бірінші топ' : 'Барлық асық', 200, 60, { align: 'center', color: C.gold, size: 24 });
      text(g, op === '+' ? 'Екінші топ' : 'Ұтылған асықтар', 600, 60, { align: 'center', color: C.gold, size: 24 });
      for (let i = 0; i < x; i++) asyk(g, 120 + (i % 3) * 80, 130 + Math.floor(i / 3) * 70, 1.25, i === 0 ? '#e24a3b' : '#f2e3c4', (i * .7) % 1 - .5);
      for (let i = 0; i < y; i++) asyk(g, 520 + (i % 3) * 80, 130 + Math.floor(i / 3) * 70, 1.25, op === '−' ? '#7a8aa0' : '#f2e3c4', (i * .9) % 1 - .5);
      text(g, op, 400, 230, { size: 80, align: 'center', color: C.cyan, w: 800 });
      text(g, `${x} ${op} ${y} = ?`, 400, 520, { size: 56, align: 'center', w: 800, mono: true });
      a.calc.textContent = op === '+' ? `${x} асық + ${y} асық = ? асық\nҚосу: топтарды біріктіреміз.` : `${x} асық − ${y} асық = ? асық\nАзайту: ұтылған асықтарды аламыз.`;
    },
    newQ(a) { const op = Math.random() < .5 ? '+' : '−'; let x = rint(2, 9), y = rint(1, 8); if (op === '−' && y > x) [x, y] = [y, x]; a.s = { x, y, op }; this.draw(a); a.ask(op === '+' ? `Сенде ${x} асық бар еді, досың ${y} асық сыйлады. Барлығы неше асық?` : `Сенде ${x} асық бар еді, ойында ${y} асық ұтылдың. Неше асық қалды?`, op === '+' ? x + y : x - y); },
  },
  { id: 'pie', grade: '3–5 сынып', subject: 'Жай бөлшектер', title: 'Бәліш бөлу',
    intro: 'Апа бәлішті тең бөліктерге бөлді. Бөлшектің алымы мен бөлімін бәліш арқылы көр.',
    setup(a) { a.n = a.slider('n', 'Бөлік саны (бөлім)', 2, 12, 1, 8); a.k = a.slider('k', 'Алынған бөлік (алым)', 0, 12, 1, 3); },
    draw(a) {
      const { g } = a; const n = +a.n.value; let k = +a.k.value; if (k > n) { k = n; a.k.value = n; } clear(g);
      const cx = 300, cy = 300, R = 220;
      for (let i = 0; i < n; i++) {
        const a0 = -Math.PI / 2 + i / n * Math.PI * 2, a1 = a0 + Math.PI * 2 / n;
        g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, R, a0, a1); g.closePath();
        const gr = g.createRadialGradient(cx, cy, 20, cx, cy, R); gr.addColorStop(0, i < k ? '#ffe39a' : '#c98d3e'); gr.addColorStop(1, i < k ? '#f3b92c' : '#8a5a2b');
        g.fillStyle = gr; g.fill(); g.strokeStyle = '#3a2410'; g.lineWidth = 3; g.stroke();
        if (i < k) { const m = (a0 + a1) / 2; g.save(); g.translate(cx + Math.cos(m) * R * .6, cy + Math.sin(m) * R * .6); text(g, '✓', 0, 8, { align: 'center', size: 22, color: '#5a3000' }); g.restore(); }
      }
      text(g, String(k), 650, 230, { size: 90, align: 'center', w: 800, color: C.gold, mono: true });
      g.fillStyle = C.text; g.fillRect(590, 260, 120, 6);
      text(g, String(n), 650, 360, { size: 90, align: 'center', w: 800, mono: true });
      text(g, `= ${fmt(k / n, 3)} = ${fmt(k / n * 100, 1)}%`, 650, 440, { size: 26, align: 'center', color: C.cyan, mono: true });
      a.calc.textContent = `Алынды: ${k}/${n}\nҚалды: ${n - k}/${n}\nОндық бөлшек: ${fmt(k / n, 3)}\nПайыз: ${fmt(k / n * 100, 1)} %`;
    },
    newQ(a) { const n = [4, 6, 8, 10, 12][rint(0, 4)], k = rint(1, n - 1); a.ask(`Бәліш ${n} тең бөлікке бөлінді. Қонақтар ${k} бөлігін жеді. Бәліштің қандай бөлігі қалды? (бөлшекпен немесе ондықпен жаз, мысалы 3/8)`, (n - k) / n, .001); },
  },
  { id: 'scale', grade: '5–6 сынып', subject: 'Масштаб және қашықтық', title: 'Карта масштабы',
    intro: 'Екі нысанды таңда. Нақты қашықтық (км) мен картадағы қашықтықты (см) масштаб арқылы есептейміз.',
    setup(a) {
      const all = [...a.data.places.map(p => [p.id, p.name]), ...a.data.cities.map(c => [c.id, c.name])];
      a.p1 = a.select('p1', 'Бірінші нысан', all, 'astana'); a.p2 = a.select('p2', 'Екінші нысан', all, 'almaty');
      a.sc = a.slider('sc', 'Масштаб 1 : N (млн)', 1, 20, 1, 10, 'млн');
    },
    find(a, id) { return a.data.places.find(p => p.id === id) || a.data.cities.find(c => c.id === id); },
    draw(a) {
      const { g } = a; clear(g); const P = this.find(a, a.p1.value), Q = this.find(a, a.p2.value); const N = +a.sc.value * 1e6;
      const tx = (lon) => 40 + (lon - 46) / 42 * 720, ty = (lat) => 520 - (lat - 40.3) / 15.4 * 440;
      g.beginPath(); a.data.border.forEach(([lo, la], i) => i ? g.lineTo(tx(lo), ty(la)) : g.moveTo(tx(lo), ty(la))); g.closePath();
      g.fillStyle = 'rgba(95,227,255,.08)'; g.fill(); g.strokeStyle = C.gold; g.lineWidth = 3; g.stroke();
      const km = haversine(P.lon, P.lat, Q.lon, Q.lat), cm = km * 1e5 / N;
      g.setLineDash([10, 8]); g.strokeStyle = C.cyan; g.lineWidth = 3; g.beginPath(); g.moveTo(tx(P.lon), ty(P.lat)); g.lineTo(tx(Q.lon), ty(Q.lat)); g.stroke(); g.setLineDash([]);
      for (const p of [P, Q]) { g.beginPath(); g.arc(tx(p.lon), ty(p.lat), 8, 0, 7); g.fillStyle = C.gold; g.fill(); text(g, p.name.split(' ·')[0], tx(p.lon) + 12, ty(p.lat) - 10, { size: 18 }); }
      text(g, `≈ ${fmt(km, 0)} км`, (tx(P.lon) + tx(Q.lon)) / 2, (ty(P.lat) + ty(Q.lat)) / 2 - 14, { size: 24, align: 'center', color: C.cyan, w: 700 });
      g.fillStyle = C.text; g.fillRect(40, 560, 200, 6); text(g, `1 см = ${fmt(N / 1e5, 0)} км`, 250, 570, { size: 18, color: C.muted });
      a.calc.textContent = `Нақты қашықтық (түзу сызық): s ≈ ${fmt(km, 0)} км\nМасштаб 1 : ${N.toLocaleString('ru-RU')}\n1 см картада = ${fmt(N / 1e5, 0)} км жерде\nКартадағы қашықтық = ${fmt(km, 0)} : ${fmt(N / 1e5, 0)} ≈ ${fmt(cm, 1)} см`;
    },
    newQ(a) { const km = rint(2, 15) * 100, N = [5, 10, 20][rint(0, 2)]; a.ask(`Екі қаланың арасы ${km} км. Масштабы 1 : ${N} 000 000 картада бұл неше сантиметр?`, km / (N * 10), .05); },
  },
  { id: 'arkan', grade: '5–7 сынып', subject: 'Теңдеу және күш', title: 'Арқан тартыс',
    intro: 'Екі команда арқан тартады. Тең әсерлі күш R = F₁ − F₂. Тепе-теңдік үшін теңдеу құрамыз.',
    setup(a) { a.n1 = a.slider('n1', 'Көк команда: адам саны', 1, 8, 1, 5); a.f1 = a.slider('f1', 'Көк: бір адамның күші', 50, 300, 10, 150, 'Н'); a.n2 = a.slider('n2', 'Алтын команда: адам саны', 1, 8, 1, 4); a.f2 = a.slider('f2', 'Алтын: бір адамның күші', 50, 300, 10, 180, 'Н'); },
    draw(a) {
      const { g } = a; clear(g); const F1 = a.n1.value * a.f1.value, F2 = a.n2.value * a.f2.value, R = F1 - F2;
      const shift = Math.max(-160, Math.min(160, -R / 8));
      g.fillStyle = '#3f7f3a'; g.fillRect(0, 380, 800, 220); g.fillStyle = '#fff'; g.fillRect(398, 360, 4, 60);
      g.strokeStyle = '#c9a26a'; g.lineWidth = 8; g.beginPath(); g.moveTo(60 + shift, 320); g.lineTo(740 + shift, 320); g.stroke();
      g.fillStyle = C.red; g.fillRect(392 + shift, 300, 16, 40);
      const person = (x, col, dir) => { g.fillStyle = col; g.beginPath(); g.arc(x, 250, 16, 0, 7); g.fill(); g.fillRect(x - 12, 268, 24, 50); g.strokeStyle = col; g.lineWidth = 8; g.beginPath(); g.moveTo(x, 285); g.lineTo(x + dir * 26, 320); g.stroke(); g.beginPath(); g.moveTo(x - 6, 318); g.lineTo(x - dir * 18, 375); g.moveTo(x + 6, 318); g.lineTo(x - dir * 6, 375); g.stroke(); };
      for (let i = 0; i < a.n1.value; i++) person(330 - i * 40 + shift, '#2aa8ff', 1);
      for (let i = 0; i < a.n2.value; i++) person(470 + i * 40 + shift, C.gold, -1);
      text(g, `F₁ = ${F1} Н`, 140, 120, { size: 30, color: '#7fd0ff', w: 800, align: 'center', mono: true });
      text(g, `F₂ = ${F2} Н`, 660, 120, { size: 30, color: C.gold, w: 800, align: 'center', mono: true });
      text(g, R === 0 ? 'Тепе-теңдік! R = 0' : `R = ${Math.abs(R)} Н → ${R > 0 ? 'көк' : 'алтын'} команда жеңеді`, 400, 60, { size: 26, align: 'center', w: 700, color: R === 0 ? C.green : C.text });
      a.calc.textContent = `F₁ = ${a.n1.value} · ${a.f1.value} = ${F1} Н\nF₂ = ${a.n2.value} · ${a.f2.value} = ${F2} Н\nR = F₁ − F₂ = ${R} Н\nТепе-теңдік теңдеуі: ${a.n1.value}·x = ${F2}  ⇒  x = ${fmt(F2 / a.n1.value, 1)} Н`;
    },
    newQ(a) { const n2 = rint(3, 6), f2 = rint(10, 20) * 10, n1 = rint(3, 6); const tot = n2 * f2; a.ask(`Алтын командада ${n2} адам, әрқайсысы ${f2} Н күшпен тартады. Көк командада ${n1} адам. Тепе-теңдік болу үшін көк команданың әр мүшесі қанша Н күш салуы керек? (${n1}x = ${tot})`, tot / n1, .05); },
  },
  { id: 'yurt', grade: '6–8 сынып', subject: 'Шеңбер, конус, көлем', title: 'Киіз үй геометриясы',
    intro: 'Кереге — шеңбер, уықтар — радиустар, шаңырақ — дөңгелек. Киіз үйдің ауданы мен көлемін есептейміз.',
    setup(a) { a.r = a.slider('r', 'Кереге радиусы r', 2, 5, .1, 3, 'м'); a.h = a.slider('h', 'Кереге биіктігі h', 1.2, 2, .1, 1.5, 'м'); a.H = a.slider('H', 'Күмбез биіктігі H', 1, 2.5, .1, 1.5, 'м'); a.u = a.slider('u', 'Уық саны n', 30, 120, 6, 60); },
    draw(a) {
      const { g } = a; clear(g); const r = +a.r.value, h = +a.h.value, H = +a.H.value, n = +a.u.value;
      const cx = 220, cy = 300, R = 150, sr = R * .18;
      g.beginPath(); g.arc(cx, cy, R, 0, 7); g.fillStyle = '#f5efe2'; g.fill(); g.lineWidth = 6; g.strokeStyle = '#b3241e'; g.stroke();
      g.strokeStyle = '#8a5a2b'; g.lineWidth = 1.5; for (let i = 0; i < n; i++) { const t = i / n * Math.PI * 2; g.beginPath(); g.moveTo(cx + Math.cos(t) * sr, cy + Math.sin(t) * sr); g.lineTo(cx + Math.cos(t) * R, cy + Math.sin(t) * R); g.stroke(); }
      g.beginPath(); g.arc(cx, cy, sr, 0, 7); g.fillStyle = '#6b4423'; g.fill(); g.strokeStyle = C.gold; g.lineWidth = 3; g.stroke();
      g.strokeStyle = C.cyan; g.lineWidth = 3; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + R, cy); g.stroke(); text(g, `r = ${fmt(r, 1)} м`, cx + R / 2, cy - 10, { size: 18, align: 'center', color: C.cyan });
      text(g, 'Үстінен қарағанда', cx, 110, { align: 'center', color: C.gold });
      // бүйірінен
      const bx = 560, by = 470, s = 42; const W = r * s;
      g.fillStyle = '#f5efe2'; g.fillRect(bx - W, by - h * s, W * 2, h * s);
      g.fillStyle = '#b3241e'; g.fillRect(bx - W, by - h * s, W * 2, 8);
      g.beginPath(); g.moveTo(bx - W, by - h * s); g.quadraticCurveTo(bx - W * .5, by - h * s - H * s * 1.05, bx - sr * .5, by - (h + H) * s); g.lineTo(bx + sr * .5, by - (h + H) * s); g.quadraticCurveTo(bx + W * .5, by - h * s - H * s * 1.05, bx + W, by - h * s); g.closePath(); g.fillStyle = '#ebe3d2'; g.fill(); g.strokeStyle = '#8a6a3a'; g.lineWidth = 2; g.stroke();
      g.fillStyle = '#d4572a'; g.fillRect(bx - 18, by - 1.2 * s, 36, 1.2 * s);
      text(g, 'Бүйірінен', bx, 110, { align: 'center', color: C.gold });
      text(g, `h = ${fmt(h, 1)}`, bx + W + 10, by - h * s / 2, { size: 16, color: C.cyan }); text(g, `H = ${fmt(H, 1)}`, bx + W * .4 + 20, by - h * s - H * s * .6, { size: 16, color: C.cyan });
      const S = Math.PI * r * r, Cc = 2 * Math.PI * r, V = S * h + S * H / 3;
      a.calc.textContent = `Еден ауданы: S = πr² = 3,14 · ${fmt(r, 1)}² ≈ ${fmt(S, 2)} м²\nКереге ұзындығы: C = 2πr ≈ ${fmt(Cc, 2)} м\nКөлем ≈ πr²h + ⅓πr²H ≈ ${fmt(V, 2)} м³\nУықтар арасындағы бұрыш: 360° : ${n} = ${fmt(360 / n, 2)}°`;
    },
    newQ(a) { const t = rint(0, 2); if (t === 0) { const r = rint(2, 4); a.ask(`Киіз үй керегесінің радиусы ${r} м. Еден ауданын тап (π ≈ 3,14).`, 3.14 * r * r, .02); } else if (t === 1) { const n = [36, 45, 60, 72, 90][rint(0, 4)]; a.ask(`Киіз үйде ${n} уық бар. Көрші уықтар арасындағы бұрыш неше градус?`, 360 / n, .01); } else { const d = rint(5, 8); a.ask(`Керегенің диаметрі ${d} м. Керегенің ұзындығын тап (C = πd, π ≈ 3,14).`, 3.14 * d, .02); } },
  },
  { id: 'pyth', grade: '8 сынып', subject: 'Пифагор теоремасы', title: 'Бәйтерек көлеңкесі',
    intro: 'Күн биіктеген сайын көлеңке қысқарады. Мұнара, көлеңке және сәуле тік бұрышты үшбұрыш құрайды: a² + b² = c².',
    setup(a) { a.al = a.slider('al', 'Күннің биіктік бұрышы α', 15, 75, 1, 53, '°'); },
    draw(a) {
      const { g } = a; clear(g); const al = +a.al.value * Math.PI / 180, H = 97, b = H / Math.tan(al), c = Math.hypot(H, b);
      const s = Math.min(3.4, 560 / (b + 20)); const x0 = 140, y0 = 500;
      g.fillStyle = '#3f7f3a'; g.fillRect(0, y0, 800, 100);
      g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(x0, y0 - 6, b * s, 12);
      g.fillStyle = '#fff'; g.strokeStyle = '#9aa6bd'; g.lineWidth = 1.5; g.fillRect(x0 - 6, y0 - H * s * .85, 12, H * s * .85); g.strokeRect(x0 - 6, y0 - H * s * .85, 12, H * s * .85);
      g.beginPath(); g.arc(x0, y0 - H * s * .92, 14, 0, 7); g.fillStyle = C.gold; g.fill();
      g.strokeStyle = C.gold; g.lineWidth = 3; g.setLineDash([8, 6]); g.beginPath(); g.moveTo(x0, y0 - H * s); g.lineTo(x0 + b * s, y0); g.stroke(); g.setLineDash([]);
      g.strokeStyle = C.cyan; g.strokeRect(x0, y0 - 22, 22, 22);
      g.beginPath(); g.arc(x0 + b * s, y0, 46, Math.PI, Math.PI + al, false); g.strokeStyle = C.red; g.stroke(); text(g, `α = ${a.al.value}°`, x0 + b * s - 110, y0 - 20, { size: 18, color: C.red });
      text(g, 'a = 97 м', x0 - 20, y0 - H * s / 2, { align: 'right', color: C.cyan, size: 20 });
      text(g, `b ≈ ${fmt(b, 1)} м`, x0 + b * s / 2, y0 + 36, { align: 'center', color: C.cyan, size: 20 });
      text(g, `c ≈ ${fmt(c, 1)} м`, x0 + b * s / 2 + 20, y0 - H * s / 2 - 10, { color: C.gold, size: 20 });
      const sunx = Math.min(760, x0 + b * s + Math.cos(al) * 200), suny = y0 - Math.sin(al) * 200 - 100; g.beginPath(); g.arc(sunx, Math.max(40, suny), 26, 0, 7); g.fillStyle = '#ffd84a'; g.fill();
      a.calc.textContent = `b = a : tg α = 97 : tg ${a.al.value}° ≈ ${fmt(b, 1)} м\nc = √(a² + b²) = √(${97 * 97} + ${fmt(b * b, 1)}) ≈ ${fmt(c, 1)} м\nТексеру: a² + b² = ${fmt(97 * 97 + b * b, 1)} ≈ c² = ${fmt(c * c, 1)}`;
    },
    newQ(a) { const tr = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [20, 21, 29]][rint(0, 4)], k = rint(2, 5); a.ask(`Мұнараның биіктігі ${tr[0] * k} м, көлеңкесі ${tr[1] * k} м. Мұнара ұшынан көлеңке ұшына дейінгі қашықтықты тап.`, tr[2] * k); },
  },
  { id: 'motion', grade: '7–9 сынып', subject: 'Сызықтық функция', title: 'Ат пен бүркіт: қозғалыс графигі',
    intro: 'Ат Астанадан шығады. Бүркіт кейінірек ұшып, атты қуып жетеді. s = v · t графиктері қай жерде қиылысады?',
    setup(a) { a.v1 = a.slider('v1', 'Аттың жылдамдығы v₁', 20, 60, 2, 40, 'км/сағ'); a.v2 = a.slider('v2', 'Бүркіттің жылдамдығы v₂', 50, 160, 5, 100, 'км/сағ'); a.t0 = a.slider('t0', 'Бүркіт кешігіп ұшты t₀', 0, 4, .5, 2, 'сағ'); },
    draw(a) {
      const { g } = a; clear(g); const v1 = +a.v1.value, v2 = +a.v2.value, t0 = +a.t0.value; const T = 8, Smax = 400;
      const x0 = 90, y0 = 520, w = 660, h = 440; axes(g, x0, y0, w, h, T, Smax, 't, сағ', 's, км', 8, 4);
      const X = t => x0 + t / T * w, Y = s => y0 - Math.min(s, Smax) / Smax * h;
      g.lineWidth = 4; g.strokeStyle = '#c98d3e'; g.beginPath(); g.moveTo(X(0), Y(0)); g.lineTo(X(Math.min(T, Smax / v1)), Y(v1 * Math.min(T, Smax / v1))); g.stroke();
      g.strokeStyle = C.cyan; g.beginPath(); g.moveTo(X(t0), Y(0)); const te = Math.min(T, t0 + Smax / v2); g.lineTo(X(te), Y(v2 * (te - t0))); g.stroke();
      text(g, '🐎 s = v₁t', X(T) - 140, Y(v1 * T) + 30, { color: '#e0a960', size: 18 }); text(g, '🦅 s = v₂(t − t₀)', X(te) - 170, Y(v2 * (te - t0)) - 10, { color: C.cyan, size: 18 });
      let msg = 'Бүркіт атты қуып жете алмайды (v₂ ≤ v₁).';
      if (v2 > v1) { const tm = v2 * t0 / (v2 - v1), sm = v1 * tm; if (tm <= T && sm <= Smax) { g.beginPath(); g.arc(X(tm), Y(sm), 9, 0, 7); g.fillStyle = C.gold; g.fill(); text(g, `кездесу: t ≈ ${fmt(tm, 2)} сағ, s ≈ ${fmt(sm, 0)} км`, X(tm) + 12, Y(sm) + 30, { size: 17, color: C.gold }); } msg = `v₁t = v₂(t − t₀)\n${v1}t = ${v2}(t − ${t0})\nt = v₂t₀ : (v₂ − v₁) = ${v2 * t0} : ${v2 - v1} ≈ ${fmt(tm, 2)} сағ\ns = v₁t ≈ ${fmt(sm, 1)} км`; }
      a.calc.textContent = msg;
    },
    newQ(a) { const v1 = rint(3, 5) * 10, v2 = v1 * 2, t0 = rint(1, 3); a.ask(`Ат ${v1} км/сағ жылдамдықпен шықты. ${t0} сағаттан кейін бүркіт ${v2} км/сағ жылдамдықпен ұшты. Ат шыққаннан неше сағаттан кейін бүркіт оны қуып жетеді?`, v2 * t0 / (v2 - v1), .01); },
  },
  { id: 'log', grade: '10–11 сынып', subject: 'Көрсеткіштік функция және логарифм', title: 'Астана халқының өсуі',
    intro: 'Халық саны P = P₀ · (1 + r)ᵗ заңымен өседі. Қанша жылда берілген санға жетеді? Жауабын логарифм береді: t = log(P / P₀) : log(1 + r).',
    setup(a) { a.r = a.slider('r', 'Жылдық өсу r', 1, 10, .5, 6.5, '%'); a.P = a.slider('P', 'Мақсат P', 500, 3000, 100, 1400, 'мың адам'); },
    draw(a) {
      const { g } = a; clear(g); const r = a.r.value / 100, P0 = 281, P = +a.P.value, T = 40, Pm = 3000;
      const x0 = 100, y0 = 520, w = 650, h = 440; axes(g, x0, y0, w, h, T, Pm, 't, жыл (1999 жылдан)', 'P, мың адам', 8, 6);
      g.strokeStyle = C.cyan; g.lineWidth = 4; g.beginPath(); for (let t = 0; t <= T; t += .25) { const v = P0 * (1 + r) ** t; const x = x0 + t / T * w, y = y0 - Math.min(v, Pm) / Pm * h; t ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
      const t = Math.log(P / P0) / Math.log(1 + r);
      g.setLineDash([8, 6]); g.strokeStyle = C.gold; g.lineWidth = 2; const yy = y0 - P / Pm * h; g.beginPath(); g.moveTo(x0, yy); g.lineTo(x0 + Math.min(t, T) / T * w, yy); g.lineTo(x0 + Math.min(t, T) / T * w, y0); g.stroke(); g.setLineDash([]);
      if (t <= T) { g.beginPath(); g.arc(x0 + t / T * w, yy, 8, 0, 7); g.fillStyle = C.gold; g.fill(); }
      text(g, `≈ ${fmt(t, 1)} жыл → ${Math.round(1999 + t)} ж.`, x0 + Math.min(t, T) / T * w + 10, yy - 12, { size: 18, color: C.gold });
      a.calc.textContent = `P₀ = 281 мың (1999 ж., шамамен)\nP = P₀(1 + r)ᵗ ⇒ t = log(P/P₀) : log(1 + r)\nt = log(${P}/281) : log(${fmt(1 + r, 3)}) ≈ ${fmt(t, 2)} жыл\nЕкі есе өсу уақыты: log 2 : log(1 + r) ≈ ${fmt(Math.log(2) / Math.log(1 + r), 1)} жыл`;
    },
    newQ(a) { const t = rint(0, 1); if (t) { const n = rint(3, 10); a.ask(`log₂ ${2 ** n} неге тең?`, n); } else { const r = [5, 7, 10][rint(0, 2)]; a.ask(`Халық жыл сайын ${r}% өссе, неше жылда екі есе көбейеді? (t = log 2 : log(1 + r), ондықтың 1 таңбасына дейін)`, +(Math.log(2) / Math.log(1 + r / 100)).toFixed(1), .1); } },
  },
  { id: 'prob', grade: '9–11 сынып', subject: 'Ықтималдық және статистика', title: 'Асық ату: ықтималдық',
    intro: 'Асықтың 4 жағы бар: алшы, тәйкі, бүк, шік. Бірнеше рет лақтырып, жиілікті модельдік ықтималдықпен салыстыр. (Модельдік мәндер: бүк 0,36; шік 0,36; алшы 0,14; тәйкі 0,14)',
    setup(a) { a.cnt = [0, 0, 0, 0]; a.last = -1; const th = (n) => () => { for (let i = 0; i < n; i++) { const x = Math.random(); const k = x < .36 ? 0 : x < .72 ? 1 : x < .86 ? 2 : 3; a.cnt[k]++; a.last = k; } }; a.buttons([['1 рет ату', th(1)], ['10 рет', th(10)], ['100 рет', th(100)], ['1000 рет', th(1000)], ['Тазалау', () => { a.cnt = [0, 0, 0, 0]; a.last = -1; }]]); },
    draw(a) {
      const { g } = a; clear(g); const names = ['Бүк', 'Шік', 'Алшы', 'Тәйкі'], P = [.36, .36, .14, .14]; const N = a.cnt.reduce((s, v) => s + v, 0);
      const x0 = 90, y0 = 500, w = 650, h = 380; axes(g, x0, y0, w, h, 4, .5, '', 'жиілік', 4, 5);
      names.forEach((n, i) => { const x = x0 + (i + .5) * w / 4; const f = N ? a.cnt[i] / N : 0;
        g.fillStyle = i === a.last ? C.gold : '#2aa8ff'; g.fillRect(x - 50, y0 - f / .5 * h, 60, f / .5 * h);
        g.fillStyle = 'rgba(243,194,75,.35)'; g.fillRect(x + 14, y0 - P[i] / .5 * h, 30, P[i] / .5 * h);
        text(g, n, x, y0 + 50, { align: 'center', size: 20 }); text(g, N ? fmt(f, 3) : '—', x - 20, y0 - f / .5 * h - 10, { align: 'center', size: 16, color: C.cyan, mono: true }); });
      text(g, `Барлық лақтыру: N = ${N}`, 90, 70, { size: 22, color: C.gold }); text(g, '■ тәжірибе   ■ модель', 520, 70, { size: 16, color: C.muted });
      if (a.last >= 0) asyk(g, 700, 140, 1.4, a.last < 2 ? '#f2e3c4' : '#e24a3b');
      a.calc.textContent = `Салыстырмалы жиілік: w = m : N\n${names.map((n, i) => `${n}: ${a.cnt[i]} : ${N || 1} = ${fmt(N ? a.cnt[i] / N : 0, 3)}`).join('\n')}\nN үлкейген сайын жиілік ықтималдыққа жақындайды (үлкен сандар заңы).`;
    },
    newQ(a) { const t = rint(0, 2); if (t === 0) a.ask('Модель бойынша асық «алшы» немесе «тәйкі» болып түсуінің ықтималдығы қандай? (0,14 + 0,14)', .28, .001); else if (t === 1) a.ask('Асықты 200 рет атқанда «бүк» шамамен неше рет түседі? (P = 0,36)', 72, 1); else a.ask('Асық 50 рет атылды, «шік» 18 рет түсті. Салыстырмалы жиілігі қандай?', .36, .001); },
  },
  { id: 'ornament', grade: '5–9 сынып', subject: 'Информатика: алгоритм, симметрия', title: 'Ою-өрнек алгоритмі',
    intro: 'Қазақ ою-өрнегі — айналмалы симметрия. Бір элементті сызып, оны 360° : n бұрышқа n рет бұрып қайталаймыз — бұл цикл!',
    setup(a) { a.n = a.slider('n', 'Қайталау саны n', 3, 12, 1, 8); a.sz = a.slider('sz', 'Өлшемі', 60, 140, 5, 110); a.kind = a.select('kind', 'Элемент', [['horn', 'Қошқар мүйіз'], ['leaf', 'Жапырақ'], ['star', 'Жұлдыз сәуле']], 'horn'); },
    draw(a) {
      const { g } = a; clear(g); const n = +a.n.value, s = +a.sz.value, kind = a.kind.value; const cx = 400, cy = 300;
      g.save(); g.translate(cx, cy);
      for (let i = 0; i < n; i++) {
        g.save(); g.rotate(i * Math.PI * 2 / n); g.lineWidth = 6; g.lineCap = 'round'; g.strokeStyle = i % 2 ? C.gold : '#e24a3b'; g.fillStyle = i % 2 ? 'rgba(243,194,75,.25)' : 'rgba(226,74,59,.25)';
        g.beginPath();
        if (kind === 'horn') { g.moveTo(0, -20); g.lineTo(0, -s * .9); g.bezierCurveTo(0, -s * 1.5, -s * .6, -s * 1.5, -s * .5, -s * 1.05); g.bezierCurveTo(-s * .42, -s * .8, -s * .2, -s * .9, -s * .25, -s * 1.05); g.moveTo(0, -s * .9); g.bezierCurveTo(0, -s * 1.5, s * .6, -s * 1.5, s * .5, -s * 1.05); g.bezierCurveTo(s * .42, -s * .8, s * .2, -s * .9, s * .25, -s * 1.05); g.stroke(); }
        else if (kind === 'leaf') { g.moveTo(0, -20); g.quadraticCurveTo(s * .45, -s * .8, 0, -s * 1.5); g.quadraticCurveTo(-s * .45, -s * .8, 0, -20); g.fill(); g.stroke(); }
        else { g.moveTo(0, -20); g.lineTo(s * .18, -s * .7); g.lineTo(0, -s * 1.5); g.lineTo(-s * .18, -s * .7); g.closePath(); g.fill(); g.stroke(); }
        g.restore();
      }
      g.beginPath(); g.arc(0, 0, 22, 0, 7); g.fillStyle = C.cyan; g.fill(); g.restore();
      text(g, `Айналу бұрышы: 360° : ${n} = ${fmt(360 / n, 2)}°`, 400, 570, { align: 'center', size: 22, color: C.cyan, mono: true });
      a.calc.textContent = `алгоритм ОЮ(n):\n  бұрыш ← 360 / n      # ${fmt(360 / n, 2)}°\n  қайтала n рет:\n      элемент_сыз()\n      бұрыл(бұрыш)\nсоңы\nСимметрия осьтері саны: ${n}`;
    },
    newQ(a) { const t = rint(0, 1); if (t) { const n = [5, 6, 8, 9, 10, 12][rint(0, 5)]; a.ask(`Ою-өрнек ${n} бірдей элементтен тұрады. Цикл ішінде әр қадамда неше градусқа бұрыламыз?`, 360 / n, .01); } else { const ang = [30, 40, 45, 60, 72][rint(0, 4)]; a.ask(`Әр қадамда ${ang}°-қа бұрылсақ, толық айналым үшін цикл неше рет қайталанады?`, 360 / ang); } },
  },
];
