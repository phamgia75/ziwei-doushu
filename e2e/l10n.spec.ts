// Authoritative localization gate: no visible Chinese outside lang="zh" secondary references,
// no horizontal overflow, on every user-facing route and the main chart interactions.
import { test, expect } from '@playwright/test';
import { fillBirthForm, horizontalOverflow, untranslatedText } from './helpers';

const ROUTES = ['/', '/chart', '/heming', '/knowledge', '/knowledge/ziwei/career', '/library', '/library/quanshu', '/library/quanshu/0',
  '/library/search?q=%E7%B4%AB%E5%BE%AE', '/settings', '/about', '/privacy', '/terms'];

for (const route of ROUTES) {
  test(`vi-only ${route}`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));
    const res = await page.goto(route);
    expect(res?.status(), route).toBeLessThan(400);
    await page.waitForLoadState('networkidle');
    expect(await untranslatedText(page)).toEqual([]);
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(1);
    await expect(page.locator('html')).toHaveAttribute('lang', 'vi');
    expect(errors).toEqual([]);
  });
}

test('chart workflow is Vietnamese end-to-end', async ({ page }) => {
  await page.goto('/chart');
  await fillBirthForm(page, { day: '15', month: '6', year: '1985', hour: '23', minute: '30', province: 'TP. Hồ Chí Minh', gender: 'Nữ', name: 'Kiểm thử' });
  await expect(page.getByRole('tab', { name: 'Chủ đề' })).toBeVisible();
  await page.waitForLoadState('networkidle');
  expect(await untranslatedText(page)).toEqual([]);
  for (const tab of ['Hỏi AI', 'Cung & sao', 'Vận hạn', 'Cách cục']) {
    await page.getByRole('tab', { name: tab }).click();
    expect(await untranslatedText(page), tab).toEqual([]);
  }
  // click a palace and a star → detail tab
  await page.getByText('Mệnh', { exact: true }).first().click();
  expect(await untranslatedText(page)).toEqual([]);
  expect(await horizontalOverflow(page)).toBeLessThanOrEqual(1);
});
