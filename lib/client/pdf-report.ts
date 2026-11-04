/**
 * Native PDF report, built entirely in the browser (birth data never leaves the machine).
 * pdf-lib + fontkit with an embedded, subsetted Vietnamese TTF (Be Vietnam Pro, OFL — public/fonts).
 * Pure: same input → same document; fonts are injected as bytes so Node tests can pass them.
 * Any character the font lacks (e.g. Chinese engine identifiers) is dropped, never drawn as tofu.
 */
import { PDFDocument, rgb, type PDFFont, type PDFPage, type RGB } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import type { BirthFormState } from '@/components/BirthForm';
import type { BirthInfo, Palace, Star, ZiweiChart } from '@/lib/ziwei/types';
import type { Settings } from '@/lib/client/storage';
import type { ReportEntry } from '@/lib/client/report-store';
import type { PatternVi } from '@/lib/i18n/vi/patterns';
import { term, stemBranchVi, BRANCHES_VI } from '@/lib/i18n/terms';
import { SIHUA_SHORT, BRIGHTNESS_SHORT, BRIGHTNESS_LEGEND } from '@/lib/i18n/vi/chart';
import { app } from '@/lib/i18n/vi/app';
import { common } from '@/lib/i18n/vi/common';
import { pdf as T } from '@/lib/i18n/vi/pdf';
import type { LunarDate } from '@/lib/calendar/vn-lunar';
import { applyCalendar, vnCalendarDiff } from '@/lib/calendar/vn-chart';
import { vnRegion } from '@/lib/geo/vn-places';
import { equationOfTimeMinutes } from '@/lib/ziwei/true-solar-time';

export interface ReportFonts { regular: Uint8Array; bold: Uint8Array }
export interface ReportInput {
  chart: ZiweiChart;
  /** Form as entered (original clock time, birthplace, UTC offset). */
  form?: BirthFormState | null;
  /** Birth info after the Tý rule, before any calendar remap (the page's baseInfo). */
  birth?: BirthInfo | null;
  settings: Pick<Settings, 'lateZishi' | 'leapMonth' | 'brightness' | 'calendar' | 'equationOfTime'>;
  facts?: { id: string; text: string }[] | null;
  patterns?: PatternVi[] | null;
  entries?: ReportEntry[];
  fonts: ReportFonts;
  generatedAt?: Date;
}

/** Browser font loader (static files under public/fonts). */
export async function fetchReportFonts(base = '/fonts'): Promise<ReportFonts> {
  const get = async (f: string) => {
    const r = await fetch(`${base}/${f}`);
    if (!r.ok) throw new Error(T.fontError);
    return new Uint8Array(await r.arrayBuffer());
  };
  const [regular, bold] = await Promise.all([get('BeVietnamPro-Regular.ttf'), get('BeVietnamPro-Bold.ttf')]);
  return { regular, bold };
}

// ── layout constants (A4, points) ──
const PW = 595.28, PH = 841.89, ML = 48, MR = 48, MT = 56, MB = 64, CW = PW - ML - MR;
const INK = rgb(0.11, 0.11, 0.14), MUTED = rgb(0.42, 0.42, 0.46), GOLD = rgb(0.6, 0.43, 0.08), RULE = rgb(0.78, 0.76, 0.72);
const PURPLE = rgb(0.45, 0.22, 0.7), PURPLE_BG = rgb(0.95, 0.92, 0.99), GOLD_BG = rgb(0.99, 0.97, 0.9);
const SIHUA_COLOR: Record<string, RGB> = { '禄': rgb(0.05, 0.5, 0.25), '权': rgb(0.12, 0.3, 0.75), '科': rgb(0.62, 0.46, 0), '忌': rgb(0.75, 0.1, 0.1) }; // i18n-ok: engine SiHua ids
const TYPE_COLOR: Record<Star['type'], RGB> = { major: INK, lucky: rgb(0.1, 0.42, 0.4), sha: rgb(0.6, 0.15, 0.15), minor: MUTED };
const NBSP = '\u00A0';
const FALLBACK: Record<string, string> = { '→': '->', '•': '-', '−': '-', '–': '-', '—': '-', '…': '...', '“': '"', '”': '"', '‘': "'", '’': "'", '×': 'x' };

interface Run { t: string; b?: boolean; c?: RGB; s?: number }
interface ParaOpts { size?: number; indent?: number; gap?: number; bullet?: string; bar?: RGB; color?: RGB; bold?: boolean }

const pad2 = (n: number) => String(n).padStart(2, '0');
const fmtDate = (d: Date) => `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
const fmtLunar = (l: LunarDate) => `${l.day}/${l.month}${l.leap ? ` ${app.chartPage.leap}` : ''}/${l.year}`;
const fmtOffset = (min: number) => `UTC${min >= 0 ? '+' : '−'}${Math.floor(Math.abs(min) / 60)}${Math.abs(min) % 60 ? `:${pad2(Math.abs(min) % 60)}` : ''}`;

class Writer {
  doc: PDFDocument; reg: PDFFont; bold: PDFFont; page!: PDFPage; y = 0;
  private chars: Set<number>;
  constructor(doc: PDFDocument, reg: PDFFont, bold: PDFFont) {
    this.doc = doc; this.reg = reg; this.bold = bold;
    const b = new Set(bold.getCharacterSet());
    this.chars = new Set(reg.getCharacterSet().filter(c => b.has(c)));
    this.newPage();
  }
  newPage() { this.page = this.doc.addPage([PW, PH]); this.y = PH - MT; }

  /** NFC + drop every code point the font cannot draw (no tofu); tidy brackets left empty by dropped Chinese. */
  clean(s: string): string {
    let out = '';
    for (const ch of (s ?? '').normalize('NFC')) {
      const cp = ch.codePointAt(0)!;
      if (ch === NBSP) out += NBSP; // kept: marks "do not wrap here" (drawn as a space)
      else if (/\s/.test(ch)) out += ' ';
      else if (this.chars.has(cp)) out += ch;
      else if (FALLBACK[ch]) out += FALLBACK[ch];
    }
    return out.replace(/\(\s*\)|（\s*）|\[\s*\]/g, '').replace(/ {2,}/g, ' ').replace(/ ([,.;:])/g, '$1');
  }
  font(b?: boolean) { return b ? this.bold : this.reg; }
  w(r: Run, size: number) { return this.font(r.b).widthOfTextAtSize(r.t.replaceAll(NBSP, ' '), r.s ?? size); }

  /** Greedy word wrap measured with the real font metrics; words wider than the line are split by character. */
  wrap(runs: Run[], size: number, maxW: number): Run[][] {
    const lines: Run[][] = []; let line: Run[] = []; let lw = 0; let space: Run | null = null;
    const flush = () => { lines.push(line); line = []; lw = 0; space = null; };
    for (const r of runs) for (const part of r.t.split(/( +)/)) {
      if (!part) continue;
      if (/^ +$/.test(part)) { if (line.length) space = { ...r, t: ' ' }; continue; }
      let tok: Run = { ...r, t: part };
      const sw = space ? this.w(space, size) : 0;
      let tw = this.w(tok, size);
      if (line.length && lw + sw + tw > maxW) {
        // no space before this token (run boundary inside a word/star): carry the glued tail to the next line
        const cut = space ? line.length : line.map(x => x.t).lastIndexOf(' ') + 1;
        const tail = cut > 0 ? line.splice(cut) : [];
        flush();
        for (const x of tail) { line.push(x); lw += this.w(x, size); }
      } else if (space) { line.push(space); lw += sw; }
      space = null;
      while (lw + tw > maxW && [...tok.t].length > 1) { // over-long token (URL…): break by character
        const cps = [...tok.t]; let i = 1;
        while (i < cps.length && lw + this.w({ ...tok, t: cps.slice(0, i + 1).join('') }, size) <= maxW) i++;
        line.push({ ...tok, t: cps.slice(0, i).join('') }); flush();
        tok = { ...tok, t: cps.slice(i).join('') }; tw = this.w(tok, size);
      }
      line.push(tok); lw += tw;
    }
    if (line.length) lines.push(line);
    return lines;
  }
  drawLine(line: Run[], x: number, y: number, size: number, color = INK) {
    for (const r of line) {
      const t = r.t.replaceAll(NBSP, ' ');
      if (t.trim()) this.page.drawText(t, { x, y, size: r.s ?? size, font: this.font(r.b), color: r.c ?? color });
      x += this.w(r, size);
    }
  }
  runs(input: string | Run[], bold?: boolean): Run[] {
    return (typeof input === 'string' ? [{ t: input, b: bold }] : input).map(r => ({ ...r, t: this.clean(r.t) })).filter(r => r.t);
  }
  para(input: string | Run[], o: ParaOpts = {}) {
    const size = o.size ?? 9.5, lh = size * 1.42, indent = o.indent ?? 0;
    const bw = o.bullet ? this.w({ t: this.clean(o.bullet) + ' ' }, size) : 0;
    const runs = this.runs(input, o.bold);
    if (!runs.length) return;
    const lines = this.wrap(runs, size, CW - indent - bw - (o.bar ? 8 : 0));
    lines.forEach((ln, i) => {
      if (this.y - lh < MB) this.newPage(); // page breaks only between lines
      this.y -= lh;
      const x = ML + indent + (o.bar ? 8 : 0);
      if (o.bar) this.page.drawRectangle({ x: ML + indent, y: this.y - size * 0.35, width: 2, height: lh, color: o.bar });
      if (i === 0 && o.bullet) this.drawLine(this.runs(o.bullet), x, this.y, size, o.color ?? MUTED);
      this.drawLine(ln, x + bw, this.y, size, o.color);
    });
    this.y -= o.gap ?? 3;
  }
  heading(text: string, size = 15, color = GOLD) {
    if (this.y - size * 1.6 - 40 < MB) this.newPage(); // keep a heading with at least a couple of lines
    this.y -= size * 0.6;
    this.para(text, { size, bold: true, color, gap: 2 });
    this.page.drawLine({ start: { x: ML, y: this.y }, end: { x: ML + CW, y: this.y }, thickness: size > 13 ? 0.8 : 0.4, color: RULE });
    this.y -= 6;
  }
  kv(k: string, v: string) { this.para([{ t: `${k}: `, b: true }, { t: v || T.notGiven }], { size: 9.5, gap: 1.5 }); }
}

/** Markdown basics → styled runs (headings, bold, lists, quotes); [F#]/[S#] markers are kept verbatim. */
function inline(s: string): Run[] {
  const t = s.replace(/\[([^\]]+)\]\((https?:[^)]+)\)/g, '$1 ($2)').replace(/`/g, '');
  const out: Run[] = [];
  t.split(/(\*\*[^*]+\*\*|__[^_]+__)/).forEach(p => {
    if (!p) return;
    const m = /^(\*\*|__)(.*)\1$/.exec(p);
    out.push(m ? { t: m[2], b: true } : { t: p.replace(/(^|\s)\*([^*\s][^*]*)\*/g, '$1$2') });
  });
  return out;
}
function markdown(w: Writer, text: string) {
  for (const raw of text.replace(/\r/g, '').split('\n')) {
    const line = raw.trimEnd();
    let m: RegExpExecArray | null;
    if (!line.trim()) { w.y -= 3; continue; }
    if (/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) continue;
    if ((m = /^\s*#{1,6}\s+(.*)$/.exec(line))) { w.y -= 3; w.para(inline(m[1]).map(r => ({ ...r, b: true })), { size: 10.5, gap: 2 }); continue; }
    if ((m = /^(\s*)[-*+]\s+(.*)$/.exec(line))) { w.para(inline(m[2]), { bullet: '•', indent: 8 + Math.min(m[1].length, 6) * 3 }); continue; }
    if ((m = /^(\s*)(\d+[.)])\s+(.*)$/.exec(line))) { w.para(inline(m[3]), { bullet: m[2], indent: 8 + Math.min(m[1].length, 6) * 3 }); continue; }
    if ((m = /^\s*>\s?(.*)$/.exec(line))) { w.para(inline(m[1]), { indent: 6, bar: RULE, color: MUTED }); continue; }
    w.para(inline(line.trim()));
  }
}

const GRID: Record<number, [number, number]> = { // same branch positions as ChartBoard (row, col; 1-based)
  5: [1, 1], 6: [1, 2], 7: [1, 3], 8: [1, 4], 4: [2, 1], 9: [2, 4], 3: [3, 1], 10: [3, 4], 2: [4, 1], 1: [4, 2], 0: [4, 3], 11: [4, 4],
};

function starRuns(s: Star, size: number, major: boolean): Run[] {
  const nb = (x: string) => x.replace(/ /g, NBSP); // a star never wraps mid-name
  const r: Run[] = [{ t: nb(term(s.name)), b: major, c: TYPE_COLOR[s.type], s: size }];
  if (s.brightnessRaw) r.push({ t: `${NBSP}${BRIGHTNESS_SHORT[s.brightnessRaw]}`, c: MUTED, s: size * 0.82 });
  if (s.siHua) r.push({ t: `${NBSP}${SIHUA_SHORT[s.siHua]}`, b: true, c: SIHUA_COLOR[s.siHua], s: size * 0.9 });
  return r;
}

function drawCell(w: Writer, p: Palace, x: number, top: number, cw: number, ch: number, currentDx: boolean) {
  const pg = w.page, padX = 4, inner = cw - padX * 2;
  if (currentDx) pg.drawRectangle({ x, y: top - ch, width: cw, height: ch, color: PURPLE_BG });
  else if (p.isMingGong) pg.drawRectangle({ x, y: top - ch, width: cw, height: ch, color: GOLD_BG });
  pg.drawRectangle({ x, y: top - ch, width: cw, height: ch, borderColor: p.isMingGong ? GOLD : RULE, borderWidth: p.isMingGong ? 1.4 : 0.6 });

  const clean = (rs: Run[]) => rs.map(r => ({ ...r, t: w.clean(r.t) })).filter(r => r.t);
  const majors = p.stars.filter(s => s.type === 'major');
  const minors = p.stars.filter(s => s.type !== 'major');
  const marks = w.clean([p.isMingGong && T.markMing, p.isShenGong && T.markShen, currentDx && T.markDx].filter(Boolean).join(' '));
  const build = (k: number) => {
    const blocks: { lines: Run[][]; size: number; gap: number }[] = [];
    const add = (rs: Run[], size: number, gap = 0) => blocks.push({ lines: w.wrap(clean(rs), size, inner), size, gap });
    for (const s of majors) add(starRuns(s, 8.6 * k, true), 8.6 * k);
    if (!majors.length) add([{ t: T.empty, c: MUTED, s: 7.5 * k }, ...(p.borrowedStars?.length ? [{ t: ` (${T.borrowed(p.borrowedStars.map(term).join(', '))})`, c: MUTED, s: 6.5 * k }] : [])], 7.5 * k);
    const mr: Run[] = [];
    minors.forEach((s, i) => { if (i) mr.push({ t: ', ', c: MUTED, s: 6.6 * k }); mr.push(...starRuns(s, 6.6 * k, false)); });
    if (mr.length) add(mr, 6.6 * k, 2);
    const h = blocks.reduce((a, b) => a + b.gap + b.lines.length * b.size * 1.3, 0);
    return { blocks, h };
  };
  const headH = 24;
  let layout = build(1);
  for (const k of [0.92, 0.85, 0.78, 0.72]) { if (layout.h <= ch - headH - 4) break; layout = build(k); }

  let y = top - 10;
  w.drawLine(w.runs(term(p.name), true), x + padX, y, 8.4, INK);
  const sb = w.clean(stemBranchVi(p.stem, p.branch));
  pg.drawText(sb, { x: x + cw - padX - w.reg.widthOfTextAtSize(sb, 7), y, size: 7, font: w.reg, color: MUTED });
  y -= 9.5;
  if (p.daXianAge) w.drawLine(w.runs(T.ageRange(p.daXianAge[0], p.daXianAge[1])), x + padX, y, 6.6, MUTED);
  if (marks) pg.drawText(marks, { x: x + cw - padX - w.bold.widthOfTextAtSize(marks, 6.4), y, size: 6.4, font: w.bold, color: currentDx ? PURPLE : GOLD });
  y -= 4;
  pg.drawLine({ start: { x: x + padX, y }, end: { x: x + cw - padX, y }, thickness: 0.3, color: RULE });
  for (const b of layout.blocks) {
    y -= b.gap;
    for (const ln of b.lines) {
      if (y - b.size * 1.3 < top - ch + 2) return; // shortcut: clips at the cell edge after shrinking to 72%; never seen on real charts
      y -= b.size * 1.3;
      w.drawLine(ln, x + padX, y + b.size * 0.25, b.size);
    }
  }
}

function drawCenter(w: Writer, c: ZiweiChart, name: string, x: number, top: number, cw: number, ch: number) {
  w.page.drawRectangle({ x, y: top - ch, width: cw, height: ch, borderColor: RULE, borderWidth: 0.6 });
  const li = c.lunarInfo, dx = c.daXians[c.currentDaXianIndex];
  const sihua = (['禄', '权', '科', '忌'] as const).map(h => { // i18n-ok: engine SiHua ids
    const s = c.palaces.flatMap(p => p.stars).find(st => st.siHua === h);
    return `${SIHUA_SHORT[h]}: ${s ? term(s.name) : '—'}`;
  }).join(' · ');
  const lines: [string, number, boolean, RGB][] = [
    [T.centerTitle, 13, true, GOLD],
    ...(name ? [[name, 11, true, INK] as [string, number, boolean, RGB]] : []),
    [`${app.chartPage.lunar} ${Math.abs(li.lunarDay)}/${Math.abs(li.lunarMonth)}${li.isLeapMonth ? ` ${app.chartPage.leap}` : ''}/${li.lunarYear} · ${stemBranchVi(li.yearStem, li.yearBranch)}`, 8.5, false, INK],
    [`${T.hour}: ${BRANCHES_VI[c.birthInfo.hour]} · ${common.gender[c.birthInfo.gender]} · ${term(c.yinYangGender)}`, 8.5, false, INK],
    [`${term(c.wuxingJuName)}`, 9, true, GOLD],
    [`${T.mingShen}: ${BRANCHES_VI[c.mingGongBranch]} / ${BRANCHES_VI[c.shenGongBranch]}`, 8.5, false, INK],
    [`${T.mingShenZhu}: ${term(c.mingZhu)} / ${term(c.shenZhu)}`, 8.5, false, INK],
    ...(dx ? [[`${T.currentDx}: ${T.ageRange(dx.startAge, dx.endAge)} · ${term(dx.palaceName)}`, 8.5, true, PURPLE] as [string, number, boolean, RGB]] : []),
    [`${T.natalSihua}`, 8, true, MUTED],
    [sihua, 7.8, false, INK],
    [BRIGHTNESS_LEGEND, 6.8, false, MUTED],
  ];
  const wrapped = lines.map(([t, s, b, col]) => ({ ls: w.wrap(w.runs(t, b), s, cw - 24), s, col }));
  const total = wrapped.reduce((a, l) => a + l.ls.length * l.s * 1.45, 0);
  let y = top - (ch - total) / 2;
  for (const { ls, s, col } of wrapped) for (const ln of ls) {
    y -= s * 1.45;
    const lw = ln.reduce((a, r) => a + w.w(r, s), 0);
    w.drawLine(ln, x + (cw - lw) / 2, y, s, col);
  }
}

export async function buildReportPdf(input: ReportInput): Promise<Uint8Array> {
  const { chart: c, form, settings: st } = input;
  const now = input.generatedAt ?? new Date();
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const reg = await doc.embedFont(input.fonts.regular, { subset: true });
  const bold = await doc.embedFont(input.fonts.bold, { subset: true });
  doc.setTitle(T.docTitle); doc.setSubject(T.subject); doc.setCreator(common.appName); doc.setLanguage('vi');
  doc.setCreationDate(now); doc.setModificationDate(now);
  const w = new Writer(doc, reg, bold);
  const b = input.birth ?? c.birthInfo, li = c.lunarInfo;
  const name = form?.name || c.birthInfo.name || '';

  // ── 1. title + birth parameters ──
  w.para(T.docTitle, { size: 22, bold: true, color: GOLD, gap: 2 });
  if (name) w.para(name, { size: 15, bold: true, gap: 2 });
  w.para(common.appTagline, { size: 8.5, color: MUTED, gap: 8 });
  w.heading(T.s1);
  const o = b.origInput;
  const solar = form ? `${form.day}/${form.month}/${form.year}${form.unknownTime ? ` (${T.unknownTime})` : ` ${pad2(+form.clockHour)}:${pad2(+form.clockMinute)}`}`
    : o ? `${o.day}/${o.month}/${o.year} ${pad2(o.clockHour)}:${pad2(o.clockMinute)}` : `${b.day}/${b.month}/${b.year}`;
  const off = form?.utcOffsetMinutes ?? 480;
  const placed = !!form?.province;
  if (name) w.kv(T.name, name);
  w.kv(T.solarInput, solar);
  w.kv(T.place, [form?.city, form?.province].filter(Boolean).join(', '));
  w.kv(T.longitude, placed ? `${form!.longitude.toFixed(2)}°` : '');
  w.kv(T.utcOffset, form ? fmtOffset(off) : '');
  if (form && placed && !form.unknownTime) {
    const y = +form.year, m = +form.month, d = +form.day, hh = +form.clockHour, mm = +form.clockMinute;
    const eot = st.equationOfTime ? equationOfTimeMinutes(y, m, d, hh, mm) : null;
    const corr = (form.longitude - off / 4) * 4 + (eot ?? 0);
    const sm = ((Math.round(hh * 60 + mm + corr) % 1440) + 1440) % 1440;
    w.kv(T.trueSolar, `${T.trueSolarVal(corr, eot)} → ${pad2(Math.floor(sm / 60))}:${pad2(sm % 60)}`);
  } else w.kv(T.trueSolar, T.trueSolarNone);
  w.kv(T.chartDate, `${b.day}/${b.month}/${b.year}`);
  w.kv(T.hour, BRANCHES_VI[c.birthInfo.hour]);
  w.kv(T.lunar, `${Math.abs(li.lunarDay)}/${Math.abs(li.lunarMonth)}${li.isLeapMonth ? ` ${app.chartPage.leap}` : ''}/${li.lunarYear}`);
  w.kv(T.yearPillar, stemBranchVi(li.yearStem, li.yearBranch));
  w.kv(T.gender, `${common.gender[c.birthInfo.gender]} · ${term(c.yinYangGender)}`);
  w.kv(T.ju, term(c.wuxingJuName));
  w.kv(T.mingShenZhu, `${term(c.mingZhu)} / ${term(c.shenZhu)}`);
  w.kv(T.mingShen, `${BRANCHES_VI[c.mingGongBranch]} / ${BRANCHES_VI[c.shenGongBranch]}`);

  // ── 2. conventions ──
  w.heading(T.s2);
  const so = app.settings;
  w.kv(T.convLateZishi, so.lateZishiOpts[st.lateZishi]);
  w.kv(T.convLeap, so.leapOpts[st.leapMonth as keyof typeof so.leapOpts] ?? String(st.leapMonth));
  w.kv(T.convBright, so.brightOpts[st.brightness as keyof typeof so.brightOpts] ?? String(st.brightness));
  w.kv(T.convCalendar, so.calendarOpts[st.calendar]);
  w.kv(T.convEot, so.eotOpts[st.equationOfTime ? 'apparent' : 'mean']);
  w.para(T.convNote, { size: 8.5, color: MUTED, gap: 4 });
  const region = vnRegion(form?.province, form?.city); // same region-aware rule as app/chart/page.tsx
  const diff = vnCalendarDiff(b.year, b.month, b.day, region);
  const cal = applyCalendar(b, st.calendar, region);
  const warn = st.calendar === 'cn' && diff.differs ? app.chartPage.vnLunarWarn(fmtLunar(diff.vn), fmtLunar(diff.cn))
    : st.calendar === 'vn' && cal.remapped ? app.chartPage.vnCalendarUsed(fmtLunar(diff.vn))
    : st.calendar === 'vn' && cal.unavailable ? app.chartPage.vnCalendarUnavailable(fmtLunar(diff.vn)) : '';
  if (warn) w.para(warn, { bar: rgb(0.85, 0.55, 0.1), size: 9 });

  // ── 3. twelve-palace grid ──
  w.newPage();
  w.heading(T.s3);
  w.para(T.legendMarks, { size: 7.8, color: MUTED, gap: 0 });
  w.para(T.legendStars, { size: 7.8, color: MUTED, gap: 6 });
  const gridTop = w.y, gh = gridTop - MB, cw = CW / 4, chh = gh / 4;
  const curBranch = c.daXians[c.currentDaXianIndex]?.palaceBranch;
  for (const p of c.palaces) {
    const [r, col] = GRID[p.branch];
    drawCell(w, p, ML + (col - 1) * cw, gridTop - (r - 1) * chh, cw, chh, p.branch === curBranch);
  }
  drawCenter(w, c, name, ML + cw, gridTop - chh, cw * 2, chh * 2);
  w.newPage();

  // ── 4. facts + patterns ──
  w.heading(T.s4);
  w.heading(T.factsTitle, 11.5, INK);
  w.para(T.factsNote, { size: 8.5, color: MUTED, gap: 4 });
  if (input.facts?.length) for (const f of input.facts) w.para([{ t: `[${f.id}] `, b: true, c: GOLD }, { t: f.text }], { size: 8.8, gap: 2.5 });
  else w.para(T.factsMissing, { color: MUTED });
  w.heading(T.patternsTitle, 11.5, INK);
  if (!input.patterns) w.para(T.factsMissing, { color: MUTED });
  else if (!input.patterns.length) w.para(T.patternsNone, { color: MUTED });
  for (const p of input.patterns ?? []) {
    w.para([{ t: p.name, b: true }, { t: `  ${T.level[p.level] ?? ''}`, c: GOLD, s: 8.5 }], { size: 10, gap: 1 });
    w.para(p.description, { size: 9, indent: 8, gap: 1 });
    if (p.palaces.length) w.para(T.patternPalaces(p.palaces.join(', ')), { size: 8.2, indent: 8, color: MUTED, gap: 1 });
    if (p.conditions?.required.length) w.para(T.patternRequired(p.conditions.required.join('; ')), { size: 8.2, indent: 8, color: MUTED, gap: 1 });
    if (p.conditions?.breaking?.length) w.para(T.patternBreaking(p.conditions.breaking.join('; ')), { size: 8.2, indent: 8, color: MUTED, gap: 1 });
    w.y -= 4;
  }

  // ── 5. interpretations ──
  w.heading(T.s5);
  const entries = input.entries ?? [];
  if (!entries.length) w.para(T.interpNone, { color: MUTED });
  for (const e of entries) {
    w.heading(e.title, 12, INK);
    w.para(T.interpLabel, { size: 8.5, bold: true, color: PURPLE, gap: 2 });
    const pv = { size: 8.2, bar: PURPLE, color: MUTED, gap: 1 };
    w.para(e.kind === 'dataset' ? T.provDataset : T.provAi(e.provider ?? '', e.model ?? ''), pv);
    if (e.note) w.para(T.provNote(e.note), pv);
    if (e.verification) w.para(T.provVerify(e.verification.checked, e.verification.contradicted, e.verification.unverified), pv);
    if (e.createdAt) { const d = new Date(e.createdAt); if (!isNaN(+d)) w.para(T.provCreated(fmtDate(d)), pv); }
    if (e.facts?.length) {
      w.para(T.provFacts, { ...pv, bold: true });
      for (const f of e.facts) w.para(`[${f.id}] ${f.text}`, pv);
    }
    if (e.sources?.length) {
      w.para(T.provSources, { ...pv, bold: true });
      for (const s of e.sources) w.para(`[${s.id}] ${s.title}${s.ref ? ` — ${s.ref}` : ''}${s.license ? ` (${s.license})` : ''}`, pv);
    }
    w.y -= 5;
    markdown(w, e.text);
    w.y -= 8;
  }

  // ── 6. attribution + licences ──
  w.newPage();
  w.heading(T.s6);
  for (const t of [T.attrEngine, T.attrDataset, T.attrIztro, T.attrClassics, T.attrFont, T.attrPrivacy]) w.para(t, { bullet: '•', indent: 4, gap: 4 });
  w.heading(T.disclaimerTitle, 11.5, INK);
  w.para(common.disclaimer, { bar: GOLD, gap: 4 });
  w.para(app.ai.cultural, { size: 9, color: MUTED });

  // ── footer on every page ──
  const pages = doc.getPages();
  const foot = w.clean(`${T.footer} · ${T.generated(fmtDate(now))}`);
  pages.forEach((pg, i) => {
    pg.drawLine({ start: { x: ML, y: 40 }, end: { x: PW - MR, y: 40 }, thickness: 0.4, color: RULE });
    pg.drawText(foot, { x: ML, y: 28, size: 7.5, font: reg, color: MUTED });
    const pn = T.page(i + 1, pages.length);
    pg.drawText(pn, { x: PW - MR - reg.widthOfTextAtSize(pn, 7.5), y: 28, size: 7.5, font: reg, color: MUTED });
  });
  return doc.save();
}
