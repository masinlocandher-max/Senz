// The five requested perspectives, real inquiry handler and isolated delivery provider.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const data = require('../../components/legit-official-site.json');
const personas = [
 ['myself',['about','channels'],'decide','Personal site'],
 ['profession',['work','services','contact'],'existing','Professional site'],
 ['business',['products','location','order'],'senz','Business site'],
 ['company',['about','quote'],'custom','Company site'],
 ['other',['contact'],'decide','Personal site']
];
(async()=>{
 const delivered=[]; let providerUp=true;
 const delivery=http.createServer((req,res)=>{let text='';req.on('data',c=>text+=c);req.on('end',()=>{if(providerUp)delivered.push(JSON.parse(text));res.writeHead(providerUp?200:503,{'Content-Type':'application/json'});res.end(JSON.stringify({success:providerUp}));});});
 await new Promise(r=>delivery.listen(0,'127.0.0.1',r));
 process.env.SENZ_FORM_DELIVERY_ENDPOINT=`http://127.0.0.1:${delivery.address().port}`;
 process.chdir(path.resolve(__dirname,'../..'));
 const {server}=require('../../server'); await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const base=`http://127.0.0.1:${server.address().port}`;
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||undefined}); const errors=[];
 try {
  for(const width of [320,390,768,1440]) {
   const context=await browser.newContext({viewport:{width,height:900},reducedMotion:width===1440?'no-preference':'reduce'});
   await context.addInitScript(api=>window.SENZ_API_BASE_URL=api,base);
   const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
   await page.goto(base+'/legit-official-site/'); await page.waitForSelector('.los-choice');
   assert.equal(await page.locator('h1').innerText(),'Your website.\nYour space.\nYour rules.');
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${width}: overflow`);
   await page.addScriptTag({path:require.resolve('axe-core/axe.min.js')});
   let violations=await page.evaluate(async()=>(await axe.run(document,{runOnly:['wcag2a','wcag2aa','wcag21a','wcag21aa']})).violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)})));
   assert.deepEqual(violations,[],`${width}: accessibility`);
   for(const kind of Object.keys(data.configurations)) {
    await page.locator(`[data-example="${kind}"]`).click();
    assert.equal(await page.locator(`[data-example-panel="${kind}"]`).isVisible(),true);
    assert.equal(await page.locator('[data-example-panel]:visible').count(),1);
   }
   if(width===390) {
    for(const [audience,goals,domain,name] of personas) {
     await page.goto(base+'/legit-official-site/');
     await page.locator('.los-choice').filter({hasText:data.audiences[audience].label}).first().click();
     await page.getByRole('button',{name:'Continue',exact:true}).click();
     assert.match(await page.locator('.los-error').innerText(),/Choose at least one/);
     for(const goal of goals) await page.getByLabel(data.goals[goal],{exact:true}).check();
     await page.getByRole('button',{name:'Continue',exact:true}).click();
     await page.locator('.los-choice').filter({hasText:data.domains[domain].label}).first().click();
     assert.equal(await page.locator('#website-selector h2').innerText(),name);
     if(goals.includes('order')) assert.match(await page.locator('#website-selector').innerText(),/not included or available for instant activation/);
     await page.reload(); assert.equal(await page.locator('#website-selector h2').innerText(),name,'result survives refresh');
     await page.getByRole('link',{name:'Request my website quote'}).click();
     await page.waitForSelector('.los-contact-summary');
     assert.equal(await page.locator('[name=inquiryType]').inputValue(),'Legit Official Site');
     assert.match(await page.locator('[name=message]').inputValue(),new RegExp(name));
     await page.locator('input[name=name]').fill('Website QA Visitor');
     await page.locator('input[name=email]').fill('website-qa@example.com');
     await page.locator('[name=timeline]').selectOption('Exploring only');
     assert.equal(await page.locator('[name=budget]').getAttribute('required'),null);
     assert.equal(await page.locator('[name=organization]').getAttribute('required'),null);
     await page.locator('input[name=privacyConsent]').check();
     await page.waitForTimeout(1300); const count=delivered.length;
     await page.locator('form[data-senz-form] button[type=submit]').click();
     await page.waitForFunction(()=>/received|accepted for delivery|thank/i.test(document.querySelector('form[data-senz-form] .form-status,form[data-senz-form] .status')?.textContent||''));
     assert.equal(delivered.length,count+1);
     assert.match(JSON.stringify(delivered.at(-1)),/Legit Official Site/);
    }
    providerUp=false;
    await page.goto(base+'/contact.html?interest=Legit%20Official%20Site');
    await page.locator('input[name=name]').fill('Delivery failure QA');await page.locator('input[name=email]').fill('qa@example.com');
    await page.waitForSelector('.los-contact-summary');
    await page.locator('[name=timeline]').selectOption('Exploring only');
    await page.locator('[name=message]').fill('Test only: prepare a personal website.');await page.locator('[name=privacyConsent]').check();
    await page.waitForTimeout(1300);await page.locator('form[data-senz-form] button[type=submit]').click();
    await page.waitForFunction(()=>/could not submit|Unable to deliver/.test(document.querySelector('form[data-senz-form] .form-status,form[data-senz-form] .status')?.textContent||''));
    assert.equal(await page.locator('[name=message]').inputValue(),'Test only: prepare a personal website.');providerUp=true;
   }
   await context.close();
  }
  assert.deepEqual(errors,[]);assert.equal(delivered.length,5);
  console.log('Legit Official Site: five personas delivered to isolated provider; four viewport widths; examples, refresh, validation, privacy, provider failure and accessibility passed.');
 } finally {await browser.close();await new Promise(r=>server.close(r));await new Promise(r=>delivery.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
