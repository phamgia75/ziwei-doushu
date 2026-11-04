/**
 * Exact-request answer cache: identical provider + model + messages (i.e. same chart facts, sources,
 * task and question) → the stored answer is replayed instantly. Stored under data/cache/answers
 * (local only, gitignored; cleared by the privacy route). Only complete, non-fallback answers are stored.
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import type { ChatMessage } from './providers';

const VERSION = 'ans-v3'; // bump when prompts change; validation is re-run on every hit
const dir = () => join(process.cwd(), 'data/cache/answers');
export const answerKey = (provider: string, model: string, messages: ChatMessage[]) =>
  createHash('sha256').update(JSON.stringify([VERSION, provider, model, messages])).digest('hex');

export function readAnswer(key: string): { text: string } | null {
  if (process.env.AI_ANSWER_CACHE === 'off') return null;
  const f = join(dir(), `${key}.json`);
  try { return existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : null; } catch { return null; }
}
/** Stores the RAW model text only; validation is recomputed with the current verifier on replay. */
export function writeAnswer(key: string, v: { text: string }): void {
  if (process.env.AI_ANSWER_CACHE === 'off') return;
  try { mkdirSync(dir(), { recursive: true }); writeFileSync(join(dir(), `${key}.json`), JSON.stringify(v)); } catch { /* cache is best-effort */ }
}
export function clearAnswerCache(): number {
  if (!existsSync(dir())) return 0;
  const n = readdirSync(dir()).length; rmSync(dir(), { recursive: true, force: true }); return n;
}
