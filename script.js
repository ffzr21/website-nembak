'use strict';

/* ============================================================
   KONFIGURASI: ubah nama & pengaturan di sini
   ============================================================ */
const CONFIG = {
  herName: 'Meilani Puspitasari', // <-- NAMA DIA
  myName:  'Fakhri',              // <-- NAMA KAMU
  maxDodges: 8                    // berapa kali tombol NO kabur sebelum "pasrah"
};

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const sleep = ms => new Promise(r => setTimeout(r, ms));
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Isi nama otomatis ---------- */
$$('[data-name="her"]').forEach(e => e.textContent = CONFIG.herName);
$$('[data-name="herFirst"]').forEach(e => e.textContent = CONFIG.herName.split(' ')[0]);
$$('[data-name="me"]').forEach(e => e.textContent = CONFIG.myName);

/* ============================================================
   NAVIGASI ANTAR HALAMAN (tanpa scroll)
   ============================================================ */
const slides = $$('.slide');
const bar = $('#progressBar');
let cur = 0, busy = false;

function updateProgress() {
  bar.style.transform = `scaleX(${cur / (slides.length - 1)})`;
}

/* Typing animation */
function type(el, text, speed = 45) {
  return new Promise(resolve => {
    el.textContent = '';
    el.classList.add('typing');
    let i = 0;
    const t = setInterval(() => {
      el.textContent += text[i++];
      if (i >= text.length) { clearInterval(t); el.classList.remove('typing'); resolve(); }
    }, speed);
  });
}

/* Dijalankan sekali setiap kali halaman pertama kali dibuka */
async function enter(s) {
  if (s.dataset.entered) return;
  s.dataset.entered = '1';
  $$('.reveal', s).forEach(el => el.classList.add('in'));

  const next = $('.later', s);
  if (s.id === 'message') {
    for (const el of $$('.type', s)) {
      await type(el, el.dataset.text, reduceMotion ? 5 : 45);
      await sleep(600);
    }
    if (next) next.classList.add('in');
  } else if (next) {
    setTimeout(() => next.classList.add('in'), Number(next.dataset.delay) || 0);
  }
}

function goTo(n) {
  if (busy || n < 0 || n >= slides.length || n === cur) return;
  busy = true;
  slides[cur].classList.remove('active');
  cur = n;
  const s = slides[cur];
  s.scrollTop = 0;
  s.classList.add('active');
  updateProgress();
  setTimeout(() => { enter(s); busy = false; }, 500);
}

/* Semua tombol dengan atribut data-next -> halaman berikutnya */
$$('[data-next]').forEach(btn => btn.addEventListener('click', () => goTo(cur + 1)));

/* Halaman pertama */
updateProgress();
setTimeout(() => enter(slides[0]), 300);

/* ---------- Floating hearts ---------- */
const heartsBg = $('#heartsBg');
let heartTarget = heartsBg;
const HEART_COLORS = ['#ff8fab', '#e85d8a', '#d7263d', '#ffb3c6', '#ff6b8b'];

function spawnHeart({ fast = false } = {}) {
  if (heartTarget.childElementCount > 60) return; // jaga performa
  const h = document.createElement('span');
  h.className = 'heart';
  h.textContent = Math.random() < 0.2 ? '💗' : '❤';
  h.style.left = Math.random() * 100 + '%';
  h.style.fontSize = (10 + Math.random() * 22) + 'px';
  h.style.color = HEART_COLORS[Math.floor(Math.random() * HEART_COLORS.length)];
  h.style.animationDuration = (fast ? 3 + Math.random() * 3 : 7 + Math.random() * 7) + 's';
  h.style.setProperty('--sway', (Math.random() * 120 - 60) + 'px');
  h.addEventListener('animationend', () => h.remove());
  heartTarget.appendChild(h);
}
setInterval(() => { if (!document.hidden) spawnHeart(); }, reduceMotion ? 1800 : 700);
function burstHearts(n) {
  for (let i = 0; i < n; i++) setTimeout(() => spawnHeart({ fast: true }), i * 60);
}

/* ---------- Confetti (canvas ringan) ---------- */
const cvs = $('#confetti');
const ctx = cvs.getContext('2d');
let parts = [], raf = null;
function resizeCanvas() { cvs.width = innerWidth; cvs.height = innerHeight; }
resizeCanvas();
addEventListener('resize', resizeCanvas);

function confetti(n = 160) {
  if (reduceMotion) n = Math.floor(n / 3);
  const colors = ['#ff6b8b', '#d7263d', '#ffb3c6', '#ffd9e2', '#fff', '#e58ca3', '#ffd166'];
  for (let i = 0; i < n; i++) {
    parts.push({
      x: innerWidth / 2, y: innerHeight * 0.6,
      vx: (Math.random() - 0.5) * 16, vy: -Math.random() * 16 - 6,
      w: 6 + Math.random() * 6, h: 4 + Math.random() * 6,
      r: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.3,
      c: colors[Math.floor(Math.random() * colors.length)], life: 0
    });
  }
  if (!raf) loop();
}
function loop() {
  ctx.clearRect(0, 0, cvs.width, cvs.height);
  parts = parts.filter(p => p.y < cvs.height + 20 && p.life < 280);
  for (const p of parts) {
    p.vy += 0.35; p.vx *= 0.99;
    p.x += p.vx; p.y += p.vy; p.r += p.vr; p.life++;
    ctx.save();
    ctx.translate(p.x, p.y); ctx.rotate(p.r);
    ctx.fillStyle = p.c;
    ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
    ctx.restore();
  }
  if (parts.length) raf = requestAnimationFrame(loop);
  else { raf = null; ctx.clearRect(0, 0, cvs.width, cvs.height); }
}

/* ---------- Musik ---------- */
/* Browser melarang autoplay, jadi musik baru jalan setelah user klik
   (tombol "Mulai" atau tombol musik di pojok kanan atas).
   Ganti file lagu dengan nama music.mp3 di folder yang sama. */
const audio = $('#bgm');
const musicBtn = $('#musicBtn');
function syncMusicUI() {
  const on = !audio.paused;
  musicBtn.textContent = on ? '🔊' : '🔇';
  musicBtn.classList.toggle('on', on);
  musicBtn.setAttribute('aria-pressed', String(on));
  musicBtn.setAttribute('aria-label', on ? 'Matikan musik' : 'Nyalakan musik');
}
async function setMusic(on) {
  try {
    if (on) await audio.play(); else audio.pause();
  } catch (err) { /* file belum ada / diblokir browser: abaikan */ }
  syncMusicUI();
}
musicBtn.addEventListener('click', () => setMusic(audio.paused));
$('#startBtn').addEventListener('click', () => setMusic(true));

/* ---------- Modal helper ---------- */
function openModal(m) {
  m.hidden = false;
  requestAnimationFrame(() => m.classList.add('open'));
  const b = $('button', m); if (b) b.focus();
}
function closeModal(m) {
  m.classList.remove('open');
  setTimeout(() => { m.hidden = true; }, 400);
}

/* ---------- Tombol NO yang jahil ---------- */
const qSec = $('#question');
const noBtn = $('#noBtn');
const yesBtn = $('#yesBtn');
let dodges = 0, lastDodge = 0;

function overlaps(a, b, m = 20) {
  return a.x < b.x + b.w + m && a.x + a.w + m > b.x && a.y < b.y + b.h + m && a.y + a.h + m > b.y;
}

function dodge() {
  if (dodges >= CONFIG.maxDodges) return;          // sudah "pasrah", jadi bisa ditekan
  const now = performance.now();
  if (now - lastDodge < 250) return;
  lastDodge = now; dodges++;

  const z = qSec.getBoundingClientRect();
  const b = noBtn.getBoundingClientRect();
  const y = yesBtn.getBoundingClientRect();

  // pertama kali: ubah ke posisi absolute tanpa lompat
  if (!noBtn.classList.contains('moved')) {
    noBtn.style.left = (b.left - z.left) + 'px';
    noBtn.style.top  = (b.top - z.top) + 'px';
    noBtn.classList.add('moved');
    void noBtn.offsetWidth;
  }

  const pad = 12;
  const minX = pad, maxX = z.width - b.width - pad;
  const minY = pad + 50;
  const maxY = z.height - b.height - pad;
  const yesBox = { x: y.left - z.left, y: y.top - z.top, w: y.width, h: y.height };

  let x, yy, tries = 0;
  do {
    x  = minX + Math.random() * Math.max(0, maxX - minX);
    yy = minY + Math.random() * Math.max(0, maxY - minY);
    tries++;
  } while (tries < 15 && overlaps({ x, y: yy, w: b.width, h: b.height }, yesBox));

  noBtn.style.left = x + 'px';
  noBtn.style.top  = yy + 'px';

  // tombol YES pelan-pelan makin besar :)
  yesBtn.style.scale = 1 + dodges * 0.06;
}

document.addEventListener('pointermove', e => {
  if (e.pointerType === 'touch') return;
  if (slides[cur].id !== 'question') return;      // hanya aktif di halaman pertanyaan
  const r = noBtn.getBoundingClientRect();
  const d = Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2));
  if (d < Math.max(r.width, 90)) dodge();
});
// di HP: kabur saat disentuh (beberapa kali), setelah itu bisa ditekan
noBtn.addEventListener('pointerdown', e => {
  if (dodges < CONFIG.maxDodges) { e.preventDefault(); dodge(); }
});
addEventListener('resize', () => {          // reset posisi kalau layar berubah
  noBtn.classList.remove('moved'); noBtn.style.left = noBtn.style.top = '';
});

noBtn.addEventListener('click', () => openModal($('#noModal')));
$('#backBtn').addEventListener('click', () => closeModal($('#noModal')));

/* ---------- Tombol YES ---------- */
let saidYes = false;
yesBtn.addEventListener('click', () => {
  if (saidYes) return;
  saidYes = true;
  document.body.classList.add('celebrate');
  $('#bigHeart').classList.add('spin');
  confetti(200);
  setTimeout(() => confetti(120), 500);
  burstHearts(40);
  openModal($('#yesModal'));
});

/* ---------- Final screen ---------- */
$('#startStory').addEventListener('click', () => {
  closeModal($('#yesModal'));
  const fin = $('#final');
  fin.hidden = false;
  heartTarget = $('#finalHearts');           // hati kecil bergerak di background final
  fin.scrollTop = 0;
  requestAnimationFrame(() => fin.classList.add('show'));
  confetti(100);
});