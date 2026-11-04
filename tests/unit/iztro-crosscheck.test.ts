// Engine vs plain iztro on a fixed 500-birth sample: zero unexplained differences.
// Full run (>=3000 births): npx tsx scripts/verify/iztro-crosscheck.ts 3000
import assert from 'node:assert/strict';
import { runCrosscheck } from '../../scripts/verify/iztro-crosscheck';

runCrosscheck(500, 20261104).then(r => {
const unexplained = r.diffs.filter(d => d.category === 'UNEXPLAINED');
assert.deepEqual(unexplained, [], `unexplained engine/iztro differences:\n${unexplained.slice(0, 20).map(d => JSON.stringify(d)).join('\n')}`);
// The only expected category: 天魁/天钺 swapped in every 辛 year (KY1 default, applySchoolKuiyue).
assert.deepEqual(Object.keys(r.byCategory), r.xinBirths ? ['expected:kuiyue-KY1-xin-year'] : []);
assert.equal(r.byCategory['expected:kuiyue-KY1-xin-year'] ?? 0, 2 * r.xinBirths);
console.log(`iztro cross-check: ${r.n} births × ${r.fieldsPerBirth} fields, 0 unexplained, ${2 * r.xinBirths} expected (辛-year 魁钺)`);
}).catch(e => { console.error(e); process.exit(1); });
