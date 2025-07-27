import { NextRequest, NextResponse } from 'next/server';
import { unlink, rmdir, readdir, stat } from 'fs/promises';
import { join } from 'path';

// ディレクトリを再帰的に削除する関数
async function deleteDirectory(dirPath: string): Promise<void> {
  try {
    const files = await readdir(dirPath);
    
    for (const file of files) {
      const filePath = join(dirPath, file);
      const fileStat = await stat(filePath);
      
      if (fileStat.isDirectory()) {
        await deleteDirectory(filePath);
      } else {
        await unlink(filePath);
      }
    }
    
    await rmdir(dirPath);
  } catch (error) {
    console.error(`ディレクトリ削除エラー (${dirPath}):`, error);
    throw error;
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { username } = await request.json();

    if (!username) {
      return NextResponse.json(
        { error: 'ユーザー名が必要です' },
        { status: 400 }
      );
    }

    // ダウンロードディレクトリのパス
    const downloadsPath = join(process.cwd(), 'public', 'downloads');
    const userDir = join(downloadsPath, username);

    let deletedFiles = 0;
    let deletedDirs = 0;

    try {
      // ユーザーディレクトリが存在するか確認
      await stat(userDir);
      
      // ファイル数をカウント
      const countFiles = async (dir: string): Promise<number> => {
        let count = 0;
        try {
          const files = await readdir(dir);
          for (const file of files) {
            const filePath = join(dir, file);
            const fileStat = await stat(filePath);
            if (fileStat.isDirectory()) {
              count += await countFiles(filePath);
            } else {
              count++;
            }
          }
        } catch (error) {
          // ディレクトリアクセスエラーは無視
        }
        return count;
      };

      deletedFiles = await countFiles(userDir);
      
      // ディレクトリを完全削除
      await deleteDirectory(userDir);
      deletedDirs = 1;

      console.log(`Deleted user directory: ${userDir} (${deletedFiles} files)`);

    } catch (error) {
      // ディレクトリが存在しない場合は正常終了
      console.log(`User directory not found: ${userDir}`);
    }

    return NextResponse.json({
      success: true,
      message: `${username}のデータを完全に削除しました`,
      deletedFiles,
      deletedDirs,
      username
    });

  } catch (error) {
    console.error('ファイル削除エラー:', error);
    
    return NextResponse.json(
      {
        error: 'ファイル削除に失敗しました',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 