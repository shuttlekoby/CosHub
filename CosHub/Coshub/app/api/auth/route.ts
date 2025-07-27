import { NextRequest, NextResponse } from 'next/server';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { join } from 'path';

const AUTH_FILE_PATH = join(process.cwd(), 'data', 'auth.json');

// データディレクトリを作成
async function ensureDataDirectory() {
  try {
    await mkdir(join(process.cwd(), 'data'), { recursive: true });
  } catch (error) {
    // ディレクトリが既に存在する場合はエラーを無視
  }
}

// 認証情報を保存
export async function POST(request: NextRequest) {
  try {
    const { auth_token, ct0 } = await request.json();

    if (!auth_token || !ct0) {
      return NextResponse.json(
        { error: 'auth_token と ct0 は必須です' },
        { status: 400 }
      );
    }

    await ensureDataDirectory();

    const authData = {
      auth_token,
      ct0,
      updated_at: new Date().toISOString(),
    };

    await writeFile(AUTH_FILE_PATH, JSON.stringify(authData, null, 2));

    return NextResponse.json(
      { message: '認証情報が保存されました' },
      { status: 200 }
    );
  } catch (error) {
    console.error('認証情報保存エラー:', error);
    return NextResponse.json(
      { error: '認証情報の保存に失敗しました' },
      { status: 500 }
    );
  }
}

// 認証情報を取得
export async function GET() {
  try {
    await ensureDataDirectory();
    
    const data = await readFile(AUTH_FILE_PATH, 'utf-8');
    const authData = JSON.parse(data);

    // セキュリティのため、実際の値は返さず、存在確認のみ
    return NextResponse.json({
      hasAuthToken: !!authData.auth_token,
      hasCt0: !!authData.ct0,
      updated_at: authData.updated_at,
    });
  } catch (error) {
    // ファイルが存在しない場合
    return NextResponse.json({
      hasAuthToken: false,
      hasCt0: false,
      updated_at: null,
    });
  }
}

// 認証情報を削除
export async function DELETE() {
  try {
    await writeFile(AUTH_FILE_PATH, JSON.stringify({}, null, 2));
    
    return NextResponse.json(
      { message: '認証情報が削除されました' },
      { status: 200 }
    );
  } catch (error) {
    console.error('認証情報削除エラー:', error);
    return NextResponse.json(
      { error: '認証情報の削除に失敗しました' },
      { status: 500 }
    );
  }
} 