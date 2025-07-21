import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';

const execAsync = promisify(exec);

// 型定義
interface FileInfo {
  filename: string;
  url: string;
  type: string;
  size: number;
  uploadedAt: string;
  likes: number;
}

// 永続的なデータディレクトリ（Gitignoreに追加推奨）
const PERSISTENT_DATA_DIR = path.join(process.cwd(), 'persistent_data');
const DOWNLOADS_DIR = path.join(PERSISTENT_DATA_DIR, 'downloads');
const METADATA_DIR = path.join(PERSISTENT_DATA_DIR, 'metadata');

// ディレクトリ初期化
async function ensureDirectories() {
  await fs.mkdir(PERSISTENT_DATA_DIR, { recursive: true });
  await fs.mkdir(DOWNLOADS_DIR, { recursive: true });
  await fs.mkdir(METADATA_DIR, { recursive: true });
  
  // public/downloads へのシンボリックリンクを作成（表示用）
  const publicDownloadsPath = path.join(process.cwd(), 'public', 'downloads');
  try {
    await fs.access(publicDownloadsPath);
  } catch {
    try {
      await fs.symlink(DOWNLOADS_DIR, publicDownloadsPath, 'dir');
      console.log('Created symlink for downloads directory');
    } catch (error) {
      console.warn('Could not create symlink, copying files instead');
    }
  }
}

// メタデータの保存
async function saveMetadata(username: string, data: any) {
  const metadataPath = path.join(METADATA_DIR, `${username}.json`);
  await fs.writeFile(metadataPath, JSON.stringify(data, null, 2));
}

// メタデータの読み込み
async function loadMetadata(username: string) {
  const metadataPath = path.join(METADATA_DIR, `${username}.json`);
  try {
    const data = await fs.readFile(metadataPath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureDirectories();
    
    const { username, options } = await request.json();

    if (!username) {
      return NextResponse.json(
        { error: 'ユーザー名が必要です' },
        { status: 400 }
      );
    }

    // Twitterメディアダウンローダーのパス
    const twmdPath = path.join(process.cwd(), '..', 'twmd');
    
    // Twitterメディアダウンローダーのコマンド構築
    const defaultOptions = {
      imageOnly: true,
      count: 50,
      highQuality: true,
      ...options
    };

    const args = [
      `-u ${username}`,
      `-o ${DOWNLOADS_DIR}`,
      defaultOptions.imageOnly ? '-i' : '-a',
      `-n ${defaultOptions.count}`,
      defaultOptions.highQuality ? '-s large' : '',
    ].filter(Boolean);

    const command = `${twmdPath} ${args.join(' ')}`;

    console.log(`Executing: ${command}`);

    // ダウンロード実行
    const { stdout, stderr } = await execAsync(command, {
      timeout: 300000, // 5分のタイムアウト
    });

    // ダウンロードされたファイルをスキャン
    const userDir = path.join(DOWNLOADS_DIR, username);
    const imgDir = path.join(userDir, 'img');
    
    let downloadedFiles: string[] = [];
    try {
      const files = await fs.readdir(imgDir);
      downloadedFiles = files.filter(file => 
        file.endsWith('.jpg') || file.endsWith('.jpeg') || file.endsWith('.png')
      );
    } catch (error) {
      console.log('No images found or directory does not exist');
    }

    // WebP変換を実行
    if (downloadedFiles.length > 0) {
      const convertCommand = `python3 ../convert_to_webp.py "${imgDir}" -q 95`;
      try {
        await execAsync(convertCommand);
        console.log('WebP conversion completed');
      } catch (convertError) {
        console.error('WebP conversion failed:', convertError);
      }
    }

    // 変換後のWebPファイルをスキャン
    let webpFiles: string[] = [];
    try {
      const files = await fs.readdir(imgDir);
      webpFiles = files.filter(file => file.endsWith('.webp'));
    } catch (error) {
      console.log('No WebP files found');
    }

    // ファイル情報を収集
    const fileInfos: FileInfo[] = [];
    let totalSize = 0;

    for (const filename of webpFiles) {
      try {
        const filePath = path.join(imgDir, filename);
        const stats = await fs.stat(filePath);
        totalSize += stats.size;

        fileInfos.push({
          filename,
          url: `/downloads/${username}/img/${filename}`,
          type: 'image/webp',
          size: stats.size,
          uploadedAt: new Date().toISOString(),
          likes: Math.floor(Math.random() * 2000) + 100
        });
      } catch (error) {
        console.error(`Error processing file ${filename}:`, error);
      }
    }

    // メタデータを保存
    const metadata = {
      username,
      displayName: username,
      avatar: `https://via.placeholder.com/100x100?text=${username.charAt(0).toUpperCase()}`,
      mediaCount: fileInfos.length,
      files: fileInfos,
      downloadHistory: [
        {
          date: new Date().toISOString(),
          downloadedCount: fileInfos.length,
          totalSize,
          status: fileInfos.length > 0 ? 'success' : 'error'
        }
      ],
      lastUpdated: new Date().toISOString()
    };

    await saveMetadata(username, metadata);

    return NextResponse.json({
      success: true,
      message: `${username}から${fileInfos.length}個のメディアをダウンロードしました`,
      username,
      downloadedCount: fileInfos.length,
      files: fileInfos,
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
    await ensureDirectories();

    // メタデータから既存ファイルを取得
    const metadata = await loadMetadata(username);
    
    if (metadata && metadata.files) {
      return NextResponse.json({
        username,
        fileCount: metadata.files.length,
        files: metadata.files,
        cosplayerData: {
          displayName: metadata.displayName,
          avatar: metadata.avatar,
          mediaCount: metadata.mediaCount,
          lastUpdated: metadata.lastUpdated
        }
      });
    } else {
      return NextResponse.json({
        username,
        fileCount: 0,
        files: [],
        cosplayerData: {
          displayName: username,
          avatar: `https://via.placeholder.com/100x100?text=${username.charAt(0).toUpperCase()}`,
          mediaCount: 0,
          lastUpdated: new Date().toISOString()
        }
      });
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