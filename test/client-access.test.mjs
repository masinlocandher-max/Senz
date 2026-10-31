import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { clientAccessPresentation } from '../scripts/client-access.mjs';
const contract = JSON.parse(readFileSync(new URL('../function.json', import.meta.url)));
test('client entrance provides support without linking to an unreleased app', () => {
  const pending = clientAccessPresentation({...contract,app:{...contract.app,released:false}});
  assert.doesNotMatch(pending, /href="https:\/\/app\.senzpr\.com/);
  assert.match(pending, /Public app access and installation are not open yet/);
  for(const route of ['request','workspace','install']) assert.ok(pending.includes(`id="${route}"`));
  for(const topic of ['request','access','install']) assert.ok(pending.includes(`client=${topic}`));
  assert.match(pending, /submitted form does not create an app account/);
});
test('client sign-in and install links appear only for the verified release contract', () => {
  const live=clientAccessPresentation({...contract,app:{...contract.app,released:true}});
  assert.match(live,/href="https:\/\/app\.senzpr\.com\/login"/);
  assert.match(live,/href="https:\/\/app\.senzpr\.com\/install"/);
  assert.throws(()=>clientAccessPresentation({...contract,app:{released:true,plannedHost:'unverified.example'}}),/verified app host/);
});
