(() => {
  const header = document.querySelector('.senz-global-header');
  const menu = header?.querySelector('#primary-navigation');
  const toggle = header?.querySelector('.senz-menu-toggle');
  if (!menu || !toggle) return;

  const compact = window.matchMedia('(max-width: 1200px)');
  function setOpen(open) {
    toggle.hidden = !compact.matches;
    menu.hidden = compact.matches && !open;
    toggle.setAttribute('aria-expanded', String(compact.matches && open));
  }

  toggle.addEventListener('click', () => setOpen(menu.hidden));
  header.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && compact.matches && !menu.hidden) {
      setOpen(false);
      toggle.focus();
    }
  });
  document.addEventListener('click', (event) => {
    if (compact.matches && !header.contains(event.target)) setOpen(false);
  });
  compact.addEventListener('change', () => setOpen(false));
  setOpen(false);
})();

// A visitor may read a product or service page before sending their guided request.
(() => {
  const query = new URLSearchParams(location.search);
  if (query.get('guide') !== '1') return;
  const file = location.pathname.split('/').pop();
  const product = query.get('product');
  const servicePages = { brand:'brand-strategy-philippines.html', pr:'public-relations-philippines.html', website:'website-strategy-philippines.html', campaign:'strategic-communications-philippines.html', review:'services.html' };
  if (product ? !location.pathname.endsWith('/products/' + product + '.html') : servicePages[query.get('need')] !== file) return;
  for (const a of document.querySelectorAll('main a[href]')) {
    let target = new URL(a.href);
    if (target.origin !== location.origin) continue;
    if (product ? !target.pathname.endsWith('/purchase.html') || target.searchParams.get('product') !== product : !target.pathname.endsWith('/contact.html')) continue;
    if (product && query.get('scope') === 'estimate') {
      target = new URL('../contact.html', location.href);
      target.searchParams.set('product', product);
    }
    for (const key of ['guide','audience','route','need','scope','setup','when','intent','seats','interest']) {
      if (query.has(key)) target.searchParams.set(key, query.get(key).slice(0,160));
    }
    a.href = target.href;
  }
})();
