// ========== HERO PARTICLE CAROUSEL ==========
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

  // ── Shared state ──
  let animId, running = true;
  let currentViz = 0;
  let globalAlpha = 1; // for crossfade
  let transitioning = false;
  const CYCLE_INTERVAL = 12000; // 12s per visualization
  const FADE_DURATION = 1500;

  // ════════════════════════════════════════
  // VIZ 0: LORENZ ATTRACTOR
  // ════════════════════════════════════════
  const lorenz = {
    sigma: 10, rho: 28, beta: 8 / 3, dt: 0.003,
    particles: [], TAIL: 12, COUNT: 600,

    init() {
      this.particles = [];
      for (let i = 0; i < this.COUNT; i++) {
        const side = Math.random() > 0.5 ? 1 : -1;
        this.particles.push({
          x: side * (Math.sqrt(this.beta * (this.rho - 1)) + (Math.random() - 0.5) * 20),
          y: side * (Math.sqrt(this.beta * (this.rho - 1)) + (Math.random() - 0.5) * 20),
          z: this.rho - 1 + (Math.random() - 0.5) * 20,
          trail: [],
          hue: 210 + Math.random() * 40,
          speed: 0.8 + Math.random() * 0.4,
        });
      }
      // Pre-run
      for (let step = 0; step < this.TAIL + 10; step++) this.step(false);
    },

    step(draw = true) {
      for (const p of this.particles) {
        const dx = this.sigma * (p.y - p.x);
        const dy = p.x * (this.rho - p.z) - p.y;
        const dz = p.x * p.y - this.beta * p.z;
        p.x += dx * this.dt * p.speed;
        p.y += dy * this.dt * p.speed;
        p.z += dz * this.dt * p.speed;
        const scale = Math.min(w / 80, h / 60);
        const sx = w / 2 + p.x * scale;
        const sy = h / 2 - (p.z - this.rho) * scale * 0.85;
        p.trail.push({ x: sx, y: sy });
        if (p.trail.length > this.TAIL) p.trail.shift();
        if (!draw || p.trail.length < 2) continue;
        ctx.beginPath();
        ctx.moveTo(p.trail[0].x, p.trail[0].y);
        for (let j = 1; j < p.trail.length; j++) ctx.lineTo(p.trail[j].x, p.trail[j].y);
        const a = Math.min(0.15 + (p.z / 50) * 0.15, 0.35) * globalAlpha;
        ctx.strokeStyle = `hsla(${p.hue}, 70%, 60%, ${a})`;
        ctx.lineWidth = 0.8;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(sx, sy, 1, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 80%, 70%, ${Math.min(a + 0.1, 0.5)})`;
        ctx.fill();
      }
    }
  };

  // ════════════════════════════════════════
  // VIZ 1: GOLDEN RATIO SPIRAL
  // ════════════════════════════════════════
  const golden = {
    particles: [], COUNT: 500, PHI: (1 + Math.sqrt(5)) / 2,
    time: 0,

    init() {
      this.particles = [];
      this.time = 0;
      for (let i = 0; i < this.COUNT; i++) {
        const angle = i * 2.399963; // golden angle in radians
        const r = Math.sqrt(i) * 12;
        this.particles.push({
          baseAngle: angle,
          baseR: r,
          hue: 35 + (i / this.COUNT) * 25, // warm gold 35-60
          size: 1.2 + Math.random() * 1.8,
          phase: Math.random() * Math.PI * 2,
          drift: 0.3 + Math.random() * 0.7,
        });
      }
    },

    step() {
      this.time += 0.008;
      for (const p of this.particles) {
        const breathe = 1 + Math.sin(this.time * 0.5 + p.phase) * 0.15;
        const spiralSpin = this.time * 0.2 * p.drift;
        const angle = p.baseAngle + spiralSpin;
        const r = p.baseR * breathe;
        const x = w / 2 + Math.cos(angle) * r;
        const y = h / 2 + Math.sin(angle) * r;
        const distFromCenter = r / (Math.sqrt(this.COUNT) * 12);
        const a = (0.3 + (1 - distFromCenter) * 0.5) * globalAlpha;
        ctx.beginPath();
        ctx.arc(x, y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 75%, 60%, ${a})`;
        ctx.fill();
      }
      // Draw faint spiral arms
      ctx.beginPath();
      for (let arm = 0; arm < 5; arm++) {
        const armOffset = arm * (Math.PI * 2 / 5);
        for (let t = 0; t < 200; t++) {
          const angle = t * 0.08 + armOffset + this.time * 0.2;
          const r = t * 1.8;
          const x = w / 2 + Math.cos(angle) * r;
          const y = h / 2 + Math.sin(angle) * r;
          if (t === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
      }
      ctx.strokeStyle = `hsla(45, 60%, 50%, ${0.12 * globalAlpha})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  };

  // ════════════════════════════════════════
  // VIZ 2: ROTATING PARTICLE SPHERE
  // ════════════════════════════════════════
  const sphere = {
    particles: [], COUNT: 800, time: 0,

    init() {
      this.particles = [];
      this.time = 0;
      for (let i = 0; i < this.COUNT; i++) {
        // Fibonacci sphere distribution
        const y = 1 - (i / (this.COUNT - 1)) * 2;
        const radiusAtY = Math.sqrt(1 - y * y);
        const theta = this.COUNT * 2.399963 * i / this.COUNT;
        this.particles.push({
          ox: radiusAtY * Math.cos(theta),
          oy: y,
          oz: radiusAtY * Math.sin(theta),
          hue: 160 + Math.random() * 40, // teal-cyan 160-200
          size: 1 + Math.random() * 1.5,
        });
      }
    },

    step() {
      this.time += 0.005;
      const R = Math.min(w, h) * 0.38;
      const cosT = Math.cos(this.time), sinT = Math.sin(this.time);
      const cosT2 = Math.cos(this.time * 0.7), sinT2 = Math.sin(this.time * 0.7);

      // Sort by z for depth ordering
      const projected = this.particles.map(p => {
        // Rotate Y axis
        let x = p.ox * cosT + p.oz * sinT;
        let z = -p.ox * sinT + p.oz * cosT;
        let y = p.oy;
        // Rotate X axis (tilt)
        const y2 = y * cosT2 - z * sinT2;
        const z2 = y * sinT2 + z * cosT2;
        return { x, y: y2, z: z2, hue: p.hue, size: p.size };
      });
      projected.sort((a, b) => a.z - b.z);

      for (const p of projected) {
        const depth = (p.z + 1) / 2; // 0 (back) to 1 (front)
        const scale = 0.7 + depth * 0.3;
        const sx = w / 2 + p.x * R * scale;
        const sy = h / 2 + p.y * R * scale;
        const a = (0.2 + depth * 0.5) * globalAlpha;
        ctx.beginPath();
        ctx.arc(sx, sy, p.size * scale, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 65%, ${45 + depth * 25}%, ${a})`;
        ctx.fill();
      }
    }
  };

  // ════════════════════════════════════════
  // VIZ 3: TORUS KNOT
  // ════════════════════════════════════════
  const torus = {
    particles: [], COUNT: 600, time: 0,

    init() {
      this.particles = [];
      this.time = 0;
      for (let i = 0; i < this.COUNT; i++) {
        this.particles.push({
          t: (i / this.COUNT) * Math.PI * 2,
          hue: 280 + Math.random() * 50, // purple-magenta 280-330
          size: 1 + Math.random() * 1.5,
          phase: Math.random() * Math.PI * 2,
        });
      }
    },

    step() {
      this.time += 0.004;
      const R1 = Math.min(w, h) * 0.35; // major radius
      const R2 = R1 * 0.4; // minor radius
      const cosRot = Math.cos(this.time), sinRot = Math.sin(this.time);
      const tiltCos = Math.cos(0.4), tiltSin = Math.sin(0.4);

      for (const p of this.particles) {
        const t = p.t + this.time * 0.3;
        // Torus knot: p=2, q=3
        const knotP = 2, knotQ = 3;
        const r = R2 * Math.cos(knotQ * t) + R1;
        let x = r * Math.cos(knotP * t);
        let y = r * Math.sin(knotP * t);
        let z = R2 * Math.sin(knotQ * t);

        // Add subtle breathing
        const breathe = 1 + Math.sin(this.time + p.phase) * 0.05;
        x *= breathe; y *= breathe; z *= breathe;

        // Rotate around Y
        const x2 = x * cosRot + z * sinRot;
        const z2 = -x * sinRot + z * cosRot;

        // Tilt
        const y2 = y * tiltCos - z2 * tiltSin;
        const z3 = y * tiltSin + z2 * tiltCos;

        const depth = (z3 / (R1 + R2) + 1) / 2;
        const sx = w / 2 + x2;
        const sy = h / 2 + y2;
        const a = (0.2 + depth * 0.5) * globalAlpha;
        ctx.beginPath();
        ctx.arc(sx, sy, p.size * (0.6 + depth * 0.4), 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 65%, ${40 + depth * 30}%, ${a})`;
        ctx.fill();
      }
    }
  };

  // ════════════════════════════════════════
  // VIZ 4: QUANTUM CHRYSALIS (WAWAWAA)
  // ════════════════════════════════════════
  const chrysalis = {
    particles: [], COUNT: 700, time: 0,
    amplitude: 3.5, complexity: 8.0, flowSpeed: 0.5,

    init() {
      this.particles = [];
      this.time = 0;
      for (let i = 0; i < this.COUNT; i++) {
        this.particles.push({
          ratio: i / this.COUNT,
          hue: 0,
          size: 1 + Math.random() * 1.5,
        });
      }
    },

    step() {
      this.time += 0.008;
      const R = Math.min(w, h) * 0.32;
      const scale = R / 15;

      for (const p of this.particles) {
        const ratio = p.ratio;
        const phi = Math.acos(1 - 2 * ratio);
        const theta = Math.sqrt(this.COUNT * Math.PI) * phi;

        const pulse = Math.sin(this.time * this.flowSpeed + ratio * this.complexity);
        const radius = 15 + pulse * this.amplitude;

        // Base sphere position
        let bx = radius * Math.sin(phi) * Math.cos(theta + this.time);
        let by = radius * Math.sin(phi) * Math.sin(theta + this.time);
        let bz = radius * Math.cos(phi) + Math.cos(ratio * 50 + this.time) * 2.0;

        // Attractor distortion
        const ax = bx + Math.sin(by * 0.2 + this.time) * this.amplitude;
        const ay = by + Math.cos(bx * 0.2 + this.time) * this.amplitude;
        const az = bz + Math.sin(this.time * 0.5) * 5.0;

        // Rotate around Y
        const cosR = Math.cos(this.time * 0.15), sinR = Math.sin(this.time * 0.15);
        const rx = ax * cosR + az * sinR;
        const rz = -ax * sinR + az * cosR;

        // Tilt
        const tiltCos = Math.cos(0.3), tiltSin = Math.sin(0.3);
        const ry = ay * tiltCos - rz * tiltSin;
        const rz2 = ay * tiltSin + rz * tiltCos;

        const depth = (rz2 + 20) / 40;
        const sx = w / 2 + rx * scale;
        const sy = h / 2 + ry * scale;

        // Rainbow hue cycling
        const hue = ((ratio + this.time * 0.05) % 1.0) * 360;
        const sat = 0.6 + Math.sin(ratio * 10 + this.time) * 0.3;
        const lit = 40 + Math.cos(phi + this.time) * 15 + depth * 15;
        const a = (0.2 + depth * 0.5) * globalAlpha;

        ctx.beginPath();
        ctx.arc(sx, sy, p.size * (0.6 + depth * 0.4), 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${hue}, ${sat * 100}%, ${lit}%, ${a})`;
        ctx.fill();
      }
    }
  };

  // ── Visualization registry ──
  const vizzes = [lorenz, golden, sphere, torus, chrysalis];
  vizzes.forEach(v => v.init());

  // ── Crossfade transition ──
  function transitionTo(nextIdx) {
    if (transitioning) return;
    transitioning = true;
    const fadeOut = performance.now();

    function fade() {
      const elapsed = performance.now() - fadeOut;
      if (elapsed < FADE_DURATION / 2) {
        // Fade out current
        globalAlpha = 1 - (elapsed / (FADE_DURATION / 2));
      } else if (elapsed < FADE_DURATION) {
        // Switch and fade in
        if (currentViz !== nextIdx) {
          currentViz = nextIdx;
          // Full clear to remove artifacts from previous viz
          ctx.fillStyle = '#0a0a0a';
          ctx.fillRect(0, 0, w, h);
          vizzes[currentViz].init();
          // Pre-run lorenz if needed
          if (currentViz === 0) {
            for (let s = 0; s < lorenz.TAIL + 10; s++) lorenz.step();
          }
        }
        globalAlpha = (elapsed - FADE_DURATION / 2) / (FADE_DURATION / 2);
      } else {
        globalAlpha = 1;
        transitioning = false;
        return;
      }
      requestAnimationFrame(fade);
    }
    fade();
  }

  // ── Auto-cycle ──
  setInterval(() => {
    if (!running) return;
    const next = (currentViz + 1) % vizzes.length;
    transitionTo(next);
  }, CYCLE_INTERVAL);

  // ── Main draw loop ──
  function draw() {
    if (!running) return;
    animId = requestAnimationFrame(draw);
    // Lorenz needs trail persistence; others get full clear
    if (currentViz === 0) {
      ctx.fillStyle = 'rgba(10, 10, 10, 0.15)';
    } else {
      ctx.fillStyle = '#0a0a0a';
    }
    ctx.fillRect(0, 0, w, h);
    vizzes[currentViz].step();
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
