# CosHub - Twitter Cosplayer Media Manager

Twitter画像を取得してSanityで管理するNext.js 15アプリケーション

## 🚀 概要

CosHubは、Twitterの特定ユーザーの画像を自動取得し、Sanityを使用してサーバーサイドで管理・配信するシステムです。全ての端末で同期された画像表示を提供します。

## ✨ 主な機能

- 🔄 サーバーサイドでのTwitter画像自動取得
- 🖼️ Sanityによる画像管理・配信  
- 📱 全端末での同期表示
- ⚡ ISRによる定期更新
- 🎨 WebP変換による最適化
- 🔒 セキュアな認証システム

## 🛠️ 技術スタック

- **フロントエンド**: Next.js 15 + TypeScript + Tailwind CSS + HeroUI
- **バックエンド**: Next.js API Routes
- **CMS**: Sanity
- **ホスティング**: Vercel
- **画像取得**: twmd (Twitter Media Downloader)

## 📋 セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.local`ファイルを作成し、以下の変数を設定してください：

```env
# Sanity Configuration
NEXT_PUBLIC_SANITY_PROJECT_ID=your_sanity_project_id
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_TOKEN=your_sanity_api_token

# ISR Revalidation
REVALIDATION_SECRET=your_secret_key

# Twitter Authentication (optional - can be set via /auth page)
TWITTER_AUTH_TOKEN=your_twitter_auth_token
TWITTER_CT0=your_twitter_ct0_token
```

### 3. Sanityプロジェクトの設定

1. [Sanity.io](https://sanity.io)でプロジェクトを作成
2. データセットを設定（通常は`production`）
3. API Tokenを生成（Editor権限）
4. プロジェクトIDとTokenを環境変数に設定

### 4. 開発サーバーの起動

```bash
npm run dev
```

## 🔧 Sanityスキーマ

以下のスキーマがSanityで必要です：

### Cosplayer

```javascript
{
  name: 'cosplayer',
  type: 'document',
  fields: [
    { name: 'username', type: 'string', validation: Rule => Rule.required() },
    { name: 'displayName', type: 'string' },
    { name: 'lastUpdated', type: 'datetime' },
    { name: 'imageCount', type: 'number' }
  ]
}
```

### CosplayerImage

```javascript
{
  name: 'cosplayerImage',
  type: 'document',
  fields: [
    { name: 'username', type: 'string', validation: Rule => Rule.required() },
    { name: 'originalFilename', type: 'string' },
    { name: 'imageAsset', type: 'image' },
    { name: 'uploadedAt', type: 'datetime' },
    { name: 'twitterUrl', type: 'url' },
    { name: 'metadata', type: 'object', fields: [
      { name: 'width', type: 'number' },
      { name: 'height', type: 'number' },
      { name: 'format', type: 'string' },
      { name: 'size', type: 'number' }
    ]}
  ]
}
```

## 📱 API エンドポイント

### 画像ダウンロード
- `POST /api/download` - Twitter画像をダウンロードしてSanityにアップロード

### Sanity連携
- `GET /api/sanity-cosplayers` - コスプレイヤー一覧取得
- `POST /api/sanity-cosplayers` - ISR定期更新
- `GET /api/sanity-images` - 特定ユーザーの画像一覧取得  
- `POST /api/sanity-upload` - 画像をSanityにアップロード

## ⏰ 定期更新の設定

### Vercel Cronの使用

`vercel.json`に以下を追加：

```json
{
  "crons": [
    {
      "path": "/api/sanity-cosplayers",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

### 外部Cronサービスの使用

```bash
# 6時間毎に更新
curl -X POST https://your-app.vercel.app/api/sanity-cosplayers \
  -H "Content-Type: application/json" \
  -d '{"username": "target_username", "secret": "your_secret_key"}'
```

## 🎯 使用方法

### 1. 認証設定
`/auth`にアクセスしてTwitter認証情報を設定

### 2. 画像ダウンロード
`/create`でユーザー名を入力して画像を取得

### 3. 画像表示
自動的にSanityから全端末で同期表示

## 🔍 主要機能の詳細

### サーバーサイド画像取得
- twmdバイナリを使用してTwitter API経由で画像取得
- WebP変換による最適化
- 重複チェックによる効率的な更新

### Sanity統合
- 画像アセットとメタデータの管理
- CDN経由での高速配信
- 画像のリサイズ・最適化

### ISR (Incremental Static Regeneration)
- キャッシュ戦略による高速表示
- バックグラウンドでの自動更新
- stale-while-revalidate での無停止更新

## 🚀 デプロイ

### Vercelでのデプロイ

1. GitHubリポジトリを接続
2. 環境変数を設定
3. ビルド・デプロイ実行

### カスタムフック

以下のReactフックが利用可能：

- `useSanityCosplayers()` - コスプレイヤー一覧取得
- `useSanityImages(username)` - 特定ユーザー画像取得
- `useImageDownload()` - 画像ダウンロード管理

## 🛡️ セキュリティ

- API Tokenの適切な管理
- REVALIDATION_SECRETによる定期更新の保護
- CORS設定による適切なアクセス制御

## 📝 ライセンス

このプロジェクトはMITライセンスの下で公開されています。