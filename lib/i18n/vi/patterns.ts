/**
 * Vietnamese rendering of lib/ziwei/patterns.ts output (detectPatterns / getMingGongSummary).
 * The engine is untouched: fixed strings are looked up verbatim, dynamic strings are matched by
 * the template that produced them and rebuilt from their parts (star / branch / palace names via term()).
 * tests/unit/patterns-vi-coverage.test.ts asserts every emitted string resolves to Han-free text.
 */
import type { Pattern } from '@/lib/ziwei/patterns';
import { term, BRANCHES_VI } from '@/lib/i18n';

export const patternsUi = {
  title: 'Nhận diện Cách cục',
  titleStrict: 'Nhận diện Cách cục (theo điều kiện cổ thư)',
  count: (n: number) => `${n} cách`,
  required: 'Điều kiện',
  bonus: 'Điểm cộng',
  breaking: 'Phá cách',
  source: 'Xuất xứ',
} as const;

const NAMES: Record<string, string> = {
  '君臣庆会': 'Quân Thần Khánh Hội',
  '紫府同宫': 'Tử Phủ đồng cung',
  '府相朝垣': 'Phủ Tướng triều viên',
  '阳梁昌禄': 'Dương Lương Xương Lộc',
  '火贪格': 'Hỏa Tham cách',
  '铃贪格': 'Linh Tham cách',
  '武贪格': 'Vũ Tham cách',
  '杀破狼': 'Sát Phá Tham',
  '机月同梁': 'Cơ Nguyệt Đồng Lương',
  '廉贞天相格': 'Liêm Trinh Thiên Tướng cách',
  '武曲七杀': 'Vũ Khúc Thất Sát',
  '天同天梁格': 'Thiên Đồng Thiên Lương cách',
  '日月同宫': 'Nhật Nguyệt đồng cung',
  '日月夹命': 'Nhật Nguyệt giáp Mệnh',
  '巨日同宫': 'Cự Nhật đồng cung',
  '石中隐玉': 'Thạch Trung Ẩn Ngọc',
  '明珠出海': 'Minh Châu Xuất Hải',
  '紫微入命': 'Tử Vi nhập Mệnh',
  '辅弼夹命': 'Phụ Bật giáp Mệnh',
  '昌曲夹命': 'Xương Khúc giáp Mệnh',
  '魁钺夹命': 'Khôi Việt giáp Mệnh',
  '双禄朝垣': 'Song Lộc triều viên',
  '三奇加会': 'Tam Kỳ gia hội',
  '羊陀夹忌': 'Dương Đà giáp Kỵ',
  '火铃夹命': 'Hỏa Linh giáp Mệnh',
  '空劫夹命': 'Không Kiếp giáp Mệnh',
  '廉杀羊': 'Liêm Sát Dương',
  '巨火羊': 'Cự Hỏa Dương',
  '铃昌陀武': 'Linh Xương Đà Vũ',
  '马头带箭': 'Mã Đầu Đới Tiễn',
  '禄存守命': 'Lộc Tồn thủ Mệnh',
  '禄存守身': 'Lộc Tồn thủ Thân',
  '天马入命': 'Thiên Mã nhập Mệnh',
  '天马在迁': 'Thiên Mã tại Thiên Di',
  '化禄入财': 'Hóa Lộc nhập Tài Bạch',
  '化权入官': 'Hóa Quyền nhập Quan Lộc',
  '化科入命': 'Hóa Khoa nhập Mệnh',
  '化科入身': 'Hóa Khoa nhập Thân',
  '机月同梁三星会': 'Cơ Nguyệt Đồng Lương (hội đủ ba sao)',
  '昌曲坐命': 'Xương Khúc tọa Mệnh',
  '昌曲同会': 'Xương Khúc đồng hội',
  '辅弼同会': 'Phụ Bật đồng hội',
  '魁钺同会': 'Khôi Việt đồng hội',
  '科权双会': 'Khoa Quyền song hội',
};

const SOURCES: Record<string, string> = {
  '《紫微斗数全书》': 'Tử Vi Đẩu Số Toàn Thư',
  '《紫微斗数骨髓赋》': 'Tử Vi Đẩu Số – Cốt Tủy Phú',
  '《紫微斗数全书·君臣庆会格》': 'Tử Vi Đẩu Số Toàn Thư · Quân Thần Khánh Hội cách',
  '《紫微斗数全书·紫府同宫格》': 'Tử Vi Đẩu Số Toàn Thư · Tử Phủ đồng cung cách',
  '《紫微斗数全书·府相朝垣格》': 'Tử Vi Đẩu Số Toàn Thư · Phủ Tướng triều viên cách',
  '《紫微斗数全书·阳梁昌禄格》': 'Tử Vi Đẩu Số Toàn Thư · Dương Lương Xương Lộc cách',
  '《紫微斗数全书·杀破狼》': 'Tử Vi Đẩu Số Toàn Thư · Sát Phá Tham',
  '《紫微斗数全书·机月同梁格》': 'Tử Vi Đẩu Số Toàn Thư · Cơ Nguyệt Đồng Lương cách',
  '《紫微斗数全书·日月夹命》': 'Tử Vi Đẩu Số Toàn Thư · Nhật Nguyệt giáp Mệnh',
  '《紫微斗数全书·巨日同宫》': 'Tử Vi Đẩu Số Toàn Thư · Cự Nhật đồng cung',
  '《紫微斗数骨髓赋·石中隐玉》': 'Tử Vi Đẩu Số – Cốt Tủy Phú · Thạch Trung Ẩn Ngọc',
  '《紫微斗数全集·明珠出海》': 'Tử Vi Đẩu Số Toàn Tập · Minh Châu Xuất Hải',
  '《紫微斗数全书·辅弼夹命》': 'Tử Vi Đẩu Số Toàn Thư · Phụ Bật giáp Mệnh',
  '《紫微斗数全书·双禄朝垣》': 'Tử Vi Đẩu Số Toàn Thư · Song Lộc triều viên',
  '《紫微斗数全书·三奇加会》': 'Tử Vi Đẩu Số Toàn Thư · Tam Kỳ gia hội',
  '《紫微斗数骨髓赋·羊陀夹忌》': 'Tử Vi Đẩu Số – Cốt Tủy Phú · Dương Đà giáp Kỵ',
  '《紫微斗数全书·廉杀羊》': 'Tử Vi Đẩu Số Toàn Thư · Liêm Sát Dương',
  '《紫微斗数骨髓赋·巨火羊》': 'Tử Vi Đẩu Số – Cốt Tủy Phú · Cự Hỏa Dương',
  '《紫微斗数骨髓赋·铃昌陀武》': 'Tử Vi Đẩu Số – Cốt Tủy Phú · Linh Xương Đà Vũ',
  '《紫微斗数骨髓赋·马头带箭》': 'Tử Vi Đẩu Số – Cốt Tủy Phú · Mã Đầu Đới Tiễn',
  '《紫微斗数全书·禄存星》': 'Tử Vi Đẩu Số Toàn Thư · sao Lộc Tồn',
  '《紫微斗数全书·天马星》': 'Tử Vi Đẩu Số Toàn Thư · sao Thiên Mã',
  '《紫微斗数全书·四化论》': 'Tử Vi Đẩu Số Toàn Thư · luận Tứ Hóa',
  '《紫微斗数全书·文星论》': 'Tử Vi Đẩu Số Toàn Thư · luận Văn tinh',
  '《紫微斗数全书·辅弼论》': 'Tử Vi Đẩu Số Toàn Thư · luận Phụ Bật',
  '《紫微斗数全书·魁钺论》': 'Tử Vi Đẩu Số Toàn Thư · luận Khôi Việt',
  '《紫微斗数全书·四化会照》': 'Tử Vi Đẩu Số Toàn Thư · Tứ Hóa hội chiếu',
};

/** Fixed descriptions and condition lines, verbatim engine text → Vietnamese. */
const TEXT: Record<string, string> = {
  // ── descriptions ──
  '紫微入命，左辅右弼同会，帝王得贤臣辅佐，主大富大贵、统御之命。一生贵人不绝，宜走政商高位、跨界领袖之途。':
    'Tử Vi nhập Mệnh, Tả Phù Hữu Bật cùng hội, như đế vương được hiền thần phò tá, chủ mệnh đại phú đại quý, có tài thống ngự. Một đời quý nhân không dứt, hợp con đường vị trí cao trong chính trường – thương trường, lãnh đạo đa lĩnh vực.',
  '紫微天府同入命宫，帝相并临，尊贵之命。主品行端正、衣食无忧、有领导才能，宜担任要职。需要左右辅弼来配合方为完整大格。':
    'Tử Vi, Thiên Phủ cùng nhập cung Mệnh, đế và tướng cùng đến, là mệnh tôn quý. Chủ phẩm hạnh đoan chính, cơm áo không lo, có tài lãnh đạo, hợp đảm nhận chức vụ quan trọng. Cần Tả Phù, Hữu Bật phối hợp mới thành đại cách trọn vẹn.',
  '紫微天府同宫但未坐命，主一生有贵人贵气依托，但本身不一定大富贵，需看会照吉煞而定。':
    'Tử Vi, Thiên Phủ đồng cung nhưng không tọa Mệnh, chủ một đời có quý nhân, quý khí để nương tựa, nhưng bản thân chưa chắc đại phú quý, cần xem cát tinh hay sát tinh hội chiếu mà định.',
  '天府天相分守命宫三方四正，文武并济、权印双辉，主一生衣食丰足、地位崇高。古书云"府相朝垣千钟食禄"，常见于政界、企业管理者。':
    'Thiên Phủ, Thiên Tướng chia nhau thủ Tam Phương Tứ Chính của cung Mệnh, văn võ kiêm toàn, quyền và ấn cùng sáng, chủ một đời cơm áo sung túc, địa vị cao. Cổ thư nói "Phủ Tướng triều viên, thiên chung thực lộc" (bổng lộc nghìn chung), thường gặp ở người trong chính giới, nhà quản lý doanh nghiệp.',
  '太阳、天梁、文昌、禄存四星齐会命宫三方，号称"科举之星"，主清贵显达、考运极佳，宜走学术、文教、研究、专业认证之路，一生功名易就。':
    'Thái Dương, Thiên Lương, Văn Xương, Lộc Tồn bốn sao cùng hội tam phương cung Mệnh, được gọi là "sao khoa cử", chủ thanh quý hiển đạt, vận thi cử rất tốt; hợp con đường học thuật, văn giáo, nghiên cứu, chứng chỉ chuyên môn, một đời công danh dễ thành.',
  '武曲贪狼会命，财星与桃花欲望星交辉，古书云"武贪不发少年人"——三十岁后方能厚积薄发。主中年以后大富大贵，财源由人脉、应酬、欲望管理而来，适合金融、投机、销售、娱乐业。':
    'Vũ Khúc, Tham Lang hội Mệnh, tài tinh và sao đào hoa – dục vọng cùng tỏa sáng. Cổ thư nói "Vũ Tham bất phát thiếu niên nhân" (Vũ Tham không phát lúc tuổi trẻ) — sau ba mươi tuổi mới tích lũy dày mà phát dần. Chủ sau trung niên đại phú đại quý, nguồn tài đến từ quan hệ, giao tế, biết quản lý dục vọng; hợp tài chính, đầu cơ, bán hàng, ngành giải trí.',
  '七杀、破军、贪狼三星会命，开创闯荡之命格。一生变动多、不甘平凡，宜创业、军警、业务、销售。中年后才能稳定守成，年轻时易因冲动失利。':
    'Thất Sát, Phá Quân, Tham Lang ba sao hội Mệnh, là mệnh cách khai sáng, xông pha. Một đời nhiều biến động, không cam chịu tầm thường; hợp khởi nghiệp, quân đội – cảnh sát, kinh doanh, bán hàng. Sau trung niên mới ổn định giữ thành, khi trẻ dễ thất bại vì bốc đồng.',
  '天机太阴天同天梁四星齐入命迁财官，文质彬彬、聪慧善谋。最适合公职、学术、文艺、医疗、服务等需稳定累积的行业，不宜大冒险大投机。':
    'Thiên Cơ, Thái Âm, Thiên Đồng, Thiên Lương bốn sao cùng vào Mệnh, Thiên Di, Tài Bạch, Quan Lộc; nho nhã lịch thiệp, thông minh giỏi mưu tính. Hợp nhất với công chức, học thuật, văn nghệ, y tế, dịch vụ và các ngành cần tích lũy ổn định; không nên đại mạo hiểm, đại đầu cơ.',
  '廉贞天相同宫，印绶格局，主秉公处事、清廉之名，宜任公职、行政管理、法务、企划。怕见擎羊化忌，则反主官非。':
    'Liêm Trinh, Thiên Tướng đồng cung, là cách cục ấn thụ, chủ xử sự công minh, có tiếng thanh liêm; hợp làm công chức, quản lý hành chính, pháp chế, hoạch định. Sợ gặp Kình Dương, Hóa Kỵ, khi đó ngược lại chủ quan phi (kiện tụng).',
  '武曲七杀同宫，将星配财星，主果决刚毅、理财能力强，适合金融、军警、创业。但忌见化忌煞星，否则凶险。一生奋斗、积财但操心。':
    'Vũ Khúc, Thất Sát đồng cung, tướng tinh phối tài tinh, chủ quả quyết cương nghị, khả năng quản lý tiền mạnh; hợp tài chính, quân đội – cảnh sát, khởi nghiệp. Nhưng kỵ gặp Hóa Kỵ và sát tinh, nếu không thì hung hiểm. Một đời phấn đấu, tích được của nhưng nhiều lo toan.',
  '天同天梁同宫，福星与荫星共会，主宽厚和善、乐于助人，宜医疗、教育、宗教、社会公益。但偏温和保守，难成大富大贵之局。':
    'Thiên Đồng, Thiên Lương đồng cung, phúc tinh và ấm tinh cùng hội, chủ khoan hậu hiền hòa, vui lòng giúp người; hợp y tế, giáo dục, tôn giáo, công ích xã hội. Nhưng thiên về ôn hòa bảo thủ, khó thành cục đại phú đại quý.',
  '太阳太阴分居命宫两侧夹照，光明磊落，一生贵人相助，事业蓬勃。男主官贵，女主旺夫兴家。日月须不落陷方为真夹。':
    'Thái Dương, Thái Âm ở hai bên cung Mệnh giáp chiếu, quang minh lỗi lạc, một đời có quý nhân giúp đỡ, sự nghiệp hưng thịnh. Nam chủ quan quý, nữ chủ vượng phu hưng gia. Nhật Nguyệt phải không lạc Hãm mới là giáp thật.',
  '巨门坐命子午，外表平凡而内蕴才学。早年默默无闻、中年方显贵气，宜走专业、研究、口才、传媒。需有禄权或文昌相助方能"凿石见玉"。':
    'Cự Môn tọa Mệnh ở Tý, Ngọ, bề ngoài bình thường mà bên trong ẩn chứa tài học. Thời trẻ âm thầm không tiếng tăm, trung niên mới hiển lộ quý khí; hợp con đường chuyên môn, nghiên cứu, nghề dùng tài ăn nói, truyền thông. Cần có Lộc, Quyền hoặc Văn Xương trợ giúp mới "đục đá thấy ngọc".',
  '命未空宫，对宫丑宫日月同辉拱照，号"明珠出海"。主出生平凡、后天努力出头，宜远赴他乡、学术研究或大公司高位，主大富大贵。':
    'Mệnh ở Mùi là Vô Chính Diệu, đối cung Sửu có Nhật Nguyệt cùng sáng củng chiếu, gọi là "Minh Châu Xuất Hải". Chủ xuất thân bình thường, nhờ nỗ lực về sau mà vươn lên; hợp đi xa lập nghiệp nơi đất khách, nghiên cứu học thuật hoặc vị trí cao ở công ty lớn, chủ đại phú đại quý.',
  '紫微独坐命宫，帝王之星，自尊心强、有领导魅力。但紫微最忌"在野孤君"——若无左右辅弼相会，反成孤高自傲、易招毁谤。':
    'Tử Vi độc tọa cung Mệnh, là sao đế vương, lòng tự trọng cao, có sức hút lãnh đạo. Nhưng Tử Vi kỵ nhất "tại dã cô quân" (vua lẻ loi nơi đồng nội) — nếu không có Tả Phù, Hữu Bật cùng hội thì ngược lại thành cô cao tự phụ, dễ chuốc lời gièm pha.',
  '左辅右弼夹命，传统论述认为此格象征贵人相助与福厚特质。适合走仕途、大企业管理等能发挥组织才能的方向。古书云"左辅右弼，终身福厚"——强调此格在组织协调中的优势。':
    'Tả Phù, Hữu Bật giáp Mệnh; luận thuyết truyền thống cho rằng cách này tượng trưng cho quý nhân giúp đỡ và phúc dày. Hợp con đường quan lộ, quản lý doanh nghiệp lớn và những hướng phát huy được tài tổ chức. Cổ thư nói "Tả Phù Hữu Bật, chung thân phúc hậu" — nhấn mạnh ưu thế của cách này trong tổ chức, điều phối.',
  '文昌文曲夹命宫，主聪明俊秀、文采斐然，宜走文教、学术、艺术、写作。古书云"昌曲夹命主科甲"，最利考运。':
    'Văn Xương, Văn Khúc giáp cung Mệnh, chủ thông minh tuấn tú, văn chương xuất sắc; hợp con đường văn giáo, học thuật, nghệ thuật, viết lách. Cổ thư nói "Xương Khúc giáp Mệnh chủ khoa giáp", lợi nhất cho vận thi cử.',
  '天魁天钺夹命，男称天乙、女称玉堂，一生贵人提携。考试、求职、关键时刻常有意外贵人相助。':
    'Thiên Khôi, Thiên Việt giáp Mệnh, (quý nhân) dương gọi là Thiên Ất, âm gọi là Ngọc Đường; một đời có quý nhân nâng đỡ. Khi thi cử, xin việc, lúc then chốt thường có quý nhân bất ngờ giúp đỡ.',
  '化禄、禄存同会命宫三方四正，财源涌动、衣食丰足。古书云"双禄朝垣，富比陶朱"，主一生不愁财，多有正财横财兼得。':
    'Hóa Lộc, Lộc Tồn cùng hội Tam Phương Tứ Chính của cung Mệnh, nguồn tài dồi dào, cơm áo sung túc. Cổ thư nói "Song Lộc triều viên, phú tỷ Đào Chu" (giàu như Đào Chu Công), chủ một đời không lo tiền bạc, thường được cả chính tài lẫn hoạnh tài.',
  '化禄、化权、化科三吉化齐会命宫三方四正，号称"三奇加会"。主一生功名、财富、贵人三全，是紫微斗数最高吉格之一。':
    'Hóa Lộc, Hóa Quyền, Hóa Khoa — ba cát hóa cùng hội Tam Phương Tứ Chính của cung Mệnh, gọi là "Tam Kỳ gia hội". Chủ một đời công danh, tài phú, quý nhân đủ cả ba, là một trong những cát cách cao nhất của Tử Vi Đẩu Số.',
  '化忌坐命，左右擎羊陀罗夹命，古书云"羊陀夹忌为败局"，主一生劳碌奔波、坎坷不顺、身心俱疲。需以德行修养与积极做事化解，凡事谨慎为上。':
    'Hóa Kỵ tọa Mệnh, hai bên có Kình Dương, Đà La giáp Mệnh. Cổ thư nói "Dương Đà giáp Kỵ là bại cục", chủ một đời lao lực bôn ba, gập ghềnh không thuận, thân tâm mỏi mệt. Cần hóa giải bằng tu dưỡng đức hạnh và tích cực làm việc, mọi việc cẩn trọng là hơn.',
  '火星铃星分居命宫前后两宫夹命，主性急、易冲动、突发意外或纠纷。需培养耐性、避免冲动决策。':
    'Hỏa Tinh, Linh Tinh chia ở hai cung trước sau giáp Mệnh, chủ tính nóng vội, dễ bốc đồng, dễ gặp sự cố hoặc tranh chấp bất ngờ. Cần rèn tính kiên nhẫn, tránh quyết định bốc đồng.',
  '地空地劫夹命，主财来财去、思想脱俗、易遁入宗教哲学。古书云"空劫夹命，财不聚"。宜技艺、宗教、研究等不重物质之业。':
    'Địa Không, Địa Kiếp giáp Mệnh, chủ tiền vào rồi ra, tư tưởng thoát tục, dễ đi vào tôn giáo, triết học. Cổ thư nói "Không Kiếp giáp Mệnh, tài bất tụ" (tiền không tụ). Hợp các nghề không nặng vật chất như kỹ nghệ, tôn giáo, nghiên cứu.',
  '廉贞、七杀、擎羊三星会照命宫三方，传统论述中标记为需要特别关注的组合。此格在大限流年触发时提醒保持谨慎态度：驾驶安全、人际和平、医疗决策需理性——强调主动管理而非消极宿命。':
    'Liêm Trinh, Thất Sát, Kình Dương ba sao hội chiếu tam phương cung Mệnh, trong luận thuyết truyền thống được xem là tổ hợp cần đặc biệt lưu tâm. Khi Đại Hạn, Lưu Niên kích hoạt cách này, nên giữ thái độ thận trọng: an toàn khi lái xe, hòa khí trong giao tiếp, quyết định y tế cần lý trí — nhấn mạnh chủ động quản lý chứ không phải định mệnh tiêu cực.',
  '巨门、火星、擎羊三星会照，传统古籍记载此格为需要警惕之组合（古文"终身缢死"为宿命论表述，今已不适用）。现代理解为：此组合象征直言易触发冲突、情绪激烈时需要自我觉察。修养方向是：练习温和表达、主动化解对立、培养情绪管理。':
    'Cự Môn, Hỏa Tinh, Kình Dương ba sao hội chiếu; cổ thư ghi đây là tổ hợp cần cảnh giác (câu cổ văn "chung thân ải tử" là cách nói định mệnh luận, nay không còn phù hợp). Cách hiểu hiện đại: tổ hợp này tượng trưng cho việc nói thẳng dễ gây xung đột, khi cảm xúc mãnh liệt cần tự nhận biết. Hướng tu dưỡng: tập diễn đạt ôn hòa, chủ động hóa giải đối lập, rèn khả năng quản lý cảm xúc.',
  '铃星、文昌、陀罗、武曲四星齐会，传统古籍记载此为需要特别关注之组合（古文"限至投河"为宿命论表述，非现代理解）。现代建议为：此组合在大限流年触发时，提醒理性处理重大决策、关注情绪波动、维持生活的稳定性——强调主动管理而非消极等待。':
    'Linh Tinh, Văn Xương, Đà La, Vũ Khúc bốn sao cùng hội; cổ thư ghi đây là tổ hợp cần đặc biệt lưu tâm (câu cổ văn "hạn chí đầu hà" là cách nói định mệnh luận, không phải cách hiểu hiện đại). Lời khuyên hiện đại: khi Đại Hạn, Lưu Niên kích hoạt tổ hợp này, nên xử lý các quyết định lớn một cách lý trí, để ý dao động cảm xúc, giữ cuộc sống ổn định — nhấn mạnh chủ động quản lý chứ không thụ động chờ đợi.',
  '擎羊于午宫坐命，号"马头带箭"，古书云"威镇边疆"。此格象征果决行动力与竞争精神，适合需要执行力与果敢决策的职业方向。传统论述同时提醒此格需要配合吉利星曜才能最优发挥——强调组合影响而非单星独论。':
    'Kình Dương tọa Mệnh ở cung Ngọ, gọi là "Mã Đầu Đới Tiễn"; cổ thư nói "uy trấn biên cương". Cách này tượng trưng cho sức hành động quả quyết và tinh thần cạnh tranh, hợp các hướng nghề cần năng lực thực thi và quyết đoán. Luận thuyết truyền thống cũng nhắc rằng cách này cần cát tinh phối hợp mới phát huy tốt nhất — nhấn mạnh ảnh hưởng của tổ hợp chứ không luận riêng một sao.',
  '禄存坐命，主一生衣食无忧、财禄稳定。性格保守，善积累，但羊陀夹禄须防小人。最宜配化禄、左辅右弼方为大格。':
    'Lộc Tồn tọa Mệnh, chủ một đời cơm áo không lo, tài lộc ổn định. Tính cách bảo thủ, giỏi tích lũy, nhưng Dương Đà giáp Lộc nên phải phòng tiểu nhân. Tốt nhất phối thêm Hóa Lộc, Tả Phù, Hữu Bật mới thành đại cách.',
  '禄存入身宫，主中年后财源稳定、得禄自享。倪师说「禄存入身，财气近身」——配偶或事业方向能带来稳定财禄。':
    'Lộc Tồn nhập cung Thân, chủ sau trung niên nguồn tài ổn định, có lộc tự hưởng. Thầy Nghê nói «Lộc Tồn nhập Thân, tài khí gần thân» — người phối ngẫu hoặc hướng sự nghiệp có thể mang lại tài lộc ổn định.',
  '天马坐命，主一生奔波、动中得财，宜走商旅、外勤、跨界发展。倪师说「天马入命，无禄不发」——若再会禄存或化禄即「禄马交驰」之富格。':
    'Thiên Mã tọa Mệnh, chủ một đời bôn ba, được tài trong vận động; hợp buôn bán đi xa, công việc bên ngoài, phát triển đa lĩnh vực. Thầy Nghê nói «Thiên Mã nhập Mệnh, không có Lộc thì không phát» — nếu hội thêm Lộc Tồn hoặc Hóa Lộc thì thành cách giàu «Lộc Mã giao trì».',
  '天马在迁移宫，主外出有利、远行得财，宜异乡发展。配化禄主异地生财，配煞星则旅途多波折。':
    'Thiên Mã ở cung Thiên Di, chủ ra ngoài có lợi, đi xa được tài, hợp phát triển nơi đất khách. Phối Hóa Lộc chủ sinh tài nơi xứ người, phối sát tinh thì đường đi nhiều trắc trở.',
  '文昌文曲同入命宫，主聪明俊秀、文采斐然，宜文学、教育、写作、咨询。最忌化忌——昌曲化忌主文书契约暗亏。':
    'Văn Xương, Văn Khúc cùng nhập cung Mệnh, chủ thông minh tuấn tú, văn chương xuất sắc; hợp văn học, giáo dục, viết lách, tư vấn. Kỵ nhất Hóa Kỵ — Xương Khúc Hóa Kỵ chủ thiệt thòi ngầm về giấy tờ, hợp đồng.',
  '文昌文曲同会三方四正，主才华横溢、口才文笔俱佳。宜走需要表达与文采的行业，化科加持则名声大显。':
    'Văn Xương, Văn Khúc cùng hội Tam Phương Tứ Chính, chủ tài hoa dồi dào, ăn nói và văn chương đều giỏi. Hợp các ngành cần khả năng diễn đạt và văn chương; có Hóa Khoa trợ lực thì danh tiếng rạng rỡ.',
  '左辅右弼同会命宫三方四正，主一生贵人不绝、人缘极佳。最宜领导岗位与团队合作型工作。倪师说「辅弼夹命，平生贵人多」——你不是单打独斗的命，要善用人际网络。':
    'Tả Phù, Hữu Bật cùng hội Tam Phương Tứ Chính của cung Mệnh, chủ một đời quý nhân không dứt, nhân duyên rất tốt. Hợp nhất với vị trí lãnh đạo và công việc làm việc nhóm. Thầy Nghê nói «Phụ Bật giáp Mệnh, bình sinh nhiều quý nhân» — bạn không phải mệnh đơn thương độc mã, hãy khéo dùng mạng lưới quan hệ.',
  '天魁天钺同会命宫三方四正，主"天乙贵人"加持，关键时刻总有贵人提携。倪师说「魁钺夹命，必为贵人」——遇到困难时身边会出现得力相助者，宜主动维护人脉。':
    'Thiên Khôi, Thiên Việt cùng hội Tam Phương Tứ Chính của cung Mệnh, chủ được "Thiên Ất quý nhân" phù trợ, lúc then chốt luôn có quý nhân nâng đỡ. Thầy Nghê nói «Khôi Việt giáp Mệnh, ắt là quý nhân» — khi gặp khó khăn bên cạnh sẽ có người đắc lực giúp đỡ, nên chủ động giữ gìn các mối quan hệ.',
  '化科 + 化权 同会三方四正，主名权双美——既有学识/名声（科），又有掌控力（权），宜走"专业权威"路线（如医生、律师、教授、技术骨干），名利双收且根基扎实。':
    'Hóa Khoa và Hóa Quyền cùng hội Tam Phương Tứ Chính, chủ danh và quyền đều đẹp — vừa có học thức/danh tiếng (Khoa), vừa có năng lực làm chủ (Quyền); hợp con đường "chuyên gia có uy tín" (như bác sĩ, luật sư, giáo sư, nòng cốt kỹ thuật), danh lợi đều được và nền tảng vững chắc.',

  // ── conditions: required / bonus / breaking ──
  '紫微入命': 'Tử Vi nhập Mệnh',
  '左辅右弼同会三方四正': 'Tả Phù, Hữu Bật cùng hội Tam Phương Tứ Chính',
  '再会文昌或文曲': 'Hội thêm Văn Xương hoặc Văn Khúc',
  '魁钺贵人加照': 'Có quý nhân Khôi Việt gia chiếu',
  '紫微化权': 'Tử Vi Hóa Quyền',
  '地空地劫双夹会照（紫微忌空劫）': 'Địa Không, Địa Kiếp cùng hội chiếu (Tử Vi kỵ Không Kiếp)',
  '紫微天府同入命宫': 'Tử Vi, Thiên Phủ cùng nhập cung Mệnh',
  '紫微天府同宫（不在命宫，会照减力）': 'Tử Vi, Thiên Phủ đồng cung (không ở cung Mệnh, hội chiếu nên giảm lực)',
  '左辅右弼同会': 'Tả Phù, Hữu Bật cùng hội',
  '再会昌曲': 'Hội thêm Xương Khúc',
  '紫府宫坐空劫（破紫府之贵气）': 'Cung Tử Phủ có Không Kiếp tọa (phá quý khí của Tử Phủ)',
  '紫府宫见双煞同坐': 'Cung Tử Phủ có hai sát tinh đồng tọa',
  '天府坐命三方': 'Thiên Phủ tọa tam phương của Mệnh',
  '天相坐命三方': 'Thiên Tướng tọa tam phương của Mệnh',
  '两星不同宫': 'Hai sao không đồng cung',
  '命宫见禄': 'Cung Mệnh gặp Lộc',
  '再会左辅': 'Hội thêm Tả Phù',
  '命宫坐煞星': 'Cung Mệnh có sát tinh tọa',
  '三方四正煞星过多': 'Tam Phương Tứ Chính có quá nhiều sát tinh',
  '太阳会命宫三方': 'Thái Dương hội tam phương cung Mệnh',
  '天梁会命宫三方': 'Thiên Lương hội tam phương cung Mệnh',
  '文昌会命宫三方': 'Văn Xương hội tam phương cung Mệnh',
  '禄存会命宫三方': 'Lộc Tồn hội tam phương cung Mệnh',
  '太阳庙旺': 'Thái Dương Miếu Vượng',
  '天梁庙旺': 'Thiên Lương Miếu Vượng',
  '再会化科': 'Hội thêm Hóa Khoa',
  '太阳落陷（阳梁失辉）': 'Thái Dương lạc Hãm (Dương Lương mất ánh sáng)',
  '三方煞重': 'Tam phương sát tinh nặng',
  '贪狼会照命宫三方': 'Tham Lang hội chiếu tam phương cung Mệnh',
  '贪狼庙旺': 'Tham Lang Miếu Vượng',
  '贪狼化禄/化权': 'Tham Lang Hóa Lộc/Hóa Quyền',
  '贪狼宫又见羊陀（破横发之力）': 'Cung Tham Lang lại gặp Dương Đà (phá sức hoạnh phát)',
  '贪狼遇空劫（财来财去）': 'Tham Lang gặp Không Kiếp (tiền vào rồi ra)',
  '武曲贪狼同宫（丑/未）': 'Vũ Khúc, Tham Lang đồng cung (Sửu/Mùi)',
  '武曲贪狼对宫拱照': 'Vũ Khúc, Tham Lang ở đối cung củng chiếu',
  '会照命宫三方': 'Hội chiếu tam phương cung Mệnh',
  '再遇火星/铃星（火贪/铃贪叠加）': 'Gặp thêm Hỏa Tinh/Linh Tinh (chồng thêm Hỏa Tham/Linh Tham)',
  '武曲化禄': 'Vũ Khúc Hóa Lộc',
  '武贪宫见羊陀': 'Cung Vũ Tham gặp Dương Đà',
  '武贪宫遇空劫': 'Cung Vũ Tham gặp Không Kiếp',
  '七杀、破军、贪狼三星齐入命宫三方四正': 'Thất Sát, Phá Quân, Tham Lang cả ba sao cùng vào Tam Phương Tứ Chính của Mệnh',
  '三方有化禄或化权（动得有力）': 'Tam phương có Hóa Lộc hoặc Hóa Quyền (động mà có lực)',
  '辅弼同会（变动中得贵人）': 'Phụ Bật cùng hội (trong biến động được quý nhân)',
  '煞星过重（动而无成）': 'Sát tinh quá nặng (động mà không thành)',
  '命坐空劫（动得辛苦）': 'Mệnh tọa Không Kiếp (động mà vất vả)',
  '天机、太阴、天同、天梁四星齐入命宫三方四正': 'Thiên Cơ, Thái Âm, Thiên Đồng, Thiên Lương cả bốn sao cùng vào Tam Phương Tứ Chính của Mệnh',
  '煞星过多（机月同梁忌煞）': 'Sát tinh quá nhiều (Cơ Nguyệt Đồng Lương kỵ sát)',
  '命宫坐煞': 'Cung Mệnh có sát tinh tọa',
  '廉贞天相同宫': 'Liêm Trinh, Thiên Tướng đồng cung',
  '见禄存或廉贞化禄': 'Gặp Lộc Tồn hoặc Liêm Trinh Hóa Lộc',
  '左辅会照': 'Tả Phù hội chiếu',
  '廉相宫坐擎羊（廉杀羊倾向）': 'Cung Liêm Tướng có Kình Dương tọa (khuynh hướng Liêm Sát Dương)',
  '廉贞化忌': 'Liêm Trinh Hóa Kỵ',
  '武曲七杀同宫': 'Vũ Khúc, Thất Sát đồng cung',
  '武曲化权': 'Vũ Khúc Hóa Quyền',
  '武曲化忌（武曲化忌为财劫之兆）': 'Vũ Khúc Hóa Kỵ (điềm báo kiếp tài)',
  '武杀宫煞星过多': 'Cung Vũ Sát có quá nhiều sát tinh',
  '天同天梁同宫': 'Thiên Đồng, Thiên Lương đồng cung',
  '文昌会照': 'Văn Xương hội chiếu',
  '天同化禄': 'Thiên Đồng Hóa Lộc',
  '煞星同坐': 'Có sát tinh đồng tọa',
  '未宫日月同辉（古书云未宫日月双美）': 'Nhật Nguyệt cùng sáng ở cung Mùi (cổ thư nói ở Mùi Nhật Nguyệt song mỹ)',
  '昌曲会照': 'Xương Khúc hội chiếu',
  '日月宫煞星同坐': 'Cung Nhật Nguyệt có sát tinh đồng tọa',
  '太阳太阴分居命宫前后两宫': 'Thái Dương, Thái Âm chia ở hai cung trước và sau cung Mệnh',
  '太阴庙旺': 'Thái Âm Miếu Vượng',
  '日月落陷（夹命无光）': 'Nhật Nguyệt lạc Hãm (giáp Mệnh mà không có ánh sáng)',
  '寅宫太阳庙旺，巨门得日光化解是非': 'Ở Dần Thái Dương Miếu Vượng, Cự Môn được ánh mặt trời hóa giải thị phi',
  '巨门化禄/化权（口才生财）': 'Cự Môn Hóa Lộc/Hóa Quyền (tài ăn nói sinh tài)',
  '巨门化忌（口舌官非）': 'Cự Môn Hóa Kỵ (khẩu thiệt, quan phi)',
  '申宫太阳偏西，巨门暗曜更显': 'Ở Thân Thái Dương đã ngả về tây, tính ám diệu của Cự Môn càng lộ',
  '巨门化禄/化权': 'Cự Môn Hóa Lộc/Hóa Quyền',
  '文昌会照（石中隐玉得明）': 'Văn Xương hội chiếu (ngọc trong đá được soi sáng)',
  '巨门化忌（玉藏深泥）': 'Cự Môn Hóa Kỵ (ngọc vùi sâu trong bùn)',
  '命坐煞星': 'Mệnh có sát tinh tọa',
  '命宫在未为空宫': 'Cung Mệnh ở Mùi là Vô Chính Diệu',
  '对宫丑宫为太阳太阴同度': 'Đối cung Sửu có Thái Dương, Thái Âm đồng độ',
  '辅弼相助': 'Có Phụ Bật trợ giúp',
  '煞星会照（珠光黯淡）': 'Sát tinh hội chiếu (ánh ngọc mờ nhạt)',
  '紫微独坐命宫（无天府同坐）': 'Tử Vi độc tọa cung Mệnh (không có Thiên Phủ đồng tọa)',
  '文昌文曲同会': 'Văn Xương, Văn Khúc cùng hội',
  '无辅弼（孤君无臣）': 'Không có Phụ Bật (vua lẻ loi không bề tôi)',
  '紫微遇空劫（古书最忌）': 'Tử Vi gặp Không Kiếp (cổ thư kỵ nhất)',
  '左辅右弼分居命宫前后两宫': 'Tả Phù, Hữu Bật chia ở hai cung trước và sau cung Mệnh',
  '再会魁钺': 'Hội thêm Khôi Việt',
  '文昌文曲分居命宫前后两宫': 'Văn Xương, Văn Khúc chia ở hai cung trước và sau cung Mệnh',
  '天魁天钺分居命宫前后两宫': 'Thiên Khôi, Thiên Việt chia ở hai cung trước và sau cung Mệnh',
  '化禄会照三方四正': 'Hóa Lộc hội chiếu Tam Phương Tứ Chính',
  '禄存会照三方四正': 'Lộc Tồn hội chiếu Tam Phương Tứ Chính',
  '命坐空劫（双禄遇空，财来财去）': 'Mệnh tọa Không Kiếp (Song Lộc gặp Không, tiền vào rồi ra)',
  '化禄、化权、化科三吉化齐会命宫三方四正': 'Hóa Lộc, Hóa Quyền, Hóa Khoa — ba cát hóa cùng hội Tam Phương Tứ Chính của Mệnh',
  '化忌坐命': 'Hóa Kỵ tọa Mệnh',
  '擎羊陀罗分居命宫前后两宫': 'Kình Dương, Đà La chia ở hai cung trước và sau cung Mệnh',
  '火星铃星分居命宫前后两宫': 'Hỏa Tinh, Linh Tinh chia ở hai cung trước và sau cung Mệnh',
  '地空地劫分居命宫前后两宫': 'Địa Không, Địa Kiếp chia ở hai cung trước và sau cung Mệnh',
  '廉贞、七杀、擎羊三星会照三方四正': 'Liêm Trinh, Thất Sát, Kình Dương ba sao hội chiếu Tam Phương Tứ Chính',
  '巨门、火星、擎羊三星会照三方四正': 'Cự Môn, Hỏa Tinh, Kình Dương ba sao hội chiếu Tam Phương Tứ Chính',
  '铃星、文昌、陀罗、武曲四星会照三方四正': 'Linh Tinh, Văn Xương, Đà La, Vũ Khúc bốn sao hội chiếu Tam Phương Tứ Chính',
  '擎羊于午宫坐命': 'Kình Dương tọa Mệnh ở cung Ngọ',
  '再会七杀或破军（武职大贵）': 'Hội thêm Thất Sát hoặc Phá Quân (võ chức đại quý)',
  '魁钺加照': 'Khôi Việt gia chiếu',
  '禄存入命宫': 'Lộc Tồn nhập cung Mệnh',
  '禄存入身宫': 'Lộc Tồn nhập cung Thân',
  '天马入命宫': 'Thiên Mã nhập cung Mệnh',
  '天马入迁移宫': 'Thiên Mã nhập cung Thiên Di',
  '文昌、文曲同会命宫三方四正': 'Văn Xương, Văn Khúc cùng hội Tam Phương Tứ Chính của Mệnh',
  '左辅、右弼同会命宫三方四正': 'Tả Phù, Hữu Bật cùng hội Tam Phương Tứ Chính của Mệnh',
  '天魁、天钺同会命宫三方四正': 'Thiên Khôi, Thiên Việt cùng hội Tam Phương Tứ Chính của Mệnh',
  '化科、化权同会命宫三方四正': 'Hóa Khoa, Hóa Quyền cùng hội Tam Phương Tứ Chính của Mệnh',
};

// ── dynamic strings: matched by the template that produced them ──
const B = '([子丑寅卯辰巳午未申酉戌亥])'; // i18n-ok: engine branch characters
const S = '(\\p{Script=Han}{2})';          // a two-character star name
const BRANCH_CHARS = '子丑寅卯辰巳午未申酉戌亥';
const br = (c: string) => BRANCHES_VI[BRANCH_CHARS.indexOf(c)] ?? c;
const list = (s: string) => s.split('、').map(term).join(', ');
const MING_QIAN: Record<string, string> = { '命': 'Mệnh', '迁': 'Thiên Di', '身': 'Thân' };

const HUA_LU_EXTRA: Record<string, string> = {
  '武曲化禄属正财，宜实业、金融。': 'Vũ Khúc Hóa Lộc thuộc chính tài, hợp kinh doanh thực nghiệp, tài chính.',
  '太阴化禄属阴财、不动产。': 'Thái Âm Hóa Lộc thuộc âm tài, bất động sản.',
  '贪狼化禄属人脉财、桃花财。': 'Tham Lang Hóa Lộc thuộc tài từ quan hệ, tài đào hoa.',
};

const TEMPLATES: [RegExp, (...m: string[]) => string][] = [
  // names
  [new RegExp(`^${S}化禄入命$`, 'u'), s => `${term(s)} Hóa Lộc nhập Mệnh`],
  [new RegExp(`^${S}化忌入(命|迁)$`, 'u'), (s, w) => `${term(s)} Hóa Kỵ nhập ${MING_QIAN[w]}`],
  // conditions
  [/^贪狼(同宫|会照)(火星|铃星)$/u, (how, sha) => `Tham Lang ${how === '同宫' ? 'đồng cung với' : 'hội chiếu'} ${term(sha)}`],
  [new RegExp(`^太阳太阴同入${B}宫$`, 'u'), b => `Thái Dương, Thái Âm cùng nhập cung ${br(b)}`],
  [new RegExp(`^巨门太阳同入${B}宫$`, 'u'), b => `Cự Môn, Thái Dương cùng nhập cung ${br(b)}`],
  [new RegExp(`^巨门入命于${B}宫$`, 'u'), b => `Cự Môn nhập Mệnh ở cung ${br(b)}`],
  [new RegExp(`^${S}化禄坐命宫$`, 'u'), s => `${term(s)} Hóa Lộc tọa cung Mệnh`],
  [new RegExp(`^${S}化忌坐(命|迁)宫$`, 'u'), (s, w) => `${term(s)} Hóa Kỵ tọa cung ${MING_QIAN[w]}`],
  [new RegExp(`^${S}化禄入财帛宫$`, 'u'), s => `${term(s)} Hóa Lộc nhập cung Tài Bạch`],
  [new RegExp(`^${S}化权入官禄宫$`, 'u'), s => `${term(s)} Hóa Quyền nhập cung Quan Lộc`],
  [new RegExp(`^${S}化科入(命|身)宫$`, 'u'), (s, w) => `${term(s)} Hóa Khoa nhập cung ${MING_QIAN[w]}`],
  [/^三方四正会(.+)（机月同梁缺(.+)）$/u, (has, miss) => `Tam Phương Tứ Chính hội ${list(has)} (Cơ Nguyệt Đồng Lương thiếu ${list(miss)})`],
  // descriptions
  [/^贪狼遇(火星|铃星)(同宫|三方会照)，主突发横财、突如其来的机遇。古书云“贪狼遇火铃，必发横财”，但来得快去得也快，宜见好就收。(本盘破格条件已触发，发力打折。)?$/u,
    (sha, how, broken) => `Tham Lang gặp ${term(sha)} ${how === '同宫' ? 'đồng cung' : 'hội chiếu trong tam phương'}, chủ bất ngờ được hoạnh tài, cơ hội đến đột ngột. Cổ thư nói "Tham Lang gặp Hỏa Linh ắt phát hoạnh tài", nhưng đến nhanh thì đi cũng nhanh, nên biết dừng đúng lúc.${broken ? ' Lá số này đã chạm điều kiện phá cách, sức phát bị giảm.' : ''}`],
  [new RegExp(`^太阳太阴于${B}宫同宫，阴阳平衡，文武兼备。主异性缘佳、事业顺遂、名声远播。(未宫日月双美尤佳。|丑宫日月同宫力量较平。)$`, 'u'),
    (b, tail) => `Thái Dương, Thái Âm đồng cung ở ${br(b)}, âm dương cân bằng, văn võ kiêm toàn. Chủ có duyên với người khác giới, sự nghiệp thuận lợi, danh tiếng lan xa. ${tail.startsWith('未') ? 'Ở Mùi Nhật Nguyệt song mỹ, càng tốt.' : 'Nhật Nguyệt đồng cung ở Sửu thì lực khá bình thường.'}`],
  [new RegExp(`^巨门太阳同${B}宫，太阳化解巨门暗曜，主以口才、传媒、外语、专业立业。寅宫为佳，申宫力减。怕巨门化忌则官非。$`, 'u'),
    b => `Cự Môn, Thái Dương đồng cung ở ${br(b)}, Thái Dương hóa giải tính ám diệu của Cự Môn, chủ lập nghiệp bằng tài ăn nói, truyền thông, ngoại ngữ, chuyên môn. Ở Dần là tốt, ở Thân lực giảm. Sợ Cự Môn Hóa Kỵ thì có quan phi.`],
  [new RegExp(`^${S}化禄坐命，主生财顺利、人缘佳、机缘多。(.*)$`, 'u'),
    (s, extra) => `${term(s)} Hóa Lộc tọa Mệnh, chủ sinh tài thuận lợi, nhân duyên tốt, nhiều cơ duyên.${extra ? ' ' + (HUA_LU_EXTRA[extra] ?? extra) : ''}`],
  [new RegExp(`^${S}化忌坐命宫，需留意自身固执、心理障碍或健康隐患，凡事退一步思考。化忌不一定坏，代表此星能量需要特别关注。$`, 'u'),
    s => `${term(s)} Hóa Kỵ tọa cung Mệnh, cần lưu ý sự cố chấp của bản thân, trở ngại tâm lý hoặc mầm bệnh tiềm ẩn; mọi việc nên lùi một bước mà suy nghĩ. Hóa Kỵ không nhất định là xấu, nó cho thấy năng lượng của sao này cần được đặc biệt quan tâm.`],
  [new RegExp(`^${S}化忌坐迁移宫，外出、远行、人际关系易有波折，宜守不宜动。$`, 'u'),
    s => `${term(s)} Hóa Kỵ tọa cung Thiên Di, ra ngoài, đi xa, quan hệ giao tiếp dễ có trắc trở; nên giữ, không nên động.`],
  [new RegExp(`^${S}化禄入财帛宫，主财源畅通、收入稳定。倪师讲化禄是「正财」象征——这个化禄星所代表的能力（${S}的核心特质）是你赚钱的主轴。配禄存或天马则财源更广。$`, 'u'),
    s => `${term(s)} Hóa Lộc nhập cung Tài Bạch, chủ nguồn tài thông suốt, thu nhập ổn định. Thầy Nghê giảng Hóa Lộc là biểu tượng của «chính tài» — năng lực mà sao Hóa Lộc này đại diện (đặc tính cốt lõi của ${term(s)}) là trục chính giúp bạn kiếm tiền. Phối Lộc Tồn hoặc Thiên Mã thì nguồn tài càng rộng.`],
  [new RegExp(`^${S}化权入官禄宫，主事业有掌控力、能担当独当一面的职位。化权代表权力与执行力——${S}化权说明你在事业上能成为决策者或核心执行者，宜走管理或技术权威路线。$`, 'u'),
    s => `${term(s)} Hóa Quyền nhập cung Quan Lộc, chủ sự nghiệp có khả năng làm chủ, đảm đương được vị trí tự gánh vác một phương. Hóa Quyền đại diện cho quyền lực và năng lực thực thi — ${term(s)} Hóa Quyền cho thấy trong sự nghiệp bạn có thể trở thành người quyết định hoặc người thực thi nòng cốt; hợp con đường quản lý hoặc chuyên gia kỹ thuật có uy tín.`],
  [new RegExp(`^${S}化科入(命|身)宫，主名声、文书、学术运。倪师讲化科是「贵人星」——${S}化科带来的是被人看重的特质，宜从事文书、教育、研究、咨询、文创等“以名取利”的方向。$`, 'u'),
    (s, w) => `${term(s)} Hóa Khoa nhập cung ${MING_QIAN[w]}, chủ vận về danh tiếng, văn thư, học thuật. Thầy Nghê giảng Hóa Khoa là «sao quý nhân» — ${term(s)} Hóa Khoa mang lại phẩm chất được người khác coi trọng; hợp làm văn thư, giáo dục, nghiên cứu, tư vấn, sáng tạo văn hóa và những hướng "lấy danh cầu lợi".`],
  [/^机月同梁需天机、太阴、天同、天梁四星齐会三方四正方为完整真格；本盘只会齐其中 3 颗（(.+)），缺(.+)未会，并非完整真格，力量减一档。文质带谋，宜公职、教研、医疗、服务等靠积累与稳定的行业，关键看缺位星与四化的配合。$/u,
    (has, miss) => `Cơ Nguyệt Đồng Lương cần đủ bốn sao Thiên Cơ, Thái Âm, Thiên Đồng, Thiên Lương cùng hội Tam Phương Tứ Chính mới là chân cách trọn vẹn; lá số này chỉ hội đủ 3 sao (${list(has)}), thiếu ${list(miss)}, nên không phải chân cách trọn vẹn, lực giảm một bậc. Nho nhã mà có mưu, hợp công chức, giảng dạy – nghiên cứu, y tế, dịch vụ và các ngành dựa vào tích lũy, ổn định; then chốt là xem sao còn thiếu và sự phối hợp của Tứ Hóa.`],
];

/** Vietnamese for one engine string from a Pattern. Returns the input unchanged if unknown
 *  (the coverage test fails on that, so it never ships silently). */
export function patternTextVi(zh: string): string {
  if (NAMES[zh]) return NAMES[zh];
  if (TEXT[zh]) return TEXT[zh];
  if (SOURCES[zh]) return SOURCES[zh];
  for (const [re, fn] of TEMPLATES) {
    const m = zh.match(re);
    if (m) return fn(...m.slice(1).map(x => x ?? ''));
  }
  return zh;
}

export interface PatternVi {
  name: string;
  level: Pattern['level'];
  description: string;
  /** Vietnamese palace names (engine palace names via term()). */
  palaces: string[];
  conditions?: { required: string[]; bonus?: string[]; breaking?: string[] };
  source?: string;
  /** Original Chinese pattern name, for a <Zh> reference. */
  nameZh: string;
}

/** Map one detectPatterns() result to Vietnamese. */
export function patternVi(p: Pattern): PatternVi {
  const tr = patternTextVi;
  return {
    name: tr(p.name),
    nameZh: p.name,
    level: p.level,
    description: tr(p.description),
    palaces: [...new Set(p.palaces.map(x => term(x)))], // 官禄 and 官禄宫 both render as "Quan Lộc"
    conditions: p.conditions && {
      required: p.conditions.required.map(tr),
      bonus: p.conditions.bonus?.map(tr),
      breaking: p.conditions.breaking?.map(tr),
    },
    source: p.source ? tr(p.source) : undefined,
  };
}

const KEYWORDS: Record<string, string> = {
  '尊贵': 'Tôn quý', '独立': 'Độc lập', '领导': 'Lãnh đạo',
  '智慧': 'Trí tuệ', '机变': 'Linh biến', '善谋': 'Giỏi mưu tính',
  '阳刚': 'Dương cương', '官贵': 'Quan quý', '慷慨': 'Hào phóng',
  '财富': 'Tài phú', '刚毅': 'Cương nghị', '果断': 'Quả đoán',
  '温和': 'Ôn hòa', '享福': 'Hưởng phúc', '随缘': 'Tùy duyên',
  '才艺': 'Tài nghệ', '桃花': 'Đào hoa', '多变': 'Hay biến đổi',
  '财库': 'Kho tài', '稳重': 'Chín chắn', '保守': 'Bảo thủ',
  '柔美': 'Nhu mỹ', '细腻': 'Tinh tế',
  '欲望': 'Dục vọng', '多才': 'Đa tài',
  '善辩': 'Giỏi biện luận', '多思': 'Hay suy nghĩ', '口才': 'Tài ăn nói',
  '辅佐': 'Phò tá', '行政': 'Hành chính', '稳健': 'Vững vàng',
  '荫护': 'Che chở', '医药': 'Y dược', '长辈': 'Trưởng bối',
  '将星': 'Tướng tinh', '果决': 'Quả quyết', '孤克': 'Cô khắc',
  '开创': 'Khai sáng', '变动': 'Biến động', '破旧': 'Phá cũ',
};

const NATURES: Record<string, string> = {
  '帝王星': 'Sao đế vương', '智慧星': 'Sao trí tuệ', '贵人星': 'Sao quý nhân',
  '财帛星': 'Sao tài bạch', '福德星': 'Sao phúc đức', '桃花星': 'Sao đào hoa',
  '财库星': 'Sao kho tài', '财富星': 'Sao tài phú', '是非星': 'Sao thị phi',
  '印绶星': 'Sao ấn thụ', '荫庇星': 'Sao che chở (ấm tinh)', '将帅星': 'Sao tướng soái',
  '变动星': 'Sao biến động', '空宫': 'Vô Chính Diệu',
};

/** Map getMingGongSummary() output to Vietnamese (pass the engine result; patterns.ts is server-only). */
export function mingGongSummaryVi(s: { stars: string[]; keywords: string[]; nature: string }):
  { stars: string[]; keywords: string[]; nature: string } {
  return {
    stars: s.stars.map(x => term(x)),
    keywords: s.keywords.map(k => KEYWORDS[k] ?? k),
    nature: s.nature ? (NATURES[s.nature] ?? s.nature) : '',
  };
}
