'use client';
import { useState } from 'react';
import { streamSse } from '@/lib/client/sse';
import { app } from '@/lib/i18n/vi/app';
import Markdown from './Markdown';

/** On-demand Vietnamese translation of one classical chapter by the local model (cached on the server). */
export default function ChapterTranslate({ book, chapter }: { book: string; chapter: number }) {
  const L = app.library;
  const [paras, setParas] = useState<{ i: number; vi?: string; error?: string }[]>([]);
  const [total, setTotal] = useState(0);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const run = async () => {
    setBusy(true); setParas([]); setErr('');
    try {
      await streamSse('/api/translate', { book, chapter }, ev => {
        if ((ev.meta as { paragraphs?: number })?.paragraphs) setTotal((ev.meta as { paragraphs: number }).paragraphs);
        if (ev.para) setParas(p => [...p, ev.para as { i: number; vi?: string; error?: string }]);
      });
    } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  };
  return (
    <div style={{ margin: '12px 0' }}>
      <button type="button" className="tv-btn tv-btn-primary" disabled={busy} onClick={run}>{busy && total ? L.translating(paras.length + 1, total) : L.translate}</button>
      {err && <div className="tv-warn">{err}</div>}
      {paras.length > 0 && (
        <div className="card-flat" style={{ padding: 16, marginTop: 10 }}>
          <p className="tv-note">{L.machine}</p>
          {paras.map(p => <div key={p.i}>{p.vi ? <Markdown text={p.vi} /> : <p className="tv-note">{p.error}</p>}</div>)}
        </div>
      )}
    </div>
  );
}
