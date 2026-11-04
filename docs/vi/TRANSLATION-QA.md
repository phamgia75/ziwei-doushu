# Kiểm định chất lượng bản dịch (Translation QA)

> Tệp sinh tự động bởi `scripts/i18n/translation-qa.ts` từ `tests/fixtures/translation-qa.jsonl` — không sửa tay.

## Kết quả

- Mô hình dịch: Ollama `qwen3.5:35b` (cục bộ), qua `translateChunk` (lib/server/translate.ts), có cache.
- Số đoạn: 45 (39 từ bộ dữ liệu v4.0, 6 cổ thư).
- Đạt toàn bộ kiểm tra tự động: **42/45 (93%)**.

| Loại lỗi | Số đoạn |
|---|---|
| Còn chữ Hán ngoài ngoặc | 2 |
| Tỉ lệ độ dài bất thường (<1.3 hoặc >7) | 0 |
| Thiếu thuật ngữ bắt buộc | 1 |
| Cách viết không chuẩn (VARIANTS) | 0 |

Thuật ngữ hay bị thiếu: cung Phụ Mẫu (1).

| Dạng đoạn | Đạt |
|---|---|
| prose | 13/13 (100%) |
| heading | 8/9 (89%) |
| list | 7/9 (78%) |
| star | 8/8 (100%) |
| classic | 6/6 (100%) |

| Chủ đề / nguồn | Đạt |
|---|---|
| overview | 3/3 (100%) |
| personality | 3/3 (100%) |
| love | 3/3 (100%) |
| career | 3/3 (100%) |
| wealth | 3/3 (100%) |
| health | 3/3 (100%) |
| family | 3/3 (100%) |
| children | 3/3 (100%) |
| move | 3/3 (100%) |
| friends | 1/3 (33%) |
| home | 3/3 (100%) |
| spirit | 3/3 (100%) |
| parents | 2/3 (67%) |
| cổ thư | 6/6 (100%) |

## Ví dụ kém nhất

### ds-39 (list, 1990s-parents)

- Lỗi: thiếu cung Phụ Mẫu
- zh: · **太阳入父母宫**——父亲与上司多在公众场合发挥影响。 · **父母太阳入庙**——父亲社会地位高，是重要贵人。 · **父母太阳落陷**——古书「陷地克父」，主先克父。
- vi: · **Thái Dương nhập Phụ Mẫu cung** – Cha và cấp trên thường phát huy ảnh hưởng tại các nơi công cộng. · **Phụ Mẫu Thái Dương miếu vượng** – Địa vị xã hội của cha cao, là quý nhân trọng yếu. · **Phụ Mẫu Thái Dương hãm địa…

### ds-29 (heading, 1960s-friends)

- Lỗi: còn 1 cụm chữ Hán
- zh: **【人际总览】**
- vi: **【Tổng quan Nhân際】**

### ds-30 (list, 1960s-friends)

- Lỗi: còn 1 cụm chữ Hán
- zh: · **天梁入交友宫**——朋友多智者，老成持重。 · **交友天梁会左辅右弼**——下属忠诚有担当。 · **天梁奴多旺主**——下属多，能旺你。
- vi: · **Thiên Lương nhập cung Nô Bộc** – Bạn bè nhiều trí tuệ, già dặn稳重. · **Cung Nô Bộc Thiên Lương hội Tả Phù Hữu Bật** – Cấp dưới trung thành có trách nhiệm. · **Thiên Lương nô đa vượng chủ** – Cấp dưới đông, có thể làm …

## Phương pháp

- 8 lá số cố định trải từ thập niên 1950 đến 2010, nam/nữ xen kẽ, các giờ sinh khác nhau; mỗi chủ đề (13) lấy 3 đoạn: 1 đoạn văn xuôi + 2 trong số tiêu đề / danh sách / dòng phân tích sao (▍ ✦ ▶ ◇), luân phiên.
- Đoạn được cắt bằng `splitParagraphs` giống lúc chạy thật; 6 đoạn cổ thư lấy từ `lib/classics` (Toàn Thư, Toàn Tập, Cốt Tủy Phú).
- Kiểm tra tự động: `validateTranslation` (chữ Hán, tỉ lệ độ dài, thuật ngữ bắt buộc từ `glossaryFor`, VARIANTS) + `findTermIssues` (chữ Hán ngoài ngoặc / 《》).
- Loại trừ: đoạn trích dẫn Nghê Hải Hạ (倪, 天纪 — CC BY-NC-SA) và đoạn có chuỗi ngày dạng YYYY-MM-DD. Không ghi ngày sinh: mỗi bản ghi chỉ định danh bằng `<thập niên>-<chủ đề>`.

## Nguồn và giấy phép

- Đoạn từ bộ dữ liệu: 紫微斗数开源解读数据集 v4.0（674,976 张命盘 × 13 维）, tác giả 王多鱼AI, https://github.com/Renhuai123/ziwei-doushu, bản phát hành v4.0-13d — CC BY 4.0. Bản dịch tiếng Việt là tác phẩm phái sinh, cùng điều kiện ghi nguồn.
- Cổ thư (紫微斗数全书 / 全集 / 骨髓赋): phạm vi công cộng.
- Thuật ngữ: iztro vi-VN (MIT) + bổ sung của TuVi AI — xem `docs/vi/THUAT-NGU.md`.

## Lưu ý trung thực

Các kiểm tra trên là **tự động và chỉ bắt lỗi bề mặt**: còn chữ Hán, độ dài lệch, thiếu thuật ngữ, sai chính tả đã biết. Chúng **không** chứng minh bản dịch đúng nghĩa, tự nhiên hay trung thành với nguyên văn. Một đoạn "đạt" vẫn có thể dịch sai ý. Cần người hiệu đính thông thạo cả tiếng Trung và Tử Vi đọc lại trước khi coi bản dịch là chính xác.
