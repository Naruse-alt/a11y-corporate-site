/**
 * 本番レスポンス向けセキュリティヘッダー。
 * CSP の script/style ハッシュはビルド成果物から生成する（csp-policy.generated.js）。
 */

import { CONTENT_SECURITY_POLICY } from './csp-policy.generated.js';

/** @type {Readonly<Record<string, string>>} */
export const SECURITY_HEADERS = {
  'Content-Security-Policy': CONTENT_SECURITY_POLICY,
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  // 不要なブラウザ機能を明示的に閉じる（デモサイトで使う API は無い）
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
  // HTTPS 前提の限定共有。2 年 + preload 候補
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'X-Robots-Tag': 'noindex, nofollow',
};

/**
 * @param {Headers} headers
 * @returns {Headers}
 */
export function applySecurityHeaders(headers) {
  const next = new Headers(headers);
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    next.set(name, value);
  }
  return next;
}
