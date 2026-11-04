/** Chart board (ChartBoard / PalaceCell / TimeNav) strings. */
import type { SiHua, StarBrightness } from '@/lib/ziwei/types';

/** Short Tứ Hóa badge text, keyed by the engine's SiHua identifier. */
export const SIHUA_SHORT: Record<SiHua, string> = { '禄': 'Lộc', '权': 'Quyền', '科': 'Khoa', '忌': 'Kỵ' };
/** Full Tứ Hóa name, keyed by the engine's SiHua identifier. */
export const SIHUA_FULL: Record<SiHua, string> = { '禄': 'Hóa Lộc', '权': 'Hóa Quyền', '科': 'Hóa Khoa', '忌': 'Hóa Kỵ' };

/** Cell abbreviation for each brightness level (legend: BRIGHTNESS_LEGEND). */
export const BRIGHTNESS_SHORT: Record<StarBrightness, string> = {
  '庙': 'M', '旺': 'V', '得': 'Đ', '利': 'L', '平': 'B', '不': 'Bt', '闲': 'N', '陷': 'H', '地': 'Đị',
};
export const BRIGHTNESS_FULL: Record<StarBrightness, string> = {
  '庙': 'Miếu', '旺': 'Vượng', '得': 'Đắc', '利': 'Lợi', '平': 'Bình', '不': 'Bất', '闲': 'Nhàn', '陷': 'Hãm', '地': 'Địa',
};
export const BRIGHTNESS_LEGEND = 'M Miếu · V Vượng · Đ Đắc · L Lợi · B Bình · Bt Bất · H Hãm';

export const chart = {
  boardTitle: 'Lá số Tử Vi',
  boardKicker: 'Tử Vi Đẩu Số',
  center: {
    ming: 'Mệnh',
    shen: 'Thân',
    currentDaXian: 'Đại Hạn hiện tại',
    ageRange: (a: number, b: number) => `${a}–${b} tuổi`,
    lunar: 'Âm lịch',
    leap: 'nhuận',
  },
  cell: {
    mingBadge: 'Mệnh',
    shenBadge: 'Thân',
    empty: 'Vô Chính Diệu',
    daXianAge: 'Đại Hạn (tuổi)',
  },
  overlayLabel: { daxian: 'ĐH', liunian: 'LN' },
  legendClick: 'Chạm vào cung để xem Tam Phương Tứ Chính',
  legendBrightness: 'Độ sáng',
  nav: {
    natal: 'Bản Mệnh',
    daxian: 'Đại Hạn',
    liunian: 'Lưu Niên',
    prevYear: 'Năm trước',
    nextYear: 'Năm sau',
    overlayIntro: (scope: string, stem: string) => `${scope} · can ${stem} — Tứ Hóa:`,
  },
} as const;

/** ChartSummary strings. */
export const summary = {
  overview: 'Tổng quan mệnh cách',
  mingStars: 'Chính tinh cung Mệnh',
  empty: 'Vô Chính Diệu',
  traits: 'Đặc điểm tính cách',
  juAndDaXian: 'Ngũ Hành Cục · Đại Hạn hiện tại',
  age: (a: number, b: number) => `${a}–${b} tuổi`,
  solar: 'Dương lịch',
  lunar: (d: number, m: number, y: number, leap: boolean) => `Âm lịch ${d}/${m}${leap ? ' (nhuận)' : ''}/${y}`,
  yearHour: (year: string, hour: string) => `Năm ${year} · giờ ${hour}`,
  mingShen: (ming: string, shen: string) => `Mệnh tại ${ming} · Thân tại ${shen}`,
  natalSiHua: 'Tứ Hóa bản mệnh',
  daXianTimeline: 'Vận trình Đại Hạn',
} as const;
