// @ts-check
import { defineConfig } from 'astro/config';

// site は Cloudflare Pages の URL（*.pages.dev またはカスタムドメイン）確定時に差し替える。
// 相対リンクの生成には影響しない。限定共有中も正しい絶対 URL が必要な機能（OG 等）のために更新する。
export default defineConfig({
  site: 'https://example.com',
  // Cloud Agent / CI 環境で外部からアクセスできるように 0.0.0.0 で待ち受ける
  server: {
    host: true,
    port: 4321,
  },
});
