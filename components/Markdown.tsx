'use client';
/** Minimal safe Markdown → React (headings, bold/italic, lists, rules, paragraphs) with
 *  [F12]/[S1] citation chips. Renders text nodes only — no HTML injection from model output. */
import { Fragment, type ReactNode } from 'react';

function inline(text: string, onRef?: (id: string) => void, key = ''): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /\[\[?([FS]\d{1,3})\]?\]|\*\*([^*]+)\*\*|(?<![\w*])\*([^*\n]+)\*(?!\w)|(?<!\w)_([^_\n]+)_(?!\w)/g;
  let last = 0, m: RegExpExecArray | null, n = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const k = `${key}-${n++}`;
    if (m[1]) out.push(<button key={k} type="button" className="tv-ref" onClick={() => onRef?.(m![1])} aria-label={`Xem ${m[1]}`}>{m[1]}</button>);
    else if (m[2]) out.push(<strong key={k}>{inline(m[2], onRef, k)}</strong>);
    else out.push(<em key={k}>{m[3] ?? m[4]}</em>);
    last = re.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export default function Markdown({ text, onRef }: { text: string; onRef?: (id: string) => void }) {
  const blocks: ReactNode[] = [];
  let list: string[] = [];
  const flush = () => {
    if (list.length) blocks.push(<ul key={`ul${blocks.length}`}>{list.map((li, i) => <li key={i}>{inline(li, onRef, `l${blocks.length}-${i}`)}</li>)}</ul>);
    list = [];
  };
  text.split('\n').forEach((raw, i) => {
    const line = raw.trimEnd();
    const li = /^\s*(?:[-*•]|\d+[.)])\s+(.*)$/.exec(line);
    if (li) { list.push(li[1]); return; }
    flush();
    if (!line.trim()) return;
    if (/^-{3,}$/.test(line.trim())) { blocks.push(<hr key={i} />); return; }
    const h = /^#{1,6}\s+(.*)$/.exec(line);
    if (h) { blocks.push(<h3 key={i}>{inline(h[1], onRef, `h${i}`)}</h3>); return; }
    blocks.push(<p key={i}>{inline(line, onRef, `p${i}`)}</p>);
  });
  flush();
  return <div className="tv-md">{blocks.map((b, i) => <Fragment key={i}>{b}</Fragment>)}</div>;
}
