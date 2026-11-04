// Local import must reject malformed records instead of crashing the chart page later.
import assert from 'node:assert/strict';
const mem = new Map<string, string>();
(globalThis as unknown as { localStorage: Storage }).localStorage = {
  getItem: k => mem.get(k) ?? null, setItem: (k, v) => void mem.set(k, v), removeItem: k => void mem.delete(k),
  clear: () => mem.clear(), key: () => null, length: 0,
};
(async () => {
const { importAll, listCharts, exportAll, saveChart } = await import('../../lib/client/storage');
const form = { name: '', year: '1990', month: '1', day: '2', clockHour: '7', clockMinute: '10', unknownTime: false, province: 'Hà Nội', city: 'Hà Nội', longitude: 105.85, utcOffsetMinutes: 420, gender: 'male' as const };
assert.ok(saveChart(form, 'A'));
const good = exportAll();
mem.clear();
const bad = JSON.parse(good);
bad.charts.push({ ...bad.charts[0], id: 'x1', form: { ...form, longitude: 'x' } }, { ...bad.charts[0], id: 'x2', form: { ...form, clockHour: '99' } }, { id: 'x3' });
const r = importAll(JSON.stringify(bad));
assert.deepEqual(r, { added: 1, skipped: 3 });
assert.equal(listCharts().length, 1);
assert.throws(() => importAll('{"app":"other","charts":[]}'));
assert.throws(() => importAll('not json'));
console.log('storage import: valid record kept, 3 malformed rejected');
})().catch(e => { console.error(e); process.exit(1); });
