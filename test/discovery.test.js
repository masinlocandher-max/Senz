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
test('the public catalog contains eight descriptive products and no enabled checkout',()=>{
 const c=require('../components/product-catalog.json');assert.equal(c.products.length,8);assert.equal(c.checkoutEnabled,false);assert.equal(c.products.filter(p=>p.usesAi).length,4);
});
