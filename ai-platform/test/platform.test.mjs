import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import {
  PRODUCTS, PLANS, parsePrices, catalog, verifyPaymongoSignature,
  paidCheckoutFromEvent, knowledgeSources, instructionsFor, requiredText, InputError
} from '../lib.mjs';
import { server } from '../server.mjs';

test('six discrete commercial products, seat-gated plans and no invented default prices', () => {
  assert.deepEqual(Object.keys(PRODUCTS), ['frontdesk','sales','knowledge','workspace','content','workflow']);
  assert.deepEqual(PLANS.individual.products,Object.keys(PRODUCTS));
  assert.equal(PLANS.white_label.whiteLabel,true);
  assert.equal(PLANS.institution.seats,100);
  assert.ok(catalog({}).every(p=>!p.available_for_checkout && p.amount_centavos===null));
  assert.equal(catalog(parsePrices('{"workspace":499}')).find(p=>p.id==='workspace').amount_centavos,49900);
  assert.throws(()=>parsePrices('{"fake":500}'));
  assert.throws(()=>parsePrices('{"workspace":-50}'));
});
test('raw-body PayMongo signatures require correct mode, HMAC and fresh timestamp', () => {
  const t=1711111111, body='{"hello":"world"}', secret='webhook-secret';
  const hash=crypto.createHmac('sha256',secret).update(t+'.'+body).digest('hex');
  const signed='t='+t+',te='+hash+',li=';
  assert.equal(verifyPaymongoSignature(body,signed,secret,'test',t),true);
  assert.equal(verifyPaymongoSignature(body,signed,secret,'live',t),false);
  assert.equal(verifyPaymongoSignature(body+' ',signed,secret,'test',t),false);
  assert.equal(verifyPaymongoSignature(body,signed,secret,'test',t+301),false);
  assert.equal(verifyPaymongoSignature(body,signed,'wrong-secret','test',t),false);
});
test('paid checkout webhook only accepts confirmed PHP payments and explicit mode',()=>{
  const event={data:{type:'checkout_session.payment.paid',livemode:false,data:{
    id:'cs_abc',attributes:{reference_number:'order-uuid',payments:[{id:'pay_1',attributes:{status:'paid',currency:'PHP',amount:49900}}]}
  }}};
  const paid=paidCheckoutFromEvent(event,'test');
  assert.equal(paid.amountCentavos,49900);
  assert.equal(paid.sessionId,'cs_abc');
  assert.throws(()=>paidCheckoutFromEvent(event,'live'),InputError);
  event.data.data.attributes.payments[0].attributes.status='failed';
  assert.throws(()=>paidCheckoutFromEvent(event,'test'),InputError);
});
test('knowledge retrieval returns only matching approved excerpts without invented citations',()=>{
  const sources=[
    {id:'a',title:'Employee handbook',body:'Leave rules apply to full time employees.'},
    {id:'b',title:'Product policy',body:'Refund policy is subject to approval.'}
  ];
  const result=knowledgeSources(sources,'What is the refund policy?');
  assert.equal(result[0].id,'b');
  assert.deepEqual(knowledgeSources(sources,'quantum computing'),[]);
  assert.match(instructionsFor('knowledge'),/cite/i);
  assert.throws(()=>requiredText('',10),InputError);
});
test('Node service exposes health/catalog but does not grant access without verified identity',async t=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  t.after(()=>new Promise(resolve=>server.close(resolve)));
  const host='http://127.0.0.1:'+server.address().port;
  const health=await fetch(host+'/api/health');
  assert.equal(health.status,200);
  assert.equal((await health.json()).service,'senz-ai-platform');
  const catalogResponse=await fetch(host+'/api/catalog');
  assert.equal(catalogResponse.status,200);
  assert.equal((await catalogResponse.json()).products.frontdesk.title,'AI Front Desk');
  const forbidden=await fetch(host+'/api/entries?org_id=00000000-0000-0000-0000-000000000000&product=frontdesk');
  assert.notEqual(forbidden.status,200);
  const html=await fetch(host+'/');
  assert.equal(html.status,200);
  assert.match(await html.text(),/SENZ AI/);
  const denied=await fetch(host+'/api/webhooks/paymongo',{method:'POST',body:JSON.stringify({data:{}})});
  assert.notEqual(denied.status,200);
});

test('SQL migration includes valid paired dollar-quoted procedures and grants only service_role', () => {
  const sql = readFileSync(new URL('../schema.sql', import.meta.url), 'utf8');
  const quotes = sql.match(/\$\$/g) || [];
  assert.equal(quotes.length, 6, 'one DO block and two functions must use paired $$ quotes');
  assert.match(sql, /create or replace function public\.senz_redeem_invite[\s\S]*?as \$\$\s*declare inv/);
  assert.match(sql, /end \$\$;\s*revoke all on function public\.senz_redeem_invite/);
  assert.match(sql, /grant execute on function public\.senz_redeem_invite\(text,uuid,text\) to service_role/);
  assert.match(sql, /grant execute on function public\.senz_fulfill_paid_order\(uuid,text,text,text,boolean\) to service_role/);
  for (const name of ['senz_organizations', 'senz_memberships', 'senz_entitlements', 'senz_orders', 'senz_entries', 'senz_invites', 'senz_ai_usage']) {
    assert.ok(sql.includes("'"+name+"'"), 'RLS table list must include '+name);
  }
});

test('PayMongo current send.webhook format is compatible with verified paid checkout handling', () => {
  const event = { event_type:'send.webhook', data: {
    id:'evt_new', type:'checkout_session.payment.paid', livemode:false,
    data:{id:'cs_new',type:'checkout_session', attributes:{
      reference_number:'d3912208-e5b3-4ab9-8e1a-66e0f9ff0741',
      payments:[{id:'pay_new',attributes:{status:'paid',currency:'PHP',amount:79900}}]
    }}
  }};
  const paid = paidCheckoutFromEvent(event, 'test');
  assert.equal(paid.paymentId,'pay_new');
  assert.equal(paid.amountCentavos,79900);
  assert.equal(paid.orderId,'d3912208-e5b3-4ab9-8e1a-66e0f9ff0741');
  assert.equal(paid.eventId,'evt_new');
});
