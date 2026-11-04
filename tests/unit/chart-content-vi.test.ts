// Every star the engine emits renders in Vietnamese; StarDetailPanel content exists for the 14 chính tinh.
import assert from 'node:assert/strict';
import { generateChart } from '../../lib/ziwei/algorithm';
import { STAR_DESCRIPTIONS } from '../../lib/ziwei/constants';
import { term, hasTerm } from '../../lib/i18n';
import { STAR_DETAIL_VI, STAR_DESCRIPTIONS_VI, STAR_NOTES_VI } from '../../lib/i18n/vi/stars';
import { BRIGHTNESS_SHORT, BRIGHTNESS_FULL, SIHUA_SHORT } from '../../lib/i18n/vi/chart';

const HAN = /\p{Script=Han}/u;
const hanFree = (s: string, what: string) => assert.ok(s && !HAN.test(s), `${what}: ${JSON.stringify(s)}`);

const MAJOR = ['紫微', '天机', '太阳', '武曲', '天同', '廉贞', '天府', '太阴', '贪狼', '巨门', '天相', '天梁', '七杀', '破军'];
const stars = new Set<string>(), palaces = new Set<string>(), majors = new Set<string>();
for (let i = 0; i < 600; i++) {
  const c = generateChart({ year: 1950 + (i % 77), month: 1 + (i % 12), day: 1 + ((i * 7) % 28), hour: i % 12, gender: i % 2 ? 'male' : 'female' });
  hanFree(term(c.wuxingJuName), c.wuxingJuName);
  for (const p of c.palaces) {
    palaces.add(p.name);
    for (const s of p.stars) {
      stars.add(s.name);
      if (s.type === 'major') majors.add(s.name);
      if (s.brightnessRaw) { hanFree(BRIGHTNESS_SHORT[s.brightnessRaw], s.brightnessRaw); hanFree(BRIGHTNESS_FULL[s.brightnessRaw], s.brightnessRaw); }
      if (s.siHua) hanFree(SIHUA_SHORT[s.siHua], s.siHua);
    }
  }
  for (const d of c.daXians) palaces.add(d.palaceName);
}
for (const n of [...stars, ...palaces]) { assert.ok(hasTerm(n), `no glossary entry: ${n}`); hanFree(term(n), n); }
assert.deepEqual([...majors].sort(), [...MAJOR].sort(), 'engine major-star set changed');
for (const n of MAJOR) {
  const d = STAR_DETAIL_VI[n];
  assert.ok(d, `StarDetailPanel detail missing: ${n}`);
  Object.entries(d).forEach(([k, v]) => hanFree(v, `${n}.${k}`));
  const desc = STAR_DESCRIPTIONS_VI[n];
  assert.ok(desc && STAR_DESCRIPTIONS[n], `STAR_DESCRIPTIONS missing: ${n}`);
  assert.equal(desc.keywords.length, STAR_DESCRIPTIONS[n].keywords.split('·').length, `${n} keyword count`);
  [...desc.keywords, desc.nature, desc.element].forEach(v => hanFree(v, `${n} description`));
}
Object.entries(STAR_NOTES_VI).forEach(([n, v]) => { assert.ok(stars.has(n), `note for unknown star ${n}`); hanFree(v, n); });
console.log(`✓ chart content Vietnamese: ${stars.size} stars, ${palaces.size} palace names, 14 chính tinh details`);
