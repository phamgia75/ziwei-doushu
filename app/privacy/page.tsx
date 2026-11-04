import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import { common } from '@/lib/i18n';
import { privacy } from '@/lib/i18n/vi/pages';

export const metadata = { title: `${privacy.title} · ${common.appName}` };

export default function PrivacyPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-0)' }}>
      <SiteHeader />
      <main className="page-main">
        <h1>{privacy.title}</h1>
        <p>{privacy.intro}</p>
        {privacy.sections.map(s => (
          <section key={s.h} className="print-avoid-break">
            <h2>{s.h}</h2>
            {s.p.map(t => <p key={t}>{t}</p>)}
          </section>
        ))}
        <p style={{ marginTop: '24px' }}><Link href="/settings">{privacy.settingsLink} →</Link></p>
      </main>
    </div>
  );
}
