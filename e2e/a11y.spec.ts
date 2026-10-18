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
