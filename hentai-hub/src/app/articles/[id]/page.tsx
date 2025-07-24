'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  ArrowLeft, 
  ExternalLink, 
  Home, 
  Calendar, 
  Clock, 
  Hash, 
  FileText,
  AlertCircle,
  Image as ImageIcon
} from 'lucide-react'

interface Article {
  id: number
  url: string
  title: string
  content: string
  published_date?: string
  image_url?: string
  category?: string
  meta_description?: string
  created_at: string
  updated_at: string
  tags: Tag[]
}

interface Tag {
  id: number
  name: string
}

export default function ArticleDetail() {
  const params = useParams()
  const router = useRouter()
  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const { id } = await params
        const response = await fetch(`/api/articles/${id}`)
        const data = await response.json()

        if (response.ok) {
          setArticle(data.article)
        } else {
          setError(data.error || '記事の取得に失敗しました')
        }
      } catch (err) {
        setError('サーバーエラーが発生しました')
        console.error('Article fetch error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchArticle()
  }, [params])

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center gap-4">
              <Skeleton className="h-10 w-10" />
              <Skeleton className="h-8 w-32" />
            </div>
          </div>
        </header>
        
        <main className="container mx-auto px-4 py-8">
          <Card>
            <CardHeader>
              <Skeleton className="h-64 w-full" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                戻る
              </Button>
              <h1 className="text-2xl font-bold text-foreground">記事詳細</h1>
            </div>
          </div>
        </header>
        
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center space-y-4">
            <AlertCircle className="mx-auto h-16 w-16 text-destructive" />
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-lg font-semibold">
                {error}
              </AlertDescription>
            </Alert>
            <Button asChild>
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                ホームに戻る
              </Link>
            </Button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* ヘッダー */}
      <header className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              戻る
            </Button>
            <h1 className="text-2xl font-bold text-foreground">記事詳細</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card className="overflow-hidden">
            {/* メイン画像 */}
            {article.image_url && (
              <div className="relative h-64 md:h-80 w-full overflow-hidden">
                <Image
                  src={article.image_url}
                  alt={article.title}
                  fill
                  className="object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              </div>
            )}

            <CardHeader className="space-y-6">
              {/* タイトル */}
              <CardTitle className="text-3xl font-bold leading-tight">
                {article.title}
              </CardTitle>

              {/* メタ情報 */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                {article.published_date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>公開日: {new Date(article.published_date).toLocaleDateString('ja-JP')}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>取得日: {new Date(article.created_at).toLocaleDateString('ja-JP')}</span>
                </div>
                {article.category && (
                  <Badge variant="secondary" className="ml-auto">
                    {article.category}
                  </Badge>
                )}
              </div>

              {/* タグ */}
              {article.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {article.tags.map((tag) => (
                    <Badge key={tag.id} variant="outline">
                      <Hash className="h-3 w-3 mr-1" />
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              )}
            </CardHeader>

            <CardContent className="space-y-6">
              {/* メタディスクリプション */}
              {article.meta_description && (
                <Card className="bg-muted/50">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div>
                        <h3 className="font-semibold mb-2">概要</h3>
                        <p className="text-muted-foreground leading-relaxed">
                          {article.meta_description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Separator />

              {/* コンテンツ */}
              <div className="prose prose-neutral dark:prose-invert max-w-none">
                <div className="text-foreground leading-relaxed whitespace-pre-wrap">
                  {article.content}
                </div>
              </div>

              <Separator />

              {/* アクション */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild className="flex-1">
                  <Link
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    元記事を読む
                  </Link>
                </Button>
                <Button variant="secondary" asChild className="flex-1">
                  <Link href="/">
                    <Home className="mr-2 h-4 w-4" />
                    ホームに戻る
                  </Link>
                </Button>
              </div>

              {/* 更新情報 */}
              <div className="pt-4 border-t text-xs text-muted-foreground text-center">
                <Clock className="inline h-3 w-3 mr-1" />
                最終更新: {new Date(article.updated_at).toLocaleString('ja-JP')}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
} 