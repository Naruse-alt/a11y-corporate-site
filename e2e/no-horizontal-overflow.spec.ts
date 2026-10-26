import { test, expect } from '@playwright/test';

/**
 * トップヒーローのレイアウトが横スクロールを生まないことを守る。
 * 100vw は縦スクロールバー幅を含むため、常時表示環境で横はみ出しが起きうる。
 *
 * あわせてヘッダー／ヒーロー左端の一致と、通常ズームでの h1 1行目を確認する。
 */

const overflowWidths = [1920, 1440, 1280, 1024, 768, 375] as const;
const themes = ['light', 'dark'] as const;
const h1SingleLineWidths = [1920, 1440, 1280, 1024] as const;

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

test.describe('h1 の「誰も取り残さない」が1行（通常ズーム・1024px以上）', () => {
  for (const width of h1SingleLineWidths) {
    for (const theme of themes) {
      test(`${width}px / ${theme}`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await gotoHome(page, theme);

        const lineCount = await page.evaluate(() => {
          const h1 = document.getElementById('hero-heading');
          if (!(h1 instanceof HTMLElement)) return -1;
          const text = h1.firstChild;
          if (!(text instanceof Text)) return -1;
          const range = document.createRange();
          // 「誰も取り残さない」は先頭の8文字（次の <wbr> まで）
          range.setStart(text, 0);
          range.setEnd(text, Math.min(8, text.data.length));
          return range.getClientRects().length;
        });

        expect(lineCount, 'h1 先頭テキストノードが見つからない').toBeGreaterThan(0);
        expect(lineCount, `「誰も取り残さない」が ${lineCount} 行に折り返している`).toBe(1);
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
