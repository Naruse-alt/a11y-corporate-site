/**
 * HTTP Basic 認証の判定ロジック（Pages Functions / Node テスト共用）。
 * 資格情報は環境変数経由のみ。リポジトリに値を置かない。
 */

const encoder = new TextEncoder();

/**
 * タイミング攻撃耐性のある文字列比較（Workers / Node 両対応）。
 * @param {string} a
 * @param {string} b
 * @returns {boolean}
 */
export function timingSafeEqual(a, b) {
  const aBytes = encoder.encode(a);
  const bBytes = encoder.encode(b);
  const len = Math.max(aBytes.byteLength, bBytes.byteLength);
  // 長さ差も mismatch に含め、ループは常に max 長まで回す。
  let mismatch = aBytes.byteLength === bBytes.byteLength ? 0 : 1;

  for (let i = 0; i < len; i += 1) {
    const left = i < aBytes.byteLength ? aBytes[i] : 0;
    const right = i < bBytes.byteLength ? bBytes[i] : 0;
    mismatch |= left ^ right;
  }

  return mismatch === 0;
}

/**
 * Authorization ヘッダを検証する。
 * @param {string | null} authorizationHeader
 * @param {string} expectedUser
 * @param {string} expectedPass
 * @returns {{ ok: true } | { ok: false, status: 400 | 401 }}
 */
export function verifyBasicAuth(authorizationHeader, expectedUser, expectedPass) {
  if (!authorizationHeader) {
    return { ok: false, status: 401 };
  }

  const [scheme, encoded] = authorizationHeader.split(' ');
  if (!encoded || scheme !== 'Basic') {
    return { ok: false, status: 400 };
  }

  let decoded;
  try {
    decoded = atob(encoded);
  } catch {
    return { ok: false, status: 400 };
  }

  const index = decoded.indexOf(':');
  if (index === -1) {
    return { ok: false, status: 400 };
  }

  const user = decoded.slice(0, index);
  const pass = decoded.slice(index + 1);

  if (!timingSafeEqual(expectedUser, user) || !timingSafeEqual(expectedPass, pass)) {
    return { ok: false, status: 401 };
  }

  return { ok: true };
}

/**
 * 未認証時の応答。
 * @param {number} status
 * @param {string} body
 * @param {{ challenge?: boolean }} [options]
 * @returns {Response}
 */
export function unauthorizedResponse(status, body, options = {}) {
  const headers = new Headers({
    'Cache-Control': 'no-store',
    'Content-Type': 'text/plain; charset=UTF-8',
  });

  // ブラウザに Basic 認証ダイアログを出させる（401 のときのみ）。
  if (options.challenge !== false && status === 401) {
    headers.set('WWW-Authenticate', 'Basic realm="Inclusive Works", charset="UTF-8"');
  }

  return new Response(body, { status, headers });
}
