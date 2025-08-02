import { NextRequest, NextResponse } from 'next/server';

// 環境変数ベースの認証保存（最も確実）
const getAuthFromEnv = () => {
  const authToken = process.env.TWITTER_AUTH_TOKEN;
  const ct0 = process.env.TWITTER_CT0;
  return { authToken, ct0 };
};

// 一時的なメモリストレージ（セッション間では保持されない）
let tempAuthStorage: any = null;

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

    // 一時的なメモリストレージに保存
    tempAuthStorage = authData;

    return NextResponse.json(
      { 
        message: '認証情報が保存されました',
        note: 'より永続的な保存には、Vercel Dashboardの環境変数を使用してください'
      },
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
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const getValues = searchParams.get('values') === 'true';
    
    // まず環境変数をチェック
    const { authToken: envAuthToken, ct0: envCt0 } = getAuthFromEnv();
    
    if (envAuthToken && envCt0) {
      if (getValues) {
        return NextResponse.json({
          auth_token: envAuthToken,
          ct0: envCt0,
          source: 'env'
        });
      }
      return NextResponse.json({
        hasAuthToken: true,
        hasCt0: true,
        updated_at: 'Environment Variables',
        source: 'env'
      });
    }

    // 環境変数がない場合はメモリストレージをチェック
    if (tempAuthStorage) {
      if (getValues) {
        return NextResponse.json({
          auth_token: tempAuthStorage.auth_token,
          ct0: tempAuthStorage.ct0,
          source: 'memory'
        });
      }
      return NextResponse.json({
        hasAuthToken: !!tempAuthStorage.auth_token,
        hasCt0: !!tempAuthStorage.ct0,
        updated_at: tempAuthStorage.updated_at,
        source: 'memory'
      });
    }

    // どちらもない場合
    return NextResponse.json({
      hasAuthToken: false,
      hasCt0: false,
      updated_at: null,
      source: 'none'
    });
  } catch (error) {
    console.error('認証情報取得エラー:', error);
    return NextResponse.json({
      hasAuthToken: false,
      hasCt0: false,
      updated_at: null,
      source: 'error'
    });
  }
}

// 認証情報を削除
export async function DELETE() {
  try {
    // メモリストレージから削除（環境変数は削除できない）
    tempAuthStorage = null;
    
    return NextResponse.json(
      { 
        message: '認証情報が削除されました',
        note: '環境変数の認証情報は削除されません'
      },
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