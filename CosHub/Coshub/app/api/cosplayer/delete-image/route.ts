import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function DELETE(request: NextRequest) {
  try {
    const { username, filename } = await request.json();

    if (!username || !filename) {
      return NextResponse.json(
        { error: 'ユーザー名とファイル名が必要です' },
        { status: 400 }
      );
    }

    // ファイルパスを構築
    const downloadsPath = path.join(process.cwd(), 'public', 'downloads');
    const userDir = path.join(downloadsPath, username);
    const imgDir = path.join(userDir, 'img');
    const filePath = path.join(imgDir, filename);

    // セキュリティチェック: パスがダウンロードディレクトリ内にあることを確認
    const normalizedFilePath = path.normalize(filePath);
    const normalizedImgDir = path.normalize(imgDir);
    
    if (!normalizedFilePath.startsWith(normalizedImgDir)) {
      return NextResponse.json(
        { error: '無効なファイルパスです' },
        { status: 400 }
      );
    }

    // ファイルの存在確認
    try {
      await fs.access(filePath);
    } catch {
      return NextResponse.json(
        { error: 'ファイルが見つかりません' },
        { status: 404 }
      );
    }

    // ファイルを削除
    await fs.unlink(filePath);

    console.log(`Deleted image file: ${filePath}`);

    return NextResponse.json({
      success: true,
      message: `画像ファイル ${filename} を削除しました`,
      username,
      filename
    });

  } catch (error) {
    console.error('画像ファイル削除エラー:', error);
    return NextResponse.json(
      { error: '画像ファイルの削除に失敗しました' },
      { status: 500 }
    );
  }
} 