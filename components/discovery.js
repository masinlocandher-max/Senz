(() => {
  const model = window.SENZDiscovery;
  const host = document.querySelector('#discovery');
  const stages = ['Audience', 'Type of help', 'Goal', 'Scope', 'Starting point', 'Timing', 'Next step'];
  let catalog;
  let step = 0;
  let answers = {};
  const money = value => '₱' + Number(value).toLocaleString('en-PH');
  function el(tag, text, className) {
    const node = document.createElement(tag);
    if (text != null) node.textContent = text;
    if (className) node.className = className;
    return node;
  }
  function anchor(label, href, secondary = false) {
    const a = el('a', label, secondary ? 'button secondary' : 'button primary');
    a.href = href;
    return a;
  }
  function button(label, className, onClick) {
    const b = el('button', label, className);
    b.type = 'button';
    b.addEventListener('click', onClick);
    return b;
  }
  function show(index, focus = true) {
    step = index;
    try { history.replaceState({ ...history.state, senzGuide: { step, answers } }, ''); } catch { /* The questionnaire also works without saved history. */ }
    render(focus);
  }
  function choose(value) {
    const key = model.keys[step];
    if (answers[key] !== value && step <= 2) {
      // Later answers depend on the audience, route and recommended product.
      for (const later of model.keys.slice(step + 1)) delete answers[later];
    }
    answers[key] = value;
    show(step + 1);
  }
  function addSeatField() {
    const form = el('form', null, 'seat-choice');
    const label = el('label', 'Number of named users');
    const count = el('input');
    count.type = 'number'; count.min = '1'; count.max = '10000'; count.step = '1'; count.required = true;
    count.value = model.seatCount(answers.scope) || 1;
    label.append(count);
    const next = el('button', 'Continue', 'button primary'); next.type = 'submit';
    form.append(el('p', 'Count the people who will sign in to use the software. A guest reading a public menu or visiting a public page does not need a seat.'), label, next);
    form.addEventListener('submit', e => { e.preventDefault(); if (model.seatCount(count.value)) choose(String(Number(count.value))); });
    host.append(form, button('Help me estimate seats', 'guide-text-button', () => choose('estimate')));
  }
  function result() {
    const a = answers;
    const product = a.route === 'software' && model.productFor(a, catalog);
    host.append(el('p', 'Recommendation', 'discovery-progress'), el('h2', 'Your Recommended SENZ Solution'));
    const service = product ? null : model.services[a.need];
    host.append(el('h3', product ? product.name : service.title));
    if (product) {
      host.append(el('p', 'Your goal: ' + (model.goals[product.id] || product.problem) + '.'), el('p', product.summary));
      host.append(el('h4', 'What is included'));
      const list = el('ul'); for (const item of product.includes) list.append(el('li', item));
      host.append(list, el('p', product.limits));
      const seats = model.seatCount(a.scope);
      const price = product.pricePhp==null ? 'Request a Quote. SENZ confirms your scope and fees before payment.' : seats ? `${money(product.pricePhp * seats)}/month for ${seats} named ${seats === 1 ? 'user' : 'users'} in one workspace.` :
        `From ${money(product.pricePhp)}/month for one named user. SENZ can help estimate your seat count.`;
      host.append(el('p', price + ' ' + product.storageMb.toLocaleString('en-PH') + ' MB storage per workspace.' +
        (product.usesAi ? ' ' + product.aiCreditsPerSeat + ' processing credits per named user each month.' : ''), 'offer-summary'));
      host.append(el('p', a.setup === 'system' ? 'Start with the one product above. If you need existing records moved, ask SENZ to quote migration separately.' :
        'Start with one product. SENZ will confirm availability, setup work and an activation date before requesting payment.'));
    } else {
      host.append(el('p', service.outcome), el('p', service.scope), el('h4', 'Scope and pricing'),
        el('p', model.serviceScopes[a.scope] + '. SENZ will review your brief and confirm the deliverables, limits and fee before paid work begins.'));
    }
    const details = el('dl', null, 'guide-summary');
    const add = (label, value) => details.append(el('dt', label), el('dd', value));
    add('Audience', model.audiences[a.audience]); add('Starting point', (product ? model.softwareSetups : model.serviceSetups)[a.setup]);
    add('Preferred timing', model.timings[a.when]);
    const actions = el('div', null, 'button-row');
    const request = model.handoff(a, catalog);
    const detail = product ? product.publicSlug.slice(1) : service.page;
    actions.append(anchor((product ? model.softwareActions : model.serviceActions)[a.intent], request),
      anchor(product ? 'Review product and pricing' : 'Read about this service', detail + '?' + request.split('?')[1], true));
    host.append(details, actions);
    host.append(button('Edit my answers', 'guide-text-button', () => show(0)));
  }
  function render(moveFocus) {
    host.replaceChildren();
    if (step === model.keys.length) result();
    else {
      const key = model.keys[step], q = model.question(key, answers, catalog);
      host.append(el('p', `Step ${step + 1} of ${model.keys.length} · ${stages[step]}`, 'discovery-progress'));
      const bar = el('progress'); bar.max = model.keys.length; bar.value = step + 1; bar.setAttribute('aria-label', 'Questionnaire progress');
      host.append(bar, el('h2', q.title));
      if (q.seats) addSeatField();
      else {
        const grid = el('div', null, 'choice-grid');
        for (const [value, label] of Object.entries(q.options)) {
          const b = button(label, 'choice', () => choose(value));
          if (answers[key] === value) b.setAttribute('aria-pressed', 'true');
          grid.append(b);
        }
        host.append(grid);
      }
      if (step) host.append(button('Back', 'guide-text-button', () => show(step - 1)));
    }
    const title = host.querySelector('h2');
    title.tabIndex = -1;
    if (moveFocus) title.focus();
  }
  fetch('components/product-catalog.json').then(r => { if (!r.ok) throw Error(); return r.json(); }).then(c => {
    catalog = c;
    const saved = history.state?.senzGuide;
    answers = model.normalize(saved?.answers || {}, catalog);
    step = Math.min(Math.max(0, Number.isInteger(saved?.step) ? saved.step : 0), Object.keys(answers).length);
    render(false);
  }).catch(() => {
    host.replaceChildren(el('p', 'The questionnaire could not load. You can compare products or send SENZ a brief.'),
      anchor('Products and pricing', 'digital-products.html'), anchor('Contact SENZ', 'contact.html', true));
  });
})();
