/**
 * Basic 認証ヘルパーの回帰テスト（Node 上で実行）。
 * 使い方: node scripts/test-basic-auth.mjs
 */

import assert from 'node:assert/strict';
import { verifyBasicAuth } from '../workers/auth.js';

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

console.log('test-basic-auth: all assertions passed');
