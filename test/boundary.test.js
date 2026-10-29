'use strict';

// The website and the SENZ App are separate systems (docs/PLATFORM_CONTRACT.md). The website server
// only relays inquiries; it holds no customer data and can never grant access to the app.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(ROOT, file), 'utf8');

test('the website server exposes only its inquiry routes', () => {
  const routes = [...read('server.js').matchAll(/req\.method === "(\w+)" && url\.pathname === "([^"]+)"/g)].map((m) => `${m[1]} ${m[2]}`).sort();
  assert.deepEqual(routes, ['GET /api/agents', 'GET /api/health', 'POST /api/agents/recommend', 'POST /api/inquiries']);
  assert.doesNotMatch(read('server.js'), /url\.pathname\.startsWith\("\/api/, 'no route families under /api');
});

test('the website contains no app code: no licensing, seats, payment approval, accounts, or AI calls', () => {
  const files = ['server.js', 'agents.js', ...fs.readdirSync(path.join(ROOT, 'components')).filter((f) => f.endsWith('.js')).map((f) => `components/${f}`)];
  for (const file of files) {
    const text = read(file);
    assert.doesNotMatch(text, /node:sqlite|better-sqlite|require\(["']pg["']\)|createClient\(|supabase\.from\(/, `${file}: no database`);
    assert.doesNotMatch(text, /api\.anthropic\.com|ANTHROPIC_API_KEY|openai/i, `${file}: no AI provider`);
    assert.doesNotMatch(text, /\b(grantEntitlement|assignSeat|requireProduct|paymentVerified|password_hash|setCookie)\b/, `${file}: no licensing, seats, payment approval, or sign-in`);
  }
  for (const appFile of ['src/catalog.js', 'src/access.js', 'src/db.js', 'src/routes']) {
    assert.equal(fs.existsSync(path.join(ROOT, appFile)), false, `${appFile}: app source must not be copied into the public website`);
  }
});

test('the health report says the inquiry service stores nothing', () => {
  assert.match(read('server.js'), /service: "senz-inquiry-email"/);
  assert.match(read('server.js'), /storage: "none"/);
});
