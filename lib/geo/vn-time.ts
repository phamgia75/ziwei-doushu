/**
 * Historical standard UTC offset of the clock time at a Vietnamese birthplace.
 *
 * Assumptions:
 *  - South of 17°N (the 1954–1975 demarcation line, Bến Hải river): follow the IANA zone
 *    Asia/Ho_Chi_Minh as shipped with the runtime's ICU data. It encodes French Indochina
 *    (LMT +7:06:30 before 1906/1911, +7, +8 1943–45, +9 Mar–Sep 1945, +8 1947–1955)
 *    and the Republic of Vietnam's +8 from 1960-01-01 to 1975-06-13.
 *  - North (lat ≥ 17): +7 from 1945-09-02 (DRV declaration) on; before that the same
 *    Asia/Ho_Chi_Minh rule (French Indochina applied to the whole country).
 *  - The entered wall-clock time is local time at that offset; ambiguous/skipped minutes
 *    at a transition resolve to the offset found by two probes (first probe at +7): skipped minutes
 *    (gap) get the pre-transition offset, repeated minutes (overlap) the post-transition one, i.e. the
 *    later instant (tests/unit/vn-boundaries.test.ts).
 *  - No daylight saving: Vietnam has never observed it.
 */
const ZONE = 'Asia/Ho_Chi_Minh';
const NORTH_LAT = 17;
let fmt: Intl.DateTimeFormat | undefined;

/** Offset (minutes, may be fractional for LMT) of Asia/Ho_Chi_Minh at a UTC instant. */
function zoneOffsetAt(utcMs: number): number {
  fmt ??= new Intl.DateTimeFormat('en-US', { timeZone: ZONE, timeZoneName: 'longOffset' });
  const name = fmt.formatToParts(new Date(utcMs)).find(p => p.type === 'timeZoneName')?.value ?? '';
  const m = /GMT([+-])(\d{1,2}):?(\d{2})?(?::(\d{2}))?/.exec(name);
  if (!m) return 0; // "GMT" alone = UTC
  const min = Number(m[2]) * 60 + Number(m[3] ?? 0) + Number(m[4] ?? 0) / 60;
  return m[1] === '-' ? -min : min;
}

export function vnUtcOffsetMinutes(lat: number, y: number, m: number, d: number, hh: number, mm: number): number {
  if (lat >= NORTH_LAT && (y > 1945 || (y === 1945 && (m > 9 || (m === 9 && d >= 2))))) return 420;
  const wall = Date.UTC(y, m - 1, d, hh, mm);
  const first = zoneOffsetAt(wall - 420 * 60_000);
  return zoneOffsetAt(wall - first * 60_000);
}

/** 420 → "UTC+7", 330 → "UTC+5:30", 426.5 → "UTC+7:06:30". */
export function formatUtcOffset(min: number): string {
  const sign = min < 0 ? '-' : '+';
  const totalSec = Math.round(Math.abs(min) * 60);
  const h = Math.floor(totalSec / 3600);
  const mi = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `UTC${sign}${h}${mi || s ? `:${pad(mi)}` : ''}${s ? `:${pad(s)}` : ''}`;
}
