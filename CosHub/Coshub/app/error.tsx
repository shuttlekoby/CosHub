"use client";

import { useEffect, useState } from "react";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { title, subtitle } from "../components/primitives";

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  const [errorId] = useState(() => Math.random().toString(36).substring(2, 15));

  useEffect(() => {
    // 構造化ログでエラーを記録
    const errorData = {
      timestamp: new Date().toISOString(),
      errorId,
      message: error.message,
      stack: error.stack,
      userAgent: navigator.userAgent,
      url: window.location.href,
    };
    
    console.error('🚨 CosHub Application Error:', errorData);
    
    // 本番環境では外部ログサービスに送信することもできます
    if (process.env.NODE_ENV === 'production') {
      // ここで外部ログサービス（Sentry、LogRocket等）に送信
      // logToExternalService(errorData);
    }
  }, [error, errorId]);

  const getErrorMessage = (error: Error): string => {
    if (error.message.includes('Failed to fetch')) {
      return 'ネットワーク接続に問題があります';
    }
    if (error.message.includes('Authentication')) {
      return '認証エラーが発生しました';
    }
    if (error.message.includes('user not found')) {
      return '指定されたユーザーが見つかりません';
    }
    if (error.message.includes('Rate limit')) {
      return 'アクセス制限に達しました。しばらく待ってから再試行してください';
    }
    return '予期しないエラーが発生しました';
  };

  const getTroubleshootingSteps = (error: Error): string[] => {
    const steps = ['ページを再読み込みしてください'];
    
    if (error.message.includes('Failed to fetch')) {
      steps.push('インターネット接続を確認してください');
      steps.push('VPNを使用している場合は一時的に無効にしてください');
    }
    
    if (error.message.includes('user not found')) {
      steps.push('ユーザー名のスペルを確認してください');
      steps.push('ユーザーが存在するか Twitter で確認してください');
    }
    
    steps.push('問題が継続する場合は開発者にお問い合わせください');
    
    return steps;
  };

  const reportError = () => {
    const subject = encodeURIComponent(`CosHub エラー報告 (ID: ${errorId})`);
    const body = encodeURIComponent(`
エラーID: ${errorId}
発生時刻: ${new Date().toLocaleString('ja-JP')}
エラーメッセージ: ${error.message}
URL: ${window.location.href}
ブラウザ: ${navigator.userAgent}

追加情報:
（問題が発生したときの状況を記載してください）
    `);
    
    const mailtoLink = `mailto:support@coshub.com?subject=${subject}&body=${body}`;
    window.location.href = mailtoLink;
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-950 dark:to-pink-950">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center pb-4">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
              <span className="text-2xl">🚨</span>
            </div>
            <div>
              <h1 className={title({ color: "pink", size: "lg" })}>
                エラーが発生しました
              </h1>
              <p className={subtitle({ class: "mt-2" })}>
                {getErrorMessage(error)}
              </p>
            </div>
          </div>
        </CardHeader>
        
        <CardBody className="space-y-6">
          {/* エラー詳細 */}
          <div className="bg-red-50 dark:bg-red-950/50 p-4 rounded-lg border border-red-200 dark:border-red-800">
            <h3 className="font-semibold text-red-800 dark:text-red-200 mb-2">
              エラー詳細
            </h3>
            <p className="text-sm text-red-700 dark:text-red-300 font-mono break-all">
              {error.message}
            </p>
            <p className="text-xs text-red-600 dark:text-red-400 mt-2">
              エラーID: {errorId}
            </p>
          </div>

          {/* トラブルシューティング */}
          <div className="bg-blue-50 dark:bg-blue-950/50 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-3">
              🔧 解決手順
            </h3>
            <ol className="space-y-2">
              {getTroubleshootingSteps(error).map((step, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-blue-700 dark:text-blue-300">
                  <span className="flex-shrink-0 w-5 h-5 bg-blue-100 dark:bg-blue-900 rounded-full text-xs flex items-center justify-center font-semibold">
                    {index + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>

          {/* アクションボタン */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              color="primary" 
              size="lg"
              onPress={reset}
              className="flex-1"
            >
              🔄 再試行
            </Button>
            
            <Button 
              color="secondary" 
              variant="bordered"
              size="lg"
              onPress={() => window.location.href = '/'}
              className="flex-1"
            >
              🏠 ホームに戻る
            </Button>
            
            <Button 
              color="danger" 
              variant="light"
              size="lg"
              onPress={reportError}
              className="flex-1"
            >
              📧 エラー報告
            </Button>
          </div>

          {/* 開発者向け情報（開発環境のみ） */}
          {process.env.NODE_ENV === 'development' && (
            <details className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border">
              <summary className="cursor-pointer font-semibold text-gray-700 dark:text-gray-300">
                🐛 開発者向け詳細 (開発環境のみ)
              </summary>
              <pre className="mt-3 text-xs text-gray-600 dark:text-gray-400 overflow-auto max-h-32">
                {error.stack}
              </pre>
            </details>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
