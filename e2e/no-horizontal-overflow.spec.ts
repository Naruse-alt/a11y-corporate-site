import { test, expect } from '@playwright/test';

/**
 * トップヒーローのレイアウトが横スクロールを生まないことを守る。
 * 100vw は縦スクロールバー幅を含むため、常時表示環境で横はみ出しが起きうる。
 */

const overflowWidths = [1920, 1440, 1280, 1024, 768, 390, 375, 320] as const;
const themes = ['light', 'dark'] as const;

async function gotoHome(page: import('@playwright/test').Page, theme: 'light' | 'dark') {
  await page.goto('/');
  await page.evaluate((t) => {
    document.documentElement.setAttribute('data-theme', t);
    try {
      localStorage.setItem('theme', t);
    } catch {
      /* ignore */
    }
  }, theme);
  await page.waitForTimeout(50);
}

test.describe('トップの横はみ出しなし', () => {
  for (const width of overflowWidths) {
    for (const theme of themes) {
      test(`${width}px / ${theme}`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await gotoHome(page, theme);
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

test.describe('ヘッダーとヒーロー本文の左端一致', () => {
  for (const width of overflowWidths) {
    for (const theme of themes) {
      test(`${width}px / ${theme}`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await gotoHome(page, theme);

        const edges = await page.evaluate(() => {
          const brand = document.querySelector('.site-header__brand');
          const body = document.querySelector('.hero__body');
          if (!(brand instanceof HTMLElement) || !(body instanceof HTMLElement)) {
            return null;
          }
          return {
            brandLeft: brand.getBoundingClientRect().left,
            bodyLeft: body.getBoundingClientRect().left,
          };
        });

        expect(edges, 'brand / hero__body が見つからない').not.toBeNull();
        expect(
          Math.abs(edges!.brandLeft - edges!.bodyLeft),
          `brandLeft=${edges!.brandLeft} bodyLeft=${edges!.bodyLeft}`,
        ).toBeLessThanOrEqual(1);
      });
    }
  }
});

test.describe('CTA が 1280 / 1440 で1行', () => {
  for (const width of [1280, 1440] as const) {
    for (const theme of themes) {
      test(`${width}px / ${theme}`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await gotoHome(page, theme);

        const rows = await page.evaluate(() => {
          const actions = document.querySelector('.hero__actions');
          if (!(actions instanceof HTMLElement)) return -1;
          const buttons = [...actions.querySelectorAll('.button')];
          if (buttons.length < 2) return -1;
          const tops = buttons.map((b) => Math.round(b.getBoundingClientRect().top));
          return new Set(tops).size;
        });

        expect(rows, 'CTA ボタンが見つからない').toBe(1);
      });
    }
  }
});
