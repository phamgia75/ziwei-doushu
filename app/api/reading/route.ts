import { BadRequest, birthFrom, buildChart, guardRequest, jsonError, parseOptions, readJson, sseResponse } from '@/lib/server/http';
import { lookupRecord, recordMatchesChart, DATASET_ATTRIBUTION, DATASET_TOPICS, type DatasetTopic } from '@/lib/server/dataset';
import { splitParagraphs, translateChunk } from '@/lib/server/translate';

export const dynamic = 'force-dynamic';

/** POST {birth, options, topic} → SSE: meta (provenance, match check), then one {para} event per paragraph
 *  with the original Chinese and the cached / freshly made local translation. */
export async function POST(req: Request) {
  const denied = guardRequest(req); if (denied) return denied;
  try {
    const body = await readJson(req);
    const birth = birthFrom(body);
    const chart = buildChart(birth, parseOptions(body.options));
    const topic = body.topic as DatasetTopic;
    if (!DATASET_TOPICS.includes(topic)) throw new BadRequest('topic không hợp lệ');
    const translate = body.translate !== false;
    return sseResponse(async (send, signal) => {
      const rec = await lookupRecord(birth.year, birth.month, birth.day, birth.hour, birth.gender);
      if (!rec) { send({ meta: { status: 'missing', note: 'Không có bản luận giải trong bộ dữ liệu (ngoài 1950–2026 hoặc chưa tải dữ liệu: npm run dataset:fetch).' } }); return; }
      const matches = recordMatchesChart(rec, chart);
      send({ meta: { status: matches ? 'ok' : 'mismatch', key: rec.k, topic, attribution: DATASET_ATTRIBUTION,
        note: matches ? undefined : 'Bản ghi trong bộ dữ liệu không khớp chính tinh cung Mệnh của lá số này (khác quy ước/phiên bản engine) nên không được dùng.' } });
      if (!matches) return;
      const paras = splitParagraphs(rec.c[topic]);
      send({ meta: { paragraphs: paras.length } });
      for (let i = 0; i < paras.length; i++) {
        if (signal.aborted) return;
        if (!translate) { send({ para: { i, zh: paras[i] } }); continue; }
        try {
          const t = await translateChunk(paras[i], signal);
          send({ para: { i, zh: t.zh, vi: t.vi, ok: t.ok, issues: t.issues, cached: t.cached } });
        } catch (e) {
          send({ para: { i, zh: paras[i], error: `Chưa dịch được: ${(e as Error).message}` } });
        }
      }
    }, req.signal);
  } catch (e) { return jsonError(e); }
}
