/**
 * Downloads the v4.0 interpretation dataset (CC BY 4.0, 王多鱼AI) into data/dataset/v4.0 and
 * verifies every file's SHA-256 against MANIFEST.json. ~161 MB total; resumable (skips verified files).
 * Usage: npm run dataset:fetch [-- 1985 1990]   (no args = all years 1950–2026)
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync, renameSync } from 'node:fs';
import { join } from 'node:path';

const BASE = 'https://github.com/Renhuai123/ziwei-doushu/releases/download/v4.0-13d';
const dir = process.env.DATASET_DIR || join(process.cwd(), 'data/dataset/v4.0');
const sha = (b: Buffer) => createHash('sha256').update(b).digest('hex');

async function get(name: string, tries = 3): Promise<Buffer> {
  for (let i = 1; ; i++) {
    try {
      const r = await fetch(`${BASE}/${name}`, { signal: AbortSignal.timeout(120_000) });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return Buffer.from(await r.arrayBuffer());
    } catch (e) {
      if (i >= tries) throw e;
      console.warn(`retry ${name} (${i}/${tries}): ${(e as Error).message}`);
      await new Promise(r => setTimeout(r, 2000 * i));
    }
  }
}

(async () => {
  mkdirSync(dir, { recursive: true });
  const manifest = JSON.parse((await get('MANIFEST.json')).toString('utf8'));
  writeFileSync(join(dir, 'MANIFEST.json'), JSON.stringify(manifest, null, 1));
  const want = process.argv.slice(2).map(Number);
  const files = manifest.files.filter((f: { year: number }) => !want.length || want.includes(f.year));
  let ok = 0;
  for (const f of files) {
    const p = join(dir, `year-${f.year}.jsonl.zst`);
    if (existsSync(p) && sha(readFileSync(p)) === f.sha256) { ok++; continue; }
    const buf = await get(`year-${f.year}.jsonl.zst`);
    if (sha(buf) !== f.sha256) throw new Error(`checksum mismatch for ${f.year} — refusing to store`);
    writeFileSync(p + '.part', buf); renameSync(p + '.part', p);
    ok++; console.log(`year ${f.year} ok (${(buf.length / 1e6).toFixed(1)} MB)`);
  }
  console.log(`${ok}/${files.length} year files present and verified in ${dir}`);
})().catch(e => { console.error(e.message); process.exit(1); });
