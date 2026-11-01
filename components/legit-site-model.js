/* One deterministic recommendation model for the page, contact handoff and tests. */
(() => {
  'use strict';
  const owns = (object, key) => typeof key === 'string' && Object.hasOwn(object, key);
  function normalize(input, data) {
    const audience = owns(data.audiences, input.audience) ? input.audience : null;
    const goals = Array.isArray(input.goals) ? Object.keys(data.goals).filter(key => input.goals.includes(key)) : [];
    const domain = owns(data.domains, input.domain) ? input.domain : null;
    return { audience, goals, domain };
  }
  function recommend(input, data) {
    const a = normalize(input, data);
    if (!a.audience || !a.goals.length || !a.domain) return null;
    let kind = data.audiences[a.audience].configuration;
    // Seeing a few photographs does not require a bigger plan. An individual stays personal.
    const config = data.configurations[kind];
    const additions = [];
    if (a.goals.includes('booking')) additions.push('booking');
    if (a.goals.includes('catalog')) additions.push('catalog');
    if (a.goals.includes('order')) additions.push('order');
    if (a.goals.includes('updates')) additions.push('updates');
    const sections = [...new Set([
      ...config.sections,
      ...(a.goals.includes('work') ? ['Selected work'] : []),
      ...(a.goals.includes('products') ? ['Product showcase'] : []),
      ...(a.goals.includes('location') ? ['Location'] : [])
    ])];
    return { kind, ...config, sections, additions, answers: a,
      reason: `${data.audiences[a.audience].label.replace(/^For /, '')}: ${a.goals.map(key => data.goals[key].toLowerCase()).join(', ')}.`,
      limitation: 'Page count, content, design, hosting, updates and any additional tools are confirmed in your quote. This recommendation does not activate a service.' };
  }
  function handoff(input, data) {
    const result = recommend(input, data);
    if (!result) return null;
    const a = result.answers;
    const query = new URLSearchParams({ los: '1', audience: a.audience, goals: a.goals.join(','), domain: a.domain, interest: data.name });
    return '/contact.html?' + query;
  }
  function readHandoff(search, data) {
    const q = new URLSearchParams(search);
    if (q.get('los') !== '1') return null;
    const raw = { audience: q.get('audience'), goals: (q.get('goals') || '').split(','), domain: q.get('domain') };
    if (raw.goals.some(key => !owns(data.goals, key)) || raw.goals.length > Object.keys(data.goals).length) return null;
    const r = recommend(raw, data);
    if (!r) return null;
    return { interest: data.name, message: [
      `I would like a quote for Legit Official Site — ${r.name}.`,
      `Building: ${data.audiences[r.answers.audience].label}.`,
      `My website should help people: ${r.answers.goals.map(key => data.goals[key].toLowerCase()).join('; ')}.`,
      `Address preference: ${data.domains[r.answers.domain].label}.`,
      `Recommended starting point: ${r.scope}`,
      ...r.additions.map(key => `Please review: ${data.extensions[key].name}. ${data.extensions[key].note}`),
      'Please confirm the scope, rights, total fee, renewals and delivery date before any payment.'
    ].join('\n\n') };
  }
  const api = { normalize, recommend, handoff, readHandoff };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else window.SENZLegitSite = api;
})();
