// Regenerates every golden chart (tests/fixtures/golden-charts.json, baseline engine a600484) and deep-compares.
// Intentional engine change? Re-run `npx tsx scripts/verify/make-golden.ts` and review the fixture diff.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { FIXTURE_PATH, buildCases, runCase, type GoldenInput } from '../../scripts/verify/make-golden';

const fixture = JSON.parse(readFileSync(FIXTURE_PATH, 'utf8')) as { cases: (GoldenInput & { snapshot: unknown })[] };
assert.deepEqual(fixture.cases.map(c => c.id), buildCases().map(c => c.id), 'fixture case list is stale');
for (const c of fixture.cases) {
  const { snapshot, ...input } = c;
  assert.deepEqual(JSON.parse(JSON.stringify(runCase(input))), snapshot, `golden chart changed: ${c.id}`);
}
console.log(`golden charts: ${fixture.cases.length} charts match snapshot`);
