// Runs upstream regression scripts + tests/unit/*.test.ts, each in its own tsx process.
import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
const files = [
  ...readdirSync('scripts/regression').filter(f => f.endsWith('.test.ts')).sort().map(f => `scripts/regression/${f}`),
  ...readdirSync('tests/unit').filter(f => f.endsWith('.test.ts')).sort().map(f => `tests/unit/${f}`),
].filter(f => !process.argv[2] || f.includes(process.argv[2]));
let failed = [];
for (const f of files) {
  const r = spawnSync('npx', ['tsx', f], { stdio: 'inherit' });
  if (r.status !== 0) failed.push(f);
}
console.log(`\n${files.length - failed.length}/${files.length} test files passed`);
if (failed.length) { console.log('FAILED:\n  ' + failed.join('\n  ')); process.exit(1); }
