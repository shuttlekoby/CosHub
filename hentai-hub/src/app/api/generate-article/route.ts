import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import { prisma } from '@/lib/prisma'

const execAsync = promisify(exec)

interface ScrapedData {
  url: string
  title: string
  content: string
  image_url?: string
  published_date?: string
  metadata?: any
}

export async function POST(request: NextRequest) {
  try {
    const { urls, articleTitle, articleType = 'review', customPrompt } = await request.json()

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json(
        { error: 'URLリストが必要です' },
        { status: 400 }
      )
    }

    if (!articleTitle || typeof articleTitle !== 'string') {
      return NextResponse.json(
        { error: '記事タイトルが必要です' },
        { status: 400 }
      )
    }

    // 複数URLからデータを収集
    const scrapedDataList: ScrapedData[] = []
    const venvPythonPath = path.join(process.cwd(), 'venv', 'bin', 'python3')
    const scriptPath = path.join(process.cwd(), 'scripts', 'scraper.py')

    for (const url of urls.slice(0, 10)) { // 最大10件まで
      try {
        const { stdout, stderr } = await execAsync(`"${venvPythonPath}" "${scriptPath}" "${url}"`)
        
        if (!stderr || stderr.includes('NotOpenSSLWarning') || stderr.includes('warnings.warn')) {
          const data = JSON.parse(stdout)
          scrapedDataList.push(data)
        }
      } catch (error) {
        console.warn(`Failed to scrape ${url}:`, error)
      }
    }

    if (scrapedDataList.length === 0) {
      return NextResponse.json(
        { error: 'スクレイピングできるURLがありませんでした' },
        { status: 400 }
      )
    }

    // 記事を生成
    const generatedArticle = generateArticle(scrapedDataList, articleTitle, articleType, customPrompt)

    // データベースに保存
    const savedArticle = await prisma.article.create({
      data: {
        url: `generated-${Date.now()}`, // 生成記事用のユニークID
        title: generatedArticle.title,
        content: generatedArticle.content,
        category: generatedArticle.category,
        meta_description: generatedArticle.description,
        image_url: generatedArticle.mainImage,
        scraped_at: new Date(),
      }
    })

    return NextResponse.json({
      success: true,
      article: savedArticle,
      sourceCount: scrapedDataList.length
    })

  } catch (error) {
    console.error('Article generation error:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}

function generateArticle(
  sources: ScrapedData[], 
  title: string, 
  type: string, 
  customPrompt?: string
) {
  const templates = {
    review: generateReviewArticle,
    comparison: generateComparisonArticle,
    ranking: generateRankingArticle,
    collection: generateCollectionArticle
  }

  const generator = templates[type as keyof typeof templates] || generateReviewArticle
  return generator(sources, title, customPrompt)
}

function generateReviewArticle(sources: ScrapedData[], title: string, customPrompt?: string) {
  const mainSource = sources[0]
  const otherSources = sources.slice(1)
  
  const content = `
# ${title}

## 概要
${mainSource.title}を中心に、厳選されたコンテンツをご紹介します。

## メイン紹介

### 🌟 ${mainSource.title}
${mainSource.content.substring(0, 300)}...

**特徴:**
- 高品質なコンテンツ
- 優れたユーザーエクスペリエンス
- 豊富なバリエーション

## その他のおすすめ

${otherSources.map((source, index) => `
### ${index + 2}. ${source.title}
${source.content.substring(0, 200)}...

**ポイント:** ${extractKeyPoints(source.content)}
`).join('\n')}

## まとめ
${generateSummary(sources)}

## 関連リンク
${sources.map(source => `- [${source.title}](${source.url})`).join('\n')}

---
*この記事は${sources.length}個のソースから自動生成されました*
`

  return {
    title,
    content: content.trim(),
    category: '特集記事',
    description: `${title} - ${sources.length}個の厳選されたコンテンツを詳しく紹介`,
    mainImage: mainSource.image_url
  }
}

function generateComparisonArticle(sources: ScrapedData[], title: string) {
  const content = `
# ${title}

## 比較対象

${sources.map((source, index) => `
### ${index + 1}. ${source.title}
**概要:** ${source.content.substring(0, 200)}...

**評価ポイント:**
- クオリティ: ⭐⭐⭐⭐⭐
- コストパフォーマンス: ⭐⭐⭐⭐
- ユーザビリティ: ⭐⭐⭐⭐⭐
`).join('\n')}

## 比較表

| 項目 | ${sources.map((_, i) => `選択肢${i + 1}`).join(' | ')} |
|------|${sources.map(() => '------').join('|')}|
| タイトル | ${sources.map(s => s.title).join(' | ')} |
| 特徴 | ${sources.map(s => extractKeyPoints(s.content)).join(' | ')} |

## おすすめランキング

${sources.map((source, index) => `
### 第${index + 1}位: ${source.title}
${index === 0 ? '🏆 最もおすすめ' : index === 1 ? '🥈 次点でおすすめ' : '🥉 こちらもおすすめ'}
`).join('\n')}

## まとめ
${generateSummary(sources)}
`

  return {
    title,
    content: content.trim(),
    category: '比較記事',
    description: `${title} - ${sources.length}個の選択肢を詳しく比較`,
    mainImage: sources[0]?.image_url
  }
}

function generateRankingArticle(sources: ScrapedData[], title: string) {
  const content = `
# ${title}

## 🏆 ランキング発表

${sources.map((source, index) => `
### 第${index + 1}位: ${source.title}

${index === 0 ? '👑' : index === 1 ? '🥈' : index === 2 ? '🥉' : '⭐'} **${getRankingReason(index)}**

${source.content.substring(0, 250)}...

**おすすめポイント:**
${generateRecommendationPoints(source, index)}

---
`).join('\n')}

## 💡 選び方のポイント

- **初心者の方:** 第1位の${sources[0]?.title}がおすすめ
- **こだわり派の方:** 第2位の${sources[1]?.title}をチェック
- **コスパ重視:** 第3位の${sources[2]?.title}が最適

## まとめ
${generateSummary(sources)}
`

  return {
    title,
    content: content.trim(),
    category: 'ランキング',
    description: `${title} - 厳選された${sources.length}個のアイテムをランキング形式で紹介`,
    mainImage: sources[0]?.image_url
  }
}

function generateCollectionArticle(sources: ScrapedData[], title: string) {
  const content = `
# ${title}

## 📚 厳選コレクション

今回は特に注目度の高い${sources.length}個のアイテムを厳選してご紹介します。

${sources.map((source, index) => `
## ${index + 1}. ${source.title}

${source.content.substring(0, 200)}...

**注目ポイント:**
- ${extractKeyPoints(source.content)}
- 高い人気とクオリティ
- おすすめ度: ${generateStarRating(index)}

[詳細をチェック](${source.url})

---
`).join('\n')}

## 🎯 こんな方におすすめ

- 質の高いコンテンツを求める方
- 最新のトレンドに敏感な方
- 厳選されたアイテムを効率的に見つけたい方

## まとめ
${generateSummary(sources)}
`

  return {
    title,
    content: content.trim(),
    category: 'コレクション',
    description: `${title} - ${sources.length}個の厳選されたアイテムをまとめて紹介`,
    mainImage: sources[0]?.image_url
  }
}

// ユーティリティ関数
function extractKeyPoints(content: string): string {
  const sentences = content.split('。').filter(s => s.length > 10)
  return sentences.slice(0, 2).join('。') + '。'
}

function generateSummary(sources: ScrapedData[]): string {
  return `今回ご紹介した${sources.length}個のアイテムは、それぞれ異なる魅力を持っています。あなたの好みや目的に合わせて、最適なものを選んでみてください。どれも高品質で満足度の高いものばかりです。`
}

function getRankingReason(index: number): string {
  const reasons = [
    '圧倒的な人気と実績',
    'バランスの良い高品質',
    'コストパフォーマンス抜群',
    '独自性と特徴',
    '安定した品質'
  ]
  return reasons[index] || 'おすすめの品質'
}

function generateRecommendationPoints(source: ScrapedData, index: number): string {
  const points = [
    '- 最高レベルの品質\n- 圧倒的な人気\n- 信頼性の高さ',
    '- 安定した高品質\n- 優れたバランス\n- コスパの良さ',
    '- 手頃な価格\n- 十分な品質\n- 入門者にも最適'
  ]
  return points[index] || '- 独自の魅力\n- 特徴的な内容\n- 他にはない価値'
}

function generateStarRating(index: number): string {
  const ratings = ['⭐⭐⭐⭐⭐', '⭐⭐⭐⭐', '⭐⭐⭐⭐', '⭐⭐⭐']
  return ratings[index] || '⭐⭐⭐'
} 