import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import { prisma } from '@/lib/prisma'

const execAsync = promisify(exec)

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'URLが必要です' },
        { status: 400 }
      )
    }

    // URL形式の検証
    try {
      new URL(url)
    } catch {
      return NextResponse.json(
        { error: '有効なURLを入力してください' },
        { status: 400 }
      )
    }

    // 既存記事の確認
    const existingArticle = await prisma.article.findUnique({
      where: { url }
    })

    if (existingArticle) {
      return NextResponse.json(
        { error: 'この記事は既に登録されています', article: existingArticle },
        { status: 409 }
      )
    }

    // Pythonスクレイピングスクリプトを実行
    const scriptPath = path.join(process.cwd(), 'scripts', 'scraper.py')
    const venvPythonPath = path.join(process.cwd(), 'venv', 'bin', 'python3')
    const { stdout, stderr } = await execAsync(`"${venvPythonPath}" "${scriptPath}" "${url}"`)

    // 警告メッセージ（NotOpenSSLWarning等）は無視し、エラーの場合のみ処理
    if (stderr && !stderr.includes('NotOpenSSLWarning') && !stderr.includes('warnings.warn')) {
      console.error('Python script error:', stderr)
      return NextResponse.json(
        { error: 'スクレイピングに失敗しました' },
        { status: 500 }
      )
    }

    // Pythonスクリプトの結果をパース
    let articleData
    try {
      articleData = JSON.parse(stdout)
    } catch {
      return NextResponse.json(
        { error: 'スクレイピング結果の解析に失敗しました' },
        { status: 500 }
      )
    }

    // データベースに保存
    const savedArticle = await prisma.article.create({
      data: {
        url: articleData.url,
        title: articleData.title,
        content: articleData.content,
        published_date: articleData.published_date,
        image_url: articleData.image_url,
        scraped_at: new Date(),
      }
    })

    return NextResponse.json({
      success: true,
      article: savedArticle
    })

  } catch (error) {
    console.error('Scraping error:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
} 