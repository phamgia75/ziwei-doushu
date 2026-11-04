/** POST JSON and consume a `data: …` SSE stream, buffering across chunk boundaries. */
export async function streamSse(url: string, body: unknown, onEvent: (ev: Record<string, unknown>) => void, signal?: AbortSignal): Promise<void> {
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal });
  if (!res.ok || !res.body) {
    let msg = `HTTP ${res.status}`;
    try { msg = (await res.json()).error ?? msg; } catch { /* not JSON */ }
    throw new Error(msg);
  }
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let i: number;
    while ((i = buf.indexOf('\n\n')) >= 0) {
      const block = buf.slice(0, i); buf = buf.slice(i + 2);
      for (const line of block.split('\n')) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6);
        if (data === '[DONE]') return;
        try { onEvent(JSON.parse(data)); } catch { /* ignore malformed event */ }
      }
    }
  }
}

/** Birth fields only — never send name/place to the server. */
export const birthPayload = (b: { year: number; month: number; day: number; hour: number; gender: 'male' | 'female' }) =>
  ({ year: b.year, month: b.month, day: b.day, hour: b.hour, gender: b.gender });
