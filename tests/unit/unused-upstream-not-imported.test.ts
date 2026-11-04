// Upstream components exempted from the i18n check must stay unrendered.
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import { UNUSED_UPSTREAM } from '../../scripts/i18n/check-ui-strings';
for (const f of UNUSED_UPSTREAM) {
  const name = f.replace(/^components\//, '').replace(/\.tsx$/, '');
  const hits = execSync(`grep -rlE "/${name}['\\"]" app components lib || true`).toString().trim().split('\n').filter(Boolean)
    .filter(h => !UNUSED_UPSTREAM.includes(h));
  assert.deepEqual(hits, [], `${f} is exempt from i18n checks but imported by: ${hits.join(', ')}`);
}
console.log(`unused upstream components not imported (${UNUSED_UPSTREAM.length})`);
