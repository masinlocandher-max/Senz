const test = require('node:test');
const assert = require('node:assert/strict');
const { calculate } = require('../components/cost-model');
const catalog = require('../components/product-catalog.json');

test('cost planner uses each selected product once and multiplies by named seats', () => {
  assert.deepEqual(calculate(catalog, ['qr-menu','booking','qr-menu'], 3, 6000), {
    total:5340, seats:3, ids:['qr-menu','booking'], difference:660
  });
  assert.equal(calculate(catalog,['crm'],2,2000).difference,-580);
  assert.equal(calculate(catalog,['crm'],1,1290).difference,0);
  assert.equal(calculate(catalog,['crm'],1,null).difference,null);
  assert.equal(calculate(catalog,[],1,1000).difference,null);
});
test('cost planner rejects unknown and removed products and invalid numeric inputs', () => {
  for (const key of ['fotolab','music-platform','missing']) assert.ok(calculate(catalog,[key],1,null).error);
  for (const seats of [0,-1,1.5,10001,NaN,Infinity]) assert.ok(calculate(catalog,['booking'],seats,null).error);
  for (const spend of [-1,NaN,Infinity,1000000001]) assert.ok(calculate(catalog,['booking'],1,spend).error);
});
