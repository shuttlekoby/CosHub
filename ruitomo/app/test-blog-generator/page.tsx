"use client";

import { useState, useEffect } from "react";
import { Bot, Loader, CheckCircle, XCircle, Edit, Save, X } from "lucide-react";

interface GeneratedContent {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  meta_title: string;
  meta_description: string;
  tags: string[];
  imagePrompt: string;
}

interface BlogPost {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  meta_title: string;
  meta_description: string;
  categories: string[];
  imageAlt: string;
  imagePrompt: string;
}

interface ImagePromptFields {
  title: string;
  subjectDescription: string;
  backgroundElements: string;
  blogTopic: string;
  desiredMood: string;
  blogSubject: string;
}

export default function TestBlogGenerator() {
  const [title, setTitle] = useState("");
  const [tone, setTone] = useState("professional");
  const [language, setLanguage] = useState("ja");
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  // 編集可能なフィールド
  const [editablePost, setEditablePost] = useState<BlogPost | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // 画像プロンプト関連
  const [imagePromptFields, setImagePromptFields] = useState<ImagePromptFields>({
    title: "",
    subjectDescription: "young professional",
    backgroundElements: "office workspace",
    blogTopic: "business",
    desiredMood: "professional",
    blogSubject: "business tips"
  });
  const [customImagePrompt, setCustomImagePrompt] = useState("");

  // プロンプトテンプレートから自動生成
  const generateImagePrompt = () => {
    const template = `The text "[INSERT_TITLE]" in the center middle with white color and subtle drop shadow for better readability. A color film-inspired portrait of a [INSERT_SUBJECT_DESCRIPTION] looking to the side with a shallow depth of field that blurs the surrounding [INSERT_BACKGROUND_ELEMENTS], drawing attention to their eye and expression. The fine grain and cast suggest a high ISO film stock, while the wide aperture lens creates a motion blur effect, enhancing the candid and natural documentary style. The background should subtly relate to [INSERT_BLOG_TOPIC] with relevant elements softly blurred. The white text should have a soft black or dark gray drop shadow to ensure clear visibility against any background elements. Overall mood should convey [INSERT_DESIRED_MOOD] and be perfect for a blog about [INSERT_BLOG_SUBJECT].`;
    
    return template
      .replace("[INSERT_TITLE]", imagePromptFields.title || title)
      .replace("[INSERT_SUBJECT_DESCRIPTION]", imagePromptFields.subjectDescription)
      .replace("[INSERT_BACKGROUND_ELEMENTS]", imagePromptFields.backgroundElements)
      .replace("[INSERT_BLOG_TOPIC]", imagePromptFields.blogTopic)
      .replace("[INSERT_DESIRED_MOOD]", imagePromptFields.desiredMood)
      .replace("[INSERT_BLOG_SUBJECT]", imagePromptFields.blogSubject);
  };

  // プロンプトフィールドの変更ハンドラー
  const handlePromptFieldChange = (field: keyof ImagePromptFields, value: string) => {
    setImagePromptFields(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // タイトルが変更されたときプロンプトも更新
  useEffect(() => {
    setImagePromptFields(prev => ({
      ...prev,
      title: title
    }));
  }, [title]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsGenerating(true);
    setError(null);
    setResult(null);
    setEditablePost(null);

    try {
      const response = await fetch("/api/generate-blog-post", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          tone,
          language,
          imagePrompt: customImagePrompt || generateImagePrompt(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResult(data);
        
        // 編集可能なデータを設定
        if (data.blogContent) {
          const generatedSlug = title
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "")
            .substring(0, 10) || `post${Math.random().toString(36).substring(2, 8)}`;
            
          setEditablePost({
            title: title.trim(),
            slug: generatedSlug,
            excerpt: data.blogContent.excerpt,
            content: data.blogContent.content,
            meta_title: data.blogContent.meta_title,
            meta_description: data.blogContent.meta_description,
            categories: data.blogContent.tags || [],
            imageAlt: `Image for ${title.trim()}`,
            imagePrompt: customImagePrompt || generateImagePrompt(),
          });
        }
      } else {
        setError(data.message || "ブログ記事の生成に失敗しました");
      }
    } catch (err) {
      setError("ネットワークエラーが発生しました");
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEditableChange = (field: keyof BlogPost, value: string | string[]) => {
    if (editablePost) {
      setEditablePost({
        ...editablePost,
        [field]: value,
      });
    }
  };

  const handleCategoryChange = (index: number, value: string) => {
    if (editablePost) {
      const newCategories = [...editablePost.categories];
      newCategories[index] = value;
      setEditablePost({
        ...editablePost,
        categories: newCategories,
      });
    }
  };

  const addCategory = () => {
    if (editablePost) {
      setEditablePost({
        ...editablePost,
        categories: [...editablePost.categories, ""],
      });
    }
  };

  const removeCategory = (index: number) => {
    if (editablePost) {
      const newCategories = editablePost.categories.filter((_, i) => i !== index);
      setEditablePost({
        ...editablePost,
        categories: newCategories,
      });
    }
  };

  const handleSaveToSanity = async () => {
    if (!editablePost) return;

    setIsGenerating(true);
    try {
      // ここでSanityに保存するAPIを呼び出す
      // 今は仮の実装
      console.log("Saving to Sanity:", editablePost);
      setIsEditing(false);
    } catch (err) {
      setError("保存に失敗しました");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center gap-3 mb-8">
            <Bot className="text-blue-600" size={32} />
            <h1 className="text-3xl font-bold text-gray-900">
              AI ブログ記事生成
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 mb-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                記事タイトル *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例: 最新のAI技術トレンド2024"
                required
                disabled={isGenerating}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 text-black bg-white placeholder-gray-400"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  トーン
                </label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  disabled={isGenerating}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 text-black bg-white"
                >
                  <option value="professional">プロフェッショナル</option>
                  <option value="casual">カジュアル</option>
                  <option value="friendly">フレンドリー</option>
                  <option value="technical">技術的</option>
                  <option value="creative">クリエイティブ</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  言語
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  disabled={isGenerating}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 text-black bg-white"
                >
                  <option value="ja">日本語</option>
                  <option value="en">英語</option>
                </select>
              </div>
            </div>

            {/* サムネイル画像設定 */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">サムネイル画像設定</h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    [INSERT_TITLE] - 中央に表示するタイトル文字
                  </label>
                  <input
                    type="text"
                    value={imagePromptFields.title}
                    onChange={(e) => handlePromptFieldChange("title", e.target.value)}
                    placeholder="記事タイトルを入力"
                    disabled={isGenerating}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 text-black bg-white placeholder-gray-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    [INSERT_SUBJECT_DESCRIPTION] - 人物の描写
                  </label>
                  <input
                    type="text"
                    value={imagePromptFields.subjectDescription}
                    onChange={(e) => handlePromptFieldChange("subjectDescription", e.target.value)}
                    placeholder="例: young professional, creative designer"
                    disabled={isGenerating}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 text-black bg-white placeholder-gray-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    [INSERT_BACKGROUND_ELEMENTS] - 背景要素
                  </label>
                  <input
                    type="text"
                    value={imagePromptFields.backgroundElements}
                    onChange={(e) => handlePromptFieldChange("backgroundElements", e.target.value)}
                    placeholder="例: office workspace, design tools"
                    disabled={isGenerating}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 text-black bg-white placeholder-gray-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    [INSERT_BLOG_TOPIC] - ブログのトピック
                  </label>
                  <input
                    type="text"
                    value={imagePromptFields.blogTopic}
                    onChange={(e) => handlePromptFieldChange("blogTopic", e.target.value)}
                    placeholder="例: AI technology, design work"
                    disabled={isGenerating}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 text-black bg-white placeholder-gray-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    [INSERT_DESIRED_MOOD] - 表現したい雰囲気
                  </label>
                  <input
                    type="text"
                    value={imagePromptFields.desiredMood}
                    onChange={(e) => handlePromptFieldChange("desiredMood", e.target.value)}
                    placeholder="例: innovative, professional, inspiring"
                    disabled={isGenerating}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 text-black bg-white placeholder-gray-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    [INSERT_BLOG_SUBJECT] - ブログの主題
                  </label>
                  <input
                    type="text"
                    value={imagePromptFields.blogSubject}
                    onChange={(e) => handlePromptFieldChange("blogSubject", e.target.value)}
                    placeholder="例: AI side business, design tips"
                    disabled={isGenerating}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 text-black bg-white placeholder-gray-400"
                  />
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  画像生成プロンプト（自動生成）
                </label>
                <textarea
                  value={generateImagePrompt()}
                  onChange={(e) => setCustomImagePrompt(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-black bg-white placeholder-gray-400"
                  placeholder="上記のフィールドを入力すると自動的にプロンプトが生成されます..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  上記フィールドで自動生成されるか、直接編集することもできます
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={isGenerating || !title.trim()}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
            >
              {isGenerating && <Loader size={20} className="animate-spin" />}
              {isGenerating ? "生成中..." : "ブログ記事を生成"}
            </button>
          </form>

          {error && (
            <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center gap-2">
                <XCircle className="text-red-600" size={20} />
                <span className="text-red-800 font-medium">エラー</span>
              </div>
              <p className="text-red-700 mt-1">{error}</p>
            </div>
          )}

          {result && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-md mb-8">
              <div className="flex items-center gap-2">
                <CheckCircle className="text-green-600" size={20} />
                <span className="text-green-800 font-medium">生成完了！</span>
              </div>
              <p className="text-green-700 mt-1">{result.message}</p>
            </div>
          )}

          {editablePost && (
            <div className="border-t pt-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">記事内容の編集</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="flex items-center gap-2 px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    {isEditing ? <X size={16} /> : <Edit size={16} />}
                    {isEditing ? "編集終了" : "編集モード"}
                  </button>
                  <button
                    onClick={handleSaveToSanity}
                    disabled={isGenerating}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    <Save size={16} />
                    Sanityに保存
                  </button>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                {/* 左カラム: 基本情報 */}
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      タイトル
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editablePost.title}
                        onChange={(e) => handleEditableChange("title", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-black bg-white"
                      />
                    ) : (
                      <p className="p-3 bg-gray-50 rounded-md">{editablePost.title}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      スラッグ (英数字10文字以内)
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editablePost.slug}
                        onChange={(e) => handleEditableChange("slug", e.target.value.slice(0, 10))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                        maxLength={10}
                      />
                    ) : (
                      <p className="p-3 bg-gray-50 rounded-md font-mono">{editablePost.slug}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      要約 (Excerpt)
                    </label>
                    {isEditing ? (
                      <textarea
                        value={editablePost.excerpt}
                        onChange={(e) => handleEditableChange("excerpt", e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="p-3 bg-gray-50 rounded-md">{editablePost.excerpt}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      カテゴリ
                    </label>
                    <div className="space-y-2">
                      {editablePost.categories.map((category, index) => (
                        <div key={index} className="flex gap-2">
                          {isEditing ? (
                            <>
                              <input
                                type="text"
                                value={category}
                                onChange={(e) => handleCategoryChange(index, e.target.value)}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                                placeholder="カテゴリ名"
                              />
                              <button
                                onClick={() => removeCategory(index)}
                                className="px-3 py-2 text-red-600 border border-red-300 rounded-md hover:bg-red-50"
                              >
                                <X size={16} />
                              </button>
                            </>
                          ) : (
                            <span className="px-3 py-2 bg-blue-100 text-blue-800 rounded-md">
                              {category}
                            </span>
                          )}
                        </div>
                      ))}
                      {isEditing && (
                        <button
                          onClick={addCategory}
                          className="w-full px-3 py-2 border-2 border-dashed border-gray-300 rounded-md text-gray-600 hover:border-gray-400"
                        >
                          + カテゴリを追加
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      画像代替テキスト (Alt Text)
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editablePost.imageAlt}
                        onChange={(e) => handleEditableChange("imageAlt", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="p-3 bg-gray-50 rounded-md">{editablePost.imageAlt}</p>
                    )}
                  </div>

                  <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      画像生成プロンプト
                    </label>
                    {isEditing ? (
                      <textarea
                        value={editablePost.imagePrompt}
                        onChange={(e) => handleEditableChange("imagePrompt", e.target.value)}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    ) : (
                      <div className="p-3 bg-gray-50 rounded-md max-h-32 overflow-y-auto">
                        <p className="text-sm whitespace-pre-wrap">{editablePost.imagePrompt}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 右カラム: コンテンツとSEO */}
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      本文 (Body)
                    </label>
                    {isEditing ? (
                      <textarea
                        value={editablePost.content}
                        onChange={(e) => handleEditableChange("content", e.target.value)}
                        rows={8}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <div className="p-3 bg-gray-50 rounded-md max-h-64 overflow-y-auto">
                        <p className="whitespace-pre-wrap">{editablePost.content}</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Meta Title
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editablePost.meta_title}
                        onChange={(e) => handleEditableChange("meta_title", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                        maxLength={60}
                      />
                    ) : (
                      <p className="p-3 bg-gray-50 rounded-md">{editablePost.meta_title}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      {editablePost.meta_title.length}/60文字
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Meta Description
                    </label>
                    {isEditing ? (
                      <textarea
                        value={editablePost.meta_description}
                        onChange={(e) => handleEditableChange("meta_description", e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                        maxLength={160}
                      />
                    ) : (
                      <p className="p-3 bg-gray-50 rounded-md">{editablePost.meta_description}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      {editablePost.meta_description.length}/160文字
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 