(() => {
  const form = document.querySelector('#cost-planner');
  if (!form) return;
  const amount = form.querySelector('[data-cost-total]');
  const detail = form.querySelector('[data-cost-detail]');
  const difference = form.querySelector('[data-cost-difference]');
  const error = form.querySelector('[data-cost-error]');
  const action = form.querySelector('[data-cost-action]');
  const pesos = n => '₱' + n.toLocaleString('en-PH', {maximumFractionDigits:2});
  fetch('components/product-catalog.json').then(r => { if (!r.ok) throw Error(); return r.json(); }).then(catalog => {
    function update() {
      const selected = [...form.querySelectorAll('[name=tools]:checked')].map(x => x.value);
      const seats = form.elements.namedUsers.value === '' ? NaN : Number(form.elements.namedUsers.value);
      const current = form.elements.currentSpend.value.trim();
      const result = window.SENZCosts.calculate(catalog, selected, seats, current === '' ? null : Number(current));
      error.textContent = result.error || '';
      action.hidden = Boolean(result.error) || !selected.length;
      if (result.error) { amount.textContent = '—'; detail.textContent = 'Check your entries.'; difference.textContent = ''; return; }
      amount.textContent = pesos(result.total);
      detail.textContent = selected.length ? `per month · ${selected.length} ${selected.length === 1 ? 'tool' : 'tools'} · ${seats} named ${seats === 1 ? 'user' : 'users'}` : 'Select the tools you need.';
      difference.textContent = result.difference == null ? 'Add your current monthly spend to compare the totals.' : result.difference === 0 ? 'The monthly totals are the same.' : `${pesos(Math.abs(result.difference))} ${result.difference > 0 ? 'less' : 'more'} per month than the amount you entered.`;
      if (selected.length === 1) { action.href = 'purchase.html?' + new URLSearchParams({product:selected[0],seats:String(seats)}); action.textContent = 'Request this tool'; }
      else { action.href = 'contact.html?' + new URLSearchParams({planner:'1', tools:selected.join(','), seats:String(seats)}); action.textContent = 'Discuss these tools'; }
    }
    form.addEventListener('input', update);
    form.addEventListener('submit', event => event.preventDefault());
    form.querySelector('fieldset').disabled = false;
    update();
  }).catch(() => { amount.textContent = '—'; detail.textContent = 'Price planner unavailable.'; error.textContent = 'Please use the published prices above or contact SENZ.'; action.hidden = true; });
})();
