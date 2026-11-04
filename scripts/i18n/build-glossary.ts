/**
 * Regenerates lib/i18n/glossary.iztro.json by joining iztro's zh-CN and vi-VN locale
 * tables on their shared keys. Source: iztro (MIT, https://github.com/SylarLong/iztro).
 * Run: npx tsx scripts/i18n/build-glossary.ts
 */
import { readdirSync, writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const base = join(process.cwd(), 'node_modules/iztro/lib/i18n/locales');
const version = JSON.parse(readFileSync(join(process.cwd(), 'node_modules/iztro/package.json'), 'utf8')).version;
const out: Record<string, string> = {};
for (const f of readdirSync(join(base, 'zh-CN'))) {
  if (!/\.(js|json)$/.test(f) || f === 'index.js') continue;
  const load = (loc: string) => { const m = require(join(base, loc, f)); return m.default ?? m; };
  const zh = load('zh-CN'), vi = load('vi-VN');
  for (const k of Object.keys(zh)) {
    if (typeof zh[k] === 'string' && typeof vi[k] === 'string' && !(zh[k] in out)) out[zh[k]] = vi[k];
  }
}
const sorted = Object.fromEntries(Object.entries(out).sort(([a], [b]) => a.localeCompare(b)));
writeFileSync(join(process.cwd(), 'lib/i18n/glossary.iztro.json'),
  JSON.stringify({ source: `iztro@${version} locales zh-CN ↔ vi-VN (MIT)`, terms: sorted }, null, 1) + '\n');
console.log(`glossary: ${Object.keys(sorted).length} terms from iztro@${version}`);
