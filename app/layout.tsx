import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import { common } from '@/lib/i18n';
import { SITE_URL } from '@/lib/site';

export const metadata: Metadata = {
  title: 'TuVi AI — Tử Vi Đẩu Số',
  description: common.appTagline,
  metadataBase: new URL(SITE_URL),
  robots: { index: false, follow: false },
  openGraph: {
    title: 'TuVi AI — Tử Vi Đẩu Số',
    description: common.appTagline,
    siteName: common.appName,
    locale: 'vi_VN',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('ziwei-theme');if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t);else document.documentElement.setAttribute('data-theme','dark');}catch(e){}})();` }} />
      </head>
      <body className="min-h-screen">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
