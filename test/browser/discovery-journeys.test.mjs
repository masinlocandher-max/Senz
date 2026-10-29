// Every audience completes the real discovery page in a browser, at phone width, and submits an
// inquiry through the real inquiry server. A local stand-in for the email provider records exactly
// what SENZ would receive. Each recommendation must state the customer's problem, the SENZ
// solution, its limits, and the next action. Run with `npm run test:browser`.

import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createRequire } from 'node:module';
import { chromium } from 'playwright';

const require = createRequire(import.meta.url);
const engine = require('../../components/discovery-engine.js');

// The audience and the answers that matter for it; other questions take their first option.
const JOURNEYS = [
  ['individual', { audience: 'myself', need: 'writing' }],
  ['professional', { audience: 'professional', need: 'visibility' }],
  ['business', { audience: 'business', need: 'customers' }],
  ['company', { audience: 'organization', need: 'events' }],
  ['educational institution', { audience: 'education', need: 'institutional', outcome: 'learners' }],
  ['government office', { audience: 'government', need: 'communications' }],
  ['custom inquiry', { audience: 'other', need: 'unsure', context: 'We run a farmers cooperative and are not sure where to start.' }]
];

const deliveries = [];
const listen = (server) => new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(`http://127.0.0.1:${server.address().port}`)));
const squash = (s) => s.replace(/\s+/g, ' ').trim();

const provider = http.createServer((req, res) => {
  let body = '';
  req.on('data', (c) => { body += c; });
  req.on('end', () => {
    deliveries.push(JSON.parse(body));
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: 'true' }));
  });
});
process.env.SENZ_FORM_DELIVERY_ENDPOINT = await listen(provider);
const { server } = require('../../server.js');
const base = `${await listen(server)}/`;
const browser = await chromium.launch();
test.after(async () => {
  await browser.close();
  server.close();
  provider.close();
});

async function answerEverything(page, choices) {
  const answers = {};
  for (let step = 0; step < 12; step += 1) {
    if (await page.getByText('Your Recommended SENZ Solution').count()) return answers;
    const form = page.locator('#discovery form');
    const text = form.locator('textarea');
    if (await text.count()) {
      const name = await text.getAttribute('name');
      await text.fill(choices[name]);
      answers[name] = choices[name];
    } else {
      const first = form.locator('input[type=radio]').first();
      const name = await first.getAttribute('name');
      const value = choices[name] ?? await first.getAttribute('value');
      await form.locator('label', { has: page.locator(`input[name="${name}"][value="${value}"]`) }).click();
      answers[name] = value;
    }
    await form.locator('button[type=submit]').click();
  }
  throw new Error('discovery did not reach a recommendation');
}

for (const [label, choices] of JOURNEYS) {
  test(`${label}: discovery explains the problem, solution, limits, and next action, and the inquiry arrives`, async () => {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    // Nothing leaves the local site: the page talks only to the local inquiry server.
    await page.route('**/*', (route) => (route.request().url().startsWith(base) ? route.continue() : route.abort()));
    await page.addInitScript(() => { window.SENZ_API_BASE_URL = window.location.origin; });
    await page.goto(`${base}get-started.html`);
    await page.getByRole('button', { name: 'Let’s Start' }).click();
    const answers = await answerEverything(page, choices);

    const r = engine.recommend(answers);
    assert.ok(r.valid, `${label}: valid answers ${JSON.stringify(answers)}`);
    const result = page.locator('#discovery');
    assert.equal(squash(await result.locator('h1').innerText()), r.name, 'the solution');
    const shown = squash(await result.innerText());
    assert.ok(shown.includes(squash(`The problem: ${r.challenge}`)), `${label}: the customer's problem`);
    if (r.productId) assert.ok(shown.includes(squash(`What it does: ${r.purpose}`)), `${label}: what the product does`);
    assert.ok(shown.includes(squash(r.limitations)), `${label}: the limits`);
    assert.ok(await result.getByRole('heading', { name: r.nextAction }).count(), `${label}: the next action`);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `${label}: fits a phone screen`);

    const before = deliveries.length;
    await page.waitForTimeout(1300); // the server refuses forms completed faster than a person could
    await page.getByLabel('Your name').fill(`Test ${label}`);
    await page.getByLabel('Email address').fill('visitor@example.com');
    await page.getByLabel(/I agree that SENZ may use these details/).check();
    await page.getByRole('button', { name: r.nextAction }).click();
    await page.getByText(/Inquiry submitted\. Reference: [0-9a-f-]{36}/).waitFor();

    assert.equal(deliveries.length, before + 1, `${label}: one email to SENZ`);
    const email = deliveries.at(-1);
    assert.equal(email['Submission type'], 'discovery');
    assert.equal(email['Project type'], r.name);
    assert.deepEqual(JSON.parse(email['Detail — Discovery answers']), r.answers, 'SENZ receives the answers the visitor gave');
    assert.equal(email['Detail — Recommended product'], r.productId || 'None (SENZ service)');
    assert.equal(email['Detail — Quote status'], 'New inquiry; no price or entitlement granted');
    assert.match(email['Consent to reply'], /^Yes \(/);
    assert.equal(email['Marketing consent'], 'No: reply to this inquiry only');
    assert.deepEqual(errors, [], `${label}: no page errors`);
    await page.close();
  });
}

test('every audience the questionnaire offers has a journey here', () => {
  assert.deepEqual(engine.audiences.map((a) => a.value).sort(), JOURNEYS.map(([, c]) => c.audience).sort());
});
