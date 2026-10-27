import { test, expect } from '@playwright/test';

/**
 * カスタム 404 が HTTP 404 で返り、見出しが1つであることを守る。
 * 見た目のレイアウト断言はしない。
 */

test.describe('カスタム 404', () => {
  test('未知 URL は status 404 で、h1 がちょうど1つ', async ({ page }) => {
    const response = await page.goto('/this-page-does-not-exist/', {
      waitUntil: 'domcontentloaded',
    });

    expect(response, 'navigation response missing').not.toBeNull();
    expect(response!.status()).toBe(404);

    const headings = page.locator('h1');
    await expect(headings).toHaveCount(1);
    await expect(headings).toHaveText('ページが見つかりません');
  });
});
