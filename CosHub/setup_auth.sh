#!/bin/bash

# X認証設定スクリプト
echo "=== X (Twitter) R18認証設定 ==="
echo ""
echo "Step 1: ブラウザでX (twitter.com) にログイン"
echo "Step 2: F12 → Application → Cookies → https://x.com"
echo "Step 3: 以下の2つのクッキー値をコピー:"
echo "  - auth_token (32文字の英数字)"
echo "  - ct0 (40文字の英数字)"
echo ""

read -p "auth_token を入力してください: " AUTH_TOKEN
read -p "ct0 を入力してください: " CT0

echo ""
echo "=== 認証テスト実行 ==="

# 環境変数設定
export TWMD_AUTH_TOKEN="$AUTH_TOKEN"
export TWMD_CT0_TOKEN="$CT0"

#認証付きダウンロードテスト
echo "クッキー認証で @yyyyyyuuko_1 をダウンロード中..."
./twitter-media-downloader/twmd -C -u yyyyyyuuko_1 -o Coshub/public/downloads -i -n 3 -s large --no-banner << EOF_INPUT
auth_token=$AUTH_TOKEN;ct0=$CT0
EOF_INPUT

echo ""
echo "=== ダウンロード結果確認 ==="
find Coshub/public/downloads/yyyyyyuuko_1 -name "*.jpg" -o -name "*.png" | head -5

