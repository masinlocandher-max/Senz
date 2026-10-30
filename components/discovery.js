(() => {
 const host=document.querySelector('#discovery');let catalog,step=0;const answers={};
 const audiences=[['myself','Myself'],['professional','My profession / personal brand'],['business','My business'],['organization','My company / organization'],['education','My school / educational institution'],['government','My government office / public institution'],['other','Something else']];
 const el=(tag,text,cls)=>{const e=document.createElement(tag);if(text)e.textContent=text;if(cls)e.className=cls;return e;};
 const link=(text,href)=>{const a=el('a',text,'button');a.href=href;return a;};
 function choose(title,options,onPick){host.append(el('h2',title));const grid=el('div',null,'choice-grid');for(const [key,label]of options){const b=el('button',label,'choice');b.type='button';b.onclick=()=>onPick(key);grid.append(b);}host.append(grid);}
 function render(){host.replaceChildren();host.append(el('p',step<3?`Step ${step+1} of 3`:'Your recommended next step','discovery-progress'));
  if(step===0)choose('Who is this for?',audiences,v=>{answers.segment=v;step=1;render();});
  if(step===1)choose('How would you like SENZ to help?', [['software','I want software I can use'],['services','I want SENZ to do the work with me'],['unsure','Help me decide']],v=>{answers.route=v;step=2;render();});
  if(step===2){const products=catalog.products.filter(p=>answers.segment==='other'||p.segments.includes(answers.segment));const choices=answers.route==='services'?[['strategy','Clarify my brand, message or reputation'],['website','Build or improve my website'],['campaign','Plan a campaign, PR or creative project'],['other','Discuss something else']]:[...products.map(p=>[p.id,p.problem]),['other','Something else / I am not sure']];choose('What would you like to improve?',choices,v=>{answers.need=v;step=3;render();});}
  if(step===3){const p=catalog.products.find(x=>x.id===answers.need);host.append(el('h2','Your Recommended SENZ Solution'));
   if(p){host.append(el('p',p.problem),el('h3',p.name),el('p',p.purpose),el('p',`Why this fits: you selected a need this product is built to address. Start with this one product; a larger bundle is optional.`));const list=el('ul');p.includes.forEach(x=>list.append(el('li',x)));host.append(list,el('p',`Scope limits: ${p.limits}`),el('p',`PHP ${p.pricePhp.toLocaleString('en-PH')}/month for one named seat. SENZ confirms availability before payment.`),link('Review product and pricing',`products/${p.id}.html`),link('Request this product',`purchase.html?product=${p.id}`));}
   else host.append(el('p','A scoped conversation is the useful next step. SENZ can review your goal and recommend strategic communications, creative work, a website or a custom implementation.'),link('Discuss my project','contact.html?interest='+encodeURIComponent(answers.need==='other'?'Not sure yet':answers.need)),link('Compare products','digital-products.html'));
  }
  if(step>0){const back=el('button',step===3?'Edit my answers':'Back','button');back.type='button';back.onclick=()=>{step--;render();};host.append(back);}
  const title=host.querySelector('h2');title.tabIndex=-1;if(step)title.focus();
 }
 fetch('components/product-catalog.json').then(r=>{if(!r.ok)throw Error();return r.json();}).then(c=>{catalog=c;render();}).catch(()=>{host.replaceChildren(el('p','The questionnaire could not load. You can still compare products or contact SENZ.'),link('Products','digital-products.html'),link('Contact SENZ','contact.html'));});
})();
