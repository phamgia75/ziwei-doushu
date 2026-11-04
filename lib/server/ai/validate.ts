/**
 * Post-generation checks on LLM output (structured output validation):
 *  1. Claims — every recognised claim about the calculated chart (placements, tam hợp, xung/hội chiếu,
 *     giáp, Tứ Hóa, compatibility per person) is verified deterministically (./claims.ts).
 *  2. Structure — the answer must separate "Dữ kiện lá số" (each line cites [F#]) from
 *     "Luận giải truyền thống"; uncited lines in the facts section are reported as unverified.
 *  3. Citations — [F#]/[S#] must refer to facts/sources actually supplied.
 *  4. Language — Han characters outside parentheses / 《》 are flagged.
 */
import type { ZiweiChart } from '@/lib/ziwei/types';
import { verifyClaims, type Claim } from './claims';
import { findTermIssues } from '@/lib/i18n/terminology';

export interface PlacementIssue { sentence: string; detail: string }
export interface ValidationReport {
  claims: Claim[];
  summary: { verified: number; contradicted: number; unverified: number };
  /** Kept for API compatibility: number of placement claims checked / contradicted ones. */
  placementsChecked: number;
  placementIssues: PlacementIssue[];
  structure: { factsSection: boolean; interpretationSection: boolean };
  citedFacts: string[];
  citedSources: string[];
  invalidRefs: string[];
  hanOutsideParens: number;
  /** Non-standard Vietnamese terminology (lib/i18n/terminology.ts VARIANTS). */
  termIssues: { found: string; canonical: string }[];
}

export const FACTS_HEADING = 'Dữ kiện lá số';
export const INTERP_HEADING = 'Luận giải truyền thống';
const norm = (s: string) => s.replace(/[*#_]/g, '').trim().toLowerCase();

/** Lines of the "Dữ kiện lá số" section (until the next bold/markdown heading). */
function factsSectionLines(text: string): string[] | null {
  const lines = text.split('\n');
  const start = lines.findIndex(l => norm(l).startsWith(norm(FACTS_HEADING)));
  if (start < 0) return null;
  const out: string[] = [];
  for (const l of lines.slice(start + 1)) {
    if (/^\s*(#{1,6}\s|\*\*[^*]+\*\*\s*:?\s*$)/.test(l)) break;
    if (l.trim()) out.push(l.trim());
  }
  return out;
}

export function validateOutput(text: string, chart: ZiweiChart | ZiweiChart[], factIds: string[], sourceIds: string[], year?: number): ValidationReport {
  const charts = Array.isArray(chart) ? chart : [chart];
  const claims = verifyClaims(text, charts.length === 1 ? [{ chart: charts[0] }] : charts.map((c, i) => ({ chart: c, label: i === 0 ? 'A' as const : 'B' as const })), year);

  const facts = factsSectionLines(text);
  for (const l of facts ?? []) {
    if (!/\[\[?F\d+\]?\]/.test(l) && /\p{L}{3,}/u.test(l)) claims.push({ kind: 'relation', status: 'unverified', sentence: l.replace(/^[-*•]\s*/, '').slice(0, 220), detail: 'dòng trong mục Dữ kiện lá số không trích mã [F#]' });
  }

  const refs = [...new Set([...text.matchAll(/\[\[?([FS]\d+)\]?\]/g)].map(m => m[1]))];
  const fset = new Set(factIds), sset = new Set(sourceIds);
  const citedFacts: string[] = [], citedSources: string[] = [], invalidRefs: string[] = [];
  for (const r of refs) {
    if (r.startsWith('F')) (fset.has(r) ? citedFacts : invalidRefs).push(r);
    else (sset.has(r) ? citedSources : invalidRefs).push(r);
  }
  const count = (st: Claim['status']) => claims.filter(c => c.status === st).length;
  const placements = claims.filter(c => c.kind === 'placement');
  return {
    claims,
    summary: { verified: count('verified'), contradicted: count('contradicted'), unverified: count('unverified') },
    placementsChecked: placements.length,
    placementIssues: placements.filter(c => c.status === 'contradicted').map(c => ({ sentence: c.sentence, detail: c.detail })),
    structure: { factsSection: facts !== null, interpretationSection: text.split('\n').some(l => norm(l).startsWith(norm(INTERP_HEADING))) },
    citedFacts, citedSources, invalidRefs,
    termIssues: [...new Map(findTermIssues(text).filter(i => i.kind === 'variant').map(i => [i.found, { found: i.found, canonical: i.canonical }])).values()],
    hanOutsideParens: (text.replace(/[（(][^）)]*[）)]/g, '').replace(/《[^》]*》/g, '').match(/\p{Script=Han}/gu) ?? []).length,
  };
}

/** Vietnamese note appended to the answer when checks fail, so the user sees it inline. */
export function validationNote(r: ValidationReport): string {
  const lines: string[] = [];
  for (const c of r.claims.filter(x => x.status === 'contradicted').slice(0, 8)) {
    lines.push(`- ✗ ${c.person ? `Người ${c.person}: ` : ''}“${c.sentence}” — **sai so với lá số**: ${c.detail}.`);
  }
  const unv = r.claims.filter(x => x.status === 'unverified');
  if (unv.length) lines.push(`- ? ${unv.length} nhận định về quan hệ sao/cung **chưa được kiểm chứng tự động** — xem mục “Kiểm chứng” bên dưới; đừng coi là dữ kiện tính toán.`);
  if (r.invalidRefs.length) lines.push(`- Trích dẫn không tồn tại: ${r.invalidRefs.join(', ')}.`);
  if (!r.structure.factsSection) lines.push(`- Câu trả lời không tách riêng mục “${FACTS_HEADING}”; mọi nhận định dưới đây là luận giải, chỉ các mã [F#] là dữ kiện tính toán.`);
  if (r.hanOutsideParens > 10) lines.push('- Câu trả lời còn lẫn chữ Hán chưa dịch.');
  if (r.termIssues.length) lines.push(`- Thuật ngữ chưa chuẩn: ${r.termIssues.map(i => `${i.found} → ${i.canonical}`).join(', ')}.`);
  return lines.length ? `\n\n---\n**⚠️ Kiểm chứng tự động**\n${lines.join('\n')}` : '';
}
