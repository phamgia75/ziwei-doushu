/**
 * SEO 知识页 — 数据 helper
 *
 * 14 主星 × 13 topic = 182 个独立 SEO URL
 * 每页都是 STAR_DB 中对应字段的 4 段 markers（一句话定调/核心论断/命盘依据/经典出处）
 */

import { STAR_DB } from '@/lib/ziwei/db-analysis';
import type { TopicKey } from '@/lib/ziwei/db-analysis';
import { TOPIC_PALACE_NAME, TOPIC_LABEL } from '@/lib/ziwei/db-analysis';

export const ALL_STARS = [ // i18n-ok: engine star identifiers, displayed via term()
  '紫微', '天机', '太阳', '武曲', '天同', '廉贞', '天府', // i18n-ok: engine star identifiers
  '太阴', '贪狼', '巨门', '天相', '天梁', '七杀', '破军', // i18n-ok: engine star identifiers
];

// 主星名 ↔ 拼音 slug 映射（URL 用 slug，避免中文 URL 在 Vercel/CDN 上的边界问题）
export const STAR_TO_SLUG: Record<string, string> = {
  '紫微': 'ziwei',
  '天机': 'tianji',
  '太阳': 'taiyang',
  '武曲': 'wuqu',
  '天同': 'tiantong',
  '廉贞': 'lianzhen',
  '天府': 'tianfu',
  '太阴': 'taiyin',
  '贪狼': 'tanlang',
  '巨门': 'jumen',
  '天相': 'tianxiang',
  '天梁': 'tianliang',
  '七杀': 'qisha',
  '破军': 'pojun',
};

export const SLUG_TO_STAR: Record<string, string> = Object.fromEntries(
  Object.entries(STAR_TO_SLUG).map(([k, v]) => [v, k])
);

export const ALL_TOPICS: TopicKey[] = [
  'overview', 'personality', 'love', 'career', 'wealth', 'health',
  'family', 'children', 'move', 'friends', 'home', 'spirit', 'parents',
];

interface StarContent {
  mingGong: string;
  personality: string;
  xiongDi?: string;
  fuQi: string;
  ziNv?: string;
  caiBo: string;
  jiE: string;
  qianYi?: string;
  jiaoYou?: string;
  guanLu: string;
  tianZhai?: string;
  fuDe?: string;
  fuMu?: string;
}

const TOPIC_TO_FIELD: Record<TopicKey, keyof StarContent> = {
  overview:    'mingGong',
  personality: 'personality',
  love:        'fuQi',
  career:      'guanLu',
  wealth:      'caiBo',
  health:      'jiE',
  family:      'xiongDi' as keyof StarContent,
  children:    'ziNv' as keyof StarContent,
  move:        'qianYi' as keyof StarContent,
  friends:     'jiaoYou' as keyof StarContent,
  home:        'tianZhai' as keyof StarContent,
  spirit:      'fuDe' as keyof StarContent,
  parents:     'fuMu' as keyof StarContent,
};

interface ParsedContent {
  dingdiao: string;
  lundian: string;
  yiju: string;
  chuchu: string;
  raw: string;
  hasMarkers: boolean;
}

function parseStarContent(content: string): ParsedContent {
  const out: ParsedContent = { dingdiao: '', lundian: '', yiju: '', chuchu: '', raw: content, hasMarkers: false };
  if (!content) return out;
  // i18n-ok: section markers in the source dataset text, not displayed
  if (!content.includes('**【一句话定调】**') && !content.includes('**【核心论断】**')) {
    out.lundian = content;
    return out;
  }
  out.hasMarkers = true;
  const re = /\*\*【([^】]+)】\*\*/g;
  const parts: { name: string; markerEnd: number; start: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(content)) !== null) {
    parts.push({ name: m[1], start: m.index, markerEnd: m.index + m[0].length });
  }
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    const end = i + 1 < parts.length ? parts[i + 1].start : content.length;
    const text = content.slice(p.markerEnd, end).trim();
    if (p.name === '一句话定调') out.dingdiao = text;
    else if (p.name === '核心论断') out.lundian = text;
    else if (p.name === '命盘依据') out.yiju = text;
    else if (p.name === '经典出处') out.chuchu = text;
  }
  return out;
}

export interface KnowledgeData {
  star: string;
  topic: TopicKey;
  topicLabel: string;
  palaceName: string;
  parsed: ParsedContent;
  exists: boolean;
}

export function getKnowledge(star: string, topic: TopicKey): KnowledgeData {
  const profile = STAR_DB[star] as StarContent | undefined;
  const field = TOPIC_TO_FIELD[topic];
  const content = profile && field ? (profile[field] as string | undefined) ?? '' : '';
  return {
    star,
    topic,
    topicLabel: TOPIC_LABEL[topic],
    palaceName: TOPIC_PALACE_NAME[topic],
    parsed: parseStarContent(content),
    exists: Boolean(content),
  };
}

/** 生成所有 14×13 组合（用于 generateStaticParams） */
export function getAllKnowledgeRoutes() {
  const routes: { star: string; slug: string; topic: TopicKey }[] = [];
  for (const star of ALL_STARS) {
    for (const topic of ALL_TOPICS) {
      const data = getKnowledge(star, topic);
      if (data.exists) routes.push({ star, slug: STAR_TO_SLUG[star], topic });
    }
  }
  return routes;
}

/** Short Vietnamese profile of each major star (shown on /knowledge). Keys are engine identifiers. */
export const STAR_BRIEF_SEO: Record<string, string> = {
  '紫微': 'Tử Vi là đế tinh, chủ tôn quý, hóa khí là Tôn. Đóng cung Mệnh: có khí chất lãnh đạo, hợp với vị trí cao, môi trường lớn.',
  '天机': 'Thiên Cơ là sao trí tuệ, chủ linh hoạt, hay biến đổi, hóa khí là Thiện. Đóng cung Mệnh: thông minh, nhanh nhạy, hợp vai trò tham mưu, hoạch định.',
  '太阳': 'Thái Dương là quý tinh của nam, chủ danh dự và việc công, hóa khí là Quý. Đóng cung Mệnh: quang minh lỗi lạc, hợp công chức, nghề cần danh tiếng.',
  '武曲': 'Vũ Khúc là tài tinh, chủ cương nghị quyết đoán, hóa khí là Tài. Đóng cung Mệnh: giỏi quản lý tiền bạc, hợp kinh doanh thực nghiệp, tài chính.',
  '天同': 'Thiên Đồng là phúc tinh, chủ ôn hòa, hưởng thụ, hóa khí là Phúc. Đóng cung Mệnh: tính tình hiền hòa, có phúc khí.',
  '廉贞': 'Liêm Trinh là thứ đào hoa tinh, văn võ kiêm toàn, hóa khí là Tù. Đóng cung Mệnh: đa tài đa nghệ, tình cảm phong phú.',
  '天府': 'Thiên Phủ là nam đế, sao giữ kho, chủ ổn trọng, bảo thủ, hóa khí là Lệnh. Đóng cung Mệnh: phẩm hạnh đoan chính, giỏi giữ của.',
  '太阴': 'Thái Âm là sao mặt trăng, chủ phú quý và điền trạch, hóa khí là Phú. Đóng cung Mệnh: tình cảm tinh tế; nữ mệnh gặp là tốt nhất.',
  '贪狼': 'Tham Lang là sao đào hoa và dục vọng, đa tài, giỏi giao tiếp, hóa khí là Đào Hoa. Đóng cung Mệnh: nhiều tài nghệ, quan hệ rộng.',
  '巨门': 'Cự Môn là sao thị phi và khẩu tài, chủ tranh biện, truyền thông, hóa khí là Ám. Đóng cung Mệnh: ăn nói giỏi, hợp nghề luật sư, giáo viên.',
  '天相': 'Thiên Tướng là ấn tinh phụ tá, chủ trung hậu thật thà, hóa khí là Ấn. Đóng cung Mệnh: phẩm hạnh đoan chính, hợp hành chính, pháp vụ.',
  '天梁': 'Thiên Lương là sao người già, ấm tinh, giỏi gặp hung hóa cát, hóa khí là Ấm. Đóng cung Mệnh: từ bi lương thiện, hợp ngành luật, y.',
  '七杀': 'Thất Sát là tướng tinh, chủ cô độc, quyết đoán, mạo hiểm, hóa khí là Túc Sát. Đóng cung Mệnh: cương nghị, hợp quân đội, cảnh sát, khởi nghiệp.',
  '破军': 'Phá Quân là sao phá cũ đổi mới, chủ duyên lục thân mỏng, hóa khí là Hao. Đóng cung Mệnh: thích khai phá, biến động, hợp chuyên môn kỹ thuật.',
};
