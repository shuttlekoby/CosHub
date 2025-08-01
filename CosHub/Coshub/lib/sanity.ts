import { createClient } from '@sanity/client'
import imageUrlBuilder from '@sanity/image-url'

// Sanity クライアントの設定
export const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  token: process.env.SANITY_API_TOKEN, // 書き込み権限用
  useCdn: false, // リアルタイム更新のため false に設定
  apiVersion: '2024-01-01'
})

// 画像URL生成用のビルダー
const builder = imageUrlBuilder(client)

export function urlFor(source: any) {
  return builder.image(source)
}

// 型定義
export interface CosplayerImage {
  _id: string
  _type: 'cosplayerImage'
  username: string
  originalFilename: string
  imageAsset: {
    _type: 'image'
    asset: {
      _ref: string
      _type: 'reference'
    }
  }
  uploadedAt: string
  twitterUrl?: string
  metadata?: {
    width: number
    height: number
    format: string
    size: number
  }
}

export interface Cosplayer {
  _id: string
  _type: 'cosplayer'
  username: string
  displayName?: string
  lastUpdated: string
  imageCount: number
  images: CosplayerImage[]
}