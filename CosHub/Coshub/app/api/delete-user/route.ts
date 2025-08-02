import { NextRequest, NextResponse } from 'next/server';
import { client } from '@/lib/sanity';

export async function DELETE(request: NextRequest) {
  try {
    const { username } = await request.json();

    if (!username) {
      return NextResponse.json(
        { error: 'ユーザー名が必要です' },
        { status: 400 }
      );
    }

    // 1. そのユーザーの全画像を削除
    const images = await client.fetch(`
      *[_type == "cosplayerImage" && username == $username] {
        _id,
        imageAsset
      }
    `, { username });

    // 画像ドキュメントと画像アセットを削除
    for (const image of images) {
      try {
        // 画像ドキュメントを削除
        await client.delete(image._id);
        
        // 画像アセットを削除
        if (image.imageAsset?.asset?._ref) {
          await client.delete(image.imageAsset.asset._ref);
        }
      } catch (imageError) {
        console.error(`画像削除エラー (${image._id}):`, imageError);
      }
    }

    // 2. コスプレイヤードキュメントを削除
    const cosplayer = await client.fetch(`
      *[_type == "cosplayer" && username == $username][0] {
        _id
      }
    `, { username });

    if (cosplayer) {
      await client.delete(cosplayer._id);
    }

    return NextResponse.json({
      success: true,
      message: `${username}とその関連データ（${images.length}個の画像）を削除しました`,
      deletedImages: images.length,
      deletedCosplayer: !!cosplayer
    });

  } catch (error) {
    console.error('ユーザー削除エラー:', error);
    return NextResponse.json(
      { error: 'ユーザー削除に失敗しました' },
      { status: 500 }
    );
  }
}