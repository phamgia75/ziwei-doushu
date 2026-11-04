/**
 * Adversarial tests: fabricated astrological relationships must be flagged; true ones verified;
 * doctrine/hypotheticals skipped; undecidable relationship sentences reported as unverified.
 * Chart 1990-01-02 Dần-hour male: Mệnh Tuất (Vũ Khúc Hóa Lộc) · Huynh Đệ Dậu (Thiên Đồng) · Phu Thê Thân (Thất Sát)
 * · Tử Nữ Mùi (Thiên Lương Khoa, Văn Xương, Văn Khúc Kỵ) · Tài Bạch Ngọ (Liêm Trinh, Thiên Tướng, Lộc Tồn) · Tật Ách Tỵ (Cự Môn)
 * · Thiên Di Thìn (Tham Lang Quyền) · Nô Bộc Mão (Thái Âm, Tả Phù) · Quan Lộc Dần (Tử Vi, Thiên Phủ) · Điền Trạch Sửu (Thiên Cơ)
 * · Phúc Đức Tý (Phá Quân) · Phụ Mẫu Hợi (Thái Dương, Hữu Bật). Lưu Niên 2026 Bính: Kỵ Liêm Trinh. Đại Hạn hiện tại (Tân): Kỵ Văn Xương.
 */
import assert from 'node:assert/strict';
import { generateChart } from '../../lib/ziwei/algorithm';
import { verifyClaims, type Claim } from '../../lib/server/ai/claims';

const chart = generateChart({ year: 1990, month: 1, day: 2, hour: 3, gender: 'male' });
assert.equal(chart.palaces.find(p => p.branch === chart.mingGongBranch)!.stars.find(s => s.type === 'major')!.name, '武曲', 'fixture chart changed');
const run = (t: string) => verifyClaims(t, [{ chart }], 2026);
const one = (t: string, kind: Claim['kind'], status: Claim['status']) => {
  const cs = run(t).filter(c => c.kind === kind);
  assert.ok(cs.length >= 1, `no ${kind} claim found in: ${t}\n${JSON.stringify(run(t))}`);
  assert.ok(cs.every(c => c.status === status), `${t}\nexpected ${status}, got ${JSON.stringify(cs)}`);
};

// tam hợp / xung chiếu between palaces
one('Cung Mệnh, Tài Bạch và Quan Lộc tam hợp.', 'tamhop', 'verified');
one('Cung Mệnh và cung Tử Nữ tam hợp với nhau.', 'tamhop', 'contradicted');
one('Cung Mệnh xung chiếu cung Thiên Di.', 'xung', 'verified');
one('Cung Mệnh đối cung với cung Phúc Đức.', 'xung', 'contradicted');
// star → palace (chiếu / hội / xung)
one('Tham Lang từ Thiên Di xung chiếu cung Mệnh.', 'xung', 'verified');
one('Tử Vi hội chiếu cung Mệnh, tăng uy quyền.', 'chieu', 'verified');
one('Cự Môn chiếu cung Mệnh gây thị phi.', 'chieu', 'contradicted');
one('Phá Quân xung chiếu cung Mệnh.', 'xung', 'contradicted');
// giáp
one('Thiên Đồng và Thái Dương giáp cung Mệnh.', 'giap', 'verified');
one('Tả Phù và Hữu Bật giáp cung Mệnh nên được quý nhân.', 'giap', 'contradicted');
// Tứ Hóa (natal / Lưu Niên / Đại Hạn) and where it lands
one('Vũ Khúc Hóa Lộc là điểm sáng.', 'sihua-star', 'verified');
one('Thiên Phủ Hóa Kỵ khiến tình cảm trắc trở.', 'sihua-star', 'contradicted'); // Thiên Phủ never transforms
one('Tham Lang Hóa Kỵ khiến tình cảm trắc trở.', 'sihua-star', 'unverified'); // true only in one Đại Hạn, not natally
one('Năm 2026 Liêm Trinh Hóa Kỵ, cần thận trọng tiền bạc.', 'sihua-star', 'verified');
one('Lưu Niên Thái Dương Hóa Kỵ.', 'sihua-star', 'contradicted');
one('Đại Hạn hiện tại Văn Xương Hóa Kỵ.', 'sihua-star', 'verified');
one('Hóa Kỵ năm sinh nhập cung Quan Lộc.', 'sihua-in', 'contradicted');
one('Hóa Lộc nhập cung Mệnh.', 'sihua-in', 'verified');
// placements and palace branches
one('Tử Vi tọa thủ tại cung Mệnh.', 'placement', 'contradicted');
one('Cung Quan Lộc có Tử Vi và Thiên Phủ đồng cung.', 'placement', 'verified');
one('Vũ Khúc tọa tại Tuất.', 'placement', 'verified');
one('Cung Quan Lộc tại Dần.', 'palace-at', 'verified');
one('Cung Quan Lộc tại Ngọ.', 'palace-at', 'contradicted');
// explicit decade / year scopes (Codex L2 round 2 repros)
one('Đại Hạn hiện tại Tham Lang Hóa Kỵ.', 'sihua-star', 'contradicted'); // current Đại Hạn Kỵ = Văn Xương
one('Đại Hạn Tham Lang Hóa Kỵ.', 'sihua-star', 'unverified');           // which decade? (true in 16–25 only)
one('Đại Hạn 16–25 Tham Lang Hóa Kỵ.', 'sihua-star', 'verified');
one('Đại Hạn 36–45 Tham Lang Hóa Kỵ.', 'sihua-star', 'contradicted');
one('Năm 2024 Liêm Trinh Hóa Kỵ.', 'sihua-star', 'contradicted');       // 2024 Giáp: Kỵ Thái Dương
one('Năm 2024 Thái Dương Hóa Kỵ.', 'sihua-star', 'verified');
// doctrine / hypotheticals are not claims about this chart
assert.deepEqual(run('Nếu Tử Vi ở cung Mệnh thì là người có uy.'), []);
assert.deepEqual(run('Theo cổ thư, Tham Lang hội Hỏa Tinh chủ phát tài bất ngờ.'), []);
assert.deepEqual(run('Tử Vi Đẩu Số là hệ thống văn hóa.'), []);
// recognised relationship language that cannot be decided is never silently accepted
one('Cung Mệnh được nhiều cát tinh hội chiếu.', 'relation', 'unverified');
// markdown and citations don't hide claims
one('**Cự Môn** chiếu **cung Mệnh** [F8].', 'chieu', 'contradicted');

// regressions from a real qwen3.5 answer (2026-11-05): real errors caught, annotations not misparsed
const live = (t: string) => run(t);
let r = live('Mệnh chủ Vũ Khúc, Thân cư Thiên Di; Mệnh tại Tuất, Đại Hạn 6–15.');
assert.equal(r.find(c => c.kind === 'menh-chu')?.status, 'contradicted', 'Mệnh Chủ is Lộc Tồn');
assert.equal(r.find(c => c.kind === 'than-cu')?.status, 'verified');
assert.ok(!r.some(c => c.kind === 'placement' && c.status === 'contradicted'), JSON.stringify(r));
r = live('Cung Mệnh có Vũ Khúc [Miếu] Hóa Lộc, đối cung Thiên Di có Tham Lang [Hãm].');
assert.deepEqual(r.filter(c => c.kind === 'brightness').map(c => c.status), ['verified', 'contradicted'], JSON.stringify(r));
r = live('Cung Quan Lộc có Tử Vi [Vượng] và Thiên Phủ [Miếu], gặp Địa Kiếp [Bình]; Tam hợp với Mệnh (Vũ Khúc) và Tài Bạch (Liêm Trinh, Thiên Tướng).');
assert.ok(!r.some(c => c.status === 'contradicted'), JSON.stringify(r.filter(c => c.status === 'contradicted')));
assert.equal(r.find(c => c.kind === 'tamhop')?.status, 'verified', JSON.stringify(r));
r = live('Hãy phát huy tính quyết đoán của Thất Sát ở cung Phu Thê nhưng cần mềm mỏng hơn để tránh thị phi (Liêm Trinh Hóa Kỵ).');
assert.ok(!r.some(c => c.status === 'contradicted'), JSON.stringify(r));
one('Mệnh Chủ là Lộc Tồn.', 'menh-chu', 'verified');

// compatibility: claims attributed to Người A / Người B
const b = generateChart({ year: 1992, month: 8, day: 14, hour: 6, gender: 'female' });
const bFuqi = b.palaces.find(p => p.name.startsWith('夫妻'))!;
const bStar = bFuqi.stars.find(s => s.type === 'major');
const two = verifyClaims(`Người A có Thất Sát ở cung Phu Thê. Người B có Thất Sát ở cung Phu Thê.${bStar ? '' : ''}`, [{ chart, label: 'A' }, { chart: b, label: 'B' }], 2026);
const pa = two.filter(c => c.person === 'A' && c.kind === 'placement'), pb = two.filter(c => c.person === 'B' && c.kind === 'placement');
assert.equal(pa[0]?.status, 'verified');
const bHasQisha = bFuqi.stars.some(s => s.name === '七杀');
assert.equal(pb[0]?.status, bHasQisha ? 'verified' : 'contradicted');
const amb = verifyClaims('Hai người tam hợp rất tốt. Cung Mệnh xung chiếu cung Thiên Di.', [{ chart, label: 'A' }, { chart: b, label: 'B' }], 2026);
assert.ok(amb.some(c => c.status === 'unverified' && /Người A hay Người B/.test(c.detail)), 'unattributed relation must be unverified');

console.log('ai claims: adversarial, real-model regression and compatibility attribution cases pass');
