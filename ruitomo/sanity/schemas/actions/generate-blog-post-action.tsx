import { DocumentActionComponent, DocumentActionProps } from "sanity";
import { Bot, Loader } from "lucide-react";
import { useState } from "react";

interface GenerateBlogPostDialogProps {
  onClose: () => void;
  onGenerate: (data: {
    title: string;
    category?: string;
    targetAudience?: string;
    tone: string;
    language: string;
  }) => void;
  isGenerating: boolean;
}

// ブログ記事生成ダイアログコンポーネント
function GenerateBlogPostDialog({ onClose, onGenerate, isGenerating }: GenerateBlogPostDialogProps) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [tone, setTone] = useState("professional");
  const [language, setLanguage] = useState("ja");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onGenerate({
        title: title.trim(),
        category: category.trim() || undefined,
        targetAudience: targetAudience.trim() || undefined,
        tone,
        language,
      });
    }
  };

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
    }}>
      <div style={{
        backgroundColor: "white",
        padding: "24px",
        borderRadius: "8px",
        width: "90%",
        maxWidth: "500px",
        maxHeight: "80vh",
        overflow: "auto",
      }}>
        <h2 style={{ marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
          <Bot size={20} />
          AI ブログ記事生成
        </h2>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", marginBottom: "4px", fontWeight: "bold" }}>
              記事タイトル *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例: 最新のAI技術トレンド2024"
              required
              disabled={isGenerating}
              style={{
                width: "100%",
                padding: "8px",
                border: "1px solid #ccc",
                borderRadius: "4px",
              }}
            />
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", marginBottom: "4px", fontWeight: "bold" }}>
              カテゴリ
            </label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="例: テクノロジー、ビジネス、ライフスタイル"
              disabled={isGenerating}
              style={{
                width: "100%",
                padding: "8px",
                border: "1px solid #ccc",
                borderRadius: "4px",
              }}
            />
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", marginBottom: "4px", fontWeight: "bold" }}>
              対象読者
            </label>
            <input
              type="text"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              placeholder="例: エンジニア、経営者、一般読者"
              disabled={isGenerating}
              style={{
                width: "100%",
                padding: "8px",
                border: "1px solid #ccc",
                borderRadius: "4px",
              }}
            />
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", marginBottom: "4px", fontWeight: "bold" }}>
              トーン
            </label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              disabled={isGenerating}
              style={{
                width: "100%",
                padding: "8px",
                border: "1px solid #ccc",
                borderRadius: "4px",
              }}
            >
              <option value="professional">プロフェッショナル</option>
              <option value="casual">カジュアル</option>
              <option value="friendly">フレンドリー</option>
              <option value="technical">技術的</option>
              <option value="creative">クリエイティブ</option>
            </select>
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label style={{ display: "block", marginBottom: "4px", fontWeight: "bold" }}>
              言語
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              disabled={isGenerating}
              style={{
                width: "100%",
                padding: "8px",
                border: "1px solid #ccc",
                borderRadius: "4px",
              }}
            >
              <option value="ja">日本語</option>
              <option value="en">英語</option>
            </select>
          </div>

          <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isGenerating}
              style={{
                padding: "8px 16px",
                border: "1px solid #ccc",
                borderRadius: "4px",
                background: "white",
                cursor: isGenerating ? "not-allowed" : "pointer",
              }}
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={isGenerating || !title.trim()}
              style={{
                padding: "8px 16px",
                border: "none",
                borderRadius: "4px",
                background: isGenerating || !title.trim() ? "#ccc" : "#007bff",
                color: "white",
                cursor: isGenerating || !title.trim() ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              {isGenerating && <Loader size={16} className="animate-spin" />}
              {isGenerating ? "生成中..." : "ブログ記事を生成"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// カスタムアクション定義
export const generateBlogPostAction: DocumentActionComponent = (props: DocumentActionProps) => {
  const [showDialog, setShowDialog] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // ブログ記事生成処理
  const handleGenerate = async (data: {
    title: string;
    category?: string;
    targetAudience?: string;
    tone: string;
    language: string;
  }) => {
    setIsGenerating(true);
    
    try {
      const response = await fetch("/api/generate-blog-post", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        // 成功メッセージを表示
        alert("✅ ブログ記事が正常に生成されました！Sanity Studioをリフレッシュして新しい記事を確認してください。");
        setShowDialog(false);
        
        // ページをリロードして新しい記事を表示
        if (typeof window !== "undefined") {
          window.location.reload();
        }
      } else {
        throw new Error(result.message || "ブログ記事の生成に失敗しました");
      }
    } catch (error) {
      console.error("Error generating blog post:", error);
      alert(`❌ エラー: ${error instanceof Error ? error.message : "不明なエラーが発生しました"}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    label: "AI ブログ記事生成",
    icon: Bot,
    onHandle: () => {
      setShowDialog(true);
    },
    dialog: showDialog ? {
      type: "custom",
      component: (
        <GenerateBlogPostDialog
          onClose={() => setShowDialog(false)}
          onGenerate={handleGenerate}
          isGenerating={isGenerating}
        />
      ),
    } : false,
  };
}; 