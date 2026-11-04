/**
 * AI latency benchmark against a running server. Measures time to first byte of model text (TTFT),
 * total time and output size for representative requests. Usage: npx tsx scripts/perf/bench-ai.ts [label] [runs]
 * Writes results to test-results/perf-<label>.json.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
const BASE = process.env.BASE_URL ?? 'http://127.0.0.1:3000';
const A = { year: 1990, month: 1, day: 2, hour: 3, gender: 'male' };
const B = { year: 1992, month: 8, day: 14, hour: 6, gender: 'female' };
const CASES: [string, string, unknown][] = [
  ['topic-career', '/api/interpret', { birth: A, mode: 'topic', topic: 'career', year: 2026 }],
  ['overview', '/api/interpret', { birth: A, mode: 'overview', year: 2026 }],
  ['chat', '/api/chat', { birth: A, question: 'Năm nay sự nghiệp của tôi thế nào?', year: 2026 }],
  ['heming', '/api/heming', { birthA: A, birthB: B, relation: 'love' }],
];
async function run(path: string, body: unknown) {
  const t0 = performance.now();
  const r = await fetch(BASE + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const reader = r.body!.getReader(); const dec = new TextDecoder();
  let buf = '', text = '', ttft = 0, meta: Record<string, unknown> = {};
  for (;;) {
    const { done, value } = await reader.read(); if (done) break;
    buf += dec.decode(value, { stream: true });
    let i; while ((i = buf.indexOf('\n\n')) >= 0) {
      const line = buf.slice(0, i); buf = buf.slice(i + 2);
      if (!line.startsWith('data: ') || line === 'data: [DONE]') continue;
      const ev = JSON.parse(line.slice(6));
      if (ev.delta?.text) { if (!ttft) ttft = performance.now() - t0; text += ev.delta.text; }
      if (ev.meta?.phase === 'end') meta = ev.meta;
      if (ev.meta?.perf) meta.perf = ev.meta.perf;
    }
  }
  return { ttft_s: +(ttft / 1000).toFixed(1), total_s: +((performance.now() - t0) / 1000).toFixed(1), chars: text.length,
    cached: !!(meta as { cached?: boolean }).cached, perf: (meta as { perf?: unknown }).perf };
}
(async () => {
  const label = process.argv[2] ?? 'run'; const runs = Number(process.argv[3] ?? 1);
  const out: Record<string, unknown[]> = {};
  for (const [name, path, body] of CASES) {
    out[name] = [];
    for (let k = 0; k < runs; k++) { const r = await run(path, body); out[name].push(r); console.log(label, name, `#${k + 1}`, JSON.stringify(r)); }
  }
  mkdirSync('test-results', { recursive: true });
  writeFileSync(`test-results/perf-${label}.json`, JSON.stringify({ label, at: new Date().toISOString(), results: out }, null, 1));
})();
