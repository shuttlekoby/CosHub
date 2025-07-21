import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const { username, options } = await request.json();

    if (!username) {
      return NextResponse.json(
        { error: 'ユーザー名が必要です' },
        { status: 400 }
      );
    }

    // 正しい絶対パスを使用
    const twmdPath = path.join(process.cwd(), '..', 'twmd');
    const convertScriptPath = path.join(process.cwd(), '..', 'convert_to_webp.py');
    const downloadsPath = path.join(process.cwd(), 'public', 'downloads');
    const userDir = path.join(downloadsPath, username);
    
    // ダウンロードディレクトリの作成
    await fs.mkdir(userDir, { recursive: true });

    // デフォルトオプション
    const defaultOptions = {
      imageOnly: true,
      count: 50,
      highQuality: true,
      ...options
    };

    // twmdコマンドの構築（ヘルプに基づいて修正）
    const args = [];
    args.push(`-u ${username}`);
    args.push(`-o "${downloadsPath}"`);
    
    if (defaultOptions.imageOnly) {
      args.push('-i'); // 画像のみダウンロード
    } else {
      args.push('-a'); // 画像と動画をダウンロード
    }
    
    args.push(`-n ${defaultOptions.count}`);
    
    if (defaultOptions.highQuality) {
      args.push('-s large'); // 大きいサイズ
    }

    const command = `"${twmdPath}" ${args.join(' ')}`;

    console.log(`Executing: ${command}`);

    // ダウンロード実行
    let stdout = '';
    let stderr = '';
    
    try {
      const result = await execAsync(command, {
        timeout: 300000, // 5分のタイムアウト
        cwd: process.cwd()
      });
      stdout = result.stdout;
      stderr = result.stderr;
    } catch (execError: any) {
      console.error('Command execution error:', execError);
      // エラーでも処理を続行（一部成功の場合もある）
      stdout = execError.stdout || '';
      stderr = execError.stderr || '';
    }

    console.log('STDOUT:', stdout);
    console.log('STDERR:', stderr);

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
        // Python環境の確認
        const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
        const convertCommand = `${pythonCmd} "${convertScriptPath}" "${imgDir}" -q 95`;
        
        console.log(`Converting to WebP: ${convertCommand}`);
        
        await execAsync(convertCommand, {
          timeout: 180000 // 3分のタイムアウト
        });
        
        console.log('WebP conversion completed');
        
        // 変換後のファイルを再スキャン
        const convertedFiles = await fs.readdir(imgDir);
        webpFiles = convertedFiles.filter(file => file.endsWith('.webp'));
        
      } catch (convertError) {
        console.error('WebP conversion failed:', convertError);
        // 変換に失敗した場合は元のファイルを使用
        webpFiles = downloadedFiles;
      }
    }

    const finalFiles = webpFiles.length > 0 ? webpFiles : downloadedFiles;

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