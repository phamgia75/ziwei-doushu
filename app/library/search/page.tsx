/** /library/search?q=… — full-text search over the original Chinese texts. */
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import { common } from '@/lib/i18n';
import { library as L, BOOK_VI } from '@/lib/i18n/vi/library';
import { searchClassics, getParagraphById } from '@/lib/classics';
import LibrarySearch from '../LibrarySearch';

export const metadata = { title: `${L.searchTitle} · ${L.title} · ${common.appName}` };

// Example queries (original Chinese terms) shown when nothing matched.
const EXAMPLES = ['七杀朝斗', '双禄朝垣', '化忌', '紫微', '命宫', '机月同梁']; // i18n-ok: search terms in the original text, rendered with lang="zh"

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const sp = await searchParams;
  const q = sp.q?.trim() || '';
  const hits = q ? searchClassics(q, 50) : [];

  return (
    <div style={{ background: 'var(--bg-0)', minHeight: '100vh' }}>
      <SiteHeader />
      <main className="page-main" style={{ maxWidth: '760px' }}>
        <nav className="page-note no-print"><Link href="/library">{L.backToLibrary}</Link></nav>
        <h1 style={{ marginTop: '12px' }}>{L.searchTitle}</h1>
        <div style={{ margin: '12px 0 20px' }}><LibrarySearch initial={q} /></div>
        {q && <p>{L.keyword}: <strong lang="zh">「{q}」</strong> — {L.found(hits.length)}</p>}

        {hits.length === 0 ? (
          <div className="card-flat" style={{ padding: '32px 20px', textAlign: 'center' }}>
            {q ? (
              <>
                <p>{L.notFound}</p>
                <p className="page-note">
                  {L.tryThese}{' '}
                  {EXAMPLES.map(e => (
                    <Link key={e} href={`/library/search?q=${encodeURIComponent(e)}`} lang="zh" style={{ marginRight: '10px' }}>{e}</Link>
                  ))}
                </p>
              </>
            ) : <p>{L.enterQuery}</p>}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {hits.map((hit, i) => {
              const chapterIdx = getParagraphById(hit.paragraphId)?.chapterIdx ?? 0;
              return (
                <Link key={i} href={`/library/${hit.bookSlug}/${chapterIdx}#${hit.paragraphId}`} className="card-flat"
                  style={{ display: 'block', padding: '14px 18px', textDecoration: 'none', color: 'inherit' }}>
                  <div className="page-note" style={{ marginBottom: '6px' }}>
                    <span style={{ color: 'var(--ac)', fontWeight: 600 }}>{BOOK_VI[hit.bookSlug]?.title ?? hit.bookSlug}</span>
                    {' · '}<span lang="zh">{hit.chapterTitle}</span>
                  </div>
                  {/* snippet is HTML-escaped by searchClassics; only <mark> is injected. */}
                  <div lang="zh" style={{ fontSize: '15px', color: 'var(--tx-0)', lineHeight: 1.9 }} dangerouslySetInnerHTML={{ __html: hit.snippet }} />
                </Link>
              );
            })}
          </div>
        )}
      </main>
      <style>{`mark { background: var(--ac-bg); color: var(--ac); padding: 0 2px; border-radius: 2px; font-weight: 600; }`}</style>
    </div>
  );
}
