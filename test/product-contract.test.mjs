import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {validateContract,sellable,verifySnapshot} from '../scripts/product-contract.mjs';
const read=p=>JSON.parse(fs.readFileSync(new URL(p,import.meta.url)));
const technical=read('../contracts/technical.snapshot.json').data,commercial=read('../commercial/catalog.json');
const copy=x=>structuredClone(x);
test('current capabilities are requestable but none passes the production sellability gate',()=>{
 assert.equal(validateContract(technical,commercial),true);
 assert.ok(commercial.products.every(o=>!sellable(technical.products.find(t=>t.entitlementId===o.entitlementId),o,technical.platform)));
});
test('every independent sellability condition is necessary, including quote-only delivery readiness',()=>{
 const t={technicalStatus:'production_verified',productionVerified:true,lastVerifiedAt:'2026-11-02T00:00:00Z',releaseEvidence:{reference:'TEST-EVIDENCE',productionInfrastructureVerified:true}};
 const o={quoteOnly:true,commercialApproval:{approved:true,reference:'TEST-APPROVAL'},pricing:{approved:false},deliveryProcessVerified:true,policyDocumentsVerified:true};
 const p={productionVerified:true,lastVerifiedAt:t.lastVerifiedAt,evidenceReference:'TEST-HOST'};
 assert.equal(sellable(t,o,p),true);
 for(const change of [t=>t.technicalStatus='beta',t=>t.productionVerified=false,t=>t.lastVerifiedAt=null,t=>t.lastVerifiedAt='not-a-date',t=>t.releaseEvidence.reference=null,t=>t.releaseEvidence.productionInfrastructureVerified=false]){const v=copy(t);change(v);assert.equal(Boolean(sellable(v,o,p)),false);}
 for(const change of [o=>o.commercialApproval.approved=false,o=>o.commercialApproval.reference=null,o=>o.quoteOnly=false,o=>o.deliveryProcessVerified=false,o=>o.policyDocumentsVerified=false]){const v=copy(o);change(v);assert.equal(Boolean(sellable(t,v,p)),false);}
 assert.equal(Boolean(sellable(t,o,{...p,productionVerified:false})),false);
});
test('catalog contradictions fail validation',()=>{
 const corruptions=[
  c=>c.products.push(copy(c.products[0])),
  c=>c.products[0].entitlementId='missing',
  c=>c.products[0].publicSlug='',
  c=>c.products[0].pricing.amount=-1,
  c=>c.products[0].pricing.amount='1490',
  c=>c.products[0].pricing.approved=true,
  c=>c.products[0].commercialStatus='purchasable',
  c=>c.canonicalOrigin='https://other.test',
  c=>c.plans[0].price_php=1,
  c=>c.products.find(p=>p.id==='legit-official-site').publicSlug='/other.html'
 ];
 for(const change of corruptions){const c=copy(commercial);change(c);assert.throws(()=>validateContract(technical,c));}
 const retired=copy(technical);retired.products.find(p=>p.customerVisible).technicalStatus='retired';assert.throws(()=>validateContract(retired,commercial));
 const missing=copy(commercial);missing.products.shift();assert.throws(()=>validateContract(technical,missing));
 const snapshot=read('../contracts/technical.snapshot.json');snapshot.data.platform.productionVerified=true;assert.throws(()=>verifySnapshot(snapshot,'masinlocandher-max/Senzapp'));
});
