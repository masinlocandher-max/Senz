// Every questionnaire path, in the browser: each audience, route and goal to a recommendation whose
// links open a form or page that loads, prefilled, with no script errors.
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
const siteDir = path.resolve(__dirname, '../..');
(async () => {
  process.chdir(siteDir); const { server } = require(path.join(siteDir, 'server.js'));
  await new Promise((r) => server.listen(0, '127.0.0.1', r)); const base = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||undefined}); const ctx = await browser.newContext({ viewport: { width: 390, height: 900 } });
  const errors = []; let paths = 0; const ends = {};
  const page = await ctx.newPage(); page.on('pageerror', (e) => errors.push(`${page.url()}: ${e.message}`));
  await page.goto(`${base}/get-started.html`); await page.waitForSelector('#discovery .choice');
  const combos = await page.evaluate(() => fetch('components/product-catalog.json').then((r) => r.json()).then((c) => {
    const m = window.SENZDiscovery, out = [];
    for (const audience of Object.keys(m.audiences)) for (const route of Object.keys(m.routes))
      for (const need of Object.keys(m.question('need', { audience, route }, c).options)) out.push({ audience, route, need });
    return out;
  }));
  await page.close();
  for (const combo of combos) {
    const page = await ctx.newPage(); page.on('pageerror', (e) => errors.push(`${page.url()}: ${e.message}`));
    await page.goto(`${base}/get-started.html`); await page.waitForSelector('#discovery .choice');
    const answers = {};
    for (const key of ['audience', 'route', 'need', 'scope', 'setup', 'when', 'intent']) {
      const q = await page.evaluate(([k, a]) => fetch('components/product-catalog.json').then((r) => r.json()).then((c) => { const q = window.SENZDiscovery.question(k, a, c); return { seats: !!q.seats, options: q.options || null }; }), [key, answers]);
      if (q.seats) { await page.fill('#discovery .seat-choice input', '2'); await page.click('#discovery .seat-choice button[type=submit]'); answers[key] = '2'; continue; }
      const value = combo[key] || Object.keys(q.options)[0];
      if (!q.options[value]) throw new Error(`${JSON.stringify(combo)}: option ${key}=${value} missing`);
      await page.getByRole('button', { name: q.options[value], exact: true }).click(); answers[key] = value;
    }
    await page.waitForSelector('#discovery a.button.primary', { timeout: 5000 }).catch(() => { throw new Error(`${JSON.stringify(answers)}: no recommendation`); });
    for (const link of await page.locator('#discovery a.button').all()) {
      const href = await link.getAttribute('href'); const u = new URL(href, `${base}/get-started.html`);
      const r = await fetch(`${base}${u.pathname}`); if (r.status !== 200) errors.push(`${JSON.stringify(answers)} → ${href}: HTTP ${r.status}`);
      ends[u.pathname] = (ends[u.pathname] || 0) + 1;
    }
    // Open the primary action and check the destination form is prefilled.
    const primary = await page.locator('#discovery a.button.primary').getAttribute('href');
    const dest = await ctx.newPage(); dest.on('pageerror', (e) => errors.push(`${dest.url()}: ${e.message}`));
    await dest.goto(new URL(primary, `${base}/get-started.html`).href); await dest.waitForTimeout(400);
    const form = dest.locator('form[data-senz-form]');
    if (!(await form.count())) errors.push(`${primary}: no form`);
    else {
      const msg = await dest.locator('form[data-senz-form] textarea').first().inputValue().catch(() => '');
      if (!msg) errors.push(`${primary}: message not prefilled`);
      if (answers.route === 'software' && answers.need !== 'review') {
        const chosen = await dest.locator('#product-choice').inputValue().catch(() => '');
        if (chosen !== answers.need) errors.push(`${primary}: product ${chosen} instead of ${answers.need}`);
        if ((await dest.locator('input[name=seats]').inputValue()) !== '2') errors.push(`${primary}: seats not 2`);
      }
    }
    await dest.close(); await page.close(); paths += 1;
  }
  await browser.close(); server.close();
  console.log(`${paths} questionnaire paths walked; destinations: ${JSON.stringify(ends)}`);
  if (errors.length) { console.log(errors.slice(0, 30).join('\n')); process.exit(1); }
})().catch((e) => { console.error('FAILED', e.message); process.exit(1); });
