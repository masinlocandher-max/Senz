const esc = value => String(value).replace(/[&<>"']/g, x => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
const money = n => '₱' + Number(n).toLocaleString('en-PH');
const groups = [
  {id:'business-software',name:'Serve your customers.',intro:'Menus, appointments, inquiries and the work behind every sale.',keys:['qr-menu','booking','digital-catalog','business-website','crm','pos','loyalty']},
  {id:'communications-tools',name:'Find the right words.',intro:'Draft, plan and respond with a clearer message.',keys:['ai-workspace','communications-intelligence','digital-assistant','digital-representative']},
  {id:'projects-events',name:'Bring people and projects together.',intro:'Keep registrations, deliverables and approvals organized.',keys:['client-portal','event-systems']}
];
const shapes = {
  'qr-menu':'<rect x="3" y="3" width="6" height="6" rx="1"/><rect x="15" y="3" width="6" height="6" rx="1"/><rect x="3" y="15" width="6" height="6" rx="1"/><path d="M15 15h3v6m3-6v3m0 3h-6M12 3v4m-9 5h4m5-1v5"/>',
  booking:'<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v4m10-4v4M3 11h18m-14 4h3m4 0h3m-10 3h3"/>',
  'digital-catalog':'<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
  'business-website':'<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M3 9h18M6 6.5h.01m3 0h.01M7 13h10m-10 3h6"/>',
  crm:'<circle cx="9" cy="7" r="3"/><path d="M3 20v-3a6 6 0 0 1 12 0v3M17 4a3 3 0 0 1 0 6m2 4a5 5 0 0 1 2 4v2"/>',
  pos:'<path d="M4 8l8-5 8 5v10l-8 4-8-4V8Zm0 0 8 5 8-5m-8 5v9M8 5.5l8 5v5"/>',
  loyalty:'<rect x="3" y="5" width="18" height="15" rx="3"/><circle cx="8" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><path d="M7 17h10M7 3v4m10-4v4"/>',
  'ai-workspace':'<path d="M14 3H5v18h14V8l-5-5Zm0 0v5h5M8 12h8m-8 4h6"/>',
  'communications-intelligence':'<path d="M4 4h16v12H9l-5 5V4Zm4 4h8m-8 4h5"/>',
  'digital-assistant':'<rect x="3" y="4" width="18" height="15" rx="4"/><path d="m8 19-3 3v-4m3-9h8m-8 5h5"/>',
  'digital-representative':'<circle cx="9" cy="7" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3m1-12h5m-5 4h3"/>',
  'client-portal':'<path d="M3 7h7l2-3h9v17H3V7Zm5 7 3 3 6-7"/>',
  'event-systems':'<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v4m10-4v4M3 10h18m-13 6 3 3 5-6"/>'
};
const symbol = id => `<span class="product-symbol" aria-hidden="true"><svg viewBox="0 0 24 24">${shapes[id]}</svg></span>`;
export function catalogPresentation(catalog, releaseText) {
  const ordered = groups.flatMap(g => g.keys.map(id => catalog.products.find(p => p.id === id)).filter(Boolean));
  const card = p => `<article class="catalog-item">${symbol(p.id)}<div class="catalog-copy"><h3><a href="products/${p.id}.html">${esc(p.name)}</a></h3><p>${esc(p.summary)}</p></div><p class="catalog-price">${money(p.pricePhp)}<small>/month · 1 named user</small></p><a class="button" href="products/${p.id}.html">See features</a></article>`;
  const choices = ordered.map(p => `<label class="planner-choice"><input type="checkbox" name="tools" value="${p.id}"><span>${esc(p.name.replace('SENZ ',''))}</span><b>${money(p.pricePhp)}</b></label>`).join('');
  return {
    schema: {'@context':'https://schema.org','@type':'ItemList',name:'SENZ App products',numberOfItems:ordered.length,itemListElement:ordered.map((p,index)=>({'@type':'ListItem',position:index+1,name:p.name,url:'https://www.senzpr.com/products/'+p.id+'.html'}))},
    body: `<section class="experience-heading"><div class="experience-shell"><h1>Less chasing.<br>More getting things done.</h1><p class="lead">Meet SENZ App. Practical tools for your customers, your communication and your everyday work.</p><div class="catalog-nav" aria-label="Product categories"><a href="#business-software">Business tools</a><a href="#communications-tools">Writing &amp; communication</a><a href="#projects-events">Projects &amp; events</a><a href="#cost-planner-section">Plan your cost</a></div><p class="catalog-release">${releaseText}</p><p class="client-shortcut">Already with SENZ? <a href="client-access.html">Client access &amp; app installation →</a></p></div></section>
    ${groups.map(g=>`<section class="catalog-section" id="${g.id}"><div class="experience-shell"><h2>${g.name}</h2><p class="group-intro">${g.intro}</p><div class="catalog-list">${g.keys.map(id=>catalog.products.find(p=>p.id===id)).filter(Boolean).map(card).join('')}</div></div></section>`).join('')}
    <section class="cost-planner" id="cost-planner-section"><div class="experience-shell"><h2>Pay for the work you need.</h2><p>Choose your tools. See your monthly total before starting a conversation.</p><form id="cost-planner" class="planner-layout"><div><fieldset class="planner-choices" disabled><legend>Which tools would help?</legend>${choices}</fieldset><noscript><p>The calculator needs JavaScript. Each product’s published price is shown above.</p></noscript></div><div class="planner-total"><label>Named users per selected tool<input name="namedUsers" type="number" min="1" max="10000" step="1" value="1" required></label><p class="small">Your selected tools</p><div role="status" aria-live="polite" aria-atomic="true"><p class="planner-amount" data-cost-total>₱0</p><p class="small" data-cost-detail>Select the tools you need.</p></div><label>Current monthly tool spend (optional, ₱)<input name="currentSpend" type="number" min="0" max="1000000000" step="0.01" inputmode="decimal" placeholder="Enter your own total"></label><p class="planner-difference" data-cost-difference aria-live="polite">Add your current monthly spend to compare the totals.</p><p class="planner-error" data-cost-error role="alert"></p><p class="planner-assumption">Planning estimate for the same number of named users in one workspace, at individual product rates. Bundles, setup, migration, custom work and any applicable taxes are not included. A lower total does not mean identical features. Final scope and cost are confirmed before payment.</p><a class="button primary" data-cost-action href="get-started.html" hidden>Discuss these tools</a><p class="small">Your cost comparison stays in this browser. It is not sent to SENZ.</p></div></form></div></section>
    <section class="experience-section"><div class="experience-shell details-rail"><h2>A clear agreement from the start.</h2><details><summary>What does the monthly price cover?</summary><p>Each product price covers one named user in one workspace, with the storage and processing allowance on its product page. Extra seats use the same per-seat rate. Setup and custom services are quoted separately.</p></details><details><summary>How do I get access?</summary><p>Request the tool you need. SENZ confirms availability, your total, any applicable taxes and an activation date before payment. After verified payment or an authorized agreement, your licensed tools open in SENZ App. Teams assign a named seat to each user.</p><p>There is no automatic card checkout or automatic renewal. Public pages must be published under an active license; arrange exports before your license ends.</p></details><details id="processing-credits"><summary>How do processing credits work?</summary><p>Drafting and answer tools have a monthly allowance. Longer inputs and outputs use more credits. Each credit covers up to US$0.01 of processing, rounded up per successful task. The app reserves enough for the task and returns unused credits. Failed tasks return the allowance. Credits reset each calendar month and do not roll over.</p><p>These tools generate drafts and automated answers. Review outputs before relying on them. Customer-facing representatives are disclosed as automated.</p></details><details><summary>Can SENZ help with the strategy too?</summary><p>Yes. <a href="services.html">SENZ professional services</a> help shape your positioning, communication and digital experience. Software and human services have separate scopes, so you can choose the level of support you need.</p></details></div></section>`
  };
}

const journeys = {
 'ai-workspace':['Your notes','A structured draft','Your review & export'],
 'communications-intelligence':['Your brief','Message & tone review','Human approval'],
 'digital-assistant':['Approved knowledge','An answer with sources','Handoff when needed'],
 'digital-representative':['Consent & knowledge','A disclosed text response','Human handoff'],
 'qr-menu':['Update your items','Share your QR code','Guests view your menu'],
 booking:['Set your availability','Receive a request','Confirm the booking'],
 'digital-catalog':['Add your products','Share your catalog','Review inquiry lists'],
 'business-website':['Add your business details','Publish your page','Review inquiries'],
 crm:['Add a contact','Set a stage & next step','Follow up'],
 pos:['Add stock','Record a counter sale','Review daily totals'],
 loyalty:['Set your reward','Record earned stamps','Redeem a full card'],
 'client-portal':['Agree on milestones','Review deliverables','Record approval'],
 'event-systems':['Publish registration','Manage capacity','Check in guests']
};
export function productJourney(p) {
 return `<section class="product-journey" aria-label="How ${esc(p.name)} works"><div class="shell"><ol>${journeys[p.id].map((s,i)=>`<li><span>0${i+1}</span><strong>${s}</strong></li>`).join('')}</ol></div></section>`;
}
