// @ai: needs the local Ollama model. Run: npx playwright test --grep @ai --project desktop
import { test, expect } from '@playwright/test';
import { fillBirthForm, untranslatedText } from './helpers';

test.describe('@ai local AI', () => {
  test.setTimeout(420_000);
  test.beforeEach(async ({ page }) => {
    await page.goto('/chart');
    await fillBirthForm(page, { day: '2', month: '1', year: '1990', hour: '7', minute: '10', province: 'Hà Nội', gender: 'Nam' });
  });

  test('topic: dataset reading translated + AI analysis with traceability', async ({ page }) => {
    await page.getByRole('button', { name: 'Sự nghiệp', exact: true }).click();
    await expect(page.getByText(/Đang dịch đoạn|Hiện nguyên văn/).first()).toBeVisible({ timeout: 120_000 });
    await page.getByRole('button', { name: 'AI phân tích chủ đề này' }).click();
    await expect(page.getByText(/Đã đối chiếu|nhận định không khớp|Không có nhận định vị trí/)).toBeVisible({ timeout: 300_000 });
    await expect(page.getByText(/Mô hình: qwen/)).toBeVisible();
    await expect(page.locator('.tv-ref').first()).toBeVisible(); // [F#]/[S#] citations rendered
    expect(await untranslatedText(page)).toEqual([]);
  });

  test('chat answers against the active chart', async ({ page }) => {
    await page.getByRole('tab', { name: 'Hỏi AI' }).click();
    await page.getByRole('textbox').fill('Cung Mệnh của tôi có chính tinh nào?');
    await page.getByRole('button', { name: 'Gửi' }).click();
    await expect(page.getByText(/Đã đối chiếu|nhận định không khớp|Không có nhận định vị trí/)).toBeVisible({ timeout: 300_000 });
    await expect(page.locator('.tv-md:visible').first()).toContainText(/Liêm Trinh|Phá Quân/);
  });
});
