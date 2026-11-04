'use client';
/** "Tải báo cáo PDF": builds the report in the browser (pdf-lib) and downloads it. Nothing is uploaded. */
import { useState } from 'react';
import { buildReportPdf, fetchReportFonts, type ReportInput } from '@/lib/client/pdf-report';
import { reportStore } from '@/lib/client/report-store';
import { pdf as T } from '@/lib/i18n/vi/pdf';

type Props = Omit<ReportInput, 'fonts' | 'entries' | 'generatedAt'> & { label?: string };

const slug = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[đĐ]/g, 'd')
  .replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase().slice(0, 60);

export default function PdfExportButton({ label, ...input }: Props) {
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  const run = async () => {
    setBusy(true);
    try {
      setStatus(T.loadingFonts);
      const fonts = await fetchReportFonts();
      setStatus(T.building);
      const bytes = await buildReportPdf({ ...input, fonts, entries: reportStore.list() });
      const d = new Date();
      const name = `tuvi-${slug(label ?? '') || `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`}.pdf`;
      const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
      setStatus(T.done);
      setTimeout(() => setStatus(''), 2500);
    } catch (e) {
      setStatus(T.error(e instanceof Error ? e.message : String(e)));
    } finally { setBusy(false); }
  };

  return (
    <>
      <button type="button" className="tv-btn" onClick={run} disabled={busy} aria-busy={busy} title={T.hint}>{busy ? T.building : T.button}</button>
      {status && <span className="tv-note" role="status" style={{ alignSelf: 'center' }}>{status}</span>}
    </>
  );
}
