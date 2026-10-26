import { test, expect } from '@playwright/test';

/**
 * トップヒーローのレイアウトが横スクロールを生まないことを守る。
 * 100vw は縦スクロールバー幅を含むため、常時表示環境で横はみ出しが起きうる。
 *
 * あわせてヘッダー／ヒーロー左端の一致と、通常ズームでの h1 3句3行を確認する。
 */

const overflowWidths = [1920, 1440, 1280, 1024, 768, 390, 375, 320] as const;
const themes = ['light', 'dark'] as const;
/** デスクトップ: 3句3行 + 連結ネーム */
const h1DesktopWidths = [1920, 1440, 1280, 1024] as const;
/** モバイル〜タブレット: 100% ズームで各句が1行（句内折り返しなし） */
const h1MobileWidths = [320, 375, 390, 768] as const;

const heroPhrases = ['誰も取り残さない', 'Web を、', '標準の力で。'] as const;

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

async function readHeroPhrases(page: import('@playwright/test').Page) {
  return page.evaluate((expected) => {
    const h1 = document.getElementById('hero-heading');
    if (!(h1 instanceof HTMLElement)) {
      return { ok: false as const, reason: 'h1 なし' };
    }
    const phrases = [...h1.querySelectorAll('.hero__phrase')];
    if (phrases.length !== expected.length) {
      return { ok: false as const, reason: `phrase 数 ${phrases.length}` };
    }
    const texts = phrases.map((el) => el.textContent ?? '');
    const lines = phrases.map((el) => {
      const rects = [...el.getClientRects()].filter((r) => r.width > 0 && r.height > 0);
      return {
        text: el.textContent ?? '',
        lineCount: rects.length,
        top: rects[0] ? Math.round(rects[0].top) : -1,
      };
    });
    const name = (h1.textContent ?? '').replace(/[\n\r]+/g, '');
    return { ok: true as const, texts, lines, name };
  }, [...heroPhrases]);
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

test.describe('h1 が3句・3行（通常ズーム・1024px以上）', () => {
  for (const width of h1DesktopWidths) {
    for (const theme of themes) {
      test(`${width}px / ${theme}`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await gotoHome(page, theme);

        const result = await readHeroPhrases(page);
        expect(result.ok, !result.ok ? result.reason : 'h1 解析失敗').toBe(true);
        if (!result.ok) return;

        expect(result.texts).toEqual([...heroPhrases]);
        expect(result.name, 'アクセシブルネーム相当の連結テキスト').toBe(
          '誰も取り残さないWeb を、標準の力で。',
        );
        expect(result.lines).toHaveLength(3);
        for (const [i, line] of result.lines.entries()) {
          expect(line.text, `句${i + 1}`).toBe(heroPhrases[i]);
          expect(line.lineCount, `句「${line.text}」の行数`).toBe(1);
        }
        expect(result.lines[0].top).toBeLessThan(result.lines[1].top);
        expect(result.lines[1].top).toBeLessThan(result.lines[2].top);
      });
    }
  }
});

test.describe('h1 が3句・3行（通常ズーム・320〜768px）', () => {
  for (const width of h1MobileWidths) {
    for (const theme of themes) {
      test(`${width}px / ${theme}`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await gotoHome(page, theme);

        const result = await readHeroPhrases(page);
        expect(result.ok, !result.ok ? result.reason : 'h1 解析失敗').toBe(true);
        if (!result.ok) return;

        expect(result.texts).toEqual([...heroPhrases]);
        expect(result.lines).toHaveLength(3);
        for (const [i, line] of result.lines.entries()) {
          expect(line.text, `句${i + 1}`).toBe(heroPhrases[i]);
          expect(
            line.lineCount,
            `句「${line.text}」が ${line.lineCount} 行（句内折り返しなしであること）`,
          ).toBe(1);
        }
        expect(result.lines[0].top).toBeLessThan(result.lines[1].top);
        expect(result.lines[1].top).toBeLessThan(result.lines[2].top);
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
