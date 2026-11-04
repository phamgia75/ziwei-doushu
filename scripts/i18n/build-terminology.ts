/**
 * Builds lib/i18n/terminology.json and docs/vi/THUAT-NGU.md from lib/i18n/terms.ts + engine data.
 *
 * Star groups: engine star.type (generateChart) decides chính tinh ('major'); iztro's own star type
 * (the library the engine wraps) separates the 6 cát tinh + Lộc Tồn + Thiên Mã ('aux') and the 6 sát
 * tinh ('sha') from the many tạp diệu ('misc') that the engine also tags lucky/sha.
 * Output is deterministic (fixed births, sorted keys, no timestamps).
 * Run: npx tsx scripts/i18n/build-terminology.ts
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { astro } from 'iztro';
import { generateChart } from '../../lib/ziwei/algorithm';
import iztroGlossary from '../../lib/i18n/glossary.iztro.json';
import { buildTerminology, CATEGORY_ORDER, VARIANTS, VARIANT_REASONS } from '../../lib/i18n/terminology';

const root = process.cwd();
const engineType: Record<string, string> = {};
const iztroType: Record<string, string> = {};
for (let y = 1950; y < 2026; y += 7) for (let mo = 1; mo <= 12; mo += 5) for (let h = 0; h < 12; h += 3) for (const g of ['male', 'female'] as const) {
  const day = 10 + (h % 9);
  for (const p of generateChart({ year: y, month: mo, day, hour: h, gender: g }).palaces) for (const s of p.stars) engineType[s.name] = s.type;
  for (const p of astro.bySolar(`${y}-${mo}-${day}`, h, g === 'male' ? '男' : '女', true, 'zh-CN').palaces) {
    for (const s of [...p.majorStars, ...p.minorStars, ...p.adjectiveStars]) iztroType[s.name] = s.type;
  }
}
const starGroups = Object.fromEntries(Object.keys(engineType).sort().map(n => [n,
  engineType[n] === 'major' ? 'major'
    : ['soft', 'lucun', 'tianma'].includes(iztroType[n]) ? 'aux'
    : iztroType[n] === 'tough' ? 'sha' : 'misc']));

const terms = buildTerminology(starGroups);
const variants = Object.entries(VARIANTS).map(([canonical, v]) => ({ canonical, variants: v, reason: VARIANT_REASONS[canonical] ?? '' }));
writeFileSync(join(root, 'lib/i18n/terminology.json'), JSON.stringify({
  generatedBy: 'scripts/i18n/build-terminology.ts — do not edit by hand',
  sources: { 'iztro vi-VN (MIT)': 'lib/i18n/glossary.iztro.json', 'TuVi AI curated': 'lib/i18n/terms.ts CURATED' },
  starGroups, terms, variants,
}, null, 1) + '\n');

const cell = (s = '') => s.replace(/\|/g, '\\|');
const md: string[] = [
  '# Thuật ngữ Tử Vi chuẩn của TuVi AI', '',
  '> Tệp sinh tự động bởi `scripts/i18n/build-terminology.ts` — không sửa tay. Nguồn dữ liệu: `lib/i18n/terms.ts`.', '',
  `Nguồn: **iztro vi-VN (MIT)** — ${iztroGlossary.source} (\`lib/i18n/glossary.iztro.json\`); ` +
  '**TuVi AI curated** — âm Hán-Việt chuẩn bổ sung hoặc sửa lỗi iztro (`CURATED`, mỗi mục có lý do).',
  'Phân loại sao lấy từ dữ liệu động cơ lá số (`star.type`) và nhóm sao của iztro; các nhóm khác lấy từ bảng thiên can, địa chi, cung, cục, độ sáng của động cơ.', '',
  `Tổng: ${terms.length} thuật ngữ.`, '',
];
for (const cat of CATEGORY_ORDER) {
  const rows = terms.filter(t => t.category === cat);
  if (!rows.length) continue;
  md.push(`## ${cat[0].toUpperCase()}${cat.slice(1)} (${rows.length})`, '', '| Hán | Việt | Nguồn | Ghi chú |', '|---|---|---|---|');
  for (const t of rows) md.push(`| ${t.zh} | ${cell(t.vi)} | ${t.source} | ${cell(t.note)} |`);
  md.push('');
}
md.push('## Cách viết không dùng (VARIANTS)', '',
  'Các dạng dưới đây bị `findTermIssues()` (lib/i18n/terminology.ts) báo lỗi trong giao diện, câu trả lời AI và bản dịch. ' +
  'Khớp nguyên từ, phân biệt hoa/thường. Danh sách cố ý thận trọng: báo nhầm tệ hơn bỏ sót.', '',
  '| Chuẩn | Không dùng | Lý do |', '|---|---|---|');
for (const v of variants) md.push(`| ${v.canonical} | ${v.variants.join(', ')} | ${cell(v.reason)} |`);
md.push('', '### Quyết định không bắt lỗi', '',
  '- **Sự nghiệp** là từ thường chỉ chủ đề; tên cung chuẩn vẫn là **Quan Lộc**.',
  '- **Tuần Không / Triệt Không** là tên đầy đủ hợp lệ; lá số hiển thị dạng ngắn **Tuần / Triệt**.',
  '- **Thiên Phúc** (天福) và **Thiên Phủ** (天府) là hai sao khác nhau.',
  '- **Hạn** đứng một mình là từ thường (Đại Hạn, Tiểu Hạn); chỉ bắt "Hạn Địa" (lỗi iztro cho 陷 → Hãm).',
  '- **Nguyệt / Nhật** không bắt (Thiên Nguyệt, Nguyệt Đức là sao thật).',
  '- Chữ Hán trong ngoặc đơn, 《…》, `<Zh>` hoặc phần tử `lang="zh"` được phép (ghi chú nguyên văn).', '');
mkdirSync(join(root, 'docs/vi'), { recursive: true });
writeFileSync(join(root, 'docs/vi/THUAT-NGU.md'), md.join('\n'));
const counts = CATEGORY_ORDER.map(c => `${c}: ${terms.filter(t => t.category === c).length}`).join(', ');
console.log(`terminology: ${terms.length} terms (${counts}); ${variants.length} variant groups`);
