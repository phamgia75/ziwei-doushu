/**
 * Post-generation checks on LLM output (structured output validation):
 *  1. Placement claims — a sentence that places ONE star in ONE "cung X" with a locative verb is
 *     checked against the computed chart. Relational sentences (chiếu, hội, xung, giáp, mượn,
 *     nếu/khi hypotheticals) are skipped: they don't assert where a star sits.
 *  2. Citations — [F#]/[S#] must refer to facts/sources actually supplied.
 *  3. Language — Han characters outside parentheses / 《》 are flagged.
 */
import type { ZiweiChart } from '@/lib/ziwei/types';
import { term } from '@/lib/i18n/terms';

export interface PlacementIssue { sentence: string; star: string; claimedPalace: string; actualPalace: string | null }
export interface ValidationReport {
  placementsChecked: number;
  placementIssues: PlacementIssue[];
  citedFacts: string[];
  citedSources: string[];
  invalidRefs: string[];
  hanOutsideParens: number;
}

const LOCATIVE = /(?<!\p{L})(tại|ở|nằm|tọa|toạ|cư|đóng|thủ|an|có)(?!\p{L})/iu; // \b is ASCII-only in JS
const RELATIONAL = /(chiếu|hội|xung|giáp|mượn|tam hợp|đối cung|nếu|giả sử|khi gặp|lưu niên|đại hạn|tiểu hạn)/i;

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function validateOutput(text: string, chart: ZiweiChart | ZiweiChart[], factIds: string[], sourceIds: string[]): ValidationReport {
  const charts = Array.isArray(chart) ? chart : [chart];
  const report: ValidationReport = { placementsChecked: 0, placementIssues: [], citedFacts: [], citedSources: [], invalidRefs: [], hanOutsideParens: 0 };

  // citations
  const refs = [...new Set([...text.matchAll(/\[([FS]\d+)\]/g)].map(m => m[1]))];
  const facts = new Set(factIds), sources = new Set(sourceIds);
  for (const r of refs) {
    if (r.startsWith('F')) (facts.has(r) ? report.citedFacts : report.invalidRefs).push(r);
    else (sources.has(r) ? report.citedSources : report.invalidRefs).push(r);
  }

  report.hanOutsideParens = (text.replace(/[（(][^）)]*[）)]/g, '').replace(/《[^》]*》/g, '').match(/\p{Script=Han}/gu) ?? []).length;

  // placements (single-chart only; for two charts a sentence can't be attributed reliably)
  if (charts.length !== 1) return report;
  const c = charts[0];
  const starPalace = new Map<string, string>(); // vi star → vi palace
  for (const p of c.palaces) for (const s of p.stars) starPalace.set(term(s.name), term(p.name));
  const starNames = [...starPalace.keys()].sort((a, b) => b.length - a.length);
  const palaceNames = [...new Set(c.palaces.map(p => term(p.name)))];
  const palaceRe = new RegExp(`cung (${palaceNames.map(escapeRe).join('|')})`, 'gi');

  for (const sentence of text.split(/(?<=[.!?;\n])\s+/)) {
    if (!LOCATIVE.test(sentence) || RELATIONAL.test(sentence)) continue;
    let rest = sentence;
    const stars: string[] = [];
    for (const n of starNames) if (rest.includes(n)) { stars.push(n); rest = rest.split(n).join(' '); }
    const palaces = [...new Set([...sentence.matchAll(palaceRe)].map(m => palaceNames.find(p => p.toLowerCase() === m[1].toLowerCase())!))];
    // one palace, 1–3 stars ("cung Quan Lộc có Tử Vi và Thiên Phủ"): every star must sit in that palace
    if (stars.length < 1 || stars.length > 3 || palaces.length !== 1) continue;
    for (const star of stars) {
      report.placementsChecked++;
      const actual = starPalace.get(star) ?? null;
      if (actual !== palaces[0]) report.placementIssues.push({ sentence: sentence.trim().slice(0, 240), star, claimedPalace: palaces[0], actualPalace: actual });
    }
  }
  return report;
}

/** Vietnamese note appended to the answer when checks fail, so the user sees it inline. */
export function validationNote(r: ValidationReport): string {
  const lines: string[] = [];
  for (const i of r.placementIssues) {
    lines.push(`- Câu “${i.sentence}” đặt **${i.star}** ở cung ${i.claimedPalace}, nhưng lá số tính được: ${i.actualPalace ? `cung ${i.actualPalace}` : 'sao này không có trên lá số'}. Hãy dựa vào lá số.`);
  }
  if (r.invalidRefs.length) lines.push(`- Trích dẫn không tồn tại: ${r.invalidRefs.join(', ')}.`);
  if (r.hanOutsideParens > 10) lines.push('- Câu trả lời còn lẫn chữ Hán chưa dịch.');
  return lines.length ? `\n\n---\n**⚠️ Kiểm chứng tự động**\n${lines.join('\n')}` : '';
}
