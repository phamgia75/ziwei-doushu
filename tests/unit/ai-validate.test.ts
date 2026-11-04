// Output validator: placement claims are checked against the computed chart; citations against supplied IDs.
import assert from 'node:assert/strict';
import { generateChart } from '../../lib/ziwei/algorithm';
import { validateOutput } from '../../lib/server/ai/validate';
const chart = generateChart({ year: 1990, month: 1, day: 2, hour: 3, gender: 'male' }); // Quan Lộc: Tử Vi + Thiên Phủ; Mệnh: Vũ Khúc
const ok = validateOutput('Cung Quan Lộc tại Dần có Tử Vi và Thiên Phủ đồng cung [F11]. Cung Mệnh có Vũ Khúc Hóa Lộc [F3].', chart, ['F3', 'F11'], []);
assert.equal(ok.placementIssues.length, 0, JSON.stringify(ok.placementIssues));
assert.equal(ok.placementsChecked, 3);
const bad = validateOutput('Tử Vi tọa thủ tại cung Mệnh nên rất uy quyền [F99]. Thất Sát ở cung Phu Thê chiếu Quan Lộc.', chart, ['F3'], ['S1']);
assert.equal(bad.placementIssues.length, 1);
assert.match(bad.placementIssues[0].detail, /Tử Vi ở cung Quan Lộc, không ở cung Mệnh/);
assert.ok(bad.claims.some(c => c.kind === 'xung' || c.kind === 'chieu'), 'relational sentence now verified too');
assert.deepEqual(bad.invalidRefs, ['F99']);
const rel = validateOutput('Nếu Tham Lang ở cung Mệnh thì khác.', chart, [], []);
const st = validateOutput('**Dữ kiện lá số**\n- Cung Mệnh có Vũ Khúc [F3]\n- Mệnh rất mạnh\n\n**Luận giải truyền thống**\nTốt.', chart, ['F3'], []);
assert.deepEqual(st.structure, { factsSection: true, interpretationSection: true });
assert.ok(st.claims.some(c => c.status === 'unverified' && /không trích mã/.test(c.detail)), 'uncited line in facts section flagged');
assert.equal(rel.placementsChecked, 0, 'hypothetical sentences are not placement claims');
assert.ok(validateOutput('天府 tốt, (天府) ok', chart, [], []).hanOutsideParens === 2);
console.log('ai output validator: placement, citation and language checks pass');
