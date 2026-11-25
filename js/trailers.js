// QAZAQ MATH — әр порталдың «бейне-трейлері»: дауыспен сүйемелденетін анимациялық сабақ түсіндірмесі.
import { isMuted, hasAudio } from './voice.js';

const W = 960, H = 540;
const FD = 'Montserrat, Inter, sans-serif', FB = 'Inter, sans-serif', FF = '"Noto Serif", Georgia, serif';
const C = { bg1: '#0c1838', bg2: '#16306e', gold: '#f0b432', gold2: '#c8963e', teal: '#2fd0c8', sky: '#7cc8ff', red: '#ff6b6b', white: '#ffffff', mute: '#a8b4d4', green: '#5fd38a' };
const ease = (t) => t < 0 ? 0 : t > 1 ? 1 : t * t * (3 - 2 * t);
const seg = (p, a, b) => ease((p - a) / (b - a));
function T(g, s, x, y, o = {}) { g.font = `${o.w || 700} ${o.size || 28}px ${o.f === 'F' ? FF : o.f === 'B' ? FB : FD}`; g.fillStyle = o.c || C.white; g.textAlign = o.a || 'center'; g.textBaseline = 'middle'; g.globalAlpha = o.al ?? 1; g.fillText(s, x, y); g.globalAlpha = 1; }
function line(g, x1, y1, x2, y2, c = C.white, w = 3) { g.strokeStyle = c; g.lineWidth = w; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); }

// ---------- сценарийлер: [тақырып, анимация түрі, сөйлемдер] ----------
export const TRAILERS = {
  astana: ['Пифагор теоремасы', 'pyth', ['Бұл — Пифагор теоремасы, геометрияның ең әйгілі ережесі.', 'Тікбұрышты үшбұрыштың катеттеріне шаршылар саламыз: үш пен төрттің квадраттары — тоғыз бен он алты.', 'Олардың қосындысы жиырма бес — гипотенузадағы шаршыға дәл тең.', 'Бәйтеректің биіктігі тоқсан жеті метр, көлеңкесі жетпіс екі метр болса, ұшынан көлеңке ұшына дейін жүз жиырма бір метр.']],
  khanshatyr: ['Конустың көлемі', 'cone', ['Хан Шатыр — алып конус пішінді ғимарат.', 'Табаны мен биіктігі бірдей цилиндр мен конусты алайық.', 'Конустағы суды цилиндрге үш рет құйсақ, цилиндр толады.', 'Сондықтан конустың көлемі цилиндр көлемінің үштен біріне тең: V тең үштен бір пи эр квадрат аш.']],
  pyramid: ['Пирамиданың көлемі', 'pyr', ['Бейбітшілік және келісім сарайы — дұрыс төртбұрышты пирамида.', 'Оның биіктігі табан қабырғасына тең: алпыс екі метр.', 'Үш бірдей пирамида бір призманы толтырады.', 'Демек пирамиданың көлемі табан ауданы мен биіктіктің көбейтіндісінің үштен бірі.']],
  mosque: ['Айналу симметриясы', 'sym', ['Мешіттің ою-өрнегінде сегіз сәулелі жұлдыз бар.', 'Жұлдызды қырық бес градусқа бұрсақ, ол өзімен дәл беттеседі.', 'Үш жүз алпыс градусты сәуле санына бөлеміз: үш жүз алпыс бөлу сегіз — қырық бес.', 'Бұл — айналу симметриясы, қазақ ою-өрнегінің құпиясы.']],
  almaty: ['Биіктік пен температура', 'lin', ['Алматыдан Медеуге көтерілейік.', 'Әр жүз метр сайын ауа шамамен алты ондық градусқа салқындайды.', 'Биіктік өскен сайын температура бірқалыпты төмендейді — бұл сызықтық тәуелділік.', 'Графикте ол түзу сызық болып көрінеді.']],
  turkistan: ['Шеңбердің ұзындығы', 'circ', ['Ясауи кесенесінің күмбезі — шеңбер.', 'Дөңгелекті бір рет толық айналдырып, жолын өлшейік.', 'Жол диаметрден үш бүтін жүзден он төрт есе ұзын шықты — бұл пи саны.', 'Шеңбердің ұзындығы пи мен диаметрдің көбейтіндісіне тең.']],
  otyrar: ['Музыка мен қатынас', 'ratio', ['Әл-Фараби музыканы математикамен түсіндірген.', 'Домбыра ішегін дәл ортасынан бассақ, дыбыс бір октаваға жоғарылайды: қатынас екіге бір.', 'Ішектің үштен екісі квинта береді: үшке екі.', 'Үйлесімді әуен — дұрыс қатынастардың нәтижесі.']],
  shymkent: ['Иінтірек ережесі', 'lever', ['Механика ғалымы Өмірбек Жолдасбеков механизмдерді зерттеген.', 'Иінтіректің бір жағында ауыр жүк, екінші жағында жеңіл жүк тұр.', 'Жеңіл жүкті алысырақ қойсақ, тепе-теңдік орнайды.', 'Күш пен иіннің көбейтіндісі екі жақта тең болады.']],
  baikonur: ['Ғарыштық жылдамдық', 'rocket', ['Байқоңырдан зымыран ұшады.', 'Тарту күші ауырлық күшінен көп болғанда, зымыран үдей бастайды.', 'Орбитаға шығу үшін жылдамдық секундына жеті бүтін оннан тоғыз километрге жетуі керек.', 'Бұл сағатына жиырма сегіз мың төрт жүз қырық километр!']],
  caspian: ['Теріс сандар', 'neg', ['Мұхит деңгейін нөл деп алайық.', 'Каспий теңізінің беті одан жиырма сегіз метр төмен — минус жиырма сегіз.', 'Ең терең жері тағы мың жиырма бес метр төмен.', 'Теріс сандар биіктікті ғана емес, тереңдікті де өлшейді.']],
  bozzhyra: ['Тангенс', 'tan', ['Бозжыраның құзарына қарайық.', 'Бақылаушыдан құзарға дейінгі қашықтық пен құзардың биіктігі тікбұрышты үшбұрыш құрайды.', 'Қарсы катеттің іргелес катетке қатынасы — бұрыштың тангенсі.', 'Бұрышты өлшеп, биіктікті жартасқа шықпай-ақ табамыз.']],
  charyn: ['Еркін түсу', 'fall', ['Шарын шатқалынан тас құлап келеді.', 'Әр секунд сайын оның жылдамдығы он метр секундқа артады.', 'Бірінші секундта бес метр, екі секундта жиырма метр, үш секундта қырық бес метр.', 'Биіктік уақыттың квадратына пропорционал: аш тең же те квадрат бөлу екі.']],
  balkhash: ['Тіктөртбұрыш ауданы', 'area', ['Балқаш — ұзын әрі тар көл.', 'Оны шамамен тіктөртбұрыш деп алайық.', 'Аудан ұзындық пен еннің көбейтіндісіне тең.', 'Ауданды ұзындыққа бөлсек, көлдің орташа ені шығады: жиырма жеті километр.']],
  altai: ['Сызықтық функция', 'lin', ['Альпинист Мұзтау шыңына көтеріледі.', 'Әр мың метр сайын температура алты градусқа төмендейді.', 'Температураны биіктіктің функциясы ретінде жазамыз.', 'Оның графигі — төмен түсетін түзу.']],
  semey: ['Өлеңнің математикасы', 'syl', ['Абай өлеңдері — сөз өнерінің шыңы.', 'Жолдарды буынға бөлейік: ғы-лым тап-пай мақ-тан-ба.', 'Әр жолда дәл жеті буын бар.', 'Өлең ырғағы — сандардың тұрақты қайталануы.']],
  bayanaul: ['Шексіз прогрессия', 'series', ['Академик Жәутіков шексіз жүйелерді зерттеген.', 'Шаршының жартысын, сосын ширегін, сосын сегізден бірін бояйық.', 'Қанша бояса да, бөліктер ешқашан бір шаршыдан аспайды.', 'Бір қосу жарты қосу ширек және тағы басқалары — екіге тең.']],
  burabay: ['Тік лақтыру', 'throw', ['Батыр жебені тік жоғары атты.', 'Жебе көтерілген сайын баяулайды.', 'Ең биік нүктеде оның жылдамдығы нөлге тең.', 'Көтерілу биіктігі жылдамдықтың квадратын екі же-ге бөлгенге тең.']],
  ulytau: ['Шеңбер мен бұрыш', 'yurt', ['Киіз үйдің шаңырағы — шеңбер.', 'Оған алпыс уық бірдей бұрышпен бекітіледі.', 'Үш жүз алпыс градусты алпысқа бөлсек — алты градус.', 'Киіз үй — ата-бабамыздың геометрия кітабы.']],
};

// ---------- анимациялар: (g, p) — p: 0..1 ----------
const A = {};
A.pyth = (g, p) => {
  const x0 = 300, y0 = 330, a = 120, b = 160; const k = seg(p, .0, .1);
  g.fillStyle = 'rgba(255,255,255,.08)'; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x0 + b * k, y0); g.lineTo(x0, y0 - a * k); g.closePath(); g.fill(); g.strokeStyle = C.white; g.lineWidth = 3; g.stroke();
  const s1 = seg(p, .1, .22), s2 = seg(p, .2, .32), s3 = seg(p, .38, .52);
  g.fillStyle = `rgba(240,180,50,${.7 * s1})`; g.fillRect(x0 - a * s1, y0 - a, a * s1, a); T(g, '9', x0 - a / 2, y0 - a / 2, { al: s1, size: 40 });
  g.fillStyle = `rgba(47,208,200,${.7 * s2})`; g.fillRect(x0, y0, b, b * s2 * .6); T(g, '16', x0 + b / 2, y0 + 48, { al: s2, size: 40 });
  g.save(); g.translate(x0 + b, y0); g.rotate(-Math.atan2(a, b) - Math.PI / 2); g.fillStyle = `rgba(255,107,107,${.65 * s3})`; g.fillRect(0, 0, 200, 200 * s3 * .9); g.restore();
  T(g, 'a² + b² = c²', 740, 150, { f: 'F', size: 52, al: seg(p, .4, .5), c: C.gold });
  T(g, '9 + 16 = 25', 740, 220, { f: 'F', size: 36, al: seg(p, .45, .55) });
  T(g, '97² + 72² = 121²', 740, 320, { f: 'F', size: 34, al: seg(p, .66, .76), c: C.teal }); T(g, 'Бәйтерек: c = 121 м', 740, 370, { size: 22, al: seg(p, .7, .8), c: C.mute });
};
A.cone = (g, p) => {
  const cx = 330, by = 430, r = 110, h = 260;
  g.strokeStyle = C.white; g.lineWidth = 3; g.strokeRect(cx - r, by - h, 2 * r, h);
  const pour = Math.min(3, Math.floor(seg(p, .35, .9) * 3.999)); const lvl = seg(p, .35, .9) * h;
  g.fillStyle = 'rgba(124,200,255,.55)'; g.fillRect(cx - r, by - lvl, 2 * r, lvl);
  const ex = 680; g.beginPath(); g.moveTo(ex - r, by - h); g.lineTo(ex + r, by - h); g.lineTo(ex, by); g.closePath(); g.stroke();
  g.fillStyle = 'rgba(124,200,255,.55)'; const f = 1 - (seg(p, .35, .9) * 3 % 1); g.beginPath(); g.moveTo(ex - r * f, by - h * f); g.lineTo(ex + r * f, by - h * f); g.lineTo(ex, by); g.closePath(); g.fill();
  for (let i = 0; i < 3; i++) T(g, '●', 560 + i * 40, 110, { size: 30, c: i < pour ? C.gold : 'rgba(255,255,255,.2)' });
  T(g, 'V = ⅓ · π · r² · h', 480, 490, { f: 'F', size: 40, c: C.gold, al: seg(p, .75, .85) });
};
A.pyr = (g, p) => {
  const cx = 480, cy = 330, s = 150; const iso = (x, y, z) => [cx + (x - z) * .86, cy - y + (x + z) * .45];
  const P = (pts, fill, st) => { g.beginPath(); pts.forEach((q, i) => { const [x, y] = iso(...q); i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.closePath(); if (fill) { g.fillStyle = fill; g.fill(); } g.strokeStyle = st || C.white; g.lineWidth = 2; g.stroke(); };
  const box = [[0, 0, 0], [s, 0, 0], [s, 0, s], [0, 0, s]]; P(box, 'rgba(255,255,255,.05)'); P(box.map(q => [q[0], s, q[2]]), null, 'rgba(255,255,255,.35)');
  for (const [x, z] of [[0, 0], [s, 0], [s, s], [0, s]]) { const [a1, b1] = iso(x, 0, z), [a2, b2] = iso(x, s, z); line(g, a1, b1, a2, b2, 'rgba(255,255,255,.35)', 2); }
  const cols = ['rgba(240,180,50,.75)', 'rgba(47,208,200,.7)', 'rgba(255,107,107,.7)'];
  const apices = [[0, s, 0], [s, s, s], [s, s, 0]]; const n = Math.ceil(seg(p, .3, .85) * 3);
  for (let i = 0; i < n; i++) P([[0, 0, 0], [s, 0, 0], [s, 0, s], apices[i]], cols[i]);
  T(g, '3 пирамида = 1 призма', 480, 80, { size: 28, al: seg(p, .55, .7) }); T(g, 'V = ⅓ · a² · h', 480, 480, { f: 'F', size: 44, c: C.gold, al: seg(p, .75, .85) });
};
A.sym = (g, p) => {
  const cx = 360, cy = 280, steps = Math.floor(seg(p, .2, .85) * 8); const rot = steps * Math.PI / 4 + (seg(p, .2, .85) * 8 % 1) * Math.PI / 4;
  g.save(); g.translate(cx, cy); g.globalAlpha = .25; star8(g, 0); g.globalAlpha = 1; g.rotate(rot); star8(g, 1); g.restore();
  g.strokeStyle = C.gold; g.lineWidth = 4; g.beginPath(); g.arc(cx, cy, 190, -Math.PI / 2, -Math.PI / 2 + rot); g.stroke();
  T(g, `${Math.round(rot * 180 / Math.PI)}°`, cx, 60, { size: 34, c: C.gold });
  T(g, '360° : 8 = 45°', 720, 250, { f: 'F', size: 46, al: seg(p, .5, .65) }); T(g, '8 рет беттеседі', 720, 310, { size: 24, c: C.mute, al: seg(p, .55, .7) });
};
function star8(g, on) { g.beginPath(); for (let i = 0; i < 16; i++) { const r = i % 2 ? 70 : 160, a = i / 16 * Math.PI * 2; i ? g.lineTo(Math.cos(a) * r, Math.sin(a) * r) : g.moveTo(Math.cos(a) * r, Math.sin(a) * r); } g.closePath(); g.fillStyle = on ? '#2a6fd6' : '#ffffff'; g.fill(); g.strokeStyle = C.gold; g.lineWidth = 4; g.stroke(); g.beginPath(); g.arc(0, 0, 40, 0, 7); g.fillStyle = C.gold; g.fill(); }
A.lin = (g, p) => {
  g.fillStyle = '#3b5a4a'; g.beginPath(); g.moveTo(60, 470); g.lineTo(300, 120); g.lineTo(520, 470); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.moveTo(255, 185); g.lineTo(300, 120); g.lineTo(345, 185); g.fill();
  const k = seg(p, .15, .85); const mx = 70 + k * 225, my = 455 - k * 330; g.fillStyle = C.red; g.beginPath(); g.arc(mx, my, 12, 0, 7); g.fill();
  const t = 18 - k * 21; T(g, `${t.toFixed(1)} °C`, mx + 70, my, { size: 22, c: t > 0 ? C.red : C.sky });
  line(g, 600, 460, 900, 460, C.mute, 2); line(g, 600, 460, 600, 120, C.mute, 2); g.strokeStyle = C.teal; g.lineWidth = 4; g.beginPath(); g.moveTo(600, 160); g.lineTo(600 + k * 290, 160 + k * 280); g.stroke();
  T(g, 't = t₀ − k · h', 750, 90, { f: 'F', size: 34, c: C.gold, al: seg(p, .5, .65) }); T(g, 'h →', 890, 490, { size: 18, c: C.mute }); T(g, 't', 580, 120, { f: 'F', size: 22, c: C.mute });
};
A.circ = (g, p) => {
  const r = 80, y = 380, k = seg(p, .2, .8); const x0 = 150, cx = x0 + k * 2 * Math.PI * r;
  line(g, x0, y + r, x0 + 2 * Math.PI * r, y + r, 'rgba(255,255,255,.25)', 2); line(g, x0, y + r, cx, y + r, C.gold, 6);
  g.save(); g.translate(cx, y); g.rotate(k * 2 * Math.PI); g.strokeStyle = C.white; g.lineWidth = 4; g.beginPath(); g.arc(0, 0, r, 0, 7); g.stroke(); line(g, -r, 0, r, 0, C.teal, 3); g.fillStyle = C.red; g.beginPath(); g.arc(0, r, 7, 0, 7); g.fill(); g.restore();
  for (let i = 1; i <= 3; i++) if (k * Math.PI > i) { line(g, x0 + i * 2 * r, y + r + 14, x0 + i * 2 * r, y + r + 30, C.teal, 3); T(g, `${i}d`, x0 + i * 2 * r - r, y + r + 34, { size: 18, c: C.teal }); }
  T(g, 'C = π · d ≈ 3,14 · d', 480, 120, { f: 'F', size: 46, c: C.gold, al: seg(p, .75, .85) });
};
A.ratio = (g, p) => {
  const x0 = 160, x1 = 800, y = 270; const st = p < .45 ? 1 : p < .7 ? .5 : 2 / 3; const L = (x1 - x0) * st; const amp = 18 * Math.sin(p * 220);
  g.fillStyle = '#a8642c'; g.beginPath(); g.ellipse(x0 - 40, y, 70, 110, 0, 0, 7); g.fill(); g.fillStyle = '#6b3b1a'; g.fillRect(x0, y - 14, x1 - x0, 28);
  g.strokeStyle = C.white; g.lineWidth = 2; g.beginPath(); g.moveTo(x0, y); g.quadraticCurveTo(x0 + L / 2, y + amp, x0 + L, y); g.lineTo(x1, y); g.stroke();
  if (st < 1) { g.fillStyle = C.gold; g.beginPath(); g.arc(x0 + L, y, 10, 0, 7); g.fill(); }
  T(g, st === 1 ? 'l' : st === .5 ? 'l : 2 — октава (2 : 1)' : '⅔ l — квинта (3 : 2)', 480, 120, { f: 'F', size: 40, c: C.gold });
};
A.lever = (g, p) => {
  const cx = 480, y = 330; const k = seg(p, .3, .8); const d2 = 100 + k * 150; const tilt = (300 * 120 - 200 * d2) / 30000 * .3;
  g.fillStyle = C.gold2; g.beginPath(); g.moveTo(cx - 40, y + 120); g.lineTo(cx + 40, y + 120); g.lineTo(cx, y); g.fill();
  g.save(); g.translate(cx, y); g.rotate(-tilt); g.fillStyle = '#e0a526'; g.fillRect(-320, -8, 640, 16);
  g.fillStyle = C.red; g.fillRect(-120 - 35, -78, 70, 70); T(g, '300 Н', -120, -43, { size: 18 });
  g.fillStyle = C.teal; g.fillRect(d2 - 28, -64, 56, 56); T(g, '200 Н', d2, -36, { size: 16 }); g.restore();
  T(g, 'F₁ · l₁ = F₂ · l₂', 480, 100, { f: 'F', size: 46, c: C.gold, al: seg(p, .6, .75) }); T(g, '300 · 2 = 200 · 3', 480, 160, { f: 'F', size: 30, al: seg(p, .75, .85) });
};
A.rocket = (g, p) => {
  const k = seg(p, .15, .95); const sky = 1 - k; g.fillStyle = `rgba(80,140,220,${.4 * sky})`; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 60; i++) { g.fillStyle = `rgba(255,255,255,${k})`; g.fillRect((i * 137) % W, (i * 89 + k * 300) % H, 2, 2); }
  const ry = 420 - k * 300; g.fillStyle = '#fff'; g.fillRect(300, ry - 80, 40, 100); g.fillStyle = C.red; g.beginPath(); g.moveTo(300, ry - 80); g.lineTo(320, ry - 130); g.lineTo(340, ry - 80); g.fill();
  if (k > 0) { g.fillStyle = C.gold; g.beginPath(); g.moveTo(304, ry + 20); g.lineTo(320, ry + 70 + Math.random() * 30); g.lineTo(336, ry + 20); g.fill(); }
  const v = k * 7.9; g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(560, 140, 300, 24); g.fillStyle = C.teal; g.fillRect(560, 140, 300 * k, 24);
  T(g, `v = ${v.toFixed(1)} км/с`, 710, 110, { size: 34 }); T(g, '7,9 км/с · 3600 = 28 440 км/сағ', 710, 230, { f: 'F', size: 28, c: C.gold, al: seg(p, .75, .88) });
};
A.neg = (g, p) => {
  const x = 420; const k = seg(p, .1, .9); const sc = .26;
  g.fillStyle = 'rgba(124,200,255,.2)'; g.fillRect(0, 160, W, H);
  line(g, 80, 160, 880, 160, C.white, 3); T(g, '0 м — мұхит деңгейі', 230, 135, { size: 20 });
  const y28 = 160 + 28 * 2.2 * seg(p, .25, .4); line(g, 300, y28, 640, y28, C.gold, 4); T(g, '−28 м · Каспий беті', 780, y28, { size: 20, c: C.gold, al: seg(p, .25, .4) });
  const yd = y28 + 1025 * sc * seg(p, .5, .8); line(g, x, y28, x, yd, C.red, 4); T(g, '−1053 м', x + 90, yd, { f: 'F', size: 30, c: C.red, al: seg(p, .6, .8) });
  T(g, '−28 − 1025 = −1053', 480, 80, { f: 'F', size: 40, c: C.gold, al: seg(p, .75, .88) });
};
A.tan = (g, p) => {
  const x0 = 140, y0 = 440, d = 560 * seg(p, .1, .3), h = 260 * seg(p, .25, .45);
  g.fillStyle = '#f2ead9'; g.beginPath(); g.moveTo(x0 + d - 30, y0); g.lineTo(x0 + d, y0 - h); g.lineTo(x0 + d + 60, y0); g.fill();
  line(g, x0, y0, x0 + d, y0, C.white, 3); line(g, x0 + d, y0, x0 + d, y0 - h, C.teal, 4); line(g, x0, y0, x0 + d, y0 - h, C.gold, 3);
  const al = Math.atan2(h, Math.max(1, d)); g.strokeStyle = C.red; g.lineWidth = 4; g.beginPath(); g.arc(x0, y0, 70, -al, 0); g.stroke(); T(g, 'α', x0 + 95, y0 - 22, { f: 'F', size: 30, c: C.red });
  T(g, 'd = 300 м', x0 + d / 2, y0 + 30, { size: 22 }); T(g, 'h = 130 м', x0 + d + 110, y0 - h / 2, { size: 22, c: C.teal });
  T(g, 'tg α = h : d', 700, 100, { f: 'F', size: 44, c: C.gold, al: seg(p, .6, .75) });
};
A.fall = (g, p) => {
  const k = seg(p, .15, .85); const t = k * 3; const y0 = 80, sc = 360 / 45;
  g.fillStyle = '#b4482a'; g.fillRect(100, y0, 160, 440);
  for (let i = 0; i <= Math.floor(t * 2); i++) { const tt = i / 2; g.fillStyle = 'rgba(47,208,200,.35)'; g.beginPath(); g.arc(320, y0 + 5 * tt * tt * sc, 14, 0, 7); g.fill(); T(g, `${tt} с · ${5 * tt * tt} м`, 440, y0 + 5 * tt * tt * sc, { size: 16, c: C.mute, a: 'left' }); }
  g.fillStyle = '#8a6a4a'; g.beginPath(); g.arc(320, y0 + 5 * t * t * sc, 16, 0, 7); g.fill();
  T(g, 'h = g · t² : 2', 740, 140, { f: 'F', size: 44, c: C.gold, al: seg(p, .6, .75) });
};
A.area = (g, p) => {
  const k = seg(p, .3, .7); g.fillStyle = 'rgba(47,160,200,.7)'; g.beginPath();
  const pts = [[100, 300], [250, 230], [480, 250], [700, 220], [860, 270], [830, 330], [600, 330], [360, 320], [150, 350]];
  const rect = [[100, 250], [480, 250], [480, 250], [860, 250], [860, 250], [860, 320], [480, 320], [480, 320], [100, 320]];
  pts.forEach((q, i) => { const x = q[0] + (rect[i][0] - q[0]) * k, y = q[1] + (rect[i][1] - q[1]) * k; i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.closePath(); g.fill();
  T(g, 'a ≈ 605 км', 480, 380, { size: 26, al: k }); T(g, 'b ≈ 27 км', 920, 285, { size: 20, al: k, a: 'right' });
  T(g, 'S = a · b   →   b = S : a', 480, 130, { f: 'F', size: 42, c: C.gold, al: seg(p, .7, .82) });
};
A.syl = (g, p) => {
  const lines = [['Ғы', 'лым', 'тап', 'пай', 'мақ', 'тан', 'ба']]; const k = seg(p, .2, .8); const n = Math.floor(k * 7.99);
  let x = 160; lines[0].forEach((s, i) => { const on = i < n; g.fillStyle = on ? ['#2fd0c8', '#f0b432', '#7c5cff', '#ff6b6b'][i % 4] : 'rgba(255,255,255,.1)'; g.beginPath(); g.roundRect(x, 220, 82, 70, 14); g.fill(); T(g, s, x + 41, 255, { size: 28, c: on ? '#0c1838' : C.white }); x += 92; });
  T(g, `${n} буын`, 480, 360, { size: 40, c: C.gold }); T(g, '7 + 7 + 7 + 7 = 28', 480, 430, { f: 'F', size: 32, al: seg(p, .8, .9) });
};
A.series = (g, p) => {
  const x0 = 300, y0 = 120, s = 300; g.strokeStyle = C.white; g.lineWidth = 3; g.strokeRect(x0, y0, s, s);
  const n = Math.floor(seg(p, .15, .85) * 8); let x = x0, y = y0, w = s, h = s; const cols = ['#2fd0c8', '#f0b432', '#ff6b6b', '#7c5cff'];
  let sum = 0; for (let i = 0; i < n; i++) { g.fillStyle = cols[i % 4]; if (i % 2 === 0) { g.fillRect(x, y, w / 2, h); x += w / 2; w /= 2; } else { g.fillRect(x, y, w, h / 2); y += h / 2; h /= 2; } sum += Math.pow(.5, i + 1); }
  T(g, `½ + ¼ + … = ${sum.toFixed(3).replace('.', ',')}`, 760, 220, { f: 'F', size: 30 }); T(g, '→ 1', 760, 270, { size: 30, c: C.gold, al: seg(p, .8, .9) });
  T(g, '1 + ½ + ¼ + … = 2', 480, 480, { f: 'F', size: 40, c: C.gold, al: seg(p, .8, .92) });
};
A.throw = (g, p) => {
  const k = seg(p, .1, .9); const t = k * 10; const v0 = 50; const y = v0 * t - 5 * t * t; const sc = 2.8; const by = 470;
  g.fillStyle = '#2a5a3a'; g.fillRect(0, by, W, 70); const ay = by - y * sc;
  line(g, 320, ay, 320, ay - 40, '#e8d6b0', 4); g.fillStyle = C.gold; g.beginPath(); g.moveTo(312, ay - 40); g.lineTo(320, ay - 58); g.lineTo(328, ay - 40); g.fill();
  line(g, 200, by - 125 * sc, 440, by - 125 * sc, 'rgba(255,255,255,.3)', 2); T(g, 'h max = 125 м', 520, by - 125 * sc, { size: 20, a: 'left' });
  const v = v0 - 10 * t; T(g, `v = ${v.toFixed(0)} м/с`, 720, 260, { size: 30, c: Math.abs(v) < 3 ? C.gold : C.white });
  T(g, 'h = v² : (2g)', 720, 140, { f: 'F', size: 44, c: C.gold, al: seg(p, .6, .75) });
};
A.yurt = (g, p) => {
  const cx = 380, cy = 280, R = 200; const n = Math.floor(seg(p, .1, .7) * 60);
  for (let i = 0; i < n; i++) { const a = i / 60 * Math.PI * 2; line(g, cx + Math.cos(a) * 46, cy + Math.sin(a) * 46, cx + Math.cos(a) * R, cy + Math.sin(a) * R, '#c8963e', 3); }
  g.strokeStyle = '#8a5a2b'; g.lineWidth = 14; g.beginPath(); g.arc(cx, cy, 46, 0, 7); g.stroke(); line(g, cx - 46, cy, cx + 46, cy, '#8a5a2b', 6); line(g, cx, cy - 46, cx, cy + 46, '#8a5a2b', 6);
  g.strokeStyle = C.white; g.lineWidth = 3; g.beginPath(); g.arc(cx, cy, R, 0, 7); g.stroke();
  T(g, `${n} уық`, 760, 200, { size: 34 }); T(g, '360° : 60 = 6°', 760, 270, { f: 'F', size: 40, c: C.gold, al: seg(p, .65, .8) });
};

/** Трейлер ойнатқышы */
export class TrailerPlayer {
  constructor(root) {
    this.root = root;
    root.innerHTML = `<div class="tr-screen"><canvas width="${W}" height="${H}"></canvas><div class="tr-cap"></div><button class="tr-big" aria-label="Ойнату">▶</button></div>
      <div class="tr-bar"><button class="tr-play btn-primary sm" type="button">❚❚</button><div class="tr-prog"><i></i></div><span class="tr-time">0:00</span></div>`;
    this.cv = root.querySelector('canvas'); this.g = this.cv.getContext('2d');
    root.querySelector('.tr-play').addEventListener('click', () => this.toggle()); root.querySelector('.tr-big').addEventListener('click', () => this.toggle());
    root.querySelector('.tr-prog').addEventListener('click', (e) => { const r = e.currentTarget.getBoundingClientRect(); this.seek((e.clientX - r.left) / r.width); });
  }
  load(id) {
    this.stop(); const tr = TRAILERS[id]; if (!tr) return false; this.tr = tr; this.id = id;
    const text = tr[2].join(' '); this.dur = Math.max(16, text.length * .072); this.pos = 0;
    this.audio = !isMuted() && hasAudio('tr_' + id) ? new Audio('audio/tr_' + id + '.mp3') : null;
    if (this.audio) this.audio.addEventListener('loadedmetadata', () => { if (isFinite(this.audio.duration)) this.dur = this.audio.duration + 1.2; });
    this.play(); return true;
  }
  play() { this.playing = true; this.root.classList.add('playing'); this.root.querySelector('.tr-play').textContent = '❚❚'; this.t0 = performance.now() - this.pos * 1000; this.audio?.play().catch(() => {}); if (this.audio) this.audio.currentTime = Math.max(0, this.pos - .6); cancelAnimationFrame(this.raf); const tick = () => { this.frame(); if (this.playing) this.raf = requestAnimationFrame(tick); }; tick(); }
  pause() { this.playing = false; this.root.classList.remove('playing'); this.root.querySelector('.tr-play').textContent = '▶'; this.audio?.pause(); }
  toggle() { this.playing ? this.pause() : (this.pos >= this.dur ? (this.pos = 0, this.play()) : this.play()); }
  seek(f) { this.pos = Math.max(0, Math.min(1, f)) * this.dur; if (this.audio) this.audio.currentTime = Math.max(0, this.pos - .6); this.t0 = performance.now() - this.pos * 1000; this.frame(); }
  stop() { this.pause(); cancelAnimationFrame(this.raf); this.audio = null; }
  frame() {
    if (this.playing) { this.pos = (performance.now() - this.t0) / 1000; if (this.pos >= this.dur) { this.pos = this.dur; this.pause(); } }
    const { g, tr } = this; const p = this.pos / this.dur;
    const gr = g.createLinearGradient(0, 0, W, H); gr.addColorStop(0, C.bg1); gr.addColorStop(1, C.bg2); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    g.strokeStyle = 'rgba(240,180,50,.08)'; g.lineWidth = 1; for (let x = 0; x < W; x += 48) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); } for (let y = 0; y < H; y += 48) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
    const intro = 1 - seg(p, .03, .1);
    if (intro > 0) { g.globalAlpha = intro; T(g, 'QAZAQ MATH · БЕЙНЕ-ТРЕЙЛЕР', 480, 220, { size: 18, c: C.gold }); T(g, tr[0], 480, 280, { size: 52 }); g.globalAlpha = 1; }
    // қалқыған символдар мен виньетка
    const syms = ['π', '√', 'Σ', 'x²', '∞', '%', 'α', '△', '÷', 'log'];
    for (let i = 0; i < 16; i++) { const t = this.pos * .04 + i * .37; const x = (i * 157 + Math.sin(t * 3 + i) * 30) % W, y = (H + 40 - ((t * 60 + i * 83) % (H + 80))); T(g, syms[i % syms.length], x, y, { f: 'F', size: 18 + (i % 4) * 8, c: i % 3 ? '#7cc8ff' : '#f0b432', al: .1 }); }
    const vg = g.createRadialGradient(W / 2, H / 2, H * .3, W / 2, H / 2, W * .7); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.45)'); g.fillStyle = vg; g.fillRect(0, 0, W, H);
    const pp = Math.max(0, (p - .08) / .92); g.save(); g.shadowColor = 'rgba(240,180,50,.45)'; g.shadowBlur = 14; (A[tr[1]] || A.pyth)(this.g, pp); g.restore();
    // бұрыштағы белгі
    g.fillStyle = 'rgba(255,255,255,.08)'; g.beginPath(); g.roundRect(20, 18, 250, 34, 17); g.fill(); T(g, `QAZAQ MATH · ${tr[0]}`, 145, 35, { size: 13, c: C.gold, al: Math.min(1, p * 20) });
    g.fillStyle = 'rgba(240,180,50,.9)'; g.fillRect(0, H - 4, W * p, 4);
    // субтитр
    const segs = tr[2]; const tot = segs.reduce((s, x) => s + x.length, 0); let acc = 0, cur = segs[0]; for (const s of segs) { if (p * tot * 1.04 >= acc) cur = s; acc += s.length; }
    const cap = this.root.querySelector('.tr-cap'); if (cap.textContent !== cur) cap.textContent = cur;
    this.root.querySelector('.tr-prog i').style.width = (p * 100) + '%';
    const s = Math.floor(this.pos); this.root.querySelector('.tr-time').textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')} / ${Math.floor(this.dur / 60)}:${String(Math.floor(this.dur % 60)).padStart(2, '0')}`;
  }
}
