/**
 * Golden chart fixtures. `npx tsx scripts/verify/make-golden.ts` rewrites tests/fixtures/golden-charts.json;
 * tests/unit/golden-charts.test.ts regenerates every case and deep-compares.
 * The snapshot was first taken at upstream engine commit a600484 (engine files byte-identical to upstream;
 * this script refuses to write when `git diff a600484 -- <engine files>` is non-empty unless --force).
 * Time-dependent fields (currentAge, isCurrentDaXian, currentDaXianIndex) are excluded.
 */
import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { Lunar } from 'lunar-javascript';
import { generateChart, type LunarMonthPolicy } from '../../lib/ziwei/algorithm';
import { formToBirthInfo } from '../../lib/ziwei/share';
import type { LateZishiRule } from '../../lib/ziwei/true-solar-time';
import type { BirthFormState } from '../../components/BirthForm';
import type { ZiweiChart } from '../../lib/ziwei/types';

export const ENGINE_FILES = ['lib/ziwei/algorithm.ts', 'lib/ziwei/sihua.ts', 'lib/ziwei/constants.ts', 'lib/ziwei/school-data.ts', 'lib/ziwei/school-tables.generated.ts'];
export const FIXTURE_PATH = 'tests/fixtures/golden-charts.json';

export interface GoldenInput {
  id: string;
  form: BirthFormState;
  lateZishi?: LateZishiRule;
  leapMonth?: LunarMonthPolicy;
}

type Place = { province: string; longitude: number; utcOffsetMinutes?: number };
const BEIJING: Place = { province: '', longitude: 120 };
const HANOI: Place = { province: 'Hà Nội', longitude: 105.85, utcOffsetMinutes: 420 };
const HCMC_1965: Place = { province: 'TP.HCM', longitude: 106.70, utcOffsetMinutes: 480 }; // Saigon used UTC+8 in 1965

function form(y: number, m: number, d: number, hh: number, mm: number, gender: 'male' | 'female', place: Place = BEIJING): BirthFormState {
  return {
    name: '', year: String(y), month: String(m), day: String(d), clockHour: String(hh), clockMinute: String(mm),
    unknownTime: false, province: place.province, city: '', longitude: place.longitude,
    ...(place.utcOffsetMinutes !== undefined ? { utcOffsetMinutes: place.utcOffsetMinutes } : {}), gender,
  };
}

/** Solar date of lunar (y, m, d); m < 0 = leap month. */
function lunarToSolar(y: number, m: number, d: number): [number, number, number] {
  const s = Lunar.fromYmd(y, m, d).getSolar();
  return [s.getYear(), s.getMonth(), s.getDay()];
}

export function buildCases(): GoldenInput[] {
  const cases: GoldenInput[] = [];
  const add = (id: string, f: BirthFormState, extra: Partial<GoldenInput> = {}) => cases.push({ id, form: f, ...extra });

  // Each of the 12 double hours (clock = branch midpoint at 120°E), both genders.
  for (let h = 0; h < 12; h++) {
    add(`hour${h}-male`, form(1990, 6, 15, (h * 2) % 24, 10, 'male'));
    add(`hour${h}-female`, form(1991, 3, 8, (h * 2) % 24, 10, 'female'));
  }
  // Zi-hour boundaries on New Year's Eve, both late-zi conventions.
  for (const [hh, mm] of [[22, 59], [23, 0], [23, 30], [0, 0], [0, 59], [1, 0]]) {
    for (const lz of ['next-day', 'current-day'] as const) {
      add(`zi-1999-12-31-${hh}:${mm}-${lz}`, form(1999, 12, 31, hh, mm, 'male'), { lateZishi: lz });
    }
  }
  // Month / year ends.
  add('month-end-1988-01-31', form(1988, 1, 31, 12, 0, 'female'));
  add('month-end-2001-04-30', form(2001, 4, 30, 9, 30, 'male'));
  add('feb29-2000', form(2000, 2, 29, 15, 0, 'female'));
  add('year-end-1975-12-31', form(1975, 12, 31, 18, 0, 'male'));
  // Lunar New Year eve / day.
  for (const y of [1985, 2000, 2024]) {
    const [sy, sm, sd] = lunarToSolar(y, 1, 1);
    const eve = new Date(Date.UTC(sy, sm - 1, sd - 1));
    add(`tet-eve-${y}`, form(eve.getUTCFullYear(), eve.getUTCMonth() + 1, eve.getUTCDate(), 10, 0, 'male'));
    add(`tet-day-${y}`, form(sy, sm, sd, 10, 0, 'female'));
  }
  // Leap-month births under each of the 4 policies (2020 闰四月, 2023 闰二月, 1987 闰六月).
  for (const [ly, lm, ld] of [[2020, -4, 5], [2020, -4, 20], [2023, -2, 10], [2023, -2, 25], [1987, -6, 16]]) {
    const [sy, sm, sd] = lunarToSolar(ly, lm, ld);
    for (const lp of ['split', 'prev-month', 'next-month', 'origin-month'] as const) {
      add(`leap-${ly}-L${-lm}-${ld}-${lp}`, form(sy, sm, sd, 8, 0, ld % 2 ? 'male' : 'female'), { leapMonth: lp });
    }
  }
  // Range extremes.
  add('min-1950-01-01', form(1950, 1, 1, 0, 30, 'male'));
  add('min-1950-02-17', form(1950, 2, 17, 6, 0, 'female'));
  add('max-2026-02-17', form(2026, 2, 17, 12, 0, 'male'));
  add('max-2026-12-31', form(2026, 12, 31, 23, 30, 'female'));
  // Vietnam: Hà Nội 105.85°E UTC+7; Sài Gòn 106.70°E on UTC+8 (1965).
  add('hanoi-1985-01-21-tet-vn', form(1985, 1, 21, 10, 0, 'male', HANOI));
  add('hanoi-2007-02-17-tet-vn', form(2007, 2, 17, 7, 15, 'female', HANOI));
  add('hanoi-1995-08-02-23:30', form(1995, 8, 2, 23, 30, 'male', HANOI));
  add('hanoi-1995-08-02-00:20', form(1995, 8, 2, 0, 20, 'female', HANOI));
  add('hanoi-2010-10-10-12:58', form(2010, 10, 10, 12, 58, 'male', HANOI));
  add('hcmc-1965-05-19-23:10-utc8', form(1965, 5, 19, 23, 10, 'female', HCMC_1965));
  add('hcmc-1965-05-19-06:00-utc8', form(1965, 5, 19, 6, 0, 'male', HCMC_1965));
  return cases;
}

export function snapshot(chart: ZiweiChart) {
  return {
    birthInfo: { year: chart.birthInfo.year, month: chart.birthInfo.month, day: chart.birthInfo.day, hour: chart.birthInfo.hour, gender: chart.birthInfo.gender },
    lunarInfo: chart.lunarInfo,
    mingGongBranch: chart.mingGongBranch,
    shenGongBranch: chart.shenGongBranch,
    wuxingJu: chart.wuxingJu,
    wuxingJuName: chart.wuxingJuName,
    ziweiPos: chart.ziweiPos,
    mingZhu: chart.mingZhu,
    shenZhu: chart.shenZhu,
    yinYangGender: chart.yinYangGender,
    palaces: chart.palaces.map(p => ({
      branch: p.branch, stem: p.stem, name: p.name, isShenGong: p.isShenGong, daXianAge: p.daXianAge,
      stars: p.stars.map(s => ({ name: s.name, type: s.type, siHua: s.siHua ?? null, brightnessRaw: s.brightnessRaw ?? null })),
    })),
    // The engine emits no daXians[].siHua (flying-star fields removed upstream, see algorithm.ts): ranges only.
    daXians: chart.daXians.map(d => ({ startAge: d.startAge, endAge: d.endAge, palaceBranch: d.palaceBranch, palaceName: d.palaceName })),
  };
}

export function runCase(c: GoldenInput) {
  const birthInfo = formToBirthInfo(c.form, c.lateZishi ? { lateZishi: c.lateZishi } : undefined);
  return snapshot(generateChart(birthInfo, c.leapMonth ? { leapMonth: c.leapMonth } : undefined));
}

if (process.argv[1]?.endsWith('make-golden.ts')) {
  const engineDiff = execSync(`git diff a600484 -- ${ENGINE_FILES.join(' ')}`).toString();
  if (engineDiff && !process.argv.includes('--force')) {
    console.error('engine files differ from a600484; pass --force to snapshot anyway');
    process.exit(1);
  }
  const head = execSync('git rev-parse --short HEAD').toString().trim();
  const cases = buildCases();
  const out = {
    meta: {
      note: 'Regression snapshot, not ground truth. Regenerate with: npx tsx scripts/verify/make-golden.ts',
      engineBaseline: 'a600484',
      engineFilesIdenticalToBaseline: engineDiff === '',
      repoHead: head,
      iztro: '2.6.1',
      lunarJavascript: '1.7.7',
    },
    cases: cases.map(c => ({ ...c, snapshot: runCase(c) })),
  };
  // One case per line: reviewable diffs without a 1 MB pretty-printed file.
  const body = out.cases.map(c => JSON.stringify(c)).join(',\n');
  writeFileSync(FIXTURE_PATH, `{"meta":${JSON.stringify(out.meta)},\n"cases":[\n${body}\n]}\n`);
  console.log(`wrote ${cases.length} golden charts to ${FIXTURE_PATH}`);
}
