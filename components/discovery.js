(() => {
  'use strict';
  const engine=window.SENZDiscovery, root=document.querySelector('#discovery');
  if(!root || !engine) return;
  const params=new URLSearchParams(location.search); let answers={}, step=-1, sent=false;
  if(engine.audiences.some(x=>x.value===params.get('audience'))) answers.audience=params.get('audience');
  if(Object.hasOwn(engine.needs,params.get('need'))) answers.need=params.get('need');
  let seedNeed=answers.need;
  const started=Date.now();
  const el=(tag,text,props={})=>Object.assign(document.createElement(tag),{textContent:text,...props});
  function metric(name) { if(document.querySelector('#measurement-consent')?.checked) window.dispatchEvent(new CustomEvent('senz:measurement',{detail:{event:name,rulesVersion:engine.VERSION}})); }
  function button(text,fn,cls='journey-button') {const b=el('button',text,{type:'button',className:cls});b.addEventListener('click',fn);return b;}
  function focusTitle(){root.querySelector('h1,h2')?.focus();}
  function render() {
    root.replaceChildren();
    if(step<0){root.append(el('p','A clearer starting point',{className:'eyebrow'}),el('h1','Let’s find what works for you.',{tabIndex:-1}),el('p','To recommend the right solution, we’ll ask a few questions about what you need and what you’re trying to achieve.'),el('p','About seven questions. No contact details needed to see your recommendation.',{className:'muted'}),button('Let’s Start',()=>{step=0;metric('discovery_started');render();}));return;}
    const qs=engine.questions(answers);
    if(step>=qs.length){showResult();return;}
    const q=qs[step]; const progress=el('progress','',{max:qs.length,value:step}); progress.setAttribute('aria-label','Discovery progress');
    root.append(el('p',`Question ${step+1} of ${qs.length}`,{className:'eyebrow'}),progress);
    const form=el('form',''); const fieldset=el('fieldset',''); const legend=el('legend',q.title); const title=el('h1',q.title,{tabIndex:-1}); title.id='question-title'; legend.className='sr-only';fieldset.append(legend); form.append(title);
    if(q.hint)form.append(el('p',q.hint,{className:'muted'}));
    if(q.text){const text=el('textarea','',{name:q.id,value:answers[q.id]||'',minLength:5,maxLength:600,required:true,rows:4});text.setAttribute('aria-labelledby','question-title');fieldset.append(text);}
    else {const cards=el('div','',{className:'answer-grid'});for(const o of q.options){const label=el('label','',{className:'answer-card'}); const radio=el('input','',{type:'radio',name:q.id,value:o.value,required:true,checked:answers[q.id]===o.value});label.append(radio,el('span',o.label));cards.append(label);}fieldset.append(cards);}
    form.append(fieldset);const controls=el('div','',{className:'journey-controls'});controls.append(button('Back',()=>{step--;render();},'journey-button secondary'),el('button',step===qs.length-1?'See My Recommendation':'Continue',{type:'submit',className:'journey-button'}));form.append(controls);
    form.addEventListener('submit',e=>{e.preventDefault();const value=new FormData(form).get(q.id); if(answers[q.id]!==value){const keep=qs.slice(0,step).map(x=>x.id);answers=Object.fromEntries(Object.entries(answers).filter(([k])=>keep.includes(k)));}answers[q.id]=String(value);if(q.id==='audience' && seedNeed){const needs=engine.questions(answers).find(x=>x.id==='need');if(needs.options.some(x=>x.value===seedNeed))answers.need=seedNeed;seedNeed=null;}sent=false;step++;render();});root.append(form);focusTitle();
  }
  function showResult(){
    const r=engine.recommend(answers); if(!r.valid){step=engine.questions(answers).findIndex(q=>r.errors.includes(q.id));render();return;}
    metric('discovery_completed');metric('recommendation_viewed');root.append(el('p','Your Recommended SENZ Solution',{className:'eyebrow'}),el('h1',r.name,{tabIndex:-1}),el('p',`The problem: ${r.challenge}`),el('p',`Your goal: ${r.outcome}`),el('p',`${r.capability} · ${r.pricing}`,{className:'result-label'}));
    if(r.purpose)root.append(el('p',`What it does: ${r.purpose}`));
    const list=(title,items)=>{root.append(el('h2',title));const ul=el('ul','');items.forEach(t=>ul.append(el('li',t)));root.append(ul);};
    list('Why this fits your answers',r.why);list(r.productId?'What it includes':'Proposed scope',r.scope);root.append(el('p','Proposed inclusions, subject to a confirmed quotation. No payment or access is granted by this recommendation.',{className:'muted'}));
    const tiers=el('div','',{className:'tier-grid'});
    if(r.plans){root.append(el('h2',r.plans.length>1?'Plans that include it':'How you would get it'));r.plans.forEach(plan=>{const card=el('article','',{className:'tier-card'+(plan.suggested?' recommended':'')});card.append(el('p',plan.suggested?'Suggested plan':'Alternative',{className:'eyebrow'}),el('h3',plan.name),el('p',plan.seats),el('p',plan.products.length?`Includes ${plan.products.join(', ')}`:'Products and terms set in the agreement'),el('p','Pricing Based on Requirements'));tiers.append(card);});}
    else {root.append(el('h2','Choose the right scope'));r.tiers.forEach((tier,i)=>{const card=el('article','',{className:'tier-card'+(tier===r.suggestedTier?' recommended':'')});card.append(el('p',tier===r.suggestedTier?'Suggested starting scope':'Alternative scope',{className:'eyebrow'}),el('h3',tier),el('p',i===0?'Start with one defined need and only the relevant inclusions above.':i===1?'Expand to more users or workflows only where your requirements justify it.':'Review specialized integrations, permissions, and implementation requirements.'),el('p','Pricing Based on Requirements'));tiers.append(card);});}
    root.append(tiers);
    root.append(el('h2','Before you commit'),el('p',r.limitations),el('p',r.availability));list('What SENZ will confirm',r.informationGaps);if(r.humanReviewRequired)root.append(el('p','This recommendation is provisional and requires human review.',{className:'review-note'}));
    if(r.deliveredThrough){const p=el('p',`Delivered through ${r.deliveredThrough.name}: ${r.deliveredThrough.purpose} `);p.append(el('a','About Client Portal',{href:`ai-systems.html#${r.deliveredThrough.id}`}));root.append(p);}
    if(r.productId){const a=el('a','View Product Details',{href:`ai-systems.html#${r.productId}`,className:'text-link'});root.append(a);}
    root.append(button('Review or edit answers',()=>{step=0;render();},'journey-button secondary'),button('Start again',()=>{answers={};step=-1;sent=false;render();},'journey-button secondary'));
    root.append(el('h2',r.nextAction),el('p','Your answers and recommendation will accompany your inquiry. Please leave out confidential documents or sensitive personal information.'));
    const form=el('form','',{className:'lead-form'});function input(label,name,type='text',required=true){const l=el('label',label);const i=el('input','',{name,type,required,maxLength:180});l.append(i);form.append(l);}
    input('Your name','name');input('Email address','email','email');input('Organization (optional)','organization','text',false);
    const consentLabel=el('label','',{className:'consent'}),consent=el('input','',{type:'checkbox',required:true,name:'consent'});consentLabel.append(consent,document.createTextNode('I agree that SENZ may use these details and answers to respond to this inquiry. '),el('a','Read the Privacy Notice',{href:'privacy.html',target:'_blank',rel:'noopener'}));form.append(consentLabel);
    const trap=el('input','',{name:'senzWebsite',tabIndex:-1,autocomplete:'off',className:'honeypot'});trap.setAttribute('aria-hidden','true');form.append(trap);
    const submit=el('button',r.nextAction,{type:'submit',className:'journey-button'}),status=el('p','');status.setAttribute('role','status');form.append(submit,status);root.append(form);
    form.addEventListener('submit',async e=>{e.preventDefault();if(sent)return;submit.disabled=true;status.textContent='Submitting your inquiry…';const values=Object.fromEntries(new FormData(form));const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),20000);
      try {const base=String(window.SENZ_API_BASE_URL||location.origin).replace(/\/$/,'');const response=await fetch(`${base}/api/inquiries`,{method:'POST',headers:{'Content-Type':'application/json'},signal:controller.signal,body:JSON.stringify({formType:'discovery',name:values.name,email:values.email,brand:values.organization,projectType:r.name,message:r.challenge,discovery:answers,discoveryVersion:engine.VERSION,consent:true,consentVersion:'discovery-2026-10-27',formStartedAt:started,senzWebsite:values.senzWebsite})});const body=await response.json();if(!response.ok||body.ok!==true)throw Error('delivery');sent=true;status.textContent=`Inquiry submitted. Reference: ${body.id}. SENZ will review your scope and respond by email. Your recommendation remains above.`;metric(r.nextAction==='Submit an Institutional Inquiry'?'institutional_inquiry':'quote_requested');}
      catch {status.textContent='We could not confirm delivery. Your recommendation is still here. Please retry or email info.senz.pr@gmail.com.';submit.disabled=false;}
      finally{clearTimeout(timer);}
    });focusTitle();
  }
  render();
})();
