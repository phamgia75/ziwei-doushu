/** Request validation + SSE helpers shared by the API routes. */
import { generateChart, setBrightnessSchool, type LunarMonthPolicy, type SchoolBrightnessKind } from '@/lib/ziwei/algorithm';
import type { BirthInfo, ZiweiChart } from '@/lib/ziwei/types';
import { LUNAR_YEAR_MIN, LUNAR_YEAR_MAX } from '@/lib/ziwei/lunar-solar';

export class BadRequest extends Error {}

const MAX_BODY = 64 * 1024;

export async function readJson(req: Request): Promise<Record<string, unknown>> {
  if (!(req.headers.get('content-type') ?? '').includes('application/json')) throw new BadRequest('Content-Type phải là application/json');
  const text = await req.text();
  if (text.length > MAX_BODY) throw new BadRequest('Yêu cầu quá lớn');
  try {
    const j = JSON.parse(text);
    if (!j || typeof j !== 'object' || Array.isArray(j)) throw new Error();
    return j;
  } catch { throw new BadRequest('JSON không hợp lệ'); }
}

const int = (v: unknown, min: number, max: number, name: string): number => {
  if (typeof v !== 'number' || !Number.isInteger(v) || v < min || v > max) throw new BadRequest(`${name} không hợp lệ`);
  return v;
};

const LEAP: LunarMonthPolicy[] = ['split', 'next-month', 'prev-month', 'origin-month'];
const BRIGHT: SchoolBrightnessKind[] = ['default', 'XD1', 'XD2', 'ZZ'];

export interface ChartOptions { leapMonth: LunarMonthPolicy; brightness: SchoolBrightnessKind }

/** Validate a birth payload ({year, month, day, hour, gender} — the chart date after the Tý rule). */
export function parseBirth(v: unknown): BirthInfo {
  if (!v || typeof v !== 'object') throw new BadRequest('Thiếu thông tin ngày sinh');
  const o = v as Record<string, unknown>;
  const b: BirthInfo = {
    year: int(o.year, LUNAR_YEAR_MIN + 1, LUNAR_YEAR_MAX - 1, 'Năm sinh'),
    month: int(o.month, 1, 12, 'Tháng sinh'),
    day: int(o.day, 1, 31, 'Ngày sinh'),
    hour: int(o.hour, 0, 11, 'Giờ sinh'),
    gender: o.gender === 'male' || o.gender === 'female' ? o.gender : (() => { throw new BadRequest('Giới tính không hợp lệ'); })(),
  };
  const d = new Date(Date.UTC(b.year, b.month - 1, b.day));
  if (d.getUTCMonth() !== b.month - 1) throw new BadRequest('Ngày sinh không tồn tại');
  return b; // name/place deliberately dropped: the server never needs them
}

export function parseOptions(v: unknown): ChartOptions {
  const o = (v && typeof v === 'object' ? v : {}) as Record<string, unknown>;
  const leapMonth = (o.leapMonth ?? 'split') as LunarMonthPolicy;
  const brightness = (o.brightness ?? 'default') as SchoolBrightnessKind;
  if (!LEAP.includes(leapMonth)) throw new BadRequest('Quy ước tháng nhuận không hợp lệ');
  if (!BRIGHT.includes(brightness)) throw new BadRequest('Bảng độ sáng không hợp lệ');
  return { leapMonth, brightness };
}

/** Deterministic server-side chart. setBrightnessSchool is a module-global in the engine, so it is
 *  set and restored synchronously around generateChart (no await in between → no interleaving). */
export function buildChart(birth: BirthInfo, opts: ChartOptions): ZiweiChart {
  setBrightnessSchool(opts.brightness);
  try { return generateChart(birth, { leapMonth: opts.leapMonth }); }
  finally { setBrightnessSchool('default'); }
}

export function jsonError(e: unknown): Response {
  if (e instanceof BadRequest) return Response.json({ error: e.message }, { status: 400 });
  if (e instanceof RangeError) return Response.json({ error: 'Dữ liệu ngày giờ không hợp lệ' }, { status: 400 });
  console.error('[api]', e);
  return Response.json({ error: 'Lỗi máy chủ' }, { status: 500 });
}

export type SseSend = (obj: unknown) => void;

/** SSE stream: `data: {...}` events then `data: [DONE]`. Text deltas use {delta:{text}} (upstream client format). */
export function sseResponse(run: (send: SseSend, signal: AbortSignal) => Promise<void>, signal: AbortSignal): Response {
  const enc = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(ctl) {
      const send: SseSend = obj => { try { ctl.enqueue(enc.encode(`data: ${JSON.stringify(obj)}\n\n`)); } catch { /* closed */ } };
      try { await run(send, signal); }
      catch (e) {
        if (!signal.aborted) { console.error('[sse]', e); send({ error: { message: (e as Error).message || 'Lỗi' } }); }
      } finally {
        try { ctl.enqueue(enc.encode('data: [DONE]\n\n')); ctl.close(); } catch { /* closed */ }
      }
    },
  });
  return new Response(stream, { headers: { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-store', 'X-Accel-Buffering': 'no' } });
}

/** Local-only API: reject other Host headers (DNS rebinding) and cross-site Origins (CSRF from other sites in the browser). */
export function guardRequest(req: Request): Response | null {
  const allowed = (process.env.ALLOWED_HOSTS ?? 'localhost,127.0.0.1,[::1]').split(',').map(s => s.trim());
  const host = (req.headers.get('host') ?? '').replace(/:\d+$/, '');
  if (!allowed.includes(host)) return Response.json({ error: 'Host không được phép' }, { status: 403 });
  const origin = req.headers.get('origin');
  if (origin) {
    try { if (new URL(origin).host !== req.headers.get('host')) return Response.json({ error: 'Origin không được phép' }, { status: 403 }); }
    catch { return Response.json({ error: 'Origin không hợp lệ' }, { status: 403 }); }
  }
  return null;
}

/** Accepts {birth} or the upstream client shape {chart: {birthInfo}} — only the birth fields are used. */
export function birthFrom(body: Record<string, unknown>, key = 'birth', chartKey = 'chart'): BirthInfo {
  const chart = body[chartKey] as { birthInfo?: unknown } | undefined;
  return parseBirth(body[key] ?? chart?.birthInfo);
}
