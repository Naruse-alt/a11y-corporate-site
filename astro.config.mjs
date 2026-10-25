// @ts-check
import { defineConfig } from 'astro/config';

// 本番配信 URL（workers.dev）。相対リンクには影響しないが、Astro.site / 絶対 URL 生成の基準になる。
export default defineConfig({
  site: 'https://a11y-corporate-site.electricwarrior00.workers.dev',
  // 既定は localhost。Cloud Agent 等で外部から当てるときだけ ASTRO_HOST=0.0.0.0 を指定する。
  server: {
    host: process.env.ASTRO_HOST === '0.0.0.0',
    port: 4321,
  },
});
