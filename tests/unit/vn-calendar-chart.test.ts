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
