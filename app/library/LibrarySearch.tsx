'use client';
/** Library search box → /library/search?q=… */
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { library as L } from '@/lib/i18n/vi/library';

export default function LibrarySearch({ initial = '' }: { initial?: string }) {
  const [q, setQ] = useState(initial);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const submit = () => {
    const query = q.trim();
    if (!query) return;
    startTransition(() => router.push(`/library/search?q=${encodeURIComponent(query)}`));
  };

  return (
    <form role="search" className="card-flat no-print" style={{ display: 'flex', gap: '8px', padding: '6px' }}
      onSubmit={e => { e.preventDefault(); submit(); }}>
      <input value={q} onChange={e => setQ(e.target.value)} placeholder={L.searchPlaceholder} aria-label={L.search}
        style={{ flex: 1, minWidth: 0, padding: '10px 12px', border: 'none', outline: 'none', fontSize: '15px', color: 'var(--tx-0)', background: 'transparent' }} />
      <button type="submit" className="btn-accent" disabled={isPending || !q.trim()}
        style={{ padding: '10px 20px', opacity: q.trim() ? 1 : 0.5, cursor: q.trim() ? 'pointer' : 'not-allowed' }}>
        {isPending ? '…' : L.search}
      </button>
    </form>
  );
}
