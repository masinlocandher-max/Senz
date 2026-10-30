import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), '..');
const repository = 'masinlocandher-max/Senz';

// Validate committed source ownership. This does not query or mutate a host.
export function checkSource(root = projectRoot, env = process.env) {
  const readJson = name => JSON.parse(readFileSync(path.join(root, name), 'utf8'));
  const contract = readJson('source-of-truth.json');
  const pkg = readJson('package.json');
  assert.equal(contract.repository, repository, 'SENZ must use its standalone repository.');
  assert.equal(contract.productionBranch, 'main', 'Production branch must be main.');
  assert.equal(contract.sourceRoot, '.', 'Build from the standalone repository root.');
  assert.equal(contract.canonicalDomain, 'www.senzpr.com', 'Canonical domain mismatch.');
  assert.deepEqual(contract.domains, ['www.senzpr.com', 'senzpr.com'], 'Domain ownership mismatch.');
  assert.equal(contract.publisher, 'github-pages', 'Review an intentional hosting migration before changing the publisher.');
  assert.equal(contract.appRepository, 'masinlocandher-max/Senzapp', 'The licensed app must stay in the private Senzapp repository.');
  assert.equal(contract.appReleased, false, 'Do not mark the app released from the website repository.');
  assert.equal(contract.functionContract, 'function.json', 'function.json is the shared website and app contract.');
  const roles = readJson('function.json');
  assert.equal(roles.website.repository, repository, 'Website function must name this repository.');
  assert.equal(roles.app.repository, contract.appRepository, 'App function must name Senzapp.');
  assert.equal(roles.app.released, false, 'function.json must not claim the app is released.');
  assert.equal(roles.products.length, 15, 'The contract lists the SENZ app products.');
  assert.equal(pkg.repository?.url, `https://github.com/${repository}.git`, 'Package repository mismatch.');
  assert.equal(pkg.homepage, `https://${contract.canonicalDomain}`, 'Package homepage mismatch.');
  assert.equal(readFileSync(path.join(root, 'CNAME'), 'utf8').trim(), contract.canonicalDomain, 'CNAME mismatch.');
  for (const file of ['index.html', '.nojekyll']) {
    assert.ok(existsSync(path.join(root, file)), `Missing standalone publishing file: ${file}`);
  }
  if (env.GITHUB_REPOSITORY) {
    assert.equal(env.GITHUB_REPOSITORY.toLowerCase(), repository.toLowerCase(), 'GitHub checkout is not the canonical SENZ repository.');
  }
  if (env.VERCEL_GIT_REPO_OWNER && env.VERCEL_GIT_REPO_SLUG) {
    const vercelSource = `${env.VERCEL_GIT_REPO_OWNER}/${env.VERCEL_GIT_REPO_SLUG}`;
    assert.equal(vercelSource.toLowerCase(), repository.toLowerCase(), 'Vercel checkout is not the canonical SENZ repository.');
  }
  return contract;
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  try {
    const contract = checkSource();
    console.log(`SENZ source verified: ${contract.repository} | ${contract.productionBranch} | ${contract.canonicalDomain}`);
  } catch (error) {
    console.error(`SENZ source check failed: ${error.message}`);
    process.exitCode = 1;
  }
}
