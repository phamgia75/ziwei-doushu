import assert from 'node:assert/strict';
import { vnUtcOffsetMinutes, formatUtcOffset } from '../../lib/geo/vn-time';
import { VN_PROVINCES } from '../../lib/geo/vn-places';

const HN = 21.03, HCM = 10.78, HUE = 16.46;
assert.equal(vnUtcOffsetMinutes(HN, 1990, 5, 1, 8, 0), 420, 'Hà Nội 1990');
assert.equal(vnUtcOffsetMinutes(HCM, 1965, 5, 1, 8, 0), 480, 'TP.HCM 1965 (RVN +8)');
assert.equal(vnUtcOffsetMinutes(HCM, 1958, 5, 1, 8, 0), 420, 'TP.HCM 1958');
assert.equal(vnUtcOffsetMinutes(HCM, 1976, 5, 1, 8, 0), 420, 'TP.HCM 1976');
assert.equal(vnUtcOffsetMinutes(HN, 1965, 5, 1, 8, 0), 420, 'Hà Nội 1965 (DRV +7)');
assert.equal(vnUtcOffsetMinutes(HUE, 1968, 1, 31, 2, 0), 480, 'Huế 1968');
// Transition edges: RVN switched 1959-12-31 23:00 → 1960-01-01 00:00; back to +7 on 1975-06-13.
assert.equal(vnUtcOffsetMinutes(HCM, 1959, 12, 31, 22, 0), 420, 'TP.HCM just before 1960 switch');
assert.equal(vnUtcOffsetMinutes(HCM, 1960, 1, 1, 1, 0), 480, 'TP.HCM just after 1960 switch');
assert.equal(vnUtcOffsetMinutes(HCM, 1975, 6, 14, 12, 0), 420, 'TP.HCM after 1975-06-13');
assert.equal(vnUtcOffsetMinutes(HN, 1944, 6, 1, 12, 0), 480, 'Hà Nội 1944 (Japanese-era Indochina +8)');

assert.equal(formatUtcOffset(420), 'UTC+7');
assert.equal(formatUtcOffset(330), 'UTC+5:30');
assert.equal(formatUtcOffset(-300), 'UTC-5');
assert.equal(formatUtcOffset(426.5), 'UTC+7:06:30');

assert.equal(VN_PROVINCES.length, 63, '63 provinces');
assert.deepEqual(VN_PROVINCES.slice(0, 2).map(p => p.name), ['Hà Nội', 'TP. Hồ Chí Minh']);
assert.equal(new Set(VN_PROVINCES.map(p => p.name)).size, 63, 'unique province names');
for (const p of VN_PROVINCES) for (const c of p.cities) {
  assert.ok(c.longitude > 102 && c.longitude < 110 && c.lat > 8 && c.lat < 23.5, `${c.name} inside Vietnam`);
}
console.log('vn-time: historical offsets + 63 provinces passed');
