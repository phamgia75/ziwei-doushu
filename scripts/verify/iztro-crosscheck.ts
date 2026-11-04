/**
 * Engine (lib/ziwei/algorithm.ts generateChart) vs plain iztro 2.6.1 (astro.bySolar, default config).
 *
 * Isolation: algorithm.ts calls astro.config({ yearDivide: 'normal', brightness }) at import time, a global
 * mutation of iztro. So plain-iztro results are computed FIRST, the config is asserted to be iztro's
 * default, and only then is the engine loaded with a dynamic import(). (iztro's default yearDivide is
 * already 'normal'; the brightness override cannot move stars and the engine discards iztro brightness anyway.)
 *
 * Compared: lunar date (engine's lunar-javascript vs iztro's lunar-lite), year stem/branch, mệnh/thân branch,
 * ngũ hành cục, 14 major stars, natal Tứ Hóa, đại hạn ranges, 6 lucky (左辅右弼文昌文曲天魁天钺) + 6 sha
 * (擎羊陀罗火星铃星地空地劫). Also checks the engine's đại hạn against the textbook direction rule. Brightness is NOT compared: the engine replaces it wholesale with its SB_QS table.
 *
 * Caveat: iztro is the engine's own dependency, so this is a consistency check (did the engine's adapter and
 * school patches change anything unexpected?), not an independent verification of iztro itself.
 *
 * Run: npx tsx scripts/verify/iztro-crosscheck.ts [n=3000] [seed=20261104]
 */
import { astro } from 'iztro';

const BR = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
const MAJOR = ['紫微', '天机', '太阳', '武曲', '天同', '廉贞', '天府', '太阴', '贪狼', '巨门', '天相', '天梁', '七杀', '破军'];
const AUX = ['左辅', '右弼', '文昌', '文曲', '天魁', '天钺', '擎羊', '陀罗', '火星', '铃星', '地空', '地劫'];

export interface Birth { y: number; m: number; d: number; hour: number; gender: 'male' | 'female' }
interface Projection {
  lunar: string; yearGZ: string; ming: number; shen: number; ju: string;
  stars: Record<string, number>; sihua: Record<string, string>; decadal: Record<number, string>;
}

export function sampleBirths(n: number, seed: number): Birth[] {
  let s = seed >>> 0; // mulberry32
  const rnd = () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const t0 = Date.UTC(1950, 0, 1), days = (Date.UTC(2026, 11, 31) - t0) / 86_400_000 + 1;
  return Array.from({ length: n }, () => {
    const dt = new Date(t0 + Math.floor(rnd() * days) * 86_400_000);
    return { y: dt.getUTCFullYear(), m: dt.getUTCMonth() + 1, d: dt.getUTCDate(), hour: Math.floor(rnd() * 12), gender: rnd() < 0.5 ? 'male' : 'female' };
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function projectIztro(a: any): Projection {
  const p: Projection = { lunar: '', yearGZ: a.rawDates.chineseDate.yearly.join(''), ming: BR.indexOf(a.earthlyBranchOfSoulPalace), shen: BR.indexOf(a.earthlyBranchOfBodyPalace), ju: a.fiveElementsClass, stars: {}, sihua: {}, decadal: {} };
  const l = a.rawDates.lunarDate;
  p.lunar = `${l.lunarYear}-${l.isLeap ? 'L' : ''}${l.lunarMonth}-${l.lunarDay}`;
  for (const pal of a.palaces) {
    const b = BR.indexOf(pal.earthlyBranch);
    p.decadal[b] = pal.decadal.range.join('-');
    for (const s of [...pal.majorStars, ...pal.minorStars]) {
      if (MAJOR.includes(s.name) || AUX.includes(s.name)) p.stars[s.name] = b;
      if (s.mutagen) p.sihua[s.name] = s.mutagen;
    }
  }
  return p;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function projectEngine(chart: any, rawLunar: { lunarYear: number; rawLunarMonth: number; rawLunarDay: number }): Projection {
  const p: Projection = { lunar: '', yearGZ: '', ming: chart.mingGongBranch, shen: chart.shenGongBranch, ju: chart.wuxingJuName, stars: {}, sihua: {}, decadal: {} };
  const STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
  p.yearGZ = STEMS[chart.lunarInfo.yearStem] + BR[chart.lunarInfo.yearBranch];
  p.lunar = `${rawLunar.lunarYear}-${rawLunar.rawLunarMonth < 0 ? 'L' : ''}${Math.abs(rawLunar.rawLunarMonth)}-${rawLunar.rawLunarDay}`;
  for (const pal of chart.palaces) {
    if (pal.daXianAge) p.decadal[pal.branch] = pal.daXianAge.join('-');
    for (const s of pal.stars) {
      if (MAJOR.includes(s.name) || AUX.includes(s.name)) p.stars[s.name] = pal.branch;
      if (s.siHua) p.sihua[s.name] = s.siHua;
    }
  }
  return p;
}

export interface Diff { birth: Birth; field: string; iztro: unknown; engine: unknown; category: string }

/** Expected school differences, each traced to a source comment in lib/ziwei/algorithm.ts. */
function classify(field: string, iz: Projection, en: Projection): string {
  // applySchoolKuiyue: default KY1 table differs from iztro only in 辛 years (天魁寅/天钺午 vs iztro 魁午钺寅).
  if ((field === 'star:天魁' || field === 'star:天钺') && iz.yearGZ[0] === '辛'
      && en.stars['天魁'] === iz.stars['天钺'] && en.stars['天钺'] === iz.stars['天魁']) return 'expected:kuiyue-KY1-xin-year';
  return 'UNEXPLAINED';
}

export async function runCrosscheck(n: number, seed: number) {
  const births = sampleBirths(n, seed);
  const cfg = astro.getConfig();
  if (cfg.yearDivide !== 'normal' || Object.keys(cfg.brightness ?? {}).length) throw new Error('iztro config already mutated before plain run');
  const plain = births.map(b => projectIztro(astro.bySolar(`${b.y}-${b.m}-${b.d}`, b.hour, b.gender === 'male' ? '男' : '女', true, 'zh-CN')));

  const engine = await import('../../lib/ziwei/algorithm');
  if (!Object.keys(astro.getConfig().brightness ?? {}).length) throw new Error('expected engine import to mutate iztro config');

  const diffs: Diff[] = [];
  births.forEach((b, i) => {
    const chart = engine.generateChart({ year: b.y, month: b.m, day: b.d, hour: b.hour, gender: b.gender });
    const en = projectEngine(chart, engine.resolveEffectiveLunarDate(b.y, b.m, b.d, 'split'));
    const iz = plain[i];
    const fields: [string, unknown, unknown][] = [
      ['lunar', iz.lunar, en.lunar], ['yearGZ', iz.yearGZ, en.yearGZ], ['ming', iz.ming, en.ming], ['shen', iz.shen, en.shen], ['ju', iz.ju, en.ju],
      ...[...MAJOR, ...AUX].map(s => [`star:${s}`, iz.stars[s], en.stars[s]] as [string, unknown, unknown]),
      ['sihua', JSON.stringify(Object.entries(iz.sihua).sort()), JSON.stringify(Object.entries(en.sihua).sort())],
      ...BR.map((_, k) => [`decadal:${BR[k]}`, iz.decadal[k], en.decadal[k]] as [string, unknown, unknown]),
    ];
    for (const [field, a, e] of fields) if (a !== e) diffs.push({ birth: b, field, iztro: a, engine: e, category: classify(field, iz, en) });
    // Textbook rule, independent of iztro: dương nam / âm nữ thuận (clockwise), âm nam / dương nữ nghịch;
    // first đại hạn starts in mệnh at age = cục number, each spans 10 years.
    const yang = chart.lunarInfo.yearStem % 2 === 0;
    const step = (yang === (b.gender === 'male')) ? 1 : 11;
    const want = Array.from({ length: 12 }, (_, k) => `${(chart.mingGongBranch + k * step) % 12}:${chart.wuxingJu + 10 * k}-${chart.wuxingJu + 10 * k + 9}`).join(',');
    const got = chart.daXians.map(dx => `${dx.palaceBranch}:${dx.startAge}-${dx.endAge}`).join(',');
    if (want !== got) diffs.push({ birth: b, field: 'rule:daxian-direction', iztro: want, engine: got, category: 'UNEXPLAINED' });
  });
  const byCategory: Record<string, number> = {};
  for (const d of diffs) byCategory[d.category] = (byCategory[d.category] ?? 0) + 1;
  const xinBirths = plain.filter(p => p.yearGZ[0] === '辛').length;
  return { n, seed, diffs, byCategory, xinBirths, fieldsPerBirth: 5 + MAJOR.length + AUX.length + 1 + 12 };
}

if (process.argv[1]?.endsWith('iztro-crosscheck.ts')) {
  const n = Number(process.argv[2] ?? 3000), seed = Number(process.argv[3] ?? 20261104);
  runCrosscheck(n, seed).then(r => {
    console.log(`births=${r.n} seed=${r.seed} fields/birth=${r.fieldsPerBirth} comparisons=${r.n * r.fieldsPerBirth}`);
    console.log(`辛-year births: ${r.xinBirths}`);
    console.log('differences by category:', r.byCategory);
    for (const d of r.diffs.filter(d => d.category === 'UNEXPLAINED').slice(0, 30)) console.log('  UNEXPLAINED', JSON.stringify(d));
    if (r.diffs.some(d => d.category === 'UNEXPLAINED')) process.exit(1);
  });
}
