/** Compatibility (Hợp hôn) analysis of two server-generated charts. */
import type { ZiweiChart } from '@/lib/ziwei/types';
import { buildFacts, factsBlock, type Fact } from '../facts';
import { hemingSources, classicSources, numberSources, sourcesBlock } from './rag';
import { DELIMS, looksLikeInjection, sanitize } from './guard';
import { SYSTEM_RULES, streamWithFallback } from './interpret';
import type { ProviderId } from './providers';
import type { SseSend } from '../http';

export const RELATIONS = { love: 'tình cảm / hôn nhân', partner: 'hợp tác làm ăn', family: 'cha mẹ – con cái', friend: 'bạn bè' } as const;
export type Relation = keyof typeof RELATIONS;

const spouseStars = (c: ZiweiChart) => c.palaces.find(p => p.name.startsWith('夫妻'))?.stars.filter(s => s.type === 'major').map(s => s.name) ?? [];

/** Facts for two charts, numbered continuously and prefixed with the person. */
export function pairFacts(a: ZiweiChart, b: ZiweiChart, notes: [string?, string?] = []): Fact[] {
  const fa = buildFacts(a, { calendarNote: notes[0] }), fb = buildFacts(b, { calendarNote: notes[1] });
  return [...fa.map(f => ({ ...f, text: `Người A — ${f.text}` })), ...fb.map(f => ({ ...f, text: `Người B — ${f.text}` }))]
    .filter(f => f.kind !== 'daxian' || /HIỆN TẠI/.test(f.text)) // keep prompt small: only current Đại Hạn per person
    .map((f, i) => ({ ...f, id: `F${i + 1}` }));
}

export async function runHeming(a: ZiweiChart, b: ZiweiChart, relation: Relation, questionRaw: string, provider: ProviderId, send: SseSend, signal: AbortSignal, notes: [string?, string?] = []) {
  const facts = pairFacts(a, b, notes);
  const stars = [...new Set([...spouseStars(a), ...spouseStars(b)])];
  const sources = numberSources([...(relation === 'love' ? hemingSources(stars) : []), ...classicSources(stars, 2)]);
  const question = sanitize(questionRaw, 1000);
  const task = `Phân tích HỢP HÔN giữa Người A và Người B cho mối quan hệ **${RELATIONS[relation]}**. Xét cung Mệnh, cung Phu Thê (với quan hệ tình cảm) hoặc các cung liên quan, Tứ Hóa năm sinh của mỗi người rơi vào cung nào của mình, và Đại Hạn hiện tại của cả hai. ` +
    'Trong mục Dữ kiện lá số, mỗi dòng bắt đầu bằng "Người A" hoặc "Người B". Các mục luận giải: **Tóm tắt mức độ hòa hợp** (nêu rõ đây là đánh giá truyền thống, không có điểm số khoa học), **Điểm tương hợp và dễ va chạm**, **Thời vận hiện tại của hai người**, **Gợi ý để hòa hợp**. Mỗi câu nói về một người phải ghi rõ Người A hay Người B.' +
    (question ? ` Ngoài ra trả lời câu hỏi trong khối câu hỏi.` : '');
  const messages = [
    { role: 'system' as const, content: SYSTEM_RULES },
    { role: 'user' as const, content: `${DELIMS.facts}\n${factsBlock(facts)}\n${DELIMS.end}\n\n${DELIMS.sources}\n${sources.length ? sourcesBlock(sources) : '(không có)'}\n${DELIMS.end}\n\n` +
      (question ? `${DELIMS.question}\n${question}\n${DELIMS.end}\n\n` : '') + `NHIỆM VỤ: ${task}` },
  ];
  await streamWithFallback(provider, messages, facts, sources, [a, b], { mode: 'heming', relation, injectionSuspected: looksLikeInjection(question) }, send, signal, new Date().getFullYear());
}
