import type { Page } from '@playwright/test';

export interface Birth { day: string; month: string; year: string; hour: string; minute: string; province?: string; gender?: 'Nam' | 'Nữ'; name?: string }

/** Fill the Vietnamese BirthForm and submit. */
export async function fillBirthForm(page: Page, b: Birth, submit = true) {
  if (b.name) await page.fill('#bf-name', b.name);
  await page.selectOption('#bf-day', b.day);
  await page.selectOption('#bf-month', b.month);
  await page.selectOption('#bf-year', b.year);
  if (b.province) await page.getByLabel('Tỉnh / Thành phố', { exact: true }).selectOption({ label: b.province });
  await page.getByLabel('giờ', { exact: true }).selectOption(b.hour);
  await page.getByLabel('phút', { exact: true }).selectOption(b.minute);
  if (b.gender) await page.locator('button[aria-pressed]').filter({ hasText: new RegExp(`(^|\\s)${b.gender}$`) }).click();
  if (submit) await page.getByRole('button', { name: 'Lập lá số', exact: true }).click();
}

/** Visible text (and placeholder/aria-label/alt) containing Han characters outside lang="zh". */
// Plain-string browser script: tsx/esbuild would inject a __name helper into a function argument.
const UNTRANSLATED_JS = `(() => {
  const HAN = /\\p{Script=Han}/u;
  const out = [];
  const inZh = el => !!(el && el.closest('[lang^="zh"]'));
  const visible = el => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return s.visibility !== 'hidden' && s.display !== 'none' && (r.width > 0 || r.height > 0) && !el.closest('[hidden]'); };
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const el = n.parentElement;
    if (!el || ['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(el.tagName)) continue;
    if (HAN.test(n.textContent || '') && !inZh(el) && visible(el)) out.push((n.textContent || '').trim().slice(0, 80));
  }
  for (const el of document.querySelectorAll('[placeholder],[aria-label],[alt]')) {
    for (const a of ['placeholder', 'aria-label', 'alt']) {
      const v = el.getAttribute(a);
      if (v && HAN.test(v) && !inZh(el)) out.push(a + '="' + v.slice(0, 60) + '"');
    }
  }
  return out;
})()`;

/** Visible text (and placeholder/aria-label/alt) containing Han characters outside lang="zh". */
export const untranslatedText = (page: Page): Promise<string[]> => page.evaluate(UNTRANSLATED_JS);

export const horizontalOverflow = (page: Page): Promise<number> => page.evaluate('document.documentElement.scrollWidth - window.innerWidth');
