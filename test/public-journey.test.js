const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const model = require('../components/discovery-model');
const catalog = require('../components/product-catalog.json');
const root = path.join(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const pages = fs.readdirSync(root).filter(n => n.endsWith('.html'))
  .concat(fs.readdirSync(path.join(root, 'products')).map(n => 'products/' + n));
const plain = text => text.replace(/<[^>]+>/g, '').replaceAll('&amp;', '&').replaceAll('&#39;', "'").replace(/\s+/g, ' ').trim();
const markup = html => [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
  .flatMap(m => { const data = JSON.parse(m[1]); return data['@graph'] || [data]; });

test('all purchase recommendations keep the audience, seats, timeline and requested action', () => {
  for (const product of catalog.products) for (const audience of [...product.segments, 'other']) {
    for (const intent of ['availability', 'demo', 'quote']) {
      const answers = { audience, route:'software', need:product.id, scope:'3', setup:'system', when:'month', intent };
      assert.deepEqual(model.normalize(answers, catalog), answers);
      const url = new URL(model.handoff(answers, catalog), 'https://www.senzpr.com/');
      assert.equal(url.pathname, '/purchase.html');
      assert.equal(url.searchParams.get('product'), product.id);
      const intake = model.readHandoff(url.search, 'product', catalog);
      assert.equal(intake.seats, 3);
      assert.equal(intake.timeline, 'Within 30 days');
      assert.equal(intake.interest, product.name);
      assert.match(intake.message, new RegExp(model.softwareActions[intent]));
      assert.ok(!url.searchParams.has('price'));
    }
  }
});

test('services and undecided visitors receive a project brief, while an estimated seat count stays open', () => {
  for (const route of ['services', 'unsure']) for (const need of Object.keys(model.services)) {
    const answers = { audience:'education', route, need, scope:'single', setup:'brief', when:'quarter', intent:'quote' };
    const url = new URL(model.handoff(answers, catalog),'https://www.senzpr.com/');
    assert.equal(url.pathname, '/contact.html');
    const intake = model.readHandoff(url.search,'service');
    assert.equal(intake.interest, model.services[need].interest);
    assert.match(intake.message, /One defined project/);
    assert.match(intake.message, /school/);
  }
  const answers = { audience:'business', route:'software', need:'qr-menu', scope:'estimate', setup:'manual', when:'soon', intent:'demo' };
  const url = new URL(model.handoff(answers, catalog),'https://www.senzpr.com/');
  assert.equal(model.readHandoff(url.search, 'product', catalog).seats, null);
  url.searchParams.set('product','booking');
  assert.equal(model.readHandoff(url.search, 'product', catalog), null);
  assert.equal(model.seatCount('0'), null);
  assert.equal(model.seatCount('10001'), null);
  assert.equal(model.seatCount('-2'), null);
  assert.equal(model.seatCount('1.5'), null);
  assert.equal(model.seatCount('10000'), 10000);
  assert.equal(model.normalize({...answers, need:'fotolab'},catalog).need, undefined);
});

test('every header offers the guide directly and internal form controls do not transmit personal data in a URL', () => {
  for (const file of pages) {
    const html = read(file);
    const header = html.match(/<header class="senz-global-header">([\s\S]*?)<\/header>/)?.[1];
    assert.ok(header, file);
    assert.match(header, /href="(?:\.\.\/)?get-started\.html"[^>]*>Get Started<\/a>/, file);
    assert.match(header,/aria-controls="primary-navigation"/,file);
    for (const f of html.matchAll(/<form\b[^>]*data-senz-form[^>]*>[\s\S]*?<\/form>/g)) {
      assert.match(f[0], /<form\b[^>]*method="post"/i,file);
      assert.match(f[0], /<noscript>[\s\S]*mailto:/,file);
    }
  }
  assert.doesNotMatch(read('components/approved-pages.js'), /Live site refinement in progress|mobile-app-dock__item/);
});

test('the visible software FAQ and its search markup agree about products, availability and contact', () => {
  const html = read('faq.html');
  const visible = [...html.matchAll(/class="faq-question"[^>]*>([\s\S]*?)<\/button>\s*<div class="faq-answer">([\s\S]*?)<\/div>/g)].map(m=>[plain(m[1]),plain(m[2])]);
  const questions = markup(html).find(x=>x['@type']==='FAQPage').mainEntity;
  assert.deepEqual(questions.map(q=>[q.name,q.acceptedAnswer.text]), visible);
  const answer = visible.find(([q])=>q.includes('request a SENZ software product'))[1];
  assert.match(answer,/13 software products/);
  assert.match(answer,/confirm availability/);
  assert.doesNotMatch(html,/all fifteen|all 15 products|products are for sale/i);
  assert.ok(!markup(read('index.html')).some(x=>x['@type']==='FAQPage'));
  for (const file of ['index.html','about.html','faq.html','services.html']) {
    const org = markup(read(file)).find(x=>x['@id']==='https://www.senzpr.com/#organization');
    assert.equal(org.email,'info.senz.pr@gmail.com');
  }
  const list = markup(read('digital-products.html')).find(x=>x['@type']==='ItemList');
  assert.deepEqual(list.itemListElement.map(x=>x.url.split('/').pop()).sort(),catalog.products.map(p=>p.id+'.html').sort());
});

test('service search prices distinguish the free consultation from quoted starting prices', () => {
  const html = read('services.html');
  const service = markup(html).find(x=>x['@type']==='Service');
  const [check, project, build, support] = service.hasOfferCatalog.itemListElement;
  assert.equal(check.price, '0');
  assert.match(html, /Free · Up to 30 minutes/);
  for (const [offer, price] of [[project,25000],[build,95000],[support,5000]]) {
    assert.equal(offer.price, undefined, 'custom work should not be a fixed-price offer');
    assert.equal(offer.priceSpecification.minPrice, price);
    assert.equal(offer.priceSpecification.priceCurrency, 'PHP');
    assert.ok(plain(html.match(/<main\b[\s\S]*?<\/main>/)[0]).includes('₱'+price.toLocaleString('en-PH')));
  }
});
