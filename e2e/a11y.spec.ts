import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * 壊れると困るアクセシビリティ挙動だけを少数で守る回帰テスト。
 * axe のゼロ違反は「適合の証明」ではなく、明らかな機械検出の回帰防止。
 */

const routes = [
  '/',
  '/about/',
  '/services/',
  '/faq/',
  '/contact/',
  '/accessibility/',
  '/annotations/',
] as const;

test.describe('axe（WCAG 2.x A/AA）', () => {
  for (const path of routes) {
    test(`${path} で axe 違反がゼロ`, async ({ page }) => {
      // 守る基準: 1.3.1 / 4.1.2 など機械検出可能な A/AA 系の回帰。
      // 理由: ページ追加・マークアップ変更で landmark・名前・コントラスト等が
      // 壊れたとき、適合試験の前に PR で止めたい。適合表明の根拠には使わない。
      await page.goto(path);

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze();

      expect(results.violations, formatViolations(results.violations)).toEqual([]);
    });
  }
});

test.describe('スキップリンク', () => {
  test('本文へスキップで #main にフォーカスが移る', async ({ page }) => {
    // 守る基準: 2.4.1 ブロックスキップ A / 2.4.3 フォーカス順序 A
    // 理由: キーボード利用者が毎回ヘッダーを踏まず本文へ入れることが要件。
    // docs/keyboard-specs.md「スキップリンク」どおり Enter で #main へ移動する。
    await page.goto('/');

    await page.keyboard.press('Tab');
    const skip = page.getByRole('link', { name: '本文へスキップ' });
    await expect(skip).toBeFocused();

    await page.keyboard.press('Enter');
    await expect(page.locator('#main')).toBeFocused();
  });
});

test.describe('フォーカスリング（:focus-visible）', () => {
  test('Tab ではナビリンクにリングが見え、クリックでは見えない', async ({ page }) => {
    // 守る基準: 2.4.7 フォーカスの可視化 A
    // 理由: キーボード操作時のみ可視フォーカスを出し、マウスクリックでは枠を出さない。
    await page.goto('/');

    const services = page.locator('.primary-nav').getByRole('link', { name: 'サービス' });

    // スキップリンクの次がヘッダー操作群。サービスへ届くまで Tab する。
    for (let i = 0; i < 12; i += 1) {
      await page.keyboard.press('Tab');
      if (await services.evaluate((el) => el === document.activeElement).catch(() => false)) break;
    }
    await expect(services).toBeFocused();

    const keyboardRing = await services.evaluate((el) => {
      const s = getComputedStyle(el);
      return { outlineStyle: s.outlineStyle, outlineWidth: s.outlineWidth, boxShadow: s.boxShadow };
    });
    const keyboardVisible =
      (keyboardRing.outlineStyle !== 'none' && keyboardRing.outlineWidth !== '0px') ||
      keyboardRing.boxShadow !== 'none';
    expect(keyboardVisible, `keyboard ring missing: ${JSON.stringify(keyboardRing)}`).toBe(true);

    // 遷移前にスタイルを読む（クリック後のナビゲーションでフォーカスが外れるため）。
    await page.goto('/');
    const servicesFresh = page.locator('.primary-nav').getByRole('link', { name: 'サービス' });
    await servicesFresh.evaluate((el) => {
      el.addEventListener(
        'click',
        (event) => {
          event.preventDefault();
        },
        { once: true },
      );
    });
    await servicesFresh.click();
    await expect(servicesFresh).toBeFocused();

    const mouseRing = await servicesFresh.evaluate((el) => {
      const s = getComputedStyle(el);
      return { outlineStyle: s.outlineStyle, outlineWidth: s.outlineWidth, boxShadow: s.boxShadow };
    });
    const mouseVisible =
      (mouseRing.outlineStyle !== 'none' && mouseRing.outlineWidth !== '0px') ||
      mouseRing.boxShadow !== 'none';
    expect(mouseVisible, `mouse ring still visible: ${JSON.stringify(mouseRing)}`).toBe(false);
  });
});

test.describe('ナビと本文のリンク下線', () => {
  test('インラインリンクは下線あり、.link-quiet は通常時下線なし', async ({ page }) => {
    // 守る基準: 1.4.1 色の使用 A（本文インラインは下線で色以外の手がかりを維持）
    // 理由: ナビ系は .link-quiet。段落内リンクは下線を残す。
    await page.goto('/');

    const quietLink = page.locator('.site-footer__nav a.link-quiet').first();
    const quietDecoration = await quietLink.evaluate((el) => getComputedStyle(el).textDecorationLine);
    expect(quietDecoration).toBe('none');

    const cardQuiet = page.locator('main a.card__title-link.link-quiet').first();
    await expect(cardQuiet).toBeVisible();
    const cardDecoration = await cardQuiet.evaluate((el) => getComputedStyle(el).textDecorationLine);
    expect(cardDecoration).toBe('none');

    // AnnotationCue の文中リンク（.button / .link-quiet 以外）
    const inlineLink = page.locator('main a:not(.button):not(.link-quiet)').first();
    await expect(inlineLink).toBeVisible();
    const inlineDecoration = await inlineLink.evaluate((el) => getComputedStyle(el).textDecorationLine);
    expect(inlineDecoration).toContain('underline');
  });
});

test.describe('モバイルドロワー', () => {
  test('Esc で閉じるとメニューボタンへフォーカスが戻る', async ({ page }) => {
    // 守る基準: 2.1.2 キーボードトラップなし A / 2.4.3 フォーカス順序 A / 4.1.2 名前・役割・値 A
    // 理由: <dialog showModal()> の Escape 閉鎖とトリガー復帰が仕様の核。
    // docs/keyboard-specs.md「モバイルメニュー：ドロワー」どおり。
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    const toggle = page.getByRole('button', { name: 'メニュー' });
    await expect(toggle).toBeVisible();
    await toggle.click();

    const drawer = page.locator('#mobile-drawer');
    await expect(drawer).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(drawer).toBeHidden();
    await expect(toggle).toBeFocused();
  });
});

test.describe('ファビコンと OGP', () => {
  test('head に icon / og:image があり、アセットが 200 を返す', async ({ page, request }) => {
    // 理由: タブ識別と共有プレビュー用メタが欠けるとブランディングが崩れる。
    // Basic 認証下ではクローラは取れないが、配信パスとマークアップは常に正しい状態を保つ。
    await page.goto('/');

    await expect(page.locator('link[rel="icon"][href="/favicon.ico"]')).toHaveCount(1);
    await expect(page.locator('link[rel="icon"][href="/favicon.svg"]')).toHaveCount(1);
    await expect(page.locator('link[rel="apple-touch-icon"][href="/apple-touch-icon.png"]')).toHaveCount(1);

    const ogImage = page.locator('meta[property="og:image"]');
    await expect(ogImage).toHaveAttribute('content', /\/images\/og-image\.jpg$/);

    const faviconSvg = await request.get('/favicon.svg');
    expect(faviconSvg.status()).toBe(200);

    const og = await request.get('/images/og-image.jpg');
    expect(og.status()).toBe(200);
  });
});

test.describe('お問い合わせフォーム', () => {
  test('エラー表示が aria で入力欄と結びつく', async ({ page }) => {
    // 守る基準: 3.3.1 エラーの特定 A / 1.3.1 情報及び関係性 A / 4.1.2 名前・役割・値 A
    // 理由: 空送信時に項目エラーが aria-invalid / aria-describedby で
    // 該当コントロールへプログラム的に結びつくことがデモの見せ場。
    await page.goto('/contact/');

    await page.getByRole('button', { name: '入力内容を確認する（デモ）' }).click();

    const name = page.locator('#contact-name');
    await expect(name).toHaveAttribute('aria-invalid', 'true');

    const describedBy = await name.getAttribute('aria-describedby');
    expect(describedBy?.split(/\s+/)).toContain('contact-name-error');

    const error = page.locator('#contact-name-error');
    await expect(error).toBeVisible();
    await expect(error).not.toBeEmpty();
  });
});

function formatViolations(
  violations: { id: string; help: string; nodes: { target: unknown[] }[] }[],
): string {
  if (violations.length === 0) return '';
  return violations
    .map((v) => {
      const targets = v.nodes.map((n) => JSON.stringify(n.target)).join(', ');
      return `${v.id}: ${v.help} (${targets})`;
    })
    .join('\n');
}
