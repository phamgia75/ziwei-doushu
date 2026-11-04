/**
 * Deterministic verification of astrological claims in generated Vietnamese text.
 *
 * Every recognised claim about the CALCULATED chart is checked against the engine output:
 *   placement   "Tử Vi tọa tại cung Quan Lộc", "Vũ Khúc ở Tuất"
 *   palace-at   "cung Quan Lộc tại Dần"
 *   tamhop      "Mệnh, Tài Bạch, Quan Lộc tam hợp"            (branches differ by 4/8)
 *   xung        "Phu Thê xung chiếu / đối cung Quan Lộc"        (branches differ by 6)
 *   chieu       "Thất Sát (xung|hội) chiếu cung Mệnh"           (star sits in the target's Tam Phương)
 *   giap        "Tả Phù, Hữu Bật giáp cung Mệnh"                (stars in the two neighbouring palaces)
 *   sihua-star  "Vũ Khúc Hóa Lộc"                              (natal / Đại Hạn / Lưu Niên / Tự Hóa by context)
 *   sihua-in    "Hóa Kỵ nhập cung Tử Nữ"                        (the transformed star sits there)
 * Statuses: verified | contradicted | unverified (a relationship sentence we recognise but cannot
 * decide — it is reported, never silently treated as fact). General doctrine and hypotheticals
 * ("nếu…", "theo cổ thư…") are not claims about this chart and are skipped.
 */
import type { ZiweiChart } from '@/lib/ziwei/types';
import { term, BRANCHES_VI } from '@/lib/i18n/terms';
import { getDaXianSiHua, getLiuNianSiHua } from '@/lib/ziwei/sihua';

export type ClaimKind = 'placement' | 'brightness' | 'menh-chu' | 'than-cu' | 'palace-at' | 'tamhop' | 'xung' | 'chieu' | 'giap' | 'sihua-star' | 'sihua-in' | 'relation';
export type ClaimStatus = 'verified' | 'contradicted' | 'unverified';
export interface Claim { kind: ClaimKind; status: ClaimStatus; sentence: string; detail: string; person?: 'A' | 'B' }

const SIHUA_VI: Record<string, string> = { 'Lộc': '禄', 'Quyền': '权', 'Khoa': '科', 'Kỵ': '忌', 'Kị': '忌' };
const L = '\\p{L}';
const word = (alts: string[]) => `(?<!${L})(${alts.map(esc).join('|')})(?!${L})`;
function esc(s: string) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

const HYPOTHETICAL = /(?<!\p{L})(nếu|giả sử|giả như|trường hợp|khi gặp|thường thì|nói chung|theo cổ thư|cổ thư|cổ nhân|người xưa|sách xưa|phú rằng|ví dụ)(?!\p{L})/iu;
const LOCATIVE = /(?<!\p{L})(tại|ở|tọa|toạ|cư|đóng|thủ|nằm)(?!\p{L})/iu;
const REL_WORDS = /(?<!\p{L})(tam hợp|xung chiếu|xung|đối cung|đối diện|hội chiếu|chiếu|hội|giáp|nhập|Hóa (?:Lộc|Quyền|Khoa|Kỵ|Kị))(?!\p{L})/iu;

interface Model {
  label?: 'A' | 'B';
  year: number;
  starBranch: Map<string, number>;            // vi star → branch
  starBright: Map<string, string>;            // vi star → vi brightness word
  mingZhu: string; shenZhu: string; shenPalace: string;
  palaceBranch: Map<string, number>;          // vi palace (lower-case) → branch
  palaceByBranch: Map<number, string>;
  natal: Map<string, string>;                 // vi sihua word ('Lộc') → vi star
  daxian: Map<string, Set<string>>;           // sihua word → stars (any Đại Hạn; current first)
  daxianCurrent: Map<string, string>;
  daxianByAge: Map<number, Map<string, string>>; // Đại Hạn startAge → sihua word → star
  liunian: Map<string, string>;
  self: Map<string, Set<string>>;             // sihua word → stars with Tự Hóa
  starRe: RegExp; palaceRe: RegExp;
}

function buildModel(chart: ZiweiChart, year: number, label?: 'A' | 'B'): Model {
  const starBright = new Map<string, string>();
  const starBranch = new Map<string, number>(), palaceBranch = new Map<string, number>(), palaceByBranch = new Map<number, string>();
  const natal = new Map<string, string>(), self = new Map<string, Set<string>>();
  const zh2vi = (h: string) => Object.entries(SIHUA_VI).find(([, z]) => z === h)![0];
  for (const p of chart.palaces) {
    const pv = term(p.name);
    palaceBranch.set(pv.toLowerCase(), p.branch); palaceByBranch.set(p.branch, pv);
    for (const s of p.stars) { starBranch.set(term(s.name), p.branch); if (s.brightnessRaw) starBright.set(term(s.name), term(s.brightnessRaw)); if (s.siHua) natal.set(zh2vi(s.siHua), term(s.name)); }
    for (const x of p.selfSihua ?? []) { const k = zh2vi(x.siHua); (self.get(k) ?? self.set(k, new Set()).get(k)!).add(term(x.starName)); }
  }
  const daxian = new Map<string, Set<string>>(), daxianCurrent = new Map<string, string>(), liunian = new Map<string, string>();
  const daxianByAge = new Map<number, Map<string, string>>();
  chart.daXians.forEach((_, i) => {
    const sh = getDaXianSiHua(chart, i); if (!sh) return;
    const byHua = new Map<string, string>();
    daxianByAge.set(chart.daXians[i].startAge, byHua);
    for (const [h, star] of Object.entries(sh.transforms)) {
      const k = zh2vi(h); byHua.set(k, term(star)); (daxian.get(k) ?? daxian.set(k, new Set()).get(k)!).add(term(star));
      if (i === chart.currentDaXianIndex) daxianCurrent.set(k, term(star));
    }
  });
  for (const [h, star] of Object.entries(getLiuNianSiHua(year).transforms)) liunian.set(zh2vi(h), term(star));
  const stars = [...starBranch.keys()].sort((a, b) => b.length - a.length);
  const palaces = [...new Set(chart.palaces.map(p => term(p.name)))];
  return {
    label, year, daxianByAge, starBranch, starBright, mingZhu: term(chart.mingZhu), shenZhu: term(chart.shenZhu),
    shenPalace: term(chart.palaces.find(p => p.branch === chart.shenGongBranch)?.name), palaceBranch, palaceByBranch, natal, daxian, daxianCurrent, liunian, self,
    starRe: new RegExp(`${word(stars)}(?! Đẩu)`, 'gu'),
    // "cung X" always; bare multi-word palace names too (bare "Mệnh"/"Thân" are too ambiguous)
    palaceRe: new RegExp(`(?:(?<!${L})cung\\s+${word(palaces)})|${word(palaces.filter(p => p.includes(' ')))}|(?<!(?:Thân|Lưu Niên|lưu niên|Bản|bản)\\s)(?<!${L})(Mệnh)(?!\\s+(?:[Cc]hủ|lưu niên|Lưu Niên|cục|Cục))(?!${L})`, 'gu'),
  };
}

interface Mention { name: string; index: number }
const mentions = (re: RegExp, s: string): Mention[] => [...s.matchAll(re)].map(m => ({ name: (m[1] ?? m[2] ?? m[3]), index: m.index! }));
const BRIGHT_VI = ['Miếu', 'Vượng', 'Đắc', 'Lợi', 'Bình', 'Bất', 'Nhàn', 'Hãm', 'Địa'];
const uniq = <T>(a: T[]) => [...new Set(a)];
const d12 = (a: number, b: number) => ((b - a) % 12 + 12) % 12;

type SihuaScope = { kind: 'natal' | 'self' | 'liunian' | 'daxian-current' | 'daxian-at' | 'daxian-any'; label: string; map?: Map<string, string> };

const ZH2VI: Record<string, string> = { '禄': 'Lộc', '权': 'Quyền', '科': 'Khoa', '忌': 'Kỵ' };

/** Which set of transformations a sentence talks about. Explicit years / decades are honoured. */
function sihuaScope(m: Model, s: string): SihuaScope {
  if (/tự hóa|tự hoá/iu.test(s)) return { kind: 'self', label: 'Tự Hóa' };
  const yr = s.match(/năm\s+(\d{4})/iu);
  if (yr || /lưu niên|năm nay/iu.test(s)) {
    const y = yr ? Number(yr[1]) : m.year;
    const map = new Map(Object.entries(getLiuNianSiHua(y).transforms).map(([h, st]) => [ZH2VI[h], term(st)]));
    return { kind: 'liunian', label: `Lưu Niên ${y}`, map };
  }
  if (/đại hạn|đại vận/iu.test(s)) {
    const ages = s.match(/(\d{1,3})\s*[–-]\s*(\d{1,3})/u);
    if (ages && m.daxianByAge.has(Number(ages[1]))) return { kind: 'daxian-at', label: `Đại Hạn ${ages[1]}–${ages[2]}`, map: m.daxianByAge.get(Number(ages[1])) };
    if (/hiện tại|này|đang|hiện nay/iu.test(s)) return { kind: 'daxian-current', label: 'Đại Hạn hiện tại', map: m.daxianCurrent };
    return { kind: 'daxian-any', label: 'Đại Hạn (không rõ đại hạn nào)', map: m.daxianCurrent };
  }
  return { kind: 'natal', label: 'năm sinh', map: m.natal };
}

function checkSihuaStar(m: Model, star: string, hua: string, sc: SihuaScope): [ClaimStatus, string] {
  const inScope = sc.kind === 'self' ? !!m.self.get(hua)?.has(star) : sc.map?.get(hua) === star;
  if (inScope) return ['verified', `${star} Hóa ${hua} (${sc.label})`];
  const elsewhere = [m.natal.get(hua) === star && 'năm sinh', m.daxian.get(hua)?.has(star) && 'một Đại Hạn', m.liunian.get(hua) === star && `Lưu Niên ${m.year}`, m.self.get(hua)?.has(star) && 'Tự Hóa'].filter(Boolean);
  // only an implicit context (natal by default, or "Đại Hạn" without saying which) is ambiguous
  if ((sc.kind === 'natal' || sc.kind === 'daxian-any') && elsewhere.length) return ['unverified', `${star} Hóa ${hua} không thuộc ${sc.label} nhưng có ở: ${elsewhere.join(', ')}`];
  const actual = sc.map?.get(hua);
  return ['contradicted', `${star} không Hóa ${hua} trong ${sc.label}${actual ? `; Hóa ${hua} ${sc.label} là ${actual}` : ''}`];
}

function clauseClaims(m: Model, raw: string, subject?: string): Claim[] {
  const s = raw.replace(/\*\*|__|`/g, '').replace(/\[\[?[FS]\d+\]?\]/g, '').trim();
  if (!s || HYPOTHETICAL.test(s)) return [];
  const out: Claim[] = [];
  const push = (kind: ClaimKind, status: ClaimStatus, detail: string) => out.push({ kind, status, detail, sentence: raw.replace(/\*\*/g, '').trim().slice(0, 220), person: m.label });
  let s2 = s;
  // brightness annotations: "Tham Lang [Hãm]", "Tham Lang (Miếu)", "Tham Lang miếu địa"
  for (const mm of s.matchAll(new RegExp(`${m.starRe.source}\\s*(?:\\[|\\()?\\s*(${BRIGHT_VI.join('|')})(?:\\s*địa)?\\s*(?:\\]|\\))?(?!${L})`, 'giu'))) {
    const want = mm[2][0].toUpperCase() + mm[2].slice(1).toLowerCase();
    const have = m.starBright.get(mm[1]);
    if (have) push('brightness', have === want ? 'verified' : 'contradicted', `${mm[1]} độ sáng ${have}${have === want ? '' : `, không phải ${want}`}`);
  }
  s2 = s2.replace(/\[(?:Miếu|Vượng|Đắc|Lợi|Bình|Bất|Nhàn|Hãm|Địa)\]/giu, '');
  // Mệnh Chủ / Thân Chủ / Thân cư
  for (const mm of s2.matchAll(new RegExp(`(Mệnh|Thân) [Cc]hủ(?: là)?\\s+${m.starRe.source}`, 'gu'))) {
    const want = mm[1] === 'Mệnh' ? m.mingZhu : m.shenZhu;
    push('menh-chu', mm[2] === want ? 'verified' : 'contradicted', `${mm[1]} Chủ là ${want}${mm[2] === want ? '' : `, không phải ${mm[2]}`}`);
  }
  s2 = s2.replace(new RegExp(`(Mệnh|Thân) [Cc]hủ(?: là)?\\s+${m.starRe.source}`, 'gu'), ' ');
  for (const mm of s2.matchAll(new RegExp(`Thân cư\\s+(?:cung\\s+)?${word([...m.palaceByBranch.values()])}`, 'giu'))) {
    const ok = mm[1].toLowerCase() === m.shenPalace.toLowerCase();
    push('than-cu', ok ? 'verified' : 'contradicted', `Thân cư cung ${m.shenPalace}${ok ? '' : `, không phải ${mm[1]}`}`);
  }
  s2 = s2.replace(/Thân cư\s+(?:cung\s+)?[\p{L} ]+?(?=[,;.]|$)/u, ' ');
  // "Palace (Star, Star)" annotations → placements; other parentheticals → parsed on their own
  for (const mm of s2.matchAll(/\(([^()]*)\)/gu)) {
    const inner = mm[1];
    const innerStars = mentions(m.starRe, inner).map(x => x.name);
    const before = s2.slice(0, mm.index!);
    const pm = mentions(m.palaceRe, before).pop();
    const pk = pm && [...m.palaceBranch.keys()].find(k => k === pm.name.toLowerCase());
    if (innerStars.length && pk && before.slice(pm.index).length < 24) {
      for (const n of innerStars) {
        const ok = m.starBranch.get(n) === m.palaceBranch.get(pk);
        push('placement', ok ? 'verified' : 'contradicted', `${n} ${ok ? 'ở' : `ở cung ${m.palaceByBranch.get(m.starBranch.get(n)!)}, không ở`} cung ${m.palaceByBranch.get(m.palaceBranch.get(pk)!)}`);
      }
    } else if (innerStars.length) out.push(...clauseClaims(m, inner, undefined));
  }
  s2 = s2.replace(/\([^()]*\)/gu, ' ');
  return [...out, ...clauseClaimsCore(m, s2, raw, subject)];
}

function clauseClaimsCore(m: Model, s: string, raw: string, subject?: string): Claim[] {
  const out: Claim[] = [];
  const push = (kind: ClaimKind, status: ClaimStatus, detail: string) => out.push({ kind, status, detail, sentence: raw.replace(/\*\*/g, '').trim().slice(0, 220), person: m.label });
  const stars = mentions(m.starRe, s);
  const palaces = mentions(m.palaceRe, s).map(x => ({ ...x, name: [...m.palaceBranch.keys()].find(k => k === x.name.toLowerCase())! })).filter(x => x.name);
  const pB = (n: string) => m.palaceBranch.get(n)!;
  const pName = (n: string) => m.palaceByBranch.get(pB(n))!;
  // a clause that starts with the relation ("Tam hợp với …") inherits the previous clause's subject palace
  if (subject && /^\s*(tam hợp|đối cung|xung chiếu|xung)/iu.test(s) && !palaces.some(p => p.name === subject)) palaces.unshift({ name: subject, index: -1 });
  const starNames = uniq(stars.map(x => x.name)), palaceNames = uniq(palaces.map(x => x.name));
  let handled = false;

  // Tứ Hóa: "<Star> Hóa X"
  for (const mm of s.matchAll(new RegExp(`${m.starRe.source}\\s+(?:hóa|hoá)\\s+(Lộc|Quyền|Khoa|Kỵ|Kị)(?!${L})`, 'giu'))) {
    const [st, d] = checkSihuaStar(m, mm[1], mm[2] === 'Kị' ? 'Kỵ' : mm[2], sihuaScope(m, s));
    push('sihua-star', st, d); handled = true;
  }
  // "Hóa X nhập/vào/tại cung P" (the transformed star must sit in P)
  for (const mm of s.matchAll(new RegExp(`(?:hóa|hoá)\\s+(Lộc|Quyền|Khoa|Kỵ|Kị)(?!${L})[^.;]{0,25}?(?:nhập|vào|tại|ở|rơi vào|đóng|→)\\s*(?:cung\\s+)?${word([...m.palaceByBranch.values()])}`, 'giu'))) {
    const hua = mm[1] === 'Kị' ? 'Kỵ' : mm[1];
    const sc = sihuaScope(m, s);
    const star = sc.kind === 'self' ? undefined : sc.map?.get(hua);
    const target = [...m.palaceBranch.keys()].find(k => k === mm[2].toLowerCase())!;
    if (!star) push('sihua-in', 'unverified', `không xác định được sao Hóa ${hua} trong bối cảnh này`);
    else if (m.starBranch.get(star) === pB(target)) push('sihua-in', 'verified', `Hóa ${hua} (${star}) ở cung ${pName(target)}`);
    else if (sc.kind === 'daxian-any') push('sihua-in', 'unverified', `Hóa ${hua} Đại Hạn phụ thuộc Đại Hạn nào; Đại Hạn hiện tại: ${star} ở cung ${m.palaceByBranch.get(m.starBranch.get(star)!)}`);
    else push('sihua-in', 'contradicted', `Hóa ${hua} là ${star}, nằm ở cung ${m.palaceByBranch.get(m.starBranch.get(star)!)}, không phải cung ${pName(target)}`);
    handled = true;
  }

  const rel = s.match(REL_WORDS)?.[1]?.toLowerCase();
  // palace ↔ palace relations
  if (rel && palaceNames.length >= 2 && /tam hợp|xung|đối cung|đối diện/.test(rel) && !stars.length) {
    const bs = palaceNames.map(pB);
    const okTam = bs.every((b, i) => bs.every((c, j) => i === j || [4, 8].includes(d12(b, c))));
    const okXung = bs.length === 2 && d12(bs[0], bs[1]) === 6;
    const isTam = rel === 'tam hợp';
    push(isTam ? 'tamhop' : 'xung', (isTam ? okTam : okXung) ? 'verified' : 'contradicted',
      `${palaceNames.map(pName).join(', ')}: ${isTam ? (okTam ? 'tam hợp' : 'không tam hợp') : (okXung ? 'đối cung' : 'không đối cung')}`);
    return out;
  }
  // star → palace relations (chiếu / hội / xung / giáp)
  if (rel && /chiếu|hội|xung|giáp|đối cung|tam hợp/.test(rel) && starNames.length && palaceNames.length >= 1) {
    const relIdx = s.toLowerCase().indexOf(rel);
    // target = the palace mentioned after the relation word (else the only palace)
    const target = (palaces.find(p => p.index > relIdx) ?? (palaceNames.length === 1 ? palaces[0] : undefined))?.name;
    if (!target) { push('relation', 'unverified', 'không xác định được cung đích'); return out; }
    const t = pB(target);
    const relStars = stars.filter(x => x.index < relIdx || rel === 'giáp').map(x => x.name);
    const subjects = uniq(relStars.length ? relStars : starNames);
    if (rel === 'giáp') {
      const sides = subjects.map(n => d12(t, m.starBranch.get(n)!));
      const ok = sides.every(x => x === 1 || x === 11) && (subjects.length < 2 || new Set(sides).size === 2);
      push('giap', ok ? 'verified' : 'contradicted', `${subjects.join(', ')} ${ok ? 'giáp' : 'không giáp'} cung ${pName(target)}`);
    } else {
      const xung = /xung|đối cung/.test(rel);
      for (const n of subjects) {
        const dd = d12(t, m.starBranch.get(n)!);
        const ok = xung ? dd === 6 : rel === 'tam hợp' ? [4, 8].includes(dd) : rel === 'hội' ? [0, 4, 6, 8].includes(dd) : [4, 6, 8].includes(dd);
        push(xung ? 'xung' : 'chieu', ok ? 'verified' : 'contradicted',
          `${n} ở cung ${m.palaceByBranch.get(m.starBranch.get(n)!)} → ${ok ? '' : 'không '}${xung ? 'xung chiếu' : rel} cung ${pName(target)}`);
      }
    }
    // also check an explicit placement of the subject before the relation ("Thất Sát ở cung Phu Thê chiếu …")
    const before = s.slice(0, relIdx);
    const pBefore = palaces.filter(p => p.index < relIdx);
    if (LOCATIVE.test(before) && pBefore.length === 1) for (const n of subjects) {
      const ok = m.starBranch.get(n) === pB(pBefore[0].name);
      push('placement', ok ? 'verified' : 'contradicted', `${n} ${ok ? 'ở' : 'không ở'} cung ${pName(pBefore[0].name)}`);
    }
    return out;
  }
  // palace at branch: "cung Quan Lộc tại Dần"
  for (const mm of s.matchAll(new RegExp(`cung\\s+${word([...m.palaceByBranch.values()])}\\s*(?:\\(|tại|ở|nằm ở)\\s*${word(BRANCHES_VI)}`, 'giu'))) {
    const pk = [...m.palaceBranch.keys()].find(k => k === mm[1].toLowerCase())!;
    const ok = BRANCHES_VI[pB(pk)] === mm[2];
    push('palace-at', ok ? 'verified' : 'contradicted', `cung ${pName(pk)} ${ok ? 'tại' : 'không tại'} ${mm[2]} (thực tế: ${BRANCHES_VI[pB(pk)]})`); handled = true;
  }
  // placement: one palace (or a branch), 1–3 stars, locative verb
  if (LOCATIVE.test(s) || /(?<!\p{L})có(?!\p{L})/u.test(s)) {
    const branchHit = s.match(new RegExp(`(?:tại|ở|tọa|toạ thủ tại|cư)\\s+${word(BRANCHES_VI)}`, 'u'));
    if (palaceNames.length === 1 && starNames.length >= 1 && starNames.length <= 3) {
      for (const n of starNames) {
        const ok = m.starBranch.get(n) === pB(palaceNames[0]);
        push('placement', ok ? 'verified' : 'contradicted', `${n} ${ok ? 'ở' : `ở cung ${m.palaceByBranch.get(m.starBranch.get(n)!)}, không ở`} cung ${pName(palaceNames[0])}`);
      }
      handled = true;
    } else if (!palaceNames.length && branchHit && starNames.length === 1) {
      const ok = BRANCHES_VI[m.starBranch.get(starNames[0])!] === branchHit[1];
      push('placement', ok ? 'verified' : 'contradicted', `${starNames[0]} ${ok ? 'tại' : 'không tại'} ${branchHit[1]}`); handled = true;
    }
  }
  // recognised relationship language we could not decide → reported as unverified
  if (!handled && rel && (starNames.length || palaceNames.length) && !out.length) push('relation', 'unverified', `quan hệ "${rel}" chưa kiểm chứng tự động`);
  return out;
}

/** Split into clauses; for two charts, attribute each clause to Người A/B (the last person mentioned in the paragraph). */
export function verifyClaims(text: string, charts: { chart: ZiweiChart; label?: 'A' | 'B' }[], year = new Date().getFullYear()): Claim[] {
  const models = charts.map(c => buildModel(c.chart, year, c.label));
  const claims: Claim[] = [];
  let person: 'A' | 'B' | undefined;
  for (const para of text.split(/\n{2,}|\n(?=#|\*\*)/)) {
    person = undefined;
    for (const line of para.split('\n')) {
      let subject: string | undefined;
      for (const clause of line.split(/(?<=[.!?;])\s+|(?<=:)\s+(?=\p{Lu})/u)) {
        if (models.length === 1) {
          claims.push(...clauseClaims(models[0], clause, subject));
          const first = mentions(models[0].palaceRe, clause.replace(/\([^()]*\)/g, ''))[0];
          if (first) subject = first.name.toLowerCase();
          continue;
        }
        // split a clause that names both people at each "Người A/B"
        const parts = clause.split(/(?=Người [AB](?![\p{L}]))/u);
        for (const part of parts) {
          const who = part.match(/Người ([AB])(?![\p{L}])/u)?.[1] as 'A' | 'B' | undefined;
          if (who) person = who;
          const m = models.find(x => x.label === person);
          if (m) claims.push(...clauseClaims(m, part));
          else if (REL_WORDS.test(part) && !HYPOTHETICAL.test(part) && (models[0].starRe.test(part) || models[0].palaceRe.test(part))) {
            models[0].starRe.lastIndex = 0; models[0].palaceRe.lastIndex = 0;
            claims.push({ kind: 'relation', status: 'unverified', sentence: part.slice(0, 220), detail: 'không rõ nhận định thuộc Người A hay Người B' });
          }
        }
      }
    }
  }
  return claims;
}
