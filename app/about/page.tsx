import SiteHeader from '@/components/SiteHeader';
import Zh from '@/components/Zh';
import { common } from '@/lib/i18n';
import { about } from '@/lib/i18n/vi/pages';

export const metadata = { title: `${about.title} · ${common.appName}` };

const REPO = 'https://github.com/Renhuai123/ziwei-doushu';

export default function AboutPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-0)' }}>
      <SiteHeader />
      <main className="page-main">
        <h1>{about.title}</h1>
        <p>{about.what}</p>

        <h2>{about.creditsTitle}</h2>
        <ul>
          <li>{about.engine} <a href={REPO} target="_blank" rel="noreferrer">{REPO}</a></li>
          <li>
            {about.datasetIntro}
            <div className="card-tinted print-avoid-break" style={{ padding: '12px 14px', margin: '8px 0' }}>
              <div className="page-note">{about.datasetNote}</div>
              {/* Exact attribution text required by DATASET-LICENSE. */}
              <p lang="zh" style={{ margin: 0, color: 'var(--tx-1)' }}>
                本项目使用了 紫微斗数开源解读数据集 v4.0（674,976 张命盘 × 13 维）<br />
                来源：<a href={REPO} target="_blank" rel="noreferrer">{REPO}</a><br />
                作者：王多鱼AI
              </p>
            </div>
          </li>
          <li>{about.tianjiA}<Zh>天纪</Zh> {about.tianjiB}</li>
          <li>{about.classics}</li>
          <li>{about.iztro}</li>
          <li>{about.lunar}</li>
        </ul>

        <h2>{about.disclaimerTitle}</h2>
        <p>{common.disclaimer}</p>
      </main>
    </div>
  );
}
