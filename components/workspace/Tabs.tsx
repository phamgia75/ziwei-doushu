'use client';
/** Right-hand workspace tabs of /chart: topics (dataset + AI), chat, palace/star detail, cycles, patterns. */
import { useEffect, useRef, useState } from 'react';
import type { BirthInfo, Palace, Star, ZiweiChart } from '@/lib/ziwei/types';
import type { PatternVi } from '@/lib/i18n/vi/patterns';
import { term } from '@/lib/i18n';
import { TOPICS, type TopicKey } from '@/lib/i18n/vi/topics';
import { app } from '@/lib/i18n/vi/app';
import { common } from '@/lib/i18n/vi/common';
import { birthPayload, streamSse } from '@/lib/client/sse';
import { requestProvider, type Settings } from '@/lib/client/storage';
import AiAnswer, { useAiStream } from '@/components/AiAnswer';
import Markdown from '@/components/Markdown';
import StarDetailPanel from '@/components/StarDetailPanel';
import PatternsCard from '@/components/PatternsCard';
import Zh from '@/components/Zh';

/** `birth` is the chart date BEFORE the calendar convention; the server applies options.calendar itself. */
export interface Ctx { chart: ZiweiChart; birth: BirthInfo; settings: Settings }
const base = ({ birth, settings }: Ctx) => ({
  birth: birthPayload(birth),
  options: { leapMonth: settings.leapMonth, brightness: settings.brightness, calendar: settings.calendar },
  provider: requestProvider(settings),
});

// ── Topics: dataset reading (translated on demand) + AI topic analysis ──
interface Para { i: number; zh: string; vi?: string; ok?: boolean; error?: string }
export function TopicsTab(ctx: Ctx) {
  const T = app.topics;
  const [topic, setTopic] = useState<TopicKey | null>(null);
  const [paras, setParas] = useState<Para[]>([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState<string>('');
  const [showZh, setShowZh] = useState(false);
  const ai = useAiStream();
  const ctl = useRef<AbortController | null>(null);

  useEffect(() => () => ctl.current?.abort(), []);
  useEffect(() => { setTopic(null); setParas([]); ai.reset(); }, [ctx.chart]); // eslint-disable-line react-hooks/exhaustive-deps

  const pick = (k: TopicKey) => {
    setTopic(k); setParas([]); setTotal(0); setStatus('loading'); ai.reset();
    ctl.current?.abort(); const c = new AbortController(); ctl.current = c;
    streamSse('/api/reading', { ...base(ctx), topic: k }, ev => {
      const m = ev.meta as { status?: string; paragraphs?: number } | undefined;
      if (m?.status) setStatus(m.status);
      if (m?.paragraphs) setTotal(m.paragraphs);
      if (ev.para) setParas(p => [...p, ev.para as Para]);
      if (ev.error) setStatus('error');
    }, c.signal).then(() => setStatus(s => (s === 'loading' ? 'ok' : s))).catch(() => { if (!c.signal.aborted) setStatus('error'); });
  };

  const tp = TOPICS.find(x => x.key === topic);
  return (
    <div>
      <p className="tv-note">{T.pick}</p>
      <div className="no-print" style={{ display: 'flex', flexWrap: 'wrap', gap: 6, margin: '10px 0' }}>
        {TOPICS.map(x => <button key={x.key} type="button" className="tv-chip" aria-pressed={topic === x.key} onClick={() => pick(x.key)}>{x.label}</button>)}
      </div>
      {tp && <>
        <h3 style={{ fontSize: 17, fontWeight: 700, margin: '12px 0 4px' }}>{tp.label}</h3>
        {tp.key === 'health' && <div className="tv-warn">{T.healthNote}</div>}
        <div className="no-print" style={{ margin: '8px 0' }}>
          <button type="button" className="tv-btn tv-btn-primary" disabled={ai.loading} onClick={() => ai.run('/api/interpret', { ...base(ctx), mode: 'topic', topic: tp.key })}>{T.askAi}</button>
        </div>
        <AiAnswer s={ai} />
        <section style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <h4 style={{ fontWeight: 600 }}>{T.dataset}</h4>
            {paras.length > 0 && <button type="button" className="tv-chip no-print" aria-pressed={showZh} onClick={() => setShowZh(v => !v)}>{showZh ? T.hideOriginal : T.showOriginal}</button>}
          </div>
          <p className="tv-note">{T.datasetNote}</p>
          {status === 'missing' && <div className="tv-warn">{T.missing}</div>}
          {status === 'mismatch' && <div className="tv-warn">{T.mismatch}</div>}
          {status === 'error' && <div className="tv-warn">{app.ai.error}</div>}
          {(status === 'loading' || status === 'ok') && total > 0 && paras.length < total && <div className="tv-note">{T.translating(paras.length + 1, total)}</div>}
          {paras.map(p => (
            <div key={p.i} style={{ margin: '6px 0' }}>
              {p.vi ? <Markdown text={p.vi} /> : <div className="tv-note">{p.error}</div>}
              {p.ok === false && <div className="tv-note">⚠️ {T.unchecked}</div>}
              {(showZh || !p.vi) && <div lang="zh" className="tv-note" style={{ whiteSpace: 'pre-wrap' }}>{p.zh}</div>}
            </div>
          ))}
        </section>
      </>}
    </div>
  );
}

// ── Chat against the active chart ──
interface Msg { role: 'user' | 'assistant'; content: string }
export function ChatTab(ctx: Ctx) {
  const C = app.chat;
  const [history, setHistory] = useState<Msg[]>([]);
  const [q, setQ] = useState('');
  const [pending, setPending] = useState('');
  const ai = useAiStream();
  useEffect(() => { setHistory([]); ai.reset(); }, [ctx.chart]); // eslint-disable-line react-hooks/exhaustive-deps

  const ask = async (question: string) => {
    if (!question.trim() || ai.loading) return;
    if (pending && ai.text) setHistory(h => [...h, { role: 'user', content: pending }, { role: 'assistant', content: ai.text }]);
    const prior = pending && ai.text ? [...history, { role: 'user' as const, content: pending }, { role: 'assistant' as const, content: ai.text }] : history;
    setPending(question); setQ('');
    await ai.run('/api/chat', { ...base(ctx), question, messages: prior.slice(-10) });
  };

  return (
    <div>
      {!history.length && !pending && <p className="tv-note">{C.empty}</p>}
      {history.map((m, i) => (
        <div key={i} style={{ margin: '10px 0' }}>
          {m.role === 'user' ? <div className="tv-note"><b>{C.you}:</b> {m.content}</div> : <Markdown text={m.content} />}
        </div>
      ))}
      {pending && <div className="tv-note" style={{ marginTop: 10 }}><b>{C.you}:</b> {pending}</div>}
      <AiAnswer s={ai} />
      <div className="no-print" style={{ display: 'flex', flexWrap: 'wrap', gap: 6, margin: '12px 0' }}>
        {C.suggestions.map(s => <button key={s} type="button" className="tv-chip" onClick={() => ask(s)} disabled={ai.loading}>{s}</button>)}
      </div>
      <form className="no-print" onSubmit={e => { e.preventDefault(); ask(q); }} style={{ display: 'flex', gap: 8 }}>
        <input className="tv-input" value={q} onChange={e => setQ(e.target.value)} placeholder={C.placeholder} maxLength={2000} aria-label={C.placeholder} />
        <button type="submit" className="tv-btn tv-btn-primary" disabled={ai.loading || !q.trim()}>{common.actions.send}</button>
      </form>
      {(history.length > 0 || pending) && <button type="button" className="tv-btn no-print" style={{ marginTop: 8 }} onClick={() => { setHistory([]); setPending(''); ai.reset(); }}>{C.clear}</button>}
    </div>
  );
}

// ── Palace / star detail ──
export function DetailTab(ctx: Ctx & { palace: Palace | null; star: Star | null; onClearStar: () => void }) {
  const D = app.detail;
  const ai = useAiStream();
  const { palace, star } = ctx;
  useEffect(() => { ai.reset(); }, [palace, star]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!palace && !star) return <p className="tv-note">{D.pick}</p>;
  return (
    <div>
      {palace && <section>
        <h3 style={{ fontSize: 17, fontWeight: 700 }}>{D.palace(term(palace.name))}<Zh>{palace.name}</Zh></h3>
        {palace.daXianAge && <div className="tv-note">{D.daxian(palace.daXianAge[0], palace.daXianAge[1])}</div>}
        {palace.isEmpty && <div className="tv-note">{D.empty}: {(palace.borrowedStars ?? []).map(term).join(', ')}</div>}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, margin: '8px 0' }}>
          {palace.stars.map(s => <span key={s.name} className="tv-chip" title={s.name}>{term(s.name)}{s.brightnessRaw ? ` · ${term(s.brightnessRaw)}` : ''}{s.siHua ? ` · Hóa ${term(s.siHua)}` : ''}</span>)}
        </div>
        <button type="button" className="tv-btn tv-btn-primary no-print" disabled={ai.loading} onClick={() => ai.run('/api/interpret', { ...base(ctx), mode: 'palace', palaceBranch: palace.branch })}>{D.explainPalace}</button>
      </section>}
      {star && <section style={{ marginTop: 16 }}>
        <StarDetailPanel star={star} palaceName={palace?.name} onClose={ctx.onClearStar} />
        <button type="button" className="tv-btn tv-btn-primary no-print" style={{ marginTop: 8 }} disabled={ai.loading} onClick={() => ai.run('/api/interpret', { ...base(ctx), mode: 'star', starName: star.name })}>{D.explainStar}</button>
      </section>}
      <AiAnswer s={ai} />
    </div>
  );
}

// ── Đại Hạn / Lưu Niên ──
export function CyclesTab(ctx: Ctx) {
  const Y = app.cycles;
  const [year, setYear] = useState(() => new Date().getFullYear());
  const ai = useAiStream();
  useEffect(() => { ai.reset(); }, [ctx.chart]); // eslint-disable-line react-hooks/exhaustive-deps
  const { chart } = ctx;
  return (
    <div>
      <div className="no-print" style={{ display: 'flex', gap: 8, alignItems: 'end', flexWrap: 'wrap' }}>
        <label style={{ fontSize: 14 }}>{Y.year}<br />
          <input className="tv-input" type="number" min={1901} max={2100} value={year} onChange={e => setYear(Number(e.target.value) || year)} style={{ width: 120 }} />
        </label>
        <button type="button" className="tv-btn tv-btn-primary" disabled={ai.loading} onClick={() => ai.run('/api/interpret', { ...base(ctx), mode: 'cycle', year })}>{Y.analyze}</button>
      </div>
      <AiAnswer s={ai} />
      <h4 style={{ fontWeight: 600, marginTop: 16 }}>{Y.table}</h4>
      <ul className="tv-md" style={{ fontSize: 14 }}>
        {chart.daXians.map((dx, i) => (
          <li key={i} style={i === chart.currentDaXianIndex ? { fontWeight: 700, color: 'var(--ac)' } : undefined}>
            {dx.startAge}–{dx.endAge}: cung {term(dx.palaceName)}{i === chart.currentDaXianIndex ? ` (${Y.current})` : ''}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function PatternsTab({ patterns }: { patterns: PatternVi[] | null }) {
  if (!patterns) return <p className="tv-note">{app.chartPage.loadingFacts}</p>;
  return <PatternsCard patterns={patterns} />;
}
