# 🎯 CosHub 手作業ダウンロードガイド

## 📋 概要
このガイドでは、コスプレイヤーの画像を手作業でダウンロードし、CosHubサイトに正しく反映する手順を説明します。

## 🎯 重要なポイント
- **Twitter APIキー不要** - 公開情報のみ取得
- **ファイル構造が重要** - 正しいフォルダ構成で保存
- **WebP形式推奨** - 軽量で高品質

---

## 📁 必須ファイル構造

```
Coshub/public/downloads/
├── ユーザー名1/
│   └── img/
│       ├── 画像ID1.webp
│       ├── 画像ID2.webp
│       └── ...
├── ユーザー名2/
│   └── img/
│       └── ...
```

**例：**
```
Coshub/public/downloads/
├── _hina03_/
│   └── img/
│       ├── GpvIanBaYAEspUx.webp
│       ├── Gj0vAz8asAAs2gq.webp
│       └── ...
├── M_I_N_A_M_O_/
│   └── img/
│       └── ...
```

---

## 🛠️ 手順1: フォルダ準備

### 1.1 新しいユーザー用フォルダ作成

```bash
# 例：新しいユーザー「sakura_cos」を追加
mkdir -p Coshub/public/downloads/sakura_cos/img
```

### 1.2 権限設定（macOS/Linux）

```bash
chmod 755 Coshub/public/downloads/sakura_cos
chmod 755 Coshub/public/downloads/sakura_cos/img
```

---

## 📥 手順2: 画像ダウンロード方法

### 方法A: Twitterブラウザから手動保存

1. **Twitterでユーザーのメディアタブを開く**
   ```
   https://twitter.com/ユーザー名/media
   ```

2. **画像を右クリック → 「画像を保存」**
   - 元のファイル名をそのまま使用
   - 例：`GpvIanBaYAEspUx.jpg`

3. **保存先を指定**
   ```
   Coshub/public/downloads/ユーザー名/img/
   ```

### 方法B: 開発者ツール使用（上級者向け）

1. **ブラウザの開発者ツールを開く** (F12)
2. **Networkタブ → Imagesフィルター**
3. **ページをリロード**
4. **画像URLを取得してダウンロード**

---

## 🔄 手順3: WebP変換（推奨）

### 3.1 変換ツールのインストール

```bash
# macOS (Homebrew)
brew install webp

# Ubuntu/Debian
sudo apt install webp

# Windows
# https://developers.google.com/speed/webp/download からダウンロード
```

### 3.2 一括変換スクリプト

```bash
#!/bin/bash
# convert_to_webp.sh

USER_DIR="Coshub/public/downloads/$1/img"

if [ -z "$1" ]; then
    echo "使用方法: ./convert_to_webp.sh ユーザー名"
    exit 1
fi

cd "$USER_DIR"

for img in *.jpg *.jpeg *.png; do
    if [ -f "$img" ]; then
        filename="${img%.*}"
        cwebp -q 95 "$img" -o "${filename}.webp"
        rm "$img"  # 元ファイルを削除（オプション）
        echo "変換完了: ${filename}.webp"
    fi
done

echo "✅ $1 の画像変換が完了しました"
```

### 3.3 実行方法

```bash
chmod +x convert_to_webp.sh
./convert_to_webp.sh sakura_cos
```

---

## 📝 手順4: メタデータファイル作成

新しいユーザーをサイトに追加するには、メタデータファイルが必要です。

### 4.1 ユーザー情報ファイル作成

```bash
# Coshub/public/downloads/ユーザー名/metadata.json
```

### 4.2 metadata.json の内容例

```json
{
  "username": "sakura_cos",
  "displayName": "さくら",
  "bio": "コスプレイヤー・モデル 🌸",
  "followerCount": "12.5K",
  "downloadedAt": "2024-01-15T10:30:00Z",
  "totalFiles": 45,
  "tags": ["コスプレ", "モデル", "ポートレート"],
  "isRealData": true
}
```

---

## 🔧 手順5: サイトへの反映

### 5.1 既知ユーザーリストに追加

`app/api/download/route.ts` を編集：

```typescript
const KNOWN_USERS_DATA: Record<string, { displayName: string; realFiles: boolean; count: number }> = {
  '_hina03_': { displayName: 'ひな', realFiles: true, count: 75 },
  'M_I_N_A_M_O_': { displayName: 'みなも', realFiles: true, count: 67 },
  'minaseairi_cos': { displayName: 'みなせあいり', realFiles: true, count: 45 },
  'katekyo_nene': { displayName: 'かてきょねね', realFiles: false, count: 19 },
  // 👇 新規追加
  'sakura_cos': { displayName: 'さくら', realFiles: true, count: 45 },
};
```

### 5.2 開発サーバーで確認

```bash
cd Coshub
pnpm dev
```

ブラウザで確認：
```
http://localhost:3000/create
```

---

## ✅ 手順6: 動作確認チェックリスト

### 6.1 ファイル構造確認

- [ ] `public/downloads/ユーザー名/img/` フォルダが存在
- [ ] 画像ファイルが `.webp` 形式
- [ ] ファイル名がTwitterの画像IDと一致
- [ ] `metadata.json` が作成済み

### 6.2 サイト確認

- [ ] `/create` ページでユーザー名入力
- [ ] 「ダウンロード」ボタンクリック
- [ ] 画像が正しく表示される
- [ ] 画像数が正確
- [ ] 表示名が正しい

### 6.3 エラーが出た場合

```bash
# ファイル権限確認
ls -la public/downloads/ユーザー名/

# 画像ファイル確認
ls -la public/downloads/ユーザー名/img/

# 開発者コンソールでエラー確認
# ブラウザのF12キー → Consoleタブ
```

---

## 🚀 効率化のためのヒント

### 一括ダウンロードスクリプト（参考）

```bash
#!/bin/bash
# bulk_download.sh

USERNAME="$1"
COUNT="${2:-50}"

if [ -z "$USERNAME" ]; then
    echo "使用方法: ./bulk_download.sh ユーザー名 [件数]"
    exit 1
fi

echo "🚀 $USERNAME の画像を $COUNT 件ダウンロード開始..."

# フォルダ作成
mkdir -p "Coshub/public/downloads/$USERNAME/img"

# ここに手動ダウンロードの手順を実行
echo "📂 フォルダ準備完了: Coshub/public/downloads/$USERNAME/img"
echo "🔗 Twitter URL: https://twitter.com/$USERNAME/media"
echo "📝 このURLを開いて画像を手動保存してください"

# 完了後の変換
read -p "画像ダウンロード完了後、Enterキーを押してWebP変換を開始..."
./convert_to_webp.sh "$USERNAME"

echo "✅ $USERNAME の設定が完了しました！"
```

---

## 📞 サポート

### よくある問題

1. **画像が表示されない**
   - ファイルパスを確認
   - 権限設定を確認
   - ブラウザキャッシュをクリア

2. **ユーザーが認識されない**
   - `KNOWN_USERS_DATA` に追加済みか確認
   - 開発サーバーを再起動

3. **画像が重い**
   - WebP変換を実行
   - 品質設定を調整（-q 80-95推奨）

### 連絡先

- GitHub Issues
- 開発者に直接連絡

---

**⚠️ 注意事項**

- **著作権を尊重** - 個人利用・研究目的のみ
- **適度な間隔** - サーバー負荷を考慮
- **プライバシー保護** - 公開情報のみ取得
- **定期的なバックアップ** を推奨

**🎉 Happy Downloading!** 