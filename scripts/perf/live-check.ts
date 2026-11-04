/**
 * Live check against the real local model, calling the route handlers directly (no Next server):
 * structure compliance, claim verification counts and latency. Usage: npx tsx scripts/perf/live-check.ts
 */
import Module from 'node:module';
import { join } from 'node:path';
const M = Module as unknown as { _resolveFilename: (r: string, ...a: unknown[]) => string };
const orig = M._resolveFilename;
M._resolveFilename = (r, ...a) => (r === 'server-only' ? join(process.cwd(), 'tests/stubs/empty.cjs') : orig(r, ...a));
process.env.AI_ANSWER_CACHE = process.env.AI_ANSWER_CACHE ?? 'off';

const A = { year: 1990, month: 1, day: 2, hour: 3, gender: 'male' }, B = { year: 1992, month: 8, day: 14, hour: 6, gender: 'female' };
const CASES: [string, string, unknown][] = [
  ['topic-career', 'interpret', { birth: A, mode: 'topic', topic: 'career', year: 2026 }],
  ['overview', 'interpret', { birth: A, mode: 'overview', year: 2026 }],
  ['chat', 'chat', { birth: A, question: 'Năm nay sự nghiệp của tôi thế nào?', year: 2026 }],
  ['heming', 'heming', { birthA: A, birthB: B, relation: 'love' }],
];
(async () => {
  const only = process.argv[2];
  for (const [name, route, body] of CASES) {
    if (only && !name.startsWith(only)) continue;
    const { POST } = await import(`../../app/api/${route}/route`);
    const t0 = Date.now();
    const res: Response = await POST(new Request(`http://localhost:3000/api/${route}`, { method: 'POST', headers: { 'content-type': 'application/json', host: 'localhost:3000' }, body: JSON.stringify(body) }));
    const evs = (await res.text()).split('\n\n').filter(l => l.startsWith('data: ') && l !== 'data: [DONE]').map(l => JSON.parse(l.slice(6)));
    const text = evs.filter(e => e.delta).map(e => e.delta.text).join('');
    const end = evs.find(e => e.meta?.phase === 'end')?.meta ?? {};
    const v = end.validation ?? {};
    console.log(JSON.stringify({ name, total_s: (Date.now() - t0) / 1000, chars: text.length, perf: end.perf, structure: v.structure, summary: v.summary,
      contradicted: (v.claims ?? []).filter((c: { status: string }) => c.status === 'contradicted').map((c: { detail: string }) => c.detail) }));
    if (process.env.SHOW) console.log(text);
  }
})();
