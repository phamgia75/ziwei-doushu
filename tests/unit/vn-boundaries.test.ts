/**
 * Vietnam boundary conditions: historical time zones (IANA Asia/Ho_Chi_Minh + the lat ≥ 17 North rule),
 * Giờ Tý across month/year ends, Feb 29 and VN-vs-CN Tết, longitude extremes, equation of time.
 *
 * Oracle: an independent absolute-instant computation — UTC = wall − offset, local mean solar time =
 * UTC + longitude × 4 min (+ EoT) — compared with the UI path vnUtcOffsetMinutes → formToBirthInfo → applyCalendar.
 * The "lunar date the engine sees" is lunar-javascript (the engine's own library) on the date handed to generateChart;
 * a subset is confirmed with generateChart itself.
 *
 * Chosen behaviour at wall-clock discontinuities (asserted below):
 *  · gap (skipped minutes, clock moved forward): the PRE-transition offset is used;
 *  · overlap (repeated minutes, clock moved back): the POST-transition offset (+7) is used, i.e. the later instant.
 */
import assert from 'node:assert/strict';
import { Solar } from 'lunar-javascript';
import { vnUtcOffsetMinutes } from '../../lib/geo/vn-time';
import { applyCalendar } from '../../lib/calendar/vn-chart';
import { convertSolar2Lunar } from '../../lib/calendar/vn-lunar';
import { formToBirthInfo, calcTrueSolarBranch } from '../../lib/ziwei/share';
import { calculateTrueSolarTime, equationOfTimeMinutes, type LateZishiRule } from '../../lib/ziwei/true-solar-time';
import { generateChart } from '../../lib/ziwei/algorithm';
import type { BirthFormState } from '../../components/BirthForm';

let checks = 0;
const eq = (a: unknown, b: unknown, msg: string) => { assert.deepEqual(a, b, msg); checks++; };

type Place = { name: string; lat: number; lon: number };
const HCM: Place = { name: 'TP. Hồ Chí Minh', lat: 10.78, lon: 106.70 };
const HN: Place = { name: 'Hà Nội', lat: 21.03, lon: 105.85 };
const VINH_LINH: Place = { name: 'Vĩnh Linh', lat: 17.03, lon: 107.03 };
const DONG_HA: Place = { name: 'Đông Hà', lat: 16.82, lon: 107.10 };

const MIN = 60_000, DAY = 1440;
const ymdOf = (ms: number) => { const t = new Date(ms); return `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, '0')}-${String(t.getUTCDate()).padStart(2, '0')}`; };
const dateOf = (b: { year: number; month: number; day: number }) => ymdOf(Date.UTC(b.year, b.month - 1, b.day));
const parts = (wallMs: number) => { const t = new Date(wallMs); return [t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate(), t.getUTCHours(), t.getUTCMinutes()] as const; };

// Independent zone probe (same ICU data, not the module's code path).
const fmt = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Ho_Chi_Minh', timeZoneName: 'longOffset' });
function zone(utcMs: number): number {
  const v = fmt.formatToParts(new Date(utcMs)).find(p => p.type === 'timeZoneName')!.value; // e.g. GMT+07:06:30
  const m = /GMT([+-])(\d\d):(\d\d)(?::(\d\d))?/.exec(v)!;
  return (m[1] === '-' ? -1 : 1) * (+m[2] * 60 + +m[3] + +(m[4] ?? 0) / 60);
}

function form(p: Place, wallMs: number, off: number): BirthFormState {
  const [y, m, d, hh, mm] = parts(wallMs);
  return { name: '', year: String(y), month: String(m), day: String(d), clockHour: String(hh), clockMinute: String(mm), unknownTime: false,
    province: p.name, city: p.name, longitude: p.lon, utcOffsetMinutes: off, gender: 'male' };
}
/** Oracle: chart date + double hour from the absolute instant. */
function oracle(p: Place, wallMs: number, off: number, lz: LateZishiRule, eotOn = false) {
  const [y, m, d, hh, mm] = parts(wallMs);
  const solar = wallMs / MIN - off + p.lon * 4 + (eotOn ? equationOfTimeMinutes(y, m, d, hh, mm) : 0); // absolute minutes
  const dayIdx = Math.floor(solar / DAY), mod = solar - dayIdx * DAY;
  const late = mod >= 1380;
  return { date: ymdOf((dayIdx + (late && lz === 'next-day' ? 1 : 0)) * 86_400_000), hour: late || mod < 60 ? 0 : Math.floor((mod - 60) / 120) + 1 };
}
const viaUi = (p: Place, wallMs: number, lz: LateZishiRule, eotOn = false) => {
  const [y, m, d, hh, mm] = parts(wallMs);
  const off = vnUtcOffsetMinutes(p.lat, y, m, d, hh, mm);
  const b = formToBirthInfo(form(p, wallMs, off), { lateZishi: lz, equationOfTime: eotOn });
  return { off, b, got: { date: dateOf(b), hour: b.hour }, want: oracle(p, wallMs, off, lz, eotOn) };
};
const wall = (y: number, m: number, d: number, hh = 0, mm = 0) => Date.UTC(y, m - 1, d, hh, mm);

// ── 1. Time-zone transitions ─────────────────────────────────────────────────────────────────────────
// [label, transition instant (UTC), offset before, offset after] as encoded by the runtime's tzdata.
const TRANSITIONS: [string, number, number, number][] = [
  ['1911 LMT→+7', Date.UTC(1911, 3, 30, 16, 53, 30), 426.5, 420],
  ['1943 +7→+8', Date.UTC(1942, 11, 31, 16), 420, 480],
  ['1945-03 +8→+9', Date.UTC(1945, 2, 14, 15), 480, 540],
  ['1945-09 +9→+7', Date.UTC(1945, 8, 1, 15), 540, 420],
  ['1947-04 +7→+8', Date.UTC(1947, 2, 31, 17), 420, 480],
  ['1955-07 +8→+7', Date.UTC(1955, 5, 30, 17), 480, 420],
  ['1959-12-31 23:00 +7→+8', Date.UTC(1959, 11, 31, 16), 420, 480],
  ['1975-06-13 +8→+7', Date.UTC(1975, 5, 12, 16), 480, 420],
];
const gapOverlap: Record<string, [number, number]> = {};
for (const [label, t, before, after] of TRANSITIONS) {
  eq([zone(t - 1000), zone(t)], [before, after], `${label}: runtime tzdata`);
  let gap = 0, overlap = 0;
  const start = Math.floor((t + before * MIN) / MIN) * MIN - 150 * MIN; // wall clock 150 min before the switch
  for (let w = start; w <= start + 300 * MIN; w += MIN) {
    const [y, m, d, hh, mm] = parts(w);
    const o = vnUtcOffsetMinutes(HCM.lat, y, m, d, hh, mm);
    const okBefore = zone(w - before * MIN) === before, okAfter = zone(w - after * MIN) === after;
    if (okBefore && okAfter) { overlap++; eq(o, after, `${label} ${ymdOf(w)} ${hh}:${mm} overlap → post-transition`); }
    else if (!okBefore && !okAfter) { gap++; eq(o, before, `${label} ${ymdOf(w)} ${hh}:${mm} gap → pre-transition`); }
    else eq(o, okBefore ? before : after, `${label} ${ymdOf(w)} ${hh}:${mm} unique`);
  }
  gapOverlap[label] = [gap, overlap];
}
// Gap/overlap lengths in wall-clock minutes.
eq(gapOverlap, {
  '1911 LMT→+7': [0, 6], '1943 +7→+8': [60, 0], '1945-03 +8→+9': [60, 0], '1945-09 +9→+7': [0, 120],
  '1947-04 +7→+8': [60, 0], '1955-07 +8→+7': [0, 60], '1959-12-31 23:00 +7→+8': [60, 0], '1975-06-13 +8→+7': [0, 60],
}, 'gap/overlap minutes');

// Literal edges (South).
const S = (y: number, m: number, d: number, hh: number, mm: number) => vnUtcOffsetMinutes(HCM.lat, y, m, d, hh, mm);
eq([S(1959, 12, 31, 22, 59), S(1959, 12, 31, 23, 0), S(1959, 12, 31, 23, 59), S(1960, 1, 1, 0, 0)], [420, 420, 420, 480], '1959-12-31 gap');
eq([S(1975, 6, 12, 22, 59), S(1975, 6, 12, 23, 0), S(1975, 6, 12, 23, 59), S(1975, 6, 13, 0, 0)], [480, 420, 420, 420], '1975-06-12 overlap');
eq([S(1945, 3, 14, 22, 59), S(1945, 3, 14, 23, 30), S(1945, 3, 15, 0, 0)], [480, 480, 540], '1945-03-14 gap');
eq([S(1945, 9, 1, 21, 59), S(1945, 9, 1, 22, 0), S(1945, 9, 1, 23, 59), S(1945, 9, 2, 0, 0)], [540, 420, 420, 420], '1945-09-01 overlap (2 h)');
eq([S(1947, 3, 31, 23, 59), S(1947, 4, 1, 0, 30), S(1947, 4, 1, 1, 0)], [420, 420, 480], '1947-04-01 gap');
eq([S(1955, 6, 30, 23, 59), S(1955, 7, 1, 0, 30), S(1955, 7, 1, 1, 0)], [480, 420, 420], '1955-07-01 overlap');
eq([S(1905, 1, 1, 12, 0), S(1911, 4, 30, 23, 53), S(1911, 4, 30, 23, 54)], [426.5, 426.5, 420], 'LMT era');

// North (lat ≥ 17) is +7 from 1945-09-02; before that it follows the zone. 17°N splits Vĩnh Linh / Đông Hà.
for (const [y, m, d, hh, mm] of [[1945, 9, 2, 0, 0], [1947, 4, 1, 0, 30], [1955, 7, 1, 0, 30], [1959, 12, 31, 23, 30], [1960, 1, 1, 0, 30], [1965, 5, 19, 23, 10], [1975, 6, 12, 23, 30]]) {
  for (const p of [HN, VINH_LINH]) eq(vnUtcOffsetMinutes(p.lat, y, m, d, hh, mm), 420, `${p.name} ${y}-${m}-${d} ${hh}:${mm} North +7`);
  eq(vnUtcOffsetMinutes(DONG_HA.lat, y, m, d, hh, mm), S(y, m, d, hh, mm), `Đông Hà follows the zone ${y}-${m}-${d}`);
}
eq([vnUtcOffsetMinutes(HN.lat, 1945, 9, 1, 23, 0), vnUtcOffsetMinutes(HN.lat, 1945, 6, 1, 12, 0), vnUtcOffsetMinutes(HN.lat, 1944, 6, 1, 12, 0)], [420, 540, 480], 'Hà Nội before 1945-09-02 follows the zone');
eq(vnUtcOffsetMinutes(16.99, 1965, 5, 19, 23, 10), 480, 'lat 16.99 South');
eq(vnUtcOffsetMinutes(17, 1965, 5, 19, 23, 10), 420, 'lat 17.00 North');

// Chart date / double hour for clocks 22:30–01:30 around every transition night, 4 places × 2 late-Tý rules.
const NIGHTS = [[1911, 4, 30], [1942, 12, 31], [1945, 3, 14], [1945, 9, 1], [1947, 3, 31], [1955, 6, 30], [1959, 12, 31], [1975, 6, 12], [1965, 5, 19]];
for (const [y, m, d] of NIGHTS) {
  for (let w = wall(y, m, d, 22, 30); w <= wall(y, m, d + 1, 1, 30); w += 5 * MIN) {
    for (const p of [HCM, HN, VINH_LINH, DONG_HA]) for (const lz of ['next-day', 'current-day'] as const) {
      const r = viaUi(p, w, lz);
      eq(r.got, r.want, `${p.name} ${ymdOf(w)} ${parts(w)[3]}:${parts(w)[4]} ${lz} off=${r.off}`);
      eq(r.b.hour, calcTrueSolarBranch(parts(w)[3], parts(w)[4], p.lon, r.off), 'form preview branch == chart branch');
    }
  }
}
// Documented examples.
const lit = (p: Place, w: number, lz: LateZishiRule) => { const r = viaUi(p, w, lz); return [r.off, r.got.date, r.got.hour]; };
eq(lit(HCM, wall(1959, 12, 31, 23, 30), 'next-day'), [420, '1960-01-01', 0], 'HCM gap 23:30 → +7 → solar 23:36.8 → late Tý');
eq(lit(HCM, wall(1960, 1, 1, 0, 30), 'next-day'), [480, '1960-01-01', 0], 'HCM 00:30 +8 = same instant as gap 23:30');
eq(lit(HCM, wall(1960, 1, 1, 0, 30), 'current-day'), [480, '1959-12-31', 0], 'HCM 1960-01-01 00:30 +8 current-day → previous day');
eq(lit(HCM, wall(1975, 6, 12, 23, 30), 'next-day'), [420, '1975-06-13', 0], 'HCM overlap 23:30 → +7 (the +8 reading would be 22:36.8 Hợi 06-12)');
eq(lit(VINH_LINH, wall(1965, 5, 19, 23, 10), 'next-day'), [420, '1965-05-20', 0], 'Vĩnh Linh 1965 23:10 → 23:18 late Tý');
eq(lit(DONG_HA, wall(1965, 5, 19, 23, 10), 'next-day'), [480, '1965-05-19', 11], 'Đông Hà 1965 23:10 → 22:18 Hợi');
eq(lit(HCM, wall(1910, 6, 1, 23, 0), 'next-day'), [426.5, '1910-06-02', 0], 'LMT (PLMT 106.625°E): solar = clock + 0.3 min → 23:00.3 late Tý');

// ── 2. Giờ Tý matrix: dates × clocks × places × late-Tý rule × calendar × EoT ───────────────────────
const DATES = ['1999-01-31', '1986-04-30', '2001-06-30', '1999-12-31', '1975-12-31', '1959-12-31', '1960-02-28', '1960-02-29', '2000-02-28', '2000-02-29',
  '2024-02-28', '2024-02-29', '1985-01-20', '1985-01-21', '1985-02-19', '2007-02-16', '2007-02-17', '1968-01-28', '1968-01-29'];
const CLOCKS = ['22:50', '22:59', '23:00', '23:30', '23:59', '00:00', '00:30', '00:59', '01:00'];
const lunarJs = (b: { year: number; month: number; day: number }) => { const l = Solar.fromYmd(b.year, b.month, b.day).getLunar(); return { year: l.getYear(), month: Math.abs(l.getMonth()), day: l.getDay(), leap: l.getMonth() < 0 }; };
let unavailable = 0;
for (const ymd of DATES) for (const clock of CLOCKS) {
  const [y, m, d] = ymd.split('-').map(Number), [hh, mm] = clock.split(':').map(Number);
  const w = hh < 12 ? wall(y, m, d + 1, hh, mm) : wall(y, m, d, hh, mm); // 00:xx = the night after `ymd`
  for (const p of [HN, HCM]) for (const lz of ['next-day', 'current-day'] as const) for (const eotOn of [false, true]) {
    const r = viaUi(p, w, lz, eotOn);
    eq(r.got, r.want, `${p.name} ${ymdOf(w)} ${clock} ${lz} eot=${eotOn}`);
    const cn = applyCalendar(r.b, 'cn'), vn = applyCalendar(r.b, 'vn');
    eq(dateOf(cn.info), r.got.date, 'cn never remaps');
    if (vn.unavailable) { unavailable++; eq(dateOf(vn.info), r.got.date, 'vn unavailable → falls back to the CN date'); }
    else eq(lunarJs(vn.info), convertSolar2Lunar(r.b.day, r.b.month, r.b.year, 7), `vn: engine sees the VN lunar date of ${r.got.date}`);
    eq(vn.info.hour, r.b.hour, 'calendar remap keeps the hour');
  }
}
eq(unavailable > 0, true, 'some VN lunar days (e.g. 1/30 Ất Sửu 1985) do not exist in the CN calendar');

// Late-Tý shift crossing VN Tết but not CN Tết, and vice versa (Hà Nội 23:30 → solar 23:33.4), via generateChart.
const TET: [string, LateZishiRule, 'cn' | 'vn', string, [number, number, number, number], boolean][] = [
  // birth date, rule, calendar, chart date (before remap), [lunarYear, lunarMonth, lunarDay, yearStem] the engine sees, unavailable
  ['1985-01-20', 'next-day', 'cn', '1985-01-21', [1984, 12, 1, 0], false],
  ['1985-01-20', 'next-day', 'vn', '1985-01-21', [1985, 1, 1, 1], false], // crosses VN Tết only
  ['1985-01-20', 'current-day', 'cn', '1985-01-20', [1984, 11, 30, 0], false],
  ['1985-01-20', 'current-day', 'vn', '1985-01-20', [1984, 12, 30, 0], false],
  ['1985-02-19', 'next-day', 'cn', '1985-02-20', [1985, 1, 1, 1], false], // crosses CN Tết only
  ['1985-02-19', 'next-day', 'vn', '1985-02-20', [1985, 2, 1, 1], false],
  ['1985-02-19', 'current-day', 'cn', '1985-02-19', [1984, 12, 30, 0], false],
  ['1985-02-19', 'current-day', 'vn', '1985-02-19', [1984, 12, 30, 0], true], // VN 1/30/1985 has no CN twin → CN chart (Giáp Tý!)
  ['2007-02-16', 'next-day', 'cn', '2007-02-17', [2006, 12, 30, 2], false],
  ['2007-02-16', 'next-day', 'vn', '2007-02-17', [2007, 1, 1, 3], false], // crosses VN Tết only
  ['2007-02-16', 'current-day', 'vn', '2007-02-16', [2006, 12, 29, 2], false],
  ['2007-02-17', 'next-day', 'cn', '2007-02-18', [2007, 1, 1, 3], false], // crosses CN Tết only
  ['2007-02-17', 'next-day', 'vn', '2007-02-18', [2007, 1, 2, 3], false],
  ['2007-02-17', 'current-day', 'cn', '2007-02-17', [2006, 12, 30, 2], false],
  ['2007-02-17', 'current-day', 'vn', '2007-02-17', [2007, 1, 1, 3], false],
  ['1968-01-28', 'next-day', 'cn', '1968-01-29', [1967, 12, 30, 3], false],
  ['1968-01-28', 'next-day', 'vn', '1968-01-29', [1968, 1, 1, 4], false], // crosses VN Tết only
  ['1968-01-29', 'next-day', 'cn', '1968-01-30', [1968, 1, 1, 4], false], // crosses CN Tết only
  ['1968-01-29', 'current-day', 'vn', '1968-01-29', [1968, 1, 1, 4], false],
];
for (const [ymd, lz, cal, chartDate, lunar, unav] of TET) {
  const [y, m, d] = ymd.split('-').map(Number);
  const b = formToBirthInfo(form(HN, wall(y, m, d, 23, 30), 420), { lateZishi: lz });
  const a = applyCalendar(b, cal);
  const c = generateChart(a.info);
  eq([dateOf(b), c.lunarInfo.lunarYear, c.lunarInfo.lunarMonth, c.lunarInfo.lunarDay, c.lunarInfo.yearStem, c.birthInfo.hour, a.unavailable],
    [chartDate, ...lunar, 0, unav], `Tết ${ymd} 23:30 ${lz} ${cal}`);
}

// ── 3. Longitude extremes ────────────────────────────────────────────────────────────────────────────
const MUONG_TE: Place = { name: 'Mường Tè', lat: 22.38, lon: 102.1 };
const VAN_NINH: Place = { name: 'Vạn Ninh', lat: 12.7, lon: 109.4 };
const corr = (lon: number, off: number) => calculateTrueSolarTime({ year: 1990, month: 6, day: 1, clockHour: 12, clockMinute: 0, longitude: lon, utcOffsetMinutes: off }).longitudeCorrectionMinutes;
for (const [lon, off, want] of [[102.1, 420, -11.6], [109.4, 420, 17.6], [102.1, 480, -71.6], [109.4, 480, -42.4]]) {
  assert.ok(Math.abs(corr(lon, off) - want) < 1e-9, `${lon}°E @${off}: ${corr(lon, off)} ≠ ${want}`); checks++;
}
const at = (p: Place, off: number, ymd: string, hm: string, lz: LateZishiRule = 'next-day') => {
  const [y, m, d] = ymd.split('-').map(Number), [hh, mm] = hm.split(':').map(Number);
  const b = formToBirthInfo(form(p, wall(y, m, d, hh, mm), off), { lateZishi: lz });
  return [dateOf(b), b.hour];
};
eq(at(MUONG_TE, 420, '1990-06-01', '23:11'), ['1990-06-01', 11], 'Mường Tè 23:11 → 22:59.4 Hợi');
eq(at(MUONG_TE, 420, '1990-06-01', '23:12'), ['1990-06-02', 0], 'Mường Tè 23:12 → 23:00.4 late Tý');
eq(at(MUONG_TE, 420, '1990-06-02', '00:05'), ['1990-06-02', 0], 'Mường Tè 00:05 → previous-day 23:53.4, next-day rule keeps clock date');
eq(at(MUONG_TE, 420, '1990-06-02', '00:05', 'current-day'), ['1990-06-01', 0], 'Mường Tè 00:05 current-day → previous date');
eq(at(MUONG_TE, 420, '1990-06-02', '01:11'), ['1990-06-02', 0], 'Mường Tè 01:11 → 00:59.4 still Tý');
eq(at(VAN_NINH, 420, '1990-06-01', '22:42'), ['1990-06-01', 11], 'Vạn Ninh 22:42 → 22:59.6 Hợi');
eq(at(VAN_NINH, 420, '1990-06-01', '22:43'), ['1990-06-02', 0], 'Vạn Ninh 22:43 → 23:00.6 late Tý');
eq(at(VAN_NINH, 420, '1990-06-02', '00:42'), ['1990-06-02', 0], 'Vạn Ninh 00:42 → 00:59.6 still Tý');
eq(at(VAN_NINH, 420, '1990-06-02', '00:43'), ['1990-06-02', 1], 'Vạn Ninh 00:43 → 01:00.6 Sửu');
eq(at(VAN_NINH, 480, '1965-06-01', '23:42'), ['1965-06-01', 11], 'Vạn Ninh @+8 23:42 → 22:59.6 Hợi');
eq(at(VAN_NINH, 480, '1965-06-01', '23:43'), ['1965-06-02', 0], 'Vạn Ninh @+8 23:43 → 23:00.6 late Tý');
eq(at(MUONG_TE, 480, '1965-06-02', '00:11'), ['1965-06-01', 11], 'Mường Tè @+8 00:11 → previous-day 22:59.4 Hợi (date goes back under every rule)');
eq(at(MUONG_TE, 480, '1965-06-02', '00:12'), ['1965-06-02', 0], 'Mường Tè @+8 00:12 → previous-day 23:00.4 late Tý, next-day');
eq(at(MUONG_TE, 480, '1965-06-02', '00:12', 'current-day'), ['1965-06-01', 0], 'Mường Tè @+8 00:12 current-day');
eq(vnUtcOffsetMinutes(VAN_NINH.lat, 1965, 6, 1, 23, 42), 480, 'Vạn Ninh 1965 is South (+8)');

// ── 4. Equation of time extremes ─────────────────────────────────────────────────────────────────────
const eFeb = equationOfTimeMinutes(2000, 2, 11, 23, 5), eNov = equationOfTimeMinutes(2000, 11, 3, 22, 50);
assert.ok(eFeb < -14 && eFeb > -14.5, `EoT Feb 11 ${eFeb}`); assert.ok(eNov > 16.2 && eNov < 16.6, `EoT Nov 3 ${eNov}`); checks += 2;
const eot = (ymd: string, hm: string, on: boolean, lz: LateZishiRule = 'next-day', province = HN.name) => {
  const [y, m, d] = ymd.split('-').map(Number), [hh, mm] = hm.split(':').map(Number);
  const b = formToBirthInfo({ ...form(HN, wall(y, m, d, hh, mm), 420), province }, { lateZishi: lz, equationOfTime: on });
  return [dateOf(b), b.hour];
};
eq(eot('2000-11-03', '22:50', false), ['2000-11-03', 11], 'Nov 3 22:50 mean 22:53.4 Hợi');
eq(eot('2000-11-03', '22:50', true), ['2000-11-04', 0], 'Nov 3 22:50 apparent 23:09.8 late Tý → next day');
eq(eot('2000-11-03', '22:50', true, 'current-day'), ['2000-11-03', 0], 'Nov 3 22:50 apparent, current-day');
eq(eot('2000-02-11', '23:05', false), ['2000-02-12', 0], 'Feb 11 23:05 mean 23:08.4 late Tý → next day');
eq(eot('2000-02-11', '23:05', true), ['2000-02-11', 11], 'Feb 11 23:05 apparent 22:54.2 Hợi, no shift');
eq(eot('2000-11-03', '22:50', true, 'next-day', ''), ['2000-11-03', 11], 'EoT is skipped when no province is set');
eq(eot('2000-11-03', '23:50', true), ['2000-11-04', 0], 'Nov 3 23:50 apparent 00:09.8 next day under every rule');
eq(eot('2000-11-03', '23:50', true, 'current-day'), ['2000-11-04', 0], 'apparent past midnight → date +1 even with current-day');
eq(eot('2000-02-12', '00:05', true, 'current-day'), ['2000-02-11', 0], 'Feb 12 00:05 apparent 23:54.2 previous day, current-day');
eq(eot('2000-02-12', '00:05', true), ['2000-02-12', 0], 'Feb 12 00:05 apparent, next-day keeps the clock date');

console.log(`vn-boundaries: ${checks} checks passed (${TRANSITIONS.length} transitions, ${DATES.length} Giờ Tý dates × ${CLOCKS.length} clocks, ${TET.length} Tết charts)`);
