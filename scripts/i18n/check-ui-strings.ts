/**
 * Static check: user-facing Chinese text in app/ and components/ must be translated.
 *
 * Flags JSX text and string/template literals containing Han characters, except:
 *  - inside <Zh>…</Zh> or any element with lang="zh…" (intentional secondary reference)
 *  - arguments of term()/hasTerm()/tChar() (Chinese engine identifiers used as lookup keys)
 *  - comparison operands (===, !==, ==, !=), switch cases, object keys, element-access keys, imports
 *  - lines carrying `i18n-ok` in a comment on the same or previous line (state the reason)
 *  - files whose first 5 lines contain `i18n-exempt:` (state the reason)
 *
 * Usage: npx tsx scripts/i18n/check-ui-strings.ts [files...]   (default: app/ + components/)
 * The runtime DOM check in e2e/l10n.spec.ts is the authoritative gate; this one is fast feedback.
 */
import ts from 'typescript';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const HAN = /\p{Script=Han}/u;
/** Upstream components kept for merge-compatibility but never rendered by TuVi AI.
 *  tests/unit/unused-upstream-not-imported.test.ts fails if any of them gets imported. */
export const UNUSED_UPSTREAM = ['components/ScrollIntro.tsx', 'components/AnnouncementModal.tsx', 'components/ShareModal.tsx',
  'components/ShareCardCanvas.tsx', 'components/FamousPersonCard.tsx', 'components/ChatPanel.tsx', 'components/StarField.tsx'];
const KEY_FUNCS = new Set(['term', 'hasTerm', 'tChar', 'substituteTerms', 'glossaryFor']);
const root = process.cwd();

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap(n => {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) return n === 'api' ? [] : walk(p);
    return /\.(tsx?|jsx?)$/.test(n) ? [p] : [];
  });
}

function isZhContext(node: ts.Node): boolean {
  for (let n: ts.Node | undefined = node.parent; n; n = n.parent) {
    if (ts.isJsxElement(n)) {
      const open = n.openingElement;
      if (open.tagName.getText() === 'Zh') return true;
      for (const a of open.attributes.properties) {
        if (ts.isJsxAttribute(a) && a.name.getText() === 'lang' && a.initializer && /zh/.test(a.initializer.getText())) return true;
      }
    }
  }
  return false;
}

function isKeyUsage(node: ts.Node): boolean {
  const p = node.parent;
  if (!p) return false;
  if (ts.isCallExpression(p) && p.arguments.includes(node as ts.Expression)) {
    const callee = p.expression;
    const name = ts.isIdentifier(callee) ? callee.text : ts.isPropertyAccessExpression(callee) ? callee.name.text : '';
    if (KEY_FUNCS.has(name)) return true;
  }
  if (ts.isBinaryExpression(p) && [ts.SyntaxKind.EqualsEqualsEqualsToken, ts.SyntaxKind.ExclamationEqualsEqualsToken,
    ts.SyntaxKind.EqualsEqualsToken, ts.SyntaxKind.ExclamationEqualsToken].includes(p.operatorToken.kind)) return true;
  if (ts.isCaseClause(p)) return true;
  if (ts.isPropertyAssignment(p) && p.name === node) return true;
  if (ts.isElementAccessExpression(p) && p.argumentExpression === node) return true;
  if (ts.isImportDeclaration(p) || ts.isExportDeclaration(p) || ts.isLiteralTypeNode(p)) return true;
  return false;
}

function hasOkComment(src: string, lines: string[], line: number): boolean {
  return /i18n-ok/.test(lines[line] ?? '') || /i18n-ok/.test(lines[line - 1] ?? '');
}

export function checkFile(file: string): string[] {
  const src = readFileSync(file, 'utf8');
  const lines = src.split('\n');
  if (lines.slice(0, 5).some(l => l.includes('i18n-exempt:'))) return [];
  const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, file.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const out: string[] = [];
  const report = (node: ts.Node, text: string) => {
    if (!HAN.test(text) || isZhContext(node) || isKeyUsage(node)) return;
    const { line } = sf.getLineAndCharacterOfPosition(node.getStart());
    if (hasOkComment(src, lines, line)) return;
    out.push(`${relative(root, file)}:${line + 1}: ${text.trim().replace(/\s+/g, ' ').slice(0, 80)}`);
  };
  const visit = (node: ts.Node) => {
    if (ts.isJsxText(node)) report(node, node.text);
    else if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) report(node, node.text);
    else if (ts.isTemplateExpression(node)) report(node, [node.head.text, ...node.templateSpans.map(s => s.literal.text)].join('…'));
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return out;
}

if (process.argv[1]?.endsWith('check-ui-strings.ts')) {
  const args = process.argv.slice(2);
  const files = args.length ? args.map(a => join(root, a)) : [...walk(join(root, 'app')), ...walk(join(root, 'components'))];
  const problems = files.flatMap(checkFile);
  problems.forEach(p => console.log(p));
  console.log(`\n${problems.length} untranslated UI string(s) in ${files.length} file(s)`);
  process.exit(problems.length ? 1 : 0);
}
