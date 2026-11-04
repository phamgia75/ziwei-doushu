/** /library — classical texts (public domain) with full-text search. */
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import Zh from '@/components/Zh';
import { common } from '@/lib/i18n';
import { library as L, BOOK_VI } from '@/lib/i18n/vi/library';
import { ALL_BOOKS, TOTAL_PARAGRAPHS } from '@/lib/classics';
import LibrarySearch from './LibrarySearch';

export const metadata = { title: `${L.title} · ${common.appName}` };

export default function LibraryHomePage() {
  return (
    <div style={{ background: 'var(--bg-0)', minHeight: '100vh' }}>
      <SiteHeader />
      <main className="page-main" style={{ maxWidth: '1000px' }}>
        <h1>{L.title}</h1>
        <p>{L.intro(ALL_BOOKS.length, TOTAL_PARAGRAPHS)}</p>
        <div style={{ margin: '20px 0 28px', maxWidth: '640px' }}><LibrarySearch /></div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ALL_BOOKS.map(book => {
            const vi = BOOK_VI[book.slug];
            return (
              <Link key={book.slug} href={`/library/${book.slug}`} className="card home-card">
                <div className="page-note">{vi?.dynasty} · {vi?.author}</div>
                <strong>{vi?.title ?? <span lang="zh">{book.title}</span>}<Zh>{book.title}</Zh></strong>
                <span>{vi?.intro}</span>
                <div className="page-note" style={{ marginTop: '10px' }}>
                  {L.chapters(book.chapters.length)} · {L.paragraphs(book.chapters.reduce((s, c) => s + c.paragraphs.length, 0))} · <span style={{ color: 'var(--ac)' }}>{L.open}</span>
                </div>
              </Link>
            );
          })}
        </div>

        <h2>{L.aboutTitle}</h2>
        <p>{L.aboutText}</p>
      </main>
    </div>
  );
}
