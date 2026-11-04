/**
 * Domain terminology: Chinese engine identifiers → Vietnamese display names.
 *
 * The chart engine (lib/ziwei/*) uses Chinese strings as identifiers (star names,
 * palace names, stems, branches…). They are NEVER changed; translation happens only
 * at display time through `term()`.
 *
 * Sources (see LICENSES-AND-ATTRIBUTION.md):
 *  - glossary.iztro.json — generated from iztro's zh-CN/vi-VN locales (MIT).
 *  - CURATED below — standard Sino-Vietnamese (Hán-Việt) readings for terms iztro lacks
 *    or renders incorrectly. Each override states why.
 */
import iztro from './glossary.iztro.json';

export const CURATED: Record<string, string> = {
  // iztro errors
  '陷': 'Hãm',            // iztro vi-VN has the typo "Hạn"
  '童限': 'Đồng Hạn',     // iztro vi-VN has "đứa trẻ Hạn"
  // brightness levels iztro lacks
  '闲': 'Nhàn', '地': 'Địa',
  // engine names iztro lacks
  '交友': 'Nô Bộc', '交友宫': 'Nô Bộc',
  '副旬': 'Phó Tuần', '副截': 'Phó Triệt',
  '旬空': 'Tuần', '截空': 'Triệt',
  '化禄': 'Hóa Lộc', '化权': 'Hóa Quyền', '化科': 'Hóa Khoa', '化忌': 'Hóa Kỵ',
  '阳男': 'Dương Nam', '阴男': 'Âm Nam', '阳女': 'Dương Nữ', '阴女': 'Âm Nữ',
  // concepts
  '宫': 'Cung', '本命': 'Bản Mệnh', '命盘': 'Lá số', '命主': 'Mệnh Chủ', '身主': 'Thân Chủ',
  '五行局': 'Ngũ Hành Cục', '四化': 'Tứ Hóa', '自化': 'Tự Hóa', '飞化': 'Phi Hóa',
  '三方四正': 'Tam Phương Tứ Chính', '对宫': 'Đối Cung', '空宫': 'Vô Chính Diệu',
  '主星': 'Chính Tinh', '辅星': 'Phụ Tinh', '煞星': 'Sát Tinh', '杂曜': 'Tạp Diệu',
  '格局': 'Cách Cục', '合盘': 'Hợp Hôn', '真太阳时': 'Giờ Mặt Trời thực',
  '早子时': 'Giờ Tý sớm', '晚子时': 'Giờ Tý muộn', '时辰': 'Giờ (canh giờ)',
  '庙旺': 'Miếu Vượng', '落陷': 'Hãm Địa',
};

const GLOSSARY: Record<string, string> = { ...(iztro.terms as Record<string, string>), ...CURATED };

/** True if `zh` has a known Vietnamese rendering. */
export function hasTerm(zh: string): boolean {
  return lookup(zh) !== undefined;
}

function lookup(zh: string): string | undefined {
  if (GLOSSARY[zh]) return GLOSSARY[zh];
  if (zh.endsWith('宫') && GLOSSARY[zh.slice(0, -1)]) return GLOSSARY[zh.slice(0, -1)];
  if (zh.startsWith('化') && zh.length === 2 && GLOSSARY[zh.slice(1)]) return `Hóa ${GLOSSARY[zh.slice(1)]}`;
  return undefined;
}

/** Vietnamese display name for an engine term; falls back to the Chinese input. */
export function term(zh: string | undefined | null): string {
  if (!zh) return '';
  return lookup(zh) ?? zh;
}

/** "Thiên Can + Địa Chi" pair, e.g. stem 0 / branch 0 → "Giáp Tý". */
export const STEMS_VI = ['Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ', 'Canh', 'Tân', 'Nhâm', 'Quý'];
export const BRANCHES_VI = ['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi'];
export const stemBranchVi = (stem: number, branch: number) => `${STEMS_VI[stem] ?? '?'} ${BRANCHES_VI[branch] ?? '?'}`;

/** Translate every known term inside a free-text Chinese string (longest match first).
 *  Used to pre-normalise terminology before machine translation. */
const KEYS_BY_LENGTH = Object.keys(GLOSSARY).filter(k => k.length >= 2).sort((a, b) => b.length - a.length);
export function substituteTerms(text: string): string {
  let out = text;
  for (const k of KEYS_BY_LENGTH) if (out.includes(k)) out = out.split(k).join(GLOSSARY[k]);
  return out;
}

/** Glossary lines relevant to `text`, for prompting a translator. */
export function glossaryFor(text: string): string[] {
  return KEYS_BY_LENGTH.filter(k => text.includes(k)).map(k => `${k} = ${GLOSSARY[k]}`);
}

export function allTerms(): Readonly<Record<string, string>> {
  return GLOSSARY;
}
