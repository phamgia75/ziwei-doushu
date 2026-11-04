/** /knowledge/[star]/[topic] — one major star in one topic/palace. Slugs are pinyin (see STAR_TO_SLUG). */
import Link from 'next/link';
import { notFound } from 'next/navigation';
import SiteHeader from '@/components/SiteHeader';
import Zh from '@/components/Zh';
import { term, common } from '@/lib/i18n';
import { knowledge as K, TOPIC_LABEL_VI } from '@/lib/i18n/vi/knowledge';
import type { TopicKey } from '@/lib/ziwei/db-analysis';
import { ALL_STARS, ALL_TOPICS, getKnowledge, STAR_BRIEF_SEO, STAR_TO_SLUG, SLUG_TO_STAR } from '@/lib/seo/knowledge';

export const dynamicParams = false;

// Every star × topic gets a page: the open-source STAR_DB is empty, so the page falls back to the star profile.
export async function generateStaticParams() {
  return ALL_STARS.flatMap(s => ALL_TOPICS.map(topic => ({ star: STAR_TO_SLUG[s], topic })));
}

function resolve(slug: string, topic: string) {
  const star = SLUG_TO_STAR[slug];
  if (!star || !ALL_TOPICS.includes(topic as TopicKey)) return null;
  return getKnowledge(star, topic as TopicKey);
}

export async function generateMetadata({ params }: { params: Promise<{ star: string; topic: string }> }) {
  const { star: slug, topic } = await params;
  const data = resolve(slug, topic);
  if (!data) return {};
  return { title: `${K.inPalace(term(data.star), term(data.palaceName))} · ${common.appName}` };
}

const chip = {
  fontSize: '12px', padding: '6px 12px', background: 'var(--bg-card)', border: '1px solid var(--ac-bdr)',
  borderRadius: '999px', color: 'var(--tx-2)', textDecoration: 'none',
} as const;

export default async function KnowledgePage({ params }: { params: Promise<{ star: string; topic: string }> }) {
  const { star: slug, topic: rawTopic } = await params;
  const data = resolve(slug, rawTopic);
  if (!data) notFound();
  const { star, topic, palaceName, parsed } = data;
  const starVi = term(star);
  const palaceVi = term(palaceName);
  const topicVi = TOPIC_LABEL_VI[topic];

  return (
    <div style={{ background: 'var(--bg-0)', minHeight: '100vh' }}>
      <SiteHeader />
      <main className="page-main" style={{ maxWidth: '760px' }}>
        <nav className="page-note no-print" style={{ marginBottom: '12px' }}>
          <Link href="/knowledge">{K.title}</Link> / <Link href={`/knowledge#${slug}`}>{starVi}</Link> / {palaceVi}
        </nav>
        <div className="page-note">{topicVi}</div>
        <h1>{K.inPalace(starVi, palaceVi)}<Zh>{star}</Zh></h1>
        {STAR_BRIEF_SEO[star] && <p>{STAR_BRIEF_SEO[star]}</p>}

        {data.exists ? (
          <section className="card-flat" style={{ padding: '16px 20px', marginTop: '20px' }}>
            <div className="page-note">{K.originalNote}</div>
            {(['dingdiao', 'lundian', 'yiju', 'chuchu'] as const).map(k => parsed[k] && (
              <div key={k} className="print-avoid-break">
                <h2>{K.sections[k]}</h2>
                <div lang="zh" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.9, color: 'var(--tx-1)' }}>{parsed[k]}</div>
              </div>
            ))}
          </section>
        ) : (
          <p className="card-tinted" style={{ padding: '14px 18px', marginTop: '20px' }}>{K.noContent}</p>
        )}

        <div className="card no-print" style={{ margin: '32px 0', padding: '20px', textAlign: 'center' }}>
          <div style={{ fontWeight: 600, color: 'var(--tx-0)', marginBottom: '4px' }}>{K.ctaTitle(topicVi)}</div>
          <p className="page-note" style={{ marginBottom: '12px' }}>{K.ctaDesc}</p>
          <Link href="/chart" className="btn-accent" style={{ color: '#fff' }}>{K.ctaButton} →</Link>
        </div>

        <h2>{K.otherTopics(starVi)}</h2>
        <div className="flex flex-wrap gap-2">
          {ALL_TOPICS.filter(t => t !== topic).map(t => (
            <Link key={t} href={`/knowledge/${slug}/${t}`} style={chip}>{term(getKnowledge(star, t).palaceName)} · {TOPIC_LABEL_VI[t]}</Link>
          ))}
        </div>

        <h2>{K.otherStars(palaceVi)}</h2>
        <div className="flex flex-wrap gap-2">
          {ALL_STARS.filter(s => s !== star).map(s => (
            <Link key={s} href={`/knowledge/${STAR_TO_SLUG[s]}/${topic}`} style={chip}>{term(s)}</Link>
          ))}
        </div>

        <p className="no-print" style={{ marginTop: '32px', textAlign: 'center' }}>
          <span className="page-note">{K.readClassics}</span><br />
          <Link href="/library">{K.classicsLink}</Link>
        </p>
        <p className="page-note" style={{ marginTop: '24px' }}>{common.disclaimer}</p>
      </main>
    </div>
  );
}
