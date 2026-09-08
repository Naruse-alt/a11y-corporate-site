/**
 * Cloudflare Pages Functions: サイト全体を HTTP Basic 認証で保護する。
 *
 * 想定用途: 仮コーポレートサイトの限定共有（一般公開ではない）。
 * Secret（Pages ダッシュボード）:
 *   - BASIC_USER
 *   - BASIC_PASS
 *
 * Secret 未設定時は Fail closed（すべて 401）。ローカルの `astro dev` では
 * この Functions は動かないため、開発時は認証なしで閲覧できる。
 *
 * @see https://developers.cloudflare.com/pages/functions/middleware/
 */

import { unauthorizedResponse, verifyBasicAuth } from './auth.js';

/**
 * @param {EventContext<{ BASIC_USER?: string; BASIC_PASS?: string }, string, unknown>} context
 */
export async function onRequest(context) {
  const { request, env, next } = context;
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

  const response = await next();

  // 認証済み応答が共有キャッシュに載らないようにする。
  const headers = new Headers(response.headers);
  headers.set('Cache-Control', 'private, no-store');

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
