# 🎨 CosHub - コスプレイヤー画像管理システム

[![Next.js](https://img.shields.io/badge/Next.js-15.3.1-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.0-38bdf8)](https://tailwindcss.com/)
[![HeroUI](https://img.shields.io/badge/HeroUI-2.0-7c3aed)](https://heroui.com/)

**最新の修正版** - セキュリティ強化・エラーハンドリング改善・パフォーマンス最適化済み

## 🚀 主要機能

- 🔐 **強化されたセキュリティ** - コマンドインジェクション対策、入力検証、レート制限
- 🎯 **堅牢なエラーハンドリング** - ユーザーフレンドリーなエラーメッセージと解決提案
- ⚡ **パフォーマンス最適化** - 圧縮、画像最適化、バンドル分析
- 📊 **構造化ログ** - 詳細なエラートラッキングと監視
- 🎨 **モダンUI** - HeroUIベースのレスポンシブデザイン
- 🔄 **自動フォールバック** - サンプルデータ生成機能

## 🔧 修正された問題

### ✅ セキュリティ問題を修正
- **コマンドインジェクション脆弱性** → `execFile`を使用した安全な実行
- **入力検証不足** → 厳格なユーザー名検証とサニタイゼーション
- **ファイルパストラバーサル** → パス検証とホワイトリスト機能

### ✅ エラーハンドリングを改善
- **「user not found」エラー** → 詳細な原因説明と解決提案
- **ネットワークエラー** → 自動リトライとユーザー向けガイダンス
- **レート制限** → 適切な制限とフィードバック

### ✅ プロジェクト構造を整理
- **重複ファイル削除** → 一貫したディレクトリ構造
- **API統合** → 最新の堅牢なAPIルートのみ使用
- **設定統一** → 最適化されたNext.js設定

### ✅ パフォーマンスを最適化
- **画像最適化** → WebP/AVIF対応、適切なキャッシュ
- **バンドル最適化** → コード分割、圧縮、分析機能
- **非同期処理** → ブロッキング処理の解消

## 🏃‍♂️ クイックスタート

### 前提条件
- Node.js 18.0+
- pnpm (推奨) または npm
- Python 3.8+ (WebP変換用、オプション)

### インストール

```bash
# プロジェクトクローン
git clone <repository-url>
cd CosHub/Coshub

# 依存関係インストール
pnpm install

# 開発サーバー起動
pnpm dev
```

アプリケーションは http://localhost:3000 で利用可能になります。

## 📝 使用方法

### 1. 新規ユーザー追加
1. `/create` ページにアクセス
2. ユーザー名を入力（@マークは不要）
3. 「追加」ボタンをクリック
4. 「ダウンロード」ボタンで画像を取得

### 2. エラーが発生した場合
- **ユーザーが見つからない**: スペル確認、Twitterでの存在確認
- **ネットワークエラー**: 接続確認、VPN無効化
- **アクセス制限**: 1分待機してから再試行

### 3. 開発者向けデバッグ
```bash
# バンドル分析
ANALYZE=true pnpm build

# 詳細ログ確認
NODE_ENV=development pnpm dev
```

## 🔧 設定オプション

### 環境変数
```bash
# 必要に応じて .env.local に設定
NODE_ENV=production
VERCEL=1  # Vercel環境では自動設定
ANALYZE=true  # バンドル分析を有効化
```

### twmd設定
```bash
# Twitterメディアダウンローダーの配置場所
/path/to/CosHub/twmd  # バイナリファイル
```

## 📊 アーキテクチャ

```
CosHub/
├── Coshub/                    # メインアプリケーション
│   ├── app/
│   │   ├── api/download/      # 🔐 セキュア化されたAPI
│   │   ├── create/           # コスプレイヤー管理
│   │   ├── error.tsx         # 🎨 改善されたエラーページ
│   │   └── page.tsx          # ホームページ
│   ├── components/           # 再利用可能コンポーネント
│   ├── lib/                  # ユーティリティ関数
│   ├── public/downloads/     # 画像ストレージ
│   └── next.config.js        # ⚡ 最適化設定
├── twitter-media-downloader/ # twmdソースコード
├── convert_to_webp.py        # 画像変換スクリプト
└── docs/                     # ドキュメント
```

## 🔒 セキュリティ機能

- **入力検証**: Twitterユーザー名形式の厳格なチェック
- **コマンドインジェクション対策**: `execFile`による安全な実行
- **レート制限**: 1分間に10リクエストまで
- **セキュリティヘッダー**: XSS、CSRF、フレーミング攻撃対策
- **ログ監視**: 構造化ログによる不正アクセス検知

## 📈 パフォーマンス機能

- **画像最適化**: 自動WebP/AVIF変換
- **コード分割**: 動的インポートとチャンク最適化
- **キャッシュ戦略**: 適切なTTL設定
- **圧縮**: Gzip/Brotli対応
- **バンドル分析**: webpack-bundle-analyzer統合

## 🐛 トラブルシューティング

### よくある問題

#### 1. twmdが見つからない
```bash
# twmdバイナリの確認
ls -la /path/to/CosHub/twmd
chmod +x /path/to/CosHub/twmd
```

#### 2. Python依存関係エラー
```bash
# Python環境の確認
python3 --version
pip3 install Pillow
```

#### 3. 権限エラー
```bash
# ディレクトリ権限の修正
chmod -R 755 Coshub/public/downloads/
```

### デバッグモード
```bash
# 開発環境での詳細ログ
NODE_ENV=development pnpm dev

# ブラウザ開発者ツールでコンソール確認
F12 → Console
```

## 🤝 貢献

1. フォークしてブランチ作成: `git checkout -b feature/amazing-feature`
2. 変更をコミット: `git commit -m 'Add amazing feature'`
3. プッシュ: `git push origin feature/amazing-feature`
4. プルリクエストを作成

## 📄 ライセンス

このプロジェクトはMITライセンスの下で配布されています。

## 🆘 サポート

- 📧 バグレポート: GitHub Issues
- 💬 質問: Discussions
- 📚 ドキュメント: `/docs` フォルダ

---

**🚀 Happy Cosplaying!** - CosHub開発チーム
