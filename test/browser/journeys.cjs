// Every website journey in Chromium through the real inquiry server, delivering to a local
// stand-in for the email provider. Nothing reaches the SENZ inbox.
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');

const siteDir = path.resolve(__dirname, '../..');
const delivered = [];
let providerUp = true;

async function main() {
  const delivery = http.createServer((req, res) => {
    let body = ''; req.on('data', (c) => { body += c; });
    req.on('end', () => {
      if (!providerUp) { res.writeHead(500, { 'content-type': 'application/json' }); res.end('{"success":false}'); return; }
      delivered.push(JSON.parse(body)); res.writeHead(200, { 'content-type': 'application/json' }); res.end('{"success":true}');
    });
  });
  await new Promise((r) => delivery.listen(0, '127.0.0.1', r));
  Object.assign(process.env, { SENZ_FORM_DELIVERY_ENDPOINT: `http://127.0.0.1:${delivery.address().port}`,
    SENZ_INQUIRY_LIMIT_PER_ADDRESS: '1000', SENZ_INQUIRY_LIMIT_PER_HOUR: '1000' });
  process.chdir(siteDir);
  const { server } = require(path.join(siteDir, 'server.js'));
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}`;
  const catalog = JSON.parse(fs.readFileSync(path.join(siteDir, 'components/product-catalog.json'), 'utf8'));
  const browser = await chromium.launch();
  const log = [];
  const errors = [];

  async function newPage(width = 390) {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    await context.addInitScript((api) => { window.SENZ_API_BASE_URL = api; }, base);
    const page = await context.newPage();
    page.on('pageerror', (e) => errors.push(`${page.url()}: ${e.message}`));
    page.on('console', (m) => { if (m.type() === 'error' && !/net::ERR_|Failed to load resource/.test(m.text())) errors.push(`${page.url()}: ${m.text()}`); });
    return page;
  }
  const lastDelivery = () => delivered[delivered.length - 1];
  // Like a person, wait a moment before sending (the server refuses forms sent within 1.2 s).
  async function submitAndConfirm(page) {
    await page.waitForTimeout(1300);
    const invalid = await page.evaluate(() => [...document.querySelectorAll('form[data-senz-form] :invalid')].map((e) => e.name).filter(Boolean));
    if (invalid.length) throw new Error(`${page.url()}: required fields left empty: ${invalid.join(', ')}`);
    const before = delivered.length;
    await page.locator('form[data-senz-form] button[type=submit]').click();
    const statusText = () => page.evaluate(() => [...document.querySelectorAll('form[data-senz-form] .status, form[data-senz-form] .consult-status, form[data-senz-form] .form-status, [role=status], [aria-live]')].map((e) => e.textContent.trim()).filter(Boolean).join(' | '));
    try {
      await page.waitForFunction(() => /received|thank|accepted for delivery/i.test(document.querySelector('form[data-senz-form] .status, form[data-senz-form] .consult-status, form[data-senz-form] .form-status')?.textContent || ''), null, { timeout: 10000 });
    } catch {
      throw new Error(`${page.url()}: no confirmation. Delivered ${delivered.length - before}. Page says: ${(await statusText()).slice(0, 300)}`);
    }
    assert.equal(delivered.length, before + 1, 'exactly one email to SENZ');
    return lastDelivery();
  }

  // 1. Questionnaire to request, and product page to request, for every product.
  for (const product of catalog.products) {
    const want = { audience: product.segments[0], route: 'software', need: product.id, scope: '3', setup: 'system', when: 'month', intent: 'quote' };
    const page = await newPage();
    await page.goto(`${base}/get-started.html`);
    await page.waitForSelector('#discovery .choice, #discovery .seat-choice');
    const answers = {};
    for (const key of ['audience', 'route', 'need', 'scope', 'setup', 'when', 'intent']) {
      const q = await page.evaluate(([k, a]) => fetch('components/product-catalog.json').then((r) => r.json()).then((c) => {
        const q = window.SENZDiscovery.question(k, a, c); return { seats: !!q.seats, options: q.options || null };
      }), [key, answers]);
      if (q.seats) {
        await page.locator('#discovery .seat-choice input').fill(want.scope);
        await page.locator('#discovery .seat-choice button[type=submit]').click();
      } else {
        assert.ok(q.options && q.options[want[key]], `${product.id}: option ${key}=${want[key]} is offered`);
        await page.getByRole('button', { name: q.options[want[key]], exact: true }).click();
      }
      answers[key] = want[key];
    }
    await page.waitForSelector('#discovery .offer-summary');
    const offer = await page.locator('#discovery .offer-summary').textContent();
    const total = (product.pricePhp * 3).toLocaleString('en-PH');
    assert.ok(offer.includes(`₱${total}/month for 3 named users`), `${product.id}: recommendation shows ₱${total} for 3 users, got: ${offer}`);
    assert.equal(await page.locator('#discovery h3').textContent(), product.name);
    // Product page from the recommendation shows the same price and links to the request.
    const detailHref = await page.locator('#discovery a.button.secondary').getAttribute('href');
    const detail = await newPage(1440);
    await detail.goto(`${base}/${detailHref}`);
    const detailText = await detail.locator('main').innerText();
    assert.ok(detailText.includes(`₱${product.pricePhp.toLocaleString('en-PH')}`), `${product.id}: product page shows its price`);
    const requestLinks = await detail.locator(`a[href*="purchase.html"][href*="product=${product.id}"]`).count();
    assert.ok(requestLinks > 0, `${product.id}: product page links to its request form`);
    await detail.context().close();
    // Request from the recommendation.
    await page.locator('#discovery a.button.primary').click();
    await page.waitForURL(/purchase\.html/);
    await page.waitForFunction(() => document.querySelector('#product-request').dataset.monthlyTotal);
    assert.equal(await page.locator('#product-choice').inputValue(), product.id);
    assert.equal(await page.locator('input[name=seats]').inputValue(), '3');
    await page.fill('input[name=name]', 'Maria Santos');
    await page.fill('input[name=email]', 'maria@example.com');
    await page.check('input[name=privacyConsent]');
    const sent = await submitAndConfirm(page);
    assert.equal(sent['Detail — productKey'], product.id);
    assert.equal(sent['Submission type'], 'product');
    assert.equal(sent['Detail — seats'], '3');
    assert.equal(Number(sent['Detail — monthlyTotalPhp']), product.pricePhp * 3, `${product.id}: SENZ receives the right total`);
    assert.equal(sent.Email, 'maria@example.com');
    log.push(`${product.name}: questionnaire → recommendation ₱${total} for 3 → product page → request delivered (seats 3, ₱${total})`);
    await page.context().close();

    // Request from the product page, one seat.
    const direct = await newPage(1440);
    await direct.goto(`${base}/products/${product.id}.html`);
    await direct.locator(`a[href*="purchase.html"][href*="product=${product.id}"]`).first().click();
    await direct.waitForURL(/purchase\.html/);
    await direct.waitForFunction(() => document.querySelector('#product-request').dataset.monthlyTotal);
    assert.equal(await direct.locator('#product-choice').inputValue(), product.id);
    if (!(await direct.locator('input[name=seats]').inputValue())) await direct.fill('input[name=seats]', '1');
    const seatsChosen = Number(await direct.locator('input[name=seats]').inputValue());
    await direct.fill('textarea[name=message]', 'Please confirm availability and the activation date.');
    await direct.fill('input[name=name]', 'Jose Reyes');
    await direct.fill('input[name=email]', 'jose@example.com');
    await direct.check('input[name=privacyConsent]');
    const sent2 = await submitAndConfirm(direct);
    assert.equal(Number(sent2['Detail — monthlyTotalPhp']), product.pricePhp * seatsChosen);
    log.push(`${product.name}: product page → request delivered (${seatsChosen} seat, ₱${(product.pricePhp * seatsChosen).toLocaleString('en-PH')})`);
    await direct.context().close();
  }

  // 2. Changing the seat count on the request form updates the total; an unknown product is refused.
  {
    const page = await newPage();
    await page.goto(`${base}/purchase.html?product=qr-menu`);
    await page.waitForFunction(() => document.querySelector('#product-request').dataset.monthlyTotal);
    await page.fill('input[name=seats]', '7');
    const p = catalog.products.find((x) => x.id === 'qr-menu');
    assert.ok((await page.locator('#offer-summary').innerText()).includes(`₱${(p.pricePhp * 7).toLocaleString('en-PH')}/month for 7`));
    await page.fill('input[name=seats]', '0');
    assert.equal(await page.locator('#product-request button[type=submit]').isDisabled(), true, 'zero seats cannot be sent');
    await page.goto(`${base}/purchase.html?product=fotolab`);
    await page.waitForTimeout(500);
    assert.match(await page.locator('#offer-summary').innerText(), /unavailable|Choose a product/);
    log.push('Request form: seat changes update the total; zero seats cannot be sent; a removed product (FotoLab) is refused');
    await page.context().close();
  }

  // 3. Contact, consultation, and careers forms.
  const simple = [
    ['contact.html', async (page) => {
      await page.fill('input[name=name]', 'Ana Cruz'); await page.fill('input[name=email]', 'ana@example.com');
      for (const sel of ['inquiryType', 'timeline', 'budget']) { const s = page.locator(`select[name=${sel}]`); if (await s.count()) await s.selectOption({ index: 1 }); }
      await page.fill('textarea[name=message]', 'We need help planning a product launch.');
    }, 'general'],
    ['about.html', async (page) => {
      await page.locator('[data-consult-open]:visible').first().click();
      await page.locator('#consultModal input[name=date]').waitFor({ state: 'visible' });
      await page.fill('textarea[name=notes]', 'We want to reposition our brand before a product launch.');
      const d = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
      await page.fill('input[name=date]', d); await page.fill('input[name=time]', '10:30');
      await page.fill('input[name=name]', 'Ben Lim'); await page.fill('input[name=email]', 'ben@example.com');
      const s = page.locator('select[name=service]'); if (await s.count()) await s.selectOption({ index: 1 });
    }, 'consultation'],
    ['careers.html', async (page) => {
      const s = page.locator('select[name=role]'); if (await s.count()) await s.selectOption({ index: 1 }); else await page.fill('[name=role]', 'Designer');
      await page.fill('input[name=name]', 'Carla Diaz'); await page.fill('input[name=email]', 'carla@example.com');
      await page.fill('input[name=portfolio]', 'https://example.com/portfolio');
      await page.fill('textarea[name=introduction]', 'Photographer and designer based in Manila.');
    }, 'creative-pool'],
    ['partner-program.html', async (page) => {
      await page.fill('input[name=name]', 'Dina Mercado'); await page.fill('input[name=email]', 'dina@example.com');
      await page.fill('input[name=location]', 'Zambales');
      for (const sel of ['businessStage', 'customerFocus', 'partnerInterest', 'timeline']) await page.locator(`select[name=${sel}]`).selectOption({ index: 1 });
      await page.fill('textarea[name=message]', 'I advise small businesses and want to offer practical customer experience tools.');
    }, 'partner']
  ];
  for (const [file, fill, type] of simple) {
    for (const width of [390, 1440]) {
      const page = await newPage(width);
      await page.goto(`${base}/${file}`);
      await fill(page);
      // Without consent the form is not sent.
      const before = delivered.length;
      await page.waitForTimeout(1300);
      await page.locator('form[data-senz-form] button[type=submit]').click();
      await page.waitForTimeout(500);
      assert.equal(delivered.length, before, `${file}: nothing is sent without privacy consent`);
      await page.check('input[name=privacyConsent]');
      const sent = await submitAndConfirm(page);
      assert.equal(sent['Submission type'], type);
      log.push(`${file} at ${width}px: refused without consent, then delivered (${type})`);
      await page.context().close();
    }
  }

  // 3b. Every "Request a Consultation" button opens a working form, which Escape closes.
  {
    const files = fs.readdirSync(siteDir).filter((n) => n.endsWith('.html')).concat(fs.readdirSync(path.join(siteDir, 'products')).map((n) => `products/${n}`));
    let checked = 0;
    for (const width of [390, 1440]) {
      const page = await newPage(width);
      for (const file of files) {
        if (!fs.readFileSync(path.join(siteDir, file), 'utf8').includes('data-consult-open')) continue;
        await page.goto(`${base}/${file}`);
        const buttons = page.locator('[data-consult-open]:visible');
        const n = await buttons.count();
        for (let i = 0; i < n; i += 1) {
          await buttons.nth(i).click();
          await page.locator('form[data-form-kind=consultation] input[name=date]').waitFor({ state: 'visible', timeout: 3000 })
            .catch(() => { throw new Error(`${file} at ${width}px: consultation button ${i + 1} does not open the form`); });
          await page.keyboard.press('Escape');
          await page.locator('form[data-form-kind=consultation] input[name=date]').waitFor({ state: 'hidden', timeout: 3000 })
            .catch(() => { throw new Error(`${file} at ${width}px: Escape does not close the consultation form`); });
          checked += 1;
        }
      }
      await page.context().close();
    }
    log.push(`Consultation buttons: ${checked} visible buttons across pages and widths open the form; Escape closes it`);
  }

  // 4. If the email provider fails, the visitor is told and given SENZ's address; nothing is lost silently.
  {
    providerUp = false;
    const page = await newPage();
    await page.goto(`${base}/contact.html`);
    await page.fill('input[name=name]', 'Ana Cruz'); await page.fill('input[name=email]', 'ana@example.com');
    await page.fill('textarea[name=message]', 'Testing a provider outage.');
    for (const sel of ['inquiryType', 'timeline', 'budget']) { const s = page.locator(`select[name=${sel}]`); if (await s.count()) await s.selectOption({ index: 1 }); }
    await page.check('input[name=privacyConsent]');
    const before = delivered.length;
    await page.waitForTimeout(1300);
    await page.locator('form[data-senz-form] button[type=submit]').click();
    await page.waitForFunction(() => /info\.senz\.pr@gmail\.com/.test(document.querySelector('form[data-senz-form] .status, form[data-senz-form] .form-status')?.textContent || ''), null, { timeout: 10000 });
    providerUp = true;
    assert.equal(delivered.length, before, 'nothing is recorded as delivered');
    log.push('Email provider outage: the visitor sees an error with SENZ\'s email address');
    await page.context().close();
  }

  // 5. The questionnaire's service route ends in a request that reaches SENZ.
  {
    const page = await newPage();
    await page.goto(`${base}/get-started.html`);
    await page.waitForSelector('#discovery .choice');
    const answers = {};
    for (const key of ['audience', 'route', 'need', 'scope', 'setup', 'when', 'intent']) {
      const q = await page.evaluate(([k, a]) => fetch('components/product-catalog.json').then((r) => r.json()).then((c) => window.SENZDiscovery.question(k, a, c)), [key, answers]);
      const value = key === 'route' ? 'services' : Object.keys(q.options)[0];
      await page.getByRole('button', { name: q.options[value], exact: true }).click();
      answers[key] = value;
    }
    await page.waitForSelector('#discovery a.button.primary');
    const href = await page.locator('#discovery a.button.primary').getAttribute('href');
    await page.locator('#discovery a.button.primary').click();
    await page.waitForLoadState('load');
    const form = page.locator('form[data-senz-form]');
    assert.ok(await form.count(), `service request opens a form (${href})`);
    for (const [sel, value] of [['input[name=name]', 'Dana Uy'], ['input[name=email]', 'dana@example.com']]) await page.fill(sel, value);
    const msg = page.locator('textarea[name=message]'); if (await msg.count() && !(await msg.inputValue())) await msg.fill('Brand strategy for our firm.');
    for (const sel of await page.locator('form[data-senz-form] select[required]').all()) if (!(await sel.inputValue())) await sel.selectOption({ index: 1 });
    const date = page.locator('input[name=date]'); if (await date.count()) { await date.fill(new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)); await page.fill('input[name=time]', '14:00'); }
    await page.check('input[name=privacyConsent]');
    const sent = await submitAndConfirm(page);
    log.push(`Questionnaire service route (${answers.need}) → ${href.split('?')[0]} → delivered`);
    assert.ok(sent);
    await page.context().close();
  }

  // Returning clients get useful next steps without repeating discovery or receiving an unverified app link.
  {
    const page = await newPage();
    await page.goto(`${base}/index.html`);
    await page.getByRole('link', { name: 'Client access', exact: true }).click();
    assert.ok(page.url().endsWith('/client-access.html'));
    assert.equal(await page.locator('a[href^="https://app.senzpr.com"]').count(), 0);
    await page.getByRole('link', { name: 'I’ve sent my request', exact: true }).click();
    await page.getByRole('link', { name: /Follow up on my request/ }).click();
    await page.waitForFunction(() => document.querySelector('textarea[name=message]').value.includes('already submitted'));
    assert.equal(await page.locator('input[name=inquiryType]').inputValue(), 'Existing client support');
    assert.equal(await page.locator('[name=budget], [name=timeline]').count(), 0, 'returning clients do not repeat sales qualification');
    await page.fill('input[name=name]', 'Existing Client');
    await page.fill('input[name=email]', 'client@example.com');
    await page.check('input[name=privacyConsent]');
    const followup = await submitAndConfirm(page);
    assert.equal(followup['Project type'], 'Existing client support');
    assert.equal(followup.Budget, '');
    assert.equal(followup['Preferred schedule or timeline'], '');
    assert.match(await page.locator('.form-status').textContent(), /support request was accepted for delivery/);
    assert.equal(await page.locator('input[name=inquiryType]').inputValue(), 'Existing client support', 'form reset preserves support routing');
    await page.goBack();
    await page.getByRole('link', { name: 'Install the app', exact: true }).click();
    await page.getByText('iPhone or iPad', { exact: true }).click();
    assert.ok(await page.locator('details[open]').innerText().then(text => text.includes('Add to Home Screen')));
    log.push('Returning client → follow-up delivered without sales questions; device installation guide opens; unreleased app stays gated');
    await page.context().close();
  }

  await browser.close(); server.close(); delivery.close();
  console.log(log.join('\n'));
  console.log(`\n${delivered.length} inquiries delivered to the stand-in provider; script/console errors: ${errors.length}`);
  if (errors.length) { console.log(errors.join('\n')); process.exit(1); }
}
main().catch((e) => { console.error('FAILED:', e.message, (e.stack.match(/journeys.cjs:\d+/g) || []).join(' ')); process.exit(1); });
