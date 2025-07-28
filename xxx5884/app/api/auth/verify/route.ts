import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import fs from 'fs/promises'

const execAsync = promisify(exec)

export async function POST(request: NextRequest) {
  try {
    // 認証設定ファイルの確認
    const authDir = path.join(process.cwd(), '.auth')
    const configFilePath = path.join(authDir, 'gallery-dl-config.json')
    
    try {
      await fs.access(configFilePath)
    } catch (error) {
      return NextResponse.json(
        { 
          isValid: false,
          error: '認証情報が設定されていません' 
        },
        { status: 401 }
      )
    }

    // 簡単なテストコマンドで認証情報を検証
    // テスト用の軽量なコマンドを実行
    const testCommand = [
      'python3 -m gallery_dl',
      '--config', `"${configFilePath}"`,
      '--simulate',
      '--range', '1-1',
      '"https://x.com/elonmusk"' // テスト用の確実に存在するアカウント
    ].join(' ')
    
    console.log(`認証テストコマンド: ${testCommand}`)

    try {
      const { stdout, stderr } = await execAsync(testCommand, {
        timeout: 30000, // 30秒でタイムアウト
        maxBuffer: 1024 * 1024 // 1MB buffer
      })

      console.log('認証テスト stdout:', stdout)
      console.log('認証テスト stderr:', stderr)

      // エラーメッセージをチェック
      if (stderr.includes('AuthorizationError') || 
          stderr.includes('Login required') ||
          stderr.includes('401') ||
          stderr.includes('403')) {
        return NextResponse.json({
          isValid: false,
          error: '認証情報が無効です。再設定してください。',
          details: 'TwitterのCookieが期限切れまたは無効です'
        })
      }

      // 成功の場合
      return NextResponse.json({
        isValid: true,
        message: '認証情報が有効です',
        details: 'Twitter認証が正常に動作しています'
      })

    } catch (execError: any) {
      console.error('認証テスト実行エラー:', execError)
      
      // 認証関連エラー
      if (execError.stderr && (
        execError.stderr.includes('AuthorizationError') ||
        execError.stderr.includes('Login required') ||
        execError.stderr.includes('401') ||
        execError.stderr.includes('403')
      )) {
        return NextResponse.json({
          isValid: false,
          error: '認証情報が無効です',
          details: execError.stderr
        })
      }

      // その他のエラー
      return NextResponse.json({
        isValid: false,
        error: '認証テストに失敗しました',
        details: execError.message
      })
    }

  } catch (error) {
    console.error('Auth verify error:', error)
    return NextResponse.json(
      { 
        isValid: false,
        error: '認証検証処理でエラーが発生しました' 
      },
      { status: 500 }
    )
  }
} 