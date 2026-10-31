import fs from 'node:fs';
import assert from 'node:assert/strict';
const contract = JSON.parse(fs.readFileSync(new URL('../function.json',import.meta.url)));
const catalog = JSON.parse(fs.readFileSync(new URL('../components/product-catalog.json',import.meta.url)));
const active = contract.products.filter(p=>p.requestable && !p.parked);
assert.equal(catalog.sourceRepository, contract.app.repository);
assert.equal(catalog.forSale, contract.app.released);
assert.deepEqual(catalog.products.map(p=>p.id).sort(),active.map(p=>p.key).sort());
for(const p of catalog.products){
 const expected=active.find(x=>x.key===p.id);
 for(const [actual,key] of [['name','name'],['summary','function'],['limits','doesNot'],['pricePhp','pricePhp']]) assert.equal(p[actual],expected[key],`${p.id}: ${actual}`);
 assert.ok(!/\bAI\b/.test([p.name,p.summary,p.purpose,p.limits,...p.includes].join(' ')),`${p.id}: customer wording`);
}
console.log(`${active.length} products match the shared contract: names, capabilities, limits, prices and release state.`);
