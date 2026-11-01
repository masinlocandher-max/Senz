import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const pages=['legit-official-site/index.html',...fs.readdirSync(root).filter(x=>x.endsWith('.html')),...fs.readdirSync(root+'/products').map(x=>'products/'+x)];
const sitemap=fs.readFileSync(root+'/sitemap.xml','utf8');
const contents=new Map(pages.map(file=>[file,fs.readFileSync(root+'/'+file,'utf8')]));
test('every public page has a unique title, description, one heading and canonical sitemap entry',()=>{
 const titles=new Set();
 for(const [file,html]of contents){
  const title=html.match(/<title>(.*?)<\/title>/s)?.[1];assert.ok(title,file);assert.ok(!titles.has(title),file+' duplicate title');titles.add(title);
  assert.match(html,/<meta\s+name="description"\s+content="[^" ]/i,file);
  assert.equal((html.match(/<h1(?:\s|>)/g)||[]).length,1,file);
  const ids = [...html.matchAll(/\sid=["']([^"']+)["']/g)].map(match => match[1]);
  assert.equal(new Set(ids).size, ids.length, file+' duplicate element ID');
  // The not-found page is served at any missing address: it must not be indexed or listed.
  if(file==='404.html'){assert.match(html,/<meta name="robots" content="noindex"/);assert.ok(!/rel="canonical"/.test(html));assert.ok(!sitemap.includes('404.html'));continue;}
  const canonical=html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i)?.[1];assert.ok(canonical?.startsWith('https://www.senzpr.com/'),file);assert.ok(sitemap.includes(canonical),file+' sitemap');
  for(const match of html.matchAll(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g))assert.doesNotThrow(()=>JSON.parse(match[1]),file);
 }
});
test('local page and component links resolve, including named anchors',()=>{
 for(const [file,html]of contents)for(const m of html.matchAll(/(?:href|src)="([^"]+)"/g)){
  if(/^(https?:|mailto:|tel:|data:|javascript:)/.test(m[1]))continue;
  const url=new URL(m[1].replaceAll('&amp;','&'),'https://www.senzpr.com/'+file);
  let target=decodeURIComponent(url.pathname.slice(1))||'index.html'; if(target.endsWith('/')) target+='index.html';
  assert.ok(fs.existsSync(root+'/'+target),file+' -> '+target);
  if(url.hash&&contents.has(target)){
    const id=decodeURIComponent(url.hash.slice(1));assert.ok(contents.get(target).includes(`id="${id}"`)||contents.get(target).includes(`id='${id}'`),file+' -> '+target+url.hash);
  }
 }
});
test('product pages preserve catalog prices, scope and pending release status',()=>{
 const c=JSON.parse(fs.readFileSync(root+'/components/product-catalog.json','utf8'));
 for(const p of c.products){const html=contents.get('products/'+p.id+'.html');assert.ok(html,p.id);assert.ok(html.includes('purchase.html?product='+p.id));assert.ok(html.includes(p.pricePhp.toLocaleString('en-PH')));assert.ok(html.includes('What is outside the scope'));if(!c.forSale)assert.ok(!html.includes('"@type":"Offer"'),p.id+' premature offer');}
});

test('removed music and photo products cannot reappear as offers',()=>{
 const c=JSON.parse(fs.readFileSync(root+'/components/product-catalog.json','utf8'));
 assert.equal(c.products.length,13);
 for(const key of ['fotolab','music-platform']){
  assert.ok(!c.products.some(p=>p.id===key));assert.ok(!c.plans.some(p=>p.products.includes(key)));
  assert.ok(!fs.existsSync(root+'/products/'+key+'.html'));assert.ok(!sitemap.includes('/products/'+key+'.html'));
  assert.ok(!contents.get('purchase.html').includes('value="'+key+'"'));
  for(const file of ['llms.txt','llms-full.txt'])assert.ok(!fs.readFileSync(root+'/'+file,'utf8').includes('/products/'+key+'.html'));
 }
});
test('no page or stylesheet loads a font from an outside provider',()=>{
 const files=[...pages,...fs.readdirSync(root+'/components').filter(x=>x.endsWith('.css')).map(x=>'components/'+x)];
 for(const file of files)assert.doesNotMatch(fs.readFileSync(root+'/'+file,'utf8'),/fonts\.(googleapis|gstatic)\.com/,file);
});
