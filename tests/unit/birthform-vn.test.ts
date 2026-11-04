import assert from 'node:assert/strict';
import { formToBirthInfo, calcTrueSolarBranch, formToSearchParams, searchParamsToForm } from '../../lib/ziwei/share';
import type { BirthFormState } from '../../components/BirthForm';

const hn = (clockHour: string, clockMinute: string, over: Partial<BirthFormState> = {}): BirthFormState => ({
  name: '', year: '2000', month: '1', day: '31', clockHour, clockMinute, unknownTime: false,
  province: 'Hà Nội', city: 'Hà Nội', longitude: 105.85, utcOffsetMinutes: 420, gender: 'male', ...over,
});
const pick = (b: ReturnType<typeof formToBirthInfo>) => ({ year: b.year, month: b.month, day: b.day, hour: b.hour });

// 23:30 Hà Nội → true solar 23:33 → late Giờ Tý
assert.deepEqual(pick(formToBirthInfo(hn('23', '30'), { lateZishi: 'next-day' })), { year: 2000, month: 2, day: 1, hour: 0 }, 'late Tý next-day');
assert.deepEqual(pick(formToBirthInfo(hn('23', '30'), { lateZishi: 'current-day' })), { year: 2000, month: 1, day: 31, hour: 0 }, 'late Tý current-day');
assert.deepEqual(pick(formToBirthInfo(hn('0', '30'))), { year: 2000, month: 1, day: 31, hour: 0 }, 'early Tý same day');
assert.equal(formToBirthInfo(hn('1', '2')).hour, 1, '01:02 → true solar ≈01:05 → Sửu');
// Defect fix: Hà Nội 07:10 is Thìn (true solar ≈07:13); the old Beijing assumption gave 06:13 → Mão.
assert.equal(formToBirthInfo(hn('7', '10')).hour, 4, 'Hà Nội 07:10 → Thìn');
assert.equal(formToBirthInfo(hn('7', '10', { utcOffsetMinutes: undefined })).hour, 3, 'old UTC+8 assumption → Mão');
assert.equal(calcTrueSolarBranch(7, 10, 105.85, 420), 4);
assert.equal(calcTrueSolarBranch(7, 10, 105.85), 3, 'calcTrueSolarBranch default stays Beijing');

// Beijing behaviour unchanged when utcOffsetMinutes is omitted.
const bj = hn('23', '30', { province: '', city: '', longitude: 120, utcOffsetMinutes: undefined });
assert.deepEqual(pick(formToBirthInfo(bj)), { year: 2000, month: 2, day: 1, hour: 0 }, 'Beijing 23:30 late Tý');
assert.equal(calcTrueSolarBranch(23, 30, 100), 11, 'Beijing calc: 100°E 23:30 → Hợi');

// Share link round-trip of tz; omitted when undefined.
const p = formToSearchParams(hn('7', '10'));
assert.equal(p.get('tz'), '420');
assert.equal(searchParamsToForm(p)?.utcOffsetMinutes, 420);
const pb = formToSearchParams(bj);
assert.equal(pb.has('tz'), false);
assert.equal('utcOffsetMinutes' in (searchParamsToForm(pb) ?? {}), false);
console.log('birthform-vn: Hà Nội offset, Giờ Tý sớm/muộn, share tz passed');
