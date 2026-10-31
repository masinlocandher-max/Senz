const { chromium } = require('playwright');
const fs = require('node:fs'); const path = require('node:path');
const siteDir = path.resolve(__dirname, '../..');
const axePath = require.resolve('axe-core/axe.min.js');
const axeSource = fs.readFileSync(axePath, 'utf8');
(async () => {
  process.chdir(siteDir);
  const { server } = require(path.join(siteDir, 'server.js'));
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}`;
  const pages = fs.readdirSync(siteDir).filter((n) => n.endsWith('.html')).concat(fs.readdirSync('products').map((n) => `products/${n}`));
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const problems = [];
  for (const name of pages) {
    const page = await ctx.newPage();
    await page.goto(`${base}/${name}`, { waitUntil: 'load' });
    await page.addScriptTag({ content: axeSource });
    const v = await page.evaluate(async () => (await axe.run(document, { runOnly: ['wcag2a','wcag2aa','wcag21a','wcag21aa'] })).violations.map((x) => `${x.impact} ${x.id} x${x.nodes.length} ${x.nodes[0].target.join(' ')}`));
    v.forEach((d) => problems.push(`${name}: axe ${d}`));
    // Mobile menu: a visible toggle must open a menu with visible links, and close again.
    const toggle = page.locator('button[aria-expanded]:visible').first();
    if (await toggle.count()) {
      await toggle.click();
      await page.waitForTimeout(250);
      const expanded = await toggle.getAttribute('aria-expanded');
      const controls = await toggle.getAttribute('aria-controls');
      const visibleLinks = controls ? await page.locator(`#${controls} a:visible`).count() : await page.locator('nav a:visible').count();
      if (expanded !== 'true' || visibleLinks < 3) problems.push(`${name}: menu toggle expanded=${expanded} visible links=${visibleLinks}`);
      const v2 = await page.evaluate(async () => (await axe.run(document, { runOnly: ['wcag2a','wcag2aa'] })).violations.map((x) => `${x.impact} ${x.id} x${x.nodes.length} ${x.nodes[0].target.join(' ')}`));
      v2.forEach((d) => problems.push(`${name} (menu open): axe ${d}`));
      await page.keyboard.press('Escape'); await page.waitForTimeout(150);
      if (await toggle.getAttribute('aria-expanded') === 'true') { await toggle.click(); await page.waitForTimeout(150); }
      if (await toggle.getAttribute('aria-expanded') !== 'false') problems.push(`${name}: menu does not close`);
    } else problems.push(`${name}: no visible menu toggle at 390px`);
    await page.close();
  }
  await browser.close(); server.close();
  if (problems.length) { console.log(problems.join('\n')); process.exit(1); }
  console.log(`OK: ${pages.length} pages, axe at 390px with menu closed and open, menu opens and closes`);
})().catch((e) => { console.error(e); process.exit(1); });
