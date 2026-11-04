# Kiểm định chất lượng bản dịch (Translation QA)

> Tệp sinh tự động bởi `scripts/i18n/translation-qa.ts` từ `tests/fixtures/translation-qa.jsonl` — không sửa tay.

## Kết quả

- Mô hình dịch: Ollama `qwen3.5:35b` (cục bộ), qua `translateChunk` (lib/server/translate.ts), có cache.
- Số đoạn: 45 (39 từ bộ dữ liệu v4.0, 6 cổ thư).
- Đạt toàn bộ kiểm tra tự động: **36/45 (80%)**.

| Loại lỗi | Số đoạn |
|---|---|
| Còn chữ Hán ngoài ngoặc | 8 |
| Tỉ lệ độ dài bất thường (<1.3 hoặc >7) | 0 |
| Thiếu thuật ngữ bắt buộc | 1 |
| Cách viết không chuẩn (VARIANTS) | 0 |

Thuật ngữ hay bị thiếu: cung Phụ Mẫu (1).

| Dạng đoạn | Đạt |
|---|---|
| prose | 10/13 (77%) |
| heading | 8/9 (89%) |
| list | 7/9 (78%) |
| star | 8/8 (100%) |
| classic | 3/6 (50%) |

| Chủ đề / nguồn | Đạt |
|---|---|
| overview | 3/3 (100%) |
| personality | 2/3 (67%) |
| love | 3/3 (100%) |
| career | 3/3 (100%) |
| wealth | 3/3 (100%) |
| health | 3/3 (100%) |
| family | 3/3 (100%) |
| children | 3/3 (100%) |
| move | 2/3 (67%) |
| friends | 0/3 (0%) |
| home | 3/3 (100%) |
| spirit | 3/3 (100%) |
| parents | 2/3 (67%) |
| cổ thư | 3/6 (50%) |

## Ví dụ kém nhất

### ds-39 (list, 1990s-parents)

- Lỗi: thiếu cung Phụ Mẫu
- zh: · **太阳入父母宫**——父亲与上司多在公众场合发挥影响。 · **父母太阳入庙**——父亲社会地位高，是重要贵人。 · **父母太阳落陷**——古书「陷地克父」，主先克父。
- vi: · **Thái Dương nhập Phụ Mẫu cung** – Cha và cấp trên thường phát huy ảnh hưởng tại các nơi công cộng. · **Phụ Mẫu Thái Dương miếu vượng** – Địa vị xã hội của cha cao, là quý nhân trọng yếu. · **Phụ Mẫu Thái Dương hãm địa…

### cl-2 (classic, gusuifu/4/gsf-5-1)

- Lỗi: còn 1 cụm chữ Hán
- zh: 天机、太阴、天同、天梁四星齐入命迁财官，称「机月同梁格」。主文质彬彬、聪慧善谋。最适合公职、学术、文艺、医疗、服务等需稳定累积的行业，不宜大冒险大投机。
- vi: Thiên Cơ, Thái Âm, Thiên Đồng, Thiên Lương tứ tinh đồng nhập Mệnh, Thiên Di, Tài Bạch, Quan Lộc, gọi là «Cơ Nguyệt Đồng Lương cách». Chủ văn chất彬彬, thông tuệ thiện mưu. Tối thích công chức, học thuật, văn nghệ, y tế, dị…

### cl-3 (classic, quanji/0/qj-1-1)

- Lỗi: còn 1 cụm chữ Hán
- zh: 夫紫微斗数者，乃陈抟祖师所传，原以紫微为帝座，统御百星。星曜各有所主，各有庙旺利陷之分，会照吉凶之别。看命者，必先安星，次定命宫身宫，三看十二宫吉凶，四参大限流年之飞化。
- vi: Tử Vi Đẩu Số là do Tổ Sư Trần Thuấn truyền lại, nguyên bản lấy Tử Vi làm Đế tọa, thống ngự bách tinh. Các sao đều có chủ quản riêng, mỗi sao đều có phân biệt miếu vượng lợi hãm, sự khác biệt về cát hung khi hội chiếu. Ng…

### cl-6 (classic, quanshu/3/qs-4-1)

- Lỗi: còn 1 cụm chữ Hán
- zh: 夫妻宫主配偶气质、婚姻状态。夫妻宫紫微主配偶端庄威权，宜迟婚；夫妻宫贪狼主配偶多情，桃花重；夫妻宫天梁主配偶成熟稳重，年长。
- vi: Cung Phu Thê chủ về khí chất của phu thê, trạng thái hôn nhân. Cung Phu Thê có Tử Vi thì chủ phu thê đoan trang uy quyền, thích hợp kết hôn muộn; cung Phu Thê có Tham Lang thì chủ phu thê đa tình, đào hoa nặng; cung Phu …

### ds-04 (prose, 1960s-personality)

- Lỗi: còn 1 cụm chữ Hán
- zh: 你天生不是小鸟依人的性子。可从小到大，周围总暗示你「女孩子收着点」。你的气势不是装出来的，眼神里有分量，进任何场合都被一眼认出。这股劲在职场上是本钱，可在两个人的关系里就成了压力。你不是不想温柔，只是很难把温柔演成顺从——你没法把自己摆在别人下面，这不是脾气坏，是你习惯了站在主位。所以你在感情里总撞同一堵墙：吸引你的男人多半也强，处着处着就互相较劲；找个温和的，又嫌他撑不住你。
- vi: Bạn vốn dĩ không phải là người có tính cách nhu nhược, yếu đuối. Nhưng từ nhỏ đến lớn, xung quanh luôn ám chỉ bạn rằng "con gái nên giữ mình". Khí thế của bạn không phải do giả tạo, ánh mắt mang trọng lượng, bước vào bất…

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
