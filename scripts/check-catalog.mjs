import fs from 'node:fs';
import assert from 'node:assert/strict';
import {composeCatalog} from './compose-catalog.mjs';
const root=new URL('../',import.meta.url);
const actual=JSON.parse(fs.readFileSync(new URL('components/product-catalog.json',root)));
assert.deepEqual(actual,composeCatalog(),'Generated public catalog is stale. Run npm run build:catalog.');
for(const p of actual.products){
 assert.ok(fs.existsSync(new URL(p.publicSlug.slice(1)+(p.publicSlug.endsWith('/')?'index.html':''),root)),`${p.id}: public page missing`);
 assert.ok(!/\bAI\b/.test([p.name,p.summary,p.purpose,p.limits,...p.includes].join(' ')),`${p.id}: customer wording`);
 assert.ok(!p.purchasable || p.productionVerified,`${p.id}: unsupported sale`);
}
for(const name of fs.readdirSync(new URL('products/',root)).filter(n=>n.endsWith('.html'))) assert.ok(name==='business-website.html' || actual.products.some(p=>p.publicSlug==='/products/'+name),`Orphan or retired product page: ${name}`);
const roles=JSON.parse(fs.readFileSync(new URL('function.json',root)));
const technical=JSON.parse(fs.readFileSync(new URL('contracts/technical.snapshot.json',root))).data;
assert.equal(roles.app.released,technical.platform.productionVerified,'Client access differs from technical release evidence');
assert.equal(roles.acquisition.canonicalProductUrl,'https://www.senzpr.com/legit-official-site/');
console.log(`${actual.products.length} public entries validated against technical evidence and SENZ commercial approval.`);
