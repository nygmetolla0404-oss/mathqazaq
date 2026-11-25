// QAZAQ MATH — қосымшаның негізгі логикасы.
import { Engine, haversine } from './engine3d.js';
import { CHARACTERS, charSVG } from './actors.js';
import { BookViewer } from './book.js';
import { mountSim } from './sims.js';
import { SIMS, BOOKS, MATH } from './content.js';
import { renderAdal, ADAL } from './adal.js';
import { TrailerPlayer, TRAILERS } from './trailers.js';
import { initVoice, say, stop as stopVoice, sfx } from './voice.js';
import { Store, Sync, publicRecord, Accounts, ADMIN_LOGIN, translit, genPassword } from './store.js';
import { initLab } from './lab.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const nf = (x, d = 0) => Number(x).toLocaleString('ru-RU', { maximumFractionDigits: d, minimumFractionDigits: 0 });
const COLORS = ['#c4302b', '#1c4fb0', '#0f8b8d', '#c8963e', '#6b4fe0', '#e0752d', '#2fa866', '#d6457a'];
const validChar = (id) => CHARACTERS.some(c => c.id === id) ? id : 'tamshy';
const charFace = (id, color, size = 40) => charSVG(validChar(id), color || '#2aa8ff', size);
const BOOK_COLORS = ['#16306e', '#7a1e2c', '#0f5f4c'];
const ROUTES = ['home', 'map', 'lab', 'quests', 'adal', 'idea', 'author', 'cabinet', 'teacher'];
let accounts = null, accountsReady = null, teacherHash = null, tTab = 'online', tSel = null, newCreds = [];
try { teacherHash = localStorage.getItem('qm_teacher') || null; } catch (e) {}
const FACTS = [
  'Қазақстан аумағы <b>2 724 900 км²</b> — жер шарындағы ең үлкен 9-мемлекет!',
  'Бәйтеректің биіктігі <b>97 м</b> — Астананың астана болған <b>1997</b> жылын білдіреді.',
  'Каспий теңізінің деңгейі мұхит деңгейінен <b>≈ 28 м</b> төмен — бұл теріс сан!',
  'Балқаш көлінің батысы тұщы, шығысы тұзды — ұзындығы <b>≈ 605 км</b>.',
  'Әл-Фараби октаваны <b>2 : 1</b>, квинтаны <b>3 : 2</b> қатынасымен түсіндірген.',
  'Бірінші ғарыштық жылдамдық <b>≈ 7,9 км/с</b> — Байқоңырдан ұшқан ракеталар осыған жетеді.',
  'Киіз үйдегі <b>60</b> уық шаңыраққа <b>6°</b> бұрышпен жиналады.',
  'Хан Тәңірі шыңы <b>≈ 7010 м</b> — Қазақстанның ең биік нүктесі.',
];

let trailer = null, bookViewer = null, simHandle = null, simPlace = null, data, engine, sync, route = 'home', inWorld = null, currentTask = null, nearPlace = null, spoken = {}, factI = 0, lastBlock = 0, peersCache = [];

// ====================== іске қосу ======================
boot();
async function boot() {
  data = await (await fetch('js/data.json')).json();
  for (const pr of Object.values(Store.profiles)) { if (!CHARACTERS.some(c => c.id === pr.char)) pr.char = 'tamshy'; pr.sims ||= {}; pr.adal ||= {}; }
  if (Store.me && !Store.me.login) Store.sid = null;
  Store.save();
  try { await Promise.race([Promise.all(['800 20px Montserrat', '600 20px Inter', 'italic 600 20px "Noto Serif"'].map(f => document.fonts.load(f, 'Әә Ққ Өө'))), new Promise(r => setTimeout(r, 2500))]); } catch (e) {}
  await initVoice();
  engine = new Engine($('#gl'), data, {
    onReady: () => { $('#loader').hidden = true; },
    onHud, onPlaceClick: openPlace, onCityClick: cityInfo, onAction, onWorldPrompt, onBlocked,
  });
  setTimeout(() => { $('#loader').hidden = true; }, 6000);
  if (Store.me) engine.setProfile(Store.me);
  sync = new Sync();
  sync.on((list) => { peersCache = list; onPeers(list); });
  accounts = new Accounts(sync);
  accountsReady = sync.start(() => publicRecord(Store.me)).then(async mode => { await accounts.init(); if (sync.lan && $('#qrSmall')) drawQR($('#qrSmall'), 104); $('#syncMode').textContent = { server: '· сынып желісі', artifact: '· онлайн бөлме', local: '· бір құрылғы' }[mode]; onPeers(sync.list()); });
  initUI(); initLab(data, (pts) => { if (Store.me) { Store.me.points += pts; Store.me.labPts = (Store.me.labPts || 0) + pts; Store.save(); refreshChip(); } });
  addEventListener('hashchange', () => go(location.hash.slice(1)));
  go(location.hash.slice(1) || 'home');
  setInterval(tickSecond, 1000);
  window.__qm = { get engine() { return engine; }, openSim: (id) => openSim(data.places.find(p => p.id === id)), launch3D };
  setInterval(() => pushPresence(), 2000);
  setInterval(() => { if (inWorld) pushPresence(); }, 350);
}

// ====================== маршрутизация ======================
function go(r) {
  if (r === 'monitor') r = 'teacher';
  if (r === 'join') { r = 'home'; setTimeout(() => { if (!Store.me) openReg(null, 'login'); }, 400); }
  if (!ROUTES.includes(r)) r = 'home';
  if (inWorld) leaveWorld(true);
  route = r; document.body.classList.toggle('on-page', !['home', 'map'].includes(r)); if (r !== 'map') stopVoice();
  $$('.view').forEach(v => { v.hidden = v.dataset.view !== r; });
  $$('.mainnav a').forEach(a => a.classList.toggle('active', a.dataset.nav === r));
  if (r === 'home') engine.setMode('home');
  else if (r === 'map') { if (!Store.me) { openReg(() => go('map')); location.hash = 'home'; return; } engine.setMode('map'); if (!spoken.welcome) { spoken.welcome = 1; say('ui_welcome', data.ui.welcome); } }
  else engine.setMode('page');
  $('#onlinePill').hidden = r !== 'map' && r !== 'teacher';
  if (r === 'quests') renderQuests();
  if (r === 'idea') renderIdea();
  if (r === 'author') renderAuthor();
  if (r === 'cabinet') renderCabinet();
  if (r === 'adal') renderAdalPage();
  if (r === 'teacher') renderTeacher();
  if (r === 'lab' && !spoken.lab) { spoken.lab = 1; say('ui_lab', data.ui.lab); }
  if (location.hash.slice(1) !== r) history.replaceState(null, '', '#' + r);
  setWhere(); pushPresence();
}
function setWhere() {
  const me = Store.me; if (!me) return;
  me.where = inWorld ? `${inWorld.name} әлемінде · ${Store.solved(inWorld.id).length}/3 есеп`
    : route === 'map' ? `Картада · ${engine.mount === 'eagle' ? 'бүркітпен ұшып' : engine.mount === 'orbit' ? 'шолу режимі' : 'атпен'}${nearPlace ? ' · ' + nearPlace.name : ''}`
    : ({ home: 'Басты бетте', lab: 'Зертханада', quests: 'Тапсырмаларды қарап жүр', idea: 'Педагогикалық идеяны оқып жүр', adal: '«Адал азамат» жағдаяттарын шешіп жүр', author: 'Автор туралы оқып жүр', cabinet: 'Өз кабинетінде', monitor: 'Сынып бөлмесінде' })[route];
}

// ====================== UI ======================
function initUI() {
  $('#btnStart').addEventListener('click', () => { if (!Store.me) openReg(() => { location.hash = 'map'; }); else location.hash = 'map'; });
  $$('[data-go]').forEach(b => b.addEventListener('click', () => { location.hash = b.dataset.go; }));
  $('#userChip').addEventListener('click', () => { if (Store.me) location.hash = 'cabinet'; else openReg(); });
  $('#rLogin').addEventListener('input', () => { $('#rLogin').dataset.touched = 1; });
  $$('[data-wmount]').forEach(b => b.addEventListener('click', () => { engine.setWorldMount(b.dataset.wmount); $$('[data-wmount]').forEach(x => x.classList.toggle('on', x === b)); if (b.dataset.wmount === 'eagle') toast('Бүркітпен ұш: Space — жоғары, C — төмен, W-ны жіберсең — қалықтайды'); pushPresence(); }));
  $('#btnNextFact').addEventListener('click', () => { factI = (factI + 1) % FACTS.length; $('#factText').innerHTML = FACTS[factI]; });
  setInterval(() => { if (route === 'home') { factI = (factI + 1) % FACTS.length; $('#factText').innerHTML = FACTS[factI]; } }, 12000);
  $$('.modal').forEach(m => { m.addEventListener('click', (e) => { if (e.target === m || e.target.closest('[data-close]')) closeModal(m); }); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape') $$('.modal').forEach(m => { if (!m.hidden) closeModal(m); }); });
  $$('.mount-switch button').forEach(b => b.addEventListener('click', () => {
    $$('.mount-switch button').forEach(x => x.classList.toggle('on', x === b)); engine.setMount(b.dataset.mount);
    if (b.dataset.mount === 'horse') say('ui_horse', data.ui.horse); if (b.dataset.mount === 'eagle') say('ui_eagle', data.ui.eagle);
    setWhere(); pushPresence();
  }));
  $('#btnEnter').addEventListener('click', () => nearPlace && enterPortal(nearPlace));
  $('#pmEnter').addEventListener('click', () => { const p = $('#placeModal').place; closeModal($('#placeModal')); if (p) enterPortal(p); });
  $('#pmListen').addEventListener('click', () => { const p = $('#placeModal').place; if (p) say(p.scientist ? p.id + '_sci' : p.id, p.scientist ? `${p.scientist.name}. ${p.scientist.field}. ${p.scientist.found}` : p.say); });
  $('#btnExitWorld').addEventListener('click', () => leaveWorld());
  $('#btnWorldAct').addEventListener('click', onAction);
  $('#btnTrailer').addEventListener('click', () => inWorld && openTrailer(inWorld));
  $('#btnOrbit').addEventListener('click', (e) => { const on = !engine.worldOrbit; engine.setWorldOrbit(on); e.currentTarget.classList.toggle('on', on); if (on) { $('#btnLookUp').classList.remove('on'); toast('360° шолу: тышқанмен айналдыр, дөңгелекшемен жақында/алыста'); } });
  $('#btnLookUp').addEventListener('click', (e) => { const on = !e.currentTarget.classList.contains('on'); if (engine.worldOrbit) { engine.setWorldOrbit(false); $('#btnOrbit').classList.remove('on'); } engine.lookUp(on); e.currentTarget.classList.toggle('on', on); });
  $('#btnLabels').addEventListener('click', (e) => { const hide = !document.body.classList.contains('no-labels'); document.body.classList.toggle('no-labels', hide); engine.setTextVisible(!hide); e.currentTarget.classList.toggle('on', hide); });
  initCollapsibles(); initQR();
  // тапсырма
  $('#tmForm').addEventListener('submit', (e) => { e.preventDefault(); checkTask(); });
  $('#tmHint').addEventListener('click', () => { if (!currentTask) return; const t = currentTask.t; if (!currentTask.hinted) { currentTask.hinted = true; if (Store.me) { Store.me.hints++; Store.save(); } } fb('hint', `<b>Кеңес:</b> ${esc(t.h)}`); });
  $('#tmListen').addEventListener('click', () => currentTask && say(`${currentTask.p.id}_t${currentTask.i}`, currentTask.t.t));
  // тіркелу
  const sw = $('#rColors'); COLORS.forEach((c, i) => { const b = document.createElement('button'); b.type = 'button'; b.style.background = c; b.dataset.c = c; b.setAttribute('aria-label', 'Түс ' + (i + 1)); if (!i) b.classList.add('on'); b.addEventListener('click', () => { $$('#rColors button').forEach(x => x.classList.toggle('on', x === b)); $$('#rChars button').forEach(x => { x.querySelector('svg').outerHTML = charSVG(x.dataset.c, c, 46); }); }); sw.appendChild(b); });
  const ch = $('#rChars'); CHARACTERS.forEach((c, i) => { const b = document.createElement('button'); b.type = 'button'; b.dataset.c = c.id; b.innerHTML = `${charSVG(c.id, COLORS[0], 46)}${esc(c.name)}<small>${esc(c.hint)}</small>`; if (!i) b.classList.add('on'); b.addEventListener('click', () => { $$('#rChars button').forEach(x => x.classList.toggle('on', x === b)); }); ch.appendChild(b); });
  $$('.auth-tabs button').forEach(b => b.addEventListener('click', () => authTab(b.dataset.tab)));
  $('#rFirst').addEventListener('input', suggestLogin); $('#rLast').addEventListener('input', suggestLogin);
  $('#regForm').addEventListener('submit', async (e) => {
    e.preventDefault(); const err = $('#rErr'); err.textContent = '';
    const first = $('#rFirst').value.trim(), last = $('#rLast').value.trim(), login = $('#rLogin').value.trim().toLowerCase(), pw = $('#rPass').value; if (!first || !last) return;
    if (pw.length < 4) { err.textContent = 'Құпиясөз кемінде 4 таңба'; return; }
    await accountsReady; const sid = 's' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
    const acc = { login, first, last, cls: `${$('#rGrade').value} «${$('#rLetter').value}»`, color: $('#rColors .on').dataset.c, char: $('#rChars .on').dataset.c, sid, createdAt: Date.now() };
    const res = await accounts.register(acc, pw); if (!res?.ok) { err.textContent = res?.err || 'Тіркелу мүмкін болмады'; return; }
    loginAs(acc); toast(`Қош келдің, ${first}! Логин: ${login}`);
  });
  $('#loginForm').addEventListener('submit', async (e) => {
    e.preventDefault(); const err = $('#lErr'); err.textContent = 'Тексерілуде…'; await accountsReady;
    const acc = await accounts.login($('#lLogin').value, $('#lPass').value).catch(() => null);
    if (!acc) { err.textContent = 'Логин немесе құпиясөз қате'; return; } err.textContent = ''; loginAs(acc); toast(`Қош келдің, ${acc.first}!`);
  });
  $('#teacherForm').addEventListener('submit', async (e) => {
    e.preventDefault(); const err = $('#tErr'); err.textContent = 'Тексерілуде…'; await accountsReady;
    const h = await accounts.adminLogin($('#tLogin').value, $('#tPass').value).catch(() => null);
    if (!h) { err.textContent = 'Мұғалім логині немесе құпиясөзі қате'; return; } err.textContent = '';
    teacherHash = h; try { localStorage.setItem('qm_teacher', h); } catch (e2) {} closeModal($('#regModal')); location.hash = 'teacher'; renderTeacher(); toast('Мұғалім кабинетіне қош келдіңіз!');
  });
  refreshChip();
}
function openReg(after, tab = 'login') { $('#regModal').after = after; $('#regModal').hidden = false; authTab(tab); }
function authTab(t) { $$('.auth-tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === t)); $$('.auth-pane').forEach(f => { f.hidden = f.dataset.pane !== t; }); $('#regTitle').textContent = { login: 'QAZAQ MATH-қа кіру', register: 'Жаңа саяхатшы', teacher: 'Мұғалім кабинеті' }[t]; setTimeout(() => ({ login: $('#lLogin'), register: $('#rFirst'), teacher: $('#tLogin') })[t]?.focus(), 60); }
function suggestLogin() { if ($('#rLogin').dataset.touched) return; const l = [translit($('#rFirst').value), translit($('#rLast').value)].filter(Boolean).join('.'); $('#rLogin').value = l.slice(0, 24); }
function loginAs(acc) {
  let me = Store.profiles[acc.sid];
  if (!me) { const rec = sync.records.get(acc.sid) || {}; me = Store.profiles[acc.sid] = { sid: acc.sid, first: acc.first, last: acc.last, cls: acc.cls, color: acc.color, char: acc.char, points: 0, stars: 0, solved: {}, sims: {}, adal: {}, hints: 0, timeSec: 0, km: 0, visited: [], createdAt: acc.createdAt || Date.now(), where: 'Басты бет', badges: [], ...rec }; }
  me.login = acc.login; me.sims ||= {}; me.adal ||= {}; if (!CHARACTERS.some(c => c.id === me.char)) me.char = 'tamshy';
  Store.sid = acc.sid; Store.save(); engine.setProfile(me); sync.records.set(me.sid, publicRecord(me)); sync.pushRecord(true); refreshChip(); closeModal($('#regModal'));
  const cb = $('#regModal').after; $('#regModal').after = null; cb?.(); pushPresence();
}
function logout() { Store.sid = null; Store.save(); refreshChip(); toast('Сен жүйеден шықтың'); location.hash = 'home'; }
function closeModal(m) { m.hidden = true; if (m.id === 'taskModal') currentTask = null; if (m.id === 'bookModal') bookViewer?.hide(); if (m.id === 'simModal') { simHandle?.destroy(); simHandle = null; } if (m.id === 'trailerModal') trailer?.stop(); }
function toast(msg, ms = 2600) { const t = $('#toast'); t.textContent = msg; t.hidden = false; clearTimeout(toast.tm); toast.tm = setTimeout(() => { t.hidden = true; }, ms); }
function refreshChip() {
  const me = Store.me;
  $('#chipName').textContent = me ? me.first : 'Кіру'; $('#chipClass').textContent = me ? `${me.cls} сынып · ★ ${me.stars}` : 'Тіркелу';
  const a = $('#chipAvatar'); a.innerHTML = me ? charFace(me.char, me.color, 32) : '?';
}

// ====================== уақыт пен қатысу ======================
function tickSecond() {
  const me = Store.me; if (!me || document.hidden) return;
  me.timeSec += 1; if (route === 'map' && !inWorld) me.km = Math.max(me.km || 0, engine.player.km + (me.kmBase || 0));
  if (me.timeSec % 10 === 0) { setWhere(); Store.save(); sync.pushRecord(); refreshChip(); }
  if (route === 'cabinet' && me.timeSec % 5 === 0) renderCabinet();
}
function pushPresence() {
  const me = Store.me; if (!me || !sync) return;
  const p = { sid: me.sid, name: `${me.first} ${me.last}`, cls: me.cls, color: me.color, char: me.char, points: me.points, stars: me.stars, where: me.where, view: inWorld ? 'world' : route };
  if (route === 'map' && !inWorld && engine.mount !== 'orbit') Object.assign(p, engine.presence()); else Object.assign(p, { x: null });
  if (inWorld) Object.assign(p, { world: inWorld.id, mount: engine.wMount }, engine.worldPresence());
  sync.setPresence(p);
}
function onPeers(list) {
  const meId = Store.me?.sid; const online = list.filter(s => s.online);
  $('#onlineCount').textContent = String(Math.max(online.length, meId ? 1 : 0));
  engine.setPeers(online.filter(s => s.sid !== meId).map(s => ({ ...s, presence: s.presence })));
  const top = [...list].sort((a, b) => (b.points || 0) - (a.points || 0)).slice(0, 5);
  $('#ratingList').innerHTML = top.length ? top.map((s, i) => `<li><span class="rk">${i + 1}</span><span>${esc(s.first)} ${esc((s.last || '')[0] || '')}. <small style="color:var(--muted)">${esc(s.cls || '')}</small></span><span class="pts">${nf(s.points || 0)}</span></li>`).join('') : '<li class="rating-empty">Әзірге ешкім жоқ. Бірінші бол!</li>';
  if (inWorld) { const here = online.filter(s => s.sid !== meId && s.presence?.view === 'world' && s.presence?.world === inWorld.id); engine.setWorldPeers(here); const wp = $('#wPeers'); wp.hidden = !here.length; wp.innerHTML = here.length ? `<span class="g-lab">Бұл әлемде</span>${here.map(s => `<span class="wp"><i style="background:${esc(s.color || '#0f8b8d')}"></i>${esc(s.first || s.name)} · ${s.presence.wm === 'eagle' ? 'бүркіт' : 'ат'}</span>`).join('')}` : ''; } else $('#wPeers').hidden = true;
  if (route === 'teacher' && teacherHash && tTab !== 'students' && tTab !== 'settings' && Date.now() - (onPeers.t || 0) > 1500) { onPeers.t = Date.now(); renderTeacher(); }
}

// ====================== карта HUD ======================
function onHud(s) {
  if (inWorld) return;
  $('#hSpeed').textContent = nf(s.speed); $('#hBoost').textContent = s.hover ? 'қалықтап тұр' : s.boost > 1.05 ? `үдеу ×${nf(s.boost, 1)}` : 'км/сағ'; $('#hAlt').textContent = nf(s.alt); $('#hDist').textContent = nf(s.km, 1);
  const hh = Math.floor(s.hours), mm = Math.floor((s.hours - hh) * 60); $('#hTime').textContent = `${hh}:${String(mm).padStart(2, '0')}`;
  $('#hNeedle').style.transform = `rotate(${s.head}deg)`; $('#hHead').textContent = `${nf(s.head)}° ${dirName(s.head)}`;
  const n = s.nearest; $('#nearName').textContent = n.p.name;
  $('#nearInfo').textContent = `≈ ${nf(n.d)} км · азимут ${nf(n.bearing)}° (${dirName(n.bearing)})`;
  const close = n.d < 45; $('#btnEnter').hidden = !close;
  if (close && nearPlace !== n.p) { nearPlace = n.p; if (!spoken[n.p.id] || Date.now() - spoken[n.p.id] > 90000) { spoken[n.p.id] = Date.now(); say(n.p.id, n.p.say); } toast(`📍 ${n.p.name} — порталға кіруге болады (E)`); setWhere(); }
  if (!close && n.d > 70 && nearPlace === n.p) nearPlace = null;
  if (s.city.d < 30 && s.city.c.id !== onHud.lastCity) { onHud.lastCity = s.city.c.id; const a = data.places[0]; const dA = haversine(s.city.c.lon, s.city.c.lat, a.lon, a.lat); toast(`🏙️ Сіз ${s.city.c.name} қаласындасыз · Астанаға дейін ≈ ${nf(dA)} км`, 3500); }
  // тірі формула
  const ph = Math.floor(Date.now() / 4500) % 3; const v = s.hours > .05 ? s.km / s.hours : 0; let f;
  if (ph === 0) f = `v̄ = s : t = ${nf(s.km, 1)} км : ${nf(s.hours, 2)} сағ ≈ ${nf(v)} км/сағ`;
  else if (ph === 1) f = s.speed > 1 ? `t = d : v = ${nf(n.d)} км : ${nf(s.speed)} км/сағ ≈ ${nf(n.d / s.speed, 2)} сағ → ${n.p.name}` : `Ең жақын нысанға дейін d ≈ ${nf(n.d)} км (Жер шары бойынша, R = 6371 км)`;
  else if (s.mount === 'eagle') f = `p ≈ 760 · e^(−h/8400) ≈ ${nf(760 * Math.exp(-s.alt / 8400))} мм сын. бағ. · t° ≈ t₀ − 6,5·${nf(s.alt / 1000, 2)} ≈ t₀ − ${nf(6.5 * s.alt / 1000, 1)}°C`;
  else f = `Жер бедері: ${nf(s.groundM)} м · координата ${nf(s.lat, 2)}° с.е., ${nf(s.lon, 2)}° ш.б. · 1 с = 30 мин`;
  $('#formulaText').textContent = f;
  drawMinimap(s);
  if (route === 'map' && Date.now() - (onHud.pt || 0) > 220) { onHud.pt = Date.now(); pushPresence(); }
}
function dirName(b) { return ['С', 'СШ', 'Ш', 'ОШ', 'О', 'ОБ', 'Б', 'СБ'][Math.round(b / 45) % 8]; }
function drawMinimap(s) {
  const cv = $('#minimap'); if (!cv.offsetParent) return; const g = cv.getContext('2d'); const W = 220, H = 130;
  const tx = lon => 6 + (lon - 46) / 42 * (W - 12), ty = lat => H - 6 - (lat - 40.3) / 15.4 * (H - 12);
  g.clearRect(0, 0, W, H); g.beginPath(); data.border.forEach(([lo, la], i) => i ? g.lineTo(tx(lo), ty(la)) : g.moveTo(tx(lo), ty(la))); g.closePath(); g.fillStyle = 'rgba(95,227,255,.12)'; g.fill(); g.strokeStyle = '#f3c24b'; g.lineWidth = 1.5; g.stroke();
  for (const p of data.places) { g.fillStyle = p.kind === 'scientist' ? '#f3c24b' : '#5fe3ff'; g.fillRect(tx(p.lon) - 1.5, ty(p.lat) - 1.5, 3, 3); }
  for (const pr of peersCache) if (pr.online && pr.presence?.x != null && pr.sid !== Store.me?.sid) { const lon = pr.presence.x / (6 * Math.cos(48 * Math.PI / 180)) + 67, lat = -pr.presence.z / 6 + 48; g.beginPath(); g.arc(tx(lon), ty(lat), 3, 0, 7); g.fillStyle = pr.color || '#fff'; g.fill(); }
  g.save(); g.translate(tx(s.lon), ty(s.lat)); g.rotate(s.head * Math.PI / 180); g.beginPath(); g.moveTo(0, -6); g.lineTo(4, 4); g.lineTo(-4, 4); g.closePath(); g.fillStyle = '#ff6b6b'; g.fill(); g.restore();
}
function onBlocked(kind) { if (Date.now() - lastBlock < 3000) return; lastBlock = Date.now(); toast(kind === 'lake' ? '🌊 Ат суда жүзе алмайды — бүркітке отыр!' : '🛑 Мемлекеттік шекара. Бүркітпен ұшып көр!'); }
function cityInfo(c) { const a = data.places[0]; const d = haversine(c.lon, c.lat, a.lon, a.lat); toast(`🏙️ ${c.name}: ${nf(c.lat, 2)}° с.е., ${nf(c.lon, 2)}° ш.б. · Астанаға дейін ≈ ${nf(d)} км`, 4000); }

// ====================== нысан, портал ======================
function openPlace(p) {
  const m = $('#placeModal'); m.place = p;
  $('#pmKind').textContent = { city: 'Қала', landmark: 'Сәулет ескерткіші', nature: 'Табиғат нысаны', scientist: 'Ғалымдар отаны' }[p.kind] || 'Нысан';
  $('#pmTitle').textContent = p.name; $('#pmInfo').textContent = p.info;
  const M = MATH[p.id]; $('#pmMath').innerHTML = M ? `<span class="g-lab">Математикалық паспорт · ${esc(M.shape)}</span><p class="pmf">${esc(M.formula)}</p><ul>${M.lines.map(l => `<li>${esc(l)}</li>`).join('')}</ul>` : '';
  $('#pmFacts').innerHTML = p.facts.map(([a, b]) => `<dt>${esc(a)}</dt><dd>${esc(b)}</dd>`).join('');
  const sc = $('#pmSci'); sc.hidden = !p.scientist;
  if (p.scientist) sc.innerHTML = `<b>${esc(p.scientist.name)}</b> (${esc(p.scientist.years)})<br>Туған жері: ${esc(p.scientist.born)}<br>Ғылымы: ${esc(p.scientist.field)}<br>${esc(p.scientist.found)}`;
  const n = Store.solved(p.id).length; $('#pmEnter').textContent = n === 3 ? 'Порталға қайта кіру ★★★' : `Порталға кіру · ${n}/3 ★`;
  m.hidden = false;
}
function onAction() {
  if (!$('#taskModal').hidden || !$('#regModal').hidden) return;
  if (!$('#bookModal').hidden || !$('#simModal').hidden) return;
  if (inWorld) { const pr = engine._prompt; if (!pr) return; if (pr.type === 'gate') openTask(inWorld, pr.i); else if (pr.type === 'book') openBook(inWorld, pr.i); else if (pr.type === 'sim') openSim(inWorld); else if (pr.type === 'exit') leaveWorld(); else if (pr.type === 'board') { say(inWorld.id, inWorld.say); openPlace(inWorld); } return; }
  if (route === 'map' && nearPlace) enterPortal(nearPlace);
}
function enterPortal(p) {
  if (!Store.me) { openReg(() => enterPortal(p)); return; }
  if (route !== 'map') { location.hash = 'map'; setTimeout(() => enterPortal(p), 60); return; }
  engine.teleportTo(p); stopVoice();
  const fx = $('#portalFx'); $('#pfText').textContent = `${p.name} — портал ашылуда…`; fx.hidden = false; sfx('portal');
  setTimeout(() => {
    inWorld = p; Store.visit(p.id);
    engine.enterWorld(p, Store.solved(p.id), !!Store.me?.sims?.[p.id]);
    $('#view-map').hidden = true; $('#view-world').hidden = false;
    $('#wTitle').textContent = p.name; $('#wValue').textContent = p.value; renderWorldStars();
    fx.hidden = true; say('ui_portal', data.ui.portal); setWhere(); pushPresence();
    $('#btnOrbit').classList.remove('on'); $('#btnLookUp').classList.remove('on'); $('#onlinePill').hidden = true;
    $$('[data-wmount]').forEach(x => x.classList.toggle('on', x.dataset.wmount === 'horse'));
    const gd = $('#worldGuide'); gd.hidden = false; clearTimeout(enterPortal.gt); enterPortal.gt = setTimeout(() => { gd.hidden = true; }, 16000);
  }, 1300);
}
function leaveWorld(silent) {
  if (!inWorld) return; inWorld = null; engine.leaveWorld(); onWorldPrompt(null);
  $('#view-world').hidden = true; $('#view-map').hidden = route !== 'map'; $('#onlinePill').hidden = route !== 'map' && route !== 'teacher';
  if (!silent) { sfx('portal'); toast('Картаға оралдың'); }
  setWhere(); pushPresence();
}
function renderWorldStars() { const n = inWorld ? Store.solved(inWorld.id) : []; $('#wStars').innerHTML = [0, 1, 2].map(i => `<span class="s ${n.includes(i) ? 'on' : ''}">★</span>`).join(''); }
function onWorldPrompt(pr) {
  const box = $('#wPrompt'); box.hidden = !pr; if (!pr) return;
  const bk = (BOOKS[inWorld.id] || [])[pr.i];
  $('#wPromptText').textContent = pr.type === 'gate' ? `${pr.i + 1}-қақпа · ${inWorld.tasks[pr.i].s} — есепті шешсең, есік ашылып «${bk?.n || 'формула'}» кітабы сыйға беріледі` : pr.type === 'book' ? `«${bk?.n || ''}» — формула кітабы` : pr.type === 'sim' ? `Симулятор: ${SIMS[inWorld.id]?.title || ''}` : pr.type === 'exit' ? 'Қайту порталы — картаға оралу' : 'Математикалық паспорт — тыңдау және оқу';
  $('#btnWorldAct').innerHTML = ({ gate: 'Есепті ашу', book: 'Кітапты ашу', sim: 'Симуляторды ашу', exit: 'Оралу', board: 'Ашу' })[pr.type] + ' <kbd>E</kbd>';
}

// ====================== тапсырма ======================
function openTask(p, i) {
  const t = p.tasks[i]; currentTask = { p, i, t, tries: 0, hinted: false };
  $('#tmSubj').textContent = t.s; $('#tmGrade').textContent = `${t.g} сынып`; $('#tmNum').textContent = `${i + 1}-қақпа`;
  $('#tmQ').textContent = t.t; $('#tmUnit').textContent = t.u; $('#tmReward').textContent = `Сыйлық: «${(BOOKS[p.id] || [])[i]?.n || 'Формула'}» кітабы`; $('#tmAns').value = ''; $('#tmFb').hidden = true;
  $('#taskModal').hidden = false; setTimeout(() => $('#tmAns').focus(), 50);
  say(`${p.id}_t${i}`, t.t);
}
function fb(kind, html) { const f = $('#tmFb'); f.className = 'tm-feedback ' + kind; f.innerHTML = html; f.hidden = false; }
function checkTask() {
  const ct = currentTask; if (!ct) return;
  const raw = $('#tmAns').value.trim().replace(/\s/g, '').replace(',', '.').replace('−', '-'); const v = Number(raw);
  if (raw === '' || Number.isNaN(v)) { fb('bad', 'Жауапты сан түрінде жаз (мысалы: 57,1).'); return; }
  ct.tries++;
  const ok = Math.abs(v - ct.t.a) <= (ct.t.tol || 0) + 1e-9;
  if (ok || ct.tries >= 3) {
    const pts = ok ? Math.max(2, (ct.tries === 1 ? 10 : 6) - (ct.hinted ? 2 : 0)) : 2;
    const was = Store.solved(ct.p.id).includes(ct.i);
    Store.addSolve(ct.p.id, ct.i, pts); engine.openGate(ct.i); renderWorldStars(); refreshChip(); sync.pushRecord(true);
    if (ok) { fb('ok', `<b>Дұрыс!</b> ${was ? '' : `+${pts} ұпай, +1 ★ · формула кітабы сенікі!`}<br><small>${esc(ct.t.e)}</small>`); sfx('star'); }
    else { fb('hint', `Дұрыс жауап: <b>${esc(String(ct.t.a).replace('.', ','))} ${esc(ct.t.u)}</b><br><small>${esc(ct.t.e)}</small><br>Есік ашылды (+2 ұпай). Келесі жолы өзің шешесің!`); sfx('ok'); }
    const all = Store.solved(ct.p.id).length === 3;
    setTimeout(() => { if (currentTask === ct) closeModal($('#taskModal')); if (all) { say('ui_allstars', data.ui.allstars); toast('Барлық 3 жұлдыз жиналды!'); } else if (ok) say('ui_correct', data.ui.correct); setTimeout(() => { if (inWorld === ct.p && $('#taskModal').hidden) openBook(ct.p, ct.i, true); }, 1500); }, ok ? 2200 : 4200);
    engine.markDone(new Set(Object.keys(Store.me.solved).filter(k => Store.me.solved[k].length === 3)));
    setWhere(); pushPresence();
  } else { fb('bad', `Әзірге дұрыс емес (${ct.tries}/3). ${ct.tries === 1 ? 'Кеңесті пайдаланып көр.' : 'Есептеуді қайта тексер.'}`); sfx('bad'); if (ct.tries === 1) say('ui_wrong', data.ui.wrong); }
}

// ====================== формула кітабы ======================
function openBook(p, i, gift) {
  const bk = (BOOKS[p.id] || [])[i]; if (!bk) return; const t = p.tasks[i];
  $('#bkKind').textContent = gift ? 'Сыйлық · формула кітабы ашылды!' : `${p.name} · ${i + 1}-кітап`;
  $('#bkTitle').textContent = bk.n; $('#bkFormula').textContent = bk.f;
  const m = $('#bookModal'); m.hidden = false;
  if (!bookViewer) bookViewer = new BookViewer($('#bookCanvas'));
  requestAnimationFrame(() => bookViewer.show(bk, { place: p.name, subject: t.s, grade: t.g, task: t.t, solution: t.e, answer: `${String(t.a).replace('.', ',')} ${t.u}`.trim(), no: `${p.name} · ${i + 1}-кітап`, cover: parseInt(BOOK_COLORS[i].slice(1), 16) }));
  if (gift) { sfx('star'); say('ui_book', 'Тамаша! Есік ашылды. Саған формула кітабы сыйға берілді. Кітапты айналдырып, формуланы оқы.'); }
}
addEventListener('resize', () => { if (bookViewer && !$('#bookModal').hidden) bookViewer.resize(); });

// ====================== бейне-трейлер ======================
function openTrailer(p) {
  const tr = TRAILERS[p.id]; if (!tr) return; stopVoice();
  $('#trTitle').textContent = tr[0]; $('#trKind').textContent = `Бейне-трейлер · ${p.name}`; $('#trGo').textContent = inWorld ? 'Әлемге оралу' : 'Жабу';
  $('#trailerModal').hidden = false; if (!trailer) trailer = new TrailerPlayer($('#trRoot')); trailer.load(p.id);
}
// ====================== QR-код ======================
const PAGES_URL = 'https://nygmetolla0404-oss.github.io/mathqazaq/';
function joinURL() {
  if (sync?.lan) return sync.lan + '#join';
  const h = location.hostname; const local = /^(localhost|127\.|0\.0\.0\.0)/.test(h);
  if (/^https?:$/.test(location.protocol) && !/claude|anthropic|usercontent/.test(h) && !local) return location.origin + location.pathname.replace(/index\.html$/, '') + '#join';
  return PAGES_URL + '#join';
}
function drawQR(el, size) { el.innerHTML = ''; if (!window.QRCode) { el.innerHTML = `<a href="${esc(joinURL())}">${esc(joinURL())}</a>`; return; } new window.QRCode(el, { text: joinURL(), width: size, height: size, colorDark: '#0f1b3d', colorLight: '#ffffff', correctLevel: window.QRCode.CorrectLevel.M }); }
function initQR() {
  const go = () => drawQR($('#qrSmall'), 104); if (window.QRCode) go(); else addEventListener('load', go);
  const big = () => { $('#qrModal').hidden = false; drawQR($('#qrBig'), 340); $('#qrUrl').textContent = joinURL().replace('#join', ''); };
  $('#btnQrBig').addEventListener('click', big); $('#qrSmall').addEventListener('click', big); window.__showQR = big;
}
// ====================== жиналмалы панельдер ======================
function initCollapsibles() {
  let saved = {}; try { saved = JSON.parse(localStorage.getItem('qm_collapsed') || '{}'); } catch (e) {}
  const sel = '.hero, .home-side .card, .mount-switch, .instruments, .formula, #nearestBox, .minimap, .help, .world-top, .world-guide, .world-tools';
  $$(sel).forEach((el, i) => {
    const key = 'p' + i;
    const title = el.querySelector('.eyebrow, .g-lab, .f-lab, b, h3')?.textContent?.trim() || 'Панель';
    el.classList.add('collapsible'); el.dataset.title = el.matches('.world-tools') ? 'Құралдар' : el.matches('.mount-switch') ? 'Көлік' : el.matches('.minimap') ? 'Мини-карта' : el.matches('.instruments') ? 'Аспаптар' : el.matches('.world-top') ? 'Әлем' : title.slice(0, 28);
    const b = document.createElement('button'); b.type = 'button'; b.className = 'col-btn'; b.setAttribute('aria-label', 'Жию / ашу');
    const set = (c) => { el.classList.toggle('collapsed', c); b.textContent = c ? '+' : '–'; saved[key] = c; try { localStorage.setItem('qm_collapsed', JSON.stringify(saved)); } catch (e) {} };
    b.addEventListener('click', (e) => { e.stopPropagation(); set(!el.classList.contains('collapsed')); });
    el.addEventListener('click', (e) => { if (el.classList.contains('collapsed') && e.target !== b) set(false); });
    el.appendChild(b); set(!!saved[key]);
  });
}

// ====================== симулятор ======================
function openSim(p) {
  const sim = SIMS[p.id]; if (!sim) return; simPlace = p;
  $('#simModal').hidden = false; simHandle?.destroy(); say('sim_' + p.id, `${sim.title}. ${sim.goal}`);
  simHandle = mountSim($('#simRoot'), sim, { place: p, color: Store.me?.color, char: Store.me?.char,
    onDone: () => { const me = Store.me; if (!me) return; me.sims ||= {}; if (!me.sims[p.id]) { me.sims[p.id] = 1; me.points += 8; Store.save(); sync.pushRecord(true); refreshChip(); toast('Симулятор орындалды · +8 ұпай'); engine.setStationDone(); say('ui_sim', 'Симулятор орындалды! Жарайсың, нағыз зерттеуші сияқты тәжірибе жасадың.'); } sfx('star'); },
    onLaunch3D: p.id === 'baikonur' ? (par) => { closeModal($('#simModal')); launch3D(par); } : null });
}
function launch3D(par) {
  const hud = $('#launchHud'); hud.hidden = false;
  const ok = engine.launchRocket(par, (s) => {
    if (s.cd) { $('#lhBig').textContent = String(s.cd); return; }
    if (s.fail) { $('#lhBig').textContent = 'F < mg'; toast('Зымыран көтерілмеді: тарту күші ауырлық күшінен аз!'); return; }
    if (s.end) { setTimeout(() => { hud.hidden = true; }, 2500); return; }
    $('#lhBig').textContent = `${nf(s.h / 1000, 1)} км`; $('#lhT').textContent = nf(s.t, 1); $('#lhV').textContent = nf(s.v); $('#lhH').textContent = nf(s.h); $('#lhA').textContent = nf(s.a, 1);
  });
  if (!ok) hud.hidden = true;
}
function renderAdalPage() {
  renderAdal($('#adalPage'), { me: () => Store.me, needReg: () => openReg(() => renderAdalPage()), openLab });
}
function openLab(x) {
  $('#simModal').hidden = false; simHandle?.destroy(); say('adal2_' + x.id, `${x.t}. ${x.s}`);
  simHandle = mountSim($('#simRoot'), x.sim, { place: { name: 'Адал азамат', id: 'adal_' + x.id }, color: Store.me?.color,
    onDone: () => { const m = Store.me; if (!m) return; const r = (m.adal ||= {})[x.id] ||= {}; if (!r.math) { r.math = true; m.points += 6; toast('Зертхана орындалды · +6 ұпай'); } Store.save(); sync.pushRecord(true); refreshChip(); sfx('star'); },
    onChoice: (k, good) => { const m = Store.me; if (!m) return; const r = (m.adal ||= {})[x.id] ||= { math: true }; if (r.ch == null) { r.ch = k; if (good) { m.points += 5; toast('Адал таңдау · +5 ұпай'); } } Store.save(); sync.pushRecord(true); refreshChip(); if (route === 'adal') renderAdalPage(); } });
}

// ====================== беттер ======================
function renderQuests() {
  const me = Store.me;
  $('#questGrid').innerHTML = data.places.map(p => { const n = (me?.solved?.[p.id] || []).length; const topics = [...new Set(p.tasks.map(t => t.s))];
    const M = MATH[p.id], S = SIMS[p.id], sd = !!me?.sims?.[p.id];
    return `<article class="card qcard"><div class="qtop k-${esc(p.kind)}"><p class="eyebrow">${esc({ city: 'Қала', landmark: 'Ескерткіш', nature: 'Табиғат', scientist: 'Ғалымдар' }[p.kind])} · ${esc([...new Set(p.tasks.map(t => t.g))].join(', '))} сынып</p><span class="qstars">${'★'.repeat(n)}${'☆'.repeat(3 - n)}</span></div><h3>${esc(p.name)}</h3>${M ? `<p class="qformula">${esc(M.formula)}</p>` : ''}<div class="qtopics">${topics.map(t => `<span>${esc(t)}</span>`).join('')}<span>${esc(p.value)}</span></div><div class="qprog"><span>Кітаптар <b>${n}/3</b></span><span>Симулятор <b>${sd ? '✓' : '—'}</b></span></div><p class="qformula" style="font-family:var(--f-b);font-style:normal;font-size:13px">${esc(S?.title || '')}</p><div class="btn-row" style="padding:0 18px"><button class="btn-primary sm" data-enter="${esc(p.id)}">${n === 3 ? 'Қайта кіру' : 'Порталға кіру'}</button><button class="btn-soft sm" data-trailer="${esc(p.id)}">▶ Трейлер</button></div></article>`; }).join('');
  $$('#questGrid [data-trailer]').forEach(b => b.addEventListener('click', () => openTrailer(data.places.find(p => p.id === b.dataset.trailer))));
  $$('#questGrid [data-enter]').forEach(b => b.addEventListener('click', () => enterPortal(data.places.find(p => p.id === b.dataset.enter))));
}

function renderIdea() {
  const el = $('#ideaPage'); if (el.dataset.done) return; el.dataset.done = 1;
  const sec = (id, n, title, ico, body, cls = '') => `<section class="idea-sec card ${cls}" id="idea-${id}"><div class="is-head"><span class="is-num">${n}</span><span class="is-ico">${ico}</span><h3>${title}</h3></div>${body}</section>`;
  const li = (arr) => `<ul class="checks">${arr.map(x => `<li>${x}</li>`).join('')}</ul>`;
  el.innerHTML = `
  <header class="idea-hero">
    <div class="ih-text">
      <p class="eyebrow">«Педагогикалық идеялар фестивалі» · «Шеберлік палитрасы» · физика-математика бағыты</p>
      <h2>QAZAQ MATH: Қазақстанды математикамен танимыз</h2>
      <p class="ih-lead">Таратуға лайықты педагогикалық идея: туған жердің нақты сандары арқылы математиканы 3D симулятор форматында оқыту.</p>
      <div class="ih-author"><img src="assets/author.jpg" alt="" width="56" height="56"><span><b>Тэтбенова Әсем Данатарқызы</b><small>Математика пәнінің мұғалімі · «Қарақұм жалпы білім беретін мектебі» КММ</small></span></div>
    </div>
    <dl class="ih-stats"><div><dt>18</dt><dd>3D портал-әлем</dd></div><div><dt>54</dt><dd>формула кітабы</dd></div><div><dt>18</dt><dd>симулятор</dd></div><div><dt>18</dt><dd>бейне-трейлер</dd></div><div><dt>8</dt><dd>«Адал азамат» зертханасы</dd></div><div><dt>10</dt><dd>зертхана модулі</dd></div></dl>
  </header>
  <nav class="idea-toc">${[['annot', 'Аннотация'], ['rel', 'Өзектілігі'], ['goal', 'Мақсаты'], ['tasks', 'Міндеттері'], ['new', 'Жаңалығы'], ['struct', 'Құрылымы'], ['methods', 'Әдістер'], ['values', 'Құндылықтар'], ['results', 'Нәтижелер'], ['ted', 'TEDx жоспары']].map(([k, n]) => `<button type="button" data-goto="${k}">${n}</button>`).join('')}</nav>
  <div class="idea-grid">
    ${sec('annot', '01', 'Аннотация', '✦', `<div class="lang-tabs"><button class="on" data-l="kk">Қазақша</button><button data-l="ru">Русский</button></div>
      <p data-lang="kk" class="annot">«QAZAQ MATH: Қазақстанды математикамен танимыз» — 1–11 сынып оқушыларына арналған 3D интерактивті платформа. Оқушы логинмен кіріп, өз кейіпкерін (Тамшы, Күншуақ, Жұлдыз…) таңдайды да, Қазақстанның 3D картасы бойынша атпен шауып немесе бүркітпен ұшады; аспаптар тақтасы жылдамдықты, биіктікті, жолды, уақыт пен азимутты нақты уақытта көрсетеді. 18 нысан — виртуалды әлемге ашылатын портал: оқушы ішінде сызғыш пен транспортир арқылы ғимараттың биіктігін өлшейді, үш қақпадағы есепті шешіп, сыйлыққа 3D «формула кітабын» алады, симулятормен (зымыран ұшыру, таразы, лабиринт, бәліш бөлу, еркін түсу) тәжірибе жасайды, тақырыпты қазақша бейне-трейлерден көреді. «Адал азамат» бөлімінде теңгемен қайтарым жинау, таразымен әділ бөлу, электр шотын азайту сияқты функционалдық сауаттылық зертханалары бар. Мұғалім кабинеті сыныптың онлайн картасын, әр оқушының қай жерде жүргенін және статистикасын көрсетеді.</p>
      <p data-lang="ru" class="annot" hidden>«QAZAQ MATH: познаём Казахстан через математику» — 3D интерактивная платформа для учащихся 1–11 классов. Ученик входит по логину, выбирает персонажа и путешествует по 3D-карте Казахстана на коне или беркуте; приборная панель в реальном времени показывает скорость, высоту, путь, время и азимут. 18 объектов — порталы в виртуальные миры: внутри ученик измеряет высоту здания линейкой и транспортиром, решает задачи у трёх ворот и получает в награду 3D «книгу формул», ставит опыты в симуляторе (запуск ракеты, весы, лабиринт, деление пирога, свободное падение), смотрит видеотрейлер урока на казахском языке. Раздел «Адал азамат» — лаборатории функциональной грамотности: сдача в тенге, честное деление на весах, экономия электроэнергии. Кабинет учителя показывает онлайн-карту класса, местоположение и статистику каждого ученика.</p>`, 'span2 annot-sec')}
    ${sec('rel', '02', 'Өзектілігі', '◎', `<p>PISA және ұлттық бағалау нәтижелері оқушылардың математикалық білімді өмірлік жағдаятта қолдануда қиналатынын көрсетеді. Мектепке дейінгі, орта, техникалық және кәсіптік білім беруді дамытудың 2023–2029 жылдарға арналған тұжырымдамасы цифрлық білім беру ортасын, функционалдық сауаттылықты және отаншылдық тәрбиені басым бағыт етіп белгілейді. QAZAQ MATH абстрактілі формуланы туған жердің нақты сандарымен байланыстырып, оқуға уәжді арттырады.</p>`)}
    ${sec('goal', '03', 'Мақсаты', '◆', `<p class="goal-q">Интерактивті 3D платформа арқылы Қазақстанның географиясын, тарихын, табиғаты мен мәдени мұрасын математикалық тұрғыдан зерттеп, оқушылардың қашықтықты, аумақты, масштабты, биіктікті, статистикалық көрсеткіштерді нақты деректер негізінде есептеу дағдысын дамыту.</p>`)}
    ${sec('tasks', '04', 'Міндеттері', '✓', li(['нақты деректерге негізделген, 1–11 сыныптарға сараланған 54 есеп пен 18 симулятор құру;', '3D әлем, аудиогид, бейне-трейлер және геймификация арқылы оқуға уәжді арттыру;', 'математиканы география, тарих, физика, информатика, қазақ тілімен пәнаралық байланыста оқыту;', '«Адал азамат» құндылықтарын функционалдық сауаттылық зертханалары арқылы тәрбиелеу;', 'мұғалімге логин-құпиясөзбен қорғалған мониторинг кабинетін ұсыну;', 'идеяны кез келген мектепте қолдануға болатын ашық ресурс ретінде тарату.']))}
    ${sec('new', '05', 'Жаңалығы', '★', li(['есеп оқулық бетінен 3D кеңістікке көшеді — оқушы оны «бастан кешеді»;', 'ғимараттың жанында нақты метрлік сызғыш, транспортир, өлшем сызықтары және голограмма-пішін;', 'шешілген әр есеп — 45° бұрышпен ашылатын 3D pop-up формула кітабы;', 'бір порталда бірнеше оқушы бірге жүреді, бірін-бірі көреді;', 'қазақша нейрондық дауыспен жазылған аудиогид пен трейлерлер — акцентсіз.']))}
    ${sec('struct', '06', 'Платформа құрылымы', '▦', `<div class="struct">${[['3D карта', 'ат, бүркіт, шолу; жылдамдық, биіктік, тірі формула'], ['18 портал', '3 қақпа + формула кітабы + симулятор + трейлер'], ['Зертхана', 'асық, бәліш, арқан тартыс, киіз үй — 10 модуль'], ['Адал азамат', 'теңге, таразы, сағат, физика — 8 зертхана'], ['Оқушы кабинеті', 'ұпай, жұлдыз, кітапхана, марапат'], ['Мұғалім кабинеті', 'онлайн сынып, логиндер, статистика']].map(([a, b]) => `<div><b>${a}</b><span>${b}</span></div>`).join('')}</div>`, 'span2')}
    ${sec('methods', '07', 'Әдіс-тәсілдер', '⚙', `<div class="chips-lg">${['STEM және пәнаралық интеграция', 'Геймификация', 'Жобалық және зерттеушілік оқыту', 'PISA үлгісіндегі контекстік есептер', 'Саралап оқыту', 'Қалыптастырушы бағалау', 'Виртуалды эксперимент', 'Аралас оқыту (blended learning)'].map(x => `<span>${x}</span>`).join('')}</div>`)}
    ${sec('inter', '08', 'Пәнаралық байланыс', '⇄', `<div class="inter">${[['География', 'масштаб, координата, азимут, аудан'], ['Тарих', 'хронология, Ясауи, Отырар, Абай'], ['Физика', 'жылдамдық, еркін түсу, иінтірек, энергия'], ['Информатика', 'алгоритм, лабиринт, симметрия'], ['Қазақ тілі', 'терминология, Абай өлеңінің буыны']].map(([a, b]) => `<div><b>${a}</b><span>${b}</span></div>`).join('')}</div>`)}
    ${sec('values', '09', '«Адал азамат» құндылықтары', '♥', `<div class="values">${[['🇰🇿', 'Тәуелсіздік және Отаншылдық', 'Туған жердің ескерткіштері мен табиғатын сан арқылы тану.'], ['🤝', 'Бірлік және ынтымақ', 'Ортақ картада сыныптастарымен бірге саяхат.'], ['⚖️', 'Әділдік және жауапкершілік', 'Таразымен әділ бөлу, қайтарымды адал беру.'], ['📜', 'Заң және тәртіп', 'Жол ережесі мен тежеу жолының физикасы.'], ['🛠️', 'Еңбекқорлық', 'Уақыт, жол, жұлдыз — еңбектің көрінетін нәтижесі.'], ['💡', 'Жасампаздық', 'Байқоңыр, Бәйтерек, энергия үнемдеу.']].map(([i, a, b]) => `<div><i>${i}</i><b>${a}</b>${b}</div>`).join('')}</div>`, 'span2')}
    ${sec('results', '10', 'Күтілетін нәтижелер', '↗', li(['математикалық және функционалдық сауаттылықтың артуы;', 'нақты деректерді талдау, модельдеу, бағалау дағдыларының қалыптасуы;', 'оқуға уәж бен белсенділіктің өсуі (уақыт, ұпай, жұлдыз көрсеткіштері);', 'туған жерге құрмет пен «Адал азамат» құндылықтарының бекуі.']))}
    ${sec('eff', '11', 'Тиімділікті бағалау', '◷', li(['мұғалім кабинетіндегі деректер: шешілген есеп, кеңес саны, уақыт, жұлдыз;', 'енгізуге дейінгі және кейінгі диагностикалық жұмыстарды салыстыру;', 'оқушылар рефлексиясы мен сауалнама;', 'ашық сабақ және тәжірибе алмасу.']))}
    ${sec('spread', '12', 'Таратуға лайықтылығы', '⇪', `<p>Платформа браузерде жұмыс істейді, орнатуды қажет етпейді. Интернет болмаса, мұғалім ноутбугында «server.py» іске қосылып, сынып Wi-Fi желісінде жұмыс істейді: оқушылар өз логинімен кіріп, бірін-бірі картада және порталда көреді. Деректер жинағы ашық — кез келген мұғалім өз өңірінің нысандары мен есептерін қоса алады.</p>`, 'span2')}
    ${sec('ted', '13', 'TEDx форматындағы баяндама (7 минут)', '▶', `<ol class="ted">${[['0:00–1:00', 'Ілмек: «Бәйтерек неге 97 метр?» — залға сұрақ, жауап — 1997 жыл.'], ['1:00–2:00', 'Мәселе: оқушы формуланы біледі, бірақ өмірмен байланыстырмайды.'], ['2:00–4:00', 'Тікелей демонстрация: атпен шабу, бүркітпен ұшу, порталға кіру, сызғышпен өлшеу, қақпа ашылып формула кітабы шығады.'], ['4:00–5:30', 'Нәтиже: мұғалім кабинетінің деректері, «Адал азамат» зертханалары, оқушылар пікірі.'], ['5:30–7:00', 'Тарату: кез келген мектепке қалай енгізуге болады; қорытынды — «Елімізді есеппен, біліммен ашамыз!»']].map(([a, b]) => `<li><span>${a}</span><div>${b}</div></li>`).join('')}</ol>`, 'span2')}
  </div>`;
  $$('.lang-tabs button', el).forEach(b => b.addEventListener('click', () => { $$('.lang-tabs button', el).forEach(x => x.classList.toggle('on', x === b)); $$('[data-lang]', el).forEach(p => { p.hidden = p.dataset.lang !== b.dataset.l; }); }));
  $$('[data-goto]', el).forEach(b => b.addEventListener('click', () => $('#idea-' + b.dataset.goto)?.scrollIntoView({ behavior: 'smooth', block: 'start' })));
}

function renderAuthor() {
  const el = $('#authorPage'); if (el.dataset.done) return; el.dataset.done = 1;
  el.innerHTML = `
  <header class="page-head"><p class="eyebrow">Жоба авторы</p></header>
  <article class="glass author-card">
    <div class="author-photo"><img src="assets/author.jpg" alt="Тэтбенова Әсем Данатарқызы" width="700" height="882"></div>
    <div>
      <h2>Тэтбенова Әсем Данатарқызы</h2>
      <dl class="author-meta">
        <dt>Пәні</dt><dd>Математика</dd>
        <dt>Мектебі</dt><dd>«Қарақұм жалпы білім беретін мектебі» КММ</dd>
        <dt>Жоба</dt><dd>QAZAQ MATH: Қазақстанды математикамен танимыз</dd>
        <dt>Бағыты</dt><dd>«Шеберлік палитрасы» — физика-математика бағытындағы пәндер</dd>
      </dl>
      <p>Математика пәнінің мұғалімі. Сабақтарында цифрлық технологияларды, STEM тәсілін және геймификацияны қолданып, оқушылардың математикалық және функционалдық сауаттылығын дамытуға ұмтылады.</p>
      <p>QAZAQ MATH платформасының идеясы — математиканы оқушыға жақын, түсінікті әрі қызықты ету: формулаларды туған жердің нақты сандарымен байланыстыру, есеп шығару арқылы Қазақстанның тарихын, табиғатын және мәдениетін тану, сонымен бірге «Адал азамат» құндылықтарын тәрбиелеу.</p>
      <blockquote class="note">«Математика — табиғаттың тілі. Ал біз сол тіл арқылы өз Отанымызды танимыз.»</blockquote>
    </div>
  </article>`;
}

const BADGES = [
  { id: 'first', i: '🌱', n: 'Алғашқы қадам', d: 'Бірінші есепті шештің', ok: m => m.stars >= 1 },
  { id: 'geo', i: '📐', n: 'Геометр', d: '5 геометрия есебі', ok: m => countSubj(m, 'Геометрия') >= 5 },
  { id: 'phys', i: '⚡', n: 'Физик', d: '3 физика есебі', ok: m => countSubj(m, 'Физика') >= 3 },
  { id: 'trav', i: '🧭', n: 'Саяхатшы', d: '5 әлемге кірдің', ok: m => (m.visited || []).length >= 5 },
  { id: 'star', i: '🌟', n: 'Жұлдызшы', d: '15 жұлдыз', ok: m => m.stars >= 15 },
  { id: 'adal', i: '🤝', n: 'Адал азамат', d: '6 жұлдыз, кеңессіз', ok: m => m.stars >= 6 && !m.hints },
  { id: 'lab', i: '🧪', n: 'Зертханашы', d: 'Зертханада 20 ұпай', ok: m => (m.labPts || 0) >= 20 },
  { id: 'road', i: '🐎', n: 'Ұзақ жол', d: '1000 км жол жүрдің', ok: m => (m.km || 0) >= 1000 },
  { id: 'sim', i: '🚀', n: 'Симулятор шебері', d: '5 симулятор орындадың', ok: m => Object.keys(m.sims || {}).length >= 5 },
  { id: 'lib', i: '📚', n: 'Кітапхана иесі', d: '10 формула кітабы', ok: m => m.stars >= 10 },
  { id: 'adal2', i: '⚖️', n: 'Адалдық үлгісі', d: '«Адал азамат» — 6 адал таңдау', ok: m => Object.values(m.adal || {}).filter(r => r.ch === 0).length >= 6 },
];
function countSubj(m, s) { let c = 0; for (const p of data.places) for (const i of (m.solved?.[p.id] || [])) if (p.tasks[i].s === s) c++; return c; }
const fmtTime = (s) => { s = Math.round(s || 0); const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60); return h ? `${h} сағ ${m} мин` : `${m} мин ${s % 60} с`; };

function renderCabinet() {
  const el = $('#cabinetPage'); const me = Store.me;
  if (!me) { el.innerHTML = `<header class="page-head"><p class="eyebrow">Оқушы кабинеті</p><h2>Жүйеге кір</h2><p class="lead">Кабинетті ашу үшін логин мен құпиясөзбен кір немесе тіркел.</p></header><div class="btn-row"><button class="btn-primary big" id="cabReg">Кіру</button><button class="btn-soft big" id="cabNew">Тіркелу</button></div>`; $('#cabReg').onclick = () => openReg(() => renderCabinet()); $('#cabNew').onclick = () => openReg(() => renderCabinet(), 'register'); return; }
  const others = Object.values(Store.profiles).filter(p => p.sid !== me.sid);
  const sims = Object.keys(me.sims || {}).length, adalN = Object.values(me.adal || {}).filter(r => r.ch != null).length;
  const books = []; for (const p of data.places) (BOOKS[p.id] || []).forEach((b, i) => books.push({ p, i, b, got: (me.solved[p.id] || []).includes(i) }));
  const got = books.filter(b => b.got);
  el.innerHTML = `
  <section class="card cab-top"><div class="big-avatar">${charFace(me.char, me.color, 72)}</div><div><p class="eyebrow">Оқушы кабинеті</p><h2>${esc(me.first)} ${esc(me.last)}</h2><p class="lead">${esc(me.cls)} сынып · ${esc((CHARACTERS.find(c => c.id === me.char) || {}).name || '')} · ${esc(me.where || '')}</p></div></section>
  <div class="stat-row">
    <div class="card stat"><b>${nf(me.points)}</b><span>Ұпай</span></div>
    <div class="card stat"><b>${me.stars}</b><span>Жұлдыз</span></div>
    <div class="card stat"><b>${got.length}/${books.length}</b><span>Формула кітабы</span></div>
    <div class="card stat"><b>${sims}/18</b><span>Симулятор</span></div>
    <div class="card stat"><b>${adalN}/${ADAL.length}</b><span>Адал азамат</span></div>
    <div class="card stat"><b>${fmtTime(me.timeSec)}</b><span>Платформада · ${nf(me.km || 0)} км</span></div>
  </div>
  <div class="cab-sec"><h3>Формулалар кітапханасы</h3><small>Кітапты басып, 3D-де аш</small></div>
  <div class="library">${got.map(x => `<button class="lbook" style="--bc:${BOOK_COLORS[x.i]}" data-bk="${esc(x.p.id)}:${x.i}"><small>${esc(x.p.name)}</small><b>${esc(x.b.n)}</b><i>${esc(x.b.f)}</i></button>`).join('')}${books.filter(b => !b.got).slice(0, Math.max(0, 6 - got.length)).map(x => `<div class="lbook locked"><small>${esc(x.p.name)}</small><b>?</b><i>${x.i + 1}-қақпа</i></div>`).join('')}</div>
  <div class="cab-sec"><h3>Марапаттар</h3></div><div class="badges">${BADGES.map(b => `<div class="badge ${b.ok(me) ? 'on' : ''}"><i>${b.i}</i><span><b>${esc(b.n)}</b><br><small>${esc(b.d)}</small></span></div>`).join('')}</div>
  <div class="cab-sec"><h3>Әлемдер бойынша прогресс</h3></div><div class="progress-list">${data.places.map(p => { const n = (me.solved[p.id] || []).length; return `<div><span>${esc(p.name)}</span><span class="st">${'★'.repeat(n)}${'☆'.repeat(3 - n)}${me.sims?.[p.id] ? ' · ✓' : ''}</span></div>`; }).join('')}</div>
  <div class="cab-sec"><h3>Профиль</h3><small>Логин: <b>${esc(me.login || '—')}</b></small></div><div class="btn-row"><button class="btn-soft" id="cabOut">Жүйеден шығу</button></div>`;
  $('#cabOut').onclick = logout;
  $$('[data-bk]', el).forEach(b => b.onclick = () => { const [id, i] = b.dataset.bk.split(':'); openBook(data.places.find(p => p.id === id), +i, false); });
}

// ====================== МҰҒАЛІМ КАБИНЕТІ ======================
let tAccs = null, tCls = 'all';
async function loadAccs() { await accountsReady; tAccs = await accounts.list(teacherHash).catch(() => []); return tAccs; }
function tMerged() {
  const recs = (sync ? sync.list() : []).filter(s => s.sid); const by = new Map(recs.map(r => [r.sid, r]));
  for (const a of tAccs || []) if (a.sid && !by.has(a.sid)) by.set(a.sid, { sid: a.sid, first: a.first, last: a.last, name: `${a.first} ${a.last}`, cls: a.cls, char: a.char, color: a.color, points: 0, stars: 0, online: false, never: true });
  const accBySid = new Map((tAccs || []).map(a => [a.sid, a]));
  return [...by.values()].map(r => ({ ...r, login: accBySid.get(r.sid)?.login || r.login || '', name: r.name || `${r.first || ''} ${r.last || ''}`.trim() }));
}
const placeName = (id) => data.places.find(p => p.id === id)?.name || id;
function renderTeacher() {
  const el = $('#teacherPage');
  if (!teacherHash) {
    el.innerHTML = `<section class="t-login card"><div class="t-login-ico">${charFace('zhuldyz', '#c8963e', 64)}</div><div><p class="eyebrow">Мұғалім кабинеті</p><h2>Тек мұғалімге арналған</h2><p class="lead">Оқушылардың онлайн күйі, қай жерде жүргені, статистикасы, логин мен құпиясөздер — барлығы осында.</p><div class="btn-row" style="margin-top:18px"><button class="btn-primary big" id="tGo">Мұғалім ретінде кіру</button></div></div></section>`;
    $('#tGo').onclick = () => openReg(null, 'teacher'); return;
  }
  if (!tAccs) { el.innerHTML = '<p class="lead" style="padding-top:120px">Жүктелуде…</p>'; loadAccs().then(renderTeacher); return; }
  const all = tMerged(); const classes = [...new Set(all.map(s => s.cls).filter(Boolean))].sort();
  const rows = all.filter(s => tCls === 'all' || s.cls === tCls);
  const online = rows.filter(s => s.online); const mode = sync?.mode || 'local';
  const tabs = [['online', 'Онлайн сынып'], ['students', 'Оқушылар мен логиндер'], ['stats', 'Статистика'], ['settings', 'Баптаулар']];
  el.innerHTML = `
  <header class="t-head"><div><p class="eyebrow">Мұғалім кабинеті · ${esc(ADMIN_LOGIN)}</p><h2>Сынып бөлмесі</h2></div>
    <div class="t-head-r"><button class="btn-soft sm" id="tQr" type="button">QR-код (сыныпқа)</button><label class="t-cls">Сынып <select id="tCls"><option value="all">Барлығы</option>${classes.map(c => `<option ${c === tCls ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select></label><button class="btn-soft sm" id="tOut">Шығу</button></div></header>
  <div class="t-kpis"><div><b>${online.length}</b><span>қазір онлайн</span></div><div><b>${rows.length}</b><span>оқушы</span></div><div><b>${online.filter(s => s.presence?.view === 'map').length}</b><span>картада</span></div><div><b>${online.filter(s => s.presence?.view === 'world').length}</b><span>порталда</span></div><div><b>${rows.length ? nf(rows.reduce((a, s) => a + (s.points || 0), 0) / rows.length) : 0}</b><span>орташа ұпай</span></div></div>
  <nav class="t-tabs">${tabs.map(([k, n]) => `<button type="button" data-tt="${k}" class="${tTab === k ? 'on' : ''}">${n}</button>`).join('')}</nav>
  <div id="tBody"></div>
  <p class="note" style="margin-top:18px">${mode === 'server' ? 'Сынып желісі режимі: деректер мұғалім компьютеріндегі «data» бумасында сақталады.' : mode === 'artifact' ? 'Онлайн бөлме режимі: деректер осы беттің ортақ базасында сақталады.' : 'Бір құрылғы режимі: тек осы браузердегі деректер көрінеді. Бүкіл сынып үшін «server.py» іске қосыңыз.'}</p>`;
  $('#tCls').onchange = (e) => { tCls = e.target.value; renderTeacher(); };
  $('#tQr').onclick = () => window.__showQR?.();
  $('#tOut').onclick = () => { teacherHash = null; tAccs = null; try { localStorage.removeItem('qm_teacher'); } catch (e) {} renderTeacher(); };
  $$('[data-tt]', el).forEach(b => b.onclick = () => { tTab = b.dataset.tt; if (tTab === 'students') tAccs = null; renderTeacher(); });
  const body = $('#tBody');
  if (tTab === 'online') tOnline(body, rows); else if (tTab === 'students') tStudents(body, rows); else if (tTab === 'stats') tStats(body, rows); else tSettings(body);
}
function whereText(s) {
  const q = s.presence; if (!s.online) return s.never ? 'Әлі кірмеген' : 'Офлайн · ' + ago(s.lastSeen);
  if (q?.view === 'world') return `Порталда: ${placeName(q.world)} · ${q.wm === 'eagle' ? 'бүркітпен' : 'атпен'}`;
  return s.where || ({ map: 'Картада', lab: 'Зертханада', adal: 'Адал азамат' })[q?.view] || 'Онлайн';
}
function tOnline(body, rows) {
  rows = [...rows].sort((a, b) => (b.online - a.online) || (b.points || 0) - (a.points || 0));
  if (!tSel || !rows.some(r => r.sid === tSel)) tSel = rows.find(r => r.online)?.sid || rows[0]?.sid || null;
  const sel = rows.find(r => r.sid === tSel);
  body.innerHTML = `<div class="t-grid"><section class="classroom"><div class="board">QAZAQ MATH · ${new Date().toLocaleDateString('kk-KZ')} · онлайн: ${rows.filter(r => r.online).length}</div>
    <div class="desks">${rows.length ? rows.map(s => `<button type="button" class="desk ${s.online ? 'online' : ''} ${s.sid === tSel ? 'sel' : ''}" data-sel="${esc(s.sid)}"><span class="stu">${charFace(s.char, s.color, 38)}</span><b>${esc(s.name)}</b><small>${esc(s.cls || '')}</small><span class="doing">${esc(whereText(s))}</span><span class="dstats"><span>★ ${s.stars || 0}</span><span>${nf(s.points || 0)} ұпай</span></span></button>`).join('') : '<div class="desk empty"><b>Оқушылар жоқ</b><span class="doing">«Оқушылар мен логиндер» бетінде қосыңыз</span></div>'}</div></section>
    <aside class="t-detail card">${sel ? tDetail(sel) : '<p class="lead">Оқушыны таңдаңыз</p>'}</aside></div>`;
  $$('[data-sel]', body).forEach(b => b.onclick = () => { tSel = b.dataset.sel; renderTeacher(); });
  const cv = $('#tMap', body); if (cv) tDrawMap(cv, rows, sel);
}
function tDetail(s) {
  const q = s.presence || {}; const books = Object.values(s.solved || {}).reduce((a, x) => a + x.length, 0);
  return `<div class="td-top"><span class="big-avatar">${charFace(s.char, s.color, 64)}</span><div><h3>${esc(s.name)}</h3><p>${esc(s.cls || '')} сынып · логин <b>${esc(s.login || '—')}</b></p><p class="td-st ${s.online ? 'on' : ''}"><i></i>${s.online ? 'Онлайн' : 'Офлайн'}</p></div></div>
    <div class="td-where"><span class="g-lab">Қазір</span><b>${esc(whereText(s))}</b>${q.view === 'world' ? `<small>Әлемдегі орны: x ${nf(q.wx || 0)}, z ${nf(q.wz || 0)}${q.wy > 1 ? `, биіктік ${nf(q.wy)}` : ''}</small>` : ''}</div>
    <canvas id="tMap" width="440" height="250" aria-label="Оқушылардың картадағы орны"></canvas>
    <div class="td-kpi"><div><b>${nf(s.points || 0)}</b><span>ұпай</span></div><div><b>${s.stars || 0}</b><span>жұлдыз</span></div><div><b>${books}/54</b><span>кітап</span></div><div><b>${s.simsN || 0}/18</b><span>симулятор</span></div><div><b>${s.adalN || 0}/8</b><span>Адал азамат</span></div><div><b>${esc(fmtTime(s.timeSec))}</b><span>уақыт</span></div></div>
    <span class="g-lab">Әлемдер бойынша</span><div class="td-worlds">${data.places.map(p => { const n = (s.solved?.[p.id] || []).length; return `<span class="tw n${n}" title="${esc(p.name)}: ${n}/3">${esc(p.name.split(' ')[0])}<i>${'★'.repeat(n)}</i></span>`; }).join('')}</div>
    <p class="td-small">Кеңес алған: ${s.hints || 0} рет · жол: ${nf(s.km || 0)} км · соңғы белсенділік: ${esc(ago(s.lastSeen))}</p>`;
}
function tDrawMap(cv, rows, sel) {
  const g = cv.getContext('2d'); const W = cv.width, H = cv.height; const tx = lon => 10 + (lon - 46) / 42 * (W - 20), ty = lat => H - 10 - (lat - 40.3) / 15.4 * (H - 20);
  g.clearRect(0, 0, W, H); g.beginPath(); data.border.forEach(([lo, la], i) => i ? g.lineTo(tx(lo), ty(la)) : g.moveTo(tx(lo), ty(la))); g.closePath(); g.fillStyle = '#f6efe0'; g.fill(); g.strokeStyle = '#c8963e'; g.lineWidth = 2; g.stroke();
  for (const p of data.places) { g.fillStyle = '#9aa6bd'; g.beginPath(); g.arc(tx(p.lon), ty(p.lat), 2.5, 0, 7); g.fill(); }
  for (const r of rows) { if (!r.online) continue; const q = r.presence || {}; let lon, lat;
    if (q.view === 'world') { const pl = data.places.find(p => p.id === q.world); if (!pl) continue; lon = pl.lon; lat = pl.lat; }
    else if (q.x != null) { lon = q.x / (6 * Math.cos(48 * Math.PI / 180)) + 67; lat = -q.z / 6 + 48; } else continue;
    const me = sel && r.sid === sel.sid; g.fillStyle = r.color || '#0f8b8d'; g.beginPath(); g.arc(tx(lon), ty(lat), me ? 8 : 5, 0, 7); g.fill(); if (me) { g.strokeStyle = '#0f1b3d'; g.lineWidth = 3; g.stroke(); g.font = '700 12px Montserrat, sans-serif'; g.fillStyle = '#0f1b3d'; g.fillText(r.first || r.name, tx(lon) + 10, ty(lat) - 8); } }
}
function tStudents(body, rows) {
  body.innerHTML = `<div class="t-two">
    <section class="card t-add"><h3>Оқушы қосу</h3>
      <form id="tAddOne" class="t-form"><input id="tF" placeholder="Аты" required maxlength="20"><input id="tL" placeholder="Тегі" required maxlength="24"><select id="tG">${[1,2,3,4,5,6,7,8,9,10,11].map(n => `<option ${n === 7 ? 'selected' : ''}>${n}</option>`).join('')}</select><select id="tLt">${['А','Ә','Б','В','Г','Д'].map(x => `<option>${x}</option>`).join('')}</select><button class="btn-primary sm" type="submit">Қосу</button></form>
      <h3 style="margin-top:18px">Тізіммен қосу</h3><p class="td-small">Әр жолға бір оқушы: «Аты Тегі». Сынып жоғарыдағы таңдаудан алынады.</p>
      <textarea id="tBulk" rows="5" placeholder="Әлихан Сәрсенов&#10;Аружан Тәжібаева"></textarea><button class="btn-soft sm" id="tBulkGo" type="button">Барлығына логин жасау</button>
      <p class="auth-err" id="tAddErr"></p></section>
    <section class="card t-creds print-area"><div class="cab-sec" style="margin:0 0 10px"><h3>Жаңа логиндер мен құпиясөздер</h3><span class="btn-row"><button class="btn-soft sm" id="tCopy" type="button">Көшіру</button><button class="btn-soft sm" id="tPrint" type="button">Басып шығару</button></span></div>
      ${newCreds.length ? `<div class="cred-grid">${newCreds.map(c => `<div class="cred"><b>${esc(c.name)}</b><small>${esc(c.cls)}</small><span>Логин: <code>${esc(c.login)}</code></span><span>Құпиясөз: <code>${esc(c.pw)}</code></span></div>`).join('')}</div>` : '<p class="td-small">Оқушы қосқанда немесе құпиясөзін жаңартқанда, мұнда логин мен құпиясөз көрсетіледі. Құпиясөз тек бір рет көрінеді — көшіріп немесе басып шығарып алыңыз.</p>'}</section></div>
  <div class="tbl-wrap card" style="margin-top:16px"><table class="tbl"><thead><tr><th>Оқушы</th><th>Логин</th><th>Сынып</th><th>Күйі</th><th>Ұпай</th><th>Жұлдыз</th><th>Уақыт</th><th></th></tr></thead><tbody>
    ${rows.map(s => `<tr><td>${esc(s.name)}</td><td><code>${esc(s.login || '—')}</code></td><td>${esc(s.cls || '')}</td><td><span class="on-dot ${s.online ? 'on' : ''}"></span>${s.online ? 'онлайн' : s.never ? 'кірмеген' : esc(ago(s.lastSeen))}</td><td>${nf(s.points || 0)}</td><td>${s.stars || 0}</td><td>${esc(fmtTime(s.timeSec))}</td><td class="t-act">${s.login ? `<button class="btn-soft sm" data-pw="${esc(s.login)}" data-nm="${esc(s.name)}" data-cl="${esc(s.cls || '')}">Жаңа құпиясөз</button><button class="btn-soft sm danger" data-del="${esc(s.login)}" data-nm="${esc(s.name)}">Жою</button>` : '<small>логинсіз</small>'}</td></tr>`).join('') || '<tr><td colspan="8">Оқушылар жоқ</td></tr>'}</tbody></table></div>`;
  const cls = () => `${$('#tG').value} «${$('#tLt').value}»`;
  $('#tAddOne').onsubmit = async (e) => { e.preventDefault(); await tCreate($('#tF').value.trim(), $('#tL').value.trim(), cls()); $('#tF').value = ''; $('#tL').value = ''; };
  $('#tBulkGo').onclick = async () => { const lines = $('#tBulk').value.split('\n').map(x => x.trim()).filter(Boolean); for (const ln of lines) { const [f, ...l] = ln.split(/\s+/); await tCreate(f, l.join(' ') || '—', cls(), true); } $('#tBulk').value = ''; tAccs = null; renderTeacher(); };
  $('#tCopy').onclick = () => { const t = ['Аты-жөні\tСынып\tЛогин\tҚұпиясөз', ...newCreds.map(c => `${c.name}\t${c.cls}\t${c.login}\t${c.pw}`)].join('\n'); navigator.clipboard?.writeText(t).then(() => toast('Көшірілді — Excel-ге қойыңыз'), () => toast('Көшіру мүмкін болмады')); };
  $('#tPrint').onclick = () => { document.body.classList.add('printing'); window.print(); setTimeout(() => document.body.classList.remove('printing'), 500); };
  $$('[data-pw]', body).forEach(b => b.onclick = async () => { const pw = genPassword(); const r = await accounts.resetPassword(b.dataset.pw, pw, teacherHash); if (r?.ok) { newCreds.unshift({ name: b.dataset.nm, cls: b.dataset.cl, login: b.dataset.pw, pw }); toast('Жаңа құпиясөз жасалды'); renderTeacher(); } else toast('Сәтсіз'); });
  $$('[data-del]', body).forEach(b => b.onclick = async () => { if (!confirm(`${b.dataset.nm} оқушысын және оның барлық нәтижесін жою керек пе?`)) return; await accounts.remove(b.dataset.del, teacherHash); tAccs = null; toast('Оқушы жойылды'); renderTeacher(); });
}
async function tCreate(first, last, cls, silent) {
  const err = $('#tAddErr'); if (!first) return; await accountsReady; if (!tAccs) await loadAccs();
  const base = ([translit(first), translit(last)].filter(Boolean).join('.') || 'oqushy').slice(0, 20); let login = base, k = 1;
  while (tAccs.some(a => a.login === login)) login = base + (++k);
  const pw = genPassword(); const sid = 's' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
  const acc = { login, first, last, cls, char: CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)].id, color: COLORS[Math.floor(Math.random() * COLORS.length)], sid, createdAt: Date.now() };
  const r = await accounts.register(acc, pw, teacherHash); if (!r?.ok) { if (err) err.textContent = r?.err || 'Қосу мүмкін болмады'; return; }
  tAccs.push(acc); newCreds.unshift({ name: `${first} ${last}`, cls, login, pw }); if (!silent) { toast(`${first} қосылды · логин ${login}`); renderTeacher(); }
}
function tStats(body, rows) {
  const by = {}; for (const s of rows) { const c = s.cls || '—'; (by[c] ||= []).push(s); }
  const top = [...rows].sort((a, b) => (b.points || 0) - (a.points || 0)).slice(0, 10); const max = Math.max(1, ...top.map(s => s.points || 0));
  const wdone = data.places.map(p => ({ p, n: rows.filter(s => (s.solved?.[p.id] || []).length === 3).length, any: rows.filter(s => (s.solved?.[p.id] || []).length > 0).length }));
  body.innerHTML = `<div class="t-two">
    <section class="card"><h3>Үздік 10 оқушы</h3><div class="bars">${top.map(s => `<div class="bar"><span>${esc(s.name)}</span><i style="--w:${(s.points || 0) / max * 100}%;--c:${esc(s.color || '#0f8b8d')}"></i><b>${nf(s.points || 0)}</b></div>`).join('') || '<p class="td-small">Деректер жоқ</p>'}</div></section>
    <section class="card"><h3>Сыныптар бойынша</h3><table class="tbl"><thead><tr><th>Сынып</th><th>Оқушы</th><th>Орт. ұпай</th><th>Орт. жұлдыз</th><th>Жалпы уақыт</th></tr></thead><tbody>${Object.entries(by).map(([c, a]) => `<tr><td>${esc(c)}</td><td>${a.length}</td><td>${nf(a.reduce((x, s) => x + (s.points || 0), 0) / a.length)}</td><td>${nf(a.reduce((x, s) => x + (s.stars || 0), 0) / a.length, 1)}</td><td>${esc(fmtTime(a.reduce((x, s) => x + (s.timeSec || 0), 0)))}</td></tr>`).join('')}</tbody></table></section></div>
  <section class="card" style="margin-top:16px"><h3>Әлемдер: бастаған / толық аяқтаған оқушылар</h3><div class="bars worlds">${wdone.map(w => `<div class="bar"><span>${esc(w.p.name)}</span><i style="--w:${rows.length ? w.any / rows.length * 100 : 0}%;--c:#f0b432"><em style="width:${w.any ? w.n / w.any * 100 : 0}%"></em></i><b>${w.n}/${w.any}</b></div>`).join('')}</div><p class="td-small">Сары — бастағандар, жасыл — 3/3 жұлдыз алғандар. Қиын әлемдерді осыдан көресіз.</p></section>`;
}
function tSettings(body) {
  body.innerHTML = `<section class="card t-set"><h3>Мұғалім құпиясөзін өзгерту</h3><form id="tPwF" class="t-form"><input type="password" id="tP1" placeholder="Жаңа құпиясөз" minlength="6" required autocomplete="new-password"><input type="password" id="tP2" placeholder="Қайталаңыз" minlength="6" required autocomplete="new-password"><button class="btn-primary sm" type="submit">Сақтау</button></form><p class="auth-err" id="tPwErr"></p>
    <h3 style="margin-top:20px">Деректерді экспорттау</h3><div class="btn-row"><button class="btn-soft sm" id="tExp">Барлық статистиканы көшіру (Excel)</button>${sync?.mode === 'server' ? '<a class="btn-soft sm" href="api/export.csv" target="_blank" rel="noopener">CSV жүктеу</a>' : ''}</div></section>`;
  $('#tPwF').onsubmit = async (e) => { e.preventDefault(); const a = $('#tP1').value, b = $('#tP2').value; if (a !== b) { $('#tPwErr').textContent = 'Құпиясөздер сәйкес емес'; return; } const h = await accounts.setAdminPassword(a, teacherHash); if (h) { teacherHash = h; try { localStorage.setItem('qm_teacher', h); } catch (e2) {} $('#tPwErr').textContent = ''; toast('Құпиясөз өзгертілді'); } else $('#tPwErr').textContent = 'Сақтау мүмкін болмады'; };
  $('#tExp').onclick = () => { const rows = tMerged(); const tsv = ['Оқушы\tЛогин\tСынып\tУақыт (мин)\tҰпай\tЖұлдыз\tСимулятор\tАдал азамат\tКм', ...rows.map(s => [s.name, s.login, s.cls, Math.round((s.timeSec || 0) / 60), s.points || 0, s.stars || 0, s.simsN || 0, s.adalN || 0, Math.round(s.km || 0)].join('\t'))].join('\n'); navigator.clipboard?.writeText(tsv).then(() => toast('Көшірілді'), () => toast('Көшіру мүмкін болмады')); };
}

function ago(t) { if (!t) return '—'; const s = (Date.now() - t) / 1000; if (s < 60) return 'жаңа ғана'; if (s < 3600) return `${Math.round(s / 60)} мин бұрын`; if (s < 86400) return `${Math.round(s / 3600)} сағ бұрын`; return `${Math.round(s / 86400)} күн бұрын`; }
