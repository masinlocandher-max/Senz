(() => {
  'use strict';
  const host = document.querySelector('#website-selector');
  const model = window.SENZLegitSite;
  const node = (tag, text, cls) => { const el = document.createElement(tag); if (text != null) el.textContent = text; if (cls) el.className = cls; return el; };
  const track = (event, properties = {}) => {
    // No new tracker, cookies, identifiers or personal data. Reuse an installed event sink if supplied.
    const detail = { event: 'legit_site_' + event, product: 'legit-official-site', ...properties };
    window.dispatchEvent(new CustomEvent('senz:analytics', { detail }));
    if (Array.isArray(window.dataLayer)) window.dataLayer.push(detail);
  };
  const button = (label, cls, action) => { const el = node('button', label, cls); el.type = 'button'; el.addEventListener('click', action); return el; };
  const link = (label, href, cls = 'button primary') => { const el = node('a', label, cls); el.href = href; return el; };
  document.querySelectorAll('[data-los-cta]').forEach(el => el.addEventListener('click', () => track('cta', { placement: el.dataset.losCta })));
  fetch('/components/legit-official-site.json').then(r => { if (!r.ok) throw Error(); return r.json(); }).then(data => {
    const contactForm = document.querySelector('form[data-form-kind="general"]');
    if (contactForm) {
      const brief = model.readHandoff(location.search, data);
      if (brief || new URLSearchParams(location.search).get('interest') === data.name) {
        document.querySelector('h1').textContent = 'Tell us about your website.';
        document.querySelector('.hero-text .lead').textContent = 'For yourself, your work or your business. Tell SENZ what you want to create, and we’ll help determine the right setup.';
        document.querySelector('.form-panel h2').textContent = 'Request your website quote';
        document.querySelector('.form-panel > .body-copy').textContent = 'SENZ reviews your needs and replies by email. We confirm the scope, fees, renewals and delivery date before you decide to proceed.';
        document.querySelector('.trust-item:last-child p').textContent = 'Your quote explains the agreed website, responsibilities and ongoing costs before you commit.';
        document.querySelector('.center-head .body-copy').textContent = 'SENZ reviews your website goals, recommends a useful starting point, and confirms what is included. You decide whether to proceed before any paid work begins.';
        const organizationLabel = contactForm.elements.organization.closest('label');
        organizationLabel.firstChild.textContent = 'Business / Organization (optional)';
        const budget = contactForm.elements.budget;
        const budgetInput = node('input'); budgetInput.type = 'text'; budgetInput.name = 'budget'; budgetInput.maxLength = 120;
        budget.closest('label').firstChild.textContent = 'Budget to consider (optional)';
        budget.replaceWith(budgetInput);
        const select = contactForm.elements.inquiryType;
        if (select) {
          let option = [...select.options].find(o => o.value === data.name);
          if (!option) { option = node('option', data.name); option.value = data.name; select.append(option); }
          select.value = data.name;
        }
        if (brief && !contactForm.elements.message.value) contactForm.elements.message.value = brief.message;
        const intro = node('p', brief ? 'Your website setup is included below. Review it, add anything important, then send your request.' : 'Tell us what you want people to learn, see or do on your website. You do not need to know the technical details.', 'los-contact-summary');
        contactForm.prepend(intro);
        track('contact_handoff');
      }
    }
    if (!host) return;
    let answers = model.normalize(history.state?.legitSite?.answers || {}, data);
    let step = Math.min(3, Math.max(0, Number.isInteger(history.state?.legitSite?.step) ? history.state.legitSite.step : 0));
    if (!answers.audience) step = 0;
    else if (!answers.goals.length) step = Math.min(step, 1);
    function save() { try { history.replaceState({ ...history.state, legitSite: { answers, step } }, ''); } catch { /* Completion also works with browser storage disabled. */ } }
    function show(next, focus = true) { step = next; save(); render(focus); }
    function choices(options, selected, choose) {
      const list = node('div', null, 'los-choices');
      for (const [key, value] of Object.entries(options)) {
        const el = button('', 'los-choice', () => choose(key));
        el.append(node('strong', value.label), node('span', value.hint));
        el.setAttribute('aria-pressed', String(selected === key));
        list.append(el);
      }
      return list;
    }
    function result() {
      const r = model.recommend(answers, data);
      if (!r) { show(0); return; }
      host.append(node('p', 'Your recommended website setup', 'los-step'), node('h2', r.name), node('p', r.scope, 'los-result-lead'));
      const goal = node('p', 'Built around your goal: ' + r.reason); host.append(goal);
      host.append(node('h3', 'Your starting structure'));
      const sections = node('ul', null, 'los-result-sections'); r.sections.forEach(s => sections.append(node('li', s))); host.append(sections);
      if (r.additions.length) {
        host.append(node('h3', 'Review these additions with SENZ'));
        const list = node('ul'); r.additions.forEach(key => list.append(node('li', data.extensions[key].note))); host.append(list);
      } else host.append(node('p', 'A focused website is a useful starting point. You do not need a larger software package to begin.'));
      host.append(node('p', 'Address: ' + data.domains[answers.domain].label + '. ' + data.domains[answers.domain].hint));
      host.append(node('p', r.limitation, 'los-note'), node('p', 'Request a quote. SENZ confirms all fees and renewals before you commit.', 'los-quote'));
      const next = link('Request my website quote', model.handoff(answers, data));
      next.addEventListener('click', () => track('quote_request', { configuration: r.kind }));
      const actions = node('div', null, 'button-row'); actions.append(next, button('Edit my answers', 'los-text-button', () => show(0))); host.append(actions);
      track('recommendation', { configuration: r.kind, additions: r.additions.join(',') });
    }
    function render(focus = true) {
      host.replaceChildren();
      if (step === 3) result();
      else {
        host.append(node('p', `Step ${step + 1} of 3`, 'los-step'));
        const progress = node('progress'); progress.max = 3; progress.value = step + 1; progress.setAttribute('aria-label', 'Website setup progress'); host.append(progress);
        const titles = ['What are you building?', 'What should your website help people do?', 'What address would you like?'];
        host.append(node('h2', titles[step]));
        if (step === 0) host.append(node('p', 'You do not need a registered business to have your own website.'), choices(data.audiences, answers.audience, key => { answers.audience = key; track('selector_start'); show(1); }));
        if (step === 1) {
          host.append(node('p', 'Choose what matters to you. We’ll recommend the smallest useful setup.'));
          const form = node('form');
          const fieldset = node('fieldset', null, 'los-goals');
          const legend = node('legend', 'Choose at least one goal', 'los-note'); fieldset.append(legend);
          Object.entries(data.goals).forEach(([key, text]) => {
            const label = node('label', null, 'los-goal'); const input = node('input'); input.type = 'checkbox'; input.name = 'goals'; input.value = key; input.checked = answers.goals.includes(key);
            input.addEventListener('change', () => { answers.goals = [...form.querySelectorAll('input:checked')].map(i => i.value); save(); });
            label.append(input, node('span', text)); fieldset.append(label);
          });
          const error = node('p', '', 'los-error'); error.setAttribute('role', 'alert');
          const submit = node('button', 'Continue', 'button primary'); submit.type = 'submit';
          form.append(fieldset, error, submit);
          form.addEventListener('submit', e => { e.preventDefault(); if (!answers.goals.length) { error.textContent = 'Choose at least one goal to continue.'; form.querySelector('input').focus(); return; } show(2); });
          host.append(form);
        }
        if (step === 2) host.append(node('p', 'This is a preference, not a domain reservation or purchase.'), choices(data.domains, answers.domain, key => { answers.domain = key; show(3); }));
        if (step) host.append(button('Back', 'los-text-button', () => show(step - 1)));
      }
      const heading = host.querySelector('h2'); if (heading) { heading.tabIndex = -1; if (focus) heading.focus(); }
    }
    render(false);
    document.querySelectorAll('[data-example]').forEach(control => control.addEventListener('click', () => {
      const kind = control.dataset.example;
      document.querySelectorAll('[data-example]').forEach(b => b.setAttribute('aria-pressed', String(b === control)));
      document.querySelectorAll('[data-example-panel]').forEach(p => { p.hidden = p.dataset.examplePanel !== kind; });
      track('example', { configuration: kind });
    }));
  }).catch(() => { if (host) { host.replaceChildren(node('h2', 'Tell us what you want to build.'), node('p', 'The setup guide could not load. You can still send your requirements to SENZ.'), link('Request a website quote', '/contact.html?interest=Legit%20Official%20Site')); } });
})();
