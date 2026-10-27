# セキュリティ方針

## サポート対象

セキュリティ修正の対象は、`main` ブランチおよびそこから配信している本番デプロイのみです。フォークやローカル改変、未マージの実験ブランチは対象外です。

## 脆弱性の報告

脆弱性を見つけた場合は、**公開の Issue / Discussion / Pull Request に書かないでください。**

このリポジトリの **Security** タブから GitHub の [Private vulnerability reporting](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing-information-about-vulnerabilities/privately-reporting-a-security-vulnerability) を使って報告してください。再現手順・影響範囲・可能であれば修正案を含めていただけると対応しやすいです。

対応はベストエフォートで行い、具体的な期限は約束しません。

## 既存の保護（参考）

現時点の本番経路には、次のような対策があります（完全性を保証するものではありません）。

- Cloudflare Workers による Basic 認証
- セキュリティヘッダーおよび Content-Security-Policy（インライン向けハッシュ）
- Dependabot による依存関係の更新通知
