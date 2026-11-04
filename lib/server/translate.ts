/**
 * On-demand Chinese → Vietnamese translation with the LOCAL Ollama model only (texts derived
 * from a user's chart never go to an external provider for translation).
 *
 * - Paragraph-level chunks (short chunks stop the model from "continuing" the source).
 * - Glossary terms present in the chunk are injected into the prompt and checked in the output.
 * - Validation: leftover Han outside parentheses, length ratio, missing glossary terms → one strict
 *   retry; if still failing the best attempt is returned with ok=false (UI labels it).
 * - Cache: data/cache/translations/<sha256>.json keyed by model + prompt version + source text.
 *   The dataset reuses snippets across charts heavily, so the hit rate is high.
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { glossaryFor } from '@/lib/i18n/terms';
import { complete, pickOllamaModel } from './ai/providers';

const PROMPT_VERSION = 'tr-v1';
const HAN = /\p{Script=Han}/u;
const cacheDir = () => join(process.cwd(), 'data/cache/translations');

const EXTRA_TERMS = [
  '倪海厦 = Nghê Hải Hạ', '倪师 = thầy Nghê', '《天纪》 = 《Thiên Kỷ》', '紫微斗数全书 = Tử Vi Đẩu Số Toàn Thư',
  '紫微斗数全集 = Tử Vi Đẩu Số Toàn Tập', '骨髓赋 = Cốt Tủy Phú', '三方四正 = Tam Phương Tứ Chính',
  '大限 = Đại Hạn', '流年 = Lưu Niên', '庙旺 = Miếu Vượng', '落陷 = Hãm địa', '空宫 = Vô Chính Diệu',
];

export interface Translated { zh: string; vi: string; ok: boolean; issues: string[]; cached: boolean }

/** Split into paragraphs; long ones are split at sentence ends so each chunk stays small. */
export function splitParagraphs(text: string, max = 500): string[] {
  const out: string[] = [];
  for (const para of text.split(/\n{2,}/)) {
    if (!para.trim()) continue;
    if (para.length <= max) { out.push(para); continue; }
    let cur = '';
    for (const s of para.split(/(?<=[。！？；\n])/)) {
      if (cur && cur.length + s.length > max) { out.push(cur); cur = ''; }
      cur += s;
    }
    if (cur) out.push(cur);
  }
  return out;
}

/** Problems with a candidate translation (empty list = passes). */
export function validateTranslation(zh: string, vi: string, glossary: string[]): string[] {
  const issues: string[] = [];
  const outside = vi.replace(/[（(][^）)]*[）)]/g, '').replace(/《[^》]*》/g, '');
  if (HAN.test(outside)) issues.push('còn chữ Hán chưa dịch');
  const zhLen = (zh.match(/\p{Script=Han}/gu) ?? []).length;
  if (zhLen >= 20) {
    const ratio = vi.replace(/\s+/g, ' ').length / zhLen;
    if (ratio < 1.3) issues.push(`bản dịch quá ngắn (tỉ lệ ${ratio.toFixed(1)})`);
    if (ratio > 7) issues.push(`bản dịch dài bất thường, có thể bịa thêm (tỉ lệ ${ratio.toFixed(1)})`);
  }
  const lower = vi.toLocaleLowerCase('vi');
  const missing = glossary.map(g => g.split(' = ')[1]).filter(v => v && !lower.includes(v.toLocaleLowerCase('vi')));
  if (missing.length) issues.push(`thiếu thuật ngữ: ${missing.slice(0, 5).join(', ')}`);
  return issues;
}

function systemPrompt(glossary: string[], strict: boolean): string {
  return [
    'Bạn là dịch giả chuyên ngành Tử Vi Đẩu Số. Dịch ĐÚNG đoạn văn tiếng Trung người dùng gửi sang tiếng Việt tự nhiên, chính xác, đủ ý.',
    'Không thêm, không bớt, không giải thích, không viết tiếp nội dung. Giữ nguyên định dạng Markdown và các ký hiệu (**, ▶, ✦, ▍, gạch đầu dòng). Tiêu đề dạng 【…】 dịch thành 【…】 tiếng Việt.',
    'Trích dẫn cổ thư trong ngoặc kép: dịch nghĩa sang tiếng Việt. Không để lại chữ Hán (chỉ được ghi chữ Hán trong ngoặc đơn sau thuật ngữ nếu thật cần).',
    'Bắt buộc dùng đúng thuật ngữ sau:', ...[...glossary, ...EXTRA_TERMS].map(g => `- ${g}`),
    strict ? 'LƯU Ý: lần dịch trước bị lỗi (còn chữ Hán, thiếu thuật ngữ hoặc độ dài sai). Hãy dịch lại cẩn thận, sát nghĩa từng câu.' : '',
    'Chỉ trả về bản dịch.',
  ].filter(Boolean).join('\n');
}

const keyOf = (model: string, zh: string) => createHash('sha256').update(`${PROMPT_VERSION}\n${model}\n${zh}`).digest('hex');

export async function translateChunk(zh: string, signal?: AbortSignal): Promise<Translated> {
  if (!HAN.test(zh)) return { zh, vi: zh, ok: true, issues: [], cached: true };
  const model = await pickOllamaModel();
  const file = join(cacheDir(), `${keyOf(model, zh)}.json`);
  if (existsSync(file)) return { ...JSON.parse(readFileSync(file, 'utf8')), cached: true };

  const glossary = glossaryFor(zh).slice(0, 40);
  const maxTokens = Math.min(4096, 200 + zh.length * 4);
  let best: { vi: string; issues: string[] } | null = null;
  for (const strict of [false, true]) {
    const vi = (await complete('ollama', model, [
      { role: 'system', content: systemPrompt(glossary, strict) },
      { role: 'user', content: zh },
    ], { signal, temperature: strict ? 0 : 0.1, maxTokens })).trim();
    const issues = validateTranslation(zh, vi, glossary);
    if (!best || issues.length < best.issues.length) best = { vi, issues };
    if (!issues.length) break;
  }
  const result = { zh, vi: best!.vi, ok: best!.issues.length === 0, issues: best!.issues };
  mkdirSync(cacheDir(), { recursive: true });
  writeFileSync(file, JSON.stringify({ ...result, model, promptVersion: PROMPT_VERSION }));
  return { ...result, cached: false };
}

export function clearTranslationCache(): number {
  if (!existsSync(cacheDir())) return 0;
  const n = readdirSync(cacheDir()).length;
  rmSync(cacheDir(), { recursive: true, force: true });
  return n;
}
