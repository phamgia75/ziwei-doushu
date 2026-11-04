/**
 * Translation QA dataset: builds tests/fixtures/translation-qa.jsonl and docs/vi/TRANSLATION-QA.md.
 *
 * ~39 paragraphs from dataset v4.0 (CC BY 4.0, 王多鱼AI) — fixed births across decades / genders /
 * hours, all 13 topics, paragraph kinds heading / prose / list / star-analysis — plus 6 public-domain
 * classical paragraphs (lib/classics). Each is translated with translateChunk (local Ollama, cached)
 * and checked automatically (Han left, length ratio, missing glossary terms, non-standard spellings).
 *
 * Excluded on purpose:
 *  - paragraphs quoting Ni Haixia (倪 / 天纪): CC BY-NC-SA, not redistributable here;
 *  - paragraphs containing a YYYY-MM-DD string (editorial 校勘 dates) so the fixture can be
 *    checked mechanically for birth-date-like strings.
 * Birth keys are never written: a record is identified as "<decade>-<topic>" only.
 *
 * Run (Ollama must be up for uncached paragraphs): npx tsx scripts/i18n/translation-qa.ts
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { lookupRecord, DATASET_TOPICS, DATASET_ATTRIBUTION, type DatasetRecord } from '../../lib/server/dataset';
import { splitParagraphs, translateChunk, validateTranslation } from '../../lib/server/translate';
import { pickOllamaModel } from '../../lib/server/ai/providers';
import { glossaryFor } from '../../lib/i18n/terms';
import { findTermIssues } from '../../lib/i18n/terminology';
import { ALL_BOOKS } from '../../lib/classics';

const root = process.cwd();
const BIRTHS: [number, number, number, number, 'male' | 'female'][] = [
  [1955, 3, 14, 0, 'male'], [1962, 7, 8, 5, 'female'], [1971, 11, 23, 2, 'male'], [1983, 5, 30, 9, 'female'],
  [1990, 1, 2, 3, 'male'], [1998, 9, 17, 6, 'female'], [2006, 12, 4, 11, 'male'], [2019, 4, 21, 8, 'female'],
];
const EXCLUDE = /倪|天纪|\d{4}-\d{2}-\d{2}/;
const DATASET_LICENSE = `${DATASET_ATTRIBUTION.license} — ${DATASET_ATTRIBUTION.author}`;
type Kind = 'heading' | 'prose' | 'list' | 'star';
const KINDS_ROTATION: Kind[] = ['heading', 'list', 'star'];

export function kindOf(p: string): Kind {
  const t = p.trim();
  if (/^(\*\*)?【[^】]*】(\*\*)?$/.test(t) || /^#{1,6} /.test(t)) return 'heading';
  if (/^[▍✦▶◇▸🟢🔵🔴🟡⚫]/u.test(t)) return 'star';
  if (/^[·•◆\-*] /.test(t) || /^\d+[.、]/.test(t)) return 'list';
  return 'prose';
}

interface Source { dataset?: string; topic?: string; record?: string; classic?: string; license: string }
interface Item { id: string; kind: Kind | 'classic'; source: Source; zh: string }

async function datasetItems(): Promise<Item[]> {
  const recs: { decade: string; rec: DatasetRecord }[] = [];
  for (const [y, m, d, h, g] of BIRTHS) {
    const rec = await lookupRecord(y, m, d, h, g);
    if (!rec) throw new Error(`dataset record missing for a ${y}s birth — run npm run dataset:fetch`);
    recs.push({ decade: `${Math.floor(y / 10) * 10}s`, rec });
  }
  const seen = new Set<string>();
  const items: Item[] = [];
  DATASET_TOPICS.forEach((topic, t) => {
    for (const want of ['prose', KINDS_ROTATION[t % 3], KINDS_ROTATION[(t + 1) % 3]] as Kind[]) {
      for (let k = 0; k < recs.length; k++) {
        const { decade, rec } = recs[(t + k) % recs.length];
        const zh = splitParagraphs(rec.c[topic] ?? '').find(p => kindOf(p) === want && !EXCLUDE.test(p)
          && !seen.has(p) && p.length >= (want === 'heading' ? 4 : 30) && /\p{Script=Han}/u.test(p));
        if (!zh) continue;
        seen.add(zh);
        items.push({ id: `ds-${String(items.length + 1).padStart(2, '0')}`, kind: want,
          source: { dataset: DATASET_ATTRIBUTION.release, topic, record: `${decade}-${topic}`, license: DATASET_LICENSE }, zh });
        break;
      }
    }
  });
  return items;
}

function classicItems(): Item[] {
  const items: Item[] = [];
  for (const book of ALL_BOOKS) {
    const n = book.chapters.length;
    for (const ci of [...new Set([0, Math.floor(n / 2)])]) {
      const p = book.chapters[ci]?.paragraphs.find(p => p.text.length >= 20 && p.text.length <= 500 && !EXCLUDE.test(p.text));
      if (p && items.length < 6) items.push({ id: `cl-${items.length + 1}`, kind: 'classic',
        source: { classic: `${book.slug}/${ci}/${p.id}`, license: 'public domain' }, zh: p.text });
    }
  }
  return items;
}

function checks(zh: string, vi: string, glossary: string[]) {
  const zhLen = (zh.match(/\p{Script=Han}/gu) ?? []).length;
  const ratio = zhLen ? Math.round(vi.replace(/\s+/g, ' ').length / zhLen * 100) / 100 : null;
  const lower = vi.toLocaleLowerCase('vi');
  const terms = findTermIssues(vi);
  return {
    han_left: terms.filter(i => i.kind === 'han').length,
    ratio,
    ratio_ok: zhLen < 20 || (ratio! >= 1.3 && ratio! <= 7),
    missing_terms: glossary.map(g => g.split(' = ')[1]).filter(v => v && !lower.includes(v.toLocaleLowerCase('vi'))),
    variant_issues: terms.filter(i => i.kind === 'variant').map(i => `${i.found} → ${i.canonical}`),
  };
}

async function main() {
  const model = await pickOllamaModel();
  const items = [...await datasetItems(), ...classicItems()];
  const rows = [];
  for (const [n, it] of items.entries()) {
    const t0 = Date.now();
    const tr = await translateChunk(it.zh);
    const required_terms = glossaryFor(it.zh).slice(0, 40);
    const c = checks(it.zh, tr.vi, required_terms);
    const auto_ok = validateTranslation(it.zh, tr.vi, required_terms).length === 0 && c.han_left === 0;
    rows.push({ id: it.id, kind: it.kind, source: it.source, zh: it.zh, required_terms, vi: tr.vi, translator: `ollama ${model}`, checks: c, auto_ok });
    console.log(`${n + 1}/${items.length} ${it.id} ${it.kind} ${tr.cached ? 'cached' : `${((Date.now() - t0) / 1000).toFixed(1)}s`} ${auto_ok ? 'ok' : 'FAIL'}`);
  }
  mkdirSync(join(root, 'tests/fixtures'), { recursive: true });
  writeFileSync(join(root, 'tests/fixtures/translation-qa.jsonl'), rows.map(r => JSON.stringify(r)).join('\n') + '\n');
  writeFileSync(join(root, 'docs/vi/TRANSLATION-QA.md'), report(rows, model));
  console.log(`translation QA: ${rows.filter(r => r.auto_ok).length}/${rows.length} pass automated checks`);
}

type Row = { id: string; kind: string; source: Source; zh: string; vi: string; checks: ReturnType<typeof checks>; auto_ok: boolean };
function report(rows: Row[], model: string): string {
  const pct = (a: number, b: number) => b ? `${a}/${b} (${Math.round(a / b * 100)}%)` : '0/0';
  const by = (f: (r: Row) => string) => [...new Set(rows.map(f))].map(k => {
    const rs = rows.filter(r => f(r) === k); return `| ${k} | ${pct(rs.filter(r => r.auto_ok).length, rs.length)} |`;
  });
  const fails = (r: Row) => (r.checks.han_left ? 1 : 0) + (r.checks.ratio_ok ? 0 : 1) + (r.checks.missing_terms.length ? 1 : 0) + (r.checks.variant_issues.length ? 1 : 0);
  const worst = rows.filter(r => !r.auto_ok).sort((a, b) => fails(b) - fails(a) || b.checks.missing_terms.length - a.checks.missing_terms.length || a.id.localeCompare(b.id)).slice(0, 5);
  const ex = (s: string) => s.replace(/\s+/g, ' ').slice(0, 220).replace(/\|/g, '\\|') + (s.length > 220 ? '…' : '');
  const missingCount = new Map<string, number>();
  for (const r of rows) for (const m of r.checks.missing_terms) missingCount.set(m, (missingCount.get(m) ?? 0) + 1);
  return [
    '# Kiểm định chất lượng bản dịch (Translation QA)', '',
    '> Tệp sinh tự động bởi `scripts/i18n/translation-qa.ts` từ `tests/fixtures/translation-qa.jsonl` — không sửa tay.', '',
    '## Kết quả', '',
    `- Mô hình dịch: Ollama \`${model}\` (cục bộ), qua \`translateChunk\` (lib/server/translate.ts), có cache.`,
    `- Số đoạn: ${rows.length} (${rows.filter(r => r.source.dataset).length} từ bộ dữ liệu v4.0, ${rows.filter(r => r.source.classic).length} cổ thư).`,
    `- Đạt toàn bộ kiểm tra tự động: **${pct(rows.filter(r => r.auto_ok).length, rows.length)}**.`, '',
    '| Loại lỗi | Số đoạn |', '|---|---|',
    `| Còn chữ Hán ngoài ngoặc | ${rows.filter(r => r.checks.han_left).length} |`,
    `| Tỉ lệ độ dài bất thường (<1.3 hoặc >7) | ${rows.filter(r => !r.checks.ratio_ok).length} |`,
    `| Thiếu thuật ngữ bắt buộc | ${rows.filter(r => r.checks.missing_terms.length).length} |`,
    `| Cách viết không chuẩn (VARIANTS) | ${rows.filter(r => r.checks.variant_issues.length).length} |`, '',
    'Thuật ngữ hay bị thiếu: ' + ([...missingCount].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 10).map(([t, n]) => `${t} (${n})`).join(', ') || 'không có') + '.', '',
    '| Dạng đoạn | Đạt |', '|---|---|', ...by(r => r.kind), '',
    '| Chủ đề / nguồn | Đạt |', '|---|---|', ...by(r => r.source.topic ?? 'cổ thư'), '',
    '## Ví dụ kém nhất', '',
    ...(worst.length ? worst.flatMap(r => [
      `### ${r.id} (${r.kind}, ${r.source.record ?? r.source.classic})`, '',
      `- Lỗi: ${[r.checks.han_left && `còn ${r.checks.han_left} cụm chữ Hán`, !r.checks.ratio_ok && `tỉ lệ ${r.checks.ratio}`,
        r.checks.missing_terms.length && `thiếu ${r.checks.missing_terms.join(', ')}`, r.checks.variant_issues.length && r.checks.variant_issues.join(', ')].filter(Boolean).join('; ')}`,
      `- zh: ${ex(r.zh)}`, `- vi: ${ex(r.vi)}`, '']) : ['Không có đoạn nào trượt.', '']),
    '## Phương pháp', '',
    '- 8 lá số cố định trải từ thập niên 1950 đến 2010, nam/nữ xen kẽ, các giờ sinh khác nhau; mỗi chủ đề (13) lấy 3 đoạn: 1 đoạn văn xuôi + 2 trong số tiêu đề / danh sách / dòng phân tích sao (▍ ✦ ▶ ◇), luân phiên.',
    '- Đoạn được cắt bằng `splitParagraphs` giống lúc chạy thật; 6 đoạn cổ thư lấy từ `lib/classics` (Toàn Thư, Toàn Tập, Cốt Tủy Phú).',
    '- Kiểm tra tự động: `validateTranslation` (chữ Hán, tỉ lệ độ dài, thuật ngữ bắt buộc từ `glossaryFor`, VARIANTS) + `findTermIssues` (chữ Hán ngoài ngoặc / 《》).',
    '- Loại trừ: đoạn trích dẫn Nghê Hải Hạ (倪, 天纪 — CC BY-NC-SA) và đoạn có chuỗi ngày dạng YYYY-MM-DD. Không ghi ngày sinh: mỗi bản ghi chỉ định danh bằng `<thập niên>-<chủ đề>`.', '',
    '## Nguồn và giấy phép', '',
    `- Đoạn từ bộ dữ liệu: ${DATASET_ATTRIBUTION.name}, tác giả ${DATASET_ATTRIBUTION.author}, ${DATASET_ATTRIBUTION.url}, bản phát hành ${DATASET_ATTRIBUTION.release} — ${DATASET_ATTRIBUTION.license}. Bản dịch tiếng Việt là tác phẩm phái sinh, cùng điều kiện ghi nguồn.`,
    '- Cổ thư (紫微斗数全书 / 全集 / 骨髓赋): phạm vi công cộng.',
    '- Thuật ngữ: iztro vi-VN (MIT) + bổ sung của TuVi AI — xem `docs/vi/THUAT-NGU.md`.', '',
    '## Lưu ý trung thực', '',
    'Các kiểm tra trên là **tự động và chỉ bắt lỗi bề mặt**: còn chữ Hán, độ dài lệch, thiếu thuật ngữ, sai chính tả đã biết. ' +
    'Chúng **không** chứng minh bản dịch đúng nghĩa, tự nhiên hay trung thành với nguyên văn. Một đoạn "đạt" vẫn có thể dịch sai ý. ' +
    'Cần người hiệu đính thông thạo cả tiếng Trung và Tử Vi đọc lại trước khi coi bản dịch là chính xác.', '',
  ].join('\n');
}

main().catch(e => { console.error(e); process.exit(1); });
