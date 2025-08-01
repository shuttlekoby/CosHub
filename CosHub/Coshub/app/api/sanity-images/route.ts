import { NextRequest, NextResponse } from 'next/server';
import { client, urlFor } from '@/lib/sanity';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!username) {
      return NextResponse.json(
        { error: 'ユーザー名が必要です' },
        { status: 400 }
      );
    }

    // Sanityから画像データを取得
    const images = await client.fetch(`
      *[_type == "cosplayerImage" && username == $username] | order(uploadedAt desc) [$offset...$limit] {
        _id,
        username,
        originalFilename,
        imageAsset,
        uploadedAt,
        twitterUrl,
        metadata
      }
    `, { username, offset, limit: offset + limit });

    // 画像URLを含む形式に変換
    const formattedImages = images.map((image: any) => ({
      id: image._id,
      filename: image.originalFilename,
      url: urlFor(image.imageAsset).url(),
      thumbnailUrl: urlFor(image.imageAsset).width(300).height(300).fit('crop').url(),
      uploadedAt: image.uploadedAt,
      twitterUrl: image.twitterUrl,
      metadata: image.metadata
    }));

    // 総数を取得
    const totalCount = await client.fetch(
      `count(*[_type == "cosplayerImage" && username == $username])`,
      { username }
    );

    return NextResponse.json({
      images: formattedImages,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      }
    }, {
      headers: {
        'Cache-Control': 's-maxage=60, stale-while-revalidate=300' // 1分キャッシュ、5分stale-while-revalidate
      }
    });

  } catch (error) {
    console.error('Error fetching images from Sanity:', error);
    return NextResponse.json(
      { error: 'Failed to fetch images' },
      { status: 500 }
    );
  }
}