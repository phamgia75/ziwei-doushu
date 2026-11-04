/**
 * Vietnamese golden fixtures: `npx tsx scripts/verify/make-vn-golden.ts` rewrites tests/fixtures/vn-golden.json;
 * tests/unit/vn-golden.test.ts regenerates in memory, deep-compares, and checks the output is byte-identical twice.
 * Each case runs the UI path: province (vn-places) → vnUtcOffsetMinutes → formToBirthInfo → applyCalendar → generateChart.
 * Deterministic: no clock, no randomness, keys sorted, no repo HEAD in meta. Excludes date-dependent fields (currentAge …).
 * Regression snapshot of this engine, not ground truth.
 */
import { writeFileSync } from 'node:fs';
import { findVnCity, VN_PROVINCES } from '../../lib/geo/vn-places';
import { vnUtcOffsetMinutes } from '../../lib/geo/vn-time';
import { applyCalendar, type CalendarMode } from '../../lib/calendar/vn-chart';
import { formToBirthInfo } from '../../lib/ziwei/share';
import { generateChart } from '../../lib/ziwei/algorithm';
import type { LateZishiRule } from '../../lib/ziwei/true-solar-time';

export const VN_GOLDEN_PATH = 'tests/fixtures/vn-golden.json';

export interface VnCase {
  id: string; date: string; time: string; province: string; city: string; gender: 'male' | 'female';
  lateZishi: LateZishiRule; calendar: CalendarMode; eot: boolean;
}

export function buildVnCases(): VnCase[] {
  const out: VnCase[] = [];
  const add = (id: string, date: string, time: string, province: string, city: string, o: Partial<VnCase> = {}) =>
    out.push({ id, date, time, province, city, gender: out.length % 2 ? 'female' : 'male', lateZishi: 'next-day', calendar: 'cn', eot: false, ...o });
  const HCM = 'TP. Hồ Chí Minh', HN = 'Hà Nội', QT = 'Quảng Trị';
  // Time-zone transitions (South follows Asia/Ho_Chi_Minh; North lat ≥ 17 is +7 from 1945-09-02).
  add('tz-1910-lmt', '1910-06-01', '23:00', HCM, HCM);
  add('tz-1947-gap', '1947-04-01', '00:30', HCM, HCM);
  add('tz-1945-09-overlap-hn', '1945-09-01', '23:30', HN, HN);
  add('tz-1955-overlap', '1955-07-01', '00:30', HCM, HCM);
  add('tz-1959-before', '1959-12-31', '22:30', HCM, HCM);
  add('tz-1959-gap', '1959-12-31', '23:30', HCM, HCM);
  add('tz-1960-after', '1960-01-01', '00:30', HCM, HCM);
  add('tz-1960-after-current', '1960-01-01', '00:30', HCM, HCM, { lateZishi: 'current-day' });
  add('tz-1960-0130', '1960-01-01', '01:30', HCM, HCM);
  add('tz-1975-before', '1975-06-12', '22:30', HCM, HCM);
  add('tz-1975-overlap', '1975-06-12', '23:30', HCM, HCM);
  add('tz-1975-after', '1975-06-13', '00:30', HCM, HCM);
  add('tz-1965-vinh-linh', '1965-05-19', '23:10', QT, 'Vĩnh Linh');
  add('tz-1965-dong-ha', '1965-05-19', '23:10', QT, 'Đông Hà');
  add('tz-1968-hue', '1968-01-30', '02:00', 'Thừa Thiên Huế', 'Huế', { calendar: 'vn' });
  // Late Tý across VN / CN Tết, both rules × both calendars (Hà Nội 23:30 = solar 23:33.4).
  for (const d of ['1985-01-20', '1985-02-19', '2007-02-16', '2007-02-17', '1968-01-28', '1968-01-29']) {
    for (const lz of ['next-day', 'current-day'] as const) for (const cal of ['cn', 'vn'] as const) {
      add(`tet-${d}-${lz}-${cal}`, d, '23:30', HN, HN, { lateZishi: lz, calendar: cal });
    }
  }
  // Feb 29.
  add('feb29-2000-hn', '2000-02-29', '23:30', HN, HN);
  add('feb29-2024-hn', '2024-02-29', '23:30', HN, HN, { calendar: 'vn' });
  add('feb29-1960-hcm-utc8', '1960-02-29', '23:30', HCM, HCM);
  add('feb28-1960-hcm-utc8', '1960-02-28', '23:59', HCM, HCM);
  // Equation of time extremes.
  for (const eot of [false, true]) {
    add(`eot-2000-11-03-${eot ? 'on' : 'off'}`, '2000-11-03', '22:50', HN, HN, { eot });
    add(`eot-2000-02-11-${eot ? 'on' : 'off'}`, '2000-02-11', '23:05', HN, HN, { eot });
  }
  // Longitude extremes in vn-places.
  add('lon-west-lai-chau', '1990-06-01', '23:05', 'Lai Châu', 'Lai Châu');
  add('lon-east-tuy-hoa', '1990-06-01', '22:45', 'Phú Yên', 'Tuy Hòa');
  add('lon-east-nha-trang-utc8', '1965-06-01', '23:45', 'Khánh Hòa', 'Nha Trang');
  // VN leap month 2/1985 has no CN twin (applyCalendar 'vn' → unavailable, CN chart kept); CN leap 4/2020.
  add('leap-vn-1985-03-25-vn', '1985-03-25', '10:00', HN, HN, { calendar: 'vn' });
  add('leap-vn-1985-03-25-cn', '1985-03-25', '10:00', HN, HN);
  add('leap-cn-2020-06-01-vn', '2020-06-01', '10:00', HN, HN, { calendar: 'vn' });
  // Spread over provinces, years, hours (fixed arithmetic, no randomness).
  for (let i = 0; i < 10; i++) {
    const p = VN_PROVINCES[(i * 7 + 3) % VN_PROVINCES.length];
    const y = 1950 + i * 8, m = 1 + (i * 5) % 12, d = 1 + (i * 11) % 28, h = (i * 5 + 1) % 24;
    add(`spread-${i}`, `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`, `${String(h).padStart(2, '0')}:${String((i * 17) % 60).padStart(2, '0')}`,
      p.name, p.cities[p.cities.length - 1].name, { calendar: i % 2 ? 'vn' : 'cn', lateZishi: i % 3 ? 'next-day' : 'current-day' });
  }
  return out;
}

export function runVnCase(c: VnCase) {
  const city = findVnCity(c.province, c.city);
  if (!city || city.name !== c.city) throw new Error(`${c.id}: unknown place ${c.province}/${c.city}`);
  const [y, m, d] = c.date.split('-').map(Number), [hh, mm] = c.time.split(':').map(Number);
  const utcOffsetMinutes = vnUtcOffsetMinutes(city.lat, y, m, d, hh, mm); // as BirthForm does
  const b = formToBirthInfo({ name: '', year: String(y), month: String(m), day: String(d), clockHour: String(hh), clockMinute: String(mm), unknownTime: false,
    province: c.province, city: c.city, longitude: city.longitude, utcOffsetMinutes, gender: c.gender }, { lateZishi: c.lateZishi, equationOfTime: c.eot });
  const cal = applyCalendar(b, c.calendar);
  const chart = generateChart(cal.info);
  const ymd = (x: { year: number; month: number; day: number }) => `${x.year}-${String(x.month).padStart(2, '0')}-${String(x.day).padStart(2, '0')}`;
  const major: Record<string, number> = {}, sihua: Record<string, string> = {};
  for (const p of chart.palaces) for (const s of p.stars) {
    if (s.type === 'major') major[s.name] = p.branch;
    if (s.siHua) sihua[s.siHua] = `${s.name}@${p.branch}`;
  }
  const L = chart.lunarInfo;
  return {
    utcOffsetMinutes, chartDate: ymd(b), engineDate: ymd(chart.birthInfo), remapped: cal.remapped, unavailable: cal.unavailable,
    hour: chart.birthInfo.hour, lunar: [L.lunarYear, L.lunarMonth, L.lunarDay, L.isLeapMonth], yearPillar: L.fourPillars[0],
    ming: chart.mingGongBranch, shen: chart.shenGongBranch, ju: chart.wuxingJu, major, sihua,
  };
}

/** JSON with object keys sorted recursively. */
function canon(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(canon).join(',')}]`;
  if (v && typeof v === 'object') return `{${Object.keys(v).sort().map(k => `${JSON.stringify(k)}:${canon((v as Record<string, unknown>)[k])}`).join(',')}}`;
  return JSON.stringify(v);
}

export function renderVnGolden(): string {
  const meta = { note: 'Regression snapshot, not ground truth. Regenerate: npx tsx scripts/verify/make-vn-golden.ts', fields: 'lunar=[year,month,day,isLeap]; major/sihua branch 0=Tý..11=Hợi' };
  const lines = buildVnCases().map(c => canon({ ...c, out: runVnCase(c) }));
  return `{"meta":${canon(meta)},\n"cases":[\n${lines.join(',\n')}\n]}\n`;
}

if (process.argv[1]?.endsWith('make-vn-golden.ts')) {
  const text = renderVnGolden();
  writeFileSync(VN_GOLDEN_PATH, text);
  console.log(`wrote ${buildVnCases().length} VN golden cases to ${VN_GOLDEN_PATH}`);
}
