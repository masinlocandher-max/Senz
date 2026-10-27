'use strict';

const el = id => document.getElementById(id);
const $main = el('main');
const state = {
  config: null, catalog: null, token: sessionStorage.getItem('senz_access_token') || '',
  refresh: sessionStorage.getItem('senz_refresh_token') || '',
  user: null, orgId: null, screen: 'overview', entries: [], usage: null,
  generated: '', sources: [], isRegister: false, busy: false, inviteUrl: ''
};
const SYMBOLS = { frontdesk: 'FD', sales: 'SD', knowledge: 'KD', workspace: 'AI', content: 'CS', workflow: 'WD', overview: 'OS' };
const DESCRIPTIONS = {
  frontdesk: 'Answer approved FAQs, organize incoming inquiries and prepare clear, human-reviewed responses.',
  sales: 'Keep opportunities organized and turn the next sales conversation into a useful draft.',
  knowledge: 'Build an approved knowledge library, then ask questions grounded in those sources.',
  workspace: 'Give every paid seat a practical place for writing, learning, research and business tasks.',
  content: 'Move from campaign brief to purposeful copy, review and controlled approval.',
  workflow: 'Collect requests, summarize outstanding work and keep approvals with the right people.'
};
const SUGGESTIONS = {
  frontdesk: 'Answer this customer question using our approved FAQs:',
  sales: 'Prepare a thoughtful, concise follow-up and recommend the next step for this opportunity.',
  knowledge: 'What do our approved documents say about',
  workspace: 'Help me produce a clear and useful plan for',
  content: 'Create three original social media captions, a clear call to action, and a recommended angle for',
  workflow: 'Summarize this request, identify the missing details and recommend next steps.'
};
const STATUS = {
  frontdesk: ['draft','approved','new','handling','closed'],
  sales: ['new','qualified','proposal','won','lost'],
  knowledge: ['draft','approved'],
  workspace: ['saved'],
  content: ['draft','review','approved'],
  workflow: ['submitted','review','approved','rejected']
};

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, x => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
  })[x]);
}
function formatDate(s) {
  const d = new Date(s);
  return Number.isNaN(d.valueOf()) ? '—' : d.toLocaleDateString('en-PH', {year:'numeric',month:'short',day:'numeric'});
}
function price(amount) { return amount == null ? 'By quotation' : new Intl.NumberFormat('en-PH',{style:'currency',currency:'PHP',maximumFractionDigits:0}).format(amount/100); }
function productTitle(key) { return state.catalog?.products?.[key]?.title || key; }
function selectedOrg() { return (state.user?.organizations || []).find(x => x.id === state.orgId) || null; }
function accessible(org, key) { return Boolean(org?.licensed && (!key || org.products.includes(key))); }
function roleIsManager() { return ['owner', 'admin'].includes(selectedOrg()?.role); }
function showMessage(message, ok = false) { const target = el('auth-message'); target.textContent = message; target.classList.toggle('ok',ok); }
function toast(message) {
  const t = el('toast'); t.textContent = message; t.hidden = false;
  clearTimeout(toast.timeout);
  toast.timeout = setTimeout(() => { t.hidden = true; }, 4200);
}
function setBusy(value) { state.busy = value; document.querySelectorAll('button[type=submit]').forEach(b => { b.disabled = value; }); }
async function httpJson(url, options = {}) {
  let r;
  try { r = await fetch(url, { cache: 'no-store', ...options }); }
  catch { throw new Error('Cannot connect to the SENZ application service.'); }
  let body;
  try { body = await r.json(); } catch { body = {}; }
  if (!r.ok) throw new Error(body.error || body.message || ('Request failed (' + r.status + ')'));
  return body;
}
async function refreshSession() {
  if (!state.refresh || !state.config?.auth_ready) return false;
  try {
    const result = await httpJson(state.config.supabase_url + '/auth/v1/token?grant_type=refresh_token', {
      method: 'POST', headers: { apikey: state.config.publishable_key, 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: state.refresh })
    });
    rememberTokens(result);
    return true;
  } catch { clearTokens(); return false; }
}
async function api(path, options = {}, retry = true) {
  const headers = { Authorization: 'Bearer ' + state.token, ...(options.body ? {'Content-Type':'application/json'} : {}), ...options.headers };
  try { return await httpJson(path, {...options, headers}); }
  catch (err) {
    if (retry && /session has expired|sign in to continue/i.test(err.message) && await refreshSession()) {
      return api(path, options, false);
    }
    throw err;
  }
}
function rememberTokens(data) {
  state.token = data.access_token || '';
  state.refresh = data.refresh_token || '';
  if (state.token) sessionStorage.setItem('senz_access_token', state.token);
  if (state.refresh) sessionStorage.setItem('senz_refresh_token', state.refresh);
}
function clearTokens() { state.token=''; state.refresh=''; sessionStorage.removeItem('senz_access_token'); sessionStorage.removeItem('senz_refresh_token'); }
function showLogin(message = '') {
  el('app-view').hidden = true; el('login-view').hidden = false;
  if (message) showMessage(message);
}
function showApp() { el('login-view').hidden = true; el('app-view').hidden = false; }
async function loadMe() {
  state.user = await api('/api/me');
  const orgs = state.user.organizations || [];
  if (!orgs.some(o => o.id === state.orgId)) state.orgId = (orgs.find(o => o.licensed) || orgs[0])?.id || null;
  if (state.screen !== 'settings' && state.screen !== 'overview' && !accessible(selectedOrg(),state.screen)) state.screen = 'overview';
  showApp(); render();
  const invite = /^#invite=([a-f0-9]{48})$/i.exec(location.hash);
  if (invite) {
    history.replaceState(null,'',location.pathname + location.search);
    try {
      const accepted = await api('/api/invites/redeem', {method:'POST',body:JSON.stringify({token:invite[1]})});
      state.orgId = accepted.org_id; await loadMe(); toast('Institution invitation accepted.');
    } catch (err) { toast(err.message); }
  }
}
async function authSubmit(e) {
  e.preventDefault();
  if (!state.config?.auth_ready) return showMessage('Sign-in is not configured yet.');
  const email = el('auth-email').value.trim();
  const password = el('auth-password').value;
  setBusy(true); showMessage('');
  try {
    const target = state.isRegister ? '/auth/v1/signup' : '/auth/v1/token?grant_type=password';
    const result = await httpJson(state.config.supabase_url + target, {
      method:'POST',
      headers:{ apikey: state.config.publishable_key, 'Content-Type':'application/json' },
      body:JSON.stringify({email,password})
    });
    if (result.access_token) { rememberTokens(result); await loadMe(); }
    else if (state.isRegister) {
      state.isRegister = false; updateAuthMode();
      showMessage('Account created. Check your email to verify it, then sign in.',true);
    } else showMessage('Sign-in did not return a session. Please check your email.');
  } catch(err){ showMessage(err.message); }
  finally { setBusy(false); }
}
function updateAuthMode() {
  el('auth-heading').textContent = state.isRegister ? 'Create your SENZ AI account.' : 'Sign in to your workspace.';
  el('auth-submit').textContent = state.isRegister ? 'Create account' : 'Sign in';
  el('auth-switch').textContent = state.isRegister ? 'Already have an account? Sign in' : 'New to SENZ AI? Create an account';
  el('auth-password').autocomplete = state.isRegister ? 'new-password' : 'current-password';
}
function headerMarkup(title, detail, label='BUSINESS INTELLIGENCE') {
  return '<header class="page-heading"><div><span class="eyebrow">' + esc(label) + '</span><h1>' + esc(title) + '</h1><p>' + esc(detail) + '</p></div></header>';
}
function pill(text) {
  const value = String(text || 'draft');
  const cls = ['approved','won','saved','closed'].includes(value) ? 'good' : ['rejected','lost','suspended'].includes(value) ? 'red' : ['review','submitted','proposal'].includes(value) ? 'amber' : '';
  return '<span class="pill ' + cls + '">' + esc(value) + '</span>';
}
function overview() {
  const org = selectedOrg();
  if (!accessible(org)) return purchaseScreen();
  const cards = org.products.map(k => {
    const p = state.catalog.products[k];
    return '<button class="product-card" type="button" data-screen="' + esc(k) + '">' +
      '<span class="product-symbol">' + esc(SYMBOLS[k]) + '</span><strong>' + esc(p.title) + '</strong><p>' + esc(DESCRIPTIONS[k]) +
      '</p><span class="card-action">Open workspace →</span></button>';
  }).join('');
  return '<section class="hero-panel"><span class="eyebrow">LICENSE ACTIVE · ' + esc(org.name) + '</span><h1>Make intelligence part of the work.</h1><p>One connected operating environment, designed to turn information into useful decisions. Choose a workspace to begin.</p><div class="hero-meta"><span>' + org.products.length + ' licensed products</span><span>' + org.seats + ' licensed seats</span><span>Valid until ' + esc(formatDate(org.active_until)) + '</span></div></section>' +
    '<div class="grid three stats-row"><div class="stat-card"><span class="stat-label">Licensed workspaces</span><span class="stat-value">' + org.products.length + '</span><div class="stat-note">Products included in this license</div></div>' +
    '<div class="stat-card"><span class="stat-label">Seat capacity</span><span class="stat-value">' + org.seats + '</span><div class="stat-note">You can invite verified members</div></div>' +
    '<div class="stat-card"><span class="stat-label">License expiration</span><span class="stat-value" style="font-size:20px">' + esc(formatDate(org.active_until)) + '</span><div class="stat-note">Prepaid license period</div></div></div>' +
    '<h2 class="section-title">Your workspaces</h2><div class="grid three">' + cards + '</div>' +
    '<div class="notice" style="margin-top:24px">Your AI responses are drafts for human review. Content generation does not send messages, publish posts or approve workflows automatically.</div>';
}
function purchaseScreen() {
  const org = selectedOrg();
  const plans = state.catalog.plans.map(p => {
    const allowed = Boolean(p.available_for_checkout && state.config.checkout_ready);
    return '<article class="panel plan"><span class="eyebrow">' + (p.white_label?'BRANDED RESELLING':'PREPAID LICENSE') + '</span><h3>' + esc(p.title) + '</h3><div class="price">' + esc(price(p.amount_centavos)) +
      '<small> / ' + p.days + ' days</small></div><p class="features">' + esc(p.products.map(productTitle).join(', ')) + '.<br>' + p.seats + ' included seat' + (p.seats>1?'s':'') + '.</p>' +
      '<button type="button" class="btn ' + (allowed?'primary':'ghost') + '" data-plan="' + esc(p.id) + '" ' + (allowed?'':'disabled') + '>' + (allowed?'Pay securely and activate':'Request pricing') + '</button></article>';
  }).join('');
  return '<section class="hero-panel"><span class="eyebrow">ACCESS REQUIRES VERIFIED PAYMENT</span><h1>Choose the right SENZ AI license.</h1><p>' +
    (org ? 'Your organization does not currently have an active paid license. Renew or choose another product below.' : 'Your account is registered. Product workspaces unlock after verified payment or when an institution assigns you a paid seat.') +
    '</p></section><div class="notice warn">' +
    (new URLSearchParams(location.search).get('checkout')==='returned'?'You returned from checkout. Access remains locked until the payment provider confirms your payment. Refresh this page to check your license.':
    'Creating an account is free, but using SENZ AI is restricted to activated product licenses. The platform never unlocks solely because checkout redirected you back.') +
    '</div><h2 class="section-title">Product licenses</h2><div class="pricing-grid">' + plans + '</div><p class="inline-note">Prices appear only after the platform owner configures approved rates. One-time SENZ Partner Program membership does not include any software license. Prepaid licenses require renewal; automatic recurring charges are not configured.</p>';
}
function productIntro(key) {
  const subtitles = {
    frontdesk:'Build a reliable first response for every customer.',
    sales:'Keep the next revenue opportunity in view.',
    knowledge:'Make the organization’s own knowledge searchable.',
    workspace:'A practical AI desk for your licensed work.',
    content:'Make content an intentional business asset.',
    workflow:'Bring order to requests and approvals.'
  };
  return headerMarkup(subtitles[key], DESCRIPTIONS[key], productTitle(key).toUpperCase());
}
function entryCard(entry, product) {
  const canApprove = roleIsManager();
  const opts = STATUS[product].filter(s => canApprove || !['approved','rejected'].includes(s));
  const statusSelect = opts.length>1 ? '<select data-record-status="' + esc(entry.id) + '" aria-label="Change status of ' + esc(entry.title) + '">' +
    opts.map(s=>'<option value="' + esc(s) + '"' + (entry.status===s?' selected':'') + '>' + esc(s) + '</option>').join('') + '</select>' : pill(entry.status);
  return '<article class="item"><span class="product-symbol">' + esc(SYMBOLS[product]) + '</span><div class="item-main">' +
    '<div class="item-title">' + esc(entry.title) + '</div><div class="item-body">' + esc(entry.body).slice(0,6000) + '</div>' +
    '<div class="item-meta">Created ' + esc(formatDate(entry.created_at)) + ' · ' + esc(entry.status) + '</div></div>' +
    '<div class="item-actions">' + statusSelect +
    '<button type="button" class="btn" data-ai-record="' + esc(entry.id) + '">Ask AI</button></div></article>';
}
function productScreen(product) {
  const current = state.entries || [];
  const isKnowledge = product === 'knowledge';
  const promptLabel = isKnowledge ? 'Ask your approved sources' : product === 'frontdesk' ? 'Preview your assistant' : product === 'content' ? 'Generate a campaign draft' : product === 'sales' ? 'Ask for a follow-up draft' : product === 'workflow' ? 'Summarize a request' : 'Ask your AI assistant';
  const entryTitle = {frontdesk:'FAQ title or customer inquiry',sales:'Prospect, company or opportunity',knowledge:'Document or policy title',workspace:'Save a working note',content:'Campaign or content brief',workflow:'Request or task title'}[product];
  const entryBody = {frontdesk:'Approved response or inquiry details',sales:'Contact context, challenge, opportunity and next action',knowledge:'Paste approved source text (up to 12,000 characters)',workspace:'Notes, research or work in progress',content:'Audience, objective, offer, tone and necessary context',workflow:'Requested action, owner, deadline and any dependencies'}[product];
  const eligibleRecords = current.map(e=>entryCard(e,product)).join('');
  const result = state.generated ? '<div class="result-box" role="region" aria-label="AI output">' + esc(state.generated) + '</div>' +
    (state.sources.length ? '<p class="inline-note">Sources: ' + state.sources.map((s,i)=>'[' + (i+1) + '] ' + esc(s.title)).join('; ') + '</p>' : '') +
    '<div class="form-actions"><button type="button" class="btn" data-action="copy-ai">Copy draft</button><button type="button" class="btn primary" data-action="save-ai">Save as record</button></div>' : '<div class="blank">Your AI draft will appear here after you submit a request. No answer is fabricated when the AI service is unavailable.</div>';
  return productIntro(product) +
    '<div class="grid two"><section class="panel"><div class="panel-head"><div><h2>' + esc(promptLabel) + '</h2><p>Responses are drafts. Review before sharing or using externally.</p></div><span class="product-symbol">AI</span></div>' +
    '<form id="ai-form"><div class="field"><label for="ai-prompt">What would you like to do?</label><textarea id="ai-prompt" required minlength="6" maxlength="3000" placeholder="' + esc(SUGGESTIONS[product]) + '"></textarea></div>' +
    '<div class="form-actions"><button type="submit" class="btn primary">Generate with AI</button></div></form></section>' +
    '<section class="panel"><div class="panel-head"><div><h2>AI output</h2><p>Private to your licensed organization. You control what is saved.</p></div></div>' + result + '</section></div>' +
    '<h2 class="section-title">' + (product === 'knowledge' ? 'Knowledge library' : product === 'sales' ? 'Sales pipeline' : product === 'frontdesk' ? 'FAQs and inquiries' : product === 'content' ? 'Campaign drafts' : product === 'workflow' ? 'Request queue' : 'Saved work') + '</h2>' +
    '<div class="grid two"><section class="panel"><div class="panel-head"><div><h2>Create new record</h2><p>Changes are stored within the selected paid organization.</p></div></div>' +
    '<form id="entry-form"><div class="field"><label for="entry-title">' + esc(entryTitle) + '</label><input id="entry-title" maxlength="160" required placeholder="' + esc(entryTitle) + '"/></div>' +
    '<div class="field"><label for="entry-body">' + esc(entryBody) + '</label><textarea id="entry-body" maxlength="12000" placeholder="' + esc(entryBody) + '"></textarea></div>' +
    '<button type="submit" class="btn primary">Save record</button></form>' +
    ((product==='knowledge'||product==='frontdesk')?'<p class="inline-note">New material starts as a draft. An organization administrator must approve it before the AI can use it as a verified source.</p>':'') +
    '</section><section class="panel"><div class="panel-head"><div><h2>Records (' + current.length + ')</h2><p>Change status, use a record as AI context or export your data.</p></div><button type="button" class="btn small" data-action="export-csv">Export CSV</button></div>' +
    (eligibleRecords ? '<div class="item-list">' + eligibleRecords + '</div>' : '<div class="blank">No records yet. Create the first one to begin.</div>') + '</section></div>';
}
function settings() {
  const org = selectedOrg();
  if (!accessible(org)) return purchaseScreen();
  const isManager = roleIsManager();
  const branding = org.white_label ? '<section class="panel"><div class="panel-head"><div><h2>Your white-label identity</h2><p>Visible identity inside your licensed workspace. Custom domains require separate verification.</p></div></div>' +
      '<form id="brand-form"><div class="field"><label for="org-name">Organization name</label><input id="org-name" maxlength="100" required value="' + esc(org.name) + '"/></div>' +
      '<div class="field"><label for="white-label-name">Your product brand name</label><input id="white-label-name" maxlength="100" required value="' + esc(org.white_label_name||org.name) + '"/></div>' +
      '<div class="field"><label for="brand-color">Brand color</label><input id="brand-color" pattern="#[A-Fa-f0-9]{6}" maxlength="7" value="' + esc(org.brand_color||'#2451D9') + '"/></div>' +
      '<button class="btn primary" type="submit" ' + (!isManager?'disabled':'') + '>Save brand identity</button></form></section>' :
      '<section class="panel"><h2>Organization settings</h2><p class="muted">White-label names and colors are available with a separately paid white-label product license.</p></section>';
  return headerMarkup('License and organization', 'Manage paid access, brand identity and verified member invitations.', 'ACCOUNT MANAGEMENT') +
    '<div class="grid three stats-row"><div class="stat-card"><span class="stat-label">License status</span><div class="stat-value" style="font-size:20px">Active</div><div class="stat-note">Verified by server-side entitlement</div></div><div class="stat-card"><span class="stat-label">Seats included</span><div class="stat-value">' + org.seats + '</div><div class="stat-note">Memberships cannot exceed this license</div></div><div class="stat-card"><span class="stat-label">Valid through</span><div class="stat-value" style="font-size:20px">' + esc(formatDate(org.active_until)) + '</div><div class="stat-note">Prepaid period</div></div></div>' +
    '<div class="grid two">' +
    '<section class="panel"><h2>Seat invitations</h2><p class="muted">Invite team members, students or employees who will use a seat paid for by your organization. They must have a verified SENZ AI account.</p>' +
    '<form id="invite-form"><div class="field"><label for="invite-email">Member email address</label><input id="invite-email" type="email" required placeholder="member@institution.edu.ph"/></div>' +
    '<button class="btn primary" type="submit" ' + (!isManager?'disabled':'') + '>Generate invitation link</button></form>' +
    (state.inviteUrl ? '<p class="inline-note">Share this invitation privately with the verified email owner:</p><div class="invite-link">' + esc(state.inviteUrl) + '</div><button type="button" class="btn small" data-action="copy-invite" style="margin-top:12px">Copy invitation</button>' : '') +
    '<p class="inline-note">Invitations expire after 72 hours and can only be redeemed by the invited email account. Email sending is not automated.</p></section>' +
    '<section class="panel"><h2>Plan and AI usage</h2><div class="settings-kv"><div><small>Licensed products</small><strong>' + org.products.length + '</strong></div><div><small>Monthly AI uses</small><strong>' + (state.usage ? state.usage.count+' / '+state.usage.limit : 'Loading…') + '</strong></div>' +
    '<div><small>Your role</small><strong>' + esc(org.role) + '</strong></div><div><small>White-label right</small><strong>' + (org.white_label ? 'Included' : 'Not included') + '</strong></div></div>' +
    '<hr/><p class="muted tiny">Usage is tracked per assigned member. No unlimited AI usage is promised. Your current product access is verified on every server-side operation.</p>' +
    '<button type="button" class="btn" data-screen="billing">Review plans and renewal</button></section>' + branding + '</div>';
}
function nav() {
  const org = selectedOrg();
  const opts = '<option value="">Choose organization</option>' + (state.user?.organizations||[]).map(o=>'<option value="' + esc(o.id) + '"'+ (o.id===state.orgId?' selected':'') +'>' + esc(o.white_label_name||o.name) + (o.licensed?'':' · inactive') + '</option>').join('');
  el('organization-select').innerHTML = opts;
  el('account-email').textContent = state.user.email;
  const items = [{id:'overview',title:'Overview',sym:'OS'}].concat(Object.keys(state.catalog.products).map(k=>({id:k,title:productTitle(k),sym:SYMBOLS[k]})));
  el('product-nav').innerHTML = items.map(item => {
    const disabled = item.id !== 'overview' && !accessible(org,item.id);
    return '<button type="button" class="nav-link ' + (state.screen===item.id?'active':'') + '" data-screen="' + esc(item.id) + '" ' + (disabled?'disabled':'') +
      '><span class="nav-icon">' + esc(item.sym) + '</span>' + esc(item.title) + '</button>';
  }).join('');
  document.querySelectorAll('[data-screen="settings"]').forEach(b=>b.classList.toggle('active',state.screen==='settings'));
}
function render() {
  const org = selectedOrg();
  nav();
  const showBilling = !accessible(org) || state.screen === 'billing';
  let html, title;
  if (showBilling) { html = purchaseScreen(); title = 'Subscription'; }
  else if (state.screen === 'settings') { html = settings(); title = 'License & Settings'; }
  else if (state.screen === 'overview') { html = overview(); title = 'Overview'; }
  else { html = productScreen(state.screen); title = productTitle(state.screen); }
  el('top-title').textContent = title;
  $main.innerHTML = html;
  el('sidebar').classList.remove('open');
  el('menu-toggle').setAttribute('aria-expanded','false');
}
async function chooseScreen(screen) {
  const org = selectedOrg();
  if (!['overview','billing','settings'].includes(screen) && !accessible(org,screen)) return toast('A paid license for this product is required.');
  state.screen = screen; state.generated = ''; state.sources = []; state.inviteUrl = '';
  state.entries = [];
  render();
  if (Object.keys(state.catalog.products).includes(screen)) {
    try { const result = await api('/api/entries?org_id='+encodeURIComponent(state.orgId)+'&product='+encodeURIComponent(screen)); state.entries=result.records; render(); }
    catch(err){ toast(err.message); }
  }
  if (screen === 'settings') {
    try { state.usage = await api('/api/usage?org_id='+encodeURIComponent(state.orgId)); render(); }
    catch(err){ toast(err.message); }
  }
  window.scrollTo({top:0,behavior:'instant'});
}
async function updateRecordStatus(id,status) {
  const entry = state.entries.find(r=>r.id===id); if (!entry) return;
  await api('/api/entries/'+encodeURIComponent(id),{method:'PATCH',body:JSON.stringify({status})});
  entry.status=status; render(); toast('Record status updated.');
}
async function saveEntry(e) {
  e.preventDefault(); const product=state.screen;
  const title=el('entry-title').value.trim(), body=el('entry-body').value.trim();
  if (!title) return;
  setBusy(true);
  try {
    await api('/api/entries',{method:'POST',body:JSON.stringify({org_id:state.orgId,product,title,body})});
    toast('Record saved.'); await chooseScreen(product);
  }catch(err){toast(err.message)}
  finally{setBusy(false)}
}
async function askAi(prompt, recordId=null) {
  if (!prompt || prompt.trim().length<6) return toast('Enter a more detailed request.');
  setBusy(true);
  try {
    const payload={org_id:state.orgId,product:state.screen,prompt};
    if (recordId) payload.record_id=recordId;
    const result=await api('/api/ai',{method:'POST',body:JSON.stringify(payload)});
    state.generated=result.text; state.sources=result.sources||[]; render();
    document.querySelector('.result-box')?.scrollIntoView({behavior:'smooth',block:'nearest'});
    if (!result.used_ai) toast('No matching approved source was found.');
  }catch(err){toast(err.message)}
  finally{setBusy(false)}
}
async function startCheckout(planId) {
  setBusy(true);
  try {
    const org=selectedOrg();
    const payload = { plan:planId };
    if (org) payload.org_id=org.id;
    else payload.org_name='My organization';
    const result=await api('/api/checkout',{method:'POST',body:JSON.stringify(payload)});
    const u=new URL(result.checkout_url);
    if (u.protocol!=='https:' || u.hostname!=='checkout.paymongo.com') throw new Error('Checkout destination was not verified');
    window.location.assign(result.checkout_url);
  }catch(err){toast(err.message)}
  finally{setBusy(false)}
}
function csvExport() {
  const values=[['Title','Details','Status','Created']];
  for (const e of state.entries) values.push([e.title,e.body,e.status,e.created_at]);
  const csv=values.map(row=>row.map(v=>'"'+String(v??'').replace(/^[=+\-@\t\r]/,'\'$&').replace(/"/g,'""')+'"').join(',')).join('\r\n');
  const obj=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
  const a=document.createElement('a'); a.href=obj; a.download='senz-'+state.screen+'-records.csv'; a.click(); setTimeout(()=>URL.revokeObjectURL(obj),2000);
}
async function onMainClick(e) {
  const b=e.target.closest('button'); if(!b || b.disabled) return;
  if(b.dataset.screen) return chooseScreen(b.dataset.screen);
  if(b.dataset.plan) return startCheckout(b.dataset.plan);
  if(b.dataset.aiRecord) {
    const record=state.entries.find(r=>r.id===b.dataset.aiRecord);
    if(record) return askAi('Review this record. Summarize its key points and recommend an appropriate next action. Do not invent details.',record.id);
  }
  const action=b.dataset.action;
  if(action==='export-csv') return csvExport();
  if(action==='copy-ai' && state.generated) return navigator.clipboard.writeText(state.generated).then(()=>toast('AI draft copied.')).catch(()=>toast('Copy is unavailable on this device.'));
  if(action==='copy-invite' && state.inviteUrl) return navigator.clipboard.writeText(state.inviteUrl).then(()=>toast('Invitation copied.')).catch(()=>toast('Copy is unavailable on this device.'));
  if(action==='save-ai' && state.generated) {
    try {
      await api('/api/entries',{method:'POST',body:JSON.stringify({org_id:state.orgId,product:state.screen,title:'AI working draft · '+new Date().toLocaleDateString('en-PH'),body:state.generated})});
      toast('AI output saved as a new record.'); await chooseScreen(state.screen);
    }catch(err){toast(err.message)}
  }
}
async function onMainSubmit(e) {
  const id=e.target.id;
  if(id==='entry-form') return saveEntry(e);
  if(id==='ai-form') { e.preventDefault(); return askAi(el('ai-prompt').value.trim()); }
  if(id==='invite-form') {
    e.preventDefault(); setBusy(true);
    try {
      const r=await api('/api/invites',{method:'POST',body:JSON.stringify({org_id:state.orgId,email:el('invite-email').value})});
      state.inviteUrl=r.invite_url;render();toast('Private invitation link created.');
    }catch(err){toast(err.message)}
    finally{setBusy(false)}
  }
  if(id==='brand-form') {
    e.preventDefault();setBusy(true);
    try {
      await api('/api/organizations/'+encodeURIComponent(state.orgId),{method:'PATCH',body:JSON.stringify({name:el('org-name').value,white_label_name:el('white-label-name').value,brand_color:el('brand-color').value})});
      await loadMe();toast('White-label identity saved.');
    }catch(err){toast(err.message)}
    finally{setBusy(false)}
  }
}
async function init() {
  el('auth-form').addEventListener('submit',authSubmit);
  el('auth-switch').addEventListener('click',()=>{state.isRegister=!state.isRegister;updateAuthMode();showMessage('');});
  el('signout').addEventListener('click',()=>{clearTokens();state.user=null;state.orgId=null;state.screen='overview';showLogin('Signed out successfully.');});
  el('menu-toggle').addEventListener('click',()=>{const side=el('sidebar');side.classList.toggle('open');el('menu-toggle').setAttribute('aria-expanded',String(side.classList.contains('open')));});
  el('product-nav').addEventListener('click',e=>{const b=e.target.closest('button[data-screen]');if(b)chooseScreen(b.dataset.screen);});
  document.querySelector('.side-footer').addEventListener('click',e=>{const b=e.target.closest('button[data-screen]');if(b)chooseScreen(b.dataset.screen);});
  el('organization-select').addEventListener('change',e=>{state.orgId=e.target.value;chooseScreen('overview');});
  $main.addEventListener('click',onMainClick);
  $main.addEventListener('submit',onMainSubmit);
  $main.addEventListener('change',async e=>{
    const id=e.target.dataset.recordStatus;
    if(id) try {await updateRecordStatus(id,e.target.value);}catch(err){toast(err.message);await chooseScreen(state.screen);}
  });
  try {
    const results=await Promise.all([httpJson('/api/config'),httpJson('/api/catalog')]);
    state.config=results[0];state.catalog=results[1];
    if (!state.config.auth_ready) return showLogin('Platform authentication is not configured. The owner must complete setup before accounts can sign in.');
    if (!state.token) return showLogin();
    try { await loadMe(); }
    catch { if(await refreshSession()) {try {await loadMe();}catch{clearTokens();showLogin('Sign in to resume.');}} else showLogin('Please sign in to resume.'); }
  }catch(err){showLogin(err.message);}
}
init();
