import { NextRequest, NextResponse } from 'next/server';
import { client, urlFor } from '@/lib/sanity';

export async function GET(request: NextRequest) {
  try {
    // Sanityからコスプレイヤー一覧を取得
    const cosplayers = await client.fetch(`
      *[_type == "cosplayer"] | order(lastUpdated desc) {
        _id,
        username,
        displayName,
        imageCount,
        lastUpdated,
        "latestImage": *[_type == "cosplayerImage" && username == ^.username] | order(uploadedAt desc)[0] {
          imageAsset,
          originalFilename
        }
      }
    `);

    // 画像URLを含む形式に変換
    const formattedCosplayers = cosplayers.map((cosplayer: any) => ({
      id: cosplayer._id,
      username: cosplayer.username,
      displayName: cosplayer.displayName || cosplayer.username,
      imageCount: cosplayer.imageCount || 0,
      lastUpdated: cosplayer.lastUpdated,
      profileImage: cosplayer.latestImage?.imageAsset 
        ? urlFor(cosplayer.latestImage.imageAsset).width(150).height(150).fit('crop').url()
        : '/api/placeholder/150/150'
    }));

    return NextResponse.json(formattedCosplayers, {
      headers: {
        'Cache-Control': 's-maxage=300, stale-while-revalidate=3600' // 5分キャッシュ、1時間stale-while-revalidate
      }
    });
  } catch (error) {
    console.error('Error fetching cosplayers from Sanity:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cosplayers' },
      { status: 500 }
    );
  }
}

// ISR用の定期更新エンドポイント
export async function POST(request: NextRequest) {
  try {
    const { username, secret } = await request.json();

    // 秘密キーの確認（セキュリティ用）
    if (secret !== process.env.REVALIDATION_SECRET) {
      return NextResponse.json({ error: 'Invalid secret' }, { status: 401 });
    }

    if (username) {
      // 特定のユーザーのデータを更新
      console.log(`定期更新開始: ${username}`);
      
      const downloadResponse = await fetch(
        `${process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL : 'http://localhost:3000'}/api/download`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username,
            options: {
              imageOnly: true,
              count: 50, // 定期更新では少なめに
              highQuality: true
            }
          })
        }
      );

      const result = await downloadResponse.json();
      
      return NextResponse.json({
        success: true,
        message: `${username}の定期更新が完了しました`,
        result
      });
    }

    return NextResponse.json({ error: 'Username required' }, { status: 400 });

  } catch (error) {
    console.error('ISR update error:', error);
    return NextResponse.json(
      { error: 'ISR update failed' },
      { status: 500 }
    );
  }
}