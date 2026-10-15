// Contact page: a short inquiry, then optional qualification details linked to it.
// Both post to the SENZ inquiry API (server.js /api/inquiries), which validates and emails SENZ.
(() => {
  'use strict';
  const inquiry = document.getElementById('inquiry-form');
  const qualify = document.getElementById('qualify-form');
  if (!inquiry) return;
  const endpoint = () => {
    const custom = window.CONTACT_FORM_ENDPOINT;
    const base = String(window.SENZ_API_BASE_URL || window.location.origin).replace(/\/$/, '');
    return custom || `${base}/api/inquiries`;
  };
  const startedAt = Date.now();
  let inquiryId = '';
  let firstPayload = null;

  // Preselect a need from links such as contact.html?type=partner
  const presets = {
    partner: { need: 'Partner program', title: 'Request partner access.', intro: 'Tell us a little about yourself and the customers you would like to serve. SENZ will reply with next steps for the private preview.' },
    demo: { need: 'Demonstration request', title: 'Request a demonstration.', intro: 'Tell us what you would like to see and why. SENZ will arrange a suitable time.' },
  };
  const preset = presets[new URLSearchParams(location.search).get('type')];
  if (preset) {
    inquiry.elements.need.value = preset.need;
    document.getElementById('contact-title').textContent = preset.title;
    document.getElementById('contact-intro').textContent = preset.intro;
  }

  const status = (form, text, state) => {
    const el = form.querySelector('.sz-form-status');
    el.textContent = text;
    el.dataset.state = state || '';
  };

  async function send(payload) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch(endpoint(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok || body.ok === false) throw new Error((body.errors || []).join(' ') || 'Submission failed.');
      return body;
    } finally {
      clearTimeout(timer);
    }
  }

  inquiry.addEventListener('submit', async (event) => {
    event.preventDefault();
    const v = Object.fromEntries(new FormData(inquiry).entries());
    if (!v.name || !v.need || !v.message || !v.consent) return status(inquiry, 'Please complete your name, what you need, a short message and the consent box.', 'error');
    if (!v.email && !v.phone) return status(inquiry, 'Please add an email or a phone/Messenger contact so we can reply.', 'error');
    if (v.email && !inquiry.elements.email.checkValidity()) return status(inquiry, 'Please check the email address.', 'error');
    const button = inquiry.querySelector('button[type=submit]');
    button.disabled = true;
    status(inquiry, 'Sending…');
    firstPayload = {
      formType: 'general',
      name: v.name, email: v.email || '', contact: v.phone || '', brand: v.organization || '',
      projectType: v.need, message: v.message,
      senzWebsite: v.senzWebsite || '', formStartedAt: startedAt,
      fields: { fullName: v.name, organization: v.organization || '', need: v.need, source: location.pathname + location.search },
    };
    try {
      const body = await send(firstPayload);
      inquiryId = body.id || '';
      status(inquiry, 'Thank you. Your inquiry has been sent to SENZ. We will reply by email or your preferred contact.', 'ok');
      inquiry.querySelectorAll('input, select, textarea, button').forEach((el) => { el.disabled = true; });
      if (qualify) { qualify.hidden = false; qualify.querySelector('select').focus(); }
    } catch (error) {
      button.disabled = false;
      status(inquiry, `We could not send your inquiry. Please try again or email info.senz.pr@gmail.com. (${error.message})`, 'error');
    }
  });

  if (qualify) qualify.addEventListener('submit', async (event) => {
    event.preventDefault();
    const v = Object.fromEntries(new FormData(qualify).entries());
    const lines = [
      v.timeline && `Timing: ${v.timeline}`, v.budget && `Investment range: ${v.budget}`,
      v.link && `Current website or page: ${v.link}`, v.decision && `Other decision-makers: ${v.decision}`, v.details,
    ].filter(Boolean);
    if (!lines.length) return status(qualify, 'Add at least one detail, or simply close this page. Your inquiry is already sent.', 'error');
    const button = qualify.querySelector('button[type=submit]');
    button.disabled = true;
    try {
      await send({
        ...firstPayload,
        projectType: `${firstPayload.projectType} (follow-up details)`,
        timeline: v.timeline || '', budget: v.budget || '',
        message: `Follow-up to inquiry ${inquiryId || '(id unavailable)'}.\n\n${lines.join('\n')}`,
        formStartedAt: startedAt,
      });
      status(qualify, 'Thank you. These details were added to your inquiry.', 'ok');
      qualify.querySelectorAll('input, select, textarea, button').forEach((el) => { el.disabled = true; });
    } catch (error) {
      button.disabled = false;
      status(qualify, `These details could not be sent. Your original inquiry was received. (${error.message})`, 'error');
    }
  });
})();
