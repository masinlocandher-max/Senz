import assert from 'node:assert/strict';
import { copyFileSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { checkSource } from '../scripts/check-source.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function fixture(t) {
  const directory = mkdtempSync(path.join(os.tmpdir(), 'senz-source-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  for (const file of ['source-of-truth.json', 'package.json', 'CNAME', 'index.html', '.nojekyll']) {
    copyFileSync(path.join(root, file), path.join(directory, file));
  }
  return directory;
}

test('the committed standalone source contract is consistent', () => {
  assert.equal(checkSource(root, {}).repository, 'masinlocandher-max/Senz');
});

test('the canonical GitHub checkout is accepted without restricting review branches', () => {
  assert.doesNotThrow(() => checkSource(root, { GITHUB_REPOSITORY: 'masinlocandher-max/Senz', GITHUB_REF: 'refs/heads/review' }));
});

test('a monorepo GitHub checkout is rejected', () => {
  assert.throws(() => checkSource(root, { GITHUB_REPOSITORY: 'masinlocandher-max/FMB-Ecosystem' }), /GitHub checkout/);
});

test('a monorepo Vercel checkout is rejected', () => {
  assert.throws(() => checkSource(root, { VERCEL_GIT_REPO_OWNER: 'masinlocandher-max', VERCEL_GIT_REPO_SLUG: 'FMB-Ecosystem' }), /Vercel checkout/);
});

test('a mismatched CNAME is rejected', t => {
  const directory = fixture(t);
  writeFileSync(path.join(directory, 'CNAME'), 'example.com\n');
  assert.throws(() => checkSource(directory, {}), /CNAME mismatch/);
});

test('a monorepo source directory is rejected', t => {
  const directory = fixture(t);
  const file = path.join(directory, 'source-of-truth.json');
  const contract = JSON.parse(readFileSync(file, 'utf8'));
  contract.sourceRoot = 'apps/senz';
  writeFileSync(file, JSON.stringify(contract));
  assert.throws(() => checkSource(directory, {}), /standalone repository root/);
});

test('missing static entrypoints are rejected', t => {
  const directory = fixture(t);
  rmSync(path.join(directory, 'index.html'));
  assert.throws(() => checkSource(directory, {}), /Missing standalone publishing file/);
});
