import { guardRequest, readJson, jsonError } from '@/lib/server/http';
import { clearDatasetCache } from '@/lib/server/dataset';
import { clearTranslationCache } from '@/lib/server/translate';

export const dynamic = 'force-dynamic';

/** POST {action:'clear-server-cache'} → deletes extracted dataset records (keyed by birth data) and translation cache. */
export async function POST(req: Request) {
  const denied = guardRequest(req); if (denied) return denied;
  try {
    const body = await readJson(req);
    if (body.action !== 'clear-server-cache') return Response.json({ error: 'action không hợp lệ' }, { status: 400 });
    return Response.json({ ok: true, removed: { datasetRecords: clearDatasetCache(), translations: clearTranslationCache() } });
  } catch (e) { return jsonError(e); }
}
