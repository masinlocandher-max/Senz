// Renders the product catalog on ai-systems.html, llms.txt, and llms-full.txt from
// components/product-catalog.json, the export of the SENZ App's own catalog. Edit product wording in the app (src/catalog.js), copy the
// export here, then run:  node scripts/render-catalog.mjs
// test/catalog.test.mjs fails if the page and the JSON disagree.

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

// Where each product's button leads in the website's discovery journey.
const DISCOVERY_NEED = {
  'ai-workspace': 'writing',
  'communications-intelligence': 'communications',
  'digital-assistant': 'customers',
  fotolab: 'photos',
  'client-portal': 'portal',
  'event-systems': 'events',
  'digital-representative': 'representative',
  'music-platform': 'music'
};

const WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
const count = (n) => WORDS[n] || String(n);
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function renderBlocks(catalog) {
  const products = catalog.products.map((p) => [
    `<article class="content-card" id="${esc(p.id)}">`,
    `<p class="readiness">${esc(p.publicStatusLabel.toUpperCase())} · ${esc(catalog.categories[p.category].toUpperCase())}</p>`,
    `<h3>${esc(p.name)}</h3>`,
    `<p><strong>Purpose:</strong> ${esc(p.purpose)}</p>`,
    `<p><strong>For:</strong> ${esc(p.audience)}</p>`,
    '<ul>',
    ...p.includes.map((item) => `<li>${esc(item)}</li>`),
    '</ul>',
    `<p><strong>Limits:</strong> ${esc(p.limits)}</p>`,
    `<a href="get-started.html?need=${esc(DISCOVERY_NEED[p.id] || 'other')}">${esc(p.nextAction)} →</a>`,
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
  const llms = catalog.products.map((p) => `- ${p.name} (${p.publicStatusLabel}; ${catalog.categories[p.category]}): ${p.purpose} For: ${p.audience} Limits: ${p.limits}`).join('\n');
  return { intro, products, statuses, llms };
}

// Which marked blocks each file carries.
const TARGETS = {
  'ai-systems.html': ['intro', 'products', 'statuses'],
  'llms.txt': ['llms'],
  'llms-full.txt': ['llms']
};

export function renderFile(file, text, catalog) {
  const blocks = renderBlocks(catalog);
  let out = text;
  for (const name of TARGETS[file]) {
    const re = new RegExp(`(<!-- catalog:${name}:start -->)[\\s\\S]*?(<!-- catalog:${name}:end -->)`);
    if (!re.test(out)) throw new Error(`${file} is missing the catalog:${name} markers`);
    out = out.replace(re, `$1\n${blocks[name]}\n$2`);
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
