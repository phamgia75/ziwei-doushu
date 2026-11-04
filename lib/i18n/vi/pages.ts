/** Strings for the app shell (header) and the static pages: home, privacy, terms, about. */
export const header = {
  homeLabel: 'Về trang chủ',
  about: 'Giới thiệu',
  menu: 'Mở menu',
  closeMenu: 'Đóng menu',
  toLight: 'Chuyển sang giao diện sáng',
  toDark: 'Chuyển sang giao diện tối',
} as const;

export const home = {
  title: 'TuVi AI — Tử Vi Đẩu Số',
  intro:
    'TuVi AI lập lá số Tử Vi Đẩu Số đầy đủ 12 cung, Tứ Hóa, Đại Hạn và Lưu Niên ngay trên máy của bạn. ' +
    'Phần giải đoán do mô hình AI cục bộ (Ollama) đảm nhận, có dẫn nguồn từ dữ liệu luận giải và cổ thư. ' +
    'Ngày giờ sinh của bạn không rời khỏi máy này trừ khi bạn tự bật nhà cung cấp AI bên ngoài.',
  cta: 'Lập lá số',
  cards: [
    { href: '/heming', title: 'Hợp hôn', desc: 'So hai lá số để xem mức tương hợp, điểm bổ trợ và điểm dễ va chạm.' },
    { href: '/knowledge', title: 'Kiến thức theo sao', desc: '14 chính tinh và ý nghĩa khi đóng ở từng cung.' },
    { href: '/library', title: 'Cổ thư', desc: 'Tử Vi Đẩu Số Toàn Thư, Toàn Tập và Cốt Tủy Phú — nguyên văn chữ Hán, tra cứu được.' },
    { href: '/settings', title: 'Cài đặt & quyền riêng tư', desc: 'Chọn mô hình AI, xuất hoặc xóa toàn bộ dữ liệu đã lưu.' },
  ],
  savedTitle: 'Lá số đã lưu',
  privacyLink: 'Quyền riêng tư',
  termsLink: 'Điều khoản',
  aboutLink: 'Giới thiệu & nguồn',
} as const;

export const privacy = {
  title: 'Quyền riêng tư',
  intro: 'TuVi AI là ứng dụng chạy cục bộ. Không có tài khoản, không quảng cáo, không công cụ theo dõi của bên thứ ba.',
  sections: [
    {
      h: 'Dữ liệu ngày giờ sinh',
      p: [
        'Thông tin bạn nhập (họ tên, ngày giờ sinh, giới tính, nơi sinh) được lưu trong trình duyệt (localStorage) và trên chính máy tính này.',
        'Không có máy chủ đám mây nào của TuVi AI nhận dữ liệu này.',
      ],
    },
    {
      h: 'Máy chủ cục bộ và AI',
      p: [
        'Máy chủ cục bộ (http://localhost:3000) lập lại lá số từ ngày giờ sinh và mặc định chỉ trao đổi với Ollama chạy trên máy của bạn.',
        'Nhà cung cấp AI bên ngoài (tương thích OpenAI hoặc Claude) chỉ được dùng khi bạn chủ động bật trong Cài đặt. Khi đó, các dữ kiện lá số (sao, cung, Tứ Hóa, Đại Hạn… — không kèm họ tên) sẽ được gửi tới nhà cung cấp đó và chịu chính sách bảo mật của họ.',
      ],
    },
    {
      h: 'Xuất và xóa dữ liệu',
      p: [
        'Vào Cài đặt để xuất toàn bộ lá số đã lưu ra tệp JSON hoặc xóa tất cả.',
        'Bạn cũng có thể xóa dữ liệu trang web (localStorage) của localhost trong phần cài đặt trình duyệt.',
      ],
    },
  ],
  settingsLink: 'Mở Cài đặt',
} as const;

export const terms = {
  title: 'Điều khoản sử dụng',
  points: [
    'TuVi AI là công cụ tham khảo văn hóa: lá số và lời giải đoán dựa trên hệ thống Tử Vi Đẩu Số truyền thống, không phải khoa học đã được kiểm chứng.',
    'Nội dung không phải lời khuyên y tế, tâm lý, pháp lý, tài chính hay đầu tư. Đừng dựa vào đó để đưa ra quyết định quan trọng.',
    'Lời giải đoán do AI tạo ra có thể sai, thiếu hoặc mâu thuẫn. Hãy đọc với tinh thần phê phán.',
    'Ứng dụng được cung cấp “nguyên trạng”, không kèm bảo đảm nào. Bạn tự chịu trách nhiệm về việc sử dụng.',
    'Mã nguồn và dữ liệu đi kèm tuân theo giấy phép riêng của từng phần (xem Giới thiệu & nguồn).',
  ],
} as const;

export const about = {
  title: 'Giới thiệu & nguồn',
  what:
    'TuVi AI là bản Việt hóa, chạy cục bộ, của một ứng dụng Tử Vi Đẩu Số mã nguồn mở. Ứng dụng lập lá số bằng engine có sẵn, ' +
    'giải đoán bằng mô hình AI cục bộ có dẫn nguồn, kèm thư viện cổ thư và kiến thức theo sao.',
  creditsTitle: 'Ghi công & giấy phép',
  engine: 'Engine lập lá số: ziwei-doushu của Renhuai123 — giấy phép MIT.',
  datasetIntro: 'Dữ liệu luận giải — giấy phép CC BY 4.0. Ghi nguồn theo yêu cầu của DATASET-LICENSE:',
  tianjiA: 'Các trích dẫn lời Nghê Hải Hạ trong Thiên Kỷ',
  tianjiB:
    'không thuộc phạm vi CC BY: bản quyền thuộc về chủ sở hữu quyền. ' +
    'Việc dùng hàng loạt các trích dẫn này tuân theo CC BY-NC-SA 4.0 (xem docs/tianji-ziwei/LICENSE.md).',
  datasetNote: 'Nguyên văn ghi nguồn bắt buộc (chữ Hán):',
  classics: 'Cổ thư (Tử Vi Đẩu Số Toàn Thư, Tử Vi Đẩu Số Toàn Tập, Cốt Tủy Phú): thuộc phạm vi công cộng.',
  iztro: 'iztro (MIT): nguồn bảng thuật ngữ Trung – Việt.',
  lunar: 'lunar-javascript (MIT): lịch âm và can chi.',
  disclaimerTitle: 'Lưu ý văn hóa',
} as const;
