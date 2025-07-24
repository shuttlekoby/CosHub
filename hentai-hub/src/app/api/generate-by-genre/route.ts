import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import { prisma } from '@/lib/prisma'

const execAsync = promisify(exec)

interface SearchSource {
  name: string
  baseUrl: string
  searchPath: string
  type: 'rss' | 'html' | 'api'
  enabled: boolean
  adultContent: boolean
}

// 実際にアクセス可能なコンテンツソースの設定
const SEARCH_SOURCES: SearchSource[] = [
  // アダルトコンテンツ関連のRSSフィード
  { 
    name: 'Reddit NSFW', 
    baseUrl: 'https://www.reddit.com/r/nsfw', 
    searchPath: '/search.rss?q=', 
    type: 'rss', 
    enabled: true, 
    adultContent: true 
  },
  { 
    name: 'Reddit Adult', 
    baseUrl: 'https://www.reddit.com/r/adult', 
    searchPath: '/search.rss?q=', 
    type: 'rss', 
    enabled: true, 
    adultContent: true 
  },
  // 一般的なアダルト情報サイト
  { 
    name: 'AVN News', 
    baseUrl: 'https://avn.com', 
    searchPath: '/search?q=', 
    type: 'html', 
    enabled: true, 
    adultContent: true 
  },
  // アニメ・エンターテインメント関連
  { 
    name: 'MyAnimeList', 
    baseUrl: 'https://myanimelist.net', 
    searchPath: '/search/all?q=', 
    type: 'html', 
    enabled: true, 
    adultContent: false 
  },
  { 
    name: 'AniDB', 
    baseUrl: 'https://anidb.net', 
    searchPath: '/search/anime/?q=', 
    type: 'html', 
    enabled: true, 
    adultContent: false 
  },
  // 一般コンテンツ（フォールバック用）
  { 
    name: 'はてなブログ', 
    baseUrl: 'https://hatenablog.com', 
    searchPath: '/search?q=', 
    type: 'html', 
    enabled: true, 
    adultContent: false 
  },
  { 
    name: 'note', 
    baseUrl: 'https://note.com', 
    searchPath: '/search?q=', 
    type: 'html', 
    enabled: true, 
    adultContent: false 
  },
  { 
    name: 'Qiita', 
    baseUrl: 'https://qiita.com', 
    searchPath: '/search?q=', 
    type: 'html', 
    enabled: true, 
    adultContent: false 
  }
]

interface GenreRequest {
  genres: string[]
  articleTitle?: string
  articleType?: string
  maxSources?: number
  enabledSources?: string[]
  includeAdultSources?: boolean
}

export async function POST(request: NextRequest) {
  try {
    const { 
      genres, 
      articleTitle, 
      articleType = 'ranking', 
      maxSources = 8,
      enabledSources,
      includeAdultSources = true
    }: GenreRequest = await request.json()

    console.log('🎯 ジャンル記事生成開始:', { genres, articleTitle, articleType, maxSources, includeAdultSources })

    if (!genres || !Array.isArray(genres) || genres.length === 0) {
      return NextResponse.json(
        { error: 'ジャンル・タグが必要です' },
        { status: 400 }
      )
    }

    // 検索クエリを生成（元のジャンル名も含める）
    const searchQueries = generateSearchQueries(genres)
    console.log('🔍 生成された検索クエリ:', searchQueries)
    
    // 有効なソースをフィルタリング
    let activeSources = SEARCH_SOURCES.filter(source => {
      // アダルトコンテンツ許可チェック
      if (source.adultContent && !includeAdultSources) {
        return false
      }
      
      // 指定されたソースのみ使用
      if (enabledSources && enabledSources.length > 0) {
        return enabledSources.includes(source.name)
      }
      
      return source.enabled
    })

    console.log('📡 有効なソース:', activeSources.map(s => `${s.name} (${s.type})`))

    if (activeSources.length === 0) {
      console.log('⚠️ 有効なソースがないため、デフォルトソースを使用')
      // デフォルトとして一般サイトを使用
      activeSources = SEARCH_SOURCES.filter(s => !s.adultContent && s.enabled).slice(0, 3)
    }

    // 検索URLを生成
    const searchUrls = generateSearchUrls(searchQueries, activeSources, maxSources)
    console.log('🌐 生成された検索URL:', searchUrls)
    
    // 各URLからコンテンツを収集
    const collectedData = await collectContentFromUrls(searchUrls)
    console.log('📊 収集されたデータ数:', collectedData.length)
    console.log('📄 収集されたデータサンプル:', collectedData.slice(0, 2).map(d => ({
      title: d.title?.substring(0, 50) + '...',
      contentLength: d.content?.length || 0,
      sourceUrl: d.sourceUrl,
      sourceType: d.sourceType
    })))

    // 実際のデータが取得できた場合とできなかった場合を両方処理
    let finalData = collectedData
    let debugInfo = {}

    if (collectedData.length === 0) {
      console.log('❌ 実際のサイトからコンテンツが取得できなかった')
      // ジャンル特化のリアルなダミーデータで記事生成
      finalData = generateGenreSpecificDummyData(genres)
      debugInfo = {
        message: `実際のサイトからデータを取得しようと試みましたが、アクセス制限により取得できませんでした。${genres.join('・')}ジャンルに特化した高品質なダミーデータで記事を生成しています。`,
        searchUrls: searchUrls,
        activeSources: activeSources.map(s => `${s.name} (${s.type})`),
        scrapingAttempts: searchUrls.length,
        genres: genres,
        includeAdultSources: includeAdultSources
      }
      console.log('🔧 ジャンル特化ダミーデータで記事生成:', finalData.length)
    } else {
      debugInfo = {
        message: '実際のサイトからデータを取得しました',
        collectedDataSample: collectedData.slice(0, 2).map(d => ({
          title: d.title?.substring(0, 50),
          contentLength: d.content?.length,
          sourceType: d.sourceType
        })),
        successfulScrapes: collectedData.length,
        totalAttempts: searchUrls.length,
        sourcesUsed: activeSources.map(s => `${s.name} (${s.type})`)
      }
    }

    // 記事タイトルを自動生成（指定されていない場合）
    const finalTitle = articleTitle || generateAutoTitle(genres, articleType)

    // ジャンル特化記事を生成
    const generatedArticle = generateGenreArticle(
      finalData, 
      finalTitle, 
      articleType, 
      genres
    )

    // データベースに保存
    const savedArticle = await prisma.article.create({
      data: {
        url: `generated-genre-${Date.now()}`,
        title: generatedArticle.title,
        content: generatedArticle.content + (collectedData.length === 0 ? 
          `\n\n---\n**🔍 データソース情報**\n実際のサイトから情報取得を試行しましたが、アクセス制限のため${genres.join('・')}ジャンルに特化した高品質な代替データで記事を生成しました。` : 
          `\n\n---\n**📊 データソース**\n実際のサイト（${activeSources.map(s => s.name).join('、')}）から収集した情報を基に記事を生成しました。`),
        category: generatedArticle.category,
        meta_description: generatedArticle.description,
        image_url: generatedArticle.mainImage,
        scraped_at: new Date(),
      }
    })

    // タグも保存
    if (genres.length > 0) {
      const tagPromises = genres.map(async (genre) => {
        // タグが存在するか確認、なければ作成
        const existingTag = await prisma.tag.findFirst({
          where: { name: genre }
        })

        if (!existingTag) {
          return prisma.tag.create({
            data: { name: genre }
          })
        }
        return existingTag
      })

      const tags = await Promise.all(tagPromises)
      
      // 記事とタグを関連付け
      await prisma.article.update({
        where: { id: savedArticle.id },
        data: {
          tags: {
            connect: tags.map(tag => ({ id: tag.id }))
          }
        }
      })
    }

    console.log('✅ 記事生成完了:', savedArticle.id)

    return NextResponse.json({
      success: true,
      article: savedArticle,
      sourceCount: finalData.length,
      genres: genres,
      searchQueries: searchQueries,
      debug: debugInfo
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('Genre-based article generation error:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました: ' + errorMessage },
      { status: 500 }
    )
  }
}

function generateSearchQueries(genres: string[]): string[] {
  const queries: string[] = []
  
  // 元のジャンル名も追加（アダルトキーワード用）
  genres.forEach(genre => {
    queries.push(genre)
  })
  
  // 一般的なキーワードに変換マッピング
  const genreMapping: { [key: string]: string[] } = {
    '人妻': ['結婚', 'ライフスタイル', '主婦', '家族', '人妻', 'mature'],
    'ロリ': ['アニメ', 'キャラクター', '可愛い', 'イラスト', 'loli', 'anime'],
    'エロアニメ': ['アニメ', 'アニメーション', '作品レビュー', 'エンターテインメント', 'hentai', 'anime'],
    '3D': ['3Dグラフィック', 'CG', 'デザイン', 'テクノロジー', '3d', 'cg'],
    'コスプレイヤー': ['コスプレ', 'イベント', 'ファッション', 'エンターテインメント', 'cosplay'],
    'JK': ['学生', '青春', 'ライフスタイル', '学校', 'jk', 'schoolgirl'],
    'OL': ['ビジネス', 'キャリア', 'オフィス', '働き方', 'office'],
    'メイド': ['サービス', 'ホスピタリティ', 'カフェ', 'エンターテインメント', 'maid'],
    'ナース': ['医療', 'ヘルスケア', '看護', '健康', 'nurse'],
    'VR': ['バーチャルリアリティ', 'テクノロジー', 'ゲーム', 'イノベーション', 'vr'],
    'ライブチャット': ['配信', 'コミュニケーション', 'オンライン', 'エンターテインメント', 'webcam'],
    'エロゲ': ['ゲーム', 'ビジュアルノベル', 'エンターテインメント', 'ストーリー', 'eroge']
  }

  // ジャンルを一般的なキーワードに変換
  genres.forEach(genre => {
    const mappedKeywords = genreMapping[genre] || [genre]
    queries.push(...mappedKeywords.slice(0, 3)) // 各ジャンルから3つまで
  })

  // 関連キーワードを追加
  const relatedKeywords = ['最新', '人気', 'おすすめ', 'レビュー', 'new', 'popular']
  genres.forEach(genre => {
    relatedKeywords.slice(0, 2).forEach(keyword => {
      const mappedKeywords = genreMapping[genre] || [genre]
      queries.push(`${mappedKeywords[0]} ${keyword}`)
    })
  })

  return [...new Set(queries)].slice(0, 15) // 重複除去して最大15クエリ
}

function generateSearchUrls(queries: string[], sources: SearchSource[], maxUrls: number): string[] {
  const urls: string[] = []
  
  queries.forEach(query => {
    sources.forEach(source => {
      if (urls.length < maxUrls) {
        const encodedQuery = encodeURIComponent(query)
        urls.push(`${source.baseUrl}${source.searchPath}${encodedQuery}`)
      }
    })
  })

  return urls.slice(0, maxUrls)
}

async function collectContentFromUrls(urls: string[]) {
  const collectedData = []
  const venvPythonPath = path.join(process.cwd(), 'venv', 'bin', 'python3')
  const scriptPath = path.join(process.cwd(), 'scripts', 'scraper.py')

  console.log('🐍 Python環境:', venvPythonPath)
  console.log('📜 スクリプトパス:', scriptPath)

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i]
    console.log(`🌐 [${i + 1}/${urls.length}] スクレイピング開始: ${url}`)
    
    try {
      const { stdout, stderr } = await execAsync(`"${venvPythonPath}" "${scriptPath}" "${url}"`)
      
      console.log(`📤 stdout:`, stdout ? stdout.substring(0, 200) + '...' : 'empty')
      console.log(`📥 stderr:`, stderr ? stderr.substring(0, 100) + '...' : 'empty')
      
      if (!stderr || stderr.includes('NotOpenSSLWarning') || stderr.includes('warnings.warn')) {
        try {
          const data = JSON.parse(stdout)
          if (data.title && data.content && data.content.length > 50) {
            console.log(`✅ データ取得成功: "${data.title?.substring(0, 50)}..." (${data.content?.length}文字)`)
            
            // RSS判定
            const sourceType = url.includes('rss') || url.includes('.rss') ? 'rss' : 'html'
            
            collectedData.push({
              ...data,
              sourceUrl: url,
              sourceType: sourceType
            })
          } else {
            console.log(`⚠️ データ不完全: title=${!!data.title}, content length=${data.content?.length || 0}`)
          }
        } catch (parseError) {
          const errorMessage = parseError instanceof Error ? parseError.message : String(parseError)
          console.log(`❌ JSON解析エラー:`, errorMessage)
        }
      } else {
        console.log(`❌ スクリプトエラー:`, stderr.substring(0, 200))
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.log(`❌ 実行エラー [${url}]:`, errorMessage)
    }

    // レート制限（1.5秒間隔）
    if (i < urls.length - 1) {
      console.log('⏳ 1.5秒待機...')
      await new Promise(resolve => setTimeout(resolve, 1500))
    }
  }

  console.log(`📊 最終結果: ${collectedData.length}/${urls.length} 件のデータを収集`)
  return collectedData
}

// ジャンル特化のリアルなダミーデータ生成
function generateGenreSpecificDummyData(genres: string[]) {
  const genreContent: { [key: string]: { titles: string[], contents: string[] } } = {
    '人妻': {
      titles: ['人妻の魅力特集', '主婦ライフスタイル', '大人の女性の魅力', '結婚生活の実態', '人妻コミュニティ'],
      contents: [
        '大人の魅力を持つ人妻の特別な魅力について詳しく解説します。経験豊富で包容力のある女性の魅力は多くの人を惹きつけます。',
        '結婚生活を送る女性たちのリアルなライフスタイルと、その中で培われる独特な魅力について紹介します。',
        '主婦として家庭を支える女性たちの日常と、そこから生まれる大人の魅力を詳しく分析しました。'
      ]
    },
    'エロアニメ': {
      titles: ['アニメ作品レビュー', '人気アニメ特集', 'アニメーション技術', '最新アニメ情報', 'アニメカルチャー'],
      contents: [
        '高品質なアニメーション作品の制作技術と、その魅力について専門的な視点から解説します。',
        '最新のアニメーション技術を駆使した作品群の特徴と、業界のトレンドについて詳しく紹介します。',
        'アニメ文化の発展と、現代における作品制作の技術革新について分析しました。'
      ]
    },
    'ロリ': {
      titles: ['キャラクターデザイン', 'アニメイラスト', '可愛いキャラ特集', 'キャラクター分析', 'イラスト技法'],
      contents: [
        '可愛らしいキャラクターデザインの技法と、その魅力的な表現方法について詳しく解説します。',
        'アニメやイラストにおける魅力的なキャラクター表現の技術と、デザインの秘訣を紹介します。',
        'キュートなキャラクターデザインの歴史と、現代における表現技法の進化について分析しました。'
      ]
    },
    '3D': {
      titles: ['3DCG技術', 'デジタルアート', 'CGアニメーション', '3Dモデリング', 'VFX技術'],
      contents: [
        '最新の3DCG技術を使用した高品質なデジタルコンテンツの制作手法について詳しく解説します。',
        '3Dモデリングとアニメーション技術の発展により、リアルで魅力的な表現が可能になりました。',
        'デジタルアート分野における3D技術の革新と、その応用例について専門的に分析しました。'
      ]
    },
    'コスプレイヤー': {
      titles: ['コスプレ文化', 'イベント情報', 'コスプレテクニック', 'ファッション特集', 'コスプレコミュニティ'],
      contents: [
        'コスプレ文化の発展と、その創造的な表現方法について詳しく紹介します。高いクオリティのコスプレ作品が注目を集めています。',
        'コスプレイベントの魅力と、参加者たちの創造性豊かな作品について詳しく解説します。',
        'コスプレ制作の技術とテクニックについて、プロの視点から分析しました。'
      ]
    }
  }

  return genres.flatMap((genre, genreIndex) => {
    const content = genreContent[genre] || {
      titles: [`${genre}特集`, `${genre}ガイド`, `${genre}レビュー`],
      contents: [`${genre}に関する詳細な解説と分析をお届けします。`]
    }

    return content.titles.slice(0, 2).map((title, index) => ({
      title: title,
      content: content.contents[index % content.contents.length] + 
        ` この${genre}分野は近年特に注目を集めており、多くのファンから支持されています。専門的な知識を持つライターが厳選した情報をお届けしており、${genre}に興味がある方なら見逃せない内容となっています。`,
      image_url: null,
      published_date: new Date().toISOString(),
      sourceUrl: `https://example.com/${genre}-${genreIndex}-${index}`,
      sourceType: 'generated'
    }))
  })
}

function generateAutoTitle(genres: string[], articleType: string): string {
  const genreText = genres.join('・')
  const date = new Date().getFullYear()
  
  const titleTemplates = {
    ranking: `${date}年最新！${genreText}おすすめランキング`,
    review: `${genreText}特集 - 厳選コンテンツレビュー`,
    collection: `${genreText}コレクション - 人気作品まとめ`,
    comparison: `${genreText}比較特集 - どれがおすすめ？`
  }

  return titleTemplates[articleType as keyof typeof titleTemplates] || 
         `${genreText}特集 - ${date}年最新情報`
}

function generateGenreArticle(sources: any[], title: string, type: string, genres: string[]) {
  const genreText = genres.join('・')
  
  if (type === 'ranking') {
    return generateGenreRanking(sources, title, genreText)
  } else if (type === 'collection') {
    return generateGenreCollection(sources, title, genreText)
  } else if (type === 'review') {
    return generateGenreReview(sources, title, genreText)
  } else {
    return generateGenreComparison(sources, title, genreText)
  }
}

function generateGenreRanking(sources: any[], title: string, genreText: string) {
  const content = `
# ${title}

## 🏆 ${genreText}ランキング発表！

${genreText}カテゴリーの中でも特に人気が高く、クオリティの優れた作品を厳選してランキング形式でご紹介します。

${sources.map((source, index) => `
### 第${index + 1}位: ${source.title}

${index === 0 ? '👑' : index === 1 ? '🥈' : index === 2 ? '🥉' : '⭐'} **${getRankingReason(index)}**

${source.content.substring(0, 250)}...

**おすすめポイント:**
${generateGenreRecommendationPoints(source, index, genreText)}

**注目度:** ${generatePopularityRating(index)}

${source.sourceUrl ? `**参考:** [詳細はこちら](${source.sourceUrl})` : ''}

---
`).join('\n')}

## 💡 ${genreText}作品の選び方

- **初心者の方:** 第1位の作品から始めるのがおすすめ
- **こだわり派の方:** 第2位〜第3位の作品をチェック
- **最新トレンド:** 最新の${genreText}作品をお探しの方へ

## 🎯 ${genreText}の魅力とは

${genreText}というジャンルは、その独特な魅力と多様性で多くのファンに愛されています。今回ご紹介した作品は、そんな${genreText}の魅力を存分に味わえる厳選された内容となっています。

## まとめ

${genreText}カテゴリーの中でも特に注目すべき${sources.length}作品をランキング形式でご紹介しました。どれも高品質で満足度の高い作品ばかりです。あなたの好みに合った作品を見つけて、${genreText}の世界をお楽しみください。

---
*この記事は${sources.length}個のソースから自動生成されました*
`

  return {
    title,
    content: content.trim(),
    category: `${genreText}ランキング`,
    description: `${title} - ${genreText}の人気作品を厳選してランキング形式で紹介`,
    mainImage: sources[0]?.image_url
  }
}

function generateGenreCollection(sources: any[], title: string, genreText: string) {
  const content = `
# ${title}

## 📚 ${genreText}厳選コレクション

${genreText}カテゴリーの中から、特に注目度の高い${sources.length}作品を厳選してご紹介します。

${sources.map((source, index) => `
## ${index + 1}. ${source.title}

${source.content.substring(0, 200)}...

**${genreText}としての魅力:**
- ${extractGenreSpecificPoints(source.content, genreText)}
- 高い人気とクオリティ
- ${genreText}ファン必見の内容

**おすすめ度:** ${generateStarRating(index)}

${source.sourceUrl ? `[詳細をチェック](${source.sourceUrl})` : ''}

---
`).join('\n')}

## 🎯 ${genreText}ファンにおすすめ

- **${genreText}初心者:** まずは人気作品から始めましょう
- **${genreText}上級者:** 新しい発見があるかもしれません
- **${genreText}コレクター:** コレクションに加える価値あり

## ${genreText}の世界を深く知る

${genreText}というジャンルは、その多様性と奥深さで多くのファンを魅了し続けています。今回ご紹介した作品を通じて、${genreText}の新たな魅力を発見していただければと思います。

## まとめ

${genreText}カテゴリーの厳選作品${sources.length}点をご紹介しました。どれも${genreText}の魅力を存分に感じられる優秀な作品です。

---
*この記事は${sources.length}個のソースから自動生成されました*
`

  return {
    title,
    content: content.trim(),
    category: `${genreText}コレクション`,
    description: `${title} - ${genreText}の厳選作品をまとめて紹介`,
    mainImage: sources[0]?.image_url
  }
}

function generateGenreReview(sources: any[], title: string, genreText: string) {
  const mainSource = sources[0]
  const otherSources = sources.slice(1)
  
  const content = `
# ${title}

## ${genreText}特集レビュー

${genreText}カテゴリーの中でも特に注目すべき作品を詳しくレビューします。

## 🌟 メイン特集: ${mainSource.title}

${mainSource.content.substring(0, 300)}...

**${genreText}としての評価:**
- ビジュアル品質: ⭐⭐⭐⭐⭐
- ${genreText}要素: ⭐⭐⭐⭐⭐
- 総合満足度: ⭐⭐⭐⭐⭐

${mainSource.sourceUrl ? `**参考:** [詳細はこちら](${mainSource.sourceUrl})` : ''}

## その他の注目作品

${otherSources.map((source, index) => `
### ${index + 2}. ${source.title}

${source.content.substring(0, 200)}...

**${genreText}ポイント:** ${extractGenreSpecificPoints(source.content, genreText)}

**評価:** ${generateStarRating(index + 1)}

${source.sourceUrl ? `[詳細はこちら](${source.sourceUrl})` : ''}
`).join('\n')}

## ${genreText}レビューまとめ

今回レビューした${sources.length}作品は、どれも${genreText}カテゴリーの中で高い評価を得ている優秀な作品です。それぞれ異なる魅力を持っているので、あなたの好みに合った作品を見つけてください。

---
*この記事は${sources.length}個のソースから自動生成されました*
`

  return {
    title,
    content: content.trim(),
    category: `${genreText}レビュー`,
    description: `${title} - ${genreText}作品の詳細レビュー`,
    mainImage: mainSource.image_url
  }
}

function generateGenreComparison(sources: any[], title: string, genreText: string) {
  const content = `
# ${title}

## ${genreText}作品比較

${genreText}カテゴリーの人気作品を徹底比較します。

## 比較対象作品

${sources.map((source, index) => `
### ${index + 1}. ${source.title}

**概要:** ${source.content.substring(0, 150)}...

**${genreText}要素の評価:**
- 魅力度: ${generateStarRating(index)}
- 人気度: ${generatePopularityRating(index)}
- おすすめ度: ${generateStarRating(index)}

${source.sourceUrl ? `[詳細はこちら](${source.sourceUrl})` : ''}
`).join('\n')}

## 比較結果

| 項目 | ${sources.map((_, i) => `作品${i + 1}`).join(' | ')} |
|------|${sources.map(() => '------').join('|')}|
| タイトル | ${sources.map(s => s.title.substring(0, 20)).join(' | ')} |
| ${genreText}度 | ${sources.map((_, i) => generateStarRating(i)).join(' | ')} |

## どの作品がおすすめ？

- **${genreText}初心者:** ${sources[0]?.title}がおすすめ
- **品質重視:** ${sources[1]?.title}をチェック
- **最新トレンド:** ${sources[2]?.title}が最適

## まとめ

${genreText}カテゴリーの${sources.length}作品を比較しました。どれも高品質ですが、それぞれ異なる特徴があります。

---
*この記事は${sources.length}個のソースから自動生成されました*
`

  return {
    title,
    content: content.trim(),
    category: `${genreText}比較`,
    description: `${title} - ${genreText}作品の詳細比較`,
    mainImage: sources[0]?.image_url
  }
}

// ユーティリティ関数
function getRankingReason(index: number): string {
  const reasons = [
    '圧倒的な人気と完成度',
    'バランスの良い高品質',
    'コストパフォーマンス抜群', 
    '独自性と魅力',
    '安定した品質'
  ]
  return reasons[index] || 'おすすめの品質'
}

function generateGenreRecommendationPoints(source: any, index: number, genre: string): string {
  const points = [
    `- ${genre}の王道的魅力\n- 最高レベルの品質\n- 圧倒的な人気`,
    `- ${genre}らしさ満載\n- 安定した高品質\n- 優れたバランス`,
    `- ${genre}入門に最適\n- 手頃でも高品質\n- コスパ抜群`
  ]
  return points[index] || `- ${genre}の新たな魅力\n- 独自の特徴\n- 他にはない価値`
}

function generatePopularityRating(index: number): string {
  const ratings = ['🔥🔥🔥🔥🔥', '🔥🔥🔥🔥', '🔥🔥🔥', '🔥🔥']
  return ratings[index] || '🔥'
}

function generateStarRating(index: number): string {
  const ratings = ['⭐⭐⭐⭐⭐', '⭐⭐⭐⭐', '⭐⭐⭐⭐', '⭐⭐⭐']
  return ratings[index] || '⭐⭐⭐'
}

function extractGenreSpecificPoints(content: string, genre: string): string {
  const sentences = content.split('。').filter(s => s.length > 10)
  const relevantSentence = sentences.find(s => s.includes(genre)) || sentences[0]
  return relevantSentence ? relevantSentence.substring(0, 50) + '...' : `${genre}の魅力的な要素`
} 