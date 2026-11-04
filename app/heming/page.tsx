'use client';
import { useState, useCallback, useRef, useEffect } from 'react';
import BirthForm, { type BirthFormState } from '@/components/BirthForm';
import { formToBirthInfo as toBirthInfo } from '@/lib/ziwei/share';
import { generateChart as buildChart, setBrightnessSchool } from '@/lib/ziwei/algorithm';
import { loadSettings, requestProvider, DEFAULT_SETTINGS, type Settings } from '@/lib/client/storage';
import type { BirthInfo, ZiweiChart } from '@/lib/ziwei/types';
import { useTheme } from '@/components/ThemeProvider';
import SiteHeader from '@/components/SiteHeader';
import { term, STEMS_VI, BRANCHES_VI } from '@/lib/i18n';
import { heming as H } from '@/lib/i18n/vi/heming';

// AI text renderer (same format as InsightPanel)
function AiContent({ text, streaming }: { text: string; streaming?: boolean }) {
  const lines = text.split('\n');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {lines.map((line, i) => {
        const sectionMatch = line.match(/^\*\*【(.+?)】\*\*$/);
        if (sectionMatch) {
          return (
            <div key={i} style={{ paddingTop: i === 0 ? 0 : '14px', paddingBottom: '4px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ac)', letterSpacing: '0.04em' }}>
                【{sectionMatch[1]}】
              </span>
            </div>
          );
        }
        if (line.trim() === '') return <div key={i} style={{ height: '4px' }} />;
        const parts = line.split(/\*\*(.+?)\*\*/);
        return (
          <div key={i} style={{ fontSize: '13px', lineHeight: 1.75, color: 'var(--tx-2)' }}>
            {parts.map((part, j) =>
              j % 2 === 0
                ? part
                : <strong key={j} style={{ fontWeight: 500, color: 'var(--tx-0)' }}>{part}</strong>
            )}
          </div>
        );
      })}
      {streaming && (
        <span style={{
          display: 'inline-block', width: '7px', height: '13px',
          background: 'var(--ac)', opacity: 0.5, borderRadius: '2px',
          animation: 'pulse 1s ease-in-out infinite',
          verticalAlign: 'middle', marginLeft: '2px',
        }} />
      )}
    </div>
  );
}

export default function HemingPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [chartA, setChartA] = useState<ZiweiChart | null>(null);
  const [chartB, setChartB] = useState<ZiweiChart | null>(null);
  // BirthForm onFormSave syncs both forms here; one button generates both charts.
  const [formA, setFormA] = useState<BirthFormState | null>(null);
  const [formB, setFormB] = useState<BirthFormState | null>(null);

  const [analysis, setAnalysis] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [question, setQuestion] = useState('');
  const [analysisError, setAnalysisError] = useState(false);
  // /api/heming answered 404 (backend/AI not available): show a setup hint instead of "retry".
  const [apiMissing, setApiMissing] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const analysisRef = useRef<HTMLDivElement>(null);

  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [relation, setRelation] = useState<keyof typeof H.relations>('love');
  useEffect(() => setSettings(loadSettings()), []);

  // The region between "表单是否填齐" and "const cardStyle" is executed by the upstream regression
  // tests with their own fetch/formToBirthInfo/generateChart. These component-scope wrappers apply
  // the user's conventions, AI provider and relation type without touching that region.
  const formToBirthInfo = useCallback((f: BirthFormState) => toBirthInfo(f, { lateZishi: settings.lateZishi }), [settings.lateZishi]);
  const fetch = useCallback((url: string, init: RequestInit) => window.fetch(url, {
    ...init,
    body: JSON.stringify({ ...JSON.parse(String(init.body)), relation, provider: requestProvider(settings),
      options: { leapMonth: settings.leapMonth, brightness: settings.brightness } }),
  }), [relation, settings]);
  // Charts are generated in the browser with the local engine.
  const generateChart = useCallback(async (info: BirthInfo): Promise<ZiweiChart | null> => {
    setBrightnessSchool(settings.brightness);
    try {
      return buildChart(info, { leapMonth: settings.leapMonth });
    } catch {
      return null;
    } finally {
      setBrightnessSchool('default');
    }
  }, [settings.brightness, settings.leapMonth]);

  // 表单是否填齐
  const isFormReady = (f: BirthFormState | null): boolean =>
    !!(f && f.year && f.month && f.day && f.gender && (f.unknownTime || (f.clockHour !== '' && f.clockMinute !== '')));

  // ─── 统一入口：起盘 + 合盘分析 ─────────────────────────────
  const runAnalysis = useCallback(async (q?: string) => {
    setFormError(null);
    if (!isFormReady(formA) || !isFormReady(formB)) {
      setFormError(H.formIncomplete);
      return;
    }
    setAnalyzing(true);
    setAnalysis('');
    setAnalysisError(false);

    try {
      // 每次按当前表单起盘，避免编辑出生信息后复用旧盘。
      const [cA, cB] = await Promise.all([
        generateChart(formToBirthInfo(formA!)),
        generateChart(formToBirthInfo(formB!)),
      ]);
      if (!cA || !cB) {
        setAnalysisError(true);
        setAnalyzing(false);
        return;
      }
      setChartA(cA);
      setChartB(cB);

      const res = await fetch('/api/heming', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chartA: cA, chartB: cB, question: q ?? undefined }),
      });
      if (res.status === 404) { setApiMissing(true); throw new Error('api-missing'); }
      if (!res.ok || !res.body) throw new Error();

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let text = '';
      let pendingLine = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        pendingLine += decoder.decode(value, { stream: true });
        const lines = pendingLine.split('\n');
        pendingLine = lines.pop() ?? '';
        for (const rawLine of lines) {
          const line = rawLine.endsWith('\r') ? rawLine.slice(0, -1) : rawLine;
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6);
          if (data === '[DONE]') break;
          try {
            const delta = JSON.parse(data).delta?.text ?? '';
            text += delta;
            setAnalysis(text);
          } catch { /* skip */ }
        }
      }
      // scroll to analysis
      setTimeout(() => analysisRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    } catch {
      setAnalysisError(true);
    } finally {
      setAnalyzing(false);
    }
  }, [formA, formB, generateChart, fetch, formToBirthInfo]);

  const cardStyle = {
    background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.9)',
    border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(200,160,60,0.2)'}`,
    borderRadius: '16px',
    padding: '24px',
  };

  const labelStyle = {
    fontSize: '12px', letterSpacing: '0.08em', color: 'var(--ac)', fontWeight: 600,
    marginBottom: '16px', display: 'block',
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-0)' }}>
      <SiteHeader />

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 16px 80px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '26px', fontWeight: 600, color: 'var(--tx-0)', marginBottom: '6px', fontFamily: 'var(--font-serif)' }}>
            {H.title}
          </h1>
          <div style={{ fontSize: '12px', color: 'var(--ac)', marginBottom: '8px' }}>{H.subtitle}</div>
          <p style={{ fontSize: '14px', color: 'var(--tx-3)', lineHeight: 1.6, maxWidth: '640px', margin: '0 auto' }}>{H.intro}</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}
          className="heming-grid">
          <div style={cardStyle}>
            <span style={labelStyle}>{H.personA}</span>
            <BirthForm hideSubmit onSubmit={() => {}} onFormSave={setFormA} />
          </div>
          <div style={cardStyle}>
            <span style={labelStyle}>{H.personB}</span>
            <BirthForm hideSubmit onSubmit={() => {}} onFormSave={setFormB} />
          </div>
        </div>

        {chartA && chartB && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }} className="heming-grid">
            <ChartFacts label={H.personA} chart={chartA} style={cardStyle} />
            <ChartFacts label={H.personB} chart={chartB} style={cardStyle} />
          </div>
        )}

        <div ref={analysisRef} style={{
          ...cardStyle,
          minHeight: '320px',
          padding: '32px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: (!analysis && !analyzing) ? 'center' : 'flex-start',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: (analysis || analyzing) ? '20px' : '24px' }}>
            <span style={{ color: 'var(--ac)', opacity: 0.6 }}>◉</span>
            <span style={{ fontSize: '12px', letterSpacing: '0.08em', color: 'var(--tx-3)' }}>{H.sectionTitle}</span>
          </div>

          {!analysis && !analyzing && (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <div style={{ fontSize: '14px', color: 'var(--tx-3)', marginBottom: '24px', lineHeight: 1.7 }}>{H.emptyHint}</div>
              <label style={{ display: 'inline-flex', gap: 8, alignItems: 'center', marginBottom: 16, fontSize: 14 }}>
                {H.relationLabel}
                <select className="tv-input" style={{ width: 'auto' }} value={relation} onChange={e => setRelation(e.target.value as keyof typeof H.relations)}>
                  {(Object.keys(H.relations) as (keyof typeof H.relations)[]).map(k => <option key={k} value={k}>{H.relations[k]}</option>)}
                </select>
              </label>
              <br />
              <button
                onClick={() => runAnalysis()}
                className="no-print"
                style={{
                  padding: '14px 40px', borderRadius: 'var(--r-pill)', border: 'none',
                  background: 'linear-gradient(135deg, #9a6210, #c88020)',
                  color: '#fff8e8', fontSize: '15px', fontWeight: 600,
                  cursor: 'pointer', boxShadow: '0 4px 16px rgba(140,100,20,0.25)',
                }}
              >
                {H.start}
              </button>
              {formError && <div style={{ marginTop: '20px', fontSize: '14px', color: '#dc2626' }}>{formError}</div>}
            </div>
          )}

          {analyzing && !analysis && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '40px 0', color: 'var(--tx-3)', fontSize: '14px' }}>
              <div style={{
                width: '14px', height: '14px',
                border: '2px solid var(--bdr-med)', borderTopColor: 'var(--ac)',
                borderRadius: '50%', animation: 'spin 0.8s linear infinite',
              }} />
              {H.comparing}
            </div>
          )}

          {analysis && <AiContent text={analysis} streaming={analyzing} />}

          {analysisError && (
            <div role="alert" style={{ padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--bdr)', background: 'var(--bg-card)', fontSize: '14px', color: 'var(--tx-2)', marginTop: '12px' }}>
              {apiMissing ? <>{H.apiMissing} <a href="/settings" style={{ color: 'var(--ac)' }}>→</a></> : H.failed}
            </div>
          )}
        </div>

        {analysis && (
          <div className="no-print" style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px' }}>
            <div style={{ fontSize: '12px', color: 'var(--tx-3)', marginBottom: '4px' }}>{H.followUpTitle}</div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {H.quickQuestions.map(q => (
                <button
                  key={q}
                  onClick={() => { setQuestion(q); runAnalysis(q); }}
                  disabled={analyzing}
                  style={{
                    fontSize: '13px', padding: '6px 14px',
                    borderRadius: 'var(--r-pill)', border: '1px solid var(--bdr-med)',
                    background: 'transparent', color: 'var(--tx-2)',
                    cursor: analyzing ? 'not-allowed' : 'pointer', opacity: analyzing ? 0.5 : 1,
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={question}
                onChange={e => setQuestion(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !analyzing) runAnalysis(question || undefined); }}
                placeholder={H.placeholder}
                aria-label={H.followUpTitle}
                disabled={analyzing}
                className="input-base"
                style={{ fontSize: '14px', flex: 1 }}
              />
              <button
                onClick={() => runAnalysis(question || undefined)}
                disabled={analyzing}
                style={{
                  padding: '10px 20px', borderRadius: 'var(--r-sm)', border: 'none',
                  background: analyzing ? 'var(--bg-2)' : 'var(--tx-0)',
                  color: analyzing ? 'var(--tx-3)' : 'var(--bg-0)',
                  fontSize: '14px', fontWeight: 500,
                  cursor: analyzing ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap',
                }}
              >
                {analyzing ? H.analyzing : H.ask}
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 680px) {
          .heming-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

/** Key facts of one chart, shown in Vietnamese via term(). */
function ChartFacts({ label, chart, style }: { label: string; chart: ZiweiChart; style: React.CSSProperties }) {
  const ming = chart.palaces.find(p => p.isMingGong) ?? chart.palaces.find(p => p.branch === chart.mingGongBranch);
  const major = ming?.stars.filter(s => s.type === 'major') ?? [];
  return (
    <div className="print-avoid-break" style={{ ...style, padding: '16px 20px' }}>
      <div style={{ fontSize: '12px', color: 'var(--ac)', fontWeight: 600, marginBottom: '6px' }}>{label} · {H.factsTitle}</div>
      <div style={{ fontSize: '14px', color: 'var(--tx-1)', lineHeight: 1.7 }}>
        {H.mingPalace}{ming ? ` (${STEMS_VI[ming.stem]} ${BRANCHES_VI[ming.branch]})` : ''}:{' '}
        <strong>{major.length ? major.map(s => term(s.name) + (s.siHua ? ` ${term(`化${s.siHua}`)}` : '')).join(', ') : H.noMajor}</strong>
        <br />
        {term('五行局')}: {term(chart.wuxingJuName)}
        {chart.mingZhu && <> · {term('命主')}: {term(chart.mingZhu)}</>}
        {chart.shenZhu && <> · {term('身主')}: {term(chart.shenZhu)}</>}
      </div>
    </div>
  );
}
