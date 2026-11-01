// Opens every website page in Chromium at phone and desktop widths and reports problems.
// Run with npm run test:browser. Fails on any problem.
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');

const siteDir = path.resolve(__dirname, '../..');
const axePath = require.resolve('axe-core/axe.min.js');
const axeSource = fs.readFileSync(axePath, 'utf8');

async function main() {
  const delivery = http.createServer((req, res) => { req.resume(); req.on('end', () => { res.writeHead(200, { 'content-type': 'application/json' }); res.end('{"success":true}'); }); });
  await new Promise((r) => delivery.listen(0, '127.0.0.1', r));
  process.env.SENZ_FORM_DELIVERY_ENDPOINT = `http://127.0.0.1:${delivery.address().port}`;
  process.chdir(siteDir);
  const { server } = require(path.join(siteDir, 'server.js'));
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}`;

  const pages = fs.readdirSync(siteDir).filter((n) => n.endsWith('.html'))
    .concat(fs.readdirSync(path.join(siteDir, 'products')).filter((n) => n.endsWith('.html')).map((n) => `products/${n}`));
  pages.push('legit-official-site/');
  const browser = await chromium.launch();
  const problems = [];
  const external = new Set();
  const linkTargets = new Map(); // url -> [from pages]
  const anchorIds = new Map();   // page path -> Set(ids)
  let controlsChecked = 0;
  const note = (page, width, kind, detail) => problems.push({ page, width, kind, detail: String(detail).slice(0, 300) });

  for (const width of [320, 390, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    await context.addInitScript((api) => { window.SENZ_API_BASE_URL = api; }, base);
    for (const name of pages) {
      const page = await context.newPage();
      const consoleErrors = [];
      page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
      page.on('pageerror', (e) => note(name, width, 'script error', e.message));
      page.on('requestfailed', (r) => {
        const u = new URL(r.url());
        if (u.origin === base) note(name, width, 'failed request', `${r.url()} ${r.failure()?.errorText}`);
        else external.add(u.host);
      });
      page.on('response', (r) => {
        const u = new URL(r.url());
        if (u.origin === base && r.status() >= 400) note(name, width, `HTTP ${r.status()}`, r.url());
        if (u.origin !== base) external.add(u.host);
      });
      const res = await page.goto(`${base}/${name}`, { waitUntil: 'load' });
      if (!res || res.status() !== 200) note(name, width, 'page status', res && res.status());
      await page.waitForTimeout(300);
      const info = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth - window.innerWidth,
        wide: [...document.querySelectorAll('body *')].filter((el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.right > window.innerWidth + 1 && getComputedStyle(el).position !== 'fixed'; }).slice(0, 3).map((el) => `${el.tagName.toLowerCase()}.${el.className}`),
        brokenImages: [...document.images].filter((i) => i.complete && i.naturalWidth === 0 && i.src.startsWith(location.origin)).map((i) => i.getAttribute('src')),
        links: [...document.querySelectorAll('a[href]')].map((a) => a.href).filter((h) => h.startsWith(location.origin)),
        ids: [...document.querySelectorAll('[id]')].map((e) => e.id),
        h1: document.querySelectorAll('h1').length,
        title: document.title,
        lang: document.documentElement.lang,
        brandFont: getComputedStyle(document.body).fontFamily,
        brandColor: getComputedStyle(document.documentElement).getPropertyValue('--senz-blue').trim(),
        header: document.querySelectorAll('.senz-global-header').length,
        footer: document.querySelectorAll('.senz-global-footer').length,
        motion: Boolean(document.querySelector('.senz-reading-progress')),
        controls: [...document.querySelectorAll('a,button,summary,[role=button],input[type=submit],input[type=button]')].map(el => ({
          text: [el.textContent, el.getAttribute('aria-label'), el.value, getComputedStyle(el, '::before').content, getComputedStyle(el, '::after').content].filter(Boolean).join(' '),
          name: el.getAttribute('aria-label') || el.textContent.trim() || el.value || '',
          icons: [...el.querySelectorAll('.senz-control-icon')].every(icon => icon.getAttribute('aria-hidden') === 'true' && icon.getAttribute('focusable') === 'false')
        }))
      }));
      if (info.overflow > 1) note(name, width, 'horizontal overflow', `${info.overflow}px ${info.wide.join(' ')}`);
      for (const src of info.brokenImages) note(name, width, 'broken image', src);
      if (!info.brandFont.startsWith('Inter') || info.brandColor !== '#003df9' || info.header !== 1 || info.footer !== 1 || !info.motion) note(name, width, 'inconsistent SENZ shell', JSON.stringify({ font: info.brandFont, color: info.brandColor, header: info.header, footer: info.footer, motion: info.motion }));
      controlsChecked += info.controls.length;
      for (const control of info.controls) {
        if (/[\p{Extended_Pictographic}\u2190-\u21ff\u2600-\u27bf\uFE0F\u200D×]/u.test(control.text)) note(name, width, 'emoji or font icon in control', control.text);
        if (!control.name) note(name, width, 'unnamed control', '');
        if (!control.icons) note(name, width, 'decorative icon exposed to accessibility tree', control.name);
      }
      if (width === 1440) {
        if (info.h1 !== 1) note(name, width, 'h1 count', info.h1);
        if (!info.title) note(name, width, 'missing title', '');
        if (!info.lang) note(name, width, 'missing lang', '');
        anchorIds.set(`/${name}`, new Set(info.ids));
        if (name === 'index.html') anchorIds.set('/', new Set(info.ids));
        for (const l of info.links) { const arr = linkTargets.get(l) || []; arr.push(name); linkTargets.set(l, arr); }
        await page.addScriptTag({ content: axeSource });
        const axe = await page.evaluate(async () => (await window.axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] })).violations
          .map((v) => ({ id: v.id, impact: v.impact, n: v.nodes.length, target: v.nodes[0]?.target?.join(' ') })));
        for (const v of axe) note(name, width, `axe ${v.impact}`, `${v.id} x${v.n} ${v.target}`);
      }
      for (const text of consoleErrors) if (!/ERR_TUNNEL|ERR_PROXY|net::ERR_|Failed to load resource/.test(text)) note(name, width, 'console error', text);
      await page.close();
    }
    await context.close();
  }

  // Every internal link resolves, and every #anchor exists on its target page.
  for (const [url, from] of linkTargets) {
    const u = new URL(url);
    const r = await fetch(`${base}${u.pathname}`);
    if (r.status !== 200) { note(from[0], 1440, 'broken link', `${u.pathname} (from ${from.length} page(s))`); continue; }
    if (u.hash && u.hash.length > 1) {
      const ids = anchorIds.get(u.pathname) || anchorIds.get(u.pathname.replace(/\/$/, '/index.html'));
      const id = decodeURIComponent(u.hash.slice(1));
      if (ids && !ids.has(id)) note(from[0], 1440, 'missing anchor', `${u.pathname}#${id} (from ${from.join(', ').slice(0, 120)})`);
      if (!ids) note(from[0], 1440, 'anchor on unchecked page', `${u.pathname}${u.hash}`);
    }
  }

  // The not-found page, served at a nested missing address, still loads every style and script.
  {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    const failed = [];
    page.on('response', (r) => { if (new URL(r.url()).origin === base && r.status() >= 400 && !r.url().endsWith('/products/fotolab.html')) failed.push(`${r.status()} ${r.url()}`); });
    page.on('pageerror', (e) => failed.push(e.message));
    const res = await page.goto(`${base}/products/fotolab.html`, { waitUntil: 'load' });
    if (res.status() !== 404) note('404.html', 390, 'status', res.status());
    if (!(await page.getByRole('heading', { name: 'This page is not here.' }).isVisible())) note('404.html', 390, 'not rendered', '');
    const styled = await page.evaluate(() => getComputedStyle(document.querySelector('.senz-global-header')).position);
    if (!styled || styled === 'static') note('404.html', 390, 'header unstyled at a nested address', styled);
    for (const f of failed) note('404.html', 390, 'nested address', f);
    await context.close();
  }

  await browser.close();
  server.close(); delivery.close();
  console.log(`Pages: ${pages.length} at 320, 390 and 1440px; ${linkTargets.size} internal links; outside hosts: ${[...external].sort().join(', ') || 'none'}`);
  console.log(`Control labels and icons checked: ${controlsChecked}; shared SENZ font, palette, header, footer and motion present on every page`);
  if (problems.length) { console.log(JSON.stringify(problems, null, 1)); process.exit(1); }
}
main().catch((e) => { console.error(e); process.exit(1); });
