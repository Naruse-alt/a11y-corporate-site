// @ts-check
import { defineConfig } from 'astro/config';

// site は Cloudflare Pages の URL（*.pages.dev またはカスタムドメイン）確定時に差し替える。
// 相対リンクの生成には影響しない。限定共有中も正しい絶対 URL が必要な機能（OG 等）のために更新する。
export default defineConfig({
  site: 'https://example.com',
  // 既定は localhost。Cloud Agent 等で外部から当てるときだけ ASTRO_HOST=0.0.0.0 を指定する。
  server: {
    host: process.env.ASTRO_HOST === '0.0.0.0',
    port: 4321,
  },
});
