import { test, expect } from '@playwright/test';
import { fillBirthForm } from './helpers';

test('save chart locally, reopen from home, export/import, clear', async ({ page }) => {
  await page.goto('/chart');
  await fillBirthForm(page, { day: '2', month: '1', year: '1990', hour: '7', minute: '10', province: 'Hà Nội', gender: 'Nam', name: 'Lưu thử' });
  page.once('dialog', d => d.accept('Lá số lưu thử'));
  await page.getByRole('button', { name: 'Lưu lá số' }).click();
  await expect(page).toHaveURL(/\/chart\?id=/);
  expect(page.url()).not.toMatch(/1990|Lưu/); // URL carries only an id, never birth data
  await page.goto('/');
  await page.getByRole('link', { name: /Lá số lưu thử/ }).click();
  await expect(page.getByRole('heading', { name: 'Lưu thử' }).first()).toBeVisible();
  // export
  await page.goto('/settings');
  const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Xuất dữ liệu (JSON)' }).click()]);
  const json = JSON.parse(await (await dl.createReadStream()).toArray().then(c => Buffer.concat(c).toString('utf8')));
  expect(json.app).toBe('tuvi-ai');
  expect(json.charts).toHaveLength(1);
  // clear, then import back
  page.once('dialog', d => d.accept());
  await page.getByRole('button', { name: 'Xóa toàn bộ dữ liệu trong trình duyệt' }).click();
  await page.locator('input[type=file]').setInputFiles({ name: 'x.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(json)) });
  await expect(page.getByText('Đã nhập 1 lá số')).toBeVisible();
});

test('settings: external provider cannot be chosen without server config', async ({ page }) => {
  await page.goto('/settings');
  await expect(page.getByTestId('ai-status')).not.toContainText('Đang kiểm tra');
  await expect(page.getByRole('radio', { name: /OpenAI/ })).toBeDisabled();
  await expect(page.getByRole('radio', { name: /Claude/ })).toBeDisabled();
});

test('download native PDF report @desktop-only', async ({ page }) => {
  await page.goto('/chart');
  await fillBirthForm(page, { day: '2', month: '1', year: '1990', hour: '7', minute: '10', province: 'Hà Nội', gender: 'Nam', name: 'PDF thử' });
  await page.waitForLoadState('networkidle');
  const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: /Tải báo cáo PDF/ }).click()]);
  expect(dl.suggestedFilename()).toMatch(/^tuvi-.*\.pdf$/);
  const buf = Buffer.concat(await (await dl.createReadStream()).toArray());
  expect(buf.subarray(0, 5).toString()).toBe('%PDF-');
  expect(buf.length).toBeGreaterThan(20_000);
  expect(buf.length).toBeLessThan(1_500_000);
});
