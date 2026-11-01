const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const data = require('../components/legit-official-site.json');
const model = require('../components/legit-site-model');

test('website recommendations include all audiences without forcing a business plan or selling extra tools', () => {
  for (const audience of Object.keys(data.audiences)) for (const goal of Object.keys(data.goals)) for (const domain of Object.keys(data.domains)) {
    const a = { audience, goals: [goal], domain };
    const result = model.recommend(a, data);
    assert.equal(result.kind, data.audiences[audience].configuration);
    assert.ok(result.sections.length > 0);
    const href = model.handoff(a, data);
    assert.ok(href.startsWith('/contact.html?'));
    const brief = model.readHandoff(href.split('?')[1], data);
    assert.ok(brief.message.includes(data.goals[goal].toLowerCase()));
    assert.ok(brief.message.includes(data.domains[domain].label));
    assert.equal(brief.interest, 'Legit Official Site');
  }
  const personal = model.recommend({ audience:'myself', goals:['about','work','contact'], domain:'decide' }, data);
  assert.equal(personal.kind, 'personal'); assert.deepEqual(personal.additions, []);
  const order = model.recommend({ audience:'business', goals:['order'], domain:'custom' }, data);
  assert.deepEqual(order.additions, ['order']); assert.match(data.extensions.order.note, /not|separate|scope|confirm/i);
});
test('incomplete or tampered selections cannot fabricate a quote, price or personal-data handoff', () => {
  assert.equal(model.recommend({ audience:'myself', goals:[], domain:'decide' }, data),null);
  for (const audience of ['__proto__','constructor','invalid']) assert.equal(model.recommend({audience,goals:['about'],domain:'decide'},data),null);
  assert.equal(model.readHandoff('?los=1&audience=myself&goals=<script>&domain=decide',data),null);
  assert.equal(model.readHandoff('?los=1&audience=myself&goals=about&domain=invalid',data),null);
  const href = model.handoff({audience:'myself',goals:['about'],domain:'decide',email:'private@example.com',message:'private'},data);
  assert.doesNotMatch(href,/private|price|checkout/);
  const offer=require('../commercial/catalog.json').products.find(p=>p.id==='legit-official-site');
  assert.equal(offer.pricing.approved,false);assert.equal(offer.pricing.amount,null);assert.equal(offer.quoteOnly,true);
  assert.equal(data.acquisitionHosts, undefined, 'acquisition hosts must stay out of public configuration');
  assert.doesNotMatch(JSON.stringify(data.domains), /[a-z0-9-]+\.(com|net|org)(?:[\s/"]|$)/i, 'address options must not disclose hostnames');
});
test('one canonical product page keeps ownership and release limits explicit', () => {
  const html = fs.readFileSync(require.resolve('../legit-official-site/index.html'),'utf8');
  assert.match(html,/https:\/\/www.senzpr.com\/legit-official-site\//);
  assert.doesNotMatch(html,/"@type":"Offer"|\u20b1\s*\d|app\.senzpr\.com/);
  for (const phrase of ['Fictional identity','not SENZ client work','subject to setup and availability','This is not unrestricted hosting','Your identity and content remain yours']) assert.ok(html.includes(phrase),phrase);
  const contract = require('../function.json');
  assert.equal(contract.app.released,false);
  assert.equal(require('../commercial/catalog.json').products.find(p=>p.id===data.id).quoteOnly,true);
});
