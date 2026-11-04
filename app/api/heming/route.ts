import { BadRequest, birthFrom, buildChart, calendarNote, guardRequest, jsonError, parseOptions, readJson, sseResponse } from '@/lib/server/http';
import { runHeming, RELATIONS, type Relation } from '@/lib/server/ai/heming';
import { resolveProvider } from '@/lib/server/ai/providers';

export const dynamic = 'force-dynamic';

/** POST {birthA, birthB (or chartA/chartB from the upstream client), options?, relation?, question?, provider?} → SSE. */
export async function POST(req: Request) {
  const denied = guardRequest(req); if (denied) return denied;
  try {
    const body = await readJson(req);
    const opts = parseOptions(body.options);
    const birthA = birthFrom(body, 'birthA', 'chartA'), birthB = birthFrom(body, 'birthB', 'chartB');
    // each person may be from a different region (historical calendar rule)
    const optsA = { ...opts, calendarRegion: body.regionA === 'south' ? 'south' as const : opts.calendarRegion };
    const optsB = { ...opts, calendarRegion: body.regionB === 'south' ? 'south' as const : opts.calendarRegion };
    const a = buildChart(birthA, optsA), b = buildChart(birthB, optsB);
    const relation = (body.relation ?? 'love') as Relation;
    if (!(relation in RELATIONS)) throw new BadRequest('relation không hợp lệ');
    if (body.question !== undefined && typeof body.question !== 'string') throw new BadRequest('question không hợp lệ');
    return sseResponse((send, signal) => runHeming(a, b, relation, (body.question as string) ?? '', resolveProvider(body.provider), send, signal, [calendarNote(birthA, optsA), calendarNote(birthB, optsB)]), req.signal);
  } catch (e) { return jsonError(e); }
}
