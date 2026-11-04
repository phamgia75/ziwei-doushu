/**
 * Terminology check with findTermIssues() (lib/i18n/terminology.ts):
 *  - lib/i18n/vi/*.ts string literals: non-standard spellings + Han outside allowed contexts
 *  - app/** and components/** JSX text: non-standard spellings (Han there is check-ui-strings' job)
 *  - data/cache/translations/*.json `vi` fields, if present: report only
 * In vi files a literal with no Latin letter is an engine identifier / lookup pattern (e.g. '命宫',
 * `^${S}化禄入命$`), so Han is only reported in literals that also contain Vietnamese text.
 * Lines carrying `term-ok` in a comment (same or previous line) are skipped — state the reason.
 * Exit 1 on issues in source files.  Run: npx tsx scripts/i18n/check-terminology.ts
 */
import ts from 'typescript';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { findTermIssues, type TermIssue } from '../../lib/i18n/terminology';
import { UNUSED_UPSTREAM } from './check-ui-strings';

const root = process.cwd();
const walk = (dir: string): string[] => !existsSync(dir) ? [] : readdirSync(dir).flatMap(n => {
  const p = join(dir, n);
  return statSync(p).isDirectory() ? walk(p) : /\.(tsx?|jsx?)$/.test(n) ? [p] : [];
});
/** Required attribution names that must stay in Chinese (LICENSES-AND-ATTRIBUTION.md). */
const ATTRIBUTION_HAN = new Set(['紫微斗数开源解读数据集', '王多鱼']);
const LATIN = /[A-Za-zÀ-ỹ]/;
const fmt = (i: TermIssue) => i.kind === 'han' ? `chữ Hán "${i.found}"` : `"${i.found}" → "${i.canonical}"`;

function scanSource(file: string, mode: 'vi' | 'jsx'): string[] {
  const rel = relative(root, file);
  if (UNUSED_UPSTREAM.includes(rel)) return [];
  const src = readFileSync(file, 'utf8');
  const lines = src.split('\n');
  const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, file.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const out: string[] = [];
  const check = (node: ts.Node, text: string) => {
    const issues = findTermIssues(text).filter(i => i.kind === 'variant'
      || mode === 'vi' && LATIN.test(text) && !ATTRIBUTION_HAN.has(i.found));
    if (!issues.length) return;
    const { line } = sf.getLineAndCharacterOfPosition(node.getStart());
    if (/term-ok/.test(lines[line] ?? '') || /term-ok/.test(lines[line - 1] ?? '')) return;
    for (const i of issues) out.push(`${rel}:${line + 1}: ${fmt(i)}`);
  };
  const visit = (node: ts.Node) => {
    const p = node.parent;
    const isKey = p && (ts.isPropertyAssignment(p) && p.name === node || ts.isElementAccessExpression(p) && p.argumentExpression === node
      || ts.isImportDeclaration(p) || ts.isExportDeclaration(p));
    if (ts.isJsxText(node)) check(node, node.text);
    else if (!isKey && (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node))) check(node, node.text);
    else if (ts.isTemplateExpression(node)) check(node, [node.head.text, ...node.templateSpans.map(s => s.literal.text)].join(' '));
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return out;
}

const viFiles = readdirSync(join(root, 'lib/i18n/vi')).filter(f => f.endsWith('.ts')).map(f => join(root, 'lib/i18n/vi', f));
const uiFiles = [...walk(join(root, 'app')), ...walk(join(root, 'components'))];
const source = [...viFiles.flatMap(f => scanSource(f, 'vi')), ...uiFiles.flatMap(f => scanSource(f, 'jsx'))];

const cacheDir = join(root, 'data/cache/translations');
const cacheFiles = existsSync(cacheDir) ? readdirSync(cacheDir).filter(f => f.endsWith('.json')).sort() : [];
const cache: string[] = [];
for (const f of cacheFiles) {
  try {
    const vi = JSON.parse(readFileSync(join(cacheDir, f), 'utf8')).vi;
    if (typeof vi === 'string') for (const i of findTermIssues(vi)) cache.push(`cache/${f.slice(0, 12)}: ${fmt(i)}`);
  } catch { cache.push(`cache/${f.slice(0, 12)}: unreadable JSON`); }
}

console.log(`== Source (${viFiles.length} vi files, ${uiFiles.length} app/components files): ${source.length} issue(s)`);
source.forEach(l => console.log('  ' + l));
console.log(`== Translation cache (${cacheFiles.length} files, report only): ${cache.length} issue(s)`);
cache.forEach(l => console.log('  ' + l));
process.exit(source.length ? 1 : 0);
