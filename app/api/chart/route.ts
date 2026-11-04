import { birthFrom, buildChart, calendarNote, guardRequest, jsonError, parseOptions, readJson } from '@/lib/server/http';
import { buildFacts } from '@/lib/server/facts';
import { detectPatterns, getMingGongSummary } from '@/lib/ziwei/patterns';
import { patternVi, mingGongSummaryVi } from '@/lib/i18n/vi/patterns';

export const dynamic = 'force-dynamic';

/** POST {birth, options} → deterministic chart JSON + numbered facts. No AI involved. */
export async function POST(req: Request) {
  const denied = guardRequest(req); if (denied) return denied;
  try {
    const body = await readJson(req);
    const birth = birthFrom(body), opts = parseOptions(body.options);
    const chart = buildChart(birth, opts);
    const year = typeof body.year === 'number' && Number.isInteger(body.year) ? body.year : undefined;
    return Response.json({
      chart, facts: buildFacts(chart, { year, calendarNote: calendarNote(birth, opts) }), calendarNote: calendarNote(birth, opts) ?? null,
      patterns: detectPatterns(chart).map(patternVi),
      mingSummary: mingGongSummaryVi(getMingGongSummary(chart)),
    });
  } catch (e) { return jsonError(e); }
}
