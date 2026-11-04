/** Chinese source term shown as a secondary reference next to the Vietnamese text.
 *  `lang="zh"` marks it as intentional for the untranslated-text checks. */
export default function Zh({ children, paren = true }: { children: React.ReactNode; paren?: boolean }) {
  return (
    <span lang="zh" className="zh-ref" style={{ opacity: 0.55, fontSize: '0.85em', marginLeft: '0.25em' }}>
      {paren ? <>({children})</> : children}
    </span>
  );
}
