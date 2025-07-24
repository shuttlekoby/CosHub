import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import Replicate from "replicate";

// リクエストのバリデーションスキーマ
const generateBlogPostSchema = z.object({
  title: z.string().min(1).max(200),
  category: z.string().optional(),
  targetAudience: z.string().optional(),
  tone: z.enum(["professional", "casual", "friendly", "technical", "creative"]).default("professional"),
  language: z.enum(["ja", "en"]).default("ja"),
  imagePrompt: z.string().optional(),
});

// Claude APIクライアントの初期化
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;

// Replicate クライアント
const replicate = new Replicate({
  auth: REPLICATE_API_TOKEN,
});

// Claude APIでブログ記事内容を生成
async function generateBlogContent(title: string, options: {
  category?: string;
  targetAudience?: string;
  tone: string;
  language: string;
}) {
  if (!ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY environment variable is required");
  }

  const prompt = `
あなたは専門的なブログライターです。以下の条件でブログ記事を作成してください：

タイトル: ${title}
カテゴリ: ${options.category || "一般"}
対象読者: ${options.targetAudience || "一般読者"}
トーン: ${options.tone}
言語: ${options.language === "ja" ? "日本語" : "英語"}

重要: 以下のJSON形式でのみ回答してください。余計な説明や文章は含めず、有効なJSONのみを出力してください。文字列内に改行文字やタブ文字を使用せず、必要に応じて\\nや\\tでエスケープしてください。

{
  "excerpt": "記事の要約（100-150文字）",
  "content": "記事の本文（プレーンテキスト形式、改行は使用せず、800-1200文字）",
  "meta_title": "SEO用のタイトル（60文字以内）",
  "meta_description": "SEO用の説明文（160文字以内）",
  "tags": ["タグ1", "タグ2", "タグ3"],
  "imagePrompt": "記事に関連する画像生成用の英語プロンプト（詳細で具体的に）"
}

記事は読みやすく、価値のある情報を提供し、読者の関心を引く内容にしてください。
`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-sonnet-20240229",
        max_tokens: 2000,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.content[0].text;
    
    console.log("Claude raw response:", content);
    
    // より厳密なJSON抽出（コードブロック内のJSONも考慮）
    let jsonString = '';
    
    // 方法1: ```json コードブロック内のJSONを探す
    const codeBlockMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch) {
      jsonString = codeBlockMatch[1].trim();
    } else {
      // 方法2: 通常のJSON抽出
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("Failed to extract JSON from Claude response");
      }
      jsonString = jsonMatch[0];
    }

    // JSONクリーンアップ関数
    function cleanJsonString(str: string): string {
      // 不正な制御文字を削除
      str = str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
      
             // より安全な方法：文字列値内の未エスケープ改行を修正
       // シンプルな方法で文字列内の改行をエスケープ
       str = str.replace(/"([^"\\]*(?:\\.[^"\\]*)*)"/g, (match, content) => {
         const cleaned = content
           .replace(/\n/g, '\\n')
           .replace(/\t/g, '\\t')
           .replace(/\r/g, '\\r');
         return `"${cleaned}"`;
       });
      
      return str;
    }
    
    jsonString = cleanJsonString(jsonString);
    console.log("Cleaned JSON string:", jsonString);

    try {
      return JSON.parse(jsonString);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      console.error("Problematic JSON string:", jsonString);
      
      // 最後の手段：手動でJSONを修正
      try {
        // より積極的なクリーンアップ
        let fixedJson = jsonString
          .replace(/\n/g, ' ')
          .replace(/\r/g, ' ')
          .replace(/\t/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        
        console.log("Attempting fixed JSON:", fixedJson);
        return JSON.parse(fixedJson);
      } catch (secondError) {
        throw new Error(`Failed to parse JSON even after cleanup: ${parseError instanceof Error ? parseError.message : 'Unknown parsing error'}`);
      }
    }
  } catch (error) {
    console.error("Error generating blog content:", error);
    throw error;
  }
}

// Replicate APIで画像を生成
async function generateImage(prompt: string): Promise<string> {
  if (!REPLICATE_API_TOKEN) {
    throw new Error("REPLICATE_API_TOKEN environment variable is required");
  }

  try {
    const output = await replicate.run(
      "ideogram-ai/ideogram-v3-quality",
      {
        input: {
          prompt: `High quality, professional, clean, modern style: ${prompt}`,
          negative_prompt: "blurry, low quality, watermark, bad anatomy",
          width: 1024,
          height: 768,
          style_type: "Auto",
          magic_prompt_option: "On",
        },
      }
    );

    console.log("Generated image output:", output);
    console.log("Output type:", typeof output);
    
    // Ideogramの出力を適切に処理
    if (output) {
      // 配列の場合
      if (Array.isArray(output) && output.length > 0) {
        return output[0] as string;
      }
      // 文字列（URL）の場合
      if (typeof output === 'string') {
        return output;
      }
      // オブジェクトの場合（urlプロパティがある場合）
      if (typeof output === 'object' && output !== null && 'url' in output) {
        return (output as any).url;
      }
      // その他の場合は文字列として変換を試みる
      return String(output);
    }
    
    throw new Error("No image generated");
  } catch (error) {
    console.error("Error generating image:", error);
    throw error;
  }
}

// デフォルトAuthorを取得
async function getDefaultAuthor() {
  const SANITY_PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const SANITY_DATASET = process.env.NEXT_PUBLIC_SANITY_DATASET;
  const SANITY_TOKEN = process.env.SANITY_API_READ_TOKEN;
  
  const queryUrl = `https://${SANITY_PROJECT_ID}.api.sanity.io/v2024-05-10/data/query/${SANITY_DATASET}?query=*[_type=="author"][0]`;
  
  try {
    const response = await fetch(queryUrl, {
      headers: {
        "Authorization": `Bearer ${SANITY_TOKEN}`,
      },
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.result;
    }
  } catch (error) {
    console.error("Error fetching default author:", error);
  }
  return null;
}

// Sanityに画像をアップロード
async function uploadImageToSanity(imageUrl: string, title: string) {
  const SANITY_PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const SANITY_DATASET = process.env.NEXT_PUBLIC_SANITY_DATASET;
  const SANITY_TOKEN = process.env.SANITY_API_READ_TOKEN;

  if (!SANITY_PROJECT_ID || !SANITY_DATASET || !SANITY_TOKEN) {
    throw new Error("Sanity configuration missing");
  }

  try {
    // 画像をダウンロード
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error("Failed to download generated image");
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    
    // Sanityに画像をアップロード
    const uploadUrl = `https://${SANITY_PROJECT_ID}.api.sanity.io/v1/assets/images/${SANITY_DATASET}`;
    
    const uploadResponse = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${SANITY_TOKEN}`,
        "Content-Type": "image/png",
      },
      body: imageBuffer,
    });

    if (!uploadResponse.ok) {
      const errorBody = await uploadResponse.text();
      console.error("Sanity image upload error response:", {
        status: uploadResponse.status,
        statusText: uploadResponse.statusText,
        body: errorBody
      });
      throw new Error(`Failed to upload image to Sanity: ${uploadResponse.status} ${uploadResponse.statusText} - ${errorBody}`);
    }

    const uploadResult = await uploadResponse.json();
    return {
      _type: "image",
      asset: {
        _type: "reference",
        _ref: uploadResult.document._id,
      },
      alt: `Generated image for: ${title}`,
    };
  } catch (error) {
    console.error("Error uploading image to Sanity:", error);
    throw error;
  }
}

// Sanityにブログ記事を作成
async function createSanityPost(postData: any) {
  const SANITY_PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const SANITY_DATASET = process.env.NEXT_PUBLIC_SANITY_DATASET;
  const SANITY_TOKEN = process.env.SANITY_API_READ_TOKEN;

  if (!SANITY_PROJECT_ID || !SANITY_DATASET || !SANITY_TOKEN) {
    throw new Error("Sanity configuration missing");
  }

  const createUrl = `https://${SANITY_PROJECT_ID}.api.sanity.io/v1/data/mutate/${SANITY_DATASET}`;

  const mutation = {
    mutations: [
      {
        create: {
          _type: "post",
          ...postData,
        },
      },
    ],
  };

  try {
    const response = await fetch(createUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SANITY_TOKEN}`,
      },
      body: JSON.stringify(mutation),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Sanity API error response:", {
        status: response.status,
        statusText: response.statusText,
        body: errorBody
      });
      throw new Error(`Failed to create post in Sanity: ${response.status} ${response.statusText} - ${errorBody}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error creating Sanity post:", error);
    throw error;
  }
}

// メイン API ハンドラー
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = generateBlogPostSchema.parse(body);

    // ステップ1: Claude APIでブログ記事内容を生成
    console.log("Generating blog content with Claude...");
    const blogContent = await generateBlogContent(validatedData.title, {
      category: validatedData.category,
      targetAudience: validatedData.targetAudience,
      tone: validatedData.tone,
      language: validatedData.language,
    });

    // ステップ2: 画像生成（オプション、エラー時はプレースホルダーを使用）
    console.log("Generating image with Replicate...");
    let sanityImage = null;
    
    try {
      const imagePromptToUse = validatedData.imagePrompt || blogContent.imagePrompt;
      const imageUrl = await generateImage(imagePromptToUse);
      console.log("Generated image URL:", imageUrl);
      
      // ステップ3: Sanityに画像をアップロード
      console.log("Uploading image to Sanity...");
      sanityImage = await uploadImageToSanity(imageUrl, validatedData.title);
      console.log("Successfully uploaded image to Sanity");
    } catch (imageError: unknown) {
      console.error("Error generating or uploading image:", imageError);
      
      // Replicate APIのクレジット不足などの場合はプレースホルダー画像を使用
      const errorMessage = imageError instanceof Error ? imageError.message : String(imageError);
      console.log("Error details:", {
        hasInsufficientCredit: errorMessage.includes('Insufficient credit'),
        has402: errorMessage.includes('402'),
        hasPaymentRequired: errorMessage.includes('Payment Required'),
        fullError: errorMessage
      });
      
      if (errorMessage.includes('Insufficient credit') || 
          errorMessage.includes('402') || 
          errorMessage.includes('Payment Required')) {
        console.log("Using placeholder image due to Replicate credit limitations...");
        try {
          // プレースホルダー画像URLを使用（記事タイトルをシードにして一意性を保つ）
          const slug = validatedData.title
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "")
            .substring(0, 20);
          const placeholderUrl = `https://picsum.photos/seed/${slug}/1200/630`;
          sanityImage = await uploadImageToSanity(placeholderUrl, `${validatedData.title}-placeholder`);
          console.log("Successfully uploaded placeholder image to Sanity");
        } catch (placeholderError) {
          console.error("Error uploading placeholder image:", placeholderError);
          // プレースホルダーも失敗した場合は画像なしで続行
          console.log("Continuing without image...");
        }
      } else {
        console.log("Image generation failed, continuing without image...");
      }
    }

    // ステップ4: ブログ記事データを準備
    // シンプルなスラッグ生成：英数字で10文字以内
    let slug = validatedData.title
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .substring(0, 10);
    
    // 短すぎる場合はランダムな文字列を追加
    if (slug.length < 3) {
      const randomSuffix = Math.random().toString(36).substring(2, 8);
      slug = `post${randomSuffix}`;
    }
    
    // 10文字に調整
    slug = slug.substring(0, 10);

    // 既存のauthorを取得（最初の作成者を使用）
    const defaultAuthor = await getDefaultAuthor();
    
    // コンテンツを段落に分割してblock-contentの形式に変換
    const contentParagraphs = blogContent.content.split('\n\n').filter((p: string) => p.trim());
    const blockContent = contentParagraphs.map((paragraph: string, index: number) => ({
      _type: "block",
      _key: `block-${index}`,
      style: "normal",
      markDefs: [],
      children: [
        {
          _type: "span",
          _key: `span-${index}`,
          text: paragraph.trim(),
          marks: [],
        },
      ],
    }));

    const postData = {
      _type: "post",
      title: validatedData.title,
      slug: {
        _type: "slug",
        current: slug,
      },
      excerpt: blogContent.excerpt,
      body: blockContent,
      ...(sanityImage && { image: sanityImage }),
      ...(defaultAuthor && { author: { _type: "reference", _ref: defaultAuthor._id } }),
      meta_title: blogContent.meta_title,
      meta_description: blogContent.meta_description,
      noindex: false,
      _createdAt: new Date().toISOString(),
      _updatedAt: new Date().toISOString(),
    };

    // ステップ5: Sanityにブログ記事を作成
    console.log("Creating blog post in Sanity...");
    const result = await createSanityPost(postData);

    return NextResponse.json({
      success: true,
      message: "ブログ記事が正常に生成されました！",
      post: result,
      blogContent,
      hasImage: sanityImage !== null,
    });

  } catch (error) {
    console.error("Error in generate-blog-post API:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid request data", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Internal server error", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
} 