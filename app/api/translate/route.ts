import { BadRequest, guardRequest, jsonError, readJson, sseResponse } from '@/lib/server/http';
import { getChapter } from '@/lib/classics';
import { translateChunk } from '@/lib/server/translate';

export const dynamic = 'force-dynamic';

/** POST {book, chapter} → SSE {para:{i, id, zh, vi, ok}}. Only texts the server holds (no arbitrary input). */
export async function POST(req: Request) {
  const denied = guardRequest(req); if (denied) return denied;
  try {
    const body = await readJson(req);
    if (typeof body.book !== 'string' || !Number.isInteger(body.chapter)) throw new BadRequest('book/chapter không hợp lệ');
    const found = getChapter(body.book, body.chapter as number);
    if (!found) throw new BadRequest('Không tìm thấy chương');
    const paragraphs = found.chapter.paragraphs;
    return sseResponse(async (send, signal) => {
      send({ meta: { paragraphs: paragraphs.length, license: 'Phạm vi công cộng', translator: 'AI cục bộ (Ollama)' } });
      for (let i = 0; i < paragraphs.length; i++) {
        if (signal.aborted) return;
        try {
          const t = await translateChunk(paragraphs[i].text, signal);
          send({ para: { i, id: paragraphs[i].id, vi: t.vi, ok: t.ok, issues: t.issues, cached: t.cached } });
        } catch (e) { send({ para: { i, id: paragraphs[i].id, error: (e as Error).message } }); }
      }
    }, req.signal);
  } catch (e) { return jsonError(e); }
}
