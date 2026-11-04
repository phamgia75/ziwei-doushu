# TuVi AI — Tử Vi Đẩu Số tiếng Việt, chạy cục bộ

Ứng dụng lập và luận giải lá số Tử Vi Đẩu Số bằng tiếng Việt, dựa trên engine mã nguồn mở
[ziwei-doushu](https://github.com/Renhuai123/ziwei-doushu) (MIT). Mọi thứ chạy trên máy bạn:
lá số tính ngay trong trình duyệt, AI mặc định là Ollama cục bộ, không tài khoản, không quảng cáo.

## Tính năng
- **Lập lá số**: nhập ngày giờ sinh Dương lịch, nơi sinh tại 63 tỉnh/thành (tự tính múi giờ lịch sử,
  ví dụ miền Nam UTC+8 giai đoạn 1960–1975) → Giờ Mặt Trời thực → lá số 12 cung đầy đủ chính tinh,
  phụ tinh, độ sáng, Tứ Hóa, Đại Hạn, Lưu Niên.
- **Bấm vào cung / sao** để xem giải thích; AI giải thích riêng từng cung, từng sao.
- **13 chủ đề luận giải** (tổng quan, tính cách, sự nghiệp, tài chính, tình duyên, anh chị em, con cái,
  cha mẹ, sức khỏe truyền thống, nhà cửa, bạn bè, đi xa, phúc đức) từ bộ dữ liệu luận giải v4.0, dịch máy
  sang tiếng Việt theo yêu cầu, có nguyên văn đối chiếu.
- **Hỏi AI** về chính lá số đang mở; **Vận hạn** theo Đại Hạn / Lưu Niên bất kỳ năm nào.
- **Hợp hôn**: so hai lá số (tình cảm, hợp tác, cha mẹ – con cái, bạn bè).
- **Truy vết**: mọi câu trả lời AI ghi mã dữ kiện [F#] và nguồn [S#]; hệ thống tự đối chiếu nhận định
  vị trí sao với lá số và cảnh báo nếu AI nói sai.
- **Quy ước tùy chọn**: Giờ Tý muộn, tháng nhuận, bảng độ sáng, lịch âm Việt Nam/Trung Quốc, phương trình thời gian.
- **Lưu lá số** trong trình duyệt, xuất/nhập JSON, xóa dữ liệu; **In / Xuất PDF**.
- **Cổ thư** (Toàn Thư, Toàn Tập, Cốt Tủy Phú) nguyên văn + dịch AI từng chương.

## Bắt đầu nhanh
```bash
npm ci
npm run dataset:fetch      # tùy chọn, ~161 MB, có kiểm tra SHA-256
./scripts/start.sh         # → http://localhost:3000
./scripts/stop.sh
```
Chi tiết: [INSTALL.md](INSTALL.md). Kiến trúc: [ARCHITECTURE.md](ARCHITECTURE.md).
Giới hạn: [KNOWN-LIMITATIONS.md](KNOWN-LIMITATIONS.md). Nguồn & giấy phép: [LICENSES-AND-ATTRIBUTION.md](LICENSES-AND-ATTRIBUTION.md).

## Lưu ý
Tử Vi Đẩu Số là hệ thống văn hóa – tín ngưỡng truyền thống, **không phải khoa học đã được kiểm chứng**.
Nội dung chỉ để tham khảo, không thay thế tư vấn y tế, pháp lý hay tài chính.

Dữ liệu: *本项目使用了 紫微斗数开源解读数据集 v4.0（674,976 张命盘 × 13 维）— 来源：https://github.com/Renhuai123/ziwei-doushu — 作者：王多鱼AI* (CC BY 4.0).
