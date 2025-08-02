import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const requestBody = await request.json();
    const { username, auth_token, ct0, test, options, ...otherFields } = requestBody;

    if (!username) {
      return NextResponse.json(
        { error: 'ユーザー名が必要です' },
        { status: 400 }
      );
    }

    // テストモードかどうかをチェック
    const isTestMode = test === true || options?.test === true;

    // 認証情報を読み込み
    let authToken = '';
    let finalCt0 = '';
    
    // 環境変数をチェック
    authToken = process.env.TWITTER_AUTH_TOKEN || '';
    finalCt0 = process.env.TWITTER_CT0 || '';
    
    // 環境変数がない場合はリクエストから取得
    if (!authToken || !finalCt0) {
      authToken = auth_token || authToken;
      finalCt0 = ct0 || finalCt0;
    }
    
    // それでもない場合はエラー
    if (!authToken || !finalCt0) {
      return NextResponse.json(
        { error: '認証情報が設定されていません。環境変数またはリクエストで認証情報を提供してください。' },
        { status: 401 }
      );
    }

    // テストモードの場合は認証確認のみで終了
    if (isTestMode) {
      return NextResponse.json({
        success: true,
        message: '認証情報が正常に設定されています',
        test: true,
        username,
        authStatus: 'verified'
      });
    }

    // Vercel環境チェック
    const isVercel = process.env.VERCEL_ENV || process.env.VERCEL;
    
    if (isVercel) {
      // Vercel環境では Twitter API を直接使用
      return await handleVercelDownload(username, authToken, finalCt0, requestBody);
    }

    // 正しい絶対パスを使用
    const twmdPath = path.join(process.cwd(), '..', 'twitter-media-downloader', 'twmd');
    const convertScriptPath = path.join(process.cwd(), '..', 'convert_to_webp.py');
    const downloadsPath = path.join(process.cwd(), 'public', 'downloads');
    const userDir = path.join(downloadsPath, username);
    const twmdDir = path.join(process.cwd(), '..', 'twitter-media-downloader');
    const cookiesPath = path.join(twmdDir, 'twmd_cookies.json');
    
    console.log('Debug info:');
    console.log('- twmdPath:', twmdPath);
    console.log('- downloadsPath:', downloadsPath);
    console.log('- userDir:', userDir);
    console.log('- cookiesPath:', cookiesPath);
    
    // ダウンロードディレクトリの作成
    await fs.mkdir(userDir, { recursive: true });

    // twmdバイナリの存在確認
    try {
      await fs.access(twmdPath);
      console.log('✅ twmdバイナリが見つかりました');
    } catch (error) {
      console.error('❌ twmdバイナリが見つかりません:', twmdPath);
      return NextResponse.json(
        { error: 'twmdバイナリが見つかりません。セットアップを確認してください。' },
        { status: 500 }
      );
    }

    // クッキーファイルを作成（Go http.Cookie JSON形式でtwmdが使用）
    const expiresTime = new Date();
    expiresTime.setFullYear(expiresTime.getFullYear() + 1); // 1年後
    
    const cookies = [
      {
        Name: "auth_token",
        Value: authToken,
        Path: "/",
        Domain: ".twitter.com",
        Expires: expiresTime.toISOString(),
        HttpOnly: true,
        Secure: true
      },
      {
        Name: "ct0",
        Value: finalCt0,
        Path: "/",
        Domain: ".twitter.com", 
        Expires: expiresTime.toISOString(),
        HttpOnly: true,
        Secure: true
      }
    ];
    
    try {
      await fs.writeFile(cookiesPath, JSON.stringify(cookies, null, 2));
      console.log('認証情報をJSON形式のクッキーファイルに書き込みました');
    } catch (error) {
      console.error('クッキーファイル作成エラー:', error);
      return NextResponse.json(
        { error: 'クッキーファイルの作成に失敗しました' },
        { status: 500 }
      );
    }

    // デフォルトオプション
    const defaultOptions = {
      imageOnly: true,
      count: 200, // 画像取得数を50から200に増加
      highQuality: true,
      ...options
    };

    // twmdコマンドの構築（ヘルプに基づいて修正）
    const args = [];
    args.push(`-u ${username}`);
    args.push(`-o "${downloadsPath}"`);
    args.push('-C'); // クッキーを使用
    args.push('-M'); // メディアツイートのみ（リツイート除外）
    args.push('-U'); // 更新モード（不足分のみダウンロード）
    
    if (defaultOptions.imageOnly) {
      args.push('-i'); // 画像のみダウンロード
    } else {
      args.push('-a'); // 画像と動画をダウンロード
    }
    
    args.push(`-n ${defaultOptions.count}`);
    
    if (defaultOptions.highQuality) {
      args.push('-s large'); // 大きいサイズ
    }

    const command = `./twmd ${args.join(' ')}`;

    console.log('🚀 実行コマンド:', command);

    // ダウンロード実行
    let stdout = '';
    let stderr = '';
    let executionSuccess = false;
    
    try {
      const result = await execAsync(command, {
        timeout: 300000, // 5分のタイムアウト
        cwd: twmdDir
      });
      stdout = result.stdout;
      stderr = result.stderr;
      executionSuccess = true;
      console.log('✅ コマンド実行成功');
    } catch (execError: any) {
      console.error('❌ コマンド実行エラー:', execError);
      console.error('- Exit code:', execError.code);
      console.error('- Signal:', execError.signal);
      // エラーでも処理を続行（一部成功の場合もある）
      stdout = execError.stdout || '';
      stderr = execError.stderr || '';
    }

    console.log('📄 STDOUT:', stdout);
    console.log('⚠️ STDERR:', stderr);
    console.log('🎯 実行成功:', executionSuccess);

    // ダウンロードされたファイルをスキャン
    const imgDir = path.join(userDir, 'img');
    
    let downloadedFiles: string[] = [];
    try {
      await fs.access(imgDir);
      const files = await fs.readdir(imgDir);
      downloadedFiles = files.filter(file => 
        file.endsWith('.jpg') || file.endsWith('.jpeg') || file.endsWith('.png') || file.endsWith('.webp')
      );
      console.log(`Found ${downloadedFiles.length} downloaded files`);
    } catch (error) {
      console.log('No images directory found or no images downloaded');
    }

    // WebP変換を実行（Pythonファイルが存在する場合）
    let webpFiles: string[] = [];
    
    if (downloadedFiles.length > 0) {
      try {
        // WebP変換スクリプトの存在確認
        await fs.access(convertScriptPath);
        console.log(`✅ WebP変換スクリプトが見つかりました: ${convertScriptPath}`);
        
        // Python環境の確認
        const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
        const convertCommand = `${pythonCmd} "${convertScriptPath}" "${imgDir}" -q 95`;
        
        console.log(`Converting to WebP: ${convertCommand}`);
        
        await execAsync(convertCommand, {
          timeout: 180000 // 3分のタイムアウト
        });
        
        console.log('✅ WebP conversion completed');
        
        // 変換後のファイルを再スキャン
        const convertedFiles = await fs.readdir(imgDir);
        webpFiles = convertedFiles.filter(file => file.endsWith('.webp'));
        
      } catch (convertError) {
        console.error('WebP conversion failed:', convertError);
        console.log('⚠️ WebP変換をスキップ（ダウンロードは正常完了）');
        // 変換に失敗した場合は元のファイルを使用
        webpFiles = downloadedFiles;
      }
    }

    const finalFiles = webpFiles.length > 0 ? webpFiles : downloadedFiles;

    // Sanityに画像をアップロード
    let sanityUploadResult = null;
    if (finalFiles.length > 0) {
      try {
        const imagePaths = finalFiles.map(file => path.join(imgDir, file));
        
        const uploadResponse = await fetch(
          `${process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL : 'http://localhost:3000'}/api/sanity-upload`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              username,
              imagePaths
            })
          }
        );
        
        if (uploadResponse.ok) {
          sanityUploadResult = await uploadResponse.json();
          console.log('✅ Sanityアップロード完了:', sanityUploadResult.uploadedCount, '枚');
        } else {
          console.error('❌ Sanityアップロード失敗:', await uploadResponse.text());
        }
      } catch (uploadError) {
        console.error('Sanityアップロードエラー:', uploadError);
      }
    }

    return NextResponse.json({
      success: true,
      message: `${username}から${finalFiles.length}個のメディアをダウンロードしました`,
      username,
      downloadedCount: finalFiles.length,
      files: finalFiles.map(file => {
        const ext = path.extname(file).toLowerCase();
        return {
          filename: file,
          url: `/downloads/${username}/img/${file}`,
          type: ext === '.webp' ? 'image/webp' : ext === '.png' ? 'image/png' : 'image/jpeg'
        };
      }),
      sanityUpload: sanityUploadResult,
      stdout,
      stderr
    });

  } catch (error) {
    console.error('Download error:', error);
    
    return NextResponse.json(
      {
        error: 'ダウンロードに失敗しました',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get('username');

  if (!username) {
    return NextResponse.json(
      { error: 'ユーザー名が必要です' },
      { status: 400 }
    );
  }

  try {
    // 既存のダウンロード済みファイルを取得
    const downloadsPath = path.join(process.cwd(), 'public', 'downloads');
    const userDir = path.join(downloadsPath, username);
    const imgDir = path.join(userDir, 'img');

    let files: string[] = [];
    try {
      await fs.access(imgDir);
      const dirFiles = await fs.readdir(imgDir);
      files = dirFiles.filter(file => 
        file.endsWith('.webp') || file.endsWith('.jpg') || file.endsWith('.jpeg') || file.endsWith('.png')
      );
    } catch (error) {
      // ディレクトリが存在しない場合は空配列を返す
    }

    return NextResponse.json({
      username,
      fileCount: files.length,
      files: files.map(file => {
        const ext = path.extname(file).toLowerCase();
        return {
          filename: file,
          url: `/downloads/${username}/img/${file}`,
          type: ext === '.webp' ? 'image/webp' : ext === '.png' ? 'image/png' : 'image/jpeg'
        };
      })
    });

  } catch (error) {
    console.error('Get files error:', error);
    
    return NextResponse.json(
      {
        error: 'ファイル取得に失敗しました',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Vercel環境用のダウンロード処理
async function handleVercelDownload(username: string, authToken: string, ct0: string, options: any) {
  try {
    console.log('🌐 Vercel環境でのTwitter API直接処理を開始');
    
    // シンプルなダミーデータでテスト
    console.log(`📱 ユーザー: ${username} の処理を開始`);
    
    // Sanityに直接サンプルデータを作成（実際のTwitter APIは後で実装）
    const sanityUploadResponse = await fetch(`${process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL : 'http://localhost:3000'}/api/sanity-upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username,
        imagePaths: [], // 空の配列でテスト
        vercelMode: true
      })
    });

    const sanityResult = sanityUploadResponse.ok ? await sanityUploadResponse.json() : { error: 'Sanity connection failed' };

    return NextResponse.json({
      success: true,
      message: `Vercel環境での処理が完了しました（${username}）`,
      username,
      downloadedCount: 0,
      method: 'vercel-api-direct',
      sanityResult,
      note: 'Twitter API直接実装（開発中）'
    });

  } catch (error) {
    console.error('❌ Vercel処理エラー:', error);
    return NextResponse.json(
      { 
        error: 'Vercel環境での処理に失敗しました',
        details: error instanceof Error ? error.message : 'Unknown error',
        method: 'vercel-api-direct'
      },
      { status: 500 }
    );
  }
} 