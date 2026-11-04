/**
 * Vietnam's 63 provinces / centrally-run cities (pre-2025 names, as on birth records),
 * each with its capital (plus a few extra cities). Coordinates: city centre, 2 decimals.
 * Hà Nội and TP. Hồ Chí Minh first, the rest in Vietnamese alphabetical order.
 */
import type { CityInfo, ProvinceInfo } from '@/lib/ziwei/cities';

export type VnCity = CityInfo & { lat: number };
export type VnProvince = Omit<ProvinceInfo, 'cities'> & { cities: VnCity[] };

const p = (name: string, ...cities: [string, number, number][]): VnProvince =>
  ({ name, cities: cities.map(([n, longitude, lat]) => ({ name: n, longitude, lat })) });

export const VN_PROVINCES: VnProvince[] = [
  p('Hà Nội', ['Hà Nội', 105.85, 21.03], ['Sơn Tây', 105.50, 21.14]),
  p('TP. Hồ Chí Minh', ['TP. Hồ Chí Minh', 106.70, 10.78]),
  p('An Giang', ['Long Xuyên', 105.44, 10.39], ['Châu Đốc', 105.12, 10.70]),
  p('Bà Rịa – Vũng Tàu', ['Bà Rịa', 107.17, 10.50], ['Vũng Tàu', 107.08, 10.35]),
  p('Bạc Liêu', ['Bạc Liêu', 105.72, 9.29]),
  p('Bắc Giang', ['Bắc Giang', 106.19, 21.27]),
  p('Bắc Kạn', ['Bắc Kạn', 105.83, 22.15]),
  p('Bắc Ninh', ['Bắc Ninh', 106.06, 21.18]),
  p('Bến Tre', ['Bến Tre', 106.38, 10.24]),
  p('Bình Dương', ['Thủ Dầu Một', 106.65, 10.98]),
  p('Bình Định', ['Quy Nhơn', 109.22, 13.78]),
  p('Bình Phước', ['Đồng Xoài', 106.90, 11.54]),
  p('Bình Thuận', ['Phan Thiết', 108.10, 10.93]),
  p('Cà Mau', ['Cà Mau', 105.15, 9.18]),
  p('Cao Bằng', ['Cao Bằng', 106.25, 22.67]),
  p('Cần Thơ', ['Cần Thơ', 105.78, 10.03]),
  p('Đà Nẵng', ['Đà Nẵng', 108.22, 16.05]),
  p('Đắk Lắk', ['Buôn Ma Thuột', 108.04, 12.67]),
  p('Đắk Nông', ['Gia Nghĩa', 107.69, 12.00]),
  p('Điện Biên', ['Điện Biên Phủ', 103.02, 21.39]),
  p('Đồng Nai', ['Biên Hòa', 106.82, 10.95]),
  p('Đồng Tháp', ['Cao Lãnh', 105.63, 10.46], ['Sa Đéc', 105.76, 10.29]),
  p('Gia Lai', ['Pleiku', 108.00, 13.98]),
  p('Hà Giang', ['Hà Giang', 104.98, 22.82]),
  p('Hà Nam', ['Phủ Lý', 105.92, 20.54]),
  p('Hà Tĩnh', ['Hà Tĩnh', 105.90, 18.34]),
  p('Hải Dương', ['Hải Dương', 106.33, 20.94]),
  p('Hải Phòng', ['Hải Phòng', 106.68, 20.86]),
  p('Hậu Giang', ['Vị Thanh', 105.47, 9.78]),
  p('Hòa Bình', ['Hòa Bình', 105.34, 20.82]),
  p('Hưng Yên', ['Hưng Yên', 106.05, 20.65]),
  p('Khánh Hòa', ['Nha Trang', 109.19, 12.24], ['Cam Ranh', 109.16, 11.92]),
  p('Kiên Giang', ['Rạch Giá', 105.08, 10.01], ['Phú Quốc', 103.96, 10.23]),
  p('Kon Tum', ['Kon Tum', 108.00, 14.35]),
  p('Lai Châu', ['Lai Châu', 103.46, 22.40]),
  p('Lạng Sơn', ['Lạng Sơn', 106.76, 21.85]),
  p('Lào Cai', ['Lào Cai', 103.97, 22.48], ['Sa Pa', 103.84, 22.34]),
  p('Lâm Đồng', ['Đà Lạt', 108.44, 11.94], ['Bảo Lộc', 107.81, 11.55]),
  p('Long An', ['Tân An', 106.41, 10.54]),
  p('Nam Định', ['Nam Định', 106.17, 20.42]),
  p('Nghệ An', ['Vinh', 105.68, 18.67]),
  p('Ninh Bình', ['Ninh Bình', 105.97, 20.25]),
  p('Ninh Thuận', ['Phan Rang – Tháp Chàm', 108.99, 11.57]),
  p('Phú Thọ', ['Việt Trì', 105.40, 21.32]),
  p('Phú Yên', ['Tuy Hòa', 109.30, 13.09]),
  p('Quảng Bình', ['Đồng Hới', 106.62, 17.47]),
  p('Quảng Nam', ['Tam Kỳ', 108.47, 15.57], ['Hội An', 108.33, 15.88]),
  p('Quảng Ngãi', ['Quảng Ngãi', 108.80, 15.12]),
  p('Quảng Ninh', ['Hạ Long', 107.08, 20.95], ['Móng Cái', 107.97, 21.52]),
  // Vĩnh Linh lies north of the 17th parallel (North Vietnam 1954–1975); Đông Hà south of it.
  p('Quảng Trị', ['Đông Hà', 107.10, 16.82], ['Quảng Trị', 107.19, 16.75], ['Vĩnh Linh', 107.03, 17.03]),
  p('Sóc Trăng', ['Sóc Trăng', 105.97, 9.60]),
  p('Sơn La', ['Sơn La', 103.91, 21.33]),
  p('Tây Ninh', ['Tây Ninh', 106.10, 11.31]),
  p('Thái Bình', ['Thái Bình', 106.34, 20.45]),
  p('Thái Nguyên', ['Thái Nguyên', 105.84, 21.59]),
  p('Thanh Hóa', ['Thanh Hóa', 105.78, 19.81]),
  p('Thừa Thiên Huế', ['Huế', 107.59, 16.46]),
  p('Tiền Giang', ['Mỹ Tho', 106.36, 10.36]),
  p('Trà Vinh', ['Trà Vinh', 106.34, 9.93]),
  p('Tuyên Quang', ['Tuyên Quang', 105.21, 21.82]),
  p('Vĩnh Long', ['Vĩnh Long', 105.97, 10.25]),
  p('Vĩnh Phúc', ['Vĩnh Yên', 105.60, 21.31]),
  p('Yên Bái', ['Yên Bái', 104.87, 21.72]),
];

/** City by province + city name; falls back to the province's first city. */
export function findVnCity(province: string, city: string): VnCity | undefined {
  const prov = VN_PROVINCES.find(x => x.name === province);
  return prov?.cities.find(c => c.name === city) ?? prov?.cities[0];
}
