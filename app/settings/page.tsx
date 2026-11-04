'use client';
import { useEffect, useRef, useState } from 'react';
import SiteHeader from '@/components/SiteHeader';
import { app } from '@/lib/i18n/vi/app';
import { clearAllLocal, exportAll, importAll, loadSettings, saveSettings, DEFAULT_SETTINGS, type ProviderChoice, type Settings } from '@/lib/client/storage';

const S = app.settings;
interface Health { ai: { ollama: { reachable: boolean; selected?: string; error?: string }; external: { allowed: boolean; openai: boolean; anthropic: boolean } } }

export default function SettingsPage() {
  const [s, setS] = useState<Settings>(DEFAULT_SETTINGS);
  const [health, setHealth] = useState<Health | null>(null);
  const [msg, setMsg] = useState('');
  const file = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setS(loadSettings());
    fetch('/api/health').then(r => r.json()).then(setHealth).catch(() => setHealth(null));
  }, []);

  const update = (patch: Partial<Settings>) => {
    const next = { ...s, ...patch };
    if (next.provider === 'ollama') next.externalConsent = false;
    setS(next); saveSettings(next); setMsg(S.saved); setTimeout(() => setMsg(''), 1500);
  };
  const configured = (p: ProviderChoice) => p === 'ollama' || !!health?.ai.external[p];

  const download = () => {
    const url = URL.createObjectURL(new Blob([exportAll()], { type: 'application/json' }));
    const a = document.createElement('a'); a.href = url; a.download = `tuvi-ai-${new Date().toISOString().slice(0, 10)}.json`; a.click();
    URL.revokeObjectURL(url);
  };

  const section = { marginTop: 28 } as const;
  return (
    <>
      <SiteHeader />
      <main className="page-main">
        <h1 style={{ fontSize: 26, fontWeight: 700 }}>{S.title}</h1>
        {msg && <p className="tv-note" role="status">{msg}</p>}

        <section style={section}>
          <h2 style={{ fontSize: 18, fontWeight: 600 }}>{S.aiTitle}</h2>
          <p className="tv-note" data-testid="ai-status">{S.status}: {!health ? S.checking : health.ai.ollama.reachable ? S.ollamaOk(health.ai.ollama.selected ?? '?') : S.ollamaDown(health.ai.ollama.error ?? '')}</p>
          <fieldset style={{ marginTop: 10, display: 'grid', gap: 8 }}>
            <legend style={{ fontWeight: 600, marginBottom: 6 }}>{S.provider}</legend>
            {(Object.keys(S.providers) as ProviderChoice[]).map(p => (
              <label key={p} style={{ display: 'flex', gap: 8, alignItems: 'center', minHeight: 40, opacity: configured(p) ? 1 : 0.5 }}>
                <input type="radio" name="provider" checked={s.provider === p} disabled={!configured(p)} onChange={() => update({ provider: p, externalConsent: false })} />
                {S.providers[p]}{!configured(p) && ` — ${S.notConfigured}`}
              </label>
            ))}
          </fieldset>
          {s.provider !== 'ollama' && (
            <label className="tv-warn" style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <input type="checkbox" checked={s.externalConsent} onChange={e => update({ externalConsent: e.target.checked })} />
              {S.consent}
            </label>
          )}
          <p className="tv-note" style={{ marginTop: 6 }}>{S.externalHelp}</p>
        </section>

        <section style={section}>
          <h2 style={{ fontSize: 18, fontWeight: 600 }}>{S.convTitle}</h2>
          {([['lateZishi', S.lateZishi, S.lateZishiOpts], ['leapMonth', S.leapMonth, S.leapOpts], ['brightness', S.brightness, S.brightOpts]] as const).map(([key, label, opts]) => (
            <label key={key} style={{ display: 'block', marginTop: 12 }}>
              <span style={{ fontWeight: 600 }}>{label}</span>
              <select className="tv-input" value={s[key]} onChange={e => update({ [key]: e.target.value } as Partial<Settings>)}>
                {Object.entries(opts).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </label>
          ))}
          <p className="tv-note" style={{ marginTop: 8 }}>{S.convNote}</p>
        </section>

        <section style={section}>
          <h2 style={{ fontSize: 18, fontWeight: 600 }}>{S.privacyTitle}</h2>
          <p className="tv-note">{S.privacyText}</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
            <button type="button" className="tv-btn" onClick={download}>{S.exportBtn}</button>
            <button type="button" className="tv-btn" onClick={() => file.current?.click()}>{S.importBtn}</button>
            <input ref={file} type="file" accept="application/json,.json" hidden onChange={async e => {
              const f = e.target.files?.[0]; if (!f) return;
              try { const r = importAll(await f.text()); setMsg(S.imported(r.added, r.skipped)); } catch (err) { setMsg((err as Error).message); }
              e.target.value = '';
            }} />
            <button type="button" className="tv-btn" onClick={() => { if (window.confirm(S.clearLocalConfirm)) { clearAllLocal(); setS(DEFAULT_SETTINGS); setMsg(S.cleared); } }}>{S.clearLocal}</button>
            <button type="button" className="tv-btn" onClick={async () => {
              const r = await fetch('/api/privacy', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'clear-server-cache' }) }).then(x => x.json()).catch(() => null);
              setMsg(r?.ok ? S.serverCleared(r.removed.datasetRecords, r.removed.translations) : app.ai.error);
            }}>{S.clearServer}</button>
          </div>
        </section>
      </main>
    </>
  );
}
