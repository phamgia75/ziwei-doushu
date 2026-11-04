// Vietnamese-calendar charting: the remapped solar date carries the Vietnamese lunar date.
import assert from 'node:assert/strict';
import { applyCalendar, cnSolarForVnLunar } from '../../lib/calendar/vn-chart';
import { convertSolar2Lunar } from '../../lib/calendar/vn-lunar';
import { generateChart } from '../../lib/ziwei/algorithm';

// Tết 1985: Vietnam 1985-01-21 = lunar 1/1 Ất Sửu; China celebrated 1985-02-20.
assert.deepEqual(cnSolarForVnLunar(1985, 1, 21), { year: 1985, month: 2, day: 20 });
const c = generateChart({ ...applyCalendar({ year: 1985, month: 1, day: 21, hour: 6, gender: 'male' as const }, 'vn').info });
assert.equal(c.lunarInfo.lunarMonth, 1); assert.equal(c.lunarInfo.lunarDay, 1); assert.equal(c.lunarInfo.yearStem, 1); // 乙
// Tết 2007: Vietnam 2007-02-17, China 2007-02-18
assert.deepEqual(cnSolarForVnLunar(2007, 2, 17), { year: 2007, month: 2, day: 18 });
// ordinary day: unchanged; 'cn' mode never remaps
assert.deepEqual(cnSolarForVnLunar(1990, 6, 15), { year: 1990, month: 6, day: 15 });
assert.equal(applyCalendar({ year: 1985, month: 1, day: 21 }, 'cn').remapped, false);
// sweep: whenever a mapping exists, its CN lunar date equals the VN lunar date of the birth
let mapped = 0, missing = 0;
for (let t = Date.UTC(1950, 0, 1); t <= Date.UTC(2026, 11, 31); t += 3 * 86_400_000) {
  const d = new Date(t), y = d.getUTCFullYear(), m = d.getUTCMonth() + 1, dd = d.getUTCDate();
  const s = cnSolarForVnLunar(y, m, dd);
  if (!s) { missing++; continue; }
  mapped++;
  assert.deepEqual(convertSolar2Lunar(s.day, s.month, s.year, 8), convertSolar2Lunar(dd, m, y, 7), `${y}-${m}-${dd}`);
}
console.log(`vn calendar charting: Tết cases + ${mapped} sampled days mapped, ${missing} without a CN equivalent`);
// /api/reading must look the dataset up by the remapped chart date (static check of the handler)
import { readFileSync } from 'node:fs';
assert.match(readFileSync('app/api/reading/route.ts', 'utf8'), /const cb = chart\.birthInfo;\s+const rec = await lookupRecord\(cb\.year/);
// historical rule: the Vietnamese calendar used UTC+8 before 1968 (whole country) and in the South until 1975
import { vnCalendarTz, vnCalendarDiff } from '../../lib/calendar/vn-chart';
assert.equal(vnCalendarTz(1965, 2, 1, 'north'), 8);
assert.equal(vnCalendarTz(1968, 1, 29, 'north'), 7);
assert.equal(vnCalendarTz(1968, 1, 30, 'south'), 8);
assert.equal(vnCalendarTz(1976, 1, 31, 'south'), 7);
assert.equal(vnCalendarDiff(1965, 2, 1, 'north').differs, false, 'pre-1968: VN = CN calendar, no warning');
assert.equal(applyCalendar({ year: 1965, month: 2, day: 1 }, 'vn').remapped, false);
const north68 = generateChart(applyCalendar({ year: 1968, month: 1, day: 29, hour: 6, gender: 'male' as const }, 'vn', 'north').info);
assert.deepEqual([north68.lunarInfo.lunarMonth, north68.lunarInfo.lunarDay], [1, 1], 'Hà Nội: Tết 1968 = Jan 29');
const south68 = generateChart(applyCalendar({ year: 1968, month: 1, day: 30, hour: 6, gender: 'male' as const }, 'vn', 'south').info);
assert.deepEqual([south68.lunarInfo.lunarMonth, south68.lunarInfo.lunarDay], [1, 1], 'Huế/Sài Gòn: Tết 1968 = Jan 30');
console.log('vn calendar historical rule (pre-1968 UTC+8, South UTC+8 until 1975) pass');
