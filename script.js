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
