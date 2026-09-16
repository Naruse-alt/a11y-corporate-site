# AIエージェント指示書キット
## アクセシビリティ × モーション（Three.js / GSAP）個人ポートフォリオ向け

このフォルダは **別リポジトリにコピーして使う** ための指示書セットです。  
架空コーポレートサイト用ではなく、「a11y を軸にしつつ、モダンな動きも見せる個人ポートフォリオ」用です。

## 新しいプロジェクトへの入れ方

1. 新しい Git リポジトリを作る
2. このフォルダ内のファイルを、新リポジトリのルートへ配置する

```text
（新リポジトリ）
├── AGENTS.md
├── .cursor/rules/
│   ├── a11y-core.mdc
│   ├── motion-webgl.mdc
│   ├── progressive-enhancement.mdc
│   └── styles.mdc
└── docs/
    ├── decisions.md          ← decisions.template.md をリネームして開始
    └── motion-a11y-checklist.md
```

3. Cursor（Cloud Agent 含む）で新リポジトリを開き、`AGENTS.md` が読まれることを確認する
4. 技術スタックやドメインが決まったら、`AGENTS.md` の「未確定（開始時に決める）」を埋める

## このキットの狙い

- **アクセシビリティを犠牲にしない** Triple / GSAP 演出
- JS / WebGL 無効でも **中身が読める**
- `prefers-reduced-motion` を必須対応にする
- 「なぜその動きを入れたか」を説明できる成果物にする

## 含めないもの

- 具体的なページデザイン一式
- Cloudflare / デプロイ手順（必要なら別途追加）
- 現行コーポレートサイトのコンテンツ転記
