import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

// コスプレイヤーデータの型定義
export interface CosplayerData {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  hashtag?: string;
  following?: number;
  followers?: string;
  isFollowed: boolean;
  media: MediaFile[];
  downloadStatus?: DownloadStatus;
  addedAt: number;
  customAvatar?: string;
  isManuallyEdited?: boolean;
  location?: string;
  socialLinks?: {
    twitter?: string;
    instagram?: string;
    tiktok?: string;
    youtube?: string;
  };
  stats?: {
    totalPosts?: number;
    avgLikes?: number;
    verified?: boolean;
  };
}

export interface MediaFile {
  filename: string;
  url: string;
  type: string;
  likes?: number;
  title?: string;
  description?: string;
  uploadDate?: string;
  tags?: string[];
  isEdited?: boolean;
}

export interface DownloadStatus {
  isDownloading: boolean;
  progress: number;
  message: string;
  error?: string;
}

const COSPLAYERS_KEY = 'coshub:cosplayers';

// GET - 全コスプレイヤーデータを取得
export async function GET() {
  try {
    const cosplayers = await kv.get<CosplayerData[]>(COSPLAYERS_KEY) || [];
    
    return NextResponse.json({
      success: true,
      cosplayers
    });
  } catch (error) {
    console.error('コスプレイヤーデータ取得エラー:', error);
    return NextResponse.json(
      { error: 'データの取得に失敗しました' },
      { status: 500 }
    );
  }
}

// POST - 新しいコスプレイヤーを追加
export async function POST(request: NextRequest) {
  try {
    const newCosplayer: CosplayerData = await request.json();
    
    // 既存のデータを取得
    const existingCosplayers = await kv.get<CosplayerData[]>(COSPLAYERS_KEY) || [];
    
    // 重複チェック
    const exists = existingCosplayers.find(c => c.username === newCosplayer.username);
    if (exists) {
      return NextResponse.json(
        { error: 'このコスプレイヤーは既に追加されています' },
        { status: 400 }
      );
    }
    
    // 新しいデータを追加
    const updatedCosplayers = [...existingCosplayers, newCosplayer];
    await kv.set(COSPLAYERS_KEY, updatedCosplayers);
    
    return NextResponse.json({
      success: true,
      cosplayer: newCosplayer
    });
  } catch (error) {
    console.error('コスプレイヤー追加エラー:', error);
    return NextResponse.json(
      { error: 'コスプレイヤーの追加に失敗しました' },
      { status: 500 }
    );
  }
}

// PUT - コスプレイヤーデータを更新
export async function PUT(request: NextRequest) {
  try {
    const { id, updates }: { id: string; updates: Partial<CosplayerData> } = await request.json();
    
    if (!id) {
      return NextResponse.json(
        { error: 'IDが必要です' },
        { status: 400 }
      );
    }
    
    // 既存のデータを取得
    const existingCosplayers = await kv.get<CosplayerData[]>(COSPLAYERS_KEY) || [];
    
    // データを更新
    const updatedCosplayers = existingCosplayers.map(cosplayer =>
      cosplayer.id === id ? { ...cosplayer, ...updates } : cosplayer
    );
    
    await kv.set(COSPLAYERS_KEY, updatedCosplayers);
    
    return NextResponse.json({
      success: true,
      message: 'コスプレイヤーデータを更新しました'
    });
  } catch (error) {
    console.error('コスプレイヤー更新エラー:', error);
    return NextResponse.json(
      { error: 'データの更新に失敗しました' },
      { status: 500 }
    );
  }
}

// DELETE - コスプレイヤーを削除
export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    
    if (!id) {
      return NextResponse.json(
        { error: 'IDが必要です' },
        { status: 400 }
      );
    }
    
    // 既存のデータを取得
    const existingCosplayers = await kv.get<CosplayerData[]>(COSPLAYERS_KEY) || [];
    
    // データから削除
    const updatedCosplayers = existingCosplayers.filter(cosplayer => cosplayer.id !== id);
    
    await kv.set(COSPLAYERS_KEY, updatedCosplayers);
    
    return NextResponse.json({
      success: true,
      message: 'コスプレイヤーを削除しました'
    });
  } catch (error) {
    console.error('コスプレイヤー削除エラー:', error);
    return NextResponse.json(
      { error: 'コスプレイヤーの削除に失敗しました' },
      { status: 500 }
    );
  }
} 