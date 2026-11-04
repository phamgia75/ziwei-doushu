/** The 13 interpretation topics of dataset v4.0, with the palace each one centres on. */
export const TOPICS = [
  { key: 'overview', label: 'Tổng quan', palace: '命宫', desc: 'Cách cục chung của lá số' },
  { key: 'personality', label: 'Tính cách', palace: '命宫', desc: 'Bản tính, khí chất' },
  { key: 'career', label: 'Sự nghiệp', palace: '官禄', desc: 'Công việc, nghề nghiệp' },
  { key: 'wealth', label: 'Tài chính', palace: '财帛', desc: 'Tiền bạc, nguồn thu' },
  { key: 'love', label: 'Tình duyên & hôn nhân', palace: '夫妻', desc: 'Tình cảm, vợ chồng' },
  { key: 'family', label: 'Anh chị em', palace: '兄弟', desc: 'Cung Huynh Đệ' },
  { key: 'children', label: 'Con cái', palace: '子女', desc: 'Cung Tử Nữ' },
  { key: 'parents', label: 'Cha mẹ', palace: '父母', desc: 'Cung Phụ Mẫu' },
  { key: 'health', label: 'Sức khỏe (truyền thống)', palace: '疾厄', desc: 'Quan niệm truyền thống, không phải chẩn đoán y khoa' },
  { key: 'home', label: 'Nhà cửa, điền sản', palace: '田宅', desc: 'Cung Điền Trạch' },
  { key: 'friends', label: 'Bạn bè, quan hệ xã hội', palace: '仆役', desc: 'Cung Nô Bộc' },
  { key: 'move', label: 'Đi xa, thay đổi môi trường', palace: '迁移', desc: 'Cung Thiên Di' },
  { key: 'spirit', label: 'Tinh thần, phúc đức', palace: '福德', desc: 'Cung Phúc Đức' },
] as const;

export type TopicKey = typeof TOPICS[number]['key'];
export const TOPIC_KEYS = TOPICS.map(t => t.key) as TopicKey[];
export const topicByKey = (k: string) => TOPICS.find(t => t.key === k);
