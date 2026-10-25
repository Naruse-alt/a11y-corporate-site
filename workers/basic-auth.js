/**
 * Cloudflare Workers: 静的アセット配信の前に HTTP Basic 認証を行う。
 *
 * 想定用途: 仮コーポレートサイトの限定共有（一般公開ではない）。
 * Secret（Workers / Pages ダッシュボード）:
 *   - BASIC_USER
 *   - BASIC_PASS
 *
 * Secret 未設定時は Fail closed（すべて 401）。
 * ローカルの `astro dev` ではこの Worker は動かないため、開発時は認証なしで閲覧できる。
 *
 * wrangler.jsonc で assets.run_worker_first = true とし、静的ファイル直出しを防ぐ。
 */

import { unauthorizedResponse, verifyBasicAuth } from './auth.js';
import { applySecurityHeaders } from './security-headers.js';

/**
 * @param {Request} request
 * @param {{ BASIC_USER?: string; BASIC_PASS?: string; ASSETS: { fetch: typeof fetch } }} env
 * @returns {Promise<Response>}
 */
async function handleRequest(request, env) {
  const expectedUser = env.BASIC_USER;
  const expectedPass = env.BASIC_PASS;

  // Secret 未設定なら無防備公開しない（Fail closed）。
  if (!expectedUser || !expectedPass) {
    return unauthorizedResponse(
      401,
      'Authentication is not configured for this deployment.',
    );
  }

  const result = verifyBasicAuth(request.headers.get('Authorization'), expectedUser, expectedPass);

  if (!result.ok) {
    if (result.status === 400) {
      return unauthorizedResponse(400, 'Malformed authorization header.', { challenge: false });
    }
    return unauthorizedResponse(401, 'Authentication required.');
  }

  const response = await env.ASSETS.fetch(request);

  // 認証済み応答が共有キャッシュに載らないようにする。
  // セキュリティヘッダーは _headers ではなく Worker で付与（401 も含め確実に）。
  let headers = new Headers(response.headers);
  headers.set('Cache-Control', 'private, no-store');
  headers = applySecurityHeaders(headers);

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export default {
  /**
   * @param {Request} request
   * @param {{ BASIC_USER?: string; BASIC_PASS?: string; ASSETS: { fetch: typeof fetch } }} env
   */
  async fetch(request, env) {
    return handleRequest(request, env);
  },
};
