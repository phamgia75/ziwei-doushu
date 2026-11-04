/** /library/[book]/[chapter] — one chapter, original Chinese text. */
import Link from 'next/link';
import { notFound } from 'next/navigation';
import SiteHeader from '@/components/SiteHeader';
import { common } from '@/lib/i18n';
import { library as L, BOOK_VI } from '@/lib/i18n/vi/library';
import { ALL_BOOKS, getChapter } from '@/lib/classics';

export async function generateStaticParams() {
  return ALL_BOOKS.flatMap(b => b.chapters.map((_, i) => ({ book: b.slug, chapter: String(i) })));
}

export async function generateMetadata({ params }: { params: Promise<{ book: string; chapter: string }> }) {
  const { book: bookSlug, chapter: chIdx } = await params;
  const vi = BOOK_VI[bookSlug];
  if (!vi || !getChapter(bookSlug, parseInt(chIdx))) return {};
  return { title: `${vi.title} · ${parseInt(chIdx) + 1} · ${common.appName}` };
}

const navCard = {
  flex: 1, padding: '12px 16px', textDecoration: 'none', color: 'var(--tx-0)',
} as const;

export default async function ChapterPage({ params }: { params: Promise<{ book: string; chapter: string }> }) {
  const { book: bookSlug, chapter: chIdx } = await params;
  const result = getChapter(bookSlug, parseInt(chIdx));
  if (!result) notFound();

  const { book, chapter, chapterIdx } = result;
  const vi = BOOK_VI[book.slug];
  const prevIdx = chapterIdx - 1;
  const nextIdx = chapterIdx + 1;

  return (
    <div style={{ background: 'var(--bg-0)', minHeight: '100vh' }}>
      <SiteHeader />
      <article className="page-main" style={{ maxWidth: '760px' }}>
        <nav className="page-note no-print"><Link href={`/library/${book.slug}`}>{L.backToBook(vi?.title ?? '')}</Link></nav>
        <div className="page-note" style={{ marginTop: '12px' }}>{vi?.title} · {vi?.dynasty}</div>
        <h1 lang="zh">{chapter.title}</h1>
        {chapter.subtitle && <p lang="zh">{chapter.subtitle}</p>}

        {/* On-demand AI translation of this chapter is mounted here. */}
        <div id="chapter-translation" className="no-print" data-book={book.slug} data-chapter={chapterIdx} />

        <p className="page-note" style={{ margin: '16px 0 8px' }}>{L.originalNote}</p>
        <div className="card-flat" style={{ padding: '24px 22px' }}>
          {chapter.paragraphs.map((p, i) => (
            <div key={p.id} id={p.id} className="print-avoid-break"
              style={{ scrollMarginTop: '80px', ...(i < chapter.paragraphs.length - 1 ? { marginBottom: '18px', paddingBottom: '18px', borderBottom: '1px dashed var(--bdr-med)' } : {}) }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
                <span style={{ fontSize: '11px', color: 'var(--ac)', fontWeight: 600, minWidth: '24px' }}>{String(p.idx).padStart(2, '0')}</span>
                <p lang="zh" style={{ flex: 1, fontSize: '17px', color: 'var(--tx-0)', lineHeight: 2, letterSpacing: '0.04em' }}>{p.text}</p>
              </div>
              {p.translation && (
                <div style={{ margin: '8px 0 0 36px', padding: '8px 12px', background: 'var(--ac-bg)', borderRadius: '6px', fontSize: '14px', lineHeight: 1.8 }}>
                  <span style={{ fontSize: '11px', color: 'var(--ac)', marginRight: '6px' }}>{L.translationLabel}</span>
                  <span lang="zh">{p.translation}</span>
                </div>
              )}
              {p.niNote && (
                <div style={{ margin: '8px 0 0 36px', padding: '8px 12px', background: 'rgba(196,90,45,0.06)', borderRadius: '6px', fontSize: '14px', lineHeight: 1.8 }}>
                  <span style={{ fontSize: '11px', color: 'var(--ji)', marginRight: '6px' }}>{L.niNoteLabel}</span>
                  <span lang="zh">{p.niNote}</span>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="no-print" style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
          {prevIdx >= 0 ? (
            <Link href={`/library/${book.slug}/${prevIdx}`} className="card-flat" style={navCard}>
              <div className="page-note">{L.prev}</div>
              <div lang="zh" style={{ fontSize: '14px' }}>{book.chapters[prevIdx].title}</div>
            </Link>
          ) : <div style={{ flex: 1 }} />}
          {nextIdx < book.chapters.length ? (
            <Link href={`/library/${book.slug}/${nextIdx}`} className="card-flat" style={{ ...navCard, textAlign: 'right' }}>
              <div className="page-note">{L.next}</div>
              <div lang="zh" style={{ fontSize: '14px' }}>{book.chapters[nextIdx].title}</div>
            </Link>
          ) : <div style={{ flex: 1 }} />}
        </div>
      </article>
    </div>
  );
}
