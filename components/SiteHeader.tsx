'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { common } from '@/lib/i18n';
import { header } from '@/lib/i18n/vi/pages';
import { useTheme } from '@/components/ThemeProvider';

const LINKS = [
  { href: '/chart', label: common.nav.chart },
  { href: '/heming', label: common.nav.heming },
  { href: '/knowledge', label: common.nav.knowledge },
  { href: '/library', label: common.nav.library },
  { href: '/settings', label: common.nav.settings },
  { href: '/about', label: header.about },
];

/** Compact top nav shared by the app pages. Collapses to a menu button below 760px. */
export default function SiteHeader() {
  const pathname = usePathname() ?? '';
  const { theme, toggle } = useTheme();
  const [open, setOpen] = useState(false);
  const active = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <header className="site-header no-print">
      <div className="site-header-inner">
        <Link href="/" className="site-header-brand" aria-label={header.homeLabel}>
          {common.appName}
        </Link>
        <nav className={`site-header-nav${open ? ' open' : ''}`} aria-label={common.nav.home}>
          {LINKS.map(l => (
            <Link key={l.href} href={l.href} className={active(l.href) ? 'active' : undefined}
              aria-current={active(l.href) ? 'page' : undefined} onClick={() => setOpen(false)}>
              {l.label}
            </Link>
          ))}
        </nav>
        <button type="button" className="site-header-btn" onClick={toggle}
          aria-label={theme === 'dark' ? header.toLight : header.toDark} title={theme === 'dark' ? header.toLight : header.toDark}>
          {theme === 'dark' ? '☀' : '☾'}
        </button>
        <button type="button" className="site-header-btn site-header-menu" onClick={() => setOpen(o => !o)}
          aria-expanded={open} aria-label={open ? header.closeMenu : header.menu}>
          {open ? '✕' : '☰'}
        </button>
      </div>
    </header>
  );
}
