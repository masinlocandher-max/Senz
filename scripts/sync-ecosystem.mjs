import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {snapshot,validateContract} from './product-contract.mjs';
const root=path.resolve(import.meta.dirname,'..');
const app=path.resolve(process.argv[2]||'../Senzapp');
const commercial=JSON.parse(fs.readFileSync(path.join(root,'commercial/catalog.json')));
const write=(file,value)=>{fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(value,null,2)+'\n');};
// Bootstrap the app's commercial projection before requiring its technical registry.
write(path.join(app,'contracts/commercial.snapshot.json'),snapshot('masinlocandher-max/Senz','commercial/catalog.json',commercial));
const require=createRequire(import.meta.url);
const technical=require(path.join(app,'scripts/export-technical-catalog.js')).technicalCatalog();
validateContract(technical,commercial);
write(path.join(root,'contracts/technical.snapshot.json'),snapshot('masinlocandher-max/Senzapp','src/catalog.js',technical));
console.log('Regenerated explicit technical and commercial projections. Review both repositories together.');
