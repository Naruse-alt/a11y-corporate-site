// サイト内ナビゲーションの単一情報源。
// ヘッダー・モバイルドロワー・フッターがこの定義を共有することで、
// 3.2.3 一貫したナビゲーション AA / 3.2.4 一貫した識別性 AA を担保する。

export interface NavItem {
  /** 遷移先のパス（末尾スラッシュあり） */
  readonly href: string;
  /** 表示ラベル（全ナビで同一の文言を使う） */
  readonly label: string;
}

export const navItems: readonly NavItem[] = [
  { href: '/', label: 'ホーム' },
  { href: '/accessibility/', label: 'アクセシビリティ方針' },
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
