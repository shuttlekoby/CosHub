'use client'

import React, { useState, useEffect } from 'react'
import { Download, Github, Key, CheckCircle, AlertCircle } from 'lucide-react'

export default function Home() {
  const [userId, setUserId] = useState('')
  const [maxPosts, setMaxPosts] = useState(1000)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [downloadResult, setDownloadResult] = useState<any>(null)
  
  // 認証関連の状態
  const [authToken, setAuthToken] = useState('')
  const [ct0Token, setCt0Token] = useState('')
  const [authStatus, setAuthStatus] = useState<'none' | 'valid' | 'invalid'>('none')
  const [showAuthSection, setShowAuthSection] = useState(false)

  // 認証状態をチェック
  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/auth/status')
      if (response.ok) {
        const data = await response.json()
        setAuthStatus(data.isValid ? 'valid' : 'none')
      }
    } catch (err) {
      setAuthStatus('none')
    }
  }

  const handleAuthSave = async () => {
    if (!authToken.trim() || !ct0Token.trim()) {
      setError('認証トークンを両方入力してください')
      return
    }

    try {
      const response = await fetch('/api/auth/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          authToken: authToken.trim(),
          ct0Token: ct0Token.trim()
        }),
      })

      if (response.ok) {
        setAuthStatus('valid')
        setShowAuthSection(false)
        setError('')
        alert('認証情報が保存されました！')
      } else {
        const errorData = await response.json()
        setError(errorData.error || '認証情報の保存に失敗しました')
        setAuthStatus('invalid')
      }
    } catch (err) {
      setError('認証情報の保存に失敗しました')
      setAuthStatus('invalid')
    }
  }

  const handleDownload = async () => {
    if (!userId.trim()) {
      setError('ユーザーIDを入力してください')
      return
    }

    if (authStatus !== 'valid') {
      setError('最初にTwitterの認証設定を完了してください')
      setShowAuthSection(true)
      return
    }

    setLoading(true)
    setError('')
    setDownloadResult(null)

    try {
      const response = await fetch('/api/gallery-dl', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId.trim().replace('@', ''),
          maxPosts: maxPosts
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'ダウンロードに失敗しました')
      }

      const data = await response.json()
      setDownloadResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-12">
          <div className="flex justify-center items-center gap-3 mb-4">
            <Github className="h-10 w-10 text-purple-600" />
            <h1 className="text-4xl font-bold text-gray-800">galleryDL Twitter</h1>
          </div>
          <p className="text-lg text-gray-600">
            gallery-dlを使用したTwitter画像一括ダウンローダー
          </p>
          <p className="text-sm text-gray-500 mt-2">
            ⚡ 高性能・高機能なメディアダウンローダー
          </p>
        </header>

        {/* Main Content */}
        <main className="max-w-2xl mx-auto space-y-6">
          
          {/* 認証状態表示 */}
          <div className={`p-4 rounded-lg border ${
            authStatus === 'valid' 
              ? 'bg-green-50 border-green-200 text-green-800'
              : authStatus === 'invalid'
              ? 'bg-red-50 border-red-200 text-red-800'
              : 'bg-yellow-50 border-yellow-200 text-yellow-800'
          }`}>
            <div className="flex items-center gap-2">
              {authStatus === 'valid' ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                <AlertCircle className="h-5 w-5" />
              )}
              <span className="font-medium">
                認証状態: {
                  authStatus === 'valid' ? '✅ 認証済み' :
                  authStatus === 'invalid' ? '❌ 認証失敗' : '⚠️ 未認証'
                }
              </span>
              <button
                onClick={() => setShowAuthSection(!showAuthSection)}
                className="ml-auto text-sm underline hover:no-underline"
              >
                {showAuthSection ? '閉じる' : '設定'}
              </button>
            </div>
          </div>

          {/* 認証設定セクション */}
          {showAuthSection && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <Key className="h-5 w-5 text-purple-600" />
                <h2 className="text-xl font-semibold text-gray-800">Twitter認証設定</h2>
              </div>
              
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-800 mb-2">Cookieの取得方法</h3>
                  <div className="text-sm text-blue-700 space-y-1">
                    <p>1. ブラウザでTwitter/X（x.com）にログイン</p>
                    <p>2. F12キーで開発者ツールを開く</p>
                    <p>3. Application → Cookies → https://x.com を選択</p>
                    <p>4. 以下の値をコピーして入力:</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    auth_token
                  </label>
                  <input
                    type="password"
                    value={authToken}
                    onChange={(e) => setAuthToken(e.target.value)}
                    placeholder="auth_tokenの値を入力"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ct0
                  </label>
                  <input
                    type="password"
                    value={ct0Token}
                    onChange={(e) => setCt0Token(e.target.value)}
                    placeholder="ct0の値を入力"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <button
                  onClick={handleAuthSave}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  認証情報を保存
                </button>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <p className="text-xs text-gray-600">
                    💡 これらの認証情報は一時的にサーバーに保存され、ダウンロード時にのみ使用されます。
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ダウンロードセクション */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="space-y-6">
              {/* ユーザーID入力 */}
              <div>
                <label htmlFor="userId" className="block text-sm font-medium text-gray-700 mb-2">
                  TwitterユーザーID
                </label>
                <input
                  type="text"
                  id="userId"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="例: elonmusk または @elonmusk"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  disabled={loading}
                />
              </div>

              {/* 最大投稿数設定 */}
              <div>
                <label htmlFor="maxPosts" className="block text-sm font-medium text-gray-700 mb-2">
                  最大投稿数
                </label>
                <input
                  type="number"
                  id="maxPosts"
                  value={maxPosts}
                  onChange={(e) => setMaxPosts(parseInt(e.target.value) || 1000)}
                  min="1"
                  max="10000"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  disabled={loading}
                />
                <p className="text-sm text-gray-500 mt-1">1〜10000の範囲で指定</p>
              </div>

              {/* ダウンロードボタン */}
              <button
                onClick={handleDownload}
                disabled={loading || !userId.trim() || authStatus !== 'valid'}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                    ダウンロード中...
                  </>
                ) : (
                  <>
                    <Download className="h-5 w-5" />
                    ダウンロード開始
                  </>
                )}
              </button>

              {authStatus !== 'valid' && (
                <div className="text-center">
                  <p className="text-sm text-gray-500">
                    ダウンロードには認証設定が必要です
                  </p>
                </div>
              )}

              {/* エラー表示 */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-600">{error}</p>
                </div>
              )}

              {/* ダウンロード結果 */}
              {downloadResult && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-semibold text-green-800 mb-2">
                    ダウンロード完了！
                  </h3>
                  <div className="text-sm text-green-700 space-y-1">
                    <p>ユーザー: @{downloadResult.username}</p>
                    <p>ダウンロード数: {downloadResult.downloadCount}枚</p>
                    <p>保存場所: {downloadResult.outputPath}</p>
                  </div>
                  {downloadResult.stdout && (
                    <details className="mt-3">
                      <summary className="cursor-pointer text-green-800 font-medium">
                        実行ログを表示
                      </summary>
                      <pre className="mt-2 text-xs bg-green-100 p-2 rounded overflow-x-auto">
                        {downloadResult.stdout}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              {/* 使用方法 */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-800 mb-2">使用方法</h3>
                <div className="text-sm text-blue-700 space-y-1">
                  <p>1. 上記でTwitterの認証設定を完了</p>
                  <p>2. TwitterユーザーID（@付きでも可）を入力</p>
                  <p>3. 最大投稿数を設定（デフォルト: 1000）</p>
                  <p>4. 「ダウンロード開始」ボタンをクリック</p>
                </div>
              </div>

              {/* gallery-dlの特徴 */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h3 className="font-semibold text-purple-800 mb-2">gallery-dlの特徴</h3>
                <div className="text-sm text-purple-700 space-y-1">
                  <p>• 高性能で安定したダウンロード</p>
                  <p>• メタデータの保存</p>
                  <p>• 重複ファイルの自動スキップ</p>
                  <p>• 多様な設定オプション</p>
                  <p>• アクティブな開発・メンテナンス</p>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="text-center mt-12 text-gray-500 text-sm">
          <p>© 2024 galleryDL Twitter - Powered by gallery-dl</p>
        </footer>
      </div>
    </div>
  )
} 