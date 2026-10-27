import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

test('mocked checkout-to-entitlement flow denies unpaid access, verifies webhook and grants licensed product use', async t => {
  process.env.SUPABASE_URL='https://senz-test.supabase.co';
  process.env.SUPABASE_PUBLISHABLE_KEY='sb_publishable_test';
  process.env.SUPABASE_SERVICE_ROLE_KEY='service-key-test';
  process.env.PAYMONGO_SECRET_KEY='sk_test_stub';
  process.env.PAYMONGO_WEBHOOK_SECRET='webhook-secret-for-tests';
  process.env.PAYMONGO_MODE='test';
  process.env.OPENAI_API_KEY='sk-stub';
  process.env.OPENAI_MODEL='gpt-test';
  process.env.PUBLIC_APP_URL='https://app.senz-example.test';
  process.env.SENZ_PLAN_PRICING_JSON='{"frontdesk":100,"workspace":300}';
  const database = { senz_organizations:[], senz_memberships:[], senz_entitlements:[],
    senz_orders:[], senz_entries:[], senz_invites:[], senz_ai_usage:[], senz_widget_usage:[] };
  const nativeFetch=globalThis.fetch;
  const json=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:{'content-type':'application/json'}});
  function rowsFor(table,url){
    let list=database[table]||[];
    for(const [key,term] of url.searchParams){
      if(['select','order','limit'].includes(key))continue;
      if(term.startsWith('eq.'))list=list.filter(o=>String(o[key])===term.slice(3));
      if(term.startsWith('gte.'))list=list.filter(o=>String(o[key])>=term.slice(4));
    }
    const limit=Number(url.searchParams.get('limit'))||1000;
    return list.slice(0,limit).map(x=>structuredClone(x));
  }
  globalThis.fetch = async (input,options={})=>{
    const url=new URL(String(input));
    if(url.host==='senz-test.supabase.co' && url.pathname==='/auth/v1/user'){
      const bearer=options.headers?.Authorization;
      if(!['Bearer user1','Bearer user2'].includes(bearer))return json({error:'invalid'},401);
      return json({id:bearer==='Bearer user1'?'11111111-1111-4111-8111-111111111111':'22222222-2222-4222-8222-222222222222',
        email:bearer==='Bearer user1'?'buyer@example.org':'stranger@example.org',email_confirmed_at:'2026-01-01T00:00:00Z'});
    }
    if(url.host==='senz-test.supabase.co' && url.pathname.startsWith('/rest/v1/')){
      const table=url.pathname.slice('/rest/v1/'.length);
      const method=options.method||'GET', payload=options.body?JSON.parse(options.body):null;
      if(table==='rpc/senz_fulfill_paid_order'){
        const order=database.senz_orders.find(o=>o.id===payload.p_order_id);
        if(!order || order.checkout_session_id!==payload.p_session_id || order.livemode!==payload.p_live)return json({error:'invalid order'},400);
        if(order.status==='paid')return json(false);
        order.status='paid';order.paid_at=new Date().toISOString();
        database.senz_entitlements.push({org_id:order.org_id,products:order.products,seats:order.seats,white_label:order.white_label,status:'active',active_until:new Date(Date.now()+30*86400000).toISOString()});
        return json(true);
      }
      if(table==='rpc/senz_redeem_invite')return json(null);
      if(!database[table])return json({message:'missing'},404);
      if(method==='GET')return json(rowsFor(table,url));
      if(method==='POST'){
        const entry={id:crypto.randomUUID(),created_at:new Date().toISOString(),...payload};
        if(table==='senz_orders'){entry.status='pending';}
        if(table==='senz_organizations'){entry.brand_color='#2451D9';entry.widget_origins=[];entry.widget_greeting='Hello.';}
        if(table==='senz_entries'){entry.status=payload.status||'draft';entry.body=payload.body||'';}
        database[table].push(entry);
        return json([structuredClone(entry)],201);
      }
      if(method==='PATCH'){
        const match=rowsFor(table,url), ids=new Set(match.map(x=>x.id||x.org_id));
        const changed=[];
        for(const item of database[table]){
          if(ids.has(item.id||item.org_id)){Object.assign(item,payload);changed.push(structuredClone(item));}
        }
        return json(changed);
      }
      return json([],200);
    }
    if(url.host==='api.paymongo.com'){
      const data=JSON.parse(options.body);
      assert.equal(data.data.attributes.line_items[0].amount,10000);
      assert.equal(data.data.attributes.reference_number.length,36);
      return json({data:{id:'cs_mock_1',attributes:{checkout_url:'https://checkout.paymongo.com/cs_mock_1'}}},201);
    }
    if(url.host==='api.openai.com'){
      const body=JSON.parse(options.body);
      assert.equal(body.store,false);
      return json({output_text:'Here is a grounded customer response draft.',usage:{input_tokens:25,output_tokens:30}});
    }
    return nativeFetch(input,options);
  };
  t.after(()=>{globalThis.fetch=nativeFetch;});
  const {server}=await import('../server.mjs');
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  t.after(()=>new Promise(r=>server.close(r)));
  const host='http://127.0.0.1:'+server.address().port;
  const auth1={Authorization:'Bearer user1','Content-Type':'application/json'};
  const auth2={Authorization:'Bearer user2','Content-Type':'application/json'};
  const post=async (path,headers,body)=>nativeFetch(host+path,{method:'POST',headers,body:JSON.stringify(body)});
  const sale=await post('/api/checkout',auth1,{plan:'frontdesk',org_name:'Harbor Studio'});
  assert.equal(sale.status,201);
  const checkout=await sale.json(),org=database.senz_organizations[0];
  assert.equal(checkout.amount_centavos,10000);
  let r=await post('/api/entries',auth1,{org_id:org.id,product:'frontdesk',title:'FAQ',body:'Our service is available by appointment.'});
  assert.equal(r.status,402,'Account must stay locked prior to webhook');
  const unsigned=await post('/api/webhooks/paymongo',{'Content-Type':'application/json'},{data:{}});
  assert.equal(unsigned.status,401);
  const event={data:{type:'checkout_session.payment.paid',livemode:false,id:'evt_mock_1',data:{
    id:'cs_mock_1',attributes:{reference_number:checkout.order_id,payments:[{id:'pay_mock',attributes:{status:'paid',currency:'PHP',amount:10000}}]}
  }}};
  const raw=JSON.stringify(event),now=Math.floor(Date.now()/1000);
  const signed='t='+now+',te='+crypto.createHmac('sha256',process.env.PAYMONGO_WEBHOOK_SECRET).update(now+'.'+raw).digest('hex')+',li=';
  r=await nativeFetch(host+'/api/webhooks/paymongo',{method:'POST',headers:{'Paymongo-Signature':signed,'Content-Type':'application/json'},body:raw});
  assert.equal(r.status,200);assert.equal((await r.json()).activated,true);
  r=await nativeFetch(host+'/api/webhooks/paymongo',{method:'POST',headers:{'Paymongo-Signature':signed,'Content-Type':'application/json'},body:raw});
  assert.equal((await r.json()).activated,false,'Payment event must be idempotent');
  r=await post('/api/entries',auth2,{org_id:org.id,product:'frontdesk',title:'Injected lead',body:'no'});
  assert.equal(r.status,403,'Other tenant must be denied');
  r=await post('/api/entries',auth1,{org_id:org.id,product:'frontdesk',title:'Business hours',body:'Our office is open by appointment.'});
  assert.equal(r.status,201);
  const record=(await r.json()).record;
  r=await nativeFetch(host+'/api/entries/'+record.id,{method:'PATCH',headers:auth1,body:JSON.stringify({status:'approved'})});
  assert.equal(r.status,200);
  r=await post('/api/ai',auth1,{org_id:org.id,product:'frontdesk',prompt:'What are our business hours?'});
  assert.equal(r.status,200);
  assert.match((await r.json()).text,/grounded customer response/);
  assert.equal(database.senz_ai_usage.length,1);
  r=await nativeFetch(host+'/api/organizations/'+org.id,{method:'PATCH',headers:auth1,body:JSON.stringify({widget_origins:['https://harbor.example'],widget_greeting:'Welcome to Harbor'})});
  assert.equal(r.status,200);
  r=await nativeFetch(host+'/api/widget/config?org_id='+org.id,{headers:{Origin:'https://harbor.example'}});
  assert.equal(r.status,200);
  assert.equal((await r.json()).greeting,'Welcome to Harbor');
  r=await nativeFetch(host+'/api/widget/config?org_id='+org.id,{headers:{Origin:'https://unapproved.example'}});
  assert.equal(r.status,403);
  r=await post('/api/widget/lead?org_id='+org.id,{'Origin':'https://harbor.example','Content-Type':'application/json'},
    {name:'Visitor',email:'visitor@example.org',message:'Please call about an appointment',consent:true});
  assert.equal(r.status,201);
  assert.ok(database.senz_entries.some(x=>x.title.startsWith('Website inquiry')));
});
