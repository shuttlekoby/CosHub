import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const { authToken, ct0Token } = await request.json()

    // 入力検証
    if (!authToken || !ct0Token) {
      return NextResponse.json(
        { error: 'auth_tokenとct0の両方が必要です' },
        { status: 400 }
      )
    }

    if (authToken.trim().length < 10 || ct0Token.trim().length < 10) {
      return NextResponse.json(
        { error: '無効なトークンです。正しい値を入力してください' },
        { status: 400 }
      )
    }

    // 認証情報を保存するディレクトリを作成
    const authDir = path.join(process.cwd(), '.auth')
    await fs.mkdir(authDir, { recursive: true })

    // 認証情報を保存
    const authData = {
      authToken: authToken.trim(),
      ct0Token: ct0Token.trim(),
      createdAt: new Date().toISOString(),
      lastUsed: new Date().toISOString()
    }

    const authFilePath = path.join(authDir, 'twitter-cookies.json')
    await fs.writeFile(authFilePath, JSON.stringify(authData, null, 2))

    // gallery-dl設定ファイルも作成（修正版）
    const galleryDlConfig = {
      extractor: {
        twitter: {
          cookies: {
            auth_token: authToken.trim(),
            ct0: ct0Token.trim()
          },
          include: "timeline",
          retweets: false,
          replies: false,
          filename: "{date:%Y%m%d}_{tweet_id}_{num:>02}.{extension}",
          directory: ["{category}", "{username}"]
        }
      },
      output: {
        progress: true,
        mode: "terminal"
      }
    }

    const configFilePath = path.join(authDir, 'gallery-dl-config.json')
    await fs.writeFile(configFilePath, JSON.stringify(galleryDlConfig, null, 2))

    return NextResponse.json({
      success: true,
      message: '認証情報が正常に保存されました'
    })

  } catch (error) {
    console.error('Auth save error:', error)
    return NextResponse.json(
      { error: '認証情報の保存に失敗しました' },
      { status: 500 }
    )
  }
} 