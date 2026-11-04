import type { TopicKey } from '@/lib/ziwei/db-analysis';

/** Strings for /knowledge. */
export const knowledge = {
  title: 'Kiến thức theo sao',
  intro: (n: number) => `14 chính tinh × 13 chủ đề = ${n} mục. Chọn một sao để xem ý nghĩa khi đóng ở từng cung.`,
  starsHeading: '14 chính tinh',
  inPalace: (star: string, palace: string) => `${star} tại cung ${palace}`,
  starSuffix: 'tinh',
  noContent:
    'Bản mã nguồn mở chưa kèm nội dung luận giải chi tiết cho mục này. Hãy lập lá số để AI giải đoán theo lá số của riêng bạn.',
  originalNote: 'Nguyên văn luận giải (chữ Hán)',
  sections: { dingdiao: 'Ý chính', lundian: 'Luận đoán cốt lõi', yiju: 'Căn cứ trên lá số', chuchu: 'Xuất xứ cổ thư' },
  ctaTitle: (topic: string) => `Muốn xem ${topic.toLowerCase()} trên lá số của bạn?`,
  ctaDesc: 'Nhập ngày giờ sinh để lập lá số và hỏi AI giải đoán.',
  ctaButton: 'Lập lá số ngay',
  otherTopics: (star: string) => `Sao ${star} ở các cung khác`,
  otherStars: (palace: string) => `Các chính tinh khác tại cung ${palace}`,
  readClassics: 'Muốn đọc nguyên điển?',
  classicsLink: 'Tra cứu Cổ thư — Toàn Tập / Toàn Thư / Cốt Tủy Phú →',
} as const;

/** Vietnamese labels for TOPIC_LABEL keys in lib/ziwei/db-analysis.ts (not edited there). */
export const TOPIC_LABEL_VI: Record<TopicKey, string> = {
  overview: 'Tổng quan mệnh cách',
  personality: 'Tính cách',
  love: 'Tình cảm hôn nhân',
  career: 'Sự nghiệp',
  wealth: 'Tài vận',
  health: 'Sức khỏe',
  family: 'Anh em, hợp tác',
  children: 'Con cái',
  move: 'Di chuyển, xuất ngoại',
  friends: 'Quan hệ, quý nhân',
  home: 'Nhà đất',
  spirit: 'Tinh thần, phúc đức',
  parents: 'Cha mẹ, bề trên',
};
