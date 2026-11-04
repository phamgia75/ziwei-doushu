/**
 * Analysis only (does not change the engine): every Gregorian day 1950–2026 where the Vietnamese lunar
 * date (UTC+7) differs from the Chinese one (UTC+8), and whether that would change the natal chart.
 *
 * Chart impact is measured with plain iztro on both sides so only the calendar differs:
 *   CN side = astro.bySolar(date)           (iztro's own CN lunar conversion, = what the engine uses)
 *   VN side = astro.byLunar(VN lunar date)  (fixLeap=true, same as the engine's default 'split')
 * Sanity: byLunar(CN lunar date) must reproduce bySolar on the CN side (asserted below).
 * A chart "changes" when any star (major/minor/adjective + Tứ Hóa), mệnh/thân branch or ngũ hành cục differs.
 *
 * Run: npx tsx scripts/verify/vn-cn-lunar-diff.ts
 */
import { astro } from 'iztro';
import { convertSolar2Lunar, type LunarDate } from '../../lib/calendar/vn-lunar';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fingerprint(a: any): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stars = a.palaces.flatMap((p: any) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [...p.majorStars, ...p.minorStars, ...p.adjectiveStars].map((s: any) => `${s.name}@${p.earthlyBranch}${s.mutagen ?? ''}`),
  ).sort();
  return [a.earthlyBranchOfSoulPalace, a.earthlyBranchOfBodyPalace, a.fiveElementsClass, ...stars].join('|');
}

const ymd = (t: number) => { const d = new Date(t); return { y: d.getUTCFullYear(), m: d.getUTCMonth() + 1, d: d.getUTCDate() }; };
const fmt = (l: LunarDate) => `${l.year}-${l.leap ? 'L' : ''}${l.month}-${l.day}`;

/** chartChangedHours = null: the VN lunar date (day 30, or a leap month) does not exist in the CN calendar, so iztro byLunar cannot build it. */
export interface DiffDay { date: string; vn: LunarDate; cn: LunarDate; chartChangedHours: number | null; }

export function computeVnCnDiff(from = 1950, to = 2026) {
  const days: DiffDay[] = [];
  for (let t = Date.UTC(from, 0, 1); t <= Date.UTC(to, 11, 31); t += 86_400_000) {
    const { y, m, d } = ymd(t);
    const vn = convertSolar2Lunar(d, m, y, 7);
    const cn = convertSolar2Lunar(d, m, y, 8);
    if (vn.year === cn.year && vn.month === cn.month && vn.day === cn.day && vn.leap === cn.leap) continue;
    let changed: number | null = 0;
    for (let hour = 0; hour < 12; hour++) {
      const cnChart = fingerprint(astro.bySolar(`${y}-${m}-${d}`, hour, '男', true, 'zh-CN'));
      const cnViaLunar = fingerprint(astro.byLunar(`${cn.year}-${cn.month}-${cn.day}`, hour, '男', cn.leap, true, 'zh-CN'));
      if (cnChart !== cnViaLunar) throw new Error(`byLunar(CN) != bySolar at ${y}-${m}-${d} h${hour}: method unsound`);
      let vnChart: string;
      try {
        const a = astro.byLunar(`${vn.year}-${vn.month}-${vn.day}`, hour, '男', vn.leap, true, 'zh-CN');
        // byLunar goes lunar→solar through the CN calendar; a VN leap month the CN year lacks is silently read as
        // the plain month (e.g. VN 1985 nhuận 2). Treat any such round-trip mismatch as unrepresentable.
        const l = a.rawDates.lunarDate;
        if (l.lunarYear !== vn.year || l.lunarMonth !== vn.month || l.lunarDay !== vn.day || l.isLeap !== vn.leap) { changed = null; break; }
        vnChart = fingerprint(a);
      } catch { changed = null; break; }
      if (vnChart !== cnChart) changed!++;
    }
    days.push({ date: `${y}-${m}-${d}`, vn, cn, chartChangedHours: changed });
  }
  // Group consecutive days into ranges.
  const ranges: { from: string; to: string; days: number; example: string }[] = [];
  let prevT = -Infinity;
  for (const day of days) {
    const [y, m, d] = day.date.split('-').map(Number);
    const t = Date.UTC(y, m - 1, d);
    if (t - prevT === 86_400_000) { const r = ranges[ranges.length - 1]; r.to = day.date; r.days++; }
    else ranges.push({ from: day.date, to: day.date, days: 1, example: `VN ${fmt(day.vn)} / CN ${fmt(day.cn)}` });
    prevT = t;
  }
  return { days, ranges };
}

if (process.argv[1]?.endsWith('vn-cn-lunar-diff.ts')) {
  const { days, ranges } = computeVnCnDiff();
  const unrep = days.filter(d => d.chartChangedHours === null).length;
  const changedDays = days.filter(d => (d.chartChangedHours ?? 0) > 0).length;
  const allHours = days.filter(d => d.chartChangedHours === 12).length;
  const yearDiff = days.filter(d => d.vn.year !== d.cn.year).length;
  const leapDiff = days.filter(d => d.vn.leap !== d.cn.leap).length;
  console.log(`dates where VN (UTC+7) lunar date != CN (UTC+8): ${days.length} in ${ranges.length} ranges`);
  console.log(`  of which lunar YEAR differs (Tết shift): ${yearDiff}; leap flag differs: ${leapDiff}`);
  console.log(`  chart changes for >=1 of 12 hours: ${changedDays}/${days.length}; for all 12 hours: ${allHours}/${days.length}`);
  console.log(`  VN date not representable in CN calendar (day 30 of a 29-day CN month, or a VN leap month the CN year lacks): ${unrep}`);
  console.log(`  representable but chart identical for every hour: ${days.length - unrep - changedDays}`);
  for (const r of ranges) console.log(`  ${r.from} .. ${r.to} (${r.days}d)  first day: ${r.example}`);
}
