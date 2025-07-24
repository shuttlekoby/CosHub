# 📰 スクレイピングまとめサイト

Webサイトから記事を自動スクレイピングして、美しく整理されたまとめサイトを作成するアプリケーションです。

## 🌟 主な機能

- **Webスクレイピング**: URLを入力するだけで記事を自動取得
- **記事管理**: スクレイピングした記事をデータベースで管理
- **美しいUI**: レスポンシブデザインで快適な閲覧体験
- **検索機能**: タイトルや内容からキーワード検索
- **詳細表示**: 個別記事の詳細ページ
- **画像表示**: 記事のメイン画像を自動抽出・表示

## 🛠 技術スタック

### フロントエンド
- **Next.js 14** - React フレームワーク
- **TypeScript** - 型安全な開発
- **Tailwind CSS** - モダンなスタイリング

### バックエンド
- **Next.js API Routes** - サーバーサイドAPI
- **SQLite + Prisma** - データベース & ORM
- **Python + BeautifulSoup** - Webスクレイピング

## 🚀 セットアップと起動

### 1. 依存関係のインストール
```bash
# Node.js 依存関係
npm install

# Python 依存関係
python3 -m venv venv
source venv/bin/activate  # macOS/Linux
# または
venv\Scripts\activate     # Windows
pip install -r requirements.txt
```

### 2. データベースの初期化
```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 3. 開発サーバーの起動
```bash
npm run dev
```

アプリケーションは http://localhost:3000 で起動します。

## 📖 使い方

### 1. 記事のスクレイピング
1. トップページの「新しい記事をスクレイピング」セクションへ
2. スクレイピングしたい記事のURLを入力
3. 「スクレイピング」ボタンをクリック
4. 自動的に記事情報が抽出・保存されます

### 2. 記事の検索
1. 「記事を検索」セクションでキーワードを入力
2. タイトルや内容から部分一致で検索
3. 「クリア」ボタンで検索をリセット

### 3. 記事の閲覧
- 記事カード上の「📖 詳細」ボタンで詳細ページへ
- 「🔗 元記事」ボタンで元サイトを新しいタブで開く

## 📁 プロジェクト構造

```
hentai-hub/
├── src/
│   ├── app/
│   │   ├── api/              # API ルート
│   │   │   ├── scrape/       # スクレイピング API
│   │   │   └── articles/     # 記事 CRUD API
│   │   ├── articles/[id]/    # 記事詳細ページ
│   │   └── page.tsx          # メインページ
│   ├── lib/
│   │   └── prisma.ts         # Prisma クライアント
│   └── generated/
│       └── prisma/           # 生成された Prisma クライアント
├── scripts/
│   └── scraper.py            # Python スクレイピングスクリプト
├── prisma/
│   ├── schema.prisma         # データベーススキーマ
│   └── migrations/           # マイグレーションファイル
├── requirements.txt          # Python 依存関係
└── package.json              # Node.js 依存関係
```

## 🗄 データベーススキーマ

### Articles テーブル
- `id`: 記事ID
- `url`: 元記事URL（重複なし）
- `title`: 記事タイトル
- `content`: 記事内容
- `published_date`: 公開日
- `image_url`: メイン画像URL
- `category`: カテゴリ
- `meta_description`: SEO用説明
- `scraped_at`: スクレイピング日時
- `created_at`: 作成日時
- `updated_at`: 更新日時

### Tags テーブル
- `id`: タグID
- `name`: タグ名（重複なし）
- `created_at`: 作成日時

### ScrapingSources テーブル
- `id`: ソースID
- `name`: ソース名
- `base_url`: ベースURL
- `is_active`: アクティブ状態
- `last_scraped`: 最終スクレイピング日時

## 🔧 カスタマイズ

### スクレイピングルールの調整
`scripts/scraper.py` ファイルを編集してスクレイピングルールを調整できます：

- `_extract_title()`: タイトル抽出ロジック
- `_extract_content()`: コンテンツ抽出ロジック
- `_extract_date()`: 日付抽出ロジック
- `_extract_image()`: 画像抽出ロジック

### UIのカスタマイズ
Tailwind CSS を使用しているため、`src/app/` 内のファイルを編集してデザインを自由に変更できます。

## 🚀 本番環境への展開

### Vercel（推奨）
```bash
npm install -g vercel
vercel
```

### その他のプラットフォーム
- **Netlify**: `npm run build` でビルド後デプロイ
- **Railway**: データベース付きで簡単デプロイ
- **Docker**: Dockerfileを作成して任意の環境にデプロイ

## 📈 今後の拡張予定

- [ ] バッチスクレイピング機能
- [ ] RSS フィード対応
- [ ] 記事の分析・統計機能
- [ ] タグ管理機能
- [ ] ユーザー認証機能
- [ ] 管理者画面
- [ ] API の外部公開

## 🤝 コントリビューション

プルリクエストや Issue の報告を歓迎します！

## 📄 ライセンス

MIT License

---

**注意**: スクレイピングを行う際は、対象サイトの利用規約やrobot.txtを必ず確認し、適切な間隔でアクセスするようにしてください。
