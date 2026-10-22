# Inclusive Works — コーポレートサイト

[![CI](https://github.com/Naruse-alt/a11y-corporate-site/actions/workflows/ci.yml/badge.svg)](https://github.com/Naruse-alt/a11y-corporate-site/actions/workflows/ci.yml)

Web アクセシビリティ対応を強みとする架空企業 **Inclusive Works** のコーポレートサイトです。  
WCAG 2.2 レベル AA の達成を目標とし、試験結果を公開する方針で実装しています（「準拠」宣言はしません）。

## 技術スタック

| 領域 | 内容 |
| --- | --- |
| フレームワーク | [Astro](https://astro.build/) 7（静的出力。UI フレームワークは未使用） |
| 言語 | TypeScript（`astro check`） |
| スタイル | 素の CSS + カスタムプロパティ（`src/styles/`） |
| フォント | IBM Plex Sans JP（`@fontsource/ibm-plex-sans-jp`、セルフホスト） |
| ランタイム | Node.js 22 以上（`.nvmrc` / `engines.node`） |
| 品質ゲート | GitHub Actions（`.github/workflows/ci.yml`） |
| プレビュー・デプロイ | Cloudflare Workers Builds（`wrangler.jsonc` + `workers/basic-auth.js`） |
| E2E | Playwright + `@axe-core/playwright`（`e2e/`） |

## アクセシビリティの取り組み

達成目標は **WCAG 2.2 レベル AA** です。実装の一部と対応する達成基準の例:

| 取り組み | 達成基準（例） |
| --- | --- |
| スキップリンク（`#main` へ移動。`tabindex="-1"` でフォーカス可能） | 2.4.1 ブロックスキップ A／2.4.3 フォーカス順序 A |
| モバイルドロワー（ネイティブ `<dialog>`。Esc で閉じ、トリガーへフォーカス復帰） | 2.1.2 キーボードトラップなし A／2.4.3 フォーカス順序 A／4.1.2 名前・役割・値 A |
| お問い合わせフォームのエラー（`aria-invalid` / `aria-describedby` で入力欄と関連付け） | 3.3.1 エラーの特定 A／1.3.1 情報及び関係性 A／4.1.2 名前・役割・値 A |
| 色トークンのコントラスト検証（`scripts/contrast.mjs`。推測禁止） | 1.4.3 コントラスト（最低限）AA／1.4.11 非テキストのコントラスト AA |
| インタラクティブ要素の二重フォーカスリング | 2.4.7 フォーカスの可視化 A |
| ネイティブ HTML 優先・不要な ARIA を付けない | 4.1.2 ほか（方針は `AGENTS.md`） |

キーボード操作の詳細は [`docs/keyboard-specs.md`](docs/keyboard-specs.md) を参照してください。

## 品質保証（CI）

Pull request と `main` への push で、GitHub Actions のワークフロー **CI**（[`.github/workflows/ci.yml`](.github/workflows/ci.yml)）が次を実行します。

1. **Type check** — `npm run check`（`astro check`）
2. **Build** — `npm run build`
3. **Contrast check** — `npm run contrast`（`scripts/contrast.mjs`）
4. **E2E accessibility** — Playwright Chromium のインストール後、`npx playwright test`（axe 含む）

デプロイやシークレット依存のステップは CI に含めていません。

### axe について

E2E の axe（WCAG 2.x A/AA タグ）は **回帰検知の品質ゲート** です。  
違反ゼロをもって WCAG 適合を証明するものではありません。自動チェックで拾える範囲と、人手（スクリーンリーダー等）が必要な範囲は分けて扱います。

## CI/CD の役割分担

| 役割 | 担当 |
| --- | --- |
| 品質ゲート（型・ビルド・コントラスト・E2E） | **GitHub Actions**（本リポジトリの `CI` ワークフロー） |
| プレビュー・本番デプロイ | **Cloudflare Workers Builds**（静的成果物 `dist/` を Worker + Static Assets で配信。HTTP Basic 認証あり） |

ローカルから Cloudflare 向けに触る場合のスクリプト: `npm run preview:cf` / `npm run deploy:cf`（`wrangler`）。認証用 Secret（`BASIC_USER` / `BASIC_PASS`）はリポジトリに含めません。

## AI エージェントとの分担

開発時の共通ルールは次に集約しています。

- [`AGENTS.md`](AGENTS.md) — プロジェクト規約（WCAG 目標、絶対規則、コミット／ドキュメント同期）
- [`.cursor/rules/`](.cursor/rules/) — 領域別ルール（例: `a11y-core.mdc`、`styles.mdc`、`forms.mdc`、`astro-components.mdc`、`review-a11y.mdc`）

運用の要点:

- コントラスト比は推測せず、`npm run contrast` の出力のみを根拠にする
- ネイティブ HTML を優先し、不要な ARIA を付けない（付ける場合は理由をコメントする）
- 設計判断は [`docs/decisions.md`](docs/decisions.md) に追記する
- スクリーンリーダー検証の「確認済み」断定や、axe ゼロ＝AA 達成という結論は書かない

## セットアップと実行

前提: Node.js 22 以上（`.nvmrc` 参照）。

```bash
npm ci
```

| コマンド | 説明 |
| --- | --- |
| `npm run dev` | 開発サーバー（`astro dev`） |
| `npm run build` | 静的サイトを `dist/` にビルド |
| `npm run preview` | ビルド成果物のローカルプレビュー |
| `npm run check` | Astro / TypeScript の静的診断 |
| `npm run contrast` | 色トークンの WCAG コントラスト検証 |
| `npm run test:e2e` | ビルド後に Playwright E2E を実行 |
| `npx playwright test` | 既存の `dist/` を前提に E2E のみ実行（CI と同系統） |
| `npx playwright test --ui` | Playwright UI モード |
| `npx playwright install chromium` | 初回など、ブラウザバイナリの導入 |
| `npm run preview:cf` | ビルド後に `wrangler dev` |
| `npm run deploy:cf` | ビルド後に `wrangler deploy` |
| `npm run test:basic-auth` | Basic 認証 Worker の検証スクリプト |

## ドキュメント

- [`docs/decisions.md`](docs/decisions.md) — 設計判断ログ（日付／対象／達成基準／選定理由／代替案）
- [`docs/keyboard-specs.md`](docs/keyboard-specs.md) — キーボード操作仕様
- [`AGENTS.md`](AGENTS.md) — プロジェクト規約
