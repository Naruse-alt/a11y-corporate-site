/**
 * WCAG 2.2 達成基準の表示用カタログ。
 * リンク先は WAIC による Understanding 日本語訳（公式の解説ページ）。
 * 「意識した観点」の参照用であり、適合宣言には使わない。
 */
export interface Criterion {
  /** 達成基準番号（例: "2.4.1"） */
  readonly id: string;
  /** 一覧表示用ラベル（番号・名称・適合レベル） */
  readonly label: string;
  /** WAIC Understanding（WCAG 2.2）への URL */
  readonly href: string;
}

const WAIC_UNDERSTANDING = 'https://waic.jp/translations/WCAG22/Understanding';

function criterion(id: string, name: string, level: 'A' | 'AA' | 'AAA', slug: string): Criterion {
  return {
    id,
    label: `${id} ${name} ${level}`,
    href: `${WAIC_UNDERSTANDING}/${slug}`,
  };
}

/**
 * サイトで参照する達成基準のみを掲載。
 * 名称は WAIC Understanding 目次の日本語に合わせる。
 */
export const criteriaCatalog = {
  '1.1.1': criterion('1.1.1', '非テキストコンテンツ', 'A', 'non-text-content'),
  '1.3.1': criterion('1.3.1', '情報及び関係性', 'A', 'info-and-relationships'),
  '1.3.5': criterion('1.3.5', '入力目的の特定', 'AA', 'identify-input-purpose'),
  '1.4.3': criterion('1.4.3', 'コントラスト（最低限）', 'AA', 'contrast-minimum'),
  '1.4.10': criterion('1.4.10', 'リフロー', 'AA', 'reflow'),
  '1.4.11': criterion('1.4.11', '非テキストのコントラスト', 'AA', 'non-text-contrast'),
  '2.1.1': criterion('2.1.1', 'キーボード', 'A', 'keyboard'),
  '2.1.2': criterion('2.1.2', 'キーボードトラップなし', 'A', 'no-keyboard-trap'),
  // 2.3.3 は WCAG 上 AAA。意識した観点として掲載するが、サイトの達成目標（AA）とは別枠。
  '2.3.3': criterion('2.3.3', 'インタラクションによるアニメーション', 'AAA', 'animation-from-interactions'),
  '2.4.1': criterion('2.4.1', 'ブロックスキップ', 'A', 'bypass-blocks'),
  '2.4.3': criterion('2.4.3', 'フォーカス順序', 'A', 'focus-order'),
  '2.4.6': criterion('2.4.6', '見出し及びラベル', 'AA', 'headings-and-labels'),
  '2.4.7': criterion('2.4.7', 'フォーカスの可視化', 'A', 'focus-visible'),
  // 2.4.11 は「隠されないフォーカス」。旧メモの「フォーカスの外観」とは別基準（外観は 2.4.13 AAA）。
  '2.4.11': criterion('2.4.11', '隠されないフォーカス（最低限）', 'AA', 'focus-not-obscured-minimum'),
  '2.5.8': criterion('2.5.8', 'ターゲットのサイズ（最低限）', 'AA', 'target-size-minimum'),
  '3.2.3': criterion('3.2.3', '一貫したナビゲーション', 'AA', 'consistent-navigation'),
  '3.2.4': criterion('3.2.4', '一貫した識別性', 'AA', 'consistent-identification'),
  '3.3.1': criterion('3.3.1', 'エラーの特定', 'A', 'error-identification'),
  '3.3.2': criterion('3.3.2', 'ラベル又は説明', 'A', 'labels-or-instructions'),
  '3.3.3': criterion('3.3.3', 'エラー修正の提案', 'AA', 'error-suggestion'),
  '3.3.7': criterion('3.3.7', '冗長な入力項目', 'A', 'redundant-entry'),
  '4.1.2': criterion('4.1.2', '名前・役割・値', 'A', 'name-role-value'),
} as const satisfies Record<string, Criterion>;

export type CriterionId = keyof typeof criteriaCatalog;

export function getCriterion(id: CriterionId): Criterion {
  return criteriaCatalog[id];
}
