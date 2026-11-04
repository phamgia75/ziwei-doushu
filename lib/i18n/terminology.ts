/**
 * Standard Vietnamese terminology for TuVi AI (single source: lib/i18n/terms.ts).
 *
 * - TERMINOLOGY: every glossary term (iztro vi-VN + CURATED) with a category and source.
 *   Star categories come from the engine (generateChart star.type + iztro star groups), captured
 *   by scripts/i18n/build-terminology.ts into terminology.json (`starGroups`); everything else
 *   from the engine's own tables. Rebuild after changing the glossary:
 *     npx tsx scripts/i18n/build-terminology.ts
 * - VARIANTS: known non-standard spellings that must not appear in UI / AI output / translations.
 *   Deliberately conservative — a false positive is worse than a miss.
 * - findTermIssues(): pure, regexes precompiled; used by lib/server/translate.ts and the AI validator.
 */
import { CURATED, allTerms } from './terms';
import iztro from './glossary.iztro.json';
import generated from './terminology.json';
import { STEMS, BRANCHES, PALACE_NAMES_ORDER, JU_NAMES } from '../ziwei/constants';
import { JIANG_QIAN_SHEN, SUI_QIAN_SHEN, BOSHI_SHEN } from '../ziwei/shier-shen';

export type TermCategory = 'chính tinh' | 'phụ tinh' | 'sát tinh' | 'tạp diệu' | 'cung' | 'thiên can' | 'địa chi'
  | 'tứ hóa' | 'độ sáng' | 'cục' | 'khái niệm' | 'vòng sao' | 'khác';
export type TermSource = 'iztro vi-VN (MIT)' | 'TuVi AI curated';
export interface TermEntry { zh: string; vi: string; category: TermCategory; source: TermSource; note?: string }

export const CATEGORY_ORDER: TermCategory[] = ['chính tinh', 'phụ tinh', 'sát tinh', 'tạp diệu', 'vòng sao', 'cung',
  'thiên can', 'địa chi', 'tứ hóa', 'độ sáng', 'cục', 'khái niệm', 'khác'];

const IZTRO = iztro.terms as Record<string, string>;
const BRIGHTNESS = ['庙', '旺', '得', '利', '平', '不', '闲', '陷', '地']; // = StarBrightness in lib/ziwei/types.ts
const CHANGSHENG = ['长生', '沐浴', '冠带', '临官', '帝旺', '衰', '病', '死', '墓', '绝', '胎', '养'];
const PALACES = new Set([...PALACE_NAMES_ORDER, ...PALACE_NAMES_ORDER.map(p => p.replace(/宫$/, '')), '仆役', '身宫']);
const CYCLES = new Set<string>([...CHANGSHENG, ...BOSHI_SHEN, ...JIANG_QIAN_SHEN, ...SUI_QIAN_SHEN]);
const CONCEPTS = new Set(['大限', '小限', '童限', '流年', '流月', '流日', '流时', '旬中', '空亡', '来因', '阳男', '阴男', '阳女', '阴女']);
const GROUP_CATEGORY: Record<string, TermCategory> = { major: 'chính tinh', aux: 'phụ tinh', sha: 'sát tinh', misc: 'tạp diệu' };

/** Known problems in upstream data that we keep (not overridden) but must document. */
const NOTES: Record<string, string> = {
  '日钺': 'iztro dịch nhầm 钺 thành "Nguyệt" (đúng là Thiên Việt); chỉ dùng cho sao lưu theo ngày, chưa hiển thị',
  '月钺': 'iztro dịch nhầm 钺 thành "Nguyệt" (đúng là Thiên Việt); chưa hiển thị',
  '时钺': 'iztro dịch nhầm 钺 thành "Nguyệt" (đúng là Thiên Việt); chưa hiển thị',
  '天福': 'Thiên Phúc — sao khác với Thiên Phủ (天府); không phải biến thể',
  '左辅': 'Chọn "Tả Phù" theo iztro; "Tả Phụ" là cách đọc khác, không dùng',
  '落陷': 'lib/server/translate.ts EXTRA_TERMS ghi "Hãm địa" (chữ thường) — cùng thuật ngữ',
};

function categoryOf(zh: string, starGroups: Record<string, string>): TermCategory {
  if (STEMS.includes(zh)) return 'thiên can';
  if (BRANCHES.includes(zh)) return 'địa chi';
  if (PALACES.has(zh)) return 'cung';
  if (Object.values(JU_NAMES).includes(zh)) return 'cục';
  if (['禄', '权', '科', '忌', '化禄', '化权', '化科', '化忌', '四化', '自化', '飞化'].includes(zh)) return 'tứ hóa';
  if (BRIGHTNESS.includes(zh) || zh === '庙旺' || zh === '落陷') return 'độ sáng';
  if (starGroups[zh]) return GROUP_CATEGORY[starGroups[zh]] ?? 'tạp diệu';
  if (CYCLES.has(zh)) return 'vòng sao';
  if (CONCEPTS.has(zh) || zh in CURATED) return 'khái niệm';
  return 'khác';
}

function noteOf(zh: string, category: TermCategory): string | undefined {
  const parts: string[] = [];
  if (zh in CURATED && IZTRO[zh] && IZTRO[zh] !== CURATED[zh]) parts.push(`ghi đè iztro "${IZTRO[zh]}"`);
  if (NOTES[zh]) parts.push(NOTES[zh]);
  if (/^[流运日月时]./.test(zh) && zh.length === 2 && !(zh in CURATED) && category === 'khác') parts.push('sao lưu/vận (iztro)');
  return parts.length ? parts.join('; ') : undefined;
}

/** starGroups: zh star name → 'major' | 'aux' | 'sha' | 'misc' (captured from the engine by build-terminology.ts). */
export function buildTerminology(starGroups: Record<string, string>): TermEntry[] {
  return Object.entries(allTerms())
    .map(([zh, vi]): TermEntry => {
      const category = categoryOf(zh, starGroups);
      const note = noteOf(zh, category);
      return { zh, vi, category, source: zh in CURATED ? 'TuVi AI curated' : 'iztro vi-VN (MIT)', ...(note ? { note } : {}) };
    })
    .sort((a, b) => CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category) || a.zh.localeCompare(b.zh, 'zh'));
}

export const TERMINOLOGY: TermEntry[] = buildTerminology((generated as { starGroups: Record<string, string> }).starGroups);

/**
 * canonical → known wrong / non-standard spellings (matched case-sensitively, whole word).
 * Decisions NOT encoded here on purpose (would cause false positives):
 *  - "Sự nghiệp" is an ordinary topic word next to "Quan Lộc" — fine.
 *  - "Tuần Không"/"Triệt Không" are accepted full names; the chart shows the short "Tuần"/"Triệt".
 *  - "Thiên Phúc" (天福) and "Thiên Phủ" (天府) are different stars.
 *  - "Hạn" alone is a normal word (Đại Hạn, Tiểu Hạn); only the iztro brightness phrasing is flagged.
 *  - "Nguyệt"/"Nhật" are not flagged (Thiên Nguyệt, Nguyệt Đức are real stars).
 */
export const VARIANT_REASONS: Record<string, string> = {
  'Hóa Kỵ': 'lỗi: 忌 đọc là Kỵ; "Kị" là dạng i/y cũ, "Hoá" là bỏ dấu kiểu cũ',
  'Hóa': 'chính tả: bỏ dấu kiểu mới (Hóa, không Hoá)',
  'hóa': 'chính tả: bỏ dấu kiểu mới (hóa, không hoá)',
  'Hỏa': 'chính tả: bỏ dấu kiểu mới (Hỏa Tinh, Hỏa Lục Cục)',
  'hỏa': 'chính tả: bỏ dấu kiểu mới',
  'Thủy': 'chính tả: bỏ dấu kiểu mới (Thủy Nhị Cục)',
  'thủy': 'chính tả: bỏ dấu kiểu mới',
  'Tọa': 'chính tả: bỏ dấu kiểu mới (Bát Tọa)',
  'tọa': 'chính tả: bỏ dấu kiểu mới (tọa thủ)',
  'Hòa': 'chính tả: bỏ dấu kiểu mới',
  'Quý': 'chính tả: thiên can 癸 / Thiên Quý viết "Quý"',
  'Kỷ': 'chính tả: thiên can 己 viết "Kỷ"',
  'Tỵ': 'chính tả: địa chi 巳 thống nhất "Tỵ" (chữ hoa; "tị nạn" thường không bị bắt)',
  'Thất Sát': 'lỗi chính tả (七杀 = Sát)',
  'Liêm Trinh': 'lỗi chính tả (廉贞 = Trinh)',
  'Cự Môn': 'lỗi chính tả (巨门 = Môn)',
  'Hữu Bật': 'lỗi chính tả (右弼 = Bật)',
  'Văn Xương': 'lỗi chính tả (文昌 = Xương)',
  'Tả Phù': 'phong cách: thống nhất "Tả Phù" theo iztro',
  'Vũ Khúc': 'phong cách: thống nhất "Vũ Khúc" (không dùng "Võ Khúc")',
  'Nô Bộc': 'phong cách: cung 交友/仆役 thống nhất "Nô Bộc"',
  'Tử Nữ': 'phong cách: cung 子女 thống nhất "Tử Nữ"',
  'Phúc Đức': 'phong cách: thống nhất "Phúc Đức" (không dùng "Phước Đức")',
  'Hãm Địa': 'lỗi iztro: 陷 bị dịch "Hạn"',
  'Đồng Hạn': 'lỗi iztro: 童限 bị dịch "đứa trẻ Hạn"',
};
export const VARIANTS: Record<string, string[]> = {
  'Hóa Kỵ': ['Hóa Kị', 'Hoá Kị', 'Hoá Kỵ', 'Hóa Kì'],
  'Hóa': ['Hoá'], 'hóa': ['hoá'], 'Hỏa': ['Hoả'], 'hỏa': ['hoả'], 'Thủy': ['Thuỷ'], 'thủy': ['thuỷ'],
  'Tọa': ['Toạ'], 'tọa': ['toạ'], 'Hòa': ['Hoà'],
  'Quý': ['Quí'], 'Kỷ': ['Kỉ'], 'Tỵ': ['Tị'],
  'Thất Sát': ['Thất Xát'], 'Liêm Trinh': ['Liêm Chinh', 'Liêm Chênh'], 'Cự Môn': ['Cự Mông'],
  'Hữu Bật': ['Hữu Bậc'], 'Văn Xương': ['Văn Sương'],
  'Tả Phù': ['Tả Phụ'], 'Vũ Khúc': ['Võ Khúc'], 'Nô Bộc': ['Giao Hữu'], 'Tử Nữ': ['Tử Tức'],
  'Phúc Đức': ['Phước Đức'], 'Hãm Địa': ['Hạn Địa', 'Hạn địa'], 'Đồng Hạn': ['đứa trẻ Hạn'],
};

export interface TermIssue { found: string; canonical: string; index: number; kind: 'variant' | 'han' }

const WORD = '[\\p{L}\\p{M}\\p{N}]';
const CANONICAL_OF = new Map(Object.entries(VARIANTS).flatMap(([c, vs]) => vs.map(v => [v, c] as const)));
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// Longest alternative first so "Hoá Kị" wins over "Hoá" at the same position.
const VARIANT_RE = new RegExp(`(?<!${WORD})(?:${[...CANONICAL_OF.keys()].sort((a, b) => b.length - a.length).map(escape).join('|')})(?!${WORD})`, 'gu');
const HAN_RUN_RE = /\p{Script=Han}(?:[\p{Script=Han}，、·]*\p{Script=Han})?/gu;
// Han is allowed inside (…)/（…）, 《…》, <Zh>…</Zh> and elements with lang="zh…". Masked to keep indexes.
const ALLOWED_RE = /[（(][^（()）]*[）)]|《[^》]*》|<Zh>[\s\S]*?<\/Zh>|<(\w+)[^>]*\blang=["']zh[^"']*["'][^>]*>[\s\S]*?<\/\1>/g;

/** Non-standard spellings (kind 'variant') and Han runs left outside allowed contexts (kind 'han').
 *  `index` refers to the NFC-normalised text. */
export function findTermIssues(text: string): TermIssue[] {
  const s = text.normalize('NFC');
  const out: TermIssue[] = [];
  for (const m of s.matchAll(VARIANT_RE)) out.push({ found: m[0], canonical: CANONICAL_OF.get(m[0])!, index: m.index!, kind: 'variant' });
  if (/\p{Script=Han}/u.test(s)) {
    const masked = s.replace(ALLOWED_RE, m => ' '.repeat(m.length));
    for (const m of masked.matchAll(HAN_RUN_RE)) out.push({ found: m[0], canonical: '', index: m.index!, kind: 'han' });
  }
  return out.sort((a, b) => a.index - b.index);
}
