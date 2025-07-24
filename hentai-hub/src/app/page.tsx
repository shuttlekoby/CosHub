'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog"
import { Search, ExternalLink, Eye, Calendar, Clock, Loader2, FileText, Hash, Trash2, CheckSquare, Square, Plus, Sparkles, X, Tag, Wand2, Shield, Globe, Rss } from 'lucide-react'

interface Article {
  id: number
  url: string
  title: string
  content: string
  published_date?: string
  image_url?: string
  category?: string
  created_at: string
  tags: Tag[]
}

interface Tag {
  id: number
  name: string
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
}

// 人気ジャンル・タグのプリセット
const POPULAR_GENRES = [
  { name: '人妻', category: 'キャラ', icon: '👩', adult: true },
  { name: 'ロリ', category: 'キャラ', icon: '👧', adult: false },
  { name: 'エロアニメ', category: 'メディア', icon: '🎬', adult: true },
  { name: '3D', category: 'スタイル', icon: '🎮', adult: false },
  { name: 'コスプレイヤー', category: 'キャラ', icon: '🎭', adult: false },
  { name: 'JK', category: 'キャラ', icon: '👩‍🎓', adult: true },
  { name: 'OL', category: 'キャラ', icon: '👩‍💼', adult: false },
  { name: 'メイド', category: 'キャラ', icon: '👩‍🍳', adult: false },
  { name: 'ナース', category: 'キャラ', icon: '👩‍⚕️', adult: false },
  { name: 'VR', category: 'テク', icon: '🥽', adult: false },
  { name: 'ライブチャット', category: 'メディア', icon: '📹', adult: true },
  { name: 'エロゲ', category: 'メディア', icon: '🎮', adult: true }
]

// 利用可能なソース情報
const AVAILABLE_SOURCES = [
  { name: 'Reddit NSFW', type: 'RSS', adult: true, description: 'アダルトコンテンツRSSフィード' },
  { name: 'Reddit Adult', type: 'RSS', adult: true, description: 'アダルト関連コミュニティ' },
  { name: 'AVN News', type: 'HTML', adult: true, description: 'アダルト業界ニュース' },
  { name: 'MyAnimeList', type: 'HTML', adult: false, description: 'アニメ情報データベース' },
  { name: 'AniDB', type: 'HTML', adult: false, description: 'アニメデータベース' },
  { name: 'はてなブログ', type: 'HTML', adult: false, description: '一般ブログコンテンツ' },
  { name: 'note', type: 'HTML', adult: false, description: 'クリエイターコンテンツ' },
  { name: 'Qiita', type: 'HTML', adult: false, description: '技術コンテンツ' }
]

export default function Home() {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [scraping, setScraping] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [generatingByGenre, setGeneratingByGenre] = useState(false)
  const [scrapingUrl, setScrapingUrl] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [error, setError] = useState('')
  const [selectedArticles, setSelectedArticles] = useState<Set<number>>(new Set())
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showGenerateDialog, setShowGenerateDialog] = useState(false)
  const [showGenreDialog, setShowGenreDialog] = useState(false)
  const [generateUrls, setGenerateUrls] = useState<string[]>(['', '', ''])
  const [generateTitle, setGenerateTitle] = useState('')
  const [generateType, setGenerateType] = useState('review')
  
  // ジャンル生成関連の状態
  const [selectedGenres, setSelectedGenres] = useState<Set<string>>(new Set())
  const [customGenres, setCustomGenres] = useState<string[]>([''])
  const [genreArticleTitle, setGenreArticleTitle] = useState('')
  const [genreArticleType, setGenreArticleType] = useState('ranking')
  const [maxSources, setMaxSources] = useState(8)
  const [includeAdultSources, setIncludeAdultSources] = useState(true)
  const [selectedSources, setSelectedSources] = useState<Set<string>>(new Set())

  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })

  // 記事一覧を取得
  const fetchArticles = async (page = 1, search = '') => {
    try {
      setLoading(true)
      setError('')
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(search && { search })
      })
      
      const response = await fetch(`/api/articles?${params}`)
      const data = await response.json()
      
      if (data.articles) {
        setArticles(data.articles)
        setPagination(data.pagination)
        // 削除された記事がある場合、選択状態もクリア
        setSelectedArticles(new Set())
      }
    } catch (error) {
      console.error('記事の取得に失敗しました:', error)
      setError('記事の取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  // スクレイピング実行
  const handleScraping = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!scrapingUrl.trim()) return

    try {
      setScraping(true)
      setError('')
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: scrapingUrl }),
      })

      const data = await response.json()

      if (data.success) {
        setScrapingUrl('')
        fetchArticles() // 記事一覧を更新
        setError('') // エラーをクリア
        // 成功メッセージは実装済みのアラートで表示
      } else {
        setError(data.error || 'スクレイピングに失敗しました')
      }
    } catch (error) {
      setError('スクレイピング中にエラーが発生しました')
      console.error('Scraping error:', error)
    } finally {
      setScraping(false)
    }
  }

  // 記事生成実行
  const handleGenerateArticle = async () => {
    const validUrls = generateUrls.filter(url => url.trim() !== '')
    
    if (validUrls.length === 0) {
      setError('最低1つのURLを入力してください')
      return
    }

    if (!generateTitle.trim()) {
      setError('記事タイトルを入力してください')
      return
    }

    try {
      setGenerating(true)
      setError('')
      
      const response = await fetch('/api/generate-article', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          urls: validUrls,
          articleTitle: generateTitle,
          articleType: generateType
        }),
      })

      const data = await response.json()

      if (data.success) {
        setShowGenerateDialog(false)
        setGenerateUrls(['', '', ''])
        setGenerateTitle('')
        fetchArticles() // 記事一覧を更新
        setError('')
      } else {
        setError(data.error || '記事生成に失敗しました')
      }
    } catch (error) {
      setError('記事生成中にエラーが発生しました')
      console.error('Generate error:', error)
    } finally {
      setGenerating(false)
    }
  }

  // ジャンル指定記事生成実行
  const handleGenerateByGenre = async () => {
    const allGenres = [
      ...Array.from(selectedGenres),
      ...customGenres.filter(g => g.trim() !== '')
    ]

    if (allGenres.length === 0) {
      setError('最低1つのジャンル・タグを指定してください')
      return
    }

    try {
      setGeneratingByGenre(true)
      setError('')
      
      const response = await fetch('/api/generate-by-genre', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          genres: allGenres,
          articleTitle: genreArticleTitle || undefined,
          articleType: genreArticleType,
          maxSources: maxSources,
          includeAdultSources: includeAdultSources,
          enabledSources: selectedSources.size > 0 ? Array.from(selectedSources) : undefined
        }),
      })

      const data = await response.json()

      if (data.success) {
        setShowGenreDialog(false)
        resetGenreForm()
        fetchArticles() // 記事一覧を更新
        setError('')
      } else {
        setError(data.error || 'ジャンル記事生成に失敗しました')
      }
    } catch (error) {
      setError('ジャンル記事生成中にエラーが発生しました')
      console.error('Genre generate error:', error)
    } finally {
      setGeneratingByGenre(false)
    }
  }

  // ジャンルフォームをリセット
  const resetGenreForm = () => {
    setSelectedGenres(new Set())
    setCustomGenres([''])
    setGenreArticleTitle('')
    setGenreArticleType('ranking')
    setMaxSources(8)
    setIncludeAdultSources(true)
    setSelectedSources(new Set())
  }

  // 検索実行
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchArticles(1, searchTerm)
  }

  // 記事選択のトグル
  const toggleArticleSelection = (articleId: number) => {
    const newSelected = new Set(selectedArticles)
    if (newSelected.has(articleId)) {
      newSelected.delete(articleId)
    } else {
      newSelected.add(articleId)
    }
    setSelectedArticles(newSelected)
  }

  // 全選択のトグル
  const toggleSelectAll = () => {
    if (selectedArticles.size === articles.length) {
      setSelectedArticles(new Set())
    } else {
      setSelectedArticles(new Set(articles.map(article => article.id)))
    }
  }

  // 一括削除の実行
  const handleBatchDelete = async () => {
    try {
      setDeleting(true)
      const response = await fetch('/api/articles/batch-delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids: Array.from(selectedArticles) }),
      })

      const data = await response.json()

      if (data.success) {
        setShowDeleteDialog(false)
        setSelectedArticles(new Set())
        fetchArticles(pagination.page, searchTerm) // 現在のページを再読み込み
      } else {
        setError(data.error || '削除に失敗しました')
      }
    } catch (error) {
      setError('削除中にエラーが発生しました')
      console.error('Batch delete error:', error)
    } finally {
      setDeleting(false)
    }
  }

  // URL入力欄の追加
  const addUrlField = () => {
    if (generateUrls.length < 10) {
      setGenerateUrls([...generateUrls, ''])
    }
  }

  // URL入力欄の削除
  const removeUrlField = (index: number) => {
    if (generateUrls.length > 1) {
      const newUrls = generateUrls.filter((_, i) => i !== index)
      setGenerateUrls(newUrls)
    }
  }

  // URL入力欄の更新
  const updateUrlField = (index: number, value: string) => {
    const newUrls = [...generateUrls]
    newUrls[index] = value
    setGenerateUrls(newUrls)
  }

  // ジャンルの選択切り替え
  const toggleGenre = (genre: string) => {
    const newSelected = new Set(selectedGenres)
    if (newSelected.has(genre)) {
      newSelected.delete(genre)
    } else {
      newSelected.add(genre)
    }
    setSelectedGenres(newSelected)
  }

  // ソースの選択切り替え
  const toggleSource = (source: string) => {
    const newSelected = new Set(selectedSources)
    if (newSelected.has(source)) {
      newSelected.delete(source)
    } else {
      newSelected.add(source)
    }
    setSelectedSources(newSelected)
  }

  // カスタムジャンル追加
  const addCustomGenre = () => {
    if (customGenres.length < 10) {
      setCustomGenres([...customGenres, ''])
    }
  }

  // カスタムジャンル削除
  const removeCustomGenre = (index: number) => {
    if (customGenres.length > 1) {
      const newGenres = customGenres.filter((_, i) => i !== index)
      setCustomGenres(newGenres)
    }
  }

  // カスタムジャンル更新
  const updateCustomGenre = (index: number, value: string) => {
    const newGenres = [...customGenres]
    newGenres[index] = value
    setCustomGenres(newGenres)
  }

  // 表示するソースをフィルタリング
  const getFilteredSources = () => {
    return AVAILABLE_SOURCES.filter(source => 
      includeAdultSources || !source.adult
    )
  }

  // 初期読み込み
  useEffect(() => {
    fetchArticles()
  }, [])

  return (
    <div className="min-h-screen bg-background">
      {/* ヘッダー */}
      <header className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold text-foreground">
                まとめサイト
              </h1>
            </div>
            <div className="text-sm text-muted-foreground">
              合計 <span className="font-semibold text-foreground">{pagination.total}</span> 件の記事
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* エラー表示 */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* 記事作成ツール */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* スクレイピングフォーム */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                記事をスクレイピング
              </CardTitle>
              <CardDescription>
                既存の記事URLから情報を取得します
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleScraping} className="space-y-4">
                <div>
                  <Label htmlFor="scraping-url">記事URL</Label>
                  <Input
                    id="scraping-url"
                    type="url"
                    value={scrapingUrl}
                    onChange={(e) => setScrapingUrl(e.target.value)}
                    placeholder="https://example.com/article"
                    required
                    disabled={scraping}
                  />
                </div>
                <Button type="submit" disabled={scraping} className="w-full">
                  {scraping ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      スクレイピング中...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      スクレイピング実行
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* 記事生成フォーム */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                オリジナル記事を生成
              </CardTitle>
              <CardDescription>
                複数のソースから新しい記事を自動作成します
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => setShowGenerateDialog(true)} 
                className="w-full"
                variant="outline"
              >
                <Plus className="mr-2 h-4 w-4" />
                記事生成を開始
              </Button>
            </CardContent>
          </Card>

          {/* ジャンル指定記事生成フォーム */}
          <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-purple/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wand2 className="h-5 w-5 text-primary" />
                ジャンル指定生成
              </CardTitle>
              <CardDescription>
                人気ジャンル・タグから自動で最新記事を生成
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => setShowGenreDialog(true)} 
                className="w-full"
                variant="default"
              >
                <Tag className="mr-2 h-4 w-4" />
                ジャンル記事を生成
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* 検索フォーム */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              記事を検索
            </CardTitle>
            <CardDescription>
              タイトルや内容からキーワード検索
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="search-term" className="sr-only">
                  検索キーワード
                </Label>
                <Input
                  id="search-term"
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="キーワードで検索..."
                />
              </div>
              <Button type="submit" variant="secondary">
                <Search className="mr-2 h-4 w-4" />
                検索
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setSearchTerm('')
                  fetchArticles(1, '')
                }}
              >
                クリア
              </Button>
            </form>
          </CardContent>
        </Card>

        <Separator />

        {/* 記事管理ツール */}
        {articles.length > 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleSelectAll}
                  >
                    {selectedArticles.size === articles.length ? (
                      <>
                        <CheckSquare className="mr-2 h-4 w-4" />
                        全選択解除
                      </>
                    ) : (
                      <>
                        <Square className="mr-2 h-4 w-4" />
                        全選択
                      </>
                    )}
                  </Button>
                  {selectedArticles.size > 0 && (
                    <span className="text-sm text-muted-foreground">
                      {selectedArticles.size}件選択中
                    </span>
                  )}
                </div>
                {selectedArticles.size > 0 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    選択した記事を削除
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 記事一覧 */}
        {loading ? (
          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-48 w-full" />
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : articles.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">記事がありません</h3>
              <p className="text-muted-foreground">
                上のフォームから記事をスクレイピングまたは生成してみてください
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {articles.map((article) => (
                <ArticleCard 
                  key={article.id} 
                  article={article}
                  isSelected={selectedArticles.has(article.id)}
                  onToggleSelect={() => toggleArticleSelection(article.id)}
                />
              ))}
            </div>

            {/* ページネーション */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center gap-2">
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={page === pagination.page ? "default" : "outline"}
                    size="sm"
                    onClick={() => fetchArticles(page, searchTerm)}
                  >
                    {page}
                  </Button>
                ))}
              </div>
            )}
          </>
        )}

        {/* 削除確認ダイアログ */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>記事の削除確認</DialogTitle>
              <DialogDescription>
                選択した{selectedArticles.size}件の記事を削除しますか？
                この操作は取り消せません。
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(false)}
                disabled={deleting}
              >
                キャンセル
              </Button>
              <Button
                variant="destructive"
                onClick={handleBatchDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    削除中...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    削除する
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 記事生成ダイアログ */}
        <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                オリジナル記事を生成
              </DialogTitle>
              <DialogDescription>
                複数のソースから魅力的な紹介記事を自動生成します
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* 記事タイトル */}
              <div>
                <Label htmlFor="article-title">記事タイトル</Label>
                <Input
                  id="article-title"
                  value={generateTitle}
                  onChange={(e) => setGenerateTitle(e.target.value)}
                  placeholder="例：おすすめコンテンツ特集"
                  required
                />
              </div>

              {/* 記事タイプ */}
              <div>
                <Label>記事タイプ</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {[
                    { value: 'review', label: '🌟 レビュー記事', desc: '詳細な紹介記事' },
                    { value: 'ranking', label: '🏆 ランキング', desc: '順位付けして紹介' },
                    { value: 'comparison', label: '⚖️ 比較記事', desc: '複数を比較分析' },
                    { value: 'collection', label: '📚 コレクション', desc: 'まとめて紹介' }
                  ].map((type) => (
                    <Button
                      key={type.value}
                      variant={generateType === type.value ? "default" : "outline"}
                      onClick={() => setGenerateType(type.value)}
                      className="h-auto p-3 flex flex-col items-start"
                    >
                      <span className="font-medium">{type.label}</span>
                      <span className="text-xs text-muted-foreground">{type.desc}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* URL入力欄 */}
              <div>
                <Label>ソースURL</Label>
                <div className="space-y-2 mt-2">
                  {generateUrls.map((url, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={url}
                        onChange={(e) => updateUrlField(index, e.target.value)}
                        placeholder={`ソースURL ${index + 1}`}
                        type="url"
                      />
                      {generateUrls.length > 1 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeUrlField(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  {generateUrls.length < 10 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={addUrlField}
                      className="w-full"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      URL追加
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowGenerateDialog(false)}
                disabled={generating}
              >
                キャンセル
              </Button>
              <Button
                onClick={handleGenerateArticle}
                disabled={generating}
              >
                {generating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    記事を生成
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ジャンル指定記事生成ダイアログ */}
        <Dialog open={showGenreDialog} onOpenChange={setShowGenreDialog}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Wand2 className="h-5 w-5" />
                ジャンル指定記事生成
              </DialogTitle>
              <DialogDescription>
                人気ジャンル・タグを選択して、RSS・HTMLソースから自動記事を生成します
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* アダルトコンテンツ制御 */}
              <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950 dark:border-orange-800">
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-3">
                    <Shield className="h-5 w-5 text-orange-600" />
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="include-adult"
                        checked={includeAdultSources}
                        onCheckedChange={(checked) => setIncludeAdultSources(!!checked)}
                      />
                      <Label htmlFor="include-adult" className="font-medium">
                        アダルトソースを含める
                      </Label>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2 ml-8">
                    Reddit NSFW、AVN Newsなどのアダルトコンテンツソースから情報を取得します
                  </p>
                </CardContent>
              </Card>

              {/* データソース選択 */}
              <div>
                <Label className="text-base font-semibold flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  データソース選択（空白で全て使用）
                </Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-3">
                  {getFilteredSources().map((source) => (
                    <Button
                      key={source.name}
                      variant={selectedSources.has(source.name) ? "default" : "outline"}
                      onClick={() => toggleSource(source.name)}
                      className="h-auto p-3 flex flex-col items-center gap-1"
                      size="sm"
                    >
                      <div className="flex items-center gap-1">
                        {source.type === 'RSS' ? <Rss className="h-3 w-3" /> : <Globe className="h-3 w-3" />}
                        <span className="text-xs font-medium">{source.name}</span>
                        {source.adult && <span className="text-xs text-orange-600">🔞</span>}
                      </div>
                      <span className="text-xs text-muted-foreground">{source.type}</span>
                      <span className="text-xs text-muted-foreground text-center">{source.description}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* 人気ジャンル選択 */}
              <div>
                <Label className="text-base font-semibold">人気ジャンル・タグ</Label>
                <div className="grid grid-cols-3 md:grid-cols-4 gap-2 mt-3">
                  {POPULAR_GENRES.filter(genre => includeAdultSources || !genre.adult).map((genre) => (
                    <Button
                      key={genre.name}
                      variant={selectedGenres.has(genre.name) ? "default" : "outline"}
                      onClick={() => toggleGenre(genre.name)}
                      className="h-auto p-3 flex flex-col items-center gap-1"
                      size="sm"
                    >
                      <span className="text-lg">{genre.icon}</span>
                      <span className="text-xs font-medium">{genre.name}</span>
                      <span className="text-xs text-muted-foreground">{genre.category}</span>
                      {genre.adult && <span className="text-xs text-orange-600">🔞</span>}
                    </Button>
                  ))}
                </div>
              </div>

              {/* カスタムジャンル */}
              <div>
                <Label className="text-base font-semibold">カスタムジャンル・タグ</Label>
                <div className="space-y-2 mt-3">
                  {customGenres.map((genre, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={genre}
                        onChange={(e) => updateCustomGenre(index, e.target.value)}
                        placeholder={`カスタムジャンル ${index + 1}`}
                      />
                      {customGenres.length > 1 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeCustomGenre(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  {customGenres.length < 10 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={addCustomGenre}
                      className="w-full"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      カスタムジャンル追加
                    </Button>
                  )}
                </div>
              </div>

              {/* 記事設定 */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="genre-article-title">記事タイトル（空白で自動生成）</Label>
                  <Input
                    id="genre-article-title"
                    value={genreArticleTitle}
                    onChange={(e) => setGenreArticleTitle(e.target.value)}
                    placeholder="例：2024年最新！人妻エロアニメ特集"
                  />
                </div>
                <div>
                  <Label htmlFor="max-sources">取得記事数</Label>
                  <Input
                    id="max-sources"
                    type="number"
                    value={maxSources}
                    onChange={(e) => setMaxSources(parseInt(e.target.value) || 8)}
                    min="1"
                    max="20"
                  />
                </div>
              </div>

              {/* 記事タイプ */}
              <div>
                <Label className="text-base font-semibold">記事タイプ</Label>
                <div className="grid grid-cols-2 gap-2 mt-3">
                  {[
                    { value: 'ranking', label: '🏆 ランキング', desc: 'おすすめ順で紹介' },
                    { value: 'collection', label: '📚 コレクション', desc: 'まとめて紹介' },
                    { value: 'review', label: '🌟 レビュー', desc: '詳細レビュー' },
                    { value: 'comparison', label: '⚖️ 比較', desc: '作品比較分析' }
                  ].map((type) => (
                    <Button
                      key={type.value}
                      variant={genreArticleType === type.value ? "default" : "outline"}
                      onClick={() => setGenreArticleType(type.value)}
                      className="h-auto p-3 flex flex-col items-start"
                    >
                      <span className="font-medium">{type.label}</span>
                      <span className="text-xs text-muted-foreground">{type.desc}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* 選択中の情報表示 */}
              {(selectedGenres.size > 0 || customGenres.some(g => g.trim() !== '') || selectedSources.size > 0) && (
                <Card className="p-4 bg-muted rounded-lg">
                  <div className="space-y-3">
                    {(selectedGenres.size > 0 || customGenres.some(g => g.trim() !== '')) && (
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">選択中のジャンル・タグ:</Label>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {Array.from(selectedGenres).map(genre => (
                            <Badge key={genre} variant="default">{genre}</Badge>
                          ))}
                          {customGenres.filter(g => g.trim() !== '').map((genre, index) => (
                            <Badge key={index} variant="secondary">{genre}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {selectedSources.size > 0 && (
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">選択中のソース:</Label>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {Array.from(selectedSources).map(source => {
                            const sourceInfo = AVAILABLE_SOURCES.find(s => s.name === source)
                            return (
                              <Badge key={source} variant="outline" className="flex items-center gap-1">
                                {sourceInfo?.type === 'RSS' ? <Rss className="h-3 w-3" /> : <Globe className="h-3 w-3" />}
                                {source}
                              </Badge>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowGenreDialog(false)
                  resetGenreForm()
                }}
                disabled={generatingByGenre}
              >
                キャンセル
              </Button>
              <Button
                onClick={handleGenerateByGenre}
                disabled={generatingByGenre}
              >
                {generatingByGenre ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    記事を生成
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}

// 記事カードコンポーネント
interface ArticleCardProps {
  article: Article
  isSelected: boolean
  onToggleSelect: () => void
}

function ArticleCard({ article, isSelected, onToggleSelect }: ArticleCardProps) {
  const isGenerated = article.url.startsWith('generated-')
  const isGenreGenerated = article.url.startsWith('generated-genre-')
  
  return (
    <Card className={`overflow-hidden hover:shadow-lg transition-shadow duration-200 ${isSelected ? 'ring-2 ring-primary' : ''}`}>
      <div className="relative">
        {/* 選択チェックボックス */}
        <div className="absolute top-2 left-2 z-10">
          <Checkbox
            checked={isSelected}
            onCheckedChange={onToggleSelect}
            className="bg-background/80 backdrop-blur"
          />
        </div>
        
        {/* 生成記事バッジ */}
        {isGenreGenerated ? (
          <div className="absolute top-2 right-2 z-10">
            <Badge variant="default" className="bg-gradient-to-r from-primary to-purple-600 text-white backdrop-blur">
              <Wand2 className="h-3 w-3 mr-1" />
              ジャンル生成
            </Badge>
          </div>
        ) : isGenerated ? (
          <div className="absolute top-2 right-2 z-10">
            <Badge variant="secondary" className="bg-background/80 backdrop-blur">
              <Sparkles className="h-3 w-3 mr-1" />
              生成記事
            </Badge>
          </div>
        ) : null}
        
        {article.image_url && (
          <div className="relative h-48 w-full overflow-hidden">
            <Image
              src={article.image_url}
              alt={article.title}
              fill
              className="object-cover transition-transform duration-200 hover:scale-105"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
              }}
            />
          </div>
        )}
      </div>
      
      <CardHeader className="pb-2">
        <CardTitle className="line-clamp-2 text-lg leading-snug">
          {article.title}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <p className="text-muted-foreground text-sm line-clamp-3 leading-relaxed">
          {article.content}
        </p>
        
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            {article.published_date ? (
              <>
                <Calendar className="h-3 w-3" />
                <span>{new Date(article.published_date).toLocaleDateString('ja-JP')}</span>
              </>
            ) : (
              <>
                <Clock className="h-3 w-3" />
                <span>{new Date(article.created_at).toLocaleDateString('ja-JP')}</span>
              </>
            )}
          </div>
        </div>
        
        {article.category && (
          <div>
            <Badge variant="secondary">
              {article.category}
            </Badge>
          </div>
        )}
        
        {article.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {article.tags.map((tag) => (
              <Badge key={tag.id} variant="outline" className="text-xs">
                <Hash className="h-2 w-2 mr-1" />
                {tag.name}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex gap-2 pt-2">
        {!isGenerated && (
          <Button variant="outline" size="sm" asChild className="flex-1">
            <Link href={article.url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-3 w-3" />
              元記事
            </Link>
          </Button>
        )}
        <Button size="sm" asChild className={isGenerated ? "w-full" : "flex-1"}>
          <Link href={`/articles/${article.id}`}>
            <Eye className="mr-2 h-3 w-3" />
            詳細
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
