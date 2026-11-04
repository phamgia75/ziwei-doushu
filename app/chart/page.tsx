'use client';
/**
 * /chart — TuVi AI workspace: birth form → interactive twelve-palace chart (computed in the
 * browser by the upstream engine) + topic readings, AI chat, palace/star detail, cycles, patterns.
 * AI requests send only {year, month, day, hour, gender}; the server regenerates the chart.
 */
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import BirthForm, { type BirthFormState } from '@/components/BirthForm';
import ChartBoard from '@/components/ChartBoard';
import ChartSummary from '@/components/ChartSummary';
import PdfExportButton from '@/components/PdfExportButton';
import SiteHeader from '@/components/SiteHeader';
import { TopicsTab, ChatTab, DetailTab, CyclesTab, PatternsTab, chartKey } from '@/components/workspace/Tabs';
import { reportStore } from '@/lib/client/report-store';
import { generateChart, setBrightnessSchool } from '@/lib/ziwei/algorithm';
import type { BirthInfo, Palace, Star, ZiweiChart } from '@/lib/ziwei/types';
import type { PatternVi, mingGongSummaryVi } from '@/lib/i18n/vi/patterns';
import { term, stemBranchVi, BRANCHES_VI } from '@/lib/i18n';
import { app } from '@/lib/i18n/vi/app';
import { common } from '@/lib/i18n/vi/common';
import { formToBirthInfo } from '@/lib/ziwei/share';
import { applyCalendar, vnCalendarDiff, type CalendarRegion } from '@/lib/calendar/vn-chart';
import { vnRegion } from '@/lib/geo/vn-places';
import { birthPayload } from '@/lib/client/sse';
import { getChart, listCharts, loadSettings, saveChart, type SavedChart, type Settings, DEFAULT_SETTINGS } from '@/lib/client/storage';

const P = app.chartPage;
type Tab = keyof typeof app.tabs;

function buildChart(info: BirthInfo, s: Settings, region: CalendarRegion): ZiweiChart {
  setBrightnessSchool(s.brightness);
  try { return generateChart(applyCalendar(info, s.calendar, region).info, { leapMonth: s.leapMonth }); } finally { setBrightnessSchool('default'); }
}

const fmtLunar = (l: { year: number; month: number; day: number; leap: boolean }) => `${l.day}/${l.month}${l.leap ? ` ${P.leap}` : ''}/${l.year}`;

function Workspace() {
  const router = useRouter();
  const params = useSearchParams();
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [form, setForm] = useState<BirthFormState | null>(null);
  const [savedId, setSavedId] = useState<string | undefined>();
  const [chart, setChart] = useState<ZiweiChart | null>(null);
  const [baseInfo, setBaseInfo] = useState<BirthInfo | null>(null);
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState<SavedChart[]>([]);
  const [tab, setTab] = useState<Tab>('topics');
  const [palace, setPalace] = useState<Palace | null>(null);
  const [star, setStar] = useState<Star | null>(null);
  const [extra, setExtra] = useState<{ patterns: PatternVi[]; mingSummary: ReturnType<typeof mingGongSummaryVi>; facts?: { id: string; text: string }[] } | null>(null);
  const [flash, setFlash] = useState('');
  const lastForm = useRef<BirthFormState | null>(null);

  useEffect(() => { setSettings(loadSettings()); setSaved(listCharts()); }, []);
  // PDF report entries belong to exactly one chart: switching/closing the chart drops the previous ones
  useEffect(() => {
    reportStore.setChart(chart && baseInfo ? chartKey({ birth: baseInfo, settings, region: vnRegion(form?.province, form?.city) }) : '');
  }, [chart, baseInfo, settings, form]);

  const open = useCallback((f: BirthFormState, info: BirthInfo, id?: string) => {
    const s = loadSettings();
    let c: ZiweiChart;
    try { c = buildChart(info, s, vnRegion(f.province, f.city)); } catch { setFlash(common.errors.invalidDate); return; } // e.g. corrupt saved record
    setSettings(s); setForm(f); setSavedId(id); setBaseInfo(info); setChart(c);
    setEditing(false); setPalace(null); setStar(null); setTab('topics'); setExtra(null);
  }, []);

  // ?id=<saved chart id> (ids only in URLs — never birth data)
  useEffect(() => {
    const id = params.get('id');
    const rec = id ? getChart(id) : undefined;
    if (!rec) return;
    open(rec.form, formToBirthInfo(rec.form, { lateZishi: loadSettings().lateZishi, equationOfTime: loadSettings().equationOfTime }), rec.id);
  }, [params, open]);

  // patterns + Mệnh summary come from the server (lib/ziwei/patterns.ts is server-only)
  useEffect(() => {
    if (!chart) return;
    const c = new AbortController();
    fetch('/api/chart', { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: c.signal,
      body: JSON.stringify({ birth: birthPayload(baseInfo ?? chart.birthInfo), options: { leapMonth: settings.leapMonth, brightness: settings.brightness, calendar: settings.calendar, calendarRegion: vnRegion(form?.province, form?.city) } }) })
      .then(r => r.ok ? r.json() : null).then(j => j && setExtra({ patterns: j.patterns, mingSummary: j.mingSummary, facts: j.facts })).catch(() => {});
    return () => c.abort();
  }, [chart, baseInfo, form, settings.leapMonth, settings.brightness, settings.calendar]);

  const onSave = () => {
    if (!form) return;
    const label = window.prompt(P.labelPrompt, form.name || `${form.day}/${form.month}/${form.year}`);
    if (label === null) return;
    const rec = saveChart(form, label || `${form.day}/${form.month}/${form.year}`, savedId);
    setFlash(rec ? P.saved : P.saveFailed);
    if (rec) { setSavedId(rec.id); setSaved(listCharts()); router.replace(`/chart?id=${rec.id}`); }
    setTimeout(() => setFlash(''), 2500);
  };

  if (!chart || editing) {
    return (
      <main className="page-main">
        <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 6 }}>{P.title}</h1>
        <p className="tv-note" style={{ marginBottom: 20 }}>{P.intro}</p>
        {flash && <div className="tv-warn" role="alert" style={{ marginBottom: 12 }}>{flash}</div>}
        <BirthForm
          initialData={editing ? form ?? undefined : undefined}
          lateZishi={settings.lateZishi}
          equationOfTime={settings.equationOfTime}
          onFormSave={f => { lastForm.current = f; }}
          onSubmit={info => lastForm.current && open(lastForm.current, info, editing ? savedId : undefined)}
        />
        {editing && <button type="button" className="tv-btn" style={{ marginTop: 12 }} onClick={() => setEditing(false)}>{common.actions.cancel}</button>}
        {!editing && <section style={{ marginTop: 28 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>{P.savedTitle}</h2>
          {saved.length === 0 ? <p className="tv-note">{P.noSaved}</p> : (
            <ul style={{ display: 'grid', gap: 6 }}>
              {saved.map(c => <li key={c.id}><a className="tv-btn" href={`/chart?id=${c.id}`}>{c.label} · {c.form.day}/{c.form.month}/{c.form.year}</a></li>)}
            </ul>)}
        </section>}
      </main>
    );
  }

  const b = chart.birthInfo;
  const li = chart.lunarInfo;
  const db = baseInfo ?? b;
  const region = vnRegion(form?.province, form?.city);
  const diff = vnCalendarDiff(db.year, db.month, db.day, region);
  const origDate = form ? `${form.day}/${form.month}/${form.year}` : '';
  const chartDate = baseInfo ? `${baseInfo.day}/${baseInfo.month}/${baseInfo.year}` : `${b.day}/${b.month}/${b.year}`;
  const ctx = { chart, birth: baseInfo ?? b, settings, region };
  const cal = baseInfo ? applyCalendar(baseInfo, settings.calendar, region) : null;
  const conv = [app.settings.lateZishiOpts[settings.lateZishi].split(' (')[0], app.settings.leapOpts[settings.leapMonth].split(':')[0].split(' (')[0], app.settings.brightOpts[settings.brightness as keyof typeof app.settings.brightOpts], app.settings.calendarOpts[settings.calendar].split(' (')[0].replace(/ UTC.*$/, ''), app.settings.eotOpts[settings.equationOfTime ? 'apparent' : 'mean'].split(' —')[0]].join(' · ');

  return (
    <main style={{ maxWidth: 1400, margin: '0 auto', padding: '16px 16px 64px' }}>
      <div className="print-avoid-break" style={{ marginBottom: 12 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>{form?.name || P.title}</h1>
        <p className="tv-note">
          {P.solar} {origDate}{form && !form.unknownTime ? ` ${form.clockHour.padStart(2, '0')}:${form.clockMinute.padStart(2, '0')}` : ''} · {P.lunar} {Math.abs(li.lunarDay)}/{Math.abs(li.lunarMonth)}{li.isLeapMonth ? ` ${P.leap}` : ''} năm {stemBranchVi(li.yearStem, li.yearBranch)} · {P.hourLabel} {BRANCHES_VI[b.hour]} · {common.gender[b.gender]} ({term(chart.yinYangGender)}) · {term(chart.wuxingJuName)}
        </p>
        {origDate !== chartDate && <p className="tv-note">{P.chartDateNote(chartDate)}</p>}
        <p className="tv-note">{P.conventions(conv)}</p>
        {settings.calendar === 'cn' && diff.differs && <div className="tv-warn" style={{ marginTop: 6 }}>{P.vnLunarWarn(fmtLunar(diff.vn), fmtLunar(diff.cn))}</div>}
        {settings.calendar === 'vn' && cal?.remapped && <div className="tv-warn" style={{ marginTop: 6 }}>{P.vnCalendarUsed(fmtLunar(diff.vn))}</div>}
        {settings.calendar === 'vn' && cal?.unavailable && <div className="tv-warn" style={{ marginTop: 6 }}>{P.vnCalendarUnavailable(fmtLunar(diff.vn))}</div>}
        <div className="no-print" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
          <button type="button" className="tv-btn tv-btn-primary" onClick={onSave}>{savedId ? `✓ ${P.save}` : P.save}</button>
          <button type="button" className="tv-btn" onClick={() => window.print()}>{P.print}</button>
          <PdfExportButton chart={chart} form={form} birth={baseInfo} settings={settings} facts={extra?.facts} patterns={extra?.patterns}
            label={saved.find(c => c.id === savedId)?.label || form?.name || undefined} />
          <button type="button" className="tv-btn" onClick={() => setEditing(true)}>{P.edit}</button>
          <button type="button" className="tv-btn" onClick={() => { setChart(null); setForm(null); setSavedId(undefined); router.replace('/chart'); }}>{P.newChart}</button>
          <a className="tv-btn" href="/heming">{P.compare}</a>
          {flash && <span className="tv-note" role="status" style={{ alignSelf: 'center' }}>{flash}</span>}
        </div>
      </div>

      <div className="tv-chart-layout">
        <div style={{ minWidth: 0 }}>
          <ChartBoard
            chart={chart}
            onPalaceSelect={p => { setPalace(p); setStar(null); setTab('detail'); }}
            onStarSelect={(s, p) => { setStar(s); setPalace(p); setTab('detail'); }}
          />
          {extra && <div style={{ marginTop: 16 }}><ChartSummary chart={chart} patterns={extra.patterns} mingSummary={extra.mingSummary} /></div>}
        </div>
        <section className="tv-panel" style={{ minWidth: 0 }}>
          <div className="tv-tabs" role="tablist">
            {(Object.keys(app.tabs) as Tab[]).map(k => (
              <button key={k} type="button" role="tab" className="tv-tab" aria-selected={tab === k} onClick={() => setTab(k)}>{app.tabs[k]}</button>
            ))}
          </div>
          <div style={{ padding: 16 }}>
            <div hidden={tab !== 'topics'}><TopicsTab {...ctx} /></div>
            <div hidden={tab !== 'chat'}><ChatTab {...ctx} /></div>
            <div hidden={tab !== 'detail'}><DetailTab {...ctx} palace={palace} star={star} onClearStar={() => setStar(null)} /></div>
            <div hidden={tab !== 'cycles'}><CyclesTab {...ctx} /></div>
            <div hidden={tab !== 'patterns'}><PatternsTab patterns={extra?.patterns ?? null} /></div>
          </div>
        </section>
      </div>
      <p className="tv-note" style={{ marginTop: 24 }}>{common.disclaimer}</p>
    </main>
  );
}

export default function ChartPage() {
  return (
    <>
      <SiteHeader />
      <Suspense fallback={<main className="page-main tv-note">{common.actions.loading}</main>}>
        <Workspace />
      </Suspense>
    </>
  );
}
