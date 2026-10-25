/**
 * Basic 認証ヘルパーとセキュリティヘッダーの回帰テスト（Node 上で実行）。
 * 使い方: node scripts/test-basic-auth.mjs
 */

import assert from 'node:assert/strict';
import { unauthorizedResponse, verifyBasicAuth } from '../workers/auth.js';
import { SECURITY_HEADERS, applySecurityHeaders } from '../workers/security-headers.js';

const user = 'reviewer';
const pass = 'correct-horse';

function encodeBasic(u, p) {
  return `Basic ${btoa(`${u}:${p}`)}`;
}

assert.deepEqual(verifyBasicAuth(null, user, pass), { ok: false, status: 401 });
assert.deepEqual(verifyBasicAuth('Bearer x', user, pass), { ok: false, status: 400 });
assert.deepEqual(verifyBasicAuth('Basic !!!', user, pass), { ok: false, status: 400 });
// ユーザー名誤り / パスワード誤り / 両方誤り / 正しい資格情報
assert.deepEqual(verifyBasicAuth(encodeBasic('wrong', pass), user, pass), {
  ok: false,
  status: 401,
});
assert.deepEqual(verifyBasicAuth(encodeBasic(user, 'nope'), user, pass), {
  ok: false,
  status: 401,
});
assert.deepEqual(verifyBasicAuth(encodeBasic('wrong', 'nope'), user, pass), {
  ok: false,
  status: 401,
});
assert.deepEqual(verifyBasicAuth(encodeBasic(user, pass), user, pass), { ok: true });

// パスワード内のコロンも許容（最初のコロンのみ区切り）。
const passWithColon = 'a:b:c';
assert.deepEqual(verifyBasicAuth(encodeBasic(user, passWithColon), user, passWithColon), {
  ok: true,
});

const requiredHeaderNames = [
  'Content-Security-Policy',
  'X-Frame-Options',
  'X-Content-Type-Options',
  'Referrer-Policy',
  'Permissions-Policy',
  'Strict-Transport-Security',
  'X-Robots-Tag',
];

for (const name of requiredHeaderNames) {
  assert.equal(typeof SECURITY_HEADERS[name], 'string');
  assert.ok(SECURITY_HEADERS[name].length > 0, `${name} must be non-empty`);
}

assert.equal(SECURITY_HEADERS['X-Frame-Options'], 'DENY');
assert.equal(SECURITY_HEADERS['X-Content-Type-Options'], 'nosniff');
assert.equal(SECURITY_HEADERS['Referrer-Policy'], 'strict-origin-when-cross-origin');
assert.equal(SECURITY_HEADERS['X-Robots-Tag'], 'noindex, nofollow');
assert.match(SECURITY_HEADERS['Strict-Transport-Security'], /max-age=\d+/);
assert.match(SECURITY_HEADERS['Permissions-Policy'], /camera=\(\)/);
assert.doesNotMatch(SECURITY_HEADERS['Content-Security-Policy'], /unsafe-inline/);
assert.match(SECURITY_HEADERS['Content-Security-Policy'], /script-src[^;]*'sha256-/);
assert.match(SECURITY_HEADERS['Content-Security-Policy'], /style-src[^;]*'sha256-/);

// 401 応答にもセキュリティヘッダーが付くこと
const unauthorized = unauthorizedResponse(401, 'Authentication required.');
for (const name of requiredHeaderNames) {
  assert.equal(unauthorized.headers.get(name), SECURITY_HEADERS[name], `401 missing ${name}`);
}

// 任意 Headers への付与
const applied = applySecurityHeaders(new Headers({ 'Content-Type': 'text/html' }));
assert.equal(applied.get('Content-Type'), 'text/html');
assert.equal(applied.get('X-Content-Type-Options'), 'nosniff');

console.log('test-basic-auth: all assertions passed');
