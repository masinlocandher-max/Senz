// Renders the product catalog on ai-systems.html, llms.txt, and llms-full.txt, and the catalog data the
// discovery questions use in components/discovery-engine.js, from components/product-catalog.json, the
// export of the SENZ App's own catalog. Edit product wording in the app (src/catalog.js), copy the
// export here, then run:  node scripts/render-catalog.mjs
// test/catalog.test.mjs fails if a page and the JSON disagree.

import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);

// Where each product's button leads in the website's discovery journey: the problem it answers.
// Client Portal comes with SENZ service engagements, so it starts the journey without a preset problem.
function discoveryLink(id) {
  const { productNeeds } = require('../components/discovery-engine.js');
  const need = Object.keys(productNeeds).find((key) => productNeeds[key] === id);
  return need ? `get-started.html?need=${need}` : 'get-started.html';
}

const WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
const count = (n) => WORDS[n] || String(n);
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function renderBlocks(catalog) {
  // Built on demand: the product links read the discovery engine, which is itself rendered here.
  const products = () => catalog.products.map((p) => [
    `<article class="content-card" id="${esc(p.id)}">`,
    `<p class="readiness">${esc(p.publicStatusLabel.toUpperCase())} · ${esc(catalog.categories[p.category].toUpperCase())}</p>`,
    `<h3>${esc(p.name)}</h3>`,
    `<p><strong>The problem it solves:</strong> ${esc(p.problem)}</p>`,
    `<p><strong>Purpose:</strong> ${esc(p.purpose)}</p>`,
    `<p><strong>For:</strong> ${esc(p.audience)}</p>`,
    '<ul>',
    ...p.includes.map((item) => `<li>${esc(item)}</li>`),
    '</ul>',
    `<p><strong>Limits:</strong> ${esc(p.limits)}</p>`,
    `<p><strong>How to get it:</strong> ${esc(p.howToGet)}</p>`,
    `<a href="${discoveryLink(p.id)}">${esc(p.nextAction)} →</a>`,
    '</article>'
  ].join('\n')).join('\n');
  const aiCount = catalog.products.filter((p) => p.usesAi).length;
  const intro = [
    `<p class="lead-copy">${esc(catalog.platform.purpose)}</p>`,
    `<p>${count(catalog.products.length)[0].toUpperCase()}${count(catalog.products.length).slice(1)} products: ${count(aiCount)} use AI, and ${count(catalog.products.length - aiCount)} are digital workflows without AI.${catalog.checkoutEnabled ? '' : ' None is released for self-service purchase yet.'}</p>`
  ].join('\n');
  const statuses = [
    '<dl>',
    ...Object.values(catalog.statuses).map((s) => `<dt><strong>${esc(s.label)}</strong></dt>\n<dd>${esc(s.meaning)}</dd>`),
    '</dl>',
    '<p>The SENZ App shows the same labels with the same meaning. No label on this page means a product can be bought today.</p>'
  ].join('\n');
  const llms = catalog.products.map((p) => `- ${p.name} (${p.publicStatusLabel}; ${catalog.categories[p.category]}): Solves: ${p.problem} ${p.purpose} For: ${p.audience} Limits: ${p.limits} ${p.howToGet}`).join('\n');
  // The discovery questions offer each product's problem to the segments it serves and recommend
  // the plans for that segment. Prices and allowances are not part of the export.
  const pick = (o, keys) => Object.fromEntries(keys.map((k) => [k, o[k]]));
  const discovery = [
    '  const CATALOG = {',
    `    segments: ${JSON.stringify(catalog.segments)},`,
    '    plans: [',
    catalog.plans.map((plan) => `      ${JSON.stringify(pick(plan, ['key', 'name', 'segments', 'seats', 'selfRequest', 'products']))}`).join(',\n'),
    '    ],',
    '    products: [',
    catalog.products.map((p) => `      ${JSON.stringify(pick(p, ['id', 'name', 'problem', 'purpose', 'segments', 'includes', 'limits', 'usesAi', 'launchWave', 'channel', 'howToGet', 'recommendedPlan', 'publicStatusLabel', 'nextAction']))}`).join(',\n'),
    '    ]',
    '  };'
  ].join('\n');
  return { intro, get products() { return products(); }, statuses, llms, discovery };
}

// Which marked blocks each file carries. The discovery engine comes first: the product links on
// ai-systems.html read its problem-to-product map.
const TARGETS = {
  'components/discovery-engine.js': ['discovery'],
  'ai-systems.html': ['intro', 'products', 'statuses'],
  'llms.txt': ['llms'],
  'llms-full.txt': ['llms']
};

export function renderFile(file, text, catalog) {
  const blocks = renderBlocks(catalog);
  const [open, close] = file.endsWith('.js') ? ['/\\* ', ' \\*/'] : ['<!-- ', ' -->'];
  let out = text;
  for (const name of TARGETS[file]) {
    const re = new RegExp(`(\\s*${open}catalog:${name}:start${close})[\\s\\S]*?(\\n\\s*${open}catalog:${name}:end${close})`);
    if (!re.test(out)) throw new Error(`${file} is missing the catalog:${name} markers`);
    out = out.replace(re, (m, start, end) => `${start}\n${blocks[name]}${end}`);
  }
  return out;
}

export const RENDERED_FILES = Object.keys(TARGETS);

export function loadCatalog() {
  return JSON.parse(readFileSync(path.join(ROOT, 'components/product-catalog.json'), 'utf8'));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const catalog = loadCatalog();
  for (const file of RENDERED_FILES) {
    const full = path.join(ROOT, file);
    writeFileSync(full, renderFile(file, readFileSync(full, 'utf8'), catalog));
  }
  console.log(`Rendered ${RENDERED_FILES.join(', ')} from components/product-catalog.json`);
}
