import fs from 'node:fs';
const content = JSON.parse(fs.readFileSync(new URL('../components/website-rental.json', import.meta.url), 'utf8'));
const commercial = JSON.parse(fs.readFileSync(new URL('../commercial/catalog.json', import.meta.url), 'utf8'));
const offer = commercial.products.find(product => product.id === 'legit-official-site');
const esc = value => String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const rows = items => items.map(item => `<div><dt>${esc(item.title)}</dt><dd>${esc(item.text)}</dd></div>`).join('');
const check = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m6 12 4 4 8-9"/></svg>';
const chevron = '<svg class="los-disclosure-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';

export function rentalNavigation() {
  return `<nav class="los-page-nav" aria-label="Website rental page sections"><div class="los-wrap">${content.navigation.map(item => `<a href="#${item.id}" data-los-cta="section-${item.id}">${esc(item.label)}</a>`).join('')}</div></nav>`;
}

export function rentalIntroduction(action) {
  return `<section class="los-section los-rental-band" id="website-rental" aria-labelledby="rental-title"><div class="los-wrap los-rental-grid"><div><h2 id="rental-title">A website for your work.<br>A service that keeps it simple.</h2><p>Website rental means an ongoing service for your agreed website and hosting. You bring your identity and content; SENZ helps shape the setup. Your quote defines what is included and what happens when the service ends.</p>${action('Find my setup','#find-my-setup','rental-introduction')}</div><dl class="los-definition-rows">${rows(content.audiences)}</dl></div></section>`;
}

export function rentalInclusions() {
  // Capabilities come from the commercial authority, checked against the app contract.
  const features = offer.includes.map((text,i) => `<li><span aria-hidden="true">${String(i+1).padStart(2,'0')}</span><div><h3>${esc(content.inclusionHeadings[i] || 'Website capability')}</h3><p>${esc(text)}</p></div></li>`).join('');
  return `<section class="los-section" id="website-inclusions" aria-labelledby="inclusions-title"><div class="los-wrap"><div class="los-section-heading"><h2 id="inclusions-title">Start with one well-considered page.</h2><p>Bring your essential information together. The current configuration is one page, shaped around your purpose. Availability and your final scope are confirmed before commitment.</p></div><div class="los-inclusions-grid"><ol class="los-inclusions">${features}</ol><aside class="los-customization"><h3>Make it feel like you.</h3><ul>${content.customization.map(item=>`<li>${esc(item)}</li>`).join('')}</ul><p>Choose within supported layouts and accessible styles. Content limits and requested changes are agreed in your scope.</p></aside></div></div></section>`;
}

export function rentalQuote(action) {
  return `<section class="los-section los-rental-band" id="rental-quote" aria-labelledby="quote-title"><div class="los-wrap los-rental-grid"><div><h2 id="quote-title">Know the scope.<br>Know the ongoing cost.</h2><p>Your quote brings the setup, recurring service and responsibilities together before you decide. No payment is collected on this page.</p>${action('Request a rental quote','../contact.html?interest=Legit%20Official%20Site','rental-quote')}</div><dl class="los-definition-rows">${rows(content.quote)}</dl></div></section>`;
}

export function rentalQuestions() {
  const questions = content.questions.map(item => `<details id="rental-${item.id}"><summary>${esc(item.question)}${chevron}</summary><div class="los-answer">${item.paragraphs.map(text=>`<p>${esc(text)}</p>`).join('')}${item.link ? `<p><a href="${esc(item.link.href)}">${esc(item.link.label)}</a></p>` : ''}</div></details>`).join('');
  return `<section class="los-section" id="ownership" aria-labelledby="questions-title"><div class="los-wrap los-questions-grid"><div><h2 id="questions-title">Clear from the start.</h2><p>Your identity is yours. The agreement explains the service around it.</p><div class="los-prepare"><h3>You bring</h3><ul>${content.customerProvides.map(item=>`<li>${check}<span>${esc(item)}</span></li>`).join('')}</ul><h3>SENZ helps shape</h3><p>The message, page structure, presentation and route from interest to action, within your agreed scope.</p></div></div><div class="los-questions"><details id="rental-rights" open><summary>What do I own, and what do I rent?${chevron}</summary><div class="los-answer"><p>Website rental is an ongoing service, not a blanket transfer of everything used to build it. The written agreement separates these responsibilities.</p><dl class="los-rights">${rows(content.rights)}</dl></div></details>${questions}<p class="los-policy-links"><a href="../terms.html">SENZ terms</a><span aria-hidden="true"> · </span><a href="../privacy.html">Privacy notice</a></p></div></div></section>`;
}
