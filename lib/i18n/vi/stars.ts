/**
 * Star detail content (StarDetailPanel) in Vietnamese, keyed by the engine's Chinese star name.
 * Translated from components/StarDetailPanel.tsx STAR_DETAIL and lib/ziwei/constants.ts STAR_DESCRIPTIONS
 * (Nghê Hải Hạ school; classical quotes from Tử Vi Đẩu Số Toàn Thư, Nam Bắc Sơn Nhân annotations).
 * Classical quotes are rendered as meaning translations, not transliterations.
 */
import type { Star } from '@/lib/ziwei/types';

export const ELEMENT_VI: Record<string, string> = { '金': 'Kim', '木': 'Mộc', '水': 'Thủy', '火': 'Hỏa', '土': 'Thổ' };

export const STAR_TYPE_LABEL: Record<Star['type'], string> = {
  major: 'Chính tinh', lucky: 'Cát tinh', sha: 'Sát tinh', minor: 'Tạp diệu',
};

export const starPanel = {
  element: 'Ngũ hành',
  nature: 'Tính chất',
  position: 'Vị trí',
  brightBright: 'Miếu Vượng',
  brightNormal: 'Bình hòa',
  brightDim: 'Hãm Địa',
  keywords: 'Đặc tính tinh diệu',
  classical: 'Trích cổ thư (dịch nghĩa)',
  niHaixia: 'Luận giải của thầy Nghê Hải Hạ',
  career: 'Hướng sự nghiệp',
  relationship: 'Đặc điểm tình cảm',
  wealth: 'Phân tích tài vận',
  health: 'Lưu ý sức khỏe',
  bestPalace: 'Cung tốt nhất',
  worstPalace: 'Cung cần lưu ý',
} as const;

/** Vietnamese for constants.ts STAR_DESCRIPTIONS (14 chính tinh). */
export const STAR_DESCRIPTIONS_VI: Record<string, { keywords: string[]; nature: string; element: string }> = {
  '紫微': { keywords: ['Đế vương', 'Tôn quý', 'Độc lập'], nature: 'Trung tính, thiên về cát', element: 'Thổ' },
  '天机': { keywords: ['Trí tuệ', 'Linh biến', 'Mưu lược'], nature: 'Cát tinh', element: 'Mộc' },
  '太阳': { keywords: ['Dương cương', 'Quan quý', 'Hào phóng'], nature: 'Cát tinh', element: 'Hỏa' },
  '武曲': { keywords: ['Tài phú', 'Cương nghị', 'Quả đoán'], nature: 'Trung tính', element: 'Kim' },
  '天同': { keywords: ['Ôn hòa', 'Hưởng phúc', 'Tùy duyên'], nature: 'Cát tinh', element: 'Thủy' },
  '廉贞': { keywords: ['Tài nghệ', 'Hình tù', 'Đào hoa'], nature: 'Trong hung có cát', element: 'Hỏa' },
  '天府': { keywords: ['Kho tài', 'Chín chắn', 'Bảo thủ'], nature: 'Cát tinh', element: 'Thổ' },
  '太阴': { keywords: ['Nhu mỹ', 'Tài phú', 'Âm nhu'], nature: 'Cát tinh', element: 'Thủy' },
  '贪狼': { keywords: ['Dục vọng', 'Đào hoa', 'Đa tài'], nature: 'Trung tính', element: 'Mộc' },
  '巨门': { keywords: ['Khẩu thiệt', 'Thị phi', 'Giỏi biện luận'], nature: 'Trong hung có cát', element: 'Thủy' },
  '天相': { keywords: ['Phò tá', 'Hành chính', 'Ấn thụ'], nature: 'Cát tinh', element: 'Thủy' },
  '天梁': { keywords: ['Che chở', 'Y dược', 'Trưởng bối'], nature: 'Cát tinh', element: 'Thổ' },
  '七杀': { keywords: ['Tướng tinh', 'Quả quyết', 'Cô khắc'], nature: 'Hung tinh', element: 'Kim' },
  '破军': { keywords: ['Khai sáng', 'Biến động', 'Phá hoại'], nature: 'Hung tinh', element: 'Thủy' },
};

export interface StarDetailVi {
  niHaixia: string;
  classical: string;
  bestPalace: string;
  worstPalace: string;
  career: string;
  relationship: string;
  wealth: string;
  health: string;
}

/** Detailed reading for the 14 chính tinh. */
export const STAR_DETAIL_VI: Record<string, StarDetailVi> = {
  '紫微': {
    niHaixia: 'Thầy Nghê cho rằng Tử Vi là sao hoàng đế; người có Tử Vi tọa Mệnh mang khí chất cô ngạo, thích ở một mình, không thích bị người khác quản thúc. Tử Vi cần có Tả Phù, Hữu Bật giáp hai bên mới phát huy được khí chất đế vương, nếu không chỉ là "cô quân" (vua đơn độc), giàu mà không sang. Tử Vi ở cung Thìn, Tuất là tốt nhất, cùng Thiên Phủ tạo thành cách song tinh, tài quan song mỹ, có thể xuất tướng nhập tướng. Tử Vi sợ nhất Hỏa Tinh, Linh Tinh, Kình Dương, Đà La đồng cung; gặp sát tinh thì quý mà cô độc, có quyền mà không có tiền.',
    classical: 'Cổ quyết: «Tử Vi là đế tọa, lâm Mệnh chủ tôn quý, thống lĩnh các sao; người tọa Mệnh chủ uy quyền hiển đạt.» Nam Bắc Sơn Nhân chú: «Tử Vi thủ Mệnh ở Thìn, tài quan song mỹ, xuất tướng nhập tướng, vị đến Tam Công; an Mệnh ở cung Tý thì phú quý không bền, về sau không đẹp.»',
    bestPalace: 'Mệnh (Thìn, Tuất), Quan Lộc',
    worstPalace: 'Tật Ách, Phu Thê',
    career: 'Chính trường, cấp quản lý, tự lập nghiệp; bẩm sinh khí chất đế vương, hợp vị trí lãnh đạo tự mình gánh vác một phương',
    relationship: 'Tình cảm thụ động, lòng tự trọng cao, cần đối phương chủ động; có khuynh hướng cô độc, kết hôn muộn thì tốt',
    wealth: 'Tài vận ổn định, giữ của giỏi hơn tiến thủ; ở Thìn, Tuất tài quan song mỹ, hợp nhất với đầu tư kiểu tích lũy',
    health: 'Thuộc hành Thổ, chú ý tỳ vị, hệ tiêu hóa. Kỵ làm việc quá sức, nên giữ nếp sinh hoạt điều độ',
  },
  '天机': {
    niHaixia: 'Thầy Nghê nói Thiên Cơ là sao quân sư, là sao thông minh nhất, nhưng thông minh bộc lộ ra ngoài thì hại thân. Thiên Cơ Hóa Kỵ là phiền phức nhất, ứng với câu "thông minh lại bị thông minh hại". Thiên Cơ thuộc Mộc, linh hoạt hay biến; người có Thiên Cơ ở Mệnh tư duy nhạy bén, nhưng thường nhiều mưu ít quyết, cần rời quê hương đi xa mới phát triển được; ứng biến theo thời cơ, tùy cơ ứng biến là đặc tính lớn nhất.',
    classical: 'Cổ quyết: «Làm người tinh tế khôn khéo, tự ưa kinh doanh; Thiên Cơ thuộc Mộc, người buôn bán phần nhiều có kiến giải nhạy bén; rời tông tộc ắt xa người thân, mưu cơ ắt xa lìa thân thích.» Nam Bắc Sơn Nhân chú: «Thiên Cơ ở đất Miếu Vượng chủ người tinh minh, giỏi hoạch định; ở đất Hãm thì ảm đạm, phần nhiều làm nghề buôn bán.»',
    bestPalace: 'Mệnh (cung Mão), Quan Lộc',
    worstPalace: 'Phu Thê',
    career: 'Chuyên gia kỹ thuật, mưu sĩ, nhà nghiên cứu, CNTT, hoạch định; dùng trí hơn dùng sức, hợp phát triển xa quê',
    relationship: 'Tình cảm hay thay đổi, suy nghĩ quá nhiều, khó chuyên nhất; nên kết hôn muộn, sau khi cưới cần học cách buông bớt lo nghĩ',
    wealth: 'Kiếm tiền bằng trí tuệ và kỹ năng, không giỏi giữ của; lấy chuyên môn kỹ thuật làm nghề thì tài vận ổn định',
    health: 'Thuộc hành Mộc, chú ý gan mật, hệ thần kinh. Suy nghĩ quá nhiều dễ mất ngủ, nên tập tĩnh tâm, thiền định',
  },
  '太阳': {
    niHaixia: 'Thầy Nghê cho rằng Thái Dương là sao của tính gia trưởng ("đại nam nhân"); từ Mão đến Ngọ là nhập Miếu, quang minh chính đại; sau Ngọ dần lạc Hãm. Người Thái Dương tọa Mệnh hào phóng, trọng thể diện; mệnh nam thì hợp, mệnh nữ thì quá mạnh mẽ. Thái Dương đại diện cho cha và bậc trưởng bối; ở Mệnh chủ người tính cách hướng ngoại, cởi mở, thích được mọi người nhìn thấy, hợp nhất với công chức hoặc sự nghiệp công chúng. Lạc Hãm thì trước siêng sau lười, cô quả lao lực.',
    classical: 'Cổ quyết: «Thái Dương ở Ngọ là nhập Miếu, ánh sáng rực rỡ, chủ quý hiển, mệnh nam tốt nhất; lạc Hãm thì cô quả lao lực, trước siêng sau lười.» Nam Bắc Sơn Nhân chú: «Thái Dương thủ Mệnh ở cung Ngọ, tài quan song mỹ, xuất tướng nhập tướng; an Mệnh ở Thìn thì trung niên tài quan chuyển tốt, người sinh năm Ất dù gặp hung cũng đại lợi.»',
    bestPalace: 'Mệnh (từ Mão đến Ngọ), Quan Lộc',
    worstPalace: 'Phu Thê (mệnh nữ), Tật Ách',
    career: 'Công chức, chính trường, quản lý, quan hệ công chúng, giáo dục, truyền thông; thích đứng trước đám đông, hợp sự nghiệp công chúng',
    relationship: 'Mệnh nam duyên tốt nhưng đa tình, mệnh nữ độc lập, mạnh mẽ; hôn nhân cần thời gian dung hòa, nên tìm bạn đời dịu dàng, chu đáo',
    wealth: 'Tài vận nhờ nỗ lực, hào phóng hay giúp người, không giỏi tích lũy; nhập Miếu thì tài vận vượng, lạc Hãm thì tài vận thăng trầm',
    health: 'Thuộc hành Hỏa, chú ý tim, mắt. Ở vị trí lạc Hãm dễ làm việc quá sức, cần nghỉ ngơi đầy đủ',
  },
  '武曲': {
    niHaixia: 'Thầy Nghê xem Vũ Khúc là chủ tinh của Tài Bạch, cứng rắn không khuất phục, sợ nhất cô khắc. Người Vũ Khúc tọa Mệnh ý chí kiên định, hợp tài chính, quản lý tiền bạc, nhưng trong tình cảm quá thẳng, dễ làm tổn thương người khác. Vũ Khúc Hóa Kỵ phải cẩn thận tai nạn, huyết quang. Vũ Khúc ở Thìn, Tuất, Sửu, Mùi được đất vượng, đồng cung với Thất Sát có thể thành cách "tướng tài", là cách cục tài phú rất tốt.',
    classical: 'Cổ quyết: «Vũ Khúc thuộc Kim, tính cương cường, một đời nhiều hình khắc; thủ Mệnh ở đất vượng thì xuất tướng nhập tướng.» Nam Bắc Sơn Nhân chú: «Vũ Khúc thủ Mệnh, tam phương tứ chính đều cát thì tài quan song mỹ; võ chức thêm Phụ Bật, Xương Khúc cũng chủ đại quý; đồng cung với Thất Sát là cách tướng tài, chủ đại phú.»',
    bestPalace: 'Mệnh (Thìn, Tuất, Sửu, Mùi), Tài Bạch, Quan Lộc',
    worstPalace: 'Phu Thê',
    career: 'Tài chính, quân đội – cảnh sát, kế toán, kỹ thuật công trình; năng lực thực thi cực mạnh, hợp lĩnh vực cần khí phách và quyết đoán',
    relationship: 'Tình cảm thẳng thắn, thiếu lãng mạn, cần bạn đời dịu dàng bổ khuyết; kỵ cô khắc trong tình cảm',
    wealth: 'Bản thân là tài tinh, tài vận rất mạnh, khả năng quản lý tiền vượt trội; ở Thìn, Tuất tài quan song mỹ',
    health: 'Thuộc hành Kim, chú ý phổi, hệ hô hấp, răng. Khi Hóa Kỵ cần phòng tai nạn, huyết quang',
  },
  '天同': {
    niHaixia: 'Thầy Nghê nói Thiên Đồng là phúc tinh, cũng là sao lười nhất. Thiên Đồng tọa Mệnh thích hưởng phúc, không thích cạnh tranh, hợp công việc ổn định. Thiên Đồng đồng cung với Thiên Lương là tốt nhất, vừa hưởng phúc vừa có bảo đảm. Thiên Đồng Hóa Lộc là Hóa Lộc đẹp nhất, chủ một đời cơm áo không lo, vui vẻ thong dong. Thiên Đồng kỵ lạc Hãm, lạc Hãm thì phúc giảm, gặp hung tinh cần được hóa giải.',
    classical: 'Cổ quyết: «Thiên Đồng là sao phúc đức, người tọa Mệnh hưởng phúc có thừa, chủ một đời tiêu dao tự tại, không phải lao khổ.» Nam Bắc Sơn Nhân chú: «Thiên Đồng thủ Mệnh, tam phương không có sát tinh thì một đời vui vẻ, cơm áo đầy đủ; thêm cát tinh thì phú quý song toàn, làm người ôn hòa, được nhiều người mến.»',
    bestPalace: 'Mệnh, Phúc Đức',
    worstPalace: 'Quan Lộc',
    career: 'Ngành dịch vụ, giải trí, ẩm thực, văn nghệ; môi trường nhẹ nhàng vui vẻ là hợp nhất, kỵ cạnh tranh áp lực cao',
    relationship: 'Tình cảm ôn hòa, không chủ động, dễ thụ động đón nhận; hôn nhân khá ổn định, tính tình dễ gần',
    wealth: 'Tài vận không nổi bật, dựa vào lương ổn định, không giỏi đầu cơ; cơm áo không lo nhưng khó đại phú',
    health: 'Thuộc hành Thủy, chú ý thận, bàng quang. Thể chất khá yếu, nên vận động vừa phải, giữ tâm thế thoải mái',
  },
  '廉贞': {
    niHaixia: 'Thầy Nghê cho rằng Liêm Trinh là "thứ đào hoa" (sao đào hoa thứ hai), tài hoa dồi dào nhưng tình cảm phức tạp. Liêm Trinh Hóa Kỵ rất hung, ứng với kiện tụng, tù ngục, tai nạn. Liêm Trinh đồng cung với Thiên Tướng thì hóa hung thành cát, thành cách ấn thụ hành chính. Liêm Trinh ngũ hành thuộc Hỏa, tính cách cương liệt, một đời nhiều thăng trầm, tài nghệ xuất chúng; nếu giữ được chính đạo, không đi đường tà, có thể thành đại khí.',
    classical: 'Cổ quyết: «Liêm Trinh là thứ đào hoa, tài hoa dồi dào, tình cảm nhiều trắc trở; Liêm Tướng đồng cung thì hóa hung thành cát, thành cách ấn thụ hành chính, có thể nắm quyền bính.» Nam Bắc Sơn Nhân chú: «Liêm Trinh thủ Mệnh, gặp cát tinh thì tài hoa xuất chúng; Hóa Kỵ thì kiện tụng vướng thân, chủ tai họa huyết quang, phải đề phòng.»',
    bestPalace: 'Quan Lộc (đi cùng Thiên Tướng), Mệnh (khi Hóa Lộc)',
    worstPalace: 'Mệnh (khi Hóa Kỵ), Phu Thê',
    career: 'Nghệ thuật, giải trí, pháp luật, công chức (đi cùng Thiên Tướng); tài nghệ xuất chúng, nên giữ nghề chính đáng mới bền lâu',
    relationship: 'Đào hoa nhiều, tình cảm phức tạp, dễ gặp vướng mắc tình cảm; nên kết hôn muộn, chọn bạn đời chín chắn',
    wealth: 'Tài vận thăng trầm, kiếm tiền nhờ tài nghệ; khi Hóa Kỵ phòng tranh chấp tài chính và rủi ro pháp lý',
    health: 'Thuộc hành Hỏa, chú ý tim, máu, gan. Khi Hóa Kỵ phòng tai nạn và phẫu thuật, lưu ý huyết quang',
  },
  '天府': {
    niHaixia: 'Thầy Nghê nói Thiên Phủ là sao kho tài, sao giữ thành, không chủ động phát tài nhưng giữ được của cải. Người Thiên Phủ tọa Mệnh chín chắn, bảo thủ; mệnh nữ tốt nhất, có thể vượng phu, hưng gia. Thiên Phủ thích nhất có Tử Vi đồng cung hoặc chiếu đối, tạo thành cách song tinh, tài quan song mỹ. Thiên Phủ sợ Không Kiếp giáp, gặp Không Kiếp thì kho tài cạn đáy, không giữ được tiền.',
    classical: 'Cổ quyết: «Thiên Phủ là sao kho tài, người thủ Mệnh chín chắn bảo thủ, chủ tích của làm vượng nhà; mệnh nữ gặp thì vượng phu ích tử, gia đạo hưng thịnh.» Nam Bắc Sơn Nhân chú: «Thiên Phủ thủ Mệnh, tam phương hội cát thì tài quan song mỹ, phú quý an khang; gặp Không Kiếp thì kho tài thủng, khó tích của.»',
    bestPalace: 'Mệnh, Tài Bạch, Điền Trạch',
    worstPalace: 'Thiên Di',
    career: 'Quản lý hành chính, tài vụ, bảo hiểm, bất động sản; cầu ổn không mạo hiểm, hợp nghề nghiệp kiểu giữ thành',
    relationship: 'Tình cảm ổn định, chăm lo gia đình, là người bạn đời tốt; coi trọng cảm giác an toàn của gia đình và sự bảo đảm kinh tế',
    wealth: 'Tài vận rất tốt, khả năng giữ của mạnh, hợp nhất với đầu tư tích lũy và mua sắm bất động sản',
    health: 'Thuộc hành Thổ, chú ý tỳ vị, tiêu hóa. Thể chất vững, nên giữ ăn uống và sinh hoạt điều độ',
  },
  '太阴': {
    niHaixia: 'Thầy Nghê cho rằng Thái Âm là tài tinh, lợi cho mệnh nữ, cũng là sao đại diện cho mẹ và vợ trong mệnh nam. Thái Âm nhập Miếu thì tài vận rất tốt, ở đất Hãm thì tài vận bị cản trở. Thái Âm Hóa Kỵ cần chú ý vấn đề của người thân nữ giới. Thái Âm ở Hợi, Tý nhập Miếu, ánh sáng chiếu trọn, đại diện cho sự thanh nhã tinh tế, tình cảm phong phú, coi trọng thế giới nội tâm và đời sống tinh thần.',
    classical: 'Cổ quyết: «Thái Âm là tài tinh, lợi mệnh nữ; ở Hợi, Tý nhập Miếu, ánh sáng chiếu trọn, tài vận rất vượng; ở Ngọ lạc Hãm thì u uất đa tình, tài vận bình thường.» Nam Bắc Sơn Nhân chú: «Thái Âm thủ Mệnh, nhập Miếu thì của cải dồi dào, mệnh nữ càng tốt; lạc Hãm thì phải nỗ lực mới giàu được, tình cảm tinh tế.»',
    bestPalace: 'Mệnh (Hợi, Tý), Tài Bạch',
    worstPalace: 'Mệnh (cung Ngọ, đất Hãm)',
    career: 'Tài vụ, tài chính, bất động sản, nghệ thuật, giáo dục; tinh tế, kiên nhẫn, hợp nghề cần thẩm mỹ và sự dịu dàng',
    relationship: 'Tình cảm dịu dàng tinh tế, coi trọng cảm nhận nội tâm, cần mối quan hệ ổn định có cảm giác an toàn',
    wealth: 'Nhập Miếu thì tài vận rất vượng, lạc Hãm thì cần nỗ lực; quản lý tiền cẩn thận, giỏi tích lũy, không giỏi mạo hiểm',
    health: 'Thuộc hành Thủy, chú ý thận, tử cung (mệnh nữ). Cảm xúc dao động ảnh hưởng sức khỏe, nên giữ tâm trạng thư thái',
  },
  '贪狼': {
    niHaixia: 'Thầy Nghê nói Tham Lang là sao đa tài đa nghệ nhất, đào hoa nặng nhất. Tham Lang Hóa Lộc nhập Mệnh thì sức hút tỏa khắp, ai gặp cũng mến. Tham Lang là sao phát muộn, sau trung niên mới thật sự phát đạt. Tham Lang ở Dần, Thân nhập Miếu là tốt nhất, đào hoa vượng, tài nghệ vượt trội; sau khi Hóa Lộc tài vận đại phát, nhưng nếu gặp Không Kiếp thì một đời nhiều trắc trở, khó tụ tài.',
    classical: 'Cổ quyết: «Tham Lang phát phúc hanh thông, đa tài đa nghệ, đào hoa nặng nhất; nhưng trước tuổi ba mươi khó thành, phần đông phát muộn. Lạc Hãm gặp sát lại thành cát, đó là lý của Tham Lang lạc Hãm.» Nam Bắc Sơn Nhân chú: «Tham Lang thủ Mệnh, gặp cát thì phúc lộc thọ đều nhiều, phát phúc hanh thông; nhưng lâu về sau khó được kết cục tốt, nên tu thân dưỡng đức mới có thể thiện chung.»',
    bestPalace: 'Mệnh (khi Hóa Lộc), Phúc Đức, Thiên Di',
    worstPalace: 'Tật Ách',
    career: 'Nghệ thuật, giải trí, quan hệ công chúng, kinh doanh bán hàng, phong thủy – ngũ thuật; dựa vào quan hệ và tài nghệ, kiểu người đa tài đa nghệ',
    relationship: 'Đào hoa rất vượng, tình cảm đa dạng; nên kết hôn muộn, sau khi cưới cần kiềm chế đào hoa mới bạc đầu giai lão',
    wealth: 'Kiếm tiền nhờ quan hệ và tài nghệ, tài vận đến trung – vãn niên mới ổn; sau khi Hóa Lộc tài nguyên rộng mở, thời trẻ nên giữ vững',
    health: 'Thuộc hành Mộc (kiêm Thủy), chú ý gan, thận. Đào hoa quá vượng dễ hao tổn tinh lực, nên tiết chế, điều dưỡng',
  },
  '巨门': {
    niHaixia: 'Thầy Nghê cho rằng Cự Môn là sao khẩu thiệt thị phi, nhưng sau khi Hóa Lộc, Hóa Quyền thì chuyển cát, thành cách kiếm tiền bằng tài ăn nói. Người Cự Môn tọa Mệnh đa nghi, giỏi biện luận, hợp làm luật sư, giáo viên, bán hàng. Cự Môn kỵ nhất Hóa Kỵ, chủ khẩu thiệt thị phi không dứt, thậm chí dẫn đến kiện tụng. Cự Môn ở Tý, Ngọ khá tốt, ăn nói giỏi, chủ lấy lời nói lập thân.',
    classical: 'Cổ quyết: «Cự Môn là ám diệu, chủ khẩu thiệt thị phi; Hóa Lộc, Hóa Quyền thì chuyển thành mưu sinh bằng tài ăn nói, chủ phú quý.» Nam Bắc Sơn Nhân chú: «Cự Môn thủ Mệnh, gặp Hóa Lộc, Hóa Quyền thì người làm nghề bằng miệng lưỡi đại cát; Hóa Kỵ thì khẩu thiệt liên lụy, kiện tụng vướng thân, cần cẩn trọng lời nói.»',
    bestPalace: 'Quan Lộc (Hóa Lộc, Hóa Quyền), Mệnh (Tý, Ngọ)',
    worstPalace: 'Phu Thê, Tật Ách (khi Hóa Kỵ)',
    career: 'Luật sư, giáo viên, bán hàng, người dẫn chương trình, chuyên gia đàm phán; tài ăn nói là năng lực cạnh tranh cốt lõi',
    relationship: 'Đa nghi đa lo, dễ nghĩ quá nhiều; giao tiếp là chìa khóa của hôn nhân, cần chọn bạn đời kiên nhẫn',
    wealth: 'Kiếm tiền nhờ tài ăn nói và kỹ năng chuyên môn; sau khi Hóa Lộc tài vận khá tốt, Hóa Kỵ thì phòng tranh chấp tài chính, khẩu thiệt liên lụy',
    health: 'Thuộc hành Thủy, chú ý thận, tai, khoang miệng. Lo nghĩ nhiều dễ hại thân, nên học cách thư giãn, giảm áp lực',
  },
  '天相': {
    niHaixia: 'Thầy Nghê nói Thiên Tướng là sao ấn thụ, phụ trách việc hành chính, sự vụ. Người Thiên Tướng tọa Mệnh khuôn phép đúng mực, hợp công chức hành chính. Thiên Tướng cần nhất có sao mạnh đi cùng mới phát huy được, một mình tọa Mệnh thì khá bình đạm. Thiên Tướng thích nhất có Liêm Trinh đi cùng, thành cách Liêm Tướng, có thể nắm đại quyền hành chính; sợ nhất Phá Quân đồng cung, thành cách "Hình Kỵ giáp Ấn", chủ hung hiểm.',
    classical: 'Cổ quyết: «Thiên Tướng là sao ấn thụ, chủ việc hành chính, sự vụ; Liêm Tướng đồng cung thì hóa hung thành cát, nắm đại quyền hành chính.» Nam Bắc Sơn Nhân chú: «Thiên Tướng thủ Mệnh, khuôn phép đúng mực, hợp công chức; được Liêm Trinh đi cùng có thể thành rường cột quốc gia; Phá Quân cùng thủ thì khó tránh hình khắc.»',
    bestPalace: 'Quan Lộc, Mệnh (đi cùng Liêm Trinh)',
    worstPalace: 'Tài Bạch, Mệnh (đi cùng Phá Quân thành Hình Kỵ giáp Ấn)',
    career: 'Công chức, quản lý hành chính, thư ký, trợ lý; giỏi vai trò hỗ trợ, cần có sao mạnh dẫn đường',
    relationship: 'Tình cảm ổn định, trung hậu thật thà, là người bạn đời tốt, nhưng cần đối phương định hướng',
    wealth: 'Tài vận bình ổn, tích lũy nhờ lương, không hợp đầu tư mạo hiểm; quản lý tiền kiểu giữ thành là hợp nhất',
    health: 'Thuộc hành Thủy, chú ý thận, hệ bạch huyết. Thể chất trung bình, nên giữ thói quen sinh hoạt điều độ',
  },
  '天梁': {
    niHaixia: 'Thầy Nghê cho rằng Thiên Lương là ấm tinh, có thể che chở người khác, cũng đại diện cho y dược, tôn giáo. Người Thiên Lương tọa Mệnh có duyên với bậc trưởng bối, thời trẻ nhiều gian truân, về già hưởng phúc. Thiên Lương sợ nhất Hóa Kỵ, ứng với trưởng bối hoặc sức khỏe có vấn đề. Thiên Lương đồng cung với Thái Dương là tốt nhất, nhật nguyệt tịnh minh, quý nhân che chở, một đời có quý nhân giúp đỡ, cuối cùng được bình an.',
    classical: 'Cổ quyết: «Thiên Lương là ấm tinh, chủ che chở bảo hộ; người tọa Mệnh có duyên với trưởng bối, thời trẻ chịu rèn luyện, về già hưởng thanh phúc.» Nam Bắc Sơn Nhân chú: «Thiên Lương thủ Mệnh, phải gặp cát tinh mới phát đạt; gặp Thái Dương đồng cung, nhật nguyệt tịnh minh, chủ quý hiển, một đời nhiều quý nhân giúp đỡ.»',
    bestPalace: 'Mệnh, Phụ Mẫu, Phúc Đức',
    worstPalace: 'Mệnh (khi Hóa Kỵ), Tài Bạch',
    career: 'Y tế, tôn giáo, pháp luật, công tác xã hội, từ thiện; thích giúp người, có lòng che chở mọi người',
    relationship: 'Tình cảm thường với người chênh lệch tuổi khá nhiều, hoặc duyên đến muộn; cần kiên nhẫn chờ đợi mới gặp lương duyên',
    wealth: 'Tài vận nhờ quý nhân giúp đỡ, thời trẻ tài vận không tốt, về già mới vững; nên giữ, không nên xông pha',
    health: 'Thuộc hành Thổ, chú ý tỳ vị, xương khớp. Cần chú trọng chăm sóc sức khỏe tuổi già, nên phòng ngừa, điều dưỡng sớm',
  },
  '七杀': {
    niHaixia: 'Thầy Nghê nói Thất Sát là sao tướng quân, quả quyết, xung lực mạnh, nhưng có tính cô khắc. Thất Sát tọa Mệnh phải có phụ tinh hóa giải tính cô độc, nếu không thì duyên lục thân mỏng. Thất Sát đồng cung với Vũ Khúc là cách tướng tài, rất tốt. Thất Sát sợ nhất "Trúc La tam hạn" (Dương, Đà, Hỏa, Linh cùng chiếu), chủ đại hung, phải phòng tai nạn. Thất Sát Hóa Lộc thì ngược lại thành cát, có thể thành bậc đại tướng.',
    classical: 'Cổ quyết: «Thất Sát là sao tướng quân, quả quyết, xung lực mạnh; người thủ Mệnh tính cô khắc nặng, duyên lục thân mỏng.» Nam Bắc Sơn Nhân chú: «Thất Sát thủ Mệnh, tam hợp hội cát thì đại quý; gặp Trúc La tam hạn (Dương, Đà, Hỏa, Linh) chủ đại hung, phòng tai nạn bất ngờ, phòng hình khắc.»',
    bestPalace: 'Mệnh (có phụ tinh), Quan Lộc',
    worstPalace: 'Phu Thê, Phụ Mẫu',
    career: 'Quân đội – cảnh sát, khởi nghiệp, giao dịch tài chính, lĩnh vực tự gánh vác một phương; cần quyết đoán nhanh và khí phách',
    relationship: 'Tình cảm cô khắc, khó tìm người hợp; cần đối phương bao dung được cá tính mạnh, nên kết hôn muộn',
    wealth: 'Tài vận dao động lớn, có cơ hội đại phú nhưng cũng lên xuống thất thường; đồng cung Vũ Khúc có thể thành cách tướng tài đại quý',
    health: 'Thuộc hành Kim, chú ý phổi, đại tràng. Tính nóng nảy dễ hại thân, nên học kiểm soát cảm xúc và tu dưỡng bản thân',
  },
  '破军': {
    niHaixia: 'Thầy Nghê nói Phá Quân là sao giỏi phá cũ lập mới nhất, cũng là một trong những sao cô khắc nhất. Phá Quân Hóa Lộc mới chuyển tốt, ứng với phá rồi mới lập. Phá Quân tọa Mệnh duyên lục thân mỏng, nhưng năng lực khai sáng rất mạnh. Phá Quân hợp nhất với cải cách, đổi mới; khi Hóa Lộc tài vận chuyển vượng, một phá một lập, cuối cùng thành tựu sự nghiệp.',
    classical: 'Cổ quyết: «Phá Quân là sao giỏi phá cũ lập mới nhất, người tọa Mệnh cô khắc, duyên lục thân mỏng, nhưng năng lực khai sáng vượt trội; Hóa Lộc thì phá rồi mới lập, có thể thành đại nghiệp.» Nam Bắc Sơn Nhân chú: «Phá Quân thủ Mệnh, một đời nhiều trắc trở; người Hóa Lộc thì sau khi hao tài mới gây dựng lại được, tài vận rốt cuộc chuyển tốt, chủ thành tựu lúc về già.»',
    bestPalace: 'Quan Lộc (khi Hóa Lộc), Thiên Di',
    worstPalace: 'Phu Thê, Phụ Mẫu',
    career: 'Sự nghiệp khai sáng, quân đội – cảnh sát, cải cách, quản trị thay đổi; hợp công việc tiên phong không ngừng mở lĩnh vực mới',
    relationship: 'Tình cảm nhiều trắc trở, hợp tan bất định, duyên lục thân mỏng; cần chọn bạn đời độc lập và bao dung',
    wealth: 'Tài vận lên xuống lớn, sau khi Hóa Lộc tài vận chuyển tốt; giữ thành thì tài lùi, cần không ngừng mở cục diện mới mới tích được của',
    health: 'Thuộc hành Thủy, chú ý thận, bàng quang, hệ sinh dục. Thể chất thất thường, nên giữ thói quen vận động đều đặn',
  },
};

/** Short notes for the six cát tinh / two lộc-mã stars and the six sát tinh (StarDetailPanel fallback). */
export const STAR_NOTES_VI: Record<string, string> = {
  '文昌': 'Văn Xương nhập cung, chủ học hành thi cử thuận lợi, có lợi về văn thư, ấn tín; nên làm công việc liên quan đến chữ nghĩa. Cổ quyết: «Văn Xương chủ khoa giáp, văn chương hiển đạt, thi ắt đỗ.»',
  '文曲': 'Văn Khúc nhập cung, chủ tài nghệ xuất chúng, ăn nói giỏi, giỏi diễn đạt, năng khiếu nghệ thuật mạnh. Cổ quyết: «Văn Khúc là sao tài nghệ, văn võ đều giỏi, ăn nói hơn người.»',
  '左辅': 'Tả Phù nhập cung, chủ quý nhân giúp đỡ, có người nâng đỡ; việc của cung này được ủng hộ thiện ý. Cổ quyết: «Tả Phù là sao trợ lực, tọa Mệnh thì nhiều quý nhân, gặp hung hóa cát.»',
  '右弼': 'Hữu Bật nhập cung, chủ quý nhân giúp đỡ, phần nhiều là quý nhân nữ; việc của cung này có người hỗ trợ. Cổ quyết: «Hữu Bật là sao âm trợ, nhiều quý nhân nữ, hóa hiểm thành an.»',
  '天魁': 'Thiên Khôi nhập cung, chủ quý nhân của người sinh ban ngày, phần nhiều là quý nhân nam, có sức gặp hung hóa cát. Cổ quyết: «Thiên Khôi là Thiên Ất quý nhân, gặp ắt có quý nhân phò trợ.»',
  '天钺': 'Thiên Việt nhập cung, chủ quý nhân của người sinh ban đêm, phần nhiều là quý nhân nữ, tăng thêm khí cát tường. Cổ quyết: «Thiên Việt là Ngọc Đường quý nhân, chủ âm trợ, nhiều quý nhân nữ.»',
  '禄存': 'Lộc Tồn nhập cung, chủ giữ tài lộc, cung này có tài khí nhưng thuộc kiểu tài vận bảo thủ. Cổ quyết: «Lộc Tồn là sao tài lộc, chủ giữ của có thừa, tiến tài vững chắc.»',
  '天马': 'Thiên Mã nhập cung, chủ bôn ba biến động, cầu tài trong vận động; nên chủ động hành động, không nên ôm cây đợi thỏ. Cổ quyết: «Thiên Mã chủ động, gặp Lộc thì tài lộc song toàn, sinh tài trong vận động.»',
  '地空': 'Địa Không nhập cung, chủ việc của cung này có cảm giác hụt hẫng, tinh thần hao tán; nên chú ý sức khỏe tâm lý. Cổ quyết: «Địa Không chủ hư hao, nhập Mệnh phần nhiều tinh thần mơ hồ, phải đề phòng mơ tưởng viển vông.»',
  '地劫': 'Địa Kiếp nhập cung, chủ việc của cung này có tổn thất bất ngờ, tiền của cần thận trọng, phòng tiểu nhân. Cổ quyết: «Địa Kiếp chủ kiếp tài, nhập Mệnh thì tài vận bị tổn, phòng mất mát bất ngờ.»',
  '火星': 'Hỏa Tinh nhập cung, chủ việc của cung này nóng vội xung động, cảm xúc dao động; nhưng nếu gặp Tham Lang thì lại thành cát. Cổ quyết: «Hỏa Tinh chủ nóng nảy, nhưng gặp Tham Lang đồng cung thì thành cách Hỏa Tham, chủ bạo phát.»',
  '铃星': 'Linh Tinh nhập cung, chủ việc của cung này có trở ngại ngầm, phòng tiểu nhân sau lưng, mọi việc nên kín đáo. Cổ quyết: «Linh Tinh chủ ám sát (sát khí ngầm), nhập Mệnh phần nhiều bị địch ngầm, phải phòng thị phi sau lưng.»',
  '擎羊': 'Kình Dương nhập cung, chủ hình khắc, việc của cung này nhiều trắc trở, có tai họa huyết quang hoặc tai nạn. Cổ quyết: «Kình Dương là sao hình khắc, nhập Mệnh phần nhiều hình khắc, phải phòng tai nạn huyết quang.»',
  '陀罗': 'Đà La nhập cung, chủ thị phi vướng thân, việc của cung này dây dưa không quyết, mọi việc nên chuẩn bị sớm. Cổ quyết: «Đà La chủ thị phi trì hoãn, nhập Mệnh làm việc chậm chạp, phải phòng dây dưa không dứt.»',
};
