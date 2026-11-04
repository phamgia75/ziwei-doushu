import { birthFrom, buildChart, guardRequest, jsonError, parseOptions, readJson } from '@/lib/server/http';
import { buildFacts } from '@/lib/server/facts';

export const dynamic = 'force-dynamic';

/** POST {birth, options} → deterministic chart JSON + numbered facts. No AI involved. */
export async function POST(req: Request) {
  const denied = guardRequest(req); if (denied) return denied;
  try {
    const body = await readJson(req);
    const chart = buildChart(birthFrom(body), parseOptions(body.options));
    const year = typeof body.year === 'number' && Number.isInteger(body.year) ? body.year : undefined;
    return Response.json({ chart, facts: buildFacts(chart, { year }) });
  } catch (e) { return jsonError(e); }
}
