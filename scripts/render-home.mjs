import fs from 'node:fs';
const content = JSON.parse(fs.readFileSync(new URL('../components/home-content.json', import.meta.url), 'utf8'));
const esc = s => String(s).replace(/[&<>"']/g, x => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
const paths = {
  arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
  chevron: '<path d="m6 9 6 6 6-6"/>',
  person: '<circle cx="12" cy="7" r="3"/><path d="M5 21v-3a7 7 0 0 1 14 0v3M8 21h8"/>',
  briefcase: '<rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V4h8v3M3 12a23 23 0 0 0 18 0M10 13h4"/>',
  shop: '<path d="M4 10v11h16V10M3 10l2-7h14l2 7M3 10a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0M9 21v-7h6v7"/>',
  team: '<circle cx="9" cy="6" r="3"/><path d="M3 21v-5a6 6 0 0 1 12 0v5M16 4a3 3 0 0 1 0 6m2 3a5 5 0 0 1 3 4v4"/>',
  school: '<path d="m2 8 10-5 10 5-10 5-10-5Zm4 2v7q6 5 12 0v-7m4-2v8"/>',
  institution: '<path d="m3 8 9-5 9 5H3Zm2 3v7m5-7v7m4-7v7m5-7v7M3 21h18M3 18h18"/>',
  message: '<path d="M21 14a3 3 0 0 1-3 3H8l-5 4V6a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v8ZM7 8h10M7 12h7"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  globe: '<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18M5 7h14M5 17h14"/>',
  support: '<path d="M4 13v-2a8 8 0 0 1 16 0v2M4 12H2v6h4v-6H4Zm16 0h2v6h-4v-6h2ZM20 18v2l-6 1"/>',
  check: '<path d="m5 12 4 4L19 6"/><circle cx="12" cy="12" r="10"/>',
  screen: '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8m-4-4v4"/>',
  document: '<path d="M14 2H5v20h14V7l-5-5v5h5M8 12h8m-8 4h8"/>'
};
const icon = name => `<svg class="home-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${paths[name] || paths.grid}</svg>`;
const arrow = icon('arrow');
const cta = (label, href, primary = true) => `<a class="button ${primary ? 'primary' : 'secondary'}" href="${esc(href)}">${label}${arrow}</a>`;
const textLink = (label, href) => `<a class="home-text-link" href="${esc(href)}">${label}${arrow}</a>`;
const image = (src, alt, width = 1536, height = 1024) => `<img src="assets/${src}" alt="${esc(alt)}" width="${width}" height="${height}" loading="lazy" decoding="async">`;

// Native example UI stays separate from raster brand/photography assets.
function websitePreview(kind) {
  const options = {
    professional: {name:'MARA REYES', title:'Your next chapter.<br>A clearer direction.', sub:'Independent consultant', image:'legit-site-still-life.webp'},
    business: {name:'NORTHLINE STUDIO', title:'Good spaces.<br>Considered details.', sub:'Architecture & interiors', image:'senz-premium-workspace-hero.png'},
    portfolio: {name:'STUDIO LAYA', title:'A different<br>point of view.', sub:'Objects, spaces & stories', image:'legit-site-still-life.webp'}
  };
  const p = options[kind];
  return `<div class="home-mini-site home-mini-${kind}" aria-hidden="true"><div class="home-browser-bar"><i></i><i></i><i></i></div><div class="home-mini-nav"><b>${p.name}</b><span>ABOUT &nbsp; WORK &nbsp; CONTACT</span></div><div class="home-mini-content"><div><small>${p.sub}</small><p>${p.title}</p><span class="home-mini-cta">Let’s talk ${arrow}</span></div>${image(p.image, '')}</div><div class="home-mini-bottom"><span>A thoughtful approach.</span><span>Made personal.</span></div></div>`;
}

export function renderHomepage(catalog) {
  const find = id => {
    const product = catalog.products.find(p => p.id === id);
    if (!product) throw new Error(`Missing homepage product: ${id}`);
    return product;
  };
  const groups = content.productGroups.map(group => `<div class="home-product-group"><h3>${esc(group.name)}</h3><ul>${group.ids.map(id => {
    const p = find(id);
    return `<li><a href="${esc(p.publicSlug.slice(1))}"><span><strong>${esc(p.name.replace(/^SENZ /, ''))}</strong><small>${esc(p.summary)}</small><small>${esc(p.publicStatusLabel)}</small></span>${arrow}</a></li>`;
  }).join('')}</ul></div>`).join('');
  const audience = [
    ['person','Individuals','Build your personal presence'], ['briefcase','Professionals','Show your expertise'],
    ['shop','Entrepreneurs','Give your business room to grow'], ['team','Organizations','Bring people and purpose together'],
    ['school','Educational institutions','Connect with your community'], ['institution','Government','Serve with clarity']
  ];
  const templates = [['professional','Professional','For freelancers & personal brands'],['business','Business','For startups & growing businesses'],['portfolio','Portfolio','For creatives & independent work']];
  const featured = [
    ['business-website','Website','Your professional place online.',websitePreview('professional')],
    ['qr-menu','QR Menu','Make your latest menu easy to find.',`<div class="home-menu-preview" aria-hidden="true"><div class="home-menu-brand">MESA<br><small>THE NEIGHBORHOOD TABLE</small></div>${image('senz-app-merienda.webp','')}<div><strong>A little something good.</strong><span>Fresh from the kitchen</span></div></div>`],
    ['booking','Booking','Let customers request a time.',`<div class="home-product-screen">${image('app-screen-bookings.webp','SENZ Booking sample appointment dashboard.',1440,1009)}</div>`],
    ['digital-catalog','Digital Catalog','Show your products. Invite an inquiry.',`<div class="home-catalog-preview" aria-hidden="true"><b>THE CONSIDERED COLLECTION</b><div>${image('senz-catalog-sample.webp','',1254,1254)}</div><span>Objects for everyday living.</span></div>`]
  ];
  return `<main id="main-content">
  <section class="home-opening" aria-labelledby="hero-title"><div class="home-shell">
    <div class="home-hero-grid"><div class="home-hero-copy"><p class="home-label">Strategic communications <span>/</span> Digital solutions</p><h1 id="hero-title">Influence<br>through <em>clarity.</em></h1><p class="home-hero-intro">We shape what people understand about you—and build the websites and tools that help them act.</p><div class="button-row">${cta('Get started', 'get-started.html')}${cta('Explore our solutions', '#solutions', false)}</div></div><figure class="home-hero-image"><img src="assets/senz-connected-workspace.webp" width="1536" height="1024" alt="SENZ CRM and Booking previews on a laptop and phone in a sunlit workspace." fetchpriority="high"><figcaption>Illustrative staging · Product previews with sample data</figcaption></figure></div>
    <ol class="home-connection" id="solutions" aria-label="One connected approach"><li><a href="services.html">${icon('message')}<span><strong>Clear strategy</strong><small>For stronger decisions</small></span>${arrow}</a></li><li><a href="#digital-solutions">${icon('grid')}<span><strong>Practical digital tools</strong><small>For your next step</small></span>${arrow}</a></li><li><a href="contact.html">${icon('support')}<span><strong>Support as you grow</strong><small>A scope built around you</small></span>${arrow}</a></li></ol>
    <div class="home-audience" id="who-we-help"><p class="home-audience-label">A clearer presence. Whoever you are.</p><ul>${audience.map(([i,title,description])=>`<li><a href="get-started.html">${icon(i)}<strong>${title}</strong><span>${description}</span></a></li>`).join('')}</ul></div>
  </div></section>
  <section class="home-rental" id="website-rental" aria-labelledby="rental-heading"><div class="home-shell home-rail-layout"><div class="home-section-copy"><p class="home-label">Website rental</p><h2 id="rental-heading">Your professional<br>space on the internet.</h2><p class="home-lead">For freelancers, startups and growing businesses. A place for your work, your story and your next opportunity.</p><div class="button-row">${cta('Explore website rental', 'legit-official-site/')}${textLink('How it works', 'legit-official-site/#how-it-works')}</div><p class="home-note">Setup, service, support and renewal terms are confirmed in your quote.</p></div><div class="home-templates"><div class="home-template-grid">${templates.map(([kind,title,description])=>`<a class="home-template-card" href="legit-official-site/?example=${kind === 'business' ? 'business' : 'professional'}#website-examples"><div class="home-template-art">${websitePreview(kind)}</div><div class="home-card-copy"><h3>${title}</h3><p>${description}</p><span class="home-round-arrow">${arrow}</span></div></a>`).join('')}</div><p class="home-note home-sample-note">Fictional design directions · Your content, colors and layout are agreed around you.</p></div></div></section>
  <section class="home-products" id="digital-solutions" aria-labelledby="digital-heading"><div class="home-shell"><div class="home-section-heading"><div><p class="home-label">Digital solutions</p><h2 id="digital-heading">Practical tools.<br>Real purpose.</h2></div><div><p class="home-lead">Turn a clear message into an easier next step. Help people find you, explore what you offer and get in touch.</p>${textLink('Explore all products', 'digital-products.html')}</div></div><div class="home-featured-products">${featured.map(([id,title,description,visual])=>{
    const p = find(id);
    return `<a class="home-product-card" href="${esc(p.publicSlug.slice(1))}"><div class="home-product-art">${visual}</div><div class="home-card-copy"><h3>${title}</h3><p>${description}</p><span class="home-product-status">${esc(p.publicStatusLabel)}</span><span class="home-card-link">Explore ${arrow}</span></div></a>`;
  }).join('')}</div><p class="home-availability">Product previews. SENZ confirms availability, scope and activation before payment.</p><details class="home-full-catalog"><summary>Explore the complete product range <span>${catalog.products.length} solutions</span>${icon('chevron')}</summary><div class="home-product-groups">${groups}</div><div class="button-row" id="packages">${cta('Compare products &amp; pricing', 'digital-products.html')}${cta('Help me choose', 'get-started.html', false)}</div></details></div></section>
  <section class="home-app" id="senz-app" aria-labelledby="app-heading"><div class="home-shell home-app-layout"><figure class="home-app-device"><div class="home-phone"><img src="assets/app-screen-crm-mobile.webp" width="390" height="844" loading="lazy" decoding="async" alt="Actual SENZ CRM mobile interface showing sample client follow-ups."></div><figcaption>Actual interface · Sample data</figcaption></figure><div class="home-app-copy"><p class="home-label">SENZ App</p><h2 id="app-heading">All your tools.<br>One workspace.</h2><p class="home-lead">A place for your eligible SENZ tools, assigned to your account when your service is ready and activated.</p><div class="button-row">${cta('Existing client? Start here', 'client-access.html', false)}${textLink('Explore the app', 'digital-products.html')}</div><p class="home-note">${catalog.releaseState === 'released' ? 'Access depends on your activated products and assigned seats.' : 'Public app access is not yet released. Existing clients can follow up on requests and access arrangements.'}</p></div><ul class="home-app-benefits"><li>${icon('grid')}<div><h3>Your licensed tools</h3><p>Access follows your agreed service.</p></div></li><li>${icon('document')}<div><h3>Keep work together</h3><p>One place for the tools you use.</p></div></li><li>${icon('screen')}<div><h3>Desktop or mobile</h3><p>A browser-based workspace.</p></div></li></ul></div></section>
  <section class="home-partners" id="partnership" aria-labelledby="partner-heading"><div class="home-shell home-rail-layout"><div class="home-section-copy"><p class="home-label">Partner with SENZ</p><h2 id="partner-heading">Build your business<br>with SENZ.</h2><p class="home-lead">Bring your customer relationships. Explore eligible digital solutions, delivery support and a clear partnership agreement.</p><div class="button-row">${cta('Explore the Partner Program', 'partner-program.html')}</div></div><div class="home-partner-cards"><a href="partner-program.html">${image('senz-premium-workspace-hero.png','Illustrative professional workspace.')}<div><span>01</span><h3>Your opportunity</h3><p>Bring solutions to the people you know.</p>${arrow}</div></a><a href="partner-program.html">${image('senz-strategy-v2.webp','Illustrative strategic planning setting.')}<div><span>02</span><h3>Our support</h3><p>Agree the resources and delivery you need.</p>${arrow}</div></a><a href="partner-program.html">${image('senz-signature-glass.webp','Illustrative glass architecture.')}<div><span>03</span><h3>A shared direction</h3><p>Define responsibilities before you begin.</p>${arrow}</div></a></div><p class="home-note home-partner-note">Illustrative scenes. Product eligibility, fees and responsibilities are confirmed in writing. Customers and income are not guaranteed.</p></div></section>
  <section class="home-next" id="authority-check" aria-labelledby="next-heading"><div class="home-shell"><div class="home-section-heading"><div><p class="home-label">How it works</p><h2 id="next-heading">A clearer path<br>from idea to impact.</h2></div><p class="home-lead">Start with your goal. We help define the right solution, then agree what happens next.</p></div><ol class="home-journey"><li><span>1</span><div>${icon('person')}<h3>Tell us your goal</h3><p>Share what you want to achieve.</p></div></li><li><span>2</span><div>${icon('message')}<h3>See your recommendation</h3><p>Find a useful starting point.</p></div></li><li><span>3</span><div>${icon('document')}<h3>Review scope &amp; quotation</h3><p>Confirm inclusions, fees and timing.</p></div></li><li><span>4</span><div>${icon('check')}<h3>Confirm &amp; activate</h3><p>Proceed when readiness and terms are agreed.</p></div></li></ol><div class="button-row home-center-actions">${cta('Find my solution', 'get-started.html')}${textLink('Talk to our team', 'contact.html')}</div></div></section>
  <section class="home-closing" aria-labelledby="closing-heading"><div class="home-shell"><p class="home-label">Your next chapter</p><h2 id="closing-heading">What are you trying to build?</h2><p>Choose your starting point. We’ll help you find the next step.</p><div class="home-starting-points">${[['message','Strategic communications','A clearer message and direction.','services.html'],['globe','Website rental','Your professional space online.','legit-official-site/'],['grid','Digital solutions','Tools for customers and everyday work.','digital-products.html'],['team','Partnership','Build your business with SENZ.','partner-program.html']].map(([i,title,text,href])=>`<a href="${href}">${icon(i)}<h3>${title}</h3><p>${text}</p><span class="home-round-arrow">${arrow}</span></a>`).join('')}</div></div></section>
  </main>`;
}
