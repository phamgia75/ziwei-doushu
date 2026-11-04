'use client';
/** Streaming AI answer with traceability: model, cited facts/sources, validation result. */
import { useCallback, useRef, useState } from 'react';
import Markdown from './Markdown';
import { streamSse } from '@/lib/client/sse';
import { app } from '@/lib/i18n/vi/app';

const t = app.ai;
const HAN = /\p{Script=Han}/u;
/** Mark Chinese runs inside Vietnamese text (e.g. "Phu Thê (夫妻)") as lang="zh" secondary references. */
const zhRuns = (text: string) => text.split(/([\p{Script=Han}《》（）]+)/u).map((part, i) => (HAN.test(part) ? <span key={i} lang="zh">{part}</span> : part));

interface FactMeta { id: string; text: string }
interface SourceMeta { id: string; title: string; ref: string; license: string; text: string }
interface Validation { placementsChecked: number; placementIssues: unknown[]; citedFacts: string[]; citedSources: string[]; invalidRefs: string[] }
interface Meta { provider?: string; model?: string; facts?: FactMeta[]; sources?: SourceMeta[]; validation?: Validation; fallback?: string; fallbackFrom?: string; fallbackReason?: string; injectionSuspected?: boolean }

export function useAiStream() {
  const [text, setText] = useState('');
  const [meta, setMeta] = useState<Meta>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const ctl = useRef<AbortController | null>(null);

  const run = useCallback(async (url: string, body: unknown): Promise<string> => {
    ctl.current?.abort();
    const c = new AbortController(); ctl.current = c;
    setText(''); setMeta({}); setError(''); setLoading(true);
    let acc = '';
    try {
      await streamSse(url, body, ev => {
        if (ev.delta) { acc += (ev.delta as { text?: string }).text ?? ''; setText(acc); }
        if (ev.meta) {
          const m = ev.meta as Record<string, unknown>;
          setMeta(prev => ({
            ...prev,
            ...(m.phase === 'start' ? { provider: m.provider as string, model: m.model as string, facts: m.facts as FactMeta[], sources: m.sources as SourceMeta[], injectionSuspected: !!m.injectionSuspected } : {}),
            ...(m.phase === 'fallback' ? { fallbackFrom: m.from as string, fallbackReason: m.reason as string } : {}),
            ...(m.phase === 'end' ? { validation: m.validation as Validation, fallback: m.fallback as string } : {}),
          }));
        }
        if (ev.error) setError((ev.error as { message?: string }).message ?? t.error);
      }, c.signal);
    } catch (e) {
      if (!c.signal.aborted) setError((e as Error).message);
    } finally {
      if (ctl.current === c) setLoading(false);
    }
    return acc;
  }, []);

  const stop = useCallback(() => { ctl.current?.abort(); setLoading(false); }, []);
  const reset = useCallback(() => { ctl.current?.abort(); setText(''); setMeta({}); setError(''); setLoading(false); }, []);
  return { text, meta, loading, error, run, stop, reset };
}

function Trace({ meta, focus }: { meta: Meta; focus: string | null }) {
  const [all, setAll] = useState(false);
  const cited = new Set([...(meta.validation?.citedFacts ?? []), ...(meta.validation?.citedSources ?? [])]);
  const facts = (meta.facts ?? []).filter(f => all || cited.has(f.id) || f.id === focus);
  const sources = (meta.sources ?? []).filter(s => all || cited.has(s.id) || s.id === focus);
  return (
    <details className="print-avoid-break" open={!!focus} style={{ marginTop: 12 }}>
      <summary className="tv-note" style={{ cursor: 'pointer' }}>{t.trace} ({cited.size})</summary>
      <div style={{ marginTop: 8, display: 'grid', gap: 10 }}>
        <label className="tv-note"><input type="checkbox" checked={all} onChange={e => setAll(e.target.checked)} /> {t.showAll}</label>
        {facts.length > 0 && <div><div className="tv-note" style={{ fontWeight: 600 }}>{t.facts}</div>
          <ul className="tv-md" style={{ fontSize: 13 }}>{facts.map(f => <li key={f.id} id={`ref-${f.id}`} style={f.id === focus ? { background: 'var(--ac-bg)' } : undefined}><b>[{f.id}]</b> {zhRuns(f.text)}</li>)}</ul></div>}
        {sources.length > 0 && <div><div className="tv-note" style={{ fontWeight: 600 }}>{t.sources}</div>
          <ul className="tv-md" style={{ fontSize: 13 }}>{sources.map(s => (
            <li key={s.id} id={`ref-${s.id}`} style={s.id === focus ? { background: 'var(--ac-bg)' } : undefined}>
              <b>[{s.id}]</b> {zhRuns(s.title)} — <span className="tv-note">{zhRuns(s.license)}</span>
              <div lang="zh" className="tv-note" style={{ whiteSpace: 'pre-wrap' }}>{s.text}</div>
            </li>))}</ul></div>}
      </div>
    </details>
  );
}

export default function AiAnswer({ s }: { s: ReturnType<typeof useAiStream> }) {
  const [focus, setFocus] = useState<string | null>(null);
  const v = s.meta.validation;
  if (!s.text && !s.loading && !s.error) return null;
  return (
    <div className="print-avoid-break" style={{ marginTop: 12 }}>
      {s.meta.model && <div className="tv-note">{t.model(s.meta.provider ?? '', s.meta.model)}</div>}
      {s.meta.fallbackFrom && <div className="tv-warn">{t.fallback(s.meta.fallbackFrom, s.meta.fallbackReason ?? '')}</div>}
      {s.meta.fallback === 'deterministic' && <div className="tv-warn">{t.deterministic}</div>}
      {s.meta.injectionSuspected && <div className="tv-warn">{t.injection}</div>}
      {s.loading && !s.text && <div className="tv-note">{t.thinking}</div>}
      <Markdown text={s.text} onRef={id => { setFocus(id); setTimeout(() => document.getElementById(`ref-${id}`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 50); }} />
      {s.loading && <button type="button" className="tv-btn no-print" onClick={s.stop}>{t.stop}</button>}
      {s.error && <div className="tv-warn">{t.error}: {s.error}</div>}
      {v && <div className="tv-note" style={{ marginTop: 8 }}>{v.placementIssues.length ? `⚠️ ${t.validationBad(v.placementIssues.length)}` : `✓ ${t.validationOk(v.placementsChecked)}`}</div>}
      {!s.loading && s.text && <div className="tv-note">{t.cultural}</div>}
      {(s.meta.facts?.length ?? 0) > 0 && <Trace meta={s.meta} focus={focus} />}
    </div>
  );
}
