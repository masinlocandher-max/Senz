'use strict';

// The website's inquiry forms: the sleeping inquiry service is woken when a visitor starts a form,
// a slow first submission shows progress instead of failing at 20 seconds, and the logo links'
// accessible names match their visible text.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(ROOT, file), 'utf8');

function browser({ fetch } = {}) {
  const listeners = {};
  const timers = [];
  const context = {
    console,
    AbortController,
    fetch: fetch || (() => Promise.resolve({ ok: true, json: async () => ({ ok: true }) })),
    document: { addEventListener: (type, fn) => { (listeners[type] ||= []).push(fn); } },
    location: { origin: 'https://www.senzpr.com' },
    FormData: class { constructor(form) { this.form = form; } entries() { return Object.entries(this.form.values)[Symbol.iterator](); } }
  };
  context.window = context;
  context.setTimeout = (fn, ms) => { timers.push({ fn, ms }); return timers.length; };
  context.clearTimeout = (id) => { if (timers[id - 1]) timers[id - 1].cleared = true; };
  vm.createContext(context);
  return { context, listeners, timers };
}

test('starting any form wakes the inquiry service once; nothing else does', () => {
  const calls = [];
  const b = browser({ fetch: (url, opts) => { calls.push([url, opts]); return Promise.resolve({}); } });
  vm.runInContext(read('components/site-config.js'), b.context);
  const focus = (insideForm) => b.listeners.focusin.forEach((fn) => fn({ target: { closest: (sel) => (sel === 'form' && insideForm ? {} : null) } }));
  focus(false);
  assert.equal(calls.length, 0, 'focus outside a form does not call the service');
  focus(true);
  focus(true);
  assert.equal(calls.length, 1, 'woken once per page');
  assert.equal(calls[0][0], 'https://senz-api-8vt4.onrender.com/api/health');
  assert.equal(calls[0][1].mode, 'no-cors');
});

test('a slow first submission shows progress and waits up to a minute before giving up', async () => {
  let respond;
  const b = browser({ fetch: () => new Promise((resolve) => { respond = resolve; }) });
  vm.runInContext(read('components/site-config.js'), b.context);
  vm.runInContext(read('components/form-router.js'), b.context);
  const forms = b.context.SENZForms;
  assert.ok(forms.REQUEST_TIMEOUT_MS >= 60000, 'long enough for the service to start');
  const status = { dataset: {}, textContent: '' };
  const button = { disabled: false };
  const form = {
    dataset: { formKind: 'general', formStartedAt: '1' },
    values: { name: 'Ana Cruz', email: 'ana@example.com', message: 'We need a website.' },
    querySelector: () => button,
    setAttribute() {}, removeAttribute() {}, reset() { this.wasReset = true; }
  };
  const pending = forms.submit(form, status);
  assert.equal(status.dataset.state, 'sending');
  const abort = b.timers.find((t) => t.ms === forms.REQUEST_TIMEOUT_MS);
  const slow = b.timers.find((t) => t.ms === forms.SLOW_NOTICE_MS);
  assert.ok(abort && slow && slow.ms < abort.ms);
  slow.fn();
  assert.match(status.textContent, /^Still sending\. .*up to a minute/);
  respond({ ok: true, json: async () => ({ ok: true, id: 'SENZ-1' }) });
  const result = await pending;
  assert.equal(result.ok, true);
  assert.equal(status.dataset.state, 'success');
  assert.ok(form.wasReset && !button.disabled);
  assert.ok(abort.cleared && slow.cleared, 'no late timers after the answer');
});

test('a failed delivery still tells the visitor how to reach SENZ', async () => {
  const b = browser({ fetch: () => Promise.resolve({ ok: false, status: 502, json: async () => ({ ok: false }) }) });
  vm.runInContext(read('components/form-router.js'), b.context);
  const status = { dataset: {}, textContent: '' };
  const form = { dataset: { formKind: 'general' }, values: { name: 'Ben' }, querySelector: () => null, setAttribute() {}, removeAttribute() {}, reset() {} };
  const result = await b.context.SENZForms.submit(form, status);
  assert.equal(result.ok, false);
  assert.equal(status.dataset.state, 'error');
  assert.match(status.textContent, /info\.senz\.pr@gmail\.com/);
});

test('the discovery form also waits up to a minute and shows progress', () => {
  const source = read('components/discovery.js');
  assert.match(source, /controller\.abort\(\),60000\)/);
  assert.match(source, /Still sending\. The inquiry service can take up to a minute/);
  assert.doesNotMatch(source, /controller\.abort\(\),20000\)/);
});

test('logo links are named by their visible text', () => {
  const pages = fs.readdirSync(ROOT).filter((f) => f.endsWith('.html'));
  for (const page of pages) {
    const html = read(page);
    assert.doesNotMatch(html, /aria-label="SENZ home"/, `${page}: an aria-label that hides the visible brand text`);
    for (const link of html.match(/<a class="senz-lockup"[^>]*>[\s\S]*?<\/a>/g) || []) {
      assert.doesNotMatch(link, /aria-label=/, `${page}: lockup link label`);
      assert.match(link.replace(/<[^>]+>/g, ' '), /SENZ/, `${page}: lockup link has visible text`);
    }
  }
});

test('forms send the consent boxes as the visitor left them; marketing stays off unless ticked', () => {
  const b = browser();
  vm.runInContext(read('components/form-router.js'), b.context);
  const payload = (values, formKind = 'general') => b.context.SENZForms.buildPayload({ dataset: { formKind }, values });
  for (const kind of ['general', 'consultation', 'creative-pool']) {
    assert.deepEqual([payload({ name: 'A', privacyConsent: 'on' }, kind).consent, payload({ name: 'A', privacyConsent: 'on' }, kind).marketingConsent], [true, false], kind);
    assert.equal(payload({ name: 'A' }, kind).consent, false, `${kind}: no tick, no consent`);
    assert.equal(payload({ name: 'A', privacyConsent: 'on', marketingConsent: 'on' }, kind).marketingConsent, true);
  }
  for (const page of ['contact.html', 'about.html', 'careers.html']) {
    const html = read(page);
    assert.match(html, /name="privacyConsent" required/, `${page}: consent to a reply is required`);
    assert.match(html, /name="marketingConsent" \/>/, `${page}: the updates box is optional and unticked`);
    assert.doesNotMatch(html, /name="marketingConsent"[^>]*(checked|required)/, `${page}: updates are never pre-ticked or required`);
  }
});

test('discovery sends its consent boxes as left, and measurements carry no personal details', () => {
  const source = read('components/discovery.js');
  assert.match(source, /consent:values\.consent==='on',marketingConsent:values\.marketingConsent==='on'/);
  assert.doesNotMatch(source, /consent:true/);
  const metric = source.match(/function metric\(name\) \{([^}]*\}[^}]*)\}/);
  assert.ok(metric, 'metric function found');
  assert.match(metric[1], /#measurement-consent'\)\?\.checked/, 'measurements only when the visitor opts in');
  assert.match(metric[1], /detail:\{event:name,rulesVersion:engine\.VERSION\}/, 'only the step name and rules version');
});
