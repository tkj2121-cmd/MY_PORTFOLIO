document.documentElement.classList.add('js');
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Theme ---------- */
const root = document.documentElement;
try {
  const saved = localStorage.getItem('theme');
  if (saved) root.dataset.theme = saved;
  else root.dataset.theme = 'dark';
} catch (e) {}
$('#themeBtn').addEventListener('click', () => {
  const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
  root.dataset.theme = next;
  try { localStorage.setItem('theme', next); } catch (e) {}
});

/* ---------- Mobile menu ---------- */
const menuBtn = $('#menuBtn'), navLinks = $('#navLinks');
menuBtn.addEventListener('click', () => {
  const open = navLinks.classList.toggle('open');
  menuBtn.setAttribute('aria-expanded', open);
});
$$('#navLinks a').forEach(a => a.addEventListener('click', () => navLinks.classList.remove('open')));

/* ---------- Typing effect ---------- */
const phrases = ['turns raw data into insights.', 'builds machine learning models.', 'designs dashboards and databases.', 'explores RAG and GenAI.'];
const typed = $('#typed');
if (reduceMotion) typed.textContent = phrases[0];
else {
  let p = 0, c = 0, del = false;
  (function tick() {
    const word = phrases[p];
    typed.textContent = word.slice(0, c);
    if (!del && c === word.length) { del = true; return setTimeout(tick, 1600); }
    if (del && c === 0) { del = false; p = (p + 1) % phrases.length; }
    c += del ? -1 : 1;
    setTimeout(tick, del ? 35 : 70);
  })();
}

/* ---------- Hero: scatter plot that reacts to the cursor ---------- */
const cv = $('#plot'), ctx = cv.getContext('2d');
let W, H, pts = [], mouse = { x: -999, y: -999 };
function resize() {
  const r = cv.getBoundingClientRect(), d = devicePixelRatio || 1;
  W = r.width; H = r.height; cv.width = W * d; cv.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0);
  pts = Array.from({ length: Math.round(W * H / 14000) }, () => {
    const x = Math.random() * W, y = H - x * (H / W) * .8 + (Math.random() - .5) * H * .5; // noisy trend line
    return { hx: x, hy: Math.min(Math.max(y, 10), H - 10), x, y, r: 1.5 + Math.random() * 2 };
  });
}
addEventListener('resize', resize); resize();
cv.parentElement.addEventListener('mousemove', e => { const r = cv.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; });
cv.parentElement.addEventListener('mouseleave', () => mouse.x = mouse.y = -999);
function draw() {
  ctx.clearRect(0, 0, W, H);
  const rgb = getComputedStyle(root).getPropertyValue('--dot').trim();
  pts.forEach(p => {
    const dx = p.x - mouse.x, dy = p.y - mouse.y, d = Math.hypot(dx, dy);
    if (d < 110) { p.x += dx / d * 3; p.y += dy / d * 3; }
    p.x += (p.hx - p.x) * .06; p.y += (p.hy - p.y) * .06;
    ctx.fillStyle = `rgba(${rgb},.4)`; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.29); ctx.fill();
    if (d < 140) { ctx.strokeStyle = `rgba(${rgb},${.35 * (1 - d / 140)})`; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke(); }
  });
  if (!reduceMotion) requestAnimationFrame(draw);
}
draw();

/* ---------- Project filter (buttons + skill chips) ---------- */
const cards = $$('.project-card'), filters = $$('.filter'), chips = $$('.chip'), empty = $('#empty');
function applyFilter(term, label) {
  let shown = 0;
  cards.forEach(c => {
    const match = term === 'all' || c.dataset.tags.split(' ').join(' ').includes(term);
    c.classList.toggle('hide', !match);
    shown += match;
  });
  filters.forEach(f => f.classList.toggle('active', f.dataset.term === term));
  chips.forEach(c => c.classList.toggle('active', c.dataset.term === term));
  empty.hidden = shown > 0;
  empty.textContent = shown ? '' : `No projects tagged "${label}" yet — more coming soon.`;
}
filters.forEach(f => f.addEventListener('click', () => applyFilter(f.dataset.term, f.textContent)));
chips.forEach(c => c.addEventListener('click', () => {
  const again = c.classList.contains('active');
  applyFilter(again ? 'all' : c.dataset.term, c.textContent);
  if (!again) $('#projects').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
}));

/* ---------- 3D tilt on project cards ---------- */
if (!reduceMotion && matchMedia('(hover:hover)').matches) {
  cards.forEach(c => {
    c.addEventListener('mousemove', e => {
      const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      c.style.transform = `perspective(700px) rotateX(${-y * 6}deg) rotateY(${x * 6}deg) translateY(-4px)`;
    });
    c.addEventListener('mouseleave', () => c.style.transform = '');
  });
}

/* ---------- Scroll: progress bar, active link, back-to-top, reveal ---------- */
const bar = $('#progress'), toTop = $('#toTop');
addEventListener('scroll', () => {
  const max = document.documentElement.scrollHeight - innerHeight;
  bar.style.width = (scrollY / max * 100) + '%';
  toTop.classList.toggle('show', scrollY > 600);
}, { passive: true });
toTop.addEventListener('click', () => scrollTo({ top: 0, behavior: 'smooth' }));

const links = $$('#navLinks a');
const spy = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id));
}), { rootMargin: '-45% 0px -50% 0px' });
$$('section[id]').forEach(s => spy.observe(s));

const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .12 });
$$('.section-heading, .about-facts, .skill-group, .project-card, .interest, .contact-list').forEach(el => { el.classList.add('reveal'); io.observe(el); });

/* ---------- Copy email ---------- */
$('#copyBtn').addEventListener('click', async e => {
  try { await navigator.clipboard.writeText('tkj2121@gmail.com'); e.target.textContent = 'Copied'; }
  catch (err) { e.target.textContent = 'Copy failed'; }
  setTimeout(() => e.target.textContent = 'Copy', 1600);
});

/* ================= WOW UPGRADE ================= */
/* Skills marquee: duplicate content for a seamless loop */
const track = $('#track');
track.innerHTML += track.innerHTML;

/* Count-up stats */
const counter = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return;
  const el = e.target, end = +el.dataset.count;
  counter.unobserve(el);
  if (reduceMotion) return el.textContent = end;
  let n = 0;
  const t = setInterval(() => { el.textContent = ++n; if (n >= end) clearInterval(t); }, 900 / end);
}), { threshold: .6 });
$$('[data-count]').forEach(el => counter.observe(el));

/* Cursor glow + card spotlight */
const glow = $('#glow');
addEventListener('mousemove', e => {
  glow.style.opacity = 1;
  glow.style.left = e.clientX + 'px';
  glow.style.top = e.clientY + 'px';
  const card = e.target.closest('.project-card, .skill-group, .interest, .about-facts');
  if (card) {
    const r = card.getBoundingClientRect();
    card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
    card.style.setProperty('--my', (e.clientY - r.top) + 'px');
  }
});
document.addEventListener('mouseleave', () => glow.style.opacity = 0);
