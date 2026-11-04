'use client';
import { useEffect, useState } from 'react';
import { deleteChart, listCharts, type SavedChart } from '@/lib/client/storage';
import { app } from '@/lib/i18n/vi/app';
import { common } from '@/lib/i18n/vi/common';

/** Saved charts from this browser's localStorage (nothing is fetched from the server). */
export default function SavedChartsList() {
  const [list, setList] = useState<SavedChart[] | null>(null);
  useEffect(() => setList(listCharts()), []);
  if (!list) return null;
  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 600, margin: '24px 0 8px' }}>{app.chartPage.savedTitle}</h2>
      {list.length === 0 ? <p className="tv-note">{app.chartPage.noSaved}</p> : (
        <ul style={{ display: 'grid', gap: 6 }}>
          {list.map(c => (
            <li key={c.id} style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <a className="tv-btn" href={`/chart?id=${c.id}`}>{c.label} · {c.form.day}/{c.form.month}/{c.form.year}</a>
              <button type="button" className="tv-btn" aria-label={`${common.actions.delete} ${c.label}`} onClick={() => { deleteChart(c.id); setList(listCharts()); }}>{common.actions.delete}</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
