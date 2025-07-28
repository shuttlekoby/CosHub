import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import fs from 'fs/promises'

const execAsync = promisify(exec)

export async function POST(request: NextRequest) {
  try {
    const { userId, maxPosts = 1000 } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'ユーザーIDが必要です' },
        { status: 400 }
      )
    }

    // ユーザーIDの検証
    const cleanUserId = userId.trim().replace(/^@/, '')
    if (!cleanUserId || !/^[a-zA-Z0-9_]+$/.test(cleanUserId)) {
      return NextResponse.json(
        { error: '有効なユーザーIDを入力してください（英数字とアンダースコアのみ）' },
        { status: 400 }
      )
    }

    // 認証情報の確認
    const authDir = path.join(process.cwd(), '.auth')
    const configFilePath = path.join(authDir, 'gallery-dl-config.json')
    
    try {
      await fs.access(configFilePath)
    } catch (error) {
      return NextResponse.json(
        { error: 'Twitter認証情報が設定されていません。まず認証設定を完了してください。' },
        { status: 401 }
      )
    }

    console.log(`gallery-dl開始: @${cleanUserId}の画像ダウンロード（認証済み）`)

    // 出力ディレクトリを作成
    const outputDir = path.join(process.cwd(), 'downloads')
    await fs.mkdir(outputDir, { recursive: true })

    // gallery-dlを認証情報付きで実行
    const twitterUrl = `https://x.com/${cleanUserId}`
    const command = [
      'python3 -m gallery_dl',
      '--config', `"${configFilePath}"`,
      '--dest', `"${outputDir}"`,
      '--range', `1-${maxPosts}`,
      '--filter', '"extension in (\'jpg\', \'jpeg\', \'png\', \'gif\', \'webp\')"',
      '--write-metadata',
      `"${twitterUrl}"`
    ].join(' ')
    
    console.log(`実行コマンド: ${command}`)

    try {
      const { stdout, stderr } = await execAsync(command, {
        timeout: 600000, // 10分でタイムアウト
        maxBuffer: 1024 * 1024 * 10 // 10MB buffer
      })

      console.log('gallery-dl stdout:', stdout)
      if (stderr) {
        console.log('gallery-dl stderr:', stderr)
      }

      // ダウンロードされたファイル数をカウント
      let downloadCount = 0
      try {
        const userOutputDir = path.join(outputDir, 'x.com', cleanUserId)
        
        // gallery-dlは通常 x.com/username 形式でディレクトリを作成する
        if (await fs.access(userOutputDir).then(() => true).catch(() => false)) {
          const files = await fs.readdir(userOutputDir, { recursive: true })
          downloadCount = files.filter(file => 
            typeof file === 'string' && file.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/i)
          ).length
        }
      } catch (countError) {
        console.log('ファイルカウントエラー:', countError)
        
        // フォールバック: stdout からダウンロード数を推定
        if (stdout) {
          const downloadLines = stdout.split('\n').filter(line => 
            line.includes('downloading') || line.includes('downloaded') || line.includes('[download]')
          )
          downloadCount = downloadLines.length
        }
      }

      // 最後に使用時刻を更新
      try {
        const authFilePath = path.join(authDir, 'twitter-cookies.json')
        const authData = JSON.parse(await fs.readFile(authFilePath, 'utf-8'))
        authData.lastUsed = new Date().toISOString()
        await fs.writeFile(authFilePath, JSON.stringify(authData, null, 2))
      } catch (updateError) {
        console.log('認証情報の更新エラー:', updateError)
      }

      return NextResponse.json({
        success: true,
        username: cleanUserId,
        downloadCount,
        outputPath: path.join(outputDir, 'x.com', cleanUserId),
        message: `@${cleanUserId}の画像を${downloadCount}枚ダウンロードしました`,
        stdout: stdout ? stdout.split('\n').slice(-15).join('\n') : '', // 最後の15行
      })

    } catch (execError: any) {
      console.error('gallery-dl実行エラー:', execError)
      
      // 認証エラーの場合
      if (execError.stderr && (
        execError.stderr.includes('AuthorizationError') ||
        execError.stderr.includes('Login required') ||
        execError.stderr.includes('401') ||
        execError.stderr.includes('403')
      )) {
        return NextResponse.json(
          { 
            error: 'Twitter認証に失敗しました。認証情報を再設定してください。',
            authError: true
          },
          { status: 401 }
        )
      }

      // Pythonが見つからない場合
      if (execError.code === 'ENOENT') {
        return NextResponse.json(
          { 
            error: 'Python3またはgallery-dlが見つかりません。pip3 install gallery-dl でインストールしてください。',
            installCommand: 'pip3 install gallery-dl'
          },
          { status: 500 }
        )
      }

      // タイムアウトエラー
      if (execError.signal === 'SIGTERM') {
        return NextResponse.json(
          { error: 'ダウンロードがタイムアウトしました。ユーザーに多くの画像がある可能性があります。' },
          { status: 408 }
        )
      }

      // ユーザーが見つからない場合
      if (execError.stderr && (
        execError.stderr.includes('404') ||
        execError.stderr.includes('private') ||
        execError.stderr.includes('suspended')
      )) {
        return NextResponse.json(
          { error: 'ユーザーが見つからない、プライベートアカウント、または凍結されている可能性があります。' },
          { status: 404 }
        )
      }

      // その他のエラー
      return NextResponse.json(
        { 
          error: `ダウンロードに失敗しました: ${execError.message}`,
          stderr: execError.stderr || '',
          stdout: execError.stdout || ''
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: '内部サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
} 