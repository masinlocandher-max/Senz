import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
export const digest = data => createHash('sha256').update(JSON.stringify(data)).digest('hex');
export const snapshot = (owner, sourcePath, data) => ({schemaVersion:1, generated:true, owner, sourcePath, sha256:digest(data), data});
export function verifySnapshot(value, owner) {
  assert.equal(value.owner, owner, 'Wrong snapshot owner');
  assert.equal(value.sha256, digest(value.data), 'Snapshot changed without regeneration');
  return value.data;
}
const unique = (items, key, label) => {
  const values=items.map(x=>x[key]); assert.equal(new Set(values).size,values.length,`Duplicate ${label}`);
  assert.ok(values.every(x=>typeof x==='string' && x.length), `Missing ${label}`);
};
export function sellable(technical, offer, platform) {
  return technical.technicalStatus === 'production_verified' && technical.productionVerified === true &&
    Boolean(Number.isFinite(Date.parse(technical.lastVerifiedAt)) && technical.releaseEvidence?.reference) &&
    technical.releaseEvidence?.productionInfrastructureVerified === true &&
    platform.productionVerified === true && Boolean(Number.isFinite(Date.parse(platform.lastVerifiedAt)) && platform.evidenceReference) &&
    offer.commercialApproval.approved === true && Boolean(offer.commercialApproval.reference) &&
    (offer.quoteOnly === true || (offer.pricing.approved === true && Boolean(offer.pricing.approvalReference))) &&
    offer.deliveryProcessVerified === true && offer.policyDocumentsVerified === true;
}
export function validateContract(technical, commercial) {
  assert.equal(technical.owner,'masinlocandher-max/Senzapp');
  assert.equal(commercial.owner,'masinlocandher-max/Senz');
  assert.equal(commercial.canonicalOrigin,'https://www.senzpr.com');
  assert.equal(technical.platform.plannedOrigin,'https://app.senzpr.com');
  unique(technical.products,'id','technical product ID');
  unique(technical.products,'entitlementId','technical entitlement ID');
  unique(commercial.products,'id','commercial product ID');
  unique(commercial.products,'entitlementId','commercial entitlement ID');
  unique(commercial.products,'publicSlug','public slug');
  unique(commercial.plans,'key','plan key');
  const stages=['concept','development','internal_testing','pilot','beta','production_verified','retired'];
  for(const t of technical.products) {
    assert.ok(stages.includes(t.technicalStatus),`${t.id}: invalid technical status`);
    assert.equal(t.technicalStatus==='production_verified',t.productionVerified,`${t.id}: inconsistent verification state`);
    if(t.productionVerified) assert.ok(t.technicalStatus==='production_verified' && Number.isFinite(Date.parse(t.lastVerifiedAt)) && t.releaseEvidence?.reference && t.releaseEvidence?.productionInfrastructureVerified,`${t.id}: missing release evidence`);
    if(t.customerVisible) assert.ok(commercial.products.some(o=>o.entitlementId===t.entitlementId),`${t.id}: missing public metadata`);
  }
  for(const o of commercial.products) {
    const t=technical.products.find(t=>t.entitlementId===o.entitlementId);
    assert.ok(t,`${o.id}: nonexistent entitlement`);
    assert.ok(/^\/(?:[a-z0-9-]+\/)*[a-z0-9-]*(?:\.html)?\/?$/.test(o.publicSlug),`${o.id}: invalid public slug`);
    assert.ok(!(t.technicalStatus==='retired' && (o.publiclyExplained || o.requestable)),`${o.id}: retired product still public`);
    assert.deepEqual(o.includes,t.capabilities,`${o.id}: unsupported capability claim`);
    assert.equal(o.limits,t.limitations,`${o.id}: omitted technical limitation`);
    const p=o.pricing;
    assert.equal(p.currency,'PHP');
    assert.ok(['monthly','annual','quarterly','one_time'].includes(p.billingPeriod));
    assert.ok(p.amount===null || (Number.isSafeInteger(p.amount) && p.amount>=0),`${o.id}: invalid price`);
    assert.ok(!p.approved || (p.approvalReference && p.amount!==null),`${o.id}: missing price approval`);
    assert.ok(!o.commercialApproval.approved || o.commercialApproval.reference,`${o.id}: missing commercial approval`);
    if(o.commercialStatus==='purchasable') assert.ok(sellable(t,o,technical.platform),`${o.id}: unsupported public sale`);
    if(o.entitlementId==='business-website') assert.equal(o.publicSlug,'/legit-official-site/');
  }
  for(const p of commercial.plans) {
    assert.ok(p.products.every(id=>technical.products.some(t=>t.entitlementId===id && t.technicalStatus!=='retired')),`${p.key}: invalid plan product`);
    assert.ok(p.price_php===null || (Number.isSafeInteger(p.price_php)&&p.price_php>=0));
    assert.ok(p.price_php===null || (p.pricingApproved && p.approvalReference),`${p.key}: unapproved plan price`);
    if(p.key.startsWith('buy-')) {
      const offer=commercial.products.find(o=>o.entitlementId===p.products[0]);
      assert.equal(p.price_php,offer.pricing.approved ? offer.pricing.amount : null,`${p.key}: conflicting public price`);
    }
  }
  return true;
}
