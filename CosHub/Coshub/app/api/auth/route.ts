import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

// Vercel KVのキー
const AUTH_KEY = 'coshub:auth';

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

    const authData = {
      auth_token,
      ct0,
      updated_at: new Date().toISOString(),
    };

    // Vercel KVに保存
    await kv.set(AUTH_KEY, authData);

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
    // Vercel KVから取得
    const authData = await kv.get(AUTH_KEY) as any;

    if (!authData) {
      return NextResponse.json({
        hasAuthToken: false,
        hasCt0: false,
        updated_at: null,
      });
    }

    // セキュリティのため、実際の値は返さず、存在確認のみ
    return NextResponse.json({
      hasAuthToken: !!authData.auth_token,
      hasCt0: !!authData.ct0,
      updated_at: authData.updated_at,
    });
  } catch (error) {
    console.error('認証情報取得エラー:', error);
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
    // Vercel KVから削除
    await kv.del(AUTH_KEY);
    
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