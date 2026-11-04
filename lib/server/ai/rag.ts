/**
 * Retrieval for AI interpretation. Sources are plain local texts with provenance + licence;
 * the model must cite them as [S1], [S2] … . Retrieval is keyword-based on the chart's own
 * engine identifiers (no embeddings needed: the chart tells us exactly which stars/palaces matter).
 *
 * Sources and licences:
 *  - dataset   v4.0 interpretation dataset, this exact chart (CC BY 4.0, attribution required)
 *  - classic   《紫微斗数全书》/《全集》/《骨髓赋》 (public domain)
 *  - heming-kb lib/ziwei/heming-knowledge.ts (repo MIT)
 *  - nihai     docs/tianji-ziwei quotes (CC BY-NC-SA 4.0) — only when RAG_INCLUDE_NC=true
 */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type { ZiweiChart } from '@/lib/ziwei/types';
import { ALL_BOOKS } from '@/lib/classics';
import { STAR_IN_FUQI_GU } from '@/lib/ziwei/heming-knowledge';
import { lookupRecord, recordMatchesChart, DATASET_ATTRIBUTION, type DatasetTopic, DATASET_TOPICS } from '../dataset';
import { term } from '@/lib/i18n/terms';

export interface Source { id: string; origin: 'dataset' | 'classic' | 'heming-kb' | 'nihai'; title: string; ref: string; license: string; text: string }

export const includeNC = () => process.env.RAG_INCLUDE_NC === 'true';

/** Vietnamese question keywords → dataset topic. */
const TOPIC_KEYWORDS: [DatasetTopic, RegExp][] = [
  ['career', /sự nghiệp|công việc|nghề|thăng tiến|kinh doanh|quan lộc|làm ăn/i],
  ['wealth', /tiền|tài chính|tài lộc|giàu|đầu tư|thu nhập|tài bạch/i],
  ['love', /tình|hôn nhân|vợ|chồng|người yêu|kết hôn|phu thê|duyên/i],
  ['health', /sức khỏe|bệnh|tật ách|thể chất/i],
  ['children', /con cái|con trai|con gái|tử nữ|sinh con/i],
  ['parents', /cha mẹ|bố mẹ|phụ mẫu|bố|mẹ/i],
  ['family', /anh chị em|anh em|huynh đệ|chị em/i],
  ['friends', /bạn bè|đồng nghiệp|nô bộc|giao hữu|cấp dưới/i],
  ['home', /nhà|đất|bất động sản|điền trạch/i],
  ['move', /đi xa|xuất ngoại|di chuyển|thiên di|định cư|nước ngoài/i],
  ['spirit', /tinh thần|phúc đức|tâm linh|hưởng thụ/i],
  ['personality', /tính cách|con người|bản tính|tâm tính/i],
];

export function topicsForQuestion(q: string): DatasetTopic[] {
  const hits = TOPIC_KEYWORDS.filter(([, re]) => re.test(q)).map(([t]) => t);
  return hits.length ? hits.slice(0, 2) : ['overview'];
}

const clip = (s: string, n: number) => (s.length > n ? s.slice(0, n) + '…' : s);

/** Dataset reading(s) for this exact chart, only if the record verifiably matches the chart. */
export async function datasetSources(chart: ZiweiChart, topics: DatasetTopic[], maxChars = 2600): Promise<{ sources: Omit<Source, 'id'>[]; status: 'ok' | 'missing' | 'mismatch' }> {
  const b = chart.birthInfo;
  const rec = await lookupRecord(b.year, b.month, b.day, b.hour, b.gender).catch(() => null);
  if (!rec) return { sources: [], status: 'missing' };
  if (!recordMatchesChart(rec, chart)) return { sources: [], status: 'mismatch' };
  return {
    status: 'ok',
    sources: topics.filter(t => DATASET_TOPICS.includes(t)).map(t => ({
      origin: 'dataset' as const,
      title: `Bộ dữ liệu luận giải v4.0 — chủ đề ${t}`,
      // rec.k encodes birth date/hour/gender — never put it in model-facing text
      ref: `${DATASET_ATTRIBUTION.release}#${t}`,
      license: `${DATASET_ATTRIBUTION.license} — ${DATASET_ATTRIBUTION.author}`,
      text: clip(rec.c[t], Math.floor(maxChars / topics.length)),
    })),
  };
}

/** Classical paragraphs that mention the given stars (most star hits first). */
export function classicSources(stars: string[], limit = 3): Omit<Source, 'id'>[] {
  const scored: { score: number; s: Omit<Source, 'id'> }[] = [];
  for (const book of ALL_BOOKS) for (const ch of book.chapters) for (const p of ch.paragraphs) {
    const score = stars.filter(st => p.text.includes(st)).length;
    if (score) scored.push({ score, s: { origin: 'classic', title: `${book.title} · ${ch.title}`, ref: `classics:${book.slug}/${p.id}`, license: 'Phạm vi công cộng (public domain)', text: clip(p.text, 400) } });
  }
  return scored.sort((a, b) => b.score - a.score).slice(0, limit).map(x => x.s);
}

/** Spouse-palace knowledge for compatibility analysis. */
export function hemingSources(stars: string[]): Omit<Source, 'id'>[] {
  return stars.filter(s => STAR_IN_FUQI_GU[s]).map(s => {
    const k = STAR_IN_FUQI_GU[s];
    return { origin: 'heming-kb' as const, title: `Tri thức Hợp hôn — ${term(s)} tại cung Phu Thê`, ref: `heming-knowledge:${s}`,
      license: 'MIT (ziwei-doushu)', text: [k.summary, k.good, k.bad, k.spouse_traits, k.timing, includeNC() && k.ni_quote].filter(Boolean).join(' / ') };
  });
}

interface NihaiEntry { book: string; h2: string; h3: string; quote: string; t_hms: string; part: number }
let nihai: NihaiEntry[] | null = null;
/** Ni Haixia quotes (CC BY-NC-SA 4.0): excluded unless RAG_INCLUDE_NC=true. */
export function nihaiSources(stars: string[], limit = 3): Omit<Source, 'id'>[] {
  if (!includeNC()) return [];
  if (!nihai) {
    const p = join(process.cwd(), 'docs/tianji-ziwei/entries.jsonl');
    nihai = existsSync(p) ? readFileSync(p, 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l)) : [];
  }
  return nihai.filter(e => stars.some(s => e.quote.includes(s))).slice(0, limit).map(e => ({
    origin: 'nihai' as const, title: `Nghê Hải Hạ《天纪》· ${e.h2} · ${e.h3}`, ref: `tianji:${e.book} phần ${e.part} @${e.t_hms}`,
    license: 'CC BY-NC-SA 4.0 (phi thương mại)', text: e.quote,
  }));
}

export const numberSources = (list: Omit<Source, 'id'>[]): Source[] => list.map((s, i) => ({ ...s, id: `S${i + 1}` }));
export const sourcesBlock = (sources: Source[]) =>
  sources.map(s => `[${s.id}] ${s.title} (${s.ref}; ${s.license})\n${s.text}`).join('\n\n');
