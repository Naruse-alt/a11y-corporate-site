/**
 * 認証済みレスポンスの Cache-Control 判定（Workers / Node テスト共用）。
 */

/**
 * @param {string} pathname URL の pathname（クエリ・ハッシュなし）
 * @returns {string} Cache-Control 値
 */
export function cacheControlForAuthenticatedPath(pathname) {
  // /_astro/ はファイル名にコンテンツハッシュが付くビルド成果物のみ。
  // ブラウザ再取得によるフォントちらつき（FOUT）を抑えるため長くキャッシュする。
  // private を残し、共有キャッシュ（CDN 等）には載せない。
  if (pathname.startsWith('/_astro/')) {
    return 'private, max-age=31536000, immutable';
  }

  // HTML 等は毎回取り直し。認証後コンテンツの古いキャッシュ表示を避ける。
  return 'private, no-store';
}
