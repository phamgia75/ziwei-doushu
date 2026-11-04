/** /library/[book] — table of contents of one book. */
import Link from 'next/link';
import { notFound } from 'next/navigation';
import SiteHeader from '@/components/SiteHeader';
import Zh from '@/components/Zh';
import { common } from '@/lib/i18n';
import { library as L, BOOK_VI } from '@/lib/i18n/vi/library';
import { ALL_BOOKS, getBookBySlug } from '@/lib/classics';

export async function generateStaticParams() {
  return ALL_BOOKS.map(b => ({ book: b.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ book: string }> }) {
  const { book: slug } = await params;
  const vi = BOOK_VI[slug];
  return vi ? { title: `${vi.title} · ${L.title} · ${common.appName}` } : {};
}

export default async function BookPage({ params }: { params: Promise<{ book: string }> }) {
  const { book: slug } = await params;
  const book = getBookBySlug(slug);
  if (!book) notFound();
  const vi = BOOK_VI[slug];

  return (
    <div style={{ background: 'var(--bg-0)', minHeight: '100vh' }}>
      <SiteHeader />
      <main className="page-main" style={{ maxWidth: '760px' }}>
        <nav className="page-note no-print"><Link href="/library">{L.backToLibrary}</Link></nav>
        <div className="page-note" style={{ marginTop: '12px' }}>{vi?.dynasty} · {vi?.author}</div>
        <h1>{vi?.title}<Zh>{book.title}</Zh></h1>
        <p>{vi?.intro}</p>

        <h2>{L.toc}</h2>
        <p className="page-note">{L.originalNote}</p>
        <div className="card-flat" style={{ overflow: 'hidden' }}>
          {book.chapters.map((chapter, i) => (
            <Link key={i} href={`/library/${book.slug}/${i}`}
              style={{ display: 'flex', alignItems: 'baseline', gap: '14px', padding: '12px 18px', textDecoration: 'none', color: 'inherit',
                borderBottom: i === book.chapters.length - 1 ? 'none' : '1px dashed var(--bdr-med)' }}>
              <span style={{ fontSize: '12px', color: 'var(--ac)', fontWeight: 600, minWidth: '28px' }}>{String(i + 1).padStart(2, '0')}</span>
              <span lang="zh" style={{ flex: 1 }}>
                <span style={{ display: 'block', fontSize: '15px', color: 'var(--tx-0)' }}>{chapter.title}</span>
                {chapter.subtitle && <span style={{ display: 'block', fontSize: '12px', color: 'var(--tx-3)' }}>{chapter.subtitle}</span>}
              </span>
              <span className="page-note">{L.paragraphs(chapter.paragraphs.length)}</span>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
