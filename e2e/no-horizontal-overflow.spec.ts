import { test, expect } from '@playwright/test';

/**
 * トップヒーローの全幅レイアウトが横スクロールを生まないことを守る。
 * 100vw は縦スクロールバー幅を含むため、常時表示環境で横はみ出しが起きうる。
 */

const widths = [1024, 1280, 1440, 1920, 375, 640] as const;
const themes = ['light', 'dark'] as const;

test.describe('トップの横はみ出しなし', () => {
  for (const width of widths) {
    for (const theme of themes) {
      test(`${width}px / ${theme}`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto('/');
        await page.evaluate((t) => {
          document.documentElement.setAttribute('data-theme', t);
          try {
            localStorage.setItem('theme', t);
          } catch {
            /* ignore */
          }
        }, theme);
        // レイアウト確定と縦スクロール（スクロールバー出現）を待つ
        await page.waitForTimeout(50);
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.evaluate(() => window.scrollTo(0, 0));

        const metrics = await page.evaluate(() => ({
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
        }));

        expect(
          metrics.scrollWidth,
          `scrollWidth(${metrics.scrollWidth}) > clientWidth(${metrics.clientWidth}) at ${width}px ${theme}`,
        ).toBeLessThanOrEqual(metrics.clientWidth);
      });
    }
  }
});
