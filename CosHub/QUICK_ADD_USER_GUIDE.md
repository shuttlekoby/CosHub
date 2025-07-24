# 🚀 新規ユーザー追加クイックガイド

## ⚡ 5分で新しいコスプレイヤーを追加

### 方法1: サンプルデータのみ（最速）

新しいユーザー「sakura_cos」を追加する場合：

1. **コードに追加** (1分)
   ```typescript
   // app/api/download/route.ts の KNOWN_USERS_DATA に追加
   'sakura_cos': { displayName: 'さくら', realFiles: false, count: 25 },
   ```

2. **デプロイ** (3分)
   ```bash
   cd Coshub
   vercel --prod
   ```

3. **動作確認** (1分)
   - https://coshub-kappa.vercel.app/create にアクセス
   - 「sakura_cos」と入力してダウンロード

**結果**: 25個のサンプル画像が表示されます

---

### 方法2: 実画像追加（完全版）

1. **フォルダ作成**
   ```bash
   mkdir -p Coshub/public/downloads/sakura_cos/img
   ```

2. **画像手動ダウンロード**
   - https://twitter.com/sakura_cos/media を開く
   - 画像を右クリック保存
   - `Coshub/public/downloads/sakura_cos/img/` に保存

3. **WebP変換（推奨）**
   ```bash
   # macOS
   brew install webp
   cd Coshub/public/downloads/sakura_cos/img
   for img in *.jpg; do cwebp -q 95 "$img" -o "${img%.*}.webp" && rm "$img"; done
   ```

4. **メタデータ作成**
   ```json
   // Coshub/public/downloads/sakura_cos/metadata.json
   {
     "username": "sakura_cos",
     "displayName": "さくら",
     "bio": "コスプレイヤー・モデル 🌸",
     "followerCount": "12.5K",
     "downloadedAt": "2024-01-15T10:30:00Z",
     "totalFiles": 30,
     "tags": ["コスプレ", "モデル"],
     "isRealData": true
   }
   ```

5. **コードに追加**
   ```typescript
   // app/api/download/route.ts
   'sakura_cos': { displayName: 'さくら', realFiles: true, count: 30 },
   ```

6. **デプロイ**
   ```bash
   vercel --prod
   ```

**結果**: 実際の画像が表示されます

---

## 🎯 どちらを選ぶべき？

| 用途 | 方法1 (サンプル) | 方法2 (実画像) |
|------|------------------|----------------|
| **プロトタイピング** | ✅ 推奨 | ❌ 時間がかかる |
| **デモ・プレゼン** | ✅ 十分 | ⭐ より良い |
| **本番運用** | ❌ 推奨しない | ✅ 必須 |
| **開発・テスト** | ✅ 最適 | ❌ オーバーキル |

---

## 🔧 トラブルシューティング

### Q: 新規ユーザーで「ダウンロードできませんでした」が出る

**A: 正常です！**
- Vercel環境では認証制限があります
- APIは自動的にサンプルデータに切り替わります
- ブラウザページでは画像が正常に表示されるはずです

### Q: 画像が表示されない

**A: 確認手順：**
1. ブラウザをリロード (Ctrl+F5)
2. 開発者ツール → Console でエラー確認
3. ユーザー名のスペルを確認

### Q: 実画像を追加したのに表示されない

**A: チェックリスト：**
- [ ] フォルダ構造: `public/downloads/ユーザー名/img/`
- [ ] ファイル形式: `.webp`, `.jpg`, `.png`
- [ ] ファイル権限: 読み取り可能
- [ ] コードに追加: `KNOWN_USERS_DATA`
- [ ] デプロイ完了

---

## 💡 プロのヒント

1. **バッチ処理**
   ```bash
   # 複数ユーザーを一度に追加
   for user in sakura_cos yuki_cos rei_cos; do
     mkdir -p "Coshub/public/downloads/$user/img"
   done
   ```

2. **画像品質最適化**
   ```bash
   # より小さなファイルサイズ
   cwebp -q 85 input.jpg -o output.webp
   ```

3. **メタデータ自動生成**
   ```bash
   # ファイル数を自動カウント
   echo "\"totalFiles\": $(ls *.webp | wc -l),"
   ```

**🚀 Happy Adding!** 