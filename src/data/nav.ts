// サイト内ナビゲーションの情報源。
//
// ヘッダー（とモバイルドロワー）は primaryNavItems、
// フッターは footerNavItems を参照する。
// ラベルは両リストで同一文言にし、3.2.4 一貫した識別性 AA を担保する。
// 順序も「主要 → 補足」の関係を崩さない（3.2.3 一貫したナビゲーション AA）。

export interface NavItem {
  /** 遷移先のパス（末尾スラッシュあり） */
  readonly href: string;
  /** 表示ラベル（掲載箇所で同一の文言を使う） */
  readonly label: string;
}

/**
 * ヘッダー／ドロワー用の主要ナビ。
 * 項目数を抑え、狭い画面でも折り返しや圧迫を起きにくくする。
 */
export const primaryNavItems: readonly NavItem[] = [
  { href: '/', label: 'ホーム' },
  { href: '/services/', label: 'サービス' },
  { href: '/about/', label: '会社概要' },
  { href: '/accessibility/', label: 'アクセシビリティ方針' },
] as const;

/**
 * フッター用。主要ナビに加え、二次的な到達先（FAQ 等）を含める。
 * JS 無効時でも全ページへフッターから到達できる。
 */
export const footerNavItems: readonly NavItem[] = [
  { href: '/', label: 'ホーム' },
  { href: '/services/', label: 'サービス' },
  { href: '/about/', label: '会社概要' },
  { href: '/accessibility/', label: 'アクセシビリティ方針' },
  { href: '/faq/', label: 'よくある質問' },
  { href: '/contact/', label: 'お問い合わせ' },
] as const;

/**
 * 現在ページかどうかを判定する。
 * ルート('/')は完全一致、それ以外は前方一致（子ページも現在地扱い）。
 */
export function isCurrentPath(itemHref: string, currentPath: string): boolean {
  if (itemHref === '/') {
    return currentPath === '/';
  }
  return currentPath === itemHref || currentPath.startsWith(itemHref);
}
