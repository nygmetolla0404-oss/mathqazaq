// Аудиогид: алдын ала жазылған қазақша mp3 (kk-KZ нейрондық дауыс) → браузердің kk-KZ дауысы → тек субтитр.
const sub = () => document.getElementById('subtitle');
const subText = () => document.getElementById('subText');
let manifest = new Set(), audio = null, muted = false, hideT = 0;
try { muted = localStorage.getItem('qm_muted') === '1'; } catch (e) {}

export async function initVoice() {
  try { const r = await fetch('audio/manifest.json'); if (r.ok) manifest = new Set(await r.json()); } catch (e) {}
  document.getElementById('subClose').addEventListener('click', stop);
  const b = document.getElementById('btnMute'); b.setAttribute('aria-pressed', String(muted));
  b.addEventListener('click', () => { muted = !muted; b.setAttribute('aria-pressed', String(muted)); try { localStorage.setItem('qm_muted', muted ? '1' : '0'); } catch (e) {} if (muted) stopSound(); });
}
function stopSound() { if (audio) { audio.pause(); audio = null; } try { speechSynthesis.cancel(); } catch (e) {} }
export function stop() { stopSound(); sub().hidden = true; }
function showSub(text, ms) { subText().textContent = text; sub().hidden = false; clearTimeout(hideT); hideT = setTimeout(() => { sub().hidden = true; }, ms); }

export function say(key, text) {
  stopSound();
  const ms = Math.max(5000, text.length * 75);
  showSub(text, ms);
  if (muted) return;
  if (manifest.has(key)) {
    audio = new Audio('audio/' + key + '.mp3'); audio.volume = 1;
    audio.addEventListener('ended', () => { clearTimeout(hideT); hideT = setTimeout(() => { sub().hidden = true; }, 1500); });
    audio.play().catch(() => browserTTS(text));
    return;
  }
  browserTTS(text);
}
function browserTTS(text) {
  try {
    const v = speechSynthesis.getVoices().find(v => /^kk/i.test(v.lang));
    if (!v) return; // қазақ дауысы жоқ болса — акцентпен оқымаймыз, тек субтитр
    const u = new SpeechSynthesisUtterance(text); u.voice = v; u.lang = v.lang; u.rate = .95; speechSynthesis.speak(u);
  } catch (e) {}
}
export function sfx(kind) {
  if (muted) return;
  try {
    const ctx = sfx.ctx || (sfx.ctx = new (window.AudioContext || window.webkitAudioContext)());
    const notes = { ok: [523, 659, 784, 1047], bad: [300, 220], portal: [220, 330, 440, 660, 880], star: [880, 1175, 1568] }[kind] || [440];
    notes.forEach((f, i) => { const o = ctx.createOscillator(), g = ctx.createGain(); o.type = kind === 'bad' ? 'sawtooth' : 'triangle'; o.frequency.value = f; g.gain.setValueAtTime(0, ctx.currentTime + i * .09); g.gain.linearRampToValueAtTime(.12, ctx.currentTime + i * .09 + .02); g.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + i * .09 + .3); o.connect(g).connect(ctx.destination); o.start(ctx.currentTime + i * .09); o.stop(ctx.currentTime + i * .09 + .32); });
  } catch (e) {}
}
export const isMuted = () => muted;
export const hasAudio = (key) => manifest.has(key);
