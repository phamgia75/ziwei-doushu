/**
 * Zi-hour (giờ Tý) boundaries through formToBirthInfo + generateChart.
 *
 * Convention (lib/ziwei/true-solar-time.ts resolveZiweiDayOffset, applied to LOCAL MEAN SOLAR time):
 *  · 'next-day' (default): 23:00–23:59 = late Tý (vãn Tý) → chart date + 1, hour 0.
 *    So D 23:30 gives the same chart as D+1 00:30.
 *  · 'current-day' (and 'all-current' / 'day-cur-time-next'): late Tý keeps date D, hour 0.
 *    So D 23:30 gives the same chart as D 00:30 — the early-Tý hour of the same day, 23 h earlier.
 *  · 00:00–00:59 = early Tý: date D, hour 0 under every rule.
 * Hà Nội (105.85°E, UTC+7): solar = clock + (105.85 − 105) × 4 = clock + 3.4 min, so clock 22:59 is already late Tý
 * and 00:59 is already Sửu. Without utcOffsetMinutes the formula assumes Beijing time (−56.6 min).
 */
import assert from 'node:assert/strict';
import { formToBirthInfo } from '../../lib/ziwei/share';
import { generateChart } from '../../lib/ziwei/algorithm';
import type { LateZishiRule } from '../../lib/ziwei/true-solar-time';
import type { BirthFormState } from '../../components/BirthForm';

type Place = { longitude: number; utcOffsetMinutes?: number; province: string };
const BEIJING: Place = { longitude: 120, province: '' };
const HANOI: Place = { longitude: 105.85, utcOffsetMinutes: 420, province: 'Hà Nội' };

const form = (ymd: string, hm: string, place: Place, gender: 'male' | 'female' = 'male'): BirthFormState => {
  const [y, m, d] = ymd.split('-');
  const [hh, mm] = hm.split(':');
  return { name: '', year: y, month: String(+m), day: String(+d), clockHour: String(+hh), clockMinute: String(+mm), unknownTime: false,
    province: place.province, city: '', longitude: place.longitude, gender,
    ...(place.utcOffsetMinutes !== undefined ? { utcOffsetMinutes: place.utcOffsetMinutes } : {}) };
};
const info = (ymd: string, hm: string, place: Place, lz: LateZishiRule) => formToBirthInfo(form(ymd, hm, place), { lateZishi: lz });
const dateOf = (b: { year: number; month: number; day: number }) => `${b.year}-${String(b.month).padStart(2, '0')}-${String(b.day).padStart(2, '0')}`;
const stars = (ymd: string, hm: string, place: Place, lz: LateZishiRule) => {
  const c = generateChart(info(ymd, hm, place, lz));
  return JSON.stringify(c.palaces.map(p => [p.branch, p.stem, p.name, p.stars.map(s => `${s.name}${s.siHua ?? ''}${s.brightnessRaw ?? ''}`)]));
};
const next = (ymd: string) => { const [y, m, d] = ymd.split('-').map(Number); const t = new Date(Date.UTC(y, m - 1, d + 1)); return dateOf({ year: t.getUTCFullYear(), month: t.getUTCMonth() + 1, day: t.getUTCDate() }); };

// [clock, Beijing hour, Beijing late-Tý?, Hà Nội hour, Hà Nội late-Tý?]
const TABLE: [string, number, boolean, number, boolean][] = [
  ['22:59', 11, false, 0, true],
  ['23:00', 0, true, 0, true],
  ['23:30', 0, true, 0, true],
  ['00:00', 0, false, 0, false],
  ['00:59', 0, false, 1, false],
  ['01:00', 1, false, 1, false],
];
const DATES = ['1999-12-31', '2000-01-31', '2000-02-28', '2000-02-29', '2001-02-28', '2023-06-30', '1950-01-01', '2026-12-30'];

let checks = 0;
for (const day of DATES) {
  for (const [clock, bjHour, bjLate, hnHour, hnLate] of TABLE) {
    for (const [place, hour, late] of [[BEIJING, bjHour, bjLate], [HANOI, hnHour, hnLate]] as const) {
      for (const lz of ['next-day', 'current-day', 'all-current', 'day-cur-time-next'] as const) {
        const b = info(day, clock, place, lz);
        const label = `${day} ${clock} lon=${place.longitude} ${lz}`;
        assert.equal(b.hour, hour, `${label}: hour index`);
        assert.equal(dateOf(b), late && lz === 'next-day' ? next(day) : day, `${label}: chart date`);
        checks += 2;
      }
    }
  }
  for (const place of [BEIJING, HANOI]) {
    assert.equal(stars(day, '23:30', place, 'next-day'), stars(next(day), '00:30', place, 'next-day'), `${day} next-day 23:30 == next day 00:30`);
    assert.equal(stars(day, '23:30', place, 'current-day'), stars(day, '00:30', place, 'current-day'), `${day} current-day 23:30 == same day 00:30`);
    assert.notEqual(stars(day, '23:30', place, 'next-day'), stars(day, '23:30', place, 'current-day'), `${day} the two rules give different charts`);
    checks += 3;
  }
}

// Year end: next-day 1999-12-31 23:30 is charted on 2000-01-01 (still lunar 1999, 己卯).
const ye = generateChart(info('1999-12-31', '23:30', BEIJING, 'next-day'));
assert.deepEqual([ye.birthInfo.year, ye.birthInfo.month, ye.birthInfo.day, ye.lunarInfo.lunarYear, ye.lunarInfo.lunarDay], [2000, 1, 1, 1999, 25]);
// Feb 29: 2000-02-28 23:30 → 2000-02-29; 2000-02-29 23:30 → 2000-03-01.
assert.equal(dateOf(info('2000-02-28', '23:30', BEIJING, 'next-day')), '2000-02-29');
assert.equal(dateOf(info('2000-02-29', '23:30', HANOI, 'next-day')), '2000-03-01');
// Vietnam clock time without utcOffsetMinutes is read as Beijing time: Hà Nội 23:30 → 22:33 Hợi, no day shift.
const noTz = formToBirthInfo({ ...form('1995-08-02', '23:30', HANOI), utcOffsetMinutes: undefined }, { lateZishi: 'next-day' });
assert.deepEqual([noTz.hour, dateOf(noTz)], [11, '1995-08-02']);
checks += 6;

console.log(`zi-hour boundary: ${checks} checks passed (${DATES.length} dates × 6 clocks × Beijing/Hà Nội × 4 late-Tý rules)`);
