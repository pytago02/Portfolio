//<script>
// ── PROGRESS BAR ──
const bar = document.getElementById('progress-bar');
window.addEventListener('scroll', () => {
  const h = document.documentElement.scrollHeight - window.innerHeight;
  bar.style.width = (window.scrollY / h * 100) + '%';
}, { passive: true });

// ── NAV SCROLL ──
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 50);
}, { passive: true });

// ── BURGER ──
const burger = document.getElementById('burger');
const mmenu = document.getElementById('mmenu');
burger.addEventListener('click', () => {
  burger.classList.toggle('open');
  mmenu.classList.toggle('open');
  document.body.style.overflow = mmenu.classList.contains('open') ? 'hidden' : '';
});
function closeM() {
  burger.classList.remove('open');
  mmenu.classList.remove('open');
  document.body.style.overflow = '';
}

// ── SCROLL REVEAL ──
const obs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); obs.unobserve(e.target); }
  });
}, { threshold: 0.08, rootMargin: '0px 0px -32px 0px' });
document.querySelectorAll('.reveal').forEach(el => obs.observe(el));

// ── PROJECT CARD GLOW ──
document.querySelectorAll('.project-item').forEach(card => {
  card.addEventListener('mousemove', e => {
    const r = card.getBoundingClientRect();
    card.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
    card.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
  });
});

// ── SKILL CELL subtle parallax on hover ──
document.querySelectorAll('.skill-cell').forEach(cell => {
  cell.addEventListener('mousemove', e => {
    const r = cell.getBoundingClientRect();
    const x = (e.clientX - r.left - r.width / 2) / r.width * 6;
    const y = (e.clientY - r.top - r.height / 2) / r.height * 6;
    cell.style.transform = `perspective(600px) rotateY(${x}deg) rotateX(${-y}deg)`;
  });
  cell.addEventListener('mouseleave', () => {
    cell.style.transform = '';
  });
});
//</script>