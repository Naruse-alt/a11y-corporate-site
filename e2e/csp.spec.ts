import { test, expect } from '@playwright/test';
import { CONTENT_SECURITY_POLICY } from '../workers/csp-policy.generated.js';

/**
 * preview は Worker を通らないため、本番と同じ CSP をレスポンスに注入して検証する。
 */
test.describe('CSP', () => {
  test('主要ページで CSP 違反がコンソールに出ない', async ({ page }) => {
    // 守る基準: 運用上のセキュリティヘッダー（クリックジャッキング等は別ヘッダー）。
    // 理由: インライン script/style のハッシュずれは実行時 CSP 違反になるため回帰で止める。
    const cspErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error' && /content security policy/i.test(msg.text())) {
        cspErrors.push(msg.text());
      }
    });
    page.on('pageerror', (err) => {
      if (/content security policy/i.test(err.message)) {
        cspErrors.push(err.message);
      }
    });

    await page.route('**/*', async (route) => {
      const response = await route.fetch();
      const headers = {
        ...response.headers(),
        'content-security-policy': CONTENT_SECURITY_POLICY,
      };
      await route.fulfill({ response, headers });
    });

    for (const path of ['/', '/contact/', '/services/']) {
      cspErrors.length = 0;
      await page.goto(path, { waitUntil: 'networkidle' });
      // インライン JS（テーマ切替）が CSP 下で実行されること
      await expect(page.getByRole('button', { name: /モードに切り替える/ })).toBeVisible();
      expect(cspErrors, `${path} CSP errors`).toEqual([]);
    }
  });
});
