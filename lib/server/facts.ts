/**
 * Deterministic chart facts for the LLM. Every fact has a stable ID ([F1], [F2] …) so generated
 * text can cite it and the UI can trace a claim back to the chart. Facts are computed only from
 * the server-generated chart — never from client-supplied text — and contain no name, birth date
 * or birthplace (data minimisation; the interpretation does not need them).
 */
import type { ZiweiChart, Palace, Star } from '@/lib/ziwei/types';
import { getLiuNianSiHua, getDaXianSiHua, getYearBranchIndex } from '@/lib/ziwei/sihua';
import { getDaXianIndexForYear } from '@/lib/ziwei/yunxian-context';
import { term, stemBranchVi, BRANCHES_VI } from '@/lib/i18n/terms';

export interface Fact { id: string; kind: 'basic' | 'palace' | 'sihua' | 'daxian' | 'liunian' | 'pattern'; text: string; palaceBranch?: number }

const SIHUA_ORDER = ['禄', '权', '科', '忌'] as const;
const bi = (s: string) => `${term(s)} (${s})`; // bilingual name, helps the model match Chinese sources

function starLabel(s: Star): string {
  const parts = [term(s.name)];
  if (s.brightnessRaw) parts.push(`[${term(s.brightnessRaw)}]`);
  if (s.siHua) parts.push(`Hóa ${term(s.siHua)}`);
  return parts.join(' ');
}

const palaceOfStar = (chart: ZiweiChart, star: string): Palace | undefined =>
  chart.palaces.find(p => p.stars.some(s => s.name === star));

const palaceVi = (p: Palace | undefined) => (p ? `cung ${term(p.name)}` : 'không có trên lá số');

function sihuaLine(chart: ZiweiChart, transforms: Record<string, string>): string {
  return SIHUA_ORDER.map(h => `Hóa ${term(h)}: ${term(transforms[h])} → ${palaceVi(palaceOfStar(chart, transforms[h]))}`).join('; ');
}

export function buildFacts(chart: ZiweiChart, opts: { year?: number; patterns?: string[] } = {}): Fact[] {
  const facts: Fact[] = [];
  const add = (kind: Fact['kind'], text: string, palaceBranch?: number) =>
    facts.push({ id: `F${facts.length + 1}`, kind, text, palaceBranch });
  const byBranch = (b: number) => chart.palaces.find(p => p.branch === b);
  const ming = byBranch(chart.mingGongBranch);
  const shen = byBranch(chart.shenGongBranch);
  const li = chart.lunarInfo;

  add('basic', `Năm sinh âm lịch can chi ${stemBranchVi(li.yearStem, li.yearBranch)}; ${term(chart.yinYangGender)}; ` +
    `${bi(chart.wuxingJuName)}; Mệnh Chủ ${term(chart.mingZhu)}, Thân Chủ ${term(chart.shenZhu)}; tuổi âm hiện tại ${chart.currentAge}.`);
  add('basic', `Cung Mệnh tại ${BRANCHES_VI[chart.mingGongBranch]}; Thân cư ${palaceVi(shen)} (chi ${BRANCHES_VI[chart.shenGongBranch]}).`,
    chart.mingGongBranch);

  // Palaces in traditional order starting from Mệnh (counter-clockwise by branch)
  for (let i = 0; i < 12; i++) {
    const p = byBranch((chart.mingGongBranch - i + 12) % 12);
    if (!p) continue;
    const majors = p.stars.filter(s => s.type === 'major').map(starLabel);
    const others = p.stars.filter(s => s.type !== 'major').map(starLabel);
    const head = `${bi(p.name)} tại ${stemBranchVi(p.stem, p.branch)}${p.isShenGong ? ' (Thân cư đây)' : ''}` +
      (p.daXianAge ? `, Đại Hạn tuổi ${p.daXianAge[0]}–${p.daXianAge[1]}` : '');
    const main = majors.length
      ? `chính tinh: ${majors.join(', ')}`
      : `Vô Chính Diệu (không chính tinh), mượn chính tinh cung đối ${term(p.borrowedFromName ?? '')}: ${(p.borrowedStars ?? []).map(term).join(', ') || '—'}`;
    const self = p.selfSihua?.length ? `; Tự Hóa: ${p.selfSihua.map(x => `${term(x.starName)} tự hóa ${term(x.siHua)}`).join(', ')}` : '';
    const nb = (d: number) => term(byBranch((p.branch + d) % 12)?.name);
    const sf = `; Tam Phương Tứ Chính: đối cung ${nb(6)}, tam hợp ${nb(4)} và ${nb(8)}; giáp ${nb(11)} và ${nb(1)}`;
    add('palace', `${head}: ${main}; phụ/sát/tạp tinh: ${others.join(', ') || '—'}${self}${sf}.`, p.branch);
  }

  add('sihua', `Tứ Hóa năm sinh (can ${stemBranchVi(li.yearStem, li.yearBranch).split(' ')[0]}): ` +
    SIHUA_ORDER.map(h => {
      const p = chart.palaces.find(pp => pp.stars.some(s => s.siHua === h));
      const s = p?.stars.find(x => x.siHua === h);
      return `Hóa ${term(h)}: ${term(s?.name)} → ${palaceVi(p)}`;
    }).join('; ') + '.');

  chart.daXians.forEach((dx, i) => {
    const p = byBranch(dx.palaceBranch);
    const sh = getDaXianSiHua(chart, i);
    const cur = i === chart.currentDaXianIndex ? ' — ĐẠI HẠN HIỆN TẠI' : '';
    add('daxian', `Đại Hạn ${dx.startAge}–${dx.endAge} tuổi tại ${palaceVi(p)} (${stemBranchVi(p?.stem ?? 0, dx.palaceBranch)})${cur}` +
      (sh ? `; Tứ Hóa Đại Hạn: ${sihuaLine(chart, sh.transforms)}` : '') + '.', dx.palaceBranch);
  });

  const year = opts.year ?? new Date().getFullYear();
  const ln = getLiuNianSiHua(year);
  const lnMing = byBranch(getYearBranchIndex(year));
  const dxIdx = getDaXianIndexForYear(chart, year);
  add('liunian', `Lưu Niên ${year} (${stemBranchVi(ln.stemIndex, getYearBranchIndex(year))}): Mệnh lưu niên tại ${palaceVi(lnMing)}; ` +
    `Tứ Hóa lưu niên: ${sihuaLine(chart, ln.transforms)}; ` +
    (dxIdx >= 0 ? `thuộc Đại Hạn ${chart.daXians[dxIdx].startAge}–${chart.daXians[dxIdx].endAge}.` : 'chưa vào Đại Hạn đầu (Đồng Hạn).'),
    lnMing?.branch);

  for (const p of opts.patterns ?? []) add('pattern', `Cách cục nhận diện theo quy tắc: ${p}.`);
  return facts;
}

export const factsBlock = (facts: Fact[]) => facts.map(f => `[${f.id}] ${f.text}`).join('\n');
