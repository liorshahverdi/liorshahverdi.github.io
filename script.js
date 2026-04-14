// ========== LORENZ ATTRACTOR HERO BACKGROUND ==========
(function () {
  const canvas = document.getElementById('heroCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let w, h, dpr;
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);

  // Lorenz parameters
  const sigma = 10, rho = 28, beta = 8 / 3;
  const dt = 0.003;
  const PARTICLE_COUNT = 600;
  const TAIL_LENGTH = 12;

  // Initialize particles spread across the attractor
  const particles = [];
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    // Seed particles near the two attractor lobes with some randomness
    const side = Math.random() > 0.5 ? 1 : -1;
    particles.push({
      x: side * (Math.sqrt(beta * (rho - 1)) + (Math.random() - 0.5) * 20),
      y: side * (Math.sqrt(beta * (rho - 1)) + (Math.random() - 0.5) * 20),
      z: rho - 1 + (Math.random() - 0.5) * 20,
      trail: [],
      hue: 210 + Math.random() * 40, // blue range 210-250
      speed: 0.8 + Math.random() * 0.4,
    });
  }

  // Pre-run simulation so trails are populated on first frame
  for (let step = 0; step < TAIL_LENGTH + 10; step++) {
    for (const p of particles) {
      const dx = sigma * (p.y - p.x);
      const dy = p.x * (rho - p.z) - p.y;
      const dz = p.x * p.y - beta * p.z;
      p.x += dx * dt * p.speed;
      p.y += dy * dt * p.speed;
      p.z += dz * dt * p.speed;
      const sx = w / 2 + p.x * (w / 80);
      const sy = h / 2 - (p.z - rho) * (h / 70);
      p.trail.push({ x: sx, y: sy });
      if (p.trail.length > TAIL_LENGTH) p.trail.shift();
    }
  }

  let animId;
  let running = true;

  function draw() {
    if (!running) return;
    animId = requestAnimationFrame(draw);

    // Semi-transparent clear for subtle trail persistence
    ctx.fillStyle = 'rgba(10, 10, 10, 0.15)';
    ctx.fillRect(0, 0, w, h);

    for (const p of particles) {
      // Lorenz step
      const dx = sigma * (p.y - p.x);
      const dy = p.x * (rho - p.z) - p.y;
      const dz = p.x * p.y - beta * p.z;
      p.x += dx * dt * p.speed;
      p.y += dy * dt * p.speed;
      p.z += dz * dt * p.speed;

      // Project to screen — centered, scaled to fill hero
      const scale = Math.min(w / 80, h / 60);
      const sx = w / 2 + p.x * scale;
      const sy = h / 2 - (p.z - rho) * scale * 0.85;

      p.trail.push({ x: sx, y: sy });
      if (p.trail.length > TAIL_LENGTH) p.trail.shift();

      // Draw trail
      if (p.trail.length < 2) continue;
      ctx.beginPath();
      ctx.moveTo(p.trail[0].x, p.trail[0].y);
      for (let j = 1; j < p.trail.length; j++) {
        ctx.lineTo(p.trail[j].x, p.trail[j].y);
      }
      const alpha = 0.15 + (p.z / 50) * 0.15; // depth-based opacity
      ctx.strokeStyle = `hsla(${p.hue}, 70%, 60%, ${Math.min(alpha, 0.35)})`;
      ctx.lineWidth = 0.8;
      ctx.stroke();

      // Draw head particle
      ctx.beginPath();
      ctx.arc(sx, sy, 1, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${p.hue}, 80%, 70%, ${Math.min(alpha + 0.1, 0.5)})`;
      ctx.fill();
    }
  }

  draw();

  // Pause when hero is off-screen
  const heroEl = canvas.parentElement;
  const heroObs = new IntersectionObserver(entries => {
    running = entries[0].isIntersecting;
    if (running) draw();
    else cancelAnimationFrame(animId);
  }, { threshold: 0 });
  heroObs.observe(heroEl);
})();

// ========== CAROUSEL ==========
document.querySelectorAll('.carousel').forEach(carousel => {
  const track = carousel.querySelector('.carousel__track');
  const slides = carousel.querySelectorAll('.carousel__slide');
  const dots = carousel.querySelectorAll('.carousel__dot');
  const prevBtn = carousel.querySelector('.carousel__btn--prev');
  const nextBtn = carousel.querySelector('.carousel__btn--next');
  let current = 0;
  const total = slides.length;

  function goTo(i) {
    current = (i + total) % total;
    track.style.transform = `translateX(-${current * 100}%)`;
    dots.forEach((d, idx) => d.classList.toggle('carousel__dot--active', idx === current));
  }

  prevBtn?.addEventListener('click', () => goTo(current - 1));
  nextBtn?.addEventListener('click', () => goTo(current + 1));
  dots.forEach((dot, idx) => dot.addEventListener('click', () => goTo(idx)));

  // Touch swipe
  let startX = 0;
  carousel.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
  carousel.addEventListener('touchend', e => {
    const diff = startX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) goTo(current + (diff > 0 ? 1 : -1));
  });

  // Keyboard
  carousel.setAttribute('tabindex', '0');
  carousel.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') goTo(current - 1);
    if (e.key === 'ArrowRight') goTo(current + 1);
  });
});

// ========== SCROLL REVEAL ==========
const observer = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.1 }
);

document.querySelectorAll('.project').forEach((el, i) => {
  el.style.transitionDelay = `${i * 0.05}s`;
  observer.observe(el);
});

// ========== NAV HIDE/SHOW ON SCROLL ==========
const nav = document.querySelector('.nav');
let lastScroll = 0;

window.addEventListener('scroll', () => {
  const current = window.scrollY;
  if (current > lastScroll && current > 80) {
    nav.classList.add('nav--hidden');
  } else {
    nav.classList.remove('nav--hidden');
  }
  lastScroll = current;
}, { passive: true });
