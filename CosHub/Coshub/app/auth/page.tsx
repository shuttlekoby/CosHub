"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardBody, CardFooter } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Divider } from "@heroui/divider";
import { Link } from "@heroui/link";

export default function AuthPage() {
  const [authToken, setAuthToken] = useState("");
  const [ct0, setCt0] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<string>("");

  const handleSave = async () => {
    if (!authToken.trim() || !ct0.trim()) {
      alert("両方のフィールドを入力してください");
      return;
    }

    setIsLoading(true);
    
    try {
      // APIエンドポイントに送信
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auth_token: authToken, ct0 })
      });

      const result = await response.json();

      if (response.ok) {
        // ローカルストレージにも保存（フロントエンドでの利用のため）
        localStorage.setItem("auth_token", authToken);
        localStorage.setItem("ct0", ct0);
        alert("認証情報が保存されました");
      } else {
        alert(`保存に失敗しました: ${result.error}`);
      }
    } catch (error) {
      console.error("保存エラー:", error);
      alert("保存に失敗しました");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = async () => {
    setIsLoading(true);
    
    try {
      // APIエンドポイントで削除
      await fetch('/api/auth', {
        method: 'DELETE'
      });

      // ローカルストレージからも削除
      setAuthToken("");
      setCt0("");
      localStorage.removeItem("auth_token");
      localStorage.removeItem("ct0");
      
      alert("認証情報がクリアされました");
    } catch (error) {
      console.error("削除エラー:", error);
      alert("クリアに失敗しました");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestAuth = async () => {
    if (!authToken.trim() || !ct0.trim()) {
      setTestResult("❌ 認証情報を入力してください");
      return;
    }

    setIsLoading(true);
    setTestResult("🔄 認証情報をテスト中...");
    
    try {
      // 小さなテストダウンロードを実行
      const response = await fetch('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: 'test_user',
          options: { imageOnly: true, count: 1, test: true }
        })
      });

      const result = await response.json();

      if (response.ok) {
        setTestResult("✅ 認証が成功しました！ダウンロード機能が使用できます。");
      } else {
        setTestResult(`❌ 認証エラー: ${result.error}`);
      }
    } catch (error) {
      console.error("認証テストエラー:", error);
      setTestResult("❌ 認証テストに失敗しました");
    } finally {
      setIsLoading(false);
    }
  };

  // ページ読み込み時に保存済みの値を取得
  React.useEffect(() => {
    const savedAuthToken = localStorage.getItem("auth_token");
    const savedCt0 = localStorage.getItem("ct0");
    
    if (savedAuthToken) setAuthToken(savedAuthToken);
    if (savedCt0) setCt0(savedCt0);
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 flex justify-center">
      <div className="w-full max-w-md">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent mb-2">
            認証設定
          </h1>
          <p className="text-gray-600">
            Twitter Media Downloaderの認証情報を設定
          </p>
        </div>

        <Card className="w-full">
          <CardHeader>
            <div className="flex flex-col">
              <p className="text-md font-semibold">認証トークン設定</p>
              <p className="text-small text-default-500">
                Twitter APIの認証に必要な情報を入力してください
              </p>
            </div>
          </CardHeader>
          
          <Divider />
          
          <CardBody className="space-y-6">
            {/* Auth Token入力 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-default-700">
                Auth Token
              </label>
              <Input
                type="password"
                placeholder="認証トークンを入力してください"
                value={authToken}
                onChange={(e) => setAuthToken(e.target.value)}
                variant="bordered"
                className="w-full"
                description="Twitterの認証トークン（auth_token）"
              />
            </div>

            {/* CT0入力 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-default-700">
                CT0 Token
              </label>
              <Input
                type="password"
                placeholder="CT0トークンを入力してください"
                value={ct0}
                onChange={(e) => setCt0(e.target.value)}
                variant="bordered"
                className="w-full"
                description="TwitterのCSRFトークン（ct0）"
              />
            </div>

            {/* 注意事項 */}
            <div className="p-4 bg-warning-50 border border-warning-200 rounded-lg">
              <p className="text-sm text-warning-800">
                <strong>⚠️ 注意：</strong><br />
                これらの認証情報は機密データです。他の人と共有しないでください。
              </p>
            </div>

            {/* 取得方法の説明 */}
            <div className="p-4 bg-default-50 border border-default-200 rounded-lg">
              <p className="text-sm text-default-700 mb-2">
                <strong>🔍 トークンの取得方法：</strong>
              </p>
              <ol className="text-xs text-default-600 space-y-1 ml-4 list-decimal">
                <li>ブラウザでTwitterにログイン</li>
                <li>開発者ツール（F12）を開く</li>
                <li>Applicationタブ → Cookies → twitter.com</li>
                <li>auth_token と ct0 の値をコピー</li>
              </ol>
            </div>

            {/* 認証テスト */}
            <div className="space-y-3">
              <Button
                color="warning"
                variant="bordered"
                onPress={handleTestAuth}
                isLoading={isLoading}
                isDisabled={!authToken.trim() || !ct0.trim()}
                className="w-full"
              >
                🧪 認証情報をテスト
              </Button>
              
              {/* テスト結果 */}
              {testResult && (
                <div className={`p-3 rounded-lg text-sm ${
                  testResult.includes('✅') ? 'bg-success-50 border border-success-200 text-success-800' :
                  testResult.includes('❌') ? 'bg-danger-50 border border-danger-200 text-danger-800' :
                  'bg-warning-50 border border-warning-200 text-warning-800'
                }`}>
                  {testResult}
                </div>
              )}
            </div>
          </CardBody>

          <Divider />

          <CardFooter className="flex justify-between">
            <Button
              color="danger"
              variant="light"
              onPress={handleClear}
              isDisabled={isLoading}
            >
              クリア
            </Button>
            
            <Button
              color="primary"
              onPress={handleSave}
              isLoading={isLoading}
              isDisabled={!authToken.trim() || !ct0.trim()}
            >
              {isLoading ? "保存中..." : "保存"}
            </Button>
          </CardFooter>
        </Card>

        {/* 戻るリンク */}
        <div className="text-center mt-6">
          <Link href="/" className="text-default-500 hover:text-default-700">
            ← ホームに戻る
          </Link>
        </div>
      </div>
    </div>
  );
} 