const test=require('node:test'),assert=require('node:assert/strict');
const engine=require('../components/discovery-engine');const {buildInquiry,safeStaticPath}=require('../server');
function answers(audience,need,extra={}){const a={audience,need,...extra};for(const q of engine.questions(a)){if(!a[q.id])a[q.id]=q.text?'An unusual situation requiring a human review.':q.options[0].value;}return a;}
for(const {value:audience} of engine.audiences)test(`complete ${audience} journey produces an explained quote-based offer`,()=>{
 const a=answers(audience,engine.questions({audience})[1].options[0].value);const r=engine.recommend(a);
 assert.equal(r.valid,true);assert.ok(r.name&&r.scope.length&&r.why.length);assert.equal(r.pricing,'Pricing Based on Requirements');assert.ok(r.nextAction);assert.equal('price' in r,false);assert.ok(engine.questions(a).length<=8);
});
test('individual writing does not upsell branding; professional help does not force AI',()=>{
 assert.equal(engine.recommend(answers('myself','writing',{requirements:'self'})).productId,'ai-workspace');
 assert.equal(engine.recommend(answers('myself','writing',{requirements:'managed'})).productId,null);
 assert.equal(engine.recommend(answers('professional','visibility')).capability,'Strategic Communications');
});
test('school and government recommendations require human review and flag information gaps',()=>{
 for(const audience of ['education','government']){const r=engine.recommend(answers(audience,'institutional',{scale:'unknown'}));assert.equal(r.humanReviewRequired,true);assert.ok(r.informationGaps.includes('Number of users'));assert.match(r.limitations,/need not pay personally/);}
});
test('incomplete answers and cross-route answer injection cannot receive a confident offer',()=>{
 assert.equal(engine.recommend({audience:'myself'}).valid,false);assert.equal(engine.recommend(answers('myself','institutional')).valid,false);
});
test('inquiry backend recomputes recommendations and preserves the actual answers',()=>{
 const a=answers('business','website');const {inquiry,errors}=buildInquiry({formType:'discovery',name:'Test',email:'test@example.com',discovery:a,discoveryVersion:engine.VERSION,consent:true,projectType:'Free unlimited AI',message:'Manipulated',fields:{tier:'Unlimited',price:0}});
 assert.deepEqual(errors,[]);assert.equal(inquiry.projectType,'SENZ Digital Presence');assert.deepEqual(JSON.parse(inquiry.details['Discovery answers']),a);assert.equal(inquiry.details.price,undefined);assert.equal(inquiry.details['Quote status'],'New inquiry; no price or entitlement granted');
 assert.ok(buildInquiry({formType:'discovery',name:'Test',email:'test@example.com',discovery:a}).errors.length);
});
test('backend never serves source, environment, Git history or encoded traversal',()=>{
 for(const p of ['/.env','/.env.production','/.git/config','/server.js','/test/server.test.js','/package.json','/assets/../server.js','/%2eenv','/%zz','/components/%2e%2e/server.js'])assert.equal(safeStaticPath(p),null,p);
 assert.ok(safeStaticPath('/get-started.html'));assert.ok(safeStaticPath('/components/discovery-engine.js'));
});
test('the public catalog contains six descriptive products and no enabled checkout',()=>{
 const c=require('../components/product-catalog.json');assert.equal(c.products.length,6);assert.equal(c.checkoutEnabled,false);assert.equal(c.products.filter(p=>p.usesAi).length,4);
});
test('every audience, from one person to a government office, can pick a first-release problem with a plan',()=>{
 const c=require('../components/product-catalog.json');
 for(const {value:audience} of engine.audiences){if(audience==='other')continue;
  const first=engine.routes[audience].map(n=>engine.productNeeds[n]).filter(Boolean).map(id=>c.products.find(p=>p.id===id)).filter(p=>p.launchWave===1&&p.channel==='plans');
  assert.ok(first.length>=2,`${audience} has first-release products`);
  for(const p of first){const r=engine.recommend(answers(audience,Object.keys(engine.productNeeds).find(n=>engine.productNeeds[n]===p.id),{requirements:engine.questions({audience,need:'writing'}).find(q=>q.id==='requirements').options.find(o=>!['integration','sensitive'].includes(o.value)).value,current:'manual'}));
   const plan=c.plans.find(x=>x.name===r.suggestedTier);assert.ok(plan&&plan.selfRequest&&plan.products.includes(p.id)&&plan.segments.includes(audience),`${audience}: ${p.id} suggests ${r.suggestedTier}`);}
 }
});
test('a product is offered only to the audiences it serves, and every audience it serves can reach it',()=>{
 const c=require('../components/product-catalog.json');
 for(const p of c.products){
  const need=Object.keys(engine.productNeeds).find(n=>engine.productNeeds[n]===p.id);
  if(p.channel==='services'){assert.equal(need,undefined,'Client Portal comes with SENZ services');continue;}
  for(const {value:audience} of engine.audiences){if(audience==='other')continue;assert.equal(engine.routes[audience].includes(need),p.segments.includes(audience),`${p.id} for ${audience}`);}
 }
 for(const {value:audience} of engine.audiences)for(const need of engine.routes[audience])for(const outcome of engine.questions({audience,need}).find(q=>q.id==='outcome').options){
  const r=engine.recommend(answers(audience,need,{outcome:outcome.value}));assert.equal(r.valid,true);
  if(r.productId&&audience!=='other')assert.ok(c.products.find(p=>p.id===r.productId).segments.includes(audience),`${audience}/${need} recommends ${r.productId}`);
  assert.notEqual(r.productId,'client-portal','Client Portal is never sold as a product');
  if(audience==='myself')assert.ok(!r.tiers.includes('Custom Implementation Contract'),'individuals are not pointed to contracts');
 }
});
test('institutions serve students through Digital Assistant and staff through AI Workspace, on the Institutional License',()=>{
 for(const audience of ['organization','education','government']){
  const students=engine.recommend(answers(audience,'institutional',{outcome:'student',current:'manual',requirements:'unknown'}));
  const staff=engine.recommend(answers(audience,'institutional',{outcome:'faculty',current:'manual',requirements:'unknown'}));
  assert.equal(students.productId,'digital-assistant');assert.equal(staff.productId,'ai-workspace');
  assert.equal(students.suggestedTier,'Institutional License');assert.ok(students.plans.some(p=>p.name==='Institutional License'&&p.suggested));
 }
});
test('institutions can give students their own seats on the Institutional License; they never pay personally',()=>{
 for(const audience of ['organization','education','government']){
  const r=engine.recommend(answers(audience,'institutional',{outcome:'learners',current:'manual',requirements:'unknown'}));
  assert.equal(r.valid,true);assert.equal(r.productId,'ai-workspace');assert.equal(r.suggestedTier,'Institutional License');
  assert.match(r.limitations,/assigned seats/);assert.match(r.limitations,/Students and employees need not pay personally/);
  assert.ok(!r.plans.some(p=>p.name==='Individual'),'students are not sent to a personal plan');
 }
});
test('client delivery is a SENZ service, and service work names Client Portal',()=>{
 const r=engine.recommend(answers('business','portal'));assert.equal(r.productId,null);assert.equal(r.name,'SENZ Client Delivery Setup');assert.match(r.limitations,/not offered as a portal for your own clients/);assert.equal(r.deliveredThrough.id,'client-portal');
 assert.equal(engine.recommend(answers('business','unsure')).deliveredThrough,null);
 assert.equal(engine.recommend(answers('business','communications',{requirements:'managed'})).productId,null);
});
