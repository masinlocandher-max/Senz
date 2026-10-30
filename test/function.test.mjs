import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = name => readFileSync(path.join(root, name), 'utf8');
const contract = JSON.parse(read('function.json'));

const forbidden = ['clone studio', 'ticketing', 'tabulation'];

test('public pages repeat each product function and do not invent another one', () => {
  const page = read('digital-products.html');
  const faq = read('faq.html');
  const agents = read('agents.js');
  const chat = read('components/chat-support.js');
  for (const product of contract.products.filter(p => !p.parked)) {
    assert.ok(page.includes(product.name), product.name);
    assert.ok(page.includes(product.function), product.function);
  }
  assert.equal(page.includes('app.senzpr.com'), false);
  for (const file of [page, faq, agents, chat]) {
    const hits = file.toLowerCase().split('\n').filter((line) => (
      !line.includes('match:') && forbidden.some((phrase) => line.includes(phrase) && !/\b(not|no|never|without)\b/.test(line))
    ));
    assert.deepEqual(hits, []);
  }
  assert.match(read('music.html'), /not the SENZ Music Platform/);
  assert.equal(contract.website.function.includes('does not sign people in'), true);
  assert.equal(contract.app.function.includes('only after SENZ staff verify payment'), true);
});

