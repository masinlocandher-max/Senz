// Public choices only. The handoff URL never contains a person's name, contact details, or free text.
(() => {
  const audiences = { myself: 'Myself', professional: 'My profession / personal brand', business: 'My business',
    organization: 'My company / organization', education: 'My school / educational institution',
    government: 'My government office / public institution', other: 'Something else' };
  const routes = { software: 'I want software I can use', services: 'I want to work with the SENZ team', unsure: 'Help me decide' };
  const goals = {
    'ai-workspace': 'Draft, edit and organize documents', 'communications-intelligence': 'Plan and review important messages',
    'digital-assistant': 'Answer recurring questions on our website', 'client-portal': 'Review work and approve deliverables on a SENZ project',
    'event-systems': 'Register guests and check them in', 'digital-representative': 'Answer questions in an approved brand voice',
    'qr-menu': 'Give guests an up-to-date QR menu', booking: 'Manage appointment requests', 'digital-catalog': 'Show products and collect inquiries',
    'business-website': 'Publish a one-page business website', crm: 'Keep track of leads and follow-ups',
    pos: 'Record counter sales and track stock', loyalty: 'Give regular customers a digital stamp card'
  };
  const services = {
    brand: { goal: 'Clarify our brand or position', title: 'Brand strategy and positioning', interest: 'Brand & Communication Strategy', page: 'brand-strategy-philippines.html',
      outcome: 'Give your audience a clear reason to choose you.', scope: 'Start with the audience, the offer and the message that connects them.' },
    pr: { goal: 'Prepare a public announcement or manage reputation', title: 'Public relations strategy', interest: 'PR & Reputation', page: 'public-relations-philippines.html',
      outcome: 'Prepare a clear message for the people who need to hear it.', scope: 'Start with the issue or announcement, its audiences and the spokesperson.' },
    website: { goal: 'Create my personal or business website', title: 'Legit Official Site', interest: 'Legit Official Site', page: 'legit-official-site/',
      outcome: 'Your place on the internet, built around your identity, work or business.', scope: 'Use the website setup guide to choose a personal, professional, business or company configuration, then agree the scope and fee.' },
    campaign: { goal: 'Plan a communications or creative campaign', title: 'Strategic communications', interest: 'Focused Implementation', page: 'strategic-communications-philippines.html',
      outcome: 'Give your campaign a clear audience, message and delivery plan.', scope: 'Define the priority audience, channels and deliverables in a project brief.' },
    review: { goal: 'Work out what to tackle first', title: 'Digital Presence & Authority Check', interest: 'Digital Presence & Authority Check', page: 'services.html',
      outcome: 'Identify the first change most likely to help your audience find or understand you.', scope: 'Start with an initial review of up to 30 minutes. SENZ can then propose a focused service or suggest software if it fits.' }
  };
  const serviceScopes = { single: 'One defined project', ongoing: 'Support over several months', advise: 'Help me choose the scope' };
  const softwareSetups = { new: 'Starting from scratch', manual: 'Paper, spreadsheets or chat', system: 'An existing tool or system', unknown: 'Still working it out' };
  const serviceSetups = { brief: 'A written brief', existing: 'Existing pages or campaign materials', examples: 'Examples of what we want to change', new: 'Starting from scratch' };
  const timings = { soon: 'As soon as possible', month: 'Within 30 days', quarter: 'Within 1–3 months', later: 'Within 3–6 months', explore: 'Exploring only' };
  const softwareActions = { availability: 'Request availability', demo: 'Request a demo', quote: 'Request a quote' };
  const serviceActions = { discuss: 'Discuss my project', quote: 'Request a quote' };
  const keys = ['audience', 'route', 'need', 'scope', 'setup', 'when', 'intent'];
  const owns = (obj, key) => Object.hasOwn(obj, key);
  const seatCount = value => /^\d{1,5}$/.test(String(value)) && Number(value) >= 1 && Number(value) <= 10000 ? Number(value) : null;
  const productFor = (a, catalog) => catalog.products.find(p => p.id === a.need && (a.audience === 'other' || p.segments.includes(a.audience)));
  function question(key, a, catalog) {
    const product = a.route === 'software' && productFor(a, catalog);
    switch (key) {
      case 'audience': return { title: 'Who is this for?', options: audiences };
      case 'route': return { title: 'How would you like SENZ to help?', options: routes };
      case 'need': {
        if (a.route !== 'software') return { title: 'What would you like to improve?', options: Object.fromEntries(Object.entries(services).map(([id,s]) => [id,s.goal])) };
        const choices = catalog.products.filter(p => a.audience === 'other' || p.segments.includes(a.audience));
        return { title: 'What would you like the software to do?', options: { ...Object.fromEntries(choices.map(p => [p.id, goals[p.id] || p.problem])), review: 'Help me choose a tool' } };
      }
      case 'scope': return product ? { title: 'How many people need a login?', seats: true } : { title: 'What scope do you have in mind?', options: serviceScopes };
      case 'setup': return product ? { title: 'How do you handle this today?', options: softwareSetups } : { title: 'What do you already have to work from?', options: serviceSetups };
      case 'when': return { title: 'When would you like to start?', options: timings };
      case 'intent': return { title: 'What would you like from SENZ next?', options: product ? softwareActions : serviceActions };
    }
  }
  function normalize(input, catalog) {
    const answers = {};
    for (const key of keys) {
      const q = question(key, answers, catalog);
      const value = input[key];
      if (q.seats ? !(value === 'estimate' || seatCount(value)) : !owns(q.options, value)) break;
      answers[key] = q.seats && value !== 'estimate' ? String(seatCount(value)) : value;
    }
    return answers;
  }
  function handoff(a, catalog) {
    const product = a.route === 'software' && productFor(a, catalog);
    const q = new URLSearchParams({ guide: '1', audience: a.audience, route: a.route, need: a.need,
      scope: a.scope, setup: a.setup, when: a.when, intent: a.intent });
    if (product) {
      q.set('product', product.id);
      if (!seatCount(a.scope)) {
        q.set('interest', product.name + ' — seat estimate');
        return 'contact.html?' + q;
      }
      q.set('seats', String(seatCount(a.scope)));
      return 'purchase.html?' + q;
    }
    q.set('interest', services[a.need].interest);
    return 'contact.html?' + q;
  }
  // Reconstruct a brief solely from published choices. Price is calculated from the catalog by the intake server.
  function readHandoff(search, kind, catalog = { products: [] }) {
    const q = new URLSearchParams(search);
    if (q.get('guide') !== '1') return null;
    const a = normalize(Object.fromEntries(q), catalog);
    if (Object.keys(a).length !== keys.length) return null;
    const product = a.route === 'software' && productFor(a, catalog);
    const estimate = product && a.scope === 'estimate';
    if (product && q.get('product') !== product.id) return null;
    if (kind === 'product' && (!product || estimate)) return null;
    if (kind === 'service') {
      if (product && !estimate) return null;
      const expected = estimate ? product.name + ' — seat estimate' : services[a.need]?.interest;
      if (!expected || q.get('interest') !== expected) return null;
    }
    const intent = (product ? softwareActions : serviceActions)[a.intent];
    const setup = (product ? softwareSetups : serviceSetups)[a.setup];
    const brief = [intent + '.', 'For: ' + audiences[a.audience] + '.', 'Starting point: ' + setup + '.'];
    if (!product) brief.push('Scope: ' + serviceScopes[a.scope] + '.');
    if (product && a.scope === 'estimate') brief.push('Please help estimate the number of named users.');
    return { interest: product ? product.name : services[a.need].interest, seats: product ? seatCount(a.scope) : null,
      timeline: timings[a.when], message: brief.join(' '), intent };
  }
  const model = { audiences, routes, goals, services, serviceScopes, softwareSetups, serviceSetups, timings, softwareActions, serviceActions,
    keys, seatCount, productFor, question, normalize, handoff, readHandoff };
  if (typeof module !== 'undefined' && module.exports) module.exports = model;
  else window.SENZDiscovery = model;
})();
