/** /knowledge — 14 major stars, each linking to its meaning in 13 topics/palaces. */
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import Zh from '@/components/Zh';
import { term, common } from '@/lib/i18n';
import { knowledge as K, TOPIC_LABEL_VI } from '@/lib/i18n/vi/knowledge';
import { ALL_STARS, ALL_TOPICS, STAR_BRIEF_SEO, STAR_TO_SLUG } from '@/lib/seo/knowledge';
import { TOPIC_PALACE_NAME } from '@/lib/ziwei/db-analysis';

export const metadata = { title: `${K.title} · ${common.appName}` };

const chip = {
  fontSize: '12px', padding: '4px 10px', background: 'var(--ac-bg)', border: '1px solid var(--ac-bdr)',
  borderRadius: '999px', color: 'var(--tx-2)', textDecoration: 'none',
} as const;

export default function KnowledgeHomePage() {
  return (
    <div style={{ background: 'var(--bg-0)', minHeight: '100vh' }}>
      <SiteHeader />
      <main className="page-main" style={{ maxWidth: '1000px' }}>
        <h1>{K.title}</h1>
        <p>{K.intro(ALL_STARS.length * ALL_TOPICS.length)}</p>

        <h2>{K.starsHeading}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {ALL_STARS.map(star => (
            <a key={star} href={`#${STAR_TO_SLUG[star]}`} className="card-flat"
              style={{ display: 'block', padding: '12px 8px', textAlign: 'center', textDecoration: 'none', color: 'var(--tx-0)', fontWeight: 600 }}>
              {term(star)}
            </a>
          ))}
        </div>

        <div className="mt-10 space-y-4">
          {ALL_STARS.map(star => (
            <section key={star} id={STAR_TO_SLUG[star]} className="card-flat print-avoid-break" style={{ padding: '18px 20px', scrollMarginTop: '70px' }}>
              <h2 style={{ margin: '0 0 6px' }}>{term(star)}<Zh>{star}</Zh></h2>
              <p style={{ fontSize: '14px', marginBottom: '12px' }}>{STAR_BRIEF_SEO[star]}</p>
              <div className="flex flex-wrap gap-2">
                {ALL_TOPICS.map(t => (
                  <Link key={t} href={`/knowledge/${STAR_TO_SLUG[star]}/${t}`} style={chip}>
                    {term(TOPIC_PALACE_NAME[t])} · {TOPIC_LABEL_VI[t]}
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
