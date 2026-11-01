// SENZ motion: native scrolling, one-time entrances, and progress along the page.
// Content is visible before JavaScript, if it fails, and with reduced motion.
(() => {
  const root = document.documentElement;
  const main = document.querySelector('main');
  if (!main) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const progress = document.createElement('div');
  progress.className = 'senz-reading-progress';
  progress.setAttribute('aria-hidden', 'true');
  document.body.append(progress);

  let distance = 1;
  let scheduled = false;
  const update = () => {
    scheduled = false;
    progress.style.transform = `scaleX(${Math.min(1, Math.max(0, window.scrollY / distance))})`;
  };
  const measure = () => { distance = Math.max(1, root.scrollHeight - window.innerHeight); update(); };
  const onScroll = () => {
    if (!scheduled) { scheduled = true; window.requestAnimationFrame(update); }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', measure, { passive: true });
  window.addEventListener('pageshow', measure);
  if ('ResizeObserver' in window) new ResizeObserver(measure).observe(document.body);
  measure();

  if (!('IntersectionObserver' in window) || !Element.prototype.animate) return;
  const animations = new Map();
  // Animate content groups, never forms, modal dialogs, live status or whole sections.
  const targets = [...main.querySelectorAll([
    '.signature-hero-copy', '.hero-text', '.guide-intro h1', '.experience-heading h1',
    '.experience-hero h1', '.client-hero h1', '.signature-connection h2',
    '.signature-app-copy', '.signature-app-demo', '.signature-clients h2',
    '.signature-people', '.visual-box', '.hero-product', '.center-head',
    '.catalog-section h2', '.catalog-item', '.service-rail article',
    '.engagement-list li', '.client-step', '.reason-card', '.icon-card',
    '.process-step', '.answer-card', '.product-journey li', '.signature-steps li'
  ].join(','))];
  const reveal = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const el = entry.target;
      reveal.unobserve(el);
      if (reduced.matches || el.contains(document.activeElement)) continue;
      // Start at the element's real position; no layout shift or hidden tab stops.
      const animation = el.animate([
        { transform: 'translateY(18px)' },
        { transform: 'translateY(0)' }
      ], { duration: 650, easing: 'cubic-bezier(.2,.65,.3,1)' });
      animations.set(el, animation);
      animation.onfinish = () => animations.delete(el);
      animation.oncancel = () => animations.delete(el);
    }
  }, { threshold: 0.08, rootMargin: '0px 0px -24px 0px' });
  for (const el of targets) {
    if (!targets.some(parent => parent !== el && parent.contains(el))) reveal.observe(el);
  }
  // Keyboard users never chase a moving control. Changing the OS preference is immediate.
  document.addEventListener('focusin', event => {
    for (const [el, animation] of animations) if (el.contains(event.target)) animation.cancel();
  });
  reduced.addEventListener('change', () => {
    if (reduced.matches) for (const animation of animations.values()) animation.cancel();
  });
})();
