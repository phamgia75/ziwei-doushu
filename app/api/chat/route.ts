import { POST as interpret } from '../interpret/route';

export const dynamic = 'force-dynamic';

/** POST {birth, options, question, messages?, provider?} → SSE. Q&A against the active chart (mode=chat). */
export async function POST(req: Request) {
  const body = await req.text();
  let parsed: Record<string, unknown> = {};
  try { parsed = JSON.parse(body); } catch { /* interpret will reject */ }
  const headers = new Headers(req.headers);
  headers.delete('content-length'); // body is re-serialised below
  return interpret(new Request(req.url, { method: 'POST', headers, body: JSON.stringify({ ...parsed, mode: 'chat' }), signal: req.signal }));
}
