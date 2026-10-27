// The website's product catalog comes from the SENZ App (components/product-catalog.json, exported
// from the app's src/catalog.js). These tests keep every page that describes products in line with it.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderFile, loadCatalog, RENDERED_FILES } from '../scripts/render-catalog.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => readFileSync(path.join(ROOT, file), 'utf8');
const catalog = loadCatalog();
const engine = createRequire(import.meta.url)('../components/discovery-engine.js');

test('the catalog is the app export: eight products, each with a stated purpose, none on sale', () => {
  assert.equal(catalog.schemaVersion, 3);
  assert.equal(catalog.sourceRepository, 'masinlocandher-max/Senzapp');
  assert.equal(catalog.checkoutEnabled, false);
  assert.equal(catalog.releaseState, 'not_released');
  assert.ok(catalog.platform.purpose && catalog.platform.principle);
  assert.deepEqual(catalog.products.map((p) => p.id), ['ai-workspace', 'communications-intelligence', 'digital-assistant', 'fotolab', 'client-portal', 'event-systems', 'digital-representative', 'music-platform']);
  for (const p of catalog.products) {
    assert.ok(p.purpose.length >= 40, `${p.id} purpose`);
    assert.ok(p.problem && p.segments.length && p.howToGet, `${p.id} problem, segments, how to get it`);
    assert.ok(p.audience && p.limits && p.includes.length >= 2, `${p.id} audience, includes, limits`);
    assert.ok(['in_development', 'custom'].includes(p.publicStatus), `${p.id} is not shown as released`);
    assert.equal(p.publicStatusLabel, catalog.statuses[p.publicStatus].label);
  }
  assert.ok(!/price|ai_units|entitlement/i.test(JSON.stringify(catalog.plans)), 'plans carry no prices or allowances');
});

test('pages that show the catalog match it exactly', () => {
  for (const file of RENDERED_FILES) {
    assert.equal(read(file), renderFile(file, read(file), catalog), `${file} is out of date: run node scripts/render-catalog.mjs`);
  }
  const page = read('ai-systems.html');
  for (const p of catalog.products) assert.ok(page.includes(p.purpose), `ai-systems.html states the purpose of ${p.name}`);
});

test('the discovery questions use the catalog: each product answer is its problem, and links lead to it', () => {
  const known = new Set(catalog.products.map((p) => p.id));
  for (const [need, id] of Object.entries(engine.productNeeds)) {
    assert.ok(known.has(id), `discovery recommends unknown product ${id}`);
    assert.equal(engine.needs[need], catalog.products.find((p) => p.id === id).problem, `${need} is worded as the ${id} problem`);
  }
  const page = read('ai-systems.html');
  for (const p of catalog.products) {
    assert.ok(page.includes(p.problem.replace(/&/g, '&amp;')), `ai-systems.html states the problem ${p.name} solves`);
    const need = Object.keys(engine.productNeeds).find((n) => engine.productNeeds[n] === p.id);
    const link = need ? `get-started.html?need=${need}` : 'get-started.html';
    assert.ok(page.includes(`<a href="${link}">${p.nextAction} →</a>`), `${p.id} links to the problem it answers`);
  }
});

test('no page repeats product claims that contradict the app', () => {
  const stale = [
    /Event Systems for voting/i,
    /Ticketing and audience management/i,
    /clone studio/i,
    /Client Portals/,
    /portrait enhancement/i,
    /curated countdowns/i,
    /tracking coverage and sentiment/i,
    /data governance alignment/i,
    /previews, prototypes, or custom builds/i,
    /\b(Front|Sales|Knowledge|Workflow) Desk\b/,
    /Content Studio/
  ];
  const files = readdirSync(ROOT).filter((f) => /\.(html|txt)$/.test(f))
    .concat(readdirSync(path.join(ROOT, 'components')).filter((f) => /\.(js|json)$/.test(f)).map((f) => `components/${f}`), ['agents.js']);
  const hits = [];
  for (const file of files) {
    const text = read(file);
    for (const re of stale) if (re.test(text)) hits.push(`${file}: ${re}`);
  }
  assert.deepEqual(hits, []);
});
