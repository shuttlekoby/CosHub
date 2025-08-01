import { NextRequest, NextResponse } from 'next/server'
import { client } from '@/lib/sanity'
import fs from 'fs/promises'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const { username, imagePaths } = await request.json()

    if (!username || !imagePaths || !Array.isArray(imagePaths)) {
      return NextResponse.json(
        { error: 'ユーザー名と画像パスの配列が必要です' },
        { status: 400 }
      )
    }

    const uploadedImages = []
    const errors = []

    // 既存のCosplayerドキュメントを検索または作成
    let cosplayer = await client
      .fetch(`*[_type == "cosplayer" && username == $username][0]`, { username })

    if (!cosplayer) {
      cosplayer = await client.create({
        _type: 'cosplayer',
        username,
        displayName: username,
        lastUpdated: new Date().toISOString(),
        imageCount: 0
      })
    }

    // 既存の画像のファイル名を取得（重複チェック用）
    const existingImages = await client.fetch(
      `*[_type == "cosplayerImage" && username == $username].originalFilename`,
      { username }
    )

    for (const imagePath of imagePaths) {
      try {
        const filename = path.basename(imagePath)
        
        // 重複チェック
        if (existingImages.includes(filename)) {
          console.log(`スキップ: ${filename} (既存)`)
          continue
        }

        // ファイルを読み込み
        const imageBuffer = await fs.readFile(imagePath)
        
        // Sanityに画像アセットとしてアップロード
        const asset = await client.assets.upload('image', imageBuffer, {
          filename: filename,
          contentType: getContentType(filename)
        })

        // 画像ドキュメントを作成
        const imageDoc = await client.create({
          _type: 'cosplayerImage',
          username,
          originalFilename: filename,
          imageAsset: {
            _type: 'image',
            asset: {
              _type: 'reference',
              _ref: asset._id
            }
          },
          uploadedAt: new Date().toISOString(),
          metadata: {
            width: asset.metadata?.dimensions?.width || 0,
            height: asset.metadata?.dimensions?.height || 0,
            format: asset.metadata?.format || '',
            size: asset.size || 0
          }
        })

        uploadedImages.push({
          id: imageDoc._id,
          filename,
          assetId: asset._id,
          url: asset.url
        })

        console.log(`✅ アップロード成功: ${filename}`)

      } catch (error) {
        console.error(`❌ アップロード失敗: ${imagePath}`, error)
        errors.push({
          path: imagePath,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    // Cosplayerの画像数を更新
    if (uploadedImages.length > 0) {
      const totalImages = await client.fetch(
        `count(*[_type == "cosplayerImage" && username == $username])`,
        { username }
      )

      await client
        .patch(cosplayer._id)
        .set({
          lastUpdated: new Date().toISOString(),
          imageCount: totalImages
        })
        .commit()
    }

    return NextResponse.json({
      success: true,
      message: `${uploadedImages.length}枚の画像をSanityにアップロードしました`,
      uploadedCount: uploadedImages.length,
      skippedCount: imagePaths.length - uploadedImages.length - errors.length,
      errorCount: errors.length,
      uploadedImages,
      errors
    })

  } catch (error) {
    console.error('Sanity upload error:', error)
    return NextResponse.json(
      {
        error: 'Sanityアップロードに失敗しました',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

function getContentType(filename: string): string {
  const ext = path.extname(filename).toLowerCase()
  switch (ext) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg'
    case '.png':
      return 'image/png'
    case '.webp':
      return 'image/webp'
    default:
      return 'image/jpeg'
  }
}