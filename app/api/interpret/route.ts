import { BadRequest, birthFrom, buildChart, guardRequest, jsonError, parseOptions, readJson, sseResponse } from '@/lib/server/http';
import { runInterpret, type Mode } from '@/lib/server/ai/interpret';
import { parseHistory } from '@/lib/server/ai/guard';
import { resolveProvider } from '@/lib/server/ai/providers';
import { TOPIC_KEYS } from '@/lib/i18n/vi/topics';
import { chartPatternsVi } from '@/lib/server/patterns';
import { hasTerm } from '@/lib/i18n/terms';

export const dynamic = 'force-dynamic';
const MODES: Mode[] = ['overview', 'topic', 'palace', 'star', 'cycle', 'chat'];

/** POST {birth, options, mode, topic?, palaceBranch?, starName?, year?, question?, messages?, provider?} → SSE. */
export async function POST(req: Request) {
  const denied = guardRequest(req); if (denied) return denied;
  try {
    const body = await readJson(req);
    const chart = buildChart(birthFrom(body), parseOptions(body.options));
    const mode = (body.mode ?? 'overview') as Mode;
    if (!MODES.includes(mode)) throw new BadRequest('mode không hợp lệ');
    if (mode === 'topic' && !TOPIC_KEYS.includes(body.topic as never)) throw new BadRequest('topic không hợp lệ');
    if (mode === 'palace' && !(Number.isInteger(body.palaceBranch) && (body.palaceBranch as number) >= 0 && (body.palaceBranch as number) < 12)) throw new BadRequest('palaceBranch không hợp lệ');
    // only known engine star names reach the prompt (no free text)
    if (mode === 'star' && (typeof body.starName !== 'string' || body.starName.length > 8 || !/^\p{Script=Han}+$/u.test(body.starName) || !hasTerm(body.starName))) throw new BadRequest('starName không hợp lệ');
    if (mode === 'chat' && (typeof body.question !== 'string' || !body.question.trim())) throw new BadRequest('Thiếu câu hỏi');
    const year = body.year === undefined ? undefined : Number.isInteger(body.year) && (body.year as number) > 1900 && (body.year as number) < 2101 ? body.year as number : (() => { throw new BadRequest('year không hợp lệ'); })();
    let history;
    try { history = parseHistory(body.messages); } catch (e) { throw new BadRequest((e as Error).message); }
    return sseResponse((send, signal) => runInterpret({
      chart, mode, topic: body.topic as string, palaceBranch: body.palaceBranch as number, starName: body.starName as string,
      year, question: body.question as string, history, provider: resolveProvider(body.provider), patterns: chartPatternsVi(chart),
    }, send, signal), req.signal);
  } catch (e) { return jsonError(e); }
}
