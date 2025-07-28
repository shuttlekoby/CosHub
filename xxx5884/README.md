# gallery-dl Twitter Downloader

高性能なgallery-dlエンジンを使用したTwitter/X画像一括ダウンローダーWebアプリケーション

## 特徴

- 🚀 **高性能ダウンロード** - gallery-dlエンジンによる安定したダウンロード
- 🎯 **柔軟な設定** - 最大投稿数の調整可能
- 📱 **レスポンシブUI** - モダンで使いやすいインターフェース
- 📊 **メタデータ保存** - gallery-dlの豊富なメタデータ機能
- 🔄 **重複回避** - 既存ファイルの自動スキップ
- 🛡️ **エラーハンドリング** - 詳細なエラー情報とインストール案内

## 技術スタック

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: TailwindCSS
- **Backend**: gallery-dl (Python)
- **Icons**: Lucide React

## 前提条件

### gallery-dlのインストール

```bash
# Python pip経由でインストール
pip install gallery-dl

# または conda経由
conda install -c conda-forge gallery-dl

# macOS Homebrew経由
brew install gallery-dl
```

### gallery-dlの設定（オプション）

gallery-dlの設定ファイルを作成することで、より詳細な設定が可能です：

```bash
# 設定ディレクトリを作成
mkdir -p ~/.config/gallery-dl

# 設定ファイルの例
cat > ~/.config/gallery-dl/config.json << 'EOF'
{
    "extractor": {
        "twitter": {
            "retweets": false,
            "videos": false,
            "cards": false
        }
    },
    "output": {
        "mode": "terminal"
    }
}
EOF
```

## インストール

1. **リポジトリをクローン**
```bash
git clone <repository-url>
cd gallery-dl-twitter-downloader
```

2. **依存関係をインストール**
```bash
npm install
```

3. **開発サーバーを起動**
```bash
npm run dev
```

4. **ブラウザでアクセス**
```
http://localhost:3000
```

## 使用方法

### Webインターフェース

1. **ユーザーIDを入力**
   - 例: `elonmusk` または `@elonmusk`

2. **最大投稿数を設定**
   - デフォルト: 1000投稿
   - 範囲: 1-10000

3. **ダウンロード開始**
   - 画像が `./downloads/x.com/[username]/` に保存されます

### gallery-dlコマンド例（参考）

```bash
# 基本的な使用方法
gallery-dl "https://x.com/username"

# 投稿数を制限
gallery-dl --range 1-100 "https://x.com/username"

# 出力ディレクトリを指定
gallery-dl --dest ./downloads "https://x.com/username"

# 画像のみダウンロード（動画除外）
gallery-dl --filter "extension in ('jpg', 'jpeg', 'png', 'gif', 'webp')" "https://x.com/username"
```

## gallery-dlの利点

### 🏆 信頼性とパフォーマンス
- アクティブに開発・メンテナンスされている
- 多数のサイトに対応（600+）
- レート制限やエラーハンドリングが優秀

### 📦 豊富な機能
- メタデータの詳細保存
- カスタムファイル名テンプレート
- 並列ダウンロード
- 部分ダウンロードの再開
- プラグインシステム

### 🔧 設定の柔軟性
- JSON設定ファイル
- コマンドライン引数
- 環境変数による設定
- サイト別の個別設定

## API仕様

### POST /api/gallery-dl

リクエスト:
```json
{
  "userId": "username",
  "maxPosts": 1000
}
```

レスポンス（成功時）:
```json
{
  "success": true,
  "username": "username",
  "downloadCount": 42,
  "outputPath": "/path/to/downloads/x.com/username",
  "message": "@usernameの画像を42枚ダウンロードしました",
  "stdout": "gallery-dl実行ログ..."
}
```

レスポンス（エラー時）:
```json
{
  "error": "エラーメッセージ",
  "stderr": "詳細なエラー情報"
}
```

## トラブルシューティング

### gallery-dlが見つからない
```bash
# インストール確認
gallery-dl --version

# パスの確認
which gallery-dl

# 再インストール
pip install --upgrade gallery-dl
```

### 403/404エラー
- アカウントがプライベート設定の可能性
- アカウントが凍結されている可能性
- レート制限に達している可能性

### ダウンロードが遅い
```bash
# 並列ダウンロード数を調整
gallery-dl --config extractor.twitter.sleep=1 "https://x.com/username"
```

## 設定ファイル例

`~/.config/gallery-dl/config.json`:
```json
{
    "extractor": {
        "twitter": {
            "include": "timeline",
            "retweets": false,
            "replies": false,
            "videos": false,
            "cards": false
        },
        "base-directory": "./downloads/"
    },
    "output": {
        "progress": true,
        "mode": "terminal"
    },
    "downloader": {
        "part-directory": "/tmp/.gallery-dl/"
    }
}
```

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。

## 関連リンク

- [gallery-dl公式リポジトリ](https://github.com/mikf/gallery-dl)
- [gallery-dl公式ドキュメント](https://gallery-dl.readthedocs.io/)
- [Next.js公式サイト](https://nextjs.org/)

---

© 2024 gallery-dl Twitter Downloader - Powered by gallery-dl 