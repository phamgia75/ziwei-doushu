import { guardRequest } from '@/lib/server/http';
import { generateChart } from '@/lib/ziwei/algorithm';
import { externalAllowed, ollamaModels, pickOllamaModel, providerConfigured, OLLAMA_URL } from '@/lib/server/ai/providers';
import { availableYears, readManifest, DATASET_ATTRIBUTION } from '@/lib/server/dataset';
import { includeNC } from '@/lib/server/ai/rag';

export const dynamic = 'force-dynamic';

/** GET → status of engine, local AI, optional providers and dataset. Never returns secrets. */
export async function GET(req: Request) {
  const denied = guardRequest(req); if (denied) return denied;
  let engine = false;
  try { engine = generateChart({ year: 1990, month: 1, day: 1, hour: 0, gender: 'male' }).palaces.length === 12; } catch { /* reported */ }
  const ollama: Record<string, unknown> = { url: OLLAMA_URL(), reachable: false };
  try {
    ollama.models = await ollamaModels();
    ollama.reachable = true;
    ollama.selected = await pickOllamaModel();
  } catch (e) { ollama.error = (e as Error).message; }
  const years = availableYears();
  const manifest = readManifest();
  return Response.json({
    ok: engine,
    engine: { ok: engine },
    ai: {
      default: 'ollama', ollama,
      external: { allowed: externalAllowed(), openai: providerConfigured('openai'), anthropic: providerConfigured('anthropic') },
    },
    dataset: { ...DATASET_ATTRIBUTION, yearsAvailable: years.length, yearsTotal: manifest?.files.length ?? 77,
      range: years.length ? `${years[0]}–${years[years.length - 1]}` : null },
    rag: { includeNonCommercial: includeNC() },
  }, { headers: { 'Cache-Control': 'no-store' } });
}
