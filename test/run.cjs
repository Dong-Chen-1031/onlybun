'use strict';

const { execFileSync, spawnSync } = require('child_process');
const path = require('path');
const os = require('os');
const fs = require('fs');

const root = path.join(__dirname, '..');
let failures = 0;

function check(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
  } catch (err) {
    failures++;
    console.log(`  ✗ ${name}\n      ${err.message}`);
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

// Build a throwaway consumer project whose node_modules symlinks back to this
// package, so resolution goes through the real package entry points and
// export conditions.
const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'onlybun-test-'));
fs.mkdirSync(path.join(fixture, 'node_modules'));
fs.symlinkSync(root, path.join(fixture, 'node_modules', 'onlybun'), 'dir');
fs.writeFileSync(path.join(fixture, 'package.json'), JSON.stringify({ name: 'consumer', type: 'commonjs' }));
fs.writeFileSync(path.join(fixture, 'cjs.cjs'), "require('onlybun'); console.log('SURVIVED');\n");
fs.writeFileSync(path.join(fixture, 'esm.mjs'), "import 'onlybun'; console.log('SURVIVED');\n");
fs.writeFileSync(path.join(fixture, 'check.mjs'), "import { isBun, getRuntime } from 'onlybun/check';\nconsole.log('ISBUN=' + isBun() + ' RUNTIME=' + getRuntime());\n");

function run(cmd, args, env) {
  return spawnSync(cmd, args, {
    cwd: fixture,
    encoding: 'utf8',
    env: Object.assign({}, process.env, env || {}),
  });
}

// process.execPath points at whatever is running this file, which may well
// be Bun -- so resolve a real Node binary explicitly.
let nodePath = process.versions.bun ? null : process.execPath;
if (!nodePath) {
  try {
    nodePath = execFileSync('sh', ['-c', 'command -v node'], { encoding: 'utf8' }).trim() || null;
  } catch (_) {}
}

if (!nodePath) {
  console.log('\nNode.js: not installed, skipping Node-side tests.');
} else {
console.log(`\nNode.js (${nodePath}, should be turned away):`);
check('require("onlybun") terminates with exit code 1', () => {
  const r = run(nodePath, ['cjs.cjs']);
  assert(r.status === 1, `exit code ${r.status}`);
  assert(!r.stdout.includes('SURVIVED'), 'the script somehow ran to completion');
  assert(/requires Bun/.test(r.stderr), `unexpected stderr: ${r.stderr}`);
});
check('import "onlybun" terminates with exit code 1', () => {
  const r = run(nodePath, ['esm.mjs']);
  assert(r.status === 1, `exit code ${r.status}`);
  assert(!r.stdout.includes('SURVIVED'), 'the script somehow ran to completion');
});
check('ONLYBUN_EXIT_CODE overrides the exit code', () => {
  const r = run(nodePath, ['cjs.cjs'], { ONLYBUN_EXIT_CODE: '42' });
  assert(r.status === 42, `exit code ${r.status}`);
});
check('ONLYBUN_DISABLE=1 lets it through', () => {
  const r = run(nodePath, ['cjs.cjs'], { ONLYBUN_DISABLE: '1' });
  assert(r.status === 0, `exit code ${r.status}, stderr: ${r.stderr}`);
  assert(r.stdout.includes('SURVIVED'), 'script did not finish');
});
check('onlybun/check stays passive on Node and reports node', () => {
  const r = run(nodePath, ['check.mjs']);
  assert(r.status === 0, `exit code ${r.status}, stderr: ${r.stderr}`);
  assert(r.stdout.includes('ISBUN=false'), `output: ${r.stdout}`);
  assert(r.stdout.includes('RUNTIME=node'), `output: ${r.stdout}`);
});

}

let bunPath = null;
try {
  bunPath = execFileSync('sh', ['-c', 'command -v bun'], { encoding: 'utf8' }).trim();
} catch (_) {}

if (!bunPath) {
  console.log('\nBun: not installed, skipping Bun-side tests. (This package is fairly pointless without it.)');
} else {
  console.log(`\nBun (${bunPath}, should run through untouched):`);
  check('require("onlybun") does not terminate', () => {
    const r = run(bunPath, ['cjs.cjs']);
    assert(r.status === 0, `exit code ${r.status}, stderr: ${r.stderr}`);
    assert(r.stdout.includes('SURVIVED'), 'script did not finish');
  });
  check('import "onlybun" does not terminate', () => {
    const r = run(bunPath, ['esm.mjs']);
    assert(r.status === 0, `exit code ${r.status}, stderr: ${r.stderr}`);
    assert(r.stdout.includes('SURVIVED'), 'script did not finish');
  });
  check('onlybun/check reports bun', () => {
    const r = run(bunPath, ['check.mjs']);
    assert(r.stdout.includes('ISBUN=true'), `output: ${r.stdout}`);
    assert(r.stdout.includes('RUNTIME=bun'), `output: ${r.stdout}`);
  });
  check('bun --bun is happy too', () => {
    const r = run(bunPath, ['--bun', 'cjs.cjs']);
    assert(r.status === 0, `exit code ${r.status}, stderr: ${r.stderr}`);
  });
}

fs.rmSync(fixture, { recursive: true, force: true });
console.log(failures === 0 ? '\nAll passed.\n' : `\n${failures} failed.\n`);
process.exit(failures === 0 ? 0 : 1);
