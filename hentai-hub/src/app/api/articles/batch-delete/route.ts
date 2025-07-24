import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function DELETE(request: NextRequest) {
  try {
    const { ids } = await request.json()

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: '削除する記事IDが指定されていません' },
        { status: 400 }
      )
    }

    // IDの型チェック
    const validIds = ids.filter(id => Number.isInteger(id) && id > 0)
    if (validIds.length === 0) {
      return NextResponse.json(
        { error: '有効な記事IDが指定されていません' },
        { status: 400 }
      )
    }

    // 一括削除を実行
    const deleteResult = await prisma.article.deleteMany({
      where: {
        id: {
          in: validIds
        }
      }
    })

    return NextResponse.json({
      success: true,
      deletedCount: deleteResult.count,
      message: `${deleteResult.count}件の記事を削除しました`
    })

  } catch (error) {
    console.error('Batch delete error:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
} 