/* Public list prices only. This comparison is not a quote or a claim of equivalent features. */
(() => {
  function calculate(catalog, selected, seats, currentSpend) {
    if (!Number.isInteger(seats) || seats < 1 || seats > 10000) return { error: 'Enter 1 to 10,000 named users.' };
    const ids = [...new Set(selected)];
    const products = ids.map(id => catalog.products.find(p => p.id === id));
    if (products.some(p => !p || (p.pricePhp !== null && (!Number.isFinite(p.pricePhp) || p.pricePhp < 0)))) return { error: 'Choose products from the published catalog.' };
    if (currentSpend != null && (!Number.isFinite(currentSpend) || currentSpend < 0 || currentSpend > 1000000000)) return { error: 'Enter a monthly cost between ₱0 and ₱1,000,000,000, or leave it blank.' };
    if(products.some(p=>p.pricePhp===null)) return {total:null,seats,ids,difference:null,quoteRequired:true};
    const total = products.reduce((sum, p) => sum + p.pricePhp * seats, 0);
    return { total, seats, ids, difference: currentSpend == null || !ids.length ? null : currentSpend - total };
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = { calculate };
  else window.SENZCosts = { calculate };
})();
