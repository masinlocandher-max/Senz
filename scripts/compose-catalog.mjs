import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {verifySnapshot,validateContract,sellable} from './product-contract.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export function composeCatalog(){
 const read=p=>JSON.parse(fs.readFileSync(path.join(root,p)));
 const commercial=read('commercial/catalog.json');
 const technical=verifySnapshot(read('contracts/technical.snapshot.json'),'masinlocandher-max/Senzapp');
 validateContract(technical,commercial);
 const presentation=read('commercial/presentation.json');
 const plans=commercial.plans.map(p=>({key:p.key,name:p.name,segments:p.segments,seats:p.seats,selfRequest:p.self_request===1,products:p.products,pricePhp:p.price_php,includedSeats:p.includedSeats,aiCreditsPerSeat:p.ai_metering==='credits'?p.ai_units_per_seat:null,storageMb:p.storage_mb}));
 return {...presentation,schemaVersion:4,sourceRepository:technical.owner,commercialSourceRepository:commercial.owner,
   releaseState:technical.platform.productionVerified?'released':'awaiting_release',forSale:commercial.products.some(o=>sellable(technical.products.find(t=>t.entitlementId===o.entitlementId),o,technical.platform)),requestsOpen:true,checkoutEnabled:false,
   plans,products:commercial.products.filter(o=>o.publiclyExplained).map(o=>{
    const t=technical.products.find(t=>t.entitlementId===o.entitlementId),p=plans.find(p=>p.key===`buy-${o.entitlementId}`);
    const available=sellable(t,o,technical.platform),priced=o.pricing.approved;
    return {id:o.entitlementId,productId:o.id,entitlementId:o.entitlementId,publicSlug:o.publicSlug,name:o.name,category:t.category,problem:o.problem,purpose:o.purpose,audience:o.audience,segments:o.segments,includes:o.includes,limits:o.limits,summary:o.summary,
      capabilities:t.capabilities,technicalStatus:t.technicalStatus,productionVerified:t.productionVerified,lastVerifiedAt:t.lastVerifiedAt,
      pricePhp:priced?o.pricing.amount:null,priceLabel:priced?`PHP ${o.pricing.amount} per ${o.pricing.billingPeriod}`:'Request a Quote',pricingApproved:priced,quoteOnly:o.quoteOnly,
      commercialStatus:available?'purchasable':o.requestable?'requestable':'explained',purchasable:available,requestable:o.requestable,
      usesAi:t.usesAi,mode:'subscription',launchWave:1,channel:'plans',howToGet:'Request a quotation. SENZ confirms scope, delivery readiness and authorization before activation.',
      recommendedPlan:Object.fromEntries(o.segments.map(s=>[s,p?.key||null])),publicStatus:available?'available':'in_development',publicStatusLabel:available?'Available':'Not currently released',nextAction:'Request a Quote',includedSeats:p?.includedSeats||1,aiCreditsPerSeat:p?.aiCreditsPerSeat||0,storageMb:p?.storageMb||0};
   })};
}
if(process.argv[1]===fileURLToPath(import.meta.url))fs.writeFileSync(path.join(root,'components/product-catalog.json'),JSON.stringify(composeCatalog(),null,2)+'\n');
