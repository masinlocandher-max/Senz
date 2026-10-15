// Mobile menu for the shared SENZ header. Without JavaScript the navigation stays visible.
(() => {
  const header = document.querySelector('.sz-header');
  const button = header && header.querySelector('.sz-menu-button');
  if (!button) return;
  const close = () => { header.classList.remove('is-open'); button.setAttribute('aria-expanded', 'false'); };
  button.addEventListener('click', () => {
    const open = header.classList.toggle('is-open');
    button.setAttribute('aria-expanded', String(open));
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && header.classList.contains('is-open')) { close(); button.focus(); }
  });
  window.addEventListener('resize', () => { if (window.innerWidth > 1000) close(); }, { passive: true });
})();
