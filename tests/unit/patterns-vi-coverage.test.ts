// Every pattern detectPatterns() emits, and the Mệnh summary, must render as Han-free Vietnamese.
import assert from 'node:assert/strict';
import * as nodeModule from 'node:module';
import { generateChart } from '../../lib/ziwei/algorithm';
import { patternVi, mingGongSummaryVi } from '../../lib/i18n/vi/patterns';

// patterns.ts imports `server-only` (only present inside Next builds): resolve it to an empty module.
type HookResult = { url?: string; format?: string; source?: string; shortCircuit?: boolean };
const { registerHooks } = nodeModule as unknown as {
  registerHooks(h: {
    resolve(s: string, c: unknown, next: (s: string, c: unknown) => HookResult): HookResult;
    load(u: string, c: unknown, next: (u: string, c: unknown) => HookResult): HookResult;
  }): void;
};
const STUB = 'data:text/javascript,';
registerHooks({
  resolve: (s, c, next) => (s === 'server-only' ? { url: STUB, shortCircuit: true } : next(s, c)),
  load: (u, c, next) => (u === STUB ? { format: 'commonjs', source: '', shortCircuit: true } : next(u, c)),
});

const HAN = /\p{Script=Han}/u;

async function main() {
  const { detectPatterns, getMingGongSummary } = await import('../../lib/ziwei/patterns');
  const seen = new Map<string, number>();
  const bad = new Set<string>();
  const check = (vi: string, zh: string) => { if (!vi || HAN.test(vi)) bad.add(zh); };
  let charts = 0;
  const start = Date.UTC(1950, 0, 1), end = Date.UTC(2026, 11, 31);
  // every 5th day 1950–2026 (~5600 charts, ~26 ms each); hour cycles through all 12, gender flips every 12 steps
  // PATTERN_STRIDE_DAYS=5 for the full ~5600-chart sweep (~3 min); default 17 keeps npm test fast (~1650 charts)
  const stride = Number(process.env.PATTERN_STRIDE_DAYS ?? 17);
  for (let t = start, i = 0; t <= end; t += stride * 86_400_000, i++) {
    const d = new Date(t);
    const gender = Math.floor(i / 12) % 2 ? 'female' : 'male';
    const hour = i % 12;
    const chart = generateChart({ year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate(), hour, gender });
    charts++;
    for (const p of detectPatterns(chart)) {
      seen.set(p.name, (seen.get(p.name) ?? 0) + 1);
      const v = patternVi(p);
      check(v.name, p.name);
      check(v.description, p.description);
      v.palaces.forEach((x, k) => check(x, p.palaces[k]));
      v.conditions?.required.forEach((x, k) => check(x, p.conditions!.required[k]));
      v.conditions?.bonus?.forEach((x, k) => check(x, p.conditions!.bonus![k]));
      v.conditions?.breaking?.forEach((x, k) => check(x, p.conditions!.breaking![k]));
      if (p.source) check(v.source ?? '', p.source);
    }
    const s = getMingGongSummary(chart);
    const sv = mingGongSummaryVi(s);
    sv.stars.forEach((x, k) => check(x, s.stars[k]));
    sv.keywords.forEach((x, k) => check(x, s.keywords[k]));
    if (s.nature) check(sv.nature, s.nature);
  }
  assert.ok(charts >= 1500, `sample too small: ${charts}`);
  assert.deepEqual([...bad], [], `untranslated pattern text:\n${[...bad].join('\n')}`);
  console.log(`✓ patterns → Vietnamese: ${charts} charts, ${seen.size} distinct patterns, no Han text`);
}
main().catch(e => { console.error(e); process.exit(1); });
