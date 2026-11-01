import { normalizeControlIcons } from './control-icons.mjs';

const primaryLinks = [
  ['services.html', 'Solutions'],
  ['digital-products.html', 'SENZ App'],
  ['about.html', 'About'],
  ['contact.html', 'Contact']
];

export function siteHeader(file) {
  const prefix = file.startsWith('products/') ? '../' : '';
  const home = prefix + 'index.html';
  const links = primaryLinks.map(([href, label]) => {
    const current = (href === file || (href === 'digital-products.html' && file.startsWith('products/'))) ? ' aria-current="page"' : '';
    return `<a href="${prefix}${href}"${current}>${label}</a>`;
  }).join('');
  return `<header class="senz-global-header"><div class="senz-global-inner"><a class="senz-lockup" href="${home}"><img src="${prefix}assets/senz-original-mark.png" width="48" height="48" alt=""><span><strong>SENZ</strong><small><span class="brand-descriptor">Strategic Communications &amp; Digital Solutions</span>An FMB&amp;CO brand</small></span></a><nav class="senz-global-nav" id="primary-navigation" aria-label="Main navigation">${links}<a class="senz-mobile-start" href="${prefix}get-started.html">Get Started</a></nav><a class="senz-client-access" href="${prefix}client-access.html"${file === 'client-access.html' ? ' aria-current="page"' : ''}>Client access</a><a class="senz-start" href="${prefix}get-started.html"${file === 'get-started.html' ? ' aria-current="page"' : ''}>Get Started</a><button class="senz-menu-toggle" type="button" aria-controls="primary-navigation" aria-expanded="false" hidden>Menu</button></div></header>`;
}

export function siteFooter(file) {
  const p = file.startsWith('products/') ? '../' : '';
  return `<footer class="senz-global-footer"><div class="senz-footer-inner"><div><a class="senz-lockup" href="${p}index.html"><img src="${p}assets/senz-original-mark.png" width="48" height="48" alt=""><span><strong>SENZ</strong><small><span class="brand-descriptor">Strategic Communications &amp; Digital Solutions</span>An FMB&amp;CO brand</small></span></a><p>Influence Through Clarity.</p></div><div><h2>Work with SENZ</h2><nav aria-label="Services and software"><a href="${p}client-access.html">Client access &amp; app installation</a><a href="${p}get-started.html">Find a solution</a><a href="${p}services.html">Professional services</a><a href="${p}digital-products.html">SENZ App &amp; pricing</a><a href="${p}contact.html">Discuss a project</a><a href="mailto:info.senz.pr@gmail.com">info.senz.pr@gmail.com</a></nav></div><div><h2>About SENZ</h2><nav aria-label="Company and resources"><a href="${p}about.html#partner-program">Partner Program</a><a href="${p}careers.html">Creative Network</a><a href="${p}answers.html">Communications guides</a><a href="${p}faq.html">Frequently asked questions</a><a href="${p}privacy.html">Privacy</a><a href="${p}terms.html">Terms</a></nav></div></div><div class="senz-footer-bottom"><span>© 2026 SENZ. An FMB&amp;CO brand.</span></div></footer>`;
}

// Keep the same working links in the HTML sent to browsers and crawlers, including without JavaScript.
export function applySiteShell(html, file) {
  const p = file.startsWith('products/') ? '../' : '';
  let result = html
    .replace(/<header class="senz-global-header">[\s\S]*?<\/header>/, () => siteHeader(file))
    .replace(/<footer class="senz-global-footer">[\s\S]*?<\/footer>/, () => siteFooter(file));
  if (!result.includes('components/navigation.css')) {
    result = result.replace('</head>', `<link rel="stylesheet" href="${p}components/navigation.css">\n</head>`);
  }
  if (!result.includes('components/navigation.js')) {
    result = result.replace('</body>', `<script src="${p}components/navigation.js" defer></script>\n</body>`);
  }
  if (!result.includes('components/signature-motion.js')) {
    result = result.replace('</body>', `<script src="${p}components/signature-motion.js" defer></script>\n</body>`);
  }
  if (!result.includes('components/experience.css')) {
    result = result.replace('</head>', `<link rel="stylesheet" href="${p}components/experience.css?v=20261101-signature-v3">\n</head>`);
  }
  if (!result.includes('components/signature.css')) {
    result = result.replace('</head>', `<link rel="stylesheet" href="${p}components/signature.css?v=20261101-signature-v3">\n</head>`);
  }
  result = result.replaceAll('assets/fonts/montserrat-latin-wght-v31.woff2', 'assets/fonts/InterVariable.woff2');
  // Pages/CDN caches old script URLs. Update the revision when changing the public journey.
  const changedAsset = /(components\/(?:navigation\.(?:css|js)|experience\.css|signature\.css|signature-motion\.js|launch-polish\.css|chat-support\.js|cost-(?:model|planner)\.js|discovery(?:-model)?\.js|approved-pages\.js|form-router\.js|purchase\.js|commerce\.css))(?:\?v=[^"']*)?(?=["'])/g;
  return normalizeControlIcons(result.replace(changedAsset, '$1?v=20261101-signature-v6'));
}
