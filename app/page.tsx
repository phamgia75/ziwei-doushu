import SavedChartsList from '@/components/SavedChartsList';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import { common } from '@/lib/i18n';
import { home } from '@/lib/i18n/vi/pages';

/** Wraps runs of Han characters (dataset/author names in the attribution) as secondary Chinese text. */
function ZhRuns({ text }: { text: string }) {
  return <>{text.split(/(\p{Script=Han}+)/u).map((part, i) => (i % 2 ? <span key={i} lang="zh">{part}</span> : part))}</>;
}

export default function HomePage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-0)' }}>
      <SiteHeader />
      <main className="page-main">
        <h1>{home.title}</h1>
        <p style={{ fontSize: '16px' }}>{home.intro}</p>
        <p style={{ marginTop: '20px' }}>
          <Link href="/chart" className="btn-accent" style={{ color: '#fff' }}>{home.cta} →</Link>
        </p>

        <div className="home-cards">
          {home.cards.map(c => (
            <Link key={c.href} href={c.href} className="card home-card">
              <strong>{c.title}</strong>
              <span>{c.desc}</span>
            </Link>
          ))}
        </div>

        <section id="saved-charts" aria-label={home.savedTitle}><SavedChartsList /></section>

        <footer style={{ marginTop: '40px', paddingTop: '16px', borderTop: '1px solid var(--bdr)' }}>
          <p className="page-note">{common.disclaimer}</p>
          <p className="page-note"><ZhRuns text={common.attribution} /></p>
          <p className="page-note no-print" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <Link href="/privacy">{home.privacyLink}</Link>
            <Link href="/terms">{home.termsLink}</Link>
            <Link href="/about">{home.aboutLink}</Link>
          </p>
        </footer>
      </main>
    </div>
  );
}
