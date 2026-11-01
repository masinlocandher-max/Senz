// Non-submitting controls, scroll behavior, and progressive enhancement.
// Browser execution belongs to the hosted checks; no customer inbox is contacted.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '../..');
process.chdir(root);
const { server } = require('../../server.js');
const catalog = require('../../components/product-catalog.json');

(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||undefined});
  let faqButtons = 0, disclosures = 0;
  for (const width of [390, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await context.newPage();
    await page.goto(`${base}/digital-products.html`);
    await page.getByText('Preview how three tools work', { exact: true }).click();
    for (const [choice, preview] of [['show-bookings', 'preview-bookings'], ['show-menu', 'preview-menu'], ['show-followups', 'preview-followups']]) {
      await page.locator(`label[for="${choice}"]`).click();
      assert.ok(await page.locator(`#${choice}`).isChecked());
      assert.ok(await page.locator(`#${preview}`).isVisible());
    }
    await page.locator('label[for="show-menu"]').click();
    await page.locator('label[for="sample-sold-out"]').click();
    assert.ok(await page.locator('.app-menu-sold').isVisible());
    await page.locator('label[for="sample-sold-out"]').click();
    assert.ok(await page.locator('.app-menu-available').isVisible());
    await page.goto(`${base}/index.html`);
    assert.equal(await page.locator('.home-product-groups li').count(), catalog.products.length);
    const flow = await page.evaluate(() => {
      const hero = document.querySelector('.home-opening');
      const sections = [...document.querySelector('main').children];
      const control = hero.querySelector('.button');
      const style = getComputedStyle(control);
      return { second: sections[1].id, radius: parseFloat(style.borderRadius), shadow: style.boxShadow, position: style.position };
    });
    assert.equal(flow.second, 'website-rental');
    assert.ok(flow.radius >= 24 && flow.shadow !== 'none');
    assert.ok(!['absolute','fixed'].includes(flow.position));
    // Wait for the browser's completed scroll, not an intermediate progress frame.
    await page.evaluate(() => {
      window.senzTestScrollEnded = false;
      document.addEventListener('scrollend', () => { window.senzTestScrollEnded = true; }, { once: true });
    });
    await page.keyboard.press('Control+End');
    await page.waitForFunction(() => window.senzTestScrollEnded && window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2);
    assert.ok(await page.evaluate(() => Number(getComputedStyle(document.querySelector('.senz-reading-progress')).transform.split('(')[1].split(',')[0]) > 0.95));
    await page.keyboard.press('Control+Home');
    await page.waitForFunction(() => window.scrollY < 5);
    await page.locator('.home-connection a[href="#digital-solutions"]').click();
    await page.waitForFunction(() => Math.abs(document.querySelector('#digital-solutions').getBoundingClientRect().top) < 40);

    await page.goto(`${base}/faq.html`);
    for (const filter of await page.locator('[data-faq-filter]').all()) {
      await filter.click();
      assert.equal(await filter.getAttribute('aria-pressed'), 'true');
      assert.equal(await page.locator('[data-faq-filter][aria-pressed=true]').count(), 1);
      assert.ok(await page.locator('.faq-item:visible').count());
    }
    await page.locator('[data-faq-filter=all]').click();
    for (const question of await page.locator('.faq-question').all()) {
      const initial = await question.getAttribute('aria-expanded');
      await question.click();
      assert.equal(await question.getAttribute('aria-expanded'), initial === 'true' ? 'false' : 'true');
      await question.click();
      assert.equal(await question.getAttribute('aria-expanded'), initial);
      faqButtons++;
    }

    const pages = fs.readdirSync(root).filter(file => file.endsWith('.html') && /<details\b/.test(fs.readFileSync(path.join(root, file), 'utf8')));
    for (const file of pages) {
      await page.goto(`${base}/${file}`);
      for (const detail of await page.locator('details').all()) {
        const before = await detail.getAttribute('open');
        await detail.locator('summary').click();
        assert.notEqual(await detail.getAttribute('open'), before, `${file}: disclosure opens or closes`);
        await detail.locator('summary').click();
        assert.equal(await detail.getAttribute('open'), before);
        disclosures++;
      }
    }

    await page.goto(`${base}/digital-products.html`);
    const booking = page.locator('[name=tools][value=booking]');
    await booking.check();
    await page.locator('[name=namedUsers]').fill('2');
    const price = catalog.products.find(product => product.id === 'booking').pricePhp;
    await page.waitForFunction(total => document.querySelector('[data-cost-total]').textContent === total, price==null?'Request a Quote':`₱${(price * 2).toLocaleString('en-PH')}`);
    assert.match(await page.locator('[data-cost-action]').getAttribute('href'), /product=booking&seats=2/);
    await page.locator('[name=tools][value=crm]').check();
    assert.match(await page.locator('[data-cost-action]').getAttribute('href'), /contact\.html\?planner=1/);
    await page.locator('[name=namedUsers]').fill('0');
    assert.ok(await page.locator('[data-cost-action]').isHidden());

    await page.goto(`${base}/about.html`);
    await page.locator('[data-consult-open]').click();
    await page.getByRole('button', { name: 'Close consultation form', exact: true }).click();
    assert.equal(await page.locator('#consultModal').getAttribute('aria-hidden'), 'true');

    await page.goto(`${base}/get-started.html`);
    await page.locator('#discovery .choice').first().click();
    await page.getByRole('button', { name: 'Back', exact: true }).click();
    assert.ok(await page.locator('#discovery .choice').count() > 1);
    await context.close();
  }

  for (const options of [{ reducedMotion: 'reduce' }, { javaScriptEnabled: false }]) {
    const context = await browser.newContext({ ...options, viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    await page.goto(`${base}/index.html`);
    assert.ok(await page.locator('h1').isVisible());
    await page.getByRole('link', { name: 'Client access', exact: true }).click();
    assert.ok(page.url().endsWith('/client-access.html'));
    await page.getByText('Android', { exact: true }).click();
    assert.ok(await page.locator('details[open]').count());
    if (options.reducedMotion) assert.equal(await page.evaluate(() => document.getAnimations().filter(animation => animation.playState === 'running').length), 0);
    await context.close();
  }
  await browser.close(); server.close();
  console.log(`Controls: ${faqButtons} FAQ toggles, ${disclosures} disclosures, previews, stock example, cost planner, consultation close and questionnaire back verified at 390/1440px; native scroll, reduced motion and no-JavaScript paths passed`);
})().catch(error => { console.error(error); process.exit(1); });
