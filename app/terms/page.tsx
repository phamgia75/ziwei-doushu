import SiteHeader from '@/components/SiteHeader';
import { common } from '@/lib/i18n';
import { terms } from '@/lib/i18n/vi/pages';

export const metadata = { title: `${terms.title} · ${common.appName}` };

export default function TermsPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-0)' }}>
      <SiteHeader />
      <main className="page-main">
        <h1>{terms.title}</h1>
        <p>{common.disclaimer}</p>
        <ul>{terms.points.map(t => <li key={t}>{t}</li>)}</ul>
      </main>
    </div>
  );
}
