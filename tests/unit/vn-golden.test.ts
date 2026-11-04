// Regenerates every Vietnamese golden case (tests/fixtures/vn-golden.json) and deep-compares; also checks the
// generator is reproducible (two runs, byte-identical, equal to the file). Intentional change? Re-run
// `npx tsx scripts/verify/make-vn-golden.ts` and review the fixture diff.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { VN_GOLDEN_PATH, buildVnCases, runVnCase, renderVnGolden, type VnCase } from '../../scripts/verify/make-vn-golden';

const fixture = JSON.parse(readFileSync(VN_GOLDEN_PATH, 'utf8')) as { cases: (VnCase & { out: unknown })[] };
const cases = buildVnCases();
assert.deepEqual(fixture.cases.map(c => c.id), cases.map(c => c.id), 'fixture case list is stale');
assert.equal(new Set(cases.map(c => c.id)).size, cases.length, 'unique ids');
for (const c of fixture.cases) {
  const { out, ...input } = c;
  assert.deepEqual(JSON.parse(JSON.stringify(runVnCase(input))), out, `VN golden changed: ${c.id}`);
}
const a = renderVnGolden(), b = renderVnGolden();
assert.equal(a, b, 'generator output not reproducible');
assert.equal(a, readFileSync(VN_GOLDEN_PATH, 'utf8'), 'fixture file not byte-identical to generator output');
console.log(`vn-golden: ${fixture.cases.length} cases match; generator byte-identical across 2 runs and equal to the file`);
