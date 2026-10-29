// Public claims: compliance-type statements must be inventoried with their basis, unsupported
// product functions must not be advertised, and machine-readable files (structured data, sitemap,
// AI-readable text) must stay accurate and point only at public pages.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => readFileSync(path.join(ROOT, file), 'utf8');
const PUBLIC_FILES = readdirSync(ROOT).filter((f) => /\.(html|txt|xml)$/.test(f))
  .concat(readdirSync(path.join(ROOT, 'components')).filter((f) => /\.(js|json)$/.test(f)).map((f) => `components/${f}`), ['agents.js']);
const visibleText = (raw) => raw.replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&#39;|&rsquo;/g, "'").replace(/\s+/g, ' ');
const sentences = (text) => text.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);

const COMPLIANCE = /\b(complian(t|ce)|certif(ied|ication|ications)|accredit(ed|ation)|aligned (to|with)|ISO ?\d{4,5}|SOC ?2|RA ?10173|Data Privacy Act|NPC|DepEd|CHED|HIPAA|GDPR|PCI[- ]DSS|BIR)\b/;

test('every compliance-type sentence on a public file is in the claims inventory with its basis', () => {
  const inventory = read('docs/CLAIMS_INVENTORY.md').split('## Removed claims')[0];
  const missing = [];
  for (const file of PUBLIC_FILES) {
    for (const s of sentences(visibleText(read(file)))) {
      if (COMPLIANCE.test(s) && !inventory.includes(s)) missing.push(`${file}: ${s.slice(0, 160)}`);
    }
  }
  assert.deepEqual(missing, [], 'add the sentence to docs/CLAIMS_INVENTORY.md with evidence, or remove it');
});

test('removed legal and regulatory claims stay removed', () => {
  const banned = [/aligned to RA ?10173/i, /aligned to Philippine law/i, /NPC advisory guidance/i, /data governance alignment/i, /\bcertified\b.{0,40}\b(privacy|security|compliance)/i];
  const hits = [];
  for (const file of PUBLIC_FILES) for (const re of banned) if (re.test(read(file))) hits.push(`${file}: ${re}`);
  assert.deepEqual(hits, []);
});

test('unsupported product functions appear only as stated limits', () => {
  // Each function the app does not provide may be named only next to a "not" or "does not".
  const functions = [/\bvoting\b/i, /\btabulation\b/i, /\bticket(ing|s)\b/i, /\bclon(e|ing)\b/i, /\bretouch(ing)?\b/i, /\bstream(s|ing)? music\b/i, /\blikeness\b/i];
  const negation = /\b(not|no|does not|doesn't|never|nor)\b/i;
  const hits = [];
  for (const file of PUBLIC_FILES.filter((f) => !['agents.js', 'components/chat-support.js'].includes(f))) {
    for (const s of sentences(visibleText(read(file)))) {
      for (const re of functions) if (re.test(s) && !negation.test(s)) hits.push(`${file}: ${s.slice(0, 160)}`);
    }
  }
  assert.deepEqual(hits, []);
});

test('structured data parses, and only SENZ services carry prices', () => {
  const productNames = JSON.parse(read('components/product-catalog.json')).products.map((p) => p.name);
  for (const file of readdirSync(ROOT).filter((f) => f.endsWith('.html'))) {
    for (const m of read(file).matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
      let data;
      assert.doesNotThrow(() => { data = JSON.parse(m[1]); }, `${file}: structured data is not valid JSON`);
      const text = JSON.stringify(data);
      if (/"price"\s*:/.test(text)) {
        assert.equal(file, 'services.html', `${file}: only the published service rates may carry a price`);
        for (const name of productNames) assert.ok(!text.includes(name), `${file}: ${name} must not be priced`);
      }
      assert.doesNotMatch(text, /"aggregateRating"|"review"\s*:|"ratingValue"/, `${file}: no ratings or reviews without real, sourced reviews`);
    }
  }
});

test('the sitemap lists only public pages that exist, on the canonical domain', () => {
  const locs = [...read('sitemap.xml').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  assert.ok(locs.length > 5);
  for (const loc of locs) {
    const url = new URL(loc);
    assert.equal(url.origin, 'https://www.senzpr.com', loc);
    const file = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
    assert.ok(existsSync(path.join(ROOT, file)), `${loc} has no file`);
  }
  for (const file of PUBLIC_FILES) {
    assert.doesNotMatch(read(file).replace(/window\.SENZ_API_BASE_URL[^\n]*/g, ''), /https?:\/\/(localhost|127\.0\.0\.1|[a-z0-9-]+\.onrender\.com|app\.senzpr\.com\/(api|admin))/i, `${file}: links to a private or development address`);
  }
});
