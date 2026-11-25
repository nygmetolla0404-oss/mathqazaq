// Оқушы профилі, прогресс және құрылғылар арасындағы синхрондау.
// Режимдер: 'server' (server.py — сынып желісі), 'artifact' (claude.ai: room + db), 'local' (бір құрылғы + қойындылар).
const LS = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
};
const uid = () => 's' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

export const Store = {
  profiles: LS.get('qm_profiles', {}),   // sid -> record (осы құрылғыдағы барлық оқушылар)
  sid: LS.get('qm_current', null),
  get me() { return this.sid ? this.profiles[this.sid] : null; },
  register({ first, last, cls, color, char }) {
    const sid = uid();
    this.profiles[sid] = { sid, first, last, cls, color, char, points: 0, stars: 0, solved: {}, sims: {}, adal: {}, hints: 0, timeSec: 0, km: 0, visited: [], createdAt: Date.now(), lastSeen: Date.now(), where: 'Басты бет', badges: [] };
    this.sid = sid; this.save(); return this.me;
  },
  switchTo(sid) { if (this.profiles[sid]) { this.sid = sid; this.save(); } },
  save() { LS.set('qm_profiles', this.profiles); LS.set('qm_current', this.sid); },
  solved(placeId) { return (this.me?.solved?.[placeId]) || []; },
  addSolve(placeId, idx, pts) {
    const m = this.me; if (!m) return;
    const arr = m.solved[placeId] || (m.solved[placeId] = []);
    if (!arr.includes(idx)) { arr.push(idx); m.stars += 1; m.points += pts; }
    this.save();
  },
  visit(placeId) { const m = this.me; if (m && !m.visited.includes(placeId)) { m.visited.push(placeId); this.save(); } },
};

export function publicRecord(m) {
  if (!m) return null;
  return { sid: m.sid, first: m.first, last: m.last, cls: m.cls, color: m.color, char: m.char, points: m.points, stars: m.stars, solved: m.solved, timeSec: Math.round(m.timeSec), km: Math.round(m.km), visited: m.visited, hints: m.hints, where: m.where, simsN: Object.keys(m.sims || {}).length, adalN: Object.values(m.adal || {}).filter(r => r.ch != null).length, lastSeen: Date.now() };
}

export class Sync {
  constructor() { this.mode = 'local'; this.records = new Map(); this.presence = new Map(); this.listeners = []; this.myPresence = {}; this.lastRecJSON = ''; }
  on(cb) { this.listeners.push(cb); }
  emit() { for (const cb of this.listeners) cb(this.list()); }
  list() {
    const out = new Map();
    for (const [sid, r] of this.records) out.set(sid, { ...r, online: false });
    for (const [sid, p] of this.presence) { const r = out.get(sid) || { sid, first: p.name, last: '', cls: p.cls, color: p.color, char: p.char, points: p.points, stars: p.stars }; out.set(sid, { ...r, presence: p, online: true, where: p.where || r.where, points: Math.max(r.points || 0, p.points || 0), stars: Math.max(r.stars || 0, p.stars || 0) }); }
    return [...out.values()].map(r => ({ ...r, name: `${r.first || ''} ${r.last || ''}`.trim() }));
  }
  async start(getRecord) {
    this.getRecord = getRecord;
    // жергілікті: осы құрылғыдағы профильдер + басқа қойындылар
    for (const r of Object.values(Store.profiles)) this.records.set(r.sid, r);
    try {
      this.bc = new BroadcastChannel('qazaqmath');
      this.bc.onmessage = (e) => { const d = e.data; if (d?.presence) { this.presence.set(d.presence.sid, { ...d.presence, _t: Date.now() }); this.emit(); } if (d?.record) { this.records.set(d.record.sid, d.record); this.emit(); } };
      setInterval(() => { const now = Date.now(); let ch = false; for (const [sid, p] of this.presence) if (p._t && now - p._t > 8000) { this.presence.delete(sid); ch = true; } if (ch) this.emit(); }, 3000);
    } catch (e) {}
    // 1) сынып сервері
    try {
      const ctl = new AbortController(); const tm = setTimeout(() => ctl.abort(), 1500);
      const r = await fetch('api/ping', { signal: ctl.signal }); clearTimeout(tm);
      const pj = r.ok ? await r.json() : null; if (pj?.ok) { this.lan = pj.lan; this.mode = 'server'; this.serverLoop(); return this.mode; }
    } catch (e) {}
    // 2) claude.ai артефакт
    if (window.claude?.use) {
      const [room, db] = await Promise.all([window.claude.use('room').catch(() => null), window.claude.use('db').catch(() => null)]);
      if (room || db) { this.mode = 'artifact'; this.room = room; this.db = db; this.artifactInit(); return this.mode; }
    }
    this.mode = 'local'; return this.mode;
  }
  setPresence(p) {
    this.myPresence = { ...this.myPresence, ...p, t: Date.now() };
    const me = this.myPresence; if (me.sid) { this.presence.set(me.sid, { ...me, _t: Date.now() }); }
    const now = Date.now(); if (now - (this._pT || 0) < 180) { clearTimeout(this._pTm); this._pTm = setTimeout(() => this.setPresence({}), 200); return; }
    this._pT = now;
    try { this.bc?.postMessage({ presence: this.myPresence }); } catch (e) {}
    if (this.mode === 'artifact' && this.room) this.room.presence({ qm: this.myPresence }).catch(() => {});
  }
  pushRecord(force) {
    const rec = this.getRecord(); if (!rec) return;
    const { lastSeen, ...cmp } = rec; const js = JSON.stringify(cmp);
    this.records.set(rec.sid, rec);
    if (!force && js === this.lastRecJSON) return; this.lastRecJSON = js;
    try { this.bc?.postMessage({ record: rec }); } catch (e) {}
    if (this.mode === 'artifact' && this.db && !this._writing) { this._writing = true; this.db.collection('students').doc(rec.sid).set(rec).catch(() => {}).finally(() => { this._writing = false; }); }
  }
  // ----- server.py -----
  async serverLoop() {
    const tick = async () => {
      try {
        const body = JSON.stringify({ record: this.getRecord(), presence: this.myPresence.sid ? this.myPresence : null });
        const r = await fetch('api/state', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
        if (r.ok) {
          const j = await r.json(); const now = j.now;
          this.presence.clear();
          for (const s of j.students) { this.records.set(s.sid, s.record); if (s.presence && now - s.seen < 12000) this.presence.set(s.sid, s.presence); }
          this.emit();
        }
      } catch (e) {}
      setTimeout(tick, this.myPresence.view === 'map' || this.myPresence.view === 'world' ? 600 : 1500);
    };
    tick();
  }
  // ----- claude.ai artifact -----
  artifactInit() {
    if (this.room) {
      this.room.onPeers((ch) => {
        const keep = new Set();
        for (const p of ch.peers) { const q = p.presence?.qm; if (q && q.sid && typeof q.sid === 'string') { keep.add(q.sid); this.presence.set(q.sid, { ...q, _t: Date.now() }); } }
        for (const sid of [...this.presence.keys()]) if (!keep.has(sid) && sid !== this.myPresence.sid) this.presence.delete(sid);
        this.emit();
      }, () => {});
    }
    if (this.db) {
      this.db.collection('students').onSnapshot((snap) => {
        for (const d of snap.docs) { const r = d.data(); if (r && r.sid) this.records.set(r.sid, r); }
        this.emit();
      }, () => {});
    }
  }
}

// ======================= ЛОГИН / ҚҰПИЯСӨЗ =======================
// Құпиясөз ашық сақталмайды: SHA-256(login:пароль:qazaqmath) ғана сақталады.
export const ADMIN_LOGIN = 'tetbenova';
const ADMIN_HASH0 = '94e51fa6c5fdf661d005def6205dbad68ff77ac86aa358a66cedfc41f5a295fd';
export async function hashPw(login, pw) {
  const data = new TextEncoder().encode(`${String(login).trim().toLowerCase()}:${pw}:qazaqmath`);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}
const TR = { а: 'a', ә: 'a', б: 'b', в: 'v', г: 'g', ғ: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'i', к: 'k', қ: 'q', л: 'l', м: 'm', н: 'n', ң: 'n', о: 'o', ө: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ұ: 'u', ү: 'u', ф: 'f', х: 'h', һ: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sh', ъ: '', ы: 'y', і: 'i', ь: '', э: 'e', ю: 'iu', я: 'ia' };
export const translit = (s) => [...String(s).toLowerCase()].map(c => TR[c] ?? (/[a-z0-9]/.test(c) ? c : '')).join('');
export function genPassword(n = 6) { const a = 'abcdefghjkmnpqrstuvwxyz23456789'; let s = ''; const r = crypto.getRandomValues(new Uint32Array(n)); for (const x of r) s += a[x % a.length]; return s; }

export class Accounts {
  constructor(sync) { this.sync = sync; this.cache = new Map(); this.adminHash = ADMIN_HASH0; }
  get mode() { return this.sync.mode; }
  async init() {
    if (this.mode === 'artifact' && this.sync.db) {
      await new Promise((res) => { let done = false; const fin = () => { if (!done) { done = true; res(); } };
        try { this.sync.db.collection('accounts').onSnapshot((snap) => { for (const d of snap.docs) { const a = d.data(); if (a?.login) this.cache.set(a.login, a); } for (const k of [...this.cache.keys()]) if (!snap.docs.some(d => d.data()?.login === k)) this.cache.delete(k); const ad = this.cache.get('__admin'); if (ad?.hash) this.adminHash = ad.hash; fin(); }, fin); } catch (e) { fin(); }
        setTimeout(fin, 5000); });
    } else if (this.mode === 'local') {
      try { const o = JSON.parse(localStorage.getItem('qm_accounts') || '{}'); for (const [k, v] of Object.entries(o)) this.cache.set(k, v); } catch (e) {}
      const ad = this.cache.get('__admin'); if (ad?.hash) this.adminHash = ad.hash;
    }
  }
  saveLocal() { try { localStorage.setItem('qm_accounts', JSON.stringify(Object.fromEntries(this.cache))); } catch (e) {} }
  async api(body) { const r = await fetch('api/account', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); return r.json(); }
  async write(acc) { this.cache.set(acc.login, acc); if (this.mode === 'artifact') await this.sync.db.collection('accounts').doc(acc.login).set(acc); else this.saveLocal(); }

  /** Оқушы кіруі → аккаунт (hash-сыз) немесе null */
  async login(login, pw) {
    login = String(login).trim().toLowerCase(); const h = await hashPw(login, pw);
    if (this.mode === 'server') { const j = await this.api({ op: 'login', login, hash: h }); return j.ok ? j.acc : null; }
    const a = this.cache.get(login); if (!a || a.hash !== h) return null; const { hash, ...pub } = a; return pub;
  }
  async register(acc, pw, adminHash) {
    acc = { ...acc, login: String(acc.login).trim().toLowerCase() }; acc.hash = await hashPw(acc.login, pw);
    if (!/^[a-z0-9._-]{3,24}$/.test(acc.login) || acc.login === '__admin') return { ok: false, err: 'Логин: 3–24 латын әрпі, сан, нүкте' };
    if (this.mode === 'server') return this.api({ op: 'register', acc, admin: adminHash });
    if (this.cache.has(acc.login)) return { ok: false, err: 'Бұл логин бос емес' };
    try { await this.write(acc); return { ok: true }; } catch (e) { return { ok: false, err: 'Сақтау мүмкін болмады — логинді мұғалімнен сұра' }; }
  }
  async adminLogin(login, pw) { if (String(login).trim().toLowerCase() !== ADMIN_LOGIN) return null; const h = await hashPw(ADMIN_LOGIN, pw);
    if (this.mode === 'server') { const j = await this.api({ op: 'admin', admin: h }); return j.ok ? h : null; }
    return h === this.adminHash ? h : null; }
  async list(adminHash) {
    if (this.mode === 'server') { const j = await this.api({ op: 'list', admin: adminHash }); return j.ok ? j.list : []; }
    if (adminHash !== this.adminHash) return [];
    return [...this.cache.values()].filter(a => a.login !== '__admin').map(({ hash, ...a }) => a);
  }
  async remove(login, adminHash) {
    if (this.mode === 'server') return this.api({ op: 'delete', login, admin: adminHash });
    if (adminHash !== this.adminHash) return { ok: false }; const a = this.cache.get(login); this.cache.delete(login);
    if (this.mode === 'artifact') { await this.sync.db.collection('accounts').doc(login).delete().catch(() => {}); if (a?.sid) await this.sync.db.collection('students').doc(a.sid).delete().catch(() => {}); } else this.saveLocal();
    if (a?.sid) { this.sync.records.delete(a.sid); delete Store.profiles[a.sid]; Store.save(); }
    return { ok: true };
  }
  async resetPassword(login, pw, adminHash) {
    const h = await hashPw(login, pw);
    if (this.mode === 'server') return this.api({ op: 'passwd', login, hash: h, admin: adminHash });
    if (adminHash !== this.adminHash) return { ok: false }; const a = this.cache.get(login); if (!a) return { ok: false }; await this.write({ ...a, hash: h }); return { ok: true };
  }
  async setAdminPassword(pw, adminHash) {
    const h = await hashPw(ADMIN_LOGIN, pw);
    if (this.mode === 'server') { const j = await this.api({ op: 'adminpw', hash: h, admin: adminHash }); return j.ok ? h : null; }
    if (adminHash !== this.adminHash) return null; await this.write({ login: '__admin', hash: h }); this.adminHash = h; return h;
  }
}
