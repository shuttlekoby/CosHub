# Twitter認証設定ガイド

gallery-dlでTwitter/Xからダウンロードするには認証が必要です。

## 🍪 方法1: Cookies方式（推奨）

### ステップ1: Twitter/Xにブラウザでログイン
1. ブラウザでTwitter/Xにログインします
2. 開発者ツールを開きます (F12 または Cmd+Option+I)

### ステップ2: Cookieを取得
1. **Application** (Chromeの場合) または **Storage** (Firefoxの場合) タブを開く
2. 左側の **Cookies** → **https://x.com** を選択
3. 以下の値をコピー：
   - `auth_token` の値
   - `ct0` の値

### ステップ3: 設定ファイルを作成
```bash
mkdir -p ~/.config/gallery-dl
```

`~/.config/gallery-dl/config.json` ファイルを作成：
```json
{
    "extractor": {
        "twitter": {
            "cookies": {
                "auth_token": "取得したauth_tokenの値",
                "ct0": "取得したct0の値"
            }
        }
    }
}
```

## 🔑 方法2: Twitter API Bearer Token

### ステップ1: Twitter Developer Account
1. [Twitter Developer Platform](https://developer.twitter.com/) でアカウント作成
2. アプリを作成してBearer Tokenを取得

### ステップ2: 設定ファイル
```json
{
    "extractor": {
        "twitter": {
            "api": {
                "bearer-token": "YOUR_BEARER_TOKEN_HERE"
            }
        }
    }
}
```

## 🌐 方法3: OAuth認証（将来実装予定）

サイト内でTwitter OAuth認証を行い、自動的に認証情報を設定する機能を実装予定です。

## 確認方法

設定後、以下のコマンドでテスト：
```bash
python3 -m gallery_dl --config ~/.config/gallery-dl/config.json "https://x.com/username"
```

## トラブルシューティング

- **403エラー**: Cookieが期限切れの可能性。再取得してください
- **404エラー**: ユーザーが存在しないか、プライベートアカウント
- **レート制限**: しばらく待ってから再試行

## セキュリティ注意事項

- Cookieやトークンは秘密情報です
- 他人と共有しないでください
- 定期的に更新することを推奨します 