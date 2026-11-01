(() => {
  const form = document.querySelector('#product-request');
  const select = form.elements.productKey;
  const seats = form.elements.seats;
  const summary = document.querySelector('#offer-summary');
  const button = form.querySelector('[type=submit]');
  let catalog;
  button.disabled = true;

  function update() {
    const product = catalog.products.find(p => p.id === select.value);
    summary.replaceChildren();
    if (!product) {
      summary.textContent = 'Choose a product to see its price and scope.';
      button.disabled = true;
      return;
    }
    const count = window.SENZDiscovery.seatCount(seats.value);
    const total = count && product.pricePhp!=null ? product.pricePhp * count : null;
    const title = document.createElement('strong');
    title.textContent = product.name;
    const text = document.createElement('p');
    text.textContent = total===null && count ? `Request a Quote for ${count} named user(s). Scope, fees and activation are confirmed before payment.` : count ? `₱${total.toLocaleString('en-PH')}/month for ${count} named ${count === 1 ? 'user' : 'users'} in one workspace. ${product.storageMb.toLocaleString('en-PH')} MB storage per workspace.` +
      (product.usesAi ? ` ${product.aiCreditsPerSeat} processing credits per named user each month.` : '') : 'Enter a seat count from 1 to 10,000 to see the monthly total.';
    const limits = document.createElement('p'); limits.textContent = product.limits;
    summary.append(title, text, limits);
    button.disabled = !count;
    form.dataset.productName = product.name;
    form.dataset.monthlyTotal = total === null ? '' : String(total);
    form.dataset.releaseState = catalog.releaseState;
  }

  fetch('components/product-catalog.json').then(r => { if (!r.ok) throw Error(); return r.json(); }).then(c => {
    catalog = c;
    const query = new URLSearchParams(location.search);
    const id = query.get('product');
    if (id && c.products.some(p => p.id === id)) select.value = id;
    const handoff = window.SENZDiscovery.readHandoff(location.search, 'product', c);
    if (handoff) {
      seats.value = handoff.seats ?? '';
      form.elements.message.value = handoff.message;
      form.elements.timeline.value = handoff.timeline;
    } else if (select.value && window.SENZDiscovery.seatCount(query.get('seats'))) {
      seats.value = Number(query.get('seats'));
    }
    select.addEventListener('change', update);
    seats.addEventListener('input', update);
    form.addEventListener('reset', () => setTimeout(update, 0));
    window.SENZForms.bind(form);
    update();
    if (id && !select.value) summary.textContent = 'That product is unavailable. Choose a listed product to request pricing and availability.';
  }).catch(() => {
    summary.textContent = 'The price list could not load. Reload this page or email info.senz.pr@gmail.com.';
    button.disabled = true;
  });
})();
