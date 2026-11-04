// lib/calendar/vn-lunar.ts (Hồ Ngọc Đức algorithm) vs lunar-javascript, every day 1950-01-01..2026-12-31.
import assert from 'node:assert/strict';
import { Solar } from 'lunar-javascript';
import { convertSolar2Lunar, vnCnLunarDiffers } from '../../lib/calendar/vn-lunar';

const mismatches: string[] = [];
let days = 0;
for (let t = Date.UTC(1950, 0, 1); t <= Date.UTC(2026, 11, 31); t += 86_400_000) {
  const dt = new Date(t);
  const y = dt.getUTCFullYear(), m = dt.getUTCMonth() + 1, d = dt.getUTCDate();
  const l = Solar.fromYmd(y, m, d).getLunar();
  const ref = { year: l.getYear(), month: Math.abs(l.getMonth()), day: l.getDay(), leap: l.getMonth() < 0 };
  const got = convertSolar2Lunar(d, m, y, 8);
  days++;
  if (got.year !== ref.year || got.month !== ref.month || got.day !== ref.day || got.leap !== ref.leap) {
    mismatches.push(`${y}-${m}-${d} hnd=${JSON.stringify(got)} lunar-javascript=${JSON.stringify(ref)}`);
  }
}
assert.equal(days, 28124);
assert.deepEqual(mismatches, [], `UTC+8 mismatches vs lunar-javascript:\n${mismatches.slice(0, 50).join('\n')}`);

// Known Vietnamese vs Chinese Tết differences.
const lunar1 = { month: 1, day: 1, leap: false };
assert.deepEqual(convertSolar2Lunar(21, 1, 1985, 7), { year: 1985, ...lunar1 }, 'Tết 1985 VN = 1985-01-21');
assert.deepEqual(convertSolar2Lunar(20, 2, 1985, 8), { year: 1985, ...lunar1 }, 'Tết 1985 CN = 1985-02-20');
assert.deepEqual(convertSolar2Lunar(17, 2, 2007, 7), { year: 2007, ...lunar1 }, 'Tết 2007 VN = 2007-02-17');
assert.deepEqual(convertSolar2Lunar(18, 2, 2007, 8), { year: 2007, ...lunar1 }, 'Tết 2007 CN = 2007-02-18');
assert.equal(vnCnLunarDiffers(2007, 2, 17).differs, true);
assert.equal(vnCnLunarDiffers(2026, 2, 17).differs, false);

console.log(`vn-lunar: ${days} days 1950-2026 match lunar-javascript at UTC+8; VN/CN Tết cases ok`);
