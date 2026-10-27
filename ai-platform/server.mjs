import http from 'node:http';
import crypto from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  PRODUCTS, PRODUCT_KEYS, PLANS, InputError, parsePrices, catalog, isUuid,
  requiredText, optionalText, verifyPaymongoSignature, paidCheckoutFromEvent,
  instructionsFor, knowledgeSources
} from './lib.mjs';

const env = process.env;
const origin = (env.PUBLIC_APP_URL || 'http://127.0.0.1:4181').replace(/\/+$/, '');
const supabaseUrl = (env.SUPABASE_URL || '').replace(/\/+$/, '');
const publishableKey = env.SUPABASE_PUBLISHABLE_KEY || '';
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY || '';
const paymongoMode = env.PAYMONGO_MODE === 'live' ? 'live' : 'test';
const prices = parsePrices(env.SENZ_PLAN_PRICING_JSON);
const aiLimit = Math.max(1, Math.min(500, Number(env.SENZ_MONTHLY_AI_LIMIT || 80)));
const publicDir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'public');
const configured = {
  auth: Boolean(supabaseUrl && publishableKey),
  database: Boolean(supabaseUrl && serviceKey),
  checkout: Boolean(env.PAYMONGO_SECRET_KEY && env.PAYMONGO_WEBHOOK_SECRET && supabaseUrl && serviceKey),
  ai: Boolean(env.OPENAI_API_KEY && env.OPENAI_MODEL)
};

function failure(status, message) { throw new InputError(message, status); }
function respond(res, code, data, extra = {}) {
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    ...extra
  });
  res.end(JSON.stringify(data));
}
function safeError(err) {
  if (err instanceof InputError) return { status: err.status, message: err.message };
  return { status: 503, message: 'A required service is temporarily unavailable. Please try again.' };
}
async function jsonBody(req, max = 24000) {
  const chunks = []; let bytes = 0;
  for await (const chunk of req) {
    bytes += chunk.length;
    if (bytes > max) failure(413, 'Request too large');
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) failure(400, 'Request body required');
  let value;
  try { value = JSON.parse(raw); } catch { failure(400, 'Invalid JSON'); }
  if (!value || typeof value !== 'object' || Array.isArray(value)) failure(400, 'Expected JSON object');
  return { raw, value };
}
async function backend(table, filters = {}, method = 'GET', body) {
  if (!configured.database) failure(503, 'Platform database is not configured');
  const u = new URL(supabaseUrl + '/rest/v1/' + table);
  for (const [k, v] of Object.entries(filters)) u.searchParams.set(k, v);
  const r = await fetch(u, {
    method,
    headers: {
      apikey: serviceKey,
      Authorization: 'Bearer ' + serviceKey,
      'Content-Type': 'application/json',
      Prefer: 'return=representation'
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    signal: AbortSignal.timeout(12000)
  });
  if (!r.ok) {
    // No payloads, credentials or customer data in logs or public errors.
    console.error('[senz-ai] database status', r.status, 'table', table);
    failure(503, 'Database operation unavailable');
  }
  const data = await r.text();
  if (!data) return [];
  try { return JSON.parse(data); } catch { failure(503, 'Invalid database response'); }
}
async function auth(req) {
  if (!configured.auth) failure(503, 'Sign-in is not yet configured');
  const match = /^Bearer ([A-Za-z0-9_.-]+)$/.exec(req.headers.authorization || '');
  if (!match) failure(401, 'Sign in to continue');
  const r = await fetch(supabaseUrl + '/auth/v1/user', {
    headers: { apikey: publishableKey, Authorization: 'Bearer ' + match[1] },
    signal: AbortSignal.timeout(12000)
  });
  if (!r.ok) failure(401, 'Your session has expired; sign in again');
  const user = await r.json();
  if (!isUuid(user.id) || !user.email || !user.email_confirmed_at) failure(403, 'Verify your email to continue');
  return { id: user.id, email: user.email.toLowerCase() };
}
function assertUuid(id) { if (!isUuid(id)) failure(422, 'Invalid organization or record'); return id; }
function assertProduct(id) { if (!PRODUCTS[id]) failure(422, 'Unknown product'); return id; }
async function rows(table, filters = {}) { return backend(table, { select: '*', ...filters }); }
async function one(table, filters) { return (await rows(table, { ...filters, limit: '1' }))[0] || null; }
function active(ent) { return Boolean(ent && ent.status === 'active' && Date.parse(ent.active_until) > Date.now()); }
async function access(user, orgId, product) {
  assertUuid(orgId);
  const membership = await one('senz_memberships', { org_id: 'eq.' + orgId, user_id: 'eq.' + user.id });
  if (!membership) failure(403, 'You do not belong to this organization');
  const ent = await one('senz_entitlements', { org_id: 'eq.' + orgId });
  if (!active(ent)) failure(402, 'An active paid organization license is required');
  if (product && (!PRODUCTS[product] || !ent.products.includes(product))) failure(402, 'This product is not included in the paid license');
  return { membership, ent };
}
function manager(role) { if (!['owner', 'admin'].includes(role)) failure(403, 'Organization administrator required'); }
function owner(role) { if (role !== 'owner') failure(403, 'Organization owner required'); }
async function partnerBrandOf(orgId) {
  if (!orgId) return {};
  const org = await one('senz_organizations', {id:'eq.'+orgId});
  const entitlement = org ? await one('senz_entitlements', {org_id:'eq.'+orgId}) : null;
  if (!active(entitlement) || !entitlement.white_label) return {};
  return {
    partner_brand_name: org.white_label_name || org.name,
    partner_brand_logo: org.brand_logo_url || null,
    partner_brand_color: org.brand_color
  };
}
async function requirePaidPartner(user, orgId) {
  const a = await access(user, orgId);
  manager(a.membership.role);
  if (!a.ent.white_label) failure(402, 'A paid white-label reseller license is required');
  return a;
}

async function membershipView(user) {
  const memberships = await rows('senz_memberships', { user_id: 'eq.' + user.id, order: 'created_at.desc', limit: '100' });
  const organizations = [];
  for (const m of memberships) {
    const org = await one('senz_organizations', { id: 'eq.' + m.org_id });
    if (!org) continue;
    const entitlement = await one('senz_entitlements', { org_id: 'eq.' + org.id });
    organizations.push({
      id: org.id, name: org.name, brand_color: org.brand_color,
      white_label_name: entitlement?.white_label ? org.white_label_name : null,
      brand_logo_url: entitlement?.white_label ? org.brand_logo_url : null,
      widget_origins: active(entitlement) && entitlement.products.includes('frontdesk') ? org.widget_origins : [],
      widget_greeting: active(entitlement) && entitlement.products.includes('frontdesk') ? org.widget_greeting : null,
      ...await partnerBrandOf(org.referred_by),
      role: m.role, licensed: active(entitlement), active_until: entitlement?.active_until || null,
      products: active(entitlement) ? entitlement.products : [],
      seats: entitlement?.seats || 0, white_label: Boolean(active(entitlement) && entitlement.white_label)
    });
  }
  return organizations;
}
function normalizeEntry(p, product, role, editing = false) {
  if (!p || typeof p !== 'object' || Array.isArray(p)) failure(422, 'Invalid record');
  const result = {};
  if (!editing || p.title !== undefined) result.title = requiredText(p.title, 160);
  if (!editing || p.body !== undefined) result.body = optionalText(p.body, 12000);
  if (!editing || p.status !== undefined) {
    const statuses = {
      frontdesk: ['draft','approved','new','handling','closed'],
      sales: ['new','qualified','proposal','won','lost'],
      knowledge: ['draft','approved'],
      workspace: ['saved'],
      content: ['draft','review','approved'],
      workflow: ['submitted','review','approved','rejected']
    };
    const defaultStatus = { frontdesk: 'draft', sales: 'new', knowledge: 'draft', workspace: 'saved', content: 'draft', workflow: 'submitted' }[product];
    const status = String(p.status || defaultStatus);
    if (!statuses[product].includes(status)) failure(422, 'Unknown record status');
    if (['approved','rejected'].includes(status) && !['owner','admin'].includes(role)) failure(403, 'Administrator approval required');
    result.status = status;
  }
  if (!editing || p.meta !== undefined) {
    const meta = p.meta ?? {};
    if (typeof meta !== 'object' || Array.isArray(meta) || JSON.stringify(meta).length > 2500) failure(422, 'Invalid record fields');
    result.meta = meta;
  }
  return result;
}
async function handleCheckout(user, req, res) {
  if (!configured.checkout) failure(503, 'Checkout is not configured');
  if (paymongoMode === 'live' && !String(env.PAYMONGO_SECRET_KEY).startsWith('sk_live_')) failure(503, 'Live payments are disabled');
  if (paymongoMode === 'test' && !String(env.PAYMONGO_SECRET_KEY).startsWith('sk_test_')) failure(503, 'Test payment setup is invalid');
  if (!origin.startsWith('https://') && !origin.startsWith('http://127.0.0.1')) failure(503, 'HTTPS app URL required for payments');
  const p = (await jsonBody(req)).value;
  const plan = PLANS[p.plan];
  if (!plan || !prices[p.plan]) failure(422, 'This plan is not yet available for checkout');
  let orgId = p.org_id;
  let resellerId = null;
  if (orgId) {
    assertUuid(orgId);
    const membership = await one('senz_memberships', { org_id: 'eq.' + orgId, user_id: 'eq.' + user.id });
    if (!membership) failure(403, 'You do not own this organization');
    owner(membership.role);
    const existingOrg=await one('senz_organizations',{id:'eq.'+orgId});
    resellerId=existingOrg?.referred_by || null;
  } else {
    if (p.reseller_org_id) {
      resellerId=assertUuid(p.reseller_org_id);
      const reseller=await one('senz_entitlements',{org_id:'eq.'+resellerId});
      if (!active(reseller) || !reseller.white_label) failure(422,'This referral belongs to an inactive partner');
    }
    const name = requiredText(p.org_name || 'My organization', 100);
    const result = await backend('senz_organizations', {}, 'POST', { owner_id: user.id, name, referred_by: resellerId });
    orgId = result[0]?.id;
    if (!isUuid(orgId)) failure(503, 'Unable to start organization');
    await backend('senz_memberships', {}, 'POST', { org_id: orgId, user_id: user.id, role: 'owner' });
  }
  const amount = prices[p.plan];
  const newOrder = await backend('senz_orders', {}, 'POST', {
    org_id: orgId, user_id: user.id, reseller_org_id: resellerId, plan: p.plan, products: plan.products, seats: plan.seats,
    duration_days: plan.days, white_label: plan.whiteLabel, amount_centavos: amount,
    livemode: paymongoMode === 'live'
  });
  const order = newOrder[0];
  if (!order?.id) failure(503, 'Unable to prepare payment order');
  const request = {
    data: { attributes: {
      line_items: [{ name: 'SENZ ' + plan.title + ' · ' + plan.days + ' days', amount, currency: 'PHP', quantity: 1 }],
      payment_method_types: ['card', 'gcash', 'qrph'],
      success_url: origin + '/?checkout=returned',
      cancel_url: origin + '/?checkout=cancelled',
      reference_number: order.id,
      send_email_receipt: true,
      metadata: { order_id: order.id, plan: p.plan }
    } }
  };
  const response = await fetch('https://api.paymongo.com/v2/checkout_sessions', {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + Buffer.from(env.PAYMONGO_SECRET_KEY + ':').toString('base64'),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(request),
    signal: AbortSignal.timeout(15000)
  });
  if (!response.ok) {
    console.error('[senz-ai] checkout gateway status', response.status);
    failure(503, 'Payment gateway is temporarily unavailable');
  }
  const payload = await response.json();
  const checkoutUrl = payload?.data?.attributes?.checkout_url;
  const sessionId = payload?.data?.id;
  if (!sessionId?.startsWith('cs_') || !checkoutUrl || new URL(checkoutUrl).protocol !== 'https:' ||
      new URL(checkoutUrl).hostname !== 'checkout.paymongo.com') failure(503, 'Payment gateway returned an invalid checkout session');
  await backend('senz_orders', { id: 'eq.' + order.id, status: 'eq.pending' }, 'PATCH', { checkout_session_id: sessionId });
  respond(res, 201, { checkout_url: checkoutUrl, order_id: order.id, amount_centavos: amount });
}
async function handleWebhook(req, res) {
  if (!configured.checkout) failure(503, 'Payment processing is not configured');
  const { raw, value } = await jsonBody(req, 90000);
  if (!verifyPaymongoSignature(raw, req.headers['paymongo-signature'], env.PAYMONGO_WEBHOOK_SECRET, paymongoMode)) {
    failure(401, 'Invalid payment signature');
  }
  const event = paidCheckoutFromEvent(value, paymongoMode);
  if (!event) return respond(res, 200, { received: true, ignored: true });
  if (!isUuid(event.orderId)) failure(400, 'Invalid order reference');
  const order = await one('senz_orders', { id: 'eq.' + event.orderId });
  if (!order || !order.checkout_session_id || order.checkout_session_id !== event.sessionId) failure(503, 'Payment order not reconciled');
  if (order.amount_centavos !== event.amountCentavos || order.livemode !== event.live) failure(400, 'Payment amount or mode mismatch');
  const applied = await backend('rpc/senz_fulfill_paid_order', {}, 'POST', {
    p_order_id: order.id, p_session_id: event.sessionId,
    p_payment_id: event.paymentId, p_event_id: event.eventId, p_live: event.live
  });
  respond(res, 200, { received: true, activated: applied === true });
}
async function handleAi(user, req, res) {
  if (!configured.ai) failure(503, 'AI service is not yet configured');
  const p = (await jsonBody(req)).value;
  const product = assertProduct(p.product);
  const orgId = assertUuid(p.org_id);
  await access(user, orgId, product);
  const prompt = requiredText(p.prompt, 3000);
  const month = new Date(); month.setUTCDate(1); month.setUTCHours(0,0,0,0);
  const used = await rows('senz_ai_usage', {
    org_id: 'eq.' + orgId, user_id: 'eq.' + user.id,
    created_at: 'gte.' + month.toISOString(), select: 'id', limit: String(aiLimit + 1)
  });
  if (used.length >= aiLimit) failure(429, 'Monthly AI usage limit reached');
  let context = '', citations = [];
  if (product === 'knowledge') {
    const entries = await rows('senz_entries', { org_id: 'eq.' + orgId, product: 'eq.knowledge', status: 'eq.approved', limit: '100', order: 'created_at.desc' });
    citations = knowledgeSources(entries, prompt);
    if (!citations.length) return respond(res, 200, { text: 'The approved knowledge materials do not contain enough information to answer this question.', sources: [], used_ai: false });
    context = citations.map((s, index) => '[Source ' + (index + 1) + '] ' + s.title + '\n' + s.excerpt).join('\n\n');
  } else if (p.record_id) {
    assertUuid(p.record_id);
    const entry = await one('senz_entries', { id: 'eq.' + p.record_id, org_id: 'eq.' + orgId, product: 'eq.' + product });
    if (!entry) failure(404, 'Record not found in this product');
    if (product === 'frontdesk' && entry.status !== 'approved') failure(403, 'Only approved FAQs may be referenced');
    context = 'Selected record: ' + entry.title + '\n' + entry.body.slice(0, 5000);
  } else if (product === 'frontdesk') {
    const faq = await rows('senz_entries', { org_id: 'eq.' + orgId, product: 'eq.frontdesk', status: 'eq.approved', limit: '15', order: 'created_at.desc' });
    context = faq.map(e => e.title + ': ' + e.body.slice(0, 300)).join('\n');
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 24000);
  let r;
  try {
    r = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + env.OPENAI_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: env.OPENAI_MODEL, instructions: instructionsFor(product),
        input: 'Approved context (may be empty):\n' + context.slice(0, 9000) + '\n\nUser request:\n' + prompt,
        max_output_tokens: 700, store: false
      }),
      signal: controller.signal
    });
  } catch { failure(503, 'AI service is temporarily unavailable'); }
  finally { clearTimeout(timeout); }
  if (!r.ok) { console.error('[senz-ai] model status', r.status); failure(503, 'AI service is temporarily unavailable'); }
  const result = await r.json();
  const text = result.output_text || (result.output || []).flatMap(item => (item.content || []).filter(c => c.type === 'output_text').map(c => c.text)).join('\n');
  if (!text) failure(503, 'No answer was returned; no usage was charged');
  await backend('senz_ai_usage', {}, 'POST', {
    org_id: orgId, user_id: user.id, product,
    input_tokens: Math.max(0, Number(result.usage?.input_tokens || 0)),
    output_tokens: Math.max(0, Number(result.usage?.output_tokens || 0))
  });
  respond(res, 200, { text, sources: citations, used_ai: true });
}

async function publicWidget(req, res, u) {
  const orgId = assertUuid(u.searchParams.get('org_id'));
  const source = String(req.headers.origin || '');
  if (!source) failure(403, 'Website origin required');
  const org = await one('senz_organizations', {id:'eq.'+orgId});
  const ent = await one('senz_entitlements', {org_id:'eq.'+orgId});
  if (!org || !active(ent) || !ent.products.includes('frontdesk')) failure(402, 'Front Desk license inactive');
  if (!Array.isArray(org.widget_origins) || !org.widget_origins.includes(source)) failure(403, 'Website origin not authorized');
  const headers={'Access-Control-Allow-Origin':source,'Vary':'Origin'};
  if (req.method==='OPTIONS') {
    res.writeHead(204,{...headers,'Access-Control-Allow-Headers':'Content-Type','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Max-Age':'600'});
    return res.end();
  }
  if (req.method==='GET' && u.pathname==='/api/widget/config') return respond(res,200,{
    name:ent.white_label && org.white_label_name ? org.white_label_name : org.name,
    greeting:org.widget_greeting, color:ent.white_label ? org.brand_color : '#2451D9'
  },headers);
  if (req.method!=='POST' || !['/api/widget/ask','/api/widget/lead'].includes(u.pathname)) failure(404,'Unknown widget route');
  const input=(await jsonBody(req,5000)).value, kind=u.pathname.endsWith('ask')?'ai':'lead';
  const today=new Date();today.setUTCHours(0,0,0,0);
  const cap=kind==='ai'?Math.max(1,Math.min(250,Number(env.SENZ_WIDGET_DAILY_AI_LIMIT||40))):50;
  const count=await rows('senz_widget_usage',{org_id:'eq.'+orgId,kind:'eq.'+kind,created_at:'gte.'+today.toISOString(),select:'id',limit:String(cap+1)});
  if(count.length>=cap)failure(429,'Website assistant has reached the daily limit');
  if(kind==='lead'){
    if(input.consent!==true)failure(422,'Contact consent is required');
    const name=requiredText(input.name,100), email=requiredText(input.email,254), message=requiredText(input.message,1500);
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))failure(422,'Invalid email');
    await backend('senz_entries',{},'POST',{
      org_id:orgId,product:'frontdesk',title:'Website inquiry · '+name,body:message,
      status:'new',meta:{email,website:source,consent:true},created_by:org.owner_id
    });
    await backend('senz_widget_usage',{},'POST',{org_id:orgId,kind});
    return respond(res,201,{submitted:true},headers);
  }
  if(!configured.ai)failure(503,'Assistant not configured');
  const question=requiredText(input.question,700);
  const faq=await rows('senz_entries',{org_id:'eq.'+orgId,product:'eq.frontdesk',status:'eq.approved',limit:'100'});
  const sources=knowledgeSources(faq,question,4);
  if(!sources.length)return respond(res,200,{answer:'I do not have an approved answer yet. Please leave an inquiry for the team.',human_handoff:true},headers);
  const ctrl=new AbortController(), timeout=setTimeout(()=>ctrl.abort(),18000);
  let response;
  try{
    response=await fetch('https://api.openai.com/v1/responses',{method:'POST',
      headers:{Authorization:'Bearer '+env.OPENAI_API_KEY,'Content-Type':'application/json'},
      body:JSON.stringify({model:env.OPENAI_MODEL,instructions:instructionsFor('frontdesk')+' Use ONLY approved FAQ excerpts; escalate when insufficient.',
        input:'Approved FAQs:\n'+sources.map(s=>s.title+': '+s.excerpt).join('\n')+'\nQuestion:\n'+question,max_output_tokens:300,store:false}),
      signal:ctrl.signal});
  }catch{failure(503,'Assistant temporarily unavailable');}
  finally{clearTimeout(timeout);}
  if(!response.ok)failure(503,'Assistant temporarily unavailable');
  const out=await response.json();
  const answer=out.output_text||(out.output||[]).flatMap(i=>(i.content||[]).filter(c=>c.type==='output_text').map(c=>c.text)).join('\n');
  if(!answer)failure(503,'Assistant did not return an answer');
  await backend('senz_widget_usage',{},'POST',{org_id:orgId,kind});
  return respond(res,200,{answer,human_handoff:false},headers);
}

async function api(req, res, u) {
  if (req.method === 'GET' && u.pathname === '/api/health') return respond(res, 200, { service: 'senz-ai-platform', status: 'running', configured });
  if (req.method === 'GET' && u.pathname === '/api/catalog') return respond(res, 200, { products: PRODUCTS, plans: catalog(prices) });
  if (req.method === 'GET' && u.pathname === '/api/config') return respond(res, 200, {
    app_origin: origin,
    supabase_url: configured.auth ? supabaseUrl : null,
    publishable_key: configured.auth ? publishableKey : null,
    auth_ready: configured.auth, checkout_ready: configured.checkout,
    ai_ready: configured.ai, mode: paymongoMode
  });
  if (req.method === 'GET' && u.pathname === '/api/partner/brand') {
    const partnerId = assertUuid(u.searchParams.get('org_id'));
    const brand = await partnerBrandOf(partnerId);
    if (!brand.partner_brand_name) failure(404, 'Partner identity is not active');
    return respond(res,200,brand);
  }
  if (req.method === 'POST' && u.pathname === '/api/webhooks/paymongo') return handleWebhook(req, res);
  const user = await auth(req);
  if (req.method === 'GET' && u.pathname === '/api/me') return respond(res, 200, { email: user.email, organizations: await membershipView(user) });
  if (req.method === 'POST' && u.pathname === '/api/checkout') return handleCheckout(user, req, res);
  if (req.method === 'GET' && u.pathname === '/api/partner/report') {
    const partnerId=assertUuid(u.searchParams.get('org_id'));
    await requirePaidPartner(user,partnerId);
    const paid=await rows('senz_orders',{reseller_org_id:'eq.'+partnerId,status:'eq.paid',limit:'10000'});
    return respond(res,200,{
      paid_orders:paid.length,
      gross_centavos:paid.reduce((total,o)=>total+Number(o.amount_centavos||0),0),
      currency:'PHP',
      payout_status:'not_configured',
      note:'Gross sales attribution only. Commissions and payouts depend on separate agreements.'
    });
  }
  if (req.method === 'POST' && u.pathname === '/api/ai') return handleAi(user, req, res);
  if (req.method === 'GET' && u.pathname === '/api/entries') {
    const orgId = assertUuid(u.searchParams.get('org_id'));
    const product = assertProduct(u.searchParams.get('product'));
    await access(user, orgId, product);
    const records = await rows('senz_entries', { org_id: 'eq.' + orgId, product: 'eq.' + product, order: 'created_at.desc', limit: '100' });
    return respond(res, 200, { records });
  }
  if (req.method === 'POST' && u.pathname === '/api/entries') {
    const p = (await jsonBody(req)).value;
    const product = assertProduct(p.product), orgId = assertUuid(p.org_id);
    const a = await access(user, orgId, product);
    const values = normalizeEntry(p, product, a.membership.role);
    const saved = await backend('senz_entries', {}, 'POST', {
      ...values, org_id: orgId, product, created_by: user.id
    });
    return respond(res, 201, { record: saved[0] });
  }
  if (req.method === 'PATCH' && /^\/api\/entries\/[0-9a-f-]+$/i.test(u.pathname)) {
    const id = assertUuid(u.pathname.split('/').pop());
    const entry = await one('senz_entries', { id: 'eq.' + id });
    if (!entry) failure(404, 'Record not found');
    const a = await access(user, entry.org_id, entry.product);
    if (entry.status === 'approved' && !['owner','admin'].includes(a.membership.role)) {
      failure(403, 'Only administrators may revise approved content');
    }
    const p = (await jsonBody(req)).value;
    const values = normalizeEntry(p, entry.product, a.membership.role, true);
    if (!Object.keys(values).length) failure(422, 'No fields to update');
    const saved = await backend('senz_entries', { id: 'eq.' + id, org_id: 'eq.' + entry.org_id }, 'PATCH', { ...values, updated_at: new Date().toISOString() });
    return respond(res, 200, { record: saved[0] });
  }
  if (req.method === 'GET' && u.pathname === '/api/usage') {
    const orgId = assertUuid(u.searchParams.get('org_id'));
    await access(user, orgId);
    const month = new Date(); month.setUTCDate(1); month.setUTCHours(0,0,0,0);
    const used = await rows('senz_ai_usage', {
      org_id: 'eq.' + orgId, user_id: 'eq.' + user.id, created_at: 'gte.' + month.toISOString(),
      select: 'id', limit: String(aiLimit + 1)
    });
    return respond(res, 200, { count: used.length, limit: aiLimit });
  }
  if (req.method === 'PATCH' && /^\/api\/organizations\/[0-9a-f-]+$/i.test(u.pathname)) {
    const orgId = assertUuid(u.pathname.split('/').pop());
    const a = await access(user, orgId);
    manager(a.membership.role);
    const p = (await jsonBody(req)).value;
    const updates = {};
    if (p.name !== undefined) updates.name = requiredText(p.name, 100);
    if (p.widget_greeting !== undefined || p.widget_origins !== undefined) {
      if (!a.ent.products.includes('frontdesk')) failure(402, 'Front Desk license required');
      if (p.widget_greeting !== undefined) updates.widget_greeting = requiredText(p.widget_greeting, 220);
      if (p.widget_origins !== undefined) {
        if (!Array.isArray(p.widget_origins) || p.widget_origins.length > 5) failure(422, 'Up to five website origins are allowed');
        const allowed = [];
        for (const v of p.widget_origins) {
          let addr; try { addr = new URL(requiredText(v, 180)); } catch { failure(422, 'Enter full HTTPS website origins'); }
          if ((addr.protocol !== 'https:' && !(addr.protocol === 'http:' && ['localhost','127.0.0.1'].includes(addr.hostname))) || addr.username || addr.password || addr.pathname !== '/' || addr.search || addr.hash) failure(422, 'Only secure website origins without paths are allowed');
          allowed.push(addr.origin);
        }
        updates.widget_origins = [...new Set(allowed)];
      }
    }
    if (p.white_label_name !== undefined || p.brand_color !== undefined || p.brand_logo_url !== undefined) {
      if (!a.ent.white_label) failure(402, 'A paid white-label license is required');
      if (p.white_label_name !== undefined) updates.white_label_name = requiredText(p.white_label_name, 100);
      if (p.brand_color !== undefined) {
        if (!/^#[0-9a-fA-F]{6}$/.test(p.brand_color)) failure(422, 'Enter a six-digit brand color');
        updates.brand_color = p.brand_color;
      }
      if (p.brand_logo_url !== undefined) {
        const logo = optionalText(p.brand_logo_url, 500);
        if (logo && (!/^https:\/\//i.test(logo) || new URL(logo).username || new URL(logo).password)) failure(422, 'Logo URL must use public HTTPS');
        updates.brand_logo_url = logo || null;
      }
    }
    if (!Object.keys(updates).length) failure(422, 'No organization settings to update');
    await backend('senz_organizations', { id: 'eq.' + orgId }, 'PATCH', updates);
    return respond(res, 200, { saved: true });
  }
  if (req.method === 'GET' && u.pathname === '/api/members') {
    const orgId = assertUuid(u.searchParams.get('org_id'));
    const a = await access(user, orgId);
    manager(a.membership.role);
    const members = await rows('senz_memberships', { org_id: 'eq.' + orgId, order: 'created_at.asc', limit: '10000' });
    return respond(res, 200, { members: members.map(m => ({ user_id: m.user_id, role: m.role, created_at: m.created_at })) });
  }
  if (req.method === 'POST' && u.pathname === '/api/invites') {
    const p = (await jsonBody(req)).value;
    const orgId = assertUuid(p.org_id);
    const a = await access(user, orgId);
    manager(a.membership.role);
    const email = requiredText(p.email, 254).toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) failure(422, 'Enter a valid email address');
    const members = await rows('senz_memberships', { org_id: 'eq.' + orgId, select: 'user_id', limit: '10000' });
    if (members.length >= a.ent.seats) failure(409, 'No seats are available');
    const role = p.role === 'admin' && a.membership.role === 'owner' ? 'admin' : 'member';
    const code = crypto.randomBytes(24).toString('hex');
    const token_hash = crypto.createHash('sha256').update(code).digest('hex');
    const expires_at = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();
    await backend('senz_invites', {}, 'POST', {
      org_id: orgId, email, token_hash, role, expires_at, created_by: user.id
    });
    return respond(res, 201, { invite_url: origin + '/#invite=' + code, email, expires_at });
  }
  if (req.method === 'POST' && u.pathname === '/api/invites/redeem') {
    const p = (await jsonBody(req)).value;
    const token = requiredText(p.token, 48);
    if (!/^[a-f0-9]{48}$/i.test(token)) failure(422, 'Invalid invitation');
    const hash = crypto.createHash('sha256').update(token).digest('hex');
    const result = await backend('rpc/senz_redeem_invite', {}, 'POST', {
      p_token_hash: hash, p_user_id: user.id, p_email: user.email
    });
    if (!isUuid(result)) failure(403, 'Invitation has expired or is no longer valid');
    return respond(res, 200, { org_id: result });
  }
  if (req.method === 'DELETE' && /^\/api\/memberships\/[0-9a-f-]+\/[0-9a-f-]+$/i.test(u.pathname)) {
    const parts = u.pathname.split('/');
    const orgId = assertUuid(parts[3]), target = assertUuid(parts[4]);
    const a = await access(user, orgId);
    owner(a.membership.role);
    if (target === user.id) failure(422, 'Owner cannot remove their own seat');
    const targetRow = await one('senz_memberships', { org_id: 'eq.' + orgId, user_id: 'eq.' + target });
    if (!targetRow || targetRow.role === 'owner') failure(404, 'Removable seat not found');
    await backend('senz_memberships', { org_id: 'eq.' + orgId, user_id: 'eq.' + target }, 'DELETE');
    return respond(res, 200, { removed: true });
  }
  failure(404, 'Unknown API route');
}
const staticFiles = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/app.js', ['app.js', 'text/javascript; charset=utf-8']],
  ['/styles.css', ['styles.css', 'text/css; charset=utf-8']],
  ['/favicon.svg', ['favicon.svg', 'image/svg+xml']],
  ['/widget.js', ['widget.js', 'text/javascript; charset=utf-8']]
]);
async function serveStatic(res, pathname) {
  const item = staticFiles.get(pathname);
  if (!item) failure(404, 'Page not found');
  const file = await readFile(path.join(publicDir, item[0]));
  const connectSources = ["'self'"];
  if (configured.auth) {
    try { connectSources.push(new URL(supabaseUrl).origin); } catch { /* unset */ }
  }
  res.writeHead(200, {
    'Content-Type': item[1],
    'Cache-Control': 'no-store',
    'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' https: data:; connect-src " + connectSources.join(' ') + "; base-uri 'none'; frame-ancestors 'none'; object-src 'none'; form-action 'self'",
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
  });
  res.end(file);
}
export const server = http.createServer(async (req, res) => {
  try {
    const u = new URL(req.url || '/', origin);
    if (u.pathname.startsWith('/api/')) {
      if (u.pathname.startsWith('/api/widget/')) return await publicWidget(req, res, u);
      // Bearer-token APIs do not allow cross-origin browser requests.
      if (req.headers.origin && req.headers.origin !== new URL(origin).origin && u.pathname !== '/api/webhooks/paymongo') {
        return respond(res, 403, { error: 'Cross-origin requests are blocked' });
      }
      return await api(req, res, u);
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') failure(405, 'Method not allowed');
    return await serveStatic(res, u.pathname);
  } catch (err) {
    const safe = safeError(err);
    if (safe.status === 503) console.error('[senz-ai] request failed:', err?.name || 'error');
    if (!res.headersSent) respond(res, safe.status, { error: safe.message });
    else res.end();
  }
});
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(env.PORT || 4181);
  server.listen(port, '0.0.0.0', () => console.log('SENZ AI platform listening on port ' + port));
}
