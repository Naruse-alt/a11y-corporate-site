// 実装解説（ポートフォリオ用メタ情報）の単一情報源。
// コーポレート本体の UI を汚さず、「なぜそうしたか」を別ページで示す。

export interface AnnotationItem {
  readonly id: string;
  /** 一覧・見出し用の短い名前 */
  readonly title: string;
  /** 対象となる実ページ（なければ省略） */
  readonly demoHref?: string;
  readonly demoLabel?: string;
  /** 何をしたか */
  readonly summary: string;
  /** 対応する達成基準（表示用。断定的な適合宣言には使わない） */
  readonly criteria: readonly string[];
  /** やらなかったこと・却下案 */
  readonly avoided: string;
}

export interface AnnotationGroup {
  readonly id: string;
  readonly heading: string;
  readonly items: readonly AnnotationItem[];
}

export const annotationGroups: readonly AnnotationGroup[] = [
  {
    id: 'global',
    heading: 'サイト全体',
    items: [
      {
        id: 'skip-link',
        title: 'スキップリンク',
        summary:
          'ページ先頭に「本文へスキップ」を置き、繰り返しナビを飛ばして main へ到達できるようにしています。ネイティブのページ内リンクのみで、追加 ARIA は使いません。',
        criteria: ['2.4.1 ブロックスキップ A'],
        avoided: 'カスタムボタンや role="link" での再実装は、ネイティブ <a href="#main"> で足りるため却下。',
      },
      {
        id: 'focus',
        title: 'フォーカスの可視化',
        summary:
          ':focus-visible で明色 outline ＋ 暗色 box-shadow の二重リングを使い、明背景・暗背景の双方で視認できるようにしています。outline: none の単独使用はしません。',
        criteria: ['2.4.7 フォーカスの可視化 A', '2.4.11 フォーカスの外観（最低限）AA'],
        avoided: '単色 outline のみは背景によって消えるため却下。',
      },
      {
        id: 'contrast',
        title: 'コントラスト管理',
        summary:
          '色は tokens.css のカスタムプロパティに集約し、意味のある前景／背景ペアを scripts/contrast.mjs で機械判定します。数値の記載はスクリプト出力のみを根拠とします。',
        criteria: ['1.4.3 コントラスト（最低限）AA', '1.4.11 非テキストのコントラスト AA'],
        avoided: '暗算や「おそらく足りる」といった推測記載は規約で禁止しているため行いません。',
      },
      {
        id: 'theme-toggle',
        title: 'テーマ切替（進歩的強化）',
        summary:
          'テーマ切替ボタンは JS で生成します。無効時は死んだ UI を残さず、OS の prefers-color-scheme に従います。アイコンのみのため、例外的に aria-label で名前を担保します。',
        criteria: ['4.1.2 名前・役割・値 A', '2.5.8 ターゲットサイズ（最小）AA'],
        avoided: '常時描画の無効ボタンや、二値に収まらない aria-pressed の無理な付与は却下。',
      },
      {
        id: 'nav-dialog',
        title: 'モバイルナビ（ネイティブ dialog）',
        summary:
          '狭い画面のドロワーは <dialog showModal()> を使います。フォーカストラップ・Escape・背景の不活性化・閉鎖時のフォーカス復帰をブラウザに任せ、独自実装を最小化しています。',
        criteria: ['2.1.2 キーボードトラップなし A', '2.4.3 フォーカス順序 A', '4.1.2 名前・役割・値 A'],
        avoided: 'button + 自前フォーカストラップや、チェックボックス・ハックによるメニューは却下。',
      },
      {
        id: 'nav-split',
        title: 'ヘッダー／フッターのナビ振り分け',
        summary:
          'ヘッダーは主要4項目に抑え、FAQ・お問い合わせ・本解説などはフッター（二次）へ回します。ラベル文言は primary / footer で同一にし、識別性を崩しません。',
        criteria: ['3.2.3 一貫したナビゲーション AA', '3.2.4 一貫した識別性 AA'],
        avoided: '全ページをヘッダーに載せると密度が上がり、狭い幅で破綻しやすいため却下。',
      },
    ],
  },
  {
    id: 'pages',
    heading: 'ページ・パーツ別',
    items: [
      {
        id: 'home-hero',
        title: 'ホーム：二分割ヒーローとイラスト',
        demoHref: '/',
        demoLabel: 'ホームを見る',
        summary:
          '左に文言・CTA、右にイラストを置く二分割です。文字を画像に重ねないためコントラストを画像に依存させません。装飾的な意味を超える包摂表現を含むため、短い代替テキストを付けています。浮遊アニメは reduced-motion で停止します。',
        criteria: ['1.1.1 非テキストコンテンツ A', '1.4.10 リフロー AA', '2.3.3 アニメーションからのインタラクションによるトリガー AA'],
        avoided: '全幅背景＋文字オーバーレイはコントラスト管理が難しくなるため却下。',
      },
      {
        id: 'services',
        title: 'サービス：見出し構造とページ内目次',
        demoHref: '/services/',
        demoLabel: 'サービスを見る',
        summary:
          '3サービスをすべて展開し、h2 / h3 で構造化しています。独自タブやアコーディオンは使いません。先頭の目次はネイティブのページ内リンクです。',
        criteria: ['1.3.1 情報及び関係性 A', '2.4.1 ブロックスキップ A', '2.4.6 見出し及びラベル AA'],
        avoided: 'サービス説明を <details> で折りたたむ案は、FAQ と役割が重複するため却下。',
      },
      {
        id: 'faq',
        title: 'FAQ：ネイティブ details / summary',
        demoHref: '/faq/',
        demoLabel: 'FAQ を見る',
        summary:
          '開閉はブラウザ標準の <details>/<summary> に任せ、aria-expanded などの独自 ARIA は付けません。JS 無効でも開閉できます。',
        criteria: ['1.3.1 情報及び関係性 A', '2.1.1 キーボード A', '2.5.8 ターゲットサイズ（最小）AA'],
        avoided: 'button + パネル + aria-expanded の自作アコーディオンは、ネイティブで足りるため却下。',
      },
      {
        id: 'contact',
        title: 'お問い合わせ：送信なしデモフォーム',
        demoHref: '/contact/',
        demoLabel: 'お問い合わせを見る',
        summary:
          '実送信は行わず、ラベル関連付け・autocomplete・必須の文言明示・エラー特定／修正提案・成功時のライブリージョン・入力保持を見せ場にしています。',
        criteria: [
          '1.3.5 入力目的の特定 AA',
          '3.3.1 エラーの特定 A',
          '3.3.2 ラベル又は説明 A',
          '3.3.3 エラー修正の提案 AA',
          '3.3.7 冗長な入力 A',
        ],
        avoided: '受信サーバー導入や mailto 依存は、今回の見せ場の本質ではないため見送り。',
      },
      {
        id: 'about-policy',
        title: '会社概要・方針：prose と適合の言い方',
        demoHref: '/accessibility/',
        demoLabel: 'アクセシビリティ方針を見る',
        summary:
          '長文は prose と見出しで読みやすくし、「準拠」ではなく「達成目標とし、試験結果を公開する」と表現します。未検証の断定や「axe 0件＝AA達成」は書きません。',
        criteria: ['1.3.1 情報及び関係性 A', '2.4.6 見出し及びラベル AA'],
        avoided: '検証前の適合宣言や、自動チェック結果のみでの達成主張は規約で禁止。',
      },
    ],
  },
] as const;
