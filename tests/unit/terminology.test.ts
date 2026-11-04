// Standard terminology: variant / Han detection, dictionary integrity, QA fixture attribution & privacy.
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { findTermIssues, TERMINOLOGY, VARIANTS } from '../../lib/i18n/terminology';
import { allTerms } from '../../lib/i18n/terms';
import generated from '../../lib/i18n/terminology.json';

const kinds = (s: string) => findTermIssues(s).map(i => `${i.kind}:${i.found}${i.canonical ? '→' + i.canonical : ''}`);

// positives
assert.deepEqual(kinds('Sao Hoá Kị nhập Mệnh'), ['variant:Hoá Kị→Hóa Kỵ'], 'longest variant wins, reported once');
assert.deepEqual(kinds('Hóa Kị và Thất Xát, Liêm Chinh'), ['variant:Hóa Kị→Hóa Kỵ', 'variant:Thất Xát→Thất Sát', 'variant:Liêm Chinh→Liêm Trinh']);
assert.deepEqual(kinds('cung Giao Hữu có Tả Phụ'), ['variant:Giao Hữu→Nô Bộc', 'variant:Tả Phụ→Tả Phù']);
assert.deepEqual(kinds('biến hoá'), ['variant:hoá→hóa']);
assert.deepEqual(kinds('Sao Hạn Địa'), ['variant:Hạn Địa→Hãm Địa']);
assert.deepEqual(kinds('Hoá Kị'.normalize('NFD')), ['variant:Hoá Kị→Hóa Kỵ'], 'NFD input is normalised');
assert.deepEqual(kinds('Tử Vi 天府 ở Mệnh, 化禄。'), ['han:天府', 'han:化禄']);
assert.equal(findTermIssues('Tử Vi 天府')[0].index, 6);
assert.deepEqual(kinds('Thiên Phủ 天府星同宫'), ['han:天府星同宫'], 'one issue per Han run');

// negatives (near-misses that must NOT be flagged)
for (const ok of ['Thiên Phúc', 'Thiên Phủ', 'Sự nghiệp', 'Sự Nghiệp', 'hóa ra', 'Hóa Kỵ', 'Thất Sát', 'Liêm Trinh', 'Cự Môn',
  'Tả Phù', 'Nô Bộc', 'giao hữu bóng đá', 'Đại Hạn', 'Tiểu Hạn', 'Hãm Địa', 'Tuần Không', 'Triệt Không', 'Tuần', 'Triệt',
  'Thiên Nguyệt', 'Nguyệt Đức', 'Thái Dương', 'Thái Âm', 'Tham Lang', 'Hoán đổi', 'Tử Vi (紫微)', 'Tử Vi（紫微）', '《天纪》',
  '<Zh>紫微</Zh>', '<span lang="zh-Hans">紫微斗数</span>', 'Hoáx', 'khoảng', 'Phá Quân', 'Quý', 'Kỷ', 'Tỵ', 'Hỏa Tinh', 'Thủy Nhị Cục']) {
  assert.deepEqual(findTermIssues(ok), [], `must not flag: ${ok}`);
}

// dictionary integrity
const glossary = allTerms();
assert.equal(TERMINOLOGY.length, Object.keys(glossary).length, 'TERMINOLOGY covers the whole glossary');
for (const t of TERMINOLOGY) {
  assert.ok(t.vi.trim(), `empty vi for ${t.zh}`);
  assert.ok(!/\p{Script=Han}/u.test(t.vi), `Han in vi for ${t.zh}: ${t.vi}`);
  assert.equal(t.vi, glossary[t.zh]);
}
assert.deepEqual((generated as { terms: unknown }).terms, TERMINOLOGY, 'terminology.json is stale: run npx tsx scripts/i18n/build-terminology.ts');
const cat = (zh: string) => TERMINOLOGY.find(t => t.zh === zh)?.category;
assert.equal(cat('紫微'), 'chính tinh'); assert.equal(cat('左辅'), 'phụ tinh'); assert.equal(cat('擎羊'), 'sát tinh');
assert.equal(cat('红鸾'), 'tạp diệu'); assert.equal(cat('甲'), 'thiên can'); assert.equal(cat('子'), 'địa chi');
assert.equal(cat('陷'), 'độ sáng'); assert.equal(cat('化忌'), 'tứ hóa'); assert.equal(cat('财帛'), 'cung'); assert.equal(cat('长生'), 'vòng sao');

// VARIANTS never contain a canonical form (or any standard glossary rendering)
const canon = new Set([...Object.keys(VARIANTS), ...TERMINOLOGY.map(t => t.vi)]);
for (const [c, vs] of Object.entries(VARIANTS)) for (const v of vs) {
  assert.ok(!canon.has(v), `variant "${v}" (of ${c}) is itself a canonical form`);
  assert.deepEqual(kinds(v), [`variant:${v}→${c}`]);
}

// QA fixture: parses, attributed, no birth-date-like strings
const fx = 'tests/fixtures/translation-qa.jsonl';
assert.ok(existsSync(fx), 'QA fixture missing: run npx tsx scripts/i18n/translation-qa.ts');
{
  const lines = readFileSync(fx, 'utf8').trim().split('\n');
  assert.ok(lines.length >= 30, `QA fixture too small: ${lines.length}`);
  for (const line of lines) {
    assert.ok(!/\d{4}-\d{2}-\d{2}/.test(line), `birth-date-like string in fixture: ${line.slice(0, 80)}`);
    const r = JSON.parse(line);
    assert.ok(r.id && r.zh && typeof r.vi === 'string' && Array.isArray(r.required_terms) && typeof r.auto_ok === 'boolean', r.id);
    assert.ok(!/倪|天纪/.test(r.zh), `NC-licensed Ni Haixia material in ${r.id}`);
    if (r.source.dataset) {
      assert.equal(r.source.license, 'CC BY 4.0 — 王多鱼AI', r.id);
      assert.match(r.source.record, /^\d{4}s-[a-z]+$/, r.id);
    } else {
      assert.ok(r.source.classic, r.id);
      assert.equal(r.source.license, 'public domain', r.id);
    }
  }
}
console.log('terminology: variant/Han detection, dictionary and QA fixture checks pass');
