/** Shared Vietnamese UI strings. Feature-specific strings live in sibling files. */
export const common = {
  appName: 'TuVi AI',
  appTagline: 'Lá số Tử Vi Đẩu Số tiếng Việt — chạy cục bộ, AI giải đoán có dẫn nguồn',
  nav: {
    home: 'Trang chủ',
    chart: 'Lập lá số',
    saved: 'Lá số đã lưu',
    heming: 'Hợp hôn',
    knowledge: 'Kiến thức',
    library: 'Cổ thư',
    settings: 'Cài đặt',
    privacy: 'Quyền riêng tư',
    about: 'Giới thiệu & nguồn',
  },
  actions: {
    back: 'Quay lại',
    close: 'Đóng',
    cancel: 'Hủy',
    save: 'Lưu',
    delete: 'Xóa',
    retry: 'Thử lại',
    send: 'Gửi',
    stop: 'Dừng',
    export: 'Xuất',
    import: 'Nhập',
    print: 'In / Xuất PDF',
    newChart: 'Lập lá số mới',
    loading: 'Đang tải…',
  },
  gender: { male: 'Nam', female: 'Nữ' },
  errors: {
    generic: 'Đã xảy ra lỗi. Vui lòng thử lại.',
    network: 'Không kết nối được máy chủ cục bộ.',
    aiUnavailable: 'Mô hình AI cục bộ (Ollama) chưa sẵn sàng. Lá số vẫn hoạt động bình thường.',
    invalidDate: 'Ngày sinh không hợp lệ.',
  },
  disclaimer:
    'Tử Vi Đẩu Số là hệ thống văn hóa – tín ngưỡng truyền thống, không phải khoa học đã được kiểm chứng. ' +
    'Nội dung chỉ mang tính tham khảo, không thay thế tư vấn y tế, pháp lý hay tài chính.',
  attribution:
    'Engine lập lá số: ziwei-doushu (MIT, Renhuai123). Dữ liệu luận giải: 紫微斗数开源解读数据集 v4.0 (CC BY 4.0, 王多鱼AI). Thuật ngữ: iztro (MIT).',
} as const;
