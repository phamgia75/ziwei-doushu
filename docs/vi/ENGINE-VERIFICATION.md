# Kiểm chứng engine lập lá số (ENGINE-VERIFICATION)

Ngày chạy: 2026-11-04. Repo HEAD `443c011` lúc bắt đầu (`118fa15` lúc kết thúc — các commit chen giữa chỉ đụng UI/server; `lib/ziwei/algorithm.ts` và các file engine vẫn trùng `a600484`). Engine (`lib/ziwei/algorithm.ts`) dựa trên iztro 2.6.1 + lunar-javascript 1.7.7.
Tài liệu này chỉ ghi những gì **đã thực sự chạy**. Đây là kiểm chứng (verification), không sửa engine: không file nào trong `lib/ziwei/*` bị thay đổi.

## 0. Tóm tắt kết quả

| Hạng mục | Cách kiểm | Kết quả |
|---|---|---|
| Golden fixtures | 77 lá số chọn lọc, snapshot đầy đủ, so sánh deep-equal | 77/77 khớp; test bắt được đột biến (đổi 1 giá trị `wuxingJu` → fail) |
| Engine vs iztro gốc | 3000 lá số ngẫu nhiên (seed 20261104) × 44 trường = 132 000 phép so | 0 khác biệt không giải thích được; 622 khác biệt dự kiến (Thiên Khôi/Thiên Việt năm Tân) |
| Chiều đại hạn | luật sách giáo khoa, 3000 lá số | 0 vi phạm |
| Âm lịch độc lập (Hồ Ngọc Đức, UTC+8) vs lunar-javascript | mọi ngày 1950-01-01..2026-12-31 (28 124 ngày) | 28 124/28 124 khớp (sau khi sửa 1 lỗi biên của thuật toán gốc, xem §3) |
| lunar-javascript (engine) vs lunar-lite (bên trong iztro) | 3000 lá số | 0 khác biệt |
| Âm lịch VN (UTC+7) vs TQ (UTC+8) | mọi ngày 1950–2026 | **1137 ngày khác nhau**, 33 khoảng; 1017 ngày đo được lá số thay đổi (1079 theo ngày âm hiệu lực) |
| Giờ Tý (vãn Tý / tảo Tý) | 8 ngày biên × 6 giờ × Bắc Kinh/Hà Nội × 4 quy tắc | 822 phép kiểm đều đạt |
| Phương trình thời gian (EoT) | phân tích | **Không** được áp dụng khi lập lá số; lệch tới +16,4/−14,3 phút; ~6,0 % số phút trong năm bị xếp khác giờ |

## 1. Golden fixtures

- Script: `scripts/verify/make-golden.ts` → `tests/fixtures/golden-charts.json` (một case một dòng). Test: `tests/unit/golden-charts.test.ts`.
- Snapshot chụp từ engine **giống hệt upstream commit `a600484`**: `git diff a600484 -- lib/ziwei/algorithm.ts lib/ziwei/sihua.ts lib/ziwei/constants.ts lib/ziwei/school-data.ts lib/ziwei/school-tables.generated.ts` rỗng (đã chạy, script từ chối ghi nếu không rỗng trừ khi `--force`; `meta.engineFilesIdenticalToBaseline: true`).
- Đầu vào đi qua đúng đường của UI: `formToBirthInfo(form, { lateZishi })` (có `utcOffsetMinutes`) → `generateChart(birthInfo, { leapMonth })`.
- 77 case:
  - 12 giờ × 2 giới (nam 1990-06-15, nữ 1991-03-08, giờ đồng hồ = giữa mỗi canh giờ, 120°E) = 24
  - biên giờ Tý 22:59 / 23:00 / 23:30 / 00:00 / 00:59 / 01:00 ngày 1999-12-31 × `next-day`/`current-day` = 12
  - cuối tháng/năm/29-2: 1988-01-31, 2001-04-30, 2000-02-29, 1975-12-31 = 4
  - giao thừa + mùng 1 Tết 1985, 2000, 2024 = 6
  - tháng nhuận (2020 nhuận 4 ngày 5 & 20, 2023 nhuận 2 ngày 10 & 25, 1987 nhuận 6 ngày 16) × 4 chính sách `split` / `prev-month` / `next-month` / `origin-month` = 20
  - cực trị 1950-01-01, 1950-02-17, 2026-02-17, 2026-12-31 23:30 = 4
  - Việt Nam: Hà Nội 105,85°E UTC+7 (Tết VN 1985-01-21, Tết VN 2007-02-17, 23:30, 00:20, 12:58) và TP.HCM 106,70°E **UTC+8 năm 1965** (23:10, 06:00) = 7
- Snapshot gồm: birthInfo sau khi đổi ngày, `lunarInfo` (kể cả tứ trụ), mệnh/thân, cục, vị trí Tử Vi, mệnh chủ/thân chủ, âm dương nam nữ, mỗi cung (can/chi/tên/thân cung/khoảng đại hạn, mọi sao với `type` / `siHua` / `brightnessRaw`), danh sách đại hạn.
- Loại trừ có chủ ý: `currentAge`, `isCurrentDaXian`, `currentDaXianIndex` (phụ thuộc ngày chạy).
- **Lưu ý:** engine **không sinh `daXians[].siHua`** (upstream đã gỡ trường phi tinh — comment `// 不再生成 daXians[].siHua / stemIndex / stemName（飞星派字段已下线）` trong `algorithm.ts`), nên snapshot chỉ có khoảng tuổi đại hạn, không có tứ hóa đại hạn.
- Đây là snapshot hồi quy (regression), **không phải chân lý**: nó chỉ chứng minh engine không đổi so với `a600484`.

## 2. Đối chiếu với iztro gốc (consistency check)

- Script: `scripts/verify/iztro-crosscheck.ts [n] [seed]`; test: `tests/unit/iztro-crosscheck.test.ts` (500 lá số cố định, ~22 s).
- **Cô lập cấu hình:** `algorithm.ts` gọi `astro.config({ yearDivide: 'normal', brightness: DEFAULT_BRIGHTNESS })` ngay khi import — đây là thay đổi toàn cục trên iztro. Script tính toàn bộ lá số iztro gốc **trước**, assert `astro.getConfig()` còn mặc định (brightness rỗng), rồi mới `import()` động engine và assert config đã bị đổi. Ghi chú: `yearDivide` mặc định của iztro đã là `'normal'` (`node_modules/iztro/lib/astro/astro.js`: `var _yearDivide = 'normal'`), còn bảng brightness không làm dịch sao và engine bỏ qua brightness của iztro (dùng bảng `SB_QS` riêng qua `schoolStarBrightness`). Vì vậy hai trạng thái config cho cùng vị trí sao.
- Trường so sánh (44/lá số): ngày âm lịch, can chi năm, chi cung Mệnh, chi cung Thân, ngũ hành cục, 14 chính tinh, Tứ Hóa bản mệnh, 12 khoảng đại hạn, 6 cát tinh (左辅 右弼 文昌 文曲 天魁 天钺) + 6 sát tinh (擎羊 陀罗 火星 铃星 地空 地劫). Brightness **không** so (engine thay hẳn bảng).
- Mẫu: 3000 ngày sinh ngẫu nhiên đều 1950–2026, giờ 0–11, giới tính ngẫu nhiên, PRNG mulberry32 seed 20261104.
- Kết quả 3000 lá số: **0 khác biệt không giải thích được**. Một nhóm khác biệt dự kiến:
  - `expected:kuiyue-KY1-xin-year`: 622 = 2 × 311 lá số năm Tân — engine đổi chỗ Thiên Khôi/Thiên Việt (Khôi ở Dần, Việt ở Ngọ) so với iztro (Khôi Ngọ, Việt Dần). Nguồn: `applySchoolKuiyue` trong `algorithm.ts` (“实测 10 天干年仅【辛年】与 iztro 现状不同 … 默认派在辛年与主流「辛马虎 = 魁午钺寅」口诀相反”). Đây là lựa chọn trường phái có chủ ý, đi ngược khẩu quyết phổ biến “辛马虎”.
- Các khác biệt trường phái khác của engine **không thuộc** 44 trường trên nên không xuất hiện: đổi tên 截路/空亡 → 截空/副截 và đổi cung theo can âm (`applySchoolJiekong`), thêm 大耗 theo chi năm (`applySchoolDahao`), thêm 副旬 (`applySchoolFuxun`), thêm 劫煞/龙德, bảng độ sáng 《斗数全书》 (`currentBrightSchool = 'QS'`).
- Tháng nhuận: mặc định `DEFAULT_LEAP_MONTH = 'split'` (`school-config.ts`: “前 15 天归上月，后 15 天归下月 … 150 组金标准盘对照验证”) chạy `astro.bySolar(…, fixLeap=true)` — trùng hành vi mặc định của iztro, nên không phát sinh khác biệt.
- Chiều đại hạn (luật độc lập với iztro): dương nam/âm nữ **thuận** (chi +1), âm nam/dương nữ **nghịch** (chi −1); đại hạn 1 ở cung Mệnh, bắt đầu từ tuổi = số cục, mỗi hạn 10 năm. Âm/dương theo can năm âm lịch (đổi năm ở mùng 1 Tết). **0 vi phạm / 3000.**
- **Trung thực:** iztro là dependency của chính engine, nên đây là kiểm tra nhất quán (adapter + bản vá trường phái có làm sai gì ngoài dự kiến không), **không phải** kiểm chứng độc lập thuật toán an sao của iztro.

## 3. Âm lịch độc lập + lịch Việt Nam

- `lib/calendar/vn-lunar.ts`: cài đặt thuật toán công khai của **Hồ Ngọc Đức** (sóc theo Meeus, kinh độ Mặt Trời, tháng 11 chứa Đông chí, tháng nhuận = tháng đầu tiên không có trung khí), `convertSolar2Lunar(dd, mm, yy, timeZone)` với `timeZone` 7 (VN) hoặc 8 (TQ). Không dùng chung code với lunar-javascript/iztro.
- Export `vnCnLunarDiffers(y, m, d) → { differs, vn, cn }` để UI cảnh báo.
- **Lỗi biên trong thuật toán gốc:** với UTC+8, ngày 2009-03-26 bản gốc trả về “ngày 0 tháng 3” (sóc 2009-03-26 16:06 UTC = 00:06 ngày 27 giờ Bắc Kinh, ước lượng `k` lệch một tuần trăng). Đã thêm một vòng lùi `k` khi `monthStart > dayNumber`. Kiểm tra: bản gốc chỉ sai đúng 1 ngày này trong 1950–2026 (UTC+8), 0 ngày ở UTC+7; sửa không đổi bất kỳ kết quả hợp lệ nào.
- Test `tests/unit/vn-lunar.test.ts`: UTC+8 khớp lunar-javascript (năm/tháng/ngày/nhuận) **28 124/28 124 ngày** 1950-01-01..2026-12-31. Tết 1985: VN 1985-01-21, TQ 1985-02-20; Tết 2007: VN 2007-02-17, TQ 2007-02-18 — đều đạt.
- Ngoài ra, trong 3000 lá số của §2, lunar-javascript (engine dùng cho `lunarInfo` và tháng nhuận) và lunar-lite (iztro dùng để an sao) cho **cùng** ngày âm lịch.

### Phát hiện: lịch VN khác lịch TQ — engine luôn dùng lịch TQ

Script: `scripts/verify/vn-cn-lunar-diff.ts` (chỉ phân tích, ~11 phút).

- **1137 ngày** dương lịch 1950–2026 có ngày âm VN ≠ TQ, gộp thành **33 khoảng** (đa số dài 30 ngày = cả một tháng âm lệch sóc 1 ngày; dài nhất 1984-11-23..1985-04-19, 148 ngày, do tháng nhuận khác nhau: TQ nhuận tháng 10 năm Giáp Tý 1984, VN nhuận tháng 2 năm Ất Sửu 1985 — đã kiểm bằng `convertSolar2Lunar`).
- **34 ngày khác cả năm âm lịch** (Tết lệch): 1965-02-01, 1968-01-29, 1969-02-16, 1985-01-21..1985-02-19 (30 ngày), 2007-02-17. Người sinh những ngày này được engine lập lá số theo **năm can chi trước** (VD Hà Nội 2007-02-17 = mùng 1 Tết Đinh Hợi ở VN, nhưng engine ra 丙戌 năm 2006 tháng 12 ngày 30 — xem case `hanoi-2007-02-17-tet-vn` trong fixture).
- 119 ngày khác cờ nhuận.
- Ảnh hưởng lá số (so iztro `bySolar` = lịch TQ với iztro `byLunar(ngày âm VN, fixLeap=true)`; phương pháp được kiểm: `byLunar(ngày âm TQ)` tái tạo đúng `bySolar` ở mọi ngày, và lá số VN chỉ được tính khi `byLunar` trả lại đúng ngày âm đã yêu cầu):
  - **1017/1137 ngày: lá số thay đổi ở cả 12 giờ** (đo trực tiếp);
  - 28 ngày: lá số giống hệt (chỉ khác tháng nhuận, quy tắc `split` đưa về cùng tháng hiệu lực);
  - 92 ngày: không đo được vì ngày âm VN không tồn tại trong lịch TQ (ngày 30 của tháng TQ chỉ có 29 ngày, hoặc tháng nhuận VN mà năm TQ không có — VD VN 1985 nhuận 2). Lưu ý: lần chạy đầu, `byLunar` âm thầm đọc “nhuận 2/1985” thành tháng 2 thường và báo sai 30 ngày “giống hệt”; script đã thêm kiểm tra round-trip.
  - Phân tích bổ sung theo ngày âm hiệu lực (sau `split`): 1079/1137 ngày có (năm, tháng, ngày) hiệu lực khác nhau ⇒ lá số khác; 58 ngày trùng.
- Danh sách khoảng (ngày đầu: VN / TQ): 1950-08-13..09-11; 1951-06-04..07-03; 1953-08-09..09-07; 1956-11-02..12-01; 1957-03-01..03-30; 1957-11-21..12-20; 1961-05-14..06-12; 1964-10-05..11-03; 1965-02-01..03-02; 1967-12-01..12-30; 1968-01-29..02-27; 1969-02-16..03-17; 1974-12-13..1975-01-11; 1975-04-11..05-10; 1978-09-02..10-01; 1979-02-26..03-27; 1984-05-30..06-28; 1984-11-23..1985-04-19; 1986-12-01..12-30; 1987-07-26..09-22; 1989-08-01..08-30; 1995-09-24..10-23; 1996-07-15..08-13; 1996-12-10..1997-01-08; 1997-10-01..10-30; 1997-12-29..1998-01-27; 2006-06-25..07-24; 2007-02-17..03-18; 2008-11-27..12-26; 2009-03-26..04-24; 2018-11-07..12-06; 2019-03-06..04-04; 2020-12-14..2021-01-12. (Không có khoảng nào sau 2021-01-12 trong phạm vi đến 2026.)
- Đây là **quy ước**, không phải lỗi của engine (engine Trung Quốc dùng lịch Trung Quốc). Với người dùng Việt Nam, khoảng 3,8 % số ngày 1950–2026 (1079/28 124) lá số sẽ khác với lá số lập theo âm lịch Việt Nam. Đề xuất (chưa làm): UI gọi `vnCnLunarDiffers` để cảnh báo; quyết định có hỗ trợ lịch VN hay không thuộc về chủ dự án.

## 4. Giờ Tý và quy tắc đổi ngày

Test: `tests/unit/zi-hour-boundary.test.ts` (822 phép kiểm, tất cả đạt).

- Quy ước thực tế (`resolveZiweiDayOffset` trong `true-solar-time.ts`, áp lên **giờ mặt trời trung bình địa phương**):
  - `next-day` (mặc định): 23:00–23:59 = vãn Tý → ngày lá số +1, giờ 0. Do đó D 23:30 **cùng lá số** với D+1 00:30 (đã assert, mọi sao giống hệt).
  - `current-day` (và cả `all-current`, `day-cur-time-next` — với lá số Tử Vi chỉ `next-day` mới đổi ngày): vãn Tý giữ ngày D, giờ 0 → D 23:30 **cùng lá số** với D 00:30, tức tảo Tý của chính ngày đó, sớm hơn 23 tiếng (đã assert). Hai quy tắc cho lá số khác nhau (đã assert).
  - 00:00–00:59 = tảo Tý: ngày D, giờ 0 với mọi quy tắc.
- Kiểm qua cuối tháng (01-31), cuối năm (1999-12-31 → 2000-01-01, vẫn năm âm 1999 ngày 25), 29-2 (2000-02-28 → 02-29, 2000-02-29 → 03-01), 2001-02-28, 1950-01-01, 2026-12-30.
- **Hà Nội 105,85°E UTC+7:** giờ mặt trời = giờ đồng hồ + 3,4 phút ⇒ 22:59 đã là vãn Tý (đổi ngày với `next-day`), 00:59 đã là Sửu. Bắc Kinh 120°E: 22:59 = Hợi, 00:59 = Tý.
- Nếu **không truyền `utcOffsetMinutes`**, công thức coi giờ Hà Nội là giờ Bắc Kinh (−56,6 phút): Hà Nội 23:30 → 22:33 Hợi, không đổi ngày (đã assert để ghi lại hành vi).

### Công thức hiệu chỉnh múi giờ/kinh độ

`formToBirthInfo` (`lib/ziwei/share.ts`): `solar = giờ*60 + phút + (kinh_độ − utcOffsetMinutes/4) × 4` phút; mặc định `utcOffsetMinutes = 480` (kinh tuyến 120°). Chi giờ lấy từ `solar mod 1440`, độ lệch ngày `floor(solar/1440)` rồi qua `resolveZiweiDayOffset`. Không xử lý giờ mùa hè hay lịch sử múi giờ: người gọi phải truyền đúng offset của thời điểm sinh (VD Sài Gòn 1959–1975 dùng UTC+8; case `hcmc-1965-…-utc8`: 23:10 → 22:16,8 Hợi).

## 5. Phương trình thời gian (Equation of Time)

- `calculateTrueSolarTime` (`true-solar-time.ts`) có cộng EoT (xấp xỉ NOAA), **nhưng không có nơi nào gọi nó** trong `app/`, `components/`, `lib/` (grep). Đường lập lá số thực tế là `BirthForm → formToBirthInfo → generateChart`, **chỉ hiệu chỉnh kinh độ** (giờ mặt trời trung bình), **không có EoT** — trái với comment đầu file (“地方真太阳时 = 钟表时间 + 经度修正 + 均时差”).
- Biên độ EoT 1950–2026 (theo chính hàm `equationOfTimeMinutes`): **+16,38 phút** (đầu tháng 11, VD 1952-11-01) đến **−14,26 phút** (giữa tháng 2, VD 1950-02-14); trung bình |EoT| = 7,21 phút.
- Ảnh hưởng: tại biên canh giờ, sai tối đa ~16,4 phút. Mô phỏng Hà Nội (mỗi phút trong ngày, mỗi 5 ngày 1950–2026, 8,1 triệu điểm): **6,01 %** số thời điểm bị xếp khác chi giờ so với giờ mặt trời thật. Ví dụ: Hà Nội 2000-11-03 22:50 → engine: Hợi ngày 3; giờ mặt trời thật 23:09:45 → vãn Tý, với `next-day` là ngày 4 (đổi cả giờ lẫn ngày).
- Lựa chọn dùng giờ trung bình có thể là quy ước (nhiều phần mềm cũng vậy), nhưng mâu thuẫn với comment và với hàm có sẵn; cần chủ dự án quyết định.

## 6. Phát hiện / khiếm khuyết (chưa sửa — chỉ mô tả)

1. **EoT không được áp dụng** (§5). Repro: `formToBirthInfo({…year:'2000',month:'11',day:'3',clockHour:'22',clockMinute:'50',longitude:105.85,utcOffsetMinutes:420…})` → `hour: 11, day: 3`; `calculateTrueSolarTime({year:2000,month:11,day:3,clockHour:22,clockMinute:50,longitude:105.85,utcOffsetMinutes:420})` → `branch: 0`, 23:09:45.
2. **Lịch VN ≠ lịch TQ** trên 1137 ngày (§3) — quy ước, cần cảnh báo/quyết định sản phẩm.
3. ~~Xem trước giờ trong form bỏ qua `utcOffsetMinutes`~~ — đã thấy lúc bắt đầu (HEAD `443c011`: `calcTrueSolarBranch` cố định `(longitude − 120) × 4`), nhưng commit UI `cdb75fb` (do agent khác, trong lúc kiểm) đã thêm tham số `utcOffsetMinutes` và `BirthForm` giờ truyền `eff.utcOffsetMinutes`. Không còn là lỗi ở HEAD `118fa15`.
4. **Quy tắc vãn Tý chưa được chọn ở đâu:** `BirthForm` có prop `lateZishi`, nhưng `app/chart/page.tsx` và `app/heming/page.tsx` không truyền; `loadSchoolConfig`/`paramsToConfig` không được dùng trong `app/`/`components/`. Thực tế luôn là `next-day`. `app/chart/page.tsx` gọi `generateChart(info)` không truyền `leapMonth` → luôn `split`. (Đúng mặc định đã ghi; chỉ là tùy chọn trường phái chưa có tác dụng ở UI.)
5. Thuật toán Hồ Ngọc Đức gốc trả “ngày 0” tại 2009-03-26 UTC+8 (§3) — đã xử lý trong `vn-lunar.ts`, không ảnh hưởng engine.

Không phát hiện lỗi nào trong chính engine (`lib/ziwei/*`) trên phạm vi đã kiểm.

## 7. Chưa kiểm chứng được

- Không có lá số “chuẩn vàng” độc lập từ phần mềm khác/sách để so; golden fixtures chỉ là snapshot của chính engine.
- Không kiểm độc lập thuật toán an sao của iztro (chỉ kiểm nhất quán); các sao phụ/tạp diệu ngoài 6 cát + 6 sát và Tứ Hóa chỉ được phủ bởi golden snapshot.
- Không kiểm độ sáng sao so với nguồn sách (chỉ snapshot).
- Không kiểm các chính sách tháng nhuận khác `split` trên mẫu lớn (chỉ 20 case golden).
- Không kiểm lịch sử múi giờ Việt Nam (UI phải chọn offset đúng; engine nhận gì dùng nấy).
- Không chạy `next build/dev`; không kiểm UI.

## Cách chạy lại

```
npx tsx tests/unit/golden-charts.test.ts
npx tsx tests/unit/iztro-crosscheck.test.ts           # 500 lá số
npx tsx scripts/verify/iztro-crosscheck.ts 3000        # mẫu đầy đủ
npx tsx tests/unit/vn-lunar.test.ts
npx tsx tests/unit/zi-hour-boundary.test.ts
npx tsx scripts/verify/vn-cn-lunar-diff.ts             # ~11 phút
npx tsx scripts/verify/make-golden.ts                  # chỉ khi cố ý cập nhật snapshot
```
