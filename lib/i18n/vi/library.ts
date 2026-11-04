/** Strings for /library (Cổ thư). Book bodies stay in original Chinese. */
export const library = {
  title: 'Cổ thư',
  intro: (books: number, paras: number) => `Tra cứu toàn văn ${books} bộ cổ thư Tử Vi Đẩu Số · ${paras} đoạn nguyên văn.`,
  searchPlaceholder: 'Nhập từ khóa chữ Hán để tìm trong nguyên văn',
  search: 'Tìm',
  chapters: (n: number) => `${n} chương`,
  paragraphs: (n: number) => `${n} đoạn`,
  open: 'Đọc →',
  aboutTitle: 'Về thư viện',
  aboutText: 'Các cổ thư đều thuộc phạm vi công cộng (bản khắc đời Minh). Nội dung đang được bổ sung dần.',
  toc: 'Mục lục',
  backToBook: (title: string) => `← Mục lục ${title}`,
  backToLibrary: '← Cổ thư',
  originalNote: 'Nguyên văn chữ Hán (phạm vi công cộng)',
  translationLabel: 'Bạch thoại',
  niNoteLabel: 'Chú của Nghê Hải Hạ',
  prev: '← Chương trước',
  next: 'Chương sau →',
  searchTitle: 'Kết quả tìm kiếm',
  keyword: 'Từ khóa',
  empty: '(trống)',
  found: (n: number) => `Tìm thấy ${n} đoạn nguyên văn khớp`,
  notFound: 'Không tìm thấy từ khóa này trong các cổ thư đã có.',
  tryThese: 'Thử tìm:',
  enterQuery: 'Hãy nhập từ khóa cần tìm.',
} as const;

/** Vietnamese metadata per book slug (lib/classics/data/* keeps the Chinese originals). */
export const BOOK_VI: Record<string, { title: string; dynasty: string; author: string; intro: string }> = {
  gusuifu: {
    title: 'Cốt Tủy Phú',
    dynasty: 'Đời Minh',
    author: 'Truyền bản cổ, không rõ tác giả',
    intro: 'Bài phú cô đọng nhất về cốt lõi Tử Vi Đẩu Số, khoảng 1.500 chữ. Nghê Hải Hạ dẫn nhiều lần trong Thiên Kỷ; là kinh điển bắt buộc phải đọc.',
  },
  quanji: {
    title: 'Tử Vi Đẩu Số Toàn Tập',
    dynasty: 'Đời Minh',
    author: 'Tương truyền do Trần Đoàn truyền lại',
    intro: 'Một trong những cổ thư có uy tín nhất, tương truyền do Trần Đoàn đời Tống truyền dạy; nguồn dẫn chứng chính của hệ thống Nghê Hải Hạ.',
  },
  quanshu: {
    title: 'Tử Vi Đẩu Số Toàn Thư',
    dynasty: 'Đời Minh',
    author: 'La Hồng Tiên biên soạn',
    intro: 'Cổ thư có hệ thống nhất, nhấn mạnh quan hệ giữa 12 cung và Tứ Hóa; là giáo trình chính của người học Tử Vi từ đời Thanh trở đi.',
  },
};
