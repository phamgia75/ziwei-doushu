/**
 * Optional Vietnamese-calendar charting without touching the engine.
 * The engine derives the lunar date from the solar date with the Chinese (UTC+8) calendar. To chart
 * by the Vietnamese (UTC+7) lunar date we pick the solar date whose CHINESE lunar date equals the
 * birth's VIETNAMESE lunar date and chart that day (same hour). Zi Wei star placement depends only on
 * the lunar year/month/day/hour, so the result is the chart a Vietnamese-calendar practitioner draws.
 * convertSolar2Lunar(·, 8) matches lunar-javascript on every day 1950–2026 (tests/unit/vn-lunar.test.ts).
 */
import { convertSolar2Lunar, type LunarDate } from './vn-lunar';
import { shiftGregorianDate } from '@/lib/ziwei/true-solar-time';

export type CalendarMode = 'cn' | 'vn';
const same = (a: LunarDate, b: LunarDate) => a.year === b.year && a.month === b.month && a.day === b.day && a.leap === b.leap;

/** Solar date whose Chinese lunar date equals the Vietnamese lunar date of (y, m, d); null if that lunar day doesn't exist in the Chinese calendar. */
export function cnSolarForVnLunar(y: number, m: number, d: number): { year: number; month: number; day: number } | null {
  const vn = convertSolar2Lunar(d, m, y, 7);
  if (same(vn, convertSolar2Lunar(d, m, y, 8))) return { year: y, month: m, day: d };
  for (let off = 1; off <= 45; off++) {
    for (const o of [off, -off]) {
      const s = shiftGregorianDate({ year: y, month: m, day: d }, o);
      if (same(vn, convertSolar2Lunar(s.day, s.month, s.year, 8))) return s;
    }
  }
  return null;
}

/** Apply the calendar convention to a chart-date BirthInfo. `remapped` tells the UI to explain it. */
export function applyCalendar<T extends { year: number; month: number; day: number }>(info: T, mode: CalendarMode | undefined): { info: T; remapped: boolean; unavailable: boolean } {
  if (mode !== 'vn') return { info, remapped: false, unavailable: false };
  const s = cnSolarForVnLunar(info.year, info.month, info.day);
  if (!s) return { info, remapped: false, unavailable: true };
  const remapped = s.year !== info.year || s.month !== info.month || s.day !== info.day;
  return { info: { ...info, ...s }, remapped, unavailable: false };
}
