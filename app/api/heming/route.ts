import { BadRequest, birthFrom, buildChart, guardRequest, jsonError, parseOptions, readJson, sseResponse } from '@/lib/server/http';
import { runHeming, RELATIONS, type Relation } from '@/lib/server/ai/heming';
import { resolveProvider } from '@/lib/server/ai/providers';

export const dynamic = 'force-dynamic';

/** POST {birthA, birthB (or chartA/chartB from the upstream client), options?, relation?, question?, provider?} → SSE. */
export async function POST(req: Request) {
  const denied = guardRequest(req); if (denied) return denied;
  try {
    const body = await readJson(req);
    const opts = parseOptions(body.options);
    const a = buildChart(birthFrom(body, 'birthA', 'chartA'), opts);
    const b = buildChart(birthFrom(body, 'birthB', 'chartB'), opts);
    const relation = (body.relation ?? 'love') as Relation;
    if (!(relation in RELATIONS)) throw new BadRequest('relation không hợp lệ');
    if (body.question !== undefined && typeof body.question !== 'string') throw new BadRequest('question không hợp lệ');
    return sseResponse((send, signal) => runHeming(a, b, relation, (body.question as string) ?? '', resolveProvider(body.provider), send, signal), req.signal);
  } catch (e) { return jsonError(e); }
}
