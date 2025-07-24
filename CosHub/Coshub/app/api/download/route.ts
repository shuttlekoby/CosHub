import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';

const execAsync = promisify(exec);

// 🔄 レート制限用のメモリストア
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// 📊 構造化ログ関数
const logStructured = (level: 'info' | 'warn' | 'error', message: string, metadata?: any) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    metadata: metadata || {},
    service: 'coshub-api'
  };
  
  console.log(JSON.stringify(logEntry));
};

// 🛡️ レート制限チェック
const checkRateLimit = (clientId: string, limit = 10, windowMs = 60000): { allowed: boolean; remaining: number } => {
  const now = Date.now();
  const entry = rateLimitStore.get(clientId);
  
  if (!entry || now > entry.resetTime) {
    // 新しいウィンドウまたは期限切れ
    rateLimitStore.set(clientId, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }
  
  if (entry.count >= limit) {
    return { allowed: false, remaining: 0 };
  }
  
  entry.count++;
  return { allowed: true, remaining: limit - entry.count };
};

// ⏱️ パフォーマンス測定デコレータ
const measurePerformance = <T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  name: string
) => {
  return async (...args: T): Promise<R> => {
    const startTime = Date.now();
    try {
      const result = await fn(...args);
      const duration = Date.now() - startTime;
      logStructured('info', `${name} completed`, { duration, success: true });
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      logStructured('error', `${name} failed`, { duration, error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  };
};

// 🔐 セキュリティ強化: ユーザー名検証関数
const validateUsername = (username: string): { isValid: boolean; sanitized: string; error?: string } => {
  const startTime = Date.now();
  
  if (!username || typeof username !== 'string') {
    logStructured('warn', 'Username validation failed: missing or invalid type', { username: typeof username });
    return { isValid: false, sanitized: '', error: 'ユーザー名が必要です' };
  }

  const trimmed = username.trim();
  
  // 基本的な長さチェック
  if (trimmed.length === 0) {
    logStructured('warn', 'Username validation failed: empty string');
    return { isValid: false, sanitized: '', error: 'ユーザー名は空にできません' };
  }
  
  if (trimmed.length > 50) {
    logStructured('warn', 'Username validation failed: too long', { length: trimmed.length });
    return { isValid: false, sanitized: '', error: 'ユーザー名は50文字以下にしてください' };
  }

  // 危険な文字をチェック
  const dangerousChars = /[<>"';()&+`|]/;
  if (dangerousChars.test(trimmed)) {
    logStructured('warn', 'Username validation failed: dangerous characters', { username: trimmed });
    return { isValid: false, sanitized: '', error: '無効な文字が含まれています' };
  }

  // パストラバーサル攻撃を防ぐ
  const pathTraversal = /\.\.|\/|\\/;
  if (pathTraversal.test(trimmed)) {
    logStructured('warn', 'Username validation failed: path traversal attempt', { username: trimmed });
    return { isValid: false, sanitized: '', error: '無効なパスが含まれています' };
  }

  // Twitterユーザー名の一般的な形式をチェック（より柔軟に）
  const twitterUsernamePattern = /^[a-zA-Z0-9_]{1,50}$/;
  if (!twitterUsernamePattern.test(trimmed)) {
    logStructured('warn', 'Username validation failed: invalid format', { username: trimmed });
    return { isValid: false, sanitized: '', error: 'ユーザー名は英数字とアンダースコアのみ使用可能です（50文字以下）' };
  }

  // 追加のサニタイゼーション
  const sanitized = trimmed.toLowerCase().replace(/[^a-z0-9_]/g, '');
  
  const duration = Date.now() - startTime;
  logStructured('info', 'Username validation successful', { username: sanitized, duration });
  
  return { isValid: true, sanitized };
};

// 🔐 コマンド実行の安全化
const executeTwmdSafely = async (username: string, options: any): Promise<FileInfo[]> => {
  if (isVercel) {
    console.log('⚠️ Vercel環境のためtwmdスキップ');
    return [];
  }

  // ユーザー名の検証
  const validation = validateUsername(username);
  if (!validation.isValid) {
    throw new Error(`入力検証エラー: ${validation.error}`);
  }

  const safeUsername = validation.sanitized;

  try {
    const outputDir = path.join(process.cwd(), 'public', 'downloads');
    
    // フォルダ準備
    const userDir = path.join(outputDir, safeUsername, 'img');
    await fs.mkdir(userDir, { recursive: true });

    // twmdパスを検索
    const twmdPaths = [
      path.join(process.cwd(), '..', 'twmd'),
      path.join(process.cwd(), 'twmd'),
      '/usr/local/bin/twmd',
      './twmd'
    ];

    let twmdPath: string | null = null;
    for (const candidate of twmdPaths) {
      try {
        await fs.access(candidate);
        twmdPath = candidate;
        break;
      } catch (error) {
        // 次のパスを試す
      }
    }

    if (!twmdPath) {
      console.log('⚠️ twmdが見つかりません');
      return [];
    }

    // 🔐 安全なコマンド構築（配列形式で引数を分離）
    const count = Math.min(parseInt(options.count as string) || 50, 100); // 最大100件に制限
    const args = [
      '-u', safeUsername,
      '-o', outputDir,
      '-i', // 画像のみ
      '-n', count.toString(),
      '-s', 'large'
    ];

    console.log(`🚀 実行中: ${twmdPath} ${args.join(' ')}`);

    // execFileを使用してコマンドインジェクションを防ぐ
    const { execFile } = require('child_process');
    const { promisify } = require('util');
    const execFileAsync = promisify(execFile);

    const { stdout, stderr } = await execFileAsync(twmdPath, args, { 
      maxBuffer: 10 * 1024 * 1024,
      timeout: 60000 
    });
    
    console.log('STDOUT:', stdout);
    if (stderr) console.log('STDERR:', stderr);

    // WebP変換（オプション）
    try {
      const convertScriptPath = path.join(process.cwd(), '..', 'convert_to_webp.py');
      const convertArgs = [convertScriptPath, userDir, '-q', '95'];
      
      await execFileAsync('python3', convertArgs, { timeout: 180000 });
      console.log('WebP変換完了');
    } catch (convertError) {
      console.log('WebP変換スキップ:', convertError);
    }

    // ダウンロード後のファイルを読み取り
    return await readManualDownloadedFiles(safeUsername);
    
  } catch (error) {
    console.log('⚠️ twmd実行エラー:', error);
    throw error; // エラーを上位に伝播
  }
};

// �� twmdダウンロード処理（ローカル環境のみ）
const downloadWithTwmd = async (username: string, options: any): Promise<FileInfo[]> => {
  return await executeTwmdSafely(username, options);
};

// 🎯 メイン処理 - 完全エラーハンドリング付き
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { username, options = {} } = body;
    
    // 🔐 強化された入力検証
    const validation = validateUsername(username);
    if (!validation.isValid) {
      return NextResponse.json(
        { 
          success: false, 
          message: validation.error || 'ユーザー名が無効です',
          error: 'INVALID_USERNAME'
        },
        { status: 400 }
      );
    }

    const cleanUsername = validation.sanitized;
    console.log(`🎯 ${cleanUsername} の処理開始 - 環境: ${isVercel ? 'Vercel' : 'Local'}`);

    let files: FileInfo[] = [];
    let metadata: UserMetadata | null = null;
    let source = 'sample'; // デフォルトはサンプルデータ

    // 🔍 Step 1: 手作業でダウンロードしたファイルをまず確認
    try {
      const manualFiles = await readManualDownloadedFiles(cleanUsername);
      
      if (manualFiles.length > 0) {
        console.log(`✅ 手作業ファイル発見: ${manualFiles.length}個`);
        files = manualFiles;
        metadata = await readUserMetadata(cleanUsername);
        source = 'manual';
      }
    } catch (error) {
      console.warn('手作業ファイル読み取りエラー:', error);
    }

    // 🔍 Step 2: ローカル環境でtwmdを試行（手作業ファイルがない場合）
    if (files.length === 0 && !isVercel) {
      try {
        console.log(`🔄 twmdでダウンロード試行中...`);
        const twmdFiles = await downloadWithTwmd(cleanUsername, options);
        if (twmdFiles.length > 0) {
          files = twmdFiles;
          source = 'twmd';
        }
      } catch (error) {
        console.warn('twmd実行エラー:', error);
        // エラーでもサンプルデータにフォールバック
      }
    }

    // 🔍 Step 3: フォールバック - サンプルデータ生成
    if (files.length === 0) {
      console.log(`🎨 サンプルデータを生成`);
      files = generateSampleData(cleanUsername);
      source = 'sample';
    }

    // レスポンス作成
    const userData = KNOWN_USERS_DATA[cleanUsername];
    const displayName = metadata?.displayName || userData?.displayName || cleanUsername;
    const isRealData = source === 'manual' || source === 'twmd';

    // ファイル数を制限
    const requestedCount = Math.min(parseInt(options.count as string) || 50, 100); // 最大100件に制限
    const limitedFiles = files.slice(0, requestedCount);

    const response = {
      success: true,
      message: `${displayName}から${limitedFiles.length}個のメディアを${isRealData ? '取得' : '生成'}しました`,
      username: cleanUsername,
      displayName,
      downloadedCount: limitedFiles.length,
      totalFiles: files.length,
      files: limitedFiles,
      metadata: metadata || {
        username: cleanUsername,
        displayName,
        downloadedAt: new Date().toISOString(),
        totalFiles: files.length,
        isRealData,
      },
      isRealData,
      source,
      environment: isVercel ? 'vercel' : 'local',
    };

    console.log(`✅ ${cleanUsername} 処理完了: ${limitedFiles.length}個のファイル (source: ${source})`);
    return NextResponse.json(response);

  } catch (error) {
    console.error('API エラー:', error);
    
    // エラーの場合も最低限のサンプルデータを返す
    const fallbackResponse = {
      success: false,
      message: 'ダウンロードできませんでしたが、サンプルデータを表示します',
      username: 'unknown',
      displayName: 'サンプルユーザー',
      downloadedCount: 1,
      totalFiles: 1,
      files: [{
        filename: 'error_fallback.webp',
        url: 'https://via.placeholder.com/400x600/ff6b6b/ffffff?text=Error+Fallback',
        type: 'image/webp',
        size: 150000,
        uploadedAt: new Date().toISOString(),
        likes: 0,
      }],
      metadata: {
        username: 'unknown',
        displayName: 'サンプルユーザー',
        downloadedAt: new Date().toISOString(),
        totalFiles: 1,
        isRealData: false,
      },
      isRealData: false,
      source: 'error_fallback',
      environment: isVercel ? 'vercel' : 'local',
      error: error instanceof Error ? error.message : String(error)
    };

    return NextResponse.json(fallbackResponse, { status: 200 }); // 200で返してフロントエンドでエラー表示
  }
}

// 🔍 GETリクエスト処理
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');
    
    // 🔐 GETでも入力検証
    const validation = validateUsername(username || '');
    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, message: validation.error || 'ユーザー名が無効です' },
        { status: 400 }
      );
    }

    const cleanUsername = validation.sanitized;

    try {
      // 既存のダウンロード済みファイルを取得
      const downloadsPath = path.join(process.cwd(), 'public', 'downloads');
      const userDir = path.join(downloadsPath, cleanUsername);
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
        username: cleanUsername,
        fileCount: files.length,
        files: files.map(file => {
          const ext = path.extname(file).toLowerCase();
          return {
            filename: file,
            url: `/downloads/${cleanUsername}/img/${file}`,
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