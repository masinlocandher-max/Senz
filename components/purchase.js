(() => {
  const form=document.querySelector('#product-request');
  const select=form.elements.productKey, seats=form.elements.seats, summary=document.querySelector('#offer-summary');
  let catalog;
  const button=form.querySelector('[type=submit]'); button.disabled=true;
  function update(){
    const p=catalog.products.find(x=>x.id===select.value);
    summary.replaceChildren();
    if(!p){summary.textContent='Choose a product to see your scope and price.';button.disabled=true;return;}
    const n=Number(seats.value), valid=Number.isSafeInteger(n)&&n>0&&n<=10000;
    const total=valid?p.pricePhp*n:null;
    const strong=document.createElement('strong');strong.textContent=p.name;
    const text=document.createElement('p');text.textContent=total===null?'Enter a valid number of seats.':`PHP ${total.toLocaleString('en-PH')}/month for ${n} named seat(s) in one workspace. ${p.storageMb} MB storage per workspace${p.usesAi?`; ${p.aiCreditsPerSeat} AI credits per seat each calendar month`:''}.`;
    const limits=document.createElement('p');limits.textContent=p.limits;
    summary.append(strong,text,limits);button.disabled=!valid;
    form.dataset.productName=p.name; form.dataset.monthlyTotal=total===null?'':String(total); form.dataset.releaseState=catalog.releaseState;
  }
  fetch('components/product-catalog.json').then(r=>{if(!r.ok)throw Error('catalog');return r.json();}).then(c=>{
    catalog=c;const q=new URLSearchParams(location.search),id=q.get('product');
    if(id&&c.products.some(p=>p.id===id))select.value=id;
    select.addEventListener('change',update);seats.addEventListener('input',update);form.addEventListener('reset',()=>setTimeout(update,0));
    window.SENZForms.bind(form);update();
  }).catch(()=>{summary.textContent='The current price list could not load. Please reload or email info.senz.pr@gmail.com. No request has been submitted.';});
})();
