// Native PDF report: builds in Node from a real chart + facts + a Vietnamese interpretation; writes test-results/sample-report.pdf.
import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { PDFDict, PDFDocument, PDFName } from 'pdf-lib';
import { buildReportPdf } from '../../lib/client/pdf-report';
import { generateChart } from '../../lib/ziwei/algorithm';
import { formToBirthInfo } from '../../lib/ziwei/share';
import { buildFacts } from '../../lib/server/facts';
import { patternVi } from '../../lib/i18n/vi/patterns';
import { DEFAULT_SETTINGS } from '../../lib/client/storage';
import type { BirthFormState } from '../../components/BirthForm';
import * as nodeModule from 'node:module';

// patterns.ts imports `server-only` (only present inside Next builds): resolve it to an empty module (as patterns-vi-coverage.test.ts).
type HookResult = { url?: string; format?: string; source?: string; shortCircuit?: boolean };
const { registerHooks } = nodeModule as unknown as { registerHooks(h: {
  resolve(s: string, c: unknown, next: (s: string, c: unknown) => HookResult): HookResult;
  load(u: string, c: unknown, next: (u: string, c: unknown) => HookResult): HookResult; }): void };
const STUB = 'data:text/javascript,';
registerHooks({
  resolve: (s, c, next) => (s === 'server-only' ? { url: STUB, shortCircuit: true } : next(s, c)),
  load: (u, c, next) => (u === STUB ? { format: 'commonjs', source: '', shortCircuit: true } : next(u, c)),
});

async function main() {
const { detectPatterns } = await import('../../lib/ziwei/patterns');

const form: BirthFormState = { name: 'Nguyễn Thị Hằng', year: '1990', month: '6', day: '15', clockHour: '23', clockMinute: '40', unknownTime: false,
  province: 'Hà Nội', city: 'Hoàn Kiếm', longitude: 105.85, utcOffsetMinutes: 420, gender: 'female' };
const birth = formToBirthInfo(form, { lateZishi: 'next-day', equationOfTime: true });
const chart = generateChart(birth);
const facts = buildFacts(chart, { year: 2026 });
const patterns = detectPatterns(chart).map(patternVi);
const fonts = { regular: new Uint8Array(readFileSync('public/fonts/BeVietnamPro-Regular.ttf')), bold: new Uint8Array(readFileSync('public/fonts/BeVietnamPro-Bold.ttf')) };
assert.ok(readFileSync('public/fonts/OFL.txt', 'utf8').includes('SIL OPEN FONT LICENSE Version 1.1'), 'font licence shipped next to the font');

const allVi = 'ĂÂĐÊÔƠƯăâđêôơư àáảãạ ằắẳẵặ ầấẩẫậ èéẻẽẹ ềếểễệ ìíỉĩị òóỏõọ ồốổỗộ ờớởỡợ ùúủũụ ừứửữự ỳýỷỹỵ ÀÁẢÃẠ ỲÝỶỸỴ ỪỨỬỮỰ';
const longText = Array.from({ length: 60 }, (_, i) => `Đoạn ${i + 1}: Cung Mệnh có Thiên Cơ miếu địa, chủ người thông minh, linh hoạt, giỏi mưu lược [F${(i % 9) + 1}].`).join(' ');
const entries = [{
  id: 'topic:career', title: 'Sự nghiệp — phân tích AI', kind: 'ai' as const, provider: 'ollama', model: 'qwen2.5:7b',
  text: `## Tổng quan\nNgười có **Thiên Cơ** tọa Mệnh thường *khéo léo* [F3] [S1].\n- Hợp nghề kỹ thuật, tư vấn\n- Nên tránh đầu cơ\n1. Giai đoạn 25–34 tuổi: tích lũy\n2. Giai đoạn sau: bứt phá\n> Trích dẫn cổ thư: “Cơ Lương gia hội, thiện đàm binh.”\n${allVi}\n${longText}\nhttps://github.com/Renhuai123/ziwei-doushu/very/long/url/that/must/be/broken/by/character/because/it/has/no/spaces/at/all/xxxxxxxxxxxxxxxxxxxxxxxx\n紫微 (chữ Hán không có trong phông sẽ bị bỏ)`,
  facts: [facts[2]].map(f => ({ id: f.id, text: f.text })),
  sources: [{ id: 'S1', title: 'Tử Vi Đẩu Số Toàn Thư', ref: 'quyển 1', license: 'public domain' }],
  verification: { checked: 4, contradicted: 0, unverified: 1 }, createdAt: '2026-11-05T09:30:00Z',
}, {
  id: 'dataset:career', title: 'Sự nghiệp — bộ dữ liệu', kind: 'dataset' as const, note: 'bản dịch máy',
  text: 'Đoạn dịch máy thứ nhất.\n\nĐoạn dịch máy thứ hai, có dấu ngoặc “kép” và gạch ngang — như vậy.', createdAt: '2026-11-05T09:31:00Z',
}];

const t0 = Date.now();
const bytes = await buildReportPdf({ chart, form, birth, settings: { ...DEFAULT_SETTINGS, equationOfTime: true }, facts, patterns, entries, fonts, generatedAt: new Date(2026, 10, 5, 10, 0) });
const ms = Date.now() - t0;
assert.equal(Buffer.from(bytes.subarray(0, 5)).toString(), '%PDF-');
assert.ok(bytes.length < 1.5 * 1024 * 1024, `size ${bytes.length}`);
const doc = await PDFDocument.load(bytes);
assert.ok(doc.getPageCount() >= 3, `pages ${doc.getPageCount()}`);
const descriptors = doc.context.enumerateIndirectObjects().map(([, o]) => o)
  .filter((o): o is PDFDict => o instanceof PDFDict && o.get(PDFName.of('Type')) === PDFName.of('FontDescriptor'));
assert.equal(descriptors.length, 2, 'regular + bold embedded');
for (const d of descriptors) {
  assert.ok(d.get(PDFName.of('FontFile2')), 'TrueType font program embedded');
  assert.match(String(d.get(PDFName.of('FontName'))), /BeVietnamPro/);
}
assert.equal(doc.getTitle(), 'Báo cáo lá số Tử Vi');

// no entries + no facts: still a valid report with the "how to add" note
const minimal = await buildReportPdf({ chart, settings: DEFAULT_SETTINGS, fonts });
assert.ok((await PDFDocument.load(minimal)).getPageCount() >= 3);

mkdirSync('test-results', { recursive: true });
writeFileSync('test-results/sample-report.pdf', bytes);
console.log(`pdf report: ${doc.getPageCount()} pages, ${(bytes.length / 1024).toFixed(0)} KB, ${ms} ms → test-results/sample-report.pdf`);
}
main().catch(e => { console.error(e); process.exit(1); });
