import { defineConfig, devices } from '@playwright/test';

const port = 4321;
const baseURL = `http://127.0.0.1:${port}`;

/**
 * E2E は静的ビルド成果物を `astro preview` で配信して検証する。
 * Cloudflare Worker（Basic 認証）は対象外。
 *
 * CI では直前の `npm run build` で dist がある前提。
 * ローカルの `npm run test:e2e` はスクリプト側で build してから起動する。
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // オーバーレイ型でない縦スクロールバーを出し、100vw 由来の横はみ出しを再現しやすくする
        launchOptions: {
          args: ['--disable-features=OverlayScrollbar'],
        },
      },
    },
  ],
  webServer: {
    command: `npm run preview -- --host 127.0.0.1 --port ${port}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
